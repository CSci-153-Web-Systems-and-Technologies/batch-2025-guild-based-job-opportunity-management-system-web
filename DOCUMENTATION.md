# Guild-Based Job Opportunity Management System

## 1. Project overview

This web application gamifies job discovery and application workflows for students through a quest board metaphor. Users earn experience points (XP), progress through ranks, form parties, and apply to jobs (quests) while administrators manage opportunities and track applicant progress. The system is designed as a student project MVP demonstrating full-stack development using modern frameworks, authentication flows, role-based access control, and secure database interactions.

**Core purpose**: Enable students to explore job opportunities in a gamified environment with XP, ranks, parties, and application tracking.

**Target users**: 
- Students seeking job opportunities with gamification elements
- Administrators managing job postings and applications

**Tech stack**:
- **Language**: TypeScript
- **Framework**: Next.js 16
- **Runtime**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, Lucide React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Animation**: Framer Motion
- **Utilities**: Class Variance Authority, clsx, tailwind-merge

---

## 2. Architecture overview

The application follows a **Next.js App Router architecture** with server-side rendering, API routes, and middleware protection. The system is organized into three main layers:

1. **Frontend Layer**: React components with Tailwind CSS styling, organized by feature (dashboard, questboard, party-management, leaderboard, admin)
2. **API Layer**: Next.js API routes (`/src/app/api/*`) providing RESTful endpoints for frontend consumption
3. **Data Layer**: Supabase PostgreSQL database with server-side Supabase clients and middleware-level session management

**Design patterns**:
- **Component-based architecture**: Modular React components organized by feature/domain
- **Server-side rendering (SSR)**: Next.js layouts and pages with server-side data fetching
- **REST API**: Next.js API routes with standardized error/success responses
- **Role-based access control (RBAC)**: Middleware protection for admin routes; role validation in API endpoints
- **Authentication flow**: Supabase Auth with automatic session refresh via middleware

**Major modules**:
- **Frontend**: Pages, components, assets, styles
- **API**: Jobs, applications, parties, ranks, leaderboard, authentication, admin functions
- **Authentication & Authorization**: Middleware + server/client Supabase clients
- **Database**: Roles, ranks, user_stats, parties, party_members, jobs, job_applications, profiles
- **Utilities**: Logger, API response helpers, profile helpers, admin helpers, middleware helpers

---

## 3. Project structure

```
/components/       — React UI components organized by feature (admin, auth, dashboard, leaderboard, party-management, questboard, ui)
/lib/              — Shared library functions: Supabase clients, middleware, logging, API responses, admin checks
/types/            — TypeScript types: database models (db.ts), dashboard interfaces (dashboard.ts)
/app/              — Next.js App Router pages and layouts, organized by route
  /api/            — API endpoints for all functionality (jobs, apply, auth, admin, parties, etc.)
  /(auth)/         — Authentication pages (login, sign-up, oauth-callback, forgot-password, etc.)
  /dashboard/      — Student dashboard page and layout
  /questboard/     — Quest board (job listings) page and layout
  /party-management/ — Party management page and layout
  /leaderboard/    — Leaderboard page and layout
  /admin/          — Admin panel pages and layouts
  /protected/      — Protected test page
  /unauthorized/   — Unauthorized error page
/assets/           — Static images (login-background.jpg, icons/)
/supabase/         — Database migrations and configuration
/docs/             — Documentation files (db-schema.md)
/public/           — Static public assets
/scripts/          — Helper scripts (clean-next.js)

middleware.ts      — Next.js middleware for session management and route protection
globals.css        — Global styles and Tailwind CSS imports with custom color tokens
next.config.ts     — Next.config configuration (image remote patterns)
tsconfig.json      — TypeScript compiler configuration
package.json       — Dependencies and npm scripts
postcss.config.mjs — PostCSS configuration for Tailwind
eslint.config.mjs  — ESLint configuration
```

**How the project is assembled**:

1. **Entry Point**: `/src/app/layout.tsx` (root layout) → `/src/app/page.tsx` (redirects to `/dashboard`)
2. **Page Structure**: App Router groups routes into logical sections:
   - Auth pages under `/auth/` (auto-protected by middleware)
   - Student features under `/dashboard/`, `/questboard/`, `/party-management/`, `/leaderboard/`
   - Admin features under `/admin/` (role-protected by middleware + handler checks)
