/* 방어 병력: 침공을 받으면 '그 성의 수비대와 가까운 진영의 병력'만으로 막는다 (게임 추상화 모델 — 사료 수치가 아니다)
 *  - 병력은 수도·전선 진영(병력 배치)에 나뉘어 있다. 침공받은 곳과 가까운 진영의 병력은 달려오지만, 먼 곳의 병력은 제때 오지 못한다.
 *  - 진영의 몫 × 거리에 따른 합류율(가까울수록 높고 약 290km 밖은 0). 어느 진영에도 속하지 않은 후방·예비군은 일부만 합류한다.
 *  - 바다 건너 다른 땅덩이(왜·산둥·섬)에 나가 있는 병력은 본토 방어에 오지 못하고, 본토 병력도 수군이 약하면 건너가 돕지 못한다.
 *  - 먼 원정(away)과 주둔 압박(press)에 나간 병력은 이미 빠져 있다(realism.js·naval.js).
 *  - 사료 속 큰 싸움(시나리오 앵커)과 도성 방어는 왕이 본토의 군을 거의 다(95%) 불러 모은다. 연합군·대군의 침공(총동원)도 합류 범위가 넓고 75%는 모인다.
 *    일반 침공은 이런 하한이 없어서 그 성과 가까운 진영의 병력만 막는다 — 병력 배치(군사 명령)가 승패를 가른다.
 * 승산 예측(simFight)과 실제 전투(fight)가 같은 defUnits()를 쓴다. 문장은 함수 안에서 L3()로 지금 언어에 맞춰 고른다. */
