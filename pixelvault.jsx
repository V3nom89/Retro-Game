import { useState, useEffect, useRef } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Orbitron:wght@400;700;900&display=swap');`;

const GAMES = [
  { id: 1, title: "NEON BLASTER", genre: "Sparatutto", platform: "ARCADE", year: 1987, rating: 4.8, players: "12.4K", badge: "HOT", color: "#ff007f", desc: "Distruggi ondate di astronavi aliene in questo classico sparatutto verticale. 32 livelli di puro caos.", tags: ["Azione", "Retro", "Arcade"] },
  { id: 2, title: "DUNGEON QUEST", genre: "GDR", platform: "NES", year: 1989, rating: 4.5, players: "8.1K", badge: "CLASSIC", color: "#00f5ff", desc: "Esplora dungeon generati proceduralmente, combatti mostri e raccogli bottino leggendario.", tags: ["GDR", "Fantasy", "Dungeon"] },
  { id: 3, title: "SPEED RACER X", genre: "Corsa", platform: "SNES", year: 1992, rating: 4.2, players: "5.7K", badge: "NUOVO", color: "#ffe600", desc: "80 piste in 8 mondi. Usa il turbo e vinci il campionato in questo racer futuristico.", tags: ["Corsa", "Velocità", "Futuristico"] },
  { id: 4, title: "PIXEL KNIGHTS", genre: "Piattaforme", platform: "NES", year: 1990, rating: 4.6, players: "19.2K", badge: "NUOVO", color: "#00ff6a", desc: "Salta, colpisci e rotola attraverso 50 livelli di follia medievale in pixel.", tags: ["Piattaforme", "Azione", "Medievale"] },
  { id: 5, title: "STAR FORTRESS", genre: "Strategia", platform: "ARCADE", year: 1985, rating: 4.0, players: "3.4K", badge: "CLASSIC", color: "#bf00ff", desc: "Comanda la tua flotta e difendi la galassia dall'invasione degli Xor.", tags: ["Strategia", "Spazio", "Classico"] },
  { id: 6, title: "CYBER PUNCH", genre: "Picchiaduro", platform: "SNES", year: 1993, rating: 4.7, players: "22.8K", badge: "HOT", color: "#ff6a00", desc: "8 lottatori, 3 arene. Il campionato definitivo di lotta cyber da strada.", tags: ["Picchiaduro", "Cyber", "Versus"] },
  { id: 7, title: "MAZE RUNNER 64", genre: "Puzzle", platform: "NES", year: 1988, rating: 3.9, players: "6.6K", badge: null, color: "#00f5ff", desc: "100 labirinti con trappole, fantasmi e passaggi segreti.", tags: ["Puzzle", "Labirinto", "Classico"] },
  { id: 8, title: "THUNDER HAWK", genre: "Sparatutto", platform: "ARCADE", year: 1991, rating: 4.4, players: "9.3K", badge: "HOT", color: "#ff007f", desc: "Caos in elicottero a scorrimento laterale. Distruggi basi nemiche e salva ostaggi.", tags: ["Azione", "Militare", "Retro"] },
];

const PLATFORMS = ["TUTTI", "NES", "SNES", "ARCADE"];
const GENRES = ["TUTTI", "Sparatutto", "GDR", "Corsa", "Piattaforme", "Picchiaduro", "Strategia", "Puzzle"];

const BADGE_COLORS = {
  HOT: "#ff007f",
  CLASSIC: "#bf00ff",
  NUOVO: "#00ff6a",
};

