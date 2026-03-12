/**
 * test-breakout.cjs
 * Test automatico per Breakout — headless, desktop.
 * Esegui con:  node test-breakout.cjs
 * (dev server su http://localhost:5175)
 */

const { chromium } = require('playwright');

const URL = 'http://localhost:5175/breakout.html';

function pass(msg) { console.log(`  ✅ ${msg}`); }
function fail(msg) { console.log(`  ❌ ${msg}`); process.exitCode = 1; }
function info(msg) { console.log(`  ℹ  ${msg}`); }

/** Legge lo stato corrente del gioco dal browser */
async function getState(page) {
  return page.evaluate(() => {
    if (typeof running === 'undefined') return null;
    return {
      running,
      score:  typeof score  !== 'undefined' ? score  : null,
      lives:  typeof lives  !== 'undefined' ? lives  : null,
      level:  typeof level  !== 'undefined' ? level  : null,
      ballX:  typeof ball   !== 'undefined' && ball ? ball.x : null,
      ballY:  typeof ball   !== 'undefined' && ball ? ball.y : null,
      ballDX: typeof ball   !== 'undefined' && ball ? ball.dx : null,
      ballDY: typeof ball   !== 'undefined' && ball ? ball.dy : null,
      paddleX: typeof paddle !== 'undefined' && paddle ? paddle.x : null,
      bricksAlive: typeof bricks !== 'undefined' && bricks
        ? bricks.filter(b => b.alive).length : null,
      overlayVisible: (() => {
        const el = document.getElementById('overlay');
        return el ? el.style.display !== 'none' : null;
      })(),
    };
  });
}

