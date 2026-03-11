const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 30 });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('\n❌ ERRORE JS:', msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
    console.error('\n❌ ERRORE PAGINA:', err.message);
  });

  console.log('🎮 Apertura gioco...');
  await page.goto('http://localhost:5175/neon-blaster.html');
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    window.__getGameState = () => {
      const game = window.game;
      if (!game) return null;
      const scene = game.scene.getScene('Game');
      if (!scene || !scene.sys.isActive()) return { scene: 'not-active' };
      return {
        lives: scene.lives,
        score: scene.score,
        level: scene.level,
        gameOver: scene.gameOver,
        invincible: scene.invincible,
        wavePending: scene.wavePending,
        enemies: scene.enemies ? scene.enemies.getChildren().length : 0,
        physicsPaused: scene.physics.world.isPaused,
      };
    };
  });

  console.log('▶ Avvio partita (SPACE)...');
  await page.keyboard.press('Space');
  await page.waitForTimeout(800);

  const startTime = Date.now();
  let frozenCount = 0;
  let lastLives = 3;
  let lastScore = 0;
  let lastEnemies = 7;

  // Simula 90 secondi di gameplay aggressivo
  while (Date.now() - startTime < 90000) {
    // Spara continuamente + movimento
    await page.keyboard.down('Space');
    await page.waitForTimeout(60);
    await page.keyboard.up('Space');

    const dir = Math.random() < 0.5 ? 'ArrowLeft' : 'ArrowRight';
    await page.keyboard.down(dir);
    await page.waitForTimeout(80);
    await page.keyboard.up(dir);

    const state = await page.evaluate(() => window.__getGameState ? window.__getGameState() : null);
    if (!state) continue;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (state.scene === 'not-active') {
      // Siamo in GameOver, premi SPACE per ricominciare
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);
      process.stdout.write(`\r⏱ ${elapsed}s | [GAME OVER - riavvio...]                    `);
      continue;
    }

    process.stdout.write(`\r⏱ ${elapsed}s | Vite: ${state.lives} | Score: ${state.score} | Nemici: ${state.enemies} | GO: ${state.gameOver} | Paused: ${state.physicsPaused} | Inv: ${state.invincible}`);

    // Rileva freeze: physics pausa senza game over (bug)
    if (state.physicsPaused && !state.gameOver) {
      console.error(`\n🧊 FREEZE ANOMALO! Physics paused senza gameOver! Stato: ${JSON.stringify(state)}`);
      frozenCount++;
    }

    // Rileva vite negative (bug)
    if (state.lives < 0) {
      console.error(`\n⚠️  VITE NEGATIVE: ${state.lives} — bug nel contatore!`);
    }

    lastLives = state.lives;
    lastScore = state.score;
    lastEnemies = state.enemies;

    await page.waitForTimeout(100);
  }

  console.log('\n\n📊 RISULTATO FINALE:');
  const gameErrors = errors.filter(e => !e.includes('404') && !e.includes('font'));
  if (gameErrors.length === 0) {
    console.log('✅ Nessun errore JavaScript rilevato');
  } else {
    console.log(`❌ ${gameErrors.length} errori:`);
    gameErrors.forEach(e => console.log('  -', e));
  }
  if (frozenCount === 0) {
    console.log('✅ Nessun freeze anomalo in 90 secondi');
  } else {
    console.log(`❌ ${frozenCount} freeze anomali rilevati`);
  }

  await browser.close();
})();
