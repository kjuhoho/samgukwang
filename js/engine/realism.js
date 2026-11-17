/* 현실성: ① 공격 전 확인 ② 원정 거리(행군 손실·피로·군량·매복·풍랑) ③ 점령지의 병력·수입 ④ 내 수도가 함락돼도 성이 남아 있으면 천도해 항전 */
(function () {
  var P = SG.Sandbox.prototype, CASTLE = { capital: 1, city: 1, fortress: 1, port: 1, pass: 1 };
  function $(s, r) { return (r || document).querySelector(s); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function nm(side) { return (SG.sideName && SG.sideName[side]) || side; }
  function short(pl) { return pl.name.replace(/\(.*?\)/g, '').trim(); }

  /* ── ② 원정 ── */
  P.myPlaces = function () { var self = this; return this.places().filter(function (p) { return self.ownerOf(p) === self.side; }); };
  P.expedition = function (T) {
    var s = this.s, pl = SG.placeById(T.place), mine = this.myPlaces(), from = null, bd = 99;
    if (!pl) return { km: 0, loss: 0, mor: 0, food: 0, amb: 0, storm: 0, days: 0, from: null };
    mine.forEach(function (p) { var d = dist(p, pl); if (d < bd) { bd = d; from = p; } });
    if (!from) { from = SG.placeById(this.cfg.capPlace) || pl; bd = dist(from, pl); }
    var km = Math.round(bd * 111 / 10) * 10, sea = !!T.oversea || (pl.kind === 'island');
    var sup = 1 - clamp((s.realm.econ - 50) / 200, -0.15, 0.2); // 재정·보급이 좋으면 덜 지친다
    var loss = clamp((km - 80) / 4000, 0, 0.25) * sup, mor = Math.round(clamp((km - 100) / 25, 0, 20) * sup);
    var amb = clamp((km - 150) / 1200, 0, 0.35) * (s.realm.intel < 30 ? 1.5 : s.realm.intel >= 60 ? 0.5 : 1);
    var storm = sea ? clamp(0.3 - s.realm.navy / 350, 0.06, 0.3) : 0;
    return { km: km, days: Math.max(1, Math.round(km / (sea ? 60 : 20))), loss: loss, mor: mor, food: Math.round(km / 100) * 2, amb: amb, storm: storm, sea: sea, from: from };
  };
  P.expText = function (ex) {
    var lv = function (p) { return p < 0.05 ? '낮음' : p < 0.15 ? '보통' : '높음'; };
    return '🧭 <b>원정로</b> — ' + (ex.from ? short(ex.from) + '에서 ' : '') + '약 <b>' + ex.km + 'km</b>' + (ex.sea ? ' (바다 건너)' : '') + ' · ' + ex.days + '일 행군' +
      (ex.loss >= 0.005 ? ' · 행군 손실 예상 <b>' + Math.round(ex.loss * 100) + '%</b>' : '') + (ex.mor ? ' · 피로로 사기 <b>−' + ex.mor + '</b>' : '') + (ex.food ? ' · 추가 군량 ' + ex.food : '') +
      (ex.amb >= 0.02 ? ' · 도중 매복 위험 <b>' + lv(ex.amb) + '</b>' : '') + (ex.storm ? ' · 풍랑 위험 <b>' + Math.round(ex.storm * 100) + '%</b>' : '') +
      (ex.km >= 500 ? '<br><b style="color:#e66">너무 먼 원정입니다.</b> 가까운 성부터 차지해 거점을 넓히면 손실이 줄어듭니다.' : ex.km < 120 ? ' — 가까운 곳이라 부담이 적습니다.' : '');
  };
  var _mm = P.myMorale;
  P.myMorale = function (b) { var v = _mm.apply(this, arguments); return this._march ? Math.max(15, v - this._march.mor) : v; };
  var _fu = P.fieldUnits;
  P.fieldUnits = function () { var a = _fu.apply(this, arguments), m = this._march; if (m && m.simLoss) a.forEach(function (u) { u.n = Math.round(u.n * (1 - m.simLoss)); }); return a; };
  var _sw = P.simWar;
  P.simWar = function (T) { var ex = this.expedition(T); this._march = { mor: ex.mor, simLoss: ex.loss }; try { return _sw.apply(this, arguments); } finally { this._march = null; } };
  var _wfight = P.warFight;
  P.warFight = function (T, frac, tac) {
    var s = this.s, g = this.g, ex = this.expedition(T), A = g.state.army, loss = ex.loss, mor = ex.mor, notes = [];
    if (ex.food) { g.state.res.food = Math.max(0, g.state.res.food - ex.food); }
    if (ex.storm && Math.random() < ex.storm) { var sl = 0.15 + Math.random() * 0.2; loss += sl; mor += 10; notes.push('🌊 <b>풍랑</b> — 바다를 건너던 선단이 폭풍을 만나 병력의 ' + Math.round(sl * 100) + '%를 잃었습니다.'); this.log('원정 선단이 풍랑을 만남'); }
    T._amb = false; T._march = null;
    if (ex.amb && Math.random() < ex.amb) { loss += 0.03; mor += 4; T._amb = true; notes.push('🏹 <b>매복</b> — 먼 길을 가던 군이 적의 매복에 걸렸습니다. 적이 첫 합의 주도권을 쥡니다.'); }
    if (loss > 0) _fu.call(this, frac).forEach(function (u) { if (A[u.id]) A[u.id] = Math.max(0, A[u.id] - Math.round(u.n * loss)); }); // 원정에 나선 부대만 줄어든다
    if (loss >= 0.005 || mor) notes.unshift('🥾 <b>행군</b> — ' + ex.km + 'km·' + ex.days + '일의 원정으로 병력 ' + Math.round(loss * 100) + '% 이탈, 사기 −' + mor + '.');
    if (notes.length) { this.pre = (this.pre || '') + '<div class="freehd">' + notes.join('<br>') + '</div>'; T._march = notes; }
    g.renderArmy(); g.hud();
    this._march = { mor: mor }; try { return _wfight.apply(this, arguments); } finally { this._march = null; }
  };
  var _tune = P.tune;
  P.tune = function (ours, en, bo, ctx, sel) { var r = _tune.apply(this, arguments); if (ctx && ctx.T && ctx.T._amb && sel) en.stance = 'ambush'; return r; };
  var _eng = P.engage;
  P.engage = function (ours, en, bo, ctx, cb) {
    var T = ctx && ctx.T; if (!T || !T._march) return _eng.apply(this, arguments);
    return _eng.call(this, ours, en, bo, ctx, function (r) { if (r.factors) T._march.forEach(function (n) { r.factors.push(n); }); cb(r); });
  };

  /* ── ① 공격 확인 ── */
  P.confirmAttack = function (t, go) {
    var self = this, pl = SG.placeById(t.place), ex = this.expedition(t), side = t.side || this.sides.silla, wrap = h('div', 'modal'), card = h('div', 'card');
    var role = this.roleOf(side), rel = role ? this.s.rel[role] : null;
    card.innerHTML = '<h2>⚔ ' + this.L(t.name) + ' 공격</h2><div class="sub">' + nm(side) + '의 성 · 수비 추정 ' + this.estimate(t.garrison) + '</div>' +
      '<div class="note">' + this.expText(ex) + '</div>' + (rel != null && rel >= 50 && role !== 'silla' ? '<div class="note"><b style="color:#e66">우호국입니다.</b> 공격하면 관계가 무너집니다.</div>' : '') +
      '<p style="margin:12px 0 4px;font-size:16px"><b>정말 이곳을 공격하시겠습니까?</b></p>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px"><button class="btn" id="ca-no">아니오</button><button class="btn pri" id="ca-yes">예, 출병 준비</button></div>';
    $('#ca-no', card).onclick = function () { wrap.remove(); self.s.last = '공격을 거두었습니다.'; self.renderTurn(); };
    $('#ca-yes', card).onclick = function () { wrap.remove(); go(); };
    wrap.appendChild(card); this.g.root.appendChild(wrap);
    if (pl && ex.from) { this.g.map.drawRoute('atk', [ex.from.id, pl.id], this.side, { ms: 900 }); this.g.map.fit([ex.from.id, pl.id], 900, 800); }
  };
  P.onPick = function (t) { var self = this; this.endPick(); this.confirmAttack(t, function () { self.run(self.warCmd(), { target: t.id }); }); };
  var _tip = P.tipInfo;
  P.tipInfo = function (pl) {
    var self = this, r = _tip.apply(this, arguments); if (!r || !r.actions) return r;
    r.actions.forEach(function (a) { if (a.label.indexOf('공격') >= 0) { var t = self.targets().filter(function (x) { return x.place === pl.id; })[0]; if (t) a.fn = function () { self.confirmAttack(t, function () { self.run(self.warCmd(), { target: t.id }); }); }; } });
    return r;
  };
  var _wflow = P.warFlow;
  P.warFlow = function (tid) {
    var r = _wflow.apply(this, arguments), T = this.targetById(tid), card = $('.modal.dock .card');
    if (T && card && $('#wf-t', card)) { var d = h('div', 'note', this.expText(this.expedition(T))); card.insertBefore(d, $('.row', card)); }
    return r;
  };

  /* ── ③ 점령지: 병력과 수입 ── */
  var REC = { capital: 4000, city: 2000, fortress: 1200, port: 1000, pass: 500 }, INC = { capital: [4, 5], city: [2, 3], fortress: [1, 1], port: [2, 1], pass: [0, 0] };
  P.addTroops = function (n) { var A = this.g.state.army, u = this.units, half = Math.round(n / 2); if (u.line) A[u.line] = (A[u.line] || 0) + half; if (u.levy) A[u.levy] = (A[u.levy] || 0) + (n - half); };
  var _cap = P.capturePlace;
  P.capturePlace = function (T) {
    var pl = T && SG.placeById(T.place), had = pl && this.ownerOf(pl) === this.side, r = _cap.apply(this, arguments);
    if (pl && !had) {
      var n = REC[pl.kind] || 800; this.addTroops(n); this.s.held = this.s.held || {}; this.s.held[pl.id] = this.s.year;
      this.pre = (this.pre || '') + '<div class="freehd">🏯 <b>' + short(pl) + ' 편입</b> — 항복한 수비병과 장정 ' + n.toLocaleString() + '명이 아군에 들어왔습니다. 해마다 이곳의 조세와 장정이 보태집니다.</div>';
      this.g.renderArmy(); this.g.hud();
    }
    return r;
  };
  P.holdings = function () {
    var self = this, s = this.s, o = s.owners || {}, gold = 0, food = 0, men = 0, n = 0;
    this.places().forEach(function (pl) { if (o[pl.id] !== self.side || SG.ownerAt(pl, self.cfg.start) === self.side) return; var i = INC[pl.kind] || [1, 1]; gold += i[0]; food += i[1]; men += Math.round((REC[pl.kind] || 800) * 0.08); n++; });
    return { n: n, gold: gold, food: food, men: men };
  };
  var _ye = P.yearEnd;
  P.yearEnd = function () {
    var hd = this.holdings();
    if (hd.n) { var r = this.g.state.res; r.gold += hd.gold; r.food += hd.food; this.addTroops(hd.men); this.pre = (this.pre || '') + '<div class="freehd">🏯 <b>점령지 ' + hd.n + '곳</b> — 조세 금 +' + hd.gold + ' · 군량 +' + hd.food + ' · 장정 ' + hd.men.toLocaleString() + '명 충원</div>'; }
    return _ye.apply(this, arguments);
  };

  /* ── ④ 내 수도 함락: 성이 남아 있으면 천도해 싸움을 잇는다 ── */
  var _init = P.init;
  P.init = function () { var r = _init.apply(this, arguments); this.applyMoved(); return r; };
  P.applyMoved = function () { var s = this.s; if (s && s.capNew) { this.cfg.capPlace = s.capNew; var p = SG.placeById(s.capNew); if (p) this.cfg.cap = short(p); } if (s && s.endNew) this.cfg.end = Math.max(this.cfg.end, s.endNew); };
  P.canRelocate = function () { var cap = this.cfg.capPlace; return (this.s.relocated || 0) < 2 && this.myPlaces().filter(function (p) { return p.id !== cap; }).length >= 4; };
  P.relocate = function (foe, why) {
    var self = this, s = this.s, g = this.g, cap = SG.placeById(this.cfg.capPlace), rest = this.myPlaces().filter(function (p) { return !cap || p.id !== cap.id; });
    var org = (foe && this.foeOrigin(foe)) || cap, cls = function (p) { return p.kind === 'capital' ? 0 : p.kind === 'city' ? 1 : p.kind === 'fortress' ? 2 : 3; };
    rest.sort(function (a, b) { return cls(a) - cls(b) || (cap ? dist(b, cap) - dist(a, cap) : 0); });
    var to = rest[0]; s.owners = s.owners || {};
    if (cap && foe) s.owners[cap.id] = foe; s.owners[to.id] = this.side;
    s.relocated = (s.relocated || 0) + 1; s.capNew = to.id; s.endNew = Math.max(this.cfg.end, s.year + 8); this.applyMoved();
    var role = foe && this.roleOf(foe); if (role) { s.provoked = s.provoked || {}; s.provoked[role] = s.year; }
    var A = g.state.army; for (var k in A) A[k] = Math.round(A[k] * 0.8);
    if (this.freezeMine) this.freezeMine(); s.hy = Math.max(s.hy || 0, s.year); s.shown.__fin = 1;
    var chips = this.eff({ fx: { people: -10, morale: -12 }, realm: { royal: -15, defense: -8, econ: -8 } });
    this.log((cap ? short(cap) : '도성') + ' 함락 — ' + short(to) + '(으)로 천도');
    g.page({ era: s.year + '년', title: '천도 — 항전은 계속된다', body: [
      (why || ((cap ? cap.name : '도성') + '이(가) 함락되었습니다.')),
      '그러나 나라는 끝나지 않았습니다. 아직 <b>' + rest.length + '곳</b>의 성이 우리 깃발 아래 있습니다. 조정은 <b>' + to.name + '</b>(으)로 옮겨 다시 섰습니다.',
      '<div class="note">실제 역사와 다른 길입니다. 병력의 2할이 흩어졌고 왕권과 민심이 크게 흔들렸습니다. 도성을 두 번 더 잃으면(또는 남은 성이 4곳 아래로 줄면) 나라가 무너집니다.</div>' + chips] });
    g.renderArmy(); g.hud(); if (this.drawDeploy) this.drawDeploy(); g.map.focus(to.lon, to.lat, 1500, 900);
    g.choices([{ c: { label: '새 도읍에서 정무를 잇는다', tag: '▶' }, run: function () { if (g.state.res.people <= 0 || s.realm.royal <= 0) return self.collapse(); g.go('__turn__'); } }]);
    return true;
  };
  var _fin = P.finish;
  P.finish = function (kind, extra) {
    var t = (extra && extra.title) || '';
    if (kind === 'conquered' && !/최후|전사|죽음/.test(t) && this.canRelocate()) {
      var foe = null, lv = this.s.lostVs || {}, y = this.s.year; for (var k in lv) if (lv[k] === y) foe = k;
      return this.relocate(foe || this.sides.tang, (extra && extra.text) || null);
    }
    return _fin.apply(this, arguments);
  };
  var _finale = P.finale;
  P.finale = function () {
    var s = this.s, self = this;
    if (s.relocated) return _fin.call(this, null);
    if (this.cfg.id === 'uija' && s.destroyed && s.destroyed.silla && !s.shown.__tangOnly) { // 신라가 없으면 660년은 당의 단독 원정이 된다
      s.shown.__tangOnly = 1; var w = s.world.tang;
      if (w.commit < 45) return _fin.call(this, 'hegemon');
      return this.showInvasion({
        title: '당의 단독 원정 — 660년', noSync: true, defense: true, terrain: 1.25, place: this.cfg.capPlace, last: true,
        enemy: { name: '당 원정군', side: this.sides.tang, total: Math.round(60000 + w.commit * 700), morale: 72, mix: { line: .55, archer: .2, horse: .1, levy: .15 } },
        intro: '신라는 이미 무너졌습니다. 그러나 당 고종은 소정방에게 대군을 주어 바다를 건너게 했습니다. 이번에는 길잡이도, 협공할 동맹도 없는 단독 원정입니다. <b>실제 역사와 다른 660년</b>입니다.',
        tactics: [
          { label: '기벌포에서 상륙을 막는다', hint: '뭍에 오르기 전에 친다. 수군과 방비가 관건.', ours: { terrain: 1.3 + s.realm.navy / 250 } },
          { label: '도성에 의지해 농성한다', hint: '먼 길을 온 적의 군량이 떨어지기를 기다린다.', ours: { terrain: 1.4 + s.realm.defense / 300 } },
          { label: '들에서 결전한다', hint: '점령지에서 모은 대군을 믿는다.', ours: { morale: 6 } }
        ],
        win: { text: ['당의 원정군은 큰 피해를 입고 바다로 물러났습니다. 길잡이 없는 원정은 실패로 끝났습니다.'], fx: { morale: 15, people: 8 }, realm: { royal: 10 }, world: { 'tang.commit': -35 } },
        costly: { text: ['큰 희생을 치렀으나 당군을 바다로 몰아냈습니다.'], fx: { morale: 5, people: -3 }, world: { 'tang.commit': -20 } },
        lose: { text: ['당군이 방어선을 뚫고 도성으로 밀려들었습니다.'], fx: { morale: -10 } },
        loseEnd: { kind: 'conquered', title: '도성 함락', text: '당의 원정군이 도성을 함락했습니다.' }
      });
    }
    return _finale.apply(this, arguments);
  };
  // 의자왕편의 짜인 660년 이야기에서 사비가 함락돼도, 넓힌 땅이 있으면 끝나지 않는다
  var _endUI = SG.Game.prototype.endUI;
  SG.Game.prototype.endUI = function (sc) {
    var sb = this.sb;
    if (sb && sc && sc.kind === 'end' && /멸망/.test(sc.title || '') && !this.state.flags.surrender && sb.canRelocate()) {
      sb.s.year = Math.max(sb.s.year, 660); return sb.relocate(sb.sides.tang, '660년 7월, 나당 연합군에 사비성이 함락되었습니다.');
    }
    return _endUI.apply(this, arguments);
  };
})();

/* ── ⑤ 원정 중 본국 공백: 멀리 보낸 병력은 돌아올 때까지 본국 방어·다른 출병에 쓸 수 없다 ── */
(function () {
  var P = SG.Sandbox.prototype, STAY = { garrison: 1, guard: 1 };
  function $(s, r) { return (r || document).querySelector(s); }
  function short(pl) { return pl ? pl.name.replace(/\(.*?\)/g, '').trim() : '먼 곳'; }
  P.awayNow = function () { var a = this.s.away; return a && this.s.year <= a.until && a.frac > 0.01 ? a : null; };
  P.holdOf = function (ex) { return ex.sea || ex.km >= 500 ? 1 : ex.km >= 300 ? 0.7 : ex.km >= 150 ? 0.4 : 0; };

  var _fu = P.fieldUnits;
  P.fieldUnits = function () {
    var a = _fu.apply(this, arguments), w = this.awayNow(); if (!w) return a;
    a.forEach(function (u) { var U = SG.unitById(u.id); if (U && !STAY[U.base]) u.n = Math.round(u.n * (1 - w.frac)); });
    return a.filter(function (u) { return u.n > 0; });
  };
  var _lt = P.landTotal;
  P.landTotal = function () { var t = _lt.apply(this, arguments), w = this.awayNow(); return w ? Math.max(0, t - w.n) : t; };

  var _wf = P.warFight;
  P.warFight = function (T, frac, tac) {
    var s = this.s, ex = this.expedition(T), hold = this.holdOf(ex), sent = Math.round(this.fieldUnits(frac).reduce(function (t, u) { return t + u.n; }, 0));
    var r = _wf.apply(this, arguments);
    if (hold) {
      var prev = this.awayNow(), pf = prev ? prev.frac : 0, add = (1 - pf) * frac * hold;
      s.away = { frac: Math.min(0.95, pf + add), n: (prev ? prev.n : 0) + Math.round(sent * hold), place: T.place, year: s.year, until: s.year + (ex.sea && ex.km >= 500 ? 1 : 0) };
    }
    return r;
  };

  // 본국이 빈 틈을 이웃이 노린다
  var _inv = P.invasion;
  P.invasion = function () {
    var w = this.awayNow(), ws = this.s.world.silla, boost = w && w.frac >= 0.35 ? 30 : 0, inv;
    ws.hostility += boost; try { inv = _inv.apply(this, arguments); } finally { ws.hostility -= boost; }
    if (inv && boost) inv.intro += ' <b>원정으로 본국이 빈 틈을 노린 침공입니다.</b> 남은 병력과 성 수비대만으로 막아야 합니다.';
    return inv;
  };

  var _dd = P.drawDeploy;
  P.drawDeploy = function () {
    var r = _dd.apply(this, arguments), w = this.awayNow(), pl = w && SG.placeById(w.place);
    if (w && pl && this.g.map) this.g.map.setToken('own_away', this.side, '원정', (Math.round(w.n / 100) / 10) + '천', pl.lon, pl.lat, 'own');
    return r;
  };
  var _rt = P.renderTurn;
  P.renderTurn = function () {
    var w = this.awayNow();
    if (w && !this.skipping) {
      var home = this.fieldUnits(1, true).reduce(function (t, u) { return t + u.n; }, 0);
      this.pre = (this.pre || '') + '<div class="freehd">🚩 <b>원정군 약 ' + w.n.toLocaleString() + '명</b>이 ' + short(SG.placeById(w.place)) + ' 방면에 나가 있습니다 (' + (w.until > this.s.year ? '내년 말' : '올해 말') + ' 귀환). 그동안 본국을 지킬 수 있는 병력은 수비대를 합쳐 약 <b>' + home.toLocaleString() + '명</b>뿐이며, 이웃이 빈틈을 노릴 수 있습니다.</div>';
    }
    return _rt.apply(this, arguments);
  };
  // 출병 창: 동원 비율에 따라 본국에 남는 병력을 보여 준다
  var _wflow = P.warFlow;
  P.warFlow = function (tid) {
    var self = this, r = _wflow.apply(this, arguments), T = this.targetById(tid), card = $('.modal.dock .card'), sl = card && $('#wf-r', card);
    if (!T || !sl) return r;
    var ex = this.expedition(T), hold = this.holdOf(ex), d = document.createElement('div'); d.className = 'note'; card.insertBefore(d, $('#wf-t', card));
    function upd() {
      var fr = +sl.value / 100, all = self.fieldUnits(1, true), tot = all.reduce(function (t, u) { return t + u.n; }, 0), stay = 0;
      all.forEach(function (u) { var U = SG.unitById(u.id); stay += U && STAY[U.base] ? u.n : u.n * (1 - fr * hold); });
      d.innerHTML = hold ? '🚩 <b>본국 공백</b> — 이 원정군은 ' + (ex.sea && ex.km >= 500 ? '내년 말' : '올해 말') + '까지 돌아오지 못합니다. 그동안 본국에 남는 병력은 약 <b>' + Math.round(stay).toLocaleString() + '명</b> (전체 ' + tot.toLocaleString() + '명 중). 침공을 받으면 이 병력으로 막아야 합니다.'
        : '🚩 가까운 곳이라 싸움이 끝나면 곧 돌아옵니다. 본국 수비에 공백이 생기지 않습니다.';
    }
    sl.addEventListener('input', upd); upd();
    return r;
  };
})();
