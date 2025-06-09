import React, { useRef, useEffect, useState } from "react";
import { synthwavePalette } from "./synthwavePalette";

type Vec = { x: number; y: number };
type Bullet = { pos: Vec; vel: Vec; radius: number; from: "player" | "enemy" };
type Enemy = { pos: Vec; hp: number; speed: number; dir: Vec };
type Player = { pos: Vec; radius: number; hp: number };

const CANVAS_W = 800;
const CANVAS_H = 600;

function randomDir() {
  const a = Math.random() * Math.PI * 2;
  return { x: Math.cos(a), y: Math.sin(a) };
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export default function GameCanvas({
  onWaveClear,
  onGameOver,
  wave,
  powerUps,
}: {
  onWaveClear: () => void;
  onGameOver: (score: number) => void;
  wave: number;
  powerUps: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);

  // Game state
  const player = useRef<Player>({
    pos: { x: CANVAS_W / 2, y: CANVAS_H - 60 },
    radius: 18,
    hp: 3,
  });
  const bullets = useRef<Bullet[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const keys = useRef<{ [k: string]: boolean }>({});

  // Power-up effects
  const [fireRate, setFireRate] = useState(12); // lower is faster
  const [playerSpeed, setPlayerSpeed] = useState(5);

  // Reset player state on new game
  useEffect(() => {
    player.current = {
      pos: { x: CANVAS_W / 2, y: CANVAS_H - 60 },
      radius: 18,
      hp: 3,
    };
    setScore(0);
    // eslint-disable-next-line
  }, [wave === 1 && powerUps.length === 0]);

  // Handle power-up application
  useEffect(() => {
    setFireRate(12);
    setPlayerSpeed(5);
    for (const p of powerUps) {
      if (p === "Rapid Fire") setFireRate((f) => Math.max(4, f - 4));
      if (p === "Speed Up") setPlayerSpeed((s) => s + 2);
      if (p === "Extra Life") player.current.hp += 1;
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

    // Reset player for new wave (except HP if not first wave)
    if (wave === 1 && powerUps.length === 0) {
      player.current = {
        pos: { x: CANVAS_W / 2, y: CANVAS_H - 60 },
        radius: 18,
        hp: 3,
      };
      setScore(0);
    } else {
      player.current.pos = { x: CANVAS_W / 2, y: CANVAS_H - 60 };
    }

    // Spawn enemies for this wave
    enemies.current = [];
    for (let i = 0; i < 4 + wave * 2; ++i) {
      enemies.current.push({
        pos: {
          x: 60 + Math.random() * (CANVAS_W - 120),
          y: 60 + Math.random() * 200,
        },
        hp: 1 + Math.floor(wave / 2),
        speed: 1 + wave * 0.2 + Math.random(),
        dir: randomDir(),
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

      // Draw sun (centered horizontally, upper third)
      const sunY = 140;
      const sunR = 120;
      const grad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
      grad.addColorStop(0, synthwavePalette.sunTop);
      grad.addColorStop(0.5, synthwavePalette.sunMid);
      grad.addColorStop(1, synthwavePalette.sunBottom);
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, sunY, sunR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw sun stripes
      ctx.save();
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, sunY, sunR, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = synthwavePalette.background;
      ctx.lineWidth = 16;
      for (let i = 0; i < 7; ++i) {
        ctx.beginPath();
        ctx.moveTo(CANVAS_W / 2 - sunR, sunY - sunR / 2 + i * 24);
        ctx.lineTo(CANVAS_W / 2 + sunR, sunY - sunR / 2 + i * 24);
        ctx.stroke();
      }
      ctx.restore();

      // Draw palm silhouette (centered horizontally, below sun)
      ctx.save();
      ctx.translate(CANVAS_W / 2, sunY + 40);
      ctx.strokeStyle = synthwavePalette.palm;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 80);
      ctx.stroke();
      ctx.lineWidth = 8;
      for (let i = 0; i < 5; ++i) {
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(
          Math.cos((i - 2) * 0.5) * 60,
          20 + Math.sin((i - 2) * 0.5) * 40
        );
        ctx.stroke();
      }
      ctx.restore();

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
      }

      // Player auto-shooting
      if (frame - lastFire > fireRate) {
        bullets.current.push({
          pos: { ...player.current.pos },
          vel: { x: 0, y: -8 },
          radius: 6,
          from: "player",
        });
        lastFire = frame;
      }

      // Update bullets
      for (const b of bullets.current) {
        b.pos.x += b.vel.x;
        b.pos.y += b.vel.y;
      }
      // Remove offscreen bullets
      bullets.current = bullets.current.filter(
        (b) =>
          b.pos.x > -20 &&
          b.pos.x < CANVAS_W + 20 &&
          b.pos.y > -20 &&
          b.pos.y < CANVAS_H + 20
      );

      // Update enemies
      for (const e of enemies.current) {
        e.pos.x += e.dir.x * e.speed;
        e.pos.y += e.dir.y * e.speed;
        // Bounce off walls
        if (e.pos.x < 30 || e.pos.x > CANVAS_W - 30) e.dir.x *= -1;
        if (e.pos.y < 30 || e.pos.y > CANVAS_H / 2) e.dir.y *= -1;
      }

      // Collisions: player bullets hit enemies
      for (const b of bullets.current.filter((b) => b.from === "player")) {
        for (const e of enemies.current) {
          const dist = Math.hypot(b.pos.x - e.pos.x, b.pos.y - e.pos.y);
          if (dist < b.radius + 18) {
            e.hp -= 1;
            b.pos.y = -9999; // remove bullet
          }
        }
      }
      // Remove dead enemies
      enemies.current = enemies.current.filter((e) => e.hp > 0);

      // Collisions: enemies touch player (deal damage)
      for (const e of enemies.current) {
        const dist = Math.hypot(
          e.pos.x - player.current.pos.x,
          e.pos.y - player.current.pos.y
        );
        if (dist < player.current.radius + 18) {
          player.current.hp -= 1;
          e.hp = 0;
        }
      }

      // Draw enemies
      for (const e of enemies.current) {
        ctx.beginPath();
        ctx.arc(e.pos.x, e.pos.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = synthwavePalette.enemy;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw player
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
      ctx.font = "bold 24px monospace";
      ctx.fillStyle = synthwavePalette.accent3;
      ctx.fillText(`Wave: ${wave}`, 20, 40);
      ctx.fillText(`Score: ${score}`, 20, 70);
      ctx.fillText(`HP: ${player.current.hp}`, 20, 100);

      // Game over
      if (player.current.hp <= 0) {
        running = false;
        if (animationId) cancelAnimationFrame(animationId);
        onGameOver(score);
        return;
      }

      // Wave clear
      if (!waveCleared && enemies.current.length === 0) {
        setScore((s) => s + 100 * wave);
        waveCleared = true;
        setTimeout(() => {
          running = false;
          if (animationId) cancelAnimationFrame(animationId);
          onWaveClear();
        }, 800);
        return;
      }

      // Score increases with time
      setScore((s) => s + 1);

      if (running) {
        frame++;
        animationId = requestAnimationFrame(loop);
      }
    }

    // Start the loop
    running = true;
    animationId = requestAnimationFrame(loop);

    // Cleanup: stop the loop if component unmounts or wave changes
    return () => {
      running = false;
      if (animationId) cancelAnimationFrame(animationId);
    };
    // eslint-disable-next-line
  }, [wave, powerUps.join(",")]);

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
