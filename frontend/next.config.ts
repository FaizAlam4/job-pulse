import type { NextConfig } from "next";
// @ts-ignore - next-pwa doesn't have TypeScript definitions
import withPWA from "next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  register: false, // We handle registration manually in ServiceWorkerRegistrator
  skipWaiting: true,
  buildExcludes: [/manifest$/], // Don't generate manifest, use static one
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\..*\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-stylesheets",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /\/.*\.(js|css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
  disable: process.env.NEXT_PUBLIC_DISABLE_PWA === "true",
});

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default withPWAConfig(nextConfig);
