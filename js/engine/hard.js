/* 난이도(어려움): 좋은 선택도 실패할 수 있고, 적은 더 강하며, 전투에는 운이 따른다. 수치는 SG.HARD 에서 조절. */
(function () {
  var P = SG.Sandbox.prototype;
  var H = SG.HARD = {
    cmdFail: 0.14, cmdHalf: 0.18,   // 정무 명령: 완전 실패 / 절반의 성과 (기본 확률, 왕권·민심이 낮으면 더 오름)
    evFail: 0.22,                   // 사건 선택지의 좋은 효과가 무산될 확률
    foe: 1.2, foeDef: 1.12,         // 적 병력 배수 (모든 전투 / 내가 방어할 때 추가)
    luckA: [0.8, 0.35], luckB: [0.92, 0.3], // 전운: 아군 0.80~1.15, 적 0.92~1.22
    drift: 1                        // 해마다 왕권·사기가 저절로 새는 양
  };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  // 효과 묶음에서 '얻는 것'만 k배로 줄인다(잃는 것·비용은 그대로)
  function weaken(e, k) {
    if (!e) return e; var o = Object.assign({}, e);
    ['fx', 'realm', 'rel', 'army'].forEach(function (key) { if (!e[key]) return; var m = {}; for (var x in e[key]) { var v = e[key][x]; m[x] = v > 0 ? Math.round(v * k) : v; } o[key] = m; });
    return o;
  }
  function hasGain(e) { var g = false; ['fx', 'realm', 'rel', 'army'].forEach(function (key) { for (var x in (e && e[key]) || {}) if (e[key][x] > 0) g = true; }); return g; }
  var FAIL = ['명은 내려졌으나 아래에서 일이 틀어졌습니다. 들인 재물과 시간만 날렸습니다.', '담당 관리들의 다툼과 태만으로 일은 흐지부지되었습니다.', '뜻은 좋았으나 때가 맞지 않았습니다. 아무 성과 없이 끝났습니다.', '귀족들이 겉으로만 따르고 속으로는 움직이지 않았습니다.'];

  /* ── 정무 명령의 실패 ── */
  var _run = P.run;
  P.run = function (c, opt) {
    var s = this.s;
    if (c && !c.needs && c.eff && hasGain(c.eff) && !this.cmdAvail(c)) {
      var bad = clamp((50 - s.realm.royal) / 300, -0.05, 0.12) + (this.g.state.res.people < 40 ? 0.05 : 0), r = Math.random();
      if (r < clamp(H.cmdFail + bad, 0.06, 0.35)) return _run.call(this, Object.assign({}, c, { eff: weaken(c.eff, 0), fn: null, lines: ['<b style="color:#e66">실패</b> — ' + pick(FAIL)] }), opt);
      if (r < clamp(H.cmdFail + bad, 0.06, 0.35) + H.cmdHalf) return _run.call(this, Object.assign({}, c, { eff: weaken(c.eff, 0.5), lines: [(c.lines ? pick(c.lines) : '') + ' <b>그러나 성과는 기대의 절반에 그쳤습니다.</b>'] }), opt);
    }
    return _run.apply(this, arguments);
  };

  /* ── 사건: 좋은 선택도 빗나간다 ── */
  var _pe = P.pickEvent;
  P.pickEvent = function (ev, c) {
    var gain = hasGain(c) || !!c.fn;
    if (gain && Math.random() < H.evFail) {
      var c2 = weaken(c, 0); c2.result = (c.result ? c.result + ' ' : '') + '<b style="color:#e66">그러나 일은 뜻대로 풀리지 않았습니다.</b> 기대한 성과는 없었습니다.';
      if (c.fn) c2.fn = function (S) { var o = c.fn(S); if (o) { o = weaken(o, 0); o.text = (o.text ? o.text + ' ' : '') + c2.result; } return o; };
      return _pe.call(this, ev, c2);
    }
    return _pe.apply(this, arguments);
  };

  /* ── 더 강한 적 ── */
  var _eu = P.enemyUnits;
  P.enemyUnits = function (side, total, mix) { return _eu.call(this, side, Math.round(total * H.foe), mix); };
  var _eo = P.enemyOf;
  P.enemyOf = function (bt) {
    var en = _eo.apply(this, arguments);
    if (bt && bt.defense) { en.units.forEach(function (u) { u.n = Math.round(u.n * H.foeDef); }); en.morale = Math.min(95, (en.morale || 70) + 4); }
    return en;
  };

  /* ── 권력은 가만두면 샌다 ── */
  var _ye = P.yearEnd;
  P.yearEnd = function () {
    var s = this.s, res = this.g.state.res;
    if (s.realm.royal > 40) s.realm.royal -= H.drift; if (res.morale > 50) res.morale -= H.drift; if (res.people > 55) res.people -= H.drift;
    return _ye.apply(this, arguments);
  };
})();
