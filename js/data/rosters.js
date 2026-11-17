// 국가별 병종 로스터. 주의: atk/def/mov/mor 보정치(-2~+2)와 size 는 '게임 추상화'이며 사료 수치가 아니다.
// base 는 공통 병종 13종 중 하나. basis: source(사료 기록) / inferred(학계 추정) / abstract(게임 추상화).
// 공통 병종: inf_levy inf_line inf_elite cav_light cav_heavy archer crossbow siege navy_war navy_transport guard garrison scout
window.SG = window.SG || {}; SG.data = SG.data || {};
SG.data.unitBases = ['inf_levy','inf_line','inf_elite','cav_light','cav_heavy','archer','crossbow','siege','navy_war','navy_transport','guard','garrison','scout'];
SG.data.rosters = {
  baekje: {
    name:'백제', hanja:'百濟',
    organization:['5방(방령 1인=달솔급, 방 아래 군 단위 군장 3인=덕솔급), 방당 병력 700~1,200명(주서·북사 계열 전승)','중앙 22부, 16관등(좌평~극우), 좌평 5인','수군·무기 세부 편제는 사료 부족 — 상당 부분 추정'],
    units:[
      { id:'baekje_bangun', name:'방군 보병', hanja:'方軍', base:'inf_line', atk:0, def:0, mov:0, mor:0, size:'700~1,200 (방당)', basis:'source', src:'주서·북사 백제전', desc:'5방에 분산 배치된 상비 보병의 중핵.' },
      { id:'baekje_levy', name:'징발 농민병', hanja:'徵發', base:'inf_levy', atk:-1, def:-1, mov:0, mor:-1, size:'가변', basis:'inferred', src:'일반 학설', desc:'위기 시 성 단위로 동원되는 보조 병력.' },
      { id:'baekje_gyebaek', name:'결사대', hanja:'決死隊', base:'inf_elite', atk:2, def:0, mov:0, mor:2, size:'5,000 (사료 수치, 과장 가능)', basis:'source', src:'삼국사기 열전 계백', desc:'660년 황산벌 계백 휘하. 사기는 높으나 수는 소수.' },
      { id:'baekje_horse', name:'기병', hanja:'騎兵', base:'cav_light', atk:1, def:-1, mov:2, mor:0, size:'소수', basis:'inferred', src:'일반 학설', desc:'기병 비중은 크지 않았을 것으로 본다.' },
      { id:'baekje_archer', name:'궁수', hanja:'弓手', base:'archer', atk:1, def:-1, mov:0, mor:0, size:'가변', basis:'source', src:'주서(궁시 숭상 기록)', desc:'백제인은 말타기·활쏘기를 즐겼다는 기록이 전한다.' },
      { id:'baekje_guard', name:'왕궁 호위병', hanja:'衛士', base:'guard', atk:0, def:1, mov:0, mor:1, size:'소수', basis:'inferred', src:'일반 학설', desc:'사비 도성 방어.' },
      { id:'baekje_garrison', name:'산성 수비대', hanja:'山城', base:'garrison', atk:-1, def:2, mov:-1, mor:0, size:'성별 상이', basis:'source', src:'삼국사기', desc:'탄현·임존성·주류성 등 산성 거점 방어.' },
      { id:'baekje_navy', name:'수군', hanja:'水軍', base:'navy_war', atk:0, def:0, mov:1, mor:0, size:'미상(사료 부재)', basis:'abstract', src:'게임 추상화', desc:'백강·기벌포 방어용. 규모는 추정 불가.' },
      { id:'baekje_scout', name:'척후병', hanja:'斥候', base:'scout', atk:-1, def:-1, mov:2, mor:0, size:'소수', basis:'abstract', src:'게임 추상화', desc:'국경 정찰.' }
    ]
  },
  silla: {
    name:'신라', hanja:'新羅',
    organization:['6정(544년 설치 이후 확충, 지방 주둔 상비군), 서당(583·613·693 등 시기 이설, 9서당으로 정비)','법당(軍役 보조 조직), 화랑도(정신적·인적 기반)','선부(船府, 663·678 등 설치 연대 이설)','천보노(弩) — 구진천 669년 기록'],
    units:[
      { id:'silla_jeong', name:'정병 보병', hanja:'停兵', base:'inf_line', atk:0, def:0, mov:0, mor:0, size:'정별 수천', basis:'source', src:'삼국사기 직관지', desc:'6정 소속 상비 보병.' },
      { id:'silla_seodang', name:'서당', hanja:'誓幢', base:'inf_elite', atk:1, def:0, mov:0, mor:1, size:'당별 수백~천', basis:'source', src:'삼국사기 직관지', desc:'중앙군. 정확한 창설 연도는 이설.' },
      { id:'silla_hwarang', name:'화랑 낭도', hanja:'花郞', base:'inf_elite', atk:2, def:-1, mov:1, mor:2, size:'소수', basis:'source', src:'삼국사기 열전', desc:'관창·반굴 등 순국 일화로 사기를 끌어올림.' },
      { id:'silla_levy', name:'징발병', hanja:'徵發', base:'inf_levy', atk:-1, def:-1, mov:0, mor:-1, size:'가변', basis:'inferred', src:'일반 학설', desc:'총동원 시 가세.' },
      { id:'silla_horse', name:'기병', hanja:'騎兵', base:'cav_light', atk:1, def:-1, mov:2, mor:0, size:'소수', basis:'inferred', src:'일반 학설', desc:'기병 비중은 작았을 것.' },
      { id:'silla_crossbow', name:'천보노병', hanja:'千步弩', base:'crossbow', atk:2, def:-2, mov:-1, mor:0, size:'소수', basis:'source', src:'삼국사기 구진천(669)', desc:'당에서 노 기술자를 데려온 기록. 천보=장거리 노를 뜻한다.' },
      { id:'silla_garrison', name:'성 수비대', hanja:'城', base:'garrison', atk:-1, def:2, mov:-1, mor:0, size:'성별 상이', basis:'source', src:'삼국사기', desc:'대야성·북한산성 등.' },
      { id:'silla_navy', name:'선부 수군', hanja:'船府', base:'navy_war', atk:0, def:0, mov:1, mor:0, size:'미상', basis:'inferred', src:'삼국사기 직관지(설치 연대 이설)', desc:'660년 법민이 이끈 수군·덕물도 합류는 사실.' },
      { id:'silla_scout', name:'척후·간인', hanja:'斥候', base:'scout', atk:-1, def:-1, mov:2, mor:0, size:'소수', basis:'abstract', src:'게임 추상화', desc:'국경 정찰.' },
      { id:'silla_guard', name:'왕경 호위', hanja:'侍衛', base:'guard', atk:0, def:1, mov:0, mor:1, size:'소수', basis:'inferred', src:'삼국사기 직관지(시위부)', desc:'왕경 경비.' }
    ]
  },
  goguryeo: {
    name:'고구려', hanja:'高句麗',
    organization:['대막리지 연개소문 체제(642~665), 막리지·대대로','성(城) 중심 방어, 말갈·거란 등 이민족 부대 편입','조의선인(皂衣仙人) 등 무사 집단(사료 기록 한정적)'],
    units:[
      { id:'goguryeo_infantry', name:'성군 보병', hanja:'城軍', base:'inf_line', atk:0, def:1, mov:0, mor:0, size:'성별 상이', basis:'source', src:'삼국사기 고구려본기', desc:'성 방어의 중심.' },
      { id:'goguryeo_gaemamusa', name:'개마무사', hanja:'鎧馬武士', base:'cav_heavy', atk:2, def:2, mov:0, mor:1, size:'소수 정예', basis:'source', src:'고분벽화·삼국사기', desc:'말과 사람 모두 갑옷을 입은 중장기병.' },
      { id:'goguryeo_archer', name:'맥궁 기병궁수', hanja:'貊弓', base:'archer', atk:2, def:-1, mov:1, mor:0, size:'가변', basis:'inferred', src:'일반 학설', desc:'맥궁은 고구려 활로 알려져 있다.' },
      { id:'goguryeo_levy', name:'징발병', hanja:'徵發', base:'inf_levy', atk:-1, def:-1, mov:0, mor:-1, size:'가변', basis:'inferred', src:'일반 학설', desc:'게임 추상화 병종.' },
      { id:'goguryeo_malgal', name:'말갈 용병·부속병', hanja:'靺鞨', base:'cav_light', atk:1, def:-1, mov:2, mor:0, size:'수만(사료 수치, 과장 가능)', basis:'source', src:'삼국사기 보장왕', desc:'연개소문 체제하 편입된 이민족 부대.' },
      { id:'goguryeo_guard', name:'왕경·막리지 직속군', hanja:'親衛', base:'guard', atk:1, def:1, mov:0, mor:1, size:'소수', basis:'inferred', src:'일반 학설', desc:'평양성 방어.' },
      { id:'goguryeo_garrison', name:'산성 수비대', hanja:'山城', base:'garrison', atk:-1, def:3, mov:-1, mor:1, size:'성별 상이', basis:'source', src:'삼국사기(안시성 등)', desc:'수·당 침공을 막아낸 방어 특화.' },
      { id:'goguryeo_scout', name:'척후', hanja:'斥候', base:'scout', atk:-1, def:-1, mov:2, mor:0, size:'소수', basis:'abstract', src:'게임 추상화', desc:'게임 추상화 병종.' },
      { id:'goguryeo_navy', name:'수군', hanja:'水軍', base:'navy_war', atk:0, def:0, mov:1, mor:0, size:'미상', basis:'abstract', src:'게임 추상화 (고구려 수군 기록은 단편적)', desc:'서해·압록강 하구 방어. 규모는 추정 불가.' },
      { id:'goguryeo_siege', name:'노·투석', hanja:'弩石', base:'siege', atk:1, def:0, mov:-2, mor:0, size:'소수', basis:'inferred', src:'일반 학설', desc:'성 방어용 노와 포석.' }
    ]
  },
  tang: {
    name:'당', hanja:'唐',
    organization:['부병제(府兵制) 기반 징병, 번병(이민족 병력) 병용','행군총관 체제(원정군 편성), 도행군대총관','수군·공성구 보유, 660년 신구도행군 13만(사료 수치) 규모 전승'],
    units:[
      { id:'tang_bubyeong', name:'부병 보병', hanja:'府兵', base:'inf_line', atk:0, def:0, mov:0, mor:0, size:'가변', basis:'source', src:'구당서·신당서 병지', desc:'부병제 기반 정규 보병.' },
      { id:'tang_elite', name:'정예 장병', hanja:'精兵', base:'inf_elite', atk:2, def:1, mov:0, mor:1, size:'소수', basis:'inferred', src:'일반 학설', desc:'장군 직속 정예.' },
      { id:'tang_cavalry', name:'번병 기병', hanja:'蕃兵', base:'cav_heavy', atk:2, def:0, mov:2, mor:1, size:'가변', basis:'source', src:'구당서', desc:'돌궐·거란 등 이민족 기병.' },
      { id:'tang_archer', name:'궁수', hanja:'弓手', base:'archer', atk:1, def:-1, mov:0, mor:0, size:'가변', basis:'inferred', src:'일반 학설', desc:'게임 추상화 병종.' },
      { id:'tang_crossbow', name:'노병', hanja:'弩', base:'crossbow', atk:2, def:-1, mov:-1, mor:0, size:'가변', basis:'source', src:'통전 등 병서', desc:'당군 노는 강력했다고 평가.' },
      { id:'tang_siege', name:'공성병기', hanja:'攻城', base:'siege', atk:3, def:-1, mov:-2, mor:0, size:'소수', basis:'inferred', src:'통전 병서', desc:'충차·운제·포거 등.' },
      { id:'tang_navy', name:'수군', hanja:'水軍', base:'navy_war', atk:1, def:1, mov:1, mor:0, size:'미상(사료 수치 불확실)', basis:'source', src:'구당서 소정방전', desc:'660년 서해 도해, 663년 백강 전투에 투입.' },
      { id:'tang_transport', name:'수송선단', hanja:'輸送', base:'navy_transport', atk:-2, def:-1, mov:0, mor:0, size:'가변', basis:'inferred', src:'일반 학설', desc:'병력·보급.' },
      { id:'tang_guard', name:'어림군·장군 호위', hanja:'禁衛', base:'guard', atk:1, def:1, mov:0, mor:1, size:'소수', basis:'inferred', src:'일반 학설', desc:'게임 추상화 병종.' }
    ]
  },
  wa: {
    name:'왜(일본)', hanja:'倭',
    organization:['국조·반조 등 지방 호족 병력 동원','663년 백촌강 전투에 약 27,000명(천지 2년 3월 기사) 규모 전승','백강 패전 후 방인(防人)·수성(水城)·봉화 등 방어체제 정비'],
    units:[
      { id:'wa_levy', name:'호족 징발병', hanja:'豪族', base:'inf_levy', atk:-1, def:-1, mov:0, mor:0, size:'가변', basis:'inferred', src:'일본서기', desc:'지방 호족이 거느린 병력.' },
      { id:'wa_line', name:'정규 보병', hanja:'歩兵', base:'inf_line', atk:0, def:0, mov:0, mor:0, size:'가변', basis:'inferred', src:'일본서기', desc:'게임 추상화 병종.' },
      { id:'wa_archer', name:'궁수', hanja:'弓', base:'archer', atk:1, def:-1, mov:0, mor:0, size:'가변', basis:'inferred', src:'일반 학설', desc:'게임 추상화 병종.' },
      { id:'wa_navy', name:'병선단', hanja:'兵船', base:'navy_war', atk:-1, def:-1, mov:0, mor:0, size:'400척(구당서 유인궤전, 소실 기록)/170척(일본서기, 이설)', basis:'source', src:'구당서·일본서기', desc:'백강 전투 규모 수치는 사료 간 편차가 큼.' },
      { id:'wa_garrison', name:'방인·수성 수비', hanja:'防人', base:'garrison', atk:-1, def:2, mov:-1, mor:0, size:'가변', basis:'source', src:'일본서기 천지기', desc:'664년 이후 다자이후 일대 방어.' }
    ]
  }
};
