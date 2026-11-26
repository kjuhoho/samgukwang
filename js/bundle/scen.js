/* 三國王 묶음 파일: scen.js — 개별 JS 파일 6개를 순서대로 이어 붙인 자동 생성 파일입니다. 직접 고치지 마세요(원본: js/ 아래 개별 파일, 생성: tools/build_bundle.js) */
/* ==== js/data/scenario_uija.js ==== */
window.__sgL=1;
/* 의자왕편 v0.2 — 656~663. 서사 근거: 자료조사/08_660_663_전쟁상세.md (삼국사기 신라본기·백제본기·열전 대조)
 * 병력 수치는 사료 명시치(5천/5만/13만)를 쓰되 게임 추상화 값이 섞여 있음. 사료에 없는 갈래는 '가상'으로 표시. */
window.SG = window.SG || {}; SG.data = SG.data || {}; SG.scenarios = SG.scenarios || {};
(function () {
  var P = function (id) { return SG.placeById(id); };
  // 전투 창 제목 번역(전투 창은 코드에서 열리므로 시나리오 문자열 목록에 들어가지 않는다)
  (function () {
    var I = SG.i18n, tr = [
      ['서해 해전 (가상)', 'West Sea Naval Battle (hypothetical)', '西海の海戦(仮想)'], ['탄현 전투 (가상)', 'Battle of Tanhyeon (hypothetical)', '炭峴の戦い(仮想)'], ['기벌포 전투 (가상)', 'Battle of Gibeolpo (hypothetical)', '伎伐浦の戦い(仮想)'],
      ['황산벌 — 네 번의 접전', 'Hwangsanbeol — Four Clashes', '黄山の野 — 四度の接戦'], ['황산벌 — 총공격', 'Hwangsanbeol — The General Assault', '黄山の野 — 総攻撃'],
      ['사비 성외 전투 (가상)', 'Battle Outside Sabi (hypothetical)', '泗沘城外の戦い(仮想)'], ['사비성 농성 (가상)', 'Siege of Sabi (hypothetical)', '泗沘城籠城(仮想)'],
      ['웅진성 농성 (가상)', 'Siege of Ungjin (hypothetical)', '熊津城籠城(仮想)'], ['주류성 공방 (가상)', 'Siege of Juryuseong (hypothetical)', '周留城攻防(仮想)'], ['백강 전투', 'Battle of Baekgang', '白江の戦い']
    ];
    tr.forEach(function (x) { var d = I && I.dict; if (d && d.en) { d.en[x[0]] = x[1]; d.ja[x[0]] = x[2]; } var T6 = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} }; T6.en[x[0]] = x[1]; T6.ja[x[0]] = x[2]; });
  })();
  var SRC_B = '삼국사기 백제본기 의자왕 16·20년', SRC_S = '삼국사기 신라본기 태종무열왕 7년';

  function force(name, side, units, gen, terrain, morale, extra) {
    var f = { name: name, side: side, units: units, gen: gen, terrain: terrain || 1, morale: morale == null ? 70 : morale };
    if (extra) for (var k in extra) f[k] = extra[k];
    return f;
  }
  // 신라 5만 / 당 상륙군 (사료의 규모를 게임 병종 비율로 배분한 추정치)
  var KS = 1, KT = 1, KM = 1; // 660년 진입 시 나라 상태로 정해지는 적 규모 배율
  SG._uijaScale = function (a, b, m) { KS = a; KT = b; KM = m || 1; };
  function cp(n) { return Math.round(n * KM / 500) * 500; }
  function scaleHost(a, k) { return a.map(function (u) { return { id: u.id, n: Math.round(u.n * k) }; }); }
  function sillaHost() { return scaleHost([{ id: 'silla_jeong', n: 30000 }, { id: 'silla_seodang', n: 6000 }, { id: 'silla_horse', n: 4000 }, { id: 'silla_crossbow', n: 2000 }, { id: 'silla_hwarang', n: 1000 }, { id: 'silla_levy', n: 7000 }], KS); }
  function tangHost() { return scaleHost([{ id: 'tang_bubyeong', n: 60000 }, { id: 'tang_elite', n: 8000 }, { id: 'tang_cavalry', n: 6000 }, { id: 'tang_archer', n: 10000 }, { id: 'tang_crossbow', n: 8000 }, { id: 'tang_siege', n: 3000 }], KT); }

  // 정해진 역사 속 전투도 일반 전투처럼 군사 회의 창(작전·예비대·지휘관 선택)을 열어 치른다
  function duel(g, A, B, bo, o, cb) {
    var sb = g.sb;
    if (sb && sb.engage) { sb.engage(A, B, bo, { T: { id: 'script', place: o.place, name: o.title, side: B.side, terrain: B.terrain }, bt: { tk: o.tk, gen: o.gen }, tac: null, def: !!o.def, title: o.title }, cb); }
    else cb(SG.battle(A, B, bo));
  }
  function lose(g, units) { // 전투 후 잔여를 군제에 반영: 배치 병종 비율대로 감소
    units.forEach(function (u) { if (g.state.army[u.src] != null) g.state.army[u.src] = Math.max(0, g.state.army[u.src] - (u.lost || 0)); });
    g.renderArmy();
  }
  // 배치 천명 → 병종 구성 (방군 중심)
  function mix(k, bias) {
    var n = k * 1000, b = bias || {};
    var a = [{ id: 'baekje_bangun', n: Math.round(n * (b.bangun || .6)) }, { id: 'baekje_archer', n: Math.round(n * (b.archer || .2)) }, { id: 'baekje_horse', n: Math.round(n * (b.horse || .1)) }, { id: 'baekje_gyebaek', n: Math.round(n * (b.elite || .1)) }];
    return a.filter(function (x) { return x.n > 0; });
  }
  function casualties(g, before, after) { // 전투 결과를 군제 병종에 반영
    before.forEach(function (u, i) { var lost = u.n - after[i].n; if (lost > 0 && g.state.army[u.id] != null) g.state.army[u.id] = Math.max(0, g.state.army[u.id] - lost); });
    g.renderArmy();
  }
  function outcomeOf(r) { // 방어측=a
    if (r.winner === 'a' && r.aEnd / r.aStart > .4) return 'held';
    if (r.bEnd / r.bStart < .88 || r.aEnd / r.aStart > .25) return 'delayed';
    return 'broken';
  }
  var OUT = { held: '요충을 지켜냄', delayed: '크게 지연시킴', broken: '돌파당함' };

  // 병력 보충 단계: 어디서든 이 장면을 거쳐 다음 장면으로 간다
  function toMuster(g, after) { g.setFlags({ after: after, mu_levy: false, mu_garr: false, mu_navy: false, mu_ally: false, mu_drill: false }); g.go('s_muster'); }
  function homeTotal(g) { var a = g.state.army, n = 0; ['baekje_bangun', 'baekje_gyebaek', 'baekje_horse', 'baekje_archer', 'baekje_guard', 'baekje_garrison'].forEach(function (i) { n += a[i] || 0; }); return n; }
  function contGo(g, kind) {
    if (kind === 'alt') g.setFlags({ contWhy: L3('백강구에서 당의 수군이 불길에 휩싸이고, 부흥군은 주류성을 지켜냈습니다. 당은 신라와의 갈등과 고구려 전선을 고려해 웅진 이남의 백제와 휴전합니다.', 'At Baekgang the Tang fleet went up in flames and the restoration army held Juryuseong. Weighing its quarrel with Silla and the Goguryeo front, Tang agrees to a truce with Baekje south of Ungjin.', '白江口で唐の水軍は炎に包まれ、復興軍は周留城を守り抜いた。唐は新羅との対立と高句麗戦線を考え、熊津以南の百済と休戦する。'), contYear: 664 });
    else g.setFlags({ contWhy: L3('요충과 사비의 굳은 수성으로 당은 군량과 사기가 바닥나 철군을 논하게 되었고, 신라는 홀로 사비를 칠 수 없어 군을 물렸습니다.', 'Stubborn defense at the chokepoints and Sabi drained Tang of supplies and morale, and it began to discuss withdrawal; Silla could not take Sabi alone and pulled back.', '要衝と泗沘の固い守りで唐は軍糧と士気が尽き、撤兵を論じ始めた。新羅は単独で泗沘を攻められず軍を退いた。'), contYear: 661 });
    g.go('s_cont');
  }

  function L3(ko, en, ja) { var l = SG.i18n && SG.i18n.lang; return l === 'en' ? en : l === 'ja' ? ja : ko; }
  (function () {
    var I = SG.i18n, tr = [
      ['전국에 징병령을 내린다', 'Issue a nationwide conscription order', '全国に徴兵令を出す'], ['징집병을 모은다(민심이 높을수록 많다). 민심 -6, 군량 -8.', 'Raise levies (more when the people are content). People -6, food -8.', '徴集兵を集める(民心が高いほど多い)。民心-6、軍糧-8。'],
      ['방령군과 산성 수비대를 소집한다', 'Summon the provincial troops and fortress garrisons', '方領軍と山城守備隊を召集する'], ['수비대 3,500명. 군량 -5. 지방 방비가 얇아진다.', '3,500 garrison troops. Food -5. Local defenses thin out.', '守備隊3,500名。軍糧-5。地方の備えが薄くなる。'],
      ['서해안 선장을 모아 수군을 증강한다', 'Gather coastal captains and expand the navy', '西海岸の船長を集めて水軍を増強する'], ['수군 2,000명. 금 -8.', '2,000 sailors. Gold -8.', '水軍2,000名。金-8。'],
      ['고구려에 사신을 보내 기병 원군을 청한다', 'Send envoys to Goguryeo to ask for cavalry', '高句麗に使者を送り騎兵の援軍を求める'], ['관계가 좋을수록 응한다. 금 -6.', 'The warmer our ties, the likelier they answer. Gold -6.', '関係が良いほど応じる。金-6。'],
      ['군을 급히 조련하고 사기를 북돋는다', 'Drill the army hard and raise morale', '軍を急ぎ調練し士気を高める'], ['훈련 +6, 사기 +4. 군량 -4.', 'Training +6, morale +4. Food -4.', '訓練+6、士気+4。軍糧-4。'],
      ['준비를 마치고 나아간다', 'Preparations done — advance', '準備を終えて進む'],
      ['병력을 보충해 다시 맞선다', 'Reinforce and face them again', '兵を補充して再び迎え撃つ'], ['징병·소집으로 전열을 가다듬는다.', 'Rebuild the ranks by conscription and summons.', '徴兵・召集で戦列を立て直す。'],
      ['웅진성으로 물러나 항전한다', 'Fall back to Ungjin and keep resisting', '熊津城へ退いて抗戦する'], ['사비는 비우고 방령군과 합친다.', 'Abandon Sabi and join the provincial troops.', '泗沘を捨て、方領軍と合流する。'],
      ['북쪽 임존성으로 빠져나가 부흥을 꾀한다', 'Slip out to Imjonseong in the north and plan a restoration', '北の任存城へ抜け出し復興を図る'], ['[가상] 왕이 직접 부흥군의 구심이 된다.', '[Hypothetical] The king himself becomes the rallying point.', '[仮想] 王自らが復興軍の求心点となる。'],
      ['백성을 살리기 위해 항복한다', 'Surrender to spare the people', '民を救うため降伏する'], ['백제는 여기서 끝난다.', 'Baekje ends here.', '百済はここで終わる。']
    ];
    tr.forEach(function (x) { var d = I && I.dict; if (d && d.en) { d.en[x[0]] = x[1]; d.ja[x[0]] = x[2]; } var T6 = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} }; T6.en[x[0]] = x[1]; T6.ja[x[0]] = x[2]; });
  })();

  var S = {};

  S.s0 = {
    era: '641 ~ 655  ·  프롤로그', title: '해동증자(海東曾子), 의자왕', focus: [126.9, 36.3, 900],
    terr: 'y660',
    text: [
      '당신은 <b>백제 31대 왕 의자(義慈)</b>입니다. 무왕의 맏아들로 즉위(641)한 뒤 효성과 우애로 \'해동증자\'라 불렸고, 642년에는 신라 서쪽 40여 성을 빼앗고 대야성(합천)을 함락시켰습니다. 고구려와 손잡고 655년에도 신라의 30여 성을 공격했습니다.',
      '그러나 신라는 당에 구원을 청했고, 당 고종은 고구려를 칠 때 신라를 지렛대로 삼으려 합니다. 백제는 지금 <b>사료상 가장 강성했던 시기</b>와 <b>가장 위험한 시기</b>의 문턱에 서 있습니다.',
      '지도의 지명을 눌러 보면 현재 위치와 근거가 나옵니다. 병력·군량·금·민심·사기는 선택에 따라 오르내립니다. 각 선택지의 <b>[역사]</b> 표시는 실제로 일어난 쪽입니다.'
    ],
    note: '이 게임의 수치(병력 구성, 능력치, 보정값)는 사료에 근거해 추정·추상화한 값입니다. 사료에 없는 갈래는 장면에 "가상"이라고 표시합니다.',
    choices: [{ label: '즉위 후 15년 — 656년 봄으로', tag: '▶', next: 's656' }]
  };

  S.s656 = {
    era: '656년 3월 (의자왕 16년)', title: '좌평 성충의 극간', focus: [126.91, 36.28, 700],
    setup: function (g) { g.map.ping(126.9136, 36.281); },
    text: [
      '왕이 궁녀들과 주색에 빠져 술을 그치지 않자, 좌평 <b>성충</b>이 목숨을 걸고 간언합니다. 신하들은 아무도 감히 입을 열지 못하는 때입니다.',
      '<div class="quote">성충의 간언에 대한 왕의 반응이 곧 사비 조정의 분위기를 정합니다.</div>'
    ],
    note: '사료(백제본기)상 왕은 노해 성충을 옥에 가뒀고, 성충은 옥중에서 숨졌습니다. 죽기 전 올린 상소의 요지: "반드시 전쟁이 있을 것이니, 육로로는 침현(탄현)을, 수군은 기벌포를 넘지 못하게 하라." "단식으로 죽었다"는 서술은 사료에 없습니다.',
    src: SRC_B,
    choices: [
      { tag: '역사', label: '노하여 성충을 옥에 가둔다', hint: '조정은 입을 닫는다. 성충은 옥중에서 숨지며 상소를 남긴다.', fx: { people: -3, morale: +2 }, flags: { seong: 'died' }, result: '성충은 옥에서 숨졌습니다. 그가 남긴 마지막 상소 — 육로는 탄현, 바다는 기벌포 — 는 아무도 읽지 않은 채 궁중에 묻힙니다.', next: 's657' },
      { label: '간언을 받아들여 향락을 줄이고, 성충에게 변경 방비를 맡긴다', hint: '[가상] 금 소모, 민심 회복. 요충 방비 구상이 살아남는다.', fx: { gold: -8, people: +6, morale: -2 }, flags: { seong: 'alive' }, result: '성충은 두 요충(탄현·기벌포)의 방어 계획을 왕에게 직접 올립니다. 궁의 잔치는 줄었고, 귀족들은 수군거립니다.', next: 's657' }
    ]
  };

  S.s657 = {
    era: '657년 1월 (의자왕 17년)', title: '서자 41명에게 좌평을', focus: [126.91, 36.28, 900],
    text: [
      '왕은 서자(庶子) 41명을 모두 좌평에 임명하고 식읍을 내리려 합니다. 한편 유배 중인 <b>흥수</b>는 군사에 밝았으나 왕의 눈 밖에 나 있습니다.'
    ],
    note: '서자 41명 임명과 식읍 지급은 백제본기 17년 기사(역사). 흥수가 유배된 사유와 시기는 사료에 명확치 않으며, 660년 어전회의 때 고마미지현(전남 장흥 일대로 비정)에 있었다고만 전합니다. 흥수를 미리 불러오는 선택은 가상입니다.',
    src: '삼국사기 백제본기 의자왕 17·20년',
    choices: [
      { tag: '역사', label: '서자 41명을 좌평으로 삼고 식읍을 내린다', hint: '왕실 결속·재정 부담.', fx: { gold: -6, people: -2 }, flags: { court: 'bloated' }, next: 's659' },
      { label: '서자 임명은 줄이고, 흥수를 유배에서 불러 군사 자문으로 삼는다', hint: '[가상] 군사 자문 확보, 일부 귀족 불만.', fx: { gold: -2, morale: +3 }, flags: { heungsu: 'recalled' }, next: 's659' }
    ]
  };

  S.s659 = {
    era: '659년', title: '불길한 징조, 변경의 칼', focus: [127.3, 36.2, 1300],
    setup: function (g) { g.map.drawRoute('b659', ['sabi', [127.35, 36.0]], 'baekje', { ms: 1000 }); },
    text: [
      '이 해 백제는 신라의 독산·동잠 두 성을 공격합니다. 사관은 흰 여우가 상좌평의 책상에 앉았다는 따위의 괴이한 일들을 연이어 적어 두었습니다 — <b>멸망을 암시하는 후대의 복선 서술</b>입니다.',
      '밖으로는 당이 고구려 원정에 신라를 끌어들이려 하고, 신라 김춘추는 이미 당에 군사를 청한 상태입니다. 변경 방비를 어떻게 하시겠습니까?'
    ],
    note: '659년 4월 독산·동잠 공격은 백제본기 19년(역사). 흰 여우 등 재이(災異) 기사는 사관이 멸망의 징조로 배치한 서술로, 사실 기록이 아닙니다.',
    src: '삼국사기 백제본기 의자왕 19년',
    choices: [
      { tag: '역사', label: '변경 공세를 이어간다', hint: '사기 상승, 군량 소모.', fx: { morale: +4, food: -6 }, flags: { prep: 0 }, next: 's660' },
      { label: '산성을 보수하고 요충에 척후를 세운다', hint: '[가상] 방어 보정, 군량 소모.', fx: { food: -5, gold: -4 }, flags: { prep: 1 }, army: { baekje_scout: 500 }, next: 's660' }
    ]
  };

  S.s660 = {
    era: '660년 6월', title: '덕물도에 선 당의 대함대', focus: [126.0, 36.9, 2200],
    terr: 'y660',
    setup: function (g) {
      var m = g.map;
      m.setToken('tang', 'tang', '당 소정방', '13만', P('laizhou').lon, P('laizhou').lat);
      var RT = (SG.data.routes || {}).tang_navy_660, tp = RT ? RT.pts : ['laizhou', 'deokmuldo', 'gibeolpo'];
      m.drawRoute('rtang', tp, 'tang', { sea: true, ms: 2200 });
      m.moveToken('tang', tp.slice(0, tp.indexOf('deokmuldo') + 1 || 2), 2200);
      m.setToken('silla', 'silla', '신라 김유신', '5만', P('seorabeol').lon, P('seorabeol').lat);
      m.drawRoute('rsilla', ['seorabeol', 'sangju', 'tanhyeon', 'hwangsanbeol'], 'silla', { ms: 2200 });
      m.moveToken('silla', ['seorabeol', 'sangju'], 2200);
    },
    text: [
      '당 고종은 <b>소정방</b>을 신구도행군대총관으로 삼아 수륙 <b>13만</b>을 내었고, 신라 태자 법민은 병선 100척으로 <b>덕물도</b>에서 이들을 맞았습니다. 소정방은 <b>7월 10일에 백제 남쪽에서 합류</b>하자고 약속했습니다. 신라 정병 <b>5만</b>은 김유신·품일·흠순이 이끌고 경주를 떠났습니다.',
      '사비에는 두 갈래 급보가 도착합니다. 바다로는 당의 대함대가, 육로로는 신라군이 — 협공입니다. 어전회의가 소집됩니다.'
    ],
    note: '13만·5만은 삼국사기가 전하는 수치로, 과장 가능성이 거론됩니다. 두 군이 7월 10일에 합류하기로 한 약속은 신라본기·김유신전에 나옵니다.',
    src: SRC_S,
    choices: [{ label: '어전회의를 연다', tag: '▶', next: 's660council' }]
  };

  S.s660council = {
    era: '660년 6월 말', title: '어전회의 — 막을 것인가, 칠 것인가', focus: [126.91, 36.28, 800],
    text: function (g) {
      var t = [
        '왕이 신하들에게 묻습니다. 의견은 셋으로 갈립니다.',
        '<b>좌평 의직</b> — "당군은 멀리 바다를 건너와 배 멀미에 지쳐 있고 아직 상륙 직후라 군기가 흐트러져 있다. <b>당군부터 먼저 쳐야</b> 한다."',
        '<b>달솔 상영 등</b> — "당군은 속전속결이 목적이라 예봉을 당할 수 없다. 신라는 여러 번 우리에게 패해 우리 군을 보면 겁을 낸다. <b>당군은 길을 막아 지치게 하고, 먼저 신라를 격파한 뒤 합치자</b>."'
      ];
      if (g.f('heungsu') === 'recalled') t.push('<b>흥수</b>(조정에 불려 와 있음) — "백강(기벌포)과 탄현은 나라의 목구멍입니다. 용사를 보내 지키고, 왕께서는 사비를 여러 겹으로 굳게 하여 적의 군량과 사기가 다하기를 기다려 치십시오."');
      else t.push('유배 중인 <b>좌평 흥수</b>에게 사람을 보내 의견을 묻자 답이 옵니다 — "백강(기벌포)과 탄현은 나라의 목구멍입니다. 용사를 보내 지키고, 왕께서는 사비를 여러 겹으로 굳게 하여 적의 군량과 사기가 다하기를 기다려 치십시오." 그러나 대신들은 수군거립니다 — "흥수는 오래 갇혀 임금을 원망하는 자이니 그 말을 쓸 수 없다."');
      if (g.f('seong') === 'alive') t.push('<b>좌평 성충</b> — "신이 올린 대로 육로는 탄현, 바다는 기벌포를 막으면 됩니다. 적이 두 곳을 넘기 전에 서두르십시오."');
      return t;
    },
    note: '의직·상영 논쟁과 흥수 자문은 백제본기 20년 기사. 실제로는 대신들이 흥수의 말을 물리치고 "당군은 강으로 들어오게 해 배를 나란히 못 하게 하고, 신라군은 탄현으로 올라오게 해 말을 나란히 못 하게 한 뒤 치자"는 안을 택했는데, 그 사이 이미 두 곳을 통과했다는 보고가 들어옵니다. 흥수 자문은 성충 상소와 별개 사건입니다.',
    src: SRC_B,
    choices: function (g) {
      var seong = g.f('seong') === 'alive';
      return [
        { tag: '역사', label: '"적이 들어오게 한 뒤 좁은 데서 치자" — 대신들의 안을 따른다', hint: '요충에 병력을 두지 않고 기다린다. (역사에선 이미 통과된 뒤였음)', fx: { morale: -2 }, flags: { plan: 'history' }, next: 's660hist' },
        { label: '의직의 안 — 당군이 상륙하기 전에 해안에서 선제 타격', hint: '[가상] 기벌포에 병력 집중, 당군 사기 저하 이용. 신라 방면은 비게 된다.', fx: { food: -4 }, flags: { plan: 'uijik' }, next: 's660alloc' },
        { label: '상영의 안 — 탄현을 막아 신라를 먼저 꺾고 당과 맞선다', hint: '[가상] 탄현에 병력 집중. 바다는 지연책에 그친다.', flags: { plan: 'sangyeong' }, next: 's660alloc' },
        { label: '흥수의 안 — 탄현과 기벌포를 함께 지키고 지구전', hint: '[가상] 두 요충과 사비 모두 신경 써야 한다.' + (seong ? ' (성충의 계획 지원)' : '') , fx: { food: -3 }, flags: { plan: 'heungsu' }, next: 's660alloc' }
      ];
    }
  };

  // 역사 그대로: 요충이 비어 있는 상태에서 황산벌로
  S.s660hist = {
    era: '660년 7월 초', title: '이미 넘어선 두 길', focus: [127.0, 36.4, 1100],
    setup: function (g) { g.map.markPlace('tanhyeon', 'gone'); g.map.markPlace('gibeolpo', 'gone'); g.state.flags.pass = { tanhyeon: 'broken', gibeolpo: 'broken' }; },
    text: ['회의가 이어지는 사이, 신라군은 <b>탄현을 저항 없이 넘었고</b> 당의 함대는 <b>기벌포</b>에 닿고 있다는 보고가 들어옵니다. 기벌포의 갯벌에서 당군은 버들 자리를 깔고 상륙했다고 전합니다.', '이제 남은 것은 평야에서의 결전입니다. <b>달솔 계백</b>이 결사대 5천을 자청합니다.'],
    note: '신라본기에는 탄현 전투 기사가 없고, 백제본기가 "이미 지났다"고 쓸 뿐입니다. 즉 신라군은 저항 없이 통과한 것으로 읽힙니다.',
    src: '삼국사기 백제본기 의자왕 20년, 신라본기 7년',
    choices: [{ label: '계백에게 결사대 5천을 맡긴다', tag: '▶', next: 's_hwangsan' }]
  };

  // 병력 배치 (가상 갈래)
  S.s660alloc = {
    kind: 'alloc', era: '660년 6월 말', title: '요충 병력 배치', focus: [126.9, 36.5, 1500],
    text: function (g) { return ['왕명이 내려, 야전군을 어디에 배치할지 정해야 합니다. 병력은 한정되어 있습니다. 지형 보정이 큰 곳에 모으면 효율이 오르지만, 한 곳에 몰면 다른 곳이 비게 됩니다.', '슬라이더 위에 마우스를 올리면 해당 지점으로 지도가 이동합니다. <b>탄현</b>은 좁은 길목(신라 5만), <b>기벌포</b>는 갯벌 상륙로(당 상륙군)입니다.']; },
    note: '배치 병력 3만은 5방군·결사대·기병·궁수 가운데 야전에 동원할 수 있는 규모를 추정한 값이며, 사료 수치가 아닙니다.',
    alloc: {
      title: '야전군 배치', sub: '요충별 배치 (천 명)',
      pool: function (g) { return Math.max(10, Math.min(70, Math.round(Math.max(g.sb.fieldTotal(), g.sb.armyTotal() * 0.95) / 1000))); },
      stations: [
        { id: 'tanhyeon', name: '탄현', place: 'tanhyeon', desc: '신라군 5만이 오는 좁은 길목 (지형 ×1.9, 적은 일부만 교전). 전 병력을 보낼 수도 있다', max: 99, def: 0 },
        { id: 'navy', name: '수군 요격 (서해 어귀)', place: 'gibeolpo', desc: '상륙 전 당 함대를 바다에서 맞받는다. 이기면 상륙군이 약해진다 (수군 ×1.25)', max: 99, def: 0 },
        { id: 'gibeolpo', name: '기벌포·백강', place: 'gibeolpo', desc: '당 상륙군 (갯벌 ×1.7, 상륙 폭 제한)', max: 99, def: 0 },
        { id: 'sabi', name: '사비 본성', place: 'sabi', desc: '예비·성 방어 (최후의 보루)', max: 99, def: 0 }
      ],
      feedback: function (g, a, left) {
        var t = '탄현 ' + a.tanhyeon + '천 · 기벌포 ' + a.gibeolpo + '천 · 수군 ' + a.navy + '천 · 사비 ' + a.sabi + '천 (미배치 ' + left + '천).';
        t += '<br><small>신라군 5만, 당 상륙군 약 9만이 접근합니다. 병력이 적어도 한 곳을 확실히 막아 시간을 버는 것이 목적일 수 있습니다.</small>';
        return t;
      },
      resolve: function (g, a) {
        var dm = 1 + g.sb.s.realm.defense / 400, mm = Math.min(95, g.sb.myMorale(20)); var plan = g.f('plan'), prep = g.f('prep') ? 1.1 : 1, seong = g.f('seong') === 'alive' ? 1.1 : 1;
        var tMod = (plan === 'sangyeong' || plan === 'heungsu') ? 1.25 : 1, bMod = (plan === 'uijik' || plan === 'heungsu') ? 1.15 : 1;
        var res = {}, logs = [];
        var tIn = mix(a.tanhyeon, { bangun: .55, archer: .25, horse: .05, elite: .15 }), tBefore = tIn.map(function (u) { return { id: u.id, n: u.n }; });
        var gIn = mix(a.gibeolpo, { bangun: .55, archer: .3, horse: .05, elite: .1 }), gBefore = gIn.map(function (u) { return { id: u.id, n: u.n }; });
        var steps = [];
        if (a.tanhyeon <= 0) res.tanhyeon = 'broken';
        if (a.gibeolpo <= 0) res.gibeolpo = 'broken';
        g.state.flags.pass = res; g.state.flags.allocSabi = a.sabi;
        var nIn = a.navy > 0 ? [{ id: 'baekje_navy', n: a.navy * 1000 }] : null, tangScale = 1, tangMor = plan === 'uijik' ? 52 : 68;
        function fightN(done) {
          var nTitle = '서해 해전 (가상)';
          duel(g, force('백제 수군', 'baekje', nIn, 'uija', 1.1 * prep * seong * dm, mm, { ambush: plan === 'uijik' }), force('당 함대', 'tang', scaleHost([{ id: 'tang_navy', n: 14000 }, { id: 'tang_archer', n: 3000 }], KT), 'sojeongbang', 1, 70, { cap: cp(20000) }), { rounds: 6 }, { title: nTitle, tk: 'sea', gen: 'uija', def: true, place: 'gibeolpo' }, function (rn) {
            var o = outcomeOf(rn); tangScale = o === 'held' ? 0.55 : o === 'delayed' ? 0.8 : 1; tangMor = o === 'held' ? tangMor - 10 : o === 'delayed' ? tangMor - 4 : tangMor;
            if (o === 'held') g.state.flags.seaWin = true;
            g.battleUI(rn, nTitle, '서해 — ' + (o === 'held' ? '당 함대를 격파해 상륙군이 크게 줄었습니다' : o === 'delayed' ? '당 함대에 타격을 주어 상륙이 지연됩니다' : '수군이 패해 당군이 그대로 상륙합니다'), function () { g.map.markPlace('gibeolpo', 'hot'); done(); });
          });
        }
        function fightT(done) {
          var tTitle = '탄현 전투 (가상)';
          duel(g, force('탄현 방어군', 'baekje', tIn, 'heungsu', 1.9 * prep * seong * tMod * dm, mm, { ambush: plan === 'sangyeong' || plan === 'heungsu' }), force('신라군', 'silla', sillaHost(), 'gim_yusin', 1, 72, { cap: cp(20000) }), { rounds: 6 }, { title: tTitle, tk: 'pass', gen: 'heungsu', def: true, place: 'tanhyeon' }, function (rt) {
            res.tanhyeon = outcomeOf(rt);
            g.battleUI(rt, tTitle, '탄현 — ' + OUT[res.tanhyeon], function () { casualties(g, tBefore, rt.aLeft); g.map.markPlace('tanhyeon', 'hot'); done(); });
          });
        }
        function fightG(done) {
          var gTitle = '기벌포 전투 (가상)';
          duel(g, force('기벌포 방어군', 'baekje', gIn, 'uija', 1.7 * prep * seong * bMod * dm, mm, { ambush: plan === 'uijik' }), force('당 상륙군', 'tang', scaleHost(tangHost(), tangScale), 'sojeongbang', 1, tangMor, { cap: cp(30000) }), { rounds: 6 }, { title: gTitle, tk: 'coast', gen: 'uija', def: true, place: 'gibeolpo' }, function (rg) {
            res.gibeolpo = outcomeOf(rg);
            g.battleUI(rg, gTitle, '기벌포 — ' + OUT[res.gibeolpo], function () { casualties(g, gBefore, rg.aLeft); g.map.markPlace('gibeolpo', 'hot'); done(); });
          });
        }
        function finish() { if (res.gibeolpo === 'broken' && g.f('seaWin') && a.navy > 0) res.gibeolpo = 'delayed'; toMuster(g, res.tanhyeon === 'broken' && res.gibeolpo === 'broken' ? 's_hwangsan' : (res.tanhyeon !== 'broken' && res.gibeolpo !== 'broken') ? 's_stall' : 's_split'); }
        // 전투 창이 화면에 뜨므로 우선 장면 이동을 막는다
        var nop = function (d) { d(); }; g.state.flags.seaWin = false;
        setTimeout(function () { (a.tanhyeon > 0 ? fightT : nop)(function () { (a.navy > 0 ? fightN : nop)(function () { (a.gibeolpo > 0 ? fightG : nop)(finish); }); }); }, 0);
        return '__none__';
      }
    }
  };

  // 한쪽만 막은 경우
  S.s_split = {
    era: '660년 7월 9일 무렵', title: '한쪽 길만 막혔다', focus: [127.0, 36.4, 1100],
    setup: function (g) { g.map.drawRoute('gh', ['tanhyeon', 'hwangsanbeol', 'sabi'], 'silla', { ms: 1200 }); },
    text: function (g) {
      var p = g.f('pass'), t = [];
      if (p.tanhyeon === 'broken') t.push('탄현이 뚫렸습니다. 신라군이 황산벌로 몰려옵니다. 한편 당 함대는 기벌포 앞에서 <b>발이 묶였습니다</b>. 두 군의 7월 10일 합류 약속은 흔들립니다.');
      else t.push('탄현에서 신라군이 막혔습니다. 그러나 당군이 기벌포를 넘어 <b>사비로 직행</b>합니다. 신라군이 오기 전에 당군만으로 도성을 칠 수 있는지가 관건입니다.');
      t.push('남은 병력을 하나로 모아 승부를 거는 수밖에 없습니다.');
      return t;
    },
    choices: function (g) { return [{ label: '계백의 결사대를 이끌고 맞선다', tag: '▶', next: g.f('pass').tanhyeon === 'broken' ? 's_hwangsan' : 's_sabi_tang' }]; }
  };

  S.s_stall = {
    era: '660년 7월 10일', title: '합류가 어긋났다', focus: [126.9, 36.4, 1400],
    text: ['탄현과 기벌포가 <b>동시에 지연</b>되었습니다. 7월 10일 합류를 약속했던 당과 신라는 서로 상대를 탓하기 시작합니다.', '실제 역사에서도 신라군이 기일에 이르지 못하자 소정방은 신라 독군 김문영을 군문에서 참하려 했고, 김유신이 격분해 "먼저 당군과 결전한 뒤 백제를 깨겠다"고 맞서는 일이 있었습니다. 이 균열을 이용할 수 있을까요?'],
    note: '7/10 갈등 사건은 신라본기 7년·김유신전 기사입니다. 처형하려 한 주체는 소정방, 대상은 김문영이며 김유신은 이에 항의했습니다(v0.1의 서술을 정정).',
    src: SRC_S,
    choices: [
      { label: '사자를 보내 양군의 불화를 부추기고, 소정방에게 철군 교섭을 건다', hint: '[가상] 금 12 소모. 두 요충에서 이미 지친 소정방이 주저할 때 먹힐 수 있다.', fx: { gold: -12 }, flags: { wedge: true }, result: '소정방은 군량선과 신라와의 약속, 두 요충에서 입은 손실을 계산하며 결국 철군 교섭을 받아들입니다. 실제 역사에서도 7월 12일 사비 포위 때 소정방이 망설였고, 김유신이 설득해야 했습니다.', next: '__cont_stall__' },
      { label: '지연을 이용해 군을 집결, 사비를 굳게 지킨다', hint: '병력 보존.', fx: { food: -3, morale: +4 }, next: 's_sabi_tang' }
    ]
  };

  S.s_hwangsan = {
    era: '660년 7월 9일', title: '황산벌 — 계백의 결사대', focus: [127.1, 36.2, 700],
    terr: 'y660',
    setup: function (g) { g.map.ping(127.1, 36.2); g.map.setToken('silla', 'silla', '신라군', '5만', 127.1, 36.05); g.map.setToken('gyebaek', 'baekje', '계백 결사대', '5천', 127.12, 36.2); },
    text: [
      '<b>달솔 계백</b>은 결사 5천을 이끌고 황산벌에 세 곳의 진영을 쌓았습니다. 계백은 출전 전 처자를 먼저 죽였다는 일화가 열전에 전하지만, 이는 <b>열전에만 있는</b> 서술입니다. 그는 월(越)의 구천이 5천으로 오(吳)의 70만을 깨뜨린 고사를 들어 병사들을 독려했다고 합니다.',
      '신라 5만 앞에서, 어떻게 싸우겠습니까?'
    ],
    note: '계백 5천 vs 신라 5만은 사료 명시치. 계백의 관직은 열전상 달솔(v0.1의 "좌평"은 오류). 계백이 4번 싸워 모두 이겼다고 쓰는 쪽은 백제본기, 신라본기는 "4전 모두 불리했고 사졸의 힘이 다했다"고 씁니다 — 같은 사실의 양면입니다.',
    src: '삼국사기 신라본기 7년, 백제본기, 열전 계백',
    choices: [
      { tag: '역사', label: '3영(三營)을 세워 4번 맞서 싸운다', hint: '결사대의 사기는 최고. 4합 후 전황 확인.', next: '__hwangsan_battle__', flags: { hw: 'fight' } },
      { label: '험지에 진을 치고 기습으로 신라 선봉을 친다', hint: '[가상] 첫 합에 기습 보정, 이후 소모전.', next: '__hwangsan_battle__', flags: { hw: 'ambush' } }
    ]
  };

  S.s_gwanchang = {
    era: '660년 7월 9일', title: '반굴과 관창', focus: [127.1, 36.2, 600],
    text: function (g) {
      var r = g.f('hw1');
      return ['네 번의 접전. ' + (r.aEnd > r.aStart * .55 ? '결사대는 아직 버티고 있습니다.' : '결사대의 수는 크게 줄었으나 아직 서 있습니다.') + ' 신라 진영에서 <b>김흠순의 아들 반굴</b>이 단기로 돌진해 전사하고, 이어 <b>김품일의 16세 아들 관창</b>이 홀로 말을 달려 옵니다.',
        '관창은 사로잡혀 계백 앞에 끌려옵니다. 투구를 벗기니 나이 어린 소년입니다.'];
    },
    note: '반굴 → 관창 순서는 신라본기 기준(열전 관창전은 관창만 서술). 관창은 한 번 풀려났다 다시 돌격해 참수되었고, 신라군은 이에 분기해 총공격했습니다.',
    src: '삼국사기 신라본기 7년, 열전 관창',
    choices: [
      { tag: '역사', label: '"홀로 온 어린 장수가 용감하다" — 살려 보낸다', hint: '관창은 다시 돌격해 죽고, 신라 삼군이 분기한다.', flags: { gwan: 'spared' }, next: '__hwangsan_final__' },
      { label: '그 자리에서 목을 베어 신라 진영으로 돌려보낸다', hint: '[가상] 신라는 분기하나 원한이 깊어진다. 결과는 같으나 신라 사기는 더 오른다.', flags: { gwan: 'killed' }, next: '__hwangsan_final__' }
    ]
  };

  // 7/12 사비 포위 (당군만 / 연합)
  S.s_sabi_tang = {
    era: '660년 7월 12일', title: '사비성 앞의 당군', focus: [126.91, 36.28, 700],
    setup: function (g) { g.map.drawRoute('rsabi', ['gibeolpo', 'sabi'], 'tang', { ms: 1200 }); },
    text: ['당군이 사비 외곽에 이르렀습니다. 소정방은 신라군이 오기 전에 성을 칠지 망설입니다.', '성 안에는 왕궁 호위와 산성 수비대, 남은 야전군이 있습니다.'],
    choices: function (g) {
      var p = g.f('pass') || {}, noSilla = g.f('hwwin') || p.tanhyeon === 'held' || p.tanhyeon === 'delayed';
      var c = [
        { label: '성을 굳게 지키며 때를 기다린다', next: 's_siege' },
        { label: '지금 성 밖에서 당군을 선제 공격한다', hint: '[가상] 남은 병력으로 야전을 건다.', next: '__tang_field__' }
      ];
      if (noSilla && !g.f('wedge')) c.unshift({ label: '신라군이 오지 않는 지금, 소정방에게 사자와 금을 보내 철군을 교섭한다', hint: '[가상] 금 12 소모. 신라와의 약속이 어긋난 당군이 망설일 수 있다.', fx: { gold: -12 }, flags: { wedge: true }, result: '신라군 없이 홀로 도성을 치는 일이 소정방에게도 부담입니다. 군량과 사기를 계산한 소정방은 교섭에 응합니다.', next: '__cont_stall__' });
      return c;
    }
  };

  S.s_siege = {
    era: '660년 7월 12~13일', title: '사비성 — 포위', focus: [126.91, 36.28, 600],
    setup: function (g) {
      g.map.setToken('tang', 'tang', '당 소정방', '', 126.8, 36.2); g.map.setToken('silla', 'silla', '신라군', '', 127.0, 36.25);
      g.map.ping(126.91, 36.28);
    },
    text: ['7월 12일, 당·신라 연합군이 사비를 포위하고 소부리 벌을 진군합니다. 상좌평이 음식을 바쳐 화친을 구했으나 거절당했고, 서자 궁과 좌평 여섯 명이 사죄를 청했지만 역시 받아들여지지 않았습니다.', '이제 선택의 시간입니다.'],
    note: '7/12 포위와 화친 거절은 신라본기 기사. 이후의 항복 경로는 사료마다 다릅니다 — 신라본기: 7/13 왕이 야간에 웅진성으로 탈출, 7/18 웅진에서 항복. 백제본기: 둘째 아들 태가 스스로 왕을 칭해 성을 지키다 태자의 아들 문사가 일부를 이끌고 성을 나가 항복, 태도 문을 열고 항복.',
    src: SRC_S + ', 백제본기 의자왕 20년',
    choices: [
      { tag: '역사', label: '한밤중 태자와 함께 웅진성으로 몸을 피한다', hint: '사비를 맡은 태(泰)는 자립해 왕을 칭하고, 문사가 이탈한다.', fx: { people: -10, morale: -8 }, flags: { flee: true }, next: 's_ungjin' },
      { label: '사비에서 끝까지 왕이 직접 성을 지킨다', hint: '[가상] 왕궁 호위·수비대와 함께 항전.', next: '__sabi_defense__' },
      { label: '항복을 청해 백성을 살린다', hint: '[가상] 일찍 항복하면 희생은 줄지만 백제는 끝난다.', fx: { people: +4 }, flags: { surrender: 'early' }, next: 's_end_fall' }
    ]
  };

  S.s_ungjin = {
    era: '660년 7월 13~18일', title: '웅진성 — 마지막 선택', focus: [127.12, 36.46, 600],
    setup: function (g) { g.map.ping(127.1244, 36.4648); },
    text: ['왕은 웅진성에 들어왔습니다. 사비에서는 태가 자립해 왕을 칭했으나, 태자의 아들 문사가 "숙부가 멋대로 왕이 되었으니 당군이 포위를 풀면 우리는 어찌 안전하겠는가"라며 일부를 이끌고 성을 나가자 백성이 따라 나섭니다. 소정방이 성가퀴에 당의 깃발을 꽂자 태도 문을 열었습니다.',
      '웅진성의 방령군과 군사가 아직 곁에 있습니다. 7월 18일 — 결단의 날입니다.'],
    note: '의자왕은 7월 18일 태자·웅진방령군 등을 이끌고 웅진성에서 나와 항복했습니다(신라본기). 8월 2일 승전 연회에서 왕과 융에게 술을 따르게 했고, 9월 3일 소정방은 왕과 대신·백성 등을 당으로 압송했습니다. 압송 인원은 사료마다 다릅니다(88명·12,807명 / 93인·1만 2천 / 93인·2만).',
    src: '삼국사기 신라본기 7년, 백제본기 의자왕 20년',
    choices: [
      { tag: '역사', label: '웅진성을 나와 항복한다', hint: '왕은 당으로 압송된다. 이후 부흥운동은 복신·도침이 이끈다.', fx: { morale: -10 }, flags: { surrender: 'history' }, next: 's_end_fall' },
      { label: '웅진성 성문을 닫고 방령군과 함께 당군을 맞아 싸운다', hint: '[가상] 군사 회의를 열어 작전을 정하고 농성전을 치른다. 이기면 부흥의 길이 열린다.', fx: { morale: -4 }, next: '__ungjin_defense__' },
      { label: '밤을 틈타 북쪽 임존성으로 빠져나가 항전을 이어간다', hint: '[가상] 왕이 직접 부흥운동의 구심이 된다.', fx: { people: +3, food: -5, morale: -4 }, flags: { surrender: 'no' }, next: 's661' }
    ]
  };

  // 부흥운동 (가상 갈래: 왕이 임존성으로)
  S.s661 = {
    era: '660년 8월 ~ 661년', title: '임존성의 깃발', focus: [126.8, 36.5, 1200],
    setup: function (g) {
      var m = g.map; m.clearTokens(); m.clearRoutes(); m.setTerritory('y661');
      m.markPlace('juryuseong', 'hot'); m.markPlace('imjonseong', 'hot');
    },
    text: ['임존성에 이르자 백제 사람들이 모여듭니다. 무왕의 조카뻘 <b>복신</b>과 승려 <b>도침</b>은 주류성에서, <b>흑치상지</b>는 열흘 만에 3만을 모아 200여 성을 회복했다고 전합니다. 왜에는 왕자 <b>부여풍</b>이 있습니다.',
      '실제 역사에서는 의자왕이 당에 압송되었으므로, 왕이 직접 결속을 맡는 이 갈래는 <b>가상</b>입니다. 누구를 구심으로 세우겠습니까?'],
    note: '복신은 "상잠장군", 도침은 승려이자 "영군장군" — 둘 다 군사 직함입니다(v0.1의 "도침=행정" 설정은 가상). 흑치상지는 별도로 임존성 일대에서 3만을 모았고 뒤에 당에 투항했습니다.',
    src: '삼국사기 백제본기 의자왕 20년, 열전',
    choices: [
      { tag: '역사', label: '왜에 있는 왕자 풍을 맞아 왕으로 추대한다', hint: '복신·도침이 주류성에서 유인원을 포위. 왜의 원군 요청.', fx: { morale: +6, people: +4 }, flags: { pung: true }, next: 's662' },
      { label: '왕이 직접 군을 이끌고 복신·도침과 연합한다', hint: '[가상] 구심은 분명하나 풍의 왜 원군은 얻기 어렵다.', fx: { morale: +10, people: +6 }, flags: { pung: false }, next: 's662' }
    ]
  };

  S.s662 = {
    era: '662 ~ 663년 6월', title: '복신·도침·풍의 갈등', focus: [126.7, 36.2, 1000],
    text: ['복신이 도침을 죽이고 군을 합쳤고, 풍은 제사만 주관하는 허수아비 처지가 됩니다. 이윽고 복신이 병을 핑계로 풍을 제거하려 하자 풍이 먼저 복신을 죽입니다. 부흥군은 안에서 무너지고 있습니다.',
      '당은 유인궤를 앞세워 반격하고, 손인사의 증원군(치·청·내·해주 병 7천)이 옵니다. 지금 갈등을 어떻게 봉합하겠습니까?'],
    note: '복신의 도침 살해, 풍의 복신 살해는 백제본기 서술(연대는 일본서기와 차이가 있어 대조 중). 손인사 병력은 백제본기 7천 ↔ 신라본기 "40만"으로 불일치하며 40만은 과장·오기로 봅니다.',
    src: '삼국사기 백제본기 의자왕 20년, 신라본기 문무왕 3년',
    choices: [
      { tag: '역사', label: '내분을 방치한 채 왜의 원군에 기대를 건다', hint: '부흥군 약화. 왜 원군 규모에 운명을 건다.', fx: { morale: -8, people: -4 }, flags: { unity: false }, next: 's663' },
      { label: '왕의 권위로 복신과 풍을 화해시키고 지휘를 일원화한다', hint: '[가상] 금·군량 소모, 결속 확보.', fx: { gold: -8, food: -4, morale: +8 }, flags: { unity: true }, next: 's663' }
    ]
  };

  S.s663 = {
    era: '663년 8월', title: '백강 — 마지막 바다', focus: [126.63, 36.0, 800],
    setup: function (g) {
      var m = g.map; var W = (SG.data.routes || {}).wa_fleet_663; m.setToken('wa', 'wa', '왜 원군', '', 126.2, 35.7); m.setToken('tang', 'tang', '유인궤 수군', '', 126.7, 36.1); if (W) m.drawRoute('rwa', W.pts, 'wa', { sea: true, ms: 2000 }); m.drawRoute('rbg', ['ungjin', 'baekgang'], 'tang', { ms: 1400 });
    },
    text: ['왜가 3장군 편성으로 원군을 보냈습니다. 당은 유인궤·두상·부여융의 수군과 군량선을 이끌고 웅진강에서 <b>백강구</b>로 나아가 육군과 함께 주류성을 향합니다.',
      '배 수, 진형, 순서 — 모든 것이 이 한 번의 전투에 달렸습니다. 어떻게 싸우겠습니까?'],
    note: '백제본기는 "백강구에서 4번 싸워 모두 이기고 왜선 400척을 불태웠다. 바닷물이 붉어졌다"고 씁니다. 일본서기는 8/27 선봉 패퇴, 8/28 돌격·대패로 서술하며 일자·규모 서술이 다릅니다(대조 중). 이 전투 직후 주류성이 항복하고 풍은 도주했습니다.',
    src: '삼국사기 백제본기 의자왕 20년, 일본서기 천지기(대조 중)',
    choices: [
      { tag: '역사', label: '왜 수군과 합세해 정면 돌격한다', hint: '이전 서술의 전개대로 승패가 갈린다.', flags: { bg: 'frontal' }, next: '__baekgang__' },
      { label: '좁은 백강구에서 당 수군을 유인해 화공으로 맞선다', hint: '[가상] 연합 결속·지휘 일원화가 있어야 의미가 있다.', flags: { bg: 'fire' }, next: '__baekgang__' },
      { label: '전투를 피하고 주류성에서 지구전을 택한다', hint: '[가상] 군량이 관건.', flags: { bg: 'siege' }, next: '__baekgang__' }
    ]
  };

  S.s_muster = {
    era: '660년 7월', title: '병력 보충과 군령', focus: [126.9, 36.4, 1300],
    text: function (g) { var n = homeTotal(g), nv = g.state.army.baekje_navy || 0; return [L3('지금 사비 일대에서 움직일 수 있는 병력은 약 <b>' + n.toLocaleString() + '명</b>, 수군은 <b>' + nv.toLocaleString() + '명</b>입니다. 싸우기 전에, 혹은 싸운 뒤에 병력을 보충하고 군을 정비할 수 있습니다.', 'About <b>' + n.toLocaleString() + '</b> troops and <b>' + nv.toLocaleString() + '</b> sailors can be moved around Sabi right now. Before or after a fight, you can replenish and reorganize the army.', '今、泗沘一帯で動かせる兵力は約<b>' + n.toLocaleString() + '名</b>、水軍は<b>' + nv.toLocaleString() + '名</b>です。戦いの前後に兵を補充し、軍を立て直せます。'), L3('징병과 소집에는 민심과 군량이 들고, 한 번씩만 쓸 수 있습니다. 준비가 끝나면 다음으로 나아갑니다.', 'Conscription and summons cost public support and food, and each can be used only once. When you are ready, move on.', '徴兵や召集には民心と軍糧がかかり、それぞれ一度だけ使えます。準備ができたら先へ進みます。')]; },
    choices: function (g) {
      var c = [], a = g.state.res, rel = g.sb ? g.sb.s.rel : {};
      if (!g.f('mu_levy')) c.push({ label: '전국에 징병령을 내린다', hint: '징집병을 모은다(민심이 높을수록 많다). 민심 -6, 군량 -8.', next: '__mu_levy__' });
      if (!g.f('mu_garr')) c.push({ label: '방령군과 산성 수비대를 소집한다', hint: '수비대 3,500명. 군량 -5. 지방 방비가 얇아진다.', next: '__mu_garr__' });
      if (!g.f('mu_navy') && a.gold >= 8) c.push({ label: '서해안 선장을 모아 수군을 증강한다', hint: '수군 2,000명. 금 -8.', next: '__mu_navy__' });
      if (!g.f('mu_ally') && a.gold >= 6) c.push({ label: '고구려에 사신을 보내 기병 원군을 청한다', hint: '관계가 좋을수록 응한다. 금 -6.', next: '__mu_ally__' });
      if (!g.f('mu_drill')) c.push({ label: '군을 급히 조련하고 사기를 북돋는다', hint: '훈련 +6, 사기 +4. 군량 -4.', next: '__mu_drill__' });
      c.push({ label: '준비를 마치고 나아간다', tag: '▶', next: g.f('after') || 's_siege' });
      return c;
    }
  };
  S.s_fallback = {
    era: '660년 7월', title: '방어선이 무너지다 — 어찌할 것인가', focus: [126.91, 36.28, 900],
    text: function (g) { var n = homeTotal(g).toLocaleString(), e = Math.round((g.f('eFrac') || 1) * 100); return [L3('싸움에 졌지만 백제가 끝난 것은 아닙니다. 남은 병력은 약 <b>' + n + '명</b>입니다. 당·신라군도 큰 손실을 입어 <b>남은 적은 처음의 ' + e + '%</b>입니다.', 'We lost the fight, but Baekje is not finished. About <b>' + n + '</b> troops remain. The Tang and Silla armies also took heavy losses: <b>' + e + '%</b> of their original strength is left.', '戦いには敗れたが、百済は終わっていない。残る兵力は約<b>' + n + '名</b>。唐・新羅軍も大きく損耗し、<b>敵は当初の' + e + '%</b>が残る。'), L3('병력을 다시 모아 맞설 수도, 웅진으로 물러나 후일을 도모할 수도 있습니다.', 'You can regroup and face them again, or fall back to Ungjin and plan for later.', '兵を再び集めて迎え撃つことも、熊津へ退いて後日を図ることもできる。')]; },
    choices: function (g) {
      var c = [{ label: '병력을 보충해 다시 맞선다', hint: '징병·소집으로 전열을 가다듬는다.', next: '__fb_again__' }];
      if (g.f('where') !== 'ungjin') c.push({ label: '웅진성으로 물러나 항전한다', hint: '사비는 비우고 방령군과 합친다.', next: 's_ungjin' });
      else c.push({ label: '북쪽 임존성으로 빠져나가 부흥을 꾀한다', hint: '[가상] 왕이 직접 부흥군의 구심이 된다.', fx: { people: +2, food: -5, morale: -4 }, flags: { surrender: 'no' }, next: 's661' });
      c.push({ label: '백성을 살리기 위해 항복한다', hint: '백제는 여기서 끝난다.', flags: { surrender: 'late' }, next: 's_end_fall' });
      return c;
    }
  };
  S.s_cont = {
    era: '660년 이후', title: '위기를 넘기다 — 그러나 역사는 계속된다', focus: [126.91, 36.28, 1500],
    text: function (g) { return [g.f('contWhy') || L3('당과 신라는 물러났지만, 고구려 정벌을 벼르는 당은 다시 올 것입니다.', 'Tang and Silla have withdrawn, but Tang, bent on conquering Goguryeo, will come again.', '唐と新羅は退いたが、高句麗征伐を狙う唐はまた来る。'), L3('왕은 살아남았고 나라는 이어집니다. 이제부터는 사료에 없는 길입니다 — 외교와 내정, 군비를 가다듬어 다음 위기를 준비하십시오.', 'The king lives and the realm endures. From here the path is beyond the records — sharpen diplomacy, government and arms for the next crisis.', '王は生き延び、国は続く。ここからは史料にない道――外交・内政・軍備を整え、次の危機に備えよ。')]; },
    choices: [{ label: '정무로 돌아간다', tag: '▶', next: '__continue__' }]
  };

  S.s_end_fall = {
    kind: 'end', era: '660년 이후', title: '백제의 멸망',
    focus: [126.91, 36.28, 1500],
    text: ['사비는 함락되었고 백제는 5부 37군 200성 76만호를 남긴 채 막을 내렸습니다. 당은 웅진 등 5도독부를 두었고, 9월 3일 소정방은 왕과 대신, 백성을 당으로 압송했습니다.',
      '의자왕은 낙양에서 병사했고, 황제는 그를 금자광록대부·위위경으로 추증하여 손호·진숙보의 묘 곁에 장사 지내게 했다고 전합니다. 한편 복신·도침·풍은 주류성에서 부흥의 깃발을 올립니다.'],
    ending: {
      seal: '亡', mine: '당신은 사료 속 왕과 같은 길을 걸었습니다. 요충은 비었고, 사비는 열흘도 안 돼 포위되었습니다.', real: '660.7.18 의자왕 웅진성 항복 → 9.3 당 압송. 663 백강 패전과 주류성 항복, 664 전후 임존성 함락으로 부흥운동도 종결.',
      score: function (g) { return Math.min(100, Math.round(g.state.hist / Math.max(1, g.state.dec) * 100)); }
    }
  };

  // 엔딩 5종 — 백강 결과에서 분기 (s663의 __baekgang__에서 결정)
  S.s_end_hist = {
    kind: 'end', era: '663년 8월 28일 이후', title: '주류성 항복 — 부흥의 끝', focus: [126.63, 36.0, 1200],
    text: ['백강에서 왜선 400척이 불탔고, 바닷물이 붉게 물들었다고 전합니다. 풍은 도주했고 주류성이 항복했습니다. 지수신만이 임존성에서 버티다 처자를 버리고 고구려로 달아났고, 흑치상지와 사타상여가 당에 투항해 임존성이 함락됩니다.'],
    ending: { seal: '終', mine: '당신의 왕조는 백강에서 끝났습니다. 부흥은 이루어지지 않았습니다.', real: '663.8 백강 패전, 9 주류성 항복, 임존성 함락로 부흥운동 종결. 백제 유민은 일본·신라·고구려·당으로 흩어졌습니다.', score: function (g) { return Math.min(100, Math.round(g.state.hist / Math.max(1, g.state.dec) * 100)); } }
  };
  S.s_end_alt = {
    kind: 'end', era: '663년 8월', title: '백강의 승전 — 또 하나의 백제', focus: [126.63, 36.0, 1200],
    text: ['백강구의 좁은 물길에서 당의 수군이 불길에 휩싸이고, 왜와 한 몸이 된 부흥군은 주류성을 지켜냅니다. 당은 신라와의 갈등과 고구려 전선을 고려해 웅진 이남의 부흥 정권과 휴전합니다.', '이것은 <b>사료에 없는 가상의 결말</b>입니다. 그러나 백강 전투 직전의 부흥군이 만약 내분 없이 하나였다면, 이라는 질문은 사학계에서도 자주 던져집니다.'],
    ending: { seal: '存', mine: '백제는 서해안 일대에 작은 나라로 살아남았습니다. 신라·당·왜 사이에서 균형을 잡아야 하는 운명입니다.', real: '실제로는 663 백강 패전 이후 유민이 흩어졌고, 일본에 건너간 백제 귀족들이 야마토 정권의 율령 체제 형성에 기여했습니다.', score: function (g) { return Math.min(100, Math.round(g.state.hist / Math.max(1, g.state.dec) * 100)); } }
  };
  S.s_end_stall = {
    kind: 'end', era: '660년 7월 이후', title: '나당 연합의 균열', focus: [126.9, 36.4, 1500],
    text: ['요충에서의 지연과 사비의 굳은 수성으로, 당은 군량과 사기가 바닥나 철군을 논하게 됩니다. 신라는 홀로 사비를 칠 수 없어 군을 물립니다. 사비에는 한 해의 시간이 주어집니다.', '이는 사료에 없는 가상의 결말이며, 백제가 살아남은 해에도 고구려 정벌을 벼르는 당은 다시 올 것입니다.'],
    ending: { seal: '延', mine: '백제는 660년의 위기를 넘겼습니다. 이제 외교와 내정이 시험대에 오릅니다.', real: '실제로는 660.7.18 항복. 백제가 이 고비를 넘기는 데에는 두 요충의 동시 방어와 나당 불화라는 두 가지 조건이 필요했습니다.', score: function (g) { return Math.min(100, Math.round(g.state.hist / Math.max(1, g.state.dec) * 100)); } }
  };


  S.s_0710 = {
    era: '660년 7월 10일', title: '당·신라의 만남 — 불화의 조짐', focus: [126.85, 36.2, 1000],
    setup: function (g) { g.map.setToken('silla', 'silla', '신라군', '', 126.95, 36.2); g.map.setToken('tang', 'tang', '당 소정방', '', 126.75, 36.2); },
    text: ['황산벌을 넘은 신라군이 당 진영에 합류합니다. 약속했던 7월 10일에 못 미쳤다는 이유로, 소정방은 신라 독군 <b>김문영</b>을 군문에서 참하려 합니다. 김유신이 "황산 전투를 보지 않고 늦은 것만 죄 준다면, 먼저 당군과 결전하겠다"고 도끼를 쥐자, 소정방의 우장 동보량이 "신라군에 변고가 날 것"이라 말려 사건은 수습됩니다.',
      '사비의 첩자가 이 소식을 전합니다. 한편 7월 10일 좌평 <b>각가</b>를 보내 퇴군을 빌어 본 일도 있습니다.'],
    note: '사료에서 처형하려 한 사람은 소정방, 대상은 김문영이며 김유신은 항의한 쪽입니다(v0.1 정정). 7/10 각가 파견도 신라본기 기사입니다.',
    src: SRC_S,
    choices: [
      { tag: '역사', label: '좌평 각가를 보내 퇴군을 간청한다', hint: '효과 없음. 연합군은 사비로 진군한다.', fx: { gold: -3 }, next: '__to_muster_siege__' },
      { label: '불화를 이용해 소정방에게 사자와 금을 보낸다', hint: '[가상] 금 소모. 소정방이 성을 칠지 더 망설이게 만든다.', fx: { gold: -12 }, flags: { wedge: true }, next: '__to_muster_siege__' }
    ]
  };

  var H = {};
  H.__cont_stall__ = function (g) { contGo(g, 'stall'); };
  H.__to_muster_siege__ = function (g) { toMuster(g, 's_siege'); };
  H.__continue__ = function (g) {
    var sb = g.sb; if (!sb) return; var s = sb.s, w = s.world;
    s.year = Math.max(s.year, g.f('contYear') || 661); w.tang.commit = Math.max(8, w.tang.commit - 14); w.silla.p = Math.max(20, w.silla.p - 8);
    s.extended = (s.extended || 0) + 1; s.shown.__fin = 1; s.endNew = Math.max(sb.cfg.end, s.year) + 25; if (sb.applyMoved) sb.applyMoved();
    s.ap = 3; s.last = L3('<b>백제는 위기를 넘겼습니다.</b> 이제 사료에 없는 길입니다.', '<b>Baekje has survived the crisis.</b> The path now lies beyond the records.', '<b>百済は危機を越えました。</b>ここからは史料にない道です。'); sb.log('660년의 위기를 넘기다');
    g.hud(); g.go('__turn__');
  };
  H.__mu_levy__ = function (g) { var n = Math.round((3000 + g.state.res.people * 50) / 500) * 500; g.state.army.baekje_bangun = (g.state.army.baekje_bangun || 0) + n; g.apply({ people: -6, food: -8 }); g.setFlags({ mu_levy: true }); g.renderArmy(); g.go('s_muster'); };
  H.__mu_garr__ = function (g) { g.state.army.baekje_garrison = (g.state.army.baekje_garrison || 0) + 3500; g.apply({ food: -5 }); g.setFlags({ mu_garr: true }); g.renderArmy(); g.go('s_muster'); };
  H.__mu_navy__ = function (g) { g.state.army.baekje_navy = (g.state.army.baekje_navy || 0) + 2000; g.apply({ gold: -8 }); g.setFlags({ mu_navy: true }); g.renderArmy(); g.go('s_muster'); };
  H.__mu_ally__ = function (g) { var rel = g.sb ? g.sb.s.rel.goguryeo : 0; g.apply({ gold: -6 }); if (Math.random() < Math.min(0.9, 0.25 + (rel - 30) / 80)) { g.state.army.baekje_horse = (g.state.army.baekje_horse || 0) + 2500; g.renderArmy(); } g.setFlags({ mu_ally: true }); g.go('s_muster'); };
  H.__mu_drill__ = function (g) { if (g.sb) g.sb.s.realm.train += 6; g.apply({ morale: 4, food: -4 }); g.setFlags({ mu_drill: true }); g.go('s_muster'); };
  H.__fb_again__ = function (g) { toMuster(g, g.f('where') === 'ungjin' ? 's_ungjin' : 's_siege'); };
  function homeUnits(g) { var a = g.state.army; return ['baekje_bangun', 'baekje_gyebaek', 'baekje_horse', 'baekje_archer', 'baekje_guard', 'baekje_garrison'].filter(function (i) { return a[i] > 0; }).map(function (i) { return { id: i, n: a[i] }; }); }
  function clone(u) { return u.map(function (x) { return { id: x.id, n: x.n }; }); }
  function enemyAtSabi(g) { var p = g.f('pass') || {}, e = tangHost(); if (!g.f('hwwin') && p.tanhyeon !== 'delayed' && p.tanhyeon !== 'held') e = e.concat(sillaHost()); return scaleHost(e, Math.max(0.3, g.f('eFrac') || 1)); }

  H.__hwangsan_battle__ = function (g) {
    var amb = g.f('hw') === 'ambush', a = g.state.army, n = a.baekje_gyebaek || 5000, units = [{ id: 'baekje_gyebaek', n: n }];
    ['baekje_bangun', 'baekje_horse', 'baekje_archer'].forEach(function (id) { var k = Math.round((a[id] || 0) * 0.7 / 100) * 100; if (k > 0) units.push({ id: id, n: k }); });   // 계백이 지휘하는 야전군: 가진 병력의 대부분을 쏟는다
    var A = force('계백과 야전군', 'baekje', units, 'gyebaek', 1.5, 100, { ambush: amb }), B = force('신라군', 'silla', sillaHost(), 'gim_yusin', 1, 72, { cap: cp(25000) });
    var before = clone(units);
    duel(g, A, B, { rounds: 4 }, { title: '황산벌 — 네 번의 접전', tk: 'plain', gen: 'gyebaek', def: true, place: 'hwangsanbeol' }, function (r) {
      g.state.flags.hw1 = r; casualties(g, before, r.aLeft);
      g.battleUI(r, '황산벌 — 네 번의 접전', '계백의 결사대는 네 번 싸워 신라군에 큰 타격을 주었으나, 힘이 다해 갑니다.', function () { g.go('s_gwanchang'); });
    });
  };
  H.__hwangsan_final__ = function (g) {
    var r1 = g.f('hw1'), spared = g.f('gwan') === 'spared';
    var A = force('계백 결사대', 'baekje', clone(r1.aLeft), 'gyebaek', 1.5, 55), B = force('신라군', 'silla', clone(r1.bLeft), 'gim_yusin', 1, spared ? 92 : 100, { cap: cp(25000) });
    var before = clone(r1.aLeft);
    duel(g, A, B, { rounds: 4 }, { title: '황산벌 — 총공격', tk: 'plain', gen: 'gyebaek', def: true, place: 'hwangsanbeol' }, function (r) {
    casualties(g, before, r.aLeft);
    var win = r.winner === 'a';
    g.battleUI(r, '황산벌 — 총공격', win ? '결사대가 끝내 신라 삼군의 총공격을 막아 냈습니다. (실제 역사와 다릅니다.)' : '계백은 장렬히 전사하고, 좌평 충상·상영 등 20여 명이 포로가 되었습니다.', function () {
      if (win) { g.setFlags({ hwwin: true }); g.go('s_sabi_tang'); }
      else { g.state.army.baekje_gyebaek = 0; g.renderArmy(); g.apply({ morale: -12, people: -6 }); g.go('s_0710'); }
    });
    });
  };
  function fieldFight(g, title, defUnits, fort, terr, morale, onWin, onLose) {
    var A = force('사비 방어군', 'baekje', defUnits, 'uija', terr, morale), B = force('당·신라군', 'tang', enemyAtSabi(g), 'sojeongbang', 1, g.f('wedge') ? 55 : 68);
    A.fort = fort; var before = clone(defUnits);
    duel(g, A, B, { rounds: 6 }, { title: title, tk: fort ? 'fort' : 'plain', gen: 'uija', def: true, place: 'sabi' }, function (r) {
      casualties(g, before, r.aLeft); g.setFlags({ eFrac: Math.max(0.3, (g.f('eFrac') || 1) * Math.max(0.3, r.bEnd / Math.max(1, r.bStart))) });
      var ok = r.winner === 'a' || (g.f('wedge') && r.aEnd / r.aStart > .05 && r.bEnd / r.bStart < .9);
      g.battleUI(r, title, ok ? '적은 손실이 커지고 군량·사기가 흔들립니다.' : '방어선이 무너졌습니다.', function () { ok ? onWin() : onLose(); });
    });
  }
  H.__tang_field__ = function (g) { fieldFight(g, '사비 성외 전투 (가상)', homeUnits(g), false, 1.0, g.state.res.morale, function () { contGo(g, 'stall'); }, function () { g.setFlags({ where: 'sabi' }); g.go('s_fallback'); }); };
  H.__ungjin_defense__ = function (g) { fieldFight(g, '웅진성 농성 (가상)', homeUnits(g), true, 1.4, g.state.res.morale + 6, function () { g.setFlags({ surrender: 'no' }); g.go('s661'); }, function () { g.setFlags({ where: 'ungjin' }); g.go('s_fallback'); }); };
  H.__sabi_defense__ =function (g) { fieldFight(g, '사비성 농성 (가상)', homeUnits(g), true, 1.6, g.state.res.morale + 8, function () { contGo(g, 'stall'); }, function () { g.setFlags({ where: 'sabi' }); g.go('s_fallback'); }); };
  H.__baekgang__ = function (g) {
    var bg = g.f('bg'), unity = g.f('unity'), a = g.state.army, wa = [{ id: 'wa_navy', n: 10000 }];
    var AU = wa.concat(a.baekje_navy ? [{ id: 'baekje_navy', n: a.baekje_navy }] : []).concat(bg === 'siege' ? homeUnits(g) : []);
    var terr = bg === 'frontal' ? .8 : bg === 'fire' ? 1.35 : 1.5, mor = unity ? 80 : 50;
    var A = force('부흥군·왜 연합', 'baekje', clone(AU), 'buyeo_pung', terr, mor, { ambush: bg === 'fire', fort: bg === 'siege' });
    var Bu = bg === 'siege' ? [{ id: 'tang_bubyeong', n: 20000 }, { id: 'tang_crossbow', n: 3000 }, { id: 'silla_jeong', n: 14000 }] : [{ id: 'tang_navy', n: 7000 }, { id: 'tang_archer', n: 3000 }, { id: 'tang_crossbow', n: 2000 }];
    var B = force('당 유인궤 수군', 'tang', Bu, 'yuingwe', bg === 'frontal' ? 1.3 : 1, 70);
    duel(g, A, B, { rounds: 6 }, { title: bg === 'siege' ? '주류성 공방 (가상)' : '백강 전투', tk: bg === 'siege' ? 'fort' : 'sea', gen: 'buyeo_pung', def: bg === 'siege', place: bg === 'siege' ? 'juryuseong' : 'baekgang' }, function (r) {
    var win = r.winner === 'a' && r.aEnd / r.aStart > .3;
    g.battleUI(r, bg === 'siege' ? '주류성 공방 (가상)' : '백강 전투', win ? '당의 선단이 무너졌습니다. (사료에 없는 결과)' : '왜선이 불타고 바닷물이 붉어졌다고 전합니다. 풍은 도주하고 주류성은 항복합니다.', function () { if (win) contGo(g, 'alt'); else g.go('s_end_hist'); });
    });
  };


  SG.scenarios.uija = {
    id: 'uija', king: '의자왕', sub: '백제 31대 · 656~663', seal: '義',
    res: { troops: 0, food: 60, gold: 55, people: 55, morale: 60 },
    army: { baekje_bangun: 20000, baekje_gyebaek: 5000, baekje_horse: 2000, baekje_archer: 3000, baekje_guard: 2000, baekje_garrison: 8000, baekje_navy: 3000 },
    start: 's0', scenes: S, handlers: H
  };
})();