3. **API Consumption**: Frontend components fetch from `/api/*` endpoints
4. **Middleware Flow**: Incoming request → `middleware.ts` → Session refresh + Admin redirect check → Route handler
5. **Separation of concerns**:
   - **UI/Components**: `/components/` (presentation logic only, styled with Tailwind)
   - **Business Logic**: `/lib/` (authentication, admin checks, API helpers)
   - **API Routes**: `/app/api/` (request handling, database queries, authorization)
   - **Data Models**: `/types/` (type definitions; schema source of truth is Supabase migrations)
   - **Configuration**: Root-level config files (tsconfig, postcss, eslint, next)
6. **Naming Conventions**:
   - Components use PascalCase (JobCard.tsx)
   - Utility files use camelCase (api-response.ts)
   - API routes follow REST pattern: `[method].ts` inside directory named after resource (e.g., `jobs/route.ts`, `parties/[id]/route.ts`)
   - Feature folders mirror the route structure for organization

---

## 4. Color scheme & design tokens

The project uses **Tailwind CSS 4** with a custom **OKLch color space** design system. All colors are defined as CSS custom properties in `:root` and referenced via Tailwind's `@theme` directive.

### Brand colors

| Name | OKLch Value | Hex Equivalent | Usage |
|------|-------------|---|---|
| Primary | oklch(0.21 0.034 264.665) | #29314D (dark blue) | Buttons, links, CTAs, primary actions |
| Primary Foreground | oklch(0.985 0.002 247.839) | #FAFBFB (near white) | Text on primary background |
| Secondary | oklch(0.967 0.003 264.542) | #F0F1F2 (light gray) | Backgrounds, cards, secondary UI |
| Secondary Foreground | oklch(0.21 0.034 264.665) | #29314D (dark blue) | Text on secondary background |
| Accent | oklch(0.967 0.003 264.542) | #F0F1F2 (light gray) | Highlights, badges, accents |
| Accent Foreground | oklch(0.21 0.034 264.665) | #29314D (dark blue) | Text on accent background |
| Destructive | oklch(0.577 0.245 27.325) | #C1272D (red) | Errors, delete actions, alerts |
| Border | oklch(0.928 0.006 264.531) | #DFE1E5 (light gray) | Borders, dividers |
| Input | oklch(0.928 0.006 264.531) | #DFE1E5 (light gray) | Form inputs, borders |
| Muted | oklch(0.967 0.003 264.542) | #F0F1F2 (light gray) | Disabled states, inactive elements |
| Muted Foreground | oklch(0.551 0.027 264.364) | #808C9D (medium gray) | Text on muted background |
| Ring | oklch(0.707 0.022 261.325) | #8D92A8 (purple-gray) | Focus rings, outlines |
| Card | oklch(1 0 0) | #FFFFFF (white) | Card backgrounds |
| Card Foreground | oklch(0.13 0.028 261.692) | #1F2937 (dark gray) | Text on card |
| Popover | oklch(1 0 0) | #FFFFFF (white) | Popover backgrounds |
| Popover Foreground | oklch(0.13 0.028 261.692) | #1F2937 (dark gray) | Text on popover |
| Background | oklch(1 0 0) | #FFFFFF (white) | Page background |
| Foreground | oklch(0.13 0.028 261.692) | #1F2937 (dark gray) | Default text color |

### Chart colors (data visualization)

| Name | OKLch Value |
|------|------|
| Chart 1 | oklch(0.646 0.222 41.116) (orange) |
| Chart 2 | oklch(0.6 0.118 184.704) (cyan) |
| Chart 3 | oklch(0.398 0.07 227.392) (purple) |
| Chart 4 | oklch(0.828 0.189 84.429) (yellow) |
| Chart 5 | oklch(0.769 0.188 70.08) (green) |

### Sidebar colors (navigation)

| Name | OKLch Value | Usage |
|------|------|------|
| Sidebar | oklch(0.985 0.002 247.839) | Sidebar background |
| Sidebar Foreground | oklch(0.13 0.028 261.692) | Sidebar text |
| Sidebar Primary | oklch(0.21 0.034 264.665) | Active sidebar items |
| Sidebar Primary Foreground | oklch(0.985 0.002 247.839) | Text on active sidebar items |
| Sidebar Accent | oklch(0.967 0.003 264.542) | Hover states on sidebar |
| Sidebar Accent Foreground | oklch(0.21 0.034 264.665) | Text on sidebar accent |
| Sidebar Border | oklch(0.928 0.006 264.531) | Sidebar dividers |
| Sidebar Ring | oklch(0.707 0.022 261.325) | Sidebar focus rings |

