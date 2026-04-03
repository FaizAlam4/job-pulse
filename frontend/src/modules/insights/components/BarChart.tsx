/**
 * Simple Bar Chart Component
 * CSS-based horizontal bar chart
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  maxValue?: number;
  showValues?: boolean;
  className?: string;
}

const defaultColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-indigo-500',
];

export const BarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
  showValues = true,
  className = '',
}) => {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`space-y-3 ${className}`}>
      {data.map((item, index) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-24 text-sm text-gray-600 dark:text-gray-400 truncate">
            {item.label}
          </div>
          <div className="flex-1 h-6 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${item.color || defaultColors[index % defaultColors.length]}`}
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            />
          </div>
          {showValues && (
            <div className="w-12 text-sm font-medium text-gray-900 dark:text-white text-right">
              {item.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BarChart;
