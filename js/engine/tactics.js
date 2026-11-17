/* 전술 전투 엔진: 병력 수 외에 훈련·병종 상성·지형·계절·작전(태세)·예비대·사기/패주를 반영한다.
   (게임 추상화 모델 — 사료 수치가 아니다.) SG.battle(A,B,opt) 를 대체하며 반환 형식은 호환된다.
   A,B 확장 필드: train(0~100) stance focus reserve tk(지형 종류) ; opt: season, defense(A가 방어측), pace, rounds */
(function () {
  var BASE = SG.BASE;
  var GRP = { inf_levy: 'levy', inf_line: 'line', guard: 'line', garrison: 'line', inf_elite: 'elite', cav_light: 'cav', cav_heavy: 'cav', archer: 'rng', crossbow: 'rng', siege: 'siege', navy_war: 'navy', navy_transport: 'sup', scout: 'sup' };
  var GN = { levy: '징집병', line: '정병 보병', elite: '정예병', cav: '기병', rng: '궁·노병', siege: '공성기', navy: '수군', sup: '보조병' };
  var MU = { // 공격 병종 → 상대 병종 (1 = 대등)
    cav: { levy: 1.35, line: 0.95, elite: 0.88, cav: 1, rng: 1.25, siege: 1.3, navy: 0.8, sup: 1.3 },
    rng: { levy: 1.2, line: 1.0, elite: 0.92, cav: 1.15, rng: 1, siege: 1.1, navy: 1, sup: 1.1 },
    line: { levy: 1.1, line: 1, elite: 0.92, cav: 1.12, rng: 1.1, siege: 1.2, navy: 1, sup: 1.2 },
    elite: { levy: 1.15, line: 1.05, elite: 1, cav: 1.02, rng: 1.15, siege: 1.2, navy: 1, sup: 1.2 },
    levy: { levy: 1, line: 0.9, elite: 0.85, cav: 0.85, rng: 1.05, siege: 1.1, navy: 1, sup: 1.1 }
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
    fire: { nm: '화공', atk: 0.95, def: 1, mor: 1, d: '건조한 가을에 크게 통하고 비 오는 여름엔 꺼진다. 징집병 진영에 특히 강하다.' }
  };
  var CT = { // [내 태세][상대 태세] → 내 공격 배율
    hold: { charge: 1.18, flank: 0.9, ambush: 1.1 }, charge: { hold: 0.85, attrition: 1.18, flank: 1.12, balanced: 1.1 }, attrition: { charge: 0.85, hold: 1.15, ambush: 0.95 },
    flank: { hold: 1.2, charge: 0.88 }, ambush: { charge: 1.15, balanced: 1.1, attrition: 1.05 }, fire: { hold: 1.1, balanced: 1.05 }
  };
  function U(id) { return SG.unitById(id); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function tot(x) { return x.reduce(function (s, u) { return s + u.n; }, 0); }
  function trainF(g, t) { t = t == null ? 50 : t; return g === 'levy' ? 0.7 + 0.6 * t / 100 : g === 'elite' ? 0.9 + 0.2 * t / 100 : 0.85 + 0.3 * t / 100; }

  // 병종 구성: {그룹: {n, atk, def}}
  function comp(units) {
    var c = {}, N = 0;
    units.forEach(function (u) {
      var Un = U(u.id); if (!Un || !u.n) return; var b = BASE[Un.base] || [8, 8], g = GRP[Un.base] || 'line', e = c[g] || (c[g] = { n: 0, atk: 0, def: 0 });
      e.n += u.n; e.atk += u.n * b[0] * (1 + 0.1 * Un.atk); e.def += u.n * b[1] * (1 + 0.1 * Un.def); N += u.n;
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
    if (s.rng > 0.3) return 'attrition'; if (s.cav > 0.3) return 'charge'; if (t >= 1.3) return 'hold'; return 'balanced';
  }
  function genCmd(f) { var g = f.gen ? SG.generalById(f.gen) : null; return g ? g.stats.cmd : 5; }

  SG.TACT = { GN: GN, TK: TK, ST: ST, comp: comp, shares: shares, mu: mu, autoStance: autoStance, trainF: trainF };

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
    var fortAny = !!(A.fort || B.fort || field === TK.fort);

    function season_(g, isAtt, st) {
      var m = 1;
      if (season === '겨울') { if (isAtt) m *= 0.92; if (g === 'rng') m *= 0.92; }
      if (season === '여름') { if (g === 'rng') m *= 0.88; if (g === 'cav' && field === TK.plain) m *= 0.92; }
      return m;
    }
    function power(f, c, side, ctx, r) { // 해당 합의 공격력/방어력
      var atk = 0, def = 0, st = ST[side.st] || ST.balanced, isAtt = side.att;
      for (var g in c) {
        if (g === 'N') continue; var e = c[g], tf = trainF(g, f.train), m = tf * season_(g, isAtt);
        var tkm = g === 'cav' ? field.cav : g === 'rng' ? field.rng : 1;
        if (g === 'navy') tkm = field === TK.sea || field === TK.coast ? 1.25 : 0.7;
        if (g === 'cav' && st.cav) tkm *= (r >= 4 || side.st !== 'flank' ? st.cav : 1);
        if (g === 'rng' && st.rng) tkm *= st.rng;
        if (g === 'rng') tkm *= r === 1 ? 1.7 : 0.8; else if (g === 'cav' && r === 4) tkm *= 1.15; else tkm *= r === 1 ? 0.5 : 1.05;
        if (g === 'siege') tkm *= (fortAny ? 1.8 : 0.6) * (side.st === 'siege' ? 1.25 : 1);
        atk += e.atk * m * tkm; def += e.def * m;
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
      var ca2 = comp(a), cb2 = comp(b), pA = power(A, ca2, iA, { ct: ctA }, r), pB = power(B, cb2, iB, { ct: ctB }, r);
      var fatA = (1 - 0.022 * (r - 1) * (1.3 - trA / 100)), fatB = (1 - 0.022 * (r - 1) * (1.3 - trB / 100));
      var contA = r <= 3 ? 1 - resA : 1, contB = r <= 3 ? 1 - resB : 1;
      var fpA = r >= 4 ? (1 - resA) * fatA + resA : fatA * contA, fpB = r >= 4 ? (1 - resB) * fatB + resB : fatB * contB;
      var mfA = 0.6 + clamp(mA, 0, 100) / 100 * 0.6, mfB = 0.6 + clamp(mB, 0, 100) / 100 * 0.6;
      var gA = 1 + (cmdA - 5) * 0.06, gB = 1 + (cmdB - 5) * 0.06;
      var atkA = pA.atk * muA * mfA * gA * fpA * (terA > 1 ? 1 + (terA - 1) * 0.5 : terA);
      var atkB = pB.atk * muB * mfB * gB * fpB * (terB > 1 ? 1 + (terB - 1) * 0.5 : terB);
      var defA = pA.def * mfA * gA * terA, defB = pB.def * mfB * gB * terB;
      var engA = A.cap && na > A.cap ? A.cap / na : 1, engB = B.cap && nb > B.cap ? B.cap / nb : 1;
      var am = r === 1 && (sA === 'ambush') ? (field === TK.hill || field === TK.pass || field === TK.river ? 1.7 : 1.35) : 1, bm = r === 1 && sB === 'ambush' ? (field === TK.hill || field === TK.pass || field === TK.river ? 1.7 : 1.35) : 1;
      var fm = 1; // 화공
      if (r <= 2) { if (sA === 'fire') am *= season === '가을' ? 1.35 : season === '여름' ? 0.5 : 1.1; if (sB === 'fire') bm *= season === '가을' ? 1.35 : season === '여름' ? 0.5 : 1.1; }
      var pace = opt.pace || 1;
      var ka = Math.min(0.4, 0.13 * atkA / (defB + 1) * pace * am) * engB, kb = Math.min(0.4, 0.13 * atkB / (defA + 1) * pace * bm) * engA;
      // 예비대는 합 1~3에 교전하지 않아 피해도 적다
      var la = kb * contA, lb = ka * contB;
      var before = [na, nb];
      b.forEach(function (u) { u.n = Math.max(0, Math.round(u.n * (1 - lb))); }); a.forEach(function (u) { u.n = Math.max(0, Math.round(u.n * (1 - la))); });
      var na2 = tot(a), nb2 = tot(b), dA = (na - na2) / (na || 1), dB = (nb - nb2) / (nb || 1);
      var rA = na2 / (s0a || 1), rB = nb2 / (s0b || 1);
      var cmA = 1 - Math.min(0.3, (cmdA - 5) * 0.05), cmB = 1 - Math.min(0.3, (cmdB - 5) * 0.05);
      mA -= (3 + dA * 45 + (rA < rB ? 3 : 0)) * (stT.mor || 1) * cmA; mB -= (3 + dB * 45 + (rB < rA ? 3 : 0)) * (stU.mor || 1) * cmB;
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
      var pur = 0.07 + 0.22 * (wc.cav || 0) + (flee === 'a' ? (trB - trA) : (trA - trB)) / 800; pur = clamp(pur, 0.04, 0.3);
      loser.forEach(function (u) { u.n = Math.max(0, Math.round(u.n * (1 - pur))); });
      routed = flee; log.push(lname + '군이 무너져 패주합니다. ' + wname + '의 추격으로 ' + Math.round(pur * 100) + '%를 더 잃습니다' + ((wc.cav || 0) > 0.2 ? '(기병 추격).' : '.'));
    }
    var ra = tot(a) / (s0a || 1), rb = tot(b) / (s0b || 1), winner = routed ? (routed === 'a' ? 'b' : 'a') : (ra > rb ? 'a' : 'b');

    // ── 요인 설명 ──
    var tfA = trainF('line', trA), tfB = trainF('line', trB);
    if (Math.abs(tfA / tfB - 1) > 0.04) fac.push('<b>훈련</b> 아군 ' + Math.round(trA) + ' · 적 ' + Math.round(trB) + ' → 전투력 ' + (tfA >= tfB ? '아군' : '적군') + ' 쪽이 약 ' + Math.round(Math.abs(tfA / tfB - 1) * 100) + '% 우세. 훈련이 낮으면 쉽게 무너집니다.');
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
