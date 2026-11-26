/* 속도 모듈: 같은 결과를 되풀이해서 계산하던 곳을 줄인다. 게임 규칙·결과·화면은 그대로이고 처리 시간만 줄어든다.
 *  ① 배치도(drawDeploy)를 그리는 동안은 게임 상태가 바뀌지 않으므로, 성 목록(places)·내 성 목록(myPlaces)·공격 대상(targets)을
 *     한 번만 계산해 재사용한다. (전에는 적 병력 표시 하나마다 전체를 다시 계산해서, 한 번 그릴 때 성 목록을 385번,
 *     성 주인 확인을 24,000번 되풀이했다.)
 *  ② 영토 색칠(setDynTerritory)은 입력(성 위치·소유 세력)이 직전과 같고 그려 둔 그림이 그대로 남아 있으면 다시 계산하지 않는다.
 *  ③ 이미 보여 준 진군선을 다시 그릴 때(ms가 1)는 '그려지는 연출'과 강제 레이아웃 계산을 건너뛰고 바로 점선 상태로 둔다.
 * SG.perf.on = false 로 두면 모두 원래 동작으로 돌아간다(시험·비교용).
 * 다른 모듈이 drawDeploy 등을 모두 감싼 뒤, 가장 바깥에서 감싸야 하므로 endless.js 다음에 불러온다. */
(function () {
  var PF = SG.perf = SG.perf || { on: true };
  PF.stat = PF.stat || { terrSkip: 0, routeFast: 0 };
  var P = SG.Sandbox.prototype, M = SG.Map && SG.Map.prototype;

  /* ① 배치도를 그리는 동안만 쓰는 임시 기억(this._pfm). 그리기가 끝나면 지운다.
        첫 번째 계산은 기억하지 않고 그대로 돌려준다 — 처음 한 번은 이웃 나라 상태(aidev 의 nat)처럼 계산 도중 숨은 초기화가
        일어나, 두 번째부터의 결과와 아주 조금 다를 수 있기 때문이다. 원래도 첫 호출만 그렇게 달랐으므로 순서까지 똑같이 남는다. */
  ['places', 'myPlaces', 'targets'].forEach(function (k) {
    var f = P[k]; if (typeof f !== 'function') return;
    P[k] = function () {
      var m = this._pfm; if (!m || !PF.on || arguments.length) return f.apply(this, arguments);
      var c = m[k] || (m[k] = { n: 0, v: null });
      if (c.v) return Array.isArray(c.v) ? c.v.slice() : c.v;
      var r = f.apply(this, arguments);
      if (c.n++ >= 1) { c.v = r; return Array.isArray(r) ? r.slice() : r; }
      return r;
    };
  });
  var _dd = P.drawDeploy;
  if (typeof _dd === 'function') P.drawDeploy = function () {
    if (!PF.on || this._pfm) return _dd.apply(this, arguments);
    this._pfm = {};
    try { return _dd.apply(this, arguments); } finally { this._pfm = null; }
  };

  if (!M) return;

  /* ② 영토 색칠: 같은 입력이고 그림(노드)이 그대로면 건너뛴다. 게임을 새로 시작하며 그림을 지웠거나
        정적 영역(setTerritory)으로 바뀌었다면 노드가 달라 보이므로 다시 계산한다. */
  function sig(a) { var s = a.length + ':'; for (var i = 0; i < a.length; i++) { var x = a[i]; s += x.lon + ',' + x.lat + ',' + x.side + ',' + x.w + ';'; } return s; }
  function dom(m) { var a = m.gTerr, b = m.gTerrLabels; return { a: a.firstChild, z: a.lastChild, n: a.childNodes.length, la: b.firstChild, lz: b.lastChild, ln: b.childNodes.length }; }
  function same(c, d) { return c.a === d.a && c.z === d.z && c.n === d.n && c.la === d.la && c.lz === d.lz && c.ln === d.ln; }
  var _dyn = M.setDynTerritory;
  if (typeof _dyn === 'function') M.setDynTerritory = function (sites) {
    if (!PF.on || !sites) return _dyn.apply(this, arguments);
    var sg = sig(sites), c = this._dynC;
    if (c && c.sg === sg && this.terrKey === 'dyn' && same(c.d, dom(this))) { PF.stat.terrSkip++; return; }
    var r = _dyn.apply(this, arguments);
    this._dynC = { sg: sg, d: dom(this) };
    return r;
  };

  /* ③ 이미 보여 준 진군선(ms:1)의 재그리기. 원래는 길이를 재고(getTotalLength) 레이아웃을 강제한 뒤 1ms 전환 → 51ms 뒤 점선 클래스를 붙였다. */
  var _dr = M.drawRoute, SVGNS = 'http://www.w3.org/2000/svg';
  if (typeof _dr === 'function') M.drawRoute = function (id, pts, side, opts) {
    if (!PF.on || !opts || opts.ms !== 1 || !SG.px || !SG.resolvePts) return _dr.apply(this, arguments);
    var Q = SG.resolvePts(pts).map(function (c) { return SG.px(c[0], c[1]); });
    if (Q.length < 2) return;
    var d = Q.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    var old = this.gRoutes.querySelector('[data-id="' + id + '"]'); if (old) old.remove();
    var path = document.createElementNS(SVGNS, 'path');
    path.setAttribute('d', d); path.setAttribute('class', 'route s-' + side + (opts.sea ? ' sea' : '') + ' drawn'); path.setAttribute('data-id', id);
    this.gRoutes.appendChild(path); PF.stat.routeFast++;
    return path;
  };
})();
