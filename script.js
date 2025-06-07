/* ————————————— Globals & Params ————————————— */
let scene, camera, renderer, controls, gui;
let barrierGroup, screenMesh, source, markerGroup;
let waveTimer, particleTimer, rwTimer, tick=0;
let composer, bloomPass; // Post-processing components

/* ————————————— Enhanced Camera System ————————————— */

// Camera preset positions
const cameraPresets = { 
  // Default position
  default: {
    position: new THREE.Vector3(0, 0, 5),
    target: new THREE.Vector3(0, 0, 0),
    duration: 1.5
  },
      // Wave mode - top down view to see interference pattern
      wave: {
        position: new THREE.Vector3(0, 3, 3),
        target: new THREE.Vector3(0, 0, 0),
        duration: 2.0
      },
      // Wave mode - artistic angled view
      waveArtistic: {
        position: new THREE.Vector3(3, 2.5, 4),
        target: new THREE.Vector3(0, -0.5, 0),
        duration: 2.3
      },
      // Wave mode - close-up view to see detailed wave patterns
      waveDetail: {
        position: new THREE.Vector3(1, 1.2, 3),
        target: new THREE.Vector3(0, 0, 0),
        duration: 1.8
      },
      // Particle mode - side view to see particle trajectories
      particle: {
        position: new THREE.Vector3(2, 1, 4),
        target: new THREE.Vector3(0, 0, 0),
        duration: 1.8
      },
      // Particle mode - dramatic low angle for particle flights
      particleDramatic: {
        position: new THREE.Vector3(1.5, 0.5, 6),
        target: new THREE.Vector3(0, 0.3, 0),
        duration: 2.2
      },
      // Particle mode - top down for pattern building
      particlePattern: {
        position: new THREE.Vector3(0, 4, 2),
        target: new THREE.Vector3(0, 0, 2),
        duration: 2.0
      },
      // Pachinko mode - angled view to see full pegs grid
      pachinko: {
        position: new THREE.Vector3(0, 1.5, 4),
        target: new THREE.Vector3(0, -0.5, 0),
        duration: 1.8
      },
      // Pachinko mode - side view for maximizing ball trajectory visibility
      pachinkoSide: {
        position: new THREE.Vector3(4, 0, 3),
        target: new THREE.Vector3(0, -0.5, 0),
        duration: 2.0
      },
      // Pachinko mode - close to pegs for detailed view
      pachinkoPegs: {
        position: new THREE.Vector3(1, -0.5, 3),
        target: new THREE.Vector3(0, -1, 0),
        duration: 1.7
      },
      // Slit close-up view - for all modes
      slits: {
        position: new THREE.Vector3(-1.5, 0, 2),
        target: new THREE.Vector3(-1, 0, 0),
        duration: 1.5
      },
      // Top-down view for interference pattern
      topdown: {
        position: new THREE.Vector3(0, 5, 0.1),
        target: new THREE.Vector3(0, 0, 0),
        duration: 2.2
      },
      // Artistic view for screenshots and cinematic moments
      artistic: {
        position: new THREE.Vector3(3, 2, 4),
        target: new THREE.Vector3(0, 0, 0),
        duration: 2.5
      },
      // Dramatic low angle - neo-deco-rococo inspired
      dramatic: {
        position: new THREE.Vector3(2, -1, 5),
        target: new THREE.Vector3(0, 0.5, 0),
        duration: 2.7
      },
      // Cinematic orbit position - constantly moving
      cinematicOrbit: {
        position: new THREE.Vector3(4, 2, 4),
        target: new THREE.Vector3(0, 0, 0),
        duration: 3.0,
        orbit: true // Special flag for orbiting cameras
      }
    };
    
    // Current camera transition data
    let cameraTransition = {
      active: false,
      startPosition: null,
      endPosition: null,
      startTarget: null,
      endTarget: null,
      startTime: 0,
      duration: 0,
      onComplete: null,
      easing: 'easeInOutCubic' // Default easing function
    };
    
    // Camera parameters for enhanced follow mode
    let cameraFollowData = {
      active: false,
      target: null,
      offset: new THREE.Vector3(0, 0.5, 2),
      damping: 0.08,  // Smoother tracking
      lookAhead: 1.0, // Look ahead factor
      enabled: false,
      offsetVariation: 0.0 // For artistic variation in follow camera
    };
    
    // Move camera to a preset position with smooth transition
    function moveCamera(presetName, onComplete = null) {
      if (!camera || !cameraPresets[presetName]) return;
      
      const preset = cameraPresets[presetName];
      
      // Store current camera position and target for interpolation
      cameraTransition = {
        active: true,
        startPosition: camera.position.clone(),
        endPosition: preset.position.clone(),
        startTarget: controls ? controls.target.clone() : new THREE.Vector3(0, 0, 0),
        endTarget: preset.target.clone(),
        startTime: Date.now(),
        duration: preset.duration * 1000, // Convert to milliseconds
        onComplete: onComplete,
        easing: preset.easing || 'easeInOutCubic',
        orbit: preset.orbit || false
      };
      
      // Disable camera follow mode during transition
      cameraFollowData.active = false;
      
      // Add neo-deco-rococo transition effect
      if (params.carnivalTheme) {
        createCameraTransitionEffect(preset.duration);
      }
      
      // Update camera controls UI to reflect current preset
      updateCameraControlsUI(presetName);
    }
    
    // Update camera position during animation frame
    function updateCameraPosition() {
      // Handle active camera transition
      if (cameraTransition.active) {
        // Calculate transition progress
        const elapsed = Date.now() - cameraTransition.startTime;
        let progress = Math.min(elapsed / cameraTransition.duration, 1.0);
        
        // Apply easing for smoother motion
        progress = applyEasing(progress, cameraTransition.easing);
        
        // Interpolate camera position
        camera.position.lerpVectors(
          cameraTransition.startPosition,
          cameraTransition.endPosition,
          progress
        );
        
        // Interpolate target position if controls exist
        if (controls) {
          controls.target.lerpVectors(
            cameraTransition.startTarget,
            cameraTransition.endTarget,
            progress
          );
          controls.update();
        }
        
        // Check if transition complete
        if (progress >= 1.0) {
          cameraTransition.active = false;
          
          // If it's an orbiting camera, set up continuous orbit
          if (cameraTransition.orbit) {
            setupCinematicOrbit();
          }
          
          // Execute completion callback if provided
          if (cameraTransition.onComplete) cameraTransition.onComplete();
        }
      } 
      // Handle cinematic orbit (continuous camera movement)
      else if (params.animateCamera && params.mode === 'Wave' && !cameraFollowData.active) {
        // Apply subtle orbital motion for wave mode to showcase interference patterns
        const time = Date.now() * 0.0001;
        const orbitRadius = 4;
        const orbitHeight = 2 + Math.sin(time * 0.5) * 0.5;
        
        // Move in an elliptical orbit
        const newX = Math.sin(time) * orbitRadius;
        const newZ = Math.cos(time) * orbitRadius;
        
        // Apply very subtle camera movement
        camera.position.lerp(new THREE.Vector3(newX, orbitHeight, newZ), 0.001);
        controls.update();
      }
      // Handle follow camera mode
      else if (cameraFollowData.active && cameraFollowData.target) {
        // Get target position
        const targetPosition = cameraFollowData.target.position || 
                               cameraFollowData.target.mesh?.position;
        
        if (targetPosition) {
          // Get target velocity if available for look-ahead
          const targetVelocity = cameraFollowData.target.velocity || 
                                 new THREE.Vector3(0, 0, 0);
          
          // Look ahead based on velocity
          const lookAheadPos = targetPosition.clone().add(
            targetVelocity.clone().multiplyScalar(cameraFollowData.lookAhead)
          );
          
          // Add artistic variation to follow position
          const time = Date.now() * 0.001;
          const variation = cameraFollowData.offsetVariation;
          
          // Adjust offset with artistic variation for neo-deco-rococo dynamism
          const dynamicOffset = cameraFollowData.offset.clone();
          
          // Add subtle motion to offset for more artistic camera work
          if (variation > 0) {
            dynamicOffset.x += Math.sin(time * 0.7) * variation;
            dynamicOffset.y += Math.sin(time * 0.5) * variation * 0.5;
            dynamicOffset.z += Math.sin(time * 0.3) * variation * 0.3;
          }
          
          // Calculate desired camera position with dynamic offset
          const desiredPosition = lookAheadPos.clone().add(dynamicOffset);
          
          // Apply damping for smoother following
          camera.position.lerp(desiredPosition, cameraFollowData.damping);
          
          // Set controls target to focus on followed object
          if (controls) {
            controls.target.lerp(targetPosition, cameraFollowData.damping * 1.2);
            controls.update();
          }
        }
      }
    }
    
    // Set up continuous cinematic orbit
    function setupCinematicOrbit() {
      // This is called after a cinematicOrbit transition completes
      // The main updateCameraPosition function will handle the actual orbiting
      params.animateCamera = true;
    }
    
    // Toggle camera follow mode for a target object with enhanced options
    function setCameraFollowTarget(target, options = {}) {
      if (!target) {
        cameraFollowData.active = false;
        cameraFollowData.target = null;
        return;
      }
      
      // Set follow mode parameters
      cameraFollowData.active = true;
      cameraFollowData.target = target;
      cameraFollowData.enabled = true;
      
      // Apply custom options if provided
      if (options.offset) cameraFollowData.offset = options.offset.clone();
      if (options.damping !== undefined) cameraFollowData.damping = options.damping;
      if (options.lookAhead !== undefined) cameraFollowData.lookAhead = options.lookAhead;
      if (options.variation !== undefined) cameraFollowData.offsetVariation = options.variation;
      
      // Disable controls while in follow mode
      if (controls) controls.enabled = false;
      
      // Add transition effect if enabled
      if (params.carnivalTheme) {
        createCameraTransitionEffect(0.8);
      }
      
      // Update UI to reflect follow mode
      updateCameraControlsUI('follow');
    }
    
    // Cycle through camera presets for the current mode
    function cycleModePresets() {
      const mode = params.mode.toLowerCase();
      let presets = [];
      
      // Collect presets for the current mode
      switch(mode) {
        case 'wave':
          presets = ['wave', 'waveArtistic', 'waveDetail', 'topdown'];
          break;
        case 'particle':
          presets = ['particle', 'particleDramatic', 'particlePattern', 'slits'];
          break;
        case 'pachinko':
          presets = ['pachinko', 'pachinkoSide', 'pachinkoPegs', 'dramatic'];
          break;
      }
      
      // Find current preset or start with first
      let nextIndex = 0;
      
      // Try to find current preset to get the next one
      for (let i = 0; i < presets.length; i++) {
        if (currentPreset === presets[i]) {
          nextIndex = (i + 1) % presets.length;
          break;
        }
      }
      
      // Move camera to next preset
      currentPreset = presets[nextIndex];
      moveCamera(currentPreset);
    }
    
    // Create a temporary visual effect for camera transition - enhanced for neo-deco-rococo
    function createCameraTransitionEffect(duration) {
      // Create an Art Deco styled transition effect overlay
      const overlay = document.createElement('div');
      overlay.className = 'camera-transition-overlay';
      document.body.appendChild(overlay);
      
      // Apply Neo-Deco-Rococo styling
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: 
          radial-gradient(circle at center, transparent 0%, rgba(26, 26, 34, 0.2) 50%, rgba(26, 26, 34, 0.5) 100%),
          url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,0 L60,40 L100,50 L60,60 L50,100 L40,60 L0,50 L40,40 Z" fill="%2300ffcc" opacity="0.15"/></svg>'),
          url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="%23ff00aa" stroke-width="2" fill="none" opacity="0.1"/><circle cx="50" cy="50" r="30" stroke="%23ffcc00" stroke-width="2" fill="none" opacity="0.1"/><circle cx="50" cy="50" r="20" stroke="%2300ccff" stroke-width="2" fill="none" opacity="0.1"/></svg>');
        background-size: cover, 100px 100px, 200px 200px;
        background-position: center, center, center;
        pointer-events: none;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
        mix-blend-mode: screen;
      `;
      
      // Animate in
      setTimeout(() => { overlay.style.opacity = "1"; }, 10);
      
      // Animate out and remove
      setTimeout(() => { 
        overlay.style.opacity = "0"; 
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      }, duration * 700); // Remove before transition completes
    }
    
    // Various easing functions for camera movement
    function applyEasing(t, easingType) {
      switch (easingType) {
        case 'easeInOutCubic':
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        case 'easeOutQuart':
          return 1 - Math.pow(1 - t, 4);
        
        case 'easeInOutExpo':
          return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
        
        case 'elasticOut':
          const c4 = (2 * Math.PI) / 3;
          return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        
        default: // Linear as fallback
          return t;
      }
    }
    
    // Update UI to reflect current camera preset
    function updateCameraControlsUI(presetName) {
      // Track current preset globally
      window.currentPreset = presetName;
      
      // Update UI if elements exist
      const buttons = document.querySelectorAll('.camera-preset-btn');
      buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.preset === presetName) {
          btn.classList.add('active');
        }
      });
      
      // Update follow mode button if it exists
      const followButton = document.getElementById('cam-follow');
      if (followButton) {
        followButton.classList.toggle('active', presetName === 'follow');
      }
    }
    
    // Get a camera preset specifically designed for the current simulation mode
    function getModeCameraPreset(variation = 'default') {
      const mode = params.mode.toLowerCase();
      
      // Map variation to specific preset
      if (mode === 'wave') {
        if (variation === 'artistic') return 'waveArtistic';
        if (variation === 'detail') return 'waveDetail';
        return 'wave';
      } 
      else if (mode === 'particle') {
        if (variation === 'dramatic') return 'particleDramatic';
        if (variation === 'pattern') return 'particlePattern';
        return 'particle';
      }
      else if (mode === 'pachinko') {
        return 'pachinko';
      }
      
      return 'default';
    }
    
// ————————————— Setup and Initialize Scene —————————————
function init() {
  // Prevent double initialization
  if (window.initialized) return;
  window.initialized = true;
  console.log("Initializing quantum simulation...");
  
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
    
    // Accent lights for neo-deco-rococo effect
    const topLight = new THREE.PointLight(0x00ffcc, 0.4, 15);
    topLight.position.set(0, 5, 2);
    scene.add(topLight);
    
    const leftLight = new THREE.PointLight(0xff00aa, 0.4, 15);
    leftLight.position.set(-5, 0, 2);
    scene.add(leftLight);
    
    const rightLight = new THREE.PointLight(0xffcc00, 0.4, 15);
    rightLight.position.set(5, 0, 2);
    scene.add(rightLight);
    
    // Add volumetric light beams for slit visualization
    addVolumetricLights();
    
    // Enhanced controls with damping for smoother interaction
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7;
    controls.maxDistance = 20;
    
    // Set up camera presets
    setupCameraPresets();
    
    // Source with neo-deco-rococo styling
    const srcGeom = new THREE.SphereGeometry(0.15, 32, 32); // Increased segments for smoother look
    const srcMat = new THREE.MeshStandardMaterial({
      color: params.carnivalTheme ? 0xff3366 : 0xff0000,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    source = new THREE.Mesh(srcGeom, srcMat);
    source.position.set(0, 0, -4);
    source.castShadow = true;
    
    // Add decorative ring around source (Art Deco element)
    const ringGeom = new THREE.TorusGeometry(0.25, 0.03, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xffaa00,
      emissiveIntensity: 0.2
    });
    const sourceRing = new THREE.Mesh(ringGeom, ringMat);
    sourceRing.rotation.x = Math.PI / 2;
    source.add(sourceRing);
    
    // Add a glow effect (Neo element)
    const glowGeom = new THREE.SphereGeometry(0.2, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff3366,
      transparent: true,
      opacity: 0.15
    });
    const sourceGlow = new THREE.Mesh(glowGeom, glowMat);
    sourceGlow.scale.multiplyScalar(2.0);
    source.add(sourceGlow);
    
    // Add particle emitter effect to source
    addSourceParticleEffect(source);
    
    scene.add(source);
    
    // Add decorative elements to the scene (Rococo flourishes)
    if (params.carnivalTheme) {
      // Add decorative corner elements
      addDecorativeElements();
    }

    // Barrier group with enhanced materials
    barrierGroup = new THREE.Group();
    scene.add(barrierGroup);
    rebuildBarrier();

    // Screen with enhanced materials
    const geom = new THREE.PlaneBufferGeometry(width, height, seg, seg);
    
    // Neo-deco-rococo styled screen material with environment map
    const mat = new THREE.MeshPhysicalMaterial({
      color: params.carnivalTheme ? 0xaaccff : 0xddddff,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      metalness: 0.2,
      roughness: 0.8,
      reflectivity: 0.3,
      clearcoat: 0.2,
      clearcoatRoughness: 0.3
    });
    
    screenMesh = new THREE.Mesh(geom, mat);
    screenMesh.rotation.y = Math.PI;
    screenMesh.position.set(0, 0, screenZ);
    screenMesh.receiveShadow = true;
    scene.add(screenMesh);
    
    // Add environment cubemap for reflections
    new THREE.CubeTextureLoader()
      .setPath('https://threejs.org/examples/textures/cube/pisa/')
      .load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'], function (cubeTexture) {
        cubeTexture.encoding = THREE.sRGBEncoding;
        scene.background = null;
        scene.environment = cubeTexture;
        if (screenMesh.material) {
          screenMesh.material.envMap = cubeTexture;
          screenMesh.material.envMapIntensity = 0.4;
          screenMesh.material.needsUpdate = true;
        }
      });
    
    // Add decorative frame around screen (Art Deco element)
    addScreenFrame(width, height, screenZ);

    // Marker group for particles with enhanced visuals
    markerGroup = new THREE.Group();
    scene.add(markerGroup);

    // GUI with neo-deco-rococo styling
    gui = new dat.GUI({autoPlace:false});
    document.getElementById('gui').appendChild(gui.domElement);
    
    // Create GUI folders for better organization
    const setupFolder = gui.addFolder('Quantum Setup');
    setupFolder.add(params,'slits', {One:1,Two:2}).name('Slits').onChange(rebuildBarrier);
    setupFolder.add(params,'mode', ['Wave','Particle','Pachinko']).name('Mode').onChange(resetAll);
    setupFolder.add(params,'electrons',100,10000).step(100).name('Electrons');
    setupFolder.add(params,'roundDuration',5,60).step(5).name('Round Duration');
    setupFolder.open();
    
    const pachinkoFolder = gui.addFolder('Pachinko Physics');
    pachinkoFolder.add(params,'pegRows',8,20).step(1).name('Peg Rows');
    pachinkoFolder.add(params,'binCount',5,20).step(1).name('Bins');
    pachinkoFolder.add(params,'gravityStrength',0,20).step(0.1).name('Gravity');
    pachinkoFolder.add(params,'quantumUncertainty',0,0.01).step(0.0001).name('Quantum σ');
    pachinkoFolder.add(params,'relativistic').name('Relativistic Effects');
    
    const visualFolder = gui.addFolder('Visualization');
    visualFolder.add(params,'showTrails').name('Show Trails').onChange(() => {
      // Update trails with enhanced visual effects when enabled
      if (params.showTrails && params.carnivalTheme) {
        activeBalls.forEach(ball => {
          if (ball.trailMesh) {
            // Update trail material with neo-deco-rococo styling
            ball.trailMesh.material.opacity = 0.7;
            ball.trailMesh.material.color.setHex(ball.getColorFromProbability());
          }
        });
      }
    });
    visualFolder.add(params,'colorByProbability').name('Color by Probability');
    
    // Add advanced visual controls
    const effectsFolder = gui.addFolder('Visual Effects');
    effectsFolder.add(params, 'enablePostFX').name('Post-Processing').onChange(togglePostProcessing);
    effectsFolder.add(params, 'bloomIntensity', 0, 2).step(0.05).name('Bloom Strength').onChange(updatePostProcessing);
    effectsFolder.add(params, 'showParticleGlow').name('Particle Glow');
    effectsFolder.add(params, 'animateCamera').name('Cinematic Camera');
    
    // Add theme toggle with immediate visual update
    visualFolder.add(params,'carnivalTheme').name('Neo-Deco Theme').onChange(() => {
      // Update visuals when theme is toggled
      rebuildBarrier();
      
      // Update source styling
      if (source && source.material) {
        source.material.color.setHex(params.carnivalTheme ? 0xff3366 : 0xff0000);
        source.material.emissiveIntensity = params.carnivalTheme ? 0.5 : 0.2;
      }
      
      // Update screen styling
      if (screenMesh && screenMesh.material) {
        screenMesh.material.color.setHex(params.carnivalTheme ? 0xaaccff : 0xddddff);
        screenMesh.material.emissive.setHex(params.carnivalTheme ? 0x0033aa : 0x000000);
        screenMesh.material.emissiveIntensity = params.carnivalTheme ? 0.2 : 0;
      }
      
      // Update pegs
      pegGrid.forEach(peg => {
        if (peg.mesh && peg.mesh.material) {
          peg.mesh.material.color.setHex(params.carnivalTheme ? 0x3388ff : 0x888888);
          peg.mesh.material.emissive.setHex(params.carnivalTheme ? 0x001133 : 0x000000);
          peg.mesh.material.emissiveIntensity = params.carnivalTheme ? 0.2 : 0;
        }
      });
      
      // Update active balls
      activeBalls.forEach(ball => {
        if (ball.mesh && ball.mesh.material) {
          const baseColor = params.carnivalTheme ? 0x00ffaa : 0x00ff88;
          ball.mesh.material.color.setHex(baseColor);
          ball.mesh.material.emissive.setHex(params.carnivalTheme ? 0x002211 : 0x002200);
        }
      });
    });
    
    // Control buttons with neo-deco-rococo styling
    const controlsFolder = gui.addFolder('Controls');
    controlsFolder.add({Start:startAll}, 'Start').name('▶ Start Simulation');
    controlsFolder.add({Stop:stopAll}, 'Stop').name('⏹ Stop Simulation');
    controlsFolder.add(params,'reset').name('↺ Reset Simulation');
    
    // Open key folders by default
    controlsFolder.open();
    visualFolder.open();
    effectsFolder.open();
    
    // Style GUI with neo-deco-rococo CSS classes
    setTimeout(() => {
      // Apply custom styling to GUI elements
      const guiElement = document.querySelector('.dg.main');
      if (guiElement) {
        guiElement.classList.add('neo-deco-gui');
      }
    }, 100);
    
    // Initialize event listeners for camera and UI controls
    initEventListeners();
    
    // Try to add the GUI header with proper error handling
    try {
      const guiElement = document.querySelector('.dg.main');
      if (guiElement) {
        // Add neo-deco header
        const header = document.createElement('div');
        header.className = 'gui-header';
        header.innerHTML = 'CONTROL PANEL';
        guiElement.prepend(header);
      }
    } catch (e) {
      console.warn("Error adding GUI header:", e);
    }
    
    // Hide loading screen
    setTimeout(() => {
      const loadingContainer = document.getElementById('loadingContainer');
      if (loadingContainer) {
        loadingContainer.style.display = 'none';
        console.log("Initialization complete, loading screen hidden.");
      }
      
      // Set up main render loop with a delay to ensure everything is loaded
      console.log("Starting animation loop");
      animate();
    }, 100);
      }
      
      // Add pulsing effects to control buttons
      const controlButtons = document.querySelectorAll('.dg .cr.function .property-name');
      controlButtons.forEach(button => {
        const pulseEffect = () => {
          const intensity = 0.5 + 0.5 * Math.sin(Date.now() * 0.001 * 2);
          button.style.textShadow = `0 0 ${intensity * 5}px rgba(0, 255, 204, ${intensity * 0.8})`;
          requestAnimationFrame(pulseEffect);
        };
        pulseEffect();
      });
  
  // ————————————— Advanced Visual Effects —————————————
  
  // Setup post-processing effects
  function setupPostProcessing() {
    // Create composer for post-processing pipeline
    composer = new THREE.EffectComposer(renderer);
    
    // Main rendering pass
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Bloom pass for glowing effect
    bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      params.bloomIntensity,  // strength
      0.5,  // radius
      0.7   // threshold
    );
    composer.addPass(bloomPass);
    
    // Update bloom settings
    updatePostProcessing();
  }
  
  // Update post-processing settings
  function updatePostProcessing() {
    if (bloomPass) {
      bloomPass.strength = params.bloomIntensity;
      bloomPass.radius = 0.5;
      bloomPass.threshold = 0.7;
    }
  }
  
  // Toggle post-processing effects
  function togglePostProcessing() {
    if (params.enablePostFX) {
      // Enable bloom and other effects
      if (bloomPass) bloomPass.enabled = true;
    } else {
      // Disable effects
      if (bloomPass) bloomPass.enabled = false;
    }
  }
  
  // Add volumetric light beam effect for slits
  function addVolumetricLights() {
    // Create volumetric light beam group
    const volumetricGroup = new THREE.Group();
    scene.add(volumetricGroup);
    
    // We'll update this when barrier is built
    window.updateVolumetricLights = (slitCount, slitPositions) => {
      // Clear previous lights
      volumetricGroup.clear();
      
      if (!params.carnivalTheme) return;
      
      // Add a volumetric light for each slit
      slitPositions.forEach((slitPos, index) => {
        // Create light beam geometry
        const beamGeom = new THREE.CylinderGeometry(0.15, 0.4, 8, 16, 10, true);
        
        // Adjust UVs for better texture mapping
        const uvs = beamGeom.attributes.uv;
        for (let i = 0; i < uvs.count; i++) {
          const u = uvs.getX(i);
          const v = uvs.getY(i);
          // Map v coordinate from bottom to top for texture
          uvs.setXY(i, u, 1.0 - v);
        }
        
        // Create beam material
        const beamColor = index % 2 === 0 ? 0x00ffcc : 0xff00aa;
        
        const beamMat = new THREE.MeshBasicMaterial({
          color: beamColor,
          transparent: true,
          opacity: 0.1,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        
        const beam = new THREE.Mesh(beamGeom, beamMat);
        beam.position.set(slitPos.x, 0, slitPos.z || 0);
        beam.rotation.x = Math.PI / 2;
        
        volumetricGroup.add(beam);
        
        // Add animated glow effect
        animateVolumetricBeam(beam);
      });
    };
  }
  
  // Animate volumetric light beams
  function animateVolumetricBeam(beam) {
    const initialOpacity = beam.material.opacity;
    
    const animateBeam = () => {
      if (!beam || !beam.material) return;
      
      const time = Date.now() * 0.001;
      const pulseVal = Math.sin(time) * 0.5 + 0.5;
      
      beam.material.opacity = initialOpacity * (0.7 + 0.3 * pulseVal);
      
      // Continue animation if element exists
      if (beam.parent) requestAnimationFrame(animateBeam);
    };
    
    animateBeam();
  }
  
  // Add particle emitter to source
  function addSourceParticleEffect(source) {
    // Only add if carnival theme is active
    if (!params.carnivalTheme) return;
    
    // Create particle group
    const particleGroup = new THREE.Group();
    source.add(particleGroup);
    
    // Particle count
    const particleCount = 20;
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const size = 0.02 + Math.random() * 0.03;
      
      // Create particle geometry
      const particleGeom = new THREE.SphereGeometry(size, 8, 8);
      
      // Get random color from neon palette
      const colors = [0x00ffcc, 0xff00aa, 0xffcc00, 0x00ccff];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Create particle material
      const particleMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      });
      
      // Create particle mesh
      const particle = new THREE.Mesh(particleGeom, particleMat);
      
      // Random initial position within source radius
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 0.12 + Math.random() * 0.06;
      
      particle.position.x = r * Math.sin(phi) * Math.cos(theta);
      particle.position.y = r * Math.sin(phi) * Math.sin(theta);
      particle.position.z = r * Math.cos(phi);
      
      // Store animation data
      particle.userData = {
        speed: 0.01 + Math.random() * 0.01,
        direction: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        lifetime: 0,
        maxLife: 2 + Math.random() * 3
      };
      
      particleGroup.add(particle);
    }
    
    // Animate particles
    const animateParticles = () => {
      particleGroup.children.forEach((particle, index) => {
        // Update lifetime
        particle.userData.lifetime += 0.016;
        
        // Remove if expired
        if (particle.userData.lifetime >= particle.userData.maxLife) {
          // Reset particle
          particle.userData.lifetime = 0;
          
          // New position near origin
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const r = 0.12 + Math.random() * 0.03;
          
          particle.position.x = r * Math.sin(phi) * Math.cos(theta);
          particle.position.y = r * Math.sin(phi) * Math.sin(theta);
          particle.position.z = r * Math.cos(phi);
          
          // New direction
          particle.userData.direction = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ).normalize();
        }
        
        // Move particle
        particle.position.addScaledVector(
          particle.userData.direction, 
          particle.userData.speed
        );
        
        // Fade out based on lifetime
        const lifeRatio = particle.userData.lifetime / particle.userData.maxLife;
        particle.material.opacity = 0.7 * (1 - lifeRatio);
        
        // Scale down as particle ages
        const scale = 1 - lifeRatio * 0.5;
        particle.scale.set(scale, scale, scale);
      });
      
      // Continue animation if source exists
      if (source.parent) requestAnimationFrame(animateParticles);
    };
    
    // Start animation
    animateParticles();
  }
  
  // ————————————— Camera Control System —————————————
  
  // Setup camera position presets for different views
  function setupCameraPresets() {
    // Isometric view
    cameraTargets.iso = {
      position: new THREE.Vector3(5, 5, 10),
      target: new THREE.Vector3(0, 0, 0),
      transition: 1.0
    };
    
    // Top-down view
    cameraTargets.top = {
      position: new THREE.Vector3(0, 10, 0.1),
      target: new THREE.Vector3(0, 0, 0),
      transition: 1.0
    };
    
    // Side view
    cameraTargets.side = {
      position: new THREE.Vector3(10, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      transition: 1.0
    };
    
    // Wave mode optimized view
    cameraTargets.wave = {
      position: new THREE.Vector3(0, 3, 8),
      target: new THREE.Vector3(0, 0, screenZ),
      transition: 1.5
    };
    
    // Particle mode optimized view
    cameraTargets.particle = {
      position: new THREE.Vector3(3, 2, 8), 
      target: new THREE.Vector3(0, 0, screenZ),
      transition: 1.5
    };
    
    // Pachinko mode optimized view
    cameraTargets.pachinko = {
      position: new THREE.Vector3(0, 0, 12),
      target: new THREE.Vector3(0, 0, screenZ / 2),
      transition: 1.5
    };
  }
  
  // Use the moveCamera function defined earlier in the file
  
  // Toggle camera follow mode
  function toggleFollowMode(follow = null) {
    // Set follow mode based on parameter or toggle
    followMode = follow !== null ? follow : !followMode;
    
    // Update button appearance
    const followButton = document.getElementById('cam-follow');
    if (followButton) {
      followButton.style.backgroundColor = followMode ? 
        'rgba(0, 255, 204, 0.3)' : 'rgba(26, 26, 34, 0.5)';
    }
    
    // Reset follow target if disabling
    if (!followMode) {
      followTarget = null;
      controls.enabled = true;
    }
  }
  
// Initialize event listeners for camera controls
function initEventListeners() {
  try {
    // Camera control buttons
    const resetCameraBtn = document.getElementById('resetCamera');
    if (resetCameraBtn) resetCameraBtn.addEventListener('click', () => moveCamera('default'));
    
    const camWaveBtn = document.getElementById('cam-wave');
    if (camWaveBtn) camWaveBtn.addEventListener('click', () => moveCamera('wave'));
    
    const camParticleBtn = document.getElementById('cam-particle');
    if (camParticleBtn) camParticleBtn.addEventListener('click', () => moveCamera('particle'));
    
    const camArtisticBtn = document.getElementById('cam-artistic');
    if (camArtisticBtn) camArtisticBtn.addEventListener('click', () => moveCamera('artistic'));
    
    const camTopdownBtn = document.getElementById('cam-topdown');
    if (camTopdownBtn) camTopdownBtn.addEventListener('click', () => moveCamera('topdown'));
    
    const camFollowBtn = document.getElementById('cam-follow');
    if (camFollowBtn) camFollowBtn.addEventListener('click', () => toggleFollowMode());
    
    // Info button and modal
    const closeInfoModalBtn = document.getElementById('closeInfoModal');
    if (closeInfoModalBtn) closeInfoModalBtn.addEventListener('click', toggleInfoModal);
    
    const infoModalBg = document.getElementById('infoModalBg');
    if (infoModalBg) infoModalBg.addEventListener('click', toggleInfoModal);
    
    console.log("Event listeners initialized successfully");
  } catch (error) {
    console.error("Error initializing event listeners:", error);
  }
}
  
  // Toggle info modal visibility
  function toggleInfoModal() {
    const modal = document.getElementById('info-modal');
    const overlay = document.getElementById('modal-overlay');
    
    if (modal.classList.contains('visible')) {
      // Hide modal
      modal.classList.remove('visible');
      overlay.classList.remove('visible');
    } else {
      // Show modal
      modal.classList.add('visible');
      overlay.classList.add('visible');
    }
  }

  // ————————————— Build Barrier with Neo-Deco-Rococo Style —————————————
  function rebuildBarrier(){
    barrierGroup.clear();
    const barW = 0.2;
    const spacing = width/(params.slits+1);
    
    // Create a unified barrier base with Art Deco styling
    const barrierBase = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.4, height + 0.4, 0.05),
      new THREE.MeshStandardMaterial({
        color: params.carnivalTheme ? 0x335577 : 0x444444,
        metalness: 0.7,
        roughness: 0.3,
        transparent: true,
        opacity: 0.8
      })
    );
    barrierBase.position.set(0, 0, -0.03);
    barrierGroup.add(barrierBase);
    
    // Add Art Deco border to the barrier base
    const borderMat = new THREE.MeshStandardMaterial({
      color: params.carnivalTheme ? 0xd4af37 : 0x777777,
      metalness: 0.9, 
      roughness: 0.2,
      emissive: params.carnivalTheme ? 0xffcc00 : 0x000000,
      emissiveIntensity: 0.2
    });
    
    // Border frame - top, bottom, left, right
    const borderWidth = 0.08;
    const borderFrames = [
      new THREE.BoxGeometry(width + 0.4, borderWidth, 0.07), // top
      new THREE.BoxGeometry(width + 0.4, borderWidth, 0.07), // bottom
      new THREE.BoxGeometry(borderWidth, height, 0.07),      // left
      new THREE.BoxGeometry(borderWidth, height, 0.07)       // right
    ];
    
    const borderPositions = [
      [0, height/2 + borderWidth/2, -0.01],  // top
      [0, -height/2 - borderWidth/2, -0.01], // bottom
      [-width/2 - borderWidth/2, 0, -0.01],  // left
      [width/2 + borderWidth/2, 0, -0.01]    // right
    ];
    
    for (let i = 0; i < 4; i++) {
      const borderPart = new THREE.Mesh(borderFrames[i], borderMat);
      borderPart.position.set(
        borderPositions[i][0], 
        borderPositions[i][1], 
        borderPositions[i][2]
      );
      barrierGroup.add(borderPart);
    }
    
    // Collect slit positions for volumetric lights
    const slitPositions = [];
    
    // Create individual barrier bars with enhanced materials
    for(let i=0; i<params.slits+1; i++){
      // Art Deco styled bar with stepped design
      const barGroup = new THREE.Group();
      
      // Main bar with modern material
      const barMat = new THREE.MeshStandardMaterial({
        color: params.carnivalTheme ? 0x3366cc : 0x555555,
        metalness: 0.7,
        roughness: 0.3,
        emissive: params.carnivalTheme ? 0x112244 : 0x000000,
        emissiveIntensity: 0.2
      });
      
      const mainBar = new THREE.Mesh(
        new THREE.BoxGeometry(barW, height, 0.15),
        barMat
      );
      barGroup.add(mainBar);
      
      // Add Art Deco accents to the bars
      if (params.carnivalTheme) {
        // Add stepped decorative elements along the bar
        const stepCount = 5;
        const stepHeight = height / (stepCount * 2);
        const stepWidth = barW * 1.4;
        const stepDepth = 0.04;
        
        for (let j = 0; j < stepCount; j++) {
          const stepY = height/2 - stepHeight * (j * 2 + 1);
          
          const stepMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0xffcc00,
            emissiveIntensity: 0.3
          });
          
          const step = new THREE.Mesh(
            new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth),
            stepMat
          );
          
          step.position.set(0, stepY, 0.08);
          barGroup.add(step);
          
          // Add neo glow effect to steps
          const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            transparent: true,
            opacity: 0.15
          });
          
          const glowStep = new THREE.Mesh(
            new THREE.BoxGeometry(stepWidth * 1.2, stepHeight * 1.2, stepDepth),
            glowMat
          );
          
          glowStep.position.copy(step.position);
          barGroup.add(glowStep);
        }
      }
      
      // Position the bar group
      barGroup.position.set(-width/2 + spacing*(i+1), 0, 0);
      barrierGroup.add(barGroup);
      
      // Record slit positions for volumetric lights
      if (i < params.slits) {
        const slitX = -width/2 + spacing*(i+1) + spacing/2;
        slitPositions.push({x: slitX, z: 0});
      }
    }
    
    // Update volumetric lights if function is available
    if (window.updateVolumetricLights) {
      window.updateVolumetricLights(params.slits, slitPositions);
 }
    
    resetAll();
    
    // Update UI to reflect the current mode
    updateUIForMode();
    
    // Move camera to mode-specific preset
    if (params.animateCamera) {
      moveCamera(params.mode.toLowerCase());
    }
  }

  // ————————————— Reset Everything —————————————

  function resetAll(){
    stopAll();
    tick = 0;
    // clear wave heights
    const pos=screenMesh.geometry.attributes.position;
    for(let i=0;i<pos.count;i++) pos.setZ(i,0);
    pos.needsUpdate=true;
    markerGroup.clear();
    
    // Clear pachinko elements
    pegGrid.forEach(peg => {
      if (peg.mesh) scene.remove(peg.mesh);
    });
    activeBalls.forEach(ball => {
      if (ball.mesh) scene.remove(ball.mesh);
      if (ball.trailMesh) scene.remove(ball.trailMesh);
    });
    pegGrid = [];
    activeBalls = [];
    physicsTime = 0;
    
    // Update the screen material based on the mode and carnival theme
    if (screenMesh && screenMesh.material) {
      let screenColor, emissiveColor, emissiveIntensity;
      
      if (params.carnivalTheme) {
        // Neo-deco-rococo themed materials
        switch (params.mode) {
          case 'Wave':
            screenColor = 0xaaccff;
            emissiveColor = 0x0033aa;
            emissiveIntensity = 0.2;
            break;
          case 'Particle':
            screenColor = 0xffaacc;
            emissiveColor = 0xaa0033;
            emissiveIntensity = 0.2;
            break;
          case 'Pachinko':
            screenColor = 0xaaffcc;
            emissiveColor = 0x00aa33;
            emissiveIntensity = 0.2;
            break;
        }
      } else {
        // Standard materials
        screenColor = 0xddddff;
        emissiveColor = 0x000000;
        emissiveIntensity = 0;
      }
      
      // Update material properties
      screenMesh.material.color.setHex(screenColor);
      screenMesh.material.emissive.setHex(emissiveColor);
      screenMesh.material.emissiveIntensity = emissiveIntensity;
    }
    
    // Update UI to reflect current mode
    updateUIForMode();
    
    // Create mode transition effect
    if (params.carnivalTheme) {
      const flashOverlay = document.createElement('div');
      flashOverlay.style.position = 'fixed';
      flashOverlay.style.top = '0';
      flashOverlay.style.left = '0';
      flashOverlay.style.width = '100vw';
      flashOverlay.style.height = '100vh';
      flashOverlay.style.backgroundColor = 'white';
      flashOverlay.style.opacity = '0.7';
      flashOverlay.style.zIndex = '1000';
      flashOverlay.style.pointerEvents = 'none';
      flashOverlay.style.transition = 'opacity 0.5s ease-out';
      
      document.body.appendChild(flashOverlay);
      
      // Fade out the flash
      setTimeout(() => {
        flashOverlay.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(flashOverlay);
        }, 500);
      }, 50);
    }
    
    // Reset camera to mode-specific view
    if (params.animateCamera) {
      moveCamera(params.mode.toLowerCase());
    }
  }

  // ————————————— Start / Stop All Modes —————————————
  function startAll(){
    resetAll();
    if(params.mode==='Wave')      startWave();
    else if(params.mode==='Particle')  startParticle();
    else if(params.mode==='Pachinko') startPachinko();
  }
  function stopAll(){
    clearInterval(waveTimer);
    clearInterval(particleTimer);
    clearInterval(rwTimer);
  }

  // ————————————— Wave Mode with Neo-Deco-Rococo Visualization —————————————
  function startWave(){
    if(waveTimer) return;
    
    // Update UI to reflect the current mode
    updateUIForMode();
    
    // Add wave visualization enhancements for carnival theme
    if (params.carnivalTheme && screenMesh && screenMesh.material) {
      // Create neo-deco-rococo wave material with animation and glow
      screenMesh.material.color.setHex(0xaaccff);
      screenMesh.material.emissive.setHex(0x0033aa);
      screenMesh.material.emissiveIntensity = 0.2;
      
      // Create pulsing animation for emissive intensity
      const pulseEffect = () => {
        const t = Date.now() * 0.001;
        const pulseIntensity = 0.2 + 0.1 * Math.sin(t * 2);
        screenMesh.material.emissiveIntensity = pulseIntensity;
        
        if (params.mode === 'Wave' && waveTimer) {
          requestAnimationFrame(pulseEffect);
        }
      };
      
      // Start the pulsing effect
      pulseEffect();
      
      // Add light rays emanating from slits using volumetric beams
      const spacing = width / (params.slits + 1);
      const slitPositions = [];
      
      for (let i = 0; i < params.slits; i++) {
        const slitX = -width/2 + spacing * (i + 1) + spacing/2;
        slitPositions.push({x: slitX, z: 0});
      }
      
      if (window.updateVolumetricLights) {
        window.updateVolumetricLights(params.slits, slitPositions);
      }
      
      // Add dynamic flow map for wave visualization
      if (!screenMesh.userData.flowMap) {
        // Create flow map for wave animation
        const size = 512;
        const flowMapRenderTarget = new THREE.WebGLRenderTarget(size, size, {
          format: THREE.RGBAFormat,
          type: THREE.FloatType
        });
        
        // Create flow map camera and scene
        const flowMapCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const flowMapScene = new THREE.Scene();
        
        // Flow map shader material
        const flowMapShaderMaterial = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            slitCount: { value: params.slits },
            slitSpacing: { value: spacing / width } // Normalized spacing
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float time;
            uniform int slitCount;
            uniform float slitSpacing;
            varying vec2 vUv;

            // Art Deco pattern influence for flow map
            float artDecoFlow(vec2 uv, float t) {
              // Sunburst pattern
              vec2 center = uv - 0.5;
              float angle = atan(center.y, center.x);
              float sunburst = sin(angle * 8.0 + t) * 0.5 + 0.5;

              // Concentric rings
              float dist = length(center);
              float rings = sin(dist * 20.0 - t * 0.5) * 0.5 + 0.5;

              // Combine with time variation
              return mix(sunburst, rings, 0.5 + 0.5 * sin(t * 0.2));
            }

            void main() {
              vec2 uv = vUv * 2.0 - 1.0; // Convert to -1 to 1 range
              float wavesSum = 0.0;

              // Generate waves from each slit
              for(int i = 0; i < 3; i++) { // 3 is max slitCount we support
                if(i >= slitCount) break;

                // Calculate slit position
                float slitX = -0.5 + slitSpacing * float(i + 1) + slitSpacing/2.0;

                // Distance from point to slit
                float dist = length(vec2(uv.x - slitX, uv.y));

                // Wave equation with Art Deco influence
                float wavePhase = 8.0 * dist - 2.5 * time;
                float wave = sin(wavePhase) / (dist * 4.0 + 1.0);

                wavesSum += wave;
              }

              // Art Deco pattern influence
              float pattern = artDecoFlow(vUv, time * 0.3);

              // Combine wave equation with Art Deco pattern
              wavesSum = mix(wavesSum, pattern * sign(wavesSum), 0.3);

              // Output vector field for flow visualization
              float angle = atan(wavesSum, 0.5 + 0.2 * sin(time));
              vec2 flowVector = vec2(cos(angle), sin(angle)) * 0.5 + 0.5; // Normalize to 0-1

              // Add z-component for vertical displacement
              float zFlow = abs(wavesSum) * 0.5 + 0.5;

              // Output velocity as color
              gl_FragColor = vec4(flowVector, zFlow, 1.0);
            }
          `
        });
        
        // Create quad for flow map
        const flowMapQuad = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2),
          flowMapShaderMaterial
        );
        flowMapScene.add(flowMapQuad);
        
        // Store flowmap elements
        screenMesh.userData.flowMap = {
          renderTarget: flowMapRenderTarget,
          camera: flowMapCamera,
          scene: flowMapScene,
          material: flowMapShaderMaterial
        };
      }
    }
    
    waveTimer = setInterval(stepWave, 100);
  }
  
  function stepWave(){
    tick++;
    const t = tick*dt;
    const pos = screenMesh.geometry.attributes.position;
    const count = pos.count;
    
    // Add color attribute for vertex coloring if it doesn't exist yet
    if (!screenMesh.geometry.attributes.color && params.carnivalTheme) {
      const colors = new Float32Array(count * 3);
      screenMesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      if (screenMesh.material) {
        screenMesh.material.vertexColors = true;
      }
    }
    
    // Update flow map if exists
    if (screenMesh.userData.flowMap && params.carnivalTheme) {
      const flowMap = screenMesh.userData.flowMap;
      flowMap.material.uniforms.time.value = t;
      flowMap.material.uniforms.slitCount.value = params.slits;
      
      // Render flow map
      renderer.setRenderTarget(flowMap.renderTarget);
      renderer.render(flowMap.scene, flowMap.camera);
      renderer.setRenderTarget(null);
    }
    
    // Precompute slit coords:
    const slits=[];
    const spacing=width/(params.slits+1);
    for(let i=0;i<params.slits;i++){
      slits.push({x:-width/2+spacing*(i+1), y:0});
    }
    
    // Loop vertices
    for(let idx=0; idx<count; idx++){
      const ix = idx%(seg+1), iy=Math.floor(idx/(seg+1));
      const x = -width/2 + (ix*(width/seg));
      const y =  height/2 - (iy*(height/seg));
      let re=0, im=0;
      slits.forEach(s=>{
        const dx=x-s.x, dy=y-s.y, dz=screenZ;
        const r=Math.hypot(dx,dy,dz);
        const φ = k*r - ω*t;
        const amp = 1/(r+0.1);
        re += amp*Math.cos(φ);
        im += amp*Math.sin(φ);
      });
      const I = Math.hypot(re,im);
      
      // Apply wave height with enhanced amplitude for visual clarity
      const waveAmplitude = params.carnivalTheme ? 0.012 : 0.005;
      
      // Use sine function to create smoother transition for wave heights
      const currentHeight = pos.getZ(idx);
      const targetHeight = I * waveAmplitude;
      const smoothingFactor = 0.3; // Controls smoothing speed (0-1)
      
      // Apply smooth transition to new height
      pos.setZ(idx, currentHeight * (1 - smoothingFactor) + targetHeight * smoothingFactor);
      
      // Apply neo-deco-rococo color styling based on intensity and interference pattern
      if (params.carnivalTheme && screenMesh.geometry.attributes.color) {
        // Phase angle
        const phase = Math.atan2(im, re);
        
        // Calculate colors based on both intensity and phase
        // Use a more vibrant color palette for neo-deco-rococo aesthetic
        
        // Main color determined by phase - cycle through the spectrum
        const hue = (phase + Math.PI) / (2 * Math.PI);
        
        // Convert HSL to RGB with intensity-based saturation and luminance
        const h = hue;
        const s = Math.min(1.0, 0.7 + I * 0.3); // Higher intensity = more saturated
        const l = Math.min(0.8, 0.3 + I * 0.5); // Higher intensity = brighter
        
        // HSL to RGB conversion
        const hueToRgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        const r = hueToRgb(p, q, h + 1/3);
        const g = hueToRgb(p, q, h);
        const b = hueToRgb(p, q, h - 1/3);
        
        // Set the color for this vertex
        screenMesh.geometry.attributes.color.setXYZ(idx, r, g, b);
      }
    }
    
    pos.needsUpdate = true;
    
    if (params.carnivalTheme && screenMesh.geometry.attributes.color) {
      screenMesh.geometry.attributes.color.needsUpdate = true;
    }
    
    // Add floating particle effects above wave peaks
    if (params.carnivalTheme && params.showParticleGlow && Math.random() < 0.3) {
      // Find a high amplitude point 
      let maxI = 0;
      let maxIdx = 0;
      
      // Sample a subset of points for efficiency
      for (let i = 0; i < 20; i++) {
        const randIdx = Math.floor(Math.random() * count);
        const height = pos.getZ(randIdx);
        if (height > maxI) {
          maxI = height;
          maxIdx = randIdx;
        }
      }
      
      // Only create particles at significant wave heights
      if (maxI > 0.005) {
        const ix = maxIdx % (seg + 1);
        const iy = Math.floor(maxIdx / (seg + 1));
        const x = -width/2 + (ix * (width/seg));
        const y = height/2 - (iy * (height/seg));
        
        // Create a glowing particle at the wave peak
        createWaveGlowParticle(x, y, screenZ + maxI + 0.05);
      }
    }
  }
  
  // Create glowing particle effect for wave visualization
  function createWaveGlowParticle(x, y, z) {
    // Create small glowing particle
    const size = 0.02 + Math.random() * 0.02;
    const particleGeom = new THREE.SphereGeometry(size, 8, 8);
    
    // Get color from neo-deco-rococo palette
    const colors = [0x00ffcc, 0xff00aa, 0xffcc00, 0x00ccff];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Create glowing material with bloom effect visibility
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particle = new THREE.Mesh(particleGeom, glowMaterial);
    particle.position.set(x, y, z);
    scene.add(particle);
    
    // Create timeline for particle animation
    const lifetime = 1 + Math.random() * 1.5; // 1-2.5s
    const startTime = Date.now();
    const startOpacity = 0.8;
    const startScale = 1.0;
    
    // Slight random movement
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      0.1 + Math.random() * 0.1,
      (Math.random() - 0.5) * 0.1
    );
    
    // Animate particle
    const animateParticle = () => {
      const age = (Date.now() - startTime) / 1000; // in seconds
      
      if (age < lifetime && particle.parent) {
        // Update position
        particle.position.add(velocity.clone().multiplyScalar(0.016)); // dt
        
        // Update opacity and scale based on lifetime
        const lifeRatio = age / lifetime;
        particle.material.opacity = startOpacity * (1 - lifeRatio);
        
        const scale = startScale * (1 + lifeRatio * 1.5); // grow over time
        particle.scale.set(scale, scale, scale);
        
        requestAnimationFrame(animateParticle);
      } else {
        // Remove when done
        if (particle.parent) scene.remove(particle);
      }
    };
    
    // Start animation
    animateParticle();
  }
  
  // ————————————— Particle Mode —————————————
  let cumProb=[];
  function computeDistribution(){
    const pos = screenMesh.geometry.attributes.position;
    const I = new Float32Array(pos.count);
    let sum=0;
    for(let i=0;i<pos.count;i++){
      I[i] = Math.max(0, pos.getZ(i));
      sum += I[i];
    }
    // normalize & build cumulative
    cumProb = new Float32Array(pos.count);
    let c=0;
    for(let i=0;i<pos.count;i++){
      c += I[i]/sum;
      cumProb[i] = c;
    }
  }
  
  function startParticle(){
    if(particleTimer) return;
    computeDistribution();
    const interval = (params.roundDuration*1000)/params.electrons;
    
    // Update UI to reflect the current mode
    updateUIForMode();
    
    // Add light rays emanating from slits using volumetric beams
    const spacing = width / (params.slits + 1);
    const slitPositions = [];
    
    for (let i = 0; i < params.slits; i++) {
      const slitX = -width/2 + spacing * (i + 1) + spacing/2;
      slitPositions.push({x: slitX, z: 0});
    }
    
    if (window.updateVolumetricLights) {
      window.updateVolumetricLights(params.slits, slitPositions);
    }
    
    // Prepare for particle trails if enabled
    if (params.carnivalTheme && params.showTrails) {
      // Add particle trail container if it doesn't exist
      if (!scene.userData.particleTrails) {
        scene.userData.particleTrails = new THREE.Group();
        scene.add(scene.userData.particleTrails);
      } else {
        // Clear existing trails
        while (scene.userData.particleTrails.children.length > 0) {
          scene.userData.particleTrails.remove(scene.userData.particleTrails.children[0]);
        }
      }
    }
    
    // Set up camera for Particle mode
    if (params.animateCamera) {
      moveCamera('particle');
    }
    
    particleTimer = setInterval(()=> {
      // sample uniform [0,1)
      const r=Math.random();
      // binary search cumProb
      let lo=0, hi=cumProb.length-1;
      while(lo<hi){
        const mid=(lo+hi)>>1;
        if(cumProb[mid]>=r) hi=mid;
        else lo=mid+1;
      }
      // get x,y for index lo
      const ix = lo%(seg+1), iy=Math.floor(lo/(seg+1));
      const x = -width/2 + ix*(width/seg);
      const y =  height/2 - iy*(height/seg);
      
      // Neo-deco-rococo styled particle marker with enhanced visuals
      if (params.carnivalTheme) {
        // Create a particle group for decorative elements
        const particleGroup = new THREE.Group();
        
        // Create decorative particle with Art Deco styling
        // Base particle with neo styling (glowing sphere)
        const neonColors = [0x00ffcc, 0xff00aa, 0xffcc00, 0x00ccff];
        const baseColor = neonColors[Math.floor(Math.random() * neonColors.length)];
        
        // Use physical material for enhanced lighting and reflections
        const particleMat = new THREE.MeshPhysicalMaterial({
          color: baseColor,
          emissive: baseColor,
          emissiveIntensity: 0.5,
          metalness: 0.7,
          roughness: 0.3,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          reflectivity: 0.5
        });
        
        // Main particle with increased geometry detail
        const particleMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.025, 16, 16),
          particleMat
        );
        particleGroup.add(particleMesh);
        
        // Add Art Deco decoration (small ring)
        const ringGeom = new THREE.TorusGeometry(
          params.pegRadius * 1.2, 
          params.pegRadius * 0.15, 
          12, 
          24
        );
        
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xd4af37,
          emissive: 0xffcc00,
          emissiveIntensity: 0.3,
          metalness: 0.9,
          roughness: 0.1
        });
        
        const ring = new THREE.Mesh(ringGeom, ringMat);
        
        // Rotate ring randomly for visual variety
        ring.rotation.x = Math.PI / 2; // Align ring with peg
        ring.rotation.y = Math.random() * Math.PI * 2;
        
        particleGroup.add(ring);
        
        // Add subtle glow effect for neo aesthetic
        if (params.showParticleGlow) {
          const glowGeom = new THREE.SphereGeometry(params.pegRadius * 1.2, 16, 16);
          const glowMat = new THREE.MeshBasicMaterial({
            color: 0x3388ff,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
          });
          
          const glow = new THREE.Mesh(glowGeom, glowMat);
          particleGroup.add(glow);
          
          // Add pulsing animation to glow
          const pulsate = () => {
            if (!glow.parent) return;
            
            const t = Date.now() * 0.001;
            const scale = 1.0 + 0.1 * Math.sin(t + particleGroup.position.x + particleGroup.position.y);
            
            glow.scale.set(scale, scale, scale);
            glow.material.opacity = 0.1 + 0.05 * Math.sin(t * 1.5);
            
            requestAnimationFrame(pulsate);
          };
          
          // Start pulsing animation
          pulsate();
        }
      } else {
        // Standard marker for non-carnival theme
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.03, 8, 8),
          new THREE.MeshStandardMaterial({color: 0xffaa00})
        );
        m.position.set(x, y, screenZ+0.01);
        markerGroup.add(m);
      }
    }, interval);
  }
  
  // Create particle trajectory from source to impact point
  function createParticleTrajectory(start, end, color) {
    if (!scene.userData.particleTrails) return;
    
    // Create curve for trajectory path
    const points = [];
    
    // Start point
    points.push(start.clone());
    
    // Add mid-points with slight randomization for more natural path
    const midPointCount = 5; // Number of points along path
    
    for (let i = 1; i < midPointCount; i++) {
      const t = i / midPointCount;
      
      // Linear interpolation
      const point = new THREE.Vector3().lerpVectors(start, end, t);
      
      // Add controlled randomness to path
      // More randomness in middle, less at endpoints
      const randomIntensity = Math.sin(t * Math.PI) * 0.3;
      point.x += (Math.random() - 0.5) * randomIntensity;
      point.y += (Math.random() - 0.5) * randomIntensity;
      point.z += (Math.random() - 0.5) * randomIntensity;
      
      points.push(point);
    }
    
    // End point
    points.push(end.clone());
    
    
    
    // Create spline curve from points
    const curve = new THREE.CatmullRomCurve3(points);
    
    // Create tube geometry along curve
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      20,                   // tubularSegments
      0.008,       // radius
      8,           // radialSegments
      false        // closed
    );
    
    // Create material with glow effect
    const tubeMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    
    // Create mesh and add to scene
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.userData.particleTrails.add(tube);
    
    // Add fade-out animation
    const startTime = Date.now();
    const lifetime = 1000 + Math.random() * 1000; // 1-2 seconds
    
    const animateTrail = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / lifetime;
      
      if (progress < 1 && tube.parent) {
        // Fade out
        tube.material.opacity = 0.3 * (1 - progress);
        requestAnimationFrame(animateTrail);
      } else {
        // Remove when done
        if (tube.parent) scene.userData.particleTrails.remove(tube);
      }
    };
    
    // Start animation
    animateTrail();
    
    // Limit number of trails for performance
    if (scene.userData.particleTrails.children.length > 50) {
      scene.userData.particleTrails.remove(scene.userData.particleTrails.children[0]);
    }
  }
  
  // Add subtle floating motion to particle
  function addFloatingMotion(particleGroup) {
    // Define floating parameters
    const floatSpeed = 0.0005 + Math.random() * 0.0005; // Speed of motion
    const floatAmount = 0.01 + Math.random() * 0.01;    // Distance of motion
    const startPosition = particleGroup.position.clone();
    const startTime = Date.now();
    const directionChange = 2 + Math.random() * 2;      // Seconds before changing direction
    
    // Random initial direction
    const floatDirection = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      (Math.random() - 0.5) * 0.5 // Less Z movement
    ).normalize();
    
    // Animation function
    const animateFloat = () => {
      if (!particleGroup.parent) return; // Stop if removed
      
      const time = Date.now() * 0.001; // seconds
      
      // Calculate smooth oscillation
      const sinX = Math.sin(time * floatSpeed * 2.1);
      const sinY = Math.sin(time * floatSpeed * 1.7);
      const sinZ = Math.sin(time * floatSpeed * 1.3);
      
      // Change direction slowly over time
      const elapsed = (Date.now() - startTime) / 1000;
      const dirFactor = Math.sin(elapsed / directionChange * Math.PI);
      
      // Apply oscillation to position
      particleGroup.position.x = startPosition.x + sinX * floatAmount * dirFactor;
      particleGroup.position.y = startPosition.y + sinY * floatAmount * dirFactor;
      particleGroup.position.z = startPosition.z + sinZ * floatAmount * 0.5 * dirFactor;
      
      // Add slight rotation
      particleGroup.rotation.x += 0.0005 * sinX;
      particleGroup.rotation.y += 0.0005 * sinY;
      
      // Continue animation
      requestAnimationFrame(animateFloat);
    };
    
    // Start animation
    animateFloat();
  }

  // ————————————— Enhanced Wave Visualization Functions —————————————
  
  function createEnhancedWaveShader() {
    // Create a new shader material for the screen mesh with advanced wave visualization
    const vertexShader = 
      `varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vColor;
      varying float vHeight;
      
      attribute vec3 color;
      
      uniform float time;
      uniform sampler2D flowMap;
      uniform bool useFlowMap;
      uniform float waveIntensity;
      
      // Art Deco pattern generation
      float artDecoVertexPattern(vec2 uv, float t) {
        // Zigzag pattern
        float zigzag = abs(fract(uv.x * 15.0 + t * 0.2) - 0.5) * 2.0;
        
        // Concentric rings (Deco circles)
        float dist = length(uv - 0.5) * 10.0;
        float rings = abs(sin(dist - t * 0.5)) * 0.5 + 0.5;
        
        // Sunburst pattern
        vec2 center = uv - 0.5;
        float angle = atan(center.y, center.x);
        float sunburst = abs(fract((angle / 3.14159 + 1.0) * 8.0 + t * 0.1) - 0.5) * 2.0;
        
        // Combine patterns with time-based mixing
        float pattern = mix(mix(zigzag, rings, 0.5), sunburst, abs(sin(t * 0.1)));
        
        return pattern;
      }
      
      void main() {
        // Pass data to fragment shader
        vUv = uv;
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vHeight = position.z;
        
        // Pass vertex colors if available
        #ifdef USE_COLOR
          vColor = color;
        #else
          vColor = vec3(1.0, 1.0, 1.0);
        #endif
        
        // Advanced displacement based on patterns and wave height
        vec3 pos = position;
        
        // Flow map distortion for dynamic wave movement
        if (useFlowMap && position.z > 0.001) {
          vec4 flow = texture2D(flowMap, uv);
          
          // Apply more artistic flow distortion
          float flowStrength = 0.08 * waveIntensity;
          
          // Create multi-layered displacement for more organic movement
          pos.x += flow.x * flowStrength * (0.5 + 0.5 * sin(time * 2.0 + uv.x * 10.0));
          pos.y += flow.y * flowStrength * (0.5 + 0.5 * cos(time * 1.7 + uv.y * 8.0));
          
          // Add vertical displacement based on wave height for more dramatic effect
          pos.z += flow.z * 0.02 * waveIntensity * sin(time + uv.x * 5.0 + uv.y * 5.0);
        }
        
        // Apply Art Deco patterns to wave heights for neo-deco-rococo styling
        if (position.z > 0.001) {
          // Generate pattern
          float pattern = artDecoVertexPattern(uv, time);
          
          // Apply pattern with intensity based on wave height
          float patternInfluence = smoothstep(0.0, 0.01, abs(position.z)) * 0.3;
          pos.z *= 1.0 + pattern * patternInfluence * waveIntensity;
          
          // Add subtle ripples at wave peaks for more detail
          if (position.z > 0.005) {
            float microDetail = sin(uv.x * 50.0 + time * 3.0) * sin(uv.y * 50.0 + time * 2.0) * 0.01;
            pos.z += microDetail * waveIntensity;
          }
        }
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;
    
    const fragmentShader = 
      `varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vColor;
      varying float vHeight;
      
      uniform float time;
      uniform vec3 neonColor1;
      uniform vec3 neonColor2;
      uniform vec3 neonColor3;
      uniform vec3 neonColor4;
      uniform float waveIntensity;
      
      // Art Deco pattern generator with neo-deco-rococo styling
      float artDecoPattern(vec2 uv, float scale, float t) {
        // Zigzag pattern - classic Art Deco
        float zigzag = abs(fract(uv.x * scale + t * 0.2) - 0.5) * 2.0;
        
        // Sunburst pattern - signature Art Deco element
        vec2 center = uv - 0.5;
        float angle = atan(center.y, center.x);
        float dist = length(center);
        float sunburst = abs(fract((angle / 3.14159 + 1.0) * 8.0 + t * 0.1) - 0.5) * 2.0;
        
        // Fan pattern - common in Art Deco
        float fan = abs(fract((angle / 3.14159 + 1.0) * 12.0 + dist * 5.0 - t * 0.2) - 0.5) * 2.0;
        
        // Concentric circles - geometric Art Deco element
        float rings = abs(sin(dist * 20.0 - t * 0.5)) * 0.5 + 0.5;
        
        // Stepped gradient - architectural Art Deco
        float steps = floor(dist * 8.0) / 8.0;
        
        // Combine patterns with animated transitions for Rococo flair
        float blend1 = abs(sin(t * 0.11));
        float blend2 = abs(cos(t * 0.07));
        float blend3 = abs(sin(t * 0.05 + 3.14159/2.0));
        
        // Layer patterns with varying influence
        float pattern = mix(zigzag, sunburst, blend1);
        pattern = mix(pattern, fan, blend2 * 0.5);
        pattern = mix(pattern, rings, blend3 * 0.7);
        pattern = mix(pattern, steps, 0.2);
        
        return pattern;
      }
      
      // Iridescence calculation for Rococo shimmering effect
      vec3 iridescence(float angle, float intensity) {
        // Create rainbow spectrum based on angle
        vec3 color1 = vec3(0.8, 0.1, 0.9); // Purple
        vec3 color2 = vec3(0.1, 0.5, 0.9); // Blue
        vec3 color3 = vec3(0.1, 0.9, 0.5); // Teal
        vec3 color4 = vec3(0.9, 0.9, 0.1); // Yellow
        vec3 color5 = vec3(0.9, 0.1, 0.1); // Red
        
        float t = fract(angle + time * 0.1);
        
        vec3 color;
        if (t < 0.2) {
          color = mix(color1, color2, t * 5.0);
        } else if (t < 0.4) {
          color = mix(color2, color3, (t - 0.2) * 5.0);
        } else if (t < 0.6) {
          color = mix(color3, color4, (t - 0.4) * 5.0);
        } else if (t < 0.8) {
          color = mix(color4, color5, (t - 0.6) * 5.0);
        } else {
          color = mix(color5, color1, (t - 0.8) * 5.0);
        }
        
        return color * intensity;
      }
      
      void main() {
        // Base color from vertex color
        vec3 baseColor = vColor;
        
        // Calculate wave intensity factor based on height
        float heightFactor = smoothstep(0.0, 0.01, abs(vHeight)) * waveIntensity;
        
        // Enhanced lighting with fresnel effect for glassy look
        vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0) - vPosition);
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
        
        // Calculate light reflection for basic illumination
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.7 + 0.3;
        
        // Create shimmer effect based on height and time
        float shimmer = sin(time * 2.0 + vPosition.z * 30.0) * 0.5 + 0.5;
        
        // Generate Art Deco patterns with neo-deco-rococo styling
        float pattern1 = artDecoPattern(vUv, 20.0, time);
        float pattern2 = artDecoPattern(vUv * 2.0 - vec2(time * 0.05), 10.0, time * 0.7);
        float pattern = mix(pattern1, pattern2, 0.5) * heightFactor;
        
        // Edge glow effect for neo-rococo styling
        float edgeGlow = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 5.0);
        
        // Calculate angle for iridescent effect
        float angle = atan(vNormal.y, vNormal.x);
        vec3 iridescenceColor = iridescence(angle, fresnel * heightFactor);
        
        // Final color composition with full neo-deco-rococo styling
        vec3 color = baseColor;
        
        // Apply wave color based on height
        color = mix(
          color,
          mix(neonColor1, neonColor2, shimmer), 
          heightFactor * 0.7
        );
        
        // Add Art Deco pattern highlights
        color += mix(neonColor2, neonColor3, pattern) * pattern * 0.4;
        
        // Add edge highlights with neon glow
        color += neonColor3 * edgeGlow * heightFactor * 3.0;
        
        // Add iridescence for Rococo shimmering
        color += iridescenceColor * 0.3;
        
        // Enhance wave peaks with extra glow
        if (vHeight > 0.005) {
          float peakGlow = smoothstep(0.005, 0.01, vHeight) * 0.5;
          color += neonColor4 * peakGlow * (0.7 + 0.3 * sin(time * 3.0));
        }
        
        // Add subtle dust particle effect for Rococo luxury
        vec2 noiseUV = vUv * 20.0 + vec2(time * 0.1);
        float noise = fract(sin(dot(noiseUV, vec2(12.9898, 78.233))) * 43758.5453);
        if (noise > 0.98 && heightFactor > 0.3) {
          color += neonColor3 * 0.8;
        }
        
        // Apply light diffusion
        color *= (0.8 + diffuse * 0.2);
        
        // Apply subtle vignette for dramatic effect
        float vignette = smoothstep(0.0, 0.8, 1.2 - length(vUv - 0.5) * 1.0);
        color *= vignette * 0.3 + 0.7;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    // Create and return the shader material
    
    return new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        time: { value: 0 },
        useFlowMap: { value: true },
        flowMap: { value: null },
        neonColor1: { value: new THREE.Color(0x00ffcc) }, // Teal
        neonColor2: { value: new THREE.Color(0xff00aa) }, // Pink
        neonColor3: { value: new THREE.Color(0xffcc00) }, // Gold
        neonColor4: { value: new THREE.Color(0x3399ff) }, // Blue
        waveIntensity: { value: 1.0 }
      },
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true
    });
  }
  
  function updateWaveVisualization(time) {
    if (!screenMesh || !screenMesh.material || !screenMesh.material.uniforms) return;
    
    // Update shader uniforms for animation
    screenMesh.material.uniforms.time.value = time;
    
    // Update flow map texture if available
    if (screenMesh.userData.flowMap && screenMesh.userData.flowMap.renderTarget.texture) {
      screenMesh.material.uniforms.flowMap.value = screenMesh.userData.flowMap.renderTarget.texture;
    }
    
    // Modulate wave intensity based on mode and time
    const baseIntensity = 1.0;
    const pulseAmount = 0.3;
    const pulseSpeed = 2.0;
    
    // Calculate pulsing wave intensity with smoother easing
    const pulseFactor = 1.0 + pulseAmount * Math.sin(time * pulseSpeed);
    screenMesh.material.uniforms.waveIntensity.value = baseIntensity * pulseFactor;
    
    // Dynamic color shifting for neo styling - more frequent subtle shifts
    if (Math.random() < 0.03) {
      // Calculate new color with subtle shift
      const hue = (time * 0.1) % 1.0;
      const saturation = 0.7 + 0.3 * Math.sin(time * 0.2);
      const lightness = 0.5 + 0.1 * Math.sin(time * 0.3);
      
      // Create new color and apply with subtle interpolation
      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      screenMesh.material.uniforms.neonColor2.value.lerp(color, 0.05);
    }
    
    // Occasionally shift neonColor4 for variety
    if (Math.random() < 0.01) {
      const hue = (time * 0.05 + 0.5) % 1.0;
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
      screenMesh.material.uniforms.neonColor4.value.lerp(color, 0.1);
    }
  }
  
  // Apply the enhanced wave shader to the screen mesh
  function applyEnhancedWaveShader() {
    if (!screenMesh) return;
    
    // Store original material for non-carnival mode
    if (!screenMesh.userData.originalMaterial) {
      screenMesh.userData.originalMaterial = screenMesh.material;
    }
    
    // Create and apply the enhanced shader
    if (params.carnivalTheme && params.mode === 'Wave') {
      const waveShader = createEnhancedWaveShader();
      screenMesh.material = waveShader;
      
      // Create flow map if not already created
      if (!screenMesh.userData.flowMap) {
        createWaveFlowMap();
      }
    } else {
      // Restore original material if not in carnival theme or wave mode
      if (screenMesh.userData.originalMaterial) {
        screenMesh.material = screenMesh.userData.originalMaterial;
      }
    }
  }
  
  // Create flow map for advanced wave animation
  function createWaveFlowMap() {
    if (!screenMesh) return;
    
    // Create flow map for wave animation
    const size = 512;
    const flowMapRenderTarget = new THREE.WebGLRenderTarget(size, size, {
      format: THREE.RGBAFormat,
      type: THREE.FloatType
    });
    
    // Create flow map camera and scene
    const flowMapCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const flowMapScene = new THREE.Scene();
    
    // Flow map shader material with enhanced Art Deco influences
    const flowMapShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        slitCount: { value: params.slits },
        slitSpacing: { value: (width/(params.slits+1)) / width } // Normalized spacing
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform int slitCount;
        uniform float slitSpacing;
        varying vec2 vUv;

        // Art Deco pattern influence for flow map
        float artDecoFlow(vec2 uv, float t) {
          // Sunburst pattern
          vec2 center = uv - 0.5;
          float angle = atan(center.y, center.x);
          float sunburst = sin(angle * 8.0 + t) * 0.5 + 0.5;

          // Concentric rings
          float dist = length(center);
          float rings = sin(dist * 20.0 - t * 0.5) * 0.5 + 0.5;

          // Combine with time variation
          return mix(sunburst, rings, 0.5 + 0.5 * sin(t * 0.2));
        }

        void main() {
          vec2 uv = vUv * 2.0 - 1.0; // Convert to -1 to 1 range
          float wavesSum = 0.0;

          // Generate waves from each slit
          for(int i = 0; i < 3; i++) { // 3 is max slitCount we support
            if(i >= slitCount) break;

            // Calculate slit position
            float slitX = -0.5 + slitSpacing * float(i + 1) + slitSpacing/2.0;

            // Distance from point to slit
            float dist = length(vec2(uv.x - slitX, uv.y));

            // Wave equation with Art Deco influence
            float wavePhase = 8.0 * dist - 2.5 * time;
            float wave = sin(wavePhase) / (dist * 4.0 + 1.0);

            wavesSum += wave;
          }

          // Art Deco pattern influence
          float pattern = artDecoFlow(vUv, time * 0.3);

          // Combine wave equation with Art Deco pattern
          wavesSum = mix(wavesSum, pattern * sign(wavesSum), 0.3);

          // Output vector field for flow visualization
          float angle = atan(wavesSum, 0.5 + 0.2 * sin(time));
          vec2 flowVector = vec2(cos(angle), sin(angle)) * 0.5 + 0.5; // Normalize to 0-1

          // Add z-component for vertical displacement
          float zFlow = abs(wavesSum) * 0.5 + 0.5;

          // Output velocity as color
          gl_FragColor = vec4(flowVector, zFlow, 1.0);
        }
      `
    });
    
    // Create quad for flow map
    const flowMapQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      flowMapShaderMaterial
    );
    flowMapScene.add(flowMapQuad);
    
    // Store flowmap elements
    screenMesh.userData.flowMap = {
      renderTarget: flowMapRenderTarget,
      camera: flowMapCamera,
      scene: flowMapScene,
      material: flowMapShaderMaterial
    };
  }
  
  // Ensure proper initialization sequence
  try {
    // Initialize event listeners for camera controls and UI
    initEventListeners();
    
    // Set up initial camera position
    moveCamera('default');
    
    // Start animation loop with a small delay to ensure all resources are ready
    setTimeout(() => {
      if (typeof animate === 'function') {
        console.log("Starting animation loop...");
        animate();
      } else {
        console.warn("Animation function not found. Attempting to load from animate.js");
        // Try to create a function reference if it doesn't exist
        if (typeof window.animate !== 'function') {
          window.animate = function() {
            requestAnimationFrame(animate);
            if (renderer) renderer.render(scene, camera);
          };
          console.log("Created fallback animation function");
          animate();
        }
      }
      
      // Hide loading screen once everything is initialized
      const loadingContainer = document.getElementById('loadingContainer');
      if (loadingContainer) {
        loadingContainer.style.display = 'none';
        console.log("Initialization complete, loading screen hidden.");
      }
    }, 100);
  } catch (error) {
    console.error("Error during final initialization steps:", error);
    // Try to hide loading screen even if there was an error
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
      const loadingText = loadingContainer.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = 'Error initializing: ' + error.message;
        loadingText.style.color = '#ff3366';
      }
    }
  }
}

// Initialize when the window loads - only if not already initialized by body onload
window.onload = function() {
  // Check if init has already been called via body onload
  if (!window.initialized) {
    console.log("Window onload initializing application...");
    init();
  }
};
