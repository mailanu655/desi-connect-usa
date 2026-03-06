'use client';

import { useMemo } from 'react';

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  formatValue?: (v: number) => string;
}

/**
 * SVG-based analytics chart — bar chart with hover tooltips.
 * No external dependencies (pure React + SVG).
 */
export default function AnalyticsChart({
  data,
  height = 280,
  color = '#ea580c', // orange-600
  showGrid = true,
  showLabels = true,
  formatValue = (v) => v.toLocaleString(),
}: AnalyticsChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = 800;
    const chartHeight = height;
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const barWidth = Math.max(4, Math.min(40, (innerWidth / data.length) * 0.7));
    const barGap = (innerWidth - barWidth * data.length) / (data.length + 1);

    // Y-axis grid lines (5 levels)
    const gridLines = Array.from({ length: 5 }, (_, i) => {
      const value = Math.round((maxValue / 4) * i);
      const y = padding.top + innerHeight - (value / maxValue) * innerHeight;
      return { value, y };
    });

    const bars = data.map((d, i) => {
      const barHeight = (d.value / maxValue) * innerHeight;
      const x = padding.left + barGap + i * (barWidth + barGap);
      const y = padding.top + innerHeight - barHeight;
      return { ...d, x, y, width: barWidth, height: barHeight };
    });

    return { bars, gridLines, padding, chartWidth, chartHeight, innerWidth, innerHeight, maxValue };
  }, [data, height]);

  if (!chartData || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg" style={{ height }}>
        <p className="text-gray-400 text-sm">No data to display</p>
      </div>
    );
  }

  const { bars, gridLines, padding, chartWidth, chartHeight } = chartData;

  // Show every Nth label to avoid overlap
  const labelInterval = Math.max(1, Math.ceil(bars.length / 12));

  return (
    <div className="w-full overflow-x-auto" data-testid="analytics-chart">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        style={{ minWidth: Math.max(400, bars.length * 20) }}
        role="img"
        aria-label="Analytics bar chart"
      >
        {/* Grid lines */}
        {showGrid &&
          gridLines.map((gl) => (
            <g key={`grid-${gl.value}`}>
              <line
                x1={padding.left}
                y1={gl.y}
                x2={chartWidth - padding.right}
                y2={gl.y}
                stroke="#e5e7eb"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={gl.y + 4}
                textAnchor="end"
                className="text-xs"
                fill="#9ca3af"
                fontSize={11}
              >
                {formatValue(gl.value)}
              </text>
            </g>
          ))}

        {/* Bars */}
        {bars.map((bar, i) => (
          <g key={bar.date}>
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={Math.max(1, bar.height)}
              fill={color}
              rx={2}
              opacity={0.85}
              className="transition-opacity hover:opacity-100"
            >
              <title>{`${bar.label ?? bar.date}: ${formatValue(bar.value)}`}</title>
            </rect>

            {/* X-axis labels */}
            {showLabels && i % labelInterval === 0 && (
              <text
                x={bar.x + bar.width / 2}
                y={chartHeight - 8}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize={10}
                transform={`rotate(-30, ${bar.x + bar.width / 2}, ${chartHeight - 8})`}
              >
                {bar.date.length > 10 ? bar.date.slice(5) : bar.date}
              </text>
            )}
          </g>
        ))}

        {/* X-axis baseline */}
        <line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke="#d1d5db"
        />
      </svg>
    </div>
  );
}
