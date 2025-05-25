// Main render and animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  if (controls) {
    controls.update();
  }
  
  // Update camera position for smooth transitions
  updateCameraPosition();
  
  // Update time-dependent visuals
  const time = Date.now() * 0.001;
  
  // Update wave visualization if active
  if (params.mode === 'Wave' && screenMesh && screenMesh.material && screenMesh.material.uniforms) {
    updateWaveVisualization(time);
  }
  
  // Update post-processing if enabled
  if (composer && params.enablePostFX) {
    composer.render();
  } else if (renderer) {
    renderer.render(scene, camera);
  }
}

// The initialization is handled in script.js
// This just ensures animate() is called if it hasn't been already
if (window.initialized && typeof animate === 'function') {
  // Make sure animation is running
  if (!window.initialized) {
    init();
    window.initialized = true;
  }
};
