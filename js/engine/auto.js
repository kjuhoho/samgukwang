/* 맡기기(자동 진행): 한 해의 정무를 무작위 또는 균형 있게 대신 처리하고 해를 넘긴다. */
(function () {
  var P = SG.Sandbox.prototype;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // 정세(적의·개입)와 시대에 따른 가중치: 전쟁이 가까울수록 방비·훈련·첩보를, 평온할수록 산업·민심을 우선한다
  function clampv(v, a, b) { return Math.max(a, Math.min(b, v)); }
  P.autoTemper = function () {
    var s = this.s, w = s.world || {}, y = s.year;
    var thr = Math.max((w.silla || {}).hostility || 0, (w.goguryeo || {}).hostility || 0, (w.tang || {}).commit || 0);
    var war = clampv((thr - 25) / 50, 0, 1);
    var m = { defense: 1 + war * 0.9, train: 1 + war * 0.8, intel: 1 + war * 0.4 + (((w.tang || {}).commit || 0) >= 25 ? 0.3 : 0), econ: 1 - war * 0.35, royal: 1, navy: y >= 640 ? 1.35 : y < 500 ? 0.55 : 1 };
    if (y < 450) { m.navy *= 0.8; m.intel *= 0.85; }   // 이른 시기엔 수군·첩보 조직이 크지 않다
    if (y >= 660) { m.defense *= 1.15; m.navy *= 1.1; }   // 나당 전쟁기에는 방비·수군이 곧 생존
    return { war: war, m: m };
  };
  // 균형 모드: 지금 가장 부족한 수치를 메우는 명령일수록 점수가 높다. 정세와 시대에 맞춰 가중한다.
  P.autoScoreEff = function (e, cost) {
    var s = this.s, res = this.g.state.res, sc = 0, k, v, tp = this.autoTemper(), m = tp.m;
    e = e || {};
    for (k in (e.realm || {})) { v = e.realm[k]; sc += (v > 0 ? v * Math.max(0.15, (75 - (s.realm[k] || 0)) / 50) : v * 1.2) * (m[k] || 1); }
    for (k in (e.fx || {})) {
      v = e.fx[k];
      if (k === 'people' || k === 'morale') sc += v > 0 ? v * Math.max(0.15, (75 - res[k]) / 40) : v * 1.5;
      else if (k === 'gold' || k === 'food') sc += v * (res[k] < 20 ? 0.5 : res[k] < 40 ? 0.2 : 0.12) * (k === 'food' && tp.war > 0.4 ? 1.3 : 1);
    }
    for (k in (e.rel || {})) { v = e.rel[k]; if (s.rel[k] != null) sc += v > 0 ? v * Math.max(0, (60 - s.rel[k]) / 100) : v * 0.3; }
    for (k in (e.world || {})) {
      v = e.world[k];
      if (/hostility|commit/.test(k)) sc -= v * 0.25;
      else if (/\.p$/.test(k)) sc -= v * 0.08 * (tp.war > 0.4 ? 1.5 : 1);   // 적의 국력이 꺾이면 전시에 더 이득
    }
    for (k in (e.army || {})) sc += e.army[k] / 1000 * (tp.war > 0.3 ? 1.4 : 0.8);
    for (k in (cost || {})) sc -= cost[k] * (res[k] < 25 ? 0.3 : 0.08);
    return sc;
  };
  P.autoScore = function (c) {
    var sc = this.autoScoreEff(c.eff, c.cost);
    if (c.risk) sc -= c.risk.p * 6;
    var rec = (this.s.autoRecent || {})[c.id]; if (rec && this.s.year - rec <= 2) sc -= 1.2;   // 같은 명령만 반복하지 않게
    return sc;
  };
  // 사건의 선택지를 기댓값으로 채점(주사위 갈림은 양쪽 결과의 평균)
  P.autoChoiceScore = function (c) {
    var self = this, ctx = this.ctx(), parts = [c];
    if (c.fn) { try { var a = c.fn(Object.assign({}, ctx, { roll: function () { return 0; } })), b = c.fn(Object.assign({}, ctx, { roll: function () { return 0.999; } })); parts = [Object.assign({}, c, a, { fx: Object.assign({}, c.fx || {}, a && a.fx || {}) }), Object.assign({}, c, b, { fx: Object.assign({}, c.fx || {}, b && b.fx || {}) })]; } catch (x) { parts = [c]; } }
    var tot = 0; parts.forEach(function (p) { tot += self.autoScoreEff(p, null); });
    return tot / parts.length;
  };
  P.autoEvent = function (ev) {
    var self = this, g = this.g, res = g.state.res, best = null, bs = -1e9, ok = ev.choices.filter(function (c) { return !(c.fx && ((c.fx.gold < 0 && res.gold < -c.fx.gold) || (c.fx.food < 0 && res.food < -c.fx.food))); });
    (ok.length ? ok : ev.choices).forEach(function (c) { var v = self.autoChoiceScore(c); if (v > bs) { bs = v; best = c; } });
    var e = best; if (best.fn) { var o = best.fn(this.ctx()); if (o) e = Object.assign({}, best, o, { fx: Object.assign({}, best.fx || {}, o.fx || {}) }); }
    this.eff(e); g.state.dec++;
    var t = this.L(ev.title) + ' — ' + this.L(best.label); this.log(t);
    this.autoLog = this.autoLog || { from: this.s.year, names: {} }; (this.autoLog.events = this.autoLog.events || []).push(this.s.year + '년 ' + t);
  };
  P.autoPick = function (mode, used) {
    var self = this, list = this.cmds().filter(function (c) { return !c.needs && !used[c.id] && !self.cmdAvail(c) && (c.eff || mode === 'random'); });
    if (!list.length) return null;
    if (mode === 'random') return list[Math.floor(Math.random() * list.length)];
    var best = null, bs = 0.5; list.forEach(function (c) { var v = self.autoScore(c); if (v > bs) { bs = v; best = c; } });
    return best;
  };
  // 올해 행동력을 다 쓴다. 나라가 무너지면 false
  P.autoSpend = function (mode) {
    var s = this.s, res = this.g.state.res, used = {}, c, n = 0, real = this.renderTurn;
    this.renderTurn = function () { }; this.autoLog = this.autoLog || { from: s.year, names: {} };
    try {
      while (s.ap > 0 && n++ < (mode === 'balanced' ? 2 : 6) && (c = this.autoPick(mode, used))) {
        used[c.id] = 1; (s.autoRecent = s.autoRecent || {})[c.id] = s.year; var nm = this.L(c.name); this.run(c);
        this.autoLog.names[nm] = (this.autoLog.names[nm] || 0) + 1;
        if (res.people <= 0 || s.realm.royal <= 0) { delete this.renderTurn; return false; }
      }
    } finally { delete this.renderTurn; }
    s.last = ''; this.autoLog.to = s.year;
    return true;
  };
  P.autoGo = function (mode, cont) {
    this.autoMode = mode; this.skipping = !!cont; this.autoEvOn = !!this.autoEv; this.autoLog = null; this.yearEnd();
  };
  var _ye = P.yearEnd;
  P.yearEnd = function () {
    if (this.autoMode) { if (!this.autoSpend(this.autoMode)) { this.autoMode = null; this.skipping = false; return; } if (!this.skipping) this.autoMode = null; }
    return _ye.apply(this, arguments);
  };
  var _ne = P.nextEvent;
  P.nextEvent = function () {
    var it = this.chain && this.chain[0];
    if (this.autoEvOn && it && it.ev) {
      this.chain.shift(); this.s.used[it.ev.id] = this.s.year; this.s.stats.events++; this.summary = null;
      this.autoEvent(it.ev);
      if (this.g.state.res.people <= 0 || this.s.realm.royal <= 0) return this.collapse();
      return this.nextEvent();
    }
    return _ne.apply(this, arguments);
  };
  var _rt = P.renderTurn;
  P.renderTurn = function () {
    if (!this.skipping) { this.autoMode = null; this.autoEvOn = false; }
    var L = this.autoLog;
    if (L && !this.autoMode) {
      var a = Object.keys(L.names).map(function (k) { return k + (L.names[k] > 1 ? ' ×' + L.names[k] : ''); });
      this.pre = '<div class="freehd">🤖 <b>맡긴 정무</b> (' + (L.from === L.to ? L.from + '년' : L.from + '~' + L.to + '년') + ') — ' + (a.length ? a.join(' · ') : '쓸 만한 명령이 없어 그대로 해를 넘겼습니다.') + (L.events && L.events.length ? '<br>🤖 <b>맡긴 사건</b> — ' + L.events.join(' · ') : '') + '</div>' + (this.pre || '');
      this.autoLog = null;
    }
    return _rt.apply(this, arguments);
  };
  var _dc = P.drawChoices;
  P.drawChoices = function () {
    _dc.apply(this, arguments);
    var self = this, top = document.querySelector('#chron .choices .cmdtop'); if (!top || !top.querySelector('.endyear')) return;
    var box = h('div', 'autobar', '<span>🤖 맡기기</span>');
    var b1 = h('button', 'btn', '⚖ 균형 있게'); b1.title = '지금 가장 부족한 부분(민심·훈련·방비·재정 등)을 메우는 명령을 골라 올해 정무를 처리하고 해를 넘깁니다. 신하에게 맡기면 한 해에 2건까지만 처리합니다(직접 다스리는 것보다 느림).';
    var b2 = h('button', 'btn', '🎲 무작위로'); b2.title = '가능한 명령 중 아무거나 골라 올해 정무를 처리하고 해를 넘깁니다.';
    var lb = h('label', '', '<input type="checkbox"' + (this.autoCont ? ' checked' : '') + '> 사건이 생길 때까지 계속');
    var cb = lb.querySelector('input'); cb.onchange = function () { self.autoCont = cb.checked; };
    var lb2 = h('label', '', '<input type="checkbox"' + (this.autoEv ? ' checked' : '') + '> 사건 선택도 맡기기'); lb2.title = '해를 넘길 때 생기는 사건의 선택지도 정세와 시대에 맞춰 균형 있게 골라 줍니다. 외적의 침공(전술 선택)은 직접 정합니다.';
    var cb2 = lb2.querySelector('input'); cb2.onchange = function () { self.autoEv = cb2.checked; };
    b1.onclick = function () { self.autoGo('balanced', cb.checked); }; b2.onclick = function () { self.autoGo('random', cb.checked); };
    box.appendChild(b1); box.appendChild(b2); box.appendChild(lb); box.appendChild(lb2); top.appendChild(box);
  };
})();
