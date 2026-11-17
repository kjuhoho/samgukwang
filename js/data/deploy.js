/* 배치용 보강 데이터: 추가 성·요충지, 시기별 소유 세력, 존재 시기.
 * 좌표는 현대 위치 기준 근사값(자료조사/07과 같은 한계). 소유 변동은 삼국사기 기사 기준으로 단순화. */
window.SG = window.SG || {}; SG.data = SG.data || {};
(function () {
  function p(id, name, hanja, modern, kind, side, lon, lat, rank, precision, note, extra) {
    var o = { id: id, name: name, hanja: hanja, modern: modern, kind: kind, side: side, lon: lon, lat: lat, rank: rank, precision: precision, note: note };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  var add = [
    // ── 중국 방면(요서·하북·산동·회남) — 실제 있던 주·진. 좌표는 현대 도시 기준 근사. garMul = 수비 규모 배수(게임 추상화)
    p('hoewonjin', '회원진', '懷遠鎭', '요령 요중·신민 일대(설)', 'fortress', 'tang', 122.3, 41.6, 3, 'low', '수·당이 요하 서쪽에 둔 전진 기지. 고구려 원정의 군량 집결지.', { src: '수서·자치통감', garMul: 1.3 }),
    p('yeongun', '연군', '燕郡', '요령 의현', 'fortress', 'tang', 121.24, 41.53, 3, 'medium', '요서의 군. 영주와 요하 사이의 길목.', { src: '신당서 지리지', garMul: 1.2 }),
    p('pyeongju', '평주(노룡)', '平州', '하북 노룡현', 'city', 'tang', 118.87, 39.89, 2, 'high', '하북에서 요서로 나가는 관문 고을. 북평군.', { src: '신당서 지리지', garMul: 1.8 }),
    p('eoyang', '어양', '漁陽', '천진 계주구', 'city', 'tang', 117.4, 40.04, 2, 'high', '유주 동쪽의 큰 고을. 하북 북부의 군사 거점.', { src: '신당서 지리지', garMul: 2 }),
    p('cheongju_cn', '청주(익도)', '靑州', '산동 청주시', 'city', 'tang', 118.48, 36.69, 1, 'high', '산동의 중심 고을. 북해군.', { src: '신당서 지리지', garMul: 2.2 }),
    p('jeju_cn', '제주(역성)', '齊州', '산동 제남시', 'city', 'tang', 117.02, 36.67, 2, 'high', '황하 하류의 큰 고을. 제남군.', { src: '신당서 지리지', garMul: 2 }),
    p('milju', '밀주', '密州', '산동 제성시', 'city', 'tang', 119.4, 36.0, 3, 'high', '산동 남쪽 해안의 고을. 고밀군.', { src: '신당서 지리지', garMul: 1.5 }),
    p('giju', '기주(임기)', '沂州', '산동 임기시', 'city', 'tang', 118.35, 35.05, 3, 'high', '산동과 회북을 잇는 고을. 낭야군.', { src: '신당서 지리지', garMul: 1.5 }),
    p('haeju_cn', '해주', '海州', '강소 연운항시', 'port', 'tang', 119.2, 34.6, 2, 'high', '황해에 면한 항구 고을. 동해군.', { src: '신당서 지리지', garMul: 1.6 }),
    p('seoju_cn', '서주(팽성)', '徐州', '강소 서주시', 'city', 'tang', 117.2, 34.26, 1, 'high', '남북을 잇는 요충. 팽성군.', { src: '신당서 지리지', garMul: 2.4 }),
    p('choju', '초주(산양)', '楚州', '강소 회안시', 'port', 'tang', 119.02, 33.5, 2, 'high', '회수와 운하가 만나는 항구. 신라·일본 사절이 드나든 길목.', { src: '신당서 지리지·입당구법순례행기', garMul: 1.8 }),
    p('yangju_cn', '양주(강도)', '揚州', '강소 양주시', 'city', 'tang', 119.43, 32.39, 1, 'high', '대운하와 장강이 만나는 천하의 부유한 고을. 수 양제가 머물던 강도.', { src: '수서·신당서 지리지', garMul: 3 }),
    p('jungnyeong', '죽령', '竹嶺', '충북 단양·경북 영주 경계', 'pass', 'silla', 128.48, 36.93, 3, 'high', '신라와 고구려의 국경 고개. 642년 고구려가 "죽령 이북 땅"의 반환을 요구함.', { src: '삼국사기 선덕왕 11년' }),
    p('gyerip', '계립령(하늘재)', '雞立嶺', '경북 문경 · 충북 충주 경계', 'pass', 'silla', 128.07, 36.78, 3, 'medium', '한강 상류와 낙동강 상류를 잇는 고개. 신라 아달라왕 3년(156) 개통 기사.', { src: '삼국사기 신라본기 아달라이사금 3년' }),
    p('myeonghwal', '명활성', '明活城', '경북 경주시', 'fortress', 'silla', 129.28, 35.84, 3, 'high', '서라벌 동쪽 산성. 647년 비담이 이곳에 주둔해 월성과 대치.', { src: '삼국사기 선덕왕 16년' }),
    p('geoyeol', '거열성', '居列城', '경남 거창군', 'fortress', 'silla', 127.91, 35.69, 3, 'medium', '신라 서쪽 변경의 산성. 가야·백제 방면을 막는 거점.', { src: '삼국사기 지리지(위치 통설)', from: 550 }),
    p('doksan', '독산성', '禿山城', '경기 오산 독성산성 설(학설 대립)', 'fortress', 'baekje', 127.03, 37.13, 3, 'disputed', '548년 고구려·예가 공격하자 신라 주진이 구원한 성. 한강 이북설과 오산설이 갈린다.', { src: '삼국사기 성왕 26년 · 신라본기 진흥왕 9년' }),
    p('bukhansan', '북한산성', '北漢山城', '서울·경기 북한산', 'fortress', 'baekje', 126.98, 37.66, 3, 'medium', '한강 북쪽의 산성. 백제·고구려·신라가 차례로 차지한 요충. 문무왕 13년(672) 신라가 쌓았다는 기사도 있음.', { src: '삼국사기 개루왕 5년 · 문무왕 13년' }),
    p('udu', '우두주(춘천)', '牛頭州', '강원 춘천시', 'city', 'goguryeo', 127.73, 37.88, 3, 'medium', '강원 내륙 거점. 신라 선덕왕·문무왕 대에 주(州)로 편제.', { src: '삼국사기 지리지' }),
    p('daegaya', '대가야(고령)', '大加耶', '경북 고령군', 'capital', 'gaya', 128.26, 35.73, 2, 'high', '고령 지산동 고분군이 있는 가야 맹주. 562년 신라 이사부·사다함에게 병합.', { src: '삼국사기 진흥왕 23년', to: 562 }),
    p('geumgwan', '금관가야(김해)', '金官伽耶', '경남 김해시', 'city', 'gaya', 128.88, 35.23, 3, 'high', '532년 구형왕이 신라에 항복한 가야 소국.', { src: '삼국사기 법흥왕 19년', to: 532 }),
    p('alla', '안라국(함안)', '安羅國', '경남 함안군', 'city', 'gaya', 128.41, 35.27, 3, 'medium', '6세기 가야 연맹의 한 축. 일본서기에 자주 등장.', { src: '일본서기 흠명기', to: 562 }),
    p('geummajeo', '금마저(익산)', '金馬渚', '전북 익산시', 'city', 'baekje', 127.05, 35.95, 3, 'high', '무왕 대 미륵사·왕궁 조성. 670년 신라가 고구려 안승을 이곳에 두었다고 전함.', { src: '삼국사기 문무왕 10년', from: 590 }),
    p('ogolseong', '오골성', '烏骨城', '요령 단둥 봉황산성', 'fortress', 'goguryeo', 124.06, 40.45, 3, 'medium', '압록강 방면 고구려의 대형 산성. 당군이 우회로로 노린 성.', { src: '신당서 고구려전', from: 590 }),
    p('baegamseong', '백암성', '白巖城', '요령 요양시 연주성', 'fortress', 'goguryeo', 123.44, 41.2, 3, 'medium', '645년 이세적·당군에게 함락된 요동 방어선의 성.', { src: '삼국사기 보장왕 4년', from: 590 }),
    p('geonanseong', '건안성', '建安城', '요령 개주시 고력성', 'fortress', 'goguryeo', 122.35, 40.4, 3, 'medium', '645년 당군이 공격한 성. 요동 남쪽의 요충.', { src: '삼국사기 보장왕 4년', from: 590 }),
    p('hwandosan', '환도성(산성자산성)', '丸都城', '길림성 집안시', 'fortress', 'goguryeo', 126.17, 41.16, 2, 'high', '342년 전연 모용황이 함락한 고구려 위기의 성.', { src: '삼국사기 고국원왕 12년', to: 427 }),
    p('yongseong', '용성(전연 도읍)', '龍城', '요령 조양시', 'capital', 'tang', 120.45, 41.58, 2, 'high', '전연의 도읍. 342년 고구려 침공의 출발점.', { src: '진서 재기', from: 337, to: 370 }),
    p('imyu', '임유관(수 방면)', '臨渝關', '하북 진황도 산해관', 'pass', 'tang', 119.75, 40.0, 3, 'medium', '598년 영양왕이 말갈군 1만을 거느리고 먼저 공격한 수나라 쪽 관문.', { src: '삼국사기 영양왕 9년', from: 580, to: 625 }),
    p('daesongsan', '대성산성(평양 방면)', '大城山城', '평양시 대성구역', 'fortress', 'goguryeo', 125.93, 39.1, 3, 'medium', '장안성 이전 평양 일대 고구려의 중심 산성.', { src: '삼국사기 지리지(위치 통설)', to: 586 })
  ];
  SG.data.places = (SG.data.places || []).concat(add);

  // 시기별 소유 세력 — [시작연도, 세력] 목록(시간순). 세력이 null이면 그 시기에는 표시하지 않음.
  SG.data.placeOwner = {
    hanseong: [[0, 'baekje'], [475, 'goguryeo'], [551, 'baekje'], [553, 'silla']],
    bukhansan: [[0, 'baekje'], [475, 'goguryeo'], [551, 'baekje'], [553, 'silla']],
    achasan: [[0, 'baekje'], [475, 'goguryeo'], [551, 'baekje'], [553, 'silla']],
    doksan: [[0, 'baekje'], [553, 'silla']],
    chungju: [[0, 'goguryeo'], [551, 'silla']],
    jungnyeong: [[0, 'silla']],
    chiljungseong: [[0, 'goguryeo'], [553, 'silla']],
    danghangseong: [[0, 'baekje'], [553, 'silla']],
    udu: [[0, 'goguryeo'], [550, 'silla']],
    daeyaseong: [[0, 'silla'], [642, 'baekje'], [660, 'silla']],
    horogoru: [[0, 'goguryeo'], [668, 'silla']],
    pyeongyang: [[0, 'goguryeo'], [668, 'tang'], [677, 'neutral']],
    daesongsan: [[0, 'goguryeo'], [668, 'tang']],
    sabi: [[0, 'baekje'], [660, 'tang'], [671, 'silla']],
    ungjin: [[0, 'baekje'], [660, 'tang'], [676, 'silla']],
    geummajeo: [[0, 'baekje'], [660, 'tang'], [670, 'silla']],
    deoganseong: [[0, 'baekje'], [660, 'tang'], [676, 'silla']],
    gosaseong: [[0, 'baekje'], [660, 'tang'], [676, 'silla']]
  };
  // 존재 시기 [시작, 끝]. 표에 없으면 항상 존재.
  SG.data.placeEra = {
    hoewonjin: [590, 9999], yeongun: [590, 9999], jeju_cn: [589, 9999], milju: [589, 9999], giju: [589, 9999], haeju_cn: [589, 9999], seoju_cn: [589, 9999], choju: [589, 9999], yangju_cn: [589, 9999],
    samnyeon: [470, 9999], gwansanseong: [500, 9999], daeyaseong: [520, 9999], namcheonjeong: [553, 9999], maesoseong: [600, 9999],
    sabi: [538, 9999], ungjin: [475, 9999], juryuseong: [600, 9999], imjonseong: [600, 9999],
    hwangsanbeol: [600, 9999], tanhyeon: [600, 9999], baekgang: [600, 9999], deokmuldo: [600, 9999], asakura: [600, 9999], dazaifu: [600, 9999], otsu: [600, 9999],
    garimseong: [450, 9999], seokseong: [500, 9999], duryangyun: [600, 9999], geoyeol: [550, 9999]
  };

  // 영토 계산용 보조 거점(화면에는 표시되지 않음). owner = [[시작연도, 세력|null], ...]
  var HB = [[0, 'baekje'], [475, 'goguryeo'], [551, 'baekje'], [553, 'silla']];
  SG.data.seeds = [
    { lon: 126.6, lat: 37.55, own: HB }, { lon: 127.4, lat: 37.3, own: HB }, { lon: 127.2, lat: 37.9, own: [[0, 'baekje'], [475, 'goguryeo'], [553, 'silla']] },
    { lon: 126.0, lat: 37.9, own: [[0, 'baekje'], [475, 'goguryeo'], [668, 'silla']] },
    { lon: 126.5, lat: 35.2, own: [[0, null], [369, 'baekje']] }, { lon: 126.6, lat: 34.6, own: [[0, null], [369, 'baekje']] }, { lon: 126.8, lat: 35.8, own: [[0, 'baekje']] },
    { lon: 126.9, lat: 36.6, own: [[0, 'baekje']] }, { lon: 127.1, lat: 36.1, own: [[0, 'baekje']] },
    { lon: 128.6, lat: 35.5, own: [[0, 'gaya'], [562, 'silla']] }, { lon: 128.1, lat: 35.2, own: [[0, 'gaya'], [562, 'silla']] },
    { lon: 129.0, lat: 36.0, own: [[0, 'silla']] }, { lon: 128.6, lat: 36.6, own: [[0, 'silla']] }, { lon: 129.2, lat: 37.1, own: [[0, null], [450, 'silla']] },
    { lon: 128.9, lat: 37.6, own: [[0, 'silla']] }, { lon: 128.9, lat: 35.7, own: [[0, 'silla']] },
    { lon: 125.5, lat: 39.5, own: [[0, 'goguryeo'], [668, 'tang'], [677, null]] }, { lon: 126.5, lat: 38.6, own: [[0, 'goguryeo'], [668, 'tang'], [677, null]] },
    { lon: 127.2, lat: 39.4, own: [[0, 'goguryeo']] }, { lon: 126.2, lat: 41.6, own: [[0, 'goguryeo']] }, { lon: 125.0, lat: 41.9, own: [[0, 'goguryeo']] },
    { lon: 123.3, lat: 41.5, own: [[0, null], [404, 'goguryeo']] }, { lon: 127.5, lat: 42.5, own: [[0, null], [400, 'goguryeo']] },
    { lon: 128.0, lat: 38.3, own: [[0, 'goguryeo'], [553, 'goguryeo'], [668, 'silla']] }
  ];
  SG.ownerFrom = function (tbl, year) { var side = tbl[0][1]; for (var i = 0; i < tbl.length; i++) if (year >= tbl[i][0]) side = tbl[i][1]; return side; };
  SG.ownerAt = function (pl, year) {
    var tbl = SG.data.placeOwner && SG.data.placeOwner[pl.id], side = pl.side;
    if (tbl) { side = tbl[0][1]; for (var i = 0; i < tbl.length; i++) if (year >= tbl[i][0]) side = tbl[i][1]; }
    if (!tbl && pl.side === 'gaya' && pl.to != null && year > pl.to) return 'silla';
    return side;
  };
  SG.placeActive = function (pl, year) {
    var e = (SG.data.placeEra && SG.data.placeEra[pl.id]) || [pl.from != null ? pl.from : 0, pl.to != null ? pl.to : 9999];
    if (pl.from != null && SG.data.placeEra && SG.data.placeEra[pl.id]) e = [Math.max(e[0], pl.from), Math.min(e[1], pl.to != null ? pl.to : 9999)];
    return year >= e[0] && year <= e[1];
  };
})();
