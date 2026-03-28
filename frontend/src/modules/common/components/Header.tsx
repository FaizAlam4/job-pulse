/**
 * Header Component
 * Main navigation header for JobPulse
 */

'use client';

import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ children }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">JobPulse</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Jobs
            </Link>
            <Link
              href="/top-jobs"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Top Jobs
            </Link>
            <Link
              href="/stats"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Stats
            </Link>
          </nav>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {children}
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              suppressHydrationWarning
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
