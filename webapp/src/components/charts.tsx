import { useId } from "react";
import { formatCompact } from "@/lib/format";

export interface SeriesPoint {
  label: string;
  value: number;
}

function buildPath(points: number[], width: number, height: number, pad = 6) {
  if (!points.length) return { line: "", area: "" };
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((value, index) => {
    const x = pad + index * step;
    const y = height - pad - (value / max) * (height - pad * 2);
    return [x, y] as const;
  });

  let line = `M ${coords[0][0]} ${coords[0][1]}`;
  for (let i = 1; i < coords.length; i += 1) {
    const [px, py] = coords[i - 1];
    const [x, y] = coords[i];
    const cx = (px + x) / 2;
    line += ` C ${cx} ${py} ${cx} ${y} ${x} ${y}`;
  }
  const area = `${line} L ${coords[coords.length - 1][0]} ${height} L ${coords[0][0]} ${height} Z`;
  return { line, area };
}

export function AreaChart({
  data,
  height = 220,
  currency = "NGN",
  showGrid = true,
}: {
  data: SeriesPoint[];
  height?: number;
  currency?: string;
  showGrid?: boolean;
}) {
  const gradientId = useId().replace(/[:]/g, "");
  const width = 720;
  const values = data.map((point) => point.value);
  const { line, area } = buildPath(values, width, height, 10);
  const max = Math.max(...values, 1);
  const safeMax = max * 1.15;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-[220px] w-full"
        role="img"
        aria-label={`Chart of ${data.length} points, peak ${formatCompact(max, currency)}`}
      >
        <defs>
          <linearGradient id={`fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#101010" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#101010" stopOpacity="0" />
          </linearGradient>
        </defs>

        {showGrid
          ? [0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={0}
                x2={width}
                y1={height * ratio}
                y2={height * ratio}
                stroke="#efefef"
                strokeWidth="1"
              />
            ))
          : null}

        {values.length > 1 ? (
          <>
            <path d={area} fill={`url(#fill-${gradientId})`} />
            <path
              d={line}
              fill="none"
              stroke="#101010"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </>
        ) : null}
      </svg>

      <div className="mt-3 flex justify-between">
        {data.map((point) => (
          <span key={point.label} className="font-mono text-3xs text-ink-muted">
            {point.label}
          </span>
        ))}
      </div>
      <p className="mt-2 font-mono text-3xs text-ink-faint">
        peak {formatCompact(safeMax / 1.15, currency)}
      </p>
    </div>
  );
}

export function BarChart({
  data,
  height = 160,
  currency = "NGN",
}: {
  data: SeriesPoint[];
  height?: number;
  currency?: string;
}) {
  const max = Math.max(...data.map((point) => point.value), 1);
  return (
    <div>
      <div
        className="flex items-end gap-2"
        style={{ height }}
        role="img"
        aria-label="Bar chart"
      >
        {data.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
            <span className="font-mono text-3xs text-ink-muted">
              {point.value > 0 ? formatCompact(point.value, currency) : ""}
            </span>
            <div
              className="w-full rounded-t-[6px] bg-gradient-to-t from-[#e6e6e6] to-ink transition-all"
              style={{
                height: `${Math.max(3, (point.value / max) * (height - 34))}px`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((point) => (
          <span
            key={point.label}
            className="flex-1 text-center font-mono text-3xs text-ink-muted"
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Donut({
  segments,
  size = 168,
  thickness = 18,
  centerLabel,
  centerValue,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label="Breakdown">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#efefef"
            strokeWidth={thickness}
          />
          {segments.map((segment) => {
            const length = (segment.value / total) * circumference;
            const dash = `${length} ${circumference - length}`;
            const element = (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += length;
            return element;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            {centerValue ? (
              <p className="tabular text-[19px] font-extrabold tracking-tight text-ink">
                {centerValue}
              </p>
            ) : null}
            {centerLabel ? (
              <p className="font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
                {centerLabel}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <ul className="space-y-2.5">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2.5 text-[12.5px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: segment.color }}
            />
            <span className="text-ink-soft">{segment.label}</span>
            <span className="tabular ml-auto font-semibold text-ink">
              {Math.round((segment.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sparkline({
  values,
  width = 96,
  height = 30,
  tone = "#101010",
}: {
  values: number[];
  width?: number;
  height?: number;
  tone?: string;
}) {
  const { line } = buildPath(values, width, height, 3);
  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <path d={line} fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HeatStrip({
  values,
  labels,
}: {
  values: number[];
  labels?: string[];
}) {
  const max = Math.max(...values, 1);
  return (
    <div>
      <div className="flex h-8 items-stretch gap-1">
        {values.map((value, index) => (
          <div
            key={index}
            title={`${labels?.[index] ?? index}: ${value}`}
            className="flex-1 rounded-[3px]"
            style={{
              background:
                value === 0
                  ? "#efefef"
                  : `rgba(16, 16, 16, ${0.14 + (value / max) * 0.8})`,
            }}
          />
        ))}
      </div>
      {labels ? (
        <div className="mt-2 flex gap-1">
          {labels.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="flex-1 text-center font-mono text-3xs text-ink-muted"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
