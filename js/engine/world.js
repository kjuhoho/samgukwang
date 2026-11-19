/* 천하의 움직임: 다른 나라들도 해마다 스스로 움직인다 — 이웃을 치고, 성을 빼앗고, 도읍이 함락되면 무너진다.
   연표(실제 역사)는 길잡이일 뿐이고, 여기서 주인이 바뀐 성은 이후 연표를 따르지 않는다. */
(function () {
  var P = SG.Sandbox.prototype, ACT = { baekje: 1, silla: 1, goguryeo: 1, gaya: 1, tang: 1 }, KDEF = { capital: 0.22, fortress: 0.06, pass: 0.1, city: 0, port: 0 };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function nm(side) { return (SG.sideName && SG.sideName[side]) || side; }
  function jo(w, a, b) { var c = w.charCodeAt(w.length - 1); return w + ((c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? a : b); } // 받침에 따라 이/가, 을/를
  function short(pl) { return pl.name.replace(/\(.*?\)/g, '').trim(); }

  P.sidePower = function (side) {
    var s = this.s, r = this.roleOf(side), w = r && s.world[r];
    if (!w) return side === 'gaya' ? 18 : 25;
    return r === 'tang' ? 90 + w.commit * 0.4 : w.p;
  };
  P.worldSim = function () {
    var self = this, s = this.s, me = this.side, all = this.places(), d = s.destroyed || {}, notes = [], coal = (s.coal && s.coal.members) || [];
    s.owners = s.owners || {};
    var nm = function (side) { var r = self.roleOf(side); return r ? self.names[r].replace('(멸망)', '') : ((SG.sideName && SG.sideName[side]) || side); };
    var by = {}; all.forEach(function (p) { var o = self.ownerOf(p); if (o) (by[o] = by[o] || []).push(p); });
    Object.keys(by).forEach(function (a) {
      if (!ACT[a] || a === me || d[a]) return;
      var ra = self.roleOf(a), pa = self.sidePower(a);
      if (a === 'tang' && (!ra || s.world[ra].commit < 40)) return;
      s.wsLast = s.wsLast || {}; if (s.year - (s.wsLast[a] || -9) < 3) return; // 한 나라가 잇달아 싸우지는 않는다
      if (Math.random() > 0.13 + (pa > 70 ? 0.04 : 0)) return;
      var own = by[a], cand = [];
      all.forEach(function (p) {
        var o = self.ownerOf(p); if (!o || o === a || o === me || !ACT[o] || s.owners[p.id] === '__lock') return;
        var ro = self.roleOf(o); if (ra && ro && coal.indexOf(ra) >= 0 && coal.indexOf(ro) >= 0) return; // 연합끼리는 싸우지 않는다
        var bd = 9; own.forEach(function (q) { var x = dist(p, q); if (x < bd) bd = x; });
        if (p.kind === 'capital' && (a === 'gaya' || pa < self.sidePower(o) * 1.25)) return; // 도읍은 확실히 우세할 때만 노린다
        if (bd <= 1.3) cand.push({ p: p, o: o, d: bd + Math.random() * 0.5 - (d[o] ? 0.4 : 0) });
      });
      if (!cand.length) return;
      cand.sort(function (x, y) { return x.d - y.d; });
      var t = cand[0], pd = Math.max(self.sidePower(t.o), t.p.kind === 'capital' ? 35 : 0), fallen = s.fallen && s.fallen[t.o];
      var ch = clamp(0.38 + (pa - pd) / 130 - (KDEF[t.p.kind] || 0) + (fallen ? 0.15 : 0), 0.08, 0.8);
      var ro2 = self.roleOf(t.o), wa = ra && s.world[ra], wd = ro2 && s.world[ro2];
      if (Math.random() < ch) {
        s.wsLast[a] = s.year; var seat = self.isSeat && self.isSeat(t.p, t.o);
        s.owners[t.p.id] = a; by[a].push(t.p);
        if (wa && ra !== 'tang') wa.p = clamp(wa.p + 2, 5, 150); if (wd && ro2 !== 'tang') wd.p = clamp(wd.p - 3, 4, 150);
        notes.push('<b>' + jo(nm(a), '이', '가') + '</b> ' + nm(t.o) + '의 <b>' + jo(short(t.p), '을', '를') + '</b> 빼앗았습니다');
        self.log(nm(a) + ', ' + nm(t.o) + '의 ' + short(t.p) + ' 점령');
        if (seat && self.capitalFall) self.capitalFall(t.p, t.o, a);
      } else {
        if (wa && ra !== 'tang') wa.p = clamp(wa.p - 1, 5, 150);
        if (Math.random() < 0.6) notes.push(jo(nm(a), '이', '가') + ' ' + nm(t.o) + '의 ' + jo(short(t.p), '을', '를') + ' 쳤으나 물러났습니다');
      }
    });
    if (notes.length) this.pre = (this.pre || '') + '<div class="freehd">🌏 <b>천하의 움직임</b> — ' + notes.join(' · ') + '. <small>(실제 역사와 다를 수 있습니다)</small></div>';
  };
  var _ye = P.yearEnd;
  P.yearEnd = function () { try { this.worldSim(); } catch (e) { console.warn('worldSim', e); } return _ye.apply(this, arguments); };
})();
