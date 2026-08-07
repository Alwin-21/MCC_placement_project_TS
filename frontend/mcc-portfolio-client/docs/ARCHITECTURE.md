# MCC Placement Platform — Architecture Notes

## System Overview

The MCC Placement Platform is a monolithic **Next.js 15 App Router** application that combines:

- **Student Portfolio Platform** — profile, academic records, projects, certifications, assessments
- **Company/HR Module** — registration, job postings, application pipeline, talent matching, analytics
- **Admin Control Panel** — company approvals, skill taxonomy, placement analytics, reports
- **Online Assessment Module** — test creation, student attempts, rankings

All modules share a **single Next.js deployment** at `localhost:3001`.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, `"use client"` / RSC) |
| Language | TypeScript 5 |
| Database | PostgreSQL via Prisma ORM 5 |
| Authentication | JWT (HS256, `jsonwebtoken`) — role-based |
| Styling | TailwindCSS v4 (`@import "tailwindcss"`) + `globals.css` custom utilities |
| Fonts | Google Fonts: Plus Jakarta Sans, Inter |
| Icons | Lucide React |
| HTTP Client | Axios (abstracted via `src/services/api.ts`) |
| Caching | In-memory global cache (`global.*Cache`) — persists across hot-reloads |
| Rate Limiting | In-memory sliding window (`src/utils/rateLimiter.ts`) |

---

## Directory Structure

```
src/
├── app/
│   ├── admin/                  # Admin Control Panel (page.tsx ~4000 lines)
│   ├── company/
│   │   ├── dashboard/          # Company HR Workspace (page.tsx)
│   │   ├── login/              # HR Login page
│   │   ├── register/           # Company Registration (multi-step)
│   │   ├── forgot-password/    # Password reset request
│   │   └── reset-password/     # Password reset confirm
│   ├── dashboard/              # Student Dashboard
│   ├── portfolio/              # Public Portfolio pages
│   ├── assessment/             # Online Assessment UI
│   ├── api/
│   │   ├── Company/            # Company API routes
│   │   │   ├── Auth/           # login, register, forgot, reset
│   │   │   ├── analytics/      # Hiring funnel analytics
│   │   │   ├── applications/   # Candidate applications
│   │   │   ├── assessments/    # Assessment integration
│   │   │   ├── dashboard-stats/# Overview KPIs
│   │   │   ├── interviews/     # Interview CRUD
│   │   │   ├── jobs/           # Job posting CRUD
│   │   │   ├── profile/        # Company profile CRUD
│   │   │   ├── reports/        # CSV/XLS report exports
│   │   │   ├── students/       # Student directory
│   │   │   ├── talent-pools/   # Saved talent pools
│   │   │   ├── talent-search/  # UTME search engine
│   │   │   └── upload/         # File upload handler
│   │   ├── Admin/              # Admin API routes
│   │   │   ├── analytics/      # Campus analytics
│   │   │   ├── companies/      # Company management
│   │   │   ├── reports/        # Admin report exports
│   │   │   └── skills-taxonomy/# Skill Taxonomy CRUD
│   │   ├── Automation/
│   │   │   └── cron/           # Automation cron runner
│   │   └── ...                 # Student, Auth, Assessment, etc.
│   └── globals.css             # Global design system
├── hooks/
│   └── useTheme.ts             # Dark/light mode hook
├── services/
│   └── api.ts                  # Axios instance with auth interceptors
└── utils/
    ├── auth.ts                 # JWT generation, verification, role checks
    ├── db.ts                   # Prisma singleton client
    ├── rateLimiter.ts          # In-memory rate limiting
    └── taxonomyCache.ts        # Skill taxonomy in-memory cache
```

---

## Authentication Architecture

### Two Separate Auth Domains

| Domain | Model | Token Claim | Role |
|---|---|---|---|
| Students | `Users` | `role = "Student"` | 0 |
| HR/Company | `CompanyUsers` | `role = "Company"` | — |
| Admin | `Users` | `role = "Admin"` | 1 |

