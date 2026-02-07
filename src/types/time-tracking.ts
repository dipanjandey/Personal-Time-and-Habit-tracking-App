export interface TimeEntry {
  id: string
  startTime: string // HH:mm format or YYYY-MM-DD HH:mm
  endTime: string | null // HH:mm format or YYYY-MM-DD HH:mm, null for ongoing tasks
  workArea: string
  workType: string
  pomodoros: number
  comments: string
  date: string // ISO date
  duration: number // in minutes
  userId: string
}

export interface PomodoroSession {
  id: string
  timeEntryId: string | null
  userId: string
  startTime: string
  endTime: string
  duration: number
  comments: string | null
  isFullPomodoro: boolean
  createdAt: string
}

export interface WorkArea {
  id: string
  name: string
  color?: string
}

export interface WorkType {
  id: string
  name: string
  priority?: string
}

export type TimeRange = 'today' | 'week' | 'month' | 'custom'

export interface TimerState {
  isRunning: boolean
  startTime: number | null
  elapsedTime: number
  activity: string
  workArea: string
  workType: string
}