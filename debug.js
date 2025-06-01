/**
 * Debugging script for the Quantum Visual Simulation
 * This file helps diagnose initialization issues
 */

// Store the original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

// Enhanced console logging with timestamps and persistence
console.log = function() {
  const args = Array.from(arguments);
  const timestamp = new Date().toISOString().substr(11, 8);
  originalConsole.log.apply(console, [`[${timestamp}]`, ...args]);
  logToStorage('log', args.join(' '));
};

console.warn = function() {
  const args = Array.from(arguments);
  const timestamp = new Date().toISOString().substr(11, 8);
  originalConsole.warn.apply(console, [`[${timestamp}] ⚠️`, ...args]);
  logToStorage('warn', args.join(' '));
};

console.error = function() {
  const args = Array.from(arguments);
  const timestamp = new Date().toISOString().substr(11, 8);
  originalConsole.error.apply(console, [`[${timestamp}] 🔴`, ...args]);
  logToStorage('error', args.join(' '));
};

// Store logs in session storage for debugging
function logToStorage(level, message) {
  try {
    const logs = JSON.parse(sessionStorage.getItem('quantumVisualLogs') || '[]');
    logs.push({
      timestamp: new Date().toISOString(),
      level,
      message
    });
    // Keep only the last 100 logs
    while (logs.length > 100) logs.shift();
    sessionStorage.setItem('quantumVisualLogs', JSON.stringify(logs));
  } catch (e) {
    // Silent fail for storage errors
  }
}

// Check for initialization status
window.checkInitializationStatus = function() {
  const report = {
    threejs: typeof THREE !== 'undefined',
    scene: typeof scene !== 'undefined',
    camera: typeof camera !== 'undefined',
    renderer: typeof renderer !== 'undefined',
    controls: typeof controls !== 'undefined',
    animate: typeof animate === 'function',
    initEventListeners: typeof initEventListeners === 'function',
    params: typeof params !== 'undefined',
    missingDOMElements: []
  };
  
  // Check for critical DOM elements
  const criticalElements = [
    'loadingContainer', 'canvasContainer', 'gui',
    'resetCamera', 'cam-wave', 'cam-particle', 'cam-artistic',
    'cam-topdown', 'cam-follow', 'closeInfoModal', 'infoModalBg'
  ];
  
  criticalElements.forEach(id => {
    if (!document.getElementById(id)) {
      report.missingDOMElements.push(id);
    }
  });
  
  console.log('Initialization Status Report:', report);
  return report;
};

// Add a global error handler
window.addEventListener('error', function(e) {
  console.error('Global error:', e.message, 'at', e.filename, 'line', e.lineno);
  logToStorage('globalError', `${e.message} at ${e.filename}:${e.lineno}`);
  
  // Add visual indicator for errors
  const errorDisplay = document.createElement('div');
  errorDisplay.style.position = 'fixed';
  errorDisplay.style.bottom = '10px';
  errorDisplay.style.right = '10px';
  errorDisplay.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
  errorDisplay.style.color = 'white';
  errorDisplay.style.padding = '10px';
  errorDisplay.style.borderRadius = '5px';
  errorDisplay.style.zIndex = '9999';
  errorDisplay.style.maxWidth = '80%';
  errorDisplay.style.wordBreak = 'break-word';
  errorDisplay.textContent = `Error: ${e.message}`;
  document.body.appendChild(errorDisplay);
  
  // Remove after 10 seconds
  setTimeout(() => {
    if (errorDisplay.parentNode) {
      errorDisplay.parentNode.removeChild(errorDisplay);
    }
  }, 10000);
});

