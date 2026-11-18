/* 群星议会 — 文本（中 / 英）：牌名、牌面效果、界面文字、战报 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./qx-engine.js'), require('./qx-cards.js'));
  else root.QXText = factory(root.QXEngine, root.QXCards);
})(typeof self !== 'undefined' ? self : this, function (E, QC) {
  'use strict';
  const NAME = QC.CARD_TEXT;

  const DESC = {
    strike: ['出牌阶段限一次，对攻击范围内的一名其他角色使用：其须使用一张闪，否则受到 1 点伤害。', 'Once per Play phase, target another character within your attack range. They must use a Parry or take 1 damage.'],
    fire_strike: ['同杀，造成的是火焰伤害。', 'As Strike, but deals fire damage.'],
    thunder_strike: ['同杀，造成的是雷电伤害。', 'As Strike, but deals thunder damage.'],
    parry: ['抵消一张对你使用的杀。', 'Cancel a Strike used on you.'],
    remedy: ['出牌阶段对自己使用，回复 1 点体力；或对濒死的角色使用，令其回复 1 点体力。', 'Recover 1 health during your Play phase, or use on a dying character to restore 1 health.'],
    grog: ['每回合限一次，出牌阶段使用：本回合你的下一张杀伤害 +1。濒死时可对自己使用，回复 1 点体力。', 'Once per turn in your Play phase: your next Strike this turn deals +1 damage. When dying, use on yourself to recover 1 health.'],
    duel: ['对一名其他角色使用：由其开始，双方轮流打出杀，先不出的一方受到对方造成的 1 点伤害。', 'Target another character. Starting with them, you take turns playing Strikes. The first who cannot takes 1 damage from the other.'],
    sabotage: ['弃置一名其他角色手牌、军备区或天兆区里的一张牌。', "Discard one card from another character's hand, arsenal, or omen area."],
    pilfer: ['获得距离为 1 的一名其他角色手牌、军备区或天兆区里的一张牌。', 'Take one card from the hand, arsenal, or omen area of a character at distance 1.'],
    windfall: ['摸两张牌。', 'Draw 2 cards.'],
    catspaw: ['出牌阶段，对一名其他角色使用：其视为对其攻击范围内另一名由你指定的角色使用一张杀；若此杀没有造成伤害，其视为对你使用一张杀。', 'Target another character and name a victim within their attack range. They are treated as using a Strike on the victim. If it deals no damage, they are treated as using a Strike on you.'],
    invasion: ['所有其他角色须打出一张杀，否则受到 1 点伤害。', 'All other characters must play a Strike or take 1 damage.'],
    arrowstorm: ['所有其他角色须打出一张闪，否则受到 1 点伤害。', 'All other characters must play a Parry or take 1 damage.'],
    respite: ['所有角色各回复 1 点体力。', 'Every character recovers 1 health.'],
    feast: ['亮出牌堆顶与存活角色数相同数量的牌，从你开始，每名角色依次获得其中一张。', 'Reveal one card per living character. Starting with you, each character takes one.'],
    veto: ['抵消一张谋略牌或天兆牌对一名角色的效果。', "Cancel a Stratagem's or Omen's effect on one character."],
    greekfire: ['令一名有手牌的角色展示一张手牌，然后你可以弃置一张同花色手牌，对其造成 1 点火焰伤害。', 'A character with cards in hand reveals one. You may discard a card of the same suit to deal 1 fire damage to them.'],
    chainshot: ['横置或重置至多两名角色。也可以重铸：弃置此牌并摸一张牌。', 'Chain or unchain up to two characters. May instead be recast: discard it and draw 1.'],
    damocles: ['置于你的天兆区。判定阶段进行天意判定：若为黑桃 2–9，你受到 3 点雷电伤害；否则将其移至下家。', 'Place in your omen area. Fate: on ♠2–9 you take 3 thunder damage; otherwise it passes to the next player.'],
    lotus: ['置于一名其他角色的天兆区。其判定阶段进行天意判定：若不为红桃，其跳过出牌阶段。', "Place in another character's omen area. Fate: unless ♥, they skip their Play phase."],
    blockade: ['置于距离为 1 的一名其他角色的天兆区。天意判定若不为梅花，其跳过摸牌阶段。', "Place in the omen area of a character at distance 1. Fate: unless ♣, they skip their Draw phase."],
    gatling: ['出牌阶段你使用杀不限次数。', 'You may use any number of Strikes in your Play phase.'],
    excalibur: ['锁定技，你的杀无视目标的护甲。', "Locked. Your Strikes ignore the target's armor."],
    gemini: ['你的杀指定异性角色后，可以令其选择一项：弃置一张手牌，或令你摸一张牌。', 'After your Strike targets a character of the other gender, they must discard a card from hand or let you draw 1.'],
    winter: ['你的杀造成伤害时，可以防止此伤害，改为弃置其两张牌。', 'When your Strike would deal damage, you may prevent it and discard two of their cards instead.'],
    misericorde: ['锁定技，你的杀对没有手牌的角色造成的伤害 +1。', 'Locked. Your Strikes deal +1 damage to characters with no cards in hand.'],
    berserker: ['你的杀被闪抵消后，可以对其再使用一张杀。', 'After your Strike is parried, you may use another Strike on the same target.'],
    sarissa: ['你可以将两张手牌当杀使用或打出。', 'You may use or play two cards from your hand as a Strike.'],
    ram: ['你的杀被闪抵消后，可以弃置两张牌，令此杀依然命中。', 'After your Strike is parried, you may discard two cards to make it hit anyway.'],
    trident: ['你使用的杀是你最后的手牌时，可以额外指定至多两个目标。', 'If your Strike is your last card in hand, it may target up to two more characters.'],
    arquebus: ['你可以将普通杀当火杀使用。', 'You may use a plain Strike as a Fire Strike.'],
    longbow: ['你的杀造成伤害时，可以弃置其一匹战马。', 'When your Strike deals damage, you may discard one of their mounts.'],
    aegis: ['当你需要使用或打出闪时，可以进行天意判定：若为红色，视为你使用或打出了一张闪。', 'When you need a Parry, you may invoke Fate: on red, it counts as a Parry.'],
    testudo: ['锁定技，黑色杀对你无效。', 'Locked. Black Strikes have no effect on you.'],
    linothorax: ['锁定技，普通杀、铁蹄压境、万箭齐发对你无效；你受到的火焰伤害 +1。', 'Locked. Plain Strikes, Invasion, and Arrowstorm have no effect on you. Fire damage to you is increased by 1.'],
    nemean: ['锁定技，你每次受到的伤害至多为 1 点；你失去此牌时，回复 1 点体力。', 'Locked. You take at most 1 damage at a time. When you lose this card, recover 1 health.'],
  };
  const PLUS = ['其他角色与你的距离 +1。', 'Other characters are 1 farther from you.'];
  const MINUS = ['你与其他角色的距离 −1。', 'You are 1 closer to other characters.'];
  for (const n of ['bucephalus', 'babieca', 'marengo', 'copenhagen']) DESC[n] = PLUS;
  for (const n of ['pegasus', 'sleipnir', 'arion']) DESC[n] = MINUS;

  const CATEGORY = { basic: ['基本牌', 'BASIC'], stratagem: ['谋略牌', 'STRATAGEM'], omen: ['天兆牌', 'OMEN'], equip: ['军备牌', 'ARSENAL'] };
  const SUBTYPE = { weapon: ['武器', 'Weapon'], armor: ['护甲', 'Armor'], plus: ['守御战马', 'Destrier'], minus: ['进击战马', 'Charger'] };
  const ROLE = { chancellor: ['执笔者', 'The Chancellor'], keeper: ['护卷人', 'The Keeper'], insurgent: ['焚卷人', 'The Insurgent'], schemer: ['伏笔者', 'The Schemer'] };
  const PHASE = { prepare: ['准备', 'Prepare'], judge: ['判定', 'Judge'], draw: ['摸牌', 'Draw'], play: ['出牌', 'Play'], discard: ['弃牌', 'Discard'], finish: ['结束', 'Finish'] };
  const PHASEL = { prepare: ['回合开始', 'Turn Start'], judge: ['判定阶段', 'Judge Phase'], draw: ['摸牌阶段', 'Draw Phase'], play: ['出牌阶段', 'Play Phase'], discard: ['弃牌阶段', 'Discard Phase'], finish: ['回合结束', 'Turn End'] };
  const SUIT = { spade: '♠', heart: '♥', club: '♣', diamond: '♦', none: '', black: '', red: '' };
  const SUITNAME = { spade: ['黑桃', 'Spade'], heart: ['红桃', 'Heart'], club: ['梅花', 'Club'], diamond: ['方块', 'Diamond'] };
  const NATURE = { normal: ['', ''], fire: ['火焰', 'fire '], thunder: ['雷电', 'thunder '] };
  const RANK = r => ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[r] || (r ? String(r) : ''));

  // 界面文字
  const ROMAN = [null, 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'];
  const UI = {
    title: ['群星议会', 'The Hall of Ages'],
    newGame: ['新开一局', 'New Game'],
    distBtn: ['分发', 'Give'], distTip: ['挣锁：选牌和一名角色，点「分发」交给他；点「取消」全部留下。', 'Unchain: pick cards and a character, then Give. Cancel keeps them.'],
        fullOn: ['全屏', 'Full Screen'], fullExit: ['退出全屏', 'Exit Full Screen'],
    fbBtn: ['问题反馈', 'Report Issue'], fbTitle: ['记录一个问题', 'Note an Issue'], fbPh: ['哪里不对？比如：刚才弃牌动画卡住了', 'What looked wrong? e.g. the discard animation just froze'],
    fbSave: ['记下', 'Save Note'], fbClose: ['关闭', 'Close'], fbExport: ['下载反馈文件', 'Download Feedback File'], fbCopy: ['复制反馈内容', 'Copy Feedback'],
    fbCount: ['本次已记 {n} 条', '{n} noted so far'], fbCopied: ['已复制', 'Copied'], fbTip: ['按 F2 也能随时打开。记下后游戏继续；最后下载文件放进 qunxing-handoff 文件夹即可，我能原样重放这局。', 'Press F2 anytime to open this. The game keeps running; at the end, download the file and put it in the qunxing-handoff folder so the game can be replayed exactly.'],
 players5: ['五人军争', '5 Players'], players8: ['八人军争', '8 Players'],
    yourRole: ['你的身份', 'Your Role'], random: ['随机', 'Random'], speed: ['速度', 'Speed'],
    slow: ['慢', 'Slow'], normal: ['中', 'Normal'], fast: ['快', 'Fast'], start: ['开始', 'Start'],
    lang: ['English', 'Chinese'],
    confirm: ['确定', 'Confirm'], cancel: ['取消', 'Cancel'], endPlay: ['结束出牌', 'End Phase'], recast: ['重铸', 'Recast'],
    yes: ['发动', 'Yes'], no: ['不发动', 'No'],
    deck: ['牌堆', 'Deck'], discardPile: ['弃牌堆', 'Discard'], round: ['第 {n} 轮', 'Round {n}'],
    hp: ['体力', 'Health'], hand: ['手牌', 'Hand'], noEquip: ['无军备', 'No Arsenal'], chained: ['横置', 'Chained'], faceDown: ['翻面', 'Face Down'],
    dead: ['阵亡', 'Fallen'], dying: ['濒死', 'Dying'], you: ['你', 'You'], seat: ['{n}', '{n}'],
    unknownRole: ['？', '?'], log: ['战报', 'Battle Log'], current: ['当前回合', 'Current Turn'],
    handCard: ['手牌 {n}', 'Hand Card {n}'], omens: ['天兆区', 'Omens'], arsenal: ['军备区', 'Arsenal'],
    waiting: ['等待其他角色……', 'Waiting for others...'],
    thinking: ['{s} 正在思考……', '{s} is thinking...'],
    waitSave: ['等待{s}出【{c}】', 'Waiting for {s} to use {c}...'], waitVeto: ['等待{s}使用【{c}】', 'Waiting for {s} to use {c}...'], waitResp: ['等待{s}出【{c}】', 'Waiting for {s} to play {c}...'],
    fallenAs: ['{r}阵亡', '{r} Has Fallen'],
    viewAsPick: ['【{k}】：选择 {n} 张牌当【{c}】使用或打出。', '{k}: choose {n} card(s) to use as {c}.'],
    viewAsPick0: ['【{k}】：选择 {n} 张牌。', '{k}: choose {n} card(s).'],
    playBtn: ['出牌', 'Play'], pickN: ['选择 {n} 张牌', 'Choose {n} cards'], arrangeTip: ['拖动调整顺序；拖到下面一行即放到牌堆底（单击可在两行之间切换）', 'Drag to reorder; drag into the lower row to put a card on the bottom (click to switch rows)'],
    deckTop: ['牌堆顶', 'Deck Top'], deckBottom: ['牌堆底', 'Deck Bottom'], pdWait: ['等待出牌', 'Waiting'], pdWin: ['赢', 'Won'], pdNoWin: ['没赢', 'Did Not Win'],
        rvShown: ['亮出', 'Shown'], rvTake: ['获得', 'Take'], rvTip: ['把要获得的牌拖到下面一排（每种花色各一张，共 {n} 张）', 'Drag the cards you take into the lower row (one of each suit, {n} in all)'], rvWait: ['{s} 正在挑选', '{s} is choosing'],
    waitVetoAll: ['等待其他角色使用【{c}】', 'Waiting for others to use {c}...'], asCard: ['{c}', '{c}'],
    feastWait: ['每名角色依次选择一张', 'Each character takes one card in turn'], pindianTitle: ['拼点', 'Contest'],
    markRole: ['点击标记身份（仅自己可见）', 'Click to mark a role (only you see it)'], unmark: ['取消标记', 'Clear Mark'],
    slot_weapon: ['武器', 'Weapon'], slot_armor: ['防具', 'Armor'], slot_minus: ['−1 坐骑', '−1 Mount'], slot_plus: ['+1 坐骑', '+1 Mount'],
    cap_use: ['{s}使用', '{s} used'], cap_useOn: ['{s}对{t}', '{s} → {t}'], cap_play: ['{s}打出', '{s} played'],
    cap_discard: ['{s}弃置', '{s} discarded'], cap_discardOf: ['{s}被弃置', 'Discarded from {s}'], cap_judge: ['{s}的天意牌', '{s}\'s Fate card'],
    cap_pindian: ['{s}拼点', '{s} contest'], cap_recast: ['{s}重铸', '{s} recast'], cap_reveal: ['亮出', 'Revealed'], cap_retouch: ['{s}改判', '{s} retouched'],
    gameOver: ['对局结束', 'Game Over'], winners: ['{w}获胜', 'Winner: {w}'], draw: ['平局', 'Draw'], again: ['再来一局', 'Play Again'],
    youWin: ['你赢了！', 'You Win!'], youLose: ['你输了', 'You Lose'],
    note: ['右键（手机上长按）任意一张牌可查看大图；点击「规则书」查看完整规则。', 'Right-click (or long-press on a phone) any card to see it full size. Open the Rulebook for the full rules.'],
    rules: ['规则书', 'Rulebook'], close: ['关闭', 'Close'],
    level: ['AI 难度', 'AI Level'], easy: ['简单', 'Easy'], medium: ['普通', 'Normal'], hard: ['困难', 'Hard'],
    distance: ['距离 {n}', 'Distance {n}'], range: ['攻击范围 {n}', 'Attack Range {n}'],
    discardOpt: ['弃置一张手牌', 'Discard a Card'], letDraw: ['令对方摸一张牌', 'Let Them Draw'],
    chooseHero: ['选择武将', 'Choose Your Hero'], refresh: ['换一个', 'Swap'], pickHero: ['选这个', 'Pick'],
    sovIs: ['执笔者是 {h}', 'The Chancellor is {h}'], hpN: ['体力 {n}', 'Health {n}'], hpNow: ['体力 {h}/{m}', 'Health {h}/{m}'], used: ['已发动', 'Used'],
    lordTag: ['主公技', 'Lord skill'], lockedTag: ['锁定技', 'Compulsory skill'], limitedTag: ['限定技', 'Limited skill'], awakenTag: ['觉醒技', 'Awakening skill'],
    pickSkill: ['{k}：请选择{c}{tg}。', '{k}: choose {c}{tg}.'], nCards: ['{n} 张牌', '{n} card(s)'], nTargets: ['{n} 名角色', '{n} character(s)'], and: ['和', ' and '],
  };

  // 提示文字
  const P = {
    play: ['出牌阶段：选择一张牌使用，或结束出牌。', 'Play phase: choose a card to use, or end the phase.'],
    pickTarget1: ['选择【{c}】的目标。', 'Choose a target for {c}.'], pickTargetsN: ['选择【{c}】的 {n} 个目标。', 'Choose {n} targets for {c}.'],
    pickTargets: ['选择【{c}】的目标（{min}–{max} 名）。', 'Choose targets for {c} ({min}–{max}).'],
    pickTargetsCat: ['驱虎吞狼：先选一名其他角色，再选其攻击范围内的另一名角色。', "Cat's Paw: pick another character, then a victim within their attack range."],
    sarissa: ['萨里沙长矛：选择两张手牌当杀。', 'Sarissa: choose two cards from hand to use as a Strike.'],
    r_strike: ['{s} 对你使用了【杀】，请使用【闪】。', '{s} used a Strike on you. Use a Parry.'],
    r_strike2: ['{s} 对你使用了【杀】，须连续使用 {n} 张【闪】（已出 {g} 张）。', '{s} used a Strike on you. You need {n} Parries ({g} used).'],
    r_duel: ['决斗（对手 {s}）：请打出【杀】。', 'Duel against {s}: play a Strike.'],
    r_invasion: ['铁蹄压境：请打出【杀】，否则受到 1 点伤害。', 'Invasion: play a Strike or take 1 damage.'],
    r_arrowstorm: ['万箭齐发：请打出【闪】，否则受到 1 点伤害。', 'Arrowstorm: play a Parry or take 1 damage.'],
    r_save: ['{t} 濒死，是否对其使用【药】？', '{t} is dying. Use a Remedy on them?'],
    r_saveSelf: ['你濒死了，是否使用【药】或【酒】？', 'You are dying. Use a Remedy or Grog?'],
    r_veto: ['是否使用【无懈可击】抵消 {f} 的【{c}】{t}？', 'Use Veto to cancel {c} from {f}{t}?'],
    r_vetoTarget: ['（对 {t}）', ' (on {t})'], r_vetoOmen: ['是否使用【无懈可击】抵消 {t} 天兆区的【{c}】？', "Use Veto to cancel the {c} in {t}'s omen area?"],
    r_vetoVeto: ['是否使用【无懈可击】抵消 {f} 的【无懈可击】？', "Use Veto to cancel {f}'s Veto?"],
    r_generic: ['请使用或打出：{p}', 'Use or play: {p}'],
    phaseDiscard: ['弃牌阶段：请弃置 {n} 张手牌。', 'Discard phase: discard {n} card(s).'],
    greekfireShow: ['火攻：请展示一张手牌。', 'Greek Fire: reveal a card from your hand.'],
    greekfire: ['火攻：可以弃置一张{s}手牌，造成 1 点火焰伤害。', 'Greek Fire: you may discard a {s} card to deal 1 fire damage.'],
    gemini: ['双子剑：请弃置一张手牌。', 'Gemini: discard a card from hand.'],
    ram: ['攻城锤：弃置两张牌，令此杀依然命中。', 'Battering Ram: discard two cards to make the Strike hit.'],
    chooseCards: ['请选择 {min}–{max} 张牌。', 'Choose {min}–{max} card(s).'],
    c_sabotage: ['釜底抽薪：选择 {t} 的一张牌弃置。', "Sabotage: choose one of {t}'s cards to discard."],
    c_pilfer: ['探囊取物：选择 {t} 的一张牌获得。', "Pilfer: choose one of {t}'s cards to take."],
    c_winter: ['冬将军：选择 {t} 的一张牌弃置。', "General Winter: choose one of {t}'s cards to discard."],
    c_generic: ['选择 {t} 的一张牌。', "Choose one of {t}'s cards."],
    pick_feast: ['联军盛宴：选择一张牌获得。', 'Feast: choose a card to take.'],
    askSkill: ['是否发动【{k}】？', 'Activate {k}?'],
    confirmEquip: ['是否发动【{c}】的效果？', 'Use the effect of {c}?'],
        us_berserker: ['狂战士斧：可以继续对 {t} 使用一张【杀】。', 'Berserker: you may use another Strike on {t}.'],
    us_generic: ['选择一张【杀】使用。', 'Choose a Strike to use.'],
    option: ['请选择：', 'Choose:'], order: ['选择先发动的效果：', 'Choose which effect resolves first:'],
    targets: ['选择 {min}–{max} 名角色。', 'Choose {min}–{max} character(s).'],
  };

  // ───────── 规则书 ─────────
  function rulesHTML(L) {
    const e = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const zh = !L;
    const cardRows = (types) => (QC.DATA || []).filter(c => types.includes(c.type)).map(c => {
      const eff = c.effect_zh ? (zh ? c.effect_zh : c.effect_en) : (DESC[c.key] ? DESC[c.key][L] : '');
      const extra = c.range ? (zh ? `（攻击范围 ${c.range}）` : ` (range ${c.range})`) : c.distance ? ` (${c.distance > 0 ? '+1' : '−1'})` : '';
      return `<tr><td>${e(zh ? c.zh : c.en.replace(/\u2019/g, "'"))}${e(extra)}</td><td>${e(eff)}</td></tr>`;
    }).join('');
    if (zh) return `
<h4>开篇 · 万代之厅</h4>
<p class="qx-lore">历史不是一条河，而是一本永远写不完的书。在所有时代之外，有一座没有门的「万代之厅」，厅中一张圆桌，桌上方悬着长明灯。每当人类走到真正的岔路口，长明灯便亮起，把各个时代最伟大的人召到圆桌前。每召来一个时代的人，厅中就多亮起一盏灯。</p>
<p class="qx-lore">圆桌正中放着一支「历史之笔」：谁握着它，谁就在这本书的下一页落下第一个字。议会先推举一人执笔，而圆桌边的每个人各怀立场。</p>
<p class="qx-lore">在厅中没人真正死去：体力是一个人在历史上留下的「分量」，受伤即分量被削去；分量耗尽者在灯影中淡去，回到自己的那一页，失去这一次书写历史的资格（即阵亡出局）。</p>
<h4>身份</h4>
<table><tr><th>身份</th><th>立场</th></tr>
<tr><td>执笔者</td><td>握笔之人，身份一开局就公开。五人及以上对局体力上限 +1，并获得本阵营的主公技。</td></tr>
<tr><td>护卷人</td><td>相信笔在执笔者手里历史不会走向深渊，守护执笔者。</td></tr>
<tr><td>焚卷人</td><td>认定笔落错了人，要焚卷重来。</td></tr>
<tr><td>伏笔者</td><td>暗中布局，只想成为最后的执笔者。</td></tr></table>
<p>五人局：执笔者、护卷人、焚卷人 ×2、伏笔者。八人局：执笔者、护卷人 ×2、焚卷人 ×4、伏笔者。除执笔者外，身份牌背面朝上，只有自己能看到；角色阵亡时翻开身份牌。</p>
<h4>胜负</h4>
<p>执笔者倒下：若场上只剩伏笔者，伏笔者获胜；否则焚卷人获胜。焚卷人与伏笔者全部倒下：执笔者与护卷人获胜。胜负一旦确定，对局立即结束。</p>
<p>击杀焚卷人的角色摸三张牌；执笔者误杀护卷人，须弃置所有手牌和军备区里的牌。</p>
<h4>选将</h4>
<p>执笔者先从 8 名武将中选一名（每个时代至少 2 名），其他角色再各从 5 名中选一名（每个时代至少 1 名）。每名候选武将可以换一次。</p>
<h4>回合流程</h4>
<p>回合开始 → 准备阶段 → 判定阶段（天兆区里后放入的牌先进行天意判定）→ 摸牌阶段（摸两张）→ 出牌阶段（【杀】每阶段限一次，【酒】每回合限一次）→ 弃牌阶段（手牌数不能超过体力值）→ 结束阶段 → 回合结束。</p>
<h4>体力与濒死</h4>
<p>武将牌右上角画的体力格只表示这名武将的体力上限；当前体力显示在座位上武将牌旁的红色体力珠里（例如 3/4）。右键（手机上长按）武将牌可以查看大图。</p>
<p>体力降到 0 时进入濒死状态，从当前回合角色开始按座次询问是否对其使用【药】（濒死的角色自己也可以用【酒】）。体力仍不大于 0 则阵亡出局。</p>
<h4>距离与攻击范围</h4>
<p>距离按座次数较近的一侧计算，守御战马 +1、进击战马 −1，至少为 1。攻击范围默认为 1，装备武器后等于武器的攻击范围。</p>
<h4>基本牌</h4><table>${cardRows(['basic'])}</table>
<p>【火杀】与【雷杀】：同【杀】，分别造成火焰伤害和雷电伤害（牌面用【杀】的图，带火焰或闪电标记）。处于横置状态的角色受到火焰或雷电伤害后，会把同样的伤害传导给其他横置的角色。</p>
<h4>谋略牌</h4><table>${cardRows(['stratagem'])}</table>
<h4>天兆牌</h4><table>${cardRows(['omen'])}</table>
<h4>军备牌 · 武器</h4><table>${cardRows(['weapon'])}</table>
<h4>军备牌 · 防具</h4><table>${cardRows(['armor'])}</table>
<h4>军备牌 · 坐骑</h4><table>${cardRows(['mount'])}</table>
<h4>技能与术语</h4>
<table>
<tr><td>技能</td><td>武将牌上的能力。锁定技必须发动；限定技每局只能发动一次；觉醒技满足条件时自动发动；主公技只有身为执笔者时才拥有，只对同时代的角色生效。</td></tr>
<tr><td>效果</td><td>游戏牌上的文字。</td></tr>
<tr><td>天意判定</td><td>翻开牌堆顶的一张牌作为判定牌，看其花色点数决定结果；生效前可能被技能改判。</td></tr>
<tr><td>天兆区 / 军备区</td><td>放天兆牌和军备牌的区域。</td></tr>
<tr><td>横置 / 重置</td><td>【铁索连环】等效果使角色横置；横置的角色受到属性伤害后重置并传导伤害。</td></tr>
</table>`;
    return `
<h4>Prologue · The Hall of Ages</h4>
<p class="qx-lore">History is not a river but a book that is never finished. Beyond every age stands the Hall of Ages, a hall with no doors. In it is a round table, and above the table hangs an everlasting lamp. Whenever humanity reaches a true crossroads, the lamp kindles and summons the greatest people of every age to the table. For every age it calls, one more lamp is lit in the hall.</p>
<p class="qx-lore">At the center of the table lies the Pen of History: whoever holds it writes the first word on the next page of the book. The council first chooses one of its members to hold the pen, and everyone around the table has an agenda of their own.</p>
<p class="qx-lore">No one truly dies in the Hall. Health is the weight a person carries in history; every wound takes some of it away. Those whose weight runs out fade into the lamplight and return to their own page, losing their chance to write history this time. That is how a character falls.</p>
<h4>Roles</h4>
<table><tr><th>Role</th><th>Agenda</th></tr>
<tr><td>The Chancellor</td><td>Holds the pen. Revealed from the start. In games of five or more, gains +1 max health and their era's Lord skill.</td></tr>
<tr><td>The Keeper</td><td>Believes history is safe in the Chancellor's hand, and protects the Chancellor.</td></tr>
<tr><td>The Insurgent</td><td>Believes the pen is in the wrong hand and wants to burn the book and begin again.</td></tr>
<tr><td>The Schemer</td><td>Lays plans in secret and wants to be the last one holding the pen.</td></tr></table>
<p>5 players: Chancellor, Keeper, 2 Insurgents, Schemer. 8 players: Chancellor, 2 Keepers, 4 Insurgents, Schemer. Except for the Chancellor, role cards stay face down and only their owners see them. A role card is turned face up when its owner falls.</p>
<h4>Victory</h4>
<p>If the Chancellor falls, the Schemer wins if they are the only one left; otherwise the Insurgents win. If every Insurgent and the Schemer have fallen, the Chancellor and the Keepers win. The game ends the moment a winner is decided.</p>
<p>Whoever defeats an Insurgent draws 3 cards. If the Chancellor defeats a Keeper, the Chancellor discards every card in hand and in their arsenal area.</p>
<h4>Choosing Heroes</h4>
<p>The Chancellor picks a hero from 8 (at least 2 from each era); then everyone else picks from 5 (at least 1 from each era). Each candidate may be swapped once.</p>
<h4>Turn Order</h4>
<p>Start of turn → Prepare phase → Judge phase (the card placed last in the omen area invokes Fate first) → Draw phase (draw 2) → Play phase (one {Strike} per phase, one {Grog} per turn) → Discard phase (keep no more cards than your health) → Finish phase → End of turn.</p>
<h4>Health and Dying</h4>
<p>The health gems printed on a hero card show only that hero's maximum health. Current health is shown by the red gems next to the hero card at each seat (for example 3/4). Right-click (or long-press on mobile) a hero card to see it full size.</p>
<p>At 0 health a character is dying. Starting with the current player, everyone in seat order may use a {Remedy} on them (the dying character may also use {Grog} on themself). If their health is still 0 or less, they fall.</p>
<h4>Distance and Attack Range</h4>
<p>Distance is the shorter way around the table in seats. A Destrier adds 1, a Charger subtracts 1; it is never less than 1. Your attack range is 1, or your weapon's range.</p>
<h4>Basic Cards</h4><table>${cardRows(['basic'])}</table>
<p>{Fire Strike} and {Thunder Strike} work like {Strike} but deal fire or thunder damage. They use the {Strike} art with a flame or lightning mark. When a chained character takes fire or thunder damage, the same damage passes to every other chained character.</p>
<h4>Stratagems</h4><table>${cardRows(['stratagem'])}</table>
<h4>Omens</h4><table>${cardRows(['omen'])}</table>
<h4>Arsenal · Weapons</h4><table>${cardRows(['weapon'])}</table>
<h4>Arsenal · Armor</h4><table>${cardRows(['armor'])}</table>
<h4>Arsenal · Mounts</h4><table>${cardRows(['mount'])}</table>
<h4>Skills and Terms</h4>
<table>
<tr><td>Skill</td><td>An ability printed on a hero. A Compulsory skill always applies. A Limited skill can be used once per game. An Awakening skill triggers by itself once its condition is met. A Lord skill belongs only to the Chancellor and works only with characters of the same era.</td></tr>
<tr><td>Effect</td><td>The text printed on a game card.</td></tr>
<tr><td>Fate</td><td>Reveal the top card of the deck; its suit and rank decide the outcome. Some skills can change the Fate card before it takes effect.</td></tr>
<tr><td>Omen area / arsenal area</td><td>Where a character's Omens and Arsenal cards sit.</td></tr>
<tr><td>Chained / unchained</td><td>{Chain Shot} and some skills chain characters. A chained character who takes fire or thunder damage becomes unchained and passes the damage on.</td></tr>
</table>`;
  }

  function mk(lang) {
    const L = lang === 'en' ? 1 : 0;
    const t = (key, vars) => { if (key === 'seat' && vars && typeof vars.n === 'number') vars = Object.assign({}, vars, { n: ROMAN[vars.n] || vars.n }); const e = UI[key] || P[key]; let s = e ? e[L] : key; if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]); return s; };
    const cardName = n => NAME[n] ? NAME[n][L] : n;
    const QH = () => (typeof QXHeroes !== 'undefined' ? QXHeroes : (typeof require === 'function' ? (() => { try { return require('./qx-heroes.js'); } catch (e) { return null; } })() : null));
    const skillName = n => E.SKILLS[n] ? E.SKILLS[n].name[L] : (NAME[n] ? NAME[n][L] : n);
    const skillDesc = n => E.SKILLS[n] ? E.SKILLS[n].desc[L].replace(/^(锁定技|主公技|限定技|觉醒技)[，,、]\s*/, '').replace(/^(Compulsory|Lord|Limited|Awakening) skill\.\s*/, '') : '';
    const heroName = k => E.HEROES[k] ? E.HEROES[k].name[L] : (k || '');
    const heroTitle = k => E.HEROES[k] ? E.HEROES[k].title[L] : '';
    const faction = f => { const q = QH(); return q && q.FACTIONS[f] ? q.FACTIONS[f].name[L] : (f || ''); };
    const factionColor = f => { const q = QH(); return q && q.FACTIONS[f] ? q.FACTIONS[f].color : '#555'; };
    const fill = (str, vars) => { if (vars) for (const k in vars) str = str.split('{' + k + '}').join(vars[k]); return str; };
    const option = (key, vars) => { const q = QH(); const e = q && q.OPTION_TEXT[key]; return e ? fill(e[L], vars) : (key === 'discardHand' ? t('discardOpt') : key === 'letDraw' ? t('letDraw') : cardName(key)); };
    const prompt = (key, vars) => { const q = QH(); const e = q && q.PROMPT_TEXT[key]; return e ? fill(e[L], vars) : null; };
    const role = r => ROLE[r] ? ROLE[r][L] : '?';
    const seat = (g, s, viewer) => s == null ? (L ? 'no source' : '无来源') : (s === viewer ? t('you') : t('seat', { n: s + 1 }));
    const cardLabel = (c) => c ? cardName(c.name) + ' ' + SUIT[c.suit] + RANK(c.rank) : '?';
    function logLine(g, e, viewer) { const r = logLine0(g, e, viewer); if (r && L && r[1]) r[1] = r[1].replace(/\bYou (activate|take|lose|gain|show|reveal|play|use|equip|recover|draw|discard|pass|skip|win|look|view|give|get|flip)s\b/g, 'You $1'); return r; }
    function logLine0(g, e, viewer) {
      const S = s => seat(g, s, viewer); const C = id => cardLabel(g.card(id)); const N = cardName;
      const zh = !L;
      switch (e.type) {
        case 'turn': return ['turn', zh ? `—— ${S(e.seat)}的回合 ——` : (e.seat === viewer ? '— Your Turn —' : `— ${S(e.seat)}'s Turn —`)];
        case 'draw': return e.n ? ['', zh ? `${S(e.seat)}摸了 ${e.n} 张牌` : `${S(e.seat)} drew ${e.n}`] : null;
        case 'use': {
          const via = e.virtual ? (e.ids.length ? (zh ? `将 ${e.ids.map(C).join('、')} 当` : ` (${e.ids.map(C).join(', ')} as)`) : (zh ? '视为' : ' (virtual)')) : '';
          const tg = e.targets.length && !(E.CARD_DEFS[e.card] && E.CARD_DEFS[e.card].type === 'equip') ? (zh ? ' → ' : ' → ') + e.targets.map(S).join(zh ? '、' : ', ') : '';
          const own = !e.virtual && e.ids.length ? ' ' + C(e.ids[0]).replace(/^.*? (?=[♠♥♣♦])/, '') : '';
          return ['', zh ? `${S(e.seat)}${via}使用【${N(e.card)}】${own}${tg}` : `${S(e.seat)} used${via} ${N(e.card)}${own}${tg}`];
        }
        case 'play': return ['', zh ? `${S(e.seat)}打出【${N(e.card)}】` : `${S(e.seat)} played ${N(e.card)}`];
        case 'damage': return ['dmg', zh ? `${S(e.to)}受到${e.from == null ? '' : S(e.from) + '造成的'} ${e.n} 点${NATURE[e.nature][0]}伤害（体力 ${e.hp}）` : `${S(e.to)} took ${e.n} ${NATURE[e.nature][1]}damage${e.from == null ? '' : ' from ' + S(e.from)} (health ${e.hp})`];
        case 'damagePrevented': return ['', zh ? `对${S(e.to)}的伤害被防止` : `Damage to ${S(e.to)} was prevented`];
        case 'recover': return ['heal', zh ? `${S(e.seat)}回复 ${e.n} 点体力（体力 ${e.hp}）` : `${S(e.seat)} recovered ${e.n} (health ${e.hp})`];
        case 'loseHp': return ['dmg', zh ? `${S(e.seat)}失去 ${e.n} 点体力（体力 ${e.hp}）` : `${S(e.seat)} lost ${e.n} health (health ${e.hp})`];
        case 'dying': return ['dmg', zh ? `${S(e.seat)}进入濒死状态` : `${S(e.seat)} is dying`];
        case 'death': return ['death', zh ? `${S(e.seat)}阵亡，身份是${role(e.role)}` : `${S(e.seat)} has fallen. Role: ${role(e.role)}`];
        case 'judge': return ['', zh ? `${S(e.seat)}进行天意判定（${JR(e.reason)}）` : `${S(e.seat)} invokes Fate (${JR(e.reason)})`];
        case 'judgeResult': return ['', zh ? `　判定牌：${C(e.card)}` : `  Fate card: ${C(e.card)}`];
        case 'retouch': return ['', zh ? `${S(e.seat)}改判为 ${C(e.card)}` : `${S(e.seat)} changed the Fate card to ${C(e.card)}`];
        case 'vetoed': return ['', zh ? `【${N(e.card)}】对${S(e.seat)}的效果被抵消` : `${N(e.card)} on ${S(e.seat)} was cancelled`];
        case 'nullified': return ['', zh ? `【${N(e.card)}】对${S(e.seat)}无效` : `${N(e.card)} has no effect on ${S(e.seat)}`];
        case 'parried': return ['', zh ? `${S(e.seat)}闪开了这一击` : `${S(e.seat)} parried`];
        case 'equip': return ['', zh ? `${S(e.seat)}装备了【${N(e.card)}】` : `${S(e.seat)} equipped ${N(e.card)}`];
        case 'skipPhase': return ['', zh ? `${S(e.seat)}跳过${PHASE[e.phase][0]}阶段` : `${S(e.seat)} skips the ${PHASE[e.phase][1]} phase`];
        case 'chain': return ['', zh ? `${S(e.seat)}${e.on ? '被横置' : '重置'}` : `${S(e.seat)} ${e.on ? 'is chained' : 'is unchained'}`];
        case 'discard': return ['', zh ? `${S(e.seat)}弃置了 ${e.cards.map(C).join('、')}` : `${S(e.seat)} discarded ${e.cards.map(C).join(', ')}`];
        case 'discardOf': return ['', zh ? `${S(e.by)}弃置了${S(e.seat)}的 ${C(e.card)}` : `${S(e.by)} discarded ${S(e.seat)}'s ${C(e.card)}`];
        case 'gain': return ['', zh ? `${S(e.seat)}获得了 ${e.n} 张牌${e.from != null ? '（来自' + S(e.from) + '）' : ''}` : `${S(e.seat)} gained ${e.n} card(s)${e.from != null ? ' from ' + S(e.from) : ''}`];
        case 'show': return ['', e.n ? (zh ? `${S(e.seat)}给${S(e.to)}观看了 ${e.n} 张手牌` : `${S(e.seat)} showed ${e.n} card(s) to ${S(e.to)}`) : (zh ? `${S(e.seat)}展示了 ${C(e.card)}` : `${S(e.seat)} revealed ${C(e.card)}`)];
        case 'reveal': return ['', zh ? `亮出：${e.cards.map(C).join('、')}` : `Revealed: ${e.cards.map(C).join(', ')}`];
        case 'skill': return ['skill', zh ? `${S(e.seat)}发动【${skillName(e.skill)}】` : `${S(e.seat)} activates ${skillName(e.skill)}`];
        case 'damoclesMove': return ['', zh ? `【${N('damocles')}】移到${S(e.to)}` : `${N('damocles')} passes to ${S(e.to)}`];
        case 'omenHit': return ['', zh ? `${S(e.seat)}的【${N(e.card)}】生效` : `${N(e.card)} takes effect on ${S(e.seat)}`];
        case 'recast': return ['', zh ? `${S(e.seat)}重铸【${N(e.card)}】` : `${S(e.seat)} recast ${N(e.card)}`];
        case 'drunk': return ['', zh ? `${S(e.seat)}喝了酒，下一张杀伤害 +1` : `${S(e.seat)} drank Grog: next Strike +1 damage`];
        case 'reshuffle': return ['', zh ? `弃牌堆洗入牌堆（${e.n} 张）` : `Discard pile reshuffled (${e.n} cards)`];
        case 'flip': return ['', e.skipTurn ? (zh ? `${S(e.seat)}翻回正面，跳过本回合` : `${S(e.seat)} turns face up and skips this turn`) : (zh ? `${S(e.seat)}${e.faceDown ? '翻面' : '翻回正面'}` : `${S(e.seat)} turns face ${e.faceDown ? 'down' : 'up'}`)];
        case 'viewHand': return ['', zh ? `${S(e.seat)}观看了${S(e.target)}的手牌` : `${S(e.seat)} viewed ${S(e.target)}'s hand`];
        case 'viewRole': return ['', e.seat === viewer ? (zh ? `你观看了${S(e.target)}的身份：${role(g.p(e.target).role)}` : `You viewed ${S(e.target)}'s role: ${role(g.p(e.target).role)}`) : (zh ? `${S(e.seat)}观看了${S(e.target)}的身份` : `${S(e.seat)} viewed ${S(e.target)}'s role`)];
        case 'skillLost': return ['skill', zh ? `${S(e.seat)}失去了技能【${skillName(e.skill)}】` : `${S(e.seat)} lost ${skillName(e.skill)}`];
        case 'skillGained': return ['skill', zh ? `${S(e.seat)}获得了技能【${skillName(e.skill)}】` : `${S(e.seat)} gained ${skillName(e.skill)}`];
        case 'pindian': return ['', zh ? `${S(e.a)}（${C(e.ca)}）与${S(e.b)}（${C(e.cb)}）拼点，${e.win ? S(e.a) + '赢' : S(e.a) + '没赢'}` : `${S(e.a)} (${C(e.ca)}) contests ${S(e.b)} (${C(e.cb)}): ${e.win ? S(e.a) + ' wins' : S(e.a) + ' does not win'}`];
        case 'heroChosen': return ['', zh ? `${S(e.seat)}选择了武将【${heroName(e.hero)}】` : `${S(e.seat)} chose ${heroName(e.hero)}`];
        case 'hpSet': return ['heal', zh ? `${S(e.seat)}的体力调整为 ${e.hp}` : `${S(e.seat)}'s health is set to ${e.hp}`];
        case 'maxHp': return ['', zh ? `${S(e.seat)}的体力上限${e.delta > 0 ? '+' : ''}${e.delta}（现为 ${e.maxHp}）` : `${S(e.seat)}'s max health ${e.delta > 0 ? '+' : ''}${e.delta} (now ${e.maxHp})`];
        case 'swapHands': return ['', zh ? `${S(e.seat)}与${S(e.with)}交换了手牌` : `${S(e.seat)} swapped hands with ${S(e.with)}`];
        case 'playEnded': return ['', zh ? `${S(e.seat)}的出牌阶段被迫结束` : `${S(e.seat)}'s Play phase ends`];
        case 'rallyFailed': return ['', zh ? '无人响应号令' : 'No one answered the Rally'];
        case 'gameOver': return ['end', e.winners.length ? (zh ? `对局结束：${e.winners.map(role).join('、')}获胜` : `Game over: ${e.winners.map(role).join(' & ')} win`) : (zh ? '对局结束：平局' : 'Game over: draw')];
      }
      return null;
    }
    function JR(r) { if (E.SKILLS[r]) return skillName(r); return NAME[r] ? cardName(r) : r; }
    return {
      L, lang: L ? 'en' : 'zh', t, cardName, skillName, skillDesc, heroName, heroTitle, faction, factionColor, option, prompt, role, seat, cardLabel, logLine,
      desc: n => { const c = QC.BY_KEY && QC.BY_KEY[n]; if (c && c.effect_zh) return L ? c.effect_en : c.effect_zh; return DESC[n] ? DESC[n][L] : ''; },
      rulesHTML: () => rulesHTML(L),
      category: n => { const d = E.CARD_DEFS[n]; if (!d) return ''; return CATEGORY[d.type][L] + (d.sub ? ' · ' + SUBTYPE[d.sub][L] : ''); },
      phase: p => PHASE[p] ? PHASE[p][L] : '', phaseLabel: p => PHASEL[p] ? PHASEL[p][L] : '', suit: s => SUIT[s] || '', suitName: s => SUITNAME[s] ? SUITNAME[s][L] : '', rank: RANK,
    };
  }
  return { mk, DESC, UI, P, ROLE };
});
