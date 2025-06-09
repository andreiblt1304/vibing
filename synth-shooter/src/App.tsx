import React, { useState } from "react";
import GameCanvas from "./GameCanvas";
import PowerUpModal from "./PowerUpModal";
import { synthwavePalette } from "./synthwavePalette";

function App() {
  const [started, setStarted] = useState(false);
  const [wave, setWave] = useState(1);
  const [showPowerUp, setShowPowerUp] = useState(false);
  const [powerUps, setPowerUps] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  function handleWaveClear() {
    setShowPowerUp(true);
  }

  function handlePowerUpSelect(power: string) {
    setPowerUps((prev) => [...prev, power]);
    setWave((w) => w + 1);
    setShowPowerUp(false);
  }

  function handleGameOver(finalScore: number) {
    setGameOver(true);
    setScore(finalScore);
  }

  function handleRestart() {
    setWave(1);
    setPowerUps([]);
    setGameOver(false);
    setShowPowerUp(false);
    setStarted(false);
  }

  function handleStart() {
    setStarted(true);
    setWave(1);
    setPowerUps([]);
    setGameOver(false);
    setShowPowerUp(false);
    setScore(0);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: synthwavePalette.background,
        color: synthwavePalette.accent3,
      }}
    >
      {!started ? (
        <div className="flex flex-col items-center justify-center">
          <div className="mb-8">
            {/* Synthwave sun and palm for start screen */}
            <svg width="220" height="220" viewBox="0 0 220 220">
              <defs>
                <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={synthwavePalette.sunTop} />
                  <stop offset="50%" stopColor={synthwavePalette.sunMid} />
                  <stop offset="100%" stopColor={synthwavePalette.sunBottom} />
                </linearGradient>
              </defs>
              <circle
                cx="110"
                cy="100"
                r="90"
                fill="url(#sunGrad)"
                stroke="none"
              />
              {/* Sun stripes */}
              {[...Array(7)].map((_, i) => (
                <rect
                  key={i}
                  x="20"
                  y={70 + i * 18}
                  width="180"
                  height="8"
                  fill={synthwavePalette.background}
                />
              ))}
              {/* Palm trunk */}
              <rect
                x="104"
                y="120"
                width="12"
                height="60"
                rx="6"
                fill={synthwavePalette.palm}
              />
              {/* Palm leaves */}
              {[...Array(5)].map((_, i) => {
                const angle = (i - 2) * 0.5;
                const x1 = 110;
                const y1 = 130;
                const x2 = 110 + Math.cos(angle) * 50;
                const y2 = 130 + Math.sin(angle) * 30;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={synthwavePalette.palm}
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
          </div>
          <h1
            className="text-5xl font-extrabold mb-4 drop-shadow-lg"
            style={{
              color: synthwavePalette.sunTop,
              textShadow: "0 2px 16px #ff6ec7",
            }}
          >
            🌴 Synthwave Bullet Hell 🌴
          </h1>
          <p
            className="mb-6 text-lg max-w-xl text-center"
            style={{ color: synthwavePalette.accent1 }}
          >
            Survive endless waves of neon enemies, pick power-ups, and chase the high score.<br />
            <span className="text-pink-400">Palm tree colors. Roguelike resets. Pure synthwave vibes.</span>
          </p>
          <button
            className="px-10 py-4 rounded-xl font-bold text-2xl text-white shadow-lg border-2 border-white hover:scale-110 transition"
            style={{
              background: synthwavePalette.accent1,
              boxShadow: "0 0 32px #ff6ec7",
            }}
            onClick={handleStart}
          >
            Start Game
          </button>
          <footer className="mt-10 text-xs text-center opacity-60">
            <span>
              Use <b>WASD</b> or <b>Arrow Keys</b> to move, <b>Space</b> to shoot.
            </span>
          </footer>
        </div>
      ) : (
        <>
          <h1 className="text-4xl font-extrabold mb-2 drop-shadow-lg" style={{
            color: synthwavePalette.sunTop,
            textShadow: "0 2px 16px #ff6ec7"
          }}>
            🌴 Synthwave Bullet Hell 🌴
          </h1>
          <p className="mb-4 text-lg" style={{ color: synthwavePalette.accent1 }}>
            Survive waves, pick power-ups, and chase the high score!
          </p>
          {!gameOver && (
            <GameCanvas
              onWaveClear={handleWaveClear}
              onGameOver={handleGameOver}
              wave={wave}
              powerUps={powerUps}
            />
          )}
          {showPowerUp && (
            <PowerUpModal onSelect={handlePowerUpSelect} />
          )}
          {gameOver && (
            <div className="mt-8 flex flex-col items-center">
              <h2 className="text-3xl font-bold mb-2 text-pink-400 drop-shadow">
                Game Over
              </h2>
              <p className="mb-2 text-xl">Score: {score}</p>
              <button
                className="px-6 py-3 rounded-lg font-bold text-xl text-white shadow-lg border-2 border-white hover:scale-110 transition"
                style={{
                  background: synthwavePalette.accent1,
                }}
                onClick={handleRestart}
              >
                Back to Start
              </button>
            </div>
          )}
          <footer className="mt-8 text-xs text-center opacity-60">
            <span>
              Use <b>WASD</b> or <b>Arrow Keys</b> to move, <b>Space</b> to shoot.
            </span>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
