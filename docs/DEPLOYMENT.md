# 🚀 Deployment Guide

Deploy the Job Intelligence Engine to production in minutes.

## Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start server (with auto-reload)
npm run dev
```

Server runs on `http://localhost:3000`

---

## 🌐 Cloud Deployment

### Option 1: Heroku (Easiest)

#### 1. Prepare Heroku

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create app
heroku create your-job-pulse-app
```

#### 2. Configure Database

```bash
# Add MongoDB Atlas (free tier available)
# Get connection string from https://www.mongodb.com/cloud/atlas

# Set environment variables
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
heroku config:set NODE_ENV=production
heroku config:set SERPAPI_KEY=your_key_here
heroku config:set PORT=3000
```

#### 3. Deploy

```bash
# Push to Heroku
git push heroku main

# View logs
heroku logs --tail

# Check app status
heroku open /health
```

#### 4. Trigger Scheduler

```bash
# Manually trigger first ingestion
curl -X POST https://your-job-pulse-app.herokuapp.com/admin/ingest
```

---

### Option 2: Railway.app (Modern Alternative)

#### 1. Connect Repository

1. Go to https://railway.app/
2. Click "New Project"
3. Import GitHub repository
4. Select this project

#### 2. Add MongoDB

```bash
# In Railway dashboard:
# Add service → MongoDB
# Copy connection string

# Set environment variables:
- MONGODB_URI = (from MongoDB service)
- NODE_ENV = production
- SERPAPI_KEY = your_key
```

#### 3. Deploy

```bash
# Railway auto-deploys on push
git push origin main

# View deployment in dashboard
# Access: https://your-project-name.railway.app/health
```

---

### Option 3: AWS EC2 (Full Control)

#### 1. Launch Instance

```bash
# AWS Console → EC2 → Launch Instance
# Select: Ubuntu 22.04 LTS, t3.micro (free tier)
```

#### 2. SSH & Setup

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB locally (or use Atlas)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

#### 3. Deploy Code

```bash
# Clone repository
git clone <your-repo-url>
cd job-pulse

# Install dependencies
npm install

# Create .env
cp .env.example .env
# Edit with your configuration

# Start with PM2 (process manager)
sudo npm install -g pm2
pm2 start src/index.js --name "job-pulse"
pm2 startup
pm2 save

# View logs
pm2 logs job-pulse
```

#### 4. Setup Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt-get install -y nginx

# Configure
sudo nano /etc/nginx/sites-available/default
```

Add to config:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Restart Nginx
sudo systemctl restart nginx
```

---

### Option 4: Docker + Any Cloud

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src ./src

# Expose port
EXPOSE 3000

# Run app
CMD ["npm", "start"]
```

#### 2. Create Docker Compose (Optional)

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: job-pulse
    ports:
      - "3000:3000"
    environment:
      MONGODB_URI: ${MONGODB_URI}
      NODE_ENV: production
      SERPAPI_KEY: ${SERPAPI_KEY}
    depends_on:
      - mongodb

  mongodb:
    image: mongo:6
    container_name: job-pulse-db
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: job-pulse

volumes:
  mongo_data:
```

#### 3. Deploy to Docker Hub

```bash
# Build image
docker build -t yourusername/job-pulse .

# Push to Docker Hub
docker push yourusername/job-pulse

# Deploy on any cloud that supports Docker:
# - Google Cloud Run
# - AWS ECS
# - Azure Container Instances
# - DigitalOcean App Platform
```

---

## 🔐 Production Checklist

### Security
- [ ] Create `.env` file with strong API keys
- [ ] Never commit `.env` to git
- [ ] Use HTTPS (via nginx or load balancer)
- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas with IP whitelist

### Performance
- [ ] Enable MongoDB indexes (automatic with schema)
- [ ] Set appropriate `FETCH_INTERVAL_HOURS`
- [ ] Monitor disk space for logs
- [ ] Consider adding Redis for caching

### Monitoring
- [ ] Set up log aggregation (e.g., LogDNA)
- [ ] Monitor `/health` endpoint
- [ ] Track error rates
- [ ] Monitor database performance

### Backups
- [ ] Enable MongoDB automatic backups
- [ ] Test restore process regularly
- [ ] Keep offsite backups

---

## 📊 Environment Variables (Production)

```env
# Critical
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/job-pulse
PORT=3000

# API Keys
SERPAPI_KEY=your_serpapi_key

# Tuning
RECENCY_WEIGHT=0.6
RELEVANCE_WEIGHT=0.4
FETCH_INTERVAL_HOURS=3

# Optional
LOG_LEVEL=error
MAX_JOBS_PER_FETCH=500
```

---

## 🔍 Monitoring & Debugging

### View Logs

```bash
# Heroku
heroku logs --tail

# AWS EC2 with PM2
pm2 logs job-pulse

# Docker
docker logs job-pulse

# Local
npm run dev
```

### Health Check

```bash
curl https://your-production-api.com/health
```

### Trigger Manual Ingestion

```bash
curl -X POST https://your-production-api.com/admin/ingest
```

### Check Server Stats

```bash
curl https://your-production-api.com/jobs/stats
```

---

## 📈 Scaling Tips

### For Small Load (< 10K jobs)
- Single Fastify instance
- MongoDB free tier (Atlas)
- Adequate for most use cases

### For Medium Load (10K-100K jobs)
- Multiple Fastify instances behind load balancer
- MongoDB paid tier with auto-scaling
- Consider Redis caching
- Increase `FETCH_INTERVAL_HOURS`

### For Large Load (100K+ jobs)
- Kubernetes deployment
- MongoDB sharded cluster
- Redis cluster
- Job queue (Bull, RabbitMQ)
- Separate read/write scaling

---

## 🆘 Common Issues

### "MongoDB Connection Refused"
```
# Solution: Check MongoDB is running
# Or update MONGODB_URI to use MongoDB Atlas
```

### "Port Already in Use"
```bash
# Change PORT in .env
PORT=3001 npm start
```

### "SerpAPI Rate Limit"
```
# Solution: Reduce FETCH_INTERVAL_HOURS
# Or get paid SerpAPI plan
```

### "High Memory Usage"
```bash
# Monitor: pm2 monit
# Or check MongoDB indexes
# Consider archiving old jobs more frequently
```

---

## 🎓 Cost Estimates (Monthly)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Hosting | Heroku Free | $0 | 512MB RAM (sleeps after 30 min idle) |
| Hosting | Railway.app | ~$5 | Always on, great for hobby projects |
| Database | MongoDB Atlas | $0 | 512MB (free tier) |
| Database | MongoDB Atlas | $57+ | 2GB, auto-backup, HA |
| API Key | SerpAPI | $0 | 100 requests/month free |
| API Key | SerpAPI | $29+ | Paid plans for higher volume |
| **Total** | **Hobby** | **~$5-10** | Development/testing |
| **Total** | **Production** | **~$35-100+** | Full cloud stack |

---

## ✅ Deployment Verification

After deployment, test:

```bash
BASE_URL=https://your-production-api.com

# 1. Health check
curl $BASE_URL/health

# 2. Get API info
curl $BASE_URL/info

# 3. Trigger ingestion
curl -X POST $BASE_URL/admin/ingest

# 4. Query jobs
curl "$BASE_URL/jobs/top?limit=5"

# 5. Get stats
curl $BASE_URL/jobs/stats
```

---

**Deployment ready!** Choose your platform and deploy in < 30 minutes. 🚀
