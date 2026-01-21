import { create } from 'zustand'
import type { TimeEntry, TimerState } from '@/types/time-tracking'
import {
  fetchTimeEntries,
  createTimeEntry,
  updateTimeEntry as updateTimeEntryDb,
  deleteTimeEntry as deleteTimeEntryDb,
  subscribeToTimeEntries,
  bulkCreateTimeEntries,
} from '@/lib/supabase/time-entries'
import { supabase } from '@/lib/supabase/client'

interface TimeTrackingStore {
  entries: TimeEntry[]
  editingEntryId: string | null
  timer: TimerState
  searchQuery: string
  selectedWorkArea: string
  selectedWorkType: string
  isSearchOpen: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  setEntries: (entries: TimeEntry[]) => void
  loadEntries: () => Promise<void>
  addEntry: (entry: Omit<TimeEntry, 'id'>) => Promise<void>
  bulkAddEntries: (entries: Omit<TimeEntry, 'id'>[]) => Promise<void>
  updateEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  setEditingEntryId: (id: string | null) => void
  initializeRealtimeSubscription: () => () => void
  
  // Timer actions
  startTimer: (activity: string, workArea: string, workType: string) => void
  stopTimer: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  updateTimerElapsed: () => void
  
  // Search/Filter actions
  setSearchQuery: (query: string) => void
  setSelectedWorkArea: (area: string) => void
  setSelectedWorkType: (type: string) => void
  toggleSearch: () => void
  clearFilters: () => void
}

export const useTimeTrackingStore = create<TimeTrackingStore>((set, get) => ({
  entries: [],
  editingEntryId: null,
  timer: {
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    activity: '',
    workArea: '',
    workType: '',
  },
  searchQuery: '',
  selectedWorkArea: '',
  selectedWorkType: '',
  isSearchOpen: false,
  isLoading: false,
  error: null,
  
  setEntries: (entries) => set({ entries }),
  
  loadEntries: async () => {
    try {
      set({ isLoading: true, error: null })
      const entries = await fetchTimeEntries()
      set({ entries, isLoading: false })
    } catch (error) {
      console.error('Failed to load entries:', error)
      set({ error: 'Failed to load time entries', isLoading: false })
    }
  },
  
  addEntry: async (entry) => {
    try {
      set({ error: null })
      const newEntry = await createTimeEntry(entry)
      set((state) => ({
        entries: [newEntry, ...state.entries],
      }))
    } catch (error) {
      console.error('Failed to add entry:', error)
      set({ error: 'Failed to add time entry' })
      throw error
    }
  },
  
  bulkAddEntries: async (entries) => {
    try {
      set({ error: null })
      const newEntries = await bulkCreateTimeEntries(entries)
      set((state) => ({
        entries: [...newEntries, ...state.entries],
      }))
    } catch (error) {
      console.error('Failed to bulk add entries:', error)
      set({ error: 'Failed to bulk add time entries' })
      throw error
    }
  },
  
  updateEntry: async (id, updates) => {
    try {
      set({ error: null })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b7757e0-fdc9-4123-97fc-24028150b2c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'time-tracking-store.ts:94',message:'updateEntry store function called',data:{id,updates},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-ENTER-SAVE-LOGIC'})}).catch(()=>{});
      // #endregion
      const updatedEntry = await updateTimeEntryDb(id, updates)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b7757e0-fdc9-4123-97fc-24028150b2c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'time-tracking-store.ts:98',message:'After updateTimeEntryDb success',data:{id,updatedEntry},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-ENTER-SAVE-LOGIC'})}).catch(()=>{});
      // #endregion
      set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? updatedEntry : entry
        ),
      }))
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b7757e0-fdc9-4123-97fc-24028150b2c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'time-tracking-store.ts:107',message:'updateEntry failed with error',data:{id,error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-ENTER-SAVE-LOGIC'})}).catch(()=>{});
      // #endregion
      console.error('Failed to update entry:', error)
      set({ error: 'Failed to update time entry' })
      throw error
    }
  },
  
  deleteEntry: async (id) => {
    try {
      set({ error: null })
      await deleteTimeEntryDb(id)
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete entry:', error)
      set({ error: 'Failed to delete time entry' })
      throw error
    }
  },
  
  initializeRealtimeSubscription: () => {
    let unsubscribe: (() => void) | null = null
    
    // Get current user and subscribe
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        unsubscribe = subscribeToTimeEntries(user.id, (entries) => {
          set({ entries })
        })
      }
    })
    
    // Return cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  },
  
  setEditingEntryId: (id) => set({ editingEntryId: id }),
  
  startTimer: (activity, workArea, workType) => set({
    timer: {
      isRunning: true,
      startTime: Date.now(),
      elapsedTime: 0,
      activity,
      workArea,
      workType,
    },
  }),
  
  stopTimer: () => set((state) => {
    // Optionally create a time entry from the timer
    const timer = state.timer
    return {
      timer: {
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        activity: '',
        workArea: '',
        workType: '',
      },
    }
  }),
  
  pauseTimer: () => set((state) => ({
    timer: {
      ...state.timer,
      isRunning: false,
    },
  })),
  
  resumeTimer: () => set((state) => ({
    timer: {
      ...state.timer,
      isRunning: true,
      startTime: Date.now() - state.timer.elapsedTime * 1000,
    },
  })),
  
  updateTimerElapsed: () => set((state) => {
    if (!state.timer.isRunning || !state.timer.startTime) return state
    
    return {
      timer: {
        ...state.timer,
        elapsedTime: Math.floor((Date.now() - state.timer.startTime) / 1000),
      },
    }
  }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedWorkArea: (area) => set({ selectedWorkArea: area }),
  setSelectedWorkType: (type) => set({ selectedWorkType: type }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  clearFilters: () => set({
    searchQuery: '',
    selectedWorkArea: '',
    selectedWorkType: '',
  }),
}))