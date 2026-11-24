/* 병과 숙련(병과 고도화) — 보병·정예병·기병·궁노병·공성기·수군을 따로 길러 전투에 반영한다. (게임 추상화 모델)
 * 숙련도는 realm 의 b_line·b_elite·b_cav·b_rng·b_siege (0~100, 20점마다 1등급, 최대 5등급)로 저장되어 저장·불러오기와 사건 효과(realm)가 그대로 통한다.
 * 수군 등급은 기존 수군력(realm.navy)을 20으로 나눈 값이다.
 * 등급을 올리는 길: ① 군사 명령(병과 조련) ② 실전(싸운 병과가 경험을 쌓음) ③ 사건 효과.
 * 전투 반영: tactics.js 가 A.bl / B.bl(병과별 등급)을 읽는다. 적 등급은 적의 훈련도와 나라별 특기로 정한다.
 * T()는 반드시 파일을 읽을 때(함수 밖에서) 부른다. */
(function () {
  var TR = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
  function T(k, e, j) { TR.en[k] = e; TR.ja[k] = j; return k; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var P = SG.Sandbox.prototype, T_ = SG.TACT;

  var KEYS = { line: 'b_line', elite: 'b_elite', cav: 'b_cav', rng: 'b_rng', siege: 'b_siege' };
  var NM = {
    line: T('보병', 'Infantry', '歩兵'), elite: T('정예병', 'Elite troops', '精鋭兵'), cav: T('기병', 'Cavalry', '騎兵'),
    rng: T('궁·노병', 'Archers & crossbows', '弓・弩兵'), siege: T('공성기', 'Siege engines', '攻城器'), navy: T('수군', 'Navy', '水軍')
  };
  var LV = [T('신병', 'Raw', '新兵'), T('숙련', 'Drilled', '熟練'), T('정련', 'Seasoned', '精練'), T('정예', 'Elite', '精鋭'), T('명성', 'Renowned', '名声'), T('극의', 'Master', '極意')];
  var PERK = {
    line: T('방진: 방어 진형에서 더 단단해지고, 적 기병의 돌격을 무디게 합니다.', 'Phalanx: sturdier in a defensive formation and blunts enemy cavalry charges.', '方陣: 防御陣形でより堅くなり、敵騎兵の突撃を鈍らせます。'),
    elite: T('군기: 정예병이 많을수록 전투 중 사기가 덜 꺾입니다.', 'Discipline: the more elite troops, the less morale is lost in battle.', '軍紀: 精鋭兵が多いほど戦闘中の士気が落ちにくくなります。'),
    cav: T('기동: 4합 측면 기동과 패주병 추격이 강해집니다.', 'Mobility: stronger flanking in round 4 and harder pursuit of broken enemies.', '機動: 第4合の側面機動と敗走兵の追撃が強まります。'),
    rng: T('일제 사격: 첫 합 원거리 사격과 궁병 소모전이 강해집니다.', 'Volley fire: stronger opening volleys and archer attrition tactics.', '一斉射撃: 初合の遠距離射撃と弓兵の消耗戦が強まります。'),
    siege: T('공성술: 성곽을 공격할 때 공성기의 위력이 커집니다.', 'Siegecraft: siege engines hit harder against fortifications.', '攻城術: 城郭を攻めるとき攻城器の威力が増します。'),
    navy: T('수전: 해안·바다 전투에서 수군이 더 강해집니다.', 'Naval warfare: the navy is stronger in coastal and sea battles.', '水戦: 沿岸・海上の戦いで水軍が強くなります。')
  };
  T('보병 숙련', 'Infantry mastery', '歩兵の熟練'); T('정예 숙련', 'Elite mastery', '精鋭の熟練'); T('기병 숙련', 'Cavalry mastery', '騎兵の熟練'); T('궁노 숙련', 'Archery mastery', '弓弩の熟練'); T('공성 숙련', 'Siege mastery', '攻城の熟練');
  SG.branchNames = NM; SG.branchLv = LV;

  function lv(v) { return clamp(Math.floor((v || 0) / 20), 0, 5); }
  P.myBL = function () {
    var r = this.s.realm, o = {}; for (var g in KEYS) o[g] = lv(r[KEYS[g]]); o.navy = lv(r.navy); return o;
  };
  // 적 병과 등급: 적 훈련도 + 나라별 특기(게임 추상화)
  var FOE_PLUS = { tang: { cav: 1, rng: 1, siege: 1 }, goguryeo: { cav: 1, elite: 1, siege: 1 }, silla: { elite: 1, rng: 1 }, baekje: { rng: 1, navy: 1 }, wa: { navy: 1 }, gaya: { cav: 1 } };
  P.foeBL = function (side) {
    var tr = this.foeTrain ? this.foeTrain(side) : 50, base = clamp(Math.round((tr - 40) / 14), 0, 4), pl = FOE_PLUS[side] || {}, o = {};
    ['line', 'elite', 'cav', 'rng', 'siege', 'navy'].forEach(function (g) { o[g] = clamp(base + (pl[g] || 0) - (g === 'siege' ? 1 : 0), 0, 5); });
    return o;
  };

  /* ── 초기값: 나라별 전통에 맞춰 한두 병과가 한 단계 앞선 채 시작 ── */
  var START = { baekje: { b_line: 20, b_rng: 20 }, silla: { b_line: 20, b_elite: 20 }, goguryeo: { b_line: 20, b_cav: 20, b_elite: 20 } };
  var _init = P.init;
  P.init = function () {
    _init.apply(this, arguments);
    var r = this.s.realm, st = START[this.side] || { b_line: 20 };
    ['b_line', 'b_elite', 'b_cav', 'b_rng', 'b_siege'].forEach(function (k) { if (r[k] == null) r[k] = st[k] || 0; });
  };

  /* ── 전투에 값을 넘긴다 (예측과 실제 전투가 같은 규칙) ── */
  var _tune = P.tune;
  P.tune = function (ours, en) { var r = _tune.apply(this, arguments); ours.bl = this.myBL(); en.bl = this.foeBL(en.side); return r; };

  /* ── 실전 경험: 전투 결과창이 뜰 때 한 번 반영 ── */
  var XPN = {
    gain: T('병과 숙련', 'Branch mastery', '兵科の熟練'), up: T('등급 상승!', 'rank up!', '等級上昇!')
  };
  P.branchXP = function (r) {
    try {
      if (!r || !r.a || !r.a.units || r.a.name !== 'a' && !r.a.side) return '';
      var c = T_.comp(r.a.units), N = c.N || 1, win = r.winner === 'a', base = win ? 9 : 5, s = this.s, out = [];
      for (var g in KEYS) {
        var e = c[g]; if (!e) continue; var sh = e.n / N; if (sh < 0.04) continue;
        var k = KEYS[g], before = s.realm[k] || 0, bonus = 1, stn = r.stanceA;
        // 병과별 실전 가산: 그 병과가 제 몫을 한 전투일수록 더 배운다
        if (g === 'cav' && (stn === 'charge' || stn === 'flank' || stn === 'wedge' || stn === 'feign' || stn === 'harass' || (win && r.routed === 'b'))) bonus += 0.5;
        if (g === 'rng' && (stn === 'attrition' || stn === 'hold')) bonus += 0.5;
        if (g === 'elite' && (stn === 'forlorn' || stn === 'charge')) bonus += 0.5;
        if (g === 'siege' && stn === 'siege') bonus += 0.6;
        if (g === 'line' && stn === 'hold') bonus += 0.3;
        var add = Math.max(1, Math.round(base * bonus * Math.min(1, 0.6 + sh) * (before >= 80 ? 0.5 : 1)));
        s.realm[k] = clamp(before + add, 0, 100);
        out.push('<u>' + NM[g] + '</u> +' + add + (lv(s.realm[k]) > lv(before) ? ' <i>' + XPN.up + '</i> <u>' + LV[lv(s.realm[k])] + '</u>' : ''));
      }
      return out.length ? '<b>' + XPN.gain + '</b> — ' + out.join(' · ') : '';
    } catch (x) { return ''; }
  };
  var _bUI = SG.Game.prototype.battleUI;
  SG.Game.prototype.battleUI = function (r, title, outro, cb) {
    var note = this.sb && this.sb.branchXP ? this.sb.branchXP(r) : '';
    return _bUI.call(this, r, title, note ? (outro ? outro + '<br>' : '') + note : outro, cb);
  };

  /* ── 사용하지 않으면 감각이 무뎌진다: 해마다 높은 숙련이 조금씩 식는다 ── */
  var _ye = P.yearEnd;
  P.yearEnd = function () {
    var r = this.s.realm; for (var g in KEYS) { var k = KEYS[g]; if ((r[k] || 0) > 40) r[k] = Math.max(40, r[k] - 1); }
    // 새로 양성한 병과는 그만큼 조련이 쌓인다(기병을 키우면 기병 숙련도 오른다)
    try {
      var cc = T_.comp(this.fieldUnits ? this.fieldUnits(1) : []), prev = this.s.brSnap || {}, snap = {};
      for (var q in KEYS) { var nn = cc[q] ? cc[q].n : 0; snap[q] = nn; var d = nn - (prev[q] == null ? nn : prev[q]); if (d >= 300) r[KEYS[q]] = clamp((r[KEYS[q]] || 0) + Math.min(6, Math.round(d / 400)), 0, 100); }
      this.s.brSnap = snap;
    } catch (x) {}
    return _ye.apply(this, arguments);
  };

  /* ── 화면: 병과 숙련 막대 ── */
  var HD = T('병과 숙련', 'Branch mastery', '兵科の熟練');
  SG.branchPanel = function (sb) {
    var bl = sb.myBL(), r = sb.s.realm, h = '<details class="brd"' + (sb.s.brOpen ? ' open' : '') + ' ontoggle="try{SG.game.sb.s.brOpen=this.open}catch(e){}"><summary style="cursor:pointer;font-weight:700;padding:4px 0">' + HD + '</summary><div class="realm brs" title="' + HD + '">';
    ['line', 'elite', 'cav', 'rng', 'siege', 'navy'].forEach(function (g) {
      var v = g === 'navy' ? r.navy || 0 : r[KEYS[g]] || 0, L = bl[g];
      h += '<div class="rb" title="' + PERK[g] + '"><i>' + NM[g] + '</i><span><u style="width:' + clamp(v, 0, 100) + '%"></u></span><b>Lv' + L + '</b></div>';
    });
    return h + '</div></details>';
  };

  /* ── 군사 명령: 병과 조련 ── */
  function mk(g, id, name, desc, cost, lines) {
    var key = KEYS[g];
    return {
      id: id, cat: '군사', name: T(name[0], name[1], name[2]), desc: T(desc[0], desc[1], desc[2]), cost: cost, hist: '가상', eff: {},
      req: function (ctx) { return ((ctx.realm || {})[key] || 0) < 100; },
      lines: lines.map(function (l) { return T(l[0], l[1], l[2]); }),
      fn: function (g2, ctx) { var cur = (ctx.realm || {})[key] || 0, L = lv(cur), gain = Math.max(6, 18 - 3 * L); return { realm: (function () { var o = {}; o[key] = gain; return o; })() }; }
    };
  }
  var CM = [
    mk('line', 'br_line', ['보병 진법 조련', 'Infantry Formation Drill', '歩兵の陣法調練'], ['방패와 창으로 방진을 짜는 훈련을 거듭합니다. 보병 숙련 상승 (등급이 높을수록 오르는 폭이 줄어듭니다)', 'Drill shield-and-spear formations again and again. Raises infantry mastery (gains shrink at higher ranks).', '盾と槍で方陣を組む訓練を重ねます。歩兵の熟練が上がります(等級が高いほど上がり幅は小さくなります)。'], { food: 3, gold: 2 },
      [['방패와 창이 한 몸처럼 움직이는 방진 훈련이 이어졌습니다.', 'Phalanx drills went on until shields and spears moved as one body.', '盾と槍が一つの体のように動く方陣の訓練が続きました。']]),
    mk('elite', 'br_elite', ['정예 단련', 'Elite Hardening', '精鋭の鍛錬'], ['선발한 정예병을 따로 모아 혹독하게 단련합니다. 정예병 숙련 상승', 'Gather the picked elite and harden them severely. Raises elite mastery.', '選抜した精鋭兵を別に集めて厳しく鍛えます。精鋭兵の熟練が上がります。'], { gold: 6, food: 2 },
      [['정예병들이 혹독한 훈련 속에서 서로를 믿는 법을 배웠습니다.', 'In punishing drills the elite learned to trust one another.', '精鋭兵たちは厳しい訓練の中で互いを信じることを学びました。']]),
    mk('cav', 'br_cav', ['기병 조련', 'Cavalry Schooling', '騎兵の調練'], ['말 타고 활 쏘고 돌아 치는 기마술을 가르칩니다. 기병 숙련 상승', 'Teach mounted archery and wheeling charges. Raises cavalry mastery.', '騎射と旋回突撃の馬術を教えます。騎兵の熟練が上がります。'], { gold: 5 },
      [['목장 들판에서 기병들이 달리며 활을 쏘고 대열을 갈랐다 모이는 훈련을 했습니다.', 'On the pasture plain the riders shot at the gallop and drilled splitting and rejoining the line.', '牧場の野で騎兵たちが駆けながら弓を射て、隊列を割っては集まる訓練をしました。']]),
    mk('rng', 'br_rng', ['궁·쇠뇌 사격술', 'Archery and Crossbow Practice', '弓・弩の射撃術'], ['과녁을 세워 일제 사격과 쇠뇌 장전을 반복 연습합니다. 궁·노병 숙련 상승', 'Set up targets and repeat volley fire and crossbow loading. Raises archer mastery.', '的を立てて一斉射撃と弩の装填を繰り返します。弓・弩兵の熟練が上がります。'], { gold: 4 },
      [['성벽 아래 과녁이 늘어서고 시위 소리가 한꺼번에 울렸습니다.', 'Targets lined up beneath the wall and bowstrings sang all at once.', '城壁の下に的が並び、弦の音が一斉に鳴り響きました。']]),
    mk('siege', 'br_siege', ['공성기 제작·운용', 'Siege Engine Crafting and Handling', '攻城器の製作・運用'], ['충차·투석기·운제를 만들고 다루는 법을 익힙니다. 공성기 숙련 상승', 'Learn to build and handle rams, catapults and ladders. Raises siege mastery.', '衝車・投石機・雲梯を作り扱う法を学びます。攻城器の熟練が上がります。'], { gold: 6, food: 1 },
      [['장인들이 충차와 투석기를 조립하고 병사들이 다루는 법을 익혔습니다.', 'Artisans assembled rams and catapults while soldiers learned to work them.', '職人たちが衝車と投石機を組み立て、兵が扱い方を覚えました。']])
  ];
  SG.data.commands = (SG.data.commands || []).concat(CM);
})();
