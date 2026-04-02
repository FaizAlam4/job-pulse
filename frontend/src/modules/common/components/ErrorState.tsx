/**
 * ErrorState Component
 * Displays error messages with optional retry action
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) => {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, rotate: -180, scale: 0 },
    visible: {
      opacity: 1,
      rotate: 0,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 },
    },
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <motion.div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Error Icon */}
      <motion.div
        className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center"
        variants={iconVariants}
      >
        <svg
          className="w-8 h-8 text-red-500 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </motion.div>

      {/* Error Title */}
      <motion.h3
        className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
        variants={childVariants}
      >
        {title}
      </motion.h3>

      {/* Error Message */}
      <motion.p
        className="text-gray-600 dark:text-gray-400 mb-6 max-w-md"
        variants={childVariants}
      >
        {message}
      </motion.p>

      {/* Retry Button */}
      {onRetry && (
        <motion.button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          variants={childVariants}
          whileHover="hover"
          whileTap="tap"
          custom={buttonVariants}
        >
          Try Again
        </motion.button>
      )}
    </motion.div>
  );
};

// Empty state variant
export const EmptyState: React.FC<{
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}> = ({
  title = 'No results found',
  message = 'Try adjusting your filters or search terms',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {/* Empty Icon */}
      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
