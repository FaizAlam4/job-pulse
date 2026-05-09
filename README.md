# Job Pulse

[![CI](https://github.com/FaizAlam4/job-pulse/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/FaizAlam4/job-pulse/actions/workflows/ci.yml)

A job aggregation platform with **AI-powered resume analysis**. Fetches listings from multiple sources, deduplicates and ranks them, analyzes your resume against live jobs, and provides a full application tracker with analytics — all behind a documented REST API.

**Stack:** Next.js 15 · Fastify · MongoDB · Redis · Groq AI · Docker · Swagger/OpenAPI

---

## What It Does

- **AI Resume Analyzer** — Upload a PDF resume, get an ATS score, section-by-section improvement suggestions, extracted skills, and matched jobs from the database. Save analyses and revisit history. Powered by Groq (free tier, automatic model fallback)
- **Aggregates jobs** from Google Jobs + Remotive with configurable scheduling
- **Deduplicates** listings using content hashing
- **Ranks & scores** jobs by recency, relevance, and keyword match
- **Application tracker** — Kanban board with status pipeline (Saved → Applied → Interview → Offer)
- **Personal insights** — Response rates, trends, skills breakdown, streaks
- **Real-time notifications** — SSE-powered alerts when new jobs are ingested
- **PWA** — Offline-capable, installable, dark mode

---

## Quick Start (Docker)

### Prerequisites

- Docker & Docker Compose
- A MongoDB Atlas URI (free tier works) **OR** use the local-db profile

### 1. Clone & configure

```bash
git clone https://github.com/FaizAlam4/job-pulse.git
cd job-pulse
cp backend/.env.example .env
```

Edit `.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/jobpulse
JWT_SECRET=change-me-min-32-chars
SERPAPI_KEY=your-serpapi-key        # optional — needed for Google Jobs ingestion
```

### 2a. Run with Atlas (recommended)

```bash
docker compose up -d
```

- Frontend → http://localhost:3005
- Backend API → http://localhost:3000
- Swagger UI → http://localhost:3000/docs

### 2b. Run fully local (no Atlas needed)

```bash
docker compose --profile local-db -f docker-compose.yml -f docker-compose.local.yml up -d
```

This starts a local MongoDB container and overrides `MONGODB_URI` regardless of what's in your `.env`.

### 3. Seed demo data (optional)

```bash
docker compose exec backend node scripts/seedDemoUser.js
```

Login with `demo@jobpulse.com` / `Demo@123`

---

## Quick Start (Without Docker)

```bash
# Backend
cd backend && npm install
cp .env.example .env   # fill in values
npm run dev            # http://localhost:3000

# Frontend
cd frontend && npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local
npm run dev            # http://localhost:3001
```

---

## API Documentation (Swagger)

Once the backend is running, open:

```
http://localhost:3000/docs
```

Full OpenAPI 3.0 spec with request/response schemas, try-it-out functionality, and all endpoints documented.

---

## Project Structure

```
job-pulse/
├── backend/           Fastify API, Mongoose models, cron schedulers
│   ├── src/schemas/   Shared JSON schemas (validation + OpenAPI generation)
│   └── Dockerfile     Multi-stage production build
├── frontend/          Next.js 15 PWA, Redux Toolkit, Tailwind
│   └── Dockerfile     Multi-stage standalone build
├── docker-compose.yml           Default orchestration (Atlas)
├── docker-compose.local.yml     Override for fully-local MongoDB
└── docs/              Architecture, deployment, config guides
```

---

## Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /jobs` | List jobs (filters: country, remote, skills, sortBy) |
| `GET /jobs/search?q=react` | Full-text search |
| `GET /jobs/top` | Top-ranked jobs |
| `POST /auth/register` | Create account |
| `POST /auth/login` | Get JWT token |
| `GET /tracking` | Your tracked applications |
| `POST /tracking` | Track a job |
| `GET /insights/overview` | Personal analytics |
| `GET /notifications` | List notifications |
| `GET /notifications/unread-count` | Unread badge count |
| `PATCH /notifications/mark-all-read` | Mark all as read |
| `GET /events` | **SSE** — real-time job alerts |
| `POST /resume/analyze` | AI resume analysis (multipart form) |
| `GET /resume/status` | AI provider health check |
| `POST /resume/history` | Save an analysis result |
| `GET /resume/history` | List saved analyses |
| `GET /resume/history/:id` | View a saved analysis |
| `DELETE /resume/history/:id` | Delete a saved analysis |
| `GET /health` | Health check |

All endpoints are fully documented in Swagger UI at `/docs`.

---

## Real-Time Notifications (SSE)

The app broadcasts live notifications when new jobs are ingested:

```
GET /events  →  Server-Sent Events stream
```

**Events:**
- `connected` — connection established
- `new-jobs` — `{ "count": 10 }` when new jobs are saved
- `: ping` — keepalive every 25s

**Frontend integration:**
- `useSSE` hook auto-connects and dispatches Redux actions
- `NotificationBell` shows unread count badge
- Modal content updates in real-time (no refresh needed)

**Deduplication:** Notifications are deduplicated per hour + filter combination, so running the same ingest twice within an hour won't create duplicate alerts.

---

## AI Resume Analyzer

Upload a PDF resume and get AI-powered analysis with job matching.

**Features:**
- ATS compatibility score (0-100)
- Section-by-section improvement suggestions with priority levels
- Skill extraction from resume text
- Job matching against live listings in the database
- Save & revisit past analyses (up to 20 per user)
- Automatic model fallback for high availability

```bash
curl -X POST http://localhost:3000/resume/analyze \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "file=@resume.pdf" \
  -F "targetRole=Backend Developer" \
  -F "experienceLevel=3-5" \
  -F "locationPreference=Remote"
```

**Response:**
```json
{
  "overallScore": 78,
  "summary": "Strong technical resume with good project experience...",
  "extractedSkills": ["JavaScript", "Node.js", "MongoDB", "Docker"],
  "fixes": [
    {
      "section": "Experience",
      "issue": "Bullet points lack quantifiable metrics",
      "suggestion": "Add numbers: 'Reduced API latency by 40%'",
      "priority": "high"
    }
  ],
  "matchedJobs": [
    { "jobId": "abc123", "title": "Senior Engineer", "company": "Acme", "matchScore": 85, "reason": "Strong Node.js overlap" }
  ],
  "modelUsed": "llama-3.3-70b-versatile",
  "modelTier": "premium"
}
```

**Provider:** Groq (free tier)
- 30 requests/minute, 14,400/day
- Automatic fallback: `llama-3.3-70b` → `llama-4-scout-17b` → `llama-3.1-8b`
- ~200-300 resume analyses/day on free tier

**Setup:**
1. Get free API key at https://console.groq.com/keys
2. Set `GROQ_API_KEY` in `.env`
3. `AI_PROVIDER=groq` (default)

---

## Redis Caching Layer

Optional cache-aside (lazy-loading) layer using Redis. Fully toggleable — the app runs fine without it.

| What's cached | TTL | Invalidated on |
|---------------|-----|----------------|
| Job listings, search, top-ranked | 5–10 min | New ingestion, cleanup |
| Job detail | 30 min | — |
| Insights (overview, trends, skills, goals) | 5 min | Tracking mutations |
| Tracking list & analytics | 2 min | Track/update/delete |

**How it works:**
- Read path: check Redis → cache hit returns instantly, cache miss queries MongoDB and writes to cache
- Write path: mutating endpoints (`POST /tracking`, status changes, ingestion) invalidate related cache keys using `SCAN` (not `KEYS`)
- Graceful degradation: if Redis is down or not configured, all cache calls are safe no-ops

**Toggle caching:**
```bash
# Enable (set REDIS_URL in .env)
REDIS_URL=redis://localhost:6379

# Temporarily disable (keeps REDIS_URL but skips connection)
REDIS_ENABLED=false
```

Health check reports cache status: `GET /health` → `{ cache: "connected" | "disconnected" | "disabled" }`

---

## Testing

Backend test suite using **Vitest** + **mongodb-memory-server** — no external services needed.

```bash
cd backend

npm test              # run all tests
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

**183 tests** across 22 files — **81% statement coverage, 87% function coverage.**

| Layer | Files | Tests |
|-------|-------|-------|
| Unit | scoring, cache, config, apiKeyAuth, authMiddleware, database | 55 |
| Models | Job, User, Tracking, Notification | 29 |
| Services | scoring, dedup, notification, aggregation, fetcher | 31 |
| Controllers | auth, job, tracking, insights, notification | 62 |
| Schedulers | jobScheduler, notificationScheduler | 6 |

All DB-backed tests use an in-memory MongoDB instance and clean up after each test.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret (32+ chars) |
| `REDIS_URL` | No | Redis connection URL (enables caching) |
| `REDIS_ENABLED` | No | Set `false` to disable caching even with REDIS_URL |
| `SERPAPI_KEY` | No | Enables Google Jobs ingestion |
| `ADMIN_API_KEY` | No | Protects admin/ingest endpoint |
| `API_BASE_URL` | No | Public API URL (for Swagger server list) |
| `AI_PROVIDER` | No | `groq` (default) |
| `GROQ_API_KEY` | No | Groq API key (free at console.groq.com) |

---

## License

MIT
