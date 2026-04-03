# PWA & Caching Strategy

## Overview

The Job Pulse frontend implements a Progressive Web App (PWA) with intelligent caching for optimal offline experience and fast load times.

## Caching Strategies

### Smart API Caching (`smartGet`)

Located in: `frontend/src/services/apiClient.ts`

The `smartGet` function implements a **Cache-First-When-Offline + Network-First-When-Online** strategy:

```
┌─────────────────────────────────────────────────────────────┐
│                    smartGet() Flow                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐                                           │
│  │ Check Online │                                           │
│  └──────┬───────┘                                           │
│         │                                                    │
│    ┌────▼────┐     ┌─────────────────────────────────┐      │
│    │ Offline │ ──► │ Return cached data immediately  │      │
│    └────┬────┘     │ (0ms delay)                     │      │
│         │          └─────────────────────────────────┘      │
│    ┌────▼────┐                                              │
│    │ Online  │                                              │
│    └────┬────┘                                              │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────┐                   │
│  │ Race: Network vs Cache (4s timeout)  │                   │
│  └──────────────┬───────────────────────┘                   │
│                 │                                            │
│    ┌────────────┴────────────┐                              │
│    │                         │                              │
│    ▼                         ▼                              │
│ Network wins             Cache wins                         │
│ (< 4 seconds)            (network slow)                     │
│    │                         │                              │
│    ▼                         ▼                              │
│ Return fresh data       Return cached data                  │
│ + update cache          + background network update         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### When Cache Wins the Race

When cached data is returned before network responds, the background update **only updates the cache** — it does NOT update the UI:

```
Cache wins race
    │
    ├──► UI shows cached data (immediately)
    │
    └──► Network completes in background
              │
              └──► Updates IndexedDB cache (silently)
                        │
                        └──► User sees fresh data on NEXT visit/refresh
```

This means:
- **Current session**: User sees cached (potentially stale) data
- **Next visit**: User sees the freshly cached data from the background update
- **No jarring UI changes**: Data doesn't suddenly change while user is viewing it

### Behavior by Scenario

| Scenario | Behavior | Response Time |
|----------|----------|---------------|
| **Offline** (`navigator.onLine = false`) | Returns cached data immediately | ~0ms |
| **Online + Fast Network** (< 4s) | Uses fresh network data, caches it | Network RTT |
| **Online + Slow Network** (> 4s) | Returns cache, network updates in background | 4s |
| **Online + Network Fails** | Falls back to cached data | 4s + error handling |
| **No Cache + Offline** | Error thrown | Immediate |

### Configuration

```typescript
// frontend/src/services/apiClient.ts
const ONLINE_TIMEOUT = 10000;           // 10s max wait for network
const OFFLINE_FALLBACK_TIMEOUT = 4000;  // 4s before cache fallback
const CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 min between cleanups

// frontend/src/services/indexedDBService.ts
const CACHE_TTL = 24 * 60 * 60 * 1000;  // 24h cache lifetime
const MAX_CACHE_SIZE_BYTES = 1024 * 1024 * 1024; // 1GB max cache size
```

## IndexedDB Storage

Located in: `frontend/src/services/indexedDBService.ts`

### Database Schema

```
job-pulse-db (IndexedDB)
├── jobs (Object Store)
│   ├── keyPath: "_id"
│   └── index: "by-source" (source)
│
└── cache (Object Store)
    ├── keyPath: "key"
    └── index: "by-timestamp" (timestamp)
```

### Cache Entry Structure

```typescript
interface CacheEntry {
  key: string;      // API endpoint URL
  data: any;        // Response data
  timestamp: number; // When cached
  expiresAt: number; // TTL expiration
}
```

### Cache TTL

- Default: **24 hours** (`CACHE_TTL = 24 * 60 * 60 * 1000`)
- Max size: **1 GB** (`MAX_CACHE_SIZE_BYTES = 1024 * 1024 * 1024`)

### Cache Cleanup Strategy

Cache is automatically cleaned up to prevent IndexedDB from growing indefinitely:

| Cleanup Type | Trigger | Behavior |
|--------------|---------|----------|
| **Expired entries** | Every 30 minutes | Deletes entries older than 24 hours |
| **Max size limit** | Every 30 minutes | Deletes oldest entries when cache > 1GB |
| **On read** | When reading cache | Deletes entry if expired |

```
┌─────────────────────────────────────────────────────────┐
│           Cache Cleanup Flow (Size-based LRU)            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Every API call → Check if 30 min since last cleanup    │
│                            │                             │
│                    ┌───────▼───────┐                     │
│                    │ clearExpired  │                     │
│                    │ Cache()       │                     │
│                    └───────┬───────┘                     │
│                            │                             │
│                    ┌───────▼───────┐                     │
│                    │ enforceMax    │                     │
│                    │ CacheSize()   │                     │
│                    └───────┬───────┘                     │
│                            │                             │
│         ┌──────────────────┼──────────────────┐          │
│         │                  │                  │          │
│   size ≤ 1GB         size > 1GB                          │
│   (no action)        (delete oldest until ≤ 1GB)         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Manual Cache Clear

