# Product Requirements Document (PRD)
## Habit & Time Tracker Application

**Version:** 1.0  
**Last Updated:** February 8, 2026  
**Document Purpose:** Complete technical specification for recreating the Habit & Time Tracker application

---

## 1. Executive Summary

### 1.1 Product Overview
A personal productivity application designed for tracking time spent on various work activities and building consistent habits. The application combines Pomodoro technique-based time tracking with detailed analytics and configurable work categories.

### 1.2 Target Users
- Individual users seeking to track their work time and productivity
- Personal use case (single-user authentication)
- Desktop and mobile web browser users

### 1.3 Core Value Proposition
- **Simple Time Logging**: Quick entry of time blocks with work area and type categorization
- **Pomodoro Timer**: Built-in Pomodoro technique timer with automatic session tracking
- **Analytics**: Visual insights into time allocation and productivity trends
- **Flexible Configuration**: User-defined work areas and work types

---

## 2. Technical Architecture

### 2.1 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend Framework** | Next.js (App Router) | 16.x |
| **UI Library** | React | 19.x |
| **Language** | TypeScript | 5.x |
| **Component Library** | shadcn/ui | Latest |
| **CSS Framework** | Tailwind CSS | v4 |
| **State Management** | Zustand | 5.x |
| **Data Fetching** | TanStack Query | 5.x |
| **Backend/Database** | Supabase (PostgreSQL) | Latest |
| **Authentication** | Supabase Auth | Latest |
| **Charts** | Recharts | 2.x |
| **Icons** | Lucide React | Latest |
| **Forms** | React Hook Form + Zod | Latest |
| **Date Utilities** | date-fns | 4.x |
| **Notifications** | Sonner | 2.x |
| **Build Tool** | Turbopack | Built-in |
| **Drag & Drop** | @dnd-kit | 6.x |
| **Excel Parsing** | xlsx | 0.18.x |

### 2.2 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Protected dashboard routes (route group)
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── track-time/           # Time tracking page
│   │   ├── history/              # Full history with search/filter
│   │   ├── configure/            # Work areas & types configuration
│   │   └── analytics/            # Analytics dashboard
│   ├── auth/callback/            # OAuth callback handler
│   ├── login/                    # Login page
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home/landing page
│   └── globals.css               # Global styles and Tailwind theme
├── components/
│   ├── analytics/                # Analytics-specific components
│   ├── config/                   # Configuration components
│   ├── time-tracking/            # Time tracking components
│   └── ui/                       # shadcn/ui components
├── hooks/                        # Custom React hooks
├── lib/
│   ├── supabase/                 # Supabase client configurations
│   ├── analytics-utils.ts        # Analytics computation utilities
│   ├── excel-utils.ts            # Excel parsing for bulk upload
│   ├── time-utils.ts             # Time formatting utilities
│   └── utils.ts                  # General utilities (cn, etc.)
├── providers/                    # React context providers
│   ├── auth-provider.tsx         # Authentication context
│   ├── query-provider.tsx        # TanStack Query provider
│   └── theme-provider.tsx        # Dark/light mode provider
├── store/                        # Zustand stores
│   ├── config-store.ts           # Work areas/types state
│   ├── pomodoro-store.ts         # Pomodoro timer state
│   └── time-tracking-store.ts    # Time entries state
└── types/                        # TypeScript type definitions
    ├── database.types.ts         # Supabase table types
    └── time-tracking.ts          # Application domain types
