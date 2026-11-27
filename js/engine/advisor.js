/* 내장 AI 참모(advisor) — 외부 서버 없이 규칙·사전·확률로 동작한다.
 *  parse     : 자유 문장 → 명령/법령/전쟁 대상/종료 의사 해석
 *  improvise : 어느 규칙에도 안 맞는 '내 마음대로' 교지를 상황에 맞춰 효과·서술로 만든다
 *  advise    : 지금 나라 상태를 보고 참모가 한마디
 *  epilogue  : 나라 상태·기록으로 결말 문단을 조합 */
window.SG = window.SG || {};
(function () {
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var CMD_RULES = [
    ['relocate', /천도|도읍을 ?옮|수도를 ?옮|도성을 ?옮/],
    ['assassinate', /암살|자객|독살|시해/],
    ['espionage', /이간|간첩|스파이|첩자를 ?(보내|풀)|공작/],
    ['marriage', /혼인|결혼|혼사|시집|사위|왕녀/],
    ['law', /법령|율령|법을|법률|법도|제정|반포/],
    ['deploy', /배치|주둔|병력을? .{0,8}(모아|옮기|이동|집결)|(수도|전선|국경)에 .{0,6}병력/],
    ['war', /전쟁|공격|침공|정벌|출병|원정|쳐들어|쳐라|쳐서|친다|치자|선전 ?포고|빼앗|점령|함락|토벌/],
    ['raid', /연안 ?습격|해안 ?습격|상륙/],
    ['return_cities', /성을 ?(돌려|반환)|반환/],
    ['tribute_tang', /조공|입조|예물|책봉/],
    ['peace_silla', /화친|화해|강화|휴전|평화/],
    ['ally_goguryeo', /동맹|연합|공조/],
    ['buy_grain', /(군량|곡식|식량|양식|쌀|양곡)을? ?(사|구입|구매|매입|조달|확보)|(군량|곡식|식량|양곡) ?(구입|구매|매입|조달)/],
    ['irrigation', /수리|관개|저수지|물길|수로|제방을? ?(쌓|보수|수리|정비)|보를? ?(쌓|만|고치)/],
    ['plow', /우경|쟁기|철제 ?농기구|농기구 ?(보급|나눠|지급)|소로 ?(밭|농사)/],
    ['granary', /곡창|창고를? ?(증설|늘|더 ?짓|새로 ?짓)|곳간을? ?(늘|증설|짓)|관곡/],
    ['grain_levy', /(곡식|곡물|양곡|식량)을? ?(더 ?)?(거두|징수|징발|걷)|추가 ?징수|곡물 ?징수/],
    ['market', /시장을? ?(열|개설|세우|만들|키우)|시전|장터|상인(을|들을)? ?(보호|우대)/],
    ['workshop', /공방|수공업|장인을? ?(모|양성|키우)|도자기|직조|길쌈/],
    ['port', /항구|교역망|포구|나루|교역로/],
    ['trade_envoy', /무역|교역|상단|무역선|시장/],
    ['wa_envoy', /원군 ?외교|먼 ?나라/],
    ['hostage', /인질/],
    ['mercenary', /용병|이민족 ?(고용|부대)/],
    ['academy', /학교|태학|학문|교육|서당|인재 ?양성|박사/],
    ['iron', /제철|대장간|철 ?(생산|광)|무기를 ?(개량|제작|만들)/],
    ['feast', /연회|잔치|술자리|사냥|놀이|무도회/],
    ['farm', /농사|농업|농경|종자|농기구|권농/],
    ['relief', /진휼|구휼|굶주린|곡식을 ?(나누|풀)/],
    ['census', /호구|인구 ?조사|조세 ?정비/],
    ['amnesty', /사면|죄수|대사령/],
    ['purge', /숙청|반대파|귀족을 ?(치|제거|몰아|처벌)/],
    ['court_gift', /회유|귀족.*(달래|선물|하사)|하사/],
    ['officials', /관제|관등|관직|관리 ?정비|행정/],
    ['temple', /사찰|절을|불교|승려|탑을/],
    ['palace', /궁궐|궁전|정자|궁을/],
    ['ritual', /제사|제례|천지|하늘에 ?빌/],
    ['tunjeon', /개간|둔전|황무지/],
    ['drill', /훈련|조련|연병|단련|무예|조교/],
    ['levy', /징병|징발|모병|병사를 ?(모|뽑)|군사를 ?(모집|늘|더)/],
    ['standing', /상비군|상비|정병/],
    ['horse', /기병|군마|목장|말을 ?(사|키|기)/],
    ['archers', /궁수|궁병|노병|활을|활쏘/],
    ['elite', /정예|결사대|최정예|친위 ?정예/],
    ['guard', /친위|호위|근위/],
    ['fortify', /산성|성을 ?(쌓|수리|보수|증)|축성|성벽|방어|방비|요새/],
    ['navy', /수군|함대|전선|배를|조선소|해군/],
    ['scouts', /척후|정찰|첩보|정보 ?수집/],
    ['parade', /열병|사열|포상|논공|상을 ?내/]
  ];
  var LAW_RULES = [
    ['tunjeonje', /둔전제|군둔|군이 ?농사|병사가 ?농사/], ['landreform', /균전|정전|토지 ?(분배|재분배|개혁)|땅을 ?(고르게|나눠)/], ['coinage', /화폐|도량형|동전|주화|저울/], ['marketlaw', /상업 ?장려|시전 ?설치|상인 ?장려|장사를 ?장려/],
    ['yulyeong', /율령|형법|법전|법전/], ['gunyeok', /군역|병역/], ['pyeongchang', /상평|곡물 ?비축|비축/], ['tradelaw', /교역 ?장려|해상 ?교역/],
    ['noble_audit', /식읍|귀족.*(정리|줄)/], ['reclaim', /개간 ?장려/], ['inspect', /감찰|감사|비리/], ['martial', /군율|군기/], ['taxcut', /세금|조세|감면/], ['buddhism', /불교 ?진흥/]
  ];
  var CATS = {
    military: [/훈련|병|군|전쟁|무기|활|말|함대|갑옷|전술|진법|병법/, '군사'], economy: [/농|세금|재물|금|곡식|시장|교역|장사|수확|물자|돈/, '경제'],
    diplomacy: [/사신|외교|동맹|선물|예물|화친|교섭|담판/, '외교'], religion: [/제사|불교|절|기도|점|신령|하늘|굿|부처|산신/, '종교'],
    culture: [/학문|글|책|역사|시|음악|예술|건축|그림|문자|기록/, '문화'], cruelty: [/처형|학살|고문|죽이|벌|가두|참수|효수|엄벌/, '엄벌'],
    lavish: [/술|연회|잔치|사치|궁녀|놀이|사냥|유람|기생/, '향락'], mercy: [/용서|은혜|베풀|나누|구휼|위로|돌보/, '선정'], secret: [/첩|비밀|몰래|암행|밀사|염탐|밀서/, '공작']
  };
  var NARR = {
    military: ['군영에 왕의 뜻이 전해지자 장수들이 병사를 닦달해 새 진법을 시험했습니다.', '병기고가 열리고 군사들이 구령에 맞춰 움직였습니다.'],
    economy: ['관청의 서리들이 장부를 들고 뛰어다니며 왕의 뜻을 시행했습니다.', '시장과 창고가 손질되고 재물의 흐름이 조금 바뀌었습니다.'],
    diplomacy: ['사신들이 왕의 뜻을 품고 길을 나섰습니다.', '외교 문서가 몇 차례 오갔습니다.'],
    religion: ['제관들이 의식을 준비하고 사람들이 모여 기원했습니다.', '향이 피어오르는 가운데 왕의 뜻이 하늘에 고해졌습니다.'],
    culture: ['박사들이 붓을 들어 왕의 뜻을 문서로 남겼습니다.', '학자와 장인들이 모여 새 일을 시작했습니다.'],
    cruelty: ['형리들이 움직이자 도성이 서늘하게 조용해졌습니다.', '엄한 처벌의 소문이 퍼졌습니다.'],
    lavish: ['궁중에서 며칠 동안 잔치가 이어졌습니다.', '풍악이 울리고 술이 돌았습니다.'],
    mercy: ['관아마다 왕의 은덕이 선포되었습니다.', '곳곳에서 왕을 칭송하는 소리가 들렸습니다.'],
    secret: ['밀사들이 어둠 속에서 움직였습니다.', '비밀리에 오가는 서신이 늘었습니다.'],
    none: ['참모들은 뜻을 헤아리다 우선 작은 시행을 해 보기로 했습니다.']
  };
  var EFF = {
    military: function () { return { realm: { train: Math.round(rnd(3, 8)) }, fx: { morale: Math.round(rnd(0, 3)), food: -Math.round(rnd(1, 4)) } }; },
    economy: function () { return { realm: { econ: Math.round(rnd(2, 6)) }, fx: { gold: Math.round(rnd(-4, 6)), people: Math.round(rnd(-2, 2)) } }; },
    diplomacy: function () { return { rel: { __t: Math.round(rnd(4, 10)) }, fx: { gold: -Math.round(rnd(2, 5)) } }; },
    religion: function () { return { fx: { people: Math.round(rnd(2, 5)), gold: -Math.round(rnd(1, 4)) }, realm: { royal: Math.round(rnd(0, 3)) } }; },
    culture: function () { return { realm: { royal: Math.round(rnd(1, 3)), econ: Math.round(rnd(1, 3)) }, fx: { people: Math.round(rnd(0, 2)), gold: -Math.round(rnd(1, 4)) } }; },
    cruelty: function () { return { realm: { royal: Math.round(rnd(4, 9)) }, fx: { people: -Math.round(rnd(4, 8)), morale: -Math.round(rnd(0, 3)) } }; },
    lavish: function () { return { fx: { morale: Math.round(rnd(2, 6)), people: -Math.round(rnd(0, 3)), gold: -Math.round(rnd(5, 10)) }, realm: { royal: -Math.round(rnd(0, 3)) } }; },
    mercy: function () { return { fx: { people: Math.round(rnd(4, 8)) }, realm: { royal: -Math.round(rnd(0, 2)) } }; },
    secret: function () { return { realm: { intel: Math.round(rnd(5, 10)) }, fx: { gold: -Math.round(rnd(2, 6)) } }; },
    none: function () { return { fx: { gold: -2 } }; }
  };

  function nameMentioned(sb, text) {
    var out = null; ['silla', 'goguryeo', 'tang', 'wa'].forEach(function (k) { if (text.indexOf(sb.names[k]) >= 0) out = out || k; });
    return out;
  }
  function findTarget(sb, text) {
    var list = sb.targets(), best = null;
    // 1순위: 성 이름이 그대로 나온 경우 (예: '사비성을 쳐라', '대야성')
    list.forEach(function (t) {
      var pl = SG.placeById(t.place), keys = []; if (pl) { keys.push(pl.name.replace(/\(.*?\)/g, '').trim()); if (pl.name.indexOf('(') > 0) keys.push(pl.name.replace(/.*\((.*?)\)/, '$1')); var base = pl.name.replace(/\(.*?\)|성$/g, '').trim(); if (base.length >= 2) keys.push(base); } if (t.short) keys.push(sb.L(t.short).replace(/성$/, ''));
      keys.forEach(function (k) { if (k && k.length >= 2 && text.indexOf(k) >= 0 && !best) best = t; });
    });
    if (best) return best;
    list.forEach(function (t) { var nm = sb.L(t.name), k = nm.replace(/\(.*?\)/g, '').trim().split(' ')[0]; if (k && k.length >= 2 && text.indexOf(k) >= 0 && !t.dyn && !best) best = t; });
    return best;
  }

  SG.advisor = {
    catsOf: function (text) { var out = []; for (var k in CATS) if (CATS[k][0].test(text)) out.push(CATS[k][1]); return out.slice(0, 3); },
    parse: function (text, sb) {
      var t = text.replace(/\s+/g, ' ');
      if (/항복|투항|나라를 ?(바치|넘기)|복속/.test(t)) return { kind: 'end', kind2: 'surrender' };
      if (/퇴위|양위|왕위를 ?(물려|넘기|내려)|선양|왕위에서 ?물러/.test(t)) return { kind: 'end', kind2: 'abdicate' };
      var cmds = sb.cmds(), byId = {}; cmds.forEach(function (c) { byId[c.id] = c; });
      var role = nameMentioned(sb, t);
      for (var i = 0; i < CMD_RULES.length; i++) {
        var r = CMD_RULES[i]; if (!r[1].test(t)) continue;
        var id = r[0];
        if (id === 'raid') id = 'raid_tang';
        if (id === 'war') { var tg = findTarget(sb, t); return { kind: 'cmd', cmd: byId.war || cmds[0], opt: tg ? { target: tg.id } : {} }; }
        if (id === 'law') { var lw = null; LAW_RULES.forEach(function (x) { if (!lw && x[1].test(t) && !sb.s.laws[x[0]]) lw = x[0]; }); return { kind: 'cmd', cmd: byId.law, opt: lw ? { law: lw } : {} }; }
        if (id === 'marriage') return { kind: 'cmd', cmd: byId.marriage, opt: role ? { role: role } : {} };
        if (id === 'tribute_tang' && role && role !== 'tang') id = role === 'wa' ? 'wa_envoy' : role === 'goguryeo' ? 'ally_goguryeo' : 'peace_silla';
        if (id === 'peace_silla' && role === 'goguryeo') id = 'ally_goguryeo';
        if (id === 'wa_envoy' && !role) role = 'wa';
        if (byId[id]) return { kind: 'cmd', cmd: byId[id], opt: {} };
      }
      // 순수 이름만 언급: 외교 행동으로 해석
      if (role === 'wa') return { kind: 'cmd', cmd: byId.wa_envoy, opt: {} };
      if (role === 'tang') return { kind: 'cmd', cmd: byId.tribute_tang, opt: {} };
      return { kind: 'improv', role: role };
    },
    improvise: function (text, sb, r) {
      var scores = [];
      for (var k in CATS) { var m = text.match(new RegExp(CATS[k][0].source, 'g')); if (m) scores.push([k, m.length]); }
      scores.sort(function (a, b) { return b[1] - a[1]; });
      var cats = scores.slice(0, 2).map(function (x) { return x[0]; }); if (!cats.length) cats = ['none'];
      var eff = {}, lines = [], cost = { gold: 3 };
      var luck = rnd(0.6, 1.4), bad = Math.random() < 0.15;
      cats.forEach(function (c, i) {
        var e = EFF[c](), f = i ? 0.6 : 1;
        function scale(o) { var out = {}; for (var kk in o) { if (typeof o[kk] === 'object') out[kk] = scale(o[kk]); else out[kk] = Math.round(o[kk] * f * (bad && o[kk] > 0 ? -0.5 : luck)); } return out; }
        e = scale(e);
        ['fx', 'realm', 'rel'].forEach(function (g) { if (e[g]) { eff[g] = eff[g] || {}; for (var q in e[g]) eff[g][q] = (eff[g][q] || 0) + e[g][q]; } });
        lines.push(pick(NARR[c]));
      });
      if (eff.rel && eff.rel.__t != null) { var tgt = r && r.role || pick(['silla', 'goguryeo', 'tang', 'wa']); eff.rel[tgt] = eff.rel.__t; delete eff.rel.__t; }
      if (eff.fx && eff.fx.gold < 0) cost = {}; // 효과 안에 이미 비용 반영
      var tail = bad ? '그러나 전례가 없는 일이라 시행 중에 잡음이 많아 기대한 성과가 나오지 않았습니다.' : luck > 1.15 ? '뜻밖에 호응이 좋아 성과가 기대 이상이었습니다.' : luck < 0.8 ? '낯선 일이라 시행은 더뎠으나 작은 성과는 있었습니다.' : '낯선 일이었으나 참모들이 무난히 시행했습니다.';
      var tag = cats[0] === 'none' ? '참모가 뜻을 정확히 헤아리지 못해, 일반적인 시행으로 갈음했습니다.' : '';
      return { cost: cost, eff: eff, cats: cats, text: lines.join(' ') + ' ' + tail + (tag ? ' ' + tag : '') };
    },
    advise: function (sb) {
      var s = sb.s, res = sb.g.state.res, rl = s.realm, w = s.world, n = sb.names, out = [];
      var nxt = (sb.cfg.timeline || []).filter(function (a) { return a.y === s.year + 1 && a.hint; })[0];
      var ff = sb.foodFlow ? sb.foodFlow() : 0;
      if (res.food < 18) out.push('곡식 창고가 비어 갑니다. 군이 크면 유지비가 큽니다. 농사 장려나 진휼을 서두르고, 금이 있다면 「군량 구입」으로 시장에서 곡식을 사들이십시오.');
      else if (ff < 0 && res.food < -ff * 3) out.push('해마다 군량이 ' + (-ff) + '씩 줄어드는 형편이라 곳간이 오래가지 못합니다. 수리 시설·농기구·둔전으로 농업을 키워 수입을 늘리거나, 「군량 구입」·「곡물 추가 징수」로 급한 불을 끄십시오.');
      var da = sb.domAdvice ? sb.domAdvice() : ''; if (da) out.push(da);
      if (res.gold < 8) out.push('금고가 바닥입니다. 교역이나 호구 조사로 재정을 메워야 합니다.');
      if (res.people < 38) out.push('민심이 흉흉합니다. 대사면, 조세 감면, 진휼 중 하나는 필요합니다.');
      if (w.silla.hostility > 62 && rl.defense < 55) out.push(n.silla + '의 적의가 높은데 방비가 약합니다. 산성을 손보고 첩보를 늘려야 합니다.');
      if (w.tang.commit > 60 && sb.cfg.id) out.push(n.tang + '이(가) 우리와 ' + n.silla + ' 사이에서 개입할 뜻을 굳히고 있습니다. 외교로 달래든가, 오기 전에 결판을 내야 합니다.');
      if (rl.royal < 35) out.push('귀족들이 왕권을 얕보는 기색입니다. 회유하든 눌러 두든 손을 쓰셔야 합니다.');
      if (rl.train < 32) out.push('군의 훈련이 느슨해졌습니다. 해마다 훈련도가 조금씩 닳습니다.');
      if (nxt) out.push(nxt.hint);
      if (!out.length) out.push(pick(['나라가 안정되어 있습니다. 힘을 키울 때입니다.', '큰 급보는 없습니다. 법령을 정비하거나 군을 키우기 좋은 때입니다.', '"하고 싶은 일을 문장으로 적으시면 소신이 해석해 시행하겠습니다."']));
      return pick(out);
    },
    epilogue: function (sb, kind, extra) {
      var s = sb.s, g = sb.g, cfg = sb.cfg, res = g.state.res, rl = s.realm, T = sb.armyTotal() / 1000, caps = Object.keys(s.captured).length;
      var rp = s.world.silla.p, st = s.stats, laws = Object.keys(s.laws).length;
      var power = T * 0.55 + rl.train * 0.2 + rl.defense * 0.2 + rl.econ * 0.15 + res.people * 0.3 + rl.royal * 0.15 + caps * 5 + st.won * 1.5 - st.lost * 2 + (res.gold + res.food) * 0.08;
      var cap = cfg.country || '나라';
      if (!kind) kind = caps >= 3 && rp <= 45 && power > 85 ? 'hegemon' : power > 80 ? 'prosper' : power > 52 ? 'steady' : 'decline';
      var T_ = {
        hegemon: ['패업 — 판을 뒤집은 왕', '霸', '당신의 재위 동안 ' + cap + '은(는) 이웃을 압도하여 반도의 주도권을 쥐었습니다.'],
        prosper: ['중흥 — 나라를 키운 왕', '興', '당신의 재위 동안 ' + cap + '은(는) 군사와 살림 모두 한 단계 올라섰습니다.'],
        steady: ['유지 — 나라를 지킨 왕', '守', '당신은 큰 흔들림 없이 ' + cap + '을(를) 다음 왕에게 넘겼습니다.'],
        decline: ['쇠락 — 나라가 기운 왕', '衰', '재위가 끝날 무렵 ' + cap + '은(는) 눈에 띄게 약해져 있었습니다.'],
        rebellion: ['민란 — 성난 백성에 쫓긴 왕', '亂', '쌓인 원성이 끝내 폭발했습니다. 각지에서 일어난 민란을 막지 못하고 당신의 시대는 끝났습니다.'],
        coup: ['정변 — 궁이 무너진 왕', '變', '왕권이 바닥에 떨어진 틈을 타 귀족과 장수들이 궁을 에워쌌습니다.'],
        surrender: ['항복 — 나라를 넘긴 왕', '降', '당신은 스스로 항복을 택했습니다. 피는 줄었으나 나라는 사라졌습니다.'],
        abdicate: ['퇴위 — 자리를 내려놓은 왕', '讓', '당신은 스스로 왕위를 물려주었습니다. 이후의 일은 다음 왕의 몫입니다.'],
        conquered: [(extra && extra.title) || '패망 — 나라를 잃은 왕', '滅', (extra && extra.text) || '결정적인 싸움에서 패해 나라가 무너졌습니다.']
      }[kind];
      var parts = [];
      parts.push(T_[2]);
      var wealth = res.food + res.gold > 110 ? '곳간은 넉넉히 채워져 있었고' : res.food + res.gold > 45 ? '곳간은 그럭저럭 유지되었으며' : '곳간은 비어 가고 있었고'; var ppl = res.people > 60 ? '백성은 왕을 따랐습니다.' : res.people > 35 ? '백성은 담담히 살았습니다.' : '백성의 마음은 이미 떠나 있었습니다.'; parts.push(wealth + ' ' + ppl);
      parts.push('군은 병력 ' + Math.round(T * 10) / 10 + '천, 훈련도 ' + Math.round(rl.train) + ' 수준이었고, 재위 중 ' + st.wars + '번 출병해 ' + st.won + '번 성을 얻었습니다.' + (caps ? ' (점령지 ' + caps + '곳)' : ''));
      if (st.invaded) parts.push(sb.names.silla + '의 침공을 ' + st.invaded + '번 받았고 그중 ' + st.defended + '번을 막아냈습니다.');
      if (laws) parts.push('재위 중 반포한 법령은 ' + laws + '건' + (s.laws.yulyeong ? '(율령 포함)' : '') + '입니다.');
      var cat = Object.keys(st.cat).sort(function (a, b) { return st.cat[b] - st.cat[a]; })[0];
      var leg = { '내정': '후세는 그를 나라 살림과 백성을 먼저 챙긴 군주로 기억했습니다.', '군사': '후세는 그를 칼과 병영의 군주로 기억했습니다.', '외교': '후세는 그를 사신의 길을 닦아 나라를 지키려 한 군주로 기억했습니다.', '특수': '후세는 그를 예측하기 어렵고 과감했던 군주로 기억했습니다.', '자유': '후세는 그를 전례에 얽매이지 않은 군주로 기억했습니다.' }[cat];
      if (leg) parts.push(leg);
      if (g.state.flags.buddhist) parts.push('불교를 후원해 절과 승려가 늘었습니다.');
      if (g.state.flags.noble_grudge) parts.push('귀족들의 원한은 끝내 풀리지 않았습니다.');
      if (cfg.endNote && cfg.endNote[kind]) parts.push(sb.L(cfg.endNote[kind]));
      return {
        era: s.year + '년 · 재위의 끝', title: T_[0], seal: T_[1], body: ['<div class="quote">' + T_[2] + '</div>'],
        mine: parts.map(function (p) { return '<p>' + p + '</p>'; }).join(''), real: '<p>' + (cfg.real || '') + '</p>'
      };
    }
  };
})();
