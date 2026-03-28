# Job Pulse

> A production-grade Job Intelligence Engine with real-time aggregation, smart ranking, and beautiful dashboard.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![React](https://img.shields.io/badge/React-Next.js-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Features

- **Multi-Source Aggregation** - Fetches jobs from Google Jobs, Remotive, and more
- **Smart Ranking** - AI-powered scoring based on freshness and relevance
- **Advanced Filtering** - Location, skills, remote, time period filters
- **Deduplication** - Hash-based duplicate detection
- **Rate Limiting** - Production-ready API protection
- **Atlas Integration** - Cloud MongoDB with automated cleanup
- **Beautiful Dashboard** - Modern React UI (coming soon)

## 📁 Project Structure

```
job-pulse/
├── backend/           # Node.js + Fastify API
│   ├── src/
│   │   ├── config/       # Database & environment config
│   │   ├── controllers/  # Route handlers
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── schedulers/   # Cron jobs
│   │   └── utils/        # Helpers
│   ├── package.json
│   └── .env
├── frontend/          # Next.js Dashboard (coming soon)
├── docs/              # Documentation
└── README.md
```

## 🏃 Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Add your MongoDB URI & API keys
npm run dev
```

API runs at `http://localhost:3000`

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /jobs` | List jobs with filters |
| `GET /jobs/search?q=` | Full-text search |
| `GET /jobs/top` | Top-ranked jobs |
| `GET /jobs/stats` | Statistics |
| `GET /jobs/:id` | Job detail + similar jobs |
| `POST /admin/ingest` | Trigger job ingestion |
| `GET /info` | API documentation |

### Filters

```bash
# Database query filters
GET /jobs?country=usa&remote=true&skills=node,python

# Ingest filters (Google Jobs API)
POST /admin/ingest?location=San%20Francisco&timePeriod=week&jobType=fulltime
```

## 🛠 Tech Stack

**Backend:**
- Node.js + Fastify
- MongoDB Atlas
- SerpAPI (Google Jobs)
- Node-cron

**Frontend (planned):**
- Next.js 14
- Tailwind CSS
- React Query
- Recharts

## 📚 Documentation

See [docs/](./docs/) for detailed documentation:
- [Architecture](./docs/ARCHITECTURE.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Rate Limiting](./docs/RATE_LIMITING.md)
- [Quick Start](./docs/QUICKSTART.md)

## 📄 License

MIT - see [LICENSE](./LICENSE)