```

---

## 3. Database Schema

### 3.1 Tables

#### 3.1.1 `work_areas`
User-defined categories for organizing work (e.g., "Project A", "Learning", "Admin").

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| user_id | UUID | FK → auth.users(id), NOT NULL | Owner reference |
| name | TEXT | NOT NULL | Display name |
| order_index | INTEGER | DEFAULT 0 | Sort order for UI |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

#### 3.1.2 `work_types`
User-defined activity types (e.g., "Deep Work", "Meetings", "Planning").

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| user_id | UUID | FK → auth.users(id), NOT NULL | Owner reference |
| name | TEXT | NOT NULL | Display name |
| order_index | INTEGER | DEFAULT 0 | Sort order for UI |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

#### 3.1.3 `time_entries`
Core time tracking records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| user_id | UUID | FK → auth.users(id), NOT NULL | Owner reference |
| start_time | TEXT | NOT NULL | Start time (YYYY-MM-DD HH:mm format) |
| end_time | TEXT | NULLABLE | End time (null = ongoing task) |
| work_area | TEXT | NOT NULL | Work area name |
| work_type | TEXT | NOT NULL | Work type name |
| pomodoros | INTEGER | DEFAULT 0 | Number of pomodoros completed |
| comments | TEXT | DEFAULT '' | User notes |
| date | TEXT | NOT NULL | Date (YYYY-MM-DD format) |
| duration | INTEGER | DEFAULT 0 | Duration in minutes |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

#### 3.1.4 `pomodoro_sessions`
Individual Pomodoro sessions linked to time entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| time_entry_id | UUID | FK → time_entries(id), NULLABLE | Parent entry (null = standalone) |
| user_id | UUID | FK → auth.users(id), NOT NULL | Owner reference |
| start_time | TEXT | NOT NULL | Session start time |
| end_time | TEXT | NOT NULL | Session end time |
| duration | INTEGER | NOT NULL | Duration in minutes |
| comments | TEXT | NULLABLE | Session notes |
| is_full_pomodoro | BOOLEAN | DEFAULT true | Was it a full 25-min session? |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

#### 3.1.5 `habits` (Future/Partial Implementation)
Habit tracking records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | FK → auth.users(id), NOT NULL | Owner reference |
| name | TEXT | NOT NULL | Habit name |
| description | TEXT | NULLABLE | Description |
| frequency | TEXT | NOT NULL | 'daily', 'weekly', 'custom' |
| color | TEXT | DEFAULT '#3b82f6' | Display color |
| icon | TEXT | NULLABLE | Icon identifier |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

#### 3.1.6 `habit_entries` (Future/Partial Implementation)
Daily habit completion records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| habit_id | UUID | FK → habits(id), NOT NULL | Parent habit |
| user_id | UUID | FK → auth.users(id), NOT NULL | Owner reference |
| completed | BOOLEAN | DEFAULT false | Completion status |
| date | DATE | NOT NULL | Entry date |
| notes | TEXT | NULLABLE | Daily notes |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

### 3.2 Row Level Security (RLS)
All tables must have RLS enabled with policies ensuring users can only access their own data:

```sql
-- Example policy pattern for each table
CREATE POLICY "Users can view own data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON table_name
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON table_name
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 4. Feature Specifications

### 4.1 Authentication

#### 4.1.1 Login Page (`/login`)
- **Email/Password Authentication**
  - Sign in with email and password
  - Sign up with email and password
  - Toggle between sign-in and sign-up modes
  - Password minimum length: 6 characters
  - Email confirmation required for new accounts

- **OAuth Authentication**
  - Google OAuth sign-in
  - Redirect to `/auth/callback` after successful OAuth

- **UI Elements**
  - App logo with clock icon
  - Google sign-in button (primary CTA)
  - Divider with "or" text
  - Email input field
  - Password input field
  - Submit button (Sign In / Sign Up)
  - Toggle link to switch modes
  - Error message display
  - Success message display (for sign-up confirmation)

- **Post-Login Redirect**
  - Redirect to `/track-time` on successful authentication

#### 4.1.2 Auth Callback (`/auth/callback`)
- Handle OAuth provider redirects
- Exchange auth code for session
- Redirect to dashboard on success

#### 4.1.3 Protected Routes
- All `/dashboard/*` routes require authentication
- Middleware should redirect unauthenticated users to `/login`
- Auth state managed via `AuthProvider` context

### 4.2 Dashboard Layout

#### 4.2.1 Sidebar Navigation
- **Header**
  - App name: "Habit & Time Tracker"
  - Theme toggle (dark/light mode)

- **Navigation Items**
  | Icon | Label | Route |
  |------|-------|-------|
  | Clock | Track Time | `/track-time` |
  | History | History | `/history` |
  | Settings | Configure | `/configure` |
  | BarChart | Analytics | `/analytics` |

- **Footer**
  - User email display (truncated)
  - Sign Out button with confirmation dialog

