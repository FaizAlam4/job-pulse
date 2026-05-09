/**
 * Mini Line Chart Component
 * SVG-based line chart for trends
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LineChartProps {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  showDots?: boolean;
  fillGradient?: boolean;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  labels,
  height = 80,
  color = '#3B82F6',
  showDots = true,
  fillGradient = true,
  className = '',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) return null;

  const width = 100; // percentage width
  const padding = 4;
  const max = Math.max(...data, 1);
  const min = 0;
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * (100 - padding * 2) + padding;
    const y = height - ((value - min) / range) * (height - padding * 2) - padding;
    return { x: `${x}%`, y, value };
  });

  const pathD = points
    .map((point, i) => {
      const x = parseFloat(point.x);
      return `${i === 0 ? 'M' : 'L'} ${x} ${point.y}`;
    })
    .join(' ');

  const areaD = `${pathD} L ${100 - padding}% ${height - padding} L ${padding}% ${height - padding} Z`;

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full relative ${className}`} style={{ height: height + 40, paddingTop: 32 }}>
      <svg width="100%" height={height} className="overflow-visible">
        {fillGradient && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
        )}

        {/* Area fill */}
        {fillGradient && (
          <motion.path
            d={areaD}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {/* Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />

        {/* Dots */}
        {showDots &&
          points.map((point, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Larger invisible hit area */}
              <circle
                cx={point.x}
                cy={point.y}
                r="10"
                fill="transparent"
              />
              <motion.circle
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === i ? 5 : 3}
                fill={color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.05 }}
              />
            </g>
          ))}
      </svg>

      {/* HTML Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: points[hoveredIndex].x,
            top: points[hoveredIndex].y + 32 - 44,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap">
            {labels?.[hoveredIndex]
              ? `${labels[hoveredIndex]}: ${points[hoveredIndex].value}`
              : points[hoveredIndex].value}
          </div>
        </div>
      )}
    </div>
  );
};

export default LineChart;
