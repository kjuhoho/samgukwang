/* 끝장 모드: 재위가 끝나도(패업·중흥·유지·쇠락·생존 결말) 후계 시대로 이어서 계속 통치한다.
 * - 한 번에 20년씩 연장. 연장 구간에는 짜인 사건이 없고 랜덤 사건·침공·정무가 이어진다.
 * - 망국·정변·민란·항복·퇴위는 진짜 끝이다.
 * - 나중에 유료화할 때는 SG.features.endless 를 조건으로 바꾸면 된다. */
(function () {
  SG.features = SG.features || {};
  if (SG.features.endless == null) SG.features.endless = true;
  var P = SG.Sandbox.prototype, EXT = 20, OK = '霸興守衰存延';

  // 시나리오 설정은 판마다 공유되므로 원래 종료 연도를 기억해 두고 새 판마다 되돌린다
  var _init = P.init;
  P.init = function () { var c = this.cfg; if (c.end0 == null) c.end0 = c.end; else c.end = c.end0; return _init.apply(this, arguments); };

  // 연장 구간이 끝나면 짜인 마지막 장면을 되풀이하지 않고 곧장 결말로
  var _finale = P.finale;
  P.finale = function () { if (this.s.extended) return this.finish(null); return _finale.apply(this, arguments); };

  var _endUI = SG.Game.prototype.endUI;
  SG.Game.prototype.endUI = function (sc) {
    var r = _endUI.apply(this, arguments), self = this, sb = this.sb, e = sc && sc.ending;
    if (!SG.features.endless || !sb || !e || !e.seal || OK.indexOf(e.seal) < 0) return r;
    var go = {
      c: { label: '왕조를 이어 계속 통치하기 (후계 시대 +20년)', tag: '∞' },
      run: function () {
        var s = sb.s; s.extended = (s.extended || 0) + 1; s.shown.__fin = 1;
        s.endNew = Math.max(sb.cfg.end, s.year) + EXT; sb.applyMoved();
        s.ap = 3; s.last = '<b>왕조는 이어집니다.</b> 다음 왕이 뒤를 이었습니다. 이제부터는 사료에 없는 길입니다.';
        sb.log('후계 시대 — 왕조가 이어지다');
        self.hud(); self.go('__turn__');
      }
    };
    this.choices([go, { c: { label: '다시 시작하기 (왕 추첨으로)', tag: '↺' }, run: function () { SG.toTitle(); } }]);
    return r;
  };
})();
