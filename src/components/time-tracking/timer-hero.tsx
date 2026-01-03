'use client'

import { useState } from 'react'
import { Pause, SquareStop, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

interface TimerHeroProps {
  currentTime?: string
  currentTask?: string
  isRunning?: boolean
  onPause?: () => void
  onStop?: () => void
  onStart?: () => void
  onSwitchTask?: (taskId: string) => void
  availableTasks?: Array<{ id: string; name: string }>
}

export function TimerHero({
  currentTime = '00:00:00',
  currentTask = 'No task selected',
  isRunning = false,
  onPause,
  onStop,
  onStart,
  onSwitchTask,
  availableTasks = [],
}: TimerHeroProps) {
  const [selectedTask, setSelectedTask] = useState<string>('')

  const handleSwitch = () => {
    if (selectedTask && onSwitchTask) {
      onSwitchTask(selectedTask)
      setSelectedTask('')
    }
  }

  return (
    <Card className="mb-8 border-4">
      <CardContent className="p-8 text-center">
        <div className="text-5xl font-bold mb-4 tracking-wider font-mono">
          {currentTime}
        </div>
        
        <div className="text-lg mb-6 p-3 border-2 border-dashed bg-muted/50 rounded">
          Working on: {currentTask}
        </div>
        
        <div className="flex gap-4 justify-center mb-6">
          {isRunning ? (
            <>
              <Button
                size="lg"
                variant="default"
                className="min-w-32 font-bold"
                onClick={onPause}
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
              <Button
                size="lg"
                variant="destructive"
                className="min-w-32 font-bold"
                onClick={onStop}
              >
                <SquareStop className="w-5 h-5 mr-2" />
                Stop
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              variant="default"
              className="min-w-32 font-bold"
              onClick={onStart}
            >
              <Play className="w-5 h-5 mr-2" />
              Start
            </Button>
          )}
        </div>
        
        <div className="flex gap-4 items-center justify-center">
          <label className="text-sm font-medium">Switch to:</label>
          <Select value={selectedTask} onValueChange={setSelectedTask}>
            <SelectTrigger className="w-72 border-2">
              <SelectValue placeholder="Select a different task..." />
            </SelectTrigger>
            <SelectContent>
              {availableTasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSwitch} disabled={!selectedTask}>
            Switch
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}