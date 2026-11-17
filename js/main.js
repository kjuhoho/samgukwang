/* 진입점: 타이틀(왕 추첨) → 시나리오 시작 */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var game, kings = SG.data.kings, cards = [];
  function build() {
    var box = $('#kings'); box.innerHTML = ''; cards = [];
    kings.forEach(function (k) {
      var c = document.createElement('div');
      k.ready = !!SG.scenarios[k.id];
      c.className = 'kcard' + (k.ready ? '' : ' lock'); c.title = k.ready ? '클릭하면 이 왕으로 바로 시작' : '시나리오 준비 중';
      c.onclick = function () { if (busy || !k.ready) return; if (confirm(k.name + '(으)로 시작할까요?')) begin(k); }; c.style.setProperty('--c', 'var(--c-' + k.side + ')');
      c.innerHTML = '<b><span class="dot"></span>' + k.name + '</b><small>' + SG.sideName[k.side] + ' · ' + k.era + '</small>';
      box.appendChild(c); cards.push(c);
    });
  }
  function begin(king) {
    $('#title').style.display = 'none';
    var scn = SG.scenarios[king.id];
    game.start(scn);
  }
  var busy = false, BAG = 'samgukwang.bag.v1';
  function readBag() { try { var a = JSON.parse(localStorage.getItem(BAG) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function writeBag(a) { try { localStorage.setItem(BAG, JSON.stringify(a)); } catch (e) { } }
  function lottery() {
    if (busy) return; busy = true;
    var msg = $('#lotmsg'); msg.textContent = '';
    var pool = kings.filter(function (k) { return k.ready; });
    // 주머니 추첨: 한 번 나온 왕은 모든 왕이 한 번씩 나올 때까지 다시 나오지 않는다
    var bag = readBag().filter(function (id) { return pool.some(function (k) { return k.id === id; }); });
    if (!bag.length) bag = pool.map(function (k) { return k.id; });
    var cid = bag[Math.floor(Math.random() * bag.length)], chosen = pool.filter(function (k) { return k.id === cid; })[0];
    bag.splice(bag.indexOf(cid), 1); writeBag(bag); var left = bag.length;
    var pick = kings.indexOf(chosen), steps = kings.length * 2 + pick, i = 0;
    cards.forEach(function (c) { c.classList.remove('on', 'gold'); });
    (function tick() {
      cards.forEach(function (c) { c.classList.remove('on'); });
      cards[i % cards.length].classList.add('on');
      if (i >= steps) {
        busy = false; var k = kings[i % kings.length]; cards[i % cards.length].classList.add('gold');
        if (k.ready) { msg.textContent = '운명이 정했습니다 — ' + SG.sideName[k.side] + ' ' + k.name + (left ? ' · 아직 안 나온 왕 ' + left + '명' : ' · 모든 왕이 한 번씩 나왔습니다(다음부터 새로 섞음)') + (pool.length < kings.length ? ' (다른 왕은 준비 중이라 플레이 가능한 왕 중에서 뽑습니다)' : ''); setTimeout(function () { begin(k); }, 1800); }
        else msg.textContent = k.name + '! 아직 시나리오를 준비 중입니다. 다시 뽑거나 의자왕편을 즐겨 보세요.';
        return;
      }
      i++; setTimeout(tick, 55 + Math.pow(i / steps, 3) * 420);
    })();
  }
  SG.toTitle = function () {
    $('#title').style.display = ''; $('#chron').innerHTML = ''; $('#res').innerHTML = ''; $('#army .list').innerHTML = '';
    game.map.clearTokens(); game.map.clearRoutes(); game.map.dynTerr = false; game.map.setTerritory('y660'); game.map.focus(127.6, 38.2, 2300, 800);
    $('#hud .who b').textContent = '三國王'; $('#hud .who span').textContent = '왕을 추첨하세요'; $('#lotmsg').textContent = '';
    cards.forEach(function (c) { c.classList.remove('on', 'gold'); });
  };
  window.addEventListener('DOMContentLoaded', function () {
    game = new SG.Game($('#app')); game.init(); build();
    $('#btn-lot').onclick = lottery;
    $('#btn-uija').onclick = function () { begin(kings.filter(function (k) { return k.id === 'uija'; })[0]); };
    $('#btn-home').onclick = function () { if (confirm('처음 화면으로 돌아갈까요? 진행 상황은 사라집니다.')) SG.toTitle(); };
    SG.game = game;
  });
})();
