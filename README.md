# 🚀 Job Pulse

> **Job Aggregation & Tracking Platform** — Your intelligent companion for job hunting with real-time aggregation, smart scoring, and comprehensive application tracking.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Now-success?style=for-the-badge)](https://your-deployment-url.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<div align="center">
  <p><em>🔗 <a href="https://your-deployment-url.com">Live Demo</a> | 📖 <a href="#-features">Features</a> | 🛠 <a href="#-tech-stack">Tech Stack</a> | 🚀 <a href="#-quick-start">Quick Start</a> | 📚 <a href="./docs/">Documentation</a></em></p>
</div>

---

## ✨ Features

### 🎯 **Job Discovery & Aggregation**
- **Multi-Source Aggregation** — Fetches from Google Jobs, Remotive, and extensible to add more sources
- **Real-Time Updates** — Automated job ingestion with configurable scheduling
- **Smart Deduplication** — Hash-based algorithm prevents duplicate listings
- **Advanced Search** — Full-text search with fuzzy matching and keyword highlighting
- **Intelligent Ranking** — Scoring based on recency, relevance, and match quality

### 🎨 **Modern Progressive Web App (PWA)**
- **Responsive Design** — Seamless experience across desktop, tablet, and mobile
- **Dark Mode** — Eye-friendly theme switching with system preference detection
- **Offline Support** — Service worker caching for offline job browsing
- **Installable** — Add to home screen on mobile for app-like experience
- **Optimistic Updates** — Instant UI feedback with background sync

### 📊 **Application Tracking System**
- **Kanban Board** — Visual pipeline with drag-and-drop (Saved → Applied → Interview → Offer)
- **List View** — Tabular view with pagination for power users
- **Status Management** — Track 6+ application stages with status history
- **Interview Scheduling** — Keep track of interview dates, types, and notes
- **Priority System** — Star ratings to prioritize opportunities
- **Notes & Contacts** — Attach notes and recruiter contacts to each application
- **Analytics Dashboard** — Track response rates, weekly goals, and application trends

### 💡 **Personal Insights**
- **Statistics Overview** — Total applications, response rates, and success metrics
- **Trend Analysis** — Visualize application patterns over 7/14/30 day periods
- **Skills Tracking** — Identify which skills you're targeting most
- **Source Performance** — Compare success rates across different job boards
- **Streak Tracking** — Gamified daily application goals
- **Progress Goals** — Set and track weekly application targets

### 🔍 **Advanced Filtering**
- **Location-Based** — Filter by country with geo-tagged results
- **Remote Options** — Dedicated remote-only filter
- **Time Period** — Find jobs posted within hours/days/weeks
- **Skills & Keywords** — Tag-based filtering with AND/OR logic
- **Sort Options** — Rank by score, recency, or company name
- **Persistent Filters** — Remembers your preferences across sessions

### 🔐 **Authentication & Security**
- **JWT Authentication** — Secure token-based auth with refresh tokens
- **User Profiles** — Personalized dashboards and saved preferences
- **Demo Mode** — Try the platform with pre-filled demo credentials
- **Password Security** — Bcrypt hashing with salt rounds
- **Protected Routes** — Middleware-based authorization

### ⚡ **Performance & Optimization**
- **IndexedDB Caching** — Client-side caching for instant load times
- **Virtual Scrolling** — Efficient rendering of large job lists (200+ items)
- **Code Splitting** — Route-based chunking for faster initial load
- **Image Optimization** — Next.js automatic image optimization
- **API Rate Limiting** — Production-ready throttling and abuse prevention
- **Database Indexing** — Optimized MongoDB queries with compound indexes

### 🎭 **User Experience**
- **Framer Motion Animations** — Smooth, delightful micro-interactions
- **Loading Skeletons** — No jarring content shifts, predictable loading states
- **Toast Notifications** — Non-intrusive feedback for user actions
- **Empty States** — Helpful guidance when no data is available
- **Error Boundaries** — Graceful error handling with retry options
- **Accessibility** — WCAG compliant with keyboard navigation support

---

## 🏗 Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Job Sources   │──────▶│  Backend API     │◀─────│   Frontend PWA  │
│  (Google, etc)  │      │  (Fastify + Node)│      │  (Next.js + TS) │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                  │
                         ┌────────▼────────┐
                         │  MongoDB Atlas  │
                         │  (Aggregation,  │
                         │   Tracking DB)  │
                         └─────────────────┘
```

### Backend Architecture
- **RESTful API** — Fastify framework with async/await
- **Service Layer** — Business logic separation (aggregation, scoring, deduplication)
- **Scheduler** — Node-cron for automated job fetching and cleanup
- **Middleware** — Authentication, rate limiting, CORS, error handling

### Frontend Architecture
- **Component-Based** — Modular React components with TypeScript
- **State Management** — Redux Toolkit with Redux Saga for side effects
- **Hooks & Context** — Custom hooks for auth, theme, and data fetching
- **Service Layer** — Centralized API client with offline queue

---

## 🛠 Tech Stack

### **Backend**
![Fastify](https://img.shields.io/badge/Fastify-000000?logo=fastify&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)

- **Framework:** Fastify (high-performance alternative to Express)
- **Database:** MongoDB Atlas with Mongoose ODM
- **Authentication:** JWT + Bcrypt
- **Job Sources:** SerpAPI (Google Jobs), Remotive API
- **Scheduling:** Node-cron for automated tasks
- **Validation:** Fastify schema validation

### **Frontend**
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Redux](https://img.shields.io/badge/Redux-764ABC?logo=redux&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

- **Framework:** Next.js 14 (App Router, SSR, SSG)
- **Language:** TypeScript for type safety
- **State:** Redux Toolkit + Redux Saga
- **Styling:** Tailwind CSS + Custom components
- **Animations:** Framer Motion
- **Offline:** Service Workers + IndexedDB
- **Charts:** Custom CSS/SVG visualizations
- **Forms:** React Hook Form + Validation

---

## 📁 Project Structure

```
job-pulse/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & environment configuration
│   │   ├── controllers/     # Route handlers (auth, jobs, tracking, insights)
│   │   ├── middleware/      # Auth, rate limiting, error handling
│   │   ├── models/          # Mongoose schemas (Job, User, Tracking, Notification)
│   │   ├── routes/          # API route definitions
│   │   ├── schedulers/      # Cron jobs (ingestion, cleanup, notifications)
│   │   ├── services/        # Business logic (aggregation, scoring, deduplication)
│   │   └── utils/           # Helper functions
│   ├── scripts/             # Utility scripts (seed demo data)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages (jobs, tracker, insights)
│   │   ├── components/      # Reusable UI components (auth, common)
│   │   ├── contexts/        # React contexts (auth, theme)
│   │   ├── modules/         # Feature modules (jobs, tracking, filters, insights)
│   │   ├── services/        # API clients (axios, IndexedDB)
│   │   ├── store/           # Redux store configuration
│   │   └── styles/          # Global styles
│   ├── public/              # Static assets (manifest, service worker, icons)
│   └── package.json
├── docs/                    # Comprehensive documentation
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB instance)
- SerpAPI key (for Google Jobs)

