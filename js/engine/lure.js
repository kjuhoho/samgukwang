/* 진을 치고 성 밖에서 싸우기 — 도발·출격·구원군
   성을 곧바로 들이치지 않고 성 밖 들판에 진을 치고 도발하면, 수비군이 (구원군과 함께) 성문을 열고 나와 성벽 없는 들판에서 싸우는 일이 있다.
   이기면 수비군이 크게 줄어 성을 치기 쉬워지고, 응하지 않으면 대치가 길어져 구원군이 성에 들어오고 양쪽 사기가 닳는다.
   '병력 주둔 압박'(press)으로 진을 치고 있는 동안에도 수비군이 가끔 나와 교전한다.
   수비군이 나올지는 양쪽 병력비·기질·성의 지형·구원군의 거리로 정해지고, 승산 예측과 실제 전투가 같은 규칙을 쓴다. (게임 추상화 모델 — 사료 수치가 아니다.) */
(function () {
  var TR = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
  function T(k, e, j) { TR.en[k] = e; TR.ja[k] = j; var I = SG.i18n; if (I && I.dict && I.dict.en) { I.dict.en[k] = e; I.dict.ja[k] = j; } return k; }
  var L3 = SG.L3 || function (k, e, j) { var l = SG.i18n && SG.i18n.lang; return l === 'en' ? e : l === 'ja' ? j : k; };
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function com(n) { return Math.round(n).toLocaleString(); }
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function tot(u) { return (u || []).reduce(function (t, x) { return t + x.n; }, 0); }
  function copyU(u) { return (u || []).map(function (x) { return { id: x.id, n: x.n }; }); }
  function merge(a, b) { var o = copyU(a); (b || []).forEach(function (x) { var e = o.filter(function (y) { return y.id === x.id; })[0]; if (e) e.n += x.n; else o.push({ id: x.id, n: x.n }); }); return o; }
  function scale(u, f) { return (u || []).map(function (x) { return { id: x.id, n: Math.round(x.n * f) }; }).filter(function (x) { return x.n > 0; }); }

  var CASTLE = { capital: 1, city: 1, fortress: 1, port: 1, pass: 1 };
  var LURE_OK = { capital: 1, city: 1, fortress: 1, port: 1 };   // 도발에 응해 나올 만한 성(좁은 길목은 제외)
  var NF = { garrison: 1, guard: 1, navy_war: 1, navy_transport: 1, scout: 1 };   // 들판 싸움에 내보내지 않는 병종
  // 병종별 출격 몫: 기동력이 있는 병종이 많이 나가고, 성을 지키는 수비대·공성기는 남는다
  var SORT = { inf_elite: .85, cav_heavy: .85, cav_light: .85, guard: .75, inf_line: .65, inf_levy: .5, archer: .5, crossbow: .5, garrison: .35, siege: 0, navy_war: 0, navy_transport: 0, scout: .5 };
  var TEMPER = { goguryeo: .1, tang: .07, wa: .05, baekje: .02, silla: -.04 };   // 수비군의 기질: 나가 싸우기를 좋아하는가

  var LB = {
    lure: T('진을 치고 도발·유인', 'Camp & Lure Out', '陣を張って挑発・誘引'),
    hint: T('성 밖 들판에 진을 치고 도발해 수비군을 끌어낸다. 나오면 성벽 없는 야전, 나오지 않으면 대치가 길어져 구원군이 성에 들어올 수 있다. 군량 4 추가 소모.', 'Camp on the open ground outside the castle and provoke the garrison out. If it sallies, you fight a field battle with no walls; if not, the standoff drags on and a relief army may slip into the castle. Costs 4 extra food.', '城外の野に陣を張って挑発し、守備軍を誘い出す。出てくれば城壁のない野戦、出てこなければ対峙が長引いて援軍が城に入ることがある。軍糧を4追加で消費。'),
    pressAdd: T('수비군이 성문을 열고 나와 진영을 칠 수도 있고, 그 싸움에서 지면 수비가 줄어듭니다.', 'The garrison may also open the gates and strike your camp; if it loses, the defence is thinned.', '守備軍が城門を開いて陣を攻めることもあり、その戦いに負ければ守りが薄くなります。')
  };
  function lvName(p) { return p >= 0.55 ? L3('높음', 'high', '高い') : p >= 0.3 ? L3('보통', 'moderate', '中程度') : L3('낮음', 'low', '低い'); }
  function LAB(n) { return n >= 3 ? L3('●●● 유리', '●●● Favorable', '●●● 有利') : n === 2 ? L3('●●○ 박빙(우세)', '●●○ Close (slight edge)', '●●○ 接戦(やや優勢)') : n === 1 ? L3('●○○ 불리', '●○○ Unfavorable', '●○○ 不利') : L3('○○○ 매우 불리', '○○○ Very unfavorable', '○○○ 非常に不利'); }
  function rank(r) { var ratio = r.aEnd / (r.aStart || 1), win = r.winner === 'a' && ratio >= 0.3; return win ? (ratio >= 0.6 ? 3 : 2) : (r.aEnd / (r.bEnd + 1) > 0.5 ? 1 : 0); }
  var SCORE = [0, 0.3, 0.7, 1];

  var P = SG.Sandbox && SG.Sandbox.prototype; if (!P) return;

  /* ① 수비군의 출격 편성·구원군 */
  P.sortieSplit = function (units) {
    var out = [], keep = [];
    (units || []).forEach(function (u) {
      var U = SG.unitById(u.id), sh = U ? (SORT[U.base] == null ? 0.3 : SORT[U.base]) : 0, a = Math.round(u.n * sh);
      if (a > 0) out.push({ id: u.id, n: a }); if (u.n - a > 0) keep.push({ id: u.id, n: u.n - a });
    });
    return { out: out, keep: keep };
  };
  P.fieldMix = function (side) {   // 들판에서 싸우는 야전군의 편성(수비대·공성기는 뺀다)
    var m = SG.mixFor ? SG.mixFor(this, side, 'army') : null, k, s = 0;
    if (!m) m = { line: .45, horse: .2, archer: .15, elite: .1, levy: .1 };
    m.garrison = 0; m.siege = 0; for (k in m) s += m[k]; for (k in m) m[k] = m[k] / (s || 1);
    return m;
  };
  // 구원군: 그 나라가 한 번에 내보낼 수 있는 병력(deployMax)의 일부 × 가까운 아군 성이 있을수록 빨리 온다
  P.reliefInfo = function (T0, side) {
    var self = this, pl = SG.placeById(T0.place), dmin = 9;
    if (pl) this.places().forEach(function (p) { if (p.id !== pl.id && CASTLE[p.kind] && self.ownerOf(p) === side) dmin = Math.min(dmin, dist(p, pl)); });
    var reach = clamp(1.3 - dmin / 1.6, 0.15, 1), dm = this.deployMax ? this.deployMax(side) : 4000;
    return { n: Math.max(0, Math.round(Math.min(dm * 0.5 * reach, (T0.garrison || 3000) * 0.9) / 100) * 100), reach: reach };
  };
  // 수비군이 나올 확률 (승산 예측과 실제가 같은 값을 쓴다)
  P.sortieOdds = function (T0, ours, en) {
    var sp = this.sortieSplit(en.units), rl = this.reliefInfo(T0, en.side), outN = tot(sp.out) + rl.n, myN = tot(ours.units), q = myN / Math.max(500, outN);
    var pl = SG.placeById(T0.place), nat = pl && SG.siege ? SG.siege.natOf(pl) : 'plain', pr = this.s.press, mor = ours.morale == null ? 80 : ours.morale;
    var p = 0.85 - 0.5 * (q - 0.7) + (TEMPER[en.side] || 0) + (nat === 'mountain' ? -0.12 : nat === 'plain' ? 0.04 : 0) + (pl && pl.kind === 'capital' ? -0.05 : 0) + (mor < 70 ? 0.08 : mor > 110 ? -0.06 : 0) + (pr && pr.place === T0.place ? 0.08 : 0);
    return { p: clamp(p, 0.03, 0.88), q: q, out: tot(sp.out), relief: rl.n, reach: rl.reach };
  };

  /* ② 싸움의 세 갈래: 들판(출격) · 대치(응하지 않음) · 그 뒤의 성 공략 */
  P.lureField = function (ours, en, T0) {
    var sp = this.sortieSplit(en.units), rl = this.reliefInfo(T0, en.side), ru = rl.n >= 300 ? this.enemyUnits(en.side, rl.n, this.fieldMix(en.side)) : [];
    var enF = Object.assign({}, en, { name: en.name + L3(' 출격', ' sortie', ' 出撃'), units: merge(sp.out, ru), terrain: 1 + ((en.terrain || 1) - 1) * 0.25, fort: false, ambush: false });
    var oF = Object.assign({}, ours, { units: copyU(ours.units), terrain: (ours.terrain || 1) * 1.05 });   // 미리 쌓아 둔 진영
    return { ours: oF, en: enF, sp: sp, relief: tot(ru) };
  };
  P.lureStand = function (ours, en, T0) {
    var rl = this.reliefInfo(T0, en.side), add = Math.round(rl.n * 0.2 / 100) * 100, au = add >= 200 ? this.enemyUnits(en.side, add, this.fieldMix(en.side)) : [];
    var enS = Object.assign({}, en, { units: merge(en.units, au), morale: Math.max(35, (en.morale == null ? 68 : en.morale) - 3) });
    var oS = Object.assign({}, ours, { units: copyU(ours.units), morale: (ours.morale == null ? 70 : ours.morale) - 4 });
    return { ours: oS, en: enS, add: tot(au) };
  };
  P.lureAfter = function (f, ours, en, r1) {   // 야전에서 이긴 뒤: 성에 남은 수비군을 친다
    var f1 = r1.bStart ? r1.bEnd / r1.bStart : 0, g0 = tot(en.units), gu = merge(f.sp.keep, scale(f.sp.out, f1)), g1 = tot(gu), mine = tot(r1.aLeft), frac = g0 ? g1 / g0 : 0;
    var ours2 = Object.assign({}, ours, { units: copyU(r1.aLeft), morale: (ours.morale == null ? 70 : ours.morale) + 1 });
    var en2 = Object.assign({}, en, { units: gu, morale: Math.max(30, (en.morale == null ? 68 : en.morale) - 8) });
    return { ours: ours2, en: en2, sur: frac < 0.6 && mine > 2 * g1, left: g1, pct: Math.round(frac * 100) };
  };

  /* ③ 승산 예측: 나올 확률과 두 갈래의 승산을 보여 준다 */
  P.lureBuild = function (T0, frac) {
    var ex = this.expedition(T0), side = T0.side || this.sides.silla, ours, en;
    this._march = { mor: ex.mor, simLoss: ex.loss };
    try {
      ours = { name: 'a', side: this.side, units: this.fieldUnits(frac), gen: this.cfg.gen, morale: this.myMorale(), terrain: 1 };
      en = { name: 'b', side: side, units: this.enemyUnits(side, T0.garrison, T0.mix), terrain: T0.terrain || 1, morale: 68, fort: !!(T0.terrain >= 1.45) };
    } finally { this._march = null; }
    return { ours: ours, en: en };
  };
  P.lureSim = function (T0, frac, tac) {
    var self = this, b = this.lureBuild(T0, frac), od = this.sortieOdds(T0, b.ours, b.en);
    function fight(o, e, ctx) { var bo = { rounds: 6 }; self.tune(o, e, bo, ctx); return SG.battle(o, e, bo); }
    function ph(x) { return Object.assign({}, tac, { phase: x }); }
    var f = this.lureField(b.ours, b.en, T0), r1 = fight(f.ours, f.en, { T: T0, tac: ph('field'), def: false, venue: 'field' }), rF = r1;
    if (r1.winner === 'a') { var af = this.lureAfter(f, b.ours, b.en, r1); if (!af.sur) { rF = fight(af.ours, af.en, { T: T0, tac: ph('after'), def: false }); rF.aStart = r1.aStart; } }
    var s = this.lureStand(b.ours, b.en, T0), rS = fight(s.ours, s.en, { T: T0, tac: ph('stand'), def: false });
    var lf = rank(rF), ls = rank(rS), E = od.p * SCORE[lf] + (1 - od.p) * SCORE[ls];
    var html = '<br>🚩 ' + L3('수비군이 성 밖으로 나올 가능성 ', 'Chance the garrison sallies out: ', '守備軍が城外へ出てくる可能性 ') + '<b>' + lvName(od.p) + '</b> (' + Math.round(od.p * 100) + '%) — ' +
      L3('나오면 야전 ', 'if it does, field battle ', '出てくれば野戦 ') + '<b>' + LAB(lf) + '</b> · ' + L3('버티면 성 공략 ', 'if it holds, assault ', '出なければ城攻め ') + '<b>' + LAB(ls) + '</b>';
    var win = E >= 0.45;
    return { win: win, aStart: 100, aEnd: E >= 0.7 ? 80 : 50, bStart: 100, bEnd: win ? 10 : 60, winner: win ? 'a' : 'b', oddsHtml: html, p: od.p, E: E, lf: lf, ls: ls, q: od.q, out: od.out, relief: od.relief };
  };
  var _sw = P.simWar;
  P.simWar = function (Tg, frac, tac) {
    if (tac && tac.id === 'lure') return this.lureSim(Tg, frac, tac);
    return _sw.apply(this, arguments);
  };

  /* ④ 실제 전투: 나올지를 정하고, 나오면 들판 전투 → (이기면) 줄어든 수비군을 친다 */
  function fz(sb, n) { var i = sb.s.realm.intel; if (i < 10) return '?'; var u = i >= 50 ? 100 : 500; return (i >= 50 ? '' : L3('약 ', 'about ', '約')) + com(Math.round(n / u) * u); }
  P.lureBanner = function (html) {
    try { var cs = this.g.root.querySelectorAll('.modal.council .card'), c = cs[cs.length - 1], sub = c && c.querySelector('.sub'); if (sub) sub.insertAdjacentHTML('afterend', '<div class="note">' + html + '</div>'); } catch (e) { }
  };
  P.lureEngage = function (ours, en, bo, ctx, cb) {
    var self = this, g = this.g, T0 = ctx.T, od = this.sortieOdds(T0, ours, en), go = Math.random() < od.p, nm = this.L(T0.short || T0.name);
    function ph(x) { return Object.assign({}, ctx.tac, { phase: x }); }
    if (!go) {
      var st = this.lureStand(ours, en, T0), c2 = Object.assign({}, ctx, { tac: ph('stand'), title: nm + L3(' 대치 후 공략', ' — assault after the standoff', ' 対峙後の攻略') });
      _eng.call(this, st.ours, st.en, bo, c2, function (r) {
        r.factors.unshift('<b>' + L3('도발·대치', 'Provocation & standoff', '挑発・対峙') + '</b> ' + L3('수비군은 끝내 성문을 열지 않았습니다. 대치가 길어지는 동안 적 사기 −3 · 아군 사기 −4' + (st.add ? ' · 구원군 약 ' + com(st.add) + '명이 성에 들어왔습니다.' : '.'), 'The garrison never opened its gates. During the standoff enemy morale −3, ours −4' + (st.add ? ' · a relief force of about ' + com(st.add) + ' slipped into the castle.' : '.'), '守備軍は最後まで城門を開きませんでした。対峙の間、敵の士気−3・味方の士気−4' + (st.add ? '・援軍約' + com(st.add) + '名が城に入りました。' : '。')));
        cb(r);
      });
      this.lureBanner('🚩 <b>' + L3('진을 치고 도발했지만 수비군은 성문을 닫고 나오지 않았습니다.', 'You camped and provoked, but the garrison kept its gates shut.', '陣を張って挑発しましたが、守備軍は城門を閉ざして出てきませんでした。') + '</b> ' +
        L3('대치가 길어져 적 사기 −3 · 아군 사기 −4' + (st.add ? ', 구원군이 성에 들어와 수비가 늘었습니다.' : '.') + ' 이제 성벽을 직접 공략합니다.', 'The standoff costs enemy morale −3 and ours −4' + (st.add ? ', and a relief force has reinforced the castle.' : '.') + ' Now you must assault the walls.', '対峙が長引き、敵の士気−3・味方の士気−4' + (st.add ? '、援軍が城に入って守りが増えました。' : '。') + 'ここからは城壁を直接攻めます。'));
      return;
    }
    var f = this.lureField(ours, en, T0), boF = Object.assign({}, bo, { rounds: 6 }), cF = Object.assign({}, ctx, { venue: 'field', tac: ph('field'), title: nm + L3(' 성 밖 야전', ' — Battle Outside the Walls', ' 城外の野戦') });
    _eng.call(this, f.ours, f.en, boF, cF, function (r1) {
      try { if (self.milHit) self.milHit(en.side, r1.bStart - r1.bEnd); } catch (e) { }   // 야전에서 잃은 병력은 그 나라의 군사력에서 빠진다
      if (r1.winner !== 'a') {
        r1.factors.unshift('<b>' + L3('성 밖 야전', 'Battle outside the walls', '城外の野戦') + '</b> ' + L3('진을 치고 도발하자 수비군이 구원군과 함께 성문을 열고 나왔고, 들판에서 패해 진영이 무너졌습니다.', 'Provoked, the garrison marched out with its relief army and beat you on open ground; your camp collapsed.', '挑発に乗った守備軍が援軍とともに城門を開いて出撃し、野戦で敗れて陣が崩れました。'));
        return cb(r1);
      }
      var af = self.lureAfter(f, ours, en, r1);
      if (af.sur) {
        r1.factors.unshift('<b>' + L3('성 밖 야전 대승', 'Decisive field victory', '城外の野戦で大勝') + '</b> ' + L3('출격군이 무너지자 성 안의 수비군은 싸울 의지를 잃고 문을 열었습니다.', 'With the sortie force broken, the remaining garrison lost the will to fight and opened the gates.', '出撃軍が崩れると、城内の守備軍は戦う意志を失って城門を開きました。'));
        return cb(r1);
      }
      var outro = L3('성에 남은 수비군은 약 ' + com(af.left) + '명(원래의 ' + af.pct + '%)으로 줄었고 사기가 꺾였습니다. 이어서 곧바로 성벽을 칠지, 진영을 지키며 압박할지 정합니다.', 'The garrison left in the castle is down to about ' + com(af.left) + ' (' + af.pct + '% of the original) and shaken. Next you choose: storm the walls now, or hold the camp and keep pressing.', '城に残る守備軍は約' + com(af.left) + '名(元の' + af.pct + '%)に減り、士気も挫けました。続いて、すぐ城壁を攻めるか、陣を守って圧迫を続けるか決めます。');
      g.battleUI(r1, nm + L3(' 성 밖 야전', ' — Battle Outside the Walls', ' 城外の野戦'), outro, function () { self.lureChoice(nm, af, assault, camp); });
      function camp() {   // 진영을 유지하고 압박으로 전환: 야전에서 줄인 수비는 그대로 두고 다음 기회를 노린다
        var A = g.state.army, all = 0, k, U; self.casual(ours.units, r1.aLeft);
        for (k in A) { U = SG.unitById(k); if (U && A[k] && !NF[U.base]) all += A[k]; }
        var n = tot(r1.aLeft); self.s.press = { place: T0.place, frac: clamp(n / Math.max(1, all), 0.1, 0.6), n: n, since: self.s.year, gdmg: clamp(1 - af.pct / 100, 0, 0.55) };
        self.log(nm + ' — ' + L3('야전 승리 뒤 진영 유지', 'Field victory, camp kept', '野戦勝利後に陣を維持')); self.drawDeploy();
        self.s.last = '🚩 <b>' + nm + '</b> — ' + L3('야전에서 이긴 뒤 성을 치지 않고 진영을 유지합니다. 수비군은 약 ' + af.pct + '%로 줄었고, 해마다 조금씩 채워집니다. 조공을 받거나 틈을 보아 성을 칠 수 있습니다.', 'After the field victory you hold the camp instead of storming the castle. The garrison is down to about ' + af.pct + '% and refills a little each year. It may offer tribute, or you can strike when the chance comes.', '野戦に勝った後、城を攻めずに陣を維持します。守備軍は約' + af.pct + '%に減り、毎年少しずつ補充されます。貢ぎ物を得ることも、機を見て城を攻めることもできます。');
        self.after();
      }
      function assault() {
        var T2 = Object.assign({}, T0, { _march: null, _amb: false }), c2 = Object.assign({}, ctx, { T: T2, tac: ph('after'), title: nm + L3(' 성벽 공략', ' — Assault on the Walls', ' 城壁の攻略') });
        _eng.call(self, af.ours, af.en, bo, c2, function (r2) {
          r2.aStart = r1.aStart;   // 야전에서 입은 피해까지 합쳐 성패를 가른다
          r2.factors.unshift('<b>' + L3('야전의 여파', 'After the field battle', '野戦の余波') + '</b> ' + L3('앞선 야전에서 수비군이 줄고 사기가 꺾였습니다.', 'The garrison was thinned and shaken in the preceding field battle.', '先の野戦で守備軍は減り、士気も挫けました。'));
          cb(r2);
        });
        self.lureBanner('🏇 <b>' + L3('야전에서 이겼습니다.', 'You won the field battle.', '野戦に勝ちました。') + '</b> ' + L3('성에 남은 수비군 약 ' + com(af.left) + '명(' + af.pct + '%), 사기가 꺾였습니다. 줄어든 수비군이 지키는 성벽을 공략합니다.', 'About ' + com(af.left) + ' defenders (' + af.pct + '%) remain in the castle, shaken. You now assault the walls they hold.', '城に残る守備軍は約' + com(af.left) + '名(' + af.pct + '%)で士気も挫けています。減った守備軍が守る城壁を攻めます。'));
      }
    });
    this.lureBanner('🚩 <b>' + L3('진을 치고 도발하자 수비군이 성문을 열고 나왔습니다.', 'You camped and provoked — and the garrison threw open its gates.', '陣を張って挑発すると、守備軍が城門を開いて出てきました。') + '</b> ' +
      L3('출격군 ' + fz(this, tot(f.sp.out)) + '명' + (f.relief ? ' + 구원군 ' + fz(this, f.relief) + '명' : '') + '. 성벽이 없는 들판 싸움이라 수비군은 성벽의 이점을 잃습니다. 이기면 수비군이 크게 줄어 성을 치기 쉬워집니다.', 'Sortie force ' + fz(this, tot(f.sp.out)) + (f.relief ? ' + relief army ' + fz(this, f.relief) : '') + '. On open ground with no walls, the defenders lose their wall advantage; winning here thins the garrison and makes the castle far easier to take.', '出撃軍' + fz(this, tot(f.sp.out)) + '名' + (f.relief ? '+援軍' + fz(this, f.relief) + '名' : '') + '。城壁のない野戦なので守備軍は城壁の利を失います。ここで勝てば守備軍が大きく減り、城を攻めやすくなります。'));
  };
  P.lureChoice = function (nm, af, onAssault, onCamp) {
    var wrap = h('div', 'modal dock'), card = h('div', 'card');
    card.innerHTML = '<h2>' + nm + L3(' — 야전 승리 뒤', ' — After the Field Victory', ' — 野戦勝利の後') + '</h2><div class="sub">' + L3('성에 남은 수비군은 약 ' + com(af.left) + '명(' + af.pct + '%)이고 사기가 꺾였습니다. 곧바로 성벽을 칠지, 진영을 지키며 압박을 이어 갈지 정하세요.', 'About ' + com(af.left) + ' defenders (' + af.pct + '%) remain in the castle, shaken. Storm the walls now, or hold the camp and keep the pressure on?', '城に残る守備軍は約' + com(af.left) + '名(' + af.pct + '%)で士気も挫けています。すぐ城壁を攻めるか、陣を守って圧迫を続けるか決めてください。') + '</div><div class="laws" id="lc-l"></div>';
    [[L3('곧바로 성벽을 공략한다', 'Storm the walls now', 'すぐ城壁を攻める'), L3('줄어든 수비군이 성벽 위에서 버팁니다. 사기가 꺾인 지금이 기회이지만 성벽은 여전히 온전합니다.', 'The thinned garrison still holds the walls. Their morale is broken, but the walls stand intact.', '減った守備軍が城壁の上で守ります。士気が挫けた今が好機ですが、城壁は無傷のままです。'), onAssault],
      [L3('진영을 지키며 압박을 이어 간다', 'Hold the camp and keep pressing', '陣を守って圧迫を続ける'), L3('주둔 압박으로 바꿉니다. 줄어든 수비는 해마다 조금씩 채워지고, 군량이 들지만 조공이나 더 큰 기회를 얻을 수 있습니다.', 'Turns into a garrison pressure. The garrison refills a little each year and food is spent, but tribute or a better chance may follow.', '駐屯圧迫に切り替えます。守備は毎年少しずつ補充され軍糧もかかりますが、貢ぎ物やより大きな好機が得られるかもしれません。'), onCamp]].forEach(function (x) {
      var b = h('button', 'ch', x[0] + '<small>' + x[1] + '</small>'); b.onclick = function () { wrap.remove(); x[2](); }; card.querySelector('#lc-l').appendChild(b);
    });
    wrap.appendChild(card); this.g.root.appendChild(wrap);
  };
  var _eng = P.engage;
  P.engage = function (ours, en, bo, ctx, cb) {
    var tac = ctx && ctx.tac;
    if (!(ctx && ctx.T && !ctx.def && tac && tac.id === 'lure' && !tac.phase)) return _eng.apply(this, arguments);
    return this.lureEngage(ours, en, bo, ctx, cb);
  };

  /* ⑤ 들판 전투는 성벽 없이, 평지(산성 앞이면 구릉)에서 */
  var _tk = P.tkOf;
  P.tkOf = function (ctx) {
    if (ctx && ctx.venue === 'field') { var pl = SG.placeById((ctx.T && ctx.T.place) || (ctx.bt && ctx.bt.place)); return pl && SG.siege && SG.siege.natOf(pl) === 'mountain' ? 'hill' : 'plain'; }
    return _tk.apply(this, arguments);
  };
  var _ws = P.wallSet;
  P.wallSet = function (ours, en, bo, ctx) { if (ctx && ctx.venue === 'field') return; return _ws.apply(this, arguments); };
  var _so = P.stanceOf;
  P.stanceOf = function (tac) { if (tac && tac.id === 'lure') return 'balanced'; return _so.apply(this, arguments); };

  /* ⑥ 출병 화면에 '진을 치고 도발·유인' 추가 */
  P.moreTacs = function (T0) {
    var pl = T0 && SG.placeById(T0.place); if (!pl || !LURE_OK[pl.kind] || T0.skirm || T0.nowalls || T0.oversea) return [];
    return [{ id: 'lure', label: LB.lure, hint: LB.hint, m: {}, food: 4 }];
  };

  /* ⑦ 주둔 압박(진영) 중의 교전: 수비군이 진영을 치러 나온다 */
  P.campOdds = function (p, Tg, role) {
    var A = this.g.state.army, n = 0, k, U, w = this.s.world[role], hs = w ? (role === 'tang' ? w.commit : w.hostility) : 0;
    for (k in A) { U = SG.unitById(k); if (U && A[k] && !NF[U.base]) n += A[k] * p.frac; }
    var so = tot(this.sortieSplit(this.enemyUnits(Tg.side, Tg.garrison, Tg.mix)).out), q = n / Math.max(500, so);
    return clamp(0.42 - 0.16 * (q - 1) + (TEMPER[Tg.side] || 0), 0.04, 0.6) * clamp((hs - 35) / 55, 0.2, 1);
  };
  P.campClash = function (p, pl, Tg, role) {
    var s = this.s, A = this.g.state.army, before = [], k, U, n;
    for (k in A) { U = SG.unitById(k); if (!U || !A[k] || NF[U.base]) continue; n = Math.round(A[k] * p.frac); if (n > 0) before.push({ id: k, n: n }); }
    var ours = { name: 'a', side: this.side, units: copyU(before), gen: this.cfg.gen, morale: this.myMorale(), terrain: 1.1 };
    var eu = this.enemyUnits(Tg.side, Tg.garrison, Tg.mix), sp = this.sortieSplit(eu), g0 = tot(eu);
    var en = { name: 'b', side: Tg.side, units: sp.out, terrain: 1, morale: 66, fort: false }, bo = { rounds: 5 };
    this.tune(ours, en, bo, { T: Tg, tac: { id: 'camp', m: {} }, def: true, venue: 'field' }, { stance: 'hold', reserve: 0 });
    var r = SG.battle(ours, en, bo), won = r.winner === 'a', killed = r.bStart - r.bEnd, lost = tot(before) - tot(r.aLeft);
    p.gdmg = clamp((p.gdmg || 0) + clamp(killed / Math.max(1, g0) * 0.6, 0, 0.3) * (won ? 1 : 0.4), 0, 0.55);
    var broke = !won && r.aEnd / (r.aStart || 1) < 0.5, txt;
    this.casual(before, r.aLeft);
    try { if (this.milHit) this.milHit(Tg.side, killed); } catch (e) { }
    if (broke) { s.press = null; if (this.g.map) this.g.map.removeToken('own_press'); txt = L3('수비군이 성문을 열고 쏟아져 나와 진영을 덮쳤고, 진영이 무너져 주둔을 거두었습니다 (우리 피해 약 ' + com(lost) + '명).', 'The garrison poured out of the gates and overran the camp; the camp collapsed and the force withdrew (about ' + com(lost) + ' of ours lost).', '守備軍が城門から溢れ出て陣を襲い、陣が崩れて駐屯を引き上げました(味方の損害約' + com(lost) + '名)。'); }
    else if (won) txt = L3('수비군이 성문을 열고 진영을 덮쳤으나 격퇴했습니다. 적 약 ' + com(killed) + '명이 쓰러져 성의 수비가 줄었습니다 (우리 피해 약 ' + com(lost) + '명).', 'The garrison burst out and struck the camp but was driven off. About ' + com(killed) + ' of them fell and the castle is thinner for it (about ' + com(lost) + ' of ours lost).', '守備軍が城門を開いて陣を襲いましたが、撃退しました。敵約' + com(killed) + '名が倒れて城の守りが薄くなりました(味方の損害約' + com(lost) + '名)。');
    else txt = L3('수비군의 급습에 진영이 흔들려 우리 병력 약 ' + com(lost) + '명이 상했습니다. 적도 약 ' + com(killed) + '명을 잃었습니다.', 'A sudden sortie shook the camp and about ' + com(lost) + ' of ours were hurt; the garrison lost about ' + com(killed) + ' too.', '守備軍の急襲で陣が揺らぎ、味方約' + com(lost) + '名が傷つきました。敵も約' + com(killed) + '名を失いました。');
    return { text: txt, chips: this.eff({ fx: { morale: won ? 2 : -4 } }) };
  };
  var _py = P.pressYear;
  P.pressYear = function () {   // 해마다 수비군이 조금씩 채워진다
    var p = this.pressActive ? this.pressActive() : null; if (p && p.gdmg) p.gdmg = Math.round(p.gdmg * 0.85 * 1000) / 1000;
    return _py.apply(this, arguments);
  };
  var _pu = P.pressUI;
  P.pressUI = function () {   // 주둔 압박 창에 '성 밖 교전' 안내를 덧붙인다
    var r = _pu.apply(this, arguments);
    try { var cs = this.g.root.querySelectorAll('.modal.dock .card'), card = cs[cs.length - 1], sub = card && card.querySelector('.sub'); if (sub && !card.querySelector('.campnote')) sub.insertAdjacentHTML('afterend', '<div class="note campnote">🚩 <span>' + LB.pressAdd + '</span></div>'); } catch (e) { }
    return r;
  };
  var _dt = P.dynTarget;
  P.dynTarget = function (pl) {   // 진영 앞 교전으로 줄어든 수비군
    var t = _dt.apply(this, arguments), p = this.s && this.s.press;
    if (p && p.gdmg && pl && p.place === pl.id) t.garrison = Math.max(500, Math.round(t.garrison * (1 - p.gdmg) / 500) * 500);
    return t;
  };
  var _wf = P.warFlow;
  P.warFlow = function (tid) {
    var r = _wf.apply(this, arguments);
    try {
      var T0 = this.targetById(tid), p = this.s.press;
      if (T0 && p && p.gdmg >= 0.02 && p.place === T0.place) {
        var cs = this.g.root.querySelectorAll('.modal.dock .card'), card = cs[cs.length - 1], sub = card && card.querySelector('.sub');
        if (sub) { var d = document.createElement('div'); d.className = 'note'; d.innerHTML = '🚩 ' + L3('진영 앞 교전으로 수비군이 약 <b>' + Math.round(p.gdmg * 100) + '%</b> 줄었습니다.', 'Fighting before your camp has thinned the garrison by about <b>' + Math.round(p.gdmg * 100) + '%</b>.', '陣の前での交戦で守備軍が約<b>' + Math.round(p.gdmg * 100) + '%</b>減りました。'); sub.insertAdjacentElement('afterend', d); }
      }
    } catch (e) { if (window.console) console.warn('lureNote', e); }
    return r;
  };
  SG.LURE = { SORT: SORT, TEMPER: TEMPER, LB: LB };
})();