### Typography

- **Font Family (Headings & Body)**: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`
- **Font Family (Monospace)**: `ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Segoe UI Mono", "Helvetica Neue", monospace`
- **Base Font Size**: Not explicitly set (uses browser default); responsive text scaling via Tailwind utilities (text-sm, text-base, md:text-lg, etc.)

### Spacing & layout

- **Base Spacing Unit**: Tailwind default (4px grid)
- **Border Radius Base**: `0.625rem` (10px) defined as `--radius`
  - `--radius-sm`: calc(var(--radius) - 4px) → 6px
  - `--radius-md`: calc(var(--radius) - 2px) → 8px
  - `--radius-lg`: var(--radius) → 10px
  - `--radius-xl`: calc(var(--radius) + 4px) → 14px
- **Responsive Breakpoints**: Standard Tailwind (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)

### Other tokens

- **Shadows**: Not explicitly defined; uses Tailwind defaults (shadow-sm, shadow-md, shadow-lg)
- **Named Theme Variables**: All colors prefixed with `--color-` (e.g., `--color-primary`, `--color-secondary-foreground`)
- **Animation Library**: `tw-animate-css` imported for additional animation utilities

### Color System Implementation

Colors are defined in **three places** (but ultimately source from CSS custom properties):

1. **CSS Variables** (primary): `/src/app/globals.css` defines `:root` variables (used by Tailwind)
2. **Tailwind @theme** (integration): `/src/app/globals.css` uses `@theme inline` to map CSS vars to Tailwind tokens
3. **Dark Mode**: Implemented via `@custom-variant dark (&:is(.dark *))`

All component styling uses Tailwind classes (e.g., `bg-primary`, `text-foreground`, `border-border`), which resolve to the OKLch values at runtime.

---

## 5. Setup & installation

### Prerequisites

