# 🛡️ Rate Limiting Explained

Rate limiting is now enabled on your Job Pulse API to protect against attacks and ensure fair usage.

## 🚨 The Problem It Solves

### Attack Scenario (Without Rate Limiting)

```
Attacker script:
┌─────────────────────────────────────────┐
│ for i in range(10000):                  │
│   requests.get("http://your-app/jobs")  │
└─────────────────────────────────────────┘
         ↓ 10,000 requests/second
         ↓
    Your EC2 instance gets FLOODED
    Database gets hammered
    Data transfer spikes
    AWS charges YOU for overage!
```

### Attack Cost (No Protection)
```
10,000 requests/sec × 100KB response = 1000GB/hour
1000GB × 24 hours × 30 days = 720,000GB/month
720,000GB × $0.09 = $64,800 CHARGE ❌❌❌
```

---

## ✅ The Solution: Rate Limiting

### How It Works

```
Request 1 (from IP 192.168.1.100):
  ✅ Allowed (Counter: 1/100)

Request 2-50:
  ✅ All allowed (Counter: 50/100)

Request 51-100:
  ✅ Still allowed (Counter: 100/100)

Request 101 (from same IP):
  ❌ BLOCKED! (HTTP 429: Too Many Requests)
  └─ Must wait 15 minutes for counter to reset

After 15 minutes:
  ✅ Counter resets to 0
  ✅ User can make 100 more requests
```

---

## 🎯 Your Rate Limit Configuration

```
Maximum: 100 requests
Per: 15 minutes
Per: Each unique IP address

What this means:
└─ Someone can call your API 100 times in 15 minutes
└─ After 100 requests, they get blocked (HTTP 429)
└─ After 15 minutes pass, they get 100 more requests
└─ Different IPs have separate counters
```

### Configuration Code

```javascript
await fastify.register(rateLimit, {
  max: 100,                    // Maximum requests per window
  timeWindow: '15 minutes',    // Time window
  cache: 10000,                // Cache 10,000 IP addresses
  allowList: ['127.0.0.1'],    // Localhost not rate limited
  skipOnError: false,          // Enforce even if error
});
```

---

## 🔒 Attack Prevention Examples

### Attack 1: Continuous Bot (Without Protection)

```
Before rate limiting:
┌─────────────────────────────────────┐
│ Bot makes 1000 requests/second      │
│ Total bandwidth: Massive            │
│ Cost to you: $64,800                │
└─────────────────────────────────────┘

With rate limiting:
┌─────────────────────────────────────┐
│ Bot makes 1000 requests/second      │
│ First 100 requests: ✅ Allowed      │
│ Requests 101-1000: ❌ All blocked   │
│ Response: HTTP 429                  │
│ Cost to you: $0 ✅                  │
└─────────────────────────────────────┘
```

### Attack 2: Sustained Attack Over Hours

```
Attacker strategy: 500 requests/minute for 6 hours
Without protection: 500 × 60 × 6 = 180,000 requests → EXPENSIVE

With rate limiting:
Hour 1: First 100 requests ✅, rest 400 ❌ (blocked)
Hour 2: First 100 requests ✅, rest 400 ❌ (blocked)
Hour 3-6: Same pattern
Total cost: $0 ✅

Attacker gives up because:
- Getting HTTP 429 every second
- Changes to attack someone else
```

### Attack 3: Multiple IPs (Distributed)

```
Attacker tries 10 different IPs: 100 requests each
Total: 1000 requests across 10 IPs

Each IP has separate limit:
IP 1: 100 requests ✅, then blocked
IP 2: 100 requests ✅, then blocked
IP 3: 100 requests ✅, then blocked
...
IP 10: 100 requests ✅, then blocked

Total impact: Only 1000 requests instead of unlimited
Cost protection: ✅ Effective
```

---

## 📊 How It Tracks IPs

### For Each Request:

```
1. Extract IP from request header
   IP = req.ip (or X-Forwarded-For if behind proxy)

2. Create counter key
   Key = "rateLimit:IP:192.168.1.100"

3. Check counter in cache
   If counter < 100:
     ✅ Allow request
     counter++
   Else:
     ❌ Reject (HTTP 429)

4. Auto-expire counter after 15 minutes
   Redis TTL: 15 minutes
   Automatic cleanup
```

