/* 상대국의 전략 — 적도 작전(태세)을 고른다.
   ① 플레이어와 싸우는 적 지휘관: 눈에 보이는 편성·지형·성벽을 보고, 후보 작전마다 "상대가 고를 법한 작전들"에 맞서 보아 가장 나은 것을 고른다.
      상대의 실제 선택은 모른다. 지휘관 솜씨(훈련)가 낮으면 가끔 차선을 고른다. 첩보가 높으면 군사 회의에서 적의 작전과 속셈을 알 수 있다.
   ② 나라끼리의 전쟁(aiwar.js): 주사위 한 번 대신, 양쪽이 작전을 고른 전투(SG.battle)로 승패를 가른다. 병력은 두 나라의 국력 비로 정하고,
      성의 방어는 성벽·지형·수비 병종이 맡는다. 같은 힘이면 예전과 비슷한 승률(공격이 불리)이 되도록 맞추었다.
   (게임 추상화 모델 — 사료 수치가 아니다.) */
(function () {
  var TT = SG.TACT; if (!TT || !SG.battle) return;
  var ST = TT.ST, comp = TT.comp, autoStance = TT.autoStance, _battle = SG.battle;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hash(str) { var h = 2166136261, i; for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rngOf(seed) { var a = hash(String(seed)) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  var ALL = ['balanced', 'hold', 'attrition', 'charge', 'flank', 'ambush', 'siege', 'fire', 'feign', 'wedge', 'harass', 'forlorn'];

  // 이 편성·지형·역할에서 고를 수 있는 작전인가 (사람에게 열려 있는 규칙에, 적이 상식적으로 고르지 않을 것들을 더 거른다)
  function feasible(st, tk, role, c, N, season) {
    function has(g) { return !!(c[g] && c[g].n > N * 0.08); }
    switch (st) {
      case 'attrition': return has('rng');
      case 'flank': return has('cav') && tk !== 'pass' && tk !== 'fort';
      case 'charge': return !(role === 'def' && tk === 'fort');   // 성벽 뒤의 수비군은 성문을 열고 정면 돌격하지 않는다(출격은 따로 다룬다)
      case 'feign': return has('cav') && !(role === 'def' && tk === 'fort');
      case 'harass': return has('cav');
      case 'wedge': return has('cav') && tk !== 'fort';
      case 'forlorn': return has('elite');
      case 'siege': return role === 'att' && tk === 'fort';
      case 'hold': return role === 'def';
      case 'ambush': return role === 'def' && (tk === 'hill' || tk === 'pass' || tk === 'river');
      case 'fire': return season === '가을' && tk !== 'fort';
    }
    return true;
  }

  // 상대가 어떤 작전을 고를 것으로 보는가 — 보이는 편성·지형·역할만 보고 어림한 분포. 상대의 실제 선택은 모른다.
  function belief(other, me, o, co, No) {
    var r = o.role === 'att' ? 'def' : 'att', w = {}, k, sum = 0, out = [];
    function add(st, v) { if (feasible(st, o.tk, r, co, No, o.season)) w[st] = (w[st] || 0) + v; }
    add(autoStance(other, me), 0.3); add('balanced', 0.2);
    if (o.prior) add(o.prior, 0.3);
    if (r === 'att') { add('charge', 0.12); add('siege', 0.26); add('wedge', 0.08); add('flank', 0.08); add('attrition', 0.08); add('forlorn', 0.05); }
    else { add('hold', 0.3); add('attrition', 0.1); add('charge', 0.05); add('forlorn', 0.04); add('ambush', 0.06); }
    for (k in w) sum += w[k];
    for (k in w) out.push({ st: k, w: w[k] / sum });
    return out;
  }

  // 두 작전으로 붙었을 때 me 편의 결과 (운은 뺀 기댓값 기준). 이기면 1, 남은 병력 비율의 차를 더한다.
  function run(me, other, sm, so, o) {
    var X = Object.assign({}, me, { stance: sm }), Y = Object.assign({}, other, { stance: so }), A = o.meA ? X : Y, B = o.meA ? Y : X, r = _battle(A, B, o.bo);
    var ra = r.aEnd / (r.aStart || 1), rb = r.bEnd / (r.bStart || 1), my = o.meA ? ra : rb, ot = o.meA ? rb : ra, win = r.winner === (o.meA ? 'a' : 'b');
    if (win && o.role === 'att' && my < 0.3) win = false;   // 이겨도 군이 3할 밑이면 성을 차지하지 못한 것으로 본다
    return (win ? 1 : 0) + 0.6 * (my - ot);
  }

  // 작전 고르기: 후보마다 상대의 예상 작전들에 대한 결과를 재 보고(평균 70% + 최악 30%), 지휘관 솜씨에 따라 가끔 차선을 고른다.
  function pick(me, other, o) {
    var cm = comp(me.units), cs = comp(other.units), Nm = cm.N || 1, bel = belief(other, me, o, cs, cs.N || 1), res = [], i, j, st, sum, worst, u;
    for (i = 0; i < ALL.length; i++) {
      st = ALL[i]; if (!feasible(st, o.tk, o.role, cm, Nm, o.season)) continue;
      sum = 0; worst = 9;
      for (j = 0; j < bel.length; j++) { u = run(me, other, st, bel[j].st, o); sum += bel[j].w * u; if (u < worst) worst = u; }
      res.push({ st: st, s: 0.7 * sum + 0.3 * worst });
    }
    if (!res.length) return { st: 'balanced', best: 'balanced', list: [], bel: bel };
    res.sort(function (a, b) { return b.s - a.s; });
    var best = res[0].s, tau = o.tau == null ? 0.05 : o.tau, ws = [], tw = 0, w, x, ch = res[0].st;
    for (i = 0; i < res.length; i++) { w = res[i].s >= best - 0.4 ? Math.exp((res[i].s - best) / tau) : 0; ws.push(w); tw += w; }
    x = (o.rng || Math.random)() * tw;
    for (i = 0; i < res.length; i++) { x -= ws[i]; if (x <= 0) { ch = res[i].st; break; } }
    return { st: ch, best: res[0].st, list: res, bel: bel };
  }
  SG.FOE = { ALL: ALL, feasible: feasible, belief: belief, run: run, pick: pick, rngOf: rngOf, hash: hash };

  var P = SG.Sandbox && SG.Sandbox.prototype; if (!P) return;
  var L3 = SG.L3 || function (k, e, j) { var l = SG.i18n && SG.i18n.lang; return l === 'en' ? e : l === 'ja' ? j : k; };
  function tx(a) { return L3(a[0], a[1], a[2]); }
  function sn(st) {   // 현재 언어의 작전 이름
    var nm = ST[st] ? ST[st].nm : st, I = SG.i18n, l = I && I.lang, d = I && I.dict && l && I.dict[l];
    return (l && l !== 'ko' && d && d[nm]) || nm;
  }
  function gauss() { var u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function tot(u) { var t = 0, i; for (i = 0; i < u.length; i++) t += u[i].n; return t; }

  /* ── 설명 문구: 어떻게 싸우려는가(ACT) · 왜 그렇게 보았는가(RS) ── */
  var ACT = {
    balanced: ['특별한 승부수 없이 균형 진형으로 맞섭니다', 'holds a balanced formation with no special gambit', '特別な勝負手を打たず均衡陣形で当たります'],
    hold: ['방패를 세워 진형을 굳히고 버팁니다', 'locks shields and holds its ground', '盾を立てて陣を固め、持ちこたえます'],
    attrition: ['활과 쇠뇌로 접근하는 아군을 서서히 깎으려 합니다', 'plans to whittle your army down with bows and crossbows', '弓と弩で近づく味方をじわじわ削ろうとします'],
    charge: ['기세를 몰아 정면으로 돌격해 옵니다', 'presses a headlong charge', '勢いに乗って正面から突撃してきます'],
    flank: ['기병을 돌려 측면과 후방을 치려 합니다', 'swings its cavalry around to strike the flank and rear', '騎兵を回して側面と後方を突こうとします'],
    ambush: ['길목에 군을 숨겨 기습하려 합니다', 'hides troops along the route to spring an ambush', '要路に軍を伏せて奇襲しようとします'],
    siege: ['공성기를 앞세워 성벽부터 허물려 합니다', 'leads with siege engines to bring down the walls first', '攻城器を先頭にまず城壁を崩そうとします'],
    fire: ['마른 계절을 틈타 불을 놓으려 합니다', 'means to set fires while the season is dry', '乾いた季節に乗じて火を放とうとします'],
    feign: ['거짓으로 물러나 아군을 끌어낸 뒤 역습하려 합니다', 'will feign a retreat to draw you out, then counter', '偽って退き、誘い出してから反撃しようとします'],
    wedge: ['기병을 쐐기처럼 박아 한 점을 뚫으려 합니다', 'drives a cavalry wedge into one point to split your line', '騎兵を楔のように打ち込み一点を破ろうとします'],
    harass: ['기병이 치고 빠지며 아군의 사기를 깎으려 합니다', 'will raid and withdraw with horsemen to wear down your morale', '騎兵が撃っては退き、味方の士気を削ろうとします'],
    forlorn: ['정예 결사대를 앞세워 일점 돌파를 노립니다', 'sends elite last-stand troops for a one-point breakthrough', '精鋭の決死隊を先頭に一点突破を狙います']
  };
  var RS = {
    walls: ['성벽이 아직 든든해 수비가 유리하다고 보았습니다', 'judging that the walls still give the defense the edge', '城壁がまだ堅く、守りが有利と見たためです'],
    wallsRng: ['성벽 위에서 쏘는 편이 유리하다고 보았습니다', 'shooting down from the walls is to their advantage', '城壁の上から射る方が有利と見ました'],
    vsCav: ['아군 기병이 많아 방진으로 받아내려는 것입니다', 'since you field many cavalry, they brace with a spear wall', '味方に騎兵が多いため、方陣で受け止める構えです'],
    outnum: ['병력이 열세라 무리하지 않고 버티는 쪽을 택했습니다', 'being outnumbered, they chose to endure rather than gamble', '兵力で劣るため、無理をせず耐える道を選びました'],
    outnumRng: ['병력이 열세라 거리를 두고 쏘는 쪽을 택했습니다', 'being outnumbered, they prefer to fight from a distance', '兵力で劣るため、距離を取って射る道を選びました'],
    rng: ['궁·노병이 많아 거리를 두고 싸우는 편이 낫다고 보았습니다', 'with many archers and crossbowmen, fighting at range suits them', '弓・弩兵が多く、距離を取って戦うのが得策と見ました'],
    vsRng: ['아군이 궁병 위주라 거리를 좁혀 몰아붙이려 합니다', 'your force leans on archers, so they close the distance fast', '味方が弓兵中心のため、距離を詰めて押し込む構えです'],
    vsLevy: ['아군에 훈련이 덜 된 징집병이 많아 단번에 무너뜨릴 수 있다고 보았습니다', 'your army has many poorly drilled levies that they expect to break in one blow', '味方に訓練不足の徴発兵が多く、一撃で崩せると見ました'],
    edge: ['병력과 기세가 앞서 길게 끌 이유가 없다고 보았습니다', 'with the larger force and the momentum, they see no reason to drag it out', '兵力と勢いで勝るため、長引かせる理由はないと見ました'],
    cav: ['기병이 충분해 기동으로 승부를 보려 합니다', 'with plenty of cavalry, they want to win by maneuver', '騎兵が十分にいるため、機動で勝負をかけます'],
    elite: ['정예가 충분해 일점 돌파가 통한다고 보았습니다', 'with enough elite troops, they judge a one-point breakthrough can work', '精鋭が十分におり、一点突破が通じると見ました'],
    outnumCav: ['병력이 열세라 정면 승부를 피하려는 것입니다', 'being outnumbered, they avoid a head-on fight', '兵力で劣るため、正面からの勝負を避けます'],
    engines: ['공성기를 갖추어 성벽을 허무는 것이 가장 빠른 길이라 보았습니다', 'with engines in the train, bringing down the walls is the fastest road', '攻城器を備えており、城壁を崩すのが最短と見ました'],
    noengines: ['공성기는 적지만 에워싸 성벽을 조금씩 허물 작정입니다', 'engines are few, but they mean to wear the walls down by encirclement', '攻城器は少ないものの、包囲して城壁を少しずつ崩す腹です'],
    dry: ['건조한 가을이라 불이 잘 번진다고 보았습니다', 'the dry autumn lets fire spread easily', '乾燥した秋で火がよく燃え広がると見ました'],
    terrain: ['험한 지형이 매복에 알맞다고 보았습니다', 'the rough ground favors an ambush', '険しい地形が伏兵に向いていると見ました'],
    even: ['양쪽 힘이 비슷해 승부수를 아끼려는 것입니다', 'the two sides are evenly matched, so they hold back their gambits', '双方の力が拮抗しており、勝負手を温存します'],
    stronger: ['병력이 앞서 굳이 위험한 승부수를 띄울 필요가 없다고 보았습니다', 'with the larger force, they see no need for a risky gambit', '兵力で勝るため、危険な勝負手は不要と見ました'],
    weaker: ['병력이 모자라지만 무리한 승부수보다 정석을 택했습니다', 'though outnumbered, they chose the standard formation over a reckless gamble', '兵力で劣るものの、無理な勝負手より定石を選びました']
  };

  /* ── ① 플레이어와 싸우는 적의 작전 ── */
  var CACHE = {}, CN = 0;
  function sigU(u) { var o = [], i; for (i = 0; i < u.length; i++) o.push(u[i].id + ':' + Math.round(u[i].n / 50)); return o.join(','); }
  P.foeKey = function (ours, en, bo, ctx) {
    var pid = (ctx.T && ctx.T.place) || (ctx.bt && ctx.bt.place) || (ctx.anchor && ctx.anchor.place) || '';
    return [pid, this.s.year, en.side, ctx.def ? 1 : 0, bo.tk, bo.season || '', en.walls ? en.walls.hp0 : 0, ours.walls ? ours.walls.hp0 : 0, sigU(ours.units), sigU(en.units)].join('|');
  };
  P.foeWhy = function (st, en, ours, role, hasWalls) {
    var cm = comp(en.units), co = comp(ours.units), Nm = cm.N || 1, No = co.N || 1;
    function sm(g) { return cm[g] ? cm[g].n / Nm : 0; } function so(g) { return co[g] ? co[g].n / No : 0; }
    var tag = 'even';
    switch (st) {
      case 'balanced': tag = Nm > No * 1.3 ? 'stronger' : Nm < No * 0.75 ? 'weaker' : 'even'; break;
      case 'hold': tag = role === 'def' && hasWalls ? 'walls' : so('cav') > 0.2 ? 'vsCav' : Nm < No * 0.85 ? 'outnum' : ''; break;
      case 'attrition': tag = role === 'def' && hasWalls ? 'wallsRng' : Nm < No * 0.85 ? 'outnumRng' : 'rng'; break;
      case 'charge': tag = so('rng') > 0.22 ? 'vsRng' : so('levy') > 0.25 ? 'vsLevy' : Nm > No * 1.2 ? 'edge' : ''; break;
      case 'wedge': tag = so('levy') > 0.2 ? 'vsLevy' : 'cav'; break;
      case 'flank': tag = 'cav'; break;
      case 'feign': tag = ''; break;
      case 'forlorn': tag = 'elite'; break;
      case 'harass': tag = Nm < No * 0.9 ? 'outnumCav' : ''; break;
      case 'siege': tag = sm('siege') >= 0.025 ? 'engines' : 'noengines'; break;
      case 'fire': tag = 'dry'; break;
      case 'ambush': tag = 'terrain'; break;
    }
    return '「' + sn(st) + '」 — ' + tx(ACT[st] || ACT.balanced) + (tag && RS[tag] ? ' (' + tx(RS[tag]) + ')' : '') + (L3('.', '.', '。'));
  };
  P.foeChoose = function (ours, en, bo, ctx) {
    var s = this.s, def = !!ctx.def, tk = bo.tk || 'plain', pid = (ctx.T && ctx.T.place) || (ctx.bt && ctx.bt.place) || (ctx.anchor && ctx.anchor.place) || '';
    var bo2 = { rounds: bo.rounds || 6, pace: bo.pace, tk: bo.tk, season: bo.season, defense: !!bo.defense }, A = Object.assign({}, ours, { reserve: 0 });
    var tr = en.train == null ? 50 : en.train, tau = (0.035 + (85 - clamp(tr, 25, 85)) * 0.0009) * (s.extended ? 0.7 : 1);
    var pr = this.stanceOf ? this.stanceOf(ctx.tac) : null; if (pr !== 'siege' && pr !== 'balanced') pr = null;
    var role = def ? 'att' : 'def', res = pick(en, A, { meA: false, role: role, tk: tk, season: bo.season || '', bo: bo2, rng: rngOf([pid, s.year, en.side, def ? 1 : 0].join('|')), tau: tau, prior: pr });
    var hasW = role === 'def' ? !!en.walls : !!ours.walls;
    return { st: res.st, why: this.foeWhy(res.st, en, A, role, hasW) };
  };
  var _tune = P.tune;
  P.tune = function (ours, en, bo, ctx, sel) {
    var r = _tune.apply(this, arguments);
    try { this.foeSet(ours, en, bo, ctx); } catch (e) { if (window.console) console.warn('foeSet', e); }
    return r;
  };
  P.foeSet = function (ours, en, bo, ctx) {
    if (!ctx || !en || !en.units || !en.units.length || !ours || !ours.units) return;
    if (en.stance && en._fs == null) return;   // 사료나 상황이 정해 둔 작전은 그대로 둔다
    if (en.ambush || (ctx.T && ctx.T._amb)) return;   // 매복을 깔아 둔 적은 그 작전대로 싸운다
    var key = this.foeKey(ours, en, bo, ctx);
    if (en._fs === key && en.stance) return;
    var c = CACHE[key];
    if (!c) { c = this.foeChoose(ours, en, bo, ctx); if (CN > 160) { CACHE = {}; CN = 0; } CACHE[key] = c; CN++; }
    en.stance = c.st; en.why = c.why; en._fs = key;
  };
  // 군사 회의 창이 열릴 때: 적의 작전을 미리 정해 정찰 줄에 보이게 한다(첩보가 낮으면 어림만)
  P.foeLook = function (ours, en, bo, ctx) {
    if (ctx && ctx.T && ctx.T._amb && !en.stance) { en.stance = 'ambush'; return; }   // 행군 중 매복에 걸렸다(이미 알려진 일)
    if (en.stance && en._fs == null) return;
    if (en.ambush) return;
    var o = JSON.parse(JSON.stringify(ours)), e = JSON.parse(JSON.stringify(en)), b = JSON.parse(JSON.stringify(bo));
    this.tune(o, e, b, ctx, null);
    if (!e._fs) return;
    en.stance = e.stance; en.why = e.why; en._fs = e._fs;
    var i = this.s.realm.intel;
    en.estSt = (i >= 20 && i < 40 && rngOf('est|' + e._fs)() >= (i - 10) / 30) ? null : e.stance;   // 20~39: 맞출 때도 틀릴 때도 있다
  };
  P.foeNote = function (en, i) {
    if (!en || !en._fs || !en.why || i < 40) return '';
    return '<div class="note">🎯 <b>' + L3('적의 속셈', 'Enemy intent', '敵の狙い') + '</b> ' + en.why + '</div>';
  };
  var _b0 = SG.battle;   // 전투 결과 요인에 적의 작전과 까닭을 덧붙인다
  SG.battle = function (A, B) {
    var r = _b0.apply(this, arguments);
    try {
      if (B && B._fs && B.why && r && r.factors) {
        var line = '<b>' + L3('적의 작전', 'Enemy plan', '敵の作戦') + '</b> ' + B.why, k = -1;
        r.factors.forEach(function (f, j) { if (k < 0 && f.indexOf('<b>작전</b>') === 0) k = j; });
        if (k >= 0) r.factors.splice(k + 1, 0, line); else r.factors.push(line);
      }
    } catch (e) { }
    return r;
  };

  /* ── ② 나라끼리의 전쟁 ── */
  var KK = { capital: 2.0, city: 1.8, fortress: 1.9, port: 1.65, pass: 2.1 };            // 공격군/수비군 병력비 보정 — 같은 힘일 때 승률이 옛 모델과 같아지도록 맞춘 값
  var GREF = { capital: 16000, city: 8000, fortress: 6500, port: 5000, pass: 3500 };      // 수비군 기준 규모(성벽 체력의 기준)
  var SIGN = 0.28;                                                                         // 전황의 불확실성(첩보·증원·이탈): 병력비에 곱하는 로그정규 잡음
  // 나라별 전장 보정: 국력 수치에는 이미 그 나라 군의 질이 녹아 있어서, 전투 모형(병종·숙련·특수병)을 그대로 쓰면 같은 국력인데도 한쪽이 늘 이기게 된다.
  // 같은 국력이면 같은 승률이 되도록 라운드로빈 시험으로 맞춘 값(병종 상성·작전의 영향은 그대로 남는다).
  var SK = { baekje: 1.05, silla: 0.90, goguryeo: 1.10, tang: 0.85, gaya: 1.05 };
  var UBL = { line: 1, elite: 1, cav: 1, rng: 1, siege: 0, navy: 0 };                        // 국력에는 훈련·숙련이 이미 들어 있다 — 나라끼리의 전쟁에서는 모두 같은 수준으로 놓는다(이중 계산 방지)
  function tkFor(kind) { return kind === 'pass' ? 'pass' : kind === 'port' ? 'coast' : (kind === 'capital' || kind === 'city' || kind === 'fortress') ? 'fort' : 'plain'; }
  P.foeArmyMix = function (side) {
    var m = SG.mixFor ? SG.mixFor(this, side, 'army') : null, k, sum = 0;
    m = Object.assign({}, m || { line: 0.5, levy: 0.15, archer: 0.15, horse: 0.1, elite: 0.1 });
    delete m.garrison; delete m.siege; delete m.navy; delete m.guard;
    for (k in m) sum += m[k]; for (k in m) m[k] /= (sum || 1);
    return m;
  };
  // 한 번의 성 공략전. att·def 는 aiwar.js 가 구한 국력 비교 수치(def 에는 성의 방어 보정 km 이 들어 있다)
  P.aiBattle = function (a, t, att, def, km) {
    var pl = t.p, kind = pl.kind, o = t.o, hf = (SG.HARD && SG.HARD.foe) || 1, dT = this.dynTarget(pl, o), D = Math.max(1500, dT.garrison || GREF[kind] || 6000);
    var ratio = clamp(att / Math.max(0.01, def / (km || 1.2)) * (SK[a] || 1) / (SK[o] || 1), 0.3, 3.2), Na = Math.round(D * ratio * (KK[kind] || 1.85) * Math.exp(SIGN * gauss()) / 500) * 500, tk = tkFor(kind);
    var A = { name: 'a', side: a, units: this.enemyUnits(a, Na / hf, this.foeArmyMix(a)), morale: 70, terrain: 1, train: 52, bl: Object.assign({}, UBL) };
    this.addEngines(A, this.engineShare(a));
    var B = { name: 'b', side: o, units: this.enemyUnits(o, D / hf, dT.mix || this.foeArmyMix(o)), morale: 68, terrain: dT.terrain || 1.2, train: 52, tk: tk, fort: (dT.terrain || 1) >= 1.45, bl: Object.assign({}, UBL) };
    var W = SG.siege && SG.siege.wallsFor(pl, this.nat(o).defense); if (W) { W.hp0 = Math.round(W.hp0 * clamp(D / ((GREF[kind] || D) * 1.165), 0.5, 2.2)); B.walls = W; }
    var s = this.s, bo = { rounds: 6, tk: tk, season: '', defense: false }, tauA = (0.035 + (85 - clamp(this.foeTrain(a), 25, 85)) * 0.0009) * (s.extended ? 0.7 : 1), tauB = (0.035 + (85 - clamp(this.foeTrain(o), 25, 85)) * 0.0009) * (s.extended ? 0.7 : 1);
    var seed = [pl.id, s.year, a, o].join('|');
    A.stance = pick(A, B, { meA: true, role: 'att', tk: tk, season: '', bo: bo, rng: rngOf(seed + 'a'), tau: tauA }).st;
    B.stance = pick(B, A, { meA: false, role: 'def', tk: tk, season: '', bo: bo, rng: rngOf(seed + 'b'), tau: tauB }).st;
    var r = _battle(A, B, { rounds: 6, tk: tk, season: '', defense: false, luckA: 0.88 + 0.24 * Math.random(), luckB: 0.88 + 0.24 * Math.random() });
    var won = r.winner === 'a' && r.aEnd / r.aStart >= 0.3, fate = '';
    if (won && Math.random() < 0.08) { won = false; fate = 'upL'; }                      // 배후의 변고로 철군
    else if (!won && Math.random() < 0.06) { won = true; fate = 'upW'; }                  // 내응으로 성문이 열림
    else if (!won && t.hm && Math.random() < 0.2) { won = true; fate = 'hist'; }          // 역사의 흐름이 이끈 점령
    return { won: won, fate: fate, sa: r.stanceA, sb: r.stanceB, lossA: 1 - r.aEnd / (r.aStart || 1), lossB: 1 - r.bEnd / (r.bStart || 1), breach: r.wall ? r.wall.breach : 0, held: r.wall ? r.wall.held : false, routed: r.routed, ratio: ratio };
  };
  // 천하의 움직임 줄에 붙일 작은 설명: 양쪽 작전과 싸움의 모습
  P.aiNote = function (bt) {
    var ex = '';
    if (bt.fate === 'upL') ex = L3('그러나 배후의 변고(역병·반란·보급 두절)로 군을 물렸습니다', 'but trouble at their back (plague, revolt, supply failure) forced a withdrawal', 'しかし背後の変事(疫病・反乱・補給途絶)で軍を退きました');
    else if (bt.fate === 'upW') ex = L3('성 안의 내응으로 성문이 열렸습니다', 'treachery inside opened the gates', '城内の内応で城門が開きました');
    else if (bt.held) ex = L3('성벽이 끝까지 버텼습니다', 'the walls held to the end', '城壁は最後まで持ちこたえました');
    else if (bt.breach) ex = L3('제' + bt.breach + '합에 성벽이 무너졌습니다', 'the walls fell in round ' + bt.breach, '第' + bt.breach + '合に城壁が崩れました');
    else if (bt.routed === 'a') ex = L3('공격군이 패주했습니다', 'the attackers broke and fled', '攻め手は敗走しました');
    else if (bt.routed === 'b') ex = L3('수비군이 무너져 패주했습니다', 'the defenders broke and fled', '守備軍は崩れて敗走しました');
    return ' <small>' + L3('— 공격 「' + sn(bt.sa) + '」 · 수비 「' + sn(bt.sb) + '」', '— attack: ' + sn(bt.sa) + ' · defense: ' + sn(bt.sb), '— 攻撃「' + sn(bt.sa) + '」・守備「' + sn(bt.sb) + '」') + (ex ? ' · ' + ex : '') + '</small>';
  };
})();