;
/* ==== js/data/scenario_uija_timeline.js ==== */
window.__sgL=2;
/* 의자왕편 확장 — 641~659년 연표(정무 턴 + 사료 앵커). 근거: 자료조사/09_의자왕_641_655_연표.md (삼국사기 백제본기 6).
 * 660년 이후는 scenario_uija.js의 기존 장면을 쓰되, 그때까지 쌓은 나라 상태로 진입 방식이 갈린다. */
(function () {
  var scn = SG.scenarios.uija;
  var SRC = '삼국사기 백제본기 의자왕';
  function cap(S, ids, y) { ids.forEach(function (i) { S.captured[i] = y; }); }

  scn.scenes.s0 = {
    era: '641년 · 즉위', title: '해동증자(海東曾子), 의자왕', focus: [126.9, 36.3, 1000], terr: 'y660',
    text: [
      '당신은 <b>백제 31대 왕 의자(義慈)</b>입니다. 무왕이 세상을 떠나자 태자로서 왕위에 올랐고(641), 당 태종은 사부랑중 정문표를 보내 <b>주국 대방군왕 백제왕</b>으로 책명했습니다. 효성과 우애가 깊어 \'해동증자\'라 불렸습니다.',
      '이제 당신은 <b>641년부터 해마다</b> 나라를 돌봅니다. 한 해에 <b>정무 행동력 3점</b>이 있어, 농사·군사 훈련·법령·외교·전쟁 같은 일을 마음대로 명할 수 있고, 문장으로 "신라를 공격한다 / 율령을 반포하라"처럼 적어도 참모가 해석합니다.',
      '해가 바뀔 때마다 풍흉·역병·외교 사건 같은 <b>랜덤 사건</b>이 일어나고, 사료에 기록된 해(642·643·644·645·647·648·649·651·653·655·656·657·659)에는 실제 역사의 갈림길이 찾아옵니다. 선택지의 <b>[역사]</b> 표시는 실제로 일어난 쪽입니다. 당신의 선택에 따라 신라·당·고구려의 움직임이 달라지고, 660년의 운명도 달라집니다.'
    ],
    note: '이 게임의 수치(병력 구성, 능력치, 보정값)는 사료에 근거해 추정·추상화한 값입니다. 사료에 없는 갈래는 "가상"으로 표시합니다.',
    choices: [{ label: '641년, 즉위의 해로', tag: '▶', next: '__turn__' }]
  };
  scn.scenes.s656.choices.forEach(function (c) { c.next = '__turn__'; });
  scn.scenes.s657.choices.forEach(function (c) { c.next = '__turn__'; });
  scn.scenes.s659.choices.forEach(function (c) { c.next = '__uija660__'; });

  scn.sub = '백제 31대 왕 · 641~663';
  var T = [];
  T.push({ y: 642, m: '7~8월', place: 'daeyaseong', title: '즉위 이듬해 — 신라 서쪽을 칠 것인가', hint: '내년에는 신라 서쪽 변경을 칠 기회가 올 듯합니다. 군량과 훈련을 준비해 두십시오.',
    text: ['당에 사신을 보내(642년 정월 입조) 책봉을 굳히고, 2월에는 주·군을 돌며 죄수를 용서해 민심을 얻었습니다. 이제 조정에서는 신라 여왕(선덕)이 다스리는 서쪽 변경이 허술하다는 말이 나옵니다.', '대야성(합천)은 신라 서쪽 요충이며 성주는 김품석 — <b>김춘추의 사위</b>입니다.'],
    note: '백제본기: 642년 7월 왕이 친히 군사를 거느려 신라 미후성 등 40여 성을 항복시켰고, 8월 장군 윤충이 1만을 이끌어 대야성을 쳐 성주 품석과 처자를 죽여 머리를 왕도로 보냈습니다. 신라 남녀 1천여 명을 포로로 잡았습니다.', src: SRC + ' 3년',
    hist: { label: '왕이 직접 나가 미후성 등 40여 성을 취하고, 윤충에게 대야성을 치게 한다', hint: '큰 전과. 그러나 신라의 원한과 당 개입의 씨앗도 함께 자란다.', fx: { gold: 16, morale: 6, people: 2 }, world: { 'silla.p': -9, 'silla.hostility': 24, 'tang.commit': 6 }, rel: { silla: -28 }, flags: { took_daeya: true }, fn: function (g, S) { cap(S, ['w_west', 'w_daeya'], 642); }, result: '미후성 등 40여 성이 항복하고 대야성이 무너졌습니다. 품석 부부의 머리가 사비로 보내졌고 1천여 명이 포로가 되었습니다. 이 소식을 들은 김춘추는 사위와 딸을 잃은 분노로 백제를 갚겠다고 맹세했다고 전합니다.' },
    alts: [
      { label: '즉위 초라 내치에 힘쓰고 국경은 굳히기만 한다', hint: '[가상] 신라를 자극하지 않고 왕권과 농업을 키운다.', realm: { royal: 5, econ: 4, defense: 3 }, world: { 'silla.hostility': -5 }, fx: { people: 3 }, result: '조정은 즉위 초의 안정에 집중했고, 신라는 한동안 숨을 돌렸습니다.' },
      { label: '대야성은 치되, 성주 품석의 처자를 살려 협상 카드로 삼는다', hint: '[가상] 신라의 원한이 덜하고 김춘추와 교섭의 길이 열린다. 전과는 작다.', fx: { gold: 8, morale: 4 }, world: { 'silla.p': -6, 'silla.hostility': 9, 'tang.commit': 2 }, rel: { silla: -10 }, flags: { pumseok_alive: true }, fn: function (g, S) { cap(S, ['w_daeya'], 642); }, result: '대야성은 떨어졌으나 품석의 처자는 사비로 끌려와 정중히 대우받았습니다. 김춘추는 복수심과 안도 사이에서 사신을 보냅니다.' }
    ] });

  T.push({ y: 643, m: '11월', place: 'danghangseong', title: '고구려와 손잡고 당항성을 치다', hint: '고구려가 먼저 손을 내밀 조짐이 있습니다.',
    text: ['고구려의 연개소문이 권력을 잡은 뒤, 고구려는 백제와의 화친을 원합니다. 신라가 당과 통하는 <b>서해 출구 당항성(화성)</b>을 함께 끊자는 것입니다.', '당항성을 차지하면 신라는 해로로 당에 구원을 청하기 어렵습니다.'],
    note: '백제본기 643년 11월: 고구려와 화친하고 신라 당항성을 쳐서 길을 끊으려 했습니다. 신라 왕 덕만이 당에 급히 구원을 청하자 왕은 군사를 거두었습니다.', src: SRC + ' 4년',
    hist: { label: '고구려와 화친하고 당항성을 쳐 신라의 서해 길을 끊으려 한다', hint: '신라가 당에 구원을 청하면 군을 거둔다. 신라·당의 경계심이 올라간다.', fx: { food: -6, morale: 2 }, rel: { goguryeo: 12, tang: -8, silla: -10 }, world: { 'silla.hostility': 8, 'tang.commit': 6 }, flags: { cut_sea: true }, result: '고구려와의 화친이 맺어졌습니다. 그러나 신라 왕이 당에 구원을 청하자, 왕은 군사를 거두었습니다. 당 조정은 이 일을 기억해 둡니다.' },
    alts: [
      { label: '당항성 공격은 미루고 당에 입조해 책봉을 굳힌다', hint: '[가상] 당과의 관계를 우선한다.', fx: { gold: -6 }, rel: { tang: 12, goguryeo: -3 }, world: { 'tang.commit': -4 }, result: '사신이 장안에 다녀와 후한 회사품을 받아 왔습니다.' },
      { label: '고구려와의 화친만 맺고, 신라에는 손대지 않는다', hint: '[가상] 화친의 이득만 챙긴다.', rel: { goguryeo: 10 }, world: { 'silla.hostility': 3 }, result: '고구려는 만족했으나 당항성 공격이 없자 약간 실망한 눈치입니다.' }
    ] });

  T.push({ y: 644, m: '당 사신 · 9월', place: 'sabi', title: '당 사신 상리현장의 중지 고유', hint: '당이 두 나라의 싸움을 말리려 사신을 보낼 것입니다.',
    text: ['당 태종이 사농승 <b>상리현장</b>을 보내 백제와 신라에 전쟁을 멈추라고 타이릅니다. 그 해 왕은 <b>왕자 융을 태자로 삼고 대사면</b>을 내렸습니다.', '9월에는 신라 장수 <b>김유신</b>이 쳐들어와 일곱 성을 가져갑니다. 사신의 말은 누구에게나 똑같이 무겁습니다.'],
    note: '백제본기 644년: 당 태종이 상리현장을 보내 두 나라에 중지를 고유했고, 왕자 융을 태자로 삼고 대사면했습니다. 9월 신라 장군 유신이 침입해 일곱 성을 빼앗았습니다.', src: SRC + ' 5년',
    hist: { label: '융을 태자로 삼고 대사면을 내리되, 신라에는 겉으로만 따른다', hint: '조정과 백성은 안정. 당 사신의 체면은 세워 준다.', fx: { people: 6 }, realm: { royal: 3 }, rel: { tang: 5 }, world: { 'tang.commit': -2, 'silla.hostility': 5 }, flags: { taeja: 'yung' }, result: '대사면으로 백성의 마음이 풀렸고 태자가 정해져 조정이 안정되었습니다. 곧 신라 유신이 변경 일곱 성을 가져갔으나, 왕은 대비를 서두를 뿐이었습니다.' },
    alts: [
      { label: '사신의 말을 받아들여 신라와 휴전한다', hint: '[가상] 당의 호감은 크게 얻지만 군의 사기가 처진다.', fx: { morale: -3 }, realm: { royal: -3 }, rel: { tang: 12, silla: 12 }, world: { 'tang.commit': -9, 'silla.hostility': -9 }, result: '사신은 크게 만족해 조정에 칭찬을 전했습니다. 변경은 잠시 조용해졌습니다.' },
      { label: '사신을 의례로만 대하고 변경 방비에 군을 보탠다', hint: '[가상] 신라의 침공을 막는 데 집중.', fx: { food: -6 }, realm: { defense: 8, train: 3 }, rel: { tang: -4 }, world: { 'tang.commit': 3 }, result: '변경 성들이 증원을 받아 신라의 반격에 대비했습니다.' }
    ] });

  T.push({ y: 645, m: '5월', place: 'seokseong', title: '당이 고구려를 칠 때', hint: '당이 고구려 정벌에 나설 기미가 보입니다. 신라가 병력을 빼내면 변경이 비게 됩니다.',
    text: ['당 태종이 직접 고구려를 쳤습니다. 신라는 당의 요청으로 군사를 보냈고, 서쪽 변경이 텅 빈다는 보고가 올라옵니다.', '이 틈에 신라의 일곱 성을 칠 수 있습니다. 한편 고구려는 지금 당의 대군을 상대하고 있습니다.'],
    note: '백제본기 645년 5월: 당 태종의 고구려 친정 중 신라가 징병한 틈에 신라 7성을 습격했으나, 유신의 반격을 받았습니다.', src: SRC + ' 6년',
    hist: { label: '신라의 빈틈을 노려 일곱 성을 습격한다', hint: '성과는 크지만 유신이 곧 반격한다.', fx: { gold: 10, morale: 3, food: -5 }, world: { 'silla.hostility': 8, 'silla.p': -3, 'tang.commit': 4 }, rel: { silla: -10 }, result: '신라 일곱 성을 습격해 약탈하고 돌아왔으나, 곧 김유신의 반격이 이어졌습니다.' },
    alts: [
      { label: '고구려에 구원군을 보내 당군을 견제한다', hint: '[가상] 고구려와의 동맹이 깊어지나 당이 노한다.', fx: { food: -8, gold: -5 }, rel: { goguryeo: 16, tang: -14 }, world: { 'tang.commit': 10 }, army: { baekje_horse: -200 }, result: '백제 기병 일부가 고구려 전선으로 향했습니다. 당 조정은 불쾌함을 감추지 않았습니다.' },
      { label: '중립을 지키며 당에 조공하고 내정에 힘쓴다', hint: '[가상] 위험은 줄지만 기회도 놓친다.', fx: { gold: -6, people: 3 }, rel: { tang: 10 }, realm: { econ: 4 }, world: { 'tang.commit': -4 }, result: '이 해는 조용히 지나갔습니다.' }
    ] });

  T.push({ y: 647, m: '10월', place: 'gwansanseong', zoom: 900, title: '무산성 — 의직의 출정',
    text: ['장군 <b>의직</b>이 신라 서부의 <b>무산성</b>(전북 장수·무주 일대로 비정되나 학설 있음) 아래에 진을 치고 감물성·동잠성을 노립니다. 신라는 김유신을 보냈습니다.', '당신은 이 원정에 병력을 얼마나 실을지, 어떻게 칠지를 정해야 합니다.'],
    note: '백제본기 647년 10월: 의직이 보·기병 3천을 이끌고 무산성 아래 주둔해 감물성·동잠성을 공격했으나, 신라 유신에게 대패하여 혼자 말 한 필로 돌아왔습니다.', src: SRC + ' 8년',
    battle: { title: '무산성 아래의 접전', commit: 0.2, gen: 'uijik', enemy: { name: '신라 유신군', side: 'silla', total: 6500, scale: 'silla', ref: 60, terrain: 1.25, gen: 'gim_yusin', mix: { line: .5, elite: .12, horse: .1, archer: .1, levy: .18 } },
      tactics: [{ label: '정면 공격으로 속전속결', hint: '역사에선 이렇게 싸우다 대패했다.', tag: '역사', ours: {} }, { label: '야습으로 선봉을 꺾는다', hint: '첩보 30 이상이면 효과. 낮으면 위험.', ours: { ambush: true } }, { label: '진을 굳히고 유인한다', hint: '[가상] 지형을 살려 반격을 노린다.', ours: { terrain: 1.3 } }],
      win: { title: '무산성 — 승리', text: ['의직이 유신의 군을 물리쳤습니다. (실제 역사에서는 의직이 대패했습니다.)'], fx: { gold: 10, morale: 6 }, world: { 'silla.p': -4, 'silla.hostility': 5 } },
      costly: { title: '무산성 — 고전', text: ['큰 피해를 입었으나 진지를 지켜냈습니다.'], fx: { morale: -1 }, world: { 'silla.hostility': 3 } },
      lose: { title: '무산성 — 대패', text: ['의직의 군이 유신에게 무너졌습니다. 의직은 말 한 필로 홀몸이 되어 돌아왔다고 전합니다.'], fx: { morale: -7, people: -2 }, realm: { royal: -2 }, world: { 'silla.hostility': 4 } } } });

  T.push({ y: 648, m: '3~4월', place: 'daeyaseong', title: '요거 십여 성과 옥문곡', hint: '이 무렵 신라 김춘추가 당 태종을 만나 군사 동맹을 맺은 것으로 알려져 있습니다.',
    text: ['의직이 신라 서쪽의 <b>요거</b> 등 십여 성을 쳐 취합니다. 기세를 몰아 <b>옥문곡</b>으로 나아가려는 참입니다. 그곳엔 김유신이 기다리고 있습니다.', '한편 신라의 <b>김춘추</b>가 당에 건너가 당 태종과 만난 일이 첩자의 입으로 전해집니다. 신라는 당의 관복을 입고 연호를 따르기로 했다고 합니다.'],
    note: '백제본기 648년: 3월 의직이 신라 서쪽 요거 등 십여 성을 습격해 취했고, 4월 옥문곡으로 진격하다가 유신에게 크게 패했습니다. 같은 해 신라 김춘추가 당 태종과 회견해 군사 동맹을 맺은 것은 신라본기·구당서의 기사입니다.', src: SRC + ' 9년 · 신라본기 진덕왕 2년',
    hist: { label: '요거 등을 취한 기세를 몰아 옥문곡으로 진격한다', hint: '성과를 얻지만 큰 패배도 맛본다.', fx: { gold: 8, food: -6, morale: -4 }, army: { baekje_bangun: -900 }, world: { 'silla.hostility': 6, 'silla.p': -2, 'tang.commit': 6 }, fn: function (g, S) { cap(S, ['w_west'], 648); }, result: '십여 성을 얻었으나 옥문곡에서 유신의 군에게 크게 패했습니다. 이 무렵 김춘추가 당 태종과 동맹을 약속했다는 소식이 사비에 전해졌습니다.' },
    alts: [
      { label: '요거 등 십여 성을 취한 선에서 멈추고 군을 쉬게 한다', hint: '[가상] 성과를 지키고 손실을 줄인다.', fx: { gold: 8, morale: 3 }, realm: { train: 4 }, world: { 'silla.hostility': 5, 'tang.commit': 5 }, fn: function (g, S) { cap(S, ['w_west'], 648); }, result: '군은 큰 손실 없이 돌아왔습니다. 신라는 이를 갈았습니다.' },
      { label: '김춘추의 당 방문 소식을 듣고 당에 사신을 보내 선수를 친다', hint: '[가상] 당의 인식을 돌리려는 외교전.', fx: { gold: -8 }, rel: { tang: 12 }, world: { 'tang.commit': -10 }, realm: { intel: 5 }, result: '백제 사신이 장안에서 황제를 알현했습니다. 신라의 호소를 상쇄하려는 시도입니다.' }
    ] });

  T.push({ y: 649, m: '8월', place: 'gwansanseong', zoom: 900, title: '석토성 일곱 성과 도살성', hint: '좌장 은상에게 정예를 맡기면 신라 변경을 크게 칠 수 있습니다.',
    text: ['좌장 <b>은상</b>이 정예 7천을 이끌고 신라 <b>석토성</b> 등 일곱 성을 칩니다. 신라에서는 <b>김유신·진춘·천존·죽지</b>가 군을 나눠 맞섭니다. 도살성 아래가 결전지입니다.'],
    note: '백제본기 649년 8월: 좌장 은상이 정예 7천을 이끌고 신라 석토성 등 일곱 성을 공격해 취했고, 이어 도살성 아래에서 유신·진춘·천존·죽지 등에게 패했습니다. 11월에는 천둥과 얼음이 얼지 않는 재이가 기록되었습니다.', src: SRC + ' 10년',
    battle: { title: '도살성 아래의 결전', commit: 0.35, gen: 'gyebaek', enemy: { name: '신라 4장군', side: 'silla', total: 11000, scale: 'silla', ref: 60, terrain: 1.1, gen: 'gim_yusin', mix: { line: .45, elite: .15, horse: .1, archer: .15, levy: .15 } },
      tactics: [{ label: '정예를 앞세워 정면 결전', hint: '역사에선 석토성 일곱 성을 얻은 뒤 대패했다.', tag: '역사', ours: { morale: 5 } }, { label: '석토성 일곱 성을 지키며 방어전', hint: '[가상] 점령지를 굳히고 신라가 지치기를 기다린다.', ours: { terrain: 1.35 } }, { label: '복병을 두고 유인한다', hint: '[가상] 첩보가 필요하다.', ours: { ambush: true } }],
      win: { title: '도살성 — 승리', text: ['네 장수의 군을 물리쳐 석토성 일곱 성을 굳혔습니다. (실제로는 은상이 패했습니다.)'], fx: { gold: 14, morale: 7 }, world: { 'silla.p': -6, 'silla.hostility': 8 } },
      costly: { title: '도살성 — 고전', text: ['크게 상했으나 석토성 일곱 성은 지켜냈습니다.'], fx: { morale: -2, gold: 6 }, world: { 'silla.hostility': 5 } },
      lose: { title: '도살성 — 패전', text: ['은상의 정예가 도살성 아래에서 무너졌습니다.'], fx: { morale: -8, people: -3 }, realm: { royal: -3 }, world: { 'silla.hostility': 4 } } } });

  T.push({ y: 651, place: 'sabi', title: '당 고종의 새서 — 성을 돌려주라', hint: '당 황제의 조서가 곧 올 듯합니다. 신라 성 문제로 압박을 받을 것입니다.',
    text: ['당 고종이 새서(璽書)를 보내 삼국의 전쟁을 멈추라 이릅니다. 신라에서 빼앗은 성을 돌려주라고 하고, 따르지 않으면 <b>신라가 치도록 두고 고구려를 구원하는 일도 막겠다</b>고 경고합니다.', '고구려에 대해서는 거란 등을 보내 압박하겠다는 뜻도 비칩니다.'],
    note: '백제본기 651년: 당 고종의 새서가 와서 신라의 빼앗긴 성을 돌려주고 전쟁을 그만두라 했고, 따르지 않으면 신라가 치도록 두겠다는 경고가 담겨 있습니다. 백제는 따르지 않았습니다.', src: SRC + ' 11년',
    hist: { label: '조서를 받고도 점령한 성을 돌려주지 않는다', hint: '당 조정이 백제를 적대 쪽으로 분류하는 계기가 된다.', realm: { royal: 3 }, rel: { tang: -8, silla: -3 }, world: { 'tang.commit': 9 }, result: '왕은 조서를 정중히 받았으나 성을 돌려주지는 않았습니다. 장안은 이 대답을 오래 기억할 것입니다.' },
    alts: [
      { label: '점령한 신라 성을 돌려주고 평화를 택한다', hint: '[가상] 당의 호감이 오르고 신라의 적의가 꺾인다. 전과는 잃는다.', rel: { tang: 20, silla: 14 }, world: { 'tang.commit': -14, 'silla.hostility': -12 }, realm: { royal: -4 }, fx: { morale: -3 }, flags: { returned: true }, fn: function (g, S) { Object.keys(S.captured).forEach(function (k) { delete S.captured[k]; }); }, result: '성들이 신라에 돌아갔습니다. 장안은 백제의 도리를 칭찬했으나 군 안에서는 불만이 새어 나옵니다.' },
      { label: '일부 성만 돌려주고 포로를 교환하는 협상을 연다', hint: '[가상] 절충안.', fx: { gold: -6 }, rel: { tang: 8, silla: 7 }, world: { 'tang.commit': -6, 'silla.hostility': -5 }, fn: function (g, S) { delete S.captured.w_west; }, result: '신라는 일부 성과 포로를 돌려받고 당 사신을 안심시켰습니다.' }
    ] });

  T.push({ y: 653, m: '봄 · 8월', place: 'sabi', title: '큰 가뭄 — 왜와 통호하다', hint: '올해는 비가 적을 조짐이 있다는 일관의 말이 있습니다.',
    text: ['봄에 큰 가뭄이 들어 백성이 굶주립니다. 한편 8월에는 왜(일본)가 사절을 보내 오고, 백제는 왜와 통호합니다. 불교와 기술을 전해 온 오랜 인연이 있습니다.'],
    note: '백제본기 653년: 봄에 큰 가뭄이 들어 백성이 굶주렸고, 8월에 왜국과 통호했습니다.', src: SRC + ' 13년',
    hist: { label: '굶주린 백성을 구제하고 왜와 통호한다', hint: '군량을 풀어 민심을 지키고 왜와 관계를 맺는다.', fx: { food: -10, people: 5 }, rel: { wa: 14 }, flags: { wa_friend: true }, result: '곡식이 풀려 큰 굶주림은 피했고, 왜 사신은 후한 대접을 받고 돌아갔습니다.' },
    alts: [
      { label: '구제보다 왜와의 통호와 교역에 힘쓴다', hint: '[가상] 금은 늘지만 민심이 상한다.', fx: { gold: 10, people: -6 }, rel: { wa: 16 }, flags: { wa_friend: true }, result: '왜와의 교역으로 재물은 늘었지만 굶주린 백성의 원망이 깊어졌습니다.' },
      { label: '왜는 뒤로 미루고 진휼과 개간에 전념한다', hint: '[가상] 내정 안정.', fx: { food: -8, people: 8 }, realm: { econ: 4 }, result: '민심이 크게 안정되었습니다.' }
    ] });

  T.push({ y: 655, m: '2~7월', place: 'sabi', title: '태자궁과 망해정 — 사치의 시작', hint: '궁궐을 손질하자는 이야기가 조정에 돌고 있습니다.',
    text: ['태자궁을 매우 화려하게 손보고 왕궁 남쪽에 <b>망해정</b>이라는 정자를 세우자는 상소가 올라옵니다. 5월에는 붉은 말 한 마리가 북악 오함사에 들어가 울다 죽었다는 괴이한 소문도 돕니다.', '7월에는 변경 <b>마천성</b>을 중수할 수 있습니다.'],
    note: '백제본기 655년: 2월 태자궁을 사치스럽게 수리하고 망해정을 세웠고, 5월 붉은 말이 오함사에서 울다 죽었으며, 7월 마천성을 중수했습니다. 후대 사관은 이런 기사를 말년 사치와 멸망의 전조로 배치했습니다.', src: SRC + ' 15년',
    hist: { label: '태자궁을 화려하게 손보고 망해정을 세운다', hint: '왕실의 위엄은 오르나 민심과 재정이 상한다.', fx: { gold: -12, people: -5 }, realm: { royal: 5 }, result: '궁궐이 새로 단장되었으나 공사에 동원된 백성의 원성이 높습니다.' },
    alts: [
      { label: '궁궐 공사는 미루고, 마천성을 중수해 변경을 굳힌다', hint: '[가상] 방비 상승.', fx: { gold: -6, food: -3 }, realm: { defense: 9 }, result: '마천성이 새로 보수되었습니다.' },
      { label: '궁궐도 성도 손보되 규모를 절반으로 줄인다', hint: '[가상] 절충.', fx: { gold: -9, people: -2 }, realm: { royal: 3, defense: 5 }, result: '두 공사가 알맞은 규모로 마무리되었습니다.' }
    ] });

  T.push({ y: 655, m: '8월', place: 'chiljungseong', zoom: 1100, title: '고구려·말갈과 함께 신라 30여 성을 치다', hint: '고구려가 신라 북변을 칠 때 함께 움직일 수 있습니다.',
    text: ['고구려·말갈이 신라 북변을 칩니다. 백제도 함께 신라 30여 성을 공격하자는 제안이 옵니다. 성공하면 신라는 큰 타격을 입겠지만, 당에 구원을 청하는 길이 열립니다.'],
    note: '백제본기 655년 8월: 고구려·말갈과 함께 신라 30여 성을 공격했습니다. 신라 왕 김춘추는 당에 표를 올려 호소했고, 이는 660년 나당 연합군 파병으로 이어지는 흐름의 일부입니다.', src: SRC + ' 15년',
    hist: { label: '고구려·말갈과 함께 신라 30여 성을 친다', hint: '큰 성과. 신라와 당의 개입 의지가 급격히 오른다.', fx: { gold: 14, morale: 5, food: -8 }, world: { 'silla.p': -8, 'silla.hostility': 12, 'tang.commit': 10 }, rel: { goguryeo: 12, silla: -12, tang: -6 }, flags: { took_north: true }, fn: function (g, S) { cap(S, ['w_north'], 655); }, result: '신라 30여 성이 흔들렸습니다. 김춘추는 당 조정에 표를 올려 눈물로 호소했습니다.' },
    alts: [
      { label: '이번에는 공격에 가담하지 않고 당과 신라의 눈치를 본다', hint: '[가상] 위험은 줄지만 고구려가 서운해한다.', rel: { goguryeo: -8, tang: 6 }, world: { 'tang.commit': -5 }, result: '고구려는 서운해했고, 당은 의아해했습니다.' },
      { label: '가담하되 병력을 절반만 보낸다', hint: '[가상] 절충.', fx: { gold: 7, morale: 2, food: -4 }, world: { 'silla.p': -4, 'silla.hostility': 8, 'tang.commit': 6 }, rel: { goguryeo: 6, silla: -6 }, result: '부분 참전으로 성과도 위험도 반으로 줄었습니다.' }
    ] });

  T.push({ y: 656, scene: 's656' }, { y: 657, scene: 's657' }, { y: 659, scene: 's659' });

  scn.sb = {
    id: 'uija', side: 'baekje', country: '백제', cap: '사비', capPlace: 'sabi', start: 641, end: 659, armyName: '백제군', gen: 'uija',
    names: { silla: '신라', goguryeo: '고구려', tang: '당', wa: '왜' }, sides: { silla: 'silla', goguryeo: 'goguryeo', tang: 'tang', wa: 'wa' },
    world: { silla: { p: 60, hostility: 45 }, goguryeo: { p: 85, hostility: 8 }, tang: { p: 110, commit: 10 }, wa: { p: 30, hostility: 5 } },
    rel: { silla: 28, goguryeo: 55, tang: 65, wa: 55 }, realm: { royal: 55, train: 50, defense: 50, navy: 25, econ: 50, intel: 30 },
    drift: { silla: { p: 0.7 }, tang: { commitTarget: 72, from: 648 }, wa: { p: 0.3 } },
    terr: 'y660', targets: SG.data.warTargets.map(function (t) { return Object.assign({ side: 'silla' }, t); }),
    invasion: { from: 644, to: 658 }, timeline: T,
    finaleHandler: function (g) { g.go('__uija660__'); },
    turnTitle: function (y) { return y < 645 ? '즉위 초 — ' + y + '년' : y < 655 ? '의자왕 ' + (y - 640) + '년' : '말년의 조짐 — ' + y + '년'; },
    real: '실제로는 642년 대야성 함락 등 신라를 거세게 몰아붙였으나 647~649년 신라 유신 등에게 연패하고, 651년 당 고종의 경고와 655년 신라의 호소를 거치며 나당 동맹이 굳어졌습니다. 660년 당 13만·신라 5만의 협공에 사비성이 함락되고(7.18 의자왕 항복) 백제는 멸망했습니다.',
    endNote: { hegemon: '반도 서남부에서 한강·낙동강 유역까지 영향력을 넓혀, 신라와 당을 모두 압도하는 새 질서를 열었습니다. 실제 역사에는 없는 가상의 결말입니다.', prosper: '백제는 660년의 위기를 외교와 내정으로 넘겼습니다. 가상의 결말입니다.', steady: '660년, 당은 끝내 대군을 보내지 않았고 백제는 불안한 균형을 이어갔습니다. 가상의 결말입니다.' }
  };

  var H = scn.handlers;
  H.__uija660__ = function (g) {
    var sb = g.sb, s = sb.s, w = s.world, caps = Object.keys(s.captured).length, power = sb.armyTotal() / 1000;
    // 역사의 위기는 나라의 힘에 비례해 찾아온다: 강할수록 나당은 더 큰 군을 일으키고, 약해도 얕보지 않는다
    var my = Math.max(0.85, Math.min(2.6, Math.pow(sb.armyTotal() / 43000, 0.75))) * (1 + Math.max(0, s.realm.train - 60) / 250 + Math.max(0, s.realm.defense - 60) / 400);
    SG._uijaScale(Math.max(0.9, sb.hostScale('silla')) * my, Math.max(0.95, sb.hostScale('tang')) * my, my);
    g.go('s660');
  };
})();

