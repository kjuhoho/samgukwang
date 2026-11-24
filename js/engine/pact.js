/* 동맹과 명분 (게임 추상화 모델)
 * 우호도가 높은 나라(동맹)는 우리를 거의 치지 않는다. 그래도 칼을 뽑는다면 반드시 '명분'이 있어야 하고, 그 순간 동맹은 깨진다.
 *  - 역사 속 명분: 553년 신라의 나제동맹 파기, 475년 한성 함락으로 이어진 고구려의 남진, 645·660년 당의 정벌, 670년 나당전쟁 …(해당 시기에만)
 *  - 정세의 명분: 우리의 과도한 팽창, 우리가 약해진 틈, 원군 요청을 거절당한 앙금, 새로 맺은 맹약국의 요청
 *  - 나라끼리의 맹약(ai.pact)도 같은 방식으로 깨질 수 있다: 힘이 기운 틈에 삼키려 하거나, 너무 커진 맹약국이 두려워 먼저 친다.
 * 문장은 함수 안에서 만들어지므로 L3()로 지금 언어에 맞춰 고른다. 이름은 <b>로 감싸 화면 번역이 따로 처리하게 한다. */
(function () {
  var P = SG.Sandbox.prototype;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var L3 = SG.L3;
  function nmOf(sb, side) { var r = sb.roleOf(side); return r ? sb.names[r].replace('(멸망)', '') : ((SG.sideName && SG.sideName[side]) || side); }
  function en_(ko) { var I = SG.i18n && SG.i18n.dict; return (I && I.en && I.en[ko]) || ko; }
  function ja_(ko) { var I = SG.i18n && SG.i18n.dict; return (I && I.ja && I.ja[ko]) || ko; }

  /* ── 역사 속 명분: att(공격하는 나라) → vic(공격당하는 나라), from~to년 사이에만 ── */
  function H(id, att, vic, from, to, w, ko, en, ja) { return { id: id, att: att, vic: vic, from: from, to: to, w: w, ko: ko, en: en, ja: ja }; }
  var HIST = [
    H('nje', 'silla', 'baekje', 551, 575, 1.7,
      '한강 하류를 노려 나제동맹을 깨뜨렸습니다 — 553년 신라 진흥왕이 백제가 되찾은 한강 하류를 빼앗은 일을 닮았습니다.',
      'It broke the Silla–Baekje alliance to seize the lower Han River — much as Jinheung of Silla did in 553, taking land Baekje had just won back.',
      '漢江下流を狙って羅済同盟を破りました — 553年、新羅の真興王が百済の取り戻した漢江下流を奪った出来事に重なります。'),
    H('jukryeong', 'silla', 'goguryeo', 551, 575, 1.4,
      '고구려가 내분과 북방의 압박으로 흔들리는 틈에 죽령 이북의 땅을 노려 우호를 깼습니다 — 551년 신라가 고구려의 10여 개 군을 차지한 일을 닮았습니다.',
      'Seeing Goguryeo shaken by strife and northern pressure, it broke the friendship to grab the land north of Jukryeong — as Silla did in 551, taking about ten of its districts.',
      '高句麗が内紛と北方の圧力で揺らぐ隙に、竹嶺以北の地を狙って友好を破りました — 551年、新羅が高句麗の十余郡を奪った出来事に重なります。'),
    H('daeya', 'silla', 'baekje', 642, 660, 1.4,
      '대야성의 한을 갚겠다며 우호를 깼습니다 — 642년 대야성을 잃은 김춘추가 백제에 복수하려 당과 손잡은 길을 닮았습니다.',
      'It broke the friendship to avenge Daeya Fortress — much as Kim Chunchu, after the loss of the fortress in 642, allied with Tang to take revenge on Baekje.',
      '大耶城の恨みを晴らすとして友好を破りました — 642年に大耶城を失った金春秋が、百済への復讐のため唐と手を結んだ道に重なります。'),
    H('onDal', 'goguryeo', 'silla', 590, 660, 1.3,
      '죽령 이북의 옛 땅을 되찾는다는 명분으로 우호를 깼습니다 — 590년 온달이 \'죽령 이북을 되찾지 못하면 돌아오지 않겠다\'며 출정한 일을 닮았습니다.',
      'Under the banner of reclaiming the old land north of Jukryeong, it broke the friendship — like Ondal in 590, who marched out vowing not to return until he had won it back.',
      '竹嶺以北の旧領を取り戻すとして友好を破りました — 590年、温達が「竹嶺以北を取り戻すまで帰らない」と出陣した出来事に重なります。'),
    H('namjin', 'goguryeo', 'baekje', 427, 560, 1.5,
      '남진 정책으로 백제를 압박했습니다 — 427년 평양으로 도읍을 옮긴 장수왕이 475년 한성을 함락시킨 길을 닮았습니다.',
      'Its southward push pressed Baekje — the road King Jangsu took after moving the capital to Pyongyang in 427, ending in the fall of Hanseong in 475.',
      '南進政策で百済を圧迫しました — 427年に平壌へ遷都した長寿王が、475年に漢城を陥落させた道に重なります。'),
    H('namjin2', 'goguryeo', 'silla', 427, 520, 1.2,
      '남진 정책의 하나로 신라를 눌렀습니다 — 장수왕 이래 고구려가 신라를 압박하고 468년 실직주성까지 친 일을 닮았습니다.',
      'As part of its southward push it pressed Silla — as Goguryeo had since King Jangsu, even striking Siljikju Fortress in 468.',
      '南進政策の一環として新羅を押さえ込みました — 長寿王以来、高句麗が新羅を圧迫し、468年に悉直州城まで攻めた出来事に重なります。'),
    H('pyeongyang', 'baekje', 'goguryeo', 371, 420, 1.3,
      '북진에 나서 옛 땅을 노렸습니다 — 371년 백제 근초고왕이 평양성을 쳐 고구려 고국원왕이 전사한 일을 닮았습니다.',
      'It pushed north for the old lands — much as King Geunchogo of Baekje struck Pyongyang in 371, where Goguryeo\'s King Gogugwon fell.',
      '北進に出て旧領を狙いました — 371年、百済の近肖古王が平壌城を攻め、高句麗の故国原王が戦死した出来事に重なります。'),
    H('gwansan', 'baekje', 'silla', 554, 660, 1.4,
      '한강 유역을 잃은 한을 앞세워 우호를 깼습니다 — 554년 관산성, 642년 대야성으로 이어진 백제의 신라 공세를 닮았습니다.',
      'It broke the friendship, citing the grudge over the lost Han River basin — much like Baekje\'s drives on Silla at Gwansan Fortress in 554 and Daeya Fortress in 642.',
      '漢江流域を失った恨みを掲げて友好を破りました — 554年の管山城、642年の大耶城へと続いた百済の新羅攻勢に重なります。'),
    H('goguryeo645', 'tang', 'goguryeo', 642, 668, 1.7,
      '연개소문의 정변을 구실로 군을 일으켰습니다 — 645년 당 태종이 영류왕을 시해한 연개소문을 응징한다며 고구려를 친 일을 닮았습니다.',
      'It raised an army on the pretext of Yeon Gaesomun\'s coup — much as Taizong of Tang attacked Goguryeo in 645, vowing to punish the man who had killed King Yeongnyu.',
      '淵蓋蘇文のクーデターを口実に軍を起こしました — 645年、唐の太宗が栄留王を殺した淵蓋蘇文を懲らしめるとして高句麗を攻めた出来事に重なります。'),
    H('baekje660', 'tang', 'baekje', 650, 660, 1.7,
      '백제가 신라의 당항성을 노려 당과 신라의 길을 끊으려 한다며 동맹을 깼습니다 — 660년 당과 신라가 백제를 함께 친 일을 닮았습니다.',
      'It broke the alliance, claiming Baekje meant to cut the road between Tang and Silla by striking Danghang Fortress — much as Tang and Silla joined to crush Baekje in 660.',
      '百済が新羅の党項城を狙って唐と新羅の道を断とうとしていると言い、同盟を破りました — 660年に唐と新羅が百済を挟み撃ちした出来事に重なります。'),
    H('gyerim', 'tang', 'silla', 663, 680, 1.8,
      '신라를 계림도독부로 삼아 한반도 전체를 다스리려 나당 동맹을 깼습니다 — 670년 시작된 나당전쟁을 닮았습니다.',
      'It broke the Tang–Silla alliance, wanting to make Silla the Gyerim Area Command and rule the whole peninsula — much like the Silla–Tang war that began in 670.',
      '新羅を鶏林都督府として半島全体を治めようと、羅唐同盟を破りました — 670年に始まった羅唐戦争に重なります。'),
    H('waraid', 'wa', 'silla', 391, 500, 1.0,
      '해안 약탈과 교역의 이익을 좇아 우호를 깼습니다 — 4~5세기 왜가 거듭 신라 해안을 침입한 일을 닮았습니다.',
      'Chasing plunder and trade profit along the coast, it broke the friendship — much like the Wa raids on Silla\'s shores in the 4th and 5th centuries.',
      '沿岸の略奪と交易の利を追って友好を破りました — 4〜5世紀に倭がたびたび新羅の海岸を侵した出来事に重なります。')
  ];

  /* 우리 쪽 기록: 원군을 거절했는가, 공동 출병을 사양했는가, 언제 동맹이 깨졌는가 */
  function A_(sb) { var s = sb.s; return s.ally = s.ally || {}; }
  function pactPartner(sb, side) {
    var ai = sb.s.ai, y = sb.s.year, out = null;
    if (!ai || !ai.pact) return null;
    Object.keys(ai.pact).forEach(function (k) { if (ai.pact[k] < y) return; var m = k.split('|'); if (m.indexOf(side) < 0) return; var o = m[0] === side ? m[1] : m[0]; if (o !== sb.side) out = o; });
    return out;
  }
  function pickW(list) {
    var t = list.reduce(function (a, x) { return a + x.w; }, 0), r = Math.random() * t, i;
    for (i = 0; i < list.length; i++) { r -= list[i].w; if (r <= 0) return list[i]; }
    return list[list.length - 1];
  }

  /* ① 우호국이 우리를 칠 명분. 없으면 null — 동맹은 이유 없이 칼을 뽑지 않는다 */
  P.casusBelli = function (role, side, ctx) {
    var s = this.s, y = s.year, me = this.side, a = A_(this), out = [];
    if (a.broken && a.broken[role] != null && y - a.broken[role] < 6) return null;   // 막 깨진 동맹이 곧바로 또 깨질 수는 없다
    HIST.forEach(function (h) { if (h.att === side && h.vic === me && y >= h.from && y <= h.to) out.push({ id: h.id, w: h.w, hist: 1, why: L3(h.ko, h.en, h.ja) }); });
    if (ctx.dom >= 4) out.push({ id: 'grow', w: 0.8 + Math.min(1, (ctx.dom - 4) / 8), why: L3('우리가 너무 커졌다고 판단했습니다 — 세력 균형을 무너뜨리는 패자를 그냥 둘 수 없다며 동맹을 깼습니다.', 'It judged us far too large — it would not leave a would-be hegemon unchecked, and broke the alliance.', '我が国が大きくなりすぎたと判断しました — 勢力均衡を崩す覇者を放置できないとして同盟を破りました。') });
    if ((ctx.away && ctx.away.frac >= 0.3) || ctx.mor < 40) out.push({ id: 'weak', w: 0.7, why: L3('우리가 약해진 틈을 노렸습니다 — 군이 멀리 나가 있고 민심이 흔들리는 사이 이익을 챙기려 동맹을 저버렸습니다.', 'It saw us weakened — with our army away and morale shaky, it abandoned the alliance to grab its share.', '我が国が弱った隙を突きました — 軍が遠征に出て民心が揺らぐ間に、利を得ようと同盟を捨てました。') });
    if (a.refused && a.refused[role] != null && y - a.refused[role] <= 8) out.push({ id: 'refused', w: 1.1, why: L3('도움을 청했을 때 외면당한 일에 앙심을 품었습니다 — 원군 요청을 거절당해 신의가 깨졌다며 동맹을 접었습니다.', 'It held a grudge for being turned away when it begged for help — it called the alliance void after its plea for troops was refused.', '助けを求めた時に見捨てられたことを恨みました — 援軍要請を断られ、信義が破れたとして同盟を畳みました。') });
    if (a.declined && a.declined[role] != null && y - a.declined[role] <= 6) out.push({ id: 'declined', w: 0.6, why: L3('함께 싸우자는 청을 사양당해 우리를 믿을 수 없다고 판단했습니다.', 'Its call to fight together was declined, and it concluded we could not be trusted.', '共に戦おうという誘いを断られ、我が国を信頼できないと判断しました。') });
    var pt = pactPartner(this, side);
    if (pt) out.push({ id: 'newpact', w: 1.0, why: L3('새로 맺은 <b>' + nmOf(this, pt) + '</b>과의 맹약을 따랐습니다 — 우리와의 옛 우호를 접고 새 맹약국의 편에 섰습니다.', 'It followed its new pact with <b>' + en_(nmOf(this, pt)) + '</b> — dropping its old friendship with us to stand with its new partner.', '新たに結んだ<b>' + ja_(nmOf(this, pt)) + '</b>との盟約に従いました — 我が国との旧交を捨て、新たな盟約国の側に立ちました。') });
    if (!out.length) return null;
    return pickW(out);
  };

  /* ② 동맹이 깨진다: 관계가 무너지고, 빌려준 원군은 돌아가며, 한동안 다시 맺기 어렵다. 침공 알림에 이유를 붙인다 */
  P.breakAlliance = function (role, cb, inv, place) {
    var s = this.s, w = s.world[role], a = A_(this), nmv = this.names[role].replace('(멸망)', ''), side = this.sides[role];
    a.broken = a.broken || {}; a.broken[role] = s.year;
    s.rel[role] = Math.min(s.rel[role], 18);
    if (w) { if (role === 'tang') w.commit = clamp(w.commit + 12, 0, 100); else w.hostility = clamp(Math.max(w.hostility, 45) + 8, 0, 100); }
    var back = '';
    if (a.aid && a.aid.role === role) {
      var Ar = this.g.state.army; for (var id in a.aid.units) Ar[id] = Math.max(0, (Ar[id] || 0) - a.aid.units[id]);
      a.aid = null; this.g.renderArmy(); this.g.hud();
      back = ' ' + L3('빌려 준 원군도 모두 거두어 갔습니다.', 'It also pulled back every soldier it had lent us.', '貸していた援軍もすべて引き揚げました。');
    }
    if (a.joint && a.joint.role === role) a.joint = null;
    var en = en_(nmv), ja = ja_(nmv);
    inv.title = L3(nmv + '의 동맹 파기 공세', en + '\'s Alliance-Breaking Offensive', ja + 'の同盟破棄攻勢');
    inv.intro = '<b>' + nmv + ' — </b>' + L3('동맹을 깨뜨리고 군을 일으켰습니다. ', 'It tore up the alliance and raised an army. ', '同盟を破棄して軍を起こしました。') + back + '<br><small>📌 ' + L3('이유 — ', 'Reason — ', '理由 — ') + cb.why + '</small>' +
      (place ? '<br>' + L3('급보가 이른 곳은 ', 'The alarm came from ', '急報が届いたのは') + '<b>' + place.name + '</b>' + L3(' 방면입니다.', ' direction.', ' 方面です。') : '');
    inv.breakAlly = cb.id; inv.cb = cb.id;
    this.log((cb.hist ? '동맹 파기(역사): ' : '동맹 파기: ') + nmv);
    return inv;
  };

  /* ③ 어떤 경로로 생긴 침공이든, 우호국이 치는 것이면 명분을 따진다(aiStrike 가 아닌 기본 침공·당의 돌발 침략 등) */
  var _inv = P.invasion;
  P.invasion = function () {
    var inv = _inv.apply(this, arguments);
    if (!inv || inv.coalition || inv.rebel || inv.breakAlly || !inv.enemy) return inv;
    var s = this.s, role = this.roleOf(inv.enemy.side); if (!role || s.rel[role] < 55) return inv;
    var dom = this.dominance ? this.dominance() : 0, cb = this.casusBelli(role, inv.enemy.side, { rel: s.rel[role], dom: dom, away: this.awayNow ? this.awayNow() : null, mor: this.g.state.res.morale });
    if (!cb) return null;   // 명분이 없으면 동맹은 칼을 거둔다
    return this.breakAlliance(role, cb, inv, inv.place && SG.placeById(inv.place));
  };

  /* ④ 막 깨진 동맹은 한동안 외교로 곧바로 되살릴 수 없다 */
  var _ye = P.yearEnd;
  P.yearEnd = function () {
    try { var s = this.s, b = s.ally && s.ally.broken; if (b) Object.keys(b).forEach(function (r) { if (s.year - b[r] < 8 && s.rel[r] != null && s.rel[r] > 45) s.rel[r] = 45; }); } catch (e) { }
    return _ye.apply(this, arguments);
  };

  /* ⑤ 나라끼리의 맹약이 깨진다: aiwar.js 가 해마다 맹약마다 부른다. 깨뜨릴 쪽과 맞을 쪽, 이유를 돌려준다(없으면 null) */
  P.pactBreak = function (k) {
    var self = this, s = this.s, y = s.year, m = k.split('|'), x = m[0], z = m[1], d = s.destroyed || {};
    if (d[x] || d[z] || x === this.side || z === this.side) return null;
    if (Math.random() > 0.1) return null;
    var cnt = function (sd) { return self.places().filter(function (p) { return self.ownerOf(p) === sd; }).length; }, out = [];
    [[x, z], [z, x]].forEach(function (pr) {
      var a = pr[0], o = pr[1], pa = self.sidePower(a), po = self.sidePower(o), na = nmOf(self, a), no = nmOf(self, o);
      HIST.forEach(function (h) { if (h.att === a && h.vic === o && y >= h.from && y <= h.to) out.push({ a: a, o: o, w: h.w * 1.5, why: L3(h.ko, h.en, h.ja) }); });
      if (pa >= po * 1.5 || (s.fallen && s.fallen[o] && pa > po)) out.push({ a: a, o: o, w: 1.0, why: L3('<b>' + na + '</b>은(는) 약해진 맹약국의 땅이 눈에 들어왔습니다 — 힘의 균형이 기울자 맹약을 저버리고 <b>' + no + '</b>을(를) 삼키려 합니다.', '<b>' + en_(na) + '</b> eyed the lands of its weakened partner — with the balance tipped, it dropped the pact and moved to swallow <b>' + en_(no) + '</b>.', '<b>' + ja_(na) + '</b>は弱った盟約国の土地に目を付けました — 力の均衡が傾くと盟約を捨て、<b>' + ja_(no) + '</b>を呑み込もうとしています。') });
      if (po >= pa * 1.5 && cnt(o) >= cnt(a) * 1.4) out.push({ a: a, o: o, w: 0.9, why: L3('<b>' + na + '</b>은(는) 너무 커진 맹약국 <b>' + no + '</b>이(가) 두려웠습니다 — 더 늦기 전에 먼저 칼을 뽑았습니다.', '<b>' + en_(na) + '</b> feared its partner <b>' + en_(no) + '</b>, grown too large — it drew the sword first, before it was too late.', '<b>' + ja_(na) + '</b>は大きくなりすぎた盟約国<b>' + ja_(no) + '</b>を恐れました — 手遅れになる前に先に剣を抜きました。') });
    });
    return out.length ? pickW(out) : null;
  };
})();
