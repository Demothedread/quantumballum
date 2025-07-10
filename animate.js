// Main render and animation loop with error handling
function animate() {
  requestAnimationFrame(animate);
  
  try {
    // Update controls
    if (controls) {
      controls.update();
    }
    
    // Update camera position for smooth transitions
    if (typeof updateCameraPosition === 'function') {
      updateCameraPosition();
    }
    
    // Update time-dependent visuals
    const time = Date.now() * 0.001;
    
    // Update wave visualization if active
    if (params && params.mode === 'Wave' && screenMesh && screenMesh.material && screenMesh.material.uniforms) {
      if (typeof updateWaveVisualization === 'function') {
        updateWaveVisualization(time);
      }
    }
    
    // Update post-processing if enabled
    if (params && params.enablePostFX && composer) {
      composer.render();
    } else if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
    
    // Run any custom animation frames if they exist
    if (window.customAnimationFrames && Array.isArray(window.customAnimationFrames)) {
      window.customAnimationFrames.forEach(fn => {
        if (typeof fn === 'function') {
          try {
            fn(time);
          } catch (e) {
            console.warn("Error in custom animation frame:", e);
          }
        }
      });
    }
  } catch (error) {
    // Log errors but don't stop the animation loop
    console.error("Error in animation loop:", error);
  }
}

// The initialization is handled in script.js
// This file contains the animation loop function with error handling
// Animation will be started from init() in script.js
console.log("Enhanced animation loop function defined and ready to use.");

// Add a fallback renderer in case the main script fails
window.startFallbackRenderer = function() {
  if (!window.renderer || !window.scene || !window.camera) {
    console.warn("Using fallback renderer since main initialization failed");
    
    // Create minimal scene
    window.scene = window.scene || new THREE.Scene();
    window.camera = window.camera || new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
    window.camera.position.z = 5;
    
    // Create renderer if it doesn't exist
    if (!window.renderer) {
      window.renderer = new THREE.WebGLRenderer({antialias: true});
      window.renderer.setSize(window.innerWidth, window.innerHeight);
      const container = document.querySelector('.canvas-container') || document.body;
      container.appendChild(window.renderer.domElement);
    }
    
    // Create a simple cube to show something is working
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true});
    const cube = new THREE.Mesh(geometry, material);
    window.scene.add(cube);
    
    // Hide loading screen
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }
    
    // Simple animation function
    function fallbackAnimate() {
      requestAnimationFrame(fallbackAnimate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      window.renderer.render(window.scene, window.camera);
    }
    
    fallbackAnimate();
  }
};
