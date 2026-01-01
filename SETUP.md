# Setup Guide

## Quick Start

Follow these steps to get your Habit & Time Tracker up and running:

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:
```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to Project Settings > API
4. Copy your project URL and anon/public key

### 3. Configure Environment Variables

1. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Create Database Tables

In your Supabase project dashboard:

1. Go to SQL Editor
2. Create a new query
3. Copy and run the SQL from `README.md` (Supabase Setup section) to create:
   - `habits` table
   - `habit_entries` table
   - `time_entries` table
   - Row Level Security (RLS) policies

### 5. Configure Authentication (Optional)

In Supabase Dashboard > Authentication:

1. **Email Provider**: Enable Email authentication
2. **Site URL**: Set to `http://localhost:3000` for development
3. **Redirect URLs**: Add `http://localhost:3000/auth/callback`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## Project Structure Overview

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Home page
├── components/
│   └── ui/                 # shadcn/ui components (22 components installed)
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Client-side Supabase client
│   │   └── server.ts       # Server-side Supabase client
│   └── utils.ts            # Utility functions
├── providers/
│   ├── query-provider.tsx  # TanStack Query provider
│   └── theme-provider.tsx  # Theme provider for dark mode
├── types/
│   └── database.types.ts   # TypeScript types for Supabase tables
└── hooks/
    └── use-mobile.ts       # Mobile detection hook
```

## Installed Packages

### Core Dependencies
- **Next.js 16**: React framework with App Router
- **React 19**: Latest React version
- **TypeScript 5**: Type safety
- **Tailwind CSS v4**: Utility-first CSS framework

### UI & Components
- **shadcn/ui**: 22 pre-installed components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **next-themes**: Dark mode support

### State & Data
- **Zustand**: Lightweight state management
- **TanStack Query**: Server state management
- **React Hook Form**: Form handling
- **Zod**: Schema validation

### Backend
- **Supabase Client**: Database and auth client
- **Supabase SSR**: Server-side rendering support

### Charts & Analytics
- **Recharts**: Charting library
- **date-fns**: Date manipulation

### UI Enhancements
- **Sonner**: Toast notifications
- **class-variance-authority**: Component variants
- **tailwind-merge**: Tailwind class merging

## Next Steps

1. **Build Authentication Flow**: Create sign-up, sign-in, and sign-out pages
2. **Habit Management**: Build CRUD operations for habits
3. **Time Tracking**: Implement time entry logging
4. **Dashboard**: Create analytics and visualizations
5. **Mobile Optimization**: Ensure responsive design works perfectly

## Troubleshooting

### Environment Variables Not Loading
- Make sure `.env.local` is in the project root
- Restart the dev server after changing env variables

### Supabase Connection Issues
- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is not paused
- Ensure RLS policies are set up correctly

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`

## Resources

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)