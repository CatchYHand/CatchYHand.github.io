/* 群星议会 · 界面桥（qx-bridge.js）
 * 规则和 AI 由无名杀负责；画面完全用 qx-ui.js（上个会话定稿的界面）来画。
 * 做法：
 *   1. QG：把无名杀的局面包装成 qx-ui 读取的形状（players / cards / logs ……）；
 *   2. 全局时机钩子把无名杀发生的事转成 qx-ui 的结构化日志（战报中英文、动画都由它驱动）；
 *   3. BTable 继承 qx-ui 的 Table：轮到你操作时，把无名杀的「可选 / 已选 / 能否确定」读出来显示，
 *      你的点击再原样转交给无名杀（点牌、点角色、确定、取消、发动技能）。
 */
(function () {
	'use strict';
	const E = window.QXEngine, D = E.CARD_DEFS, QT = window.QXText;
	const Base = window.QXUI.Table;
	let NN = null; // { lib, game, ui, get, _status }

	// ── 牌名：无名杀内部名 → 本作牌名 ──
	const N2Q = { sha: 'strike', shan: 'parry', tao: 'remedy', jiu: 'grog', juedou: 'duel', guohe: 'sabotage', shunshou: 'pilfer', wuzhong: 'windfall', jiedao: 'catspaw', nanman: 'invasion', wanjian: 'arrowstorm', taoyuan: 'respite', wugu: 'feast', wuxie: 'veto', huogong: 'greekfire', tiesuo: 'chainshot', shandian: 'damocles', lebu: 'lotus', bingliang: 'blockade', zhuge: 'gatling', qinggang: 'excalibur', cixiong: 'gemini', hanbing: 'winter', guding: 'misericorde', qinglong: 'berserker', zhangba: 'sarissa', guanshi: 'ram', fangtian: 'trident', zhuque: 'arquebus', qilin: 'longbow', bagua: 'aegis', renwang: 'testudo', tengjia: 'linothorax', baiyin: 'nemean', jueying: 'bucephalus', dilu: 'babieca', zhuahuang: 'marengo', hualiu: 'copenhagen', chitu: 'pegasus', dawan: 'sleipnir', zixin: 'arion' };
	const Q2N = {}; for (const k in N2Q) Q2N[N2Q[k]] = k;
	function qName(name, nature) {
		if (name === 'sha') return nature === 'fire' ? 'fire_strike' : nature === 'thunder' ? 'thunder_strike' : 'strike';
		return N2Q[name] || name;
	}
	const ROLE = { zhu: 'chancellor', zhong: 'keeper', fan: 'insurgent', nei: 'schemer' };
	const SUB = { equip1: 'weapon', equip2: 'armor', equip3: 'plus', equip4: 'minus' };
	const skId = s => (typeof s === 'string' && s.startsWith('qx_') ? s.slice(3) : s);
	const PHASE = { phaseZhunbei: 'prepare', phaseJudge: 'judge', phaseDraw: 'draw', phaseUse: 'play', phaseDiscard: 'discard', phaseJieshu: 'finish' };

	// ── 牌 ──
	let nextId = 1; const idOf = new WeakMap(); const byId = new Map();
	function cid(node) { if (!node || typeof node !== 'object') return null; let i = idOf.get(node); if (!i) { i = nextId++; idOf.set(node, i); byId.set(i, node); } return i; }
	class QCard {
		constructor(node) { this.nn = node; this.id = cid(node); }
		get name() { return qName(this.nn.name, this.nn.nature); }
		get suit() { return this.nn.suit; }
		get rank() { return this.nn.number; }
		get color() { return this.nn.suit === 'heart' || this.nn.suit === 'diamond' ? 'red' : 'black'; }
		get def() { return D[this.name]; }
		get virtual() { return false; }
		get loc() { return G ? G.locOf(this.nn) : null; }
		get omenAs() { const v = this.nn.viewAs; return v ? qName(v) : null; }
	}
	const cardObj = new WeakMap();
	function qc(node) { if (!node) return null; let c = cardObj.get(node); if (!c) { c = new QCard(node); cardObj.set(node, c); } return c; }

	// ── 角色 ──
	class QPlayer {
		constructor(np, seat) { this.nn = np; this.seat = seat; this.knownRoles = {}; this.marks = {}; this.phaseState = {}; }
		get role() { return ROLE[this.nn.identity] || null; }
		get roleShown() { return this.nn.identityShown || this.nn.identity === 'zhu'; }
		get hero() { const n = this.nn.name1 || this.nn.name; return n && n.startsWith('qx_') ? n.slice(3) : null; }
		get faction() { const h = this.hero; return h && E.HEROES[h] ? E.HEROES[h].faction : null; }
		get gender() { return this.nn.sex === 'female' ? 'female' : 'male'; }
		get hp() { return this.nn.hp; }
		get maxHp() { return this.nn.maxHp; }
		get dead() { return this.nn.isDead(); }
		get dying() { return !!(this.nn.isDying && this.nn.isDying()); }
		get chained() { return this.nn.isLinked(); }
		get faceDown() { return this.nn.isTurnedOver(); }
		get hand() { return this.nn.getCards('h').map(qc); }
		get equips() {
			const o = { weapon: null, armor: null, plus: null, minus: null };
			for (const c of this.nn.getCards('e')) { const s = SUB[NN.get.subtype(c)]; if (s) o[s] = qc(c); }
			return o;
		}
		get equipList() { return Object.values(this.equips).filter(Boolean); }
		get judgeZone() { return this.nn.getCards('j').map(qc); }
		get skills() {
			const out = []; const own = (this.nn.getSkills ? this.nn.getSkills(null, false, false) : this.nn.skills) || [];
			for (const s of own) { const id = skId(s); if (E.SKILLS[id] && !out.includes(id)) out.push(id); }
			return out;
		}
		get skillState() {
			const o = {}; for (const id of this.skills) if (E.SKILLS[id] && E.SKILLS[id].type === 'limited') o[id] = this.nn.awakenedSkills && this.nn.awakenedSkills.includes('qx_' + id);
			return o;
		}
		get turnState() { return { drunk: !!this.nn.storage.jiu || (this.nn.countMark && this.nn.hasSkill('jiu')) }; }
		get cardCount() { return this.nn.countCards('he'); }
		get wounded() { return this.hp < this.maxHp; }
	}

	// ── 局面 ──
	let G = null;
	class QG {
		constructor() {
			const { game } = NN;
			// 座位从执笔者（君主）开始按顺时针编号：I 号是执笔者
			const start = game.zhu || game.players[0]; const all = [];
			let q = start; do { all.push(q); q = q.nextSeat; } while (q && q !== start && all.length < 12);
			this.players = all.map((p, i) => new QPlayer(p, i));
			this.bySeat = new Map(); this.byNode = new Map();
			for (const p of this.players) { this.bySeat.set(p.seat, p); this.byNode.set(p.nn, p); }
			this.n = this.players.length; this.logs = []; this.over = false; this.result = null; this.opts = {}; this.round = 0;
			this.heroesRevealed = false; this.locMem = new Map();
		}
		p(seat) { return this.bySeat.get(seat); }
		pOf(np) { return np ? this.byNode.get(np) : null; }
		seatOf(np) { const p = this.pOf(np); return p ? p.seat : null; }
		card(id) { const n = byId.get(+id); return n ? qc(n) : null; }
		get cards() { const o = {}; for (const n of this.allNodes()) { const c = qc(n); o[c.id] = c; } return o; }
		get current() { return this.pOf(NN._status.currentPhase); }
		get phase() { const ev = NN._status.event; let e = ev; while (e) { if (PHASE[e.name]) return PHASE[e.name]; e = e.parent; } return null; }
		get processing() { const { ui } = NN; const out = []; for (const z of [ui.ordering, ui.special, ui.processing]) if (z) for (const n of z.childNodes) if (n.classList && n.classList.contains('card')) out.push(qc(n)); return out; }
		allNodes() {
			const { ui } = NN; const out = [];
			for (const z of [ui.cardPile, ui.discardPile, ui.ordering, ui.special, ui.processing]) if (z) for (const n of z.childNodes) if (n.classList && n.classList.contains('card')) out.push(n);
			for (const p of this.players) for (const n of p.nn.getCards('hej')) out.push(n);
			return out;
		}
		locOf(node) {
			const { ui } = NN; const par = node.parentNode;
			if (!par) return { zone: 'discard' };
			if (par === ui.cardPile) return { zone: 'deck' };
			if (par === ui.discardPile) return { zone: 'discard' };
			if (par === ui.ordering || par === ui.special || par === ui.processing) return { zone: 'process' };
			for (const p of this.players) {
				const nd = p.nn.node;
				if (par === nd.handcards1 || par === nd.handcards2) return { zone: 'hand', seat: p.seat };
				if (par === nd.equips) return { zone: 'equip', seat: p.seat };
				if (par === nd.judges) return { zone: 'judge', seat: p.seat };
			}
			return { zone: 'process' };
		}
		// 位置有变的牌，按「移动」写进日志（飞牌动画靠它）
		diffMoves() {
			const groups = new Map();
			for (const n of this.allNodes()) {
				const id = cid(n), l = this.locOf(n), k = l.zone + ':' + (l.seat == null ? '' : l.seat);
				const old = this.locMem.get(id); this.locMem.set(id, k);
				if (old === undefined || old === k) continue;
				if (!groups.has(k)) groups.set(k, { ids: [], to: l.zone, seat: l.seat == null ? null : l.seat });
				groups.get(k).ids.push(id);
			}
			for (const m of groups.values()) this.logs.push({ type: 'move', ids: m.ids, to: m.to, seat: m.seat, reason: null });
		}
		emit(type, data) { this.diffMoves(); this.logs.push(Object.assign({ type }, data || {})); if (T0) T0.kick(); }
		// 技能列表（技能按钮用）：本人技能 + 装备技能
		skillList(me) {
			const out = [];
			for (const id of me.skills) out.push({ key: 'qx_' + id, id, def: E.SKILLS[id], src: 'hero' });
			for (const c of me.equipList) { const nm = c.nn.name; const sk = (NN.lib.card[nm] && NN.lib.card[nm].skills) || []; for (const s of sk) out.push({ key: 'e:' + c.id, id: c.name, nskill: s, def: { type: 'equip' }, src: 'equip' }); }
			return out;
		}
		viewAsSkills() { return []; }
		autoTargets() { return null; }
		maxTargets() { return 1; }
		playable() { return false; }
	}

	// ── 无名杀里发生的事 → 结构化日志 ──
	function installHooks() {
		const { lib, game, get, _status } = NN;
		const S = p => G && G.seatOf(p);
		const ids = cards => (cards || []).filter(c => c && c.parentNode !== undefined && !c.isCard === false).map(c => cid(c)).filter(Boolean);
		const real = cards => (cards || []).filter(c => c && typeof c === 'object' && c.classList);
		lib.skill._qx_bridge = {
			trigger: {
				global: ['phaseBefore', 'useCard1', 'respond', 'damageEnd', 'recoverEnd', 'loseHpEnd', 'dying', 'dieBegin', 'judgeEnd', 'equipAfter', 'linkAfter', 'turnOverAfter', 'drawAfter', 'gainAfter', 'discardAfter', 'loseMaxHpAfter', 'gainMaxHpAfter', 'shaMiss', 'phaseZhunbeiBegin', 'phaseJudgeBegin', 'phaseDrawBegin', 'phaseUseBegin', 'phaseDiscardBegin', 'phaseJieshuBegin'],
			},
			forced: true, popup: false, silent: true, charlotte: true, priority: Infinity, forceDie: true,
			filter: (event, player) => !!G && player === NN.game.players[0],
			filter2: null,
			content() { const f = window.QX_BRIDGE_ON || (window.qxTable && window.QX_BRIDGE_ON2); if (f) f(trigger, event.triggername); },
		};
		const onTrig = function (ev, nm) {
				if (nm === 'phaseBefore') { G.round++; G.emit('turn', { seat: S(ev.player) }); return; }
				if (/^phase(Zhunbei|Judge|Draw|Use|Discard|Jieshu)Begin$/.test(nm)) { const ph = PHASE[nm.replace('Begin', '')]; G.emit('phase', { seat: S(ev.player), phase: ph }); return; }
				if (nm === 'useCard1') {
					const c = ev.card; if (!c) return;
					const sub = real(ev.cards); const name = qName(c.name, c.nature || get.nature(c));
					const virtual = !(sub.length === 1 && sub[0].name === c.name);
					if (ev.skill && lib.skill[ev.skill] && !lib.skill[ev.skill].equipSkill && ev.skill.startsWith('qx_')) G.emit('skill', { seat: S(ev.player), skill: skId(ev.skill) });
					G.emit('use', { seat: S(ev.player), card: name, ids: ids(sub), virtual, targets: (ev.targets || []).map(S).filter(x => x != null) });
					if (c.name === 'jiu') G.emit('drunk', { seat: S(ev.player) });
					return;
				}
				if (nm === 'respond') { const c = ev.card; if (!c) return; G.emit('play', { seat: S(ev.player), card: qName(c.name, c.nature), ids: ids(real(ev.cards)) }); return; }
				if (nm === 'damageEnd') { G.emit('damage', { to: S(ev.player), from: ev.source ? S(ev.source) : null, n: ev.num, nature: ev.nature === 'fire' || ev.nature === 'thunder' ? ev.nature : 'normal', hp: ev.player.hp }); return; }
				if (nm === 'recoverEnd') { G.emit('recover', { seat: S(ev.player), n: ev.num, hp: ev.player.hp }); return; }
				if (nm === 'loseHpEnd') { G.emit('loseHp', { seat: S(ev.player), n: ev.num, hp: ev.player.hp }); return; }
				if (nm === 'dying') { G.emit('dying', { seat: S(ev.player) }); return; }
				if (nm === 'dieBegin') { G.emit('death', { seat: S(ev.player), role: ROLE[ev.player.identity] }); return; }
				if (nm === 'judgeEnd') { const r = ev.judgestr || ''; G.emit('judge', { seat: S(ev.player), reason: judgeReason(ev), card: cid(ev.result && ev.result.card) }); G.emit('judgeResult', { seat: S(ev.player), card: cid(ev.result && ev.result.card) }); return; }
				if (nm === 'equipAfter') { G.emit('equip', { seat: S(ev.player), card: qName(ev.card.name) }); return; }
				if (nm === 'linkAfter') { G.emit('chain', { seat: S(ev.player), on: ev.player.isLinked() }); return; }
				if (nm === 'turnOverAfter') { G.emit('flip', { seat: S(ev.player), faceDown: ev.player.isTurnedOver() }); return; }
				if (nm === 'drawAfter') { const n = (ev.result && ev.result.length) || ev.num; G.emit('draw', { seat: S(ev.player), n }); return; }
				if (nm === 'gainAfter') { if (ev.getParent('draw', true) || ev.getParent().name === 'draw') return; const n = real(ev.cards).length; if (n) G.emit('gain', { seat: S(ev.player), n, from: ev.source ? S(ev.source) : (ev.giver ? S(ev.giver) : null) }); return; }
				if (nm === 'discardAfter') { const cs = ids(real(ev.cards)); if (!cs.length) return; const by = ev.discarder && ev.discarder !== ev.player ? S(ev.discarder) : null; if (by != null) { for (const c of cs) G.emit('discardOf', { by, seat: S(ev.player), card: c }); } else G.emit('discard', { seat: S(ev.player), cards: cs }); return; }
				if (nm === 'loseMaxHpAfter' || nm === 'gainMaxHpAfter') { G.emit('maxHp', { seat: S(ev.player), delta: nm === 'gainMaxHpAfter' ? ev.num : -ev.num, maxHp: ev.player.maxHp }); return; }
				if (nm === 'shaMiss') { G.emit('parried', { seat: S(ev.target) }); return; }
		};
		NN.doc.defaultView.QX_BRIDGE_ON = window.QX_BRIDGE_ON = function (ev, nm) { if (!G) return; try { onTrig(ev, nm); } catch (e) { console.error('[qx] hook', nm, e); } };
		function judgeReason(ev) {
			let e = ev; while (e) { if (e.card && e.card.name && N2Q[e.card.name]) return N2Q[e.card.name]; if (e.skill && e.skill.startsWith && e.skill.startsWith('qx_')) return skId(e.skill); if (e.name && e.name.startsWith && e.name.startsWith('qx_')) return skId(e.name); e = e.parent; }
			return 'fate';
		}
		if (!lib.config.globalSkills) lib.config.globalSkills = [];
		game.addGlobalSkill('_qx_bridge');
		// 技能发动（触发技、锁定技走 logSkill）
		const proto = lib.element.Player.prototype;
		const oLog = proto.logSkill;
		proto.logSkill = function (name, ...rest) {
			try { const n = Array.isArray(name) ? name[0] : name; if (G && typeof n === 'string' && n.startsWith('qx_') && E.SKILLS[skId(n)]) G.emit('skill', { seat: G.seatOf(this), skill: skId(n) }); } catch (e) { }
			return oLog.call(this, name, ...rest);
		};
		// 无名杀每次停顿（game.delay）时，等界面把动画播完再继续，画面和局面始终同步
		const idle = () => new Promise(res => { const t0 = Date.now(); (function chk() { const tb = T0; if (!tb || !G || ((tb.animIdx || 0) >= G.logs.length && !tb.stepping) || Date.now() - t0 > 4000) return res(); setTimeout(chk, 40); })(); });
		game.delay = function (time = 1, time2 = 0) {
			time = time * lib.config.duration + time2;
			if (lib.config.game_speed == 'vvfast') time /= 3;
			return _status.pauseManager.setDelay(new Promise(r => setTimeout(r, time)).then(idle));
		};
		// 对局结束
		const oOver = game.over;
		game.over = function (result, ...rest) {
			try {
				if (G && !G.over) {
					const alive = NN.game.players.concat(NN.game.dead);
					let winners = [];
					const me = NN.game.me;
					if (result === true) winners = [...new Set(alive.filter(p => p === me || (NN.get.is.friendOf ? false : false)).map(p => ROLE[p.identity]))];
					const w = alive.filter(p => p.isAlive && (p.isAlive() || true));
					G.result = { winners: guessWinners(alive) };
					G.emit('gameOver', { winners: G.result.winners });
					G.over = true;
				}
			} catch (e) { console.error(e); }
			return oOver.call(this, result, ...rest);
		};
		function guessWinners(all) {
			const live = all.filter(p => !p.isDead());
			const zhu = all.find(p => p.identity === 'zhu');
			if (zhu && zhu.isDead()) { if (live.length === 1 && live[0].identity === 'nei') return ['schemer']; return ['insurgent']; }
			return ['chancellor', 'keeper'];
		}
	}

	// ── 界面：继承 qx-ui 的 Table ──
	let T0 = null;
	class BTable extends Base {
		newGame() {
			// 重开 = 让无名杀重新开局（人数改了要重载）
			if (this.started) {
				const n = this.settings.n;
				try { NN.game.saveConfig('player_number', String(n), 'identity'); } catch (e) { }
				try { localStorage.setItem('qx-ui-lang', this.lang); } catch (e) { }
				NN.game.reload(); return;
			}
			this.started = true; T0 = this;
			this.token++; this.hideSet = null; this.phSet = false; this.fading = null; this.aimed = null; this.lastVetoOf = null;
			this.g = null; this.ui = null; this.logIdx = 0; this.animIdx = 0; this.phMem = {}; this.phCur = {}; this.marks = {}; this.handOrder = []; this.center = []; this.centerIds = new Set(); this.recs = []; this.rec = { answers: [], notes: [] };
			this.wait();
		}
		async wait() {
			const tok = this.token;
			while (!NN.game.players || !NN.game.players.length || !NN.game.players.every(p => p.identity) || !NN.game.me) { await sleep(100); if (tok !== this.token) return; }
			G = new QG(); this.g = G; this.me = G.seatOf(NN.game.me);
			this.settings.n = G.n; const sel = this.root.querySelector('select[data-k=n]'); if (sel) sel.value = String(G.n);
			G.diffMoves(); G.logs.length = 0;
			this.render();
			this.loop(tok);
		}
		kick() { this.dirty = true; }
		async loop(tok) {
			let introDone = false;
			while (tok === this.token) {
				await sleep(60);
				const g = this.g; if (!g) continue;
				if (!introDone && g.players.every(p => p.hero)) { introDone = true; g.heroesRevealed = true; try { await this.intro(tok); } catch (e) { } }
				if (g.logs.length > (this.animIdx || 0) && !this.stepping) {
					this.stepping = true;
					try { await this.step(tok); } catch (e) { console.error('[qx] step', e); try { this.render(); } catch (e2) { } }
					this.stepping = false;
				}
				this.pollDecision();
				if (g.over && !this.overShown && !this.stepping && g.logs.length <= this.animIdx) { this.overShown = true; this.ui = null; this.render(); try { this.showGameOver(); } catch (e) { console.error(e); } }
			}
		}
		// ── 轮到你？ ──
		pollDecision() {
			const { _status, ui } = NN; const ev = _status.event;
			const waiting = ev && ev.isMine && ev.isMine() && _status.paused && !_status.auto && !_status.dragged && !this.g.over;
			if (!waiting) { if (this.ui) { this.ui = null; this.closeModal(); this.render(); } this.curEv = null; return; }
			const sig = ev.name + ':' + (ev.skill || '') + ':' + (ui.confirm ? ui.confirm.str : '') + ':' + (ev.dialog && ev.dialog.buttons ? ev.dialog.buttons.length : '') + ':' + (ui.control && ui.control.childNodes ? [...NN.doc.querySelectorAll('#control > .control')].map(c => c.textContent).join('|') : '');
			if (this.curEv === ev && this.ui) { const now = Date.now(); if (sig !== this.curSig || now - (this.lastSync || 0) > 400) { this.curSig = sig; this.sync(); } return; }
			this.curEv = ev; this.curSig = sig;
			const req = this.buildReq(ev);
			if (UNSUPPORTED.includes(ev.name)) { this.assist(ev); return; }
			this.ui = { req, resolve: () => { }, sel: [], targets: [], skill: null, active: null, btn: [] };
			if (['chooseCard', 'pick', 'chooseOption', 'chooseHero', 'arrange'].includes(req.kind)) this.openChoiceModal(); else this.closeModal();
			this.sync();
		}
		// 无名杀当前事件 → qx-ui 的询问
		buildReq(ev) {
			const { _status, get, ui } = NN; const g = this.g; const nm = ev.name;
			const par = (n) => ev.getParent ? ev.getParent(n, true) : null;
			const req = { kind: 'nn', ev, player: g.p(this.me), reason: ev.skill ? skId(ev.skill) : skId(nm) };
			if (nm === 'chooseCharacter' || (ev.dialog && ev.dialog.buttons && ev.dialog.buttons.length && ev.dialog.buttons[0].classList.contains('character'))) {
				req.kind = 'chooseHero'; req.options = ev.dialog.buttons.map(b => skId(b.link)); req.refreshed = req.options.map(() => true);
				const zhu = NN.game.zhu; if (zhu && zhu !== NN.game.me && zhu.name1) req.chancellorHero = skId(zhu.name1);
				return req;
			}
			if (ev.dialog && ev.dialog.buttons && ev.dialog.buttons.length && ev.dialog.buttons.every(b => b.classList.contains('card'))) {
				const bs = ev.dialog.buttons; const opts = bs.map(b => cid(b.link)).filter(Boolean);
				const owner = bs.map(b => g.locOf(b.link)).find(l => l.seat != null);
				const ownCards = owner && opts.every(id => { const l = g.locOf(byId.get(id)); return l.seat === owner.seat; });
				const sel = ev.selectButton; const n = Array.isArray(sel) ? sel[1] : (typeof sel === 'number' ? sel : 1);
				if (ownCards && owner.seat !== this.me) { req.kind = 'chooseCard'; req.target = owner.seat; req.options = opts; req.count = n; req.visible = bs.some(b => !b.classList.contains('infohidden') && b.querySelector && !b.querySelector('.background.cardbg')); req.optional = !ev.forced; }
				else { req.kind = 'pick'; req.options = opts; req.optional = !ev.forced; if (n > 1) req.multi = { count: n }; }
				req.buttonMap = new Map(bs.map(b => [cid(b.link), b]));
				return req;
			}
			if (ev.controls || nm === 'chooseControl') {
				const cs = [...NN.doc.querySelectorAll('#control > .control > div')].filter(d => d.link !== undefined && d.link !== 'ok' && d.link !== 'cancel');
				req.kind = 'chooseOption'; req.options = (ev.controls || cs.map(c => c.link)).slice(); req.controlNodes = cs; return req;
			}
			if (nm === 'chooseBool') { req.kind = 'confirm'; req.skill = ev.skill ? (equipName(ev.skill) || skId(ev.skill)) : null; return req; }
			if (nm === 'chooseToUse' && ev.type === 'phase') { req.kind = 'play'; return req; }
			if (nm === 'chooseToDiscard' && par('phaseDiscard')) { req.kind = 'nn'; req.reason = 'phaseDiscard'; return req; }
			return req;
		}
		// 读无名杀的「可选 / 已选 / 能否确定」
		sync() {
			const u = this.ui; if (!u) return; this.lastSync = Date.now(); const g = this.g; const { ui, game } = NN;
			u.sel = (ui.selected.cards || []).map(c => g.card(cid(c))).filter(Boolean);
			u.targets = (ui.selected.targets || []).map(p => g.pOf(p)).filter(Boolean);
			const ev = NN._status.event;
			u.skill = null; u.active = null;
			if (ev && ev.skill && NN.lib.skill[ev.skill]) { const key = this.keyOfSkill(ev.skill); if (NN.lib.skill[ev.skill].viewAs) u.skill = key; else u.active = { key, option: null }; }
			const v = { cards: new Set(), seats: new Set(), buttons: new Set(), ok: false, selecting: false, targeting: false };
			const me = g.p(this.me);
			for (const c of me.nn.getCards('he')) if (c.classList.contains('selectable') || c.classList.contains('selected')) v.cards.add(cid(c));
			for (const p of g.players) if (p.nn.classList.contains('selectable') || p.nn.classList.contains('selected')) v.seats.add(p.seat);
			if (ev && ev.dialog && ev.dialog.buttons) for (const b of ev.dialog.buttons) if (b.classList.contains('selectable') || b.classList.contains('selected')) { const id = cid(b.link); if (id) v.buttons.add(id); }
			if (u.req.kind === 'chooseCard' || u.req.kind === 'pick') u.btn = (ui.selected.buttons || []).map(b => cid(b.link)).filter(Boolean);
			v.selecting = v.cards.size > 0; v.targeting = v.seats.size > 0;
			const cb = ui.confirm ? [...ui.confirm.childNodes] : [];
			const cs = (ui.confirm && ui.confirm.str) || '';
			v.ok = cs.includes('o') && !cb.some(n => n.link === 'ok' && n.classList.contains('disabled'));
			v.cancel = cs.includes('c') || cb.some(n => n.link === 'cancel');
			// 无牌可出、也没有能发动的技能时，响应询问（无懈、求药、出闪……）直接放弃，不让你干等
			const ev2 = u.req.ev;
			if (v.cancel && !v.cards.size && !v.seats.size && !(ev2.dialog && ev2.dialog.buttons && ev2.dialog.buttons.length) && !this.enabledSkills().length && (ev2.name === 'chooseToUse' || ev2.name === 'chooseToRespond') && ev2.type !== 'phase') {
				if (!u.autoSkip) { u.autoSkip = true; setTimeout(() => { if (this.ui === u && NN._status.event === ev2) nc(ui.click.cancel, null); }, 250); }
			}
			const key = JSON.stringify([[...v.cards], [...v.seats], [...v.buttons], v.ok, v.cancel, u.sel.map(c => c.id), u.targets.map(p => p.seat), u.skill, u.active && u.active.key, this.enabledSkills()]);
			u.view = v;
			if (key === u.lastKey) return; u.lastKey = key;
			this.render();
			if (['chooseCard', 'pick'].includes(u.req.kind) && u.req.multi) this.openChoiceModal();
		}
		// 让无名杀的 AI 替你做这一次选择，然后马上把托管关掉
		async assist(ev) {
			const { ui, _status } = NN; if (this.assisting) return; this.assisting = true;
			try { if (!_status.auto) nc(ui.click.auto, null); for (let i = 0; i < 100 && _status.event === ev; i++) await sleep(50); }
			finally { if (_status.auto) nc(ui.click.auto, null); this.assisting = false; }
		}
		keyOfSkill(s) {
			if (s.startsWith('qx_')) return s;
			const me = this.g.p(this.me); const e = this.g.skillList(me).find(x => x.nskill === s); return e ? e.key : s;
		}
		view() { const u = this.ui; if (!u) return null; return u.view || { cards: new Set(), seats: new Set(), buttons: new Set(), ok: false }; }
		curCard() { const u = this.ui; return u && u.sel.length === 1 ? u.sel[0] : null; }
		// 能发动的技能（无名杀的技能按钮）
		enabledSkills() { const { ui } = NN; const out = []; for (const c of [ui.skills, ui.skills2, ui.skills3]) if (c && c.skills && c.style.display !== 'none') for (const s of c.skills) out.push(s); return out; }
		activeButtons() {
			const out = []; const T = this.T;
			for (const s of this.enabledSkills()) { const info = NN.lib.skill[s]; if (!info || info.viewAs) continue; const key = this.keyOfSkill(s); const id = skId(s); out.push({ key, opt: null, label: E.SKILLS[id] ? T.skillName(id) : (equipName(s) ? T.cardName(equipName(s)) : id), nskill: s }); }
			return out;
		}
		viewAsList() {
			const out = [];
			for (const s of this.enabledSkills()) { const info = NN.lib.skill[s]; if (!info || !info.viewAs) continue; const key = this.keyOfSkill(s); const id = skId(s); out.push({ key, id: E.SKILLS[id] ? id : (equipName(s) || id), asName: null, nskill: s }); }
			return out;
		}
		// ── 点击：牌 / 角色 / 技能 / 按钮 → 交给无名杀 ──
		onClick(e) {
			if (this.dragJust) return;
			const el = e.target.closest('[data-id],[data-seat],[data-act],[data-opt],[data-skill],[data-active],[data-hero],[data-mul]');
			const u = this.ui;
			const mine = el && this.root.contains(el) && u && !e.target.closest('[data-bmark],[data-badge]') && !(el.dataset.act && ['new', 'lang', 'log', 'again', 'rules', 'full'].includes(el.dataset.act));
			if (!mine) return super.onClick(e);
			const { ui, game, _status } = NN;
			const after = () => setTimeout(() => this.sync(), 0);
			if (el.dataset.hero != null || el.dataset.opt != null || el.dataset.mul != null) {
				const raw = el.dataset.hero != null ? el.dataset.hero : el.dataset.opt != null ? el.dataset.opt : el.dataset.mul;
				const k = u.req.kind;
				if (k === 'chooseHero') { const b = u.req.ev.dialog.buttons.find(x => skId(x.link) === raw); if (b) { nc(ui.click.button, b); if ( ui.confirm && ui.confirm.str && ui.confirm.str.includes('o')) nc(ui.click.ok, null); } after(); return; }
				if (k === 'chooseOption') { const val = u.req.options[+raw]; const node = [...NN.doc.querySelectorAll('#control > .control > div')].find(d => d.link === val); if (node) nc(ui.click.control, node, val); after(); return; }
				if (k === 'chooseCard' || k === 'pick') { const b = u.req.buttonMap.get(+raw); if (b) { nc(ui.click.button, b); if (!u.req.multi && ui.confirm && ui.confirm.str && ui.confirm.str.includes('o') && !(u.req.count > 1)) nc(ui.click.ok, null); } after(); return; }
			}
			if (el.dataset.act) {
				const a = el.dataset.act;
				if (a === 'ok' || a === 'yes' || a === 'csOk' || a === 'multiOk') nc(ui.click.ok, null);
				else if (a === 'cancel' || a === 'no' || a === 'skip') { if (u.skill || u.active) nc(ui.click.cancel, null); else nc(ui.click.cancel, null); }
				else if (a === 'end') { if (u.skill || u.active) nc(ui.click.cancel, null); nc(ui.click.cancel, null); }
				after(); return;
			}
			if (el.dataset.skill || el.dataset.active) {
				const key = (el.dataset.skill || el.dataset.active).split('|')[0];
				const s = this.nskillOf(key);
				if ((u.skill === key) || (u.active && u.active.key === key)) nc(ui.click.cancel, null); else if (s) nc(ui.click.skill, null, s);
				after(); return;
			}
			if (el.dataset.id) {
				const id = +el.dataset.id; const key = 'e:' + id;
				if (el.closest('.qx-deq') && !(this.view() && this.view().cards.has(id))) { const s = this.nskillOf(key); if (s && this.enabledSkills().includes(s)) { if ((u.skill === key) || (u.active && u.active.key === key)) nc(ui.click.cancel, null); else nc(ui.click.skill, null, s); after(); return; } }
				const node = byId.get(id); if (node && (node.classList.contains('selectable') || node.classList.contains('selected'))) nc(ui.click.card, node);
				after(); return;
			}
			if (el.dataset.seat != null) { const p = this.g.p(+el.dataset.seat); if (p && (p.nn.classList.contains('selectable') || p.nn.classList.contains('selected'))) nc(ui.click.target, p.nn); after(); return; }
		}
		nskillOf(key) { if (key.startsWith('e:')) { const me = this.g.p(this.me); const e = this.g.skillList(me).find(x => x.key === key && this.enabledSkills().includes(x.nskill)); return e ? e.nskill : (this.g.skillList(me).find(x => x.key === key) || {}).nskill; } return key; }
		canConfirm() { const v = this.view(); return !!v && v.ok; }
		// ── 提示文字与按钮 ──
		promptParts() {
			const u = this.ui, T = this.T, t = T.t, g = this.g, req = u.req, k = req.kind, ev = req.ev, v = this.view() || {};
			const btn = (act, label, on, cls) => `<button class="qx-dbt${cls ? ' ' + cls : ''}" data-act="${act}"${on === false ? ' disabled' : ''}>${esc(label)}</button>`;
			let text = '', btns = '';
			if (k === 'confirm') {
				if (req.skill && D[req.skill]) { text = t('confirmEquip', { c: T.cardName(req.skill) }); btns = btn('yes', t('confirm'), true, 'qx-primary') + btn('no', t('cancel')); }
				else { text = req.skill && E.SKILLS[req.skill] ? t('askSkill', { k: T.skillName(req.skill) }) : t('option'); btns = btn('yes', t('yes'), true, 'qx-primary') + btn('no', t('no')); }
				return { text, btns };
			}
			if (k === 'play') {
				const c = this.curCard();
				if (u.active) { const id = skId(this.nskillOf(u.active.key)); text = E.SKILLS[id] ? T.skillName(id) : t('play'); }
				else if (u.skill) { const id = skId(this.nskillOf(u.skill)); text = t('viewAsPick0', { k: E.SKILLS[id] ? T.skillName(id) : T.cardName(equipName(this.nskillOf(u.skill)) || id), n: 1 }); }
				else if (c && v.targeting) text = this.tgText({ c: T.cardName(c.name), min: 1, max: selMax(ev) });
				else text = t('play');
				btns = btn('ok', t('playBtn'), v.ok, 'qx-primary');
				if (u.skill || u.active) btns += btn('cancel', t('cancel'));
				btns += btn('end', t('endPlay'));
				return { text, btns };
			}
			text = this.reqText(req, ev);
			btns = btn('ok', t('confirm'), v.ok, 'qx-primary') + (v.cancel ? btn('cancel', t('cancel')) : '');
			return { text, btns };
		}
		reqText(req, ev) {
			const T = this.T, t = T.t, g = this.g; const nm = ev.name;
			const who = p => this.who(g.seatOf(p));
			const parentCard = () => { let e = ev; while (e) { if (e.card && e.card.name && (e.name === 'useCard' || e.name === 'sha' || e.name === 'juedou')) return e; e = e.parent; } return null; };
			if (req.reason === 'phaseDiscard') return t('phaseDiscard', { n: NN.ui.selected.cards.length ? Math.max(0, (Array.isArray(ev.selectCard) ? ev.selectCard[0] : ev.selectCard)) : (Array.isArray(ev.selectCard) ? ev.selectCard[0] : ev.selectCard) });
			if (nm === 'chooseToRespond' || (nm === 'chooseToUse' && ev.type !== 'phase')) {
				// 求药
				if (ev.type === 'dying' || ev.dying) { const d = ev.dying; return d === NN.game.me ? t('r_saveSelf') : t('r_save', { t: who(d) }); }
				// 无懈
				const pc = ev.getParent ? ev.getParent('_wuxie', true) : null;
				if (ev.type === 'wuxie' || pc) { const info = ev.respondTo || []; const src = info[0], card = info[1]; return t('r_veto', { f: src ? who(src) : '', c: card ? T.cardName(qName(card.name, card.nature)) : '', t: '' }); }
				const pe = parentCard();
				if (pe) {
					const nmc = pe.card.name;
					if (nmc === 'sha') return t('r_strike', { s: who(pe.player) });
					if (nmc === 'juedou') return t('r_duel', { s: who(pe.player) });
					if (nmc === 'nanman') return t('r_invasion');
					if (nmc === 'wanjian') return t('r_arrowstorm');
				}
				const pat = patternOf(ev); if (pat.length) return t('r_generic', { p: pat.map(T.cardName).join(' / ') });
			}
			const sk = skillOfEvent(ev);
			const rng = x => { if (x == null) return null; const a = Array.isArray(x) ? x : [x, x]; if (a[1] < 0) a[1] = 9; return a[0] === a[1] ? String(a[0]) : a[0] + '–' + a[1]; };
			const parts = [];
			if (ev.filterCard && ev.selectCard != null && (Array.isArray(ev.selectCard) ? ev.selectCard[1] !== 0 : ev.selectCard !== 0) && nm !== 'chooseTarget') parts.push(t('nCards', { n: rng(ev.selectCard) }));
			if (ev.filterTarget && ev.selectTarget != null && (Array.isArray(ev.selectTarget) ? ev.selectTarget[1] !== 0 : ev.selectTarget !== 0)) parts.push(t('nTargets', { n: rng(ev.selectTarget) }));
			const pc = (() => { let e = ev; while (e) { if (e.card && e.card.name && N2Q[e.card.name]) return N2Q[e.card.name]; e = e.parent; } return null; })();
			const label = sk ? T.skillName(sk) : pc ? T.cardName(pc) : null;
			if (label && parts.length) return t('pickSkill', { k: label, c: parts.join(t('and')), tg: '' });
			if (sk) return t('askSkill', { k: T.skillName(sk) });
			if (nm === 'chooseToDiscard') { const s = ev.selectCard; const a = Array.isArray(s) ? s[0] : s, b = Array.isArray(s) ? s[1] : s; return t('chooseCards', { min: a, max: b }); }
			if (nm === 'chooseTarget') { const s = ev.selectTarget; const a = Array.isArray(s) ? s[0] : s, b = Array.isArray(s) ? s[1] : s; return t('targets', { min: a, max: b }); }
			return t('option');
		}
		openChoiceModal() {
			const u = this.ui; if (!u) return;
			if (u.req.kind === 'chooseOption') {
				const T = this.T, t = T.t; const req = u.req;
				const sk = skillOfEvent(req.ev); const title = sk ? T.skillName(sk) : t('option');
				const lab = o => optionLabel(o, T);
				const body = `<div class="qx-mopts">${req.options.map((o, i) => `<button class="qx-mopt" data-opt="${i}">${esc(lab(o))}</button>`).join('')}</div>`;
				this.showModal(`<div class="qx-box"><div class="qx-mtitle"><i></i><span>${esc(title)}</span><i></i></div><div class="qx-mbody">${body}</div></div>`);
				return;
			}
			return super.openChoiceModal();
		}
		heroCardHTML(k, i) { return super.heroCardHTML(k, i, true).replace(/<button[^>]*data-refresh[^>]*>[\s\S]*?<\/button>/, ''); }
		answer() { }
		shell() {
			super.shell();
			const L = this.lang === 'en';
			const cr = document.createElement('div'); cr.className = 'qxb-credit';
			cr.innerHTML = L ? 'Built on <a href="https://github.com/libnoname/noname" target="_blank">noname</a> (GPL-3.0) · <a href="https://github.com/catchyhand/catchyhand.github.io/tree/main/hall-of-ages-src" target="_blank">Source</a>' : '基于<a href="https://github.com/libnoname/noname" target="_blank">无名杀</a>（GPL-3.0）· <a href="https://github.com/catchyhand/catchyhand.github.io/tree/main/hall-of-ages-src" target="_blank">源码</a>';
			this.root.appendChild(cr);
			if (!document.getElementById('qxb-style')) { const st = document.createElement('style'); st.id = 'qxb-style'; st.textContent = '#qx .qxb-credit{text-align:right;font:12px/1.6 sans-serif;color:rgba(232,220,192,.45);padding:2px 14px 6px}#qx .qxb-credit a{color:inherit}'; document.head.appendChild(st); }
			const ls = this.$('[data-act=lang]'); if (ls) ls.addEventListener('click', () => { try { localStorage.setItem('qx-ui-lang', this.lang); } catch (e) { } });
		}
		render() {
			if (!this.g || !this.g.players[0].role) return;
			this.fit();
			this.renderTable(); this.renderMe(); this.renderLog(); this.renderWins(); this.fitNames(); this.reHide(); this.applyAimed();
			this.drawSelLines();
		}
		showGameOver() { try { super.showGameOver(); } catch (e) { console.error(e); } }
	}
	// 无名杀每次点击后要等主窗口的点击事件把 _status.clicked 复位；我们的点击在 iframe 里，所以自己复位
	function nc(fn, self, ...args) { NN._status.clicked = false; try { return fn.apply(self, args); } finally { NN._status.clicked = false; } }
	const UNSUPPORTED = ['chooseToGuanxing', 'chooseToMove', 'chooseToMove_new'];
	function selMax(ev) { const s = ev && ev.selectTarget; if (Array.isArray(s)) return s[1] < 0 ? 9 : s[1]; return typeof s === 'number' ? s : 1; }
	function equipName(s) { for (const n in NN.lib.card) { const sk = NN.lib.card[n].skills; if (sk && sk.includes(s) && N2Q[n]) return N2Q[n]; } return null; }
	function patternOf(ev) {
		const out = []; const f = ev.filterCard; if (!f || typeof f !== 'function') return out;
		for (const n of ['shan', 'sha', 'tao', 'jiu', 'wuxie']) { try { if (f({ name: n }, NN.game.me, ev)) out.push(N2Q[n]); } catch (e) { } }
		return out;
	}
	function skillOfEvent(ev) { let e = ev; while (e) { const s = e.skill || (e.name && e.name.startsWith && e.name.startsWith('qx_') ? e.name : null); if (s && typeof s === 'string') { const id = skId(s.replace(/_[a-z]+$/, m => (E.SKILLS[skId(s)] ? m : ''))); if (E.SKILLS[skId(s)]) return skId(s); const base = skId(s).split('_')[0]; if (E.SKILLS[base]) return base; } e = e.parent; } return null; }
	function optionLabel(o, T) { if (typeof o !== 'string') return String(o); const tr = window.QX_OPT && window.QX_OPT[o]; if (tr) return T.L ? tr[1] : tr[0]; if (o === 'cancel2') return T.t('cancel'); return o; }
	function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
	const sleep = ms => new Promise(r => setTimeout(r, ms));

	window.QXBridge = {
		start(nn, host, opts) {
			NN = nn; NN.doc = nn.doc || window.parent.document; installHooks();
			const t = new BTable(host, Object.assign({ lang: 'zh' }, opts || {}));
			return t;
		},
		get G() { return G; },
	};
})();
