'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw, Square, Clock, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useConfigStore } from '@/store/config-store'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { TimeEntry } from '@/types/time-tracking'

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak'

interface TimerConfig {
  pomodoro: number // in minutes
  shortBreak: number
  longBreak: number
  longBreakInterval: number // number of pomodoros before long break
}

interface PomodoroSession {
  mode: TimerMode
  timeLeft: number
  isRunning: boolean
  startedAt: number | null // timestamp when started
  selectedArea: string
  selectedType: string
  comments: string
  completedPomodoros: number
}

const DEFAULT_CONFIG: TimerConfig = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
}

const STORAGE_KEY = 'pomodoro-session'

// Helper to get today's date in ISO format
function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// Helper to format time as HH:mm
function formatTimeHHMM(date: Date): string {
  return date.toTimeString().slice(0, 5)
}

// Helper to format datetime as YYYY-MM-DD HH:mm
function formatDateTimeISO(date: Date): string {
  return `${date.toISOString().split('T')[0]} ${date.toTimeString().slice(0, 5)}`
}

interface PomodoroTimerProps {
  selectedOngoingTask?: TimeEntry | null
}

export function PomodoroTimer({ selectedOngoingTask }: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const [timeLeft, setTimeLeft] = useState(DEFAULT_CONFIG.pomodoro * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [config] = useState<TimerConfig>(DEFAULT_CONFIG)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  
  // Form state for Area, Type, Comments
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [comments, setComments] = useState<string>('')
  
  // Validation state
  const [showValidation, setShowValidation] = useState(false)
  
  const { workAreas, workTypes } = useConfigStore()
  const { entries, addEntry, addPomodoroSession, incrementEntryPomodoros } = useTimeTrackingStore()
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasRestoredRef = useRef(false)

  // Get today's entries (includes both full pomodoros and partial sessions)
  const todaysPomodoroEntries = entries.filter(
    (entry) => entry.date === getTodayISO()
  ).slice(0, 5) // Show max 5 recent entries

  // Check if form is valid (Area + Type required, OR ongoing task selected)
  const isFormValid = selectedOngoingTask || (selectedArea !== '' && selectedType !== '')

  // Initialize audio on mount
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQMWaJu5t4uNOz4xf6baxNJrIS0wapW3t7ShdlM2Pmp5n7K0q5ZfNzNBYHKLl5iMbkkzMD5aboGLi4N0XEQ4OkpbbH6FhX5xYU9CR09cbXmAgoB5bGBVSk5WYm1zeHl4dG5oYltYWl9kaGxub29ta2hmZGNiY2VnaWpqa2ppaGdmZWRjY2NjY2NjY2NjY2JiYWFgYF9fX19eXl5eXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1d')
  }, [])

  // Restore session from localStorage on mount
  useEffect(() => {
    if (hasRestoredRef.current) return
    hasRestoredRef.current = true

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const session: PomodoroSession = JSON.parse(saved)
        
        // Restore state
        setMode(session.mode)
        setSelectedArea(session.selectedArea)
        setSelectedType(session.selectedType)
        setComments(session.comments)
        setCompletedPomodoros(session.completedPomodoros)
        
        if (session.isRunning && session.startedAt) {
          // Calculate elapsed time since we left
          const elapsed = Math.floor((Date.now() - session.startedAt) / 1000)
          const remaining = session.timeLeft - elapsed
          
          if (remaining > 0) {
            // Timer still has time left - resume
            setTimeLeft(remaining)
            setIsRunning(true)
            setStartedAt(session.startedAt)
          } else {
            // Timer would have completed - handle completion
            setTimeLeft(0)
            // We'll handle completion in another effect
          }
        } else {
          // Timer was paused - restore time left
          setTimeLeft(session.timeLeft)
          setStartedAt(session.startedAt)
        }
      }
    } catch (error) {
      console.error('Failed to restore pomodoro session:', error)
    }
  }, [])

  // Persist session to localStorage
  useEffect(() => {
    const session: PomodoroSession = {
      mode,
      timeLeft,
      isRunning,
      startedAt,
      selectedArea,
      selectedType,
      comments,
      completedPomodoros,
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to save pomodoro session:', error)
    }
  }, [mode, timeLeft, isRunning, startedAt, selectedArea, selectedType, comments, completedPomodoros])

  // Get initial time for current mode
  const getInitialTime = useCallback((timerMode: TimerMode) => {
    switch (timerMode) {
      case 'pomodoro':
        return config.pomodoro * 60
      case 'shortBreak':
        return config.shortBreak * 60
      case 'longBreak':
        return config.longBreak * 60
      default:
        return config.pomodoro * 60
    }
  }, [config])

  // Save completed pomodoro to time entries or as a pomodoro session
  // If actualDurationMinutes is provided, use that instead of full pomodoro duration
  const saveCompletedPomodoro = useCallback(async (actualDurationMinutes?: number) => {
    if (mode !== 'pomodoro') return // Don't save breaks
    
    const now = new Date()
    const durationMinutes = actualDurationMinutes ?? config.pomodoro
    const startTime = new Date(now.getTime() - durationMinutes * 60 * 1000)
    const isFullPomodoro = actualDurationMinutes === undefined
    
    // Don't save if duration is less than 1 minute
    if (durationMinutes < 1) {
      toast.info('Session too short', {
        description: 'Sessions under 1 minute are not saved.',
      })
      return
    }
    
    try {
      // If associated with an ongoing task, create a pomodoro session instead
      if (selectedOngoingTask) {
        // Create pomodoro session linked to the ongoing task
        await addPomodoroSession({
          timeEntryId: selectedOngoingTask.id,
          startTime: formatDateTimeISO(startTime),
          endTime: formatDateTimeISO(now),
          duration: Math.round(durationMinutes),
          comments: comments || null,
          isFullPomodoro,
        })
        
        // Increment pomodoro count on the parent entry (only for full pomodoros)
        if (isFullPomodoro) {
          await incrementEntryPomodoros(selectedOngoingTask.id)
        }
        
        toast.success(isFullPomodoro ? 'Pomodoro added to task!' : 'Partial session saved!', {
          description: `${Math.round(durationMinutes)} min added to ${selectedOngoingTask.workArea}`,
        })
      } else {
        // Create independent time entry (original behavior)
        // Use full datetime format for consistency with other entries (needed for proper sorting)
        await addEntry({
          startTime: formatDateTimeISO(startTime),
          endTime: formatDateTimeISO(now),
          workArea: selectedArea,
          workType: selectedType,
          pomodoros: isFullPomodoro ? 1 : 0,
          comments: comments,
          date: getTodayISO(),
          duration: Math.round(durationMinutes),
          userId: '', // Will be set by the store/supabase
        })
        
        toast.success(isFullPomodoro ? 'Pomodoro completed!' : 'Partial session saved!', {
          description: `${Math.round(durationMinutes)} min • ${selectedArea} • ${selectedType}`,
        })
      }
    } catch (error) {
      console.error('Failed to save pomodoro entry:', error)
      toast.error('Failed to save entry', {
        description: 'Please try again or add manually.',
      })
    }
  }, [mode, config.pomodoro, selectedArea, selectedType, comments, selectedOngoingTask, addEntry, addPomodoroSession, incrementEntryPomodoros])

  // Handle timer completion
  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false)
    setStartedAt(null)
    
    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Audio play failed, likely due to autoplay restrictions
      })
    }

    // Save entry if it was a pomodoro (not a break)
    if (mode === 'pomodoro') {
      const newCount = completedPomodoros + 1
      setCompletedPomodoros(newCount)
      await saveCompletedPomodoro()
      
      // Check if it's time for a long break
      if (newCount % config.longBreakInterval === 0) {
        setMode('longBreak')
        setTimeLeft(config.longBreak * 60)
      } else {
        setMode('shortBreak')
        setTimeLeft(config.shortBreak * 60)
      }
    } else {
      // After any break, go back to pomodoro
      setMode('pomodoro')
      setTimeLeft(config.pomodoro * 60)
    }
  }, [mode, completedPomodoros, config, saveCompletedPomodoro])

  // Reset timer when mode changes manually
  useEffect(() => {
    // Don't reset if we're restoring from storage
    if (hasRestoredRef.current && !isRunning) {
      // Only reset if mode changed and timer is not running
    }
  }, [mode, isRunning])

  // Timer countdown logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      // Timer completed
      handleTimerComplete()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, handleTimerComplete])

  const handleStart = () => {
    if (!isFormValid) {
      setShowValidation(true)
      toast.error('Please select Area and Type', {
        description: 'Both fields are required to start the timer (or select an ongoing task).',
      })
      return
    }
    
    setShowValidation(false)
    setIsRunning(true)
    setStartedAt(Date.now())
  }

  const handlePause = () => {
    setIsRunning(false)
    // Keep startedAt to track total session time
  }

  const handleReset = () => {
    setIsRunning(false)
    setStartedAt(null)
    setTimeLeft(getInitialTime(mode))
    // Don't save - user explicitly reset
  }

  const handleStop = async () => {
    // Stop and complete the current cycle
    const wasRunning = isRunning
    const currentStartedAt = startedAt
    
    setIsRunning(false)
    setStartedAt(null)
    
    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Audio play failed, likely due to autoplay restrictions
      })
    }
    
    if (mode === 'pomodoro') {
      // Calculate actual elapsed time in minutes
      let actualDurationMinutes: number | undefined = undefined
      
      if (wasRunning && currentStartedAt) {
        // Timer was running - calculate elapsed time from when it started
        const elapsedMs = Date.now() - currentStartedAt
        actualDurationMinutes = elapsedMs / (1000 * 60) // Convert to minutes
      } else {
        // Timer was paused - calculate from how much time has been used
        const initialTime = getInitialTime(mode)
        const usedSeconds = initialTime - timeLeft
        actualDurationMinutes = usedSeconds / 60
      }
      
      // Save the partial session with actual duration
      await saveCompletedPomodoro(actualDurationMinutes)
      
      // Don't increment completed pomodoros count for partial sessions
      // Move to short break
      setMode('shortBreak')
      setTimeLeft(config.shortBreak * 60)
    } else {
      // Complete break, go to pomodoro
      setMode('pomodoro')
      setTimeLeft(config.pomodoro * 60)
    }
  }

  const handleModeChange = (newMode: string) => {
    if (isRunning) {
      // Don't allow mode change while running
      return
    }
    setMode(newMode as TimerMode)
    setTimeLeft(getInitialTime(newMode as TimerMode))
    setStartedAt(null)
  }

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate progress percentage
  const progress = ((getInitialTime(mode) - timeLeft) / getInitialTime(mode)) * 100

  return (
    <Card className="border-timer-border bg-timer-bg overflow-hidden">
      <CardContent className="p-0">
        {/* Progress bar at top */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 md:p-8">
          {/* Mode Tabs */}
          <Tabs value={mode} onValueChange={handleModeChange} className="mb-6">
            <TabsList className="w-full grid grid-cols-3 h-12 bg-muted/50">
              <TabsTrigger 
                value="pomodoro" 
                disabled={isRunning}
                className="text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground disabled:opacity-50"
              >
                Pomodoro
              </TabsTrigger>
              <TabsTrigger 
                value="shortBreak"
                disabled={isRunning}
                className="text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground disabled:opacity-50"
              >
                Short Break
              </TabsTrigger>
              <TabsTrigger 
                value="longBreak"
                disabled={isRunning}
                className="text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground disabled:opacity-50"
              >
                Long Break
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Timer Display */}
          <div className="text-center mb-6">
            <div 
              className={cn(
                "text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight font-mono",
                "text-foreground transition-colors"
              )}
            >
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {isRunning ? (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleReset}
                  className="h-14 px-6"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  onClick={handlePause}
                  className="h-16 px-12 text-xl font-bold shadow-lg"
                >
                  <Pause className="w-6 h-6 mr-2" />
                  PAUSE
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStop}
                  className="h-14 px-6"
                  title="Stop & Complete"
                >
                  <Square className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleReset}
                  className="h-14 px-6"
                  disabled={timeLeft === getInitialTime(mode)}
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  onClick={handleStart}
                  className="h-16 px-12 text-xl font-bold shadow-lg"
                >
                  <Play className="w-6 h-6 mr-2" />
                  START
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStop}
                  className="h-14 px-6"
                  disabled={timeLeft === getInitialTime(mode)}
                  title="Stop & Complete"
                >
                  <Square className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>

          {/* Area, Type, Comments Form */}
          <div className="border-t pt-6 mt-2 space-y-4">
            {/* Show linked task info when associated */}
            {selectedOngoingTask && (
              <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <Link className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  Linked to: <strong>{selectedOngoingTask.workArea}</strong> • {selectedOngoingTask.workType}
                </span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-6">
              {/* Area Select */}
              <div className="space-y-2">
                <Label htmlFor="area" className="text-sm font-medium">
                  Area {!selectedOngoingTask && <span className="text-destructive">*</span>}
                </Label>
                <Select 
                  value={selectedOngoingTask ? selectedOngoingTask.workArea : selectedArea} 
                  onValueChange={setSelectedArea}
                  disabled={isRunning || !!selectedOngoingTask}
                >
                  <SelectTrigger 
                    id="area"
                    className={cn(
                      "w-full",
                      selectedOngoingTask && "opacity-60",
                      showValidation && !selectedArea && !selectedOngoingTask && "border-destructive ring-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select area..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workAreas.map((area) => (
                      <SelectItem key={area.id} value={area.name}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showValidation && !selectedArea && !selectedOngoingTask && (
                  <p className="text-xs text-destructive">Area is required</p>
                )}
              </div>

              {/* Type Select */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Type {!selectedOngoingTask && <span className="text-destructive">*</span>}
                </Label>
                <Select 
                  value={selectedOngoingTask ? selectedOngoingTask.workType : selectedType} 
                  onValueChange={setSelectedType}
                  disabled={isRunning || !!selectedOngoingTask}
                >
                  <SelectTrigger 
                    id="type"
                    className={cn(
                      "w-full",
                      selectedOngoingTask && "opacity-60",
                      showValidation && !selectedType && !selectedOngoingTask && "border-destructive ring-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showValidation && !selectedType && !selectedOngoingTask && (
                  <p className="text-xs text-destructive">Type is required</p>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments" className="text-sm font-medium">Comments</Label>
              <Textarea
                id="comments"
                placeholder="What are you working on?"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="resize-none"
                rows={2}
                disabled={isRunning}
              />
            </div>
          </div>

          {/* Recent Sessions */}
          {todaysPomodoroEntries.length > 0 && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Sessions (Today)
              </h3>
              <div className="space-y-2">
                {todaysPomodoroEntries.map((entry) => (
                  <div 
                    key={entry.id}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 py-2 px-3 bg-muted/50 rounded-lg text-sm"
                  >
                    <Badge variant={entry.pomodoros > 0 ? 'default' : 'outline'} className="w-8 justify-center">
                      {entry.pomodoros}
                    </Badge>
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                      <span className="font-medium truncate">{entry.workArea}</span>
                      <span className="text-muted-foreground shrink-0">•</span>
                      <span className="text-muted-foreground truncate">{entry.workType}</span>
                    </div>
                    <span className="text-muted-foreground text-right whitespace-nowrap">{entry.duration} min</span>
                    <span className="text-muted-foreground text-right whitespace-nowrap w-14">{entry.startTime?.split(' ')[1] || entry.startTime}</span>
                    {!entry.endTime && (
                      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 text-xs">
                        Ongoing
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
