# Habit & Time Tracker — Architecture Diagram

## High-Level System Overview

```mermaid
graph TD
    subgraph Browser["🌐 Browser (Client)"]
        subgraph NextJS["Next.js 16 App Router"]
            Login["/login<br/>Email + Google OAuth"]
            subgraph Dashboard["/(dashboard) — Sidebar Layout"]
                TrackTime["/track-time<br/>Pomodoro Timer + Time Entry"]
                History["/history<br/>Entries Search & Table"]
                Configure["/configure<br/>Work Areas & Types"]
                Analytics["/analytics<br/>Charts & Insights"]
                Banner["PomodoroStatusBanner<br/>(Global floating timer)"]
            end
        end
    end

    subgraph Supabase["☁️ Supabase (Backend-as-a-Service)"]
        Auth["Supabase Auth<br/>(Email, Google OAuth)"]
        DB["PostgreSQL DB<br/>work_areas, work_types,<br/>time_entries, pomodoro_sessions,<br/>habits, habit_entries"]
        Realtime["Realtime Subscriptions<br/>(time_entries channel)"]
        RLS["Row Level Security<br/>user_id = auth.uid()"]
    end

    Login -->|"signIn / signUp"| Auth
    TrackTime -->|"CRUD"| DB
    TrackTime -->|"subscribe"| Realtime
    History -->|"query"| DB
    Configure -->|"CRUD + reorder"| DB
    Analytics -->|"aggregate query"| DB
    Auth -->|"JWT session"| Dashboard
    RLS -.->|"enforces"| DB
```

---

## Application Layer Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                            │
│                                                                      │
│   Pages (src/app/)              Components (src/components/)         │
│   ┌──────────────────┐          ┌───────────────────────────┐       │
│   │ (dashboard)/     │          │ time-tracking/            │       │
│   │   track-time     │◄────────►│   pomodoro-timer          │       │
│   │   history        │          │                           │       │
│   │   configure      │          │ analytics/                │       │
│   │   analytics      │          │   (charts, stats)         │       │
│   │                  │          │                           │       │
│   │ login/           │          │ config/                   │       │
│   │ auth/callback    │          │   (work areas/types mgmt) │       │
│   └──────────────────┘          │                           │       │
│                                 │ ui/ (shadcn components)   │       │
│                                 │   button, card, dialog,   │       │
│                                 │   table, chart, calendar, │       │
│                                 │   select, input, form...  │       │
│                                 └───────────────────────────┘       │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         STATE LAYER                                  │
│                                                                      │
│   Zustand Stores (src/store/)       React Context (src/providers/)  │
│   ┌─────────────────────────┐       ┌────────────────────────────┐  │
│   │ time-tracking-store     │       │ AuthProvider               │  │
│   │  • entries[]            │       │  • user, session, loading  │  │
│   │  • CRUD operations      │       │  • signOut()               │  │
│   │  • realtime sync        │       ├────────────────────────────┤  │
│   │  • pomodoro sessions    │       │ QueryProvider              │  │
│   ├─────────────────────────┤       │  • TanStack Query client   │  │
│   │ config-store            │       │  • staleTime: 60s          │  │
│   │  • workAreas[]          │       ├────────────────────────────┤  │
│   │  • workTypes[]          │       │ ThemeProvider (next-themes) │  │
│   │  • CRUD + reorder       │       │  • system/light/dark       │  │
│   ├─────────────────────────┤       └────────────────────────────┘  │
│   │ pomodoro-store          │                                       │
│   │  • timer state          │       Hooks (src/hooks/)              │
│   │  • mode, timeLeft       │       ┌────────────────────────────┐  │
│   │  • persisted to         │       │ useAnalyticsData           │  │
│   │    localStorage         │       │ useChartColors             │  │
│   │  • survives page        │       │ useMobile                  │  │
│   │    reload               │       └────────────────────────────┘  │
│   └─────────────────────────┘                                       │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       DATA ACCESS LAYER                              │
│                                                                      │
│   Supabase Client Modules (src/lib/supabase/)                       │
│   ┌──────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│   │ client.ts        │  │ server.ts       │  │ config.ts       │   │
│   │ Browser client   │  │ Server client   │  │ WorkArea CRUD   │   │
│   │ (createBrowser   │  │ (createServer   │  │ WorkType CRUD   │   │
│   │  Client)         │  │  Client)        │  │ Seed defaults   │   │
│   ├──────────────────┤  └─────────────────┘  └─────────────────┘   │
│   │ time-entries.ts  │  ┌─────────────────────────────────────────┐ │
│   │ CRUD + realtime  │  │ pomodoro-sessions.ts                   │ │
│   │ subscribe        │  │ Create / Fetch / Bulk fetch sessions   │ │
│   │ bulk create      │  └─────────────────────────────────────────┘ │
│   └──────────────────┘                                              │
│                                                                      │
│   Utilities (src/lib/)                                              │
│   ┌──────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│   │ analytics-utils  │  │ time-utils      │  │ export-utils    │   │
│   │ Stats, trends,   │  │ Duration calc,  │  │ Excel export    │   │
│   │ insights         │  │ formatting      │  │ (xlsx)          │   │
│   └──────────────────┘  └─────────────────┘  └─────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```mermaid
flowchart TD
    User([👤 User]) --> LoginPage["/login Page"]

    LoginPage --> EmailAuth{"Email + Password"}
    LoginPage --> GoogleAuth{"Google OAuth"}

    EmailAuth -->|signInWithPassword| SupaAuth["Supabase Auth<br/>(JWT + Session)"]
    EmailAuth -->|signUp| SupaAuth
    GoogleAuth -->|signInWithOAuth| SupaAuth

    SupaAuth -->|"OAuth redirect"| Callback["/auth/callback<br/>exchangeCodeForSession()"]
    SupaAuth -->|"Email direct"| Middleware

    Callback --> Middleware["Middleware (proxy.ts)"]

    Middleware -->|"No user + protected path"| RedirectLogin["↩ Redirect → /login"]
    Middleware -->|"User + /login"| RedirectDash["↩ Redirect → /track-time"]
    Middleware -->|"User + protected path"| AuthProvider

    AuthProvider["AuthProvider (React Context)<br/>• getSession()<br/>• onAuthStateChange()<br/>• Provides: user, session, signOut"]
    AuthProvider --> App["✅ Authenticated App"]

    style SupaAuth fill:#3ecf8e,color:#000
    style Middleware fill:#f59e0b,color:#000
    style App fill:#22c55e,color:#000
```