;
/* ==== js/data/sc_goguryeo.js ==== */
window.__sgL=3;
/* 고구려 왕 3명: 고국원왕(342~371) · 영양왕(598~614) · 보장왕(642~668).
 * 사건·연대는 삼국사기 고구려본기·백제본기·신라본기 기사에 근거했고, 수치(병력·국력)는 게임 추상화 값이다. 사료에 없는 갈래는 '가상'으로 표시. */
(function () {
  var BASE_CMD_HIST = ['tribute_tang', 'fortify'];
  function tg(id, name, place, garrison, terrain, gold, power, hist, extra) { return Object.assign({ id: id, name: name, place: place, garrison: garrison, terrain: terrain, gold: gold, people: 2, power: power, hist: hist }, extra || {}); }

  /* ───────── 고국원왕 ───────── */
  (function () {
    var SRC = '삼국사기 고구려본기 고국원왕';
    var T = [];
    T.push({ y: 342, m: '11월', place: 'gungnae', zoom: 1000, title: '전연의 침입 — 환도성의 두 길', hint: '', src: SRC + ' 12년',
      text: ['342년 2월 환도성을 고쳐 쌓고 국내성을 새로 쌓은 왕은 8월 환도성으로 도읍을 옮겼습니다. 11월, 모용황이 이끄는 <b>전연</b>의 대군이 쳐들어옵니다. 길은 두 갈래 — 평탄한 <b>남도</b>와 험한 <b>북도</b>입니다.', '어느 쪽에 주력을 두겠습니까?'],
      note: '삼국사기: 전연 모용황이 남도로 4만, 장사 왕우 등이 북도로 1만 5천을 이끌고 침입. 왕은 아우 무에게 정병을 주어 북도를 막게 하고 자신은 약병으로 남도를 막았으나 남도에서 패해 환도성이 함락되었습니다. 미천왕의 묘가 도굴되고 왕모·왕비가 포로로 잡혔으며 남녀 5만여 명이 끌려갔습니다.',
      battle: { title: '남도·북도의 방어전', defense: true, terrain: 1.15, enemy: { name: '전연군', side: 'tang', total: 50000, scale: 'tang', ref: 105, terrain: 1, mix: { line: .5, horse: .25, elite: .1, archer: .15 } },
        tactics: [{ label: '북도에 정병을 모으고 남도는 약병으로 막는다', hint: '실제 역사의 배치. 평탄한 남도가 뚫렸다.', tag: '역사', ours: { morale: -4, terrain: 0.95 } }, { label: '평탄한 남도에 주력을 두고 북도는 소수로 지킨다', hint: '[가상] 적 본대를 정면으로 맞는다.', ours: { morale: 3 } }, { label: '환도성 산성에 병력을 모아 농성한다', hint: '[가상] 성 밖 땅은 내주고 산성에서 버틴다.', ours: { terrain: 1.65 } }],
        win: { title: '환도성을 지키다', text: ['전연군이 물러났습니다. 미천왕의 묘도 왕모도 무사합니다. (실제 역사와 다릅니다.)'], fx: { morale: 8, people: 4 }, world: { 'tang.commit': -8 }, realm: { defense: 3 } },
        costly: { title: '고전 끝에 막아내다', text: ['큰 피해를 입었으나 환도성을 지켰습니다.'], fx: { morale: -3, people: -3, gold: -8 }, realm: { defense: -4 } },
        lose: { title: '환도성 함락', text: ['환도성이 무너졌습니다. 왕은 단웅곡으로 몸을 피했고, 전연군은 궁실을 불사르고 미천왕의 시신을 파 가며 왕모와 왕비, 백성 5만여 명을 끌고 돌아갔습니다.'], fx: { morale: -12, people: -9, gold: -15, food: -10 }, realm: { royal: -8, defense: -10 }, army: { baekje_bangun: -2000 }, flags: { sacked: true }, world: { 'tang.commit': 6 } } } });
    T.push({ y: 343, m: '2~7월', place: 'pyeongyang', title: '칭신하고 아버지의 시신을 되찾다', hint: '전연이 돌아간 뒤 왕은 큰 결정을 해야 합니다. 도읍과 아버지의 시신 문제입니다.', src: SRC + ' 13년',
      text: ['환도성은 폐허입니다. 전연은 미천왕의 시신과 왕모를 볼모로 쥐고 있습니다. 모용황은 "신하로 입조하면 시신을 돌려주겠다"는 뜻을 비칩니다. 환도성 대신 <b>평양 동황성</b>으로 도읍을 옮기는 안도 나옵니다.'],
      note: '삼국사기 343년: 왕이 아우를 연에 보내 칭신 입조하고 진기한 보물을 천 단위로 바치자 연은 미천왕의 시신을 돌려보냈으나 왕모는 인질로 남겼습니다. 7월 왕은 평양 동황성으로 거처를 옮겼습니다.', src: SRC + ' 13년',
      hist: { label: '아우를 보내 칭신하고 보물을 바쳐 선왕의 시신을 돌려받고, 평양 동황성으로 옮긴다', hint: '굴욕을 감수하고 전연의 칼을 늦춘다.', fx: { gold: -14, morale: -3, people: 2 }, realm: { royal: -2, defense: 3 }, rel: { tang: 14 }, world: { 'tang.commit': -12 }, result: '선왕의 시신이 돌아왔습니다. 왕모는 여전히 연에 있고, 왕은 새 거처 평양에서 나라를 추스릅니다.' },
      alts: [{ label: '칭신을 거부하고 방비를 굳히며 복수를 별러 본다', hint: '[가상] 자존심은 지키나 전연의 압박이 이어진다.', fx: { food: -8, morale: 2 }, realm: { defense: 7, train: 4 }, rel: { tang: -10 }, world: { 'tang.commit': 8 }, result: '조정은 복수의 맹세로 들끓었으나 전연의 재침 위협은 사라지지 않았습니다.' }, { label: '몰래 후연 반대 세력(전연 내부 불만)과 손잡는다', hint: '[가상] 첩보와 외교 공작.', fx: { gold: -9 }, realm: { intel: 8 }, rel: { tang: -4 }, world: { 'tang.commit': -4 }, result: '연의 내정을 살필 길이 열렸으나 들키면 큰일입니다.' }] });
    T.push({ y: 355, m: '12월', place: 'gungnae', title: '왕모를 모셔 오다', hint: '전연은 여전히 왕모를 붙잡고 있습니다. 때가 오면 인질과 교섭할 길이 있습니다.', src: SRC + ' 25년',
      text: ['13년이 지났습니다. 전연의 모용준은 고구려를 신하국으로 묶어 두려 하고, 왕모 주씨는 여전히 연에 있습니다. 전연이 요구하는 것은 <b>인질과 조공</b>입니다.'],
      note: '삼국사기 355년 12월: 왕이 인질을 보내 조공하자 전연은 왕모 주씨를 돌려보냈고, 왕을 정동대장군 영주자사 낙랑공 고구려왕으로 책봉했습니다.',
      hist: { label: '왕자를 인질로 보내 조공하고 왕모를 모셔 온다', hint: '모후를 찾지만 전연의 책봉을 받는 처지가 된다.', fx: { gold: -10, people: 3 }, realm: { royal: 3 }, rel: { tang: 12 }, world: { 'tang.commit': -10 }, flags: { mother_home: true }, result: '13년 만에 왕모가 돌아왔습니다. 연은 왕에게 낙랑공 고구려왕의 책봉을 내렸습니다.' },
      alts: [{ label: '왕모 송환 대신 동진과 사신을 통해 전연을 견제한다', hint: '[가상] 336년 동진에 사신을 보낸 선례가 있다.', fx: { gold: -8 }, rel: { tang: -6 }, realm: { intel: 5 }, world: { 'tang.commit': 4 }, result: '동진은 멀고 전연은 가깝습니다. 왕모 송환은 미뤄졌습니다.' }] });
    T.push({ y: 369, m: '9월', place: 'maesoseong', title: '치양으로 — 남쪽의 신흥 백제', hint: '남쪽 백제의 근초고왕이 부쩍 성장하고 있습니다. 한 번 눌러 둘 필요가 있습니다.', src: SRC + ' 39년 · 백제본기 근초고왕 24년',
      text: ['백제의 근초고왕이 세력을 키워 북쪽 변경을 위협합니다. 왕은 직접 군을 이끌고 남쪽 <b>치양</b>(황해도 배천 일대로 비정)을 공격할 계획을 세웁니다.'],
      note: '삼국사기 369년 9월: 고구려 왕이 2만 군을 이끌고 백제 치양에 이르러 싸웠으나, 백제 태자 근구수가 급습해 격파하고 5천여 명을 사로잡았습니다.',
      battle: { title: '치양 전투', commit: 0.7, enemy: { name: '백제군', side: 'baekje', total: 15000, scale: 'silla', ref: 50, terrain: 1.2, mix: { line: .45, horse: .2, archer: .15, elite: .1, levy: .1 } },
        tactics: [{ label: '2만 병력으로 정면 공격', hint: '역사의 방식. 백제 태자의 급습에 당했다.', tag: '역사', ours: {} }, { label: '정찰을 보내 급습에 대비하며 진군', hint: '[가상] 첩보 30 이상이면 매복에 대비.', ours: { morale: 4 } }, { label: '본대는 뒤에 두고 선봉으로 유인한다', hint: '[가상]', ours: { ambush: true } }],
        win: { title: '치양 대승', text: ['백제군을 격파하고 북쪽 변경을 굳혔습니다. (실제 역사와 다릅니다.)'], fx: { gold: 12, morale: 8 }, world: { 'silla.p': -8, 'silla.hostility': 8 }, captureTargets: ['w_chiyang'] },
        costly: { title: '치양 — 고전', text: ['큰 피해를 입었으나 진지를 지켰습니다.'], fx: { morale: -2 }, world: { 'silla.hostility': 6 } },
        lose: { title: '치양 패전', text: ['백제 태자 근구수의 급습에 5천여 명이 포로가 되고 군이 무너졌습니다. 백제의 기세가 오릅니다.'], fx: { morale: -9, people: -3 }, realm: { royal: -3 }, world: { 'silla.p': 5, 'silla.hostility': 8 } } } });
    T.push({ y: 370, place: 'gungnae', title: '전연의 멸망 — 도망 온 모용평', hint: '북쪽에서 전진(前秦)이 전연을 무너뜨릴 조짐이 있습니다.', src: SRC + ' 40년',
      text: ['전진(前秦)이 전연을 멸망시켰습니다. 전연의 태부 <b>모용평</b>이 고구려로 도망해 옵니다. 오랫동안 고구려를 짓밟은 나라의 마지막 대신이 당신 앞에 있습니다.'],
      note: '삼국사기 370년: 전진에 쫓긴 연 태부 모용평이 고구려로 달아나자 왕은 그를 붙잡아 전진으로 보냈습니다.',
      hist: { label: '모용평을 붙잡아 전진에 송환한다', hint: '새 강자 전진과 관계가 좋아진다.', fx: { gold: 6 }, rel: { tang: 14 }, world: { 'tang.commit': -25 }, result: '전진의 부견은 흡족했습니다. 전연의 압박이 사라지고, 북쪽이 비로소 조용해졌습니다.' },
      alts: [{ label: '모용평을 받아들여 요동 일대 연 유민을 규합한다', hint: '[가상] 위험한 도박. 전진이 노할 수 있다.', fx: { gold: -4 }, realm: { intel: 6 }, rel: { tang: -15 }, world: { 'tang.commit': 14 }, result: '전연 유민들이 고구려 변경에 모여들었지만, 전진은 이 일을 오래 기억할 것입니다.' }] });
    T.push({ y: 371, m: '10월', place: 'pyeongyang', zoom: 900, last: true, title: '평양성 — 백제 3만의 침공', hint: '', src: SRC + ' 41년 · 백제본기 근초고왕 26년',
      text: ['겨울, 백제의 근초고왕이 태자와 함께 <b>3만 군</b>으로 평양성을 공격합니다. 남쪽의 신흥 강국이 치양의 복수를 하러 온 것입니다. 왕은 직접 성을 지키며 군사를 독려합니다.', '이 싸움이 재위의 마지막이 될 수도 있습니다.'],
      note: '삼국사기 371년 겨울: 백제 왕이 태자와 함께 정병 3만을 이끌고 평양성을 공격하자 왕이 나가 막다가 날아온 화살(流矢)에 맞아 10월 23일에 세상을 떠났습니다.',
      battle: { title: '평양성 공방', defense: true, terrain: 1.35, loseEnd: { kind: 'conquered', title: '평양성의 화살 — 왕의 전사', text: '백제군의 총공격 속에서 왕은 군사를 독려하다 날아든 화살에 맞아 쓰러졌습니다. 고구려는 소수림왕에게 넘겨져 불교 수용·태학 설립·율령 반포로 재정비하게 됩니다.' },
        enemy: { name: '백제군', side: 'baekje', total: 46000, scale: 'silla', ref: 60, terrain: 1, mix: { line: .5, horse: .15, archer: .15, elite: .1, levy: .1 } },
        tactics: [{ label: '성 밖으로 나가 직접 군을 독려한다', hint: '실제 역사의 모습. 왕이 최전선에 선다.', tag: '역사', ours: { morale: 8 } }, { label: '성문을 굳게 닫고 농성한다', hint: '[가상] 왕은 성 안 깊은 곳에서 지휘.', ours: { terrain: 1.7 } }, { label: '야간에 성 밖 백제 진영을 기습한다', hint: '[가상] 첩보와 훈련이 받쳐야 한다.', ours: { ambush: true, morale: 3 } }],
        win: { title: '평양성을 지키다', text: ['백제군이 물러났습니다. 왕은 살아 돌아왔고, 고구려는 신흥 백제의 도전을 막아냈습니다. (실제 역사와 다릅니다.)'], fx: { morale: 10, people: 5 }, world: { 'silla.p': -12 } },
        costly: { title: '평양성 — 피로 지킨 성', text: ['큰 희생 끝에 성을 지켰습니다.'], fx: { morale: -2, people: -4 }, world: { 'silla.hostility': -6 } },
        lose: { title: '평양성 함락 위기', text: [''], fx: {} } } });

    SG.makeScenario({
      id: 'gogukwon', king: '고국원왕', sub: '고구려 16대 왕 · 342~371', seal: '麗', side: 'goguryeo', country: '고구려', cap: '국내성', capPlace: 'gungnae', start: 342, end: 371, armyName: '고구려군',
      names: { silla: '백제', goguryeo: '신라', tang: '전연', wa: '왜' }, sides: { silla: 'baekje', goguryeo: 'silla', tang: 'tang', wa: 'wa' },
      world: { silla: { p: 50, hostility: 38 }, goguryeo: { p: 20, hostility: 5 }, tang: { p: 105, commit: 55 }, wa: { p: 25, hostility: 5 } },
      rel: { silla: 25, goguryeo: 55, tang: 30, wa: 40 }, realm: { royal: 52, train: 50, defense: 58, navy: 5, econ: 45, intel: 30 }, res: { food: 55, gold: 45, people: 55, morale: 60 },
      army: { line: 14000, garrison: 6000, elite: 3000, horse: 3000, archer: 3000, levy: 4000, guard: 1200, scout: 300 },
      drift: { silla: { p: 1.1 }, tang: { sched: { 342: 58, 356: 34, 370: 4 } }, wa: { p: 0.2 } },
      targets: [tg('w_chiyang', '백제 북변 요새(치양 방면)', 'maesoseong', 9000, 1.25, 12, -5, '369년 고구려군 2만이 치양을 쳤으나 백제에 격파됨(삼국사기)', { short: '치양' }),
        tg('w_hansan', '백제 한강 북안 성(가상)', 'achasan', 12000, 1.4, 14, -7, '고국원왕이 한강 방면을 공략한 사료는 없음(가상)'), tg('w_hanseong', '백제 한성(가상)', 'hanseong', 20000, 1.5, 24, -12, '근초고왕 대 백제의 중심지. 공략 기록은 없음(가상)')],
      invasion: { from: 346, to: 369 }, timeline: T, histCmds: BASE_CMD_HIST,
      intro: { era: '342년 · 환도성', title: '고국원왕 — 전연의 칼날 아래서', focus: [126.19, 41.13, 1400], go: '342년, 전연의 침입이 시작되다',
        text: ['당신은 <b>고구려 16대 고국원왕</b>(재위 331~371)입니다. 미천왕의 아들로, 요동 진출을 이어 가던 아버지의 뒤를 이어 왕이 되었습니다. 북쪽에서는 모용씨의 <b>전연</b>이 요동을 노리고, 남쪽에서는 백제가 자라나고 있습니다.', '이 이야기는 342년 가을, 환도성을 새로 단장한 직후 전연의 대군이 국경을 넘는 순간에 시작합니다. 해마다 정무 행동력 3점으로 나라를 돌보고, 사료에 남은 해(342·343·355·369·370·371)에는 역사의 갈림길이 찾아옵니다.'],
        note: '이 시대의 영역 경계는 학설 차이가 커서 지도에 영역 색을 칠하지 않았습니다. 지명 위치는 현대 위치 기준 근사값입니다.' },
      real: '실제로는 342년 환도성이 함락되고 왕모·왕비가 끌려갔으며, 355년 왕모를 데려오는 대신 전연의 책봉을 받았습니다. 369년 치양 전투에서 백제에 패한 뒤 371년 백제 근초고왕의 평양성 공격 중 화살에 맞아 전사했습니다.',
      endNote: { prosper: '북쪽의 전연이 무너진 뒤 고구려는 전진과 균형을 잡으며 남쪽 백제와 팽팽히 맞섰습니다. (고국원왕 사후 소수림왕이 불교·태학·율령으로 나라를 재정비한 것이 실제 흐름입니다.)', steady: '왕은 평양성을 지켜냈고, 고구려는 소수림왕 대의 재정비 시기로 넘어갈 발판을 얻었습니다.' } });
  })();

  /* ───────── 영양왕 ───────── */
  (function () {
    var SRC = '삼국사기 고구려본기 영양왕';
    var T = [];
    T.push({ y: 598, m: '2~9월', place: 'yodongseong', zoom: 1200, title: '요서 선제 공격과 수 문제의 30만', hint: '', src: SRC + ' 9년',
      text: ['590년 즉위한 왕은 수나라가 중국을 통일하자 불안했습니다. 수는 고구려에 신하의 예를 요구합니다. 국경 요서에서는 수의 영주총관이 눈에 거슬립니다.', '왕은 <b>말갈 기병 1만</b>을 거느리고 요서를 먼저 칠 수 있습니다.'],
      note: '삼국사기 598년: 2월 왕이 말갈 병사 1만여 명으로 요서를 침공하자 수의 영주총관 위충이 격퇴했습니다. 6월 수 문제가 한왕 양량·왕세적 등에게 수륙 30만을 주어 쳤으나 장마와 군량 부족, 질병으로 군이 무너졌고 수군은 풍랑으로 선박 다수를 잃었습니다. 왕은 사죄하는 표를 올렸고 수는 군을 거두었습니다.',
      hist: { label: '말갈 1만으로 요서를 쳐 수를 흔든다. 수 대군이 오면 사죄 표를 올려 물린다', hint: '선제 타격 후 외교로 수습.', fx: { gold: 6, morale: 4, food: -8 }, realm: { intel: 4 }, world: { 'tang.commit': 6 }, rel: { tang: -8 }, flags: { first_war: true }, result: '요서 공격으로 수의 경계심이 높아졌습니다. 이윽고 수의 30만이 왔으나 장마와 질병으로 스스로 무너졌고, 왕은 사죄 표를 올려 수의 체면을 세워 주었습니다.' },
      alts: [{ label: '선제 공격은 하지 않고 변경 성을 굳히며 수의 눈치를 본다', hint: '[가상] 수를 자극하지 않는다.', fx: { gold: -5 }, realm: { defense: 8 }, rel: { tang: 6 }, world: { 'tang.commit': -4 }, result: '수는 고구려의 순종에 안심했으나 성 보수에 많은 재물이 들었습니다.' }, { label: '수에 신하의 예를 갖춰 먼저 사신을 보낸다', hint: '[가상] 전쟁을 미루나 자존심이 상한다.', fx: { gold: -8, morale: -3 }, rel: { tang: 14 }, world: { 'tang.commit': -9 }, realm: { royal: -2 }, result: '수 문제는 만족해 조서를 보냈습니다. 일부 귀족은 굴욕이라 수군거립니다.' }] });
    T.push({ y: 600, place: 'pyeongyang', title: '이문진의 『신집』 — 나라의 역사를 쓰다', hint: '태학박사 이문진이 역사서 편찬 건의를 올릴 것입니다.', src: SRC + ' 11년',
      text: ['고구려에는 건국 초부터 전해 오는 기록 『유기(留記)』 100권이 있습니다. 태학박사 <b>이문진</b>이 이를 간추려 새로 엮겠다고 청합니다.'],
      note: '삼국사기 600년 정월: 태학박사 이문진에게 명해 옛 사적을 간추려 『신집(新集)』 5권을 짓게 했습니다. 처음 문자를 쓸 때 어떤 사람이 사실을 100권으로 기록해 『유기』라 했는데 이를 줄인 것입니다.',
      hist: { label: '이문진에게 『유기』를 간추린 『신집』 5권을 짓게 한다', hint: '왕권과 문서 행정이 강해진다.', fx: { gold: -5 }, realm: { royal: 5, econ: 2, intel: 3 }, result: '역사서가 완성되어 왕실의 정통성이 문서로 다져졌습니다.' },
      alts: [{ label: '역사서보다 병서와 성곽 정비에 재물을 쓴다', hint: '[가상]', fx: { gold: -6 }, realm: { defense: 6, train: 3 }, result: '요동 일대 성에 병서와 군기가 보급되었습니다.' }] });
    T.push({ y: 603, m: '8월', place: 'achasan', title: '신라 북한산성을 공격하다', hint: '', src: SRC + ' 14년 · 신라본기 진평왕 25년',
      text: ['수가 잠잠한 사이 왕은 남쪽의 신라를 노립니다. 한강 유역의 <b>북한산성</b>을 치면 신라의 북쪽 거점이 흔들립니다. 신라 진평왕은 직접 군을 이끌고 구원에 나설 것으로 보입니다.'],
      note: '삼국사기 603년 8월: 고구려가 신라 북한산성을 공격하자 신라 진평왕이 1만 군을 이끌고 맞섰고, 고구려군은 물러갔습니다. 604년 신라는 한강 방면 방비를 강화했습니다.',
      battle: { title: '북한산성 공방', commit: 0.5, enemy: { name: '신라군', side: 'silla', total: 10000, scale: 'silla', ref: 45, terrain: 1.4, mix: { line: .45, garrison: .2, levy: .15, archer: .1, horse: .1 } },
        tactics: [{ label: '성을 포위하고 신라 원군을 기다려 친다', hint: '역사에서는 진평왕 군이 이르자 물러났다.', tag: '역사', ours: {} }, { label: '원군이 오기 전에 속전속결로 성을 친다', hint: '[가상] 사기를 올려 단숨에 공략.', ours: { morale: 6 } }, { label: '원군 길목에 매복한다', hint: '[가상] 첩보가 필요.', ours: { ambush: true } }],
        win: { title: '북한산성 함락', text: ['신라 북한산성을 얻었습니다. (실제 역사와 다릅니다.)'], fx: { gold: 12, morale: 6 }, world: { 'silla.p': -6, 'silla.hostility': 10 }, captureTargets: ['w_bukhan'] },
        costly: { title: '북한산성 — 고전', text: ['성을 얻지 못한 채 물러났습니다.'], fx: { morale: -2 }, world: { 'silla.hostility': 6 } },
        lose: { title: '북한산성 — 철수', text: ['신라 원군이 이르자 고구려군은 물러났습니다.'], fx: { morale: -4 }, world: { 'silla.hostility': 8 } } } });
    T.push({ y: 608, m: '2월', place: 'hasilla', title: '신라 북변 침입 — 8천 포로', hint: '', src: SRC + ' 19년',
      text: ['왕은 신라 북변을 다시 칩니다. 한편 신라의 승려 <b>원광</b>이 수에 군사를 청하는 글(걸사표)을 쓴다는 소문이 들립니다.'],
      note: '삼국사기 608년 2월: 고구려가 신라 북쪽 변경을 침범해 8천 명을 사로잡았습니다. 이 무렵 신라는 원광의 걸사표로 수에 군사를 청하려 했습니다(원광 걸사표는 608년 설, 611년 설 등 이설이 있습니다).',
      hist: { label: '신라 북변을 쳐 8천 명을 사로잡는다', hint: '성과는 크지만 신라가 수에 달라붙는 계기가 된다.', fx: { gold: 8, morale: 4, people: 3 }, world: { 'silla.p': -5, 'silla.hostility': 10, 'tang.commit': 5 }, rel: { silla: -12 }, result: '8천 명이 포로로 잡혔습니다. 신라는 수에 구원을 청할 채비를 합니다.' },
      alts: [{ label: '신라와 화해해 수의 앞길을 막는다', hint: '[가상] 신라가 수 편에 서지 않도록 돕는 길.', fx: { gold: -7 }, rel: { silla: 16 }, world: { 'silla.hostility': -12, 'tang.commit': -6 }, result: '신라와의 국경이 조용해졌고 수는 구실이 하나 줄었습니다.' }] });
    T.push({ y: 610, place: 'pyeongyang', title: '담징과 법정 — 일본으로 건너간 문물', hint: '', src: '일본서기 추고기 18년(610)',
      text: ['왜(일본)의 쇼토쿠 태자 아래에서 불교와 대륙 문물이 꽃핍니다. 고구려의 승려와 학자들이 일본으로 건너가 불교·회화·지묵 기술을 전합니다.'],
      note: '일본서기: 610년 고구려 왕이 승려 담징·법정을 보냈습니다. 담징은 오경에 밝고 채색·종이·먹 만드는 법을 전했다고 기록되며, 법륭사 금당벽화와의 관련은 후대 전승입니다. 승려 혜자는 이전부터 쇼토쿠 태자의 스승이었습니다.',
      hist: { label: '담징과 법정을 일본에 보내 지묵·불교 문물을 전한다', hint: '왜와의 우호가 깊어진다.', fx: { gold: -4 }, rel: { wa: 16 }, realm: { intel: 3 }, flags: { wa_friend: true }, result: '왜 조정이 크게 기뻐했습니다. 뒷날 수와 싸울 때 왜는 우호적 중립을 지킵니다.' },
      alts: [{ label: '문물 교류보다 수를 막을 군비에 재물을 쏟는다', hint: '[가상]', fx: { gold: -6 }, realm: { train: 4, defense: 4 }, result: '요동 성들이 보강되었습니다.' }] });
    T.push({ y: 612, m: '정월~7월', place: 'yodongseong', zoom: 900, title: '수 양제의 대원정 — 살수', hint: '수 양제가 대원정을 준비한다는 소식이 이어집니다. 성을 보강하고 군량을 쌓아 두십시오.', src: SRC + ' 23년',
      text: ['수 양제가 탁군에 군을 집결시키고 <b>113만 3천 8백</b>(사료 수치, 과장 가능)을 거느려 출병했습니다. 요동성은 쉽게 떨어지지 않고, 수의 장수 우중문·우문술은 <b>별동대 30만 5천</b>을 평양으로 보냅니다.', '막리지 <b>을지문덕</b>이 직접 적진에 가서 항복하는 척 허실을 살피고 돌아왔습니다. 어떻게 맞서겠습니까?'],
      note: '삼국사기·수서: 612년 요동성 공방이 길어지자 수군은 별동대 30만 5천을 압록강 너머로 보냈습니다. 을지문덕은 거짓 항복으로 적정을 살핀 뒤 군량이 떨어져 지친 적을 살수(청천강)까지 끌어들여 크게 이겼고, 살아 돌아간 수군은 2천 7백뿐이었다고 합니다.',
      battle: { title: '살수 — 수 별동대와의 결전', defense: true, terrain: 1.4, gen: null, enemy: { name: '수 별동대', side: 'tang', total: 110000, scale: 'tang', ref: 140, terrain: 1, morale: 58, mix: { line: .5, horse: .2, archer: .1, elite: .1, levy: .1 } },
        tactics: [{ label: '요동 성들에 청야 수성, 별동대는 거짓 패배로 유인해 살수에서 친다', hint: '실제 역사의 을지문덕 계책. 적의 군량과 사기를 먼저 깎는다.', tag: '역사', ours: { ambush: true, terrain: 1.7, morale: 6, enemyAmbush: false } }, { label: '압록강 앞 야전에서 결전한다', hint: '[가상] 병력 열세가 그대로 드러난다.', ours: { morale: 4 } }, { label: '성에서 나오지 않고 모든 성을 굳게 지킨다', hint: '[가상] 소모전. 수의 대군도 군량이 문제.', ours: { terrain: 1.9 } }],
        win: { title: '살수대첩', text: ['수 별동대가 청천강에서 무너졌습니다. 양제는 전군을 거두었고, 수는 이 전쟁으로 기울기 시작합니다.'], fx: { morale: 14, people: 6, gold: 10 }, world: { 'tang.p': -12, 'tang.commit': -15 }, realm: { royal: 5 } },
        costly: { title: '살수 — 힘겨운 승리', text: ['큰 희생을 치르고 수의 별동대를 물리쳤습니다.'], fx: { morale: 4, people: -4 }, world: { 'tang.commit': -8 } },
        lose: { title: '살수 — 패전', text: ['수 별동대의 압도적 병력 앞에 방어선이 무너졌습니다. 요동의 성들이 하나둘 포위되었습니다.'], fx: { morale: -12, people: -8, food: -12 }, realm: { defense: -10, royal: -5 }, army: { baekje_bangun: -3000 }, world: { 'tang.commit': 5 } },
        loseEnd: { kind: 'conquered', title: '살수의 패전 — 고구려의 위기', text: '수 양제의 대군이 요동을 휩쓸고 평양까지 내려왔습니다. 고구려는 이후 수와의 관계를 되돌리지 못하고 나라의 틀이 크게 흔들렸습니다. (실제 역사에서 고구려는 이 싸움에서 이겼습니다.)' } } });
    T.push({ y: 613, m: '4~6월', place: 'yodongseong', title: '2차 원정 — 양현감의 반란', hint: '', src: SRC + ' 24년',
      text: ['이듬해 양제가 다시 요동을 칩니다. 요동성을 20일 넘게 에워쌌으나, 후방에서 예부상서 <b>양현감</b>이 반란을 일으켰다는 급보가 전해지자 수군은 야반에 물러갑니다.'],
      note: '삼국사기·수서: 613년 수 양제의 2차 원정은 양현감의 반란 소식으로 중단되었고, 수군은 서둘러 철수하다 군수물자를 버렸습니다.',
      hist: { label: '철수하는 수군을 추격해 타격한다', hint: '수의 기세를 꺾지만 우리도 지친다.', fx: { food: -6, gold: 6, morale: 6 }, world: { 'tang.p': -6, 'tang.commit': -6 }, army: { baekje_bangun: -400 }, result: '추격군이 수의 후미를 끊어 군수품을 얻었습니다. 그러나 양제는 반드시 다시 올 것입니다.' },
      alts: [{ label: '추격은 접고 성 보수와 군량 비축에 힘쓴다', hint: '[가상]', fx: { food: 6 }, realm: { defense: 7, econ: 3 }, result: '성들이 보강되어 다음 원정에 대비합니다.' }] });
    T.push({ y: 614, m: '7~9월', place: 'bisaseong', last: true, title: '3차 원정 — 곡사정의 송환', hint: '', src: SRC + ' 25년',
      text: ['양제가 세 번째로 요동에 옵니다. 수의 장수 내호아가 바다로 와 비사성을 함락시켰습니다. 그러나 수의 나라 안은 반란으로 들끓고, 고구려도 오랜 싸움으로 지쳤습니다.', '양제는 수에서 도망쳐 고구려에 와 있던 <b>곡사정</b>을 돌려달라 합니다. 이를 구실로 군을 거두려는 뜻입니다.'],
      note: '삼국사기 614년: 수 양제가 요동에 다시 이르러 비사성을 함락시켰습니다. 고구려가 수의 도망자 곡사정을 송환하며 화친을 청하자 양제는 이를 받아들여 군을 돌렸습니다. 이후 수는 내란으로 무너집니다(618).',
      hist: { label: '곡사정을 돌려보내 화친하고 수의 철군을 이끌어낸다', hint: '체면은 양제에게 준다. 나라는 지킨다.', fx: { gold: -6, people: 4 }, rel: { tang: 10 }, world: { 'tang.commit': -12 }, result: '양제는 곡사정을 데리고 돌아갔습니다. 4년 뒤 수는 무너지고, 고구려는 영양왕의 마지막 해를 맞습니다.' },
      alts: [{ label: '곡사정을 송환하지 않고 끝까지 맞선다', hint: '[가상] 수의 약세를 믿고 버틴다.', fx: { food: -8, morale: 4 }, realm: { defense: 5 }, world: { 'tang.commit': 6 }, result: '수의 병력은 흩어지고 있었으나 요동 일대는 오래 시달렸습니다.' }, { label: '화친은 받되 요동 방면 반격으로 이득을 챙긴다', hint: '[가상]', fx: { gold: 8, food: -5 }, rel: { tang: -4 }, result: '철군하는 수의 후미를 쳐 약간의 전리품을 얻었습니다.' }] });

    SG.makeScenario({
      id: 'yeongyang', king: '영양왕', sub: '고구려 26대 왕 · 598~614', seal: '麗', side: 'goguryeo', country: '고구려', cap: '평양성', capPlace: 'pyeongyang', start: 598, end: 614, armyName: '고구려군',
      names: { silla: '신라', goguryeo: '백제', tang: '수', wa: '왜' }, sides: { silla: 'silla', goguryeo: 'baekje', tang: 'tang', wa: 'wa' },
      world: { silla: { p: 45, hostility: 48 }, goguryeo: { p: 55, hostility: 10 }, tang: { p: 140, commit: 35 }, wa: { p: 30, hostility: 5 } },
      rel: { silla: 20, goguryeo: 55, tang: 40, wa: 50 }, realm: { royal: 58, train: 58, defense: 62, navy: 15, econ: 52, intel: 35 }, res: { food: 70, gold: 55, people: 55, morale: 65 },
      army: { line: 22000, garrison: 10000, elite: 4000, horse: 5000, archer: 5000, levy: 6000, guard: 1500, scout: 400, siege: 800 },
      drift: { silla: { p: 0.6 }, tang: { sched: { 598: 40, 605: 62, 610: 80, 614: 60 } }, wa: { p: 0.3 } },
      targets: [tg('w_bukhan', '신라 북한산성', 'achasan', 7000, 1.4, 12, -5, '603년 고구려군이 공격했으나 신라 진평왕의 원군에 물러남(삼국사기)', { short: '북한산성' }), tg('w_hasil', '신라 북변(하슬라 일대)', 'hasilla', 5000, 1.2, 10, -4, '608년 신라 북변을 쳐 8천 명을 사로잡음(삼국사기)'), tg('w_chungju', '신라 한강 상류 거점(충주 일대)', 'chungju', 8000, 1.35, 14, -6, '이 방면 공략 기록은 영양왕 대에 없음(가상)')],
      invasion: { from: 603, to: 608 }, timeline: T, histCmds: ['fortify', 'scouts'],
      intro: { era: '598년 · 요서', title: '영양왕 — 대륙을 통일한 수와의 대결', focus: [123.17, 41.27, 1500], go: '598년, 수의 압박이 시작되다',
        text: ['당신은 <b>고구려 26대 영양왕</b>(재위 590~618)입니다. 수나라가 오랜 분열을 끝내고 중국을 통일하자, 동북의 고구려를 견제하기 시작합니다. 왕은 말갈·거란을 규합하며 요서까지 영향력을 넓혔습니다.', '앞으로의 16년은 <b>수 문제·양제와의 전쟁</b>이 중심입니다. 사료에 남은 해(598·600·603·608·610·612·613·614)에 역사의 갈림길이 오며, 그 사이 해마다 정무로 군비·외교·내정을 쌓아 갑니다. 문장으로 "성을 보수하라 / 신라를 공격하라" 해도 참모가 해석합니다.'],
        note: '이 시대의 영역은 학설이 갈려 영역 색을 칠하지 않았습니다. 수의 병력 수치(113만·30만 5천)는 사료의 과장 가능성이 큰 값입니다.' },
      real: '실제로는 598년 수 문제의 30만이 실패하고, 612년 을지문덕의 살수대첩으로 수 양제의 별동대 30만 5천이 무너졌으며 613·614년에도 수는 성과 없이 물러났습니다. 618년 수는 멸망하고 영양왕도 같은 해 세상을 떠났습니다.',
      endNote: { hegemon: '고구려는 수의 침공을 물리친 뒤 남쪽으로 세력을 넓혀 한강 유역까지 영향력을 넓혔습니다. (가상의 결말입니다.)', prosper: '고구려는 수와의 전쟁을 이겨내고 국력을 다졌습니다. 수가 무너진 뒤 이어질 당과의 대결에 대비할 수 있게 되었습니다.' } });
  })();

  /* ───────── 보장왕 ───────── */
  (function () {
    var SRC = '삼국사기 고구려본기 보장왕';
    var T = [];
    T.push({ y: 642, m: '10월', place: 'pyeongyang', title: '연개소문의 정변 — 옹립된 왕', hint: '', src: SRC + ' 즉위년 · 열전 개소문',
      text: ['동부대인 <b>연개소문</b>이 대신 100여 명을 연회에 불러 죽이고 영류왕을 시해했습니다. 그는 왕의 조카 장(臧)을 새 왕으로 세웠습니다 — 당신, 보장왕입니다. 연개소문은 막리지(대막리지) 자리에 올라 병권과 국정을 쥡니다.', '나라는 당신이 아니라 그의 것입니다. 어떻게 사시겠습니까?'],
      note: '삼국사기·열전: 642년 연개소문이 정변을 일으켜 영류왕과 대신 100여 명을 죽이고 왕의 조카 장을 세워 스스로 막리지가 되었습니다. 그는 병권을 쥐고 국정을 마음대로 했습니다.',
      hist: { label: '연개소문에게 순종하며 때를 기다린다', hint: '왕권은 낮지만 정치는 안정된다.', realm: { royal: -2, defense: 4, train: 4 }, fx: { morale: 3 }, flags: { puppet_ok: true }, result: '연개소문은 군사를 정비하고 당과의 대결을 준비합니다. 왕은 얌전히 옥새를 내줍니다.' },
      alts: [{ label: '연개소문의 정적들과 몰래 손잡아 권력을 되찾으려 한다', hint: '[가상] 실패하면 파국이다.', fn: function (g, S) { if (S.roll() < 0.3) { return g.sb.eff({ realm: { royal: 14 }, fx: { people: 3 } }) + '<div class="quote">음모는 은밀히 진행되어 연개소문의 측근 몇을 제거하는 데 성공했습니다. 그러나 그의 반격이 뒤따를 것입니다.</div>'; } return g.sb.eff({ realm: { royal: -18 }, fx: { morale: -5 } }) + '<div class="quote">음모는 발각되었습니다. 연개소문은 왕을 죽이지 않았으나 궁에서 모든 힘을 빼앗았습니다.</div>'; }, result: '' }, { label: '연개소문에게 적극 협력하고 군정을 함께 챙긴다', hint: '[가상] 왕이 전쟁 준비의 얼굴이 된다.', fx: { gold: -4, morale: 5 }, realm: { train: 6, royal: 2 }, result: '왕과 대막리지가 한 몸처럼 군영을 돌았습니다.' }] });
    T.push({ y: 643, m: '3월', place: 'pyeongyang', title: '도교를 들이다', hint: '', src: SRC + ' 2년',
      text: ['연개소문은 유교·불교·도교가 모두 있어야 한다며 당에 도사를 청하자고 합니다. 당 태종은 도사 8명과 『도덕경』을 보냅니다. 한편 당과의 관계는 서서히 식고 있습니다.'],
      note: '삼국사기 643년 3월: 연개소문이 왕에게 당에 사신을 보내 도교를 청하게 했고, 당 태종이 도사 8명과 『도덕경』을 보냈습니다. 왕은 불교 사원을 도관으로 삼았다고 전합니다.',
      hist: { label: '당에서 도사를 들이고 사찰 일부를 도관으로 삼는다', hint: '불교 세력이 불만을 갖는다.', fx: { people: -2 }, rel: { tang: 6 }, realm: { royal: 1 }, flags: { daoism: true }, result: '도사들이 평양에 자리를 잡았습니다. 불교계는 불만이었으나 당과의 문서 왕래는 이어졌습니다.' },
      alts: [{ label: '도교 수입은 미루고 불교 세력과 결속한다', hint: '[가상]', fx: { gold: -4, people: 3 }, realm: { royal: 3 }, flags: { buddhist: true }, rel: { tang: -3 }, result: '불교계가 왕의 신중함을 환영했습니다.' }] });
    T.push({ y: 644, place: 'pyeongyang', title: '당 사신 상리현장의 경고', hint: '', src: SRC + ' 3년',
      text: ['당 태종은 사농승 <b>상리현장</b>을 보내 고구려에 신라 공격을 중지하라 이릅니다. 연개소문은 "신라가 우리 땅을 빼앗았다"며 거부합니다. 사신은 돌아가 태종에게 이 말을 전할 것입니다.'],
      note: '삼국사기 644년: 당 태종이 상리현장을 보내 고구려에 신라를 공격하지 말라고 타일렀으나 연개소문은 듣지 않았고 상리현장을 가두려 했다고 전합니다. 이를 구실로 태종은 고구려 정벌을 결심합니다.',
      hist: { label: '신라 공격 중지 요구를 거부한다', hint: '당의 개입 의지가 급격히 오른다.', fx: { morale: 3 }, rel: { tang: -14 }, world: { 'tang.commit': 18 }, result: '연개소문은 사신을 강경하게 돌려보냈습니다. 장안에서는 고구려 정벌의 논의가 시작됩니다.' },
      alts: [{ label: '신라와 휴전해 당의 구실을 없앤다', hint: '[가상] 연개소문의 반발이 크다.', realm: { royal: -4 }, rel: { tang: 12, silla: 12 }, world: { 'tang.commit': -12, 'silla.hostility': -10 }, fx: { morale: -2 }, result: '사신은 만족했으나 연개소문은 왕의 독단에 분노합니다.' }] });
    T.push({ y: 645, m: '4~9월', place: 'ansi', zoom: 900, title: '안시성 — 당 태종의 친정', hint: '당 태종이 직접 고구려 정벌에 나설 기미가 큽니다. 성 보수와 군량 확보가 시급합니다.', src: SRC + ' 4년',
      text: ['645년 4월 당 태종이 이세적·이도종 등과 대군을 이끌고 요동을 칩니다. 개모성·요동성·백암성이 차례로 함락되고, 마침내 대군이 <b>안시성</b> 앞에 이릅니다. 성주는 항복을 거부합니다.', '당군은 성 동남쪽에 토산을 쌓아 성을 덮으려 하고, 고구려는 성벽을 높여 맞섭니다.'],
      note: '삼국사기 645년: 당군은 안시성을 60여 일 공격했으나 함락시키지 못했고, 겨울이 오고 군량이 떨어지자 철군했습니다. 성주의 이름은 삼국사기에 전하지 않습니다(후대에 양만춘 등으로 불리나 근거가 약함). 태종은 성주에게 비단 100필을 내려 충성을 칭찬했다고 합니다.',
      battle: { title: '안시성 공방', defense: true, terrain: 1.8, enemy: { name: '당군', side: 'tang', total: 90000, scale: 'tang', ref: 140, terrain: 1, morale: 70, mix: { line: .4, horse: .2, elite: .1, archer: .15, crossbow: .1, siege: .05 } },
        tactics: [{ label: '성을 굳게 지키며 성벽을 높여 토산에 맞선다', hint: '실제 역사의 안시성 수성. 지구전으로 겨울을 기다린다.', tag: '역사', ours: { terrain: 2.0 } }, { label: '성 밖으로 나가 당군 토산 공사를 기습한다', hint: '[가상] 위험하지만 당군의 공사를 늦춘다.', ours: { ambush: true, terrain: 1.5 } }, { label: '안시성을 비우고 평양 방어선으로 물러난다', hint: '[가상] 당군에게 길을 열어 주는 선택.', ours: { terrain: 1.0, morale: -8 } }],
        win: { title: '안시성을 지켜내다', text: ['60여 일의 공격에도 안시성은 무너지지 않았고, 겨울과 군량난 속에 당 태종은 군을 돌렸습니다.'], fx: { morale: 12, people: 6, gold: 8 }, world: { 'tang.commit': -4, 'tang.p': -5 }, realm: { royal: 3 } },
        costly: { title: '안시성 — 상처뿐인 승리', text: ['성은 지켰으나 요동 일대가 크게 상했습니다.'], fx: { morale: 3, people: -5, food: -10 }, realm: { defense: -6 }, world: { 'tang.commit': 2 } },
        lose: { title: '안시성 함락', text: ['안시성이 무너지자 당군은 평양으로 향합니다.'], fx: { morale: -14, people: -10 }, realm: { defense: -12, royal: -6 }, army: { baekje_bangun: -4000 }, world: { 'tang.commit': 10 } } } });
    T.push({ y: 648, place: 'yodongseong', title: '끊임없는 당의 소규모 침공', hint: '', src: SRC + ' 6~7년',
      text: ['안시성 이후에도 당은 해마다 소규모 군을 보내 변경을 괴롭힙니다. 이세적·설만철 등이 요동과 박작성을 노립니다. 전면전은 아니지만 해마다 논밭이 파괴됩니다.'],
      note: '삼국사기·구당서: 647~649년에 걸쳐 당은 해군과 육군을 번갈아 보내 고구려 변경을 소모시키는 전략을 썼습니다. 648년 설만철의 수군이 압록강 하구 박작성 방면을 공략했습니다.',
      hist: { label: '변경 성에서 방어에 집중하며 당의 소모전을 견딘다', hint: '피해는 적지만 해마다 지친다.', fx: { food: -8, people: -3 }, realm: { defense: 5, train: 3 }, result: '소규모 공격은 막아냈으나 변경 농민들의 피해가 누적됩니다.' },
      alts: [{ label: '당의 약한 고리인 해로 거점을 선제 공격한다', hint: '[가상] 수군이 있어야 한다.', fx: { gold: -6, food: -4, morale: 3 }, realm: { navy: 6 }, world: { 'tang.commit': 6 }, result: '서해 연안에서 소규모 교전이 벌어졌으나 당의 의지는 오히려 굳어졌습니다.' }] });
    T.push({ y: 655, m: '1월', place: 'chiljungseong', zoom: 1100, title: '백제와 함께 신라 33성을 치다', hint: '', src: SRC + ' 14년',
      text: ['백제 의자왕과 말갈이 손잡고 신라 북변을 치자고 합니다. 성공하면 신라는 크게 흔들리지만, 신라는 당에 호소할 것입니다.'],
      note: '삼국사기 655년 정월: 고구려가 백제·말갈과 함께 신라 북변 33성을 공격하자 신라 왕이 당에 표를 올려 구원을 요청했습니다.',
      hist: { label: '백제·말갈과 함께 신라 33성을 공격한다', hint: '성과를 얻지만 당의 개입이 굳어진다.', fx: { gold: 14, morale: 5, food: -8 }, world: { 'silla.p': -8, 'silla.hostility': 12, 'tang.commit': 8 }, rel: { goguryeo: 12, silla: -12 }, flags: { took_north: true }, fn: function (g, S) { S.captured.w_north = 655; }, result: '신라 북변 여러 성이 흔들렸고, 신라 왕은 당에 구원을 청했습니다.' },
      alts: [{ label: '이번에는 가담하지 않고 당과의 정면 충돌에 대비한다', hint: '[가상]', fx: { food: 6 }, realm: { defense: 6, train: 4 }, rel: { goguryeo: -8 }, result: '백제는 서운해했으나 요동의 대비는 굳어졌습니다.' }] });
    T.push({ y: 660, m: '7월', place: 'sabi', title: '백제의 멸망', hint: '백제가 위태롭다는 소식이 곧 올 것입니다.', src: '삼국사기 신라본기 7년 · 백제본기 20년',
      text: ['나당 연합군이 사비성을 함락시키고 의자왕이 항복했습니다. 동맹이었던 백제가 하루아침에 사라졌습니다. 이제 당의 칼끝은 고구려를 향합니다.'],
      note: '660년 7월 백제가 멸망했고 고구려는 구원군을 보내지 않았다고 전해집니다(사료에 고구려의 백제 구원 기사는 없음). 당은 이듬해부터 평양성을 직접 노립니다.',
      hist: { label: '백제를 구원하지 못하고 북방 방비에 집중한다', hint: '당의 다음 목표가 고구려임을 직시한다.', fx: { food: -4, morale: -3 }, realm: { defense: 6, train: 4 }, world: { 'tang.commit': 6, 'goguryeo.p': -40 }, result: '사비 함락의 충격이 평양에도 전해졌습니다. 연개소문은 변경 군을 증강합니다.' },
      alts: [{ label: '신라 북변을 쳐 나당 연합을 견제한다', hint: '[가상] 신라의 후방을 흔든다.', fx: { food: -8, gold: -4, morale: 4 }, world: { 'silla.hostility': 8, 'silla.p': -4 }, result: '신라 북변에서 교전이 벌어져 신라는 군을 분산시켜야 했습니다.' }, { label: '백제 부흥군에 군량과 병력을 보내 지원한다', hint: '[가상] 백제 부흥운동에 힘을 보탠다.', fx: { food: -10, gold: -6 }, rel: { goguryeo: 4 }, world: { 'tang.commit': 5 }, result: '부흥군에 군량이 전달되었고 지수신 등의 항전이 이어집니다.' }] });
    T.push({ y: 662, m: '정월', place: 'pyeongyang', zoom: 900, title: '평양성 포위와 사수 전투', hint: '', src: SRC + ' 21년 · 열전 개소문',
      text: ['당의 소정방이 평양성을 포위하고, 방효태의 군이 <b>사수</b>(대동강 지류로 비정) 가에 진을 칩니다. 연개소문의 아들 <b>남생</b>이 군을 이끌고 맞섭니다.'],
      note: '삼국사기·구당서: 661~662년 소정방이 평양성을 포위했으나 겨울 추위와 군량 문제, 사수에서 방효태의 군이 연개소문의 아들 남생에게 몰살되는 일이 있어 662년 2월 철군했습니다.',
      battle: { title: '사수 전투', commit: 0.7, enemy: { name: '방효태군', side: 'tang', total: 30000, scale: 'tang', ref: 140, terrain: 1, mix: { line: .5, horse: .2, archer: .15, elite: .1, crossbow: .05 } },
        tactics: [{ label: '남생이 강가에서 포위 섬멸을 노린다', hint: '실제 역사. 방효태의 군이 사수 가에서 전멸했다.', tag: '역사', ours: { ambush: true, morale: 4 } }, { label: '정면으로 결전한다', hint: '[가상]', ours: {} }, { label: '평양성에 농성하며 당군이 지치기를 기다린다', hint: '[가상]', ours: { terrain: 1.5 } }],
        win: { title: '사수 대승', text: ['방효태의 군이 사수에서 무너졌습니다. 소정방은 포위를 풀고 물러납니다.'], fx: { morale: 10, people: 4 }, world: { 'tang.commit': -4, 'tang.p': -4 } },
        costly: { title: '사수 — 고전', text: ['큰 피해를 입고 겨우 막았습니다.'], fx: { morale: -2, people: -3 } },
        lose: { title: '사수 패전', text: ['남생의 군이 밀렸고 평양성이 위태롭습니다.'], fx: { morale: -9, people: -5 }, realm: { defense: -8 }, army: { baekje_bangun: -2000 }, world: { 'tang.commit': 6 } } } });
    T.push({ y: 666, place: 'pyeongyang', title: '연개소문의 죽음 — 아들들의 불화', hint: '연개소문의 병세가 심상치 않다는 소문입니다.', src: SRC + ' 25년 · 열전 개소문',
      text: ['연개소문이 죽었습니다. 맏아들 남생이 막리지 자리를 이었으나 지방 순시 중에 동생 남건·남산이 권력을 장악하고 그를 몰아냅니다. 남생은 국내성으로 달아나 당에 투항할 것입니다.', '왕은 오랜 세월 그림자였지만, 이 틈에 왕권을 되찾을 기회가 올 수도 있습니다.'],
      note: '삼국사기·남생 묘지명: 연개소문 사후(665~666) 맏아들 남생이 막리지가 되었으나 동생 남건·남산과의 권력 다툼으로 쫓겨나 667년 당에 투항, 당군의 길잡이가 되었습니다. 이 내분이 고구려 멸망의 직접적 계기가 되었습니다.',
      hist: { label: '형제 다툼에 개입하지 않고 상황을 지켜본다', hint: '내분이 번지고 당의 침공이 앞당겨진다.', fx: { morale: -6, people: -4 }, realm: { royal: 6 }, world: { 'tang.commit': 14, 'tang.p': 5 }, result: '남생이 당에 투항해 국내성 일대 성들이 당에 붙었습니다. 고구려의 방벽이 안에서부터 무너지기 시작했습니다.' },
      alts: [{ label: '왕명으로 남생과 남건 사이를 중재하고 단결을 호소한다', hint: '[가상] 왕권이 서면 효과가 있다.', fn: function (g, S) { if (S.realm.royal >= 22 && S.roll() < 0.6) { return g.sb.eff({ fx: { morale: 6, people: 4 }, realm: { royal: 8 }, world: { 'tang.commit': -4 } }) + '<div class="quote">형제는 한동안 칼을 거두었고 군도 흔들림을 멈췄습니다.</div>'; } return g.sb.eff({ fx: { morale: -4 }, realm: { royal: -3 }, world: { 'tang.commit': 10 } }) + '<div class="quote">중재는 받아들여지지 않았고 남생은 끝내 당에 투항했습니다.</div>'; }, result: '' }, { label: '남건을 지지해 국난을 수습하게 하고 군권을 넘긴다', hint: '[가상] 항전 체제 강화, 왕권은 더 약해진다.', fx: { morale: 4 }, realm: { train: 5, royal: -6 }, world: { 'tang.commit': 8 }, result: '남건 체제가 항전을 굳혔으나 남생을 따르는 성들은 이미 흔들렸습니다.' }] });
    T.push({ y: 668, m: '9월', place: 'pyeongyang', zoom: 900, last: true, title: '평양성 — 나당 연합의 마지막 공격', hint: '', src: SRC + ' 27년',
      text: ['이적이 이끄는 당군과 신라군이 평양성을 에워쌌습니다. 한 달 남짓 버티던 평양성에서 승려 <b>신성</b>이 성문을 열어 주는 배신이 일어납니다. 남건은 항전을 이어 가려 합니다.', '왕은 이 마지막 결단의 자리에 서 있습니다.'],
      note: '삼국사기 668년: 당 이적과 신라군이 평양성을 포위한 지 한 달여 만에 성이 떨어졌고 보장왕은 항복했습니다. 당은 고구려 땅에 안동도호부를 두고 보장왕과 왕족·백성 수만 명을 당으로 데려갔습니다.',
      battle: { title: '평양성 마지막 방어전', defense: true, terrain: 1.45, loseEnd: { kind: 'conquered', title: '평양성 함락 — 고구려의 멸망', text: '평양성이 무너지고 보장왕은 항복했습니다. 당은 안동도호부를 설치했고, 705년의 역사를 이어 온 고구려는 막을 내렸습니다. 유민들은 부흥운동과 훗날 발해로 이어집니다.' },
        enemy: { name: '나당 연합군', side: 'tang', total: 140000, scale: 'tang', ref: 140, terrain: 1, morale: 72, mix: { line: .5, horse: .15, elite: .1, archer: .1, crossbow: .1, siege: .05 } },
        tactics: [{ label: '성문과 성벽을 굳게 지키며 구원을 기다린다', hint: '실제 역사의 수성. 내부 배신이 변수다.', tag: '역사', ours: { terrain: 1.9 } }, { label: '정예를 모아 성 밖으로 나가 당군 포위망을 깨려 한다', hint: '[가상] 큰 도박.', ours: { morale: 6, ambush: true } }, { label: '내부 불화를 수습하고 성 안 방비를 일원화한다', hint: '[가상] 왕권과 훈련이 높아야 효과.', ours: { terrain: 1.7, morale: 8 } }],
        win: { title: '평양성을 지키다', text: ['나당 연합군이 물러났습니다. 고구려는 내분 속에서도 마지막 위기를 넘겼습니다. (실제 역사와 다릅니다.)'], fx: { morale: 10, people: 5 }, world: { 'tang.commit': -10 } },
        costly: { title: '평양성 — 처참한 승리', text: ['성은 지켰으나 나라의 힘이 바닥났습니다.'], fx: { morale: -4, people: -8 } },
        lose: { title: '', text: [''], fx: {} } } });

    SG.makeScenario({
      id: 'bojang', king: '보장왕', sub: '고구려 28대 왕 · 642~668', seal: '麗', side: 'goguryeo', country: '고구려', cap: '평양성', capPlace: 'pyeongyang', start: 642, end: 668, armyName: '고구려군',
      names: { silla: '신라', goguryeo: '백제', tang: '당', wa: '왜' }, sides: { silla: 'silla', goguryeo: 'baekje', tang: 'tang', wa: 'wa' },
      world: { silla: { p: 55, hostility: 52 }, goguryeo: { p: 60, hostility: 10 }, tang: { p: 140, commit: 30 }, wa: { p: 30, hostility: 5 } },
      rel: { silla: 15, goguryeo: 68, tang: 35, wa: 45 }, realm: { royal: 24, train: 60, defense: 65, navy: 15, econ: 48, intel: 35 }, res: { food: 65, gold: 50, people: 55, morale: 62 },
      army: { line: 24000, garrison: 12000, elite: 5000, horse: 6000, archer: 5000, levy: 7000, guard: 2500, scout: 500, siege: 1000 },
      drift: { silla: { p: 0.8 }, tang: { sched: { 642: 35, 644: 58, 650: 62, 660: 82, 666: 90 } }, wa: { p: 0.3 } },
      cmds: [{ id: 'appease_yeon', cat: '특수', name: '대막리지 연개소문 달래기', desc: '연개소문에게 예를 다해 왕권의 숨통을 틔웁니다. (왕권 소폭 회복)', cost: { gold: 6 }, hist: '가상', cd: 2, eff: { realm: { royal: 5 } }, lines: ['왕은 대막리지에게 공을 돌리며 하례를 올렸습니다.'] },
        { id: 'plot_yeon', cat: '특수', name: '연개소문 제거 음모 (가상)', desc: '대막리지를 몰아낼 음모를 꾸밉니다. 성공하면 왕권이 크게 오르고, 실패하면 파국입니다.', cost: { gold: 10 }, hist: '가상', cd: 6, eff: {}, fn: function (g, S) { var ok = S.roll() < 0.2 + S.realm.intel / 300; return ok ? { realm: { royal: 20 }, fx: { people: 2 }, text: '음모는 성공하여 연개소문의 힘이 크게 꺾였습니다.' } : { realm: { royal: -20 }, fx: { morale: -6 }, text: '음모가 발각되어 왕은 연개소문에게 거의 모든 권한을 빼앗겼습니다.' }; }, lines: ['은밀한 모임이 거듭되었습니다.'] }],
      targets: [tg('w_north', '신라 북변 33성', 'chiljungseong', 7000, 1.3, 18, -7, '655년 고구려·백제·말갈이 신라 33성을 공격(삼국사기)', { from: 650 }), tg('w_hasil', '신라 하슬라 방면', 'hasilla', 5000, 1.2, 10, -4, '이 방면 공격은 보장왕 대 사료에 구체 기록 없음(가상)'), tg('w_chungju', '신라 한강 상류(충주 일대)', 'chungju', 8500, 1.35, 14, -6, '이 방면 공략 기록은 없음(가상)')],
      invasion: { from: 650, to: 666 }, timeline: T, histCmds: ['fortify', 'scouts'],
      intro: { era: '642년 · 평양성', title: '보장왕 — 그림자 왕과 대막리지', focus: [125.75, 39.02, 1400], go: '642년, 옹립의 날',
        text: ['당신은 <b>고구려 28대 보장왕</b>(재위 642~668)입니다. 영류왕의 조카로, 연개소문이 정변을 일으킨 날 왕으로 세워졌습니다. 연개소문은 대막리지로 나라를 쥐고, 당과의 정면 대결로 나아갑니다.', '이 이야기에서 <b>왕권은 처음부터 낮습니다</b>. 왕권이 0이 되면 정변으로 쫓겨납니다. 연개소문을 달래거나 제거할 음모를 꾸미는 것도 가능하지만 그 결과는 장담할 수 없습니다. 사료에 남은 해(642·643·644·645·648·655·660·662·666·668)에는 역사의 갈림길이 옵니다.'],
        note: '고구려 후기의 영토 경계는 학설이 갈려 영역 색을 칠하지 않았습니다. 당 병력 수치는 사료의 과장 가능성이 있습니다.' },
      real: '실제로는 645년 안시성에서 당 태종이 물러났고, 662년 사수 전투에서 연개소문의 아들 남생이 당군을 격파했습니다. 그러나 연개소문 사후 아들들의 내분으로 남생이 당에 투항(667)하고 668년 평양성이 함락되어 보장왕은 당으로 압송되었습니다.',
      endNote: { prosper: '고구려는 연개소문 사후의 내분을 수습하고 당의 마지막 공세를 견뎌냈습니다. (실제 역사와 다른 가상의 결말입니다.)', steady: '고구려는 668년의 위기를 겨우 넘겼으나, 더 큰 시련이 기다리고 있습니다. (가상)' } });
  })();
})();

