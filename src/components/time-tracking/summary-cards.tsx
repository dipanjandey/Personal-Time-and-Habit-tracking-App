'use client'

import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { formatDuration, getTodayDate, getWeekStartDate, getEntryEffectiveDate } from '@/lib/time-utils'

export function SummaryCards() {
  const { entries } = useTimeTrackingStore()
  
  const today = getTodayDate()
  const todayEntries = entries.filter((e) => getEntryEffectiveDate(e) === today)
  
  const todayTime = todayEntries.reduce((sum, e) => sum + e.duration, 0)
  const todayPomodoros = todayEntries.reduce((sum, e) => sum + e.pomodoros, 0)
  
  const weekStart = getWeekStartDate()
  const weekEntries = entries.filter((e) => getEntryEffectiveDate(e) >= weekStart)
  const weekTime = weekEntries.reduce((sum, e) => sum + e.duration, 0)
  
  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8 mb-6 border-y border-border">
      <div className="grid grid-cols-3 divide-x divide-border">
        <div className="px-4 md:px-6 lg:px-8 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
            This Week
          </p>
          <p className="text-4xl md:text-5xl font-display font-extrabold tabular-nums leading-none text-foreground">
            {formatDuration(weekTime)}
          </p>
        </div>

        <div className="px-4 md:px-6 lg:px-8 py-5 bg-primary/[0.04]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary mb-1.5">
            Today
          </p>
          <p className="text-4xl md:text-5xl font-display font-extrabold tabular-nums leading-none text-primary">
            {formatDuration(todayTime)}
          </p>
        </div>

        <div className="px-4 md:px-6 lg:px-8 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
            Pomodoros
          </p>
          <p className="text-4xl md:text-5xl font-display font-extrabold tabular-nums leading-none text-foreground">
            {todayPomodoros}
          </p>
        </div>
      </div>
    </div>
  )
}
