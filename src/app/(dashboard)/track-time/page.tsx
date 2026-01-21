'use client'

import { useEffect, useState } from 'react'
import { QuickEntryBar } from '@/components/time-tracking/quick-entry-bar'
import { SummaryCards } from '@/components/time-tracking/summary-cards'
import { TimeEntriesTable } from '@/components/time-tracking/time-entries-table'
import { BulkUploadDialog } from '@/components/time-tracking/bulk-upload-dialog'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { useConfigStore } from '@/store/config-store'
import { Button } from '@/components/ui/button'
import { Download, Upload } from 'lucide-react'

export default function TrackTimePage() {
  const { loadEntries, initializeRealtimeSubscription } = useTimeTrackingStore()
  const { loadWorkAreas, loadWorkTypes } = useConfigStore()
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
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

      <QuickEntryBar />
      <SummaryCards />
      <TimeEntriesTable />

      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
      />
    </div>
  )
}