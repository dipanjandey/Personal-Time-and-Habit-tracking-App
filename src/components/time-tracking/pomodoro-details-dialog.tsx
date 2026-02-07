'use client'

import { useState, useEffect } from 'react'
import { X, Clock, Check, Timer } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import type { TimeEntry, PomodoroSession } from '@/types/time-tracking'

interface PomodoroDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: TimeEntry | null
}

// Helper to format time for display
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
  const period = hourNum >= 12 ? 'pm' : 'am'
  const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
  
  return `${hour12}:${minutes} ${period}`
}

export function PomodoroDetailsDialog({
  open,
  onOpenChange,
  entry,
}: PomodoroDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  
  const { loadPomodoroSessionsForEntry, pomodoroSessionsMap } = useTimeTrackingStore()
  
  useEffect(() => {
    if (open && entry) {
      // Check cache first
      const cached = pomodoroSessionsMap.get(entry.id)
      if (cached) {
        setSessions(cached)
      } else {
        // Load from server
        setIsLoading(true)
        loadPomodoroSessionsForEntry(entry.id)
          .then((data) => {
            setSessions(data)
          })
          .catch((error) => {
            console.error('Failed to load pomodoro sessions:', error)
          })
          .finally(() => {
            setIsLoading(false)
          })
      }
    }
  }, [open, entry, loadPomodoroSessionsForEntry, pomodoroSessionsMap])
  
  if (!entry) return null
  
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0)
  const fullPomodoros = sessions.filter(s => s.isFullPomodoro).length
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>🍅</span>
            Pomodoro Sessions
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Entry info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{entry.workArea}</Badge>
            <Badge variant="outline">{entry.workType}</Badge>
          </div>
          
          {/* Sessions list */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : sessions.length > 0 ? (
              sessions.map((session, index) => (
                <div
                  key={session.id}
                  className="p-3 bg-muted/50 rounded-lg border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      {session.isFullPomodoro ? (
                        <Badge variant="default" className="gap-1">
                          <Check className="w-3 h-3" />
                          Full Pomodoro
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Timer className="w-3 h-3" />
                          Partial ({session.duration} min)
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {formatTime(session.startTime)} → {formatTime(session.endTime)}
                    </span>
                    <span className="text-foreground font-medium ml-1">
                      ({session.duration} min)
                    </span>
                  </div>
                  
                  {session.comments && (
                    <p className="text-sm text-muted-foreground">
                      📝 {session.comments}
                    </p>
                  )}
                </div>
              ))
            ) : entry.pomodoros > 0 ? (
              // Entry has pomodoro count but no detailed sessions (created before session tracking)
              <div className="text-center py-6 text-muted-foreground">
                <div className="text-3xl mb-2">🍅 × {entry.pomodoros}</div>
                <p className="font-medium text-foreground">
                  {entry.pomodoros} pomodoro{entry.pomodoros !== 1 ? 's' : ''} recorded
                </p>
                <p className="text-sm mt-2">
                  Detailed session tracking wasn't available when this entry was created.
                </p>
                <p className="text-sm mt-1">
                  New pomodoros linked to ongoing tasks will show individual session details.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No pomodoro sessions recorded yet.</p>
                <p className="text-sm mt-1">
                  Sessions will appear here when you run pomodoros linked to this task.
                </p>
              </div>
            )}
          </div>
          
          {/* Summary footer */}
          {sessions.length > 0 && (
            <div className="pt-3 border-t flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Total: {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                {fullPomodoros > 0 && ` (${fullPomodoros} full)`}
              </span>
              <span className="font-bold">{totalDuration} minutes</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