### 1. Clone Repository
```bash
git clone https://github.com/FaizAlam4/job-pulse.git
cd job-pulse
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Add your MongoDB URI, JWT secret, and API keys
```

**Environment Variables:**
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/jobpulse
JWT_SECRET=your-secret-key-here
SERPAPI_KEY=your-serpapi-key
REMOTIVE_API_URL=https://remotive.com/api/remote-jobs
PORT=3000
```

**Start Backend:**
```bash
npm run dev  # Development with nodemon
# OR
npm start    # Production
```

API runs at `http://localhost:3000`

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env.local for API endpoint
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local
```

**Start Frontend:**
```bash
npm run dev   # Development server
# OR
npm run build && npm start  # Production build
```

App runs at `http://localhost:3001`

### 4. Seed Demo Data (Optional)
```bash
cd backend
node scripts/seedDemoUser.js
```

**Demo Credentials:**
- Email: `demo@jobpulse.com`
- Password: `Demo@123`

---

## 📡 API Endpoints

### Jobs
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/jobs` | List jobs with filters & pagination | ❌ |
| `GET` | `/jobs/search?q=` | Full-text search | ❌ |
| `GET` | `/jobs/top?limit=10` | Top-ranked jobs | ❌ |
| `GET` | `/jobs/stats` | Job statistics | ❌ |
| `GET` | `/jobs/:id` | Job detail + similar jobs | ❌ |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create new account |
| `POST` | `/auth/login` | Login (returns JWT) |
| `GET` | `/auth/me` | Get current user |

### Tracking
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/tracking` | List tracked applications (paginated) | ✅ |
| `POST` | `/tracking` | Track a new job | ✅ |
| `PATCH` | `/tracking/:id` | Update application status | ✅ |
| `DELETE` | `/tracking/:id` | Remove from tracking | ✅ |
| `GET` | `/tracking/analytics` | Application statistics | ✅ |

