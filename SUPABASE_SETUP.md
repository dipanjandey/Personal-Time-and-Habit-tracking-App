# Supabase Setup Guide

This guide will help you set up Supabase to persist your time tracking entries across sessions.

## Prerequisites

- A Supabase account (free tier works fine)
- Your Supabase project URL and anon key

## Step 1: Configure Environment Variables

Create a `.env.local` file in your project root and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in your Supabase dashboard under **Project Settings > API**.

## Step 2: Run the Database Migration

There are two ways to run the migration:

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link your project:
```bash
supabase link --project-ref your-project-ref
```

3. Run the migration:
```bash
supabase db push
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20260101_update_time_entries.sql`
4. Copy and paste the entire SQL content into the SQL Editor
5. Click **Run** to execute the migration

## Step 3: Verify the Setup

After running the migration, verify that:

1. The `time_entries` table exists with the correct schema
2. Row Level Security (RLS) is enabled
3. The policies are created (visible in **Authentication > Policies**)

## Step 4: Test Authentication

The app requires user authentication. You have a few options:

### Option A: Enable Email Auth (Quick Test)

1. Go to **Authentication > Providers** in Supabase
2. Enable **Email** provider
3. Create a test user in **Authentication > Users** or use the signup flow

### Option B: Use Anonymous Auth (Easiest for Testing)

Add this to enable anonymous sign-in:

```typescript
// In src/app/(dashboard)/track-time/page.tsx
useEffect(() => {
  const initAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Sign in anonymously for testing
      await supabase.auth.signInAnonymously()
    }
    
    // Load initial data
    loadEntries()
    
    // Set up real-time subscription
    const unsubscribe = initializeRealtimeSubscription()
    
    return () => {
      unsubscribe()
    }
  }
  
  initAuth()
}, [loadEntries, initializeRealtimeSubscription])
```

### Option C: Implement Full Auth Flow

For production, implement a proper auth flow with login/signup pages.

## Step 5: Test the App

1. Start your development server:
```bash
npm run dev
```

2. Navigate to http://localhost:3000/track-time

3. Add a time entry - it should now persist in Supabase

4. Refresh the page - your entries should load from the database

5. Open the app in another browser/tab - changes should sync in real-time!

## Troubleshooting

### "User not authenticated" Error

- Make sure you're signed in (see Step 4)
- Check browser console for auth errors

### Entries Not Saving

- Verify your environment variables are set correctly
- Check the Supabase logs in the dashboard
- Ensure RLS policies are correctly applied

### Real-time Not Working

- Verify your Supabase plan includes real-time features (free tier does)
- Check browser console for subscription errors
- Ensure you're authenticated

## Database Schema

The `time_entries` table structure:

```sql
id          UUID PRIMARY KEY
user_id     UUID NOT NULL (references auth.users)
start_time  TEXT NOT NULL
end_time    TEXT NOT NULL  
work_area   TEXT NOT NULL
work_type   TEXT NOT NULL
pomodoros   INTEGER DEFAULT 0
comments    TEXT DEFAULT ''
date        TEXT NOT NULL
duration    INTEGER NOT NULL
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

## Security

The app uses Row Level Security (RLS) to ensure:
- Users can only see their own entries
- Users can only create/update/delete their own entries
- All database operations are secure

## Next Steps

- Implement proper authentication with login/signup pages
- Add data export functionality
- Set up database backups
- Configure production environment variables