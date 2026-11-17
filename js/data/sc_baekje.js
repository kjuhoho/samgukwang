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
