/* 지리와 수군: 육지로 이어진 곳은 걸어서 가고, 바다 건너 땅은 수군(또는 이미 확보한 교두보)이 있어야 간다.
 *  - 땅덩이(육지권)를 나눈다: 대륙(요동·한반도), 산둥·장난 해안, 왜(규슈·혼슈), 그리고 섬들.
 *  - 목표와 같은 땅덩이에 내가 점령한 성이 있으면 거기서 출발하므로 수군도, 도해 위험도 필요 없다.
 *  - 상륙해서 얻은 거점의 병력은 그곳에서 쓸 수 있고, 본국 병력을 더 건너 보내려면 수군이 있어야 한다.
 *  - 지도에 보이는 적 병력 표시와 출병 화면의 수비 추정, 실제 전투의 수비병이 같은 숫자에서 나오게 한다.
 * T()는 반드시 파일을 읽을 때(함수 밖에서) 부른다. */
(function () {
  var P = SG.Sandbox.prototype;
  var TR = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
  function T(k, e, j) { TR.en[k] = e; TR.ja[k] = j; var I = SG.i18n; if (I && I.dict && I.dict.en) { I.dict.en[k] = e; I.dict.ja[k] = j; } return k; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function short(pl) { return pl.name.replace(/\(.*?\)/g, '').trim(); }
  function fmt(n) { return n >= 10000 ? (Math.round(n / 1000) / 10) + '만' : (Math.round(n / 100) / 10) + '천'; }
  function hash(str) { var x = 0; for (var i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) | 0; return ((x >>> 0) % 1000) / 500 - 1; }
  var REC = { capital: 4000, city: 2000, fortress: 1200, port: 1000, pass: 500, island: 600 };
  var M = {
    base: T('교두보', 'Beachhead', '橋頭堡'),
    land: T('같은 땅에 아군 성이 있어 수군 없이 육로로 진군합니다.', 'We hold a castle on the same landmass, so the army marches by land with no fleet needed.', '同じ陸地にわが城があるため、水軍なしで陸路を進軍します。'),
    only: T('이 방면에 쓸 수 있는 병력은 확보한 거점에 머무는 군뿐입니다. 본국 병력을 더 건너 보내려면 수군이 필요합니다.', 'Only the troops stationed at our holdings here can be used. Ferrying more from home needs a navy.', 'この方面で使えるのは確保した拠点に駐留する軍だけです。本国の兵をさらに渡すには水軍が必要です。')
  };

  /* 땅덩이: 같은 땅덩이끼리는 걸어서 간다 */
  function regionOf(pl) {
    if (!pl) return 'cont';
    if (pl.kind === 'island') return 'isl:' + pl.id;
    if (pl.lon >= 129.9 && pl.lat <= 36.6) return 'wa';
    if (pl.lon >= 131) return 'wa';
    if (pl.lon <= 123.3 && pl.lat < 39) return 'shandong';
    return 'cont';
  }
  SG.regionOf = regionOf;
  P.homeRegion = function () { return regionOf(SG.placeById(this.cfg.capPlace)); };
  P.baseIn = function (pl) { var r = regionOf(pl); return this.myPlaces().filter(function (p) { return p.id !== pl.id && regionOf(p) === r; }); };
  P.needSea = function (pl) { if (!pl) return false; var r = regionOf(pl); if (r === this.homeRegion()) return false; return this.baseIn(pl).length === 0; };
  P.nearBase = function (pl) { var b = this.baseIn(pl), best = null, bd = 99; b.forEach(function (p) { var d = dist(p, pl); if (d < bd) { bd = d; best = p; } }); return best; };

  function fix(sb, t) {
    if (!t || !t.place) return t; var pl = SG.placeById(t.place); if (!pl) return t;
    t.oversea = sb.needSea(pl); t.beach = !t.oversea && regionOf(pl) !== sb.homeRegion();
    return t;
  }
  var _dt = P.dynTarget; P.dynTarget = function () { return fix(this, _dt.apply(this, arguments)); };
  var _ts = P.targets; P.targets = function () { var self = this; return _ts.apply(this, arguments).map(function (t) { return fix(self, t); }); };
  var _tb = P.targetById; P.targetById = function () { return fix(this, _tb.apply(this, arguments)); };
  P.isSeaTarget = function (T_) { return !!(T_ && T_.oversea); };

  /* 출발 거점·원정로: 같은 땅덩이의 아군 성에서 출발 */
  var _ns = P.nearestStation;
  P.nearestStation = function (placeId) {
    var pl = SG.placeById(placeId); if (pl && regionOf(pl) !== this.homeRegion()) { var b = this.nearBase(pl); if (b) return { pl: b, role: 'base', share: 0 }; }
    return _ns.apply(this, arguments);
  };
  var _ex = P.expedition;
  P.expedition = function (Tg) {
    var pl = Tg && SG.placeById(Tg.place), self = this, bases = pl && regionOf(pl) !== this.homeRegion() ? this.baseIn(pl) : [], ex;
    if (bases.length) { this.myPlaces = function () { return bases; }; }
    try { ex = _ex.apply(this, arguments); } finally { if (bases.length) delete this.myPlaces; }
    if (ex && pl && !this.needSea(pl) && ex.sea) { ex.sea = false; ex.storm = 0; ex.days = Math.max(1, Math.round(ex.km / 20)); }
    if (ex && bases.length) ex.beach = true;
    return ex;
  };
  var _xt = P.expText;
  P.expText = function (ex) { var r = _xt.apply(this, arguments); return ex && ex.beach ? r + '<br>⚓ <b>' + M.base + '</b> ' + M.land : r; };

  /* 교두보 병력: 상륙해 얻은 성의 병력은 그 방면의 공격에 쓴다 */
  P.baseTroops = function (pl) {
    var self = this, s = this.s, r = regionOf(pl), t = 0; s.held = s.held || {}; s.beachLoss = s.beachLoss || {};
    this.myPlaces().forEach(function (p) { if (regionOf(p) !== r || s.held[p.id] == null) return; t += (REC[p.kind] || 800) * (1 + Math.min(0.6, 0.08 * Math.max(0, s.year - s.held[p.id]))); });
    return Math.max(1500, Math.round((t - (s.beachLoss[r] || 0)) / 100) * 100);
  };
  P.ovInfo = function (T_) {
    var pl = T_ && SG.placeById(T_.place); if (!pl || regionOf(pl) === this.homeRegion() || this.needSea(pl)) return null;
    var base = this.baseTroops(pl), ferry = clamp((this.s.realm.navy - 30) / 140, 0, 0.5);
    return { region: regionOf(pl), base: base, ferry: ferry, pl: pl };
  };
  var _wfl = P.warFlow;
  P.warFlow = function (tid) { var T_ = this.targetById(tid); this._ov = T_ ? this.ovInfo(T_) : null; return _wfl.apply(this, arguments); };
  var _wf = P.warFight;
  P.warFight = function (T_) { this._ov = this.ovInfo(T_); return _wf.apply(this, arguments); };
  var _rt = P.renderTurn; P.renderTurn = function () { this._ov = null; return _rt.apply(this, arguments); };
  function capOf(sb, total) { var o = sb._ov; if (!o) return total; return Math.min(total, Math.round((o.base + total * o.ferry) / 100) * 100); }
  var _fu = P.fieldUnits;
  P.fieldUnits = function () {
    var a = _fu.apply(this, arguments); if (!this._ov) return a;
    var tot = a.reduce(function (t, u) { return t + u.n; }, 0), cap = capOf(this, tot); if (cap >= tot || !tot) return a;
    a.forEach(function (u) { u.n = Math.round(u.n * cap / tot); }); return a.filter(function (u) { return u.n > 0; });
  };
  var _ft = P.fieldTotal; P.fieldTotal = function () { return capOf(this, _ft.apply(this, arguments)); };
  var _hold = P.holdOf; P.holdOf = function (ex) { return this._ov ? 0 : _hold.apply(this, arguments); };
  var _cas = P.casual;
  P.casual = function (before, after) {
    var o = this._ov; if (o) { var b = (before || []).reduce(function (t, u) { return t + u.n; }, 0), a = (after || []).reduce(function (t, u) { return t + u.n; }, 0); this.s.beachLoss = this.s.beachLoss || {}; this.s.beachLoss[o.region] = (this.s.beachLoss[o.region] || 0) + Math.max(0, b - a); }
    return _cas.apply(this, arguments);
  };
  var _wfl2 = P.warFlow;
  P.warFlow = function () {
    var r = _wfl2.apply(this, arguments), card = document.querySelector('.modal.dock .card');
    if (this._ov && card && !card.querySelector('.beachnote')) { var d = document.createElement('div'); d.className = 'note beachnote'; d.innerHTML = '⚓ <b>' + M.base + '</b> ' + M.only; var row = card.querySelector('.row'); if (row) card.insertBefore(d, row); }
    return r;
  };

  /* 지도 병력 표시 = 실제 수비병: 적 표시·출병 화면의 수비 추정·실제 전투가 같은 숫자에서 나온다 */
  function foeF() { return (SG.HARD && SG.HARD.foe) || 1; }
  P.gearFor = function (pl, side) {
    var t = this.targets().filter(function (x) { return x.place === pl.id; })[0] || this.dynTarget(pl, side);
    return Math.round(t.garrison * foeF());
  };
  P.fuzzG = function (g) {
    var i = this.s.realm.intel, e = i >= 50 ? 0.06 : i >= 25 ? 0.25 : 0.45, v = g * (1 + hash('g' + Math.round(g / 500) + '|' + this.s.year) * e);
    return (i >= 50 ? '' : '약 ') + fmt(Math.round(v / 100) * 100);
  };
  P.tokenGar = function (pl, side) { return this.fuzzG(this.gearFor(pl, side)); };
  P.estimate = function (n) { return this.fuzzG(n * foeF()); };

  var _dd = P.drawDeploy;
  P.drawDeploy = function () {
    var r = _dd.apply(this, arguments), self = this, m = this.g.map; if (!m) return r;
    var seen = {}, home = this.homeRegion();
    this.stations().forEach(function (x) { seen[x.pl.id] = 1; });
    var groups = {}; this.myPlaces().forEach(function (p) { var rg = regionOf(p); if (rg === home) return; (groups[rg] = groups[rg] || []).push(p); });
    Object.keys(groups).forEach(function (rg) {
      var ps = groups[rg].sort(function (a, b) { return (REC[b.kind] || 0) - (REC[a.kind] || 0); }), p = ps[0]; if (seen[p.id]) return;
      var held = ps.some(function (q) { return self.s.held && self.s.held[q.id] != null; }); if (!held) return;
      m.setToken('base_' + rg, self.side, '', fmt(self.baseTroops(p)), p.lon, p.lat, 'own'); m.markPlace(p.id, 'own', true);
    });
    return r;
  };
  SG.GEO = M;
})();
