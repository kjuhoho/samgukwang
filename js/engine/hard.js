/* 난이도(어려움): 좋은 선택도 실패할 수 있고, 적은 더 강하며, 전투에는 운이 따른다. 수치는 SG.HARD 에서 조절. */
(function () {
  var P = SG.Sandbox.prototype;
  var H = SG.HARD = {
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
  /* ── 실패는 국정 능력에서 나온다 ──
     능력치 = 해당 분야 수치 35% + 왕권 25% + 민심 20% + 재정 20%. 높으면 실패 4~5%, 낮으면 40%대까지 오른다.
     실패했을 때는 가장 모자란 항목을 이유로 보여 준다. 순수한 운은 거의 남기지 않는다. */
  var FIELD = { // 명령별로 가장 중요한 분야 수치
    farm: 'econ', tunjeon: 'econ', census: 'econ', officials: 'econ', academy: 'econ',
    drill: 'train', parade: 'train', elite: 'train', standing: 'train', iron: 'train', horse: 'train', archers: 'train', mercenary: 'train',
    fortify: 'defense', navy: 'navy', scouts: 'intel', espionage: 'intel', assassinate: 'intel',
    relief: 'people', levy: 'people', temple: 'people', ritual: 'people', feast: 'morale', amnesty: 'people',
    court_gift: 'royal', purge: 'royal', palace: 'royal', guard: 'royal'
  };
  var FNAME = { econ: '농정 기반', train: '군의 훈련', defense: '방비 체계', navy: '수군 기반', intel: '첩보망', royal: '왕권', people: '민심', morale: '군의 사기', fin: '재정' };
  var WHY = {
    royal: '왕권이 약해 귀족들이 명을 따르지 않았습니다.', people: '민심이 흉흉해 백성을 동원하기 어려웠습니다.', fin: '재정이 바닥나 일을 뒷받침할 재물이 모자랐습니다.',
    econ: '농정 기반이 허약해 일이 현장까지 닿지 않았습니다.', train: '군의 훈련과 기강이 부족해 장수들이 명을 소화하지 못했습니다.', defense: '방비 체계가 허술해 공사가 제대로 진척되지 않았습니다.',
    navy: '수군 기반이 약해 배와 인력이 따라 주지 않았습니다.', intel: '첩보망이 허술해 정보와 연락이 어긋났습니다.', morale: '군의 사기가 가라앉아 호응이 없었습니다.', luck: '예상치 못한 작은 차질들이 겹쳤습니다.'
  };
  function stat(S, key) {
    var s = S.s, res = S.g.state.res;
    if (key === 'fin') return clamp(res.gold * 1.5, 0, 100);
    if (key === 'people') return res.people; if (key === 'morale') return res.morale;
    return s.realm[key] != null ? s.realm[key] : 50;
  }
  // 능력 평가: {ab: 0~100, why: 가장 모자란 항목의 이유, low: 그 항목}
  function assess(S, c) {
    var fk = FIELD[c && c.id] || 'royal', own = fk === 'royal' || fk === 'people';
    var W = own ? { royal: 0.4, people: 0.3, fin: 0.3 } : {}, parts;
    if (!own) { W[fk] = 0.35; W.royal = (fk === 'royal') ? 0 : 0.25; W.people = 0.2; W.fin = 0.2; }
    var ab = 0, worst = null, wd = 3;
    for (var k in W) { if (!W[k]) continue; var v = stat(S, k); ab += v * W[k]; var d = (60 - v) * W[k] / 0.25; if (d > wd) { wd = d; worst = k; } }
    return { ab: ab, key: worst || 'luck', val: worst ? Math.round(stat(S, worst)) : 0 };
  }
  function failP(ab, ev) {
    var f = ev ? 3 + Math.max(0, 65 - ab) * 0.45 + Math.max(0, 35 - ab) * 0.4 : 4 + Math.max(0, 70 - ab) * 0.5 + Math.max(0, 40 - ab) * 0.4;
    return clamp(f, ev ? 3 : 4, ev ? 45 : 55) / 100;
  }
  function reason(a) { return (a.key === 'luck' ? '' : '<small>(' + FNAME[a.key] + ' ' + a.val + ')</small> ') + WHY[a.key]; }
  P.cmdOdds = function (c) { var a = assess(this, c), f = failP(a.ab), h = f * 0.7; return { fail: f, half: h, ok: 1 - f - h, a: a }; };

  /* ── 정무 명령의 실패 ── */
  var _run = P.run;
  P.run = function (c, opt) {
    if (c && !c.needs && c.eff && hasGain(c.eff) && !this.cmdAvail(c)) {
      var o = this.cmdOdds(c), r = Math.random();
      if (r < o.fail) return _run.call(this, Object.assign({}, c, { eff: weaken(c.eff, 0), fn: null, risk: null, lines: ['<b style="color:#e66">실패</b> — ' + reason(o.a) + ' 들인 재물과 시간만 날렸습니다.'] }), opt);
      if (r < o.fail + o.half) return _run.call(this, Object.assign({}, c, { eff: weaken(c.eff, 0.5), lines: [(c.lines ? pick(c.lines) : '') + ' <b style="color:#d93">그러나 ' + reason(o.a) + ' 성과는 기대의 절반에 그쳤습니다.</b>'] }), opt);
    }
    return _run.apply(this, arguments);
  };
  // 명령 목록에 성공률을 보여 준다
  var _ct = P.costText;
  P.costText = function (c) {
    var t = _ct.apply(this, arguments);
    if (c && !c.needs && c.eff && hasGain(c.eff)) { var o = this.cmdOdds(c); t += ' · 성공 ' + Math.round(o.ok * 100) + '%'; }
    return t;
  };

  /* ── 사건: 선택의 성패도 국정 능력에 달렸다 ── */
  var _pe = P.pickEvent;
  P.pickEvent = function (ev, c) {
    var gain = hasGain(c) || !!c.fn;
    if (gain) {
      var a = assess(this, { id: '_ev' }); a = { ab: a.ab, key: a.key, val: a.val };
      if (Math.random() < failP(a.ab, true)) {
        var c2 = weaken(c, 0); c2.result = (c.result ? c.result + ' ' : '') + '<b style="color:#e66">그러나 일은 뜻대로 풀리지 않았습니다.</b> ' + reason(a);
        if (c.fn) c2.fn = function (S) { var o = c.fn(S); if (o) { o = weaken(o, 0); o.text = (o.text ? o.text + ' ' : '') + c2.result; } return o; };
        return _pe.call(this, ev, c2);
      }
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
