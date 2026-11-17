/* 정무 명령(자유 행동) · 법령 · 전쟁 대상 데이터.
 * 한 해에 정무 행동력(AP) 3점으로 실행. hist: '역사'=사료에 근거한 행위, '일반'=시대상에 맞는 일반적 행위, '가상'=사료에 없는 행위.
 * eff: fx(자원) realm(왕권 royal·훈련 train·방비 defense·수군 navy·농업 econ·첩보 intel) rel(외교관계) army(병력) world(세계값 경로) flags */
window.SG = window.SG || {}; SG.data = SG.data || {};
SG.data.commands = [
  /* ── 내정 ── */
  { id: 'farm', cat: '내정', name: '농사 장려', desc: '종자·농기구를 나눠 주고 제방을 손봅니다.', cost: { gold: 4 }, hist: '일반', eff: { realm: { econ: 6 }, fx: { people: 2 } }, lines: ['관리들이 마을을 돌며 종자와 농기구를 나누고 제방을 손보았습니다.', '풍년을 기원하며 들녘마다 농사 독려관이 파견되었습니다.'] },
  { id: 'relief', cat: '내정', name: '진휼(곡식 나눔)', desc: '굶주린 백성에게 곡식을 풉니다.', cost: { food: 8 }, hist: '일반', eff: { fx: { people: 8 } }, lines: ['창고를 열어 굶주린 백성에게 곡식을 나눠 주었습니다.', '왕의 이름으로 진휼미가 내려와 민심이 한결 가라앉았습니다.'] },
  { id: 'census', cat: '내정', name: '호구 조사와 조세 정비', desc: '호구를 헤아려 세수를 늘립니다. 백성은 부담을 느낍니다.', cost: {}, hist: '일반', cd: 3, eff: { fx: { gold: 10, people: -4 }, realm: { econ: 3 } }, lines: ['호구를 새로 파악해 세수가 늘었으나 백성들의 불만이 쌓였습니다.'] },
  { id: 'amnesty', cat: '내정', name: '대사면', desc: '죄수를 풀어 민심을 얻습니다. 왕권은 조금 약해집니다.', cost: {}, hist: '역사', note: '백제본기: 즉위 2년 순행 후 죄수 용서, 4년 융을 태자로 삼고 대사면.', cd: 3, eff: { fx: { people: 7 }, realm: { royal: -2 } }, lines: ['대사면이 내려져 옥문이 열렸습니다. 백성은 환호했고 일부 귀족은 눈살을 찌푸렸습니다.'] },
  { id: 'purge', cat: '내정', name: '반대 귀족 숙청', desc: '왕권을 세우지만 민심과 조정 분위기가 얼어붙습니다.', cost: {}, hist: '가상', note: '일본서기 계열에 즉위 초 왕족·유력자 추방 전승이 있으나 삼국사기에는 없어 단정할 수 없습니다.', cd: 4, eff: { realm: { royal: 14 }, fx: { people: -5, morale: -2 }, flags: { purged: true } }, lines: ['반대하던 귀족 몇이 섬으로 쫓겨났습니다. 조정은 숨을 죽였습니다.'] },
  { id: 'court_gift', cat: '내정', name: '귀족 회유 (식읍·하사)', desc: '재물로 귀족의 마음을 샀습니다.', cost: { gold: 8 }, hist: '일반', eff: { realm: { royal: 7 } }, lines: ['귀족들에게 비단과 식읍이 내려졌고, 조정이 한동안 조용했습니다.'] },
  { id: 'officials', cat: '내정', name: '관제 정비 (16관등·22부)', desc: '관등과 관서를 손질해 행정력을 높입니다.', cost: { gold: 6 }, hist: '일반', cd: 5, note: '16관등과 22부 제도는 {cap} 시기 백제에 있었던 것으로 전하며, 이를 정비하는 행위는 가상입니다.', eff: { realm: { royal: 4, econ: 3 } }, lines: ['관등과 관서의 직무가 다시 정리되어 행정 문서가 막힘없이 오갔습니다.'] },
  { id: 'temple', cat: '내정', name: '사찰 건립·불교 후원', desc: '사찰을 세우고 승려를 후원합니다.', cost: { gold: 10 }, hist: '일반', eff: { fx: { people: 5 }, realm: { royal: 2 }, flags: { buddhist: true } }, lines: ['새 절의 종소리가 {cap}성 안팎에 울렸습니다.', '승려들이 왕실의 안녕을 기원하며 법회를 열었습니다.'] },
  { id: 'palace', cat: '내정', name: '궁궐·정자 증축', desc: '왕실의 위엄을 높이지만 재물과 민심이 듭니다.', cost: { gold: 12 }, hist: '역사', note: '655년 태자궁을 사치스럽게 손질하고 망해정을 세웠다는 기록이 있습니다.', eff: { fx: { people: -5 }, realm: { royal: 5 } }, lines: ['궁궐 공사에 많은 백성이 동원되었습니다. 웅장해진 궁 앞에서 원성이 들렸습니다.'] },
  { id: 'ritual', cat: '내정', name: '천지·조상 제사', desc: '제례로 인심을 모읍니다.', cost: { food: 3 }, hist: '일반', eff: { fx: { people: 3, morale: 2 }, realm: { royal: 2 } }, lines: ['왕이 직접 제사를 주관해 민심이 한곳으로 모였습니다.'] },
  { id: 'tunjeon', cat: '내정', name: '황무지 개간', desc: '변경 황무지를 개간해 장기적으로 곡식 생산을 늘립니다.', cost: { gold: 6, food: 3 }, hist: '일반', eff: { realm: { econ: 9, defense: 2 } }, lines: ['변경 황무지에 농민이 정착해 새 밭이 일구어졌습니다.'] },
  { id: 'law', cat: '내정', name: '법령 제정', desc: '법령 목록에서 골라 반포합니다. (자유 입력: "법령 만들어")', cost: {}, hist: '일반', needs: 'law', eff: {} },

  /* ── 군사 ── */
  { id: 'drill', cat: '군사', name: '군사 훈련', desc: '군을 모아 진법과 활쏘기를 훈련시킵니다.', cost: { food: 4 }, hist: '일반', eff: { realm: { train: 12 }, fx: { morale: 3 } }, lines: ['성 밖 들에서 군사들이 진법과 활쏘기를 거듭 훈련했습니다.', '장수들이 병사를 닦달해 군의 기강이 한결 서슬 푸르러졌습니다.'] },
  { id: 'levy', cat: '군사', name: '징발병 모집', desc: '농민을 징발해 머릿수를 채웁니다. (농민병 +3천)', cost: { food: 5 }, hist: '일반', eff: { army: { baekje_levy: 3000 }, fx: { people: -4 } }, lines: ['각 고을에서 농민들이 징발되어 병적에 올랐습니다. 농번기에 끌려간 이들의 한숨이 깊습니다.'] },
  { id: 'standing', cat: '군사', name: '상비군 확충', desc: '봉급과 군장을 갖춘 방군 보병을 늘립니다. (+1.5천)', cost: { gold: 8, food: 3 }, hist: '일반', eff: { army: { baekje_bangun: 1500 }, realm: { train: 3 } }, lines: ['각 성마다 정병이 보충되어 상비군이 두터워졌습니다.'] },
  { id: 'horse', cat: '군사', name: '기병 양성', desc: '말을 사들이고 기병을 키웁니다. (+0.5천)', cost: { gold: 6 }, hist: '일반', eff: { army: { baekje_horse: 500 } }, lines: ['목장에서 말을 사들여 기병 편제가 늘었습니다.'] },
  { id: 'archers', cat: '군사', name: '궁수 부대 육성', desc: '산성 방어에 쓸 궁수를 길러냅니다. (+1천)', cost: { gold: 4 }, hist: '일반', eff: { army: { baekje_archer: 1000 } }, lines: ['궁술 대회가 열리고 뽑힌 궁수들이 부대에 편입되었습니다.'] },
  { id: 'elite', cat: '군사', name: '결사 정예대 양성', desc: '죽음을 각오한 정예를 선발합니다. (+0.5천)', cost: { gold: 6, food: 2 }, hist: '일반', eff: { army: { baekje_gyebaek: 500 }, realm: { train: 4 } }, lines: ['용맹한 장정 가운데서 정예 결사대가 뽑혔습니다.'] },
  { id: 'fortify', cat: '군사', name: '산성 보수·증축', desc: '국경과 요충의 산성을 손봅니다.', cost: { gold: 6, food: 3 }, hist: '역사', note: '655년 마천성을 중수한 기록이 있습니다.', eff: { realm: { defense: 9 } }, lines: ['요충의 산성들에 새 성가퀴와 우물이 보강되었습니다.', '백성들이 돌을 날라 국경 산성이 한층 높아졌습니다.'] },
  { id: 'navy', cat: '군사', name: '수군·조선 증강', desc: '서해를 지킬 전선을 만듭니다. (수군 +0.5천)', cost: { gold: 7 }, hist: '일반', eff: { realm: { navy: 10 }, army: { baekje_navy: 500 } }, lines: ['큰 강 하구 조선소에서 새 전선이 진수되었습니다.'] },
  { id: 'scouts', cat: '군사', name: '척후망·첩보 강화', desc: '국경 척후를 늘려 적정을 살핍니다.', cost: { gold: 4 }, hist: '일반', eff: { realm: { intel: 14 }, army: { baekje_scout: 300 } }, lines: ['국경마다 척후가 늘고 봉수가 정비되었습니다. 적의 움직임이 한결 잘 보입니다.'] },
  { id: 'deploy', cat: '군사', name: '병력 배치 조정', desc: '수도와 전선 성에 주둔시킬 병력 비율을 정합니다. (침공·방어전에서 그 방면의 방어력에 영향)', cost: {}, hist: '일반', needs: 'deploy', eff: {}, lines: ['장수들을 불러 병력을 새로 나누어 배치했습니다.'] },
  { id: 'parade', cat: '군사', name: '열병과 포상', desc: '군을 사열하고 공을 세운 자를 상합니다.', cost: { gold: 5 }, hist: '일반', eff: { fx: { morale: 9 }, realm: { royal: 3 } }, lines: ['열병식에서 왕이 직접 공을 세운 장수에게 말과 곡식을 내렸습니다.'] },
  { id: 'war', cat: '군사', name: '{rival} 정벌 (전쟁)', desc: '{rival}의 성을 골라 군을 보냅니다. (자유 입력: "{rival}를 공격")', cost: { food: 6 }, hist: '역사', note: '의자왕은 642·645·647·648·649·655년에 {rival}를 공격했습니다.', needs: 'target', eff: {}, ap: 2 },

  /* ── 외교 ── */
  { id: 'tribute_tang', cat: '외교', name: '{great}에 입조·조공', desc: '{great} 황제에게 사신과 공물을 보내 관계를 다집니다.', cost: { gold: 6 }, hist: '역사', note: '백제본기: 641~655년 거의 매년 정월 {great}에 입조했습니다.', eff: { rel: { tang: 10 }, world: { 'tang.commit': -4 } }, lines: ['사신이 장안에 공물을 바치고 {great} 황제의 후한 회사품을 받아 왔습니다.'] },
  { id: 'peace_silla', cat: '외교', name: '{rival}에 화친 제의', desc: '{rival}에 사신을 보내 화해를 청합니다.', cost: { gold: 6 }, hist: '가상', note: '실제로는 {rival}와 화친 시도 기록이 없고, {rival} 사신 김법민이 성 반환을 요구한 기사가 651년에 있습니다.', eff: { rel: { silla: 14 }, world: { 'silla.hostility': -8 } }, lines: ['{rival} 조정은 의심하면서도 사신을 정중히 맞이했습니다.'], risk: { p: 0.25, text: '{rival}는 이를 약세의 표시로 읽었는지 오히려 변경 병력을 늘렸습니다.', eff: { world: { 'silla.hostility': 6 } } } },
  { id: 'return_cities', cat: '외교', name: '점령한 {rival} 성 반환', desc: '{great} 고종의 새서를 받아들여 성을 돌려줍니다.', cost: {}, hist: '역사', note: '651년 {great} 고종이 새서로 {rival}에서 빼앗은 성의 반환을 권고했습니다(백제는 따르지 않음).', from: 645, eff: { rel: { tang: 18, silla: 12 }, world: { 'tang.commit': -12 }, realm: { royal: -3 }, flags: { returned: true } }, lines: ['성들이 {rival}에 돌아갔습니다. 장안의 조정은 백제의 도리를 칭찬했습니다.'], req: function (s) { return (s.captured && Object.keys(s.captured).length) || (s.flags.took_sillacities); } },
  { id: 'ally_goguryeo', cat: '외교', name: '{ally}와 동맹 강화', desc: '{ally}와 군사·외교 공조를 다집니다.', cost: { gold: 6 }, hist: '역사', note: '643년 {ally}와 화친하고 {rival} 당항성을 공격, 655년 {ally}·말갈과 함께 {rival}를 공격했습니다.', eff: { rel: { goguryeo: 14, tang: -8 } }, lines: ['{ally} 사신단이 {cap}에 머물며 양국의 연합이 다져졌습니다.'] },
  { id: 'wa_envoy', cat: '외교', name: '{far}와 교류·원군 외교', desc: '{far} 왕실에 사신과 문물을 보냅니다.', cost: { gold: 6 }, hist: '역사', note: '653년 8월 {far}와 통호했다는 기록이 있습니다.', eff: { rel: { wa: 14 } }, lines: ['불상과 경전, 기술자가 왜로 건너갔고 {far} 조정은 호의로 답했습니다.'] },
  { id: 'marriage', cat: '외교', name: '혼인 동맹', desc: '(상대를 입력) 왕실 혼인으로 관계를 묶습니다.', cost: { gold: 8 }, hist: '가상', needs: 'rival', eff: { rel: { __t: 22 } }, lines: ['왕실 간 혼담이 오가 양국 관계가 한결 부드러워졌습니다.'] },
  { id: 'espionage', cat: '외교', name: '첩자·이간책', desc: '{rival}와 {great}의 결속을 흔드는 공작을 폅니다.', cost: { gold: 9 }, hist: '가상', eff: { world: { 'tang.commit': -9, 'silla.p': -3 } }, lines: ['첩자들이 {rival} 조정과 {great} 사신 사이에 불신의 씨앗을 뿌렸습니다.'], risk: { p: 0.3, text: '첩자가 발각되어 {rival}와 {great}의 의심을 샀습니다.', eff: { rel: { silla: -12, tang: -6 } } } },
  { id: 'trade_envoy', cat: '외교', name: '무역선 파견', desc: '서해 해로로 교역선을 보내 금을 벌어 옵니다.', cost: { food: 3 }, hist: '일반', eff: { fx: { gold: 12 }, rel: { tang: 3, wa: 3 } }, lines: ['교역선이 서해를 건너 비단과 은을 가득 싣고 돌아왔습니다.'] },


  /* ── 추가 명령 ── */
  { id: 'academy', cat: '내정', name: '학교·학문 장려', desc: '박사와 학사를 길러 문서 행정과 기록을 키웁니다.', cost: { gold: 6 }, hist: '일반', cd: 3, eff: { realm: { royal: 3, econ: 3, intel: 3 }, fx: { people: 1 } }, lines: ['학사들이 모여 글과 법도를 가르치기 시작했습니다.', '왕이 직접 책을 내려 학문을 장려했습니다.'] },
  { id: 'feast', cat: '내정', name: '연회와 사냥 대회', desc: '신료와 장수를 모아 잔치를 엽니다. 사기와 인심이 오르지만 재물이 듭니다.', cost: { gold: 6 }, hist: '일반', cd: 2, eff: { fx: { morale: 6, people: 1 }, realm: { royal: 2 } }, lines: ['가을 사냥터에서 왕과 신료가 어울려 술잔을 나눴습니다.'] },
  { id: 'iron', cat: '군사', name: '제철·무기 공방 확충', desc: '철 생산과 무기 공방을 늘립니다. (보병 +0.5천)', cost: { gold: 8 }, hist: '일반', eff: { realm: { train: 3, defense: 3, econ: 2 }, army: { baekje_bangun: 500 } }, lines: ['대장간 불길이 밤낮으로 타오르고 새 병장기가 군에 보급되었습니다.'] },
  { id: 'mercenary', cat: '군사', name: '이민족 용병 고용', desc: '변경의 기마 집단을 고용합니다. (기병 +1천)', cost: { gold: 10 }, hist: '일반', cd: 2, eff: { army: { baekje_horse: 1000 }, realm: { royal: -1 } }, lines: ['변경의 기마 집단이 금을 받고 군문에 들어왔습니다.'] },
  { id: 'hostage', cat: '외교', name: '인질·볼모 교환', desc: '(상대를 입력) 왕자나 종실을 서로 보내 관계를 묶습니다.', cost: { gold: 4 }, hist: '일반', needs: 'rival', eff: { rel: { __t: 14 } }, lines: ['종실 한 사람이 볼모로 건너가고 양국 사이에 약속이 맺어졌습니다.'], risk: { p: 0.2, text: '볼모가 낯선 땅에서 병을 얻어 두 나라 사이에 말이 많아졌습니다.', eff: { rel: { silla: -4 } } } },
  { id: 'assassinate', cat: '특수', name: '적국 요인 암살 공작', desc: '적국의 장수나 대신을 암살하려 합니다. 성공하면 적이 흔들리고, 들키면 외교 재앙입니다. (가상)', cost: { gold: 10 }, hist: '가상', cd: 4, eff: {}, fn: function (g, S) { var ok = S.roll() < 0.3 + S.realm.intel / 250; return ok ? { world: { 'silla.p': -7, 'silla.hostility': -4 }, realm: { intel: 3 }, text: '자객이 돌아오지 않았지만 적국의 유력자가 변사했다는 소식이 들려왔습니다.' } : { rel: { silla: -22, tang: -6 }, world: { 'silla.hostility': 12 }, fx: { gold: -4 }, text: '자객이 붙잡혀 배후가 드러났습니다. 적의가 크게 높아졌습니다.' }; }, lines: ['밀명을 받은 자객이 국경을 넘었습니다.'] },
  { id: 'relocate', cat: '특수', name: '천도 (도읍 이전)', desc: '도읍을 방어에 유리하거나 번영할 곳으로 옮깁니다. 큰 비용과 반발이 따릅니다. (행동력 3)', cost: { gold: 25, food: 10 }, ap: 3, cd: 99, hist: '가상', note: '실제로 백제는 475년 웅진, 538년 사비로 천도했고 신라·고구려도 도읍을 옮긴 사례가 있습니다.', eff: { fx: { people: -6 }, realm: { royal: 5, defense: 8, econ: -3 }, flags: { relocated: true } }, lines: ['도읍이 옮겨지자 대규모 이주 행렬이 길을 메웠고, 새 도성에서 성곽 공사가 시작되었습니다.'] },
  /* ── 특수 (과감한 행동) ── */
  { id: 'raid_tang', cat: '특수', only: ['uija'], name: '서해 건너 {great} 연안 습격', desc: '수군으로 산둥 연안을 습격합니다. 성공하면 큰 이득, 실패하면 외교 재앙. (가상)', cost: { gold: 8, food: 5 }, hist: '가상', note: '백제의 요서 경략설은 학설일 뿐 7세기에는 사료 근거가 없습니다.', from: 645, req: function (s) { return s.realm.navy >= 20; }, eff: { world: { 'tang.commit': 24 }, rel: { tang: -30 } }, lines: ['백제 수군이 산둥 연안 포구를 습격하고 곡식과 포로를 싣고 돌아왔습니다. 장안은 분노했습니다.'], fn: function (g, S) { var win = S.roll() < 0.35 + S.realm.navy / 200; return win ? { fx: { gold: 25, food: 15, morale: 8 } } : { fx: { morale: -10, gold: -10 }, army: { baekje_navy: -300 }, text: '습격은 실패했고 전선 몇 척이 돌아오지 못했습니다. 그러나 {great}의 분노는 이미 일어났습니다.' }; } },
  { id: 'guard', cat: '군사', name: '왕실 직속 군 개편 (친위대)', desc: '왕 직속 호위·친위 부대를 늘려 왕권을 굳힙니다.', cost: { gold: 8 }, hist: '일반', eff: { army: { baekje_guard: 500 }, realm: { royal: 6 } }, lines: ['왕궁 호위가 늘어나 조정의 눈치가 바뀌었습니다.'] },
  { id: 'free', cat: '특수', name: '교지(자유 입력)', desc: '아래 입력칸에 하고 싶은 일을 문장으로 적으세요. 참모가 해석합니다.', cost: {}, hist: '가상', needs: 'text', eff: {}, hidden: true }
];