- **Node.js**: v18 or higher (v20+ recommended)
- **npm** or **yarn**: For package management
- **Supabase account**: Create a free account at [supabase.com](https://supabase.com)
- **Environment variables**: See section below

### Install dependencies

```bash
npm install
```

### Environment configuration

Create a `.env.local` file in the project root with the following variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Your Supabase anonymous/public key (safe to expose in frontend) | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (keep secret; used for admin operations) | `eyJhbGc...` |
| `ADMIN_INVITE_CODE` | Secret code required for users to self-promote to admin role | Any string (e.g., `secret-admin-123`) |

All other variables are optional. Get Supabase keys from your project's **Settings → API** in the Supabase dashboard.

### Run commands

```bash
# Development server (hot reload on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Clean Next.js cache
npm run clean:next
```

---

## 6. Features & functionality

### Quest Board (Job Listings)

Browse and filter available job postings (quests) with advanced filtering. Users can view job details, apply to quests, and track their applications.

- **Files/Components**: `src/app/questboard/`, `src/components/dashboard/JobList.tsx`, `src/components/dashboard/JobCard.tsx`
- **API**: `GET /api/jobs` with query filters (difficulty, category, datePosted, limit, offset)
- **Functionality**:
  - Fetch jobs filtered by rank difficulty, category, and date posted
  - Display job cards with title, company, location, pay, slots, reward XP, and deadline
  - Click to open job detail modal
  - Apply button triggers job application

### Job Application Workflow

Submit and track applications to quests. Prevent duplicate applications via database constraints.

- **Files/Components**: API endpoint `POST /api/apply`, application status tracking in components
- **Statuses**: `pending`, `accepted`, `in_progress`, `completed`, `rejected`
- **Logic**:
  - POST `/api/apply` checks user authentication, job existence, job open status, and prevents duplicates
  - Application inserted with status `pending`
  - Admin can update application status via `PATCH /api/admin/job-applications`
  - When accepting an application, job slots are decremented with optimistic concurrency control

### XP & Rank Progression

Users earn XP upon completing accepted jobs (admin-granted). Ranks automatically update based on XP thresholds via database trigger.

- **Files/Components**: `src/components/leaderboard/`, `src/app/leaderboard/`
- **Ranks**:
  - Beginner (0–149 XP)
  - Apprentice (150–499 XP)
  - Specialist (500–999 XP)
  - Expert (1000–1749 XP)
  - Master (1750–2499 XP)
  - Grandmaster (2500+ XP)
- **Logic**:
  - Trigger `trg_update_rank` automatically updates `current_rank_id` when `user_stats.xp` changes
  - Dashboard displays current rank, total XP, and progress to next rank
  - Leaderboard shows top rankers and full user rankings by XP

### Party System

Create or join parties (guilds) with other students. Parties have leaders, members, rank requirements, and category tags.

- **Files/Components**: `src/app/party-management/`, `src/components/party-management/`
- **API**:
  - `GET /api/parties` (with optional `includeMembers=true` to fetch member rosters)
  - `POST /api/parties` (create new party)
  - `POST /api/parties/[id]/join` (join existing party)
- **Fields**:
  - `name`, `description`, `leader_id`, `category`, `min_rank_id`, `created_at`
  - Many-to-many relationship via `party_members` table with role and joined_at timestamp
- **Functionality**:
  - Browse all parties with filtering by category and minimum rank
  - Party details show member count, leader name, category, and minimum rank requirement
  - Users can create a new party (become leader) or join existing parties (if rank requirement met)

### Dashboard & Profile

Central hub displaying user stats, application summary, and personalized progress.

- **Files/Components**: `src/app/dashboard/`, `src/components/dashboard/Topbar.tsx`, `src/components/dashboard/WelcomeSection.tsx`
- **Content**:
  - User greeting with profile avatar/name
  - Current rank badge and XP progress bar
  - Recent applications widget
  - Available quests section (JobList)
- **Logic**: Fetch user profile, stats, and applications; display in cards and widgets

### Leaderboard

Global ranking system displaying top players by XP with party affiliation.

- **Files/Components**: `src/app/leaderboard/`, `src/components/leaderboard/TopRankersSection.tsx`, `src/components/leaderboard/FullLeaderboardTable.tsx`
- **API**: `GET /api/leaderboard?limit=50&offset=0` returns user rankings with profile, rank, party info
- **Display**:
  - Top 3 rankers in prominent cards
  - Full paginated leaderboard table with rank position, user name, XP, current rank, party

### Authentication & Authorization

Multi-method authentication with email/password and Google OAuth. Role-based access control (RBAC) with student/admin roles.

- **Files/Components**: 
  - Auth pages: `/src/app/auth/login/`, `/auth/sign-up/`, `/auth/oauth-callback/`, etc.
  - Components: `src/components/login-form.tsx`, `src/components/sign-up-form.tsx`, `src/components/oauth-button.tsx`
  - Middleware: `src/middleware.ts`, `src/lib/middleware.ts`
- **Flow**:
  - Users sign up with email/password or via Google OAuth
  - Supabase Auth creates authentication record
  - Profile automatically synced to `profiles` table
  - Default role: `student` (role_id = 1)
  - Admin role (role_id = 2) granted by submitting invite code to `POST /api/admin/invite`
- **Middleware Protection**:
  - Session updated in middleware via `updateSession()`
  - Unauthenticated users redirected to `/auth/login`
  - Admin routes (`/admin/*`) require `role: 'admin'` in user_metadata or profiles.role_id
  - Admins redirected away from `/dashboard/` to `/admin/` via `redirectAdminFromUserDashboard()`

### Admin Panel

Admin-only interface for job management, application review, and admin promotion.

- **Files/Components**:
  - Pages: `/src/app/admin/(dashboard)/`, `/admin/invite/`, `/admin/jobs/`
  - Components: `src/components/admin/JobForm.tsx`, `src/components/admin/JobApplications.tsx`, `src/components/admin/DeleteJobButton.tsx`
- **API Endpoints**:
  - `GET /api/admin/jobs` — List all jobs
  - `POST /api/admin/jobs` — Create job
  - `PUT /api/admin/jobs/[id]` — Update job
  - `DELETE /api/admin/jobs/[id]` — Delete job
  - `GET /api/admin/job-applications` — List applications
  - `PATCH /api/admin/job-applications` — Update application status
  - `POST /api/admin/invite` — Validate invite code and promote user to admin
- **Functionality**:
  - Create/update/delete job postings with title, description, category, pay, location, slots, deadlines, reward XP, and recommended rank
  - Review and manage job applications (accept, reject, complete, etc.)
  - Invite codes for admin self-promotion

---

## 7. API reference

### Core Job Endpoints

#### **GET** /api/jobs
Fetch available jobs with optional filtering.

**Query Parameters**:
- `difficulty` (string): Rank name filter (e.g., "Apprentice", "Expert"; default: all)
- `category` (string): Job category filter (default: all)
- `datePosted` (string): Time filter ("Last Week", "Last Month", "Recent", "All Time"; default: all)
- `limit` (number): Max results per page (default: 50, max: 100)
- `offset` (number): Pagination offset (default: 0)

**Response**:
```json
{
  "status": "success",
  "data": {
    "jobs": [
      {
        "id": "uuid-string",
        "title": "Software Engineer",
        "description": "...",
        "category": "Technology",
        "pay": 30000,
        "location": "Remote",
        "slots": 5,
        "reward_xp": 100,
        "status": "open",
        "deadline": "2026-05-01",
        "recommended_rank_id": 2,
        "created_at": "2025-12-13T..."
      }
    ]
  }
}
```

**Auth required**: No

---

#### **POST** /api/apply
Submit a job application.

**Request Body**:
```json
{
  "jobId": "job-uuid-or-id"
}
```

**Response** (201 Created on success):
```json
{
  "status": "success",
  "data": {
    "application": {
      "id": "app-uuid",
      "job_id": "job-uuid",
      "user_id": "user-uuid",
      "status": "pending",
      "created_at": "2025-12-13T..."
    }
  }
}
```

**Error responses**:
- 400: Invalid job id, job not open, already applied
- 401: Not authenticated
- 404: Job or profile not found
- 409: Already applied to this job
- 500: Server error

**Auth required**: Yes (user must be authenticated)

---

### Rank & Leaderboard Endpoints

#### **GET** /api/ranks
Fetch all rank definitions.

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Beginner",
      "min_xp": 0,
      "max_xp": 149
    },
    {
      "id": 2,
      "name": "Apprentice",
      "min_xp": 150,
      "max_xp": 499
    }
  ]
}
```

**Auth required**: No

---

#### **GET** /api/leaderboard
Fetch global leaderboard with user rankings.

**Query Parameters**:
- `limit` (number): Max results (default: 50, max: 100)
- `offset` (number): Pagination offset (default: 0)

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "rank": 1,
      "xp": 2500,
      "user_id": "uuid",
      "profile": {
        "id": "uuid",
        "display_name": "Player Name",
        "avatar_url": "https://...",
        "email": "user@example.com"
      },
      "rank_name": "Grandmaster",
      "party_name": "Epic Guild" | null
    }
  ]
}
```

