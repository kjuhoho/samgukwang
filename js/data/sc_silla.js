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
