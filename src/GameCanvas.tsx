import React, { useRef, useEffect, useState } from "react";
import { synthwavePalette } from "./synthwavePalette";
import playerImgSrc from "./assets/player.png";
import type { WeaponType } from "./App";
import { balance } from "./balance";

type Vec = { x: number; y: number };
type Bullet = { pos: Vec; vel: Vec; radius: number; from: "player" | "enemy" };
type EnemyRouteType =
  | "straight"
  | "zigzag"
  | "spiral"
  | "delayed"
  | "flankLeft"
  | "flankRight"
  | "surround";
type Enemy = {
  pos: Vec;
  hp: number;
  speed: number;
  flashTimer: number;
  routeType: EnemyRouteType;
  spawnFrame: number;
  spiralAngle?: number;
  flankAngle?: number;
  surroundAngle?: number;
  flankProgress?: number;
};
type Player = { pos: Vec; radius: number; hp: number };

// Increased canvas size
const CANVAS_W = 1200;
const CANVAS_H = 900;
const ENEMY_FLASH_FRAMES = 8;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function getDirection(from: Vec, to: Vec) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: dx / len, y: dy / len };
}

function getNearestEnemy(playerPos: Vec, enemies: Enemy[]): Enemy | null {
  let minDist = Infinity;
  let nearest: Enemy | null = null;
  for (const e of enemies) {
    const dist = Math.hypot(playerPos.x - e.pos.x, playerPos.y - e.pos.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = e;
    }
  }
  return nearest;
}

