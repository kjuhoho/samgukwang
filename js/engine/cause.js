/* 납득할 수 있는 전개: 침공에는 이유가 있어야 하고, 멸망한 나라는 움직이지 않으며, 외교는 실제로 효과가 있다.
   이야기(사건)도 지금의 천하에 맞춰 걸러진다. */
(function () {
  var P = SG.Sandbox.prototype, ROLES = ['silla', 'goguryeo', 'tang', 'wa'];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // 침공의 이유(없으면 침공은 일어나지 않는다)
  P.invCause = function (role) {
    var s = this.s, y = s.year, w = s.world[role], r = [], N = this.names;
    if (!w) return r;
    var pv = s.provoked && s.provoked[role];
    if (pv && y - pv <= 8) r.push('우리가 ' + pv + '년에 그 땅을 친 일에 대한 보복');
    if (s.rel[role] < 30) r.push('양국 관계가 ' + Math.round(s.rel[role]) + '까지 식어 더는 외교로 달랠 수 없는 지경');
    if (role === 'tang' ? w.commit >= 45 : w.hostility >= 55) r.push(role === 'tang' ? N.tang + '이(가) 우리의 팽창을 경계해 군을 모아 온 끝' : '오래 쌓인 적의가 터진 것');
    var aw = this.awayNow && this.awayNow(); if (aw && aw.frac >= 0.35) r.push('원정으로 본국이 빈 틈');
    if (s.realm.defense < 30) r.push('우리 변경의 방비가 허술한 것');
    if (role === 'wa' && s.realm.navy < 30) r.push('수군이 약해 해안이 비어 있는 것');
    if (role === 'silla' && this.dominance && this.dominance() >= 4) r.push('우리가 너무 커져 이웃이 위협을 느낀 것');
    return r;
  };

  var _inv = P.invasion;
  P.invasion = function () {
    var self = this, s = this.s, y = s.year, saved = [];
    s.threat = s.threat || {};
    // 멸망했거나 사실상 무너진 나라는 적의도 의지도 없다
    ROLES.forEach(function (k) { var w = s.world[k]; if (w && self.sides[k] !== self.side && !self.roleAlive(k)) { saved.push([w, w.hostility, w.commit]); w.hostility = 0; w.commit = 0; } });
    var inv; try { inv = _inv.apply(this, arguments); } finally { saved.forEach(function (x) { x[0].hostility = x[1]; x[0].commit = x[2]; }); }
    if (!inv || inv.coalition) return inv;
    var role = inv.enemy && this.roleOf(inv.enemy.side);
    if (role && !this.roleAlive(role)) return null;
    // 잦은 침공 방지: 연합군 외에는 3년에 한 번 이하
    if (s.threat.lastAny != null && y - s.threat.lastAny < 3) return null;
    if (role) {
      var rel = s.rel[role], pv = s.provoked && s.provoked[role];
      if (rel >= 60 && !(pv && y - pv <= 3) && Math.random() < 0.8) return null; // 관계가 좋으면 칼을 거둔다
      var why = this.invCause(role);
      if (!why.length) return null;                                              // 이유 없는 침공은 없다
      inv.intro += ' <br><small>📌 이유 — ' + why.slice(0, 2).join(' · ') + '.</small>';
    }
    s.threat.lastAny = y;
    return inv;
  };

  // 사건: 멸망·붕괴한 나라가 등장하는 이야기는 일어나지 않는다
  var _re = P.rollEvents;
  P.rollEvents = function () {
    var self = this, dead = {};
    [['rival', 'silla'], ['ally', 'goguryeo'], ['great', 'tang'], ['far', 'wa']].forEach(function (x) { if (self.sides[x[1]] !== self.side && !self.roleAlive(x[1])) dead[x[0]] = 1; });
    if (!Object.keys(dead).length) return _re.apply(this, arguments);
    var all = SG.data.events, keep = [];
    try {
      var out = _re.apply(this, arguments).filter(function (it) {
        if (!it.ev) return true;
        var src = JSON.stringify(it.ev, function (k, v) { return typeof v === 'function' ? String(v) : v; });
        return !Object.keys(dead).some(function (k) { return src.indexOf('{' + k + '}') >= 0; });
      });
      return out;
    } catch (e) { return _re.apply(this, arguments); }
  };

  // 관계가 나빠지면 미리 알려 준다(외교로 풀 기회)
  var _ye = P.yearEnd;
  P.yearEnd = function () {
    var self = this, s = this.s, N = this.names; s.threat = s.threat || {}; s.threat.warned = s.threat.warned || {};
    ROLES.forEach(function (k) {
      var w = s.world[k]; if (!w || !self.roleAlive(k)) return;
      var bad = s.rel[k] < 35 && (k === 'tang' ? w.commit >= 30 : w.hostility >= 40);
      if (bad && s.year - (s.threat.warned[k] || -9) >= 4) {
        s.threat.warned[k] = s.year;
        self.pre = (self.pre || '') + '<div class="freehd">🕯 <b>' + N[k] + '와의 관계 악화</b> (관계 ' + Math.round(s.rel[k]) + ') — 변경에서 긴장이 높아지고 있습니다. 조공·화친·혼인 같은 외교로 풀지 않으면 곧 군사 충돌로 번질 수 있습니다.</div>';
      }
    });
    return _ye.apply(this, arguments);
  };
})();
