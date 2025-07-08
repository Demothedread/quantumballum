const PhysicsEngine = (function() {
  const balls = [];
  const pegs = [];
  let gravity = 9.8;

  function init(opts = {}) {
    gravity = opts.gravity || gravity;
    balls.length = 0;
    pegs.length = 0;
  }

  function addPeg(mesh, radius = 0.05) {
    pegs.push({ mesh, radius });
  }

  function addBall(mesh, radius = 0.03, velocity = new THREE.Vector3()) {
    const ball = { mesh, radius, velocity };
    balls.push(ball);
    return ball;
  }

  function step(dt, bounds = { bottom: -Infinity }) {
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      b.velocity.y -= gravity * dt;
      b.mesh.position.addScaledVector(b.velocity, dt);

      // collide with pegs
      for (const p of pegs) {
        const dist = b.mesh.position.distanceTo(p.mesh.position);
        if (dist < b.radius + p.radius) {
          const normal = b.mesh.position.clone().sub(p.mesh.position).normalize();
          const relVel = b.velocity.dot(normal);
          if (relVel < 0) {
            b.velocity.addScaledVector(normal, -2 * relVel);
            const penetration = b.radius + p.radius - dist;
            b.mesh.position.addScaledVector(normal, penetration + 1e-3);
          }
        }
      }

      if (b.mesh.position.y < bounds.bottom) {
        if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
        balls.splice(i, 1);
      }
    }
  }

  return { init, addPeg, addBall, step, balls, pegs };
})();
