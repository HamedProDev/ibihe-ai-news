'use client';

import { useId } from 'react';

/**
 * Dependency-free SVG sparkline for price series.
 * Accessible: exposes min/max/current via <title> and aria-label.
 */
export function Sparkline({
  points,
  width = 220,
  height = 56,
  stroke = '#00c853',
  label,
}: {
  points: Array<{ at: string; pricePerKg: number }>;
  width?: number;
  height?: number;
  stroke?: string;
  label?: string;
}) {
  const id = useId();
  if (points.length < 2) {
    return <div className="text-white/30 text-xs">—</div>;
  }
  const values = points.map((p) => p.pricePerKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 4;
  const stepX = (width - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (p.pricePerKg - min) / span) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${coords.join(' L')}`;
  const area = `${line} L${width - pad},${height - pad} L${pad},${height - pad} Z`;
  const current = values[values.length - 1] ?? 0;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label ?? `min ${min}, max ${max}, current ${current} RWF per kg`}
      className="overflow-visible"
    >
      <title>{`min ${min.toLocaleString()} · max ${max.toLocaleString()} · ubu ${current.toLocaleString()} RWF/kg`}</title>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id}-fill)`} stroke="none" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle
        cx={pad + (points.length - 1) * stepX}
        cy={pad + (1 - (current - min) / span) * (height - pad * 2)}
        r="2.6"
        fill={stroke}
      />
    </svg>
  );
}
