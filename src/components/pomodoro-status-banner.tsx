'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Play, Pause, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePomodoroStore } from '@/store/pomodoro-store'
import { cn } from '@/lib/utils'

export function PomodoroStatusBanner() {
  const { 
    isRunning, 
    timeLeft, 
    mode, 
    selectedArea,
    isTimerVisible,
    pause, 
    resume,
    tick,
  } = usePomodoroStore()
  
  // Global timer interval - runs regardless of which page we're on
  useEffect(() => {
    if (!isRunning) return
    
    const interval = setInterval(() => {
      tick()
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isRunning, tick])
  
  // Don't show banner if the timer component is visible (user can see the full timer)
  // Also don't show if timer is not running and has full time left
  const initialTime = mode === 'pomodoro' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60
  const isTimerActive = isRunning || timeLeft < initialTime
  
  if (isTimerVisible || !isTimerActive) {
    return null
  }
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const getModeLabel = () => {
    switch (mode) {
      case 'pomodoro':
        return 'Focus'
      case 'shortBreak':
        return 'Short Break'
      case 'longBreak':
        return 'Long Break'
    }
  }
  
  const getModeColor = () => {
    switch (mode) {
      case 'pomodoro':
        return 'bg-primary text-primary-foreground'
      case 'shortBreak':
        return 'bg-green-600 text-white'
      case 'longBreak':
        return 'bg-blue-600 text-white'
    }
  }

  return (
    <div 
      className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg",
        "animate-in slide-in-from-bottom-2 duration-300",
        getModeColor()
      )}
    >
      {/* Timer icon with pulse animation when running */}
      <Timer className={cn("w-5 h-5", isRunning && "animate-pulse")} />
      
      {/* Time display */}
      <span className="font-mono font-bold text-lg tabular-nums">
        {formatTime(timeLeft)}
      </span>
      
      {/* Mode and task info */}
      <div className="flex flex-col text-xs opacity-90 leading-tight">
        <span className="font-medium">{getModeLabel()}</span>
        {selectedArea && (
          <span className="truncate max-w-24">{selectedArea}</span>
        )}
      </div>
      
      {/* Divider */}
      <div className="w-px h-6 bg-current opacity-30" />
      
      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="secondary"
          onClick={isRunning ? pause : resume}
          className="h-8 w-8 p-0"
          title={isRunning ? 'Pause' : 'Resume'}
        >
          {isRunning ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        
        <Link href="/track-time">
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-8 px-3 text-xs font-medium"
          >
            Open
          </Button>
        </Link>
      </div>
    </div>
  )
}
