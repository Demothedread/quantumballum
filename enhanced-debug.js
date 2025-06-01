/**
 * Enhanced Debugging Utilities for Quantum Visual Simulation
 * Provides advanced debugging, performance monitoring, and diagnostic tools
 */

(function(global) {
  'use strict';
  
  // Store original console methods
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };
  
  // Log storage
  const logStorage = {
    maxEntries: 200,
    entries: [],
    
    add: function(level, message) {
      const entry = {
        timestamp: new Date().toISOString(),
        level,
        message
      };
      
      this.entries.unshift(entry); // Add to beginning for newest first
      
      // Trim if exceeds max entries
      if (this.entries.length > this.maxEntries) {
        this.entries.pop();
      }
      
      // Update UI if available
      this.updateUI();
      
      // Save to session storage
      try {
        sessionStorage.setItem('quantumVisualLogs', JSON.stringify(this.entries));
      } catch (e) {
        // Silent fail for storage errors
      }
    },
    
    updateUI: function() {
      const logElement = document.getElementById('debugLogContent');
      if (!logElement) return;
      
      let logHtml = '';
      this.entries.forEach(entry => {
        const color = this.getLevelColor(entry.level);
        const time = entry.timestamp.substr(11, 8);
        logHtml += `<span style="color:${color}">[${time}][${entry.level}]</span> ${this.escapeHtml(entry.message)}\n`;
      });
      
      logElement.innerHTML = logHtml;
    },
    
    getLevelColor: function(level) {
      switch (level) {
        case 'error': return '#ff3366';
        case 'warn': return '#ffcc00';
        case 'info': return '#00ccff';
        default: return '#aaaaaa';
      }
    },
    
    escapeHtml: function(text) {
      const div = document.createElement('div');
      div.innerText = text;
      return div.innerHTML;
    },
    
    clear: function() {
      this.entries = [];
      this.updateUI();
      try {
        sessionStorage.removeItem('quantumVisualLogs');
      } catch (e) {
        // Silent fail
      }
    }
  };
  
  // Performance monitoring
  const performanceMonitor = {
    fps: 0,
    frameTime: 0,
    frameCount: 0,
    lastSecond: 0,
    
    update: function(timestamp) {
      // Initialize lastSecond if this is the first update
      if (!this.lastSecond) {
        this.lastSecond = timestamp;
        return;
      }
      
      // Increment frame counter
      this.frameCount++;
      
      // Calculate frame time (smoothed)
      const lastFrameTime = timestamp - this.lastFrameTime;
      this.frameTime = this.frameTime * 0.9 + lastFrameTime * 0.1;
      this.lastFrameTime = timestamp;
      
      // Update FPS once per second
      if (timestamp - this.lastSecond >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastSecond = timestamp;
        
        // Update UI
        this.updateUI();
      }
      
      // Request next update
      requestAnimationFrame(this.update.bind(this));
    },
    
    updateUI: function() {
      const fpsElement = document.getElementById('fpsValue');
      const frameTimeElement = document.getElementById('frameTimeValue');
      
      if (fpsElement) {
        fpsElement.textContent = this.fps;
        // Color-code based on performance
        if (this.fps >= 55) {
          fpsElement.style.color = '#00ff88';
        } else if (this.fps >= 30) {
          fpsElement.style.color = '#ffcc00';
        } else {
          fpsElement.style.color = '#ff3366';
        }
      }
      
      if (frameTimeElement) {
        frameTimeElement.textContent = `${this.frameTime.toFixed(1)}ms`;
      }
    },
    
    start: function() {
      requestAnimationFrame(this.update.bind(this));
    }
  };
  
  // Debug panel UI
  const debugPanel = {
    active: false,
    
    init: function() {
      // Initialize panel if it exists
      const panel = document.getElementById('debugPanel');
      const toggleButton = document.createElement('button');
      
      if (!panel) return;
      
      // Create toggle button
      toggleButton.id = 'toggleDebugPanel';
      toggleButton.innerHTML = 'Debug';
      toggleButton.classList.add('debug-toggle');
      toggleButton.style.position = 'fixed';
      toggleButton.style.top = '5px';
      toggleButton.style.right = '5px';
      toggleButton.style.zIndex = '999';
      toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      toggleButton.style.color = '#00ffcc';
      toggleButton.style.border = '1px solid #00ffcc';
      toggleButton.style.borderRadius = '3px';
      toggleButton.style.padding = '3px 8px';
      toggleButton.style.fontSize = '10px';
      toggleButton.style.cursor = 'pointer';
      document.body.appendChild(toggleButton);
      
      // Toggle panel visibility
      toggleButton.addEventListener('click', () => {
        this.toggle();
      });
      
      // Set up close button
      const closeButton = document.getElementById('closeDebugPanel');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          this.hide();
        });
      }
      
      // Set up debug controls
      const wireframeButton = document.getElementById('toggleWireframe');
      if (wireframeButton) {
        wireframeButton.addEventListener('click', () => {
          this.toggleWireframe();
        });
      }
      
      const screenshotButton = document.getElementById('takeScreenshot');
      if (screenshotButton) {
        screenshotButton.addEventListener('click', () => {
          this.takeScreenshot();
        });
      }
      
      // Initialize log display from storage
      this.loadLogsFromStorage();
    },
    
    show: function() {
      const panel = document.getElementById('debugPanel');
      if (panel) {
        panel.classList.add('active');
        this.active = true;
      }
    },
    
    hide: function() {
      const panel = document.getElementById('debugPanel');
      if (panel) {
        panel.classList.remove('active');
        this.active = false;
      }
    },
    
    toggle: function() {
      if (this.active) {
        this.hide();
      } else {
        this.show();
      }
    },
    
    loadLogsFromStorage: function() {
      try {
        const storedLogs = sessionStorage.getItem('quantumVisualLogs');
        if (storedLogs) {
          logStorage.entries = JSON.parse(storedLogs);
          logStorage.updateUI();
        }
      } catch (e) {
        console.error('Error loading logs from storage:', e);
      }
    },
    
    updateRenderingInfo: function(renderer) {
      if (!renderer || !this.active) return;
      
      const drawCalls = document.getElementById('drawCallsValue');
      const triangles = document.getElementById('trianglesValue');
      
      if (drawCalls) {
        drawCalls.textContent = renderer.info.render.calls;
      }
      
      if (triangles) {
        triangles.textContent = renderer.info.render.triangles;
      }
    },
    
    updateSimulationInfo: function(mode, objectCount) {
      if (!this.active) return;
      
      const modeElement = document.getElementById('debugModeValue');
      const objectsElement = document.getElementById('objectsValue');
      
      if (modeElement) {
        modeElement.textContent = mode || '-';
      }
      
      if (objectsElement) {
        objectsElement.textContent = objectCount || '-';
      }
    },
    
    toggleWireframe: function() {
      // Access global scene from QuantumSim or window
      const scene = window.QuantumSim?.sceneObjects?.scene || window.scene;
      
      if (!scene) {
        logStorage.add('error', 'Cannot toggle wireframe: Scene not found');
        return;
      }
      
      scene.traverse(function(object) {
        if (object.isMesh && object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => {
              mat.wireframe = !mat.wireframe;
            });
          } else {
            object.material.wireframe = !object.material.wireframe;
          }
        }
      });
      
      logStorage.add('info', 'Wireframe mode toggled');
    },
    
    takeScreenshot: function() {
      // Access renderer from QuantumSim or window
      const renderer = window.QuantumSim?.renderer?.renderer || window.renderer;
      
      if (!renderer) {
        logStorage.add('error', 'Cannot take screenshot: Renderer not found');
        return;
      }
      
      try {
        const dataURL = renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'quantum-visual-' + new Date().toISOString().split('T')[0] + '.png';
        link.click();
        logStorage.add('info', 'Screenshot saved');
      } catch (e) {
        logStorage.add('error', 'Screenshot error: ' + e.message);
      }
    }
  };
  
  // Enhanced console methods
  console.log = function() {
    const args = Array.from(arguments);
    const message = args.join(' ');
    originalConsole.log.apply(console, [`[${new Date().toISOString().substr(11, 8)}]`, ...args]);
    logStorage.add('log', message);
  };
  
  console.warn = function() {
    const args = Array.from(arguments);
    const message = args.join(' ');
    originalConsole.warn.apply(console, [`[${new Date().toISOString().substr(11, 8)}] ⚠️`, ...args]);
    logStorage.add('warn', message);
  };
  
  console.error = function() {
    const args = Array.from(arguments);
    const message = args.join(' ');
    originalConsole.error.apply(console, [`[${new Date().toISOString().substr(11, 8)}] 🔴`, ...args]);
    logStorage.add('error', message);
  };
  
  console.info = function() {
    const args = Array.from(arguments);
    const message = args.join(' ');
    originalConsole.info.apply(console, [`[${new Date().toISOString().substr(11, 8)}] ℹ️`, ...args]);
    logStorage.add('info', message);
  };
  
  // Initialization function for debugging utilities
  function initDebugTools() {
    console.info('Initializing enhanced debug tools...');
    
    // Add keypress listener for debug panel toggle
    document.addEventListener('keydown', function(e) {
      // Ctrl+Shift+D to toggle debug panel
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        debugPanel.toggle();
        e.preventDefault();
      }
    });
    
    // Initialize debug panel
    window.addEventListener('load', function() {
      debugPanel.init();
      performanceMonitor.start();
    });
    
    // Add global error handler
    window.addEventListener('error', function(e) {
      console.error('Global error:', e.message, 'at', e.filename, 'line', e.lineno);
      logStorage.add('globalError', `${e.message} at ${e.filename}:${e.lineno}`);
    });
    
    // Report browser and system info
    const browserInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      webGL: detectWebGLSupport()
    };
    
    console.info('Browser info:', JSON.stringify(browserInfo, null, 2));
  }
  
  // Detect WebGL support and capabilities
  function detectWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return { supported: false };
      }
      
      const info = {
        supported: true,
        version: gl.getParameter(gl.VERSION),
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
      };
      
      return info;
    } catch (e) {
      return { supported: false, error: e.message };
    }
  }
  
  // Export debugging utilities to global scope
  global.QuantumDebug = {
    logStorage,
    performanceMonitor,
    debugPanel,
    
    // Helper methods
    checkInitializationStatus: function() {
      const report = {
        threejs: typeof THREE !== 'undefined',
        quantumSim: typeof QuantumSim !== 'undefined',
        scene: false,
        camera: false,
        renderer: false,
        controls: false,
        initEventListeners: false,
        params: false,
        missingDOMElements: []
      };
      
      // Check QuantumSim objects
      if (window.QuantumSim) {
        report.scene = !!QuantumSim.sceneObjects.scene;
        report.camera = !!QuantumSim.camera.camera;
        report.renderer = !!QuantumSim.renderer.renderer;
        report.controls = !!QuantumSim.controls.controls;
      }
      
      // Check global objects (fallback)
      if (window.scene) report.scene = true;
      if (window.camera) report.camera = true;
      if (window.renderer) report.renderer = true;
      if (window.controls) report.controls = true;
      
      // Check for critical DOM elements
      const criticalElements = [
        'loadingContainer', 'canvasContainer', 'gui',
        'resetCamera', 'cam-wave', 'cam-particle', 'cam-artistic',
        'cam-topdown', 'cam-follow', 'closeInfoModal'
      ];
      
      criticalElements.forEach(id => {
        if (!document.getElementById(id)) {
          report.missingDOMElements.push(id);
        }
      });
      
      console.log('Initialization Status Report:', report);
      return report;
    },
    
    showError: function(message, fatal = false) {
      const errorDisplay = document.createElement('div');
      errorDisplay.style.position = 'fixed';
      errorDisplay.style.bottom = '10px';
      errorDisplay.style.right = '10px';
      errorDisplay.style.backgroundColor = fatal ? 'rgba(255, 0, 0, 0.85)' : 'rgba(255, 150, 0, 0.85)';
      errorDisplay.style.color = 'white';
      errorDisplay.style.padding = '10px 15px';
      errorDisplay.style.borderRadius = '5px';
      errorDisplay.style.zIndex = '9999';
      errorDisplay.style.maxWidth = '80%';
      errorDisplay.style.wordBreak = 'break-word';
      errorDisplay.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
      errorDisplay.style.fontSize = '14px';
      errorDisplay.innerHTML = fatal ? `<strong>Error:</strong> ${message}` : message;
      
      document.body.appendChild(errorDisplay);
      
      // Auto-remove after 8 seconds if not fatal
      if (!fatal) {
        setTimeout(() => {
          document.body.removeChild(errorDisplay);
        }, 8000);
      }
    }
  };
  
  // Auto-initialize debugging tools
  initDebugTools();
  
})(window);
