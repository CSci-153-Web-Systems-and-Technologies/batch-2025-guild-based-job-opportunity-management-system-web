You are helping develop a web application called:

“Guild-Based Job Opportunity Management System”

Stack:
- Next.js 14 App Router
- Supabase (auth + Postgres)
- Tailwind CSS
- TypeScript
- Client + Server Components
- Middleware for route protection

Goal:
Implement a secure role-based access system with the following rules:

1. When a user signs up using Supabase Auth, they must always be assigned:
   role = "student"
   (Do NOT allow a user to choose their role on the sign-up form.)

2. Admins (instructors) must be able to access admin routes only if:
   - they have a Supabase user_metadata.role = "admin"
   - OR they have successfully entered an Admin Invite Code.

3. The Admin Invite Code page must:
   - Be located at: /admin/invite
   - Contain a simple form where the instructor enters a code
   - Verify the code against a server-side environment variable ADMIN_INVITE_CODE
   - If correct → update auth user_metadata.role = "admin"
   - If wrong → show an error message
   - Must only work for logged-in users

4. Middleware must protect ALL routes under /admin/*
   - If no session → redirect to /login
   - If session exists but role !== "admin" → redirect to /unauthorized
   - Supabase JWT must include the user role via user_metadata

5. Implement the following files:
   /middleware.ts
   /app/admin/invite/page.tsx
   /app/admin/(dashboard)/page.tsx  (example protected page)
   /app/(auth)/sign-up/page.tsx
   /lib/supabase-server.ts
   /lib/supabase-client.ts

6. Add a "role" column to profiles table
   Fields:
   - user_id uuid (references auth.users)
   - role text (default: "student")
   Provide the SQL migration for this.

7. The sign-up page should:
   - Use Supabase auth.signUp()
   - Force metadata.role = "student"
   - Not ask for any role input
   - Redirect to the dashboard after sign-up

8. The admin-invite page should:
   - Load the current user (server-side)
   - Display a form for entering the code
   - Call a server action to validate it
   - If valid, update user metadata to role = "admin"
   - Redirect to /admin after success

9. Middleware must:
   - Use createMiddlewareClient from @supabase/auth-helpers-nextjs
   - Read session.user.user_metadata.role
   - Protect admin routes

10. Style forms and pages using Tailwind with clean, minimal UI.

Now generate FULL implementations for:
- Role-aware sign-up page
- Admin invite page
- Middleware role protection
- Supabase role update logic
- SQL migration for “profiles” table
- Example protected admin page
- Environment variable usage (ADMIN_INVITE_CODE)

Make the response clean, modular, and production-ready.
