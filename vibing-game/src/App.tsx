import React, { useState } from "react";
import GameCanvas from "./GameCanvas";
import PowerUpModal from "./PowerUpModal";
import { synthwavePalette } from "./synthwavePalette";
import SynthwaveSunIcon from "./SynthwaveSunIcon";

export type WeaponType = "Directional" | "Radial" | "AutoAim";

function WeaponChoiceModal({ onSelect }: { onSelect: (type: WeaponType) => void }) {
  const choices: { type: WeaponType; label: string; desc: string }[] = [
    { type: "Directional", label: "Directional", desc: "Shoots in movement direction" },
    { type: "Radial", label: "Radial", desc: "Shoots in all directions" },
    { type: "AutoAim", label: "Auto-Aim", desc: "Shoots at nearest enemy" },
  ];
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div
        className="p-8 rounded-xl shadow-2xl flex flex-col items-center"
        style={{
          background: `linear-gradient(135deg, ${synthwavePalette.sunTop}, ${synthwavePalette.sunBottom})`,
        }}
      >
        <h2 className="text-3xl font-bold mb-4 text-white drop-shadow">
          Choose Your Weapon
        </h2>
        <div className="flex gap-8">
          {choices.map((c) => (
            <button
              key={c.type}
              className="px-6 py-3 rounded-lg font-bold text-xl text-white shadow-lg border-2 border-white hover:scale-110 transition flex flex-col items-center"
              style={{
                background: synthwavePalette.accent1,
                minWidth: 140,
              }}
              onClick={() => onSelect(c.type)}
            >
              <span>{c.label}</span>
              <span className="text-xs font-normal mt-1">{c.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [started, setStarted] = useState(false);
  const [wave, setWave] = useState(1);
  const [showPowerUp, setShowPowerUp] = useState(false);
  const [powerUps, setPowerUps] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [weaponType, setWeaponType] = useState<WeaponType | null>(null);
  const [showWeaponChoice, setShowWeaponChoice] = useState(false);

  function handleWaveClear(currentScore: number) {
    setScore(currentScore);
    setShowPowerUp(true);
  }

  function handlePowerUpSelect(power: string) {
    if (power === "Double Score") {
      setScore((prev) => prev * 2);
    }
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
    setWeaponType(null);
    setShowWeaponChoice(false);
    setScore(0);
  }

  function handleStart() {
    setShowWeaponChoice(true);
  }

  function handleWeaponSelect(type: WeaponType) {
    setWeaponType(type);
    setStarted(true);
    setShowWeaponChoice(false);
    setWave(1);
    setPowerUps([]);
    setGameOver(false);
    setShowPowerUp(false);
    setScore(0);
  }

  // Start screen
  if (!started && !showWeaponChoice) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{
          background: synthwavePalette.background,
          color: synthwavePalette.accent3,
        }}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="mb-8">
            <SynthwaveSunIcon />
          </div>
          <h1
            className="synthwave-text mb-4"
          >
            🎵 The Vibenator 🎵
          </h1>
          <p
            className="mb-6 text-lg max-w-xl text-center"
            style={{ color: synthwavePalette.accent1 }}
          >
            Step into the neon-soaked world of <b>The Vibenator</b>.<br />
            Dodge, shoot, and vibe your way through relentless waves of retro-futuristic enemies.<br />
            <span className="text-pink-400">
              Power up, chase the rhythm, and become the ultimate synthwave survivor.
            </span>
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
              Use <b>WASD</b> or <b>Arrow Keys</b> to move.
            </span>
          </footer>
        </div>
      </div>
    );
  }

  // Weapon choice modal
  if (showWeaponChoice) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{
          background: synthwavePalette.background,
          color: synthwavePalette.accent3,
        }}
      >
        <WeaponChoiceModal onSelect={handleWeaponSelect} />
      </div>
    );
  }

  // Main game UI
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: synthwavePalette.background,
        color: synthwavePalette.accent3,
      }}
    >
      <div className="mb-2">
        <SynthwaveSunIcon />
      </div>
      <h1 className="synthwave-text mb-2">
        🎵 The Vibenator 🎵
      </h1>
      <p className="mb-4 text-lg" style={{ color: synthwavePalette.accent1 }}>
        Survive the rhythm, power up, and vibe through endless waves!
      </p>
      {!gameOver && weaponType && (
        <GameCanvas
          onWaveClear={handleWaveClear}
          onGameOver={handleGameOver}
          wave={wave}
          powerUps={powerUps}
          weaponType={weaponType}
        />
      )}
      {showPowerUp && (
        <PowerUpModal onSelect={handlePowerUpSelect} score={score} />
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
          Use <b>WASD</b> or <b>Arrow Keys</b> to move.
        </span>
      </footer>
    </div>
  );
}

export default App;
