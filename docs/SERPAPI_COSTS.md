# SerpAPI Cost & Limitations Explained

## TL;DR
- **Your limit**: 240 API requests/month = ~8/day
- **Current setup**: ~15-16 requests per full run
- **Your runs**: 240 ÷ 16 = **15 full runs per month** (~0.5 per day)
- **Better strategy**: Run 1-2 times per day = **30-60 jobs/day** instead of 150/day

---

## How SerpAPI Charges (Cost Model)

### What is an API Request?

Each **HTTP call to SerpAPI = 1 request counted** against your 240/month limit.

**1 request returns ~10 jobs** from Google Jobs API.

### Cost Per Ingestion Run

```
Current Implementation:
├── India (50 jobs)
│   └── 50 ÷ 10 per page = 5 requests
├── USA (50 jobs)
│   └── 50 ÷ 10 per page = 5 requests
├── UK (50 jobs)
│   └── 50 ÷ 10 per page = 5 requests
└── Remotive (free API)
    └── 1 request

TOTAL PER RUN: 15-16 SerpAPI requests
```

### Your Monthly Budget

```
Total: 240 requests/month
Per run: 15-16 requests

240 ÷ 16 = 15 full runs/month
15 runs ÷ 30 days = 0.5 runs/day

150 jobs/run × 15 runs = 2,250 jobs/month MAX
```

---

## Why Are There Limits?

### 1. **SerpAPI Pricing Limitation**
- You can't change SerpAPI's request system
- **1 API call = 1 request** in your quota
- Each page of 10 results costs 1 request
- **You pay per request**, not per result

### 2. **Why 50 jobs per country (not 1000)?**
- 1000 jobs would need: `1000 ÷ 10 = 100 requests`
- That would be too expensive
- Running once would consume your entire 240-request monthly budget!

### 3. **Why 3 countries (not all)?**
- Each country needs multiple requests
- More countries = more requests = fewer total runs
- 3 countries (15 requests) is a balance between:
  - Diversity (multiple countries)
  - Frequency (can run multiple times/month)

---

## Cost Analysis: Different Configurations

### Configuration A: CURRENT (50 jobs × 3 countries)
```
Per run: 15 requests
Runs/month: 16
Jobs/month: 2,400
Cost: Good - balanced
Best for: Daily updates with reasonable data volume
```

### Configuration B: HIGH VOLUME (100 jobs × 3 countries)
```
Per run: 30 requests
Runs/month: 8
Jobs/month: 2,400
Cost: Same total jobs, but fewer updates
Problem: Can only run 2x per week
```

### Configuration C: DATA MAXIMIZER (150 jobs × 1 country - India only)
```
Per run: 15 requests
Runs/month: 16
Jobs/month: 2,400
Cost: Same as current
Benefit: All India jobs, same update frequency
```

### Configuration D: BUDGET FRIENDLY (20 jobs × 3 countries)
```
Per run: 6 requests
Runs/month: 40
Jobs/month: 2,400
Cost: More frequent updates, less per run
Best for: Live updates, keep data fresh
```

---

## Request Calculation Formula

```
Total Requests = (Jobs_India ÷ 10) + (Jobs_USA ÷ 10) + (Jobs_UK ÷ 10) + 1
               = (50 ÷ 10) + (50 ÷ 10) + (50 ÷ 10) + 1
               = 5 + 5 + 5 + 1
               = 16 requests

Monthly Runs = 240 ÷ 16 = 15
```

---

## Why Can't You Just Make It Bigger?

### Option 1: Get More SerpAPI Credits
✅ **Cost**: Pay SerpAPI for more credits
- 100 requests = $50/month
- 500 requests = $200/month
- Unlimited = Custom pricing
📞 Contact SerpAPI for paid plans

### Option 2: Optimize Current Setup
✅ **Cost**: Free - just adjust configuration
- Reduce countries (fewer requests)
- Reduce jobs per country (fewer requests)
- Add batch scheduling (use budget efficiently)

### Option 3: Use Alternative Data Sources
✅ **Cost**: Depends on source
- **Remotive** (free, no request limit)
- **LinkedIn API** (paid, complex auth)
- **Workable** (free tier available)
- **Lever** (company-specific)

### Option 4: Cache Smarter
✅ **Cost**: Free - server-side caching
- Fetch once, cache for 24 hours
- Skip duplicate pages
- Deduplicate inside DB before requesting

---

## Optimization Recommendations

