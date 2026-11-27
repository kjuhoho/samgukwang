/* 내정 고도화(domestic.js) — 해마다의 금·군량 수입을 만드는 요소를 나누고, 정책의 효과가 눈에 보이게 한다.
 *  · 산업(econ): 기존 그대로. 이제 산업이 60·75·90을 넘으면 「번성·융성·태평」 단계 보너스(금·군량 수입)가 붙는다.
 *  · 농업(agri): 군량 수입. 수리 시설·농기구·개간·둔전으로 올리고, 높을수록 가뭄·홍수·대기근도 덜 겪는다.
 *  · 상공업(trade): 금 수입. 시장·공방·항구로 올린다.
 *  · 곡창(store): 쌓아 둔 군량에 환곡 이자가 붙고 대기근 피해가 줄어든다.
 *  · 법령: 둔전제(군 유지비 절감) · 균전제(농업↑) · 화폐·도량형 통일(금 수입 +15%) · 상업 장려령(상공업↑).
 * 새 수치(agri·trade·store)는 예전 저장 파일에는 없으므로 0 으로 보고 계산한다(= 예전과 같은 수입).
 * 해마다의 수지는 항목(goldParts / foodParts)의 합이며, 정무 화면의 「내정 현황」에서 항목별로 확인할 수 있다.
 * 문장은 함수 안에서 L3()로 지금 언어에 맞춰 고르고, 명령·법령의 이름·설명·문장만 T()로 번역 사전에 올린다(파일을 읽을 때 한 번). */