---

## Data Flow: Time Tracking & Pomodoro

```mermaid
flowchart LR
    subgraph UI["/track-time Page"]
        Timer["🍅 Pomodoro Timer<br/>Start / Pause / Stop / Reset"]
        Form["📝 Time Entry Form<br/>Work Area, Type, Comments"]
    end

    subgraph Stores["Zustand Stores"]
        PStore["pomodoro-store<br/>(persisted to localStorage)<br/>• mode, timeLeft, isRunning<br/>• tick() every 1s"]
        TStore["time-tracking-store<br/>• entries[]<br/>• CRUD operations<br/>• pomodoroSessionsMap"]
    end

    subgraph Supabase["Supabase PostgreSQL"]
        TE[("time_entries")]
        PS[("pomodoro_sessions")]
        RT{{"Realtime<br/>Subscription"}}
    end

    Timer -->|"state updates"| PStore
    PStore -->|"on complete/stop"| TStore
    Form -->|"save entry"| TStore
    TStore -->|"INSERT / UPDATE / DELETE"| TE
    TStore -->|"create session"| PS
    TE -->|"subscribe()"| RT
    RT -->|"realtime sync"| TStore
    PStore -.->|"persist"| LS[("localStorage")]

    style PStore fill:#8b5cf6,color:#fff
    style TStore fill:#3b82f6,color:#fff
    style RT fill:#3ecf8e,color:#000
```

---

## Provider Hierarchy (Root Layout)

```mermaid
graph TD
    HTML["&lt;html&gt;"] --> Body["&lt;body&gt;"]
    Body --> Theme["ThemeProvider<br/>(next-themes)<br/>Dark / Light / System"]
    Theme --> Auth["AuthProvider<br/>User session context"]
    Auth --> Query["QueryProvider<br/>(TanStack Query)<br/>staleTime: 60s"]
    Query --> Children["{children}<br/>Page content"]
    Query --> Toaster["&lt;Toaster /&gt;<br/>(Sonner notifications)"]

    style Theme fill:#6366f1,color:#fff
    style Auth fill:#f59e0b,color:#000
    style Query fill:#06b6d4,color:#000
```

---

## Database Schema (Supabase PostgreSQL)

