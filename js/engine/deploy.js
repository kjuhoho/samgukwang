/* 배치·지도 상호작용 확장 (Sandbox 확장)
 *  - 시기별 성 소유·표시, 아군/타국 주둔 깃발(첩보 수준에 따른 오차)
 *  - 지도에서 성을 눌러 공격 목표 지정 / 임의의 적 성 공격
 *  - 병력 배치 조정(수도·전선 주둔 비율 → 해당 방면 방어력)
 *  - 사건 화면: 해당 위치로 카메라 이동·적군 진로 표시, 선택지에 마우스를 올리면 그 지점으로 이동
 *  - 자유 입력: 해석 + 결과 + 수치 변화 표시 */
(function () {
  var P = SG.Sandbox.prototype, CASTLE = { capital: 1, fortress: 1, city: 1, port: 1, pass: 1 };
  var KB = { capital: [16000, 1.45, -12, 24], city: [8000, 1.2, -4, 10], fortress: [6500, 1.35, -5, 12], port: [5000, 1.1, -3, 8], pass: [3500, 1.6, -3, 6] };
  var NAV = { navy_war: 1, navy_transport: 1 };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function $(s, r) { return (r || document).querySelector(s); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function fmt(n) { return n >= 10000 ? (Math.round(n / 1000) / 10) + '만' : (Math.round(n / 100) / 10) + '천'; }
  function hash(str) { var x = 0; for (var i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) | 0; return ((x >>> 0) % 1000) / 500 - 1; }
  function peninsula(pl) { return pl.lon >= 124 && pl.lon <= 130.6 && pl.lat >= 33 && pl.lat <= 40.5; }

  /* ── 소유·존재 ── */
  P.ownerOf = function (pl) { var o = this.s.owners; return (o && o[pl.id]) || SG.ownerAt(pl, this.s.year); };
  P.places = function () { var y = this.s.year; return SG.data.places.filter(function (pl) { return !pl.offmap && CASTLE[pl.kind] && SG.placeActive(pl, y); }); };
  P.capturePlace = function (T) {
    if (!T) return; var s = this.s, pl = SG.placeById(T.place); if (!pl) return;
    s.owners = s.owners || {}; s.owners[pl.id] = this.side;
    this.g.map.setPlaceSide(pl.id, this.side); this.g.map.markPlace(pl.id, 'taken', true);
  };
  P.foeCenter = function () {
    var self = this, rs = this.sides.silla, a = this.places().filter(function (pl) { return self.ownerOf(pl) === rs && (rs !== 'tang' && rs !== 'wa' || peninsula(pl)); });
    if (!a.length) a = this.places().filter(function (pl) { return self.ownerOf(pl) !== self.side; });
    var lon = 0, lat = 0; a.forEach(function (pl) { lon += pl.lon; lat += pl.lat; }); var n = a.length || 1;
    var cp = SG.placeById(this.cfg.capPlace) || { lon: 127, lat: 37 };
    return a.length ? { lon: lon / n, lat: lat / n } : { lon: cp.lon + 1, lat: cp.lat + 0.5 };
  };
  P.foeOrigin = function (side) {
    var self = this, a = this.places().filter(function (pl) { return self.ownerOf(pl) === side; });
    if (!a.length) return null;
    a.sort(function (x, y) { return (x.kind === 'capital' ? 0 : 1) - (y.kind === 'capital' ? 0 : 1) || x.rank - y.rank; });
    return a[0];
  };

  /* ── 아군 주둔 거점 ── */
  var FRONT_DEF = [22, 15, 10, 8];
  P.stations = function () {
    var self = this, s = this.s, cap = SG.placeById(this.cfg.capPlace), foe = this.foeCenter(), out = [];
    s.deploy = s.deploy || {};
    var mine = this.places().filter(function (pl) { return self.ownerOf(pl) === self.side && (!cap || pl.id !== cap.id) && pl.kind !== 'port'; });
    mine.sort(function (a, b) { return dist(a, foe) - dist(b, foe); });
    var fronts = [];
    mine.forEach(function (pl) { if (fronts.length < 4 && fronts.every(function (f) { return dist(f, pl) > 0.45; }) && (!cap || dist(cap, pl) > 0.3)) fronts.push(pl); });
    if (cap) out.push({ pl: cap, role: 'capital', share: s.deploy[cap.id] != null ? s.deploy[cap.id] : 30 });
    fronts.forEach(function (pl, i) { out.push({ pl: pl, role: 'front', share: s.deploy[pl.id] != null ? s.deploy[pl.id] : FRONT_DEF[i] }); });
    var tot = out.reduce(function (t, x) { return t + x.share; }, 0);
    if (tot > 100) out.forEach(function (x) { x.share = Math.floor(x.share * 100 / tot); });
    return out;
  };
  P.landTotal = function () { var A = this.g.state.army, t = 0; for (var k in A) { var U = SG.unitById(k); if (U && !NAV[U.base]) t += A[k]; } return t; };
  P.nearestStation = function (placeId) {
    var pl = SG.placeById(placeId), st = this.stations(), best = null;
    st.forEach(function (x) { var d = pl ? dist(x.pl, pl) : 0; if (!best || d < best.d) best = { x: x, d: d }; });
    return best && best.x;
  };
  P.fuzz = function (n, key) {
    var i = this.s.realm.intel; if (i < 10) return '?';
    var e = i >= 50 ? 0.06 : i >= 25 ? 0.25 : 0.45, v = n * (1 + hash(key + this.s.year) * e);
    return (i >= 50 ? '' : '약 ') + fmt(Math.round(v / 100) * 100);
  };

  /* ── 배치도 그리기 ── */
  P.drawDeploy = function () {
    var self = this, s = this.s, y = s.year, m = this.g.map; if (!m) return;
    m.clearTokens(); m.clearRoutes(); ['own', 'act', 'atk'].forEach(function (c) { m.clearPlaceMarks(c); });
    var kept = {}; this.places().forEach(function (p) { kept[p.id] = 1; });
    SG.data.places.forEach(function (pl) {
      if (pl.offmap || /^(river|mountain|region)$/.test(pl.kind)) return;
      m.setPlaceVisible(pl.id, SG.placeActive(pl, y) || !!kept[pl.id]); var ow = self.ownerOf(pl); m.setPlaceSide(pl.id, ow);
      m.markPlace(pl.id, 'taken', !!(s.owners && s.owners[pl.id] === self.side));
    });
    // 영토: 성·거점의 세력권 (점령하면 그 성 주변이 우리 색으로 바뀜)
    var sites = [], KEEP = { baekje: 1, silla: 1, goguryeo: 1, gaya: 1, tang: 1 };
    this.places().forEach(function (pl) {
      var ow = self.ownerOf(pl); if (!KEEP[ow] || (ow === 'tang' && !peninsula(pl))) return;
      sites.push({ lon: pl.lon, lat: pl.lat, side: ow, w: (pl.kind === 'capital' ? 1.35 : 1) + (s.owners && s.owners[pl.id] === self.side ? 0.3 : 0) });
    });
    (SG.data.seeds || []).forEach(function (sd) { var ow = self.seedOwner ? self.seedOwner(sd) : SG.ownerFrom(sd.own, y); if (ow) sites.push({ lon: sd.lon, lat: sd.lat, side: ow, w: 1 }); });
    m.setDynTerritory(sites);
    // 아군
    var land = this.landTotal();
    this.stations().forEach(function (x) {
      var n = Math.round(land * x.share / 100 / 100) * 100; if (n <= 0) return;
      m.setToken('own_' + x.pl.id, self.side, '', fmt(n), x.pl.lon, x.pl.lat, 'own'); m.markPlace(x.pl.id, 'own', true);
    });
    // 다른 세력
    ['silla', 'goguryeo', 'tang', 'wa'].forEach(function (k) {
      var w = s.world[k], side = self.sides[k], pool = self.places().filter(function (pl) { return self.ownerOf(pl) === side && pl.kind !== 'pass' && (!(side === 'tang' || side === 'wa') || k === 'tang' || peninsula(pl) || pl.kind === 'port'); });
      if (!pool.length || side === self.side) return;
      var total = k === 'tang' ? w.commit * 1300 : k === 'wa' ? w.p * 120 : w.p * 300;
      if (k === 'tang' && w.commit < 25) return;
      var cp = SG.placeById(self.cfg.capPlace) || { lon: 127, lat: 37 };
      pool.sort(function (a, b) { return (a.kind === 'capital' && a.rank === 1 ? -1 : 0) - (b.kind === 'capital' && b.rank === 1 ? -1 : 0) || dist(a, cp) - dist(b, cp); });
      var picks = [], shares = k === 'wa' || k === 'tang' ? [0.6, 0.4] : [0.4, 0.3, 0.3];
      pool.forEach(function (pl) { if (picks.length < shares.length && picks.every(function (q) { return dist(q, pl) > 0.5; })) picks.push(pl); });
      var hostile = k === 'tang' ? w.commit >= 40 : w.hostility >= 40;
      picks.forEach(function (pl, i) {
        m.setToken('foe_' + k + '_' + pl.id, side, '', (self.tokenGar ? self.tokenGar(pl, side) : self.fuzz(total * shares[i], pl.id)), pl.lon, pl.lat, hostile ? 'foe' : 'friend'); m.markPlace(pl.id, 'act', true);
      });
    });
  };

  /* ── 공격 대상: 설정된 목표 + 적 소유의 모든 성 ── */
  P.roleOf = function (side) { var S = this.sides; for (var k in S) if (S[k] === side) return k; return null; };
  P.dynTarget = function (pl, ow) {
    var kb = KB[pl.kind] || KB.city, role = this.roleOf(ow), w = role && this.s.world[role];
    var f = !w ? 0.7 : role === 'tang' ? clamp(0.8 + w.commit / 120, 0.8, 1.6) : clamp(0.5 + w.p / 100, (this.s.destroyed && this.s.destroyed[ow]) ? 0.3 : (this.s.fallen && this.s.fallen[ow]) ? 0.45 : 0.6, 1.5), rf = pl.rank === 1 ? 1.25 : pl.rank === 2 ? 1 : 0.8;
    return { id: 'p_' + pl.id, name: pl.name, short: pl.name.replace(/\(.*?\)/g, '').trim(), place: pl.id, side: ow, garrison: Math.round(kb[0] * f * rf * (pl.garMul || 1) / 500) * 500, terrain: kb[1], gold: Math.round(kb[3] * (pl.garMul || 1)), people: 2, power: kb[2], hist: '사료에 이 시기 이 성을 공략한 기록은 없음 [가상]', dyn: true, oversea: !peninsula(pl) && (ow === 'wa' || pl.kind === 'island' || (pl.lon < 123 && pl.lat < 39.5)) };
  };
  P.targets = function () {
    var self = this, s = this.s, y = s.year, list = [], seen = {};
    // 목표는 "지금 누가 쥐고 있는가"로 정한다. 한 번 점령했다가 다시 빼앗긴 성(예: 당이 차지한 평양성)도 다시 공격 목록에 올라온다.
    (this.cfg.targets || []).forEach(function (t) {
      if ((t.from && y < t.from) || (t.to && y > t.to)) return;
      var pl = SG.placeById(t.place); if (!pl) return;
      var ow = self.ownerOf(pl);
      if (ow === self.side || (s.owners && s.owners[pl.id] === self.side)) return;
      if (s.captured[t.id] || (t.side && ow && ow !== t.side)) return;   // 이미 얻었다가 잃은 곳·주인이 바뀐 곳은 아래 일반 목록에서 현재 주인 기준으로 다룬다
      seen[t.place] = 1; list.push(t);
    });
    this.places().forEach(function (pl) {
      if (seen[pl.id]) return;
      var ow = self.ownerOf(pl); if (!ow || ow === self.side) return;
      list.push(self.dynTarget(pl, ow));
    });
    return list;
  };
  P.targetById = function (id) {
    var a = this.cfg.targets || []; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    if (id && id.indexOf('p_') === 0) { var pl = SG.placeById(id.slice(2)); if (pl) return this.dynTarget(pl, this.ownerOf(pl)); }
    return null;
  };

  /* ── 공격 선택: 지도에서 누른다 ── */
  P.warCmd = function () { return SG.data.commands.filter(function (c) { return c.id === 'war'; })[0]; };
  P.endPick = function () { var m = this.g.map; m.pick = null; m.clearPlaceMarks('atk'); m.setCls('picking', false); $('#pickbar').style.display = 'none'; };
  P.warPickList = P.warPick;
  P.warPick = function () {
    var self = this, g = this.g, m = g.map, list = this.targets(), bar = $('#pickbar');
    if (!list.length) { this.s.last = '공략할 곳이 남아 있지 않습니다.'; return this.renderTurn(); }
    this.drawDeploy(); m.pick = {};
    list.forEach(function (t) { m.pick[t.place] = t; m.markPlace(t.place, 'atk', true); var e = m.placeEls[t.place]; if (e && e.parentNode) e.parentNode.appendChild(e); }); // 공격 가능한 성을 맨 위로
    m.setCls('picking', true);
    bar.innerHTML = '<span>⚔ <b>공격할 성</b>을 지도에서 누르세요 <small>(붉게 빛나는 ' + list.length + '곳 — 어느 나라 성이든 공격할 수 있습니다)</small></span><button class="btn" id="pk-list">목록으로</button><button class="btn" id="pk-x">취소</button>';
    bar.style.display = 'flex';
    $('#pk-x').onclick = function () { self.endPick(); self.s.last = '출병을 거두었습니다.'; self.renderTurn(); };
    $('#pk-list').onclick = function () { self.endPick(); self.warPickList(); };
    var pts = list.map(function (t) { return t.place; }); if (this.cfg.capPlace) pts.unshift(this.cfg.capPlace);
    m.fit(pts, 900, 1100);
  };
  P.onPick = function (t) { this.endPick(); this.run(this.warCmd(), { target: t.id }); };
  // 정무 화면에서 지도의 적 성을 바로 누르면 공격 확인(출병 준비)이 곧바로 뜬다
  P.mapAttack = function (pl) {
    if (!this.s || !document.querySelector('#chron .choices .endyear') || document.querySelector('.modal')) return false;
    var c = this.warCmd(), t = this.targets().filter(function (x) { return x.place === pl.id; })[0];
    if (!c || !t) return false;
    var why = this.cmdAvail(c);
    if (why) { this.g.tip(pl); var tp = document.querySelector('#tip'); if (tp) tp.insertAdjacentHTML('beforeend', '<div class="note">⚔ 지금은 공격할 수 없습니다 — ' + this.L(String(why)) + '</div>'); return true; }
    this.onPick(t); return true;
  };

  P.spend = function (c) {
    var s = this.s, g = this.g; this.pay(c.cost); s.ap -= (c.ap || 1); if (c.cd) s.cd[c.id] = c.cd;
    g.state.dec++; if (this.isHist(c)) g.state.hist++; s.stats.cat[c.cat] = (s.stats.cat[c.cat] || 0) + 1;
  };
  var _run = P.run;
  P.run = function (c, opt) {
    opt = opt || {}; var s = this.s;
    if (c.needs === 'deploy' && !opt.deployed) { var w1 = this.cmdAvail(c); if (w1) { s.last = '지금은 할 수 없습니다 — ' + w1; return this.renderTurn(); } return this.deployUI(c); }
    if (c.needs === 'target' && opt.target) {
      var w2 = this.cmdAvail(c); if (w2) { s.last = '지금은 할 수 없습니다 — ' + w2; return this.renderTurn(); }
      return this.warFlow(opt.target, c);
    }
    return _run.call(this, c, opt);
  };

  /* ── 출병 화면: 진군로·병력·거점 ── */
  P.warFlow = function (tid, c) {
    var self = this, g = this.g, s = this.s, T = this.targetById(tid);
    if (!T) { s.last = '그곳은 공략할 수 없습니다.'; return this.renderTurn(); }
    if (T.oversea && s.realm.navy < 30) { s.last = '<b>' + this.L(T.name) + '</b>은(는) 바다 건너에 있습니다. 수군(현재 ' + Math.round(s.realm.navy) + ')이 30 이상이어야 원정할 수 있습니다.'; return this.renderTurn(); }
    var field = this.fieldTotal(), from = this.nearestStation(T.place), pl = SG.placeById(T.place);
    var tside = T.side || this.sides.silla, trole = this.roleOf(tside), trel = trole ? s.rel[trole] : null, tname = (SG.sideName && SG.sideName[tside]) || tside;
    var warn = '<div class="note">🏴 <b>' + tname + '</b>의 성입니다.' + (trel != null && trel >= 50 && trole !== 'silla' ? ' <b style="color:#e66">현재 우호 관계(' + Math.round(trel) + ')입니다. 공격하면 관계가 무너지고 그 나라가 적으로 돌아섭니다.</b>' : trole === 'tang' ? ' 당을 치면 당의 개입이 크게 늘어납니다.' : '') + '</div>';
    var wrap = h('div', 'modal dock'), card = h('div', 'card');
    card.innerHTML = '<h2>출병 — ' + this.L(T.name) + '</h2><div class="sub">출발 거점 ' + (from ? from.pl.name : '도성') + ' · 동원 가능한 야전 병력 ' + field.toLocaleString() + '명 · 수비 추정 ' + this.estimate(T.garrison) + ' · 지형 ' + (T.terrain >= 1.6 ? '험준' : T.terrain >= 1.3 ? '견고' : '보통') + '</div>' +
      warn + (T.hist ? '<div class="note">' + this.L(T.hist) + '</div>' : '') +
      '<div class="row" style="grid-template-columns:90px 1fr 60px"><div><b>동원 비율</b></div><input type="range" id="wf-r" min="30" max="100" value="70" step="5"><div class="v" id="wf-v">70%</div></div>' +
      '<div class="laws" id="wf-t"></div><div style="text-align:right;margin-top:10px"><button class="btn" id="wf-x">취소 (행동력은 쓰이지 않음)</button></div>';
    var tacs = [
      { id: 'front', label: '정면 공격', hint: '정직한 야전·공성. 변수가 적다.', m: {} },
      { id: 'ambush', label: '기습·야습', hint: '첫 합 큰 타격. 첩보 30 미만이면 역습 위험.', m: { ambush: true } },
      { id: 'siege', label: '장기 포위·공성', hint: '성을 에워싸 서서히 압박. 군량 5 추가 소모, 공성에 유리.', m: { fort: true, pace: 0.9 }, food: 5 }
    ];
    tacs.forEach(function (t) {
      var b = h('button', 'ch', t.label + '<small>' + t.hint + '</small>');
      if (t.food && g.state.res.food < t.food) b.disabled = true;
      b.onclick = function () {
        var frac = +$('#wf-r', card).value / 100; wrap.remove(); self.spend(c); if (t.food) self.pay({ food: t.food });
        self.s.stats.attacks = (self.s.stats.attacks || 0) + 1; self.warFight(T, frac, t);
      };
      $('#wf-t', card).appendChild(b);
    });
    var btns = [].slice.call($('#wf-t', card).querySelectorAll('.ch'));
    function upd() { var fr = +$('#wf-r', card).value / 100; btns.forEach(function (b, i) { var r = self.simWar(T, fr, tacs[i]), o = r.win ? (r.aEnd / r.aStart >= 0.6 ? '●●● 유리' : '●●○ 박빙(우세)') : (r.aEnd / (r.bEnd + 1) > 0.5 ? '●○○ 불리' : '○○○ 매우 불리'); var sm = b.querySelector('small'); sm.innerHTML = tacs[i].hint + ' <b>· 승산 ' + o + '</b>'; }); }
    $('#wf-r', card).oninput = function () { $('#wf-v', card).textContent = this.value + '%'; upd(); }; upd();
    $('#wf-x', card).onclick = function () { wrap.remove(); s.last = '출병을 거두었습니다. (행동력은 쓰이지 않았습니다)'; self.renderTurn(); };
    wrap.appendChild(card); g.root.appendChild(wrap);
    this.drawDeploy();
    if (pl && from) { g.map.drawRoute('atk', [from.pl.id, pl.id], this.side, { ms: 1200 }); g.map.markPlace(pl.id, 'atk', true); g.map.fit([from.pl.id, pl.id], 900, 800); }
    else if (pl) g.map.focus(pl.lon, pl.lat, 900, 700);
  };

  /* ── 병력 배치 조정 ── */
  P.deployUI = function (c) {
    var self = this, g = this.g, st = this.stations(), wrap = h('div', 'modal dock'), card = h('div', 'card'), vals = {};
    card.innerHTML = '<h2>병력 배치</h2><div class="sub">수도와 전선에 주둔시킬 병력 비율입니다. 합이 100%를 넘을 수 없고, 남는 분은 후방·예비군입니다.<br>침공이나 방어전이 벌어진 방면에 병력이 많을수록 방어가 유리합니다.</div><div id="dp-list"></div><div class="note" id="dp-fb"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button class="btn" id="dp-x">취소</button><button class="btn pri" id="dp-ok">배치 확정</button></div>';
    var box = $('#dp-list', card), land = this.landTotal();
    st.forEach(function (x) {
      vals[x.pl.id] = x.share;
      var row = h('div', 'dp-st', '<div><b>' + x.pl.name + '</b> <small>' + (x.role === 'capital' ? '도성 방비' : '전선 · ' + (x.pl.modern || '')) + '</small></div><input type="range" min="0" max="70" value="' + x.share + '"><div class="v"></div>');
      var rng = $('input', row), v = $('.v', row);
      function upd() { v.textContent = vals[x.pl.id] + '%'; }
      rng.oninput = function () { var val = +rng.value, oth = Object.keys(vals).reduce(function (t, k) { return t + (k === x.pl.id ? 0 : vals[k]); }, 0); if (oth + val > 100) { val = 100 - oth; rng.value = val; } vals[x.pl.id] = val; upd(); fb(); };
      row.onmouseenter = function () { g.map.focus(x.pl.lon, x.pl.lat, 900, 600); };
      upd(); box.appendChild(row);
    });
    function fb() { var used = Object.keys(vals).reduce(function (t, k) { return t + vals[k]; }, 0); $('#dp-fb', card).innerHTML = '후방·예비 <b>' + (100 - used) + '%</b> · 야전 가능 병력 ' + land.toLocaleString() + '명 기준. 수도 30% · 전선 합 55%가 기본 배치입니다.'; }
    fb(); wrap.appendChild(card); g.root.appendChild(wrap);
    $('#dp-x', card).onclick = function () { wrap.remove(); self.renderTurn(); };
    $('#dp-ok', card).onclick = function () { wrap.remove(); self.s.deploy = self.s.deploy || {}; for (var k in vals) self.s.deploy[k] = vals[k]; self.run(c, { deployed: true }); };
  };
  // 어떤 지점의 전투에서 그 방면 주둔 비율이 주는 보정
  P.deployFactor = function (bt, anchor) {
    var pid = bt.place || (anchor && anchor.place), pl = pid && SG.placeById(pid); if (!pl) return null;
    var st = this.stations(), best = null, nf = Math.max(1, st.filter(function (x) { return x.role === 'front'; }).length);
    st.forEach(function (x) { var d = dist(x.pl, pl); if (d < 1.6 && (!best || d < best.d)) best = { x: x, d: d }; });
    if (!best) return null;
    var avg = best.x.role === 'capital' ? 30 : 55 / nf, f = clamp(0.65 + 0.35 * best.x.share / avg, 0.65, 1.5);
    return { f: f, name: best.x.pl.name, share: best.x.share };
  };

  /* ── 승산 예측: 같은 계산으로 미리 돌려 본다 ── */
  P.odds = function (r) {
    var ratio = r.aEnd / (r.aStart || 1), pt = r.aEnd / (r.bEnd + 1);
    if (r.winner === 'a') return ratio >= 0.6 ? '●●● 유리' : '●●○ 박빙(우세)';
    return pt > 0.5 ? '●○○ 불리' : '○○○ 매우 불리';
  };
  P.simFight = function (bt, tac, anchor) {
    var s = this.s, m = tac.ours || {}, def = !!bt.defense, frac = bt.commit || (def ? 1 : 0.75), base = def ? (bt.terrain || 1) * (1 + s.realm.defense / 400) : 1;
    var ours = { name: 'a', side: this.side, units: this.fieldUnits(frac, def), gen: bt.gen || this.cfg.gen, morale: this.myMorale(m.morale), terrain: (m.terrain || base), ambush: !!m.ambush };
    var df = this.deployFactor(bt, anchor); if (df) ours.units.forEach(function (u) { u.n = Math.round(u.n * df.f); });
    var en = this.enemyOf(bt); if (m.enemyAmbush) en.ambush = true;
    var bo = { rounds: bt.rounds || 6, pace: m.pace }; this.tune(ours, en, bo, { bt: bt, tac: tac, anchor: anchor, def: def }); var r = SG.battle(ours, en, bo);
    r.myN = ours.units.reduce(function (t, u) { return t + u.n; }, 0); r.foeN = en.units.reduce(function (t, u) { return t + u.n; }, 0);
    return r;
  };
  P.forceLine = function (my, foe) {
    var i = this.s.realm.intel, f = i >= 50 ? '' : '약 ';
    return '⚔ <b>전력 비교</b> — 아군 야전군 ' + my.toLocaleString() + '명 대 적 ' + f + (i < 10 ? '?' : (Math.round(foe / (i >= 50 ? 100 : 500)) * (i >= 50 ? 100 : 500)).toLocaleString()) + '명' + (my >= foe * 2 ? ' — 수적으로 압도합니다.' : my * 2 <= foe ? ' — 수적으로 크게 밀립니다.' : '') + (i < 25 ? ' <small>(첩보가 낮아 적 규모가 부정확합니다)</small>' : '');
  };
  P.simWar = function (T, frac, tac) {
    var s = this.s, ours = { name: 'a', side: this.side, units: this.fieldUnits(frac), gen: this.cfg.gen, morale: this.myMorale(), terrain: 1, ambush: !!(tac.m.ambush && s.realm.intel >= 30) };
    var en = { name: 'b', side: T.side || this.sides.silla, units: this.enemyUnits(T.side || this.sides.silla, T.garrison, T.mix), terrain: T.terrain || 1, morale: 68, fort: !!tac.m.fort || T.terrain >= 1.45 };
    var bo = { rounds: 6, pace: tac.m.pace }; this.tune(ours, en, bo, { T: T, tac: tac, def: false }); var r = SG.battle(ours, en, bo); r.win = r.winner === 'a' && r.aEnd / r.aStart >= 0.3; return r;
  };

  /* ── 사건 화면: 위치로 이동하고 적군 진로 표시 ── */
  P.situation = function (a) {
    var self = this, pl = SG.placeById(a.place), m = this.g.map; if (!pl) return;
    setTimeout(function () {
      self.drawDeploy(); m.setPlaceVisible(pl.id, true); m.markPlace(pl.id, 'act', true); m.ping(pl.lon, pl.lat);
      if (!a.battle) { m.focus(pl.lon, pl.lat, a.zoom || 1100, 1100); return; }
      var bt = a.battle, en = self.enemyOf(bt), tot = en.units.reduce(function (t, u) { return t + u.n; }, 0), org = self.foeOrigin(en.side);
      var dx = 0.2, dy = 0.14; if (org) { var d = Math.max(0.01, dist(org, pl)); dx = (org.lon - pl.lon) / d * 0.22; dy = (org.lat - pl.lat) / d * 0.22; }
      if (bt.defense) {
        m.setToken('ev_enemy', en.side, '', self.fuzz(tot, 'ev' + a.y), pl.lon + dx, pl.lat + dy, 'foe');
        if (org && org.id !== pl.id) m.drawRoute('ev', [org.id, [pl.lon + dx, pl.lat + dy]], en.side, { ms: 1100 });
        var df = self.deployFactor(bt, a);
        m.setToken('ev_own', self.side, '', fmt(self.fieldUnits(bt.commit || 1, true).reduce(function (t, u) { return t + u.n; }, 0) * (df ? df.f : 1)), pl.lon - dx * 0.3, pl.lat - dy * 0.3, 'own');
        m.fit(org && org.id !== pl.id && dist(org, pl) < 3.2 ? [pl.id, org.id] : [pl.id], 1100, a.zoom || 900);
      } else {
        m.setToken('ev_enemy', en.side, '', self.fuzz(tot, 'ev' + a.y), pl.lon, pl.lat, 'foe');
        var from = self.nearestStation(pl.id); m.markPlace(pl.id, 'atk', true);
        if (from) { m.drawRoute('ev', [from.pl.id, pl.id], self.side, { ms: 1100 }); m.fit([from.pl.id, pl.id], 1100, a.zoom || 900); } else m.focus(pl.lon, pl.lat, a.zoom || 900, 1000);
      }
    }, 30);
  };
  var _showInv = P.showInvasion;
  P.showInvasion = function (inv) {
    _showInv.call(this, inv);
    var self = this, m = this.g.map, pl = inv.place && SG.placeById(inv.place); if (!pl) return;
    setTimeout(function () {
      self.drawDeploy(); m.markPlace(pl.id, 'act', true); m.ping(pl.lon, pl.lat, 'hot');
      var org = self.foeOrigin(inv.enemy.side), dx = 0.2, dy = 0.14;
      if (org) { var d = Math.max(0.01, dist(org, pl)); dx = (org.lon - pl.lon) / d * 0.25; dy = (org.lat - pl.lat) / d * 0.25; m.drawRoute('ev', [org.id, [pl.lon + dx, pl.lat + dy]], inv.enemy.side, { ms: 1100 }); }
      m.setToken('ev_enemy', inv.enemy.side, '', self.fuzz(inv.enemy.total, 'inv' + self.s.year), pl.lon + dx, pl.lat + dy, 'foe');
      m.fit(org && dist(org, pl) < 3.2 ? [pl.id, org.id] : [pl.id], 1100, 900);
    }, 40);
  };
  var _inv = P.invasion;
  P.invasion = function () {
    var inv = _inv.call(this); if (!inv) return inv;
    var fr = this.stations().filter(function (x) { return x.role === 'front'; }); if (!fr.length) return inv;
    var wt = [4, 3, 2, 1], tot = 0, i; for (i = 0; i < fr.length; i++) tot += wt[i];
    var r = Math.random() * tot, pick = fr[0]; for (i = 0; i < fr.length; i++) { r -= wt[i]; if (r <= 0) { pick = fr[i]; break; } }
    inv.place = pick.pl.id; var selfI = this; inv.tactics.forEach(function (t) { if (t.special) return; var r = selfI.simFight(inv, t); t.hint += ' · 승산 ' + selfI.odds(r); inv.__f = r; });
    inv.intro += ' 급보가 이른 곳은 <b>' + pick.pl.name + '</b> 방면입니다.';
    return inv;
  };

  /* ── 정무 화면 ── */
  var _rt = P.renderTurn;
  P.renderTurn = function () {
    if (this.snap) { // 자유 입력 결과: 이전 수치와 비교
      var d = this.diffLine(this.snap); this.snap = null;
      if (d) this.s.last = (this.s.last || '') + '<div class="freehd">📊 <b>수치 변화</b> — ' + d + '</div>';
    }
    if (this.pre) { this.s.last = this.pre + (this.s.last || ''); this.pre = ''; }
    var fresh = !$('#chron .endyear');
    _rt.call(this); this.drawDeploy();
    var cp = SG.placeById(this.cfg.capPlace); if (fresh && cp) this.g.map.focus(cp.lon, cp.lat, 1700, 800);
  };
  var _dc = P.drawChoices;
  P.drawChoices = function () { if (this.g.map.pick) this.endPick(); _dc.call(this); };
  P.snapshot = function () { return { res: Object.assign({}, this.g.state.res), realm: Object.assign({}, this.s.realm), ap: this.s.ap }; };
  P.diffLine = function (b) {
    var RES = { food: '군량', gold: '금', people: '민심', morale: '사기' }, RL = { royal: '왕권', train: '훈련', defense: '방비', navy: '수군력', econ: '산업', intel: '첩보' }, out = [], self = this;
    for (var k in RES) { var a = Math.round(b.res[k]), z = Math.round(this.g.state.res[k]); if (a !== z) out.push(RES[k] + ' ' + a + '→' + z); }
    for (var q in RL) { var a2 = Math.round(b.realm[q]), z2 = Math.round(this.s.realm[q]); if (a2 !== z2) out.push(RL[q] + ' ' + a2 + '→' + z2); }
    if (b.ap !== this.s.ap) out.push('행동력 ' + b.ap + '→' + this.s.ap);
    return out.join(' · ');
  };

  /* ── 자유 입력: 해석 → 결과 → 수치 변화 ── */
  P.free = function (text) {
    var s = this.s, esc = text.replace(/</g, '&lt;'), r = SG.advisor.parse(text, this);
    if (r.kind === 'end') return this.confirmEnd(r);
    this.snap = this.snapshot();
    var hd = '<div class="freehd">📜 <b>교지</b> 「' + esc + '」<br>🧭 <b>참모의 해석</b> — ';
    if (r.kind === 'cmd') {
      var c = r.cmd, o = r.opt || {};
      hd += '「' + this.L(c.name) + '」 명령으로 받아들였습니다.';
      if (o.target) { var T = this.targetById(o.target); if (T) hd += ' 공격 목표: <b>' + this.L(T.name) + '</b>.'; }
      else if (c.needs === 'target') hd += ' 공격할 곳이 분명치 않아 지도에서 직접 고르게 합니다.';
      if (o.law) { var L = this.lawById(o.law); if (L) hd += ' 법령: ' + this.L(L.name) + '.'; }
      if (o.role) hd += ' 상대: ' + this.names[o.role] + '.';
      this.pre = hd + '</div>';
      return this.run(c, o);
    }
    s.stats.free++;
    var cats = SG.advisor.catsOf ? SG.advisor.catsOf(text) : [];
    this.pre = hd + '정해진 명령에 없는 뜻이라 ' + (cats.length ? '<b>' + cats.join('·') + '</b> 분야로 보고' : '일반적인 시행으로 보고') + ' 효과를 추정했습니다.</div>';
    return this.improvise(text, r);
  };
  var _init = P.init;
  P.init = function () { _init.call(this); this.s.owners = {}; this.s.deploy = {}; this.drawDeploy(); };

  /* ── 지도에서 성 눌렀을 때의 정보·행동 ── */
  P.tipInfo = function (pl) {
    if (!CASTLE[pl.kind] || !SG.placeActive(pl, this.s.year)) return null;
    var self = this, ow = this.ownerOf(pl), acts = [], html = '', inTurn = !!$('#chron .endyear');
    html += '<small>현재 소유: <b>' + (SG.sideName[ow] || '—') + '</b>' + (this.s.owners && this.s.owners[pl.id] === this.side ? ' (점령)' : '') + '</small>';
    if (ow === this.side) {
      var st = this.stations().filter(function (x) { return x.pl.id === pl.id; })[0];
      if (st) html += '<br><small>주둔 비율 ' + st.share + '% · 약 ' + fmt(Math.round(this.landTotal() * st.share / 10000) * 100) + ' 명</small>';
      var wd = this.cmds().filter(function (c) { return c.id === 'deploy'; })[0];
      if (inTurn && wd && !this.cmdAvail(wd)) acts.push({ label: '병력 배치 조정', fn: function () { self.run(wd); } });
    } else {
      var t = this.targets().filter(function (x) { return x.place === pl.id; })[0];
      if (t) {
        html += '<br><small>수비 추정 ' + this.estimate(t.garrison) + ' · 지형 ' + (t.terrain >= 1.6 ? '험준' : t.terrain >= 1.3 ? '견고' : '보통') + '</small>';
        var wc = this.warCmd(); if (inTurn && wc && !this.cmdAvail(wc)) acts.push({ label: '⚔ 이곳을 공격', fn: function () { self.run(wc, { target: t.id }); } });
        else if (inTurn) html += '<br><small>지금은 공격할 수 없습니다 (' + this.cmdAvail(wc) + ')</small>';
      } else html += '<br><small>지금은 공격 대상이 아닙니다.</small>';
    }
    return { html: html, actions: acts };
  };
})();
