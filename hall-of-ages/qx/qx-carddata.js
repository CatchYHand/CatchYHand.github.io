/* 群星议会 — 游戏牌资料（由 qunxing-cards/cards.json 生成，名字、效果、攻击范围、坐骑距离以此为准） */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QXCardData = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return [
 {
  "key": "strike",
  "type": "basic",
  "zh": "杀",
  "en": "Strike"
 },
 {
  "key": "parry",
  "type": "basic",
  "zh": "闪",
  "en": "Parry"
 },
 {
  "key": "remedy",
  "type": "basic",
  "zh": "药",
  "en": "Remedy"
 },
 {
  "key": "grog",
  "type": "basic",
  "zh": "酒",
  "en": "Grog"
 },
 {
  "key": "duel",
  "type": "stratagem",
  "zh": "决斗",
  "en": "Duel",
  "effect_zh": "出牌阶段，对一名其他角色使用。由其开始，其与你轮流打出【杀】，首先不打出【杀】的一方受到另一方造成的 1 点伤害。",
  "effect_en": "Use on another character during your Play phase. Starting with them, you take turns playing {Strike}. The first who does not play a {Strike} takes 1 damage from the other."
 },
 {
  "key": "sabotage",
  "type": "stratagem",
  "zh": "釜底抽薪",
  "en": "Sabotage",
  "effect_zh": "出牌阶段，对一名区域内有牌的其他角色使用。你弃置其手牌、军备区或天兆区里的一张牌。",
  "effect_en": "Use on another character who has cards during your Play phase. Discard one card from their hand, arsenal area, or omen area."
 },
 {
  "key": "pilfer",
  "type": "stratagem",
  "zh": "探囊取物",
  "en": "Pilfer",
  "effect_zh": "出牌阶段，对距离为 1 且区域内有牌的一名其他角色使用。你获得其手牌、军备区或天兆区里的一张牌。",
  "effect_en": "Use on another character at distance 1 who has cards during your Play phase. Take one card from their hand, arsenal area, or omen area."
 },
 {
  "key": "windfall",
  "type": "stratagem",
  "zh": "天赐良机",
  "en": "Windfall",
  "effect_zh": "出牌阶段，对你使用。你摸两张牌。",
  "effect_en": "Use on yourself during your Play phase. Draw 2 cards."
 },
 {
  "key": "catspaw",
  "type": "stratagem",
  "zh": "驱虎吞狼",
  "en": "Cat’s Paw",
  "effect_zh": "出牌阶段，对一名其他角色使用，并指定其攻击范围内的另一名角色（不能是你）。前者视为对后者使用一张【杀】；若此【杀】没有造成伤害，前者视为对你使用一张【杀】。",
  "effect_en": "Use on another character during your Play phase and name a second character (not you) within their attack range. The first is treated as using a {Strike} on the second. If it deals no damage, the first is treated as using a {Strike} on you."
 },
 {
  "key": "invasion",
  "type": "stratagem",
  "zh": "铁蹄压境",
  "en": "Invasion",
  "effect_zh": "出牌阶段，对所有其他角色使用。每名目标角色须打出一张【杀】，否则受到你造成的 1 点伤害。",
  "effect_en": "Use on every other character during your Play phase. Each must play a {Strike} or take 1 damage from you."
 },
 {
  "key": "arrowstorm",
  "type": "stratagem",
  "zh": "万箭齐发",
  "en": "Arrowstorm",
  "effect_zh": "出牌阶段，对所有其他角色使用。每名目标角色须打出一张【闪】，否则受到你造成的 1 点伤害。",
  "effect_en": "Use on every other character during your Play phase. Each must play a {Parry} or take 1 damage from you."
 },
 {
  "key": "respite",
  "type": "stratagem",
  "zh": "休养生息",
  "en": "Respite",
  "effect_zh": "出牌阶段，对所有角色使用。每名目标角色回复 1 点体力。",
  "effect_en": "Use on every character during your Play phase. Each recovers 1 health."
 },
 {
  "key": "feast",
  "type": "stratagem",
  "zh": "联军盛宴",
  "en": "Feast",
  "effect_zh": "出牌阶段，对所有角色使用。亮出牌堆顶与存活角色数相同数量的牌，从你开始，每名目标角色依次获得其中一张。",
  "effect_en": "Use on every character during your Play phase. Reveal as many cards from the top of the deck as there are living characters. Starting with you, each target takes one."
 },
 {
  "key": "veto",
  "type": "stratagem",
  "zh": "无懈可击",
  "en": "Veto",
  "effect_zh": "一张谋略牌或天兆牌对一名角色生效前，对此牌使用，抵消其对该角色的效果。也可以用来抵消另一张【无懈可击】。",
  "effect_en": "Use when a Stratagem or Omen is about to take effect on a character. Cancel its effect on that character. Can also cancel another {Veto}."
 },
 {
  "key": "greekfire",
  "type": "stratagem",
  "zh": "火攻",
  "en": "Greek Fire",
  "effect_zh": "出牌阶段，对一名有手牌的角色使用（可以是你）。其展示一张手牌，然后你可以弃置一张与之花色相同的手牌，对其造成 1 点火焰伤害。",
  "effect_en": "Use on a character with cards in hand (you included) during your Play phase. They reveal a card from their hand. You may then discard a card of the same suit from your hand to deal 1 fire damage to them."
 },
 {
  "key": "chainshot",
  "type": "stratagem",
  "zh": "铁索连环",
  "en": "Chain Shot",
  "effect_zh": "出牌阶段，对一至两名角色使用，横置或重置这些角色。此牌也可以重铸：弃置此牌并摸一张牌。",
  "effect_en": "Use on one or two characters during your Play phase to chain or unchain them. You may instead recast it: discard it and draw 1 card."
 },
 {
  "key": "damocles",
  "type": "omen",
  "zh": "达摩克利斯之剑",
  "en": "Damocles",
  "effect_zh": "出牌阶段，对你使用，置于你的天兆区。判定阶段进行天意判定：若为黑桃 2–9，你受到 3 点雷电伤害；否则将此牌移至下家的天兆区。被【无懈可击】抵消时同样移至下家。",
  "effect_en": "Use on yourself during your Play phase and place it in your omen area. In your Judge phase, invoke Fate: on ♠2–9, take 3 thunder damage; otherwise pass it to the next player’s omen area. If cancelled by {Veto}, it also passes on."
 },
 {
  "key": "lotus",
  "type": "omen",
  "zh": "流连忘返",
  "en": "Lotus Eaters",
  "effect_zh": "出牌阶段，对一名其他角色使用，置于其天兆区。其判定阶段进行天意判定：若结果不为红桃，其跳过出牌阶段。",
  "effect_en": "Use on another character during your Play phase and place it in their omen area. In their Judge phase, they invoke Fate: unless ♥, they skip their Play phase."
 },
 {
  "key": "blockade",
  "type": "omen",
  "zh": "弹尽粮绝",
  "en": "Blockade",
  "effect_zh": "出牌阶段，对距离为 1 的一名其他角色使用，置于其天兆区。其判定阶段进行天意判定：若结果不为梅花，其跳过摸牌阶段。",
  "effect_en": "Use on another character at distance 1 during your Play phase and place it in their omen area. In their Judge phase, they invoke Fate: unless ♣, they skip their Draw phase."
 },
 {
  "key": "gatling",
  "type": "weapon",
  "zh": "加特林",
  "en": "Gatling",
  "range": 1,
  "effect_zh": "出牌阶段，你使用【杀】无次数限制。",
  "effect_en": "During your Play phase, you may use any number of {Strike}.",
  "flavor_zh": "1861 年的手摇连发枪。",
  "flavor_en": "The hand-cranked repeater of 1861."
 },
 {
  "key": "excalibur",
  "type": "weapon",
  "zh": "断钢圣剑",
  "en": "Excalibur",
  "range": 2,
  "effect_zh": "锁定技，你使用的【杀】无视目标角色的防具。",
  "effect_en": "Compulsory. Your {Strike} ignores the target’s armor.",
  "flavor_zh": "亚瑟王从石中拔出的圣剑。",
  "flavor_en": "The blade King Arthur drew from the stone."
 },
 {
  "key": "gemini",
  "type": "weapon",
  "zh": "双子剑",
  "en": "Gemini",
  "range": 2,
  "effect_zh": "当你使用【杀】指定一名异性角色为目标后，你可以令其选择一项：弃置一张手牌，或令你摸一张牌。",
  "effect_en": "After your {Strike} targets a character of the other sex, you may make them choose: discard a card from hand, or let you draw 1 card.",
  "flavor_zh": "双子座的卡斯托耳与波吕克斯。",
  "flavor_en": "Castor and Pollux, the heavenly twins."
 },
 {
  "key": "winter",
  "type": "weapon",
  "zh": "冬将军",
  "en": "General Winter",
  "range": 2,
  "effect_zh": "当你使用【杀】对目标角色造成伤害时，你可以防止此伤害，改为依次弃置其两张牌。",
  "effect_en": "When your {Strike} would deal damage, you may prevent it and instead discard 2 of the target’s cards, one at a time.",
  "flavor_zh": "寒冬一点点消耗掉入侵俄国的大军。",
  "flavor_en": "The winter that wore down every army marching on Russia."
 },
 {
  "key": "misericorde",
  "type": "weapon",
  "zh": "慈悲短剑",
  "en": "Misericorde",
  "range": 2,
  "effect_zh": "锁定技，当你使用【杀】对目标角色造成伤害时，若其没有手牌，此伤害 +1。",
  "effect_en": "Compulsory. When your {Strike} deals damage to a target with no cards in hand, that damage +1.",
  "flavor_zh": "骑士给倒地之敌补上的最后一击。",
  "flavor_en": "The knight’s mercy for a fallen foe."
 },
 {
  "key": "berserker",
  "type": "weapon",
  "zh": "狂战士斧",
  "en": "Berserker",
  "range": 3,
  "effect_zh": "当你使用的【杀】被【闪】抵消后，你可以对相同的目标再使用一张【杀】。",
  "effect_en": "After your {Strike} is cancelled by a {Parry}, you may use another {Strike} on the same target.",
  "flavor_zh": "北欧狂战士，不死不休。",
  "flavor_en": "The Norse berserker fights until one of them falls."
 },
 {
  "key": "sarissa",
  "type": "weapon",
  "zh": "萨里沙长矛",
  "en": "Sarissa",
  "range": 3,
  "effect_zh": "你可以将两张手牌当【杀】使用或打出。",
  "effect_en": "You may use or play 2 cards from hand as a {Strike}.",
  "flavor_zh": "马其顿方阵的超长矛。",
  "flavor_en": "The great pike of the Macedonian phalanx."
 },
 {
  "key": "ram",
  "type": "weapon",
  "zh": "攻城锤",
  "en": "Battering Ram",
  "range": 3,
  "effect_zh": "当你使用的【杀】被【闪】抵消后，你可以弃置两张牌，令此【杀】依然造成伤害。",
  "effect_en": "After your {Strike} is cancelled by a {Parry}, you may discard 2 cards to make it deal damage anyway.",
  "flavor_zh": "没有撞不开的城门。",
  "flavor_en": "No gate holds forever."
 },
 {
  "key": "trident",
  "type": "weapon",
  "zh": "三叉戟",
  "en": "Trident",
  "range": 4,
  "effect_zh": "当你使用【杀】时，若此【杀】是你最后的手牌，你可以额外指定至多两名目标。",
  "effect_en": "When you use a {Strike} that is your last card in hand, you may choose up to 2 additional targets.",
  "flavor_zh": "海神波塞冬的三叉戟。",
  "flavor_en": "The trident of Poseidon."
 },
 {
  "key": "arquebus",
  "type": "weapon",
  "zh": "火绳枪",
  "en": "Arquebus",
  "range": 4,
  "effect_zh": "你可以将普通【杀】当【火杀】使用。",
  "effect_en": "You may use a normal {Strike} as a {Fire Strike}.",
  "flavor_zh": "火药第一次走上战场。",
  "flavor_en": "Gunpowder takes the field."
 },
 {
  "key": "longbow",
  "type": "weapon",
  "zh": "英格兰长弓",
  "en": "Longbow",
  "range": 5,
  "effect_zh": "当你使用【杀】对目标角色造成伤害时，你可以弃置其军备区里的一张坐骑牌。",
  "effect_en": "When your {Strike} deals damage, you may discard a mount from the target’s arsenal area.",
  "flavor_zh": "阿金库尔的长弓手专射法军战马。",
  "flavor_en": "At Agincourt, the archers aimed for the horses."
 },
 {
  "key": "aegis",
  "type": "armor",
  "zh": "雅典娜之盾",
  "en": "Aegis",
  "effect_zh": "当你需要使用或打出【闪】时，你可以进行天意判定：若结果为红色，视为你使用或打出了一张【闪】。",
  "effect_en": "When you need to use or play a {Parry}, you may invoke Fate: if red, you are treated as having used or played a {Parry}.",
  "flavor_zh": "女神之盾，看天意庇护。",
  "flavor_en": "The goddess’s shield; heaven decides."
 },
 {
  "key": "testudo",
  "type": "armor",
  "zh": "龟甲阵",
  "en": "Testudo",
  "effect_zh": "锁定技，黑色【杀】对你无效。",
  "effect_en": "Compulsory. Black {Strike} has no effect on you.",
  "flavor_zh": "罗马军团举盾结成龟甲阵。",
  "flavor_en": "The legion locks its shields."
 },
 {
  "key": "linothorax",
  "type": "armor",
  "zh": "亚麻胸甲",
  "en": "Linothorax",
  "effect_zh": "锁定技，普通【杀】、【铁蹄压境】和【万箭齐发】对你无效。你受到的火焰伤害 +1。",
  "effect_en": "Compulsory. Normal {Strike}, {Invasion} and {Arrowstorm} have no effect on you. Fire damage you take +1.",
  "flavor_zh": "轻便的亚麻层压甲，怕火。",
  "flavor_en": "Light layered linen, but it burns."
 },
 {
  "key": "nemean",
  "type": "armor",
  "zh": "涅墨亚狮皮",
  "en": "Nemean Lion",
  "effect_zh": "锁定技，你每次受到的伤害至多为 1 点。当你失去军备区里的此牌时，你回复 1 点体力。",
  "effect_en": "Compulsory. You never take more than 1 damage at a time. When you lose this from your arsenal area, recover 1 health.",
  "flavor_zh": "赫拉克勒斯披的刀枪不入的狮皮。",
  "flavor_en": "The pelt Heracles wore; no blade could pierce it."
 },
 {
  "key": "bucephalus",
  "type": "mount",
  "zh": "布塞弗勒斯",
  "en": "Bucephalus",
  "distance": 1,
  "effect_zh": "其他角色计算与你的距离 +1。",
  "effect_en": "Other characters are at distance +1 from you.",
  "flavor_zh": "亚历山大的战马。",
  "flavor_en": "Alexander’s warhorse."
 },
 {
  "key": "babieca",
  "type": "mount",
  "zh": "巴别卡",
  "en": "Babieca",
  "distance": 1,
  "effect_zh": "其他角色计算与你的距离 +1。",
  "effect_en": "Other characters are at distance +1 from you.",
  "flavor_zh": "熙德的战马。",
  "flavor_en": "The warhorse of El Cid."
 },
 {
  "key": "marengo",
  "type": "mount",
  "zh": "马伦戈",
  "en": "Marengo",
  "distance": 1,
  "effect_zh": "其他角色计算与你的距离 +1。",
  "effect_en": "Other characters are at distance +1 from you.",
  "flavor_zh": "拿破仑的战马。",
  "flavor_en": "Napoleon’s warhorse."
 },
 {
  "key": "copenhagen",
  "type": "mount",
  "zh": "哥本哈根",
  "en": "Copenhagen",
  "distance": 1,
  "effect_zh": "其他角色计算与你的距离 +1。",
  "effect_en": "Other characters are at distance +1 from you.",
  "flavor_zh": "威灵顿在滑铁卢骑的马。",
  "flavor_en": "Wellington’s horse at Waterloo."
 },
 {
  "key": "pegasus",
  "type": "mount",
  "zh": "珀伽索斯",
  "en": "Pegasus",
  "distance": -1,
  "effect_zh": "你计算与其他角色的距离 −1。",
  "effect_en": "You are at distance −1 from other characters.",
  "flavor_zh": "希腊神话中的飞马。",
  "flavor_en": "The winged horse of Greek myth."
 },
 {
  "key": "sleipnir",
  "type": "mount",
  "zh": "斯雷普尼尔",
  "en": "Sleipnir",
  "distance": -1,
  "effect_zh": "你计算与其他角色的距离 −1。",
  "effect_en": "You are at distance −1 from other characters.",
  "flavor_zh": "奥丁的八足神驹。",
  "flavor_en": "Odin’s eight-legged steed."
 },
 {
  "key": "arion",
  "type": "mount",
  "zh": "阿里翁",
  "en": "Arion",
  "distance": -1,
  "effect_zh": "你计算与其他角色的距离 −1。",
  "effect_en": "You are at distance −1 from other characters.",
  "flavor_zh": "希腊神话中跑得最快的神马。",
  "flavor_en": "The swiftest horse of Greek myth."
 }
];
});
