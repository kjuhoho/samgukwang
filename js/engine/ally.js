/* 동맹 외교와 적국의 병력 체계 (게임 추상화 모델 — 사료 수치가 아니다)
 *  ① 원군 요청: 우호국이 병력을 보내 2년간 우리 군에 합류한다.
 *  ② 공동 출병 제안: 우호국이 같은 적을 함께 공격하고, 그 적의 수비는 흩어진다.
 *  ③ 우호국이 먼저 원군이나 공동 출병을 청해 온다(응하면 관계가 깊어지고, 거절하면 식는다).
 *  ④ 적국 병력 체계: 나라별 편제(정예·기병·궁노·수도 친위군), 예비군, 인근 성의 구원군.
 * T()는 반드시 파일을 읽을 때(함수 밖에서) 부른다. */
(function () {
  var P = SG.Sandbox.prototype, CASTLE = { capital: 1, city: 1, fortress: 1, port: 1, pass: 1 };
  var TR = SG.data.tr6 = SG.data.tr6 || { en: {}, ja: {} };
  function T(k, e, j) { TR.en[k] = e; TR.ja[k] = j; var I = SG.i18n; if (I && I.dict && I.dict.en) { I.dict.en[k] = e; I.dict.ja[k] = j; } return k; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function short(pl) { return pl.name.replace(/\(.*?\)/g, '').trim(); }
  function dist(a, b) { return Math.hypot((a.lon - b.lon) * 0.8, a.lat - b.lat); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  var M = {
    noP: T('요청에 응할 만한 우호국이 없습니다.', 'There is no friendly state willing to answer.', '要請に応じる友好国がありません。'),
    no: T(' 조정은 자국 사정을 이유로 청을 거절했습니다.', ' declined, citing its own troubles.', ' の朝廷は自国の事情を理由に要請を断りました。'),
    yes1: T(' 조정이 청을 받아들여 원군을 보냈습니다. 병력 ', ' accepted our plea and sent reinforcements: ', ' の朝廷は要請を受け入れ援軍を送りました。兵力 '),
    yes2: T('명이 2년 동안 우리 군에 합류합니다.', ' troops join our army for two years.', '名が2年間わが軍に加わります。'),
    jyes1: T(' 조정이 공동 출병을 약속했습니다. 목표: ', ' agreed to a joint campaign. Target: ', ' の朝廷は共同出兵を約束しました。目標: '),
    jyes2: T('. 이듬해까지 그 나라를 함께 치고, 적의 수비는 흩어집니다.', '. They will strike it together with us through next year, and its defenses are scattered.', '。来年まで共に攻め、敵の守りは散ります。'),
    jno: T(' 조정은 때가 아니라며 공동 출병을 사양했습니다.', ' declined the joint campaign, saying the time was not right.', ' の朝廷は時期尚早として共同出兵を辞退しました。'),
    askA: T(' 사신이 달려와 이웃의 침공으로 성을 잃었다며 원군을 청합니다.', ' envoy rushed in: a castle fell to invaders, and they beg for reinforcements.', ' の使者が駆け込み、隣国の侵攻で城を失ったと援軍を求めます。'),
    askJ: T(' 사신이 공동 출병을 제안합니다. 목표: ', ' envoy proposes a joint campaign. Target: ', ' の使者が共同出兵を提案します。目標: '),
    send: T('원군을 보낸다', 'Send reinforcements', '援軍を送る'), sendH: T('우리 군 일부를 잃지만 관계가 깊어지고, 잃은 성을 되찾는 데 힘이 됩니다.', 'We lose part of our army, but ties deepen and it may help them retake the castle.', '軍の一部を失うが、関係は深まり、失った城の奪還の助けになる。'),
    refuse: T('거절한다', 'Refuse', '断る'), refuseH: T('병력은 아끼지만 관계가 식습니다.', 'Spares our troops, but relations cool.', '兵は温存できるが、関係は冷える。'),
    join: T('함께 친다', 'Join the campaign', '共に攻める'), joinH: T('관계가 깊어지고 목표의 수비가 약해집니다. 그 나라와는 적의가 커집니다.', 'Ties deepen and the target’s defense weakens, but its hostility toward us grows.', '関係は深まり目標の守りは弱まるが、その国の敵意は高まる。'),
    decl: T('사양한다', 'Decline', '辞退する'), declH: T('관계가 조금 식습니다.', 'Relations cool a little.', '関係が少し冷える。'),
    aT: T('🤝 원군 요청이 들어왔습니다', '🤝 A call for reinforcements', '🤝 援軍要請が届きました'), jT: T('🤝 공동 출병 제안이 들어왔습니다', '🤝 A joint campaign is proposed', '🤝 共同出兵の提案が届きました'),
    gave: T(' 원군이 도착해 전세가 되살아났습니다. 잃은 성을 되찾았습니다.', ' sent troops arrived and the tide turned. They retook the lost castle.', ' 援軍が到着して形勢が戻り、失った城を取り返しました。'),
    gave2: T(' 원군이 도착해 큰 도움이 되었습니다.', ' sent troops arrived and were a great help.', ' 援軍が到着し大きな助けとなりました。'),
    refused: T(' 조정은 우리의 외면에 크게 실망했습니다.', ' was deeply disappointed by our refusal.', ' の朝廷は私たちの無視に深く失望しました。'),
    jdone: T(' 공동 출병이 시작되었습니다. 목표: ', ' The joint campaign has begun. Target: ', ' 共同出兵が始まりました。目標: '),
    jwin: T('이 공동 출병으로 성을 차지했습니다.', ' took a castle in the joint campaign.', ' は共同出兵で城を奪いました。'),
    jfail: T('공동 출병을 시도했으나 마땅한 목표를 찾지 못했습니다.', ' sought a target for the joint campaign but found none.', ' は共同出兵を試みたが、適当な目標を見つけられませんでした。'),
    relT: T('구원군', 'Relief force', '救援軍'),
    rel1: T(' 성의 구원군이 달려와 수비가 늘었습니다.', ' garrisons rushed to relieve the castle and its defense grew.', ' の守備軍が駆けつけ、守りが増えました。'),
    res: T('예비군', 'Reserves', '予備軍'),
    cA: T('원군 요청', 'Request Reinforcements', '援軍要請'), cAd: T('우호국에 사신을 보내 원군을 청합니다. 관계가 좋을수록 병력이 많이 오고, 온 군은 2년간 우리 군에 합류합니다.', 'Send envoys to a friendly state to ask for troops. The warmer the ties, the more arrive, and they join our army for two years.', '友好国に使者を送り援軍を求めます。関係が良いほど兵が多く来て、2年間わが軍に加わります。'),
    cAl: T('사신이 말을 달려 원군을 청했습니다.', 'Envoys rode out to plead for reinforcements.', '使者が馬を駆って援軍を請いました。'),
    cJ: T('공동 출병 제안', 'Propose a Joint Campaign', '共同出兵の提案'), cJd: T('우호국에 함께 적을 치자고 청합니다. 최근 우리가 노린 나라(없으면 가장 적대적인 나라)가 목표가 되며, 우호국이 올해와 이듬해 그 나라를 공격합니다.', 'Ask a friendly state to strike a common foe with us. The target is the state we last attacked (or the most hostile); the partner attacks it this year and next.', '友好国に共に敵を討とうと求めます。目標は最近攻めた国(なければ最も敵対的な国)で、友好国が今年と来年その国を攻めます。'),
    cJl: T('사신들이 함께 칠 계책을 나누었습니다.', 'Envoys worked out a plan to strike together.', '使者たちは共に討つ策を練りました。')
  };
  T('고구려가 올해와 이듬해 신라의 성을 실제로 공격한다.', 'Goguryeo will actually attack Silla’s castles this year and next.', '高句麗が今年と来年、新羅の城を実際に攻撃する。');
  var PROFILE = { // 나라별 편제 비율
    goguryeo: { line: .26, garrison: .12, levy: .08, archer: .14, horse: .16, elite: .1, siege: .02 },
    tang: { line: .26, garrison: .08, levy: .06, archer: .1, horse: .14, elite: .1, crossbow: .1, siege: .03 },
    silla: { line: .3, garrison: .12, levy: .08, archer: .18, horse: .06, elite: .12, hwarang: .04 },
    baekje: { line: .32, garrison: .14, levy: .09, archer: .17, horse: .08, elite: .1, siege: .02 },
    wa: { line: .34, garrison: .14, levy: .28, archer: .14, horse: .04, elite: .02 },
    gaya: { line: .38, garrison: .16, levy: .14, archer: .12, horse: .1, elite: .06 }
  };
  var BASE_RES = { tang: 55, goguryeo: 50, silla: 42, baekje: 42, wa: 32, gaya: 30 };

  function A_(sb) { var s = sb.s; return s.ally = s.ally || {}; }
  function nmRole(sb, r) { return sb.names[r].replace('(멸망)', ''); }
  function nmSide(sb, side) { var r = sb.roleOf(side); return r ? nmRole(sb, r) : ((SG.sideName && SG.sideName[side]) || side); }
  function partners(sb, minRel, exceptSide) {
    var s = sb.s, coal = (s.coal && s.coal.members) || [];
    return sb.aliveRoles().filter(function (r) { var sd = sb.sides[r]; return sd && sd !== sb.side && sd !== exceptSide && (s.rel[r] || 0) >= minRel && !(s.destroyed && s.destroyed[sd]) && coal.indexOf(r) < 0; })
      .sort(function (a, b) { return s.rel[b] - s.rel[a]; });
  }
  function foeSide(sb, exceptRole) {
    var s = sb.s, a = A_(sb), lf = a.lastFoe;
    if (lf && lf !== sb.side && !(s.destroyed && s.destroyed[lf])) return lf;
    var best = null, bv = -1; sb.aliveRoles().forEach(function (r) { var sd = sb.sides[r]; if (!sd || sd === sb.side || r === exceptRole) return; var w = s.world[r], v = r === 'tang' ? w.commit * 0.8 : w.hostility; if (v > bv) { bv = v; best = sd; } });
    return best;
  }

  /* ① 원군 요청 */
  function doAid(sb) {
    var s = sb.s, a = A_(sb), ps = partners(sb, 40); if (!ps.length) return { text: M.noP };
    var r = ps[0], w = s.world[r], rel = s.rel[r], side = sb.sides[r], nm = '<b>' + nmRole(sb, r) + '</b>';
    var busy = ((s.ai && s.ai.mv) || []).some(function (m) { return m.side === side; });
    var p = clamp(0.3 + (rel - 40) / 90 + (w.p - 50) / 400 - (busy ? 0.2 : 0), 0.1, 0.92);
    if (Math.random() >= p) { s.rel[r] = clamp(rel - 2, 0, 100); return { text: nm + M.no }; }
    var n = Math.round(clamp((r === 'tang' ? 4500 : w.p * 38) + (rel - 40) * 40, 1500, r === 'tang' ? 7000 : 6000) / 100) * 100;
    var R = SG.sideRoles[side] || {}, units = {}, Ar = sb.g.state.army;
    [['line', .4], ['horse', .25], ['archer', .2], ['elite', .15]].forEach(function (m) { var id = R[m[0]] || R.line; if (!id || !SG.unitById(id)) return; var k = Math.round(n * m[1] / 50) * 50; units[id] = (units[id] || 0) + k; Ar[id] = (Ar[id] || 0) + k; });
    a.aid = { role: r, side: side, units: units, until: s.year + 1, n: n }; s.rel[r] = clamp(rel - 3, 0, 100);
    sb.g.renderArmy(); sb.g.hud(); sb.log('원군: ' + nmRole(sb, r) + ' ' + n);
    return { text: nm + M.yes1 + '<b>' + n.toLocaleString() + '</b>' + M.yes2 };
  }
  /* ② 공동 출병 */
  function setJoint(sb, r, foe) { var a = A_(sb); a.joint = { role: r, side: sb.sides[r], foe: foe, until: sb.s.year + 1, hit: 0 }; }
  function doJoint(sb) {
    var s = sb.s, foe = foeSide(sb), ps = partners(sb, 45, foe); if (!foe || !ps.length) return { text: M.noP };
    var r = ps[0], rel = s.rel[r], nm = '<b>' + nmRole(sb, r) + '</b>';
    if (Math.random() >= clamp(0.35 + (rel - 45) / 80, 0.15, 0.9)) { s.rel[r] = clamp(rel - 1, 0, 100); return { text: nm + M.jno }; }
    setJoint(sb, r, foe); s.rel[r] = clamp(rel + 2, 0, 100); sb.log('공동 출병: ' + nmRole(sb, r) + ' → ' + nmSide(sb, foe));
    return { text: nm + M.jyes1 + '<b>' + nmSide(sb, foe) + '</b>' + M.jyes2 };
  }
  /* 사건·시나리오 선택지에서 쓰는 공동 출병 시작: 우호국이 실제로 같은 적의 성을 친다 */
  SG.ALLY_start = function (sb, role, foeRole) {
    var foe = sb.sides[foeRole], s = sb.s; if (!sb.sides[role] || !foe || foe === sb.side || (s.destroyed && s.destroyed[foe])) return '';
    setJoint(sb, role, foe); sb.log('공동 출병: ' + nmRole(sb, role) + ' → ' + nmSide(sb, foe));
    return '<b>' + nmRole(sb, role) + '</b>' + M.jyes1 + '<b>' + nmSide(sb, foe) + '</b>' + M.jyes2;
  };
  SG.data.commands = (SG.data.commands || []).concat([
    { id: 'ask_aid', cat: '외교', name: M.cA, desc: M.cAd, cost: { gold: 8 }, cd: 3, hist: '가상', eff: {}, lines: [M.cAl], req: function (ctx) { var sb = ctx.sb; return !A_(sb).aid && partners(sb, 40).length > 0; }, fn: function (g, ctx) { return doAid(ctx.sb); } },
    { id: 'joint_war', cat: '외교', name: M.cJ, desc: M.cJd, cost: { gold: 6 }, cd: 3, hist: '가상', eff: {}, lines: [M.cJl], req: function (ctx) { var sb = ctx.sb, f = foeSide(sb); return !A_(sb).joint && !!f && partners(sb, 45, f).length > 0; }, fn: function (g, ctx) { return doJoint(ctx.sb); } }
  ]);

  /* 기한이 끝나면 원군은 돌아간다 */
  var _ye = P.yearEnd;
  P.yearEnd = function () {
    var s = this.s, a = s.ally;
    if (a && a.aid && a.aid.until <= s.year) { var Ar = this.g.state.army; for (var id in a.aid.units) Ar[id] = Math.max(0, (Ar[id] || 0) - a.aid.units[id]); this.log('원군 귀환: ' + nmRole(this, a.aid.role)); a.aid = null; this.g.renderArmy(); }
    if (a && a.joint && a.joint.until <= s.year) a.joint = null;
    return _ye.apply(this, arguments);
  };

  /* ③ 우호국이 먼저 청해 온다 */
  var _ws = P.worldSim;
  P.worldSim = function () { var r = _ws.apply(this, arguments); try { this.allyAsk(); } catch (e) { } return r; };
  P.allyAsk = function () {
    var self = this, s = this.s, a = A_(this), mv = (s.ai && s.ai.mv) || [], coal = (s.coal && s.coal.members) || [];
    if (a.ask) return;
    var rs = shuffle(this.aliveRoles().filter(function (r) { var sd = self.sides[r]; return sd && sd !== self.side && (s.rel[r] || 0) >= 50 && coal.indexOf(r) < 0 && !(s.destroyed && s.destroyed[sd]); }));
    for (var i = 0; i < rs.length; i++) {
      var r = rs[i], side = this.sides[r], lost = mv.filter(function (m) { return m.def === side && m.win; })[0];
      if (lost && Math.random() < 0.45) { a.ask = { kind: 'aid', role: r, to: lost.to, by: lost.side }; return; }
      if (!a.joint && s.rel[r] >= 60 && Math.random() < 0.07) { var foe = foeSide(this, r); if (foe && foe !== side) { a.ask = { kind: 'joint', role: r, foe: foe }; return; } }
    }
  };
  var _rt = P.renderTurn;
  P.renderTurn = function () {
    var r = _rt.apply(this, arguments), a = this.s.ally;
    if (a && a.ask && !document.querySelector('.modal')) { try { this.askUI(a.ask); } catch (e) { a.ask = null; } }
    return r;
  };
  P.askUI = function (q) {
    var self = this, s = this.s, a = A_(this), r = q.role, wrap = h('div', 'modal'), card = h('div', 'card');
    var nm = '<b>' + nmRole(this, r) + '</b>', aid = q.kind === 'aid';
    card.innerHTML = '<h2>' + (aid ? M.aT : M.jT) + '</h2><p>' + nm + (aid ? M.askA : M.askJ + '<b>' + nmSide(this, q.foe) + '</b>') + '</p>';
    var box = h('div', 'choices');
    function btn(label, hint, fn) { var b = h('button', 'ch', label + '<small>' + hint + '</small>'); b.onclick = function () { wrap.remove(); a.ask = null; fn(); }; box.appendChild(b); }
    btn(aid ? M.send : M.join, aid ? M.sendH : M.joinH, function () {
      s.rel[r] = clamp((s.rel[r] || 0) + (aid ? 10 : 5), 0, 100);
      if (aid) {
        self.loseField(1, 0.06); var w = s.world[r]; if (w) w.p = clamp(w.p + 3, 4, 150);
        var back = q.to && Math.random() < 0.6 && s.owners && s.owners[q.to] === q.by; if (back) s.owners[q.to] = self.sides[r];
        s.last = nm + (back ? M.gave : M.gave2); self.log('원군 파견: ' + nmRole(self, r));
      } else {
        setJoint(self, r, q.foe); var fr = self.roleOf(q.foe), fw = fr && s.world[fr]; if (fw) { if (fr === 'tang') fw.commit = clamp(fw.commit + 4, 0, 100); else fw.hostility = clamp(fw.hostility + 6, 0, 100); }
        s.last = nm + M.jdone + '<b>' + nmSide(self, q.foe) + '</b>'; self.log('공동 출병 수락: ' + nmRole(self, r));
      }
      self.renderTurn();
    });
    btn(aid ? M.refuse : M.decl, aid ? M.refuseH : M.declH, function () { s.rel[r] = clamp((s.rel[r] || 0) - (aid ? 8 : 2), 0, 100); s.last = aid ? nm + M.refused : ''; self.renderTurn(); });
    card.appendChild(box); wrap.appendChild(card); this.g.root.appendChild(wrap);
  };

  /* 공동 출병: 같은 적을 치는 우호국의 공세가 이어진다(aiwar.js 가 호출) */
  P.jointWar = function () {
    var a = A_(this), j = a.joint, s = this.s; if (!j || j.until < s.year || j.hit >= 2) return null;
    if (s.destroyed && s.destroyed[j.foe]) { a.joint = null; return null; }
    return j;
  };

  /* ④ 적국 병력 체계 */
  var _nt = P.natTurn;
  P.natTurn = function (side) {
    var r = _nt.apply(this, arguments), n = this.nat(side);
    if (n.res == null) n.res = BASE_RES[side] || 35;
    n.res = clamp(n.res + (r.done.indexOf('recruit') >= 0 ? 7 : 0) + (r.done.indexOf('drill') >= 0 ? 1 : 0) - 2 + (n.people > 55 ? 0.5 : 0), 10, 100);
    return r;
  };
  function resOf(sb, side) { var n = sb.nat(side); if (n.res == null) n.res = BASE_RES[side] || 35; return n.res; }
  SG.resOf = resOf;
  function mixFor(sb, side, kind, n) {
    var b = PROFILE[side] || PROFILE.gaya, m = {}, k, sum = 0, bl = n.bl || {};
    for (k in b) m[k] = b[k];
    m.elite = (m.elite || 0) + (bl.elite || 0) / 1000; m.horse = (m.horse || 0) + (bl.cav || 0) / 1000; m.archer = (m.archer || 0) + (bl.rng || 0) / 1000;
    if (kind === 'capital') { m.elite += 0.08; m.guard = 0.06; m.line -= 0.05; m.levy = Math.max(0.02, (m.levy || 0) - 0.05); }
    if (kind === 'fortress' || kind === 'pass') { m.archer += 0.05; m.siege = (m.siege || 0) + 0.02; m.garrison += 0.06; m.horse = Math.max(0.02, m.horse - 0.05); }
    if (kind === 'port') { m.navy = 0.06; }
    if (kind === 'patrol') { m.garrison = 0.02; m.horse += 0.1; m.archer += 0.04; m.levy = Math.max(0.02, (m.levy || 0) - 0.04); m.siege = 0; }
    for (k in m) { if (m[k] < 0) m[k] = 0; sum += m[k]; } for (k in m) m[k] = m[k] / sum;
    return m;
  }
  var _dt = P.dynTarget;
  P.dynTarget = function (pl, ow) {
    var t = _dt.apply(this, arguments), n = this.nat(ow), res = resOf(this, ow), j = this.jointWar && this.jointWar();
    t.mix = mixFor(this, ow, pl.kind, n); t.res = res;
    t.garrison = Math.round(t.garrison * (1.04 + res / 280) * (j && j.foe === ow ? 0.88 : 1) / 500) * 500; if (j && j.foe === ow) t.joint = 1;
    return t;
  };
  var _wf = P.warFight;
  P.warFight = function (Tg) {
    try {
      var a = A_(this); if (Tg && Tg.side) a.lastFoe = Tg.side;
      if (Tg && Tg.dyn && !Tg._rl) {
        Tg._rl = 1; var pl = SG.placeById(Tg.place), self = this, near = [];
        if (pl) this.places().forEach(function (p) { if (p.id !== pl.id && CASTLE[p.kind] && self.ownerOf(p) === Tg.side && dist(p, pl) < 0.9) near.push(p); });
        near.sort(function (x, y) { return dist(x, pl) - dist(y, pl); });
        var k = Math.min(3, near.length), chance = 0.22 + 0.12 * k + (pl && pl.kind === 'capital' ? 0.15 : 0);
        if (near.length && Math.random() < chance) {
          var rl = Math.round(Tg.garrison * (0.1 + 0.05 * k) * (0.6 + resOf(this, Tg.side) / 120) / 100) * 100;
          if (rl > 0) { Tg.garrison += rl; this.pre = (this.pre || '') + '<div class="freehd">🛡 <b>' + M.relT + '</b> ' + near.slice(0, 2).map(function (p) { return '<b>' + short(p) + '</b>'; }).join(', ') + M.rel1 + '</div>'; this.log('구원군: ' + near.map(short).slice(0, 2).join('·')); }
        }
      }
    } catch (e) { }
    return _wf.apply(this, arguments);
  };
  SG.mixFor = function (sb, side, kind) { return mixFor(sb, side, kind, sb.nat(side)); };
  SG.ALLY = M;
})();
