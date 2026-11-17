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