**Auth required**: No

---

### Party Endpoints

#### **GET** /api/parties
Fetch all parties with optional member roster.

**Query Parameters**:
- `includeMembers` (boolean): Include party members roster (default: false)

**Response**:
```json
{
  "status": "success",
  "data": {
    "parties": [
      {
        "id": 1,
        "name": "Dragon Slayers",
        "description": "Elite team",
        "leader_id": "uuid",
        "category": "Technology",
        "min_rank_id": 2,
        "created_at": "2025-12-13T...",
        "profiles": {
          "display_name": "Leader Name",
          "avatar_url": "https://..."
        },
        "ranks": {
          "name": "Apprentice",
          "min_xp": 150
        }
      }
    ],
    "members": {
      "1": [
        {
          "id": 1,
          "party_id": 1,
          "user_id": "uuid",
          "role": "member",
          "joined_at": "2025-12-13T...",
          "profiles": {
            "display_name": "Member Name",
            "avatar_url": "https://..."
          }
        }
      ]
    }
  }
}
```

**Auth required**: No

---

#### **POST** /api/parties
Create a new party.

**Request Body**:
```json
{
  "name": "My Party",
  "description": "Optional description",
  "min_rank_id": 2,
  "category": "Technology"
}
```

**Response** (201 Created):
```json
{
  "status": "success",
  "data": {
    "party": {
      "id": 5,
      "name": "My Party",
      "leader_id": "user-uuid",
      "created_at": "2025-12-13T..."
    }
  }
}
```

