/**
 * Goal Progress Card Component
 * Displays progress toward a goal
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GoalProgressProps {
  label: string;
  current: number;
  target: number;
  icon?: React.ReactNode;
  color?: string;
  className?: string;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({
  label,
  current,
  target,
  icon,
  color = 'blue',
  className = '',
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      fill: 'bg-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      fill: 'bg-green-500',
      text: 'text-green-600 dark:text-green-400',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      fill: 'bg-purple-500',
      text: 'text-purple-600 dark:text-purple-400',
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      fill: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <div className={`p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className={colors.text}>{icon}</span>}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        </div>
        <span className={`text-sm font-bold ${isComplete ? 'text-green-600 dark:text-green-400' : colors.text}`}>
          {current}/{target}
        </span>
      </div>
      <div className={`h-2 rounded-full ${colors.bg} overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full ${isComplete ? 'bg-green-500' : colors.fill}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {isComplete && (
        <motion.div
          className="flex items-center gap-1 mt-2"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Goal completed!
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default GoalProgress;
