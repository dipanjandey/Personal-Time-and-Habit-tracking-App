import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
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

export interface Insight {
  title: string
  value: string
  icon: 'calendar' | 'target' | 'clock'
}

export interface TrendComparison {
  totalDurationChange: number // percentage change
  totalPomodorosChange: number // percentage change
}

export interface PriorityStats {
  name: string
  duration: number // in minutes
  percentage: number
  count: number
}

export interface AnalyticsData {
  stats: TimeStats
  workAreaBreakdown: WorkAreaStats[]
  workTypeBreakdown: WorkTypeStats[]
  priorityBreakdown: PriorityStats[]
  dailyTrends: DailyTrend[]
  insights: Insight[]
  trendComparison: TrendComparison
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
 * Note: entry.date is in YYYY-MM-DD format (local date, not timezone-aware)
 * We compare against the date part only to avoid timezone issues
 */
export function filterEntriesByDateRange(
  entries: TimeEntry[],
  dateRange: DateRange
): TimeEntry[] {
  // Get date strings for range boundaries (ignore time)
  const fromDateStr = format(dateRange.from, 'yyyy-MM-dd')
  const toDateStr = format(dateRange.to, 'yyyy-MM-dd')
  
  return entries.filter((entry) => {
    // Compare dates as strings to avoid timezone conversion issues
    return entry.date >= fromDateStr && entry.date <= toDateStr
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
 * Calculate priority breakdown
 */
export function calculatePriorityBreakdown(entries: TimeEntry[]): PriorityStats[] {
  const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0)

  // Group by priority
  const grouped = entries.reduce<Record<string, { duration: number; count: number }>>((acc, entry) => {
    const key = entry.priority || 'Unset'
    if (!acc[key]) {
      acc[key] = { duration: 0, count: 0 }
    }
    acc[key].duration += entry.duration
    acc[key].count += 1
    return acc
  }, {})

  // Convert to array and calculate percentages
  const breakdown = Object.entries(grouped)
    .map(([name, data]) => ({
      name,
      duration: data.duration,
      count: data.count,
      percentage: totalDuration > 0 ? (data.duration / totalDuration) * 100 : 0,
    }))
    .sort((a, b) => b.duration - a.duration)

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
 * Get previous period date range for comparison
 */
export function getPreviousPeriodRange(period: TimePeriod, currentRange: DateRange): DateRange {
  const duration = currentRange.to.getTime() - currentRange.from.getTime()
  return {
    from: new Date(currentRange.from.getTime() - duration - 1),
    to: new Date(currentRange.from.getTime() - 1),
  }
}

/**
 * Calculate trend comparison with previous period
 */
export function calculateTrendComparison(
  currentStats: TimeStats,
  previousStats: TimeStats
): TrendComparison {
  const calcChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return {
    totalDurationChange: calcChange(currentStats.totalDuration, previousStats.totalDuration),
    totalPomodorosChange: calcChange(currentStats.totalPomodoros, previousStats.totalPomodoros),
  }
}

/**
 * Calculate insights from analytics data
 */
export function calculateInsights(
  dailyTrends: DailyTrend[],
  workAreaBreakdown: WorkAreaStats[]
): Insight[] {
  const insights: Insight[] = []

  // Most productive day
  const mostProductiveDay = dailyTrends.reduce((max, day) => 
    day.duration > max.duration ? day : max, 
    { date: '', duration: 0, pomodoros: 0 }
  )
  if (mostProductiveDay.duration > 0) {
    const dayName = format(toLocalDate(mostProductiveDay.date), 'EEEE')
    insights.push({
      title: 'Most Productive Day',
      value: `${dayName} - ${formatDuration(mostProductiveDay.duration)}`,
      icon: 'calendar',
    })
  }

  // Top work area
  if (workAreaBreakdown.length > 0) {
    const topArea = workAreaBreakdown[0]
    insights.push({
      title: 'Top Work Area',
      value: `${topArea.name} - ${formatPercentage(topArea.percentage)}`,
      icon: 'target',
    })
  }

  // Peak hours (simplified - based on most active day's data)
  // For now, we'll show a placeholder since we don't have hourly data
  if (dailyTrends.some(d => d.duration > 0)) {
    insights.push({
      title: 'Daily Average',
      value: formatDuration(dailyTrends.reduce((sum, d) => sum + d.duration, 0) / Math.max(dailyTrends.filter(d => d.duration > 0).length, 1)),
      icon: 'clock',
    })
  }

  return insights
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

  const stats = calculateStats(filteredEntries)
  const workAreaBreakdown = calculateWorkAreaBreakdown(filteredEntries)
  const workTypeBreakdown = calculateWorkTypeBreakdown(filteredEntries)
  const priorityBreakdown = calculatePriorityBreakdown(filteredEntries)
  const dailyTrends = calculateDailyTrends(filteredEntries, dateRange)

  // Calculate previous period for comparison
  const previousRange = getPreviousPeriodRange(period, dateRange)
  const previousEntries = filterEntriesByDateRange(entries, previousRange)
  const previousStats = calculateStats(previousEntries)
  const trendComparison = calculateTrendComparison(stats, previousStats)

  // Calculate insights
  const insights = calculateInsights(dailyTrends, workAreaBreakdown)

  return {
    stats,
    workAreaBreakdown,
    workTypeBreakdown,
    priorityBreakdown,
    dailyTrends,
    insights,
    trendComparison,
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
 * Parse a date string or Date to a local Date object.
 * When given a string like "2026-02-16", `new Date("2026-02-16")` creates
 * midnight UTC which shifts the day in UTC-negative timezones.
 * Appending 'T00:00:00' forces local timezone interpretation.
 */
function toLocalDate(date: string | Date): Date {
  if (date instanceof Date) return date
  // If it's a date-only string (YYYY-MM-DD), append T00:00:00 to force local
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(date + 'T00:00:00')
  }
  return new Date(date)
}

/**
 * Format date for chart axis (e.g., "Feb 5, Wed")
 */
export function formatChartDate(date: string | Date): string {
  return format(toLocalDate(date), 'MMM d, EEE')
}

/**
 * Format date for display (e.g., "Jan 15, 2026")
 */
export function formatDisplayDate(date: string | Date): string {
  return format(toLocalDate(date), 'MMM d, yyyy')
}

/**
 * Format date with day name for tooltip (e.g., "Monday, Jan 15, 2026")
 */
export function formatTooltipDate(date: string | Date): string {
  return format(toLocalDate(date), 'EEEE, MMM d, yyyy')
}
