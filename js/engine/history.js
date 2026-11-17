/* 역사 분기: 지도 소유권을 "정해진 연표"가 아니라 플레이 결과에 맞춘다.
   - 연표상의 영토 변화는 그 해의 전투 결과가 나온 뒤에만 적용한다.
   - 내가 역사와 다르게 이기면(지면) 그 변화는 막히고, 이후 그 성은 연표를 따르지 않는다.
   - 방어전에서 지면 성을 빼앗기고, 공격전에서 이기면 그 성을 얻는다. */
(function () {
  var P = SG.Sandbox.prototype, CASTLE = { capital: 1, city: 1, fortress: 1, port: 1, pass: 1 };
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function nm(side) { return (SG.sideName && SG.sideName[side]) || side; }
  function recent(v, k) { return v != null && v >= k - 1 && v <= k; }

  var _init = P.init;
  P.init = function () { var r = _init.apply(this, arguments); if (this.s && this.s.hy == null) this.s.hy = this.s.year; return r; };

  // 소유: 내 플레이가 바꾼 것(owners) > 결과가 반영된 해(hy)까지의 연표
  P.ownerOf = function (pl) { var s = this.s, o = s.owners; return (o && o[pl.id]) || SG.ownerAt(pl, s.hy != null ? s.hy : s.year); };

  // 지금 내 성을 모두 '내 것'으로 굳힌다(이후 연표가 빼앗아 가지 못함)
  P.freezeMine = function () { var self = this, s = this.s; s.owners = s.owners || {}; SG.data.places.forEach(function (pl) { if (!pl.offmap && CASTLE[pl.kind] && !s.owners[pl.id] && self.ownerOf(pl) === self.side) s.owners[pl.id] = self.side; }); };
  P.syncHistory = function (upto) {
    var self = this, s = this.s, me = this.side, notes = [];
    if (s.hy == null) { s.hy = upto; return; }
    s.owners = s.owners || {}; var won = s.wonVs || {}, lost = s.lostVs || {};
    for (var k = s.hy + 1; k <= upto; k++) {
      SG.data.places.forEach(function (pl) {
        if (pl.offmap || !CASTLE[pl.kind] || s.owners[pl.id]) return;
        var A = SG.ownerAt(pl, k - 1), B = SG.ownerAt(pl, k); if (A === B) return;
        var block = false, why = '';
        if (A === me) { block = !recent(s.lostAt, k); why = '지켜 냈습니다'; }
        else if (B === me) { block = recent(s.lostAt, k); why = '얻지 못했습니다'; }
        else { block = recent(won[B], k) || recent(lost[A], k); why = nm(A) + '의 손에 남았습니다'; }
        if (block) { s.owners[pl.id] = A; if (SG.placeActive(pl, k)) notes.push(pl.name.replace(/\(.*?\)/g, '') + ' — ' + (A === me || B === me ? why : why)); }
      });
    }
    s.hy = upto;
    if (notes.length) { this.pre = (this.pre || '') + '<div class="freehd">🗺 <b>역사가 달라졌습니다</b> — 실제 역사에서는 주인이 바뀐 곳: ' + notes.slice(0, 6).join(' · ') + (notes.length > 6 ? ' 외 ' + (notes.length - 6) + '곳' : '') + '</div>'; this.log('역사와 다른 길: ' + notes.length + '곳의 주인이 달라짐'); }
  };

  // 영토 색을 정하는 보조 지점: 가까운 성의 실제 주인을 따른다
  P.seedOwner = function (sd) {
    var s = this.s, y = s.hy != null ? s.hy : s.year, h = SG.ownerFrom(sd.own, y), o = s.owners; if (!o) return h;
    var best = null, bd = 1.1; this.places().forEach(function (pl) { var d = dist(pl, sd); if (d < bd) { bd = d; best = pl; } });
    return best && o[best.id] ? o[best.id] : h;
  };
  // 내가 지킨(빼앗은) 성은 연표상 사라질 해가 지나도 지도에 남긴다
  var _places = P.places;
  P.places = function () {
    var a = _places.call(this), o = this.s.owners; if (!o) return a; var have = {}; a.forEach(function (p) { have[p.id] = 1; });
    var y0 = this.cfg.start, y1 = this.s.year;
    SG.data.places.forEach(function (pl) { if (have[pl.id] || !o[pl.id] || pl.offmap || !CASTLE[pl.kind]) return; for (var y = y0; y <= y1; y++) if (SG.placeActive(pl, y)) { a.push(pl); return; } });
    return a;
  };

  var _fight = P.fight;
  P.fight = function (bt, tac, anchor) { this._anc = anchor || null; return _fight.apply(this, arguments); };

  var _after = P.afterFight;
  P.afterFight = function (bt, kind, r, bribe) {
    var self = this, s = this.s, me = this.side, foe = (bt.enemy && bt.enemy.side) || this.sides.silla, anc = this._anc, extra = '';
    this._anc = null; s.owners = s.owners || {};
    if (kind === 'lose') { s.lostAt = s.year; s.lostVs = s.lostVs || {}; s.lostVs[foe] = s.year; }
    else { s.wonVs = s.wonVs || {}; s.wonVs[foe] = s.year; }
    var pid = bt.place || (anc && anc.place), pl = pid && SG.placeById(pid), cap = this.cfg.capPlace;
    if (!bribe && pl && !pl.offmap && CASTLE[pl.kind]) {
      if (kind !== 'lose' && !bt.defense && this.ownerOf(pl) === foe && foe !== me) {
        s.owners[pl.id] = me; extra = '<div class="note">🏯 <b>' + pl.name + '</b>을(를) 차지했습니다. 지도에 반영됩니다.</div>'; if (this.capitalFall) this.capitalFall(pl, foe);
      }
    }
    if (kind === 'lose' && bt.defense && !bt.loseEnd && !bt.raid && foe !== me) {
      var tgt = pl && CASTLE[pl.kind] && this.ownerOf(pl) === me && pl.id !== cap ? pl : null;
      if (!tgt) { // 수도이거나 내 성이 아니면: 그곳에서 가장 가까운 내 변경 성
        var ref = pl || this.foeOrigin(foe) || SG.placeById(cap), mine = this.places().filter(function (p) { return self.ownerOf(p) === me && p.id !== cap; });
        if (ref && mine.length > 1) { mine.sort(function (a, b) { return dist(a, ref) - dist(b, ref); }); tgt = mine[0]; }
      }
      if (tgt) { s.owners[tgt.id] = foe; extra = '<div class="note">🏴 <b>' + tgt.name + '</b>이(가) ' + nm(foe) + '의 손에 넘어갔습니다. 지도에 반영됩니다.</div>'; this.log(tgt.name + ' 상실'); }
    }
    if (!bt.noSync) this.syncHistory(s.year); else { this.freezeMine(); s.hy = Math.max(s.hy || 0, s.year); }
    var res = _after.apply(this, arguments);
    if (extra) { var b = document.querySelector('#chron .body'); if (b) b.insertAdjacentHTML('beforeend', extra); }
    if (this.drawDeploy) this.drawDeploy();
    return res;
  };

  var _wf = P.warEff;
  P.warEff = function (T, win) { if (win) { var s = this.s; s.wonVs = s.wonVs || {}; s.wonVs[T.side || this.sides.silla] = s.year; } return _wf.apply(this, arguments); };

  var _ye = P.yearEnd;
  P.yearEnd = function () { this.syncHistory(this.s.year); return _ye.apply(this, arguments); };

  var _fin = P.finish;
  P.finish = function (kind) {
    var s = this.s; if (kind === 'conquered') { s.lostAt = s.year; }
    this.syncHistory(s.year); if (this.drawDeploy) try { this.drawDeploy(); } catch (e) { }
    return _fin.apply(this, arguments);
  };
})();

