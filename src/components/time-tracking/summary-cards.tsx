'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { formatDuration, getTodayDate, getWeekStartDate } from '@/lib/time-utils'

export function SummaryCards() {
  const { entries } = useTimeTrackingStore()
  
  const today = getTodayDate()
  const todayEntries = entries.filter((e) => e.date === today)
  
  const todayTime = todayEntries.reduce((sum, e) => sum + e.duration, 0)
  const todayPomodoros = todayEntries.reduce((sum, e) => sum + e.pomodoros, 0)
  
  // Calculate week time from Monday onwards
  const weekStart = getWeekStartDate()
  const weekEntries = entries.filter((e) => e.date >= weekStart)
  const weekTime = weekEntries.reduce((sum, e) => sum + e.duration, 0)
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card className="text-center">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            TODAY&apos;S TIME
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatDuration(todayTime)}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            THIS WEEK
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatDuration(weekTime)}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            POMODOROS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{todayPomodoros}</div>
        </CardContent>
      </Card>
    </div>
  )
}