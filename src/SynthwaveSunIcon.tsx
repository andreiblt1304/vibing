import React from "react";
import { synthwavePalette } from "./synthwavePalette";

// Helper to generate SVG arc path for a horizontal stripe
function arcPath(
  cx: number,
  cy: number,
  r: number,
  y: number,
  thickness: number,
  startAngle = 0,
  endAngle = Math.PI
) {
  const yTop = y - thickness / 2;
  const yBot = y + thickness / 2;
  const angleTop = Math.acos((cy - yTop) / r);
  const angleBot = Math.acos((cy - yBot) / r);
  const a1 = Math.max(startAngle, Math.min(endAngle, angleTop));
  const a2 = Math.max(startAngle, Math.min(endAngle, angleBot));
  const x1 = cx - r * Math.sin(a1);
  const y1 = cy - r * Math.cos(a1);
  const x2 = cx + r * Math.sin(a1);
  const y2 = cy - r * Math.cos(a1);
  const x3 = cx + r * Math.sin(a2);
  const y3 = cy - r * Math.cos(a2);
  const x4 = cx - r * Math.sin(a2);
  const y4 = cy - r * Math.cos(a2);
  return `
    M ${x1} ${y1}
    A ${r} ${r} 0 0 1 ${x2} ${y2}
    L ${x3} ${y3}
    A ${r} ${r} 0 0 0 ${x4} ${y4}
    Z
  `;
}

export default function SynthwaveSunIcon() {
  const cx = 110, cy = 110, r = 100;
  const stripeCount = 7;
  const stripeThickness = 10;
  const gap = 8;
  const stripes = [];
  for (let i = 0; i < stripeCount; ++i) {
    const y = 50 + i * (stripeThickness + gap);
    if (i === stripeCount - 1) {
      stripes.push(
        <path
          key={i}
          d={arcPath(cx, cy, r, y, stripeThickness, Math.PI * 0.15, Math.PI * 0.85)}
          fill={synthwavePalette.background}
        />
      );
    } else {
      stripes.push(
        <path
          key={i}
          d={arcPath(cx, cy, r, y, stripeThickness)}
          fill={synthwavePalette.background}
        />
      );
    }
  }
  return (
    <svg width="220" height="220" viewBox="0 0 220 220">
      <defs>
        <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={synthwavePalette.sunTop} />
          <stop offset="50%" stopColor={synthwavePalette.sunMid} />
          <stop offset="100%" stopColor={synthwavePalette.sunBottom} />
        </linearGradient>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="url(#sunGrad)"
        stroke="none"
      />
      {stripes}
    </svg>
  );
}