/* ── 수도 함락: 수도를 빼앗긴 나라는 국력이 급락한다. 남은 도읍·성이 없으면 멸망하고 남은 성은 이웃이 나눠 갖는다. ── */
(function () {
  var P = SG.Sandbox.prototype, CASTLE = { capital: 1, city: 1, fortress: 1, port: 1, pass: 1 };
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function nm(side) { return (SG.sideName && SG.sideName[side]) || side; }
  function short(pl) { return pl.name.replace(/\(.*?\)/g, '').trim(); }

  P.isSeat = function (pl, side) { var s = this.s; return (s.seat && s.seat[side] === pl.id) || (pl.kind === 'capital' && pl.side === side); };
  P.capitalFall = function (pl, prev) {
    var self = this, s = this.s, me = this.side; if (!pl || !prev || prev === me || !this.isSeat(pl, prev)) return;
    if (s.destroyed && s.destroyed[prev]) return;
    var role = this.roleOf(prev), w = role && s.world[role], rest = this.places().filter(function (p) { return self.ownerOf(p) === prev && p.id !== pl.id; });
    var seats = rest.filter(function (p) { return p.kind === 'capital' && p.side === prev; }), msg, chips = '';
    s.fallen = s.fallen || {}; s.fallen[prev] = (s.fallen[prev] || 0) + 1; s.seat = s.seat || {};
    var end = rest.length < 3 || (!seats.length && s.fallen[prev] >= 2);
    if (end) {
      s.destroyed = s.destroyed || {}; s.destroyed[prev] = s.year; delete s.seat[prev];
      if (w) { w.p = Math.min(w.p, 4); w.hostility = 0; if (role === 'tang') w.commit = 0; }
      if (role && this.names[role].indexOf('멸망') < 0) this.names[role] += '(멸망)';
      msg = '👑 <b>' + nm(prev) + ' 멸망</b> — 도읍 ' + short(pl) + '이(가) 함락되어 ' + nm(prev) + '의 조정이 무너졌습니다. 남은 성들은 주인을 잃고 이웃 나라들이 차례로 차지할 것입니다.';
      chips = this.eff({ fx: { gold: 30, morale: 12, people: 5 }, realm: { royal: 8 } }); this.log(nm(prev) + ' 멸망 (도읍 ' + short(pl) + ' 함락)');
    } else {
      var to = seats[0]; if (!to) { var home = SG.placeById(this.cfg.capPlace) || pl, cls = function (p) { return p.kind === 'city' || p.kind === 'capital' ? 0 : p.kind === 'fortress' ? 1 : 2; }; rest.sort(function (a, b) { return cls(a) - cls(b) || dist(b, home) - dist(a, home); }); to = rest[0]; }
      s.seat[prev] = to.id; var before = w ? w.p : 0;
      if (w) { w.p = Math.max(4, Math.round(w.p * (seats.length ? 0.55 : 0.4))); if (role === 'tang') w.commit = Math.round(w.commit * 0.5); else w.hostility = Math.min(100, w.hostility + 15); }
      msg = '👑 <b>' + nm(prev) + '의 도읍 ' + short(pl) + ' 함락</b> — ' + nm(prev) + '은(는) ' + short(to) + '(으)로 달아나 조정을 다시 세웠습니다.' + (w ? ' 국력 ' + Math.round(before) + ' → ' + Math.round(w.p) + '.' : '') + ' 그곳마저 잃으면 나라가 무너집니다.';
      chips = this.eff({ fx: { gold: 20, morale: 8, people: 3 }, realm: { royal: 5 } }); this.log(nm(prev) + ' 도읍 ' + short(pl) + ' 함락 — ' + short(to) + ' 천도');
    }
    this.pre = (this.pre || '') + '<div class="freehd">' + msg + chips + '</div>';
  };

  // 성을 차지할 때마다 수도였는지 확인
  var _cap = P.capturePlace;
  P.capturePlace = function (T) {
    var pl = T && SG.placeById(T.place), prev = pl ? this.ownerOf(pl) : null;
    var r = _cap.apply(this, arguments); if (pl && prev) this.capitalFall(pl, prev); return r;
  };

  // 멸망한 나라의 남은 성: 해마다 가장 가까운 이웃 나라가 차지
  P.partition = function () {
    var self = this, s = this.s, d = s.destroyed; if (!d) return;
    var all = this.places(), notes = [];
    Object.keys(d).forEach(function (side) {
      var left = all.filter(function (p) { return self.ownerOf(p) === side; }); if (!left.length) return;
      var live = all.filter(function (p) { var o = self.ownerOf(p); return o !== side && !d[o] && /^(baekje|silla|goguryeo|gaya|tang|wa)$/.test(o); });
      if (!live.length) return;
      var cand = left.map(function (p) { var b = null, bd = 99; live.forEach(function (q) { var x = dist(p, q) * (self.ownerOf(q) === self.side ? 0.85 : 1); if (x < bd) { bd = x; b = q; } }); return { p: p, to: self.ownerOf(b), d: bd }; });
      cand.sort(function (a, b) { return a.d - b.d; });
      cand.slice(0, 3).forEach(function (c) { s.owners[c.p.id] = c.to; notes.push(short(c.p) + ' → ' + nm(c.to)); });
      var role = self.roleOf(side), w = role && s.world[role]; if (w) { w.p = Math.min(w.p, 4); w.hostility = 0; }
    });
    if (notes.length) this.pre = (this.pre || '') + '<div class="freehd">🏳 <b>주인 잃은 성들의 향방</b> — ' + notes.join(' · ') + '</div>';
  };
  var _ye2 = P.yearEnd;
  P.yearEnd = function () { this.s.owners = this.s.owners || {}; this.partition(); return _ye2.apply(this, arguments); };

  // 멸망한 나라와의 사료 속 전투는 일어나지 않는다
  var _turn = P.turn;
  P.turn = function () {
    var s = this.s, d = s.destroyed, self = this;
    if (d) this.anchors.forEach(function (A) {
      var D = A.a || A, bt = D.battle, e = bt && bt.enemy, side = e && (e.side || self.sides.silla);
      if (A.y === s.year && !s.shown[A.id] && side && d[side] && !D.last && !bt.last) {
        s.shown[A.id] = 1; self.pre = (self.pre || '') + '<div class="freehd">📜 <b>일어나지 않은 역사</b> — 실제 역사에서는 이 해에 「' + self.L(D.title || bt.title || '') + '」이(가) 있었으나, ' + nm(side) + '이(가) 이미 멸망해 일어나지 않았습니다.</div>';
      }
    });
    return _turn.apply(this, arguments);
  };
})();
