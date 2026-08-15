# SchoolFlow — School Management Platform

Multi-tenant school management SaaS built for Nigerian K-12 schools. This is the working codebase, ready to be extended feature by feature.

## What's already built (Phase 1: Foundation)

- ✅ **Landing page** with Sovereign Indigo design system
- ✅ **Signup flow** — creates school, user, assigns Principal role
- ✅ **Login flow** with Supabase Auth
- ✅ **Dashboard shell** with sidebar navigation, onboarding checklist, metrics grid
- ✅ **Database schema for Chunk 1** — all 10 platform tables (schools, users, roles, permissions, etc.)
- ✅ **Row Level Security** — multi-tenancy enforced at database level
- ✅ **Default roles seeded** — 11 roles auto-created for every new school
- ✅ **All 50+ permissions defined** in the permissions table

## What's next (in order)

1. Chunk 2 (academic structure): sessions, terms, classes, sections, subjects
2. Chunk 3 (people): students, staff, parents, ID card generation
3. Chunk 4 (fees & expenses): the big one — invoicing, receipts, discounts
4. Chunk 5 (attendance): including offline-first mobile app
5. Chunk 6 (results & CBT): gradebook, report cards, CBT engine
6. Chunk 7 (communication): WhatsApp integration, announcements

Each chunk gets:
- SQL migration file
- RLS policies
- UI screens (list, detail, forms)
- Business logic
- Reports

---

## Getting this running on your computer

### Prerequisites (install these once)

- **Node.js 20 or newer** — download from https://nodejs.org
- **Git** — download from https://git-scm.com
- **VS Code** (recommended editor) — https://code.visualstudio.com
- **A GitHub account** — https://github.com/signup
- **A Supabase account** — https://supabase.com (free)

### Step 1: Get the code onto your computer

```bash
# Create a folder for the project
mkdir school-mgmt && cd school-mgmt

# Extract the zip file here (from Claude's output)
# Then initialize git
git init
git add .
git commit -m "Initial commit — Chunk 1 foundation"
```

PGepKgtT6clPU8eZ

### Step 2: Install dependencies

```bash
npm install
```

This installs Next.js, Supabase, Tailwind, and everything else. Takes 1-2 minutes.

### Step 3: Set up Supabase

1. Go to https://app.supabase.com and click "New Project"
2. Give it a name like `schoolflow-dev`
3. Choose a strong database password (save this)
4. Pick a region close to you (Frankfurt is fine for Nigeria)
5. Wait ~2 minutes for provisioning

Once ready:

6. Go to **Project Settings** → **API**
7. Copy these three values:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Step 4: Configure environment variables

```bash
# Copy the example env file
cp .env.example .env.local

# Open .env.local in your editor and paste the three Supabase values
```

### Step 5: Run the database migrations

Two options:

**Option A: Via Supabase Dashboard (easiest for first time)**

1. Go to your Supabase project → **SQL Editor**
2. Open `supabase/migrations/001_chunk1_platform.sql` in your editor
3. Copy the entire contents and paste into the SQL Editor
4. Click "Run"
5. Repeat with `002_rls_and_seeds.sql`
6. Repeat with `003_school_onboarding.sql`

**Option B: Via Supabase CLI (better for ongoing work)**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project (get project ref from dashboard URL)
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

### Step 6: Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You should see the landing page.

### Step 7: Test the flow

1. Click "Start free trial"
2. Fill in the signup form
3. You'll be redirected to the dashboard
4. See your school name in the sidebar, the trial banner, the onboarding checklist, the metrics grid

If any of this doesn't work, check the browser console (F12) and the terminal for error messages.

---

## Project structure

```
school-mgmt/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── signup/               # Signup flow
│   │   ├── login/                # Login flow
│   │   ├── dashboard/            # All authenticated pages
│   │   │   ├── layout.tsx        # Sidebar shell
│   │   │   └── page.tsx          # Dashboard home
│   │   ├── auth/signout/         # Signout API
│   │   ├── globals.css           # Global styles + design tokens
│   │   └── layout.tsx            # Root layout
│   ├── components/               # Reusable UI components (as we build them)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser Supabase client
│   │   │   ├── server.ts         # Server Supabase client
│   │   │   └── middleware.ts     # Session refresh
│   │   └── utils.ts              # Helper functions
│   ├── types/                    # TypeScript types (auto-generated from DB)
│   └── middleware.ts             # Next.js middleware entry
├── supabase/
│   └── migrations/
│       ├── 001_chunk1_platform.sql    # Platform tables
│       ├── 002_rls_and_seeds.sql      # RLS + permission seeds
│       └── 003_school_onboarding.sql  # Auto-seed roles for new schools
├── docs/                         # Design docs
├── package.json
├── tailwind.config.ts            # Sovereign Indigo palette
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## The design language: Sovereign Indigo

Already implemented in `tailwind.config.ts` and `globals.css`:

- **Primary**: `#3B4CCA` (Deep Indigo)
- **Success**: `#10B981` · **Warning**: `#F59E0B` · **Error**: `#EF4444` · **Info**: `#0EA5E9`
- **Font**: Inter (loaded from Google Fonts)
- **Rounded corners**: 6px buttons, 8px cards
- **Animations**: 200ms transitions, subtle scale on press

Use the utility classes: `btn-primary`, `btn-secondary`, `card`, `input`, `label`.

---

## Continuing development

For each new feature, we work in this order:

1. **Schema** — add SQL migration for new tables
2. **RLS** — add row-level security policies
3. **API** — add server functions/actions
4. **UI** — add pages and components
5. **Test** — verify manually in browser

Come back to this codebase when you're ready to build Chunk 2 (academic structure — sessions, terms, classes) and I'll add all of those files following the same patterns.

---

## Getting help

- **Supabase docs**: https://supabase.com/docs
- **Next.js docs**: https://nextjs.org/docs
- **Tailwind docs**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com

For issues specific to this codebase, note the error and bring it back to continue the build with Claude.
