# Fixing Slowness & Reload Issues

## Problem Summary
- Pages sometimes require multiple refreshes to load data
- Response times vary wildly: 1.4s (fast) to 42s (timeout)
- Different pages have different reliability

## Root Cause Analysis

### 1. **Notification Saga Bug** ✅ FIXED
The notifications module was using plain `fetch()` without any timeout handling:
```javascript
// ❌ BEFORE (Bad - no timeout)
function fetchNotificationsApi(page = 1, limit = 20): Promise<any> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/notifications?page=${page}&limit=${limit}`;
  return fetch(url)  // No timeout! Hangs indefinitely
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    });
}
```

**Fixed to:**
```javascript
// ✅ AFTER (Good - with timeout & caching)
import { smartGet } from '@/services/apiClient';

function fetchNotificationsApi(page = 1, limit = 20): Promise<any> {
  const url = `/notifications?page=${page}&limit=${limit}`;
  return smartGet(url).then(res => res.data);
}
```

**What smartGet does:**
- 🔒 **Network Timeout**: 10 seconds maximum
- 💾 **Cache Fallback**: Falls back to cached data if network takes >4 seconds
- 📴 **Offline Support**: Returns cached data immediately if offline
- 🔄 **Background Update**: Links network response in background while returning cache

### 2. **Slow Backend API Calls** 
The `/admin/ingest` endpoint makes synchronous calls to external APIs (SerpAPI) that can take 30-42+ seconds:
```javascript
// In fetcherService.js
for each page {
  const response = await axios.get('https://serpapi.com/search', {
    timeout: 15000  // 15 second timeout per request
  });
  await new Promise(resolve => setTimeout(resolve, 1000));  // 1 second delay
}
```

**Impact**: If frontend calls this, it will timeout (10s limit) before backend finishes

**Solution**: Make ingestion async/background (not blocking user requests)

### 3. **Inconsistent API Client Usage**
Three modules were making read requests with different strategies:
- ❌ **Notifications**: Plain `fetch()` - no timeout
- ⚠️ **Insights**: `apiClient.get()` - 10s timeout only
- ⚠️ **Tracking**: `apiClient.get()` - 10s timeout only
- ✓ **Jobs**: `smartGet()` - 10s timeout + 4s cache fallback

**Fixed:** All read operations now use `smartGet()` for consistent timeout & caching

## Changes Made

### File 1: Notification Saga
**Path:** `/frontend/src/modules/notifications/store/notificationSaga.ts`

Changed from plain `fetch()` to `smartGet()` with timeout & caching.

### File 2: Insights Service
**Path:** `/frontend/src/modules/insights/services/insightsService.ts`

All read operations now use `smartGet()`:
- `getOverviewStats()`
- `getApplicationTrends()`
- `getSourcesBreakdown()`
- `getSkillsAnalysis()`
- `getGoalsProgress()`

### File 3: Tracking Service
**Path:** `/frontend/src/modules/tracking/services/trackingService.ts`

All read operations now use `smartGet()`:
- `getTrackedJobs()`
- `getTrackedJob()`
- `getTrackingAnalytics()`
- `checkJobTracking()`

Write operations (POST, PATCH, DELETE) still use `apiClient` directly.

## How to Test

1. **Test Notifications:**
   ```bash
   # Notifications should now have timeout protection
   # Check browser console for cache logs like:
   # 📖 [Cache] Returning cached data: /notifications?page=1&limit=20
   # ⏱️ [Cache] Network slow, using cache: /notifications?...
   ```

2. **Test Other Pages:**
   - Insights page should load faster with cache
   - Tracking page should have timeout protection
   - Check browser Network tab for response times

3. **Test Offline Mode:**
   - Open DevTools → Network → Offline
   - Pages should load cached data instantly
   - Enables "offline-first" experience

## Performance Improvements

| Module | Before | After | Benefit |
|--------|--------|-------|---------|
| Notifications | ❌ No timeout | ✅ 10s timeout + cache | Won't hang indefinitely |
| Insights | ⚠️ 10s timeout | ✅ 10s timeout + 4s cache | Faster perceived load |
| Tracking | ⚠️ 10s timeout | ✅ 10s timeout + 4s cache | Faster perceived load |
| Jobs | ✓ Already good | ✓ Unchanged | Consistent with others |

## Backend Optimization (Future)

The 42-second delay comes from `/admin/ingest` calling external APIs synchronously. Consider:

1. **Make ingestion async:**
   ```javascript
   // Instead of blocking:
   POST /admin/ingest → wait 42s → return response
   
   // Better:
   POST /admin/ingest → return {status: 'processing'} → process in background
   ```

2. **Implement response caching:**
   - Cache SerpAPI responses for 1 hour
   - Reduce redundant external API calls

3. **Add request queuing:**
   - Use Bull or RabbitMQ for background jobs
   - Prevent concurrent API calls from overwhelming limits

## Best Practices Going Forward

✅ **DO:**
- Use `smartGet()` for read operations (automatic timeout + caching)
- Use `apiClient.get/post/patch/delete` for non-cached requests
- Test with Network throttling (Chrome DevTools > Network > Slow 3G)
- Monitor browser console for cache logs

❌ **DON'T:**
- Use plain `fetch()` without timeout handling
- Make synchronous external API calls in request handlers
- Load all data at once (use pagination)
- Skip error handling on API calls

## Related Files
- `/frontend/src/services/apiClient.ts` - Main timeout/caching logic
- `/frontend/src/constants/api.ts` - API endpoint constants
- `/frontend/src/modules/jobs/services/jobsService.ts` - Reference implementation