**Auth required**: Yes

---

### Authentication Endpoints

#### **POST** /api/auth/sync-session
Sync Supabase session from client (internal use).

**Request Body**:
```json
{
  "access_token": "jwt-token",
  "refresh_token": "jwt-token"
}
```

**Response**:
```json
{
  "ok": true
}
```

**Auth required**: No (uses tokens in body)

---

### Admin Endpoints

#### **GET** /api/admin/jobs
List all jobs (admin only).

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "...",
      "description": "...",
      "category": "...",
      "pay": 30000,
      "location": "...",
      "slots": 5,
      "reward_xp": 100,
      "status": "open",
      "deadline": "...",
      "recommended_rank_id": 2,
      "created_by": "admin-uuid",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

**Auth required**: Yes (admin role required)

---

#### **POST** /api/admin/jobs
Create a new job posting.

**Request Body**:
```json
{
  "title": "Job Title",
  "description": "Job description",
  "category": "Technology",
  "pay": 30000,
  "location": "Remote",
  "slots": 5,
  "reward_xp": 100,
  "deadline": "2026-05-01",
  "recommended_rank_id": 2
}
```

**Response**:
```json
{
  "data": [
    {
      "id": "new-uuid",
      "title": "Job Title",
      ...
    }
  ]
}
```

**Auth required**: Yes (admin role required)

---

#### **PUT** /api/admin/jobs/[id]
Update an existing job.

**Request Body**: Same as POST (any subset of fields)

**Response**: Updated job object

**Auth required**: Yes (admin role required)

---

#### **DELETE** /api/admin/jobs/[id]
Delete a job posting.

**Response**:
```json
{
  "message": "Job deleted successfully"
}
```

**Auth required**: Yes (admin role required)

---

#### **GET** /api/admin/job-applications
List all job applications (admin only).

**Response**:
```json
{
  "applications": [
    {
      "id": "app-uuid",
      "job_id": "job-uuid",
      "user_id": "user-uuid",
      "status": "pending",
      "created_at": "...",
      "jobs": {
        "id": "job-uuid",
        "title": "Job Title"
      },
      "profiles": {
        "id": "user-uuid",
        "display_name": "User Name",
        "avatar_url": "https://..."
      }
    }
  ]
}
```

**Auth required**: Yes (admin role required)

---

#### **PATCH** /api/admin/job-applications
Update an application status.

**Request Body**:
```json
{
  "appId": "application-uuid",
  "status": "accepted" | "rejected" | "completed" | "in_progress" | "pending"
}
```

**Response**:
```json
{
  "application": {
    "id": "app-uuid",
    "status": "accepted",
    ...
  }
}
```

**Special behavior**: When status is set to `accepted`, the job's available slots are decremented with optimistic concurrency control (compare-and-swap pattern).

**Auth required**: Yes (admin role required)

---

#### **POST** /api/admin/invite
Promote user to admin by validating invite code.

**Request Body**:
```json
{
  "code": "secret-admin-code"
}
```

**Response**:
```json
{
  "success": true
}
```

**Error responses**:
- 400: Invalid code
- 401: Not authenticated
- 500: Server error or missing ADMIN_INVITE_CODE env var

**Auth required**: Yes (but code grants admin promotion)

---

## 8. Data models / schema

### Profiles

User profile information synced from Supabase Auth.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key, references auth.users.id |
| auth_id | UUID | No | Reference to Supabase auth user ID |
| email | text | No | User email (from auth) |
| first_name | text | No | First name |
| last_name | text | No | Last name |
| display_name | text | No | Public display name |
| avatar_url | text | No | URL to profile avatar/photo |
| metadata | jsonb | No | Additional metadata |
| role_id | BIGINT | No | Foreign key to roles.id (default: 1 = student) |
| created_at | timestamptz | Auto | Account creation timestamp |
| updated_at | timestamptz | Auto | Last profile update |

---

### Roles

Application roles for RBAC.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | BIGINT | Yes | Primary key |
| name | text | Yes | Role name (unique) |
| description | text | No | Role description |

**Default values**:
- ID 1: `student` (default role for all users)
- ID 2: `admin` (administrative access)

---