### Insights
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/insights/overview` | Stats overview | ✅ |
| `GET` | `/insights/trends?days=30` | Application trends | ✅ |
| `GET` | `/insights/sources` | Source performance | ✅ |
| `GET` | `/insights/skills` | Skills analysis | ✅ |
| `GET` | `/insights/goals` | Weekly goals & streaks | ✅ |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/ingest` | Trigger job ingestion |
| `GET` | `/info` | API documentation |

---

## 🎨 Features Showcase

### Application Tracking
```typescript
// Track a job
POST /tracking
{
  "jobId": "507f1f77bcf86cd799439011",
  "status": "applied",
  "notes": "Applied via company website",
  "priority": 4,
  "applicationSource": "LinkedIn"
}

// Move to next stage
PATCH /tracking/507f1f77bcf86cd799439012
{
  "status": "interview",
  "notes": "Phone screen scheduled for tomorrow"
}
```

### Advanced Filtering
```bash
# Database filters (after ingestion)
GET /jobs?country=USA&remote=true&skills=react,typescript&sortBy=score&order=desc&page=1&limit=10

# Ingestion filters (Google Jobs API)
POST /admin/ingest?location=San Francisco&timePeriod=week&jobType=fulltime&remote=true
```

### Analytics Dashboard
- 📊 **Overview Stats**: Total apps, response rate, weekly count
- 📈 **Trend Charts**: Line graphs showing application velocity
- 🎯 **Goals Tracking**: Weekly targets with progress bars
- 🔥 **Streak System**: Daily application streaks
- 💡 **Skills Insights**: Top 15 skills from your applications

---

## 📚 Documentation

Comprehensive guides available in [docs/](./docs/):

- 📖 [**Architecture**](./docs/ARCHITECTURE.md) — System design and data flow
- 🚀 [**Quick Start**](./docs/QUICKSTART.md) — Get running in 5 minutes
- 🌐 [**Deployment**](./docs/DEPLOYMENT.md) — Production deployment guide
- ⚙️ [**Configuration**](./docs/CONFIGURATION_GUIDE.md) — All config options
- 🧪 [**Examples**](./docs/EXAMPLES.md) — API usage examples
- 🛡️ [**Rate Limiting**](./docs/RATE_LIMITING.md) — API protection setup

---

## 🎯 Roadmap

- [x] Multi-source job aggregation
- [x] Smart scoring & ranking algorithm
- [x] Application tracking (Kanban + List)
- [x] Personal insights dashboard
- [x] PWA with offline support
- [x] Demo mode for quick evaluation
- [ ] Email notifications for new matches
- [ ] Resume builder & parser
- [ ] Interview preparation resources
- [ ] Salary insights & negotiation tips
- [ ] Chrome extension for one-click tracking
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **SerpAPI** — Google Jobs data provider
- **Remotive** — Remote job listings API
- **MongoDB Atlas** — Cloud database hosting
- **Next.js Team** — Amazing React framework
- **Fastify Team** — High-performance web framework

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/FaizAlam4">Faiz Alam</a></p>
  <p>
    <a href="https://your-deployment-url.com">🌐 Live Demo</a> •
    <a href="https://github.com/FaizAlam4/job-pulse/issues">🐛 Report Bug</a> •
    <a href="https://github.com/FaizAlam4/job-pulse/issues">✨ Request Feature</a>
  </p>
</div>