### Option A: Stay With Free SerpAPI Tier
**Best for**: Starting out, testing

**Recommended Setup:**
```javascript
// Fetch only India + Remotive (lowest cost)
fetchAllJobs({
  countries: ['India'],  // Only India
  maxJobs: 50,          // 50 jobs from India = 5 requests
})
// Total: 6 requests per run
// Runs/month: 240 ÷ 6 = 40 runs
// Jobs/month: 2,000
```

**Run frequency**: 1-2 runs per day

---

### Option B: Balance Coverage & Frequency
**Best for**: Production use

**Recommended Setup:**
```javascript
fetchAllJobs({
  countries: ['India', 'United States'],  // 2 countries
  maxJobs: 30,                            // 30 each = 3 + 3 = 6 requests
})
// Total: 7 requests per run
// Runs/month: 240 ÷ 7 = 34 runs
// Jobs/month: 2,040
```

**Run frequency**: 1 run per day

---

### Option C: Maximum Data (Paid Tier)
**Best for**: Production + high volume

**With 500 requests/month (example):**
```javascript
fetchAllJobs({
  countries: ['India', 'United States', 'UK', 'Canada'],
  maxJobs: 50,  // 50 each × 4 = 20 requests
})
// Total: 21 requests per run
// Runs/month: 500 ÷ 21 = 23 runs
// Jobs/month: 2,300
```

---

## How to Modify the Limit in Code

### Current Default (50 jobs per country)
```javascript
// In fetchAllJobs():
const googleOptions = {
  maxJobs: 50,  // ← Change this
};
```

### To Fetch Fewer Jobs (Save Requests)
```javascript
// Save API requests - run more frequently
const googleOptions = {
  maxJobs: 20,  // 2 requests per country instead of 5
};
// Per run: 3 + 3 + 3 + 1 = 10 requests
// Runs/month: 240 ÷ 10 = 24
```

### To Fetch More Jobs (Use More Budget)
```javascript
// Use more quota per run - less frequent
const googleOptions = {
  maxJobs: 100,  // 10 requests per country
};
// Per run: 10 + 10 + 10 + 1 = 31 requests
// Runs/month: 240 ÷ 31 = 7-8
```

### To Fetch Fewer Countries (Save Requests)
```javascript
// Only India - most requests saved
const countriesToFetch = ['India'];  // ← Remove USA, UK
// Per run: 5 + 1 = 6 requests
// Runs/month: 240 ÷ 6 = 40
```

---

## Real-World Example: Your Budget

### Scenario: You want daily ingestion

```
Goal: Run ingest every day

Strategy 1: Current setup (fail)
├─ 16 requests per run
├─ 240 ÷ 16 = 15 runs/month
└─ Can't run daily ❌

Strategy 2: Optimize (success)
├─ Reduce to 20 jobs/country = 8 requests per run
├─ 240 ÷ 8 = 30 runs/month
├─ 30 ÷ 30 days = 1 run/day ✅
└─ Get ~60 new jobs/day

Strategy 3: India only (best)
├─ 50 jobs from India = 5 requests + 1 Remotive
├─ 6 requests per run
├─ 240 ÷ 6 = 40 runs/month
├─ 40 ÷ 30 = 1.3 runs/day ✅
└─ Get ~60 new jobs/day
```

---

## Bottom Line

### Your 240 Requests/Month Allows:

| Strategy | Jobs/Run | Requests/Run | Runs/Month | Frequency | Total Jobs |
|----------|----------|--------------|-----------|-----------|-----------|
| India only | 50 | 6 | 40 | 1.33x/day | 2,000 |
| India + USA | 100 | 11 | 21 | 0.7x/day | 2,100 |
| India + USA + UK | 150 | 16 | 15 | 0.5x/day | 2,250 |
| 3 countries, 20 jobs | 60 | 10 | 24 | 0.8x/day | 1,440 |

### Recommendation for Free Tier:
**Fetch 50 jobs from India only, run 1-2x per day**
- Cost: 6 requests per run
- Frequency: Very high (fresh data)
- Jobs: 50-100 per day
- Sustainable: Yes ✅

---

## Questions?

1. **Can I get more requests?** Start a paid SerpAPI plan
2. **Why pagination?** Each request returns ~10 results max
3. **Why can't I change the page size?** SerpAPI's API limitation, not ours
4. **How often should I run?** Daily (3-4x per week minimum)
5. **Can I run multiple times same day?** Yes, respects daily job updates!
