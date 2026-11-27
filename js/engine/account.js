/* 계정·체험판·내 기록
 *  ① 로그인: Firebase Authentication(구글 로그인) + Firestore(기록). SITE.FIREBASE 설정이 비어 있으면 로그인·체험판 제한은 꺼지고
 *     기록은 이 기기에만 저장된다(설정을 채우면 자동으로 켜진다). 개발 시험용 가짜 로그인(mock)은 내 컴퓨터(localhost)에서만 켤 수 있다.
 *  ② 체험판: 로그인하지 않은 방문자는 SITE.TRIAL_TURNS(기본 5)턴까지 해를 넘길 수 있다. 그 뒤에는 로그인 창이 뜨고,
 *     로그인하면 그 자리에서 이어서 한다. (브라우저 안의 횟수 세기라 '부드러운' 제한이다. 로그인 서버에 닿지 못하면 제한을 풀어 둔다.)
 *  ③ 내 기록: 지난 재위 목록·업적 도감·왕/결말 수집 현황. 로그인하면 계정(Firestore users/{uid}/records)에, 아니면 이 기기에 둔다.
 *  글은 모두 L3(ko, en, ja)로 지금 언어에 맞춰 고른다. */
(function () {
  var P = SG.Sandbox.prototype, F = SG.feats, SITE = window.SITE || {};
  function $(s, r) { return (r || document).querySelector(s); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function L3(ko, en, ja) { var l = SG.i18n && SG.i18n.lang; return l === 'en' ? en : l === 'ja' ? ja : ko; }
  function esc(t) { return F.esc(t); }
  function warn(e) { if (window.console) console.warn('account', e); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(t) { var d = new Date(t || 0); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function byAt(a, b) { return (b.at || 0) - (a.at || 0); }
  function isLocalHost() { return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname); }
  function inApp() { return /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|DaumApps|; wv\)|Line\//i.test(navigator.userAgent || ''); }

  var TKEY = 'samgukwang.trial.v1';
  var A = SG.account = { mode: 'off', ready: true, user: null, failed: false, limit: 5, _used: 0, _ad: null, _ls: [] };

  /* ── 상태·구독 ── */
  A.onChange = function (fn) { A._ls.push(fn); return function () { var i = A._ls.indexOf(fn); if (i >= 0) A._ls.splice(i, 1); }; };
  function notify() { A._ls.slice().forEach(function (f) { try { f(A.user); } catch (e) { warn(e); } }); }
  A.canLogin = function () { return A.mode !== 'off' && !A.user && !A.failed; };
  A.gateOn = function () { return A.mode !== 'off' && !A.user && !A.failed; };   // 체험 제한이 걸리는 상태
  function tRead() { try { var o = JSON.parse(localStorage.getItem(TKEY) || 'null'); return o && typeof o.used === 'number' ? o.used : 0; } catch (e) { return 0; } }
  A.trialUsed = function () { return Math.max(A._used, tRead()); };
  A.trialLeft = function () { return Math.max(0, A.limit - A.trialUsed()); };
  A.trialUse = function () { A._used = A.trialUsed() + 1; try { localStorage.setItem(TKEY, JSON.stringify({ used: A._used, at: Date.now() })); } catch (e) { } };
  A.trialReset = function () { A._used = 0; try { localStorage.removeItem(TKEY); } catch (e) { } A.render(); };

  /* ── 안내 글(작은 알림) ── */
  function say(msg, cls) {
    var root = $('#app') || document.body, box = $('#ftoasts');
    if (!box) { box = h('div'); box.id = 'ftoasts'; root.appendChild(box); }
    var t = h('div', 'ftoast msg' + (cls ? ' ' + cls : ''), '<div><b>' + msg + '</b></div>');
    box.appendChild(t); setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 700); }, 4800);
  }
  A.say = say;
  A.sendFeedback = function (d) { return A._ad && A._ad.feedback ? A._ad.feedback(d) : Promise.reject({ code: 'feedback/unavailable' }); };   // 의견·제보 게시판이 쓴다
  function errMsg(e) {
    var c = (e && e.code) || '';
    if (/popup-closed|cancelled-popup/.test(c)) return L3('로그인을 취소했습니다.', 'Login cancelled.', 'ログインをキャンセルしました。');
    if (/popup-blocked/.test(c)) return L3('팝업이 차단되었습니다. 주소창의 팝업 허용을 켠 뒤 다시 눌러 주세요.', 'The pop-up was blocked. Allow pop-ups for this site and try again.', 'ポップアップがブロックされました。許可してもう一度押してください。');
    if (/network/.test(c)) return L3('네트워크에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.', 'Cannot reach the network. Please try again shortly.', 'ネットワークに接続できません。しばらくしてからもう一度お試しください。');
    if (/unauthorized-domain/.test(c)) return L3('이 주소는 아직 로그인이 허용되지 않았습니다. (사이트 관리자 설정 필요)', 'This address is not yet allowed to log in. (Site setup needed)', 'このアドレスはまだログインが許可されていません。(管理者の設定が必要)');
    if (/operation-not-allowed|configuration-not-found|invalid-api-key/.test(c)) return L3('구글 로그인이 아직 준비되지 않았습니다. (사이트 관리자 설정 필요)', 'Google login is not set up yet. (Site setup needed)', 'Googleログインはまだ準備できていません。(管理者の設定が必要)');
    if (/requires-recent-login/.test(c)) return L3('보안을 위해 로그아웃한 뒤 다시 로그인하고 시도해 주세요.', 'For security, log out, log in again, then retry.', 'セキュリティのため、ログアウトして再ログインしてからお試しください。');
    return L3('로그인하지 못했습니다.', 'Could not log in.', 'ログインできませんでした。') + (c ? ' (' + c.replace(/^auth\//, '') + ')' : '');
  }

  /* ── 가짜 로그인(개발 시험용, localhost 에서만) ── */
  function mockAdapter() {
    var UK = 'samgukwang.mock.user', cb = null;
    function ck(u) { return 'samgukwang.mock.cloud.' + u.uid; }
    function rd(u) { try { return JSON.parse(localStorage.getItem(ck(u)) || '[]'); } catch (e) { return []; } }
    return {
      start: function (set) { cb = set; var u = null; try { u = JSON.parse(localStorage.getItem(UK) || 'null'); } catch (e) { } setTimeout(function () { set(u); }, 20); },
      login: function () { var u = { uid: 'mock-user', name: '시험 왕' }; try { localStorage.setItem(UK, JSON.stringify(u)); } catch (e) { } return new Promise(function (res) { setTimeout(function () { cb(u); res(u); }, 30); }); },
      logout: function () { try { localStorage.removeItem(UK); } catch (e) { } cb(null); return Promise.resolve(); },
      profile: function () { return Promise.resolve(); },
      list: function (u) { return Promise.resolve(rd(u)); },
      put: function (u, rec) { var a = rd(u).filter(function (x) { return x.id !== rec.id; }); a.unshift(rec); try { localStorage.setItem(ck(u), JSON.stringify(a)); } catch (e) { } return Promise.resolve(); },
      clear: function (u) { try { localStorage.removeItem(ck(u)); } catch (e) { } return Promise.resolve(); },
      feedback: function (d) { var a = []; try { a = JSON.parse(localStorage.getItem('samgukwang.mock.feedback') || '[]'); } catch (e) { } a.unshift(Object.assign({ at: Date.now() }, d)); try { localStorage.setItem('samgukwang.mock.feedback', JSON.stringify(a.slice(0, 50))); } catch (e) { } return new Promise(function (res) { setTimeout(res, 250); }); },
      drop: function () { try { localStorage.removeItem(UK); } catch (e) { } cb(null); return Promise.resolve(); }   // 계정(로그인 정보) 삭제
    };
  }

  /* ── Firebase(구글 로그인 + Firestore) ──
   *  SDK 는 구글 서버(gstatic)에서 필요할 때만 불러온다. 인증은 처음에, Firestore 는 기록을 읽고 쓸 때 처음 불러온다. */
  function fbAdapter(cfg) {
    var V = '10.14.1', B = 'https://www.gstatic.com/firebasejs/' + V + '/', Ma = null, Mf = null, app = null, auth = null, db = null;
    function la() {
      if (!Ma) Ma = Promise.all([import(B + 'firebase-app.js'), import(B + 'firebase-auth.js')]).then(function (m) { app = m[0].initializeApp(cfg); auth = m[1].getAuth(app); return { au: m[1] }; }, function (e) { Ma = null; throw e; });
      return Ma;
    }
    function lf() {
      if (!Mf) Mf = la().then(function (X) { return import(B + 'firebase-firestore.js').then(function (m) { db = m.getFirestore(app); X.fs = m; return X; }); }).catch(function (e) { Mf = null; throw e; });
      return Mf;
    }
    function toUser(u) { return u ? { uid: u.uid, name: u.displayName || '' } : null; }
    return {
      start: function (set, fail) {
        var got = false, t = setTimeout(function () { if (!got) fail(); }, 12000);
        la().then(function (X) { X.au.onAuthStateChanged(auth, function (u) { got = true; clearTimeout(t); set(toUser(u)); }); }, function () { clearTimeout(t); fail(); });
      },
      login: function () {
        return la().then(function (X) { var p = new X.au.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); return X.au.signInWithPopup(auth, p); }).then(function (c) { return toUser(c.user); });
      },
      logout: function () { return la().then(function (X) { return X.au.signOut(auth); }); },
      profile: function (u) {   // 계정 데이터(users/{uid}) 만들기·갱신
        return lf().then(function (X) {
          var fs = X.fs, ref = fs.doc(db, 'users', u.uid), nm = (u.name || '').slice(0, 80);
          return fs.getDoc(ref).then(function (s) { return s.exists() ? fs.updateDoc(ref, { name: nm, last: fs.serverTimestamp() }) : fs.setDoc(ref, { name: nm, createdAt: fs.serverTimestamp(), last: fs.serverTimestamp() }); });
        });
      },
      list: function (u) {
        return lf().then(function (X) { var fs = X.fs; return fs.getDocs(fs.query(fs.collection(db, 'users', u.uid, 'records'), fs.orderBy('at', 'desc'), fs.limit(100))); })
          .then(function (snap) { var a = []; snap.forEach(function (d) { a.push(d.data()); }); return a; });
      },
      put: function (u, rec) { return lf().then(function (X) { var fs = X.fs; return fs.setDoc(fs.doc(db, 'users', u.uid, 'records', rec.id), JSON.parse(JSON.stringify(rec))); }); },
      feedback: function (d) {   // 의견·제보 게시판(js/engine/board.js): feedback 컬렉션에 새 글 1건. 쓰기 전용이라 읽을 수 없다(규칙: tools/firebase/firestore.rules)
        return lf().then(function (X) { var fs = X.fs; return fs.addDoc(fs.collection(db, 'feedback'), Object.assign({}, d, { at: fs.serverTimestamp() })); });
      },
      clear: function (u) {
        return lf().then(function (X) {
          var fs = X.fs;
          return fs.getDocs(fs.collection(db, 'users', u.uid, 'records')).then(function (snap) {
            var ps = []; snap.forEach(function (d) { ps.push(fs.deleteDoc(d.ref)); });
            return Promise.all(ps);
          }).then(function () { return fs.deleteDoc(fs.doc(db, 'users', u.uid)); });
        });
      },
      drop: function () {   // 계정(로그인 정보) 삭제 — 데이터를 먼저 지운 다음에 부른다. 로그인한 지 오래되면 requires-recent-login 오류
        return la().then(function (X) { if (!auth.currentUser) return null; return X.au.deleteUser(auth.currentUser); });
      }
    };
  }

  /* ── 설정·시작 ── */
  A.configure = function (mode) {
    var c = SITE.FIREBASE;
    if (!mode) mode = c && c.apiKey && c.projectId ? 'firebase' : (isLocalHost() && /[?&]acct=mock\b/.test(location.search) ? 'mock' : 'off');
    if (mode === 'mock' && !isLocalHost()) mode = 'off';
    A.mode = mode; A.user = null; A.failed = false; A.ready = mode === 'off'; A._ad = null;
    A.limit = Math.max(1, +SITE.TRIAL_TURNS || 5);
    if (mode === 'firebase') A._ad = fbAdapter(c); else if (mode === 'mock') A._ad = mockAdapter();
    if (A._ad) A._ad.start(setUser, function () { A.failed = true; A.ready = true; say(L3('로그인 서버에 연결하지 못해 체험 제한을 잠시 풀었습니다.', 'Could not reach the login server, so the trial limit is lifted for now.', 'ログインサーバーに接続できないため、体験の制限を一時的に解除しました。')); notify(); A.render(); });
    A.render();
  };
  function setUser(u) {
    var prev = A.user; A.user = u; A.failed = false; A.ready = true;
    if (u && (!prev || prev.uid !== u.uid)) afterLogin(u);
    notify(); A.render();
  }
  function afterLogin(u) {
    if (!A._ad) return;
    Promise.resolve(A._ad.profile(u)).catch(warn);
    syncLocal(u).catch(warn);
  }
  // 로그인하기 전에 이 기기에 쌓인 기록을 계정으로 올린다
  function syncLocal(u) {
    var all = F.local.read(), todo = all.filter(function (r) { return !r.sent && (!r.uid || r.uid === u.uid); });
    if (!todo.length || !A._ad) return Promise.resolve(0);
    var n = 0;
    return todo.reduce(function (p, r) {
      return p.then(function () { var c = clean(r); return A._ad.put(u, c).then(function () { r.uid = u.uid; r.sent = 1; n++; }, function () { }); });
    }, Promise.resolve()).then(function () {
      if (n) { F.local.write(all); say(L3('이 기기의 기록 ' + n + '개를 계정에 합쳤습니다.', n + ' record(s) from this device were added to your account.', 'この端末の記録' + n + '件をアカウントに追加しました。')); }
      return n;
    });
  }
  function clean(rec) { var c = JSON.parse(JSON.stringify(rec)); delete c.uid; delete c.sent; return c; }

  A.login = function (quiet) {
    if (!A._ad) return Promise.reject(new Error('off'));
    if (A.user) return Promise.resolve(A.user);
    return A._ad.login().then(function (u) { return u; }, function (e) { if (!quiet) { var m = errMsg(e); if (m) say(m); } throw e; });
  };
  A.logout = function () { if (!A._ad) return Promise.resolve(); return Promise.resolve(A._ad.logout()).then(function () { if (A.mode === 'firebase') setUser(null); }); };

  /* ── 기록 저장·불러오기 ── */
  A.saveRecord = function (rec) {
    var u = A.user, r = JSON.parse(JSON.stringify(rec)); if (u) r.uid = u.uid;
    F.local.put(r);                                           // 먼저 이 기기에(연결이 안 돼도 남도록)
    if (!u || !A._ad) return Promise.resolve({ where: 'local' });
    return A._ad.put(u, clean(rec)).then(function () { r.sent = 1; F.local.put(r); return { where: 'cloud' }; }, function (e) { warn(e); return { where: 'local' }; });
  };
  A.loadRecords = function () {
    var uid = A.user && A.user.uid, loc = F.local.read().filter(function (r) { return !r.uid || r.uid === uid; });
    if (!uid || !A._ad) return Promise.resolve(loc.sort(byAt));
    return A._ad.list(A.user).then(function (cloud) {
      var m = {}; loc.concat(cloud).forEach(function (r) { var o = m[r.id]; if (!o || (r.at || 0) >= (o.at || 0)) m[r.id] = r; });
      return Object.keys(m).map(function (k) { return m[k]; }).sort(byAt);
    }, function (e) { warn(e); return loc.sort(byAt); });
  };
  A.deleteAll = function () {
    var u = A.user, uid = u && u.uid;
    F.local.write(F.local.read().filter(function (r) { return r.uid && r.uid !== uid; }));   // 다른 계정의 기록은 건드리지 않는다
    return u && A._ad ? A._ad.clear(u) : Promise.resolve();
  };
  A.deleteAccount = function () {   // 기록을 모두 지운 뒤 로그인 정보(계정)까지 삭제
    var u = A.user; if (!u || !A._ad || !A._ad.drop) return Promise.resolve();
    return A.deleteAll().then(function () { return A._ad.drop(u); });
  };

  /* ── 체험판 제한(엔진에 걸기) ── */
  A.check = function (sb) {
    if (!A.gateOn() || A.trialLeft() > 0) return true;
    if (!A.ready) { waitUI(sb); return false; }
    wall(sb); return false;
  };
  var _ye = P.yearEnd;
  P.yearEnd = function () {
    if (!A.check(this)) { this.skipping = false; this.autoMode = null; this.autoEvOn = false; return; }
    if (A.gateOn()) { A.trialUse(); badge(); }
    return _ye.apply(this, arguments);
  };
  var _turn = P.turn;
  P.turn = function () { if (!A.check(this)) { this.skipping = false; this.autoMode = null; this.autoEvOn = false; return; } badge(); return _turn.apply(this, arguments); };

  /* ── 화면: 공용 창 ── */
  function modal(cls, html) {
    var root = (SG.game && SG.game.root) || $('#app'), wrap = h('div', 'modal top ' + cls), card = h('div', 'card ' + (cls || '') + 'card', html);
    wrap.appendChild(card); root.appendChild(wrap); return { wrap: wrap, card: card };
  }
  function gbtn(label, cls) { return h('button', cls || 'btn pri', '<span class="gmark">G</span> ' + label); }
  function privacyHtml() {
    var li = function (t) { return '<li>' + t + '</li>'; };
    return '<h2>' + L3('개인정보 안내', 'Privacy notes', 'プライバシーのご案内') + '</h2><ul class="rc-priv">' +
      li(L3('<b>가져오는 것</b> — 구글 로그인 때의 계정 식별값과 이름, 그리고 게임 기록(왕·결말·점수·업적·통계). 이메일은 로그인 서비스(Google Firebase)에만 있고 이 게임은 쓰지 않습니다.', '<b>What we keep</b> — your Google account ID and name, plus your game records (king, ending, score, achievements, stats). Your email stays with the login service (Google Firebase); the game does not use it.', '<b>保存するもの</b> — Googleログイン時のアカウント識別子と名前、そしてゲーム記録(王・結末・点数・実績・統計)。メールはログインサービス(Google Firebase)にのみあり、ゲームでは使いません。')) +
      li(L3('<b>쓰는 곳</b> — 로그인 유지, 기록·업적의 보관과 표시. 광고나 제3자 제공에는 쓰지 않습니다.', '<b>Used for</b> — keeping you logged in, and storing and showing your records and achievements. Never for ads or sharing with third parties.', '<b>使い道</b> — ログインの維持、記録・実績の保管と表示。広告や第三者提供には使いません。')) +
      li(L3('<b>지우는 법</b> — 「내 기록」 아래의 「기록 모두 삭제」로 기록을, 로그인한 상태에서는 「계정 삭제」로 로그인 정보까지 언제든 지울 수 있습니다.', '<b>Deleting</b> — at the bottom of My Records, “Delete all records” erases your records any time, and while logged in “Delete account” removes your login as well.', '<b>削除</b> — 「マイ記録」下部の「記録をすべて削除」で記録を、ログイン中は「アカウント削除」でログイン情報まで、いつでも消せます。')) +
      li(L3('<b>체험 횟수</b>는 이 기기의 브라우저에만 저장됩니다.', 'The <b>trial turn count</b> is stored only in this browser.', '<b>体験の回数</b>はこの端末のブラウザにのみ保存されます。')) +
      li(L3('<b>의견·제보 게시판</b>에 쓴 글은 운영자만 읽습니다. 「게임 상황도 함께 보내기」를 켜 두면 언어·화면 크기·브라우저·플레이 중인 왕과 연도·최근 오류 기록이 함께 가며, 이름·이메일·계정 정보는 보내지 않습니다.', 'Posts on the <b>Feedback &amp; Bug Reports</b> board are read only by the developer. If “Include game info” is on, your language, screen size, browser, current king and year, and recent error messages are sent too - never your name, email or account details.', '<b>ご意見・不具合報告</b>に書いた投稿は運営者だけが読みます。「ゲームの状況も一緒に送る」をオンにすると、言語・画面サイズ・ブラウザ・プレイ中の王と年・最近のエラー記録も送られます。お名前・メール・アカウント情報は送りません。')) +
      '</ul><div class="rc-foot"><button class="btn" data-a="x">' + L3('닫기', 'Close', '閉じる') + '</button></div>';
  }
  function openPrivacy() {
    var m = modal('priv', privacyHtml()); m.wrap.onclick = function (e) { if (e.target === m.wrap || (e.target.getAttribute && e.target.getAttribute('data-a') === 'x')) m.wrap.remove(); };
  }
  function appNote() {
    return inApp() ? '<div class="note warn">' + L3('카카오톡·인스타그램 등 앱 안의 브라우저에서는 구글 로그인이 막힐 수 있습니다. 크롬·사파리 같은 기본 브라우저로 이 주소를 열어 주세요.', 'Google login may be blocked inside in-app browsers (KakaoTalk, Instagram…). Please open this page in Chrome or Safari.', 'アプリ内ブラウザ(KakaoTalk・Instagramなど)ではGoogleログインがブロックされることがあります。ChromeやSafariで開いてください。') + ' <button class="btn" data-a="copy">' + L3('주소 복사', 'Copy link', 'リンクをコピー') + '</button></div>' : '';
  }

  /* ── 화면: 체험판이 끝났을 때의 로그인 창 ── */
  function wall(sb) {
    if ($('.acct-wall')) return;
    try { SG.save.write(sb.g); } catch (e) { }   // 어떤 일이 생겨도 이 판을 이어서 할 수 있게 먼저 저장
    var g = sb.g, m = modal('acct-wall', '<h2>' + L3('🎟 체험판은 여기까지입니다', '🎟 The free trial ends here', '🎟 体験版はここまでです') + '</h2>' +
      '<p>' + L3('체험 ' + A.limit + '턴을 모두 사용했습니다. 구글 계정으로 로그인하면 <b>지금 판을 그대로 이어서 끝까지</b> 즐길 수 있고, 업적과 지난 기록이 <b>내 계정에 보관</b>됩니다.', 'You have used all ' + A.limit + ' trial turns. Log in with Google to <b>carry on with this very game to the end</b> — your achievements and past records are <b>kept on your account</b>.', '体験' + A.limit + 'ターンをすべて使いました。Googleアカウントでログインすると、<b>この続きを最後まで</b>遊べて、実績と記録が<b>アカウントに保管</b>されます。') + '</p>' +
      appNote() + '<div class="rc-err" id="wl-err"></div><div class="rc-foot"><button class="btn" data-a="home">' + L3('처음 화면으로', 'Back to title', 'タイトルへ') + '</button></div>' +
      '<p class="rc-sub">' + L3('로그인 정보는 이름과 게임 기록 저장에만 쓰이며 언제든 지울 수 있습니다.', 'Login is used only to save your name and game records, and you can delete them any time.', 'ログイン情報は名前とゲーム記録の保存にのみ使われ、いつでも削除できます。') + ' <a href="#" data-a="priv">' + L3('개인정보 안내', 'Privacy', 'プライバシー') + '</a></p>');
    var wrap = m.wrap, card = m.card, done = false, off, go = gbtn(L3('구글로 로그인하고 계속하기', 'Log in with Google and continue', 'Googleでログインして続ける'));
    card.querySelector('.rc-foot').insertBefore(go, card.querySelector('.rc-foot').firstChild);
    function finish() { if (done) return; done = true; off(); wrap.remove(); g.go('__turn__'); }
    off = A.onChange(function (u) { if (u) finish(); });
    go.onclick = function () {
      go.disabled = true; $('#wl-err', card).textContent = L3('로그인 창을 확인해 주세요…', 'Please check the login window…', 'ログインウィンドウをご確認ください…');
      A.login(true).then(finish, function (e) { go.disabled = false; $('#wl-err', card).textContent = errMsg(e); });
    };
    card.onclick = function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a');
      if (a === 'home') { e.preventDefault(); off(); wrap.remove(); SG.toTitle(); }
      else if (a === 'priv') { e.preventDefault(); openPrivacy(); }
      else if (a === 'copy') { F.copy(location.href, e.target); }
    };
  }
  // 로그인 서버가 아직 대답하지 않았을 때(처음 불러오는 중): 잠깐 기다렸다가 이어간다
  function waitUI(sb) {
    if ($('.acct-wait')) return;
    var m = modal('acct-wait', '<p>' + L3('계정을 확인하는 중입니다…', 'Checking your account…', 'アカウントを確認しています…') + '</p>'), off;
    off = A.onChange(function () { off(); m.wrap.remove(); sb.g.go('__turn__'); });
  }

  /* ── 화면: 체험판 안내(HUD 표시를 눌렀을 때) ── */
  function infoUI() {
    var left = A.trialLeft(), m = modal('acct-info', '<h2>🎟 ' + L3('체험판', 'Free trial', '体験版') + '</h2><p>' +
      L3('로그인하지 않아도 <b>' + A.limit + '턴</b>까지 체험할 수 있습니다. 지금까지 ' + Math.min(A.limit, A.trialUsed()) + '턴을 썼고 <b>' + left + '턴</b>이 남았습니다. 로그인하면 제한 없이 끝까지 즐길 수 있고 업적·기록이 계정에 보관됩니다.', 'You can try the game for <b>' + A.limit + ' turns</b> without logging in. You have used ' + Math.min(A.limit, A.trialUsed()) + ' and have <b>' + left + '</b> left. Log in for unlimited play, with achievements and records kept on your account.', 'ログインなしで<b>' + A.limit + 'ターン</b>まで体験できます。これまでに' + Math.min(A.limit, A.trialUsed()) + 'ターン使い、<b>残り' + left + 'ターン</b>です。ログインすると制限なく最後まで遊べ、実績・記録がアカウントに保管されます。') + '</p>' + appNote() +
      '<div class="rc-err" id="in-err"></div><div class="rc-foot"><button class="btn" data-a="x">' + L3('닫기', 'Close', '閉じる') + '</button></div>');
    var go = gbtn(L3('구글로 로그인', 'Log in with Google', 'Googleでログイン')); m.card.querySelector('.rc-foot').insertBefore(go, m.card.querySelector('.rc-foot').firstChild);
    go.onclick = function () { A.login(true).then(function () { m.wrap.remove(); }, function (e) { $('#in-err', m.card).textContent = errMsg(e); }); };
    m.card.onclick = function (e) { var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (a === 'x') m.wrap.remove(); else if (a === 'copy') F.copy(location.href, e.target); };
    m.wrap.onclick = function (e) { if (e.target === m.wrap) m.wrap.remove(); };
  }

  /* ── 화면: 체험 횟수 표시(HUD)·타이틀 ── */
  function badge() {
    var b = $('#trial-badge'), hud = $('#hud'); if (!hud) return;
    if (!A.gateOn()) { if (b) b.style.display = 'none'; return; }
    if (!b) { b = h('button', 'btn trial-badge'); b.id = 'trial-badge'; hud.insertBefore(b, $('#btn-home') || null); b.onclick = infoUI; }
    b.style.display = ''; b.textContent = '🎟 ' + L3('체험 ', 'Trial ', '体験 ') + Math.min(A.limit, A.trialUsed()) + '/' + A.limit + L3('턴', ' turns', 'ターン');
    b.classList.toggle('warn', A.trialLeft() <= 1); b.title = L3('체험판 안내', 'About the free trial', '体験版について');
  }
  function titleUi() {
    var t = $('#title > div'); if (!t) return;
    var box = $('#acct-top');
    if (!box) { box = h('div'); box.id = 'acct-top'; var lt = $('.lang-top', t); if (lt) lt.insertBefore(box, lt.firstChild); else t.insertBefore(box, t.firstChild); }
    box.innerHTML = '';
    if (A.mode !== 'off' && A.ready) {
      if (A.user) {
        var nm = (A.user.name || '').trim() || L3('회원', 'Member', '会員'), chip = h('span', 'acct-chip', '<i>' + esc(nm.charAt(0).toUpperCase()) + '</i>' + esc(nm)), out = h('button', 'btn', L3('로그아웃', 'Log out', 'ログアウト'));
        out.onclick = function () { A.logout(); }; box.appendChild(chip); box.appendChild(out);
      } else if (!A.failed) { var li = gbtn(L3('Google 로그인', 'Log in with Google', 'Googleでログイン'), 'btn'); li.onclick = function () { A.login(); }; box.appendChild(li); }
    }
    var note = $('#acct-note');
    if (!note) { note = h('div'); note.id = 'acct-note'; var kings = $('#kings', t); t.insertBefore(note, kings || null); }
    if (A.mode === 'off' || !A.ready) { note.style.display = 'none'; }
    else if (A.user) { note.style.display = ''; note.className = 'acct-note ok'; note.innerHTML = '✔ ' + L3('로그인 중입니다. 재위가 끝나면 기록과 업적이 <b>내 계정</b>에 저장됩니다.', 'Logged in. Your records and achievements will be saved to <b>your account</b> after each reign.', 'ログイン中です。治世が終わると記録と実績が<b>アカウント</b>に保存されます。'); }
    else if (A.failed) { note.style.display = 'none'; }
    else {
      note.style.display = ''; var left = A.trialLeft();
      note.className = 'acct-note' + (left <= 0 ? ' warn' : '');
      note.innerHTML = '🎟 ' + (left > 0 ? L3('체험판 — 로그인 없이 <b>' + A.limit + '턴</b>까지 해 볼 수 있습니다 (남은 체험 <b>' + left + '턴</b>). 로그인하면 끝까지 · 기록 저장.', 'Free trial — play up to <b>' + A.limit + ' turns</b> without logging in (<b>' + left + '</b> left). Log in for the full game and saved records.', '体験版 — ログインなしで<b>' + A.limit + 'ターン</b>まで遊べます(残り<b>' + left + 'ターン</b>)。ログインすると最後まで・記録保存。')
        : L3('체험 ' + A.limit + '턴을 모두 사용했습니다. 로그인하면 이어서 즐길 수 있습니다.', 'You have used all ' + A.limit + ' trial turns. Log in to keep playing.', '体験' + A.limit + 'ターンをすべて使いました。ログインすると続きが遊べます。'));
    }
    var u = $('#btn-uija', t), rb = $('#btn-recs', t);
    if (u && !rb) { rb = h('button', 'btn', ''); rb.id = 'btn-recs'; rb.style.cssText = 'padding:10px 18px;font-size:15px'; rb.onclick = function () { A.openRecords(); }; u.parentNode.insertBefore(rb, u.nextSibling); }
    if (rb) rb.textContent = '📚 ' + L3('내 기록', 'My records', 'マイ記録');
  }
  A.render = function () { try { titleUi(); badge(); } catch (e) { warn(e); } };

  /* ── 화면: 내 기록 ── */
  function summary(recs) {
    var S = { n: recs.length, best: 0, kings: {}, seals: {}, feats: {}, nf: 0 };
    recs.forEach(function (r) {
      S.best = Math.max(S.best, r.score || 0); S.kings[r.kid] = Math.max(S.kings[r.kid] || 0, r.score || 0);
      var sk = r.seal === '亡' ? '滅' : r.seal; S.seals[sk] = (S.seals[sk] || 0) + 1;
      (r.feats || []).forEach(function (id) { S.feats[id] = (S.feats[id] || 0) + 1; });
    });
    S.nf = Object.keys(S.feats).filter(function (id) { return F.IDX[id]; }).length; return S;
  }
  function recDetail(r) {
    var items = (r.feats || []).map(function (id) { return F.IDX[id]; }).filter(Boolean).sort(function (a, b) { return b.w - a.w; });
    return '<div class="rc-det">' + F.axesHtml(r.axes || [0, 0, 0, 0, 0]) + F.statChips(r) +
      (items.length ? '<div class="fv-chips">' + items.map(function (it) { return '<span class="t-' + it.tier + '" title="' + esc(F.desc(it)) + '">' + it.d.icon + ' ' + esc(F.name(it)) + '</span>'; }).join('') + '</div>' : '') +
      ((r.moments || []).length ? '<ul class="fv-mo">' + r.moments.map(function (m) { return '<li><b>' + F.yr(m.y) + '</b> ' + esc(m.t) + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="fv-act"><button class="btn" data-a="share" data-id="' + esc(r.id) + '">' + L3('📋 결과 복사하여 공유', '📋 Copy result to share', '📋 結果をコピーして共有') + '</button></div></div>';
  }
  function listTab(st) {
    if (!st.recs.length) return '<div class="rc-empty">' + L3('아직 기록이 없습니다. 한 재위를 끝까지 마치면 여기에 남습니다.', 'No records yet. Finish a reign and it will appear here.', 'まだ記録がありません。治世を最後まで終えるとここに残ります。') + '</div>';
    return st.recs.map(function (r) {
      var g = F.gradeOf(r.score || 0).g, open = st.open === r.id;
      return '<div class="rc-row' + (open ? ' on' : '') + '" data-a="row" data-id="' + esc(r.id) + '"><div class="rc-g g' + g + '">' + g + '</div><div class="rc-m"><b>' + esc(r.king) + ' <small>' + r.y0 + '→' + r.y1 + '</small></b><span>' + esc(F.sealName(r.seal)) + ' ' + esc(r.seal) + ' · ' + (r.score || 0) + L3('점', ' pts', '点') + ' · 🏅' + (r.feats || []).length + '</span></div><div class="rc-d">' + fmtDate(r.at) + '</div></div>' + (open ? recDetail(r) : '');
    }).join('');
  }
  var CATS = [['war', '武', ['전쟁', 'War', '戦']], ['gov', '政', ['내정', 'Governance', '内政']], ['dip', '交', ['외교', 'Diplomacy', '外交']], ['his', '史', ['역사·왕조', 'History', '歴史・王朝']], ['end', '終', ['결말·특별', 'Endings & secrets', '結末・特別']]];
  function featsTab(S) {
    return CATS.map(function (c) {
      var items = F.LIST.filter(function (it) { return it.d.cat === c[0]; });
      return '<h4 class="rc-cat">' + c[1] + ' ' + L3(c[2][0], c[2][1], c[2][2]) + ' <em>' + items.filter(function (it) { return S.feats[it.id]; }).length + '/' + items.length + '</em></h4><div class="rc-fg">' + items.map(function (it) {
        var n = S.feats[it.id], hid = it.secret && !n;
        return '<div class="rc-f t-' + it.tier + (n ? ' got' : '') + '"><span class="ic">' + (hid ? '❔' : it.d.icon) + '</span><div><b>' + (hid ? '???' : esc(F.name(it))) + '</b> <i>' + F.stars(it.tier) + '</i><small>' + (hid ? L3('숨겨진 업적', 'Hidden achievement', '隠し実績') : esc(F.desc(it))) + '</small>' + (n ? '<em>×' + n + '</em>' : '') + '</div></div>';
      }).join('') + '</div>';
    }).join('');
  }
  var SEALS = ['霸', '興', '守', '延', '存', '衰', '讓', '降', '亂', '變', '滅', '終'];
  function bookTab(S) {
    var kings = (SG.data.kings || []).filter(function (k) { return SG.scenarios[k.id]; });
    return '<h4 class="rc-cat">👑 ' + L3('왕 도감', 'Kings', '王の図鑑') + ' <em>' + kings.filter(function (k) { return S.kings[k.id] != null; }).length + '/' + kings.length + '</em></h4><div class="rc-bk">' + kings.map(function (k) {
      var b = S.kings[k.id], got = b != null;
      return '<div class="rc-k' + (got ? ' got' : '') + '" style="--c:var(--c-' + k.side + ')"><b><i class="dot"></i>' + esc(k.name) + '</b><small>' + (got ? F.gradeOf(b).g + ' · ' + b + L3('점', ' pts', '点') : '—') + '</small></div>';
    }).join('') + '</div><h4 class="rc-cat">📜 ' + L3('결말 도감', 'Endings', '結末の図鑑') + ' <em>' + SEALS.filter(function (s) { return S.seals[s]; }).length + '/' + SEALS.length + '</em></h4><div class="rc-bk">' + SEALS.map(function (s) {
      var n = S.seals[s]; return '<div class="rc-k' + (n ? ' got' : '') + '"><b>' + s + ' ' + esc(F.sealName(s)) + '</b><small>' + (n ? '×' + n : '—') + '</small></div>';
    }).join('') + '</div>';
  }
  A.openRecords = function (tab) {
    var old = $('.acct-recs'); if (old) old.remove();
    var m = modal('acct-recs', '<div class="rc-load">…</div>'), wrap = m.wrap, card = m.card, st = { tab: tab || 'list', recs: [], open: null, ok: false }, off;
    function close() { if (off) off(); wrap.remove(); }
    function draw() {
      var S = summary(st.recs), sc = card.scrollTop, who;
      if (A.mode === 'off') who = L3('이 기기에 저장된 기록입니다.', 'Records saved on this device.', 'この端末に保存された記録です。');
      else if (A.user) who = '☁ ' + L3(esc(A.user.name || '') + '님의 계정에 저장됩니다.', 'Saved to the account of ' + esc(A.user.name || 'you') + '.', esc(A.user.name || '') + 'さんのアカウントに保存されます。');
      else who = L3('로그인하지 않아 이 기기에만 저장됩니다.', 'Not logged in — records stay on this device only.', 'ログインしていないため、この端末にのみ保存されます。');
      var tabs = [['list', L3('기록', 'Records', '記録')], ['feats', L3('업적', 'Achievements', '実績')], ['book', L3('도감', 'Collection', '図鑑')]];
      var kn = (SG.data.kings || []).filter(function (k) { return SG.scenarios[k.id]; }).length;
      card.innerHTML = '<div class="rc-hd"><h2>📚 ' + L3('내 기록', 'My Records', 'マイ記録') + '</h2><span id="rc-acct"></span><button class="btn" data-a="x">✕</button></div><div class="rc-sub">' + who + '</div>' +
        '<div class="rc-tiles"><div><b>' + S.n + '</b><small>' + L3('플레이', 'Plays', 'プレイ') + '</small></div><div><b>' + (S.n ? S.best : '—') + '</b><small>' + L3('최고 점수', 'Best score', '最高点') + '</small></div><div><b>' + S.nf + '/' + F.LIST.length + '</b><small>' + L3('업적', 'Achievements', '実績') + '</small></div><div><b>' + Object.keys(S.kings).length + '/' + kn + '</b><small>' + L3('만난 왕', 'Kings played', '遊んだ王') + '</small></div></div>' +
        '<div class="tabs">' + tabs.map(function (t) { return '<button class="tab' + (st.tab === t[0] ? ' on' : '') + '" data-a="tab" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
        '<div class="rc-body">' + (st.tab === 'feats' ? featsTab(S) : st.tab === 'book' ? bookTab(S) : listTab(st)) + '</div>' +
        '<div class="rc-foot"><a href="#" data-a="priv">' + L3('개인정보 안내', 'Privacy', 'プライバシー') + '</a><button class="btn" data-a="del">' + L3('🗑 기록 모두 삭제', '🗑 Delete all records', '🗑 記録をすべて削除') + '</button>' +
        (A.user && A._ad && A._ad.drop ? '<button class="btn" data-a="delacct">' + L3('🚪 계정 삭제', '🚪 Delete account', '🚪 アカウント削除') + '</button>' : '') + '</div>';
      var ac = $('#rc-acct', card);
      if (A.mode !== 'off' && ac) {
        if (A.user) { var lo = h('button', 'btn', L3('로그아웃', 'Log out', 'ログアウト')); lo.onclick = function () { A.logout(); }; ac.appendChild(lo); }
        else if (!A.failed) { var li = gbtn(L3('로그인', 'Log in', 'ログイン'), 'btn'); li.onclick = function () { A.login(); }; ac.appendChild(li); }
      }
      card.scrollTop = sc;
    }
    function reload() { return A.loadRecords().then(function (r) { st.recs = r; st.ok = true; draw(); }); }
    off = A.onChange(function () { if (wrap.parentNode) reload(); });
    wrap.onclick = function (e) { if (e.target === wrap) close(); };
    card.onclick = function (e) {
      var el = e.target.closest ? e.target.closest('[data-a]') : null; if (!el) return; var a = el.getAttribute('data-a');
      if (a === 'x') close();
      else if (a === 'tab') { st.tab = el.getAttribute('data-t'); draw(); card.scrollTop = 0; }
      else if (a === 'row') { var id = el.getAttribute('data-id'); st.open = st.open === id ? null : id; draw(); }
      else if (a === 'share') { var r = st.recs.filter(function (x) { return x.id === el.getAttribute('data-id'); })[0]; if (r) F.copy(F.shareText(r), el); }
      else if (a === 'priv') { e.preventDefault(); openPrivacy(); }
      else if (a === 'del') {
        if (!confirm(L3('이 기기와 계정에 저장된 기록을 모두 지웁니다. 되돌릴 수 없습니다. 계속할까요?', 'This deletes all records saved on this device and your account. It cannot be undone. Continue?', 'この端末とアカウントに保存された記録をすべて削除します。元に戻せません。続けますか?'))) return;
        A.deleteAll().then(function () { st.open = null; reload(); say(L3('기록을 모두 지웠습니다.', 'All records deleted.', '記録をすべて削除しました。')); }, function (er) { warn(er); say(L3('지우지 못했습니다. 잠시 뒤 다시 시도해 주세요.', 'Could not delete. Please try again shortly.', '削除できませんでした。しばらくしてからもう一度お試しください。')); });
      }
      else if (a === 'delacct') {
        if (!confirm(L3('로그인 정보와 계정에 저장된 기록을 모두 지우고 탈퇴합니다. 되돌릴 수 없습니다. 계속할까요?', 'This permanently deletes your login and every record saved on your account. It cannot be undone. Continue?', 'ログイン情報とアカウントに保存された記録をすべて削除して退会します。元に戻せません。続けますか?'))) return;
        A.deleteAccount().then(function () { st.open = null; say(L3('계정을 삭제했습니다.', 'Account deleted.', 'アカウントを削除しました。')); reload(); }, function (er) {
          warn(er); var c = (er && er.code) || ''; reload();
          say(/requires-recent-login/.test(c) ? errMsg(er) : L3('삭제하지 못했습니다. 잠시 뒤 다시 시도해 주세요.', 'Could not delete. Please try again shortly.', '削除できませんでした。しばらくしてからもう一度お試しください。'));
        });
      }
    };
    reload();
  };

  window.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      A.configure();
      var t = SG.toTitle; if (t) SG.toTitle = function () { var r = t.apply(this, arguments); A.render(); return r; };
    }, 0);
  });
})();
