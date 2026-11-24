/* 군비 경쟁 (게임 추상화 모델)
 * 플레이어가 병력을 대량으로 사들이면, 이웃 나라도 위협을 느끼고 병력을 사들여 균형을 맞춘다.
 *  - 반응의 크기 = 우리 군세가 얼마나 불었는가 × 그 나라가 우리를 얼마나 경계하는가(국경·관계·적의·우리의 덩치)
 *  - 나라의 금·군량이 허락하는 만큼만 사들이고(재정 부담), 한 해에 총병력의 12%를 넘기지 못한다.
 *  - 한 나라가 우리가 사들인 몫보다 더 많이 사들이지는 않는다.
 *  - 사들인 병력은 병력 상한(군비 확장분)을 올려 주고, 이 확장분은 해마다 10%씩 풀려 원래 상한으로 돌아간다(상한을 넘는 병력은 줄어든다).
 *  - 군비를 늘린 나라는 성의 수비대와 우리를 치는 원정군, 앵커 전투의 적군도 그만큼 두터워진다.
 * 후계 시대(연장 구간)에는 나라들이 괜히 약해지지 않고 계속 자라며, 우리 형편(세력·병력)에 맞춰 더 거세게 나온다.
 * 문장은 함수 안에서 만들어지므로 L3()로 지금 언어에 맞춰 고른다(언어를 바꾸면 화면을 다시 불러온다). */