```typescript
import { clearAllCache } from '@/services/indexedDBService';

await clearAllCache(); // Clears all cached API responses
```

## Service Worker Caching

Located in: `frontend/next.config.ts` (next-pwa configuration)

### Runtime Caching Rules

| Pattern | Strategy | Cache Name | TTL |
|---------|----------|------------|-----|
| `https://api.*/**` | NetworkFirst | `api-cache` | 24h |
| `https://fonts.googleapis.com/**` | CacheFirst | `google-fonts-stylesheets` | 1 year |
| `https://fonts.gstatic.com/**` | CacheFirst | `google-fonts-webfonts` | 1 year |
| `/**/*.{js,css}` | StaleWhileRevalidate | `static-assets` | 24h |
| `/**/*.{png,jpg,jpeg,svg,gif,webp}` | CacheFirst | `images` | 30 days |

## Loading States & Skeletons

Located in: `frontend/src/modules/jobs/store/jobsSlice.ts`

### State Tracking

```typescript
interface JobsState {
  // ...data fields...
  
  // Loading states
  isLoading: boolean;
  isLoadingDetail: boolean;
  isLoadingStats: boolean;
  
  // Fetch tracking (prevents "no data" flash on initial load)
  hasFetchedJobs: boolean;
  hasFetchedTopJobs: boolean;
  hasFetchedStats: boolean;
  hasFetchedDetail: boolean;
}
```

### Skeleton Selectors

```typescript
// Show skeleton if loading OR haven't fetched yet
selectShouldShowJobsSkeleton = isLoading || !hasFetchedJobs
selectShouldShowTopJobsSkeleton = isLoading || !hasFetchedTopJobs
selectShouldShowStatsSkeleton = isLoadingStats || !hasFetchedStats
selectShouldShowDetailSkeleton = isLoadingDetail || !hasFetchedDetail
```

### Why This Matters

Without `hasFetched` tracking:
```
Page Load → jobs = [] → "No jobs found" flash → API returns → jobs show
```

With `hasFetched` tracking:
```
Page Load → showSkeleton = true → Skeleton shows → API returns → data shows
```

## Skeleton Components

Located in: `frontend/src/modules/common/components/Loader.tsx`

| Component | Usage |
|-----------|-------|
| `JobCardSkeleton` | Job list loading |
| `StatCardSkeleton` | Small stat cards |
| `LargeStatCardSkeleton` | Large stat cards with icons |
| `JobDetailSkeleton` | Full job detail page |
| `StatsPageSkeleton` | Stats page content |

## PWA Manifest

Located in: `frontend/public/manifest.json`

### Key Fields

```json
{
  "name": "Job Pulse - Remote Job Finder",
  "short_name": "Job Pulse",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#ffffff",
  "background_color": "#ffffff"
}
```

### Icons

- `icon-192.png` - Standard icon (192x192)
- `icon-512.png` - Large icon (512x512)
- `icon-maskable-192.png` - Maskable icon (192x192)
- `icon-maskable-512.png` - Maskable icon (512x512)

## Service Worker Registration

Located in: `frontend/src/app/ServiceWorkerRegistrator.tsx`

- Registers immediately on page load (no wait for `load` event)
- Checks for existing registration first
- Listens for `controllerchange` event
- Periodically checks for updates (every hour)
- Cleans up old/unused caches

## Testing Offline Mode

### Chrome DevTools

1. Open DevTools → Network tab
2. Check "Offline" checkbox
3. Reload page
4. Should see cached data load instantly

### Verify Cache

1. Open DevTools → Application tab
2. IndexedDB → `job-pulse-db`
3. Check `cache` object store for cached API responses

## Best Practices

1. **Always dispatch fetch actions on mount** - Let the caching layer handle offline
2. **Use `showSkeleton` selectors** - Prevents empty state flash
3. **Cache API responses with full URL** - Include query params for unique cache keys
4. **Background updates** - When cache wins the race, still complete network request to update cache
