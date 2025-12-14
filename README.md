# 🛡️ Guild-Based Job Opportunity Management System

A web application that **gamifies job discovery and application workflows** for students through a **quest board** metaphor. Users earn experience points (XP), progress through ranks, form parties, and apply to jobs (quests) while administrators manage opportunities and track applicant progress.

---

## 📚 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Project Status](#project-status)

---

## 🔍 Overview

This system reimagines traditional job boards as a **guild quest system** where students can:

- 🗺️ Browse and filter job opportunities (quests) by category, difficulty (recommended rank), and date posted  
- 📄 Apply to jobs and track application status  
- ⭐ Earn XP and advance through ranks based on completed quests  
- 🤝 Form or join parties with other students  
- 📊 View personalized dashboards with application summaries and progress metrics  

Administrators can:

- 🛠️ Create, update, and delete job postings  
- 👀 Review and manage job applications  
- 🔑 Grant admin access via secure invite codes  
- 📈 Monitor system activity  

The application is designed as a **student project / MVP**, demonstrating full-stack development using modern frameworks, authentication flows, role-based access control, and secure database interactions.

---

## ✨ Features

### 🔐 Authentication & Authorization
- **Email/Password Authentication** via Supabase Auth  
- **Google OAuth** single sign-on integration  
- **Role-Based Access Control**
  - Default role: `student`
  - Admin role: granted through invite code validation  
- **Middleware Protection** using Next.js to enforce route access  

---

### 🧭 Quest Board (Job Listings)
- Browse available jobs displayed as quests  
- Filter by:
  - 🏷️ **Category**
  - ⚔️ **Difficulty** (recommended rank)
  - 🕒 **Date Posted**
- View job details including pay, location, slots, deadline, and reward XP  

---

### 📝 Job Application Workflow
- Submit applications to quests  
- Track application status: `applied`, `accepted`, `rejected`, `completed`  
- 🚫 Prevent duplicate applications via database constraints  
- 📋 Dashboard view of personal applications  

---

### 🏆 XP & Rank Progression
- Earn XP after completing accepted jobs  
- Automatic rank updates based on XP thresholds  
- Dashboard shows:
  - Current rank
  - Total XP
  - Progress to next rank  
- Rank influences recommended quests and party eligibility  

---

### 🧑‍🤝‍🧑 Party System
- Create or join parties  
- Party structure includes:
  - 👑 **Leader** (party creator)
  - 👥 **Members**
- Party listings display member count, category, and minimum rank  

---

### 🛠️ Admin Panel
- Job CRUD operations  
- Application management  
- 🔑 Invite code flow for admin promotion  
- Admin-only routes protected by role-checking middleware  

---

### 📊 Dashboard Summary
- Personalized dashboard showing:
  - ⭐ Total XP and current rank  
  - 📄 Job application statuses  
  - 🤝 Party memberships  
  - 📈 Quick statistics  

---

### 📱 Responsive UI
- Desktop-first design with mobile support  
- Built with Tailwind CSS and Radix UI  
- ✨ Animations using Framer Motion  
- ♿ Accessible navigation and forms  

---

## 🧰 Tech Stack

### 🎨 Frontend
- **Framework**: Next.js 16 (App Router)  
- **Language**: TypeScript  
- **UI Library**: React 19  
- **Styling**: Tailwind CSS 4  
- **Components**: Radix UI  
- **Animations**: Framer Motion  
- **Icons**: Lucide React  

---

### 🗄️ Backend
- **Database**: PostgreSQL (Supabase)  
- **Authentication**: Supabase Auth (Email + OAuth)  
- **Client SDK**: `@supabase/supabase-js`, `@supabase/ssr`  
- **API Layer**: Next.js App Router APIs  

---

### 🔐 Security
- Row Level Security (RLS)  
- Server-only service role key  
- Middleware-based route protection  
- Secure environment variable management  

---

### 🚀 Deployment
- **Hosting**: Vercel  
- **Database**: Supabase Cloud  
- **CI/CD**: Automatic Git-based deployments  

---

## 🗃️ Database Schema

Key tables include:

- 👤 **profiles** — user metadata and roles  
- 🎭 **roles** — `student`, `admin`  
- 🏅 **ranks** — XP-based progression tiers  
- 📌 **jobs** — quests with rewards and requirements  
- 📄 **job_applications** — application lifecycle tracking  
- 🧑‍🤝‍🧑 **parties** — group entities  
- 🔗 **party_members** — party-user relationships  
- 📊 **user_stats** — XP and rank tracking  

📘 Detailed schema: [`docs/db-schema.md`](./docs/db-schema.md)

---

## 🔑 Authentication & Authorization

### 📝 Sign-Up Flow
1. User registers via Email/Password or Google OAuth  
2. Supabase creates auth and profile records  
3. User assigned default `student` role  

---

### 🔓 Admin Promotion
1. User visits admin invite page  
2. Submits secret `ADMIN_INVITE_CODE`  
3. Role updated to `admin`  
4. Middleware unlocks admin routes  

---

### 🛡️ Middleware Protection
- 🌐 Public: `/login`, `/sign-up`, `/auth/*`  
- 🔒 Authenticated: `/dashboard`, `/questboard`, `/party-management`, `/leaderboard`  
- 👑 Admin-only: `/admin/*`  

---

## 🌱 Environment Variables

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_INVITE_CODE