#### 4.2.2 Sign Out Confirmation
- AlertDialog component
- Title: "Sign out?"
- Description explaining need to sign in again
- Cancel and Sign Out buttons

#### 4.2.3 Global Pomodoro Status Banner
- Shows when Pomodoro timer is running on any page
- Displays remaining time
- Quick access to timer controls
- Positioned at bottom of viewport

### 4.3 Track Time Page (`/track-time`)

#### 4.3.1 Page Header
- Title: "Track Time"
- Action buttons:
  - "Bulk Upload" - Opens bulk upload dialog
  - "Export" - Exports data (placeholder)

#### 4.3.2 Tab Navigation
Two main tabs:
1. **Add Entry** - Manual time entry + ongoing tasks
2. **Pomodoro** - Pomodoro timer interface

#### 4.3.3 Quick Entry Bar (Add Entry Tab)
A prominent form for quickly adding time entries:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Start Time | DateTime Input | Yes | Format: mm/dd/yyyy hh:mm am/pm |
| End Time | DateTime Input | No | Leave empty for ongoing task |
| Work Area | Searchable Dropdown | Yes | User-defined areas |
| Work Type | Searchable Dropdown | Yes | User-defined types |
| Pomodoros | Number Input | No | Manual pomodoro count |
| Comments | Auto-expanding Textarea | No | Task notes |

- **Features**
  - "Now" button to set current time
  - Real-time validation with error messages
  - Green "Add Entry" submit button
  - Primary color background with gradient overlay
  - Responsive grid layout (2→4→9 columns)

- **Ongoing Tasks**
  - When end time is empty, task is marked as "ongoing"
  - Tip text: "Leave empty to start an ongoing task"

#### 4.3.4 Ongoing Tasks Section
- Only visible when ongoing tasks exist
- Header: "Ongoing Tasks (n)" with pulsing green indicator
- Grid layout (1→2 columns on larger screens)
- Each task displayed as `OngoingTaskCard`:
  - Work area and type labels
  - Start time display
  - Running duration (auto-updates)
  - "Complete" button to finish task
  - Delete button

#### 4.3.5 Summary Cards
Four stat cards showing today's metrics:
1. **Total Time** - Total duration today
2. **Pomodoros** - Total pomodoro count
3. **Sessions** - Number of entries
4. **Most Worked** - Top work area by duration

#### 4.3.6 Recent Entries Table (Compact)
- Shows last 10 entries
- Compact mode without filters
- Basic columns: Time, Area, Type, Duration, Actions
- Link to History page for full view

#### 4.3.7 Pomodoro Timer (Pomodoro Tab)

**Timer Configuration (Default)**
| Mode | Duration |
|------|----------|
| Pomodoro | 25 minutes |
| Short Break | 5 minutes |
| Long Break | 15 minutes |
| Long Break Interval | Every 4 pomodoros |

**Timer UI Components**
- Progress bar at top of card
- Mode tabs (Pomodoro / Short Break / Long Break)
  - Disabled during active timer
- Large digital time display (MM:SS format)
- Control buttons:
  - Reset (rotate icon)
  - Start/Pause/Resume (primary, large)
  - Stop (square icon) - saves partial session

**Timer Form Fields**
| Field | Required | Notes |
|-------|----------|-------|
| Area | Yes* | Disabled when linked to ongoing task |
| Type | Yes* | Disabled when linked to ongoing task |
| Comments | No | Disabled while running |

*Required unless linked to an ongoing task

**Ongoing Task Association**
- When ongoing tasks exist, user can optionally link Pomodoro to one
- Selected task shows with link icon
- Pomodoros increment on the linked task

**Timer Behavior**
- Persists across page navigation (Zustand + localStorage)
- Rehydrates on page load with elapsed time calculation
- Audio notification on completion
- Auto-transitions between modes:
  - Pomodoro → Short Break (or Long Break every 4th)
  - Break → Pomodoro

**Session Saving**
- Full pomodoro: Creates time entry with pomodoros=1
- Partial session (stopped early): Creates entry with pomodoros=0, actual duration
- Linked sessions: Creates `pomodoro_session` record, increments parent entry's pomodoro count
- Sessions < 1 minute are not saved

**Recent Sessions Display**
- Shows today's entries below timer
- Badge shows pomodoro count
- "Ongoing" badge for incomplete tasks