SG.data.laws = [
  { id: 'yulyeong', name: '율령 반포', desc: '형벌과 행정의 기준을 문서로 세웁니다.', cost: { gold: 10 }, from: 641, eff: { realm: { royal: 8, econ: 3 }, fx: { people: 3 } }, hist: '일반', yearly: null },
  { id: 'gunyeok', name: '군역 확대 (병역 의무 연장)', desc: '병역 연한을 늘립니다. 해마다 농민병이 늘지만 민심이 닳습니다.', cost: {}, eff: { fx: { people: -4 } }, hist: '가상', yearly: { army: { baekje_levy: 600 }, fx: { people: -1 } } },
  { id: 'pyeongchang', name: '곡물 비축 제도 (상평창식)', desc: '풍년에 곡식을 사들여 흉년에 풉니다. 해마다 군량이 쌓입니다.', cost: { gold: 6 }, eff: {}, hist: '가상', yearly: { fx: { food: 6 } }, shield: 'famine' },
  { id: 'tradelaw', name: '해상 교역 장려령', desc: '서해 교역선에 세금을 낮춰 줍니다. 금과 대외 관계가 해마다 오릅니다.', cost: { gold: 5 }, eff: {}, hist: '가상', yearly: { fx: { gold: 5 }, rel: { tang: 1, wa: 1 } } },
  { id: 'noble_audit', name: '귀족 식읍 정리', desc: '귀족의 식읍을 줄입니다. 왕권은 크게 서지만 귀족의 반감이 쌓입니다.', cost: {}, eff: { realm: { royal: 12 }, flags: { noble_grudge: true } }, hist: '가상' },
  { id: 'reclaim', name: '개간 장려령', desc: '개간지의 조세를 감면해 농업 생산을 해마다 늘립니다.', cost: { gold: 4 }, eff: {}, hist: '가상', yearly: { realm: { econ: 2 } } },
  { id: 'inspect', name: '관리 감찰제', desc: '지방관의 비리를 감찰합니다. 부패·반란 사건이 줄어듭니다.', cost: { gold: 5 }, eff: { realm: { royal: 5 } }, hist: '가상', shield: 'corrupt' },
  { id: 'martial', name: '군율 강화', desc: '군기를 엄하게 합니다. 훈련도가 오르지만 병사들은 투덜댑니다.', cost: {}, eff: { realm: { train: 10 }, fx: { people: -2, morale: -2 } }, hist: '가상', yearly: { realm: { train: 2 } } },
  { id: 'taxcut', name: '조세 감면령', desc: '세금을 줄여 민심을 얻습니다. 해마다 금 수입이 줄어듭니다.', cost: {}, eff: { fx: { people: 9 } }, hist: '일반', yearly: { fx: { gold: -3, people: 1 } } },
  { id: 'buddhism', name: '불교 진흥령', desc: '불교를 국가 차원에서 후원합니다. 민심과 외교({far})에 도움이 됩니다.', cost: { gold: 6 }, eff: { fx: { people: 4 }, rel: { wa: 6 } }, hist: '일반', yearly: { fx: { people: 1 } }, flags: { buddhist: true } }
];

