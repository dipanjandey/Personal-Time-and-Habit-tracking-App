'use client'

import { useState, useEffect, useCallback } from 'react'
import { Timer, Pencil, Trash2, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { toast } from 'sonner'
import type { TimeEntry, PomodoroSession } from '@/types/time-tracking'

// Helper to format time for display (12h)
function formatTime(datetime: string): string {
  let timeStr: string

  if (datetime.includes(' ')) {
    timeStr = datetime.split(' ')[1]
  } else if (datetime.includes('T')) {
    timeStr = datetime.split('T')[1].slice(0, 5)
  } else {
    timeStr = datetime
  }

  const [hours, minutes] = timeStr.split(':')
  const hourNum = parseInt(hours, 10)
  const period = hourNum >= 12 ? 'PM' : 'AM'
  const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum

  return `${hour12}:${minutes} ${period}`
}

// Helper to format date for header
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/** Represents either a real timer session or a virtual "manual" entry */
interface PomodoroItem {
  type: 'timer' | 'manual'
  session?: PomodoroSession
  index: number // 1-based display index
}

interface PomodoroDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: TimeEntry | null
}

export function PomodoroDetailsDialog({
  open,
  onOpenChange,
  entry,
}: PomodoroDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [sessions, setSessions] = useState<PomodoroSession[]>([])

  const {
    loadPomodoroSessionsForEntry,
    pomodoroSessionsMap,
    removePomodoroSession,
    decrementEntryPomodoros,
  } = useTimeTrackingStore()

  // Re-read entry from store so UI stays in sync after deletions
  const liveEntry = useTimeTrackingStore(
    (s) => s.entries.find((e) => e.id === entry?.id) ?? null
  )

  useEffect(() => {
    if (open && entry) {
      const cached = pomodoroSessionsMap.get(entry.id)
      if (cached) {
        setSessions(cached)
      } else {
        setIsLoading(true)
        loadPomodoroSessionsForEntry(entry.id)
          .then((data) => setSessions(data))
          .catch((error) => console.error('Failed to load pomodoro sessions:', error))
          .finally(() => setIsLoading(false))
      }
    }
  }, [open, entry, loadPomodoroSessionsForEntry, pomodoroSessionsMap])

  // Keep sessions in sync with the cache
  useEffect(() => {
    if (entry) {
      const cached = pomodoroSessionsMap.get(entry.id)
      if (cached) setSessions(cached)
    }
  }, [pomodoroSessionsMap, entry])

  const handleDeleteTimerSession = useCallback(async (session: PomodoroSession) => {
    if (!entry) return
    try {
      await removePomodoroSession(session.id, entry.id)
      toast.success('Pomodoro session deleted')
    } catch {
      toast.error('Failed to delete session')
    }
  }, [entry, removePomodoroSession])

  const handleDeleteManualEntry = useCallback(async () => {
    if (!entry) return
    try {
      await decrementEntryPomodoros(entry.id)
      toast.success('Manual pomodoro removed')
    } catch {
      toast.error('Failed to remove pomodoro')
    }
  }, [entry, decrementEntryPomodoros])

  if (!entry) return null

  const currentEntry = liveEntry ?? entry
  const pomodoroCount = currentEntry.pomodoros
  const manualCount = Math.max(0, pomodoroCount - sessions.length)
  const totalTimerDuration = sessions.reduce((sum, s) => sum + s.duration, 0)

  // Build unified list: timer sessions first, then manual entries
  const items: PomodoroItem[] = [
    ...sessions.map((session, i) => ({
      type: 'timer' as const,
      session,
      index: i + 1,
    })),
    ...Array.from({ length: manualCount }, (_, i) => ({
      type: 'manual' as const,
      index: sessions.length + i + 1,
    })),
  ]

  // Close if all pomodoros removed
  const isEmpty = pomodoroCount <= 0 && sessions.length === 0

  return (
    <Dialog open={open && !isEmpty} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span>🍅</span>
            Pomodoro Details
            <span className="text-muted-foreground font-normal text-base">
              ({pomodoroCount})
            </span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentEntry.workArea} · {formatDate(currentEntry.date)}
          </p>
        </DialogHeader>

        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 -mr-1">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </>
          ) : items.length > 0 ? (
            items.map((item) =>
              item.type === 'timer' && item.session ? (
                <TimerRow
                  key={item.session.id}
                  session={item.session}
                  onDelete={() => handleDeleteTimerSession(item.session!)}
                />
              ) : (
                <ManualRow
                  key={`manual-${item.index}`}
                  onDelete={handleDeleteManualEntry}
                />
              )
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No pomodoro sessions recorded yet.
            </div>
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Total: {pomodoroCount} pomodoro{pomodoroCount !== 1 ? 's' : ''}
              </span>
              {totalTimerDuration > 0 && (
                <span className="font-semibold">
                  {totalTimerDuration} min from timer
                </span>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Timer-based pomodoro row */
function TimerRow({
  session,
  onDelete,
}: {
  session: PomodoroSession
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border group hover:bg-muted/80 transition-colors">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="shrink-0 w-7 h-7 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
            <Timer className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Timer entry</p>
        </TooltipContent>
      </Tooltip>

      <div className="flex-1 flex items-center gap-2 text-sm min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground hover:text-foreground transition-colors cursor-default">
              {formatTime(session.startTime)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs text-muted-foreground">Start time</p>
            <p className="font-medium">{formatTime(session.startTime)}</p>
          </TooltipContent>
        </Tooltip>

        <span className="text-muted-foreground">→</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground hover:text-foreground transition-colors cursor-default">
              {formatTime(session.endTime)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs text-muted-foreground">End time</p>
            <p className="font-medium">{formatTime(session.endTime)}</p>
          </TooltipContent>
        </Tooltip>

        <span className="font-medium ml-auto shrink-0">
          {session.duration} min
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
        onClick={onDelete}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  )
}

/** Manual pomodoro row */
function ManualRow({ onDelete }: { onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border group hover:bg-muted/80 transition-colors">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="shrink-0 w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
            <Pencil className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Manual entry</p>
        </TooltipContent>
      </Tooltip>

      <span className="flex-1 text-sm text-muted-foreground italic">
        Manual entry
      </span>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
        onClick={onDelete}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  )
}
