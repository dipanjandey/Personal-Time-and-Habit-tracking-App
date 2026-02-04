import { useMemo } from 'react'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import {
  computeAnalyticsData,
  type TimePeriod,
  type DateRange,
  type AnalyticsData,
} from '@/lib/analytics-utils'

/**
 * Hook to fetch and compute analytics data from time tracking store
 */
export function useAnalyticsData(
  period: TimePeriod,
  dateRange?: DateRange
): AnalyticsData {
  const entries = useTimeTrackingStore((state) => state.entries)

  const analyticsData = useMemo(() => {
    return computeAnalyticsData(entries, period, dateRange)
  }, [entries, period, dateRange])

  return analyticsData
}
