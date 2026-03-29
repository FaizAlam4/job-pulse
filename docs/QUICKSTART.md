# ⚡ Quick Start Guide

Get the Job Intelligence Engine running in 5 minutes.

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **MongoDB** ([local](https://www.mongodb.com/try/download/community) or [cloud](https://www.mongodb.com/cloud/atlas))

## 1. Clone & Install

```bash
cd /home/faiz/projects/job-pulse

# Install dependencies
npm install
```

## 2. Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Minimum Configuration:**
```env
MONGODB_URI=mongodb://localhost:27017/job-pulse
PORT=3000
```

**Optional (for Google Jobs):**
- Get SerpAPI key: https://serpapi.com/
- Add to `.env`: `SERPAPI_KEY=your_key_here`

## 3. Start MongoDB

```bash
# If MongoDB is installed locally
mongod

# OR use MongoDB Atlas (cloud)
# Just update MONGODB_URI in .env to your cloud URL
```

## 4. Start Server

```bash
# Development mode (auto-reload on file changes)
npm run dev

# Or production mode
npm start
```

**You should see:**
```
╔════════════════════════════════════╗
║   Job Intelligence Engine Started   ║
╚════════════════════════════════════╝

✓ Server running on http://localhost:3000
✓ Environment: development
✓ Database: mongodb://localhost:27017/job-pulse
```

## 5. Test the API

Open in browser or terminal:

```bash
# Health check
curl http://localhost:3000/health

# Get top jobs
curl http://localhost:3000/jobs/top?limit=5

# Trigger job fetching manually
curl -X POST http://localhost:3000/admin/ingest
```

## 📊 First Run

On startup:
1. Server connects to MongoDB
2. Scheduler initializes (runs every 3 hours)
3. You can manually trigger ingestion via `POST /admin/ingest`

**First ingestion will:**
- Fetch jobs from Remotive API (free, no key needed)
- Fetch from Google Jobs (if SerpAPI key configured)
- Save ~100-200 jobs to database
- Score and index them
- Be ready for queries

## 🧪 Common Queries

```bash
# Get all jobs
curl http://localhost:3000/jobs

# Top 10 jobs
curl http://localhost:3000/jobs/top

# Filter by skill
curl "http://localhost:3000/jobs?skills=node,express"

# Filter by location
curl "http://localhost:3000/jobs?location=california"

# Get stats
curl http://localhost:3000/jobs/stats

# Manually run pipeline
curl -X POST http://localhost:3000/admin/ingest
```

See [EXAMPLES.md](./EXAMPLES.md) for more examples.

## 📋 Project Structure

```
src/
├── config/          # Database & environment config
├── controllers/     # API request handlers
├── models/          # Job MongoDB schema
├── services/        # Business logic
├── routes/          # API routes
├── schedulers/      # Cron jobs
├── utils/           # Helpers & scoring
└── index.js        # Server entry point
```

## 🔧 Configuration Options

Edit `.env` to customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/job-pulse` | Database URL |
| `NODE_ENV` | development | dev/production mode |
| `SERPAPI_KEY` | (empty) | Google Jobs API key |
| `RECENCY_WEIGHT` | 0.6 | Weight for job freshness (0-1) |
| `RELEVANCE_WEIGHT` | 0.4 | Weight for keyword match (0-1) |
| `FETCH_INTERVAL_HOURS` | 3 | Scheduler interval |

## 📚 Documentation

- **[README.md](./README.md)** - Full documentation & API reference
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design & extension guide
- **[EXAMPLES.md](./EXAMPLES.md)** - API usage examples

## 🚀 Next Steps

1. **Set SerpAPI key** for Google Jobs data
2. **Modify keywords** in `scoringService.js` for your interests
3. **Adjust weights** in `.env` to prioritize freshness vs relevance
4. **Explore data** via MongoDB Compass for rich queries
5. **Deploy** on Heroku, Railway, or any Node.js hosting

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env or use a different port
PORT=3001 npm run dev
```

### MongoDB Connection Error
```bash
# Check MongoDB is running
mongod

# Or verify connection string in .env
# MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

### No Jobs in Database
```bash
# Manually trigger ingestion
curl -X POST http://localhost:3000/admin/ingest

# Check logs for errors
# May need SerpAPI key for Google Jobs
```

### High CPU on Scoring
Normal on first run with many jobs. Scores are computed once and cached in DB.

## 💡 Tips

- Use `GET /jobs/stats` to see data overview
- Check MongoDB Compass to browser database GUI
- Logs show pipeline progress: `Fetched → Deduplicated → Saved → Scored → Archived`
- Adjust `FETCH_INTERVAL_HOURS` in `.env` to control update frequency

---

**Ready to use!** Start with `npm run dev` and explore the API. 🎉
