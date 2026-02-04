import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns'
import type { TimeEntry } from '@/types/time-tracking'

export type TimePeriod = 'today' | 'week' | 'month' | 'custom'

export interface DateRange {
  from: Date
  to: Date
}

export interface TimeStats {
  totalDuration: number // in minutes
  totalPomodoros: number
  averageSessionDuration: number
  totalSessions: number
}

export interface WorkAreaStats {
  name: string
  duration: number // in minutes
  percentage: number
  pomodoros: number
}

export interface WorkTypeStats {
  name: string
  duration: number // in minutes
  percentage: number
  pomodoros: number
}

export interface DailyTrend {
  date: string // ISO date
  duration: number // in minutes
  pomodoros: number
}

export interface AnalyticsData {
  stats: TimeStats
  workAreaBreakdown: WorkAreaStats[]
  workTypeBreakdown: WorkTypeStats[]
  dailyTrends: DailyTrend[]
}

/**
 * Get date range based on time period
 */
export function getDateRange(period: TimePeriod, customRange?: DateRange): DateRange {
  const now = new Date()
  
  switch (period) {
    case 'today':
      return {
        from: startOfDay(now),
        to: endOfDay(now),
      }
    case 'week':
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }), // Monday
        to: endOfWeek(now, { weekStartsOn: 1 }),
      }
    case 'month':
      return {
        from: startOfMonth(now),
        to: endOfMonth(now),
      }
    case 'custom':
      return customRange || { from: startOfDay(now), to: endOfDay(now) }
    default:
      return {
        from: startOfDay(now),
        to: endOfDay(now),
      }
  }
}

/**
 * Filter entries by date range
 */
export function filterEntriesByDateRange(
  entries: TimeEntry[],
  dateRange: DateRange
): TimeEntry[] {
  return entries.filter((entry) => {
    const entryDate = parseISO(entry.date)
    return isWithinInterval(entryDate, { start: dateRange.from, end: dateRange.to })
  })
}

/**
 * Calculate summary statistics
 */
export function calculateStats(entries: TimeEntry[]): TimeStats {
  const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0)
  const totalPomodoros = entries.reduce((sum, entry) => sum + entry.pomodoros, 0)
  const totalSessions = entries.length
  const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0

  return {
    totalDuration,
    totalPomodoros,
    averageSessionDuration,
    totalSessions,
  }
}

/**
 * Calculate work area breakdown
 */
export function calculateWorkAreaBreakdown(entries: TimeEntry[]): WorkAreaStats[] {
  const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0)
  
  // Group by work area
  const grouped = entries.reduce<Record<string, { duration: number; pomodoros: number }>>((acc, entry) => {
    if (!acc[entry.workArea]) {
      acc[entry.workArea] = { duration: 0, pomodoros: 0 }
    }
    acc[entry.workArea].duration += entry.duration
    acc[entry.workArea].pomodoros += entry.pomodoros
    return acc
  }, {})

  // Convert to array and calculate percentages
  const breakdown = Object.entries(grouped)
    .map(([name, data]) => ({
      name,
      duration: data.duration,
      pomodoros: data.pomodoros,
      percentage: totalDuration > 0 ? (data.duration / totalDuration) * 100 : 0,
    }))
    .sort((a, b) => b.duration - a.duration) // Sort by duration descending

  return breakdown
}

/**
 * Calculate work type breakdown
 */
export function calculateWorkTypeBreakdown(entries: TimeEntry[]): WorkTypeStats[] {
  const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0)
  
  // Group by work type
  const grouped = entries.reduce<Record<string, { duration: number; pomodoros: number }>>((acc, entry) => {
    if (!acc[entry.workType]) {
      acc[entry.workType] = { duration: 0, pomodoros: 0 }
    }
    acc[entry.workType].duration += entry.duration
    acc[entry.workType].pomodoros += entry.pomodoros
    return acc
  }, {})

  // Convert to array and calculate percentages
  const breakdown = Object.entries(grouped)
    .map(([name, data]) => ({
      name,
      duration: data.duration,
      pomodoros: data.pomodoros,
      percentage: totalDuration > 0 ? (data.duration / totalDuration) * 100 : 0,
    }))
    .sort((a, b) => b.duration - a.duration) // Sort by duration descending

  return breakdown
}

/**
 * Calculate daily trends
 */
export function calculateDailyTrends(
  entries: TimeEntry[],
  dateRange: DateRange
): DailyTrend[] {
  // Get all days in the range
  const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
  
  // Group entries by date
  const grouped = entries.reduce<Record<string, { duration: number; pomodoros: number }>>((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = { duration: 0, pomodoros: 0 }
    }
    acc[entry.date].duration += entry.duration
    acc[entry.date].pomodoros += entry.pomodoros
    return acc
  }, {})

  // Create trend data for all days (including days with no entries)
  const trends = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const data = grouped[dateStr] || { duration: 0, pomodoros: 0 }
    return {
      date: dateStr,
      duration: data.duration,
      pomodoros: data.pomodoros,
    }
  })

  return trends
}

/**
 * Compute complete analytics data
 */
export function computeAnalyticsData(
  entries: TimeEntry[],
  period: TimePeriod,
  customRange?: DateRange
): AnalyticsData {
  const dateRange = getDateRange(period, customRange)
  const filteredEntries = filterEntriesByDateRange(entries, dateRange)

  return {
    stats: calculateStats(filteredEntries),
    workAreaBreakdown: calculateWorkAreaBreakdown(filteredEntries),
    workTypeBreakdown: calculateWorkTypeBreakdown(filteredEntries),
    dailyTrends: calculateDailyTrends(filteredEntries, dateRange),
  }
}

/**
 * Format duration in minutes to readable format (e.g., "2h 30m")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Format percentage (e.g., "45.2%")
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Format date for chart axis (e.g., "Jan 15")
 */
export function formatChartDate(date: string | Date): string {
  return format(new Date(date), 'MMM d')
}

/**
 * Format date for display (e.g., "Jan 15, 2026")
 */
export function formatDisplayDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}
