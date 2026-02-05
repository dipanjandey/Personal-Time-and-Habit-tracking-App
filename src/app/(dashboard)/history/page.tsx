'use client'

import { useEffect } from 'react'
import { TimeEntriesTable } from '@/components/time-tracking/time-entries-table'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { useConfigStore } from '@/store/config-store'

export default function HistoryPage() {
  const { loadEntries, initializeRealtimeSubscription } = useTimeTrackingStore()
  const { loadWorkAreas, loadWorkTypes } = useConfigStore()

  useEffect(() => {
    // Load initial data
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
        <h1 className="text-3xl font-bold">History</h1>
      </div>

      {/* Full table with search, filter, and pagination */}
      <TimeEntriesTable showFilters showPagination />
    </div>
  )
}