(function () {
  var P = SG.Sandbox.prototype;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function L3(ko, en, ja) { var l = SG.i18n && SG.i18n.lang; return l === 'en' ? en : l === 'ja' ? ja : ko; }
  function com(n) { return Math.round(n).toLocaleString(); }
  function short(pl) { return pl.name.replace(/\(.*?\)/g, '').trim(); }
  var REC = { capital: 4000, city: 2000, fortress: 1200, port: 1000, pass: 500, island: 600 };   // 성 하나가 평소 두는 수비대(geo.js와 같다)
  var CFG = SG.DEFEND = {
    curve: [[0.35, 1], [1.0, 0.7], [1.6, 0.35], [2.4, 0]],   // [거리, 합류율]: 약 40km 안은 전부, 110km 70%, 180km 35%, 265km 밖은 0
    // sc: 합류 거리 배율 · rw: 후방·예비군 합류율 · send: 다른 진영이 보낼 수 있는 몫(자기 진영도 지켜야 한다) · floor: 본토에 있는 병력 가운데 적어도 이만큼은 모인다
    inv: { sc: 1, rw: 0.5, send: 0.85, floor: 0 },       // 일반 침공: 그 성과 가까운 진영의 병력만
    mus: { sc: 1.5, rw: 0.7, send: 0.9, floor: 0.75 },   // 총동원: 연합군·대군의 침공 — 왕이 먼 군까지 부른다
    big: { sc: 1.8, rw: 0.8, send: 0.95, floor: 0.95 },  // 사료 속 큰 싸움: 왕이 본토의 군을 거의 다 불러 모은다(바다 건너·원정에 나간 병력만 빠진다)
    cap: { sc: 2.0, rw: 1.0, send: 1.0, floor: 0.95 },   // 도성 방어: 도성이 무너지면 끝이다
    musFoe: 0.9,                                         // 적 병력이 아군 야전군의 이 비율을 넘으면 총동원
    minRatio: 0.04
  };

  function reach(d, sc) {
    var CURVE = CFG.curve; d = d / sc; if (d <= CURVE[0][0]) return 1;
    for (var i = 1; i < CURVE.length; i++) if (d <= CURVE[i][0]) { var a = CURVE[i - 1], b = CURVE[i]; return a[1] + (b[1] - a[1]) * (d - a[0]) / (b[0] - a[0]); }
    return 0;
  }
  // 바다 건너 거점에 나가 있는 병력(본토 방어에는 오지 못한다)
  function abroad(sb) {
    var home = sb.homeRegion(), seen = {}, t = 0, held = sb.s.held || {};
    sb.myPlaces().forEach(function (p) { var r = SG.regionOf(p); if (r === home || seen[r] || held[p.id] == null) return; seen[r] = 1; t += sb.baseTroops(p); });
    return t;
  }

  /* 침공받은 곳(bt.place 또는 앵커의 place)에서 막을 수 있는 병력을 셈한다 */
  P.defInfo = function (bt, anchor) {
    var s = this.s, cap = SG.placeById(this.cfg.capPlace), pid = (bt && bt.place) || (anchor && anchor.place), pl = (pid && SG.placeById(pid)) || cap;
    if (!pl) return null;
    var all = this.fieldUnits(1, true), tot = all.reduce(function (t, u) { return t + u.n; }, 0); if (tot <= 0) return null;
    var L = Math.max(1, this.landTotal()), home = this.homeRegion(), reg = SG.regionOf(pl), isCap = !!cap && pl.id === cap.id;
    var big = !!anchor || !!(bt && (bt.last || bt.loseEnd)), foe = bt && bt.enemy ? bt.enemy.total || 0 : 0;
    var mus = !big && !!(bt && (bt.coalition || bt.muster || foe >= tot * CFG.musFoe));   // 연합군·대군의 침공은 나라의 위기라 총동원한다
    var mode = isCap ? 'cap' : big ? 'big' : mus ? 'mus' : 'inv', m = CFG[mode];
    var i = { pl: pl, name: short(pl), tot: tot, mode: mode, big: mode !== 'inv', isCap: isCap, over: false, here: 0, near: 0, res: 0, ab: 0, ferry: 0, base: 0, local: 0, called: 0 };
    if (reg !== home) {   // 바다 건너 거점: 거점 병력 + 수군으로 건너오는 병력
      var fy = clamp((s.realm.navy - 30) / 140, 0, 0.5);
      i.over = true; i.base = this.baseTroops(pl); i.ferry = tot * fy; i.local = Math.min(tot, i.base + i.ferry);
    } else {
      var st = this.stations(), sumSh = 0; st.forEach(function (x) { sumSh += x.share; });
      var stN = sumSh / 100 * L, resN = Math.max(0, 100 - sumSh) / 100 * L, ab = Math.min(abroad(this), 0.4 * L);
      var fromRes = Math.min(resN, ab), fromSt = ab - fromRes, sc = stN > 0 ? clamp(1 - fromSt / stN, 0.3, 1) : 1, atN = 0, near = 0;   // 해외 거점에 나간 병력은 예비군부터 빠지고, 모자라면 진영들이 나누어 부담한다
      st.forEach(function (x) { var n = x.share / 100 * L * sc, d = dist(x.pl, pl); if (d <= 0.3) atN = Math.max(atN, n); else near += n * m.send * reach(d, m.sc); });
      var floor = (REC[pl.kind] || 800) * (0.8 + s.realm.defense / 200);   // 어느 진영에도 속하지 않은 성도 수비대는 있다
      i.ab = ab; i.here = Math.max(floor, atN); i.near = near; i.res = (resN - fromRes) * m.rw;
      i.local = Math.min(tot, i.here + i.near + i.res);
      var must = Math.max(0, tot - ab) * m.floor;   // 큰 싸움에서는 본토에 있는 병력의 일정 몫은 반드시 모인다
      if (i.local < must) { i.called = must - i.local; i.local = Math.min(tot, must); }
    }
    i.ratio = clamp(i.local / tot, CFG.minRatio, 1); i.local = Math.round(tot * i.ratio); i.far = Math.max(0, tot - i.local);
    return i;
  };
  // 방어전에 나서는 아군 병력: 전체 야전군(원정·압박에 나간 병력 제외) 가운데 그 방면에 닿는 몫만
  P.defUnits = function (bt, anchor, frac) {
    var all = this.fieldUnits(frac, true); this._defInfo = null;
    if (bt && bt.commit) return all;                 // 시나리오가 동원 비율을 못 박은 싸움은 그대로 둔다
    var i = this.defInfo(bt, anchor); if (!i) return all;
    this._defInfo = i;
    if (i.ratio >= 0.999) return all;
    return all.map(function (u) { return { id: u.id, n: Math.round(u.n * i.ratio) }; }).filter(function (u) { return u.n > 0; });
  };
  // 예전의 '배치 보정'(방면 주둔 비율로 전군을 늘이고 줄이던 방식)은 방어전에서는 쓰지 않는다
  var _df = P.deployFactor;
  P.deployFactor = function (bt) { if (bt && bt.defense && !bt.commit) return null; return _df.apply(this, arguments); };

  /* 화면 문장 */
  P.defLine = function (i) {
    if (!i) return '';
    var nm = '<b>' + i.name + '</b>', sum = i.here + i.near + i.res, cl = Math.round(i.called || 0), k = sum > 0 ? Math.max(0, i.local - cl) / sum : 1, out;
    if (i.over) {
      out = L3('🛡 <b>방어 병력</b> — ' + nm + '은(는) 바다 건너 거점입니다. 거점에 머무는 군 ' + com(i.base) + ' + 수군으로 건너온 병력 ' + com(i.ferry) + ' = <b>' + com(i.local) + '명</b> (야전군 전체 ' + com(i.tot) + '명 중). 수군이 약하면 본토 병력은 건너와 돕지 못합니다.',
        '🛡 <b>Defenders</b> — ' + nm + ' is an overseas holding. Troops stationed there ' + com(i.base) + ' + ferried over by the navy ' + com(i.ferry) + ' = <b>' + com(i.local) + '</b> (of ' + com(i.tot) + ' in the field army). With a weak navy, home troops cannot cross to help.',
        '🛡 <b>防衛兵力</b> — ' + nm + 'は海の向こうの拠点です。駐屯軍' + com(i.base) + ' + 水軍で渡った兵' + com(i.ferry) + ' = <b>' + com(i.local) + '名</b>(野戦軍全体' + com(i.tot) + '名中)。水軍が弱いと本土の兵は渡って助けられません。');
    } else {
      out = L3('🛡 <b>방어 병력</b> — ' + nm + ' 방면: 성 수비대·주둔군 ' + com(i.here * k) + ' + 인근 진영·예비군 ' + com((i.near + i.res) * k) + (cl > 0 ? ' + 급히 불러 모은 군 ' + com(cl) : '') + ' = <b>' + com(i.local) + '명</b> (야전군 전체 ' + com(i.tot) + '명 중). ' + (i.far > 0 ? '먼 곳의 병력 ' + com(i.far) + '명은 제때 오지 못합니다.' : '야전군 전체가 모였습니다.'),
        '🛡 <b>Defenders</b> — sector of ' + nm + ': garrison ' + com(i.here * k) + ' + nearby camps and reserves ' + com((i.near + i.res) * k) + (cl > 0 ? ' + hastily summoned troops ' + com(cl) : '') + ' = <b>' + com(i.local) + '</b> troops (of ' + com(i.tot) + ' in the field army). ' + (i.far > 0 ? 'The ' + com(i.far) + ' troops stationed far away cannot arrive in time.' : 'The whole field army has gathered.'),
        '🛡 <b>防衛兵力</b> — ' + nm + '方面: 城の守備隊・駐屯軍' + com(i.here * k) + ' + 近隣の陣営・予備軍' + com((i.near + i.res) * k) + (cl > 0 ? ' + 急ぎ呼び集めた軍' + com(cl) : '') + ' = <b>' + com(i.local) + '名</b>(野戦軍全体' + com(i.tot) + '名中)。' + (i.far > 0 ? '遠方の兵' + com(i.far) + '名は間に合いません。' : '野戦軍の全体が集まりました。'));
      if (i.ab > 0) out += L3(' 바다 건너 거점에 나가 있는 병력 약 ' + com(i.ab) + '명은 빠졌습니다.', ' About ' + com(i.ab) + ' troops posted at overseas holdings are not counted.', ' 海の向こうの拠点に出ている兵およそ' + com(i.ab) + '名は含みません。');
    }
    if (i.mode === 'cap') out += L3(' 도성을 지키는 싸움이라 왕이 인근 군을 널리 불러 모았습니다.', ' The king has called in the nearby armies to defend the capital.', ' 王が近隣の軍を広く集めて都を守ります。');
    else if (i.mode === 'big') out += L3(' 큰 싸움이라 왕이 인근 군을 널리 불러 모았습니다.', ' It is a major battle, so the king has called in the nearby armies.', ' 大きな戦いなので、王が近隣の軍を広く集めました。');
    else if (i.mode === 'mus') out += L3(' 나라의 위기를 부른 대군이라 왕이 먼 곳의 군까지 불러 모았습니다.', ' The enemy host threatens the realm, so the king has summoned even the distant armies.', ' 国の危機を招く大軍なので、王は遠方の軍まで呼び集めました。');
    else if (i.far > 0) out += ' <small>' + L3('병력 배치 조정(군사)으로 방면별 주둔 비율을 바꿀 수 있습니다.', 'Troop Deployment (Military) changes how many troops each sector holds.', '兵力配置調整(軍事)で方面ごとの駐屯割合を変えられます。') + '</small>';
    return out;
  };
  // 전투 화면에 붙는 짧은 안내(평문)
  P.defNote = function () {
    var i = this._defInfo; if (!i || i.ratio >= 0.999) return '';
    return L3('🛡 방어 병력 ' + com(i.local) + '명 (야전군 전체 ' + com(i.tot) + '명 중 이 방면에 닿는 병력). ', '🛡 Defenders: ' + com(i.local) + ' (of ' + com(i.tot) + ' in the field army, those who can reach this sector). ', '🛡 防衛兵力' + com(i.local) + '名(野戦軍全体' + com(i.tot) + '名のうちこの方面に届く兵)。');
  };

  // 침공 화면: 누가 막는지 알려 준다
  var _si = P.showInvasion;
  P.showInvasion = function (inv) {
    var r = _si.apply(this, arguments);
    try { var body = document.querySelector('#chron .body'); if (body && inv && inv.defense && !inv.commit) { var i = this.defInfo(inv, null); if (i) body.insertAdjacentHTML('beforeend', '<div class="note">' + this.defLine(i) + '</div>'); } } catch (e) { if (window.console) console.warn('defLine', e); }
    return r;
  };
})();