const css = `
  ${FONTS}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #06060f;
    --bg2: #0b0b1a;
    --bg3: #111128;
    --cyan: #00f5ff;
    --pink: #ff007f;
    --yellow: #ffe600;
    --green: #00ff6a;
    --purple: #bf00ff;
    --text: #dde0ff;
    --dim: #44476a;
    --border: rgba(0,245,255,0.12);
  }
  body { background: var(--bg); color: var(--text); font-family: 'VT323', monospace; }

  .scanlines {
    position: fixed; inset: 0; pointer-events: none; z-index: 9999;
    background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.13) 3px, rgba(0,0,0,0.13) 4px);
  }
  .vignette {
    position: fixed; inset: 0; pointer-events: none; z-index: 9998;
    background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%);
  }

  @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:.96} 94%{opacity:1} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes glow-pulse { 0%,100%{text-shadow:0 0 10px #00f5ff,0 0 30px #00f5ff55} 50%{text-shadow:0 0 20px #00f5ff,0 0 60px #00f5ff88,0 0 100px #00f5ff33} }
  @keyframes slide-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scan { 0%{top:-20%} 100%{top:120%} }
  @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes pixel-in { from{clip-path:inset(0 100% 0 0)} to{clip-path:inset(0 0% 0 0)} }

  .app { min-height: 100vh; animation: flicker 8s infinite; }

  /* NAV */
  .nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; height: 60px;
    background: linear-gradient(90deg, rgba(6,6,15,0.97), rgba(11,11,26,0.97));
    border-bottom: 1px solid var(--cyan);
    box-shadow: 0 0 20px rgba(0,245,255,0.15), 0 2px 40px rgba(0,0,0,0.8);
    backdrop-filter: blur(12px);
  }
  .nav-logo {
    font-family: 'Press Start 2P', monospace;
    font-size: 14px; cursor: pointer;
    background: linear-gradient(90deg, var(--cyan), var(--pink));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: glow-pulse 3s ease-in-out infinite;
    white-space: nowrap;
  }
  .nav-links { display: flex; gap: 6px; }
  .nav-link {
    font-family: 'VT323', monospace; font-size: 18px;
    padding: 6px 14px; cursor: pointer; border: none; background: none;
    color: var(--dim); transition: all .2s; position: relative;
    letter-spacing: 1px;
  }
  .nav-link:hover, .nav-link.active { color: var(--cyan); }
  .nav-link.active::after {
    content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
    height: 2px; background: var(--cyan);
    box-shadow: 0 0 10px var(--cyan);
  }
  .nav-right { display: flex; align-items: center; gap: 16px; }
  .cart-btn {
    background: none; border: 1px solid var(--dim); color: var(--dim);
    padding: 6px 14px; cursor: pointer; font-family: 'VT323'; font-size: 18px;
    transition: all .2s; position: relative;
  }
  .cart-btn:hover { border-color: var(--cyan); color: var(--cyan); box-shadow: 0 0 10px rgba(0,245,255,0.2); }
  .cart-badge {
    position: absolute; top: -6px; right: -6px;
    background: var(--pink); color: white; font-size: 11px;
    font-family: 'Press Start 2P'; width: 18px; height: 18px;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 8px var(--pink);
  }
  .avatar {
    width: 34px; height: 34px; background: var(--bg3);
    border: 2px solid var(--cyan); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; box-shadow: 0 0 8px rgba(0,245,255,0.3);
    transition: all .2s;
  }
  .avatar:hover { box-shadow: 0 0 16px var(--cyan); }

  /* TICKER */
  .ticker {
    background: var(--pink); height: 28px; overflow: hidden;
    display: flex; align-items: center;
    box-shadow: 0 0 20px rgba(255,0,127,0.4);
  }
  .ticker-label {
    font-family: 'Press Start 2P'; font-size: 9px;
    background: #000; color: var(--pink); padding: 0 12px;
    height: 100%; display: flex; align-items: center;
    white-space: nowrap; border-right: 2px solid #000;
    box-shadow: 4px 0 10px rgba(0,0,0,0.5);
  }
  .ticker-track { display: flex; animation: marquee 20s linear infinite; white-space: nowrap; }
  .ticker-item { font-size: 17px; color: #000; padding: 0 32px; font-weight: bold; letter-spacing: 1px; }

  /* HERO */
  .hero {
    position: relative; height: 380px; overflow: hidden;
    border-bottom: 1px solid var(--border);
  }
  .hero-bg {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, #06060f 0%, #0a0520 40%, #060615 70%, #0a0010 100%);
  }
  .hero-grid {
    position: absolute; inset: 0; opacity: 0.06;
    background-image: linear-gradient(var(--cyan) 1px, transparent 1px),
      linear-gradient(90deg, var(--cyan) 1px, transparent 1px);
    background-size: 40px 40px;
    perspective: 500px; transform: rotateX(20deg) scale(1.2); transform-origin: 50% 100%;
  }
  .hero-content {
    position: relative; z-index: 2; height: 100%;
    display: flex; align-items: center; padding: 0 48px;
    gap: 48px;
  }
  .hero-screen {
    width: 220px; height: 180px; flex-shrink: 0;
    border: 3px solid var(--cyan); position: relative;
    background: #000; overflow: hidden;
    box-shadow: 0 0 30px rgba(0,245,255,0.4), inset 0 0 30px rgba(0,0,0,0.8);
    animation: float 4s ease-in-out infinite;
  }
  .hero-screen-inner {
    width: 100%; height: 100%;
    background: linear-gradient(180deg, #000510 0%, #001a10 50%, #050010 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Press Start 2P'; font-size: 10px; color: var(--cyan);
    text-align: center; line-height: 2.2;
  }
  .hero-scan {
    position: absolute; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, transparent, var(--cyan), transparent);
    opacity: 0.6; animation: scan 3s linear infinite;
  }
  .hero-info { flex: 1; animation: slide-up .6s ease both; }
  .hero-platform {
    font-family: 'Press Start 2P'; font-size: 8px; color: var(--pink);
    letter-spacing: 3px; margin-bottom: 12px;
    text-shadow: 0 0 10px var(--pink);
  }
  .hero-title {
    font-family: 'Press Start 2P'; font-size: 24px;
    line-height: 1.5; margin-bottom: 16px;
    background: linear-gradient(90deg, #fff, var(--cyan));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: pixel-in 1s ease both;
  }
  .hero-desc { font-size: 20px; color: var(--dim); line-height: 1.5; margin-bottom: 20px; max-width: 420px; }
  .hero-actions { display: flex; gap: 12px; align-items: center; }
  .btn-primary {
    font-family: 'Press Start 2P'; font-size: 10px;
    background: var(--cyan); color: #000; border: none;
    padding: 12px 20px; cursor: pointer;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.5), 0 0 20px rgba(0,245,255,0.4);
    transition: all .15s; clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  }
  .btn-primary:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 rgba(0,0,0,0.5), 0 0 30px rgba(0,245,255,0.6); }
  .btn-secondary {
    font-family: 'Press Start 2P'; font-size: 10px;
    background: transparent; color: var(--text); border: 2px solid var(--dim);
    padding: 11px 18px; cursor: pointer; transition: all .15s;
  }
  .btn-secondary:hover { border-color: var(--cyan); color: var(--cyan); }
  .hero-price { font-family: 'Press Start 2P'; font-size: 18px; color: var(--yellow); text-shadow: 0 0 10px var(--yellow); }
  .hero-nav-dots { display: flex; gap: 8px; margin-top: 24px; }
  .dot { width: 8px; height: 8px; background: var(--dim); cursor: pointer; transition: all .2s; }
  .dot.active { background: var(--cyan); box-shadow: 0 0 8px var(--cyan); width: 24px; }

  /* MAIN */
  .main { display: flex; min-height: calc(100vh - 60px - 28px - 380px); }

  /* SIDEBAR */
  .sidebar {
    width: 220px; flex-shrink: 0; padding: 24px 16px;
    border-right: 1px solid var(--border);
    background: linear-gradient(180deg, var(--bg2), var(--bg));
  }
  .sidebar-section { margin-bottom: 28px; }
  .sidebar-title {
    font-family: 'Press Start 2P'; font-size: 8px; color: var(--dim);
    letter-spacing: 2px; margin-bottom: 12px; padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
  }
  .filter-btn {
    display: block; width: 100%;
    font-family: 'VT323'; font-size: 18px;
    background: none; border: none; text-align: left;
    color: var(--dim); padding: 5px 10px; cursor: pointer;
    transition: all .15s; position: relative;
  }
  .filter-btn:hover { color: var(--text); background: rgba(0,245,255,0.05); }
  .filter-btn.active { color: var(--cyan); }
  .filter-btn.active::before {
    content: '▶'; position: absolute; left: -2px; font-size: 12px;
  }
  .price-range { padding: 0 4px; }
  .range-input {
    width: 100%; accent-color: var(--cyan); margin: 8px 0;
    background: transparent; cursor: pointer;
  }
  .range-labels { display: flex; justify-content: space-between; font-size: 15px; color: var(--dim); }
  .rating-filter { display: flex; gap: 4px; }
  .star-btn { background: none; border: none; cursor: pointer; font-size: 20px; transition: all .15s; }

  /* CONTENT */
  .content { flex: 1; padding: 28px 28px; overflow-x: hidden; }
  .content-header {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;
  }
  .content-title { font-family: 'Press Start 2P'; font-size: 12px; color: var(--cyan); }
  .content-count { font-size: 18px; color: var(--dim); }
  .sort-select {
    background: var(--bg2); border: 1px solid var(--border); color: var(--text);
    font-family: 'VT323'; font-size: 18px; padding: 6px 12px; cursor: pointer;
    outline: none; appearance: none;
  }
  .sort-select:focus { border-color: var(--cyan); }

  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 18px;
  }

  /* GAME CARD */
  .game-card {
    background: var(--bg2); border: 1px solid var(--border);
    cursor: pointer; position: relative; overflow: hidden;
    transition: all .2s; animation: slide-up .5s ease both;
  }
  .game-card:hover {
    border-color: var(--cyan);
    box-shadow: 0 0 20px rgba(0,245,255,0.15), 0 8px 30px rgba(0,0,0,0.6);
    transform: translateY(-3px);
  }
  .game-card:hover .card-overlay { opacity: 1; }
  .card-screen {
    height: 140px; position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .card-art {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Press Start 2P'; font-size: 9px; text-align: center;
    line-height: 2; padding: 12px; position: relative;
  }
  .card-scanline {
    position: absolute; inset: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 5px);
    pointer-events: none;
  }
  .card-overlay {
    position: absolute; inset: 0; opacity: 0;
    background: rgba(0,0,0,0.7); transition: opacity .2s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .overlay-btn {
    font-family: 'Press Start 2P'; font-size: 8px;
    border: none; padding: 8px 12px; cursor: pointer; transition: all .15s;
  }
  .overlay-btn.buy { background: var(--cyan); color: #000; }
  .overlay-btn.wish { background: transparent; border: 1px solid var(--pink); color: var(--pink); }
  .overlay-btn:hover { transform: scale(1.05); }
  .badge {
    position: absolute; top: 8px; right: 8px;
    font-family: 'Press Start 2P'; font-size: 7px;
    padding: 3px 7px; z-index: 2;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
  }
  .card-body { padding: 12px; }
  .card-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .card-platform { font-family: 'Press Start 2P'; font-size: 7px; opacity: .5; }
  .card-year { font-size: 15px; color: var(--dim); }
  .card-title { font-family: 'Press Start 2P'; font-size: 9px; margin-bottom: 6px; line-height: 1.6; }
  .card-genre { font-size: 15px; color: var(--dim); margin-bottom: 8px; }
  .card-footer { display: flex; align-items: center; justify-content: space-between; }
  .card-price { font-family: 'Press Start 2P'; font-size: 11px; }
  .card-rating { display: flex; align-items: center; gap: 4px; font-size: 15px; }
  .card-players { font-size: 14px; color: var(--dim); }

  /* FEATURED ROW */
  .section-header { display: flex; align-items: center; gap: 12px; margin: 32px 0 16px; }
  .section-label {
    font-family: 'Press Start 2P'; font-size: 10px; color: var(--yellow);
    text-shadow: 0 0 10px var(--yellow);
  }
  .section-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--yellow), transparent); opacity: .3; }

  .scroll-row { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 8px; }
  .scroll-row::-webkit-scrollbar { height: 3px; }
  .scroll-row::-webkit-scrollbar-thumb { background: var(--cyan); }
  .mini-card {
    flex-shrink: 0; width: 160px; background: var(--bg2);
    border: 1px solid var(--border); cursor: pointer; transition: all .2s;
  }
  .mini-card:hover { border-color: var(--pink); transform: scale(1.03); }
  .mini-screen { height: 90px; display: flex; align-items: center; justify-content: center; }
  .mini-body { padding: 8px; }
  .mini-title { font-family: 'Press Start 2P'; font-size: 7px; margin-bottom: 4px; line-height: 1.5; }
  .mini-price { font-size: 15px; }

  /* MODAL */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.85);
    z-index: 200; display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(6px); animation: slide-up .2s ease;
  }
  .modal {
    background: var(--bg2); border: 1px solid var(--cyan);
    width: 580px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
    box-shadow: 0 0 60px rgba(0,245,255,0.2);
    animation: slide-up .25s ease;
  }
  .modal-header {
    padding: 20px 24px 16px; border-bottom: 1px solid var(--border);
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .modal-close {
    background: none; border: none; color: var(--dim); cursor: pointer;
    font-family: 'Press Start 2P'; font-size: 12px; transition: color .2s;
  }
  .modal-close:hover { color: var(--pink); }
  .modal-body { padding: 24px; }
  .modal-screen {
    width: 100%; height: 180px; margin-bottom: 20px;
    border: 2px solid var(--border); position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .modal-title { font-family: 'Press Start 2P'; font-size: 14px; margin-bottom: 8px; line-height: 1.6; }
  .modal-desc { font-size: 19px; color: var(--dim); line-height: 1.6; margin-bottom: 16px; }
  .modal-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
  .tag { font-size: 14px; padding: 3px 10px; border: 1px solid var(--border); color: var(--dim); }
  .modal-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
  .stat-box { background: var(--bg3); padding: 12px; text-align: center; }
  .stat-val { font-family: 'Press Start 2P'; font-size: 11px; display: block; margin-bottom: 4px; }
  .stat-lbl { font-size: 14px; color: var(--dim); }
  .modal-footer { display: flex; gap: 12px; align-items: center; border-top: 1px solid var(--border); padding-top: 16px; }

  /* TOAST */
  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 999;
    background: var(--bg3); border: 1px solid var(--green);
    padding: 12px 20px; font-family: 'Press Start 2P'; font-size: 9px;
    color: var(--green); box-shadow: 0 0 20px rgba(0,255,106,0.3);
    animation: slide-up .3s ease;
  }

  /* LIBRARY PAGE */
  .library { padding: 32px; }
  .library-header { margin-bottom: 28px; }
  .lib-title { font-family: 'Press Start 2P'; font-size: 16px; color: var(--cyan); margin-bottom: 8px; }
  .lib-sub { font-size: 20px; color: var(--dim); }
  .lib-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .lib-card {
    background: var(--bg2); border: 1px solid var(--border);
    padding: 16px; display: flex; gap: 16px; align-items: center;
    transition: all .2s; cursor: pointer;
  }
  .lib-card:hover { border-color: var(--cyan); }
  .lib-thumb { width: 72px; height: 72px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 2px solid var(--border); }
  .lib-info { flex: 1; }
  .lib-name { font-family: 'Press Start 2P'; font-size: 8px; margin-bottom: 6px; line-height: 1.6; }
  .lib-genre { font-size: 16px; color: var(--dim); margin-bottom: 6px; }
  .lib-time { font-size: 14px; color: var(--purple); }
  .play-btn {
    background: var(--green); border: none; color: #000;
    font-family: 'Press Start 2P'; font-size: 8px; padding: 8px 12px;
    cursor: pointer; white-space: nowrap; transition: all .15s;
  }
  .play-btn:hover { background: #00cc55; transform: scale(1.05); }

  /* COMMUNITY */
  .community { padding: 32px; }
  .comm-title { font-family: 'Press Start 2P'; font-size: 16px; color: var(--pink); margin-bottom: 28px; text-shadow: 0 0 20px var(--pink); }
  .comm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .comm-card { background: var(--bg2); border: 1px solid var(--border); padding: 20px; }
  .comm-card-title { font-family: 'Press Start 2P'; font-size: 9px; color: var(--yellow); margin-bottom: 12px; }
  .leaderboard-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .rank { font-family: 'Press Start 2P'; font-size: 9px; width: 24px; }
  .rank-1 { color: var(--yellow); }
  .rank-2 { color: #aaa; }
  .rank-3 { color: #b87333; }
  .player-name { flex: 1; font-size: 18px; }
  .player-score { font-family: 'Press Start 2P'; font-size: 8px; color: var(--cyan); }
  .achievement { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); align-items: center; }
  .ach-icon { font-size: 24px; }
  .ach-name { font-family: 'Press Start 2P'; font-size: 8px; margin-bottom: 4px; color: var(--yellow); }
  .ach-desc { font-size: 15px; color: var(--dim); }
  .news-item { padding: 12px 0; border-bottom: 1px solid var(--border); }
  .news-date { font-size: 14px; color: var(--dim); margin-bottom: 4px; }
  .news-title { font-family: 'Press Start 2P'; font-size: 8px; line-height: 1.6; color: var(--cyan); }

  /* FOOTER */
  .footer {
    border-top: 1px solid var(--border); padding: 24px 48px;
    display: flex; justify-content: space-between; align-items: center;
    background: var(--bg2); margin-top: 40px;
  }
  .footer-logo { font-family: 'Press Start 2P'; font-size: 10px; color: var(--dim); }
  .footer-links { display: flex; gap: 20px; }
  .footer-link { font-size: 16px; color: var(--dim); cursor: pointer; transition: color .2s; }
  .footer-link:hover { color: var(--cyan); }
  .footer-copy { font-size: 14px; color: var(--dim); }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--dim); }
  ::-webkit-scrollbar-thumb:hover { background: var(--cyan); }

  /* LOGIN */
  .login-wrap {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg);
    background-image:
      linear-gradient(rgba(0,245,255,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,245,255,0.06) 1px, transparent 1px);
    background-size: 48px 48px; background-attachment: fixed;
    position: relative; overflow: hidden;
  }
  .login-wrap::before {
    content: ''; position: fixed; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse at 50% 40%, rgba(0,245,255,0.06) 0%, rgba(6,6,15,0.96) 65%);
    z-index: 0;
  }
  .login-wrap::after {
    content: 'PIXEL VAULT  ·  INSERT COIN  ·  PIXEL VAULT  ·  INSERT COIN  ·  PIXEL VAULT  ·  INSERT COIN  ·  PIXEL VAULT  ·  INSERT COIN  ·';
    position: fixed; bottom: 28px; left: 0; right: 0;
    font-family: 'Press Start 2P'; font-size: 9px; color: rgba(0,245,255,0.18);
    text-align: center; letter-spacing: 3px; pointer-events: none; z-index: 0;
  }
  .login-box {
    position: relative; z-index: 1;
    background: rgba(10,10,26,0.97);
    border: 1px solid rgba(0,245,255,0.35);
    width: 420px; max-width: 96vw;
    box-shadow:
      0 0 0 1px rgba(0,245,255,0.08),
      0 0 40px rgba(0,245,255,0.14),
      0 0 100px rgba(0,245,255,0.05),
      inset 0 1px 0 rgba(0,245,255,0.12);
    animation: slide-up .4s cubic-bezier(.22,1,.36,1);
  }
  .login-header {
    padding: 32px 32px 0; text-align: center;
  }
  .login-logo {
    font-family: 'Press Start 2P'; font-size: 18px;
    background: linear-gradient(90deg, var(--cyan) 0%, var(--pink) 60%, var(--yellow) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: glow-pulse 3s ease-in-out infinite;
    display: block; margin-bottom: 6px; letter-spacing: 2px;
  }
  .login-tagline {
    font-family: 'VT323'; font-size: 17px; color: var(--dim);
    letter-spacing: 3px; margin-bottom: 24px; display: block;
  }
  /* TABS */
  .login-tabs {
    display: flex; border-bottom: 1px solid rgba(0,245,255,0.15);
    margin: 0 -0px; position: relative;
  }
  .login-tab {
    flex: 1; padding: 13px 0; font-family: 'Press Start 2P'; font-size: 8px;
    background: none; border: none; cursor: pointer; letter-spacing: 1px;
    color: var(--dim); transition: color .2s; position: relative;
  }
  .login-tab.active { color: var(--cyan); }
  .login-tab::after {
    content: ''; position: absolute; bottom: -1px; left: 10%; right: 10%; height: 2px;
    background: var(--cyan); transform: scaleX(0); transition: transform .25s ease;
    box-shadow: 0 0 8px var(--cyan);
  }
  .login-tab.active::after { transform: scaleX(1); }
  /* BODY */
  .login-body { padding: 28px 32px 32px; display: flex; flex-direction: column; gap: 18px; }
  .login-field { display: flex; flex-direction: column; gap: 7px; }
  .login-label-row { display: flex; justify-content: space-between; align-items: center; }
  .login-label {
    font-family: 'Press Start 2P'; font-size: 7px; color: rgba(0,245,255,0.6);
    letter-spacing: 2px;
  }
  .login-char-count { font-family: 'VT323'; font-size: 14px; color: var(--dim); }
  .login-input {
    background: rgba(0,245,255,0.03); border: 1px solid rgba(0,245,255,0.18);
    color: var(--text); font-family: 'VT323'; font-size: 22px; padding: 11px 16px;
    outline: none; transition: border-color .2s, box-shadow .2s, background .2s;
    caret-color: var(--cyan); letter-spacing: 1px;
  }
  .login-input:focus {
    border-color: var(--cyan); background: rgba(0,245,255,0.06);
    box-shadow: 0 0 14px rgba(0,245,255,0.12), inset 0 0 8px rgba(0,245,255,0.04);
  }
  .login-input::placeholder { color: rgba(0,245,255,0.2); }
  /* PASSWORD STRENGTH */
  .pw-strength { display: flex; gap: 4px; margin-top: 4px; }
  .pw-bar { flex: 1; height: 3px; background: rgba(255,255,255,0.08); transition: background .3s; }
  .pw-bar.s1 { background: var(--pink); box-shadow: 0 0 6px var(--pink); }
  .pw-bar.s2 { background: var(--yellow); box-shadow: 0 0 6px var(--yellow); }
  .pw-bar.s3 { background: var(--green); box-shadow: 0 0 6px var(--green); }
  /* BUTTONS */
  .login-btn {
    font-family: 'Press Start 2P'; font-size: 10px;
    background: linear-gradient(135deg, var(--cyan) 0%, #00b8d4 100%);
    color: #000; border: none; padding: 15px; cursor: pointer; width: 100%;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.6), 0 0 24px rgba(0,245,255,0.35);
    transition: all .15s; letter-spacing: 2px;
    clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
    margin-top: 4px;
  }
  .login-btn:hover:not(:disabled) {
    transform: translate(-2px,-2px);
    box-shadow: 6px 6px 0 rgba(0,0,0,0.6), 0 0 36px rgba(0,245,255,0.55);
  }
  .login-btn.register { background: linear-gradient(135deg, var(--pink) 0%, #c0006a 100%); box-shadow: 4px 4px 0 rgba(0,0,0,0.6), 0 0 24px rgba(255,0,127,0.35); }
  .login-btn.register:hover:not(:disabled) { box-shadow: 6px 6px 0 rgba(0,0,0,0.6), 0 0 36px rgba(255,0,127,0.55); }
  .login-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }
  /* MESSAGES */
  .login-error {
    font-family: 'Press Start 2P'; font-size: 7px; color: var(--pink);
    text-align: center; text-shadow: 0 0 10px var(--pink);
    padding: 10px 12px; background: rgba(255,0,127,0.07);
    border: 1px solid rgba(255,0,127,0.2);
    animation: blink .4s ease 2;
  }
  .login-success {
    font-family: 'Press Start 2P'; font-size: 7px; color: var(--green);
    text-align: center; text-shadow: 0 0 10px var(--green);
    padding: 10px 12px; background: rgba(0,255,106,0.07);
    border: 1px solid rgba(0,255,106,0.2);
  }
  .login-hint {
    font-family: 'VT323'; font-size: 16px; color: var(--dim);
    text-align: center; letter-spacing: 1px;
  }
  .login-hint span { color: var(--cyan); cursor: default; }

  /* USER DROPDOWN */
  .user-menu { position: relative; }
  .user-dropdown {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: var(--bg2); border: 1px solid var(--cyan);
    min-width: 160px; z-index: 200;
    box-shadow: 0 0 20px rgba(0,245,255,0.15);
    animation: slide-up .15s ease;
  }
  .user-dropdown-name {
    padding: 10px 14px; border-bottom: 1px solid var(--border);
    font-family: 'Press Start 2P'; font-size: 7px; color: var(--cyan);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .user-dropdown-item {
    display: block; width: 100%; padding: 10px 14px;
    font-family: 'VT323'; font-size: 18px; color: var(--dim);
    background: none; border: none; cursor: pointer; text-align: left;
    transition: all .15s; letter-spacing: 1px;
  }
  .user-dropdown-item:hover { color: var(--pink); background: rgba(255,0,127,0.06); }
`;

