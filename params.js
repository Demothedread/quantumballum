// Global parameters for quantum simulation
const params = {
  // Mode settings
  mode: 'Wave',          // Current mode: 'Wave', 'Particle', or 'Pachinko'
  speed: 1.0,            // Animation speed multiplier
  running: false,        // Whether simulation is running
  
  // Experiment settings
  slits: 2,              // Number of slits (1 or 2)
  slitWidth: 0.3,        // Width of each slit
  barrierWidth: 0.1,     // Width of the barrier wall
  
  // Visualization settings
  carnivalTheme: true,   // Enable neo-deco-rococo styling
  animateCamera: false,  // Enable automatic camera movement
  particleCount: 100,    // Number of particles in Particle mode
  pegRows: 8,            // Number of peg rows in Pachinko mode
  bloomStrength: 1.5,    // Strength of the bloom post-processing effect
  
  // Physics parameters
  waveFrequency: 0.5,    // Base frequency of waves
  waveIntensity: 1.0,    // Wave amplitude
  quantumFactor: 0.5,    // Quantum uncertainty factor
  
  // Display options
  showTrajectories: true,// Show particle trajectories
  showStats: true,       // Show performance statistics
  showControls: true,    // Show camera controls
  
  // Advanced settings
  useShaders: true,      // Use GPU shaders for wave calculations
  usePostProcessing: true// Enable post-processing effects
};
