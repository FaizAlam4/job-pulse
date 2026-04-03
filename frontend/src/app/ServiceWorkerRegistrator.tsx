'use client';

import { useEffect } from 'react';

/**
 * Service Worker Registrator
 * Registers the service worker immediately for PWA capabilities.
 * Uses skipWaiting and clientsClaim for instant activation.
 */
export const ServiceWorkerRegistrator = () => {
  useEffect(() => {
    // Check for service worker support
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('⚠️  [PWA] Service Worker not supported in this browser');
      return;
    }

    let updateInterval: NodeJS.Timeout | null = null;

    const registerServiceWorker = async () => {
      try {
        // Check if already registered
        const existingRegistration = await navigator.serviceWorker.getRegistration('/');
        if (existingRegistration) {
          console.log('✅ [PWA] Service Worker already registered:', existingRegistration.scope);
          // Force update check
          existingRegistration.update();
          return existingRegistration;
        }

        // Register new service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        console.log('✅ [PWA] Service Worker registered successfully:', registration.scope);

        // If there's an installing worker, wait for it to activate
        if (registration.installing) {
          const sw = registration.installing;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated') {
              console.log('✅ [PWA] Service Worker activated immediately');
            }
          });
        }

        // Check for updates periodically
        updateInterval = setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 [PWA] New version available');
                const event = new CustomEvent('sw-update-available');
                window.dispatchEvent(event);
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.error('❌ [PWA] Service Worker registration failed:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
      }
    };

    // Listen for controller change (SW takes control)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('✅ [PWA] Service Worker now controlling the page');
    });

    // Register immediately - don't wait for page load
    registerServiceWorker();

    // Clean up old caches
    const cleanupCaches = async () => {
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            if (!cacheName.includes('workbox') && !cacheName.includes('api-cache') && 
                !cacheName.includes('google-fonts') && !cacheName.includes('static-assets') && 
                !cacheName.includes('images') && !cacheName.includes('start-url') &&
                !cacheName.includes('dev')) {
              console.log(`🗑️  [PWA] Deleting old cache: ${cacheName}`);
              await caches.delete(cacheName);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️  [PWA] Cache cleanup failed:', error);
      }
    };

    cleanupCaches();

    // Cleanup on unmount
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, []);

  return null;
};
