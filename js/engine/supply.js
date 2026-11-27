/* 군량 시장: 금으로 군량을 사들인다 (게임 추상화 — 사료 수치가 아니다)
 *  - 내정 명령 「군량 구입」: 창에서 사들일 양을 고르면 시세대로 금이 나간다. 횟수·양에 정해진 한계는 없다(행동력 1씩) — 한계는 가진 금과 오르는 값이다.
 *  - 시세: 산업이 발달할수록 싸고, 풍·흉년과 곳간 사정(급할수록 비쌈)에 따라 오르내린다. 많이 살수록 값이 오른다.
 *  - 병력 대량 구입(forces.js)이 군량 비축 때문에 막혔을 때의 해결책이기도 하다.
 *  - 창이 열리는 명령이라 자동 진행·성공률 계산에서는 빠진다(needs: 'grain').
 * 문장은 함수 안에서 L3()로 지금 언어에 맞춰 고르고, 명령의 이름·설명만 T()로 번역 사전에 올린다(파일을 읽을 때 한 번). */
(function () {
  var P = SG.Sandbox.prototype;
  var TR = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
  function T(k, e, j) { TR.en[k] = e; TR.ja[k] = j; var I = SG.i18n; if (I && I.dict && I.dict.en) { I.dict.en[k] = e; I.dict.ja[k] = j; } return k; }
  function L3(ko, en, ja) { var l = SG.i18n && SG.i18n.lang; return l === 'en' ? en : l === 'ja' ? ja : ko; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function $(s, r) { return (r || document).querySelector(s); }
  var CFG = SG.SUPPLY = {
    gpf: 0.5,         // 평년·산업 50일 때 군량 1을 사는 데 드는 금
    slip: 0.004,      // 많이 살수록 오르는 값: 한 번에 100을 사면 평균 20% 비싸다
    maxBuy: Infinity, // 한 번에 살 수 있는 최대량 — 정해진 한계 없음(가진 금이 한계). 숫자를 넣으면 그만큼으로 제한된다
    minBuy: 10,
    minGold: 6,       // 시장을 여는 데 필요한 최소한의 금
    keepGold: 3,      // 사고 나서도 남겨 둘 금
    full: Infinity    // 곳간이 이만큼 차 있으면 더 살 수 없다 — 정해진 한계 없음. 숫자를 넣으면 그만큼으로 제한된다
  };
  var NAME = T('군량 구입', 'Buy Grain', '軍糧の購入');

  /* ── 명령 ── */
  SG.data.commands = (SG.data.commands || []).concat([{
    id: 'buy_grain', cat: '내정', hist: '가상', needs: 'grain', cost: { gold: CFG.minGold }, eff: {},
    name: NAME,
    desc: T('금을 내고 시장에서 군량을 사들입니다. 사들일 양은 창에서 고르며(횟수·양 제한 없이 가진 금이 허락하는 만큼), 시세는 산업·풍흉·곳간 사정에 따라 오르내리고 많이 살수록 비싸집니다.', 'Pay gold to buy grain on the market. You pick the amount in a window (no cap on how often or how much - as far as your gold goes); prices follow industry, harvests and how empty the granary is, and rise the more you buy.', '金を払って市場で軍糧を買い入れます。量はウィンドウで選び(回数・量の上限なし、持っている金の許す限り)、相場は産業・豊凶・倉の事情で動き、多く買うほど高くなります。'),
    lines: [T('상인들이 곡식 수레를 끌고 와 창고를 채웠습니다.', 'Merchants drove in grain carts and filled the granaries.', '商人たちが穀物の荷車を引いて来て、倉を満たしました。'),
      T('관청 창고와 큰 상인들에게서 곡식을 사들여 곳간을 채웠습니다.', 'Grain bought from state granaries and big merchants filled the stores.', '官の倉と大商人から穀物を買い入れ、蔵を満たしました。')]
  }]);

  /* ── 시세 ── */
  P.grainQuote = function () {
    var s = this.s, rl = s.realm, res = this.g.state.res, k = (String(this.cfg.id || '').length * 7 + s.year * 31 + 3) * 12.9898;
    var r = Math.abs(Math.sin(k) * 43758.5453) % 1;                                       // 풍흉은 해마다 정해진다(같은 해에는 같다)
    var harv = r < 0.22 ? 'good' : r > 0.8 ? 'bad' : 'avg', hv = harv === 'good' ? 0.88 : harv === 'bad' ? 1.2 : 1;
    var ec = clamp(1.22 - rl.econ / 230, 0.85, 1.2), need = res.food < 20 ? 1.15 : res.food < 40 ? 1.05 : 1;
    return { pg: CFG.gpf * ec * need * hv, harv: harv, ec: ec, need: need };
  };
  P.grainCost = function (Q, q) { q = q || this.grainQuote(); return Math.ceil(q.pg * (Q + CFG.slip * Q * Q / 2)); };
  P.grainMax = function (q) {
    q = q || this.grainQuote();
    var gold = this.g.state.res.gold - CFG.keepGold, cap = Math.floor(Math.min(CFG.maxBuy, CFG.full - this.g.state.res.food) / 5) * 5;
    if (gold <= 0 || cap < CFG.minBuy) return 0;
    var Q = (Math.sqrt(1 + 2 * CFG.slip * gold / q.pg) - 1) / CFG.slip;                     // pg·(Q + slip·Q²/2) = 금
    Q = Math.min(cap, Math.floor(Q / 5) * 5); while (Q > 0 && this.grainCost(Q, q) > gold) Q -= 5;
    return Q;
  };

  var _ca = P.cmdAvail;
  P.cmdAvail = function (c) {
    var why = _ca.apply(this, arguments); if (why || !c || c.id !== 'buy_grain') return why;
    var res = this.g.state.res;
    if (res.food >= CFG.full - CFG.minBuy) return L3('곳간이 가득 차 있습니다', 'The granary is already full', '倉はすでに満杯です');
    if (this.grainMax() < CFG.minBuy) return L3('살 수 있는 금이 모자랍니다', 'Not enough gold to buy any', '買うための金が足りません');
    return why;
  };
  var _ct = P.costText;
  P.costText = function (c) {
    if (c && c.id === 'buy_grain') return L3('금 시세대로 · 행동력 ', 'gold at market price · action ', '金は相場どおり・行動力 ') + (c.ap || 1);
    return _ct.apply(this, arguments);
  };

  /* ── 시장 창 ── */
  var _run = P.run;
  P.run = function (c, opt) {
    opt = opt || {};
    if (c && c.needs === 'grain' && !opt.market) {
      var w = this.cmdAvail(c); if (w) { this.s.last = L3('지금은 할 수 없습니다 — ', 'Not possible right now — ', '今はできません — ') + w; return this.renderTurn(); }
      return this.grainUI(c);
    }
    return _run.call(this, c, opt);
  };
  P.grainUI = function (c) {
    var self = this, g = this.g, res = g.state.res, q = this.grainQuote(), max = this.grainMax(q), army = this.armyTotal(), fl = this.foodFlow ? this.foodFlow() : 0;
    var wrap = h('div', 'modal dock'), card = h('div', 'card');
    var harvTxt = q.harv === 'good' ? L3('풍년이라 곡식이 쌉니다', 'a bumper harvest keeps grain cheap', '豊作で穀物が安い') : q.harv === 'bad' ? L3('흉년이라 곡식이 귀합니다', 'a poor harvest makes grain dear', '凶作で穀物が高い') : L3('평년 시세입니다', 'an ordinary year', '平年並みの相場');
    card.innerHTML = '<h2>🌾 ' + L3('군량 시장', 'Grain Market', '軍糧市場') + '</h2>' +
      '<div class="sub">' + L3('상인과 관청 창고에서 곡식을 사들입니다. 횟수·양에 제한은 없고(행동력 1씩), 가진 금이 허락하는 만큼 살 수 있습니다. 많이 살수록 값이 오릅니다.', 'Buy grain from merchants and state granaries. There is no cap on how often or how much (one action each time) - your gold is the limit. The more you buy, the higher the price.', '商人と官の倉から穀物を買い入れます。回数・量の上限はなく(行動力1ずつ)、持っている金の許す限り買えます。多く買うほど値が上がります。') + '</div>' +
      '<div class="note">🌾 <b>' + L3('시세', 'Price', '相場') + '</b> ' + L3('금 1당 군량 약 ', '1 gold buys about ', '金1で軍糧およそ') + (1 / q.pg).toFixed(2) + ' — ' + harvTxt +
      (q.ec < 0.97 ? L3(' · 산업이 발달해 값이 내렸습니다', ' · industry has lowered prices', ' ・産業の発達で値が下がりました') : q.ec > 1.03 ? L3(' · 산업이 약해 값이 비쌉니다', ' · weak industry keeps prices high', ' ・産業が弱く値が高いです') : '') +
      (q.need > 1 ? L3(' · 곳간이 비어 상인들이 값을 올렸습니다', ' · merchants raised prices as your granary runs low', ' ・倉が空で商人が値を上げました') : '') + '</div>' +
      '<div class="note">' + L3('지금 군량 ', 'Grain now ', '今の軍糧 ') + '<b>' + Math.floor(res.food) + '</b> · ' + L3('금 ', 'gold ', '金 ') + '<b>' + Math.floor(res.gold) + '</b> · ' + L3('병력 ' + army.toLocaleString() + '명일 때 해마다 군량 ', 'with ' + army.toLocaleString() + ' troops, yearly grain ', '兵力' + army.toLocaleString() + '名で年間の軍糧 ') + '<b>' + (fl > 0 ? '+' : '') + fl + '</b></div>' +
      '<div class="row" style="grid-template-columns:90px 1fr 70px"><div><b>' + L3('구입량', 'Amount', '購入量') + '</b></div><input type="range" id="gm-r" min="' + CFG.minBuy + '" max="' + max + '" step="5" value="' + Math.min(max, Math.max(CFG.minBuy, Math.ceil(Math.max(40, -fl * 4 + 20) / 5) * 5)) + '"><div class="v" id="gm-v"></div></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:4px 0"><button class="btn" id="gm-a">' + L3('적자 3년분', '3 years of deficit', '赤字3年分') + '</button><button class="btn" id="gm-b">' + L3('최대(금 거의 전부)', 'Max (nearly all gold)', '最大(金ほぼ全部)') + '</button></div>' +
      '<div class="note" id="gm-q"></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button class="btn" id="gm-x">' + L3('취소 (행동력은 쓰이지 않음)', 'Cancel (no action spent)', '取消(行動力は使われません)') + '</button><button class="btn pri" id="gm-ok">' + L3('구입', 'Buy', '購入') + '</button></div>';
    var rng = $('#gm-r', card);
    function upd() {
      var Q = +rng.value, G = self.grainCost(Q, q);
      $('#gm-v', card).textContent = '+' + Q;
      $('#gm-q', card).innerHTML = L3('금 <b>' + G + '</b>을 내고 군량 <b>+' + Q + '</b> (평균 금 1당 ' + (Q / G).toFixed(2) + ') → 군량 ' + Math.floor(res.food) + ' → <b>' + Math.floor(res.food + Q) + '</b> · 금 ' + Math.floor(res.gold) + ' → <b>' + Math.floor(res.gold - G) + '</b>',
        'Pay <b>' + G + '</b> gold for <b>+' + Q + '</b> grain (avg ' + (Q / G).toFixed(2) + ' per gold) → grain ' + Math.floor(res.food) + ' → <b>' + Math.floor(res.food + Q) + '</b> · gold ' + Math.floor(res.gold) + ' → <b>' + Math.floor(res.gold - G) + '</b>',
        '金<b>' + G + '</b>で軍糧<b>+' + Q + '</b>(平均 金1あたり' + (Q / G).toFixed(2) + ') → 軍糧 ' + Math.floor(res.food) + ' → <b>' + Math.floor(res.food + Q) + '</b> ・ 金 ' + Math.floor(res.gold) + ' → <b>' + Math.floor(res.gold - G) + '</b>');
    }
    rng.oninput = upd; upd();
    $('#gm-a', card).onclick = function () { rng.value = clamp(Math.ceil(Math.max(30, -fl * 3) / 5) * 5, CFG.minBuy, max); upd(); };
    $('#gm-b', card).onclick = function () { rng.value = max; upd(); };
    $('#gm-x', card).onclick = function () { wrap.remove(); self.renderTurn(); };
    $('#gm-ok', card).onclick = function () { var Q = +rng.value; wrap.remove(); self.grainBuy(Q, c, q); };
    wrap.appendChild(card); g.root.appendChild(wrap);
  };
  /* 실제 구입: 값을 금액으로 못 박은 사본 명령으로 실행한다(명령의 비용·행동력·재사용 규칙을 그대로 따른다). quiet 이면 화면을 다시 그리지 않는다(맡긴 정무용) */
  P.grainBuy = function (Q, c, q, quiet) {
    var self = this, G = this.grainCost(Q, q), per = (Q / G).toFixed(2);
    c = c || SG.data.commands.filter(function (x) { return x.id === 'buy_grain'; })[0];
    var c2 = Object.assign({}, c, {
      needs: null, cost: { gold: G },
      fn: function () { return { fx: { food: Q }, text: L3('평균 시세는 금 1당 군량 ' + per + '입니다.', 'The price averaged ' + per + ' grain per gold.', '平均相場は金1あたり軍糧' + per + 'です。') }; }
    });
    if (!quiet) return this.run(c2, { market: true });
    this.renderTurn = function () { };
    try { this.run(c2, { market: true }); } finally { delete this.renderTurn; }
  };

  /* 맡긴 정무(자동 진행): 곳간이 곧 바닥날 형편이면 시장에서 알아서 사들인다 — 안 그러면 군이 클 때 군량이 0이 되어 병사가 이탈한다 */
  var _as = P.autoSpend;
  if (_as) P.autoSpend = function (mode) {
    try {
      var s = this.s, res = this.g.state.res, ff = this.foodFlow(), c = SG.data.commands.filter(function (x) { return x.id === 'buy_grain'; })[0];
      if (c && s.ap > 0 && res.food < Math.max(22, -ff * 2) && !this.cmdAvail(c)) {
        var q = this.grainQuote(), Q = clamp(Math.ceil((-ff * 3 + 25) / 5) * 5, 20, 120), mx = this.grainMax(q);
        Q = Math.min(Q, mx); while (Q >= 20 && res.gold - this.grainCost(Q, q) < 10) Q -= 5;   // 금고까지 비우지는 않는다
        if (Q >= 20) {
          this.grainBuy(Q, c, q, true);
          this.autoLog = this.autoLog || { from: s.year, names: {} };
          var nm = this.L(c.name); this.autoLog.names[nm] = (this.autoLog.names[nm] || 0) + 1;
        }
      }
    } catch (e) { }
    return _as.apply(this, arguments);
  };
})();
