/* 전술 전투 엔진: 병력 수 외에 훈련·병종 상성·지형·계절·작전(태세)·예비대·사기/패주를 반영한다.
   (게임 추상화 모델 — 사료 수치가 아니다.) SG.battle(A,B,opt) 를 대체하며 반환 형식은 호환된다.
   A,B 확장 필드: train(0~100) stance focus reserve tk(지형 종류) ; opt: season, defense(A가 방어측), pace, rounds */
(function () {
  var BASE = SG.BASE;
  var TR = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
  function T(k, e, j) { TR.en[k] = e; TR.ja[k] = j; if (SG.i18n && SG.i18n.dict) { SG.i18n.dict.en = SG.i18n.dict.en || {}; } return k; }
  // 나라별 특기 병종(게임 추상화): 공격·방어 배율. 일반 병종보다 확실히 강하다.
  var SPEC = {
    baekje_gyebaek: { a: 1.22, d: 1.0 }, silla_hwarang: { a: 1.22, d: 0.95 }, silla_seodang: { a: 1.1, d: 1.08 }, goguryeo_gaemamusa: { a: 1.3, d: 1.2 },
    tang_elite: { a: 1.15, d: 1.1 }, tang_cavalry: { a: 1.15, d: 1.05 }, silla_crossbow: { a: 1.22, d: 1.0 }, goguryeo_archer: { a: 1.15, d: 1.0, ha: 1 }, baekje_archer: { a: 1.1, d: 1.0 }, tang_crossbow: { a: 1.1, d: 1.0 }
  };
  var GRP = { inf_levy: 'levy', inf_line: 'line', guard: 'line', garrison: 'line', inf_elite: 'elite', cav_light: 'cav', cav_heavy: 'cav', archer: 'rng', crossbow: 'rng', siege: 'siege', navy_war: 'navy', navy_transport: 'sup', scout: 'sup' };
  var GN = { levy: '징집병', line: '정병 보병', elite: '정예병', cav: '기병', rng: '궁·노병', siege: '공성기', navy: '수군', sup: '보조병' };
  var MU = { // 공격 병종 → 상대 병종 (1 = 대등)
    cav: { levy: 1.45, line: 0.93, elite: 0.85, cav: 1, rng: 1.3, siege: 1.35, navy: 0.8, sup: 1.35 },
    rng: { levy: 1.25, line: 1.04, elite: 0.88, cav: 1.12, rng: 1, siege: 1.1, navy: 1, sup: 1.1 },
    line: { levy: 1.12, line: 1, elite: 0.92, cav: 1.15, rng: 1.15, siege: 1.2, navy: 1, sup: 1.2 },
    elite: { levy: 1.15, line: 1.05, elite: 1, cav: 1.02, rng: 1.15, siege: 1.2, navy: 1, sup: 1.2 },
    levy: { levy: 1, line: 0.9, elite: 0.85, cav: 0.75, rng: 1.1, siege: 1.1, navy: 1, sup: 1.1 }
  };
  var TK = { // 지형 종류별 병종 보정
    plain: { nm: '평지', cav: 1.15, rng: 1.0 }, hill: { nm: '구릉·산지', cav: 0.85, rng: 1.1 }, pass: { nm: '좁은 길목', cav: 0.7, rng: 1.05 },
    river: { nm: '강변·도하', cav: 0.8, rng: 1.0 }, fort: { nm: '성곽', cav: 0.55, rng: 1.25 }, coast: { nm: '해안', cav: 0.95, rng: 1.0 }, sea: { nm: '바다', cav: 0.5, rng: 0.9 }
  };
  var ST = { // 태세
    balanced: { nm: '균형 진형', atk: 1, def: 1, mor: 1, d: '무난. 약점도 강점도 없다.' },
    hold: { nm: '방어 진형', atk: 0.85, def: 1.22, mor: 0.8, d: '방패를 세워 버틴다. 돌격에 강하고 측면 우회·궁병 사격에 약하다.' },
    charge: { nm: '돌격', atk: 1.28, def: 0.88, mor: 1.1, cav: 1.1, d: '기세로 밀어붙인다. 궁병 위주 적에 강하나 방어 진형에 막히면 무너진다.' },
    attrition: { nm: '궁병 소모전', atk: 0.85, def: 1.08, mor: 1, rng: 1.35, d: '활·쇠뇌로 서서히 깎는다. 정지한 적에 강하고 돌격에 약하다. 궁·노병이 있어야 한다.' },
    flank: { nm: '측후방 기동', atk: 0.95, def: 0.95, mor: 1, cav: 1.35, d: '4합 이후 기병이 옆구리를 친다. 방어 진형 적에 강하다. 기병이 있어야 한다.' },
    ambush: { nm: '매복·기습', atk: 0.95, def: 1, mor: 1, d: '첫 합에 큰 타격. 험지에서 더 강하고, 간파되면 소용없다.' },
    siege: { nm: '공성·포위', atk: 0.95, def: 1.05, mor: 1, d: '공성기를 앞세워 성곽을 압박한다. 성이 아니면 효과가 없다.' },
    fire: { nm: '화공', atk: 0.95, def: 1, mor: 1, d: '건조한 가을에 크게 통하고 비 오는 여름엔 꺼진다. 징집병 진영에 특히 강하다.' },
    feign: { nm: '유인 역습', atk: 0.8, def: 1.1, mor: 0.9, d: '일부러 물러나 적을 끌어내고 3합에 기병으로 역습한다. 돌격하는 적에 강하고 궁병·성곽 앞에서는 약하다. 기병이 있어야 한다.' },
    wedge: { nm: '기병 쐐기 돌파', atk: 1.05, def: 0.9, mor: 1.15, d: '2합에 기병이 한 점을 찔러 적 진형을 가른다. 징집병·정병 진영에 강하나 방어 진형·좁은 길·성곽에서는 막힌다. 기병이 있어야 한다.' },
    harass: { nm: '기마 교란전', atk: 0.9, def: 1.05, mor: 0.9, d: '기병이 치고 빠지며 적의 사기와 진형을 깎는다. 우리 피해는 적으나 빠른 결판은 못 낸다. 궁병 소모전에는 약하다. 기병이 있어야 한다.' },
    forlorn: { nm: '결사 돌격', atk: 1.1, def: 0.8, mor: 1.2, d: '정예·결사대를 앞세워 일점 돌파한다. 이기면 크게 이기지만 방어가 약해진다. 정예병이 있어야 한다.' }
  };
  T('특수병', 'Special troops', '特殊兵'); T('정예병·결사대가 부족합니다.', 'Not enough elite troops.', '精鋭・決死隊が足りません。'); T('성곽 앞에서는 기병이 돌파할 수 없습니다.', 'Cavalry cannot break through at the walls.', '城郭の前では騎兵は突破できません。'); T('없음', 'none', 'なし');
  T('유인 역습', 'Feigned Retreat', '誘引反撃'); T('기병 쐐기 돌파', 'Cavalry Wedge', '騎兵楔突破'); T('기마 교란전', 'Mounted Harassment', '騎馬撹乱戦'); T('결사 돌격', 'Last-Stand Charge', '決死突撃');
  T(ST.feign.d, 'Fall back on purpose to draw the enemy out, then counter with cavalry in round 3. Strong against chargers, weak against archers and walls. Needs cavalry.', 'わざと退いて敵を誘い出し、第3合に騎兵で反撃する。突撃してくる敵に強く、弓兵や城郭の前では弱い。騎兵が必要。');
  T(ST.wedge.d, 'In round 2 the cavalry stab one point and split the enemy line. Strong against levies and regulars, but stopped by defensive formations, narrow paths and walls. Needs cavalry.', '第2合に騎兵が一点を突いて敵陣を割る。徴発兵・正兵の陣に強いが、防御陣形・狭い道・城郭では阻まれる。騎兵が必要。');
  T(ST.harass.d, 'Cavalry strike and withdraw, wearing down enemy morale and formation. Few losses for us, but no quick decision. Weak against archer attrition. Needs cavalry.', '騎兵が一撃離脱を繰り返し、敵の士気と陣形を削る。味方の損害は小さいが短期決着はできない。弓兵の消耗戦に弱い。騎兵が必要。');
  T(ST.forlorn.d, 'Elite and death-or-glory troops lead a one-point breakthrough. A big win if it works, but your defense weakens. Needs elite troops.', '精鋭・決死隊を先頭に一点突破する。成功すれば大勝だが守りは弱まる。精鋭兵が必要。');
  var CT = { // [내 태세][상대 태세] → 내 공격 배율
    hold: { charge: 1.18, flank: 0.9, ambush: 1.1 }, charge: { hold: 0.85, attrition: 1.18, flank: 1.12, balanced: 1.1 }, attrition: { charge: 0.85, hold: 1.15, ambush: 0.95 },
    flank: { hold: 1.2, charge: 0.88 }, ambush: { charge: 1.15, balanced: 1.1, attrition: 1.05 }, fire: { hold: 1.1, balanced: 1.05 },
    feign: { charge: 1.3, balanced: 1.05, hold: 0.85, attrition: 0.9, wedge: 1.1 }, wedge: { balanced: 1.1, attrition: 1.18, charge: 1.0, hold: 0.8, flank: 1.0 },
    harass: { balanced: 1.05, charge: 1.05, hold: 1.0, attrition: 0.85 }, forlorn: { balanced: 1.08, attrition: 1.15, charge: 1.05, hold: 0.92 }
  };
  CT.attrition.harass = 1.12; CT.attrition.wedge = 0.9; CT.hold.wedge = 1.15; CT.charge.feign = 0.8; CT.hold.forlorn = 1.1; CT.hold.feign = 1.1;
  var TH = { t: T('역사적 상성', 'Historical matchups', '歴史的相性'), a: T('아군', 'Our', '味方'), b: T('적군', 'The enemy’s', '敵軍'),
    c1: T(' 기병이 훈련 덜 된 징집병 대열을 휩쓸었습니다 — 갑옷·대형이 없는 보병은 기병 돌격에 쉽게 무너진 것이 동서양 전사의 공통점입니다.', ' cavalry swept the poorly drilled levies — across history, unarmored and unformed infantry broke easily under a cavalry charge.', ' 騎兵が訓練の浅い徴発兵を蹴散らしました。甲冑も陣形もない歩兵は騎兵の突撃に崩れやすいのが古今東西の通例です。'),
    c2: T(' 기병이 방패와 창을 세운 방진 정면에 막혔습니다 — 밀집한 창벽은 정면 기병 돌격을 막고, 옆구리나 후방을 칠 때 비로소 뚫립니다.', ' cavalry was stopped by the shield-and-spear wall — a dense spear line holds against a frontal charge and breaks only from the flank or rear.', ' 騎兵は盾と槍を立てた方陣に正面から阻まれました。密集した槍衾は正面突撃を防ぎ、側背を突かれて初めて崩れます。'),
    c3: T(' 노병의 강한 쇠뇌가 갑옷과 중장기병을 꿰뚫었습니다 — 석궁·쇠뇌는 갑옷을 입은 적에 특히 효과적입니다.', ' crossbows punched through armor and heavy horse — crossbows excel against armored foes.', ' 弩兵の強弩が甲冑と重装騎兵を貫きました。弩は甲冑を着た敵に特に有効です。'),
    c4: T(' 기마 궁수가 치고 빠지며 활을 쏘았습니다 — 기병이 적은 적은 기마 궁수의 일방적 사격에 시달립니다.', ' horse archers shot and withdrew — foes with little cavalry suffer one-sided fire from mounted archers.', ' 騎馬弓兵が撃っては退きました。騎兵の少ない敵は騎射の一方的な射撃に苦しみます。') };
  function U(id) { return SG.unitById(id); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function tot(x) { return x.reduce(function (s, u) { return s + u.n; }, 0); }
  function trainF(g, t) { t = t == null ? 50 : Math.min(t, 170); return g === 'levy' ? 0.7 + 0.6 * t / 100 : g === 'elite' ? 0.9 + 0.2 * t / 100 : 0.85 + 0.3 * t / 100; }

  // 병종 구성: {그룹: {n, atk, def}}
  function comp(units) {
    var c = {}, N = 0;
    units.forEach(function (u) {
      var Un = U(u.id); if (!Un || !u.n) return; var b = BASE[Un.base] || [8, 8], g = GRP[Un.base] || 'line', e = c[g] || (c[g] = { n: 0, atk: 0, def: 0 });
      var sp = SPEC[u.id]; if (Un.base === 'crossbow') e.xb = (e.xb || 0) + u.n; if (sp && sp.ha) e.ha = (e.ha || 0) + u.n; e.n += u.n; e.atk += u.n * b[0] * (1 + 0.1 * Un.atk) * (sp ? sp.a : 1); e.def += u.n * b[1] * (1 + 0.1 * Un.def) * (sp ? sp.d : 1); if (sp) { e.spec = e.spec || {}; e.spec[u.id] = (e.spec[u.id] || 0) + u.n; } N += u.n;
    });
    c.N = N; return c;
  }
  function shares(c) { var o = {}, N = c.N || 1; for (var g in c) if (g !== 'N') o[g] = c[g].n / N; return o; }
  function mu(c, enemyShares) { // 가중 평균 상성
    var t = 0, w = 0; for (var g in c) { if (g === 'N') continue; var m = MU[g]; if (!m) { t += c[g].atk; w += c[g].atk; continue; } var s = 0; for (var h in enemyShares) s += enemyShares[h] * (m[h] || 1); t += c[g].atk * s; w += c[g].atk; }
    return w ? t / w : 1;
  }
  function autoStance(f, other) {
    var s = shares(comp(f.units)), t = f.terrain || 1;
    if (s.rng > 0.3) return 'attrition'; if (s.cav > 0.3) return t >= 1.3 ? 'charge' : 'wedge'; if (s.elite > 0.3) return 'forlorn'; if (t >= 1.3) return 'hold'; return 'balanced';
  }
  function genCmd(f) { var g = f.gen ? SG.generalById(f.gen) : null; return g ? g.stats.cmd : 5; }

  SG.TACT = { SPEC: SPEC, T: T, BR_NM: { line: '보병', elite: '정예병', cav: '기병', rng: '궁·노병', siege: '공성기', navy: '수군' }, GN: GN, TK: TK, ST: ST, comp: comp, shares: shares, mu: mu, autoStance: autoStance, trainF: trainF };

  SG.battle = function (A, B, opt) {
    opt = opt || {};
    var a = A.units.map(function (u) { return { id: u.id, n: u.n }; }), b = B.units.map(function (u) { return { id: u.id, n: u.n }; });
    var rounds = opt.rounds || 6, season = opt.season || '', aDef = !!opt.defense;
    var s0a = tot(a), s0b = tot(b), log = [], fac = [];
    var sA = A.stance || 'balanced', sB = B.stance || autoStance(B, A);
    if (A.ambush && sA === 'balanced') sA = 'ambush'; if (B.ambush && sB === 'balanced') sB = 'ambush';
    var ca = comp(a), cb = comp(b), shA = shares(ca), shB = shares(cb);
    var muA = mu(ca, shB), muB = mu(cb, shA);
    var tkA = TK[A.tk] || TK.plain, tkB = TK[B.tk] || TK.plain, tkF = TK[B.tk] || TK[A.tk] || TK.plain; // 전장 지형: 방어측이 정한다
    var field = TK[opt.tk] || (aDef ? tkA : tkB.nm === '평지' ? tkA : tkB);
    var resA = clamp(A.reserve || 0, 0, 0.4), resB = clamp(B.reserve || 0, 0, 0.4);
    var mA = A.morale == null ? 70 : A.morale, mB = B.morale == null ? 70 : B.morale;
    var trA = A.train == null ? 50 : A.train, trB = B.train == null ? 50 : B.train;
    var cmdA = genCmd(A), cmdB = genCmd(B);
    var ctA = (CT[sA] || {})[sB] || 1, ctB = (CT[sB] || {})[sA] || 1;
    var eliA = clamp(0.05 * ((A.bl || {}).elite || 0) * Math.min(1, (shA.elite || 0) * 3), 0, 0.25), eliB = clamp(0.05 * ((B.bl || {}).elite || 0) * Math.min(1, (shB.elite || 0) * 3), 0, 0.25);
    var fortAny = !!(A.fort || B.fort || field === TK.fort);

    function season_(g, isAtt, st) {
      var m = 1;
      if (season === '겨울') { if (isAtt) m *= 0.92; if (g === 'rng') m *= 0.92; }
      if (season === '여름') { if (g === 'rng') m *= 0.88; if (g === 'cav' && field === TK.plain) m *= 0.92; }
      return m;
    }
    function power(f, c, side, ctx, r) { // 해당 합의 공격력/방어력
      var atk = 0, def = 0, st = ST[side.st] || ST.balanced, isAtt = side.att, def_bonus;
      for (var g in c) {
        if (g === 'N') continue; def_bonus = 1; var e = c[g], tf = trainF(g, f.train), m = tf * season_(g, isAtt), bl = f.bl || {}, Lv = bl[g] || 0, fbl = ctx.fbl || {};
        m *= 1 + 0.04 * Lv; if (g === 'line' && side.st === 'hold') m *= 1 + 0.02 * Lv;
        var tkm = g === 'cav' ? field.cav : g === 'rng' ? field.rng : 1;
        if (g === 'navy') tkm = field === TK.sea || field === TK.coast ? 1.25 : 0.7;
        if (g === 'cav' && st.cav) tkm *= (r >= 4 || side.st !== 'flank' ? st.cav : 1);
        if (g === 'rng' && st.rng) tkm *= st.rng;
        if (g === 'rng') { tkm *= r === 1 ? 1.7 * (1 + 0.05 * Lv) : 0.8; if (side.st === 'attrition') tkm *= 1 + 0.03 * Lv; } else if (g === 'cav' && r === 4) tkm *= 1.15 * (1 + 0.03 * Lv); else tkm *= r === 1 ? 0.5 : 1.05;
        if (g === 'cav') tkm *= 1 - 0.03 * (fbl.line || 0);
        var sn = side.st, esh = ctx.esh || {};
        // 역사적 상호작용: 방진(창·방패)은 정면 기병 돌격을 막고, 석궁은 갑옷을 뚫고, 기마 궁수는 기병 없는 적을 끌어다 쏜다
        if (g === 'cav' && ctx.est === 'hold' && sn !== 'flank' && sn !== 'wedge' && sn !== 'feign' && (esh.line || 0) + (esh.elite || 0) > 0.3) tkm *= 0.84;
        if ((g === 'line' || g === 'elite') && sn === 'hold') def_bonus = 1 + 0.4 * (esh.cav || 0);
        if (g === 'rng' && e.xb) m *= 1 + 0.14 * (e.xb / e.n) * Math.min(1, ((esh.elite || 0) + (esh.cav || 0)) * 3);
        if (g === 'rng' && e.ha && field === TK.plain) m *= 1 + 0.2 * (e.ha / e.n) * (esh.cav > 0.25 ? 0.4 : 1);
        if (g === 'elite') { if (r >= 2 && r <= 4) m *= 1.08; if (sn === 'forlorn' && r >= 2 && r <= 4) m *= 1.4; }
        if (g === 'cav') { if (sn === 'wedge') tkm *= r === 2 ? 1.6 : r === 3 ? 1.1 : 1; if (sn === 'feign') tkm *= r <= 2 ? 0.8 : r === 3 ? 1.5 : 1.15; if (sn === 'harass') tkm *= 0.92; if (e.spec && e.spec.goguryeo_gaemamusa && sn === 'charge' && field === TK.plain) tkm *= 1.1; }
        if (sn === 'feign' && g !== 'cav') m *= r <= 2 ? 0.9 : 1.1;
        if (g === 'siege') tkm *= (fortAny ? 1.8 * (1 + 0.06 * Lv) : 0.6) * (side.st === 'siege' ? 1.25 : 1);
        atk += e.atk * m * tkm; def += e.def * m * def_bonus;
      }
      return { atk: atk * st.atk * ctx.ct, def: def * st.def };
    }
    function side(st, att, res) { return { st: st, att: att, res: res }; }
    var iA = side(sA, !aDef, resA), iB = side(sB, aDef, resB);
    var terA = A.terrain || 1, terB = B.terrain || 1;
    var flee = null, morLossA = 0, morLossB = 0;
    // 계절 불리 사기
    if (season === '겨울') { if (!aDef) mA -= 3; else mB -= 3; }
    var stT = ST[sA], stU = ST[sB];
    for (var r = 1; r <= rounds; r++) {
      var na = tot(a), nb = tot(b); if (!na || !nb) break;
      var ca2 = comp(a), cb2 = comp(b), pA = power(A, ca2, iA, { ct: ctA, fbl: B.bl, esh: shares(cb2), est: sB }, r), pB = power(B, cb2, iB, { ct: ctB, fbl: A.bl, esh: shares(ca2), est: sA }, r);
      var fatA = (1 - 0.022 * (r - 1) * (1.3 - trA / 100)), fatB = (1 - 0.022 * (r - 1) * (1.3 - trB / 100));
      var contA = r <= 3 ? 1 - resA : 1, contB = r <= 3 ? 1 - resB : 1;
      var fpA = r >= 4 ? (1 - resA) * fatA + resA : fatA * contA, fpB = r >= 4 ? (1 - resB) * fatB + resB : fatB * contB;
      var mfA = 0.6 + clamp(mA, 0, 100) / 100 * 0.6, mfB = 0.6 + clamp(mB, 0, 100) / 100 * 0.6;
      var gA = 1 + (cmdA - 5) * 0.06, gB = 1 + (cmdB - 5) * 0.06;
      var atkA = pA.atk * muA * mfA * gA * fpA * (terA > 1 ? 1 + (terA - 1) * 0.5 : terA) * (opt.luckA || 1);
      var atkB = pB.atk * muB * mfB * gB * fpB * (terB > 1 ? 1 + (terB - 1) * 0.5 : terB) * (opt.luckB || 1);
      var defA = pA.def * mfA * gA * terA, defB = pB.def * mfB * gB * terB;
      var engA = A.cap && na > A.cap ? A.cap / na : 1, engB = B.cap && nb > B.cap ? B.cap / nb : 1;
      var am = r === 1 && (sA === 'ambush') ? (field === TK.hill || field === TK.pass || field === TK.river ? 1.7 : 1.35) : 1, bm = r === 1 && sB === 'ambush' ? (field === TK.hill || field === TK.pass || field === TK.river ? 1.7 : 1.35) : 1;
      var fm = 1; // 화공
      if (r <= 2) { if (sA === 'fire') am *= season === '가을' ? 1.35 : season === '여름' ? 0.5 : 1.1; if (sB === 'fire') bm *= season === '가을' ? 1.35 : season === '여름' ? 0.5 : 1.1; }
      var pace = opt.pace || 1;
      var ka = Math.min(0.4, 0.13 * atkA / (defB + 1) * pace * am) * engB, kb = Math.min(0.4, 0.13 * atkB / (defA + 1) * pace * bm) * engA;
      // 예비대는 합 1~3에 교전하지 않아 피해도 적다
      var la = kb * contA * (sA === 'harass' ? 0.92 : 1) * (sA === 'feign' && r <= 2 ? 0.85 : 1), lb = ka * contB * (sB === 'harass' ? 0.92 : 1) * (sB === 'feign' && r <= 2 ? 0.85 : 1);
      var before = [na, nb];
      b.forEach(function (u) { u.n = Math.max(0, Math.round(u.n * (1 - lb))); }); a.forEach(function (u) { u.n = Math.max(0, Math.round(u.n * (1 - la))); });
      var na2 = tot(a), nb2 = tot(b), dA = (na - na2) / (na || 1), dB = (nb - nb2) / (nb || 1);
      var rA = na2 / (s0a || 1), rB = nb2 / (s0b || 1);
      var cmA = 1 - Math.min(0.3, (cmdA - 5) * 0.05), cmB = 1 - Math.min(0.3, (cmdB - 5) * 0.05);
      mA -= (3 + dA * 45 + (rA < rB ? 3 : 0)) * (stT.mor || 1) * cmA * (1 - eliA); mB -= (3 + dB * 45 + (rB < rA ? 3 : 0)) * (stU.mor || 1) * cmB * (1 - eliB);
      if (sA === 'harass') mB -= 2.5 + 3 * (shA.cav || 0); if (sB === 'harass') mA -= 2.5 + 3 * (shB.cav || 0);
      if (r === 2 && sA === 'wedge') mB -= 3 + 8 * (shA.cav || 0); if (r === 2 && sB === 'wedge') mA -= 3 + 8 * (shB.cav || 0);
      if (r === 3 && sA === 'feign') mB -= 4 + 4 * (shA.cav || 0); if (r === 3 && sB === 'feign') mA -= 4 + 4 * (shB.cav || 0);
      if (r === 4 && resA) { mA += 8; log.push('제4합 — ' + A.name + '의 예비대 ' + Math.round(resA * 100) + '%가 새 힘으로 가담합니다.'); }
      if (r === 4 && resB) { mB += 8; log.push('제4합 — ' + B.name + '의 예비대가 가담합니다.'); }
      var phase = r === 1 ? '원거리 교전' : r <= 3 ? '정면 충돌' : r === 4 ? '측면·예비대 투입' : '결전';
      log.push('제' + r + '합(' + phase + ') — ' + A.name + ' ' + na2.toLocaleString() + ' (사기 ' + Math.round(clamp(mA, 0, 100)) + ') / ' + B.name + ' ' + nb2.toLocaleString() + ' (사기 ' + Math.round(clamp(mB, 0, 100)) + ')');
      if (r >= 3) { // 패주 판정
        var thA = 26 + (55 - trA) * 0.25 + (sA === 'hold' ? -4 : 0) - (cmdA - 5) * 1.2, thB = 26 + (55 - trB) * 0.25 + (sB === 'hold' ? -4 : 0) - (cmdB - 5) * 1.2;
        var brA = mA < thA || rA < 0.3, brB = mB < thB || rB < 0.3;
        if (brA || brB) { flee = brA && brB ? (mA - thA < mB - thB ? 'a' : 'b') : brA ? 'a' : 'b'; break; }
      }
    }
    var routed = null;
    if (flee) { // 패주: 추격 피해
      var win = flee === 'a' ? sB : sA, wc = flee === 'a' ? shB : shA, loser = flee === 'a' ? a : b, wname = flee === 'a' ? B.name : A.name, lname = flee === 'a' ? A.name : B.name;
      var pur = 0.07 + 0.22 * (wc.cav || 0) + (flee === 'a' ? (trB - trA) : (trA - trB)) / 800; pur += 0.02 * (((flee === 'a' ? B.bl : A.bl) || {}).cav || 0) * Math.min(1, (wc.cav || 0) * 4); if ((flee === 'a' ? sB : sA) === 'feign' || (flee === 'a' ? sB : sA) === 'wedge') pur += 0.03; pur = clamp(pur, 0.04, 0.32);
      loser.forEach(function (u) { u.n = Math.max(0, Math.round(u.n * (1 - pur))); });
      routed = flee; log.push(lname + '군이 무너져 패주합니다. ' + wname + '의 추격으로 ' + Math.round(pur * 100) + '%를 더 잃습니다' + ((wc.cav || 0) > 0.2 ? '(기병 추격).' : '.'));
    }
    var ra = tot(a) / (s0a || 1), rb = tot(b) / (s0b || 1), winner = routed ? (routed === 'a' ? 'b' : 'a') : (ra > rb ? 'a' : 'b');

    // ── 요인 설명 ──
    var tfA = trainF('line', trA), tfB = trainF('line', trB);
    if (Math.abs(tfA / tfB - 1) > 0.04) fac.push('<b>훈련</b> 아군 ' + Math.round(trA) + ' · 적 ' + Math.round(trB) + ' → 전투력 ' + (tfA >= tfB ? '아군' : '적군') + ' 쪽이 약 ' + Math.round(Math.abs(tfA / tfB - 1) * 100) + '% 우세. 훈련이 낮으면 쉽게 무너집니다.');
    (function () { var NM = SG.TACT.BR_NM, la = [], lb = []; for (var g in NM) { if ((A.bl || {})[g] > 0 && (shA[g] || 0) > 0.05) la.push(NM[g] + ' Lv' + A.bl[g]); if ((B.bl || {})[g] > 0 && (shB[g] || 0) > 0.05) lb.push(NM[g] + ' Lv' + B.bl[g]); }
      if (la.length || lb.length) fac.push('<b>병과 숙련</b> 아군 ' + (la.join(' · ') || '없음') + ' / 적 ' + (lb.join(' · ') || '없음') + ' — 숙련 등급이 높을수록 해당 병과의 공방·특기(궁병 첫 사격, 기병 추격, 정예 사기 유지, 공성기)가 강해집니다.'); })();
    (function () { var la = [], lb = []; function sp(c, o) { for (var g in c) { if (g === 'N' || !c[g].spec) continue; for (var id in c[g].spec) { var Un = U(id), q = SPEC[id]; if (Un && q && c[g].spec[id] / (c.N || 1) > 0.04) o.push('<i>' + Un.name + '</i> ×' + Math.max(q.a, q.d).toFixed(2)); } } }
      sp(ca, la); sp(cb, lb);
      if (la.length || lb.length) fac.push('<b>특수병</b> <u>아군</u> ' + (la.join(' · ') || '없음') + ' / <u>적</u> ' + (lb.join(' · ') || '없음') + ' <i>' + T('나라별 특기 병종은 일반 병종보다 공방이 높습니다.', 'The signature troops of each nation fight harder than ordinary ones.', '国ごとの特技兵種は一般兵種より攻守が高い。') + '</i>'); })();
    (function () { var out = []; function chk(c, sh, esh, who) { if ((sh.cav || 0) > 0.2 && (esh.levy || 0) > 0.25) out.push(who + TH.c1); if ((sh.cav || 0) > 0.2 && sB && (esh.line || 0) + (esh.elite || 0) > 0.3 && (who === TH.a ? sB : sA) === 'hold') out.push(who + TH.c2); if (c.rng && c.rng.xb && (esh.elite || 0) + (esh.cav || 0) > 0.25) out.push(who + TH.c3); if (c.rng && c.rng.ha && (sh.rng || 0) > 0.2) out.push(who + TH.c4); }
      chk(ca, shA, shB, TH.a); chk(cb, shB, shA, TH.b);
      if (out.length) fac.push('<b>' + TH.t + '</b> ' + out.join(' ')); })();
    if (Math.abs(muA - muB) > 0.05) { var best = function (c, sh) { var bg = '', bv = 0; for (var g in c) if (g !== 'N' && c[g].atk > bv && MU[g]) { bv = c[g].atk; bg = g; } return GN[bg] || ''; };
      fac.push('<b>병종 상성</b> 아군 ' + muA.toFixed(2) + ' : 적 ' + muB.toFixed(2) + ' — ' + (muA > muB ? '아군 ' + best(ca) + '이(가) 적 편성을 잘 상대합니다.' : '적 ' + best(cb) + '이(가) 아군 편성을 잘 상대합니다.')); }
    if (sA !== 'balanced' || sB !== 'balanced') fac.push('<b>작전</b> 아군 「' + ST[sA].nm + '」 대 적 「' + ST[sB].nm + '」' + (ctA !== 1 || ctB !== 1 ? ' → ' + (ctA > ctB ? '아군 작전이 적 태세를 찔렀습니다 (×' + ctA.toFixed(2) + ')' : ctB > ctA ? '적 태세가 아군 작전을 받아쳤습니다 (×' + ctB.toFixed(2) + ')' : '맞물림') : ''));
    if (field !== TK.plain) fac.push('<b>지형</b> ' + field.nm + ' — 기병 ×' + field.cav.toFixed(2) + ', 궁·노 ×' + field.rng.toFixed(2) + (shA.cav > 0.25 || shB.cav > 0.25 ? '. 기병이 많은 쪽이 제 힘을 못 씁니다.' : ''));
    if (season) fac.push('<b>계절</b> ' + season + (season === '겨울' ? ' — 공격측 사기·궁병 약화' : season === '여름' ? ' — 장마로 활줄·진창에 불리' : season === '가을' ? ' — 건조해 화공이 잘 번집니다' : ' — 특이사항 없음'));
    if (resA || resB) fac.push('<b>예비대</b> ' + (resA ? '아군 ' + Math.round(resA * 100) + '%' : '') + (resA && resB ? ' · ' : '') + (resB ? '적 ' + Math.round(resB * 100) + '%' : '') + ' — 처음 3합 동안 아껴 두었다가 4합에 투입.');
    if (routed) fac.push('<b>패주</b> ' + (routed === 'a' ? '아군' : '적군') + '의 사기가 꺾여 진형이 무너졌습니다. 훈련·지휘관·병력 잔존율이 버티는 힘을 좌우합니다.');
    return { a: A, b: B, aStart: s0a, bStart: s0b, aEnd: tot(a), bEnd: tot(b), aLeft: a, bLeft: b, winner: winner, ratio: ra / (rb || 0.01), log: log, factors: fac, routed: routed, stanceA: sA, stanceB: sB };
  };
})();
