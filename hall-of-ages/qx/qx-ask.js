/* 群星议会 · 统一询问框架（qx-ask.js）
 *
 * 思路：每一次「询问」（出牌阶段、出闪、无懈、选目标、弃牌……）都转成同一种「模式」对象：
 *   cards   : { pool, filter(c, sel), min, max }        哪些牌能选、选几张
 *   targets : { filter(p, picked, card), min, max, keep } 哪些角色能选、选几名（可依赖已选的牌）
 *   ok()    : 额外的「能否确定」条件
 *   answer(): 生成交给引擎的答复
 * 发动技能（转化技 / 主动技 / 装备技）时，用技能自己的模式替换当前模式；取消即恢复。
 * 每次点击只改「已选」，然后 refresh() 统一重算：可选的牌、可选的角色、确定按钮。
 * 渲染只读 refresh() 的结果（u.view），不再各处单独判断。
 */
(function (root) {
  'use strict';
  const E = root.QXEngine; const D = E.CARD_DEFS;

  const NONE = { min: 0, max: 0 };
  const rng = (o, d) => { const r = Object.assign({}, d || NONE, o || {}); if (r.min == null) r.min = r.max; return r; };

  // ── 当前选择组成的牌（可能是转化出的虚拟牌）
  function curCard(t) {
    const u = t.ui, g = t.g, me = g.p(t.me); const k = u.req.kind;
    if (u.skill) {
      const inst = g.skillList(me).find(s => s.key === u.skill); if (!inst || !inst.def.viewAs) return null;
      const v = inst.def.viewAs; const n = v.count == null ? 1 : v.count;
      if (u.sel.length !== n) return null;
      return g.buildCard(me, { cardIds: u.sel.map(c => c.id), skill: u.skill, asName: u.asName },
        k === 'play' ? null : (u.req.pattern || ['strike']), k === 'play' ? { phase: true } : u.req);
    }
    return u.sel.length === 1 ? u.sel[0] : null;
  }

  // 出牌阶段：一张牌（实体或转化）选好后的目标规则
  function playTargets(t, card) {
    const g = t.g, me = g.p(t.me);
    if (!card || g.autoTargets(me, card) || !D[card.name] || !D[card.name].targets) return NONE;
    const spec = D[card.name].targets;
    return { min: spec.min == null ? 1 : spec.min, max: g.maxTargets(me, card), filter: (p, picked) => g.targetCandidates(me, card, picked).includes(p) };
  }

  // ── 由询问 + 当前技能状态得到「模式」
  function modeOf(t) {
    const u = t.ui, g = t.g, me = g.p(t.me), req = u.req, k = req.kind;
    const hand = () => me.hand.slice();
    const byIds = ids => () => ids.map(id => g.card(id)).filter(Boolean);

    // 主动技（含装备主动技）
    if (k === 'play' && u.active) {
      const sp = t.activeSpec(); if (!sp) return null;
      const cs = sp.cards || NONE;
      return {
        kind: 'active', sp,
        cards: { pool: () => g.cardsIn(me, cs.zones || 'h'), filter: c => !cs.filter || cs.filter(g, me, c), min: cs.min || 0, max: cs.max || 0 },
        targets: { min: sp.tg.min || 0, max: sp.tg.max || 0, keep: true, filter: (p, picked) => !p.dead && (!sp.tg.filter || sp.tg.filter(g, me, p, picked)) },
        ok: () => { const a = sp.a; if (a.can && !a.can(g, me, sp.inst, sp.ans)) return false; return !a.valid || a.valid(g, me, u.sel, u.targets, sp.inst, sp.ans); },
        answer: () => { const a = { action: 'skill', skill: u.active.key, cardIds: u.sel.map(c => c.id), targets: u.targets.map(p => p.seat) }; if (u.active.option != null) a.option = u.active.option; return a; },
      };
    }
    // 转化技（含装备转化技，如萨里沙长矛）
    if (u.skill) {
      const inst = g.skillList(me).find(s => s.key === u.skill); if (!inst || !inst.def.viewAs) return null;
      const v = inst.def.viewAs; const n = v.count == null ? 1 : v.count;
      const ctx = k === 'play' ? {} : req;
      const base = {
        kind: 'viewAs',
        cards: { pool: () => g.cardsIn(me, v.zones || 'h'), filter: c => !v.filter || v.filter(g, me, c, ctx), min: n, max: n },
        answerBase: () => ({ cardIds: u.sel.map(c => c.id), skill: u.skill, asName: u.asName || undefined }),
      };
      if (k === 'play') return Object.assign(base, {
        targets: playTargets(t, curCard(t)),
        ok: () => { const c = curCard(t); if (!c) return false; return g.canUseCard(me, c, g.autoTargets(me, c) || u.targets, { phase: true }); },
        answer: () => { const c = curCard(t); return Object.assign({ action: 'card' }, base.answerBase(), { targets: g.autoTargets(me, c) ? [] : u.targets.map(p => p.seat) }); },
      });
      if (k === 'useStrike') return Object.assign(base, strikeTargets(t), {
        ok: () => { const c = curCard(t); return !!c && E.family(c) === 'strike' && (req.options.length === 1 || u.targets.length === 1); },
        answer: () => Object.assign(base.answerBase(), { target: req.options.length === 1 ? req.options[0] : u.targets[0].seat }),
      });
      return Object.assign(base, { targets: NONE, ok: () => { const c = curCard(t); return !!c && E.matches(c, req.pattern); }, answer: base.answerBase });
    }
    const bm = buttonMode(t); if (bm) return bm;
    switch (k) {
      case 'play': return {
        kind: 'play',
        cards: { pool: hand, filter: c => { const dd = D[c.name] || {}; return (g.playable(me, c) && (!dd.canUse || dd.canUse(g, me, c, { phase: true }))) || !!dd.recastable; }, min: 1, max: 1 },
        targets: playTargets(t, curCard(t)),
        ok: () => { const c = curCard(t); if (!c) return false; return g.canUseCard(me, c, g.autoTargets(me, c) || u.targets, { phase: true }); },
        answer: () => { const c = curCard(t); return { action: 'card', cardIds: u.sel.map(x => x.id), targets: g.autoTargets(me, c) ? [] : u.targets.map(p => p.seat) }; },
      };
      case 'respond': return {
        kind: 'respond',
        cards: { pool: hand, filter: c => E.matches(c, req.pattern), min: 1, max: 1 },
        targets: NONE,
        ok: () => { const c = curCard(t); return !!c && E.matches(c, req.pattern); },
        answer: () => ({ cardIds: u.sel.map(c => c.id) }),
      };
      case 'useStrike': return Object.assign({
        kind: 'useStrike',
        cards: { pool: hand, filter: c => E.family(c) === 'strike', min: 1, max: 1 },
        ok: () => { const c = curCard(t); return !!c && E.family(c) === 'strike' && (req.options.length === 1 || u.targets.length === 1); },
        answer: () => ({ cardIds: u.sel.map(c => c.id), target: req.options.length === 1 ? req.options[0] : u.targets[0].seat }),
      }, strikeTargets(t));
      case 'chooseCards': return {
        kind: 'chooseCards',
        cards: { pool: byIds(req.options), filter: () => true, min: req.min, max: req.max },
        targets: NONE,
        ok: () => u.sel.length >= req.min && u.sel.length <= req.max,
        answer: () => u.sel.map(c => c.id),
      };
      case 'chooseTargets': return {
        kind: 'chooseTargets',
        cards: NONE,
        targets: { min: req.min, max: req.max, keep: true, filter: p => req.options.includes(p.seat) },
        ok: () => u.targets.length >= req.min && u.targets.length <= req.max,
        answer: () => u.targets.map(p => p.seat),
      };
      case 'distribute': return {
        kind: 'distribute',
        cards: { pool: byIds(req.options), filter: () => true, min: 1, max: req.options.length },
        targets: { min: 1, max: 1, keep: true, filter: p => req.targets.includes(p.seat) },
        ok: () => u.sel.length > 0 && u.targets.length === 1,
        answer: () => ({ cards: u.sel.map(c => c.id), target: u.targets[0].seat }),
      };
    }
    return null;
  }
  // ── 按钮类询问（弹窗里的牌 / 选项 / 武将）：参照无名杀 chooseButton——同样走「可选 / 已选 / 确定」；
  //    只需选一项的直接点即确定（auto），多选需点确定
  function buttonMode(t) {
    const u = t.ui, g = t.g, req = u.req, k = req.kind;
    const one = (items, answer, extra) => Object.assign({ kind: k, cards: NONE, targets: NONE, buttons: { items, filter: () => true, min: 1, max: 1, auto: true }, ok: () => u.btn.length === 1, answer, cancel: !!req.optional }, extra || {});
    if (k === 'chooseCard') {
      const n = Math.min(req.count || 1, req.options.length);
      if (n <= 1) return one(req.options, () => u.btn[0]);
      return { kind: k, cards: NONE, targets: NONE, buttons: { items: req.options, filter: () => true, min: n, max: n }, ok: () => u.btn.length === n, answer: () => u.btn.slice(), cancel: !!req.optional };
    }
    if (k === 'pick' && req.multi) {
      const n = req.multi.count;
      const filter = (id, picked) => !req.multi.distinctSuit || !picked.some(x => g.card(x).suit === g.card(id).suit);
      return { kind: k, cards: NONE, targets: NONE, buttons: { items: req.options, filter, min: n, max: n }, ok: () => u.btn.length === n, answer: () => u.btn.slice(), cancel: !!req.optional };
    }
    if (k === 'pick') return one(req.options, () => u.btn[0]);
    if (k === 'chooseOption') return one(req.options.map((_, i) => i), () => u.btn[0]);
    if (k === 'chooseSkillOrder') return one(req.options.slice(), () => u.btn[0]);
    if (k === 'chooseHero') return one(req.options.slice(), () => ({ pick: u.btn[0] }));
    return null;
  }
  function strikeTargets(t) {
    const req = t.ui.req, g = t.g;
    return { targets: req.options.length > 1 ? { min: 1, max: 1, keep: true, filter: p => req.options.includes(p.seat) } : NONE };
  }

  // ── 统一重算：可选牌 / 可选角色 / 确定按钮
  function refresh(t) {
    const u = t.ui; if (!u) return null;
    const m = modeOf(t);
    const v = { mode: m, cards: new Set(), seats: new Set(), buttons: new Set(), ok: false, selecting: false, targeting: false };
    u.btn = u.btn || [];
    if (m && m.buttons) {
      const br = m.buttons;
      u.btn = u.btn.filter(x => br.items.includes(x));
      for (const it of br.items) {
        if (u.btn.includes(it)) { v.buttons.add(it); continue; }
        if (u.btn.length >= br.max && br.max > 1) continue;
        if (br.filter(it, u.btn)) v.buttons.add(it);
      }
      v.ok = u.btn.length >= br.min && u.btn.length <= br.max && (!m.ok || !!m.ok());
      u.view = v; return v;
    }
    if (m) {
      const cr = rng(m.cards);
      if (cr.max > 0) {
        v.selecting = true;
        const full = u.sel.length >= cr.max;
        for (const c of cr.pool()) {
          if (u.sel.includes(c)) { v.cards.add(c.id); continue; }
          if (full && cr.max > 1) continue;
          if (cr.filter(c, u.sel)) v.cards.add(c.id);
        }
        // 已选但已不合法的牌（例如技能切换后）剔除
        const okSel = u.sel.filter(c => cr.pool().includes(c) && (cr.filter(c, []) || cr.filter(c, u.sel)));
        if (okSel.length !== u.sel.length) { u.sel = okSel; return refresh(t); }
      }
      const tr = rng(m.targets);
      if (tr.max > 0) {
        v.targeting = true;
        // 已选目标逐个复核（前面的目标变了，后面的可能失效）
        const kept = [];
        for (const p of u.targets) { if (kept.length < tr.max && !p.dead && tr.filter(p, kept)) kept.push(p); else break; }
        if (kept.length !== u.targets.length) u.targets = kept;
        for (const p of t.g.players) {
          if (u.targets.includes(p)) { v.seats.add(p.seat); continue; }
          if (p.dead) continue;
          if (u.targets.length >= tr.max && tr.max > 1) continue;
          if (tr.filter(p, u.targets)) v.seats.add(p.seat);
        }
      } else if (u.targets.length) u.targets = [];
      v.ok = u.sel.length >= (cr.min || 0) && u.sel.length <= cr.max &&
             u.targets.length >= (tr.min || 0) && u.targets.length <= tr.max && (!m.ok || !!m.ok());
    }
    u.view = v;
    return v;
  }

  // ── 点击：只改「已选」，再统一重算
  function clickCard(t, c) {
    const u = t.ui; const v = refresh(t); const m = v.mode; if (!m || !v.cards.has(c.id)) return false;
    const cr = rng(m.cards);
    if (u.sel.includes(c)) u.sel = u.sel.filter(x => x !== c);
    else if (cr.max <= 1) u.sel = [c];
    else if (u.sel.length < cr.max) u.sel = u.sel.concat([c]);
    else return false;
    if (!(m.targets && m.targets.keep)) u.targets = [];
    refresh(t); return true;
  }
  function clickSeat(t, p) {
    const u = t.ui; const v = refresh(t); const m = v.mode; if (!m || !v.seats.has(p.seat)) return false;
    const tr = rng(m.targets);
    const i = u.targets.indexOf(p);
    if (i >= 0) u.targets = u.targets.slice(0, i);
    else if (tr.max <= 1) u.targets = [p];
    else if (u.targets.length < tr.max) u.targets = u.targets.concat([p]);
    else return false;
    refresh(t); return true;
  }
  // 点按钮：返回 'auto' 表示单选已选好、应直接确定
  function clickButton(t, raw) {
    const u = t.ui; const v = refresh(t); const m = v.mode; if (!m || !m.buttons) return false;
    const br = m.buttons; const it = br.items.find(x => String(x) === String(raw)); if (it === undefined || !v.buttons.has(it)) return false;
    if (u.btn.includes(it)) u.btn = u.btn.filter(x => x !== it);
    else if (br.max <= 1) u.btn = [it];
    else if (u.btn.length < br.max) u.btn = u.btn.concat([it]);
    else return false;
    const v2 = refresh(t);
    return br.auto && v2.ok ? 'auto' : true;
  }
  function confirm(t) {
    const v = refresh(t); if (!v || !v.ok || !v.mode) return undefined;
    return v.mode.answer();
  }

  root.QXAsk = { modeOf, refresh, clickCard, clickSeat, clickButton, confirm, curCard };
})(typeof window !== 'undefined' ? window : globalThis);
