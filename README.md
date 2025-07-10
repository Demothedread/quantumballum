# Quantum Visual Simulator

A dazzling visualization of quantum mechanics and probabilistic randomization, featuring Wave, Particle, and Pachinko modes!

## Features

- **Wave Mode**: Visualizes quantum wave interference through a double-slit experiment
- **Particle Mode**: Shows individual quantum particles passing through slits with interference patterns
- **Pachinko Mode**: A mechanical analog using pachinko-style pegs to demonstrate quantum probability

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/Demothedread/quantumballum.git
   cd quantumballum
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Technology

- Three.js for 3D rendering and visualization
- dat.GUI for interactive controls
- Custom WebGL shaders for wave simulation
- Browser-based quantum physics simulation

## Dependencies

This project uses CDN-loaded libraries for Three.js and its extensions:
- Three.js r152
- OrbitControls
- Post-processing effects (EffectComposer, RenderPass, etc.)
- dat.GUI for the user interface

## Development

- `npm run dev` - Start the development server
- `npm run deploy` - Deploy to GitHub Pages

## License

See the LICENSE file for details.