'use client'

import { useEffect } from 'react'
import { EditableList } from '@/components/config/editable-list'
import { useConfigStore } from '@/store/config-store'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PRIORITY_OPTIONS } from '@/types/time-tracking'

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

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Priority Levels</CardTitle>
            <CardDescription>
              Fixed priority categories based on the Eisenhower Matrix. These cannot be edited.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRIORITY_OPTIONS.map((priority) => {
                const isStrategic = priority.startsWith('Strategic')
                const isUrgent = priority.includes('Urgent') && !priority.includes('Not')
                return (
                  <div
                    key={priority}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      isStrategic && isUrgent ? 'bg-red-500' :
                      isStrategic && !isUrgent ? 'bg-blue-500' :
                      !isStrategic && isUrgent ? 'bg-amber-500' :
                      'bg-green-500'
                    }`} />
                    <span className="text-sm font-medium">{priority}</span>
                    <div className="ml-auto flex gap-1.5">
                      <Badge variant="outline" className="text-xs">
                        {isStrategic ? 'Strategic' : 'Tactical'}
                      </Badge>
                      <Badge variant={isUrgent ? 'destructive' : 'secondary'} className="text-xs">
                        {isUrgent ? 'Urgent' : 'Not Urgent'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}