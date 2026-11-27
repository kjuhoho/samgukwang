/* 의견·제보 게시판: 타이틀 오른쪽 위의 「💬 의견·제보」 버튼과 게임 화면 위쪽의 💬 버튼에서 바로 열린다.
 *  - 글 종류(의견·오류 제보·질문·기타) 고르고 → 내용(최대 1000자) 쓰고 → 「보내기」. 운영자에게만 전달된다(Firestore 'feedback' 컬렉션, 쓰기 전용 — 규칙은 tools/firebase/firestore.rules).
 *  - 「게임 상황도 함께 보내기」(기본 켜짐): 언어·화면 크기·브라우저·지금 하는 왕과 연도·최근 자바스크립트 오류 기록. 이름·이메일·계정 정보는 보내지 않는다.
 *  - 보내지 못하면(오프라인·서버 설정 전) 글을 이 기기의 「내가 보낸 글」에 보관하고, 복사하기·GitHub 이슈로 남기기 길을 안내한다. 쓰던 글은 닫아도 임시 저장된다.
 *  - 도배 방지: 이 기기에서 20초에 1건, 하루 10건까지.
 *  글은 모두 L3(ko, en, ja)로 지금 언어에 맞춰 고른다. */
(function () {
  var SITE = window.SITE || {};
  var B = SG.board = { errs: [] };
  var MAX = 1000, MIN = 5;
  var K = { draft: 'samgukwang.fb.draft', mine: 'samgukwang.fb.mine', log: 'samgukwang.fb.log' };
  var CATS = {
    idea: { ic: '💡', n: ['의견', 'Idea', 'ご意見'], hint: ['예) 이런 기능이 있으면 좋겠어요 / 이 부분이 불편했어요', 'e.g. I would love a feature like... / This part felt awkward', '例) こんな機能があると嬉しい / ここが使いにくかった'] },
    bug: { ic: '🐞', n: ['오류 제보', 'Bug', '不具合'], hint: ['어느 화면에서, 무엇을 눌렀더니, 어떻게 되었는지 적어 주세요. (기대한 모습과 실제 모습)', 'Which screen, what you clicked, and what happened (what you expected vs. what you saw).', 'どの画面で、何を押して、どうなったか(期待した動きと実際の動き)を書いてください。'] },
    ask: { ic: '❓', n: ['질문', 'Question', '質問'], hint: ['궁금한 점을 적어 주세요.', 'Ask anything about the game.', '気になることを書いてください。'] },
    etc: { ic: '✍', n: ['기타', 'Other', 'その他'], hint: ['자유롭게 적어 주세요.', 'Write anything you like.', '自由にお書きください。'] }
  };

  function $(s, r) { return (r || document).querySelector(s); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function L3(ko, en, ja) { var l = SG.i18n && SG.i18n.lang; return l === 'en' ? en : l === 'ja' ? ja : ko; }
  function T3(a) { return L3(a[0], a[1], a[2]); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(t) { var d = new Date(t || 0); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  /* ── 최근 오류 기록(오류 제보에 함께 보낸다). 이 파일이 일찍 불러와지므로 뒤에 오는 파일의 오류도 잡힌다 ── */
  function pushErr(m) {
    m = String(m || '').replace(/\s+/g, ' ').slice(0, 200); if (!m) return;
    var a = B.errs; if (a.length && a[a.length - 1] === m) return; a.push(m); if (a.length > 3) a.shift();
  }
  window.addEventListener('error', function (e) { try { if (e && e.message) pushErr(e.message + (e.filename ? ' @' + String(e.filename).split('/').pop().split('?')[0] + ':' + (e.lineno || 0) : '')); } catch (x) { } });
  window.addEventListener('unhandledrejection', function (e) { try { var r = e && e.reason; pushErr('promise: ' + ((r && (r.message || r.code)) || r)); } catch (x) { } });

  /* ── 함께 보내는 정보 ── */
  function browser() {
    var ua = navigator.userAgent || '', f = [['Edg', 'Edge'], ['OPR', 'Opera'], ['Firefox', 'Firefox'], ['Chrome', 'Chrome'], ['Safari', 'Safari']], i, m, name = 'other';
    for (i = 0; i < f.length; i++) { m = new RegExp(f[i][0] + '/([0-9]+)').exec(ua); if (m) { name = f[i][1] + ' ' + m[1]; break; } }
    return name + (/Windows/.test(ua) ? ' / Win' : /Android/.test(ua) ? ' / Android' : /iPhone|iPad/.test(ua) ? ' / iOS' : /Mac/.test(ua) ? ' / Mac' : /Linux/.test(ua) ? ' / Linux' : '');
  }
  function ctxInfo() {
    var o = { lang: (SG.i18n && SG.i18n.lang) || 'ko', ver: String((window.__sgBoot && window.__sgBoot.V) || '').slice(0, 24), scr: window.innerWidth + 'x' + window.innerHeight, mob: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || ''), ua: browser().slice(0, 60) };
    try {
      var sb = SG.game && SG.game.sb, tt = $('#title');
      if (sb && sb.s && tt && getComputedStyle(tt).display === 'none') { var who = $('#hud .who b'); o.ctx = ((who && who.textContent) || '').trim() + ' ' + sb.s.year; }
    } catch (e) { }
    if (B.errs.length) o.err = B.errs.join(' | ').slice(0, 600);
    return o;
  }
  function ctxLines(c) {
    var lab = { lang: ['언어', 'Language', '言語'], ver: ['버전', 'Version', 'バージョン'], scr: ['화면 크기', 'Screen size', '画面サイズ'], mob: ['기기', 'Device', '端末'], ua: ['브라우저', 'Browser', 'ブラウザ'], ctx: ['게임 상황', 'Game state', 'ゲームの状況'], err: ['최근 오류 기록', 'Recent errors', '最近のエラー'] }, out = [];
    ['lang', 'ver', 'scr', 'mob', 'ua', 'ctx', 'err'].forEach(function (k) {
      if (c[k] == null || c[k] === '') return;
      var v = k === 'mob' ? (c.mob ? L3('휴대폰·태블릿', 'Phone / tablet', 'スマホ・タブレット') : L3('컴퓨터', 'Computer', 'パソコン')) : c[k];
      out.push('<b>' + T3(lab[k]) + '</b> ' + esc(v));
    });
    return out;
  }
  function payload(cat, msg, withCtx) {
    var d = { v: 1, cat: cat, msg: msg };
    if (withCtx) { var c = ctxInfo(); Object.keys(c).forEach(function (k) { if (c[k] !== '' && c[k] != null) d[k] = c[k]; }); }
    return d;
  }

  /* ── 보내기 · 도배 방지 · 내가 보낸 글 ── */
  function send(d) {
    var A = SG.account;
    return new Promise(function (res, rej) {
      if (!A || !A.sendFeedback) { rej({ code: 'feedback/unavailable' }); return; }
      var done = false, t = setTimeout(function () { if (!done) { done = true; rej({ code: 'feedback/timeout' }); } }, 12000);
      A.sendFeedback(d).then(function () { if (!done) { done = true; clearTimeout(t); res(); } }, function (e) { if (!done) { done = true; clearTimeout(t); rej(e || {}); } });
    });
  }
  function recent() { var now = Date.now(); return lsGet(K.log, []).filter(function (t) { return typeof t === 'number' && now - t < 864e5; }); }
  function tooFast() { var a = recent(); if (a.length && Date.now() - a[a.length - 1] < 20000) return 'fast'; if (a.length >= 10) return 'many'; return ''; }
  function logSend() { var a = recent(); a.push(Date.now()); lsSet(K.log, a.slice(-20)); }
  function upsertMine(m) {
    var a = lsGet(K.mine, []).filter(function (x) { return x && x.id !== m.id; }); a.unshift(m); lsSet(K.mine, a.slice(0, 20));
  }
  function reason(e) {
    var c = String((e && (e.code || e.message)) || '');
    if (/permission-denied/.test(c)) return L3('아직 글을 받을 준비가 끝나지 않았습니다(관리자 설정 필요). 글은 이 기기에 보관했으니, 아래 「복사」나 「GitHub」로 남겨 주세요.', 'The board is not ready to receive posts yet (the site owner still needs to finish setup). Your post is kept on this device - please use "Copy" or "GitHub" below.', 'まだ投稿を受け付ける準備ができていません(管理者の設定が必要)。内容はこの端末に保管しました。下の「コピー」か「GitHub」をご利用ください。');
    if (/timeout|unavailable|network|offline/.test(c)) return L3('인터넷에 연결되지 않았거나 서버가 응답하지 않습니다. 글은 이 기기에 보관했으니, 연결된 뒤 다시 보내 주세요.', 'You seem to be offline, or the server did not respond. Your post is kept on this device - please send it again once you are connected.', 'インターネットに接続されていないか、サーバーが応答しません。内容はこの端末に保管しました。接続後にもう一度送ってください。');
    return L3('보내지 못했습니다. 글은 이 기기에 보관했습니다. 잠시 뒤 다시 시도하거나 아래 「복사」·「GitHub」를 이용해 주세요.', 'Could not send. Your post is kept on this device. Try again shortly, or use "Copy" / "GitHub" below.', '送信できませんでした。内容はこの端末に保管しました。しばらくしてからもう一度試すか、下の「コピー」「GitHub」をご利用ください。') + (c ? ' (' + esc(c.replace(/^[a-z]+\//, '').slice(0, 40)) + ')' : '');
  }
  function copyText(text, btn) {
    var F = SG.feats;
    if (F && F.copy) { F.copy(text, btn); return; }
    try { navigator.clipboard.writeText(text); } catch (e) { }
  }
  function ghUrl(cat, msg) {
    var base = SITE.FEEDBACK_URL || 'https://github.com/kjuhoho/samgukwang/issues/new';
    if (!msg) return base;
    var t = '[' + T3(CATS[cat].n) + '] ' + msg.replace(/\s+/g, ' ').slice(0, 50);
    return base + (base.indexOf('?') < 0 ? '?' : '&') + 'title=' + encodeURIComponent(t) + '&body=' + encodeURIComponent(msg.slice(0, 1500));
  }

  /* ── 화면 ── */
  B.open = function (opt) {
    opt = opt || {};
    if ($('.modal.fb')) return;
    var root = (SG.game && SG.game.root) || $('#app') || document.body;
    var wrap = h('div', 'modal top fb'), card = h('div', 'card fbcard'), body, dr = lsGet(K.draft, null);
    var st = { tab: opt.tab || 'w', cat: opt.cat && CATS[opt.cat] ? opt.cat : 'idea', rid: newId(), msg: '', ctx: true, sent: false };
    if (dr && typeof dr.msg === 'string' && dr.msg) { st.msg = dr.msg.slice(0, MAX); if (CATS[dr.cat] && !opt.cat) st.cat = dr.cat; st.rid = dr.rid || st.rid; }
    wrap.appendChild(card); root.appendChild(wrap);
    function close() { document.removeEventListener('keydown', onKey); wrap.remove(); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    wrap.onmousedown = function (e) { if (e.target === wrap) close(); };
    function saveDraft() { var ta = $('#fb-t', card); if (ta) st.msg = ta.value; lsSet(K.draft, st.msg.trim() ? { cat: st.cat, msg: st.msg, rid: st.rid } : null); }

    function render() {
      var mine = lsGet(K.mine, []);
      card.innerHTML = '<h2>💬 ' + L3('의견·제보 게시판', 'Feedback & Bug Reports', 'ご意見・不具合報告') + '</h2>' +
        '<p class="fb-lead">' + L3('불편했던 점, 오류, 바라는 점을 바로 적어 보내 주세요. 보내신 글은 운영자만 읽고, 게임을 고치는 데 씁니다.', 'Tell us what felt off, what broke, or what you would like to see. Only the developer reads your post, and it is used to improve the game.', '不便だった点、不具合、ご要望をそのままお書きください。投稿は運営者だけが読み、ゲームの改善に使います。') + '</p>' +
        '<div class="fb-tabs"><button type="button" data-t="w"' + (st.tab === 'w' ? ' class="on"' : '') + '>✍ ' + L3('글쓰기', 'Write', '書く') + '</button><button type="button" data-t="m"' + (st.tab === 'm' ? ' class="on"' : '') + '>📮 ' + L3('내가 보낸 글', 'My posts', '送信した投稿') + ' (' + mine.length + ')</button></div><div class="fb-body"></div>';
      body = $('.fb-body', card);
      if (st.tab === 'm') viewMine(); else if (st.sent) viewOk(); else viewWrite();
    }

    function viewWrite() {
      body.innerHTML =
        '<div class="fb-cats" role="radiogroup">' + Object.keys(CATS).map(function (k) { return '<button type="button" role="radio" data-c="' + k + '"' + (k === st.cat ? ' class="on" aria-checked="true"' : ' aria-checked="false"') + '>' + CATS[k].ic + ' ' + T3(CATS[k].n) + '</button>'; }).join('') + '</div>' +
        '<textarea id="fb-t" maxlength="' + MAX + '" rows="6"></textarea>' +
        '<div class="fb-row"><span id="fb-n"></span><span>' + L3('이름·이메일 같은 개인정보는 적지 마세요.', 'Please do not write names, emails or other personal details.', 'お名前・メールなどの個人情報は書かないでください。') + '</span></div>' +
        '<label class="fb-ck"><input type="checkbox" id="fb-c"' + (st.ctx ? ' checked' : '') + '><span>' + L3('게임 상황도 함께 보내기 (오류를 찾는 데 도움이 됩니다)', 'Include game info (helps us track down bugs)', 'ゲームの状況も一緒に送る(不具合の調査に役立ちます)') + ' <a id="fb-w">' + L3('무엇을 보내나요?', 'What is sent?', '何を送る?') + '</a></span></label>' +
        '<div class="fb-what" id="fb-wh" hidden></div><div class="rc-err" id="fb-e"></div>' +
        '<div class="rc-foot"><span class="fb-sub"><a id="fb-cp">📋 ' + L3('복사', 'Copy', 'コピー') + '</a><a id="fb-gh">↗ GitHub</a></span><button type="button" class="btn" data-a="x">' + L3('닫기', 'Close', '閉じる') + '</button><button type="button" class="btn pri" id="fb-go">' + L3('보내기', 'Send', '送信') + '</button></div>';
      var ta = $('#fb-t', card), n = $('#fb-n', card);
      ta.value = st.msg; ta.placeholder = T3(CATS[st.cat].hint);
      function cnt() { n.textContent = ta.value.length + ' / ' + MAX; }
      cnt(); ta.oninput = function () { cnt(); saveDraft(); };
      [].slice.call(card.querySelectorAll('.fb-cats button')).forEach(function (b) {
        b.onclick = function () { st.cat = b.getAttribute('data-c'); saveDraft(); [].slice.call(card.querySelectorAll('.fb-cats button')).forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on ? 'true' : 'false'); }); ta.placeholder = T3(CATS[st.cat].hint); };
      });
      $('#fb-c', card).onchange = function () { st.ctx = this.checked; };
      $('#fb-w', card).onclick = function (e) {
        e.preventDefault();   // 라벨 안의 링크라서, 막지 않으면 체크 상자가 같이 바뀐다
        var wh = $('#fb-wh', card); if (!wh.hidden) { wh.hidden = true; return; }
        wh.innerHTML = ctxLines(ctxInfo()).join('<br>') + '<br><small>' + L3('이름·이메일·계정 정보는 보내지 않습니다.', 'Your name, email and account details are never sent.', 'お名前・メール・アカウント情報は送りません。') + '</small>'; wh.hidden = false;
      };
      $('#fb-cp', card).onclick = function () { var t = ta.value.trim(); if (t) copyText(t, this); };
      $('#fb-gh', card).onclick = function () { window.open(ghUrl(st.cat, ta.value.trim()), '_blank', 'noopener'); };
      $('#fb-go', card).onclick = submit;
      setTimeout(function () { try { ta.focus(); } catch (e) { } }, 30);
    }

    function lock(on, label) { var go = $('#fb-go', card); if (!go) return; go.disabled = !!on; if (label) go.textContent = label; else go.textContent = L3('보내기', 'Send', '送信'); }

    function submit() {
      var ta = $('#fb-t', card), err = $('#fb-e', card), msg = (ta.value || '').trim();
      err.textContent = '';
      if (msg.length < MIN) { err.textContent = L3('내용을 ' + MIN + '자 이상 적어 주세요.', 'Please write at least ' + MIN + ' characters.', MIN + '文字以上で内容をお書きください。'); ta.focus(); return; }
      var th = tooFast();
      if (th) { err.textContent = th === 'fast' ? L3('방금 보내셨습니다. 20초쯤 뒤에 다시 보내 주세요.', 'You just sent one. Please wait about 20 seconds.', 'いま送信されました。20秒ほど待ってからもう一度お送りください。') : L3('오늘 보낼 수 있는 글(10건)을 모두 보내셨습니다. 내일 다시 이용해 주세요.', 'You have reached today\'s limit (10 posts). Please come back tomorrow.', '本日の送信上限(10件)に達しました。明日またご利用ください。'); return; }
      st.msg = ta.value; var d = payload(st.cat, msg, $('#fb-c', card).checked), cat = st.cat, rid = st.rid;
      lock(true, L3('보내는 중…', 'Sending...', '送信中...'));
      send(d).then(function () {
        logSend(); upsertMine({ id: rid, at: Date.now(), cat: cat, msg: msg, st: 'ok' }); lsSet(K.draft, null); st.msg = ''; st.sent = true; st.rid = newId(); render();
      }, function (e) {
        upsertMine({ id: rid, at: Date.now(), cat: cat, msg: msg, d: d, st: 'wait' });
        if ($('#fb-go', card)) { lock(false); $('#fb-e', card).innerHTML = reason(e); }
      });
    }

    function viewOk() {
      body.innerHTML = '<div class="fb-ok"><i>✔</i><b>' + L3('보냈습니다. 고맙습니다!', 'Sent. Thank you!', '送信しました。ありがとうございます!') + '</b><p>' + L3('운영자가 읽고 게임을 고치는 데 반영합니다. (개별 답장은 드리지 못할 수 있습니다.)', 'The developer will read it and use it to improve the game. (We may not be able to reply individually.)', '運営者が読み、ゲームの改善に役立てます。(個別のご返信はできない場合があります。)') + '</p></div>' +
        '<div class="rc-foot"><button type="button" class="btn" data-a="more">' + L3('더 쓰기', 'Write another', 'もう一件書く') + '</button><button type="button" class="btn pri" data-a="x">' + L3('닫기', 'Close', '閉じる') + '</button></div>';
    }

    function viewMine() {
      var mine = lsGet(K.mine, []);
      if (!mine.length) { body.innerHTML = '<div class="rc-empty">' + L3('아직 보낸 글이 없습니다.', 'You have not sent anything yet.', 'まだ送信した投稿はありません。') + '</div>'; return; }
      body.innerHTML = '<div class="fb-list"></div><div class="rc-foot"><button type="button" class="btn" data-a="x">' + L3('닫기', 'Close', '閉じる') + '</button></div>';
      var list = $('.fb-list', body);
      mine.forEach(function (m) {
        var c = CATS[m.cat] || CATS.etc, ok = m.st === 'ok';
        var it = h('div', 'fb-item', '<div class="hd"><b>' + c.ic + ' ' + T3(c.n) + '</b><span>' + fmtDate(m.at) + '</span><span class="st ' + (ok ? 'ok' : 'wait') + '">' + (ok ? '✔ ' + L3('전달됨', 'Delivered', '送信済み') : '⏳ ' + L3('보내지 못함', 'Not sent', '未送信')) + '</span></div><div class="tx">' + esc(m.msg) + '</div><div class="ac"></div>');
        var ac = $('.ac', it);
        if (!ok && m.d) { var rb = h('button', 'btn', L3('다시 보내기', 'Send again', '再送信')); rb.type = 'button'; rb.onclick = function () { rb.disabled = true; rb.textContent = L3('보내는 중…', 'Sending...', '送信中...'); send(m.d).then(function () { logSend(); upsertMine({ id: m.id, at: m.at, cat: m.cat, msg: m.msg, st: 'ok' }); var dd = lsGet(K.draft, null); if (dd && dd.rid === m.id) { lsSet(K.draft, null); st.msg = ''; } render(); }, function (e) { rb.disabled = false; rb.textContent = L3('다시 보내기', 'Send again', '再送信'); var s = $('.st', it); s.textContent = '⏳ ' + L3('아직 보내지 못했습니다', 'Still not sent', 'まだ送信できません'); }); }; ac.appendChild(rb); }
        var cb = h('button', 'btn', '📋 ' + L3('복사', 'Copy', 'コピー')); cb.type = 'button'; cb.onclick = function () { copyText(m.msg, cb); }; ac.appendChild(cb);
        var db = h('button', 'btn', L3('목록에서 지우기', 'Remove from list', 'リストから削除')); db.type = 'button'; db.onclick = function () { lsSet(K.mine, lsGet(K.mine, []).filter(function (x) { return x && x.id !== m.id; })); render(); }; ac.appendChild(db);
        list.appendChild(it);
      });
    }

    card.onclick = function (e) {
      var t = e.target; if (!t || !t.getAttribute) return;
      var tab = t.getAttribute('data-t'), a = t.getAttribute('data-a');
      if (tab) { saveDraft(); st.tab = tab; st.sent = false; render(); }
      else if (a === 'x') close();
      else if (a === 'more') { st.sent = false; st.msg = ''; st.tab = 'w'; render(); }
    };
    render();
    return { close: close };
  };

  /* ── 버튼 달기: 타이틀 도구줄 + 게임 화면 위쪽 ── */
  function mount() {
    var tb = document.getElementById('toptools');
    if (tb && !document.getElementById('fb-top')) {
      var b = h('button', 'btn', '💬 ' + L3('의견·제보', 'Feedback', 'ご意見・不具合報告')); b.id = 'fb-top'; b.type = 'button';
      b.title = L3('의견·오류 제보 게시판', 'Feedback & bug reports', 'ご意見・不具合報告'); b.onclick = function () { B.open(); }; tb.appendChild(b);
    }
    var hud = document.getElementById('hud');
    if (hud && !document.getElementById('btn-fb')) {
      var f = h('button', 'btn', '💬'); f.id = 'btn-fb'; f.type = 'button';
      f.title = L3('의견·오류 제보 게시판', 'Feedback & bug reports', 'ご意見・不具合報告'); f.onclick = function () { B.open(); }; hud.appendChild(f);
    }
  }
  if (document.readyState !== 'loading') mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
