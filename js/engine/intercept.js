/* 침투 요격: 일반 성을 지나쳐 깊숙이(특히 수도를) 치려는 군은 도중의 적 성에서 측면을 얻어맞는다.
   플레이어 원정과 AI 원정·기습 모두 같은 규칙을 쓴다. (게임 추상화 모델 — 사료 수치가 아니다.) */
(function () {
  var P = SG.Sandbox.prototype, CASTLE = { capital: 1, city: 1, fortress: 1, port: 1, pass: 1 };
  var TR = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
  function T(k, e, j) { TR.en[k] = e; TR.ja[k] = j; return k; }
  function short(pl) { return pl.name.replace(/\(.*?\)/g, '').trim(); }
  var M = {
    ttl: T('침투 요격', 'Interception en route', '道中の迎撃'),
    s1: T(' 성의 수비군이 행군하는 군의 옆구리를 쳤습니다.', ' garrisons struck the marching column in the flank.', ' の守備軍が行軍中の軍の脇腹を突きました。'),
    s2: T(' 성의 수비군이 행군하는 군의 옆구리를 칠 수 있습니다. 성을 먼저 차지하면 피해가 줄어듭니다.', ' garrisons may strike the marching column in the flank. Taking those castles first reduces the damage.', ' の守備軍が行軍中の軍の脇腹を突くおそれがあります。先に城を取れば被害は減ります。'),
    cap: T('수도를 곧장 노리는 깊은 침투입니다.', 'A deep thrust straight at the capital.', '首都を直接狙う深い侵攻です。'),
    ai: T('도중의 성들에 발목이 잡혀 공세가 꺾였습니다.', 'The offensive was blunted by the castles along the way.', '道中の城に足を取られ、攻勢が鈍りました。')
  };
  function names(a) { return a.map(function (p) { return '<b>' + short(p) + '</b>'; }).join(', '); }

  /* 출발지~목표 선분 근처에 있는 owner 의 성(목표 제외) — 최대 3곳 */
  P.pathGuards = function (from, to, owner) {
    var self = this; if (!from || !to || !owner) return [];
    var ax = from.lon * 0.8, ay = from.lat, bx = to.lon * 0.8, by = to.lat, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy; if (L2 < 0.3) return [];
    var out = [];
    this.places().forEach(function (p) {
      if (!CASTLE[p.kind] || p.id === to.id || p.id === from.id || self.ownerOf(p) !== owner) return;
      var px = p.lon * 0.8, py = p.lat, t = ((px - ax) * dx + (py - ay) * dy) / L2; if (t < 0.12 || t > 0.9) return;
      var d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy)); if (d > 0.42) return;
      out.push({ p: p, t: t, d: d });
    });
    out.sort(function (a, b) { return a.d - b.d; });
    return out.slice(0, 3).sort(function (a, b) { return a.t - b.t; }).map(function (o) { return o.p; });
  };

  var _ex = P.expedition;
  P.expedition = function (Tg) {
    var ex = _ex.apply(this, arguments); if (!ex || !ex.from || ex.icpt) return ex;
    var pl = SG.placeById(Tg.place); if (!pl || ex.sea) return ex;
    var g = this.pathGuards(ex.from, pl, this.ownerOf(pl)); ex.icpt = g; ex.capT = pl.kind === 'capital';
    if (g.length) { var k = g.length * (pl.kind === 'capital' ? 1.5 : 1); ex.loss += 0.02 * k; ex.mor += Math.round(1.5 * k); ex.amb = (ex.amb || 0) + 0.025 * k; }
    return ex;
  };
  var _xt = P.expText;
  P.expText = function (ex) {
    var r = _xt.apply(this, arguments);
    if (ex && ex.icpt && ex.icpt.length) r += '<br>🛡 <b>' + M.ttl + '</b> ' + names(ex.icpt) + M.s2 + (ex.capT ? ' ' + M.cap : '');
    return r;
  };
  var _wf = P.warFight;
  P.warFight = function (Tg) {
    try { var ex = this.expedition(Tg); if (ex && ex.icpt && ex.icpt.length) { var pl = SG.placeById(Tg.place); this.pre = (this.pre || '') + '<div class="freehd">🛡 <b>' + M.ttl + '</b> ' + names(ex.icpt) + M.s1 + (pl && pl.kind === 'capital' ? ' ' + M.cap : '') + '</div>'; this.log('도중 요격: ' + ex.icpt.map(short).join('·')); } } catch (e) { }
    return _wf.apply(this, arguments);
  };
  M.guardNames = names; SG.INTERCEPT = M;
})();
