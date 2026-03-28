# Job Ingestion API Guide

## Overview

The updated job ingestion system now fetches significantly more job data (100+ jobs per run) from multiple countries with India as the primary focus. All jobs include external links for direct application.

## Key Updates

### 1. **Multi-page Pagination**
- `fetchFromGoogleJobs()` now uses SerpAPI pagination to fetch up to 50 jobs per country
- Previously: ~10 jobs per request
- Now: ~50-150 jobs per request (50 per country × 3 countries)

### 2. **Multi-country Coverage**
- Fetches from: **India** (primary), **United States**, **United Kingdom**
- Can be overridden per request with `country` parameter
- Ensures diverse but India-focused job listings

### 3. **External Links (sourceUrl)**
- All jobs include `sourceUrl` field with direct application link
- **Google Jobs**: Uses `apply_link` / `share_link` / `link`
- **Remotive**: Uses `url` field
- Frontend already displays this in job detail page under "Apply Now" button

### 4. **Smart Upsert (Update or Insert)** ⭐ NEW
- If a job already exists in the database (by hash), it's **updated** instead of skipped
- Prevents duplicate entries while keeping job data fresh
- Updates: `sourceUrl`, `description`, `salary`, `benefits`, `fetchedAt` timestamp
- Preserves original `createdAt`, `score` (will be re-scored)
- Example: 100 jobs fetched → 30 new inserted + 70 existing updated

## API Endpoints

### Trigger Ingestion
```bash
POST http://localhost:3000/admin/ingest
```

**Default behavior** (fetches from India, USA, UK):
```bash
curl -X POST http://localhost:3000/admin/ingest
```

**With specific country**:
```bash
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "country": "India",
    "query": "backend developer"
  }'
```

**All supported parameters**:
```bash
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "query": "backend developer",
    "country": "India",
    "location": "Bangalore",
    "remote": true,
    "jobType": "fulltime",
    "timePeriod": "week"
  }'
```

### Response Example
```json
{
  "success": true,
  "message": "Job ingestion pipeline executed",
  "filtersApplied": {
    "country": "India",
    "query": "backend developer"
  },
  "data": {
    "fetched": 147,
    "deduplicated": 142,
    "saved": 138,
    "scored": 138,
    "archived": 0,
    "error": null
  }
}
```

## Job Data Structure

Each ingested job includes:

```javascript
{
  _id: ObjectId,
  title: "Senior Backend Developer",
  company: "TechCorp",
  location: "Bangalore, India",
  description: "We are looking for...",
  source: "google-jobs" | "remotive",
  sourceUrl: "https://www.google.com/jobs/...", // ✅ Direct application link
  postedAt: Date,
  fetchedAt: Date,
  score: 0-100,               // Match score
  freshnessScore: Number,     // How recent the job is
  relevanceScore: Number,     // How relevant to backend dev
  isActive: true,
  salary: "₹12-18 LPA" | null,
  scheduleType: "Full-time" | null,
  workFromHome: true | false,
  healthInsurance: true | false,
  dentalCoverage: true | false,
  paidTimeOff: true | false,
  hash: "sha256hash...       // For deduplication
}
```

## Frontend Usage

### Job Detail Page (`/jobs/[id]`)
Shows:
- ✅ Job title, company, location
- ✅ Direct "Apply Now" button (links to `sourceUrl`)
- ✅ Score badge (0-100)
- ✅ Benefits (health insurance, dental, etc.)
- ✅ Similar jobs

### Jobs List Page (`/`)
Shows:
- ✅ Clickable job cards
- ✅ Score displayed in badge
- ✅ Location, posted date, company
- ✅ Skills (if available)

## Query Parameters

| Parameter | Type | Values | Default |
|-----------|------|--------|---------|
| `query` | string | Any job title | "backend developer" |
| `country` | string | "India", "United States", "United Kingdom" | All 3 (sequential) |
| `location` | string | City/Region name | "India" (for India) |
| `remote` | boolean | true/false | false |
| `jobType` | string | "fulltime", "parttime", "contract", "internship" | All |
| `timePeriod` | string | "yesterday", "3days", "week", "month" | All time |
| `radius` | number | km radius | Depends on location |

## Frontend API Filters

Users can filter jobs on the frontend via:

```bash
GET /jobs?country=India&location=Bangalore&remote=true&sortBy=score&order=desc
```

The backend filters by:
- Country/Location (regex matching on `location` field)
- Remote status
- Posted within X hours
- Skills (client-side filtering)
- Sort by: score, postedAt, company

## Performance Notes

- Each country fetch: ~30-40 seconds (with pagination)
- Total pipeline: ~120 seconds for 3 countries
- Database operations: ~30-60 seconds
- **Total ingestion time: ~3-4 minutes** for full multi-country run

## Troubleshooting

### No sourceUrl in response?
- Check that SerpAPI is returning `apply_link` / `share_link` / `link`
- Remotive always has `url` field
- Verify `sourceUrl` is in the database (check MongoDB)

### Only getting 10 jobs?
- The old pagination wasn't working
- Check logs for pagination errors
- Verify SerpAPI key is valid (no rate limit)

### Missing India-focused results?
- `fetchAllJobs()` defaults to fetching India first, then USA, UK
- Override with `?country=India` parameter
- Check SerpAPI response for `jobs_results`

## Database Query Examples

### Get all jobs with external links
```javascript
db.jobs.find({ sourceUrl: { $exists: true, $ne: null } })
```

### Get high-scoring India jobs
```javascript
db.jobs.find({ 
  location: /India/i, 
  score: { $gte: 70 },
  sourceUrl: { $exists: true }
}).sort({ score: -1 })
```

### Count jobs by country
```javascript
db.jobs.aggregate([
  { $group: { _id: "$location", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

## Next Steps

1. **Manual trigger**: `POST /admin/ingest`
2. **Check results**: `GET /jobs` should return 100+ jobs
3. **Click individual job**: Should show "Apply Now" button with working link
4. **Verify sourceUrl**: Check job detail API response includes `sourceUrl`