// Helper to pick a random route type, with some chance for flanking/surrounding
function randomRouteType(): EnemyRouteType {
  const types: EnemyRouteType[] = [
    "straight",
    "zigzag",
    "spiral",
    "delayed",
    "flankLeft",
    "flankRight",
    "surround",
  ];
  // Weight flank/surround a bit less common
  const weights = [2, 2, 1, 1, 1, 1, 1];
  const pool: EnemyRouteType[] = [];
  types.forEach((t, i) => {
    for (let j = 0; j < weights[i]; ++j) pool.push(t);
  });
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function GameCanvas({
  onWaveClear,
  onGameOver,
  wave,
  powerUps,
  weaponType,
}: {
  onWaveClear: (score: number) => void;
  onGameOver: (score: number) => void;
  wave: number;
  powerUps: string[];
  weaponType: WeaponType;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);

  // Game state
  const player = useRef<Player>({
    pos: { x: CANVAS_W / 2, y: CANVAS_H - 60 },
    radius: balance.playerRadius,
    hp: balance.playerHP,
  });
  const bullets = useRef<Bullet[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const keys = useRef<{ [k: string]: boolean }>({});

  // Power-up effects
  const [baseFireRate, setBaseFireRate] = useState(balance.directional.fireRate);
  const [playerSpeed, setPlayerSpeed] = useState(balance.playerSpeed);

  // Track last movement direction for bullet firing
  const lastMoveDir = useRef<Vec>({ x: 0, y: -1 });

  // Load player image and track load state
  const playerImg = useRef<HTMLImageElement | null>(null);
  const [playerImgLoaded, setPlayerImgLoaded] = useState(false);
  useEffect(() => {
    const img = new window.Image();
    img.src = playerImgSrc;
    img.onload = () => setPlayerImgLoaded(true);
    img.onerror = () => setPlayerImgLoaded(false);
    playerImg.current = img;
    return () => {
      setPlayerImgLoaded(false);
      playerImg.current = null;
    };
  }, []);

  // Reset player state on new game
  useEffect(() => {
    player.current = {
      pos: { x: CANVAS_W / 2, y: CANVAS_H - 60 },
      radius: balance.playerRadius,
      hp: balance.playerHP,
    };
    setScore(0);
    // eslint-disable-next-line
  }, [wave === 1 && powerUps.length === 0]);

  // Handle power-up application
  useEffect(() => {
    setBaseFireRate(balance.directional.fireRate);
    setPlayerSpeed(balance.playerSpeed);
    for (const p of powerUps) {
      if (p === "Rapid Fire") setBaseFireRate((f) => Math.max(4, f + balance.rapidFireBonus));
      if (p === "Speed Up") setPlayerSpeed((s) => s + balance.speedUpBonus);
      if (p === "Extra Life") player.current.hp += balance.extraLifeBonus;
    }
    // eslint-disable-next-line
  }, [wave, powerUps.join(",")]);

  // Input
  useEffect(() => {
    const down = (e: KeyboardEvent) => (keys.current[e.key] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.key] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Main game loop
  useEffect(() => {
    let frame = 0;
    let lastFire = 0;
    let waveCleared = false;
    let running = true;
    let animationId: number | null = null;

    // Calculate fireRate and projectile config based on weaponType
    let fireRate = baseFireRate;
    let bulletSpeed = balance.directional.bulletSpeed;
    let bulletRadius = balance.directional.bulletRadius;
    let numProjectiles = 1;

    if (weaponType === "Radial") {
      fireRate = balance.radial.fireRate;
      bulletSpeed = balance.radial.bulletSpeed;
      bulletRadius = balance.radial.bulletRadius;
      numProjectiles = balance.radial.numProjectiles;
    } else if (weaponType === "AutoAim") {
      fireRate = balance.autoAim.fireRate;
      bulletSpeed = balance.autoAim.bulletSpeed;
      bulletRadius = balance.autoAim.bulletRadius;
      numProjectiles = 1;
    }

    // Reset player for new wave (except HP if not first wave)
    if (wave === 1 && powerUps.length === 0) {
      player.current = {
        pos: { x: CANVAS_W / 2, y: CANVAS_H - 60 },
        radius: balance.playerRadius,
        hp: balance.playerHP,
      };
      setScore(0);
    } else {
      player.current.pos = { x: CANVAS_W / 2, y: CANVAS_H - 60 };
    }

    // Spawn enemies for this wave
    enemies.current = [];
    for (let i = 0; i < 4 + wave * 2; ++i) {
      const routeType = randomRouteType();
      let spiralAngle = undefined;
      let flankAngle = undefined;
      let surroundAngle = undefined;
      let flankProgress = undefined;
      if (routeType === "spiral") {
        spiralAngle = Math.random() * Math.PI * 2;
      }
      if (routeType === "flankLeft") {
        flankAngle = (Math.PI / 6) + (Math.random() * Math.PI / 18);
        flankProgress = 0;
      }
      if (routeType === "flankRight") {
        flankAngle = -(Math.PI / 6) - (Math.random() * Math.PI / 18);
        flankProgress = 0;
      }
      if (routeType === "surround") {
        surroundAngle = Math.random() * Math.PI * 2;
      }
      enemies.current.push({
        pos: {
          x: 60 + Math.random() * (CANVAS_W - 120),
          y: 60 + Math.random() * 200,
        },
        hp: balance.enemyBaseHP + Math.floor(wave / 2) * balance.enemyHPPer2Waves,
        speed: balance.enemyBaseSpeed + wave * balance.enemySpeedPerWave + Math.random(),
        flashTimer: 0,
        routeType,
        spawnFrame: 0,
        spiralAngle,
        flankAngle,
        surroundAngle,
        flankProgress,
      });
    }
    bullets.current = [];

    function loop() {
      if (!canvasRef.current) return;
      if (!running) return;
      const ctx = canvasRef.current.getContext("2d")!;
      // Draw synthwave background
      ctx.fillStyle = synthwavePalette.background;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // (Sun and palm silhouette removed, now handled by SynthwaveSunIcon in App)

      // Player movement
      let dx = 0,
        dy = 0;
      if (keys.current["ArrowLeft"] || keys.current["a"]) dx -= 1;
      if (keys.current["ArrowRight"] || keys.current["d"]) dx += 1;
      if (keys.current["ArrowUp"] || keys.current["w"]) dy -= 1;
      if (keys.current["ArrowDown"] || keys.current["s"]) dy += 1;
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        dx /= len;
        dy /= len;
        player.current.pos.x = clamp(
          player.current.pos.x + dx * playerSpeed,
          player.current.radius,
          CANVAS_W - player.current.radius
        );
        player.current.pos.y = clamp(
          player.current.pos.y + dy * playerSpeed,
          player.current.radius,
          CANVAS_H - player.current.radius
        );
        lastMoveDir.current = { x: dx, y: dy };
      }

      // Player auto-shooting (weaponType logic)
      if (frame - lastFire > fireRate) {
        if (weaponType === "Directional") {
          let dir = lastMoveDir.current;
          const dirLen = Math.hypot(dir.x, dir.y);
          let bulletVel: Vec;
          if (dirLen > 0.01) {
            bulletVel = { x: dir.x * bulletSpeed, y: dir.y * bulletSpeed };
          } else {
            bulletVel = { x: 0, y: -bulletSpeed };
          }
          bullets.current.push({
            pos: { ...player.current.pos },
            vel: bulletVel,
            radius: bulletRadius,
            from: "player",
          });
        } else if (weaponType === "Radial") {
          for (let i = 0; i < numProjectiles; ++i) {
            const angle = (2 * Math.PI * i) / numProjectiles;
            bullets.current.push({
              pos: { ...player.current.pos },
              vel: { x: Math.cos(angle) * bulletSpeed, y: Math.sin(angle) * bulletSpeed },
              radius: bulletRadius,
              from: "player",
            });
          }
        } else if (weaponType === "AutoAim") {
          const nearest = getNearestEnemy(player.current.pos, enemies.current);
          let dir: Vec;
          if (nearest) {
            dir = getDirection(player.current.pos, nearest.pos);
          } else {
            dir = { x: 0, y: -1 };
          }
          bullets.current.push({
            pos: { ...player.current.pos },
            vel: { x: dir.x * bulletSpeed, y: dir.y * bulletSpeed },
            radius: bulletRadius,
            from: "player",
          });
        }
        lastFire = frame;
      }

      // Update bullets
      for (const b of bullets.current) {
        b.pos.x += b.vel.x;
        b.pos.y += b.vel.y;
      }
      bullets.current = bullets.current.filter(
        (b) =>
          b.pos.x > -20 &&
          b.pos.x < CANVAS_W + 20 &&
          b.pos.y > -20 &&
          b.pos.y < CANVAS_H + 20
      );

      // Update enemies: move towards player with different route types
      for (const e of enemies.current) {
        if (e.spawnFrame === 0) e.spawnFrame = frame;
        const dir = getDirection(e.pos, player.current.pos);

        if (e.routeType === "straight") {
          e.pos.x += dir.x * e.speed;
          e.pos.y += dir.y * e.speed;
        } else if (e.routeType === "zigzag") {
          const perp = { x: -dir.y, y: dir.x };
          const freq = 0.08 + 0.02 * Math.random();
          const amp = 32 + 16 * Math.random();
          const t = (frame - e.spawnFrame) * freq;
          e.pos.x += dir.x * e.speed + perp.x * Math.sin(t) * (amp / 60);
          e.pos.y += dir.y * e.speed + perp.y * Math.sin(t) * (amp / 60);
        } else if (e.routeType === "spiral") {
          if (e.spiralAngle === undefined) e.spiralAngle = Math.random() * Math.PI * 2;
          const spiralSpeed = 0.13 + 0.05 * Math.random();
          const spiralRadius = 60 + 30 * Math.sin((frame - e.spawnFrame) * 0.03);
          e.spiralAngle += spiralSpeed;
          const centerDir = getDirection(e.pos, player.current.pos);
          e.pos.x += centerDir.x * (e.speed * 0.7);
          e.pos.y += centerDir.y * (e.speed * 0.7);
          e.pos.x += Math.cos(e.spiralAngle) * (spiralRadius / 60);
          e.pos.y += Math.sin(e.spiralAngle) * (spiralRadius / 60);
        } else if (e.routeType === "delayed") {
          const delayFrames = 40 + Math.floor(Math.random() * 30);
          if (frame - e.spawnFrame < delayFrames) {
            // Do nothing
          } else {
            e.pos.x += dir.x * (e.speed * 1.7);
            e.pos.y += dir.y * (e.speed * 1.7);
          }
        } else if (e.routeType === "flankLeft" || e.routeType === "flankRight") {
          if (e.flankAngle === undefined) {
            if (e.routeType === "flankLeft") {
              e.flankAngle = (Math.PI / 6) + (Math.random() * Math.PI / 18);
            } else {
              e.flankAngle = -(Math.PI / 6) - (Math.random() * Math.PI / 18);
            }
            e.flankProgress = 0;
          }
          const maxProgress = 1.0;
          const distToPlayer = Math.hypot(
            e.pos.x - player.current.pos.x,
            e.pos.y - player.current.pos.y
          );
          e.flankProgress = 1 - Math.min(distToPlayer / 400, 1);
          const baseAngle = Math.atan2(dir.y, dir.x);
          const angle = baseAngle + e.flankAngle * (1 - e.flankProgress!);
          const flankDir = { x: Math.cos(angle), y: Math.sin(angle) };
          e.pos.x += flankDir.x * e.speed;
          e.pos.y += flankDir.y * e.speed;
        } else if (e.routeType === "surround") {
          if (e.surroundAngle === undefined) e.surroundAngle = Math.random() * Math.PI * 2;
          const orbitRadius = 120 + 40 * Math.sin((frame - e.spawnFrame) * 0.01);
          e.surroundAngle += 0.025 + 0.01 * Math.random();
          const px = player.current.pos.x + Math.cos(e.surroundAngle) * orbitRadius;
          const py = player.current.pos.y + Math.sin(e.surroundAngle) * orbitRadius;
          const toOrbit = getDirection(e.pos, { x: px, y: py });
          e.pos.x += toOrbit.x * e.speed;
          e.pos.y += toOrbit.y * e.speed;
        }
        e.pos.x = clamp(e.pos.x, balance.enemyRadius, CANVAS_W - balance.enemyRadius);
        e.pos.y = clamp(e.pos.y, balance.enemyRadius, CANVAS_H - balance.enemyRadius);
      }

      // --- Enemy-Enemy Collision Resolution ---
      for (let i = 0; i < enemies.current.length; ++i) {
        for (let j = i + 1; j < enemies.current.length; ++j) {
          const a = enemies.current[i];
          const b = enemies.current[j];
          const dx = b.pos.x - a.pos.x;
          const dy = b.pos.y - a.pos.y;
          const dist = Math.hypot(dx, dy);
          const minDist = balance.enemyRadius * 2;
          if (dist > 0 && dist < minDist) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            a.pos.x -= nx * overlap;
            a.pos.y -= ny * overlap;
            b.pos.x += nx * overlap;
            b.pos.y += ny * overlap;
            a.pos.x = clamp(a.pos.x, balance.enemyRadius, CANVAS_W - balance.enemyRadius);
            a.pos.y = clamp(a.pos.y, balance.enemyRadius, CANVAS_H - balance.enemyRadius);
            b.pos.x = clamp(b.pos.x, balance.enemyRadius, CANVAS_W - balance.enemyRadius);
            b.pos.y = clamp(b.pos.y, balance.enemyRadius, CANVAS_H - balance.enemyRadius);
          }
        }
      }

      // Collisions: player bullets hit enemies
      for (const b of bullets.current.filter((b) => b.from === "player")) {
        for (const e of enemies.current) {
          const dist = Math.hypot(b.pos.x - e.pos.x, b.pos.y - e.pos.y);
          if (dist < b.radius + balance.enemyRadius) {
            e.hp -= 1;
            e.flashTimer = ENEMY_FLASH_FRAMES;
            b.pos.y = -9999;
          }
        }
      }
      enemies.current = enemies.current.filter((e) => e.hp > 0);

      // Collisions: enemies touch player (deal damage)
      for (const e of enemies.current) {
        const dist = Math.hypot(
          e.pos.x - player.current.pos.x,
          e.pos.y - player.current.pos.y
        );
        if (dist < player.current.radius + balance.enemyRadius) {
          player.current.hp -= 1;
          e.hp = 0;
        }
      }

      // Draw enemies
      for (const e of enemies.current) {
        if (e.flashTimer > 0) e.flashTimer--;

        ctx.beginPath();
        ctx.arc(e.pos.x, e.pos.y, balance.enemyRadius, 0, Math.PI * 2);
        ctx.fillStyle =
          e.flashTimer > 0
            ? "#ff2222"
            : synthwavePalette.enemy;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw player (as image if loaded, else fallback)
      if (
        playerImg.current &&
        playerImgLoaded &&
        playerImg.current.complete &&
        playerImg.current.naturalWidth > 0
      ) {
        const imgW = 48, imgH = 64;
        ctx.drawImage(
          playerImg.current,
          player.current.pos.x - imgW / 2,
          player.current.pos.y - imgH / 2,
          imgW,
          imgH
        );
      } else {
        ctx.beginPath();
        ctx.arc(
          player.current.pos.x,
          player.current.pos.y,
          player.current.radius,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = synthwavePalette.player;
        ctx.shadowColor = synthwavePalette.accent2;
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw bullets
      for (const b of bullets.current) {
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle =
          b.from === "player"
            ? synthwavePalette.bullet
            : synthwavePalette.accent1;
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw UI
      ctx.save();
      ctx.font = "bold 28px 'Orbitron', 'Arial Black', Arial, sans-serif";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#ffe156";
      ctx.shadowColor = "#fffbe0";
      ctx.shadowBlur = 6;
      ctx.fillText(`Wave: ${wave}`, 20, 40);
      ctx.fillText(`HP: ${player.current.hp}`, 20, 80);
      ctx.restore();

      // Game over
      if (player.current.hp <= 0) {
        running = false;
        if (animationId) cancelAnimationFrame(animationId);
        onGameOver(score);
        return;
      }

      // Wave clear
      if (!waveCleared && enemies.current.length === 0) {
        setScore((s) => {
          const newScore = s + 100 * wave;
          waveCleared = true;
          setTimeout(() => {
            running = false;
            if (animationId) cancelAnimationFrame(animationId);
            onWaveClear(newScore);
          }, 800);
          return newScore;
        });
        return;
      }

      setScore((s) => s + 1);

      if (running) {
        frame++;
        animationId = requestAnimationFrame(loop);
      }
    }

    running = true;
    animationId = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (animationId) cancelAnimationFrame(animationId);
    };
    // eslint-disable-next-line
  }, [wave, powerUps.join(","), playerImgLoaded, weaponType, baseFireRate]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-lg shadow-2xl border-4 border-pink-400"
        style={{ background: synthwavePalette.background }}
      />
    </div>
  );
}
