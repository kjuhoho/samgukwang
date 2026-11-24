/* 군사 회의: 전투 직전에 작전(태세)·예비대를 정하고, 훈련·상성·지형·계절을 반영해 전투를 치른다. */
(function () {
  var P = SG.Sandbox.prototype, T_ = SG.TACT, ST = T_.ST, GN = T_.GN;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function tot(u) { return u.reduce(function (s, x) { return s + x.n; }, 0); }

  P.tkOf = function (ctx) {
    var bt = ctx.bt || {}, T = ctx.T || {}, pid = bt.place || (ctx.anchor && ctx.anchor.place) || T.place, pl = pid && SG.placeById ? SG.placeById(pid) : null, k = pl ? pl.kind : '';
    if (bt.tk) return bt.tk;
    if (k === 'fortress' || k === 'city' || k === 'capital') return (ctx.def || ctx.T || bt.fort) ? 'fort' : 'plain';
    if (k === 'mountain') return 'hill'; if (k === 'pass') return 'pass'; if (k === 'river') return 'river'; if (k === 'port' || k === 'island') return 'coast';
    var t = bt.terrain || T.terrain || 1; return t >= 1.45 ? 'pass' : t >= 1.25 ? 'hill' : 'plain';
  };
  P.seasonOf = function (anchor) {
    var m = anchor && anchor.m || ''; var x = /(봄|여름|가을|겨울)/.exec(m); if (x) return x[1];
    var n = /(\d+)월/.exec(m); if (n) { n = +n[1]; return n >= 3 && n <= 5 ? '봄' : n >= 6 && n <= 8 ? '여름' : n >= 9 && n <= 11 ? '가을' : '겨울'; }
    return '';
  };
  P.stanceOf = function (tac) {
    if (!tac) return 'balanced'; if (tac.id === 'ambush') return 'ambush'; if (tac.id === 'siege') return 'siege'; if (tac.id === 'front') return 'balanced';
    var s = (tac.label || '') + ' ' + (tac.hint || '');
    if ((tac.ours && tac.ours.ambush) || /매복|기습|야습|급습/.test(s)) return 'ambush';
    if (/화공|불을/.test(s)) return 'fire'; if (/포위|공성/.test(s)) return 'siege';
    if (/농성|수성|성문을 닫|방어선|버티/.test(s)) return 'hold'; if (/돌격|총공격|맹공|정면/.test(s)) return 'charge';
    if (/유인|거짓 퇴각|미끼/.test(s)) return 'feign'; if (/결사|죽음을 각오/.test(s)) return 'forlorn';
    if (/우회|측면|협공|양면|동시/.test(s)) return 'flank'; if (/활|쇠뇌|궁/.test(s)) return 'attrition';
    return 'balanced';
  };
  // 전투 인자 보정(시뮬레이션과 실제 전투가 같은 규칙을 쓴다)
  P.tune = function (ours, en, bo, ctx, sel) {
    var s = this.s, e = (ctx.bt && ctx.bt.enemy) || ctx.T || {}, tk = this.tkOf(ctx), def = !!ctx.def;
    ours.train = s.realm.train; en.train = e.train != null ? e.train : this.foeTrain(en.side);
    if (def) ours.tk = tk; else en.tk = tk;
    bo.defense = def; bo.tk = tk; bo.season = this.seasonOf(ctx.anchor);
    var st = sel ? sel.stance : this.stanceOf(ctx.tac); ours.stance = st; ours.reserve = sel ? sel.reserve : 0;
    if (e.stance) en.stance = e.stance;
    if (st === 'attrition' && !this.hasGrp(ours, 'rng')) ours.stance = 'balanced';
    if (st === 'flank' && !this.hasGrp(ours, 'cav')) ours.stance = 'balanced';
    if ((st === 'feign' || st === 'wedge' || st === 'harass') && !this.hasGrp(ours, 'cav')) ours.stance = 'balanced';
    if (st === 'forlorn' && !this.hasGrp(ours, 'elite')) ours.stance = 'balanced';
    if (st === 'wedge' && (tk === 'fort')) ours.stance = 'balanced';
    if (st === 'siege' && tk !== 'fort') ours.stance = 'balanced';
    // 지휘관: 임명한 장수(없으면 사료 속 지휘관, 그도 없으면 가장 뛰어난 장수)
    var gid = sel && sel.gen != null ? sel.gen : ((ctx.bt && ctx.bt.gen) || this.bestGen());
    if (ours.morale == null) ours.morale = 70;
    if (gid) {
      ours.gen = gid; var cm = this.cmdr(gid), t = cm && cm.trait, sx = ours.stance;
      if (t === 'def' && def) ours.terrain = (ours.terrain || 1) * 1.1;
      if (t === 'amb' && (sx === 'ambush' || sx === 'flank')) ours.morale += 8;
      if (t === 'cav' && (sx === 'charge' || sx === 'flank' || sx === 'wedge' || sx === 'feign' || sx === 'harass')) ours.morale += 6;
      if (t === 'nav' && (tk === 'coast' || tk === 'sea')) ours.morale += 8;
      if (t === 'siege' && !def && tk === 'fort') ours.morale += 7;
      if (t === 'insp') ours.morale += 5;
    } else if (sel) ours.morale += 4; // 국왕 친정
    return bo;
  };
  P.cmdrs = function () { var s = this.s, y = s.year, d = s.dead || {}; return ((SG.data.commanders || {})[this.cfg.id] || []).filter(function (c) { return y >= c.y0 && y <= c.y1 && !d[c.id]; }); };
  P.cmdr = function (id) { var a = (SG.data.commanders || {})[this.cfg.id] || []; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; };
  P.bestGen = function () { var a = this.cmdrs(), b = null; a.forEach(function (c) { if (!b || c.cmd > b.cmd) b = c; }); return b ? b.id : ''; };
  // 나라별 군의 숙련도(게임 추상화): 기본값 + 그 나라 국력
  var NT = { tang: 62, goguryeo: 56, silla: 50, baekje: 50, wa: 42, gaya: 44 };
  P.foeTrain = function (side) {
    var role = this.roleOf ? this.roleOf(side) : null, w = role && this.s.world[role], b = NT[side] || 48;
    return Math.max(25, Math.min(85, Math.round(b + (w ? (w.p - 50) / 5 : 0))));
  };
  P.hasGrp = function (f, g) { var c = T_.comp(f.units); return c[g] && c[g].n > f.units.reduce(function (t, u) { return t + u.n; }, 0) * 0.08; };
  P.stanceOk = function (st, ours, tk) {
    if (st === 'attrition' && !this.hasGrp(ours, 'rng')) return '궁·노병이 부족합니다.';
    if (st === 'flank' && !this.hasGrp(ours, 'cav')) return '기병이 부족합니다.';
    if ((st === 'feign' || st === 'wedge' || st === 'harass') && !this.hasGrp(ours, 'cav')) return '기병이 부족합니다.';
    if (st === 'forlorn' && !this.hasGrp(ours, 'elite')) return T_.T('정예병·결사대가 부족합니다.', 'Not enough elite troops.', '精鋭・決死隊が足りません。');
    if (st === 'wedge' && tk === 'fort') return T_.T('성곽 앞에서는 기병이 돌파할 수 없습니다.', 'Cavalry cannot break through at the walls.', '城郭の前では騎兵は突破できません。');
    if (st === 'siege' && tk !== 'fort') return '공성할 성곽이 아닙니다.';
    if (st === 'flank' && (tk === 'pass' || tk === 'fort')) return '좁은 지형에서는 우회할 공간이 없습니다.';
    return '';
  };
  P.forecastStance = function (ours, en, bo, ctx, sel) {
    var o = clone(ours), e = clone(en), b = clone(bo); this.tune(o, e, b, ctx, sel); var r = SG.battle(o, e, b);
    return { win: r.winner === 'a', ratio: r.aEnd / (r.aStart || 1), pt: r.aEnd / (r.bEnd + 1), r: r };
  };
  P.oddsOf = function (f) { return f.win ? (f.ratio >= 0.6 ? '●●● 유리' : '●●○ 박빙(우세)') : (f.pt > 0.5 ? '●○○ 불리' : '○○○ 매우 불리'); };

  // 군사 회의 창 → 전투 → cb(r)
  P.engage = function (ours, en, bo, ctx, cb) {
    var self = this, g = this.g, s = this.s, tk = this.tkOf(ctx), def = !!ctx.def, wrap = h('div', 'modal council'), card = h('div', 'card');
    var preset = ctx.tac && ctx.tac.special ? null : this.stanceOf(ctx.tac), sel = { stance: preset || 'balanced', reserve: 0 }, cms = this.cmdrs(), TN = SG.data.traitName || {}, TD = SG.data.traitDesc || {};
    sel.gen = (ctx.bt && ctx.bt.gen && SG.generalById(ctx.bt.gen) ? ctx.bt.gen : this.bestGen());
    var gopts = cms.map(function (c) { return '<option value="' + c.id + '"' + (c.id === sel.gen ? ' selected' : '') + '>' + c.name + ' — 통솔 ' + c.cmd + ' · 무용 ' + c.val + ' · ' + TN[c.trait] + '</option>'; }).join('') + '<option value=""' + (sel.gen ? '' : ' selected') + '>국왕 친정 — 통솔 5 · 사기 +4</option>';
    if (self.foeLook) self.foeLook(ours, en, bo, ctx);   // 적 지휘관도 작전을 고른다(foestrat.js)
    var ec = T_.comp(en.units), N = ec.N || 1, i = s.realm.intel, rows = [];
    for (var k in ec) if (k !== 'N') rows.push([k, ec[k].n / N]);
    rows.sort(function (a, b) { return b[1] - a[1]; });
    var recon = i < 10 ? '적 편성을 전혀 알 수 없습니다.' : rows.slice(0, 4).map(function (r) { var p = Math.round(r[1] * 100 / (i >= 50 ? 5 : 10)) * (i >= 50 ? 5 : 10); return GN[r[0]] + ' ' + (i >= 25 ? '약 ' + p + '%' : (p >= 40 ? '많음' : '일부')); }).join(' · ');
    var est = en.estSt || T_.autoStance(en, ours), estTxt = i >= 40 ? '「' + ST[en.stance || est].nm + '」 예상' : i >= 20 ? '(추정) 「' + ST[est].nm + '」 경향' : '알 수 없음';
    var sea = this.seasonOf(ctx.anchor), tkn = T_.TK[tk].nm;
    var fixed = ctx.tac && ctx.tac.special;
    card.innerHTML = '<h2>⚔ 군사 회의 — ' + (ctx.title || '결전') + '</h2><div class="sub">지형 <b>' + tkn + '</b>' + (sea ? ' · 계절 <b>' + sea + '</b>' : '') + ' · 아군 훈련 <b>' + Math.round(s.realm.train) + '</b> · 적 훈련 ' + (i >= 40 ? '<b>' + Math.round(en.train == null ? 48 : en.train) + '</b>' : '?') + '</div>' +
      '<div class="note">🔎 <b>정찰</b> — 적 편성: ' + recon + ' · 적 작전 ' + estTxt + (i < 25 ? ' <small>(첩보가 낮아 부정확)</small>' : '') + '</div>' + (self.foeNote ? self.foeNote(en, i) : '') +
      '<div class="cn-gen">🎖 <b>지휘관</b> <select id="cn-g">' + gopts + '</select> <small id="cn-gn"></small></div>' +
      '<div class="cn-pick"><small>※ 승산은 어림입니다. 실제 전투에는 날씨·우연 같은 <b>전운</b>이 끼어들어 유리해 보여도 질 수 있습니다.</small></div><div class="cn-pick">① 작전을 고르고 ② 아래 <b>교전 시작</b>을 누르세요. 지금 선택: <b id="cn-cur"></b></div><div id="cn-st"></div><div class="cn-foot"><div class="cn-res">예비대 <input type="range" id="cn-r" min="0" max="30" step="10" value="0"> <b id="cn-rv">0%</b> <small>(4합에 투입)</small></div><button class="btn pri" id="cn-go">⚔ 교전 시작</button></div>';
    var box = $1('#cn-st', card), btns = {};
    function refresh() {
      var cm0 = self.cmdr(sel.gen); $1('#cn-gn', card).innerHTML = cm0 ? cm0.note + ' · <b>' + TN[cm0.trait] + '</b>: ' + TD[cm0.trait] : (sel.gen ? '사료 속 이 전투의 지휘관' : '왕이 직접 군을 이끕니다. 패주하면 왕권이 흔들립니다.');
      $1('#cn-cur', card).textContent = ST[sel.stance].nm;
      Object.keys(ST).forEach(function (st) {
        var b = btns[st], bad = self.stanceOk(st, ours, tk); b.disabled = !!bad || false; b.classList.toggle('on', sel.stance === st);
        var f = self.forecastStance(ours, en, bo, ctx, { stance: st, reserve: sel.reserve, gen: sel.gen });
        b.querySelector('small').innerHTML = ST[st].d + (bad ? ' <i>(' + bad + ')</i>' : ' <b>· 승산 ' + self.oddsOf(f) + '</b>');
      });
    }
    Object.keys(ST).forEach(function (st) {
      if (fixed && st !== 'balanced') return;
      var b = h('button', 'ch', ST[st].nm + '<small></small>'); b.onclick = function () { sel.stance = st; refresh(); }; btns[st] = b; box.appendChild(b);
    });
    if (fixed) { sel.stance = 'balanced'; }
    $1('#cn-g', card).onchange = function () { sel.gen = this.value; refresh(); };
    $1('#cn-r', card).oninput = function () { sel.reserve = this.value / 100; $1('#cn-rv', card).textContent = this.value + '%'; refresh(); };
    $1('#cn-go', card).onclick = function () {
      var st = sel.stance; if (self.stanceOk(st, ours, tk)) st = 'balanced'; sel.stance = st;
      wrap.remove(); self.tune(ours, en, bo, ctx, sel);
      var HD = SG.HARD; if (HD) { bo.luckA = HD.luckA[0] + Math.random() * HD.luckA[1]; bo.luckB = HD.luckB[0] + Math.random() * HD.luckB[1]; } // 전운: 예측에는 없는 변수
      var r = SG.battle(ours, en, bo);
      if (HD) { var lk = bo.luckA / bo.luckB; r.factors.push('<b>전운</b> ' + (lk > 1.06 ? '하늘이 도왔습니다. 날씨와 우연이 아군 편이었습니다.' : lk < 0.9 ? '운이 따르지 않았습니다. 돌발 상황이 겹쳐 예상보다 고전했습니다.' : '특별한 변수는 없었습니다.') + ' <small>(승산 예측에는 반영되지 않는 변수)</small>'); }
      // 실전 경험: 싸운 군대는 숙련된다(이기면 더)
      var gain = r.winner === 'a' ? 2 : 1; s.realm.train = Math.min(999, s.realm.train + gain);
      var cmx = self.cmdr(sel.gen), gname = cmx ? cmx.name : sel.gen ? (SG.generalById(sel.gen) || {}).name : '국왕';
      r.factors.unshift('<b>지휘</b> 아군 ' + gname + (cmx ? ' (통솔 ' + cmx.cmd + ' · 특기 ' + TN[cmx.trait] + ')' : sel.gen ? '' : ' 친정 (사기 +4)'));
      if (r.winner === 'b' && r.routed === 'a') {
        if (cmx && Math.random() < 0.15) { s.dead = s.dead || {}; s.dead[cmx.id] = s.year; r.factors.push('<b>전사</b> ' + cmx.name + '이(가) 패주하는 군을 수습하다 전사했습니다. 이후 임명할 수 없습니다.'); self.log(cmx.name + ' 전사'); }
        else if (!sel.gen) { s.realm.royal = Math.max(0, s.realm.royal - 4); r.factors.push('<b>친정 실패</b> 왕이 이끈 군이 패주해 왕권이 4 떨어졌습니다.'); }
      }
      r.factors.push('<b>실전 경험</b> 전투를 치른 군의 훈련도가 +' + gain + ' 올랐습니다.');
      cb(r);
    };
    refresh(); wrap.appendChild(card); g.root.appendChild(wrap);
  };
  function $1(s, r) { return (r || document).querySelector(s); }
})();
