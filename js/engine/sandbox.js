/* 정무 턴(샌드박스) 엔진 — 해마다 정무 행동력 3점으로 명령을 내리고, 세계가 움직이고, 랜덤 사건이 일어난다.
 * 내장 AI(규칙·확률 기반, 외부 서버 없음): 라이벌 국가 시뮬, 참모 해석(advisor.js), 상황 서술, 결말 조합.
 * 데이터에서는 역할 키를 쓴다: silla=주적(라이벌) goguryeo=우방 tang=대국 wa=먼 이웃. 이름은 시나리오가 정한다.
 * 병종 키는 baekje_xxx 형식(역할)으로 쓰고, 플레이어 세력의 실제 병종 id로 바꿔 적용한다. */
window.SG = window.SG || {}; SG.data = SG.data || {}; SG.scenarios = SG.scenarios || {};
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  var SIDE_ROLES = {
    baekje: { levy: 'baekje_levy', line: 'baekje_bangun', elite: 'baekje_gyebaek', horse: 'baekje_horse', archer: 'baekje_archer', guard: 'baekje_guard', garrison: 'baekje_garrison', navy: 'baekje_navy', scout: 'baekje_scout', siege: 'baekje_archer' },
    silla: { levy: 'silla_levy', line: 'silla_jeong', elite: 'silla_seodang', horse: 'silla_horse', archer: 'silla_crossbow', guard: 'silla_guard', garrison: 'silla_garrison', navy: 'silla_navy', scout: 'silla_scout', siege: 'silla_crossbow', hwarang: 'silla_hwarang' },
    goguryeo: { levy: 'goguryeo_levy', line: 'goguryeo_infantry', elite: 'goguryeo_gaemamusa', horse: 'goguryeo_malgal', archer: 'goguryeo_archer', guard: 'goguryeo_guard', garrison: 'goguryeo_garrison', navy: 'goguryeo_navy', scout: 'goguryeo_scout', siege: 'goguryeo_siege' },
    tang: { levy: 'tang_bubyeong', line: 'tang_bubyeong', elite: 'tang_elite', horse: 'tang_cavalry', archer: 'tang_archer', guard: 'tang_guard', garrison: 'tang_bubyeong', navy: 'tang_navy', scout: 'tang_archer', siege: 'tang_siege', crossbow: 'tang_crossbow' },
    wa: { levy: 'wa_levy', line: 'wa_line', elite: 'wa_line', horse: 'wa_line', archer: 'wa_archer', guard: 'wa_line', garrison: 'wa_garrison', navy: 'wa_navy', scout: 'wa_archer', siege: 'wa_archer' }
  };
  var ROLE_OF = { baekje_levy: 'levy', baekje_bangun: 'line', baekje_gyebaek: 'elite', baekje_horse: 'horse', baekje_archer: 'archer', baekje_guard: 'guard', baekje_garrison: 'garrison', baekje_navy: 'navy', baekje_scout: 'scout', baekje_siege: 'siege' };
  var REALM_N = { royal: '왕권', train: '훈련', defense: '방비', navy: '수군력', econ: '산업', intel: '첩보', b_line: '보병 숙련', b_elite: '정예 숙련', b_cav: '기병 숙련', b_rng: '궁노 숙련', b_siege: '공성 숙련' };
  var RES_N = { troops: '병력', food: '군량', gold: '금', people: '민심', morale: '사기' };
  var NONFIELD = { garrison: 1, navy_war: 1, navy_transport: 1, scout: 1, guard: 1 };
  SG.sideRoles = SIDE_ROLES;

  function Sandbox(g, cfg) { this.g = g; this.cfg = Object.assign({}, cfg); this.handlers = {}; }
  var P = Sandbox.prototype;

  /* ── 초기화 ── */
  P.init = function () {
    var g = this.g, cfg = this.cfg, st = g.state;
    this.side = cfg.side;
    this.units = SIDE_ROLES[cfg.side];
    this.names = Object.assign({ silla: '신라', goguryeo: '고구려', tang: '당', wa: '왜' }, cfg.names || {});
    this.sides = Object.assign({ silla: 'silla', goguryeo: 'goguryeo', tang: 'tang', wa: 'wa' }, cfg.sides || {});
    st.sb = this.s = {
      year: cfg.start, ap: 3, realm: Object.assign({ royal: 50, train: 45, defense: 45, navy: 20, econ: 45, intel: 30 }, cfg.realm || {}),
      world: clone(cfg.world || {}), rel: Object.assign({ silla: 30, goguryeo: 50, tang: 50, wa: 50 }, cfg.rel || {}),
      laws: {}, cd: {}, captured: {}, lost: 0, log: [], shown: {}, used: {}, last: '', tab: '내정',
      stats: { cat: {}, wars: 0, won: 0, lost: 0, events: 0, free: 0, defended: 0, invaded: 0 }
    };
    ['silla', 'goguryeo', 'tang', 'wa'].forEach(function (k) { var w = this.s.world[k] = Object.assign({ p: 50, hostility: 30, commit: 0 }, this.s.world[k] || {}); }, this);
    this.reg();
    this.handlers.__turn__ = this.turn; this.handlers.__yearend__ = this.yearEnd; this.handlers.__finale__ = this.finale;
  };
  function josa(name, p) { // 받침에 맞춰 조사 선택
    var ch = name.charCodeAt(name.length - 1), jong = ch >= 0xAC00 && ch <= 0xD7A3 ? (ch - 0xAC00) % 28 : 0;
    var pair = { '은': ['은', '는'], '는': ['은', '는'], '이': ['이', '가'], '가': ['이', '가'], '을': ['을', '를'], '를': ['을', '를'], '과': ['과', '와'], '와': ['과', '와'] }[p];
    if (pair) return jong ? pair[0] : pair[1];
    if (p === '으로' || p === '로') return jong && jong !== 8 ? '으로' : '로';
    return p;
  }
  P.L = function (t) {
    if (t == null) return t; var self = this, n = this.names, map = { rival: n.silla, ally: n.goguryeo, great: n.tang, far: n.wa, cap: this.cfg.cap || '도성', me: this.cfg.country || '우리' };
    return String(t).replace(/\{(rival|ally|great|far|cap|me)\}(으로|은|는|이|가|을|를|과|와|로)?/g, function (m, k, p) { return map[k] + (p ? josa(map[k], p) : ''); });
  };
  P.isHist = function (c) { return this.cfg.id === 'uija' ? c.hist === '역사' : (this.cfg.histCmds || []).indexOf(c.id) >= 0; };
  // 두 역할(예: 동맹↔적)의 이름·세력·세계값·관계를 맞바꾼다. 나제동맹 파탄 같은 국면 전환용
  P.swapRoles = function (a, b) {
    var n = this.names, sd = this.sides, w = this.s.world, r = this.s.rel, t;
    t = n[a]; n[a] = n[b]; n[b] = t; t = sd[a]; sd[a] = sd[b]; sd[b] = t; t = w[a]; w[a] = w[b]; w[b] = t; t = r[a]; r[a] = r[b]; r[b] = t;
  };
  P.setTargets = function (list) { this.cfg.targets = list; };
  P.uid = function (k) { var r = ROLE_OF[k]; return r ? (this.units[r] || k) : k; };
  P.ctx = function () {
    var s = this.s, g = this.g;
    return { date: { year: s.year }, t: s.year - this.cfg.start, year: s.year, realm: s.realm, laws: s.laws, world: s.world, rel: s.rel, flags: g.state.flags, res: g.state.res, captured: s.captured, roll: Math.random, sb: this };
  };
  P.armyTotal = function () { var A = this.g.state.army; return Object.keys(A).reduce(function (t, k) { return t + A[k]; }, 0); };
  P.fieldTotal = function () { var A = this.g.state.army, t = 0; for (var k in A) { var U = SG.unitById(k); if (U && !NONFIELD[U.base]) t += A[k]; } return t; };
  P.log = function (t) { this.s.log.push(this.s.year + '년 · ' + t); if (this.s.log.length > 60) this.s.log.shift(); };

  /* ── 효과 적용 (자원·국정·외교·세계·병력·플래그) → 칩 HTML ── */
  P.eff = function (e, tgt) {
    if (!e) return ''; var g = this.g, s = this.s, chips = [];
    function chip(l, v) { v = Math.round(v); if (v) chips.push('<span class="' + (v > 0 ? 'p' : 'm') + '">' + l + ' ' + (v > 0 ? '+' : '') + v + '</span>'); }
    if (e.fx) { var d = g.apply(e.fx); for (var k in d) chip(RES_N[k], d[k]); }
    if (e.realm) for (var r in e.realm) { var b = s.realm[r] || 0; s.realm[r] = clamp(b + e.realm[r], 0, 999); chip(REALM_N[r] || r, s.realm[r] - b); }
    if (e.rel) for (var q in e.rel) { var key = q === '__t' ? tgt : q; if (!key || s.rel[key] == null) continue; var b2 = s.rel[key]; s.rel[key] = clamp(b2 + e.rel[q], 0, 100); chip(this.names[key] + ' 관계', s.rel[key] - b2); }
    if (e.world) for (var w in e.world) { var pp = w.split('.'); var o = s.world[pp[0]]; if (!o) continue; var b3 = o[pp[1]] || 0; o[pp[1]] = clamp(b3 + e.world[w], 0, 100); chip(this.names[pp[0]] + ' ' + ({ p: '국력', hostility: '적의', commit: '개입' }[pp[1]] || pp[1]), o[pp[1]] - b3); }
    if (e.army) { for (var u in e.army) { var id = this.uid(u); if (!SG.unitById(id)) continue; var before = g.state.army[id] || 0; g.state.army[id] = Math.max(0, before + e.army[u]); var U = SG.unitById(id); chip((U ? U.name : id) + '(명)', g.state.army[id] - before); } g.renderArmy(); g.hud(); }
    if (e.flags) g.setFlags(e.flags);
    return chips.length ? '<div class="eff">' + chips.join('') + '</div>' : '';
  };
  P.canPay = function (cost) { var r = this.g.state.res; for (var k in (cost || {})) if (r[k] < cost[k]) return false; return true; };
  P.pay = function (cost) { var f = {}; for (var k in (cost || {})) f[k] = -cost[k]; if (Object.keys(f).length) this.g.apply(f); };

  /* ── 장면 등록: 타임라인 앵커 ── */
  P.reg = function () {
    var self = this, cfg = this.cfg, sc = this.g.scenario.scenes; this.anchors = [];
    (cfg.timeline || []).forEach(function (a, i) {
      var id = a.scene || ('a' + i + '_' + a.y);
      if (!a.scene) sc[id] = self.mkScene(a, id);
      self.anchors.push({ y: a.y, id: id, a: a });
    });
    this.anchors.sort(function (x, y) { return x.y - y.y; });
  };
  P.fxOf = function (c) { // 선택지의 정무 효과(국정·외교·세계·병력)를 g.pick 이후에 적용
    var self = this, e = { realm: c.realm, rel: c.rel, world: c.world, army: c.army };
    var has = e.realm || e.rel || e.world || e.army;
    return has ? function () { return self.eff(e); } : null;
  };
  P.mkChoice = function (c, tag, next) {
    var self = this, o = { tag: tag, label: this.L(c.label), hint: this.L(c.hint), fx: c.fx, flags: c.flags, result: this.L(c.result), next: next || '__turn__', place: c.place };
    var run = this.fxOf(c);
    if (run || c.fn) o.run = function (g) { var out = run ? run() : ''; if (c.fn) out += c.fn(g, self.ctx()) || ''; return out; };
    return o;
  };
  P.mkScene = function (a, id) {
    var self = this, pl = a.place && SG.placeById(a.place);
    var nxt = a.last ? '__finale__' : '__turn__';
    var sc = { era: this.L(a.era || (a.y + '년' + (a.m ? ' ' + a.m : ''))), title: this.L(a.title), note: this.L(a.note), src: a.src, text: (a.text || []).map(function (t) { return self.L(t); }) };
    if (pl) { sc.place = a.place; sc.anchor = a; sc.setup = function (g) { self.situation(a); }; }
    if (a.battle) {
      var bt = a.battle; bt.last = a.last;
      sc.choices = function () { return self.withAbandon(bt).map(function (t) { var o = ''; if (self.simFight && !t.special) { try { o = ' · 승산 ' + self.odds(self.simFight(bt, t, a)); } catch (e) { } } return { label: self.L(t.label), hint: self.L(t.hint) + o, tag: t.tag, place: t.place, run: function (g) { self.fight(bt, t, a); }, next: '__none__' }; }); };
      var bt0 = sc.text; sc.text = function () { var r = bt0.slice(); try { var f = self.simFight(bt, bt.tactics[0], a); r.push('<div class="note">' + self.forceLine(f.myN, f.foeN) + '</div>'); } catch (e) { } return r; };
    } else {
      var ch = [];
      if (a.hist) ch.push(this.mkChoice(a.hist, '역사', nxt));
      (a.alts || []).forEach(function (c) { ch.push(self.mkChoice(c, null, nxt)); });
      if (!ch.length) ch.push({ label: '계속', tag: '▶', next: nxt });
      sc.choices = ch;
    }
    return sc;
  };

  /* ── 해의 시작: 앵커 → 정무 화면 ── */
  P.turn = function () {
    var s = this.s, cfg = this.cfg, g = this.g;
    if (g.state.res.people <= 0 || s.realm.royal <= 0) return this.collapse();
    if (s.year > cfg.end) return this.finale();
    for (var i = 0; i < this.anchors.length; i++) {
      var A = this.anchors[i];
      if (A.y === s.year && !s.shown[A.id]) { s.shown[A.id] = 1; if (cfg.terr) g.map.setTerritory(cfg.terr); return g.go(A.id); }
    }
    if (s.year === cfg.end && cfg.finaleHandler && !s.shown.__fin) { s.shown.__fin = 1; return cfg.finaleHandler(g, this); }
    this.renderTurn();
  };

  /* ── 정무 화면 ── */
  function bar(label, v) { return '<div class="rb"><i>' + label + '</i><span><u style="width:' + clamp(v, 0, 100) + '%"></u></span><b>' + Math.round(v) + '</b></div>'; }
  P.vague = function (v, lo, hi, a, b, c) { return v < lo ? a : v < hi ? b : c; };
  P.dipHtml = function () {
    var s = this.s, ex = s.realm.intel >= 50, self = this, out = '';
    ['silla', 'goguryeo', 'tang', 'wa'].forEach(function (k) {
      var w = s.world[k], rel = s.rel[k];
      var thr = k === 'tang' ? w.commit : w.hostility;
      var tone = k === 'tang' ? self.vague(thr, 25, 55, '관망', '관심', '개입 임박') : self.vague(thr, 30, 60, '잠잠', '경계', '위협');
      var tag = ex ? ' <small>(국력 ' + Math.round(w.p) + ' · ' + (k === 'tang' ? '개입 ' : '적의 ') + Math.round(thr) + ')</small>' : '';
      out += '<div class="dp"><b>' + self.names[k] + '</b><span>관계 ' + self.vague(rel, 30, 60, '험악', '무난', '우호') + ' · ' + tone + tag + '</span></div>';
    });
    return '<div class="dips">' + out + '</div>';
  };
  P.pips = function () { var s = '', n = this.s.ap; for (var i = 0; i < 3; i++) s += i < n ? '●' : '○'; return s; };
  P.renderTurn = function () {
    var self = this, g = this.g, s = this.s, cfg = this.cfg;
    if (s.ap < 0) s.ap = 0;
    var t = cfg.turnTitle ? cfg.turnTitle(s.year) : (this.cfg.country || '') + ' ' + s.year + '년';
    var body = [];
    body.push('<div class="realm">' + ['royal', 'train', 'defense', 'econ', 'intel', 'navy'].map(function (k) { return bar(REALM_N[k], s.realm[k]); }).join('') + '</div>');
    if (s.last) body.push('<div class="quote">' + s.last + '</div>');
    if (SG.branchPanel) body.push(SG.branchPanel(this));
    var adv = SG.advisor ? SG.advisor.advise(this) : null;
    if (adv) body.push('<div class="note"><b>참모의 말</b><br>' + adv + '</div>');
    var lg = s.log.slice(-5).reverse(); if (lg.length) body.push('<div class="chron-log"><b>최근 기록</b><br>' + lg.join('<br>') + '</div>');
    var laws = Object.keys(s.laws).map(function (k) { return self.lawById(k).name; }); if (laws.length) body.push('<div class="chron-log"><b>시행 중인 법령</b> ' + laws.join(' · ') + '</div>');
    body.push(this.dipHtml());
    g.page({ era: s.year + '년 · 정무 행동력 ' + this.pips(), title: this.L(t), body: body });
    s.last = '';
    this.drawChoices();
  };
  P.cmds = function () {
    var self = this, s = this.s, y = s.year, ctx = this.ctx();
    return SG.data.commands.concat(this.cfg.cmds || []).filter(function (c) {
      if (c.hidden) return false;
      if (c.only && c.only.indexOf(self.cfg.id) < 0) return false;
      if (c.sides && c.sides.indexOf(self.side) < 0) return false;
      if (c.y0 && y < c.y0) return false;
      if (c.y1 && y > c.y1) return false;
      return true;
    });
  };
  P.cmdAvail = function (c) {
    var s = this.s, why = '';
    if (s.cd[c.id] > 0) why = '재사용까지 ' + s.cd[c.id] + '년';
    else if (!this.canPay(c.cost)) why = '자원 부족';
    else if (s.ap < (c.ap || 1)) why = '행동력 부족';
    else if (c.req && !c.req(this.ctx())) why = '조건 미충족';
    else if (c.id === 'law' && !this.lawsLeft().length) why = '제정할 법령 없음';
    else if (c.needs === 'target' && !this.targets().length) why = '공략할 곳 없음';
    return why;
  };
  P.costText = function (c) { var a = []; for (var k in (c.cost || {})) a.push(RES_N[k] + ' ' + c.cost[k]); a.push('행동력 ' + (c.ap || 1)); return a.join(' · '); };
  P.drawChoices = function () {
    var self = this, s = this.s, g = this.g, box = $('#chron .choices'); box.innerHTML = '';
    var top = h('div', 'cmdtop'); box.appendChild(top);
    var end = h('button', 'btn pri endyear', '한 해를 보낸다 ▶'); end.onclick = function () { self.endYearConfirm(); }; top.appendChild(end);
    var sk = h('button', 'btn', '⏩'); sk.title = '사건이 생기거나 사료 속 해가 올 때까지 해를 넘깁니다 (그동안 정무 명령은 내리지 않음)'; sk.onclick = function () { self.skipping = true; self.yearEnd(); }; top.appendChild(sk);
    var tabs = h('div', 'tabs'); ['내정', '군사', '외교', '특수'].forEach(function (t) {
      var b = h('button', 'tab' + (s.tab === t ? ' on' : ''), t); b.onclick = function () { s.tab = t; self.drawChoices(); }; tabs.appendChild(b);
    }); top.appendChild(tabs);
    var list = h('div', 'cmdlist'); box.appendChild(list);
    this.cmds().filter(function (c) { return c.cat === s.tab; }).forEach(function (c) {
      var why = self.cmdAvail(c), label = self.L(c.name), tag = self.isHist(c) ? '<span class="tag">역사</span>' : c.hist === '가상' ? '<span class="tag dim">가상</span>' : '';
      var b = h('button', 'ch cmd', tag + label + '<small>' + self.L(c.desc) + ' <i>[' + self.costText(c) + ']</i>' + (why ? ' <em>— ' + why + '</em>' : '') + '</small>');
      b.disabled = !!why; b.onclick = function () { self.run(c); }; list.appendChild(b);
    });
    var f = h('form', 'free', '<input type="text" placeholder="하고 싶은 일을 문장으로 (예: 신라를 공격한다 / 군사를 훈련시켜라 / 율령을 반포하라)"><button class="btn" type="submit">교지</button>');
    f.onsubmit = function (e) { e.preventDefault(); var v = $('input', f).value.trim(); if (v) self.free(v); };
    box.appendChild(f);
  };

  /* ── 명령 실행 ── */
  P.run = function (c, opt) {
    opt = opt || {}; var self = this, s = this.s, g = this.g;
    var why = this.cmdAvail(c); if (why) { s.last = '지금은 할 수 없습니다 — ' + why; return this.renderTurn(); }
    if (c.needs === 'law' && !opt.law) return this.lawUI();
    if (c.needs === 'target' && !opt.target) return this.warPick();
    if (c.needs === 'rival' && !opt.role) return this.rolePick(c);
    if (c.needs === 'text' && !opt.text) return this.renderTurn();
    this.pay(c.cost); s.ap -= (c.ap || 1); if (c.cd) s.cd[c.id] = c.cd;
    g.state.dec++; if (this.isHist(c)) g.state.hist++;
    s.stats.cat[c.cat] = (s.stats.cat[c.cat] || 0) + 1;
    if (c.needs === 'target') return this.warFlow(opt.target, c);
    var extra = '', line = c.lines ? pick(c.lines) : '';
    var chips = this.eff(c.eff, opt.role);
    if (c.risk && Math.random() < c.risk.p) { chips += this.eff(c.risk.eff); extra = '<br><b>뜻밖의 일:</b> ' + this.L(c.risk.text); }
    if (c.fn) { var o = c.fn(g, this.ctx()); if (o) { chips += this.eff(o); if (o.text) extra += '<br>' + this.L(o.text); } }
    if (c.needs === 'law') { var L = this.lawById(opt.law); return this.enact(L, c); }
    var note = this.cfg.id === 'uija' && c.hist === '역사' && c.note ? '<br><small>📜 ' + this.L(c.note) + '</small>' : '';
    s.last = '<b>' + this.L(c.name) + '</b> — ' + this.L(line) + extra + note + chips;
    this.log(this.L(c.name)); this.after();
  };
  P.after = function () { if (this.g.state.res.people <= 0 || this.s.realm.royal <= 0) return this.collapse(); this.renderTurn(); };
  P.endYearConfirm = function () {
    this.yearEnd();
  };

  /* ── 법령 ── */
  P.lawById = function (id) { var a = SG.data.laws.concat(this.cfg.laws || []); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; };
  P.lawsLeft = function () { var s = this.s; return SG.data.laws.concat(this.cfg.laws || []).filter(function (l) { return !s.laws[l.id]; }); };
  P.lawUI = function (cb) {
    var self = this, g = this.g, wrap = h('div', 'modal'), card = h('div', 'card');
    card.innerHTML = '<h2>법령 제정</h2><div class="sub">나라의 틀을 바꾸는 법입니다. 한번 제정하면 해마다 효과가 이어집니다. (금·군량이 모자라면 제정할 수 없습니다)</div><div class="laws"></div><div style="text-align:right;margin-top:10px"><button class="btn" id="lw-x">취소</button></div>';
    var box = $('.laws', card);
    this.lawsLeft().forEach(function (l) {
      var ok = self.canPay(l.cost), b = h('button', 'ch', self.L(l.name) + '<small>' + self.L(l.desc) + ' <i>[' + (Object.keys(l.cost || {}).map(function (k) { return RES_N[k] + ' ' + l.cost[k]; }).join(' · ') || '비용 없음') + ']</i></small>');
      b.disabled = !ok; b.onclick = function () { wrap.remove(); (cb || function (id) { self.run(SG.data.commands.filter(function (c) { return c.id === 'law'; })[0], { law: id }); })(l.id); }; box.appendChild(b);
    });
    $('#lw-x', card).onclick = function () { wrap.remove(); };
    wrap.appendChild(card); g.root.appendChild(wrap);
  };
  P.enact = function (L, c) {
    var s = this.s; this.pay(L.cost); s.laws[L.id] = s.year; var chips = this.eff(L.eff);
    if (L.flags) this.g.setFlags(L.flags);
    s.last = '<b>법령 반포 — ' + this.L(L.name) + '</b><br>' + this.L(L.desc) + chips; this.log('법령 「' + L.name + '」 반포'); this.after();
  };
  P.rolePick = function (c) {
    var self = this, wrap = h('div', 'modal'), card = h('div', 'card');
    card.innerHTML = '<h2>' + this.L(c.name) + '</h2><div class="sub">상대를 고르세요.</div><div class="laws"></div><div style="text-align:right;margin-top:10px"><button class="btn" id="rp-x">취소</button></div>';
    ['silla', 'goguryeo', 'tang', 'wa'].forEach(function (k) { var b = h('button', 'ch', self.names[k] + '<small>현재 관계 ' + Math.round(self.s.rel[k]) + '</small>'); b.onclick = function () { wrap.remove(); self.run(c, { role: k }); }; $('.laws', card).appendChild(b); });
    $('#rp-x', card).onclick = function () { wrap.remove(); };
    wrap.appendChild(card); this.g.root.appendChild(wrap);
  };

  /* ── 전쟁 ── */
  P.targets = function () { var s = this.s; return (this.cfg.targets || []).filter(function (t) { return !s.captured[t.id] && (!t.from || s.year >= t.from); }); };
  P.warPick = function () {
    var self = this, wrap = h('div', 'modal'), card = h('div', 'card'), list = this.targets();
    card.innerHTML = '<h2>' + this.L('{rival} 정벌') + '</h2><div class="sub">공격할 곳을 고르세요. 수비 병력 추정은 첩보 수준에 따라 오차가 있습니다.</div><div class="laws"></div><div style="text-align:right;margin-top:10px"><button class="btn" id="wp-x">취소</button></div>';
    if (!list.length) $('.laws', card).innerHTML = '<div class="note">공략할 대상이 남아 있지 않습니다.</div>';
    list.forEach(function (t) {
      var est = self.estimate(t.garrison), b = h('button', 'ch', self.L(t.name) + '<small>수비 추정 ' + est + ' · 지형 ' + (t.terrain >= 1.6 ? '험준' : t.terrain >= 1.3 ? '견고' : '보통') + (t.hist ? ' · ' + self.L(t.hist) : '') + '</small>');
      b.onclick = function () { wrap.remove(); self.run(SG.data.commands.filter(function (c) { return c.id === 'war'; })[0], { target: t.id }); }; $('.laws', card).appendChild(b);
    });
    $('#wp-x', card).onclick = function () { wrap.remove(); };
    wrap.appendChild(card); this.g.root.appendChild(wrap);
  };
  P.hostScale = function (role) { var w = this.s.world[role]; return role === 'tang' ? clamp(0.55 + w.commit / 110, 0.6, 1.3) : clamp(0.65 + w.p / 180, (this.s.fallen && this.s.fallen[this.sides[role]]) ? 0.3 : 0.7, 1.25); };
  P.estimate = function (n) { var i = this.s.realm.intel, e = i >= 50 ? 0.08 : i >= 25 ? 0.25 : 0.45, f = 1 + (Math.random() * 2 - 1) * e; var v = Math.round(n * f / 500) * 0.5; return '약 ' + v + '천'; };
  P.targetById = function (id) { var a = this.cfg.targets || []; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; };
  P.fieldUnits = function (frac, def) {
    var A = this.g.state.army, out = [];
    for (var k in A) { var U = SG.unitById(k); if (!U || !A[k]) continue; if (!def && NONFIELD[U.base]) continue; if (def && (U.base === 'navy_war' || U.base === 'navy_transport' || U.base === 'scout')) continue; out.push({ id: k, n: Math.round(A[k] * frac) }); }
    return out.filter(function (u) { return u.n > 0; });
  };
  P.enemyUnits = function (side, total, mix) {
    var R = SIDE_ROLES[side] || SIDE_ROLES.silla, out = [], m = mix || { line: .5, garrison: .15, levy: .15, archer: .1, horse: .1 };
    for (var r in m) { var id = R[r] || R.line, n = Math.round(total * m[r]); var ex = out.filter(function (u) { return u.id === id; })[0]; if (ex) ex.n += n; else out.push({ id: id, n: n }); }
    return out.filter(function (u) { return u.n > 0 && SG.unitById(u.id); });
  };
  P.myMorale = function (b) { var s = this.s; return clamp(this.g.state.res.morale + (s.realm.train - 50) / 4 + (b || 0), 15, 160); };
  P.warFlow = function (tid, c) {
    var self = this, g = this.g, T = this.targetById(tid), s = this.s;
    var wrap = h('div', 'modal'), card = h('div', 'card'), field = this.fieldTotal();
    card.innerHTML = '<h2>출병 — ' + this.L(T.name) + '</h2><div class="sub">동원 가능한 야전 병력 ' + field.toLocaleString() + '명 · 수비 추정 ' + this.estimate(T.garrison) + '</div>' +
      '<div class="row" style="grid-template-columns:90px 1fr 60px"><div><b>동원 비율</b></div><input type="range" id="wf-r" min="30" max="100" value="70" step="5"><div class="v" id="wf-v">70%</div></div>' +
      '<div class="laws" id="wf-t"></div><div style="text-align:right;margin-top:10px"><button class="btn" id="wf-x">철회(행동력은 소모됨)</button></div>';
    var tacs = [
      { id: 'front', label: '정면 공격', hint: '정직한 야전·공성. 변수가 적다.', m: {} },
      { id: 'ambush', label: '기습·야습', hint: '첫 합 큰 타격. 첩보 30 미만이면 역습 위험.', m: { ambush: true }, need: 'intel' },
      { id: 'siege', label: '장기 포위·공성', hint: '성을 에워싸 서서히 압박. 군량 5 추가 소모, 공성에 유리.', m: { fort: true, pace: 0.9 }, food: 5 }
    ];
    tacs.forEach(function (t) {
      var b = h('button', 'ch', t.label + '<small>' + t.hint + '</small>');
      if (t.food && g.state.res.food < t.food) b.disabled = true;
      b.onclick = function () { var frac = +$('#wf-r', card).value / 100; wrap.remove(); if (t.food) self.pay({ food: t.food }); self.warFight(T, frac, t); }; $('#wf-t', card).appendChild(b);
    });
    $('#wf-r', card).oninput = function () { $('#wf-v', card).textContent = this.value + '%'; };
    $('#wf-x', card).onclick = function () { wrap.remove(); s.last = '출병을 거두었습니다. 군을 움직이려던 비용만 나갔습니다.'; self.renderTurn(); };
    wrap.appendChild(card); g.root.appendChild(wrap);
    var pl = SG.placeById(T.place); if (pl) g.map.focus(pl.lon, pl.lat, 900, 700);
  };
  P.warFight = function (T, frac, tac) {
    var self = this, g = this.g, s = this.s, R = this.sides.silla;
    var ours = { name: this.cfg.armyName || (this.cfg.country || '아군'), side: this.side, units: this.fieldUnits(frac), gen: this.cfg.gen, morale: this.myMorale(), terrain: 1, ambush: !!(tac.m.ambush && s.realm.intel >= 30) };
    if (tac.m.ambush && s.realm.intel < 30 && Math.random() < 0.5) { ours.morale -= 15; ours.ambush = false; }
    var en = { name: this.L(T.short || T.name), side: T.side || R, units: this.enemyUnits(T.side || R, T.garrison, T.mix), terrain: T.terrain || 1, morale: 68, fort: !!tac.m.fort || T.terrain >= 1.45 };
    s.stats.wars++;
    this.engage(ours, en, { rounds: 6, pace: tac.m.pace }, { T: T, tac: tac, def: false, title: this.L(T.name) + ' 공략' }, function (r) { g.battleUI(r, self.L(T.name) + ' 공략전', '', function () {
      self.casual(ours.units, r.aLeft);
      var win = r.winner === 'a' && r.aEnd / r.aStart >= 0.3, line;
      var rival = s.world.silla;
      if (win) {
        s.stats.won++; s.captured[T.id] = s.year; if (T.flag) g.state.flags[T.flag] = true;
        var chips = self.eff(self.warEff(T, true));
        self.capturePlace(T);
        line = '<b>' + self.L(T.name) + ' 함락.</b> ' + (T.hist ? self.L(T.hist) : '') + chips; self.log(T.name + ' 점령');
      } else {
        s.stats.lost++;
        var ch2 = self.eff(self.warEff(T, false));
        line = '<b>공략 실패.</b> ' + self.L(T.name) + '의 수비를 뚫지 못하고 물러났습니다.' + ch2; self.log(T.name + ' 공략 실패');
      }
      s.last = line; self.after();
    }); });
  };
  // 공격 결과가 그 성의 주인 나라에 미치는 영향 (어느 나라든 공격 가능)
  P.warEff = function (T, win) {
    var S = this.sides, side = T.side || S.silla, role = null, k; for (k in S) if (S[k] === side) role = k;
    var world = {}, rel = {}, s = this.s, e;
    if (role === 'tang') { if (win) world['tang.p'] = T.power || -4; world['tang.commit'] = win ? 12 : 7; rel.tang = win ? -25 : -15; s.provoked = s.provoked || {}; s.provoked.tang = s.year; }
    else if (role) {
      var rival = role === 'silla', friendly = s.rel[role] >= 50 && !rival;
      if (win) world[role + '.p'] = T.power || -4;
      world[role + '.hostility'] = rival ? (win ? 10 : 6) : (win ? 28 : 18);
      rel[role] = rival ? (win ? -10 : -4) : (friendly ? -40 : -25);
      if (rival && win) world['tang.commit'] = T.commit == null ? 4 : T.commit;
      if (friendly) this.log(this.names[role] + '과의 우호가 깨짐');
      if (!rival) { s.provoked = s.provoked || {}; s.provoked[role] = s.year; }
    }
    e = win ? { fx: { gold: T.gold || 10, people: T.people || 2, morale: 4 }, world: world, rel: rel } : { fx: { morale: -8, people: -3 }, realm: { royal: -3 }, world: world, rel: rel };
    return e;
  };
  P.casual = function (before, after) {
    var A = this.g.state.army;
    before.forEach(function (u, i) { var lost = u.n - (after[i] ? after[i].n : 0); if (lost > 0 && A[u.id] != null) A[u.id] = Math.max(0, A[u.id] - lost); });
    this.g.renderArmy(); this.g.hud();
  };

  /* ── 앵커 전투 / 침공 방어 ── */
  P.enemyOf = function (bt) {
    var e = bt.enemy, S = this.ctx(), total = typeof e.total === 'function' ? e.total(S) : e.total;
    if (e.scale) total *= clamp(this.s.world[e.scale].p / (e.ref || 60), 0.5, 1.8);
    var side = e.side || this.sides.silla;
    return { name: this.L(e.name), side: side, units: this.enemyUnits(side, total, e.mix), gen: e.gen, terrain: e.terrain || 1, morale: e.morale || 70, ambush: !!e.ambush, fort: !!e.fort };
  };
  // 방어전에서 싸우지 않고 성을 버리고 물러나는 선택(병력 보존). 사료상 반드시 패망하는 마지막 전투에는 붙이지 않는다.
  P.withAbandon = function (bt) {
    var list = bt.tactics.slice();
    if (!bt.defense || bt.loseEnd || bt.last || list.some(function (t) { return t.special === 'abandon'; })) return list;
    if (!bt.abandon) bt.abandon = { text: ['성을 비우고 병력과 백성을 거두어 물러났습니다. 싸우지 않았으니 군은 온전하나, 성은 적의 손에 넘어갔고 사람들의 마음이 가라앉았습니다.'], fx: { people: -3, morale: -5 }, realm: { defense: -4, royal: -2 } };
    list.push({ label: '성을 버리고 병력을 보존한다', hint: '싸우지 않는다. 병력은 그대로이나 그 방면의 성을 내주고 민심·사기가 떨어진다. 나중에 공격해 되찾을 수 있다.', special: 'abandon', tag: '퇴' });
    return list;
  };
  P.fight = function (bt, tac, anchor) {
    if (tac.special === 'abandon') return this.afterFight(bt, 'abandon', null, false);
    var self = this, g = this.g, s = this.s, m = tac.ours || {};
    var def = !!bt.defense, frac = bt.commit || (def ? 1 : 0.75), base = def ? (bt.terrain || 1) * (1 + s.realm.defense / 400) : 1;
    var ours = { name: this.cfg.armyName || (this.cfg.country || '아군'), side: this.side, units: this.fieldUnits(frac, def), gen: bt.gen || this.cfg.gen, morale: this.myMorale(m.morale), terrain: (m.terrain || base) * (def ? 1 : 1), ambush: !!m.ambush, fort: false };
    var df = this.deployFactor ? this.deployFactor(bt, anchor) : null, dnote = '';
    if (df && Math.abs(df.f - 1) > 0.03) { ours.units.forEach(function (u) { u.n = Math.round(u.n * df.f); }); dnote = '배치 보정: ' + df.name + ' 방면 주둔 ' + df.share + '% → 아군 병력 ×' + df.f.toFixed(2) + '. '; }
    if (tac.special === 'bribe') return this.bribe(bt, tac);
    var en = this.enemyOf(bt); if (m.enemyAmbush) en.ambush = true;
    this.engage(ours, en, { rounds: bt.rounds || 6, pace: m.pace }, { bt: bt, tac: tac, anchor: anchor, def: def, title: this.L(bt.title || '결전') }, function (r) {
      g.battleUI(r, self.L(bt.title || '결전'), dnote + self.L(bt.outro || ''), function () {
        self.casual(ours.units, r.aLeft);
        var ratio = r.aEnd / (r.aStart || 1), kind = r.winner === 'a' ? (ratio >= 0.45 ? 'win' : 'costly') : 'lose';
        self.afterFight(bt, kind, r);
      });
    });
  };
  P.bribe = function (bt, tac) {
    var self = this; this.pay({ gold: tac.gold || 10 });
    var ok = Math.random() < 0.55 + this.s.rel.silla / 400;
    this.afterFight(bt, ok ? 'win' : 'lose', null, true);
  };
  P.afterFight = function (bt, kind, r, bribe) {
    var g = this.g, s = this.s, o = bt[kind] || bt.win || bt.lose || {}, chips = '';
    if (kind === 'win' || kind === 'costly') { s.stats.defended++; }
    chips = this.eff(o);
    var self0 = this; if (o.captureTargets) o.captureTargets.forEach(function (t) { s.captured[t] = s.year; self0.capturePlace(self0.targetById(t)); });
    this.log(this.L(bt.title || '전투') + ' — ' + ({ win: '승리', costly: '고전 끝에 승리', lose: '패배', abandon: '성을 버리고 퇴각' }[kind]));
    var body = (o.text || []).map(this.L, this); body.push(chips);
    if (bribe) body.unshift('화친의 사신을 보냈습니다.');
    g.page({ era: this.L(o.era || (s.year + '년')), title: this.L(o.title || ({ win: '승전', costly: '피로 얻은 승리', lose: '패전', abandon: '성을 버리다' }[kind])), body: body, note: this.L(o.note) });
    if (kind === 'lose' && bt.loseEnd) { return this.finish(bt.loseEnd.kind || 'conquered', bt.loseEnd); }
    if (bt.last) { var selfL = this; return g.choices([{ c: { label: '재위의 끝으로', tag: '▶' }, run: function () { selfL.finish(null); } }]); }
    var self = this; g.choices([{ c: { label: '계속', tag: '▶' }, run: function () { if (g.state.res.people <= 0 || s.realm.royal <= 0) return self.collapse(); if (bt.inChain) self.nextEvent(); else g.go('__turn__'); } }]);
  };
  P.invasion = function () {
    var self = this, s = this.s, cfg = this.cfg, inv = cfg.invasion, inWin = !!inv && s.year >= inv.from && s.year <= (inv.to || 9999);
    var role = 'silla', w = s.world.silla, pr = !inWin ? 0 : clamp((w.hostility - 35) / 180, 0, 0.45) * clamp(w.p / 60, .5, 1.5) * (s.rel.silla > 70 ? 0.3 : 1);
    if (Math.random() >= pr) { // 우리가 먼저 친 다른 나라의 보복
      role = null; var pv = s.provoked || {};
      ['tang', 'goguryeo', 'wa'].forEach(function (k) { var x = s.world[k]; if (!role && pv[k] && s.year - pv[k] <= 6 && (k === 'tang' ? x.commit >= 10 : x.hostility >= 30) && self.sides[k] !== self.side && Math.random() < 0.3) role = k; });
      if (!role) return null; w = s.world[role];
    }
    var RN = this.names[role], rv = function (t) { return t.replace(/\{rival\}/g, RN); };
    var tot = role === 'tang' ? Math.round(9000 + w.commit * 420) : Math.round(w.p * 260 * (0.8 + w.hostility / 200));
    return {
      title: rv('{rival}의 침공'), defense: true, terrain: 1.1,
      enemy: { name: rv('{rival} 군'), side: this.sides[role], total: tot, terrain: 1 },
      intro: rv(pick(['{rival}의 대군이 국경을 넘었다는 급보입니다.', '{rival}이(가) 변경 여러 성을 한꺼번에 치고 있습니다.', '봉수가 연이어 오르며 {rival}의 침공을 알립니다.'])) + (role !== 'silla' ? ' 우리가 먼저 그 성을 친 데 대한 보복입니다.' : ''),
      tactics: [
        { label: '성에 의지해 막는다', hint: '방비가 높을수록 유리. 피해를 줄이는 정석.', ours: { terrain: 1.35 + s.realm.defense / 300 } },
        { label: '야전에서 결전한다', hint: '사기가 높고 훈련도가 높으면 큰 승리를 노릴 수 있다.', ours: { morale: 6 } },
        { label: '요충에 매복한다', hint: '첩보가 30 이상이어야 적의 길목을 안다. 첫 합을 크게 친다.', ours: { ambush: s.realm.intel >= 30, terrain: 1.2 } },
        { label: '화친 사신을 보내 달랜다 (금 10)', hint: '싸우지 않고 넘긴다. 실패하면 처참하다.', special: 'bribe', gold: 10 }
      ],
      win: { text: ['적을 물리쳤습니다.'], fx: { morale: 5, people: 2 }, world: (function () { var o = {}; o[role + '.p'] = -3; o[role + '.hostility'] = -4; return o; })() },
      costly: { text: ['피해가 컸으나 침공은 막아냈습니다.'], fx: { morale: -1, people: -2 }, realm: { defense: -3 } },
      lose: { text: ['변경 성들이 약탈당하고 백성이 끌려갔습니다.'], fx: { people: -7, morale: -6, food: -8 }, realm: { defense: -8, royal: -3 }, world: (function () { var o = {}; o[role + '.p'] = 2; return o; })() }
    };
  };

  /* ── 한 해의 끝: 수입·세계 변화·랜덤 사건 ── */
  P.yearEnd = function () {
    var self = this, g = this.g, s = this.s, cfg = this.cfg, res = g.state.res, rl = s.realm;
    var T = this.armyTotal() / 1000;
    // 수입·유지비
    var gi = Math.round(6 + rl.econ * 0.14 + (res.people - 50) * 0.06 - T * 0.11), fi = Math.round(9 + rl.econ * 0.28 + (res.people - 50) * 0.05 - T * 0.30 - T * T * 0.0025);
    // 법령의 해마다 효과
    var lawChips = '';
    for (var id in s.laws) { var L = this.lawById(id); if (L && L.yearly) lawChips += this.eff(L.yearly); }
    var d = g.apply({ gold: gi, food: fi });
    function dk(v, k) { return k * Math.max(1, v / 75); } // 한계는 없지만 높을수록 유지가 어렵다
    rl.train = clamp(rl.train - dk(rl.train, 2), 0, 999); rl.intel = clamp(rl.intel - dk(rl.intel, 1), 0, 999); rl.defense = clamp(rl.defense - dk(rl.defense, 1), 0, 999);
    if (rl.econ > 70) rl.econ -= Math.max(1, rl.econ / 90); // 한계 수확 체감
    var starve = '';
    if (res.food <= 0) { res.food = 0; g.apply({ people: -5, morale: -5 }); var lv = this.units.levy; if (g.state.army[lv]) g.state.army[lv] = Math.round(g.state.army[lv] * 0.9); starve = '<br>군량이 바닥나 병사들이 이탈하고 민심이 흔들렸습니다.'; g.renderArmy(); }
    if (res.gold < 0) { res.gold = 0; g.apply({ morale: -3, people: -2 }); starve += '<br>봉록과 상여가 밀려 불만이 쌓였습니다.'; }
    // 세계 시뮬
    this.world();
    for (var k in s.cd) if (s.cd[k] > 0) s.cd[k]--;
    s.ap = 3;
    var summary = '<b>' + s.year + '년 결산</b> — 수입 금 ' + (gi >= 0 ? '+' : '') + gi + ', 군량 ' + (fi >= 0 ? '+' : '') + fi + '(군 유지비 포함).' + starve + lawChips;
    this.chain = this.rollEvents();
    var inv = this.invasion(); if (inv) this.chain.unshift({ inv: inv });
    this.summary = summary;
    this.nextEvent();
  };
  P.world = function () {
    var s = this.s, cfg = this.cfg, wd = s.world, y = s.year, self = this;
    ['silla', 'goguryeo', 'tang', 'wa'].forEach(function (k) {
      var w = wd[k], dr = (cfg.drift || {})[k] || {};
      w.p = clamp(w.p + (dr.p == null ? 0.5 : dr.p) + (Math.random() - 0.5) * 1.6, 5, 400);
      var ct = dr.commitTarget == null ? 0 : (y >= (dr.from || 0) ? dr.commitTarget : 0);
      if (dr.sched) { var ks = Object.keys(dr.sched).map(Number).sort(function (m, n) { return m - n; }); ks.forEach(function (yy) { if (yy <= y) ct = dr.sched[yy]; }); }
      var target = k === 'tang' ? ct : clamp(100 - s.rel[k], 5, 90);
      if (k === 'tang') { w.commit = clamp(w.commit + (target - w.commit) * 0.12 + (wd.silla.hostility > 60 ? 1 : 0) - (s.rel.tang - 50) * 0.02, 0, 100); }
      else w.hostility = clamp(w.hostility + (target - w.hostility) * 0.12 + (dr.hostility || 0), 0, 100);
      s.rel[k] = clamp(s.rel[k] + (50 - s.rel[k]) * 0.06, 0, 100);
    });
    // 라이벌이 약해지면 대국이 개입 의지를 올린다(약자 구원 명분)
    if (wd.silla.p < 35) wd.tang.commit = clamp(wd.tang.commit + 1, 0, 100);
  };
  P.rollEvents = function () {
    var self = this, s = this.s, ctx = this.ctx(), pool = SG.data.events.concat(this.cfg.events || []).filter(function (e) {
      if (e.only && e.only.indexOf(self.cfg.id) < 0) return false;
      if (s.used[e.id] && s.year - s.used[e.id] < 6) return false;
      try { return !e.cond || e.cond(ctx); } catch (x) { return false; }
    });
    var out = [], n = Math.random() < 0.8 ? (Math.random() < 0.32 ? 2 : 1) : 0;
    for (var i = 0; i < n && pool.length; i++) {
      var tot = pool.reduce(function (t, e) { return t + (e.w || 1); }, 0), r = Math.random() * tot, ev = pool[0];
      for (var j = 0; j < pool.length; j++) { r -= (pool[j].w || 1); if (r <= 0) { ev = pool[j]; break; } }
      out.push({ ev: ev }); pool = pool.filter(function (e) { return e !== ev; });
    }
    return out;
  };
  P.nextEvent = function () {
    var self = this, g = this.g, s = this.s, item = this.chain.shift();
    if (!item) return this.nextYear();
    if (item.inv) return this.showInvasion(item.inv);
    this.skipping = false; var ev = item.ev, ctx = this.ctx(); s.used[ev.id] = s.year; s.stats.events++;
    var body = (typeof ev.text === 'function' ? ev.text(ctx) : ev.text).map(function (t) { return self.L(t); });
    if (this.summary) { body.unshift('<div class="chron-log">' + this.summary + '</div>'); this.summary = null; }
    var note = (this.cfg.id === 'uija' && ev.note) ? this.L(ev.note) : '';
    g.page({ era: s.year + '년 · 사건 · ' + ev.cat + (ev.hist === '사료' && this.cfg.id === 'uija' ? ' · 사료에 비슷한 기사' : ev.hist === '가상' ? ' · 창작' : ''), title: this.L(ev.title), body: body, note: note });
    var opts = ev.choices.map(function (c) {
      var dis = false, cost = c.fx && c.fx.gold < 0 && g.state.res.gold < -c.fx.gold || c.fx && c.fx.food < 0 && g.state.res.food < -c.fx.food;
      return { c: { label: self.L(c.label), hint: self.L(c.hint), disabled: !!cost }, run: function () { self.pickEvent(ev, c); } };
    });
    if (opts.length && opts.every(function (o) { return o.c.disabled; })) opts.forEach(function (o) { o.c.disabled = false; });   // 모든 선택이 막히면 멈추지 않도록: 빠듯해도 무리해서 고를 수 있다
    g.choices(opts);
  };
  P.pickEvent = function (ev, c) {
    var self = this, g = this.g, e = c, extra = '';
    if (c.fn) { var o = c.fn(this.ctx()); if (o) e = Object.assign({}, c, o, { fx: Object.assign({}, c.fx || {}, o.fx || {}) }); extra = o && o.text ? o.text : ''; }
    var chips = this.eff(e);
    g.state.dec++;
    this.log(this.L(ev.title) + ' — ' + this.L(c.label));
    var body = $('#chron .body'), res = this.L(c.result || extra || '');
    body.insertAdjacentHTML('beforeend', '<div class="quote">' + res + '</div>' + chips); body.scrollTop = body.scrollHeight;
    g.choices([{ c: { label: '계속', tag: '▶' }, run: function () { if (g.state.res.people <= 0 || self.s.realm.royal <= 0) return self.collapse(); self.nextEvent(); } }]);
  };
  P.showInvasion = function (inv) {
    this.skipping = false; var self = this, g = this.g, s = this.s; s.stats.invaded++;
    var body = [inv.intro]; if (this.summary) { body.unshift('<div class="chron-log">' + this.summary + '</div>'); this.summary = null; }
    g.page({ era: s.year + '년 · 침공', title: inv.title, body: body, note: '' });
    var pl = SG.placeById(this.cfg.capPlace); if (pl) g.map.focus(pl.lon, pl.lat, 1500, 700);
    g.choices(this.withAbandon(inv).map(function (t) { return { c: { label: t.label, hint: t.hint, disabled: t.gold && g.state.res.gold < t.gold }, run: function () { self.fight(inv, t); } }; }));
    inv.inChain = true;
  };
  P.nextYear = function () {
    var s = this.s; s.year++;
    if (this.g.state.res.people <= 0 || s.realm.royal <= 0) return this.collapse();
    if (this.skipping) { var anc = this.anchors.some(function (a) { return a.y === s.year && !s.shown[a.id]; }); if (!anc && s.year <= this.cfg.end) return this.yearEnd(); this.skipping = false; }
    // 라이벌이 이미 정벌로 약해지면 쿠데타·반란 위험 징후
    this.g.go('__turn__');
  };

  /* ── 자유 입력 ── */
  P.free = function (text) {
    var self = this, s = this.s;
    var r = SG.advisor ? SG.advisor.parse(text, this) : { kind: 'improv' };
    if (r.kind === 'cmd') return this.run(r.cmd, r.opt || {});
    if (r.kind === 'end') return this.confirmEnd(r);
    s.stats.free++;
    return this.improvise(text, r);
  };
  P.improvise = function (text, r) {
    var s = this.s, g = this.g;
    if (s.ap < 1) { s.last = '행동력이 모자랍니다. 한 해를 넘긴 뒤에 다시 명하십시오.'; return this.renderTurn(); }
    var res = SG.advisor.improvise(text, this, r);
    if (!this.canPay(res.cost)) { s.last = '참모가 아룁니다 — "뜻은 알겠사오나 자원이 모자랍니다."'; return this.renderTurn(); }
    this.pay(res.cost); s.ap -= 1; g.state.dec++; s.stats.cat['자유'] = (s.stats.cat['자유'] || 0) + 1;
    var chips = this.eff(res.eff);
    s.last = '<b>시행 결과</b><br>' + res.text + chips + '<br><small>※ 사료에 정해진 선택지가 아니므로 참모(내장 AI)가 상황에 맞춰 효과를 추정했습니다. [가상]</small>';
    this.log('교지 — ' + text.slice(0, 18)); this.after();
  };
  P.confirmEnd = function (r) {
    var self = this;
    if (!confirm(r.kind2 === 'surrender' ? '정말 항복하고 나라를 넘기겠습니까?' : '정말 왕위에서 물러나겠습니까?')) return;
    this.finish(r.kind2 === 'surrender' ? 'surrender' : 'abdicate');
  };
  P.collapse = function () {
    var s = this.s, g = this.g;
    if (g.state.res.people <= 0) return this.finish('rebellion');
    return this.finish('coup');
  };
  P.finale = function () { if (this.cfg.finaleHandler) return this.cfg.finaleHandler(this.g, this); return this.finish(null); };
  P.finish = function (kind, extra) {
    var g = this.g, e = SG.advisor.epilogue(this, kind, extra);
    g.page({ era: e.era, title: e.title, body: e.body });
    g.endUI({ ending: { seal: e.seal, mine: e.mine, real: e.real, score: function (gg) { return gg.state.dec ? Math.round(gg.state.hist / gg.state.dec * 100) : 0; } } });
  };

  SG.Sandbox = Sandbox;

  /* ── 시나리오 빌더: 시대별 설정 → 플레이 가능한 시나리오 ── */
  SG.makeScenario = function (cfg) {
    var units = SIDE_ROLES[cfg.side], army = {};
    for (var r in cfg.army) { var id = units[r] || r; army[id] = cfg.army[r]; }
    var scn = {
      id: cfg.id, king: cfg.king, sub: cfg.sub, seal: cfg.seal, res: Object.assign({ troops: 0, food: 55, gold: 50, people: 55, morale: 60 }, cfg.res || {}), army: army,
      start: 'intro', handlers: {}, sb: cfg,
      scenes: {
        intro: { era: cfg.intro.era, title: cfg.intro.title, focus: cfg.intro.focus || (cfg.homeFocus || [127.5, 37, 2200]), terr: cfg.terr, text: cfg.intro.text, note: cfg.intro.note, src: cfg.intro.src, choices: [{ label: cfg.intro.go || (cfg.start + '년, 즉위의 해로'), tag: '▶', next: '__turn__' }] }
      }
    };
    SG.scenarios[cfg.id] = scn; return scn;
  };
})();
