import { create } from 'zustand'
import type { TimeEntry, TimerState, PomodoroSession } from '@/types/time-tracking'
import {
  fetchTimeEntries,
  createTimeEntry,
  updateTimeEntry as updateTimeEntryDb,
  deleteTimeEntry as deleteTimeEntryDb,
  subscribeToTimeEntries,
  bulkCreateTimeEntries,
} from '@/lib/supabase/time-entries'
import {
  createPomodoroSession as createPomodoroSessionDb,
  fetchPomodoroSessionsForEntry,
  fetchPomodoroSessionsForEntries,
} from '@/lib/supabase/pomodoro-sessions'
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
  
  // Pomodoro sessions cache
  pomodoroSessionsMap: Map<string, PomodoroSession[]>
  
  // Actions
  setEntries: (entries: TimeEntry[]) => void
  loadEntries: () => Promise<void>
  addEntry: (entry: Omit<TimeEntry, 'id'>) => Promise<TimeEntry>
  bulkAddEntries: (entries: Omit<TimeEntry, 'id'>[]) => Promise<void>
  updateEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  setEditingEntryId: (id: string | null) => void
  initializeRealtimeSubscription: () => () => void
  
  // Ongoing tasks actions
  getOngoingTasks: () => TimeEntry[]
  completeTask: (id: string, endTime?: string) => Promise<void>
  
  // Pomodoro session actions
  addPomodoroSession: (session: Omit<PomodoroSession, 'id' | 'createdAt' | 'userId'>) => Promise<void>
  loadPomodoroSessionsForEntry: (entryId: string) => Promise<PomodoroSession[]>
  incrementEntryPomodoros: (entryId: string) => Promise<void>
  
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
  pomodoroSessionsMap: new Map(),
  
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
      return newEntry
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
      const updatedEntry = await updateTimeEntryDb(id, updates)
      set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? updatedEntry : entry
        ),
      }))
    } catch (error) {
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
  
  // Ongoing tasks - entries without end_time
  getOngoingTasks: () => {
    return get().entries.filter(e => !e.endTime)
  },
  
  completeTask: async (id, endTime) => {
    const entry = get().entries.find(e => e.id === id)
    if (!entry) return
    
    // Calculate end time and duration
    const now = new Date()
    // Use local date/time, not UTC
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const localDateTimeStr = `${year}-${month}-${day} ${hours}:${minutes}`
    const finalEndTime = endTime || localDateTimeStr
    
    // Parse start time to calculate duration
    let startDateTime: Date
    if (entry.startTime.includes(' ')) {
      const [date, time] = entry.startTime.split(' ')
      startDateTime = new Date(`${date}T${time}:00`)
    } else {
      startDateTime = new Date(`${entry.date}T${entry.startTime}:00`)
    }
    
    // Parse end time
    let endDateTime: Date
    if (finalEndTime.includes(' ')) {
      const [date, time] = finalEndTime.split(' ')
      endDateTime = new Date(`${date}T${time}:00`)
    } else {
      endDateTime = new Date(`${entry.date}T${finalEndTime}:00`)
    }
    
    const duration = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60))
    
    await get().updateEntry(id, {
      endTime: finalEndTime,
      duration: Math.max(0, duration),
    })
  },
  
  // Pomodoro session actions
  addPomodoroSession: async (session) => {
    try {
      set({ error: null })
      const newSession = await createPomodoroSessionDb(session)
      
      // Update cache if linked to an entry
      if (session.timeEntryId) {
        set((state) => {
          const newMap = new Map(state.pomodoroSessionsMap)
          const existing = newMap.get(session.timeEntryId!) || []
          newMap.set(session.timeEntryId!, [...existing, newSession])
          return { pomodoroSessionsMap: newMap }
        })
      }
    } catch (error) {
      console.error('Failed to add pomodoro session:', error)
      set({ error: 'Failed to add pomodoro session' })
      throw error
    }
  },
  
  loadPomodoroSessionsForEntry: async (entryId) => {
    try {
      const sessions = await fetchPomodoroSessionsForEntry(entryId)
      set((state) => {
        const newMap = new Map(state.pomodoroSessionsMap)
        newMap.set(entryId, sessions)
        return { pomodoroSessionsMap: newMap }
      })
      return sessions
    } catch (error) {
      console.error('Failed to load pomodoro sessions:', error)
      throw error
    }
  },
  
  incrementEntryPomodoros: async (entryId) => {
    const entry = get().entries.find(e => e.id === entryId)
    if (!entry) return
    
    await get().updateEntry(entryId, {
      pomodoros: entry.pomodoros + 1,
    })
  },
  
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