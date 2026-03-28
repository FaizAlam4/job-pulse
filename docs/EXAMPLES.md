/**
 * Example API Usage
 * 
 * Run the server first: npm run dev
 * Then try these API calls in your terminal or Postman
 */

// ============================================
// 1. HEALTH CHECK
// ============================================

// Check if server is running
curl http://localhost:3000/health

// Response:
// {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}


// ============================================
// 2. GET API INFO
// ============================================

curl http://localhost:3000/info

// Response shows all available endpoints


// ============================================
// 3. GET TOP JOBS (Simple)
// ============================================

curl "http://localhost:3000/jobs/top?limit=5"

// Get top 5 highest-scored jobs


// ============================================
// 4. GET ALL JOBS WITH FILTERS
// ============================================

// Filter by location
curl "http://localhost:3000/jobs?location=California"

// Filter by skills
curl "http://localhost:3000/jobs?skills=node,express,mongodb"

// Filter by time AND skills
curl "http://localhost:3000/jobs?postedWithinHours=24&skills=backend"

// Pagination
curl "http://localhost:3000/jobs?limit=10&skip=0"

// Combined filters with pagination
curl "http://localhost:3000/jobs?location=New%20York&skills=typescript&postedWithinHours=48&limit=20"


// ============================================
// 5. GET SINGLE JOB
// ============================================

curl "http://localhost:3000/jobs/65a1b2c3d4e5f6g7h8i9j0k1"

// Replace the ID with an actual job ID from /jobs response


// ============================================
// 6. GET JOB STATISTICS
// ============================================

curl http://localhost:3000/jobs/stats

// Returns:
// {
//   "overall": {
//     "totalJobs": 500,
//     "avgScore": 0.72,
//     "newestJob": "2024-01-15T10:30:00.000Z",
//     "oldestJob": "2023-12-15T10:30:00.000Z"
//   },
//   "bySource": [
//     {"_id": "google-jobs", "count": 350},
//     {"_id": "remotive", "count": 150}
//   ],
//   "topLocations": [
//     {"_id": "San Francisco, CA", "count": 45},
//     {"_id": "New York, NY", "count": 38}
//   ]
// }


// ============================================
// 7. ADMIN: TRIGGER INGESTION MANUALLY
// ============================================

curl -X POST http://localhost:3000/admin/ingest

// Manually run the job fetching pipeline
// Response shows how many jobs were fetched, deduplicated, saved, etc.


// ============================================
// 8. ADMIN: RE-SCORE ALL JOBS
// ============================================

curl -X POST http://localhost:3000/admin/rescore

// Re-calculate scores for all jobs
// Useful after changing scoring weights in config


// ============================================
// BASH SCRIPT: Run Full Example
// ============================================

#!/bin/bash

echo "🚀 Job Pulse API Examples"
echo "========================="
echo ""

API_URL="http://localhost:3000"

echo "1️⃣  Checking health..."
curl -s $API_URL/health | jq .
echo ""

echo "2️⃣  Getting API info..."
curl -s $API_URL/info | jq .
echo ""

echo "3️⃣  Getting top 5 jobs..."
curl -s "$API_URL/jobs/top?limit=5" | jq .
echo ""

echo "4️⃣  Getting jobs with Node.js skill..."
curl -s "$API_URL/jobs?skills=node&limit=3" | jq .
echo ""

echo "5️⃣  Getting job stats..."
curl -s $API_URL/jobs/stats | jq .
echo ""

echo "✅ Examples complete!"