#### 4.3.8 Bulk Upload Dialog
- Modal dialog for Excel file upload

**Step 1: Upload**
- Download template button (generates .xlsx)
- Drag-and-drop zone for file upload
- Accepts .xlsx and .xls files
- Processing indicator with progress bar

**Step 2: Preview**
- Summary badges (valid/invalid counts)
- Warning for invalid entries
- Data table showing all parsed entries:
  - Row number, Status, Date, Start, End, Area, Type, Pomodoros, Comments
- Valid entries highlighted in green
- Invalid entries highlighted in red with error badges
- Error details section for invalid rows

**Step 3: Confirming**
- Loading spinner
- "Adding X entries..." message

**Step 4: Complete**
- Success checkmark
- "Successfully added X entries!" message
- Auto-closes after 1.5 seconds

**Template Format**
Excel columns: Date, Start Time, End Time, Work Area, Work Type, Pomodoros, Comments

### 4.4 History Page (`/history`)

#### 4.4.1 Page Header
- Title: "History"
- No action buttons

#### 4.4.2 Full Time Entries Table
Complete data table with full features:

**Columns**
| Column | Sortable | Description |
|--------|----------|-------------|
| Start Time | Yes | Formatted display, editable inline |
| End Time | Yes | Formatted display, editable inline |
| Work Area | Yes | Combobox dropdown |
| Work Type | Yes | Combobox dropdown |
| Pomodoros | Yes | Inline number input |
| Duration | Yes | Auto-calculated or manual edit |
| Comments | No | Expandable text with tooltip |
| Actions | No | Delete button, Pomodoro details |

**Features**
- **Search**: Global text search across all fields
- **Filters**: Work Area and Work Type dropdowns
- **Sorting**: Click column headers to sort
- **Pagination**: 
  - Page size selector (10, 20, 50, 100)
  - First/Previous/Next/Last navigation
  - Page number display
- **Inline Editing**: 
  - Click any cell to edit
  - Auto-save on blur or Enter
  - Escape to cancel
  - DateTime validation with error display
- **Delete Confirmation**: Delete removes entry with toast notification

**Empty State**
- "No time entries yet" message when no data
- Prompt to start tracking

### 4.5 Configure Page (`/configure`)

#### 4.5.1 Page Header
- Title: "Configure"
- Subtitle: "Manage your work areas and work types here."

#### 4.5.2 Editable Lists (Two Column Layout)

**Work Areas List**
- Title: "Work Areas"
- Description: "Define the different areas of work you track time for"

**Work Types List**
- Title: "Work Types"
- Description: "Define the types of work activities you perform"

**List Features (Both)**
- **Add New**: Input field + Add button at top
- **Item Display**: Name with drag handle and action buttons
- **Drag & Drop Reorder**: Using @dnd-kit
- **Edit Mode**: 
  - Click edit icon to toggle
  - Inline input field
  - Save (check) and Cancel (X) buttons
- **Delete**: Trash icon with immediate deletion
- **Default Seeding**: If no items exist, seed with defaults:
  - Work Areas: "Personal", "Work", "Learning", "Health"
  - Work Types: "Deep Work", "Meetings", "Admin", "Planning"

**Loading State**
- Skeleton placeholders while loading

### 4.6 Analytics Page (`/analytics`)

#### 4.6.1 Page Header
- Title: "Analytics"
- "Export Report" button (placeholder)

#### 4.6.2 Time Period Selector
Tab-based period selection:
- Today
- This Week
- This Month
- Custom (shows date pickers)

**Custom Date Range**
- "From date" button → Calendar popover
- "To date" button → Calendar popover
- Date format: "MMM d, yyyy"

#### 4.6.3 Summary Statistics Cards (2 columns)

| Card | Icon | Value Format | Trend |
|------|------|--------------|-------|
| Total Time Tracked | Clock | Xh Ym | % vs previous period |
| Total Pomodoros | Target | Number | % vs previous period |

**Trend Display**
- Green up arrow for positive change
- Red down arrow for negative change
- Label: "vs yesterday/last week/last month"

#### 4.6.4 Quick Insights Section
Three insight cards (1→2→3 column grid):

