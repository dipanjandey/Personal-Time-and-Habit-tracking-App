'use client'

import { useState } from 'react'
import { TimerHero } from '@/components/time-tracking/timer-hero'
import { MiniStatCard } from '@/components/time-tracking/mini-stat-card'
import { RecentTaskItem } from '@/components/time-tracking/recent-task-item'
import { QuickStartTask } from '@/components/time-tracking/quick-start-task'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

// Mock data
const availableTasks = [
  { id: '1', name: 'Client Meeting Prep' },
  { id: '2', name: 'Code Review - Feature X' },
  { id: '3', name: 'Documentation Update' },
]

const recentEntries = [
  { taskName: 'Design mockups review', projectName: 'Project Alpha', duration: '2h 15m' },
  { taskName: 'Client call', projectName: 'Project Beta', duration: '1h 30m' },
  { taskName: 'Documentation', projectName: 'Project Alpha', duration: '45m' },
]

const quickStartTasks = [
  { taskName: 'Code Implementation', projectName: 'Project Gamma' },
  { taskName: 'Team Standup', projectName: 'Internal' },
  { taskName: 'Bug Fixes', projectName: 'Project Delta' },
  { taskName: 'Research & Planning', projectName: 'Project Epsilon' },
]

export default function TimeTrackingPage() {
  const [isRunning, setIsRunning] = useState(true)
  const [currentTime] = useState('02:34:18')
  const [currentTask] = useState('Website Redesign - Homepage Layout')

  const handlePause = () => {
    setIsRunning(false)
    console.log('Timer paused')
  }

  const handleStop = () => {
    setIsRunning(false)
    console.log('Timer stopped')
  }

  const handleStart = () => {
    setIsRunning(true)
    console.log('Timer started')
  }

  const handleSwitchTask = (taskId: string) => {
    console.log('Switching to task:', taskId)
  }

  const handleQuickStart = (taskName: string) => {
    console.log('Quick starting task:', taskName)
  }

  return (
    <div className="p-8">
      <div className="mb-8 pb-4 border-b-2">
        <h1 className="text-3xl font-bold">Active Timer</h1>
      </div>

      <TimerHero
        currentTime={currentTime}
        currentTask={currentTask}
        isRunning={isRunning}
        onPause={handlePause}
        onStop={handleStop}
        onStart={handleStart}
        onSwitchTask={handleSwitchTask}
        availableTasks={availableTasks}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Summary Panel */}
        <Card className="border-2">
          <CardHeader className="pb-4 border-b-2">
            <CardTitle className="text-xl">Today&apos;s Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <MiniStatCard label="Total Time" value="5h 32m" />
              <MiniStatCard label="Billable" value="4h 15m" />
              <MiniStatCard label="Tasks" value="8" />
              <MiniStatCard label="Projects" value="3" />
            </div>

            <h3 className="font-semibold text-base mb-3">Recent Entries</h3>
            
            {recentEntries.map((entry, index) => (
              <RecentTaskItem
                key={index}
                taskName={entry.taskName}
                projectName={entry.projectName}
                duration={entry.duration}
                onMoreClick={() => console.log('More clicked for:', entry.taskName)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Quick Start Tasks Panel */}
        <Card className="border-2">
          <CardHeader className="pb-4 border-b-2">
            <CardTitle className="text-xl">Quick Start Tasks</CardTitle>
            <CardDescription>
              Click to start tracking time on any task
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {quickStartTasks.map((task, index) => (
              <QuickStartTask
                key={index}
                taskName={task.taskName}
                projectName={task.projectName}
                onClick={() => handleQuickStart(task.taskName)}
              />
            ))}

            <Button className="w-full mt-5 font-bold" variant="default">
              <Plus className="w-4 h-4 mr-2" />
              Create New Task
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}