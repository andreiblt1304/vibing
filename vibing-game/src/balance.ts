/**
 * Game balancing values for Synthwave Bullet Hell.
 *
 * - All values are centralized here for easy tuning.
 * - fireRate for all weapons means "frames between shots/volleys" (higher = slower, lower = faster).
 *   For example, at 60 FPS, fireRate: 12 means 5 shots per second.
 * - Adjust these values to balance gameplay difficulty and feel.
 */

export const balance = {
  // Player
  playerSpeed: 5,      // Movement speed (pixels per frame)
  playerRadius: 18,    // Collision/display radius (pixels)
  playerHP: 3,         // Starting hit points

  // Weapons
  /**
   * fireRate: frames between shots/volleys (higher = slower, lower = faster)
   * bulletSpeed: pixels per frame
   * bulletRadius: collision/display radius (pixels)
   * numProjectiles: number of projectiles per volley, for radial
   */
  directional: {
    fireRate: 8,      // Frames between shots (default: 12)
    bulletSpeed: 8,
    bulletRadius: 7,
  },
  radial: {
    fireRate: 80,      // Frames between volleys (default: 60, much slower than directional)
    bulletSpeed: 3,
    bulletRadius: 6,
    numProjectiles: 8, // Number of projectiles per volley, evenly spaced in a circle
  },
  autoAim: {
    fireRate: 20,      // Frames between shots (default: 12)
    bulletSpeed: 4,
    bulletRadius: 3,
  },

  // Power-ups
  rapidFireBonus: -4,  // Subtract from fireRate (minimum fireRate is 4)
  speedUpBonus: 2,     // Add to playerSpeed
  extraLifeBonus: 1,   // Add to playerHP

  // Enemies
  enemyRadius: 18,         // Collision/display radius (pixels)
  enemyBaseHP: 1,          // Starting HP for enemies
  enemyHPPer2Waves: 1,     // Add 1 HP every 2 waves
  enemyBaseSpeed: 1,       // Base speed (pixels per frame)
  enemySpeedPerWave: 0.2,  // Additional speed per wave

  // Point System
  points: {
    enemyKill: 25,         // Points per enemy killed
    waveClear: 100,        // Bonus points for clearing a wave
    powerUp: 50,           // Points for picking a power-up
  },
};