;
/* ==== js/data/sc_baekje.js ==== */
window.__sgL=4;
/* 백제 왕 3명(의자왕 외): 근초고왕(360~375) · 개로왕(455~475) · 성왕(538~554).
 * 근거: 삼국사기 백제본기·고구려본기·신라본기, 송서·일본서기 일부. 수치는 게임 추상화 값, 사료에 없는 갈래는 '가상'. */
(function () {
  function tg(id, name, place, garrison, terrain, gold, power, hist, extra) { return Object.assign({ id: id, name: name, place: place, garrison: garrison, terrain: terrain, gold: gold, people: 2, power: power, hist: hist }, extra || {}); }

  /* ───────── 근초고왕 ───────── */
  (function () {
    var SRC = '삼국사기 백제본기 근초고왕';
    var T = [];
    T.push({ y: 366, m: '3월 · 368년', place: 'seorabeol', zoom: 1500, title: '신라와 사신을 주고받다', hint: '남쪽의 신라가 통교를 청해 올 조짐이 있습니다.', src: SRC + ' 21~23년',
      text: ['346년 즉위한 왕은 마한 잔여 세력과 북쪽 고구려 사이에서 나라를 키워 왔습니다. 동쪽의 신라는 아직 작은 나라이나, 고구려를 견제할 이웃으로 쓸모가 있습니다. 신라 사신이 다녀가고, 왕은 좋은 말 두 필을 보내 예를 갖춥니다.'],
      note: '삼국사기: 근초고왕 대에 신라와 사신이 오갔고(366년 전후), 368년 봄 백제가 신라에 좋은 말 두 필을 보냈다는 기사가 있습니다. 이는 훗날 나제동맹의 초기 형태로 이해됩니다.',
      hist: { label: '신라와 사신을 교환하고 좋은 말을 선물한다', hint: '고구려를 견제할 뒷길이 열린다.', fx: { gold: -5 }, rel: { goguryeo: 14 }, world: { 'silla.hostility': 2 }, result: '신라와의 우호가 열렸습니다. 고구려는 남쪽의 이 움직임을 경계합니다.' },
      alts: [{ label: '신라와는 거리를 두고 마한 정복에 힘을 쏟는다', hint: '[가상]', fx: { food: -4 }, realm: { train: 4, defense: 3 }, result: '신라와의 접촉은 미뤄졌습니다.' }] });
    T.push({ y: 369, m: '9월', place: 'maesoseong', zoom: 1000, title: '치양 전투 — 태자 근구수의 급습', hint: '고구려가 북쪽 국경을 칠 듯합니다. 정예 기병을 준비하십시오.', src: SRC + ' 24년 · 고구려본기 고국원왕 39년',
      text: ['고구려 고국원왕이 <b>2만 군</b>을 이끌고 치양(황해도 배천 일대로 비정)에 이르렀습니다. 태자 <b>근구수</b>가 방어를 맡습니다. 적은 우리를 얕보고 진을 풀고 있습니다.'],
      note: '삼국사기: 369년 9월 고구려 왕이 2만 군을 이끌고 치양에 이르러 민가를 약탈하자 왕은 태자에게 군을 주어 방어하게 했고, 태자가 지름길로 급습해 5천여 명을 사로잡았습니다. 11월에는 한수 남쪽에서 대열병을 열어 황색 깃발을 썼습니다.',
      battle: { title: '치양 전투', defense: true, terrain: 1.2, enemy: { name: '고구려군', side: 'goguryeo', total: 27000, scale: 'silla', ref: 60, terrain: 1, morale: 66, mix: { line: .5, horse: .2, archer: .15, levy: .15 } },
        tactics: [{ label: '태자가 지름길로 기병을 몰아 급습한다', hint: '실제 역사. 방심한 적의 옆구리를 찌른다.', tag: '역사', ours: { ambush: true, morale: 5 } }, { label: '성에 의지해 정면 방어한다', hint: '[가상]', ours: { terrain: 1.5 } }, { label: '적이 약탈에 지치길 기다려 반격한다', hint: '[가상]', ours: { terrain: 1.25, morale: 3 } }],
        win: { title: '치양 대승', text: ['고구려군 5천여 명이 포로가 되고 나머지는 달아났습니다. 이어 한수 남쪽에서 대열병을 열고 황색 깃발을 세웠습니다.'], fx: { gold: 12, morale: 10, people: 4 }, world: { 'silla.p': -8, 'silla.hostility': 8 }, realm: { royal: 4 } },
        costly: { title: '치양 — 힘겨운 승리', text: ['피해가 컸으나 고구려군을 물리쳤습니다.'], fx: { morale: 2, people: -2 }, world: { 'silla.hostility': 5 } },
        lose: { title: '치양 패전', text: ['고구려군의 기세에 변경이 짓밟혔습니다.'], fx: { morale: -9, people: -5, food: -8 }, realm: { defense: -6 }, world: { 'silla.p': 4 } } } });
    T.push({ y: 370, place: 'gomamiji', zoom: 1500, title: '남쪽의 마한 잔여 세력을 아우르다', hint: '', src: '학설(삼국사기에는 직접 기사가 없음)',
      text: ['북쪽을 막았으니 이제 남쪽입니다. 영산강 유역에는 아직 마한 잔여 세력이 남아 있습니다. 학계에서는 근초고왕 때 백제가 전남 지역까지 영향권을 넓혔다고 봅니다.'],
      note: '삼국사기에는 근초고왕의 마한 정복이 직접 기록되지 않았습니다. 일본서기 신공기 49년(369)조의 가라 7국·남만 정벌 기사와 칠지도 명문 등을 근거로 한 학설적 서술이며, 연대와 범위에는 논쟁이 있습니다.',
      alts: [{ label: '군을 보내 영산강 유역을 복속시킨다', hint: '[학설] 영토와 인구가 늘지만 군량이 든다.', fx: { food: -10, gold: -4, people: 3 }, realm: { econ: 8, defense: 3 }, world: { 'silla.p': 0 }, army: { baekje_levy: 1000 }, result: '남쪽의 여러 소국이 복속하거나 사신을 보냈고, 곡창지대가 백제의 손에 들어왔습니다.' }, { label: '무력 대신 사신과 교역으로 남쪽 소국들을 끌어들인다', hint: '[가상] 평화적이나 더디다.', fx: { gold: -6, people: 2 }, realm: { econ: 4 }, rel: { wa: 6 }, result: '일부 소국이 자발적으로 복속했습니다.' }, { label: '남쪽은 두고 북쪽 방비에 집중한다', hint: '[가상]', fx: { food: -3 }, realm: { defense: 8, train: 4 }, result: '북쪽 방어선이 한층 단단해졌습니다.' }] });
    T.push({ y: 371, m: '겨울', place: 'pyeongyang', zoom: 900, title: '평양성 공격 — 고국원왕의 죽음', hint: '고구려가 약해진 지금이 평양성을 칠 때입니다. 군량과 정예를 충분히 쌓아 두십시오.', src: SRC + ' 26년 · 고구려본기 고국원왕 41년',
      text: ['왕은 태자와 함께 <b>3만 군</b>을 이끌고 북쪽으로 향합니다. 목표는 고구려의 평양성. 고국원왕이 직접 성 밖에서 군을 지휘하고 있습니다.', '이 싸움에서 이기면 백제는 한강에서 대동강에 이르는 힘을 가진 강국이 됩니다.'],
      note: '삼국사기: 371년 겨울 백제 왕이 태자와 함께 정병 3만을 이끌고 고구려 평양성을 공격했고, 고구려 왕이 힘써 막다가 날아온 화살에 맞아 세상을 떠났습니다(고구려본기 10월 23일). 근초고왕은 이 해 도읍을 한산으로 옮겼습니다.',
      battle: { title: '평양성 공격', commit: 0.85, enemy: { name: '고구려군', side: 'goguryeo', total: 20000, scale: 'silla', ref: 60, terrain: 1.45, morale: 72, mix: { line: .45, horse: .15, archer: .15, garrison: .15, levy: .1 } },
        tactics: [{ label: '정병 3만으로 성을 정면 공격한다', hint: '실제 역사의 방식. 고구려 왕이 성 밖에서 직접 싸웠다.', tag: '역사', ours: { morale: 6 } }, { label: '성 밖으로 유인해 야전에서 친다', hint: '[가상] 왕을 성 밖으로 끌어낸다.', ours: { ambush: true } }, { label: '성을 에워싸 군량이 다하기를 기다린다', hint: '[가상] 장기 포위. 우리 군량도 부담.', ours: { pace: 0.8, terrain: 1.1 } }],
        win: { title: '평양성 전투 — 승전', text: ['고구려 왕이 화살에 맞아 쓰러졌고 평양성 방어선이 크게 무너졌습니다. 백제의 위세가 북쪽까지 미칩니다.'], fx: { gold: 20, morale: 12, people: 5 }, world: { 'silla.p': -15, 'silla.hostility': 12 }, rel: { silla: -12 }, realm: { royal: 5 }, captureTargets: ['w_pyeongyang'] },
        costly: { title: '평양성 — 피로 얻은 승리', text: ['큰 희생을 치르고 고구려 왕을 꺾었습니다.'], fx: { gold: 10, morale: 2, people: -4 }, world: { 'silla.p': -8, 'silla.hostility': 8 } },
        lose: { title: '평양성 — 철수', text: ['성은 끝내 무너지지 않았고 군은 퇴각했습니다. 고구려의 복수가 두렵습니다.'], fx: { morale: -9, people: -4, food: -10 }, realm: { royal: -3 }, world: { 'silla.hostility': 10 } } } });
    T.push({ y: 371, place: 'hanseong', title: '한산으로 도읍을 옮기다', hint: '', src: SRC + ' 26년',
      text: ['북쪽 원정이 끝난 뒤 왕은 도읍을 <b>한산</b>(漢山)으로 옮기려 합니다. 한수 이북의 고구려 위협을 막고 해상 교통을 쥘 수 있는 곳입니다.'],
      note: '삼국사기 근초고왕 26년: 도읍을 한산으로 옮겼습니다(한산의 위치는 광주 일대와 서울 남쪽 일대 등 이설이 있습니다).',
      hist: { label: '도읍을 한산으로 옮겨 방어와 해상 교통을 노린다', hint: '왕권과 방어는 오르나 이주 비용이 든다.', fx: { gold: -12, people: -3 }, realm: { defense: 8, econ: 4, royal: 4 }, flags: { moved: true }, result: '새 도읍에 성곽과 궁궐이 서고, 한수 연안이 백제의 중심이 되었습니다.' },
      alts: [{ label: '도읍은 옮기지 않고 기존 성을 보강한다', hint: '[가상]', fx: { gold: -6 }, realm: { defense: 5 }, result: '기존 도성의 성벽이 보강되었습니다.' }] });
    T.push({ y: 372, place: 'dengzhou', title: '동진과 통교 — 책봉과 칠지도', hint: '동진과의 통교가 곧 열릴 수 있습니다.', src: SRC + ' 27년',
      text: ['왕은 바다 건너 동진에 사신을 보내 외교의 길을 엽니다. 동진은 왕에게 관작을 내릴 것입니다. 한편 왜와의 교류도 깊어집니다.'],
      note: '삼국사기 근초고왕 27년(372): 정월 동진에 사신을 보내 조공했고, 6월에 동진 간문제가 왕을 진동장군 영낙랑태수로 책봉했습니다. 일본에 전하는 칠지도(369 또는 372년 제작설)는 백제 왕이 왜왕에게 내린 것으로 해석됩니다.',
      hist: { label: '동진에 사신을 보내 책봉을 받고, 왜에는 칠지도를 내린다', hint: '국제적 위신이 높아진다.', fx: { gold: -8 }, rel: { tang: 16, wa: 16 }, realm: { royal: 5, intel: 3 }, flags: { wa_friend: true }, result: '동진의 책봉으로 백제의 위신이 높아졌고, 왜와의 군사·문물 교류가 깊어졌습니다.' },
      alts: [{ place: 'dengzhou', label: '동진과의 통교에 집중하고 왜는 후순위로 둔다', hint: '[가상]', fx: { gold: -5 }, rel: { tang: 16 }, result: '동진과의 외교가 한결 두터워졌습니다.' }] });
    T.push({ y: 375, place: 'hanseong', last: true, title: '고흥의 『서기』 — 나라의 역사를 쓰다', hint: '', src: SRC + ' 30년',
      text: ['재위 30년, 왕은 늙어 갑니다. 박사 <b>고흥</b>이 백제의 역사를 기록하겠다고 청합니다. 이 해 겨울, 왕은 한 시대를 마감하게 됩니다.'],
      note: '삼국사기 근초고왕 30년(375): 박사 고흥이 처음으로 『서기(書記)』를 지었습니다(현재 전하지 않음). 이 해 11월 왕이 세상을 떠났습니다.',
      hist: { label: '고흥에게 『서기』를 짓게 하고 후계를 정리한다', hint: '왕실의 정통성이 문서로 남는다.', fx: { gold: -6 }, realm: { royal: 6, econ: 2 }, result: '『서기』가 완성되어 백제 왕실의 계보가 남았습니다.' },
      alts: [{ label: '서기 편찬보다 태자에게 군권을 넘기고 군비를 점검한다', hint: '[가상]', realm: { train: 5, defense: 4 }, fx: { gold: -4 }, result: '후계 체제와 군비가 안정되었습니다.' }] });

    SG.makeScenario({
      id: 'geunchogo', king: '근초고왕', sub: '백제 13대 왕 · 360~375', seal: '百', side: 'baekje', country: '백제', cap: '한성', capPlace: 'hanseong', start: 360, end: 375, armyName: '백제군',
      names: { silla: '고구려', goguryeo: '신라', tang: '동진', wa: '왜' }, sides: { silla: 'goguryeo', goguryeo: 'silla', tang: 'tang', wa: 'wa' },
      world: { silla: { p: 60, hostility: 48 }, goguryeo: { p: 25, hostility: 5 }, tang: { p: 90, commit: 5 }, wa: { p: 35, hostility: 5 } },
      rel: { silla: 20, goguryeo: 55, tang: 45, wa: 60 }, realm: { royal: 55, train: 55, defense: 55, navy: 35, econ: 58, intel: 35 }, res: { food: 60, gold: 55, people: 60, morale: 65 },
      army: { line: 14000, levy: 5000, elite: 1500, horse: 3500, archer: 3500, garrison: 6000, guard: 1000, navy: 2000, scout: 300 },
      drift: { silla: { p: 0.5 }, tang: { commitTarget: 0 }, wa: { p: 0.4 } },
      targets: [tg('w_pyeongyang', '고구려 평양성', 'pyeongyang', 24000, 1.45, 20, -12, '371년 백제군 3만이 공격, 고구려 고국원왕이 전사(삼국사기)', { short: '평양성', from: 362 }), tg('w_horogoru', '고구려 남변 요새(호로고루 일대)', 'horogoru', 9000, 1.3, 12, -6, '이 방면 개별 공략 기록은 없음(가상)'), tg('w_biyeolhol', '고구려 동남 변경(비열홀 방면)', 'biyeolhol', 11000, 1.35, 14, -7, '근초고왕 대 공략 기록 없음(가상)')],
      invasion: { from: 362, to: 374 }, timeline: T, histCmds: ['tribute_tang', 'wa_envoy', 'navy', 'fortify'],
      intro: { era: '360년 · 한성', title: '근초고왕 — 백제 전성기를 연 왕', focus: [127.12, 37.53, 1800], go: '360년, 나라를 키우는 해로',
        text: ['당신은 <b>백제 13대 근초고왕</b>(재위 346~375)입니다. 마한 소국의 하나였던 백제를 한강 유역의 강국으로 키운 왕으로, 북쪽의 고구려와 남쪽의 마한 잔여 세력 사이에서 나라를 넓혀 가는 시기입니다.', '해마다 정무로 나라를 돌보고, 사료에 남은 해(366·369·370·371·372·375)에는 역사의 갈림길이 옵니다. 문장으로 "수군을 키워라 / 고구려를 공격하라"처럼 적어도 참모가 해석합니다.'],
        note: '이 시대의 영역은 학설 차이가 커서 영역 색을 칠하지 않았습니다. 마한 정복·칠지도 관련 내용은 학설을 포함합니다.' },
      real: '실제로는 369년 치양 전투에서 고구려를 격파하고, 371년 평양성 공격에서 고구려 고국원왕을 전사시켰습니다. 372년 동진의 책봉을 받고 박사 고흥이 『서기』를 지었습니다. 백제는 이때 가장 큰 영역을 이루었다고 평가됩니다.',
      endNote: { hegemon: '근초고왕의 백제는 한강에서 대동강까지 이어진 강국이 되어 고구려의 남진을 오래 가로막았습니다.', prosper: '백제는 전성기를 이어 가며 신라·왜와 동맹을 다졌습니다.' } });
  })();

  /* ───────── 개로왕 ───────── */
  (function () {
    var SRC = '삼국사기 백제본기 개로왕';
    var T = [];
    T.push({ y: 455, m: '10월', place: 'hanseong', title: '즉위와 고구려의 침공 — 신라의 원군', hint: '', src: SRC + ' 1년 · 신라본기 눌지마립간 39년',
      text: ['비유왕이 세상을 떠나자 맏아들이 즉위했습니다. 장수왕의 고구려는 남진 정책을 노골화하고, 즉위 첫해 가을 고구려가 국경을 넘습니다. 433년 이래의 나제 화친에 따라 신라가 원군을 보냅니다.'],
      note: '신라본기 눌지마립간 39년(455) 10월: 고구려가 백제를 침범하자 신라 왕이 군사를 보내 구원했습니다. 나제동맹이 실제로 작동한 기록입니다.',
      hist: { label: '신라의 원군을 받아 고구려군을 막는다', hint: '동맹이 굳어지나 신라에 빚을 진다.', fx: { food: -6, morale: 2 }, rel: { goguryeo: 14 }, realm: { defense: 3 }, result: '신라 원군이 이르자 고구려군은 물러났습니다. 나제동맹이 한층 굳어졌습니다.' },
      alts: [{ label: '신라 원군 없이 독자 방어하고 성 방비를 강화한다', hint: '[가상] 자존심을 세우나 부담이 크다.', fx: { food: -10, gold: -6 }, realm: { defense: 8, train: 4 }, rel: { goguryeo: -2 }, result: '단독 방어에 성공했으나 변경이 크게 상했습니다.' }] });
    T.push({ y: 458, place: 'dengzhou', title: '송에 관작을 청하다', hint: '', src: '송서 백제전 · ' + SRC,
      text: ['고구려를 압박하려면 바깥의 큰 나라를 끌어들여야 합니다. 남조의 송에 사신을 보내 왕과 신하 11명의 관작을 청합니다.'],
      note: '송서 백제전: 458년 개로왕이 송에 표를 올려 자신과 신하 11명의 관작을 청했습니다(행관군장군 우현왕 여기 등). 송은 이를 받아들여 관작을 내렸습니다.',
      hist: { label: '송에 사신을 보내 왕과 신하의 관작을 청한다', hint: '국제적 위신과 신료 결속이 오른다.', fx: { gold: -8 }, rel: { tang: 14 }, realm: { royal: 6 }, world: { 'tang.commit': 4 }, result: '송은 왕과 신하 열한 명에게 관작을 내렸습니다. 조정의 결속이 한결 굳어졌습니다.' },
      alts: [{ place: 'asuka', label: '송 대신 왜와 신라와의 관계를 챙긴다', hint: '[가상]', fx: { gold: -5 }, rel: { wa: 12, goguryeo: 8 }, result: '왜와 신라 사이의 우호가 두터워졌습니다.' }] });
    T.push({ y: 469, m: '8월', place: 'achasan', title: '쌍현성 수리와 청목령 목책', hint: '고구려 남변에 대한 방비를 정비할 때가 곧 옵니다.', src: SRC + ' 15년',
      text: ['고구려의 압박이 거세집니다. 북쪽 변경의 쌍현성을 고치고 청목령에 큰 목책을 세우며, 북한산성의 병력을 나누어 지키자는 건의가 올라옵니다.'],
      note: '삼국사기 469년: 8월 쌍현성을 수리하고 청목령에 큰 목책을 세웠으며 북한산성의 군사를 나누어 지키게 했습니다. 같은 해 2월 장수를 보내 고구려 남쪽 변경을 습격했다는 기사도 있습니다.',
      hist: { label: '쌍현성을 수리하고 청목령에 목책을 세워 북쪽을 굳힌다', hint: '방비 상승, 비용 증가.', fx: { gold: -8, food: -4 }, realm: { defense: 10 }, result: '북쪽 요충에 성곽과 목책이 세워졌습니다.' },
      alts: [{ label: '방비보다 선제 공격으로 고구려 남변을 친다', hint: '[가상]', fx: { food: -8, morale: 3 }, army: { baekje_levy: -300 }, world: { 'silla.hostility': 8 }, realm: { train: 3 }, result: '소규모 습격이 성공했으나 고구려의 보복이 예상됩니다.' }] });
    T.push({ y: 472, place: 'luoyang', title: '북위에 표를 올려 구원을 청하다', hint: '', src: '위서 백제전 · ' + SRC,
      text: ['고구려의 남진에 맞서려면 북위의 힘이 필요합니다. 왕은 북위 황제에게 장문의 표를 올려 고구려의 죄를 헤아리고 원병을 청합니다.'],
      note: '삼국사기·위서: 472년 개로왕이 북위에 사신을 보내 표를 올려 고구려의 횡포를 호소하며 군사를 청했으나 북위는 응하지 않았고, 개로왕은 이에 실망해 북위에 사신을 보내지 않았습니다.',
      hist: { label: '북위에 표를 올려 원병을 청한다', hint: '북위는 응하지 않는다. 고구려의 경계가 올라간다.', fx: { gold: -6 }, rel: { tang: 8 }, world: { 'silla.hostility': 10 }, result: '북위는 먼 길을 이유로 원병을 보내지 않았습니다. 고구려는 이 일을 들어 알고 더욱 경계합니다.' },
      alts: [{ place: 'seorabeol', label: '북위에 기대하지 않고 신라와 방위 협력을 강화한다', hint: '[가상]', fx: { gold: -6 }, rel: { goguryeo: 14 }, realm: { intel: 3 }, result: '신라와 연락망이 촘촘해졌습니다.' }] });
    T.push({ y: 474, place: 'hanseong', title: '도림의 바둑 — 흔들리는 재정', hint: '바둑을 잘 두는 승려가 왕에게 접근할지 모릅니다.', src: SRC + ' 21년',
      text: ['고구려의 승려 <b>도림</b>이 죄를 짓고 도망쳐 왔다며 찾아와 바둑으로 왕의 환심을 샀습니다. 그는 "왕의 위엄에 비해 성곽·궁실이 초라하다"며 대규모 토목을 권합니다.', '사실 그는 장수왕이 보낸 첩자입니다.'],
      note: '삼국사기 개로왕 21년: 고구려 승려 도림이 바둑으로 왕에게 접근해 궁실·누각·제방의 대공사를 권했고, 이로 인해 국고가 비고 백성이 피폐해졌습니다. 도림은 고구려로 돌아가 이를 보고했고, 장수왕이 백제 침공을 결심했습니다.',
      hist: { label: '도림의 말대로 궁실·성곽·제방 대공사를 벌인다', hint: '국고와 민심이 급격히 줄어든다.', fx: { gold: -25, food: -10, people: -12 }, realm: { royal: 3, defense: 4, econ: -4 }, flags: { dorim: true }, result: '욱리하의 큰 돌로 곽을 짜고 궁궐과 누각이 올랐으나 창고는 비었고 백성의 원망이 커졌습니다. 도림은 어느 날 사라졌습니다.' },
      alts: [{ label: '도림을 의심해 잡아 가두고 심문한다', hint: '[가상] 첩보 능력이 높을수록 좋다.', fx: { gold: -3 }, realm: { intel: 8 }, world: { 'silla.hostility': 4 }, result: '도림은 심문 끝에 고구려의 첩자임이 드러났습니다. 고구려는 계획을 바꿔야 합니다.' }, { label: '공사는 하되 규모를 절반으로 줄이고 방비에 재정을 남긴다', hint: '[가상]', fx: { gold: -12, people: -5 }, realm: { defense: 4 }, result: '절충한 공사로 재정이 버텼습니다.' }] });
    T.push({ y: 475, m: '9월', place: 'hanseong', zoom: 800, last: true, title: '한성 — 장수왕 3만의 포위', hint: '', src: SRC + ' 21년 · 고구려본기 장수왕 63년',
      text: ['장수왕이 <b>3만 군</b>을 이끌고 한성을 포위했습니다. 고구려군은 사방에서 성을 공격하고 불을 질러 북성을 7일 만에 함락시켰습니다. 왕은 성 안에서 태자 <b>문주</b>를 신라로 보내 구원을 청합니다.'],
      note: '삼국사기: 475년 9월 고구려 장수왕이 3만을 이끌고 한성을 포위해 7일 만에 북성을 깨고 남성으로 들어왔습니다. 왕은 성을 나가 달아나다 고구려 장수에게 붙잡혀 아차산성 아래서 살해되었습니다. 문주가 신라의 구원병 1만을 얻어 돌아왔으나 이미 늦었고, 웅진으로 천도했습니다.',
      battle: { title: '한성 공방', defense: true, terrain: 1.3, loseEnd: { kind: 'conquered', title: '한성 함락 — 개로왕의 최후', text: '한성이 무너졌습니다. 왕은 성을 나가 달아나다 붙잡혀 아차산성 아래서 살해되었고, 문주가 신라의 원군을 데리고 돌아왔으나 이미 늦었습니다. 백제는 웅진으로 천도하며 중흥을 도모하게 됩니다.' },
        enemy: { name: '고구려 장수왕군', side: 'goguryeo', total: 40000, scale: 'silla', ref: 105, terrain: 1, morale: 75, mix: { line: .4, horse: .2, elite: .1, archer: .15, levy: .1, siege: .05 } },
        tactics: [{ label: '성 안 농성 — 문주를 신라에 보내 구원을 청한다', hint: '실제 역사의 선택. 구원병은 늦었다.', tag: '역사', ours: { terrain: 1.55 } }, { label: '성 밖으로 나가 야전에서 고구려군을 막는다', hint: '[가상] 큰 도박.', ours: { morale: 8 } }, { label: '왕과 정예가 북성을 사수하며 남성에 예비대를 둔다', hint: '[가상] 방어선을 이중으로 쌓는다.', ours: { terrain: 1.7, morale: 4 } }],
        win: { title: '한성을 지키다', text: ['신라 원군이 도착하기까지 한성은 무너지지 않았고, 고구려군은 물러났습니다. 도림의 계략을 이겨낸 것입니다. (실제 역사와 다릅니다.)'], fx: { morale: 12, people: 5 }, rel: { goguryeo: 10 }, world: { 'silla.p': -10 } },
        costly: { title: '한성 — 처참한 승리', text: ['성은 지켰으나 도성은 폐허에 가깝습니다.'], fx: { morale: -3, people: -10 } },
        lose: { title: '', text: [''], fx: {} } } });

    SG.makeScenario({
      id: 'garo', king: '개로왕', sub: '백제 21대 왕 · 455~475', seal: '百', side: 'baekje', country: '백제', cap: '한성', capPlace: 'hanseong', start: 455, end: 475, armyName: '백제군', gen: null,
      names: { silla: '고구려', goguryeo: '신라', tang: '북위', wa: '왜' }, sides: { silla: 'goguryeo', goguryeo: 'silla', tang: 'tang', wa: 'wa' },
      world: { silla: { p: 105, hostility: 60 }, goguryeo: { p: 35, hostility: 5 }, tang: { p: 110, commit: 5 }, wa: { p: 40, hostility: 5 } },
      rel: { silla: 10, goguryeo: 60, tang: 45, wa: 60 }, realm: { royal: 52, train: 52, defense: 58, navy: 25, econ: 50, intel: 35 }, res: { food: 60, gold: 55, people: 55, morale: 60 },
      army: { line: 13000, levy: 5000, elite: 1500, horse: 3000, archer: 3500, garrison: 7000, guard: 1500, navy: 1500, scout: 300 },
      drift: { silla: { p: 0.6 }, tang: { commitTarget: 0 }, wa: { p: 0.3 } },
      targets: [tg('w_horogoru', '고구려 남변 요새(호로고루 일대)', 'horogoru', 9000, 1.3, 12, -5, '469년 장수를 보내 고구려 남쪽 변경을 습격(삼국사기)', { short: '호로고루' }), tg('w_biyeolhol', '고구려 동남 변경(비열홀 방면)', 'biyeolhol', 11000, 1.35, 14, -6, '이 방면 공략 기록은 없음(가상)'), tg('w_pyeongyang', '고구려 평양성(가상)', 'pyeongyang', 28000, 1.5, 24, -12, '개로왕 대에 평양성 공격 기록은 없음(가상)', { from: 462 })],
      invasion: { from: 458, to: 474 }, timeline: T, histCmds: ['tribute_tang', 'fortify', 'ally_goguryeo'],
      intro: { era: '455년 · 한성', title: '개로왕 — 장수왕의 그림자 아래서', focus: [127.12, 37.53, 1800], go: '455년, 즉위의 해',
        text: ['당신은 <b>백제 21대 개로왕</b>(재위 455~475)입니다. 한강 유역의 한성은 근초고왕 이래 백제의 중심이지만, 이제 고구려 <b>장수왕</b>이 평양으로 도읍을 옮기고 남진을 노리고 있습니다. 신라와의 나제 화친(433)은 유일한 버팀목입니다.', '20년 안에 한성을 지켜낼 수 있을까요? 사료에 남은 해(455·458·469·472·474·475)에는 역사의 갈림길이 오고, 그 사이에는 정무와 랜덤 사건이 이어집니다. 고구려 승려 도림에 주의하십시오.'],
        note: '이 시대의 영역은 학설 차이가 커서 영역 색을 칠하지 않았습니다.' },
      real: '실제로는 472년 북위에 구원을 청했으나 거절당했고, 474년 무렵 도림의 계략으로 국고가 비었으며, 475년 9월 장수왕의 3만 군에게 한성이 7일 만에 무너져 개로왕이 아차산성 아래서 살해되었습니다. 아들 문주는 웅진으로 도읍을 옮겼습니다.',
      endNote: { prosper: '한성은 도림의 계략에도 무너지지 않았고, 백제는 고구려의 남진을 한강에서 막아냈습니다. (실제 역사와 다른 가상의 결말입니다.)', steady: '백제는 475년의 위기를 가까스로 넘겼습니다. (가상)' } });
  })();

  /* ───────── 성왕 ───────── */
  (function () {
    var SRC = '삼국사기 백제본기 성왕';
    var T = [];
    T.push({ y: 538, place: 'sabi', zoom: 1200, title: '사비로 도읍을 옮기고 국호를 남부여로', hint: '', src: SRC + ' 16년',
      text: ['웅진은 산세가 험해 방어에는 좋으나 좁고 평야가 부족합니다. 왕은 넓은 평야와 금강의 수운이 있는 <b>사비</b>로 도읍을 옮기고 국호를 <b>남부여</b>로 고치려 합니다. 부여 계승을 내세워 고구려와 정통성을 다툽니다.'],
      note: '삼국사기 성왕 16년(538): 봄에 도읍을 사비(소부리)로 옮기고 국호를 남부여라 했습니다. 사비 천도는 중앙 22부 정비와 짝을 이룬 것으로 평가됩니다.',
      hist: { label: '사비로 천도하고 국호를 남부여로 고친다', hint: '정통성과 경제력이 오르나 큰 비용이 든다.', fx: { gold: -14, people: -2 }, realm: { royal: 8, econ: 6, defense: 3 }, flags: { moved: true }, result: '새 도성이 서고 관제가 정비되었습니다. 백제는 부여의 계승자임을 선언합니다.' },
      alts: [{ label: '웅진을 유지하고 사비는 부도로 육성한다', hint: '[가상] 천도 비용 절약.', fx: { gold: -6 }, realm: { econ: 3, defense: 4 }, result: '웅진의 방어력은 그대로이나 도성 확장은 더딥니다.' }] });
    T.push({ y: 541, place: 'dengzhou', title: '양에 사신 — 박사와 경전을 청하다', hint: '', src: SRC + ' 19년',
      text: ['남조의 양 무제는 불교를 숭상하는 황제입니다. 왕은 사신을 보내 조공하며 <b>모시박사</b>와 『열반경』 등의 경전, 공장·화가의 파견을 청합니다.'],
      note: '삼국사기 성왕 19년(541): 양에 사신을 보내 조공하고 모시박사와 열반 등의 경의, 공장·화사를 청했고 양이 이를 허락했습니다.',
      hist: { label: '양에 사신을 보내 경전과 박사, 장인을 청한다', hint: '문화와 기술이 오르고 외교 위신이 높아진다.', fx: { gold: -8 }, rel: { tang: 14 }, realm: { econ: 4, royal: 3 }, flags: { buddhist: true }, result: '양의 박사와 장인이 백제로 와 사비의 문화가 한층 풍요로워졌습니다.' },
      alts: [{ label: '문화 수입 대신 병력 증강에 재물을 쓴다', hint: '[가상]', fx: { gold: -8 }, realm: { train: 6 }, army: { baekje_bangun: 800 }, result: '군이 늘었으나 문화 교류는 뒤로 밀렸습니다.' }] });
    T.push({ y: 548, m: '정월', place: 'maesoseong', title: '독산성 — 신라의 구원', hint: '고구려가 북쪽을 칠 때 신라에 구원을 청할 수 있습니다.', src: SRC + ' 26년 · 신라본기 진흥왕 9년',
      text: ['고구려가 예(濊)와 손잡고 한수 이북의 <b>독산성</b>을 공격합니다. 성이 위태롭습니다. 왕은 신라에 구원을 청할 수 있습니다.'],
      note: '삼국사기 성왕 26년(548) 정월: 고구려가 예와 함께 한북 독산성을 공격하자 신라에 구원을 청했고, 신라 장군 주진이 3천 군을 이끌어 고구려군을 크게 쳤습니다.',
      hist: { label: '신라에 구원을 청해 독산성을 지킨다', hint: '나제 공조가 깊어진다.', fx: { food: -4, morale: 4 }, rel: { goguryeo: 14 }, world: { 'silla.p': -4 }, result: '신라 장군 주진의 3천 군이 이르러 고구려와 예의 군을 물리쳤습니다.' },
      alts: [{ label: '신라 구원 없이 독자적으로 성을 지키려 한다', hint: '[가상]', fx: { food: -8, gold: -4 }, realm: { train: 3, defense: 4 }, result: '독산성은 지켜냈으나 피해가 컸습니다.' }] });
    T.push({ y: 551, place: 'hanseong', zoom: 1000, title: '한강 하류 6군 수복', hint: '신라가 함께 북진하자고 제안해 올 조짐이 있습니다. 병력과 군량을 충분히 쌓아 두십시오.', src: SRC + ' 29년 · 신라본기 진흥왕 12년',
      text: ['신라와 백제, 가야가 연합해 고구려를 칩니다. 백제는 한강 하류의 옛 도읍 <b>한성</b> 일대 6군을 되찾을 수 있습니다. 신라는 한강 상류 10군을 노립니다.', '옛 도읍을 되찾는 것은 백제의 오랜 숙원입니다.'],
      note: '삼국사기 성왕 29년(551): 백제가 한성과 평양 등 6군을 되찾았다는 기사가 일본서기에 전하며, 신라본기 진흥왕 12년에는 거칠부 등 8장군이 고구려의 10군을 취했다고 기록됩니다. 백제가 되찾은 지역의 범위에는 학설이 있습니다.',
      battle: { title: '한강 하류 수복전', commit: 0.75, enemy: { name: '고구려군', side: 'goguryeo', total: 17000, scale: 'silla', ref: 85, terrain: 1.25, morale: 65, mix: { line: .45, garrison: .2, horse: .15, archer: .1, levy: .1 } },
        tactics: [{ label: '신라와 연합해 동시에 한강 하류를 친다', hint: '실제 역사. 고구려는 양면 압박에 무너졌다.', tag: '역사', ours: { morale: 6 } }, { label: '단독으로 빠르게 한성을 습격한다', hint: '[가상] 선수를 치나 병력이 부족하다.', ours: { ambush: true } }, { place: 'asuka', label: '가야·왜 병력의 합류를 기다려 총공격한다', hint: '[가상] 늦지만 강하다.', ours: { morale: 3, pace: 0.9 } }],
        win: { title: '한강 하류 6군 수복', text: ['옛 도읍 한성을 비롯한 6군을 되찾았습니다. 백제의 오랜 숙원이 이루어졌습니다.'], fx: { gold: 18, morale: 12, people: 6 }, realm: { royal: 6 }, world: { 'silla.p': -10 }, captureTargets: ['w_hanseong'] },
        costly: { title: '한강 하류 — 피로 얻은 땅', text: ['많은 희생을 치르고 6군을 되찾았습니다.'], fx: { gold: 8, morale: 2, people: -3 }, captureTargets: ['w_hanseong'] },
        lose: { title: '한강 하류 — 실패', text: ['고구려의 저항이 거셌습니다. 군을 물렸습니다.'], fx: { morale: -8, people: -3, food: -8 }, realm: { royal: -3 } } } });
    T.push({ y: 552, place: 'asuka', title: '불상과 경전을 왜에 보내다', hint: '', src: '일본서기 흠명기 13년',
      text: ['왜(일본)가 새로운 가르침을 간절히 원합니다. 왕은 금동 석가불 한 구와 경론, 번개 등을 왜 왕실에 보내 불교를 공식 전합니다.'],
      note: '일본서기: 552년(흠명 13) 백제 성왕이 금동석가불상·번개·경론을 왜 흠명천황에게 보냈다고 전합니다. 다만 다른 사료(원흥사 연기 등)는 538년 설을 전하며 연대는 학설이 갈립니다.',
      hist: { label: '금동 석가불과 경론을 왜 왕실에 보낸다', hint: '왜와의 동맹이 매우 깊어진다. 훗날 원군의 밑거름.', fx: { gold: -8 }, rel: { wa: 20 }, realm: { royal: 3 }, flags: { wa_friend: true, buddhist: true }, result: '왜 조정은 크게 기뻐하며 백제와의 군사·문화 교류를 이어 갑니다.' },
      alts: [{ label: '불교 전파는 미루고 왜의 군사 지원 약속을 먼저 받아 낸다', hint: '[가상]', fx: { gold: -6 }, rel: { wa: 12 }, army: { baekje_navy: 300 }, result: '왜는 수군 지원을 약속했습니다.' }] });
    T.push({ y: 553, m: '7~10월', place: 'hanseong', title: '신라의 배신 — 신주 설치', hint: '신라가 한강 하류를 노리는 징후가 있습니다.', src: SRC + ' 31년 · 신라본기 진흥왕 14년',
      text: ['신라 진흥왕이 백제가 되찾은 한강 하류 6군을 기습해 빼앗고 <b>신주</b>를 설치했습니다. 백제 왕은 분노합니다. 그런데 신라는 한편으로 왕의 딸을 진흥왕의 소비로 맞아들이기도 했습니다.', '나제동맹 120년이 무너지는 순간, 어떻게 하시겠습니까?'],
      note: '삼국사기 성왕 31년(553): 7월 신라가 백제 동북 변경을 빼앗아 신주를 설치했고, 10월에 왕녀가 신라로 시집갔습니다. 백제는 이 배신에 보복하기 위해 554년 관산성을 공격합니다.',
      hist: { label: '신라와 결별하고 복수전을 준비한다', hint: '신라가 주적이 된다. 군비와 외교를 총동원해야 한다.', fx: { morale: 6, food: -6 }, realm: { train: 4 }, flags: { betrayed: true }, fn: function (g, S) { g.sb.swapRoles('silla', 'goguryeo'); g.sb.s.world.silla.hostility = 75; g.sb.s.world.silla.p = 70; g.sb.s.rel.silla = 5; g.sb.setTargets([Object.assign({ side: 'silla' }, { id: 'w_gwansan', name: '신라 관산성(옥천)', short: '관산성', place: 'gwansanseong', garrison: 6500, terrain: 1.5, gold: 14, people: 3, power: -5, hist: '554년 성왕이 이 일대에서 전사(삼국사기)' }), Object.assign({ side: 'silla' }, { id: 'w_samnyeon', name: '신라 삼년산성(보은)', short: '삼년산성', place: 'samnyeon', garrison: 9000, terrain: 1.9, gold: 20, people: 4, power: -8, hist: '신라의 북서 거점 산성' }), Object.assign({ side: 'silla' }, { id: 'w_hanseong2', name: '신라 신주(한강 하류)', short: '신주', place: 'achasan', garrison: 11000, terrain: 1.35, gold: 18, people: 4, power: -8, hist: '553년 신라가 빼앗아 신주를 설치' })]); }, result: '나제동맹은 깨졌습니다. 왕은 가야·왜와 연합해 신라를 응징할 계획을 세웁니다.' },
      alts: [{ place: 'pyeongyang', label: '항의 사절을 보내고 고구려와 손잡아 신라를 견제한다', hint: '[가상] 외교 전환. 관계가 복잡해진다.', fx: { gold: -8 }, rel: { goguryeo: -4 }, world: { 'silla.hostility': 10 }, fn: function (g, S) { g.sb.swapRoles('silla', 'goguryeo'); g.sb.s.world.silla.hostility = 62; g.sb.s.rel.silla = 12; g.sb.s.world.goguryeo.hostility = 20; g.sb.s.rel.goguryeo = 35; }, result: '신라와의 관계는 냉각되었고 고구려와는 어색한 화해가 시작되었습니다.' }, { label: '배신을 삼키고 동맹을 유지하며 북쪽 방비에 집중한다', hint: '[가상] 한강 하류를 포기한다.', fx: { morale: -8, people: -3 }, realm: { royal: -6, defense: 6 }, rel: { goguryeo: 8 }, result: '한강 하류는 신라의 영토가 되었습니다. 군과 조정의 불만이 쌓입니다.' }] });
    T.push({ y: 554, m: '7월', place: 'gwansanseong', zoom: 900, last: true, title: '관산성 — 성왕의 마지막 길', hint: '', src: SRC + ' 32년 · 신라본기 진흥왕 15년',
      text: ['태자 <b>여창</b>(훗날 위덕왕)이 관산성을 공격하고 있습니다. 군의 사기를 북돋우러 왕이 직접 소수 병력을 이끌고 밤길을 가려 합니다. 신라는 삼년산군의 고간 도도에게 복병을 맡겼습니다.', '이 결정이 백제의 운명을 가릅니다.'],
      note: '삼국사기: 554년 7월 성왕은 신라를 습격하려 직접 군을 이끌고 밤에 구천에 이르렀다가 신라 복병과 맞아 죽었고(소수의 호위만 대동), 좌평 4명을 포함한 2만 9천여 명이 전사했다고 전합니다. 신라본기에서는 성왕의 목을 벤 이를 고간 도도로 전합니다.',
      battle: { title: '관산성 전투', commit: 0.9, loseEnd: { kind: 'conquered', title: '구천의 매복 — 성왕의 전사', text: '성왕은 신라 복병과 만나 사로잡혀 목이 베였고, 백제군은 큰 타격을 입었습니다. 이후 백제는 신라와 길고 깊은 원한 관계에 놓입니다. 위덕왕은 아버지의 죽음 앞에서 오랜 침묵을 지켰다고 전합니다.' },
        enemy: { name: '신라군', side: 'silla', total: 14000, scale: 'silla', ref: 70, terrain: 1.35, morale: 72, mix: { line: .45, elite: .15, horse: .1, archer: .1, garrison: .1, levy: .1 } },
        tactics: [{ label: '성왕이 직접 소수 정예를 이끌고 야간에 전선으로 간다', hint: '실제 역사. 복병에 걸려 왕이 전사했다.', tag: '역사', ours: { morale: -6, terrain: 0.85 } }, { label: '왕은 본진에 머물고 태자와 장수들이 관산성을 총공격한다', hint: '[가상] 왕을 위험에서 빼 놓는다.', ours: { morale: 4 } }, { label: '가야·왜 연합군의 도착을 기다려 대군으로 포위한다', hint: '[가상] 왜·가야와의 관계가 필요.', ours: { morale: 6, pace: 0.9 } }],
        win: { title: '관산성 대승', text: ['신라군이 무너지고 관산성이 떨어졌습니다. 성왕은 한강 하류를 되찾은 위대한 왕으로 남습니다. (실제 역사와 다릅니다.)'], fx: { gold: 20, morale: 14, people: 6 }, world: { 'silla.p': -18 } },
        costly: { title: '관산성 — 상처뿐인 승리', text: ['큰 희생을 치르고 신라를 물리쳤습니다.'], fx: { morale: 2, people: -5 }, world: { 'silla.p': -8 } },
        lose: { title: '', text: [''], fx: {} } } });

    SG.makeScenario({
      id: 'seong', king: '성왕', sub: '백제 26대 왕 · 538~554', seal: '百', side: 'baekje', country: '백제', cap: '사비', capPlace: 'sabi', start: 538, end: 554, armyName: '백제군',
      names: { silla: '고구려', goguryeo: '신라', tang: '양', wa: '왜' }, sides: { silla: 'goguryeo', goguryeo: 'silla', tang: 'tang', wa: 'wa' },
      world: { silla: { p: 85, hostility: 48 }, goguryeo: { p: 60, hostility: 5 }, tang: { p: 100, commit: 0 }, wa: { p: 40, hostility: 5 } },
      rel: { silla: 15, goguryeo: 65, tang: 50, wa: 62 }, realm: { royal: 56, train: 54, defense: 55, navy: 30, econ: 55, intel: 38 }, res: { food: 62, gold: 55, people: 58, morale: 62 },
      army: { line: 15000, levy: 5000, elite: 2000, horse: 3000, archer: 4000, garrison: 7000, guard: 1500, navy: 2000, scout: 400 },
      drift: { silla: { p: 0.5 }, tang: { commitTarget: 0 }, wa: { p: 0.4 } },
      targets: [tg('w_hanseong', '고구려가 차지한 한강 하류 6군(한성 일대)', 'hanseong', 14000, 1.3, 16, -7, '551년 나제 연합으로 수복(삼국사기·일본서기)', { short: '한성', from: 540 }), tg('w_namhan', '고구려 남변(한강 이북 요충)', 'maesoseong', 9000, 1.3, 12, -5, '이 방면 개별 공략 기록은 없음(가상)'), tg('w_horogoru', '고구려 북쪽 요새(호로고루 일대)', 'horogoru', 10000, 1.35, 14, -6, '성왕 대 공략 기록은 없음(가상)')],
      invasion: { from: 542, to: 552 }, timeline: T, histCmds: ['tribute_tang', 'wa_envoy', 'ally_goguryeo', 'temple'],
      intro: { era: '538년 · 사비', title: '성왕 — 사비 시대를 연 왕', focus: [126.91, 36.28, 1500], go: '538년, 사비 천도의 해',
        text: ['당신은 <b>백제 26대 성왕</b>(재위 523~554)입니다. 웅진 시대를 끝내고 사비로 도읍을 옮겨 새 나라의 틀을 짜는 중입니다. 나라 안에서는 불교와 관제를 정비하고, 밖으로는 신라와의 나제동맹을 바탕으로 한강 하류의 옛 땅을 되찾으려 합니다.', '16년 동안 사료에 남은 해(538·541·548·551·552·553·554)가 갈림길이 됩니다. 특히 <b>553년 신라의 배신</b>과 <b>554년 관산성</b>이 이 이야기의 정점입니다. 신라는 우방에서 주적으로 바뀝니다.'],
        note: '이 시대의 영역은 학설 차이가 커서 영역 색을 칠하지 않았습니다.' },
      real: '실제로는 551년 나제 연합으로 한강 하류를 되찾았으나, 553년 신라가 이를 빼앗았습니다. 554년 관산성 전투에서 성왕이 구천에서 신라 복병에게 전사하여 나제동맹은 완전히 무너졌고, 백제는 이후 신라와 오랜 적대 관계에 놓였습니다.',
      endNote: { hegemon: '성왕의 백제는 한강을 되찾고 신라까지 제압해 반도 서쪽의 패자가 되었습니다. (가상)', prosper: '백제는 신라의 배신을 이겨내고 한강 하류를 지켜 중흥의 기틀을 닦았습니다. (가상)' } });
  })();
})();

