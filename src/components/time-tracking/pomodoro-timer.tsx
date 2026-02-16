'use client'

import { useEffect, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw, Square, Clock, Link, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useConfigStore } from '@/store/config-store'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { usePomodoroStore, type TimerMode } from '@/store/pomodoro-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { TimeEntry } from '@/types/time-tracking'

// Helper to get today's date in local YYYY-MM-DD format
function getTodayISO(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper to format datetime as YYYY-MM-DD HH:mm (local time, not UTC)
function formatDateTimeISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

interface PomodoroTimerProps {
  selectedOngoingTask?: TimeEntry | null
}

export function PomodoroTimer({ selectedOngoingTask }: PomodoroTimerProps) {
  // Global pomodoro store
  const {
    mode,
    timeLeft,
    isRunning,
    selectedArea,
    selectedType,
    comments,
    completedPomodoros,
    linkedTaskId,
    config,
    start,
    pause,
    resume,
    reset,
    stop,
    tick,
    setMode,
    setSelectedArea,
    setSelectedType,
    setComments,
    setLinkedTaskId,
    setTimerVisible,
    updateConfig,
    incrementCompletedPomodoros,
    getInitialTime,
  } = usePomodoroStore()
  
  const { workAreas, workTypes } = useConfigStore()
  const { entries, addEntry, addPomodoroSession, incrementEntryPomodoros } = useTimeTrackingStore()
  
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Get today's entries (includes both full pomodoros and partial sessions)
  const todaysPomodoroEntries = entries.filter(
    (entry) => entry.date === getTodayISO()
  ).slice(0, 5) // Show max 5 recent entries

  // Check if form is valid (Area + Type required, OR ongoing task selected)
  const isFormValid = selectedOngoingTask || (selectedArea !== '' && selectedType !== '')

  // Sync linked task with store
  useEffect(() => {
    setLinkedTaskId(selectedOngoingTask?.id ?? null)
  }, [selectedOngoingTask, setLinkedTaskId])

  // Track timer visibility for the banner
  useEffect(() => {
    setTimerVisible(true)
    return () => setTimerVisible(false)
  }, [setTimerVisible])

  // Initialize audio on mount
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQMWaJu5t4uNOz4xf6baxNJrIS0wapW3t7ShdlM2Pmp5n7K0q5ZfNzNBYHKLl5iMbkkzMD5aboGLi4N0XEQ4OkpbbH6FhX5xYU9CR09cbXmAgoB5bGBVSk5WYm1zeHl4dG5oYltYWl9kaGxub29ta2hmZGNiY2VnaWpqa2ppaGdmZWRjY2NjY2NjY2NjY2JiYWFgYF9fX19eXl5eXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1d')
  }, [])

  // Ref for handleTimerComplete – initialized after declaration below
  const handleTimerCompleteRef = useRef<(() => void) | null>(null)

  // Save completed pomodoro to time entries or as a pomodoro session
  const saveCompletedPomodoro = useCallback(async (actualDurationMinutes?: number) => {
    if (mode !== 'pomodoro') return // Don't save breaks
    
    const now = new Date()
    const durationMinutes = actualDurationMinutes ?? config.pomodoro
    const startTime = new Date(now.getTime() - durationMinutes * 60 * 1000)
    const isFullPomodoro = actualDurationMinutes === undefined
    
    // Don't save if duration is negligible (under 3 seconds)
    if (durationMinutes < 0.05) {
      toast.info('Session too short', {
        description: 'Sessions under a few seconds are not saved.',
      })
      return
    }
    
    // Get current values for saving
    const areaToSave = selectedOngoingTask?.workArea ?? selectedArea
    const typeToSave = selectedOngoingTask?.workType ?? selectedType
    
    try {
      // If associated with an ongoing task, create a pomodoro session instead
      if (selectedOngoingTask) {
        // Create pomodoro session linked to the ongoing task
        await addPomodoroSession({
          timeEntryId: selectedOngoingTask.id,
          startTime: formatDateTimeISO(startTime),
          endTime: formatDateTimeISO(now),
          duration: Math.max(1, Math.round(durationMinutes)),
          comments: comments || null,
          isFullPomodoro,
        })
        
        // Increment pomodoro count on the parent entry (only for full pomodoros)
        if (isFullPomodoro) {
          await incrementEntryPomodoros(selectedOngoingTask.id)
        }
        
        toast.success(isFullPomodoro ? 'Pomodoro added to task!' : 'Partial session saved!', {
          description: `${Math.max(1, Math.round(durationMinutes))} min added to ${selectedOngoingTask.workArea}`,
        })
      } else {
        // Create independent time entry (original behavior)
        await addEntry({
          startTime: formatDateTimeISO(startTime),
          endTime: formatDateTimeISO(now),
          workArea: areaToSave,
          workType: typeToSave,
          pomodoros: isFullPomodoro ? 1 : 0,
          comments: comments,
          date: getTodayISO(),
          duration: Math.max(1, Math.round(durationMinutes)),
          userId: '', // Will be set by the store/supabase
        })
        
        toast.success(isFullPomodoro ? 'Pomodoro completed!' : 'Partial session saved!', {
          description: `${Math.round(durationMinutes)} min • ${areaToSave} • ${typeToSave}`,
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
    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Audio play failed, likely due to autoplay restrictions
      })
    }

    // Save entry if it was a pomodoro (not a break)
    if (mode === 'pomodoro') {
      incrementCompletedPomodoros()
      await saveCompletedPomodoro()
      
      // Check if it's time for a long break
      const newCount = completedPomodoros + 1
      if (newCount % config.longBreakInterval === 0) {
        setMode('longBreak')
      } else {
        setMode('shortBreak')
      }
    } else {
      // After any break, go back to pomodoro
      setMode('pomodoro')
    }
  }, [mode, completedPomodoros, config, saveCompletedPomodoro, incrementCompletedPomodoros, setMode])

  // Keep ref in sync so the completion effect always calls the latest version
  useEffect(() => {
    handleTimerCompleteRef.current = handleTimerComplete
  })

  // Timer countdown – only ticks, does NOT handle completion
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const timerId = setTimeout(() => tick(), 1000)
      return () => clearTimeout(timerId)
    }
  }, [isRunning, timeLeft, tick])

  // Detect timer completion via state change
  // (React 18 + useSyncExternalStore can interrupt interval callbacks,
  //  so we detect completion through a reactive effect instead.)
  const prevTimeLeftRef = useRef(timeLeft)
  useEffect(() => {
    if (prevTimeLeftRef.current > 0 && timeLeft === 0 && !isRunning) {
      handleTimerCompleteRef.current?.()
    }
    prevTimeLeftRef.current = timeLeft
  }, [timeLeft, isRunning])

  const handleStart = () => {
    if (!isFormValid) {
      toast.error('Please select Area and Type', {
        description: 'Both fields are required to start the timer (or select an ongoing task).',
      })
      return
    }
    
    start()
  }

  const handlePause = () => {
    pause()
  }

  const handleResume = () => {
    resume()
  }

  const handleReset = () => {
    reset()
  }

  const handleStop = async () => {
    // Get elapsed time before stopping
    const { elapsedMinutes } = stop()
    
    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Audio play failed, likely due to autoplay restrictions
      })
    }
    
    if (mode === 'pomodoro') {
      // Save the partial session with actual duration
      await saveCompletedPomodoro(elapsedMinutes)
    }
  }

  const handleModeChange = (newMode: string) => {
    if (isRunning) {
      // Don't allow mode change while running
      return
    }
    setMode(newMode as TimerMode)
  }

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate progress percentage
  const initialTime = getInitialTime(mode)
  const progress = ((initialTime - timeLeft) / initialTime) * 100

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
          {/* Settings button - top right */}
          <div className="flex justify-end mb-2 -mt-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  disabled={isRunning}
                  title="Timer settings"
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Timer Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">Pomodoro</Label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={0.1}
                          max={120}
                          step={0.1}
                          value={config.pomodoro}
                          onChange={(e) => updateConfig({ pomodoro: Math.max(0.1, Math.min(120, Number(e.target.value) || 0.1)) })}
                          className="w-16 h-8 text-center text-sm"
                        />
                        <span className="text-xs text-muted-foreground">min</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">Short Break</Label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={0.1}
                          max={60}
                          step={0.1}
                          value={config.shortBreak}
                          onChange={(e) => updateConfig({ shortBreak: Math.max(0.1, Math.min(60, Number(e.target.value) || 0.1)) })}
                          className="w-16 h-8 text-center text-sm"
                        />
                        <span className="text-xs text-muted-foreground">min</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">Long Break</Label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={0.1}
                          max={60}
                          step={0.1}
                          value={config.longBreak}
                          onChange={(e) => updateConfig({ longBreak: Math.max(0.1, Math.min(60, Number(e.target.value) || 0.1)) })}
                          className="w-16 h-8 text-center text-sm"
                        />
                        <span className="text-xs text-muted-foreground">min</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">Long Break After</Label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          value={config.longBreakInterval}
                          onChange={(e) => updateConfig({ longBreakInterval: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })}
                          className="w-16 h-8 text-center text-sm"
                        />
                        <span className="text-xs text-muted-foreground">🍅</span>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

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
                  disabled={timeLeft === initialTime}
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  onClick={timeLeft < initialTime ? handleResume : handleStart}
                  className="h-16 px-12 text-xl font-bold shadow-lg"
                >
                  <Play className="w-6 h-6 mr-2" />
                  {timeLeft < initialTime ? 'RESUME' : 'START'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStop}
                  className="h-14 px-6"
                  disabled={timeLeft === initialTime}
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
                      selectedOngoingTask && "opacity-60"
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
                      selectedOngoingTask && "opacity-60"
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
