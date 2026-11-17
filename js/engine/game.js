/* 게임 코어: 상태·자원·장면 진행·병력 배치·전투 계산·UI 렌더 */
window.SG = window.SG || {}; SG.data = SG.data || {};
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var RES = [['troops', '병력', '천'], ['food', '군량', '천석'], ['gold', '금', ''], ['people', '민심', ''], ['morale', '사기', '']];
  var RES_NAME = { troops: '병력', food: '군량', gold: '금', people: '민심', morale: '사기' };

  // ── 전투 수치 모델(게임 추상화 — 사료 수치 아님) ──
  var BASE = { // atk, def
    inf_levy: [6, 6], inf_line: [10, 10], inf_elite: [15, 12], cav_light: [12, 8], cav_heavy: [17, 11], archer: [10, 5], crossbow: [13, 5],
    siege: [9, 3], navy_war: [11, 10], navy_transport: [2, 4], guard: [13, 14], garrison: [8, 15], scout: [3, 3]
  };
  SG.BASE = BASE;
  function unitById(id) { var R = SG.data.rosters; for (var k in R) for (var i = 0; i < R[k].units.length; i++) if (R[k].units[i].id === id) return R[k].units[i]; return null; }
  function generalById(id) { var a = SG.data.generals || []; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  SG.unitById = unitById; SG.generalById = generalById;

  // force = {name, units:[{id,n}], gen:'gyebaek', terrain:1.0(방어 지형 보정), morale:0~100, fort:bool}
  function strength(f, vsFort) {
    var a = 0, d = 0, n = 0;
    f.units.forEach(function (u) {
      var U = unitById(u.id), b = BASE[U.base] || [8, 8], k = u.n;
      var atk = b[0] * (1 + 0.1 * U.atk), def = b[1] * (1 + 0.1 * U.def);
      if (U.base === 'siege' && vsFort) atk *= 1.8;
      a += k * atk; d += k * def; n += k;
    });
    var gen = f.gen ? generalById(f.gen) : null, gf = gen ? 1 + (gen.stats.cmd - 5) * 0.06 : 1;
    var mf = 0.6 + (f.morale == null ? 70 : f.morale) / 100 * 0.6;
    var t = f.terrain || 1, eng = f.cap && n > f.cap ? f.cap / n : 1; // 전선 폭 제한: 좁은 길목에선 일부만 교전
    return { atk: a * gf * mf * eng * (t > 1 ? 1 + (t - 1) * 0.5 : t), def: d * gf * mf * eng * t, n: n, eng: eng, gen: gen };
  }
  SG.battle = function (A, B, opt) {
    opt = opt || {};
    var a = A.units.map(function (u) { return { id: u.id, n: u.n }; }), b = B.units.map(function (u) { return { id: u.id, n: u.n }; });
    var Af = { name: A.name, units: a, gen: A.gen, terrain: A.terrain, morale: A.morale, cap: A.cap }, Bf = { name: B.name, units: b, gen: B.gen, terrain: B.terrain, morale: B.morale, cap: B.cap };
    var log = [], rounds = opt.rounds || 6, s0a = total(a), s0b = total(b);
    function total(x) { return x.reduce(function (s, u) { return s + u.n; }, 0); }
    for (var r = 1; r <= rounds; r++) {
      var sa = strength(Af, B.fort), sb = strength(Bf, A.fort);
      if (!sa.n || !sb.n) break;
      var ka = Math.min(0.4, 0.13 * sa.atk / (sb.def + 1) * (opt.pace || 1) * (r === 1 && A.ambush ? 1.7 : 1)) * sb.eng;
      var kb = Math.min(0.4, 0.13 * sb.atk / (sa.def + 1) * (opt.pace || 1) * (r === 1 && B.ambush ? 1.7 : 1)) * sa.eng;
      b.forEach(function (u) { u.n = Math.max(0, Math.round(u.n * (1 - ka))); });
      a.forEach(function (u) { u.n = Math.max(0, Math.round(u.n * (1 - kb))); });
      Af.morale = (Af.morale == null ? 70 : Af.morale) - 5 * (total(a) / (s0a + 1) < total(b) / (s0b + 1) ? 2 : 0.5);
      Bf.morale = (Bf.morale == null ? 70 : Bf.morale) - 5 * (total(b) / (s0b + 1) < total(a) / (s0a + 1) ? 2 : 0.5);
      log.push('제' + r + '합 — ' + A.name + ' ' + total(a).toLocaleString() + ' / ' + B.name + ' ' + total(b).toLocaleString());
    }
    var ra = total(a) / (s0a || 1), rb = total(b) / (s0b || 1);
    return { a: A, b: B, aStart: s0a, bStart: s0b, aEnd: total(a), bEnd: total(b), aLeft: a, bLeft: b, winner: ra > rb ? 'a' : 'b', ratio: ra / (rb || 0.01), log: log };
  };

  // ── 게임 ──
  function Game(root) {
    this.root = root; this.state = null; this.scenario = null;
    this.map = null;
  }
  Game.prototype.init = function () {
    var self = this;
    this.map = new SG.Map($('#map'), { onPlace: function (pl) { if (self.map.pick && self.map.pick[pl.id] && self.sb) return self.sb.onPick(self.map.pick[pl.id]); self.tip(pl); } });
    this.map.padFn = function () {
      var W = window.innerWidth, mob = W <= 820, c = $('#chron'), cw = c && c.innerHTML ? c.getBoundingClientRect() : null;
      var army = $('#army'), aw = army && !mob ? army.getBoundingClientRect().width + 12 : 0;
      return mob ? { l: 0, r: 0, t: 56, b: cw ? window.innerHeight - cw.top : 0 } : { l: aw, r: cw ? W - cw.left : 0, t: 56, b: 0 };
    };
    this.map.setTerritory('y660');
    $('#zin').onclick = function () { self.map.zoomBy(1 / 1.4); };
    $('#zout').onclick = function () { self.map.zoomBy(1.4); };
    $('#ztk').onclick = function () { var on = !/no-tk/.test(self.map.cls); self.map.setCls('no-tk', on); this.classList.toggle('on', !on); };
    $('#zhome').onclick = function () { self.map.focus(127.6, 37.6, 2000, 900); };
    $('#army h3').onclick = function () { $('#army').classList.toggle('army-collapsed'); };
    $('#tip .x').onclick = function () { $('#tip').style.display = 'none'; };
    this.map.focus(127.6, 38.2, 2300, 0);
  };
  Game.prototype.tip = function (pl) {
    var t = $('#tip'), side = SG.sideName[pl.side] || '';
    t.innerHTML = '<button class="x">×</button><b>' + pl.name + '</b> <small>' + (pl.hanja || '') + (side ? ' · ' + side : '') + '</small><br><small>현재 위치: ' + (pl.modern || '') + (pl.precision === 'disputed' ? ' (위치 학설 대립)' : '') + '</small><br>' + (pl.note || '') + (pl.src ? '<br><small>출처: ' + pl.src + '</small>' : '');
    var ex = this.sb && this.sb.tipInfo ? this.sb.tipInfo(pl) : null;
    if (ex) { t.insertAdjacentHTML('beforeend', '<div class="ex">' + ex.html + '</div>'); if (ex.actions.length) { var box = h('div', 'tipact'); ex.actions.forEach(function (a) { var b = h('button', 'btn pri', a.label); b.onclick = function () { t.style.display = 'none'; a.fn(); }; box.appendChild(b); }); t.appendChild(box); } }
    t.style.display = 'block'; $('.x', t).onclick = function () { t.style.display = 'none'; };
  };

  Game.prototype.start = function (scn) {
    this.scenario = scn;
    var s = this.state = { res: JSON.parse(JSON.stringify(scn.res)), flags: {}, army: JSON.parse(JSON.stringify(scn.army || {})), hist: 0, dec: 0, scene: null, visited: {} };
    $('#hud .who b').textContent = scn.king; $('#hud .who span').textContent = scn.sub;
    $('#hud .seal').textContent = scn.seal || '王';
    this.sb = null; this.map.clearTokens(); this.map.clearRoutes(); this.map.dynTerr = !!scn.sb; if (!scn.sb) this.map.setTerritory('y660'); else { this.map.gTerr.innerHTML = ''; this.map.gTerrLabels.innerHTML = ''; }
    if (scn.sb) { this.sb = new SG.Sandbox(this, scn.sb); this.sb.init(); }
    this.hud(); this.renderArmy();
    this.go(scn.start);
  };
  Game.prototype.hud = function (delta) {
    var r = this.state.res, box = $('#res'); box.innerHTML = '';
    var A = this.state.army; r.troops = Math.round(Object.keys(A).reduce(function (t, k) { return t + A[k]; }, 0) / 100) / 10;
    RES.forEach(function (x) {
      var v = r[x[0]], d = delta && delta[x[0]];
      var e = h('div', 'rs' + (d > 0 ? ' up' : d < 0 ? ' dn' : ''), '<i>' + x[1] + '</i><b>' + Math.round(v) + '</b>' + (x[0] === 'people' || x[0] === 'morale' ? '<span class="bar"><u style="width:' + Math.max(0, Math.min(100, v)) + '%"></u></span>' : '<i>' + x[2] + '</i>'));
      box.appendChild(e);
    });
  };
  Game.prototype.renderArmy = function () {
    var list = $('#army .list'), a = this.state.army; list.innerHTML = '';
    var tot = 0;
    Object.keys(a).forEach(function (id) {
      var U = unitById(id); if (!U || !a[id]) return; tot += a[id];
      var row = h('div', 'unit', '<div class="ico">' + U.hanja.charAt(0) + '</div><div><b>' + U.name + '</b><small>' + U.hanja + ' · ' + U.base.replace('_', ' ') + '</small></div><div class="n">' + a[id].toLocaleString() + '</div>');
      row.title = U.desc || ''; list.appendChild(row);
    });
    $('#army h3').innerHTML = '<span>군제 · 병력</span><span>' + tot.toLocaleString() + '명 ▾</span>';
  };
  Game.prototype.apply = function (fx) {
    if (!fx) return {};
    var r = this.state.res, d = {};
    for (var k in fx) { if (r[k] == null) continue; var before = r[k]; r[k] = Math.max(0, (k === 'people' || k === 'morale') ? Math.min(100, r[k] + fx[k]) : r[k] + fx[k]); d[k] = r[k] - before; }
    this.hud(d); return d;
  };
  Game.prototype.chips = function (d) {
    var s = ''; for (var k in d) if (d[k]) s += '<span class="' + (d[k] > 0 ? 'p' : 'm') + '">' + RES_NAME[k] + ' ' + (d[k] > 0 ? '+' : '') + Math.round(d[k]) + '</span>';
    return s ? '<div class="eff">' + s + '</div>' : '';
  };
  Game.prototype.setFlags = function (f) { if (f) for (var k in f) this.state.flags[k] = f[k]; };
  Game.prototype.f = function (k) { return this.state.flags[k]; };

  Game.prototype.go = function (id) {
    if (id === '__none__') return;
    if (this.sb && this.sb.handlers[id]) return this.sb.handlers[id].call(this.sb);
    if (id.indexOf('__') === 0) { var hd = this.scenario.handlers[id]; if (!hd) { console.error('handler?', id); return; } return hd(this); }
    var sc = this.scenario.scenes[id]; if (!sc) { console.error('scene?', id); return; }
    this.state.scene = id;
    var m = this.map, self = this;
    if (sc.terr) m.setTerritory(sc.terr);
    if (sc.setup) sc.setup(this);
    var delta = {};
    if (sc.fx && !this.state.visited[id]) delta = this.apply(sc.fx);
    this.state.visited[id] = 1;
    if (sc.flags) this.setFlags(sc.flags);
    var text = typeof sc.text === 'function' ? sc.text(this) : sc.text;
    this.page({ era: sc.era, title: sc.title, body: text, note: sc.note, src: sc.src, chips: this.chips(delta) });
    if (sc.anchor && this.sb) { var lb = h('button', 'btn locate', '📍 사건 위치 다시 보기'); lb.onclick = function () { self.sb.situation(sc.anchor); }; $('#chron .body').insertBefore(lb, $('#chron .body .note') || null); }
    if (sc.focus) m.focus(sc.focus[0], sc.focus[1], sc.focus[2], 1400);
    if (sc.kind === 'alloc') return this.allocUI(sc);
    if (sc.kind === 'end') return this.endUI(sc);
    var ch = typeof sc.choices === 'function' ? sc.choices(this) : sc.choices;
    this.choices(ch.map(function (c) { return { c: c, run: function () { self.pick(c); } }; }));
  };
  Game.prototype.page = function (p) {
    var el = $('#chron');
    el.innerHTML = '<div class="hd"><div class="era">' + (p.era || '') + '</div><h2>' + p.title + '</h2></div><div class="body">' +
      (p.body || []).map(function (t) { return /^</.test(t) ? t : '<p>' + t + '</p>'; }).join('') + (p.chips || '') +
      (p.note ? '<div class="note"><b>실제 역사 메모</b><br>' + p.note + '</div>' : '') + (p.src ? '<div class="src">출처: ' + p.src + '</div>' : '') + '</div><div class="choices"></div>';
    $('.body', el).scrollTop = 0;
  };
  Game.prototype.choices = function (list) {
    var self = this, box = $('#chron .choices'); box.innerHTML = '';
    list.forEach(function (x) {
      var c = x.c, b = h('button', 'ch', (c.tag ? '<span class="tag">' + c.tag + '</span>' : '') + c.label + (c.hint ? '<small>' + c.hint + '</small>' : ''));
      if (c.disabled) b.disabled = true;
      b.onclick = x.run; box.appendChild(b);
      if (c.place) { var go = function () { var pl = SG.placeById(c.place); if (!pl) return; self.map.focus(pl.lon, pl.lat, c.zoom || 1000, 600); self.map.ping(pl.lon, pl.lat); var cp = SG.placeById(self.scenario.sb && self.scenario.sb.capPlace); if (cp && cp.id !== pl.id) self.map.drawRoute('hov', [cp.id, pl.id], self.sb ? self.sb.side : 'baekje', { ms: 700 }); }; b.onmouseenter = go; b.onfocus = go; }
    });
  };
  Game.prototype.pick = function (c) {
    var self = this, d = this.apply(c.fx); this.setFlags(c.flags);
    if (c.tag !== '▶') { this.state.dec++; if (c.tag === '역사') this.state.hist++; }
    if (c.army) { for (var k in c.army) this.state.army[k] = Math.max(0, (this.state.army[k] || 0) + c.army[k]); this.renderArmy(); }
    var extra = ''; if (c.run) extra = c.run(this) || '';
    var next = typeof c.next === 'function' ? c.next(this) : c.next;
    if (c.result) {
      var body = $('#chron .body');
      body.insertAdjacentHTML('beforeend', '<div class="quote">' + c.result + '</div>' + this.chips(d) + extra);
      body.scrollTop = body.scrollHeight;
      this.choices([{ c: { label: '계속', tag: '▶' }, run: function () { self.go(next); } }]);
    } else this.go(next);
  };

  // 병력 배치 UI. cfg: {pool, stations:[{id,name,place,desc,max}], resolve(g, alloc)->nextId, intro}
  Game.prototype.allocUI = function (sc) {
    var self = this, cfg = sc.alloc, alloc = {}, m = $('#map');
    var pool = typeof cfg.pool === 'function' ? cfg.pool(this) : cfg.pool;
    var wrap = h('div', 'modal'), card = h('div', 'card');
    card.innerHTML = '<h2>' + cfg.title + '</h2><div class="sub">' + cfg.sub + ' · 배치 가능 병력 <b id="al-left"></b>천 명</div><div class="alloc"></div><div class="note" id="al-fb"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button class="btn pri" id="al-ok">배치 확정</button></div>';
    var box = $('.alloc', card), left = pool;
    cfg.stations.forEach(function (s) {
      alloc[s.id] = s.def || 0;
      var row = h('div', 'row', '<div><b>' + s.name + '</b><small>' + s.desc + '</small></div><input type="range" min="0" max="' + Math.min(pool, s.max || pool) + '" step="1" value="' + alloc[s.id] + '"><div class="v">' + alloc[s.id] + '천</div>');
      var rng = $('input', row), v = $('.v', row);
      rng.oninput = function () {
        var val = +rng.value, others = Object.keys(alloc).reduce(function (t, k) { return t + (k === s.id ? 0 : alloc[k]); }, 0);
        if (others + val > pool) { val = pool - others; rng.value = val; }
        alloc[s.id] = val; v.textContent = val + '천'; refresh();
      };
      row.onmouseenter = function () { var pl = SG.placeById(s.place); if (pl) self.map.focus(pl.lon, pl.lat, 900, 700); };
      box.appendChild(row);
    });
    function refresh() { left = pool - Object.keys(alloc).reduce(function (t, k) { return t + alloc[k]; }, 0); $('#al-left', card).textContent = left; $('#al-fb', card).innerHTML = cfg.feedback ? cfg.feedback(self, alloc, left) : ''; }
    refresh(); wrap.appendChild(card); this.root.appendChild(wrap);
    $('#al-ok', card).onclick = function () { wrap.remove(); self.state.flags.alloc = JSON.parse(JSON.stringify(alloc)); var nx = cfg.resolve(self, alloc, left); if (nx) self.go(nx); };
    this.choices([]);
  };

  // 전투 결과 모달. res=SG.battle(...) 결과, next=콜백
  Game.prototype.battleUI = function (r, title, outro, cb) {
    var wrap = h('div', 'modal'), card = h('div', 'card'), win = r.winner === 'a';
    card.innerHTML = '<h2>' + title + '</h2><div class="vs"><div class="side"><small>' + r.a.name + '</small><b>' + r.aStart.toLocaleString() + ' → ' + r.aEnd.toLocaleString() + '</b></div><div class="x">對</div><div class="side"><small>' + r.b.name + '</small><b>' + r.bStart.toLocaleString() + ' → ' + r.bEnd.toLocaleString() + '</b></div></div>' +
      '<div class="meter"><i style="width:' + Math.round(r.aEnd / (r.aEnd + r.bEnd + 1) * 100) + '%;background:var(--c-' + (r.a.side || 'baekje') + ')"></i><i style="flex:1;background:var(--c-' + (r.b.side || 'silla') + ')"></i></div>' +
      (r.factors && r.factors.length ? '<div class="facts"><h4>승부를 가른 요인</h4><ul><li>' + r.factors.join('</li><li>') + '</li></ul></div>' : '') + '<div class="log" style="margin-top:10px">' + r.log.join('<br>') + '</div>' + (outro ? '<div class="note">' + outro + '</div>' : '') +
      '<div style="text-align:right;margin-top:10px"><button class="btn pri">결과 확인</button></div>';
    $('.btn', card).onclick = function () { wrap.remove(); cb && cb(r); };
    wrap.appendChild(card); this.root.appendChild(wrap);
  };

  Game.prototype.endUI = function (sc) {
    var self = this, e = sc.ending;
    var cmp = '<div class="cmp"><div><h4>내가 만든 역사</h4>' + e.mine + '</div><div><h4>실제 역사</h4>' + e.real + '</div></div>';
    var score = e.score ? e.score(this) : null;
    var tmpl = '<div class="endseal">' + e.seal + '</div>' + cmp + (score != null ? '<div class="note"><b>역사 일치도 ' + score + '%</b> — 선택이 실제 역사와 얼마나 같았는지의 지표입니다.</div>' : '');
    $('#chron .body').insertAdjacentHTML('beforeend', tmpl);
    this.choices([{ c: { label: '다시 시작하기 (왕 추첨으로)', tag: '↺' }, run: function () { SG.toTitle(); } }]);
  };

  SG.Game = Game;
})();
