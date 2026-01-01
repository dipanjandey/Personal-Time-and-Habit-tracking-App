export interface TimeEntry {
  id: string
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  workArea: string
  workType: string
  pomodoros: number
  comments: string
  date: string // ISO date
  duration: number // in minutes
  userId: string
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