// Pixel art generator for game cards
function PixelArt({ game, size = "large" }) {
  const colors = {
    "#ff007f": ["#ff007f", "#ff66aa", "#cc0066", "#000"],
    "#00f5ff": ["#00f5ff", "#66f9ff", "#0099cc", "#000"],
    "#ffe600": ["#ffe600", "#ffee66", "#ccb800", "#000"],
    "#00ff6a": ["#00ff6a", "#66ffaa", "#00cc55", "#000"],
    "#bf00ff": ["#bf00ff", "#dd66ff", "#8800cc", "#000"],
    "#ff6a00": ["#ff6a00", "#ff9944", "#cc5200", "#000"],
  };
  const c = colors[game.color] || colors["#00f5ff"];
  const h = size === "large" ? 140 : 90;
  const icons = { "Sparatutto": "▲★▲", "GDR": "⚔🗡⚔", "Corsa": "▶▶▶", "Piattaforme": "▪▪▪", "Picchiaduro": "✊✊✊", "Strategia": "◆◆◆", "Puzzle": "▣▣▣" };
  return (
    <div style={{ width: "100%", height: h, background: `linear-gradient(135deg, ${c[2]}33, ${c[0]}22, #000)`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${c[0]}22 1px, transparent 1px)`, backgroundSize: "10px 10px" }} />
      <div style={{ fontFamily: "'Press Start 2P'", fontSize: size === "large" ? 22 : 16, filter: `drop-shadow(0 0 8px ${c[0]})` }}>{icons[game.genre] || "★"}</div>
      <div style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: c[0], textShadow: `0 0 8px ${c[0]}`, textAlign: "center", padding: "0 8px", lineHeight: 1.8 }}>{game.title.substring(0, 10)}</div>
      <div className="card-scanline" />
    </div>
  );
}

// --- Store Page ---
function StorePage({ onAddToLibrary, library, onOpenGame }) {
  const [platform, setPlatform] = useState("ALL");
  const [genre, setGenre] = useState("ALL");
  const [sort, setSort] = useState("popular");
  const [heroIdx, setHeroIdx] = useState(0);

  const featured = GAMES.slice(0, 4);
  const heroGame = featured[heroIdx];

  const filtered = GAMES.filter(g =>
    (platform === "TUTTI" || g.platform === platform) &&
    (genre === "TUTTI" || g.genre === genre)
  ).sort((a, b) => sort === "popular" ? b.rating - a.rating : sort === "rating" ? b.rating - a.rating : b.players.localeCompare(a.players));

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      {/* Hero */}
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-screen">
            <PixelArt game={heroGame} size="large" />
            <div className="hero-scan" />
          </div>
          <div className="hero-info">
            <div className="hero-platform">■ {heroGame.platform} · {heroGame.year} ■</div>
            <div className="hero-title">{heroGame.title}</div>
            <div className="hero-desc">{heroGame.desc}</div>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => library.includes(heroGame.id) ? playGame(heroGame) : onAddToLibrary(heroGame)}>
                {library.includes(heroGame.id) ? "▶ GIOCA ORA" : "＋ AGGIUNGI ALLA LIBRERIA"}
              </button>
              <button className="btn-secondary" onClick={() => onOpenGame(heroGame)}>VEDI DETTAGLI</button>
              <span className="hero-price" style={{ color: "var(--green)", fontSize: 14 }}>GRATIS</span>
            </div>
            <div className="hero-nav-dots">
              {featured.map((_, i) => <div key={i} className={`dot${heroIdx === i ? " active" : ""}`} onClick={() => setHeroIdx(i)} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Filters + Grid */}
      <div className="main">
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">PIATTAFORMA</div>
            {PLATFORMS.map(p => (
              <button key={p} className={`filter-btn${platform === p ? " active" : ""}`} onClick={() => setPlatform(p)}>{p}</button>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-title">GENERE</div>
            {GENRES.map(g => (
              <button key={g} className={`filter-btn${genre === g ? " active" : ""}`} onClick={() => setGenre(g)}>{g}</button>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-title">VALUTAZIONE</div>
            {[5,4,3].map(r => (
              <button key={r} className="filter-btn">{"★".repeat(r)}{"☆".repeat(5-r)}</button>
            ))}
          </div>
        </aside>

        <div className="content">
          <div className="section-header">
            <span className="section-label">⚡ NUOVI ARRIVI</span>
            <div className="section-line" />
          </div>
          <div className="scroll-row">
            {GAMES.filter(g => g.badge === "NEW" || g.badge === "HOT").map(g => (
              <div key={g.id} className="mini-card" onClick={() => onOpenGame(g)}>
                <div className="mini-screen"><PixelArt game={g} size="small" /></div>
                <div className="mini-body">
                  <div className="mini-title">{g.title}</div>
                  <div className="mini-price" style={{ color: "var(--green)", fontFamily: "'Press Start 2P'", fontSize: 9 }}>GRATIS</div>
                </div>
              </div>
            ))}
          </div>

          <div className="content-header" style={{ marginTop: 24 }}>
            <div>
              <div className="content-title">TUTTI I GIOCHI</div>
              <div className="content-count">{filtered.length} giochi trovati</div>
            </div>
            <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="popular">ORDINA: MEGLIO VALUTATI</option>
              <option value="newest">ORDINA: PIÙ RECENTI</option>
            </select>
          </div>

          <div className="games-grid">
            {filtered.map((g, i) => (
              <div key={g.id} className="game-card" style={{ animationDelay: `${i * 0.05}s` }} onClick={() => onOpenGame(g)}>
                <div className="card-screen">
                  <PixelArt game={g} size="large" />
                  {g.badge && (
                    <div className="badge" style={{ background: BADGE_COLORS[g.badge], color: g.badge === "SALE" ? "#000" : "#fff" }}>{g.badge}</div>
                  )}
                  <div className="card-overlay">
                    <button className="overlay-btn buy" onClick={e => { e.stopPropagation(); library.includes(g.id) ? playGame(g) : onAddToLibrary(g); }}>
                      {library.includes(g.id) ? "▶ GIOCA" : "+ GRATIS"}
                    </button>
                    <button className="overlay-btn wish" onClick={e => e.stopPropagation()}>♥</button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="card-meta">
                    <span className="card-platform">{g.platform}</span>
                    <span className="card-year">{g.year}</span>
                  </div>
                  <div className="card-title">{g.title}</div>
                  <div className="card-genre">{g.genre}</div>
                  <div className="card-footer">
                    <span className="card-price" style={{ color: "var(--green)" }}>GRATIS</span>
                    <div className="card-rating">
                      <span style={{ color: "var(--yellow)" }}>★</span>
                      <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8 }}>{g.rating}</span>
                      <span className="card-players">· {g.players}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// --- Library Page ---
function LibraryPage({ library }) {
  const owned = GAMES.filter(g => library.includes(g.id));
  const times = { 1: "12h 34m", 2: "3h 10m", 3: "48h 02m", 4: "7h 55m", 5: "1h 20m", 6: "0h 30m", 7: "5h 14m", 8: "2h 05m" };
  return (
    <div className="library">
      <div className="library-header">
        <div className="lib-title">LA MIA LIBRERIA</div>
        <div className="lib-sub">{owned.length} giochi · tutti gratis</div>
      </div>
      {owned.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--dim)", fontFamily: "'Press Start 2P'", fontSize: 10, padding: "60px 0" }}>
          NESSUN GIOCO ANCORA<br/><br/>
          <span style={{ fontSize: 14 }}>Aggiungi giochi gratis dallo store!</span>
        </div>
      ) : (
        <div className="lib-grid">
          {owned.map((g) => (
            <div key={g.id} className="lib-card">
              <div className="lib-thumb"><PixelArt game={g} size="small" /></div>
              <div className="lib-info">
                <div className="lib-name">{g.title}</div>
                <div className="lib-genre">{g.genre} · {g.platform}</div>
                <div className="lib-time">⏱ {times[g.id]} giocato</div>
              </div>
              <button className="play-btn" onClick={() => playGame(g)} style={!GAME_URLS[g.id] ? { opacity: 0.4, cursor: "not-allowed" } : {}}>▶ GIOCA</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Community Page ---
function CommunityPage() {
  const leaders = [
    { name: "PIXEL_KING", score: "99.840" },
    { name: "RETRO_ACE", score: "88.120" },
    { name: "8BIT_GOD", score: "77.450" },
    { name: "NEON_GHOST", score: "65.300" },
    { name: "ARCADE_BOY", score: "52.100" },
  ];
  const achievements = [
    { icon: "🏆", name: "PRIMO SANGUE", desc: "Completa il tuo primo gioco" },
    { icon: "⚡", name: "FULMINE", desc: "Termina un livello in meno di 60 secondi" },
    { icon: "💀", name: "HARDCORE", desc: "Completa un gioco alla massima difficoltà" },
    { icon: "🎮", name: "COLLEZIONISTA", desc: "Possiedi 10+ giochi nella tua libreria" },
  ];
  const news = [
    { date: "10 MAR 2026", title: "CYBER PUNCH: NUOVO DLC SHADOW MODE DISPONIBILE" },
    { date: "8 MAR 2026", title: "TORNEO DEL WEEKEND: NEON BLASTER CUP" },
    { date: "5 MAR 2026", title: "5 NUOVI TITOLI INDIE AGGIUNTI AL VAULT" },
  ];
  return (
    <div className="community">
      <div className="comm-title">// COMUNITÀ HUB //</div>
      <div className="comm-grid">
        <div className="comm-card">
          <div className="comm-card-title">🏆 CLASSIFICA GLOBALE</div>
          {leaders.map((l, i) => (
            <div key={i} className="leaderboard-row">
              <span className={`rank rank-${i + 1}`}>#{i + 1}</span>
              <span className="player-name">{l.name}</span>
              <span className="player-score">{l.score} PTS</span>
            </div>
          ))}
        </div>
        <div className="comm-card">
          <div className="comm-card-title">🎖 OBIETTIVI</div>
          {achievements.map((a, i) => (
            <div key={i} className="achievement">
              <span className="ach-icon">{a.icon}</span>
              <div><div className="ach-name">{a.name}</div><div className="ach-desc">{a.desc}</div></div>
            </div>
          ))}
        </div>
        <div className="comm-card" style={{ gridColumn: "span 2" }}>
          <div className="comm-card-title">📡 ULTIME NOTIZIE</div>
          {news.map((n, i) => (
            <div key={i} className="news-item">
              <div className="news-date">{n.date}</div>
              <div className="news-title">{n.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const GAME_URLS = {
  1: `${import.meta.env.BASE_URL}neon-blaster.html`, // NEON BLASTER
};

function playGame(game) {
  if (GAME_URLS[game.id]) {
    window.open(GAME_URLS[game.id], "_blank");
  }
}

// --- Login Page ---
function pwStrength(pw) {
  if (!pw) return 0;
  if (pw.length < 4) return 1;
  if (pw.length < 8 || !/[^a-zA-Z0-9]/.test(pw)) return 2;
  return 3;
}

function LoginPage({ onLogin }) {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const switchTab = (t) => {
    setTab(t); setError(""); setSuccess(""); setUsername(""); setPassword("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!username.trim() || !password.trim()) {
      setError("INSERISCI NOME UTENTE E PASSWORD"); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "ERRORE"); setLoading(false); return; }
      onLogin(data.username);
    } catch {
      setError("CONNESSIONE FALLITA — RIPROVA");
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!username.trim() || !password.trim()) {
      setError("COMPILA TUTTI I CAMPI"); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "ERRORE"); setLoading(false); return; }
      setSuccess(`✓ ACCOUNT CREATO! BENVENUTO, ${data.username}`);
      setLoading(false);
      setTimeout(() => onLogin(data.username), 1200);
    } catch {
      setError("CONNESSIONE FALLITA — RIPROVA");
      setLoading(false);
    }
  };

  const strength = pwStrength(password);
  const isRegister = tab === "register";

  return (
    <div className="login-wrap">
      <div className="scanlines" />
      <div className="login-box">
        <div className="login-header">
          <span className="login-logo">PIXEL VAULT</span>
          <span className="login-tagline">// RETRO GAME STORE //</span>
          <div className="login-tabs">
            <button type="button" className={`login-tab${tab === "login" ? " active" : ""}`} onClick={() => switchTab("login")}>
              ▶ ACCEDI
            </button>
            <button type="button" className={`login-tab${tab === "register" ? " active" : ""}`} onClick={() => switchTab("register")}>
              ＋ REGISTRATI
            </button>
          </div>
        </div>

        <form className="login-body" onSubmit={isRegister ? handleRegister : handleLogin}>
          <div className="login-field">
            <div className="login-label-row">
              <label className="login-label">NOME UTENTE</label>
              {isRegister && <span className="login-char-count">{username.length}/20</span>}
            </div>
            <input
              className="login-input"
              type="text"
              placeholder={isRegister ? "SCEGLI UN NOME..." : "INSERISCI NOME..."}
              value={username}
              onChange={e => setUsername(e.target.value.slice(0, 20))}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label className="login-label">PASSWORD</label>
            <input
              className="login-input"
              type="password"
              placeholder={isRegister ? "MIN. 4 CARATTERI" : "••••••••"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
            {isRegister && password.length > 0 && (
              <div className="pw-strength">
                <div className={`pw-bar${strength >= 1 ? ` s${strength}` : ""}`} />
                <div className={`pw-bar${strength >= 2 ? ` s${strength}` : ""}`} />
                <div className={`pw-bar${strength >= 3 ? ` s${strength}` : ""}`} />
              </div>
            )}
          </div>

          {error && <div className="login-error">⚠ {error}</div>}
          {success && <div className="login-success">{success}</div>}

          <button className={`login-btn${isRegister ? " register" : ""}`} type="submit" disabled={loading}>
            {loading ? "CARICAMENTO..." : isRegister ? "＋ CREA ACCOUNT" : "▶ PREMI START"}
          </button>

          {!isRegister && (
            <div className="login-hint">
              Demo: <span>PIXEL_KING</span> / <span>retro123</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("store");
  const [library, setLibrary] = useState([1, 2]); // some games already in library by default
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const addToLibrary = (game) => {
    if (!library.includes(game.id)) {
      setLibrary(l => [...l, game.id]);
      setToast(`${game.title} aggiunto alla libreria!`);
      setTimeout(() => setToast(null), 2500);
    } else {
      setToast(`Già nella tua libreria!`);
      setTimeout(() => setToast(null), 2000);
    }
  };

  if (!user) return (
    <>
      <style>{css}</style>
      <LoginPage onLogin={setUser} />
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="scanlines" />
      <div className="vignette" />
      <div className="app">
        <nav className="nav">
          <div className="nav-logo" onClick={() => setPage("store")}>PIXEL VAULT</div>
          <div className="nav-links">
            {[["store","NEGOZIO"], ["library","LIBRERIA"], ["community","COMUNITÀ"]].map(([p, label]) => (
              <button key={p} className={`nav-link${page === p ? " active" : ""}`} onClick={() => setPage(p)}>
                {label}
              </button>
            ))}
          </div>
          <div className="nav-right">
            <button className="cart-btn" onClick={() => setPage("library")}>
              📁 LIBRERIA
              {library.length > 0 && <span className="cart-badge">{library.length}</span>}
            </button>
            <div className="user-menu">
              <div className="avatar" onClick={() => setShowUserMenu(m => !m)}>👾</div>
              {showUserMenu && (
                <div className="user-dropdown" onMouseLeave={() => setShowUserMenu(false)}>
                  <div className="user-dropdown-name">{user}</div>
                  <button className="user-dropdown-item" onClick={() => { setPage("library"); setShowUserMenu(false); }}>LA MIA LIBRERIA</button>
                  <button className="user-dropdown-item" onClick={() => { setUser(null); setShowUserMenu(false); setPage("store"); }}>ESCI</button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="ticker">
          <div className="ticker-label">★ GRATIS</div>
          <div className="ticker-track">
            {[...GAMES, ...GAMES].map((g, i) => (
              <span key={i} className="ticker-item">
                {g.title} — GRATIS {g.badge ? `[${g.badge}]` : ""} ·
              </span>
            ))}
          </div>
        </div>

        {page === "store" && <StorePage onAddToLibrary={addToLibrary} library={library} onOpenGame={setModal} />}
        {page === "library" && <LibraryPage library={library} />}
        {page === "community" && <CommunityPage />}

        <footer className="footer">
          <div className="footer-logo">PIXEL VAULT © 2026</div>
          <div className="footer-links">
            {["INFO", "SVILUPPATORI", "SUPPORTO", "PRIVACY"].map(l => <span key={l} className="footer-link">{l}</span>)}
          </div>
          <div className="footer-copy">INSERISCI MONETA PER CONTINUARE</div>
        </footer>
      </div>

      {/* Game Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "var(--dim)", marginBottom: 8, letterSpacing: 2 }}>
                  {modal.platform} · {modal.year}
                </div>
                <div className="modal-title">{modal.title}</div>
              </div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-screen"><PixelArt game={modal} size="large" /></div>
              <div className="modal-desc">{modal.desc}</div>
              <div className="modal-tags">
                {modal.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
              <div className="modal-stats">
                <div className="stat-box">
                  <span className="stat-val" style={{ color: "var(--yellow)" }}>★ {modal.rating}</span>
                  <span className="stat-lbl">RATING</span>
                </div>
                <div className="stat-box">
                  <span className="stat-val" style={{ color: "var(--cyan)" }}>{modal.players}</span>
                  <span className="stat-lbl">PLAYERS</span>
                </div>
                <div className="stat-box">
                  <span className="stat-val" style={{ color: "var(--green)" }}>{modal.genre}</span>
                  <span className="stat-lbl">GENRE</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-primary" onClick={() => { if (library.includes(modal.id)) { playGame(modal); setModal(null); } else { addToLibrary(modal); setModal(null); } }}>
                  {library.includes(modal.id) ? "▶ GIOCA ORA" : "＋ AGGIUNGI ALLA LIBRERIA"}
                </button>
                <button className="btn-secondary" onClick={() => setModal(null)}>CHIUDI</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">✓ {toast}</div>}
    </>
  );
}
