/* 공성·수성 — 성벽, 자연 지형, 공성기
   성을 치는 쪽은 공성기로 성벽을 허물어야 하고, 성을 지키는 쪽은 성벽·자연 지형·수비 병종(수비대·궁노병)으로 유리하다.
   실제 계산은 tactics.js 의 SG.battle(성벽 체력 모델)이 하고, 여기서는 성벽 정보(walls)를 만들어 전투에 붙이며
   공성기 병종·제작 명령·적군의 공성기·안내 문구를 더한다. (게임 추상화 모델 — 사료 수치가 아니다.) */
(function () {
  var TR = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
  function T(k, e, j) { TR.en[k] = e; TR.ja[k] = j; var I = SG.i18n; if (I && I.dict && I.dict.en) { I.dict.en[k] = e; I.dict.ja[k] = j; } return k; }
  var L3 = SG.L3 || function (k, e, j) { var l = SG.i18n && SG.i18n.lang; return l === 'en' ? e : l === 'ja' ? j : k; };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function com(n) { return Math.round(n).toLocaleString(); }

  /* ① 공성기 병종 — 백제·신라·왜에는 공성 병종이 따로 없어 궁·노병이 대신했다. 공성기를 새로 붙인다. */
  var NM_U = T('공성기(충차·운제)', 'Siege engines (rams & ladders)', '攻城器(衝車・雲梯)');
  var DS_U = T('충차·운제·포차 같은 공성 장비와 그것을 다루는 장인·보조 인원. 성을 칠 때 성벽을 허문다. 들판에서는 힘을 쓰지 못한다.', 'Rams, ladders and catapults, with the craftsmen and crews who work them. They bring walls down when you storm a fortress, but are of little use in open fields.', '衝車・雲梯・投石機などの攻城装備と、それを扱う職人・補助要員。城を攻めるとき城壁を崩す。野戦ではほとんど役に立たない。');
  var R = SG.data.rosters;
  [['baekje', 'baekje_siege', 0], ['silla', 'silla_siege', 1], ['wa', 'wa_siege', 0]].forEach(function (x) {
    var r = R && R[x[0]]; if (!r || r.units.some(function (u) { return u.id === x[1]; })) return;
    r.units.push({ id: x[1], name: NM_U, hanja: '攻城器', base: 'siege', atk: x[2], def: -1, mov: -2, mor: 0, size: '소수', basis: 'abstract', src: '게임 추상화', desc: DS_U });
  });
  var SR = SG.sideRoles; if (SR) { if (SR.baekje) SR.baekje.siege = 'baekje_siege'; if (SR.silla) SR.silla.siege = 'silla_siege'; if (SR.wa) SR.wa.siege = 'wa_siege'; }

  /* ② 자연 지형과 성벽 */
  // nd 수비 이점(성 종류가 이미 가정한 지형 대비), eng 공성기 효율(산성엔 장비를 끌어올리기 어렵다), apr 1~2합 접근 불리
  var NAT = {
    plain: { nd: 1.0, eng: 1.0, apr: 1.0, nm: ['평지성', 'plain fortress', '平城'] },
    river: { nd: 1.07, eng: 0.92, apr: 0.93, nm: ['강변·해자', 'riverside & moat', '河畔・堀'] },
    coast: { nd: 1.04, eng: 0.92, apr: 0.95, nm: ['해안 요새', 'coastal fort', '海岸の要塞'] },
    mountain: { nd: 1.16, eng: 0.75, apr: 0.88, nm: ['산성', 'mountain fortress', '山城'] },
    pass: { nd: 1.1, eng: 0.8, apr: 0.9, nm: ['험한 길목', 'narrow pass', '険しい隘路'] }
  };
  var NATID = {
    garimseong: 'mountain', juryuseong: 'mountain', imjonseong: 'mountain', samnyeon: 'mountain', namcheonjeong: 'mountain', achasan: 'mountain', chiljungseong: 'mountain', bukhansan: 'mountain',
    myeonghwal: 'mountain', geoyeol: 'mountain', doksan: 'mountain', daesongsan: 'mountain', ansi: 'mountain', sinseong: 'mountain', ogolseong: 'mountain', baegamseong: 'mountain', geonanseong: 'mountain',
    hwandosan: 'mountain', bisaseong: 'mountain', ungjin: 'mountain', gwansanseong: 'mountain', daegaya: 'mountain',
    sabi: 'river', hanseong: 'river', pyeongyang: 'river', gungnae: 'river', horogoru: 'river', daeyaseong: 'river', chungju: 'river', sangju: 'river', udu: 'river', dazaifu: 'river',
    hasilla: 'coast', geumgwan: 'coast',
    seorabeol: 'plain', yodongseong: 'plain', buyeoseong: 'plain', daegu: 'plain', alla: 'plain', geummajeo: 'plain', seokseong: 'plain', yeongju: 'plain'
  };
  var BASE_NAT = { capital: 'plain', city: 'plain', fortress: 'mountain', port: 'coast', pass: 'pass' };   // 전투 지형 계수(deploy.js KB)가 이미 가정한 지형
  var WK = { capital: { w: 1.25, hp: 130000 }, city: { w: 1.0, hp: 70000 }, fortress: { w: 1.0, hp: 80000 }, pass: { w: 0.85, hp: 50000 }, port: { w: 0.75, hp: 55000 } };
  var CASTLE = { capital: 1, city: 1, fortress: 1 };
  function natOf(pl) {
    if (!pl) return 'plain'; if (NATID[pl.id]) return NATID[pl.id];
    if (pl.kind === 'pass') return 'pass'; if (pl.kind === 'port' || pl.kind === 'island') return 'coast';
    var s = (pl.name || '') + ' ' + (pl.hanja || '') + ' ' + (pl.modern || '') + ' ' + (pl.note || '');
    if (/산성|山城/.test(s)) return 'mountain'; if (/강변|북안|남안|하구|나루|해자|水城/.test(s)) return 'river';
    return 'plain';
  }
  // def: 수비측 방비(0~100) — 성벽을 얼마나 단단히 쌓았는가
  function wallsFor(pl, def) {
    var k = pl && WK[pl.kind]; if (!k) return null;
    var id = natOf(pl), N = NAT[id], B = NAT[BASE_NAT[pl.kind] || 'plain'], df = clamp(def == null ? 45 : def, 0, 100);
    return { w: k.w, hp0: Math.round(k.hp * (0.75 + df / 160)), nat: id, nd: Math.round(N.nd / B.nd * 1000) / 1000, eng: N.eng, apr: N.apr, nm: N.nm };
  }
  SG.siege = { NAT: NAT, WK: WK, natOf: natOf, wallsFor: wallsFor };

  /* ③ 제작 명령: 공성기를 만든다 */
  (function () {
    function amt(ctx, base) { var ec = (ctx.realm && ctx.realm.econ) || 50; return Math.round(base * (1 + Math.max(0, ec - 50) / 100) / 100) * 100; }
    SG.BUYS = SG.BUYS || {}; SG.BUYS.buy_siege = function (ctx) { return amt(ctx, 1500); };
    SG.data.commands = (SG.data.commands || []).concat([{
      id: 'buy_siege', cat: '군사', hist: '일반', get cost() { return { gold: 20, food: SG.dynFood ? SG.dynFood(30, 0.4) : 30 }; }, eff: {},
      name: T('충차·운제 제작', 'Build Rams & Ladders', '衝車・雲梯の製作'),
      desc: T('충차·운제·포차를 만들 장인과 일꾼을 모읍니다. (약 1.5천 · 산업이 높을수록 더 많이) 공성기가 많을수록 성벽이 빨리 무너져 성을 함락하기 쉬워지고 공성 숙련도 오릅니다.', 'Gather the craftsmen and laborers to build rams, ladders and catapults (about 1,500; more with higher industry). The more engines, the faster the walls fall and the easier a fortress is to take; siege mastery also rises.', '衝車・雲梯・投石機を作る職人と人夫を集めます。(約1.5千・産業が高いほど増える) 攻城器が多いほど城壁が早く崩れ、城を落としやすくなり、攻城の熟練も上がります。'),
      lines: [T('공방마다 충차와 운제가 쌓이고 장인들이 밤낮으로 망치를 두드렸습니다.', 'Rams and ladders piled up in every workshop as the craftsmen hammered day and night.', '工房ごとに衝車と雲梯が積み上がり、職人たちが昼夜を分かたず槌を振るいました。')],
      fn: function (g, ctx) { return { army: { baekje_siege: amt(ctx, 1500) }, realm: { b_siege: 3 } }; }
    }]);
  })();

  T('성을 에워싸 서서히 압박. 군량 5 추가 소모. 공성기가 없어도 성벽을 조금씩 허물고, 공성기가 있으면 훨씬 빠르다.', 'Encircle the fortress and squeeze it slowly. Costs 5 extra food. Even with no engines the walls wear down bit by bit; with engines it is much faster.', '城を包囲してじわじわ締め上げる。軍糧を5追加で消費。攻城器がなくても城壁を少しずつ崩せ、あればはるかに速い。');
  var P = SG.Sandbox && SG.Sandbox.prototype; if (!P) return;

  /* ④ 새 게임: 군에 공성기를 조금 둔다(필드 병력의 약 2%) */
  var _init = P.init;
  P.init = function () {
    var r = _init.apply(this, arguments);
    try { var A = this.g.state.army, id = this.units && this.units.siege; if (A && id && SG.unitById(id) && SG.unitById(id).base === 'siege' && !A[id]) { A[id] = Math.max(300, Math.round(this.fieldTotal() * 0.02 / 100) * 100); } } catch (e) { }
    return r;
  };

  /* ⑤ 전투에 성벽 붙이기 — 위력 계산(tune)과 실제 전투가 같은 규칙을 쓴다 */
  var _tk = P.tkOf;
  P.tkOf = function (ctx) {   // 침공 방어: 성에 의지하면 성곽 전투, 아니면 성 밖 야전
    var bt = ctx && ctx.bt, tac = ctx && ctx.tac;
    if (bt && bt.walls && ctx.def && tac && !tac.special && !bt.tk) { var pl = SG.placeById(bt.place); if (pl && CASTLE[pl.kind]) return tac.walls ? 'fort' : (tac.field || 'plain'); }
    return _tk.apply(this, arguments);
  };
  var _tune = P.tune;
  P.tune = function () {
    var r = _tune.apply(this, arguments);
    try { this.wallSet.apply(this, arguments); } catch (e) { if (window.console) console.warn('wallSet', e); }
    return r;
  };
  P.wallSet = function (ours, en, bo, ctx) {
    var bt = ctx.bt, T0 = ctx.T, tac = ctx.tac, pid, tgt, df;
    if (ctx.def) { if (!bt || !bt.walls || !bt.place || !tac || !tac.walls) return; pid = bt.place; tgt = ours; df = this.s.realm.defense; }
    else { if (!T0 || T0.skirm || T0.nowalls || !T0.place) return; pid = T0.place; tgt = en; var n = this.nat ? this.nat(T0.side || en.side) : null; df = n && n.defense != null ? n.defense : 45; }
    var pl = SG.placeById(pid), W = pl && wallsFor(pl, df); if (W) tgt.walls = W;
  };

  /* ⑥ 적군의 공성기 — 성을 치러 오는 군은 공성기를 끌고 온다(숙련·나라에 따라) */
  P.engineShare = function (side) {
    var n = this.nat ? this.nat(side) : null, bl = (n && n.bl) || {};
    return clamp(0.04 + 0.0008 * (bl.siege || 0) + (side === 'tang' ? 0.03 : side === 'goguryeo' ? 0.01 : 0), 0.03, 0.12);
  };
  P.addEngines = function (en, share) {
    var Rr = (SG.sideRoles || {})[en.side] || (SG.sideRoles || {}).silla || {}, id = Rr.siege, U = id && SG.unitById(id); if (!U || U.base !== 'siege') return en;
    var tot = en.units.reduce(function (t, u) { return t + u.n; }, 0), k = Math.round(tot * share / 100) * 100; if (k < 100) return en;
    var big = null; en.units.forEach(function (u) { var b = SG.unitById(u.id); if (b && b.base !== 'siege' && (!big || u.n > big.n)) big = u; });
    if (!big || big.n <= k) return en; big.n -= k;
    var ex = en.units.filter(function (u) { return u.id === id; })[0]; if (ex) ex.n += k; else en.units.push({ id: id, n: k });
    return en;
  };
  var _eo = P.enemyOf;
  P.enemyOf = function (bt) {
    var en = _eo.apply(this, arguments);
    try { if (bt && bt.walls && bt.defense && !bt.rebel && en && en.units) this.addEngines(en, this.engineShare(en.side)); } catch (e) { }
    return en;
  };

  /* ⑦ 성을 지키는 병력 — 도시·도성의 수비군은 수비대와 궁·노병이 늘고 기병이 준다 */
  var _dt = P.dynTarget;
  P.dynTarget = function (pl) {
    var t = _dt.apply(this, arguments);
    try { var m = t.mix; if (m && (pl.kind === 'city' || pl.kind === 'capital')) { m.archer = (m.archer || 0) + 0.03; m.garrison = (m.garrison || 0) + 0.03; m.horse = Math.max(0.02, (m.horse || 0) - 0.04); var s = 0, k; for (k in m) s += m[k]; for (k in m) m[k] = m[k] / s; } } catch (e) { }
    return t;
  };

  /* ⑧ 화면 안내 */
  function engines(units) { return (units || []).reduce(function (t, u) { var U = SG.unitById(u.id); return t + (U && U.base === 'siege' ? u.n : 0); }, 0); }
  function guide(W, nEng, extra) {
    var N = NAT[W.nat] || NAT.plain, nm = L3(N.nm[0], N.nm[1], N.nm[2]), strong = W.w >= 1.2 ? L3('매우 견고', 'very strong', '極めて堅固') : W.w >= 0.95 ? L3('견고', 'sturdy', '堅固') : L3('보통', 'ordinary', '並');
    return '🏯 <b>' + L3('성곽 정보', 'Fortress', '城の情報') + '</b> — ' + nm + (Math.abs(W.nd - 1) > 0.02 ? ' (' + L3('지형 이점', 'terrain edge', '地形の利') + ' ×' + W.nd.toFixed(2) + ')' : '') + ' · ' + L3('성벽', 'walls', '城壁') + ' <b>' + strong + '</b>. ' + extra;
  }
  var _wf = P.warFlow;
  P.warFlow = function (tid) {
    var r = _wf.apply(this, arguments);
    try { this.wallNote(tid); } catch (e) { if (window.console) console.warn('wallNote', e); }
    return r;
  };
  P.wallNote = function (tid) {
    var T0 = this.targetById(tid), pl = T0 && SG.placeById(T0.place); if (!T0 || !pl || !WK[pl.kind]) return;
    var side = T0.side || this.sides.silla, n = this.nat ? this.nat(side) : null, W = wallsFor(pl, n && n.defense), A = this.g.state.army, mine = 0, k, U;
    for (k in A) { U = SG.unitById(k); if (U && U.base === 'siege') mine += A[k]; }
    var r = null; try { r = this.simWar(T0, 0.7, { m: {} }).wall; } catch (e) { }
    var ex = L3('수비군은 성벽 위에서 싸워 유리합니다. 우리 공성기 <b>' + com(mine) + '</b>명', 'The defenders fight from the walls. Our siege engines: <b>' + com(mine) + '</b>', '守備軍は城壁の上で戦うため有利です。味方の攻城器 <b>' + com(mine) + '</b>名') + ' → ' +
      (!mine ? L3('공성기가 없으면 성벽이 거의 그대로 남아 큰 피해를 입습니다. <b>충차·운제 제작</b>으로 준비하거나 <b>장기 포위·공성</b>을 고르세요.', 'with no engines the walls stay almost intact and you will bleed. Build some with <b>Build Rams & Ladders</b>, or choose <b>Long Siege</b>.', '攻城器がなければ城壁はほぼ無傷で、大きな損害を受けます。<b>衝車・雲梯の製作</b>で備えるか<b>長期包囲・攻城</b>を選んでください。')
        : r && r.breach ? L3('정면 공격이면 제' + r.breach + '합쯤 성벽이 무너질 전망입니다.', 'in a frontal attack the walls should fall around round ' + r.breach + '.', '正面攻撃なら第' + r.breach + '合ごろに城壁が崩れる見込みです。')
        : L3('정면 공격으로는 성벽을 다 허물지 못할 전망입니다. 공성기를 더 만들면 성벽이 빨리 무너집니다.', 'a frontal attack will not bring the walls all the way down. More engines bring them down faster.', '正面攻撃では城壁を崩しきれない見込みです。攻城器を増やせば城壁が早く崩れます。'));
    var cards = this.g.root.querySelectorAll('.modal.dock .card'), card = cards[cards.length - 1], sub = card && card.querySelector('.sub'); if (!sub) return;
    var d = document.createElement('div'); d.className = 'note'; d.innerHTML = guide(W, mine, ex); sub.insertAdjacentElement('afterend', d);
  };
  var _si = P.showInvasion;
  P.showInvasion = function (inv) {
    var r = _si.apply(this, arguments);
    try { if (inv && inv.walls) this.invNote(inv); } catch (e) { if (window.console) console.warn('invNote', e); }
    return r;
  };
  P.invNote = function (inv) {
    var pl = SG.placeById(inv.place), W = pl && wallsFor(pl, this.s.realm.defense), body = document.querySelector('#chron .body'); if (!W || !body) return;
    var en = this.enemyOf(inv), n = engines(en.units), i = this.s.realm.intel;
    var ex = L3('적 공성기: ' + (i >= 25 ? '약 <b>' + com(Math.round(n / 100) * 100) + '</b>명' : '<b>알 수 없음</b>(첩보 부족)') + '. <b>성에 의지해 막으면</b> 성벽 위에서 싸워 유리하지만 적 공성기가 성벽을 허물수록 그 이점이 사라집니다. <b>야전</b>이나 <b>매복</b>은 성벽의 이점이 없지만, 적의 공성기도 들판에서는 힘을 쓰지 못합니다.',
      'Enemy siege engines: ' + (i >= 25 ? 'about <b>' + com(Math.round(n / 100) * 100) + '</b>' : '<b>unknown</b> (low intel)') + '. <b>Holding the walls</b> lets you fight from behind them, but that edge fades as enemy engines bring them down. <b>Field battle</b> or <b>ambush</b> gets no wall bonus, but enemy siege engines are of little use in the open.',
      '敵の攻城器: ' + (i >= 25 ? '約<b>' + com(Math.round(n / 100) * 100) + '</b>名' : '<b>不明</b>(諜報不足)') + '。<b>城に拠る</b>と城壁の上で戦えて有利ですが、敵の攻城器が城壁を崩すほどその利は薄れます。<b>野戦</b>や<b>伏兵</b>に城壁の利はありませんが、敵の攻城器も野では役に立ちません。');
    body.insertAdjacentHTML('beforeend', '<div class="note">' + guide(W, n, ex) + '</div>');
  };
})();
