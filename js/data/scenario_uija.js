/* 의자왕편 v0.2 — 656~663. 서사 근거: 자료조사/08_660_663_전쟁상세.md (삼국사기 신라본기·백제본기·열전 대조)
 * 병력 수치는 사료 명시치(5천/5만/13만)를 쓰되 게임 추상화 값이 섞여 있음. 사료에 없는 갈래는 '가상'으로 표시. */
window.SG = window.SG || {}; SG.data = SG.data || {}; SG.scenarios = SG.scenarios || {};
(function () {
  var P = function (id) { return SG.placeById(id); };
  var SRC_B = '삼국사기 백제본기 의자왕 16·20년', SRC_S = '삼국사기 신라본기 태종무열왕 7년';

  function force(name, side, units, gen, terrain, morale, extra) {
    var f = { name: name, side: side, units: units, gen: gen, terrain: terrain || 1, morale: morale == null ? 70 : morale };
    if (extra) for (var k in extra) f[k] = extra[k];
    return f;
  }
  // 신라 5만 / 당 상륙군 (사료의 규모를 게임 병종 비율로 배분한 추정치)
  var KS = 1, KT = 1; // 660년 진입 시 나라 상태로 정해지는 적 규모 배율
  SG._uijaScale = function (a, b) { KS = a; KT = b; };
  function scaleHost(a, k) { return a.map(function (u) { return { id: u.id, n: Math.round(u.n * k) }; }); }
  function sillaHost() { return scaleHost([{ id: 'silla_jeong', n: 30000 }, { id: 'silla_seodang', n: 6000 }, { id: 'silla_horse', n: 4000 }, { id: 'silla_crossbow', n: 2000 }, { id: 'silla_hwarang', n: 1000 }, { id: 'silla_levy', n: 7000 }], KS); }
  function tangHost() { return scaleHost([{ id: 'tang_bubyeong', n: 60000 }, { id: 'tang_elite', n: 8000 }, { id: 'tang_cavalry', n: 6000 }, { id: 'tang_archer', n: 10000 }, { id: 'tang_crossbow', n: 8000 }, { id: 'tang_siege', n: 3000 }], KT); }

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
      pool: function (g) { return Math.max(10, Math.min(45, Math.round(g.sb.fieldTotal() / 1000))); },
      stations: [
        { id: 'tanhyeon', name: '탄현', place: 'tanhyeon', desc: '신라군 5만이 오는 좁은 길목 (지형 ×1.9, 적은 일부만 교전)', max: 20, def: 0 },
        { id: 'gibeolpo', name: '기벌포·백강', place: 'gibeolpo', desc: '당 상륙군 (갯벌 ×1.7, 상륙 폭 제한)', max: 20, def: 0 },
        { id: 'sabi', name: '사비 본성', place: 'sabi', desc: '예비·성 방어 (최후의 보루)', max: 20, def: 0 }
      ],
      feedback: function (g, a, left) {
        var t = '탄현 ' + a.tanhyeon + '천 · 기벌포 ' + a.gibeolpo + '천 · 사비 ' + a.sabi + '천 (미배치 ' + left + '천).';
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
        if (a.tanhyeon > 0) {
          var rt = SG.battle(force('탄현 방어군', 'baekje', tIn, 'heungsu', 1.9 * prep * seong * tMod * dm, mm, { ambush: plan === 'sangyeong' || plan === 'heungsu' }), force('신라군', 'silla', sillaHost(), 'gim_yusin', 1, 72, { cap: 20000 }), { rounds: 6 });
          res.tanhyeon = outcomeOf(rt); steps.push({ r: rt, title: '탄현 전투 (가상)', out: '탄현 — ' + OUT[res.tanhyeon], before: tBefore, after: rt.aLeft });
        } else res.tanhyeon = 'broken';
        if (a.gibeolpo > 0) {
          var rg = SG.battle(force('기벌포 방어군', 'baekje', gIn, 'uija', 1.7 * prep * seong * bMod * dm, mm, { ambush: plan === 'uijik' }), force('당 상륙군', 'tang', tangHost(), 'sojeongbang', 1, plan === 'uijik' ? 52 : 68, { cap: 30000 }), { rounds: 6 });
          res.gibeolpo = outcomeOf(rg); steps.push({ r: rg, title: '기벌포 전투 (가상)', out: '기벌포 — ' + OUT[res.gibeolpo], before: gBefore, after: rg.aLeft });
        } else res.gibeolpo = 'broken';
        g.state.flags.pass = res; g.state.flags.allocSabi = a.sabi;
        function nextStep(i) {
          if (i >= steps.length) { g.go(res.tanhyeon === 'broken' && res.gibeolpo === 'broken' ? 's_hwangsan' : (res.tanhyeon !== 'broken' && res.gibeolpo !== 'broken') ? 's_stall' : 's_split'); return; }
          var s = steps[i]; g.battleUI(s.r, s.title, s.out, function () { casualties(g, s.before, s.after); g.map.markPlace(i === 0 && a.tanhyeon > 0 ? 'tanhyeon' : 'gibeolpo', 'hot'); nextStep(i + 1); });
        }
        // 전투 결과 모달은 화면에 보이므로 우선 장면 이동을 막는다
        setTimeout(function () { nextStep(0); }, 0);
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
      { label: '사자를 보내 양군의 불화를 부추기고, 소정방에게 철군 교섭을 건다', hint: '[가상] 금 12 소모. 두 요충에서 이미 지친 소정방이 주저할 때 먹힐 수 있다.', fx: { gold: -12 }, flags: { wedge: true }, result: '소정방은 군량선과 신라와의 약속, 두 요충에서 입은 손실을 계산하며 결국 철군 교섭을 받아들입니다. 실제 역사에서도 7월 12일 사비 포위 때 소정방이 망설였고, 김유신이 설득해야 했습니다.', next: 's_end_stall' },
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
      if (noSilla && !g.f('wedge')) c.unshift({ label: '신라군이 오지 않는 지금, 소정방에게 사자와 금을 보내 철군을 교섭한다', hint: '[가상] 금 12 소모. 신라와의 약속이 어긋난 당군이 망설일 수 있다.', fx: { gold: -12 }, flags: { wedge: true }, result: '신라군 없이 홀로 도성을 치는 일이 소정방에게도 부담입니다. 군량과 사기를 계산한 소정방은 교섭에 응합니다.', next: 's_end_stall' });
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
      { tag: '역사', label: '좌평 각가를 보내 퇴군을 간청한다', hint: '효과 없음. 연합군은 사비로 진군한다.', fx: { gold: -3 }, next: 's_siege' },
      { label: '불화를 이용해 소정방에게 사자와 금을 보낸다', hint: '[가상] 금 소모. 소정방이 성을 칠지 더 망설이게 만든다.', fx: { gold: -12 }, flags: { wedge: true }, next: 's_siege' }
    ]
  };

  var H = {};
  function homeUnits(g) { var a = g.state.army; return ['baekje_bangun', 'baekje_gyebaek', 'baekje_horse', 'baekje_archer', 'baekje_guard', 'baekje_garrison'].filter(function (i) { return a[i] > 0; }).map(function (i) { return { id: i, n: a[i] }; }); }
  function clone(u) { return u.map(function (x) { return { id: x.id, n: x.n }; }); }
  function enemyAtSabi(g) { var p = g.f('pass') || {}, e = tangHost(); if (!g.f('hwwin') && p.tanhyeon !== 'delayed' && p.tanhyeon !== 'held') e = e.concat(sillaHost()); return e; }

  H.__hwangsan_battle__ = function (g) {
    var amb = g.f('hw') === 'ambush', n = Math.min(5000, g.state.army.baekje_gyebaek || 5000);
    var A = force('계백 결사대', 'baekje', [{ id: 'baekje_gyebaek', n: n }], 'gyebaek', 1.5, 100, { ambush: amb }), B = force('신라군', 'silla', sillaHost(), 'gim_yusin', 1, 72, { cap: 25000 });
    var before = [{ id: 'baekje_gyebaek', n: n }];
    var r = SG.battle(A, B, { rounds: 4 }); g.state.flags.hw1 = r;
    casualties(g, before, r.aLeft);
    g.battleUI(r, '황산벌 — 네 번의 접전', '계백의 결사대는 네 번 싸워 신라군에 큰 타격을 주었으나, 힘이 다해 갑니다.', function () { g.go('s_gwanchang'); });
  };
  H.__hwangsan_final__ = function (g) {
    var r1 = g.f('hw1'), spared = g.f('gwan') === 'spared';
    var A = force('계백 결사대', 'baekje', clone(r1.aLeft), 'gyebaek', 1.5, 55), B = force('신라군', 'silla', clone(r1.bLeft), 'gim_yusin', 1, spared ? 92 : 100, { cap: 25000 });
    var before = clone(r1.aLeft), r = SG.battle(A, B, { rounds: 4 });
    casualties(g, before, r.aLeft);
    var win = r.winner === 'a';
    g.battleUI(r, '황산벌 — 총공격', win ? '결사대가 끝내 신라 삼군의 총공격을 막아 냈습니다. (실제 역사와 다릅니다.)' : '계백은 장렬히 전사하고, 좌평 충상·상영 등 20여 명이 포로가 되었습니다.', function () {
      if (win) { g.setFlags({ hwwin: true }); g.go('s_sabi_tang'); }
      else { g.state.army.baekje_gyebaek = 0; g.renderArmy(); g.apply({ morale: -12, people: -6 }); g.go('s_0710'); }
    });
  };
  function fieldFight(g, title, defUnits, fort, terr, morale, onWin, onLose) {
    var A = force('사비 방어군', 'baekje', defUnits, 'uija', terr, morale), B = force('당·신라군', 'tang', enemyAtSabi(g), 'sojeongbang', 1, g.f('wedge') ? 55 : 68);
    A.fort = fort; var before = clone(defUnits), r = SG.battle(A, B, { rounds: 6 });
    casualties(g, before, r.aLeft);
    var ok = r.winner === 'a' || (g.f('wedge') && r.aEnd / r.aStart > .05 && r.bEnd / r.bStart < .9);
    g.battleUI(r, title, ok ? '적은 손실이 커지고 군량·사기가 흔들립니다.' : '방어선이 무너졌습니다.', function () { ok ? onWin() : onLose(); });
  }
  H.__tang_field__ = function (g) { fieldFight(g, '사비 성외 전투 (가상)', homeUnits(g), false, 1.0, g.state.res.morale, function () { g.go('s_end_stall'); }, function () { g.go('s_siege'); }); };
  H.__sabi_defense__ = function (g) { fieldFight(g, '사비성 농성 (가상)', homeUnits(g), true, 1.6, g.state.res.morale + 8, function () { g.go('s_end_stall'); }, function () { g.setFlags({ surrender: 'late' }); g.go('s_end_fall'); }); };
  H.__baekgang__ = function (g) {
    var bg = g.f('bg'), unity = g.f('unity'), a = g.state.army, wa = [{ id: 'wa_navy', n: 10000 }];
    var AU = wa.concat(a.baekje_navy ? [{ id: 'baekje_navy', n: a.baekje_navy }] : []).concat(bg === 'siege' ? homeUnits(g) : []);
    var terr = bg === 'frontal' ? .8 : bg === 'fire' ? 1.35 : 1.5, mor = unity ? 80 : 50;
    var A = force('부흥군·왜 연합', 'baekje', clone(AU), 'buyeo_pung', terr, mor, { ambush: bg === 'fire', fort: bg === 'siege' });
    var Bu = bg === 'siege' ? [{ id: 'tang_bubyeong', n: 20000 }, { id: 'tang_crossbow', n: 3000 }, { id: 'silla_jeong', n: 14000 }] : [{ id: 'tang_navy', n: 7000 }, { id: 'tang_archer', n: 3000 }, { id: 'tang_crossbow', n: 2000 }];
    var B = force('당 유인궤 수군', 'tang', Bu, 'yuingwe', bg === 'frontal' ? 1.3 : 1, 70);
    var r = SG.battle(A, B, { rounds: 6 });
    var win = r.winner === 'a' && r.aEnd / r.aStart > .3;
    g.battleUI(r, bg === 'siege' ? '주류성 공방 (가상)' : '백강 전투', win ? '당의 선단이 무너졌습니다. (사료에 없는 결과)' : '왜선이 불타고 바닷물이 붉어졌다고 전합니다. 풍은 도주하고 주류성은 항복합니다.', function () { g.go(win ? 's_end_alt' : 's_end_hist'); });
  };


  SG.scenarios.uija = {
    id: 'uija', king: '의자왕', sub: '백제 31대 · 656~663', seal: '義',
    res: { troops: 0, food: 60, gold: 55, people: 55, morale: 60 },
    army: { baekje_bangun: 20000, baekje_gyebaek: 5000, baekje_horse: 2000, baekje_archer: 3000, baekje_guard: 2000, baekje_garrison: 8000, baekje_navy: 3000 },
    start: 's0', scenes: S, handlers: H
  };
})();
