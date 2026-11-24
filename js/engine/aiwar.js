/* 적국의 전쟁 (게임 추상화 모델)
 * ① 천하의 움직임을 한층 똑똑하게: 나라마다 해마다 1~2번 원정을 계획한다. 약한 이웃·빈틈·원한·가장 강한 나라를 노리고,
 *    맹약(나라 사이의 동맹)을 맺으며, 싸울수록 지친다. 결과는 지도에 진군선과 영토 변화로 나타난다.
 * ② 이웃이 우리에게 쳐들어오는 일이 조금 늘어난다. 우리의 빈틈(원정으로 빈 본국·낮은 사기·병력 없는 성)을 살펴 어느 성을 칠지 고른다.
 * T()/F()는 반드시 파일을 읽을 때(함수 밖에서) 부른다. */
(function () {
  var TR = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
  function T(k, e, j) { TR.en[k] = e; TR.ja[k] = j; var I = SG.i18n; if (I && I.dict && I.dict.en) { I.dict.en[k] = e; I.dict.ja[k] = j; } return k; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function short(pl) { return pl ? pl.name.replace(/\(.*?\)/g, '').trim() : ''; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var P = SG.Sandbox.prototype, ACT = { baekje: 1, silla: 1, goguryeo: 1, gaya: 1, tang: 1 };
  var KM = { capital: 1.45, city: 1.2, fortress: 1.35, port: 1.1, pass: 1.6 };         // 성의 방어 보정
  var KV = { capital: 0.5, city: 0.2, port: 0.15, fortress: -0.1, pass: -0.2 };        // 성의 매력
  var CFG = SG.AIWAR = { camp: 0.4, strike: 1, maxCamp: 4, eraCap: 3, eraCamp: 0.5, eraMaxCamp: 1, revive: 0.14 };                          // 조절용: 나라당 원정 확률 / 우리에 대한 공세 배수 / 연간 최대 원정 수

  var M = {
    head: T('천하의 움직임', 'Movements of the Realm', '天下の動き'),
    taken: T('점령', 'Captured', '占領'), held: T('격퇴됨', 'Repelled', '撃退された'),
    tail: T('(실제 역사와 다를 수 있습니다)', '(May differ from actual history)', '(史実と異なる場合があります)'),
    pact: T('이 가장 강한 이웃을 견제하려 맹약을 맺었습니다.', 'sealed a pact to keep the strongest neighbor in check.', 'が最強の隣国を牽制するため盟約を結びました。'),
    pactMe: T('이 우리의 팽창을 경계해 맹약을 맺었습니다. 우리를 보는 눈이 차가워집니다.', 'sealed a pact, wary of our expansion. Their view of us grows colder.', 'が我が国の膨張を警戒して盟約を結びました。こちらを見る目が冷たくなります。'),
    r1: T('우리 원정군이 나가 본국이 빈 틈을 노렸습니다.', 'They struck while our expedition army was away and the homeland lay thin.', '遠征軍が出払い本国が手薄な隙を突かれました。'),
    r2: T('민심과 사기가 가라앉은 틈을 노렸습니다.', 'They struck while our people and troops were low in spirit.', '民心と士気が沈んだ隙を突かれました。'),
    r3: T('관계가 틀어진 터라 명분을 삼아 군을 일으켰습니다.', 'Relations had soured, and they raised an army on that pretext.', '関係がこじれ、それを名分に軍を起こしました。'),
    r4: T('국경을 살피던 그들이 이 방면의 방비가 허술하다고 판단했습니다.', 'Scouting the border, they judged this front poorly defended.', '国境を探っていた彼らは、この方面の備えが薄いと見ました。'),
    r5: T('우리가 너무 커졌다고 여긴 이웃이 먼저 칼을 뽑았습니다.', 'A neighbor who thinks we have grown too large drew the sword first.', '我が国が大きくなりすぎたと見た隣国が先に剣を抜きました。'),
    r6: T('변경의 허점을 정찰한 끝에 움직였습니다.', 'After probing our frontier for weak points, they moved.', '辺境の隙を探った末に動きました。'),
    ttl: T('의 기습 공세', "'s Surprise Offensive", 'の奇襲攻勢'),
    place: T(' 급보가 이른 곳은 ', ' The alarm came from ', ' 急報が届いたのは'),
    win: T('기습해 온 적군을 물리쳤습니다. 이웃이 우리를 쉽게 보지 못할 것입니다.', 'You drove off the raiders. The neighbors will not take us lightly.', '奇襲してきた敵軍を退けました。隣国も我が国を軽く見られなくなるでしょう。'),
    costly: T('피해는 컸으나 공세를 막아냈습니다.', 'The blow was costly, but the offensive was stopped.', '損害は大きかったものの、攻勢を防ぎました。'),
    rev: T('멸망했던 나라의 유민과 옛 신하들이 다시 깃발을 들고 성을 되찾았습니다.', 'Exiles and old ministers of the fallen realm raised the banner again and retook a castle.', '滅びた国の遺民と旧臣が再び旗を掲げ、城を取り戻しました。'),
    revTag: T('부흥군 봉기', 'Restoration uprising', '復興軍の蜂起'),
    rebTtl: T(' 부흥군의 봉기', ' Restoration Uprising', 'の復興軍の蜂起'),
    rebWhy: T('옛 땅의 백성들이 멸망한 나라를 되살리겠다며 들고일어났습니다. 우리가 차지한 성이 그 표적입니다.', 'The people of the old land rose to revive their fallen realm. A castle we hold is their target.', '旧領の民が滅んだ国を蘇らせると蜂起しました。我が軍の占領した城が標的です。'),
    rebWin: T('봉기를 진압했습니다. 옛 나라의 불씨가 잦아들었습니다.', 'The uprising was crushed. The embers of the old realm have died down.', '蜂起を鎮圧しました。旧国の火種は消えました。'),
    rebCostly: T('큰 피해를 입었으나 봉기를 가라앉혔습니다.', 'At heavy cost, the uprising was put down.', '大きな損害を出しつつ、蜂起を鎮めました。'),
    rebLose: T('부흥군이 성을 점거했습니다. 멸망했던 나라가 다시 깃발을 세웠습니다.', 'The rebels seized the castle. The fallen realm has raised its banner again.', '復興軍が城を占拠しました。滅んだ国が再び旗を立てました。'),
    lose: T('방비가 뚫렸습니다. 성이 적의 손에 넘어갈 수 있습니다.', 'The defenses were breached. The castle may fall into enemy hands.', '防備が破られました。城が敵の手に渡るおそれがあります。')
  };
  // 기존 '성을 버린다' 선택지(번역이 빠져 있었음)
  T('성을 버리고 병력을 보존한다', 'Abandon the castle and preserve the army', '城を捨てて兵力を温存する');
  T('싸우지 않는다. 병력은 그대로이나 그 방면의 성을 내주고 민심·사기가 떨어진다. 나중에 공격해 되찾을 수 있다.', 'No fight. The army stays intact, but you give up the castle on that front and public morale and troop spirit fall. You can retake it later by attack.', '戦わない。兵力は無傷だが、その方面の城を明け渡し、民心・士気が落ちる。後に攻めて取り戻せる。');
  T('싸우지 않는다.', 'No fight.', '戦わない。'); T('병력은 그대로이나 그 방면의 성을 내주고 민심·사기가 떨어진다.', 'The army stays intact, but you give up the castle on that front and public morale and troop spirit fall.', '兵力は無傷だが、その方面の城を明け渡し、民心・士気が落ちる。'); T('나중에 공격해 되찾을 수 있다.', 'You can retake it later by attack.', '後に攻めて取り戻せる。');
  function key(a, b) { return a < b ? a + '|' + b : b + '|' + a; }

  /* ── 나라의 힘: 세계 수치가 없는 나라(백제·가야 등)도 영토에 따라 오르내린다 ── */
  P.sidePower = function (side) {
    var s = this.s, r = this.roleOf(side), w = r && s.world[r];
    if (r === 'tang') return 90 + w.commit * 0.4;
    if (w) return w.p;
    var ai = s.ai = s.ai || {}; ai.pw = ai.pw || {};
    if (ai.pw[side] == null) ai.pw[side] = this.aiBase(side);
    return ai.pw[side];
  };
  P.aiBase = function (side) { var self = this, n = this.places().filter(function (p) { return self.ownerOf(p) === side; }).length; return clamp(12 + n * 3, 10, 70); };
  function bump(S, side, dv) {
    var r = S.roleOf(side), w = r && S.s.world[r];
    if (r === 'tang') return;
    if (w) w.p = clamp(w.p + dv, 4, 150);
    else { var ai = S.s.ai = S.s.ai || {}; ai.pw = ai.pw || {}; S.sidePower(side); ai.pw[side] = clamp(ai.pw[side] + dv, 6, 90); }
  }

  /* ── ① 적국들의 전쟁 ── */
  P.worldSim = function () {
    var self = this, s = this.s, me = this.side, all = this.places(), d = s.destroyed || {}, coal = (s.coal && s.coal.members) || [], y = s.year;
    if (this.aiTurnAll) try { this.aiTurnAll(); } catch (e) { console.warn('aiTurn', e); }
    var era = y <= (this.cfg.end0 != null ? this.cfg.end0 : this.cfg.end);   // 짜인 역사 구간: 적국의 정복은 연표를 해치지 않을 만큼만
    var ai = s.ai = s.ai || {}; ai.cap = ai.cap || 0; ai.fat = ai.fat || {}; ai.pact = ai.pact || {}; ai.grudge = ai.grudge || {}; ai.pw = ai.pw || {}; ai.mv = [];
    s.owners = s.owners || {};
    function nm(side) { var r = self.roleOf(side); return r ? self.names[r].replace('(멸망)', '') : ((SG.sideName && SG.sideName[side]) || side); }
    var by = {}; all.forEach(function (p) { var o = self.ownerOf(p); if (o) (by[o] = by[o] || []).push(p); });
    var sides = Object.keys(by).filter(function (a) { return ACT[a] && a !== me && !d[a]; });
    var lines = [], busy = {}, done = 0;
    // 피로 회복 · 맹약 만료 · 영토에 맞춘 국력 보정
    sides.forEach(function (a) {
      ai.fat[a] = Math.max(0, (ai.fat[a] || 0) - 3);
      var r0 = self.roleOf(a), tgt = self.natTarget ? self.natTarget(a) : clamp(18 + (by[a] || []).length * 2.4, 10, 95);
      if (!r0) { self.sidePower(a); ai.pw[a] = clamp(ai.pw[a] + (tgt - ai.pw[a]) * 0.1, 6, 90); }
      else if (r0 !== 'tang' && s.world[r0]) s.world[r0].p = clamp(s.world[r0].p + (tgt - s.world[r0].p) * 0.05, 4, 150);
    });
    Object.keys(ai.pact).forEach(function (k) { if (ai.pact[k] < y) delete ai.pact[k]; });
    function allied(a, b) { return ai.pact[key(a, b)] >= y; }
    // 가장 강한 반도 세력(대국 당은 제외)
    var leader = null, lp = -1; sides.forEach(function (a) { if (a === 'tang') return; var p = self.sidePower(a); if (p > lp) { lp = p; leader = a; } });

    /* 맹약: 가장 강한 나라(또는 너무 커진 우리)를 견제하려는 두 나라가 손을 잡는다 */
    if (Object.keys(ai.pact).length < 2 && Math.random() < 0.22 && sides.length >= 3) {
      var dom = this.dominance ? this.dominance() : 0, aim = (dom >= 4 && Math.random() < 0.6) ? me : leader, free = sides.filter(function (a) { return a !== aim && (a !== 'tang' || (s.world.tang && s.world.tang.commit >= 30)) && Object.keys(ai.pact).every(function (k) { return k.split('|').indexOf(a) < 0; }); });
      if (aim && free.length >= 2) {
        var ref = aim === me ? SG.placeById(this.cfg.capPlace) : this.foeOrigin(aim);
        if (ref) {
          free.sort(function (a, b) { var oa = self.foeOrigin(a), ob = self.foeOrigin(b); return (oa ? dist(oa, ref) : 9) - (ob ? dist(ob, ref) : 9); });
          var x = free[0], z = free[1];
          if (aim === me || (self.sidePower(x) < self.sidePower(aim) * 0.95 && self.sidePower(z) < self.sidePower(aim) * 0.95)) {
            ai.pact[key(x, z)] = y + 4 + Math.floor(Math.random() * 4);
            lines.push('<div>🤝 <b>' + nm(x) + ' · ' + nm(z) + ' — </b>' + (aim === me ? M.pactMe : M.pact) + '</div>');
            this.log('맹약: ' + nm(x) + '·' + nm(z));
            if (aim === me) [x, z].forEach(function (q) { var r = self.roleOf(q); if (r && s.world[r]) { s.world[r].hostility = clamp(s.world[r].hostility + 5, 0, 100); s.rel[r] = clamp(s.rel[r] - 3, 0, 100); } });
          }
        }
      }
    }

    /* 원정: 나라마다 한두 번 */
    function campaign(a, force, tgt) {
      var ra = self.roleOf(a), pa = self.sidePower(a), own = by[a] || [], cand = [];
      if (!own.length) return;
      all.forEach(function (p) {
        var o = self.ownerOf(p); if (!o || o === a || o === me || !ACT[o]) return;
        if (force && o !== force) return;
        if (!force && allied(a, o)) return;
        var ro = self.roleOf(o); if (ra && ro && coal.indexOf(ra) >= 0 && coal.indexOf(ro) >= 0) return; // 연합끼리는 싸우지 않는다
        if (a === 'gaya' && p.kind === 'capital') return;
        var hm = SG.ownerAt(p, y + 3) === a;   // 실제 역사에서도 곧 그 나라 손에 들어가는 성
        if (era && !hm && !force && (p.kind === 'capital' || ai.cap >= CFG.eraCap)) return;
        var bd = 9, org = null; own.forEach(function (q) { var x = dist(p, q); if (x < bd) { bd = x; org = q; } });
        if (bd > 1.5) return;
        var pd = Math.max(self.sidePower(o), p.kind === 'capital' ? 35 : 0);
        var sc = (pa - pd) / 55 - bd * 0.9 + (KV[p.kind] || 0) + (ai.grudge[a + '>' + o] ? 0.35 : 0) + (busy[o] ? 0.3 : 0) + ((d[o] || (s.fallen && s.fallen[o])) ? 0.4 : 0) + (o === leader ? 0.25 : 0) + Math.random() * 0.5 + (force ? 1.5 : 0) + (tgt && p.id === tgt ? 8 : 0);
        if (p.kind === 'capital' && pa < pd * 1.25 && !(tgt && p.id === tgt)) sc -= 2;
        if (hm) sc += 1.2;
        cand.push({ p: p, o: o, pd: pd, org: org, bd: bd, sc: sc, hm: hm });
      });
      if (!cand.length) return;
      cand.sort(function (x, z) { return z.sc - x.sc; });
      var t = cand[0], help = 0;
      Object.keys(ai.pact).forEach(function (k) { var m = k.split('|'); if (m.indexOf(a) < 0) return; var b = m[0] === a ? m[1] : m[0]; if (!d[b] && b !== me && !busy[b]) help += self.sidePower(b) * 0.2; });
      var fat = ai.fat[a] || 0, gd = self.pathGuards ? self.pathGuards(t.org, t.p, t.o) : [], gk = gd.length * (t.p.kind === 'capital' ? 1.5 : 1);
      var att = (pa + help) * (self.milFactor ? self.milFactor(a) : 1) * (0.92 + (SG.resOf ? SG.resOf(self, a) : 40) / 300) * clamp(1 - 0.07 * gk, 0.6, 1) * clamp(1 - Math.max(0, own.length - 16) * 0.03, 0.55, 1) * (0.85 + Math.random() * 0.3) * clamp(1 - fat / 60, 0.6, 1) * clamp(1 - t.bd * 0.1, 0.6, 1);
      var left = (by[t.o] || []).length, rally = (ai.lostY && y - (ai.lostY[t.o] || -9) <= 1) ? 1.12 : 1, lastStand = left <= 6 ? 1.25 : 1;
      var def = t.pd * (self.milFactor ? Math.pow(self.milFactor(t.o), 0.6) : 1) * (0.92 + (SG.resOf ? SG.resOf(self, t.o) : 40) / 300) * (KM[t.p.kind] || 1.2) * rally * lastStand * (0.85 + Math.random() * 0.3);
      var pw = clamp(1 / (1 + Math.exp(-(att / def - 1.0) * 3.4)) + (t.hm ? 0.15 : 0), 0.06, 0.88);
      var won = Math.random() < pw; done++; busy[a] = 1; busy[t.o] = 1;
      if (gd.length && !won && Math.random() < 0.6 && SG.INTERCEPT) lines.push('<div><b>' + nm(a) + '</b> ⚔ <b>' + nm(t.o) + '</b> · <u>' + short(t.p) + '</u> · <i>' + SG.INTERCEPT.ai + '</i></div>');
      var mv = { from: t.org.id, to: t.p.id, side: a, win: won ? 1 : 0, def: t.o, joint: force ? 1 : 0 };
      ai.mv.push(mv);
      if (self.milHit) { if (won) { self.milHit(a, self.deployMax(a) * 0.08); self.milHit(t.o, self.deployMax(t.o) * 0.14); } else { self.milHit(a, self.deployMax(a) * 0.15); self.milHit(t.o, self.deployMax(t.o) * 0.05); } }
      if (won) {
        var seat = self.isSeat && self.isSeat(t.p, t.o);
        if (era && !t.hm) ai.cap++;
        s.owners[t.p.id] = a; (by[a] = by[a] || []).push(t.p); by[t.o] = (by[t.o] || []).filter(function (q) { return q.id !== t.p.id; });
        bump(self, a, 1.5); bump(self, t.o, -2.5); ai.lostY = ai.lostY || {}; ai.lostY[t.o] = y; ai.fat[a] = fat + 1.5; ai.grudge[t.o + '>' + a] = y;
        self.log(nm(a) + ', ' + nm(t.o) + '의 ' + short(t.p) + ' 점령');
        lines.push('<div><b>' + nm(a) + '</b> ⚔ <b>' + nm(t.o) + '</b> · <u>' + short(t.p) + '</u> · <i>' + M.taken + '</i></div>');
        if (seat && self.capitalFall) self.capitalFall(t.p, t.o, a);
      } else {
        bump(self, a, -1.5); bump(self, t.o, 0.8); ai.fat[a] = fat + 3;
        if (Math.random() < 0.7) lines.push('<div><b>' + nm(a) + '</b> ⚔ <b>' + nm(t.o) + '</b> · <u>' + short(t.p) + '</u> · <i>' + M.held + '</i></div>');
      }
    }
    shuffle(sides).forEach(function (a) {
      if (done >= (era ? CFG.eraMaxCamp : CFG.maxCamp)) return;
      var ra = self.roleOf(a), pa = self.sidePower(a);
      if (a === 'tang' && (!ra || s.world[ra].commit < 30)) return;
      var fat = ai.fat[a] || 0, pr = clamp(CFG.camp + (pa - 50) / 250 - fat / 60, 0.08, 0.65) * (era ? CFG.eraCamp : 1), n = (pa > 75 && fat < 4) ? 2 : 1;
      for (var c = 0; c < n && done < (era ? CFG.eraMaxCamp : CFG.maxCamp); c++) if (Math.random() < pr) campaign(a);
    });
    /* 공동 출병: 플레이어와 약속한 우호국이 같은 적을 친다 */
    var jw = self.jointWar && self.jointWar();
    if (jw && done < 6 && !d[jw.side]) {
      var before = ai.mv.length; campaign(jw.side, jw.foe, jw.target); jw.hit++; if (jw.target && self.ownerOf(SG.placeById(jw.target)) !== jw.foe) jw.target = null;
      var jm = ai.mv[ai.mv.length - 1];
      if (ai.mv.length > before && jm && jm.joint && jm.win) lines.push('<div><b>' + nm(jw.side) + '</b> <i>' + SG.ALLY.jwin + '</i></div>'); else if (ai.mv.length === before) lines.push('<div><b>' + nm(jw.side) + '</b> ' + SG.ALLY.jfail + '</div>');
    }
    /* 멸망한 나라의 부활: 몇 해 뒤 유민과 옛 신하들이 옛 땅에서 다시 일어선다 */
    Object.keys(d).forEach(function (side) {
      ai.rev = ai.rev || {}; if ((ai.rev[side] || 0) >= 2 || side === 'tang' || side === 'wa') return;
      if (y - d[side] < 3 || Math.random() > CFG.revive) return;
      var old = all.filter(function (p) { var o = self.ownerOf(p); return o !== side && (p.side === side || SG.ownerAt(p, d[side] - 1) === side) && p.kind !== 'pass'; });
      if (!old.length) return;
      var c0 = old[Math.floor(Math.random() * old.length)];
      if (self.ownerOf(c0) === me) { if (!ai.rebel) ai.rebel = { side: side, place: c0.id, y: y }; return; }   // 내가 차지한 땅이면 봉기로 맞선다
      var near = old.filter(function (p) { return p !== c0 && dist(p, c0) < 1.0 && self.ownerOf(p) !== me; }).slice(0, 1), got = [c0].concat(near);
      got.forEach(function (p) { s.owners[p.id] = side; });
      self.reviveSide(side, got);
      lines.push('<div><b>' + nm(side) + '</b> ⚑ ' + got.map(function (p) { return '<u>' + short(p) + '</u>'; }).join(' · ') + ' · <i>' + M.revTag + '</i></div><div><b>' + nm(side) + ' — </b>' + M.rev + '</div>');
    });
    if (lines.length) this.pre = (this.pre || '') + '<div class="freehd">🌏 <b>' + M.head + '</b>' + lines.join('') + ' <small>' + M.tail + '</small></div>';
  };

  /* ── ② 우리를 노리는 공세: 빈틈을 살펴 칠 성을 고른다 ── */
  function tactics(sb) {
    var s = sb.s;
    return [
      { label: '성에 의지해 막는다', hint: '방비가 높을수록 유리. 피해를 줄이는 정석.', ours: { terrain: 1.35 + s.realm.defense / 300 } },
      { label: '야전에서 결전한다', hint: '사기와 훈련도가 높으면 큰 승리를 노릴 수 있다.', ours: { morale: 6 } },
      { label: '요충에 매복한다', hint: '첩보가 30 이상이어야 적의 길목을 안다.', ours: { ambush: s.realm.intel >= 30, terrain: 1.2 } },
      { label: '재물을 주어 돌려보낸다 (금 10)', hint: '싸우지 않고 넘긴다. 실패하면 처참하다.', special: 'bribe', gold: 10 }
    ];
  }
  P.aiStrike = function () {
    var self = this, s = this.s, y = s.year, N = this.names; s.threat = s.threat || {}; s.ai = s.ai || {};
    if (s.ai.strikeY === y || (s.threat.last != null && y - s.threat.last < 1)) return null;
    var mine = this.myPlaces().filter(function (p) { return p.id !== self.cfg.capPlace; }); if (!mine.length) return null;
    var away = this.awayNow ? this.awayNow() : null, mor = this.g.state.res.morale, dom = this.dominance ? this.dominance() : 0, st = this.stations(), share = {};
    st.forEach(function (x) { share[x.pl.id] = x.share; });
    var picked = null;
    shuffle(this.aliveRoles()).some(function (r) {
      var side = self.sides[r], w = s.world[r]; if (!side || side === self.side || (s.coal && s.coal.members.indexOf(r) >= 0)) return false;
      var org = self.foeOrigin(side); if (!org) return false;
      var aggr = r === 'tang' ? w.commit / 100 : w.hostility / 100, rel = s.rel[r], relF = rel >= 70 ? 0.15 : rel >= 55 ? 0.55 : 1;
      var near = 9; mine.forEach(function (p) { near = Math.min(near, dist(org, p)); });
      if (near > 3.2 && r !== 'tang' && r !== 'wa') return false;
      var pwr = self.sidePower(side), why = null;
      var opp = 1 + (away && away.frac >= 0.3 ? 0.7 : 0) + clamp((55 - mor) / 80, 0, 0.4) + clamp((pwr - 50) / 150, -0.2, 0.4) + clamp(dom / 12, 0, 0.5);
      var pr = (0.02 + aggr * 0.07) * relF * opp * CFG.strike * (r === 'tang' ? 0.6 : 1);
      if (Math.random() >= pr) return false;
      why = away && away.frac >= 0.3 ? M.r1 : mor < 35 ? M.r2 : rel < 40 ? M.r3 : dom >= 5 ? M.r5 : null;
      picked = { r: r, side: side, w: w, org: org, pwr: pwr, why: why, opp: opp }; return true;
    });
    if (!picked) return null;
    var sea = picked.r === 'wa' || (picked.r === 'tang' && !this.places().some(function (p) { return self.ownerOf(p) === picked.side && p.lon >= 124 && p.lon <= 130.6 && p.lat >= 33 && p.lat <= 43; }));
    var best = null; mine.forEach(function (p) {
      var sh = share[p.id], sc = -dist(picked.org, p) * 1.0 + (sh == null ? 0.6 : clamp(1 - sh / 40, 0, 1)) + (sea && p.kind === 'port' ? 0.8 : 0) + (s.owners && s.owners[p.id] === self.side ? 0.2 : 0) + (p.kind === 'pass' ? -0.3 : 0) + Math.random() * 0.5;
      if (!best || sc > best.sc) best = { p: p, sc: sc, sh: sh };
    });
    if (!best) return null;
    if (!picked.why) picked.why = (best.sh == null || best.sh < 12) ? M.r4 : M.r6;
    var w = picked.w, r = picked.r, nmv = N[r], tot = r === 'tang' ? Math.round(7000 + w.commit * 330) : Math.round(picked.pwr * 230 * (0.8 + w.hostility / 220));
    var gd = this.pathGuards ? this.pathGuards(picked.org, best.p, this.side) : [];
    if (this.deployMax) { tot = Math.min(tot, Math.max(1500, this.deployMax(picked.side))); }
    tot = Math.round(tot * (0.9 + (SG.resOf ? SG.resOf(this, picked.side) : 40) / 280) * (0.85 + Math.random() * 0.3) * (picked.opp > 1.5 ? 1.1 : 1) * clamp(1 - 0.08 * gd.length, 0.7, 1));
    var wk = function (v1, v2) { var o = {}; if (r === 'tang') o['tang.commit'] = v1 * 2; else { o[r + '.p'] = v1; o[r + '.hostility'] = v2; } return o; };
    var I = SG.i18n && SG.i18n.dict, en = (I && I.en && I.en[nmv]) || nmv, ja = (I && I.ja && I.ja[nmv]) || nmv;
    T(nmv + M.ttl, en + "'s Surprise Offensive", ja + 'の奇襲攻勢');
    s.ai.strikeY = y; s.threat.last = y; if (this.milHit) this.milHit(picked.side, tot * 0.06);
    var inv = {
      title: nmv + M.ttl, defense: true, terrain: 1.1, coast: sea, place: best.p.id,
      enemy: { name: nmv + ' 군', side: picked.side, total: tot, terrain: 1, morale: 70 },
      intro: '<b>' + nmv + ' — </b>' + picked.why + M.place + '<b>' + best.p.name + '</b>' + T(' 방면입니다.', ' direction.', ' 方面です。'),
      tactics: tactics(this),
      win: { text: [M.win], fx: { morale: 5, people: 2 }, world: wk(-3, -5) },
      costly: { text: [M.costly], fx: { morale: -1, people: -2 }, realm: { defense: -3 } },
      lose: { text: [M.lose], fx: { people: -6, morale: -6, food: -8 }, realm: { defense: -6, royal: -3 }, world: wk(2, 2) }
    };
    inv.tactics.forEach(function (t) { if (t.special) return; try { t.hint += ' · 승산 ' + self.odds(self.simFight(inv, t)); } catch (e) { } });
    this.log(nmv + ' 기습 공세: ' + short(best.p));
    return inv;
  };
  var _inv = P.invasion;
  P.invasion = function () {
    var inv = _inv.apply(this, arguments); if (inv) return inv;
    try { var rb = this.s.ai && this.s.ai.rebel; if (rb) { if (this.s.year - rb.y > 3) { this.s.ai.rebel = null; } else { var ri = this.rebelInv(rb); if (ri) return ri; this.s.ai.rebel = null; } } return this.aiStrike() || null; } catch (e) { console.warn('aiStrike', e); return null; }
  };

  P.reviveSide = function (side, got) {
    var s = this.s, ai = s.ai = s.ai || {}, role = this.roleOf(side), w = role && s.world[role];
    if (s.destroyed) delete s.destroyed[side];
    ai.rev = ai.rev || {}; ai.rev[side] = (ai.rev[side] || 0) + 1;
    if (role && this.names[role]) this.names[role] = this.names[role].replace('(멸망)', '').replace('(부흥)', '') + '(부흥)';
    if (w && role !== 'tang') { w.p = Math.max(w.p, 14); w.hostility = Math.max(w.hostility, 25); } else if (!role) { ai.pw = ai.pw || {}; ai.pw[side] = Math.max(ai.pw[side] || 0, 14); }
    var n = this.nat(side); n.people = Math.max(n.people, 60); n.train = Math.max(n.train, 45);
    this.log((SG.sideName && SG.sideName[side] || side) + ' 부흥');
  };
  P.rebelInv = function (rb) {
    var self = this, s = this.s, pl = SG.placeById(rb.place), N = this.names, role = this.roleOf(rb.side);
    if (!pl || this.ownerOf(pl) !== this.side) return null;
    var nmv = role ? N[role].replace('(멸망)', '') : ((SG.sideName && SG.sideName[rb.side]) || rb.side);
    var I = SG.i18n && SG.i18n.dict, en = (I && I.en && I.en[nmv]) || nmv, ja = (I && I.ja && I.ja[nmv]) || nmv;
    T(nmv + M.rebTtl, en + ' Restoration Uprising', ja + 'の復興軍の蜂起');
    var tot = Math.round(3000 + Math.random() * 2500 + (this.g.state.res.people < 50 ? 1800 : 0) + (this.nat(rb.side).train - 45) * 40);
    s.ai.rebel = null; s.threat = s.threat || {}; s.threat.last = s.year; s.ai.strikeY = s.year;
    var inv = {
      title: nmv + M.rebTtl, defense: true, terrain: 1.15, place: pl.id, rebel: rb.side,
      enemy: { name: nmv + ' 부흥군', side: rb.side, total: tot, terrain: 1, morale: 72, mix: { levy: .45, line: .3, archer: .15, horse: .1 } },
      intro: '<b>' + nmv + ' — </b>' + M.rebWhy + M.place + '<b>' + pl.name + '</b>' + T(' 방면입니다.', ' direction.', ' 方面です。'),
      tactics: tactics(this),
      win: { text: [M.rebWin], fx: { morale: 3, people: 2 } },
      costly: { text: [M.rebCostly], fx: { morale: -1, people: -2 }, realm: { defense: -2 } },
      lose: { text: [M.rebLose], fx: { people: -4, morale: -4 }, realm: { defense: -4 } }
    };
    inv.tactics.forEach(function (t) { if (t.special) return; try { t.hint += ' · 승산 ' + self.odds(self.simFight(inv, t)); } catch (e) { } });
    this.log(nmv + ' 부흥군 봉기: ' + short(pl));
    return inv;
  };
  var _afterR = P.afterFight;
  P.afterFight = function (bt, kind) { if (bt && bt.rebel && (kind === 'lose' || kind === 'abandon') && this.s.destroyed && this.s.destroyed[bt.rebel]) { var pl = SG.placeById(bt.place); this.reviveSide(bt.rebel, pl ? [pl] : []); } return _afterR.apply(this, arguments); };

  /* ── 지도: 올해 적국들의 진군선과 점령지 표시 ── */
  var _dd = P.drawDeploy;
  P.drawDeploy = function () {
    var r = _dd.apply(this, arguments), m = this.g && this.g.map, ai = this.s && this.s.ai;
    if (m && ai && ai.mv) ai.mv.forEach(function (x, i) {
      var a = SG.placeById(x.from), b = SG.placeById(x.to); if (!a || !b) return;
      try { m.drawRoute('aiw_' + i, [x.from, x.to], x.side, { ms: x.shown ? 1 : 800 }); if (x.win) m.markPlace(x.to, 'atk', true); if (!x.shown) m.ping(b.lon, b.lat, x.win ? 'hot' : ''); x.shown = 1; } catch (e) { }
    });
    return r;
  };
})();
