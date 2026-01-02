'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { calculateDuration, formatDuration } from '@/lib/time-utils'
import type { TimeEntry } from '@/types/time-tracking'

const workAreas = [
  'Product - testing & usage',
  'Product - spec, design & research',
  'Product - project management',
  'GTM - demos & reachouts',
  'GTM - research & planning',
  'GTM - marketing',
  'Coding',
]

const workTypes = [
  'Self work - w Pomodoro',
  'Self work',
  'Meetings - Internal',
  'Meetings - External',
  'Multiple work types',
]

// Editable cell component for text inputs
function EditableTextCell({
  value,
  onChange,
  onSave,
  onCancel,
  type = 'text',
  className = '',
}: {
  value: string | number
  onChange: (value: string | number) => void
  onSave: () => void
  onCancel: () => void
  type?: 'text' | 'time' | 'number'
  className?: string
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      onBlur={onSave}
      onKeyDown={handleKeyDown}
      className={`w-full focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
      onClick={(e) => e.stopPropagation()}
      autoFocus
    />
  )
}

// Editable cell component for dropdowns
function EditableSelectCell({
  value,
  onChange,
  options,
  onSave,
  onCancel,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  onSave: (newValue: string) => void
  onCancel: () => void
}) {
  const handleValueChange = (newValue: string) => {
    onChange(newValue)
    // Pass the new value directly to onSave to avoid async state issues
    setTimeout(() => onSave(newValue), 50)
  }

  const handleEscapeKeyDown = (e: Event) => {
    e.preventDefault()
    onCancel()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onCancel()
    }
  }

  return (
    <Select
      value={value}
      onValueChange={handleValueChange}
    >
      <SelectTrigger
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="w-full focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent 
        onEscapeKeyDown={handleEscapeKeyDown}
        onPointerDownOutside={onCancel}
      >
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function TimeEntriesTable() {
  const {
    entries,
    updateEntry,
    deleteEntry,
    searchQuery,
    setSearchQuery,
    selectedWorkArea,
    setSelectedWorkArea,
    selectedWorkType,
    setSelectedWorkType,
    isSearchOpen,
    toggleSearch,
    clearFilters,
  } = useTimeTrackingStore()

  const [timeRange, setTimeRange] = useState('today')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null)
  const [editingValue, setEditingValue] = useState<any>(null)

  // Column helper
  const columnHelper = createColumnHelper<TimeEntry>()

  const handleStartEdit = (rowId: string, columnId: string, value: any) => {
    setEditingCell({ rowId, columnId })
    setEditingValue(value)
  }

  const handleSaveEdit = (rowId: string, columnId: string, valueToSave?: any) => {
    // Use provided value or fall back to editingValue
    const finalValue = valueToSave !== undefined ? valueToSave : editingValue
    
    if (finalValue !== null && finalValue !== undefined) {
      const updates: Partial<TimeEntry> = { [columnId]: finalValue }

      // Recalculate duration if start or end time changes
      const entry = entries.find((e) => e.id === rowId)
      if (entry && (columnId === 'startTime' || columnId === 'endTime')) {
        const newStartTime = columnId === 'startTime' ? finalValue : entry.startTime
        const newEndTime = columnId === 'endTime' ? finalValue : entry.endTime

        if (newStartTime && newEndTime) {
          updates.duration = calculateDuration(newStartTime, newEndTime)
        }
      }

      updateEntry(rowId, updates)
    }
    setEditingCell(null)
    setEditingValue(null)
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditingValue(null)
  }

  const isEditing = (rowId: string, columnId: string) => {
    return editingCell?.rowId === rowId && editingCell?.columnId === columnId
  }

  // Handle clicking outside to exit edit mode for text inputs only
  // Dropdowns handle their own outside clicks via onPointerDownOutside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingCell) {
        const target = event.target as HTMLElement
        // Only handle outside clicks for non-dropdown cells
        const isInsideTable = target.closest('td')
        const isInsideDropdown = target.closest('[role="listbox"]') || target.closest('[data-radix-select-content]')
        const isDropdownTrigger = target.closest('button[role="combobox"]')
        
        if (!isInsideTable && !isInsideDropdown && !isDropdownTrigger) {
          // Check if current editing cell has a dropdown
          const hasDropdown = editingCell.columnId === 'workArea' || editingCell.columnId === 'workType'
          if (!hasDropdown) {
            handleSaveEdit(editingCell.rowId, editingCell.columnId)
          }
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [editingCell])

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('startTime', {
        header: 'Start',
        size: 100,
        cell: ({ row, getValue }) => {
          const value = getValue()
          const isEditingCell = isEditing(row.original.id, 'startTime')

          if (isEditingCell) {
            return (
              <EditableTextCell
                value={editingValue ?? value}
                onChange={setEditingValue}
                onSave={() => handleSaveEdit(row.original.id, 'startTime')}
                onCancel={handleCancelEdit}
                type="time"
              />
            )
          }

          return (
            <div
              onClick={() => handleStartEdit(row.original.id, 'startTime', value)}
              className="cursor-pointer font-semibold"
            >
              {value}
            </div>
          )
        },
      }),
      columnHelper.accessor('endTime', {
        header: 'End',
        size: 100,
        cell: ({ row, getValue }) => {
          const value = getValue()
          const isEditingCell = isEditing(row.original.id, 'endTime')

          if (isEditingCell) {
            return (
              <EditableTextCell
                value={editingValue ?? value}
                onChange={setEditingValue}
                onSave={() => handleSaveEdit(row.original.id, 'endTime')}
                onCancel={handleCancelEdit}
                type="time"
              />
            )
          }

          return (
            <div
              onClick={() => handleStartEdit(row.original.id, 'endTime', value)}
              className="cursor-pointer font-semibold"
            >
              {value}
            </div>
          )
        },
      }),
      columnHelper.accessor('workArea', {
        header: 'Work Area',
        size: 180,
        cell: ({ row, getValue }) => {
          const value = getValue()
          const isEditingCell = isEditing(row.original.id, 'workArea')

          if (isEditingCell) {
            return (
              <EditableSelectCell
                value={editingValue ?? value}
                onChange={setEditingValue}
                options={workAreas}
                onSave={(newValue) => handleSaveEdit(row.original.id, 'workArea', newValue)}
                onCancel={handleCancelEdit}
              />
            )
          }

          return (
            <div onClick={() => handleStartEdit(row.original.id, 'workArea', value)} className="cursor-pointer">
              <Badge variant="secondary">{value}</Badge>
            </div>
          )
        },
        filterFn: (row, id, value) => {
          if (!value || value === 'all') return true
          return row.getValue(id) === value
        },
      }),
      columnHelper.accessor('workType', {
        header: 'Work Type',
        size: 160,
        cell: ({ row, getValue }) => {
          const value = getValue()
          const isEditingCell = isEditing(row.original.id, 'workType')

          if (isEditingCell) {
            return (
              <EditableSelectCell
                value={editingValue ?? value}
                onChange={setEditingValue}
                options={workTypes}
                onSave={(newValue) => handleSaveEdit(row.original.id, 'workType', newValue)}
                onCancel={handleCancelEdit}
              />
            )
          }

          return (
            <div onClick={() => handleStartEdit(row.original.id, 'workType', value)} className="cursor-pointer">
              <Badge variant="outline">{value}</Badge>
            </div>
          )
        },
        filterFn: (row, id, value) => {
          if (!value || value === 'all') return true
          return row.getValue(id) === value
        },
      }),
      columnHelper.accessor('pomodoros', {
        header: '🍅',
        size: 80,
        cell: ({ row, getValue }) => {
          const value = getValue()
          const isEditingCell = isEditing(row.original.id, 'pomodoros')

          if (isEditingCell) {
            return (
              <EditableTextCell
                value={editingValue ?? value}
                onChange={setEditingValue}
                onSave={() => handleSaveEdit(row.original.id, 'pomodoros')}
                onCancel={handleCancelEdit}
                type="number"
                className="text-center"
              />
            )
          }

          return (
            <div
              onClick={() => handleStartEdit(row.original.id, 'pomodoros', value)}
              className="cursor-pointer text-center"
            >
              <Badge variant={value > 0 ? 'default' : 'outline'}>{value}</Badge>
            </div>
          )
        },
      }),
      columnHelper.accessor('comments', {
        header: 'Comments',
        cell: ({ row, getValue }) => {
          const value = getValue()
          const isEditingCell = isEditing(row.original.id, 'comments')

          if (isEditingCell) {
            return (
              <EditableTextCell
                value={editingValue ?? value}
                onChange={setEditingValue}
                onSave={() => handleSaveEdit(row.original.id, 'comments')}
                onCancel={handleCancelEdit}
              />
            )
          }

          return (
            <div onClick={() => handleStartEdit(row.original.id, 'comments', value)} className="cursor-pointer">
              <div className="text-sm">{value}</div>
            </div>
          )
        },
      }),
      columnHelper.accessor('duration', {
        header: 'Duration',
        size: 100,
        cell: ({ getValue }) => {
          return <span className="font-bold">{formatDuration(getValue())}</span>
        },
      }),
      columnHelper.display({
        id: 'actions',
        size: 60,
        cell: ({ row }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation()
                deleteEntry(row.original.id)
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )
        },
      }),
    ],
    [editingCell, editingValue]
  )

  // Global filter function for search
  const globalFilterFn = (row: any, columnId: string, filterValue: string) => {
    const entry = row.original as TimeEntry
    const searchLower = filterValue.toLowerCase()
    return (
      entry.workArea.toLowerCase().includes(searchLower) ||
      entry.workType.toLowerCase().includes(searchLower) ||
      entry.comments.toLowerCase().includes(searchLower)
    )
  }

  // Create table instance
  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn,
    state: {
      sorting,
      columnFilters,
      globalFilter: searchQuery,
    },
    onGlobalFilterChange: setSearchQuery,
  })

  // Apply filters
  useMemo(() => {
    const filters: ColumnFiltersState = []
    if (selectedWorkArea && selectedWorkArea !== 'all') {
      filters.push({ id: 'workArea', value: selectedWorkArea })
    }
    if (selectedWorkType && selectedWorkType !== 'all') {
      filters.push({ id: 'workType', value: selectedWorkType })
    }
    setColumnFilters(filters)
  }, [selectedWorkArea, selectedWorkType])

  const totalDuration = table.getFilteredRowModel().rows.reduce((sum, row) => sum + row.original.duration, 0)

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between pb-4 mb-5 border-b">
        <h2 className="text-2xl font-semibold">Recent Entries</h2>
        <div className="flex items-center gap-3">
          <Button
            variant={isSearchOpen ? 'default' : 'outline'}
            size="sm"
            onClick={toggleSearch}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            Search & Filter
          </Button>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">📅 Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Collapsible Search Bar */}
      {isSearchOpen && (
        <div className="flex gap-3 mb-5 p-4 bg-muted/50 rounded-md border animate-in slide-in-from-top-2">
          <Input
            placeholder="🔍 Search entries by work area, type, or comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />

          <Select value={selectedWorkArea || 'all'} onValueChange={setSelectedWorkArea}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Work Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Work Areas</SelectItem>
              {workAreas.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedWorkType || 'all'} onValueChange={setSelectedWorkType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Work Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Work Types</SelectItem>
              {workTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      )}

      {/* TanStack Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="text-left">
                {headerGroup.headers.map((header, index) => (
                  <th
                    key={header.id}
                    className={`px-4 py-3 bg-muted font-medium text-sm ${
                      index === 0 ? 'rounded-l-md' : ''
                    } ${index === headerGroup.headers.length - 1 ? 'rounded-r-md' : ''}`}
                    style={{ width: header.column.getSize() }}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="group transition-colors bg-background hover:bg-muted/50"
              >
                {row.getVisibleCells().map((cell, index) => (
                  <td
                    key={cell.id}
                    className={`px-4 py-4 border ${index === 0 ? 'rounded-l-md' : ''} ${
                      index === row.getVisibleCells().length - 1 ? 'rounded-r-md' : ''
                    }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-muted-foreground">
        <div>
          💡 <strong>Tip:</strong> Click any cell to edit. Press{' '}
          <kbd className="px-2 py-1 text-xs font-semibold bg-muted border rounded">Enter</kbd> or{' '}
          <kbd className="px-2 py-1 text-xs font-semibold bg-muted border rounded">Esc</kbd> to save/exit.
        </div>
        <div className="text-lg font-bold text-foreground">Total Duration: {formatDuration(totalDuration)}</div>
      </div>
    </div>
  )
}