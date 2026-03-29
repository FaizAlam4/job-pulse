# Architecture Guide

## System Overview

The Job Intelligence Engine is built with a **layered architecture** that separates concerns and enables easy maintenance and extension.

## Architecture Layers

### 1. **API Layer** (Controllers + Routes)
- Handles HTTP requests from clients
- Validates input and returns responses
- Located in: `controllers/` and `routes/`

### 2. **Business Logic Layer** (Services)
- Implements core functionality
- Isolated, testable, reusable
- Located in: `services/`

### 3. **Data Layer** (Models)
- MongoDB schema definitions
- Database indexing
- Located in: `models/`

### 4. **Infrastructure Layer** (Config, Schedulers, Utils)
- Database connection management
- Periodic task scheduling
- Utility functions
- Located in: `config/`, `schedulers/`, `utils/`

## Data Flow

### Job Ingestion Pipeline

```
┌─────────────────────────────────────────────────────────┐
│ 1. fetcherService.js                                    │
│    └─ Fetches jobs from multiple sources                │
│       • Google Jobs (SerpAPI)                           │
│       • Remotive API                                    │
│       └─ Returns: raw job objects []                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. deduplicateService.js                                │
│    └─ Removes duplicates                                │
│       • Hash-based (title + company + location)        │
│       • Skip if already in database                    │
│       └─ Returns: unique jobs []                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Job.insertMany()                                     │
│    └─ Saves to MongoDB                                  │
│       └─ Returns: saved count                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. scoringService.js                                    │
│    └─ Scores all active jobs                           │
│       • Freshness: recency-based scoring               │
│       • Relevance: keyword matching                    │
│       • Combined score = weighted sum                  │
│       └─ Updates all jobs with scores                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. deduplicateService.archiveOldJobs()                 │
│    └─ Mark stale jobs as inactive                      │
│       └─ Returns: archived count                        │
└─────────────────────────────────────────────────────────┘
```

### Query Flow

```
User Request (GET /jobs?skills=node,express)
              ↓
        jobController.getAllJobs()
              ↓
        scoringService.filterJobs()
              ↓
        MongoDB Query (with indexes)
              ↓
        Apply filters locally if needed
              ↓
        Format and return response
```

## Key Design Decisions

### 1. Service-Based Architecture

**Why**: Separates business logic from HTTP handling. Each service is independently testable and reusable.

```javascript
// Service is decoupled from HTTP layer
const jobs = await fetchAllJobs();  // Can be called from API or scheduler

// Controller just handles HTTP concerns
export const getAllJobs = async (req, reply) => { ... }
```

### 2. Hash-Based Deduplication

**Why**: Efficient, reliable detection of duplicate jobs across sources.

```javascript
// Hash = SHA256(title + company + location)
// Unique, deterministic, collision-resistant
const hash = generateJobHash("Backend Engineer", "TechCo", "SF");
```

### 3. Weighted Scoring System

**Why**: Combines multiple ranking factors (freshness + relevance) with configurable weights.

```
score = (0.6 × freshness) + (0.4 × relevance)
```

Weights are configurable via environment variables for A/B testing.

### 4. Pre-Computed Scores

**Why**: Scores are calculated and stored in DB, enabling fast queries without real-time computation.

```javascript
// O(1) to get top jobs sorted by pre-computed score
Job.find({}).sort({ score: -1 })

// vs. computing on-the-fly for every query (O(n log n))
```

### 5. Cron-Based Scheduling

**Why**: Simple, reliable, built into Node.js ecosystem. No external job queue needed for MVP.

```javascript
// Runs every 3 hours automatically
cron.schedule('0 0 */3 * * *', async () => {
  await runJobIngestionPipeline();
});
```

### 6. MongoDB for Flexibility

**Why**: Document structure allows easy normalization of jobs from different sources.

**Schema Design:**
- Flexible `description` field (different sources have different fields)
- Metadata fields (`source`, `externalId`) for tracking
- Denormalized `keywords` and `score` for query performance

## API Design Principles

### RESTful Convention
```
GET  /jobs          - Get all jobs (read collection)
GET  /jobs/:id      - Get single job (read resource)
POST /admin/ingest  - Action (trigger side effect)
```

### Response Format
All responses follow consistent format:
```json
{
  "success": true|false,
  "data": {},
  "error": "error message (if success=false)",
  "pagination": {}  // for list endpoints
}
```

### Error Handling
```javascript
try {
  // logic
} catch (error) {
  reply.status(statusCode).send({
    success: false,
    error: error.message
  });
}
```

## Performance Optimizations

### Database Indexes

```javascript
// Queries that benefit from indexes:

// 1. Finding top jobs
Job.find({}).sort({ score: -1 })
// Index: score DESC

// 2. Time-based filtering
Job.find({ postedAt: { $gte: cutoffDate } })
// Index: postedAt DESC

// 3. Deduplication check
Job.findOne({ hash: "..." })
// Index: hash UNIQUE

// 4. Compound query
Job.find({}).sort({ postedAt: -1, score: -1 })
// Index: (postedAt DESC, score DESC)
```

