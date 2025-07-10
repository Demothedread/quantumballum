// Simple Puppeteer test script
const puppeteer = require('puppeteer');

(async () => {
  // Launch Puppeteer with extra debugging
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-web-security']
  });
  
  console.log("Browser launched");
  const page = await browser.newPage();
  
  // Log all console messages from the page
  page.on('console', msg => console.log('Browser console:', msg.text()));
  
  // Log all network requests and responses, but filter out DevTools requests
  page.on('requestfinished', request => {
    // Skip the DevTools request paths for cleaner logs
    if (!request.url().includes('/.well-known/appspecific/com.chrome.devtools')) {
      console.log(`Request: ${request.url()} - ${request.response()?.status()}`);
    }
  });
  
  // Log any errors, but ignore certain expected ones
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });
  
  // Suppress specific request failure error related to Chrome DevTools
  page.on('requestfailed', request => {
    if (!request.url().includes('/.well-known/appspecific/com.chrome.devtools')) {
      console.log(`Failed request: ${request.url()} - ${request.failure().errorText}`);
    }
  });
  
  async function runTest(testUrl, screenshotName) {
    console.log(`\n📋 Running test for: ${testUrl}`);
    try {
      console.log(`Navigating to ${testUrl}`);
      await page.goto(testUrl, {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      
      console.log(`Taking screenshot: ${screenshotName}`);
      await page.screenshot({ path: screenshotName });
      
      console.log("Screenshot saved, checking page title");
      const title = await page.title();
      console.log(`Page title: ${title}`);
      
      // Wait for a specific element that indicates the app is loaded
      try {
        await page.waitForSelector('#canvasContainer', { timeout: 5000 });
        console.log("Canvas container found!");
        
        // Check if there's a THREE.WebGLRenderer canvas in the page
        const hasCanvas = await page.evaluate(() => {
          const canvas = document.querySelector('#canvasContainer canvas');
          return !!canvas;
        });
        
        if (hasCanvas) {
          console.log("✅ SUCCESS: WebGL canvas was created");
        } else {
          console.log("❌ FAILURE: No WebGL canvas was created");
        }
        
        // Check if we have the test-status element
        const hasTestStatus = await page.evaluate(() => {
          return !!document.getElementById('test-status');
        });
        
        if (hasTestStatus) {
          const testStatus = await page.evaluate(() => {
            return document.getElementById('test-status').innerText;
          });
          
          console.log(`Test status: ${testStatus}`);
          
          if (testStatus === 'Three.js loaded and working!') {
            console.log("✅ SUCCESS: Three.js initialized correctly");
          } else {
            console.log("❌ FAILURE: Three.js did not initialize correctly");
          }
        }
        
        // Check if we have the testResults element
        const hasTestResults = await page.evaluate(() => {
          return !!document.getElementById('testResults');
        });
        
        if (hasTestResults) {
          const testResults = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('#testResults .test-result').forEach(el => {
              results.push(el.innerText);
            });
            return results;
          });
          
          console.log("Test Results:");
          testResults.forEach(result => console.log(`  ${result.split('\n').join(' - ')}`));
        }
        
      } catch (e) {
        console.log("Canvas container not found:", e.message);
      }
    } catch (error) {
      console.log('Navigation error:', error.message);
    }
  }

  // Run both test pages
  await runTest('http://localhost:3000/puppeteer-test.html', 'puppeteer-test.png');
  await runTest('http://localhost:3000/test-suite.html', 'test-suite.png');
  
  await browser.close();
  console.log("Browser closed");
})();
