"use client";

interface Props {
  ratio: number; // 0-100 percentage
}

export function DTIGauge({ ratio }: Props) {
  // DTI ranges: <36% good, 36-43% acceptable, 43-50% risky, >50% bad
  const clampedRatio = Math.min(100, Math.max(0, ratio));
  const angle = (clampedRatio / 100) * 180; // 0-180 degrees
  const radians = ((180 - angle) * Math.PI) / 180;
  const needleX = 100 + 70 * Math.cos(radians);
  const needleY = 100 - 70 * Math.sin(radians);

  const color =
    ratio <= 36
      ? "#22c55e"
      : ratio <= 43
      ? "#f59e0b"
      : ratio <= 50
      ? "#f97316"
      : "#ef4444";

  const label =
    ratio <= 36
      ? "Healthy"
      : ratio <= 43
      ? "Acceptable"
      : ratio <= 50
      ? "High"
      : "Critical";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-[200px]">
        {/* Background arc segments */}
        <path d="M 20 100 A 80 80 0 0 1 92 20.2" fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" opacity={0.2} />
        <path d="M 92 20.2 A 80 80 0 0 1 134.4 26" fill="none" stroke="#f59e0b" strokeWidth="12" opacity={0.2} />
        <path d="M 134.4 26 A 80 80 0 0 1 157.6 43.6" fill="none" stroke="#f97316" strokeWidth="12" opacity={0.2} />
        <path d="M 157.6 43.6 A 80 80 0 0 1 180 100" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" opacity={0.2} />

        {/* Active arc */}
        <path
          d={`M 20 100 A 80 80 0 ${angle > 90 ? 1 : 0} 1 ${needleX} ${needleY}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Needle dot */}
        <circle cx={needleX} cy={needleY} r="6" fill={color} />
        <circle cx={needleX} cy={needleY} r="3" fill="white" />

        {/* Center text */}
        <text x="100" y="90" textAnchor="middle" className="text-2xl font-bold" fill={color} fontSize="28">
          {ratio.toFixed(0)}%
        </text>
        <text x="100" y="110" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11">
          {label}
        </text>

        {/* Scale labels */}
        <text x="18" y="115" fill="hsl(var(--muted-foreground))" fontSize="9">0%</text>
        <text x="172" y="115" fill="hsl(var(--muted-foreground))" fontSize="9">100%</text>
      </svg>
    </div>
  );
}