(function () {
  var P = SG.Sandbox.prototype;
  var TR = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
  function T(k, e, j) { TR.en[k] = e; TR.ja[k] = j; var I = SG.i18n; if (I && I.dict && I.dict.en) { I.dict.en[k] = e; I.dict.ja[k] = j; } return k; }
  function L3(ko, en, ja) { var l = SG.i18n && SG.i18n.lang; return l === 'en' ? en : l === 'ja' ? ja : ko; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }
  function r1(v) { return Math.round(v * 10) / 10; }
  function sg(v) { v = r1(v); return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v); }   // 부호를 붙인 소수 한 자리
  function sr(v) { v = Math.round(v); return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v); }   // 부호를 붙인 정수
  function sum(o) { var t = 0; for (var k in o) t += num(o[k]); return t; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  var CFG = SG.DOMESTIC = {
    max: 100,                                                  // 농업·상공업·곡창의 상한
    tiers: [{ at: 90, k: 'peace', gold: 5, food: 7 }, { at: 75, k: 'rise', gold: 3, food: 4 }, { at: 60, k: 'bloom', gold: 1, food: 2 }],   // 산업 단계(높은 쪽부터)
    knee: 50,                                                  // 농업·상공업은 이 점수까지가 한 점당 효과가 크다(그 위는 반)
    agri: [0.35, 0.14],                                        // 농업 한 점당 군량 수입: [~knee, knee 초과] (농업 100이면 해마다 군량 +24.5)
    trade: [0.30, 0.12],                                       // 상공업 한 점당 금 수입 (상공업 100이면 해마다 금 +21)
    interest: { rate: 0.0008, cap: 200 },                      // 곡창 이자 = min(군량, cap) × 곡창 × rate (곡창 50·군량 100이면 해마다 4)
    econSoft: { from: 70, span: 80, min: 0.25 },               // 산업이 70을 넘으면 오르는 폭이 줄어든다(80 더 오르면 1/4까지). 예전엔 한도 없이 올라 수입이 폭증했다
    jindae: 3,                                                 // 사건에서 진대법을 시행했을 때(flags.jindae) 해마다 군량
    decay: { from: 60, div: 30, store: 70 }                    // 농업·상공업은 60을 넘는 만큼의 1/30이, 곡창은 70을 넘는 만큼의 1/40이 해마다 줄어든다
  };
  var KEYS = ['agri', 'trade', 'store'];

  /* ── 이름·말 ── */
  var SL = {
    econ: ['산업', 'Economy', '産業'], agri: ['농업', 'Agriculture', '農業'], trade: ['상공업', 'Commerce', '商工業'], store: ['곡창', 'Granary', '穀倉'],
    gold: ['금', 'Gold', '金'], food: ['군량', 'Provisions', '軍糧']
  };
  function sl(k) { var x = SL[k]; return L3(x[0], x[1], x[2]); }
  var TIER = { peace: ['태평', 'Golden Age', '太平'], rise: ['융성', 'Thriving', '隆盛'], bloom: ['번성', 'Prospering', '繁盛'] };
  function tierName(t) { var x = TIER[t.k]; return L3(x[0], x[1], x[2]); }
  var LB = {   // 수입 항목 이름
    base: ['기본(산업·민심)', 'Base (economy & favor)', '基本(産業・民心)'], tier: ['산업 단계', 'Economy stage', '産業段階'],
    agri: ['농업', 'Agriculture', '農業'], trade: ['상공업', 'Commerce', '商工業'], store: ['곡창 이자', 'Granary interest', '穀倉の利子'],
    jindae: ['진대법', 'Spring loans', '賑貸法'], law: ['법령 효과', 'Law bonus', '法令の効果'],
    upkeep: ['군 유지비', 'Army upkeep', '軍の維持費'], save: ['둔전제 절감', 'Military-farm savings', '屯田制の節減']
  };
  var ORDER = ['base', 'tier', 'agri', 'trade', 'store', 'jindae', 'law', 'upkeep', 'save'];
  var GRP = { farm: ['🌾 농업·군량', '🌾 Farming & Grain', '🌾 農業・軍糧'], biz: ['💰 상공업·재정', '💰 Commerce & Finance', '💰 商工業・財政'], court: ['🏛 왕권·민생', '🏛 Court & People', '🏛 王権・民生'] };

  /* ── 번역: 능력치 칩(「농업 +10」)과 막대 이름 ── */
  [['농업', 'Agriculture', '農業'], ['상공업', 'Commerce', '商工業'], ['곡창', 'Granary', '穀倉']].forEach(function (x) {
    T(x[0], x[1], x[2]);
    ['+', '−', '-'].forEach(function (sgn) { T(x[0] + ' ' + sgn + '{n}', x[1] + ' ' + sgn + '{n}', x[2] + sgn + '{n}'); });
  });
  Object.keys(GRP).forEach(function (k) { T(GRP[k][0], GRP[k][1], GRP[k][2]); });

  /* ═════ 데이터: 명령 ═════ */
  var cmds = SG.data.commands, byId = {};
  function reindex() { byId = {}; SG.data.commands.forEach(function (c) { byId[c.id] = c; }); }
  reindex();
  function add(list) { list.forEach(function (c) { if (!byId[c.id]) { SG.data.commands.push(c); byId[c.id] = c; } }); }
  add([
    {
      id: 'irrigation', cat: '내정', grp: 'farm', hist: '일반', cost: { gold: 7 }, eff: { realm: { agri: 10 }, fx: { people: 1 } },
      name: T('수리 시설 정비', 'Irrigation Works', '水利施設の整備'),
      desc: T('제방과 저수지·물길을 손봐 가뭄과 홍수에 강한 농토를 만듭니다. 농업이 오르면 해마다 군량 수입이 늘고, 가뭄·홍수도 덜 겪습니다.',
        'Repair dikes, reservoirs and channels so fields stand up to drought and flood. Higher agriculture raises yearly grain income and makes droughts and floods rarer.',
        '堤防・貯水池・水路を整え、干ばつにも洪水にも強い農地を作ります。農業が上がると毎年の軍糧収入が増え、干ばつや洪水も減ります。'),
      lines: [T('저수지와 물길이 손질되어 메마르던 논에 물이 돌기 시작했습니다.', 'The reservoirs and channels were repaired, and water began to reach the parched paddies.', '貯水池と水路が直され、乾いていた田に水が回り始めました。'),
        T('제방을 새로 쌓고 보를 고쳐, 가뭄에도 홍수에도 버틸 농토가 늘었습니다.', 'New dikes and weirs left more farmland able to withstand both drought and flood.', '堤を新たに築き堰を直して、干ばつにも洪水にも耐える農地が増えました。')]
    },
    {
      id: 'plow', cat: '내정', grp: 'farm', hist: '일반', cost: { gold: 6 }, eff: { realm: { agri: 8, econ: 1 }, fx: { people: 1 } },
      name: T('우경·철제 농기구 보급', 'Ox Plows & Iron Farm Tools', '牛耕・鉄製農具の普及'),
      desc: T('소를 부리는 쟁기와 철제 농기구를 농가에 나눠 수확을 늘립니다. 농업과 산업이 오릅니다.',
        'Hand out ox-drawn plows and iron farm tools to raise yields. Raises agriculture and economy.',
        '牛に引かせる鋤と鉄製の農具を農家に配り、収穫を増やします。農業と産業が上がります。'),
      lines: [T('대장간에서 쇠스랑과 쟁기날이 쏟아져 나와 농가마다 나눠졌습니다.', 'Forges turned out rakes and plowshares, and every farm household received some.', '鍛冶場から熊手と鋤先が次々に作られ、農家ごとに配られました。'),
        T('소로 밭을 가는 법이 퍼지자 같은 땅에서 거두는 곡식이 눈에 띄게 늘었습니다.', 'As plowing with oxen spread, the same land yielded visibly more grain.', '牛で田畑を耕す方法が広まると、同じ土地から取れる穀物が目に見えて増えました。')]
    },
    {
      id: 'granary', cat: '내정', grp: 'farm', hist: '일반', cost: { gold: 8 }, eff: { realm: { store: 12 }, fx: { food: 6 } },
      name: T('곡창 증설', 'Expand Granaries', '穀倉の増設'),
      desc: T('관곡을 쌓아 둘 창고를 늘립니다. 곡창이 클수록 쌓아 둔 군량에 환곡 이자가 붙고 대기근 피해가 줄어듭니다. 흩어진 관곡을 거두어 군량도 조금 채웁니다.',
        'Build more storehouses for state grain. Larger granaries earn lending interest on the grain you hold and soften great famines. Scattered state grain is gathered in, adding a little provisions.',
        '官穀をためる倉を増やします。穀倉が大きいほど、蓄えた軍糧に還穀の利子がつき、大飢饉の被害も減ります。散らばっていた官穀を集め、軍糧も少し補います。'),
      lines: [T('새 곡식 창고가 줄지어 서고, 흩어져 있던 관곡이 한곳에 모였습니다.', 'New granaries rose in rows, and state grain that had been scattered was gathered in one place.', '新しい穀倉が並び建ち、散らばっていた官穀が一か所に集められました。'),
        T('창고마다 곡식 장부가 정리되어 비축이 한결 든든해졌습니다.', 'With each storehouse’s ledger put in order, the reserves felt far sturdier.', '倉ごとに穀物の帳簿が整えられ、備蓄がぐっと頼もしくなりました。')]
    },
    {
      id: 'grain_levy', cat: '내정', grp: 'farm', hist: '일반', cd: 3, cost: {}, eff: { fx: { people: -6 } },
      name: T('곡물 추가 징수', 'Extra Grain Levy', '穀物の追加徴収'),
      desc: T('급한 대로 농가에서 곡식을 더 거둡니다. 군량이 바로 늘지만 백성의 원성을 삽니다. 산업과 농업이 높을수록 많이 거둡니다. (3년에 한 번)',
        'Squeeze extra grain from farm households in an emergency. Provisions rise at once, but the people resent it. The higher your economy and agriculture, the more you collect. (Once every 3 years)',
        '急場しのぎに農家から穀物を余分に取り立てます。軍糧はすぐ増えますが、民の恨みを買います。産業と農業が高いほど多く集まります。(3年に一度)'),
      lines: [T('관리들이 마을을 돌며 곡식을 더 거두어 갔습니다. 농가의 한숨이 깊습니다.', 'Officials went from village to village collecting extra grain. The sighs in the farmhouses ran deep.', '役人たちが村を回って穀物を余分に取り立てました。農家のため息が深まっています。')],
      fn: function (g, S) {
        var rl = (S && S.realm) || {}, n = Math.round(8 + (rl.econ || 0) * 0.06 + (rl.agri || 0) * 0.10);
        return { fx: { food: n }, text: L3('거둔 곡식 ' + n + '이 창고로 들어왔습니다.', n + ' units of grain were collected into the granaries.', '集めた穀物' + n + 'が倉に入りました。') };
      }
    },
    {
      id: 'market', cat: '내정', grp: 'biz', hist: '일반', cost: { gold: 6 }, eff: { realm: { trade: 10 }, fx: { people: 1 } },
      name: T('시장 개설·상인 보호', 'Open Markets & Protect Merchants', '市場の開設・商人の保護'),
      desc: T('장터를 열고 상인을 보호해 상공업을 키웁니다. 상공업이 오르면 해마다 금 수입이 늘어납니다.',
        'Open marketplaces and protect merchants to grow commerce. Higher commerce raises yearly gold income.',
        '市を開き商人を保護して、商工業を育てます。商工業が上がると毎年の金の収入が増えます。'),
      lines: [T('성 밑에 장터가 서고 각지의 상인들이 모여들었습니다.', 'A marketplace opened below the walls and merchants gathered from every region.', '城下に市が立ち、各地の商人が集まってきました。'),
        T('상인들에게 거래 허가와 보호가 내려져 시장이 북적이기 시작했습니다.', 'Merchants were granted trading permits and protection, and the market began to bustle.', '商人に取引の許可と保護が与えられ、市はにぎわい始めました。')]
    },
    {
      id: 'workshop', cat: '내정', grp: 'biz', hist: '일반', cost: { gold: 8 }, eff: { realm: { trade: 7, econ: 3 } },
      name: T('관영 공방·수공업 진흥', 'State Workshops & Crafts', '官営工房・手工業の振興'),
      desc: T('직조·도자·철기 공방을 세우고 장인을 모읍니다. 상공업과 산업이 오릅니다.',
        'Set up weaving, pottery and ironworking workshops and gather artisans. Raises commerce and economy.',
        '織物・陶磁・鉄器の工房を設け、職人を集めます。商工業と産業が上がります。'),
      lines: [T('관영 공방에서 비단과 도자기, 철기가 쏟아져 나왔습니다.', 'State workshops poured out silk, ceramics and ironware.', '官営の工房から絹や陶磁器、鉄器が次々に作られました。'),
        T('솜씨 좋은 장인들이 모여 새 공방이 문을 열었습니다.', 'Skilled artisans gathered and a new workshop opened its doors.', '腕のいい職人たちが集まり、新しい工房が開かれました。')]
    },
    {
      id: 'port', cat: '내정', grp: 'biz', hist: '일반', cost: { gold: 9 }, eff: { realm: { trade: 9, navy: 2 } },
      name: T('항구·교역망 확충', 'Expand Ports & Trade Routes', '港・交易網の拡充'),
      desc: T('항구와 나루를 넓히고 교역로를 정비합니다. 상공업과 수군력이 오릅니다.',
        'Widen harbors and ferry crossings and improve trade routes. Raises commerce and naval power.',
        '港と渡し場を広げ、交易路を整えます。商工業と水軍力が上がります。'),
      lines: [T('항구에 부두가 늘고 교역선이 줄지어 드나들기 시작했습니다.', 'New piers went up at the harbor, and trading ships began coming and going in a line.', '港に埠頭が増え、交易船が連なって出入りし始めました。'),
        T('나루와 포구가 정비되어 물자가 막힘없이 오갑니다.', 'With the ferries and harbors in order, goods now move without a hitch.', '渡し場と港が整えられ、物資が滞りなく行き来します。')]
    }
  ]);
  // 기존 내정 명령도 새 수치에 이어 둔다: 농사 장려는 농업을, 황무지 개간은 농업을 더 크게 올린다
  if (byId.farm && byId.farm.eff && byId.farm.eff.realm) byId.farm.eff.realm.agri = 3;
  if (byId.tunjeon && byId.tunjeon.eff && byId.tunjeon.eff.realm) byId.tunjeon.eff.realm.agri = 6;
  // 분야별로 묶고 보기 좋게 정렬(내정 탭만). 다른 분야 명령의 자리는 그대로 둔다
  var ORDER_CMD = {
    farm: ['farm', 'tunjeon', 'irrigation', 'plow', 'granary', 'relief', 'grain_levy', 'buy_grain'],
    biz: ['census', 'market', 'workshop', 'port'],
    court: ['law', 'officials', 'academy', 'amnesty', 'court_gift', 'purge', 'temple', 'palace', 'ritual', 'feast']
  };
  (function () {
    var flat = [], rank = {};
    ['farm', 'biz', 'court'].forEach(function (gp) { ORDER_CMD[gp].forEach(function (id) { rank[id] = flat.length; flat.push(id); if (byId[id]) byId[id].grp = gp; }); });
    var idx = [], list = [];
    SG.data.commands.forEach(function (c, i) { if (c.cat === '내정') { idx.push(i); list.push({ c: c, i: i }); } });
    list.sort(function (a, b) { var ra = rank[a.c.id] == null ? 1000 : rank[a.c.id], rb = rank[b.c.id] == null ? 1000 : rank[b.c.id]; return ra - rb || a.i - b.i; });
    idx.forEach(function (at, k) { SG.data.commands[at] = list[k].c; });
  })();

  /* ═════ 데이터: 법령 ═════ */
  var laws = SG.data.laws = SG.data.laws || [];
  function lawById(id) { return laws.filter(function (l) { return l.id === id; })[0]; }
  [{
    id: 'tunjeonje', hist: '가상', cost: { gold: 5 }, eff: {}, dom: { upkeep: 0.25 }, yearly: { realm: { train: -1 } },
    name: T('둔전제 (군이 농사를 겸함)', 'Military Farms', '屯田制(軍が農耕を兼ねる)'),
    desc: T('평시의 군사들이 변경에서 농사를 짓습니다. 군 유지비(군량)가 4분의 1 줄지만 훈련도가 해마다 조금 닳습니다.',
      'Soldiers farm the frontier in peacetime. Army grain upkeep falls by a quarter, but training slips a little every year.',
      '平時の兵が辺境で農耕をします。軍の維持費(軍糧)が4分の1減りますが、訓練度が毎年少しずつ落ちます。')
  }, {
    id: 'landreform', hist: '가상', cost: { gold: 8 }, eff: { realm: { royal: -5 }, fx: { people: 3 } }, yearly: { realm: { agri: 1.5, royal: -0.5 }, fx: { people: 1 } },
    name: T('균전제 (토지 재분배)', 'Equal-Field System', '均田制(土地の再分配)'),
    desc: T('농민에게 땅을 고르게 나눠 농사를 안정시킵니다. 농업과 민심이 해마다 오르지만, 귀족의 반발로 왕권이 해마다 조금 닳습니다.',
      'Land is divided evenly among farmers to steady agriculture. Agriculture and public favor rise every year, but noble resentment wears royal authority down a little each year.',
      '農民に土地を均等に分けて農業を安定させます。農業と民心が毎年上がりますが、貴族の反発で王権が毎年少しずつ削られます。')
  }, {
    id: 'coinage', hist: '가상', cost: { gold: 10 }, eff: { realm: { royal: 2 } }, dom: { goldMul: 0.15 },
    name: T('화폐·도량형 통일', 'Unify Coinage & Measures', '貨幣・度量衡の統一'),
    desc: T('화폐와 말·저울 같은 도량형을 통일해 거래의 비용을 줄입니다. 해마다 금 수입이 15% 늘어납니다.',
      'Unify coinage and measures such as bushels and scales to cut the cost of trade. Gold income rises 15% every year.',
      '貨幣や升・秤などの度量衡を統一して、取引の費用を減らします。毎年の金の収入が15%増えます。')
  }, {
    id: 'marketlaw', hist: '가상', cost: { gold: 6 }, eff: {}, yearly: { realm: { trade: 1.5, royal: -0.5 } },
    name: T('상업 장려령 (시전 설치)', 'Commerce Promotion Edict', '商業奨励令(市廛の設置)'),
    desc: T('도성과 큰 고을에 시전을 두고 상인의 세를 낮춥니다. 상공업이 해마다 오르지만, 상인이 힘을 얻어 왕권이 해마다 조금 닳습니다.',
      'Set up merchant quarters in the capital and large towns and lower merchants’ taxes. Commerce rises every year, but empowered merchants wear royal authority down a little each year.',
      '都と大きな邑に市廛を置き、商人の税を軽くします。商工業が毎年上がりますが、商人が力をつけて王権が毎年少しずつ削られます。')
  }].forEach(function (l) { if (!lawById(l.id)) laws.push(l); });
  // 기존 법령도 새 수치에 이어 둔다: 개간 장려령 → 농업, 곡물 비축 제도 → 곡창
  var lr = lawById('reclaim'); if (lr && lr.yearly && lr.yearly.realm) lr.yearly.realm.agri = 1;
  var lp = lawById('pyeongchang'); if (lp && lp.yearly) { lp.yearly.realm = lp.yearly.realm || {}; lp.yearly.realm.store = 1; }

  /* ═════ 가뭄·홍수·대기근: 농업·곡창이 높으면 덜 일어난다 ═════ */
  function calamity(id, wA, wS, max) {
    var ev = (SG.data.events || []).filter(function (e) { return e.id === id; })[0]; if (!ev || ev._domShield) return;
    var old = ev.cond; ev._domShield = 1;
    ev.cond = function (s) {
      if (old && !old.apply(this, arguments)) return false;
      var rl = (s && s.realm) || {}, p = Math.min(max, ((rl.agri || 0) * wA + (rl.store || 0) * wS) / 100);
      return !(p > 0 && Math.random() < p);
    };
  }
  calamity('drought', 0.6, 0.2, 0.5); calamity('flood', 0.5, 0.1, 0.4); calamity('x_famine', 0.4, 0.4, 0.6);

  /* ═════ 수입 항목 ═════ */
  function lvl(v, k, knee) { v = Math.max(0, num(v)); return k[0] * Math.min(v, knee) + k[1] * Math.max(0, v - knee); }
  P.domTier = function () { var e = num(this.s.realm.econ); for (var i = 0; i < CFG.tiers.length; i++) if (e >= CFG.tiers[i].at) return CFG.tiers[i]; return null; };
  P.domNextTier = function () { var e = num(this.s.realm.econ), nx = null; CFG.tiers.forEach(function (t) { if (t.at > e && (!nx || t.at < nx.at)) nx = t; }); return nx; };
  P.domMods = function () {   // 시행 중인 법령의 dom 보정을 합친다
    var m = { goldMul: 0, upkeep: 0 }, self = this;
    Object.keys(this.s.laws || {}).forEach(function (id) { var L = self.lawById(id); if (L && L.dom) for (var k in L.dom) m[k] = (m[k] || 0) + L.dom[k]; });
    return m;
  };
  var _fp = P.foodParts;
  P.foodParts = function () {
    var p = _fp.apply(this, arguments), rl = this.s.realm, res = this.g.state.res, m = this.domMods(), tr = this.domTier(), v;
    if (tr) p.tier = tr.food;
    if ((v = lvl(rl.agri, CFG.agri, CFG.knee))) p.agri = v;
    if ((v = Math.min(Math.max(res.food, 0), CFG.interest.cap) * num(rl.store) * CFG.interest.rate)) p.store = v;
    if (this.g.state.flags && this.g.state.flags.jindae) p.jindae = CFG.jindae;
    if (m.upkeep && p.upkeep < 0) p.save = -p.upkeep * Math.min(0.6, m.upkeep);
    return p;
  };
  var _gp = P.goldParts;
  P.goldParts = function () {
    var p = _gp.apply(this, arguments), rl = this.s.realm, m = this.domMods(), tr = this.domTier(), v;
    if (tr) p.tier = tr.gold;
    if ((v = lvl(rl.trade, CFG.trade, CFG.knee))) p.trade = v;
    if (m.goldMul) p.law = (p.base + num(p.tier) + num(p.trade)) * m.goldMul;
    return p;
  };
  P.domFlows = function () { return { g: sum(this.goldParts()), f: sum(this.foodParts()) }; };

  // 국정 수치를 올릴 때의 한계: ① 농업·상공업·곡창은 100을 넘지 않는다 ② 산업은 70을 넘으면 오르는 폭이 줄어든다(넘치는 만큼은 칩에도 나오지 않는다)
  var _eff = P.eff;
  P.eff = function (e, tgt) {
    if (e && e.realm && (e.realm.agri || e.realm.trade || e.realm.store || e.realm.econ > 0)) {
      var rl = this.s.realm, r2 = Object.assign({}, e.realm), S = CFG.econSoft, ec = num(rl.econ);
      KEYS.forEach(function (k) { if (r2[k] > 0) r2[k] = Math.max(0, Math.min(r2[k], CFG.max - num(rl[k]))); });
      if (r2.econ > 0 && ec > S.from) r2.econ *= clamp(1 - (ec - S.from) / S.span, S.min, 1);
      e = Object.assign({}, e, { realm: r2 });
    }
    return _eff.call(this, e, tgt);
  };

  // 올릴 수 있는 게 이 새 수치뿐인 명령은, 그 수치가 이미 가득 차 있으면 쓸 수 없게 한다(행동력과 금을 헛되이 쓰지 않도록)
  var _ca = P.cmdAvail;
  P.cmdAvail = function (c) {
    var why = _ca.apply(this, arguments); if (why || !c || !c.eff || !c.eff.realm) return why;
    var r = c.eff.realm, gain = Object.keys(r).filter(function (k) { return r[k] > 0; });
    if (gain.length && gain.every(function (k) { return KEYS.indexOf(k) >= 0 && num(this.s.realm[k]) >= CFG.max - 0.5; }, this))
      return L3(gain.map(sl).join('·') + '이 이미 최고 수준입니다', gain.map(sl).join('/') + ' already at maximum', gain.map(sl).join('・') + 'はすでに最大です');
    return why;
  };

  // 해마다: 농업·상공업은 높을수록, 곡창은 70을 넘으면 조금씩 줄어든다(가꾸지 않으면 쇠퇴)
  P.domYear = function () {
    var rl = this.s.realm;
    ['agri', 'trade'].forEach(function (k) { if (rl[k] != null) { var v = rl[k]; if (v > CFG.decay.from) v -= (v - CFG.decay.from) / CFG.decay.div; rl[k] = clamp(v, 0, CFG.max); } });
    if (rl.store != null) { var s = rl.store; if (s > CFG.decay.store) s -= (s - CFG.decay.store) / 40; rl.store = clamp(s, 0, CFG.max); }
  };

  /* ═════ 화면: 내정 현황 ═════ */
  function tip(k) {
    var a = CFG.agri, t = CFG.trade;
    if (k === 'agri') return L3('군량 수입 한 점당 +' + a[0] + ' (50 넘으면 +' + a[1] + '). 높을수록 가뭄·홍수·대기근을 덜 겪습니다. 60을 넘으면 해마다 조금씩 줄어듭니다.',
      'Yearly provisions +' + a[0] + ' per point (+' + a[1] + ' above 50). Higher values mean fewer droughts, floods and famines. Above 60 it slowly declines each year.',
      '軍糧収入は1点につき+' + a[0] + '(50超は+' + a[1] + ')。高いほど干ばつ・洪水・大飢饉が減ります。60を超えると毎年少しずつ下がります。');
    if (k === 'trade') return L3('금 수입 한 점당 +' + t[0] + ' (50 넘으면 +' + t[1] + '). 60을 넘으면 해마다 조금씩 줄어듭니다.',
      'Yearly gold +' + t[0] + ' per point (+' + t[1] + ' above 50). Above 60 it slowly declines each year.',
      '金の収入は1点につき+' + t[0] + '(50超は+' + t[1] + ')。60を超えると毎年少しずつ下がります。');
    return L3('쌓아 둔 군량(최대 ' + CFG.interest.cap + ')에 곡창 점수만큼 환곡 이자가 붙고, 대기근을 덜 겪습니다. 70을 넘으면 해마다 조금씩 줄어듭니다.',
      'Held provisions (up to ' + CFG.interest.cap + ') earn lending interest in proportion to this score, and great famines become rarer. Above 70 it slowly declines each year.',
      '蓄えた軍糧(最大' + CFG.interest.cap + ')に、この点数に応じて還穀の利子がつき、大飢饉も減ります。70を超えると毎年少しずつ下がります。');
  }
  function partsHtml(parts) {
    var out = [];
    ORDER.forEach(function (k) {
      var v = parts[k]; if (!num(v) || Math.abs(v) < 0.05) return;
      var x = LB[k]; out.push('<span class="dom-i"><i>' + L3(x[0], x[1], x[2]) + '</i> <b class="' + (v > 0 ? 'p' : 'm') + '">' + sg(v) + '</b></span>');
    });
    return out.join('');
  }
  P.domPanel = function () {
    var self = this, rl = this.s.realm, gp = this.goldParts(), fp = this.foodParts(), tr = this.domTier(), nt = this.domNextTier();
    var g = Math.round(sum(gp)), f = Math.round(sum(fp));
    var bars = KEYS.map(function (k) { var v = num(rl[k]); return '<div class="rb" title="' + esc(tip(k)) + '"><i>' + sl(k) + '</i><span><u style="width:' + clamp(v, 0, 100) + '%"></u></span><b>' + Math.round(v) + '</b></div>'; }).join('');
    var stage = tr ? tierName(tr) : L3('보통', 'Ordinary', '並');
    var nxt = nt ? ' <small>(' + L3('산업 ' + nt.at + ' → ' + tierName(nt), 'Economy ' + nt.at + ' → ' + tierName(nt), '産業' + nt.at + ' → ' + tierName(nt)) + ')</small>' : '';
    var cls = function (v) { return v < 0 ? 'm' : 'p'; };
    return '<div class="dom"><div class="dom-h"><b>🏛 ' + L3('내정 현황', 'Domestic Affairs', '内政の状況') + '</b><span>' + L3('산업 단계', 'Economy stage', '産業段階') + ' <em class="tier' + (tr ? '' : ' off') + '">' + stage + '</em>' + nxt + '</span></div>' +
      '<div class="dom-b">' + bars + '</div>' +
      '<div class="dom-fc">' + L3('올해 예상 결산', 'Projected year-end', '今年の予想決算') + ' — ' + sl('gold') + ' <b class="' + cls(g) + '">' + (g > 0 ? '+' : '') + g + '</b> · ' + sl('food') + ' <b class="' + cls(f) + '">' + (f > 0 ? '+' : '') + f + '</b> <small>(' + L3('군 유지비 포함', 'army upkeep included', '軍の維持費を含む') + ')</small></div>' +
      '<details class="dom-d"><summary>' + L3('수입 내역 보기', 'Income breakdown', '収入の内訳') + '</summary><div class="dom-l"><u>' + sl('gold') + '</u>' + partsHtml(gp) + '</div><div class="dom-l"><u>' + sl('food') + '</u>' + partsHtml(fp) + '</div></details></div>';
  };

  // 해를 넘길 때의 결산 줄: 내정이 이번 해 수입에 보탠 몫
  P.domNote = function () {
    var gp = this.goldParts(), fp = this.foodParts(), tr = this.domTier(), bits = [];
    function add(label, v, res) { if (Math.abs(v) >= 0.05) bits.push(label + ': ' + res + ' ' + sg(v)); }
    if (tr) bits.push(L3('산업 단계 「', 'Economy stage "', '産業段階「') + tierName(tr) + L3('」', '"', '」') + ': ' + sl('gold') + ' ' + sg(gp.tier) + ', ' + sl('food') + ' ' + sg(fp.tier));
    add(sl('agri'), num(fp.agri), sl('food')); add(sl('trade'), num(gp.trade), sl('gold'));
    add(L3('곡창 이자', 'Granary interest', '穀倉の利子'), num(fp.store), sl('food')); add(L3('진대법', 'Spring loans', '賑貸法'), num(fp.jindae), sl('food'));
    add(L3('법령 효과', 'Law bonus', '法令の効果'), num(gp.law), sl('gold')); add(L3('둔전제 절감', 'Military-farm savings', '屯田制の節減'), num(fp.save), sl('food'));
    return bits.length ? '<br><small>🌾 ' + L3('내정이 보탠 몫', 'Domestic contribution', '内政の寄与') + ' — ' + bits.join(' · ') + '</small>' : '';
  };

  // 명령·법령을 내리고 나면 연간 수지가 얼마나 달라졌는지 바로 보여 준다(군을 늘리면 유지비가 는다는 것도 보인다)
  var _run = P.run;
  P.run = function () {
    var outer = !this._domFc;
    if (outer) this._domFc = this.domFlows();
    try { return _run.apply(this, arguments); } finally { if (outer) this._domFc = null; }
  };
  var _after = P.after;
  P.after = function () {
    var b = this._domFc;
    if (b) {
      this._domFc = null;
      try {
        var n = this.domFlows(), dg = n.g - b.g, df = n.f - b.f;
        if (Math.abs(dg) >= 0.15 || Math.abs(df) >= 0.15) {
          var bit = function (v, res) { return Math.abs(v) >= 0.15 ? sl(res) + ' <b class="' + (v > 0 ? 'p' : 'm') + '">' + sg(v) + '</b>' : ''; };
          var parts = [bit(dg, 'gold'), bit(df, 'food')].filter(Boolean).join(' · ');
          this.s.last = (this.s.last || '') + '<div class="domfc">📈 ' + L3('연간 수지 변화', 'Yearly balance change', '年間収支の変化') + ' — ' + parts + ' <small>(' + L3('금 ' + sr(n.g) + ' · 군량 ' + sr(n.f) + ' / 해', 'gold ' + sr(n.g) + ' · provisions ' + sr(n.f) + ' per year', '金' + sr(n.g) + '・軍糧' + sr(n.f) + ' / 年') + ')</small></div>';
        }
      } catch (e) { }
    }
    return _after.apply(this, arguments);
  };

  // 내정 탭: 분야별 소제목
  var _dc = P.drawChoices;
  P.drawChoices = function () {
    var r = _dc.apply(this, arguments);
    try {
      var list = document.querySelector('#chron .cmdlist'); if (!list) return r;
      var meta = {}; this.cmds().forEach(function (c) { meta[c.id] = c; });
      var last = null;
      [].slice.call(list.children).forEach(function (b) {
        var c = meta[b.getAttribute && b.getAttribute('data-cid')]; if (!c || c.cat !== '내정') return;
        var gp = c.grp || 'court';
        if (gp !== last) { last = gp; var x = GRP[gp] || GRP.court; list.insertBefore(h('div', 'cmdgrp', L3(x[0], x[1], x[2])), b); }
      });
    } catch (e) { }
    return r;
  };

  // 참모의 말: 내정이 약한 곳을 짚어 준다
  P.domAdvice = function () {
    var rl = this.s.realm, res = this.g.state.res, out = [], gf = this.goldFlow(), ff = this.foodFlow(), nt = this.domNextTier(), ec = num(rl.econ);
    if (num(rl.agri) < 25 && ff < 14) out.push(L3('농업 기반이 약해 군량 수입이 빠듯합니다. 「수리 시설 정비」와 「우경·철제 농기구 보급」으로 농업을 키우면 해마다 군량이 늘고 흉년도 덜 겪습니다.',
      'Agriculture is weak and your grain income is thin. Irrigation works and ox plows with iron tools will raise yearly provisions and make famine rarer.', '農業の基盤が弱く、軍糧収入が苦しい状況です。「水利施設の整備」と「牛耕・鉄製農具の普及」で農業を育てれば、毎年の軍糧が増え、凶作にも強くなります。'));
    if (num(rl.trade) < 25 && gf < 16) out.push(L3('상공업이 거의 일지 않았습니다. 「시장 개설」이나 「관영 공방」을 세우면 해마다 금 수입이 늘어납니다.',
      'Commerce has barely begun. Opening markets or founding state workshops will raise your yearly gold income.', '商工業がほとんど興っていません。「市場の開設」や「官営工房」を設ければ、毎年の金の収入が増えます。'));
    if (nt && nt.at - ec > 0 && nt.at - ec <= 8) out.push(L3('산업이 ' + nt.at + '을 넘으면 「' + tierName(nt) + '」 단계에 들어 금·군량 수입이 한층 늘어납니다. 농사 장려나 개간으로 조금만 더 끌어올려 보십시오.',
      'Once your economy passes ' + nt.at + ', it enters the "' + tierName(nt) + '" stage and brings in more gold and provisions. A little more farming promotion or land clearing will get you there.', '産業が' + nt.at + 'を超えると「' + tierName(nt) + '」の段階に入り、金と軍糧の収入がさらに増えます。農耕の奨励や開墾でもう少し押し上げてみましょう。'));
    if (num(rl.store) < 20 && res.food >= 70) out.push(L3('곳간에 곡식이 넉넉한데 곡창이 작아 이자도 못 받고 대기근에도 약합니다. 「곡창 증설」을 고려하십시오.',
      'Your stores are full but the granaries are small, earning no interest and leaving you exposed to great famine. Consider expanding the granaries.', '蔵に穀物は十分ありますが、穀倉が小さいため利子も得られず、大飢饉にも弱い状態です。「穀倉の増設」を検討してください。'));
    return out.length ? out[Math.floor(Math.random() * out.length)] : '';
  };

  /* ═════ 맡긴 정무(자동 진행): 새 수치도 산업과 같은 비중으로 채점한다(단, 효과 대비 점수는 낮춰 과열을 막는다) ═════ */
  var _at = P.autoTemper;
  if (_at) P.autoTemper = function () { var r = _at.apply(this, arguments); if (r && r.m) KEYS.forEach(function (k) { r.m[k] = r.m.econ; }); return r; };
  var _se = P.autoScoreEff, AUTO_W = { agri: 0.45, trade: 0.45, store: 0.25 };
  if (_se) P.autoScoreEff = function (e, cost) {
    if (e && e.realm && (e.realm.agri || e.realm.trade || e.realm.store)) {
      var r = Object.assign({}, e.realm); KEYS.forEach(function (k) { if (r[k]) r[k] *= AUTO_W[k]; });
      e = Object.assign({}, e, { realm: r });
    }
    return _se.call(this, e, cost);
  };
})();
