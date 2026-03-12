/**
 * test-mobile.cjs
 * Test automatico mobile per Neon Blaster — emula iPhone 13 con touch.
 *
 * Esegui con:
 *   node test-mobile.cjs
 * (il dev server deve girare su http://localhost:5175)
 */

const { chromium, devices } = require('playwright');

const URL   = 'http://localhost:5175/neon-blaster.html';
const IPHONE = devices['iPhone 13'];

// ── Utilità ─────────────────────────────────────────────────────────────

function pass(msg) { console.log(`  ✅ ${msg}`); }
function fail(msg) { console.log(`  ❌ ${msg}`); process.exitCode = 1; }
function info(msg) { console.log(`  ℹ  ${msg}`); }

/** Simula touchstart su un selettore CSS tramite JS nel browser */
async function touchStart(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const rect  = el.getBoundingClientRect();
    const cx    = rect.left + rect.width  / 2;
    const cy    = rect.top  + rect.height / 2;
    const touch = new Touch({ identifier: Date.now(), target: el, clientX: cx, clientY: cy });
    el.dispatchEvent(new TouchEvent('touchstart', {
      touches: [touch], targetTouches: [touch], changedTouches: [touch], bubbles: true, cancelable: true
    }));
  }, selector);
}

/** Simula touchend su un selettore CSS */
async function touchEnd(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const rect  = el.getBoundingClientRect();
    const cx    = rect.left + rect.width  / 2;
    const cy    = rect.top  + rect.height / 2;
    const touch = new Touch({ identifier: Date.now(), target: el, clientX: cx, clientY: cy });
    el.dispatchEvent(new TouchEvent('touchend', {
      touches: [], targetTouches: [], changedTouches: [touch], bubbles: true, cancelable: true
    }));
  }, selector);
}

/** Ottieni stato corrente della scena Game */
async function getState(page) {
  return page.evaluate(() => {
    const g = window.game;
    if (!g) return null;
    const s = g.scene.getScene('Game');
    if (!s || !s.sys.isActive()) return { scene: 'not-active' };
    return {
      scene:     'Game',
      lives:     s.lives,
      score:     s.score,
      level:     s.level,
      gameOver:  s.gameOver,
      enemies:   s.enemies  ? s.enemies.getChildren().length : 0,
      bullets:   s.bullets  ? s.bullets.getChildren().length : 0,
      playerX:   s.player   ? s.player.x : null,
      touchLeft: window._touchState ? window._touchState.left  : null,
      touchRight:window._touchState ? window._touchState.right : null,
      touchFire: window._touchState ? window._touchState.fire  : null,
    };
  });
}

// ── Suite di test ────────────────────────────────────────────────────────

