# Job Pulse

A job aggregation platform that fetches listings from multiple sources (Google Jobs via SerpAPI, Remotive), deduplicates them, ranks by relevance, and provides a personal application tracker with analytics — all behind a documented REST API.

**Stack:** Next.js 15 · Fastify · MongoDB · Docker · Swagger/OpenAPI

---

## What It Does

- **Aggregates jobs** from Google Jobs + Remotive with configurable scheduling
- **Deduplicates** listings using content hashing
- **Ranks & scores** jobs by recency, relevance, and keyword match
- **Application tracker** — Kanban board with status pipeline (Saved → Applied → Interview → Offer)
- **Personal insights** — Response rates, trends, skills breakdown, streaks
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
| `GET /health` | Health check |

All endpoints are fully documented in Swagger UI at `/docs`.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret (32+ chars) |
| `SERPAPI_KEY` | No | Enables Google Jobs ingestion |
| `ADMIN_API_KEY` | No | Protects admin/ingest endpoint |
| `API_BASE_URL` | No | Public API URL (for Swagger server list) |

---

## License

MIT
