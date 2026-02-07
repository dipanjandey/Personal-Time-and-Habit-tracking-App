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
  startedAt: number | null // timestamp when timer was started/resumed
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
  
  incrementCompletedPomodoros: () => void
  getInitialTime: (mode: TimerMode) => number
  getElapsedMinutes: () => number
}

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'pomodoro',
      timeLeft: DEFAULT_CONFIG.pomodoro * 60,
      isRunning: false,
      startedAt: null,
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
        set((state) => ({
          isRunning: true,
          startedAt: Date.now(),
          pausedTimeLeft: null,
          ...(area !== undefined && { selectedArea: area }),
          ...(type !== undefined && { selectedType: type }),
          ...(linkedTaskId !== undefined && { linkedTaskId }),
        }))
      },
      
      pause: () => {
        set((state) => ({
          isRunning: false,
          pausedTimeLeft: state.timeLeft,
          startedAt: null,
        }))
      },
      
      resume: () => {
        set({
          isRunning: true,
          startedAt: Date.now(),
          pausedTimeLeft: null,
        })
      },
      
      reset: () => {
        const { mode, config } = get()
        const initialTime = mode === 'pomodoro' 
          ? config.pomodoro * 60 
          : mode === 'shortBreak' 
            ? config.shortBreak * 60 
            : config.longBreak * 60
        
        set({
          isRunning: false,
          startedAt: null,
          pausedTimeLeft: null,
          timeLeft: initialTime,
        })
      },
      
      stop: () => {
        const { isRunning, startedAt, timeLeft, mode, config, pausedTimeLeft } = get()
        
        let elapsedMinutes = 0
        
        if (isRunning && startedAt) {
          // Timer was running - calculate from startedAt
          const elapsedMs = Date.now() - startedAt
          const elapsedSeconds = elapsedMs / 1000
          const initialTime = mode === 'pomodoro' 
            ? config.pomodoro * 60 
            : mode === 'shortBreak' 
              ? config.shortBreak * 60 
              : config.longBreak * 60
          
          // Total elapsed = time already used before this run + time used in this run
          const timeUsedBefore = pausedTimeLeft !== null 
            ? initialTime - pausedTimeLeft 
            : initialTime - timeLeft
          elapsedMinutes = (timeUsedBefore + elapsedSeconds) / 60
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
        const nextTimeLeft = nextMode === 'pomodoro' 
          ? config.pomodoro * 60 
          : config.shortBreak * 60
        
        set({
          isRunning: false,
          startedAt: null,
          pausedTimeLeft: null,
          mode: nextMode,
          timeLeft: nextTimeLeft,
        })
        
        return { wasRunning: isRunning, elapsedMinutes }
      },
      
      tick: () => {
        const { isRunning, timeLeft } = get()
        
        if (!isRunning || timeLeft <= 0) {
          if (timeLeft <= 0 && isRunning) {
            // Timer completed
            set({ isRunning: false, startedAt: null, pausedTimeLeft: null })
            return true
          }
          return false
        }
        
        set({ timeLeft: timeLeft - 1 })
        return false
      },
      
      setMode: (mode) => {
        const { config, isRunning } = get()
        if (isRunning) return // Don't change mode while running
        
        const initialTime = mode === 'pomodoro' 
          ? config.pomodoro * 60 
          : mode === 'shortBreak' 
            ? config.shortBreak * 60 
            : config.longBreak * 60
        
        set({
          mode,
          timeLeft: initialTime,
          startedAt: null,
          pausedTimeLeft: null,
        })
      },
      
      setSelectedArea: (selectedArea) => set({ selectedArea }),
      setSelectedType: (selectedType) => set({ selectedType }),
      setComments: (comments) => set({ comments }),
      setLinkedTaskId: (linkedTaskId) => set({ linkedTaskId }),
      setTimerVisible: (isTimerVisible) => set({ isTimerVisible }),
      
      incrementCompletedPomodoros: () => {
        set((state) => ({ completedPomodoros: state.completedPomodoros + 1 }))
      },
      
      getInitialTime: (mode) => {
        const { config } = get()
        switch (mode) {
          case 'pomodoro':
            return config.pomodoro * 60
          case 'shortBreak':
            return config.shortBreak * 60
          case 'longBreak':
            return config.longBreak * 60
          default:
            return config.pomodoro * 60
        }
      },
      
      getElapsedMinutes: () => {
        const { isRunning, startedAt, timeLeft, mode, config, pausedTimeLeft } = get()
        const initialTime = mode === 'pomodoro' 
          ? config.pomodoro * 60 
          : mode === 'shortBreak' 
            ? config.shortBreak * 60 
            : config.longBreak * 60
        
        if (isRunning && startedAt) {
          const elapsedMs = Date.now() - startedAt
          const elapsedSeconds = elapsedMs / 1000
          const timeUsedBefore = pausedTimeLeft !== null 
            ? initialTime - pausedTimeLeft 
            : initialTime - timeLeft
          return (timeUsedBefore + elapsedSeconds) / 60
        }
        
        return (initialTime - timeLeft) / 60
      },
    }),
    {
      name: 'pomodoro-storage',
      // Rehydrate running timer on page load
      onRehydrateStorage: () => (state) => {
        if (state?.isRunning && state?.startedAt) {
          // Calculate how much time has passed since the timer was running
          const elapsedSinceStart = Math.floor((Date.now() - state.startedAt) / 1000)
          const newTimeLeft = state.timeLeft - elapsedSinceStart
          
          if (newTimeLeft > 0) {
            // Timer still has time - update timeLeft and keep running
            state.timeLeft = newTimeLeft
          } else {
            // Timer would have completed - set to 0
            state.timeLeft = 0
            state.isRunning = false
            state.startedAt = null
          }
        }
      },
    }
  )
)
