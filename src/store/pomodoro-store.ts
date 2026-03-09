'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak'

export interface PomodoroConfig {
  pomodoro: number // in minutes
  shortBreak: number
  longBreak: number
  longBreakInterval: number // number of pomodoros before long break
}

export const DEFAULT_CONFIG: PomodoroConfig = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
}

interface PomodoroStore {
  // Timer state
  mode: TimerMode
  timeLeft: number
  isRunning: boolean
  startedAt: number | null // wall-clock timestamp when timer was started/resumed
  timeLeftAtStart: number | null // snapshot of timeLeft at the moment startedAt was set
  pausedTimeLeft: number | null // time left when paused (for accurate restoration)
  
  // Form state
  selectedArea: string
  selectedType: string
  comments: string
  linkedTaskId: string | null
  
  // Session state
  completedPomodoros: number
  config: PomodoroConfig
  
  // UI state - tracks if timer component is visible
  isTimerVisible: boolean
  
  // Actions
  start: (area?: string, type?: string, linkedTaskId?: string | null) => void
  pause: () => void
  resume: () => void
  reset: () => void
  stop: () => { wasRunning: boolean; elapsedMinutes: number }
  tick: () => boolean // returns true if timer completed
  
  setMode: (mode: TimerMode) => void
  setSelectedArea: (area: string) => void
  setSelectedType: (type: string) => void
  setComments: (comments: string) => void
  setLinkedTaskId: (id: string | null) => void
  setTimerVisible: (visible: boolean) => void
  
