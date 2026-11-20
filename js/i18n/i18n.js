/* 다국어(한국어·일본어·영어). 원문(한국어)을 키로 하는 사전을 쓰며, 사전에 없는 문장은 한국어 그대로 보인다.
   ① 데이터(명령·사건·장소·인물·시나리오)는 시작할 때 한 번에 번역해 바꿔 둔다.
   ② 화면에 나타나는 글(DOM)·알림창은 실시간으로 번역한다. 숫자는 {n} 으로 바꿔 같은 문장틀로 찾는다.
   ③ 언어를 바꾸면 자동 저장 후 다시 불러와 이어서 한다. */
(function () {
  var KEY = 'samgukwang.lang', KO = /[가-힣]/;
  var LANGS = [['ko', '한국어'], ['ja', '日本語'], ['en', 'English']];
  var I = SG.i18n = SG.i18n || { dict: {} };
  I.langs = LANGS; I.dict.en = I.dict.en || {}; I.dict.ja = I.dict.ja || {};
  I.detect = function () {
    var v = null; try { v = localStorage.getItem(KEY); } catch (e) { }
    if (v === 'ko' || v === 'ja' || v === 'en') return v;
    var n = (navigator.language || 'ko').toLowerCase(); return n.indexOf('ko') === 0 ? 'ko' : n.indexOf('ja') === 0 ? 'ja' : 'en';
  };
  I.lang = I.detect();
  I.add = function (lang, obj) { var d = I.dict[lang] = I.dict[lang] || {}; for (var k in obj) d[k] = obj[k]; };

  /* ── 번역 조회: 정확히 일치 → 숫자 틀 일치 ── */
  var NUM = /\d[\d,]*(?:\.\d+)?/g;
  function fill(tr, nums) { var i = 0; return tr.replace(/\{(n|\d+)\}/g, function (m, k) { var v = k === 'n' ? nums[i++] : nums[+k - 1]; return v == null ? '' : v; }); }
  I.t = function (s) {
    if (I.lang === 'ko' || typeof s !== 'string' || !KO.test(s)) return s;
    var d = I.dict[I.lang]; if (!d) return s;
    var r = d[s]; if (r != null) return r;
    var nums = [], t = s.replace(NUM, function (m) { nums.push(m); return '{n}'; });
    if (nums.length) { r = d[t]; if (r != null) return fill(r, nums); }
    // HTML 조각: 태그는 그대로 두고 글 부분만 번역
    if (s.indexOf('<') >= 0 && /<\/?[a-z][^>]*>/i.test(s)) {
      var hp = s.split(/(<[^>]*>)/), hc = false;
      var ho = hp.map(function (x) { if (!x || x.charAt(0) === '<' || !KO.test(x)) return x; var y = I.t(x); if (y !== x) hc = true; return y; });
      return hc ? ho.join('') : s;
    }
    var core = s.trim(); if (core !== s && core) { var c2 = I.t(core); if (c2 !== core) return s.replace(core, c2); }
    var rs = I.rules[I.lang] || [];
    for (var i = 0; i < rs.length; i++) { var m = s.match(rs[i][0]); if (m) { var o = rs[i][1](m); if (o != null) return o; } }
    // 여러 문장이 붙은 글은 문장별로 번역
    if (s.length > 20 && /[.!?]\s/.test(s)) {
      var sn = s.split(/(?<=[.!?])\s+/);
      if (sn.length > 1) { var sc = false, so = sn.map(function (x) { var y = I.t(x); if (y !== x) sc = true; return y; }); if (sc) return so.join(I.lang === 'ja' ? '' : ' '); }
    }
    // 「A · B · C」「A — B」 처럼 이어 붙인 문장은 조각별로 번역
    var seps = [' · ', ' — ', ' / '];
    for (var j = 0; j < seps.length; j++) {
      if (s.indexOf(seps[j]) > 0) { var parts = s.split(seps[j]), ch = false, out = parts.map(function (x) { var y = I.t(x); if (y !== x) ch = true; return y; }); if (ch) return out.join(seps[j]); }
    }
    return s;
  };
  I.rules = { en: [], ja: [] };
  // 규칙: 정규식 + 템플릿($1..$9 는 그 자리의 글을 다시 번역해서 끼움)
  I.rule = function (lang, re, tpl) { I.rules[lang].push([re, function (m) { return tpl.replace(/\$(\d)/g, function (x, k) { return m[+k] == null ? '' : I.t(m[+k]); }); }]); };

  /* ── ① 데이터 번역 (표시용 키만) ── */
  var SHOW = { name: 1, desc: 1, title: 1, text: 1, label: 1, hint: 1, result: 1, lines: 1, era: 1, sub: 1, note: 1, src: 1, bio: 1, modern: 1, organization: 1, real: 1, mine: 1, traits: 1, hegemon: 1, steady: 1, prosper: 1, intro: 1, body: 1, role: 1, basis: 1 };
  function conv(v) { return typeof v === 'string' ? I.t(v) : Array.isArray(v) ? v.map(conv) : v; }
  function walk(o, seen) {
    if (!o || typeof o !== 'object' || seen.indexOf(o) >= 0) return; seen.push(o);
    if (Array.isArray(o)) { for (var i = 0; i < o.length; i++) { if (o[i] && typeof o[i] === 'object') walk(o[i], seen); } return; }
    for (var k in o) { var v = o[k]; if (SHOW[k] && (typeof v === 'string' || Array.isArray(v))) o[k] = conv(v); else if (v && typeof v === 'object') walk(v, seen); }
  }
  // 줄여 쓰는 이름(사비성→사비, 한성(위례성)→한성)도 같이 번역되게 파생
  I.derive = function () {
    var d = I.dict[I.lang]; if (!d) return;
    Object.keys(d).forEach(function (k) {
      if (!/^[가-힣]/.test(k) || k.length > 14 || /[ ·—]/.test(k)) return;
      var v = d[k], base = k.replace(/\(.*\)$/, ''), tv = v.replace(/\s*[\(（].*[\)）]$/, '').replace(/ (Fortress|Pass|Seong)$/, '').replace(/성$/, '');
      var cand = [base]; if (/성$/.test(base) && base.length > 2) cand.push(base.slice(0, -1));
      cand.forEach(function (c) { if (c && d[c] == null && c.length >= 2) d[c] = tv; });
    });
  };
  // 시나리오 글: 추출 순서(번역 파일의 배열 순서)대로 한국어 원문과 짝지어 사전에 넣는다
  I.sc = { en: {}, ja: {} };
  I.scAdd = function (lang, id, arr) { I.sc[lang][id] = (I.sc[lang][id] || []).concat(arr); };
  I.scStrings = function (id, seen) {
    var out = [], set = {}; seen = seen || [];
    function add(s) { if (typeof s === 'string' && KO.test(s) && !set.hasOwnProperty(s)) { set[s] = 1; out.push(s); } }
    function w(o) {
      if (!o || typeof o !== 'object' || seen.indexOf(o) >= 0) return; seen.push(o);
      if (Array.isArray(o)) { o.forEach(function (x) { if (typeof x === 'string') add(x); else w(x); }); return; }
      for (var k in o) { var v = o[k]; if (SHOW[k] && typeof v === 'string') add(v); else if (SHOW[k] && Array.isArray(v)) v.forEach(function (x) { if (typeof x === 'string') add(x); else w(x); }); else if (v && typeof v === 'object') w(v); }
    }
    w(SG.scenarios[id]); return out;
  };
  I.applySc = function () {
    var tr = I.sc[I.lang] || {}, d = I.dict[I.lang]; if (!d) return;
    // 모든 시나리오는 같은 seen 을 공유하므로 추출은 한 번에 순서대로
    var seen = [];
    Object.keys(SG.scenarios).forEach(function (id) {
      var ko = I.scStrings(id, seen), arr = tr[id]; if (!arr) return;
      if (ko.length !== arr.length) { if (window.console) console.warn('i18n sc mismatch', id, ko.length, arr.length); return; }
      ko.forEach(function (s, i) { if (arr[i]) d[s] = arr[i]; });
    });
  };
  I.localizeData = function () {
    if (I.lang === 'ko') return; I.derive(); I.applySc();
    walk(SG.data, []); walk(SG.scenarios, []);
    if (SG.sideName) for (var k in SG.sideName) SG.sideName[k] = I.t(SG.sideName[k]);
  };

  /* ── 나라 이름 치환({rival} 등)과 사건·페이지 문구 ── */
  var P = SG.Sandbox && SG.Sandbox.prototype;
  if (P) {
    var _L = P.L;
    P.L = function (t) {
      if (I.lang === 'ko') return _L.call(this, t);
      if (t == null) return t;
      var n = this.names, tr = I.t(String(t));
      var nm = function (k) { return String(n[k] || '').replace('(멸망)', '').trim(); };
      var map = { rival: I.t(nm('silla')), ally: I.t(nm('goguryeo')), great: I.t(nm('tang')), far: I.t(nm('wa')), cap: I.t(this.cfg.cap || '도성'), me: I.t(this.cfg.country || '우리') };
      return tr.replace(/\{(rival|ally|great|far|cap|me)\}(으로|은|는|이|가|을|를|과|와|로)?/g, function (m, k) { return map[k]; });
    };
  }
  var G = SG.Game && SG.Game.prototype;
  if (G) {
    var _page = G.page, _choices = G.choices;
    G.page = function (p) {
      if (I.lang !== 'ko' && p) { p = Object.assign({}, p); p.era = I.t(p.era); p.title = I.t(p.title); p.note = I.t(p.note); p.src = I.t(p.src); if (p.body) p.body = p.body.map(I.t); }
      return _page.call(this, p);
    };
    G.choices = function (list) {
      if (I.lang !== 'ko' && list) list = list.map(function (x) { if (!x || !x.c) return x; var c = Object.assign({}, x.c); c.label = I.t(c.label); c.hint = I.t(c.hint); return Object.assign({}, x, { c: c }); });
      return _choices.call(this, list);
    };
  }

  /* ── ② 화면 번역 ── */
  function trText(n) { var s = n.nodeValue; if (!s || !KO.test(s)) return; var r = I.t(s); if (r !== s) n.nodeValue = r; }
  var ATTR = ['title', 'placeholder', 'aria-label', 'alt'];
  function trEl(el) {
    if (el.nodeType !== 1) return; var tag = el.tagName; if (tag === 'SCRIPT' || tag === 'STYLE') return;
    ATTR.forEach(function (a) { var v = el.getAttribute && el.getAttribute(a); if (v && KO.test(v)) { var r = I.t(v); if (r !== v) el.setAttribute(a, r); } });
  }
  function sweep(root) {
    if (!root) return;
    if (root.nodeType === 3) return trText(root);
    if (root.nodeType !== 1) return;
    trEl(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ALL, null), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) trText(n); else trEl(n); }
  }
  I.sweep = sweep;
  function start() {
    if (I.lang === 'ko') return;
    sweep(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'characterData') trText(m.target);
        else if (m.type === 'attributes') trEl(m.target);
        else m.addedNodes.forEach(sweep);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR });
    ['alert', 'confirm', 'prompt'].forEach(function (f) { var o = window[f]; window[f] = function (m) { arguments[0] = I.t(String(m)); return o.apply(window, arguments); }; });
    document.documentElement.lang = I.lang; document.title = I.t(document.title);
  }

  /* ── ③ 언어 선택 ── */
  I.set = function (lang) {
    try { localStorage.setItem(KEY, lang); if (SG.game && SG.game.sb && document.querySelector('#title').style.display === 'none') localStorage.setItem('samgukwang.resume', '1'); } catch (e) { }
    location.reload();
  };
  function selector() {
    var s = document.createElement('select'); s.className = 'langsel'; s.title = 'Language / 言語 / 언어';
    LANGS.forEach(function (l) { var o = document.createElement('option'); o.value = l[0]; o.textContent = l[1]; if (l[0] === I.lang) o.selected = true; s.appendChild(o); });
    s.onchange = function () { I.set(s.value); }; return s;
  }
  window.addEventListener('DOMContentLoaded', function () {
    I.localizeData();
    var hud = document.getElementById('hud');
    if (hud) hud.appendChild(selector());
    var t = document.querySelector('#title > div'); if (t) { var w = document.createElement('div'); w.className = 'lang-top'; w.appendChild(selector()); t.insertBefore(w, t.firstChild); }
    start();
    try { if (localStorage.getItem('samgukwang.resume')) { localStorage.removeItem('samgukwang.resume'); setTimeout(function () { if (SG.save && SG.save.read()) SG.save.load(); }, 300); } } catch (e) { }
  });
})();
