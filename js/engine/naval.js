/* 해전·주둔 압박·강대국 멸망 (게임 추상화 모델)
 * ① 바다를 건너는 원정(공격)은 상륙 전에 해상 작전(함대 결전·화공선·야간 도해·호송·봉쇄)을 고른다. 결과가 상륙전의 사기·병력에 영향을 준다.
 * ② 바다로 오는 침공(왜구·당의 상륙)은 수군으로 해상 요격할 수 있다. 요격이 성공하면 상륙하는 적군이 줄어든다.
 * ③ 수군은 해마다 해상 교역 수입을 가져오고 수군 조련 명령으로 키울 수 있다.
 * ④ 특정 성 둘레에 병력을 주둔시켜 압박한다(외교). 상대는 조공·화친을 하거나 도발할 수 있고, 나중에 그 성을 칠 때 집결해 둔 병력이 합류한다.
 * ⑤ 당과 왜도 남은 성이 일정 수 아래로 줄면 멸망한다(도읍 함락 외의 길).
 * T()/F()는 반드시 파일을 읽을 때(함수 밖에서) 부른다. F는 숫자 자리를 {n}으로 등록해 번역이 숫자와 상관없이 통하게 한다. */
(function () {
  var TR = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
  function T(k, e, j) { TR.en[k] = e; TR.ja[k] = j; var I = SG.i18n; if (I && I.dict && I.dict.en) { I.dict.en[k] = e; I.dict.ja[k] = j; } return k; } // 실행 중에 부르면 사전에도 바로 등록
  function F(k, e, j) { T(k, e, j); var a = [].slice.call(arguments, 3), i = 0; return k.replace(/\{n\}/g, function () { var v = a[i++]; return typeof v === 'number' ? v.toLocaleString() : v; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function $(s, r) { return (r || document).querySelector(s); }
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function short(pl) { return pl ? pl.name.replace(/\(.*?\)/g, '').trim() : ''; }
  var P = SG.Sandbox.prototype, STAY = { garrison: 1, guard: 1 };

  /* ───────── 수군 전력 ───────── */
  P.myFleet = function () { var id = this.units.navy, n = (this.g.state.army[id] || 0); return { id: id, n: n }; };
  P.foeFleet = function (side) {
    var role = this.roleOf(side), w = role && this.s.world[role] || { p: 50, commit: 0 }, n;
    if (role === 'tang') n = 3500 * (0.7 + w.commit / 80); else if (role === 'wa') n = 2400 * (0.6 + w.p / 80); else n = 1500 * (0.5 + w.p / 100);
    var rs = (SG.sideRoles && SG.sideRoles[side]) || SG.sideRoles.silla;
    return { id: rs.navy, n: Math.round(n * (0.85 + Math.random() * 0.3) / 50) * 50 };
  };
  // 해전 한 번(예측과 실제가 같은 규칙)
  P.seaBattle = function (side, foe, stance, title, season) {
    var my = this.myFleet(), A = { name: 'a', side: this.side, units: [{ id: my.id, n: my.n }], train: this.s.realm.train, bl: this.myBL ? this.myBL() : {}, stance: stance, morale: this.myMorale(), terrain: 1 };
    var B = { name: 'b', side: side, units: [{ id: foe.id, n: foe.n }], train: this.foeTrain ? this.foeTrain(side) : 50, bl: this.foeBL ? this.foeBL(side) : {}, morale: 66, terrain: 1 };
    if (stance === 'ambush') A.ambush = true;
    return SG.battle(A, B, { rounds: 5, tk: 'sea', season: season || '' });
  };
  function odds(r) { var ratio = r.aEnd / (r.aStart || 1); return r.winner === 'a' ? (ratio >= 0.6 ? T('●●● 유리', 'Favorable ●●●', '有利 ●●●') : T('●●○ 박빙(우세)', 'Close (slight edge) ●●○', '互角(やや優勢) ●●○')) : (r.aEnd / (r.bEnd + 1) > 0.5 ? T('●○○ 불리', 'Unfavorable ●○○', '不利 ●○○') : T('○○○ 매우 불리', 'Very unfavorable ○○○', '非常に不利 ○○○')); }

  var OPT = {
    fleet: { nm: T('함대 결전', 'Fleet Battle', '艦隊決戦'), hint: T('정면으로 적 선단을 깨고 바다를 연다. 가장 정직한 방법.', 'Break the enemy fleet head-on and open the sea. The straightforward way.', '正面から敵船団を破り海を開く。最も正攻法。'), st: 'balanced' },
    fire: { nm: T('화공선 투입', 'Fire Ships', '火攻船の投入'), hint: T('불붙인 배로 적 선단을 태운다. 마른 가을에 강하고 여름엔 약하다. 금 3.', 'Burn the enemy fleet with fire ships. Strong in dry autumn, weak in summer. Gold 3.', '火をつけた船で敵船団を焼く。乾いた秋に強く、夏は弱い。金3。'), st: 'fire', gold: 3 },
    night: { nm: T('야간 도해·기만', 'Night Crossing & Feint', '夜間渡海・欺瞞'), hint: T('어둠을 타고 적 선단을 피해 건넌다. 첩보와 수군이 높을수록 들키지 않는다. 들키면 매복 상태로 싸운다.', 'Slip past the enemy fleet in darkness. Higher intel and navy mean less chance of being seen. If spotted, fight from an ambush stance.', '闇に紛れて敵船団を避けて渡る。諜報と水軍が高いほど見つかりにくい。見つかれば伏兵の構えで戦う。'), st: 'ambush' },
    escort: { nm: T('호송 선단 편성', 'Escort Convoy', '護送船団の編成'), hint: T('수송선을 수군이 에워싸고 건넌다. 싸움은 방어적이지만 패해도 상륙군 손실이 반으로 준다.', 'Warships ring the transports. A defensive fight, and even a defeat halves the landing force’s losses.', '輸送船を水軍が囲んで渡る。守りの戦いだが、敗れても上陸軍の損害が半分になる。'), st: 'hold' },
    blockade: { nm: T('해상 봉쇄 (상륙 안 함)', 'Naval Blockade (no landing)', '海上封鎖(上陸しない)'), hint: T('상륙하지 않고 바닷길을 끊어 적국을 말려 죽인다. 군량 4. 적의 국력이 깎이고 증원이 줄지만 성은 얻지 못한다.', 'Cut the sea lanes instead of landing to bleed the enemy. Food 4. Its strength and reinforcements fall, but no castle is taken.', '上陸せず海路を断って敵国を締め上げる。食糧4。敵の国力と増援は減るが、城は得られない。'), st: 'none' },
    ambushd: { nm: T('해안 매복선', 'Coastal Ambush Ships', '沿岸の伏兵船'), hint: T('섬과 만 뒤에 배를 숨겼다가 적 선단을 덮친다. 첫 합에 큰 타격.', 'Hide ships behind islands and bays, then pounce on the enemy fleet. A heavy blow in the first round.', '島や湾の陰に船を隠し、敵船団を襲う。初合で大打撃。'), st: 'ambush' }
  };
  var TX = {
    title: T('해상 작전', 'Naval Operation', '海上作戦'), cancel: T('취소 (행동력은 쓰이지 않음)', 'Cancel (no action points spent)', '取り消し(行動力は消費されない)'),
    abort: T('함대가 격파되어 상륙을 단념하고 돌아섰습니다. 수송선 일부와 병력을 잃었습니다.', 'The fleet was shattered and the landing abandoned. Some transports and troops were lost.', '艦隊が撃破され、上陸を断念して引き返しました。輸送船の一部と兵を失いました。'),
    evade: T('야음을 틈타 적 선단을 피해 건넜습니다. 병사들은 쉬고 사기가 올랐습니다.', 'Under cover of night the fleet slipped past the enemy. The troops rested and morale rose.', '夜陰に乗じて敵船団を避けて渡りました。兵は休み、士気が上がりました。'),
    won: T('바다를 장악했습니다. 상륙군은 사기를 올리고 해안에 올랐습니다.', 'The sea is ours. The landing force came ashore with high morale.', '制海権を得ました。上陸軍は士気を高めて海岸に上がりました。'),
    held: T('피해를 입었으나 길을 열었습니다. 상륙은 계속됩니다.', 'Losses were taken but the way is open. The landing proceeds.', '損害は受けましたが、道は開けました。上陸は続行されます。'),
    block: T('바닷길을 끊었습니다. 적국의 교역과 증원이 막혀 국력이 깎입니다. 성은 얻지 못했습니다.', 'The sea lanes are cut. Enemy trade and reinforcements are choked and its strength drains. No castle was taken.', '海路を断ちました。敵国の交易と増援が止まり、国力が削がれます。城は得られませんでした。'),
    vs: T('우리 수군', 'Our navy', '我が水軍'), foe: T('적 선단(추정)', 'Enemy fleet (est.)', '敵船団(推定)')
  };

  /* ───────── ① 바다를 건너는 원정 ───────── */
  P.isSeaTarget = function (T_) { var pl = T_ && SG.placeById(T_.place); return !!(T_ && (T_.oversea || (pl && pl.kind === 'island'))); };
  P.seaPlan = function (Tg, frac, tac, go) {
    var self = this, g = this.g, s = this.s, side = Tg.side || this.sides.silla, role = this.roleOf(side), my = this.myFleet(), foe = this.foeFleet(side), season = this.seasonOf(null);
    var wrap = h('div', 'modal dock'), card = h('div', 'card'), keys = ['fleet', 'fire', 'night', 'escort', 'blockade'];
    var intel = s.realm.intel, fl = intel >= 50 ? '' : '≈';
    card.innerHTML = '<h2>' + TX.title + ' — ' + this.L(Tg.name) + '</h2><div class="sub">' + TX.vs + ' ' + my.n.toLocaleString() + ' · ' + TX.foe + ' ' + fl + (intel < 10 ? '?' : (Math.round(foe.n / 100) * 100).toLocaleString()) + '</div><div class="laws" id="sp-l"></div><div style="text-align:right;margin-top:10px"><button class="btn" id="sp-x">' + TX.cancel + '</button></div>';
    var box = $('#sp-l', card), btns = {};
    keys.forEach(function (k) {
      var o = OPT[k], b = h('button', 'ch', o.nm + '<small>' + o.hint + '</small>'), dis = false, sm = $('small', b);
      if (o.gold && g.state.res.gold < o.gold) dis = true;
      if (k === 'blockade' && (g.state.res.food < 4 || my.n < 500)) dis = true;
      if ((k === 'fleet' || k === 'fire' || k === 'escort') && my.n < 300) dis = true;
      if (!dis && o.st !== 'none' && k !== 'night') { var f = self.seaBattle(side, foe, o.st, '', season); sm.innerHTML += ' <b>· ' + odds(f) + '</b>'; }
      if (k === 'night') sm.innerHTML += ' <b>· ' + F('들키지 않을 확률 약 {n}%', 'Chance to go unseen: about {n}%', '見つからない確率およそ{n}%', Math.round(self.evadeChance() * 100)) + '</b>';
      b.disabled = dis; b.onclick = function () { wrap.remove(); self.seaResolve(Tg, frac, tac, k, side, role, foe, go); }; box.appendChild(b); btns[k] = b;
    });
    $('#sp-x', card).onclick = function () { wrap.remove(); s.last = T('출병을 거두었습니다. (행동력은 쓰이지 않았습니다)', 'The expedition was called off. (No action points were spent.)', '出兵を取りやめました。(行動力は消費されていません)'); self.renderTurn(); };
    wrap.appendChild(card); g.root.appendChild(wrap);
  };
  P.evadeChance = function () { var bl = this.myBL ? this.myBL().navy : 0; return clamp(0.25 + this.s.realm.intel / 200 + bl * 0.05, 0.15, 0.85); };
  P.loseField = function (frac, pct) { var A = this.g.state.army; this.fieldUnits(frac).forEach(function (u) { if (A[u.id]) A[u.id] = Math.max(0, A[u.id] - Math.round(u.n * pct)); }); this.g.renderArmy(); this.g.hud(); };
  P.seaResolve = function (Tg, frac, tac, k, side, role, foe, go) {
    var self = this, g = this.g, s = this.s, o = OPT[k], season = this.seasonOf(null), my = this.myFleet();
    if (o.gold) this.pay({ gold: o.gold });
    if (k === 'blockade') {
      this.pay({ food: 4 }); var w = role && s.world[role]; if (w) { w.p = Math.max(4, w.p - (role === 'tang' ? 2 : 4)); if (role === 'tang') w.commit = Math.max(0, w.commit - 5); else w.hostility = Math.min(100, w.hostility + 6); }
      s.blockade = { role: role, year: s.year }; this.log(T('해상 봉쇄', 'Naval blockade', '海上封鎖'));
      s.last = '<b>' + o.nm + ' — </b>' + TX.block; return this.after();
    }
    if (k === 'night' && Math.random() < this.evadeChance()) { this._navMor = 4; this.pre = (this.pre || '') + '<div class="freehd">🌙 <b>' + o.nm + ' — </b>' + TX.evade + '</div>'; this.log(o.nm); return go(); }
    var st = k === 'night' ? 'ambush' : o.st, r = this.seaBattle(side, foe, st, '', season), ours = [{ id: my.id, n: my.n }];
    g.battleUI(r, o.nm + ' — ' + this.L(Tg.name), '', function () {
      self.casual(ours, r.aLeft);
      var ratio = r.aEnd / (r.aStart || 1), win = r.winner === 'a' && ratio >= 0.3;
      if (win) {
        self._navMor = ratio >= 0.6 ? 10 : 5; self.pre = (self.pre || '') + '<div class="freehd">⚓ <b>' + o.nm + ' — </b>' + (ratio >= 0.6 ? TX.won : TX.held) + '</div>'; self.log(o.nm + ' ✔');
        var w2 = role && s.world[role]; if (w2 && role !== 'tang') w2.p = Math.max(4, w2.p - 1);
        return go();
      }
      self.loseField(frac, k === 'escort' ? 0.1 : 0.2); self._navMor = 0; self.log(o.nm + ' ✘');
      s.last = '<b>' + o.nm + ' — </b>' + TX.abort + self.eff({ fx: { morale: -6 }, realm: { navy: -3 } }); self.after();
    });
  };

  /* ───────── ② 해상 요격(방어) ───────── */
  function seaInvader(sb, bt, anchor) {
    if (!bt || !bt.defense || bt.loseEnd || bt.last) return false;
    var side = bt.enemy && (bt.enemy.side || ''), role = side && sb.roleOf(side);
    return !!(bt.coast || role === 'tang' || role === 'wa');
  }
  var _wa = P.withAbandon;
  P.withAbandon = function (bt) {
    var list = _wa.apply(this, arguments);
    if (!seaInvader(this, bt) || this.s.realm.navy < 15 || this.myFleet().n < 300 || list.some(function (t) { return t.special === 'intercept'; })) return list;
    var i = list.findIndex(function (t) { return t.special === 'abandon'; }); if (i < 0) i = list.length;
    list.splice(i, 0, { label: T('수군으로 해상 요격한다', 'Intercept at sea with the navy', '水軍で海上迎撃する'), hint: T('상륙하기 전에 바다에서 맞는다. 이기면 상륙하는 적군이 크게 줄고 사기가 오르지만, 지면 수군을 잃고 사기가 꺾인다. 이어서 육상 방어전이 벌어진다.', 'Meet them at sea before they land. A win greatly thins the landing force and lifts morale; a loss costs the fleet and morale. A land defense follows.', '上陸前に海で迎え撃つ。勝てば上陸する敵が大きく減り士気が上がるが、負ければ水軍を失い士気が落ちる。続いて陸上の防衛戦になる。'), special: 'intercept', tag: '海' });
    return list;
  };
  var _fight = P.fight;
  P.fight = function (bt, tac, anchor) {
    if (!tac || tac.special !== 'intercept') return _fight.apply(this, arguments);
    var self = this, g = this.g, s = this.s, e = bt.enemy, side = e.side || this.sides.silla, foe = this.foeFleet(side), my = this.myFleet(), season = this.seasonOf(anchor);
    var def = bt.tactics.filter(function (t) { return !t.special; })[0] || bt.tactics[0];
    var wrap = h('div', 'modal dock'), card = h('div', 'card');
    card.innerHTML = '<h2>' + T('해상 요격', 'Sea Interception', '海上迎撃') + ' — ' + this.L(bt.title || '') + '</h2><div class="sub">' + TX.vs + ' ' + my.n.toLocaleString() + ' · ' + TX.foe + ' ' + (s.realm.intel < 10 ? '?' : '≈' + (Math.round(foe.n / 100) * 100).toLocaleString()) + '</div><div class="laws" id="si-l"></div>';
    ['fleet', 'fire', 'ambushd'].forEach(function (k) {
      var o = OPT[k], b = h('button', 'ch', o.nm + '<small>' + o.hint + ' <b>· ' + odds(self.seaBattle(side, foe, o.st, '', season)) + '</b></small>');
      if (o.gold && g.state.res.gold < o.gold) b.disabled = true;
      b.onclick = function () {
        wrap.remove(); if (o.gold) self.pay({ gold: o.gold });
        var r = self.seaBattle(side, foe, o.st, '', season);
        g.battleUI(r, o.nm + ' — ' + self.L(bt.title || ''), '', function () {
          self.casual([{ id: my.id, n: my.n }], r.aLeft);
          var ratio = r.aEnd / (r.aStart || 1), win = r.winner === 'a' && ratio >= 0.3, killed = 1 - r.bEnd / (r.bStart || 1);
          var bt2 = Object.assign({}, bt), e2 = Object.assign({}, e), f = win ? 1 - 0.5 * clamp(killed, 0, 1) : 1, t0 = e.total;
          e2.total = function (S) { return (typeof t0 === 'function' ? t0(S) : t0) * f; }; bt2.enemy = e2;
          self._navMor = win ? (ratio >= 0.6 ? 8 : 4) : -6;
          self.pre = (self.pre || '') + '<div class="freehd">⚓ <b>' + o.nm + ' — </b>' + (win ? F('적 상륙군이 약 {n}% 줄었습니다. 사기도 올랐습니다.', 'The landing force shrank by about {n}%. Morale rose.', '上陸する敵軍がおよそ{n}%減りました。士気も上がりました。', Math.round((1 - f) * 100)) : T('요격에 실패해 수군을 잃고 사기가 꺾였습니다.', 'The interception failed; the fleet was lost and morale dropped.', '迎撃に失敗し、水軍を失って士気が落ちました。')) + '</div>';
          self.log(o.nm + (win ? ' ✔' : ' ✘'));
          try { _fight.call(self, bt2, def, anchor); } finally { self._navMor = 0; }
        });
      };
      $('#si-l', card).appendChild(b);
    });
    wrap.appendChild(card); g.root.appendChild(wrap);
  };

  var _mm = P.myMorale;
  P.myMorale = function () { var v = _mm.apply(this, arguments); return this._navMor ? clamp(v + this._navMor, 10, 100) : v; };

  /* ───────── ④ 주둔 압박 ───────── */
  P.pressActive = function () { var p = this.s.press; if (!p) return null; var pl = SG.placeById(p.place), ow = pl && this.ownerOf(pl); if (!pl || !ow || ow === this.side) { this.s.press = null; return null; } return p; };
  P.pressReleased = function () { var p = this.s.press; return !!(p && this._relPlace === p.place); };
  var _fu = P.fieldUnits;
  P.fieldUnits = function () {
    var a = _fu.apply(this, arguments), p = this.pressActive(); if (!p || this.pressReleased()) return a;
    a.forEach(function (u) { var U = SG.unitById(u.id); if (U && !STAY[U.base]) u.n = Math.round(u.n * (1 - p.frac)); });
    return a.filter(function (u) { return u.n > 0; });
  };
  var _ft = P.fieldTotal;
  P.fieldTotal = function () { var t = _ft.apply(this, arguments), p = this.pressActive(); return p && !this.pressReleased() ? Math.round(t * (1 - p.frac)) : t; };
  var _lt = P.landTotal;
  P.landTotal = function () { var t = _lt.apply(this, arguments), p = this.pressActive(); return p && !this.pressReleased() ? Math.round(t * (1 - p.frac)) : t; };

  var _wFlow = P.warFlow;
  P.warFlow = function (tid) { var Tg = this.targetById(tid); this._relPlace = Tg ? Tg.place : null; return _wFlow.apply(this, arguments); };
  var _rt = P.renderTurn;
  P.renderTurn = function () { this._relPlace = null; return _rt.apply(this, arguments); };
  var _ex = P.expedition;
  P.expedition = function (Tg) { var ex = _ex.apply(this, arguments), p = this.s.press; if (p && Tg && p.place === Tg.place) { ex.loss = 0; ex.mor = 0; ex.food = 0; ex.amb *= 0.3; ex.storm *= 0.5; ex.staged = true; } return ex; };

  // 공격 진행: 바다 건너면 해상 작전, 집결해 둔 곳이면 병력 합류
  var _wf = P.warFight;
  P.warFight = function (Tg, frac, tac) {
    var self = this, p = this.s.press, staged = !!(p && Tg && p.place === Tg.place);
    var go = function () {
      if (staged) { self._relPlace = Tg.place; self._navMor = (self._navMor || 0) + 6; self.pre = (self.pre || '') + '<div class="freehd">🚩 <b>' + T('집결해 둔 병력이 합류했습니다', 'The massed troops joined the assault', '集結させていた兵が合流しました') + ' — </b>' + T('행군 피로가 없고 사기가 올랐습니다.', 'No march fatigue, and morale is up.', '行軍の疲れはなく、士気が上がっています。') + '</div>'; }
      try { _wf.call(self, Tg, frac, tac); } finally { self._navMor = 0; if (staged) { self.s.press = null; if (self.g.map) self.g.map.removeToken('own_press'); } }
    };
    if (this.isSeaTarget(Tg)) return this.seaPlan(Tg, frac, tac, go);
    return go();
  };
  var _sw = P.simWar;
  P.simWar = function (Tg) { var p = this.s.press; if (p && Tg && p.place === Tg.place) this._relPlace = Tg.place; return _sw.apply(this, arguments); };

  var PX = {
    title: T('병력 주둔 압박', 'Garrison Pressure', '兵力駐屯による圧迫'),
    sub: T('상대의 성 둘레에 병력을 보내 압박합니다. 해마다 군량이 들고 그 병력은 다른 곳에 쓸 수 없지만, 상대가 조공이나 화친을 청할 수 있고, 나중에 그 성을 치면 집결해 둔 병력이 피로 없이 합류합니다. 상대가 도발해 올 위험도 있습니다. (한 곳만 가능)', 'Send troops to ring a rival castle. It costs food every year and those troops are unavailable elsewhere, but the rival may offer tribute or peace, and if you later attack that castle the massed troops join without fatigue. The rival may also lash out. (One front at a time.)', '相手の城の周囲に兵を送って圧迫します。毎年食糧がかかり、その兵は他で使えませんが、相手が貢ぎ物や和睦を申し出ることがあり、後にその城を攻めれば集結させた兵が疲れなく合流します。相手が挑発してくる危険もあります。(一か所のみ)'),
    share: T('주둔 병력 비율', 'Share of troops', '駐屯兵の割合'), cancel: T('취소', 'Cancel', '取り消し'),
    end: T('주둔 철수', 'Withdraw Pressure Force', '駐屯部隊の撤収'), endDesc: T('압박하던 병력을 거두어 본국으로 돌립니다.', 'Pull the massed troops back home.', '圧迫していた兵を引き上げて本国へ戻します。'),
    cmd: T('병력 주둔 압박 (외교)', 'Garrison Pressure (Diplomacy)', '兵力駐屯による圧迫(外交)'), cmdDesc: T('상대 성 둘레에 병력을 주둔시켜 전쟁을 준비하거나 상대를 압박합니다. 조공·화친을 끌어낼 수도, 도발을 부를 수도 있습니다.', 'Station troops around a rival castle to prepare for war or to press the rival. It may draw tribute or peace, or provoke an attack.', '相手の城の周囲に兵を駐屯させ、戦の準備や圧迫を行います。貢ぎ物や和睦を引き出すことも、挑発を招くこともあります。')
  };
  P.pressUI = function (c) {
    var self = this, g = this.g, s = this.s, wrap = h('div', 'modal dock'), card = h('div', 'card');
    card.innerHTML = '<h2>' + PX.title + '</h2><div class="sub">' + PX.sub + '</div><div class="row" style="grid-template-columns:110px 1fr 60px"><div><b>' + PX.share + '</b></div><input type="range" id="pr-r" min="10" max="40" step="5" value="25"><div class="v" id="pr-v">25%</div></div><div class="laws" id="pr-l"></div><div style="text-align:right;margin-top:10px"><button class="btn" id="pr-x">' + PX.cancel + '</button></div>';
    var mine = (this.myPlaces ? this.myPlaces() : []).concat([SG.placeById(this.cfg.capPlace)]).filter(Boolean), seen = {}, list = [];
    this.targets().forEach(function (Tg) { var pl = SG.placeById(Tg.place); if (!pl || seen[pl.id]) return; seen[pl.id] = 1; var bd = 99; mine.forEach(function (m) { var d = dist(m, pl); if (d < bd) bd = d; }); list.push({ T: Tg, pl: pl, d: bd }); });
    list.sort(function (a, b) { return a.d - b.d; });
    list.slice(0, 14).forEach(function (x) {
      var role = self.roleOf(x.T.side), nm = (SG.sideName && SG.sideName[x.T.side]) || x.T.side;
      var b = h('button', 'ch', self.L(x.T.name) + '<small>' + nm + ' · ' + self.estimate(x.T.garrison) + (x.T.oversea ? ' · ' + T('바다 건너', 'overseas', '海の向こう') : '') + '</small>');
      b.onclick = function () { var fr = +$('#pr-r', card).value / 100; wrap.remove(); self._pressSel = { place: x.pl.id, frac: fr }; self.run(c, { pressPick: true }); };
      b.onmouseenter = function () { if (g.map) g.map.focus(x.pl.lon, x.pl.lat, 900, 600); };
      $('#pr-l', card).appendChild(b);
    });
    if (!list.length) $('#pr-l', card).innerHTML = '<div class="note">' + T('압박할 상대의 성이 없습니다.', 'There is no rival castle to press.', '圧迫できる相手の城がありません。') + '</div>';
    $('#pr-r', card).oninput = function () { $('#pr-v', card).textContent = this.value + '%'; };
    $('#pr-x', card).onclick = function () { wrap.remove(); self.renderTurn(); };
    wrap.appendChild(card); g.root.appendChild(wrap);
  };
  var _run = P.run;
  P.run = function (c, opt) { if (c && c.id === 'press' && !(opt && opt.pressPick)) { var why = this.cmdAvail(c); if (why) { this.s.last = '지금은 할 수 없습니다 — ' + why; return this.renderTurn(); } return this.pressUI(c); } return _run.apply(this, arguments); };
  var _dd = P.drawDeploy;
  P.drawDeploy = function () {
    var r = _dd.apply(this, arguments), p = this.pressActive(), pl = p && SG.placeById(p.place), m = this.g.map;
    if (m) { if (p && pl) m.setToken('own_press', this.side, T('주둔', 'Posted', '駐屯'), (Math.round(p.n / 100) / 10) + T('천', 'k', '千'), pl.lon + 0.12, pl.lat - 0.1, 'own'); else m.removeToken('own_press'); }
    return r;
  };

  // 해마다: 군량·도발·조공
  P.pressYear = function () {
    var self = this, s = this.s, p = this.pressActive(); if (!p) return;
    var pl = SG.placeById(p.place), ow = this.ownerOf(pl), role = this.roleOf(ow), w = role && s.world[role], Tg = this.dynTarget(pl, ow), yrs = s.year - p.since, out = [], chips = '';
    var upkeep = Math.max(1, Math.round(p.frac * 10)); chips += this.eff({ fx: { food: -upkeep } });
    p.n = Math.round(this.landTotal() / Math.max(0.2, 1 - p.frac) * p.frac);
    if (yrs >= 2) chips += this.eff({ fx: { morale: -2 } });
    if (w) {
      if (role === 'tang') { w.commit = Math.min(100, w.commit + 4); s.rel.tang = clamp((s.rel.tang || 50) - 3, 0, 100); }
      else { w.hostility = Math.min(100, w.hostility + 3 + Math.round(p.frac * 10)); w.p = Math.max(4, w.p - 1); s.rel[role] = clamp((s.rel[role] || 50) - 2, 0, 100); }
      var ratio = this.landTotal() * p.frac / Math.max(500, Tg.garrison), conc = role === 'tang' ? 0 : clamp(0.06 + 0.2 * (ratio - 0.6), 0, 0.45);
      var nm = this.names[role].replace('(멸망)', '');
      if (Math.random() < conc) {
        var tg = Math.max(6, Math.round((Tg.gold || 10) * 0.7)), tf = Math.round(tg * 1.2);
        chips += this.eff({ fx: { gold: tg, food: tf }, world: (function () { var o = {}; o[role + '.p'] = -2; return o; })() });
        out.push('💰 <b>' + nm + ' — </b>' + T('주둔한 대군에 겁을 먹고 사신을 보내 조공과 화친을 청했습니다.', 'Frightened by the massed army, it sent envoys with tribute and a plea for peace.', '駐屯する大軍に怯え、使者を送って貢ぎ物と和睦を申し出ました。'));
        this.log(T('주둔 압박으로 조공을 받음', 'Tribute extracted by troop pressure', '駐屯圧迫で貢ぎ物を得る'));
      } else if (w.hostility >= 70 && Math.random() < 0.3) {
        var loss = Math.round(p.n * 0.04); var A = this.g.state.army; Object.keys(A).forEach(function (k) { var U = SG.unitById(k); if (U && !STAY[U.base]) A[k] = Math.max(0, A[k] - Math.round(A[k] * 0.03)); });
        chips += this.eff({ fx: { morale: -3 } });
        out.push('⚔ <b>' + nm + ' — </b>' + F('국경의 대치가 격해져 작은 충돌이 벌어졌고 우리 병력 약 {n}명이 상했습니다.', 'The standoff grew heated and a skirmish broke out; about {n} of our troops were hurt.', '国境の対峙が激化して小競り合いが起き、我が軍のおよそ{n}名が傷つきました。', loss));
      }
    }
    this.pre = (this.pre || '') + '<div class="freehd">🚩 <b>' + PX.title + ' — </b>' + '<b>' + short(pl) + ' — </b>' + F('병력 약 {n}명을 주둔시켜 압박 중입니다 (군량 {n}).', 'Pressing with about {n} troops stationed there (food {n}).', '兵およそ{n}名を駐屯させて圧迫中です(食糧{n})。', p.n, upkeep) + chips + (out.length ? '<br>' + out.join('<br>') : '') + '</div>';
  };

  /* ───────── ③ 해상 교역 ───────── */
  P.seaTrade = function () {
    var n = this.s.realm.navy, inc = n >= 70 ? 4 : n >= 40 ? 2 : 0; if (!inc) return;
    var bl = this.s.blockade; if (bl && bl.year >= this.s.year - 0) { }
    this.pre = (this.pre || '') + '<div class="freehd">⚓ ' + F('수군이 바닷길을 지켜 해상 교역 수입이 들어왔습니다 (금 +{n}).', 'The navy guards the sea lanes and sea-trade income arrived (gold +{n}).', '水軍が海路を守り、海上交易の収入が入りました(金+{n})。', inc) + this.eff({ fx: { gold: inc } }) + '</div>';
  };

  /* ───────── ⑤ 당·왜의 멸망 ───────── */
  T('왜(멸망)', 'Wa (fallen)', '倭(滅亡)'); T('당(멸망)', 'Tang (fallen)', '唐(滅亡)'); T('왜 멸망', 'Wa falls', '倭の滅亡'); T('당 멸망', 'Tang falls', '唐の滅亡');
  var LIM = { tang: 5, wa: 2 };
  P.empireCheck = function () {
    var self = this, s = this.s;
    ['tang', 'wa'].forEach(function (role) {
      var side = self.sides[role], w = s.world[role]; if (!side || !w || (s.destroyed && s.destroyed[side])) return;
      var all = self.places().filter(function (p) { return p.side === side || (s.owners && s.owners[p.id] === side); });
      var left = all.filter(function (p) { return self.ownerOf(p) === side; }).length, mineN = all.filter(function (p) { return self.ownerOf(p) === self.side; }).length;
      if (!all.length || left > LIM[role] || (all.length - left) < 3) return;
      var nm = self.names[role].replace('(멸망)', '');
      s.destroyed = s.destroyed || {}; s.destroyed[side] = s.year; w.p = Math.min(w.p, 4); w.hostility = 0; if (role === 'tang') w.commit = 0;
      if (self.names[role].indexOf('멸망') < 0) self.names[role] += '(멸망)';
      var chips = mineN >= 3 ? self.eff({ fx: { gold: 40, morale: 12, people: 5 }, realm: { royal: 8 } }) : '';
      self.pre = (self.pre || '') + '<div class="freehd">👑 <b>' + nm + '</b> <b>' + T('멸망', 'falls', '滅亡') + ' — </b>' + T('많은 성을 잃어 조정이 더 버티지 못하고 무너졌습니다. 남은 성들은 주인을 잃고 이웃 나라들이 차지할 것입니다.', 'Having lost so many castles, its court could hold no longer and collapsed. Its remaining castles will be claimed by neighbors.', '多くの城を失った朝廷はもちこたえられず崩れ去りました。残った城は主を失い、近隣諸国が奪うでしょう。') + chips + '</div>';
      self.log(nm + ' 멸망');
    });
  };

  var _ye = P.yearEnd;
  P.yearEnd = function () {
    try { this.empireCheck(); this.pressYear(); this.seaTrade(); } catch (e) { console.warn('naval', e); }
    return _ye.apply(this, arguments);
  };

  /* ───────── 명령 ───────── */
  var CM = [
    { id: 'press', cat: '외교', name: PX.cmd, desc: PX.cmdDesc, cost: { food: 3 }, hist: '가상', eff: {}, req: function (ctx) { return !(ctx.sb && ctx.sb.s.press); }, lines: [T('병력이 국경의 성 둘레에 진을 쳤습니다.', 'The troops encamped around the border castle.', '兵が国境の城の周囲に陣を張りました。')],
      fn: function (g) { var sb = g.sb, sel = sb._pressSel; if (!sel) return null; var n = Math.round(sb.landTotal() * sel.frac); sb.s.press = { place: sel.place, frac: sel.frac, n: n, since: sb.s.year }; sb._pressSel = null; sb.drawDeploy(); var pl = SG.placeById(sel.place); return { text: short(pl) + ' — ' + F('병력 약 {n}명이 진을 쳤습니다.', 'About {n} troops encamped there.', '兵およそ{n}名が陣を張りました。', n) }; } },
    { id: 'press_end', cat: '외교', name: PX.end, desc: PX.endDesc, cost: {}, hist: '가상', eff: {}, req: function (ctx) { return !!(ctx.sb && ctx.sb.s.press); }, lines: [T('압박하던 병력이 본국으로 돌아왔습니다.', 'The massed troops returned home.', '圧迫していた兵が本国へ戻りました。')],
      fn: function (g) { g.sb.s.press = null; g.sb.drawDeploy(); return null; } },
    { id: 'sea_drill', cat: '군사', name: T('수전 조련 (수군 훈련)', 'Naval Drill', '水戦の調練'), desc: T('전선을 몰고 화공·충각·승선전을 연습합니다. 수군력이 오릅니다.', 'Practice fire attacks, ramming and boarding at sea. Raises naval strength.', '戦船を駆って火攻・衝角・接舷戦を練習します。水軍力が上がります。'), cost: { gold: 4, food: 2 }, hist: '가상', eff: { realm: { navy: 6, train: 1 } },
      lines: [T('수군이 서해 앞바다에서 선단 기동과 화공 훈련을 거듭했습니다.', 'The navy repeated fleet maneuvers and fire-attack drills off the western sea.', '水軍が西海の沖で船団機動と火攻の訓練を重ねました。')] }
  ];
  SG.data.commands = (SG.data.commands || []).concat(CM);
})();
