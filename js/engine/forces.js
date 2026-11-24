/* 나라별 총병력과 소규모 전투 (게임 추상화 모델 — 사료 수치가 아니다)
 *  ① 총병력: 나라의 국력·농업·민심이 정한 상한(병력 풀)이 있고, 징병과 해마다의 성장으로 천천히 늘며, 전쟁에서 줄어든다.
 *     당도 무제한이 아니다 — 여러 전선과 먼 보급선 때문에 한반도로 보낼 수 있는 몫은 총병력의 일부뿐이다.
 *  ② 동원 한도: 어느 나라든 전쟁에는 총병력의 일부(당 약 11%, 그 밖 약 20%)만 보낸다.
 *  ③ 소규모 전투: 국경 전초전 — 기병·궁병·보병 소부대를 보내 작은 교전을 치른다.
 * T()는 반드시 파일을 읽을 때(함수 밖에서) 부른다. */
(function () {
  var P = SG.Sandbox.prototype;
  var TR = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
  function T(k, e, j) { TR.en[k] = e; TR.ja[k] = j; var I = SG.i18n; if (I && I.dict && I.dict.en) { I.dict.en[k] = e; I.dict.ja[k] = j; } return k; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function $(s, r) { return (r || document).querySelector(s); }
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function short(pl) { return pl.name.replace(/\(.*?\)/g, '').trim(); }
  var CAPB = { tang: 260000, goguryeo: 170000, silla: 80000, baekje: 85000, wa: 45000, gaya: 20000 };   // 나라별 병력 풀의 기준(동원 가능한 전체 인원)

  var M = {
    mil: T('총병력', 'Total troops', '総兵力'),
    cS: T('국경 소규모 전투', 'Border Skirmish', '国境の小競り合い'), cSd: T('작은 부대를 국경으로 보내 적 전초·순찰대와 싸웁니다. 큰 전쟁 없이 병과 숙련과 군의 사기를 올릴 수 있습니다.', 'Send a small detachment to fight enemy outposts and patrols. Raises branch mastery and morale without a full war.', '小部隊を国境へ送り、敵の前哨や巡察隊と戦います。大戦なしで兵科の熟練と士気を高められます。'),
    cSl: T('작은 부대가 국경으로 떠났습니다.', 'A small detachment marched for the border.', '小部隊が国境へ出発しました。'),
    title: T('국경 전초전', 'Border skirmish', '国境の前哨戦'),
    sub: T('보낼 상대와 병과, 부대 규모를 정하세요. 소규모라 큰 피해는 없지만 패하면 사기가 꺾입니다.', 'Choose the foe, the branch and the size of the detachment. Losses stay small, but a defeat hurts morale.', '相手・兵科・部隊の規模を選んでください。小規模で被害は小さいが、敗れれば士気が下がります。'),
    foe: T('상대', 'Foe', '相手'), br: T('병과', 'Branch', '兵科'), sz: T('부대 규모', 'Detachment size', '部隊規模'), go: T('출격', 'Sally forth', '出撃'), no: T('취소', 'Cancel', '取消'),
    t_mix: T('혼성', 'Mixed', '混成'), t_cav: T('기병 척후', 'Cavalry scouts', '騎兵斥候'), t_rng: T('궁·노병 매복', 'Archer ambush', '弓弩の伏兵'), t_line: T('보병 소탕', 'Infantry sweep', '歩兵の掃討'),
    noF: T('국경을 맞댄 적이 없습니다.', 'No foe shares a border with us.', '国境を接する敵がいません。'), noU: T('해당 병과가 없습니다.', 'No troops of that branch.', 'その兵科の兵がいません。'),
    men: T('명', 'troops', '名'),
    win: T(' 순찰대를 격파했습니다. 전리품과 사기를 얻었습니다.', ' patrol was beaten. Spoils and morale gained.', ' の巡察隊を撃破しました。戦利品と士気を得ました。'),
    lose: T(' 전초에서 밀려 물러났습니다. 사기가 꺾였습니다.', ' outpost drove us back. Morale fell.', ' の前哨に押し返されました。士気が下がりました。'),
    dom: T('총병력', 'Total troops', '総兵力'), unit: T('천', 'k', '千')
  };

  /* ① 총병력 */
  P.milCap = function (side) {
    var n = this.nat(side), role = this.roleOf(side), w = role && this.s.world[role], pw = this.sidePower(side);
    var f = side === 'tang' ? 0.85 + (w ? w.commit : 30) / 400 : clamp(0.5 + pw / 100, 0.5, 1.35);
    return Math.round((CAPB[side] || 30000) * f * (0.8 + n.econ / 250) / 1000) * 1000;
  };
  P.milOf = function (side) { var n = this.nat(side); if (n.mil == null) n.mil = Math.round(this.milCap(side) * 0.72 / 1000) * 1000; return n.mil; };
  P.milFactor = function (side) { return clamp(this.milOf(side) / (this.milCap(side) * 0.72), 0.55, 1.15); };
  P.deployMax = function (side) { return Math.round(this.milOf(side) * (side === 'tang' ? 0.11 : 0.2) / 500) * 500; };   // 한 번에 전장에 보낼 수 있는 몫
  P.milHit = function (side, n) { var m = this.nat(side); m.mil = Math.max(this.milCap(side) * 0.12, this.milOf(side) - Math.max(0, n)); };
  SG.milOf = function (sb, side) { return sb.milOf(side); };
  var _nt = P.natTurn;
  P.natTurn = function (side) {
    var r = _nt.apply(this, arguments), n = this.nat(side), cap = this.milCap(side), m = this.milOf(side);
    var grow = m * (side === 'tang' ? 0.011 : 0.018) * clamp(n.people / 60, 0.4, 1.3) + (r.done.indexOf('recruit') >= 0 ? cap * 0.018 : 0);
    m += grow; if (m > cap) m -= (m - cap) * 0.5; if (n.people < 30) m *= 0.98;
    n.mil = Math.round(m / 100) * 100; return r;
  };
  var _dt = P.dynTarget;
  P.dynTarget = function (pl, ow) { var t = _dt.apply(this, arguments); t.garrison = Math.round(t.garrison * clamp(Math.sqrt(this.milFactor(ow)), 0.82, 1.15) / 500) * 500; return t; };
  var _cp = P.capturePlace;
  P.capturePlace = function (Tg) { try { if (Tg && Tg.side) this.milHit(Tg.side, this.milOf(Tg.side) * 0.04); } catch (e) { } return _cp.apply(this, arguments); };
  var _af = P.afterFight;
  P.afterFight = function (bt, kind) {
    try { var e = bt && bt.enemy; if (e && e.side && e.total) this.milHit(e.side, e.total * ((kind === 'win' || kind === 'costly') ? 0.15 : 0.04)); } catch (x) { }
    return _af.apply(this, arguments);
  };
  // 이웃 나라 화면: 총병력(첩보력만큼 보인다)
  var _dh = P.dipHtml;
  P.dipHtml = function () {
    var html = _dh.apply(this, arguments), self = this, s = this.s, intel = s.realm.intel, out = '';
    this.natSides().forEach(function (side) {
      var m = self.milOf(side), cap = self.milCap(side), r = self.roleOf(side), nm = r ? self.names[r].replace('(멸망)', '') : ((SG.sideName && SG.sideName[side]) || side);
      out += '<div class="dp"><b>' + nm + '</b><span><i>' + M.mil + '</i> ' + (intel >= 50 ? Math.round(m / 1000) + M.unit : intel >= 20 ? (m < cap * 0.55 ? T('적음', 'Thin', '少ない') : m < cap * 0.85 ? T('보통', 'Average', '普通') : T('풍부', 'Ample', '豊富')) : T('불명', 'Unknown', '不明')) + '</span></div>';
    });
    return html + (out ? '<div class="dips aid" title="' + M.mil + '">' + out + '</div>' : '');
  };

  /* ③ 소규모 전투 */
  var BASEG = { cav_light: 'cav', cav_heavy: 'cav', archer: 'rng', crossbow: 'rng', inf_levy: 'line', inf_line: 'line', inf_elite: 'line', guard: 'line' };
  function groupUnits(sb, type) {
    return sb.fieldUnits(1).filter(function (u) { var U = SG.unitById(u.id); return U && (type === 'mix' || BASEG[U.base] === type); });
  }
  function foes(sb) {
    var s = sb.s, mine = sb.myPlaces(), out = [];
    sb.aliveRoles().forEach(function (r) {
      var side = sb.sides[r]; if (!side || side === sb.side || (s.destroyed && s.destroyed[side])) return;
      var best = 9, near = null; sb.places().forEach(function (p) { if (sb.ownerOf(p) !== side) return; mine.forEach(function (q) { var d = dist(p, q); if (d < best) { best = d; near = p; } }); });
      if (near && best < 1.6) out.push({ r: r, side: side, d: best, pl: near });
    });
    return out.sort(function (a, b) { return a.d - b.d; });
  }
  SG.data.commands = (SG.data.commands || []).concat([
    { id: 'skirmish', cat: '군사', name: M.cS, desc: M.cSd, cost: { food: 2 }, hist: '가상', eff: {}, lines: [M.cSl], req: function (ctx) { return foes(ctx.sb).length > 0 && ctx.sb.fieldTotal() >= 1500; } }
  ]);
  var _run = P.run;
  P.run = function (c, opt) { if (c && c.id === 'skirmish' && !(opt && opt.skirm)) { var why = this.cmdAvail(c); if (why) { this.s.last = '지금은 할 수 없습니다 — ' + why; return this.renderTurn(); } return this.skirmUI(c); } return _run.apply(this, arguments); };
  P.skirmUI = function (c) {
    var self = this, s = this.s, fs = foes(this); if (!fs.length) { s.last = M.noF; return this.renderTurn(); }
    var sel = { f: fs[0], type: 'mix', pct: 40 }, wrap = h('div', 'modal'), card = h('div', 'card');
    card.innerHTML = '<h2><span>⚔</span> <b>' + M.title + '</b></h2><p>' + M.sub + '</p><div><b>' + M.foe + '</b></div><div id="sk-f" class="choices"></div><div><b>' + M.br + '</b></div><div id="sk-t" class="choices"></div>' +
      '<div class="row" style="grid-template-columns:90px 1fr 120px"><div><b>' + M.sz + '</b></div><input type="range" id="sk-r" min="20" max="80" step="10" value="40"><div class="v" id="sk-v"></div></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px"><button class="btn" id="sk-x">' + M.no + '</button><button class="btn pri" id="sk-go">' + M.go + '</button></div>';
    var fb = $('#sk-f', card), tb = $('#sk-t', card), fbn = [], tbn = {};
    function nmOf(x) { return self.names[x.r].replace('(멸망)', ''); }
    function size() { var u = groupUnits(self, sel.type), n = u.reduce(function (t, x) { return t + x.n; }, 0); return Math.min(Math.round(n * sel.pct / 100), 6000); }
    function refresh() {
      fbn.forEach(function (b, i) { b.classList.toggle('on', fs[i] === sel.f); });
      ['mix', 'cav', 'rng', 'line'].forEach(function (k) { tbn[k].classList.toggle('on', sel.type === k); tbn[k].disabled = !groupUnits(self, k).length; });
      $('#sk-v', card).innerHTML = '<b>' + size().toLocaleString() + '</b> <u>' + M.men + '</u>'; $('#sk-go', card).disabled = size() < 300;
    }
    fs.forEach(function (x) { var b = h('button', 'ch', '<b>' + nmOf(x) + '</b><small><u>' + short(x.pl) + '</u></small>'); b.onclick = function () { sel.f = x; refresh(); }; fb.appendChild(b); fbn.push(b); });
    [['mix', M.t_mix], ['cav', M.t_cav], ['rng', M.t_rng], ['line', M.t_line]].forEach(function (k) { var b = h('button', 'ch', k[1]); b.onclick = function () { sel.type = k[0]; refresh(); }; tb.appendChild(b); tbn[k[0]] = b; });
    $('#sk-r', card).oninput = function () { sel.pct = +this.value; refresh(); };
    $('#sk-x', card).onclick = function () { wrap.remove(); self.renderTurn(); };
    $('#sk-go', card).onclick = function () { wrap.remove(); self.skirmFight(c, sel); };
    wrap.appendChild(card); this.g.root.appendChild(wrap); refresh();
  };
  P.skirmFight = function (c, sel) {
    var self = this, s = this.s, g = this.g, f = sel.f, side = f.side, nmF = '<b>' + this.names[f.r].replace('(멸망)', '') + '</b>';
    this.pay(c.cost); s.ap -= (c.ap || 1); g.state.dec++; s.stats.cat[c.cat] = (s.stats.cat[c.cat] || 0) + 1;
    var gu = groupUnits(this, sel.type), tot0 = gu.reduce(function (t, x) { return t + x.n; }, 0), ratio = Math.min(1, 6000 / Math.max(1, tot0)) * sel.pct / 100;
    var units = gu.map(function (u) { return { id: u.id, n: Math.round(u.n * ratio) }; }).filter(function (u) { return u.n > 0; }), mine = units.reduce(function (t, x) { return t + x.n; }, 0);
    var resF = SG.resOf ? SG.resOf(this, side) : 40, patrol = Math.round(clamp(mine * (0.55 + Math.random() * 0.55) * (0.75 + resF / 250), 500, 9000) / 100) * 100;
    var rr = Math.random(), tk = rr < 0.45 ? 'plain' : rr < 0.7 ? 'hill' : rr < 0.85 ? 'river' : 'pass';
    var ours = { name: this.cfg.armyName || (this.cfg.country || '아군'), side: this.side, units: units, gen: this.cfg.gen, morale: this.myMorale(), terrain: 1 };
    var en = { name: nmF.replace(/<[^>]+>/g, '') + ' ' + short(f.pl), side: side, units: this.enemyUnits(side, patrol, SG.mixFor ? SG.mixFor(this, side, 'patrol') : null), terrain: tk === 'pass' ? 1.3 : tk === 'hill' ? 1.2 : 1, morale: 66 };
    var Tg = { id: 'skirm_' + f.pl.id, name: M.title, short: M.title, place: f.pl.id, side: side, garrison: patrol, terrain: en.terrain, skirm: 1 };
    s.stats.wars++;
    this.engage(ours, en, { rounds: 5, pace: 1.1 }, { T: Tg, bt: { tk: tk }, tac: null, def: false, title: M.title }, function (r) {
      g.battleUI(r, M.title, '', function () {
        self.casual(ours.units, r.aLeft);
        var win = r.winner === 'a' && r.aEnd / r.aStart >= 0.35, role = f.r, chips, line;
        if (win) {
          var e = { fx: { gold: 3 + Math.round(patrol / 700), morale: 3 }, world: {}, rel: {} };
          if (role === 'tang') { e.world['tang.commit'] = 3; e.rel.tang = -4; } else { e.world[role + '.hostility'] = 2; e.rel[role] = -2; }
          chips = self.eff(e); self.milHit(side, patrol * 0.5); line = nmF + M.win;
        } else { chips = self.eff({ fx: { morale: -4 }, world: role === 'tang' ? { 'tang.commit': 1 } : (function () { var o = {}; o[role + '.hostility'] = 1; return o; })() }); line = nmF + M.lose; }
        s.last = '<b>' + M.title + '</b> — ' + line + chips; self.log('국경 전초전: ' + (win ? '승' : '패')); self.after();
      });
    });
  };
  SG.FORCES = M;

  /* 후반의 여유 자원으로 병력을 사들인다: 금·군량을 내고 한 번에 큰 병력을 모은다(산업이 높을수록 많이 모인다) */
  (function () {
    var TRm = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
    function T2(k, e, j) { TRm.en[k] = e; TRm.ja[k] = j; var I = SG.i18n; if (I && I.dict && I.dict.en) { I.dict.en[k] = e; I.dict.ja[k] = j; } return k; }
    function amt(ctx, base) { var ec = (ctx.realm && ctx.realm.econ) || 50; return Math.round(base * (1 + Math.max(0, ec - 50) / 100) / 100) * 100; }
    function buy(id, nm, ds, cost, unit, base, extra, ln) {
      return { id: id, cat: '군사', name: T2(nm[0], nm[1], nm[2]), desc: T2(ds[0], ds[1], ds[2]), cost: cost, hist: '가상', eff: {}, lines: [T2(ln[0], ln[1], ln[2])],
        fn: function (g, ctx) { var o = { army: {} }; o.army[unit] = amt(ctx, base); o.fx = { food: -Math.round((g.sb ? g.sb.armyTotal() : 0) / 1000 * 0.8) };   // 군세가 클수록 새 병력을 먹이고 입히는 군량이 더 든다
         if (extra) for (var k in extra) { if (k === 'fx') { for (var q in extra.fx) o.fx[q] = (o.fx[q] || 0) + extra.fx[q]; } else o[k] = extra[k]; } return o; } };
    }
    SG.data.commands = (SG.data.commands || []).concat([
      buy('buy_inf', ['보병 대모집', 'Mass Infantry Levy', '歩兵の大募集'], ['금과 군량을 풀어 방군 보병을 한꺼번에 모읍니다. (약 4천 · 산업이 높을수록 더 많이)', 'Spend gold and grain to raise a large infantry force at once (about 4,000; more with higher industry).', '金と軍糧を投じて方軍歩兵を一度に集めます。(約4千・産業が高いほど増える)'], { gold: 25, food: 60 }, 'baekje_bangun', 4000, { fx: { people: -2 } }, ['관청마다 모병소가 열려 보병이 줄지어 입대했습니다.', 'Recruiting offices opened in every district and infantry enlisted in droves.', '各官庁に募兵所が開かれ、歩兵が列をなして入隊しました。']),
      buy('buy_cav', ['기병 대량 구입', 'Mass Cavalry Purchase', '騎兵の大量購入'], ['말과 기수를 대량으로 사들입니다. (약 1.5천 · 산업이 높을수록 더 많이)', 'Buy horses and riders in bulk (about 1,500; more with higher industry).', '馬と騎手を大量に買い入れます。(約1.5千・産業が高いほど増える)'], { gold: 30, food: 50 }, 'baekje_horse', 1500, null, ['목장과 변경 상인들이 말을 끌고 모여들었습니다.', 'Ranchers and frontier traders drove in their horses.', '牧場と辺境の商人たちが馬を引いて集まりました。']),
      buy('buy_arch', ['궁노병 대모집', 'Mass Archer Levy', '弓弩兵の大募集'], ['활과 쇠뇌를 갖춘 궁수를 대규모로 모집합니다. (약 2.5천 · 산업이 높을수록 더 많이)', 'Recruit archers and crossbowmen in large numbers (about 2,500; more with higher industry).', '弓と弩を備えた射手を大規模に募集します。(約2.5千・産業が高いほど増える)'], { gold: 22, food: 50 }, 'baekje_archer', 2500, null, ['공방마다 활과 쇠뇌가 쌓이고 궁수들이 훈련장을 메웠습니다.', 'Bows and crossbows piled up in the workshops and archers filled the drill grounds.', '工房ごとに弓と弩が積み上がり、射手たちが訓練場を埋めました。']),
      buy('buy_elite', ['정예병 대량 선발', 'Mass Elite Selection', '精鋭兵の大量選抜'], ['후한 녹봉으로 정예를 선발합니다. 훈련도도 오릅니다. (약 1.2천 · 산업이 높을수록 더 많이)', 'Pick elite troops with generous stipends; training also rises (about 1,200; more with higher industry).', '手厚い俸禄で精鋭を選抜します。訓練度も上がります。(約1.2千・産業が高いほど増える)'], { gold: 35, food: 60 }, 'baekje_gyebaek', 1200, { realm: { train: 4 } }, ['후한 녹봉에 이름난 용사들이 앞다투어 모여들었습니다.', 'Famed warriors flocked in, drawn by the generous stipends.', '手厚い俸禄に名のある勇士たちが競って集まりました。'])
    ]);
  })();
})();