### Query Optimization

```javascript
// Pagination - limit + skip
Job.find().limit(20).skip(0)

// Field selection - don't fetch unnecessary fields
Job.find().select('-description')  // Skip large description field

// Aggregation pipeline for statistics
Job.aggregate([...])  // Computed on-the-fly by MongoDB
```

### Caching Opportunities (Future)

```javascript
// Cache top jobs for 1 hour
const topJobs = Redis.get('top-jobs') || 
  await getTopJobs(10);

// Cache job stats for 24 hours
const stats = Redis.get('job-stats') || 
  await getJobStats();
```

## Error Handling Strategy

### 1. Service Layer
Services throw descriptive errors:
```javascript
if (!config.serpapiKey) {
  throw new Error('SerpAPI key not configured');
}
```

### 2. Controller Layer
Controllers catch and format errors:
```javascript
try {
  const jobs = await getTopJobs();
} catch (error) {
  reply.status(500).send({
    success: false,
    error: error.message
  });
}
```

### 3. Global Error Handling (Future)
Add Fastify error handler plugin for consistency:
```javascript
fastify.setErrorHandler((error, request, reply) => {
  // Centralized error formatting
});
```

## Extension Points

### Add New Job Source

1. Create fetcher function in `fetcherService.js`
2. Update `fetchAllJobs()` to include it
3. Normalize response to standard job format

```javascript
export const fetchFromLinkedIn = async () => {
  const raw = await axios.get('...');
  return raw.data.map(job => ({
    title: job.jobTitle,
    company: job.companyName,
    // ...
  }));
};
```

### Modify Scoring Algorithm

1. Update `calculateJobScore()` in `scoring.js`
2. Change weights in `.env`
3. Call `POST /admin/rescore` to update all jobs

### Add New API Endpoint

1. Create controller function in `controllers/jobController.js`
2. Register route in `routes/index.js`
3. Add documentation in README

```javascript
// 1. Controller
export const getJobsByCompany = async (req, reply) => {
  const { company } = req.params;
  const jobs = await Job.find({ company });
  reply.send({ success: true, data: jobs });
};

// 2. Route
fastify.get('/jobs/company/:company', getJobsByCompany);
```

## Database Schema Evolution

### Current Schema (Job Model)
```
{
  title: String (indexed)
  company: String (indexed)
  location: String (indexed)
  description: String
  postedAt: Date (indexed)
  source: String
  hash: String (unique indexed)
  score: Number (indexed)
  freshnessScore: Number
  relevanceScore: Number
  keywords: [String]
  isActive: Boolean (indexed)
  timestamps: { createdAt, updatedAt }
}
```

### Future Enhancements
- Add `salary` field with range validation
- Add `jobType` field (full-time, part-time, contract)
- Add `requiredExperience` field
- Add user preferences/bookmarks
- Add application tracking

## Testing Strategy (For Future)

```javascript
// Unit Tests
describe('calculateFreshnessScore', () => {
  test('jobs within 24h should score 1.0', () => {
    // ...
  });
});

// Integration Tests
describe('POST /admin/ingest', () => {
  test('should save jobs to database', () => {
    // ...
  });
});

// E2E Tests
describe('Job Search Flow', () => {
  test('full pipeline from fetch to query', () => {
    // ...
  });
});
```

## Monitoring & Observability (For Production)

### Metrics to Track
- Pipeline execution time
- Jobs fetched per source
- Deduplication ratio
- Query response time
- Error rates by endpoint

### Logging Strategy
```javascript
console.log('✓ Milestone reached');      // Success
console.warn('⚠ Warning condition');     // Warning
console.error('✗ Critical error');       // Error
```

### Health Checks
```
GET /health  // Basic liveness probe
GET /jobs/stats  // Detailed system health
```

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Client (Web/Mobile)             │
└──────────────────┬──────────────────────┘
                   │
                   ↓ HTTP
┌─────────────────────────────────────────┐
│    Fastify Server (Node.js)             │
│  ┌───────────────────────────────────┐  │
│  │ Routes / Controllers              │  │
│  │ Services / Utils                  │  │
│  │ Scheduler / Error Handler         │  │
│  └───────────────────────────────────┘  │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────┴─────────┐
         ↓                   ↓
    ┌─────────────┐   ┌──────────────┐
    │  MongoDB    │   │  External    │
    │  Database   │   │  APIs        │
    │             │   │ (SerpAPI,    │
    │  • Persist  │   │  Remotive)   │
    │  • Query    │   └──────────────┘
    │  • Index    │
    └─────────────┘
```

## Security Considerations

### Current Implementation
- No authentication (as requested)
- API keys in environment variables
- Basic input validation

### Production Hardening (Future)
- Rate limiting on ingestion endpoints
- JWT authentication for admin endpoints
- HTTPS encryption
- CORS configuration
- SQL injection / NoSQL injection prevention
- Request size limits

---

**Last Updated**: January 2024  
**Version**: 1.0.0
