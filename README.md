## Scheduling Shift Backoffice

IPWAN Global Telcomm uses this internal backoffice to orchestrate employee shift schedules, approvals, and coverage analytics. It is built with Next.js 14 (App Router), Prisma, and PostgreSQL, and is structured to stay modular, testable, and easy to extend.

---

### 🧱 Stack
- Next.js 14 App Router (TypeScript, Server Components, React Query on the client)
- Tailwind CSS with a lightweight component system (CVA, lucide icons)
- Prisma ORM targeting PostgreSQL
- TanStack Query, Zod, React Hook Form for data fetching/validation

Recommended partner services (integrate when ready):
1. **Auth** – Clerk or Auth0 (SCIM/enterprise support).
2. **Background jobs** – Trigger.dev or Inngest for reliable scheduling.
3. **Calendar tooling** – FullCalendar or react-big-calendar for advanced drag-and-drop planning.
4. **Notifications** – Resend/Sendgrid (email), Twilio/MessageBird (SMS).
5. **Database hosting** – Neon or Supabase for managed Postgres with branching.

---

### ⚙️ Prerequisites
- Node.js 18.18+ (or 20+)
- npm (bundled) or your package manager of choice
- Docker (optional but recommended for local Postgres)
- Update `.env` with `AUTH_JWT_SECRET` for JWT signing.

---

### 🚀 Local Setup
1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Provision Postgres** (Docker Compose)
   ```bash
   docker compose up -d
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # edit DATABASE_URL / auth secrets as needed
   ```

4. **Generate Prisma client**
   ```bash
   npm run prisma:generate
   ```

5. **Create database schema**
   ```bash
   npm run prisma:push
   # or npm run prisma:migrate -- --name init-schema
   ```

6. **Seed demo data**
   ```bash
   npm run db:seed
   ```

7. **Start the dev server**
   ```bash
   npm run dev
   ```

The backoffice dashboard lives at [http://localhost:3000](http://localhost:3000). Without a reachable database the UI will fall back to empty, read-only states.

---

### 📁 Key Structure
```
src/
  app/                # App Router routes and API handlers
  components/
    dashboard/        # Reusable dashboard widgets
    layout/           # App shell and layout primitives
    ui/               # Low-level UI components (button, card, badge…)
  lib/                # Shared utilities (cn helper, etc.)
  server/
    db.ts             # Prisma client singleton
    queries/          # Server-side data access patterns
  config/
    navigation.ts     # Central navigation definition
prisma/
  schema.prisma       # Data model
  seed.ts             # Demo data seeding script
```

---

### 📦 NPM Scripts
- `npm run dev` – start Next.js in development mode.
- `npm run build` – production build (requires `DATABASE_URL` to be defined).
- `npm run start` – serve the production build.
- `npm run lint` – run ESLint (Next.js defaults).
- `npm run prisma:generate` – regenerate the Prisma client.
- `npm run prisma:migrate` – create/apply migrations interactively.
- `npm run prisma:push` – push schema changes without migrations (non-prod).
- `npm run prisma:studio` – open Prisma Studio.
- `npm run db:seed` – seed the database with demo data.
- `npx prisma migrate dev --name <description>` – create/apply database migrations after schema changes (e.g., auth fields).

---

### 🧭 Next Steps
- Integrate an authentication provider (Clerk/Auth0) and gate routes via middleware.
- Add shift planner views (calendar / timeline) and CRUD workflows using server actions + React Query.
- Expand auditing & reporting (downloadable CSV exports, cost calculations).
- Automate notifications for publish, assignment, and expiring requests using Trigger.dev/Inngest workers.
- Formalize testing: component tests (React Testing Library), schema tests, and e2e coverage with Playwright.

---

### 🤝 Contributing
1. Create a feature branch.
2. Run `npm run lint` (and optionally `npm run build`) before opening a PR.
3. Describe behavior changes and add tests where reasonable.

---

### 📄 License
MIT – feel free to adapt and extend for your organization.