;
/* ==== js/data/sc_silla.js ==== */
window.__sgL=5;
/* 신라 왕 5명: 눌지(433~458) · 진흥왕(548~576) · 선덕여왕(632~647) · 무열왕(654~661) · 문무왕(661~681).
 * 근거: 삼국사기 신라본기·백제본기·고구려본기. 수치는 게임 추상화 값, 사료에 없는 갈래는 '가상'으로 표시. */
(function () {
  function tg(id, name, place, garrison, terrain, gold, power, hist, extra) { return Object.assign({ id: id, name: name, place: place, garrison: garrison, terrain: terrain, gold: gold, people: 2, power: power, hist: hist }, extra || {}); }
  function mk(side, o) { return Object.assign({ side: side }, o); }

  /* ───────── 눌지마립간 ───────── */
  (function () {
    var SRC = '삼국사기 신라본기 눌지마립간';
    var T = [];
    T.push({ y: 433, m: '7월', place: 'seorabeol', zoom: 1500, title: '백제와 화친 — 나제동맹의 시작', hint: '', src: SRC + ' 17년 · 백제본기 비유왕 7년',
      text: ['고구려 장수왕이 평양으로 도읍을 옮길 채비를 하며 남쪽을 노립니다. 이때 백제 비유왕이 사신을 보내 화친을 청해 왔습니다. 당신은 고구려의 그늘 아래 있는 신라의 마립간 눌지입니다.'],
      note: '삼국사기: 433년 7월 백제가 신라에 사신을 보내 화친을 청했고, 이듬해 2월에 좋은 말, 9월에 황금과 명주를 주고받았습니다. 이것이 나제동맹의 출발로 이해됩니다(고구려 장수왕의 평양 천도는 427년).',
      hist: { label: '백제의 화친을 받아들이고 사신을 교환한다', hint: '고구려를 견제할 우방이 생기나 고구려의 눈 밖에 날 수 있다.', fx: { gold: -4 }, rel: { goguryeo: 16 }, world: { 'tang.commit': 3 }, result: '백제와 우호가 맺어졌습니다. 고구려는 이를 못마땅하게 지켜봅니다.' },
      alts: [{ label: '고구려의 눈치를 보며 화친을 보류한다', hint: '[가상]', fx: { gold: 3 }, rel: { tang: 8, goguryeo: -2 }, result: '고구려와의 관계는 무난하나 외톨이로 남았습니다.' }] });
    T.push({ y: 438, place: 'seorabeol', title: '우차법 — 백성에게 농사 기술을 전하다', hint: '', src: SRC + ' 22년',
      text: ['왕은 백성들에게 수레(牛車)를 쓰는 방법을 가르치고 농사를 돕도록 합니다. 군량의 바탕은 늘 농사입니다.'],
      note: '삼국사기 눌지마립간 22년(438): 백성에게 우차(牛車)의 이용법을 가르쳤다고 합니다.',
      hist: { label: '우차법을 널리 보급하고 농사를 장려한다', hint: '군량과 산업이 오른다.', fx: { food: 10, people: 3 }, realm: { econ: 6 }, result: '수레가 보급되어 운반과 농사가 한결 수월해졌습니다.' },
      alts: [{ label: '농사 대신 병기와 성책 정비에 힘쓴다', hint: '[가상]', fx: { food: -3 }, realm: { defense: 6, train: 3 }, result: '방비가 단단해졌습니다.' }] });
    T.push({ y: 444, m: '4월', place: 'seorabeol', zoom: 1000, title: '왜병의 금성 포위 — 독산 동쪽의 안개', hint: '남해안 쪽으로 왜병이 몰려들 조짐이 있습니다. 방비를 점검하십시오.', src: SRC + ' 28년',
      text: ['왜병이 금성(서라벌)을 열흘간 포위했습니다. 군량이 떨어진 적이 물러나려 합니다. 좌우는 "궁한 도적은 쫓지 마소서" 하나 왕은 추격할 마음이 있습니다.'],
      note: '삼국사기 눌지마립간 28년(444) 4월: 왜병이 금성을 열흘간 포위했다가 군량이 다해 돌아가자 왕이 추격했으나, 독산 동쪽에서 적에게 에워싸여 위급했는데 안개가 끼어 적이 물러났다고 전합니다.',
      battle: { title: '금성 방어와 추격', defense: true, terrain: 1.2, enemy: { name: '왜병', side: 'wa', total: 27000, scale: 'silla', ref: 40, terrain: 1, morale: 58, mix: { levy: .6, line: .3, archer: .1 } },
        tactics: [{ label: '성문을 닫고 농성하다 퇴각하는 적을 추격한다', hint: '실제 역사의 흐름. 추격 때 위험을 겪었다.', tag: '역사', ours: { terrain: 1.45 } }, { label: '성 안에서 굳게 지키되 추격하지 않는다', hint: '[가상] 안전하나 적을 놓친다.', ours: { terrain: 1.6, morale: 2 } }, { label: '성 밖 요처에 복병을 두고 퇴로를 친다', hint: '[가상]', ours: { ambush: true } }],
        win: { title: '금성 방어 성공', text: ['왜병이 물러났고 왕은 위기를 넘겼습니다. 이후 신라는 해안 방비를 정비합니다.'], fx: { morale: 8, people: 3 }, realm: { defense: 4 }, world: { 'silla.p': -6 } },
        costly: { title: '금성 — 안개 속의 후퇴', text: ['사상자가 컸으나 왜병이 물러났습니다.'], fx: { morale: -2, people: -3 } },
        lose: { title: '금성 외곽 피해', text: ['성 밖 마을이 짓밟히고 큰 피해를 입었습니다.'], fx: { morale: -8, people: -6, food: -8 }, realm: { defense: -4 } } } });
    T.push({ y: 450, m: '7월', place: 'hasilla', title: '하슬라 사건 — 고구려 변장의 죽음', hint: '', src: SRC + ' 34년',
      text: ['하슬라(강릉) 성주 삼직이 사냥 나온 고구려 변경 장수를 죽였다는 소식이 들어옵니다. 고구려 장수왕이 사신을 보내 이를 따질 것입니다.'],
      note: '삼국사기 눌지마립간 34년(450) 7월: 고구려 변경 장수가 실직 들에서 사냥하다 하슬라 성주 삼직에게 죽임을 당했고, 고구려 왕이 이를 문제 삼자 신라 왕이 사과했습니다.',
      hist: { label: '고구려에 사신을 보내 사과하고 위기를 수습한다', hint: '충돌은 피하나 위신이 깎인다.', fx: { gold: -6, morale: -3 }, rel: { tang: 8 }, realm: { royal: -3 }, result: '고구려 왕은 노여움을 풀었으나 신라의 자존심은 상했습니다.' },
      alts: [{ label: '사과하지 않고 국경 방비를 높인다', hint: '[가상] 충돌 위험이 커진다.', fx: { food: -6 }, realm: { defense: 8, train: 4 }, rel: { tang: -12 }, world: { 'tang.commit': 6 }, result: '고구려와의 관계가 얼어붙었습니다.' }] });
    T.push({ y: 455, m: '10월', place: 'seorabeol', title: '백제 구원 — 동맹이 시험받다', hint: '', src: SRC + ' 39년',
      text: ['고구려가 백제를 침공했다는 급보가 들어옵니다. 개로왕의 백제는 433년 이래의 화친을 들어 구원을 청합니다.'],
      note: '삼국사기 눌지마립간 39년(455) 10월: 고구려가 백제를 치자 왕이 군사를 보내 백제를 구원했습니다.',
      hist: { label: '군사를 보내 백제를 구원한다', hint: '동맹이 굳어지나 고구려가 적의를 품는다.', fx: { food: -8, morale: 2 }, rel: { goguryeo: 12, tang: -10 }, realm: { train: 3 }, result: '신라군이 백제를 도왔습니다. 나제동맹이 한층 깊어졌으나 고구려의 분노를 샀습니다.' },
      alts: [{ label: '고구려의 눈치를 보며 모른 척한다', hint: '[가상]', rel: { goguryeo: -14, tang: 6 }, realm: { royal: -3 }, result: '동맹이 흔들렸습니다.' }] });
    T.push({ y: 457, place: 'sangju', title: '묵호자와 불교 — 일선군의 전승', hint: '', src: '삼국유사 아도기라 (전승)',
      text: ['고구려에서 온 승려 묵호자가 일선군(선산) 모례의 집에 머물며 향을 피운다는 소문이 있습니다. 왕실의 병을 고쳤다는 이야기도 전합니다.'],
      note: '삼국유사·삼국사기의 불교 전래 기사에는 눌지왕 때 묵호자(아도 화상 이설)가 고구려에서 일선군에 이르렀다는 전승이 있으나, 사실 여부와 시기에는 이설이 많습니다.',
      alts: [{ label: '묵호자를 맞아 향과 가르침을 받아들인다', hint: '[전승] 민심이 오르나 귀족이 반발한다.', fx: { people: 3, gold: -3 }, realm: { royal: -2, econ: 2 }, flags: { buddhist: true }, result: '새 가르침이 조용히 퍼지기 시작했습니다.' }, { label: '새 신앙은 경계하고 전통 제사를 지킨다', hint: '[가상]', realm: { royal: 3 }, fx: { people: -1 }, result: '전통 제사가 유지되었습니다.' }] });
    T.push({ y: 458, place: 'seorabeol', last: true, title: '눌지의 마지막 해 — 부자 상속의 기틀', hint: '', src: SRC + ' 42년',
      text: ['재위 42년째 왕은 늙고 쇠했습니다. 아들 자비가 왕위를 이을 준비를 합니다. 동생 복호와 미사흔을 되찾아 왔던 젊은 날을 떠올리며, 왕은 나라의 앞날을 가늠합니다.'],
      note: '삼국사기: 눌지마립간은 458년 8월에 죽고 맏아들 자비가 즉위했습니다. 눌지 대부터 왕위가 부자 상속으로 굳어졌다고 평가됩니다.',
      hist: { label: '태자에게 정무를 맡기고 군비를 점검한다', hint: '왕권이 안정된다.', fx: { gold: -3 }, realm: { royal: 6, train: 3 }, result: '자비가 정무를 이어받을 기반이 다져졌습니다.' },
      alts: [{ label: '백제·고구려와의 관계 정리를 마지막 과제로 삼는다', hint: '[가상]', rel: { goguryeo: 8, tang: 6 }, fx: { gold: -4 }, result: '두 나라와의 관계가 부드러워졌습니다.' }] });

    SG.makeScenario({
      id: 'nulji', king: '눌지마립간', sub: '신라 19대 왕 · 433~458', seal: '新', side: 'silla', country: '신라', cap: '금성', capPlace: 'seorabeol', start: 433, end: 458, armyName: '신라군',
      names: { silla: '왜', goguryeo: '백제', tang: '고구려', wa: '가야' }, sides: { silla: 'wa', goguryeo: 'baekje', tang: 'goguryeo', wa: 'wa' },
      world: { silla: { p: 40, hostility: 40 }, goguryeo: { p: 40, hostility: 4 }, tang: { p: 115, commit: 5 }, wa: { p: 25, hostility: 5 } },
      rel: { silla: 10, goguryeo: 45, tang: 50, wa: 40 }, realm: { royal: 48, train: 42, defense: 48, navy: 15, econ: 48, intel: 28 }, res: { food: 55, gold: 45, people: 55, morale: 58 },
      army: { line: 9000, levy: 4500, elite: 800, horse: 1800, archer: 2000, garrison: 4500, guard: 800, navy: 500, scout: 200 },
      drift: { silla: { p: 0.3 }, tang: { commitTarget: 20 }, wa: { p: 0.2 } },
      targets: [tg('w_wa_south', '왜병의 남해안 근거', 'nakdonggang', 6000, 1.1, 8, -3, '사료에 신라가 왜 땅을 친 기록은 없음(가상)'), tg('w_gaya', '남쪽 가야 소국(가상)', 'nakdonggang', 5000, 1.15, 7, -2, '눌지 대 가야 공략 기록 없음(가상)')],
      invasion: { from: 440, to: 457 }, timeline: T, histCmds: ['peace_silla', 'ally_goguryeo', 'farm', 'fortify'],
      intro: { era: '433년 · 금성', title: '눌지마립간 — 고구려의 그늘에서', focus: [129.22, 35.83, 1400], go: '433년, 화친의 해로',
        text: ['당신은 <b>신라 19대 눌지마립간</b>(재위 417~458)입니다. 신라는 아직 고구려의 영향 아래 있는 작은 나라로, 동쪽 바다에서는 왜병이 자주 침입합니다. 그러던 중 백제가 먼저 손을 내밀어 옵니다.', '25년 동안 사료에 남은 해(433·438·444·450·455·457·458)에는 역사의 갈림길이 옵니다. 내정과 외교, 군비를 어떻게 쌓는지에 따라 신라의 길이 갈립니다.'],
        note: '이 시대의 영역은 학설 차이가 커서 영역 색을 칠하지 않았습니다. 이 시기 신라에서 왜(倭)·가야는 사료마다 표기가 다릅니다.' },
      real: '실제로는 433년 백제와 화친(나제동맹)을 맺었고, 444년 왜병의 금성 포위를 넘겼으며, 455년 고구려의 침공을 받은 백제를 구원했습니다. 눌지 대부터 왕위가 부자 상속으로 굳어졌다고 평가됩니다.',
      endNote: { prosper: '신라는 고구려의 그늘에서 벗어나 나제동맹의 한 축으로 자리잡았습니다.', steady: '신라는 위태로운 균형 속에서 눌지의 시대를 마무리했습니다.' } });
  })();

  /* ───────── 진흥왕 ───────── */
  (function () {
    var SRC = '삼국사기 신라본기 진흥왕';
    var T = [];
    T.push({ y: 548, m: '정월', place: 'maesoseong', zoom: 1500, title: '독산성 — 백제의 구원 요청', hint: '', src: SRC + ' 9년 · 백제본기 성왕 26년',
      text: ['백제 성왕이 고구려와 예의 공격을 받은 독산성의 구원을 청합니다. 당신은 어린 나이에 즉위해 어머니 태후의 섭정을 받아 온 진흥왕입니다. 이제 친정의 때가 가까워 옵니다.'],
      note: '삼국사기: 548년 정월 고구려가 예와 함께 백제의 독산성을 공격하자 백제의 구원 요청에 신라 장군 주진이 3천 군을 이끌고 가서 고구려군을 크게 쳤습니다. 진흥왕은 540년에 7세로 즉위했습니다.',
      hist: { label: '장군 주진에게 3천을 주어 백제를 구원한다', hint: '나제 공조가 이어진다.', fx: { food: -4, morale: 4 }, rel: { goguryeo: 12 }, world: { 'silla.p': -4 }, result: '주진의 군이 고구려와 예의 군을 물리쳤습니다.' },
      alts: [{ label: '구원은 거절하고 내정을 정비한다', hint: '[가상]', fx: { gold: 4 }, realm: { econ: 4, royal: 3 }, rel: { goguryeo: -10 }, result: '백제와의 관계가 서먹해졌습니다.' }] });
    T.push({ y: 550, m: '정월', place: 'chungju', title: '도살성·금현성 — 어부지리', hint: '', src: SRC + ' 11년',
      text: ['백제와 고구려가 도살성과 금현성을 두고 서로 싸워 지쳐 있습니다. 이사부가 이를 틈타 두 성을 거두자는 의견을 올립니다.'],
      note: '삼국사기 진흥왕 11년(550): 백제가 고구려의 도살성을 빼앗았고 고구려가 백제의 금성을 빼앗았는데, 두 나라 군사가 지친 틈에 이사부가 군을 내어 두 성을 모두 차지해 성을 쌓고 군사 1천을 두어 지키게 했습니다.',
      hist: { label: '이사부를 보내 두 성을 차지한다', hint: '영토가 늘지만 백제와 사이가 서먹해질 수 있다.', fx: { gold: 8, morale: 5 }, realm: { defense: 4 }, rel: { goguryeo: -6 }, world: { 'goguryeo.hostility': 4 }, result: '이사부가 두 성을 취해 1천 군을 두었습니다.' },
      alts: [{ label: '두 나라의 싸움에 끼지 않고 지켜본다', hint: '[가상]', fx: { food: 3 }, realm: { train: 3 }, result: '전쟁은 그들의 몫으로 남았습니다.' }] });
    T.push({ y: 551, place: 'chungju', zoom: 1000, title: '한강 상류 10군 — 거칠부의 북진', hint: '백제와 함께 북진할 때가 올 듯합니다. 군량과 병력을 충분히 쌓아 두십시오.', src: SRC + ' 12년 · 백제본기 성왕 29년',
      text: ['왕은 연호를 <b>개국</b>(開國)이라 고치고 8장군(거칠부·구진·비태 등)에게 고구려 공략을 맡깁니다. 백제와 가야가 한강 하류를 노릴 때, 신라는 한강 상류 10군을 노립니다.'],
      note: '삼국사기 진흥왕 12년(551): 개국이라 연호를 고치고, 거칠부 등 8장군을 시켜 백제와 함께 고구려를 쳐 죽령 이북 고현 이내 10군을 빼앗았습니다. 이때 거칠부는 고구려 승려 혜량을 만나 데려오기도 했습니다.',
      battle: { title: '한강 상류 진격', commit: 0.8, enemy: { name: '고구려군', side: 'goguryeo', total: 16000, scale: 'silla', ref: 100, terrain: 1.3, morale: 68, mix: { line: .45, garrison: .2, horse: .15, archer: .1, levy: .1 } },
        tactics: [{ label: '백제와 연합해 동시에 북진한다', hint: '실제 역사. 고구려가 양면에 밀렸다.', tag: '역사', ours: { morale: 6 } }, { label: '단독으로 죽령 방면만 빠르게 친다', hint: '[가상]', ours: { ambush: true } }, { label: '병력을 모은 뒤 하나씩 성을 포위한다', hint: '[가상] 느리나 안정적.', ours: { pace: 0.9, terrain: 1.1 } }],
        win: { title: '한강 상류 10군 확보', text: ['죽령 이북 고현 이내의 10군을 차지했습니다. 신라가 한강 유역에 발을 내딛었습니다.'], fx: { gold: 18, morale: 12, people: 5 }, realm: { royal: 6 }, world: { 'silla.p': -10 }, captureTargets: ['s_hangang_up'] },
        costly: { title: '한강 상류 — 힘겨운 전진', text: ['희생이 컸으나 10군 중 일부를 확보했습니다.'], fx: { gold: 8, morale: 2, people: -3 }, captureTargets: ['s_hangang_up'] },
        lose: { title: '한강 상류 — 진격 저지', text: ['고구려가 길목을 막아 진격이 꺾였습니다.'], fx: { morale: -8, food: -8, people: -3 }, realm: { royal: -3 } } } });
    T.push({ y: 553, m: '7월', place: 'achasan', title: '한강 하류 점령 — 신주 설치', hint: '백제가 되찾은 한강 하류를 노릴 기회가 올 수 있습니다.', src: SRC + ' 14년',
      text: ['백제가 되찾은 한강 하류 6군은 신라에는 서해로 나가는 길이자 당과 직접 통하는 길입니다. 백제 성왕과의 동맹을 깰 것인가, 지킬 것인가.', '왕은 한편으로 백제 왕녀를 소비로 맞이하며 동맹을 이어 가려는 모양새도 취합니다.'],
      note: '삼국사기 진흥왕 14년(553): 7월 백제의 동북 변경을 빼앗아 신주를 설치하고 아찬 김무력을 군주로 삼았습니다. 10월에는 백제 왕녀를 맞아 소비로 삼았습니다.',
      hist: { label: '한강 하류를 점령하고 신주를 설치한다', hint: '서해 진출. 백제와 결별한다.', fx: { gold: 12, morale: 6, food: -6 }, realm: { royal: 5, navy: 5 }, flags: { betrayal: true }, fn: function (g, S) { g.sb.swapRoles('silla', 'goguryeo'); var s = g.sb.s; s.world.silla.hostility = 80; s.world.silla.p = 75; s.rel.silla = 4; s.world.goguryeo.hostility = 18; s.rel.goguryeo = 20; g.sb.setTargets([mk('baekje', { id: 's_gwansan', name: '백제 관산성 방면(옥천)', short: '관산성', place: 'gwansanseong', garrison: 8500, terrain: 1.4, gold: 14, people: 3, power: -6, hist: '554년 신라·백제가 이 일대에서 충돌(삼국사기)' }), mk('baekje', { id: 's_sabi', name: '백제 도성 방면(사비)', short: '사비', place: 'sabi', garrison: 13000, terrain: 1.45, gold: 22, people: 4, power: -10, hist: '554년 이후 신라의 직접 공략은 없었음(가상)' }), mk('goguryeo', { id: 's_hangang_up', name: '고구려 한강 상류(죽령 이북)', short: '죽령 이북', place: 'chungju', garrison: 9000, terrain: 1.3, gold: 10, people: 3, power: -5, hist: '551년 신라가 10군을 취함' })]); }, result: '신라는 한강 하류를 차지했습니다. 서해로 가는 길이 열렸으나 백제와의 동맹은 끝났습니다.' },
      alts: [{ label: '동맹을 지키고 백제와 한강을 나누어 가진다', hint: '[가상] 안전하나 서해 진출이 늦어진다.', fx: { gold: 4 }, rel: { goguryeo: 12 }, realm: { royal: -2 }, result: '동맹은 유지되었으나 신라의 한강 진출은 제한되었습니다.' }] });
    T.push({ y: 554, m: '7월', place: 'gwansanseong', zoom: 900, title: '관산성 — 성왕이 쓰러지다', hint: '', src: SRC + ' 15년 · 백제본기 성왕 32년',
      text: ['백제 성왕의 태자 여창이 관산성을 공격합니다. 성왕이 직접 소수의 병력을 이끌고 밤길을 지나 구천에 이를 것이라는 첩보가 들어옵니다. 삼년산군의 고간 도도가 복병을 맡고 있습니다.'],
      note: '삼국사기: 554년 백제가 가야와 함께 관산성을 공격하자 군주 김무력이 맞섰고, 삼년산군의 고간 도도가 백제 성왕을 구천에서 사로잡아 죽였습니다. 백제 좌평 4명을 포함해 2만 9천여 명이 전사했다고 전합니다.',
      battle: { title: '관산성 전투', defense: true, terrain: 1.35, enemy: { name: '백제·가야 연합군', side: 'baekje', total: 24000, scale: 'silla', ref: 75, terrain: 1, morale: 70, mix: { line: .4, elite: .1, horse: .12, archer: .13, navy: .05, levy: .2 } },
        tactics: [{ label: '구천에 복병을 두고 성왕의 소수 호위를 친다', hint: '실제 역사. 성왕이 사로잡혔다.', tag: '역사', ours: { ambush: true, morale: 6 } }, { label: '관산성에서 굳게 지키며 백제의 피로를 기다린다', hint: '[가상]', ours: { terrain: 1.6 } }, { label: '삼년산성의 병력까지 모아 정면 야전으로 친다', hint: '[가상]', ours: { morale: 5 } }],
        win: { title: '관산성 대승', text: ['성왕이 전사하고 백제군이 무너졌습니다. 신라는 한강 유역을 확고히 차지했고, 나제동맹은 완전히 끝났습니다.'], fx: { gold: 20, morale: 14, people: 6 }, realm: { royal: 7 }, world: { 'silla.p': -20, 'silla.hostility': 12 } },
        costly: { title: '관산성 — 힘겨운 승리', text: ['큰 희생을 치르고 백제군을 물리쳤습니다.'], fx: { morale: 2, people: -4 }, world: { 'silla.p': -10 } },
        lose: { title: '관산성 — 패전', text: ['백제군이 관산성을 압박해 한강 하류가 위태로워졌습니다.'], fx: { morale: -10, people: -6, food: -10 }, realm: { royal: -4, defense: -6 }, world: { 'silla.p': 6 } } } });
    T.push({ y: 555, m: '10월', place: 'hanseong', title: '북한산 순수 — 영토를 두루 살피다', hint: '', src: SRC + ' 16년 · 북한산 순수비',
      text: ['한강 유역을 새 영토로 삼은 왕은 직접 북한산에 올라 국경을 정하려 합니다. 순수비를 세워 새 땅에서의 신라의 위엄을 알릴 수 있습니다.'],
      note: '삼국사기 진흥왕 16년(555): 왕이 북한산에 순행해 강역을 정했다고 전합니다. 북한산비는 568년 설과 555년 설이 갈립니다.',
      hist: { label: '북한산에 올라 강역을 정하고 순수비를 세운다', hint: '왕권과 영토 의식이 높아진다.', fx: { gold: -6 }, realm: { royal: 6, defense: 4 }, result: '새 영토에 신라의 위엄이 새겨졌습니다.' },
      alts: [{ label: '순수 대신 한강 성곽과 군정을 정비한다', hint: '[가상]', fx: { gold: -6, food: -3 }, realm: { defense: 8, train: 4 }, result: '새 땅의 방비가 굳어졌습니다.' }] });
    T.push({ y: 562, m: '9월', place: 'nakdonggang', title: '대가야 정벌 — 이사부와 사다함', hint: '', src: SRC + ' 23년',
      text: ['가야 남은 세력이 반란을 일으켰습니다. 이사부가 군을 이끌고, 화랑 사다함이 선봉에 서려 합니다. 사다함은 15~16세의 소년입니다.'],
      note: '삼국사기 진흥왕 23년(562): 가야가 반란을 일으켜 이사부에게 토벌시켰고, 사다함이 5천 기병으로 전단문에 먼저 들어가 흰 기를 세우자 가야가 놀라 항복했습니다.',
      hist: { label: '이사부와 사다함을 보내 대가야를 병합한다', hint: '남쪽 영토와 인구가 늘어난다.', fx: { gold: 14, people: 4, food: 6 }, realm: { train: 4, royal: 4 }, army: { baekje_levy: 800 }, result: '가야는 신라에 병합되었고 사다함의 이름이 높아졌습니다.' },
      alts: [{ label: '가야에 사신을 보내 회유하고 귀족 자제를 데려온다', hint: '[가상] 피해는 적으나 병합이 더디다.', fx: { gold: -6, people: 2 }, realm: { intel: 4, royal: 2 }, result: '가야 귀족 일부가 신라에 협조합니다.' }] });
    T.push({ y: 568, place: 'biyeolhol', title: '황초령·마운령 순수비', hint: '', src: SRC + ' 29년 · 황초령비·마운령비',
      text: ['왕은 동북쪽의 비열홀·함주 일대까지 영토를 넓혔습니다. 변경에 순수비를 세워 신라의 새 국경을 알립니다.'],
      note: '568년 세운 마운령비·황초령비는 진흥왕이 함경도 지역까지 이르렀음을 알려 주는 금석문입니다(비 건립 연대와 점령 범위에는 학설이 있습니다).',
      hist: { label: '황초령·마운령에 순수비를 세워 동북 변경을 선포한다', hint: '왕권과 위신이 크게 오른다.', fx: { gold: -6 }, realm: { royal: 7, defense: 3 }, result: '신라의 이름이 동북 변경에 새겨졌습니다.' },
      alts: [{ label: '변경 개척보다 한강 유역의 안정에 집중한다', hint: '[가상]', fx: { gold: 3, people: 3 }, realm: { econ: 5 }, result: '한강 유역이 안정되었습니다.' }] });
    T.push({ y: 576, place: 'seorabeol', last: true, title: '화랑과 불교 — 왕의 마지막 해', hint: '', src: SRC + ' 37년',
      text: ['왕은 늙어 가며 불교에 귀의합니다. 인재를 뽑는 방식으로는 원화를 대신해 화랑(花郞)을 두는 제도가 자리 잡았습니다. 이 제도는 훗날 신라 삼국통일의 한 축이 됩니다.'],
      note: '삼국사기 진흥왕 37년(576): 처음 원화를 받들다 이후 화랑이라는 이름으로 청소년 단체를 두어 인재를 뽑았다고 전합니다. 같은 해 왕이 죽었다고 전합니다(재위 540~576).',
      hist: { label: '화랑을 정비하고 후사의 기반을 다진다', hint: '인재 풀과 왕권이 안정된다.', fx: { gold: -6 }, realm: { train: 6, royal: 5 }, army: { baekje_gyebaek: 300 }, result: '화랑 제도가 정착되어 신라의 인재 풀이 넓어졌습니다.' },
      alts: [{ label: '불교 교단 중심의 국가 통합을 강화한다', hint: '[가상]', fx: { gold: -8, people: 3 }, realm: { royal: 4, econ: 2 }, result: '왕실 불교의 위세가 커졌습니다.' }] });

    SG.makeScenario({
      id: 'jinheung', king: '진흥왕', sub: '신라 24대 왕 · 548~576', seal: '新', side: 'silla', country: '신라', cap: '금성', capPlace: 'seorabeol', start: 548, end: 576, armyName: '신라군',
      names: { silla: '고구려', goguryeo: '백제', tang: '남북조', wa: '가야' }, sides: { silla: 'goguryeo', goguryeo: 'baekje', tang: 'tang', wa: 'wa' },
      world: { silla: { p: 100, hostility: 50 }, goguryeo: { p: 75, hostility: 4 }, tang: { p: 90, commit: 0 }, wa: { p: 30, hostility: 8 } },
      rel: { silla: 8, goguryeo: 65, tang: 40, wa: 30 }, realm: { royal: 50, train: 52, defense: 52, navy: 20, econ: 52, intel: 32 }, res: { food: 58, gold: 50, people: 58, morale: 62 },
      army: { line: 11000, levy: 4500, elite: 1500, horse: 2200, archer: 2800, garrison: 5000, guard: 1000, navy: 600, scout: 300 },
      drift: { silla: { p: 0.2 }, tang: { commitTarget: 0 }, wa: { p: 0.1 } },
      targets: [tg('s_hangang_up', '고구려 한강 상류(죽령 이북)', 'chungju', 9000, 1.3, 10, -5, '551년 신라가 10군을 취함(삼국사기)', { short: '죽령 이북', from: 549 }), tg('s_biyeolhol', '고구려 동북 변경(비열홀)', 'biyeolhol', 10000, 1.35, 12, -6, '568년 황초령·마운령 순수비(금석문)', { short: '비열홀', from: 560 }), tg('s_pyeongyang', '고구려 평양성(가상)', 'pyeongyang', 28000, 1.5, 20, -12, '진흥왕 대 평양성 공격 기록은 없음(가상)', { from: 565 })],
      invasion: { from: 552, to: 575 }, timeline: T, histCmds: ['ally_goguryeo', 'fortify', 'tribute_tang', 'academy'],
      intro: { era: '548년 · 금성', title: '진흥왕 — 한강을 얻은 왕', focus: [128.0, 36.6, 2000], go: '548년, 백제의 구원 요청',
        text: ['당신은 <b>신라 24대 진흥왕</b>(재위 540~576)입니다. 어머니 태후의 섭정을 마치고 친정을 시작하려는 무렵, 백제 성왕이 고구려에 맞서 구원을 청해 옵니다. 신라는 이 시기에 가장 크게 영토를 넓히게 됩니다.', '28년 동안 사료에 남은 해(548·550·551·553·554·555·562·568·576)가 갈림길이 됩니다. <b>553년 백제와의 동맹</b>은 이 이야기의 가장 큰 분기점입니다.'],
        note: '이 시대의 영역은 학설 차이가 커서 영역 색을 칠하지 않았습니다.' },
      real: '실제로는 551년 한강 상류 10군을 차지했고, 553년 백제의 한강 하류를 빼앗아 신주를 설치했으며, 554년 관산성에서 백제 성왕을 전사시켰습니다. 562년 대가야를 병합하고 568년 황초령·마운령에 순수비를 세워 신라 최대의 영토를 이루었습니다.',
      endNote: { hegemon: '진흥왕의 신라는 한강과 낙동강을 모두 쥔 반도 중심의 강국이 되었습니다.', prosper: '신라는 영토 확장의 성과를 안정시키며 다음 세대에 넘겼습니다.' } });
  })();

  /* ───────── 선덕여왕 ───────── */
  (function () {
    var SRC = '삼국사기 신라본기 선덕왕';
    var T = [];
    T.push({ y: 632, place: 'seorabeol', zoom: 1500, title: '여왕의 즉위 — 성골의 마지막', hint: '', src: SRC + ' 1년',
      text: ['진평왕이 아들 없이 세상을 떠나 맏딸 덕만이 즉위합니다. 한반도에 처음 나타난 여왕입니다. 백제는 무왕에서 의자왕으로 넘어가는 시기, 고구려는 연개소문이 힘을 키워 가고 있습니다.'],
      note: '삼국사기: 진평왕이 아들이 없어 맏딸 덕만이 즉위했고 선덕이라 하였습니다(632). 신하 중에는 여왕을 문제 삼는 목소리도 있었으며 이후 647년 비담의 난으로 이어집니다.',
      hist: { label: '을제에게 정사를 돕게 하고 민심을 안정시킨다', hint: '왕권과 민심이 안정된다.', fx: { people: 4, gold: -3 }, realm: { royal: 4 }, result: '여왕은 을제를 총리로 삼아 조정을 안정시키고, 백성을 위무했습니다.' },
      alts: [{ label: '군권을 먼저 단단히 틀어쥔다', hint: '[가상]', fx: { gold: -4 }, realm: { train: 4, royal: 2 }, result: '군부가 여왕 주위에 결집했습니다.' }] });
    T.push({ y: 634, place: 'seorabeol', title: '분황사 낙성 — 불교와 왕실', hint: '', src: SRC + ' 3~4년',
      text: ['여왕은 분황사를 완공하고 이듬해 영묘사를 창건합니다. 불교를 통해 왕실의 권위를 높이는 정책입니다. 당나라에서는 사신이 와 책봉을 내릴 것입니다.'],
      note: '삼국사기: 634년 분황사를 완성했고 635년 정월 당에 사신을 보냈으며, 당 태종은 왕을 주국 낙랑군공 신라왕으로 책봉했습니다(『삼국사기』 선덕왕 4년 및 당서). 영묘사는 635년 창건 기록입니다.',
      hist: { label: '분황사와 영묘사를 세우고 당에 사신을 보낸다', hint: '왕권과 외교 위신이 오른다.', fx: { gold: -10 }, realm: { royal: 6, econ: 2 }, rel: { tang: 14 }, flags: { buddhist: true }, result: '분황사가 낙성되고 당의 책봉이 이어졌습니다.' },
      alts: [{ label: '불사보다 변경 방비에 재물을 쏟는다', hint: '[가상]', fx: { gold: -8 }, realm: { defense: 6, train: 4 }, result: '변경이 한결 단단해졌습니다.' }] });
    T.push({ y: 636, m: '5월', place: 'seorabeol', title: '옥문곡 — 두꺼비와 여근곡', hint: '', src: SRC + ' 5년',
      text: ['궁 서쪽 옥문지에서 두꺼비들이 크게 모여 우는 일이 있었습니다. 여왕은 "병사의 모양이다. 서쪽 여근곡에 적병이 숨어 있을 것"이라 하여 알천과 필탄에게 군사를 보냅니다.'],
      note: '삼국사기 선덕왕 5년(636) 5월: 두꺼비가 옥문지에서 우는 일을 두고 왕이 서쪽 여근곡에 적병이 숨어 있을 것이라 하여 알천·필탄을 보냈고, 숨어 있던 백제 장군 우소의 군 5백을 모두 잡았다고 전합니다. 설화적 성격이 강합니다.',
      hist: { label: '알천과 필탄을 서쪽 여근곡으로 보낸다', hint: '백제 복병을 일망타진한다.', fx: { morale: 6, gold: 4 }, rel: { tang: 4 }, world: { 'silla.p': -3 }, realm: { intel: 4 }, result: '백제 장군 우소와 군사 5백이 사로잡혔습니다. 신하들은 여왕의 지혜에 감탄합니다.' },
      alts: [{ label: '설화를 믿지 않고 정찰을 먼저 보낸다', hint: '[가상]', fx: { gold: -3 }, realm: { intel: 6 }, result: '정찰로 적 움직임을 파악해 사전에 대비했습니다.' }] });
    T.push({ y: 638, m: '10월', place: 'chiljungseong', title: '칠중성 — 고구려의 북변 침공', hint: '', src: SRC + ' 7년',
      text: ['고구려가 칠중성(임진강 북쪽)에 쳐들어와 백성들이 들판으로 피신합니다. 알천이 대군을 이끌고 나가 막아야 합니다.'],
      note: '삼국사기 선덕왕 7년(638) 10월: 고구려가 칠중성을 침공하자 백성이 놀라 산과 들로 달아났고, 왕이 장군 알천에게 명해 맞서 싸워 이를 물리쳤습니다.',
      battle: { title: '칠중성 방어', defense: true, terrain: 1.3, enemy: { name: '고구려군', side: 'goguryeo', total: 36000, scale: 'silla', ref: 60, terrain: 1, morale: 65, mix: { line: .45, horse: .15, archer: .15, levy: .25 } },
        tactics: [{ label: '알천이 성을 중심으로 대군을 막는다', hint: '실제 역사.', tag: '역사', ours: { terrain: 1.5 } }, { label: '성 밖 요처에서 적을 유인해 친다', hint: '[가상]', ours: { ambush: true } }, { label: '농성하며 당에 구원을 청한다', hint: '[가상]', ours: { terrain: 1.7, morale: -3 } }],
        win: { title: '칠중성 방어 성공', text: ['고구려군이 물러났고 북변이 지켜졌습니다.'], fx: { morale: 8, people: 3 }, world: { 'goguryeo.hostility': 3 } },
        costly: { title: '칠중성 — 험난한 방어', text: ['성을 지켰으나 마을은 큰 피해를 입었습니다.'], fx: { morale: -2, people: -4 } },
        lose: { title: '칠중성 외곽 함락', text: ['북변 일부가 고구려에 넘어갔습니다.'], fx: { morale: -8, people: -6, food: -8 }, realm: { defense: -5 } } } });
    T.push({ y: 642, m: '8월', place: 'daeyaseong', zoom: 900, title: '대야성 함락 — 김춘추의 딸과 사위', hint: '이 해 백제가 서쪽 성들을 크게 칠 징후가 있습니다. 서방 방비를 점검하십시오.', src: SRC + ' 11년 · 백제본기 의자왕 2년',
      text: ['백제 의자왕이 서쪽 40여 성을 빼앗고 윤충의 군이 대야성을 포위합니다. 성주 김품석은 김춘추의 사위입니다. 성 안에서는 내분이 일고 있습니다.'],
      note: '삼국사기: 642년 7월 백제 의자왕이 신라 서쪽 40여 성을 빼앗았고, 8월 윤충이 군사 1만을 이끌고 대야성을 쳐서 성주 품석과 처자가 죽었습니다. 이 일로 김춘추가 복수를 다짐했다고 전합니다.',
      battle: { title: '대야성 방어', defense: true, terrain: 1.35, enemy: { name: '백제 윤충군', side: 'baekje', total: 30000, scale: 'silla', ref: 70, terrain: 1, morale: 75, mix: { line: .4, elite: .12, horse: .1, archer: .15, levy: .23 } },
        tactics: [{ label: '성에서 버티며 원군을 기다린다', hint: '실제 역사에서는 내분 속에 함락되었다.', tag: '역사', ours: { terrain: 1.4, morale: -6 } }, { label: '정예를 출성시켜 포위군의 허를 친다', hint: '[가상] 큰 도박.', ours: { ambush: true } }, { label: '성주를 교체하고 내분을 잠재운 뒤 사수한다', hint: '[가상]', ours: { terrain: 1.6, morale: 4 } }],
        win: { title: '대야성 사수', text: ['성은 지켜졌고 윤충군은 물러났습니다. (실제 역사와 다릅니다.)'], fx: { morale: 10, people: 4 }, world: { 'silla.p': -8 }, realm: { royal: 4 } },
        costly: { title: '대야성 — 큰 피해', text: ['성은 지켰으나 큰 피해를 입었습니다.'], fx: { morale: -3, people: -6 } },
        lose: { title: '대야성 함락', text: ['성이 무너졌습니다. 김품석과 가족이 죽었고 서쪽 방어선이 크게 흔들렸습니다. 김춘추는 복수를 다짐합니다.'], fx: { morale: -12, people: -8, food: -10 }, realm: { defense: -8, royal: -4 }, world: { 'silla.p': 6, 'silla.hostility': 8 }, flags: { daeya_lost: true } } } });
    T.push({ y: 642, m: '겨울', place: 'pyeongyang', title: '김춘추 고구려에 청병하다', hint: '', src: SRC + ' 11년 · 고구려본기 보장왕 1년',
      text: ['김춘추는 복수를 위해 고구려로 가 군사를 청하려 합니다. 연개소문이 정권을 잡은 고구려는 죽령 이북 땅의 반환을 조건으로 내세웁니다.'],
      note: '삼국사기: 642년 겨울 김춘추가 고구려에 가서 연개소문에게 군사를 청했으나, 고구려는 죽령 이북 땅(551년 신라가 차지한 땅)의 반환을 요구하며 그를 가두었습니다. 김유신의 병력 시위로 풀려났습니다(643년 설도 있음).',
      hist: { place: 'pyeongyang', label: '김춘추를 고구려에 보내 청병한다', hint: '실패하나 김유신과의 관계와 신뢰가 쌓인다.', fx: { gold: -4 }, rel: { goguryeo: -4 }, flags: { chunchu_goguryeo: true }, realm: { intel: 4 }, result: '고구려는 땅의 반환을 요구하며 춘추를 가두었으나 김유신의 시위로 풀려났습니다. 고구려와의 연합은 어려워졌습니다.' },
      alts: [{ place: 'changan', label: '고구려 대신 당에 직접 구원을 청한다', hint: '[가상]', fx: { gold: -6 }, rel: { tang: 12 }, result: '당과의 접촉이 앞당겨졌습니다.' }, { place: 'daeyaseong', label: '청병은 포기하고 자체 방비에 집중한다', hint: '[가상]', realm: { defense: 8, train: 5 }, fx: { food: -3 }, result: '자체 방비가 단단해졌습니다.' }] });
    T.push({ y: 643, m: '9월', place: 'changan', title: '당에 구원을 청하다 — 태종의 세 가지 계책', hint: '', src: SRC + ' 12년',
      text: ['여왕은 당에 사신을 보내 고구려·백제의 침공을 호소합니다. 당 태종은 세 가지 계책을 제시합니다. (1) 변경을 건드려 적을 분산시킨다, (2) 당의 군복과 기를 빌려 대군처럼 보이게 한다, (3) 여왕을 대신해 당 왕족을 신라 왕으로 보낸다.'],
      note: '삼국사기 선덕왕 12년(643) 9월: 사신이 당에 가 구원을 청했고, 당 태종은 세 가지 계책을 제시했으나 사신이 대답하지 못했습니다. 세 번째 책(여왕 폐위 시사)은 신라 내부의 불안을 키웠다고 전합니다.',
      hist: { place: 'changan', label: '당에 사신을 보내 구원을 청한다', hint: '당의 관심을 얻으나 여왕의 입지가 불안해진다.', fx: { gold: -8 }, rel: { tang: 14 }, realm: { royal: -3 }, world: { 'tang.commit': 10 }, result: '당은 즉각 군사를 보내지는 않았으나 신라에 대한 관심은 깊어졌습니다.' },
      alts: [{ label: '당의 세 번째 계책에 반발해 자주 노선을 택한다', hint: '[가상]', realm: { royal: 5, train: 3 }, rel: { tang: -8 }, result: '조정의 자존심은 세웠으나 당과는 서먹해졌습니다.' }] });
    T.push({ y: 645, place: 'seorabeol', title: '황룡사 9층목탑 — 아홉 나라를 누르다', hint: '', src: SRC + ' 14년 · 삼국유사 황룡사구층탑',
      text: ['자장 법사가 당에서 돌아와 황룡사에 9층 목탑을 세우면 이웃 나라가 항복한다고 청합니다. 한편 이 해 당 태종이 고구려를 침공하고, 백제는 신라 서쪽 7성을 공격합니다.'],
      note: '삼국사기·삼국유사: 645년(선덕 14년) 3월 황룡사 9층목탑을 완성했습니다. 같은 해 당 태종이 고구려를 침공할 때 신라는 병사 3만을 보냈고(5월), 그 틈에 백제가 신라 서쪽 7성을 빼앗았습니다.',
      hist: { place: 'yodongseong', label: '9층목탑을 세우고 당 원정군에 군사를 보낸다', hint: '왕권과 당의 신뢰가 오르나 서쪽이 비게 된다.', fx: { gold: -14, food: -6 }, realm: { royal: 7, econ: 2 }, rel: { tang: 12 }, army: { baekje_levy: -1000 }, world: { 'silla.hostility': 6 }, result: '황룡사 목탑이 완성되었습니다. 신라군 3만이 당군을 도와 고구려를 쳤으나 그 틈에 백제가 서쪽 7성을 빼앗았습니다.' },
      alts: [{ label: '당 원정에 군사를 보내지 않고 서쪽 방비에 집중한다', hint: '[가상]', fx: { gold: -8 }, realm: { defense: 8 }, rel: { tang: -6 }, result: '서쪽은 지켰으나 당과의 관계가 서먹합니다.' }] });
    T.push({ y: 647, m: '정월', place: 'seorabeol', zoom: 800, last: true, title: '비담의 난 — 별이 월성에 떨어지다', hint: '', src: SRC + ' 16년 · 진덕왕 즉위년',
      text: ['상대등 비담과 염종이 "여왕은 정치를 잘 못한다"며 반란을 일으켰습니다. 비담은 명활성에, 여왕의 군은 월성에 진을 쳤습니다. 밤에 큰 별이 월성에 떨어지자 반란군은 여왕의 패망이라며 환호합니다.', '김유신이 허수아비에 불을 붙여 연에 매달아 올려 "별이 다시 올라갔다" 하여 군사를 안심시킵니다.'],
      note: '삼국사기 선덕왕 16년(647) 정월: 비담·염종이 반란을 일으키자 왕은 월성, 반란군은 명활성에 주둔했고, 이 와중에 왕이 죽었습니다. 김유신이 진덕왕을 세우고 반란군을 평정했다고 전합니다(별 이야기는 열전).',
      battle: { title: '비담의 난', defense: true, terrain: 1.25, loseEnd: { kind: 'rebellion', title: '비담의 난 — 여왕의 폐위', text: '반란군이 월성을 무너뜨렸습니다. 선덕여왕은 폐위되었고 신라 조정은 진골 귀족들의 권력 다툼에 빠졌습니다. 여왕의 이름은 첨성대와 황룡사탑으로만 남았습니다.' },
        enemy: { name: '비담 반란군', side: 'silla', total: 30000, scale: 'silla', ref: 60, terrain: 1.1, morale: 60, mix: { line: .5, levy: .3, horse: .1, archer: .1 } },
        tactics: [{ label: '김유신이 별이 떨어진 징조를 연으로 가라앉히고 월성에서 반격한다', hint: '실제 역사의 흐름.', tag: '역사', ours: { morale: 8, terrain: 1.4 } }, { label: '월성에서 굳게 지키며 반란군의 군량이 다하길 기다린다', hint: '[가상]', ours: { terrain: 1.6 } }, { label: '정예 화랑을 이끌고 야간에 명활성을 급습한다', hint: '[가상]', ours: { ambush: true, morale: 4 } }],
        win: { title: '반란 진압', text: ['비담과 염종의 난이 진압되었습니다. 여왕은 사라져도 신라는 안정을 찾습니다.'], fx: { morale: 10, people: 3 }, realm: { royal: 8 } },
        costly: { title: '반란 진압 — 상처뿐인 승리', text: ['어렵게 반란을 진압했으나 조정의 분열이 깊습니다.'], fx: { morale: -2, people: -3 }, realm: { royal: 2 } },
        lose: { title: '', text: [''], fx: {} } } });

    SG.makeScenario({
      id: 'seondeok', king: '선덕여왕', sub: '신라 27대 왕 · 632~647', seal: '新', side: 'silla', country: '신라', cap: '금성', capPlace: 'seorabeol', start: 632, end: 647, armyName: '신라군',
      names: { silla: '백제', goguryeo: '고구려', tang: '당', wa: '왜' }, sides: { silla: 'baekje', goguryeo: 'goguryeo', tang: 'tang', wa: 'wa' },
      world: { silla: { p: 60, hostility: 38 }, goguryeo: { p: 85, hostility: 30 }, tang: { p: 130, commit: 5 }, wa: { p: 30, hostility: 3 } },
      rel: { silla: 5, goguryeo: 25, tang: 50, wa: 35 }, realm: { royal: 42, train: 48, defense: 52, navy: 20, econ: 55, intel: 38 }, res: { food: 58, gold: 52, people: 58, morale: 58 },
      army: { line: 11000, levy: 4000, elite: 1800, horse: 2200, archer: 2800, garrison: 5200, guard: 1000, navy: 500, scout: 300 },
      drift: { silla: { p: 0.8 }, tang: { commitTarget: 30 }, wa: { p: 0.1 } },
      targets: [tg('s_daeya', '백제의 대야성 방면(합천)', 'daeyaseong', 8500, 1.35, 12, -6, '642년 백제가 함락(삼국사기), 선덕 대 신라의 탈환 기록은 없음', { short: '대야성', from: 643 }), tg('s_sabi', '백제 도성 사비(가상)', 'sabi', 16000, 1.45, 24, -12, '선덕 대 백제 본국 직접 공략 기록 없음(가상)', { from: 645 }), tg('s_pyeongyang', '고구려 평양성(가상)', 'pyeongyang', 30000, 1.5, 24, -10, '선덕 대 고구려 본국 공략 기록은 없음(가상)', { from: 645 })],
      invasion: { from: 633, to: 646 }, timeline: T, histCmds: ['tribute_tang', 'temple', 'academy', 'fortify'],
      intro: { era: '632년 · 금성', title: '선덕여왕 — 한반도 최초의 여왕', focus: [128.5, 36.2, 1600], go: '632년, 즉위의 해로',
        text: ['당신은 <b>신라 27대 선덕여왕</b>(재위 632~647)입니다. 진평왕의 맏딸로 성골의 마지막 왕이며, 한반도 최초의 여왕입니다. 안으로는 귀족의 반발, 밖으로는 백제와 고구려의 압박이 거셉니다.', '15년 동안 사료에 남은 해(632·634·636·638·642·643·645·647)가 갈림길입니다. 642년 대야성 함락과 647년 비담의 난에 대비하십시오.'],
        note: '이 시대의 영역은 학설 차이가 커서 영역 색을 칠하지 않았습니다. 옥문곡·별 이야기는 설화적 서술을 포함합니다.' },
      real: '실제로는 642년 백제에 대야성을 잃은 뒤 김춘추가 고구려와 당에 구원을 청했고, 645년 황룡사 9층목탑을 완성했으며, 647년 정월 비담의 난 속에서 숨을 거두었습니다. 김유신과 김춘추가 이후 신라의 중심이 됩니다.',
      endNote: { prosper: '선덕의 신라는 어려운 시기를 넘기며 훗날 삼국통일의 기반을 다졌습니다.', steady: '신라는 위태로운 균형 속에서 선덕의 시대를 마무리했습니다.' } });
  })();

  /* ───────── 무열왕 ───────── */
  (function () {
    var SRC = '삼국사기 신라본기 태종무열왕';
    var T = [];
    T.push({ y: 654, m: '3월', place: 'seorabeol', zoom: 1500, title: '진골 최초의 왕 — 김춘추의 즉위', hint: '', src: SRC + ' 1년',
      text: ['진덕여왕이 후사 없이 죽자 귀족 회의는 알천에게 왕위를 권했으나 그는 사양하고 춘추를 추대합니다. 김춘추는 진골 출신 최초의 왕이 됩니다. 사위이자 처남인 김유신이 군을 쥐고 있습니다.'],
      note: '삼국사기: 654년 진덕왕이 죽자 군신이 알천에게 섭정을 청했으나 사양해 김춘추를 맞이했고, 춘추도 세 번 사양한 끝에 즉위했습니다.',
      hist: { label: '율령을 정비하고 김유신과 알천을 중용한다', hint: '왕권과 군권이 안정된다.', fx: { gold: -4 }, realm: { royal: 8, train: 3 }, result: '김유신이 상대등급으로 군을 맡고 조정이 안정되었습니다.' },
      alts: [{ label: '왕권 강화를 위해 중앙 관제를 개편한다', hint: '[가상]', fx: { gold: -8 }, realm: { royal: 10 }, army: { baekje_guard: 200 }, result: '집사부 중심의 개편이 이뤄졌습니다.' }] });
    T.push({ y: 655, m: '정월', place: 'chiljungseong', title: '북변 33성 — 고구려·백제·말갈의 협공', hint: '', src: SRC + ' 2년',
      text: ['고구려가 백제·말갈과 연합해 북쪽 33성을 공격합니다. 신라는 당에 구원을 청하고, 당 고종은 군사를 보내 고구려를 칩니다.'],
      note: '삼국사기 무열왕 2년(655) 정월: 고구려가 백제·말갈과 함께 신라 북쪽 변경 33성을 쳐서 빼앗았고, 왕이 당에 사신을 보내 구원을 청했습니다. 당은 정명진·소정방 등을 보내 고구려를 쳤습니다.',
      hist: { place: 'changan', label: '당에 구원을 청하고 북변 방어선을 정비한다', hint: '당과의 관계가 깊어진다.', fx: { gold: -6, food: -4 }, rel: { tang: 14 }, realm: { defense: 6 }, world: { 'tang.commit': 14 }, result: '당이 고구려를 쳐서 북변의 압박이 풀렸습니다. 신라와 당의 연합이 구체화됩니다.' },
      alts: [{ label: '당에 기대지 않고 김유신의 군으로 북변을 되찾는다', hint: '[가상]', fx: { food: -10, morale: 3 }, realm: { train: 6 }, army: { baekje_levy: -500 }, result: '자체 병력으로 일부 성을 되찾았으나 부담이 컸습니다.' }] });
    T.push({ y: 659, m: '4월', place: 'daeyaseong', title: '백제의 독산·동잠성 공격 — 당에 출병을 청하다', hint: '', src: SRC + ' 6년',
      text: ['백제가 독산·동잠성을 공격해 옵니다. 신라는 당 고종에게 사신을 보내 백제를 칠 군사를 청합니다.'],
      note: '삼국사기 무열왕 6년(659) 4월: 백제가 독산·동잠 두 성을 공격했고, 왕이 당에 군사를 청했습니다. 당 고종은 660년 소정방에게 13만 군을 주어 백제 정벌을 명했습니다.',
      hist: { place: 'changan', label: '당에 사신을 보내 백제 정벌군의 출병을 청한다', hint: '당군의 대규모 파병이 가능해진다.', fx: { gold: -10 }, rel: { tang: 16 }, world: { 'tang.commit': 24 }, realm: { train: 4 }, flags: { tang_alliance: true }, result: '당 고종이 소정방에게 13만 군을 주어 백제 정벌을 명했습니다.' },
      alts: [{ label: '독자적으로 백제 방어선을 굳히고 당의 출병 요청은 미룬다', hint: '[가상]', fx: { food: -6 }, realm: { defense: 8, train: 5 }, result: '신라 자력 방어선이 굳어졌습니다.' }] });
    T.push({ y: 660, m: '7월', place: 'hwangsanbeol', zoom: 900, title: '황산벌 — 계백의 5천과 신라 5만', hint: '당군이 7월 초 백제 앞바다에 도착합니다. 군량과 병력, 훈련을 충분히 쌓아 두십시오.', src: SRC + ' 7년 · 백제본기 의자왕 20년',
      text: ['당 소정방의 군이 서해 덕물도에 상륙합니다. 신라군은 김유신이 이끌고 황산벌로 향합니다. 백제 장군 <b>계백</b>은 결사 5천 병력으로 세 곳에 진을 치고 맞섭니다.', '약속된 날짜까지 당군과 합류해야 합니다. 지체하면 당과의 관계가 틀어집니다.'],
      note: '삼국사기: 660년 7월 9일 김유신이 황산벌에서 계백의 5천 결사대와 싸워 네 번 졌으나, 화랑 반굴·관창의 희생으로 사기가 올라 5번째 접전에서 크게 이겼습니다. 이어 소정방과 합류해 사비성을 포위하고, 7월 18일 의자왕이 항복했습니다.',
      battle: { title: '황산벌 전투', commit: 0.95, enemy: { name: '계백의 백제군', side: 'baekje', total: 20000, scale: 'silla', ref: 45, terrain: 1.35, morale: 90, mix: { line: .35, elite: .3, archer: .2, horse: .1, levy: .05 } },
        tactics: [{ label: '병력의 압도적 우위로 정면 공격하되 화랑을 앞세워 사기를 돋운다', hint: '실제 역사. 반굴과 관창의 희생이 사기를 끌어올렸다.', tag: '역사', ours: { morale: 10 } }, { label: '우회로로 한쪽 진을 돌파한다', hint: '[가상]', ours: { ambush: true } }, { label: '당군의 합류를 기다려 양면으로 친다', hint: '[가상] 일정이 늦어질 수 있다.', ours: { pace: 0.9, morale: 4 } }],
        win: { title: '황산벌 대승', text: ['계백의 결사대가 무너졌습니다. 신라군은 소정방과 합류해 사비성으로 향합니다.'], fx: { gold: 22, morale: 14, people: 5 }, realm: { royal: 6 }, world: { 'silla.p': -18 }, captureTargets: ['s_sabi'] },
        costly: { title: '황산벌 — 피로 얻은 승리', text: ['큰 희생 끝에 계백군을 꺾었습니다.'], fx: { gold: 8, morale: 2, people: -5 }, world: { 'silla.p': -10 }, captureTargets: ['s_sabi'] },
        lose: { title: '황산벌 패전', text: ['백제군의 결사항전에 막혔고 당군과의 합류가 늦어졌습니다. 소정방의 노여움을 삽니다.'], fx: { morale: -10, people: -6, food: -10 }, rel: { tang: -10 }, realm: { royal: -4 } } } });
    T.push({ y: 661, m: '6월', place: 'seorabeol', last: true, title: '무열왕의 서거 — 문무왕에게 넘기는 전쟁', hint: '', src: SRC + ' 8년',
      text: ['백제는 멸망했으나 부흥군이 일어나고, 고구려는 북한산성을 노립니다. 왕은 병석에 있습니다. 맏아들 법민(문무왕)이 후사를 이을 준비를 하고 있습니다.'],
      note: '삼국사기: 661년 6월 무열왕이 죽고 법민이 즉위했습니다. 같은 해 5월 고구려와 말갈이 북한산성을 에워쌌습니다.',
      hist: { label: '법민에게 군권을 넘기고 고구려 방어와 부흥군 진압을 당부한다', hint: '후사 체제가 안정된다.', fx: { gold: -6 }, realm: { royal: 6, defense: 4 }, result: '왕은 법민에게 대업을 맡기고 눈을 감았습니다.' },
      alts: [{ label: '사비·웅진 수비에 병력을 증파한다', hint: '[가상]', fx: { food: -8 }, realm: { defense: 6 }, army: { baekje_garrison: 800 }, result: '옛 백제 땅의 수비가 보강되었습니다.' }] });

    SG.makeScenario({
      id: 'muyeol', king: '태종 무열왕', sub: '신라 29대 왕 · 654~661', seal: '新', side: 'silla', country: '신라', cap: '금성', capPlace: 'seorabeol', start: 654, end: 661, armyName: '신라군',
      names: { silla: '백제', goguryeo: '고구려', tang: '당', wa: '왜' }, sides: { silla: 'baekje', goguryeo: 'goguryeo', tang: 'tang', wa: 'wa' },
      world: { silla: { p: 45, hostility: 55 }, goguryeo: { p: 95, hostility: 35 }, tang: { p: 140, commit: 8 }, wa: { p: 30, hostility: 3 } },
      rel: { silla: 3, goguryeo: 18, tang: 55, wa: 40 }, realm: { royal: 55, train: 58, defense: 55, navy: 25, econ: 58, intel: 42 }, res: { food: 60, gold: 55, people: 58, morale: 62 },
      army: { line: 14000, levy: 5000, elite: 2500, horse: 2500, archer: 3500, garrison: 5500, guard: 1200, navy: 800, scout: 400, hwarang: 600 },
      drift: { silla: { p: -0.5 }, tang: { commitTarget: 70 }, wa: { p: 0.1 } },
      targets: [tg('s_sabi', '백제 도성 사비', 'sabi', 10000, 1.45, 24, -14, '660년 7월 18일 항복(삼국사기)', { short: '사비', from: 658 }), tg('s_daeya', '백제 서방(대야성 방면)', 'daeyaseong', 7000, 1.3, 12, -6, '642년 백제가 함락한 성(삼국사기)'), tg('s_pyeongyang', '고구려 평양성(가상)', 'pyeongyang', 32000, 1.55, 26, -12, '무열왕 대 평양성 공략 기록은 없음(가상)', { from: 660 })],
      invasion: { from: 655, to: 659 }, timeline: T, histCmds: ['tribute_tang', 'fortify', 'academy', 'drill'],
      intro: { era: '654년 · 금성', title: '태종 무열왕 — 삼국통일의 문을 열다', focus: [128.0, 36.2, 2200], go: '654년, 즉위의 해로',
        text: ['당신은 <b>신라 29대 태종 무열왕</b> 김춘추(재위 654~661)입니다. 진골 출신 최초의 왕으로, 당과의 동맹을 설계한 외교의 달인입니다. 곁에는 군을 이끄는 김유신이 있습니다.', '7년 안에 사료에 남은 해(654·655·659·660·661)가 갈림길이 됩니다. 660년 황산벌과 사비성에서 백제의 운명이 갈립니다.'],
        note: '이 시대의 영역은 학설 차이가 커서 영역 색을 칠하지 않았습니다.' },
      real: '실제로는 655년 북변 33성을 잃고 당에 구원을 청했으며, 660년 황산벌에서 계백을 꺾고 당군과 사비성을 함락해 백제를 멸망시켰습니다. 무열왕은 661년 6월 숨을 거두었고 문무왕이 뒤를 이었습니다.',
      endNote: { hegemon: '무열왕의 신라는 당의 힘을 빌려 백제를 무너뜨리고 반도 서쪽까지 영향권에 넣었습니다.', prosper: '신라는 당과의 동맹을 안정시키며 백제 멸망의 열매를 거두었습니다.' } });
  })();

  /* ───────── 문무왕 ───────── */
  (function () {
    var SRC = '삼국사기 신라본기 문무왕';
    var T = [];
    T.push({ y: 662, m: '정월', place: 'pyeongyang', zoom: 1400, title: '평양의 당군에 군량을 보내다', hint: '', src: SRC + ' 2년',
      text: ['당군이 평양성을 에워싸고 있으나 눈과 추위로 군량이 떨어졌습니다. 김유신이 쌀 4천 석과 조 2만 2천 석을 싣고 평양까지 가려 합니다. 길은 험하고 적이 노리는 땅입니다.'],
      note: '삼국사기 문무왕 2년(662) 정월: 김유신이 쌀 4천 석, 조 2만 2천여 석을 싣고 고구려 땅을 지나 평양의 당군에 전달했습니다. 소정방은 이를 받고 철수했습니다.',
      hist: { place: 'pyeongyang', label: '김유신에게 군량을 맡겨 고구려 땅을 지나 평양까지 보낸다', hint: '당의 신뢰가 오르나 군량이 크게 준다.', fx: { food: -14, morale: 3 }, rel: { tang: 14 }, world: { 'tang.commit': 10 }, result: '군량이 평양의 당군에 닿았습니다. 소정방은 크게 감사하며 철군했습니다.' },
      alts: [{ label: '군량 수송을 미루고 백제 옛땅의 부흥군 진압에 집중한다', hint: '[가상]', fx: { food: -4 }, realm: { defense: 5, train: 4 }, rel: { tang: -8 }, result: '당과의 관계가 서먹해졌습니다.' }] });
    T.push({ y: 663, m: '8월', place: 'baekgang', zoom: 900, title: '백강 전투 — 왜·백제 부흥군과의 결전', hint: '부흥군과 왜 수군이 합류할 징후가 있습니다. 수군력과 병력을 올려 두십시오.', src: SRC + ' 3년 · 백제본기 · 일본서기',
      text: ['부여풍과 왜의 지원군이 백제 부흥군의 거점 주류성에 이릅니다. 당 수군과 신라군이 백강 하구에서 맞서 싸웁니다. 왜 수군 수백 척이 들어옵니다.'],
      note: '삼국사기·구당서: 663년 8월 당 수군 170척이 백강에서 왜선 400척을 맞아 네 번 싸워 모두 이겼고, 왜선 400척을 불태웠다고 전합니다. 이어 신라군이 주류성을 함락했습니다.',
      battle: { title: '백강 전투', commit: 0.9, enemy: { name: '왜·백제 부흥군', side: 'wa', total: 30000, scale: 'goguryeo', ref: 40, terrain: 1, morale: 68, mix: { navy: .35, line: .3, levy: .3, archer: .05 } },
        tactics: [{ label: '당 수군과 협력해 백강 어귀에서 왜선을 맞아 싸운다', hint: '실제 역사. 4전 4승.', tag: '역사', ours: { morale: 6 } }, { label: '신라군은 육상에서 주류성을 먼저 친다', hint: '[가상]', ours: { terrain: 1.2 } }, { label: '화공선을 준비해 왜선을 불태운다', hint: '[가상]', ours: { ambush: true } }],
        win: { title: '백강 대승 — 부흥군 붕괴', text: ['왜 수군 400척이 불타고 주류성이 항복했습니다. 백제 부흥 운동은 사실상 끝났습니다.'], fx: { gold: 14, morale: 12, people: 4 }, realm: { royal: 5, navy: 4 }, world: { 'goguryeo.p': -15, 'wa.p': -8 } },
        costly: { title: '백강 — 힘겨운 승리', text: ['전투는 이겼으나 신라의 피해도 컸습니다.'], fx: { gold: 6, morale: 2, people: -3 }, world: { 'goguryeo.p': -8 } },
        lose: { title: '백강 — 패전', text: ['왜·부흥군의 저항이 거세 진압이 길어졌습니다.'], fx: { morale: -10, people: -5, food: -10 }, realm: { royal: -4 }, world: { 'goguryeo.hostility': 8 } } } });
    T.push({ y: 665, m: '8월', place: 'ungjin', title: '취리산 회맹 — 웅진도독부의 출범', hint: '', src: SRC + ' 5년',
      text: ['당은 웅진도독 부여융과 신라 왕이 맹약하도록 취리산에서 회맹을 엽니다. 신라는 백제 옛 땅의 지배권을 당과 나누어야 합니다. 겉으로는 우호이나 속으로는 불신이 깊습니다.'],
      note: '삼국사기 문무왕 5년(665) 8월: 왕이 웅진 취리산에서 당 칙사 유인원과 웅진도독 부여융 등과 회맹했습니다. 회맹문은 백제 옛 땅의 경계와 평화를 약속하는 내용이었습니다.',
      hist: { label: '취리산 회맹에 참여해 당·부여융과 맹약한다', hint: '당과의 관계가 안정되나 백제 땅의 지배권을 완전히 얻지는 못한다.', fx: { gold: -6 }, rel: { tang: 8 }, realm: { intel: 3 }, flags: { chiri: true }, result: '회맹이 이루어졌습니다. 그러나 당이 웅진도독부를 통해 백제 땅을 직접 다스리려는 속셈이 보입니다.' },
      alts: [{ label: '회맹은 형식으로 받아들이되 백제 옛 땅의 인심을 은밀히 모은다', hint: '[가상]', fx: { gold: -6 }, realm: { intel: 6 }, rel: { tang: 2 }, result: '백제 유민 사이에 신라에 대한 호의가 퍼집니다.' }] });
    T.push({ y: 668, m: '9월', place: 'pyeongyang', zoom: 900, title: '평양성 함락 — 고구려의 멸망', hint: '당군이 평양성을 에워싸기 시작합니다. 병력과 군량을 충분히 쌓아 두십시오.', src: SRC + ' 8년 · 고구려본기 보장왕 27년',
      text: ['당 이적의 군이 평양성을 에워싸고 신라군도 합류합니다. 고구려 안에서는 내분이 일고, 성문이 열릴 징후가 보입니다. 성은 다섯 달 포위 끝에 함락을 눈앞에 두고 있습니다.'],
      note: '삼국사기: 668년 6월 문무왕이 서울을 출발했고, 9월 21일 고구려 보장왕이 항복했습니다. 승려 신성이 내응해 성문을 열었다고 전합니다. 이로써 고구려가 멸망했습니다(7백여 년).',
      battle: { title: '평양성 포위전', commit: 0.85, enemy: { name: '고구려 평양성군', side: 'goguryeo', total: 20000, scale: 'silla', ref: 105, terrain: 1.5, morale: 55, mix: { line: .4, garrison: .25, elite: .1, archer: .15, levy: .1 } },
        tactics: [{ label: '당군과 함께 성을 포위하고 내응을 기다린다', hint: '실제 역사. 신성의 내응으로 성이 열렸다.', tag: '역사', ours: { morale: 6 } }, { label: '신라군이 단독으로 성문을 급습한다', hint: '[가상]', ours: { ambush: true } }, { label: '당군과 협의하여 성 주변 보급로를 끊고 장기전을 택한다', hint: '[가상]', ours: { pace: 0.8, terrain: 1.15 } }],
        win: { title: '평양성 함락 — 고구려 멸망', text: ['보장왕이 항복했고 고구려가 멸망했습니다. 이제 신라와 당의 동맹은 이익 분배를 놓고 갈림길에 섭니다.'], fx: { gold: 20, morale: 12, people: 4 }, realm: { royal: 7 }, world: { 'silla.p': -30 }, captureTargets: ['m_pyeongyang'] },
        costly: { title: '평양성 — 힘겨운 승리', text: ['큰 희생을 치르고 평양성이 함락되었습니다.'], fx: { gold: 8, morale: 2, people: -5 }, captureTargets: ['m_pyeongyang'] },
        lose: { title: '평양성 — 지연', text: ['성은 끝내 무너지지 않아 포위가 길어졌습니다. 당의 압박이 거세집니다.'], fx: { morale: -8, food: -10, people: -3 }, realm: { royal: -3 }, rel: { tang: -6 } } } });
    T.push({ y: 669, place: 'seorabeol', title: '구진천의 쇠뇌 — 당과의 충돌을 앞두고', hint: '', src: SRC + ' 9년',
      text: ['당과의 사이가 갈수록 멀어집니다. 당에서 돌아온 기술자 구진천이 천 보를 쏘는 쇠뇌를 만들어 바칩니다. 당과 맞서려면 군비와 무기가 필요합니다.'],
      note: '삼국사기 문무왕 9년(669): 쇠뇌 기술자 사찬 구진천이 당에서 돌아와 목노(木弩)를 만들어 바쳤고, 쏘면 천 보에 이르렀다고 전합니다.',
      hist: { label: '구진천에게 쇠뇌를 만들게 하고 군비를 정비한다', hint: '궁병 전력이 오르고 당과의 충돌에 대비한다.', fx: { gold: -10 }, realm: { train: 6, defense: 5 }, army: { baekje_archer: 800 }, result: '쇠뇌가 대량 제작되어 변경에 배치되었습니다.' },
      alts: [{ label: '당과의 관계를 유지하며 군비는 점진적으로 늘린다', hint: '[가상]', fx: { gold: -4 }, realm: { train: 3 }, rel: { tang: 6 }, result: '당과의 마찰은 줄었으나 군비는 더딥니다.' }] });
    T.push({ y: 670, m: '6~7월', place: 'sabi', title: '고구려 부흥군과 백제 땅 — 당과의 전쟁이 시작되다', hint: '당이 신라를 의심하기 시작합니다. 대비하십시오.', src: SRC + ' 10년',
      text: ['고구려 유민 안승이 4천여 호를 거느리고 신라로 왔습니다. 고구려 부흥군(고연무 등)은 요동에서 당군과 싸우고, 신라군도 백제 옛 땅에서 당이 둔 웅진도독부를 압박합니다. 당과 신라의 동맹이 사실상 무너집니다.'],
      note: '삼국사기 문무왕 10년(670): 3월 설오유와 고연무가 압록강을 건너 당군을 쳤고, 6월 고구려 유민 안승을 고구려왕으로 삼아 금마저에 거처하게 했습니다. 신라군은 백제 옛 땅 80여 성을 빼앗았습니다.',
      hist: { label: '안승을 받아들이고 백제 옛 땅의 성들을 차지한다', hint: '당과의 동맹이 깨지고 당이 주적이 된다.', fx: { gold: 8, food: -8, morale: 4 }, realm: { royal: 4 }, flags: { tang_break: true }, fn: function (g, S) { g.sb.swapRoles('silla', 'tang'); var s = g.sb.s; s.world.silla.hostility = 80; s.world.silla.p = 115; s.rel.silla = 5; s.world.tang.p = 30; s.world.tang.commit = 0; s.world.tang.hostility = 3; s.rel.tang = 70; g.sb.setTargets([mk('tang', { id: 'm_maeso', name: '당 이근행군(임진강 북쪽)', short: '매소성', place: 'maesoseong', garrison: 14000, terrain: 1.35, gold: 16, people: 3, power: -8, hist: '675년 신라가 매소성 전투에서 이근행군을 격파(삼국사기)' }), mk('tang', { id: 'm_ungjin', name: '당 웅진도독부(웅진)', short: '웅진', place: 'ungjin', garrison: 9000, terrain: 1.4, gold: 14, people: 3, power: -6, hist: '671~676년 신라가 백제 옛 땅의 당 세력을 몰아냄' }), mk('tang', { id: 'm_pyeongyang', name: '안동도호부(평양)', short: '평양', place: 'pyeongyang', garrison: 12000, terrain: 1.5, gold: 18, people: 3, power: -10, hist: '676년 안동도호부가 요동으로 철수' })]); }, result: '신라는 당과 결별했습니다. 고구려 유민을 받아들이고 백제 옛 땅의 성들을 취하며 당군과 맞섭니다.' },
      alts: [{ place: 'changan', label: '당과의 동맹을 유지하며 안승은 받아들이지 않는다', hint: '[가상] 평화는 유지되나 통일의 주도권은 당이 쥔다.', fx: { gold: 4 }, rel: { tang: 8 }, realm: { royal: -3 }, result: '당과의 관계는 유지되었으나 신라의 입지는 좁아졌습니다.' }] });
    T.push({ y: 671, m: '6월', place: 'sabi', title: '사비성 함락 — 소부리주의 설치', hint: '', src: SRC + ' 11년',
      text: ['신라군이 사비성을 차지해 소부리주를 설치합니다. 당 장군 설인귀가 질책의 편지를 보내자, 문무왕은 반박하는 답서를 보냅니다. 이 답서는 신라가 당과 싸우는 이유를 밝힌 글입니다.'],
      note: '삼국사기 문무왕 11년(671): 신라군이 사비성을 점령하고 소부리주를 설치했으며, 당 장군 설인귀가 보낸 글에 문무왕이 장문의 답서(「답설인귀서」)를 보냈습니다.',
      hist: { label: '사비성을 점령하고 소부리주를 설치, 설인귀에게 답서를 보낸다', hint: '옛 백제 땅의 지배권이 확고해진다.', fx: { gold: 10, food: -6 }, realm: { royal: 5, defense: 4 }, world: { 'silla.hostility': 4 }, result: '소부리주가 설치되고 백제 옛 땅이 신라의 행정구역에 들어왔습니다.' },
      alts: [{ label: '사비성은 취하지 않고 방어선을 한강·임진강선에 둔다', hint: '[가상]', realm: { defense: 8, train: 3 }, fx: { food: -4 }, result: '방어선이 북쪽으로 후퇴했으나 병력 부담은 줄었습니다.' }] });
    T.push({ y: 672, m: '8월', place: 'maesoseong', title: '석문 전투 — 패전과 교훈', hint: '', src: SRC + ' 12년',
      text: ['당군이 석문(황해 수안 일대로 비정)에 진을 치자 신라 장수들이 맞서 싸웁니다. 신라군이 크게 패하고 여러 장수가 전사합니다. 그러나 이 패전은 신라가 무기와 전술을 가다듬는 계기가 됩니다.'],
      note: '삼국사기 문무왕 12년(672) 8월: 신라군이 석문 들에서 당군과 싸워 크게 패했고 한시랑 등 여러 장수가 전사했습니다.',
      hist: { label: '패전을 받아들이고 장수와 병사를 위로하며 군정을 재정비한다', hint: '사기와 군정이 회복된다.', fx: { morale: -4, gold: -6 }, realm: { train: 6, defense: 5 }, result: '군정이 재정비되었습니다. 신라는 패전에서 교훈을 얻어 갑니다.' },
      alts: [{ label: '복수전을 서두른다', hint: '[가상] 위험하다.', fx: { morale: 4, food: -10 }, army: { baekje_levy: -600 }, realm: { train: -2 }, result: '급한 복수전으로 병력 손실이 커졌습니다.' }] });
    T.push({ y: 674, m: '정월', place: 'changan', title: '당 고종이 문무왕의 관작을 빼앗다', hint: '', src: SRC + ' 14년',
      text: ['당 고종이 신라 왕의 관작을 삭탈하고 당에 있던 아우 김인문을 신라왕으로 세운다고 선포합니다. 유인궤가 대군을 이끌고 신라를 칠 것입니다.'],
      note: '삼국사기 문무왕 14년(674) 정월: 당 고종이 왕의 관작을 삭탈하고 당에 머무르던 김인문을 신라왕에 책봉해 유인궤를 보내 신라를 치게 했습니다. 이듬해 문무왕이 사죄사를 보내자 관작이 복구되었습니다(675).',
      hist: { label: '사죄사를 보내 시간을 벌면서 전쟁 준비를 마친다', hint: '시간을 벌어 군비를 점검한다.', fx: { gold: -8 }, rel: { goguryeo: 6 }, realm: { train: 5, defense: 5 }, result: '당은 한동안 공격을 늦추었고, 신라는 그 시간에 방비를 굳혔습니다.' },
      alts: [{ label: '사죄하지 않고 전선에서 맞선다', hint: '[가상] 병력과 사기가 필요하다.', fx: { food: -8 }, realm: { train: 3 }, world: { 'silla.hostility': 8 }, result: '당과의 전면전이 앞당겨졌습니다.' }] });
    T.push({ y: 675, m: '9월', place: 'maesoseong', zoom: 900, title: '매소성 전투 — 이근행의 20만', hint: '당의 대군이 올 때가 가까워 옵니다. 군량과 병력, 훈련을 충분히 쌓아 두십시오.', src: SRC + ' 15년',
      text: ['당의 이근행이 20만 대군으로 매소성에 진을 쳤습니다. 신라군은 한 달 넘게 그를 견제하며 보급로를 노립니다. 병력은 열세이나 방어선과 지형, 보급로가 신라의 무기입니다.'],
      note: '삼국사기 문무왕 15년(675) 9월: 당 이근행이 20만 군으로 매소성에 주둔했고 신라군이 이를 공격해 쫓아냈으며 말 3만 380필과 병기를 얻었습니다. 이 전투가 나당전쟁의 분수령이 되었습니다.',
      battle: { title: '매소성 전투', defense: true, terrain: 1.35, enemy: { name: '이근행의 당군', side: 'tang', total: 60000, scale: 'silla', ref: 115, terrain: 1, morale: 62, mix: { line: .4, horse: .25, elite: .1, archer: .15, siege: .1 } },
        tactics: [{ label: '당군의 보급로를 끊어 지치게 한 뒤 야간에 총공격한다', hint: '실제 역사의 흐름.', tag: '역사', ours: { ambush: true, morale: 6 } }, { label: '성책과 방어선을 굳혀 당군의 피로를 기다린다', hint: '[가상]', ours: { terrain: 1.65 } }, { label: '정예를 모아 당군 진영의 가장 약한 곳을 정면으로 돌파한다', hint: '[가상] 큰 도박.', ours: { morale: 10, ambush: false } }],
        win: { title: '매소성 대승', text: ['당군이 달아났고 신라군은 말 3만여 필과 병기를 얻었습니다. 나당전쟁의 흐름이 신라로 기울었습니다.'], fx: { gold: 22, morale: 14, people: 4 }, realm: { royal: 7 }, world: { 'silla.p': -25 }, captureTargets: ['m_maeso'] },
        costly: { title: '매소성 — 상처뿐인 승리', text: ['큰 희생을 치르고 당군을 물리쳤습니다.'], fx: { gold: 10, morale: 2, people: -5 }, world: { 'silla.p': -12 }, captureTargets: ['m_maeso'] },
        lose: { title: '매소성 패전', text: ['당군의 압박이 거세 임진강 방어선이 흔들렸습니다.'], fx: { morale: -12, people: -8, food: -12 }, realm: { defense: -8, royal: -4 }, world: { 'silla.p': 8 } } } });
    T.push({ y: 676, m: '11월', place: 'gibeolpo', zoom: 900, title: '기벌포 전투 — 설인귀의 수군', hint: '당 수군이 서해에서 다가옵니다. 수군력도 점검해 두십시오.', src: SRC + ' 16년',
      text: ['설인귀가 수군을 이끌고 금강 어귀 기벌포에 상륙을 시도합니다. 신라 수군은 진을 치고 맞섭니다. 스물두 번을 싸워 이기면 당은 서해에서 물러납니다.'],
      note: '삼국사기 문무왕 16년(676) 11월: 설인귀가 수군을 이끌고 기벌포에 쳐들어오자 사찬 시득이 군사를 이끌어 싸웠고, 처음에는 졌으나 뒤에 크게 이겨 4천여 명의 목을 베었다고 전합니다(22번 싸웠다고도 전합니다).',
      battle: { title: '기벌포 전투', commit: 0.8, enemy: { name: '설인귀의 당 수군', side: 'tang', total: 24000, scale: 'silla', ref: 115, terrain: 1, morale: 65, mix: { navy: .35, line: .3, archer: .15, siege: .1, levy: .1 } },
        tactics: [{ label: '연안 포진 수군으로 여러 차례 싸워 당군을 소모시킨다', hint: '실제 역사. 처음엔 졌으나 거듭 싸워 이겼다.', tag: '역사', ours: { terrain: 1.3, morale: 4 } }, { label: '화공선으로 당 수군을 한꺼번에 불태운다', hint: '[가상]', ours: { ambush: true } }, { label: '상륙을 허용하고 육지에서 포위해 친다', hint: '[가상]', ours: { terrain: 1.2, morale: 5 } }],
        win: { title: '기벌포 대승', text: ['당 수군이 물러났습니다. 곧 안동도호부도 요동으로 철수하여 나당전쟁은 신라의 승리로 끝납니다.'], fx: { gold: 18, morale: 12, people: 4 }, realm: { royal: 7, navy: 5 }, world: { 'silla.p': -25 }, captureTargets: ['m_ungjin', 'm_pyeongyang'] },
        costly: { title: '기벌포 — 피로 얻은 승리', text: ['긴 싸움 끝에 당 수군을 물리쳤습니다.'], fx: { gold: 8, morale: 2, people: -4 }, world: { 'silla.p': -12 }, captureTargets: ['m_ungjin'] },
        lose: { title: '기벌포 패전', text: ['당 수군이 서해 연안을 휩쓸었습니다.'], fx: { morale: -10, people: -6, food: -8 }, realm: { defense: -6 }, world: { 'silla.p': 6 } } } });
    T.push({ y: 681, m: '7월', place: 'seorabeol', last: true, title: '문무왕의 유조 — 동해의 용이 되리라', hint: '', src: SRC + ' 21년',
      text: ['왕은 병석에서 후사를 신문왕에게 맡깁니다. 유조를 남깁니다: "죽은 뒤 열흘 안에 화장하고 동해에 장사하라. 나는 호국의 용이 되어 나라를 지키겠다."'],
      note: '삼국사기 문무왕 21년(681) 7월: 왕이 죽자 유언에 따라 동해 어귀의 큰 바위 위에 장사 지냈습니다. 삼국사기에는 "만약 병영 안에서 장수들을 혼란시키지 말라" 등의 유조도 전합니다. 신문왕이 대왕암 일대에 감은사를 완성했다는 전승이 있습니다.',
      hist: { label: '유조를 남기고 화장해 동해에 장사하도록 한다', hint: '호국의 상징이 남는다.', fx: { gold: -4 }, realm: { royal: 8 }, result: '문무왕은 동해의 바위섬에 묻혔고 사람들은 그를 호국의 용이라 불렀습니다.' },
      alts: [{ label: '후사에게 통일의 마무리와 백성 안정을 당부한다', hint: '[가상]', fx: { people: 4 }, realm: { econ: 4, royal: 4 }, result: '후사 체제가 평온하게 마무리되었습니다.' }] });

    SG.makeScenario({
      id: 'munmu', king: '문무왕', sub: '신라 30대 왕 · 661~681', seal: '新', side: 'silla', country: '신라', cap: '금성', capPlace: 'seorabeol', start: 661, end: 681, armyName: '신라군',
      names: { silla: '고구려', goguryeo: '백제 부흥군', tang: '당', wa: '왜' }, sides: { silla: 'goguryeo', goguryeo: 'baekje', tang: 'tang', wa: 'wa' },
      world: { silla: { p: 105, hostility: 55 }, goguryeo: { p: 35, hostility: 50 }, tang: { p: 115, commit: 30 }, wa: { p: 35, hostility: 20 } },
      rel: { silla: 3, goguryeo: 8, tang: 62, wa: 15 }, realm: { royal: 58, train: 60, defense: 58, navy: 28, econ: 58, intel: 45 }, res: { food: 60, gold: 55, people: 58, morale: 62 },
      army: { line: 16000, levy: 6000, elite: 3000, horse: 3000, archer: 4000, garrison: 6000, guard: 1500, navy: 1200, scout: 500, hwarang: 800 },
      drift: { silla: { p: -0.5 }, tang: { commitTarget: 60 }, wa: { p: 0.1 } },
      targets: [tg('m_pyeongyang', '고구려 평양성', 'pyeongyang', 20000, 1.5, 22, -14, '668년 9월 당·신라 연합군이 함락(삼국사기)', { short: '평양', from: 663 }), tg('m_gungnae', '고구려 국내성 방면(가상)', 'gungnae', 12000, 1.4, 14, -6, '문무왕 대 신라의 직접 공략 기록은 없음(가상)'), tg('m_juryu', '백제 부흥군 주류성', 'juryuseong', 9000, 1.4, 12, -6, '663년 신라·당군이 함락(삼국사기)', { short: '주류성', to: 664 })],
      invasion: { from: 662, to: 680 }, timeline: T, histCmds: ['tribute_tang', 'fortify', 'drill', 'archers'],
      intro: { era: '661년 · 금성', title: '문무왕 — 삼국을 하나로', focus: [127.6, 36.8, 2000], go: '661년, 즉위의 해로',
        text: ['당신은 <b>신라 30대 문무왕</b> 법민(재위 661~681)입니다. 아버지 무열왕이 백제를 무너뜨린 직후 왕위에 올랐습니다. 이제 고구려를 무너뜨려야 하고, 그 뒤에는 동맹이었던 당과 싸워야 할지도 모릅니다.', '20년 안에 사료에 남은 해(662·663·665·668·669·670·671·672·674·675·676·681)가 갈림길이 됩니다. <b>670년 당과의 동맹은 파탄</b>하고, 당은 우방에서 주적이 됩니다.'],
        note: '이 시대의 영역은 학설 차이가 커서 영역 색을 칠하지 않았습니다.' },
      real: '실제로는 663년 백강에서 왜·부흥군을 물리치고, 668년 당과 함께 고구려를 멸망시켰으며, 670년부터 당과 싸워 675년 매소성, 676년 기벌포에서 당군을 몰아냈습니다. 신라는 대동강~원산만 이남을 차지한 통일을 이루었습니다(대동강 이북은 당이 요동으로 철수하며 공백이 생겼습니다).',
      endNote: { hegemon: '문무왕의 신라는 당군까지 몰아내고 대동강 이남의 완전한 통일을 이루었습니다.', prosper: '신라는 당과의 전쟁을 견뎌내고 통일의 기반을 안정시켰습니다.' } });
  })();
})();