async function runTests() {
  console.log('\n🧱 BREAKOUT — TEST AUTOMATICO\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 500, height: 700 });

  const jsErrors = [];
  page.on('console', m => { if (m.type() === 'error') jsErrors.push(m.text()); });
  page.on('pageerror', e => jsErrors.push(e.message));

  // ── 1. Caricamento ────────────────────────────────────────────────────────
  console.log('► Test 1: Caricamento pagina');
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
    pass('Pagina caricata');
  } catch (e) {
    fail(`Impossibile caricare: ${e.message}`);
    await browser.close(); return;
  }
  await page.waitForTimeout(1000);

  // ── 2. Canvas presente ────────────────────────────────────────────────────
  console.log('► Test 2: Canvas presente');
  const canvasExists = await page.evaluate(() => !!document.getElementById('gameCanvas'));
  canvasExists ? pass('Canvas trovato') : fail('Canvas mancante');

  // ── 3. Errori JS al caricamento ───────────────────────────────────────────
  console.log('► Test 3: Nessun errore JS al caricamento');
  const loadErrors = jsErrors.filter(e => !e.includes('favicon') && !e.includes('font') && !e.includes('api/score'));
  loadErrors.length === 0
    ? pass('Nessun errore JS')
    : fail(`${loadErrors.length} errori: ${loadErrors.join(' | ')}`);

  // ── 4. Overlay visibile all'avvio ─────────────────────────────────────────
  console.log('► Test 4: Overlay iniziale visibile');
  const overlayVisible = await page.evaluate(() => {
    const el = document.getElementById('overlay');
    return el && el.style.display !== 'none';
  });
  overlayVisible ? pass('Overlay visibile') : fail('Overlay NON visibile');

  // ── 5. Click INIZIA avvia il gioco ────────────────────────────────────────
  console.log('► Test 5: Click INIZIA avvia il gioco');
  await page.click('#startBtn');
  await page.waitForTimeout(300);
  const stateAfterStart = await getState(page);
  info(`running=${stateAfterStart?.running}, lives=${stateAfterStart?.lives}, bricks=${stateAfterStart?.bricksAlive}`);
  stateAfterStart?.running === true  ? pass('running = true') : fail(`running = ${stateAfterStart?.running}`);
  stateAfterStart?.lives   === 3     ? pass('Vite iniziali: 3') : fail(`Vite: ${stateAfterStart?.lives} (atteso 3)`);
  stateAfterStart?.score   === 0     ? pass('Score iniziale: 0') : fail(`Score: ${stateAfterStart?.score}`);
  stateAfterStart?.level   === 1     ? pass('Level iniziale: 1') : fail(`Level: ${stateAfterStart?.level}`);
  stateAfterStart?.bricksAlive === 60 ? pass('60 mattoni presenti') : fail(`Mattoni: ${stateAfterStart?.bricksAlive} (atteso 60)`);
  stateAfterStart?.overlayVisible === false ? pass('Overlay nascosto') : fail('Overlay ancora visibile dopo INIZIA');

  // ── 6. La pallina si muove ────────────────────────────────────────────────
  console.log('► Test 6: La pallina si muove');
  const s1 = await getState(page);
  await page.waitForTimeout(500);
  const s2 = await getState(page);
  const moved = s1?.ballX !== s2?.ballX || s1?.ballY !== s2?.ballY;
  info(`Ball: (${s1?.ballX?.toFixed(1)}, ${s1?.ballY?.toFixed(1)}) → (${s2?.ballX?.toFixed(1)}, ${s2?.ballY?.toFixed(1)})`);
  moved ? pass('Pallina si muove') : fail('Pallina ferma (possibile bug dy=0)');

  // ── 7. Velocità pallina non è zero ────────────────────────────────────────
  console.log('► Test 7: Velocità pallina non nulla');
  const speed = Math.sqrt((s1?.ballDX ?? 0) ** 2 + (s1?.ballDY ?? 0) ** 2);
  info(`Speed=${speed.toFixed(2)} dx=${s1?.ballDX?.toFixed(2)} dy=${s1?.ballDY?.toFixed(2)}`);
  speed > 1   ? pass(`Speed=${speed.toFixed(2)} > 1`) : fail(`Speed troppo bassa: ${speed.toFixed(2)} — probabile bug reset angolo`);
  s1?.ballDY !== 0 ? pass(`dy≠0 (${s1?.ballDY?.toFixed(2)})`) : fail('dy=0 — pallina non si muove verticalmente!');
  s1?.ballDX !== 0 ? pass(`dx≠0 (${s1?.ballDX?.toFixed(2)})`) : info('dx=0 — pallina va dritta su (accettabile ma raro)');

  // ── 8. Paddle si muove con tastiera ──────────────────────────────────────
  console.log('► Test 8: Paddle si muove con tastiera');
  const pxBefore = (await getState(page))?.paddleX;
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowLeft');
  const pxAfterLeft = (await getState(page))?.paddleX;
  info(`Paddle X: ${pxBefore?.toFixed(0)} → ${pxAfterLeft?.toFixed(0)}`);
  pxAfterLeft < pxBefore
    ? pass('Paddle si muove a sinistra')
    : fail(`Paddle NON si muove a sinistra (${pxBefore?.toFixed(0)} → ${pxAfterLeft?.toFixed(0)})`);

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowRight');
  const pxAfterRight = (await getState(page))?.paddleX;
  info(`Paddle X: ${pxAfterLeft?.toFixed(0)} → ${pxAfterRight?.toFixed(0)}`);
  pxAfterRight > pxAfterLeft
    ? pass('Paddle si muove a destra')
    : fail(`Paddle NON si muove a destra`);

  // ── 9. Ripristino pallina dopo reset ──────────────────────────────────────
  console.log('► Test 9: Verifica 10 reset pallina (velocità sempre valida)');
  let badResets = 0;
  const speedSamples = [];
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => resetBall());
    await page.waitForTimeout(50);
    const rs = await getState(page);
    const spd = Math.sqrt((rs?.ballDX ?? 0) ** 2 + (rs?.ballDY ?? 0) ** 2);
    speedSamples.push(spd.toFixed(2));
    if (spd < 1 || (rs?.ballDY === 0)) badResets++;
  }
  info(`Speed nei 10 reset: [${speedSamples.join(', ')}]`);
  badResets === 0
    ? pass('Tutti i reset hanno speed > 1 e dy ≠ 0')
    : fail(`${badResets}/10 reset con speed < 1 o dy=0 — BUG in resetBall()`);

  // ── 10. Loop gameplay 30 secondi ─────────────────────────────────────────
  console.log('► Test 10: Gameplay 30 secondi (paddle automatico)');
  const start = Date.now();
  let negLives = 0, restarts = 0, maxScore = 0, minBricks = 60;

  // Riavvia il gioco per il test gameplay
  const ov = await page.evaluate(() => document.getElementById('overlay'));
  if (!(await getState(page))?.running) {
    await page.click('#startBtn').catch(() => {});
    await page.waitForTimeout(300);
  }

  while (Date.now() - start < 30000) {
    const s = await getState(page);
    if (!s) { await page.waitForTimeout(100); continue; }

    // Se overlay visibile (game over), riavvia
    if (s.overlayVisible) {
      try { await page.click('#startBtn'); } catch {}
      await page.waitForTimeout(400);
      restarts++;
      process.stdout.write(`\r  ⏱ ${((Date.now()-start)/1000).toFixed(0)}s | restart #${restarts}        `);
      continue;
    }

    if (s.lives < 0) negLives++;
    if (s.score > maxScore) maxScore = s.score;
    if (s.bricksAlive !== null && s.bricksAlive < minBricks) minBricks = s.bricksAlive;

    process.stdout.write(`\r  ⏱ ${((Date.now()-start)/1000).toFixed(0)}s | ❤ ${s.lives} | Score:${s.score} | Mattoni:${s.bricksAlive} | Restart:${restarts}`);

    // Paddle tracking automatico (segue la pallina)
    if (s.ballX !== null && s.paddleX !== null) {
      const paddleCenter = s.paddleX + 40;
      if (s.ballX < paddleCenter - 10) {
        await page.keyboard.down('ArrowLeft');
        await page.waitForTimeout(30);
        await page.keyboard.up('ArrowLeft');
      } else if (s.ballX > paddleCenter + 10) {
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(30);
        await page.keyboard.up('ArrowRight');
      }
    }
    await page.waitForTimeout(40);
  }

  console.log(`\n  Score max: ${maxScore} | Mattoni distrutti: ${60 - minBricks} | Restart: ${restarts}`);
  negLives === 0 ? pass('Nessuna vita negativa') : fail(`${negLives} frame con vite negative — BUG`);
  restarts <= 15 ? pass(`Gameplay stabile (${restarts} restart)`) : info(`Molti restart (${restarts})`);
  maxScore > 0   ? pass(`Score aumenta (max ${maxScore})`) : fail('Score sempre 0 — la pallina non colpisce mattoni');

  // ── 11. Errori JS durante il gameplay ─────────────────────────────────────
  console.log('► Test 11: Nessun errore JS durante il gameplay');
  const allErrors = jsErrors.filter(e => !e.includes('favicon') && !e.includes('font') && !e.includes('api/score'));
  allErrors.length === 0
    ? pass('Nessun errore JS')
    : fail(`${allErrors.length} errori: ${allErrors.slice(0,3).join(' | ')}`);

  await browser.close();
  console.log('\n' + '─'.repeat(50));
  console.log((process.exitCode ?? 0) === 0 ? '🎉 TUTTI I TEST SUPERATI' : '⚠  ALCUNI TEST FALLITI');
  console.log('─'.repeat(50) + '\n');
}

runTests().catch(e => {
  console.error('\n💥 Errore inatteso:', e.message);
  process.exit(1);
});
