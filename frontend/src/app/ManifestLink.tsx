'use client';

import { useEffect } from 'react';

/**
 * PWA Manifest & Meta Tags Injector
 * Ensures manifest link and PWA meta tags are present in the document head.
 * This runs immediately on mount to ensure PWA detection works on first load.
 */
export function ManifestLink() {
  useEffect(() => {
    // Ensure manifest link exists - critical for PWA detection
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      // Insert at the beginning of head for early detection
      document.head.insertBefore(manifestLink, document.head.firstChild);
      console.log('✅ [PWA] Manifest link injected');
    }

    // Ensure apple-touch-icon exists
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      appleIcon.href = '/icon-192.png';
      document.head.appendChild(appleIcon);
    }

    // List of meta tags to ensure are present
    const metaTags = [
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'Job Pulse' },
      { name: 'theme-color', content: '#ffffff' },
    ];

    // Add meta tags if they don't exist
    metaTags.forEach(({ name, content }) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    });

    console.log('✅ [PWA] Manifest and meta tags verified/injected');
  }, []);

  return null;
}