/* {rival} 정벌 대상 — place는 map 마커 id, garrison은 수비 병력(게임 값), terrain은 방어 지형 보정 */
SG.data.warTargets = [
  { id: 'w_west', name: '{rival} 서쪽 변경 (미후성 등)', place: 'daeyaseong', garrison: 5000, terrain: 1.25, gold: 12, people: 2, power: -4, hist: '642년 7월 {rival} 미후성 등 40여 성 항복' },
  { id: 'w_daeya', name: '대야성(합천)', place: 'daeyaseong', garrison: 6000, terrain: 1.5, gold: 16, people: 3, power: -6, hist: '642년 8월 윤충이 함락. 성주 김품석 부부 사망(김춘추의 사위·딸)', flag: 'took_daeya' },
  { id: 'w_danghang', name: '당항성({rival}의 서해 출구)', place: 'danghangseong', garrison: 4000, terrain: 1.45, gold: 10, people: 2, power: -5, hist: '643년 {ally}와 연합해 공격', flag: 'cut_sea' },
  { id: 'w_gwansan', name: '관산성 일대(옥천)', place: 'gwansanseong', garrison: 6500, terrain: 1.5, gold: 14, people: 3, power: -5, hist: '554년 성왕이 전사한 격전지로 전해지는 곳' },
  { id: 'w_samnyeon', name: '삼년산성(보은)', place: 'samnyeon', garrison: 9000, terrain: 1.9, gold: 20, people: 4, power: -8, hist: '{rival}의 북서 거점 산성' },
  { id: 'w_north', name: '{rival} 북쪽 변경(30여 성)', place: 'chiljungseong', garrison: 7000, terrain: 1.3, gold: 18, people: 3, power: -7, hist: '655년 8월 {ally}·말갈과 함께 30여 성을 공격' }
];
