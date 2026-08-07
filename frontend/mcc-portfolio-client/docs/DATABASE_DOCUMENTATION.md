# MCC Placement Platform — Database Documentation

> Database: PostgreSQL. ORM: Prisma 5. Schema: `prisma/schema.prisma`

---

## Company Module Models

### Company
Primary record for each registered company.

| Column | Type | Description |
|---|---|---|
| Id | Int (PK) | Auto-increment primary key |
| Name | String | Company name (unique, case-insensitive) |
| Email | String (unique) | Official company email |
| Status | String | `Pending` / `Verified` / `Rejected` / `Suspended` / `Inactive` / `Archived` |
| CreatedAt | DateTime | Registration timestamp |
| UpdatedAt | DateTime | Last update timestamp |

**Relations:** `Profile`, `Documents`, `Locations`, `Users`, `Verifications`, `StatusHistory`, `AuditLogs`, `JobPostings`, `SavedTalentPools`

---

### CompanyUsers
HR representatives linked to a Company.

| Column | Type | Description |
|---|---|---|
| Id | Int (PK) | |
| CompanyId | Int (FK) | References `Company.Id` |
| FullName | String | |
| Email | String (unique) | Login email |
| PasswordHash | String | SHA-256 hashed password |
| Designation | String | HR role title |
| Phone | String | |
| AlternatePhone | String? | |
| IsActive | Boolean | Account active flag |
| FailedLoginAttempts | Int | Brute-force counter |
| LockedUntil | DateTime? | Lockout expiry |
| CreatedAt | DateTime | |

---

### CompanyProfile
Extended public-facing profile for a company.

| Column | Type | Description |
|---|---|---|
| LogoUrl | String? | Company logo image URL |
| CoverImageUrl | String? | Cover/banner image URL |
| Website | String? | |
| LinkedInUrl | String? | |
| Industry | String | e.g. `Information Technology` |
| CompanyType | String | e.g. `Private Limited` |
| CompanySize | String | e.g. `200-500` |
| FoundedYear | Int | |
| Description | String | About the company |
| Mission | String? | |
| Vision | String? | |
| WorkCulture | String? | |
| Benefits | String? | |
| Awards | String? | |
| Achievements | String? | |
| RecruitmentProcess | String? | |
| InternshipAvailable | Boolean | |
| PlacementAvailable | Boolean | |
| Gallery | String? | Semicolon-separated image URLs |
| Videos | String? | Semicolon-separated video URLs |
| PlacementHistory | String? | JSON or text |
| InternshipPrograms | String? | |
| FAQs | String? | JSON string of Q&A pairs |
| ContactDetails | String? | JSON string |
| SocialLinks | String? | JSON string |

---

### CompanyLocations
Office locations for a company.

| Column | Type | Description |
|---|---|---|
| Location | String | City/address |
| IsHeadOffice | Boolean | Marks primary office |
| WorkMode | String | `Remote` / `Hybrid` / `OnSite` |

---

### CompanyDocuments
Uploaded compliance documents.

| Column | Type | Description |
|---|---|---|
| GSTDocUrl | String? | GST certificate URL |
| RegistrationDocUrl | String? | Company registration doc URL |
| AuthorizationDocUrl | String? | Authorization letter URL |

---

### CompanyVerification
Admin-managed verification workflow.

| Column | Type | Description |
|---|---|---|
| VerifiedBy | String? | Admin email |
| VerifiedAt | DateTime? | |
| Comments | String? | Review notes |

---

### CompanyStatusHistory
Audit trail of status changes.

| Column | Type | Description |
|---|---|---|
| OldStatus | String | Previous status |
| NewStatus | String | New status |
| ChangedBy | String | Admin email or `"System"` |
| Comments | String? | Reason/notes |
| Timestamp | DateTime | |

> **Note:** Also used to store password reset tokens temporarily (in `Comments` field with `"Token: <hex>"` pattern).

---

### CompanyAuditLogs
Full audit log for all HR actions.

| Column | Type | Description |
|---|---|---|
| CompanyId | Int (FK) | |
| Action | String | Action label |
| PerformedByEmail | String | HR user email |
| Details | String | Full description |
| IpAddress | String | Client IP |
| Timestamp | DateTime | |

---

## Job Posting Models

### JobPosting
A job opportunity posted by a company.