| Insight | Icon | Example Value |
|---------|------|---------------|
| Most Productive Day | Calendar | "Wednesday - 4h 30m" |
| Top Work Area | Target | "Learning - 45.2%" |
| Daily Average | Clock | "2h 15m" |

Only shown when data exists for the period.

#### 4.6.5 Charts Section (2 columns)

**Time by Work Area (Donut Chart)**
- Pie/donut chart visualization
- Legend with color swatches
- Percentage display per area
- Expandable: "Show all (X more)" for 5+ areas
- Empty state message when no data

**Time by Work Type (Bar Chart)**
- Vertical bar chart
- Y-axis: Hours (auto-scaled)
- X-axis: Work type names
- Value labels on top of bars
- Color-coded bars
- Tooltip with duration
- Empty state message when no data

#### 4.6.6 Daily Productivity Chart (Full Width)
- Vertical bar chart
- X-axis: Dates (formatted as "MMM d, EEE")
- Y-axis: Hours
- Value labels on bars
- Tooltip with full date and duration
- Empty state message when no data

**Chart Colors**
- Consistent color palette across charts
- Adapts to light/dark mode via CSS variables

### 4.7 Theme & Styling

#### 4.7.1 Color Modes
- Light mode (default)
- Dark mode
- System preference detection
- Persistent preference storage

#### 4.7.2 Theme Toggle
- Located in sidebar header
- Icon changes based on current mode
- Smooth transition

#### 4.7.3 Custom CSS Variables
Key design tokens:
- Primary color scheme
- Success/Danger/Warning colors
- Muted backgrounds
- Border colors
- Timer-specific colors

---

## 5. State Management

### 5.1 Zustand Stores

#### 5.1.1 `pomodoro-store.ts`
**Persisted to localStorage**

| State | Type | Description |
|-------|------|-------------|
| mode | 'pomodoro' \| 'shortBreak' \| 'longBreak' | Current timer mode |
| timeLeft | number | Seconds remaining |
| isRunning | boolean | Timer active state |
| startedAt | number \| null | Timestamp when started |
| pausedTimeLeft | number \| null | Time left when paused |
| selectedArea | string | Selected work area |
| selectedType | string | Selected work type |
| comments | string | Session notes |
| linkedTaskId | string \| null | Associated ongoing task |
| completedPomodoros | number | Total completed today |
| config | PomodoroConfig | Timer durations |
| isTimerVisible | boolean | Is timer component mounted |

**Actions**
- start, pause, resume, reset, stop
- tick (called every second)
- setMode, setSelectedArea, setSelectedType, setComments
- setLinkedTaskId, setTimerVisible
- incrementCompletedPomodoros
- getInitialTime, getElapsedMinutes

**Rehydration Logic**
- On page load, calculate elapsed time since startedAt
- Update timeLeft accordingly
- Handle timer completion if time expired

#### 5.1.2 `time-tracking-store.ts`
**Not persisted (fetched from Supabase)**

| State | Type | Description |
|-------|------|-------------|
| entries | TimeEntry[] | All time entries |
| editingEntryId | string \| null | Currently editing entry |
| timer | TimerState | Legacy timer state |
| searchQuery | string | Search filter |
| selectedWorkArea | string | Filter by area |
| selectedWorkType | string | Filter by type |
| isSearchOpen | boolean | Search panel visibility |
| isLoading | boolean | Loading state |
| error | string \| null | Error message |
| pomodoroSessionsMap | Map<string, PomodoroSession[]> | Cached sessions |

**Actions**
- CRUD: loadEntries, addEntry, updateEntry, deleteEntry
- bulkAddEntries
- initializeRealtimeSubscription
- Ongoing tasks: getOngoingTasks, completeTask
- Pomodoro: addPomodoroSession, loadPomodoroSessionsForEntry
- Timer: startTimer, stopTimer, pauseTimer, resumeTimer
- Filters: setSearchQuery, setSelectedWorkArea, setSelectedWorkType

#### 5.1.3 `config-store.ts`
**Not persisted (fetched from Supabase)**

| State | Type | Description |
|-------|------|-------------|
| workAreas | WorkArea[] | User's work areas |
| workTypes | WorkType[] | User's work types |
| isLoading | boolean | Loading state |
| error | string \| null | Error message |

