// Test script to verify pachinko mode initialization
const puppeteer = require('puppeteer');

(async () => {
  // Launch browser with larger viewport for better visibility
  const browser = await puppeteer.launch({ 
    headless: false, 
    args: ['--window-size=1280,800'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Opening local server...');
  await page.goto('http://localhost:3000/', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  
  // Wait for simulation to initialize
  await page.waitForFunction(() => {
    return document.getElementById('loadingContainer')?.style.display === 'none';
  }, { timeout: 10000 });
  
  console.log('Simulation loaded');
  
  // Verify current mode
  const currentMode = await page.evaluate(() => {
    const modeValue = document.getElementById('modeValue')?.innerText;
    console.log('Current mode:', modeValue);
    return modeValue;
  });
  
  console.log('Current mode detected:', currentMode);

  if (currentMode === 'Pachinko') {
    console.log('✅ SUCCESS: Application started in Pachinko mode as expected');
  } else {
    console.log('❌ FAILED: Application did not start in Pachinko mode');
  }
  
  // Take screenshot for verification
  await page.screenshot({ path: 'pachinko-test.png', fullPage: true });
  console.log('Screenshot saved as pachinko-test.png');
  
  // Check for active balls - pachinko mode should be creating balls
  const ballCount = await page.evaluate(() => {
    // Check in both implementations
    const usingQuantumSim = typeof window.QuantumSim !== 'undefined';
    
    if (usingQuantumSim) {
      return window.QuantumSim.state.activeBalls.length;
    } else {
      // Using original implementation
      return window.activeBalls?.length || 0;
    }
  });
  
  console.log(`Active balls detected: ${ballCount}`);
  
  // Keep browser open to observe the simulation for 10 seconds
  console.log('Observing simulation for 10 seconds...');
  await new Promise(r => setTimeout(r, 10000));
  
  // Close browser
  await browser.close();
  console.log('Test completed');
})();
