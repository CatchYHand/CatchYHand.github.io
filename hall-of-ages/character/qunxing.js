import { get, lib, game, ui, _status, ai } from "noname";
const SHA$2 = { name: "sha", isCard: true };
const isSha = (card) => card && get.name(card) === "sha";
const lost$2 = (p) => p.getDamagedHp();
const dealtBy = (user, useEvt) => user.hasHistory("sourceDamage", (evt) => evt.getParent("useCard") === useEvt);
async function virtualSha(user, target, extra = {}) {
  const next = user.useCard(get.autoViewAs({ ...SHA$2 }), [target], false);
  next.addCount = false;
  for (const k in extra) next.set(k, extra[k]);
  await next;
  return next;
}
function adjacentOk(player, targets) {
  if (targets.length <= 1) return true;
  const order = game.players.slice().sort((a, b) => a.dataset.position - b.dataset.position);
  const n = order.length;
  for (let st = 0; st < n; st++) {
    const arc = [];
    for (let k = 0; k < targets.length; k++) arc.push(order[(st + k) % n]);
    if (!arc.includes(player) && targets.every((t) => arc.includes(t))) return true;
  }
  return false;
}
const skills$4 = {
  // ── 亚历山大 ──
  qx_campaign: {
    trigger: { source: "damageSource" },
    forced: true,
    filter(event, player) {
      return event.player !== player && event.player.isIn();
    },
    logTarget: "player",
    async content(event, trigger, player) {
      player.storage.qx_campaign ??= {};
      const id = trigger.player.playerid;
      player.storage.qx_campaign[id] = (player.storage.qx_campaign[id] || 0) + 1;
      player.markSkill("qx_campaign");
    },
    intro: {
      content(storage) {
        return Object.entries(storage || {}).map(([id, n]) => `${get.translation(lib.playerOL?.[id] || game.players.concat(game.dead).find((p) => p.playerid == id))}：距离 −${n}`).join("<br>");
      }
    },
    mod: {
      globalFrom(from, to, distance) {
        const n = from.storage.qx_campaign?.[to.playerid] || 0;
        return distance - n;
      }
    }
  },
  qx_gordian: {
    trigger: { player: "useCardToPlayered" },
    filter(event, player) {
      return isSha(event.card) && event.isFirstTarget;
    },
    async cost(event, trigger, player) {
      const all = game.filterPlayer((p) => p !== player).every((p) => get.distance(player, p) <= 1);
      if (all) {
        event.result = { bool: true, cost_data: 2 };
        return;
      }
      const targets = trigger.targets;
      const { control } = await player.chooseControl("不可被闪", "伤害+1", "cancel2").set("prompt", get.prompt2(event.skill)).set("ai", () => targets.some((t) => t.countCards("h") > 1 || t.hasSkillTag("respondShan")) ? 0 : 1).forResult();
      event.result = { bool: control !== "cancel2", cost_data: control === "不可被闪" ? 0 : 1 };
    },
    async content(event, trigger, player) {
      const pick = event.cost_data, use = trigger.getParent();
      if (pick === 0 || pick === 2) use.directHit.addArray(trigger.targets);
      if (pick === 1 || pick === 2) use.baseDamage = (use.baseDamage || 1) + 1;
    }
  },
  // ── 凯撒 ──
  qx_rubicon: {
    limited: true,
    skillAnimation: true,
    animationColor: "fire",
    trigger: { source: "damageSource" },
    filter(event, player) {
      return isSha(event.card) && player.countCards("h") > player.maxHp && player.isIn();
    },
    check(event, player) {
      return player.countCards("h") - player.maxHp >= 1;
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name);
      await player.gainMaxHp(player.countCards("h") - player.maxHp);
      if (player.hp < player.maxHp) await player.recover(player.maxHp - player.hp);
    }
  },
  qx_vici: {
    enable: "phaseUse",
    filter(event, player) {
      return !player.hasSkill("qx_vici_used") && player.maxHp > 1 && game.hasPlayer((t) => player.canUse(SHA$2, t, true, true));
    },
    filterTarget(card, player, target) {
      return player.canUse(SHA$2, target, true, true);
    },
    selectTarget: 1,
    async content(event, trigger, player) {
      const target = event.target;
      await player.loseMaxHp();
      if (!player.isIn()) return;
      await player.draw();
      if (!target.isIn()) return;
      const use = await virtualSha(player, target);
      if (!dealtBy(player, use)) player.addTempSkill("qx_vici_used", "phaseUseAfter");
    },
    subSkill: { used: { charlotte: true } },
    ai: {
      order() {
        return get.order(SHA$2) + 0.2;
      },
      result: {
        player(player) {
          return player.maxHp > 2 && player.hp < player.maxHp ? 0.5 : -1.5;
        },
        target(player, target) {
          return get.effect(target, SHA$2, player, target) > 0 ? 1 : -1.5;
        }
      }
    }
  },
  // ── 汉尼拔 ──
  qx_alps: {
    trigger: { source: "damageBegin1" },
    forced: true,
    filter(event, player) {
      if (!event.card || event.player === player) return false;
      const name = get.name(event.card);
      if (name === "juedou") return true;
      const num = get.number(event.card);
      return name === "sha" && typeof num === "number" && num % 2 === 1;
    },
    async content(event, trigger, player) {
      trigger.num++;
    }
  },
  qx_cannae: {
    locked: true,
    mod: {
      selectTarget(card, player, range) {
        if (card.name === "sha" && range[1] !== -1) range[1] += 2;
      },
      playerEnabled(card, player, target) {
        if (card.name !== "sha" || !ui.selected.targets.length || ui.selected.targets.includes(target)) return;
        if (_status.event?.player !== player) return;
        if (!adjacentOk(player, [...ui.selected.targets, target])) return false;
      }
    }
  },
  // ── 西庇阿 ──
  qx_divert: {
    trigger: { player: "damageEnd" },
    filter(event, player) {
      return isSha(event.card) && event.source && event.source !== player && event.source.isIn() && player.isIn() && player.canUse(SHA$2, event.source, false);
    },
    check(event, player) {
      return get.effect(event.source, SHA$2, player, player) > 0;
    },
    logTarget: "source",
    async content(event, trigger, player) {
      const use = await virtualSha(player, trigger.source);
      if (dealtBy(player, use) && player.isIn()) await player.recover();
    }
  },
  qx_zama: {
    trigger: { target: "useCardToTarget" },
    forced: true,
    filter(event, player) {
      if (!event.targets || event.targets.length <= 1) return false;
      return isSha(event.card) || get.type(event.card) === "trick";
    },
    async content(event, trigger, player) {
      trigger.getParent().excluded.add(player);
      await player.draw();
    },
    ai: {
      effect: {
        target(card, player, target) {
          if ((card.name === "sha" || get.type(card) === "trick") && ui.selected.targets.length >= 1) return [0, 1];
        }
      }
    }
  },
  // ── 列奥尼达 ──
  qx_narrows: {
    trigger: { player: "damageEnd" },
    forced: true,
    filter(event, player) {
      return player.isIn();
    },
    async content(event, trigger, player) {
      player.addTempSkill("qx_narrows_on");
    },
    subSkill: {
      on: {
        charlotte: true,
        mark: true,
        intro: { content: "本回合其他角色使用的杀和谋略牌对你无效" },
        trigger: { target: "useCardToTarget" },
        forced: true,
        filter(event, player) {
          return event.player !== player && (isSha(event.card) || get.type(event.card) === "trick");
        },
        async content(event, trigger, player) {
          trigger.getParent().excluded.add(player);
        },
        ai: {
          effect: {
            target(card, player, target) {
              if (player !== target && (card.name === "sha" || get.type(card) === "trick")) return "zeroplayertarget";
            }
          }
        }
      }
    }
  },
  qx_defiance: {
    trigger: { global: "phaseUseBegin" },
    filter(event, player) {
      return event.player !== player && event.player.isIn() && player.isIn();
    },
    check(event, player) {
      return get.attitude(player, event.player) < 0 && (player.hp >= 3 || player.hasShan());
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const src = trigger.player;
      const x = Math.min(5, lost$2(player));
      if (x > 0) await player.draw(x);
      if (!src.isIn() || !player.isIn() || !src.canUse(SHA$2, player, false)) return;
      const use = await virtualSha(src, player);
      if (!dealtBy(src, use) || !src.isIn()) return;
      const x2 = Math.min(5, lost$2(player));
      if (x2 <= 0) return;
      let discard = false;
      if (src.countCards("he") >= x2) {
        const { control } = await src.chooseControl(`弃置${x2}张牌`, "结束出牌阶段").set("prompt", `拒降：弃置${x2}张牌，或结束出牌阶段`).set("ai", () => x2 <= 2 ? 0 : 1).forResult();
        discard = control !== "结束出牌阶段";
      }
      if (discard) await src.chooseToDiscard(x2, "he", true);
      else {
        game.log(src, "结束了出牌阶段");
        trigger.cancel();
      }
    }
  },
  // ── 斯巴达克斯 ──
  qx_unchain: {
    trigger: { player: "damageEnd" },
    getIndex(event) {
      return event.num;
    },
    filter(event, player) {
      return player.isIn();
    },
    async content(event, trigger, player) {
      const { result: drawn } = await player.draw(2);
      let left = (Array.isArray(drawn) ? drawn : []).filter((c) => get.owner(c) === player && get.position(c) === "h");
      for (let k = 0; k < 2 && left.length; k++) {
        if (!game.hasPlayer((p) => p !== player)) break;
        const { bool, cards, targets } = await player.chooseCardTarget({
          prompt: "挣锁：可以将这些牌交给其他角色",
          filterCard: (card) => left.includes(card),
          selectCard: [1, Infinity],
          filterTarget: (card, player2, target) => target !== player2,
          ai1(card) {
            return ui.selected.cards.length < left.length ? 1 : 0;
          },
          ai2(target) {
            const p = get.player();
            if (p.countCards("h") <= p.getHandcardLimit()) return 0;
            return get.attitude(p, target) > 2 ? 10 - target.countCards("h") : 0;
          }
        }).forResult();
        if (!bool) break;
        await player.give(cards, targets[0]);
        left = left.filter((c) => !cards.includes(c) && get.owner(c) === player);
      }
    }
  },
  qx_comrades: {
    trigger: { player: "useCardToPlayered" },
    forced: true,
    filter(event, player) {
      return isSha(event.card) && event.target.hp > player.hp;
    },
    logTarget: "target",
    async content(event, trigger, player) {
      trigger.getParent().directHit.add(trigger.target);
    },
    mod: {
      cardUsable(card, player, num) {
        if (card.name === "sha") return num + player.getDamagedHp();
      }
    },
    ai: {
      directHit_ai: true,
      skillTagFilter(player, tag, arg) {
        return arg?.target && arg.target.hp > player.hp;
      }
    }
  },
  // ── 布狄卡 ──
  qx_chariot: {
    trigger: { global: "phaseBefore", player: "enterGame" },
    forced: true,
    filter(event, player) {
      return event.name !== "phase" || game.phaseNumber === 0;
    },
    async content(event, trigger, player) {
      for (const sub of ["equip4", "equip3"]) {
        const list = Array.from(ui.cardPile.childNodes).filter((c) => get.subtype(c) === sub);
        if (!list.length) continue;
        const card = list.randomGet();
        await player.equip(card);
      }
    },
    mod: {
      canBeDiscarded(card, source, owner) {
        if (source !== owner && owner.hasSkill("qx_chariot") && ["equip3", "equip4"].includes(get.subtype(card)) && get.position(card) === "e") return false;
      },
      canBeGained(card, source, owner) {
        if (source !== owner && owner.hasSkill("qx_chariot") && ["equip3", "equip4"].includes(get.subtype(card)) && get.position(card) === "e") return false;
      }
    }
  },
  qx_vengeance: {
    trigger: { player: "damageEnd" },
    filter(event, player) {
      return event.source && event.source !== player && event.source.isIn() && player.isIn();
    },
    check(event, player) {
      return get.attitude(player, event.source) < 1;
    },
    logTarget: "source",
    async content(event, trigger, player) {
      const src = trigger.source;
      const { result } = await player.judge((card) => get.suit(card) === "heart" ? -1 : 1);
      if (!result || result.suit === "heart" || !src.isIn() || !player.isIn()) return;
      const need = Math.max(2, Math.ceil(src.countCards("h") / 2));
      let discard = false;
      if (src.countCards("h") >= need) {
        const { control } = await src.chooseControl(`弃置${need}张手牌`, "受到1~2点伤害").set("prompt", "血誓：选择一项").set("ai", () => src.hp <= 2 ? 0 : need <= 2 ? 0 : 1).forResult();
        discard = control !== "受到1~2点伤害";
      }
      if (discard) await src.chooseToDiscard(need, "h", true);
      else await src.damage(1 + Math.floor(Math.random() * 2), player);
    }
  },
  // ── 克娄巴特拉 ──
  qx_allure: {
    enable: "phaseUse",
    filter(event, player) {
      return (player.storage.qx_allure_count || 0) < lost$2(player) + 1 && player.countCards("he") > 0 && game.countPlayer((p) => p !== player) >= 2;
    },
    filterCard: true,
    position: "he",
    check(card) {
      return 7 - get.value(card);
    },
    filterTarget(card, player, target) {
      if (target === player) return false;
      if (ui.selected.targets.length === 1) return ui.selected.targets[0].canUse({ name: "juedou" }, target);
      return true;
    },
    targetprompt: ["使用者", "目标"],
    selectTarget: 2,
    multitarget: true,
    async content(event, trigger, player) {
      player.storage.qx_allure_count = (player.storage.qx_allure_count || 0) + 1;
      player.addTempSkill("qx_allure_reset", "phaseUseAfter");
      const [a, b] = event.targets;
      if (!a.isIn() || !b.isIn()) return;
      await a.useCard({ card: get.autoViewAs({ name: "juedou", isCard: true }), targets: [b], nowuxie: true, noai: true });
    },
    subSkill: {
      reset: {
        charlotte: true,
        onremove(player) {
          delete player.storage.qx_allure_count;
        }
      }
    },
    ai: {
      order: 8,
      result: {
        target(player, target) {
          if (ui.selected.targets.length === 0) return -1;
          return get.effect(target, { name: "juedou" }, ui.selected.targets[0], target);
        }
      },
      expose: 0.4,
      threaten: 2.5
    }
  },
  qx_pearl: {
    trigger: { player: "phaseJieshuBegin" },
    filter(event, player) {
      return game.getGlobalHistory("changeHp").length > 0;
    },
    frequent: true,
    async content(event, trigger, player) {
      await player.draw(game.getGlobalHistory("changeHp").length);
    }
  },
  // ── 阿基米德 ──
  qx_lever: {
    enable: "phaseUse",
    usable: 1,
    filterTarget(card, player, target) {
      return target !== player;
    },
    async content(event, trigger, player) {
      const t = event.target, s = player.hp + t.hp;
      const mine = Math.min(player.maxHp, Math.ceil(s / 2)), theirs = Math.min(t.maxHp, Math.floor(s / 2));
      if (mine !== player.hp) await player.changeHp(mine - player.hp);
      if (theirs !== t.hp) await t.changeHp(theirs - t.hp);
      if (t.hp <= 0) await t.dying({ source: player });
    },
    ai: {
      order: 6,
      result: {
        player(player, target) {
          const s = player.hp + target.hp;
          return (Math.min(player.maxHp, Math.ceil(s / 2)) - player.hp) * (player.hp <= 2 ? 2 : 1.2);
        },
        target(player, target) {
          const s = player.hp + target.hp;
          return Math.min(target.maxHp, Math.floor(s / 2)) - target.hp;
        }
      }
    }
  },
  qx_mirror: {
    trigger: { global: "judge" },
    filter(event, player) {
      return player.countCards("hs") > 0;
    },
    async cost(event, trigger, player) {
      event.result = await player.chooseCard(`${get.translation(trigger.player)}的${trigger.judgestr || ""}天意判定为${get.translation(trigger.player.judging[0])}，${get.prompt(event.skill)}`, "hs", (card) => {
        const player2 = get.player();
        const mod = game.checkMod(card, player2, "unchanged", "cardRespondable", player2);
        return mod === "unchanged" ? true : !!mod;
      }).set("ai", (card) => {
        const trigger2 = get.event().getTrigger();
        const { player: player2, judging } = get.event();
        const result = trigger2.judge(card) - trigger2.judge(judging);
        const att = get.attitude(player2, trigger2.player);
        if (att === 0 || result === 0) return 0;
        return (att > 0 ? result : -result) - get.value(card) / 4;
      }).set("judging", trigger.player.judging[0]).forResult();
    },
    popup: false,
    async content(event, trigger, player) {
      const next = player.respond({ cards: event.cards, skill: event.name, highlight: true, noOrdering: true });
      await next;
      const { cards } = next;
      if (cards?.length) {
        if (trigger.player.judging[0].clone) {
          trigger.player.judging[0].clone.classList.remove("thrownhighlight");
          game.addVideo("deletenode", player, get.cardsInfo([trigger.player.judging[0].clone]));
        }
        await game.cardsDiscard(trigger.player.judging[0]);
        trigger.player.judging[0] = cards[0];
        trigger.orderingCards.addArray(cards);
        game.log(trigger.player, "的天意牌改为", cards);
        await game.delay(2);
      }
    },
    group: "qx_mirror_gain",
    subSkill: {
      gain: {
        trigger: { global: "judgeEnd" },
        forced: true,
        filter(event, player) {
          return event.result?.card && get.position(event.result.card, true) === "o";
        },
        async content(event, trigger, player) {
          await player.gain(trigger.result.card, "gain2");
        }
      }
    },
    ai: { rejudge: true, tag: { rejudge: 1 } }
  },
  // ── 希帕提娅 ──
  qx_lecture: {
    group: ["qx_lecture_gather", "qx_lecture_swap"],
    subSkill: {
      gather: {
        enable: "phaseUse",
        usable: 1,
        filter(event, player) {
          return game.hasPlayer((q) => q !== player && q.countCards("h") > player.countCards("h"));
        },
        async content(event, trigger, player) {
          const hc = player.countCards("h");
          const givers = game.filterPlayer((q) => q !== player && q.countCards("h") > hc).sortBySeat(player.next);
          for (const q of givers) {
            if (!q.isIn() || !q.countCards("h") || !player.isIn()) continue;
            const { cards } = await q.chooseCard("h", true, `讲学：交给${get.translation(player)}一张手牌`).set("ai", (c) => -get.value(c)).forResult();
            if (cards?.length) await q.give(cards, player);
          }
          if (player.isIn() && game.filterPlayer((q) => q !== player).every((q) => q.countCards("h") < player.countCards("h"))) await player.loseHp();
        },
        ai: {
          order: 9,
          result: {
            player(player) {
              const givers = game.filterPlayer((q) => q !== player && q.countCards("h") > player.countCards("h"));
              const after = player.countCards("h") + givers.length;
              const risk = game.filterPlayer((q) => q !== player).every((q) => q.countCards("h") - (givers.includes(q) ? 1 : 0) < after);
              return givers.length - (risk ? player.hp <= 1 ? 99 : player.hp === 2 ? 3 : 1.6 : 0);
            }
          }
        }
      },
      swap: {
        enable: "phaseUse",
        usable: 1,
        filterTarget(card, player, target) {
          return target !== player && target.countCards("h") <= player.countCards("h");
        },
        async content(event, trigger, player) {
          await player.swapHandcards(event.target);
        },
        ai: {
          order: 2,
          result: {
            target(player, target) {
              return target.countCards("h") - player.countCards("h") < -1 && get.attitude(player, target) > 0 ? 1 : 0;
            }
          }
        }
      }
    }
  },
  qx_proof: {
    limited: true,
    skillAnimation: true,
    animationColor: "metal",
    enable: "phaseUse",
    filter(event, player) {
      return game.hasPlayer((q) => q !== player && q.countCards("h"));
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name);
      const others = () => game.filterPlayer((q) => q !== player).sortBySeat(player.next);
      for (const q of others()) if (q.countCards("h")) await player.gain(q.getCards("h"), q, "giveAuto", "bySelf");
      const uniqueMax = () => game.filterPlayer((q) => q !== player).every((q) => q.countCards("h") < player.countCards("h"));
      for (let guard = 0; guard < 60 && uniqueMax() && player.isIn(); guard++) {
        let gave = false;
        for (const q of others()) {
          if (!uniqueMax() || !player.countCards("h")) break;
          const { cards } = await player.chooseCard("h", true, `推演：交给${get.translation(q)}一张牌`).set("ai", (c) => get.attitude(player, q) > 0 ? get.value(c) : -get.value(c)).forResult();
          if (cards?.length) {
            await player.give(cards, q);
            gave = true;
          }
        }
        if (!gave) break;
      }
    },
    ai: {
      order: 1,
      result: {
        player(player) {
          const tot = game.filterPlayer((q) => q !== player).reduce((s, q) => s + q.countCards("h"), 0);
          const enemy = game.filterPlayer((q) => q !== player && get.attitude(player, q) < 0).reduce((s, q) => s + q.countCards("h"), 0);
          return tot >= 2 * (game.countPlayer() - 1) && enemy >= 5 ? 2 : 0;
        }
      }
    }
  },
  // ── 古典主公技：号令（同激将，按古典阵营 shu）──
  qx_rally: {
    zhuSkill: true,
    group: ["qx_rally_1"],
    filter(event, player) {
      if (!player.hasZhuSkill("qx_rally") || !game.hasPlayer((c) => c !== player && c.group === "shu")) return false;
      return !event.qx_rally && (event.type !== "phase" || !player.hasSkill("qx_rally_fail"));
    },
    enable: ["chooseToUse", "chooseToRespond"],
    viewAs: { name: "sha" },
    filterCard() {
      return false;
    },
    selectCard: -1,
    ai: {
      order() {
        return get.order({ name: "sha" }) + 0.3;
      },
      respondSha: true,
      skillTagFilter(player) {
        if (!player.hasZhuSkill("qx_rally") || !game.hasPlayer((c) => c !== player && c.group === "shu")) return false;
      }
    },
    subSkill: {
      fail: { charlotte: true },
      1: {
        trigger: { player: ["useCardBegin", "respondBegin"] },
        filter(event, player) {
          return event.skill === "qx_rally";
        },
        forced: true,
        popup: false,
        async content(event, trigger, player) {
          delete trigger.skill;
          const parent = trigger.getParent();
          if (!parent) return;
          parent.set("qx_rally", true);
          let current = player.next;
          while (true) {
            if (current === player) {
              player.addTempSkill("qx_rally_fail");
              trigger.cancel();
              parent.goto(0);
              return;
            }
            if (current.group === "shu") {
              const next = current.chooseToRespond({
                prompt: `号令：是否替${get.translation(player)}打出一张杀？`,
                filterCard(card2, player2) {
                  return get.name(card2) === "sha" && lib.filter.cardRespondable(card2, player2);
                },
                ai() {
                  const e = get.event();
                  return get.attitude(e.player, e.source) - 2;
                }
              });
              next.set("source", player);
              next.noOrdering = true;
              next.autochoose = lib.filter.autoRespondSha;
              const { bool, card, cards } = await next.forResult();
              if (bool) {
                trigger.card = card;
                trigger.cards = cards;
                trigger.throw = false;
                return;
              }
            }
            current = current.next;
          }
        }
      }
    }
  }
};
const lost$1 = (p) => p.getDamagedHp();
const skills$3 = {
  // ── 查理曼 ──
  qx_anoint: {
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return game.hasPlayer((q) => q !== player && q.countGainableCards(player, "h"));
    },
    async content(event, trigger, player) {
      const taken = [];
      for (const q of game.filterPlayer((q2) => q2 !== player).sortBySeat(player.next)) {
        if (!q.countGainableCards(player, "h") || !player.isIn()) continue;
        const { cards } = await player.gainPlayerCard(q, "h", true).forResult();
        if (cards?.length) taken.push([cards[0], q]);
      }
      player.storage.qx_anoint_back = taken;
      player.addTempSkill("qx_anoint_back", "phaseUseAfter");
    },
    subSkill: {
      back: {
        charlotte: true,
        trigger: { player: "phaseUseEnd" },
        forced: true,
        popup: false,
        async content(event, trigger, player) {
          for (const [card, q] of player.storage.qx_anoint_back || []) {
            if (get.owner(card) === player && get.position(card) === "h" && q.isIn()) await player.give(card, q);
          }
          delete player.storage.qx_anoint_back;
        }
      }
    },
    ai: { order: 10, result: { player: 1 } }
  },
  qx_paladins: {
    enable: ["chooseToRespond", "chooseToUse"],
    filterCard(card) {
      return get.color(card) === "black";
    },
    position: "hes",
    viewAs: { name: "shan" },
    viewAsFilter(player) {
      return player.hasCards("hes", { color: "black" });
    },
    prompt: "将一张黑色牌当闪使用或打出",
    check() {
      return 1;
    },
    group: "qx_paladins_draw",
    subSkill: {
      draw: {
        trigger: { player: "useCard" },
        forced: true,
        filter(event, player) {
          return get.name(event.card) === "shan" && _status.currentPhase !== player;
        },
        async content(event, trigger, player) {
          await player.draw();
        }
      }
    },
    ai: {
      respondShan: true,
      skillTagFilter(player) {
        return player.hasCards("hes", { color: "black" });
      },
      order: 3
    }
  },
  // ── 贞德 ──
  qx_calling: {
    trigger: { player: ["damageEnd", "loseHpEnd", "loseMaxHpEnd", "loseAfter"] },
    filter(event, player) {
      if (!player.isIn() || event.qx_calling || !game.hasPlayer((q) => q !== player)) return false;
      if (event.name === "lose") return event.type === "discard" && event.cards2?.length > 0 && event.getParent().name !== "qx_calling";
      return true;
    },
    async cost(event, trigger, player) {
      const n = trigger.name === "lose" ? trigger.cards2.length : trigger.num;
      const what = { damage: `受到${n}点伤害`, loseHp: `失去${n}点体力`, loseMaxHp: `减${n}点体力上限`, lose: `弃置${n}张牌` }[trigger.name];
      event.result = await player.chooseTarget(get.prompt(event.skill), `令一名其他角色也${what}`, (card, player2, target) => target !== player2).set("ai", (target) => -get.attitude(get.player(), target)).forResult();
    },
    async content(event, trigger, player) {
      const t = event.targets[0];
      if (trigger.name === "damage") {
        const next = t.damage(trigger.num, player, trigger.nature);
        next.qx_calling = true;
        await next;
      } else if (trigger.name === "loseHp") {
        const next = t.loseHp(trigger.num);
        next.qx_calling = true;
        await next;
      } else if (trigger.name === "loseMaxHp") {
        const next = t.loseMaxHp(trigger.num);
        next.qx_calling = true;
        await next;
      } else {
        const n = trigger.cards2.length;
        if (t.countCards("he")) await t.chooseToDiscard(n, "he", true).set("prompt", `圣召：请弃置${n}张牌`);
      }
    }
  },
  qx_martyr: {
    limited: true,
    skillAnimation: true,
    animationColor: "fire",
    trigger: { player: "dying" },
    filter(event, player) {
      return game.hasPlayer((q) => q !== player);
    },
    async cost(event, trigger, player) {
      event.result = await player.chooseTarget(get.prompt2(event.skill), (card, player2, target) => target !== player2).set("ai", (target) => {
        const p = get.player();
        if (p.identity === "zhu" || p.countCards("h", (c) => ["tao", "jiu"].includes(c.name))) return -1;
        return get.attitude(p, target);
      }).forResult();
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name);
      trigger.skipTao = true;
      const t = event.targets[0];
      await t.recover();
      await t.addSkills("qx_calling");
    }
  },
  // ── 理查一世 ──
  qx_valiant: {
    locked: true,
    mod: {
      maxHandcardBase(player) {
        return player.maxHp;
      },
      targetEnabled(card, player, target) {
        if (["guohe", "shunshou"].includes(card.name) && target.countCards("h") < target.maxHp) return false;
        if (card.name === "lebu" && target.countCards("h") > target.maxHp) return false;
      }
    }
  },
  qx_ransom: {
    trigger: { player: "damageBegin4" },
    filter(event, player) {
      return event.source && event.source !== player && event.source.isIn() && player.countCards("h") > 0;
    },
    check() {
      return true;
    },
    logTarget: "source",
    async content(event, trigger, player) {
      const src = trigger.source;
      const { cards: shown } = await player.chooseCard("h", [1, 3], true, `赎金：选择至多三张手牌给${get.translation(src)}观看`).set("ai", (c) => ui.selected.cards.length < 2 ? 6 - get.value(c) : 0).forResult();
      if (!shown?.length) return;
      await player.showCards(shown, `${get.translation(player)}的赎金`);
      const n = shown.length;
      const { control } = await src.chooseControl("获得一张并防止伤害", `弃置${n}张牌`).set("prompt", "赎金：选择一项").set("ai", () => get.attitude(src, player) > 0 ? 0 : src.countCards("he") < n ? 0 : 0.5 > Math.random() ? 0 : 1).forResult();
      if (control === "获得一张并防止伤害" || src.countCards("he") === 0) {
        const { links } = await src.chooseButton(["赎金：获得其中一张", shown], true).set("ai", (b) => get.value(b.link)).forResult();
        if (links?.length) await src.gain(links, player, "give");
        trigger.cancel();
      } else await src.chooseToDiscard(n, "he", true);
    }
  },
  // ── 熙德 ──
  qx_triumph: {
    trigger: { source: "damageBegin1" },
    forced: true,
    filter(event, player) {
      return event.player !== player && player.isIn() && get.distance(player, event.player) <= 2;
    },
    async content(event, trigger, player) {
      if (player.isDamaged()) await player.recover();
      else await player.draw();
    }
  },
  qx_undying: {
    limited: true,
    skillAnimation: true,
    animationColor: "orange",
    trigger: { player: "dying" },
    filter(event, player) {
      return player.hp < 1;
    },
    check() {
      return true;
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name);
      const all = player.getCards("hej");
      if (all.length) await player.discard(all);
      await player.recover(Math.min(2, player.maxHp) - player.hp);
      await player.draw(3);
    }
  },
  // ── 威廉一世 ──
  qx_retreat: {
    trigger: { player: "damageBegin4" },
    filter(event, player) {
      return event.source && event.source !== player && event.source.isIn() && player.countCards("h") > 0;
    },
    check(event, player) {
      return player.countCards("h", (c) => get.number(c) >= 9) > 0 || player.countCards("h") >= 3;
    },
    logTarget: "source",
    async content(event, trigger, player) {
      const src = trigger.source;
      await src.draw();
      if (!player.canCompare(src)) return;
      const result = await player.chooseToCompare(src).forResult();
      if (result.bool) {
        trigger.cancel();
        if (result.target && get.position(result.target, true) === "o") await player.gain(result.target, "gain2");
      } else {
        trigger.num = Math.min(trigger.num, 1);
        if (result.player && get.position(result.player, true) === "o") await player.gain(result.player, "gain2");
      }
    }
  },
  qx_domesday: {
    enable: "phaseUse",
    usable: 1,
    filterTarget(card, player, target) {
      return target !== player;
    },
    async content(event, trigger, player) {
      const t = event.target;
      if (player.countCards("h")) await t.viewHandcards(player);
      const roleKnown = t.identityShown || t.identity === "zhu";
      let pick = 0;
      if (!roleKnown) {
        const { control } = await player.chooseControl("观看其手牌", "观看其身份").set("prompt", "清册：选择一项").set("ai", () => Math.abs(get.attitude(player, t)) < 1.5 ? 1 : 0).forResult();
        pick = control === "观看其身份" ? 1 : 0;
      }
      if (pick === 1) {
        game.log(player, "观看了", t, "的身份");
        player.storage.zhibi ??= [];
        player.storage.zhibi.add(t);
        if (player === game.me) {
          t.setIdentity();
          t.node.identity.classList.remove("guessing");
        }
        player.markSkill("qx_domesday_seen");
        return;
      }
      const hs = t.getCards("h");
      if (!hs.length) return;
      const { links } = await player.chooseButton([`清册：可以弃置${get.translation(t)}的一张黑色牌`, hs]).set("filterButton", (b) => get.color(b.link) === "black").set("ai", (b) => get.attitude(player, t) > 0 ? -1 : get.value(b.link)).forResult();
      if (links?.length) await t.discard(links, player);
    },
    ai: {
      order: 7,
      result: {
        target(player, target) {
          return get.attitude(player, target) < 0 ? -1 : 0.1;
        }
      }
    }
  },
  // ── 埃莉诺 ──
  qx_alliance: {
    enable: "phaseUse",
    usable: 1,
    filterCard: true,
    selectCard: 2,
    position: "he",
    check(card) {
      return 6 - get.value(card);
    },
    filterTarget(card, player, target) {
      return target !== player && target.isDamaged();
    },
    async content(event, trigger, player) {
      const t = event.target;
      const healed = player.isDamaged();
      if (healed) await player.recover();
      await t.recover();
      if (!healed && player.isIn()) {
        const { bool } = await player.chooseBool("联姻：是否令你们各摸一张牌？").set("ai", () => true).forResult();
        if (bool) {
          await player.draw();
          await t.draw();
        }
      }
    },
    ai: {
      order: 9,
      result: {
        target(player, target) {
          return target.hp <= 1 ? 3 : 1.5;
        }
      }
    }
  },
  qx_kingmaker: {
    trigger: { global: "phaseDiscardBegin" },
    filter(event, player) {
      return event.player !== player && event.player.isIn() && player.countCards("h") > 0;
    },
    async cost(event, trigger, player) {
      const t = trigger.player;
      event.result = await player.chooseCard("h", [1, Infinity], `${get.prompt(event.skill, t)}：交给其至少一张手牌，然后其将超出体力值的手牌交给你`).set("ai", (c) => get.attitude(player, t) > 0 && ui.selected.cards.length < 1 ? 5 - get.value(c) : 0).forResult();
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const t = trigger.player;
      await player.give(event.cards, t);
      const n = t.countCards("h") - Math.max(0, t.hp);
      if (n > 0 && player.isIn()) {
        const { cards } = await t.chooseCard("h", n, true, `拥立：将${n}张手牌交给${get.translation(player)}`).set("ai", (c) => -get.value(c)).forResult();
        if (cards?.length) await t.give(cards, player);
      }
    }
  },
  // ── 华莱士 ──
  qx_schiltron: {
    group: ["qx_schiltron_sha", "qx_schiltron_shan", "qx_schiltron_take"],
    subSkill: {
      sha: {
        enable: ["chooseToUse", "chooseToRespond"],
        filterCard: { name: "shan" },
        viewAs: { name: "sha" },
        position: "hs",
        viewAsFilter(player) {
          return player.hasCards("hs", "shan");
        },
        prompt: "将一张闪当杀使用或打出",
        check() {
          return 1;
        },
        ai: {
          respondSha: true,
          skillTagFilter(player) {
            return player.hasCards("hs", "shan");
          },
          order() {
            return get.order({ name: "sha" }) + 0.1;
          }
        }
      },
      shan: {
        enable: ["chooseToRespond", "chooseToUse"],
        filterCard: { name: "sha" },
        viewAs: { name: "shan" },
        position: "hs",
        viewAsFilter(player) {
          return player.hasCards("hs", "sha");
        },
        prompt: "将一张杀当闪使用或打出",
        check() {
          return 1;
        },
        ai: {
          respondShan: true,
          skillTagFilter(player) {
            return player.hasCards("hs", "sha");
          }
        }
      },
      take: {
        trigger: { player: ["useCard", "respond"] },
        filter(event, player) {
          if (!["qx_schiltron_sha", "qx_schiltron_shan"].includes(event.skill)) return false;
          return lib.skill.qx_schiltron.opponents(event, player).some((q) => q.countGainableCards(player, "h"));
        },
        async cost(event, trigger, player) {
          const opps = lib.skill.qx_schiltron.opponents(trigger, player).filter((q) => q.countGainableCards(player, "h"));
          if (opps.length === 1) {
            const { bool } = await player.chooseBool(`枪阵：是否获得${get.translation(opps[0])}的一张手牌？`).set("ai", () => get.attitude(player, opps[0]) <= 0).forResult();
            event.result = { bool, targets: opps };
            return;
          }
          event.result = await player.chooseTarget("枪阵：可以获得对方的一张手牌", (c, p, t) => opps.includes(t)).set("ai", (t) => -get.attitude(get.player(), t)).forResult();
        },
        async content(event, trigger, player) {
          await player.gainPlayerCard(event.targets[0], "h", true);
        }
      }
    },
    opponents(event, player) {
      if (event.name === "useCard" && event.targets?.length && event.card.name === "sha") return event.targets.filter((t) => t !== player && t.isIn());
      const resp = event.respondTo?.[0] || event.getParent(2)?.player;
      return resp && resp !== player && resp.isIn() ? [resp] : [];
    }
  },
  qx_freedom: {
    trigger: { player: "phaseJudgeBegin" },
    filter(event, player) {
      return player.countCards("j") > 0;
    },
    check(event, player) {
      return player.hp >= 2 && player.countCards("j", (c) => ["lebu", "bingliang"].includes(get.name(c))) > 0;
    },
    async content(event, trigger, player) {
      await player.loseHp();
      if (!player.isIn() || !player.countCards("j")) return;
      await player.discardPlayerCard(player, "j", true, "visible");
    }
  },
  // ── 马可·波罗 ──
  qx_journal: {
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return player.hasCards("h", { suit: "diamond" }) && !player.hasJudge("lebu");
    },
    filterCard(card) {
      return get.suit(card) === "diamond";
    },
    position: "h",
    check(card) {
      return get.number(card) - 3;
    },
    async content(event, trigger, player) {
      const card = event.cards[0];
      await player.addJudge({ name: "lebu" }, [card]);
      await player.recover();
      await player.draw(get.number(card) || 0);
    },
    mod: {
      cardUsable(card, player) {
        if (player.countCards("j")) return Infinity;
      }
    },
    ai: {
      order: 1,
      result: {
        player(player) {
          return player.hp <= 2 ? 3 : 1;
        }
      }
    }
  },
  qx_trade: {
    trigger: { player: "damageBegin4" },
    forced: true,
    filter(event, player) {
      return player.isIn();
    },
    async content(event, trigger, player) {
      for (const q of game.filterPlayer((q2) => q2 !== player).sortBySeat(player.next)) {
        if (!q.isIn() || !player.countGainableCards(q, "hej")) continue;
        await q.gainPlayerCard(player, "hej", true);
      }
      for (const q of game.filterPlayer((q2) => q2 !== player).sortBySeat(player.next)) {
        if (!player.isIn() || !q.isIn() || !q.countGainableCards(player, "hej")) continue;
        await player.gainPlayerCard(q, "hej", true);
      }
    }
  },
  // ── 但丁 ──
  qx_redemption: {
    trigger: { player: "phaseZhunbeiBegin" },
    filter(event, player) {
      const used = player.storage.qx_redemption_used || [];
      return [0, 1, 2, 3].some((i) => !used.includes(i));
    },
    async cost(event, trigger, player) {
      const used = player.storage.qx_redemption_used || [];
      const names = ["回复体力至全场唯一最多", "摸牌至全场唯一最多", "装满军备区", "获得【救赎】"];
      const avail = [0, 1, 2, 3].filter((i) => !used.includes(i));
      const { control } = await player.chooseControl(...avail.map((i) => names[i]), "cancel2").set("prompt", get.prompt2(event.skill)).set("ai", () => {
        if (player.isDamaged() && avail.includes(0)) return names[0];
        return names[avail[0]];
      }).forResult();
      if (control === "cancel2") return;
      const opt = names.indexOf(control);
      const { bool, targets } = await player.chooseTarget(`救赎：选择一名角色（${control}）`, true, (c, p, t) => opt !== 3 || !t.hasSkill("qx_redemption")).set("ai", (t) => get.attitude(get.player(), t) + (t === get.player() ? 0.5 : 0)).forResult();
      event.result = { bool, targets, cost_data: opt };
    },
    async content(event, trigger, player) {
      const opt = event.cost_data, t = event.targets[0];
      player.storage.qx_redemption_used ??= [];
      player.storage.qx_redemption_used.add(opt);
      const rest = game.filterPlayer((q) => q !== t);
      if (opt === 0) {
        const m = Math.max(0, ...rest.map((q) => q.hp));
        if (m + 1 > t.hp) await t.recover(m + 1 - t.hp, player);
      } else if (opt === 1) {
        const m = Math.max(0, ...rest.map((q) => q.countCards("h")));
        if (m + 1 > t.countCards("h")) await t.draw(m + 1 - t.countCards("h"));
      } else if (opt === 2) {
        for (const sub of ["equip1", "equip2", "equip3", "equip4"]) {
          if (!t.isIn() || !t.hasEmptySlot(sub)) continue;
          const pool = [...ui.cardPile.childNodes, ...ui.discardPile.childNodes].filter((c) => get.subtype(c) === sub && t.canUse(c, t));
          if (!pool.length) continue;
          await t.chooseUseTarget(pool.randomGet(), true, "nopopup");
        }
      } else t.addSkills("qx_redemption");
    }
  },
  qx_exile: {
    trigger: { player: "damageEnd" },
    filter(event, player) {
      return event.source && event.source !== player && player.isIn();
    },
    async cost(event, trigger, player) {
      const x = lost$1(player);
      event.result = await player.chooseTarget(get.prompt(event.skill), `令一名角色摸${x}张牌并翻面`).set("ai", (t) => {
        const p = get.player(), a = get.attitude(p, t);
        if (t.isTurnedOver()) return a > 0 ? 3 + x : -3;
        return a < 0 ? -a * 2 - x * 0.7 : -1;
      }).forResult();
    },
    async content(event, trigger, player) {
      const t = event.targets[0];
      const x = lost$1(player);
      if (x > 0) await t.draw(x);
      await t.turnOver();
    }
  },
  // ── 腓特烈一世 ──
  qx_knights: {
    forced: true,
    locked: true,
    group: ["wushuang1", "wushuang2"]
  },
  qx_slumber: {
    juexingji: true,
    skillAnimation: true,
    animationColor: "thunder",
    trigger: { player: "phaseZhunbeiBegin" },
    forced: true,
    filter(event, player) {
      return player.hp === 1 || player.countCards("h") === 0;
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name);
      await player.loseMaxHp();
      if (!player.isIn()) return;
      await player.recover();
      await player.draw(3);
      await player.changeSkills(["qx_resurgence"], ["qx_slumber"]);
    }
  },
  qx_resurgence: {
    group: ["qx_resurgence_lose"],
    mod: {
      selectTarget(card, player, range) {
        if ((card.name === "sha" || card.name === "juedou") && range[1] !== -1 && !player.hasSkill("qx_resurgence_extra")) range[1]++;
      }
    },
    subSkill: {
      lose: {
        trigger: { source: "damageBegin2" },
        filter(event, player) {
          return event.player !== player && event.card && ["sha", "juedou"].includes(get.name(event.card)) && !player.hasSkill("qx_resurgence_used");
        },
        check(event, player) {
          return get.attitude(player, event.player) < 0;
        },
        logTarget: "player",
        async content(event, trigger, player) {
          player.addTempSkill("qx_resurgence_used", { global: "phaseAfter" });
          await trigger.player.loseHp(trigger.num);
          if (!trigger.player.isIn()) trigger.cancel();
        }
      },
      used: { charlotte: true },
      extra: { charlotte: true },
      mark: {
        trigger: { player: "useCard" },
        forced: true,
        popup: false,
        filter(event, player) {
          return ["sha", "juedou"].includes(get.name(event.card)) && event.targets?.length > 1;
        },
        async content(event, trigger, player) {
          player.addTempSkill("qx_resurgence_extra", { global: "phaseAfter" });
        }
      }
    }
  },
  // ── 中古主公技：勤王（同护驾，按中古阵营 wei）──
  qx_escort: {
    zhuSkill: true,
    trigger: { player: ["chooseToRespondBefore", "chooseToUseBefore"] },
    filter(event, player) {
      if (event.responded || player.storage.qx_escorting || !player.hasZhuSkill("qx_escort")) return false;
      if (!event.filterCard({ name: "shan", isCard: true }, player, event)) return false;
      return game.hasPlayer((c) => c !== player && c.group === "wei");
    },
    check(event, player) {
      return get.damageEffect(player, event.player, player) < 0;
    },
    async content(event, trigger, player) {
      let current = player.next;
      while (current !== player) {
        let bool = false;
        if (current.group === "wei" && (current === game.me && !_status.auto || get.attitude(current, player) > 2 || current.isOnline())) {
          player.storage.qx_escorting = true;
          const next = current.chooseToRespond({
            prompt: `勤王：是否替${get.translation(player)}打出一张闪？`,
            filterCard: get.filter({ name: "shan" }),
            ai() {
              const e = get.event();
              return get.attitude(e.player, e.source) - 2;
            }
          });
          next.autochoose = lib.filter.autoRespondShan;
          next.set("source", player);
          bool = !!(await next.forResult()).bool;
        }
        player.storage.qx_escorting = false;
        if (bool) {
          trigger.result = { bool: true, card: { name: "shan", isCard: true } };
          trigger.responded = true;
          trigger.animate = false;
          return;
        }
        current = current.next;
      }
    },
    ai: {
      respondShan: true,
      skillTagFilter(player) {
        if (player.storage.qx_escorting || !player.hasZhuSkill("qx_escort")) return false;
        return game.hasPlayer((c) => c !== player && c.group === "wei");
      }
    }
  }
};
skills$3.qx_resurgence.group.push("qx_resurgence_mark");
const lost = (p) => p.getDamagedHp();
const SHA$1 = { name: "sha", isCard: true };
const tagged = (name, tag) => {
  const c = get.autoViewAs({ name, isCard: true });
  Object.assign(c, tag);
  return c;
};
const BASICS = ["sha", "shan", "tao", "jiu"];
const skills$2 = {
  // ── 伊丽莎白一世 ──
  qx_seapower: {
    trigger: { player: "useCardAfter" },
    forced: true,
    filter(event, player) {
      return get.type(event.card) === "trick";
    },
    async content(event, trigger, player) {
      await player.draw();
    },
    mod: {
      targetInRange(card) {
        if (get.type(card) === "trick") return true;
      }
    }
  },
  qx_mantle: {
    enable: "chooseToUse",
    filterCard(card) {
      return get.color(card) === "black";
    },
    position: "hes",
    viewAs: { name: "wuxie" },
    viewAsFilter(player) {
      return player.hasCards("hes", { color: "black" });
    },
    prompt: "将一张黑色牌当无懈可击使用",
    check(card) {
      return 8 - get.value(card);
    }
  },
  // ── 达·芬奇 ──
  qx_codex: {
    trigger: { player: "phaseBegin" },
    async cost(event, trigger, player) {
      const { control } = await player.chooseControl("严格递增", "严格递减", "cancel2").set("prompt", get.prompt2(event.skill)).set("ai", () => player.countCards("h", (c) => get.number(c) <= 6) >= player.countCards("h") / 2 ? 0 : 1).forResult();
      event.result = { bool: control !== "cancel2", cost_data: control === "严格递增" ? 1 : -1 };
    },
    async content(event, trigger, player) {
      player.storage.qx_codex = { dir: event.cost_data, ranks: [] };
      player.addTempSkill("qx_codex_on");
    },
    subSkill: {
      on: {
        charlotte: true,
        mark: true,
        intro: {
          content(s, player) {
            const c = player.storage.qx_codex;
            return c ? `${c.dir > 0 ? "严格递增" : "严格递减"}；已用点数：${c.ranks.join("、") || "无"}` : "";
          }
        },
        trigger: { player: "useCard" },
        forced: true,
        filter(event, player) {
          return !!player.storage.qx_codex;
        },
        async content(event, trigger, player) {
          const cx = player.storage.qx_codex, r = get.number(trigger.card) || 0;
          const ok = r > 0 && cx.ranks.every((x) => cx.dir > 0 ? r > x : r < x);
          cx.ranks.push(r);
          if (ok) await player.draw();
        },
        onremove(player) {
          delete player.storage.qx_codex;
        }
      }
    }
  },
  qx_invert: {
    enable: "phaseUse",
    filter(event, player) {
      if (player.getStat("skill").qx_invert) return false;
      return !!lib.skill.qx_invert.lastName(player) && player.countCards("he") > 0;
    },
    lastName(player) {
      const h = player.getHistory("useCard");
      if (!h.length) return null;
      const card = h[h.length - 1].card;
      const type = get.type(card);
      return type === "basic" || type === "trick" ? { name: get.name(card), nature: get.nature(card) } : null;
    },
    filterCard: true,
    position: "hes",
    viewAs(cards, player) {
      const l = lib.skill.qx_invert.lastName(player);
      return l ? { name: l.name, nature: l.nature } : null;
    },
    viewAsFilter(player) {
      const l = lib.skill.qx_invert.lastName(player);
      return !!l && player.hasCards("hes");
    },
    prompt(event) {
      const l = lib.skill.qx_invert.lastName(get.player());
      return `镜书：将一张牌当【${get.translation(l?.name)}】使用`;
    },
    check(card) {
      return 6 - get.value(card);
    },
    ai: { order: 5, result: { player: 1 } }
  },
  // ── 马基雅维利 ──
  qx_scheme: {
    enable: "phaseUse",
    usable: 1,
    filterTarget: true,
    selectTarget: 2,
    multitarget: true,
    targetprompt: ["", ""],
    async content(event, trigger, player) {
      const targets = event.targets;
      const cs = get.cards(2);
      await game.cardsGotoOrdering(cs);
      await player.showCards(cs, `${get.translation(player)}的权术`);
      const { targets: picked } = await player.chooseTarget(`权术：选择获得${get.translation(cs[0])}的角色`, true, (c, p, t) => targets.includes(t)).set("ai", (t) => get.attitude(get.player(), t)).forResult();
      const a = picked?.[0] || targets[0], b = targets.find((t) => t !== a);
      await a.gain(cs[0], "gain2");
      await b.gain(cs[1], "gain2");
      const tag = { qx_schemeBy: player };
      const n0 = get.number(cs[0]), n1 = get.number(cs[1]);
      if (n0 !== n1) {
        const [hi, lo] = n0 > n1 ? [a, b] : [b, a];
        if (hi.isIn() && lo.isIn() && hi.canUse(SHA$1, lo, false)) {
          const u = hi.useCard(tagged("sha", tag), [lo], false);
          u.addCount = false;
          await u;
        }
      }
      const live = targets.filter((t) => t !== player && t.isIn());
      if (!live.length || !player.isIn()) return;
      const { bool, targets: ts } = await player.chooseTarget("权术：可以视为对其中任意名角色使用杀", [1, live.length], (c, p, t) => live.includes(t) && p.canUse(SHA$1, t, false)).set("ai", (t) => get.effect(t, SHA$1, get.player(), get.player())).forResult();
      if (bool && ts?.length) {
        const u = player.useCard(tagged("sha", tag), ts, false);
        u.addCount = false;
        await u;
      }
    },
    group: "qx_scheme_take",
    subSkill: {
      take: {
        trigger: { global: "damageEnd" },
        forced: true,
        filter(event, player) {
          return event.card?.qx_schemeBy === player && event.player !== player && event.player.isIn() && event.player.countGainableCards(player, "he");
        },
        logTarget: "player",
        async content(event, trigger, player) {
          await player.gainPlayerCard(trigger.player, "he", true);
        }
      }
    },
    ai: {
      order: 7,
      result: {
        target(player, target) {
          return get.attitude(player, target) > 0 ? 0.5 : -1;
        }
      }
    }
  },
  qx_sophist: {
    trigger: { target: "useCardToTarget" },
    filter(event, player) {
      if (event.card.name !== "sha" || !player.hasCards("he")) return false;
      return game.hasPlayer((c) => player.inRange(c) && c !== event.player && c !== player && !event.targets.includes(c) && !!lib.filter.targetEnabled(event.card, event.player, c));
    },
    async cost(event, trigger, player) {
      event.result = await player.chooseCardTarget({
        filterTarget(card, player2, target) {
          const e = _status.event;
          return player2.inRange(target) && target !== e.source && !e.already.includes(target) && lib.filter.targetEnabled(e.card, e.source, target);
        },
        filterCard: lib.filter.cardDiscardable,
        position: "he",
        ai1: (card) => get.unuseful(card) + 9,
        ai2: (target) => {
          const p = get.player();
          if (p.hasCards("h", "shan")) return -get.attitude(p, target);
          return 6 - get.attitude(p, target);
        },
        prompt: get.prompt(event.skill),
        prompt2: "弃置一张牌，将此【杀】转移给攻击范围内的另一名角色",
        source: trigger.player,
        card: trigger.card,
        already: trigger.targets
      }).forResult();
    },
    async content(event, trigger, player) {
      const target = event.targets[0], evt = trigger.getParent();
      evt.triggeredTargets2.remove(player);
      evt.targets.remove(player);
      evt.targets.push(target);
      await player.discard({ cards: event.cards });
    }
  },
  // ── 莎士比亚 ──
  qx_soliloquy: {
    locked: true,
    group: ["qx_soliloquy_first", "qx_soliloquy_miss"],
    mod: {
      cardUsable(card) {
        if (card.name === "sha") return Infinity;
      }
    },
    subSkill: {
      first: {
        trigger: { player: "useCardToPlayered" },
        forced: true,
        filter(event, player) {
          if (event.card.name !== "sha" || !event.isFirstTarget || _status.currentPhase !== player) return false;
          const phase = event.getParent("phaseUse");
          if (!phase || phase.player !== player) return false;
          return !player.hasSkill("qx_soliloquy_done");
        },
        async content(event, trigger, player) {
          player.addTempSkill("qx_soliloquy_done", "phaseUseAfter");
          const use = trigger.getParent();
          use.qx_soliloquyFirst = true;
          use.baseDamage = (use.baseDamage || 1) + 1;
          use.directHit.addArray(trigger.targets);
        }
      },
      done: { charlotte: true },
      miss: {
        trigger: { player: "shaMiss" },
        forced: true,
        filter(event, player) {
          return !event.getParent()?.qx_soliloquyFirst && event.target !== player && event.target.isIn();
        },
        async content(event, trigger, player) {
          await player.damage(1, trigger.target);
        }
      }
    }
  },
  qx_tragedy: {
    trigger: { global: "die" },
    filter(event, player) {
      return event.player !== player && player.isIn();
    },
    check() {
      return true;
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const t = trigger.player;
      const cs = t.getCards("hej");
      if (cs.length) await player.gain(cs, t, "giveAuto", "bySelf");
      const sk = t.getSkills(null, false, false).filter((s) => {
        const info = get.info(s);
        return info && !info.charlotte && !info.zhuSkill && !player.hasSkill(s);
      });
      if (sk.length) await player.addSkills(sk);
    }
  },
  // ── 伽利略 ──
  qx_telescope: {
    trigger: { player: ["phaseBegin", "phaseJieshuBegin"] },
    frequent: true,
    async content(event, trigger, player) {
      await player.chooseToGuanxing(Math.min(5, game.countPlayer()));
    },
    ai: { guanxing: true }
  },
  qx_eppur: {
    locked: true,
    group: ["qx_eppur_fill", "qx_eppur_use"],
    subSkill: {
      fill: {
        trigger: { player: ["loseAfter", "damageEnd", "loseHpEnd"], global: ["loseAsyncAfter", "gainAfter"] },
        forced: true,
        filter(event, player) {
          if (!player.isIn()) return false;
          if (["loseAsync", "gain"].includes(event.name) && !event.getl?.(player)?.hs?.length) return false;
          return player.countCards("h") < lost(player) + 1;
        },
        async content(event, trigger, player) {
          await player.draw(lost(player) + 1 - player.countCards("h"));
        }
      },
      use: {
        enable: ["chooseToUse", "chooseToRespond"],
        position: "hes",
        prompt: "仍动：黑桃当无懈可击、红桃当药、梅花当闪、方块当火杀",
        map: { spade: { name: "wuxie" }, heart: { name: "tao" }, club: { name: "shan" }, diamond: { name: "sha", nature: "fire" } },
        filterCard(card, player, event) {
          const m = lib.skill.qx_eppur_use.map[get.suit(card)];
          if (!m) return false;
          event = event || _status.event;
          const ev = event._backup || event;
          return !!ev.filterCard?.(get.autoViewAs({ ...m }, [card]), player, event);
        },
        viewAs(cards) {
          if (!cards.length) return null;
          const m = lib.skill.qx_eppur_use.map[get.suit(cards[0])];
          return m ? { ...m } : null;
        },
        viewAsFilter(player) {
          return player.hasCards("hes");
        },
        check(card) {
          return 7 - get.value(card);
        },
        ai: {
          respondSha: true,
          respondShan: true,
          save: true,
          skillTagFilter(player, tag) {
            const suit = { respondSha: "diamond", respondShan: "club", save: "heart" }[tag];
            return !suit || player.hasCards("hes", { suit });
          },
          order: 4
        },
        hiddenCard(player, name) {
          const s = { wuxie: "spade", tao: "heart", shan: "club", sha: "diamond" }[name];
          return !!s && player.hasCards("hes", { suit: s });
        }
      }
    }
  },
  // ── 米开朗基罗 ──
  qx_chisel: {
    trigger: { player: "phaseDrawBegin1" },
    forced: true,
    filter(event, player) {
      return !event.numFixed;
    },
    async content(event, trigger, player) {
      trigger.changeToZero();
      const once = async () => {
        const cs = get.cards(5);
        await game.cardsGotoOrdering(cs);
        const { links } = await player.chooseButton(["雕琢：每种花色选一张获得", cs], [1, 4], true).set("filterButton", (b) => !ui.selected.buttons.some((x) => get.suit(x.link) === get.suit(b.link))).set("ai", (b) => get.value(b.link)).forResult();
        const take = links || [];
        if (take.length) await player.gain(take, "gain2");
        const rest = cs.filter((c) => !take.includes(c));
        if (rest.length) await game.cardsDiscard(rest);
        return take.length;
      };
      const n = await once();
      if (n < 3 && player.isIn()) {
        const { bool } = await player.chooseBool("雕琢：是否再这样做一次？").set("ai", () => true).forResult();
        if (bool) await once();
      }
    }
  },
  qx_david: {
    trigger: { player: "phaseDiscardBefore" },
    forced: true,
    filter(event, player) {
      return !player.hasHistory("useCard", (evt) => get.name(evt.card) === "sha" && evt.getParent("phaseUse")?.player === player);
    },
    async content(event, trigger, player) {
      trigger.cancel();
      game.log(player, "跳过了弃牌阶段");
    }
  },
  // ── 德雷克 ──
  qx_plunder: {
    trigger: { global: "useCardAfter" },
    direct: true,
    filter(event, player) {
      return _status.currentPhase !== player && event.player !== player && event.player.isIn() && player.isIn() && get.color(event.card) === "red" && player.hasSha();
    },
    async content(event, trigger, player) {
      const t = trigger.player;
      const before = t.getHistory("damage").length;
      const { bool } = await player.chooseToUse(`劫掠：可以对${get.translation(t)}使用一张无距离限制的杀`, function(card, player2, event2) {
        return get.name(card) === "sha" && lib.filter.filterCard.apply(this, arguments);
      }).set("filterTarget", (card, player2, target) => target === _status.event.sourcex && lib.filter.targetEnabled(card, player2, target)).set("sourcex", t).set("addCount", false).set("logSkill", ["qx_plunder", t]).forResult();
      if (bool && t.isIn() && player.isIn() && t.getHistory("damage", (e) => e.source === player).length > 0 && t.getHistory("damage").length > before && t.countCards("h")) {
        await player.gain(t.getCards("h"), t, "giveAuto", "bySelf");
      }
    },
    mod: {
      targetInRange(card, player, target) {
        if (_status.event?.logSkill?.[0] === "qx_plunder") return true;
      }
    }
  },
  qx_fireship: {
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return player.countCards("h") > 0;
    },
    filterTarget(card, player, target) {
      return target !== player;
    },
    async content(event, trigger, player) {
      const t = event.target;
      for (let guard = 0; guard < 20; guard++) {
        await t.draw();
        if (!t.isIn() || !player.isIn() || !player.canUse({ name: "huogong", isCard: true }, t, false)) break;
        const before = t.getHistory("damage", (e) => e.source === player).length;
        const u = player.useCard({ name: "huogong", isCard: true }, t, false);
        await u;
        const dealt = t.getHistory("damage", (e) => e.source === player).length > before;
        if (!dealt || !player.isIn() || !t.isIn() || !player.countCards("h")) break;
        const { bool } = await player.chooseBool(`火船：是否对${get.translation(t)}重复此流程？`).set("ai", () => get.attitude(player, t) < 0).forResult();
        if (!bool) break;
      }
    },
    group: "qx_fireship_draw",
    subSkill: {
      draw: {
        trigger: { source: "damageSource" },
        forced: true,
        filter(event, player) {
          return event.card?.name === "huogong";
        },
        async content(event, trigger, player) {
          await player.draw();
        }
      }
    },
    ai: {
      order: 6,
      result: {
        target(player, target) {
          return get.attitude(player, target) < 0 ? -1.5 : 0;
        }
      }
    }
  },
  // ── 古斯塔夫 ──
  qx_volley: {
    trigger: { player: "phaseBegin" },
    forced: true,
    filter(event, player) {
      return game.hasPlayer((q) => q !== player);
    },
    async content(event, trigger, player) {
      const card = get.autoViewAs({ name: "wanjian", isCard: true });
      await player.useCard(card, game.filterPlayer((q) => q !== player), false);
      const parried = game.filterPlayer2().some((p) => p.hasHistory("respond", (e) => get.name(e.card) === "shan" && e.respondTo?.[1] === card));
      if (parried) player.addTempSkill("qx_volley_again");
    },
    subSkill: {
      again: {
        charlotte: true,
        trigger: { player: "phaseEnd" },
        forced: true,
        filter(event, player) {
          return game.hasPlayer((q) => q !== player);
        },
        async content(event, trigger, player) {
          player.removeSkill("qx_volley_again");
          await player.useCard({ name: "wanjian", isCard: true }, game.filterPlayer((q) => q !== player), false);
        }
      }
    }
  },
  qx_reform: {
    locked: true,
    group: ["qx_reform_use", "qx_reform_def"],
    subSkill: {
      use: {
        enable: ["chooseToUse", "chooseToRespond"],
        filter(event, player) {
          if (!player.hasCards("hes", (c) => get.type(c) === "equip")) return false;
          return BASICS.some((n) => event.filterCard(get.autoViewAs({ name: n }, "unsure"), player, event));
        },
        hiddenCard(player, name) {
          return BASICS.includes(name) && player.hasCards("hes", (c) => get.type(c) === "equip");
        },
        chooseButton: {
          dialog(event, player) {
            const list = BASICS.filter((n) => event.filterCard(get.autoViewAs({ name: n }, "unsure"), player, event)).map((n) => ["基本", "", n]);
            return ui.create.dialog("改革：将一张军备牌当基本牌使用或打出", [list, "vcard"]);
          },
          check(button) {
            return { tao: 4, jiu: 2, sha: 3, shan: 3 }[button.link[2]] || 1;
          },
          backup(links) {
            return {
              filterCard: (card) => get.type(card) === "equip",
              position: "hes",
              popname: true,
              viewAs: { name: links[0][2] },
              check(card) {
                return 6 - get.value(card);
              }
            };
          },
          prompt(links) {
            return `将一张军备牌当【${get.translation(links[0][2])}】使用或打出`;
          }
        },
        ai: {
          order: 4,
          respondSha: true,
          respondShan: true,
          save: true,
          skillTagFilter(player) {
            return player.hasCards("hes", (c) => get.type(c) === "equip");
          },
          result: { player: 1 }
        }
      },
      def: {
        trigger: { player: "damageBegin4" },
        forced: true,
        filter(event, player) {
          return !player.countCards("e") && event.card && get.type(event.card) === "trick";
        },
        async content(event, trigger, player) {
          trigger.num--;
        }
      }
    }
  },
  // ── 牛顿 ──
  qx_gravity: {
    trigger: { target: "useCardToTarget" },
    forced: true,
    filter(event, player) {
      if (event.player === player || !event.player.isIn()) return false;
      if (!["basic", "trick"].includes(get.type(event.card))) return false;
      return !event.targets.includes(event.player);
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const evt = trigger.getParent();
      evt.targets.push(trigger.player);
      game.log(trigger.player, "也成为了", trigger.card, "的目标");
    }
  },
  qx_laws: {
    trigger: { player: "useCard" },
    frequent: true,
    filter(event, player) {
      const n = player.getHistory("useCard").length;
      return n > 0 && n % 3 === 0;
    },
    async content(event, trigger, player) {
      await player.draw(3);
    }
  },
  // ── 叶卡捷琳娜 ──
  qx_enlighten: {
    trigger: { player: ["phaseUseBegin", "phaseDiscardBegin"] },
    frequent: true,
    filter(event, player) {
      return player.countCards("h") > 0;
    },
    check(event, player) {
      return event.name === "phaseUse" || player.countCards("h") < 3;
    },
    async content(event, trigger, player) {
      await player.draw(player.countCards("h"));
    }
  },
  qx_favor: {
    limited: true,
    skillAnimation: true,
    animationColor: "gray",
    trigger: { player: "phaseJieshuBegin" },
    filter(event, player) {
      return lib.skill.qx_favor.cardsOf(player).length > 0 && game.hasPlayer((q) => q !== player);
    },
    cardsOf(player) {
      return player.getHistory("lose", (e) => e.type === "discard").flatMap((e) => e.cards2 || []).filter((c) => get.position(c, true) === "d");
    },
    async cost(event, trigger, player) {
      const n = lib.skill.qx_favor.cardsOf(player).length;
      event.result = await player.chooseTarget(get.prompt(event.skill), `令一名其他角色获得本回合你弃置的${n}张牌`, (c, p, t) => t !== p).set("ai", (t) => n >= 3 ? get.attitude(get.player(), t) : 0).forResult();
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name);
      const cs = lib.skill.qx_favor.cardsOf(player);
      if (cs.length) await event.targets[0].gain(cs, "gain2");
    }
  },
  // ── 文艺主公技：赞助 ──
  qx_patron: {
    zhuSkill: true,
    trigger: { player: "recoverBegin" },
    forced: true,
    filter(event, player) {
      if (!player.hasZhuSkill("qx_patron")) return false;
      return event.card && get.name(event.card) === "tao" && event.source && event.source !== player && event.source.group === "wu";
    },
    async content(event, trigger, player) {
      trigger.num++;
    }
  }
};
const SHA = { name: "sha", isCard: true };
const cat = (card) => get.type(card);
const skills$1 = {
  // ── 拿破仑 ──
  qx_austerlitz: {
    trigger: { player: "useCard" },
    forced: true,
    popup: false,
    filter(event, player) {
      if (event.qx_austerlitz || _status.currentPhase !== player) return false;
      const phase = event.getParent("phaseUse");
      return phase && phase.player === player;
    },
    async content(event, trigger, player) {
      const phase = trigger.getParent("phaseUse");
      if (player.storage.qx_austerlitz_phase !== phase) {
        player.storage.qx_austerlitz_phase = phase;
        player.storage.qx_austerlitz = [];
      }
      const seq = player.storage.qx_austerlitz;
      seq.push(cat(trigger.card));
      if (seq.length > 3) seq.shift();
      if (seq.length === 3 && new Set(seq).size === 3 && player.isIn()) {
        player.storage.qx_austerlitz = [];
        const ts = game.filterPlayer((t) => t !== player && player.canUse(SHA, t, false)).sortBySeat(player.next);
        if (!ts.length) return;
        player.logSkill("qx_austerlitz", ts);
        const u = player.useCard(get.autoViewAs({ ...SHA }), ts, false);
        u.addCount = false;
        u.qx_austerlitz = true;
        await u;
      }
    }
  },
  qx_returnx: {
    trigger: { player: "dying" },
    forced: true,
    filter(event, player) {
      return player.hp < 1;
    },
    async content(event, trigger, player) {
      await player.loseMaxHp();
      if (!player.isIn() || player.maxHp <= 0) return;
      await player.recover(player.maxHp - player.hp);
      const n = 3 - player.maxHp;
      if (n <= 0 || !game.hasPlayer((q) => q !== player)) return;
      const { targets } = await player.chooseTarget(`百日：对一名角色造成${n}点雷电伤害`, true, (c, p, t) => t !== p).set("ai", (t) => get.damageEffect(t, get.player(), get.player(), "thunder")).forResult();
      if (targets?.length) await targets[0].damage(n, player, "thunder");
    }
  },
  // ── 威灵顿 ──
  qx_square: {
    trigger: { player: "loseAfter", global: ["loseAsyncAfter", "gainAfter", "equipAfter", "addJudgeAfter"] },
    filter(event, player) {
      if (player.storage.qx_square_busy || !player.isIn()) return false;
      const evt = event.getl?.(player);
      if (!evt) return false;
      return evt.hs?.length && !player.countCards("h") || evt.es?.length && !player.countCards("e") || evt.js?.length && !player.countCards("j");
    },
    async cost(event, trigger, player) {
      event.result = await player.chooseTarget(get.prompt(event.skill), "对一名角色造成1点伤害").set("ai", (t) => get.damageEffect(t, get.player(), get.player())).forResult();
    },
    async content(event, trigger, player) {
      player.storage.qx_square_busy = true;
      try {
        await event.targets[0].damage(player);
      } finally {
        player.storage.qx_square_busy = false;
      }
    }
  },
  qx_nemesis: {
    enable: "phaseUse",
    usable: 1,
    filterCard: true,
    position: "he",
    check(card) {
      return 6 - get.value(card);
    },
    filterTarget(card, player, target) {
      return target !== player;
    },
    async content(event, trigger, player) {
      const t = event.target;
      await player.turnOver();
      if (t.countGainableCards(player, "h")) await player.gain(t.getCards("h"), t, "giveAuto", "bySelf");
      player.storage.qx_nemesis_target = t;
      player.addTempSkill("qx_nemesis_back", "phaseUseAfter");
    },
    subSkill: {
      back: {
        charlotte: true,
        trigger: { player: "phaseUseEnd" },
        forced: true,
        popup: false,
        async content(event, trigger, player) {
          const t = player.storage.qx_nemesis_target;
          delete player.storage.qx_nemesis_target;
          if (!t?.isIn()) return;
          const n = Math.min(Math.max(0, t.hp), player.countCards("he"));
          if (n > 0) {
            const { cards } = await player.chooseCard("he", n, true, `宿敌：交给${get.translation(t)}${n}张牌`).set("ai", (c) => -get.value(c)).forResult();
            if (cards?.length) await player.give(cards, t);
          }
        }
      }
    },
    ai: {
      order: 3,
      result: {
        target(player, target) {
          return target.countCards("h") >= 3 && get.attitude(player, target) < 0 ? -2 : 0;
        }
      }
    }
  },
  // ── 林肯 ──
  qx_emancipate: {
    group: ["qx_emancipate_skip"],
    enable: "phaseUse",
    usable: 1,
    filterTarget(card, player, target) {
      return target !== player && target.countCards("j", (c) => !player.hasJudge(get.name(c)));
    },
    async content(event, trigger, player) {
      const t = event.target;
      const { links } = await player.choosePlayerCard(t, "j", true, "visible").set("filterButton", (b) => !player.hasJudge(get.name(b.link))).forResult();
      if (links?.length) await player.addJudge(links[0]);
      await player.recover();
      await t.recover(1, player);
      await player.draw(3);
      await t.draw(3);
    },
    subSkill: {
      skip: {
        trigger: { player: "phaseJudgeBefore" },
        forced: true,
        async content(event, trigger, player) {
          trigger.cancel();
          game.log(player, "跳过了判定阶段");
        }
      }
    },
    ai: {
      order: 8,
      result: {
        target(player, target) {
          return 2;
        }
      }
    }
  },
  qx_address: {
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return game.countPlayer((t) => t.countCards("h") > 0) >= 2;
    },
    filterTarget(card, player, target) {
      if (!target.countCards("h")) return false;
      if (ui.selected.targets.length) return ui.selected.targets[0].canCompare(target);
      return true;
    },
    selectTarget: 2,
    multitarget: true,
    targetprompt: ["发起", "拼点"],
    async content(event, trigger, player) {
      const [a, b] = event.targets;
      const r = await a.chooseToCompare(b).forResult();
      const loser = r.bool ? b : a;
      const winner = r.bool ? a : r.tie ? null : b;
      if (loser.isIn() && player.isIn() && loser.countDiscardableCards(player, "he")) await player.discardPlayerCard(loser, "he", Math.min(2, loser.countCards("he")), true);
      if (winner !== player && player.isIn()) await player.draw(2);
    },
    ai: {
      order: 6,
      result: {
        target(player, target) {
          return get.attitude(player, target) > 0 ? 0 : -1;
        }
      }
    }
  },
  // ── 玻利瓦尔 ──
  qx_founder: {
    trigger: { global: ["phaseUseBegin", "phaseUseEnd"] },
    forced: true,
    filter(event, player) {
      const t = event.player;
      return t !== player && t.isIn() && t.countCards("h") >= player.countCards("h") && t.countCards("he") > 0;
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const t = trigger.player;
      const { cards } = await t.chooseCard("he", true, `建国：交给${get.translation(player)}一张牌`).set("ai", (c) => -get.value(c)).forResult();
      if (cards?.length) await t.give(cards, player);
    }
  },
  qx_andes: {
    locked: true,
    group: "qx_andes_dmg",
    ai: {
      unequip: true,
      skillTagFilter(player, tag, arg) {
        if (!arg?.card || get.name(arg.card) !== "sha") return false;
      }
    },
    subSkill: {
      dmg: {
        trigger: { source: "damageBegin1" },
        forced: true,
        filter(event, player) {
          return event.card && get.name(event.card) === "sha" && event.player !== player && event.player.countCards("e") >= player.countCards("e");
        },
        async content(event, trigger, player) {
          trigger.num++;
        }
      }
    }
  },
  // ── 南丁格尔 ──
  qx_lamp: {
    group: ["qx_lamp_tao", "qx_lamp_heal"],
    subSkill: {
      tao: {
        enable: "chooseToUse",
        filterCard(card) {
          return get.color(card) === "red";
        },
        position: "hes",
        viewAs: { name: "tao" },
        viewAsFilter(player) {
          return _status.currentPhase !== player && player.hasCards("hes", { color: "red" });
        },
        prompt: "将一张红色牌当药使用",
        check(card) {
          return 15 - get.value(card);
        },
        ai: {
          save: true,
          skillTagFilter(player) {
            return _status.currentPhase !== player && player.hasCards("hes", { color: "red" });
          }
        }
      },
      heal: {
        enable: "phaseUse",
        usable: 1,
        filterCard: true,
        position: "h",
        check(card) {
          return 7 - get.value(card);
        },
        filterTarget(card, player, target) {
          return target.isDamaged();
        },
        async content(event, trigger, player) {
          await event.target.recover(1, player);
        },
        ai: {
          order: 9,
          result: {
            target(player, target) {
              return target.hp <= 1 ? 3 : 1;
            }
          }
        }
      }
    }
  },
  qx_tend: {
    limited: true,
    skillAnimation: true,
    animationColor: "wood",
    trigger: { global: "dying" },
    filter(event, player) {
      return event.player.isIn() && event.player.hp < 1;
    },
    check(event, player) {
      return get.attitude(player, event.player) > 3;
    },
    logTarget: "player",
    async content(event, trigger, player) {
      player.awakenSkill(event.name);
      const t = trigger.player;
      if (t.maxHp !== 3) {
        if (t.maxHp > 3) await t.loseMaxHp(t.maxHp - 3);
        else await t.gainMaxHp(3 - t.maxHp);
      }
      await t.recover(t.maxHp - t.hp, player);
      const inPlay = game.filterPlayer2().map((p) => p.name1);
      const pool = Object.keys(lib.character).filter((k) => k.startsWith("qx_") && lib.character[k].group === t.group && !inPlay.includes(k)).randomGets(3);
      if (!pool.length) return;
      const { links } = await t.chooseButton(["救护：可以选择一张武将牌替换你的武将（也可以不换）", [pool, "character"]]).set("ai", () => Math.random() - 0.5).forResult();
      if (links?.length) await t.reinitCharacter(t.name1, links[0]);
    }
  },
  // ── 居里夫人 ──
  qx_radiate: {
    global: "qx_radiate_hand",
    trigger: { source: "damageBefore" },
    forced: true,
    filter(event, player) {
      return event.player.isIn();
    },
    async content(event, trigger, player) {
      trigger.cancel();
      await trigger.player.loseHp(trigger.num);
    },
    ai: { jueqing: true },
    subSkill: {
      hand: {
        charlotte: true,
        mod: {
          maxHandcard(player, num) {
            const n = game.countPlayer((c) => c !== player && c.hasSkill("qx_radiate") && c.inRange(player));
            if (n) return num - n;
          }
        }
      }
    }
  },
  qx_laurel: {
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return game.hasPlayer((t) => t !== player && t.countCards("h"));
    },
    async content(event, trigger, player) {
      const black = [], red = [];
      for (const q of game.filterPlayer((q2) => q2 !== player).sortBySeat(player.next)) {
        if (!q.countCards("h") || !player.isIn()) continue;
        const { cards } = await q.chooseCard("h", true, `双桂：展示并交给${get.translation(player)}一张手牌`).set("ai", (c) => (get.attitude(q, player) > 0 ? get.color(c) === "red" ? 5 : 1 : get.color(c) === "red" ? 2 : 1) - get.value(c) / 10).forResult();
        if (!cards?.length) continue;
        await q.showCards(cards);
        (get.color(cards[0]) === "black" ? black : red).push(q);
        await q.give(cards, player);
      }
      if (black.length && player.isIn()) {
        const { targets } = await player.chooseTarget("双桂：令交出黑色牌的任意名角色失去1点体力", [1, black.length], (c, p, t) => black.includes(t)).set("ai", (t) => -get.attitude(get.player(), t)).forResult();
        for (const t of targets || []) if (t.isIn()) await t.loseHp();
      }
      if (red.length && player.isIn()) {
        const { targets } = await player.chooseTarget("双桂：令交出红色牌的任意名角色回复1点体力", [1, red.length], (c, p, t) => red.includes(t) && t.isDamaged()).set("ai", (t) => get.attitude(get.player(), t)).forResult();
        for (const t of targets || []) if (t.isIn()) await t.recover(1, player);
      }
    },
    ai: { order: 9, result: { player: 1 } }
  },
  // ── 特斯拉 ──
  qx_current: {
    trigger: { player: "damageBegin4" },
    forced: true,
    filter(event, player) {
      return event.hasNature?.("thunder") || event.nature === "thunder";
    },
    async content(event, trigger, player) {
      const n = trigger.num;
      trigger.cancel();
      await player.recover(n);
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (get.tag(card, "thunderDamage")) return [0, 1];
        }
      }
    }
  },
  qx_coil: {
    group: ["qx_coil_draw", "qx_coil_play"],
    subSkill: {
      draw: {
        trigger: { player: "phaseDrawBefore" },
        filter(event, player) {
          return player.hp > 0;
        },
        async cost(event, trigger, player) {
          event.result = await player.chooseTarget(`线圈：可以跳过摸牌阶段，令至多${player.hp}名角色横置`, [1, player.hp], (c, p, t) => !t.isLinked()).set("ai", (t) => get.player().countCards("h") >= 3 ? -get.attitude(get.player(), t) : 0).forResult();
        },
        async content(event, trigger, player) {
          trigger.cancel();
          for (const t of event.targets) await t.link(true);
        }
      },
      play: {
        trigger: { player: "phaseUseBefore" },
        async cost(event, trigger, player) {
          event.result = await player.chooseTarget("线圈：可以跳过出牌阶段，对一名角色造成2点雷电伤害").set("ai", (t) => {
            const p = get.player();
            if (p.countCards("h", (c) => p.hasValueTarget(c)) > 1) return 0;
            return get.damageEffect(t, p, p, "thunder");
          }).forResult();
        },
        async content(event, trigger, player) {
          trigger.cancel();
          await event.targets[0].damage(2, player, "thunder");
        }
      }
    }
  },
  // ── 贝多芬 ──
  qx_destiny: {
    trigger: { player: "phaseBegin" },
    forced: true,
    filter(event, player) {
      return game.hasPlayer((q) => q !== player && q.countCards("h"));
    },
    async content(event, trigger, player) {
      const shown = [];
      for (const q of game.filterPlayer((q2) => q2 !== player && q2.countCards("h")).sortBySeat(player.next)) shown.push(q.getCards("h").randomGet());
      if (!shown.length) return;
      await player.showCards(shown, "命运");
      const b = shown.filter((c) => get.color(c) === "black").length, r = shown.filter((c) => get.color(c) === "red").length;
      if (b > r) {
        await player.turnOver();
        await player.loseHp();
      } else if (r > b) {
        if (player.isDamaged()) await player.recover(player.maxHp - player.hp);
        await player.draw(3);
      } else await player.gain(shown, "give");
    }
  },
  qx_joy: {
    trigger: { player: "gainAfter", global: "loseAsyncAfter" },
    filter(event, player) {
      if (player.hasSkill("qx_joy_used") || player.hp <= 0 || !game.hasPlayer((q) => q !== player)) return false;
      const cs = event.getg?.(player) || [];
      return cs.length >= 2;
    },
    async cost(event, trigger, player) {
      event.result = await player.chooseTarget(get.prompt(event.skill), `令至多${player.hp}名其他角色各摸一张牌`, [1, player.hp], (c, p, t) => t !== p).set("ai", (t) => get.attitude(get.player(), t)).forResult();
    },
    async content(event, trigger, player) {
      player.addTempSkill("qx_joy_used");
      for (const t of event.targets.sortBySeat()) await t.draw();
    },
    subSkill: { used: { charlotte: true } }
  },
  // ── 达尔文 ──
  qx_evolve: {
    trigger: { player: "phaseDrawBegin2" },
    forced: true,
    filter(event, player) {
      return !event.numFixed;
    },
    async content(event, trigger, player) {
      trigger.num++;
    },
    mod: {
      cardUsable(card, player, num) {
        if (card.name === "sha") return num + 1;
      },
      cardname(card, player) {
        if (card.name === "tao") return "sha";
        if (card.name === "shan") return "jiu";
      }
    }
  },
  qx_fittest: {
    group: ["qx_fittest_cap", "qx_fittest_start", "qx_fittest_dying"],
    mod: {
      maxHandcardBase(player) {
        return player.maxHp;
      }
    },
    subSkill: {
      start: {
        trigger: { global: "phaseBefore", player: "enterGame" },
        forced: true,
        filter(event, player) {
          return (event.name !== "phase" || game.phaseNumber === 0) && player.hp > 1;
        },
        async content(event, trigger, player) {
          player.hp = 1;
          player.update();
        }
      },
      cap: {
        trigger: { player: "recoverBegin" },
        forced: true,
        filter(event, player) {
          return player.hp + event.num > 1;
        },
        async content(event, trigger, player) {
          const n = 1 - player.hp;
          if (n <= 0) trigger.cancel();
          else trigger.num = n;
        }
      },
      dying: {
        trigger: { player: ["dying", "dyingAfter"] },
        forced: true,
        filter(event, player) {
          return player.isIn();
        },
        async content(event, trigger, player) {
          await player.draw(2);
        }
      }
    }
  },
  // ── 塔布曼 ──
  qx_railroad: {
    trigger: { global: "useCardToPlayer" },
    filter(event, player) {
      return event.isFirstTarget && event.player !== player && event.card.name === "sha" && event.player.countGainableCards(player, "h") > 0 && player.isIn();
    },
    check(event, player) {
      return get.attitude(player, event.player) < 0 || event.targets.some((t) => get.attitude(player, t) > 0);
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const src = trigger.player, use = trigger.getParent();
      await player.gainPlayerCard(src, "h", true);
      const used = player.storage.qx_railroad ??= [false, false, false, false];
      const names = ["此杀不能被闪响应", "此杀无效", "将此杀的目标改为你", "目标于此杀结算后回复1点体力"];
      const avail = [0, 1, 2, 3].filter((i) => !used[i] && !(i === 2 && use.targets.length === 1 && use.targets[0] === player));
      if (!avail.length) return;
      const friendHit = use.targets.some((t) => get.attitude(player, t) > 0);
      const { control } = await player.chooseControl(...avail.map((i) => names[i])).set("prompt", "暗渡：选择一项").set("ai", () => {
        if (friendHit && avail.includes(1)) return names[1];
        if (!friendHit && avail.includes(0)) return names[0];
        return names[avail[0]];
      }).forResult();
      const opt = names.indexOf(control);
      used[opt] = true;
      if (used.every(Boolean)) player.storage.qx_railroad = [false, false, false, false];
      if (opt === 0) use.directHit.addArray(use.targets);
      else if (opt === 1) {
        for (const t of use.targets) use.excluded.add(t);
      } else if (opt === 2) {
        if (src.canUse(use.card, player, false)) {
          trigger.targets.length = 0;
          trigger.targets.push(player);
          use.targets.length = 0;
          use.targets.push(player);
          trigger.target = player;
        }
      } else {
        use.qx_railroadHeal = use.targets.slice();
        player.addTempSkill("qx_railroad_heal", { global: "phaseAfter" });
      }
    },
    subSkill: {
      heal: {
        charlotte: true,
        trigger: { global: "useCardAfter" },
        forced: true,
        popup: false,
        filter(event) {
          return event.qx_railroadHeal?.length > 0;
        },
        async content(event, trigger, player) {
          for (const t of trigger.qx_railroadHeal) if (t.isIn() && t.isDamaged()) await t.recover();
          trigger.qx_railroadHeal = [];
        }
      }
    }
  },
  qx_neverlost: {
    locked: true,
    mod: {
      targetEnabled(card, player, target) {
        if (!target.countCards("h") && ["sha", "juedou"].includes(card.name)) return false;
      }
    }
  },
  // ── 革新主公技：号召（同黄天：其他革新角色出牌阶段可交给执笔者一张杀或闪）──
  qx_uprise: {
    zhuSkill: true,
    global: "qx_uprisegive"
  },
  qx_uprisegive: {
    enable: "phaseUse",
    usable: 1,
    discard: false,
    lose: false,
    delay: false,
    line: true,
    prepare(cards, player, targets) {
      targets[0].logSkill("qx_uprise");
    },
    filter(event, player) {
      if (player.group !== "qun") return false;
      return player.hasCards("h", (c) => ["sha", "shan"].includes(get.name(c))) && game.hasPlayer((t) => t !== player && t.hasZhuSkill("qx_uprise", player));
    },
    filterCard(card) {
      return ["sha", "shan"].includes(get.name(card));
    },
    visible: true,
    filterTarget(card, player, target) {
      return target !== player && target.hasZhuSkill("qx_uprise", player);
    },
    async content(event, trigger, player) {
      await player.give(event.cards, event.target);
    },
    ai: {
      expose: 0.3,
      order: 10,
      result: {
        target: 5
      }
    }
  }
};
const CSS = `
/* ===== 卡牌：图里已画好牌名，左上角只叠真实点数花色 ===== */
.card.fullskin > .image { background-size: 100% 100% !important; }
.card.fullskin > .name, .card.fullskin > .range { display: none !important; }
.card.fullskin > .name[data-nature="fire"], .card.fullskin > .name[data-nature="thunder"] {
	display: block !important; writing-mode: horizontal-tb; left: auto; right: 6%; top: 22%; width: auto; height: auto;
	font-size: 12px; padding: 1px 4px; border-radius: 4px; color: #fff; background: #b8321e; font-family: serif;
}
.card.fullskin > .name[data-nature="thunder"] { background: #3d4fa8; }
.card.fullskin > .info {
	left: 7% !important; top: 1.6% !important; right: auto !important; bottom: auto !important;
	font: 700 15px/1 "Noto Serif CJK SC", serif !important; color: #1c140e !important; text-shadow: 0 1px 0 rgba(255,246,220,.7);
	letter-spacing: -1px; transform: none !important;
}
.card.fullskin > .info.red { color: #b0141a !important; }
.card.fullskin > .info > span:first-child { display: none; }

/* ===== 座位框 ===== */
#arena > .player.fullskin:not(.minskin) { width: 150px !important; height: 200px !important; }
#arena > .player.fullskin:not(.minskin) > .avatar {
	left: 13.9% !important; top: 0.8% !important; width: 85% !important; height: 98.3% !important;
	border-radius: 0 6px 6px 0 !important; background-position: center 12% !important;
}
#arena > .player.fullskin:not(.minskin) > .avatar2 { display: none !important; }
#arena > .player.fullskin:not(.minskin) > .qx-frame {
	position: absolute; inset: 0; pointer-events: none; z-index: 2;
	background: url(image/qx/seat-frame.png) center/100% 100% no-repeat;
}
#arena > .player:not(.fullskin) > .qx-frame, #arena > .player.minskin > .qx-frame, #arena > .player:not(.fullskin) > .qx-emblem { display: none; }
#arena > .player.fullskin:not(.minskin) > .framebg { display: none !important; }
/* 名字条（左侧竖排） */
#arena > .player.fullskin:not(.minskin) > .name {
	left: 2.2% !important; top: 17.5% !important; width: 10.3% !important; height: auto !important; max-height: 62%;
	writing-mode: vertical-rl; font: 700 13px/1.05 "Noto Serif CJK SC", serif !important; color: #2a180a !important;
	text-shadow: 0 1px 0 rgba(255,246,220,.8) !important; z-index: 3; text-align: center; letter-spacing: 1px;
}
#arena > .player.fullskin:not(.minskin) > .name.name2 { display: none !important; }
/* 阵营徽章（左上圆座） */
#arena > .player.fullskin:not(.minskin) > .identity { z-index: 4; }
#arena > .player > .qx-emblem {
	position: absolute; left: -3%; top: -2.5%; width: 23%; height: 18.5%; z-index: 3; pointer-events: none;
	background: center/contain no-repeat;
}
#arena > .player[data-qx-group="shu"] > .qx-emblem { background-image: url(image/qx/emblem-classical.png); }
#arena > .player[data-qx-group="wei"] > .qx-emblem { background-image: url(image/qx/emblem-medieval.png); }
#arena > .player[data-qx-group="wu"] > .qx-emblem { background-image: url(image/qx/emblem-renaissance.png); }
#arena > .player[data-qx-group="qun"] > .qx-emblem { background-image: url(image/qx/emblem-revolution.png); }
/* 身份徽章（立绘右上角） */
#arena > .player.fullskin > .identity {
	left: auto !important; right: 3% !important; top: 2% !important; width: 26px !important; height: 26px !important;
	background: url(image/qx/badge-unknown.png) center/100% no-repeat !important; border: none !important; box-shadow: none !important;
}
#arena > .player.fullskin > .identity > div { opacity: 0 !important; }
#arena > .player.fullskin > .identity[data-color="zhu"] { background-image: url(image/qx/badge-chancellor.png) !important; }
#arena > .player.fullskin > .identity[data-color="zhong"] { background-image: url(image/qx/badge-keeper.png) !important; }
#arena > .player.fullskin > .identity[data-color="fan"] { background-image: url(image/qx/badge-insurgent.png) !important; }
#arena > .player.fullskin > .identity[data-color="nei"] { background-image: url(image/qx/badge-schemer.png) !important; }
/* 体力（右侧凹槽，星形） */
#arena > .player.fullskin:not(.minskin) > .hp {
	left: 87.8% !important; top: 56% !important; width: 11% !important; height: 43% !important; z-index: 3;
	display: flex !important; flex-direction: column; justify-content: space-evenly; align-items: center; transform: none !important;
}
#arena > .player.fullskin:not(.minskin) > .hp > div {
	width: 14px !important; height: 14px !important; margin: 0 !important; position: static !important; border: none !important; box-shadow: none !important;
	background: url(image/qx/hp-on.png) center/100% no-repeat !important; filter: none !important;
}
#arena > .player.fullskin:not(.minskin) > .hp > div.lost { background-image: url(image/qx/hp-off.png) !important; }
#arena > .player.fullskin:not(.minskin) > .hp > div::before, #arena > .player.fullskin:not(.minskin) > .hp > div::after { display: none !important; }
#arena > .player.fullskin:not(.minskin) > .hp.textstyle { justify-content: center; gap: 2px;
	font: 700 12px/12px "Noto Serif CJK SC", serif !important; color: #ffe6a6 !important; text-shadow: 0 1px 2px #000 !important; text-align: center; }
/* 手牌数（名字条最下方竖长方形） */
#arena > .player.fullskin:not(.minskin) > .count {
	left: 3.2% !important; top: auto !important; bottom: 1.6% !important; width: 8.6% !important; height: 7.5% !important; z-index: 3;
	border-radius: 3px !important; background: #1a140e !important; border: 1.5px solid #deb464 !important; color: #faecc8 !important;
	font: 700 12px/13px serif !important; display: flex !important; align-items: center; justify-content: center; box-shadow: none !important;
}
/* 装备条：固定四个槽位（武器、防具、−1马、+1马） */
#arena > .player.fullskin:not(.minskin) > .equips {
	left: 14.5% !important; top: auto !important; bottom: 1.2% !important; width: 72.5% !important; height: 38% !important;
	z-index: 3; display: block !important;
}
#arena > .player.fullskin:not(.minskin) > .equips > .card {
	position: absolute !important; left: 0 !important; width: 100% !important; height: 23% !important; margin: 0 !important;
	background: #1e1a18 !important; border: 1px solid #c47c3e !important; border-radius: 3px !important;
	box-shadow: none !important; transform: none !important;
}
#arena > .player.fullskin:not(.minskin) > .equips > .card.equip1 { top: 0 !important; }
#arena > .player.fullskin:not(.minskin) > .equips > .card.equip2 { top: 25.6% !important; }
#arena > .player.fullskin:not(.minskin) > .equips > .card.equip4 { top: 51.2% !important; }
#arena > .player.fullskin:not(.minskin) > .equips > .card.equip3 { top: 76.8% !important; }
#arena > .player.fullskin:not(.minskin) > .equips > .card.equip5 { display: none !important; }
#arena > .player.fullskin:not(.minskin) > .equips > .card > .image,
#arena > .player.fullskin:not(.minskin) > .equips > .card > .background,
#arena > .player.fullskin:not(.minskin) > .equips > .card > .name2,
#arena > .player.fullskin:not(.minskin) > .equips > .card > .intro { display: none !important; }
#arena > .player.fullskin:not(.minskin) > .equips > .card > .name {
	display: block !important; position: absolute; left: 4px; top: 0; width: auto !important; height: 100%; writing-mode: horizontal-tb;
	font: 700 10px/15px "Noto Serif CJK SC", serif !important; color: #f5e8cd !important; text-shadow: none !important; white-space: nowrap; background: none !important; padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important;
}
#arena > .player.fullskin:not(.minskin) > .equips > .card > .info {
	position: absolute; left: auto !important; right: 3px !important; top: 0 !important; height: 100%;
	font: 700 10px/16px serif !important; color: #ece2d2 !important; transform: none !important;
}
#arena > .player.fullskin:not(.minskin) > .equips > .card > .info.red { color: #ff6a5e !important; }
#arena > .player.fullskin:not(.minskin) > .equips > .card > .range {
	display: none !important;
}
/* 判定区：天兆小紫标 */
#arena > .player.fullskin:not(.minskin) > .judges { left: 16% !important; top: 3% !important; z-index: 4; }
#arena > .player.fullskin > .judges > .card { width: 22px !important; height: 22px !important; border-radius: 50% !important; overflow: hidden; }
#arena > .player.fullskin > .judges > .card > * { display: none !important; }
#arena > .player.fullskin > .judges > .card[data-card-name="shandian"] { background: url(image/qx/omen-damocles.png) center/100% !important; }
#arena > .player.fullskin > .judges > .card[data-card-name="lebu"] { background: url(image/qx/omen-lotus.png) center/100% !important; }
#arena > .player.fullskin > .judges > .card[data-card-name="bingliang"] { background: url(image/qx/omen-blockade.png) center/100% !important; }
/* 身份标记菜单 */
.qx-idmenu { position: fixed; z-index: 99999; display: flex; gap: 4px; padding: 5px; border-radius: 8px;
	background: rgba(20,16,12,.94); border: 1px solid #c9a25a; width: auto; height: auto; box-shadow: 0 4px 14px rgba(0,0,0,.5); }
.qx-idmenu > div { position: relative !important; flex: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; background: center/100% no-repeat; }
.qx-idmenu > div:hover { outline: 2px solid #ffd678; }
.qx-idmenu > .x { background-image: url(image/qx/badge-cancel.png); }
/* ===== 桌面背景：用自己的星图 ===== */
body > .background, #window > .background, div.background { background: #0d1220 url(image/qx/table-bg.jpg) center/cover no-repeat !important; }
/* 署名 */
.qx-credit { position: fixed; right: 8px; bottom: 4px; z-index: 5; font: 11px sans-serif; color: rgba(240,225,190,.55); }
.qx-credit a { color: inherit; }
/* ===== 自己的面板：装备栏在左、武将在右 ===== */
#arena > .player.qx-me { margin-left: 128px !important; }
#arena #handcards1 { margin-left: 162px !important; }
#arena > .player.qx-me.fullskin:not(.minskin) > .equips, #arena > .player.qx-me > .qx-slots {
	left: -85% !important; top: 0 !important; bottom: auto !important; width: 80% !important; height: 100% !important; transform: none !important;
}
#arena > .player.qx-me > .qx-slots { position: absolute; z-index: 2; pointer-events: none; }
#arena > .player.qx-me > .qx-slots > div, #arena > .player.qx-me.fullskin:not(.minskin) > .equips > .card {
	height: 23% !important; border-radius: 5px !important;
}
#arena > .player.qx-me > .qx-slots > div {
	position: absolute; left: 0; width: 100%; box-sizing: border-box; border: 1px dashed rgba(222,180,100,.45);
	background: rgba(24,20,16,.55); color: rgba(240,220,180,.45); font: 600 12px/44px "Noto Serif CJK SC", serif; text-align: center;
}
#arena > .player.qx-me > .qx-slots > div:nth-child(1) { top: 0; }
#arena > .player.qx-me > .qx-slots > div:nth-child(2) { top: 25.6%; }
#arena > .player.qx-me > .qx-slots > div:nth-child(3) { top: 51.2%; }
#arena > .player.qx-me > .qx-slots > div:nth-child(4) { top: 76.8%; }
#arena > .player.qx-me.fullskin:not(.minskin) > .equips > .card > .name { font-size: 13px !important; line-height: 44px !important; left: 8px; }
#arena > .player.qx-me.fullskin:not(.minskin) > .equips > .card > .info { font-size: 12px !important; line-height: 44px !important; right: 6px !important; }
/* 装备技能：可发动时发光，点下后右移并有两道顺时针流光 */
@property --qxa { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@keyframes qxspin { to { --qxa: 360deg; } }
#arena > .player.fullskin:not(.minskin) > .equips > .card.qx-ready { cursor: pointer; border-color: #ffd678 !important; box-shadow: 0 0 6px rgba(255,214,120,.75) !important; }
#arena > .player.fullskin:not(.minskin) > .equips > .card.qx-active { transform: translateX(10px) !important; transition: transform .18s ease-out; }
#arena > .player.fullskin:not(.minskin) > .equips > .card.qx-active {
	border: 2px solid transparent !important; animation: qxspin 1.3s linear infinite;
	background: linear-gradient(#2a221c, #2a221c) padding-box,
		conic-gradient(from var(--qxa), #6b4a22 0 16%, #fff4c0 24%, #6b4a22 32% 66%, #fff4c0 74%, #6b4a22 82%) border-box !important;
}
`;
const MARKS = [["zhong", "keeper"], ["fan", "insurgent"], ["nei", "schemer"]];
function openIdMenu(ui2, player, node, ev) {
  document.querySelectorAll(".qx-idmenu").forEach((m2) => m2.remove());
  const m = document.createElement("div");
  m.className = "qx-idmenu";
  for (const [k, f] of MARKS) {
    const b = document.createElement("div");
    b.style.backgroundImage = `url(image/qx/badge-${f}.png)`;
    b.onclick = (e) => {
      e.stopPropagation();
      node.dataset.color = k;
      node.dataset.qxMark = k;
      m.remove();
    };
    m.appendChild(b);
  }
  const x = document.createElement("div");
  x.className = "x";
  x.onclick = (e) => {
    e.stopPropagation();
    delete node.dataset.color;
    delete node.dataset.qxMark;
    m.remove();
  };
  m.appendChild(x);
  const r = node.getBoundingClientRect();
  m.style.left = Math.max(4, Math.min(innerWidth - 150, r.left - 50)) + "px";
  m.style.top = r.bottom + 4 + "px";
  document.body.appendChild(m);
  setTimeout(() => document.addEventListener("click", () => m.remove(), { once: true }), 0);
}
function installTheme(lib2, game2, ui2, get2, _status2) {
  const style = document.createElement("style");
  style.id = "qx-theme";
  style.textContent = CSS;
  document.head.appendChild(style);
  const tag = () => {
    for (const p of game2.players.concat(game2.dead)) {
      if (p.group && p.dataset.qxGroup !== p.group) p.dataset.qxGroup = p.group;
      if (!p.querySelector(":scope > .qx-frame")) {
        const f = document.createElement("div");
        f.className = "qx-frame";
        p.appendChild(f);
        const e = document.createElement("div");
        e.className = "qx-emblem";
        p.appendChild(e);
      }
    }
  };
  window.QX_identityMenu = function(e) {
    const id = this, p = id.parentNode;
    _status_click(e);
    if (p === game2.me || p.identityShown || p.isZhu) return;
    openIdMenu(ui2, p, id);
  };
  const SLOT = ["武器", "防具", "−1 坐骑", "+1 坐骑"];
  const meTick = () => {
    for (const p of game2.players.concat(game2.dead)) {
      const isMe = p === game2.me;
      p.classList.toggle("qx-me", isMe);
      let sl = p.querySelector(":scope > .qx-slots");
      if (isMe && !sl) {
        sl = document.createElement("div");
        sl.className = "qx-slots";
        for (const t of SLOT) {
          const d = document.createElement("div");
          d.textContent = t;
          sl.appendChild(d);
        }
        p.appendChild(sl);
      }
    }
    const ctrls = [ui2.skills, ui2.skills2, ui2.skills3].filter((c) => c && c.style.display != "none");
    const skills2 = ctrls.flatMap((c) => c.skills || []);
    const active = _status2.event && _status2.event.skill;
    if (!game2.me) return;
    for (const c of game2.me.querySelectorAll(":scope > .equips > .card")) {
      const info = lib2.card[c.name] || {};
      const own = (info.skills || []).filter((s) => skills2.includes(s) || s === active);
      c.qxSkill = own.find((s) => skills2.includes(s));
      c.classList.toggle("qx-ready", !!c.qxSkill && active !== c.qxSkill);
      c.classList.toggle("qx-active", !!active && (info.skills || []).includes(active));
      for (const ct of ctrls) for (const b of ct.childNodes) if ((info.skills || []).includes(b.link)) b.style.display = "none";
    }
  };
  setInterval(meTick, 150);
  if (!document.querySelector(".qx-credit")) {
    const cr = document.createElement("div");
    cr.className = "qx-credit";
    cr.innerHTML = '基于<a href="https://github.com/libnoname/noname" target="_blank">无名杀</a>（GPL-3.0）· <a href="https://github.com/catchyhand/catchyhand.github.io/tree/main/hall-of-ages-src" target="_blank">源码</a>';
    document.body.appendChild(cr);
  }
  document.addEventListener("click", (ev) => {
    const c = ev.target.closest && ev.target.closest("#arena > .player > .equips > .card");
    if (!c || !game2.me || !game2.me.contains(c)) return;
    const sk = c.qxSkill || c.classList.contains("qx-active") && _status2.event.skill;
    if (!sk) return;
    const b = [ui2.skills, ui2.skills2, ui2.skills3].filter(Boolean).flatMap((ct) => [...ct.childNodes]).find((x) => x.link === sk);
    if (!b) return;
    ev.stopPropagation();
    ev.preventDefault();
    if (c.classList.contains("qx-active")) {
      ui2.click.cancel();
      return;
    }
    ui2.click.skill.call(b, sk);
  }, true);
  function _status_click(e) {
    if (e && e.stopPropagation) e.stopPropagation();
  }
  setInterval(tag, 500);
}
window.QX = { lib, game, ui, get, ai, _status };
lib.config.new_tutorial = true;
game.showChangeLog = function() {
};
document.title = "群星议会 The Hall of Ages";
try {
  const mc = lib.config.mode_config.identity = lib.config.mode_config.identity || {};
  Object.assign(mc, { choice_zhu: 8, choice_zhong: 5, choice_fan: 5, choice_nei: 5, free_choose: false, change_choice: false });
} catch (e) {
}
const characters = {
  "qx_alexander": {
    "sex": "male",
    "group": "shu",
    "hp": 4,
    "skills": [
      "qx_campaign",
      "qx_gordian",
      "qx_rally"
    ],
    "img": "image/character/qx_alexander.jpg"
  },
  "qx_caesar": {
    "sex": "male",
    "group": "shu",
    "hp": 4,
    "skills": [
      "qx_rubicon",
      "qx_vici",
      "qx_rally"
    ],
    "img": "image/character/qx_caesar.jpg"
  },
  "qx_hannibal": {
    "sex": "male",
    "group": "shu",
    "hp": 4,
    "skills": [
      "qx_alps",
      "qx_cannae",
      "qx_rally"
    ],
    "img": "image/character/qx_hannibal.jpg"
  },
  "qx_scipio": {
    "sex": "male",
    "group": "shu",
    "hp": 4,
    "skills": [
      "qx_divert",
      "qx_zama",
      "qx_rally"
    ],
    "img": "image/character/qx_scipio.jpg"
  },
  "qx_leonidas": {
    "sex": "male",
    "group": "shu",
    "hp": 4,
    "skills": [
      "qx_narrows",
      "qx_defiance",
      "qx_rally"
    ],
    "img": "image/character/qx_leonidas.jpg"
  },
  "qx_spartacus": {
    "sex": "male",
    "group": "shu",
    "hp": 4,
    "skills": [
      "qx_unchain",
      "qx_comrades",
      "qx_rally"
    ],
    "img": "image/character/qx_spartacus.jpg"
  },
  "qx_boudica": {
    "sex": "female",
    "group": "shu",
    "hp": 4,
    "skills": [
      "qx_chariot",
      "qx_vengeance",
      "qx_rally"
    ],
    "img": "image/character/qx_boudica.jpg"
  },
  "qx_cleopatra": {
    "sex": "female",
    "group": "shu",
    "hp": 3,
    "skills": [
      "qx_allure",
      "qx_pearl",
      "qx_rally"
    ],
    "img": "image/character/qx_cleopatra.jpg"
  },
  "qx_archimedes": {
    "sex": "male",
    "group": "shu",
    "hp": 3,
    "skills": [
      "qx_lever",
      "qx_mirror",
      "qx_rally"
    ],
    "img": "image/character/qx_archimedes.jpg"
  },
  "qx_hypatia": {
    "sex": "female",
    "group": "shu",
    "hp": 3,
    "skills": [
      "qx_lecture",
      "qx_proof",
      "qx_rally"
    ],
    "img": "image/character/qx_hypatia.jpg"
  },
  "qx_charlemagne": {
    "sex": "male",
    "group": "wei",
    "hp": 4,
    "skills": [
      "qx_anoint",
      "qx_paladins",
      "qx_escort"
    ],
    "img": "image/character/qx_charlemagne.jpg"
  },
  "qx_joan": {
    "sex": "female",
    "group": "wei",
    "hp": 3,
    "skills": [
      "qx_calling",
      "qx_martyr",
      "qx_escort"
    ],
    "img": "image/character/qx_joan.jpg"
  },
  "qx_richard": {
    "sex": "male",
    "group": "wei",
    "hp": 4,
    "skills": [
      "qx_valiant",
      "qx_ransom",
      "qx_escort"
    ],
    "img": "image/character/qx_richard.jpg"
  },
  "qx_elcid": {
    "sex": "male",
    "group": "wei",
    "hp": 4,
    "skills": [
      "qx_triumph",
      "qx_undying",
      "qx_escort"
    ],
    "img": "image/character/qx_elcid.jpg"
  },
  "qx_william": {
    "sex": "male",
    "group": "wei",
    "hp": 4,
    "skills": [
      "qx_retreat",
      "qx_domesday",
      "qx_escort"
    ],
    "img": "image/character/qx_william.jpg"
  },
  "qx_eleanor": {
    "sex": "female",
    "group": "wei",
    "hp": 3,
    "skills": [
      "qx_alliance",
      "qx_kingmaker",
      "qx_escort"
    ],
    "img": "image/character/qx_eleanor.jpg"
  },
  "qx_wallace": {
    "sex": "male",
    "group": "wei",
    "hp": 4,
    "skills": [
      "qx_schiltron",
      "qx_freedom",
      "qx_escort"
    ],
    "img": "image/character/qx_wallace.jpg"
  },
  "qx_marcopolo": {
    "sex": "male",
    "group": "wei",
    "hp": 3,
    "skills": [
      "qx_journal",
      "qx_trade",
      "qx_escort"
    ],
    "img": "image/character/qx_marcopolo.jpg"
  },
  "qx_dante": {
    "sex": "male",
    "group": "wei",
    "hp": 3,
    "skills": [
      "qx_redemption",
      "qx_exile",
      "qx_escort"
    ],
    "img": "image/character/qx_dante.jpg"
  },
  "qx_barbarossa": {
    "sex": "male",
    "group": "wei",
    "hp": 4,
    "skills": [
      "qx_knights",
      "qx_slumber",
      "qx_escort"
    ],
    "img": "image/character/qx_barbarossa.jpg"
  },
  "qx_elizabeth": {
    "sex": "female",
    "group": "wu",
    "hp": 3,
    "skills": [
      "qx_seapower",
      "qx_mantle",
      "qx_patron"
    ],
    "img": "image/character/qx_elizabeth.jpg"
  },
  "qx_davinci": {
    "sex": "male",
    "group": "wu",
    "hp": 3,
    "skills": [
      "qx_codex",
      "qx_invert",
      "qx_patron"
    ],
    "img": "image/character/qx_davinci.jpg"
  },
  "qx_machiavelli": {
    "sex": "male",
    "group": "wu",
    "hp": 3,
    "skills": [
      "qx_scheme",
      "qx_sophist",
      "qx_patron"
    ],
    "img": "image/character/qx_machiavelli.jpg"
  },
  "qx_shakespeare": {
    "sex": "male",
    "group": "wu",
    "hp": 3,
    "skills": [
      "qx_soliloquy",
      "qx_tragedy",
      "qx_patron"
    ],
    "img": "image/character/qx_shakespeare.jpg"
  },
  "qx_galileo": {
    "sex": "male",
    "group": "wu",
    "hp": 3,
    "skills": [
      "qx_telescope",
      "qx_eppur",
      "qx_patron"
    ],
    "img": "image/character/qx_galileo.jpg"
  },
  "qx_michelangelo": {
    "sex": "male",
    "group": "wu",
    "hp": 3,
    "skills": [
      "qx_chisel",
      "qx_david",
      "qx_patron"
    ],
    "img": "image/character/qx_michelangelo.jpg"
  },
  "qx_drake": {
    "sex": "male",
    "group": "wu",
    "hp": 4,
    "skills": [
      "qx_plunder",
      "qx_fireship",
      "qx_patron"
    ],
    "img": "image/character/qx_drake.jpg"
  },
  "qx_gustavus": {
    "sex": "male",
    "group": "wu",
    "hp": 4,
    "skills": [
      "qx_volley",
      "qx_reform",
      "qx_patron"
    ],
    "img": "image/character/qx_gustavus.jpg"
  },
  "qx_newton": {
    "sex": "male",
    "group": "wu",
    "hp": 3,
    "skills": [
      "qx_gravity",
      "qx_laws",
      "qx_patron"
    ],
    "img": "image/character/qx_newton.jpg"
  },
  "qx_catherine": {
    "sex": "female",
    "group": "wu",
    "hp": 4,
    "skills": [
      "qx_enlighten",
      "qx_favor",
      "qx_patron"
    ],
    "img": "image/character/qx_catherine.jpg"
  },
  "qx_napoleon": {
    "sex": "male",
    "group": "qun",
    "hp": 4,
    "skills": [
      "qx_austerlitz",
      "qx_returnx",
      "qx_uprise"
    ],
    "img": "image/character/qx_napoleon.jpg"
  },
  "qx_wellington": {
    "sex": "male",
    "group": "qun",
    "hp": 4,
    "skills": [
      "qx_square",
      "qx_nemesis",
      "qx_uprise"
    ],
    "img": "image/character/qx_wellington.jpg"
  },
  "qx_lincoln": {
    "sex": "male",
    "group": "qun",
    "hp": 4,
    "skills": [
      "qx_emancipate",
      "qx_address",
      "qx_uprise"
    ],
    "img": "image/character/qx_lincoln.jpg"
  },
  "qx_bolivar": {
    "sex": "male",
    "group": "qun",
    "hp": 4,
    "skills": [
      "qx_founder",
      "qx_andes",
      "qx_uprise"
    ],
    "img": "image/character/qx_bolivar.jpg"
  },
  "qx_nightingale": {
    "sex": "female",
    "group": "qun",
    "hp": 3,
    "skills": [
      "qx_lamp",
      "qx_tend",
      "qx_uprise"
    ],
    "img": "image/character/qx_nightingale.jpg"
  },
  "qx_curie": {
    "sex": "female",
    "group": "qun",
    "hp": 3,
    "skills": [
      "qx_radiate",
      "qx_laurel",
      "qx_uprise"
    ],
    "img": "image/character/qx_curie.jpg"
  },
  "qx_tesla": {
    "sex": "male",
    "group": "qun",
    "hp": 3,
    "skills": [
      "qx_current",
      "qx_coil",
      "qx_uprise"
    ],
    "img": "image/character/qx_tesla.jpg"
  },
  "qx_beethoven": {
    "sex": "male",
    "group": "qun",
    "hp": 3,
    "skills": [
      "qx_destiny",
      "qx_joy",
      "qx_uprise"
    ],
    "img": "image/character/qx_beethoven.jpg"
  },
  "qx_darwin": {
    "sex": "male",
    "group": "qun",
    "hp": 3,
    "skills": [
      "qx_evolve",
      "qx_fittest",
      "qx_uprise"
    ],
    "img": "image/character/qx_darwin.jpg"
  },
  "qx_tubman": {
    "sex": "female",
    "group": "qun",
    "hp": 3,
    "skills": [
      "qx_railroad",
      "qx_neverlost",
      "qx_uprise"
    ],
    "img": "image/character/qx_tubman.jpg"
  }
};
const skills = {
  "qx_campaign": {
    "forced": true,
    "locked": true
  },
  "qx_gordian": {},
  "qx_rubicon": {
    "limited": true
  },
  "qx_vici": {},
  "qx_alps": {
    "forced": true,
    "locked": true
  },
  "qx_cannae": {
    "forced": true,
    "locked": true
  },
  "qx_divert": {},
  "qx_zama": {
    "forced": true,
    "locked": true
  },
  "qx_narrows": {
    "forced": true,
    "locked": true
  },
  "qx_defiance": {},
  "qx_unchain": {},
  "qx_comrades": {
    "forced": true,
    "locked": true
  },
  "qx_chariot": {
    "forced": true,
    "locked": true
  },
  "qx_vengeance": {},
  "qx_allure": {},
  "qx_pearl": {},
  "qx_lever": {},
  "qx_mirror": {},
  "qx_lecture": {},
  "qx_proof": {
    "limited": true
  },
  "qx_rally": {
    "zhuSkill": true
  },
  "qx_anoint": {},
  "qx_paladins": {},
  "qx_calling": {},
  "qx_martyr": {
    "limited": true
  },
  "qx_valiant": {
    "forced": true,
    "locked": true
  },
  "qx_ransom": {},
  "qx_triumph": {
    "forced": true,
    "locked": true
  },
  "qx_undying": {
    "limited": true
  },
  "qx_retreat": {},
  "qx_domesday": {},
  "qx_alliance": {},
  "qx_kingmaker": {},
  "qx_schiltron": {},
  "qx_freedom": {},
  "qx_journal": {},
  "qx_trade": {
    "forced": true,
    "locked": true
  },
  "qx_redemption": {},
  "qx_exile": {},
  "qx_knights": {
    "forced": true,
    "locked": true
  },
  "qx_slumber": {},
  "qx_resurgence": {},
  "qx_escort": {
    "zhuSkill": true
  },
  "qx_seapower": {
    "forced": true,
    "locked": true
  },
  "qx_mantle": {},
  "qx_codex": {},
  "qx_invert": {},
  "qx_scheme": {},
  "qx_sophist": {},
  "qx_soliloquy": {
    "forced": true,
    "locked": true
  },
  "qx_tragedy": {},
  "qx_telescope": {},
  "qx_eppur": {
    "forced": true,
    "locked": true
  },
  "qx_chisel": {
    "forced": true,
    "locked": true
  },
  "qx_david": {
    "forced": true,
    "locked": true
  },
  "qx_plunder": {},
  "qx_fireship": {},
  "qx_volley": {},
  "qx_reform": {
    "forced": true,
    "locked": true
  },
  "qx_gravity": {
    "forced": true,
    "locked": true
  },
  "qx_laws": {
    "forced": true,
    "locked": true
  },
  "qx_enlighten": {},
  "qx_favor": {
    "limited": true
  },
  "qx_patron": {
    "zhuSkill": true
  },
  "qx_austerlitz": {},
  "qx_returnx": {
    "forced": true,
    "locked": true
  },
  "qx_square": {},
  "qx_nemesis": {},
  "qx_emancipate": {},
  "qx_address": {},
  "qx_founder": {
    "forced": true,
    "locked": true
  },
  "qx_andes": {
    "forced": true,
    "locked": true
  },
  "qx_lamp": {},
  "qx_tend": {
    "limited": true
  },
  "qx_radiate": {
    "forced": true,
    "locked": true
  },
  "qx_laurel": {},
  "qx_current": {
    "forced": true,
    "locked": true
  },
  "qx_coil": {},
  "qx_destiny": {
    "forced": true,
    "locked": true
  },
  "qx_joy": {},
  "qx_evolve": {
    "forced": true,
    "locked": true
  },
  "qx_fittest": {
    "forced": true,
    "locked": true
  },
  "qx_railroad": {},
  "qx_neverlost": {
    "forced": true,
    "locked": true
  },
  "qx_uprise": {
    "zhuSkill": true
  },
  "qx_uprisegive": {}
};
const translates = {
  "qx_alexander": "亚历山大",
  "qx_alexander_prefix": "",
  "qx_caesar": "凯撒",
  "qx_caesar_prefix": "",
  "qx_hannibal": "汉尼拔",
  "qx_hannibal_prefix": "",
  "qx_scipio": "西庇阿",
  "qx_scipio_prefix": "",
  "qx_leonidas": "列奥尼达",
  "qx_leonidas_prefix": "",
  "qx_spartacus": "斯巴达克斯",
  "qx_spartacus_prefix": "",
  "qx_boudica": "布狄卡",
  "qx_boudica_prefix": "",
  "qx_cleopatra": "克娄巴特拉",
  "qx_cleopatra_prefix": "",
  "qx_archimedes": "阿基米德",
  "qx_archimedes_prefix": "",
  "qx_hypatia": "希帕提娅",
  "qx_hypatia_prefix": "",
  "qx_charlemagne": "查理曼",
  "qx_charlemagne_prefix": "",
  "qx_joan": "贞德",
  "qx_joan_prefix": "",
  "qx_richard": "理查一世",
  "qx_richard_prefix": "",
  "qx_elcid": "熙德",
  "qx_elcid_prefix": "",
  "qx_william": "威廉一世",
  "qx_william_prefix": "",
  "qx_eleanor": "埃莉诺",
  "qx_eleanor_prefix": "",
  "qx_wallace": "华莱士",
  "qx_wallace_prefix": "",
  "qx_marcopolo": "马可·波罗",
  "qx_marcopolo_prefix": "",
  "qx_dante": "但丁",
  "qx_dante_prefix": "",
  "qx_barbarossa": "腓特烈一世",
  "qx_barbarossa_prefix": "",
  "qx_elizabeth": "伊丽莎白一世",
  "qx_elizabeth_prefix": "",
  "qx_davinci": "达·芬奇",
  "qx_davinci_prefix": "",
  "qx_machiavelli": "马基雅维利",
  "qx_machiavelli_prefix": "",
  "qx_shakespeare": "莎士比亚",
  "qx_shakespeare_prefix": "",
  "qx_galileo": "伽利略",
  "qx_galileo_prefix": "",
  "qx_michelangelo": "米开朗基罗",
  "qx_michelangelo_prefix": "",
  "qx_drake": "德雷克",
  "qx_drake_prefix": "",
  "qx_gustavus": "古斯塔夫",
  "qx_gustavus_prefix": "",
  "qx_newton": "牛顿",
  "qx_newton_prefix": "",
  "qx_catherine": "叶卡捷琳娜",
  "qx_catherine_prefix": "",
  "qx_napoleon": "拿破仑",
  "qx_napoleon_prefix": "",
  "qx_wellington": "威灵顿",
  "qx_wellington_prefix": "",
  "qx_lincoln": "林肯",
  "qx_lincoln_prefix": "",
  "qx_bolivar": "玻利瓦尔",
  "qx_bolivar_prefix": "",
  "qx_nightingale": "南丁格尔",
  "qx_nightingale_prefix": "",
  "qx_curie": "居里夫人",
  "qx_curie_prefix": "",
  "qx_tesla": "特斯拉",
  "qx_tesla_prefix": "",
  "qx_beethoven": "贝多芬",
  "qx_beethoven_prefix": "",
  "qx_darwin": "达尔文",
  "qx_darwin_prefix": "",
  "qx_tubman": "塔布曼",
  "qx_tubman_prefix": "",
  "qx_campaign": "远征",
  "qx_campaign_info": "锁定技，当你对其他角色造成伤害后，你令你与其的距离 −1。",
  "qx_gordian": "断结",
  "qx_gordian_info": "当你使用杀指定目标后，你可以选择一项：1. 此杀不可被闪响应；2. 此杀的伤害 +1。若你与所有其他角色的距离均为 1，则改为依次执行两项。",
  "qx_rubicon": "渡河",
  "qx_rubicon_info": "限定技，当你使用杀造成伤害后，若你的手牌数大于体力上限，你可以将体力上限调整至与你的手牌数相同，然后回复体力至体力上限。",
  "qx_vici": "三捷",
  "qx_vici_info": "出牌阶段限一次，你可以减 1 点体力上限并摸一张牌，然后视为使用杀。当你以此法造成伤害时，你令该技能视为未发动过。",
  "qx_alps": "越山",
  "qx_alps_info": "锁定技，你使用的决斗和点数为奇数的杀对其他角色造成的伤害为 2 点。",
  "qx_cannae": "坎尼",
  "qx_cannae_info": "锁定技，你使用杀可以指定至多三名相邻的角色为目标。",
  "qx_divert": "移师",
  "qx_divert_info": "当你受到杀造成的伤害后，你可以视为对伤害来源使用一张无距离限制的杀。若此杀造成了伤害，你回复 1 点体力。",
  "qx_zama": "扎马",
  "qx_zama_info": "锁定技，当你成为杀或谋略牌的目标时，若此牌指定了不止一个目标，则其对你无效，然后你摸一张牌。",
  "qx_narrows": "隘口",
  "qx_narrows_info": "锁定技，当你受到伤害后，直到本回合结束，所有其他角色使用的杀和谋略牌对你无效。",
  "qx_defiance": "拒降",
  "qx_defiance_info": "其他角色的出牌阶段开始时，你可以摸 X 张牌，然后令其视为对你使用杀。若此杀对你造成了伤害，除非其弃置 X 张牌，否则其结束此出牌阶段（X 为你已损失的体力，且至多为 5）。",
  "qx_unchain": "挣锁",
  "qx_unchain_info": "每当你受到 1 点伤害后，你可以摸两张牌，然后将这些牌任意分配给任意角色。",
  "qx_comrades": "同袍",
  "qx_comrades_info": "锁定技，体力值大于你的角色不能响应你对其使用的杀。你使用杀的次数上限 +X（X 为你已损失的体力值）。",
  "qx_chariot": "战车",
  "qx_chariot_info": "锁定技，游戏开始时，你从牌堆中随机装备 −1 马和 +1 马各一匹。你的坐骑不能被其他角色获得或弃置。",
  "qx_vengeance": "血誓",
  "qx_vengeance_info": "当你受到伤害后，你可以进行一次天意判定：若结果不为红桃，伤害来源须选择一项：弃置一半的手牌（向上取整且至少为 2），或受到你造成的随机 1~2 点伤害。",
  "qx_allure": "倾国",
  "qx_allure_info": "出牌阶段限 X+1 次，你可以弃置一张牌，令一名其他角色视为对另一名其他角色使用一张不能被无懈可击响应的决斗（X 为你已损失的体力值）。",
  "qx_pearl": "明珠",
  "qx_pearl_info": "结束阶段，你可以摸 Y 张牌（Y 为本回合内所有角色体力值变动的次数）。",
  "qx_lever": "杠杆",
  "qx_lever_info": "出牌阶段限一次，你可以选择一名其他角色，将你们的体力值都调整为两者之和的一半（你向上取整，对方向下取整）。",
  "qx_mirror": "镜火",
  "qx_mirror_info": "一名角色的天意牌生效前，你可以打出一张手牌代替之。任意角色的天意牌生效后，你获得之。",
  "qx_lecture": "讲学",
  "qx_lecture_info": "出牌阶段每项限一次：1. 你可以令手牌数大于你的其他角色各交给你一张手牌，然后若你的手牌数为全场唯一最多，你失去 1 点体力；2. 你可以与一名手牌数不大于你的角色交换手牌。",
  "qx_proof": "推演",
  "qx_proof_info": "限定技，出牌阶段，你可以获得所有其他角色的手牌，然后依次交给其他角色各一张牌，直到你的手牌数不为全场唯一最多。",
  "qx_rally": "号令",
  "qx_rally_info": "主公技，当你需要使用或打出杀时，其他古典角色可以替你打出一张杀。",
  "qx_anoint": "圣冠",
  "qx_anoint_info": "出牌阶段限一次，你可以获得所有其他角色各一张手牌。此阶段结束时，你将其中仍在你手里的牌交还原主。",
  "qx_paladins": "圣骑",
  "qx_paladins_info": "你可以将任意黑色牌当闪使用或打出。每当你于回合外使用一张闪时，你摸一张牌。",
  "qx_calling": "圣召",
  "qx_calling_info": "当你受到伤害、失去体力、减体力上限或弃置牌后，你可以令一名其他角色也执行此效果。",
  "qx_martyr": "殉道",
  "qx_martyr_info": "限定技，当你进入濒死状态时，你可以放弃求药，然后令一名其他角色回复 1 点体力并获得【圣召】。",
  "qx_valiant": "狮心",
  "qx_valiant_info": "锁定技，你的手牌上限等于你的体力上限。当你的手牌数小于体力上限时，你不能成为釜底抽薪和探囊取物的目标；当你的手牌数大于体力上限时，你不能成为流连忘返的目标。",
  "qx_ransom": "赎金",
  "qx_ransom_info": "当你受到其他角色造成的伤害时，你可以令其观看你至多三张手牌，然后其选择一项：1. 获得其中一张并防止此伤害；2. 弃置等量的牌。",
  "qx_triumph": "凯旋",
  "qx_triumph_info": "锁定技，当你对距离 2 以内的角色造成伤害时，若你已受伤，你回复 1 点体力，否则你摸一张牌。",
  "qx_undying": "不朽",
  "qx_undying_info": "限定技，当你进入濒死状态时，你可以弃置你区域内的所有牌，将体力回复至 2 点，然后摸三张牌。",
  "qx_retreat": "佯退",
  "qx_retreat_info": "当你即将受到其他角色造成的伤害时，你可以令其摸一张牌，然后与其拼点：若你赢，防止此伤害并获得对方的拼点牌；若你没赢，此伤害改为 1 点，你收回你的拼点牌。",
  "qx_domesday": "清册",
  "qx_domesday_info": "出牌阶段限一次，你可以令一名其他角色观看你的手牌，然后你选择一项：1. 观看其手牌，并可以弃置其中一张黑色牌；2. 观看其身份。",
  "qx_alliance": "联姻",
  "qx_alliance_info": "出牌阶段限一次，你可以弃置两张牌并选择一名已受伤的其他角色，你与其各回复 1 点体力。若你未因此回复体力，你可以令你们各摸一张牌。",
  "qx_kingmaker": "拥立",
  "qx_kingmaker_info": "其他角色的弃牌阶段开始时，你可以交给其至少一张手牌，然后其将超出其体力值数量的手牌交给你。",
  "qx_schiltron": "枪阵",
  "qx_schiltron_info": "你可以将杀当闪、闪当杀使用或打出；若如此做，你可以获得对方的一张手牌。",
  "qx_freedom": "自由",
  "qx_freedom_info": "判定阶段开始时，你可以失去 1 点体力，然后弃置你天兆区里的一张牌。",
  "qx_journal": "行记",
  "qx_journal_info": "出牌阶段限一次，你可以将一张方块手牌当流连忘返对自己使用，然后回复 1 点体力并摸 X 张牌（X 为这张牌的点数）。若你的天兆区里有牌，你使用牌无次数限制。",
  "qx_trade": "通商",
  "qx_trade_info": "锁定技，当你受到伤害时，其他角色各获得你区域内的一张牌，然后你获得其他角色区域内各一张牌。",
  "qx_redemption": "救赎",
  "qx_redemption_info": "回合开始时，你可以选择一名角色并选择一项：1. 令其回复体力至全场唯一最多；2. 令其摸牌至全场唯一最多；3. 令其从牌堆或弃牌堆随机使用军备牌，直到其军备区没有空位；4. 令其获得【救赎】。每项限一次。",
  "qx_exile": "流放",
  "qx_exile_info": "当你受到其他角色造成的伤害后，你可以令一名角色摸 X 张牌并翻面（X 为你已损失的体力值）。",
  "qx_knights": "铁骑",
  "qx_knights_info": "锁定技，你使用的杀须连续使用两张闪才能抵消；与你决斗的另一方每次须连续打出两张杀。",
  "qx_slumber": "山眠",
  "qx_slumber_info": "觉醒技，回合开始时，若你的体力值为 1 或没有手牌，你减 1 点体力上限，回复 1 点体力，摸三张牌，然后失去【山眠】并获得【中兴】。",
  "qx_resurgence": "中兴",
  "qx_resurgence_info": "每项每回合限一次：1. 当你使用杀或决斗对其他角色造成伤害时，你可以令其先失去等量的体力；2. 本回合你使用的下一张杀或决斗可以额外指定一个目标。",
  "qx_escort": "勤王",
  "qx_escort_info": "主公技，当你需要使用或打出闪时，其他中古角色可以替你打出一张闪。",
  "qx_seapower": "海权",
  "qx_seapower_info": "锁定技，每当你使用一张谋略牌后，你摸一张牌。你使用谋略牌无距离限制。",
  "qx_mantle": "斗篷",
  "qx_mantle_info": "你可以将一张黑色牌当无懈可击使用。",
  "qx_codex": "手稿",
  "qx_codex_info": "回合开始时，你可以选择一项：1. 严格递增；2. 严格递减。本回合内你使用牌时，若此牌的点数与之前所有牌的点数均符合所选规律，你摸一张牌。",
  "qx_invert": "镜书",
  "qx_invert_info": "出牌阶段限一次，你可以将一张牌当作你本回合上一张使用的牌使用。",
  "qx_scheme": "权术",
  "qx_scheme_info": "出牌阶段限一次，你可以展示牌堆顶的两张牌并分别交给两名角色（可以包括你），然后视为获得点数较大的牌的角色对另一名角色使用杀；之后你可以视为对其中任意名其他角色使用杀。以此法使用的杀造成伤害后，你获得受伤角色的一张牌。",
  "qx_sophist": "诡辩",
  "qx_sophist_info": "当你成为杀的目标时，你可以弃置一张牌，将此杀转移给你攻击范围内的另一名角色（不能是使用者）。",
  "qx_soliloquy": "独白",
  "qx_soliloquy_info": "锁定技，你使用杀无次数限制。你于出牌阶段内使用的第一张杀伤害 +1 且不能被闪响应；其余的杀被其他角色的闪响应后，其对你造成 1 点伤害。",
  "qx_tragedy": "悲剧",
  "qx_tragedy_info": "一名其他角色死亡时，你可以获得其所有牌和技能。",
  "qx_telescope": "望远",
  "qx_telescope_info": "回合开始时和结束阶段开始时，你可以观看牌堆顶的 X 张牌，并以任意顺序置于牌堆顶或牌堆底（X 为存活角色数，至多为 5）。",
  "qx_eppur": "仍动",
  "qx_eppur_info": "锁定技，你的手牌数不能小于 X+1（X 为你已损失的体力值）。你可以将一张牌按花色当作以下牌使用或打出：黑桃当无懈可击，红桃当药，梅花当闪，方块当火杀。",
  "qx_chisel": "雕琢",
  "qx_chisel_info": "锁定技，摸牌阶段，你放弃摸牌，改为亮出牌堆顶的五张牌，获得其中每种花色各一张，弃置其余的牌。若你第一次以此法获得的牌少于三张，你可以再这样做一次。",
  "qx_david": "大卫",
  "qx_david_info": "锁定技，若你于出牌阶段内没有使用过杀，你跳过本回合的弃牌阶段。",
  "qx_plunder": "劫掠",
  "qx_plunder_info": "你的回合外，其他角色使用红色牌后，你可以对其使用一张无距离限制的杀；此杀造成伤害后，你获得其所有手牌。",
  "qx_fireship": "火船",
  "qx_fireship_info": "出牌阶段限一次，你可以令一名其他角色摸一张牌，然后视为对其使用火攻；若此火攻造成了伤害，你可以对其重复此流程。你使用火攻造成伤害后，摸一张牌。",
  "qx_volley": "齐射",
  "qx_volley_info": "回合开始时，你视为使用万箭齐发。若有角色打出闪响应此牌，回合结束时，你再视为使用一次万箭齐发。",
  "qx_reform": "改革",
  "qx_reform_info": "锁定技，你可以将一张军备牌当任意基本牌使用或打出。你的军备区没有牌时，你受到谋略牌造成的伤害 −1。",
  "qx_gravity": "引力",
  "qx_gravity_info": "锁定技，当你成为其他角色使用的基本牌或谋略牌的目标时，其也成为此牌的目标。",
  "qx_laws": "定律",
  "qx_laws_info": "锁定技，当你于一回合内使用第 3、6、9……张牌时，你可以摸三张牌。",
  "qx_enlighten": "开明",
  "qx_enlighten_info": "出牌阶段开始时和弃牌阶段开始时，你可以摸 X 张牌（X 为你的手牌数）。",
  "qx_favor": "恩赏",
  "qx_favor_info": "限定技，结束阶段开始时，你可以令一名其他角色获得本回合你因弃置而置入弃牌堆的所有牌。",
  "qx_patron": "赞助",
  "qx_patron_info": "主公技，其他文艺角色对你使用药时，你额外回复 1 点体力。",
  "qx_austerlitz": "三皇",
  "qx_austerlitz_info": "当你于出牌阶段内连续使用三张类别不同的牌后，你视为对所有其他角色使用杀。",
  "qx_returnx": "百日",
  "qx_returnx_info": "锁定技，当你进入濒死状态时，你减 1 点体力上限，将体力回复至体力上限，然后对一名角色造成 3−X 点雷电伤害（X 为你的体力上限）。",
  "qx_square": "方阵",
  "qx_square_info": "当你失去一个区域内的所有牌后，你可以对一名角色造成 1 点伤害。",
  "qx_nemesis": "宿敌",
  "qx_nemesis_info": "出牌阶段限一次，你可以选择一名其他角色，弃置一张牌并将你的武将牌翻面，然后获得其所有手牌。此阶段结束时，你交给该角色 X 张牌（X 为其体力值）。",
  "qx_emancipate": "解放",
  "qx_emancipate_info": "锁定技，你跳过判定阶段。出牌阶段限一次，你可以将一名其他角色天兆区里的一张牌移到你的天兆区，然后你与其各回复 1 点体力并摸三张牌。",
  "qx_address": "演说",
  "qx_address_info": "出牌阶段限一次，你可以令两名角色拼点：没赢的一方，你弃置其两张牌；若拼点赢的角色不是你，你摸两张牌。",
  "qx_founder": "建国",
  "qx_founder_info": "锁定技，其他角色的出牌阶段开始时和结束时，若其手牌数不小于你，其交给你一张牌。",
  "qx_andes": "越岭",
  "qx_andes_info": "锁定技，你使用的杀无视目标的护甲。若目标军备区里的牌不少于你，你的杀对其造成的伤害 +1。",
  "qx_lamp": "提灯",
  "qx_lamp_info": "你的回合外，你可以将一张红色牌当药使用。出牌阶段限一次，你可以弃置一张手牌，令一名已受伤的角色回复 1 点体力。",
  "qx_tend": "救护",
  "qx_tend_info": "限定技，当一名角色进入濒死状态时，你可以令其体力上限调整为 3 并回复所有体力，然后其可以从随机三张同时代且不在场的武将牌中选择一张替换其武将。",
  "qx_radiate": "放射",
  "qx_radiate_info": "锁定技，你攻击范围内的其他角色手牌上限 −1。你造成的伤害均视为体力流失。",
  "qx_laurel": "双桂",
  "qx_laurel_info": "出牌阶段限一次，你可以令所有其他角色各展示并交给你一张手牌，然后你可以令交出黑色牌的角色各失去 1 点体力、交出红色牌的角色各回复 1 点体力。",
  "qx_current": "交流",
  "qx_current_info": "锁定技，你受到的雷电伤害均改为回复等量体力。",
  "qx_coil": "线圈",
  "qx_coil_info": "你可以跳过摸牌阶段，令至多 X 名角色横置（X 为你的体力值）；你可以跳过出牌阶段，对一名角色造成 2 点雷电伤害。",
  "qx_destiny": "命运",
  "qx_destiny_info": "锁定技，你的回合开始时，所有其他角色随机展示一张手牌：若黑色牌多，你翻面并失去 1 点体力；若红色牌多，你将体力回复至上限并摸三张牌；若一样多，你获得这些展示的牌。",
  "qx_joy": "欢乐",
  "qx_joy_info": "每回合限一次，当你一次性获得不少于两张牌后，你可以令至多 X 名其他角色各摸一张牌（X 为你的体力值）。",
  "qx_evolve": "演化",
  "qx_evolve_info": "锁定技，你的摸牌阶段摸牌数 +1，出牌阶段使用杀的次数上限 +1。你的药视为杀，你的闪视为酒。",
  "qx_fittest": "适者",
  "qx_fittest_info": "锁定技，你的体力值不能大于 1，你的手牌上限等于你的体力上限。当你进入或脱离濒死状态时，你摸两张牌。",
  "qx_railroad": "暗渡",
  "qx_railroad_info": "当其他角色使用杀指定目标时，你可以获得其一张手牌，然后选择一项未执行过的：1. 此杀不能被闪响应；2. 此杀无效；3. 将此杀的目标改为你；4. 目标于此杀结算后回复 1 点体力。四项都执行过后，重置为都未执行过。",
  "qx_neverlost": "无失",
  "qx_neverlost_info": "锁定技，若你没有手牌，你不能成为杀和决斗的目标。",
  "qx_uprise": "号召",
  "qx_uprise_info": "主公技，其他革新角色的出牌阶段，其可以交给你一张杀或闪（每阶段限一次）。",
  "qx_uprisegive": "号召",
  "qx_uprisegive_info": "出牌阶段限一次，你可以将一张杀或闪交给执笔者。"
};
const CARD_TR = {
  "sha": "杀",
  "shan": "闪",
  "tao": "药",
  "jiu": "酒",
  "juedou": "决斗",
  "juedou_info": "出牌阶段，对一名其他角色使用。由其开始，其与你轮流打出【杀】，首先不打出【杀】的一方受到另一方造成的1点伤害。",
  "guohe": "釜底抽薪",
  "guohe_info": "出牌阶段，对一名区域内有牌的其他角色使用。你弃置其手牌、军备区或天兆区里的一张牌。",
  "shunshou": "探囊取物",
  "shunshou_info": "出牌阶段，对距离为1且区域内有牌的一名其他角色使用。你获得其手牌、军备区或天兆区里的一张牌。",
  "wuzhong": "天赐良机",
  "wuzhong_info": "出牌阶段，对你使用。你摸两张牌。",
  "jiedao": "驱虎吞狼",
  "jiedao_info": "出牌阶段，对一名其他角色使用，并指定其攻击范围内的另一名角色（不能是你）。前者视为对后者使用一张【杀】；若此【杀】没有造成伤害，前者视为对你使用一张【杀】。",
  "nanman": "铁蹄压境",
  "nanman_info": "出牌阶段，对所有其他角色使用。每名目标角色须打出一张【杀】，否则受到你造成的1点伤害。",
  "wanjian": "万箭齐发",
  "wanjian_info": "出牌阶段，对所有其他角色使用。每名目标角色须打出一张【闪】，否则受到你造成的1点伤害。",
  "taoyuan": "休养生息",
  "taoyuan_info": "出牌阶段，对所有角色使用。每名目标角色回复1点体力。",
  "wugu": "联军盛宴",
  "wugu_info": "出牌阶段，对所有角色使用。亮出牌堆顶与存活角色数相同数量的牌，从你开始，每名目标角色依次获得其中一张。",
  "wuxie": "无懈可击",
  "wuxie_info": "一张谋略牌或天兆牌对一名角色生效前，对此牌使用，抵消其对该角色的效果。也可以用来抵消另一张【无懈可击】。",
  "huogong": "火攻",
  "huogong_info": "出牌阶段，对一名有手牌的角色使用（可以是你）。其展示一张手牌，然后你可以弃置一张与之花色相同的手牌，对其造成1点火焰伤害。",
  "tiesuo": "铁索连环",
  "tiesuo_info": "出牌阶段，对一至两名角色使用，横置或重置这些角色。此牌也可以重铸：弃置此牌并摸一张牌。",
  "shandian": "达摩克利斯之剑",
  "shandian_info": "出牌阶段，对你使用，置于你的天兆区。判定阶段进行天意判定：若为黑桃2–9，你受到3点雷电伤害；否则将此牌移至下家的天兆区。被【无懈可击】抵消时同样移至下家。",
  "lebu": "流连忘返",
  "lebu_info": "出牌阶段，对一名其他角色使用，置于其天兆区。其判定阶段进行天意判定：若结果不为红桃，其跳过出牌阶段。",
  "bingliang": "弹尽粮绝",
  "bingliang_info": "出牌阶段，对距离为1的一名其他角色使用，置于其天兆区。其判定阶段进行天意判定：若结果不为梅花，其跳过摸牌阶段。",
  "zhuge": "加特林",
  "zhuge_info": "出牌阶段，你使用【杀】无次数限制。",
  "qinggang": "断钢圣剑",
  "qinggang_info": "锁定技，你使用的【杀】无视目标角色的防具。",
  "cixiong": "双子剑",
  "cixiong_info": "当你使用【杀】指定一名异性角色为目标后，你可以令其选择一项：弃置一张手牌，或令你摸一张牌。",
  "hanbing": "冬将军",
  "hanbing_info": "当你使用【杀】对目标角色造成伤害时，你可以防止此伤害，改为依次弃置其两张牌。",
  "guding": "慈悲短剑",
  "guding_info": "锁定技，当你使用【杀】对目标角色造成伤害时，若其没有手牌，此伤害+1。",
  "qinglong": "狂战士斧",
  "qinglong_info": "当你使用的【杀】被【闪】抵消后，你可以对相同的目标再使用一张【杀】。",
  "zhangba": "萨里沙长矛",
  "zhangba_info": "你可以将两张手牌当【杀】使用或打出。",
  "guanshi": "攻城锤",
  "guanshi_info": "当你使用的【杀】被【闪】抵消后，你可以弃置两张牌，令此【杀】依然造成伤害。",
  "fangtian": "三叉戟",
  "fangtian_info": "当你使用【杀】时，若此【杀】是你最后的手牌，你可以额外指定至多两名目标。",
  "zhuque": "火绳枪",
  "zhuque_info": "你可以将普通【杀】当【火杀】使用。",
  "qilin": "英格兰长弓",
  "qilin_info": "当你使用【杀】对目标角色造成伤害时，你可以弃置其军备区里的一张坐骑牌。",
  "bagua": "雅典娜之盾",
  "bagua_info": "当你需要使用或打出【闪】时，你可以进行天意判定：若结果为红色，视为你使用或打出了一张【闪】。",
  "renwang": "龟甲阵",
  "renwang_info": "锁定技，黑色【杀】对你无效。",
  "tengjia": "亚麻胸甲",
  "tengjia_info": "锁定技，普通【杀】、【铁蹄压境】和【万箭齐发】对你无效。你受到的火焰伤害+1。",
  "baiyin": "涅墨亚狮皮",
  "baiyin_info": "锁定技，你每次受到的伤害至多为1点。当你失去军备区里的此牌时，你回复1点体力。",
  "jueying": "布塞弗勒斯",
  "jueying_info": "其他角色计算与你的距离+1。",
  "dilu": "巴别卡",
  "dilu_info": "其他角色计算与你的距离+1。",
  "zhuahuang": "马伦戈",
  "zhuahuang_info": "其他角色计算与你的距离+1。",
  "hualiu": "哥本哈根",
  "hualiu_info": "其他角色计算与你的距离+1。",
  "chitu": "珀伽索斯",
  "chitu_info": "你计算与其他角色的距离−1。",
  "dawan": "斯雷普尼尔",
  "dawan_info": "你计算与其他角色的距离−1。",
  "zixin": "阿里翁",
  "zixin_info": "你计算与其他角色的距离−1。",
  "huosha": "火杀",
  "leisha": "雷杀"
};
const GROUP_TR = { "shu": "古", "wei": "中", "wu": "文", "qun": "新", "shu2": "古典", "wei2": "中古", "wu2": "文艺", "qun2": "革新", "group_shu": "古典阵营", "group_wei": "中古阵营", "group_wu": "文艺阵营", "group_qun": "革新阵营", "group_shu_bg": "古", "group_wei_bg": "中", "group_wu_bg": "文", "group_qun_bg": "新" };
const IDENT_TR = { "zhu": "执", "zhong": "护", "fan": "焚", "nei": "伏", "zhu2": "执笔者", "zhong2": "护卷人", "fan2": "焚卷人", "nei2": "伏笔者", "identity_zhu": "执笔者", "identity_zhong": "护卷人", "identity_fan": "焚卷人", "identity_nei": "伏笔者" };
lib.arenaReady.push(() => {
  Object.assign(lib.translate, CARD_TR, GROUP_TR, IDENT_TR);
  installTheme(lib, game, ui, get, _status);
  if (!document.getElementById("qx-frame")) {
    const st = document.createElement("style");
    st.textContent = "#window{opacity:0!important;pointer-events:none!important}#qx-frame{position:fixed;inset:0;width:100%;height:100%;border:0;z-index:100000;background:#14120e}.qx-credit{display:none!important}";
    document.head.appendChild(st);
    window.QX_NN = { lib, game, ui, get, ai, _status, doc: document };
    const fr = document.createElement("iframe");
    fr.id = "qx-frame";
    fr.src = "qx/ui.html";
    fr.allow = "fullscreen; autoplay";
    document.body.appendChild(fr);
  }
});
Object.assign(lib.translate, CARD_TR, GROUP_TR, IDENT_TR);
{
  let only = null;
  try {
    only = localStorage.getItem("qxtest");
  } catch (e) {
  }
  if (only) {
    const G = { classical: "shu", medieval: "wei", renaissance: "wu", revolution: "qun" }[only];
    const list = G ? null : only.split(",").map((s) => s.startsWith("qx_") ? s : "qx_" + s);
    for (const k of Object.keys(characters)) if (G ? characters[k].group !== G : !list.includes(k)) delete characters[k];
  }
}
game.import("character", function() {
  return {
    name: "qunxing",
    connect: true,
    character: characters,
    characterSort: { qunxing: { qx_classical: ["qx_alexander", "qx_caesar", "qx_hannibal", "qx_scipio", "qx_leonidas", "qx_spartacus", "qx_boudica", "qx_cleopatra", "qx_archimedes", "qx_hypatia"], qx_medieval: ["qx_charlemagne", "qx_joan", "qx_richard", "qx_elcid", "qx_william", "qx_eleanor", "qx_wallace", "qx_marcopolo", "qx_dante", "qx_barbarossa"], qx_renaissance: ["qx_elizabeth", "qx_davinci", "qx_machiavelli", "qx_shakespeare", "qx_galileo", "qx_michelangelo", "qx_drake", "qx_gustavus", "qx_newton", "qx_catherine"], qx_revolution: ["qx_napoleon", "qx_wellington", "qx_lincoln", "qx_bolivar", "qx_nightingale", "qx_curie", "qx_tesla", "qx_beethoven", "qx_darwin", "qx_tubman"] } },
    skill: { ...skills, ...skills$4, ...skills$3, ...skills$2, ...skills$1 },
    translate: { ...translates, qunxing: "群星议会", qx_classical: "古典", qx_medieval: "中古", qx_renaissance: "文艺", qx_revolution: "革新" }
  };
});