| Column | Type | Description |
|---|---|---|
| CompanyId | Int (FK) | References `Company.Id` |
| Title | String | |
| Department | String | Target academic department |
| Description | String | Full job description |
| Responsibilities | String | |
| Requirements | String | |
| RequiredSkills | String | Semicolon-separated |
| PreferredSkills | String | Semicolon-separated |
| JobType | String | `FullTime` / `Internship` / `PartTime` / `Contract` |
| WorkMode | String | `Remote` / `Hybrid` / `OnSite` |
| EligibilityDepartments | String | Semicolon-separated |
| EligibilityYears | String | Semicolon-separated graduation years |
| EligibilityMinCGPA | Float | Minimum CGPA threshold |
| Vacancies | Int | Number of openings |
| Salary | String | Salary description |
| LPA | Float | Numeric salary (LPA) |
| Benefits | String | |
| SelectionProcess | String | |
| Deadlines | DateTime | Application deadline |
| Status | String | `Pending` / `Approved` / `Rejected` / `ChangesRequested` / `Expired` |
| AssessmentId | Int? (FK) | Optional screening test |

---

### JobApplication
Student application for a job.

| Column | Type | Description |
|---|---|---|
| JobId | Int (FK) | |
| StudentId | Int (FK) | References `Users.Id` |
| ResumeUrl | String | Resume PDF URL |
| Status | String | Pipeline stage (see below) |
| AppliedAt | DateTime | |
| OfferLetterUrl | String? | Released offer letter URL |
| OfferStatus | String? | `Sent` / `Accepted` / `Rejected` |
| OfferReleasedAt | DateTime? | |

**Pipeline Statuses (in order):**
`Applied` → `Reviewed` → `Shortlisted` → `InterviewScheduled` → `Selected` → `Offer Sent` → `Offer Accepted` → `Joined` | `Rejected`

**Relations:** `Interviews`

---

### Interview
Interview record linked to an application.

| Column | Type | Description |
|---|---|---|
| ApplicationId | Int (FK) | References `JobApplication.Id` |
| Type | String | `Online` / `Offline` / `Campus` |
| ScheduleTime | DateTime | |
| MeetLink | String? | Google Meet / Teams URL |
| Venue | String? | Physical location |
| Status | String | `Scheduled` / `Rescheduled` / `Cancelled` / `Completed` |
| Feedback | String? | HR notes |

---

## Talent Pool Models

### SavedTalentPool
A saved collection of student candidates.

| Column | Type | Description |
|---|---|---|
| CompanyId | Int (FK) | |
| Name | String | Pool name |
| Type | String | `Static` / `Dynamic` |
| StudentIds | String? | Comma-separated student IDs (static) |
| Criteria | String? | JSON search criteria (dynamic) |

---

## Automation Models

### SavedSearchAlert
Tracks saved search criteria for notification alerts.

| Column | Type | Description |
|---|---|---|
| CompanyId | Int (FK) | |
| Criteria | String | JSON criteria |
| NotifiedStudentIds | String | Previously notified IDs |
| LastRunAt | DateTime | |

### AutomationLog
Log of each automation cron run.

| Column | Type | Description |
|---|---|---|
| Action | String | Task label |
| Details | String | Pipe-separated task outcomes |
| Success | Boolean | Overall success flag |
| Timestamp | DateTime | |

---

## Analytics / Config Models

### MatchingEngineConfig
Key-value store for UTME weight configuration.

| Column | Type | Description |
|---|---|---|
| ConfigKey | String (unique) | e.g. `"weights"` |
| ConfigVal | String | JSON value |

### SkillTaxonomy
Centralized skill registry (UST).

| Column | Type | Description |
|---|---|---|
| SkillName | String | Primary skill name |
| Domain | String | e.g. `Web Development` |
| Department | String | e.g. `Computer Science` |
| SkillType | String | e.g. `Technical`, `Soft Skill` |
| Aliases | String | Semicolon-separated aliases |
| SubSkills | String | Semicolon-separated sub-skills |
| RelatedSkills | String | Semicolon-separated related skills |
| Software | String? | |
| ProgrammingLanguages | String? | |
| Certifications | String? | |
| Description | String? | |

---

## Database Indexes

Key performance indexes defined in schema:
- `JobApplication`: `@@index([JobId])`, `@@index([StudentId])`
- `CompanyUsers`: `Email` (unique)
- `Company`: `Email` (unique)
- `SkillTaxonomy`: `SkillName`

---

## Soft Deletes / Status Lifecycle

None of the models use soft deletes. Company records transition through statuses:
`Pending` → `Verified` → (`Suspended` | `Inactive` | `Archived`)

Job postings: `Pending` → `Approved` → `Expired` (auto by cron)