### Ranks

User progression levels based on XP thresholds.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | BIGINT | Yes | Primary key |
| name | text | Yes | Rank name (e.g., "Apprentice") |
| min_xp | integer | Yes | Minimum XP for this rank |
| max_xp | integer | Yes | Maximum XP for this rank |

**Predefined ranks**:
- Beginner (0–149 XP)
- Apprentice (150–499 XP)
- Specialist (500–999 XP)
- Expert (1000–1749 XP)
- Master (1750–2499 XP)
- Grandmaster (2500+ XP)

---

### UserStats

Tracks user experience points and current rank.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| user_id | UUID | Yes | Foreign key to profiles.id (primary key, cascade delete) |
| xp | integer | No | Total experience points (default: 0) |
| current_rank_id | BIGINT | No | Foreign key to ranks.id (auto-updated by trigger) |
| updated_at | timestamptz | Auto | Last update timestamp |

**Triggers**: `trg_update_rank` automatically updates `current_rank_id` when `xp` changes based on rank thresholds.

---

### Jobs

Job postings (quests) created by admins.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| title | text | Yes | Job title |
| description | text | No | Job description/details |
| category | text | No | Job category (e.g., "Technology", "Design") |
| pay | numeric | No | Compensation amount |
| location | text | No | Job location |
| slots | integer | No | Number of available positions |
| reward_xp | integer | No | XP reward for completing the job |
| status | text | No | Job status ("open", "closed", etc.; default: "open") |
| deadline | timestamptz | No | Application deadline |
| recommended_rank_id | BIGINT | No | Foreign key to ranks.id (difficulty level) |
| created_by | UUID | No | Admin user ID who created the job |
| created_at | timestamptz | Auto | Creation timestamp |
| updated_at | timestamptz | Auto | Last update timestamp |

**Indexes**:
- `idx_jobs_status` on status
- `idx_jobs_recommended_rank_id` on recommended_rank_id

---

### JobApplications

User applications to job postings.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| job_id | UUID | Yes | Foreign key to jobs.id |
| user_id | UUID | Yes | Foreign key to profiles.id |
| status | text | No | Application status ("pending", "accepted", "rejected", "completed", "in_progress") |
| created_at | timestamptz | Auto | Application timestamp |

**Constraints**:
- Unique constraint on (job_id, user_id) to prevent duplicate applications

---

### Parties

User groups/guilds.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | BIGINT | Yes | Primary key |
| name | text | Yes | Party name |
| description | text | No | Party description |
| leader_id | UUID | No | Foreign key to profiles.id (party creator) |
| category | text | No | Party category tag |
| min_rank_id | BIGINT | No | Foreign key to ranks.id (minimum rank to join) |
| created_at | timestamptz | Auto | Creation timestamp |

**Indexes**:
- `idx_parties_min_rank_id` on min_rank_id

---

### PartyMembers

Many-to-many membership table linking users to parties.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | BIGINT | Yes | Primary key |
| party_id | BIGINT | Yes | Foreign key to parties.id (cascade delete) |
| user_id | UUID | Yes | Foreign key to profiles.id |
| role | text | No | Member role within party (default: "member") |
| joined_at | timestamptz | Auto | Join timestamp |

---

## 9. Key dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^16.0.7 | React framework with App Router, SSR, API routes |
| `react` | 19.2.0 | UI library |
| `react-dom` | 19.2.0 | DOM rendering for React |
| `typescript` | ^5 | Type-safe JavaScript |
| `@supabase/supabase-js` | ^2.84.0 | Supabase client for frontend data fetching |
| `@supabase/ssr` | ^0.7.0 | Server-side rendering helpers for Supabase Auth |
| `tailwindcss` | ^4 | Utility-first CSS framework |
| `@tailwindcss/postcss` | ^4 | Tailwind CSS plugin for PostCSS |
| `framer-motion` | ^12.23.24 | Animation library for React components |
| `lucide-react` | ^0.554.0 | Icon library (SVG icons) |
| `@radix-ui/react-label` | ^2.1.8 | Accessible label component |
| `@radix-ui/react-slot` | ^1.2.4 | Slot composition utility for component flexibility |
| `clsx` | ^2.1.1 | Utility for combining CSS class names |
| `class-variance-authority` | ^0.7.1 | Type-safe variant pattern for styling |
| `tailwind-merge` | ^3.4.0 | Merge Tailwind CSS class names intelligently |
| `tw-animate-css` | ^1.4.0 | Additional animation utilities for Tailwind |
| `supabase` (devDep) | ^2.65.6 | Supabase CLI for migrations and database management |
| `eslint` | ^9 | Code linting |
| `eslint-config-next` | 16.0.4 | ESLint config for Next.js |
| `ts-prune` | ^0.10.3 | Utility to find unused TypeScript code |