```mermaid
erDiagram
    work_areas {
        uuid id PK
        uuid user_id FK
        string name
        int order_index
        timestamp created_at
        timestamp updated_at
    }

    work_types {
        uuid id PK
        uuid user_id FK
        string name
        int order_index
        timestamp created_at
        timestamp updated_at
    }

    time_entries {
        uuid id PK
        uuid user_id FK
        string start_time
        string end_time "nullable"
        string work_area
        string work_type
        int pomodoros
        string comments
        date date
        int duration
        timestamp created_at
        timestamp updated_at
    }

    pomodoro_sessions {
        uuid id PK
        uuid time_entry_id FK "nullable"
        uuid user_id FK
        string start_time
        string end_time
        int duration
        string comments "nullable"
        boolean is_full_pomodoro
        timestamp created_at
    }

    habits {
        uuid id PK
        uuid user_id FK
        string name
        string description "nullable"
        enum frequency "daily | weekly | custom"
        string color
        string icon "nullable"
        timestamp created_at
        timestamp updated_at
    }

    habit_entries {
        uuid id PK
        uuid habit_id FK
        uuid user_id FK
        boolean completed
        date date
        string notes "nullable"
        timestamp created_at
    }

    time_entries ||--o{ pomodoro_sessions : "has many"
    habits ||--o{ habit_entries : "has many"
```

---

## Page Routing Map

```mermaid
flowchart LR
    Root["/ (root)"] -->|"redirect"| TT["/track-time"]

    subgraph Public
        LoginP["/login"]
        AuthCB["/auth/callback"]
    end

    subgraph Protected["/(dashboard) group"]
        TT
        Hist["/history"]
        Conf["/configure"]
        Anal["/analytics"]
    end

    LoginP -->|"on success"| TT
    AuthCB -->|"exchange code"| TT

    Middleware{{"proxy.ts<br/>middleware"}} -.->|"guards"| Protected

    style Protected fill:#dbeafe,color:#000
    style Public fill:#fef3c7,color:#000
    style Middleware fill:#f59e0b,color:#000
```

---

## Key Technology Stack

| Layer            | Technology                          | Purpose                                  |
|------------------|--------------------------------------|------------------------------------------|
| Framework        | Next.js 16 (App Router, Turbopack)  | SSR, routing, API routes                 |
| UI Library       | React 19                            | Component rendering                      |
| Component Lib    | shadcn/ui + Radix Primitives        | Pre-built accessible components          |
| Styling          | Tailwind CSS v4                     | Utility-first CSS                        |
| State (Client)   | Zustand (w/ persist middleware)     | Client-side stores                       |
| State (Server)   | TanStack Query                      | Server state & caching                   |
| Forms            | React Hook Form + Zod              | Form handling & validation               |
| Backend          | Supabase (Auth, DB, Realtime)       | BaaS — PostgreSQL, Auth, Subscriptions   |
| Charts           | Recharts (via shadcn Chart)         | Analytics visualizations                 |
| Tables           | TanStack Table                      | Data tables with sorting/filtering       |
| Drag & Drop      | @dnd-kit                            | Reordering work areas/types              |
| Icons            | Lucide React                        | Icon set                                 |
| Theming          | next-themes                         | Dark/light mode                          |
| Notifications    | Sonner                              | Toast notifications                      |
| Date Utils       | date-fns                            | Date formatting & manipulation           |
| Export           | xlsx                                | Excel export of time entries             |

---

## File Organization Summary

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (providers)
│   ├── page.tsx                  # Redirect → /track-time
│   ├── login/page.tsx            # Auth page
│   ├── auth/callback/route.ts    # OAuth callback handler
│   └── (dashboard)/              # Protected route group
│       ├── layout.tsx            # Sidebar + navigation
│       ├── track-time/page.tsx   # Timer + entry form
│       ├── history/page.tsx      # Past entries table
│       ├── configure/page.tsx    # Work areas/types config
│       └── analytics/page.tsx    # Charts & insights
├── components/
│   ├── ui/                       # shadcn components
│   ├── time-tracking/            # Timer, entry components
│   ├── analytics/                # Chart components
│   ├── config/                   # Config management
│   └── pomodoro-status-banner    # Global floating timer
├── store/                        # Zustand stores
│   ├── time-tracking-store.ts    # Time entries state
│   ├── pomodoro-store.ts         # Timer state (persisted)
│   └── config-store.ts           # Work areas/types state
├── providers/                    # React context providers
│   ├── auth-provider.tsx         # Supabase auth context
│   ├── query-provider.tsx        # TanStack Query
│   └── theme-provider.tsx        # Dark/light mode
├── lib/
│   ├── supabase/                 # Supabase client & data access
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   ├── time-entries.ts       # Time entry CRUD
│   │   ├── pomodoro-sessions.ts  # Pomodoro session CRUD
│   │   └── config.ts             # Work area/type CRUD
│   ├── analytics-utils.ts        # Stats computation
│   ├── time-utils.ts             # Duration formatting
│   └── export-utils.ts           # Excel export
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types
│   ├── database.types.ts         # Supabase DB schema
│   └── time-tracking.ts          # App-level types
└── proxy.ts                      # Auth middleware
```
