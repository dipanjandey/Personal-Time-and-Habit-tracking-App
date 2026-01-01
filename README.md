# Habit & Time Tracker

A modern, full-stack habit tracking and time management application built with Next.js 16 and Supabase.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS v4
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Charts**: Recharts
- **Deployment**: Vercel

## Features

- ✅ **Habit Tracking**: Track daily habits and build consistent routines
- ⏱️ **Time Management**: Log and analyze how you spend your time
- 📊 **Analytics**: Visualize your progress with insightful charts
- 🔍 **Search & Filter**: Quickly find and filter your tracked data
- 🔐 **Authentication**: Secure user authentication with Supabase
- 🌓 **Dark Mode**: Full dark mode support
- 📱 **Responsive**: Works seamlessly on mobile and desktop browsers

## Getting Started

### Prerequisites

- Node.js 20+ installed
- A Supabase account (sign up at [supabase.com](https://supabase.com))

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Create a new project in Supabase
   - Copy your Supabase URL and anon key to `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Supabase Setup

You'll need to create the following tables in your Supabase database:

### 1. Habits Table
```sql
create table habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  frequency text not null, -- daily, weekly, custom
  color text default '#3b82f6',
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table habits enable row level security;

-- Create policies
create policy "Users can view their own habits"
  on habits for select
  using (auth.uid() = user_id);

create policy "Users can create their own habits"
  on habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on habits for delete
  using (auth.uid() = user_id);
```

### 2. Habit Entries Table
```sql
create table habit_entries (
  id uuid default uuid_generate_v4() primary key,
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  completed boolean default false,
  date date not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table habit_entries enable row level security;

-- Create policies
create policy "Users can view their own habit entries"
  on habit_entries for select
  using (auth.uid() = user_id);

create policy "Users can create their own habit entries"
  on habit_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habit entries"
  on habit_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habit entries"
  on habit_entries for delete
  using (auth.uid() = user_id);
```

### 3. Time Entries Table
```sql
create table time_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  activity text not null,
  category text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration integer, -- in minutes
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table time_entries enable row level security;

-- Create policies
create policy "Users can view their own time entries"
  on time_entries for select
  using (auth.uid() = user_id);

create policy "Users can create their own time entries"
  on time_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own time entries"
  on time_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own time entries"
  on time_entries for delete
  using (auth.uid() = user_id);
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
├── components/           # React components
│   └── ui/              # shadcn/ui components
├── lib/                 # Utility functions
│   └── supabase/        # Supabase client configs
├── providers/           # React context providers
└── hooks/               # Custom React hooks
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Next Steps

1. Set up your Supabase database tables (see Supabase Setup section)
2. Configure authentication in Supabase dashboard
3. Start building your habit tracking interface
4. Add time tracking features
5. Create analytics dashboards with Recharts

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand.docs.pmnd.rs)

## License

MIT