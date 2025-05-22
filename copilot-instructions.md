Summary
	•	Craft a 3-mode interactive simulator (Wave, Particle, Pachinko) revealing quantum duality
	•	Drive visuals from real equations (wavefunction, intensity, probability)—no “fake” interference
	•	Structure code modularly (Scene, Physics, Renderer, UI), favoring brevity and clarity
	•	Encourage a unified metaphor (carnival/casino games) if it simplifies UX
	•	Prioritize performance: minimal meshes, GPU shaders for wave math, batched instancing for particles

I. Scope & Goals
	1.	Modes:
	•	Wave – continuous wavefronts through 1–2 slits, compute \psi(\mathbf r)=\sum_j \frac{1}{r_j}e^{i(kr_j-\omega t)}; render intensity I=|\psi|^2 as heightmap.
	•	Particle – sample the computed intensity map as a distribution; spawn discrete “electrons” on impact points.
	•	Pachinko – model classical random walk: N rows of unbiased pegs ⇒ binomial slot distribution.
	2.	Unifying Metaphor (optional):
	•	Present all three modes as carnival games: “Wave Ring Toss,” “Quantum Plinko,” “Classic Pachinko.”
	•	Shared UI shell: ticket counter = slits, play button starts round, scoreboard = interference hills.

II. Physics & Equations
	1.	Wavefunction
\psi_j(\mathbf r,t)
=\frac{1}{r_j}\exp\bigl[i\,(k\,r_j-\omega\,t)\bigr],
\quad r_j = \|\mathbf r - \mathbf r_{\!\text{slit},j}\|.
	2.	Intensity Map
I(\mathbf r)=\Bigl|\sum_j\psi_j\Bigr|^2.
	3.	Probability Sampling
	•	Normalize I into P(\mathbf r)=I(\mathbf r)/\sum I.
	•	Draw samples \mathbf r_k\sim P to place particles.
	4.	Random Walk
	•	For each “electron,” perform M independent Bernoulli trials p=0.5.
	•	Slot index = number of “rights” ⇒ P(k)=\binom{M}{k}/2^M.

III. Component Architecture
	1.	Core Modules
	•	SceneManager: initialize Three.js scene, lights, camera, controls.
	•	Barrier: generate slit barrier; configurable slit count.
	•	Screen: subdivided mesh for vertex‐shader displacement (Wave) or instanced markers (Particle/Pachinko).
	•	PhysicsEngine:
	•	computeWaveMap(time) → intensity array
	•	buildCumulativePDF(intensity) → sampler
	•	sampleParticle() → position
	•	simulateWalk() → slot index
	•	Renderer:
	•	renderWave() via GPU or CPU per‐vertex displacement
	•	spawnParticle(position)
	•	spawnPachinkoBall(slot)
	•	UIController: dat.GUI (or custom) for Mode, Slits, ElectronCount, RoundTime, Start/Stop/Reset.
	2.	Data Flow
	•	Wave Mode: on tick → PhysicsEngine→intensity map → Renderer.updateMesh()
	•	Particle Mode: once map ready → PhysicsEngine.buildCumulativePDF → schedule spawns over round
	•	Pachinko Mode: schedule random‐walk spawns over round → Renderer.spawnPachinko

IV. Performance & Code Style
	1.	Efficiency
	•	Leverage vertex shaders for wave displacement if possible; fallback to CPU only for prototyping.
	•	Use InstancedMesh for particles/balls to minimize draw calls.
	•	Throttle updates: limit particle spawns per frame.
	2.	Simplicity
	•	Keep functions ≤ 50 lines; single responsibility.
	•	Favor plain JavaScript + Three.js; avoid heavy frameworks.
	•	Document math inline; reference equations by number.
	3.	Testing & Validation
	•	Verify wave intensity matches analytic diffraction formula for single-slit (Fraunhofer limit).
	•	Confirm particle histogram converges to I(x) shape as sample size ↑.
	•	Ensure Pachinko distribution ≈ binomial with M rows.

V. Creative Guidance
	1.	Metaphor Integration
	•	If unifying as carnival games, reuse art assets (pegs, tickets, slot bins).
	•	Allow thematic skins: neon, steampunk, minimal wireframe.
	2.	Extendability
	•	Abstract Mode interface: new modes (e.g., Bohmian trajectory) plug in PhysicsEngine and Renderer hooks.
	•	Encourage exposure of parameters (k, ω, slit width) for advanced play.

VI. Delivery Milestones
	1.	Prototype (1 week): Wave Mode with working heightmap.
	2.	Particle Mode (2 days): Sampling and discrete impacts.
	3.	Pachinko Mode (2 days): Random-walk distribution.
	4.	UI & Metaphor Polish (1 week): Unified look, instructions, skins.
	5.	Validation & Testing (3 days): Physics accuracy, performance optimizations.

—
Keep code terse, math‐driven, and interactive. Rely on real quantum formulas, not faked animations. Embrace creativity in metaphor and visuals, but remember: less is more. Convey the true strangeness of quantum duality with clarity and performance. 