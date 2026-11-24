/* 적국의 내정 (게임 추상화 모델) — 다른 나라들도 플레이어처럼 해마다 턴을 보낸다.
 * 나라마다 농업·훈련·방비·수군·첩보·민심과 금·군량·병과 숙련을 갖고, 해마다 수입을 거둔 뒤 행동력 3으로 필요한 일을 고른다
 * (농지 개간·구휼·조련·성곽 보수·징병·병과 조련·수군 증강·첩보망). 이 수치가 국력·적 병력·훈련도·병과 등급·성 수비대·수군에 그대로 반영된다.
 * 흉년·민란 같은 위기도 겪는다. 첩보력이 높을수록 이웃의 내정이 자세히 보인다.
 * T()는 반드시 파일을 읽을 때(함수 밖에서) 부른다. */
(function () {
  var TR = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
  function T(k, e, j) { TR.en[k] = e; TR.ja[k] = j; var I = SG.i18n; if (I && I.dict && I.dict.en) { I.dict.en[k] = e; I.dict.ja[k] = j; } return k; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var P = SG.Sandbox.prototype;
  var CFG = SG.AIDEV = { on: 1, aps: 3 };

  // 나라별 시작 국정(게임 추상화): 농업·훈련·방비·수군·첩보, 병과 특기
  var BASE = {
    tang: { econ: 66, train: 62, defense: 55, navy: 45, intel: 40, bl: { cav: 40, rng: 40, siege: 40, line: 20 } },
    goguryeo: { econ: 46, train: 56, defense: 56, navy: 22, intel: 30, bl: { cav: 40, elite: 20, siege: 20, line: 20 } },
    silla: { econ: 52, train: 50, defense: 50, navy: 34, intel: 34, bl: { elite: 20, rng: 20, line: 20 } },
    baekje: { econ: 54, train: 50, defense: 48, navy: 44, intel: 32, bl: { rng: 20, line: 20 } },
    wa: { econ: 40, train: 42, defense: 38, navy: 56, intel: 26, bl: { line: 20 } },
    gaya: { econ: 40, train: 44, defense: 42, navy: 30, intel: 26, bl: { cav: 20, line: 20 } }
  };
  var ACTS = {
    farm: { nm: T('농지 개간', 'Land reclamation', '農地開墾'), gold: 3, food: 0 },
    relief: { nm: T('백성 구휼', 'Relief for the people', '民の救恤'), gold: 0, food: 4 },
    drill: { nm: T('군사 조련', 'Troop drills', '軍の調練'), gold: 0, food: 2 },
    fort: { nm: T('성곽 보수', 'Fortification works', '城郭の修築'), gold: 3, food: 0 },
    recruit: { nm: T('징병', 'Conscription', '徴兵'), gold: 5, food: 3 },
    branch: { nm: T('병과 조련', 'Branch training', '兵科の調練'), gold: 3, food: 1 },
    navy: { nm: T('수군 증강', 'Naval buildup', '水軍の増強'), gold: 4, food: 1 },
    scout: { nm: T('첩보망 정비', 'Spy network', '諜報網の整備'), gold: 2, food: 0 }
  };
  var M = {
    head: T('이웃 나라의 내정', 'Neighbors’ Domestic Affairs', '隣国の内政'),
    famine: T('흉년으로 백성이 굶주리고 국력이 꺾였습니다.', 'Famine starved the people and sapped their strength.', '凶作で民が飢え、国力が削がれました。'),
    riot: T('민심이 무너져 민란이 일어나고 국력이 꺾였습니다.', 'Public order collapsed into riots, sapping their strength.', '民心が崩れて民乱が起こり、国力が削がれました。'),
    boom: T('풍년이 들어 곳간이 넉넉해졌습니다.', 'A bumper harvest filled their granaries.', '豊作で蔵が満ちました。'),
    low: T('낮음', 'Low', '低い'), mid: T('보통', 'Average', '普通'), high: T('높음', 'High', '高い'), unk: T('불명', 'Unknown', '不明'),
    res: T('예비군', 'Reserves', '予備軍'), econ: T('농업', 'Farming', '農業'), train: T('훈련', 'Training', '訓練'), def: T('방비', 'Defense', '防備'), navy: T('수군', 'Navy', '水軍')
  };
  function dm(v, g) { return g * clamp(1 - (v - 55) / 45, 0.2, 1); } // 높을수록 오르기 어렵다
  var BR = ['line', 'elite', 'cav', 'rng', 'siege'];

  P.nat = function (side) {
    var s = this.s, ai = s.ai = s.ai || {}; ai.nat = ai.nat || {};
    var n = ai.nat[side];
    if (!n) {
      var b = BASE[side] || BASE.silla, role = this.roleOf(side), w = role && s.world[role], dp = w && role !== 'tang' ? (w.p - 50) / 4 : 0, bl = {};
      BR.forEach(function (k) { bl[k] = b.bl[k] || 0; });
      n = ai.nat[side] = { gold: 25, food: 45, people: 55, econ: clamp(b.econ + dp, 20, 90), train: clamp(b.train + dp, 20, 90), defense: clamp(b.defense + dp * 0.5, 20, 90), navy: b.navy, intel: b.intel, bl: bl, did: [] };
    }
    return n;
  };
  // 나라의 힘을 내정이 어느 쪽으로 끌고 가는가(영토·농업·훈련·방비·민심)
  P.natTarget = function (side) {
    var self = this, n = this.nat(side), c = this.places().filter(function (p) { return self.ownerOf(p) === side; }).length;
    return clamp(18 + c * 2.4 + (n.econ - 50) * 0.2 + (n.train - 50) * 0.28 + (n.defense - 50) * 0.08 + (n.people - 50) * 0.12, 10, 100);
  };
  P.natSides = function () {
    var self = this, s = this.s, me = this.side, d = s.destroyed || {}, out = [], seen = {};
    ['silla', 'goguryeo', 'tang', 'wa'].forEach(function (k) { var sd = self.sides[k]; if (sd && sd !== me && !d[sd] && !seen[sd]) { seen[sd] = 1; out.push(sd); } });
    var own = {}; this.places().forEach(function (p) { own[self.ownerOf(p)] = 1; });
    ['baekje', 'gaya'].forEach(function (sd) { if (sd !== me && !d[sd] && own[sd] && !seen[sd]) { seen[sd] = 1; out.push(sd); } });
    return out;
  };

  /* ── 한 나라의 한 해 ── */
  P.natTurn = function (side, atWar) {
    var self = this, s = this.s, n = this.nat(side), role = this.roleOf(side), w = role && s.world[role], P_ = this.sidePower(side), notes = [];
    var places = this.places().filter(function (p) { return self.ownerOf(p) === side; }).length;
    // 수입과 유지비
    n.gold = clamp(n.gold + 2 + n.econ * 0.08 + places * 0.5 - P_ * 0.07, 0, 200);
    n.food = clamp(n.food + 4 + n.econ * 0.14 + places * 0.6 - P_ * 0.12, -20, 300); if (n.food > 100) n.food *= 0.97;
    // 해마다 새는 것들
    n.train = clamp(n.train - 2, 15, 95); n.defense = clamp(n.defense - 2, 15, 95); n.intel = clamp(n.intel - 1, 5, 95);
    if (n.econ > 84) n.econ -= 1;
    BR.forEach(function (k) { if (n.bl[k] > 40) n.bl[k] -= 1; });
    // 위기와 행운
    var crisis = null;
    if (n.food < 0) { n.food = 8; n.people = clamp(n.people - 8, 5, 100); crisis = M.famine; if (w && role !== 'tang') w.p = clamp(w.p - 3, 4, 150); else if (!role) { var a0 = s.ai; a0.pw = a0.pw || {}; a0.pw[side] = clamp((a0.pw[side] || 20) - 3, 6, 90); } }
    else if (n.people < 25) { n.people = 40; n.defense = clamp(n.defense - 6, 15, 95); crisis = M.riot; if (w && role !== 'tang') w.p = clamp(w.p - 3, 4, 150); }
    else if (Math.random() < 0.06) { n.food = clamp(n.food + 25, -20, 300); n.people = clamp(n.people + 4, 5, 100); crisis = M.boom; }
    n.people = clamp(n.people + (n.food > 20 ? 1 : -1) + (atWar ? -1 : 0), 5, 100);
    // 행동력만큼 필요한 일을 고른다
    // 시대가 흐를수록 나라의 눈높이도 오른다: 목표치가 올라가 후반에도 계속 성장하고, 쌓인 금은 투자로 쓴다
    var prog = clamp((s.year - this.cfg.start) / 45, 0, 1), goal = 62 + 22 * prog, rich = n.gold > 30 ? 0.5 : 0, extra = n.gold > 45 ? 1 : 0;
    var threat = atWar ? 1 : 0.3, coastal = side === 'wa' || side === 'tang' || side === 'baekje' || side === 'silla', sc = {};
    sc.farm = (goal + 3 - n.econ) / 40 + (n.food < 25 ? 0.6 : 0) + rich * 0.4;
    sc.relief = n.people < 55 ? (55 - n.people) / 22 : -1;
    sc.drill = (goal - n.train) / 30 + threat * 0.5 + rich * 0.4;
    sc.fort = (goal - 4 - n.defense) / 35 + threat * 0.4 + rich * 0.4;
    sc.recruit = (n.gold > 14 && n.food > 12 && P_ < 105) ? 0.25 + threat * 0.5 + (P_ < this.natTarget(side) ? 0.25 : 0) : -1;
    sc.branch = 0.3 + threat * 0.3;
    sc.navy = coastal ? (goal - 7 - n.navy) / 50 : (goal - 27 - n.navy) / 60;
    sc.scout = (goal - 24 - n.intel) / 50;
    var order = Object.keys(sc).sort(function (a, b) { return (sc[b] + Math.random() * 0.25) - (sc[a] + Math.random() * 0.25); }), done = [];
    for (var i = 0; i < order.length && done.length < CFG.aps + extra; i++) {
      var k = order[i], A = ACTS[k]; if (sc[k] <= -0.5 || n.gold < A.gold || n.food < A.food + 3) continue;
      if (Math.random() < 0.25) continue; // 관료의 늑장·불발
      n.gold -= A.gold; n.food -= A.food; done.push(k);
      if (k === 'farm') n.econ = clamp(n.econ + dm(n.econ, 5), 15, 95);
      else if (k === 'relief') n.people = clamp(n.people + 6, 5, 100);
      else if (k === 'drill') n.train = clamp(n.train + dm(n.train, 6), 15, 95);
      else if (k === 'fort') n.defense = clamp(n.defense + dm(n.defense, 6), 15, 95);
      else if (k === 'recruit') { n.people = clamp(n.people - 2, 5, 100); if (w && role !== 'tang') w.p = clamp(w.p + 2.5, 4, 150); else if (!role) { var a1 = s.ai; a1.pw = a1.pw || {}; a1.pw[side] = clamp((a1.pw[side] || 20) + 2.5, 6, 90); } }
      else if (k === 'branch') { var b = (BASE[side] || BASE.silla).bl, ws = BR.map(function (g) { return 1 + (b[g] ? 1.5 : 0) + (g === 'siege' ? -0.5 : 0); }), r = Math.random() * ws.reduce(function (t, x) { return t + x; }, 0), g2 = BR[0]; for (var q = 0; q < BR.length; q++) { r -= ws[q]; if (r <= 0) { g2 = BR[q]; break; } } n.bl[g2] = clamp(n.bl[g2] + Math.max(5, 14 - 3 * Math.floor(n.bl[g2] / 20)), 0, 100); }
      else if (k === 'navy') n.navy = clamp(n.navy + dm(n.navy, 6), 5, 95);
      else if (k === 'scout') n.intel = clamp(n.intel + dm(n.intel, 5), 5, 95);
    }
    n.did = done; n.crisis = crisis ? 1 : 0;
    return { done: done, crisis: crisis };
  };
  P.aiTurnAll = function () {
    if (!CFG.on) return;
    var self = this, s = this.s, ai = s.ai = s.ai || {}, war = {}, lines = [], ex = s.realm.intel >= 25;
    (ai.mv || []).forEach(function (m) { war[m.side] = 1; war[m.def] = 1; });
    function nm(side) { var r = self.roleOf(side); return r ? self.names[r].replace('(멸망)', '') : ((SG.sideName && SG.sideName[side]) || side); }
    this.natSides().forEach(function (side) {
      var r = self.natTurn(side, !!war[side]), txt = '';
      if (ex && r.done.length) txt = '<div><b>' + nm(side) + ' — </b>' + r.done.map(function (k) { return '<i>' + ACTS[k].nm + '</i>'; }).join(' · ') + '</div>';
      if (r.crisis) txt += '<div><b>' + nm(side) + ' — </b>' + r.crisis + '</div>';
      if (txt) lines.push(txt);
    });
    if (lines.length) this.pre = (this.pre || '') + '<div class="freehd">🏛 <b>' + M.head + '</b>' + lines.join('') + '</div>';
  };

  /* ── 전투·방어에 반영 ── */
  P.foeTrain = function (side) {
    var n = this.nat(side), role = this.roleOf(side), w = role && this.s.world[role];
    return Math.max(25, Math.min(90, Math.round(n.train + (w && role !== 'tang' ? (w.p - 50) / 10 : 0))));
  };
  P.foeBL = function (side) {
    var n = this.nat(side), o = {}; BR.forEach(function (k) { o[k] = clamp(Math.floor(n.bl[k] / 20), 0, 5); }); o.navy = clamp(Math.floor(n.navy / 20), 0, 5); return o;
  };
  var _ff = P.foeFleet;
  P.foeFleet = function (side) { var r = _ff.apply(this, arguments), n = this.nat(side); r.n = Math.round(r.n * clamp((0.6 + n.navy / 80) / 0.975, 0.6, 1.6) / 50) * 50; return r; };
  var _dt = P.dynTarget;
  P.dynTarget = function (pl, ow) {
    var t = _dt.apply(this, arguments), n = (this.s.ai && this.s.ai.nat && this.s.ai.nat[ow]);
    if (n) { t.garrison = Math.round(t.garrison * (0.85 + n.defense / 330) / 500) * 500; t.terrain = Math.round(t.terrain * (1 + (n.defense - 50) / 800) * 100) / 100; }
    return t;
  };

  /* ── 화면: 이웃 나라의 내정(첩보력만큼 보인다) ── */
  function tier(v, lo, hi) { return v < lo ? M.low : v < hi ? M.mid : M.high; }
  var _dh = P.dipHtml;
  P.dipHtml = function () {
    var html = _dh.apply(this, arguments), self = this, s = this.s, intel = s.realm.intel, out = '';
    if (!(s.ai && s.ai.nat)) return html;
    function nm(side) { var r = self.roleOf(side); return r ? self.names[r].replace('(멸망)', '') : ((SG.sideName && SG.sideName[side]) || side); }
    this.natSides().forEach(function (side) {
      var n = s.ai.nat[side]; if (!n) return;
      var f = function (lab, v, lo, hi) { return '<i>' + lab + '</i> ' + (intel >= 50 ? Math.round(v) : intel >= 20 ? tier(v, lo, hi) : M.unk); };
      out += '<div class="dp"><b>' + nm(side) + '</b><span>' + f(M.econ, n.econ, 45, 62) + ' · ' + f(M.train, n.train, 45, 62) + ' · ' + f(M.def, n.defense, 45, 62) + ' · ' + f(M.navy, n.navy, 30, 50) + ' · ' + f(M.res, SG.resOf ? SG.resOf(self, side) : 40, 35, 55) + '</span></div>';
    });
    return html + (out ? '<div class="dips aid" title="' + M.head + '">' + out + '</div>' : '');
  };
})();