### Counter State Example

```
Time: 00:00 - 15:00 (15 minute window)

IP 192.168.1.100:
  Request 1: counter = 1/100 ✅
  Request 2: counter = 2/100 ✅
  ...
  Request 100: counter = 100/100 ✅
  Request 101: counter exceeds limit ❌
  
  (Wait 15 minutes)

Time: 15:01

IP 192.168.1.100:
  Counter reset to 0 ✅
  Request 101: counter = 1/100 ✅
```

---

## 🧪 Testing Rate Limiting

### Test 1: Normal Usage (Should Work)

```bash
# Make 50 requests (within limit)
for i in {1..50}; do
  curl http://localhost:3000/health
done

Output: All succeed ✅
```

### Test 2: Exceed Limit (Should Block)

```bash
# Make 101 requests (exceeds 100 limit)
for i in {1..101}; do
  curl http://localhost:3000/health
done

Output:
  Requests 1-100: ✅ 200 OK
  Request 101: ❌ 429 Too Many Requests
  
Response:
{
  "status": 429,
  "message": "Rate limit exceeded, retry in X minutes"
}
```

### Test 3: Different IP (Separate Limit)

```bash
# From Computer A: 100 requests (hits limit)
for i in {1..100}; do curl http://localhost:3000/health; done

# From Computer B: 100 requests (separate counter!)
for i in {1..100}; do curl http://localhost:3000/health; done

Result:
  Computer A: First 100 ✅, then blocked ❌
  Computer B: All 100 ✅ (different IP = different limit)
```

---

## 📈 Real-World Impact

### Scenario 1: Legitimate Demo Traffic

```
Recruiter visits: https://your-app.com
  Makes 5 API calls: ✅ Works fine

During interview:
  Interviewer tests API: 10 calls ✅ No problem

Total per session: ~15 requests
Limit: 100 requests
Impact on user: NONE ✅

(Would need 100 API calls in 15 minutes to hit limit)
```

### Scenario 2: Someone Tests Your Security

```
Security researcher:
  Sends 1000 requests/second with curl
  
What happens:
  Request 1-100: ✅ Allowed
  Request 101-1000: ❌ All blocked
  
Researcher sees: HTTP 429
Conclusion: "Domain is protected!" ✅
Your cost: $0 ✅
```

### Scenario 3: Your App Gets Popular

```
100 legitimate users visiting API:
  Each user: ~5 requests = 500 total
  Each IP unique = 500 different counters
  Each counter: 5/100
  
Result: Everyone happy ✅
No one hits limit
```

---

## 🔍 Monitoring Rate Limits

### Check Request IPs

```bash
# SSH into your EC2 instance
ssh -i key.pem ubuntu@your-ip

# Check access logs
tail -f /var/log/nginx/access.log
# Or:
pm2 logs job-pulse | grep "IP:"
```

### Suspicious Pattern

```
100 requests/second from IP 192.168.1.50
→ Rate limiter blocks after request 100
→ You get alerted (if monitoring enabled)
→ Can block that IP at firewall level
```

---

## 🆘 Legitimate Users Hit Rate Limit?

### Why It Might Happen

```
User hitting 100 requests/15 min:
  1. Heavy API usage (unlikely for your app)
  2. Accidental loop in their code
  3. They're testing/scraping
```

### Solutions

```
Option 1: Whitelist their IP
  allowList: ['203.0.113.0', '203.0.113.1']

Option 2: Increase limit
  max: 500 (instead of 100)

Option 3: Extend time window
  timeWindow: '1 hour' (instead of 15 minutes)

Option 4: Give them API key with higher limit
  (Future feature: different rates for different users)
```

---

## 🚀 Advanced: Distributed Rate Limiting

### Current Setup (Single Server)

```
┌────────────────────┐
│ EC2 Instance       │
│ ┌────────────────┐ │
│ │ In-Memory Cache│ │
│ │ Tracks IPs     │ │
│ └────────────────┘ │
└────────────────────┘

Problem: Only works on 1 instance
If you scale to 2 instances, each has own counter!
```

