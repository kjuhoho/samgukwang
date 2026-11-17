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
    hist: { label: '요거 등을 취한 기세를 몰아 옥문곡으로 진격한다', hint: '성과를 얻지만 큰 패배도 맛본다.', fx: { gold: 8, food: -6, morale: -4 }, army: { baekje_bangun: -900 }, world: { 'silla.hostility': 6, 'silla.p': -2, 'tang.commit': 6 }, result: '십여 성을 얻었으나 옥문곡에서 유신의 군에게 크게 패했습니다. 이 무렵 김춘추가 당 태종과 동맹을 약속했다는 소식이 사비에 전해졌습니다.' },
    alts: [
      { label: '요거 등 십여 성을 취한 선에서 멈추고 군을 쉬게 한다', hint: '[가상] 성과를 지키고 손실을 줄인다.', fx: { gold: 8, morale: 3 }, realm: { train: 4 }, world: { 'silla.hostility': 5, 'tang.commit': 5 }, result: '군은 큰 손실 없이 돌아왔습니다. 신라는 이를 갈았습니다.' },
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
      { label: '일부 성만 돌려주고 포로를 교환하는 협상을 연다', hint: '[가상] 절충안.', fx: { gold: -6 }, rel: { tang: 8, silla: 7 }, world: { 'tang.commit': -6, 'silla.hostility': -5 }, result: '신라는 일부 성과 포로를 돌려받고 당 사신을 안심시켰습니다.' }
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
    if (caps >= 3 && w.silla.p <= 42 && w.tang.commit <= 48 && power >= 30) return sb.finish('hegemon');
    if (w.tang.commit < 32 && w.silla.p < 62) return sb.finish(s.world.silla.p < 50 ? 'prosper' : 'steady');
    SG._uijaScale(sb.hostScale('silla'), sb.hostScale('tang'));
    g.go('s660');
  };
})();
