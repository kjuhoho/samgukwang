/* 전투에 임명할 수 있는 장수 명단 (시나리오별). 인물은 사료에 보이는 실존 인물, 능력치(cmd 통솔·val 무용·int 지략)와 특기는 게임 추상화.
   [id, 이름, 활동 시작, 끝, cmd, val, int, 특기, 한 줄 근거]  특기: def 수성 · amb 기습 · cav 기동 · nav 수전 · siege 공성 · insp 고무 */
window.SG = window.SG || {}; SG.data = SG.data || {};
(function () {
  function c(id, name, y0, y1, cmd, val, int, trait, note) { return { id: id, name: name, y0: y0, y1: y1, cmd: cmd, val: val, int: int, trait: trait, note: note }; }
  SG.data.commanders = {
    gogukwon: [c('c_gomu', '왕제 무(武)', 331, 371, 7, 7, 5, 'insp', '342년 정예 5만으로 북도를 지킨 왕의 아우'), c('c_abul', '아불화도가', 331, 342, 6, 8, 4, 'def', '342년 전연군과 싸우다 전사한 장수')],
    yeongyang: [c('c_eulji', '을지문덕', 598, 618, 10, 7, 10, 'amb', '612년 살수에서 수의 별동대를 무너뜨림'), c('c_geonmu', '왕제 건무', 598, 618, 8, 8, 6, 'def', '612년 평양성에서 수 수군을 유인해 격파'), c('c_gangisik', '강이식', 590, 612, 7, 8, 5, 'insp', '598년 병마원수로 전하는 인물 [전승]')],
    bojang: [c('yeon_gaesomun', '연개소문', 642, 665, 9, 9, 8, 'insp', '대막리지. 662년 사수에서 당군 격파'), c('c_yangmanchun', '안시성주(양만춘)', 642, 668, 8, 8, 8, 'def', '645년 안시성을 지켜 냄. 이름은 후대 전승'), c('c_goyeonsu', '고연수', 642, 645, 6, 6, 4, 'cav', '645년 주필산 전투의 지휘관'), c('yeon_namgeon', '연남건', 660, 668, 7, 6, 6, 'def', '668년 평양성 최후 항전'), c('yeon_namsaeng', '연남생', 655, 666, 6, 5, 6, 'cav', '연개소문의 맏아들')],
    geunchogo: [c('c_geungusu', '태자 근구수', 346, 375, 9, 9, 7, 'amb', '369년 치양에서 고구려군 5천을 벰'), c('c_makgohae', '막고해', 346, 375, 7, 6, 8, 'def', '추격을 멈추라 간한 장군'), c('c_mokra', '목라근자', 360, 375, 7, 7, 6, 'cav', '남방 경략을 이끈 장수 [일본서기]')],
    garo: [c('c_munju', '문주', 455, 475, 6, 5, 7, 'def', '상좌평. 475년 신라에 구원을 청함'), c('c_mokhyeop', '목협만치', 455, 475, 6, 6, 6, 'insp', '문주를 호위해 남쪽으로 간 신하')],
    seong: [c('c_yeochang', '태자 여창', 545, 554, 7, 9, 5, 'cav', '554년 관산성 공격을 주도(뒤의 위덕왕)'), c('c_yeonmo', '좌평 연모', 523, 540, 7, 6, 6, 'def', '529년 오곡 벌판에서 고구려군과 싸움')],
    uija: [c('gyebaek', '계백', 641, 660, 8, 9, 6, 'insp', '660년 황산벌 결사대 5천'), c('uijik', '의직', 641, 660, 6, 7, 5, 'cav', '647~648년 신라 서부 공략'), c('c_yunchung', '윤충', 641, 650, 8, 8, 7, 'siege', '642년 대야성 함락'), c('heukchi', '흑치상지', 655, 663, 9, 8, 7, 'amb', '달솔. 뒤에 부흥군을 이끎')],
    nulji: [c('c_jesang', '박제상', 417, 418, 5, 6, 10, 'amb', '418년 왕의 아우들을 구해 온 충신'), c('c_misaheun', '왕제 미사흔', 419, 433, 6, 6, 6, 'def', '왜에서 돌아온 왕의 아우')],
    jinheung: [c('c_isabu', '이사부', 540, 562, 9, 7, 9, 'siege', '550년 도살성·금현성, 562년 대가야 정벌'), c('c_geochilbu', '거칠부', 545, 576, 8, 6, 9, 'amb', '551년 죽령 이북 10군 점령'), c('c_gimmuryeok', '김무력', 550, 576, 8, 8, 6, 'cav', '553년 신주 군주. 관산성 승전'), c('c_sadaham', '사다함', 561, 562, 5, 9, 5, 'cav', '562년 대가야 성문을 먼저 깨뜨린 화랑')],
    seondeok: [c('alcheon', '알천', 632, 647, 7, 8, 5, 'def', '638년 칠중성에서 고구려군 격퇴'), c('gim_yusin', '김유신', 632, 647, 10, 8, 8, 'insp', '644년 백제 7성 공취, 647년 비담의 난 진압'), c('c_piltan', '필탄', 632, 642, 6, 7, 4, 'cav', '636년 옥문곡 전투에 나선 장군')],
    muyeol: [c('gim_yusin', '김유신', 654, 661, 10, 8, 8, 'insp', '660년 대장군으로 황산벌 돌파'), c('gim_pumil', '김품일', 654, 661, 6, 6, 5, 'insp', '660년 좌장군'), c('gim_humsun', '김흠순', 654, 661, 7, 6, 6, 'cav', '660년 우장군'), c('gim_inmun', '김인문', 654, 661, 6, 5, 7, 'nav', '당 수군과 함께 덕물도로 옴')],
    munmu: [c('gim_yusin', '김유신', 661, 673, 10, 8, 8, 'insp', '668년 대당대총관'), c('gim_inmun', '김인문', 661, 681, 6, 5, 7, 'nav', '여러 차례 당을 오간 왕의 아우'), c('jukji', '죽지', 661, 675, 7, 6, 6, 'cav', '671년 석성 전투에서 당군 격파'), c('c_wonsul', '김원술', 672, 681, 7, 9, 5, 'insp', '675년 매소성 전투에서 공을 세움'), c('c_sideuk', '시득', 673, 681, 7, 7, 6, 'nav', '676년 기벌포에서 당 수군과 22번 싸워 이김'), c('c_munhun', '문훈', 668, 681, 7, 7, 5, 'def', '675년 천성에서 설인귀를 격파')]
  };
  SG.data.traitName = { def: '수성', amb: '기습', cav: '기동', nav: '수전', siege: '공성', insp: '고무' };
  SG.data.traitDesc = { def: '방어전에서 지형 효과 +10%', amb: '매복·측후방 기동 때 사기 +8', cav: '돌격·측후방 기동 때 사기 +6', nav: '해안·바다에서 사기 +8', siege: '성을 칠 때 사기 +7', insp: '언제나 사기 +5' };
  // 전투 엔진이 찾을 수 있도록 장수 목록에 등록(이미 있는 인물은 그대로 둔다)
  var G = SG.data.generals = SG.data.generals || [], have = {}; G.forEach(function (g) { have[g.id] = 1; });
  for (var k in SG.data.commanders) SG.data.commanders[k].forEach(function (x) {
    if (!have[x.id]) { have[x.id] = 1; G.push({ id: x.id, name: x.name, side: '', role: '장군', years: x.y0 + '~' + x.y1, stats: { cmd: x.cmd, val: x.val, int: x.int, pol: 5, loy: 7 }, traits: [SG.data.traitName[x.trait]], bio: x.note, basis: '능력치는 게임 추상화' }); }
  });
})();
