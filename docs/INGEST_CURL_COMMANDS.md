# Ingest API - CURL Commands

## Quick Start (Copy & Paste)

### 1. Default Ingestion (India + USA + UK)
```bash
curl -X POST http://localhost:3000/admin/ingest \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>"
```

### 2. India Only (Recommended for Free Tier)
```bash
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "country": "India"
  }'
```

### 3. India Only with More Jobs
```bash
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "country": "India",
    "query": "backend developer"
  }'
```

### 4. USA Jobs Only
```bash
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "country": "United States"
  }'
```

### 5. Remote Jobs Only
```bash
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "remote": true
  }'
```

### 6. Full-time Jobs (India)
```bash
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "country": "India",
    "jobType": "fulltime"
  }'
```

---

## Advanced Queries

### 7. Jobs Posted in Last Week (India)
```bash
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "country": "India",
    "timePeriod": "week"
  }'
```

### 8. Backend Jobs in Bangalore
```bash
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "country": "India",
    "location": "Bangalore",
    "query": "backend developer"
  }'
```

### 9. Frontend Developer Jobs (USA)
```bash
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "country": "United States",
    "query": "frontend developer"
  }'
```

### 10. Remote Full-Time Jobs (Any Country)
```bash
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "remote": true,
    "jobType": "fulltime"
  }'
```

---

## Fill Data Pipeline (Run These in Sequence)

### Step 1: Fill India Data
```bash
echo "📍 Fetching India jobs..."
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "country": "India",
    "query": "backend developer"
  }'
echo ""
```

### Step 2: Fill USA Data
```bash
echo "📍 Fetching USA jobs..."
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "country": "United States",
    "query": "backend developer"
  }'
echo ""
```

### Step 3: Fill UK Data
```bash
echo "📍 Fetching UK jobs..."
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "country": "United Kingdom",
    "query": "backend developer"
  }'
echo ""
```

### Step 4: Fetch Remote Jobs (All Countries)
```bash
echo "📍 Fetching remote jobs..."
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "remote": true
  }'
echo ""
```

### Complete Bash Script (Run All at Once)
Save as `ingest.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Job Ingestion Pipeline"
echo "================================="
echo ""


# India
echo "📍 Step 1: Fetching India jobs..."
curl -s -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{"country": "India"}' | jq '.data'
echo ""
sleep 2

# USA
echo "📍 Step 2: Fetching USA jobs..."
curl -s -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{"country": "United States"}' | jq '.data'
echo ""
sleep 2

# UK
echo "📍 Step 3: Fetching UK jobs..."
curl -s -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{"country": "United Kingdom"}' | jq '.data'
echo ""
sleep 2

# Remote
echo "📍 Step 4: Fetching Remote jobs..."
curl -s -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_ADMIN_API_KEY>" \
  -d '{"remote": true}' | jq '.data'
echo ""

echo "================================="
echo "✅ Ingestion Complete!"
```

**Run it:**
```bash
chmod +x ingest.sh
./ingest.sh
```

---

## Check Results

### View All Jobs
```bash
curl http://localhost:3000/jobs
```

### View Top Jobs
```bash
curl http://localhost:3000/jobs/top?limit=10
```

### View Job Statistics
```bash
curl http://localhost:3000/jobs/stats
```

### Search Jobs
```bash
curl "http://localhost:3000/jobs/search?q=backend"
```

### Filter by Country
```bash
curl "http://localhost:3000/jobs?country=India&limit=20"
```

### Filter by Remote
```bash
curl "http://localhost:3000/jobs?remote=true&limit=20"
```

### Filter by Multiple Criteria
```bash
curl "http://localhost:3000/jobs?country=India&remote=true&sortBy=score&order=desc"
```

---

## Useful Curl Flags

```bash
# Pretty print JSON output
curl [...] | jq .

# Save response to file
curl [...] -o output.json

# Show headers only
curl [...] -i

# Verbose (see all details)
curl [...] -v

# Silent mode (no progress)
curl -s [...]

# With timeout (seconds)
curl --max-time 30 [...]
```

---

## Example Responses

### Successful Ingestion
```json
{
  "success": true,
  "message": "Job ingestion pipeline executed",
  "filtersApplied": {
    "country": "India"
  },
  "data": {
    "fetched": 75,
    "deduplicated": 75,
    "saved": 65,
    "scored": 65,
    "archived": 0,
    "error": null
  }
}
```

### View Jobs Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Senior Backend Developer",
      "company": "TechCorp",
      "location": "Bangalore, India",
      "score": 85,
      "sourceUrl": "https://link-to-job.com",
      "postedAt": "2026-03-28T...",
      ...
    },
    ...
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 95,
    "limit": 20,
    "hasNextPage": true
  }
}
```

---

## Quick Reference Table

| Goal | Command |
|------|---------|
| **Fill all data** | See "Complete Bash Script" |
| **India only** | `curl -X POST http://localhost:3000/admin/ingest -H "Content-Type: application/json" -d '{"country": "India"}'` |
| **USA only** | `curl -X POST http://localhost:3000/admin/ingest -H "Content-Type: application/json" -d '{"country": "United States"}'` |
| **Remote jobs** | `curl -X POST http://localhost:3000/admin/ingest -H "Content-Type: application/json" -d '{"remote": true}'` |
| **View all** | `curl http://localhost:3000/jobs` |
| **Top jobs** | `curl http://localhost:3000/jobs/top` |
| **Stats** | `curl http://localhost:3000/jobs/stats` |

---

## Setup Instructions

### 1. Make sure backend is running
```bash
cd backend
npm start
```

### 2. Run ingestion (pick one)
```bash
# Simplest - uses defaults
curl -X POST http://localhost:3000/admin/ingest

# Or India only
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -d '{"country": "India"}'
```

### 3. Wait for response
You should see output like:
```
{
  "success": true,
  "data": {
    "fetched": 150,
    "deduplicated": 150,
    "saved": 142,
    "scored": 142,
    ...
  }
}
```

### 4. View data in frontend
Open http://localhost:3005 in browser
- Should see jobs list with scores
- Click on a job to see details with "Apply Now" link

---

## Troubleshooting

### Command: Already in Use
```bash
# Backend running on port 3000?
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change port
PORT=3001 npm start
```

### No Data Showing
```bash
# Check if jobs were saved
curl http://localhost:3000/jobs

# Check API key
echo $SERPAPI_KEY

# Check logs
# Look for errors in backend console
```

### Rate Limited
```bash
# If "quota exceeded" error:
# - Wait a moment
# - Check your SerpAPI dashboard
# - Reduce MAX_JOBS_PER_COUNTRY in .env
```

---

## Most Common Usage

### For Daily Updates
```bash
# Run this every 6 hours
curl -X POST http://localhost:3000/admin/ingest \
  -H "Content-Type: application/json" \
  -d '{"country": "India"}'
```

### For Initial Data Load
```bash
# Run this bash script once to fill database
#!/bin/bash
for country in "India" "United States" "United Kingdom"; do
  curl -s -X POST http://localhost:3000/admin/ingest \
    -H "Content-Type: application/json" \
    -d "{\"country\": \"$country\"}"
  sleep 2
done
```

### For Scheduled Task (Cron)
```bash
# Add to crontab every 6 hours
0 */6 * * * curl -s -X POST http://localhost:3000/admin/ingest -H "Content-Type: application/json" -d '{"country":"India"}'
```

Done! Pick a command and run it. 🚀
