/* 위협(난이도): ① 왜구의 연안 약탈 ② 대국(당)의 돌발 침략 ③ 내가 너무 강해지면 남은 나라들이 연합해 견제한다.
   실제 역사와 다르게 전개될 수 있다(게임 규칙). */
(function () {
  var P = SG.Sandbox.prototype;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // 세력 우위 점수: 점령지·멸망시킨 나라·불어난 병력
  P.dominance = function () {
    var s = this.s, hd = this.holdings ? this.holdings().n : 0, dead = Object.keys(s.destroyed || {}).length, fallen = Object.keys(s.fallen || {}).length;
    if (s.army0 == null) s.army0 = this.armyTotal();
    var grow = Math.max(0, (this.armyTotal() - s.army0 * 1.4) / 6000);
    return hd + dead * 4 + fallen * 1.5 + grow;
  };
  P.aliveRoles = function () {
    var self = this, s = this.s, d = s.destroyed || {};
    return ['silla', 'goguryeo', 'tang', 'wa'].filter(function (k) { var side = self.sides[k]; return side !== self.side && !d[side] && s.world[k]; });
  };
  function tactics(sb, coal) {
    var s = sb.s, t = [
      { label: '성에 의지해 막는다', hint: '방비가 높을수록 유리. 피해를 줄이는 정석.', ours: { terrain: 1.35 + s.realm.defense / 300 } },
      { label: '야전에서 결전한다', hint: '사기와 훈련도가 높으면 큰 승리를 노릴 수 있다.', ours: { morale: 6 } },
      { label: '요충에 매복한다', hint: '첩보가 30 이상이어야 적의 길목을 안다.', ours: { ambush: s.realm.intel >= 30, terrain: 1.2 } }
    ];
    if (!coal) t.push({ label: '재물을 주어 돌려보낸다 (금 10)', hint: '싸우지 않고 넘긴다. 실패하면 처참하다.', special: 'bribe', gold: 10 });
    return t;
  }
  P.finishInv = function (inv, fromSide) { // 침공 지점과 승산 표시
    var self = this, org = this.foeOrigin(fromSide), st = this.stations(), best = null;
    if (inv.coast) { var mine = this.myPlaces().filter(function (p) { return p.kind === 'port'; }); if (!mine.length) mine = this.myPlaces(); if (org) mine.sort(function (a, b) { return dist(a, org) - dist(b, org); }); best = mine[0]; }
    else { st.forEach(function (x) { var d = org ? dist(x.pl, org) : 0; if (!best || d < best.d) best = { pl: x.pl, d: d }; }); best = best && best.pl; }
    if (best) { inv.place = best.id; inv.intro += ' 급보가 이른 곳은 <b>' + best.name + '</b> 방면입니다.'; }
    inv.tactics.forEach(function (t) { if (t.special) return; try { t.hint += ' · 승산 ' + self.odds(self.simFight(inv, t)); } catch (e) { } });
    return inv;
  };

  var _inv = P.invasion;
  P.invasion = function () {
    var self = this, s = this.s, y = s.year, N = this.names, dom = this.dominance(), alive = this.aliveRoles();
    s.threat = s.threat || {};
    /* ── ③ 견제 연합 ── */
    var c = s.coal;
    if (c) { // 유지·해체 판단
      c.members = c.members.filter(function (k) { return alive.indexOf(k) >= 0 && s.rel[k] < 65; });
      if (c.members.length < 2 || dom < 3 || c.beaten >= 2) {
        this.pre = (this.pre || '') + '<div class="freehd">🕊 <b>견제 연합 해체</b> — ' + (c.beaten >= 2 ? '거듭 패한 연합은 뜻을 잃고 흩어졌습니다.' : c.members.length < 2 ? '연합에 남은 나라가 없습니다.' : '우리 세력이 줄자 연합은 명분을 잃었습니다.') + '</div>';
        this.log('견제 연합 해체'); s.coal = null; s.threat.truce = y + (c.beaten >= 2 ? 5 : 2); c = null;
      }
    } else if (dom >= 6 && y >= (s.threat.truce || 0)) {
      var mem = alive.filter(function (k) { return k === 'tang' ? (s.world.tang.commit >= 25 || dom >= 10) : k === 'wa' ? s.rel.wa < 45 : s.rel[k] < 65; });
      if (mem.length >= 2) {
        c = s.coal = { since: y, members: mem, beaten: 0 };
        mem.forEach(function (k) { var w = s.world[k]; if (k === 'tang') w.commit = clamp(w.commit + 15, 0, 100); else w.hostility = clamp(w.hostility + 25, 0, 100); s.rel[k] = clamp(s.rel[k] - 20, 0, 100); });
        this.pre = (this.pre || '') + '<div class="freehd">⚠ <b>견제 연합 결성</b> — 우리 세력이 지나치게 커지자 <b>' + mem.map(function (k) { return N[k]; }).join(' · ') + '</b>이(가) 손을 잡았습니다. 해마다 연합군이 쳐들어올 수 있습니다. 두 번 물리치거나, 한 나라와 관계를 65 이상으로 올려 떼어 내면 연합은 무너집니다. <small>(실제 역사와 다른 전개)</small></div>';
        this.log('견제 연합 결성: ' + mem.map(function (k) { return N[k]; }).join('·'));
      }
    }
    if (c && y > c.since && Math.random() < 0.45) {
      var tot = 0, lead = c.members[0], lp = -1;
      c.members.forEach(function (k) { var w = s.world[k], n = k === 'tang' ? 12000 + w.commit * 350 : k === 'wa' ? w.p * 120 : w.p * 230; tot += n; if (n > lp) { lp = n; lead = k; } });
      tot = Math.round(tot * clamp(0.8 + dom / 30, 0.8, 1.4));
      var names = c.members.map(function (k) { return N[k]; }).join('·'), wk = {}; c.members.forEach(function (k) { wk[k + '.p'] = -4; if (k !== 'tang') wk[k + '.hostility'] = -6; });
      s.threat.last = y;
      return this.finishInv({
        title: names + ' 연합군의 침공', defense: true, terrain: 1.1, coalition: true,
        enemy: { name: names + ' 연합군', side: this.sides[lead], total: tot, terrain: 1, morale: 70 },
        intro: '<b>' + names + '</b>이(가) 군을 합쳐 국경을 넘었습니다. 우리의 팽창을 더는 두고 볼 수 없다는 것입니다. 지금까지의 어떤 침공보다 큰 규모입니다.',
        tactics: tactics(this, true),
        win: { text: ['연합군을 물리쳤습니다. 연합에 금이 가기 시작했습니다.'], fx: { morale: 8, people: 3 }, realm: { royal: 4 }, world: wk },
        costly: { text: ['큰 피를 흘렸으나 연합군을 돌려보냈습니다.'], fx: { morale: 1, people: -3 }, realm: { defense: -4 } },
        lose: { text: ['연합군이 변경을 휩쓸었습니다. 성이 넘어가고 백성이 끌려갔습니다.'], fx: { people: -8, morale: -8, food: -10, gold: -8 }, realm: { defense: -8, royal: -5 } }
      }, this.sides[lead]);
    }

    var inv = _inv.apply(this, arguments);
    if (inv) { s.threat.last = y; return inv; }
    if (s.threat.last != null && y - s.threat.last < 2) return null; // 연달아 치지는 않는다

    /* ── ② 대국의 돌발 침략 ── */
    var wt = s.world.tang, ts = this.sides.tang;
    if (alive.indexOf('tang') >= 0 && wt.commit >= 30 && s.rel.tang < 60) {
      var pt = clamp((wt.commit - 25) / 500, 0, 0.12) + clamp(dom / 150, 0, 0.06);
      if (Math.random() < pt) {
        s.threat.last = y; var sea = !this.places().some(function (p) { return self.ownerOf(p) === ts && p.lon >= 124 && p.lon <= 130.6 && p.lat >= 33 && p.lat <= 43; });
        return this.finishInv({
          title: N.tang + '의 침략', defense: true, terrain: 1.15, coast: sea,
          enemy: { name: N.tang + ' 원정군', side: ts, total: Math.round(18000 + wt.commit * 450), terrain: 1, morale: 72 },
          intro: pick(['<b>' + N.tang + '</b>이(가) 조서를 내려 우리의 죄를 묻고 대군을 일으켰습니다.', '<b>' + N.tang + '</b>의 군이 예고 없이 움직였습니다. ' + (sea ? '바다를 건너온 선단이 해안에 닿았습니다.' : '변경의 봉수가 일제히 올랐습니다.')]),
          tactics: tactics(this, false),
          win: { text: [N.tang + '의 원정군은 큰 피해를 입고 물러났습니다.'], fx: { morale: 8, people: 3 }, realm: { royal: 3 }, world: { 'tang.commit': -12 } },
          costly: { text: ['간신히 막아 냈으나 나라가 크게 지쳤습니다.'], fx: { morale: -1, people: -3 }, realm: { defense: -4 }, world: { 'tang.commit': -5 } },
          lose: { text: [N.tang + '의 군이 변경을 짓밟았습니다.'], fx: { people: -8, morale: -8, food: -10 }, realm: { defense: -8, royal: -4 }, world: { 'tang.commit': 6 } }
        }, ts);
      }
    }
    /* ── ① 왜구의 연안 약탈 ── */
    var ww = s.world.wa, wsd = this.sides.wa;
    if (alive.indexOf('wa') >= 0 && s.rel.wa < 65) {
      var pw = clamp(0.03 + ww.hostility / 600 + (60 - s.realm.navy) / 900, 0.02, 0.14);
      if (Math.random() < pw) {
        s.threat.last = y;
        return this.finishInv({
          title: N.wa + '의 연안 약탈', defense: true, terrain: 1.05, coast: true, raid: true,
          enemy: { name: N.wa + ' 선단', side: wsd, total: Math.round(4000 + ww.p * 110 + Math.random() * 3000), terrain: 1, morale: 62, mix: { levy: .5, line: .3, archer: .2 } },
          intro: pick(['<b>' + N.wa + '</b>의 배 수십 척이 해안에 나타나 마을을 불태우고 있습니다.', '바닷가 고을에서 급보가 왔습니다. <b>' + N.wa + '</b>의 선단이 곡식과 사람을 실어 가고 있습니다.']) + ' 수군이 약할수록 자주 겪는 일입니다.',
          tactics: tactics(this, false),
          win: { text: ['약탈하던 무리를 바다로 몰아냈습니다.'], fx: { morale: 4, people: 3 }, world: { 'wa.hostility': -5 } },
          costly: { text: ['쫓아내기는 했으나 바닷가 마을의 피해가 컸습니다.'], fx: { people: -2, food: -3 } },
          lose: { text: ['해안 고을이 약탈당했습니다. 곡식과 재물, 백성을 잃었습니다.'], fx: { people: -6, morale: -4, food: -10, gold: -6 }, realm: { navy: -4 } }
        }, wsd);
      }
    }
    return null;
  };

  // 연합군을 물리친 횟수 기록
  var _after = P.afterFight;
  P.afterFight = function (bt, kind) { if (bt && bt.coalition && this.s.coal && kind !== 'lose') this.s.coal.beaten++; return _after.apply(this, arguments); };

  // 강해질수록 대국이 경계한다 + 연합 중임을 알린다
  var _ye = P.yearEnd;
  P.yearEnd = function () { var s = this.s, d = this.dominance(), w = s.world.tang; if (w && d >= 4 && this.sides.tang !== this.side) w.commit = clamp(w.commit + Math.min(4, d / 3), 0, 100); return _ye.apply(this, arguments); };
  var _rt = P.renderTurn;
  P.renderTurn = function () {
    var s = this.s, c = s.coal, N = this.names;
    if (c && !this.skipping) this.pre = (this.pre || '') + '<div class="freehd">⚠ <b>견제 연합</b> (' + c.since + '년~) — ' + c.members.map(function (k) { return N[k] + ' 관계 ' + Math.round(s.rel[k]); }).join(' · ') + ' · 격퇴 ' + c.beaten + '/2</div>';
    return _rt.apply(this, arguments);
  };
})();
