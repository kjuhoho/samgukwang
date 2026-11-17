/* 악재 사건 묶음: 어느 선택지를 골라도 무언가를 잃는다. (시대상에 맞는 일반적 사건. 병종 id는 엔진이 내 나라 병종으로 바꿔 준다) */
window.SG = window.SG || {}; SG.data = SG.data || {};
(function () {
  function sb() { return SG.game && SG.game.sb; }
  var E = [
    { id: 'x_famine', title: '대기근', cat: '악재', w: 4, hist: '일반',
      text: function () { return ['두 해 연이은 흉작으로 들에 먹을 것이 없습니다. 나무껍질을 벗겨 먹는 이들이 늘고, 길에는 떠도는 백성이 가득합니다.']; },
      choices: [{ label: '군량을 풀어 백성을 먹인다', hint: '군량 16 소모', fx: { food: -16, people: 1 }, result: '굶어 죽는 이는 줄었으나 군의 창고가 크게 비었습니다.' },
        { label: '이웃 나라에서 곡식을 사들인다', hint: '금 14 · 군량 6 소모', fx: { gold: -14, food: -6 }, result: '비싼 값을 치르고 곡식을 들여왔습니다.' },
        { label: '버틴다', hint: '아무것도 쓰지 않는다', fx: { people: -10, morale: -4 }, realm: { econ: -5, royal: -3 }, result: '굶주림과 원성이 온 나라에 번졌습니다.' }] },
    { id: 'x_cold', title: '혹한과 폭설', cat: '악재', w: 3, hist: '일반',
      text: function () { return ['유례없는 추위가 닥쳤습니다. 변경을 지키던 병사들이 얼어 죽고, 눈에 길이 막혀 군량이 닿지 않습니다.']; },
      choices: [{ label: '땔감과 군량을 급히 올려 보낸다', hint: '군량 10 · 금 4 소모', fx: { food: -10, gold: -4 }, army: { baekje_bangun: -300 }, result: '피해를 줄였으나 적지 않은 병사를 잃었습니다.' },
        { label: '변경의 군을 물려 겨울을 난다', hint: '방비가 크게 떨어진다', realm: { defense: -8 }, army: { baekje_bangun: -200 }, result: '병사는 살렸으나 변경이 비었습니다.' },
        { label: '그대로 지키게 한다', hint: '병사 손실', fx: { morale: -6 }, army: { baekje_bangun: -1200, baekje_levy: -600 }, result: '봄이 오자 얼어 죽은 병사의 수가 드러났습니다.' }] },
    { id: 'x_granary', title: '군량 창고의 큰불', cat: '악재', w: 3, hist: '일반', cond: function (s) { return s.res.food >= 25; },
      text: function () { return ['한밤중에 군량 창고에서 불이 났습니다. 방화라는 말도, 관리의 실수라는 말도 돕니다.']; },
      choices: [{ label: '불을 끄는 데 모든 사람을 동원한다', hint: '군량 12 손실', fx: { food: -12, people: -1 }, result: '절반은 건졌습니다.' },
        { label: '책임자를 엄히 벌한다', hint: '군량 18 손실, 기강은 선다', fx: { food: -18, morale: -2 }, realm: { royal: 2 }, result: '창고는 탔고, 창고지기들의 목이 걸렸습니다.' }] },
    { id: 'x_campplague', title: '군영의 돌림병', cat: '악재', w: 3, hist: '일반',
      text: function () { return ['군영에 돌림병이 돌아 하루에도 수십 명이 쓰러집니다. 훈련은커녕 진을 유지하기도 어렵습니다.']; },
      choices: [{ label: '병든 부대를 격리하고 훈련을 멈춘다', hint: '훈련 −7, 병력 손실 적음', realm: { train: -7 }, army: { baekje_bangun: -600 }, result: '병은 잡혔으나 군의 손발이 무뎌졌습니다.' },
        { label: '의원과 약재를 사들인다', hint: '금 12 소모', fx: { gold: -12 }, army: { baekje_bangun: -300 }, result: '큰돈을 들여 피해를 줄였습니다.' },
        { label: '그대로 둔다', hint: '병력 큰 손실', fx: { morale: -7 }, army: { baekje_bangun: -1800, baekje_levy: -900 }, result: '병이 군 전체에 번졌습니다.' }] },
    { id: 'x_taxrevolt', title: '조세 거부', cat: '악재', w: 3, hist: '일반', cond: function (s) { return s.res.people < 70; },
      text: function () { return ['여러 고을이 한꺼번에 조세를 내지 않겠다고 버팁니다. 세리가 쫓겨나고 관아가 포위되었습니다.']; },
      choices: [{ label: '군을 보내 누른다', hint: '민심 −9', fx: { people: -9, gold: 4 }, realm: { royal: 2 }, army: { baekje_levy: -400 }, result: '피를 보고서야 세가 걷혔습니다.' },
        { label: '올해 조세를 깎아 준다', hint: '금 14 손실', fx: { gold: -14, people: 2 }, realm: { royal: -3 }, result: '소동은 가라앉았으나 조정의 위신이 깎였습니다.' }] },
    { id: 'x_princeplot', title: '왕족의 모반', cat: '악재', w: 2, hist: '일반', cond: function (s) { return s.realm.royal < 65; },
      text: function () { return ['왕의 가까운 피붙이가 귀족들과 은밀히 모였다는 고변이 들어왔습니다. 증거는 뚜렷하지 않습니다.']; },
      choices: [{ label: '잡아들여 처형한다', hint: '민심·사기 하락', fx: { people: -5, morale: -4 }, realm: { royal: 3 }, result: '피로 왕좌를 지켰으나 궁이 얼어붙었습니다.' },
        { label: '먼 곳으로 유배한다', hint: '왕권 −5', realm: { royal: -5 }, result: '불씨는 남았습니다.' },
        { label: '못 들은 것으로 한다', hint: '왕권 −9', realm: { royal: -9 }, fx: { morale: -2 }, result: '왕이 약하다는 말이 귀족들 사이에 돌았습니다.' }] },
    { id: 'x_castellan', title: '변경 성주의 배반', cat: '악재', w: 3, hist: '일반', cond: function () { var b = sb(); return !!b && b.myPlaces && b.myPlaces().length >= 5; },
      text: function () { return ['변경의 한 성주가 적과 내통하고 있다는 급보입니다. 성문을 열어 줄 날짜까지 정했다고 합니다.']; },
      choices: [{ label: '재물과 벼슬로 달랜다 (금 15)', hint: '6할은 돌아선다', fx: { gold: -15 }, fn: function (S) { return S.roll() < 0.6 ? { text: '성주는 마음을 돌렸습니다.' } : lose(); } },
        { label: '군을 급파해 성을 접수한다', hint: '군량 8, 절반은 늦는다', fx: { food: -8 }, fn: function (S) { return S.roll() < 0.5 ? { fx: { morale: 2 }, text: '한발 먼저 성에 들어가 성주를 사로잡았습니다.' } : lose(); } },
        { label: '내버려 둔다', hint: '성을 잃는다', fn: function () { return lose(); } }] },
    { id: 'x_cattle', title: '소 돌림병', cat: '악재', w: 2, hist: '일반',
      text: function () { return ['밭을 갈 소들이 떼로 쓰러지고 있습니다. 봄갈이를 사람의 힘으로 해야 할 판입니다.']; },
      choices: [{ label: '나라의 소를 풀어 나눠 준다', hint: '금 10 소모', fx: { gold: -10 }, realm: { econ: -2 }, result: '농사는 겨우 이어졌습니다.' },
        { label: '백성이 알아서 하게 둔다', hint: '산업 −7', fx: { food: -8, people: -4 }, realm: { econ: -7 }, result: '묵은 밭이 크게 늘었습니다.' }] },
    { id: 'x_typhoon', title: '태풍에 부서진 선단', cat: '악재', w: 2, hist: '일반', cond: function (s) { return s.realm.navy >= 20; },
      text: function () { return ['큰 바람이 포구를 덮쳤습니다. 매어 둔 전선들이 서로 부딪혀 깨지고 가라앉았습니다.']; },
      choices: [{ label: '곧바로 다시 짓는다', hint: '금 12 소모, 수군 −4', fx: { gold: -12 }, realm: { navy: -4 }, result: '목수들이 밤낮으로 배를 고쳤습니다.' },
        { label: '남은 배로 버틴다', hint: '수군 −12', realm: { navy: -12 }, result: '바다가 한동안 비게 되었습니다.' }] },
    { id: 'x_embezzle', title: '국고 횡령', cat: '악재', w: 3, hist: '일반', cond: function (s) { return s.res.gold >= 40; },
      text: function () { return ['창고의 장부와 실제 재물이 맞지 않습니다. 여러 해에 걸쳐 고위 관리들이 빼돌려 온 것으로 보입니다.']; },
      choices: [{ label: '끝까지 캐서 벌한다', hint: '금 10 손실, 귀족 반발', fx: { gold: -10 }, realm: { royal: -4 }, result: '몇몇은 벌을 받았으나 재물의 태반은 돌아오지 않았습니다.' },
        { label: '조용히 덮는다', hint: '금 20 손실', fx: { gold: -20 }, realm: { econ: -3 }, result: '빼돌린 재물은 영영 사라졌습니다.' }] },
    { id: 'x_arrears', title: '봉록 체불과 군의 동요', cat: '악재', w: 3, hist: '일반', cond: function (s) { return s.res.gold < 30 || s.res.morale < 50; },
      text: function () { return ['병사들에게 줄 봉록과 상이 여러 달 밀렸습니다. 진영마다 수군거림이 커지고, 밤에 달아나는 자가 늘었습니다.']; },
      choices: [{ label: '왕실 재물을 털어 준다', hint: '금 12 소모, 왕권 −3', fx: { gold: -12, morale: 2 }, realm: { royal: -3 }, result: '급한 불은 껐습니다.' },
        { label: '군율로 다스린다', hint: '사기 −9, 탈영', fx: { morale: -9 }, army: { baekje_bangun: -900, baekje_levy: -700 }, result: '본보기로 몇을 베었으나 탈영은 멈추지 않았습니다.' }] },
    { id: 'x_exodus', title: '백성의 유망', cat: '악재', w: 2, hist: '일반', cond: function (s) { return s.res.people < 55; },
      text: function () { return ['부역과 조세를 견디지 못한 백성들이 밤을 틈타 국경을 넘고 있습니다. 빈 마을이 늘어 갑니다.']; },
      choices: [{ label: '부역을 줄여 붙잡는다', hint: '방비·산업 하락', fx: { people: 3 }, realm: { defense: -5, econ: -3 }, result: '성 쌓기를 멈추자 발길이 잦아들었습니다.' },
        { label: '국경을 막고 잡아들인다', hint: '민심 −7', fx: { people: -7 }, realm: { econ: -4 }, result: '붙잡힌 이들의 원한이 깊어졌습니다.' }] },
    { id: 'x_assassin', title: '자객', cat: '악재', w: 1, hist: '일반',
      text: function () { return ['밤중에 침전으로 자객이 숨어들었습니다. 호위병이 막아 냈으나 왕은 다쳤고, 배후는 밝혀지지 않았습니다.']; },
      choices: [{ label: '궁 안팎을 뒤져 배후를 캔다', hint: '귀족 반발', fx: { people: -3 }, realm: { royal: -4, intel: 3 }, result: '의심받은 이들이 줄줄이 끌려갔습니다.' },
        { label: '상처를 숨기고 정사를 본다', hint: '왕권 −6', realm: { royal: -6 }, fx: { morale: -3 }, result: '왕이 다쳤다는 소문은 끝내 퍼졌습니다.' }] }
  ];
  // 내 수도에서 가장 먼 성 하나를 가장 가까운 이웃 나라에 잃는다
  function lose() {
    var b = sb(); if (!b) return { fx: { morale: -4 } };
    var cap = SG.placeById(b.cfg.capPlace), mine = b.myPlaces().filter(function (p) { return !cap || p.id !== cap.id; }); if (!mine.length) return { fx: { morale: -4 } };
    var d = function (x, y) { return Math.hypot((x.lon - y.lon) * 0.8, x.lat - y.lat); };
    if (cap) mine.sort(function (x, y) { return d(y, cap) - d(x, cap); });
    var pl = mine[0], to = null, bd = 99; b.places().forEach(function (q) { var o = b.ownerOf(q); if (o && o !== b.side && /^(baekje|silla|goguryeo|gaya|tang)$/.test(o)) { var x = d(q, pl); if (x < bd) { bd = x; to = o; } } });
    if (!to) return { fx: { morale: -4 } };
    b.s.owners = b.s.owners || {}; b.s.owners[pl.id] = to; b.log(pl.name + ' — 성주의 배반으로 상실'); if (b.drawDeploy) try { b.drawDeploy(); } catch (e) { }
    return { fx: { morale: -6, people: -3 }, realm: { royal: -4, defense: -4 }, text: '<b>' + pl.name + '</b>의 성문이 열렸습니다. 성은 ' + ((SG.sideName && SG.sideName[to]) || to) + '의 손에 넘어갔습니다.' };
  }
  SG.data.events = (SG.data.events || []).concat(E);
})();