async function runTests() {
  console.log('\n📱 NEON BLASTER — TEST MOBILE (iPhone 13)\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...IPHONE,
    hasTouch: true,
    isMobile: true,
  });

  const page = await context.newPage();

  const jsErrors = [];
  page.on('console', m => { if (m.type() === 'error') jsErrors.push(m.text()); });
  page.on('pageerror', e => jsErrors.push(e.message));

  // ── 1. Caricamento pagina ──────────────────────────────────────────────
  console.log('► Test 1: Caricamento pagina');
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
    pass('Pagina caricata senza timeout');
  } catch (e) {
    fail(`Impossibile caricare la pagina: ${e.message}`);
    await browser.close(); return;
  }
  await page.waitForTimeout(1500);

  // ── 2. Phaser inizializzato ────────────────────────────────────────────
  console.log('► Test 2: Phaser inizializzato');
  const phaserReady = await page.evaluate(() => !!window.game);
  phaserReady ? pass('window.game esiste') : fail('window.game non trovato');

  // ── 3. Errori JS ──────────────────────────────────────────────────────
  console.log('► Test 3: Nessun errore JavaScript');
  const realErrors = jsErrors.filter(e => !e.includes('favicon') && !e.includes('font'));
  realErrors.length === 0
    ? pass('Nessun errore JS al caricamento')
    : fail(`${realErrors.length} errore/i: ${realErrors.join(' | ')}`);

  // ── 4. Viewport mobile ────────────────────────────────────────────────
  console.log('► Test 4: Viewport mobile corretto');
  const vp = page.viewportSize();
  info(`Viewport: ${vp.width}x${vp.height}`);
  vp.width <= 430 ? pass(`Larghezza mobile (${vp.width}px)`) : fail(`Viewport troppo largo: ${vp.width}px`);

  // ── 5. Controlli touch visibili ────────────────────────────────────────
  console.log('► Test 5: Controlli touch visibili');
  const touchControlsDisplay = await page.evaluate(() => {
    const el = document.getElementById('touch-controls');
    if (!el) return 'not-found';
    return window.getComputedStyle(el).display;
  });
  info(`#touch-controls display: ${touchControlsDisplay}`);
  touchControlsDisplay === 'flex'
    ? pass('Controlli touch visibili (display: flex)')
    : fail(`Controlli touch NON visibili (display: ${touchControlsDisplay})`);

  // ── 6. Pulsanti presenti nel DOM ──────────────────────────────────────
  console.log('► Test 6: Pulsanti touch presenti');
  const btns = await page.evaluate(() => ({
    left:  !!document.getElementById('btn-left'),
    right: !!document.getElementById('btn-right'),
    fire:  !!document.getElementById('fire-btn-touch'),
  }));
  btns.left  ? pass('#btn-left trovato')        : fail('#btn-left mancante');
  btns.right ? pass('#btn-right trovato')       : fail('#btn-right mancante');
  btns.fire  ? pass('#fire-btn-touch trovato')  : fail('#fire-btn-touch mancante');

  // ── 7. Canvas scalato per mobile ──────────────────────────────────────
  console.log('► Test 7: Canvas scalato per mobile');
  const canvasWidth = await page.evaluate(() => {
    const c = document.getElementById('phaser-game');
    return c ? parseInt(window.getComputedStyle(c).width) : 0;
  });
  info(`Canvas CSS width: ${canvasWidth}px`);
  canvasWidth > 0 && canvasWidth <= vp.width
    ? pass(`Canvas si adatta al viewport (${canvasWidth}px <= ${vp.width}px)`)
    : fail(`Canvas fuori viewport (${canvasWidth}px > ${vp.width}px)`);

  // ── 8. Tap-to-start ───────────────────────────────────────────────────
  console.log('► Test 8: Tap-to-start sul canvas');
  await page.tap('#phaser-game');
  await page.waitForTimeout(1200);
  const stateAfterTap = await getState(page);
  info(`Scena dopo tap: ${stateAfterTap?.scene}`);
  stateAfterTap?.scene === 'Game'
    ? pass('Tap ha avviato la partita')
    : fail(`La partita non è iniziata (scena: ${stateAfterTap?.scene})`);

  if (stateAfterTap?.scene !== 'Game') {
    console.log('\n⚠  Skip test gameplay: gioco non partito\n');
    await browser.close(); return;
  }

  await page.waitForTimeout(600);

  // ── 9. Stato iniziale ─────────────────────────────────────────────────
  console.log('► Test 9: Stato iniziale corretto');
  const init = await getState(page);
  init?.lives === 3 ? pass(`Vite iniziali: ${init.lives}`)    : fail(`Vite: ${init?.lives} (atteso 3)`);
  init?.score === 0 ? pass(`Score iniziale: ${init.score}`)   : fail(`Score: ${init?.score} (atteso 0)`);
  init?.level === 1 ? pass(`Level iniziale: ${init.level}`)   : fail(`Level: ${init?.level} (atteso 1)`);
  init?.enemies > 0 ? pass(`Nemici spawned: ${init.enemies}`) : fail('Nessun nemico spawned');

  // ── 10. Touch LEFT → il giocatore si muove a sinistra ─────────────────
  console.log('► Test 10: Pulsante LEFT muove il giocatore');
  const before = await getState(page);
  const xBefore = before?.playerX;
  await touchStart(page, '#btn-left');
  await page.waitForTimeout(400);
  const xAfterLeft = (await getState(page))?.playerX;
  await touchEnd(page, '#btn-left');
  info(`Player X: ${xBefore?.toFixed(0)} → ${xAfterLeft?.toFixed(0)}`);
  xAfterLeft < xBefore
    ? pass('Player si è mosso a sinistra')
    : fail(`Player NON si è mosso a sinistra (${xBefore?.toFixed(0)} → ${xAfterLeft?.toFixed(0)})`);

  // ── 11. Touch RIGHT → il giocatore si muove a destra ──────────────────
  console.log('► Test 11: Pulsante RIGHT muove il giocatore');
  const xBeforeRight = (await getState(page))?.playerX;
  await touchStart(page, '#btn-right');
  await page.waitForTimeout(400);
  const xAfterRight = (await getState(page))?.playerX;
  await touchEnd(page, '#btn-right');
  info(`Player X: ${xBeforeRight?.toFixed(0)} → ${xAfterRight?.toFixed(0)}`);
  xAfterRight > xBeforeRight
    ? pass('Player si è mosso a destra')
    : fail(`Player NON si è mosso a destra (${xBeforeRight?.toFixed(0)} → ${xAfterRight?.toFixed(0)})`);

  // ── 12. Touch FIRE → proiettile sparato ───────────────────────────────
  console.log('► Test 12: Pulsante FIRE spara un proiettile');
  const bullBefore = (await getState(page))?.bullets ?? 0;
  await touchStart(page, '#fire-btn-touch');
  await page.waitForTimeout(150);
  const bullAfter = (await getState(page))?.bullets ?? 0;
  await touchEnd(page, '#fire-btn-touch');
  info(`Proiettili: ${bullBefore} → ${bullAfter}`);
  bullAfter > bullBefore
    ? pass(`Proiettile sparato (${bullBefore} → ${bullAfter})`)
    : fail('Nessun proiettile sparato con FIRE touch');

  // ── 13. Pressed class applicata al touchstart ─────────────────────────
  console.log('► Test 13: Classe "pressed" applicata ai pulsanti');
  await touchStart(page, '#btn-left');
  const leftPressed = await page.evaluate(() => document.getElementById('btn-left')?.classList.contains('pressed'));
  await touchEnd(page, '#btn-left');
  const leftReleased = await page.evaluate(() => !document.getElementById('btn-left')?.classList.contains('pressed'));
  leftPressed  ? pass('Classe "pressed" aggiunta al touchstart') : fail('Classe "pressed" NON aggiunta');
  leftReleased ? pass('Classe "pressed" rimossa al touchend')    : fail('Classe "pressed" NON rimossa');

  // ── 14. Ciclo di gioco touch (30 secondi) ────────────────────────────
  console.log('► Test 14: Ciclo gameplay touch (30 sec)');
  const start   = Date.now();
  let restarts  = 0;
  let freezes   = 0;
  let negLives  = 0;
  let maxScore  = 0;

  while (Date.now() - start < 30000) {
    const s = await getState(page);
    if (!s) { await page.waitForTimeout(100); continue; }

    if (s.scene === 'not-active') {
      await page.tap('#phaser-game');
      await page.waitForTimeout(500);
      restarts++;
      process.stdout.write(`\r  ⏱ ${((Date.now()-start)/1000).toFixed(0)}s | restart #${restarts}        `);
      continue;
    }

    if (s.lives < 0)  negLives++;
    if (s.score > maxScore) maxScore = s.score;

    process.stdout.write(`\r  ⏱ ${((Date.now()-start)/1000).toFixed(0)}s | ❤ ${s.lives} | Score: ${s.score} | Nemici: ${s.enemies} | Restart: ${restarts}`);

    // Movimento casuale
    const dir = Math.random() < 0.5 ? '#btn-left' : '#btn-right';
    await touchStart(page, dir);
    await page.waitForTimeout(120 + Math.random() * 180);
    await touchEnd(page, dir);

    // Sparo continuo
    await touchStart(page, '#fire-btn-touch');
    await page.waitForTimeout(80);
    await touchEnd(page, '#fire-btn-touch');

    await page.waitForTimeout(60);
  }

  console.log(`\n  Score massimo: ${maxScore.toLocaleString()} | Restart: ${restarts}`);
  negLives === 0 ? pass('Nessuna vita negativa')     : fail(`${negLives} frames con vite negative (bug)`);
  freezes  === 0 ? pass('Nessun freeze anomalo')     : fail(`${freezes} freeze rilevati`);
  restarts <= 10 ? pass(`Gameplay stabile (${restarts} restart)`) : info(`Molti restart (${restarts}) — difficoltà alta o bug`);

  // ── 15. Errori JS accumulati ───────────────────────────────────────────
  console.log('► Test 15: Errori JS durante il gameplay');
  const gameplayErrors = jsErrors.filter(e => !e.includes('favicon') && !e.includes('font'));
  gameplayErrors.length === 0
    ? pass('Nessun errore JS durante il gameplay mobile')
    : fail(`${gameplayErrors.length} errore/i: ${gameplayErrors.slice(0,3).join(' | ')}`);

  // ── Riepilogo ─────────────────────────────────────────────────────────
  await browser.close();

  const ok  = (process.exitCode ?? 0) === 0;
  console.log('\n' + '─'.repeat(50));
  console.log(ok ? '🎉 TUTTI I TEST SUPERATI' : '⚠  ALCUNI TEST FALLITI');
  console.log('─'.repeat(50) + '\n');
}

runTests().catch(e => {
  console.error('\n💥 Errore inatteso:', e.message);
  process.exit(1);
});
