/* English — UI, combat and engine text (numbers appear as {n}) */
(function () {
  var I = SG.i18n, T = {
    /* title & HUD */
    '왕을 추첨하세요': 'Draw your king', '운명의 추첨': 'Draw Your Fate', '처음으로': 'Back to title', '병력·성 배치 표시 켜기/끄기': 'Toggle troop & fortress markers', '전체 보기': 'Show whole map',
    '고구려·백제·신라의 왕이 되어, 사료 속 분기점마다 결단하십시오.': 'Become a king of Goguryeo, Baekje or Silla and decide at every turning point in the records.',
    '당신의 선택이 역사를 바꿀 수 있습니다.': 'Your choices can change history.',
    '위의 왕 이름을 누르면 12명 중 원하는 왕으로 바로 시작할 수 있습니다. 추첨은 모든 왕이 한 번씩 나올 때까지 같은 왕이 다시 나오지 않습니다.': 'Click a king above to start as any of the 12 right away. The draw will not repeat a king until every king has come up once.',
    '클릭하면 이 왕으로 바로 시작': 'Click to start as this king', '시나리오 준비 중': 'Scenario in preparation',
    '처음 화면으로 돌아갈까요? 진행 상황은 사라집니다.': 'Return to the title screen? Your progress will be lost.',
    '💬 의견 보내기 · 버그 제보': '💬 Send feedback · Report a bug', '🗺 지도 보기': '🗺 View map', '📜 정무 열기': '📜 Open governance',
    '지형: Natural Earth · AWS Terrain Tiles(SRTM 등) · 해안선은 현대 기준': 'Terrain: Natural Earth · AWS Terrain Tiles (SRTM etc.) · Coastlines are modern',
    '병력': 'Troops', '군량': 'Provisions', '금': 'Gold', '민심': 'Public Favor', '사기': 'Morale', '천': 'k', '만': '×10k', '천석': 'k bushels', '군제 · 병력': 'Army · Troops', '약 {n}천': '~{n}k', '{n}천': '{n}k', '약 {n}만': '~{n}0k', '{n}만': '{n}0k', '{n}명 ▾': '{n} men ▾',
    '왕권': 'Royal Authority', '훈련': 'Training', '방비': 'Defense', '산업': 'Economy', '첩보': 'Intelligence', '수군력': 'Naval Power', '수군': 'Navy',
    /* turn screen */
    '한 해를 보낸다 ▶': 'End the Year ▶', '🤖 맡기기': '🤖 Auto-play', '⚖ 균형 있게': '⚖ Balanced', '🎲 무작위로': '🎲 Random', '사건이 생길 때까지 계속': 'Continue until an event occurs',
    '내정': 'Domestic', '군사': 'Military', '외교': 'Diplomacy', '특수': 'Special', '참모의 말': 'Advisor says', '최근 기록': 'Recent log', '시행 중인 법령': 'Laws in force', '계속': 'Continue', '취소': 'Cancel', '목록으로': 'Back to list',
    '— 행동력 부족': '— Not enough action points', '— 자원 부족': '— Not enough resources', '— 조건 미충족': '— Conditions not met', '— 재사용까지 {n}년': '— Available again in {n} yr', '비용 없음': 'No cost',
    '현재 관계 {n}': 'Current relation {n}', '(국력 {n} · 적의 {n})': '(Power {n} · Hostility {n})', '(국력 {n} · 개입 {n})': '(Power {n} · Involvement {n})',
    '{n}년': 'Year {n}', '{n}년 결산': 'Year {n} Summary', '— 수입 금 +{n} 군량 +{n}(군 유지비 포함).': '— Income: gold +{n} provisions +{n} (army upkeep included).',
    '📍 사건 위치 다시 보기': '📍 Show event location again', '실제 역사 메모': 'Historical Note', '출처': 'Source',
    '큰 급보는 없습니다. 법령을 정비하거나 군을 키우기 좋은 때입니다.': 'No major alarms. A good time to build up laws or the army.',
    '나라가 안정되어 있습니다. 힘을 키울 때입니다.': 'The realm is stable. Time to build strength.',
    '민심이 흉흉합니다. 대사면, 조세 감면, 진휼 중 하나는 필요합니다.': 'Public sentiment is uneasy. One of amnesty, tax relief or famine relief is needed.',
    '금고가 바닥입니다. 교역이나 호구 조사로 재정을 메워야 합니다.': 'The treasury is empty. Fill it through trade or a census.',
    '군의 훈련이 느슨해졌습니다. 해마다 훈련도가 조금씩 닳습니다.': 'Army training has slackened. Training erodes a little each year.',
    '귀족들이 왕권을 얕보는 기색입니다. 회유하든 눌러 두든 손을 쓰셔야 합니다.': 'The nobles seem to look down on royal authority. Either win them over or press them down.',
    '"하고 싶은 일을 문장으로 적으시면 소신이 해석해 시행하겠습니다."': '"Write what you wish to do in a sentence, and I shall interpret and carry it out."',
    '하고 싶은 일을 문장으로 (예: 신라를 공격한다 / 군사를 훈련시켜라 / 율령을 반포하라)': 'Write what you want to do (e.g. attack Silla / drill the army / promulgate the legal code)',
    '교지': 'Decree', '뜻밖의 일:': 'Unexpected:', '천하의 움직임': 'Movements of the Realm', '(실제 역사와 다를 수 있습니다)': '(May differ from actual history)',
    '역사가 달라졌습니다': 'History has changed', '내가 만든 역사': 'History I Made', '역사 일치도 {n}%': 'Historical match {n}%', '— 선택이 실제 역사와 얼마나 같았는지의 지표입니다.': '— An indicator of how closely your choices matched real history.', '다시 시작하기 (왕 추첨으로)': 'Start again (back to the king draw)',
    '재위의 끝으로': 'To the end of the reign', '재위의 끝': 'End of the Reign', '즉위 초 — {n}년': 'Early Reign — Year {n}', '말년의 조짐 — {n}년': 'Signs of the Late Reign — Year {n}',
    '▶ 이어하기': '▶ Continue', '💾 저장된 판을 이어서 합니다.': '💾 Resuming your saved game.',
    '재위 중 반포한 법령은 {n}건입니다.': 'Laws promulgated during the reign: {n}.',
    '군은 병력 {n}천, 훈련도 {n} 수준이었고, 재위 중 {n}번 출병해 {n}번 성을 얻었습니다.': 'The army stood at {n}k troops with training {n}; across the reign it marched {n} times and took fortresses {n} times.',
    '군은 병력 {n}천, 훈련도 {n} 수준이었고, 재위 중 {n}번 출병해 {n}번 성을 얻었습니다. (점령지 {n}곳)': 'The army stood at {n}k troops with training {n}; across the reign it marched {n} times and took fortresses {n} times. ({n} holdings)',
    /* relation / threat lines */
    '관계 우호': 'Relations friendly', '관계 무난': 'Relations neutral', '관계 험악': 'Relations hostile',
    '잠잠': 'quiet', '경계': 'wary', '위협': 'threatening', '관망': 'watching', '관심': 'interested', '개입 임박': 'intervention imminent',
    '점령지 {n}곳': 'Holdings: {n}', '(재정 {n})': '(Finance {n})', '(왕권 {n})': '(Royal authority {n})', '(민심 {n})': '(Public favor {n})', '(군의 훈련 {n})': '(Army training {n})',
    /* battle */
    '⚔ 교전 시작': '⚔ Begin Battle', '교전 시작': 'Begin Battle', '패주': 'Rout', '승부를 가른 요인': 'Decisive Factors', '결과 확인': 'See Result', '전운': 'Fortunes of War', '전력 비교': 'Strength Comparison', '병종 상성': 'Unit Matchups', '실전 경험': 'Battle Experience', '계절': 'Season', '· 계절': '· Season', '평지': 'Plains',
    '· 아군 훈련': '· Our training', '· 적 훈련': '· Enemy training', '· 적 훈련 ?': '· Enemy training ?', '(첩보가 낮아 부정확)': '(inaccurate due to low intelligence)',
    '※ 승산은 어림입니다. 실제 전투에는 날씨·우연 같은': '※ The odds are approximate. In real battle, factors like weather and chance',
    '이 끼어들어 유리해 보여도 질 수 있습니다.': 'intervene, so you can lose even when it looks favorable.',
    '① 작전을 고르고 ② 아래': '① Choose a tactic, ② then press',
    '을 누르세요. 지금 선택:': '. Current choice:',
    '균형 진형': 'Balanced Formation', '방어 진형': 'Defensive Formation', '돌격': 'Charge', '매복·기습': 'Ambush & Surprise', '궁병 소모전': 'Archery Attrition', '공성·포위': 'Siege & Encirclement', '화공': 'Fire Attack', '정면 충돌': 'frontal clash', '원거리 교전': 'ranged exchange',
    '무난. 약점도 강점도 없다.': 'Plain. No weakness, no strength.',
    '방패를 세워 버틴다. 돌격에 강하고 측면 우회·궁병 사격에 약하다.': 'Hold with shields. Strong against charges; weak against flanking and archery.',
    '기세로 밀어붙인다. 궁병 위주 적에 강하나 방어 진형에 막히면 무너진다.': 'Press with momentum. Strong against archer-heavy foes, but crumbles if stopped by a defensive formation.',
    '활·쇠뇌로 서서히 깎는다. 정지한 적에 강하고 돌격에 약하다. 궁·노병이 있어야 한다.': 'Whittle down with bows and crossbows. Strong against stationary foes, weak against charges. Needs archers/crossbowmen.',
    '첫 합에 큰 타격. 험지에서 더 강하고, 간파되면 소용없다.': 'A heavy blow in the first clash. Stronger on rough terrain; useless if seen through.',
    '공성기를 앞세워 성곽을 압박한다. 성이 아니면 효과가 없다.': 'Press the walls with siege engines. No effect unless it is a fortress.',
    '건조한 가을에 크게 통하고 비 오는 여름엔 꺼진다. 징집병 진영에 특히 강하다.': 'Works greatly in dry autumn, fizzles in rainy summer. Especially strong against conscript camps.',
    '{n}합 이후 기병이 옆구리를 친다. 방어 진형 적에 강하다. 기병이 있어야 한다.': 'After round {n}, cavalry strike the flank. Strong against defensive formations. Needs cavalry.',
    '({n}합에 투입)': '(joins in round {n})', '(승산 예측에는 반영되지 않는 변수)': '(a variable not reflected in the odds forecast)',
    '전투를 치른 군의 훈련도가 +{n} 올랐습니다.': 'The battle-tested army\'s training rose by +{n}.',
    '아군의 사기가 꺾여 진형이 무너졌습니다. 훈련·지휘관·병력 잔존율이 버티는 힘을 좌우합니다.': 'Our morale broke and the formation collapsed. Training, commanders and remaining strength decide how long you hold.',
    '적군의 사기가 꺾여 진형이 무너졌습니다. 훈련·지휘관·병력 잔존율이 버티는 힘을 좌우합니다.': 'The enemy\'s morale broke and its formation collapsed. Training, commanders and remaining strength decide how long a force holds.',
    '특별한 변수는 없었습니다.': 'There were no special variables.', '적을 물리쳤습니다.': 'The enemy was driven off.',
    '운이 따르지 않았습니다. 돌발 상황이 겹쳐 예상보다 고전했습니다.': 'Luck was against us. Unexpected events piled up and we struggled more than expected.',
    '하늘이 도왔습니다. 날씨와 우연이 아군 편이었습니다.': 'Heaven helped. Weather and chance favored us.',
    '왕이 직접 군을 이끕니다. 패주하면 왕권이 흔들립니다.': 'The king leads the army himself. If routed, royal authority will be shaken.',
    '친정 실패': 'Royal Campaign Failed',
    '여름 — 장마로 활줄·진창에 불리': 'Summer — monsoon: bowstrings and mud hinder', '가을 — 건조해 화공이 잘 번집니다': 'Autumn — dry, so fire spreads easily', '여름': 'Summer', '봄': 'Spring', '가을': 'Autumn', '겨울': 'Winter',
    '(공성할 성곽이 아닙니다.)': '(Not a fortress that can be besieged.)', '(좁은 지형에서는 우회할 공간이 없습니다.)': '(On narrow terrain there is no room to flank.)', '(기병이 부족합니다.)': '(Not enough cavalry.)', '(궁·노병이 부족합니다.)': '(Not enough archers/crossbowmen.)',
    '성에 의지해 막는다': 'Defend from the fortress', '요충에 매복한다': 'Ambush at a chokepoint', '야전에서 결전한다': 'Fight a decisive field battle',
    '방비가 높을수록 유리. 피해를 줄이는 정석.': 'The higher your defense, the better. The standard way to reduce losses.',
    '사기가 높고 훈련도가 높으면 큰 승리를 노릴 수 있다.': 'With high morale and training you can aim for a big victory.',
    '첩보가 {n} 이상이어야 적의 길목을 안다. 첫 합을 크게 친다.': 'Needs intelligence {n}+ to know the enemy\'s route. Strikes hard in the first clash.',
    '싸우지 않고 넘긴다. 실패하면 처참하다.': 'Avoid fighting. A disaster if it fails.', '화친 사신을 보내 달랜다 (금 {n})': 'Send a peace envoy to placate them ({n} gold)', '재물을 주어 돌려보낸다 (금 {n})': 'Pay them to turn back ({n} gold)',
    '· 승산 ●●● 유리': '· Odds ●●● favorable', '· 승산 ●●○ 박빙(우세)': '· Odds ●●○ close (slight edge)', '· 승산 ●○○ 불리': '· Odds ●○○ unfavorable', '· 승산 ○○○ 매우 불리': '· Odds ○○○ very unfavorable',
    '화친의 사신을 보냈습니다.': 'A peace envoy was sent.',
    '변경 성들이 약탈당하고 백성이 끌려갔습니다.': 'Border fortresses were plundered and people carried off.', '피해가 컸으나 침공은 막아냈습니다.': 'Losses were heavy, but the invasion was repelled.',
    '급보가 이른 곳은': 'The alarm arrived from', '방면입니다.': 'sector.',
    /* war / council */
    '공격할 성': 'Fortress to attack', '을 지도에서 누르세요': ' — click it on the map', '상대를 고르세요.': 'Choose a target.',
    '(붉게 빛나는 {n}곳 — 어느 나라 성이든 공격할 수 있습니다)': '({n} red-glowing places — you can attack any nation\'s fortress)',
    '도성 방비': 'Capital Defense', '후방·예비': 'Rear & Reserve', '배치 확정': 'Confirm Deployment',
    '수도와 전선에 주둔시킬 병력 비율입니다. 합이 {n}%를 넘을 수 없고, 남는 분은 후방·예비군입니다.': 'Share of troops stationed at the capital and the front. The total cannot exceed {n}%; the rest become rear/reserve forces.',
    '침공이나 방어전이 벌어진 방면에 병력이 많을수록 방어가 유리합니다.': 'The more troops in the sector of an invasion or defensive battle, the stronger the defense.',
    '· 야전 가능 병력 {n}명 기준. 수도 {n}% · 전선 합 {n}%가 기본 배치입니다.': '· Based on {n} field-ready troops. Default deployment: capital {n}% · front total {n}%.',
    '— 장수들을 불러 병력을 새로 나누어 배치했습니다.': '— The generals were summoned and the troops redeployed.',
    /* misc game */
    '민란 — 성난 백성에 쫓긴 왕': 'Revolt — A King Chased by an Angry People', '중흥 — 나라를 키운 왕': 'Revival — The King Who Grew the Realm',
    '곳간은 넉넉히 채워져 있었고 백성의 마음은 이미 떠나 있었습니다.': 'The storehouses were full, but the hearts of the people had already left.',
    '쌓인 원성이 끝내 폭발했습니다. 각지에서 일어난 민란을 막지 못하고 당신의 시대는 끝났습니다.': 'Accumulated grievances finally exploded. Unable to stop the revolts rising everywhere, your era came to an end.',
    '후세는 그를 칼과 병영의 군주로 기억했습니다.': 'Posterity remembered him as a king of the sword and the barracks.',
    '후세는 그를 사신의 길을 닦아 나라를 지키려 한 군주로 기억했습니다.': 'Posterity remembered him as a king who paved the road of envoys to protect his realm.',
    '후세는 그를 나라 살림과 백성을 먼저 챙긴 군주로 기억했습니다.': 'Posterity remembered him as a king who put the state\'s livelihood and the people first.',
    '왕권이 바닥에 떨어진 틈을 타 귀족과 장수들이 궁을 에워쌌습니다.': 'Taking advantage of royal authority hitting rock bottom, nobles and generals surrounded the palace.',
    '새 도읍에서 정무를 잇는다': 'Carry on governing from the new capital',
    '이(가) 당의 손에 넘어갔습니다. 지도에 반영됩니다.': ' has fallen to Tang. It is reflected on the map.', '을(를) 차지했습니다. 지도에 반영됩니다.': ' was captured. It is reflected on the map.',
    /* world / threat / cause */
    '🕯 이웃의 경계': '🕯 Neighbors Grow Wary', '이웃의 경계': 'Neighbors Grow Wary', '견제 연합 결성': 'Containment Coalition Formed', '견제 연합 해체': 'Containment Coalition Dissolved', '경계가 누그러졌습니다': 'The wariness has eased',
    '고구려군': 'Goguryeo army', '백제군': 'Baekje army', '신라군': 'Silla army', '고구려 군': 'Goguryeo army', '백제 군': 'Baekje army', '신라 군': 'Silla army',
    '예비·후방': 'Reserve & Rear', '점령한 성의 주민': 'Residents of the captured fortress', '원정군': 'Expeditionary army'
  };
  I.add('en', T);
  // 능력치·효과 칩: "왕권 +5" "고구려 관계 −3" "징발병(명) +3000"
  var SIGN = '([+\\-−]\\d[\\d,]*)';
  I.rule('en', new RegExp('^(왕권|훈련|방비|산업|첩보|수군력|금|군량|민심|사기) ' + SIGN + '$'), '$1 $2');
  I.rule('en', new RegExp('^(.+) (관계|국력|적의|개입) ' + SIGN + '$'), '$1 $2 $3');
  I.add('en', { '관계': 'Relations', '국력': 'Power', '적의': 'Hostility', '개입': 'Involvement' });
  I.rule('en', new RegExp('^(.+)\\(명\\) ' + SIGN + '$'), '$1 $2');
  I.rule('en', /^(\d+)년 · 정무 행동력 ([●○]+)$/, 'Year $1 · Action Points $2');
  I.rule('en', /^정무 행동력 ([●○]+)$/, 'Action Points $1');
  I.rule('en', /^관계 (우호|무난|험악) · (.+)$/, 'Relations $1 · $2');
  I.add('en', { '우호': 'friendly', '무난': 'neutral', '험악': 'hostile' });
  I.rule('en', /^\[(.+)\]$/, '[$1]');
  I.rule('en', /^금 (\d+)$/, 'Gold $1'); I.rule('en', /^군량 (\d+)$/, 'Provisions $1'); I.rule('en', /^행동력 (\d+)$/, 'AP $1'); I.rule('en', /^성공 (\d+)%$/, 'Success $1%');
  I.rule('en', /^▶ 이어하기 — (.+) (\d+)년$/, '▶ Continue — $1, Year $2');
  I.rule('en', /^(.+)\(으\)로 시작할까요\?$/, 'Start as $1?');
  I.rule('en', /^(.+) · (\d+)세기$/, '$1 · $2th c.');
  I.rule('en', /^(\d+)년 · 사건 · (.+)$/, 'Year $1 · Event · $2');
  I.rule('en', /^(\d+)년 · (.+) — (.+)$/, 'Year $1 · $2 — $3');
  I.rule('en', /^(\d+)년 · (.+)$/, 'Year $1 · $2');
  I.add('en', { '악재': 'Misfortune', '재난': 'Disaster', '사회': 'Society', '정치': 'Politics', '경제': 'Economy', '창작': 'Fictional', '침공': 'Invasion', '외교 ': 'Diplomacy' });
  I.rule('en', /^(.+)의 침공$/, '$1 Invasion'); I.rule('en', /^(.+)의 침공 — (승리|패배)$/, '$1 Invasion — $2');
  I.add('en', { '승리': 'Victory', '패배': 'Defeat' });
  I.rule('en', /^(.+) 정벌 \(전쟁\)$/, 'Campaign Against $1 (War)');
  I.rule('en', /^(.+)와의 관계 악화$/, 'Worsening Relations with $1'); I.rule('en', /^(.+)과의 관계 악화$/, 'Worsening Relations with $1');
  I.rule('en', /^(.+) — 통솔 (\d+) · 무용 (\d+) · (.+)$/, '$1 — Command $2 · Valor $3 · $4');
  I.add('en', { '고무': 'Inspire', '수성': 'Defense', '기동': 'Mobility', '기습': 'Surprise', '공성': 'Siege', '수전': 'Naval' });
  I.rule('en', /^제(\d+)합\((.+)\) — (.+)$/, 'Round $1 ($2) — $3');
  I.rule('en', /^전선 · (.+)$/, 'Front · $1');
  I.rule('en', /^⚔ 군사 회의 — (.+)$/, '⚔ War Council — $1');
})();
