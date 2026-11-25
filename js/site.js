/* 사이트 설정: 방문자 집계 · 의견 창구 · 모바일 지도 보기 버튼.
   방문자 집계는 GOATCOUNTER_CODE 를 채우면 켜진다 (goatcounter.com 무료 가입 후 사이트 코드). */
(function () {
  var CFG = window.SITE = {
    GOATCOUNTER_CODE: '',                                              // 예: 'samgukwang' → https://samgukwang.goatcounter.com
    FEEDBACK_URL: 'https://github.com/kjuhoho/samgukwang/issues/new',  // 의견·버그 제보 창구
    URL: 'https://kjuhoho.github.io/samgukwang/',                      // 결과 공유 글에 넣는 주소
    TRIAL_TURNS: 5,                                                    // 로그인 전에 해 볼 수 있는 턴 수 (아래 FIREBASE 가 채워져 있을 때만 제한이 걸립니다)
    // 구글 로그인·기록 저장(Firebase) 설정. 비워 두면 로그인·체험 제한이 꺼지고 기록은 이 기기에만 저장됩니다.
    // 아래 값은 비밀번호가 아니라 '주소 같은 공개 값'입니다. 실제 보안은 Firestore 규칙(tools/firebase/firestore.rules)이 담당합니다.
    // 다시 만드는 방법: tools/firebase/설정방법.md
    FIREBASE: {
      apiKey: 'AIzaSyB4bm0lelJraSgDHnX0M9Wi8ub5Ku3s-cY',
      authDomain: 'samgukwang.firebaseapp.com',
      projectId: 'samgukwang',
      appId: '1:1087235290625:web:81a2b37d055b2f23daf200'
    }
  };
  if (CFG.GOATCOUNTER_CODE) {
    var s = document.createElement('script'); s.async = true; s.src = '//gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', 'https://' + CFG.GOATCOUNTER_CODE + '.goatcounter.com/count'); document.head.appendChild(s);
  }
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () {
    var app = document.getElementById('app'); if (!app) return;
    // 타이틀 화면의 의견 링크
    var t = document.querySelector('#title > div');
    if (t) { var a = document.createElement('a'); a.className = 'fb-link'; a.href = CFG.FEEDBACK_URL; a.target = '_blank'; a.rel = 'noopener'; a.textContent = '💬 의견 보내기 · 버그 제보'; t.appendChild(a); }
    // 모바일: 정무창을 접고 지도를 크게 보는 버튼
    var b = document.createElement('button'); b.id = 'mtoggle'; b.type = 'button'; b.textContent = '🗺 지도 보기';
    b.onclick = function () { var on = document.body.classList.toggle('mapview'); b.textContent = on ? '📜 정무 열기' : '🗺 지도 보기'; };
    app.appendChild(b);
  });
})();
