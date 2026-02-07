'use client'

import { useEffect, useState } from 'react'
import { QuickEntryBar } from '@/components/time-tracking/quick-entry-bar'
import { SummaryCards } from '@/components/time-tracking/summary-cards'
import { TimeEntriesTable } from '@/components/time-tracking/time-entries-table'
import { BulkUploadDialog } from '@/components/time-tracking/bulk-upload-dialog'
import { PomodoroTimer } from '@/components/time-tracking/pomodoro-timer'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { useConfigStore } from '@/store/config-store'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Download, Upload, Timer, ListTodo } from 'lucide-react'

export default function TrackTimePage() {
  const { loadEntries, initializeRealtimeSubscription } = useTimeTrackingStore()
  const { loadWorkAreas, loadWorkTypes } = useConfigStore()
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('entries')

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

  return (
    <div className="p-4 md:p-6 lg:p-8 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8 pb-4 border-b">
        <h1 className="text-3xl font-bold">Track Time</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setBulkUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Tabs: Add an Entry, Pomodoro */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="h-11">
          <TabsTrigger value="entries" className="gap-2 px-4">
            <ListTodo className="w-4 h-4" />
            <span className="hidden sm:inline">Add Entry</span>
            <span className="sm:hidden">Add</span>
          </TabsTrigger>
          <TabsTrigger value="pomodoro" className="gap-2 px-4">
            <Timer className="w-4 h-4" />
            Pomodoro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-6">
          <QuickEntryBar />
          <SummaryCards />
          {/* Show only last 10 entries in compact mode */}
          <TimeEntriesTable limit={10} showFilters={false} compact />
        </TabsContent>

        <TabsContent value="pomodoro" className="space-y-6">
          <div className="max-w-2xl mx-auto">
            <PomodoroTimer />
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
  )
}
