'use client'

import { useState } from 'react'
import { Pause, Square, Play, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function TimerPage() {
  const [isRunning, setIsRunning] = useState(true)
  const [selectedTask, setSelectedTask] = useState('')

  // Mock data
  const currentTask = 'Website Redesign - Homepage Layout'
  const currentTime = '02:34:18'
  
  const todayStats = [
    { label: 'Total Time', value: '5h 32m' },
    { label: 'Billable', value: '4h 15m' },
    { label: 'Tasks', value: '8' },
    { label: 'Projects', value: '3' },
  ]

  const recentEntries = [
    { name: 'Design mockups review', project: 'Project Alpha', time: '2h 15m' },
    { name: 'Client call', project: 'Project Beta', time: '1h 30m' },
    { name: 'Documentation', project: 'Project Alpha', time: '45m' },
  ]

  const quickStartTasks = [
    { name: 'Code Implementation', project: 'Project Gamma' },
    { name: 'Team Standup', project: 'Internal' },
    { name: 'Bug Fixes', project: 'Project Delta' },
    { name: 'Research & Planning', project: 'Project Epsilon' },
  ]

  const availableTasks = [
    'Client Meeting Prep',
    'Code Review - Feature X',
    'Documentation Update',
  ]

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b-2 border-foreground bg-background px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Active Timer</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">John Doe</span>
            <Avatar className="size-10 border-2 border-foreground">
              <AvatarFallback className="bg-muted text-sm font-semibold">JD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex-1 p-8">
        {/* Timer Hero Section */}
        <Card className="mb-8 border-4 border-foreground shadow-none rounded-sm">
          <CardContent className="p-8 text-center">
            <div className="mb-4 font-mono text-5xl font-bold tracking-widest">
              {currentTime}
            </div>
            
            <div className="mb-6 border-2 border-dashed border-muted-foreground/50 bg-muted/50 p-3 text-lg">
              Working on: {currentTask}
            </div>
            
            <div className="mb-6 flex justify-center gap-4">
              <Button 
                size="lg"
                className="min-w-[120px] border-2 border-foreground bg-success text-success-foreground shadow-none hover:bg-success/90 rounded-sm font-semibold"
                onClick={() => setIsRunning(!isRunning)}
              >
                <Pause className="mr-2 size-4" />
                Pause
              </Button>
              <Button 
                size="lg"
                variant="destructive"
                className="min-w-[120px] border-2 border-foreground shadow-none rounded-sm font-semibold"
              >
                <Square className="mr-2 size-4" />
                Stop
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <label className="text-sm font-medium">Switch to:</label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger className="w-[280px] border-2 border-foreground shadow-none rounded-sm">
                  <SelectValue placeholder="Select a different task..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks.map((task) => (
                    <SelectItem key={task} value={task}>
                      {task}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                className="border-2 border-foreground bg-background text-foreground shadow-none hover:bg-muted rounded-sm"
                disabled={!selectedTask}
              >
                Switch
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Today's Summary */}
          <Card className="border-2 border-foreground shadow-none rounded-sm">
            <CardContent className="p-6">
              <h2 className="mb-6 border-b-2 border-foreground pb-3 text-xl font-bold">
                Today&apos;s Summary
              </h2>
              
              {/* Mini Stats */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                {todayStats.map((stat) => (
                  <div 
                    key={stat.label}
                    className="border-2 border-muted-foreground/50 p-4 text-center"
                  >
                    <div className="mb-1 text-xs text-muted-foreground">
                      {stat.label}
                    </div>
                    <div className="text-2xl font-bold">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
              
              <h3 className="mb-3 text-base font-semibold">Recent Entries</h3>
              
              <div className="space-y-3">
                {recentEntries.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-2 border-muted-foreground/50 p-4 hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{entry.name}</div>
                      <div className="text-xs text-muted-foreground">{entry.project}</div>
                    </div>
                    <div className="mr-3 font-bold">{entry.time}</div>
                    <button className="border-2 border-foreground bg-background p-2 hover:bg-muted">
                      <MoreVertical className="size-5" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Start Tasks */}
          <Card className="border-2 border-foreground shadow-none rounded-sm">
            <CardContent className="p-6">
              <h2 className="mb-6 border-b-2 border-foreground pb-3 text-xl font-bold">
                Quick Start Tasks
              </h2>
              
              <p className="mb-6 text-sm text-muted-foreground">
                Click to start tracking time on any task
              </p>
              
              <div className="space-y-4">
                {quickStartTasks.map((task, index) => (
                  <button
                    key={index}
                    className="w-full border-2 border-foreground bg-background p-4 text-left hover:bg-muted"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-block size-5 border border-foreground bg-muted" />
                      <div>
                        <div className="font-semibold">{task.name}</div>
                        <div className="text-xs text-muted-foreground">{task.project}</div>
                      </div>
                    </div>
                  </button>
                ))}
                
                <Button 
                  className="mt-6 w-full border-2 border-foreground bg-success text-success-foreground shadow-none hover:bg-success/90 rounded-sm font-semibold"
                >
                  + Create New Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}