  updateConfig: (config: Partial<PomodoroConfig>) => void
  incrementCompletedPomodoros: () => void
  getInitialTime: (mode: TimerMode) => number
  getElapsedMinutes: () => number
  syncTimeLeft: () => void
}

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'pomodoro',
      timeLeft: DEFAULT_CONFIG.pomodoro * 60,
      isRunning: false,
      startedAt: null,
      timeLeftAtStart: null,
      pausedTimeLeft: null,
      
      selectedArea: '',
      selectedType: '',
      comments: '',
      linkedTaskId: null,
      
      completedPomodoros: 0,
      config: DEFAULT_CONFIG,
      isTimerVisible: false,
      
      // Actions
      start: (area, type, linkedTaskId) => {
        const { timeLeft } = get()
        set((state) => ({
          isRunning: true,
          startedAt: Date.now(),
          timeLeftAtStart: state.timeLeft,
          pausedTimeLeft: null,
          ...(area !== undefined && { selectedArea: area }),
          ...(type !== undefined && { selectedType: type }),
          ...(linkedTaskId !== undefined && { linkedTaskId }),
        }))
      },
      
      pause: () => {
        // Sync first so timeLeft is accurate before pausing
        get().syncTimeLeft()
        set((state) => ({
          isRunning: false,
          pausedTimeLeft: state.timeLeft,
          startedAt: null,
          timeLeftAtStart: null,
        }))
      },
      
      resume: () => {
        const { timeLeft } = get()
        set({
          isRunning: true,
          startedAt: Date.now(),
          timeLeftAtStart: timeLeft,
          pausedTimeLeft: null,
        })
      },
      
      reset: () => {
        const { mode, config } = get()
        const initialTime = Math.round(mode === 'pomodoro' 
          ? config.pomodoro * 60 
          : mode === 'shortBreak' 
            ? config.shortBreak * 60 
            : config.longBreak * 60)
        
        set({
          isRunning: false,
          startedAt: null,
          timeLeftAtStart: null,
          pausedTimeLeft: null,
          timeLeft: initialTime,
        })
      },
      
      stop: () => {
        // Sync first so timeLeft is accurate
        get().syncTimeLeft()
        const { isRunning, startedAt, timeLeft, mode, config, pausedTimeLeft, timeLeftAtStart } = get()
        
        let elapsedMinutes = 0
        
        if (isRunning && startedAt && timeLeftAtStart !== null) {
          // Timer was running - calculate total elapsed from wall clock
          const elapsedSeconds = (Date.now() - startedAt) / 1000
          const totalUsedSeconds = timeLeftAtStart - Math.max(0, timeLeftAtStart - elapsedSeconds)
          
          const initialTime = mode === 'pomodoro' 
            ? config.pomodoro * 60 
            : mode === 'shortBreak' 
              ? config.shortBreak * 60 
              : config.longBreak * 60

          const timeUsedBefore = pausedTimeLeft !== null 
            ? initialTime - pausedTimeLeft 
            : initialTime - timeLeftAtStart
          elapsedMinutes = (timeUsedBefore + totalUsedSeconds) / 60
        } else {
          // Timer was paused
          const initialTime = mode === 'pomodoro' 
            ? config.pomodoro * 60 
            : mode === 'shortBreak' 
              ? config.shortBreak * 60 
              : config.longBreak * 60
          const usedSeconds = initialTime - timeLeft
          elapsedMinutes = usedSeconds / 60
        }
        
        // Move to next mode
        const nextMode: TimerMode = mode === 'pomodoro' ? 'shortBreak' : 'pomodoro'
        const nextTimeLeft = Math.round(nextMode === 'pomodoro' 
          ? config.pomodoro * 60 
          : config.shortBreak * 60)
        
        set({
          isRunning: false,
          startedAt: null,
          timeLeftAtStart: null,
          pausedTimeLeft: null,
          mode: nextMode,
          timeLeft: nextTimeLeft,
        })
        
        return { wasRunning: isRunning, elapsedMinutes }
      },
      
      // Sync timeLeft from wall clock. Call this on mount / before reading timeLeft.
      syncTimeLeft: () => {
        const { isRunning, startedAt, timeLeftAtStart } = get()
        if (!isRunning || !startedAt || timeLeftAtStart === null) return
        
        const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
        const newTimeLeft = Math.max(0, timeLeftAtStart - elapsedSeconds)
        
        const { timeLeft } = get()
        if (newTimeLeft !== timeLeft) {
          if (newTimeLeft <= 0) {
            set({ timeLeft: 0, isRunning: false, startedAt: null, timeLeftAtStart: null, pausedTimeLeft: null })
          } else {
            set({ timeLeft: newTimeLeft })
          }
        }
      },
      
      tick: () => {
        // Instead of blindly decrementing by 1, sync from wall clock
        const { isRunning, startedAt, timeLeftAtStart } = get()
        
        if (!isRunning) return false
        
        if (startedAt && timeLeftAtStart !== null) {
          // Wall-clock-based tick
          const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
          const newTimeLeft = Math.max(0, timeLeftAtStart - elapsedSeconds)
          
          if (newTimeLeft <= 0) {
            set({ timeLeft: 0, isRunning: false, startedAt: null, timeLeftAtStart: null, pausedTimeLeft: null })
            return true
          }
          
          set({ timeLeft: newTimeLeft })
          return false
        }
        
        // Fallback: simple decrement (should not normally be reached)
        const { timeLeft } = get()
        if (timeLeft <= 0) {
          set({ isRunning: false, startedAt: null, timeLeftAtStart: null, pausedTimeLeft: null })
          return true
        }
        
        const newTimeLeft = timeLeft - 1
        if (newTimeLeft <= 0) {
          set({ timeLeft: 0, isRunning: false, startedAt: null, timeLeftAtStart: null, pausedTimeLeft: null })
          return true
        }
        
        set({ timeLeft: newTimeLeft })
        return false
      },
      
      setMode: (mode) => {
        const { config, isRunning } = get()
        if (isRunning) return // Don't change mode while running
        
        const initialTime = Math.round(mode === 'pomodoro' 
          ? config.pomodoro * 60 
          : mode === 'shortBreak' 
            ? config.shortBreak * 60 
            : config.longBreak * 60)
        
        set({
          mode,
          timeLeft: initialTime,
          startedAt: null,
          timeLeftAtStart: null,
          pausedTimeLeft: null,
        })
      },
      
      setSelectedArea: (selectedArea) => set({ selectedArea }),
      setSelectedType: (selectedType) => set({ selectedType }),
      setComments: (comments) => set({ comments }),
      setLinkedTaskId: (linkedTaskId) => set({ linkedTaskId }),
      setTimerVisible: (isTimerVisible) => set({ isTimerVisible }),
      
      updateConfig: (newConfig) => {
        const { config, isRunning, mode } = get()
        if (isRunning) return // Don't change config while running
        
        const updated = { ...config, ...newConfig }
        const initialTime = Math.round(mode === 'pomodoro'
          ? updated.pomodoro * 60
          : mode === 'shortBreak'
            ? updated.shortBreak * 60
            : updated.longBreak * 60)
        
        set({ config: updated, timeLeft: initialTime })
      },
      
      incrementCompletedPomodoros: () => {
        set((state) => ({ completedPomodoros: state.completedPomodoros + 1 }))
      },
      
      getInitialTime: (mode) => {
        const { config } = get()
        switch (mode) {
          case 'pomodoro':
            return Math.round(config.pomodoro * 60)
          case 'shortBreak':
            return Math.round(config.shortBreak * 60)
          case 'longBreak':
            return Math.round(config.longBreak * 60)
          default:
            return Math.round(config.pomodoro * 60)
        }
      },
      
      getElapsedMinutes: () => {
        const { isRunning, startedAt, timeLeft, mode, config, pausedTimeLeft, timeLeftAtStart } = get()
        const initialTime = mode === 'pomodoro' 
          ? config.pomodoro * 60 
          : mode === 'shortBreak' 
            ? config.shortBreak * 60 
            : config.longBreak * 60
        
        if (isRunning && startedAt && timeLeftAtStart !== null) {
          const elapsedSeconds = (Date.now() - startedAt) / 1000
          const timeUsedBefore = pausedTimeLeft !== null 
            ? initialTime - pausedTimeLeft 
            : initialTime - timeLeftAtStart
          return (timeUsedBefore + elapsedSeconds) / 60
        }
        
        return (initialTime - timeLeft) / 60
      },
    }),
    {
      name: 'pomodoro-storage',
      // Rehydrate running timer on page load
      onRehydrateStorage: () => (state) => {
        if (state?.isRunning && state?.startedAt && state?.timeLeftAtStart !== null && state?.timeLeftAtStart !== undefined) {
          // Calculate how much time has passed since the timer was running
          const elapsedSinceStart = Math.floor((Date.now() - state.startedAt) / 1000)
          const newTimeLeft = (state.timeLeftAtStart ?? state.timeLeft) - elapsedSinceStart
          
          if (newTimeLeft > 0) {
            state.timeLeft = newTimeLeft
          } else {
            state.timeLeft = 0
            state.isRunning = false
            state.startedAt = null
            state.timeLeftAtStart = null
          }
        }
      },
    }
  )
)