---

## 10. Testing

*Not applicable for this project.*

No test files (unit, integration, or e2e) are present in the codebase. The project is in MVP/student project phase without formalized testing infrastructure.

---

## 11. Deployment

The application is built on a **Next.js framework**, which is designed for deployment to **Vercel** (managed platform) or any Node.js-compatible hosting.

### Build process

```bash
npm run build
```

This command:
1. Compiles TypeScript to JavaScript
2. Bundles React components with Next.js
3. Generates optimized production assets in `.next/` directory
4. Bundles API routes for serverless or Node.js execution

### Deployment platforms

**Recommended**: **Vercel** (creators of Next.js)
- Connect GitHub repository
- Automatic deployments on push to main branch
- Zero-config environment variable management
- Serverless function scaling

**Alternative**: Any Node.js/Docker-compatible platform:
- AWS (Lambda + API Gateway, ECS, AppRunner)
- Google Cloud (Cloud Run, App Engine)
- Azure (App Service, Container Instances)
- Self-hosted (Digital Ocean App Platform, Heroku, etc.)

### Environment-specific configuration

The application respects the following environment variables across all deployments:

- `NEXT_PUBLIC_SUPABASE_URL` (public, frontend-facing)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` (public, frontend-facing)
- `SUPABASE_SERVICE_ROLE_KEY` (secret, server-only)
- `ADMIN_INVITE_CODE` (secret, server-only)
- `NODE_ENV` (set automatically to "production" on production deployments)

**Staging vs. Production**:
- Point each environment's Supabase variables to the appropriate Supabase project
- Use different `ADMIN_INVITE_CODE` for staging and production
- No code changes required; configuration is purely environment-based

### Database migrations

Before first deployment, run Supabase migrations:

```bash
npx supabase db push
```

This applies all migration files in `/supabase/migrations/` to your Supabase project database (in order).

---

## 12. Known issues & limitations

### Missing database migrations

**Issue**: The CREATE TABLE statements for `jobs` and `job_applications` tables are not present in the migrations directory. While the database schema is documented in `/docs/db-schema.md` and referenced throughout the codebase (API routes, types, etc.), the actual SQL CREATE TABLE migrations are missing.

**Impact**: If setting up a fresh Supabase project, these tables will not be created automatically via `supabase db push`. They must be created manually via the Supabase console or by creating migration files.

**Workaround**: Create migration files `20251213025000_create_jobs_table.sql` and `20251213025001_create_job_applications_table.sql` with the CREATE TABLE statements based on the schema documented in `/docs/db-schema.md`.

### No test suite

**Limitation**: The project lacks unit tests, integration tests, or end-to-end tests. This is expected for a student MVP but should be addressed for production use.

### No analytics or monitoring

**Limitation**: No error tracking (e.g., Sentry), analytics (e.g., Mixpanel), or server monitoring is configured. API errors are logged locally but not centralized.

### Concurrent application acceptance race condition

**Mitigation**: The admin job-applications endpoint uses optimistic concurrency control (compare-and-swap on `slots` count) to prevent race conditions when multiple admins accept applications simultaneously. However, this is not bulletproof and could benefit from server-side transaction-level locking in high-concurrency scenarios.

### OAuth callback redirect flow

**Note**: The OAuth callback flow (`/auth/oauth-callback/`) is implemented but not fully tested across all deployment scenarios. May require additional configuration on some hosting platforms.

### No automatic profile creation

**Note**: Profiles are not automatically created when users sign up via Supabase Auth. A trigger or post-auth function would be needed to auto-create profile records in the `profiles` table on sign-up.

---

## 13. Changelog / version history

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | 2025-12-14 | Initial MVP release |

**Release date**: December 14, 2025

No changelog file or git tag history available. This is version 0.1.0 as specified in `package.json`.