(function () {
  var P = SG.Sandbox.prototype;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function L3(ko, en, ja) { var l = SG.i18n && SG.i18n.lang; return l === 'en' ? en : l === 'ja' ? ja : ko; }
  SG.L3 = SG.L3 || L3;
  var CFG = SG.ARMS = { thr: 0.06, react: 0.85, maxYr: 0.12, decay: 0.9, capMax: 0.35 };

  function bumpP(sb, side, dv) {   // 국력(세계 수치 또는 보조 수치)을 조금 올린다
    var r = sb.roleOf(side), w = r && sb.s.world[r];
    if (r === 'tang') return;
    if (w) w.p = clamp(w.p + dv, 4, 400);
    else { var ai = sb.s.ai = sb.s.ai || {}; ai.pw = ai.pw || {}; sb.sidePower(side); ai.pw[side] = clamp(ai.pw[side] + dv, 6, 90); }
  }
  function nmOf(sb, side) { var r = sb.roleOf(side); return r ? sb.names[r].replace('(멸망)', '') : ((SG.sideName && SG.sideName[side]) || side); }

  /* ① 우리의 병력 증강을 기록한다 — 명령 하나로 병력이 크게 늘면(대량 구매·대모집) 올해의 '구매량'에 더한다 */
  P.noteBuy = function (d) {
    var s = this.s, a = s.arms = s.arms || { pend: 0, hist: {} };
    a.pend = (a.pend || 0) + d; a.hist = a.hist || {}; a.hist[s.year] = (a.hist[s.year] || 0) + d;
  };
  var _run = P.run;
  P.run = function (c) {
    var before = this.armyTotal(), r = _run.apply(this, arguments);
    try { var d = this.armyTotal() - before; if (d >= 1500) this.noteBuy(d); } catch (e) { }
    return r;
  };

  /* ② 병력 상한: 군비 확장분이 더해진다(해마다 풀림). 전력(milFactor)은 평시 상한을 기준으로 삼아, 병력이 불면 그만큼 세진다 */
  var _mc = P.milCap;
  P.milCapBase = _mc;
  P.milCap = function (side) {
    var v = _mc.apply(this, arguments), nn = this.s.ai && this.s.ai.nat && this.s.ai.nat[side], b = (nn && nn.armB || 0) + extB(this);
    return b > 0 ? Math.round(v * (1 + b) / 1000) * 1000 : v;
  };
  P.milFactor = function (side) { return clamp(this.milOf(side) / (_mc.call(this, side) * 0.72), 0.55, 1.25); };

  /* ③ 이웃 나라가 우리 증강을 얼마나 신경 쓰는가 */
  function concern(sb, sd, dom) {
    var s = sb.s, r = sb.roleOf(sd), w = r && s.world[r], rel = r && s.rel[r] != null ? s.rel[r] : 50, c;
    var org = sb.foeOrigin ? sb.foeOrigin(sd) : null, near = 9;
    if (org) sb.myPlaces().forEach(function (p) { near = Math.min(near, dist(org, p)); });
    c = r === 'tang' ? 0.45 : r === 'wa' ? 0.5 : near <= 1.6 ? 1 : near <= 3.2 ? 0.8 : 0.55;   // 국경을 맞댈수록 민감하다
    c *= rel >= 70 ? 0.35 : rel >= 55 ? 0.65 : rel < 35 ? 1.2 : 1;                                // 우호국은 덜 경계한다
    c *= 0.8 + clamp(w ? (r === 'tang' ? w.commit : w.hostility) : 30, 0, 100) / 200;             // 적의가 높을수록 민감하다
    if (dom >= 4) c *= 1.2;                                                                        // 우리가 너무 커졌다
    if (s.coal && s.coal.members && r && s.coal.members.indexOf(r) >= 0) c *= 0.3;                 // 한편이면 덜하다
    return c;
  }
  P.armsRace = function () {
    var self = this, s = this.s, a = s.arms = s.arms || { pend: 0, hist: {} }, rows = [];
    this.natSides().forEach(function (sd) { var n = self.nat(sd); if (n.armB) { n.armB *= CFG.decay; if (n.armB < 0.012) n.armB = 0; } });   // 지난 군비 확장이 서서히 풀린다
    var pend = a.pend || 0; a.pend = 0;
    if (pend < 1500) return rows;
    var base = Math.max(15000, this.armyTotal() - pend), pct = clamp(pend / base, 0, 0.8);   // 올해 우리 군세가 얼마나 불었나
    if (pct < CFG.thr) return rows;
    var dom = this.dominance ? this.dominance() : 0;
    this.natSides().forEach(function (sd) {
      var n = self.nat(sd), want = clamp((pct - CFG.thr) * concern(self, sd, dom) * CFG.react * 1.2, 0, CFG.maxYr);   // 조금 불린 정도는 못 본 척하고, 많이 불릴수록 크게 반응한다
      if (want < 0.012) return;
      var m0 = self.milOf(sd), cap0 = _mc.call(self, sd), delta = Math.min(Math.round(m0 * want / 100) * 100, Math.round(pend / 100) * 100);
      var cg = delta / 1000 * 0.9, cf = delta / 1000 * 1.3, aff = clamp(Math.min(n.gold / Math.max(1, cg), (n.food - 6) / Math.max(1, cf)), 0.25, 1);   // 곳간이 허락하는 만큼만
      delta = Math.round(delta * aff / 100) * 100; if (delta < 300) return;
      n.gold = Math.max(0, n.gold - cg * aff); n.food = Math.max(6, n.food - cf * aff);
      n.mil = m0 + delta; n.armB = clamp((n.armB || 0) + delta / cap0, 0, CFG.capMax);
      n.people = clamp(n.people - clamp(delta / 6000, 0.3, 1.5), 5, 100);
      bumpP(self, sd, clamp(delta / cap0 * 14, 0.3, 3));
      var r = self.roleOf(sd), w = r && s.world[r];
      if (w && r !== 'tang' && (s.rel[r] == null || s.rel[r] < 70) && pct >= 0.15) w.hostility = clamp(w.hostility + (pct >= 0.35 ? 2 : 1), 0, 100);   // 너무 크게 불리면 경계심도 커진다
      rows.push({ sd: sd, d: delta });
    });
    a.last = { y: s.year, pct: pct, rows: rows };
    return rows;
  };
  function armsBlock(sb, rows) {
    var intel = sb.s.realm.intel, body;
    if (intel >= 25) {
      body = '<div>' + L3('우리가 병력을 크게 사들이자 이웃 나라들도 위협을 느끼고 병력을 사들였습니다.', 'As we bought troops in bulk, our neighbors felt threatened and bought troops of their own.', '我が国が兵を大量に買い入れると、隣国も脅威を感じて兵を買い入れました。') + '</div>' +
        rows.map(function (x) { return '<div><b>' + nmOf(sb, x.sd) + ' — </b>' + L3('병력', 'troops', '兵力') + ' +' + x.d.toLocaleString() + '</div>'; }).join('');
    } else body = '<div>' + L3('이웃 나라들이 병력을 불리는 낌새가 있습니다. 첩보력이 낮아 규모는 알 수 없습니다.', 'Neighbors seem to be building up their forces. Our spy network is too weak to tell how much.', '隣国が兵力を増やしている気配があります。諜報力が低く規模は分かりません。') + '</div>';
    return '<div class="freehd">⚔ <b>' + L3('군비 경쟁', 'Arms Race', '軍拡競争') + '</b>' + body + '</div>';
  }
  /* ④ 군비를 늘린 나라는 실제 전장에서도 두터워진다 — 성 수비대·앵커 전투의 적군 */
  function armB(sb, side) { var nn = sb.s.ai && sb.s.ai.nat && sb.s.ai.nat[side]; return nn && nn.armB > 0 ? nn.armB : 0; }
  var _dt = P.dynTarget;
  P.dynTarget = function (pl, ow) {
    var t = _dt.apply(this, arguments), b = armB(this, ow);
    if (b > 0.01) t.garrison = Math.round(t.garrison * clamp(1 + 0.8 * b, 1, 1.3) / 500) * 500;
    return t;
  };
  var _eo = P.enemyOf;
  P.enemyOf = function (bt) {
    var en = _eo.apply(this, arguments), b = en && armB(this, en.side);
    if (b > 0.01) { var k = clamp(1 + 0.6 * b, 1, 1.2); en.units.forEach(function (u) { u.n = Math.round(u.n * k); }); }
    return en;
  };
  /* ⑤ 후계 시대(+20년): 나라들은 괜히 약해지지 않고 계속 자라며, 우리 형편에 맞춰 더 거세게 나온다
   *  - 압박도 extP: 연장이 시작되면 0.35, 20년이면 약 0.85, 40년이면 1.35(최대 1.5)
   *  - 우리 형편 plF(0~1): 우리의 세력(점령지·멸망시킨 나라)과 병력이 이웃 평균에 견주어 얼마나 큰가 — 잘 나갈수록 이웃도 더 크게 자란다
   *  - 효과: 병력 상한·국력 목표 상승 / 해마다의 곳간·병력 증가 / 국력이 꺾이지 않음 / 당이 계속 한반도를 노림 / 우리를 치는 공세가 잦고 커짐 */
  P.extP = function () {
    var s = this.s; if (!s.extended || CFG.extOff) return 0;
    var y0 = this.cfg.end0 != null ? this.cfg.end0 : this.cfg.end;
    return clamp(0.35 + (s.year - y0) / 40, 0.35, 1.5);
  };
  P.plF = function () { var e = this.s.ext; return e && e.pl || 0; };
  function calcPl(sb) {
    var sides = sb.natSides(), tot = 0, dom = sb.dominance ? sb.dominance() : 0;
    sides.forEach(function (sd) { tot += sb.milOf(sd); });
    var avg = sides.length ? tot / sides.length : 60000;
    return clamp(0.5 * clamp((dom - 2) / 8, 0, 1) + 0.5 * clamp((sb.armyTotal() / Math.max(30000, avg) - 0.4) / 0.8, 0, 1), 0, 1);
  }
  function extB(sb) { var p = sb.extP(); return p ? clamp(0.2 * p * (0.6 + 0.8 * sb.plF()), 0, 0.3) : 0; }
  P.extStrike = function () { var p = this.extP(); return p ? 1 + 1.3 * p * (1 + 0.5 * this.plF()) : 1; };   // 우리를 치는 공세의 빈도
  P.extSize = function () { var p = this.extP(); return p ? 1 + 0.22 * p * (0.5 + this.plF()) : 1; };        // 우리를 치는 군의 크기
  var _dm = P.deployMax;
  P.deployMax = function (side) { var v = _dm.apply(this, arguments), p = this.extP(); return p ? Math.round(v * (1 + 0.4 * p * this.plF()) / 500) * 500 : v; };   // 우리가 강할수록 한 번에 더 많이 보낸다
  var _ntg = P.natTarget;
  P.natTarget = function () { var v = _ntg.apply(this, arguments), p = this.extP(); return p ? clamp(v + Math.min(30, 14 * p * (0.5 + this.plF())), 10, 320) : v; };
  var _nt = P.natTurn;
  P.natTurn = function (side) {
    var p = this.extP(), A = SG.AIDEV, a0 = A && A.aps;
    if (p && A) A.aps = a0 + 1;                                  // 행동력 한 몫 더
    var r; try { r = _nt.apply(this, arguments); } finally { if (A) A.aps = a0; }
    if (p) {
      var n = this.nat(side), cap = this.milCap(side);
      n.gold = clamp(n.gold + 1.2 + 1.6 * p, 0, 200); n.food = clamp(n.food + 1.5 + 2.5 * p, -20, 300);
      n.mil = Math.round(Math.max(n.mil, Math.min(n.mil + cap * 0.015 * p * (0.6 + this.plF()), cap)) / 100) * 100;
    }
    return r;
  };
  var _wd = P.world;
  P.world = function () {
    var s = this.s, ext = !!s.extended, before = {};
    if (ext) ['silla', 'goguryeo', 'wa'].forEach(function (k) { if (s.world[k]) before[k] = s.world[k].p; });
    var r = _wd.apply(this, arguments);
    if (ext) {
      Object.keys(before).forEach(function (k) { var w = s.world[k]; if (w.p < before[k]) w.p = before[k] + 0.05; });   // 괜히 약해지지 않는다
      var tw = s.world.tang, fl = 30 + 25 * this.plF();
      if (tw && this.sides.tang !== this.side && tw.commit < fl) tw.commit = Math.min(fl, tw.commit + 6);              // 당은 계속 한반도를 노린다
    }
    return r;
  };

  var _atl = P.aiTurnAll;
  P.aiTurnAll = function () {
    var s = this.s; s.ext = s.ext || {}; s.ext.pl = s.extended ? calcPl(this) : 0; s.ext.y = s.year;
    var rows = []; try { rows = this.armsRace() || []; } catch (e) { console.warn('armsRace', e); }
    var r = _atl.apply(this, arguments);
    if (rows.length) this.pre = (this.pre || '') + armsBlock(this, rows);
    return r;
  };
})();
