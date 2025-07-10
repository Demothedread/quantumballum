const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting Pachinko mode test');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });

  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:3006/pachinko-test.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Page loaded');

    // Wait a bit for scripts to initialize
    console.log('Waiting for 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Screenshot to verify visually
    await page.screenshot({ path: 'pachinko-mode-test.png' });
    console.log('Screenshot saved as pachinko-mode-test.png');

    // Check current mode
    const currentMode = await page.evaluate(() => {
      return document.getElementById('modeValue')?.textContent || 'unknown';
    });

    console.log(`Current mode displayed on screen: ${currentMode}`);

    // Let the simulation run for a bit to see the balls falling
    console.log('Observing simulation for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('Test complete');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})();
