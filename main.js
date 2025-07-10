/**
 * Quantum Visual Simulator - Main Entry Point
 * This file serves as the entry point for the application,
 * initializing the QuantumSim module and managing global event listeners.
 */

// Global initialization
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, preparing to initialize Quantum Visual Simulator...");
  
  // Show loading screen
  const loadingContainer = document.getElementById('loadingContainer');
  if (loadingContainer) {
    loadingContainer.style.display = 'flex';
  }
  
  // Global error handler
  window.addEventListener('error', function(event) {
    console.error('Application error:', event.error || event.message);
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      const loadingText = loadingContainer.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = 'Error initializing: ' + (event.error?.message || event.message);
        loadingText.style.color = '#ff3366';
      }
    }
    
    // Try to invoke fallback renderer
    if (typeof window.startFallbackRenderer === 'function') {
      window.startFallbackRenderer();
    }
  });
  
  // Safety timeout mechanism
  window.setTimeout(function() {
    // Check if QuantumSim was properly initialized
    if (window.QuantumSim && !window.QuantumSim._initialized) {
      console.log("QuantumSim initialization timeout - starting manually");
      window.QuantumSim.init();
    }
    
    // Hide loading screen after timeout if it's still visible
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer && loadingContainer.style.display !== 'none') {
      console.warn("Loading screen still visible after timeout - hiding it now");
      loadingContainer.style.display = 'none';
    }
  }, 3000);
  
  // Handle responsive design and mobile
  setupResponsiveFeatures();
});

// Initialize the simulation when the page is fully loaded
window.addEventListener('load', function() {
  if (window.QuantumSim) {
    console.log("Window loaded, initializing QuantumSim...");
    window.QuantumSim.init();
  } else {
    console.error("QuantumSim module not found!");
  }
});

/**
 * Set up responsive design features and mobile optimizations
 */
function setupResponsiveFeatures() {
  // Detect mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    console.log("Mobile device detected, applying touch optimizations");
    document.body.classList.add('mobile-device');
    
    // Add touch support for camera controls
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }
  
  // Handle window resizing
  window.addEventListener('resize', function() {
    if (window.QuantumSim) {
      window.QuantumSim.handleResize();
    }
  });
}

// Touch event variables
let touchStartX = 0;
let touchStartY = 0;
let touchMoveX = 0;
let touchMoveY = 0;

/**
 * Handle touch start events for camera control
 */
function handleTouchStart(event) {
  if (event.touches.length === 1) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }
}

/**
 * Handle touch move events for camera control
 */
function handleTouchMove(event) {
  if (event.touches.length === 1) {
    touchMoveX = event.touches[0].clientX;
    touchMoveY = event.touches[0].clientY;
    
    // Calculate delta
    const deltaX = touchMoveX - touchStartX;
    const deltaY = touchMoveY - touchStartY;
    
    // Apply camera rotation if QuantumSim is available
    if (window.QuantumSim && window.QuantumSim.camera && window.QuantumSim.camera.handleTouch) {
      window.QuantumSim.camera.handleTouch(deltaX, deltaY);
    }
    
    // Update start position for next move
    touchStartX = touchMoveX;
    touchStartY = touchMoveY;
  }
}

/**
 * Handle touch end events
 */
function handleTouchEnd() {
  // Reset touch positions
  touchStartX = 0;
  touchStartY = 0;
  touchMoveX = 0;
  touchMoveY = 0;
}
