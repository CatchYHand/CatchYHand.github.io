/* 群星议会 — 武将与技能
 * 每名武将一段：资料 + 技能（时机、条件、效果、AI 判断、中英文字）。改一个只动一段。
 * 标注的地方是技能文字有歧义、按三国杀惯例先做的理解，等用户确认。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./qx-engine.js'), require('./qx-cards.js'));
  else root.QXHeroes = factory(root.QXEngine, root.QXCards);
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';
  const S = E.SKILLS, H = E.HEROES, V = E.virtualCard;
  const isStrike = c => !!c && E.family(c) === 'strike';
  const strikeBy = (o, use) => !!use && use.from === o && isStrike(use.card);
  const lost = p => p.maxHp - p.hp;
  const others = (g, p) => g.seatOrderFrom(g.nextAlive(p) || p).filter(q => q !== p);
  const uniqueMax = (g, p) => g.alive.every(q => q === p || q.hand.length < p.hand.length);

  const FACTIONS = {
    classical: { name: ['古典', 'Classical'], color: '#B8732E' },
    medieval: { name: ['中古', 'Medieval'], color: '#3E5A78' },
    renaissance: { name: ['文艺', 'Renaissance'], color: '#2E7D6A' },
    revolution: { name: ['革新', 'Revolution'], color: '#8E1F2C' },
  };
  // 技能选项等界面文字
  const OPTION_TEXT = {
    gordianNoParry: ['此杀不可被闪响应', 'Cannot Be Parried'], gordianPlus: ['此杀伤害 +1', '+1 Damage'],
    defianceDiscard: ['弃置 {n} 张牌', 'Discard {n} Cards'], defianceEnd: ['结束出牌阶段', 'End Play Phase'],
    vengeanceDiscard: ['弃置 {n} 张手牌', 'Discard {n} Cards'], vengeanceDamage: ['受到 1~2 点伤害', 'Take 1–2 Damage'],
    lecture1: ['讲学·各交一张', 'Lecture: Gather'], lecture2: ['讲学·交换手牌', 'Lecture: Swap'],
  };
  const PROMPT_TEXT = {
    mirrorRetouch: ['镜火：可以打出一张手牌代替{t}的天意牌（当前 {c}）。', "Mirror: you may play a card to replace {t}'s Fate card (now {c})."],
    lectureGive: ['讲学：请交给{t}一张手牌。', 'Lecture: give {t} a card from your hand.'],
    proofGive: ['推演：选择一张牌交给{t}。', 'Proof: choose a card to give to {t}.'],
    defianceDiscard: ['拒降：请弃置 {n} 张牌。', 'Defiance: discard {n} cards.'],
    vengeanceDiscard: ['血誓：请弃置 {n} 张手牌。', 'Vengeance: discard {n} cards from your hand.'],
    unchainGive: ['挣锁：将 {c} 交给一名角色（可以是自己）。', 'Unchain: give {c} to a character (yourself included).'],
    rally: ['号令：是否替{t}打出一张【杀】？', 'Rally: play a Strike on behalf of {t}?'],
    narrows: ['隘口：可以立即对{t}使用一张【杀】。', 'Narrows: you may immediately use a Strike on {t}.'],
    defianceOpt: ['拒降：你的杀造成了伤害，选择一项：', 'Defiance: your Strike dealt damage. Choose one:'],
    vengeanceOpt: ['血誓：选择一项：', 'Vengeance: choose one:'],
    gordianOpt: ['断结：选择一项：', 'Gordian: choose one:'],
  };

  // ═════════════ 古典 Classical ═════════════

  // ── 亚历山大 ──
  H.alexander = { faction: 'classical', hp: 4, gender: 'male', skills: ['campaign', 'gordian'], name: ['亚历山大', 'Alexander'], title: ['不败之王', 'The Great'], rating: 8 };
  S.campaign = {
    name: ['远征', 'CAMPAIGN'], type: 'locked', locked: true,
    desc: ['锁定技，当你对其他角色造成伤害后，你令你与其的距离 −1。', 'Compulsory skill. After you deal damage to another character, your distance to them is reduced by 1 for the rest of the game.'],
    triggers: { damageDone: { silent: true, can: (g, o, d) => d.from === o && d.to !== o, *on(g, o, d) { const m = o.marks.campaign = o.marks.campaign || {}; m[d.to.seat] = (m[d.to.seat] || 0) + 1; g.log('skill', { seat: o.seat, skill: 'campaign' }); } } },
    mods: { distance: (g, o, v, a, b) => (a === o && o.marks.campaign) ? v - (o.marks.campaign[b.seat] || 0) : v },
  };
  S.gordian = {
    name: ['断结', 'GORDIAN'], type: 'normal',
    desc: ['当你使用杀指定目标后，你可以选择一项：1. 此杀不可被闪响应；2. 此杀的伤害 +1。若你与所有其他角色的距离均为 1，则改为依次执行两项。', 'After your Strike targets, you may choose one: it cannot be answered with a Parry; or it deals +1 damage. If you are at distance 1 from every other character, do both.'],
    triggers: { targetConfirmed: {
      can: (g, o, d) => strikeBy(o, d.use) && d.use.targets.length > 0,
      *on(g, o, d) {
        const all = g.alive.every(p => p === o || g.distance(o, p) === 1);
        const pick = all ? 2 : yield* g.chooseOption(o, ['gordianNoParry', 'gordianPlus'], 'gordian', { skill: 'gordian' });
        if (pick === 0 || pick === 2) d.use.targets.forEach(t => d.use.noResponse.add(t));
        if (pick === 1 || pick === 2) d.use.extraDamage += 1;
      },
    } },
    ai: { option: (g, me, req, A) => { const u = A.lastUse(g); const ts = (u ? u.targets : []).map(s => g.p(s)); return ts.some(t => t.hand.length > 0 || (t.equips.armor && t.equips.armor.name === 'aegis')) ? 0 : 1; } },
  };

  // ── 凯撒 ──
  H.caesar = { faction: 'classical', hp: 4, gender: 'male', skills: ['rubicon', 'vici'], name: ['凯撒', 'Caesar'], title: ['独裁官', 'The Dictator'], rating: 6 };
  S.rubicon = {
    name: ['渡河', 'RUBICON'], type: 'limited',
    desc: ['限定技，当你使用杀造成伤害后，若你的手牌数大于体力上限，你可以将体力上限调整至与你的手牌数相同，然后回复体力至体力上限。', 'Limited skill. After your Strike deals damage, if you have more cards in hand than your max health, you may set your max health equal to your hand size, then recover to full health.'],
    triggers: { damageDone: {
      can: (g, o, d) => d.from === o && isStrike(d.card) && !o.skillState.rubicon && o.hand.length > o.maxHp && !o.dead,
      *on(g, o) { o.skillState.rubicon = true; yield* g.changeMaxHp(o, o.hand.length - o.maxHp); yield* g.recover(o, o.maxHp - o.hp, o); },
    } },
  };
  S.vici = {
    name: ['三捷', 'VICI'], type: 'normal',
    desc: ['出牌阶段限一次，你可以减 1 点体力上限并摸一张牌，然后视为使用杀。当你以此法造成伤害时，你令该技能视为未发动过。', 'Once per Play phase, you may lose 1 max health and draw 1, then you are treated as using a Strike. If that Strike deals damage, this skill may be used again.'],
    active: {
      cards: { min: 0, max: 0 },
      targets: { min: 1, max: (g, p) => g.maxTargets(p, V('strike', [])), filter: (g, p, t, sel) => g.targetCandidates(p, V('strike', []), sel).includes(t) },
      can: (g, p) => !p.phaseState.vici && p.maxHp > 1 && g.targetCandidates(p, V('strike', []), []).length > 0,
      valid: (g, p, cards, targets) => !cards.length && g.canUseCard(p, V('strike', []), targets, {}),
      *use(g, p, cards, targets) {
        p.phaseState.vici = true;
        yield* g.changeMaxHp(p, -1); if (p.dead) return;
        yield* g.draw(p, 1, 'vici');
        const live = targets.filter(t => !t.dead); if (!live.length) return;
        // 视为使用的杀不计入出牌阶段的杀次数
        const u = yield* g.useCard(p, V('strike', [], { viaSkill: 'vici' }), live, { noCount: true });
        if (u.data.dealt) p.phaseState.vici = false;
      },
    },
    ai: { play(g, me, inst, A) {
      if (me.phaseState.vici || me.maxHp <= 2) return [];
      const vc = V('strike', []); let bt = null, bv = 0;
      for (const t of g.targetCandidates(me, vc, [])) { const v = A.strikeValue(g, me, t, vc, 0); if (v > bv) { bv = v; bt = t; } }
      if (!bt) return [];
      const cost = me.hp === me.maxHp ? 2.2 : 0.4;
      return [{ score: bv + 0.8 - cost, ans: { action: 'skill', skill: inst.key, targets: [bt.seat] } }];
    } },
  };

  // ── 汉尼拔 ──
  H.hannibal = { faction: 'classical', hp: 4, gender: 'male', skills: ['alps', 'cannae'], name: ['汉尼拔', 'Hannibal'], title: ['战略之父', 'The Strategist'], rating: 7 };
  S.alps = {
    name: ['越山', 'ALPS'], type: 'locked', locked: true,
    desc: ['锁定技，你使用的决斗和点数为奇数的杀对其他角色造成的伤害为 2 点。', 'Compulsory skill. Your Duels and odd-ranked Strikes deal 2 damage to other characters.'],
    triggers: { damageCausing: {
      // "伤害为 2 点"理解为基础伤害变为 2，酒等加成照常叠加
      can: (g, o, d) => d.from === o && d.to !== o && d.use && d.use.from === o && (d.use.card.name === 'duel' || (isStrike(d.use.card) && d.use.card.rank % 2 === 1)),
      *on(g, o, d) { d.amount += 1; },
    } },
  };
  function adjacent(g, sel, user) {
    const order = g.seatOrderFrom(g.players[0]); const n = order.length;
    for (let st = 0; st < n; st++) {
      const arc = []; for (let k = 0; k < sel.length; k++) arc.push(order[(st + k) % n]);
      if (!arc.includes(user) && sel.every(t => arc.includes(t))) return true;
    }
    return false;
  }
  S.cannae = {
    name: ['坎尼', 'CANNAE'], type: 'locked', locked: true,
    desc: ['锁定技，你使用杀可以指定至多三名相邻的角色为目标。', 'Compulsory skill. Your Strikes may target up to three adjacent characters.'],
    mods: {
      maxTargets: (g, o, v, p, card) => (p === o && isStrike(card)) ? v + 2 : v,
      // 多个目标须座次相连（中间不能隔着你自己），且各自都在攻击范围内
      targetsValid: (g, o, v, p, card, sel) => (!v || p !== o || !isStrike(card) || sel.length <= 1) ? v : adjacent(g, sel, o),
    },
  };

  // ── 西庇阿 ──
  H.scipio = { faction: 'classical', hp: 4, gender: 'male', skills: ['divert', 'zama'], name: ['西庇阿', 'Scipio'], title: ['扎马胜者', 'The Victor'], rating: 6 };
  S.divert = {
    name: ['移师', 'DIVERT'], type: 'normal',
    desc: ['当你受到杀造成的伤害后，你可以视为对伤害来源使用一张无距离限制的杀。若此杀造成了伤害，你回复 1 点体力。', 'After you take damage from a Strike, you may be treated as using a Strike with no distance limit on the source. If it deals damage, recover 1 health.'],
    triggers: { damaged: {
      can: (g, o, d) => d.to === o && !o.dead && d.from && !d.from.dead && d.from !== o && isStrike(d.card),
      *on(g, o, d) {
        const vc = V('strike', [], { viaSkill: 'divert' }); if (!g.targetAllowed(o, d.from, vc)) return;
        const u = yield* g.useCard(o, vc, [d.from], { noCount: true, ignoreDistance: true });
        if (u.data.dealt && !o.dead) yield* g.recover(o, 1, o);
      },
    } },
    ai: { confirm: (g, me, req, A) => A.threat(g, me, g.p(req.data.from)) > -0.5 },
  };
  S.zama = {
    name: ['扎马', 'ZAMA'], type: 'locked', locked: true,
    desc: ['锁定技，当你成为杀或谋略牌的目标时，若此牌指定了不止一个目标，则其对你无效，然后你摸一张牌。', 'Compulsory skill. When you become a target of a Strike or Stratagem that has more than one target, it has no effect on you and you draw 1.'],
    triggers: { targeted: {
      can: (g, o, d) => d.target === o && d.use.targets.length > 1 && (isStrike(d.use.card) || (E.CARD_DEFS[d.use.card.name] || {}).type === 'stratagem'),
      *on(g, o, d) { d.use.nullified.add(o); yield* g.draw(o, 1, 'zama'); },
    } },
  };

  // ── 列奥尼达 ──
  H.leonidas = { faction: 'classical', hp: 4, gender: 'male', skills: ['narrows', 'defiance'], name: ['列奥尼达', 'Leonidas'], title: ['斯巴达王', 'The Spartan King'], rating: 7 };
  S.narrows = {
    name: ['隘口', 'NARROWS'], type: 'locked', locked: true,
    desc: ['锁定技，当你受到伤害后，直到本回合结束，所有其他角色使用的杀和谋略牌对你无效。', 'Compulsory skill. After you take damage, other characters\' Strikes and Stratagems have no effect on you until the end of the turn.'],
    triggers: {
      damaged: { can: (g, o, d) => d.to === o && !o.dead, *on(g, o) { o.marks.narrows = g.turnSeq || 0; } },
      effectBefore: {
        silent: true,
        can: (g, o, d) => d.target === o && o.marks.narrows === (g.turnSeq || 0) && d.use.from !== o && (isStrike(d.use.card) || (E.CARD_DEFS[d.use.card.name] || {}).type === 'stratagem'),
        *on(g, o, d) { d.cancel = true; g.log('skill', { seat: o.seat, skill: 'narrows' }); },
      },
    },
  };
  S.defiance = {
    name: ['拒降', 'DEFIANCE'], type: 'normal',
    desc: ['其他角色的出牌阶段开始时，你可以摸 X 张牌，然后令其视为对你使用杀。若此杀对你造成了伤害，除非其弃置 X 张牌，否则其结束此出牌阶段（X 为你已损失的体力，且至多为 5）。', "At the start of another character's Play phase, you may draw X cards, then they are treated as using a Strike on you. If it damages you, they must discard X cards or end their Play phase (X = your lost health, max 5)."],
    triggers: { phaseStart: {
      can: (g, o, d) => d.phase === 'play' && d.player !== o && !d.player.dead && !o.dead,
      *on(g, o, d) {
        const p = d.player; const x = Math.min(5, lost(o));
        if (x > 0) yield* g.draw(o, x, 'defiance');
        const vc = V('strike', [], { viaSkill: 'defiance' }); if (!g.targetAllowed(p, o, vc)) return;
        const u = yield* g.useCard(p, vc, [o], { noCount: true, ignoreDistance: true });
        if (!u.data.dealt || p.dead) return;
        // 弃牌数 X 按受到伤害后的已损失体力重新计算
        const x2 = Math.min(5, lost(o)); if (x2 <= 0) return;
        let i = 1;
        if (p.cardCount >= x2) i = yield* g.chooseOption(p, ['defianceDiscard', 'defianceEnd'], 'defiance', { skill: 'defiance', n: x2 });
        if (i === 0) yield* g.askDiscard(p, x2, x2, 'he', 'defianceDiscard', null, { skill: 'defiance', n: x2 });
        else { d.skip = true; g.log('playEnded', { seat: p.seat, skill: 'defiance' }); }
      },
    } },
    ai: {
      confirm: (g, me, req, A) => { const p = g.p(req.data.player); return A.rel(g, me, p) < -0.2 && (me.hp >= 3 || me.hand.some(c => c.name === 'parry')); },
      option: (g, me, req, A) => { const cs = g.cardsIn(me, 'he').sort((a, b) => A.keep(g, me, a) - A.keep(g, me, b)); const cost = cs.slice(0, req.n).reduce((s, c) => s + A.keep(g, me, c), 0); return cost < 3 + me.hand.length * 0.8 ? 0 : 1; },
    },
  };

  // ── 斯巴达克斯 ──
  H.spartacus = { faction: 'classical', hp: 4, gender: 'male', skills: ['unchain', 'comrades'], name: ['斯巴达克斯', 'Spartacus'], title: ['角斗士', 'The Gladiator'], rating: 7 };
  S.unchain = {
    name: ['挣锁', 'UNCHAIN'], type: 'normal',
    desc: ['每当你受到 1 点伤害后，你可以摸两张牌，然后将这些牌任意分配给任意角色。', 'Each time you take 1 damage, you may draw 2 cards, then give them out to any characters as you like.'],
    triggers: { damaged: {
      can: (g, o, d) => d.to === o && !o.dead,
      *on(g, o, d) {
        for (let i = 0; i < d.amount && !o.dead; i++) {
          if (i > 0 && !(yield* g.confirm(o, 'unchain'))) break;
          const cs = yield* g.draw(o, 2, 'unchain');
          // 一次询问：选若干张刚摸的牌 + 一名其他角色，点「分发」；点「取消」则全部留下
          let left = cs.filter(c => o.hand.includes(c));
          for (let k = 0; k < 2 && left.length && !o.dead; k++) {
            const others = g.alive.filter(p => p !== o);
            if (!others.length) break;
            const a = yield* g.ask(o, { kind: 'distribute', skill: 'unchain', reason: 'unchainGive', options: left.map(c => c.id), targets: others.map(p => p.seat) });
            if (!a || !Array.isArray(a.cards) || !a.cards.length || a.target == null) break;
            const t = g.p(a.target); const give = left.filter(c => a.cards.includes(c.id) && o.hand.includes(c));
            if (!t || t.dead || t === o || !give.length) break;
            yield* g.gainCards(t, give, 'unchain', o);
            left = left.filter(c => !give.includes(c) && o.hand.includes(c));
          }
        }
      },
    } },
    ai: { distribute: (g, me, req, A) => {
      const fr = g.alive.filter(p => p !== me && req.targets.includes(p.seat) && A.rel(g, me, p) > 0.6).sort((a, b) => a.hand.length - b.hand.length)[0];
      return fr && me.hand.length > g.handLimit(me) && fr.hand.length < me.hand.length - 2 ? { cards: req.options.slice(), target: fr.seat } : null;
    } },
  };
  S.comrades = {
    name: ['同袍', 'COMRADES'], type: 'locked', locked: true,
    desc: ['锁定技，体力值大于你的角色不能响应你对其使用的杀。你使用杀的次数上限 +X（X 为你已损失的体力值）。', 'Compulsory skill. Characters with more health than you cannot respond to your Strikes. You may use X more Strikes per turn (X = your lost health).'],
    triggers: { targetConfirmed: {
      can: (g, o, d) => strikeBy(o, d.use) && d.use.targets.some(t => t.hp > o.hp),
      *on(g, o, d) { for (const t of d.use.targets) if (t.hp > o.hp) d.use.noResponse.add(t); },
    } },
    mods: { strikeLimit: (g, o, v, p) => p === o ? v + lost(o) : v },
  };

  // ── 布狄卡 ──
  H.boudica = { faction: 'classical', hp: 4, gender: 'female', skills: ['chariot', 'vengeance'], name: ['布狄卡', 'Boudica'], title: ['复仇女王', 'The Iceni Queen'], rating: 7 };
  S.chariot = {
    name: ['战车', 'CHARIOT'], type: 'locked', locked: true,
    desc: ['锁定技，游戏开始时，你从牌堆中随机装备 −1 马和 +1 马各一匹。你的坐骑不能被其他角色获得或弃置。', 'Compulsory skill. At the start of the game, equip a random Charger (−1) and Destrier (+1) from the deck. Other characters cannot take or discard your mounts.'],
    triggers: { gameStart: {
      can: () => true,
      *on(g, o) {
        for (const sub of ['minus', 'plus']) {
          const list = g.deck.filter(c => (E.CARD_DEFS[c.name] || {}).sub === sub); if (!list.length) continue;
          const c = g.pick(list);
          yield* g.moveCards({ cards: [c], to: 'equip', toPlayer: o, slot: sub, reason: 'chariot' });
          g.log('equip', { seat: o.seat, card: c.name, id: c.id });
        }
      },
    } },
    mods: { protectCard: (g, o, v, c, by) => (c.loc && c.loc.zone === 'equip' && c.loc.seat === o.seat && (c.loc.slot === 'plus' || c.loc.slot === 'minus') && by !== o) ? true : v },
  };
  S.vengeance = {
    name: ['血誓', 'VENGEANCE'], type: 'normal',
    desc: ['当你受到伤害后，你可以进行一次天意判定：若结果不为红桃，伤害来源须选择一项：弃置一半的手牌（向上取整且至少为 2），或受到你造成的随机 1~2 点伤害。', 'After you take damage, you may invoke Fate: unless ♥, the source must discard half their hand (rounded up, at least 2) or take 1–2 random damage from you.'],
    triggers: { damaged: {
      can: (g, o, d) => d.to === o && !o.dead && d.from && !d.from.dead && d.from !== o,
      *on(g, o, d) {
        const src = d.from;
        const c = yield* g.judge(o, 'vengeance');
        if (c.suit === 'heart' || src.dead || o.dead) return;
        const need = Math.max(2, Math.ceil(src.hand.length / 2));
        // 手牌不足 2 张时只能选择受到伤害
        let i = 1;
        if (src.hand.length >= need) i = yield* g.chooseOption(src, ['vengeanceDiscard', 'vengeanceDamage'], 'vengeance', { skill: 'vengeance', n: need });
        if (i === 0) yield* g.askDiscard(src, need, need, 'h', 'vengeanceDiscard', null, { skill: 'vengeance', n: need });
        else yield* g.damage({ from: o, to: src, amount: 1 + Math.floor(g.rand() * 2) });
      },
    } },
    ai: {
      confirm: (g, me, req, A) => A.rel(g, me, g.p(req.data.from)) < 0.3,
      option: (g, me, req, A) => { if (me.hp <= 2) return 0; const cs = me.hand.slice().sort((a, b) => A.keep(g, me, a) - A.keep(g, me, b)); const cost = cs.slice(0, req.n).reduce((s, c) => s + A.keep(g, me, c), 0); return cost < 2.5 * me.hp ? 0 : 1; },
    },
  };

  // ── 克娄巴特拉 ──
  H.cleopatra = { faction: 'classical', hp: 3, gender: 'female', skills: ['allure', 'pearl'], name: ['克娄巴特拉', 'Cleopatra'], title: ['尼罗河女王', 'The Nile Queen'], rating: 8 };
  S.allure = {
    name: ['倾国', 'ALLURE'], type: 'normal',
    desc: ['出牌阶段限 X+1 次，你可以弃置一张牌，令一名其他角色视为对另一名其他角色使用一张不能被无懈可击响应的决斗（X 为你已损失的体力值）。', 'X+1 times per Play phase, you may discard a card to make one other character be treated as using a Duel, which cannot be Vetoed, on another other character (X = your lost health).'],
    active: {
      cards: { min: 1, max: 1, zones: 'he' },
      targets: { min: 2, max: 2, filter: (g, p, t, sel) => t !== p && (sel.length === 0 || g.targetAllowed(sel[0], t, V('duel', []))) },
      can: (g, p) => (p.phaseState.allure || 0) < lost(p) + 1 && p.cardCount > 0 && g.alive.length >= 3,
      valid: (g, p, cards, targets) => cards.length === 1 && g.cardsIn(p, 'he').includes(cards[0]) && targets.length === 2 && targets[0] !== targets[1] && targets.every(t => t !== p && !t.dead),
      *use(g, p, cards, targets) {
        p.phaseState.allure = (p.phaseState.allure || 0) + 1;
        yield* g.discard(p, cards, 'allure');
        const [a, b] = targets; if (a.dead || b.dead) return;
        yield* g.useCard(a, V('duel', [], { viaSkill: 'allure' }), [b], { noVeto: true });
      },
    },
    ai: { play(g, me, inst, A) {
      const cs = g.cardsIn(me, 'he').sort((a, b) => A.keep(g, me, a) - A.keep(g, me, b)); if (!cs.length) return [];
      const cost = A.keep(g, me, cs[0]) / 3;
      let best = null, bv = 0;
      for (const b of g.alive) { if (b === me) continue; const tb = A.threat(g, me, b); if (tb <= 0) continue;
        for (const a of g.alive) { if (a === me || a === b) continue;
          const pB = a.hand.length + 1 > b.hand.length ? 0.68 : 0.42; const ta = A.threat(g, me, a);
          const v = tb * pB * 1.4 + (ta > 0 ? ta * (1 - pB) : ta * (1 - pB) * 0.7) - cost;
          if (v > bv) { bv = v; best = [a, b]; } } }
      return best ? [{ score: bv, ans: { action: 'skill', skill: inst.key, cardIds: [cs[0].id], targets: best.map(x => x.seat) } }] : [];
    } },
  };
  S.pearl = {
    name: ['明珠', 'PEARL'], type: 'normal',
    desc: ['结束阶段，你可以摸 Y 张牌（Y 为本回合内所有角色体力值变动的次数）。', 'At the start of your Finish phase, you may draw Y cards (Y = number of times any health changed this turn).'],
    triggers: { phaseStart: { can: (g, o, d) => d.player === o && d.phase === 'finish' && g.hpChanges > 0, *on(g, o) { yield* g.draw(o, g.hpChanges, 'pearl'); } } },
  };

  // ── 阿基米德 ──
  H.archimedes = { faction: 'classical', hp: 3, gender: 'male', skills: ['lever', 'mirror'], name: ['阿基米德', 'Archimedes'], title: ['几何大师', 'The Geometer'], rating: 7 };
  S.lever = {
    name: ['杠杆', 'LEVER'], type: 'normal',
    desc: ['出牌阶段限一次，你可以选择一名其他角色，将你们的体力值都调整为两者之和的一半（你向上取整，对方向下取整）。', 'Once per Play phase, choose another character. Both of your health values become half their sum (you round up, they round down).'],
    active: {
      cards: { min: 0, max: 0 }, targets: { min: 1, max: 1, filter: (g, p, t) => t !== p },
      can: (g, p) => !p.phaseState.lever,
      valid: (g, p, cards, targets) => !cards.length && targets.length === 1 && targets[0] !== p,
      *use(g, p, cards, targets) {
        p.phaseState.lever = true; const t = targets[0]; const s = p.hp + t.hp;
        // 调整后不超过各自体力上限；不算伤害或回复
        yield* g.setHp(p, Math.ceil(s / 2), 'lever'); yield* g.setHp(t, Math.floor(s / 2), 'lever');
      },
    },
    ai: { play(g, me, inst, A) {
      let best = null, bv = 0;
      for (const t of g.alive) { if (t === me) continue; const s = me.hp + t.hp;
        const gain = Math.min(me.maxHp, Math.ceil(s / 2)) - me.hp; const loss = t.hp - Math.floor(s / 2); const r = A.rel(g, me, t);
        const v = gain * (me.hp <= 2 ? 2.2 : 1.4) + (r < 0 ? -r * loss * 1.6 : -r * loss * 1.3);
        if (v > bv) { bv = v; best = t; } }
      return best && bv > 0.8 ? [{ score: bv, ans: { action: 'skill', skill: inst.key, targets: [best.seat] } }] : [];
    } },
  };
  S.mirror = {
    name: ['镜火', 'MIRROR'], type: 'normal',
    desc: ['一名角色的天意牌生效前，你可以打出一张手牌代替之。任意角色的天意牌生效后，你获得之。', "Before any Fate card takes effect, you may play a card from your hand in its place. After any Fate card takes effect, you gain it."],
    triggers: {
      judgeRetouch: { optional: false, silent: true, can: (g, o) => o.hand.length > 0 && !o.dead,
        *on(g, o, j) {
          const cs = yield* g.chooseOwnCards(o, 0, 1, 'h', 'mirrorRetouch', null, { skill: 'mirror', judgeSeat: j.player.seat, judgeReason: j.reason, judgeCard: j.card.id });
          if (cs.length) { g.log('skill', { seat: o.seat, skill: 'mirror' }); yield* g.retouch(j, o, cs[0]); }
        } },
      judgeDone: { optional: false, silent: true, can: (g, o, j) => !o.dead && j.card.loc && j.card.loc.zone === 'process', *on(g, o, j) { yield* g.gainCards(o, [j.card], 'mirror'); } },
    },
    ai: { cards: (g, me, req, A) => A.retouchPick(g, me, req) },
  };

  // ── 希帕提娅 ──
  H.hypatia = { faction: 'classical', hp: 3, gender: 'female', skills: ['lecture', 'proof'], name: ['希帕提娅', 'Hypatia'], title: ['智慧之光', 'The Philosopher'], rating: 6 };
  S.lecture = {
    name: ['讲学', 'LECTURE'], type: 'normal',
    desc: ['出牌阶段每项限一次：1. 你可以令手牌数大于你的其他角色各交给你一张手牌，然后若你的手牌数为全场唯一最多，你失去 1 点体力；2. 你可以与一名手牌数不大于你的角色交换手牌。', 'Once each per Play phase: 1. Every other character with more cards in hand than you gives you one; then if you alone have the most cards, lose 1 health. 2. Swap hands with a character who has no more cards than you.'],
    active: {
      options: ['lecture1', 'lecture2'],
      cards: { min: 0, max: 0 },
      targets: (g, p, ans) => ans && ans.option === 1 ? { min: 1, max: 1, filter: (g2, p2, t) => t !== p2 && t.hand.length <= p2.hand.length } : { min: 0, max: 0 },
      can: (g, p, inst, ans) => {
        const o = ans ? ans.option : null;
        const c1 = !p.phaseState.lec1 && g.alive.some(q => q !== p && q.hand.length > p.hand.length);
        const c2 = !p.phaseState.lec2 && g.alive.some(q => q !== p && q.hand.length <= p.hand.length);
        return o === 0 ? c1 : o === 1 ? c2 : (c1 || c2);
      },
      valid: (g, p, cards, targets, inst, ans) => ans.option === 0 ? !targets.length : (targets.length === 1 && targets[0] !== p && targets[0].hand.length <= p.hand.length),
      *use(g, p, cards, targets, inst, ans) {
        if (ans.option === 0) {
          p.phaseState.lec1 = true;
          const givers = others(g, p).filter(q => q.hand.length > p.hand.length);
          for (const q of givers) {
            if (q.dead || !q.hand.length || p.dead) continue;
            const [c] = yield* g.chooseOwnCards(q, 1, 1, 'h', 'lectureGive', null, { skill: 'lecture', to: p.seat });
            if (c) yield* g.gainCards(p, [c], 'lecture', q);
          }
          // "全场最多"按唯一最多理解（与推演一致）
          if (!p.dead && uniqueMax(g, p)) yield* g.loseHp(p, 1, 'lecture');
        } else {
          p.phaseState.lec2 = true; const t = targets[0];
          const a = p.hand.slice(), b = t.hand.slice();
          yield* g.moveCards([{ cards: a, to: 'hand', toPlayer: t, reason: 'swap' }, { cards: b, to: 'hand', toPlayer: p, reason: 'swap' }]);
          g.log('swapHands', { seat: p.seat, with: t.seat });
        }
      },
    },
    ai: { play(g, me, inst, A) {
      if (me.phaseState.lec1) return [];
      const givers = g.alive.filter(q => q !== me && q.hand.length > me.hand.length);
      if (!givers.length) return [];
      const after = me.hand.length + givers.length;
      const risk = g.alive.every(q => q === me || Math.max(0, q.hand.length - (givers.includes(q) ? 1 : 0)) < after);
      const v = givers.reduce((s, q) => s + (A.rel(g, me, q) < 0 ? 1.4 : 0.6), 0) - (risk ? (me.hp <= 1 ? 99 : me.hp === 2 ? 3 : 1.6) : 0);
      return v > 0.5 ? [{ score: v, ans: { action: 'skill', skill: inst.key, option: 0 } }] : [];
    }, cards: (g, me, req, A) => { const cs = me.hand.slice().sort((a, b) => A.keep(g, me, a) - A.keep(g, me, b)); return [cs[0].id]; } },
  };
  S.proof = {
    name: ['推演', 'PROOF'], type: 'limited',
    desc: ['限定技，出牌阶段，你可以获得所有其他角色的手牌，然后依次交给其他角色各一张牌，直到你的手牌数不为全场唯一最多。', 'Limited skill. During your Play phase, take every other character\'s hand, then give one card to each other character in turn until you no longer alone have the most cards.'],
    active: {
      cards: { min: 0, max: 0 }, targets: { min: 0, max: 0 },
      can: (g, p) => !p.skillState.proof && g.alive.some(q => q !== p && q.hand.length),
      valid: () => true,
      *use(g, p) {
        p.skillState.proof = true;
        for (const q of others(g, p)) if (q.hand.length) yield* g.gainCards(p, q.hand.slice(), 'proof', q);
        // 从下家起依次每人一张，循环，直到你不再是唯一最多
        for (let guard = 0; guard < 300 && uniqueMax(g, p) && !p.dead; guard++) {
          let gave = false;
          for (const q of others(g, p)) {
            if (!uniqueMax(g, p) || !p.hand.length) break;
            const [c] = yield* g.chooseOwnCards(p, 1, 1, 'h', 'proofGive', null, { skill: 'proof', to: q.seat });
            if (c) { yield* g.gainCards(q, [c], 'proof', p); gave = true; }
          }
          if (!gave) break;
        }
      },
    },
    ai: {
      play(g, me, inst, A) {
        const tot = g.alive.reduce((s, q) => s + (q === me ? 0 : q.hand.length), 0);
        const enemyCards = g.alive.reduce((s, q) => s + (q !== me && A.rel(g, me, q) < -0.2 ? q.hand.length : 0), 0);
        return tot >= 2 * (g.alive.length - 1) && enemyCards >= 5 ? [{ score: 2 + enemyCards * 0.3, ans: { action: 'skill', skill: inst.key } }] : [];
      },
      cards: (g, me, req, A) => { const t = g.p(req.to); const cs = me.hand.slice().sort((a, b) => A.keep(g, me, a) - A.keep(g, me, b)); return [(A.rel(g, me, t) > 0.3 ? cs[cs.length - 1] : cs[0]).id]; },
    },
  };

  // ── 古典主公技：号令 ──
  const classicalOthers = (g, o) => others(g, o).filter(q => q.faction === 'classical');
  S.rally = {
    name: ['号令', 'RALLY'], type: 'lord',
    desc: ['主公技，当你需要使用或打出杀时，其他古典角色可以替你打出一张杀。', 'Lord skill. When you need to use or play a Strike, other Classical characters may play one for you.'],
    triggers: { askResponse: {
      can: (g, o, d) => d.player === o && d.req.pattern.includes('strike') && !d.result && d.req.reason !== 'rally' && classicalOthers(g, o).length > 0,
      *on(g, o, d) {
        for (const q of classicalOthers(g, o)) {
          const r = yield* g.askRespond(q, { pattern: ['strike'], mode: 'play', reason: 'rally', source: o.seat });
          if (r) { d.result = V('strike', [], { viaSkill: 'rally' }); return; }
        }
      },
    } },
    active: {
      cards: { min: 0, max: 0 },
      targets: { min: 1, max: (g, p) => g.maxTargets(p, V('strike', [])), filter: (g, p, t, sel) => g.targetCandidates(p, V('strike', []), sel).includes(t) },
      can: (g, p) => (p.phaseState.strikes || 0) < g.strikeLimit(p) && classicalOthers(g, p).length > 0 && g.targetCandidates(p, V('strike', []), []).length > 0,
      valid: (g, p, cards, targets) => !cards.length && g.canUseCard(p, V('strike', []), targets, { phase: true }),
      *use(g, p, cards, targets) {
        for (const q of classicalOthers(g, p)) {
          const r = yield* g.askRespond(q, { pattern: ['strike'], mode: 'play', reason: 'rally', source: p.seat });
          if (r) { yield* g.useCard(p, V('strike', [], { viaSkill: 'rally' }), targets.filter(t => !t.dead), { phase: true }); return; }
        }
        g.log('rallyFailed', { seat: p.seat });
        p.phaseState.rallyFailed = (p.phaseState.rallyFailed || 0) + 1;
      },
    },
    ai: { play(g, me, inst, A) {
      if (me.hand.some(c => isStrike(c)) || (me.phaseState.rallyFailed || 0) >= 1) return [];
      if (!classicalOthers(g, me).some(q => A.rel(g, me, q) > 0.3)) return [];
      const vc = V('strike', []); let bt = null, bv = 0;
      for (const t of g.targetCandidates(me, vc, [])) { const v = A.strikeValue(g, me, t, vc, me.turnState.drunk ? 1 : 0); if (v > bv) { bv = v; bt = t; } }
      return bt && bv > 0.5 ? [{ score: bv * 0.8, ans: { action: 'skill', skill: inst.key, targets: [bt.seat] } }] : [];
    } },
  };
  E.Game.lordSkills.classical = 'rally';


  // ═════════════ 中古 Medieval ═════════════
  Object.assign(OPTION_TEXT, {
    ransomTake: ['获得其中一张并防止伤害', 'Take One, Prevent Damage'], ransomDiscard: ['弃置 {n} 张牌', 'Discard {n} Cards'],
    domesdayHand: ['观看其手牌，可弃置其中一张黑色牌', 'View Hand, Discard a Black Card'], domesdayRole: ['观看其身份', 'View Role'],
    redeem0: ['回复体力至全场唯一最多', 'Heal to Most'], redeem1: ['摸牌至全场唯一最多', 'Draw to Most'], redeem2: ['装满军备区', 'Fill Arsenal'], redeem3: ['获得【救赎】', 'Gain Redemption'],
  });
  Object.assign(PROMPT_TEXT, {
    callingTarget: ['圣召：选择一名其他角色，令其也执行此效果。', 'Calling: choose another character to suffer the same.'],
    callingDiscard: ['圣召：请弃置 {n} 张牌。', 'Calling: discard {n} cards.'],
    martyrTarget: ['殉道：选择一名其他角色回复 1 点体力并获得【圣召】。', 'Martyr: choose another character to recover 1 health and gain Calling.'],
    ransomShow: ['赎金：选择至多三张手牌给{t}观看。', 'Ransom: choose up to three cards to show {t}.'],
    ransomOpt: ['赎金：选择一项：', 'Ransom: choose one:'], ransomPick: ['赎金：选择一张获得。', 'Ransom: choose one to take.'],
    ransomDiscard: ['赎金：请弃置 {n} 张牌。', 'Ransom: discard {n} cards.'],
    pindian: ['拼点（对手 {t}）：选择一张手牌。', 'Contest against {t}: choose a card.'],
    domesdayOpt: ['清册：选择一项：', 'Domesday: choose one:'], domesdayPick: ['清册：可以弃置其中一张黑色牌。', 'Domesday: you may discard one black card.'],
    kingmakerGive: ['拥立：交给{t}至少一张手牌。', 'Kingmaker: give {t} at least one card.'],
    kingmakerBack: ['拥立：请将 {n} 张手牌交给{t}。', 'Kingmaker: give {n} cards to {t}.'],
    escort: ['勤王：是否替{t}打出一张【闪】？', 'Escort: play a Parry on behalf of {t}?'],
    freedomPick: ['自由：选择天兆区的一张牌弃置。', 'Freedom: choose a card in your omen area to discard.'],
    tradeTake: ['通商：选择{t}区域内的一张牌获得。', "Trade: choose a card from {t}'s areas."],
    redeemOpt: ['救赎：选择一项：', 'Redemption: choose one:'], redeemTarget: ['救赎：选择一名角色。', 'Redemption: choose a character.'],
    exileTarget: ['流放：选择一名角色摸 {n} 张牌并翻面。', 'Exile: choose a character to draw {n} and turn face down.'],
    anointTake: ['圣冠：选择{t}的一张手牌。', "Anoint: take one of {t}'s cards."],
  });

  // ── 查理曼 ──
  H.charlemagne = { faction: 'medieval', hp: 4, gender: 'male', skills: ['anoint', 'paladins'], name: ['查理曼', 'Charlemagne'], title: ['欧洲之父', 'The Father of Europe'], rating: 7 };
  S.anoint = {
    name: ['圣冠', 'ANOINT'], type: 'normal',
    desc: ['出牌阶段限一次，你可以获得所有其他角色各一张手牌。此阶段结束时，你将其中仍在你手里的牌交还原主。', 'Once per Play phase, take one card from every other character\'s hand. At the end of this phase, return those still in your hand to their owners.'],
    active: {
      cards: { min: 0, max: 0 }, targets: { min: 0, max: 0 },
      can: (g, p) => !p.phaseState.anoint && g.alive.some(q => q !== p && q.hand.length),
      valid: () => true,
      *use(g, p) {
        p.phaseState.anoint = []; // [cardId, ownerSeat]
        for (const q of others(g, p)) {
          if (!q.hand.length) continue;
          const c = yield* g.chooseCardOf(p, q, 'h', 'anoint', { skill: 'anoint' });
          if (c) { yield* g.gainCards(p, [c], 'anoint', q); p.phaseState.anoint.push([c.id, q.seat]); }
        }
      },
    },
    triggers: { phaseEnd: {
      optional: false, silent: true,
      can: (g, o, d) => d.player === o && d.phase === 'play' && Array.isArray(o.phaseState.anoint) && o.phaseState.anoint.length > 0,
      *on(g, o) {
        for (const [id, seat] of o.phaseState.anoint) {
          const c = g.card(id), q = g.p(seat);
          if (c && o.hand.includes(c) && !q.dead) yield* g.gainCards(q, [c], 'anointReturn', o);
        }
        o.phaseState.anoint = [];
      },
    } },
    ai: { play: (g, me, inst, A) => { const n = g.alive.filter(q => q !== me && q.hand.length).length; return n >= 2 ? [{ score: 1 + n * 0.7, ans: { action: 'skill', skill: inst.key } }] : []; } },
  };
  S.paladins = {
    name: ['圣骑', 'PALADINS'], type: 'normal',
    desc: ['你可以将任意黑色牌当闪使用或打出。每当你于回合外使用一张闪时，你摸一张牌。', 'You may use or play any black card as a Parry. Each time you use a Parry outside your turn, draw 1.'],
    viewAs: { patterns: ['parry'], as: 'parry', count: 1, zones: 'he', filter: (g, p, c) => c.color === 'black' },
    triggers: { cardUsed: {
      optional: false,
      can: (g, o, d) => d.use.from === o && d.use.card.name === 'parry' && g.current !== o && !o.dead,
      *on(g, o) { yield* g.draw(o, 1, 'paladins'); },
    } },
  };

  // ── 贞德 ──
  H.joan = { faction: 'medieval', hp: 3, gender: 'female', skills: ['calling', 'martyr'], name: ['贞德', 'Joan of Arc'], title: ['奥尔良少女', 'The Maid'], rating: 6 };
  function* callingSpread(g, o, kind, n, extra) {
    const cands = g.alive.filter(q => q !== o);
    const [t] = yield* g.chooseTargets(o, cands, 1, 1, 'callingTarget', { skill: 'calling', effect: kind, n });
    if (!t) return;
    // 由圣召引起的效果不再触发圣召
    if (kind === 'damage') yield* g.damage({ from: o, to: t, amount: n, nature: extra.nature, calling: true });
    else if (kind === 'loseHp') yield* g.loseHp(t, n, 'calling');
    else if (kind === 'maxHp') yield* g.changeMaxHp(t, -n, 'calling');
    else if (kind === 'discard') yield* g.askDiscard(t, n, n, 'he', 'callingDiscard', null, { skill: 'calling', n });
  }
  S.calling = {
    name: ['圣召', 'CALLING'], type: 'normal',
    desc: ['当你受到伤害、失去体力、减体力上限或弃置牌后，你可以令一名其他角色也执行此效果。', 'After you take damage, lose health, lose max health, or discard cards, you may make another character suffer the same.'],
    triggers: {
      damaged: { can: (g, o, d) => d.to === o && !o.dead && !d.calling, *on(g, o, d) { yield* callingSpread(g, o, 'damage', d.amount, { nature: d.nature }); } },
      hpLost: { can: (g, o, d) => d.player === o && !o.dead && d.reason !== 'calling', *on(g, o, d) { yield* callingSpread(g, o, 'loseHp', d.amount); } },
      maxHpChanged: { can: (g, o, d) => d.player === o && !o.dead && d.delta < 0 && d.reason !== 'calling', *on(g, o, d) { yield* callingSpread(g, o, 'maxHp', -d.delta); } },
      discarded: { can: (g, o, d) => d.player === o && !o.dead && d.reason !== 'callingDiscard' && d.cards.length > 0, *on(g, o, d) { yield* callingSpread(g, o, 'discard', d.cards.length); } },
    },
    ai: {
      confirm: (g, me, req, A) => g.alive.some(q => q !== me && A.threat(g, me, q) > 0.3),
      targets: (g, me, req, A) => {
        const c = req.options.map(s => g.p(s));
        const score = (q) => req.effect === 'discard' ? (A.rel(g, me, q) < -0.15 ? -A.rel(g, me, q) * Math.min(q.cardCount, req.n) : -1) : A.threat(g, me, q);
        c.sort((a, b) => score(b) - score(a)); return [c[0].seat];
      },
    },
  };
  S.martyr = {
    name: ['殉道', 'MARTYR'], type: 'limited',
    desc: ['限定技，当你进入濒死状态时，你可以放弃求药，然后令一名其他角色回复 1 点体力并获得【圣召】。', 'Limited skill. When you are dying, you may refuse to be saved; then another character recovers 1 health and gains Calling.'],
    triggers: { enterDying: {
      can: (g, o, d) => d.player === o && !o.skillState.martyr && g.alive.length > 1,
      *on(g, o, d) {
        o.skillState.martyr = true; d.noSave = true;
        const [t] = yield* g.chooseTargets(o, g.alive.filter(q => q !== o), 1, 1, 'martyrTarget', { skill: 'martyr' });
        if (t) { yield* g.recover(t, 1, o); g.gainSkill(t, 'calling'); }
      },
    } },
    ai: {
      confirm: (g, me, req, A) => me.role !== 'chancellor' && !me.hand.some(c => c.name === 'remedy' || c.name === 'grog') && g.alive.some(q => q !== me && A.rel(g, me, q) > 0.5) && !g.alive.some(q => q !== me && A.rel(g, me, q) > 0.5 && q.hand.length >= 3),
      targets: (g, me, req, A) => { const c = req.options.map(s => g.p(s)).sort((a, b) => A.rel(g, me, b) - A.rel(g, me, a)); return [c[0].seat]; },
    },
  };

  // ── 理查一世 ──
  H.richard = { faction: 'medieval', hp: 4, gender: 'male', skills: ['valiant', 'ransom'], name: ['理查一世', 'Richard I'], title: ['狮心王', 'The Lionheart'], rating: 6 };
  S.valiant = {
    name: ['狮心', 'VALIANT'], type: 'locked', locked: true,
    desc: ['锁定技，你的手牌上限等于你的体力上限。当你的手牌数小于体力上限时，你不能成为釜底抽薪和探囊取物的目标；当你的手牌数大于体力上限时，你不能成为流连忘返的目标。', 'Compulsory skill. Your hand limit equals your max health. With fewer cards than your max health, you cannot be targeted by Sabotage or Pilfer; with more, you cannot be targeted by Lotus Eaters.'],
    mods: {
      handLimit: (g, o, v, p) => p === o ? o.maxHp : v,
      canTarget: (g, o, v, user, t, card) => {
        if (!v || t !== o) return v;
        if ((card.name === 'sabotage' || card.name === 'pilfer') && o.hand.length < o.maxHp) return false;
        if (card.name === 'lotus' && o.hand.length > o.maxHp) return false;
        return v;
      },
    },
  };
  S.ransom = {
    name: ['赎金', 'RANSOM'], type: 'normal',
    desc: ['当你受到其他角色造成的伤害时，你可以令其观看你至多三张手牌，然后其选择一项：1. 获得其中一张并防止此伤害；2. 弃置等量的牌。', 'When another character would damage you, you may show them up to three cards from your hand. They choose: take one of them and prevent the damage, or discard that many cards.'],
    triggers: { damageTaking: {
      can: (g, o, d) => d.to === o && d.from && d.from !== o && !d.from.dead && o.hand.length > 0,
      *on(g, o, d) {
        const src = d.from;
        const shown = yield* g.chooseOwnCards(o, 1, 3, 'h', 'ransomShow', null, { skill: 'ransom', to: src.seat });
        g.log('show', { seat: o.seat, card: shown[0].id, n: shown.length, to: src.seat });
        const i = yield* g.chooseOption(src, ['ransomTake', 'ransomDiscard'], 'ransom', { skill: 'ransom', n: shown.length, shown: shown.map(c => c.id) });
        if (i === 0) {
          const a = yield* g.ask(src, { kind: 'pick', options: shown.map(c => c.id), reason: 'ransomPick', skill: 'ransom' });
          const c = shown.find(x => x.id === a) || shown[0];
          yield* g.gainCards(src, [c], 'ransom', o); d.prevented = true;
        } else yield* g.askDiscard(src, shown.length, shown.length, 'he', 'ransomDiscard', null, { skill: 'ransom', n: shown.length });
      },
    } },
    ai: {
      confirm: () => true,
      cards: (g, me, req, A) => { const cs = me.hand.slice().sort((a, b) => A.keep(g, me, a) - A.keep(g, me, b)); const n = Math.max(1, Math.min(3, cs.filter(c => A.keep(g, me, c) < 3.5).length)); return cs.slice(0, n).map(c => c.id); },
      option: (g, me, req, A) => { const R = g.players.find(p => p.skills.includes('ransom') && p !== me) || null; const th = R ? A.threat(g, me, R) : 0; const cost = g.cardsIn(me, 'he').map(c => A.keep(g, me, c)).sort((a, b) => a - b).slice(0, req.n).reduce((a, b) => a + b, 0); return (th > 0.5 && cost < th * 3 && g.cardsIn(me, 'he').length >= req.n) ? 1 : 0; },
    },
  };

  // ── 熙德 ──
  H.elcid = { faction: 'medieval', hp: 4, gender: 'male', skills: ['triumph', 'undying'], name: ['熙德', 'El Cid'], title: ['无敌勇士', 'The Champion'], rating: 7 };
  S.triumph = {
    name: ['凯旋', 'TRIUMPH'], type: 'locked', locked: true,
    desc: ['锁定技，当你对距离 2 以内的角色造成伤害时，若你已受伤，你回复 1 点体力，否则你摸一张牌。', 'Compulsory skill. When you deal damage to a character within distance 2: if you are wounded, recover 1 health; otherwise draw 1.'],
    triggers: { damageCausing: {
      can: (g, o, d) => d.from === o && d.to !== o && !o.dead && g.distance(o, d.to) <= 2,
      *on(g, o) { if (o.wounded) yield* g.recover(o, 1, o); else yield* g.draw(o, 1, 'triumph'); },
    } },
  };
  S.undying = {
    name: ['不朽', 'UNDYING'], type: 'limited',
    desc: ['限定技，当你进入濒死状态时，你可以弃置你区域内的所有牌，将体力回复至 2 点，然后摸三张牌。', 'Limited skill. When you are dying, you may discard every card in all your areas, recover to 2 health, then draw 3.'],
    triggers: { enterDying: {
      can: (g, o, d) => d.player === o && !o.skillState.undying,
      *on(g, o) {
        o.skillState.undying = true;
        const all = [...o.hand, ...o.equipList, ...o.judgeZone]; if (all.length) yield* g.discard(o, all, 'undying');
        yield* g.recover(o, Math.min(2, o.maxHp) - o.hp, o);
        yield* g.draw(o, 3, 'undying');
      },
    } },
    ai: { confirm: (g, me) => !me.hand.some(c => c.name === 'remedy' || c.name === 'grog') },
  };

  // ── 威廉一世 ──
  H.william = { faction: 'medieval', hp: 4, gender: 'male', skills: ['retreat', 'domesday'], name: ['威廉一世', 'William'], title: ['征服者', 'The Conqueror'], rating: 6 };
  S.retreat = {
    name: ['佯退', 'RETREAT'], type: 'normal',
    desc: ['当你即将受到其他角色造成的伤害时，你可以令其摸一张牌，然后与其拼点：若你赢，防止此伤害并获得对方的拼点牌；若你没赢，此伤害改为 1 点，你收回你的拼点牌。', 'When another character would damage you, you may let them draw 1, then contest them: if you win, prevent the damage and take their card; otherwise the damage becomes 1 and you take back your card.'],
    triggers: { damageTaking: {
      can: (g, o, d) => d.to === o && d.from && d.from !== o && !d.from.dead && o.hand.length > 0,
      *on(g, o, d) {
        yield* g.draw(d.from, 1, 'retreat');
        const r = yield* g.pindian(o, d.from, 'retreat'); if (!r) return;
        if (r.win) { d.prevented = true; yield* g.gainCards(o, [r.cb], 'retreat', d.from); }
        else { d.amount = Math.min(d.amount, 1); yield* g.gainCards(o, [r.ca], 'retreat'); }
        yield* g.clearProcessing([r.ca, r.cb]);
      },
    } },
    ai: {
      confirm: (g, me) => me.hand.some(c => c.rank >= 9) || me.hand.length >= 3,
      cards: (g, me, req, A) => { const cs = me.hand.slice().sort((a, b) => b.rank - a.rank); return [cs[0].id]; },
    },
  };
  S.domesday = {
    name: ['清册', 'DOMESDAY'], type: 'normal',
    desc: ['出牌阶段限一次，你可以令一名其他角色观看你的手牌，然后你选择一项：1. 观看其手牌，并可以弃置其中一张黑色牌；2. 观看其身份。', 'Once per Play phase, let another character see your hand, then choose: view their hand and you may discard one black card from it; or view their role.'],
    active: {
      cards: { min: 0, max: 0 }, targets: { min: 1, max: 1, filter: (g, p, t) => t !== p },
      can: (g, p) => !p.phaseState.domesday,
      valid: (g, p, cards, targets) => targets.length === 1 && targets[0] !== p,
      *use(g, p, cards, targets) {
        p.phaseState.domesday = true; const t = targets[0];
        g.log('viewHand', { seat: t.seat, target: p.seat });
        const roleKnown = t.roleShown || (p.knownRoles && p.knownRoles[t.seat]);
        const i = roleKnown ? 0 : yield* g.chooseOption(p, ['domesdayHand', 'domesdayRole'], 'domesday', { skill: 'domesday', target: t.seat });
        if (i === 1) { g.learnRole(p, t); return; }
        g.log('viewHand', { seat: p.seat, target: t.seat });
        const blacks = t.hand.filter(c => c.color === 'black');
        if (!blacks.length) return;
        const a = yield* g.ask(p, { kind: 'pick', options: blacks.map(c => c.id), show: t.hand.map(c => c.id), optional: true, reason: 'domesdayPick', skill: 'domesday', target: t.seat });
        const c = blacks.find(x => x.id === a);
        if (c) { yield* g.moveCards({ cards: [c], to: 'discard', by: p.seat, reason: 'domesday' }); g.log('discardOf', { by: p.seat, seat: t.seat, card: c.id }); yield* g.trigger('discarded', { player: t, cards: [c], by: p, reason: 'domesday' }); }
      },
    },
    ai: {
      play: (g, me, inst, A) => {
        let best = null, bv = 0;
        for (const t of g.alive) { if (t === me) continue; const conf = Math.abs(A.rel(g, me, t)); const v = (conf < 0.4 && !t.roleShown && !(me.knownRoles && me.knownRoles[t.seat])) ? 2.2 : (A.rel(g, me, t) < -0.2 && t.hand.length >= 2 ? 1.2 + t.hand.length * 0.1 : 0); if (v > bv) { bv = v; best = t; } }
        return best ? [{ score: bv, ans: { action: 'skill', skill: inst.key, targets: [best.seat] } }] : [];
      },
      option: (g, me, req, A) => { const t = g.p(req.target); return Math.abs(A.rel(g, me, t)) < 0.4 ? 1 : 0; },
      pick: (g, me, req, A) => { const t = g.p(req.target); if (A.rel(g, me, t) > 0.2) return null; return req.options.map(id => g.card(id)).sort((a, b) => A.keep(g, t, b) - A.keep(g, t, a))[0].id; },
    },
  };

  // ── 埃莉诺 ──
  H.eleanor = { faction: 'medieval', hp: 3, gender: 'female', skills: ['alliance', 'kingmaker'], name: ['埃莉诺', 'Eleanor'], title: ['两国王后', 'The Twice Queen'], rating: 6 };
  S.alliance = {
    name: ['联姻', 'ALLIANCE'], type: 'normal',
    desc: ['出牌阶段限一次，你可以弃置两张牌并选择一名已受伤的其他角色，你与其各回复 1 点体力。若你未因此回复体力，你可以令你们各摸一张牌。', 'Once per Play phase, discard two cards and choose a wounded other character: you both recover 1 health. If you recovered none, you may both draw 1.'],
    active: {
      cards: { min: 2, max: 2, zones: 'he' }, targets: { min: 1, max: 1, filter: (g, p, t) => t !== p && t.wounded },
      can: (g, p) => !p.phaseState.alliance && p.cardCount >= 2 && g.alive.some(t => t !== p && t.wounded),
      valid: (g, p, cards, targets) => cards.length === 2 && targets.length === 1 && targets[0].wounded && targets[0] !== p,
      *use(g, p, cards, targets) {
        p.phaseState.alliance = true; const t = targets[0];
        yield* g.discard(p, cards, 'alliance');
        const healed = yield* g.recover(p, 1, p); yield* g.recover(t, 1, p);
        if (!healed && !p.dead && (yield* g.confirm(p, 'alliance', { draw: true }))) { yield* g.draw(p, 1, 'alliance'); yield* g.draw(t, 1, 'alliance'); }
      },
    },
    ai: {
      play: (g, me, inst, A) => {
        const cs = g.cardsIn(me, 'he').sort((a, b) => A.keep(g, me, a) - A.keep(g, me, b)); if (cs.length < 2) return [];
        const cost = (A.keep(g, me, cs[0]) + A.keep(g, me, cs[1])) / 2.2;
        let best = null, bv = 0;
        for (const t of g.alive) { if (t === me || !t.wounded) continue; const r = A.rel(g, me, t); if (r < 0.3) continue; const v = r * (t.hp <= 1 ? 3 : 1.6) + (me.wounded ? (me.hp <= 1 ? 3 : 1.6) : 0.6) - cost; if (v > bv) { bv = v; best = t; } }
        return best ? [{ score: bv, ans: { action: 'skill', skill: inst.key, cardIds: [cs[0].id, cs[1].id], targets: [best.seat] } }] : [];
      },
      confirm: (g, me, req, A) => true,
    },
  };
  S.kingmaker = {
    name: ['拥立', 'KINGMAKER'], type: 'normal',
    desc: ['其他角色的弃牌阶段开始时，你可以交给其至少一张手牌，然后其将超出其体力值数量的手牌交给你。', "At the start of another character's Discard phase, you may give them at least one card from your hand; then they give you every card in hand beyond their health."],
    triggers: { phaseStart: {
      can: (g, o, d) => d.phase === 'discard' && d.player !== o && !d.player.dead && o.hand.length > 0,
      *on(g, o, d) {
        const t = d.player;
        const cs = yield* g.chooseOwnCards(o, 1, o.hand.length, 'h', 'kingmakerGive', null, { skill: 'kingmaker', to: t.seat });
        yield* g.gainCards(t, cs, 'kingmaker', o);
        const n = t.hand.length - Math.max(0, t.hp);
        if (n > 0 && !o.dead) { const back = yield* g.chooseOwnCards(t, n, n, 'h', 'kingmakerBack', null, { skill: 'kingmaker', to: o.seat, n }); yield* g.gainCards(o, back, 'kingmaker', t); }
      },
    } },
    ai: {
      confirm: (g, me, req, A) => { const t = g.p(req.data.player); return t.hand.length + 1 - t.hp >= 2 && me.hand.some(c => A.keep(g, me, c) < 3); },
      cards: (g, me, req, A) => { const cs = me.hand.slice().sort((a, b) => A.keep(g, me, a) - A.keep(g, me, b)); if (req.reason === 'kingmakerGive') { const t = g.p(req.to); return A.rel(g, me, t) > 0.5 ? cs.slice(0, Math.min(2, cs.length)).map(c => c.id) : [cs[0].id]; } return cs.slice(0, req.min).map(c => c.id); },
    },
  };

  // ── 华莱士 ──
  H.wallace = { faction: 'medieval', hp: 4, gender: 'male', skills: ['schiltron', 'freedom'], name: ['华莱士', 'Wallace'], title: ['勇敢之心', 'The Braveheart'], rating: 7 };
  S.schiltron = {
    name: ['枪阵', 'SCHILTRON'], type: 'normal',
    desc: ['你可以将杀当闪、闪当杀使用或打出；若如此做，你可以获得对方的一张手牌。', 'You may use or play a Strike as a Parry, or a Parry as a Strike. If you do, you may take a card from your opponent\'s hand.'],
    viewAs: { patterns: ['strike', 'parry'], count: 1, zones: 'h', filter: (g, p, c, ctx) => {
      const pats = ctx && ctx.pattern ? [].concat(ctx.pattern) : ['strike'];
      return (c.name === 'parry' && pats.includes('strike')) || (isStrike(c) && pats.includes('parry'));
    }, as: (g, p, cs) => cs[0].name === 'parry' ? 'strike' : 'parry' },
    triggers: {
      cardUsed: { can: (g, o, d) => d.use.from === o && d.use.card.viaSkill === 'schiltron' && schiltronOpp(g, o, d.use).some(q => q.hand.length), *on(g, o, d) { for (const q of schiltronOpp(g, o, d.use)) { if (o.dead) break; if (q.hand.length) { const c = yield* g.chooseCardOf(o, q, 'h', 'schiltron', { skill: 'schiltron' }); if (c) yield* g.gainCards(o, [c], 'schiltron', q); } } } },
      cardPlayed: { can: (g, o, d) => d.player === o && d.card.viaSkill === 'schiltron' && d.req.source != null && !g.p(d.req.source).dead && g.p(d.req.source).hand.length > 0, *on(g, o, d) { const q = g.p(d.req.source); const c = yield* g.chooseCardOf(o, q, 'h', 'schiltron', { skill: 'schiltron' }); if (c) yield* g.gainCards(o, [c], 'schiltron', q); } },
    },
    ai: { confirm: (g, me, req, A) => true },
  };
  function schiltronOpp(g, o, use) {
    if (use.opts.response) { const src = use.opts.req && use.opts.req.use ? use.opts.req.use.from : (use.opts.req && use.opts.req.source != null ? g.p(use.opts.req.source) : null); return src && src !== o && !src.dead ? [src] : []; }
    return use.targets.filter(t => t !== o && !t.dead);
  }
  S.freedom = {
    name: ['自由', 'FREEDOM'], type: 'normal',
    desc: ['判定阶段开始时，你可以失去 1 点体力，然后弃置你天兆区里的一张牌。', 'At the start of your Judge phase, you may lose 1 health to discard a card in your omen area.'],
    triggers: { phaseStart: {
      can: (g, o, d) => d.player === o && d.phase === 'judge' && o.judgeZone.length > 0,
      *on(g, o) {
        yield* g.loseHp(o, 1, 'freedom'); if (o.dead || !o.judgeZone.length) return;
        const c = yield* g.chooseCardOf(o, o, 'j', 'freedomPick', { skill: 'freedom', visible: true });
        if (c) { delete c.omenAs; yield* g.discard(o, [c], 'freedom'); }
      },
    } },
    ai: { confirm: (g, me) => { const names = me.judgeZone.map(c => c.omenAs || c.name); return (me.hp >= 3 && (names.includes('lotus') || names.includes('blockade'))) || (me.hp >= 4 && names.includes('damocles')); } },
  };

  // ── 马可·波罗 ──
  H.marcopolo = { faction: 'medieval', hp: 3, gender: 'male', skills: ['journal', 'trade'], name: ['马可·波罗', 'Marco Polo'], title: ['东方行者', 'The Traveler'], rating: 7 };
  S.journal = {
    name: ['行记', 'JOURNAL'], type: 'normal',
    desc: ['出牌阶段限一次，你可以将一张方块手牌当流连忘返对自己使用，然后回复 1 点体力并摸 X 张牌（X 为这张牌的点数）。若你的天兆区里有牌，你使用牌无次数限制。', 'Once per Play phase, use a ♦ card from your hand as Lotus Eaters on yourself, then recover 1 health and draw X (X = its rank). While your omen area has cards, your cards have no usage limit.'],
    active: {
      cards: { min: 1, max: 1, zones: 'h', filter: (g, p, c) => c.suit === 'diamond' }, targets: { min: 0, max: 0 },
      can: (g, p) => !p.phaseState.journal && p.hand.some(c => c.suit === 'diamond') && !p.judgeZone.some(c => (c.omenAs || c.name) === 'lotus'),
      valid: (g, p, cards) => cards.length === 1 && cards[0].suit === 'diamond' && p.hand.includes(cards[0]),
      *use(g, p, cards) {
        p.phaseState.journal = true; const c = cards[0];
        yield* g.useCard(p, V('lotus', [c], { viaSkill: 'journal' }), [p], {});
        yield* g.recover(p, 1, p); yield* g.draw(p, c.rank, 'journal');
      },
    },
    mods: {
      strikeLimit: (g, o, v, p) => (p === o && o.judgeZone.length) ? Infinity : v,
      grogLimit: (g, o, v, p) => (p === o && o.judgeZone.length) ? Infinity : v,
    },
    ai: { play: (g, me, inst, A) => { const ds = me.hand.filter(c => c.suit === 'diamond').sort((a, b) => b.rank - a.rank); if (!ds.length) return []; const c = ds[0]; const v = Math.min(c.rank, 8) * 0.55 + (me.wounded ? 1.5 : 0) - 2.6 - A.keep(g, me, c) * 0.2; return v > 0.3 ? [{ score: v, ans: { action: 'skill', skill: inst.key, cardIds: [c.id] } }] : []; } },
  };
  S.trade = {
    name: ['通商', 'TRADE'], type: 'locked', locked: true,
    desc: ['锁定技，当你受到伤害时，其他角色各获得你区域内的一张牌，然后你获得其他角色区域内各一张牌。', 'Compulsory skill. When you take damage, every other character takes one card from your areas, then you take one card from each of their areas.'],
    triggers: { damageTaking: {
      can: (g, o, d) => d.to === o && !o.dead,
      *on(g, o) {
        for (const q of others(g, o)) { if (q.dead || !g.cardsIn(o, 'hej').length) continue; const c = yield* g.chooseCardOf(q, o, 'hej', 'tradeTake', { skill: 'trade', target: o.seat }); if (c) { delete c.omenAs; yield* g.gainCards(q, [c], 'trade', o); } }
        for (const q of others(g, o)) { if (o.dead || q.dead || !g.cardsIn(q, 'hej').length) continue; const c = yield* g.chooseCardOf(o, q, 'hej', 'tradeTake', { skill: 'trade', target: q.seat }); if (c) { delete c.omenAs; yield* g.gainCards(o, [c], 'trade', q); } }
      },
    } },
  };

  // ── 但丁 ──
  H.dante = { faction: 'medieval', hp: 3, gender: 'male', skills: ['redemption', 'exile'], name: ['但丁', 'Dante'], title: ['神曲诗人', 'The Poet'], rating: 7 };
  S.redemption = {
    name: ['救赎', 'REDEMPTION'], type: 'normal',
    desc: ['回合开始时，你可以选择一名角色并选择一项：1. 令其回复体力至全场唯一最多；2. 令其摸牌至全场唯一最多；3. 令其从牌堆或弃牌堆随机使用军备牌，直到其军备区没有空位；4. 令其获得【救赎】。每项限一次。', 'At the start of your turn, you may choose a character and one option: 1. heal them until they alone have the most health; 2. they draw until they alone have the most cards; 3. they equip random arsenal cards from the deck or discard pile until every slot is full; 4. they gain Redemption. Each option once per game.'],
    triggers: { turnStart: {
      can: (g, o, d) => d.player === o && [0, 1, 2, 3].some(i => !(o.skillState.redemption || {})[i]),
      *on(g, o) {
        const used = o.skillState.redemption = o.skillState.redemption || {};
        const avail = [0, 1, 2, 3].filter(i => !used[i]);
        const k = yield* g.chooseOption(o, avail.map(i => 'redeem' + i), 'redeem', { skill: 'redemption' });
        const opt = avail[k] != null ? avail[k] : avail[0];
        const cands = opt === 3 ? g.alive.filter(q => !q.skills.includes('redemption')) : g.alive;
        if (!cands.length) return;
        const [t] = yield* g.chooseTargets(o, cands, 1, 1, 'redeemTarget', { skill: 'redemption', option: opt });
        if (!t) return;
        used[opt] = true;
        if (opt === 0) { const m = Math.max(...g.alive.filter(q => q !== t).map(q => q.hp)); yield* g.recover(t, m + 1 - t.hp, o); }
        else if (opt === 1) { const m = Math.max(...g.alive.filter(q => q !== t).map(q => q.hand.length)); if (m + 1 > t.hand.length) yield* g.draw(t, m + 1 - t.hand.length, 'redemption'); }
        else if (opt === 2) {
          for (const slot of ['weapon', 'armor', 'plus', 'minus']) {
            if (t.equips[slot] || t.dead) continue;
            const pool = [...g.deck, ...g.discardPile].filter(c => (E.CARD_DEFS[c.name] || {}).sub === slot);
            if (!pool.length) continue;
            const c = g.pick(pool);
            yield* g.useCard(t, c, [t], {});
          }
        } else g.gainSkill(t, 'redemption');
      },
    } },
    ai: {
      confirm: () => true,
      option: (g, me, req, A) => {
        const fr = g.alive.filter(q => A.rel(g, me, q) > 0.4);
        const sc = req.options.map(o => {
          if (o === 'redeem0') return Math.max(0, ...fr.map(q => Math.min(q.maxHp, Math.max(...g.alive.filter(x => x !== q).map(x => x.hp)) + 1) - q.hp)) * 1.6;
          if (o === 'redeem1') return Math.max(0, ...fr.map(q => Math.max(...g.alive.filter(x => x !== q).map(x => x.hand.length)) + 1 - q.hand.length)) * 0.7;
          if (o === 'redeem2') return Math.max(0, ...fr.map(q => ['weapon', 'armor', 'plus', 'minus'].filter(s => !q.equips[s]).length)) * 0.9;
          return fr.some(q => q !== me && !q.skills.includes('redemption')) ? 1.2 : 0;
        });
        let bi = 0; sc.forEach((v, i) => { if (v > sc[bi]) bi = i; }); return bi;
      },
      targets: (g, me, req, A) => {
        const c = req.options.map(s => g.p(s)); const o = req.option;
        const val = q => { const r = A.rel(g, me, q); if (r < 0.3) return -10 + r;
          if (o === 0) return Math.min(q.maxHp, Math.max(...g.alive.filter(x => x !== q).map(x => x.hp)) + 1) - q.hp + (q === me ? 0.3 : 0);
          if (o === 1) return Math.max(...g.alive.filter(x => x !== q).map(x => x.hand.length)) + 1 - q.hand.length;
          if (o === 2) return ['weapon', 'armor', 'plus', 'minus'].filter(s => !q.equips[s]).length;
          return q === me ? -1 : r; };
        c.sort((a, b) => val(b) - val(a)); return [c[0].seat];
      },
    },
  };
  S.exile = {
    name: ['流放', 'EXILE'], type: 'normal',
    desc: ['当你受到其他角色造成的伤害后，你可以令一名角色摸 X 张牌并翻面（X 为你已损失的体力值）。', 'After another character damages you, you may make a character draw X cards and turn face down (X = your lost health).'],
    triggers: { damaged: {
      can: (g, o, d) => d.to === o && !o.dead && d.from && d.from !== o,
      *on(g, o) {
        const x = lost(o);
        const [t] = yield* g.chooseTargets(o, g.alive, 1, 1, 'exileTarget', { skill: 'exile', n: x });
        if (!t) return;
        yield* g.draw(t, x, 'exile'); t.faceDown = !t.faceDown; g.log('flip', { seat: t.seat, faceDown: t.faceDown });
      },
    } },
    ai: {
      confirm: () => true,
      targets: (g, me, req, A) => {
        const c = req.options.map(s => g.p(s));
        const val = q => { const r = A.rel(g, me, q); if (q.faceDown) return r > 0 ? 3 + req.n : -3; return r < -0.15 ? -r * 4 - req.n * 0.7 : (q === me ? -2 : -3); };
        c.sort((a, b) => val(b) - val(a)); return val(c[0]) > 0 ? [c[0].seat] : [me.seat];
      },
    },
  };

  // ── 腓特烈一世 ──
  H.barbarossa = { faction: 'medieval', hp: 4, gender: 'male', skills: ['knights', 'slumber'], name: ['腓特烈一世', 'Barbarossa'], title: ['红胡子', 'The Redbeard'], rating: 7 };
  S.knights = {
    name: ['铁骑', 'KNIGHTS'], type: 'locked', locked: true,
    desc: ['锁定技，你使用的杀须连续使用两张闪才能抵消；与你决斗的另一方每次须连续打出两张杀。', 'Compulsory skill. Your Strikes need two Parries to cancel. In a Duel with you, your opponent must play two Strikes each time.'],
    triggers: {
      targetConfirmed: { silent: true, can: (g, o, d) => strikeBy(o, d.use), *on(g, o, d) { d.use.data.parryNeed = d.use.data.parryNeed || new Map(); for (const t of d.use.targets) d.use.data.parryNeed.set(t, 2); } },
      cardUsing: { silent: true, can: (g, o, d) => d.use.card.name === 'duel' && (d.use.from === o || d.use.targets.includes(o)),
        *on(g, o, d) { const prev = d.use.data.duelNeed; d.use.data.duelNeed = (p) => p !== o ? 2 : (prev ? prev(p) : 1); } },
    },
  };
  S.slumber = {
    name: ['山眠', 'SLUMBER'], type: 'awaken', locked: true,
    desc: ['觉醒技，回合开始时，若你的体力值为 1 或没有手牌，你减 1 点体力上限，回复 1 点体力，摸三张牌，然后失去【山眠】并获得【中兴】。', 'Awakening skill. At the start of your turn, if you have 1 health or no cards in hand, lose 1 max health, recover 1 health, draw 3, then lose Slumber and gain Resurgence.'],
    triggers: { turnStart: {
      can: (g, o, d) => d.player === o && !o.skillState.slumber && (o.hp === 1 || o.hand.length === 0),
      *on(g, o) { o.skillState.slumber = true; yield* g.changeMaxHp(o, -1); if (o.dead) return; yield* g.recover(o, 1, o); yield* g.draw(o, 3, 'slumber'); o.skills = o.skills.filter(x => x !== 'slumber'); g.log('skillLost', { seat: o.seat, skill: 'slumber' }); g.gainSkill(o, 'resurgence'); },
    } },
  };
  S.resurgence = {
    name: ['中兴', 'RESURGENCE'], type: 'normal',
    desc: ['每项每回合限一次：1. 当你使用杀或决斗对其他角色造成伤害时，你可以令其先失去等量的体力；2. 本回合你使用的下一张杀或决斗可以额外指定一个目标。', 'Once each per turn: 1. When your Strike or Duel would damage another character, you may first make them lose that much health; 2. Your next Strike or Duel this turn may take one extra target.'],
    triggers: {
      damageCausing: {
        can: (g, o, d) => d.from === o && d.to !== o && d.use && d.use.from === o && (isStrike(d.use.card) || d.use.card.name === 'duel') && g.current && !g.current.turnState.resurgence1,
        *on(g, o, d) { g.current.turnState.resurgence1 = true; yield* g.loseHp(d.to, d.amount, 'resurgence'); if (d.to.dead) d.prevented = true; },
      },
      cardUsed: { silent: true, can: (g, o, d) => d.use.from === o && (isStrike(d.use.card) || d.use.card.name === 'duel') && d.use.targets.length > 1 && g.current, *on(g, o) { g.current.turnState.resurgence2 = true; } },
    },
    mods: { maxTargets: (g, o, v, p, card) => (p === o && (isStrike(card) || card.name === 'duel') && g.current && !g.current.turnState.resurgence2) ? v + 1 : v },
    ai: { confirm: (g, me, req, A) => A.threat(g, me, g.p(req.data.to)) > 0 },
  };

  // ── 中古主公技：勤王 ──
  const medievalOthers = (g, o) => others(g, o).filter(q => q.faction === 'medieval');
  S.escort = {
    name: ['勤王', 'ESCORT'], type: 'lord',
    desc: ['主公技，当你需要使用或打出闪时，其他中古角色可以替你打出一张闪。', 'Lord skill. When you need to use or play a Parry, other Medieval characters may play one for you.'],
    triggers: { askResponse: {
      can: (g, o, d) => d.player === o && d.req.pattern.includes('parry') && !d.result && d.req.reason !== 'escort' && medievalOthers(g, o).length > 0,
      *on(g, o, d) {
        for (const q of medievalOthers(g, o)) {
          const r = yield* g.askRespond(q, { pattern: ['parry'], mode: 'play', reason: 'escort', source: o.seat });
          if (r) { d.result = V('parry', [], { viaSkill: 'escort' }); return; }
        }
      },
    } },
  };
  E.Game.lordSkills.medieval = 'escort';


  // ═════════════ 文艺 Renaissance ═════════════
  Object.assign(OPTION_TEXT, {
    codexUp: ['严格递增', 'Strictly Rising'], codexDown: ['严格递减', 'Strictly Falling'],
    codexNone: ['不选择', 'Skip'],
  });
  Object.assign(PROMPT_TEXT, {
    codexOpt: ['手稿：选择本回合的点数规律：', 'Codex: choose this turn\'s rank pattern:'],
    sophistPick: ['诡辩：弃置一张牌，将此杀转移给你攻击范围内的另一名角色。', 'Sophist: discard a card to redirect this Strike to another character in your range.'],
    sophistTarget: ['诡辩：选择新的目标。', 'Sophist: choose the new target.'],
    schemeAssign: ['权术：选择获得 {c} 的角色。', 'Scheme: choose who receives {c}.'],
    schemeStrike: ['权术：可以视为对其中任意名角色使用杀。', 'Scheme: you may be treated as using a Strike on any of them.'],
    telescope: ['望远：依次点选要放在牌堆顶的牌（先点的在最上面），其余置于牌堆底。', 'Telescope: click cards to keep on top (first clicked goes topmost); the rest go to the bottom.'],
    chiselPick: ['雕琢：每种花色选一张获得。', 'Chisel: take one card of each suit.'],
    plunder: ['劫掠：可以对{t}使用一张【杀】。', 'Plunder: you may use a Strike on {t}.'],
    fireshipTarget: ['火船：可以再选择一名其他角色重复此流程。', 'Fireship: you may choose another character to repeat.'],
    favorTarget: ['恩赏：选择一名其他角色获得这些牌。', 'Favor: choose another character to receive these cards.'],
  });

  // ── 伊丽莎白一世 ──
  H.elizabeth = { faction: 'renaissance', hp: 3, gender: 'female', skills: ['seapower', 'mantle'], name: ['伊丽莎白一世', 'Elizabeth I'], title: ['荣光女王', 'Gloriana'], rating: 7 };
  S.seapower = {
    name: ['海权', 'SEAPOWER'], type: 'locked', locked: true,
    desc: ['锁定技，每当你使用一张谋略牌后，你摸一张牌。你使用谋略牌无距离限制。', 'Compulsory skill. After you use a Stratagem, draw 1. Your Stratagems have no distance limit.'],
    triggers: { cardUsed: { can: (g, o, d) => d.use.from === o && (E.CARD_DEFS[d.use.card.name] || {}).type === 'stratagem' && !o.dead, *on(g, o) { yield* g.draw(o, 1, 'seapower'); } } },
    mods: { ignoreDistance: (g, o, v, p, t, card) => (p === o && card && (E.CARD_DEFS[card.name] || {}).type === 'stratagem') ? true : v },
  };
  S.mantle = {
    name: ['斗篷', 'MANTLE'], type: 'normal',
    desc: ['你可以将一张黑色牌当无懈可击使用。', 'You may use any black card as a Veto.'],
    viewAs: { patterns: ['veto'], as: 'veto', count: 1, zones: 'he', filter: (g, p, c) => c.color === 'black' },
  };

  // ── 达·芬奇 ──
  H.davinci = { faction: 'renaissance', hp: 3, gender: 'male', skills: ['codex', 'invert'], name: ['达·芬奇', 'Da Vinci'], title: ['全才', 'The Universal Man'], rating: 6 };
  S.codex = {
    name: ['手稿', 'CODEX'], type: 'normal',
    desc: ['回合开始时，你可以选择一项：1. 严格递增；2. 严格递减。本回合内你使用牌时，若此牌的点数与之前所有牌的点数均符合所选规律，你摸一张牌。', 'At the start of your turn, you may choose strictly rising or strictly falling. This turn, whenever you use a card whose rank keeps that pattern with every card you used before, draw 1.'],
    triggers: {
      turnStart: { can: (g, o, d) => d.player === o, *on(g, o) { const i = yield* g.chooseOption(o, ['codexUp', 'codexDown'], 'codex', { skill: 'codex' }); o.turnState.codex = { dir: i === 0 ? 1 : -1, ranks: [] }; } },
      cardUsing: {
        silent: true, optional: false,
        can: (g, o, d) => d.use.from === o && g.current === o && o.turnState.codex,
        *on(g, o, d) {
          const cx = o.turnState.codex; const r = d.use.card.rank || 0;
          const ok = r > 0 && cx.ranks.every(x => cx.dir > 0 ? r > x : r < x);
          cx.ranks.push(r);
          if (ok) { g.log('skill', { seat: o.seat, skill: 'codex' }); yield* g.draw(o, 1, 'codex'); }
        },
      },
    },
    ai: { confirm: () => true, option: (g, me) => { const rs = me.hand.map(c => c.rank); const avg = rs.reduce((a, b) => a + b, 0) / Math.max(1, rs.length); return avg < 7 ? 0 : 1; } },
  };
  const lastUsable = (g, p) => { const n = p.turnState.lastUsed; const d = n && E.CARD_DEFS[n]; return d && d.type !== 'equip' && !d.noActiveUse ? n : null; };
  S.invert = {
    name: ['镜书', 'INVERT'], type: 'normal',
    desc: ['出牌阶段限一次，你可以将一张牌当作你本回合上一张使用的牌使用。', 'Once per Play phase, you may use any card as the card you last used this turn.'],
    active: {
      cards: { min: 1, max: 1, zones: 'he' },
      targets: (g, p) => {
        const n = lastUsable(g, p); if (!n) return { min: 0, max: 0 };
        const vc = V(n, []); if (g.autoTargets(p, vc)) return { min: 0, max: 0 };
        const spec = E.CARD_DEFS[n].targets;
        return { min: spec.min == null ? 1 : spec.min, max: g.maxTargets(p, vc), filter: (g2, p2, t, sel) => g2.targetCandidates(p2, vc, sel).includes(t) };
      },
      can: (g, p) => !p.phaseState.invert && !!lastUsable(g, p) && p.cardCount > 0,
      valid: (g, p, cards, targets) => {
        const n = lastUsable(g, p); if (!n || cards.length !== 1 || !g.cardsIn(p, 'he').includes(cards[0])) return false;
        const vc = V(n, cards); const auto = g.autoTargets(p, vc);
        return g.canUseCard(p, vc, auto || targets, { phase: true });
      },
      *use(g, p, cards, targets) {
        p.phaseState.invert = true;
        const vc = V(lastUsable(g, p), cards, { viaSkill: 'invert' });
        yield* g.useCard(p, vc, g.autoTargets(p, vc) || targets, { phase: true });
      },
    },
    ai: { play(g, me, inst, A) {
      const n = lastUsable(g, me); if (!n || me.phaseState.invert) return [];
      if (!['strike', 'fire_strike', 'thunder_strike', 'windfall', 'duel', 'sabotage', 'pilfer', 'remedy', 'invasion', 'arrowstorm', 'greekfire'].includes(n)) return [];
      const cs = g.cardsIn(me, 'he').sort((a, b) => A.keep(g, me, a) - A.keep(g, me, b)); if (!cs.length) return [];
      const vc = V(n, [cs[0]]); const auto = g.autoTargets(me, vc);
      let targets = [];
      if (!auto) {
        let bt = null, bv = 0;
        for (const t of g.targetCandidates(me, vc, [])) { const v = E.family(vc) === 'strike' ? A.strikeValue(g, me, t, vc, 0) : A.threat(g, me, t); if (v > bv) { bv = v; bt = t; } }
        if (!bt) return []; targets = [bt];
      } else if (n === 'remedy' && !me.wounded) return [];
      if (!g.canUseCard(me, vc, auto || targets, { phase: true })) return [];
      return [{ score: 2.2 - A.keep(g, me, cs[0]) * 0.3, ans: { action: 'skill', skill: inst.key, cardIds: [cs[0].id], targets: targets.map(t => t.seat) } }];
    } },
  };

  // ── 马基雅维利 ──
  H.machiavelli = { faction: 'renaissance', hp: 3, gender: 'male', skills: ['scheme', 'sophist'], name: ['马基雅维利', 'Machiavelli'], title: ['君王之师', "The Prince's Tutor"], rating: 7 };
  S.scheme = {
    name: ['权术', 'SCHEME'], type: 'normal',
    desc: ['出牌阶段限一次，你可以展示牌堆顶的两张牌并分别交给两名角色（可以包括你），然后视为获得点数较大的牌的角色对另一名角色使用杀；之后你可以视为对其中任意名其他角色使用杀。以此法使用的杀造成伤害后，你获得受伤角色的一张牌。', 'Once per Play phase, reveal the top two cards and give one each to two characters (you may be one). The one with the higher rank is treated as using a Strike on the other; then you may be treated as using a Strike on any of them other than yourself. Whenever these Strikes deal damage, you take a card from the damaged character.'],
    active: {
      cards: { min: 0, max: 0 }, targets: { min: 2, max: 2, filter: () => true },
      can: (g, p) => !p.phaseState.scheme && g.alive.length >= 2,
      valid: (g, p, cards, targets) => targets.length === 2 && targets[0] !== targets[1],
      *use(g, p, cards, targets) {
        p.phaseState.scheme = true;
        const cs = g.takeTop(2); g.log('reveal', { cards: cs.map(c => c.id), reason: 'scheme' });
        // 第一张交给谁由你选
        const [a] = yield* g.chooseTargets(p, targets, 1, 1, 'schemeAssign', { skill: 'scheme', card: cs[0].id });
        const b = targets.find(t => t !== a);
        yield* g.gainCards(a, [cs[0]], 'scheme'); yield* g.gainCards(b, [cs[1]], 'scheme');
        const tag = { viaSkill: 'scheme', schemeBy: p.seat };
        // 点数相同则不出杀
        if (cs[0].rank !== cs[1].rank) {
          const [hi, lo] = cs[0].rank > cs[1].rank ? [a, b] : [b, a];
          if (!hi.dead && !lo.dead && g.targetAllowed(hi, lo, V('strike', []))) yield* g.useCard(hi, V('strike', [], tag), [lo], { noCount: true, ignoreDistance: true });
        }
        const live = targets.filter(t => t !== p && !t.dead && !p.dead);
        if (!live.length) return;
        const pick = yield* g.chooseTargets(p, live, 0, live.length, 'schemeStrike', { skill: 'scheme' });
        if (pick.length && !p.dead) yield* g.useCard(p, V('strike', [], tag), pick.filter(t => g.targetAllowed(p, t, V('strike', []))), { noCount: true, ignoreDistance: true });
      },
    },
    triggers: { damageDone: {
      can: (g, o, d) => d.card && d.card.schemeBy === o.seat && !d.to.dead && d.to !== o && g.cardsIn(d.to, 'he').length > 0 && !o.dead,
      optional: false,
      *on(g, o, d) { const c = yield* g.chooseCardOf(o, d.to, 'he', 'scheme', { skill: 'scheme' }); if (c) yield* g.gainCards(o, [c], 'scheme', d.to); },
    } },
    ai: {
      play(g, me, inst, A) {
        const en = g.alive.filter(q => q !== me && A.threat(g, me, q) > 0.3).sort((a, b) => A.threat(g, me, b) - A.threat(g, me, a));
        if (!en.length) return [];
        const other = en[1] || g.alive.filter(q => q !== me && q !== en[0]).sort((a, b) => A.threat(g, me, b) - A.threat(g, me, a))[0];
        if (!other) return [];
        return [{ score: 2.5 + A.threat(g, me, en[0]), ans: { action: 'skill', skill: inst.key, targets: [en[0].seat, other.seat] } }];
      },
      targets: (g, me, req, A) => {
        if (req.reason === 'schemeAssign') { const c = g.card(req.card); const opts = req.options.map(s => g.p(s)); const fr = opts.slice().sort((a, b) => A.rel(g, me, b) - A.rel(g, me, a)); return [(c.rank >= 7 ? fr[0] : fr[fr.length - 1]).seat]; }
        return req.options.filter(s => A.threat(g, me, g.p(s)) > 0.2);
      },
    },
  };
  S.sophist = {
    name: ['诡辩', 'SOPHIST'], type: 'normal',
    desc: ['当你成为杀的目标时，你可以弃置一张牌，将此杀转移给你攻击范围内的另一名角色（不能是使用者）。', "When you become a Strike's target, you may discard a card to redirect it to another character within your attack range (not its user)."],
    triggers: { targeted: {
      can: (g, o, d) => d.target === o && isStrike(d.use.card) && o.cardCount > 0 && g.alive.some(t => t !== o && t !== d.use.from && !d.use.targets.includes(t) && g.inAttackRange(o, t)),
      *on(g, o, d) {
        const cands = g.alive.filter(t => t !== o && t !== d.use.from && !d.use.targets.includes(t) && g.inAttackRange(o, t) && g.targetAllowed(d.use.from, t, d.use.card));
        if (!cands.length) return;
        const cs = yield* g.chooseOwnCards(o, 1, 1, 'he', 'sophistPick', null, { skill: 'sophist' });
        if (!cs.length) return;
        const [t] = yield* g.chooseTargets(o, cands, 1, 1, 'sophistTarget', { skill: 'sophist' });
        yield* g.discard(o, cs, 'sophist');
        const i = d.use.targets.indexOf(o); if (i >= 0 && t) d.use.targets[i] = t;
        g.log('redirect', { seat: o.seat, to: t.seat });
      },
    } },
    ai: {
      confirm: (g, me, req, A) => !me.hand.some(c => c.name === 'parry') || me.hp <= 2 || g.alive.some(t => A.threat(g, me, t) > 0.6 && t !== me),
      targets: (g, me, req, A) => { const c = req.options.map(s => g.p(s)).sort((a, b) => A.threat(g, me, b) - A.threat(g, me, a)); return [c[0].seat]; },
    },
  };

  // ── 莎士比亚 ──
  H.shakespeare = { faction: 'renaissance', hp: 3, gender: 'male', skills: ['soliloquy', 'tragedy'], name: ['莎士比亚', 'Shakespeare'], title: ['埃文河诗人', 'The Bard'], rating: 7 };
  S.soliloquy = {
    name: ['独白', 'SOLILOQUY'], type: 'locked', locked: true,
    desc: ['锁定技，你使用杀无次数限制。你于出牌阶段内使用的第一张杀伤害 +1 且不能被闪响应；其余的杀被其他角色的闪响应后，其对你造成 1 点伤害。', 'Compulsory skill. No limit on your Strikes. The first Strike you use in each Play phase deals +1 damage and cannot be Parried; after any other Strike of yours is Parried, the parrying character deals 1 damage to you.'],
    mods: { strikeLimit: (g, o, v, p) => p === o ? Infinity : v },
    triggers: {
      targetConfirmed: { can: (g, o, d) => strikeBy(o, d.use) && g.current === o && g.phase === 'play' && !o.phaseState.soliloquy,
        *on(g, o, d) { o.phaseState.soliloquy = true; d.use.extraDamage += 1; d.use.targets.forEach(t => d.use.noResponse.add(t)); d.use.data.soliloquyFirst = true; } },
      strikeParried: { can: (g, o, d) => strikeBy(o, d.use) && !d.use.data.soliloquyFirst && d.target !== o && !d.target.dead, *on(g, o, d) { yield* g.damage({ from: d.target, to: o, amount: 1 }); } },
    },
  };
  S.tragedy = {
    name: ['悲剧', 'TRAGEDY'], type: 'normal',
    desc: ['一名其他角色死亡时，你可以获得其所有牌和技能。', 'When another character dies, you may take all their cards and skills.'],
    triggers: { death: {
      can: (g, o, d) => d.player !== o && !o.dead,
      *on(g, o, d) {
        const t = d.player; const cs = [...t.hand, ...t.equipList, ...t.judgeZone];
        cs.forEach(c => delete c.omenAs);
        if (cs.length) yield* g.gainCards(o, cs, 'tragedy', t);
        for (const id of t.skills) if (S[id] && S[id].type !== 'lord') g.gainSkill(o, id);
      },
    } },
  };

  // ── 伽利略 ──
  H.galileo = { faction: 'renaissance', hp: 3, gender: 'male', skills: ['telescope', 'eppur'], name: ['伽利略', 'Galileo'], title: ['星际信使', 'The Stargazer'], rating: 7 };
  function* telescope(g, o) { yield* g.arrangeTop(o, Math.min(5, g.alive.length), 'telescope', { skill: 'telescope' }); }
  S.telescope = {
    name: ['望远', 'TELESCOPE'], type: 'normal',
    desc: ['回合开始时和结束阶段开始时，你可以观看牌堆顶的 X 张牌，并以任意顺序置于牌堆顶或牌堆底（X 为存活角色数，至多为 5）。', 'At the start of your turn and of your Finish phase, you may look at the top X cards and put them back on top or bottom in any order (X = living characters, max 5).'],
    triggers: {
      turnStart: { can: (g, o, d) => d.player === o, *on(g, o) { o.turnState.telescopeTiming = 'start'; yield* telescope(g, o); } },
      phaseStart: { can: (g, o, d) => d.player === o && d.phase === 'finish', *on(g, o) { o.turnState.telescopeTiming = 'end'; yield* telescope(g, o); } },
    },
    ai: { confirm: () => true },
  };
  const EPPUR = { spade: 'veto', heart: 'remedy', club: 'parry', diamond: 'fire_strike' };
  S.eppur = {
    name: ['仍动', 'EPPUR'], type: 'locked', locked: true,
    desc: ['锁定技，你的手牌数不能小于 X+1（X 为你已损失的体力值）。你可以将一张牌按花色当作以下牌使用或打出：黑桃当无懈可击，红桃当药，梅花当闪，方块当火杀。', 'Compulsory skill. You never have fewer than X+1 cards in hand (X = your lost health). You may use or play a card by suit: ♠ as Veto, ♥ as Remedy, ♣ as Parry, ♦ as Fire Strike.'],
    viewAs: {
      patterns: ['veto', 'remedy', 'parry', 'strike'], count: 1, zones: 'he',
      filter: (g, p, c, ctx) => { const n = EPPUR[c.suit]; if (!n) return false; const pats = ctx && ctx.pattern ? [].concat(ctx.pattern) : null; return pats ? E.matches(V(n, []), pats) : (n === 'remedy' || n === 'fire_strike'); },
      as: (g, p, cs) => EPPUR[cs[0].suit],
    },
    triggers: {
      afterMove: { optional: false, silent: true, can: (g, o) => !o.dead && o.hand.length < lost(o) + 1, *on(g, o) { yield* g.draw(o, lost(o) + 1 - o.hand.length, 'eppur'); } },
      damaged: { optional: false, silent: true, can: (g, o, d) => d.to === o && !o.dead && o.hand.length < lost(o) + 1, *on(g, o) { yield* g.draw(o, lost(o) + 1 - o.hand.length, 'eppur'); } },
      hpLost: { optional: false, silent: true, can: (g, o, d) => d.player === o && !o.dead && o.hand.length < lost(o) + 1, *on(g, o) { yield* g.draw(o, lost(o) + 1 - o.hand.length, 'eppur'); } },
    },
  };

  // ── 米开朗基罗 ──
  H.michelangelo = { faction: 'renaissance', hp: 3, gender: 'male', skills: ['chisel', 'david'], name: ['米开朗基罗', 'Michelangelo'], title: ['神圣巧手', 'The Divine'], rating: 7 };
  function* chiselOnce(g, o) {
    const cs = g.takeTop(5); g.log('reveal', { cards: cs.map(c => c.id), reason: 'chisel' });
    const suits = [...new Set(cs.map(c => c.suit))];
    const a = yield* g.ask(o, { kind: 'pick', options: cs.map(c => c.id), multi: { distinctSuit: true, count: suits.length }, reason: 'chiselPick', skill: 'chisel' });
    let take = Array.isArray(a) ? a.map(id => g.card(id)).filter(c => cs.includes(c)) : [];
    const seen = new Set(); take = take.filter(c => !seen.has(c.suit) && seen.add(c.suit));
    for (const su of suits) if (!seen.has(su)) { take.push(cs.find(c => c.suit === su)); seen.add(su); }
    yield* g.gainCards(o, take, 'chisel');
    yield* g.clearProcessing(cs);
    return take.length;
  }
  S.chisel = {
    name: ['雕琢', 'CHISEL'], type: 'locked', locked: true,
    desc: ['锁定技，摸牌阶段，你放弃摸牌，改为亮出牌堆顶的五张牌，获得其中每种花色各一张，弃置其余的牌。若你第一次以此法获得的牌少于三张，你可以再这样做一次。', 'Compulsory skill. In your Draw phase, instead of drawing, reveal the top five cards, take one of each suit, and discard the rest. If you took fewer than three the first time, you may do this once more.'],
    triggers: { drawCount: {
      can: (g, o, d) => d.player === o && !d.replaced,
      *on(g, o, d) {
        d.replaced = true;
        const n = yield* chiselOnce(g, o);
        if (n < 3 && !o.dead && (yield* g.confirm(o, 'chisel', { again: true }))) yield* chiselOnce(g, o);
      },
    } },
    ai: { confirm: () => true, pick: (g, me, req, A) => { const by = {}; for (const id of req.options) { const c = g.card(id); if (!by[c.suit] || A.keep(g, me, c) > A.keep(g, me, by[c.suit])) by[c.suit] = c; } return Object.values(by).map(c => c.id); } },
  };
  S.david = {
    name: ['大卫', 'DAVID'], type: 'locked', locked: true,
    desc: ['锁定技，若你于出牌阶段内没有使用过杀，你跳过本回合的弃牌阶段。', 'Compulsory skill. If you used no Strike during your Play phase, skip your Discard phase this turn.'],
    triggers: { phaseEnd: { can: (g, o, d) => d.player === o && d.phase === 'play' && !o.turnState.usedStrikeInPlay, *on(g, o) { g.skipPhase(o, 'discard'); } } },
  };

  // ── 德雷克 ──
  H.drake = { faction: 'renaissance', hp: 4, gender: 'male', skills: ['plunder', 'fireship'], name: ['德雷克', 'Drake'], title: ['女王海狼', 'The Sea Dog'], rating: 7 };
  S.plunder = {
    name: ['劫掠', 'PLUNDER'], type: 'normal',
    desc: ['你的回合外，其他角色使用红色牌后，你可以对其使用一张无距离限制的杀；此杀造成伤害后，你获得其所有手牌。', 'Outside your turn, after another character uses a red card, you may use a Strike on them with no distance limit. If it deals damage, take every card in their hand.'],
    triggers: { cardUsed: {
      optional: false, silent: true,
      can: (g, o, d) => g.current !== o && d.use.from && d.use.from !== o && !d.use.from.dead && !o.dead && d.use.card.color === 'red' && g.canProduce(o, ['strike'], {}),
      *on(g, o, d) {
        const t = d.use.from;
        const u = yield* g.askUseStrike(o, [t], 'plunder', { ignoreDistance: true });
        if (u && u.data.dealt && !t.dead && !o.dead) { g.log('skill', { seat: o.seat, skill: 'plunder' }); const cs = t.hand.slice(); if (cs.length) yield* g.gainCards(o, cs, 'plunder', t); }
      },
    } },
  };
  S.fireship = {
    name: ['火船', 'FIRESHIP'], type: 'normal',
    desc: ['出牌阶段限一次，你可以令一名其他角色摸一张牌，然后视为对其使用火攻；若此火攻造成了伤害，你可以对其重复此流程。你使用火攻造成伤害后，摸一张牌。', 'Once per Play phase, make another character draw 1, then you are treated as using Greek Fire on them. If it deals damage, you may repeat this on the same character. After any Greek Fire of yours deals damage, draw 1.'],
    active: {
      cards: { min: 0, max: 0 }, targets: { min: 1, max: 1, filter: (g, p, t) => t !== p },
      can: (g, p) => !p.phaseState.fireship && p.hand.length > 0,
      valid: (g, p, cards, targets) => targets.length === 1 && targets[0] !== p,
      *use(g, p, cards, targets) {
        p.phaseState.fireship = true; const t = targets[0];
        for (let guard = 0; guard < 30 && !t.dead && !p.dead; guard++) {
          yield* g.draw(t, 1, 'fireship');
          const vc = V('greekfire', [], { viaSkill: 'fireship' });
          if (!g.targetAllowed(p, t, vc)) break;
          const u = yield* g.useCard(p, vc, [t], {});
          // 没有造成伤害：流程结束，本阶段不能再发动
          if (!u.data.dealt || p.dead || t.dead || !p.hand.length) break;
          if (!(yield* g.confirm(p, 'fireship', { repeat: true, target: t.seat }))) break;
        }
      },
    },
    triggers: { damageDone: { optional: false, can: (g, o, d) => d.from === o && d.card && d.card.name === 'greekfire' && !o.dead, *on(g, o) { yield* g.draw(o, 1, 'fireship'); } } },
    ai: {
      play: (g, me, inst, A) => { const suits = new Set(me.hand.map(c => c.suit)).size; if (suits < 2) return []; let bt = null, bv = 0; for (const t of g.alive) { if (t === me) continue; const v = A.threat(g, me, t) * suits / 4 * 1.4 - 0.5; if (v > bv) { bv = v; bt = t; } } return bt ? [{ score: bv + 0.8, ans: { action: 'skill', skill: inst.key, targets: [bt.seat] } }] : []; },
      confirm: (g, me, req, A) => new Set(me.hand.map(c => c.suit)).size >= 2 && (req.target == null || A.threat(g, me, g.p(req.target)) > 0.2),
    },
  };

  // ── 古斯塔夫 ──
  H.gustavus = { faction: 'renaissance', hp: 4, gender: 'male', skills: ['volley', 'reform'], name: ['古斯塔夫', 'Gustavus'], title: ['北方雄狮', 'The Lion of the North'], rating: 6 };
  S.volley = {
    name: ['齐射', 'VOLLEY'], type: 'normal',
    desc: ['回合开始时，你视为使用万箭齐发。若有角色打出闪响应此牌，回合结束时，你再视为使用一次万箭齐发。', 'At the start of your turn, you are treated as using Arrowstorm. If anyone played a Parry against it, you are treated as using Arrowstorm again at the end of your turn.'],
    triggers: {
      turnStart: { optional: false, can: (g, o, d) => d.player === o && g.alive.length > 1,
        *on(g, o) { const u = yield* g.useCard(o, V('arrowstorm', [], { viaSkill: 'volley' }), null, {}); o.turnState.volleyAgain = !!u.data.parried; } },
      cardPlayed: { optional: false, silent: true, can: (g, o, d) => d.req && d.req.use && d.req.use.from === o && d.req.use.card.viaSkill === 'volley' && E.matches(d.card, ['parry']), *on(g, o, d) { d.req.use.data.parried = true; } },
      turnEnd: { optional: false, can: (g, o, d) => d.player === o && o.turnState.volleyAgain && g.alive.length > 1, *on(g, o) { o.turnState.volleyAgain = false; yield* g.useCard(o, V('arrowstorm', [], { viaSkill: 'volley2' }), null, {}); } },
    },
  };
  const BASICS = ['strike', 'parry', 'remedy', 'grog'];
  S.reform = {
    name: ['改革', 'REFORM'], type: 'locked', locked: true,
    desc: ['锁定技，你可以将一张军备牌当任意基本牌使用或打出。你的军备区没有牌时，你受到谋略牌造成的伤害 −1。', 'Compulsory skill. You may use or play any arsenal card as any basic card. While your arsenal area is empty, damage you take from Stratagems is reduced by 1.'],
    viewAs: {
      patterns: ['strike', 'parry', 'remedy', 'grog'], count: 1, zones: 'he', choices: BASICS,
      filter: (g, p, c) => (E.CARD_DEFS[c.name] || {}).type === 'equip',
      as: (g, p, cs, ctx, ans) => {
        const pats = ctx && ctx.pattern ? [].concat(ctx.pattern) : null;
        if (ans && ans.asName && BASICS.includes(ans.asName) && (!pats || pats.some(x => E.matches(V(ans.asName, []), [x])))) return ans.asName;
        if (pats) return BASICS.find(b => pats.some(x => E.matches(V(b, []), [x]))) || null;
        return 'strike';
      },
    },
    triggers: { damageTaking: { can: (g, o, d) => d.to === o && o.equipList.length === 0 && d.card && (E.CARD_DEFS[d.card.name] || {}).type === 'stratagem', *on(g, o, d) { d.amount -= 1; } } },
  };

  // ── 牛顿 ──
  H.newton = { faction: 'renaissance', hp: 3, gender: 'male', skills: ['gravity', 'laws'], name: ['牛顿', 'Newton'], title: ['物理之父', 'The Father of Physics'], rating: 6 };
  S.gravity = {
    name: ['引力', 'GRAVITY'], type: 'locked', locked: true,
    desc: ['锁定技，当你成为其他角色使用的基本牌或谋略牌的目标时，其也成为此牌的目标。', 'Compulsory skill. When another character targets you with a basic card or Stratagem, they become a target of it too.'],
    triggers: { targeted: {
      can: (g, o, d) => d.target === o && d.use.from && d.use.from !== o && !d.use.from.dead && !d.use.targets.includes(d.use.from) && ['basic', 'stratagem'].includes((E.CARD_DEFS[d.use.card.name] || {}).type),
      *on(g, o, d) { d.use.targets.push(d.use.from); },
    } },
  };
  S.laws = {
    name: ['定律', 'LAWS'], type: 'locked', locked: true,
    desc: ['锁定技，当你于一回合内使用第 3、6、9……张牌时，你可以摸三张牌。', 'Compulsory skill. Whenever you use your 3rd, 6th, 9th… card in a turn, you may draw 3.'],
    triggers: { cardUsing: {
      optional: false, silent: true,
      can: (g, o, d) => d.use.from === o && !o.dead,
      *on(g, o) {
        const k = o.marks.lawsTurn === g.turnSeq ? (o.marks.laws || 0) + 1 : 1;
        o.marks.lawsTurn = g.turnSeq; o.marks.laws = k;
        if (k % 3 === 0) { g.log('skill', { seat: o.seat, skill: 'laws' }); yield* g.draw(o, 3, 'laws'); }
      },
    } },
  };

  // ── 叶卡捷琳娜 ──
  H.catherine = { faction: 'renaissance', hp: 4, gender: 'female', skills: ['enlighten', 'favor'], name: ['叶卡捷琳娜', 'Catherine'], title: ['北国女皇', 'The Great'], rating: 8 };
  S.enlighten = {
    name: ['开明', 'ENLIGHTEN'], type: 'normal',
    desc: ['出牌阶段开始时和弃牌阶段开始时，你可以摸 X 张牌（X 为你的手牌数）。', 'At the start of your Play phase and of your Discard phase, you may draw X cards (X = cards in your hand).'],
    triggers: { phaseStart: { can: (g, o, d) => d.player === o && (d.phase === 'play' || d.phase === 'discard') && o.hand.length > 0, *on(g, o) { yield* g.draw(o, o.hand.length, 'enlighten'); } } },
    ai: { confirm: (g, me, req) => true },
  };
  S.favor = {
    name: ['恩赏', 'FAVOR'], type: 'limited',
    desc: ['限定技，结束阶段开始时，你可以令一名其他角色获得本回合你因弃置而置入弃牌堆的所有牌。', 'Limited skill. At the start of your Finish phase, you may give another character every card you discarded this turn that is still in the discard pile.'],
    triggers: {
      discarded: { optional: false, silent: true, can: (g, o, d) => d.player === o && g.current === o && (!d.by || d.by === o), *on(g, o, d) { (o.turnState.favor = o.turnState.favor || []).push(...d.cards.map(c => c.id)); } },
      phaseStart: {
        can: (g, o, d) => d.player === o && d.phase === 'finish' && !o.skillState.favor && (o.turnState.favor || []).some(id => g.card(id).loc && g.card(id).loc.zone === 'discard') && g.alive.length > 1,
        *on(g, o) {
          o.skillState.favor = true;
          const cs = o.turnState.favor.map(id => g.card(id)).filter(c => c.loc && c.loc.zone === 'discard');
          const [t] = yield* g.chooseTargets(o, g.alive.filter(q => q !== o), 1, 1, 'favorTarget', { skill: 'favor', n: cs.length });
          if (t) yield* g.gainCards(t, cs, 'favor', o);
        },
      },
    },
    ai: {
      confirm: (g, me, req, A) => (me.turnState.favor || []).length >= 4 && g.alive.some(q => q !== me && A.rel(g, me, q) > 0.5),
      targets: (g, me, req, A) => { const c = req.options.map(s => g.p(s)).sort((a, b) => A.rel(g, me, b) - A.rel(g, me, a)); return [c[0].seat]; },
    },
  };

  // ── 文艺主公技：赞助 ──
  S.patron = {
    name: ['赞助', 'PATRON'], type: 'lord',
    desc: ['主公技，其他文艺角色对你使用药时，你额外回复 1 点体力。', 'Lord skill. When another Renaissance character uses a Remedy on you, you recover 1 extra health.'],
    triggers: { recovering: {
      optional: false,
      can: (g, o, d) => d.player === o && d.card && E.family(d.card) === 'remedy' && d.source && d.source !== o && d.source.faction === 'renaissance',
      *on(g, o, d) { d.amount += 1; },
    } },
  };
  E.Game.lordSkills.renaissance = 'patron';


  // ═════════════ 革新 Revolution ═════════════
  Object.assign(PROMPT_TEXT, {
    returnTarget: ['百日：选择一名角色受到 {n} 点雷电伤害。', 'Return: choose a character to take {n} thunder damage.'],
    squareTarget: ['方阵：可以对一名角色造成 1 点伤害。', 'Square: you may deal 1 damage to a character.'],
    nemesisGive: ['宿敌：请交给{t} {n} 张牌。', 'Nemesis: give {n} cards to {t}.'],
    emancipatePick: ['解放：选择{t}天兆区的一张牌移到你的天兆区。', "Emancipate: choose a card in {t}'s omen area to move to yours."],
    addressDiscard: ['演说：选择{t}的一张牌弃置。', "Address: choose one of {t}'s cards to discard."],
    founderGive: ['建国：请交给{t}一张牌。', 'Founder: give {t} a card.'],
    tendPick: ['救护：可以选择一名武将替换（也可以不换）。', 'Tend: you may pick a hero to switch to (or keep yours).'],
    laurelGive: ['双桂：请展示并交给{t}一张手牌。', 'Laurel: reveal and give {t} a card from your hand.'],
    laurelLose: ['双桂：选择交出黑色牌的角色失去 1 点体力（可以不选）。', 'Laurel: choose who gave a black card to lose 1 health (optional).'],
    laurelHeal: ['双桂：选择交出红色牌的角色回复 1 点体力（可以不选）。', 'Laurel: choose who gave a red card to recover 1 health (optional).'],
    coilChain: ['线圈：选择至多 {n} 名角色横置。', 'Coil: choose up to {n} characters to chain.'],
    coilTarget: ['线圈：选择一名角色受到 2 点雷电伤害。', 'Coil: choose a character to take 2 thunder damage.'],
    joyTarget: ['欢乐：选择至多 {n} 名其他角色各摸一张牌。', 'Joy: choose up to {n} other characters to draw 1 each.'],
    railroadOpt: ['暗渡：选择一项：', 'Railroad: choose one:'],
    upriseGive: ['号召：选择一张杀或闪交给执笔者。', 'Uprise: choose a Strike or Parry to give the Chancellor.'],
  });
  Object.assign(OPTION_TEXT, {
    coilSkipDraw: ['跳过摸牌阶段', 'Skip Draw'], coilSkipPlay: ['跳过出牌阶段', 'Skip Play'],
    rr0: ['此杀不能被闪响应', 'Cannot Be Parried'], rr1: ['此杀无效', 'Strike Has No Effect'], rr2: ['将目标改为你', 'Redirect to You'], rr3: ['目标结算后回复 1 点体力', 'Target Recovers 1 After'],
  });
  const CAT = c => (E.CARD_DEFS[c.name] || {}).type;

  // ── 拿破仑 ──
  H.napoleon = { faction: 'revolution', hp: 4, gender: 'male', skills: ['austerlitz', 'returnx'], name: ['拿破仑', 'Napoleon'], title: ['法兰西皇帝', 'The Emperor'], rating: 8 };
  S.austerlitz = {
    name: ['三皇', 'AUSTERLITZ'], type: 'normal',
    desc: ['当你于出牌阶段内连续使用三张类别不同的牌后，你视为对所有其他角色使用杀。', 'After you use three cards of different categories in a row during your Play phase, you are treated as using a Strike on every other character.'],
    triggers: { cardUsed: {
      optional: false, silent: true,
      can: (g, o, d) => d.use.from === o && g.current === o && g.phase === 'play' && d.use.card.viaSkill !== 'austerlitz' && !d.use.opts.response,
      *on(g, o, d) {
        const seq = o.phaseState.austerlitz = o.phaseState.austerlitz || [];
        seq.push(CAT(d.use.card)); if (seq.length > 3) seq.shift();
        if (seq.length === 3 && new Set(seq).size === 3 && !o.dead) {
          o.phaseState.austerlitz = [];
          g.log('skill', { seat: o.seat, skill: 'austerlitz' });
          const vc = V('strike', [], { viaSkill: 'austerlitz' });
          const ts = g.seatOrderFrom(g.nextAlive(o)).filter(t => t !== o && g.targetAllowed(o, t, vc));
          if (ts.length) yield* g.useCard(o, vc, ts, { noCount: true, ignoreDistance: true });
        }
      },
    } },
  };
  S.returnx = {
    name: ['百日', 'RETURN'], type: 'locked', locked: true,
    desc: ['锁定技，当你进入濒死状态时，你减 1 点体力上限，将体力回复至体力上限，然后对一名角色造成 3−X 点雷电伤害（X 为你的体力上限）。', 'Compulsory skill. When you are dying, lose 1 max health and recover to full, then deal 3−X thunder damage to a character (X = your max health).'],
    triggers: { enterDying: {
      can: (g, o, d) => d.player === o && !o.dead,
      *on(g, o) {
        yield* g.changeMaxHp(o, -1); if (o.dead) return;
        yield* g.recover(o, o.maxHp - o.hp, o);
        const n = 3 - o.maxHp; if (n <= 0) return;
        const [t] = yield* g.chooseTargets(o, g.alive.filter(q => q !== o), 1, 1, 'returnTarget', { skill: 'returnx', n });
        if (t) yield* g.damage({ from: o, to: t, amount: n, nature: 'thunder' });
      },
    } },
    ai: { targets: (g, me, req, A) => { const c = req.options.map(s => g.p(s)).sort((a, b) => A.threat(g, me, b) - A.threat(g, me, a)); return [c[0].seat]; } },
  };

  // ── 威灵顿 ──
  H.wellington = { faction: 'revolution', hp: 4, gender: 'male', skills: ['square', 'nemesis'], name: ['威灵顿', 'Wellington'], title: ['铁公爵', 'The Iron Duke'], rating: 7 };
  S.square = {
    name: ['方阵', 'SQUARE'], type: 'normal',
    desc: ['当你失去一个区域内的所有牌后，你可以对一名角色造成 1 点伤害。', 'After you lose the last card in one of your areas, you may deal 1 damage to a character.'],
    triggers: { afterMove: {
      optional: false, silent: true,
      can: (g, o, d) => !o.dead && !o.marks.squareBusy && d.moves.some(m => m.from && m.from.seat === o.seat && ['hand', 'equip', 'judge'].includes(m.from.zone)),
      *on(g, o, d) {
        const zones = [...new Set(d.moves.filter(m => m.from && m.from.seat === o.seat).map(m => m.from.zone))];
        for (const z of zones) {
          if (o.dead) break;
          const empty = z === 'hand' ? !o.hand.length : z === 'equip' ? !o.equipList.length : !o.judgeZone.length;
          if (!empty) continue;
          if (!(yield* g.confirm(o, 'square', { zone: z }))) continue;
          g.log('skill', { seat: o.seat, skill: 'square' });
          const [t] = yield* g.chooseTargets(o, g.alive, 1, 1, 'squareTarget', { skill: 'square' });
          // 方阵造成的伤害结算完之前，不再触发方阵（避免与通商等形成无限循环）
          if (t) { o.marks.squareBusy = true; try { yield* g.damage({ from: o, to: t, amount: 1 }); } finally { o.marks.squareBusy = false; } }
        }
      },
    } },
    ai: {
      confirm: (g, me, req, A) => g.alive.some(q => A.threat(g, me, q) > 0.2),
      targets: (g, me, req, A) => { const c = req.options.map(s => g.p(s)).sort((a, b) => A.threat(g, me, b) - A.threat(g, me, a)); return [c[0].seat]; },
    },
  };
  S.nemesis = {
    name: ['宿敌', 'NEMESIS'], type: 'normal',
    desc: ['出牌阶段限一次，你可以选择一名其他角色，弃置一张牌并将你的武将牌翻面，然后获得其所有手牌。此阶段结束时，你交给该角色 X 张牌（X 为其体力值）。', 'Once per Play phase, choose another character, discard a card and turn yourself face down, then take their whole hand. At the end of this phase, give them X cards (X = their health).'],
    active: {
      cards: { min: 1, max: 1, zones: 'he' }, targets: { min: 1, max: 1, filter: (g, p, t) => t !== p && t.hand.length > 0 },
      can: (g, p) => !p.phaseState.nemesisUsed && p.cardCount > 0,
      valid: (g, p, cards, targets) => cards.length === 1 && targets.length === 1 && targets[0] !== p,
      *use(g, p, cards, targets) {
        p.phaseState.nemesisUsed = true; p.phaseState.nemesis = targets[0].seat; const t = targets[0];
        yield* g.discard(p, cards, 'nemesis');
        p.faceDown = !p.faceDown; g.log('flip', { seat: p.seat, faceDown: p.faceDown });
        if (t.hand.length) yield* g.gainCards(p, t.hand.slice(), 'nemesis', t);
      },
    },
    triggers: { phaseEnd: {
      optional: false, silent: true,
      can: (g, o, d) => d.player === o && d.phase === 'play' && o.phaseState.nemesis != null && !g.p(o.phaseState.nemesis).dead,
      *on(g, o) {
        const t = g.p(o.phaseState.nemesis); const n = Math.min(Math.max(0, t.hp), o.cardCount);
        if (n > 0) { const cs = yield* g.chooseOwnCards(o, n, n, 'he', 'nemesisGive', null, { skill: 'nemesis', to: t.seat, n }); yield* g.gainCards(t, cs, 'nemesis', o); }
      },
    } },
    ai: {
      play: (g, me, inst, A) => { if (me.faceDown) return []; let bt = null, bv = 0; for (const t of g.alive) { if (t === me) continue; const v = (A.rel(g, me, t) < -0.1 ? 1 : 0.2) * (t.hand.length - t.hp) * 1.2 + (A.rel(g, me, t) < -0.1 ? t.hand.length * 0.3 : 0) - 2.5; if (v > bv) { bv = v; bt = t; } } const cs = g.cardsIn(me, 'he').sort((a, b) => A.keep(g, me, a) - A.keep(g, me, b)); return bt && cs.length ? [{ score: bv, ans: { action: 'skill', skill: inst.key, cardIds: [cs[0].id], targets: [bt.seat] } }] : []; },
    },
  };

  // ── 林肯 ──
  H.lincoln = { faction: 'revolution', hp: 4, gender: 'male', skills: ['emancipate', 'address'], name: ['林肯', 'Lincoln'], title: ['解放者', 'The Emancipator'], rating: 7 };
  const omenName = c => c.omenAs || c.name;
  S.emancipate = {
    name: ['解放', 'EMANCIPATE'], type: 'normal',
    desc: ['锁定技，你跳过判定阶段。出牌阶段限一次，你可以将一名其他角色天兆区里的一张牌移到你的天兆区，然后你与其各回复 1 点体力并摸三张牌。', 'Compulsory: you skip your Judge phase. Once per Play phase, you may move a card from another character\'s omen area to yours; then you both recover 1 health and draw 3.'],
    triggers: { turnStart: { optional: false, silent: true, can: (g, o, d) => d.player === o, *on(g, o) { g.skipPhase(o, 'judge'); } } },
    active: {
      cards: { min: 0, max: 0 },
      targets: { min: 1, max: 1, filter: (g, p, t) => t !== p && t.judgeZone.some(c => !p.judgeZone.some(x => omenName(x) === omenName(c))) },
      can: (g, p) => !p.phaseState.emancipate && g.alive.some(t => t !== p && t.judgeZone.some(c => !p.judgeZone.some(x => omenName(x) === omenName(c)))),
      valid: (g, p, cards, targets) => targets.length === 1 && targets[0] !== p,
      *use(g, p, cards, targets) {
        p.phaseState.emancipate = true; const t = targets[0];
        const ok = t.judgeZone.filter(c => !p.judgeZone.some(x => omenName(x) === omenName(c)));
        if (!ok.length) return;
        let c = ok[0];
        if (ok.length > 1) { const a = yield* g.ask(p, { kind: 'pick', options: ok.map(x => x.id), reason: 'emancipatePick', skill: 'emancipate', target: t.seat }); c = ok.find(x => x.id === a) || ok[0]; }
        const as = omenName(c);
        yield* g.moveCards({ cards: [c], to: 'judge', toPlayer: p, reason: 'emancipate' }); c.omenAs = as;
        yield* g.recover(p, 1, p); yield* g.recover(t, 1, p);
        yield* g.draw(p, 3, 'emancipate'); yield* g.draw(t, 3, 'emancipate');
      },
    },
    ai: { play: (g, me, inst, A) => { let bt = null, bv = 0; for (const t of g.alive) { if (t === me || !inst.def.active.targets.filter(g, me, t)) continue; const v = 3 + (A.rel(g, me, t) > 0 ? 2 : A.rel(g, me, t) < -0.3 ? -3.5 : -1); if (v > bv) { bv = v; bt = t; } } return bt ? [{ score: bv, ans: { action: 'skill', skill: inst.key, targets: [bt.seat] } }] : []; } },
  };
  S.address = {
    name: ['演说', 'ADDRESS'], type: 'normal',
    desc: ['出牌阶段限一次，你可以令两名角色拼点：没赢的一方，你弃置其两张牌；若拼点赢的角色不是你，你摸两张牌。', 'Once per Play phase, make two characters contest: you discard two cards of whoever did not win. If the winner is not you, draw 2.'],
    active: {
      cards: { min: 0, max: 0 }, targets: { min: 2, max: 2, filter: (g, p, t) => t.hand.length > 0 },
      can: (g, p) => !p.phaseState.address && g.alive.filter(t => t.hand.length > 0).length >= 2,
      valid: (g, p, cards, targets) => targets.length === 2 && targets[0] !== targets[1] && targets.every(t => t.hand.length > 0),
      *use(g, p, cards, targets) {
        p.phaseState.address = true; const [a, b] = targets;
        const r = yield* g.pindian(a, b, 'address'); if (!r) return;
        yield* g.clearProcessing([r.ca, r.cb]);
        const loser = r.win ? b : a; const winner = r.win ? a : (r.ca.rank === r.cb.rank ? null : b);
        if (!loser.dead && !p.dead && g.cardsIn(loser, 'he').length) {
          const cs = yield* g.chooseCardsOf(p, loser, 'he', 2, 'addressDiscard', { skill: 'address', target: loser.seat });
          if (cs.length) { yield* g.moveCards({ cards: cs, to: 'discard', by: p.seat, reason: 'address' }); for (const c of cs) g.log('discardOf', { by: p.seat, seat: loser.seat, card: c.id }); yield* g.trigger('discarded', { player: loser, cards: cs, by: p, reason: 'address' }); }
        }
        if (winner !== p && !p.dead) yield* g.draw(p, 2, 'address');
      },
    },
    ai: { play: (g, me, inst, A) => { const en = g.alive.filter(t => t !== me && t.hand.length > 0 && A.rel(g, me, t) < -0.15).sort((a, b) => b.cardCount - a.cardCount); if (!en.length) return []; const other = en[1] || g.alive.find(t => t !== en[0] && t !== me && t.hand.length > 0); if (!other) return []; return [{ score: 2.4, ans: { action: 'skill', skill: inst.key, targets: [other.seat, en[0].seat] } }]; } },
  };

  // ── 玻利瓦尔 ──
  H.bolivar = { faction: 'revolution', hp: 4, gender: 'male', skills: ['founder', 'andes'], name: ['玻利瓦尔', 'Bolivar'], title: ['南美解放者', 'The Liberator'], rating: 7 };
  S.founder = {
    name: ['建国', 'FOUNDER'], type: 'locked', locked: true,
    desc: ['锁定技，其他角色的出牌阶段开始时和结束时，若其手牌数不小于你，其交给你一张牌。', 'Compulsory skill. At the start and end of another character\'s Play phase, if they have at least as many cards in hand as you, they give you a card.'],
    triggers: {
      phaseStart: { can: (g, o, d) => d.phase === 'play' && d.player !== o && !d.player.dead && d.player.hand.length >= o.hand.length && d.player.cardCount > 0, *on(g, o, d) { yield* founderTake(g, o, d.player); } },
      phaseEnd: { can: (g, o, d) => d.phase === 'play' && d.player !== o && !d.player.dead && d.player.hand.length >= o.hand.length && d.player.cardCount > 0, *on(g, o, d) { yield* founderTake(g, o, d.player); } },
    },
  };
  function* founderTake(g, o, t) { const [c] = yield* g.chooseOwnCards(t, 1, 1, 'he', 'founderGive', null, { skill: 'founder', to: o.seat }); if (c) yield* g.gainCards(o, [c], 'founder', t); }
  S.andes = {
    name: ['越岭', 'ANDES'], type: 'locked', locked: true,
    desc: ['锁定技，你使用的杀无视目标的护甲。若目标军备区里的牌不少于你，你的杀对其造成的伤害 +1。', "Locked. Your Strikes ignore armor. If the target has at least as many arsenal cards as you, your Strike deals +1 damage to them."],
    triggers: {
      targetConfirmed: { silent: true, can: (g, o, d) => strikeBy(o, d.use), *on(g, o, d) { d.use.data.ignoreArmor = d.use.data.ignoreArmor || new Set(); d.use.targets.forEach(t => d.use.data.ignoreArmor.add(t)); } },
      damageCausing: { can: (g, o, d) => d.from === o && d.use && strikeBy(o, d.use) && d.card === d.use.card && d.to !== o && d.to.equipList.length >= o.equipList.length, *on(g, o, d) { d.amount += 1; } },
    },
  };

  // ── 南丁格尔 ──
  H.nightingale = { faction: 'revolution', hp: 3, gender: 'female', skills: ['lamp', 'tend'], name: ['南丁格尔', 'Nightingale'], title: ['提灯女士', 'The Lady with the Lamp'], rating: 7 };
  S.lamp = {
    name: ['提灯', 'LAMP'], type: 'normal',
    desc: ['你的回合外，你可以将一张红色牌当药使用。出牌阶段限一次，你可以弃置一张手牌，令一名已受伤的角色回复 1 点体力。', 'Outside your turn, you may use any red card as a Remedy. Once per Play phase, you may discard a card from hand to let a wounded character recover 1 health.'],
    viewAs: { patterns: ['remedy'], as: 'remedy', count: 1, zones: 'he', filter: (g, p, c) => c.color === 'red', can: (g, p) => g.current !== p },
    active: {
      cards: { min: 1, max: 1, zones: 'h' }, targets: { min: 1, max: 1, filter: (g, p, t) => t.wounded },
      can: (g, p) => !p.phaseState.lamp && p.hand.length > 0 && g.alive.some(t => t.wounded),
      valid: (g, p, cards, targets) => cards.length === 1 && p.hand.includes(cards[0]) && targets.length === 1 && targets[0].wounded,
      *use(g, p, cards, targets) { p.phaseState.lamp = true; yield* g.discard(p, cards, 'lamp'); yield* g.recover(targets[0], 1, p); },
    },
    ai: { play: (g, me, inst, A) => { const cs = me.hand.slice().sort((a, b) => A.keep(g, me, a) - A.keep(g, me, b)); if (!cs.length) return []; let bt = null, bv = 0; for (const t of g.alive) { if (!t.wounded) continue; const r = A.rel(g, me, t); if (r < 0.3) continue; const v = r * (t.hp <= 1 ? 3 : 1.8) - A.keep(g, me, cs[0]) * 0.3; if (v > bv) { bv = v; bt = t; } } return bt ? [{ score: bv, ans: { action: 'skill', skill: inst.key, cardIds: [cs[0].id], targets: [bt.seat] } }] : []; } },
  };
  S.tend = {
    name: ['救护', 'TEND'], type: 'limited',
    desc: ['限定技，当一名角色进入濒死状态时，你可以令其体力上限调整为 3 并回复所有体力，然后其可以从随机三张同时代且不在场的武将牌中选择一张替换其武将。', 'Limited skill. When a character is dying, you may set their max health to 3 and fully heal them; then they may replace their hero with one of three random heroes of the same era not in play.'],
    triggers: { enterDying: {
      can: (g, o, d) => !o.skillState.tend && !d.player.dead && !o.dead,
      *on(g, o, d) {
        o.skillState.tend = true; const t = d.player;
        yield* g.changeMaxHp(t, 3 - t.maxHp); if (t.dead) return;
        yield* g.recover(t, t.maxHp - t.hp, o);
        const inPlay = new Set(g.players.map(p => p.hero));
        const pool = g.shuffle(Object.keys(H).filter(k => H[k].faction === t.faction && !inPlay.has(k))).slice(0, 3);
        if (!pool.length) return;
        const a = yield* g.ask(t, { kind: 'chooseHero', options: pool, refreshed: pool.map(() => true), optional: true, reason: 'tendPick', skill: 'tend' });
        if (a && a.pick && pool.includes(a.pick)) g.replaceHero(t, a.pick);
      },
    } },
    ai: { confirm: (g, me, req, A) => A.rel(g, me, g.p(req.data.player)) > 0.4 && !me.hand.some(c => c.name === 'remedy') },
  };

  // ── 居里夫人 ──
  H.curie = { faction: 'revolution', hp: 3, gender: 'female', skills: ['radiate', 'laurel'], name: ['居里夫人', 'Marie Curie'], title: ['镭之母', 'The Radiant'], rating: 7 };
  S.radiate = {
    name: ['放射', 'RADIATE'], type: 'locked', locked: true,
    desc: ['锁定技，你攻击范围内的其他角色手牌上限 −1。你造成的伤害均视为体力流失。', 'Compulsory skill. Other characters within your attack range have hand limit −1. All damage you would deal becomes health loss instead.'],
    mods: { handLimit: (g, o, v, p) => (p !== o && !o.dead && g.inAttackRange(o, p)) ? v - 1 : v },
    triggers: { damageCausing: {
      can: (g, o, d) => d.from === o && !d.to.dead,
      *on(g, o, d) { const n = d.amount; d.prevented = true; yield* g.loseHp(d.to, n, 'radiate'); },
    } },
  };
  S.laurel = {
    name: ['双桂', 'LAUREL'], type: 'normal',
    desc: ['出牌阶段限一次，你可以令所有其他角色各展示并交给你一张手牌，然后你可以令交出黑色牌的角色各失去 1 点体力、交出红色牌的角色各回复 1 点体力。', 'Once per Play phase, every other character reveals and gives you a card from hand. Then you may make those who gave black cards lose 1 health and those who gave red cards recover 1.'],
    active: {
      cards: { min: 0, max: 0 }, targets: { min: 0, max: 0 },
      can: (g, p) => !p.phaseState.laurel && g.alive.some(t => t !== p && t.hand.length),
      valid: () => true,
      *use(g, p) {
        p.phaseState.laurel = true; const black = [], red = [];
        for (const q of others(g, p)) {
          if (!q.hand.length || p.dead) continue;
          const [c] = yield* g.chooseOwnCards(q, 1, 1, 'h', 'laurelGive', null, { skill: 'laurel', to: p.seat });
          if (!c) continue; g.log('show', { seat: q.seat, card: c.id });
          (c.color === 'black' ? black : red).push(q);
          yield* g.gainCards(p, [c], 'laurel', q);
        }
        if (black.length && !p.dead) { const ts = yield* g.chooseTargets(p, black.filter(q => !q.dead), 0, black.length, 'laurelLose', { skill: 'laurel' }); for (const q of ts) yield* g.loseHp(q, 1, 'laurel'); }
        if (red.length && !p.dead) { const ts = yield* g.chooseTargets(p, red.filter(q => !q.dead), 0, red.length, 'laurelHeal', { skill: 'laurel' }); for (const q of ts) yield* g.recover(q, 1, p); }
      },
    },
    ai: {
      play: (g, me, inst, A) => { const n = g.alive.filter(t => t !== me && t.hand.length).length; return n >= 2 ? [{ score: 1.5 + n * 0.6, ans: { action: 'skill', skill: inst.key } }] : []; },
      targets: (g, me, req, A) => req.reason === 'laurelLose' ? req.options.filter(s => A.threat(g, me, g.p(s)) > 0.2) : req.options.filter(s => A.rel(g, me, g.p(s)) > 0.3 && g.p(s).wounded),
      cards: (g, me, req, A) => { const t = g.p(req.to); const fr = A.rel(g, me, t) > 0.3; const cs = me.hand.slice().sort((a, b) => A.keep(g, me, a) - A.keep(g, me, b)); const red = cs.filter(c => c.color === 'red'); return [(fr && me.wounded && red.length ? red[0] : cs[0]).id]; },
    },
  };

  // ── 特斯拉 ──
  H.tesla = { faction: 'revolution', hp: 3, gender: 'male', skills: ['current', 'coil'], name: ['特斯拉', 'Tesla'], title: ['电气之神', 'The Electrician'], rating: 7 };
  S.current = {
    name: ['交流', 'CURRENT'], type: 'locked', locked: true,
    desc: ['锁定技，你受到的雷电伤害均改为回复等量体力。', 'Compulsory skill. Thunder damage to you heals you by that amount instead.'],
    triggers: { damageTaking: { can: (g, o, d) => d.to === o && d.nature === 'thunder', *on(g, o, d) { const n = d.amount; d.prevented = true; yield* g.recover(o, n, o); } } },
  };
  S.coil = {
    name: ['线圈', 'COIL'], type: 'normal',
    desc: ['你可以跳过摸牌阶段，令至多 X 名角色横置（X 为你的体力值）；你可以跳过出牌阶段，对一名角色造成 2 点雷电伤害。', 'You may skip your Draw phase to chain up to X characters (X = your health). You may skip your Play phase to deal 2 thunder damage to a character.'],
    triggers: { phaseStart: {
      can: (g, o, d) => d.player === o && (d.phase === 'draw' || d.phase === 'play') && !d.skip,
      *on(g, o, d) {
        if (d.phase === 'draw') {
          d.skip = true; const n = Math.max(0, o.hp);
          const ts = yield* g.chooseTargets(o, g.alive.filter(t => !t.chained), 0, n, 'coilChain', { skill: 'coil', n });
          for (const t of ts) { t.chained = true; g.log('chain', { seat: t.seat, on: true }); }
        } else {
          d.skip = true;
          const [t] = yield* g.chooseTargets(o, g.alive, 1, 1, 'coilTarget', { skill: 'coil' });
          if (t) yield* g.damage({ from: o, to: t, amount: 2, nature: 'thunder' });
        }
      },
    } },
    ai: {
      confirm: (g, me, req, A) => {
        const en = g.alive.filter(t => A.threat(g, me, t) > 0.3);
        if (req.data && g.phase === 'draw') return en.filter(t => !t.chained).length >= 2 && me.hand.length >= 3;
        return en.length > 0 && me.hand.filter(c => g.playable(me, c)).length <= 1;
      },
      targets: (g, me, req, A) => {
        if (req.reason === 'coilChain') return req.options.filter(s => A.threat(g, me, g.p(s)) > 0.2).slice(0, req.max);
        const c = req.options.map(s => g.p(s)).sort((a, b) => A.threat(g, me, b) - A.threat(g, me, a)); return [c[0].seat];
      },
    },
  };

  // ── 贝多芬 ──
  H.beethoven = { faction: 'revolution', hp: 3, gender: 'male', skills: ['destiny', 'joy'], name: ['贝多芬', 'Beethoven'], title: ['乐圣', 'The Titan'], rating: 7 };
  S.destiny = {
    name: ['命运', 'DESTINY'], type: 'locked', locked: true,
    desc: ['锁定技，你的回合开始时，所有其他角色随机展示一张手牌：若黑色牌多，你翻面并失去 1 点体力；若红色牌多，你将体力回复至上限并摸三张牌；若一样多，你获得这些展示的牌。', 'Compulsory skill. At the start of your turn, every other character reveals a random card from hand. More black: turn face down and lose 1 health. More red: recover to full and draw 3. Tied: take the revealed cards.'],
    triggers: { turnStart: {
      can: (g, o, d) => d.player === o,
      *on(g, o) {
        const shown = [];
        for (const q of others(g, o)) if (q.hand.length) { const c = g.pick(q.hand); shown.push(c); g.log('show', { seat: q.seat, card: c.id }); }
        const b = shown.filter(c => c.color === 'black').length, r = shown.filter(c => c.color === 'red').length;
        if (b > r) { o.faceDown = !o.faceDown; g.log('flip', { seat: o.seat, faceDown: o.faceDown }); yield* g.loseHp(o, 1, 'destiny'); }
        else if (r > b) { yield* g.recover(o, o.maxHp - o.hp, o); yield* g.draw(o, 3, 'destiny'); }
        else if (shown.length) yield* g.gainCards(o, shown, 'destiny');
      },
    } },
  };
  S.joy = {
    name: ['欢乐', 'JOY'], type: 'normal',
    desc: ['每回合限一次，当你一次性获得不少于两张牌后，你可以令至多 X 名其他角色各摸一张牌（X 为你的体力值）。', 'Once per turn, after you gain two or more cards at once, you may let up to X other characters draw 1 each (X = your health).'],
    triggers: { afterMove: {
      can: (g, o, d) => !o.dead && o.marks.joy !== (g.turnSeq || 0) && d.moves.filter(m => m.to === 'hand' && m.toSeat === o.seat && !(m.from && m.from.zone === 'hand' && m.from.seat === o.seat)).length >= 2 && o.hp > 0,
      *on(g, o) {
        o.marks.joy = g.turnSeq || 0;
        const ts = yield* g.chooseTargets(o, g.alive.filter(q => q !== o), 0, Math.max(0, o.hp), 'joyTarget', { skill: 'joy', n: o.hp });
        for (const t of ts) yield* g.draw(t, 1, 'joy');
      },
    } },
    ai: { confirm: (g, me, req, A) => g.alive.some(q => q !== me && A.rel(g, me, q) > 0.4), targets: (g, me, req, A) => req.options.filter(s => A.rel(g, me, g.p(s)) > 0.4).slice(0, req.max) },
  };

  // ── 达尔文 ──
  H.darwin = { faction: 'revolution', hp: 3, gender: 'male', skills: ['evolve', 'fittest'], name: ['达尔文', 'Darwin'], title: ['博物学家', 'The Naturalist'], rating: 6 };
  S.evolve = {
    name: ['演化', 'EVOLVE'], type: 'locked', locked: true,
    desc: ['锁定技，你的摸牌阶段摸牌数 +1，出牌阶段使用杀的次数上限 +1。你的药视为杀，你的闪视为酒。', 'Compulsory skill. Draw 1 more card in your Draw phase and use 1 more Strike per turn. Your Remedies count as Strikes and your Parries count as Grog.'],
    triggers: { drawCount: { can: (g, o, d) => d.player === o, silent: true, *on(g, o, d) { d.n += 1; } } },
    mods: {
      strikeLimit: (g, o, v, p) => p === o ? v + 1 : v,
      forbid: (g, o, v, p, c) => (p === o && (c.name === 'remedy' || c.name === 'parry')) ? true : v,
    },
    viewAs: {
      patterns: ['strike', 'grog'], count: 1, zones: 'h',
      filter: (g, p, c, ctx) => { const pats = ctx && ctx.pattern ? [].concat(ctx.pattern) : null; return (c.name === 'remedy' && (!pats || pats.includes('strike'))) || (c.name === 'parry' && (!pats || pats.includes('grog'))); },
      as: (g, p, cs) => cs[0].name === 'remedy' ? 'strike' : 'grog',
    },
  };
  S.fittest = {
    name: ['适者', 'FITTEST'], type: 'locked', locked: true,
    desc: ['锁定技，你的体力值不能大于 1，你的手牌上限等于你的体力上限。当你进入或脱离濒死状态时，你摸两张牌。', 'Compulsory skill. Your health can never exceed 1, and your hand limit equals your max health. When you enter or leave the dying state, draw 2.'],
    mods: { handLimit: (g, o, v, p) => p === o ? o.maxHp : v },
    triggers: {
      gameStart: { silent: true, can: (g, o) => o.hp > 1, *on(g, o) { o.hp = 1; } },
      recovering: { silent: true, can: (g, o, d) => d.player === o, *on(g, o, d) { d.amount = Math.min(d.amount, 1 - o.hp); if (d.amount <= 0) d.prevented = true; } },
      enterDying: { can: (g, o, d) => d.player === o, *on(g, o) { yield* g.draw(o, 2, 'fittest'); } },
      leaveDying: { can: (g, o, d) => d.player === o && !o.dead, *on(g, o) { yield* g.draw(o, 2, 'fittest'); } },
    },
  };

  // ── 塔布曼 ──
  H.tubman = { faction: 'revolution', hp: 3, gender: 'female', skills: ['railroad', 'neverlost'], name: ['塔布曼', 'Tubman'], title: ['自由向导', 'The Conductor'], rating: 7 };
  S.railroad = {
    name: ['暗渡', 'RAILROAD'], type: 'normal',
    desc: ['当其他角色使用杀指定目标时，你可以获得其一张手牌，然后选择一项未执行过的：1. 此杀不能被闪响应；2. 此杀无效；3. 将此杀的目标改为你；4. 目标于此杀结算后回复 1 点体力。四项都执行过后，重置为都未执行过。', "When another character's Strike picks its targets, you may take a card from their hand, then choose an option not yet used: 1. it cannot be Parried; 2. it has no effect; 3. redirect it to you; 4. its targets recover 1 health after it resolves. Once all four are used, they reset."],
    triggers: {
      targeting: {
        can: (g, o, d) => d.use.from && d.use.from !== o && isStrike(d.use.card) && d.use.from.hand.length > 0 && !o.dead && !d.use.opts.response,
        *on(g, o, d) {
          const u = d.use; const src = u.from;
          const c = yield* g.chooseCardOf(o, src, 'h', 'railroad', { skill: 'railroad' }); if (c) yield* g.gainCards(o, [c], 'railroad', src);
          const used = o.skillState.railroad = o.skillState.railroad || [false, false, false, false];
          const avail = [0, 1, 2, 3].filter(i => !used[i] && !(i === 2 && (u.targets.includes(o) && u.targets.length === 1)));
          if (!avail.length) return;
          const k = yield* g.chooseOption(o, avail.map(i => 'rr' + i), 'railroadOpt', { skill: 'railroad' });
          const opt = avail[k] != null ? avail[k] : avail[0];
          used[opt] = true; if (used.every(Boolean)) o.skillState.railroad = [false, false, false, false];
          if (opt === 0) u.targets.forEach(t => u.noResponse.add(t));
          else if (opt === 1) u.targets.forEach(t => u.nullified.add(t));
          else if (opt === 2) { if (g.targetAllowed(src, o, u.card)) u.targets = [o]; }
          else u.data.railroadHeal = u.targets.slice();
        },
      },
      cardUsed: { optional: false, silent: true, can: (g, o, d) => Array.isArray(d.use.data.railroadHeal), *on(g, o, d) { const ts = d.use.data.railroadHeal; d.use.data.railroadHeal = null; for (const t of ts) if (!t.dead) yield* g.recover(t, 1, o); } },
    },
    ai: {
      confirm: (g, me, req, A) => { const u = A.lastUse(g); if (!u) return false; const ts = u.targets.map(s => g.p(s)); return ts.some(t => A.rel(g, me, t) > 0.3) || A.rel(g, me, g.p(u.seat)) < -0.2; },
      option: (g, me, req, A) => {
        const u = A.lastUse(g); const ts = u ? u.targets.map(s => g.p(s)) : []; const friendHit = ts.some(t => A.rel(g, me, t) > 0.3); const enemyHit = ts.some(t => A.threat(g, me, t) > 0.3);
        const pref = friendHit ? ['rr1', 'rr2', 'rr3', 'rr0'] : enemyHit ? ['rr0', 'rr3', 'rr1', 'rr2'] : ['rr1', 'rr3', 'rr0', 'rr2'];
        for (const o of pref) { const i = req.options.indexOf(o); if (i >= 0 && !(o === 'rr2' && me.hp <= 1)) return i; }
        return 0;
      },
    },
  };
  S.neverlost = {
    name: ['无失', 'NEVERLOST'], type: 'locked', locked: true,
    desc: ['锁定技，若你没有手牌，你不能成为杀和决斗的目标。', 'Compulsory skill. While you have no cards in hand, you cannot be targeted by Strikes or Duels.'],
    mods: { canTarget: (g, o, v, user, t, card) => (v && t === o && o.hand.length === 0 && (isStrike(card) || card.name === 'duel')) ? false : v },
  };

  // ── 革新主公技：号召 ──
  S.uprise = {
    name: ['号召', 'UPRISE'], type: 'lord',
    desc: ['主公技，其他革新角色的出牌阶段，其可以交给你一张杀或闪（每阶段限一次）。', 'Lord skill. During their Play phase, other Revolution characters may give you a Strike or Parry (once per phase).'],
    triggers: { gameStart: { optional: false, silent: true, can: () => true, *on(g, o) { for (const q of g.players) if (q !== o && q.faction === 'revolution') g.gainSkill(q, 'uprisegive'); } } },
  };
  S.uprisegive = {
    name: ['号召', 'UPRISE'], type: 'normal', hidden: true,
    desc: ['出牌阶段限一次，你可以将一张杀或闪交给执笔者。', 'Once per Play phase, you may give a Strike or Parry to the Chancellor.'],
    active: {
      cards: { min: 1, max: 1, zones: 'h', filter: (g, p, c) => c.name === 'parry' || isStrike(c) }, targets: { min: 0, max: 0 },
      can: (g, p) => !p.phaseState.uprise && p.hand.some(c => c.name === 'parry' || isStrike(c)) && g.players.some(q => q.role === 'chancellor' && !q.dead && q.skills.includes('uprise')),
      valid: (g, p, cards) => cards.length === 1 && p.hand.includes(cards[0]) && (cards[0].name === 'parry' || isStrike(cards[0])),
      *use(g, p, cards) { p.phaseState.uprise = true; const s = g.players.find(q => q.role === 'chancellor'); yield* g.gainCards(s, cards, 'uprise', p); },
    },
    ai: { play: (g, me, inst, A) => { const s = g.players.find(q => q.role === 'chancellor'); if (!s || A.rel(g, me, s) < 0.5) return []; const cs = me.hand.filter(c => c.name === 'parry' || isStrike(c)); if (!cs.length || (cs.length < 2 && s.hand.length > 1)) return []; return [{ score: 1.2, ans: { action: 'skill', skill: inst.key, cardIds: [cs[0].id] } }]; } },
  };
  E.Game.lordSkills.revolution = 'uprise';

  return { FACTIONS, OPTION_TEXT, PROMPT_TEXT, adjacent };
});
