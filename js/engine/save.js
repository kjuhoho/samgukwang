/* 자동 저장·이어하기: 정무 화면이 뜰 때마다 브라우저(localStorage)에 저장한다. */
(function () {
  var KEY = 'samgukwang.save.v1', P = SG.Sandbox.prototype;
  function $(s) { return document.querySelector(s); }
  SG.save = {
    read: function () { try { var o = JSON.parse(localStorage.getItem(KEY) || 'null'); return o && SG.scenarios[o.id] ? o : null; } catch (e) { return null; } },
    clear: function () { try { localStorage.removeItem(KEY); } catch (e) { } SG.save.button(); },
    write: function (g) {
      try {
        var sb = g.sb; if (!sb) return;
        localStorage.setItem(KEY, JSON.stringify({ id: sb.cfg.id, king: g.scenario.king, year: sb.s.year, at: Date.now(), state: g.state, names: sb.names, sides: sb.sides, targets: sb.cfg.targets }));
      } catch (e) { }
    },
    load: function () {
      var o = SG.save.read(), g = SG.game; if (!o) return false;
      try {
        $('#title').style.display = 'none'; g.start(SG.scenarios[o.id]);
        document.querySelectorAll('.modal').forEach(function (m) { m.remove(); });
        g.state = o.state; g.sb.s = g.state.sb; g.sb.names = o.names || g.sb.names; g.sb.sides = o.sides || g.sb.sides; if (o.targets) g.sb.cfg.targets = o.targets; if (g.sb.applyMoved) g.sb.applyMoved();
        g.hud(); g.renderArmy(); g.sb.s.last = '💾 <b>저장된 판을 이어서 합니다.</b> (' + g.sb.s.year + '년)'; g.go('__turn__');
        return true;
      } catch (e) { console.warn('이어하기 실패', e); SG.save.clear(); if (SG.toTitle) SG.toTitle(); return false; }
    },
    button: function () {
      var host = $('#btn-lot'); if (!host) return; var b = $('#btn-cont'), o = SG.save.read();
      if (!o) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement('button'); b.id = 'btn-cont'; b.className = host.className; host.parentNode.insertBefore(b, host); b.onclick = function () { SG.save.load(); }; }
      b.textContent = '▶ 이어하기 — ' + o.king + ' ' + o.year + '년';
    }
  };
  var _rt = P.renderTurn;
  P.renderTurn = function () { var r = _rt.apply(this, arguments); if (!this.skipping && !this.autoMode) SG.save.write(this.g); return r; };
  var _end = SG.Game.prototype.endUI;
  SG.Game.prototype.endUI = function () { SG.save.clear(); return _end.apply(this, arguments); };
  window.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () { SG.save.button(); var t = SG.toTitle; if (t) SG.toTitle = function () { t.apply(this, arguments); SG.save.button(); }; }, 0);
  });
})();
