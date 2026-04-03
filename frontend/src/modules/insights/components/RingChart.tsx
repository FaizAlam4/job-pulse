/**
 * Ring Chart Component
 * CSS-based circular progress/donut chart
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RingChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  className?: string;
}

export const RingChart: React.FC<RingChartProps> = ({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = 'stroke-blue-500',
  label,
  sublabel,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-gray-200 dark:stroke-slate-700"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={color}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-bold text-gray-900 dark:text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {percentage}%
          </motion.span>
        </div>
      </div>
      {label && (
        <div className="mt-2 text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          {sublabel && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{sublabel}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RingChart;
