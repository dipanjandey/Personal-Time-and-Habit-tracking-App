'use client'

import { useState, useEffect } from 'react'
import { Check, Clock, Circle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TimeEntry } from '@/types/time-tracking'

interface OngoingTaskCardProps {
  task: TimeEntry
  onComplete: (id: string) => void
  isSelected?: boolean
  onSelect?: (id: string) => void
  compact?: boolean
}

// Helper to format elapsed time
function formatElapsed(startTime: string, date: string): string {
  let startDateTime: Date
  if (startTime.includes(' ')) {
    const [dateStr, time] = startTime.split(' ')
    startDateTime = new Date(`${dateStr}T${time}:00`)
  } else {
    startDateTime = new Date(`${date}T${startTime}:00`)
  }
  
  const now = new Date()
  const diffMs = now.getTime() - startDateTime.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 60) {
    return `${diffMins}m`
  }
  
  const hours = Math.floor(diffMins / 60)
  const mins = diffMins % 60
  return `${hours}h ${mins}m`
}

// Helper to format start time for display
function formatStartTime(startTime: string, date: string): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  let dateStr: string
  let timeStr: string
  
  if (startTime.includes(' ')) {
    [dateStr, timeStr] = startTime.split(' ')
  } else {
    dateStr = date
    timeStr = startTime
  }
  
  const d = new Date(dateStr + 'T00:00:00')
  const monthName = monthNames[d.getMonth()]
  const day = d.getDate().toString().padStart(2, '0')
  
  const [hours, minutes] = timeStr.split(':')
  const hourNum = parseInt(hours, 10)
  const period = hourNum >= 12 ? 'pm' : 'am'
  const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
  
  return `${monthName} ${day}, ${hour12}:${minutes} ${period}`
}

export function OngoingTaskCard({
  task,
  onComplete,
  isSelected = false,
  onSelect,
  compact = false,
}: OngoingTaskCardProps) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(task.startTime, task.date))
  
  // Update elapsed time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(task.startTime, task.date))
    }, 60000)
    
    return () => clearInterval(interval)
  }, [task.startTime, task.date])
  
  const handleSelect = () => {
    if (onSelect) {
      onSelect(task.id)
    }
  }
  
  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onComplete(task.id)
  }
  
  if (compact) {
    return (
      <div
        onClick={handleSelect}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
          isSelected
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <div className={cn(
          "w-3 h-3 rounded-full border-2 flex-shrink-0",
          isSelected ? "border-primary bg-primary" : "border-muted-foreground"
        )}>
          {isSelected && <Check className="w-2 h-2 text-primary-foreground" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{task.workArea}</Badge>
            <Badge variant="outline" className="text-xs">{task.workType}</Badge>
          </div>
          {task.comments && (
            <p className="text-xs text-muted-foreground truncate mt-1">{task.comments}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{elapsed}</span>
        </div>
        
        {task.pomodoros > 0 && (
          <Badge variant="default" className="text-xs">
            🍅 {task.pomodoros}
          </Badge>
        )}
      </div>
    )
  }
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isSelected && "ring-2 ring-primary"
    )}>
      <div className="h-1 bg-green-500" />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500 animate-pulse" />
                <span className="text-xs font-medium text-green-600 uppercase">Ongoing</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="secondary">{task.workArea}</Badge>
              <Badge variant="outline">{task.workType}</Badge>
              {task.pomodoros > 0 && (
                <Badge variant="default">🍅 {task.pomodoros}</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Started: {formatStartTime(task.startTime, task.date)}</span>
              </div>
              <div className="font-medium text-foreground">
                ⏱️ {elapsed}
              </div>
            </div>
            
            {task.comments && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                📝 {task.comments}
              </p>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleComplete}
            className="flex-shrink-0 gap-1.5"
          >
            <Check className="w-4 h-4" />
            Complete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
