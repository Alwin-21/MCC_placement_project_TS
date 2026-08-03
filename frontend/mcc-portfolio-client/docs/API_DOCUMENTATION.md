# MCC Placement Platform — API Documentation

## Company / HR Module

All Company endpoints are prefixed with `/api/Company/`. All requests require a valid Bearer JWT token in the `Authorization` header unless marked public.

---

## Authentication

### POST `/api/Company/Auth/login`
Login with HR credentials.

**Request Body**
```json
{ "email": "hr@company.com", "password": "SecurePass1" }
```

**Response**
```json
{
  "id": 1,
  "token": "<jwt>",
  "fullName": "John Doe",
  "email": "hr@company.com",
  "role": "Company",
  "companyId": 5,
  "companyName": "Acme Corp",
  "companyStatus": "Verified"
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400  | Missing or invalid email/password format |
| 401  | Invalid credentials |
| 403  | Account locked / company suspended or rejected |
| 429  | Rate limited (>10 requests/min per IP) |

---

### POST `/api/Company/Auth/register`
Register a new company + HR account (requires admin approval).

**Rate Limit:** 5 per hour per IP

**Request Body**
```json
{
  "companyName": "Acme Corp",
  "companyEmail": "info@acme.com",
  "officialHrEmail": "hr@acme.com",
  "hrName": "Jane Smith",
  "hrDesignation": "HR Manager",
  "hrPassword": "SecurePass1",
  "phone": "+91-9876543210",
  "industry": "Information Technology",
  "companyType": "Private Limited",
  "companySize": "200-500",
  "foundedYear": 2010,
  "headOffice": "Chennai, TN",
  "description": "...",
  "gstDocUrl": "https://...",
  "regDocUrl": "https://..."
}
```

**Password Rules:** Min 8 chars, at least 1 uppercase, 1 number.

---

### POST `/api/Company/Auth/forgot-password`
Request a password reset link. Rate limit: 3 per 10 min per IP.

### POST `/api/Company/Auth/reset-password`
Reset password with email + token + newPassword.

---

## Company Profile

### GET `/api/Company/profile`
Returns the full company profile, locations, documents, and HR user details.

### PUT `/api/Company/profile`
Update company profile fields (logo, cover, about, mission, vision, benefits, gallery, FAQs, contact, social links, etc.).

---

## Dashboard Statistics

### GET `/api/Company/dashboard-stats`
Returns key metrics for the Overview widget.

**Response**
```json
{
  "activeJobs": 3,
  "pendingJobs": 1,
  "approvedJobs": 3,
  "rejectedJobs": 0,
  "applicationsReceived": 47,
  "studentsShortlisted": 12,
  "interviewsScheduled": 5,
  "offersReleased": 2,
  "savedTalentPools": 4,
  "resumeDownloads": 18,
  "notifications": [...],
  "recentActivities": [...]
}
```

> `offersReleased` counts all applications in `Offer Sent`, `Offer Accepted`, and `Joined` stages.

---

## Job Postings

### GET `/api/Company/jobs`
Returns all job postings for the authenticated company.

### POST `/api/Company/jobs`
Create a new job posting (status defaults to `Pending`, awaits admin approval).

**Body**
```json
{
  "title": "Software Engineer",
  "department": "Computer Science",
  "description": "...",
  "responsibilities": "...",
  "requirements": "...",
  "requiredSkills": "Python;React;Node.js",
  "jobType": "FullTime",
  "workMode": "Hybrid",
  "eligibilityDepartments": "CSE;IT;ECE",
  "eligibilityMinCGPA": 7.0,
  "vacancies": 5,
  "salary": "6-8 LPA",
  "lpa": 7.0,
  "deadlines": "2026-09-30T18:30:00.000Z",
  "assessmentId": 3
}
```

### PUT `/api/Company/jobs/[id]`
Update an existing job posting.

### DELETE `/api/Company/jobs/[id]`
Delete a job posting.

---

## Applications

### GET `/api/Company/applications`
Returns all applications for the company's jobs with student profiles, assessment attempts (batched), interviews, and offer status.

> **Performance Note:** Assessment attempts are fetched in a single IN-query (no N+1). Interviews are included via Prisma relation.

### PUT `/api/Company/applications/[id]`
Update the pipeline status of an application.

**Valid statuses:**
`Applied` → `Reviewed` → `Shortlisted` → `InterviewScheduled` → `Selected` → `Offer Sent` → `Offer Accepted` → `Joined` | `Rejected`

**Body**
```json
{ "status": "Shortlisted" }
```

> Automatically dispatches a contextual notification to the student.

---

## Interviews

### POST `/api/Company/interviews`
Schedule an interview for an application.

**Body**
```json
{
  "applicationId": 42,
  "type": "Online",
  "scheduleTime": "2026-09-15T10:00:00.000Z",
  "meetLink": "https://meet.google.com/abc-def",
  "feedback": "Round 1 Technical"
}
```

### PUT `/api/Company/interviews/[id]`
Reschedule or cancel an interview.

---

## Offer Management

### POST `/api/Company/applications/[id]/release-offer`
Release an offer letter PDF URL to a candidate.

**Body**
```json
{ "offerLetterUrl": "https://cdn.mcc.edu/offers/offer_42.pdf" }
```

---

## Talent Search (UTME)

### POST `/api/Company/talent-search`
Run the Universal Talent Matching Engine with filters.

**Body**
```json
{
  "keywords": "machine learning",
  "skills": ["Python", "TensorFlow"],
  "domains": ["AI/ML"],
  "departments": ["CSE"],
  "experience": "freshers",
  "certifications": ["AWS"],
  "minCgpa": 7.5,
  "page": 1,
  "pageSize": 20
}
```

**Response** — Array of matched students ordered by match score (0–100).

---

## Talent Pools

### GET `/api/Company/talent-pools`
Returns all saved talent pools.

### POST `/api/Company/talent-pools`
Create a new static or dynamic talent pool.

### DELETE `/api/Company/talent-pools/[id]`
Delete a pool.

---

## Analytics

### GET `/api/Company/analytics`
Returns hiring funnel metrics, average match score, popular skills, and acceptance rate.

---

## Reports

### GET `/api/Company/reports/export-details?format=csv`
Download candidate pipeline report. `format` can be `csv` or `excel`.

---

## Assessments (Read-Only)

### GET `/api/Company/assessments`
Returns published assessments that can be attached to job postings.

### GET `/api/Company/assessments/[id]/results`
Returns score rankings for an assessment's candidates.

---

## Admin Module

### GET `/api/Admin/analytics`
Campus-wide placement KPIs including company stats, department placements, salary matrices, and yearly trends.

### GET `/api/Admin/reports/export-details?format=csv&type=placement|company`
Download placement or company statistics report.

---

## Automation

### POST `/api/Automation/cron`
Trigger automation tasks manually.

**Authorization:** `Bearer <CRON_SECRET>` header OR Admin JWT.

**Tasks performed:**
1. Expire jobs past deadline
2. Send closing-soon notifications (24h window)
3. Run saved search pool refreshes
4. Flag inactive companies (90-day threshold)
5. Log all results to `AutomationLog`

---

## Rate Limits Summary

| Endpoint | Limit |
|---|---|
| Company Login | 10 / min per IP |
| Company Register | 5 / hour per IP |
| Forgot Password | 3 / 10 min per IP |
| Talent Search | 30 / min per IP |

---

## Error Response Format

All errors return:
```json
{ "message": "Descriptive error message" }
```

HTTP status codes used: `400` (bad input), `401` (unauthorized), `403` (forbidden), `404` (not found), `429` (rate limited), `500` (server error).
