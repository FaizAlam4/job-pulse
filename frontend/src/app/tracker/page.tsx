/**
 * Tracker Page
 * Application tracking and management (requires authentication)
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function TrackerPage() {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const lockVariants = {
    locked: { scale: 1, rotate: 0 },
    shake: {
      rotate: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 },
    },
  };

  const features = [
    {
      icon: '📊',
      title: 'Track Applications',
      description: 'Monitor your job applications from applied to offer',
    },
    {
      icon: '📝',
      title: 'Add Notes',
      description: 'Keep detailed notes for each application',
    },
    {
      icon: '⏰',
      title: 'Set Reminders',
      description: 'Never miss a follow-up or interview',
    },
    {
      icon: '📈',
      title: 'View Analytics',
      description: 'Track your application success rate',
    },
    {
      icon: '🎯',
      title: 'Organize Pipeline',
      description: 'Manage stages: Applied, Interview, Offer',
    },
    {
      icon: '🔄',
      title: 'Sync Everywhere',
      description: 'Access your tracker from any device',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Lock Icon with Animation */}
        <motion.div
          className="flex justify-center mb-8"
          variants={itemVariants}
        >
          <motion.div
            className="relative"
            variants={lockVariants}
            initial="locked"
            whileHover="shake"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            {/* Animated particles */}
            <motion.div
              className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute -bottom-2 -left-2 w-3 h-3 bg-indigo-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                delay: 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </motion.div>

        {/* Heading */}
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Application Tracker
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Sign up to track your job applications, set reminders, and never miss an opportunity!
          </p>
        </motion.div>

        {/* Features Horizontal Scroll */}
        <motion.div variants={itemVariants} className="mb-12">
          <div className="relative">
            {/* Scroll container */}
            <div className="flex gap-6 overflow-x-auto pb-4 px-1 snap-x snap-mandatory scrollbar-hide">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-shadow flex-shrink-0 w-72 snap-center"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
            
            {/* Gradient fade hint on right */}
            <div className="absolute top-0 right-0 bottom-4 w-24 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent pointer-events-none" />
            
            {/* Scroll hint arrow (visible on hover) */}
            <motion.div
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-500 text-white rounded-full p-2 shadow-lg pointer-events-none hidden md:block"
              animate={{
                x: [0, 10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          </div>
          
          {/* Scroll Indicator for Mobile */}
          <div className="flex justify-center gap-2 mt-4 md:hidden">
            {features.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"
              />
            ))}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-200 dark:border-slate-700"
          variants={itemVariants}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Ready to Organize Your Job Search?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Join thousands of job seekers tracking their applications efficiently
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg overflow-hidden"
              onHoverStart={() => setHoveredButton('signup')}
              onHoverEnd={() => setHoveredButton(null)}
              whileHover={{ scale: 1.05, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600"
                initial={{ x: '100%' }}
                animate={{ x: hoveredButton === 'signup' ? '0%' : '100%' }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Sign Up Free
              </span>
            </motion.button>

            <motion.button
              className="relative px-8 py-4 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-semibold text-lg shadow-lg border-2 border-gray-200 dark:border-slate-600"
              onHoverStart={() => setHoveredButton('signin')}
              onHoverEnd={() => setHoveredButton(null)}
              whileHover={{ scale: 1.05, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </span>
            </motion.button>
          </div>

          {/* Trust Indicators */}
          <motion.div
            className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                100% Private & Secure
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Setup in 30 seconds
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Decoration */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            Already have saved jobs? They'll be automatically synced when you sign up! 🎉
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
