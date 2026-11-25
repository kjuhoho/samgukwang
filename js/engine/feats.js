/* 업적·치적 시스템
 *  ① 재위 중 통계(전투·점령·극값·연승·평화 기간·주요 장면)를 s.feat 에 쌓는다. 저장 파일에 함께 들어가므로 이어하기에서도 이어진다.
 *  ② 업적은 DEFS 데이터로 정의한다(goals 가 여러 개면 단계가 오르는 업적). 해마다 판정해 새로 얻으면 알림을 띄우고,
 *     재위가 끝나면 평가(점수·등급·다섯 능력치)·이룬 일·업적·주요 장면을 끝 화면에 보여 주고 '기록'으로 남긴다.
 *  ③ 기록은 SG.account.saveRecord(rec) 가 있으면 그쪽으로(로그인하면 계정에, 아니면 이 기기에), 없으면 이 기기에만 저장한다.
 *  ④ 글은 모두 L3(ko, en, ja)로 지금 언어에 맞춰 고른다. */
(function () {
  var P = SG.Sandbox.prototype, G = SG.Game.prototype;
  var F = SG.feats = { VERSION: 1 };
  function $(s, r) { return (r || document).querySelector(s); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function L3(ko, en, ja) { var l = SG.i18n && SG.i18n.lang; return l === 'en' ? en : l === 'ja' ? ja : ko; }
  function T(a) { return Array.isArray(a) ? L3(a[0], a[1], a[2]) : a; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function num(n) { return Math.round(n).toLocaleString(); }
  function fill(t, n) { return String(t).replace(/\{n\}/g, num(n)); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function warn(e) { if (window.console) console.warn('feats', e); }
  function yr(y) { return L3(y + '년', String(y), y + '年'); }
  F.L3 = L3; F.esc = esc; F.num = num; F.yr = yr;

  /* ── 결말 도장 ── */
  var SEAL = {
    '霸': { n: ['패업', 'Hegemony', '覇業'], base: 40 }, '興': { n: ['중흥', 'Revival', '中興'], base: 34 },
    '守': { n: ['수성', 'Holding the Realm', '守成'], base: 26 }, '延': { n: ['연명', 'Reprieve', '延命'], base: 24 },
    '存': { n: ['존속', 'Survival', '存続'], base: 22 }, '衰': { n: ['쇠락', 'Decline', '衰退'], base: 14 },
    '讓': { n: ['퇴위', 'Abdication', '退位'], base: 12 }, '降': { n: ['항복', 'Surrender', '降伏'], base: 6 },
    '亂': { n: ['민란', 'Uprising', '民乱'], base: 4 }, '變': { n: ['정변', 'Coup', '政変'], base: 4 },
    '滅': { n: ['멸망', 'Fall of the Realm', '滅亡'], base: 2 }, '亡': { n: ['멸망', 'Fall of the Realm', '滅亡'], base: 2 },
    '終': { n: ['종언', 'The End', '終焉'], base: 6 }
  };
  var GOOD = '霸興守存延';
  F.SEAL = SEAL; F.sealName = function (s) { return SEAL[s] ? T(SEAL[s].n) : (s || ''); };

  /* ── 통계 보관소(s.feat) ── */
  function myCount(sb) { try { return sb.myPlaces().length; } catch (e) { return 0; } }
  function newRid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function S_(sb) {
    var s = sb.s, f = s.feat;
    if (!f) {
      var n = myCount(sb);
      f = s.feat = { v: 1, rid: newRid(), p0: n, pk: n, a0: Math.max(1, sb.armyTotal()), pa: 0, pg: 0, pf: 0, lowP: 999, hi: {}, b: 0, bw: 0, k: 0, l: 0, maxFoe: 0, upset: 0, rout: 0, str: 0, bstr: 0,
        peace: 0, bpeace: 0, wi: 0, relPk: 0, friends: 0, grain: 0, joint: 0, coal: 0, dest: 0, got: {}, q: [], mom: [] };
    }
    return f;
  }
  F.state = S_;
  // 장면 가중치: 끝 화면의 '주요 장면'으로 뽑을 만한 정도
  function weight(t) {
    t = String(t);
    if (/멸망|천도|도읍.*함락/.test(t)) return 5;
    if (/점령/.test(t)) return /, /.test(t) ? 2 : 4;
    if (/패배|퇴각|공략 실패/.test(t)) return 3;
    if (/승리|격퇴/.test(t)) return 4;
    if (/법령|동맹|맹약|공동 출병|원군|견제 연합|후계 시대|풍랑|전사|상실|봉쇄|부흥|국경 전초전|역사와 다른 길/.test(t)) return 3;
    if (/ — /.test(t)) return 1;
    return 0;
  }
  function note(sb, t) {
    var f = S_(sb), w = weight(t);
    if (/^공동 출병/.test(t)) f.joint++; else if (/견제 연합 해체/.test(t)) f.coal++;
    if (w <= 0) return;
    var m = f.mom, y = sb.s.year, tx = String(t).replace(/<[^>]*>/g, '');
    if (tx.length > 110) tx = tx.slice(0, 109) + '…';
    if (m.length && m[m.length - 1].t === tx && m[m.length - 1].y === y) return;
    m.push({ y: y, t: tx, w: w });
    if (m.length > 100) { var lo = 9, at = 0; for (var i = 0; i < m.length; i++) if (m[i].w < lo) { lo = m[i].w; at = i; } m.splice(at, 1); }
  }
  function sample(sb) {   // 극값(가장 높았던 때)을 갱신한다
    var s = sb.s, f = S_(sb), res = sb.g.state.res, rl = s.realm, hi = f.hi;
    f.pk = Math.max(f.pk, myCount(sb)); f.pa = Math.max(f.pa, sb.armyTotal()); f.pg = Math.max(f.pg, res.gold || 0); f.pf = Math.max(f.pf, res.food || 0);
    f.lowP = Math.min(f.lowP, res.people);
    ['royal', 'train', 'defense', 'econ', 'intel', 'navy'].forEach(function (k) { hi[k] = Math.max(hi[k] || 0, rl[k] || 0); });
    hi.people = Math.max(hi.people || 0, res.people || 0);
    var best = 0, fr = 0;
    ['silla', 'goguryeo', 'tang', 'wa'].forEach(function (k) { var v = s.rel[k]; if (v != null) { if (v > best) best = v; if (v >= 65) fr++; } });
    f.relPk = Math.max(f.relPk, best); f.friends = Math.max(f.friends, fr);
  }
  function yearTick(sb) {   // 해를 넘길 때: 싸움 없이 보낸 해가 몇 해째인가
    var st = sb.s.stats, f = S_(sb), wi = (st.wars || 0) + (st.invaded || 0);
    if (wi === f.wi) f.peace++; else f.peace = 0;
    f.wi = wi; f.bpeace = Math.max(f.bpeace, f.peace);
  }
  function onBattle(g, r) {
    var sb = g.sb; if (!sb || !sb.s || !r || !(r.aStart > 0)) return;
    if (r.a && r.a.side && sb.side && r.a.side !== sb.side) return;   // 우리 군이 a 쪽인 싸움만
    var f = S_(sb), win = r.winner === 'a', kill = Math.max(0, (r.bStart || 0) - (r.bEnd || 0)), lost = Math.max(0, r.aStart - r.aEnd);
    f.b++; f.k += kill; f.l += lost;
    if (win) {
      f.bw++; f.str++; if (f.str > f.bstr) f.bstr = f.str;
      if (r.bStart > f.maxFoe) f.maxFoe = r.bStart;
      if (r.aStart < r.bStart * 0.75) f.upset++;
      if (r.bStart >= 6000 && lost * 3 <= kill) f.rout++;
    } else f.str = 0;
  }

  /* ── 업적 정의 ──
   *  goals: 단계별 목표값(하나면 단일 업적) · val(c): 현재 값 · n: 이름(단계별 또는 하나) · d: 설명틀({n}=목표/현재값)
   *  fin: 재위가 끝나야 판정 · secret: 얻기 전에는 이름을 감춤 · tier: 단일 업적의 등급(없으면 단계 순서대로 동·은·금) */
  var DEFS = [
    // ── 武 전쟁 ──
    { id: 'conq', cat: 'war', icon: '🏯', goals: [3, 7, 12], val: function (c) { return c.capt; },
      n: [['변경 개척', 'Frontier Pioneer', '辺境開拓'], ['영토 확장', 'Territorial Growth', '領土拡張'], ['천하 경략', 'Conqueror of Lands', '天下経略']],
      d: ['성 {n}곳 점령', 'Capture {n} fortresses', '城{n}か所を攻略'] },
    { id: 'win', cat: 'war', icon: '⚔', goals: [3, 8, 15], val: function (c) { return c.bw; },
      n: [['첫 승전보', 'First Victories', '初勝利'], ['백전노장', 'Battle-Hardened', '百戦錬磨'], ['상승의 군왕', 'The Ever-Victorious', '常勝の君主']],
      d: ['전투에서 {n}번 승리', 'Win {n} battles', '戦闘で{n}勝'] },
    { id: 'wall', cat: 'war', icon: '🛡', goals: [2, 5, 10], val: function (c) { return c.def; },
      n: [['변경의 방패', 'Shield of the Frontier', '辺境の盾'], ['철벽 수비', 'Iron Defense', '鉄壁の守り'], ['난공불락', 'Impregnable', '難攻不落']],
      d: ['침공·결전 {n}번 막아냄', 'Hold off {n} invasions or decisive battles', '侵攻・決戦を{n}度しのぐ'] },
    { id: 'streak', cat: 'war', icon: '🔥', goals: [4, 7], val: function (c) { return c.bstr; },
      n: [['연전연승', 'Winning Streak', '連戦連勝'], ['파죽지세', 'Unstoppable', '破竹の勢い']],
      d: ['{n}연승', '{n} victories in a row', '{n}連勝'] },
    { id: 'kills', cat: 'war', icon: '🗡', goals: [15000, 50000, 120000], val: function (c) { return c.f.k; },
      n: [['적을 꺾다', 'Breaker of Foes', '敵を砕く'], ['수만의 적', 'Tens of Thousands Slain', '数万の敵'], ['천하의 두려움', 'Terror of the Realm', '天下の恐怖']],
      d: ['적병 {n}명을 쓰러뜨림', 'Defeat {n} enemy troops', '敵兵{n}名を討つ'] },
    { id: 'army', cat: 'war', icon: '🪖', goals: [130, 170, 220], val: function (c) { return Math.round(c.f.pa / Math.max(1, c.f.a0) * 100); },
      n: [['군세를 불리다', 'Growing Host', '軍勢を増やす'], ['대군을 모으다', 'A Great Host', '大軍を集める'], ['천하의 대군', 'Host of the Realm', '天下の大軍']],
      d: ['병력을 처음의 {n}%까지 늘림', 'Raise your army to {n}% of its starting size', '兵力を当初の{n}%まで増強'] },
    { id: 'rout', cat: 'war', icon: '💥', goals: [1], tier: 'silver', val: function (c) { return c.f.rout; },
      n: ['대파(大破)', 'Crushing Blow', '大破'], d: ['큰 적군을 아군 피해 3분의 1 이하로 격파', 'Crush a large army losing under a third as many men', '大軍を味方の損害三分の一以下で撃破'] },
    { id: 'upset', cat: 'war', icon: '🐉', goals: [1], tier: 'silver', val: function (c) { return c.f.upset; },
      n: ['소수로 대군을', 'Few Against Many', '寡兵で大軍を'], d: ['더 큰 적군을 맞아 승리', 'Defeat an army larger than your own', '自軍より大きな敵軍に勝つ'] },
    { id: 'unbeaten', cat: 'war', icon: '🏅', goals: [5], tier: 'gold', val: function (c) { return c.f.b >= 5 && c.f.b === c.f.bw ? c.f.b : 0; },
      n: ['무패의 군왕', 'Undefeated', '無敗の君主'], d: ['전투 {n}번 이상을 치르고 한 번도 지지 않음', 'Fight {n}+ battles without a single defeat', '{n}戦以上を一度も負けずに戦う'] },
    { id: 'fall', cat: 'war', icon: '👑', goals: [1], tier: 'gold', val: function (c) { return c.f.dest; },
      n: ['나라를 무너뜨리다', 'Toppler of Kingdoms', '国を滅ぼす'], d: ['다른 나라의 도읍을 함락시켜 멸망시킴', 'Bring down another kingdom by taking its capital', '他国の都を落として滅ぼす'] },
    // ── 政 내정 ──
    { id: 'law', cat: 'gov', icon: '📜', goals: [2, 4, 7], val: function (c) { return c.laws; },
      n: [['법을 세우다', 'Lawgiver', '法を興す'], ['율령의 군주', 'Sovereign of Statutes', '律令の君主'], ['나라의 틀을 짜다', 'Architect of the State', '国の枠組み']],
      d: ['법령 {n}개 반포', 'Enact {n} laws', '法令{n}件を公布'] },
    { id: 'econ', cat: 'gov', icon: '🌾', goals: [70, 85], val: function (c) { return c.f.hi.econ || 0; },
      n: [['풍요의 나라', 'Land of Plenty', '豊穣の国'], ['천부의 땅', 'Heaven’s Granary', '天府の地']],
      d: ['산업 수치 {n} 이상', 'Raise industry to {n}+', '産業{n}以上'] },
    { id: 'train', cat: 'gov', icon: '🎯', goals: [100], tier: 'silver', val: function (c) { return c.f.hi.train || 0; },
      n: ['정예의 군', 'Elite Army', '精鋭の軍'], d: ['훈련 수치 {n} 이상', 'Raise training to {n}+', '訓練{n}以上'] },
    { id: 'defense', cat: 'gov', icon: '🧱', goals: [80], tier: 'silver', val: function (c) { return c.f.hi.defense || 0; },
      n: ['금성탕지', 'Walls of Iron', '金城湯池'], d: ['방비 수치 {n} 이상', 'Raise defense to {n}+', '防備{n}以上'] },
    { id: 'intel', cat: 'gov', icon: '👁', goals: [120], tier: 'silver', val: function (c) { return c.f.hi.intel || 0; },
      n: ['천리안', 'Eyes Everywhere', '千里眼'], d: ['첩보 수치 {n} 이상', 'Raise intelligence to {n}+', '諜報{n}以上'] },
    { id: 'navy', cat: 'gov', icon: '⚓', goals: [85], tier: 'silver', val: function (c) { return c.f.hi.navy || 0; },
      n: ['바다의 주인', 'Lord of the Seas', '海の主'], d: ['수군력 {n} 이상', 'Raise naval power to {n}+', '水軍力{n}以上'] },
    { id: 'royal', cat: 'gov', icon: '🏛', goals: [90], tier: 'silver', val: function (c) { return c.f.hi.royal || 0; },
      n: ['왕권 확립', 'Absolute Authority', '王権の確立'], d: ['왕권 {n} 이상', 'Raise royal authority to {n}+', '王権{n}以上'] },
    { id: 'people', cat: 'gov', icon: '🙏', goals: [80], tier: 'silver', val: function (c) { return c.f.hi.people || 0; },
      n: ['백성이 우러르다', 'Beloved by the People', '民に慕われる'], d: ['민심 {n} 이상', 'Raise public support to {n}+', '民心{n}以上'] },
    { id: 'rich', cat: 'gov', icon: '💰', goals: [100], tier: 'bronze', val: function (c) { return Math.min(c.f.pg, c.f.pf); },
      n: ['곳간이 넘치다', 'Overflowing Stores', '蔵に溢れる'], d: ['금과 군량이 모두 {n} 이상 쌓인 적이 있음', 'Hold {n}+ of both gold and grain', '金と軍糧が共に{n}以上たまる'] },
    { id: 'grain', cat: 'gov', icon: '🛒', goals: [3], tier: 'bronze', val: function (c) { return c.f.grain; },
      n: ['군량 상인', 'Grain Trader', '軍糧商人'], d: ['시장에서 군량을 {n}번 사들임', 'Buy grain at the market {n} times', '市場で軍糧を{n}回購入'] },
    { id: 'events', cat: 'gov', icon: '🗂', goals: [18, 40], val: function (c) { return c.ev; },
      n: [['만기친람', 'Hands-On Ruler', '万機親裁'], ['일만 가지 일', 'Ten Thousand Matters', '万事を捌く']],
      d: ['사건 {n}건 처리', 'Handle {n} events', '事件{n}件を処理'] },
    { id: 'free', cat: 'gov', icon: '🖋', goals: [5, 15], val: function (c) { return c.free; },
      n: [['교지를 내리다', 'Royal Edicts', '教旨を下す'], ['붓끝의 군주', 'Sovereign of the Brush', '筆の君主']],
      d: ['자유 교지 {n}번', 'Issue {n} free-form edicts', '自由教旨{n}回'] },
    // ── 交 외교 ──
    { id: 'friend', cat: 'dip', icon: '🤝', goals: [85], tier: 'silver', val: function (c) { return c.f.relPk; },
      n: ['깊은 우호', 'Deep Friendship', '深い友好'], d: ['어느 나라와 관계 {n} 이상', 'Reach {n}+ relations with a state', 'ある国と関係{n}以上'] },
    { id: 'allies', cat: 'dip', icon: '🕊', goals: [3], tier: 'gold', val: function (c) { return c.f.friends; },
      n: ['사해의 벗', 'Friend to All', '四海の友'], d: ['세 나라와 동시에 우호(65 이상)', 'Hold 65+ relations with three states at once', '三国と同時に友好(65以上)'] },
    { id: 'peace', cat: 'dip', icon: '🌸', goals: [6, 12], val: function (c) { return c.f.bpeace; },
      n: [['잠시의 평화', 'A Quiet Spell', 'しばしの平和'], ['태평성대', 'An Age of Peace', '太平の世']],
      d: ['싸움 없이 {n}년 연속', '{n} years in a row without war', '戦なき{n}年連続'] },
    { id: 'joint', cat: 'dip', icon: '🚩', goals: [1], tier: 'bronze', val: function (c) { return c.f.joint; },
      n: ['손잡고 출병', 'Joint Campaign', '共に出兵'], d: ['동맹과 공동 출병', 'Mount a joint campaign with an ally', '同盟と共同出兵'] },
    { id: 'coal', cat: 'dip', icon: '⛓', goals: [1], tier: 'silver', val: function (c) { return c.f.coal; },
      n: ['포위망을 깨다', 'Breaking the Ring', '包囲網を破る'], d: ['이웃 나라들의 견제 연합을 해체시킴', 'Dissolve a coalition formed against you', '隣国の牽制連合を解かせる'] },
    // ── 史 역사·왕조 ──
    { id: 'faith', cat: 'his', icon: '📖', goals: [70], tier: 'silver', fin: true, val: function (c) { return c.dec >= 8 ? c.hist : 0; },
      n: ['사관의 벗', 'Friend of the Chroniclers', '史官の友'], d: ['역사 일치도 {n}% 이상으로 마침', 'Finish with {n}%+ historical match', '歴史一致度{n}%以上で終える'] },
    { id: 'rewrite', cat: 'his', icon: '✒', goals: [1], tier: 'gold', fin: true, val: function (c) { return c.dec >= 8 && c.hist <= 35 && GOOD.indexOf(c.end) >= 0 ? 1 : 0; },
      n: ['역사를 바꾼 왕', 'The King Who Rewrote History', '歴史を変えた王'], d: ['실제 역사와 크게 달라지고도 나라를 이어 감', 'Diverge from history and still hold the realm', '史実から大きく外れてなお国を保つ'] },
    { id: 'phoenix', cat: 'his', icon: '🔥', goals: [1], tier: 'gold', fin: true, val: function (c) { return c.rel > 0 && GOOD.indexOf(c.end) >= 0 ? 1 : 0; },
      n: ['도읍을 옮기고 일어서다', 'Rising from the Ashes', '遷都して立ち上がる'], d: ['도읍이 함락돼 천도하고도 끝까지 나라를 지킴', 'Lose your capital, relocate, and still endure', '都を失い遷都してなお国を保つ'] },
    { id: 'extend', cat: 'his', icon: '♾', goals: [1, 3], val: function (c) { return c.ext; },
      n: [['왕조는 이어진다', 'The Dynasty Endures', '王朝は続く'], ['삼대의 영화', 'Three Reigns of Glory', '三代の栄華']],
      d: ['후계 시대로 왕조를 {n}번 이음', 'Carry the dynasty on {n} time(s)', '後継時代へ王朝を{n}度継ぐ'] },
    { id: 'full', cat: 'his', icon: '🗓', goals: [1], tier: 'bronze', fin: true, val: function (c) { return c.full && GOOD.indexOf(c.end) >= 0 ? 1 : 0; },
      n: ['끝까지 지킨 왕위', 'Full Reign', '最後まで守った王位'], d: ['정해진 재위 기간을 끝까지 채움', 'See out the whole span of the reign', '定められた治世を全うする'] },
    // ── 終 결말·특별 ──
    { id: 'e_hegemon', cat: 'end', icon: '🏆', goals: [1], tier: 'gold', fin: true, val: function (c) { return c.end === '霸' ? 1 : 0; },
      n: ['삼국의 패자', 'Hegemon of the Three Kingdoms', '三国の覇者'], d: ['패업을 이루고 재위를 마침', 'End the reign in hegemony', '覇業を成して治世を終える'] },
    { id: 'e_revival', cat: 'end', icon: '🌅', goals: [1], tier: 'gold', fin: true, val: function (c) { return c.end === '興' ? 1 : 0; },
      n: ['중흥의 군주', 'King of Revival', '中興の君主'], d: ['나라를 일으켜 중흥으로 재위를 마침', 'End the reign in national revival', '国を興して中興で治世を終える'] },
    { id: 'e_hold', cat: 'end', icon: '🏔', goals: [1], tier: 'silver', fin: true, val: function (c) { return c.end === '守' ? 1 : 0; },
      n: ['지켜 낸 나라', 'The Realm Held', '守り抜いた国'], d: ['나라를 굳게 지키며 재위를 마침', 'End the reign with the realm held firm', '国を固く守って治世を終える'] },
    { id: 'e_live', cat: 'end', icon: '🌱', goals: [1], tier: 'bronze', fin: true, val: function (c) { return c.end === '存' || c.end === '延' ? 1 : 0; },
      n: ['살아남은 나라', 'The Realm Survives', '生き延びた国'], d: ['어려운 시대를 넘기고 나라를 이음', 'Pull the realm through a hard age', '苦しい時代を越えて国を繋ぐ'] },
    { id: 'noblood', cat: 'end', icon: '🕊', goals: [1], tier: 'legend', secret: true, fin: true, val: function (c) { return c.end === '霸' && c.wars === 0 ? 1 : 0; },
      n: ['무혈의 패업', 'Bloodless Hegemony', '無血の覇業'], d: ['먼저 군사를 일으키지 않고 패업을 이룸', 'Achieve hegemony without launching a single attack', '自ら兵を起こさずに覇業を成す'] },
    { id: 'comeback', cat: 'end', icon: '🔄', goals: [1], tier: 'legend', secret: true, fin: true, val: function (c) { return c.f.lowP <= 25 && c.res.people >= 60 && GOOD.indexOf(c.end) >= 0 ? 1 : 0; },
      n: ['와신상담', 'Bitter Resolve', '臥薪嘗胆'], d: ['민심이 바닥까지 떨어졌다가 되살려 끝까지 이름', 'Recover from rock-bottom public support to the very end', '民心が底まで落ちてから立て直して終える'] },
    { id: 'lonely', cat: 'end', icon: '🏴', goals: [1], tier: 'legend', secret: true, fin: true, val: function (c) { return c.end === '滅' || c.end === '亡' ? (c.bw >= 5 ? 1 : 0) : 0; },
      n: ['장렬한 최후', 'A Glorious Last Stand', '壮烈な最期'], d: ['나라는 무너졌으나 마지막까지 승전을 이어 감', 'Fall in the end, but with victories to the last', '国は滅びたが最後まで勝ち続ける'] }
  ];
  var TIERS = ['bronze', 'silver', 'gold'], TW = { bronze: 1, silver: 2, gold: 3, legend: 5 };
  var IDX = {}, LIST = [];
  DEFS.forEach(function (d) {
    d.goals.forEach(function (g, i) {
      var id = d.goals.length > 1 ? d.id + (i + 1) : d.id, tier = d.tier || TIERS[Math.min(i, 2)];
      var it = { id: id, d: d, i: i, goal: g, tier: tier, w: TW[tier], secret: !!d.secret };
      IDX[id] = it; LIST.push(it);
    });
  });
  F.DEFS = DEFS; F.LIST = LIST; F.IDX = IDX;
  F.name = function (it) { var n = it.d.n; return T(Array.isArray(n[0]) ? n[it.i] : n); };
  F.desc = function (it, v) { return fill(T(it.d.d), v == null ? it.goal : v); };
  var STAR = { bronze: '★', silver: '★★', gold: '★★★', legend: '✦' };
  F.stars = function (t) { return STAR[t] || '★'; };

  /* ── 판정 ── */
  function ctxOf(sb, end) {
    var s = sb.s, f = S_(sb), st = s.stats, res = sb.g.state.res, gs = sb.g.state, cfg = sb.cfg;
    sample(sb);
    var laws = Object.keys(s.laws || {}).length, base = (cfg.end0 != null ? cfg.end0 : cfg.end) - cfg.start;
    var ys = Math.max(0, Math.min(s.year, cfg.end) - cfg.start);
    return {
      sb: sb, s: s, f: f, st: st, res: res, rl: s.realm, end: end || null,
      capt: Object.keys(s.captured || {}).length, bw: f.bw, bl: f.b - f.bw, bstr: f.bstr, def: st.defended || 0, won: st.won || 0, lost: st.lost || 0, wars: st.wars || 0,
      inv: st.invaded || 0, ev: st.events || 0, free: st.free || 0, laws: laws, places: myCount(sb), army: sb.armyTotal(), ys: ys, base: base,
      full: ys >= base || !!s.extended, ext: s.extended || 0, rel: s.relocated || 0, dec: gs.dec || 0, hist: gs.dec ? Math.round(gs.hist / gs.dec * 100) : 0
    };
  }
  F.context = ctxOf;
  // 평가: 판 전체에 대해 얻은 업적과(단계별) 가까운 업적을 돌려준다. live 이면 재위 도중(끝나야 하는 업적 제외)이라 새 업적을 알림 대기열에 넣는다
  F.evaluate = function (sb, end, live) {
    var c = ctxOf(sb, end), f = c.f, out = { c: c, got: [], near: [], fresh: [] };
    DEFS.forEach(function (d) {
      if (live && d.fin) return;
      var v = d.val(c) || 0, lv = -1;
      d.goals.forEach(function (g, i) { if (v >= g) lv = i; });
      for (var i = 0; i <= lv; i++) {
        var id = d.goals.length > 1 ? d.id + (i + 1) : d.id, y = f.got[id];
        if (y == null) { f.got[id] = y = sb.s.year; out.fresh.push(id); if (live) f.q.push(id); }
        out.got.push({ it: IDX[id], v: v, y: y });
      }
      var nx = lv + 1;
      if (nx < d.goals.length && v > 0 && d.goals[nx] > 1) out.near.push({ it: IDX[d.goals.length > 1 ? d.id + (nx + 1) : d.id], v: v, p: Math.min(0.99, v / d.goals[nx]) });
    });
    out.near.sort(function (a, b) { return b.p - a.p; });
    return out;
  };

  /* ── 점수·등급 ── */
  var GRADES = [
    [82, 'S', ['성군(聖君)', 'Sage King', '聖君']], [68, 'A', ['명군(明君)', 'Wise Ruler', '名君']], [54, 'B', ['현군(賢君)', 'Able Ruler', '賢君']],
    [40, 'C', ['범군(凡君)', 'Ordinary Ruler', '凡君']], [26, 'D', ['암군(暗君)', 'Feeble Ruler', '暗君']], [-1, 'F', ['망국의 군주', 'Ruler of a Failed Realm', '亡国の君']]
  ];
  F.gradeOf = function (sc) { for (var i = 0; i < GRADES.length; i++) if (sc >= GRADES[i][0]) return { g: GRADES[i][1], n: T(GRADES[i][2]), nn: GRADES[i][2] }; return { g: 'F', n: T(GRADES[5][2]), nn: GRADES[5][2] }; };
  F.score = function (c) {
    var f = c.f, rl = c.rl, res = c.res, sealBase = (SEAL[c.end] || { base: 10 }).base;
    var war = clamp(c.bw * 7 + c.capt * 5 + c.def * 6 + f.k / 2500 - c.bl * 4, 0, 100);
    var gov = clamp(((Math.min(rl.econ, 100) + Math.min(rl.train, 100) + Math.min(rl.defense, 100) + Math.min(rl.royal, 100)) / 4) * 0.72 + Math.min(c.laws, 7) * 4, 0, 100);
    var dip = clamp(f.relPk * 0.45 + f.friends * 9 + Math.min(20, f.bpeace * 2) + Math.min(10, f.joint * 5) + (f.coal ? 8 : 0), 0, 100);
    var pop = clamp(res.people * 0.8 + res.morale * 0.2, 0, 100);
    var land = clamp(50 * (c.places / Math.max(1, f.p0)) + (f.dest ? 10 : 0), 0, 100);
    var dur = 5 * clamp(c.ys / Math.max(1, c.base), 0, 1);
    var total = clamp(Math.round(sealBase + war * 0.12 + gov * 0.12 + dip * 0.08 + pop * 0.10 + land * 0.13 + dur), 0, 100);
    return { score: total, axes: [Math.round(war), Math.round(gov), Math.round(dip), Math.round(pop), Math.round(land)], grade: F.gradeOf(total) };
  };
  var AXN = [['武', ['군사', 'Military', '軍事']], ['政', ['내정', 'Governance', '内政']], ['交', ['외교', 'Diplomacy', '外交']], ['民', ['민심', 'Public Favor', '民心']], ['領', ['영토', 'Territory', '領土']]];
  F.AXN = AXN;

  /* ── 기록(한 판의 결과) ── */
  function momentsOf(f, n) {
    var m = f.mom.slice(); if (!m.length) return [];
    var pick = m.map(function (x, i) { return { x: x, i: i }; }).sort(function (a, b) { return b.x.w - a.x.w || b.i - a.i; }).slice(0, n || 8);
    pick.sort(function (a, b) { return a.i - b.i; });
    return pick.map(function (p) { return { y: p.x.y, t: p.x.t }; });
  }
  F.record = function (sb, e, ev, sc) {
    var c = ev.c, f = c.f, cfg = sb.cfg, scn = SG.scenarios[cfg.id] || {}, title = ($('#chron h2') || {}).textContent || '';
    return {
      v: 1, id: f.rid, at: Date.now(), kid: cfg.id, king: scn.king || cfg.king || cfg.id, side: sb.side, y0: cfg.start, y1: sb.s.year, years: c.ys, seal: e.seal || '', title: title.slice(0, 80),
      score: sc.score, grade: sc.grade.g, axes: sc.axes, hist: c.hist, dec: c.dec,
      stat: { capt: c.capt, bw: c.bw, bl: c.bl, def: c.def, inv: c.inv, wars: c.wars, laws: c.laws, ev: c.ev, free: c.free, kills: Math.round(f.k), lost: Math.round(f.l), places: c.places, p0: f.p0, pk: f.pk, pa: Math.round(f.pa), army: Math.round(c.army), bstr: f.bstr, peace: f.bpeace },
      ext: c.ext, rel: c.rel, feats: Object.keys(f.got), moments: momentsOf(f, 8), lang: (SG.i18n && SG.i18n.lang) || 'ko'
    };
  };
  F.shareText = function (rec) {
    var ids = rec.feats.map(function (id) { return IDX[id]; }).filter(Boolean).sort(function (a, b) { return b.w - a.w; }).slice(0, 4).map(F.name);
    var url = (window.SITE && SITE.URL) || 'https://kjuhoho.github.io/samgukwang/';
    return '三國王 · ' + rec.king + ' · ' + rec.y0 + '→' + rec.y1 + ' · ' + F.sealName(rec.seal) + ' ' + rec.seal + '\n' +
      L3('치세 평가', 'Reign rating', '治世評価') + ' ' + rec.grade + ' ' + F.gradeOf(rec.score).n + ' · ' + rec.score + L3('점', ' pts', '点') + '\n' +
      '🏅 ' + L3('업적 ', 'Achievements: ', '実績 ') + rec.feats.length + (ids.length ? ' — ' + ids.join(' · ') : '') + '\n' + url;
  };

  /* ── 끝 화면 패널 ── */
  function statChips(rec) {
    var s = rec.stat, a = [
      ['🏯', L3('점령한 성', 'Fortresses taken', '攻略した城'), num(s.capt)],
      ['⚔', L3('승전', 'Battles won', '勝利'), num(s.bw) + '<small>/' + num(s.bw + s.bl) + '</small>'],
      ['🛡', L3('막아 낸 침공·결전', 'Invasions held', 'しのいだ侵攻'), num(s.def)],
      ['🗡', L3('쓰러뜨린 적병', 'Enemy troops downed', '討った敵兵'), num(s.kills)],
      ['🪖', L3('최대 병력', 'Peak army', '最大兵力'), num(s.pa)],
      ['🗺', L3('영토(성)', 'Territory', '領土(城)'), s.p0 + '→' + s.places],
      ['📜', L3('반포한 법령', 'Laws enacted', '公布した法令'), num(s.laws)],
      ['📅', L3('재위 기간', 'Years reigned', '在位'), num(rec.years) + L3('년', ' yr', '年')]
    ];
    return '<div class="fv-st">' + a.map(function (x) { return '<div><i>' + x[0] + '</i><b>' + x[2] + '</b><small>' + x[1] + '</small></div>'; }).join('') + '</div>';
  }
  function axesHtml(axes) {
    return '<div class="fv-ax">' + AXN.map(function (a, i) { return '<div><i>' + a[0] + '</i><span><u style="width:' + axes[i] + '%"></u></span><b>' + axes[i] + '</b><small>' + T(a[1]) + '</small></div>'; }).join('') + '</div>';
  }
  F.axesHtml = axesHtml; F.statChips = statChips;
  function featCard(it, v, y) {
    return '<div class="fv-ft t-' + it.tier + '"><span class="ic">' + it.d.icon + '</span><div><b>' + esc(F.name(it)) + '</b> <i>' + STAR[it.tier] + '</i><small>' + esc(F.desc(it, it.goal)) + (y != null ? ' · ' + yr(y) : '') + '</small></div></div>';
  }
  F.featCard = featCard;
  F.panel = function (sb, rec, ev, sc) {
    var el = h('div', 'fv'), got = ev.got.slice().sort(function (a, b) { return b.it.w - a.it.w || b.y - a.y; }), head = got.slice(0, 5), rest = got.slice(5);
    var html = '<h3>' + L3('📜 재위 평가', '📜 Reign Review', '📜 治世の評価') + '</h3>' +
      '<div class="fv-top"><div class="fv-grade g' + sc.grade.g + '">' + sc.grade.g + '</div><div class="fv-sum"><b>' + esc(sc.grade.n) + '</b><span>' + sc.score + L3('점', ' pts', '点') + ' · ' + esc(rec.king) + ' · ' + rec.y0 + '→' + rec.y1 + '</span><span>' + esc(F.sealName(rec.seal)) + ' ' + esc(rec.seal) + '</span></div></div>' +
      axesHtml(sc.axes) + statChips(rec);
    html += '<h4>' + L3('이 재위의 업적', 'Achievements this reign', 'この治世の実績') + ' <em>' + got.length + '/' + LIST.length + '</em></h4>';
    if (head.length) html += head.map(function (g) { return featCard(g.it, g.v, g.y); }).join('');
    else html += '<div class="fv-none">' + L3('이번 재위에서는 얻은 업적이 없습니다. 다음에는 다른 길을 걸어 보세요.', 'No achievements this reign. Try a different road next time.', '今回の治世で得た実績はありません。次は違う道を歩んでみてください。') + '</div>';
    if (rest.length) html += '<div class="fv-chips">' + rest.map(function (g) { return '<span class="t-' + g.it.tier + '" title="' + esc(F.desc(g.it, g.it.goal)) + '">' + g.it.d.icon + ' ' + esc(F.name(g.it)) + '</span>'; }).join('') + '</div>';
    var mo = rec.moments;
    if (mo.length) html += '<h4>' + L3('주요 장면', 'Key moments', '主な場面') + '</h4><ul class="fv-mo">' + mo.map(function (m) { return '<li><b>' + yr(m.y) + '</b> ' + esc(m.t) + '</li>'; }).join('') + '</ul>';
    var near = ev.near.filter(function (n) { return !n.it.secret; }).slice(0, 2);
    if (near.length) html += '<h4>' + L3('아깝게 놓친 업적', 'Almost there', 'あと一歩の実績') + '</h4>' + near.map(function (n) {
      return '<div class="fv-near"><span class="ic">' + n.it.d.icon + '</span><div><b>' + esc(F.name(n.it)) + '</b> <i>' + STAR[n.it.tier] + '</i><small>' + esc(F.desc(n.it, n.it.goal)) + ' — ' + num(n.v) + ' / ' + num(n.it.goal) + '</small><span class="bar"><u style="width:' + Math.round(n.p * 100) + '%"></u></span></div></div>';
    }).join('');
    html += '<div class="fv-act"><button class="btn" data-a="share">' + L3('📋 결과 복사하여 공유', '📋 Copy result to share', '📋 結果をコピーして共有') + '</button><button class="btn" data-a="recs">' + L3('📚 내 기록 보기', '📚 My records', '📚 マイ記録') + '</button></div>' +
      '<div class="fv-save"></div>';
    el.innerHTML = html;
    el.querySelector('[data-a="share"]').onclick = function () { F.copy(F.shareText(rec), this); };
    el.querySelector('[data-a="recs"]').onclick = function () { if (SG.account && SG.account.openRecords) SG.account.openRecords(); };
    return el;
  };
  F.copy = function (text, btn) {
    function done(ok) { if (!btn) return; var o = btn.getAttribute('data-t') || btn.textContent; btn.setAttribute('data-t', o); btn.textContent = ok ? L3('✔ 복사했습니다', '✔ Copied', '✔ コピーしました') : L3('복사하지 못했습니다', 'Copy failed', 'コピーできません'); setTimeout(function () { btn.textContent = o; }, 1800); }
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallback(); }); return; } } catch (e) { }
    fallback();
    function fallback() { try { var ta = h('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-999px;top:0'; document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); ta.remove(); done(ok); } catch (e) { done(false); } }
  };

  /* ── 알림(도중 새 업적) ── */
  function toast(it) {
    var root = $('#app') || document.body, box = $('#ftoasts');
    if (!box) { box = h('div'); box.id = 'ftoasts'; root.appendChild(box); }
    var t = h('div', 'ftoast t-' + it.tier, '<span class="ic">' + it.d.icon + '</span><div><small>' + L3('업적 달성', 'Achievement unlocked', '実績達成') + ' ' + STAR[it.tier] + '</small><b>' + esc(F.name(it)) + '</b><em>' + esc(F.desc(it, it.goal)) + '</em></div>');
    box.appendChild(t); setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 700); }, 5200);
  }
  function flush(sb) {
    var f = S_(sb); if (!f.q || !f.q.length) return;
    var ids = f.q.splice(0, f.q.length); ids.slice(0, 4).forEach(function (id, i) { var it = IDX[id]; if (it) setTimeout(function () { toast(it); }, i * 700); });
  }

  /* ── 엔진에 걸기 ── */
  var _log = P.log;
  P.log = function (t) { var r = _log.apply(this, arguments); try { note(this, t); } catch (e) { warn(e); } return r; };
  var _ye = P.yearEnd;
  P.yearEnd = function () { try { sample(this); yearTick(this); } catch (e) { warn(e); } return _ye.apply(this, arguments); };
  var _turn = P.turn;
  P.turn = function () { try { F.evaluate(this, null, true); } catch (e) { warn(e); } return _turn.apply(this, arguments); };
  var _rt = P.renderTurn;
  P.renderTurn = function () { var r = _rt.apply(this, arguments); try { flush(this); } catch (e) { warn(e); } return r; };
  var _run = P.run;
  P.run = function (c, opt) { try { if (c && c.id === 'buy_grain' && opt && opt.market && !this.cmdAvail(c)) S_(this).grain++; } catch (e) { } return _run.apply(this, arguments); };
  var _cf = P.capitalFall;
  if (_cf) P.capitalFall = function (pl, prev, by) {
    var s = this.s, n0 = Object.keys(s.destroyed || {}).length, r = _cf.apply(this, arguments);
    try { if (Object.keys(s.destroyed || {}).length > n0 && (!by || by === this.side)) S_(this).dest++; } catch (e) { }
    return r;
  };
  var _bu = G.battleUI;
  G.battleUI = function (r) { try { onBattle(this, r); } catch (e) { warn(e); } return _bu.apply(this, arguments); };

  /* ── 이 기기의 기록 보관(로그인 전·계정 연결 전 모두) ── */
  var RKEY = 'samgukwang.records.v1';
  F.local = {
    read: function () { try { var a = JSON.parse(localStorage.getItem(RKEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } },
    write: function (a) { try { localStorage.setItem(RKEY, JSON.stringify(a.slice(0, 100))); return true; } catch (e) { return false; } },
    put: function (rec) { var a = F.local.read().filter(function (x) { return x.id !== rec.id; }); a.unshift(rec); a.sort(function (x, y) { return (y.at || 0) - (x.at || 0); }); return F.local.write(a); },
    clear: function () { try { localStorage.removeItem(RKEY); } catch (e) { } }
  };

  /* ── 재위가 끝났을 때 ── */
  var _end = G.endUI;
  G.endUI = function (sc) {
    var r = _end.apply(this, arguments);
    try { onEnd(this, sc); } catch (e) { warn(e); }
    return r;
  };
  function onEnd(g, sc) {
    var sb = g.sb, e = sc && sc.ending, body = $('#chron .body');
    if (!sb || !e || !body || !$('#chron .endseal')) return;   // 천도처럼 끝나지 않은 경우는 건너뜀
    var ev = F.evaluate(sb, e.seal, false), score = F.score(ev.c), rec = F.record(sb, e, ev, score), panel = F.panel(sb, rec, ev, score);
    body.appendChild(panel); F.lastRecord = rec;
    var st = panel.querySelector('.fv-save'); st.textContent = L3('기록하는 중…', 'Saving…', '記録中…');
    var done = function (res) {
      var where = res && res.where;
      if (where === 'cloud') st.innerHTML = L3('☁ 계정에 기록했습니다. 「내 기록」에서 언제든 볼 수 있습니다.', '☁ Saved to your account. See it any time in My Records.', '☁ アカウントに記録しました。「マイ記録」でいつでも見られます。');
      else {
        var tip = SG.account && SG.account.canLogin && SG.account.canLogin() ? ' <a href="#" class="fv-login">' + L3('로그인하면 계정에 보관되어 다른 기기에서도 볼 수 있습니다', 'Log in to keep it on your account and see it on other devices', 'ログインするとアカウントに保管され、他の端末でも見られます') + '</a>' : '';
        st.innerHTML = L3('💾 이 기기에 기록했습니다.', '💾 Saved on this device.', '💾 この端末に記録しました。') + tip;
        var a = st.querySelector('.fv-login'); if (a) a.onclick = function (ev2) { ev2.preventDefault(); SG.account.login(); };
      }
    };
    try {
      if (SG.account && SG.account.saveRecord) Promise.resolve(SG.account.saveRecord(rec)).then(done, function () { done({ where: 'local' }); });
      else { F.local.put(rec); done({ where: 'local' }); }
    } catch (x) { F.local.put(rec); done({ where: 'local' }); }
  }
})();