**Actions**
- loadWorkAreas, addWorkArea, editWorkArea, removeWorkArea
- reorderWorkAreasList
- loadWorkTypes, addWorkType, editWorkType, removeWorkType
- reorderWorkTypesList
- Auto-seed defaults on first load

### 5.2 Context Providers

#### 5.2.1 `AuthProvider`
- Manages Supabase auth session
- Provides: user, session, loading, signOut
- Listens to auth state changes

#### 5.2.2 `QueryProvider`
- TanStack Query client configuration
- DevTools integration

#### 5.2.3 `ThemeProvider`
- next-themes integration
- System, light, dark mode support

---

## 6. API Layer (Supabase)

### 6.1 Client Configuration

#### 6.1.1 Browser Client (`lib/supabase/client.ts`)
- Creates client-side Supabase client
- Uses environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 6.1.2 Server Client (`lib/supabase/server.ts`)
- Creates server-side Supabase client
- Uses Next.js cookies for session

### 6.2 Data Operations

#### 6.2.1 Time Entries (`lib/supabase/time-entries.ts`)
| Function | Description |
|----------|-------------|
| fetchTimeEntries() | Get all entries for current user |
| createTimeEntry(entry) | Create new entry |
| updateTimeEntry(id, updates) | Update existing entry |
| deleteTimeEntry(id) | Delete entry |
| bulkCreateTimeEntries(entries) | Bulk insert |
| subscribeToTimeEntries(userId, callback) | Real-time subscription |

#### 6.2.2 Pomodoro Sessions (`lib/supabase/pomodoro-sessions.ts`)
| Function | Description |
|----------|-------------|
| createPomodoroSession(session) | Create new session |
| fetchPomodoroSessionsForEntry(entryId) | Get sessions for entry |
| fetchPomodoroSessionsForEntries(entryIds) | Batch fetch sessions |

#### 6.2.3 Configuration (`lib/supabase/config.ts`)
| Function | Description |
|----------|-------------|
| fetchWorkAreas() | Get user's work areas |
| createWorkArea(name) | Add new area |
| updateWorkArea(id, name) | Rename area |
| deleteWorkArea(id) | Remove area |
| reorderWorkAreas(items) | Update order_index values |
| seedDefaultWorkAreas() | Create default areas |
| fetchWorkTypes() | Get user's work types |
| createWorkType(name) | Add new type |
| updateWorkType(id, name) | Rename type |
| deleteWorkType(id) | Remove type |
| reorderWorkTypes(items) | Update order_index values |
| seedDefaultWorkTypes() | Create default types |

### 6.3 Real-time Subscriptions
- Subscribe to time_entries table changes
- Filter by user_id
- Handle INSERT, UPDATE, DELETE events
- Update local store on changes

---

## 7. Utility Functions

### 7.1 Time Utilities (`lib/time-utils.ts`)
| Function | Description |
|----------|-------------|
| calculateDuration(start, end) | Calculate minutes between times |
| formatDuration(minutes) | Format as "Xh Ym" |
| getCurrentTime() | Get current time as HH:mm |
| getTodayDate() | Get today as YYYY-MM-DD |

### 7.2 Analytics Utilities (`lib/analytics-utils.ts`)
| Function | Description |
|----------|-------------|
| getDateRange(period, custom?) | Get date range for period |
| filterEntriesByDateRange(entries, range) | Filter entries |
| calculateStats(entries) | Compute summary stats |
| calculateWorkAreaBreakdown(entries) | Group by work area |
| calculateWorkTypeBreakdown(entries) | Group by work type |
| calculateDailyTrends(entries, range) | Compute daily data |
| calculateInsights(trends, areas) | Generate insight cards |
| computeAnalyticsData(entries, period, range?) | Full computation |
| formatDuration(minutes) | Format duration |
| formatPercentage(value) | Format as "X.X%" |
| formatChartDate(date) | Format for chart axis |
| formatDisplayDate(date) | Format for UI display |

### 7.3 Excel Utilities (`lib/excel-utils.ts`)
| Function | Description |
|----------|-------------|
| downloadTemplate() | Generate and download template |
| parseExcelFile(file, areas, types) | Parse uploaded file |

