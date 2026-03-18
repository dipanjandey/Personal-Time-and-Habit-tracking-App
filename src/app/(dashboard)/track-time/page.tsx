'use client'

import { useEffect, useState } from 'react'
import { QuickEntryBar } from '@/components/time-tracking/quick-entry-bar'
import { SummaryCards } from '@/components/time-tracking/summary-cards'
import { TimeEntriesTable } from '@/components/time-tracking/time-entries-table'
import { BulkUploadDialog } from '@/components/time-tracking/bulk-upload-dialog'
import { PomodoroTimer } from '@/components/time-tracking/pomodoro-timer'
import { OngoingTaskCard } from '@/components/time-tracking/ongoing-task-card'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { useConfigStore } from '@/store/config-store'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Download, Upload, Timer, ListTodo } from 'lucide-react'
import { exportToCSV } from '@/lib/export-utils'
import type { TimeEntry } from '@/types/time-tracking'

export default function TrackTimePage() {
  const { entries, loadEntries, initializeRealtimeSubscription, getOngoingTasks, completeTask } = useTimeTrackingStore()
  const { loadWorkAreas, loadWorkTypes } = useConfigStore()
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('entries')
  const [selectedOngoingTask, setSelectedOngoingTask] = useState<TimeEntry | null>(null)
  
  // Get ongoing tasks
  const ongoingTasks = getOngoingTasks()

  useEffect(() => {
    // Load initial data (user is already authenticated via middleware)
    loadEntries()
    loadWorkAreas()
    loadWorkTypes()

    // Set up real-time subscription
    const unsubscribe = initializeRealtimeSubscription()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [loadEntries, loadWorkAreas, loadWorkTypes, initializeRealtimeSubscription])

  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div>
      {/* Dramatic page header */}
      <div className="px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-5 border-b-2 border-primary">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary mb-1.5">
              {dateLabel}
            </p>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold uppercase tracking-tight leading-[0.9] text-foreground">
              Time Tracking
            </h1>
          </div>
          <div className="flex gap-2 pb-1">
            <Button variant="outline" size="sm" onClick={() => setBulkUploadOpen(true)}>
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">Bulk Upload</span>
              <span className="sm:hidden">Upload</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportToCSV(entries)}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 pt-6">

      {/* Main Tabs: Add an Entry, Pomodoro */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="h-11">
          <TabsTrigger value="entries" className="gap-2 px-4">
            <ListTodo className="w-4 h-4" />
            <span className="hidden sm:inline">Add Entry</span>
            <span className="sm:hidden">Add</span>
          </TabsTrigger>
          <TabsTrigger value="pomodoro" className="gap-2 px-4 text-[#95ACA6]">
            <Timer className="w-4 h-4" />
            Pomodoro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-6">
          {/* Ongoing Tasks Section */}
          {ongoingTasks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live · {ongoingTasks.length} task{ongoingTasks.length !== 1 ? 's' : ''}
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {ongoingTasks.map((task) => (
                  <OngoingTaskCard
                    key={task.id}
                    task={task}
                    onComplete={completeTask}
                  />
                ))}
              </div>
            </div>
          )}
          
          <QuickEntryBar />
          <SummaryCards />
          {/* Show only last 10 entries in compact mode */}
          <TimeEntriesTable limit={10} showFilters={false} compact />
        </TabsContent>

        <TabsContent value="pomodoro" className="space-y-6">
          {/* Ongoing Tasks for Association */}
          {ongoingTasks.length > 0 && (
            <div className="max-w-2xl mx-auto mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Associate with ongoing task (optional)
              </h3>
              <div className="space-y-2">
                {ongoingTasks.map((task) => (
                  <OngoingTaskCard
                    key={task.id}
                    task={task}
                    onComplete={completeTask}
                    isSelected={selectedOngoingTask?.id === task.id}
                    onSelect={(id) => {
                      if (selectedOngoingTask?.id === id) {
                        setSelectedOngoingTask(null)
                      } else {
                        const selected = ongoingTasks.find(t => t.id === id)
                        setSelectedOngoingTask(selected || null)
                      }
                    }}
                    compact
                  />
                ))}
              </div>
              {selectedOngoingTask && (
                <p className="text-xs text-muted-foreground mt-2">
                  ✓ Pomodoros will be added to: <strong>{selectedOngoingTask.workArea}</strong> • {selectedOngoingTask.workType}
                </p>
              )}
            </div>
          )}
          
          <div className="max-w-2xl mx-auto">
            <PomodoroTimer selectedOngoingTask={selectedOngoingTask} />
          </div>
          
          {/* Show summary below the timer */}
          <div className="mt-8">
            <SummaryCards />
          </div>
        </TabsContent>
      </Tabs>

      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
      />
      </div>
    </div>
  )
}
