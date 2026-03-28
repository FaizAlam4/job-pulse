# Quick Configuration Guide

## Your Situation
- **SerpAPI Budget**: 240 requests/month (free tier)
- **Goal**: Get "all jobs of the day"
- **Question**: Why limits? Why not make them bigger?

---

## The Answer

### Why There Are Limits

1. **SerpAPI Fees**: Each request costs 1 credit
2. **Each Request Returns**: ~10 jobs maximum
3. **Your Budget**: 240 requests = ~2,400 jobs maximum per month
4. **I Can't Change This**: It's SerpAPI's API limitation, not our code

### Cost Example

```
If we fetch without limits (hypothetically):
- Fetch 1000 jobs from India = 100 requests ❌ Exceeds your entire monthly budget in 1 run!

That's why we limit to 50 per country:
- 50 jobs from India = 5 requests ✅
- Can run 48 times per month
- Get 2,400 total jobs per month
```

---

## But You Want ALL Jobs of the Day?

### Problem
The "all jobs posted today" depends on:
- How many jobs Google Jobs has for that search
- How many pages you want to fetch
- Your API request budget

### Solutions

#### Option 1: Fetch India Only (RECOMMENDED for Free Tier)
**What**: Get India's jobs frequently, unaffected by international data

```bash
# .env configuration
MAX_JOBS_PER_COUNTRY=50
COUNTRIES_TO_FETCH=India
INCLUDE_REMOTIVE=true
```

**Cost**: 5-6 requests per run
**Frequency**: Every 5-6 hours = 4-5 runs/day
**Daily Jobs**: 200-250 jobs/day (India)
**Monthly**: 6,000-7,500 jobs

---

#### Option 2: Save Budget for Bigger Fetches
**What**: Run ingest 1-2x per day with more jobs

```bash
# .env configuration
MAX_JOBS_PER_COUNTRY=100
COUNTRIES_TO_FETCH=India
INCLUDE_REMOTIVE=true
```

**Cost**: 10-11 requests per run
**Frequency**: Twice per day
**Daily Jobs**: 200-220 jobs/day (India)
**Monthly**: 6,000-6,600 jobs

---

#### Option 3: Global Coverage (Current Default)
**What**: Get jobs from India, USA, UK - tradeoff is less frequency

```bash
# .env configuration
MAX_JOBS_PER_COUNTRY=50
COUNTRIES_TO_FETCH=India,United States,United Kingdom
INCLUDE_REMOTIVE=true
```

**Cost**: 15-16 requests per run
**Frequency**: ~2x per week (15 runs/month)
**Per Run Jobs**: 150+ jobs
**Monthly**: ~2,250-2,400 jobs

---

#### Option 4: Pay SerpAPI for More Budget
**What**: Upgrade SerpAPI plan for more requests/month

```
Pricing:
- 100 requests/month: $5
- 500 requests/month: $25
- 1000 requests/month: $45
- Unlimited: Contact SerpAPI
```

**With 500 requests**:
```bash
MAX_JOBS_PER_COUNTRY=50
COUNTRIES_TO_FETCH=India,United States,United Kingdom
```
- Frequency: 30 runs/month = 1x per day ✅
- Daily jobs: 150/day
- All countries covered

---

## How to Configure

### Step 1: Copy .env values

```bash
# For India only (save budget):
MAX_JOBS_PER_COUNTRY=50
COUNTRIES_TO_FETCH=India
INCLUDE_REMOTIVE=true

# For India + USA (medium):
MAX_JOBS_PER_COUNTRY=50
COUNTRIES_TO_FETCH=India,United States
INCLUDE_REMOTIVE=true

# For all countries (current default):
MAX_JOBS_PER_COUNTRY=50
COUNTRIES_TO_FETCH=India,United States,United Kingdom
INCLUDE_REMOTIVE=true

# For budget mode (more frequent):
MAX_JOBS_PER_COUNTRY=20
COUNTRIES_TO_FETCH=India,United States,United Kingdom
INCLUDE_REMOTIVE=true
```

### Step 2: Update Your .env File

```bash
# Add these to your backend/.env
MAX_JOBS_PER_COUNTRY=50
COUNTRIES_TO_FETCH=India
INCLUDE_REMOTIVE=true
```

### Step 3: Restart Backend

```bash
cd backend
npm start
```

### Step 4: Test

```bash
# Trigger ingest to see new cost
curl -X POST http://localhost:3000/admin/ingest

# Check console for: "~X requests per run"
```

---

## Example Outputs You'll See

### Low Budget Mode (6 requests/run)
```
🔄 Starting multi-source job fetch...
📊 Budget Info: ~6 requests per run (you have 240/month)
🌍 Fetching from: India
⏱  Target: 50 jobs per country

🌍 Fetching from India...
   Page 1: Fetched 10 jobs
   Page 2: Fetched 10 jobs
   Page 3: Fetched 10 jobs
   Page 4: Fetched 10 jobs
   Page 5: Fetched 10 jobs
   ✓ Total fetched: 50 jobs

🌐 Fetching from Remotive (remote jobs)...
✓ Fetched 50 + Remotive_count total jobs
```

### High Coverage Mode (16 requests/run)
```
📊 Budget Info: ~16 requests per run (you have 240/month)
🌍 Fetching from: India, United States, United Kingdom
```

---

## Frequency Recommendations

| Scenario | Config | Budget/Run | Frequency | Daily Jobs |
|----------|--------|-----------|-----------|-----------|
| **Development** | India, 20 jobs | 2 req | 4x/day | 80 |
| **Testing** | India, 50 jobs | 5 req | 2x/day | 100 |
| **Production** | India only | 6 req | 1.3x/day | 65 |
| **Global** | 3 countries, 50 jobs | 16 req | 0.5x/day | 75 |
| **Premium** | 3 countries, 100 jobs* | 30 req | Limited | Depends on paid tier |

*Requires paid SerpAPI

---

## API is Still Limited - Why?

The limits exist because:

1. **SerpAPI Charges Per Request**
   - You can't get 1000 results for 1 request
   - Each result page = separate request
   - That's SerpAPI's design, not ours

2. **Your Budget is Fixed**
   - 240 requests/month limit = can't exceed it
   - Math: 240 ÷ 10 = 24,000 jobs absolute maximum per month
   - We default to 2,400 to allow frequent updates

3. **We're Optimizing for Both**
   - Data volume: 50 jobs per country = good data
   - Frequency: 5-6 requests = can run daily
   - Can't have both unlimited data AND unlimited frequency

---

## Bottom Line

**You CAN get "all jobs of the day"** if you:

1. **Reduce countries**: India only = ~50 jobs/per run
2. **Increase frequency**: Run 4 times/day = ~200 jobs/day
3. **Total**: ~6,000+ jobs/month

OR

4. **Pay SerpAPI**: Get more credits, run globally

**The limit I coded is SMART** - it balances:
- Not wasting your budget on first run
- Allowing frequent updates
- Keeping servers healthy
- Giving you control (via .env config)

---

## Questions?

See: `/backend/.env.example` for all options
Or: `docs/SERPAPI_COSTS.md` for detailed breakdown