// Function to display the debug panel
window.showDebugPanel = function() {
  // Create panel if it doesn't exist
  if (!document.getElementById('quantum-debug-panel')) {
    const panel = document.createElement('div');
    panel.id = 'quantum-debug-panel';
    panel.style.position = 'fixed';
    panel.style.top = '10px';
    panel.style.left = '10px';
    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    panel.style.color = '#00ff00';
    panel.style.padding = '10px';
    panel.style.borderRadius = '5px';
    panel.style.zIndex = '9999';
    panel.style.maxWidth = '80%';
    panel.style.maxHeight = '80%';
    panel.style.overflow = 'auto';
    panel.style.fontFamily = 'monospace';
    panel.style.fontSize = '12px';
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.background = '#555';
    closeButton.style.color = '#fff';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.padding = '2px 5px';
    closeButton.onclick = function() {
      document.body.removeChild(panel);
    };
    panel.appendChild(closeButton);
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Quantum Visual Debug Console';
    title.style.marginTop = '0';
    panel.appendChild(title);
    
    // Add status section
    const statusSection = document.createElement('div');
    statusSection.innerHTML = '<h4>Initialization Status</h4>';
    panel.appendChild(statusSection);
    
    // Add log section
    const logSection = document.createElement('div');
    logSection.innerHTML = '<h4>Recent Logs</h4>';
    panel.appendChild(logSection);
    
    // Add to document
    document.body.appendChild(panel);
    
    // Update with current status
    updateDebugPanel();
  }
};

// Function to update the debug panel content
function updateDebugPanel() {
  const panel = document.getElementById('quantum-debug-panel');
  if (!panel) return;
  
  // Update status section
  const statusSection = panel.querySelector('div:nth-child(3)');
  if (statusSection) {
    const status = window.checkInitializationStatus();
    let statusHTML = '<h4>Initialization Status</h4>';
    
    statusHTML += `<p>THREE.js loaded: <span style="color:${status.threejs ? '#00ff00' : '#ff0000'}">${status.threejs ? 'Yes' : 'No'}</span></p>`;
    statusHTML += `<p>Scene created: <span style="color:${status.scene ? '#00ff00' : '#ff0000'}">${status.scene ? 'Yes' : 'No'}</span></p>`;
    statusHTML += `<p>Camera created: <span style="color:${status.camera ? '#00ff00' : '#ff0000'}">${status.camera ? 'Yes' : 'No'}</span></p>`;
    statusHTML += `<p>Renderer created: <span style="color:${status.renderer ? '#00ff00' : '#ff0000'}">${status.renderer ? 'Yes' : 'No'}</span></p>`;
    statusHTML += `<p>Controls created: <span style="color:${status.controls ? '#00ff00' : '#ff0000'}">${status.controls ? 'Yes' : 'No'}</span></p>`;
    statusHTML += `<p>Animate function: <span style="color:${status.animate ? '#00ff00' : '#ff0000'}">${status.animate ? 'Yes' : 'No'}</span></p>`;
    
    if (status.missingDOMElements.length > 0) {
      statusHTML += `<p>Missing DOM elements: <span style="color:#ff0000">${status.missingDOMElements.join(', ')}</span></p>`;
    } else {
      statusHTML += `<p>DOM elements: <span style="color:#00ff00">All present</span></p>`;
    }
    
    statusSection.innerHTML = statusHTML;
  }
  
  // Update log section
  const logSection = panel.querySelector('div:nth-child(4)');
  if (logSection) {
    try {
      const logs = JSON.parse(sessionStorage.getItem('quantumVisualLogs') || '[]');
      let logHTML = '<h4>Recent Logs</h4>';
      
      // Only show the last 20 logs
      const recentLogs = logs.slice(-20);
      recentLogs.forEach(log => {
        const color = log.level === 'error' ? '#ff5555' : 
                     log.level === 'warn' ? '#ffff55' : '#aaaaaa';
        const time = log.timestamp.substr(11, 8);
        logHTML += `<div style="color:${color}"><span>[${time}]</span> ${log.message}</div>`;
      });
      
      logSection.innerHTML = logHTML;
    } catch (e) {
      logSection.innerHTML = '<h4>Recent Logs</h4><p>Error loading logs</p>';
    }
  }
}

// Add keyboard shortcut to show debug panel (Ctrl+Shift+D)
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    window.showDebugPanel();
  }
});

console.log('Quantum Visual debug tools initialized. Press Ctrl+Shift+D to open debug panel.');

// Allow checking initialization status from the console
window.quantumDebug = {
  checkStatus: window.checkInitializationStatus,
  showPanel: window.showDebugPanel,
  start: window.startFallbackRenderer,
  getLogs: function() {
    try {
      return JSON.parse(sessionStorage.getItem('quantumVisualLogs') || '[]');
    } catch (e) {
      return [];
    }
  }
};
