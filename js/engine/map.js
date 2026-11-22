/* 지도 엔진 — 실제 지리 데이터(mapdata.js) + 음영기복(assets/relief.jpg) + 지명/영역/진군로 오버레이 */
window.SG = window.SG || {}; SG.data = SG.data || {};
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var M = SG.data.mapdata;
  function el(n, a, p, txt) {
    var e = document.createElementNS(NS, n);
    if (a) for (var k in a) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    if (txt != null) e.textContent = txt;
    return e;
  }
  function px(lon, lat) { return [(lon - M.LON0) * M.KX * M.S, (M.LAT1 - lat) * M.S]; }
  SG.px = px;
  SG.sideName = { goguryeo: '고구려', baekje: '백제', silla: '신라', tang: '당', wa: '왜', malgal: '말갈', khitan: '거란', gaya: '가야', neutral: '' };

  // 지점 아이콘 (0,0 중심, 반경 ~9)
  var ICON = {
    capital: '<circle r="9" class="ic-bg"/><path d="M0-6 1.8-1.9 6.3-1.9 2.7 0.8 4 5.2 0 2.6-4 5.2-2.7 0.8-6.3-1.9-1.8-1.9z" class="ic-fg"/>',
    city: '<circle r="6" class="ic-bg"/><rect x="-3" y="-3" width="6" height="6" class="ic-fg"/>',
    fortress: '<path d="M-7 6V-3h3v2h2.5v-2h3v2H3v-2h3V6z" class="ic-bg"/><path d="M-4 6V1h8v5z" class="ic-fg"/>',
    port: '<circle r="6.5" class="ic-bg"/><path d="M0-4v8M-3.5 1.5q3.5 4 7 0M-2.5-1.5h5" class="ic-line"/>',
    pass: '<path d="M-8 6 0-6 8 6z" class="ic-bg"/><path d="M-3.5 6 0 0 3.5 6z" class="ic-fg"/>',
    battlefield: '<circle r="8" class="ic-bg"/><path d="M-4.5-4.5 4.5 4.5M4.5-4.5-4.5 4.5" class="ic-line sw"/>',
    island: '<circle r="4.5" class="ic-bg"/>',
    other: '<circle r="4" class="ic-bg"/>'
  };

  function Map(container, opts) {
    opts = opts || {};
    var self = this;
    this.box = container;
    this.svg = el('svg', { 'class': 'sgmap lod-1', preserveAspectRatio: 'xMidYMid slice' });
    container.appendChild(this.svg);
    this.view = { cx: M.W * 0.5, cy: M.H * 0.5, w: M.W };
    this.minW = 520; this.maxW = M.W;
    this.tokens = {}; this.placeEls = {}; this.onPlace = opts.onPlace || null; this.cls = '';
    this._build();
    this._bind();
    this._apply();
    new ResizeObserver(function () { self._apply(); }).observe(container);
  }

  Map.prototype._build = function () {
    var s = this.svg, defs = el('defs', null, s);
    var cp = el('clipPath', { id: 'landclip' }, defs);
    el('path', { d: M.land, 'clip-rule': 'evenodd' }, cp);
    // 바다: 심청 그라디언트 + 물결
    var g = el('radialGradient', { id: 'seaGrad', cx: '50%', cy: '50%', r: '75%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#35505a' }, g); el('stop', { offset: '1', 'stop-color': '#1d2e36' }, g);
    var pat = el('pattern', { id: 'wave', width: 46, height: 22, patternUnits: 'userSpaceOnUse' }, defs);
    el('path', { d: 'M0 11q11.5-9 23 0t23 0', fill: 'none', stroke: 'rgba(190,215,222,.10)', 'stroke-width': 1.2 }, pat);
    var tb = el('filter', { id: 'terrblur', x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs); el('feGaussianBlur', { stdDeviation: 4.5 }, tb);
    var gl = el('filter', { id: 'glow', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
    el('feGaussianBlur', { stdDeviation: 6 }, gl);

    el('rect', { x: -400, y: -400, width: M.W + 800, height: M.H + 800, fill: 'url(#seaGrad)' }, s);
    el('rect', { x: -400, y: -400, width: M.W + 800, height: M.H + 800, fill: 'url(#wave)' }, s);
    // 해안 번짐
    el('path', { d: M.land, 'class': 'coast-glow', 'fill-rule': 'evenodd', filter: 'url(#glow)' }, s);
    el('path', { d: M.land, 'class': 'land', 'fill-rule': 'evenodd' }, s);
    el('image', { href: 'assets/relief.jpg', x: 0, y: 0, width: M.W, height: M.H, 'clip-path': 'url(#landclip)', preserveAspectRatio: 'none' }, s);
    el('path', { d: M.land, 'class': 'coast', 'fill-rule': 'evenodd' }, s);
    el('path', { d: M.lakes, 'class': 'lake' }, s);

    this.gRivers = el('g', { 'class': 'rivers' }, s);
    (M.rivers || []).forEach(function (r) { el('path', { d: r.d, 'class': 'river' }, this.gRivers); }, this);
    (SG.data.riversExtra || []).forEach(function (r) { el('path', { d: r.d, 'class': 'river' }, this.gRivers); }, this);

    this.gTerr = el('g', { 'class': 'terr', 'clip-path': 'url(#landclip)' }, s);
    this.gTerrLabels = el('g', { 'class': 'terr-labels' }, s);
    this.gGeo = el('g', { 'class': 'geo-labels' }, s);
    this.gRoutes = el('g', { 'class': 'routes' }, s);
    this.gPlaces = el('g', { 'class': 'places' }, s);
    this.gTokens = el('g', { 'class': 'tokens' }, s);
    this.gFx = el('g', { 'class': 'fx' }, s);

    // 바다 이름 (고정 라벨)
    [['서해 (황해)', 125.0, 36.4], ['동해', 131.6, 39.6], ['남해', 127.9, 33.6], ['발해', 120.6, 38.8], ['대한해협', 129.6, 34.1]].forEach(function (a) {
      var p = px(a[1], a[2]);
      el('text', { x: p[0], y: p[1], 'class': 'sea-name' }, this.gGeo, a[0]);
    }, this);

    this._buildPlaces();
  };

  Map.prototype._buildPlaces = function () {
    var self = this;
    (SG.data.places || []).forEach(function (pl) {
      if (pl.offmap) return;
      var p = px(pl.lon, pl.lat);
      var g = el('g', { 'class': 'pl k-' + pl.kind + ' s-' + (pl.side || 'neutral') + ' r' + (pl.rank || 3), transform: 'translate(' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ')', 'data-id': pl.id }, self.gPlaces);
      var inv = el('g', { 'class': 'inv' }, g);
      el('circle', { 'class': 'hit', r: 15, fill: 'transparent', 'pointer-events': 'all' }, inv); // 누르기 쉽게 넓은 판정(화면 크기 고정)
      var ic = el('g', { 'class': 'icon' }, inv); ic.innerHTML = ICON[pl.kind] || ICON.other;
      el('text', { 'class': 'plabel', x: 11, y: 4 }, inv, pl.name);
      g.addEventListener('click', function (e) { e.stopPropagation(); if (self.onPlace) self.onPlace(pl); });
      self.placeEls[pl.id] = g;
    });
  };

  // 영역 표시: key = 'y660' 등
  Map.prototype.setTerritory = function (key) {
    if (this.dynTerr) return;
    var T = SG.data.territories && SG.data.territories[key];
    this.gTerr.innerHTML = ''; this.gTerrLabels.innerHTML = '';
    this.terrKey = key;
    if (!T) return;
    T.polys.forEach(function (poly) {
      var d = poly.ring.map(function (c, i) { var p = px(c[0], c[1]); return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('') + 'Z';
      el('path', { d: d, 'class': 'terr-poly t-' + poly.id }, this.gTerr);
      var cx = 0, cy = 0; poly.ring.forEach(function (c) { cx += c[0]; cy += c[1]; });
      cx /= poly.ring.length; cy /= poly.ring.length;
      var lp = px(poly.cx != null ? poly.cx : cx, poly.cy != null ? poly.cy : cy);
      var t = el('g', { transform: 'translate(' + lp[0].toFixed(0) + ',' + lp[1].toFixed(0) + ')', 'class': 'terr-lab t-' + poly.id }, this.gTerrLabels);
      el('text', { 'class': 'terr-name inv', y: 0 }, t, poly.name);
    }, this);
  };

  Map.prototype.setCls = function (c, on) { var a = (this.cls || '').split(' ').filter(Boolean), i = a.indexOf(c); if (on && i < 0) a.push(c); if (!on && i >= 0) a.splice(i, 1); this.cls = a.join(' '); this._apply(); };
  // 성의 소유 세력(색)·표시 여부를 시기에 맞춰 갱신
  Map.prototype.setPlaceSide = function (id, side) { var e = this.placeEls[id]; if (!e) return; var c = (e.getAttribute('class') || '').split(' ').filter(function (x) { return x && x.indexOf('s-') !== 0; }); c.push('s-' + (side || 'neutral')); e.setAttribute('class', c.join(' ')); };
  Map.prototype.setPlaceVisible = function (id, on) { this.markPlace(id, 'off', !on); };
  Map.prototype.clearPlaceMarks = function (cls) { for (var id in this.placeEls) this.placeEls[id].classList.remove(cls); };
  // 여러 지점이 한 화면에 들어오도록 카메라를 맞춘다
  Map.prototype.fit = function (pts, ms, minW) {
    var P = SG.resolvePts(pts); if (!P.length) return;
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    P.forEach(function (c) { var p = px(c[0], c[1]); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    var r = this.box.getBoundingClientRect(), pad = this.padFn ? this.padFn() : { l: 0, r: 0, t: 0, b: 0 };
    var availW = Math.max(200, r.width - pad.l - pad.r - 60), availH = Math.max(200, r.height - pad.t - pad.b - 60);
    var w = Math.max(minW || 700, (x1 - x0) * 1.35, (y1 - y0) * 1.35 * availW / availH);
    var lon = 0, lat = 0; P.forEach(function (c) { lon += c[0]; lat += c[1]; }); lon /= P.length; lat /= P.length;
    this.focus((x0 + x1) / 2 / (M.KX * M.S) + M.LON0, M.LAT1 - (y0 + y1) / 2 / M.S, w, ms == null ? 900 : ms);
  };
  // 영토를 성·거점의 세력권(가까운 거점 기준)으로 계산해 칠한다. sites=[{lon,lat,side,w}]
  Map.prototype.setDynTerritory = function (sites) {
    this.gTerr.innerHTML = ''; this.gTerrLabels.innerHTML = ''; this.terrKey = 'dyn';
    if (!sites.length) return;
    var step = 0.1, cw = step * M.KX * M.S, ch = step * M.S, rows = {}, cnt = {}, cx = {}, cy = {};
    for (var lat = 43.4; lat >= 33.0; lat -= step) {
      var run = null;
      for (var lon = 121.5; lon <= 131.0; lon += step) {
        var best = null, bd = 1e9;
        for (var i = 0; i < sites.length; i++) {
          var s = sites[i], dx = (lon - s.lon) * 0.8, dy = lat - s.lat, d = Math.sqrt(dx * dx + dy * dy) / s.w;
          if (d < bd) { bd = d; best = s; }
        }
        var side = best && bd < 1.7 ? best.side : null;
        if (run && run.side === side) { run.n++; continue; }
        if (run && run.side) (rows[run.side] = rows[run.side] || []).push(run);
        run = { side: side, lon: lon, lat: lat, n: 1 };
      }
      if (run && run.side) (rows[run.side] = rows[run.side] || []).push(run);
    }
    var pt = px(121.5, 43.4)[1];
    for (var sd in rows) {
      var d = '';
      rows[sd].forEach(function (r) {
        var p = px(r.lon - step / 2, r.lat + step / 2); d += 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + 'h' + (r.n * cw).toFixed(1) + 'v' + ch.toFixed(1) + 'h-' + (r.n * cw).toFixed(1) + 'z';
        cnt[sd] = (cnt[sd] || 0) + r.n; cx[sd] = (cx[sd] || 0) + r.lon * r.n; cy[sd] = (cy[sd] || 0) + r.lat * r.n;
      });
      el('path', { d: d, 'class': 'terr-poly dyn t-' + sd, filter: 'url(#terrblur)' }, this.gTerr);
      if (cnt[sd] > 60 && SG.sideName[sd]) {
        var sl = 0, sa = 0, sn = 0; sites.forEach(function (q) { if (q.side === sd && q.lon >= 124 && q.lat >= 33) { sl += q.lon; sa += q.lat; sn++; } });
        var lp = sn ? px(sl / sn, sa / sn) : px(cx[sd] / cnt[sd], cy[sd] / cnt[sd]), t = el('g', { transform: 'translate(' + lp[0].toFixed(0) + ',' + lp[1].toFixed(0) + ')', 'class': 'terr-lab t-' + sd }, this.gTerrLabels);
        el('text', { 'class': 'terr-name inv', y: 0 }, t, SG.sideName[sd]);
      }
    }
  };
  Map.prototype.showPlaces = function (fn) {
    for (var id in this.placeEls) {
      var pl = SG.placeById(id);
      this.placeEls[id].style.display = (!fn || fn(pl)) ? '' : 'none';
    }
  };

  // ── 카메라 ──
  Map.prototype._apply = function () {
    var r = this.box.getBoundingClientRect(); if (!r.width) return;
    var v = this.view, asp = r.height / r.width;
    v.w = Math.max(this.minW, Math.min(this.maxW, v.w));
    var h = v.w * asp;
    v.cx = Math.max(0, Math.min(M.W, v.cx)); v.cy = Math.max(0, Math.min(M.H, v.cy));
    this.svg.setAttribute('viewBox', [v.cx - v.w / 2, v.cy - h / 2, v.w, h].join(' '));
    var inv = v.w / r.width;
    this.svg.style.setProperty('--inv', inv.toFixed(4));
    this.svg.style.setProperty('--k', (1 / inv).toFixed(4));
    var lod = v.w < 1000 ? 3 : v.w < 1800 ? 2 : 1;
    this.svg.setAttribute('class', 'sgmap lod-' + lod + (this.cls ? ' ' + this.cls : ''));
  };
  Map.prototype.focus = function (lon, lat, w, ms) {
    var p = px(lon, lat), self = this, v = this.view;
    var r = this.box.getBoundingClientRect(), pad = this.padFn ? this.padFn() : { l: 0, r: 0, t: 0, b: 0 };
    var nw = Math.max(this.minW, Math.min(this.maxW, w || v.w)), upp = nw / (r.width || 1);
    var a = { x: v.cx, y: v.cy, w: v.w }, b = { x: p[0] - (pad.l - pad.r) / 2 * upp, y: p[1] - (pad.t - pad.b) / 2 * upp, w: nw };
    if (!ms) { v.cx = b.x; v.cy = b.y; v.w = b.w; this._apply(); return; }
    var t0 = performance.now(); cancelAnimationFrame(this._raf);
    (function step(t) {
      var k = Math.min(1, (t - t0) / ms); k = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      v.cx = a.x + (b.x - a.x) * k; v.cy = a.y + (b.y - a.y) * k;
      v.w = Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k);
      self._apply();
      if (k < 1) self._raf = requestAnimationFrame(step);
    })(t0);
  };
  Map.prototype.zoomBy = function (f, ax, ay) {
    var v = this.view, r = this.box.getBoundingClientRect();
    var nw = Math.max(this.minW, Math.min(this.maxW, v.w * f)), k = nw / v.w;
    if (ax != null) {
      var fx = (ax - r.left) / r.width - .5, fy = (ay - r.top) / r.height - .5, asp = r.height / r.width;
      v.cx += fx * v.w * (1 - k); v.cy += fy * v.w * asp * (1 - k);
    }
    v.w = nw; this._apply();
  };
  Map.prototype._bind = function () {
    var self = this, svg = this.svg, ptrs = {}, last = null, pinch = 0;
    svg.addEventListener('wheel', function (e) { e.preventDefault(); self.zoomBy(e.deltaY > 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
    // 포인터 캡처는 "끌기"가 확정된 뒤에만 건다 (처음부터 걸면 성을 누른 클릭이 성에 전달되지 않는다)
    var down = {};
    svg.addEventListener('pointerdown', function (e) { ptrs[e.pointerId] = e; down[e.pointerId] = { x: e.clientX, y: e.clientY, cap: false }; last = { x: e.clientX, y: e.clientY }; pinch = 0; });
    svg.addEventListener('pointermove', function (e) {
      if (!ptrs[e.pointerId]) return;
      var d0 = down[e.pointerId];
      if (d0 && !d0.cap) {
        if (Math.hypot(e.clientX - d0.x, e.clientY - d0.y) < 6 && Object.keys(ptrs).length < 2) return;
        d0.cap = true; try { svg.setPointerCapture(e.pointerId); } catch (_) { }
        last = { x: e.clientX, y: e.clientY };
      }
      ptrs[e.pointerId] = e;
      var ids = Object.keys(ptrs);
      if (ids.length === 2) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (pinch) self.zoomBy(pinch / d, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
        pinch = d; return;
      }
      var r = self.box.getBoundingClientRect(), k = self.view.w / r.width;
      self.view.cx -= (e.clientX - last.x) * k; self.view.cy -= (e.clientY - last.y) * k;
      last = { x: e.clientX, y: e.clientY }; self._apply(); cancelAnimationFrame(self._raf);
    });
    function up(e) { delete ptrs[e.pointerId]; delete down[e.pointerId]; pinch = 0; var ids = Object.keys(ptrs); if (ids.length === 1) last = { x: ptrs[ids[0]].clientX, y: ptrs[ids[0]].clientY }; }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  };

  // ── 군대 토큰 / 진군로 ──
  // route pts: [placeId | [lon,lat]]
  SG.resolvePts = function (pts) {
    return pts.map(function (q) { if (typeof q === 'string') { var pl = SG.placeById(q); return pl ? [pl.lon, pl.lat] : null; } return q; }).filter(Boolean);
  };
  Map.prototype.drawRoute = function (id, pts, side, opts) {
    var P = SG.resolvePts(pts).map(function (c) { return px(c[0], c[1]); });
    if (P.length < 2) return;
    var d = P.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    var old = this.gRoutes.querySelector('[data-id="' + id + '"]'); if (old) old.remove();
    var path = el('path', { d: d, 'class': 'route s-' + side + ((opts && opts.sea) ? ' sea' : ''), 'data-id': id }, this.gRoutes);
    var len = path.getTotalLength(); path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    path.getBoundingClientRect();
    path.style.transition = 'stroke-dashoffset ' + ((opts && opts.ms) || 1600) + 'ms ease'; path.style.strokeDashoffset = 0;
    setTimeout(function () { path.style.strokeDasharray = ''; path.classList.add('drawn'); }, ((opts && opts.ms) || 1600) + 50);
    return path;
  };
  Map.prototype.clearRoutes = function () { this.gRoutes.innerHTML = ''; };
  Map.prototype.setToken = function (id, side, label, count, lon, lat, kind) {
    var t = this.tokens[id], p = px(lon, lat);
    if (!t) {
      var g = el('g', { 'class': 'tk s-' + side + (kind ? ' ' + kind : '') }, this.gTokens), inv = el('g', { 'class': 'inv' }, g);
      el('path', { d: 'M0 0V-30', 'class': 'tk-pole' }, inv);
      el('path', { d: 'M0-30h46l-6 7 6 7H0z', 'class': 'tk-banner' }, inv);
      var n = el('text', { 'class': 'tk-count', x: 21, y: -19 }, inv, count || '');
      var l = el('text', { 'class': 'tk-label', x: 8, y: 15 }, inv, label || '');
      t = this.tokens[id] = { g: g, n: n, l: l, x: p[0], y: p[1] };
    }
    t.x = p[0]; t.y = p[1]; t.g.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ')');
    if (count != null) t.n.textContent = count; if (label != null) t.l.textContent = label;
    return t;
  };
  Map.prototype.moveToken = function (id, pts, ms, done) {
    var t = this.tokens[id]; if (!t) return;
    var P = SG.resolvePts(pts).map(function (c) { return px(c[0], c[1]); });
    var seg = [], tot = 0; for (var i = 1; i < P.length; i++) { var L = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(L); tot += L; }
    var t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / ms), d = k * tot, i = 0;
      while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
      var f = seg[i] ? d / seg[i] : 1, x = P[i][0] + (P[i + 1][0] - P[i][0]) * f, y = P[i][1] + (P[i + 1][1] - P[i][1]) * f;
      t.x = x; t.y = y; t.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')');
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    })(t0);
  };
  Map.prototype.removeToken = function (id) { var t = this.tokens[id]; if (t) { t.g.remove(); delete this.tokens[id]; } };
  Map.prototype.clearTokens = function () { this.gTokens.innerHTML = ''; this.tokens = {}; };
  Map.prototype.ping = function (lon, lat, cls) {
    var p = px(lon, lat), g = el('g', { transform: 'translate(' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ')', 'class': 'ping ' + (cls || '') }, this.gFx);
    var inv = el('g', { 'class': 'inv' }, g); el('circle', { r: 8 }, inv); el('circle', { r: 8, 'class': 'p2' }, inv);
    setTimeout(function () { g.remove(); }, 2600);
  };
  Map.prototype.markPlace = function (id, cls, on) { var e = this.placeEls[id]; if (e) e.classList.toggle(cls, on !== false); };

  SG.placeById = function (id) { var a = SG.data.places || []; SG._pi = SG._pi || {}; if (!SG._pi[id]) a.forEach(function (p) { SG._pi[p.id] = p; }); return SG._pi[id]; };
  SG.Map = Map;
})();