Both domains use the same `generateToken` / `getUserFromRequest` utilities from `src/utils/auth.ts`. The JWT payload carries `nameid` (user ID), `role`, `email`, and `unique_name`.

### Security Features
- **Brute-force lockout**: 5 failed logins → 15-minute lockout on `CompanyUsers`
- **Rate limiting**: Sliding-window in-memory limiter for auth endpoints
- **Input validation**: Email regex, password strength (8+ chars, uppercase, number)
- **Company status guard**: Only `Verified` companies can access the dashboard
- **CRON_SECRET**: Automation cron requires secret header or Admin JWT

---

## Database Architecture

See `DATABASE_DOCUMENTATION.md` for full schema details.

Key relationships:
```
Company → CompanyUsers (HR accounts)
Company → CompanyProfile (extended profile)
Company → CompanyLocations (head office + branches)
Company → CompanyDocuments (GST, registration, authorization)
Company → JobPosting → JobApplication → Interview
                     ↘ Assessments (optional screening)
Users (Students) ←── JobApplication
Users → Profiles, Skills, Projects, Certifications, Experiences
```

---

## Talent Matching Engine (UTME)

### Scoring Weights (configurable via Admin)
| Component | Default Weight |
|---|---|
| Skills Match | 35% |
| Work Experience | 20% |
| Projects | 15% |
| Certifications | 10% |
| Profile Completeness | 10% |
| Achievements | 5% |
| CGPA | 5% |

Weights are stored in `MatchingEngineConfig` (key: `"weights"`) and loaded dynamically. If not configured, defaults apply.

### Skill Expansion via UST
When recruiter searches for `"React"`, the Universal Skill Taxonomy expands it to also match aliases (`ReactJS`, `React.js`), sub-skills (`React Hooks`, `Redux`), and related skills (`Vue`, `Angular`).

---

## Caching Strategy

### Taxonomy Cache (`global.taxonomyCache`)
- TTL: 5 minutes sliding window
- Auto-invalidated on any write to `SkillTaxonomy`
- Survives Next.js hot-reloads via `global.*`

### Rate Limiter Store (`global.__rateLimitStore`)
- In-memory `Map<string, {count, windowStart}>`
- Per-IP, per-route-key
- Self-expiring sliding windows
- Not persisted across server restarts (acceptable for auth rate limiting)

---

## Report Exports

Both Admin and Company dashboards support CSV and Excel (tab-delimited XLS) exports:

| Report | Route | Formats |
|---|---|---|
| Candidate Pipeline | `/api/Company/reports/export-details` | CSV, XLS |
| Placement Summary | `/api/Admin/reports/export-details?type=placement` | CSV, XLS |
| Company Statistics | `/api/Admin/reports/export-details?type=company` | CSV, XLS |

Auth: Bearer token required in request header.

---

## Automation Cron

`/api/Automation/cron` — Runs 4 tasks:

1. **Job Expiry** — Sets `Approved` jobs past `Deadlines` to `Expired`
2. **Deadline Reminders** — Notifies eligible students of jobs closing within 24h
3. **Saved Search Refresh** — Re-runs dynamic talent pool criteria, notifies matching students
4. **Inactivity Audit** — Flags company users inactive 90+ days in audit logs

All results are written to `AutomationLog` table.

**Trigger:** Can be called manually from the Admin UI or by an external cron scheduler using `CRON_SECRET`.

---

## Performance Considerations

- **N+1 Elimination**: Applications endpoint batches all assessment attempts in one `IN` query and includes interviews via Prisma relation (no per-row queries)
- **Select Projections**: Dashboard stats and applications use `select` to fetch only needed columns
- **Pagination**: Taxonomy API supports `page`/`pageSize` for large datasets
- **Lazy Loading**: Tab-based navigation avoids loading all heavy data upfront