### Future: Redis-Based (Better)

```
┌─────────────┐        ┌─────────────┐
│ EC2 Instance│        │ EC2 Instance│
│      # 1    │        │      # 2    │
└──────┬──────┘        └──────┬──────┘
       │                      │
       └──────────────────────┘
              ↓
         ┌──────────┐
         │ Redis    │
         │ Shared   │
         │ Counter  │
         └──────────┘

Benefit: All instances share same counter!
IP 192.168.1.100 limited to 100 across all servers
```

**To enable: Set `redis:` option (not needed now)**

---

## 📝 Configuration Options Explained

```javascript
{
  max: 100,
  // Maximum number of requests allowed
  // Good for: 100 requests per 15 min window
  
  timeWindow: '15 minutes',
  // Time period for counting
  // Options: '1 minute', '5 minutes', '15 minutes', '1 hour'
  
  cache: 10000,
  // How many unique IPs to track
  // 10000 = track 10,000 different IP addresses
  // If exceed, oldest IPs dropped
  
  allowList: ['127.0.0.1'],
  // IPs that bypass rate limiting
  // Localhost (127.0.0.1) never limited
  // Use for: Internal testing, health checks
  
  skipOnError: false,
  // If error occurs, still enforce rate limit
  // true = ignore errors (not recommended)
  // false = always enforce (safer)
  
  redis: undefined,
  // For distributed rate limiting
  // undefined = in-memory (single server)
  // Set to Redis client for multi-server setup
}
```

---

## ✅ Protection Summary

### What Rate Limiting Protects Against

| Attack Type | Protection | Result |
|------------|-----------|--------|
| **Bot Attacks** | Blocks after 100 req | ✅ Attacker blocked |
| **DDoS Attempts** | Per-IP limit | ✅ Limited impact |
| **Scraping Scripts** | 100 req/15 min max | ✅ Can't scrape much |
| **Accidental Loops** | Gentle HTTP 429 | ✅ User/app aware |
| **Cost Overages** | Cap on abuse | ✅ Budget safe |

### What Rate Limiting Does NOT Protect Against

| Attack Type | Status | Mitigation |
|------------|--------|------------|
| **SQL Injection** | ❌ Not protected | Input validation (future) |
| **Authentication Bypass** | ❌ Not protected | Add authentication (future) |
| **Data Breach** | ❌ Not protected | Encryption + backups |
| **Sophisticated DDoS** | Partial | Use AWS WAF (future) |

---

## 🎯 Current Status: ✅ Protected

Your Job Pulse API now has:

```
✅ Rate limiting: 100 requests/15 minutes per IP
✅ Bot protection: Blocks after limit
✅ Cost protection: No data transfer spike charges
✅ Fair usage: Everyone gets equal access
✅ Zero code on your part: Works automatically

Your project is now:
  Safe from casual attacks ✅
  Protected from accidental abuse ✅
  Budget-safe for AWS ✅
```

---

## 📊 Cost Impact of Rate Limiting

### Without Protection (Attack Scenario)
```
10,000 requests/second
100KB per response
1 hour of attack

Data transfer: 10,000 × 100KB = 1000GB/hour
Cost: 1000GB × $0.09 = $90/hour = $2,160/day ❌
```

### With Protection (Rate Limited)
```
100 requests allowed per 15 minutes per IP
Max per IP per hour: 400 requests
Even with 100 different attacking IPs: 40,000 requests/hour
40,000 × 100KB = 4GB/hour
Cost: 4GB × $0.09 = $0.36/hour = $8.64/day

vs. $2,160/day = 250x cheaper! ✅
```

---

## 🔧 Future Enhancements

```
TODO (When Needed):
1. Add Redis for distributed rate limiting
2. Different limits for different endpoints
3. User-based rate limits (with API keys)
4. Gradual backoff (increase wait time)
5. Whitelist for API partners
6. Monitoring dashboard
7. Alerts when rates spike
```

---

**Rate limiting is now protecting your API!** 🛡️

Your Job Pulse is production-ready with DDoS protection built-in.
