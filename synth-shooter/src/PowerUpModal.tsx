import React from "react";
import { synthwavePalette } from "./synthwavePalette";

const POWER_UPS = [
  "Rapid Fire",
  "Speed Up",
  "Extra Life",
  "Double Score (not implemented)",
];

export default function PowerUpModal({
  onSelect,
}: {
  onSelect: (power: string) => void;
}) {
  // Pick 2 random power-ups
  const choices = React.useMemo(() => {
    const arr = [...POWER_UPS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 2);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div
        className="p-8 rounded-xl shadow-2xl flex flex-col items-center"
        style={{
          background: `linear-gradient(135deg, ${synthwavePalette.sunTop}, ${synthwavePalette.sunBottom})`,
        }}
      >
        <h2 className="text-3xl font-bold mb-4 text-white drop-shadow">
          Choose a Power-Up
        </h2>
        <div className="flex gap-8">
          {choices.map((p) => (
            <button
              key={p}
              className="px-6 py-3 rounded-lg font-bold text-xl text-white shadow-lg border-2 border-white hover:scale-110 transition"
              style={{
                background: synthwavePalette.accent1,
              }}
              onClick={() => onSelect(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
