/* 맡기기(자동 진행): 한 해의 정무를 무작위 또는 균형 있게 대신 처리하고 해를 넘긴다. */
(function () {
  var P = SG.Sandbox.prototype;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // 균형 모드: 지금 가장 부족한 수치를 메우는 명령일수록 점수가 높다
  P.autoScore = function (c) {
    var s = this.s, res = this.g.state.res, e = c.eff || {}, sc = 0, k, v;
    for (k in (e.realm || {})) { v = e.realm[k]; sc += v > 0 ? v * Math.max(0.15, (75 - (s.realm[k] || 0)) / 50) : v * 1.2; }
    for (k in (e.fx || {})) {
      v = e.fx[k];
      if (k === 'people' || k === 'morale') sc += v > 0 ? v * Math.max(0.15, (75 - res[k]) / 40) : v * 1.5;
      else if (k === 'gold' || k === 'food') sc += v * (res[k] < 20 ? 0.5 : 0.12);
    }
    for (k in (e.rel || {})) { v = e.rel[k]; if (s.rel[k] != null) sc += v > 0 ? v * Math.max(0, (60 - s.rel[k]) / 100) : v * 0.3; }
    for (k in (e.world || {})) { v = e.world[k]; if (/hostility|commit/.test(k)) sc -= v * 0.25; }
    for (k in (c.cost || {})) sc -= c.cost[k] * (res[k] < 25 ? 0.3 : 0.08);
    if (c.risk) sc -= c.risk.p * 6;
    return sc;
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
        used[c.id] = 1; var nm = this.L(c.name); this.run(c);
        this.autoLog.names[nm] = (this.autoLog.names[nm] || 0) + 1;
        if (res.people <= 0 || s.realm.royal <= 0) { delete this.renderTurn; return false; }
      }
    } finally { delete this.renderTurn; }
    s.last = ''; this.autoLog.to = s.year;
    return true;
  };
  P.autoGo = function (mode, cont) {
    this.autoMode = mode; this.skipping = !!cont; this.autoLog = null; this.yearEnd();
  };
  var _ye = P.yearEnd;
  P.yearEnd = function () {
    if (this.autoMode) { if (!this.autoSpend(this.autoMode)) { this.autoMode = null; this.skipping = false; return; } if (!this.skipping) this.autoMode = null; }
    return _ye.apply(this, arguments);
  };
  var _rt = P.renderTurn;
  P.renderTurn = function () {
    if (!this.skipping) this.autoMode = null;
    var L = this.autoLog;
    if (L && !this.autoMode) {
      var a = Object.keys(L.names).map(function (k) { return k + (L.names[k] > 1 ? ' ×' + L.names[k] : ''); });
      this.pre = '<div class="freehd">🤖 <b>맡긴 정무</b> (' + (L.from === L.to ? L.from + '년' : L.from + '~' + L.to + '년') + ') — ' + (a.length ? a.join(' · ') : '쓸 만한 명령이 없어 그대로 해를 넘겼습니다.') + '</div>' + (this.pre || '');
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
    b1.onclick = function () { self.autoGo('balanced', cb.checked); }; b2.onclick = function () { self.autoGo('random', cb.checked); };
    box.appendChild(b1); box.appendChild(b2); box.appendChild(lb); top.appendChild(box);
  };
})();