;
/* ==== js/main.js ==== */
window.__sgL=6;
/* 진입점: 타이틀(왕 추첨) → 시나리오 시작 */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var game, kings = SG.data.kings, cards = [];
  function build() {
    var box = $('#kings'); box.innerHTML = ''; cards = [];
    kings.forEach(function (k) {
      var c = document.createElement('div');
      k.ready = !!SG.scenarios[k.id];
      c.className = 'kcard' + (k.ready ? '' : ' lock'); c.title = k.ready ? '클릭하면 이 왕으로 바로 시작' : '시나리오 준비 중';
      c.onclick = function () { if (busy || !k.ready) return; if (confirm(k.name + '(으)로 시작할까요?')) begin(k); }; c.style.setProperty('--c', 'var(--c-' + k.side + ')');
      c.innerHTML = '<b><span class="dot"></span>' + k.name + '</b><small>' + SG.sideName[k.side] + ' · ' + k.era + '</small>';
      box.appendChild(c); cards.push(c);
    });
  }
  function begin(king) {
    $('#title').style.display = 'none';
    var scn = SG.scenarios[king.id];
    game.start(scn);
  }
  var busy = false, BAG = 'samgukwang.bag.v1';
  function readBag() { try { var a = JSON.parse(localStorage.getItem(BAG) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function writeBag(a) { try { localStorage.setItem(BAG, JSON.stringify(a)); } catch (e) { } }
  function lottery() {
    if (busy) return; busy = true;
    var msg = $('#lotmsg'); msg.textContent = '';
    var pool = kings.filter(function (k) { return k.ready; });
    // 주머니 추첨: 한 번 나온 왕은 모든 왕이 한 번씩 나올 때까지 다시 나오지 않는다
    var bag = readBag().filter(function (id) { return pool.some(function (k) { return k.id === id; }); });
    if (!bag.length) bag = pool.map(function (k) { return k.id; });
    var cid = bag[Math.floor(Math.random() * bag.length)], chosen = pool.filter(function (k) { return k.id === cid; })[0];
    bag.splice(bag.indexOf(cid), 1); writeBag(bag); var left = bag.length;
    var pick = kings.indexOf(chosen), steps = kings.length * 2 + pick, i = 0;
    cards.forEach(function (c) { c.classList.remove('on', 'gold'); });
    (function tick() {
      cards.forEach(function (c) { c.classList.remove('on'); });
      cards[i % cards.length].classList.add('on');
      if (i >= steps) {
        busy = false; var k = kings[i % kings.length]; cards[i % cards.length].classList.add('gold');
        if (k.ready) { msg.textContent = '운명이 정했습니다 — ' + SG.sideName[k.side] + ' ' + k.name + (left ? ' · 아직 안 나온 왕 ' + left + '명' : ' · 모든 왕이 한 번씩 나왔습니다(다음부터 새로 섞음)') + (pool.length < kings.length ? ' (다른 왕은 준비 중이라 플레이 가능한 왕 중에서 뽑습니다)' : ''); setTimeout(function () { begin(k); }, 1800); }
        else msg.textContent = k.name + '! 아직 시나리오를 준비 중입니다. 다시 뽑거나 의자왕편을 즐겨 보세요.';
        return;
      }
      i++; setTimeout(tick, 55 + Math.pow(i / steps, 3) * 420);
    })();
  }
  SG.toTitle = function () {
    $('#title').style.display = ''; $('#chron').innerHTML = ''; $('#res').innerHTML = ''; $('#army .list').innerHTML = '';
    game.map.clearTokens(); game.map.clearRoutes(); game.map.dynTerr = false; game.map.setTerritory('y660'); game.map.focus(127.6, 38.2, 2300, 800);
    $('#hud .who b').textContent = '三國王'; $('#hud .who span').textContent = '왕을 추첨하세요'; $('#lotmsg').textContent = '';
    cards.forEach(function (c) { c.classList.remove('on', 'gold'); });
  };
  window.addEventListener('DOMContentLoaded', function () {
    game = new SG.Game($('#app')); game.init(); build();
    $('#btn-lot').onclick = lottery;
    $('#btn-uija').onclick = function () { begin(kings.filter(function (k) { return k.id === 'uija'; })[0]); };
    $('#btn-home').onclick = function () { if (confirm('처음 화면으로 돌아갈까요? 진행 상황은 사라집니다.')) SG.toTitle(); };
    SG.game = game;
  });
})();

;
