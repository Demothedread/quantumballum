// Enhanced initialization function to replace or extend the init() function in script.js
function enhancedInit() {
  // Prevent double initialization
  if (window.initialized) return;
  window.initialized = true;
  console.log("Initializing quantum simulation with enhanced error handling...");
  
  try {
    // Show loading screen
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.style.display = 'flex';
    }
    
    // Create scene with enhanced fog and environment
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a1a22, 0.02);
    
    // Camera with enhanced field of view
    camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 10);
    
    // High quality renderer with post-processing capabilities
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.querySelector('.canvas-container').appendChild(renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      if (composer) composer.setSize(innerWidth, innerHeight);
    });
    
    // Set up post-processing for advanced visual effects
    setupPostProcessing();
    
    // Enhanced lighting for neo-deco-rococo aesthetics
    // Ambient light for base illumination
    scene.add(new THREE.AmbientLight(0x334455, 0.5));
    
    // Main directional light with carnival colors
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.7);
    mainLight.position.set(5, 5, 10);
    mainLight.castShadow = true;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 25;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);
    
    // Continue with the rest of the initialization process...
    // Add all the necessary scene elements, GUI, etc.
    
    // Initialize event listeners for camera and UI controls
    initEventListeners();
    
    // Set up animation loop with proper error handling
    setTimeout(() => {
      try {
        if (typeof animate === 'function') {
          console.log("Starting animation loop...");
          animate();
        } else {
          console.warn("Animation function not found. Using basic renderer.");
          // Create a simple fallback animation loop
          function basicAnimate() {
            requestAnimationFrame(basicAnimate);
            if (controls) controls.update();
            if (renderer && scene && camera) {
              renderer.render(scene, camera);
            }
          }
          basicAnimate();
        }
      } catch (e) {
        console.error("Animation error:", e);
      }
      
      // Hide loading screen
      if (loadingContainer) {
        loadingContainer.style.display = 'none';
        console.log("Initialization complete, loading screen hidden.");
      }
    }, 300);
    
  } catch (error) {
    console.error("Fatal initialization error:", error);
    
    // Display error message
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      const loadingText = loadingContainer.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = 'Error initializing: ' + error.message;
        loadingText.style.color = '#ff3366';
      }
    }
  }
}

// Helper function to safely initialize the application
function safelyInitializeApp() {
  console.log("Safely initializing application...");
  
  // Check if THREE.js is loaded
  if (typeof THREE === 'undefined') {
    console.error("THREE.js not found. Loading from fallback source...");
    
    // Create script element to load THREE.js
    const threeScript = document.createElement('script');
    threeScript.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r152/three.min.js";
    threeScript.onload = () => {
      console.log("THREE.js loaded from fallback source");
      enhancedInit();
    };
    threeScript.onerror = (e) => {
      console.error("Failed to load THREE.js from fallback source:", e);
      document.getElementById('loadingContainer').querySelector('.loading-text').textContent = 
        "Failed to load THREE.js. Please check your internet connection.";
    };
    document.head.appendChild(threeScript);
  } else {
    console.log("THREE.js already loaded, initializing now...");
    enhancedInit();
  }
}

// Use this function to initialize the application
// safelyInitializeApp();

// Alternatively, replace the existing init() function:
// window.init = enhancedInit;

// Add this to the end of the init function in script.js

// Initialize event listeners for camera controls and UI
initEventListeners();

// Hide loading screen once everything is initialized
document.getElementById('loadingContainer').style.display = 'none';