---

## 8. UI Components

### 8.1 shadcn/ui Components Used
Pre-installed components from shadcn/ui:
- Accordion, Alert, AlertDialog
- Avatar, Badge, Breadcrumb
- Button, Calendar, Card
- Chart (Recharts wrapper), Checkbox
- Collapsible, Command, Dialog
- Dropdown Menu, Form, Input
- Label, Menubar, Navigation Menu
- Pagination, Popover, Progress
- Radio Group, Scroll Area, Select
- Separator, Sheet, Sidebar
- Skeleton, Slider, Sonner (Toasts)
- Switch, Table, Tabs
- Textarea, Toggle, Tooltip

### 8.2 Custom Components

#### 8.2.1 Time Tracking Components
| Component | Description |
|-----------|-------------|
| QuickEntryBar | Main entry form with datetime inputs |
| TimeEntriesTable | Full data table with inline editing |
| PomodoroTimer | Timer card with mode tabs and controls |
| OngoingTaskCard | Card for ongoing task display |
| SummaryCards | Statistics card grid |
| BulkUploadDialog | Multi-step upload dialog |
| PomodoroDetailsDialog | View pomodoro sessions for entry |
| MiniStatCard | Small stat card component |

#### 8.2.2 Analytics Components
| Component | Description |
|-----------|-------------|
| StatCard | Large stat with trend indicator |
| InsightCard | Insight display with icon |

#### 8.2.3 Configuration Components
| Component | Description |
|-----------|-------------|
| EditableList | Drag-and-drop reorderable list |

#### 8.2.4 Global Components
| Component | Description |
|-----------|-------------|
| PomodoroStatusBanner | Floating timer status |
| ThemeToggle | Dark/light mode switch |
| Combobox | Searchable select dropdown |
| InputGroup | Input with addon buttons |

---

## 9. Responsive Design

### 9.1 Breakpoints (Tailwind)
| Breakpoint | Width | Usage |
|------------|-------|-------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |

### 9.2 Mobile Considerations
- Collapsible sidebar (off-canvas on mobile)
- Touch-friendly tap targets (minimum 44px)
- Responsive grid layouts
- Horizontal scroll for tables on mobile
- Simplified navigation for small screens
- Reduced padding and margins on mobile

---

## 10. Non-Functional Requirements

### 10.1 Performance
- Turbopack for fast development builds
- Code splitting via Next.js App Router
- Optimistic UI updates for better perceived performance
- Efficient re-renders via Zustand selectors

### 10.2 Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management in modals
- Color contrast compliance
- Screen reader compatible

### 10.3 Security
- Row Level Security on all tables
- Server-side session validation
- CSRF protection via Supabase
- Environment variable protection for keys

### 10.4 Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ JavaScript features
- CSS Grid and Flexbox

---

## 11. Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon/public key | Yes |

---

## 12. Deployment

### 12.1 Recommended Platform
- **Vercel** for frontend hosting
- **Supabase** for backend services

### 12.2 Build Commands
```bash
npm run dev      # Development with Turbopack
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### 12.3 Environment Setup
1. Create Supabase project
2. Run database migrations (SQL from README)
3. Configure authentication providers
4. Set environment variables in deployment platform
5. Deploy via Git integration

---

## 13. Future Considerations

### 13.1 Planned Features (Not Yet Implemented)
- Full habit tracking functionality
- Mobile native apps (React Native)
- Team/collaboration features
- Integrations (Calendar, Slack, etc.)
- Custom Pomodoro durations in UI
- Data export to CSV/PDF
- Recurring tasks
- Goals and targets
- Notifications and reminders

### 13.2 Technical Debt
- Remove debug logging in time-tracking-store.ts
- Implement proper habit tracking UI
- Add comprehensive error boundaries
- Implement offline support
- Add unit and integration tests

---

## Appendix A: Default Data

### A.1 Default Work Areas
1. Personal
2. Work
3. Learning
4. Health

### A.2 Default Work Types
1. Deep Work
2. Meetings
3. Admin
4. Planning

### A.3 Default Pomodoro Configuration
- Pomodoro: 25 minutes
- Short Break: 5 minutes
- Long Break: 15 minutes
- Long Break Interval: 4 pomodoros
