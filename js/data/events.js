/* 랜덤 이벤트 풀. 매년 조건에 맞는 이벤트 중에서 가중치(w)로 0~2개가 일어납니다.
 * hist: '사료'=삼국사기 등에 비슷한 기사가 있음, '일반'=시대상에 맞는 일반적 사건, '가상'=창작.
 * 선택지 효과: fx(자원) realm(국정) rel(외교) world(세계값) army(병력) flags */
window.SG = window.SG || {}; SG.data = SG.data || {};
(function () {
  
  SG.data.events = [
    /* ── 재난·자연 ── */
    { id: 'drought', title: '큰 가뭄', cat: '재난', w: 3, hist: '사료', note: '백제본기 653년 봄: 크게 가물어 백성이 굶주렸다는 기사. (이 이벤트의 발생 연도는 매번 다릅니다)', cond: function (s) { return !(s.laws.pyeongchang && Math.random() < 0.6); },
      text: function () { return ['봄부터 비가 내리지 않아 논바닥이 갈라졌습니다. 굶주린 백성이 관아 앞에 모입니다.']; },
      choices: [{ label: '창고를 열어 진휼한다', hint: '군량 10 소모, 민심 유지', fx: { food: -10, people: 3 }, result: '진휼미가 풀려 최악의 굶주림은 피했습니다.' },
        { label: '기우제를 올리고 버틴다', hint: '금 3, 운에 맡김', fx: { gold: -3 }, fn: function (S) { return S.roll() < 0.4 ? { fx: { people: 4, food: 4 }, text: '제사 직후 비가 내려 사람들은 하늘이 왕을 돌본다고 수군거렸습니다.' } : { fx: { people: -9, food: -6 }, text: '하늘은 끝내 응답하지 않았고 굶주림과 원성이 들불처럼 번졌습니다.' }; } },
        { label: '조세를 줄여 준다', hint: '금 −8, 민심 +', fx: { gold: -8, people: 5 }, result: '세금이 줄어 백성이 한숨을 돌렸습니다.' }] },
    { id: 'flood', title: '큰 강 범람', cat: '재난', w: 2, hist: '일반', text: function () { return ['장마가 길어 큰 강 일대가 넘쳐 논밭이 잠겼습니다.']; },
      choices: [{ label: '제방을 쌓고 이재민을 구제', hint: '금 8, 군량 4', fx: { gold: -8, food: -4, people: 4 }, realm: { econ: 3 }, result: '제방이 새로 쌓이고 이재민이 정착했습니다.' },
        { label: '구제를 최소로 한다', hint: '민심 하락', fx: { people: -7, food: -5 }, realm: { econ: -3 }, result: '굶주린 유민이 늘었습니다.' }] },
    { id: 'plague', title: '역병 확산', cat: '재난', w: 1.6, hist: '일반', text: function () { return ['도성 가까운 마을들에서 열병이 돌아 병사와 백성이 쓰러집니다.']; },
      choices: [{ label: '의관과 약재를 풀고 격리한다', hint: '금 8', fx: { gold: -8, people: 2 }, result: '의관들의 노력으로 병이 더 번지지 않았습니다.' },
        { label: '절과 사당에 기도하게 한다', hint: '금 3, 효과 불확실', fx: { gold: -3 }, fn: function (S) { return S.roll() < 0.45 ? { fx: { people: 2 }, text: '다행히 병은 가을 무렵 잦아들었습니다.' } : { fx: { people: -9, morale: -4 }, army: { baekje_levy: -800 }, text: '역병이 군영까지 번져 병력이 크게 줄었습니다.' }; } }] },
    { id: 'harvest', title: '대풍년', cat: '재난', w: 2.2, hist: '일반', text: function () { return ['올해는 비와 볕이 알맞아 곳간마다 곡식이 넘칩니다.']; },
      choices: [{ label: '비축하고 군량으로 돌린다', fx: { food: 16, people: 2 }, result: '창고가 가득 찼습니다.' }, { label: '잔치를 열어 민심을 얻는다', fx: { food: 6, people: 8, gold: -3 }, result: '들판 곳곳에서 풍년 잔치가 열렸습니다.' }] },
    { id: 'omen_thunder', title: '이상한 천둥과 얼음', cat: '전조', w: 1, hist: '사료', note: '백제본기 649년 11월: 천둥이 치고 얼음이 얼지 않았다는 재이 기사.', text: function () { return ['한겨울에 천둥이 치고 강이 얼지 않습니다. 일관들은 불길한 징조라 수군거립니다.']; },
      choices: [{ label: '근신하며 대사면을 베푼다', fx: { people: 5 }, realm: { royal: -2 }, result: '왕이 하늘의 뜻을 두려워하는 모습에 백성이 안도했습니다.' }, { label: '일관의 입을 단속한다', fx: { people: -2 }, realm: { royal: 2 }, result: '소문은 조용히 가라앉았으나 사람들의 마음엔 남았습니다.' }] },
    { id: 'omen_horse', only: ['uija'], title: '붉은 말의 울음', cat: '전조', w: 1.2, hist: '사료', note: '백제본기 655년 5월: 붉은 말이 북악 오함사에 들어가 울다 죽었다는 기사. 사관이 멸망의 복선으로 배치한 서술입니다.', cond: function (s) { return s.t >= 9; }, text: function () { return ['붉은 말 한 마리가 절 안에 들어와 울며 불당을 돌다 며칠 뒤 죽었다는 소문이 퍼집니다.']; },
      choices: [{ label: '액막이 법회를 연다', hint: '금 5', fx: { gold: -5, morale: 2 }, result: '법회가 열리고 소문은 가라앉았습니다.' }, { label: '허탄한 소문이라 일축한다', fx: { morale: -3 }, realm: { royal: 1 }, result: '왕의 단호함에 소문은 잦아들었으나 일부는 불안해했습니다.' }] },

    /* ── 정치 ── */
    { id: 'noble_plot', title: '귀족들의 수군거림', cat: '정치', w: 2, hist: '일반', cond: function (s) { return s.realm.royal < 55; }, text: function () { return ['일부 귀족이 왕의 정치를 비판하며 모임을 가진다는 첩보가 올라왔습니다.']; },
      choices: [{ label: '주동자를 잡아들인다', hint: '왕권 +, 민심 −', realm: { royal: 8 }, fx: { people: -3 }, flags: { noble_grudge: true }, result: '주동자가 유배되고 모임은 흩어졌습니다. 귀족들의 원한이 남았습니다.' },
        { label: '관직과 식읍으로 달랜다', hint: '금 8', fx: { gold: -8 }, realm: { royal: 4 }, result: '귀족들은 새 직책에 만족해 입을 닫았습니다.' },
        { label: '못 본 척한다', realm: { royal: -6 }, flags: { noble_grudge: true }, result: '조정의 기강이 느슨해졌습니다.' }] },
    { id: 'corrupt', title: '지방관의 비리', cat: '정치', w: 1.7, hist: '일반', cond: function (s) { return !s.laws.inspect || Math.random() < 0.3; }, text: function () { return ['한 고을 수령이 조세를 빼돌리고 백성을 수탈한다는 투서가 도착했습니다.']; },
      choices: [{ label: '파면하고 재산을 몰수한다', fx: { gold: 8, people: 4 }, realm: { royal: 2 }, result: '비리 수령이 처벌되어 백성들이 환호했습니다.' }, { label: '덮어 준다', fx: { people: -6 }, realm: { royal: -2 }, result: '투서를 올린 이들이 도리어 곤욕을 치르자 민심이 식었습니다.' }] },
    { id: 'heir', only: ['uija'], title: '왕자들의 알력', cat: '정치', w: 1.3, hist: '가상', note: '644년 왕자 융을 태자로 삼은 기록이 있으며, 660년 사료에는 둘째 아들 태가 {cap}에서 자립하는 대목이 있습니다.', cond: function (s) { return s.t >= 4; }, text: function () { return ['태자 융과 둘째 왕자 태 사이에 궁중 알력이 번지고 있습니다. 태는 야심이 크다는 평입니다.']; },
      choices: [{ label: '태자를 두둔하고 태를 견제', realm: { royal: 3 }, flags: { tae_checked: true }, result: '왕자 태는 한동안 근신했습니다.' }, { label: '두 아들을 함께 중용해 균형을 잡는다', fx: { gold: -4 }, flags: { tae_empowered: true }, result: '두 아들이 모두 직책을 얻어 소동은 가라앉았으나 야심은 남았습니다.' }] },
    { id: 'talent', title: '재야의 인재', cat: '정치', w: 1.6, hist: '가상', text: function () { return ['무예가 뛰어나고 충직하다고 소문난 젊은 장수가 천거되었습니다.']; },
      choices: [{ label: '등용해 결사대를 맡긴다', hint: '금 4', fx: { gold: -4 }, realm: { train: 4 }, flags: { loyal_gen: true }, army: { baekje_gyebaek: 500 }, result: '그는 곧 군영의 신임을 얻었습니다. (훗날 전투 지휘에 보탬이 됩니다)' }, { label: '귀족 가문 출신을 먼저 쓴다', realm: { royal: 3 }, result: '조정의 안정은 지켰으나 인재 하나가 떠났습니다.' }] },
    { id: 'rebel', title: '지방 반란', cat: '정치', w: 2, hist: '일반', cond: function (s) { return s.res.people < 35; }, text: function () { return ['원성이 쌓인 고을에서 농민이 관아를 습격했다는 급보가 들어옵니다.']; },
      choices: [{ label: '군을 보내 진압한다', hint: '병력 손실', army: { baekje_bangun: -400 }, fx: { people: -4, morale: -2 }, realm: { royal: 3 }, result: '반란은 진압되었으나 많은 이가 죽었습니다.' }, { label: '진휼하고 수령을 바꾼다', hint: '군량 10', fx: { food: -10, people: 6 }, result: '수령이 교체되고 곡식이 풀리자 반란군은 흩어졌습니다.' }] },
    { id: 'noble_coup', title: '귀족들의 정변 움직임', cat: '정치', w: 2.4, hist: '가상', cond: function (s) { return s.flags.noble_grudge && s.realm.royal < 48; }, text: function () { return ['식읍과 관직에서 소외된 귀족들이 호위 장수를 포섭해 궁을 노린다는 밀고가 들어옵니다.']; },
      choices: [{ label: '선수를 쳐서 일당을 체포', hint: '왕권이 낮으면 위험', fn: function (S) { return S.realm.royal + S.res.morale / 4 > 55 ? { realm: { royal: 10 }, fx: { people: -3 }, flags: { noble_grudge: false }, text: '친위대가 먼저 움직여 일당을 잡아들였습니다. 조정은 숙연해졌습니다.' } : { realm: { royal: -15 }, fx: { people: -6 }, text: '체포 작전이 새어 나가 큰 혼란이 일어났습니다. 왕권이 크게 흔들렸습니다.', flags: { coup_risk: true } }; } },
        { label: '귀족들의 요구를 들어준다', fx: { gold: -10 }, realm: { royal: -8 }, flags: { noble_grudge: false }, result: '귀족들에게 식읍이 돌아가고 소동이 가라앉았습니다. 왕의 위신은 상했습니다.' }] },

    /* ── 외교 ── */
    { id: 'tang_envoy', title: '{great} 사신 방문', cat: '외교', w: 2.4, hist: '사료', note: '641·644·651년 등 {great} 사신·조서 기사가 있습니다.', cond: function (s) { return s.t >= 1; }, text: function (s) { return ['{great} 황제의 사신이 {cap}에 도착했습니다. ' + (s.captured && Object.keys(s.captured).length ? '{rival}가 점령 사실을 {great}에 호소했다는 소식도 함께 전해졌습니다.' : '새 조서와 회사품을 가져왔다고 합니다.')]; },
      choices: [{ label: '극진히 접대하고 선물을 올린다', hint: '금 6', fx: { gold: -6 }, rel: { tang: 8 }, world: { 'tang.commit': -3 }, result: '사신은 흡족해하며 돌아갔습니다.' }, { label: '{rival} 문제는 내정이라며 선을 긋는다', rel: { tang: -5 }, realm: { royal: 2 }, world: { 'tang.commit': 4 }, result: '사신의 표정이 굳었습니다. 이 말은 장안에 전해질 것입니다.' }] },
    { id: 'wa_envoy_ev', title: '{far} 사신단', cat: '외교', w: 1.7, hist: '사료', note: '653년 8월 {far}와 통호한 기록. 백제의 불교·기술은 {far}에 큰 영향을 주었다고 전합니다.', text: function () { return ['{far}의 사신단이 불경과 기술자, 의원을 청하러 왔습니다.']; },
      choices: [{ label: '승려와 기술자를 보내 준다', hint: '금 5', fx: { gold: -5 }, rel: { wa: 12 }, flags: { wa_friend: true }, result: '{far} 왕실이 크게 감사했습니다. 이 인연은 오래 갑니다.' }, { label: '대가를 요구한다', fx: { gold: 6 }, rel: { wa: -3 }, result: '교역이 성사되었지만 사신의 얼굴은 밝지 않았습니다.' }] },
    { id: 'goguryeo_envoy', title: '{ally}의 연합 제의', cat: '외교', w: 1.6, hist: '사료', note: '643년 {ally}와 화친, 655년 {ally}·말갈과 {rival}를 함께 공격한 기사.', cond: function (s) { return s.t >= 1; }, text: function () { return ['{ally} 사신이 자기 왕의 뜻을 전합니다. {rival}를 함께 치자는 제의입니다.']; },
      choices: [{ label: '동맹에 응한다', hint: '고구려가 올해와 이듬해 신라의 성을 실제로 공격한다.', rel: { goguryeo: 12, tang: -7 }, world: { 'silla.hostility': 6 }, fn: function (S) { var x = S.sb && SG.ALLY_start ? SG.ALLY_start(S.sb, 'goguryeo', 'silla') : ''; return x ? { text: x } : null; }, result: '양국의 연합이 이루어졌습니다. {great}은 이 소식을 좋아하지 않을 것입니다.' }, { label: '거절하고 거리를 둔다', rel: { goguryeo: -6, tang: 3 }, result: '{ally}는 서운함을 감추지 않았습니다.' }] },
    { id: 'silla_envoy', title: '{rival} 사신의 방문', cat: '외교', w: 1.3, hist: '가상', cond: function (s) { return s.world.silla.hostility < 80; }, text: function () { return ['{rival} 사신이 변경의 평화를 청하며 포로 교환을 제의했습니다.']; },
      choices: [{ label: '포로 교환에 응한다', fx: { people: 3 }, rel: { silla: 10 }, world: { 'silla.hostility': -6 }, result: '양국 포로가 교환되었습니다. 변경이 잠시 조용해졌습니다.' }, { label: '사신을 돌려보낸다', rel: { silla: -6 }, world: { 'silla.hostility': 4 }, result: '사신은 굳은 얼굴로 돌아갔습니다.' }] },
    { id: 'silla_spy', title: '{rival} 첩자 적발', cat: '외교', w: 1.8, hist: '일반', cond: function (s) { return s.realm.intel >= 18 || Math.random() < 0.4; }, text: function () { return ['도성에서 {rival}의 첩자 일당이 붙잡혔습니다. 그들은 병력 배치를 캐고 있었습니다.']; },
      choices: [{ label: '처형해 본보기로 삼는다', rel: { silla: -6 }, realm: { intel: 4 }, flags: { spy_caught: true }, result: '일당이 처형되었고 도성의 기강이 섰습니다.' }, { label: '거짓 정보를 흘려 역이용한다', fx: { gold: -3 }, world: { 'silla.p': -2 }, realm: { intel: 8 }, result: '{rival}는 거짓 첩보를 믿고 병력을 엉뚱한 곳에 두었습니다.' }] },
    { id: 'merchant', title: '해상 상단의 청원', cat: '경제', w: 1.7, hist: '일반', text: function () { return ['서해를 오가는 상단이 항구 사용세를 낮춰 달라 청합니다. 대신 해마다 큰 이윤을 가져오겠다 합니다.']; },
      choices: [{ label: '허락한다', fx: { gold: 14 }, rel: { tang: 3, wa: 3 }, result: '상단이 북적이며 금이 흘러들었습니다.' }, { label: '관(官)이 직접 교역을 통제한다', fx: { gold: 7 }, realm: { royal: 3 }, result: '수입은 줄었으나 왕실의 손길이 닿았습니다.' }] },

    /* ── 군사 ── */
    { id: 'border_raid', title: '{rival} 변경 침입', cat: '군사', w: 2.8, hist: '사료', note: '644년 9월 {rival} 장군 유신이 침략해 일곱 성을 취한 기사 등 {rival}의 반격이 여러 차례 있었습니다.', cond: function (s) { return s.world.silla.hostility >= 45 && s.realm.defense < 70; }, text: function () { return ['{rival} 군이 변경 성 하나를 급습했다는 보고입니다. 아직 큰 군은 아닌 듯합니다.']; },
      choices: [{ label: '증원군을 급파해 막는다', hint: '군량 6', fx: { food: -6, morale: 2 }, realm: { train: 2 }, result: '증원군이 도착해 {rival}군을 물리쳤습니다.' }, { label: '성이 스스로 지키게 둔다', fn: function (S) { return S.realm.defense > 45 ? { fx: { morale: -1 }, text: '성이 견고해 {rival}군은 물러났습니다.' } : { fx: { people: -5, morale: -5 }, realm: { defense: -6 }, text: '성이 무너져 민가가 불타고 포로가 끌려갔습니다.' }; } },
        { label: '이 기회에 보복전을 일으킨다', hint: '(정무에서 {rival} 정벌 명령 필요)', fx: { morale: 3 }, world: { 'silla.hostility': 8 }, result: '조정은 보복 여론으로 들끓었습니다.' }] },
    { id: 'desertion', title: '병사 탈영', cat: '군사', w: 2, hist: '일반', cond: function (s) { return s.res.food < 24 || s.res.morale < 40; }, text: function () { return ['군량이 모자라고 사기가 낮아 병사들이 밤마다 도망칩니다.']; },
      choices: [{ label: '군량을 풀고 달랜다', hint: '군량 8', fx: { food: -8, morale: 6 }, result: '병영이 가라앉았습니다.' }, { label: '탈영병을 엄벌한다', army: { baekje_levy: -500 }, realm: { train: 3 }, fx: { morale: -4, people: -3 }, result: '탈영은 줄었지만 병사들의 눈이 차가워졌습니다.' }] },
    { id: 'gen_pride', title: '교만해진 장수', cat: '군사', w: 1.4, hist: '일반', cond: function (s) { return s.realm.train >= 60; }, text: function () { return ['전공이 높은 장수가 조정을 무시하는 언행이 잦다는 간언이 올라옵니다.']; },
      choices: [{ label: '불러 크게 꾸짖는다', realm: { royal: 4 }, fx: { morale: -3 }, result: '장수는 고개를 숙였으나 군영의 분위기는 서늘해졌습니다.' }, { label: '공을 치하하고 식읍을 내린다', fx: { gold: -6, morale: 5 }, realm: { royal: -2 }, result: '장수는 감격해 충성을 맹세했습니다.' }] },
    { id: 'weapons', title: '무기 개량 제안', cat: '군사', w: 1.4, hist: '일반', text: function () { return ['한 장인이 활과 갑옷을 개량한 시제품을 올립니다. 비용이 만만치 않습니다.']; },
      choices: [{ label: '후원해 군에 보급한다', hint: '금 9', fx: { gold: -9 }, army: { baekje_archer: 600 }, realm: { train: 3 }, result: '개량 무기가 보급되어 군의 전력이 올랐습니다.' }, { label: '비용을 이유로 보류', result: '장인은 낙담하여 돌아갔습니다.' }] },
    { id: 'ironmine', title: '철광 발견', cat: '경제', w: 1.1, hist: '가상', text: function () { return ['남쪽 산에서 철광이 발견되었다는 보고입니다.']; },
      choices: [{ label: '관영으로 개발한다', hint: '금 6', fx: { gold: -6 }, realm: { econ: 4 }, army: { baekje_bangun: 300 }, result: '철 생산이 늘고 무장이 좋아졌습니다.' }, { label: '민간에 맡긴다', fx: { gold: 8 }, result: '세금으로 쏠쏠한 수입이 생겼습니다.' }] },

    /* ── 사회·문화 ── */
    { id: 'monk', title: '고승의 설법', cat: '사회', w: 1.5, hist: '일반', text: function () { return ['이름 높은 고승이 {cap}에서 설법을 열어 사람들이 구름처럼 모였습니다.']; },
      choices: [{ label: '왕이 직접 참석해 후원한다', hint: '금 5', fx: { gold: -5, people: 6 }, rel: { wa: 3 }, flags: { buddhist: true }, result: '왕실과 백성이 한마음으로 법회에 참여했습니다.' }, { label: '행사에 거리를 둔다', fx: { people: -1 }, result: '법회는 조용히 끝났습니다.' }] },
    { id: 'refugees', title: '변경 유민', cat: '사회', w: 1.4, hist: '일반', cond: function (s) { return s.world.silla.hostility >= 40; }, text: function () { return ['전란에 시달린 {rival} 변경의 유민이 국경을 넘어 투항해 왔습니다.']; },
      choices: [{ label: '받아들여 정착시킨다', fx: { food: -4, people: 3 }, realm: { econ: 3 }, rel: { silla: -4 }, result: '유민이 정착해 변경 개간에 힘을 보탰습니다.' }, { label: '돌려보낸다', rel: { silla: 3 }, fx: { people: -2 }, result: '유민들은 눈물을 흘리며 되돌아갔습니다.' }] },
    { id: 'fire', title: '도성 화재', cat: '재난', w: 1.1, hist: '일반', text: function () { return ['한밤 {cap} 도성 한 구역에서 불이 나 민가가 번졌습니다.']; },
      choices: [{ label: '왕실 창고를 열어 재건을 돕는다', hint: '금 8', fx: { gold: -8, people: 5 }, result: '집이 다시 세워지고 감사의 인사가 이어졌습니다.' }, { label: '피해 백성이 알아서 하게 둔다', fx: { people: -6 }, result: '원망이 번졌습니다.' }] },
    { id: 'royal_illness', title: '왕의 병환', cat: '정치', w: 1, hist: '가상', text: function () { return ['왕이 과로로 쓰러져 며칠 정무를 보지 못했습니다. 조정이 술렁입니다.']; },
      choices: [{ label: '요양하며 정사를 태자에게 맡긴다', fx: { people: 1 }, realm: { royal: -4 }, result: '왕이 회복하는 동안 신료들이 일을 나눠 맡았습니다.' }, { label: '무리하여 정사를 본다', fx: { morale: 3 }, realm: { royal: 2 }, result: '왕의 굳센 모습에 조정이 안정되었으나 몸은 더 상했습니다.' }] },
    { id: 'harvest_fest', title: '사냥 대회와 무예 경연', cat: '군사', w: 1.4, hist: '일반', text: function () { return ['가을 사냥철을 맞아 무예를 겨루는 대회가 열렸습니다.']; },
      choices: [{ label: '성대하게 개최한다', hint: '금 5', fx: { gold: -5, morale: 7 }, realm: { train: 4 }, result: '무예 대회가 열리고 뛰어난 젊은 병사들이 눈에 띄었습니다.' }, { label: '간소하게 치른다', fx: { morale: 2 }, result: '조촐한 행사로 끝났습니다.' }] }
  ];
})();
