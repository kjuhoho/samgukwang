/* 나라별 병력 풀: 쓰면 줄고, 천천히 찬다 (게임 추상화 모델 — 사료 수치가 아니다)
 *  ① 전투에서 잃은 병력만큼 그 나라의 총병력(forces.js 의 milOf)이 준다 — 우리와의 싸움, 나라끼리의 싸움, 연합군 모두.
 *  ② 총병력이 평시(상한의 72%)보다 줄면
 *     · 한 번에 내보내는 군의 크기가 줄고(poolSize)
 *     · 침공과 원정에 나설 가능성이 줄며(ready) — 바닥나면 한동안 큰 원정을 하지 못한다
 *     · 성을 지키는 수비대도 얇아진다(forces.js 의 dynTarget)
 *  ③ 해마다 천천히 찬다: 평시보다 모자란 만큼 조금 더 빨리 차지만, 바닥에서 평시까지는 십수 년이 걸린다.
 *  ④ 화면: 침공 화면·전투 결과·천하의 움직임·해마다의 소식에서 병력이 얼마나 줄었는지 알려 준다(첩보력만큼 보인다).
 * 문장은 함수 안에서 L3()로 지금 언어에 맞춰 고른다. */
(function () {
  var P = SG.Sandbox.prototype;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function L3(ko, en, ja) { var l = SG.i18n && SG.i18n.lang; return l === 'en' ? en : l === 'ja' ? ja : ko; }
  var CFG = SG.POOL = {
    loss: 1.0,                  // 전장에서 쓰러진 병력(전사·부상·패주)이 총병력에서 빠지는 몫
    march: 0.1,                 // 원정에 나서는 군은 행군·역병·탈영으로 규모의 10%를 싸우기도 전에 잃는다
    base: 0.72,                 // 평시 병력 = 상한의 72% (forces.js 와 같다)
    refill: 0.05,               // 평시에 모자란 만큼의 5%가 해마다 더 찬다
    readyLo: 0.2, readySpan: 0.52,   // 상한의 20% 아래면 출병 불가, 평시(72%) 이상이면 마음껏 — 그 사이는 비례
    sizeLo: 0.3, sizeHi: 1.15,  // 침공군 크기의 배율 범위: 평시 수준이면 1, 바닥나면 0.3까지
    anchorLo: 0.6,              // 사료 속 큰 싸움의 적군은 평시 수준이면 그대로, 병력이 크게 줄었으면 최대 40%까지 작게 온다
    low: 0.7, high: 0.9         // 소식을 알리는 기준: 평시 대비 70% 아래로 '바닥남', 90% 위로 '다시 찼다'
  };
  function hfOf(def) { var H = SG.HARD; return H ? (H.foe || 1) * (def ? (H.foeDef || 1) : 1) : 1; }   // 전투 모형 속 적 병력은 난이도 배수가 곱해져 있다
  function nm(sb, side) { var r = sb.roleOf(side); return r ? sb.names[r].replace('(멸망)', '') : ((SG.sideName && SG.sideName[side]) || side); }
  function kk(n) { n = Math.max(0, n); return (n >= 10000 ? Math.round(n / 1000) : Math.round(n / 100) / 10) + L3('천', 'k', '千'); }
  function com(n) { return Math.round(n).toLocaleString(); }

  /* ── 병력 풀의 상태 ── */
  P.poolRatio = function (side) { return this.milOf(side) / Math.max(1, this.milCap(side) * CFG.base); };      // 평시 대비(1 = 평시)
  P.poolFill = function (side) { return this.milOf(side) / Math.max(1, this.milCap(side)); };                  // 상한 대비(1 = 가득)
  P.ready = function (side) {                                                                                  // 원정에 나설 여력(0~1)
    if (!side || side === this.side) return 1;
    return clamp((this.poolFill(side) - CFG.readyLo) / CFG.readySpan, 0, 1);
  };
  P.readyAll = function (sides) {                                                                              // 연합처럼 여럿이 나설 때: 평균
    var self = this, n = 0, t = 0; (sides || []).forEach(function (sd) { if (sd) { n++; t += self.ready(sd); } });
    return n ? t / n : 1;
  };
  // 한 나라가 지금 내보낼 수 있는 군의 크기: 병력이 줄면 그만큼 작아지고, 바닥나면 0(= 나서지 못한다)
  P.poolSize = function (side, tot) {
    if (!side || side === this.side || !(tot > 0)) return tot;
    if (this.ready(side) <= 0.02) return 0;
    var f = clamp(Math.pow(this.poolFill(side) / CFG.base, 1.3), CFG.sizeLo, CFG.sizeHi), lim = this.deployMax ? Math.max(2000, this.deployMax(side) * 1.5) : tot;
    return Math.max(1000, Math.round(Math.min(tot * f, lim) / 100) * 100);
  };

  /* ── 손실 ── */
  P.poolLoss = function (side, n) {      // n: 총병력에서 빼야 할 인원(풀 단위)
    if (!side || side === this.side || !(n > 0)) return 0;
    var nn = this.nat(side), before = this.milOf(side); this.milHit(side, n);
    var d = before - this.milOf(side); nn.lost = (nn.lost || 0) + d; return d;
  };
  P.poolHit = function (side, simKill, def) {     // simKill: 전투 모형 속에서 쓰러진 적 병력
    if (!side || side === this.side) return null;
    var before = this.milOf(side); this.poolLoss(side, simKill / hfOf(def) * CFG.loss);
    return { side: side, before: before, after: this.milOf(side) };
  };
  P.poolKill = function (side, simKill, def) { return this.poolHit(side, simKill, def); };
  // 한 번의 싸움이 끝나면(engage 의 결과) 적의 피해를 그 나라의 총병력에서 던다. 연합군은 낸 병력만큼 나눠 진다.
  P.poolFight = function (en, ctx, r) {
    if (!r || r._pooled || !(r.bStart > 0)) return;
    r._pooled = true; if (ctx && ctx.bt) ctx.bt._pooled = true;
    var self = this, kill = Math.max(0, r.bStart - r.bEnd), def = !!(ctx && ctx.def), parts = ctx && ctx.bt && ctx.bt.parts, rows = [];
    if (parts && parts.length) {
      var sum = parts.reduce(function (t, p) { return t + p.n; }, 0) || 1;
      parts.forEach(function (p) { rows.push(self.poolHit(p.side, kill * p.n / sum, def)); });
    } else if (en && en.side) rows.push(self.poolHit(en.side, kill, def));
    rows = rows.filter(Boolean);
    if (rows.length && r.factors) { var t = this.poolNote(rows); if (t) r.factors.push(t); }
  };
  var _eng = P.engage;
  P.engage = function (ours, en, bo, ctx, cb) {
    var self = this;
    return _eng.call(this, ours, en, bo, ctx, function (r) {
      try { self.poolFight(en, ctx, r); } catch (e) { if (window.console) console.warn('poolFight', e); }
      cb(r);
    });
  };
  // 사료 속 큰 싸움(시나리오 앵커)의 적군도 그 나라의 병력 사정을 따른다: 앞선 전쟁으로 총병력이 평시보다 크게 줄었다면 그만큼 작게 온다(평시 수준이면 그대로)
  var _eo = P.enemyOf;
  P.enemyOf = function (bt) {
    var en = _eo.apply(this, arguments); this._poolF = 1;
    try {
      var tl = (this.cfg && this.cfg.timeline) || [];
      if (en && en.side && en.side !== this.side && en.units && tl.some(function (a) { return a.battle === bt; })) {
        var f = clamp(this.poolFill(en.side) / CFG.base, CFG.anchorLo, 1);
        if (f < 0.999) en.units.forEach(function (u) { u.n = Math.max(1, Math.round(u.n * f)); });
        this._poolF = f; en.poolF = f;
      }
    } catch (e) { if (window.console) console.warn('anchor pool', e); }
    return en;
  };
  var _sf = P.simFight;
  P.simFight = function () { var r = _sf.apply(this, arguments); if (r) r.poolF = this._poolF; return r; };
  var _fl = P.forceLine;
  P.forceLine = function (my, foe, fr) {
    var t = _fl.apply(this, arguments);
    if (fr && fr.poolF && fr.poolF < 0.97 && this.s.realm.intel >= 25) t += '<br>🪖 ' + L3('앞선 전쟁으로 적국의 병력이 줄어, 이번 적군은 평소보다 작은 규모로 옵니다(평소의 ' + Math.round(fr.poolF * 100) + '%).', 'The enemy realm has been bled by earlier wars, so its army comes smaller than usual (' + Math.round(fr.poolF * 100) + '% of normal).', '先の戦いで敵国の兵力が減っており、今回の敵軍は普段より小さな規模で来ます(普段の' + Math.round(fr.poolF * 100) + '%)。');
    return t;
  };
  // 원정에 나선 군은 싸우기도 전에 행군·역병·탈영으로 규모의 일부를 잃는다 — 나라 병력의 일부가 한 번 나가면 그만큼 비는 셈이다
  var _inv = P.invasion;
  P.invasion = function () {
    var inv = _inv.apply(this, arguments);
    try {
      if (inv && inv.enemy && !inv._marched) {
        inv._marched = true; var self = this, parts = inv.parts;
        if (parts && parts.length) parts.forEach(function (p) { self.poolLoss(p.side, p.n * CFG.march); });
        else if (inv.enemy.side) this.poolLoss(inv.enemy.side, (inv.enemy.total || 0) * CFG.march);
      }
    } catch (e) { if (window.console) console.warn('march', e); }
    return inv;
  };
  // 나라끼리의 전쟁: 양쪽이 실제로 잃은 병력만큼 줄어든다
  P.poolWar = function (a, o, bt) {
    if (!bt || bt.na == null) return false;
    var la = this.poolLoss(a, bt.na * (clamp(bt.lossA, 0, 1) + CFG.march) * CFG.loss), lo = this.poolLoss(o, bt.nd * clamp(bt.lossB, 0, 1) * CFG.loss);
    bt._pl = { a: a, o: o, la: la, lo: lo };
    return true;
  };
  var _an = P.aiNote;
  P.aiNote = function (bt) {
    var t = _an.apply(this, arguments);
    try {
      if (bt && bt._pl && this.s.realm.intel >= 50 && (bt._pl.la > 0 || bt._pl.lo > 0)) t += ' <small>🪖 ' + nm(this, bt._pl.a) + ' −' + kk(bt._pl.la) + ' · ' + nm(this, bt._pl.o) + ' −' + kk(bt._pl.lo) + '</small>';
    } catch (e) { }
    return t;
  };

  /* ── 해마다 천천히 찬다 ── */
  var _nt = P.natTurn;
  P.natTurn = function (side) {
    var r = _nt.apply(this, arguments), n = this.nat(side), base = this.milCap(side) * CFG.base, m = this.milOf(side);
    if (m < base) n.mil = Math.round((m + (base - m) * CFG.refill * clamp(n.people / 60, 0.4, 1.3)) / 100) * 100;
    return r;
  };

  /* ── 화면: 전투 결과 · 침공 화면 · 해마다의 소식 ── */
  P.poolNote = function (rows) {
    var self = this, i = this.s.realm.intel; if (i < 25) return '';
    var parts = rows.map(function (x) {
      var d = x.before - x.after, q = self.poolRatio(x.side), N = nm(self, x.side);
      if (i >= 50) return N + ' ' + L3('총병력 ', 'total troops ', '総兵力 ') + kk(x.before) + ' → <b>' + kk(x.after) + '</b>' + L3(' (평시의 ' + Math.round(q * 100) + '%)', ' (' + Math.round(q * 100) + '% of normal)', '(平時の' + Math.round(q * 100) + '%)');
      return N + L3(d >= 1500 ? ' 병력이 크게 줄었습니다' : d > 0 ? ' 병력이 줄었습니다' : ' 병력은 거의 그대로입니다', d >= 1500 ? ' lost many troops' : d > 0 ? ' lost some troops' : ' barely lost any troops', d >= 1500 ? ' 兵力が大きく減りました' : d > 0 ? ' 兵力が減りました' : ' 兵力はほぼ変わりません');
    });
    var worst = rows.reduce(function (m, x) { return Math.min(m, self.poolRatio(x.side)); }, 9);
    return '<b>🪖 ' + L3('적의 병력', 'Enemy strength', '敵の兵力') + '</b> ' + parts.join(' · ') + ' <small>' + (worst < CFG.low ? L3('— 병력이 바닥나 당분간 큰 원정에 나서기 어렵습니다.', '— drained of troops, it will struggle to mount big campaigns for a while.', '— 兵力が尽きて、しばらく大きな遠征は難しいでしょう。') : L3('— 잃은 병력은 몇 해에 걸쳐 천천히 찹니다.', '— lost troops are replaced only slowly, over years.', '— 失った兵は数年かけてゆっくり補われます。')) + '</small>';
  };
  // 침공 화면: 쳐들어온 나라의 병력 사정
  P.poolInvLine = function (inv) {
    var self = this, i = this.s.realm.intel; if (i < 25 || !inv || !inv.enemy) return '';
    var sides = inv.parts && inv.parts.length ? inv.parts.map(function (p) { return p.side; }) : [inv.enemy.side]; sides = sides.filter(function (sd, k) { return sd && sd !== self.side && sides.indexOf(sd) === k; });
    if (!sides.length) return '';
    var txt = sides.map(function (sd) {
      var q = self.poolRatio(sd), N = nm(self, sd);
      return i >= 50 ? N + L3(' 총병력 약 ' + kk(self.milOf(sd)) + '(평시의 ' + Math.round(q * 100) + '%)', ' total troops about ' + kk(self.milOf(sd)) + ' (' + Math.round(q * 100) + '% of normal)', ' 総兵力約' + kk(self.milOf(sd)) + '(平時の' + Math.round(q * 100) + '%)')
        : N + L3(q < 0.6 ? ' 병력이 적은 편' : q < 0.9 ? ' 병력은 보통' : ' 병력이 넉넉한 편', q < 0.6 ? ' is thin on troops' : q < 0.9 ? ' has average strength' : ' is well manned', q < 0.6 ? ' 兵力は少なめ' : q < 0.9 ? ' 兵力は普通' : ' 兵力は豊富');
    }).join(' · ');
    return '🪖 <b>' + L3('적의 병력', 'Enemy strength', '敵の兵力') + '</b> — ' + txt + '. ' + L3('이 침공은 나라가 한 번에 낼 수 있는 군의 규모를 넘지 못하며, 크게 잃으면 한동안 큰 원정에 나서기 어렵습니다.', 'The host cannot exceed what the realm can field at once; if it takes heavy losses, the realm will struggle to mount another big campaign for a while.', 'この侵攻軍は国が一度に出せる規模を超えず、大きく損なえばしばらく大きな遠征は難しくなります。');
  };
  var _si = P.showInvasion;
  P.showInvasion = function (inv) {
    var r = _si.apply(this, arguments);
    try { var t = this.poolInvLine(inv), body = t && document.querySelector('#chron .body'); if (body) body.insertAdjacentHTML('beforeend', '<div class="note">' + t + '</div>'); } catch (e) { if (window.console) console.warn('poolInvLine', e); }
    return r;
  };
  // 해마다: 병력이 바닥난 나라와 다시 찬 나라를 알린다(월드 시뮬레이션이 끝난 뒤)
  P.poolNotices = function () {
    var self = this, s = this.s, down = [], up = [];
    this.natSides().forEach(function (sd) {
      var n = self.nat(sd), q = self.poolRatio(sd);
      if (q < CFG.low && !n.dep) { n.dep = s.year; down.push(sd); }
      else if (q >= CFG.high && n.dep) { n.dep = 0; up.push(sd); }
    });
    if (s.realm.intel < 25 || !(down.length || up.length) || this.skipping) return;
    var html = down.map(function (sd) { return '<div><b>' + nm(self, sd) + ' — </b>' + L3('잇단 전쟁으로 병력이 바닥났습니다. 한동안 큰 원정에 나서기 어렵습니다.', 'Wars have drained its troops. It will struggle to mount big campaigns for a while.', '相次ぐ戦いで兵力が尽きました。しばらく大きな遠征は難しいでしょう。') + '</div>'; }).join('') +
      up.map(function (sd) { return '<div><b>' + nm(self, sd) + ' — </b>' + L3('병력이 다시 차올랐습니다.', 'Its troop strength has recovered.', '兵力が再び満ちました。') + '</div>'; }).join('');
    this.pre = (this.pre || '') + '<div class="freehd">🪖 <b>' + L3('이웃 나라의 병력', 'Neighbors’ troop strength', '隣国の兵力') + '</b>' + html + '</div>';
  };
  var _ws = P.worldSim;
  P.worldSim = function () {
    var r = _ws.apply(this, arguments);
    try { this.poolNotices(); } catch (e) { if (window.console) console.warn('poolNotices', e); }
    return r;
  };
})();
