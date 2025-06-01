(function(global) {
  'use strict';

  /**
   * Quantum Visual Simulator
   * Encapsulates all logic, state, and modules under a single namespace.
   */
  const QuantumSim = {
    // Cached DOM elements
    dom: {},

    // Three.js scene and related objects
    sceneObjects: {},
    
    // Track initialization state
    _initialized: false,
    _loadStartTime: Date.now(),
    
    // Performance metrics for monitoring
    performance: {
      fps: 0,
      frameTime: 0,
      lastFrameTime: 0,
      framesCount: 0,
      fpsUpdateInterval: 500,
      lastFpsUpdate: 0
    },

    // Application state and parameters
    state: {
      params: {
        slits: 2,
        mode: 'Wave',
        electrons: 1000,
        roundDuration: 30,
        pegRows: 12,
        binCount: 10,
        gravityStrength: 9.8,
        quantumUncertainty: 0.001,
        relativistic: false,
        showTrails: false,
        colorByProbability: false,
        enablePostFX: true,
        bloomIntensity: 1.0,
        showParticleGlow: true,
        animateCamera: false,
        carnivalTheme: false,
        speed: 1.0,
        running: false,
        showTrajectories: true,
        showStats: true,
        showControls: true,
        useShaders: true,
        usePostProcessing: true,
        reset: () => QuantumSim.mode.switch(QuantumSim.state.params.mode)
      },
      pegGrid: [],
      activeBalls: [],
      tick: 0,
      cumProb: [],
      isMobile: false
    },

    // Timer handles
    timers: {
      wave: null,
      particle: null,
      pachinko: null,
      render: null
    },

    /**
     * Initialize the simulator
     */
    init() {
      try {
        console.log("Initializing QuantumSim module...");
        
        // Prevent double initialization
        if (this._initialized) {
          console.warn("QuantumSim already initialized!");
          return;
        }
        
        // Detect mobile devices
        this.state.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (this.state.isMobile) {
          console.log("Mobile device detected, applying optimizations");
          document.body.classList.add('mobile-device');
        }
        
        // Initialize components
        this.cacheDOM();
        this.scene.init();
        this.camera.init();
        this.renderer.init();
        this.controls.init();
        this.ui.init();
        this.mode.init();
        this.theme.apply();
        
        // Start the render loop
        this.timers.render = requestAnimationFrame(this.update.bind(this));
        
        // Mark as initialized
        this._initialized = true;
        
        // Hide loading overlay
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
          loadingContainer.style.display = 'none';
        }
        
        console.log(`QuantumSim initialized in ${Date.now() - this._loadStartTime}ms`);
      } catch (error) {
        console.error("Failed to initialize QuantumSim:", error);
        
        // Show error in loading overlay
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
          const loadingText = loadingContainer.querySelector('.loading-text');
          if (loadingText) {
            loadingText.textContent = 'Error initializing: ' + error.message;
            loadingText.style.color = '#ff3366';
          }
        }
        
        // Try fallback renderer
        if (typeof window.startFallbackRenderer === 'function') {
          window.startFallbackRenderer();
        }
      }
    },

    /**
     * Cache DOM references once
     */
    cacheDOM() {
      ['loadingContainer','gui','canvasContainer','resetCamera','cam-wave','cam-particle','cam-artistic','cam-topdown','cam-follow','infoModal','infoModalBg','closeInfoModal'].forEach(id => {
        this.dom[id] = document.getElementById(id);
        if (!this.dom[id]) console.warn(`Missing DOM element #${id}`);
      });
    },

    /**
     * Main loop
     */
    update(time) {
      this.camera.update(time);
      this.mode.update(time);
      this.renderer.render();
      this.state.tick++;
      this.timers.render = requestAnimationFrame(this.update.bind(this));
    },

    /**
     * Cleanup timers and animations
     */
    cleanup() {
      cancelAnimationFrame(this.timers.render);
      clearInterval(this.timers.wave);
      clearInterval(this.timers.particle);
      clearInterval(this.timers.pachinko);
    },

    /**
     * Scene module: setup and scene-related utilities
     */
    scene: {
      init() {
        const s = new THREE.Scene();
        s.fog = new THREE.FogExp2(0x1a1a22, 0.02);
        QuantumSim.sceneObjects.scene = s;

        // Barrier group
        const barrier = new THREE.Group();
        s.add(barrier);
        QuantumSim.sceneObjects.barrierGroup = barrier;

        // Screen mesh placeholder
        QuantumSim.sceneObjects.screenMesh = null;

        // Marker group
        const marker = new THREE.Group();
        s.add(marker);
        QuantumSim.sceneObjects.markerGroup = marker;

        // Volumetric lights
        const vol = new THREE.Group();
        s.add(vol);
        QuantumSim.sceneObjects.volumetricGroup = vol;
      }
    },

    /**
     * Camera module: presets, transition, and update logic
     */
    camera: {
      camera: null,
      presets: {
        default: { position: new THREE.Vector3(0, 0, 5), target: new THREE.Vector3(0, 0, 0), duration: 1.5, easing: 'easeInOutCubic' },
        wave: { position: new THREE.Vector3(0, 3, 3), target: new THREE.Vector3(0, 0, 0), duration: 2.0 },
        waveArtistic: { position: new THREE.Vector3(3, 2.5, 4), target: new THREE.Vector3(0, -0.5, 0), duration: 2.3 },
        waveDetail: { position: new THREE.Vector3(1, 1.2, 3), target: new THREE.Vector3(0, 0, 0), duration: 1.8 },
        particle: { position: new THREE.Vector3(2, 1, 4), target: new THREE.Vector3(0, 0, 0), duration: 1.8 },
        particleDramatic: { position: new THREE.Vector3(1.5, 0.5, 6), target: new THREE.Vector3(0, 0.3, 0), duration: 2.2 },
        particlePattern: { position: new THREE.Vector3(0, 4, 2), target: new THREE.Vector3(0, 0, 2), duration: 2.0 },
        pachinko: { position: new THREE.Vector3(0, 1.5, 4), target: new THREE.Vector3(0, -0.5, 0), duration: 1.8 },
        pachinkoSide: { position: new THREE.Vector3(4, 0, 3), target: new THREE.Vector3(0, -0.5, 0), duration: 2.0 },
        pachinkoPegs: { position: new THREE.Vector3(1, -0.5, 3), target: new THREE.Vector3(0, -1, 0), duration: 1.7 },
        slits: { position: new THREE.Vector3(-1.5, 0, 2), target: new THREE.Vector3(-1, 0, 0), duration: 1.5 },
        topdown: { position: new THREE.Vector3(0, 5, 0.1), target: new THREE.Vector3(0, 0, 0), duration: 2.2 },
        artistic: { position: new THREE.Vector3(3, 2, 4), target: new THREE.Vector3(0, 0, 0), duration: 2.5 },
        dramatic: { position: new THREE.Vector3(2, -1, 5), target: new THREE.Vector3(0, 0.5, 0), duration: 2.7 },
        cinematicOrbit: { position: new THREE.Vector3(4, 2, 4), target: new THREE.Vector3(0, 0, 0), duration: 3.0, orbit: true }
      },
      transition: {
        active: false,
        startPos: null,
        endPos: null,
        startTarget: null,
        endTarget: null,
        startTime: 0,
        duration: 0,
        easing: 'easeInOutCubic',
        orbit: false,
        onComplete: null
      },
      followData: {
        active: false,
        target: null,
        offset: new THREE.Vector3(0, 0.5, 2),
        damping: 0.08,
        lookAhead: 1.0,
        offsetVariation: 0
      },
      init() {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.copy(this.presets.default.position);
        QuantumSim.sceneObjects.scene.add(this.camera);
      },
      moveTo(name, onComplete = null) {
        const p = this.presets[name];
        if (!p) return;
        this.transition = {
          active: true,
          startPos: this.camera.position.clone(),
          endPos: p.position.clone(),
          startTarget: QuantumSim.controls.controls.target.clone(),
          endTarget: p.target.clone(),
          startTime: Date.now(),
          duration: p.duration * 1000,
          easing: p.easing || 'easeInOutCubic',
          orbit: p.orbit || false,
          onComplete
        };
        this.followData.active = false;
        QuantumSim.ui.updateCameraControlsUI(name);
      },
      update() {
        if (this.transition.active) {
          const elapsed = Date.now() - this.transition.startTime;
          let t = Math.min(elapsed / this.transition.duration, 1);
          t = this.applyEasing(t, this.transition.easing);
          this.camera.position.lerpVectors(this.transition.startPos, this.transition.endPos, t);
          QuantumSim.controls.controls.target.lerpVectors(
            this.transition.startTarget,
            this.transition.endTarget,
            t
          );
          QuantumSim.controls.controls.update();
          if (t >= 1) {
            this.transition.active = false;
            if (this.transition.orbit) this.transition.alwaysOrbit = true;
            if (this.transition.onComplete) this.transition.onComplete();
          }
        } else if (
          this.transition.alwaysOrbit &&
          QuantumSim.state.params.animateCamera &&
          QuantumSim.state.params.mode === 'Wave'
        ) {
          const time = Date.now() * 0.0001;
          const r = 4;
          const h = 2 + Math.sin(time * 0.5) * 0.5;
          const x = Math.sin(time) * r;
          const z = Math.cos(time) * r;
          this.camera.position.lerp(new THREE.Vector3(x, h, z), 0.001);
          QuantumSim.controls.controls.update();
        } else if (this.followData.active && this.followData.target) {
          const tp = this.followData.target.position || this.followData.target.mesh.position;
          const vel = this.followData.target.velocity || new THREE.Vector3();
          const ahead = tp.clone().add(vel.clone().multiplyScalar(this.followData.lookAhead));
          const dynOffset = this.followData.offset.clone();
          if (this.followData.offsetVariation > 0) {
            const tt = Date.now() * 0.001;
            const v = this.followData.offsetVariation;
            dynOffset.x += Math.sin(tt * 0.7) * v;
            dynOffset.y += Math.sin(tt * 0.5) * v * 0.5;
            dynOffset.z += Math.sin(tt * 0.3) * v * 0.3;
          }
          const desired = ahead.clone().add(dynOffset);
          this.camera.position.lerp(desired, this.followData.damping);
          QuantumSim.controls.controls.target.lerp(tp, this.followData.damping * 1.2);
          QuantumSim.controls.controls.update();
        }
      },
      setupFollow(target, options = {}) {
        if (!target) {
          this.followData.active = false;
          return;
        }
        this.followData.active = true;
        this.followData.target = target;
        if (options.offset) this.followData.offset = options.offset.clone();
        if (options.damping !== undefined) this.followData.damping = options.damping;
        if (options.lookAhead !== undefined) this.followData.lookAhead = options.lookAhead;
        if (options.variation !== undefined) this.followData.offsetVariation = options.variation;
        QuantumSim.controls.controls.enabled = false;
        QuantumSim.ui.updateCameraControlsUI('follow');
      },
      cyclePresets() {
        const mode = QuantumSim.state.params.mode.toLowerCase();
        const map = {
          wave: ['wave', 'waveArtistic', 'waveDetail', 'topdown'],
          particle: ['particle', 'particleDramatic', 'particlePattern', 'slits'],
          pachinko: ['pachinko', 'pachinkoSide', 'pachinkoPegs', 'dramatic']
        };
        const arr = map[mode] || ['default'];
        const i = arr.indexOf(window.currentPreset);
        const next = arr[(i + 1) % arr.length];
        this.moveTo(next);
      },
      applyEasing(t, type) {
        switch (type) {
          case 'easeInOutCubic':
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          case 'easeOutQuart':
            return 1 - Math.pow(1 - t, 4);
          case 'easeInOutExpo':
            return t === 0
              ? 0
              : t === 1
              ? 1
              : t < 0.5
              ? Math.pow(2, 20 * t - 10) / 2
              : (2 - Math.pow(2, -20 * t + 10)) / 2;
          case 'elasticOut': {
            const c4 = (2 * Math.PI) / 3;
            return t === 0
              ? 0
              : t === 1
              ? 1
              : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
          }
          default:
            return t;
        }
      },
      initPresets() {
        // additional dynamic presets if needed
      }
    },
        wave: {position:new THREE.Vector3(0,3,3),target:new THREE.Vector3(0,0,0),duration:2.0},
        particle: {position:new THREE.Vector3(2,1,4),target:new THREE.Vector3(0,0,0),duration:1.8},
        pachinko: {position:new THREE.Vector3(0,1.5,4),target:new THREE.Vector3(0,-0.5,0),duration:1.8},
        topdown: {position:new THREE.Vector3(0,5,0.1),target:new THREE.Vector3(0,0,0),duration:2.2},
        artistic: {position:new THREE.Vector3(3,2,4),target:new THREE.Vector3(0,0,0),duration:2.5}
      },

      init() {
        const cam = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
        cam.position.copy(this.presets.default.position);
        this.camera = cam;
        QuantumSim.sceneObjects.scene.add(cam);
      },

      moveTo(name) {
        const p = this.presets[name];
        if (!p) return;
        this.transition = {start:Date.now(),duration:p.duration*1000,
          fromPos:this.camera.position.clone(),toPos:p.position.clone(),
          fromTarget:QuantumSim.controls.controls.target.clone(),toTarget:p.target.clone()};
      },

      update(time) {
        if (this.transition) {
          const t= (Date.now()-this.transition.start)/this.transition.duration;
          const progress = Math.min(1, t);
          this.camera.position.lerpVectors(
            this.transition.fromPos,this.transition.toPos,progress
          );
          QuantumSim.controls.controls.target.lerpVectors(
            this.transition.fromTarget,this.transition.toTarget,progress
          );
          QuantumSim.controls.controls.update();
          if (progress>=1) this.transition=null;
        }
      }
    },

    /**
     * Renderer module: WebGLRenderer and post-processing
     */
    renderer: {
      renderer: null,
      composer: null,

      init() {
        const r = new THREE.WebGLRenderer({antialias:true,alpha:true});
        r.setSize(window.innerWidth,window.innerHeight);
        r.setPixelRatio(Math.min(window.devicePixelRatio,2));
        QuantumSim.dom.canvasContainer?.appendChild(r.domElement);
        this.renderer=r;
        this.setupComposer();
      },

      setupComposer() {
        const c=new THREE.EffectComposer(this.renderer);
        c.addPass(new THREE.RenderPass(QuantumSim.sceneObjects.scene,QuantumSim.camera.camera));
        const bloom=new THREE.UnrealBloomPass(
          new THREE.Vector2(window.innerWidth,window.innerHeight),
          QuantumSim.state.params.bloomIntensity,0.5,0.7
        );
        c.addPass(bloom);
        this.composer=c;
      },

      render() {
        if (QuantumSim.state.params.enablePostFX) this.composer.render();
        else this.renderer.render(QuantumSim.sceneObjects.scene,QuantumSim.camera.camera);
      }
    },

    /**
     * Controls: OrbitControls wrapper
     */
    controls: {
      controls:null,
      init() {
        this.controls=new THREE.OrbitControls(
          QuantumSim.camera.camera,QuantumSim.renderer.renderer.domElement
        );
        this.controls.enableDamping=true;
        this.controls.dampingFactor=0.05;
      },
      update() { this.controls.update(); }
    },

    /**
     * UI: dat.GUI and event bindings
     */
    ui: {
      gui:null,
      init() {
        this.gui=new dat.GUI({autoPlace:false});
        QuantumSim.dom.gui?.appendChild(this.gui.domElement);
        this.setupFolders();
        this.bindEvents();
      },
      setupFolders() {
        const p=QuantumSim.state.params;
        const f1=this.gui.addFolder('Quantum Setup');
        f1.add(p,'slits',{One:1,Two:2}).onChange(()=>QuantumSim.mode.rebuildBarrier());
        f1.add(p,'mode',['Wave','Particle','Pachinko']).onChange(m=>QuantumSim.mode.switch(m));
        f1.add(p,'electrons',100,10000).step(100);
        f1.add(p,'roundDuration',5,60).step(5);
        f1.add(p,'reset').name('↺ Reset Simulation');
        f1.open();
        // Additional folders omitted for brevity
      },
      bindEvents() {
        const d=QuantumSim.dom;
        d.resetCamera?.addEventListener('click',()=>QuantumSim.camera.moveTo('default'));
        d['cam-wave']?.addEventListener('click',()=>QuantumSim.camera.moveTo('wave'));
        d['cam-particle']?.addEventListener('click',()=>QuantumSim.camera.moveTo('particle'));
        d['cam-artistic']?.addEventListener('click',()=>QuantumSim.camera.moveTo('artistic'));
        d['cam-topdown']?.addEventListener('click',()=>QuantumSim.camera.moveTo('topdown'));
        d['cam-follow']?.addEventListener('click',()=>QuantumSim.controls.controls.enabled=!QuantumSim.controls.controls.enabled);
        d.closeInfoModal?.addEventListener('click',()=>this.toggleModal());
        d.infoModalBg?.addEventListener('click',()=>this.toggleModal());
      },
      toggleModal() {
        const m=QuantumSim.dom.infoModal,b=QuantumSim.dom.infoModalBg;
        m?.classList.toggle('visible'); b?.classList.toggle('visible');
      }
    },

    /**
     * Theme manager: apply styling based on carnivalTheme
     */
    theme: {
      apply() {
        const p=QuantumSim.state.params;
        // update materials for carnivalTheme toggled
      }
    },

    /**
     * Mode manager: wave, particle, pachinko modules
     */
    mode: {
      current:'',

      init() {
        this.switch(QuantumSim.state.params.mode);
      },

      switch(mode) {
        this.stopAll();
        this.current=mode;
        this.rebuildBarrier();
        if(mode==='Wave') this.wave.start();
        if(mode==='Particle') this.particle.start();
        if(mode==='Pachinko') this.pachinko.start();
      },

      stopAll() {
        clearInterval(QuantumSim.timers.wave);
        clearInterval(QuantumSim.timers.particle);
        clearInterval(QuantumSim.timers.pachinko);
      },

      update(time) {
        if(this.current==='Wave') this.wave.update(time);
        // particle & pachinko have no per-frame updates here
      },

      rebuildBarrier() {
        // original rebuildBarrier code, using QuantumSim.sceneObjects.barrierGroup
      },

      wave: {
        start() { /* original startWave logic */ },
        update(time) { /* stepWave + shader updates */ }
      },

      particle: {
        start() { /* original startParticle logic */ }
      },

     // In quantumSim.js, inside QuantumSim.mode:
      pachinko: {
        /**
         * Start the Pachinko simulation:
         *  - Builds pegs
         *  - Spawns balls at uniform intervals
         *  - Updates physics & collisions on a fixed timestep
         */
        start() {
          const sim     = QuantumSim;
          const scene   = sim.sceneObjects.scene;
          const state   = sim.state;
          const params  = state.params;
          const timers  = sim.timers;
      
          // --- 1) Clear previous pegs & balls ---
          state.pegGrid.forEach(p => scene.remove(p.mesh));
          state.activeBalls.forEach(b => {
            if (b.mesh)        scene.remove(b.mesh);
            if (b.trailMesh)   scene.remove(b.trailMesh);
            clearInterval(b.dropTimer);
          });
          state.pegGrid.length = 0;
          state.activeBalls.length = 0;
      
          // --- 2) Build new peg grid ---
          const rows     = params.pegRows;
          const cols     = params.binCount + 1;       // one more peg than bins
          const width    = params.binCount * 0.6;     // spacing scale
          const height   = rows * 0.4;
          const dx       = width / (cols - 1);
          const dy       = height / (rows + 1);
      
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              // stagger every other row
              const x0 = -width/2 + (c + (r % 2)*0.5) * dx;
              const y0 =  height/2 - (r+1) * dy;
              const peg = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshStandardMaterial({
                  color:   params.carnivalTheme ? 0x3388ff : 0x888888,
                  emissive:params.carnivalTheme ? 0x001133 : 0x000000,
                  emissiveIntensity: params.carnivalTheme ? 0.2 : 0
                })
              );
              peg.position.set(x0,y0,0);
              peg.castShadow = true;
              scene.add(peg);
              state.pegGrid.push({ mesh: peg });
            }
          }
      
          // --- 3) Spawn & update loop ---
          const total  = params.electrons;
          const roundT = params.roundDuration * 1000;
          const spawnInterval = roundT / total;
          const gravity = params.gravityStrength;
          const noiseAmt= params.quantumUncertainty;
      
          let spawned = 0;
          // Drop timer
          timers.pachinkoSpawn = setInterval(() => {
            if (spawned++ >= total) {
              clearInterval(timers.pachinkoSpawn);
              return;
            }
            // create ball
            const mesh = new THREE.Mesh(
              new THREE.SphereGeometry(0.03,12,12),
              new THREE.MeshStandardMaterial({ color: 0xffaa00 })
            );
            // start at top center
            mesh.position.set(0, height/2 + 0.1, 0);
            scene.add(mesh);
      
            // initial downward velocity
            const vel = new THREE.Vector3(
              (Math.random()-0.5)*noiseAmt,
              -1,
              0
            ).multiplyScalar(2);
      
            state.activeBalls.push({ mesh, vel });
          }, spawnInterval);
      
          // Physics update (60fps)
          timers.pachinkoPhys = setInterval(() => {
            const dt = 0.016;
            const vdown = new THREE.Vector3(0, -1, 0);
            state.activeBalls.forEach((ball, idx) => {
              const { mesh, vel } = ball;
      
              // apply gravity
              vel.y += gravity * dt;
      
              // advance
              mesh.position.addScaledVector(vel, dt);
      
              // collision vs pegs
              state.pegGrid.forEach(p => {
                const dist = mesh.position.distanceTo(p.mesh.position);
                if (dist < 0.08) { // collision radius sum ≈ 0.05+0.03
                  // compute collision normal
                  const normal = mesh.position.clone()
                    .sub(p.mesh.position).normalize();
                  // angle to vertical
                  const ang = normal.angleTo(vdown) * 180/Math.PI; 
                  // probability of veering right
                  const pRight = 0.5 + ((ang -90)/90)*0.5;
                  const turnRight = Math.random() < pRight;
      
                  // reflect velocity's y component
                  vel.y = -vel.y * 0.6; // restitution
                  // assign x based on random outcome
                  const speed = vel.length();
                  const dir = turnRight ? 1 : -1;
                  // tilt angle proportional to original impact angle
                  const theta = THREE.MathUtils.degToRad(ang * 0.5);
                  vel.x = Math.sin(theta) * speed * dir;
                  vel.y = Math.cos(theta) * speed * -1;
                }
              });
      
              // remove if off bottom
              if (mesh.position.y < -height/2 - 0.2) {
                scene.remove(mesh);
                state.activeBalls.splice(idx,1);
              }
            });
          }, 16);
        },
      
        /** Stop Pachinko entirely */
        stop() {
          clearInterval(QuantumSim.timers.pachinkoSpawn);
          clearInterval(QuantumSim.timers.pachinkoPhys);
        }
      }
      }
    }
  };

  // Expose globally and initialize
  global.QuantumSim = QuantumSim;
  window.onload = () => QuantumSim.init();

})(window);
