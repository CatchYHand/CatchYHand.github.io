/* 群星议会 The Hall of Ages — 规则引擎 qx-engine.js
 * 事件 + 时机栈。所有结算流程都是 generator：需要玩家决定时 yield 一个请求对象，
 * 驱动器（AI / 界面 / 测试）把答案通过 gen.next(answer) 送回。
 * 只参考三国杀通行规则思路，不含任何第三方代码。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QXEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ───────────────────────── 基础常量 ─────────────────────────
  const SUITS = ['spade', 'heart', 'club', 'diamond'];
  const SUIT_COLOR = { spade: 'black', club: 'black', heart: 'red', diamond: 'red', none: 'none' };
  const PHASES = ['prepare', 'judge', 'draw', 'play', 'discard', 'finish'];
  const ROLESETS = {
    5: ['chancellor', 'keeper', 'insurgent', 'insurgent', 'schemer'],
    8: ['chancellor', 'keeper', 'keeper', 'insurgent', 'insurgent', 'insurgent', 'insurgent', 'schemer'],
  };
  const CARD_DEFS = {};   // 牌名 → 定义（由 qx-cards.js 注册）
  const SKILLS = {};      // 技能 id → 定义（由武将文件注册）
  const HEROES = {};      // 武将 key → 定义

  class GameOver { constructor(winners, reason) { this.qxGameOver = true; this.winners = winners; this.reason = reason; } }

  function rng(seed) { // mulberry32
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ───────────────────────── 牌 ─────────────────────────
  class Card {
    constructor(id, name, suit, rank) { this.id = id; this.name = name; this.suit = suit; this.rank = rank; this.loc = null; }
    get color() { return SUIT_COLOR[this.suit]; }
    get def() { return CARD_DEFS[this.name]; }
    get virtual() { return false; }
    get subcards() { return [this]; }
  }
  // 虚拟牌：转化牌 / 视为使用的牌。subcards 为实体牌（可为空）
  function virtualCard(name, subcards, extra) {
    subcards = subcards || [];
    let suit = 'none', rank = 0;
    if (subcards.length === 1) { suit = subcards[0].suit; rank = subcards[0].rank; }
    else if (subcards.length > 1) {
      const cs = new Set(subcards.map(c => c.color));
      suit = cs.size === 1 ? (subcards[0].color === 'black' ? 'black' : 'red') : 'none';
    }
    const v = Object.assign({ id: null, name, suit, rank, subcards, virtual: true }, extra || {});
    Object.defineProperty(v, 'color', { get() { return this.suit === 'black' ? 'black' : this.suit === 'red' ? 'red' : SUIT_COLOR[this.suit] || 'none'; } });
    Object.defineProperty(v, 'def', { get() { return CARD_DEFS[this.name]; } });
    return v;
  }
  function family(card) { const d = CARD_DEFS[card.name]; return d ? (d.family || card.name) : card.name; }
  function matches(card, patterns) { const f = family(card); return [].concat(patterns).some(p => p === f || p === card.name); }

  // ───────────────────────── 角色 ─────────────────────────
  class Player {
    constructor(seat) {
      this.seat = seat; this.role = null; this.hero = null; this.gender = 'male'; this.faction = null;
      this.maxHp = 4; this.hp = 4; this.dead = false; this.dying = false;
      this.hand = []; this.equips = { weapon: null, armor: null, plus: null, minus: null }; this.judgeZone = [];
      this.chained = false; this.faceDown = false; this.roleShown = false;
      this.skills = []; this.skillState = {}; this.marks = {};
      this.turnState = {}; this.phaseState = {};
    }
    get equipList() { return Object.values(this.equips).filter(Boolean); }
    get cardCount() { return this.hand.length + this.equipList.length; }
    get wounded() { return this.hp < this.maxHp; }
    toString() { return 'P' + this.seat; }
  }

  // ───────────────────────── 游戏 ─────────────────────────
  class Game {
    constructor(opts) {
      opts = opts || {};
      this.rand = rng(opts.seed == null ? (Date.now() & 0xffffffff) : opts.seed);
      this.n = opts.players || 5;
      if (!ROLESETS[this.n] && !opts.roles) throw new Error('unsupported player count');
      this.players = []; for (let i = 0; i < this.n; i++) this.players.push(new Player(i));
      this.deck = []; this.discardPile = []; this.processing = [];
      this.cards = {}; // id → Card
      this.logs = []; this.onLog = opts.onLog || null;
      this.current = null; this.round = 0; this.phase = null;
      this.over = false; this.result = null; this.seq = 0;
      this.opts = opts;
      this.extraTurns = []; this.hpChanges = 0;
    }

    // ── 工具 ──
    log(type, data) { const e = Object.assign({ type }, data || {}); this.logs.push(e); if (this.onLog) this.onLog(e, this); }
    shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
    pick(arr) { return arr[Math.floor(this.rand() * arr.length)]; }
    get alive() { return this.players.filter(p => !p.dead); }
    p(seat) { return this.players[seat]; }
    card(id) { return this.cards[id]; }
    nextAlive(p) { let q = p; for (let i = 0; i < this.n; i++) { q = this.players[(q.seat + 1) % this.n]; if (!q.dead) return q; } return null; }
    // 从 start 起按座次的存活角色（start 若已死亡则从其下家起）
    seatOrderFrom(start, includeDead) {
      const out = []; const s = start ? start.seat : 0;
      for (let i = 0; i < this.n; i++) { const q = this.players[(s + i) % this.n]; if (includeDead || !q.dead) out.push(q); }
      return out;
    }
    sortBySeat(list, from) { const base = (from || this.current || this.players[0]).seat; return list.slice().sort((a, b) => ((a.seat - base + this.n) % this.n) - ((b.seat - base + this.n) % this.n)); }

    // ── 技能与静态修正 ──
    skillList(p) {
      const out = [];
      for (const id of p.skills) if (SKILLS[id]) out.push({ key: 's:' + id, id, def: SKILLS[id], src: 'hero' });
      for (const slot of ['weapon', 'armor', 'plus', 'minus']) {
        const c = p.equips[slot]; if (!c) continue;
        const d = CARD_DEFS[c.name]; if (d && d.skill) out.push({ key: 'e:' + c.id, id: c.name, def: d.skill, src: 'equip', card: c, slot });
      }
      return out;
    }
    hasSkill(p, id) { return this.skillList(p).some(s => s.id === id); }
    // 静态修正：遍历所有存活角色的技能 mods[name](g, owner, value, ...args)
    q(name, value, ...args) {
      for (const owner of this.players) {
        if (owner.dead) continue;
        for (const s of this.skillList(owner)) {
          const m = s.def.mods && s.def.mods[name];
          if (m) value = m(this, owner, value, ...args, s);
        }
      }
      return value;
    }
    distance(a, b) {
      if (a === b) return 0;
      let cw = 0, q = a; while (q !== b) { q = this.nextAlive(q); cw++; if (cw > this.n) break; }
      let ccw = 0; q = b; while (q !== a) { q = this.nextAlive(q); ccw++; if (ccw > this.n) break; }
      let d = Math.min(cw, ccw);
      d = this.q('distance', d, a, b);
      return Math.max(1, d);
    }
    attackRange(p) {
      const w = p.equips.weapon; let r = w ? (CARD_DEFS[w.name].range || 1) : 1;
      return this.q('attackRange', r, p);
    }
    inAttackRange(a, b) { return a !== b && !b.dead && this.distance(a, b) <= this.attackRange(a); }
    handLimit(p) { return Math.max(0, this.q('handLimit', Math.max(0, p.hp), p)); }
    strikeLimit(p) { return this.q('strikeLimit', 1, p); }
    armorOf(p, use) { // 当前生效的护甲（被无视时返回 null）
      const a = p.equips.armor; if (!a) return null;
      if (use && use.data.ignoreArmor && use.data.ignoreArmor.has(p)) return null;
      return a;
    }

    // ── 牌区移动 ──
    zoneArray(loc) {
      if (!loc) return null;
      if (loc.zone === 'deck') return this.deck;
      if (loc.zone === 'discard') return this.discardPile;
      if (loc.zone === 'process') return this.processing;
      const p = this.players[loc.seat];
      if (loc.zone === 'hand') return p.hand;
      if (loc.zone === 'judge') return p.judgeZone;
      return null;
    }
    detach(card) {
      const loc = card.loc; if (!loc) return null;
      if (loc.zone === 'equip') { const p = this.players[loc.seat]; if (p.equips[loc.slot] === card) p.equips[loc.slot] = null; }
      else { const arr = this.zoneArray(loc); const i = arr ? arr.indexOf(card) : -1; if (i >= 0) arr.splice(i, 1); }
      const old = loc; card.loc = null; return old;
    }
    attach(card, zone, p, slot) {
      if (zone === 'deck') { this.deck.push(card); card.loc = { zone: 'deck' }; }
      else if (zone === 'deckBottom') { this.deck.unshift(card); card.loc = { zone: 'deck' }; }
      else if (zone === 'discard') { this.discardPile.push(card); card.loc = { zone: 'discard' }; }
      else if (zone === 'process') { this.processing.push(card); card.loc = { zone: 'process' }; }
      else if (zone === 'hand') { p.hand.push(card); card.loc = { zone: 'hand', seat: p.seat }; }
      else if (zone === 'judge') { p.judgeZone.push(card); card.loc = { zone: 'judge', seat: p.seat }; }
      else if (zone === 'equip') { p.equips[slot] = card; card.loc = { zone: 'equip', seat: p.seat, slot }; }
      else throw new Error('bad zone ' + zone);
    }
    // moves: [{cards, to, toPlayer, slot, reason, by}]
    *moveCards(moves) {
      moves = [].concat(moves);
      const record = [];
      for (const m of moves) {
        for (const c of m.cards) {
          if (!c || c.virtual) continue;
          const from = this.detach(c);
          this.attach(c, m.to, m.toPlayer, m.slot);
          record.push({ card: c, from, to: m.to === 'deckBottom' ? 'deck' : m.to, toSeat: m.toPlayer ? m.toPlayer.seat : null, reason: m.reason, by: m.by });
        }
      }
      if (!record.length) return record;
      // 记录移动的时机，界面据此把飞牌动画放在正确的位置（而不是一步开始时就飞）
      this.log('move', { ids: record.map(r => r.card.id), to: record[0].to, seat: record[0].toSeat, reason: record[0].reason || null });
      // 失去装备的效果（如 涅墨亚狮皮）
      for (const r of record) {
        if (r.from && r.from.zone === 'equip') {
          const d = CARD_DEFS[r.card.name]; const owner = this.players[r.from.seat];
          if (d && d.onUnequip && !owner.dead) yield* d.onUnequip(this, owner, r.card);
        }
      }
      yield* this.trigger('afterMove', { moves: record });
      return record;
    }
    *toDiscard(cards, reason, by) { cards = cards.filter(c => c && !c.virtual); if (cards.length) yield* this.moveCards({ cards, to: 'discard', reason, by }); }
    *clearProcessing(cards) { const left = cards.filter(c => c.loc && c.loc.zone === 'process'); if (left.length) yield* this.toDiscard(left, 'settle'); }

    takeTop(n) {
      const out = [];
      for (let i = 0; i < n; i++) {
        if (!this.deck.length) this.reshuffle();
        if (!this.deck.length) throw new GameOver([], 'draw-deck-empty');
        out.push(this.deck[this.deck.length - 1 - 0]); // 先取引用，真正移动由 moveCards 完成
        this.detach(out[out.length - 1]); this.processing.push(out[out.length - 1]); out[out.length - 1].loc = { zone: 'process' };
      }
      return out;
    }
    reshuffle() {
      if (!this.discardPile.length) return;
      const cs = this.discardPile.splice(0); this.shuffle(cs);
      for (const c of cs) { this.deck.unshift(c); c.loc = { zone: 'deck' }; }
      this.log('reshuffle', { n: cs.length });
    }
    *draw(p, n, reason) {
      if (n <= 0 || p.dead) return [];
      const cs = this.takeTop(n);
      yield* this.moveCards({ cards: cs, to: 'hand', toPlayer: p, reason: reason || 'draw' });
      this.log('draw', { seat: p.seat, n });
      return cs;
    }
    *gainCards(p, cards, reason, from) {
      if (!cards.length || p.dead) return;
      yield* this.moveCards({ cards, to: 'hand', toPlayer: p, reason: reason || 'gain', by: from ? from.seat : null });
      this.log('gain', { seat: p.seat, n: cards.length, from: from ? from.seat : null });
    }
    *discard(p, cards, reason) {
      if (!cards.length) return;
      this.log('discard', { seat: p.seat, cards: cards.map(c => c.id) });
      yield* this.moveCards({ cards, to: 'discard', reason: reason || 'discard', by: p.seat });
      yield* this.trigger('discarded', { player: p, cards, reason });
    }

    // ── 获得技能 ──
    gainSkill(p, id) { if (!p.skills.includes(id)) { p.skills.push(id); this.log('skillGained', { seat: p.seat, skill: id }); } }
    // ── 拼点：双方各出一张手牌，发起者点数大于对方才算赢 ──
    *pindian(a, b, reason) {
      if (!a.hand.length || !b.hand.length || a.dead || b.dead) return null;
      this.log('pindianStart', { a: a.seat, b: b.seat, reason });
      const [ca] = yield* this.chooseOwnCards(a, 1, 1, 'h', 'pindian', null, { pindianWith: b.seat, initiator: true, why: reason });
      this.log('pindianSet', { seat: a.seat });
      const [cb] = yield* this.chooseOwnCards(b, 1, 1, 'h', 'pindian', null, { pindianWith: a.seat, initiator: false, why: reason });
      this.log('pindianSet', { seat: b.seat });
      yield* this.moveCards({ cards: [ca, cb], to: 'process', reason: 'pindian' });
      const win = ca.rank > cb.rank;
      this.log('pindian', { a: a.seat, b: b.seat, ca: ca.id, cb: cb.id, win });
      return { win, ca, cb };
    }
    // ── 观看牌堆顶 n 张并重新排列（顶/底）──
    *arrangeTop(p, n, reason, extra) {
      n = Math.min(n, this.deck.length + this.discardPile.length); if (n <= 0) return;
      const cs = this.takeTop(n); // 暂放在处理区（仅观看者可见，不亮出）
      for (const c of cs) c.arranging = true;
      const a = yield* this.ask(p, Object.assign({ kind: 'arrange', options: cs.map(c => c.id), reason }, extra || {}));
      for (const c of cs) delete c.arranging;
      let top = (a && Array.isArray(a.top)) ? a.top.map(id => this.cards[id]).filter(c => cs.includes(c)) : cs.slice();
      top = [...new Set(top)];
      const bOrder = (a && Array.isArray(a.bottom)) ? a.bottom.map(id => this.cards[id]).filter(c => cs.includes(c) && !top.includes(c)) : [];
      const bottom = [...new Set(bOrder.concat(cs.filter(c => !top.includes(c))))];
      // top[0] 为最上面：倒序压入
      for (let i = top.length - 1; i >= 0; i--) { this.detach(top[i]); this.attach(top[i], 'deck'); }
      for (const c of bottom) { this.detach(c); this.attach(c, 'deckBottom'); }
      this.log('arrange', { seat: p.seat, top: top.length, bottom: bottom.length });
    }
    // ── 观看身份（只对观看者可见）──
    learnRole(p, t) { p.knownRoles = p.knownRoles || {}; p.knownRoles[t.seat] = t.role; this.log('viewRole', { seat: p.seat, target: t.seat, private: true }); }
    // ── 询问 ──
    *ask(p, req) { req.player = p; const ans = yield req; return ans; }
    *confirm(p, skill, extra) { if (p.dead) return false; const a = yield* this.ask(p, Object.assign({ kind: 'confirm', skill }, extra || {})); return !!a; }
    *chooseOption(p, options, reason, extra) {
      if (options.length === 1) return 0;
      const a = yield* this.ask(p, Object.assign({ kind: 'chooseOption', options, reason }, extra || {}));
      return (Number.isInteger(a) && a >= 0 && a < options.length) ? a : 0;
    }
    *chooseTargets(p, candidates, min, max, reason, extra) {
      if (!candidates.length) return [];
      const a = yield* this.ask(p, Object.assign({ kind: 'chooseTargets', options: candidates.map(c => c.seat), min, max, reason }, extra || {}));
      let sel = Array.isArray(a) ? [...new Set(a)].map(s => this.players[s]).filter(t => t && candidates.includes(t)) : [];
      if (sel.length > max) sel = sel.slice(0, max);
      if (sel.length < min) { for (const c of candidates) { if (sel.length >= min) break; if (!sel.includes(c)) sel.push(c); } }
      if (sel.length) this.log('aim', { seat: p.seat, targets: sel.map(t => t.seat), reason });
      return sel;
    }
    // 选择一名角色区域内的一张牌。zones: 'h' 手牌 'e' 装备 'j' 天兆区
    cardsIn(t, zones) {
      const out = [];
      if (zones.includes('h')) out.push(...t.hand);
      if (zones.includes('e')) out.push(...t.equipList);
      if (zones.includes('j')) out.push(...t.judgeZone);
      return out;
    }
    *chooseCardOf(p, t, zones, reason, extra) {
      const opts = this.cardsIn(t, zones).filter(c => !this.q('protectCard', false, c, p, t)); if (!opts.length) return null;
      const a = yield* this.ask(p, Object.assign({ kind: 'chooseCard', target: t.seat, zones, options: opts.map(c => c.id), reason }, extra || {}));
      let c = this.cards[a];
      if (!c || !opts.includes(c)) c = opts[0];
      // 选手牌时只决定"手牌中的某张"——由暗牌随机替代，避免偷看
      if (c.loc.zone === 'hand' && p !== t && !(extra && extra.visible)) c = this.pick(t.hand);
      return c;
    }
    // 一次选择一名角色区域内的 n 张牌（算作一次操作）
    *chooseCardsOf(p, t, zones, n, reason, extra) {
      const opts = this.cardsIn(t, zones).filter(c => !this.q('protectCard', false, c, p, t)); if (!opts.length) return [];
      n = Math.min(n, opts.length);
      const a = yield* this.ask(p, Object.assign({ kind: 'chooseCard', target: t.seat, zones, options: opts.map(c => c.id), count: n, reason }, extra || {}));
      let ids = Array.isArray(a) ? a : (a != null ? [a] : []);
      let sel = [...new Set(ids)].map(id => this.cards[id]).filter(c => c && opts.includes(c)).slice(0, n);
      for (const c of opts) { if (sel.length >= n) break; if (!sel.includes(c)) sel.push(c); }
      if (p !== t && !(extra && extra.visible)) {
        const nh = sel.filter(c => c.loc.zone === 'hand').length;
        if (nh) { const pool = t.hand.slice(); const hs = []; for (let i = 0; i < nh; i++) { const k = Math.floor(this.rand() * pool.length); hs.push(pool.splice(k, 1)[0]); } sel = sel.filter(c => c.loc.zone !== 'hand').concat(hs); }
      }
      return sel;
    }
    // 令 p 弃置/选择自己的牌
    *chooseOwnCards(p, min, max, zones, reason, filter, extra) {
      let opts = this.cardsIn(p, zones); if (filter) opts = opts.filter(filter);
      if (!opts.length || max <= 0) return [];
      min = Math.min(min, opts.length); max = Math.min(max, opts.length);
      const a = yield* this.ask(p, Object.assign({ kind: 'chooseCards', options: opts.map(c => c.id), min, max, reason }, extra || {}));
      let sel = Array.isArray(a) ? [...new Set(a)].map(id => this.cards[id]).filter(c => c && opts.includes(c)) : [];
      if (sel.length > max) sel = sel.slice(0, max);
      for (const c of opts) { if (sel.length >= min) break; if (!sel.includes(c)) sel.push(c); }
      return sel;
    }
    *askDiscard(p, min, max, zones, reason, filter, extra) {
      const cs = yield* this.chooseOwnCards(p, min, max, zones || 'h', reason || 'discard', filter, Object.assign({ discard: true }, extra || {}));
      if (cs.length) yield* this.discard(p, cs, reason);
      return cs;
    }

    // ── 触发（时机）──
    // 从当前回合角色起按座次；同一人多个技能自选顺序；非锁定技先询问是否发动。
    *trigger(event, data) {
      data = data || {}; data.event = event;
      const order = this.seatOrderFrom(this.current || this.players[0], true);
      for (const owner of order) {
        const done = new Set();
        for (let guard = 0; guard < 50; guard++) {
          const cands = this.skillList(owner).filter(s => {
            const t = s.def.triggers && s.def.triggers[event]; if (!t || done.has(s.key)) return false;
            if (owner.dead && !t.allowDead) return false;
            try { return !!t.can(this, owner, data, s); } catch (e) { throw e; }
          });
          if (!cands.length) break;
          let inst = cands[0];
          if (cands.length > 1) {
            const a = yield* this.ask(owner, { kind: 'chooseSkillOrder', options: cands.map(s => s.key), event });
            inst = cands.find(s => s.key === a) || cands[0];
          }
          done.add(inst.key);
          const t = inst.def.triggers[event];
          const optional = t.optional != null ? t.optional : !(inst.def.locked);
          if (optional) {
            const ok = yield* this.confirm(owner, inst.id, { event, data: this.describe(data) });
            if (!ok) continue;
          }
          if (!t.silent) this.log('skill', { seat: owner.seat, skill: inst.id, event });
          yield* t.on(this, owner, data, inst);
          if (data.stopTrigger) return data;
        }
      }
      return data;
    }
    describe(data) { // 给请求方的简要信息（避免把整个对象图交出去）
      const o = {};
      for (const k of ['amount', 'nature']) if (data[k] != null) o[k] = data[k];
      for (const k of ['player', 'from', 'to', 'target']) if (data[k] && data[k].seat != null) o[k] = data[k].seat;
      if (data.card) o.card = data.card.name;
      if (data.use) o.card = data.use.card.name;
      return o;
    }

    // ── 体力 ──
    *recover(p, n, source, card) {
      if (p.dead || n <= 0) return 0;
      const d = { player: p, amount: n, source, card };
      yield* this.trigger('recovering', d);
      if (d.prevented) return 0;
      const real = Math.min(d.amount, p.maxHp - p.hp); if (real <= 0) return 0;
      p.hp += real; this.hpChanges++; this.log('recover', { seat: p.seat, n: real, hp: p.hp });
      yield* this.trigger('recovered', { player: p, amount: real, source, card });
      return real;
    }
    *loseHp(p, n, reason) {
      if (p.dead || n <= 0) return;
      p.hp -= n; this.hpChanges++; this.log('loseHp', { seat: p.seat, n, hp: p.hp });
      if (p.hp <= 0) yield* this.dying(p, { reason: 'loseHp' });
      yield* this.trigger('hpLost', { player: p, amount: n, reason });
    }
    // 直接调整体力值（不算伤害或回复）
    *setHp(p, v, reason) {
      if (p.dead) return;
      v = Math.min(v, p.maxHp); if (v === p.hp) return;
      const old = p.hp; p.hp = v; this.hpChanges++;
      this.log('hpSet', { seat: p.seat, hp: v, old, reason });
      if (p.hp <= 0) yield* this.dying(p, { reason: 'hpSet' });
    }
    *changeMaxHp(p, delta, reason) {
      if (p.dead) return;
      p.maxHp += delta; if (p.hp > p.maxHp) p.hp = p.maxHp;
      this.log('maxHp', { seat: p.seat, delta, maxHp: p.maxHp });
      if (p.maxHp <= 0) { yield* this.die(p, null, { reason: 'maxHp' }); return; }
      yield* this.trigger('maxHpChanged', { player: p, delta, reason });
    }

    // ── 伤害 ──
    // d: { from, to, amount, nature:'normal'|'fire'|'thunder', card, use, conducted }
    *damage(d) {
      d = Object.assign({ amount: 1, nature: 'normal', from: null }, d);
      const to = d.to; if (!to || to.dead) return d;
      if (!d.conducted) {
        if (d.from && !d.from.dead) yield* this.trigger('damageCausing', d); // 造成伤害时
        if (d.prevented || d.amount <= 0) { this.log('damagePrevented', { to: to.seat }); return d; }
      }
      d.baseAmount = d.amount; // 传导伤害以此为准（来源一侧的加减已计入，受伤者一侧不计）
      yield* this.trigger('damageTaking', d); // 受到伤害时
      if (d.prevented || d.amount <= 0 || to.dead) { this.log('damagePrevented', { to: to.seat }); return d; }
      const chainedHit = to.chained && d.nature !== 'normal';
      if (chainedHit) { to.chained = false; this.log('chain', { seat: to.seat, on: false }); }
      to.hp -= d.amount; d.done = true; this.hpChanges++;
      if (d.use) d.use.data.dealt = (d.use.data.dealt || 0) + d.amount;
      this.log('damage', { from: d.from ? d.from.seat : null, to: to.seat, n: d.amount, nature: d.nature, hp: to.hp, card: d.card ? d.card.name : null });
      if (to.hp <= 0) yield* this.dying(to, { damage: d, source: d.from });
      if (d.from) yield* this.trigger('damageDone', d);  // 造成伤害后
      yield* this.trigger('damaged', d);                 // 受到伤害后
      if (chainedHit && !d.conducted) {
        for (const q of this.seatOrderFrom(this.current || to)) {
          if (q === to || !q.chained || q.dead) continue;
          yield* this.damage({ from: d.from, to: q, amount: d.baseAmount, nature: d.nature, card: d.card, use: d.use, conducted: true });
        }
      }
      return d;
    }

    // ── 濒死与死亡 ──
    *dying(p, info) {
      if (p.dead || p.hp > 0 || p.dying) return;
      p.dying = true; this.log('dying', { seat: p.seat });
      const data = Object.assign({ player: p }, info || {});
      yield* this.trigger('enterDying', data);
      if (!p.dead && p.hp <= 0 && !data.noSave) {
        for (const q of this.seatOrderFrom(this.current || p)) {
          while (!p.dead && p.hp <= 0 && !q.dead) {
            const pats = q === p ? ['remedy', 'grog'] : ['remedy'];
            const r = yield* this.askRespond(q, { pattern: pats, mode: 'use', reason: 'save', target: p.seat, useTargets: [p], effect: true });
            if (!r) break;
          }
          if (p.dead || p.hp > 0) break;
        }
      }
      p.dying = false;
      if (p.dead) return;
      if (p.hp <= 0) { yield* this.die(p, info ? info.source : null, info); return; }
      yield* this.trigger('leaveDying', { player: p });
    }
    *die(p, killer, info) {
      if (p.dead) return;
      p.dead = true; p.dying = false; p.roleShown = true;
      this.log('death', { seat: p.seat, role: p.role, killer: killer ? killer.seat : null });
      this.checkWin();
      yield* this.trigger('death', { player: p, killer, info });
      // 奖惩
      if (killer && !killer.dead) {
        if (p.role === 'insurgent') { yield* this.draw(killer, 3, 'reward'); }
        else if (p.role === 'keeper' && killer.role === 'chancellor') {
          const all = [...killer.hand, ...killer.equipList]; if (all.length) yield* this.discard(killer, all, 'penalty');
        }
      }
      const rest = [...p.hand, ...p.equipList, ...p.judgeZone];
      if (rest.length) yield* this.moveCards({ cards: rest, to: 'discard', reason: 'death' });
      p.chained = false;
      yield* this.trigger('afterDeath', { player: p, killer });
    }
    checkWin() {
      const alive = this.alive; const sov = this.players.find(p => p.role === 'chancellor');
      if (sov && sov.dead) {
        if (alive.length === 1 && alive[0].role === 'schemer') throw new GameOver(['schemer'], 'schemer');
        throw new GameOver(['insurgent'], 'chancellor-dead');
      }
      if (!alive.some(p => p.role === 'insurgent' || p.role === 'schemer')) throw new GameOver(['chancellor', 'keeper'], 'loyal');
    }

    // ── 天意（判定）──
    // effect*(card) 在改判结束、结果确定后执行；随后判定牌进入弃牌堆（除非被技能获得）
    *judge(p, reason, effect) {
      const [card] = this.takeTop(1);
      const j = { player: p, card, reason, all: [card] };
      this.log('judge', { seat: p.seat, reason, card: card.id });
      yield* this.trigger('judgeRetouch', j);  // 生效前：改判
      this.log('judgeResult', { seat: p.seat, reason, card: j.card.id });
      if (effect) yield* effect(j.card);
      yield* this.trigger('judgeDone', j);      // 生效后（如获得判定牌）
      this.log('judgeClear', { seat: p.seat, cards: j.all.map(c => c.id) });   // 每次判定结算后清掉判定牌
      yield* this.clearProcessing([j.card]);
      return j.card;
    }
    // 改判：以 newCard 替换当前判定牌
    *retouch(j, by, newCard) {
      const old = j.card;
      yield* this.moveCards({ cards: [newCard], to: 'process', by: by.seat, reason: 'retouch' });
      j.card = newCard; if (j.all) j.all.push(newCard);
      this.log('retouch', { seat: by.seat, old: old.id, card: newCard.id });
      if (old.loc && old.loc.zone === 'process') yield* this.toDiscard([old], 'retouch');
    }

    // ── 响应（使用 / 打出）──
    viewAsSkills(p, patterns, ctx) {
      return this.skillList(p).filter(s => {
        const v = s.def.viewAs; if (!v) return false;
        if (!v.patterns.some(x => [].concat(patterns).includes(x))) return false;
        return !v.can || v.can(this, p, ctx, s);
      });
    }
    forbidden(p, c) { return this.q('forbid', false, p, c); }
    canProduce(p, patterns, ctx) {
      if (p.hand.some(c => matches(c, patterns) && !this.forbidden(p, c))) return true;
      return this.viewAsSkills(p, patterns, ctx).length > 0;
    }
    // 把答案 {cardIds, skill} 变成一张（可能是虚拟的）牌；非法返回 null
    buildCard(p, ans, patterns, ctx) {
      if (!ans || !Array.isArray(ans.cardIds)) return null;
      const cs = ans.cardIds.map(id => this.cards[id]);
      if (cs.some(c => !c)) return null;
      if (ans.skill) {
        const inst = this.skillList(p).find(s => (s.key === ans.skill || s.id === ans.skill) && s.def.viewAs);
        if (!inst) return null;
        const v = inst.def.viewAs;
        if (v.can && !v.can(this, p, ctx, inst)) return null;
        const zones = v.zones || 'h';
        if (cs.some(c => !this.cardsIn(p, zones).includes(c))) return null;
        const n = v.count == null ? 1 : v.count;
        if (cs.length !== n) return null;
        if (v.filter && cs.some(c => !v.filter(this, p, c, ctx))) return null;
        const name = typeof v.as === 'function' ? v.as(this, p, cs, ctx, ans) : v.as;
        if (!name) return null;
        const vc = virtualCard(name, cs, { viaSkill: inst.id });
        if (patterns && !matches(vc, patterns)) return null;
        return vc;
      }
      if (cs.length !== 1) return null;
      const c = cs[0];
      if (!p.hand.includes(c) || this.forbidden(p, c)) return null;
      if (patterns && !matches(c, patterns)) return null;
      return c;
    }
    // req: { pattern, mode:'use'|'play', reason, useTargets?, effect?, source? }
    *askRespond(p, req) {
      if (!p || p.dead) return null;
      const pats = [].concat(req.pattern);
      const pre = { player: p, req: Object.assign({}, req, { pattern: pats }), result: null };
      yield* this.trigger('askResponse', pre);   // 如 雅典娜之盾 判定、号令/勤王
      if (p.dead) return null;
      let card = pre.result;
      if (!card) {
        if (!this.canProduce(p, pats, req)) return null;
        const ans = yield* this.ask(p, Object.assign({}, req, { kind: 'respond', pattern: pats, useTargets: undefined, targets: req.useTargets ? req.useTargets.map(t => t.seat) : undefined }));
        card = this.buildCard(p, ans, pats, req);
        if (!card) return null;
      }
      yield* this.finishResponse(p, card, req, pre.by);
      return card;
    }
    *finishResponse(p, card, req, by) {
      const actor = by || p;
      if (req.mode === 'use') {
        yield* this.useCard(actor, card, req.useTargets || [], { response: !req.effect, save: req.reason === 'save', for: p, req });
      } else {
        const real = card.subcards.filter(c => !c.virtual);
        this.log('play', { seat: actor.seat, card: card.name, ids: real.map(c => c.id), reason: req.reason });
        if (real.length) yield* this.moveCards({ cards: real, to: 'process', by: actor.seat, reason: 'play' });
        yield* this.trigger('cardPlayed', { player: actor, card, req, for: p });
        yield* this.clearProcessing(real);
      }
    }

    // ── 力挽狂澜（无懈可击）链 ──
    // effect: { use, target } 或 { veto: card, from, target: effect }。返回 true 表示被抵消。
    *askVeto(effect) {
      // 自己使用的单目标锦囊不问自己（多目标仍会问）
      const selfSingle = effect.use && effect.use.from && effect.use.targets && effect.use.targets.length === 1 ? effect.use.from : null;
      // 参照无名杀：没有人能出无懈可击时不开无懈窗口，直接结算
      const can = this.seatOrderFrom(this.current || this.players[0]).filter(q => q !== selfSingle && !q.dead && this.canProduce(q, ['veto'], { reason: 'veto' }));
      if (!can.length) return false;
      this.log('vetoWindow', { of: this.describeEffect(effect), skip: selfSingle ? selfSingle.seat : null, who: can.map(q => q.seat) });
      for (let guard = 0; guard < 100; guard++) {
        let countered = false, someone = false;
        for (const q of this.seatOrderFrom(this.current || this.players[0])) {
          if (q === selfSingle) continue;
          if (!this.canProduce(q, ['veto'], { reason: 'veto' })) continue;
          const card = yield* this.askRespond(q, { pattern: ['veto'], mode: 'use', reason: 'veto', vetoOf: this.describeEffect(effect) });
          if (!card) continue;
          someone = true;
          const cancelled = yield* this.askVeto({ veto: card, from: q, target: effect });
          if (!cancelled) { countered = true; }
          break; // 有人出过一张后重新从头询问
        }
        if (!someone) return false;
        if (countered) {
          // 原效果被抵消；但仍可再被别人"抵消这次抵消"——这已在递归中处理，直接返回
          return true;
        }
        // 出的力挽狂澜被抵消了：重新询问是否还有人要抵消原效果
      }
      return false;
    }
    describeEffect(e) {
      if (e.use) return { card: e.use.card.name, from: e.use.from ? e.use.from.seat : null, target: e.target ? e.target.seat : null };
      if (e.veto) return { card: 'veto', from: e.from.seat, of: this.describeEffect(e.target) };
      if (e.omen) return { card: e.omen.name, target: e.target.seat, omen: true };
      return {};
    }

    // ── 用牌 ──
    targetSpec(p, card) { const d = CARD_DEFS[card.name]; return d && d.targets; }
    // 第 k 个目标的候选（依赖已选 selected）
    targetCandidates(p, card, selected) {
      const d = CARD_DEFS[card.name]; selected = selected || [];
      const spec = d.targets; if (!spec || typeof spec === 'string') return [];
      return this.alive.filter(t => !selected.includes(t) && spec.filter(this, p, t, selected, card, {}) && this.targetAllowed(p, t, card));
    }
    targetAllowed(user, t, card) { return this.q('canTarget', true, user, t, card); }
    maxTargets(p, card) {
      const spec = CARD_DEFS[card.name].targets; if (!spec || typeof spec === 'string') return 0;
      let m = typeof spec.max === 'function' ? spec.max(this, p, card) : spec.max;
      if (spec.extendable !== false) m = this.q('maxTargets', m, p, card);
      return m;
    }
    autoTargets(p, card) {
      const d = CARD_DEFS[card.name]; const spec = d.targets;
      let list;
      if (spec === 'self') list = [p];
      else if (spec === 'others') list = this.seatOrderFrom(this.nextAlive(p)).filter(t => t !== p);
      else if (spec === 'all') list = this.seatOrderFrom(p);
      else if (spec === 'none') list = [];
      else return null;
      return list.filter(t => this.targetAllowed(p, t, card));
    }
    canUseCard(p, card, targets, opts) {
      opts = opts || {};
      const d = CARD_DEFS[card.name]; if (!d) return false;
      if (d.canUse && !d.canUse(this, p, card, opts)) return false;
      const auto = this.autoTargets(p, card);
      if (auto) {
        if (d.needTargets && !auto.length) return false;
        return true;
      }
      targets = targets || [];
      const spec = d.targets;
      const min = spec.min == null ? 1 : spec.min, max = this.maxTargets(p, card);
      if (targets.length < min || targets.length > max) return false;
      const sel = [];
      for (const t of targets) {
        if (!t || t.dead || sel.includes(t)) return false;
        if (!spec.filter(this, p, t, sel, card, opts) || !this.targetAllowed(p, t, card)) return false;
        sel.push(t);
      }
      if (spec.check && !spec.check(this, p, sel, card)) return false;
      if (!this.q('targetsValid', true, p, card, sel)) return false;
      return true;
    }
    // 出牌阶段内能否主动使用（有无合法目标）
    playable(p, card, o) {
      const d = CARD_DEFS[card.name]; if (!d || d.noActiveUse) return false;
      if (!card.virtual && this.forbidden(p, card)) return false;
      if (d.canUse && !d.canUse(this, p, card, o || { phase: true })) return false;
      if (this.autoTargets(p, card)) return this.canUseCard(p, card, [], o || { phase: true });
      return this.targetCandidates(p, card, []).length > 0;
    }

    // use: { card, from, targets, data, nullified:Set, noResponse:Set, extraDamage }
    // 中央出牌区的清理（参照无名杀 useCardAfter）：最外层的一次用牌完全结算完（含闪、无懈、伤害、求药）才清空；
    // 无懈可击本身不清，跟随外层锦囊 / 天兆一起清
    *useCard(from, card, targets, opts) {
      this.useDepth = (this.useDepth || 0) + 1;
      let use;
      try { use = yield* this.useCardInner(from, card, targets, opts); }
      finally { this.useDepth--; }
      if (this.useDepth === 0 && card.name !== 'veto') this.log('tableClear', { reason: 'use', card: card.name });
      return use;
    }
    *useCardInner(from, card, targets, opts) {
      opts = opts || {};
      const d = CARD_DEFS[card.name];
      if (targets == null) targets = this.autoTargets(from, card) || [];
      const use = { id: ++this.seq, card, from, targets: targets.slice(), opts, data: {}, nullified: new Set(), noResponse: new Set(), extraDamage: 0 };
      const real = card.subcards.filter(c => !c.virtual);
      this.log('use', { seat: from.seat, card: card.name, ids: real.map(c => c.id), targets: use.targets.map(t => t.seat), virtual: !!card.virtual, skill: card.viaSkill || null });
      if (real.length) yield* this.moveCards({ cards: real, to: 'process', by: from.seat, reason: 'use' });
      if (family(card) === 'strike' && opts.phase && !opts.noCount) { from.phaseState.strikes = (from.phaseState.strikes || 0) + 1; }
      if (card.name === 'grog' && !opts.save) from.turnState.grogs = (from.turnState.grogs || 0) + 1;
      if (this.current === from) {
        from.turnState.lastUsed = card.name;
        if (family(card) === 'strike' && this.phase === 'play') from.turnState.usedStrikeInPlay = true;
      }
      if (d.prepare) d.prepare(this, use);

      if (d.type === 'equip') {
        yield* this.trigger('cardUsing', { use });
        yield* this.equip(from, card);
        yield* this.trigger('cardUsed', { use });
        return use;
      }
      if (d.type === 'omen') {
        yield* this.trigger('cardUsing', { use });
        const t = use.targets[0];
        if (t && !t.dead && real.length) {
          // 天兆牌以其"当作的牌名"放置
          const c = real[0]; c.omenAs = card.name;
          yield* this.moveCards({ cards: [c], to: 'judge', toPlayer: t, by: from.seat, reason: 'omen' });
        }
        yield* this.trigger('cardUsed', { use });
        yield* this.clearProcessing(real);
        return use;
      }

      // 酒的加成
      if (family(card) === 'strike' && from.turnState.drunk) { use.extraDamage += 1; from.turnState.drunk = false; use.data.drunk = true; }
      yield* this.trigger('cardUsing', { use });      // 使用时（如 火绳枪改火杀）
      if (!opts.response) {
        yield* this.trigger('targeting', { use });    // 指定目标时（可改目标）
        for (const t of use.targets.slice()) yield* this.trigger('targeted', { use, target: t }); // 成为目标时
        yield* this.trigger('targetConfirmed', { use }); // 指定目标后
        for (const t of use.targets.slice()) yield* this.trigger('becameTarget', { use, target: t }); // 成为目标后
        if (d.before) yield* d.before(this, use);
        if (d.targets === 'none' && d.effect) {
          yield* d.effect(this, use, null);
        } else {
          for (const t of use.targets.slice()) {
            if (this.over) break;
            if (t.dead && !d.allowDeadTarget) continue;
            if (use.nullified.has(t)) continue;
            if (d.skipTarget && d.skipTarget(this, use, t)) continue;
            const pre = { use, target: t, cancel: false };
            yield* this.trigger('effectBefore', pre); // 生效前（龟甲阵、亚麻胸甲判"无效"）
            if (pre.cancel) { use.nullified.add(t); this.log('nullified', { seat: t.seat, card: card.name }); continue; }
            if (d.type === 'stratagem' && !use.data.unvetoable && !opts.noVeto) {
              if (d.vetoable === false) {} else if (yield* this.askVeto({ use, target: t })) { use.nullified.add(t); this.log('vetoed', { seat: t.seat, card: card.name }); continue; }
            }
            if (t.dead && !d.allowDeadTarget) continue;
            if (d.effect) yield* d.effect(this, use, t);
          }
        }
        if (d.after) yield* d.after(this, use);
      }
      yield* this.trigger('cardUsed', { use }); // 使用结算后
      yield* this.clearProcessing(real);
      return use;
    }
    // 视为使用（无实体牌）
    *useVirtual(from, name, targets, opts, subcards) { return yield* this.useCard(from, virtualCard(name, subcards || []), targets, opts); }

    *equip(p, card) {
      const d = CARD_DEFS[card.name]; const slot = d.sub;
      const old = p.equips[slot];
      if (old) yield* this.moveCards({ cards: [old], to: 'discard', reason: 'replaceEquip' });
      if (p.dead) return;
      yield* this.moveCards({ cards: [card], to: 'equip', toPlayer: p, slot, reason: 'equip' });
      this.log('equip', { seat: p.seat, card: card.name, id: card.id });
    }

    // 询问 p 是否对 targets 之一使用一张杀（驱虎吞狼、狂战士斧等）
    *askUseStrike(p, candidates, reason, opts) {
      opts = opts || {};
      candidates = candidates.filter(t => !t.dead && t !== p);
      if (!candidates.length || !this.canProduce(p, ['strike'], { reason })) return null;
      const ans = yield* this.ask(p, { kind: 'useStrike', options: candidates.map(t => t.seat), reason });
      if (!ans) return null;
      const card = this.buildCard(p, ans, ['strike'], { reason });
      if (!card) return null;
      let tgt = this.players[ans.target]; if (!candidates.includes(tgt)) tgt = candidates[0];
      const o = Object.assign({ noCount: true, ignoreDistance: !!opts.ignoreDistance }, opts);
      if (!this.canUseCard(p, card, [tgt], o)) { if (!opts.force) return null; }
      return yield* this.useCard(p, card, [tgt], o);
    }

    // ───────────────────────── 回合 ─────────────────────────
    *setup() {
      const roles = this.opts.roles ? this.opts.roles.slice() : ROLESETS[this.n].slice();
      // 执笔者坐 0 号位，其余身份随机
      let arr;
      if (this.opts.fixedRoles) arr = roles;
      else {
        const rest = this.shuffle(roles.filter(r => r !== 'chancellor'));
        arr = roles.includes('chancellor') ? ['chancellor', ...rest] : rest;
      }
      this.players.forEach((p, i) => { p.role = arr[i]; p.roleShown = p.role === 'chancellor'; });
      // 牌堆
      const list = this.opts.deckList || (Game.defaultDeck ? Game.defaultDeck() : []);
      let id = 1;
      for (const [name, suit, rank] of list) { const c = new Card(id++, name, suit, rank); this.cards[c.id] = c; this.deck.push(c); c.loc = { zone: 'deck' }; }
      if (!this.opts.noShuffle) this.shuffle(this.deck);
      // 武将
      for (const p of this.players) { p.hero = null; p.maxHp = 4; p.hp = 4; }
      if (this.opts.heroes) { for (const p of this.players) if (this.opts.heroes[p.seat]) this.assignHero(p, this.opts.heroes[p.seat]); }
      else if (this.opts.selectHeroes && Object.keys(HEROES).length) yield* this.selectHeroes();
      for (const p of this.players) if (!p.hero && p.role === 'chancellor' && this.n >= 5) { p.maxHp = 5; p.hp = 5; }
      this.log('start', { n: this.n, roles: this.players.map(p => p.role) });
      yield* this.trigger('gameStart', {});
      const initial = this.opts.initialHand == null ? 4 : this.opts.initialHand;
      for (const p of this.players) yield* this.draw(p, initial, 'initial');
      this.current = this.players.find(p => p.role === 'chancellor') || this.players[0];
    }
    assignHero(p, key) {
      const h = HEROES[key]; if (!h) return;
      p.hero = key; p.gender = h.gender || 'male'; p.faction = h.faction; p.maxHp = h.hp; p.skills = (h.skills || []).slice();
      if (p.role === 'chancellor') {
        if (this.n >= 5) p.maxHp += 1;
        const lord = Game.lordSkills[h.faction]; if (lord) p.skills.push(lord);
      }
      p.hp = p.maxHp;
    }
    // 替换武将（体力与上限保持不变）
    replaceHero(p, key) {
      const h = HEROES[key]; if (!h) return;
      p.hero = key; p.gender = h.gender || 'male'; p.faction = h.faction; p.skills = (h.skills || []).slice();
      if (p.role === 'chancellor') { const lord = Game.lordSkills[h.faction]; if (lord) p.skills.push(lord); }
      this.log('heroReplaced', { seat: p.seat, hero: key });
    }
    // 选将：执笔者先从 8 名里选（每阵营至少 2 名），其他人依次从 5 名里选（每阵营至少 1 名）；每个候选可刷新一次
    heroCandidates(n, per, picked) {
      const keys = Object.keys(HEROES).filter(k => !HEROES[k].hidden && !picked.has(k));
      const factions = [...new Set(Object.values(HEROES).map(h => h.faction))];
      const out = [];
      for (let r = 0; r < per; r++) for (const f of factions) {
        if (out.length >= n) break;
        const c = keys.filter(k => HEROES[k].faction === f && !out.includes(k));
        if (c.length) out.push(this.pick(c));
      }
      const rest = this.shuffle(keys.filter(k => !out.includes(k)));
      while (out.length < n && rest.length) out.push(rest.pop());
      return out;
    }
    *selectHeroes() {
      const picked = new Set();
      const sov = this.players.find(p => p.role === 'chancellor') || this.players[0];
      for (const p of this.seatOrderFrom(sov)) {
        const isSov = p === sov;
        const cands = this.heroCandidates(isSov ? (this.opts.chancellorChoices || 8) : (this.opts.heroChoices || 5), isSov ? 2 : 1, picked);
        if (!cands.length) continue;
        const refreshed = cands.map(() => false);
        let key = null;
        for (let guard = 0; guard < 50 && !key; guard++) {
          const a = yield* this.ask(p, { kind: 'chooseHero', options: cands.slice(), refreshed: refreshed.slice(), chancellorHero: isSov ? null : sov.hero });
          if (a && a.refresh != null && refreshed[a.refresh] === false) {
            const pool = Object.keys(HEROES).filter(k => !HEROES[k].hidden && !picked.has(k) && !cands.includes(k));
            if (pool.length) cands[a.refresh] = this.pick(pool);
            refreshed[a.refresh] = true; continue;
          }
          key = (a && cands.includes(a.pick)) ? a.pick : cands[0];
        }
        picked.add(key); this.assignHero(p, key);
        if (isSov) this.log('heroChosen', { seat: p.seat, hero: key });
      }
      // 其他角色同时亮将
      for (const p of this.seatOrderFrom(sov)) if (p !== sov && p.hero) this.log('heroChosen', { seat: p.seat, hero: p.hero });
      this.heroesRevealed = true;
    }
    *run() {
      try {
        yield* this.setup();
        let p = this.current;
        for (let t = 0; t < (this.opts.maxTurns || 2000); t++) {
          yield* this.turn(p);
          while (this.extraTurns.length) { const q = this.extraTurns.shift(); if (!q.dead) yield* this.turn(q, true); }
          const nx = this.nextAlive(p); if (!nx) break;
          if (nx.seat <= p.seat) this.round++;
          p = nx;
        }
        throw new GameOver([], 'turn-limit');
      } catch (e) {
        if (e && e.qxGameOver) { this.over = true; this.result = { winners: e.winners, reason: e.reason }; this.log('gameOver', this.result); return this.result; }
        throw e;
      }
    }
    *turn(p, extra) {
      this.current = p; p.turnState = {}; p.phaseState = {};
      this.log('turn', { seat: p.seat, extra: !!extra }); this.hpChanges = 0; this.turnSeq = (this.turnSeq || 0) + 1;
      if (p.faceDown) { p.faceDown = false; this.log('flip', { seat: p.seat, faceDown: false, skipTurn: true }); return; }
      const phases = PHASES.slice(); p.turnState.phases = phases; p.turnState.skip = p.turnState.skip || new Set();
      for (let i = 0; i < phases.length; i++) {
        if (p.dead) break;
        const ph = phases[i];
        if (p.turnState.skip.has(ph)) { p.turnState.skip.delete(ph); this.log('skipPhase', { seat: p.seat, phase: ph }); if (ph === 'prepare' && !p.turnState.startFired) { p.turnState.startFired = true; yield* this.trigger('turnStart', { player: p }); } continue; }
        yield* this.runPhase(p, ph);
      }
      if (!p.dead) yield* this.trigger('turnEnd', { player: p });
      p.turnState.drunk = false;
      this.phase = null;
    }
    skipPhase(p, ph) { (p.turnState.skip = p.turnState.skip || new Set()).add(ph); }
    *runPhase(p, ph) {
      this.phase = ph; p.phaseState = {};
      this.log('phase', { seat: p.seat, phase: ph });
      // 「回合开始时」的效果属于回合开始阶段：先亮出阶段标签，再触发
      if (ph === 'prepare' && !p.turnState.startFired) { p.turnState.startFired = true; yield* this.trigger('turnStart', { player: p }); if (p.dead) return; }
      const sd = { player: p, phase: ph };
      yield* this.trigger('phaseStart', sd);
      if (p.dead) return;
      if (sd.skip) { this.log('skipPhase', { seat: p.seat, phase: ph }); }
      else if (ph === 'judge') yield* this.judgePhase(p);
      else if (ph === 'draw') yield* this.drawPhase(p);
      else if (ph === 'play') yield* this.playPhase(p);
      else if (ph === 'discard') yield* this.discardPhase(p);
      if (!p.dead) yield* this.trigger('phaseEnd', { player: p, phase: ph });
    }
    *judgePhase(p) {
      for (let guard = 0; guard < 20 && p.judgeZone.length && !p.dead; guard++) {
        const c = p.judgeZone[p.judgeZone.length - 1]; // 后放入的先判定
        const name = c.omenAs || c.name; const d = CARD_DEFS[name];
        c.omenJudging = p.seat;   // 界面：判定期间天兆标记仍显示在原处
        yield* this.moveCards({ cards: [c], to: 'process', reason: 'omenJudge' });
        const vetoed = yield* this.askVeto({ omen: c, target: p });
        if (vetoed) { this.log('vetoed', { seat: p.seat, card: name }); if (d.onVetoed) yield* d.onVetoed(this, p, c); }
        else yield* d.judgeEffect(this, p, c);
        delete c.omenJudging;
        if (c.loc && c.loc.zone === 'process') { delete c.omenAs; yield* this.toDiscard([c], 'omen'); }
        if (!this.useDepth) this.log('tableClear', { reason: 'omen' });
      }
    }
    *drawPhase(p) {
      const data = { player: p, n: 2 };
      yield* this.trigger('drawCount', data);
      if (data.replaced) return;
      yield* this.draw(p, data.n, 'phase');
    }
    *playPhase(p) {
      let bad = 0;
      for (let guard = 0; guard < 500 && !p.dead && !p.phaseState.endPlay; guard++) {
        const ans = yield* this.ask(p, { kind: 'play' });
        if (!ans || ans.action === 'end') break;
        const ok = yield* this.doAction(p, ans);
        if (!ok) { bad++; if (bad >= 5) break; }
      }
    }
    *doAction(p, ans) {
      if (ans.action === 'card') {
        const card = this.buildCard(p, ans, null, { reason: 'play', phase: true });
        if (!card) return false;
        const d = CARD_DEFS[card.name]; if (!d || d.noActiveUse) return false;
        const targets = this.autoTargets(p, card) || (ans.targets || []).map(s => this.players[s]);
        if (!this.canUseCard(p, card, targets, { phase: true })) return false;
        yield* this.useCard(p, card, targets, { phase: true });
        return true;
      }
      if (ans.action === 'recast') {
        const c = this.cards[ans.cardIds && ans.cardIds[0]];
        if (!c || !p.hand.includes(c) || !CARD_DEFS[c.name].recastable) return false;
        this.log('recast', { seat: p.seat, card: c.name, id: c.id });
        yield* this.moveCards({ cards: [c], to: 'discard', by: p.seat, reason: 'recast' });
        yield* this.draw(p, 1, 'recast');
        return true;
      }
      if (ans.action === 'skill') {
        const inst = this.skillList(p).find(s => (s.key === ans.skill || s.id === ans.skill) && s.def.active);
        if (!inst) return false;
        const a = inst.def.active;
        if (a.can && !a.can(this, p, inst, ans)) return false;
        const cards = (ans.cardIds || []).map(id => this.cards[id]);
        const targets = (ans.targets || []).map(s => this.players[s]);
        if (cards.some(c => !c) || targets.some(t => !t)) return false;
        if (a.valid && !a.valid(this, p, cards, targets, inst, ans)) return false;
        this.log('skill', { seat: p.seat, skill: inst.id, active: true, targets: targets.map(t => t.seat) });
        this.useDepth = (this.useDepth || 0) + 1;
        try { yield* a.use(this, p, cards, targets, inst, ans); } finally { this.useDepth--; }
        if (this.useDepth === 0) this.log('tableClear', { reason: 'skill' });
        return true;
      }
      return false;
    }
    *discardPhase(p) {
      const limit = this.handLimit(p); const over = p.hand.length - limit;
      if (over > 0) yield* this.askDiscard(p, over, over, 'h', 'phaseDiscard');
    }

    // 方便测试/界面的状态快照
    snapshot(viewer) {
      return this.players.map(p => ({
        seat: p.seat, hero: p.hero, hp: p.hp, maxHp: p.maxHp, dead: p.dead,
        role: (p.roleShown || viewer === p.seat || viewer === 'all') ? p.role : null,
        hand: (viewer === p.seat || viewer === 'all') ? p.hand.map(c => c.id) : p.hand.length,
        equips: Object.fromEntries(Object.entries(p.equips).map(([k, v]) => [k, v ? v.id : null])),
        judge: p.judgeZone.map(c => c.omenAs || c.name), chained: p.chained, faceDown: p.faceDown,
      }));
    }
  }
  Game.lordSkills = {}; // 阵营 → 主公技 id
  Game.defaultDeck = null;

  // ───────────────────────── 驱动器 ─────────────────────────
  // 同步驱动：agents[seat].decide(game, req) → answer
  function runSync(game, agents, opts) {
    opts = opts || {};
    const gen = game.run(); let r = gen.next(); let steps = 0;
    const max = opts.maxSteps || 200000;
    while (!r.done) {
      if (++steps > max) throw new Error('step limit exceeded (possible stall)');
      const req = r.value; const a = agents[req.player.seat] || agents.default;
      r = gen.next(a ? a.decide(game, req) : null);
    }
    return game.result;
  }
  // 异步驱动（界面用）：agent.decide 可返回 Promise
  async function runAsync(game, agents) {
    const gen = game.run(); let r = gen.next();
    while (!r.done) { const req = r.value; const a = agents[req.player.seat] || agents.default; r = gen.next(await a.decide(game, req)); }
    return game.result;
  }

  return { Game, Player, Card, GameOver, virtualCard, family, matches, CARD_DEFS, SKILLS, HEROES, SUITS, SUIT_COLOR, PHASES, ROLESETS, runSync, runAsync, rng };
});
