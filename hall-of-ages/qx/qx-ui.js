/* 群星议会 — 简略界面（文字 + 色块）
 * 用法：QXUI.mount(document.getElementById('某容器'), { lang: 'zh' })
 * 所有样式限定在 #qx 内，类名统一 qx- 前缀。
 */
(function (root, factory) {
  root.QXUI = factory(root.QXEngine, root.QXCards, root.QXText, root.QXAI);
})(typeof self !== 'undefined' ? self : this, function (E, QC, QT, AI) {
  'use strict';
  const D = E.CARD_DEFS;
  // 阵营配置：座位框名字条的阵营色 + 左上圆座徽章。新增阵营（DLC）只改这里，或在 mount 时传入 { factions: {...} }。
  const FACTIONS = {
    classical: { strip: 'linear-gradient(180deg,rgba(176,30,24,.94),rgba(96,10,8,.95) 55%,rgba(150,22,18,.94))', text: '#fff6ea', dark: true, emblem: 'seat/emblem-classical.png' },
    medieval: { strip: 'linear-gradient(180deg,rgba(40,74,150,.94),rgba(12,26,70,.96) 55%,rgba(32,60,128,.94))', text: '#f3cf6a', dark: true, emblem: 'seat/emblem-medieval.png' },
    renaissance: { strip: 'linear-gradient(180deg,rgba(30,110,66,.94),rgba(6,26,14,.96) 55%,rgba(24,92,54,.94))', text: '#f0d47a', dark: true, emblem: 'seat/emblem-renaissance.png' },
    revolution: { strip: 'linear-gradient(180deg,rgba(150,18,18,.9),rgba(16,8,8,.94) 60%,rgba(120,14,14,.9))', text: '#ffffff', dark: true, emblem: 'seat/emblem-revolution.png' }
  };

  const CSS = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Noto+Serif+SC:wght@900&display=swap');
#qx{--qx-bg:#14120e;--qx-panel:#1d1a13;--qx-line:#4a3e26;--qx-gold:#d9b45a;--qx-text:#e9dfc6;--qx-dim:#958a72;
  font-family:"Noto Serif SC","Songti SC","Source Han Serif SC",Georgia,serif;color:var(--qx-text);background:var(--qx-bg);
  position:relative;box-sizing:border-box;padding:12px;min-height:100%;user-select:none;-webkit-user-select:none}
#qx *{box-sizing:border-box}
#qx .qx-top{position:relative;z-index:30;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
#qx .qx-title{font-size:20px;color:var(--qx-gold);letter-spacing:2px;margin-right:auto;font-weight:bold}
#qx .qx-top label{font-size:13px;color:var(--qx-dim);display:flex;align-items:center;gap:4px}
#qx select,#qx .qx-btn{font:inherit;font-size:13px;background:#2a2419;color:var(--qx-text);border:1px solid #6b5a33;border-radius:4px;padding:5px 10px}
#qx .qx-btn{cursor:pointer}
#qx .qx-btn:hover:not(:disabled){background:#3b3121}
#qx .qx-btn:disabled{opacity:.4;cursor:default}
#qx .qx-btn.qx-primary{background:#6b4f1d;border-color:var(--qx-gold)}
#qx .qx-btn.qx-on{background:#2f5a3f;border-color:#7fbf8f}
#qx .qx-note{font-size:12px;color:var(--qx-dim);margin:-4px 0 8px}
#qx .qx-main{display:grid;grid-template-columns:1fr 290px;gap:10px}
@media(max-width:900px){#qx .qx-main{grid-template-columns:1fr}#qx .qx-side{height:200px}}
#qx .qx-table.qx-t8,#qx .qx-side.qx-t8{height:720px}
#qx .qx-t8 .qx-seat{width:196px}#qx .qx-t8 .qx-hpic{width:60px}
#qx .qx-table{position:relative;height:500px;background:radial-gradient(ellipse at center,#2b2417 0%,#1a160f 70%);border:1px solid var(--qx-line);border-radius:10px}
#qx .qx-seat{position:absolute;transform:translate(-50%,-50%);width:210px;background:var(--qx-panel);border:1px solid var(--qx-line);border-radius:7px;padding:6px 7px;font-size:12px;line-height:1.45;transition:box-shadow .15s}
#qx .qx-seat.qx-cur{border-color:var(--qx-gold);box-shadow:0 0 0 1px var(--qx-gold)}
#qx .qx-seat.qx-deadseat{opacity:.4}
#qx .qx-sel{cursor:pointer;box-shadow:0 0 0 2px #7fbf8f!important}
#qx .qx-picked{box-shadow:0 0 0 3px #f0d080!important;background:#3a3016!important}
#qx .qx-seathead{display:flex;align-items:center;gap:5px;font-weight:bold}
#qx .qx-role{display:inline-block;padding:0 5px;border-radius:3px;font-size:11px;font-weight:bold}
#qx .qx-r-chancellor{background:#c9a032;color:#1a1408}#qx .qx-r-keeper{background:#cfd3d8;color:#1a1a1a}
#qx .qx-r-insurgent{background:#2f5a3f;color:#e6f0e6}#qx .qx-r-schemer{background:#4a2a55;color:#efe0f5}#qx .qx-r-unknown{background:#3a3428;color:#bbb}
#qx .qx-hp{color:#e06a5a;letter-spacing:1px}#qx .qx-hp i{font-style:normal;color:#5a4a40}
#qx .qx-meta{color:var(--qx-dim)}
#qx .qx-chips{display:flex;flex-wrap:wrap;gap:3px;margin-top:3px}
#qx .qx-chip{font-size:11px;padding:0 4px;border-radius:3px;background:#2c2a26;border:1px solid #4b463b}
#qx .qx-chip.qx-omen{background:#2e2340;border-color:#5b4a80}
#qx .qx-chip.qx-red{color:#ff8f80}
#qx .qx-tag{font-size:11px;padding:0 4px;border-radius:3px;background:#5a2a20;color:#ffd2c8;margin-left:2px}
#qx .qx-center{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);width:320px;text-align:center;font-size:12px;color:var(--qx-dim)}
#qx .qx-center .qx-phase{color:var(--qx-gold);font-size:14px;margin-bottom:6px}
#qx .qx-recent{display:flex;justify-content:center;gap:6px;margin-top:6px;min-height:95px}
#qx .qx-side{background:#100e0b;border:1px solid var(--qx-line);border-radius:8px;display:flex;flex-direction:column;height:500px}
#qx .qx-logtitle{padding:6px 10px;border-bottom:1px solid var(--qx-line);color:var(--qx-gold);font-size:13px}
#qx .qx-log{flex:1;overflow:auto;padding:6px 10px;font-size:12px;line-height:1.6}
#qx .qx-l-turn{color:var(--qx-gold);margin-top:5px}#qx .qx-l-dmg{color:#e88a74}#qx .qx-l-heal{color:#8fc7a8}
#qx .qx-l-death{color:#ff6b6b;font-weight:bold}#qx .qx-l-skill{color:#b9a3e3}#qx .qx-l-end{color:var(--qx-gold);font-weight:bold}
#qx .qx-me{margin-top:10px;background:var(--qx-panel);border:1px solid var(--qx-line);border-radius:10px;padding:10px;display:grid;grid-template-columns:250px 1fr;gap:12px}
#qx .qx-me.qx-cur{border-color:var(--qx-gold)}
@media(max-width:700px){#qx .qx-me{grid-template-columns:1fr}}
#qx .qx-mestat{font-size:13px;line-height:1.6;border-radius:6px;padding:4px}
#qx .qx-prompt{min-height:34px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14px;margin-bottom:8px}
#qx .qx-prompt .qx-ptext{margin-right:auto;color:#f3e6c4}
#qx .qx-hand{display:flex;gap:6px;flex-wrap:wrap;min-height:146px;padding-top:8px}
#qx .qx-card{width:74px;height:106px;border-radius:6px;border:1px solid #6b5a33;padding:4px 5px;position:relative;font-size:12px;background:#2a2318;cursor:default;display:flex;flex-direction:column;transition:transform .1s}
#qx .qx-card.qx-sel:hover{transform:translateY(-3px)}
#qx .qx-card.qx-picked{transform:translateY(-8px)}
#qx .qx-card.qx-dim{opacity:.45}
#qx .qx-card .qx-corner{font-weight:bold;font-size:13px}
#qx .qx-card.qx-red .qx-corner{color:#ff7a6a}
#qx .qx-card .qx-cname{margin-top:auto;margin-bottom:auto;text-align:center;font-weight:bold;font-size:13px;line-height:1.2}
#qx .qx-card .qx-ccat{font-size:10px;color:var(--qx-dim);text-align:center}
#qx .qx-t-basic{background:#3a2c1c}#qx .qx-t-stratagem{background:#1d2a40}#qx .qx-t-omen{background:#2d2142}#qx .qx-t-equip{background:#2d3033}
#qx .qx-card.qx-mini{width:58px;height:82px;font-size:11px}
#qx .qx-card.qx-mini .qx-cname{font-size:11px}
#qx .qx-modal{position:absolute;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:flex-start;justify-content:center;z-index:20;padding-top:64px}
#qx .qx-modal.qx-hidden{display:none}
#qx .qx-box{background:#221d14;border:1px solid var(--qx-gold);border-radius:10px;padding:16px 18px;max-width:560px;width:92%}
#qx .qx-box h3{margin:0 0 10px;color:var(--qx-gold);font-size:16px}
#qx .qx-box .qx-row{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
#qx .qx-back{width:62px;height:93px;border-radius:4px;background-size:cover;background-position:center;cursor:pointer;display:flex;align-items:flex-end;justify-content:center;font-size:12px;color:#f3e6c4;box-shadow:0 2px 5px rgba(0,0,0,.55)}
#qx .qx-back span{background:rgba(0,0,0,.6);padding:0 6px;border-radius:8px;margin-bottom:4px}
#qx .qx-back:hover,#qx .qx-box .qx-card:hover{box-shadow:0 0 0 2px #7fbf8f}
#qx .qx-box .qx-card{cursor:pointer}
#qx .qx-roles div{font-size:13px;line-height:1.8;display:flex;align-items:center;gap:8px}
/* 牌面图片 */
#qx .qx-pic{width:92px;height:138px;padding:0;border:none;background:#111;container-type:inline-size;border-radius:6px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.55);flex:none}
#qx .qx-pic img{width:100%;height:100%;display:block;pointer-events:none;-webkit-user-drag:none;user-select:none}
#qx .qx-pic.qx-mini{width:62px;height:93px;border-radius:4px}
#qx .qx-pic.qx-tiny{width:34px;height:51px;border-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,.6)}
#qx .qx-pic.qx-dim{opacity:.4}
#qx .qx-rs{position:absolute;left:10.5%;top:2.5%;width:24.5%;height:10.3%;display:flex;align-items:center;justify-content:center;border-radius:2cqw;pointer-events:none}
#qx .qx-rs b{font:700 15.5cqw/1 Georgia,"Times New Roman","Noto Serif SC",serif;color:#1b1714;white-space:nowrap;letter-spacing:-.03em}
#qx .qx-rs b.qx-rsred{color:#a8141b}
#qx .qx-rs-basic{background:#eed9b6;box-shadow:0 0 1.5cqw 1cqw #eed9b6}
#qx .qx-rs-stratagem{background:#bcd2ea;box-shadow:0 0 1.5cqw 1cqw #bcd2ea}
#qx .qx-rs-omen{background:#dcc3df;box-shadow:0 0 1.5cqw 1cqw #dcc3df}
#qx .qx-rs-arsenal{background:#c8c5c2;box-shadow:0 0 1.5cqw 1cqw #c8c5c2}
#qx .qx-tiny .qx-rs b{font-size:17cqw}
#qx .qx-nat{position:absolute;right:5%;top:16%;width:26%;aspect-ratio:1;border-radius:50%;background:rgba(18,10,6,.82);box-shadow:0 0 0 .8cqw #d9b45a;display:flex;align-items:center;justify-content:center;pointer-events:none}
#qx .qx-nat svg{width:72%;height:72%}
#qx .qx-idc{width:40px;height:60px;border-radius:4px;overflow:hidden;flex:none;box-shadow:0 1px 4px rgba(0,0,0,.6)}
#qx .qx-idc img{width:100%;height:100%;display:block;pointer-events:none}
#qx .qx-idc.qx-idbig{width:62px;height:93px;border-radius:5px}
#qx .qx-idc.qx-idsm{width:28px;height:42px;border-radius:3px}
#qx .qx-seatrow{display:flex;gap:6px;align-items:flex-start}
#qx .qx-seatinfo{flex:1;min-width:0}
#qx .qx-pics{display:flex;flex-wrap:wrap;gap:3px;margin-top:3px}
#qx .qx-hc{display:inline-flex;align-items:center;gap:3px;vertical-align:middle}
#qx .qx-hc img{width:16px;height:24px;border-radius:2px}
#qx .qx-deck{display:inline-flex;flex-direction:column;align-items:center;gap:2px;margin:4px 8px}
#qx .qx-deck img{width:46px;height:69px;border-radius:4px;box-shadow:2px 2px 0 #3a2c1c,4px 4px 0 #2a2014}
#qx .qx-zoom{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:99;display:flex;align-items:center;justify-content:center;cursor:zoom-out}
#qx .qx-zoomcard{position:relative;width:min(86vw,380px,calc(86vh * 750 / 1140));aspect-ratio:750/1140;container-type:inline-size;border-radius:10px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.7)}
#qx .qx-zoomcard img{width:100%;height:100%;display:block}
#qx .qx-zoomcard.qx-zhero{width:min(90vw,460px,calc(86vh * 750 / 1000));aspect-ratio:750/1000;box-shadow:none;overflow:visible;border-radius:0}
#qx .qx-hpic{position:relative;flex:none;width:72px;aspect-ratio:384/512;filter:drop-shadow(0 1px 3px rgba(0,0,0,.7))}
#qx .qx-hpic img{width:100%;height:100%;display:block;pointer-events:none}
#qx .qx-hpic.qx-hbig{width:96px}
#qx .qx-hpic.qx-hsel{width:100%}
#qx .qx-seat .qx-idcor{position:absolute;right:6px;top:6px}
#qx .qx-seat .qx-seathead,#qx .qx-seat .qx-seathero{padding-right:30px}
#qx .qx-seathead{flex-wrap:wrap}#qx .qx-nw{white-space:nowrap}
#qx .qx-seathero{font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#qx .qx-mestat{position:relative}
#qx .qx-mestat .qx-idcor{position:absolute;right:4px;top:4px}
#qx .qx-mestat .qx-seathead{padding-right:46px}
#qx .qx-hpic.qx-hdead img{filter:grayscale(1) brightness(.6)}
#qx .qx-hpic.qx-hflip img{filter:brightness(.45) sepia(.4)}
#qx .qx-hblank{width:100%;height:100%;border-radius:7px;border:1px dashed #6b5a33;background:repeating-linear-gradient(45deg,#231d14 0 6px,#1d1811 6px 12px);display:flex;align-items:center;justify-content:center;color:#8a7a5a;font-size:22px}
#qx .qx-hpbar{display:inline-flex;align-items:center;gap:2px;vertical-align:middle}
#qx .qx-hpbar i{width:9px;height:9px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ff9c84,#c2321e 60%,#6e140a);box-shadow:0 0 0 1px #3a0d06}
#qx .qx-hpbar i.qx-lost{background:#2a231b;box-shadow:inset 0 0 0 1px #5a4a3a}
#qx .qx-hpbar b{font-size:11px;color:#f0b8a8;margin-left:3px;font-weight:normal}
#qx .qx-hpbar.qx-hplow i:not(.qx-lost){background:radial-gradient(circle at 35% 35%,#ffd27a,#d27a12 60%,#6e3a0a)}
#qx .qx-lrs{position:absolute;left:5.5%;top:4.3%;width:13.6%;height:8.9%;background:#efe0bf;box-shadow:0 0 1cqw .6cqw #efe0bf;border-radius:1.6cqw;pointer-events:none}
#qx .qx-lrs .qx-lr{position:absolute;left:8%;top:2%;font:700 9cqw/1 Georgia,"Times New Roman",serif;color:#1b1714}
#qx .qx-lrs .qx-ls{position:absolute;right:6%;bottom:2%;font:700 7.5cqw/1 Georgia,serif;color:#1b1714}
#qx .qx-lrs.qx-lred .qx-lr,#qx .qx-lrs.qx-lred .qx-ls{color:#a8141b}
#qx .qx-zoomcard .qx-nat{right:6%;top:12%;width:14%}
#qx .qx-rulebtn{margin-left:4px}
#qx .qx-rules{max-height:72vh;overflow:auto;font-size:14px;line-height:1.75;padding-right:6px}
#qx .qx-rules h4{color:var(--qx-gold);margin:14px 0 4px;font-size:15px}
#qx .qx-rules p{margin:4px 0}
#qx .qx-rules table{border-collapse:collapse;font-size:13px;width:100%}
#qx .qx-rules td,#qx .qx-rules th{border:1px solid var(--qx-line);padding:3px 6px;vertical-align:top;text-align:left}
#qx .qx-lore{font-style:italic;color:#eadbb5}
#qx .qx-hero{font-weight:bold}
#qx .qx-fac{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:3px;vertical-align:middle}
#qx .qx-skills{display:flex;flex-wrap:wrap;gap:3px;margin-top:3px}
#qx .qx-sk{font-size:11px;padding:0 5px;border-radius:3px;background:#2e2a3a;border:1px solid #5a4f78;color:#d8cff0}
#qx .qx-sk.qx-skused{opacity:.45;text-decoration:line-through}
#qx .qx-heroes{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;max-height:62vh;overflow:auto;padding:2px}
#qx .qx-hcard .qx-hpic{width:118px;align-self:center}
#qx .qx-hcard{border:1px solid var(--qx-line);border-radius:8px;padding:8px;background:#1b1810;font-size:12px;line-height:1.5;display:flex;flex-direction:column;gap:4px}
#qx .qx-hcard .qx-hname{font-size:15px;font-weight:bold;color:#f3e6c4}
#qx .qx-hcard .qx-hsk b{color:#d8cff0}
#qx .qx-hcard .qx-hbtns{display:flex;gap:6px;margin-top:auto}
#qx .qx-box.qx-wide{max-width:900px}
/* ── 舞台 ── */
#qx .qx-stagewrap{position:relative;width:100%;overflow:hidden}
#qx .qx-stage{position:absolute;left:0;top:0;width:1280px;height:760px;transform-origin:0 0;background:radial-gradient(ellipse 58% 52% at 40% 44%,#3b3121 0%,#261f15 58%,#17130d 100%);border:1px solid var(--qx-line);border-radius:10px;overflow:hidden}
#qx .qx-board{position:absolute;left:0;top:0;width:1012px;height:532px}
#qx .qx-stage .qx-side{position:absolute;left:1016px;top:6px;width:258px;height:524px}
#qx .qx-dash{position:absolute;left:0;top:536px;width:1280px;height:224px;background:linear-gradient(#2b2317,#18130c);border-top:2px solid #6b5a33}
#qx .qx-dash.qx-cur{border-top-color:var(--qx-gold)}
#qx .qx-lines{position:absolute;left:0;top:0;pointer-events:none;z-index:40;overflow:visible}
#qx .qx-ln{stroke:#ffd77a;stroke-width:3;stroke-linecap:round;filter:drop-shadow(0 0 3px rgba(255,200,80,.9))}
#qx .qx-lsel{opacity:.85}
#qx .qx-fx{position:absolute;left:0;top:0;width:0;height:0;z-index:45;pointer-events:none}
#qx .qx-fly{position:absolute;left:0;top:0;transform-origin:50% 50%;perspective:700px}
#qx .qx-fin{position:relative;width:100%;height:100%;transform-style:preserve-3d}
#qx .qx-ff,#qx .qx-fb{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
#qx .qx-fb{transform:rotateY(180deg)}
#qx .qx-fb img{width:100%;height:100%;border-radius:6px;display:block;box-shadow:0 2px 8px rgba(0,0,0,.6)}
#qx .qx-pic.qx-flyc{width:88px;height:134px}
#qx .qx-flybar .qx-ebar{margin:0}
/* 座位 */
#qx .qx-st{position:absolute;width:152px;height:196px}
#qx .qx-st.qx-sel,#qx .qx-st.qx-picked,#qx .qx-dpor.qx-sel,#qx .qx-dpor.qx-picked{box-shadow:none!important;background:none!important}
#qx .qx-st .qx-por{position:absolute;left:0;top:0;width:124px;height:165px;border-radius:7px;transition:box-shadow .2s}
#qx .qx-por img{width:100%;height:100%;display:block;pointer-events:none}
#qx .qx-por .qx-hblank{border-radius:7px}
#qx .qx-st.qx-cur .qx-por,#qx .qx-dash.qx-cur .qx-porbig{box-shadow:0 0 0 2px #e8c55a,0 0 14px 2px rgba(232,197,90,.55)}
#qx .qx-st.qx-sel .qx-por,#qx .qx-dpor.qx-sel .qx-por{cursor:pointer;box-shadow:0 0 0 2px #7fd08f,0 0 14px 2px rgba(127,208,143,.65)}
#qx .qx-st.qx-sel{cursor:pointer}
#qx .qx-st.qx-picked .qx-por,#qx .qx-dpor.qx-picked .qx-por{box-shadow:0 0 0 3px #f6d873,0 0 20px 4px rgba(246,216,115,.9)}
#qx .qx-st.qx-dim,#qx .qx-dpor.qx-dim{opacity:.4;filter:grayscale(.5)}
#qx .qx-sdead .qx-por>img{filter:grayscale(1) brightness(.5);transition:filter .9s}
#qx .qx-sflip .qx-por>img{filter:brightness(.42) sepia(.5)}
#qx .qx-fdtag{position:absolute;left:50%;top:30%;transform:translateX(-50%);background:rgba(10,8,5,.75);color:#e8d8b8;font-size:13px;padding:1px 8px;border-radius:3px;white-space:nowrap}
#qx .qx-sdying .qx-por{animation:qxdy .9s infinite alternate}
@keyframes qxdy{from{box-shadow:0 0 0 1px #8a1a10}to{box-shadow:0 0 0 3px #ff4a3a,0 0 20px rgba(255,60,40,.85)}}
#qx .qx-scol{position:absolute;left:128px;top:0;width:24px;display:flex;flex-direction:column;align-items:center;gap:5px}
#qx .qx-sid .qx-idc{width:24px;height:36px;border-radius:3px}
#qx .qx-gems{display:flex;gap:3px;align-items:center}
#qx .qx-gems.qx-gv{flex-direction:column}
#qx .qx-gems i{display:block;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffb39c,#d4321c 55%,#6a120a);box-shadow:0 0 0 1px #2a0805,0 1px 2px rgba(0,0,0,.6)}
#qx .qx-gems.qx-glow2 i{background:radial-gradient(circle at 35% 30%,#ffe0a0,#e08a1c 55%,#6e3a0a)}
#qx .qx-gems.qx-glow1 i{background:radial-gradient(circle at 35% 30%,#fff0b0,#e0b020 55%,#6e5008);animation:qxlow 1.2s infinite alternate}
@keyframes qxlow{to{box-shadow:0 0 0 1px #2a0805,0 0 8px 2px rgba(255,200,60,.7)}}
#qx .qx-gems i.qx-gx{background:#2a231b;box-shadow:inset 0 0 0 1px #5a4a3a;animation:none}
#qx .qx-gems i.qx-glose{animation:qxglose .9s ease-out both}
@keyframes qxglose{0%{background:#ff5a3a;transform:scale(1.6);box-shadow:0 0 12px 4px rgba(255,80,40,.9)}60%{background:#ff5a3a;transform:scale(.8)}100%{transform:scale(1)}}
#qx .qx-gems i.qx-ggain{animation:qxggain .9s ease-out both}
@keyframes qxggain{0%{transform:scale(.2);box-shadow:0 0 14px 6px rgba(140,255,160,.9)}100%{transform:scale(1)}}
#qx .qx-gems b{font-size:11px;color:#f0b8a8;font-weight:normal}
#qx .qx-jz{display:flex;flex-direction:column;gap:3px}
#qx .qx-jchip{width:22px;height:22px;border-radius:4px;background:linear-gradient(#6a4a8a,#3a2650);border:1px solid #c0a2e0;color:#f6eeff;font-size:12px;line-height:20px;text-align:center;overflow:hidden;white-space:nowrap;box-shadow:0 1px 3px #000}
#qx .qx-jchip.qx-jbig{width:auto;padding:0 8px;font-size:12px}
#qx .qx-sfoot{position:absolute;left:0;top:168px;width:152px;display:flex;gap:5px;align-items:center;font-size:12px;color:#d8c9a6;white-space:nowrap;overflow:hidden}
#qx .qx-sdist{font-size:11px;padding:0 4px;border-radius:3px;background:#2c2618;color:#a89a7a}
#qx .qx-sdist.qx-inr{color:#ffd9a0;background:#5a3a18}
#qx .qx-sph{color:#ff8a6a;font-weight:bold}
#qx .qx-sdy{color:#ff5a4a;font-weight:bold}
#qx .qx-think{position:absolute;left:0;top:187px;width:124px;height:5px;border-radius:3px;background:#2a2218;overflow:hidden;opacity:0;transition:opacity .2s}
#qx .qx-think.qx-on{opacity:1}
#qx .qx-think i{display:block;height:100%;background:linear-gradient(90deg,#d23a20,#f0a040);transform-origin:0 50%}
#qx .qx-hcnt{position:absolute;left:-6px;bottom:2px;display:flex;align-items:flex-end;z-index:2}
#qx .qx-hcnt img{width:18px;height:27px;border-radius:2px;box-shadow:0 1px 3px #000}
#qx .qx-hcnt b{margin-left:-7px;margin-bottom:-3px;background:#1a140c;border:1px solid #c9a032;color:#ffe2a0;font:bold 11px/14px Georgia,serif;min-width:17px;text-align:center;border-radius:8px;padding:0 3px}
#qx .qx-ebars{position:absolute;left:5px;right:5px;bottom:27px;display:flex;flex-direction:column;gap:1px;z-index:1}
#qx .qx-chain{position:absolute;left:8%;top:40%;width:84%;filter:drop-shadow(0 0 2px #000);pointer-events:none}
/* 军备横条 */
#qx .qx-ebar{position:relative;display:flex;align-items:center;gap:5px;height:34px;padding:0 9px;border-radius:4px;background:linear-gradient(180deg,#414146 0%,#2a2a2e 45%,#1b1b1e 100%);border:1px solid #a86e34;box-shadow:inset 0 1px 0 rgba(255,214,160,.2),inset 0 0 0 1px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.6);color:#f0d6a8;font-size:14px;white-space:nowrap;overflow:hidden;transition:transform .12s,box-shadow .12s}
#qx .qx-eic{display:inline-flex;width:18px;height:18px;color:#d99a54;flex:none}
#qx .qx-eic svg{width:100%;height:100%}
#qx .qx-enum{min-width:20px;font:bold 14px/1 Georgia,serif;color:#ffcf86;text-align:center;flex:none}
#qx .qx-ename{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
#qx .qx-ers{font:bold 13px/1 Georgia,serif;color:#e8e2d6;flex:none}
#qx .qx-ers.qx-rsred2{color:#ff7d6a}
#qx .qx-ebm{height:17px;padding:0 3px;gap:2px;font-size:10.5px;border-radius:2px;background:linear-gradient(180deg,rgba(66,66,70,.96),rgba(26,26,29,.96))}
#qx .qx-ebm .qx-eic{width:11px;height:11px}
#qx .qx-ebm .qx-enum{min-width:12px;font-size:10.5px}
#qx .qx-ebm .qx-ers{font-size:10px}
#qx .qx-eempty{opacity:.32;border-style:dashed}
#qx .qx-ebar.qx-sel{cursor:pointer;border-color:#7fd08f;box-shadow:0 0 8px rgba(127,208,143,.6)}
#qx .qx-ebar.qx-picked{border-color:#f6d873;box-shadow:0 0 10px #f6d873;transform:translateX(10px)}
#qx .qx-appear{animation:qxappear .45s ease-out}
@keyframes qxappear{from{opacity:0;transform:translateX(-14px)}}
/* 阵亡 */
#qx .qx-dov{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;z-index:3;perspective:500px}
#qx .qx-dov img{width:50%;height:auto;border-radius:4px;box-shadow:0 2px 10px #000;pointer-events:auto}
#qx .qx-dov span{color:#ff6a5a;font-weight:bold;font-size:15px;border:2px solid #c0302a;padding:0 8px;transform:rotate(-12deg);background:rgba(20,8,6,.65);letter-spacing:2px}
#qx .qx-dnew img{animation:qxdflip 1s ease-out both}
@keyframes qxdflip{0%{transform:rotateY(90deg);opacity:0}100%{transform:rotateY(0);opacity:1}}
#qx .qx-dnew span{animation:qxstamp .45s .8s both}
@keyframes qxstamp{0%{opacity:0;transform:rotate(-12deg) scale(2.4)}100%{opacity:1;transform:rotate(-12deg) scale(1)}}
/* 受伤 / 回复 / 技能 */
#qx .qx-por::after{content:"";position:absolute;inset:0;border-radius:7px;opacity:0;pointer-events:none;z-index:4}
#qx .qx-por.qx-hitfx{animation:qxshake var(--qx-d,700ms) ease-out}
#qx .qx-por.qx-hitfx::after{background:radial-gradient(circle,rgba(255,40,20,.6),rgba(200,20,10,.25));animation:qxflash var(--qx-d,700ms) ease-out both}
#qx .qx-por.qx-hfire::after{background:radial-gradient(circle,rgba(255,150,30,.65),rgba(220,60,10,.3))}
#qx .qx-por.qx-hthunder::after{background:radial-gradient(circle,rgba(200,220,255,.75),rgba(90,120,255,.3))}
#qx .qx-por.qx-losefx::after{background:radial-gradient(circle,rgba(160,40,120,.6),rgba(80,10,60,.25));animation:qxflash var(--qx-d,700ms) ease-out both}
#qx .qx-por.qx-healfx::after{background:radial-gradient(circle,rgba(120,255,150,.5),rgba(40,160,70,.2));animation:qxflash var(--qx-d,700ms) ease-out both}
@keyframes qxshake{0%,100%{transform:translate(0,0)}12%{transform:translate(-7px,2px)}26%{transform:translate(6px,-2px)}40%{transform:translate(-5px,1px)}55%{transform:translate(4px,0)}70%{transform:translate(-2px,0)}}
@keyframes qxflash{0%{opacity:0}15%{opacity:1}100%{opacity:0}}
#qx .qx-fxl{position:absolute;left:50%;top:42%;width:0;height:0;pointer-events:none;z-index:6}
#qx .qx-fnum{position:absolute;left:0;top:0;font:bold 32px Georgia,serif;color:#ff4a3a;text-shadow:0 0 5px #000,0 0 2px #000;white-space:nowrap}
#qx .qx-fnum.qx-fheal{color:#7dff9a}
#qx .qx-por.qx-skfx{animation:qxskfx .9s ease-out}
@keyframes qxskfx{0%{box-shadow:0 0 0 0 rgba(185,163,227,0)}30%{box-shadow:0 0 0 4px rgba(200,180,255,.95),0 0 24px 8px rgba(185,163,227,.65)}100%{box-shadow:0 0 0 0 rgba(185,163,227,0)}}
/* 牌堆 / 弃牌堆 / 出牌区 */
#qx .qx-deckp,#qx .qx-pilep{position:absolute;top:290px;display:flex;flex-direction:column;align-items:center;font-size:12px;color:#c8b88e;gap:2px;text-shadow:0 1px 2px #000}
#qx .qx-deckp{left:214px}
#qx .qx-pilep{left:744px}
#qx .qx-deckp img{width:52px;height:78px;border-radius:4px;box-shadow:2px 2px 0 #3a2c1c,4px 4px 0 #2a2014,0 4px 10px rgba(0,0,0,.6)}
#qx .qx-pileimg{width:52px;height:78px;border-radius:4px;opacity:.8;box-shadow:2px 2px 0 #3a2c1c,0 4px 10px rgba(0,0,0,.6)}
#qx .qx-pic.qx-pilec{width:52px;height:78px;border-radius:4px}
#qx .qx-pile0{border:1px dashed #5a4a30;box-shadow:none}
#qx .qx-ctr{position:absolute;left:0;top:276px;width:1012px;height:158px;pointer-events:none}
#qx .qx-cc{position:absolute;top:0;width:86px;pointer-events:auto;transition:filter .4s}
#qx .qx-pic.qx-cpic{width:86px;height:131px}
#qx .qx-ccap{font-size:11px;color:#efe0bc;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;text-shadow:0 1px 2px #000,0 0 3px #000}
#qx .qx-cc.qx-stale{filter:brightness(.5)}
#qx .qx-cmsg{position:absolute;left:220px;width:570px;top:282px;text-align:center;font-size:14px;line-height:1.3;color:#fff1cf;pointer-events:none;opacity:0;z-index:50}
#qx .qx-cmsg div{display:table;margin:1px auto;background:rgba(18,13,7,.72);padding:1px 12px;border-radius:4px;text-shadow:0 1px 2px #000}
/* 提示与按钮 */
#qx .qx-prompt{position:absolute;left:200px;width:612px;top:432px;height:110px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px;pointer-events:none;z-index:25}
#qx .qx-ptxt{font-size:16px;color:#ffe9b8;text-shadow:0 0 4px #000;background:rgba(20,14,8,.78);border:1px solid #6b5a33;border-radius:5px;padding:5px 16px;max-width:672px;text-align:center}
#qx .qx-ptxt.qx-pwait{background:none;border:none;color:#bba67a;font-size:14px}
#qx .qx-ptxt.qx-pwait:empty{display:none}
#qx .qx-pbtns{display:flex;gap:12px;pointer-events:auto}
#qx .qx-pbtns .qx-btn{min-width:92px;padding:7px 18px;font-size:15px;background:linear-gradient(#5a4524,#33260f);border:1px solid #c9a032;color:#ffe9b8;border-radius:5px;box-shadow:0 2px 6px rgba(0,0,0,.6)}
#qx .qx-pbtns .qx-btn.qx-primary{background:linear-gradient(#9a7024,#5a3c10)}
#qx .qx-pbtns .qx-btn[data-act=cancel],#qx .qx-pbtns .qx-btn[data-act=no]{background:linear-gradient(#8a2e1c,#4a160c);border-color:#d07050}
#qx .qx-pbtns .qx-btn:disabled{opacity:.4}
/* 操作区 */
#qx .qx-dj{position:absolute;left:10px;top:4px;height:24px;display:flex;gap:4px}
#qx .qx-deq{position:absolute;left:8px;top:32px;width:202px;display:flex;flex-direction:column;gap:5px}
#qx .qx-deq .qx-ebar{height:41px}
#qx .qx-dhand{position:absolute;left:240px;top:46px;height:156px}
#qx .qx-hslot{position:absolute;top:0}
#qx .qx-hslot .qx-pic{width:100px;height:152px;transition:transform .12s,box-shadow .12s,filter .12s}
#qx .qx-hslot .qx-pic.qx-sel{cursor:pointer}
#qx .qx-hslot:hover{z-index:60!important}
#qx .qx-hslot .qx-pic.qx-sel:hover{transform:translateY(-8px)}
#qx .qx-hslot .qx-pic.qx-picked{transform:translateY(-28px);box-shadow:0 0 0 2px #f6d873,0 0 16px 4px rgba(246,216,115,.85)}
#qx .qx-hslot .qx-pic.qx-dim{opacity:1;filter:brightness(.42)}
#qx .qx-dsk{position:absolute;left:844px;top:16px;width:110px;display:flex;flex-direction:column;gap:7px}
#qx .qx-skb{display:block;font:inherit;font-size:14px;padding:6px 4px;text-align:center;border-radius:5px;background:linear-gradient(#3a3350,#262036);border:1px solid #6a5a98;color:#d8ccf4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:default}
#qx .qx-skb.qx-ska{cursor:pointer;background:linear-gradient(#6c50b4,#3d2a78);border-color:#c9b4ff;color:#fff;box-shadow:0 0 9px rgba(160,130,255,.55)}
#qx .qx-skb.qx-ska:hover{filter:brightness(1.15)}
#qx .qx-skb.qx-ska.qx-on{background:linear-gradient(#e6b848,#a8761c);border-color:#ffe39a;color:#2a1a00}
#qx .qx-skb.qx-sklock{background:linear-gradient(#3e2c22,#2a1c15);border-color:#8a5a40;color:#f0c8a8}
#qx .qx-skb.qx-skused{opacity:.4;text-decoration:line-through}
#qx .qx-dpor{position:absolute;left:962px;top:8px;width:156px;height:208px}
#qx .qx-por.qx-porbig{position:relative;width:156px;height:208px;border-radius:8px}
#qx .qx-dph{position:absolute;left:50%;top:-6px;transform:translateX(-50%);background:linear-gradient(#b02c1c,#6a140c);color:#ffe0c0;font-size:13px;padding:1px 12px;border-radius:3px;border:1px solid #e0a040;white-space:nowrap;z-index:7}
#qx .qx-dside{position:absolute;left:1126px;top:12px;width:150px;display:flex;gap:10px}
#qx .qx-dside .qx-gems i{width:16px;height:16px}
#qx .qx-dcol{display:flex;flex-direction:column;gap:6px}
#qx .qx-dside .qx-idc{width:56px;height:84px;border-radius:5px}
#qx .qx-dinfo{font-size:12px;line-height:1.6;color:#c8b88e;white-space:nowrap}
#qx .qx-zside{max-width:min(90vw,360px);max-height:86vh;overflow:auto;background:rgba(24,19,12,.95);border:1px solid var(--qx-gold);border-radius:8px;padding:12px 14px;font-size:14px;line-height:1.6;color:#eadfc4;cursor:default}
#qx .qx-zside h4{margin:0 0 6px;color:var(--qx-gold);font-size:16px}
#qx .qx-zside b{color:#d8cff0}
#qx .qx-zoom{gap:18px;flex-wrap:wrap}
/* ── 座位框 ── */
#qx .qx-st{height:auto}
#qx .qx-sw{position:relative;border-radius:6px}
#qx .qx-sc{position:absolute;left:0;top:0;width:1086px;height:1448px;transform-origin:0 0}
#qx .qx-sart{position:absolute;left:151px;top:11px;width:922px;height:1424px;overflow:hidden;background:#120e09}
#qx .qx-sc .qx-sart img{width:100%;height:100%;display:block;transition:filter .9s}
#qx .qx-sblank{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:360px;color:#5a4a30;background:repeating-linear-gradient(45deg,#231d14 0 60px,#1d1811 60px 120px)}
#qx .qx-sc .qx-sfr{position:absolute;left:0;top:0;width:1086px;height:1448px;pointer-events:none}
#qx .qx-sstrip{position:absolute;left:24px;top:182px;width:112px;height:1248px;pointer-events:none}
#qx .qx-sc .qx-semb{position:absolute;left:-6px;top:-10px;width:168px;height:180px;pointer-events:none}
#qx .qx-snm{position:absolute;left:24px;top:222px;width:112px;max-height:1068px;overflow:hidden;color:#28160a;pointer-events:none;text-shadow:0 2px 0 rgba(255,246,222,.55)}
#qx .qx-snzh{writing-mode:vertical-rl;text-orientation:upright;font:900 92px/112px "Noto Serif SC","Noto Serif CJK SC","Source Han Serif SC","Songti SC",serif;letter-spacing:26px;display:flex;align-items:center;justify-content:flex-start}
#qx .qx-snen{writing-mode:vertical-rl;transform:rotate(180deg);font-family:Cinzel,"Trajan Pro",Georgia,serif;font-weight:700;letter-spacing:4px;line-height:112px;text-align:right;height:1068px}
#qx .qx-shc{position:absolute;left:32px;top:1312px;width:96px;height:110px;border-radius:12px;background:rgba(26,20,14,.94);border:4px solid #deb464;display:flex;align-items:center;justify-content:center;font:700 64px/1 Cinzel,Georgia,serif;color:#faecc8}
#qx .qx-srail{position:absolute;left:954px;top:594px;width:120px;height:842px}
#qx .qx-sc .qx-star{position:absolute;left:7px;width:106px;height:106px}
#qx .qx-hptxt{position:absolute;left:0;top:160px;width:120px;display:flex;flex-direction:column;align-items:center;gap:22px;font-family:Cinzel,Georgia,serif;font-weight:700;line-height:1}
#qx .qx-hptxt b{font-size:62px;color:#fae296}#qx .qx-hptxt i{font-style:normal;font-size:50px;color:#c8aa6e}#qx .qx-hptxt span{font-size:62px;color:#e6d2aa}
#qx .qx-star.qx-glose{animation:qxsl .9s ease-out both}
@keyframes qxsl{0%{content:normal;filter:brightness(2.2) drop-shadow(0 0 30px #ff6a3a);transform:scale(1.5)}100%{filter:none;transform:scale(1)}}
#qx .qx-star.qx-ggain{animation:qxsg .9s ease-out both}
@keyframes qxsg{0%{transform:scale(.2);filter:drop-shadow(0 0 40px #9fffb0) brightness(1.8)}100%{transform:scale(1)}}
#qx .qx-star.qx-glose2{animation:qxsl .9s ease-out both}#qx .qx-star.qx-ggain2{animation:qxsg .9s ease-out both}
#qx .qx-sc .qx-sbadge{position:absolute;left:931px;top:25px;width:128px;height:128px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.7))}
#qx .qx-sbadge.qx-bclick{cursor:pointer}
#qx .qx-sbadge.qx-bclick:hover{filter:drop-shadow(0 0 16px #ffe08a) brightness(1.1)}
#qx .qx-sbar{position:absolute;left:157px;width:789px;height:78px;border-radius:10px;background:rgba(30,26,24,.89);border:3px solid #c47c3e;box-shadow:0 4px 10px rgba(0,0,0,.55);display:flex;align-items:center;color:#f5e8cd;white-space:nowrap;overflow:hidden;padding:0 14px 0 10px;gap:12px;font-size:54px}
#qx .qx-sbi{display:inline-flex;width:54px;height:54px;color:#e1aa64;flex:none}
#qx .qx-sbi svg{width:100%;height:100%}
#qx .qx-sbn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;font-weight:bold}
#qx .qx-sbv{flex:none;min-width:70px;text-align:center;font:700 54px/1 Cinzel,Georgia,serif;color:#ffd678}
#qx .qx-sbr{flex:none;font:700 52px/1 "DejaVu Serif Condensed",Georgia,serif;color:#ece2d2}
#qx .qx-sbr.qx-rsred2{color:#e2403a}
#qx .qx-sc .qx-chain{left:20%;top:44%;width:70%}
#qx .qx-sc .qx-fdtag{font-size:90px;padding:6px 40px;top:40%;left:56%}
#qx .qx-dstamp{position:absolute;left:300px;top:560px;color:#ff6a5a;font-weight:bold;font-size:150px;border:16px solid #c0302a;padding:10px 60px;transform:rotate(-14deg);background:rgba(20,8,6,.6);letter-spacing:16px;white-space:nowrap}
#qx .qx-dstamp.qx-dnew{animation:qxstamp2 .5s .5s both}
@keyframes qxstamp2{0%{opacity:0;transform:rotate(-14deg) scale(2.4)}100%{opacity:1;transform:rotate(-14deg) scale(1)}}
#qx .qx-sdead .qx-sart img,#qx .qx-dpor.qx-sdead .qx-sart img{filter:grayscale(1) brightness(.5)}
#qx .qx-sflip .qx-sart img{filter:brightness(.42) sepia(.5)}
#qx .qx-st .qx-jz{position:absolute;left:-12px;top:60px;z-index:3}
#qx .qx-st .qx-sfoot{width:auto}
#qx .qx-st .qx-por,#qx .qx-dpor .qx-por{width:auto;height:auto}
#qx .qx-dpor{left:958px;top:0;width:168px;height:224px}
#qx .qx-dside{left:1136px}
#qx .qx-bmenu{position:absolute;z-index:80;display:flex;flex-direction:column;gap:6px;padding:6px;background:rgba(20,15,9,.92);border:1px solid #c9a032;border-radius:24px;box-shadow:0 6px 18px rgba(0,0,0,.7)}
#qx .qx-bmenu img{width:32px;height:32px;cursor:pointer;border-radius:50%}
#qx .qx-bmenu img:hover{box-shadow:0 0 0 2px #ffe08a,0 0 10px #ffe08a}
/* 装备技能选中：右滑 + 两道顺时针流光 */
#qx .qx-deq .qx-ebar{overflow:hidden;isolation:isolate}
#qx .qx-deq .qx-ebar>*{position:relative;z-index:2}
#qx .qx-ebar.qx-eqcan{border-color:#c9a8ff;box-shadow:0 0 8px rgba(185,150,255,.55);cursor:pointer}
#qx .qx-ebar.qx-eqon{transform:translateX(16px);border-color:transparent;cursor:pointer;box-shadow:0 0 14px rgba(255,214,120,.55)}
#qx .qx-ebar.qx-eqon::before{content:"";position:absolute;left:50%;top:50%;width:260px;height:260px;margin:-130px 0 0 -130px;background:conic-gradient(from 0deg,transparent 0deg 120deg,rgba(255,236,170,.15) 150deg,#fff6c8 176deg,transparent 180deg 300deg,rgba(255,236,170,.15) 330deg,#fff6c8 356deg,transparent 360deg);animation:qxspin 1.8s linear infinite;z-index:0}
#qx .qx-ebar.qx-eqon::after{content:"";position:absolute;inset:2px;border-radius:3px;background:linear-gradient(180deg,#4a4438 0%,#2e2a24 45%,#1d1b18 100%);z-index:1}
@keyframes qxspin{to{transform:rotate(360deg)}}
#qx .qx-ebar.qx-eqask{border-color:#ffe08a;box-shadow:0 0 12px rgba(255,224,138,.8);animation:qxask 1s infinite alternate}
@keyframes qxask{to{box-shadow:0 0 4px rgba(255,224,138,.3)}}
/* ── v3：录屏式交互 ── */
#qx .qx-board{transition:none}
#qx .qx-stage .qx-side{z-index:35;box-shadow:-6px 0 16px rgba(0,0,0,.5)}
#qx .qx-side.qx-hide{display:none}
#qx .qx-logtab{position:absolute;right:4px;top:8px;width:26px;padding:10px 0;writing-mode:vertical-rl;font:inherit;font-size:13px;letter-spacing:2px;background:linear-gradient(90deg,#3a2f1c,#241c10);color:#e8d29a;border:1px solid #6b5a33;border-radius:5px;cursor:pointer;z-index:36}
#qx .qx-logtab.qx-on{right:262px}
#qx .qx-board::after{content:"";position:absolute;inset:0;background:rgba(6,4,2,.55);opacity:0;pointer-events:none;transition:opacity .25s;z-index:22}
#qx .qx-board.qx-dimall::after{opacity:1}
#qx .qx-fly{will-change:transform,opacity}
#qx .qx-fstack img{position:absolute;top:0;width:52px;height:78px;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.6)}
/* 牌堆 / 弃牌堆 / 出牌区 */
#qx .qx-deckp,#qx .qx-pilep{top:296px}
#qx .qx-ctr{top:282px;height:160px}
#qx .qx-cc{position:absolute;top:0;width:86px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.6))}
#qx .qx-ccap{position:absolute;top:135px;text-align:center;font-size:12px;color:#f3e4bf;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px #000,0 0 4px #000}
#qx .qx-jmark{position:absolute;left:50%;top:-14px;transform:translateX(-50%);font:900 40px/1 Georgia,serif;text-shadow:0 0 4px #000,0 2px 4px #000;animation:qxjm .35s ease-out both;z-index:5}
#qx .qx-jok{color:#5ce26a}#qx .qx-jno{color:#ff4a3a}
@keyframes qxjm{from{transform:translateX(-50%) scale(2.2);opacity:0}}
/* 中央提示条 */
#qx .qx-prompt{top:452px;width:660px;height:auto;display:flex;justify-content:center;z-index:30;pointer-events:none}
#qx .qx-ptxt{font-size:15px;line-height:1.45;color:#f6e7bf;background:linear-gradient(90deg,rgba(14,10,6,0),rgba(14,10,6,.86) 12%,rgba(14,10,6,.86) 88%,rgba(14,10,6,0));border:none;border-top:1px solid rgba(201,160,50,.55);border-bottom:1px solid rgba(201,160,50,.55);border-radius:0;padding:6px 60px;min-width:420px;max-width:660px;text-align:center;text-shadow:0 1px 2px #000}
#qx .qx-ptxt.qx-pwait{color:#d8c79c}
#qx .qx-ptxt:empty{display:none}
/* 操作区按钮列 */
#qx .qx-dhand{left:224px;top:48px}
#qx .qx-dbtn{position:absolute;left:722px;top:40px;width:112px;display:flex;flex-direction:column;gap:9px}
#qx .qx-dbt{font:inherit;font-size:16px;letter-spacing:2px;padding:8px 0;border-radius:6px;cursor:pointer;color:#ffeec4;background:linear-gradient(#2d5a64,#173740);border:1px solid #8cc7d0;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 2px 6px rgba(0,0,0,.6)}
#qx .qx-dbt.qx-primary{background:linear-gradient(#2f6e7a,#164650)}
#qx .qx-dbt[data-act=cancel],#qx .qx-dbt[data-act=no]{background:linear-gradient(#8a3420,#4c170c);border-color:#e09060}
#qx .qx-dbt[data-act=end]{background:linear-gradient(#8a6a24,#4c3610);border-color:#e0c060}
#qx .qx-dbt[data-act=recast]{background:linear-gradient(#5a4a7a,#2c2240);border-color:#b8a0e8}
#qx .qx-dbt:disabled{opacity:.35;cursor:default;filter:grayscale(.6)}
#qx .qx-dbt:not(:disabled):hover{filter:brightness(1.18)}
/* 阶段小签 */
#qx .qx-phpill{position:absolute;z-index:8;font-size:12px;padding:1px 9px;border-radius:9px;white-space:nowrap;color:#fff;box-shadow:0 1px 4px rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.55)}
#qx .qx-st .qx-phpill{right:-8px;top:46%}
#qx .qx-dpor .qx-phpill{left:50%;top:-6px;transform:translateX(-50%)}
#qx .qx-ph-start,#qx .qx-ph-judge{background:linear-gradient(#7a5ab4,#4a2c7a)}
#qx .qx-ph-draw{background:linear-gradient(#3a8a5a,#1c5a34)}
#qx .qx-ph-play{background:linear-gradient(#2a8ab4,#145a7a)}
#qx .qx-ph-discard{background:linear-gradient(#c8a03a,#8a6a14);color:#2a1c00}
#qx .qx-ph-finish{background:linear-gradient(#c84a3a,#8a1c14)}
#qx .qx-phnew{animation:qxph .45s ease-out}
@keyframes qxph{0%{transform:scale(1.8);opacity:0}100%{transform:scale(1);opacity:1}}
#qx .qx-dpor .qx-phnew{animation:qxph2 .45s ease-out}
@keyframes qxph2{0%{transform:translateX(-50%) scale(1.8);opacity:0}100%{transform:translateX(-50%) scale(1);opacity:1}}
/* 出牌大字 */
#qx .qx-stamp{position:absolute;left:0;top:0;font:900 96px/1 "Noto Serif SC","Noto Serif CJK SC","Songti SC",serif;white-space:nowrap;pointer-events:none;z-index:9;-webkit-text-stroke:2px rgba(30,10,4,.9);text-shadow:0 0 18px rgba(0,0,0,.8),0 4px 0 rgba(0,0,0,.6)}
#qx .qx-stamp.qx-sten{font:900 34px/1 Cinzel,Georgia,serif;letter-spacing:2px;-webkit-text-stroke:1px rgba(30,10,4,.9)}
#qx .qx-st-strike{color:#e8261c}#qx .qx-st-fire{color:#ff8a1c}#qx .qx-st-thunder{color:#8cc4ff}
#qx .qx-st-parry{color:#38d05a}#qx .qx-st-remedy{color:#ff7aa0}#qx .qx-st-grog{color:#f0b040}#qx .qx-st-veto{color:#c8a8ff}
/* 技能牌匾 */
#qx .qx-skplq{position:absolute;left:50%;bottom:6px;z-index:12;white-space:nowrap;font-size:15px;font-weight:bold;letter-spacing:2px;color:#ffe9a8;padding:3px 14px;background:linear-gradient(#5a3a10,#2a1a06);border:2px solid #e0b850;border-radius:4px;box-shadow:0 0 12px rgba(240,200,90,.6),0 2px 6px #000;text-shadow:0 1px 2px #000;pointer-events:none}
#qx .qx-por.qx-skfx{animation:qxskfx 1s ease-out}
/* 立绘特写 */
#qx .qx-splash{position:absolute;top:300px;width:340px;pointer-events:none;z-index:60;text-align:center;filter:drop-shadow(0 10px 30px rgba(0,0,0,.85))}
#qx .qx-splash img{width:100%;display:block}
#qx .qx-splash div{margin-top:-6px;font-size:26px;font-weight:900;letter-spacing:6px;color:#ffe9a8;text-shadow:0 0 12px rgba(240,180,60,.9),0 2px 3px #000}
/* 展示 */
#qx .qx-fan{position:absolute;display:flex;gap:4px;z-index:50;padding:5px;background:rgba(14,10,6,.82);border:1px solid #c9a032;border-radius:6px;transform-origin:50% 50%}
/* 阵亡牌匾（座位框坐标） */
#qx .qx-dplq{position:absolute;left:200px;top:560px;width:820px;padding:50px 0;text-align:center;background:linear-gradient(90deg,rgba(40,36,32,0),rgba(40,36,32,.92) 15%,rgba(40,36,32,.92) 85%,rgba(40,36,32,0));border-top:10px solid #8a8070;border-bottom:10px solid #8a8070;pointer-events:none}
#qx .qx-dplq b{font-size:120px;letter-spacing:12px;color:#e8e2d6;text-shadow:0 6px 10px #000;white-space:nowrap}
#qx .qx-dplq.qx-dnew{animation:qxdp .7s ease-out both}
@keyframes qxdp{0%{opacity:0;transform:scaleX(.2)}100%{opacity:1;transform:scaleX(1)}}
/* 装备条：加粗、紧凑 */
#qx .qx-sbar{height:150px;border-radius:14px;border-width:5px;padding:0 18px 0 14px;gap:14px;font-size:82px;font-weight:bold;background:linear-gradient(180deg,rgba(66,62,58,.95),rgba(28,25,23,.95));box-shadow:0 6px 14px rgba(0,0,0,.6),inset 0 4px 0 rgba(255,214,160,.18)}
#qx .qx-sbi{width:78px;height:78px}
#qx .qx-sbn{flex:0 1 auto;font-weight:900;letter-spacing:0}
#qx .qx-sbv{min-width:0;font-size:76px}
#qx .qx-sbr{font-size:76px;margin-left:auto}
/* 技能说明浮窗 */
#qx .qx-tipbox{position:absolute;width:330px;z-index:90;display:none;pointer-events:none;background:rgba(20,15,9,.95);border:1px solid #c9a032;border-radius:7px;padding:10px 12px;font-size:13px;line-height:1.6;color:#eadfc4;box-shadow:0 6px 20px rgba(0,0,0,.8)}
#qx .qx-tipbox.qx-on{display:block}
#qx .qx-tipbox h4{margin:0 0 4px;color:#f0d080;font-size:15px}
#qx .qx-tipbox h4 span{font-size:12px;color:#a8986e;margin-left:8px;font-weight:normal}
#qx .qx-tipbox p{margin:4px 0}
#qx .qx-tipbox b{color:#ffd77a}
#qx .qx-tipbox i{font-style:normal;font-size:11px;color:#ffcfb8;background:#5a2a20;border-radius:3px;padding:0 4px;margin-left:4px}
/* 选牌窗口 */
#qx .qx-modal{align-items:center;padding-top:0;background:rgba(0,0,0,.45)}
#qx .qx-cwbox{max-width:640px;background:linear-gradient(#2e2416,#1c160d);border:2px solid #8a6a30;box-shadow:0 0 0 1px #000,0 10px 40px rgba(0,0,0,.85);padding:12px 16px 14px}
#qx .qx-cwbox h3{text-align:center;font-size:18px;letter-spacing:4px;margin:0 0 10px;color:#f0d080}
#qx .qx-cwin{display:flex;flex-direction:column;gap:8px}
#qx .qx-crow{display:flex;gap:8px;background:rgba(0,0,0,.35);border:1px solid #4a3a20;border-radius:5px;padding:6px;min-height:105px;flex:1}
#qx .qx-crow2{display:flex;gap:8px}
#qx .qx-clab{writing-mode:vertical-rl;letter-spacing:4px;color:#c8a860;font-size:14px;padding:4px 2px;border-right:1px solid #4a3a20}
#qx .qx-cards{display:flex;flex-wrap:wrap;gap:5px;align-items:center}
#qx .qx-cwbox .qx-back{cursor:pointer;transition:transform .12s}
#qx .qx-cwbox .qx-back:hover,#qx .qx-cwbox .qx-pic:hover{transform:translateY(-5px);box-shadow:0 0 0 2px #7fd08f,0 0 10px #7fd08f}

/* ── v4 ── */
/* 点数花色 */
#qx .qx-rs{gap:.6cqw;padding:0 .6cqw}
#qx .qx-rs .qx-rk{font:700 14.5cqw/1 "Noto Serif","Noto Serif SC","Times New Roman",Georgia,serif;color:#1b1714;letter-spacing:0;display:inline-block}
#qx .qx-rs .qx-rk2{transform:scaleX(.78);margin:0 -1.6cqw;letter-spacing:-.04em}
#qx .qx-rs .qx-su{font:400 12.5cqw/1 "DejaVu Sans","Segoe UI Symbol","Noto Sans Symbols2",sans-serif;font-style:normal;color:#1b1714}
#qx .qx-rs.qx-rsr .qx-rk,#qx .qx-rs.qx-rsr .qx-su{color:#b0141c}
#qx .qx-tiny .qx-rs .qx-rk{font-size:16cqw}#qx .qx-tiny .qx-rs .qx-su{font-size:14cqw}
/* 没有牌堆和弃牌堆 */
#qx .qx-deckp,#qx .qx-pilep{display:none}
#qx .qx-ctr{top:270px;height:180px}
#qx .qx-cc{transition:opacity .35s,transform .35s}
#qx .qx-cc.qx-ccfade{opacity:0;transform:translateY(-8px) scale(.96)}
#qx .qx-cc .qx-ccap{position:static;width:auto;margin-top:2px;font-size:11px;max-width:120px;margin-left:-17px;margin-right:-17px}
#qx .qx-astag{position:absolute;left:50%;top:96px;transform:translateX(-50%);white-space:nowrap;font-size:12px;font-weight:bold;color:#fff3c8;background:rgba(90,30,10,.92);border:1px solid #e0a040;border-radius:3px;padding:0 6px;box-shadow:0 2px 6px #000}
/* 提示与按钮：在出牌区下方、手牌区上方 */
#qx .qx-prompt{top:438px;flex-direction:column;align-items:center;gap:8px}
#qx .qx-pbtns{display:flex;gap:14px;pointer-events:auto}
#qx .qx-pbtns .qx-dbt{min-width:104px;padding:7px 16px}
/* 座位框：阵营色更明确，名字更清楚 */
#qx .qx-sc .qx-sstrip{box-shadow:inset 0 0 0 3px rgba(0,0,0,.25)}
#qx .qx-snm{left:24px;width:112px;text-shadow:0 2px 0 rgba(255,240,210,.5)}
#qx .qx-snzh{font-weight:900;letter-spacing:18px;line-height:112px;-webkit-text-stroke:1px rgba(0,0,0,.35)}
#qx .qx-snm.qx-sndk{text-shadow:0 0 10px rgba(0,0,0,.9),0 3px 2px rgba(0,0,0,.9);-webkit-text-stroke:1.5px rgba(0,0,0,.55)}
#qx .qx-snen{font-weight:900;letter-spacing:6px}
#qx .qx-sc .qx-semb{left:-42px;top:-49px;width:240px;height:258px}
#qx .qx-sc .qx-sbadge{left:869px;top:22px;width:190px;height:190px;z-index:6;pointer-events:auto}
#qx .qx-sc .qx-sbadge.qx-bclick{cursor:pointer}
#qx .qx-sc .qx-somen{position:absolute;top:27px;width:140px;height:140px;border-radius:50%;z-index:5;filter:drop-shadow(0 6px 10px rgba(0,0,0,.7));cursor:help;transition:opacity .4s}
#qx .qx-srail{top:809px;height:627px}
#qx .qx-hpgrp{position:absolute;left:0;bottom:12px;width:120px;display:flex;flex-direction:column;align-items:center;gap:14px}
#qx .qx-hpgrp .qx-star{position:static}
#qx .qx-hpgrp .qx-hptxt{position:static;gap:16px}
/* 阵亡：身份牌 + 阵亡框 */
#qx .qx-dead{position:absolute;left:330px;top:300px;width:560px;display:flex;flex-direction:column;align-items:center;gap:26px;pointer-events:none;z-index:7}
#qx .qx-dead img{width:330px;border-radius:24px;box-shadow:0 14px 40px rgba(0,0,0,.85)}
#qx .qx-dead .qx-dplq{position:static;width:560px;padding:26px 0}
#qx .qx-dead .qx-dplq b{font-size:110px}
#qx .qx-dead.qx-dnew img{animation:qxdflip 1s ease-out both}
#qx .qx-dead.qx-dnew .qx-dplq{animation:qxdp .6s .5s ease-out both}
/* 自己的操作区：立绘顶到右侧 */
#qx .qx-dside,#qx .qx-dj,#qx .qx-dbtn{display:none}
#qx .qx-dhand{left:224px;top:52px}
#qx .qx-hslot.qx-dragging{transition:none;cursor:grabbing}
#qx .qx-hslot{transition:left .18s ease}
#qx .qx-think.qx-indet i{animation:qxind 1.6s linear infinite}
@keyframes qxind{from{transform:scaleX(1)}to{transform:scaleX(0)}}
#qx .qx-dsk{left:992px;top:16px;width:112px}
#qx .qx-dpor{left:1110px;top:0;width:168px;height:224px}
#qx .qx-myroman{position:absolute;left:-26px;bottom:4px;font:700 16px/1 Georgia,serif;color:#e8d29a;text-shadow:0 1px 2px #000}
#qx .qx-roman{font:700 15px/1 Georgia,"Times New Roman",serif;color:#f0dca0;letter-spacing:1px}
/* 悬停说明：跟随鼠标、淡入淡出 */
#qx .qx-tipbox{display:block;opacity:0;visibility:hidden;transition:opacity .18s ease,visibility 0s linear .18s;width:320px}
#qx .qx-tipbox.qx-on{opacity:1;visibility:visible;transition:opacity .18s ease,visibility 0s}
#qx .qx-tipbox.qx-tipimg{width:auto;padding:4px;background:none;border:none;box-shadow:none}
#qx .qx-tipcard img{width:230px;display:block;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.85)}
#qx .qx-tagi{font-style:normal;font-size:11px;color:#ffcfb8;background:#5a2a20;border-radius:3px;padding:0 4px;margin:0 3px}
/* 弹出窗口：拼点 / 联军盛宴 */
#qx .qx-wins{position:absolute;left:0;top:0;width:1280px;height:760px;z-index:42;pointer-events:none}
#qx .qx-win{pointer-events:auto;width:max-content;max-width:640px}
#qx .qx-win{position:absolute;left:640px;top:168px;transform:translate(-50%,-50%);background:linear-gradient(#2e2416,#1c160d);border:2px solid #8a6a30;border-radius:8px;box-shadow:0 0 0 1px #000,0 10px 40px rgba(0,0,0,.85);padding:10px 16px 14px;animation:qxwin .25s ease-out;transition:opacity .3s}
#qx .qx-win.qx-wfade{opacity:0}
@keyframes qxwin{from{opacity:0;transform:translate(-50%,-50%) scale(.9)}}
#qx .qx-win h3{margin:0 0 4px;text-align:center;font-size:18px;letter-spacing:4px;color:#f0d080}
#qx .qx-wtip{text-align:center;font-size:12px;color:#c8b88e;margin-bottom:8px}
#qx .qx-frow{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:560px}
#qx .qx-fcell{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:12px;color:#f0dca0}
#qx .qx-fcell.qx-ftaken .qx-pic{filter:brightness(.4) grayscale(.4)}
#qx .qx-fcell.qx-fcan .qx-pic{cursor:pointer;box-shadow:0 0 0 2px #7fd08f,0 0 10px #7fd08f}
#qx .qx-fcell.qx-fcan .qx-pic:hover{transform:translateY(-5px)}
#qx .qx-pdrow{display:flex;align-items:center;gap:22px;padding:4px 10px}
#qx .qx-pdside{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px}
#qx .qx-pdname{font-size:15px;color:#f6e7bf;font-weight:bold}
#qx .qx-pdempty{width:86px;height:131px;border:1px dashed #6b5a33;border-radius:6px}
#qx .qx-pdvs{font:900 26px Georgia,serif;color:#e0b850}
#qx .qx-pwin b{color:#5ce26a}#qx .qx-plose b{color:#ff4a3a}
#qx .qx-plose .qx-pic{filter:brightness(.55)}

/* ── v5 ── */
#qx .qx-ccap{display:none}
#qx .qx-cc .qx-ccap{display:block;position:absolute;left:-30px;right:-30px;top:154px;margin:0;max-width:none;text-align:center;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#qx .qx-pic.qx-cpic{width:100px;height:152px}
#qx .qx-cc{width:100px}
#qx .qx-ctr{top:262px}
#qx .qx-astag{top:112px;font-size:13px;padding:1px 8px}
#qx .qx-pic.qx-flyc{width:100px;height:152px}
#qx .qx-flyb{width:100px;height:152px;border-radius:6px;display:block;box-shadow:0 2px 8px rgba(0,0,0,.6)}
#qx .qx-jmark{top:50%;left:50%;transform:translate(-50%,-50%);font:900 92px/1 "DejaVu Sans","Segoe UI Symbol",sans-serif;-webkit-text-stroke:3px rgba(0,0,0,.75);text-shadow:0 0 10px rgba(0,0,0,.9);z-index:6}
@keyframes qxjm{from{transform:translate(-50%,-50%) scale(2.2);opacity:0}}
/* 座位下沿：罗马数字 / 阶段 / 天兆 */
#qx .qx-sfoot{position:absolute;left:0;height:34px;display:flex;align-items:center;justify-content:space-between;gap:4px;overflow:visible}
#qx .qx-roman{flex:none;min-width:22px}
#qx .qx-phase{position:absolute;left:50%;top:0;transform:translateX(-50%);height:24px;width:110px;overflow:visible}
#qx .qx-phl{position:absolute;left:0;right:0;top:0;text-align:center;font:900 15px/24px "Noto Serif SC","Songti SC",Georgia,serif;letter-spacing:2px;white-space:nowrap;-webkit-text-stroke:.4px rgba(0,0,0,.6);text-shadow:0 0 4px #000,0 1px 2px #000}
#qx .qx-phc-start,#qx .qx-phc-finish{color:#c8c8c8}
#qx .qx-phc-judge{color:#c690ff}#qx .qx-phc-draw{color:#6cb8ff}#qx .qx-phc-play{color:#ff5a48}#qx .qx-phc-discard{color:#62e080}
#qx .qx-phin{animation:qxphin .26s ease-out both}
#qx .qx-phout{animation:qxphout .22s ease-in both}
@keyframes qxphin{from{opacity:0;transform:translateX(-26px)}to{opacity:1;transform:none}}
@keyframes qxphout{from{opacity:1}to{opacity:0;transform:translateX(14px)}}
#qx .qx-omks{display:flex;flex-direction:row-reverse;gap:3px;margin-left:auto}
#qx .qx-omk{position:relative;width:34px;height:34px;cursor:help;flex:none;animation:qxappear2 .3s ease-out}
#qx .qx-omk img{width:100%;height:100%;border-radius:50%;display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.8))}
#qx .qx-omk b{position:absolute;right:-3px;bottom:-3px;min-width:15px;height:15px;border-radius:8px;background:#f0d080;color:#2a1a00;font:bold 11px/15px Georgia,serif;text-align:center;box-shadow:0 1px 3px #000}
@keyframes qxappear2{from{opacity:0;transform:scale(.4)}}
#qx .qx-myomks{position:absolute;left:226px;top:486px;display:flex;gap:6px;z-index:28}
#qx .qx-myomks .qx-omk{width:42px;height:42px}
#qx .qx-st .qx-phpill{display:none}
/* 自己的阶段：装备栏上方 */
#qx .qx-dash>.qx-phase{left:10px;top:4px;transform:none;width:200px;height:24px}
#qx .qx-dash>.qx-phase .qx-phl{text-align:left}
#qx .qx-deq{top:32px}
/* 阵营条 */
#qx .qx-snm.qx-sndk{text-shadow:0 0 12px rgba(0,0,0,.95),0 4px 3px rgba(0,0,0,.95);-webkit-text-stroke:2px rgba(0,0,0,.6)}
/* 酒 */
#qx .qx-drunk{position:absolute;left:180px;top:200px;padding:6px 26px;border-radius:40px;background:linear-gradient(#c8641c,#7a2c08);border:6px solid #ffd27a;color:#fff3d0;font:900 72px/1.1 "Noto Serif SC",serif;box-shadow:0 8px 20px rgba(0,0,0,.7)}
/* 亮出的牌 */
#qx .qx-shown{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9;animation:qxshown .3s ease-out}
#qx .qx-pic.qx-showc{width:100px;height:152px;box-shadow:0 0 0 2px #f0d080,0 8px 24px rgba(0,0,0,.85)}
@keyframes qxshown{from{opacity:0;transform:translate(-50%,-40%) scale(.85)}}
/* 阵亡：身份牌放大，居于整个框中间 */
#qx .qx-dead{left:0;top:0;width:1086px;height:1448px;justify-content:center;gap:34px}
#qx .qx-dead img{width:560px;border-radius:30px;pointer-events:auto}
#qx .qx-dead .qx-dplq{width:700px}
/* 装备横插 */
#qx .qx-slidein{animation:qxslidein .42s cubic-bezier(.2,.7,.2,1) both}
@keyframes qxslidein{from{transform:translateX(-115%);opacity:0}to{transform:none;opacity:1}}
#qx .qx-sno{position:absolute;left:24px;width:112px;top:1196px;height:104px;display:flex;align-items:center;justify-content:center;font:700 66px/1 Georgia,"Times New Roman",serif;color:#ffe6a8;text-shadow:0 0 8px #000,0 3px 4px #000;z-index:3;letter-spacing:-2px;pointer-events:none}
#qx .qx-fbbtn{border-color:#8a6a2a;color:#f3d688}
body .qx-fbk{position:fixed;font-family:"Noto Serif SC",Georgia,serif;right:18px;bottom:18px;z-index:2000;width:340px;background:#1c1710;border:2px solid #c9a032;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.7);padding:10px 12px;display:flex;flex-direction:column;gap:8px;color:#efe3c4;font-size:13px}
body .qx-fbkh{display:flex;justify-content:space-between;align-items:center;font-weight:bold;color:#f3d688;font-size:15px}
body .qx-fbkh button{background:none;border:0;color:#d8c8a0;font-size:20px;cursor:pointer}
body .qx-fbk textarea{height:84px;resize:vertical;background:#0f0c08;color:#f5ead0;border:1px solid #6a5426;border-radius:6px;padding:6px;font:13px/1.4 inherit}
body .qx-fbktip{color:#a8987a;font-size:12px;line-height:1.4}
body .qx-fbkrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
body .qx-fbk button.qx-fbkb{background:#2b2316;color:#f3d688;border:1px solid #8a6a2a;border-radius:6px;padding:5px 12px;cursor:pointer;font:inherit}
body .qx-fbk button.qx-fbkb.qx-fbkp{background:#6a4e1a;border-color:#e0b850}
body .qx-fbkn{color:#c8b88a;font-size:12px}
#qx.qx-full{position:fixed;inset:0;z-index:9000;background:#120e09;overflow:hidden;padding:4px 8px;box-sizing:border-box}
#qx.qx-full .qx-note{display:none}
/* v7：装备条——左侧数值代替图标（防具保留盾），名称居中 */
#qx .qx-fit{display:inline-block;white-space:nowrap;transform-origin:center center}
#qx .qx-ename,#qx .qx-sbn{text-align:center}
#qx .qx-eic.qx-eval{width:26px;height:auto;justify-content:flex-start;font:bold 15px/1 Georgia,serif;color:#ffcf86}
#qx .qx-ebar .qx-eic{width:26px}
#qx .qx-ers{min-width:26px;text-align:right}
#qx .qx-sbi{width:118px!important;height:auto;justify-content:flex-start}
#qx .qx-sbi svg{width:78px;height:78px}
#qx .qx-sbi.qx-sbval{font:700 92px/1 Cinzel,Georgia,serif;color:#ffd678}
#qx .qx-sbn{flex:1 1 auto!important}
#qx .qx-sbr{min-width:118px;text-align:right;margin-left:0!important}
#qx .qx-st.qx-tgt .qx-por,#qx .qx-dpor.qx-tgt .qx-por{box-shadow:0 0 0 2px #ff5a3c,0 0 16px 4px rgba(255,64,40,.7);animation:qx-tgtp 1s ease-in-out infinite alternate}
@keyframes qx-tgtp{from{box-shadow:0 0 0 2px #ff5a3c,0 0 10px 2px rgba(255,64,40,.5)}to{box-shadow:0 0 0 3px #ff7a5a,0 0 22px 6px rgba(255,64,40,.8)}}
#qx .qx-dash.qx-cur .qx-dpor .qx-por{box-shadow:0 0 0 2px #e8c55a,0 0 14px 2px rgba(232,197,90,.55)}
#qx .qx-rvc.qx-rvoff{opacity:.42;filter:grayscale(.6);pointer-events:none}
/* 阵亡（参照无名杀 $dieflip）：武将牌向外偏移并歪斜，保持该姿态 */
#qx .qx-st .qx-por{transition:transform .6s cubic-bezier(.3,1.4,.5,1)}
/* 阶段标签：旧的先滑出，新的再滑入，避免两行字叠在一起 */
#qx .qx-phase .qx-phout{animation-duration:.2s!important}
#qx .qx-phase .qx-phin{animation-delay:.18s!important}
#qx .qx-ctr{transition:opacity .2s}
#qx .qx-stage.qx-haswin .qx-ctr{opacity:0}
/* 响应读条：60 秒走完的速度 */
#qx .qx-think.qx-on i{animation:qxthink60 60s linear forwards}
@keyframes qxthink60{from{transform:scaleX(1)}to{transform:scaleX(0)}}
/* v9：中央出牌区——当前结算的牌高亮，其它变暗；淡出 0.5 秒（缩小 + 透明） */
#qx .qx-ctr .qx-cc{transition:opacity .5s ease,transform .5s ease,filter .3s}
#qx .qx-ctr .qx-cc.qx-ccdim{opacity:.5;transform:scale(.95)}
#qx .qx-ctr .qx-cc.qx-cchi{opacity:1;transform:none;filter:drop-shadow(0 0 10px rgba(255,214,120,.55)) drop-shadow(0 4px 8px rgba(0,0,0,.6))}
#qx .qx-ctr .qx-cc.qx-ccfade{opacity:0!important;transform:scale(.8)!important}
/* 参照无名杀：中央的牌在新牌加入时平滑地重新排开；弃置的牌变暗 */
#qx .qx-ctr .qx-cc{transition:left .5s ease,opacity .5s ease,transform .5s ease,filter .3s!important}
#qx .qx-ctr .qx-cc.qx-ccdisc .qx-cpic{filter:brightness(.55) saturate(.7)}
/* v8：装备条——左侧数值与盾牌同框居中；数字用等高（lining）字形，所有内容上下居中 */
#qx .qx-ebar{align-items:center}
#qx .qx-ebar .qx-eic,#qx .qx-eic.qx-eval{width:24px;height:24px;flex:none;display:inline-flex;align-items:center;justify-content:center;line-height:1}
#qx .qx-ebar .qx-eic svg{width:18px;height:18px;display:block}
#qx .qx-eic.qx-eval{font:700 16px/1 "Times New Roman","Noto Serif","Liberation Serif",serif;font-variant-numeric:lining-nums;color:#ffcf86}
#qx .qx-ename{line-height:1;display:flex;align-items:center;justify-content:center;align-self:stretch}
#qx .qx-ers{line-height:1;display:inline-flex;align-items:center;justify-content:flex-end;font-family:"Times New Roman","Noto Serif","Liberation Serif",serif;font-variant-numeric:lining-nums}
#qx .qx-sbar{align-items:center}
#qx .qx-sbi,#qx .qx-sbi.qx-sbval{width:110px!important;height:110px!important;display:inline-flex;align-items:center;justify-content:center;flex:none;line-height:1}
#qx .qx-sbi svg{width:80px;height:80px;display:block}
#qx .qx-sbi.qx-sbval{font:700 90px/1 "Times New Roman","Noto Serif","Liberation Serif",serif;font-variant-numeric:lining-nums;color:#ffd678}
#qx .qx-sbn{line-height:1;display:flex;align-items:center;justify-content:center;align-self:stretch}
#qx .qx-sbr{line-height:1;min-width:110px;display:inline-flex;align-items:center;justify-content:flex-end;font-family:"Times New Roman","Noto Serif","Liberation Serif",serif;font-variant-numeric:lining-nums}
#qx .qx-sbar.qx-slidein{animation-duration:.45s}
/* 右键大卡：跟随鼠标 */
#qx .qx-peek{position:fixed;left:0;top:0;z-index:200;pointer-events:none;display:flex;gap:12px;align-items:flex-start;opacity:0;transform:scale(.96);transition:opacity .14s ease,transform .14s ease}
#qx .qx-peek.qx-on{opacity:1;transform:none}
#qx .qx-pkcard{position:relative;height:min(78vh,620px);aspect-ratio:750/1140;container-type:inline-size;border-radius:12px;overflow:hidden;box-shadow:0 14px 50px rgba(0,0,0,.85)}
#qx .qx-pkcard img{width:100%;height:100%;display:block}
#qx .qx-pkcard .qx-nat{right:6%;top:12%;width:14%}
#qx .qx-pkhero{height:min(70vh,560px);aspect-ratio:750/1000;filter:drop-shadow(0 14px 40px rgba(0,0,0,.85))}
#qx .qx-pkhero img{width:100%;height:100%;display:block}
#qx .qx-pkside{width:340px;max-height:min(70vh,560px);overflow:hidden;background:rgba(22,17,10,.96);border:1px solid #c9a032;border-radius:8px;padding:12px 14px;font-size:14px;line-height:1.65;color:#eadfc4;box-shadow:0 10px 30px rgba(0,0,0,.8)}
#qx .qx-pkside h4{margin:0 0 6px;color:#f0d080;font-size:17px}
#qx .qx-pkside h4 span{font-size:12px;color:#a8986e;margin-left:8px;font-weight:normal}
#qx .qx-pkside p{margin:6px 0}
#qx .qx-pkside b{color:#ffd77a}
#qx .qx-pkside i{font-style:normal;font-size:11px;color:#ffcfb8;background:#5a2a20;border-radius:3px;padding:0 4px;margin-left:4px}
#qx .qx-tipbox{display:none!important}
/* 弹出窗口：统一样式，位于中央，足够大 */
#qx .qx-modal{position:fixed;inset:0;align-items:center;justify-content:center;padding:0;background:rgba(0,0,0,.4);z-index:120}
#qx .qx-box{position:relative;width:min(92vw,760px);min-height:min(56vh,400px);max-width:none;max-height:92vh;overflow:auto;display:flex;flex-direction:column;background:radial-gradient(ellipse at 50% 0%,#3c2f1c 0%,#221a10 60%,#18120b 100%);border:2px solid #b08a3c;border-radius:10px;box-shadow:0 0 0 4px #1a1209,0 0 0 5px #6b5328,0 18px 60px rgba(0,0,0,.85);padding:16px 22px 18px}
#qx .qx-box.qx-mwide{width:min(94vw,860px)}
#qx .qx-box.qx-mhero{width:min(96vw,1100px)}
#qx .qx-mtitle{display:flex;align-items:center;gap:14px;justify-content:center;margin:2px 0 6px;color:#f3d688;font:900 21px/1.3 "Noto Serif SC",Georgia,serif;letter-spacing:4px;text-shadow:0 2px 3px #000}
#qx .qx-mtitle i{flex:1;max-width:160px;height:2px;background:linear-gradient(90deg,transparent,#c9a032)}
#qx .qx-mtitle i:last-child{background:linear-gradient(90deg,#c9a032,transparent)}
#qx .qx-msub{text-align:center;color:#c8b88e;font-size:13px;margin-bottom:8px}
#qx .qx-mbody{flex:1;display:flex;flex-direction:column;justify-content:center;gap:12px}
#qx .qx-mfoot{display:flex;justify-content:center;gap:16px;margin-top:14px}
#qx .qx-mfoot .qx-dbt{min-width:120px}
#qx .qx-dbt.qx-cancel{background:linear-gradient(#8a3420,#4c170c);border-color:#e09060}
#qx .qx-pic.qx-mcard{width:100px;height:152px;cursor:pointer;transition:transform .12s,box-shadow .12s}
#qx .qx-pic.qx-mcard.qx-picked{transform:translateY(-10px);box-shadow:0 0 0 3px #f6d873,0 0 16px #f6d873}
#qx .qx-pic.qx-mcard.qx-dim{filter:brightness(.4);cursor:default}
#qx .qx-mcards{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
#qx .qx-mback{width:100px;height:152px;cursor:pointer;transition:transform .12s,box-shadow .12s;border-radius:6px}
#qx .qx-mback img{width:100%;height:100%;border-radius:6px;display:block;box-shadow:0 2px 6px rgba(0,0,0,.6)}
#qx .qx-mback:hover,#qx .qx-modal .qx-pic.qx-mcard:not(.qx-dim):hover{transform:translateY(-6px);box-shadow:0 0 0 2px #7fd08f,0 0 12px #7fd08f}
#qx .qx-mback.qx-picked{transform:translateY(-10px);box-shadow:0 0 0 3px #f6d873,0 0 16px #f6d873}
#qx .qx-crow{display:flex;gap:10px;background:rgba(0,0,0,.32);border:1px solid #4a3a20;border-radius:6px;padding:8px;min-height:172px;flex:1}
#qx .qx-crow2{display:flex;gap:10px}
#qx .qx-clab{writing-mode:vertical-rl;letter-spacing:6px;color:#d8b868;font-size:15px;font-weight:bold;padding:4px 4px;border-right:1px solid #4a3a20;text-align:center}
#qx.qx-l-en .qx-clab{text-orientation:mixed;letter-spacing:2px;font-size:14px}
#qx.qx-l-en .qx-mtitle{letter-spacing:1px}
#qx .qx-cards{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
#qx .qx-cnone{color:#6a5a40;font-size:20px;padding:0 10px}
#qx .qx-mopts{display:flex;flex-direction:column;gap:12px;align-items:stretch;max-width:560px;margin:0 auto;width:100%}
#qx .qx-mopt{font:inherit;font-size:16px;padding:12px 18px;text-align:left;cursor:pointer;color:#f3e6c4;background:linear-gradient(#3a2f1c,#241c10);border:1px solid #8a6a30;border-radius:6px}
#qx .qx-mopt:hover{border-color:#f0d080;background:linear-gradient(#4a3c22,#2c2214);box-shadow:0 0 10px rgba(240,208,128,.35)}
#qx .qx-arow{display:flex;gap:10px;background:rgba(0,0,0,.32);border:1px solid #4a3a20;border-radius:6px;padding:8px}
#qx .qx-aslots{display:flex;gap:8px;flex-wrap:wrap}
#qx .qx-aslot{width:104px;height:156px;border:1px dashed #5a4a2a;border-radius:7px;display:flex;align-items:center;justify-content:center;transition:background .12s}
#qx .qx-aslot.qx-ahover{background:rgba(240,208,128,.18);border-color:#f0d080}
#qx .qx-acard{cursor:grab;touch-action:none}
#qx .qx-aghost{position:fixed;z-index:300;pointer-events:none;transform:rotate(-3deg) scale(1.04);filter:drop-shadow(0 10px 20px rgba(0,0,0,.8))}
#qx .qx-modal .qx-heroes{max-height:none}
/* 窗口（拼点 / 联军盛宴）：位于牌桌中央 */
#qx .qx-win{left:620px;top:250px;min-width:520px;min-height:300px;padding:14px 22px 18px;display:flex;flex-direction:column;background:radial-gradient(ellipse at 50% 0%,#3c2f1c 0%,#221a10 60%,#18120b 100%);border:2px solid #b08a3c;border-radius:10px;box-shadow:0 0 0 4px #1a1209,0 0 0 5px #6b5328,0 18px 60px rgba(0,0,0,.85);animation:qxwin .22s ease-out}
#qx .qx-win h3{display:none}
#qx .qx-pic.qx-wcard{width:100px;height:152px}
#qx .qx-frow{max-width:680px;gap:12px}
#qx .qx-fcell{min-height:0}
#qx .qx-fcell>span{font:bold 14px Georgia,serif;color:#f0dca0;min-height:18px}
#qx .qx-fwrap{border-radius:6px;transition:transform .12s,box-shadow .12s}
#qx .qx-fcell.qx-fcan .qx-fwrap{cursor:pointer;box-shadow:0 0 0 2px #7fd08f,0 0 12px #7fd08f}
#qx .qx-fcell.qx-fcan .qx-fwrap:hover{transform:translateY(-6px)}
#qx .qx-fcell.qx-fcan .qx-pic{box-shadow:none}
#qx .qx-fcell.qx-ftaken .qx-pic{filter:brightness(.45) grayscale(.3)}
#qx .qx-pdrow{flex:1;justify-content:center;gap:40px}
#qx .qx-pdslot{width:104px;height:156px;border:1px dashed #6b5a33;border-radius:7px;display:flex;align-items:center;justify-content:center;perspective:600px}
#qx .qx-pdempty{width:auto;height:auto;border:none;color:#7a6a48;font-size:13px}
#qx .qx-pdback img{width:100px;height:152px;border-radius:6px;display:block;animation:qxappear2 .25s ease-out}
#qx .qx-pdface{animation:qxflip .42s ease-out both}
@keyframes qxflip{0%{transform:rotateY(90deg)}100%{transform:rotateY(0)}}
#qx .qx-pdname{font-size:16px}
#qx .qx-pdvs{font-size:34px}
#qx .qx-pdres{min-height:30px;font:900 22px/30px "Noto Serif SC",serif;letter-spacing:4px;color:#c8b88e}
#qx .qx-pdres.qx-pwin{color:#5ce26a;animation:qxjm2 .35s ease-out both}
#qx .qx-pdres.qx-plose{color:#d0c4a8;animation:qxjm2 .35s ease-out both}

/* ── v6 ── */
#qx .qx-dead img{height:auto!important}
#qx .qx-sc .qx-sart img{animation:qxheroin .5s ease-out}
@keyframes qxheroin{from{opacity:0;filter:brightness(2)}}
#qx .qx-phc-prepare,#qx .qx-phc-finish{color:#cfcfcf}
#qx .qx-phase{width:120px}
#qx .qx-phl{font-size:14px;letter-spacing:1px}
#qx .qx-phin{animation:qxphin .34s ease-out both}
#qx .qx-phout{animation:qxphout .3s ease-in both}
#qx .qx-omks.qx-omv{position:absolute;display:flex;flex-direction:column-reverse;justify-content:flex-start;gap:4px;margin:0;z-index:4;width:34px}
#qx .qx-cards.qx-nowrap{flex-wrap:nowrap;gap:8px}
#qx .qx-cards.qx-nowrap>*+*{margin-left:var(--ov,0px)}
#qx .qx-box.qx-mcw{width:min(96vw,900px)}
#qx .qx-crow2{flex-direction:column}
#qx .qx-crow{min-height:168px}
#qx .qx-intro{position:absolute;left:0;top:0;perspective:900px;z-index:70}
#qx .qx-inr{position:relative;width:100%;height:100%;transform-style:preserve-3d}
#qx .qx-inr img{position:absolute;inset:0;width:100%;height:100%;border-radius:14px;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 14px 40px rgba(0,0,0,.85)}
#qx .qx-inr .qx-inb{transform:rotateY(180deg)}
#qx .qx-fstack img{width:100px;height:152px;border-radius:6px}
#qx .qx-flyom{width:100%;height:100%;border-radius:50%;filter:drop-shadow(0 4px 10px rgba(0,0,0,.8))}
#qx .qx-reveal{min-width:720px}
#qx .qx-reveal .qx-aslots,#qx .qx-modal .qx-aslots{flex-wrap:nowrap}
#qx .qx-reveal .qx-arow{margin-top:8px}
#qx .qx-rvc{border-radius:6px}
#qx .qx-rvcan{cursor:grab;touch-action:none}
#qx .qx-rvcan:hover{box-shadow:0 0 0 2px #7fd08f,0 0 12px #7fd08f}
#qx .qx-rvdrop{border-color:#8a7442;background:rgba(240,208,128,.06)}
#qx .qx-phl{display:inline-block;left:50%;right:auto;transform:translateX(-50%);padding:0 10px;border-radius:11px;background:rgba(12,9,5,.82);box-shadow:0 0 0 1px rgba(255,255,255,.12),0 2px 6px rgba(0,0,0,.6);font-size:14px;line-height:22px}
#qx .qx-phin{animation:qxphin2 .34s ease-out both}
#qx .qx-phout{animation:qxphout2 .3s ease-in both}
@keyframes qxphin2{from{opacity:0;transform:translateX(calc(-50% - 28px))}to{opacity:1;transform:translateX(-50%)}}
@keyframes qxphout2{from{opacity:1;transform:translateX(-50%)}to{opacity:0;transform:translateX(calc(-50% + 16px))}}
#qx .qx-dash>.qx-phase .qx-phl{left:0;transform:none}
#qx .qx-dash>.qx-phase .qx-phin{animation:qxphin3 .34s ease-out both}
#qx .qx-dash>.qx-phase .qx-phout{animation:qxphout3 .3s ease-in both}
@keyframes qxphin3{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:none}}
@keyframes qxphout3{from{opacity:1}to{opacity:0;transform:translateX(16px)}}
#qx .qx-phc-play{color:#ff6a56}#qx .qx-phc-judge{color:#d0a0ff}#qx .qx-phc-draw{color:#7cc4ff}#qx .qx-phc-discard{color:#6ee88c}


@keyframes qxjm2{from{transform:scale(1.8);opacity:0}}
`;

  // 把 el 的内容就地更新成 html：保留相同的节点，避免整块重建导致闪烁
  function mkey(n) { if (n.nodeType !== 1) return null; const a = n.getAttribute; const k = n.getAttribute('data-hid') || n.getAttribute('data-cid') || n.getAttribute('data-id') || n.getAttribute('data-seat') || n.getAttribute('data-opt') || n.getAttribute('data-arr') || n.getAttribute('data-mk'); return k == null ? null : n.tagName + '|' + (n.className || '').split(' ')[0] + '|' + k; }
  function morphNode(x, y) {
    if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName) { x.replaceWith(y); return; }
    if (x.nodeType !== 1) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; return; }
    for (const at of [...y.attributes]) if (x.getAttribute(at.name) !== at.value) x.setAttribute(at.name, at.value);
    for (const at of [...x.attributes]) if (!y.hasAttribute(at.name)) x.removeAttribute(at.name);
    morphChildren(x, y);
  }
  function morphChildren(a, b) {
    const bn = [...b.childNodes]; const keyed = new Map();
    for (const n of a.childNodes) { const k = mkey(n); if (k && !keyed.has(k)) keyed.set(k, n); }
    let cur = a.firstChild;
    for (const y of bn) {
      const k = mkey(y); let x = null;
      if (k) { x = keyed.get(k) || null; if (x) keyed.delete(k); }
      else if (cur && !mkey(cur)) x = cur;
      if (x) { if (x === cur) cur = cur.nextSibling; else a.insertBefore(x, cur); morphNode(x, y); }
      else a.insertBefore(y, cur);
    }
    while (cur) { const nx = cur.nextSibling; a.removeChild(cur); cur = nx; }
  }
  function morph(el, html) { const t = document.createElement(el.tagName === 'svg' ? 'div' : el.tagName); t.innerHTML = html; morphChildren(el, t); }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  class Table {
    constructor(host, opts) {
      opts = opts || {};
      this.host = host; this.lang = opts.lang || 'zh'; this.T = QT.mk(this.lang);
      this.base = opts.assetBase != null ? opts.assetBase : 'qunxing-cards/qunxing-cards/';
      if (this.base && !this.base.endsWith('/')) this.base += '/';
      if (opts.factions) Object.assign(FACTIONS, opts.factions);
      this.settings = { n: +opts.players || 5, role: opts.role || 'random', speed: opts.speed || 'normal', level: opts.level || 'normal' };
      this.token = 0; this.ui = null; this.g = null; this.me = null;
      if (!Table.escBound) { Table.escBound = true; document.addEventListener('keydown', e => { if (e.key === 'Escape') for (const t of Table.all) { t.closeZoom(); t.closeBadgeMenu(); t.closePeek(); if (t.isFull && !t.realFs && !t.peek) t.toggleFull(); } if (e.key === 'F2') { e.preventDefault(); for (const t of Table.all) t.openFeedback(); } }); }
      Table.all.push(this);
      if (!document.getElementById('qx-style')) { const st = document.createElement('style'); st.id = 'qx-style'; st.textContent = CSS; document.head.appendChild(st); }
      this.shell();
      this.newGame();
    }
    $(sel) { return this.root.querySelector(sel); }

    // ── 外框 ──
    shell() {
      const t = this.T.t;
      this.host.innerHTML = `<div id="qx" class="qx-l-${this.lang}">
        <div class="qx-top">
          <div class="qx-title">${t('title')}</div>
          <label><select data-k="n"><option value="5">${t('players5')}</option><option value="8">${t('players8')}</option></select></label>
          <label>${t('yourRole')} <select data-k="role"><option value="random">${t('random')}</option>${['chancellor', 'keeper', 'insurgent', 'schemer'].map(r => `<option value="${r}">${this.T.role(r)}</option>`).join('')}</select></label>
          <label>${t('level')} <select data-k="level"><option value="easy">${t('easy')}</option><option value="normal">${t('medium')}</option><option value="hard">${t('hard')}</option></select></label>
          <label>${t('speed')} <select data-k="speed"><option value="slow">${t('slow')}</option><option value="normal">${t('normal')}</option><option value="fast">${t('fast')}</option></select></label>
          <button class="qx-btn qx-primary" data-act="new">${t('newGame')}</button>
          <button class="qx-btn qx-rulebtn" data-act="rules">${t('rules')}</button>
          <button class="qx-btn" data-act="lang">${t('lang')}</button>
          <button class="qx-btn qx-fullbtn" data-act="full">${t(this.root && this.root.classList.contains('qx-full') ? 'fullExit' : 'fullOn')}</button>
        </div>
        <div class="qx-note">${t('note')}</div>
        <div class="qx-stagewrap"><div class="qx-stage">
          <div class="qx-board"></div>
          <div class="qx-side qx-hide"><div class="qx-logtitle">${t('log')}</div><div class="qx-log"></div></div>
          <button class="qx-logtab" data-act="log">${t('log')}</button>
          <div class="qx-tipbox"></div>
          <div class="qx-dash"></div>
          <svg class="qx-lines" width="1280" height="760" viewBox="0 0 1280 760"></svg>
          <div class="qx-wins"></div>
          <div class="qx-fx"></div>
        </div></div>
        <div class="qx-modal qx-hidden"></div>
      </div>`;
      this.root = this.host.querySelector('#qx');
      this.root.querySelectorAll('select[data-k]').forEach(s => { s.value = this.settings[s.dataset.k]; s.onchange = () => { this.settings[s.dataset.k] = s.dataset.k === 'n' ? +s.value : s.value; }; });
      this.$('[data-act=new]').onclick = () => this.newGame();
      this.$('[data-act=lang]').onclick = () => { this.lang = this.lang === 'zh' ? 'en' : 'zh'; this.T = QT.mk(this.lang); this.shell(); this.logIdx = 0; this.render(); if (this.g && this.g.over) this.showGameOver(); else if (this.ui && ['chooseCard', 'pick', 'chooseOption', 'chooseSkillOrder', 'chooseHero', 'arrange'].includes(this.ui.req.kind)) this.openChoiceModal(); };
      this.$('[data-act=rules]').onclick = () => this.openRules();
      this.$('[data-act=full]').onclick = () => this.toggleFull();
      if (this.isFull) this.root.classList.add('qx-full');
      this.fit();
      if (!this.resizeBound && typeof window !== 'undefined') { this.resizeBound = true; window.addEventListener('resize', () => this.fit()); }
      this.root.addEventListener('click', e => this.onClick(e));
      this.bindHandDrag(); this.bindArrangeDrag(); this.bindRevealDrag();
      // 右键（手机长按）：在鼠标处弹出大卡，跟随鼠标；离开该区域或左键单击即消失
      const SEL = '[data-zoom],[data-zoomid],[data-zoomhero]';
      this.root.addEventListener('contextmenu', e => { const el = e.target.closest(SEL); if (!el) return; e.preventDefault(); this.openPeek(el, e.clientX, e.clientY); });
      this.root.addEventListener('mousemove', e => { if (this.peek) this.movePeek(e.clientX, e.clientY); });
      this.root.addEventListener('mouseleave', () => this.closePeek());
      let lp = null; this.lpFired = false;
      this.root.addEventListener('touchstart', e => { const el = e.target.closest(SEL); if (!el) return; const tc = e.touches[0]; this.lpFired = false; clearTimeout(lp); lp = setTimeout(() => { this.lpFired = true; this.openPeek(el, tc.clientX, tc.clientY, true); }, 480); }, { passive: true });
      for (const ev of ['touchend', 'touchmove', 'touchcancel']) this.root.addEventListener(ev, () => clearTimeout(lp), { passive: true });
      this.root.addEventListener('click', e => { if (this.lpFired) { this.lpFired = false; e.stopPropagation(); e.preventDefault(); return; } if (this.peek) { this.closePeek(); e.stopPropagation(); e.preventDefault(); } }, true);
    }

    // ── 开局 ──
    newGame(rep) {
      const tok = ++this.token; this.hideSet = null; this.phSet = false; this.fading = null; this.aimed = null; this.lastVetoOf = null;
      if (rep) { this.settings.n = rep.n; this.settings.level = rep.level; this.settings.role = rep.role || 'random'; }
      this.replay = rep ? { answers: rep.answers.slice(), i: 0 } : null;
      const n = this.settings.n;
      const roles = E.ROLESETS[n].slice();
      const seed = rep ? rep.seed : (Math.random() * 1e9) | 0;
      const r = E.rng(seed);
      const rest = roles.slice(1);
      for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
      const arr = ['chancellor', ...rest];
      const want = this.settings.role === 'random' ? arr[Math.floor(r() * n)] : this.settings.role;
      const seats = arr.map((x, i) => x === want ? i : -1).filter(i => i >= 0);
      let meSeat = seats[Math.floor(r() * seats.length)]; if (rep && rep.me != null) meSeat = rep.me;
      this.recs = this.recs || []; this.rec = { seed, n, level: this.settings.level, role: this.settings.role, me: meSeat, lang: this.lang, speed: this.settings.speed, started: new Date().toISOString(), answers: [], notes: [] }; if (!rep) this.recs.push(this.rec); this.recT0 = Date.now();
      this.g = new E.Game({ players: n, seed, roles: arr, fixedRoles: true, selectHeroes: true });
      this.me = meSeat; this.ui = null; this.logIdx = 0;
      this.animIdx = 0; this.phMem = {}; this.phCur = {}; this.marks = {}; this.handOrder = []; this.vetoBars = false; this.thinkBars = null; this.revealWin = null; this.groupDone = false; this.lastPh = null;
      this.closePeek(); this.closeBadgeMenu(); this.closeZoom(); this.pindian = null; this.pdHold = null; this.feast = null; this.shownCards = null; this.centerT = 0; this.locs = null; this.center = []; this.centerIds = new Set(); this.hpPrev = null; this.stepNo = 0; this.thinking = null;
      const fx = this.$('.qx-fx'); if (fx) fx.innerHTML = ''; const ls = this.$('.qx-lines'); if (ls) ls.innerHTML = '';
      this.agents = {}; for (let s = 0; s < n; s++) this.agents[s] = new AI.SmartAgent(seed + s * 7919, this.settings.level);
      this.$('.qx-log').innerHTML = '';
      this.closeModal();
      this.drive(tok);
      // 预载：小卡、座位立绘、武将牌（避免第一次出现时是空白），之后再预载大卡
      if (this.preloadedS !== this.lang) { this.preloadedS = this.lang; const urls = []; const seenK = new Set(); for (const n of Object.keys(D)) { const k = this.artKey(n); if (!seenK.has(k)) { seenK.add(k); urls.push(this.smallSrc(n)); } } for (const k of Object.keys(E.HEROES)) { if (E.HEROES[k].hidden) continue; urls.push(this.seatArtSrc(k), this.heroSrc(k)); } urls.push(this.backSrc('game'), this.backSrc('identity', true), this.idSrc(this.g.p(this.me).role, true), this.idSrc('chancellor', true)); this.preImgs = urls.map(u => { const im = new Image(); im.decoding = 'async'; im.src = u; return im; }); }
      // 预载大卡，右键时立即显示
      if (!this.preloaded || this.preloaded !== this.lang) { this.preloaded = this.lang; const names = Object.keys(D).map(n => this.artKey(n)); const seen = new Set(); let i = 0; const next = () => { if (i >= names.length) return; const n = names[i++]; if (seen.has(n)) return next(); seen.add(n); const im = new Image(); im.onload = im.onerror = () => setTimeout(next, 30); im.src = this.largeSrc(n); }; setTimeout(next, 1500); }
    }
    // 开局：执笔者身份牌亮出并落到执笔者座位；你的身份牌原地旋转后翻开，再落到你的武将牌上
    async intro(tok) {
      const g = this.g, mult = this.animMult(); if (!mult) return;
      this.render();
      const ch = g.players.find(p => p.role === 'chancellor'), me = g.p(this.me);
      await sleep(300); if (tok !== this.token) return;
      await this.introCard(this.idSrc('chancellor', true), null, ch.seat, 0, tok);
      if (tok !== this.token || me.role === 'chancellor') return;
      await this.introCard(this.backSrc('identity', true), this.idSrc(me.role, true), me.seat, 4, tok);
    }
    introCard(front, reveal, seat, spins, tok) {
      return new Promise(async res => {
        const fx = this.$('.qx-fx'); const W = 200, H = 304;
        const el = document.createElement('div'); el.className = 'qx-intro';
        el.innerHTML = `<div class="qx-inr"><img class="qx-inf" src="${front}" alt="">${reveal ? `<img class="qx-inb" src="${reveal}" alt="">` : ''}</div>`;
        el.style.width = W + 'px'; el.style.height = H + 'px';
        const cx = this.bw() / 2 - W / 2, cy = 250 - H / 2;
        el.style.transform = `translate(${cx}px,${cy}px)`; fx.appendChild(el);
        const inr = el.firstElementChild;
        await el.animate([{ opacity: 0, transform: `translate(${cx}px,${cy + 30}px) scale(.7)` }, { opacity: 1, transform: `translate(${cx}px,${cy}px) scale(1)` }], { duration: 420, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' }).finished;
        await sleep(spins ? 300 : 700);
        if (spins) { await inr.animate([{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${spins * 360 + 180}deg)` }], { duration: 1700, easing: 'cubic-bezier(.35,.05,.25,1)', fill: 'both' }).finished; await sleep(700); }
        if (tok !== this.token) { el.remove(); return res(); }
        const pe = this.porEl(seat); const r = pe ? this.rel(pe) : { x: cx, y: cy, w: W, h: H };
        const s1 = r.w / W * 0.7, tx = r.x + r.w / 2 - W / 2, ty = r.y + r.h / 2 - H / 2;
        await el.animate([{ transform: `translate(${cx}px,${cy}px) scale(1)`, opacity: 1 }, { transform: `translate(${tx}px,${ty}px) scale(${s1})`, opacity: 1, offset: .8 }, { transform: `translate(${tx}px,${ty}px) scale(${s1 * .9})`, opacity: 0 }], { duration: 760, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'both' }).finished;
        el.remove();
        const b = pe && pe.querySelector('.qx-sbadge'); if (b) b.animate([{ transform: 'scale(1.6)', filter: 'brightness(2)' }, { transform: 'none', filter: 'none' }], { duration: 500 });
        res();
      });
    }
    async drive(tok) {
      const g = this.g; const gen = g.run(); let r = gen.next();
      await this.intro(tok); if (tok !== this.token) return;
      while (!r.done) {
        if (tok !== this.token) return;
        const req = r.value;
        try { await this.step(tok); } catch (e) { console.error('[qx] step error', e && e.stack || e); this.disp = null; this.stShown = null; this.hideSet = null; try { this.render(); } catch (e2) {} }
        if (tok !== this.token) return;
        let ans;
        if (req.player.seat === this.me) {
          if (req.kind === 'chooseHero' && req.player.role !== 'chancellor' && this.animMult()) { await sleep(900 * this.animMult()); if (tok !== this.token) return; }
          if (this.replay && this.replay.i < this.replay.answers.length) { await sleep(Math.max(150, 500 * this.animMult())); if (tok !== this.token) return; ans = this.replay.answers[this.replay.i++]; }
          else ans = await this.humanDecide(req);
          try { this.rec.answers.push(ans === undefined ? null : JSON.parse(JSON.stringify(ans))); } catch (e) { this.rec.answers.push(null); }
        } else {
          ans = this.agents[req.player.seat].decide(g, req);
          const ms = this.thinkMs(req, ans);
          if (ms) { this.thinking = req; try { this.showThink(req, ms); } catch (e) { console.error('[qx] think error', e && e.stack || e); } await sleep(ms); this.thinking = null; this.clearThinkBars(); if (tok !== this.token) return; }
        }
        if (tok !== this.token) return;
        try { r = gen.next(ans); } catch (e) { console.error(e); this.$('.qx-log').insertAdjacentHTML('beforeend', `<div class="qx-l-death">Engine error: ${esc(e.message)}</div>`); return; }
      }
      this.ui = null; await this.step(tok); if (tok !== this.token) return; this.showGameOver();
    }

    // ── 人类决策 ──
    humanDecide(req) {
      return new Promise(resolve => {
        this.ui = { req, resolve, sel: [], targets: [], skill: null };
        const k = req.kind;
        if (k === 'pick' && req.reason === 'feast' && this.feast) { this.render(); return; }
        if (k === 'pick' && req.multi && this.revealWin && req.reason === this.revealWin.pickReason) { this.ui.btn = []; this.render(); return; }
        if (k === 'chooseCard' || k === 'pick' || k === 'chooseOption' || k === 'chooseSkillOrder' || k === 'chooseHero' || k === 'arrange') this.openChoiceModal();
        this.render();
      });
    }
    // ── 全屏：优先用浏览器全屏；被拦截（如嵌在框架里）时退化为铺满窗口 ──
    toggleFull() {
      const d = document; const on = !this.isFull;
      const apply = v => { this.isFull = v; this.root.classList.toggle('qx-full', v); const b = this.$('[data-act=full]'); if (b) b.textContent = this.T.t(v ? 'fullExit' : 'fullOn'); this.fit(); setTimeout(() => this.fit(), 120); };
      if (!this.fsBound) { this.fsBound = true; d.addEventListener('fullscreenchange', () => { if (!d.fullscreenElement && this.isFull && this.realFs) { this.realFs = false; apply(false); } }); }
      if (on) {
        apply(true);
        if (this.host.requestFullscreen) this.host.requestFullscreen().then(() => { this.realFs = true; this.fit(); }).catch(() => { this.realFs = false; });
      } else {
        if (d.fullscreenElement && d.exitFullscreen) d.exitFullscreen().catch(() => {});
        this.realFs = false; apply(false);
      }
    }
    // ── 问题反馈：记录种子 + 你的每一步操作 + 你写的备注，可原样重放 ──
    openFeedback() {
      const t = this.T.t; let box = document.querySelector('.qx-fbk');
      if (box) { box.querySelector('textarea').focus(); return; }
      box = document.createElement('div'); box.className = 'qx-fbk';
      const cnt = () => (this.recs || []).reduce((a, r) => a + r.notes.length, 0);
      box.innerHTML = `<div class="qx-fbkh">${esc(t('fbTitle'))}<button data-fb="x">×</button></div><textarea placeholder="${esc(t('fbPh'))}"></textarea><div class="qx-fbktip">${esc(t('fbTip'))}</div><div class="qx-fbkrow"><button class="qx-fbkb qx-fbkp" data-fb="save">${esc(t('fbSave'))}</button><span class="qx-fbkn">${esc(t('fbCount', { n: cnt() }))}</span></div><div class="qx-fbkrow"><button class="qx-fbkb" data-fb="dl">${esc(t('fbExport'))}</button><button class="qx-fbkb" data-fb="cp">${esc(t('fbCopy'))}</button></div>`;
      document.body.appendChild(box);
      const ta = box.querySelector('textarea');
      const mark = { ans: this.rec ? this.rec.answers.length : 0, log: this.g ? this.g.logs.length : 0, anim: this.animIdx || 0, ms: Date.now() - (this.recT0 || Date.now()), lang: this.lang, speed: this.settings.speed, turn: this.g && this.g.current ? this.g.current.seat : null, phase: this.g ? this.g.phase : null, waiting: this.ui ? this.ui.req.kind : null };
      box.addEventListener('keydown', e => e.stopPropagation());
      box.onclick = e => {
        const b = e.target.closest('[data-fb]'); if (!b) return; const k = b.dataset.fb;
        if (k === 'x') box.remove();
        else if (k === 'save') { const note = ta.value.trim(); if (!note || !this.rec) return; this.rec.notes.push(Object.assign({ note }, mark)); ta.value = ''; box.querySelector('.qx-fbkn').textContent = t('fbCount', { n: cnt() }); setTimeout(() => box.remove(), 400); }
        else if (k === 'dl') {
          const d = new Date(); const fname = `qx-feedback-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}${String(d.getMinutes()).padStart(2, '0')}.json`; const txt = this.feedbackJSON();
          const blobDl = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = fname; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); };
          const cl = typeof window !== 'undefined' && window.claude && window.claude.use;
          if (cl) window.claude.use('downloads').then(dl => dl ? dl.save({ filename: fname, data: txt }) : blobDl()).catch(() => {}); else blobDl();
        }
        else if (k === 'cp') { const txt = this.feedbackJSON(); const ok = () => { b.textContent = t('fbCopied'); }; if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, () => { ta.value = txt; ta.select(); document.execCommand('copy'); ok(); }); else { ta.value = txt; ta.select(); document.execCommand('copy'); ok(); } }
      };
      setTimeout(() => ta.focus(), 0);
    }
    feedbackJSON() { return JSON.stringify({ v: 1, ua: typeof navigator !== 'undefined' ? navigator.userAgent : '', games: (this.recs || []).filter(r => r.answers.length || r.notes.length) }); }
    answer(a) { const u = this.ui; if (!u) return; this.ui = null; this.closeModal(); u.resolve(a); }

    // ── 主动技 ──
    activeInst() { const u = this.ui; if (!u || !u.active) return null; return this.g.skillList(this.g.p(this.me)).find(s => s.key === u.active.key); }
    activeSpec() {
      const inst = this.activeInst(); if (!inst) return null; const a = inst.def.active; const g = this.g, me = g.p(this.me);
      const ans = { option: this.ui.active.option };
      const tg = typeof a.targets === 'function' ? a.targets(g, me, ans) : (a.targets || { min: 0, max: 0 });
      const max = typeof tg.max === 'function' ? tg.max(g, me) : tg.max;
      return { inst, a, cards: a.cards || { min: 0, max: 0 }, tg: Object.assign({}, tg, { max }), ans };
    }
    activeButtons() {
      const g = this.g, me = g.p(this.me), T = this.T; const out = [];
      for (const inst of g.skillList(me)) {
        const a = inst.def.active; if (!a) continue;
        const opts = a.options ? a.options.map((o, i) => [i, T.option(o)]) : [[null, T.skillName(inst.id)]];
        for (const [opt, label] of opts) {
          if (a.can && !a.can(g, me, inst, opt == null ? undefined : { option: opt })) continue;
          out.push({ key: inst.key, opt, label });
        }
      }
      return out;
    }
    // 当前选择组成的牌（可能是转化的虚拟牌）——由统一询问框架计算
    curCard() { return this.ui ? QXAsk.curCard(this) : null; }
    // 统一询问框架的当前结果：可选牌 / 可选角色 / 确定按钮（每次点击后 render 前重算）
    view() { const u = this.ui; if (!u) return null; return u.view || QXAsk.refresh(this); }
    viewAsList() {
      const u = this.ui; const g = this.g; const me = g.p(this.me); const k = u.req.kind;
      const out = [];
      if (k === 'play') {
        for (const inst of g.viewAsSkills(me, ['strike', 'remedy', 'grog', 'parry', 'veto'], { phase: true })) {
          const v = inst.def.viewAs; const n = v.count || 1;
          const pool = g.cardsIn(me, v.zones || 'h').filter(c => !v.filter || v.filter(g, me, c, {}));
          for (const asName of (v.choices || [null])) {
            let ok = false;
            if (n === 1) ok = pool.some(c => { const vc = g.buildCard(me, { cardIds: [c.id], skill: inst.key, asName }, null, { phase: true }); return vc && g.playable(me, vc); });
            else if (pool.length >= n) { const vc = g.buildCard(me, { cardIds: pool.slice(0, n).map(c => c.id), skill: inst.key, asName }, null, { phase: true }); ok = !!vc && g.playable(me, vc); }
            if (ok) out.push({ key: inst.key, id: inst.id, asName });
          }
        }
        return out;
      }
      const pats = k === 'useStrike' ? ['strike'] : k === 'respond' ? u.req.pattern : null;
      if (!pats) return [];
      return g.viewAsSkills(me, pats, u.req).map(s2 => ({ key: s2.key, id: s2.id, asName: null }));
    }
    // 手牌/装备、角色是否可选：只读统一框架的结果
    cardSelectable(c) { const v = this.view(); return !!v && v.cards.has(c.id); }
    seatSelectable(p) { const v = this.view(); return !!v && v.seats.has(p.seat); }
    onClick(e) {
      if (this.dragJust) return;
      const bm = e.target.closest('[data-bmark]');
      if (bm) { const [st, k] = bm.dataset.bmark.split('|'); this.marks = this.marks || {}; if (k === 'cancel') delete this.marks[+st]; else this.marks[+st] = k; this.closeBadgeMenu(); this.render(); return; }
      const bd = e.target.closest('[data-badge]');
      if (bd) { e.stopPropagation(); e.preventDefault(); if (this.bmenu && this.bmenu.dataset.for === bd.dataset.badge) { this.closeBadgeMenu(); return; } this.openBadgeMenu(+bd.dataset.badge, bd); return; }
      if (this.bmenu) this.closeBadgeMenu();
      const el = e.target.closest('[data-id],[data-seat],[data-act],[data-opt],[data-skill],[data-active],[data-hero],[data-refresh],[data-ord],[data-mul]'); if (!el || !this.root.contains(el)) return;
      if (el.dataset.act && ['new', 'lang'].includes(el.dataset.act)) return;
      if (el.dataset.act === 'log') { this.logOpen = !this.logOpen; this.render(); const lg = this.$('.qx-log'); if (lg) lg.scrollTop = lg.scrollHeight; return; }
      const u = this.ui; const g = this.g;
      if (el.dataset.act === 'again') { this.newGame(); return; }
      if (!u) return;
      const me = g.p(this.me); const k = u.req.kind;
      // 弹窗里的牌 / 选项 / 武将：统一走询问框架的「按钮」
      const bv = el.dataset.opt != null ? el.dataset.opt : el.dataset.mul != null ? el.dataset.mul : el.dataset.hero;
      if (bv != null) { this.pressButton(bv); return; }
      if (el.dataset.active != null) {
        const [key, opt] = el.dataset.active.split('|'); const o = opt === '' ? null : +opt;
        u.active = (u.active && u.active.key === key && u.active.option === o) ? null : { key, option: o };
        u.skill = null; u.sel = []; u.targets = []; this.render(); return;
      }
      if (el.dataset.act) return this.onAction(el.dataset.act);
      if (el.dataset.skill) {
        const [key, asn] = el.dataset.skill.split('|'); const asName = asn || null;
        if (u.skill === key && (u.asName || null) === asName) { u.skill = null; u.asName = null; } else { u.skill = key; u.asName = asName; }
        u.active = null; u.sel = []; u.targets = []; this.render(); return;
      }
      if (el.dataset.ord) { const id = +el.dataset.ord; u.order = u.order || []; const i = u.order.indexOf(id); if (i >= 0) u.order.splice(i, 1); else u.order.push(id); this.openChoiceModal(); return; }
      if (el.dataset.refresh != null) { this.answer({ refresh: +el.dataset.refresh }); return; }
      if (el.dataset.id && el.closest('.qx-deq')) { // 装备技能：点装备栏里的那件装备
        const key = 'e:' + el.dataset.id;
        if ((u.skill === key) || (u.active && u.active.key === key)) { u.skill = null; u.asName = null; u.active = null; u.sel = []; u.targets = []; this.render(); return; }
        if (!u.skill && !u.active) {
          const v = this.viewAsList().find(x => x.key === key);
          const a = k === 'play' ? this.activeButtons().find(x => x.key === key) : null;
          if (v) { u.skill = key; u.asName = v.asName; u.sel = []; u.targets = []; this.render(); return; }
          if (a) { u.active = { key, option: a.opt }; u.sel = []; u.targets = []; this.render(); return; }
        }
      }
      if (el.dataset.id) { const c = g.card(+el.dataset.id); if (c && QXAsk.clickCard(this, c)) this.render(); return; }
      if (el.dataset.seat != null) { const p = g.p(+el.dataset.seat); if (p && QXAsk.clickSeat(this, p)) this.render(); return; }
    }
    pressButton(raw) {
      const r = QXAsk.clickButton(this, raw); if (!r) return;
      if (r === 'auto') { const a = QXAsk.confirm(this); if (a !== undefined) this.answer(a); return; }
      if (this.revealWin && this.ui.req.reason === this.revealWin.pickReason) { this.flipWins(() => this.renderWins()); this.renderTable(); return; }
      if (this.ui.req.reason === 'feast') { this.render(); return; }
      this.openChoiceModal();
    }
    canConfirm() { const v = this.view(); return !!v && v.ok; }
    onAction(act) {
      const u = this.ui; const k = u.req.kind; const ids = () => u.sel.map(c => c.id);
      if (act === 'yes') return this.answer(true);
      if (act === 'skip') return this.answer(null);
      if (act === 'arrangeOk') return this.answer({ top: (u.arr ? u.arr.top : u.req.options).slice(), bottom: u.arr ? u.arr.bottom.slice() : [] });
      if (act === 'csOk' || act === 'multiOk') { if (this.revealWin && u.req.reason === this.revealWin.pickReason) this.revealWin.picks = (u.btn || []).slice(); const a = QXAsk.confirm(this); if (a !== undefined) this.answer(a); return; }
      if (act === 'no') return this.answer(false);
      if (act === 'end') return this.answer({ action: 'end' });
      if (act === 'recast') return this.answer({ action: 'recast', cardIds: ids() });
      if (act === 'cancel') {
        if (k === 'chooseCards') return this.answer([]);
        if (k === 'play') { u.sel = []; u.targets = []; u.skill = null; u.active = null; this.render(); return; }
        return this.answer(null);
      }
      if (act === 'ok') { const a = QXAsk.confirm(this); if (a !== undefined) this.answer(a); }
    }

    // ── 绘制 ──
    render() {
      if (!this.g || !this.g.players[0].role) return;
      if (this.ui) QXAsk.refresh(this);
      this.fit();
      this.renderTable(); this.renderMe(); this.renderLog(); this.renderWins(); this.fitNames(); this.reHide(); this.applyAimed();
      this.drawSelLines();
    }
    // ── 牌面图片 ──
    asset(path) { return this.base + path; }
    artKey(name) { return QC.artKey ? QC.artKey(name) : name; }
    smallSrc(name) { return this.asset(`small/${this.artKey(name)}-${this.lang}.webp`); }
    largeSrc(name) { return this.asset(`large/${this.artKey(name)}-${this.lang}.webp`); }
    idSrc(role, big) { return this.asset(`identity/${role}-${this.lang}${big ? '' : '-small'}.webp`); }
    heroSrc(key, big) { const h = E.HEROES[key]; return this.asset(`heroes/${h.faction}/${key}-${this.lang}${big ? '' : '-small'}.webp`); }
    heroPicHTML(p, size) { // 座位武将牌：小图 + 身份牌角标
      const shown = this.heroShown(p);
      const cls = ['qx-hpic']; if (size === 'big') cls.push('qx-hbig'); if (p.dead) cls.push('qx-hdead'); else if (p.faceDown) cls.push('qx-hflip');
      const pic = shown ? `<img src="${this.heroSrc(p.hero)}" alt="${esc(this.T.heroName(p.hero))}" draggable="false">` : `<div class="qx-hblank">?</div>`;
      return `<div class="${cls.join(' ')}"${shown ? ` data-zoomhero="${p.hero}"` : ''}>${pic}</div><div class="qx-idcor">${this.identityHTML(p, size === 'big' ? '' : 'sm')}</div>`;
    }
    backSrc(kind, big) { return this.asset(`identity/back-${kind}${big ? '' : '-small'}.webp`); }
    catOf(name) { const d = D[name] || {}; return d.type === 'equip' ? 'arsenal' : (d.type || 'basic'); }
    natBadge(name) {
      if (name === 'fire_strike') return `<span class="qx-nat qx-fire"><svg viewBox="0 0 24 24"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3-1-3 0-6 1-9.5z" fill="#f08a24"/><path d="M12 12c.6 1.8 2.4 2.6 2.4 4.6a2.4 2.4 0 0 1-4.8 0c0-1.3.8-2.4 2.4-4.6z" fill="#ffd25a"/></svg></span>`;
      if (name === 'thunder_strike') return `<span class="qx-nat qx-thunder"><svg viewBox="0 0 24 24"><path d="M13.5 2 5 13.5h5.5L9 22l9.5-12.5H13z" fill="#ffe14d" stroke="#7fb4ff" stroke-width="1"/></svg></span>`;
      return '';
    }
    rsHTML(c, name) {
      if (!c || !c.rank || !c.suit || c.suit === 'none') return '';
      const red = c.suit === 'heart' || c.suit === 'diamond';
      const rk = this.T.rank(c.rank);
      return `<span class="qx-rs qx-rs-${this.catOf(name)}${red ? ' qx-rsr' : ''}"><b class="qx-rk${rk.length > 1 ? ' qx-rk2' : ''}">${rk}</b><i class="qx-su">${this.T.suit(c.suit)}</i></span>`;
    }
    // c：实体牌；opts.as：按此牌名显示（天兆区的 omenAs）
    cardHTML(c, cls, opts) {
      const T = this.T; const name = (opts && opts.as) || c.name; const d = D[name] || {};
      const extra = d.range ? ' · ' + T.t('range', { n: d.range }) : d.sub === 'plus' ? ' · +1' : d.sub === 'minus' ? ' · −1' : '';
      const tip = `${T.cardName(name)} ${T.suit(c.suit)}${T.rank(c.rank)}${extra}`;
      return `<div class="qx-card qx-pic ${cls || ''}" ${c.id ? `data-id="${c.id}"` : ''} data-zoom="${name}|${c.suit || ''}|${c.rank || 0}" title="${esc(tip)}"><img src="${this.smallSrc(name)}" alt="${esc(T.cardName(name))}" draggable="false">${this.rsHTML(c, name)}${this.natBadge(name)}</div>`;
    }
    chip(c, omen) { return this.cardHTML(c, 'qx-tiny', omen ? { as: c.omenAs || c.name } : null); }
    identityHTML(p, size) {
      const g = this.g, me = g.p(this.me);
      const face = p.seat === this.me || p.roleShown || p.dead || g.over || (me.knownRoles && me.knownRoles[p.seat]);
      const cls = size === 'big' ? ' qx-idbig' : size === 'sm' ? ' qx-idsm' : '';
      const title = face ? this.T.role(p.role) : this.T.t('unknownRole');
      return `<div class="qx-idc${cls}" ${face ? `data-zoomid="${p.role}"` : 'data-zoomid="back"'} title="${esc(title)}"><img src="${face ? this.idSrc(p.role) : this.backSrc('identity')}" alt="${esc(title)}" draggable="false"></div>`;
    }
    openZoom(spec, idRole, heroKey) {
      this.closeZoom();
      let inner;
      if (heroKey) {
        const T = this.T, t = T.t, h = E.HEROES[heroKey];
        const sk = h.skills.concat(this.g && this.g.players.some(p => p.hero === heroKey && p.role === 'chancellor') ? [] : []).map(id => { const d = E.SKILLS[id] || {}; const tag = { locked: t('lockedTag'), limited: t('limitedTag'), awaken: t('awakenTag'), lord: t('lordTag') }[d.type]; return `<p><b>${esc(T.skillName(id))}</b>${tag ? ' [' + esc(tag) + ']' : ''} ${esc(T.skillDesc(id))}</p>`; }).join('');
        inner = `<div class="qx-zoomcard qx-zhero"><img src="${this.heroSrc(heroKey, true)}" alt="${esc(T.heroName(heroKey))}"></div><div class="qx-zside"><h4>${esc(T.heroName(heroKey))} · ${esc(T.heroTitle(heroKey))}</h4><div class="qx-meta">${esc(T.faction(h.faction))} · ${esc(t('hpN', { n: h.hp }))}</div>${sk}</div>`;
      }
      else if (idRole) inner = `<div class="qx-zoomcard"><img src="${idRole === 'back' ? this.backSrc('identity', true) : this.idSrc(idRole, true)}" alt=""></div>`;
      else {
        const [name, suit, rank] = spec.split('|'); const r = +rank;
        const red = suit === 'heart' || suit === 'diamond';
        const lrs = r && suit && suit !== 'none' ? `<span class="qx-lrs${red ? ' qx-lred' : ''}"><span class="qx-lr">${this.T.rank(r)}</span><span class="qx-ls">${this.T.suit(suit)}</span></span>` : '';
        inner = `<div class="qx-zoomcard"><img src="${this.largeSrc(name)}" alt="${esc(this.T.cardName(name))}">${lrs}${this.natBadge(name)}</div>`;
      }
      const z = document.createElement('div'); z.className = 'qx-zoom'; z.innerHTML = inner;
      z.addEventListener('click', () => this.closeZoom());
      z.addEventListener('contextmenu', (e) => { e.preventDefault(); this.closeZoom(); });
      this.root.appendChild(z); this.zoomEl = z;
    }
    openPeek(el, x, y, touch) {
      this.closePeek();
      const T = this.T, t = T.t; let inner = '', hero = false;
      if (el.dataset.zoomhero) {
        const key = el.dataset.zoomhero, h = E.HEROES[key]; hero = true;
        const p = this.g && this.g.players.find(q => q.hero === key);
        const ids = (p ? p.skills : h.skills).filter(id => E.SKILLS[id] && !E.SKILLS[id].hidden);
        const skHTML = ids.map(id => { const d = E.SKILLS[id]; const tag = { locked: t('lockedTag'), limited: t('limitedTag'), awaken: t('awakenTag'), lord: t('lordTag') }[d.type]; const used = p && d.type === 'limited' && p.skillState[id]; return `<p><b>${esc(T.skillName(id))}</b>${tag ? `<i>${esc(tag)}</i>` : ''}${used ? `<i>${esc(t('used'))}</i>` : ''} ${esc(T.skillDesc(id))}</p>`; }).join('');
        inner = `<div class="qx-pkhero"><img src="${this.heroSrc(key, true)}" alt=""></div><div class="qx-pkside"><h4>${esc(T.heroName(key))}<span>${esc(T.heroTitle(key))} · ${esc(T.faction(h.faction))}</span></h4>${skHTML}</div>`;
      } else if (el.dataset.zoomid) {
        const r = el.dataset.zoomid;
        inner = `<div class="qx-pkcard"><img src="${r === 'back' ? this.backSrc('identity', true) : this.idSrc(r, true)}" alt=""></div>`;
      } else {
        const [name, suit, rank] = el.dataset.zoom.split('|'); const rv = +rank;
        const red = suit === 'heart' || suit === 'diamond';
        const lrs = rv && suit && suit !== 'none' ? `<span class="qx-lrs${red ? ' qx-lred' : ''}"><span class="qx-lr">${T.rank(rv)}</span><span class="qx-ls">${T.suit(suit)}</span></span>` : '';
        inner = `<div class="qx-pkcard"><img src="${this.largeSrc(name)}" alt="">${lrs}${this.natBadge(name)}</div>`;
      }
      const pk = document.createElement('div'); pk.className = 'qx-peek' + (hero ? ' qx-pkh' : ''); pk.innerHTML = inner;
      this.root.appendChild(pk);
      this.peek = { el: pk, src: el, rect: el.getBoundingClientRect(), touch };
      this.movePeek(x, y);
      requestAnimationFrame(() => pk.classList.add('qx-on'));
    }
    movePeek(x, y) {
      const P = this.peek; if (!P) return;
      const r = P.rect;
      if (!P.touch && (x < r.left - 2 || x > r.right + 2 || y < r.top - 2 || y > r.bottom + 2)) { this.closePeek(); return; }
      const W = window.innerWidth, H = window.innerHeight; const w = P.el.offsetWidth, h = P.el.offsetHeight;
      let px = x + 24, py = y - h / 2;
      if (px + w > W - 8) px = x - w - 24;
      if (px < 8) px = 8;
      py = Math.max(8, Math.min(H - h - 8, py));
      P.el.style.left = px + 'px'; P.el.style.top = py + 'px';
    }
    closePeek() { if (this.peek) { const el = this.peek.el; this.peek = null; el.classList.remove('qx-on'); setTimeout(() => el.remove(), 140); } }
    closeZoom() { if (this.zoomEl) { this.zoomEl.remove(); this.zoomEl = null; } }
    openRules() {
      this.closeZoom();
      const z = document.createElement('div'); z.className = 'qx-zoom'; z.style.cursor = 'default';
      z.innerHTML = `<div class="qx-box qx-wide" style="max-width:820px"><div style="display:flex;align-items:center"><h3 style="margin-right:auto">${esc(this.T.t('rules'))}</h3><button class="qx-btn" data-close="1">${esc(this.T.t('close'))}</button></div><div class="qx-rules">${this.T.rulesHTML()}</div></div>`;
      z.addEventListener('click', (e) => { if (e.target === z || e.target.closest('[data-close]')) this.closeZoom(); });
      this.root.appendChild(z); this.zoomEl = z;
    }
    hpHTML(p) {
      const hp = Math.max(0, p.hp);
      const tip = esc(this.T.t('hpNow', { h: hp, m: p.maxHp }));
      const low = hp <= 1 && p.maxHp > 1 ? ' qx-hplow' : '';
      const pips = p.maxHp > 6 ? '<i></i>' : '<i></i>'.repeat(Math.min(hp, p.maxHp)) + '<i class="qx-lost"></i>'.repeat(Math.max(0, p.maxHp - hp));
      return `<span class="qx-hpbar${low}" title="${tip}">${pips}<b>${hp}/${p.maxHp}</b></span>`;
    }
    roleHTML(p, reveal) {
      const me = this.g.p(this.me);
      const show = reveal || p.roleShown || p.seat === this.me || this.g.over || (me.knownRoles && me.knownRoles[p.seat]);
      return show ? `<span class="qx-role qx-r-${p.role}">${this.T.role(p.role)}</span>` : `<span class="qx-role qx-r-unknown">${this.T.t('unknownRole')}</span>`;
    }
    tags(p) {
      const t = this.T.t; let s = '';
      if (p.dead) s += `<span class="qx-tag">${t('dead')}</span>`;
      else if (p.dying) s += `<span class="qx-tag">${t('dying')}</span>`;
      if (p.chained) s += `<span class="qx-tag">${t('chained')}</span>`;
      if (p.faceDown) s += `<span class="qx-tag">${t('faceDown')}</span>`;
      return s;
    }
    // ════════════════ 舞台（固定 1280×760，整体缩放） ════════════════
    fit() {
      const wrap = this.$('.qx-stagewrap'); if (!wrap) return;
      const w = wrap.clientWidth || 1280;
      const full = this.root.classList.contains('qx-full');
      const vh = (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight - (full ? 44 : 84) : 760;
      let s = Math.min(w / 1280, Math.max(vh, 380) / 760); s = Math.max(0.3, Math.min(s, full ? 3 : 1.4));
      this.scale = s;
      const st = this.$('.qx-stage'); st.style.transform = `scale(${s})`; st.style.left = Math.max(0, Math.floor((w - 1280 * s) / 2)) + 'px';
      wrap.style.height = Math.ceil(760 * s) + 'px';
    }
    bw() { return this.logOpen ? 1012 : 1240; }
    seatXY(k, n) {
      const P5 = [null, [826, 232], [612, 4], [220, 4], [8, 232]];
      const P8 = [null, [842, 280], [842, 30], [636, 4], [425, 4], [214, 4], [8, 30], [8, 280]];
      const sx = (this.bw() - this.seatW()) / (1012 - (n > 5 ? 162 : 180));
      if (n === 5) return [Math.round(P5[k][0] * sx), P5[k][1]];
      if (n === 8) return [Math.round(P8[k][0] * sx), P8[k][1]];
      // 其他人数：沿 U 形均匀排布
      const pts = []; const m = n - 1;
      for (let i = 0; i < m; i++) { const f = (i + 0.5) / m; const ang = Math.PI * (1 - f) - Math.PI / 2; pts.push([430 + 420 * Math.cos(ang + Math.PI / 2) * -1, 250 - 240 * Math.sin(ang + Math.PI / 2)]); }
      return pts[k - 1].map(v => Math.round(v));
    }
    seatIcon(kind) {
      const I = {
        weapon: '<path d="M20.5 2.5 22 4l-9.8 9.8-1.6-1.6zM9.4 12.6l2 2-1.3 1.3 1.1 1.1-1.4 1.4-1.1-1.1-3.3 3.3-1.6-1.6 3.3-3.3-1.1-1.1 1.4-1.4 1.1 1.1z"/>',
        armor: '<path d="M12 2 20 5v6.2c0 5-3.4 9-8 10.8C7.4 20.2 4 16.2 4 11.2V5zm0 2.2L6 6.4v4.8c0 3.8 2.4 7 6 8.6z"/>',
        horse: '<path d="M7 21v-5.2C5.2 14.6 4.5 12.7 5.2 10.6l2.6-5 2.4-2.9.6 2.2 3.6.8 3.2 3.6-1.5 2.2-2.8-.9-1 2.8 1.9 7.6zm7.1-12.3a.9.9 0 1 0 0-.1z"/>'
      };
      return `<svg viewBox="0 0 24 24" fill="currentColor">${I[kind]}</svg>`;
    }
    // 军备横条：mini = 座位上的细条；否则为自己的装备格
    ebarHTML(c, slot, mini, owner) {
      const T = this.T, d = D[c.name] || {};
      const red = c.suit === 'heart' || c.suit === 'diamond';
      const icon = this.seatIcon(slot === 'weapon' ? 'weapon' : slot === 'armor' ? 'armor' : 'horse');
      const num = slot === 'weapon' ? (d.range || 1) : slot === 'plus' ? '+1' : slot === 'minus' ? '−1' : '';
      const rs = c.rank ? `<b class="qx-ers${red ? ' qx-rsred2' : ''}">${T.rank(c.rank)}${T.suit(c.suit)}</b>` : '';
      const attr = owner === this.me ? `data-id="${c.id}"` : `data-cid="${c.id}"`;
      const u = this.ui; let cls = '';
      if (owner === this.me && u) {
        const key = 'e:' + c.id;
        if (u.skill === key || (u.active && u.active.key === key)) cls = ' qx-eqon';
        else if (u.sel.includes(c)) cls = ' qx-picked'; else if (this.cardSelectable(c)) cls = ' qx-sel';
        else if (!u.skill && !u.active && (this.viewAsList().some(x => x.key === key) || (u.req.kind === 'play' && this.activeButtons().some(x => x.key === key)))) cls = ' qx-eqcan';
        if (u.req.kind === 'confirm' && u.req.skill === c.name) cls += ' qx-eqask';
      }
      const tip = `${T.cardName(c.name)} ${T.suit(c.suit)}${T.rank(c.rank)}${d.range ? ' · ' + T.t('range', { n: d.range }) : num && slot !== 'weapon' ? ' · ' + num : ''}`;
      return `<div class="qx-ebar${mini ? ' qx-ebm' : ''} qx-es-${slot}${cls}" ${attr} data-tipcard="${c.id}" data-zoom="${c.name}|${c.suit || ''}|${c.rank || 0}">${slot === 'armor' || !num ? `<i class="qx-eic">${icon}</i>` : `<i class="qx-eic qx-eval">${num}</i>`}<span class="qx-ename"><span class="qx-fit">${esc(this.eqName(c.name))}</span></span>${rs}</div>`;
    }
    gemsHTML(p, vertical) {
      const prev = this.hpPrev && this.hpPrev[p.seat] != null ? this.hpPrev[p.seat] : p.hp;
      const hp = Math.max(0, p.hp), max = p.maxHp;
      const tip = esc(this.T.t('hpNow', { h: hp, m: max }));
      const low = hp <= 1 && max > 1 ? ' qx-glow1' : hp * 2 <= max ? ' qx-glow2' : '';
      if (max > 6) return `<div class="qx-gems${vertical ? ' qx-gv' : ''}${low}" title="${tip}"><i></i><b>${hp}/${max}</b></div>`;
      let s = '';
      for (let i = 0; i < max; i++) {
        let c = i < hp ? '' : 'qx-gx';
        if (i >= hp && i < prev) c += ' qx-glose'; else if (i < hp && i >= prev) c += ' qx-ggain';
        s += `<i class="${c}"></i>`;
      }
      return `<div class="qx-gems${vertical ? ' qx-gv' : ''}${low}" title="${tip}">${s}</div>`;
    }
    skillTip(p) {
      const T = this.T, t = T.t;
      return p.skills.map(id => {
        const d = E.SKILLS[id]; if (!d || d.hidden) return '';
        const tag = { locked: t('lockedTag'), limited: t('limitedTag'), awaken: t('awakenTag'), lord: t('lordTag') }[d.type];
        const used = d.type === 'limited' && p.skillState[id] ? ` (${t('used')})` : '';
        return `【${T.skillName(id)}】${tag ? '[' + tag + '] ' : ''}${T.skillDesc(id)}${used}`;
      }).filter(Boolean).join('\n');
    }
    targeting() { const v = this.view(); return !!v && v.targeting;
    }
    deadOverlay(p) {
      return `<div class="qx-dov${this.diedNow && this.diedNow.has(p.seat) ? ' qx-dnew' : ''}"><img src="${this.idSrc(p.role)}" alt="${esc(this.T.role(p.role))}" data-zoomid="${p.role}"><span>${esc(this.T.t('dead'))}</span></div>`;
    }
    chainSvg() { return `<svg class="qx-chain" viewBox="0 0 40 16"><g fill="none" stroke="#d8d2c4" stroke-width="2.2"><rect x="2" y="4" width="14" height="8" rx="4"/><rect x="13" y="4" width="14" height="8" rx="4"/><rect x="24" y="4" width="14" height="8" rx="4"/></g></svg>`; }
    // ── 别人的座位 ──
    // ── 座位框（seat/seat-frame.png，坐标按原图 1086×1448） ──
    seatW() { return this.g && this.g.n > 5 ? 164 : 168; }
    factionCfg(f) { return FACTIONS[f] || { strip: 'rgba(120,100,70,.4)', text: '#f2e6c8', emblem: null }; }
    seatArtSrc(key) { const h = E.HEROES[key] || {}; return h.seatArt ? this.asset(h.seatArt) : this.asset(`seatgen/art/${key}.webp`); }
    roleVisible(p) {
      const g = this.g, me = g.p(this.me);
      return p.seat === this.me || p.role === 'chancellor' || p.roleShown || this.isDeadShown(p) || (g.over && !this.deadHold) || !!(me.knownRoles && me.knownRoles[p.seat]);
    }
    badgeHTML(p) {
      const real = this.roleVisible(p);
      const role = real ? p.role : (this.marks && this.marks[p.seat]) || 'unknown';
      const tip = real ? this.T.role(p.role) : role === 'unknown' ? this.T.t('markRole') : this.T.role(role) + ' · ' + this.T.t('markRole');
      return `<img class="qx-sbadge${real ? '' : ' qx-bclick'}" src="${this.asset('seat/badge-' + role + '.png')}" alt="${esc(tip)}" title="${esc(tip)}"${real ? '' : ` data-badge="${p.seat}"`} draggable="false">`;
    }
    // 体力：从下往上排，扣体力先灭上面的星
    starsHTML(p, hpv, prevv) {
      const hp = Math.max(0, hpv != null ? hpv : this.hpOf(p)), prev = Math.max(0, prevv != null ? prevv : hp), max = p.maxHp; const on = this.asset('seatgen/star-on.png'), off = this.asset('seatgen/star-off.png');
      const RH = 627, slot = RH / 5, S = 106;
      if (max > 5) {
        const anim = hp < prev ? ' qx-glose' : hp > prev ? ' qx-ggain' : '';
        return `<div class="qx-hpgrp"><img class="qx-star qx-star1${anim}" src="${hp > 0 ? on : off}" alt=""><div class="qx-hptxt"><b>${hp}</b><i>/</i><span>${max}</span></div></div>`;
      }
      let s = '';
      for (let i = 0; i < max; i++) { // i = 0 为最下面一颗
        const full = i < hp; let c = 'qx-star';
        if (!full && i < prev) c += ' qx-glose'; else if (full && i >= prev) c += ' qx-ggain';
        s += `<img class="${c}" src="${full ? on : off}" style="top:${Math.round(RH - slot * (i + 1) + (slot - S) / 2)}px" alt="">`;
      }
      return s;
    }
    nameHTML(p, cfg) {
      const T = this.T; const nm = T.heroName(p.hero); const col = `color:${cfg.text}`;
      if (this.lang === 'zh') {
        const fs = nm.length > 6 ? 84 : 100;
        return `<div class="qx-snm qx-snzh${cfg.dark ? ' qx-sndk' : ''}" style="${col};font-size:${fs}px">${esc(nm)}</div>`;
      }
      const up = nm.toUpperCase(); const fs = Math.min(82, Math.floor(1060 / (up.length * 0.8)));
      return `<div class="qx-snm qx-snen${cfg.dark ? ' qx-sndk' : ''}" style="${col};font-size:${fs}px">${esc(up)}</div>`;
    }
    // 装备条上的名称：英文过长时用缩写
    eqName(n) { const SH = { winter: 'Gen. Winter', ram: 'Ram', nemean: 'Nemean', misericorde: 'Misericorde', thunder_strike: 'Thunder' }; return this.lang === 'en' && SH[n] ? SH[n] : this.T.cardName(n); }
    sbarHTML(c, slot, i) {
      const T = this.T, d = D[c.name] || {};
      const red = c.suit === 'heart' || c.suit === 'diamond';
      const icon = this.seatIcon(slot === 'weapon' ? 'weapon' : slot === 'armor' ? 'armor' : 'horse');
      const val = slot === 'weapon' ? (d.range || 1) : slot === 'plus' ? '+1' : slot === 'minus' ? '−1' : '';
      return `<div class="qx-sbar" data-cid="${c.id}" data-tipcard="${c.id}" data-zoom="${c.name}|${c.suit || ''}|${c.rank || 0}" style="top:${817 + 154 * i}px">${slot === 'armor' ? `<i class="qx-sbi">${icon}</i>` : `<i class="qx-sbi qx-sbval">${val}</i>`}<span class="qx-sbn"><span class="qx-fit">${esc(this.eqName(c.name))}</span></span><b class="qx-sbr${red ? ' qx-rsred2' : ''}">${T.rank(c.rank)}${T.suit(c.suit)}</b></div>`;
    }
    // 天兆标记：按放入顺序排；右下角数字为判定顺序（后放入的先判定）
    omensHTML(p, mine) {
      const jz = this.dOmens(p); const n = jz.length;
      return jz.map((c, i) => { const nm = c.omenAs || c.name; const known = ['damocles', 'lotus', 'blockade'].includes(nm);
        return `<div class="qx-omk" data-cid="${c.id}" data-zoom="${nm}|${c.suit || ''}|${c.rank || 0}"><img src="${this.asset('seat/omen-' + (known ? nm : 'lotus') + '.png')}" alt="${esc(this.T.cardName(nm))}" draggable="false">${n > 1 ? `<b>${n - i}</b>` : ''}</div>`; }).join('');
    }
    // 阶段标签：切换时新标签从左侧滑入，旧标签淡出
    // 阶段标签：由动画节拍驱动（每个阶段都会出现一次），切换时新标签从左侧滑入、旧标签淡出
    phaseNow(seat) { const g = this.g; if (this.phCur && (this.phSet || Object.keys(this.phCur).length)) return this.phCur[seat] || null; return g.current && g.current.seat === seat && !g.over && g.phase ? g.phase : null; }
    curShown() { const g = this.g; if (g.over) return null; if (this.phCur) { for (const k in this.phCur) if (this.phCur[k]) return +k; if (this.phSet || Object.keys(this.phCur).length) return null; } return g.current ? g.current.seat : null; }
    phSpan(ph, cls) { return `<span class="qx-phl qx-phc-${ph} ${cls}">${esc(this.T.phaseLabel(ph))}</span>`; }
    phaseHTML(p) { const cur = this.phaseNow(p.seat); return `<div class="qx-phase" data-mk="ph${p.seat}">${cur ? this.phSpan(cur, 'qx-phnow') : ''}</div>`; }
    setPhaseShown(seat, ph) {
      this.phCur = this.phCur || {}; this.phSet = true;
      for (const p of this.g.players) {
        const was = this.phaseNow(p.seat); const now = p.seat === seat ? ph : null;
        if (was === now) continue;
        this.phCur[p.seat] = now;
        const el = this.$(`.qx-phase[data-mk="ph${p.seat}"]`); if (!el) continue;
        el.innerHTML = (was ? this.phSpan(was, 'qx-phout') : '') + (now ? this.phSpan(now, 'qx-phin') : '');
      }
      const cs = this.curShown();
      this.root.querySelectorAll('.qx-st').forEach(e => e.classList.toggle('qx-cur', +e.dataset.seat === cs));
      const dash = this.$('.qx-dash'); if (dash) dash.classList.toggle('qx-cur', cs === this.me);
    }
    seatCardHTML(p, w, withBars) {
      const shown = this.heroShown(p), T = this.T, t = T.t;
      const s = w / 1086, h = Math.round(w * 1448 / 1086);
      const cfg = shown ? this.factionCfg(p.faction) : null;
      const art = shown ? `<img src="${this.seatArtSrc(p.hero)}" alt="${esc(T.heroName(p.hero))}" draggable="false">` : `<div class="qx-sblank">?</div>`;
      const bars = withBars ? ['weapon', 'armor', 'minus', 'plus'].map((sl, i) => { const ec = this.dEquip(p, sl); return ec ? this.sbarHTML(ec, sl, i) : ''; }).join('') : '';
      const dead = this.isDeadShown(p); const hpv = this.hpOf(p);
      const showId = this.shownCards && this.shownCards[p.seat];
      const showC = showId != null && this.g.card(showId);
      return `<div class="qx-por qx-sw" style="width:${w}px;height:${h}px"${shown ? ` data-zoomhero="${p.hero}"` : ''}><div class="qx-sc" style="transform:scale(${s})">
        <div class="qx-sart">${art}</div>
        <img class="qx-sfr" src="${this.asset('seatgen/frame.webp')}" alt="" draggable="false">
        ${cfg ? `<div class="qx-sstrip" style="background:${cfg.strip}"></div>${cfg.emblem ? `<img class="qx-semb" src="${this.asset(cfg.emblem)}" alt="" draggable="false">` : ''}${this.nameHTML(p, cfg)}` : ''}
        ${(() => { const rn = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][p.seat + 1] || String(p.seat + 1); return `<div class="qx-sno" style="font-size:${[0, 100, 96, 80, 66][Math.min(4, rn.length)]}px">${esc(rn)}</div>`; })()}<div class="qx-shc" title="${esc(t('hand'))}">${this.dHandN(p)}</div>
        <div class="qx-srail" data-hp="${hpv}" data-max="${p.maxHp}">${dead ? '' : this.starsHTML(p, hpv, hpv)}</div>
        ${bars}
        ${dead ? '' : this.badgeHTML(p)}
        ${this.dSt(p, 'drunk') && !dead ? `<div class="qx-drunk">${esc(T.cardName('grog'))}</div>` : ''}
        ${this.dSt(p, 'chained') ? this.chainSvg() : ''}${this.dSt(p, 'faceDown') ? `<span class="qx-fdtag">${esc(t('faceDown'))}</span>` : ''}
        ${dead ? this.deadPlaque(p, false) : ''}
      </div>${showC ? `<div class="qx-shown">${this.cardHTML(showC, 'qx-showc').replace(/data-id="\d+"/, `data-cid="${showC.id}"`)}</div>` : ''}<div class="qx-fxl"></div></div>`;
    }
    seatHTML(p, k) {
      const g = this.g, T = this.T, t = T.t, u = this.ui;
      const [x, y] = this.seatXY(k, g.n); const w = this.seatW(), h = Math.round(w * 1448 / 1086);
      const side = x < 100 ? 'l' : x > this.bw() - w - 100 ? 'r' : '';
      const cls = ['qx-st'];
      if (this.curShown() === p.seat) cls.push('qx-cur');
      if (this.isDeadShown(p)) cls.push('qx-sdead');
      if (this.dSt(p, 'dying')) cls.push('qx-sdying');
      if (this.dSt(p, 'faceDown')) cls.push('qx-sflip');
      const tgt = this.targeting();
      if (u && this.seatSelectable(p)) cls.push('qx-sel'); else if (tgt && !p.dead) cls.push('qx-dim');
      if (u && u.targets.includes(p)) cls.push('qx-picked');
      const tilt = ((p.seat * 37) % 9 - 4) || 3; const out = side === 'l' ? 'translate(-6px,0)' : side === 'r' ? 'translate(6px,0)' : 'translate(0,-6px)';
      return `<div class="${cls.join(' ')}" data-seat="${p.seat}" style="left:${x}px;top:${y}px;width:${w}px;--die:${out} rotate(${tilt}deg)">
        ${this.seatCardHTML(p, w, true)}
        ${(() => { const t0 = !p.dead && this.thinkBars && this.thinkBars[p.seat]; return `<div class="qx-think${t0 ? ' qx-on' : ''}" style="top:${h + 2}px;width:${w}px"><i${t0 ? ` style="animation-delay:-${Date.now() - t0}ms"` : ''}></i></div>`; })()}
        <div class="qx-sfoot" style="top:${h + 6}px;width:${w}px">${this.phaseHTML(p)}${side ? '' : `<div class="qx-omks">${this.omensHTML(p)}</div>`}</div>
        ${side ? `<div class="qx-omks qx-omv qx-om-${side}" style="${side === 'l' ? `left:${w + 4}px` : 'left:-38px'};top:0;bottom:auto;height:${h}px">${this.omensHTML(p)}</div>` : ''}
      </div>`;
    }
    // 身份标记菜单（仅本地）
    openBadgeMenu(seat, el) {
      this.closeBadgeMenu(); this.hideTip();
      const r = this.rel(el); const m = document.createElement('div'); m.className = 'qx-bmenu';
      m.style.left = Math.round(r.x + r.w / 2 - 24) + 'px'; m.style.top = Math.round(r.y + r.h + 4) + 'px';
      m.innerHTML = ['keeper', 'insurgent', 'schemer', 'cancel'].map(k => `<img src="${this.asset('seat/badge-' + k + '.png')}" data-bmark="${seat}|${k}" title="${esc(k === 'cancel' ? this.T.t('unmark') : this.T.role(k))}" alt="">`).join('');
      m.dataset.for = String(seat);
      this.$('.qx-stage').appendChild(m); this.bmenu = m;
    }
    closeBadgeMenu() { if (this.bmenu) { this.bmenu.remove(); this.bmenu = null; } }
    // 装备名过长：逐步缩小字号，最后再横向压缩，保证完整显示
    fitNames() {
      for (const box of this.root.querySelectorAll('.qx-sbn,.qx-ename')) {
        const sp = box.querySelector('.qx-fit'); if (!sp) continue;
        sp.style.transform = '';
        const W = box.clientWidth; if (!W) continue;
        sp.style.marginLeft = '';
        if (sp.offsetWidth > W) { sp.style.transform = `scaleX(${Math.max(0.55, W / sp.offsetWidth).toFixed(3)})`; }
      }
    }
    // ── 悬停说明：跟随鼠标，淡入淡出 ──
    tipContent(el) {
      const T = this.T, t = T.t, g = this.g; if (!g) return '';
      if (el.dataset.tipseat != null) {
        const p = g.p(+el.dataset.tipseat); if (!p || !p.hero) return '';
        const sk = p.skills.map(id => { const d = E.SKILLS[id]; if (!d || d.hidden) return ''; const tag = { locked: t('lockedTag'), limited: t('limitedTag'), awaken: t('awakenTag'), lord: t('lordTag') }[d.type]; const used = d.type === 'limited' && p.skillState[id]; return `<p><b>${esc(T.skillName(id))}</b>${tag ? `<i>${esc(tag)}</i>` : ''}${used ? `<i>${esc(t('used'))}</i>` : ''} ${esc(T.skillDesc(id))}</p>`; }).join('');
        return `<h4>${esc(T.heroName(p.hero))}<span>${esc(T.heroTitle(p.hero))} · ${esc(T.faction(p.faction))}</span></h4>${sk}`;
      }
      if (el.dataset.tipcard != null) {
        const c = g.card(+el.dataset.tipcard); if (!c) return '';
        const nm = c.omenAs || c.name; const d = D[nm] || {};
        if (c.loc && c.loc.zone === 'judge') return `<div class="qx-tipcard"><img src="${this.largeSrc(nm)}" alt=""></div>`;
        const extra = d.range ? ' · ' + t('range', { n: d.range }) : d.sub === 'plus' ? ' · +1' : d.sub === 'minus' ? ' · −1' : '';
        return `<h4>${esc(T.cardName(nm))}<span>${esc(T.suit(c.suit) + T.rank(c.rank) + extra)}</span></h4><p>${esc(T.desc ? T.desc(nm) : '')}</p>`;
      }
      return '';
    }
    showTipFor(el, ev) {
      const box = this.$('.qx-tipbox'); if (!box) return;
      const html = el && !this.bmenu && !this.dragging ? this.tipContent(el) : '';
      if (!html) { this.hideTip(); return; }
      box.innerHTML = html; box.classList.toggle('qx-tipimg', !!box.querySelector('.qx-tipcard'));
      box.classList.add('qx-on'); this.moveTip(ev);
    }
    moveTip(ev) {
      const box = this.$('.qx-tipbox'); if (!box || !box.classList.contains('qx-on') || !ev) return;
      const s = this.scale || 1; const b = this.$('.qx-stage').getBoundingClientRect();
      const mx = (ev.clientX - b.left) / s, my = (ev.clientY - b.top) / s;
      const w = box.offsetWidth, h = box.offsetHeight;
      let x = mx + 22, y = my + 18;
      if (x + w > 1272) x = mx - w - 22;
      if (y + h > 752) y = Math.max(6, 752 - h);
      box.style.left = Math.max(6, x) + 'px'; box.style.top = Math.max(6, y) + 'px';
    }
    hideTip() { const box = this.$('.qx-tipbox'); if (box) box.classList.remove('qx-on'); }
    centerHTML() {
      const g = this.g, T = this.T; const list = this.center || [];
      const n = list.length; if (!n) return '';
      const cw = 100; const step = n > 1 ? Math.min(cw + 8, (640 - cw) / (n - 1)) : 0;
      const x0 = this.bw() / 2 - (cw + step * (n - 1)) / 2;
      const live = list.filter(e => !(this.fading && this.fading.has(e.id))); const maxLi = live.length ? Math.max(...live.map(e => e.li || 0)) : -1;
      return list.map((e, i) => {
        const c = g.card(e.id); if (!c) return '';
        const tag = e.as && e.as !== c.name ? `<div class="qx-astag">${esc(T.t('asCard', { c: T.cardName(e.as) }))}</div>` : '';
        const st = (this.fading && this.fading.has(c.id) ? ' qx-ccfade' : n > 1 ? (e.li === maxLi && e.kind !== 'discard' ? ' qx-cchi' : ' qx-ccdim') : '') + (e.kind === 'discard' ? ' qx-ccdisc' : '');
        return `<div class="qx-cc${st}" data-cid="${c.id}" style="left:${Math.round(x0 + i * step)}px;z-index:${i + 1}${this.hideSet && this.hideSet.has(c.id) ? ';visibility:hidden' : ''}">${this.cardHTML(c, 'qx-cpic').replace(/ data-id="\d+"/, '')}${tag}<div class="qx-ccap">${esc(e.cap || '')}</div></div>`;
      }).join('');
    }
    renderTable() {
      const g = this.g, T = this.T, t = T.t, n = g.n;
      let html = '';
      for (let k = 1; k < n; k++) html += this.seatHTML(g.p((this.me + k) % n), k);
      const cx = this.bw() / 2;
      html += `<div class="qx-ctr" data-mk="ctr" style="width:${this.bw()}px">${this.centerHTML()}</div>`;
      const u = this.ui; const txt = u ? this.promptText() : (g.over ? '' : (this.thinking ? this.waitText(this.thinking) : ''));
      html += `<div class="qx-prompt" data-mk="prompt" style="left:${Math.round(cx - 330)}px">${txt ? `<div class="qx-ptxt${u ? '' : ' qx-pwait'}">${esc(txt)}</div>` : ''}${u ? `<div class="qx-pbtns">${this.buttonsHTML()}</div>` : ''}</div>`;
      const me = g.p(this.me);
      html += `<div class="qx-myomks" data-mk="myomk">${this.omensHTML(me, true)}</div>`;
      const bd = this.$('.qx-board'); morph(bd, html); bd.style.width = this.bw() + 'px';
      this.$('.qx-side').classList.toggle('qx-hide', !this.logOpen);
      const lt = this.$('.qx-logtab'); if (lt) lt.classList.toggle('qx-on', !!this.logOpen);
    }
    // 联军盛宴：亮出的牌一直在窗口里，谁拿走了就在牌下标上座位号；轮到你时直接点选
    feastHTML() {
      const f = this.feast; if (!f || f.hidden) return '';
      const g = this.g, t = this.T.t; const u = this.ui; const myPick = u && u.req.kind === 'pick' && u.req.reason === 'feast';
      const cards = f.ids.map(id => { const c = g.card(id); if (!c) return '';
        const taken = c.loc && c.loc.zone === 'hand' ? c.loc.seat : null;
        const can = myPick && u.req.options.includes(id);
        return `<div class="qx-fcell${taken != null ? ' qx-ftaken' : ''}${can ? ' qx-fcan' : ''}" data-mk="f${id}"><div class="qx-fwrap"${can ? ` data-opt="${id}"` : ''}>${this.cardHTML(c, 'qx-wcard').replace(/ data-id="\d+"/, ` data-cid="${id}"`)}</div><span>${taken != null ? esc(this.who(taken)) : '&nbsp;'}</span></div>`; }).join('');
      return `<div class="qx-win qx-feast" data-mk="feast"><div class="qx-mtitle"><i></i><span>${esc(this.T.cardName('feast'))}</span><i></i></div><div class="qx-msub">${esc(myPick ? t('pick_feast') : t('feastWait'))}</div><div class="qx-frow">${cards}</div></div>`;
    }
    // 拼点：发起时就弹出；双方各放一张（背面），然后同时翻开，标出「赢 / 没赢」
    pindianHTML() {
      const pd = this.pindian; if (!pd) return '';
      const g = this.g, t = this.T.t;
      const slot = (seat, id, set, won) => {
        let inner;
        if (pd.revealed && id != null && g.card(id)) inner = `<div class="qx-pdface">${this.cardHTML(g.card(id), 'qx-wcard').replace(/ data-id="\d+"/, '')}</div>`;
        else if (set) inner = `<div class="qx-pdback"><img src="${this.backSrc('game', true)}" alt=""></div>`;
        else inner = `<div class="qx-pdempty">${esc(t('pdWait'))}</div>`;
        return `<div class="qx-pdside" data-mk="pd${seat}"><div class="qx-pdname">${esc(this.who(seat))}</div><div class="qx-pdslot">${inner}</div><div class="qx-pdres${pd.done ? (won ? ' qx-pwin' : ' qx-plose') : ''}">${pd.done ? esc(t(won ? 'pdWin' : 'pdNoWin')) : '&nbsp;'}</div></div>`;
      };
      const ra = pd.ca != null && pd.cb != null ? g.card(pd.ca).rank : 0, rb = pd.ca != null && pd.cb != null ? g.card(pd.cb).rank : 0;
      return `<div class="qx-win qx-pindian" data-mk="pindian"><div class="qx-mtitle"><i></i><span>${esc(t('pindianTitle'))}</span><i></i></div><div class="qx-pdrow">${slot(pd.a, pd.ca, pd.setA, ra > rb)}<div class="qx-pdvs">VS</div>${slot(pd.b, pd.cb, pd.setB, rb > ra)}</div></div>`;
    }

    // ── 自己的操作区 ──
    orderedHand(me) {
      this.handOrder = (this.handOrder || []).filter(id => me.hand.some(c => c.id === id));
      for (const c of me.hand) if (!this.handOrder.includes(c.id)) this.handOrder.push(c.id);
      return this.handOrder.map(id => me.hand.find(c => c.id === id));
    }
    handLayout(n) { const W = 740, cw = 100; const step = n > 1 ? Math.min(cw + 4, (W - cw) / (n - 1)) : 0; return { cw, step }; }
    renderMe() {
      const g = this.g, T = this.T, t = T.t, me = g.p(this.me), u = this.ui;
      const dash = this.$('.qx-dash');
      dash.classList.toggle('qx-cur', this.curShown() === me.seat);
      dash.classList.toggle('qx-myturn', !!u);
      const slots = ['weapon', 'armor', 'minus', 'plus'].map(s => this.dEquip(me, s) ? this.ebarHTML(this.dEquip(me, s), s, false, me.seat) : `<div class="qx-ebar qx-eempty qx-es-${s}"><i class="qx-eic">${this.seatIcon(s === 'weapon' ? 'weapon' : s === 'armor' ? 'armor' : 'horse')}</i><span class="qx-ename">${esc(t('slot_' + s))}</span></div>`).join('');
      const hand = this.orderedHand(me); const n = hand.length; const { cw, step } = this.handLayout(n);
      const sel = !!(u && this.view() && this.view().selecting);
      const handHTML = hand.map((c, i) => {
        let cls = 'qx-hc2';
        if (u) { if (u.sel.includes(c)) cls += ' qx-picked'; else if (this.cardSelectable(c)) cls += ' qx-sel'; else if (sel) cls += ' qx-dim'; }
        return `<div class="qx-hslot" data-hid="${c.id}" style="left:${Math.round(i * step)}px;z-index:${i + 1}">${this.cardHTML(c, cls)}</div>`;
      }).join('');
      const acts = u && u.req.kind === 'play' ? this.activeButtons() : [];
      const vas = u ? this.viewAsList() : [];
      const seen = new Set();
      const skills = g.skillList(me).filter(s => { if (seen.has(s.key)) return false; seen.add(s.key); return s.src !== 'equip' && s.def && (!s.def.hidden || acts.some(x => x.key === s.key) || vas.some(x => x.key === s.key)); });   // 他人赋予的隐藏技能（如号召）可用时也要有按钮
      const skHTML = skills.map(s => {
        const d = s.def; const tag = { locked: t('lockedTag'), limited: t('limitedTag'), awaken: t('awakenTag'), lord: t('lordTag') }[d.type];
        const tip = esc((tag ? '[' + tag + '] ' : '') + T.skillDesc(s.id));
        const used = d.type === 'limited' && me.skillState[s.id];
        const btns = [];
        for (const b of acts.filter(a => a.key === s.key)) btns.push(`<button class="qx-skb qx-ska${u.active && u.active.key === b.key && u.active.option === b.opt ? ' qx-on' : ''}" data-active="${b.key}|${b.opt == null ? '' : b.opt}" title="${tip}">${esc(b.label)}</button>`);
        for (const v of vas.filter(a => a.key === s.key)) btns.push(`<button class="qx-skb qx-ska${u.skill === v.key && (u.asName || null) === v.asName ? ' qx-on' : ''}" data-skill="${v.key}|${v.asName || ''}" title="${tip}">${esc(T.skillName(s.id) + (v.asName ? '·' + T.cardName(v.asName) : ''))}</button>`);
        if (!btns.length) btns.push(`<span class="qx-skb qx-skp${used ? ' qx-skused' : ''}${d.type === 'locked' ? ' qx-sklock' : ''}" title="${tip}">${esc(T.skillName(s.id))}</span>`);
        return btns.join('');
      }).join('');
      const phase = this.phaseHTML(me);
      const meSel = u && this.seatSelectable(me) ? ' qx-sel' : ''; const mePicked = u && u.targets.includes(me) ? ' qx-picked' : '';
      const dimMe = this.targeting() && !meSel ? ' qx-dim' : '';
      morph(dash, `${phase}
        <div class="qx-deq">${slots}</div>
        <div class="qx-dhand" style="width:${n ? Math.round(cw + step * (n - 1)) : 0}px">${handHTML}</div>
        <div class="qx-dsk">${skHTML}</div>
        <div class="qx-dpor${this.isDeadShown(me) ? ' qx-sdead' : ''}${this.dSt(me, 'dying') ? ' qx-sdying' : ''}${this.dSt(me, 'faceDown') ? ' qx-sflip' : ''}${meSel}${mePicked}${dimMe}" data-seat="${me.seat}">
          ${this.seatCardHTML(me, this.seatW(), false)}
        </div>`);
    }
    // 拖拽整理手牌（任何时候都可以）
    bindHandDrag() {
      const root = this.root; let d = null;
      root.addEventListener('pointerdown', e => {
        const slot = e.target.closest('.qx-dash .qx-hslot'); if (!slot || e.button !== 0) return;
        d = { slot, id: +slot.dataset.hid, x0: e.clientX, y0: e.clientY, on: false, pid: e.pointerId };
      });
      root.addEventListener('pointermove', e => {
        if (!d) return; const s = this.scale || 1;
        const dx = (e.clientX - d.x0) / s, dy = (e.clientY - d.y0) / s;
        if (!d.on) { if (Math.abs(dx) < 8) return; d.on = true; this.dragging = true; this.hideTip(); d.slot.classList.add('qx-dragging'); try { d.slot.setPointerCapture(d.pid); } catch (er) {} d.left0 = parseFloat(d.slot.style.left) || 0; }
        d.slot.style.left = (d.left0 + dx) + 'px'; d.slot.style.zIndex = 99; d.slot.style.transform = `translateY(${Math.min(0, dy * 0.3)}px)`;
        const me = this.g.p(this.me); const n = me.hand.length; const { step } = this.handLayout(n);
        const idx = Math.max(0, Math.min(n - 1, Math.round((d.left0 + dx) / (step || 1))));
        const order = this.handOrder.filter(id => id !== d.id); order.splice(idx, 0, d.id);
        // 其他牌让位
        this.$('.qx-dhand').querySelectorAll('.qx-hslot').forEach(el => { const id = +el.dataset.hid; if (id === d.id) return; const j = order.indexOf(id); el.style.left = Math.round(j * step) + 'px'; el.style.zIndex = j + 1; });
        d.order = order;
      });
      const end = () => {
        if (!d) return; const was = d;
        d = null;
        if (!was.on) return;
        this.dragging = false; this.dragJust = true; setTimeout(() => { this.dragJust = false; }, 50);
        if (was.order) this.handOrder = was.order;
        this.renderMe();
      };
      root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
    }
    // ════════════════ 动画 ════════════════
    // 节奏：参照无名杀——基础时长 D = 500ms，再乘速度系数（慢 ×1.5 / 中 ×1 / 快 ×0.7）
    animMult() { return { slow: 1.5, normal: 1, fast: 0.7, instant: 0 }[this.settings.speed] ?? 1; }
    rel(el) {
      const s = this.scale || 1; const r = el.getBoundingClientRect(); const b = this.$('.qx-stage').getBoundingClientRect();
      return { x: (r.left - b.left) / s, y: (r.top - b.top) / s, w: r.width / s, h: r.height / s };
    }
    // 渲染会重写 style，飞行中尚未落位的牌需重新隐藏
    reHide() { if (!this.hideSet || !this.hideSet.size) return; for (const id of this.hideSet) { const e = this.cardEl(id); if (e) e.style.visibility = 'hidden'; } }
    unHide(id, el) { if (this.hideSet) this.hideSet.delete(id); const e = this.cardEl(id); if (e) e.style.visibility = ''; if (el && el !== e) el.style.visibility = ''; return e || el; }
    cardEl(id) { return this.$('.qx-stage').querySelector(`.qx-board [data-cid="${id}"],.qx-dash [data-id="${id}"],.qx-board [data-id="${id}"]`); }
    locKey(c) {
      if (c.arranging) return 'deck';
      if (c.omenJudging != null) return 'j:' + c.omenJudging;
      if (this.centerIds && this.centerIds.has(c.id)) return 'center';
      const l = c.loc; if (!l) return 'none';
      if (l.zone === 'hand') return 'h:' + l.seat;
      if (l.zone === 'equip') return 'e:' + l.seat;
      if (l.zone === 'judge') return 'j:' + l.seat;
      if (l.zone === 'deck') return 'deck';
      if (l.zone === 'discard') return 'pile';
      if (l.zone === 'process') return 'center';
      return 'none';
    }
    keyVisible(k) { return k === 'h:' + this.me || /^(e|j):/.test(k) || k === 'center' || k === 'pile'; }
    anchorEl(k) {
      const st = this.$('.qx-stage');
      if (k === 'deck' || k === 'pile' || k === 'center') return null;
      const m = /^(h|e|j):(\d+)$/.exec(k); if (!m) return null;
      const s = +m[2];
      if (s === this.me) return m[1] === 'h' ? st.querySelector('.qx-dhand') : m[1] === 'e' ? st.querySelector('.qx-deq') : st.querySelector('.qx-dj');
      return st.querySelector(`.qx-st[data-seat="${s}"] .qx-por`);
    }
    anchorRect(k) {
      const el = this.anchorEl(k); if (!el) return { x: this.bw() / 2 - 43, y: 282, w: 86, h: 131 };
      const r = this.rel(el);
      if (k === 'h:' + this.me && r.w < 60) return { x: r.x + 40, y: r.y + 10, w: 0, h: 120 };
      return r;
    }
    seatPt(seat) {
      if (seat === this.me) return { x: 600, y: 650 };
      const el = this.$(`.qx-st[data-seat="${seat}"] .qx-por`); if (!el) return { x: 600, y: 650 };
      const r = this.rel(el); return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    }
    porEl(seat) { return seat === this.me ? this.$('.qx-dpor .qx-por') : this.$(`.qx-st[data-seat="${seat}"] .qx-por`); }
    // 中央出牌区：只显示当前这一次结算的牌（叠放），新的结算开始时旧牌进弃牌堆
    // 中央：一次完整结算里使用、打出、弃置的牌都留在中间，结算全部结束后一起淡出
    updateCenter(logs, base) {
      const g = this.g, T = this.T, t = T.t; this.center = this.center || []; let li = base || 0;
      const who = s => this.who(s);
      const add = (id, cap, as, kind) => {
        if (id == null) return; const c = g.card(id); if (!c) return;
        if (this.feast && this.feast.ids.includes(id)) return;
        if (this.revealWin && this.revealWin.ids.includes(id)) return;
        const old = this.center.find(e => e.id === id);
        if (old) { if (cap) old.cap = cap; if (as) old.as = as; return; }
        this.center.push({ id, cap, as, li, kind: kind || null });
      };
      for (const l of logs) { li++;
        if (l.type === 'use' && l.ids) for (const id of l.ids) add(id, who(l.seat), l.card !== g.card(id).name ? l.card : null);
        else if (l.type === 'play' && l.ids) for (const id of l.ids) add(id, who(l.seat), l.card !== g.card(id).name ? l.card : null);
        else if (l.type === 'discard' && l.cards) for (const id of l.cards) add(id, t('cap_discard', { s: who(l.seat) }), null, 'discard');
        else if (l.type === 'discardOf') add(l.card, t('cap_discardOf', { s: who(l.seat) }), null, 'discard');
        else if (l.type === 'judge' || l.type === 'judgeResult') add(l.card, t('cap_judge', { s: who(l.seat) }));
        else if (l.type === 'pindian') { this.pdHold = new Set([l.ca, l.cb]); }
        else if (l.type === 'recast') add(l.id, t('cap_recast', { s: who(l.seat) }));
        else if (l.type === 'retouch') add(l.card, t('cap_retouch', { s: who(l.seat) }));
      }
      for (const c of g.processing || []) if (!c.arranging && c.omenJudging == null && !this.center.find(e => e.id === c.id) && !(this.pdHold && this.pdHold.has(c.id)) && !(this.revealWin && this.revealWin.ids.includes(c.id)) && !(this.feast && this.feast.ids.includes(c.id))) add(c.id, '');
      if (this.center.length !== this.centerN) this.centerT = Date.now(); 
      this.center = this.center.filter(e => { const c = g.card(e.id); return c && c.loc && (c.loc.zone === 'process' || c.loc.zone === 'discard'); });
      while (this.center.length > 10) this.center.shift();
      this.centerN = this.center.length;
      this.centerIds = new Set(this.center.map(e => e.id));
    }
    snapLocs() { const m = new Map(); for (const id in this.g.cards) m.set(+id, this.locKey(this.g.cards[id])); return m; }
    hpOf(p) { return this.hpShown && this.hpShown[p.seat] != null ? this.hpShown[p.seat] : p.hp; }
    isDeadShown(p) { return p.dead && !(this.deadHold && this.deadHold.has(p.seat)); }
    // 被指定为目标：武将框红色光效，直到这次结算结束（中央清空）
    setAimed(seats, on) {
      this.aimed = this.aimed || new Set();
      if (on) seats.forEach(s => this.aimed.add(s)); else if (seats) seats.forEach(s => this.aimed.delete(s)); else this.aimed.clear();
      this.applyAimed();
    }
    applyAimed() {
      const A = this.aimed || new Set();
      this.root.querySelectorAll('.qx-st').forEach(e => e.classList.toggle('qx-tgt', A.has(+e.dataset.seat)));
      const dp = this.$('.qx-dpor'); if (dp) dp.classList.toggle('qx-tgt', A.has(this.me));
    }
    // 清空中央（upto：只清掉在第 upto 条日志之前放上去的牌）
    // 中央出牌区清理（参照无名杀第八节）：淡出 0.5 秒；弃置的牌另有 1 秒计时，这里不提前清
    async clearCenter(mult, upto, all) {
      const gone = (this.center || []).filter(e => (upto == null || (e.li || 0) < upto) && (all || e.kind !== 'discard'));
      if (!gone.length) return;
      if (mult && this.centerT) { const wait = Math.max(300, 500 * mult) - (Date.now() - this.centerT); if (wait > 0) await sleep(wait); }
      if (all && mult) { const w = Math.max(0, ...gone.filter(e => e.kind === 'discard' && e.at).map(e => e.at + 1000 - Date.now())); if (w > 0) await sleep(w); }
      await this.fadeIds(gone.map(e => e.id), mult);
    }
    // ── 显示层（参照无名杀：界面状态跟着动画走，而不是一结算就跳到最终状态）──
    // 一步动画期间，手牌数 / 装备条 / 天兆标记 / 横置 / 翻面 / 酒 都按「动画进行到哪」显示：牌飞走时才离开原处，落地时才出现在新处
    recordLast() {
      const g = this.g; this.stLast = {}; this.jzLast = {}; this.eqLast = {};
      for (const p of g.players) { this.stLast[p.seat] = this.stOf(p); this.jzLast[p.seat] = p.judgeZone.map(c => c.id).concat((g.processing || []).filter(c => c.omenJudging === p.seat).map(c => c.id)); this.eqLast[p.seat] = Object.values(p.equips).filter(Boolean); }
    }
    dKey(id) { return this.disp ? this.disp.get(id) : null; }
    dHandN(p) { if (!this.disp) return p.hand.length; let n = 0; const k = 'h:' + p.seat; for (const v of this.disp.values()) if (v === k) n++; return n; }
    dEquip(p, slot) {
      if (!this.disp) return p.equips[slot];
      const k = 'e:' + p.seat; const cands = [p.equips[slot]].concat((this.eqLast && this.eqLast[p.seat]) || []).filter(Boolean);
      return cands.find(c => this.disp.get(c.id) === k && ((D[c.name] || {}).sub === slot || p.equips[slot] === c)) || null;
    }
    dOmens(p) {
      const judging = (this.g.processing || []).filter(c => c.omenJudging === p.seat);
      if (!this.disp) return p.judgeZone.concat(judging.filter(c => !p.judgeZone.includes(c)));
      const k = 'j:' + p.seat; const prev = ((this.jzLast && this.jzLast[p.seat]) || []).map(id => this.g.card(id)).filter(Boolean);
      const out = prev.filter(c => this.disp.get(c.id) === k);
      for (const c of p.judgeZone.concat(judging)) if (!out.includes(c) && this.disp.get(c.id) === k) out.push(c);
      return out;
    }
    dSt(p, key) { const S = this.stShown && this.stShown[p.seat]; if (S && key in S) return S[key]; return key === 'drunk' ? !!(p.turnState && p.turnState.drunk) : !!p[key]; }
    stOf(p) { return { chained: !!p.chained, faceDown: !!p.faceDown, drunk: !!(p.turnState && p.turnState.drunk), dying: !!p.dying }; }
    dispSet(id, key, now) {
      if (!this.disp) return; this.disp.set(id, key);
      if (now) { this.dispQ = false; this.render(); return; }
      if (!this.dispQ) { this.dispQ = true; Promise.resolve().then(() => { if (this.dispQ) { this.dispQ = false; this.render(); } }); }
    }
    stSet(seat, key, val) { if (!this.stShown) return; this.stShown[seat] = this.stShown[seat] || {}; this.stShown[seat][key] = val; this.renderTable(); this.renderMe(); }
    // 展示的牌（参照无名杀：展示结束后等 2–5 个单位时长清掉）：结算仍在进行时继续保留
    shownExpire(seat, id, mult) {
      const tok = this.token; const tick = () => { if (tok !== this.token || !this.shownCards || this.shownCards[seat] !== id) return; if (this.g.processing && this.g.processing.some(c => !c.arranging)) { setTimeout(tick, 600); return; } delete this.shownCards[seat]; this.renderTable(); this.renderMe(); };
      setTimeout(tick, Math.max(1200, 2500 * (mult || 1)));
    }
    // 弃置的牌：落到中央后停 1 秒再淡出
    discardTimer(ids, mult) {
      const now = Date.now(); for (const e of this.center || []) if (ids.includes(e.id)) e.at = now;
      if (!mult) return this.fadeIds(ids, 0);
      const tok = this.token; setTimeout(() => { if (tok === this.token) this.fadeIds(ids, mult); }, 1000);
    }
    async fadeIds(ids, mult) {
      ids = new Set([].concat(ids).filter(id => (this.center || []).some(e => e.id === id))); if (!ids.size) return;
      this.fading = this.fading || new Set();
      const ctr = this.$('.qx-ctr');
      if (mult) { ids.forEach(id => this.fading.add(id)); if (ctr) morph(ctr, this.centerHTML()); await sleep(500); }
      ids.forEach(id => this.fading.delete(id));
      this.center = (this.center || []).filter(e => !ids.has(e.id)); this.centerIds = new Set(this.center.map(e => e.id)); this.centerN = this.center.length;
      if (!this.center.length && this.aimed && this.aimed.size) this.setAimed(null, false);
      if (ctr) morph(ctr, this.centerHTML());
      if (this.shownCards && !this.center.length) { this.shownCards = null; this.renderTable(); this.renderMe(); }
      this.locs = this.snapLocs();
    }
    // 一步：重绘到新状态（受伤、阵亡等先保持旧样子），再按日志顺序依次播放动画
    async step(tok) {
      const g = this.g; if (!g || !g.players[0].role) { this.render(); return; }
      const logs = g.logs.slice(this.animIdx || 0); this.animIdx = g.logs.length;
      this.stepNo = (this.stepNo || 0) + 1;
      const mult = this.animMult();
      if (logs.length) { this.vetoBars = false; if (this.thinkBars) this.thinkBars = null; }
      // 上一次结算已经结束 / 新的回合开始：中间的牌一起淡出后再继续
      
      const feastLog = logs.find(l => l.type === 'reveal' && l.reason === 'feast');
      if (feastLog) this.feast = { ids: feastLog.cards.slice(), hidden: !!mult };   // 窗口在亮牌那一刻才出现，不提前
      const rvLog = logs.find(l => l.type === 'reveal' && l.reason === 'chisel');
      if (rvLog) this.revealWin = { ids: rvLog.cards.slice(), picks: [], pickReason: 'chiselPick', title: this.T.skillName('chisel'), seat: g.current ? g.current.seat : this.me, hidden: !!mult };
      const st = this.$('.qx-stage');
      const before = new Map();
      if (mult) for (const el of st.querySelectorAll('.qx-board [data-cid],.qx-dash [data-id],.qx-wins [data-cid],.qx-wins [data-opt]')) {
        const id = +(el.dataset.id || el.dataset.cid || el.dataset.opt); if (before.has(id)) continue; before.set(id, this.rel(el));
      }
      const prevLocs = this.locs || this.snapLocs();
      const anch = {}; const oldAnchor = k => (anch[k] = anch[k] || this.anchorRect(k));
      if (mult) { oldAnchor('h:' + this.me); for (let s = 0; s < g.n; s++) if (s !== this.me) oldAnchor('h:' + s); }
      const prevHp = {}; for (const p of g.players) prevHp[p.seat] = this.shownHpLast && this.shownHpLast[p.seat] != null ? this.shownHpLast[p.seat] : p.hp;
      const base = (this.animIdx || 0) - logs.length;
      this.updateCenter(logs, base);
      const newLocs = this.snapLocs();
      // 逐跳生成飞牌：按引擎 move 日志的先后，每张牌从「当前显示的位置」飞到这次移动的去处（一张牌在一步里可能移动多次）
      const moves = [];
      const mkMove = (id, k0, k1, logRef, first) => {
        const m0 = /^(h|e|j):(\d+)$/.exec(k0); const otherSeat = m0 && +m0[2] !== this.me && !(/^j:/.test(k0) && /^j:/.test(k1));
        // 参照无名杀 $throw：别人的牌（手牌 / 装备 / 判定区）从他武将牌的中心以原大小出现，再飞向目的地
        const fromBar = !otherSeat && /^(e|j):/.test(k0);
        const from = otherSeat ? (mult ? oldAnchor('h:' + m0[2]) : null) : ((first && before.get(id)) || (mult ? oldAnchor(k0) : null));
        moves.push({ id, k0, k1, fromBar, fromSeat: !!otherSeat, from, logRef, final: k1 === newLocs.get(id) });
      };
      const keyOf = (l, id) => {
        const z = l.to;
        if (z === 'hand') return 'h:' + l.seat; if (z === 'equip') return 'e:' + l.seat; if (z === 'judge') return 'j:' + l.seat;
        if (z === 'process') return 'center';
        if (z === 'discard') return this.centerIds && this.centerIds.has(id) ? 'center' : 'pile';
        return 'deck';
      };
      const run = new Map(prevLocs); const hopped = new Set();
      for (const l of logs) {
        if (l.type !== 'move' || !l.ids) continue;
        if (l.reason === 'omenJudge') continue;               // 判定时天兆标记留在原处，只亮出判定牌
        for (const id of l.ids) {
          const k0 = run.get(id); const k1 = keyOf(l, id);
          if (k0 == null || k0 === 'none' || k0 === k1) { run.set(id, k1); continue; }
          if ((k0 === 'pile' || k0 === 'deck') && (k1 === 'deck' || k1 === 'pile')) { run.set(id, k1); continue; }
          if (k0 === 'center' && k1 === 'pile') { run.set(id, k1); continue; }
          mkMove(id, k0, k1, l, !hopped.has(id)); hopped.add(id); run.set(id, k1);
        }
      }
      // 不经过 move 日志的变化（如判定牌直接从牌堆亮出）：按「起止位置」补一跳
      for (const [id, k1] of newLocs) {
        const k0 = run.get(id); if (k0 === k1 || k0 == null || k1 === 'none' || k0 === 'none') continue;
        if ((k0 === 'pile' || k0 === 'deck') && (k1 === 'deck' || k1 === 'pile')) continue;
        if (k0 === 'center' && k1 === 'pile') continue;
        mkMove(id, k0, k1, null, !hopped.has(id));
      }
      this.locs = newLocs;
      const deaths = logs.filter(l => l.type === 'death').map(l => l.seat);
      if (mult) { this.hpShown = Object.assign({}, prevHp); this.deadHold = new Set(deaths); }
      const phKey = g.current ? g.current.seat + ':' + g.phase : '';
      this.phNew = phKey !== this.lastPh ? (g.current ? g.current.seat : null) : null; this.lastPh = phKey;
      const pdLog = logs.find(l => l.type === 'pindian');
      if (mult) { this.phCur = this.phCur || {}; this.phSet = true;
        this.disp = new Map(prevLocs);
        this.stShown = {}; for (const p of g.players) this.stShown[p.seat] = Object.assign({}, (this.stLast && this.stLast[p.seat]) || this.stOf(p)); }
      this.render();
      this.shownHpLast = {}; for (const p of g.players) this.shownHpLast[p.seat] = p.hp;
      this.groupDone = !(g.processing && g.processing.some(c => !c.arranging)) && !this.feast;
      if (!mult) { this.disp = null; this.stShown = null; this.recordLast(); const pr = new Set((g.processing || []).map(c => c.id)); this.center = (this.center || []).filter(e => pr.has(e.id)); this.centerIds = new Set(this.center.map(e => e.id)); const ctr = this.$('.qx-ctr'); if (ctr) morph(ctr, this.centerHTML()); }
      if (!mult || tok !== this.token) { this.hpShown = null; this.deadHold = null; this.phCur = {}; this.phSet = false; this.closeFeastIfDone(); this.closeRevealIfDone(); if (!mult) return; this.render(); return; }
      this.hideSet = new Set();
      for (const mv of moves) {
        if (!mv.final) { mv.el = null; continue; }
        // 目的地元素按去向精确查找（同一张牌在一步里可能同时出现在旧位置和新位置）
        const st0 = this.$('.qx-stage'); const mk = /^(e|j):(\d+)$/.exec(mv.k1);
        const el = mv.k1 === 'center' ? st0.querySelector(`.qx-ctr [data-cid="${mv.id}"]`)
          : mv.k1 === 'h:' + this.me ? st0.querySelector(`.qx-dash .qx-dhand [data-id="${mv.id}"]`)
          : mk ? (+mk[2] === this.me ? st0.querySelector(`.qx-dash [data-id="${mv.id}"], .qx-myomks [data-cid="${mv.id}"]`) : st0.querySelector(`.qx-st[data-seat="${mk[2]}"] [data-cid="${mv.id}"]`))
          : null;
        const handOther = /^h:/.test(mv.k1) && mv.k1 !== 'h:' + this.me;
        mv.el = el && !handOther ? el : null;
        if (mv.el) { mv.el.style.visibility = 'hidden'; this.hideSet.add(mv.id); }
      }
      const claimed = new Set();
      const claim = (pred, max) => { const out = []; for (const mv of moves) { if (claimed.has(mv) || !pred(mv)) continue; if (max != null && out.length >= max) break; claimed.add(mv); out.push(mv); } return out; };
      const byIds = ids => { const s = new Set([].concat(ids || []).filter(x => x != null)); return claim(mv => s.has(mv.id)); };
      const beats = []; let vetoOf = this.lastVetoOf || null; let prevTy = '';
      // 没有被具体事件（使用 / 弃置 / 获得……）认领的牌，在它实际移动（move 日志）的那一刻再飞，保证动画顺序与结算顺序一致
      const omenHit = new Set(logs.filter(l => l.type === 'omenHit').map(l => l.seat));
      for (const l of logs) {
        const ty = l.type; for (const bb of beats) if (!bb.ty) bb.ty = prevTy; prevTy = ty;
        if (ty === 'vetoWindow') vetoOf = l.of;
        if (ty === 'use' || ty === 'play') {
          const mv = byIds(l.ids);
          let tg = ty === 'use' ? (l.targets || []).filter(s => s !== l.seat) : [];
          if (l.card === 'veto' && !tg.length && vetoOf) { const vt = vetoOf.card === 'veto' ? vetoOf.from : (vetoOf.target != null ? vetoOf.target : vetoOf.from); if (vt != null && vt !== l.seat) tg = [vt]; }
          const glow = l.card === 'veto' ? [] : tg.slice();
          const isEq = D[l.card] && D[l.card].type === 'equip' && ty === 'use';
          beats.push(async () => {
            if (isEq) { for (const m of mv) await this.equipFly(m, mult); return; }
            tg.forEach(s => this.drawLine(this.seatPt(l.seat), this.seatPt(s), mult));
            if (glow.length) this.setAimed(glow, true);
            await this.flyMany(mv, mult); this.stampFx(l.seat, l.card, mult);
            await sleep(500 * mult);   // 无名杀：用牌后停 1 个单位时长（每个目标的 0.5 单位在各自结算时才发生）
          });
        } else if (ty === 'draw') {
          const mv = claim(m => m.k0 === 'deck' && m.k1 === 'h:' + l.seat, l.n);
          let bi = beats.length - 1; while (bi >= 0 && beats[bi].isMove) bi--;
          const prev = beats[bi];
          if (prev && prev.draws) prev.draws.push(...mv);
          else { const f = async () => { await this.flyMany(f.draws, mult); await sleep(Math.max(150, 300 * mult)); }; f.draws = mv.slice(); beats.push(f); }   // 摸到的牌落定后稍停，再进入下一阶段
        }
        else if (ty === 'gain') {
          const mv = claim(m => m.k1 === 'h:' + l.seat && m.k0 !== 'deck', l.n); if (!mv.length) continue;
          const R = this.revealWin;
          if (R && mv.some(m => R.ids.includes(m.id))) beats.push(async () => {
            if (l.seat !== this.me || !R.picks.length) { for (const m of mv) { if (!R.picks.includes(m.id)) { R.picks.push(m.id); this.flipWins(() => this.renderWins()); await sleep(Math.max(300, 480 * mult)); } } }
            await sleep(Math.max(200, 400 * mult));
            for (const m of mv) { const el = this.$(`.qx-reveal [data-cid="${m.id}"]`); if (el) m.from = this.rel(el); }
            R.ids = R.ids.filter(id => !mv.some(m => m.id === id)); R.picks = []; this.renderWins();
            await this.flyMany(mv, mult);
          });
          else beats.push(() => this.giveFly(mv, mult));
        }
        else if (ty === 'discard' || ty === 'discardOf') { const ids = [].concat(ty === 'discard' ? l.cards : [l.card]); const mv = byIds(ids); beats.push(async () => { await this.flyMany(mv, mult); this.discardTimer(ids, mult); }); }
        else if (['equip', 'recast', 'retouch'].includes(ty)) { const mv = byIds(ty === 'retouch' ? l.card : l.id); if (mv.length) beats.push(() => this.flyMany(mv, mult)); }
        else if (ty === 'pindianStart') beats.push(async () => { this.pindian = { a: l.a, b: l.b, setA: false, setB: false }; this.renderWins(); await sleep(Math.max(200, 350 * mult)); });
        else if (ty === 'pindianSet') beats.push(async () => { const pd = this.pindian; if (!pd) return; if (l.seat === pd.a) pd.setA = true; else pd.setB = true; this.renderWins(); await sleep(Math.max(150, 250 * mult)); });
        else if (ty === 'pindian') {
          const mv = byIds([l.ca, l.cb]);
          beats.push(async () => {
            const pd = this.pindian || (this.pindian = { a: l.a, b: l.b }); pd.setA = pd.setB = true; pd.ca = l.ca; pd.cb = l.cb; this.renderWins();
            for (const m of mv) { const seat = m.id === l.ca ? l.a : l.b; const sl = this.$(`.qx-pindian [data-mk="pd${seat}"] .qx-pdslot`); if (sl) { m.toRect = this.rel(sl); m.el = null; m.back = true; } }
            await this.flyMany(mv, mult);
            pd.revealed = true; this.renderWins(); await sleep(Math.max(350, 600 * mult));
            pd.done = true; this.renderWins(); await sleep(Math.max(700, 1300 * mult));
            const w = this.$('.qx-pindian'); if (w) { w.classList.add('qx-wfade'); await sleep(260); }
            this.pindian = null; this.pdHold = null; this.renderWins();
          });
        }
        else if (ty === 'reveal') {
          const mv = byIds(l.cards);
          // 五谷 / 雕琢等专用窗口：牌直接出现在窗口里（窗口自带出现动画），桌面上不再飞牌，窗口一出来就能选
          const inWin = (this.feast && l.cards.every(id => this.feast.ids.includes(id))) || (this.revealWin && l.cards.every(id => this.revealWin.ids.includes(id)));
          if (inWin) { mv.forEach(m => { if (this.disp) this.disp.set(m.id, 'win'); }); beats.push(async () => { if (this.feast) this.feast.hidden = false; if (this.revealWin) this.revealWin.hidden = false; this.renderWins(); this.renderTable(); await sleep(Math.max(200, 350 * mult)); }); }
          else beats.push(() => this.flyMany(mv, mult));
        }
        else if (ty === 'judge') { const mv = byIds(l.card); beats.push(async () => { await this.flyMany(mv, mult); await sleep(1000 * mult); }); }   // 无名杀：亮出判定牌后停 2 个单位时长
        else if (ty === 'judgeResult') {
          const ok = this.judgeVerdict(l, omenHit);
          if (ok != null) beats.push(async () => { this.judgeMark(l.card, ok); await sleep(520 * mult); });
        }
        else if (ty === 'vetoWindow') beats.push(() => this.vetoWindowFx(mult, l));
        else if (ty === 'damoclesMove') { const mv = claim(m => m.k1 === 'j:' + l.to); for (const m of mv) { m.omenMove = true; if (!(m.from && m.from.w < 80)) { const fe = this.$(`.qx-st[data-seat="${l.from}"] .qx-por`) || this.$('.qx-dpor .qx-por'); const r = fe ? this.rel(fe) : { x: 600, y: 300, w: 0, h: 0 }; m.from = { x: r.x + r.w / 2 - 17, y: r.y + r.h - 40, w: 34, h: 34 }; } } beats.push(() => this.flyMany(mv, mult)); }
        else if (ty === 'phase') { const at = base + logs.indexOf(l) + 1; beats.push(async () => { if (!(g.processing && g.processing.length && this.center.some(e => g.processing.some(c => c.id === e.id) && e.li < at))) await this.clearCenter(mult, at); this.setPhaseShown(l.seat, l.phase); await sleep(Math.max(320, 520 * mult)); }); }
        else if (ty === 'chain') beats.push(() => { this.stSet(l.seat, 'chained', !!l.on); return sleep(Math.max(120, 220 * mult)); });
        else if (ty === 'flip') beats.push(() => { this.stSet(l.seat, 'faceDown', !!l.faceDown); return sleep(Math.max(150, 300 * mult)); });
        else if (ty === 'drunk') beats.push(() => { this.stSet(l.seat, 'drunk', true); return sleep(Math.max(120, 250 * mult)); });
        else if (ty === 'move') { const f = () => { const mv = moves.filter(m => m.logRef === l && !claimed.has(m)); mv.forEach(m => claimed.add(m)); return mv.length ? this.flyMany(mv, mult) : null; }; f.isMove = true; beats.push(f); }
        else if (ty === 'tableClear') { const at = base + logs.indexOf(l) + 1; beats.push(async () => { await this.clearCenter(mult, at); if (this.shownCards) { this.shownCards = null; this.renderTable(); this.renderMe(); } }); }   // 展示的牌只在这次结算期间显示
        else if (ty === 'judgeClear') beats.push(() => this.fadeIds(l.cards || [], mult));
        else if (ty === 'turn') { const at = base + logs.indexOf(l) + 1; beats.push(async () => { await this.clearCenter(mult, at, true); this.shownCards = null; this.setPhaseShown(null, null); }); }
        else if (ty === 'damage' || ty === 'loseHp') { const seat = l.to != null ? l.to : l.seat; beats.push(() => this.hitFx(seat, '−' + l.n, ty === 'damage' ? (l.nature || 'normal') : 'lose', mult, l.hp, ty === 'damage' ? l.from : null)); }
        else if (ty === 'recover') beats.push(() => { if (l.hp > 0) this.stSet(l.seat, 'dying', false); return this.hitFx(l.seat, '+' + l.n, 'heal', mult, l.hp); });
        else if (ty === 'hpSet' || ty === 'maxHp') beats.push(async () => { this.setHpShown(l.seat, g.p(l.seat).hp); });
        else if (ty === 'skill') beats.push(() => { (l.targets || []).filter(s => s !== l.seat).forEach(s => this.drawLine(this.seatPt(l.seat), this.seatPt(s), mult)); return this.skillFx(l.seat, l.skill, mult); });
        else if (ty === 'aim') beats.push(async () => { const tg = (l.targets || []).filter(s => s !== l.seat); if (tg.length) this.setAimed(tg, true); tg.forEach(s => this.drawLine(this.seatPt(l.seat), this.seatPt(s), mult)); if (tg.length) await sleep(Math.max(200, 380 * mult)); });
        else if (ty === 'show') beats.push(async () => { this.shownCards = this.shownCards || {}; this.shownCards[l.seat] = l.card; this.shownExpire(l.seat, l.card, mult); this.renderTable(); this.renderMe(); await sleep(Math.max(500, 900 * mult)); });
        else if (ty === 'dying') beats.push(() => { this.stSet(l.seat, 'dying', true); return sleep(500 * mult); });
        else if (ty === 'death') beats.push(() => this.deathFx(l.seat, mult));
      }
      for (const bb of beats) if (!bb.ty) bb.ty = prevTy;
      this.lastVetoOf = vetoOf;
      const rest = moves.filter(m => !claimed.has(m));
      if (rest.length) beats.push(() => this.flyMany(rest, mult));
      // 看门狗：任何一个动画节拍超过 8 秒没结束都不能卡住对局（记录下来便于排查）
      for (const b of beats) { if (tok !== this.token) return; let to; const bt0 = Date.now(); const r = await Promise.race([Promise.resolve().then(b).then(() => 'ok'), new Promise(res => { to = setTimeout(() => res('timeout'), 8000); })]); clearTimeout(to); if (r === 'timeout') console.error('[qx] beat timeout', b.ty || '?'); if (typeof window !== 'undefined' && window.__qxBeatLog) window.__qxBeatLog.push([b.ty || '?', Date.now() - bt0]); }
      if (tok !== this.token) return;
      const cur = g.current && !g.over && g.phase ? g.current.seat : null; this.setPhaseShown(cur, cur != null ? g.phase : null);
      if (this.feast) this.feast.hidden = false; if (this.revealWin) this.revealWin.hidden = false;
      this.disp = null; this.stShown = null; this.recordLast(); this.render();
      for (const mv of moves) if (mv.el) this.unHide(mv.id, mv.el);
      this.hideSet = null;
      this.hpShown = null; this.deadHold = null;
      for (const p of g.players) this.setHpShown(p.seat, p.hp, true);
      if (this.groupDone && !(this.center || []).length && this.aimed && this.aimed.size) this.setAimed(null, false);
      await this.closeFeastIfDone(mult);
      await this.closeRevealIfDone(mult);
    }
    async closeFeastIfDone(mult) {
      const f = this.feast; if (!f) return;
      const g = this.g; if (f.ids.some(id => { const c = g.card(id); return c && c.loc && c.loc.zone === 'process'; })) return;
      if (mult) { await sleep(Math.max(200, 600 * mult)); const w = this.$('.qx-feast'); if (w) { w.classList.add('qx-wfade'); await sleep(300); } }
      this.feast = null; this.renderWins();
    }
    renderWins() { const w = this.$('.qx-wins'); if (w) morph(w, this.feastHTML() + this.pindianHTML() + this.revealHTML()); const st = this.$('.qx-stage'); if (st) st.classList.toggle('qx-haswin', !!((this.feast && !this.feast.hidden) || (this.revealWin && !this.revealWin.hidden))); }
    // 雕琢等「亮出牌再挑选」：上排亮出的牌，下排凹槽；把要的牌拖（或点）到下排
    revealHTML() {
      const R = this.revealWin; if (!R || R.hidden) return '';
      const g = this.g, T = this.T, t = T.t, u = this.ui;
      const mine = u && u.req.kind === 'pick' && u.req.multi && u.req.reason === R.pickReason;
      const picks = mine ? (u.btn || []) : (R.picks || []);
      const n = R.ids.length;
      const vw = mine ? this.view() : null;
      const cardEl = id => { const c = g.card(id); const off = mine && !picks.includes(id) && vw && !vw.buttons.has(id); return c ? `<div class="qx-rvc${mine && !off ? ' qx-rvcan' : ''}${off ? ' qx-rvoff' : ''}" data-rv="${id}">${this.cardHTML(c, 'qx-wcard').replace(/ data-id="\d+"/, ` data-cid="${id}"`)}</div>` : ''; };
      const top = R.ids.filter(id => !picks.includes(id));
      const row = (arr, name) => `<div class="qx-arow"><div class="qx-clab">${esc(t(name))}</div><div class="qx-aslots">${Array.from({ length: n }, (_, i) => `<div class="qx-aslot${name === 'rvTake' ? ' qx-rvdrop' : ''}">${arr[i] != null ? cardEl(arr[i]) : ''}</div>`).join('')}</div></div>`;
      const cnt = mine ? u.req.multi.count : null;
      const tip = mine ? t('rvTip', { n: cnt }) : t('rvWait', { s: this.who(R.seat) });
      return `<div class="qx-win qx-reveal" data-mk="reveal"><div class="qx-mtitle"><i></i><span>${esc(R.title)}</span><i></i></div><div class="qx-msub">${esc(tip)}</div>${row(top, 'rvShown')}${row(picks, 'rvTake')}${mine ? `<div class="qx-mfoot"><button class="qx-dbt qx-primary" data-act="multiOk"${picks.length === cnt ? '' : ' disabled'}>${esc(t('confirm'))}</button></div>` : ''}</div>`;
    }
    // FLIP：记录位置 → 重绘 → 从旧位置平滑移动到新位置
    flipWins(fn) {
      const old = new Map(); for (const el of this.root.querySelectorAll('.qx-wins [data-rv]')) old.set(el.dataset.rv, el.getBoundingClientRect());
      fn();
      for (const el of this.root.querySelectorAll('.qx-wins [data-rv]')) {
        const o = old.get(el.dataset.rv); if (!o) continue; const n = el.getBoundingClientRect(); const s = this.scale || 1;
        const dx = (o.left - n.left) / s, dy = (o.top - n.top) / s; if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.3,.7,.3,1)' });
      }
    }
    rvToggle(id) { if (!this.ui || !this.revealWin) return; this.pressButton(id); }
    bindRevealDrag() {
      let d = null; const root = this.root;
      root.addEventListener('pointerdown', e => { const el = e.target.closest('.qx-wins .qx-rvcan'); if (!el || e.button !== 0) return; d = { id: +el.dataset.rv, el, x0: e.clientX, y0: e.clientY, on: false }; });
      root.addEventListener('pointermove', e => {
        if (!d) return;
        if (!d.on) { if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return; d.on = true; const r = d.el.getBoundingClientRect(); d.dx = d.x0 - r.left; d.dy = d.y0 - r.top; d.ghost = d.el.cloneNode(true); d.ghost.className = 'qx-aghost'; d.ghost.style.width = r.width + 'px'; root.appendChild(d.ghost); d.el.style.opacity = '.25'; }
        d.ghost.style.left = (e.clientX - d.dx) + 'px'; d.ghost.style.top = (e.clientY - d.dy) + 'px';
      });
      const end = e => {
        if (!d) return; const was = d; d = null;
        if (!was.on) { this.rvJust = true; setTimeout(() => { this.rvJust = false; }, 30); this.rvToggle(was.id); return; }
        const gr = was.ghost.getBoundingClientRect(); was.ghost.remove(); was.el.style.opacity = '';
        const u = this.ui; const inTake = u && u.btn && u.btn.includes(was.id);
        const tgt = document.elementFromPoint(e.clientX, e.clientY); const drop = tgt && tgt.closest('.qx-aslot');
        const toTake = drop ? drop.classList.contains('qx-rvdrop') : null;
        this.rvJust = true; setTimeout(() => { this.rvJust = false; }, 30);
        if (toTake === null || toTake === !!inTake) return;
        this.rvToggle(was.id);
      };
      root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
    }
    async closeRevealIfDone(mult) {
      const R = this.revealWin; if (!R) return; const g = this.g;
      if (R.ids.some(id => { const c = g.card(id); return c && c.loc && c.loc.zone === 'process'; })) return;
      if (mult) { const w = this.$('.qx-reveal'); if (w) { w.classList.add('qx-wfade'); await sleep(260); } }
      this.revealWin = null; this.renderWins();
    }
    // 响应读条（参照无名杀的倒计时条）：按 60 秒的速度缓慢走，谁响应 / 放弃了就消失；不会因为走完而自动放弃
    setThinkBars(seats) { this.thinkBars = {}; const now = Date.now(); for (const s of seats) this.thinkBars[s] = now; this.renderTable(); }
    clearThinkBars() { if (!this.thinkBars) return; this.thinkBars = null; this.renderTable(); }
    vetoWindowFx(mult, l) {
      const g = this.g, me = g.p(this.me);
      const who = g.players.filter(p => !p.dead && p.seat !== this.me && (!l || !l.who || l.who.includes(p.seat))).map(p => p.seat);
      this.setThinkBars(who);
      // 你也可能响应：所有人的读条和对你的询问同时出现，不等读条
      if (!me.dead && (!l || l.skip !== this.me) && g.canProduce(me, ['veto'], { reason: 'veto' })) { this.vetoBars = true; return Promise.resolve(); }
      const p = this.$('.qx-prompt'); if (p && !this.ui) p.innerHTML = `<div class="qx-ptxt qx-pwait">${esc(this.T.t('waitVetoAll', { c: this.T.cardName('veto') }))}</div>`;
      return sleep(Math.max(350, 750 * mult)).then(() => this.clearThinkBars());
    }
    judgeVerdict(l, hits) {
      const c = this.g.card(l.card); if (!c) return null;
      if (['lotus', 'blockade', 'damocles'].includes(l.reason)) return hits.has(l.seat);
      if (l.reason === 'aegis') return c.suit === 'heart' || c.suit === 'diamond';
      return null;
    }
    judgeMark(id, ok) {
      const el = this.$(`.qx-ctr [data-cid="${id}"]`); if (!el) return;
      const m = document.createElement('div'); m.className = 'qx-jmark ' + (ok ? 'qx-jok' : 'qx-jno'); m.textContent = ok ? '✓' : '✗';
      el.appendChild(m);
    }
    // 一组牌同时飞行；从别人手里出 / 进别人手里的牌以牌背飞，摸牌以一叠牌背飞
    flyMany(mvs, mult, speed) {
      if (!mvs.length) return Promise.resolve();
      const groups = new Map(); const singles = [];
      for (const mv of mvs) {
        if (mv.k0 === 'deck' && /^h:/.test(mv.k1) && mv.k1 !== 'h:' + this.me) { const k = mv.k1; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(mv); }
        else singles.push(mv);
      }
      const jobs = [];
      singles.forEach((mv, i) => jobs.push(this.fly(mv, mv.k0 === 'deck' ? i * 170 * mult : 0, mult * (speed || 1))));
      for (const [k, arr] of groups) jobs.push(this.flyStack(arr, k, mult));
      return Promise.all(jobs);
    }
    centerSlot() { const list = this.center || []; return { x: this.bw() / 2 - 50, y: 276, w: 100, h: 152 }; }
    fly(mv, delay, mult) {
      return new Promise(res => {
        const fx = this.$('.qx-fx'); const c = this.g.card(mv.id); if (!c) return res();
        const CW = 100, CH = 152;
        const landed = () => { if (!mv.keep) this.dispSet(mv.id, mv.k1); };
        if (delay) setTimeout(() => this.dispSet(mv.id, 'air'), delay); else this.dispSet(mv.id, 'air');
        const el = document.createElement('div'); el.className = 'qx-fly';
        const face = !mv.back && (this.keyVisible(mv.k1) || this.keyVisible(mv.k0) || mv.fromBar);
        const toEl = mv.toRect ? null : (mv.el && !mv.el.isConnected ? (this.cardEl(mv.id) || mv.el) : mv.el);
        const toBar = toEl && (toEl.classList.contains('qx-ebar') || toEl.classList.contains('qx-sbar') || toEl.classList.contains('qx-omk'));
        let from = mv.from || this.anchorRect(mv.k0);
        const to = mv.toRect || (toEl ? this.rel(toEl) : this.anchorRect(mv.k1));
        const slideIn = mv.k0 === 'deck' && mv.k1 === 'h:' + this.me && toEl;
        if (slideIn) { const hd = this.$('.qx-dhand'); const hr = hd ? this.rel(hd) : to; from = { x: Math.max(to.x + 300, hr.x + hr.w + 60), y: to.y, w: to.w, h: to.h }; }
        const omenMove = mv.omenMove || (/^j:/.test(mv.k0) && /^j:/.test(mv.k1));
        if (omenMove) {
          // 天兆标记换位（如达摩克利斯之剑传给下家）：标记保持原大小，直线平移到对方标记栏里它的新位置
          const nm = c.omenAs || c.name; const known = ['damocles', 'lotus', 'blockade'].includes(nm);
          el.innerHTML = `<img class="qx-flyom" src="${this.asset('seat/omen-' + (known ? nm : 'lotus') + '.png')}" alt="">`;
          const W0 = from.w || 34;
          this.hideSet = this.hideSet || new Set(); this.hideSet.add(mv.id);
          this.dispSet(mv.id, mv.k1, true);                       // 先把新位置的标记画出来（隐藏），取它的真实坐标
          const dst = this.cardEl(mv.id); const dr = dst ? this.rel(dst) : { x: to.x + (to.w - W0) / 2, y: to.y + (to.h - W0) / 2, w: W0, h: W0 };
          el.style.width = W0 + 'px'; el.style.height = W0 + 'px';
          fx.appendChild(el);
          const a = el.animate([{ transform: `translate(${from.x}px,${from.y}px)` }, { transform: `translate(${dr.x + (dr.w - W0) / 2}px,${dr.y + (dr.h - W0) / 2}px)` }], { duration: Math.max(500, 800 * mult), easing: 'ease-in-out', fill: 'both' });
          const done = () => { el.remove(); this.unHide(mv.id, dst); res(); }; a.onfinish = done; a.oncancel = done;
          return;
        }
        el.innerHTML = face ? this.cardHTML(c, 'qx-flyc', { as: c.omenAs || c.name }).replace(/ data-id="\d+"/, '') : `<img class="qx-flyb" src="${this.backSrc('game')}" alt="">`;
        el.style.width = CW + 'px'; el.style.height = CH + 'px';
        const cx0 = from.x + from.w / 2, cy0 = from.y + from.h / 2, cx1 = to.x + to.w / 2, cy1 = to.y + to.h / 2;
        const fromDeck = mv.k0 === 'deck';
        const s0 = mv.fromBar ? 0.4 : 1;
        const s1 = toBar ? 0.4 : 1;
        const fadeEnd = !mv.keep && (toBar || !(toEl || mv.toRect));
        fx.appendChild(el);
        const dur = Math.max(420, (slideIn ? 640 : 560) * mult);
        const a = el.animate([
          { transform: `translate(${cx0 - CW / 2}px,${cy0 - CH / 2}px) scale(${s0})`, opacity: (fromDeck && !slideIn) || mv.fromSeat ? 0 : slideIn ? 0.15 : 1 },
          { transform: `translate(${cx0 + (cx1 - cx0) * 0.25 - CW / 2}px,${cy0 + (cy1 - cy0) * 0.25 - CH / 2}px) scale(${s0 + (s1 - s0) * 0.25})`, opacity: 1, offset: 0.25 },
          { transform: `translate(${cx0 + (cx1 - cx0) * 0.85 - CW / 2}px,${cy0 + (cy1 - cy0) * 0.85 - CH / 2}px) scale(${s0 + (s1 - s0) * 0.85})`, opacity: 1, offset: 0.85 },
          { transform: `translate(${cx1 - CW / 2}px,${cy1 - CH / 2}px) scale(${s1})`, opacity: fadeEnd ? 0 : 1 }
        ], { duration: dur, delay, easing: 'cubic-bezier(.35,.1,.25,1)', fill: 'both' });
        const done = () => {
          landed();
          if (mv.keep) { mv.ghost = el; } else el.remove();
          if (toEl) { const te = this.unHide(mv.id, toEl); if (toBar) { te.classList.remove('qx-appear'); void te.offsetWidth; te.classList.add('qx-appear'); } }
          res();
        };
        a.onfinish = done; a.oncancel = done;
      });
    }
    // 交给 / 获得（参照无名杀 $give）：牌先从给出者飞到桌面中央停一下，再飞向获得者
    async giveFly(mvs, mult) { return this.flyMany(mvs, mult); }   // 获得别人的牌：直接从对方武将牌飞到获得者，不经过桌面
    async giveFlyViaCenter(mvs, mult) {
      const viaCenter = mvs.filter(m => /^(h|e|j):/.test(m.k0) && m.k0.slice(2) !== m.k1.slice(2));
      const direct = mvs.filter(m => !viaCenter.includes(m));
      const jobs = [];
      if (direct.length) jobs.push(this.flyMany(direct, mult));
      if (viaCenter.length) jobs.push((async () => {
        const c0 = Object.assign({}, this.centerSlot()); const n = viaCenter.length; const gap = Math.min(108, 520 / Math.max(1, n)); const busy = (this.center || []).length; if (busy) c0.x += Math.min(270, busy * 54) + 60 + (n - 1) * gap / 2;
        const legs = viaCenter.map((m, i) => { const to = { x: c0.x + (i - (n - 1) / 2) * gap, y: c0.y, w: 100, h: 152 }; return Object.assign({}, m, { toRect: to, keep: true, el: null }); });
        await Promise.all(legs.map(l => this.fly(l, 0, mult)));
        await sleep(Math.max(200, 300 * mult));
        await Promise.all(legs.map((l, i) => { if (l.ghost) l.ghost.remove(); const m = viaCenter[i]; m.from = l.toRect; return this.fly(m, 0, mult); }));
      })());
      await Promise.all(jobs);
    }
    // 装备：先到桌面中央展示，再横插进装备栏
    async equipFly(mv, mult) {
      const bar = mv.el; mv.toRect = this.centerSlot(); mv.keep = true;
      await this.fly(mv, 0, mult);
      await sleep(Math.max(250, 420 * mult));
      if (mv.ghost) { const gh = mv.ghost; gh.animate([{ opacity: 1 }, { opacity: 0, transform: gh.style.transform }], { duration: 220, fill: 'both' }).onfinish = () => gh.remove(); }
      this.dispSet(mv.id, mv.k1, true);
      const barNow = this.cardEl(mv.id);
      if (barNow) { barNow.style.visibility = ''; barNow.classList.remove('qx-slidein'); void barNow.offsetWidth; barNow.classList.add('qx-slidein'); }
      if (0 && bar) { const b2 = this.unHide(mv.id, bar); b2.classList.remove('qx-slidein'); void b2.offsetWidth; b2.classList.add('qx-slidein'); } if (0 && bar) { bar.style.visibility = ''; bar.classList.remove('qx-slidein'); void bar.offsetWidth; bar.classList.add('qx-slidein'); }
      await sleep(Math.max(250, 420 * mult));
    }

    // 别人摸牌（参照无名杀 $draw）：每张牌从牌堆（桌面中央）单独飞出，相隔 50ms，落点左右散开（每张 20px，最多 ±80px），飞行 0.8 秒后淡出
    flyStack(arr, k, mult) {
      const from = this.anchorRect('deck'); const to = this.anchorRect(k); const fx = this.$('.qx-fx');
      const CW = 100, CH = 152; const n = arr.length;
      const spread = n > 1 ? Math.min(80, (n - 1) * 20) : 0;
      return Promise.all(arr.map((_, i) => new Promise(res => {
        const mv = arr[i]; setTimeout(() => this.dispSet(mv.id, 'air'), i * 50);
        const el = document.createElement('div'); el.className = 'qx-fly';
        el.innerHTML = `<img class="qx-flyb" src="${this.backSrc('game')}" alt="">`; el.style.width = CW + 'px'; el.style.height = CH + 'px';
        fx.appendChild(el);
        const x0 = from.x + from.w / 2 - CW / 2, y0 = from.y + from.h / 2 - CH / 2;
        const dx = n > 1 ? -spread + 2 * spread * i / (n - 1) : 0;
        const x1 = to.x + to.w / 2 - CW / 2 + dx, y1 = to.y + to.h / 2 - CH / 2;
        const fly = Math.max(480, 800 * mult), fade = Math.max(260, 500 * mult);
        const a = el.animate([
          { transform: `translate(${x0}px,${y0}px)`, opacity: 0 },
          { transform: `translate(${x0 + (x1 - x0) * .08}px,${y0 + (y1 - y0) * .08}px)`, opacity: 1, offset: .06 },
          { transform: `translate(${x1}px,${y1}px)`, opacity: 1, offset: fly / (fly + fade) },
          { transform: `translate(${x1}px,${y1}px)`, opacity: 0 }
        ], { duration: fly + fade, delay: i * 50, easing: 'ease-out', fill: 'both' });
        setTimeout(() => { this.dispSet(mv.id, mv.k1); res(); }, fly + i * 50);   // 落位即可继续，淡出在后台完成
        const done = () => { el.remove(); }; a.onfinish = done; a.oncancel = () => { el.remove(); res(); };
      })));
    }
    drawLine(p0, p1, mult, toMe) {
      return new Promise(res => {
        const svg = this.$('.qx-lines'); if (!svg) return res();
        const len = Math.hypot(p1.x - p0.x, p1.y - p0.y); if (len < 8) return res();
        const ns = 'http://www.w3.org/2000/svg'; const ln = document.createElementNS(ns, 'line');
        ln.setAttribute('x1', p0.x); ln.setAttribute('y1', p0.y); ln.setAttribute('x2', p1.x); ln.setAttribute('y2', p1.y);
        ln.setAttribute('class', 'qx-ln'); ln.style.strokeDasharray = len; svg.appendChild(ln);
        const a = ln.animate([{ strokeDashoffset: len, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: 0.35 }, { strokeDashoffset: 0, opacity: 1, offset: 0.75 }, { strokeDashoffset: 0, opacity: 0 }], { duration: Math.max(300, 1000 * mult), easing: 'ease-out', fill: 'both' });
        const done = () => { ln.remove(); res(); }; a.onfinish = done; a.oncancel = done;
      });
    }
    drawSelLines() {
      const svg = this.$('.qx-lines'); if (!svg) return; svg.querySelectorAll('.qx-lsel').forEach(e => e.remove()); return;
      svg.querySelectorAll('.qx-lsel').forEach(e => e.remove());
      const u = this.ui; if (!u) return;
      const tg = u.targets.map(p => p.seat);
      const ns = 'http://www.w3.org/2000/svg'; const p0 = this.seatPt(this.me);
      for (const s of tg) {
        if (s === this.me) continue; const p1 = this.seatPt(s);
        const ln = document.createElementNS(ns, 'line');
        ln.setAttribute('x1', p0.x); ln.setAttribute('y1', p0.y); ln.setAttribute('x2', p1.x); ln.setAttribute('y2', p1.y); ln.setAttribute('class', 'qx-ln qx-lsel'); svg.appendChild(ln);
      }
    }
    // 体力：动画时只更新这一个座位的星
    setHpShown(seat, hp, quiet) {
      const p = this.g.p(seat);
      if (this.hpShown) this.hpShown[seat] = hp;
      const rail = seat === this.me ? this.$('.qx-dpor .qx-srail') : this.$(`.qx-st[data-seat="${seat}"] .qx-srail`);
      if (rail && !this.isDeadShown(p)) {
        const old = rail.dataset.hp != null ? +rail.dataset.hp : hp; const om = rail.dataset.max != null ? +rail.dataset.max : p.maxHp;
        if (!(quiet && old === hp && om === p.maxHp)) rail.innerHTML = this.starsHTML(p, hp, quiet ? hp : old);
        rail.dataset.hp = hp; rail.dataset.max = p.maxHp;
      }
      const info = seat === this.me ? this.$('.qx-dinfo .qx-dhp') : null; if (info) info.textContent = this.T.t('hpNow', { h: Math.max(0, hp), m: p.maxHp });
    }
    hitFx(seat, text, kind, mult, newHp, from) {
      return new Promise(res => {
        const el = this.porEl(seat);
        if (newHp != null) this.setHpShown(seat, newHp);
        if (!el) return res();
        // 受伤震动（参照无名杀 $damage）：有来源时朝远离来源的方向推开 20px 再回位；无来源时轻微缩小
        if (kind !== 'heal') {
          const D = Math.max(260, 500 * mult);
          let tf = 'scale(.95)';
          if (from != null && from !== seat) { const a = this.seatPt(from), b = this.seatPt(seat); const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; tf = `translate(${(20 * dx / L).toFixed(1)}px,${(20 * dy / L).toFixed(1)}px)`; }
          el.animate([{ transform: 'none' }, { transform: tf, offset: .3 }, { transform: 'none' }], { duration: D, easing: 'ease-out' });
        }
        const cls = kind === 'heal' ? 'qx-healfx' : kind === 'lose' ? 'qx-losefx' : 'qx-hitfx' + (kind === 'fire' ? ' qx-hfire' : kind === 'thunder' ? ' qx-hthunder' : '');
        el.classList.remove('qx-hitfx', 'qx-healfx', 'qx-losefx', 'qx-hfire', 'qx-hthunder'); void el.offsetWidth;
        el.style.setProperty('--qx-d', Math.max(300, 720 * mult) + 'ms');
        cls.split(' ').forEach(c => el.classList.add(c));
        const n = document.createElement('div'); n.className = 'qx-fnum' + (kind === 'heal' ? ' qx-fheal' : ''); n.textContent = text;
        const fl = el.querySelector('.qx-fxl') || el; fl.appendChild(n);
        n.animate([{ transform: 'translate(-50%,0) scale(.5)', opacity: 0 }, { transform: 'translate(-50%,-12px) scale(1.2)', opacity: 1, offset: .2 }, { transform: 'translate(-50%,-20px) scale(1)', opacity: 1, offset: .6 }, { transform: 'translate(-50%,-40px) scale(1)', opacity: 0 }], { duration: Math.max(500, 1200 * mult), easing: 'ease-out', fill: 'both' }).onfinish = () => n.remove();
        setTimeout(() => { el.classList.remove('qx-hitfx', 'qx-healfx', 'qx-losefx', 'qx-hfire', 'qx-hthunder'); res(); }, Math.max(320, 760 * mult));
      });
    }
    // 出杀 / 闪 / 药 / 酒：头像上冒出大字
    stampFx(seat, name, mult) {
      const fam = E.family ? E.family({ name }) : name;
      const kind = /strike/.test(name) ? (name === 'fire_strike' ? 'fire' : name === 'thunder_strike' ? 'thunder' : 'strike') : ['parry', 'remedy', 'grog'].includes(name) ? name : null;
      if (!kind) return;
      const el = this.porEl(seat); if (!el) return;
      const txt = this.lang === 'zh' ? { strike: '杀', fire: '杀', thunder: '杀', parry: '闪', remedy: '药', grog: '酒', veto: '懈' }[kind] : this.T.cardName(name).toUpperCase();
      const s = document.createElement('div'); s.className = `qx-stamp qx-st-${kind}${this.lang === 'zh' ? '' : ' qx-sten'}`; s.textContent = txt;
      (el.querySelector('.qx-fxl') || el).appendChild(s);
      s.animate([{ transform: 'translate(-50%,-50%) scale(2.2)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(.95)', opacity: 1, offset: .22 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .7 }, { transform: 'translate(-50%,-50%) scale(1.08)', opacity: 0 }], { duration: Math.max(500, 950 * mult), easing: 'ease-out', fill: 'both' }).onfinish = () => s.remove();
      void fam;
    }
    // 技能：座位下方弹出金边牌匾；限定技、觉醒技再加立绘特写
    skillFx(seat, id, mult) {
      const d = E.SKILLS[id]; const name = d ? this.T.skillName(id) : this.T.cardName(id);
      const el = seat === this.me ? this.$('.qx-dpor') : this.$(`.qx-st[data-seat="${seat}"]`);
      if (el) {
        const b = document.createElement('div'); b.className = 'qx-skplq'; b.textContent = name; const pe = this.porEl(seat); b.style.bottom = 'auto'; b.style.top = Math.max(0, (pe ? pe.offsetHeight : 200) - 40) + 'px'; el.appendChild(b);
        b.animate([{ transform: 'translate(-50%,8px) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,0) scale(1.08)', opacity: 1, offset: .15 }, { transform: 'translate(-50%,0) scale(1)', opacity: 1, offset: .8 }, { transform: 'translate(-50%,-6px) scale(1)', opacity: 0 }], { duration: Math.max(900, 1700 * mult), easing: 'ease-out', fill: 'both' }).onfinish = () => b.remove();
        const por = this.porEl(seat); if (por) { por.classList.remove('qx-skfx'); void por.offsetWidth; por.classList.add('qx-skfx'); }
      }
      const p = this.g.p(seat);
      if (d && (d.type === 'limited' || d.type === 'awaken') && p.hero) return this.splash(p.hero, name, mult);
      return sleep(Math.max(120, 300 * mult));
    }
    splash(hero, name, mult) {
      return new Promise(res => {
        const s = document.createElement('div'); s.className = 'qx-splash';
        s.innerHTML = `<img src="${this.heroSrc(hero, true)}" alt=""><div>${esc(name)}</div>`;
        s.style.left = (this.bw() / 2) + 'px';
        this.$('.qx-fx').appendChild(s);
        const a = s.animate([{ transform: 'translate(-50%,-50%) scale(.82)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .18 }, { transform: 'translate(-50%,-50%) scale(1.02)', opacity: 1, offset: .8 }, { transform: 'translate(-50%,-50%) scale(1.05)', opacity: 0 }], { duration: Math.max(900, 1700 * mult), easing: 'ease-out', fill: 'both' });
        a.onfinish = () => { s.remove(); res(); };
      });
    }
    showFan(seat, ids, mult) {
      const el = seat === this.me ? this.$('.qx-dpor') : this.$(`.qx-st[data-seat="${seat}"]`); if (!el) return sleep(0);
      const r = this.rel(el); const f = document.createElement('div'); f.className = 'qx-fan';
      f.innerHTML = ids.map((id, i) => this.cardHTML(this.g.card(id), 'qx-mini').replace(/data-id="\d+"/, '')).join('');
      const x = r.x + r.w / 2 > this.bw() / 2 ? r.x - 70 * ids.length - 10 : r.x + r.w + 10;
      f.style.left = Math.max(4, x) + 'px'; f.style.top = (seat === this.me ? r.y - 100 : r.y + 30) + 'px';
      this.$('.qx-fx').appendChild(f);
      const a = f.animate([{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'scale(1)', offset: .15 }, { opacity: 1, offset: .82 }, { opacity: 0 }], { duration: Math.max(900, 1700 * mult), fill: 'both' });
      a.onfinish = () => f.remove();
      return sleep(Math.max(300, 700 * mult));
    }
    deathFx(seat, mult) {
      if (this.deadHold) this.deadHold.delete(seat);
      const p = this.g.p(seat); const root = seat === this.me ? this.$('.qx-dpor') : this.$(`.qx-st[data-seat="${seat}"]`);
      if (!root) return sleep(0);
      root.classList.add('qx-sdead'); root.classList.remove('qx-sdying');
      const sc = root.querySelector('.qx-sc');
      if (sc) {
        const rail = sc.querySelector('.qx-srail'); if (rail) rail.innerHTML = '';
        const b = sc.querySelector('.qx-sbadge'); if (b) b.remove();
        sc.insertAdjacentHTML('beforeend', this.deadPlaque(p, true));
      }
      return sleep(Math.max(500, 1300 * mult));
    }
    deadPlaque(p, anim) { return `<div class="qx-dead${anim ? ' qx-dnew' : ''}"><img src="${this.idSrc(p.role, true)}" alt="${esc(this.T.role(p.role))}" data-zoomid="${p.role}"><div class="qx-dplq"><b>${esc(this.T.t('dead'))}</b></div></div>`; }
    // AI 思考时间（毫秒）
    thinkMs(req, ans) {
      const mult = this.animMult(); if (!mult) return 0;
      const k = req.kind; let base = 0;
      const acted = ans != null && ans !== false && !(Array.isArray(ans) && !ans.length);
      const D = 500;   // 无名杀的基础时长
      if (k === 'chooseHero') return req.player.role === 'chancellor' ? Math.round(2 * D * mult) : 0;
      if (k === 'play') base = ans && ans.action === 'end' ? 1 * D : 1.6 * D;
      else if (k === 'respond' || k === 'useStrike') base = acted ? (req.reason === 'veto' ? 1 * D : 1.4 * D) : (req.reason === 'veto' ? 0 : req.reason === 'save' ? 1 * D : 0.6 * D);
      else if (k === 'confirm') base = acted ? 1.2 * D : 0;
      else base = 1.2 * D;
      if (!base) return 0;
      return Math.round(base * mult * (0.85 + Math.random() * 0.3));
    }
    waitText(req) {
      const t = this.T.t, s = this.who(req.player.seat);
      if (req.kind === 'respond' && req.reason === 'save') return t('waitSave', { s, c: this.T.cardName('remedy') });
      if (req.kind === 'respond' && req.reason === 'veto') return t('waitVeto', { s, c: this.T.cardName('veto') });
      if (req.kind === 'respond' && req.pattern) return t('waitResp', { s, c: req.pattern.map(this.T.cardName).join(' / ') });
      return t('thinking', { s });
    }
    showThink(req, ms) {
      const seat = req.player.seat;
      this.setThinkBars([seat]);
      const p = this.$('.qx-prompt'); if (p) p.innerHTML = `<div class="qx-ptxt qx-pwait">${esc(this.waitText(req))}</div>`;
    }
    pvars(req) {
      const g = this.g; const ts = req.to != null ? req.to : req.target != null ? req.target : req.pindianWith != null ? req.pindianWith : req.judgeSeat;
      return { t: this.who(ts), n: req.n != null ? req.n : req.min, c: req.card != null ? this.T.cardLabel(g.card(req.card)) : req.judgeCard != null ? this.T.cardLabel(g.card(req.judgeCard)) : '' };
    }
    who(s) { if (s == null) return ''; if (s === this.me) return this.T.t('you'); const p = this.g && this.g.p(s); return p && p.hero ? this.T.heroName(p.hero) : this.T.t('seat', { n: s + 1 }); }
    promptParts() {
      const u = this.ui, T = this.T, t = T.t, g = this.g, me = g.p(this.me), req = u.req, k = req.kind;
      const btn = (act, label, on, cls) => `<button class="qx-dbt${cls ? ' ' + cls : ''}" data-act="${act}"${on === false ? ' disabled' : ''}>${esc(label)}</button>`;
      const skillBtns = () => this.viewAsList().map(s => `<button class="qx-btn${u.skill === s.key && (u.asName || null) === s.asName ? ' qx-on' : ''}" data-skill="${s.key}|${s.asName || ''}">${esc(T.skillName(s.id) + (s.asName ? '·' + T.cardName(s.asName) : ''))}</button>`).join('');
      let text = '', btns = '';
      if (k === 'play') {
        const c = u.active ? null : this.curCard();
        if (u.active) {
          const sp = this.activeSpec(); const lab = sp.a.options ? T.option(sp.a.options[u.active.option]) : T.skillName(sp.inst.id);
          const parts = [];
          if (sp.cards.max) parts.push(t('nCards', { n: sp.cards.min === sp.cards.max ? sp.cards.max : sp.cards.min + '–' + sp.cards.max }));
          if (sp.tg.max) parts.push(t('nTargets', { n: sp.tg.min === sp.tg.max ? sp.tg.max : sp.tg.min + '–' + sp.tg.max }));
          text = parts.length ? t('pickSkill', { k: lab, c: parts.join(t('and')), tg: '' }) : lab;
        }
        else if (u.skill) text = this.viewAsText();
        else if (c && !g.autoTargets(me, c) && D[c.name].targets) {
          const spec = D[c.name].targets;
          text = c.name === 'catspaw' ? t('pickTargetsCat') : this.tgText({ c: T.cardName(c.name), min: spec.min == null ? 1 : spec.min, max: g.maxTargets(me, c) });
        } else text = t('play');
        const acts = this.activeButtons().map(b => `<button class="qx-btn${u.active && u.active.key === b.key && u.active.option === b.opt ? ' qx-on' : ''}" data-active="${b.key}|${b.opt == null ? '' : b.opt}">${esc(b.label)}</button>`).join('');
        const rc = u.sel.length === 1 && !u.skill && !u.active && D[u.sel[0].name].recastable && !u.targets.length;
        btns = rc ? btn('recast', t('recast'), true, 'qx-primary') : btn('ok', t('playBtn'), this.canConfirm(), 'qx-primary');
        if (u.skill) { const c2 = this.curCard(); if (c2 && !g.autoTargets(me, c2) && D[c2.name].targets) text = this.tgText({ c: T.cardName(c2.name), min: D[c2.name].targets.min == null ? 1 : D[c2.name].targets.min, max: g.maxTargets(me, c2) }); }
        if (u.skill || u.active) btns += btn('cancel', t('cancel'));
        btns += btn('end', t('endPlay'));
      } else if (k === 'respond') {
        text = this.respondText(req);
        btns = btn('ok', t('confirm'), this.canConfirm(), 'qx-primary') + btn('cancel', t('cancel'));
      } else if (k === 'distribute') {
        text = t('distTip');
        btns = btn('ok', t('distBtn'), this.canConfirm(), 'qx-primary') + btn('cancel', t('cancel'));
      } else if (k === 'useStrike') {
        text = T.prompt(req.reason, { t: this.who(req.options[0]) }) || t(req.reason === 'berserker' ? 'us_berserker' : 'us_generic', { t: this.who(req.options[0]) });
        btns = btn('ok', t('confirm'), this.canConfirm(), 'qx-primary') + btn('cancel', t('cancel'));
      } else if (k === 'chooseCards') {
        const r = req.reason;
        if (r === 'phaseDiscard') text = t('phaseDiscard', { n: req.min });
        else if (r === 'greekfireShow') text = t('greekfireShow');
        else if (r === 'greekfire') { const sc = g.card(req.shown); text = t('greekfire', { s: sc ? T.suitName(sc.suit) : '' }); }
        else if (r === 'gemini') text = t('gemini');
        else if (r === 'ram') text = t('ram');
        else if (r === 'mirrorRetouch') text = T.prompt('mirrorRetouch', { t: this.who(req.judgeSeat), c: T.cardLabel(g.card(req.judgeCard)) });
        else if (r === 'lectureGive' || r === 'proofGive') text = T.prompt(r, { t: this.who(req.to) });
        else if (r === 'defianceDiscard' || r === 'vengeanceDiscard') text = T.prompt(r, { n: req.min });
        else text = T.prompt(r, this.pvars(req)) || t('chooseCards', { min: req.min, max: req.max });
        btns = btn('ok', t('confirm'), this.canConfirm(), 'qx-primary') + (req.min === 0 ? btn('cancel', t('cancel')) : '');
      } else if (k === 'chooseTargets') {
        text = T.prompt(req.reason, this.pvars(req)) || t('targets', { min: req.min, max: req.max });
        btns = btn('ok', t('confirm'), this.canConfirm(), 'qx-primary');
      } else if (k === 'confirm') {
        if (D[req.skill]) { text = t('confirmEquip', { c: T.cardName(req.skill) }); btns = btn('yes', t('confirm'), true, 'qx-primary') + btn('no', t('cancel')); }
        else { text = t('askSkill', { k: T.skillName(req.skill) }); btns = btn('yes', t('yes'), true, 'qx-primary') + btn('no', t('no')); }
      } else {
        text = t('option');
      }
      return { text, btns };
    }
    tgText(o) { const t = this.T.t; if (+o.min === +o.max) return t(+o.max === 1 ? 'pickTarget1' : 'pickTargetsN', { c: o.c, n: o.max }); return t('pickTargets', o); }
    // 转化技能的提示：用实际选中的技能 / 装备名和它能转化成的牌
    viewAsText() {
      const u = this.ui, T = this.T, t = T.t, g = this.g, me = g.p(this.me);
      const inst = g.skillList(me).find(s => s.key === u.skill); if (!inst) return '';
      const v = inst.def.viewAs || {}; const n = v.count == null ? 1 : v.count;
      const k = inst.src === 'equip' ? T.cardName(inst.id) : T.skillName(inst.id);
      let as = u.asName || (typeof v.as === 'string' ? v.as : null);
      if (!as) { const pats = u.req.kind === 'play' ? null : (u.req.pattern || (u.req.kind === 'useStrike' ? ['strike'] : null)); if (pats && pats.length === 1) as = pats[0]; else if (v.patterns && v.patterns.length === 1) as = v.patterns[0]; }
      return as ? t('viewAsPick', { k, n, c: T.cardName(as) }) : t('viewAsPick0', { k, n });
    }
    promptText() { const u = this.ui; if (!u) return ''; if (['chooseCard', 'pick', 'chooseOption', 'chooseSkillOrder', 'chooseHero', 'arrange'].includes(u.req.kind)) return ''; return this.promptParts().text; }
    buttonsHTML() { const u = this.ui; if (!u) return ''; return this.promptParts().btns; }
    dimAll() { return false; const u = this.ui; if (!u) return false; const k = u.req.kind; return k === 'confirm' || (k === 'respond' && ['veto', 'save'].includes(u.req.reason)) || k === 'chooseOption' || k === 'chooseCard'; }
    respondText(req) {
      const t = this.T.t, T = this.T, r = req.reason;
      if (r === 'strike') return req.need > 1 ? t('r_strike2', { s: this.who(req.source), n: req.need, g: req.got }) : t('r_strike', { s: this.who(req.source) });
      if (r === 'duel') return t('r_duel', { s: this.who(req.source) });
      if (r === 'invasion') return t('r_invasion');
      if (r === 'arrowstorm') return t('r_arrowstorm');
      if (r === 'rally' || r === 'escort') return T.prompt(r, { t: this.who(req.source) });
      if (r === 'save') return req.target === this.me ? t('r_saveSelf') : t('r_save', { t: this.who(req.target) });
      if (r === 'veto') {
        const v = req.vetoOf || {};
        if (v.card === 'veto') return t('r_vetoVeto', { f: this.who(v.from) });
        if (v.omen) return t('r_vetoOmen', { t: this.who(v.target), c: T.cardName(v.card) });
        return t('r_veto', { f: this.who(v.from), c: T.cardName(v.card), t: v.target != null ? t('r_vetoTarget', { t: this.who(v.target) }) : '' });
      }
      return t('r_generic', { p: req.pattern.map(T.cardName).join(' / ') });
    }
    renderLog() {
      const g = this.g; const box = this.$('.qx-log'); let add = '';
      for (; this.logIdx < g.logs.length; this.logIdx++) {
        const l = this.T.logLine(g, g.logs[this.logIdx], this.me);
        if (l) add += `<div class="${l[0] ? 'qx-l-' + l[0] : ''}">${esc(l[1])}</div>`;
      }
      if (add) { box.insertAdjacentHTML('beforeend', add); box.scrollTop = box.scrollHeight; }
    }

    // ── 弹窗 ──
    showModal(html) {
      const m = this.$('.qx-modal');
      if (m.classList.contains('qx-hidden') || !m.firstElementChild) { m.innerHTML = html; m.classList.remove('qx-hidden'); }
      else morph(m, html);
    }
    openChoiceModal() {
      const u = this.ui, T = this.T, t = T.t, g = this.g, req = u.req, k = req.kind;
      let title = '', sub = '', body = '', foot = '', cls = '';
      const card = (c, attr, extra) => this.cardHTML(c, 'qx-mcard' + (extra || ''), { as: c.omenAs || c.name }).replace(/data-id="\d+"/, attr);
      const btn = (act, label, on, c2) => `<button class="qx-dbt${c2 ? ' ' + c2 : ''}" data-act="${act}"${on === false ? ' disabled' : ''}>${esc(label)}</button>`;
      if (k === 'chooseCard') {
        const key = { sabotage: 'c_sabotage', pilfer: 'c_pilfer', winter: 'c_winter' }[req.reason];
        title = key ? t(key, { t: this.who(req.target) }) : (T.prompt(req.reason, this.pvars(req)) || t('c_generic', { t: this.who(req.target) }));
        const n = req.count || 1; const vw = this.view(); const B = u.btn || [];
        if (n > 1) sub = t('pickN', { n });
        const opts = req.options.map(id => g.card(id));
        const hand = opts.filter(c => c.loc.zone === 'hand'), eqs = opts.filter(c => c.loc.zone === 'equip'), js = opts.filter(c => c.loc.zone === 'judge');
        const pk = id => B.includes(id) ? ' qx-picked' : (vw && !vw.buttons.has(id) ? ' qx-dim' : '');
        const handHTML = hand.map(c => req.visible ? card(c, `data-opt="${c.id}"`, pk(c.id)) : `<div class="qx-mback${pk(c.id)}" data-opt="${c.id}"><img src="${this.backSrc('game')}" alt=""></div>`).join('');
        const ov = hand.length > 7 ? Math.max(-72, Math.floor((700 - 100) / (hand.length - 1)) - 108) : 0;
        const rowH = (lab, inner) => `<div class="qx-crow"><div class="qx-clab">${esc(lab)}</div><div class="qx-cards qx-nowrap" style="--ov:${ov}px">${inner || `<span class="qx-cnone">—</span>`}</div></div>`;
        body = rowH(t('hand'), handHTML) + `<div class="qx-crow2">` + `<div class="qx-crow qx-crw"><div class="qx-clab">${esc(t('arsenal'))}</div><div class="qx-cards qx-nowrap">${eqs.map(c => card(c, `data-opt="${c.id}"`, pk(c.id))).join('') || `<span class="qx-cnone">—</span>`}</div></div>` + `<div class="qx-crow qx-crn"><div class="qx-clab">${esc(t('omens'))}</div><div class="qx-cards qx-nowrap">${js.map(c => card(c, `data-opt="${c.id}"`, pk(c.id))).join('') || `<span class="qx-cnone">—</span>`}</div></div></div>`;
        if (n > 1) foot += btn('csOk', t('confirm'), !!(vw && vw.ok), 'qx-primary');
        if (req.optional) foot += btn('skip', t('cancel'), true, 'qx-cancel');
        cls = 'qx-mwide qx-mcw';
      } else if (k === 'arrange') {
        title = T.prompt(req.reason) || T.prompt('telescope') || t('option'); sub = t('arrangeTip');
        u.arr = u.arr || { top: req.options.slice(), bottom: [] };
        const n = req.options.length;
        const row = (name, arr) => `<div class="qx-arow"><div class="qx-clab">${esc(t(name === 'top' ? 'deckTop' : 'deckBottom'))}</div><div class="qx-aslots">${Array.from({ length: n }, (_, i) => `<div class="qx-aslot" data-row="${name}" data-idx="${i}">${arr[i] != null ? `<div class="qx-acard" data-arr="${arr[i]}">${this.cardHTML(g.card(arr[i]), 'qx-mcard').replace(/data-id="\d+"/, '')}</div>` : ''}</div>`).join('')}</div></div>`;
        body = row('top', u.arr.top) + row('bottom', u.arr.bottom);
        foot = btn('arrangeOk', t('confirm'), true, 'qx-primary');
        cls = 'qx-mwide';
      } else if (k === 'pick' && req.multi) {
        title = T.prompt(req.reason, this.pvars(req)) || t('option');
        const vw = this.view(); const B = u.btn || [];
        body = `<div class="qx-mcards">${req.options.map(id => card(g.card(id), `data-mul="${id}"`, B.includes(id) ? ' qx-picked' : (vw && !vw.buttons.has(id) ? ' qx-dim' : ''))).join('')}</div>`;
        foot = btn('multiOk', t('confirm'), !!(vw && vw.ok), 'qx-primary');
        cls = 'qx-mwide';
      } else if (k === 'pick') {
        title = req.reason === 'feast' ? t('pick_feast') : (T.prompt(req.reason, this.pvars(req)) || t('option'));
        const show = req.show || req.options;
        body = `<div class="qx-mcards">${show.map(id => req.options.includes(id) ? card(g.card(id), `data-opt="${id}"`) : card(g.card(id), '', ' qx-dim')).join('')}</div>`;
        if (req.optional) foot = btn('skip', t('cancel'), true, 'qx-cancel');
        cls = 'qx-mwide';
      } else if (k === 'chooseHero') {
        title = t('chooseHero') + ' · ' + T.role(g.p(this.me).role);
        if (req.chancellorHero) sub = t('sovIs', { h: T.heroName(req.chancellorHero) });
        if (req.reason === 'tendPick') title = T.prompt('tendPick') || title;
        body = `<div class="qx-heroes">${req.options.map((k2, i) => this.heroCardHTML(k2, i, req.refreshed[i])).join('')}</div>`;
        if (req.optional) foot = btn('skip', t('cancel'), true, 'qx-cancel');
        cls = 'qx-mhero';
      } else if (k === 'chooseOption') {
        title = T.prompt(req.reason + 'Opt') || t('option');
        const lab = o => T.option(o, { n: req.n });
        body = `<div class="qx-mopts">${req.options.map((o, i) => `<button class="qx-mopt" data-opt="${i}">${esc(lab(o))}</button>`).join('')}</div>`;
      } else if (k === 'chooseSkillOrder') {
        title = t('order');
        const me = g.p(this.me);
        body = `<div class="qx-mopts">${req.options.map(key => { const s = g.skillList(me).find(x => x.key === key); return `<button class="qx-mopt" data-opt="${key}">${esc(s && s.src === 'equip' ? T.cardName(s.id) : T.skillName(s ? s.id : key))}</button>`; }).join('')}</div>`;
      }
      this.showModal(`<div class="qx-box ${cls}"><div class="qx-mtitle"><i></i><span>${esc(title)}</span><i></i></div>${sub ? `<div class="qx-msub">${esc(sub)}</div>` : ''}<div class="qx-mbody">${body}</div>${foot ? `<div class="qx-mfoot">${foot}</div>` : ''}</div>`);
    }
    // 观星：拖动排序 / 拖到下面一行即放到牌堆底；单击在两行之间切换
    bindArrangeDrag() {
      let d = null;
      const root = this.root;
      root.addEventListener('pointerdown', e => {
        const el = e.target.closest('.qx-modal [data-arr]'); if (!el || e.button !== 0) return;
        d = { id: +el.dataset.arr, el, x0: e.clientX, y0: e.clientY, on: false };
      });
      root.addEventListener('pointermove', e => {
        if (!d) return;
        if (!d.on) { if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return; d.on = true; const r = d.el.getBoundingClientRect(); d.dx = d.x0 - r.left; d.dy = d.y0 - r.top; d.ghost = d.el.cloneNode(true); d.ghost.className = 'qx-aghost'; d.ghost.style.width = r.width + 'px'; root.appendChild(d.ghost); d.el.style.opacity = '.25'; }
        d.ghost.style.left = (e.clientX - d.dx) + 'px'; d.ghost.style.top = (e.clientY - d.dy) + 'px';
        root.querySelectorAll('.qx-aslot.qx-ahover').forEach(x => x.classList.remove('qx-ahover'));
        const tgt = document.elementFromPoint(e.clientX, e.clientY); const sl = tgt && tgt.closest('.qx-aslot'); if (sl) sl.classList.add('qx-ahover');
      });
      const end = e => {
        if (!d) return; const was = d; d = null; const u = this.ui; if (!u || !u.arr) return;
        root.querySelectorAll('.qx-aslot.qx-ahover').forEach(x => x.classList.remove('qx-ahover'));
        const A = u.arr; const from = A.top.includes(was.id) ? 'top' : 'bottom';
        if (was.on) {
          was.ghost.remove(); was.el.style.opacity = '';
          const tgt = document.elementFromPoint(e.clientX, e.clientY); const sl = tgt && tgt.closest('.qx-aslot');
          if (sl) { A[from] = A[from].filter(x => x !== was.id); const row = sl.dataset.row; const idx = Math.min(+sl.dataset.idx, A[row].length); A[row].splice(idx, 0, was.id); }
        } else { A[from] = A[from].filter(x => x !== was.id); A[from === 'top' ? 'bottom' : 'top'].push(was.id); }
        this.arrangeJust = true; setTimeout(() => { this.arrangeJust = false; }, 30);
        this.openChoiceModal();
      };
      root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
    }
    heroCardHTML(key, i, refreshed) {
      const T = this.T, t = T.t, h = E.HEROES[key];
      const sk = h.skills.map(id => { const d = E.SKILLS[id] || {}; const tag = { locked: t('lockedTag'), limited: t('limitedTag'), awaken: t('awakenTag'), lord: t('lordTag') }[d.type]; return `<div class="qx-hsk"><b>${esc(T.skillName(id))}</b>${tag ? `<i class="qx-tagi">${esc(tag)}</i>` : ''} ${esc(T.skillDesc(id))}</div>`; }).join('');
      return `<div class="qx-hcard"><div class="qx-hpic" data-zoomhero="${key}"><img src="${this.heroSrc(key)}" alt="${esc(T.heroName(key))}" draggable="false"></div><div><span class="qx-fac" style="background:${T.factionColor(h.faction)}"></span><span class="qx-meta">${esc(T.faction(h.faction))}</span></div>
        <div class="qx-hname">${esc(T.heroName(key))}</div><div class="qx-meta">${esc(T.heroTitle(key))} · ${esc(t('hpN', { n: h.hp }))}</div>${sk}
        <div class="qx-hbtns"><button class="qx-btn qx-primary" data-hero="${key}">${t('pickHero')}</button>${refreshed ? '' : `<button class="qx-btn" data-refresh="${i}">${t('refresh')}</button>`}</div></div>`;
    }
    skillsHTML(p) {
      const T = this.T, t = T.t; if (!this.heroShown(p)) return '';
      return `<div class="qx-skills">${p.skills.map(id => {
        const d = E.SKILLS[id]; if (!d) return '';
        const tag = { locked: t('lockedTag'), limited: t('limitedTag'), awaken: t('awakenTag'), lord: t('lordTag') }[d.type];
        const used = d.type === 'limited' && p.skillState[id];
        return `<span class="qx-sk${used ? ' qx-skused' : ''}" title="${esc((tag ? '[' + tag + '] ' : '') + T.skillDesc(id))}">${esc(T.skillName(id))}</span>`;
      }).join('')}</div>`;
    }
    heroShown(p) { const g = this.g; return !!p.hero && (g.heroesRevealed || !g.opts.selectHeroes || p.role === 'chancellor' || p.seat === this.me); }
    heroLine(p) {
      const T = this.T; if (!this.heroShown(p)) return '';
      return `<span class="qx-fac" style="background:${T.factionColor(p.faction)}"></span><span class="qx-hero">${esc(T.heroName(p.hero))}</span>`;
    }
    closeModal() { const m = this.$('.qx-modal'); if (m) { m.classList.add('qx-hidden'); m.innerHTML = ''; } }
    showGameOver() {
      const g = this.g, T = this.T, t = T.t; if (!g.result) return;
      const w = g.result.winners; const me = g.p(this.me);
      const head = !w.length ? t('draw') : w.includes(me.role) ? t('youWin') : t('youLose');
      const roles = g.players.map(p => `<div>${this.identityHTML(p)}<span>${esc(T.role(p.role))} · ${p.seat === this.me ? t('you') : t('seat', { n: p.seat + 1 })}${p.hero ? ' · ' + esc(T.heroName(p.hero)) : ''}${p.dead ? ' · ' + t('dead') : ''}</span></div>`).join('');
      const m = this.$('.qx-modal');
      m.innerHTML = `<div class="qx-box"><h3>${t('gameOver')} · ${esc(head)}</h3><div class="qx-meta">${w.length ? esc(t('winners', { w: w.map(T.role).join(this.lang === 'zh' ? '、' : ' & ') })) : ''}</div><div class="qx-roles" style="margin:10px 0">${roles}</div><button class="qx-btn qx-primary" data-act="again">${t('again')}</button></div>`;
      m.classList.remove('qx-hidden');
    }
  }

  Table.all = [];
  return { mount: (el, opts) => new Table(el, opts), Table, FACTIONS };
});
