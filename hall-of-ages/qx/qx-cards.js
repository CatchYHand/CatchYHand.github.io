/* 群星议会 — 160 张游戏牌（标准 104 + EX 4 + 军争 52）
 * 内部 id 用英文；显示名 zh / en 见 CARD_TEXT。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./qx-engine.js'), require('./qx-carddata.js'));
  else root.QXCards = factory(root.QXEngine, root.QXCardData);
})(typeof self !== 'undefined' ? self : this, function (E, DATA) {
  'use strict';
  const { CARD_DEFS, Game, virtualCard, family } = E;

  // ───────── 显示名 ─────────
  const CARD_TEXT = {
    strike: ['杀', 'Strike'], fire_strike: ['火杀', 'Fire Strike'], thunder_strike: ['雷杀', 'Thunder Strike'],
    parry: ['闪', 'Parry'], remedy: ['药', 'Remedy'], grog: ['酒', 'Grog'],
    duel: ['决斗', 'Duel'], sabotage: ['釜底抽薪', 'Sabotage'], pilfer: ['探囊取物', 'Pilfer'],
    windfall: ['天赐良机', 'Windfall'], catspaw: ['驱虎吞狼', "Cat's Paw"], invasion: ['铁蹄压境', 'Invasion'],
    arrowstorm: ['万箭齐发', 'Arrowstorm'], respite: ['休养生息', 'Respite'], feast: ['联军盛宴', 'Feast'],
    veto: ['无懈可击', 'Veto'], greekfire: ['火攻', 'Greek Fire'], chainshot: ['铁索连环', 'Chain Shot'],
    damocles: ['悬顶之剑', 'Damocles'], lotus: ['流连忘返', 'Lotus Eaters'], blockade: ['粮尽援绝', 'Blockade'],
    gatling: ['加特林', 'Gatling'], excalibur: ['断钢圣剑', 'Excalibur'], gemini: ['双子剑', 'Gemini'],
    winter: ['冬将军', 'General Winter'], misericorde: ['慈悲短剑', 'Misericorde'], berserker: ['狂战士斧', 'Berserker'],
    sarissa: ['萨里沙长矛', 'Sarissa'], ram: ['攻城锤', 'Battering Ram'], trident: ['三叉戟', 'Trident'],
    arquebus: ['火绳枪', 'Arquebus'], longbow: ['英格兰长弓', 'Longbow'],
    aegis: ['雅典娜之盾', 'Aegis'], testudo: ['龟甲阵', 'Testudo'], linothorax: ['亚麻胸甲', 'Linothorax'], nemean: ['涅墨亚狮皮', 'Nemean Lion'],
    bucephalus: ['布塞弗勒斯', 'Bucephalus'], babieca: ['巴别卡', 'Babieca'], marengo: ['马伦戈', 'Marengo'], copenhagen: ['哥本哈根', 'Copenhagen'],
    pegasus: ['珀伽索斯', 'Pegasus'], sleipnir: ['斯雷普尼尔', 'Sleipnir'], arion: ['阿里翁', 'Arion'],
  };

  const isStrike = c => family(c) === 'strike';
  const other = (g, p, t) => t !== p;
  const noDist = (g, p, t, card) => g.q('ignoreDistance', false, p, t, card);

  // ───────── 基本牌 ─────────
  const strikeDef = (nature) => ({
    type: 'basic', family: 'strike', nature,
    canUse: (g, p, card, o) => !o.phase || (p.phaseState.strikes || 0) < g.strikeLimit(p),
    targets: {
      min: 1, max: 1,
      filter: (g, p, t, sel, card, o) => t !== p && ((o && o.ignoreDistance) || noDist(g, p, t, card) || g.inAttackRange(p, t)),
    },
    *effect(g, use, t) {
      const need = use.data.parryNeed && use.data.parryNeed.has(t) ? use.data.parryNeed.get(t) : 1;
      let parried = false;
      if (!use.noResponse.has(t) && need > 0) {
        let got = 0;
        for (let i = 0; i < need; i++) {
          const r = yield* g.askRespond(t, { pattern: ['parry'], mode: 'use', reason: 'strike', use, source: use.from.seat, need, got });
          if (t.dead) return;
          if (!r) break; got++;
        }
        parried = got >= need;
      }
      if (parried) {
        g.log('parried', { seat: t.seat, by: use.from.seat });
        const pd = { use, target: t, hit: false };
        yield* g.trigger('strikeParried', pd);
        if (!pd.hit) return;
      }
      const nat = (CARD_DEFS[use.card.name] && CARD_DEFS[use.card.name].nature) || 'normal';
      yield* g.damage({ from: use.from, to: t, amount: 1 + use.extraDamage, nature: nat, card: use.card, use });
    },
  });
  CARD_DEFS.strike = strikeDef('normal');
  CARD_DEFS.fire_strike = strikeDef('fire');
  CARD_DEFS.thunder_strike = strikeDef('thunder');
  CARD_DEFS.parry = { type: 'basic', noActiveUse: true };
  CARD_DEFS.remedy = {
    type: 'basic', targets: 'self',
    canUse: (g, p) => p.wounded,
    *effect(g, use, t) { yield* g.recover(t, 1, use.from, use.card); },
  };
  CARD_DEFS.grog = {
    type: 'basic', targets: 'self',
    canUse: (g, p, card, o) => !!o.phase && (p.turnState.grogs || 0) < g.q('grogLimit', 1, p),
    *effect(g, use, t) {
      if (use.opts.save) yield* g.recover(t, 1, use.from, use.card);
      else { use.from.turnState.drunk = true; g.log('drunk', { seat: use.from.seat }); }
    },
  };

  // ───────── 谋略牌（非延时锦囊）─────────
  const hasCards = (t, z) => (z.includes('h') && t.hand.length) || (z.includes('e') && t.equipList.length) || (z.includes('j') && t.judgeZone.length);

  CARD_DEFS.veto = { type: 'stratagem', noActiveUse: true };
  CARD_DEFS.windfall = { type: 'stratagem', targets: 'self', *effect(g, use, t) { yield* g.draw(t, 2, 'windfall'); } };
  CARD_DEFS.duel = {
    type: 'stratagem', targets: { min: 1, max: 1, filter: other },
    *effect(g, use, t) {
      let cur = t, opp = use.from;
      for (let guard = 0; guard < 200; guard++) {
        if (cur.dead || opp.dead) return;
        const need = use.data.duelNeed ? use.data.duelNeed(cur) : 1;
        let ok = true;
        for (let i = 0; i < need; i++) {
          const r = yield* g.askRespond(cur, { pattern: ['strike'], mode: 'play', reason: 'duel', use, source: opp.seat });
          if (!r || cur.dead) { ok = false; break; }
        }
        if (cur.dead) return;
        if (!ok) { yield* g.damage({ from: opp.dead ? null : opp, to: cur, amount: 1, card: use.card, use }); return; }
        [cur, opp] = [opp, cur];
      }
    },
  };
  CARD_DEFS.sabotage = {
    type: 'stratagem', targets: { min: 1, max: 1, filter: (g, p, t) => t !== p && hasCards(t, 'hej') },
    *effect(g, use, t) {
      const c = yield* g.chooseCardOf(use.from, t, 'hej', 'sabotage');
      if (c) { g.log('discardOf', { by: use.from.seat, seat: t.seat, card: c.id }); yield* g.moveCards({ cards: [c], to: 'discard', by: use.from.seat, reason: 'sabotage' }); yield* g.trigger('discarded', { player: t, cards: [c], by: use.from, reason: 'sabotage' }); }
    },
  };
  CARD_DEFS.pilfer = {
    type: 'stratagem',
    targets: { min: 1, max: 1, filter: (g, p, t, s, card) => t !== p && hasCards(t, 'hej') && (g.distance(p, t) <= 1 || noDist(g, p, t, card)) },
    *effect(g, use, t) { const c = yield* g.chooseCardOf(use.from, t, 'hej', 'pilfer'); if (c) yield* g.gainCards(use.from, [c], 'pilfer', t); },
  };
  // 驱虎吞狼（新效果）：令其视为对其攻击范围内你指定的另一名角色使用杀；此杀未造成伤害，则其视为对你使用杀
  CARD_DEFS.catspaw = {
    type: 'stratagem',
    targets: {
      min: 2, max: 2, extendable: false,
      filter: (g, p, t, sel) => sel.length === 0
        ? (t !== p && g.alive.some(v => v !== t && v !== p && g.inAttackRange(t, v)))
        : (t !== p && g.inAttackRange(sel[0], t)),
    },
    prepare(g, use) { if (use.targets.length === 2) { use.data.victim = use.targets[1]; use.targets = [use.targets[0]]; } },
    *effect(g, use, t) {
      const v = use.data.victim;
      if (!v || v.dead || t.dead) return;
      let dealt = false;
      const s1 = virtualCard('strike', [], { viaCard: 'catspaw' });
      if (g.targetAllowed(t, v, s1)) { const u = yield* g.useCard(t, s1, [v], { noCount: true, ignoreDistance: true }); dealt = !!u.data.dealt; }
      const from = use.from;
      if (!dealt && !t.dead && !from.dead) {
        const s2 = virtualCard('strike', [], { viaCard: 'catspaw' });
        if (g.targetAllowed(t, from, s2)) yield* g.useCard(t, s2, [from], { noCount: true, ignoreDistance: true });
      }
    },
  };
  const aoe = (pattern, mode) => ({
    type: 'stratagem', targets: 'others', needTargets: true,
    *effect(g, use, t) {
      const r = yield* g.askRespond(t, { pattern: [pattern], mode, reason: use.card.name, use, source: use.from.seat });
      if (!r && !t.dead) yield* g.damage({ from: use.from.dead ? null : use.from, to: t, amount: 1, card: use.card, use });
    },
  });
  CARD_DEFS.invasion = aoe('strike', 'play');
  CARD_DEFS.arrowstorm = aoe('parry', 'play');
  CARD_DEFS.respite = {
    type: 'stratagem', targets: 'all',
    canUse: (g) => g.alive.some(p => p.wounded),
    skipTarget: (g, use, t) => !t.wounded,
    *effect(g, use, t) { yield* g.recover(t, 1, use.from, use.card); },
  };
  CARD_DEFS.feast = {
    type: 'stratagem', targets: 'all',
    *before(g, use) { use.data.pool = g.takeTop(use.targets.length); g.log('reveal', { cards: use.data.pool.map(c => c.id), reason: 'feast' }); },
    *effect(g, use, t) {
      const pool = use.data.pool.filter(c => c.loc && c.loc.zone === 'process'); if (!pool.length) return;
      const a = yield* g.ask(t, { kind: 'pick', options: pool.map(c => c.id), reason: 'feast' });
      const c = pool.find(x => x.id === a) || pool[0];
      yield* g.gainCards(t, [c], 'feast');
    },
    *after(g, use) { yield* g.clearProcessing(use.data.pool || []); },
  };
  CARD_DEFS.greekfire = {
    type: 'stratagem', targets: { min: 1, max: 1, filter: (g, p, t) => t.hand.length > 0 },
    *effect(g, use, t) {
      if (!t.hand.length) return;
      const [shown] = yield* g.chooseOwnCards(t, 1, 1, 'h', 'greekfireShow');
      g.log('show', { seat: t.seat, card: shown.id });
      const from = use.from; if (from.dead) return;
      const d = yield* g.askDiscard(from, 0, 1, 'h', 'greekfire', c => c.suit === shown.suit, { shown: shown.id });
      if (d.length) yield* g.damage({ from, to: t, amount: 1, nature: 'fire', card: use.card, use });
    },
  };
  CARD_DEFS.chainshot = {
    type: 'stratagem', recastable: true, targets: { min: 1, max: 2, filter: () => true },
    *effect(g, use, t) { t.chained = !t.chained; g.log('chain', { seat: t.seat, on: t.chained }); },
  };

  // ───────── 天兆牌（延时锦囊）─────────
  const noSame = (name) => (t) => !t.judgeZone.some(c => (c.omenAs || c.name) === name);
  function* passDamocles(g, p, c) {
    let q = p;
    for (let i = 0; i < g.n; i++) {
      q = g.nextAlive(q); if (!q || q === p) break;
      if (noSame('damocles')(q) && g.targetAllowed(p, q, c)) {
        c.omenAs = 'damocles';
        yield* g.moveCards({ cards: [c], to: 'judge', toPlayer: q, reason: 'damoclesMove' });
        g.log('damoclesMove', { from: p.seat, to: q.seat }); return;
      }
    }
    // 无人可传：留在原处
    c.omenAs = 'damocles';
    yield* g.moveCards({ cards: [c], to: 'judge', toPlayer: p, reason: 'damoclesStay' });
  }
  CARD_DEFS.lotus = {
    type: 'omen', targets: { min: 1, max: 1, filter: (g, p, t) => t !== p && noSame('lotus')(t) },
    *judgeEffect(g, p) { yield* g.judge(p, 'lotus', function* (c) { if (c.suit !== 'heart') { g.skipPhase(p, 'play'); g.log('omenHit', { seat: p.seat, card: 'lotus' }); } }); },
  };
  CARD_DEFS.blockade = {
    type: 'omen', targets: { min: 1, max: 1, filter: (g, p, t, s, card) => t !== p && noSame('blockade')(t) && (g.distance(p, t) <= 1 || noDist(g, p, t, card)) },
    *judgeEffect(g, p) { yield* g.judge(p, 'blockade', function* (c) { if (c.suit !== 'club') { g.skipPhase(p, 'draw'); g.log('omenHit', { seat: p.seat, card: 'blockade' }); } }); },
  };
  CARD_DEFS.damocles = {
    type: 'omen', targets: 'self',
    canUse: (g, p) => noSame('damocles')(p),
    *judgeEffect(g, p, omen) {
      let hit = false;
      yield* g.judge(p, 'damocles', function* (c) {
        if (c.suit === 'spade' && c.rank >= 2 && c.rank <= 9) {
          hit = true; g.log('omenHit', { seat: p.seat, card: 'damocles' });
          yield* g.damage({ from: null, to: p, amount: 3, nature: 'thunder', card: omen });
        }
      });
      if (!hit && omen.loc && omen.loc.zone === 'process') yield* passDamocles(g, p, omen);
    },
    *onVetoed(g, p, omen) { yield* passDamocles(g, p, omen); },
  };
  // 天兆牌的 omen 自身"使用"时，目标是 self 的情况由 autoTargets 处理

  // ───────── 军备牌 ─────────
  const eq = (sub, extra) => Object.assign({ type: 'equip', sub, targets: 'self' }, extra);
  const strikeBy = (owner, use) => use && use.from === owner && isStrike(use.card);
  const weapon = (range, skill) => eq('weapon', { range, skill });

  CARD_DEFS.gatling = weapon(1, { locked: true, mods: { strikeLimit: (g, o, v, p) => p === o ? Infinity : v } });
  CARD_DEFS.excalibur = weapon(2, { locked: true, triggers: { targetConfirmed: {
    can: (g, o, d) => strikeBy(o, d.use),
    *on(g, o, d) { d.use.data.ignoreArmor = d.use.data.ignoreArmor || new Set(); d.use.targets.forEach(t => d.use.data.ignoreArmor.add(t)); },
  } } });
  CARD_DEFS.gemini = weapon(2, { triggers: { targetConfirmed: {
    can: (g, o, d) => strikeBy(o, d.use) && d.use.targets.some(t => t.gender !== o.gender),
    *on(g, o, d) {
      for (const t of d.use.targets) {
        if (t.gender === o.gender || t.dead || o.dead) continue;
        const i = t.hand.length ? yield* g.chooseOption(t, ['discardHand', 'letDraw'], 'gemini') : 1;
        if (i === 0) yield* g.askDiscard(t, 1, 1, 'h', 'gemini'); else yield* g.draw(o, 1, 'gemini');
      }
    },
  } } });
  CARD_DEFS.winter = weapon(2, { triggers: { damageCausing: {
    can: (g, o, d) => strikeBy(o, d.use) && d.card === d.use.card && d.to.cardCount > 0 && d.to !== o,
    *on(g, o, d) {
      d.prevented = true;
      const cs = yield* g.chooseCardsOf(o, d.to, 'he', 2, 'winter');
      if (cs.length) { yield* g.moveCards({ cards: cs, to: 'discard', by: o.seat, reason: 'winter' }); for (const c of cs) g.log('discardOf', { by: o.seat, seat: d.to.seat, card: c.id }); yield* g.trigger('discarded', { player: d.to, cards: cs, by: o, reason: 'winter' }); }
    },
  } } });
  CARD_DEFS.misericorde = weapon(2, { locked: true, triggers: { damageCausing: {
    can: (g, o, d) => strikeBy(o, d.use) && d.card === d.use.card && d.to.hand.length === 0,
    *on(g, o, d) { d.amount += 1; },
  } } });
  CARD_DEFS.berserker = weapon(3, { triggers: { strikeParried: {
    optional: false,
    can: (g, o, d) => strikeBy(o, d.use) && !d.target.dead && g.canProduce(o, ['strike'], {}),
    *on(g, o, d) { yield* g.askUseStrike(o, [d.target], 'berserker', { ignoreDistance: true }); },
  } } });
  CARD_DEFS.sarissa = weapon(3, { viewAs: { patterns: ['strike'], as: 'strike', count: 2, zones: 'h', can: (g, p) => p.hand.length >= 2 } });
  CARD_DEFS.ram = weapon(3, { triggers: { strikeParried: {
    can: (g, o, d) => strikeBy(o, d.use) && !d.target.dead && g.cardsIn(o, 'he').filter(c => c.name !== 'ram').length >= 2,
    *on(g, o, d) { const cs = yield* g.askDiscard(o, 2, 2, 'he', 'ram', c => c.name !== 'ram'); if (cs.length === 2) d.hit = true; },
  } } });
  CARD_DEFS.trident = weapon(4, { mods: { maxTargets: (g, o, v, p, card) => {
    if (p !== o || !isStrike(card)) return v;
    const subs = card.subcards || [card];
    return (p.hand.length > 0 && p.hand.every(c => subs.includes(c))) ? v + 2 : v;
  } } });
  CARD_DEFS.arquebus = weapon(4, { triggers: { cardUsing: {
    can: (g, o, d) => d.use.from === o && d.use.card.name === 'strike',
    *on(g, o, d) { const old = d.use.card; d.use.card = virtualCard('fire_strike', old.subcards.filter(c => !c.virtual), { suit: old.suit, rank: old.rank, viaSkill: 'arquebus' }); },
  } } });
  CARD_DEFS.longbow = weapon(5, { triggers: { damageCausing: {
    can: (g, o, d) => strikeBy(o, d.use) && d.card === d.use.card && [d.to.equips.plus, d.to.equips.minus].some(c => c && !g.q('protectCard', false, c, o, d.to)),
    *on(g, o, d) {
      const ms = [d.to.equips.plus, d.to.equips.minus].filter(c => c && !g.q('protectCard', false, c, o, d.to)); if (!ms.length) return;
      const i = yield* g.chooseOption(o, ms.map(c => c.name), 'longbow');
      yield* g.moveCards({ cards: [ms[i] || ms[0]], to: 'discard', by: o.seat, reason: 'longbow' });
    },
  } } });

  const armorOn = (g, o, use) => !!g.armorOf(o, use);
  CARD_DEFS.aegis = eq('armor', { skill: { triggers: { askResponse: {
    can: (g, o, d) => d.player === o && d.req.pattern.includes('parry') && armorOn(g, o, d.req.use) && !d.result,
    *on(g, o, d) {
      const c = yield* g.judge(o, 'aegis');
      if (c.color === 'red') d.result = virtualCard('parry', [], { viaSkill: 'aegis' });
    },
  } } } });
  CARD_DEFS.testudo = eq('armor', { skill: { locked: true, triggers: { effectBefore: {
    can: (g, o, d) => d.target === o && isStrike(d.use.card) && d.use.card.color === 'black' && armorOn(g, o, d.use),
    *on(g, o, d) { d.cancel = true; },
  } } } });
  CARD_DEFS.linothorax = eq('armor', { skill: { locked: true, triggers: {
    effectBefore: {
      can: (g, o, d) => d.target === o && armorOn(g, o, d.use) && (d.use.card.name === 'strike' || d.use.card.name === 'invasion' || d.use.card.name === 'arrowstorm'),
      *on(g, o, d) { d.cancel = true; },
    },
    damageTaking: {
      can: (g, o, d) => d.to === o && d.nature === 'fire' && armorOn(g, o, d.use),
      *on(g, o, d) { d.amount += 1; },
    },
  } } });
  CARD_DEFS.nemean = eq('armor', {
    skill: { locked: true, triggers: { damageTaking: {
      can: (g, o, d) => d.to === o && d.amount > 1 && armorOn(g, o, d.use),
      *on(g, o, d) { d.amount = 1; },
    } } },
    *onUnequip(g, owner) { yield* g.recover(owner, 1, null); },
  });

  const plus = () => eq('plus', { skill: { locked: true, mods: { distance: (g, o, v, a, b) => b === o ? v + 1 : v } } });
  const minus = () => eq('minus', { skill: { locked: true, mods: { distance: (g, o, v, a, b) => a === o ? v - 1 : v } } });
  for (const n of ['bucephalus', 'babieca', 'marengo', 'copenhagen']) CARD_DEFS[n] = plus();
  for (const n of ['pegasus', 'sleipnir', 'arion']) CARD_DEFS[n] = minus();

  // cards.json 为准：名字、攻击范围、坐骑 ±1
  const BY_KEY = {};
  for (const c of DATA || []) {
    BY_KEY[c.key] = c;
    CARD_TEXT[c.key] = [c.zh, c.en.replace(/\u2019/g, "'")];
    const d = CARD_DEFS[c.key]; if (!d) continue;
    if (c.range != null) d.range = c.range;
    if (c.distance != null && d.sub !== (c.distance > 0 ? 'plus' : 'minus')) throw new Error('mount mismatch ' + c.key);
  }
  for (const [k, [zh, en]] of Object.entries(CARD_TEXT)) if (CARD_DEFS[k]) { CARD_DEFS[k].zh = zh; CARD_DEFS[k].en = en; }

  // ───────── 牌堆（160）─────────
  const S = 'spade', H = 'heart', C = 'club', D = 'diamond';
  const DECK = [];
  const add = (suit, rank, ...names) => names.forEach(n => DECK.push([n, suit, rank]));
  // 标准 104
  add(S, 1, 'damocles', 'duel'); add(S, 2, 'gemini', 'aegis'); add(S, 3, 'sabotage', 'pilfer'); add(S, 4, 'sabotage', 'pilfer');
  add(S, 5, 'berserker', 'bucephalus'); add(S, 6, 'excalibur', 'lotus'); add(S, 7, 'strike', 'invasion');
  add(S, 8, 'strike', 'strike'); add(S, 9, 'strike', 'strike'); add(S, 10, 'strike', 'strike');
  add(S, 11, 'pilfer', 'veto'); add(S, 12, 'sarissa', 'sabotage'); add(S, 13, 'sleipnir', 'invasion');
  add(H, 1, 'respite', 'arrowstorm'); add(H, 2, 'parry', 'parry'); add(H, 3, 'remedy', 'feast'); add(H, 4, 'remedy', 'feast');
  add(H, 5, 'longbow', 'pegasus'); add(H, 6, 'remedy', 'lotus'); add(H, 7, 'remedy', 'windfall'); add(H, 8, 'remedy', 'windfall');
  add(H, 9, 'remedy', 'windfall'); add(H, 10, 'strike', 'strike'); add(H, 11, 'strike', 'windfall'); add(H, 12, 'remedy', 'sabotage');
  add(H, 13, 'parry', 'marengo');
  add(C, 1, 'duel', 'gatling'); add(C, 2, 'strike', 'aegis'); add(C, 3, 'strike', 'sabotage'); add(C, 4, 'strike', 'sabotage');
  add(C, 5, 'strike', 'babieca'); add(C, 6, 'strike', 'lotus'); add(C, 7, 'strike', 'invasion'); add(C, 8, 'strike', 'strike');
  add(C, 9, 'strike', 'strike'); add(C, 10, 'strike', 'strike'); add(C, 11, 'strike', 'strike'); add(C, 12, 'catspaw', 'veto');
  add(C, 13, 'catspaw', 'veto');
  add(D, 1, 'duel', 'gatling'); add(D, 2, 'parry', 'parry'); add(D, 3, 'parry', 'pilfer'); add(D, 4, 'parry', 'pilfer');
  add(D, 5, 'parry', 'ram'); for (let r = 6; r <= 10; r++) add(D, r, 'parry', 'strike'); add(D, 11, 'parry', 'parry');
  add(D, 12, 'remedy', 'trident'); add(D, 13, 'strike', 'arion');
  // EX 4
  add(S, 2, 'winter'); add(C, 2, 'testudo'); add(H, 12, 'damocles'); add(D, 12, 'veto');
  // 军争 52
  add(S, 1, 'misericorde'); add(S, 2, 'linothorax'); add(S, 3, 'grog'); for (let r = 4; r <= 8; r++) add(S, r, 'thunder_strike');
  add(S, 9, 'grog'); add(S, 10, 'blockade'); add(S, 11, 'chainshot'); add(S, 12, 'chainshot'); add(S, 13, 'veto');
  add(H, 1, 'veto'); add(H, 2, 'greekfire'); add(H, 3, 'greekfire'); add(H, 4, 'fire_strike'); add(H, 5, 'remedy'); add(H, 6, 'remedy');
  add(H, 7, 'fire_strike'); add(H, 8, 'parry'); add(H, 9, 'parry'); add(H, 10, 'fire_strike'); add(H, 11, 'parry'); add(H, 12, 'parry'); add(H, 13, 'veto');
  add(C, 1, 'nemean'); add(C, 2, 'linothorax'); add(C, 3, 'grog'); add(C, 4, 'blockade'); for (let r = 5; r <= 8; r++) add(C, r, 'thunder_strike');
  add(C, 9, 'grog'); for (let r = 10; r <= 13; r++) add(C, r, 'chainshot');
  add(D, 1, 'arquebus'); add(D, 2, 'remedy'); add(D, 3, 'remedy'); add(D, 4, 'fire_strike'); add(D, 5, 'fire_strike');
  add(D, 6, 'parry'); add(D, 7, 'parry'); add(D, 8, 'parry'); add(D, 9, 'grog'); add(D, 10, 'parry'); add(D, 11, 'parry');
  add(D, 12, 'greekfire'); add(D, 13, 'copenhagen');

  Game.defaultDeck = () => DECK.slice();
  // 美术资源 key：火杀、雷杀暂用杀的图
  const artKey = (name) => (name === 'fire_strike' || name === 'thunder_strike') ? 'strike' : name;
  return { CARD_TEXT, DECK, BY_KEY, artKey, DATA: DATA || [] };
});
