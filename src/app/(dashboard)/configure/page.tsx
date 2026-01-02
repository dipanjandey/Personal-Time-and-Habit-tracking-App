'use client'

import { useEffect } from 'react'
import { EditableList } from '@/components/config/editable-list'
import { useConfigStore } from '@/store/config-store'
import { Skeleton } from '@/components/ui/skeleton'

export default function ConfigurePage() {
  const {
    workAreas,
    workTypes,
    isLoading,
    loadWorkAreas,
    loadWorkTypes,
    addWorkArea,
    editWorkArea,
    removeWorkArea,
    reorderWorkAreasList,
    addWorkType,
    editWorkType,
    removeWorkType,
    reorderWorkTypesList,
  } = useConfigStore()

  useEffect(() => {
    loadWorkAreas()
    loadWorkTypes()
  }, [loadWorkAreas, loadWorkTypes])

  if (isLoading && workAreas.length === 0 && workTypes.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Configure</h1>
        <p className="text-muted-foreground mb-8">
          Manage your work areas and work types here.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 pb-4 border-b">
        <h1 className="text-3xl font-bold mb-2">Configure</h1>
        <p className="text-muted-foreground">
          Manage your work areas and work types here.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EditableList
          title="Work Areas"
          description="Define the different areas of work you track time for"
          items={workAreas}
          onAdd={addWorkArea}
          onEdit={editWorkArea}
          onDelete={removeWorkArea}
          onReorder={reorderWorkAreasList}
        />

        <EditableList
          title="Work Types"
          description="Define the types of work activities you perform"
          items={workTypes}
          onAdd={addWorkType}
          onEdit={editWorkType}
          onDelete={removeWorkType}
          onReorder={reorderWorkTypesList}
        />
      </div>
    </div>
  )
}