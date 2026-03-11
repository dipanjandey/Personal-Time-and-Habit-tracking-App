'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { Trash2, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Combobox } from '@/components/ui/combobox'
import { PomodoroDetailsDialog } from '@/components/time-tracking/pomodoro-details-dialog'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { useConfigStore } from '@/store/config-store'
import { calculateDuration, formatDuration, getTodayDate } from '@/lib/time-utils'
import type { TimeEntry, Priority } from '@/types/time-tracking'
import { PRIORITY_OPTIONS } from '@/types/time-tracking'

// Helper functions for date/time formatting and validation
const formatDateTimeForDisplay = (datetime: string, fallbackDate?: string): string => {
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  
  if (datetime && datetime.includes(' ')) {
    const [date, time] = datetime.split(' ')
    const d = new Date(date + 'T00:00:00')
    const monthName = monthNames[d.getMonth()]
    const day = d.getDate().toString().padStart(2, '0')
    
    const [hours, minutes] = time.split(':')
    const hourNum = parseInt(hours, 10)
    const period = hourNum >= 12 ? 'pm' : 'am'
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    
    return `${monthName} ${day}, ${hour12}:${minutes} ${period}`
  }
  
  if (datetime && fallbackDate) {
    const d = new Date(fallbackDate + 'T00:00:00')
    const monthName = monthNames[d.getMonth()]
    const day = d.getDate().toString().padStart(2, '0')
    
    const [hours, minutes] = datetime.split(':')
    const hourNum = parseInt(hours, 10)
    const period = hourNum >= 12 ? 'pm' : 'am'
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    
    return `${monthName} ${day}, ${hour12}:${minutes} ${period}`
  }
  
  return datetime
}

const formatDateTimeForEdit = (datetime: string, fallbackDate?: string): string => {
  if (datetime && datetime.includes(' ')) {
    const [date, time] = datetime.split(' ')
    const d = new Date(date + 'T00:00:00')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const year = d.getFullYear()
    
    const [hours, minutes] = time.split(':')
    const hourNum = parseInt(hours, 10)
    const period = hourNum >= 12 ? 'pm' : 'am'
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    
    return `${month}/${day}/${year} ${hour12}:${minutes} ${period}`
  }
  
  if (datetime && fallbackDate) {
    const d = new Date(fallbackDate + 'T00:00:00')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const year = d.getFullYear()
    
    const [hours, minutes] = datetime.split(':')
    const hourNum = parseInt(hours, 10)
    const period = hourNum >= 12 ? 'pm' : 'am'
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    
    return `${month}/${day}/${year} ${hour12}:${minutes} ${period}`
  }
  
  return datetime
}

const parseEditFormatToStorage = (editValue: string): { success: boolean; datetime?: string; error?: string } => {
  // Expected format: mm/dd/yyyy hh:mm am/pm
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s+(am|pm)$/i
  const match = editValue.trim().match(regex)
  
  if (!match) {
    return { 
      success: false, 
      error: 'Invalid format. Use: mm/dd/yyyy hh:mm am/pm (e.g., 01/03/2026 10:30 am)' 
    }
  }
  
  const [, monthStr, dayStr, yearStr, hourStr, minuteStr, period] = match
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  const year = parseInt(yearStr, 10)
  let hour = parseInt(hourStr, 10)
  const minute = parseInt(minuteStr, 10)
  
  // Validate ranges
  if (month < 1 || month > 12) {
    return { success: false, error: 'Invalid month (1-12)' }
  }
  if (day < 1 || day > 31) {
    return { success: false, error: 'Invalid day (1-31)' }
  }
  if (hour < 1 || hour > 12) {
    return { success: false, error: 'Invalid hour (1-12)' }
  }
  if (minute < 0 || minute > 59) {
    return { success: false, error: 'Invalid minute (0-59)' }
  }
  
  // Convert to 24-hour format
  if (period.toLowerCase() === 'pm' && hour !== 12) {
    hour += 12
  } else if (period.toLowerCase() === 'am' && hour === 12) {
    hour = 0
  }
  
  // Format as YYYY-MM-DD HH:mm
  const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  const timeStr = `${hour.toString().padStart(2, '0')}:${minuteStr}`
  
  return { success: true, datetime: `${dateStr} ${timeStr}` }
}

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


// Sortable header component
function SortableHeader({
  column,
  children,
}: {
  column: any
  children: React.ReactNode
}) {
  const sorted = column.getIsSorted()
  
  return (
    <button
      className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer select-none"
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="w-3.5 h-3.5" />
      ) : (
        <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />
      )}
    </button>
  )
}

interface TimeEntriesTableProps {
  /** Limit number of entries shown (undefined = show all) */
  limit?: number
  /** Show search and filter controls */
  showFilters?: boolean
  /** Show pagination controls */
  showPagination?: boolean
  /** Compact mode - hide some UI elements */
  compact?: boolean
}

export function TimeEntriesTable({ 
  limit, 
  showFilters = true, 
  showPagination = false,
  compact = false 
}: TimeEntriesTableProps) {
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
    selectedPriority,
    setSelectedPriority,
    isSearchOpen,
    toggleSearch,
    clearFilters,
  } = useTimeTrackingStore()

  const { workAreas, workTypes, loadWorkAreas, loadWorkTypes } = useConfigStore()

  // Load work areas and types on mount
  useEffect(() => {
    loadWorkAreas()
    loadWorkTypes()
  }, [loadWorkAreas, loadWorkTypes])

  const [timeRange, setTimeRange] = useState('today')
  // Default sort by startTime descending (newest first)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'startTime', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null)
  const [editingValue, setEditingValue] = useState<any>(null)
  const [editingError, setEditingError] = useState<string>('')
  const [pageSize, setPageSize] = useState(10)
  const [pageIndex, setPageIndex] = useState(0)
  
  // Pomodoro details dialog state
  const [pomodoroDetailsOpen, setPomodoroDetailsOpen] = useState(false)
  const [selectedEntryForDetails, setSelectedEntryForDetails] = useState<TimeEntry | null>(null)

  // Get entries to display - limit if specified
  const displayEntries = useMemo(() => {
    if (limit && limit > 0) {
      return entries.slice(0, limit)
    }
    return entries
  }, [entries, limit])
  
  // Use refs to avoid stale closures in event handlers
  const editingValueRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cursorPositionRef = useRef<number | null>(null)

  // Column helper
  const columnHelper = createColumnHelper<TimeEntry>()

  const handleStartEdit = (rowId: string, columnId: string, value: any, entryDate?: string) => {
    setEditingCell({ rowId, columnId })
    setEditingError('')
    
    // For datetime fields, convert to editable format
    if ((columnId === 'startTime' || columnId === 'endTime') && value) {
      const editFormat = formatDateTimeForEdit(value, entryDate)
      setEditingValue(editFormat)
      editingValueRef.current = editFormat
    } else {
      setEditingValue(value)
      editingValueRef.current = value
    }
  }

  const handleSaveEdit = (rowId: string, columnId: string, valueToSave?: any) => {
    const finalValue = valueToSave !== undefined ? valueToSave : editingValueRef.current
    
    const entry = entries.find((e) => e.id === rowId)
    if (!entry) return
    
    // For datetime fields, validate and convert format
    if (columnId === 'startTime' || columnId === 'endTime') {
      const parseResult = parseEditFormatToStorage(finalValue)
      
      if (!parseResult.success) {
        setEditingError(parseResult.error || 'Invalid format')
        return // Stay in edit mode
      }
      
      const updates: Partial<TimeEntry> = { [columnId]: parseResult.datetime }
      
      // Recalculate duration
      const newStartTime = columnId === 'startTime' ? parseResult.datetime : entry.startTime
      const newEndTime = columnId === 'endTime' ? parseResult.datetime : entry.endTime
      
      if (newStartTime && newEndTime) {
        const parseDateTime = (dt: string) => {
          if (dt.includes(' ')) {
            const [date, time] = dt.split(' ')
            return new Date(`${date}T${time}:00`)
          }
          return new Date(`${entry.date}T${dt}:00`)
        }
        
        const start = parseDateTime(newStartTime)
        const end = parseDateTime(newEndTime)
        updates.duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
      }
      
      updateEntry(rowId, updates)
      setEditingCell(null)
      setEditingValue(null)
      setEditingError('')
    } else {
      // Non-datetime fields
      if (finalValue !== null && finalValue !== undefined) {
        updateEntry(rowId, { [columnId]: finalValue })
      }
      setEditingCell(null)
      setEditingValue(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditingValue(null)
    setEditingError('')
    editingValueRef.current = null
  }

  const isEditing = (rowId: string, columnId: string) => {
    return editingCell?.rowId === rowId && editingCell?.columnId === columnId
  }

  // Restore cursor position after state updates
  useEffect(() => {
    if (inputRef.current && cursorPositionRef.current !== null) {
      inputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current)
    }
  }, [editingValue])

  // Handle clicking outside to exit edit mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingCell) {
        const target = event.target as HTMLElement
        const isInsideTable = target.closest('td')
        const isInsideDropdown = target.closest('[role="listbox"]') || target.closest('[data-radix-select-content]')
        const isDropdownTrigger = target.closest('button[role="combobox"]')
        const isSelectTrigger = target.closest('[data-radix-select-trigger]') || target.closest('button[role="combobox"][data-placeholder]')
        
        if (!isInsideTable && !isInsideDropdown && !isDropdownTrigger && !isSelectTrigger) {
          handleSaveEdit(editingCell.rowId, editingCell.columnId)
        }
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (editingCell) {
        if (event.key === 'Escape') {
          event.preventDefault()
          handleCancelEdit()
        } else if (event.key === 'Enter') {
          const target = event.target as HTMLElement
          const isInDropdown = target.closest('[role="listbox"]') || target.closest('[data-radix-select-content]')
          
          if (!isInDropdown) {
            event.preventDefault()
            handleSaveEdit(editingCell.rowId, editingCell.columnId)
          }
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editingCell])


  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('startTime', {
        header: ({ column }) => <SortableHeader column={column}>Start</SortableHeader>,
        size: 200,
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.startTime || ''
          const b = rowB.original.startTime || ''
          return a.localeCompare(b)
        },
        cell: ({ row, getValue }) => {
          const value = getValue()
          const isEditingCell = isEditing(row.original.id, 'startTime')

          if (isEditingCell) {
            return (
              <div onClick={(e) => e.stopPropagation()} className="space-y-1">
                <Input
                  ref={inputRef}
                  value={editingValue}
                  onChange={(e) => {
                    const target = e.target as HTMLInputElement
                    cursorPositionRef.current = target.selectionStart
                    setEditingValue(e.target.value)
                    editingValueRef.current = e.target.value
                    setEditingError('') // Clear error on change
                  }}
                  placeholder="mm/dd/yyyy hh:mm am/pm"
                  className={`w-full text-xs ${editingError ? 'border-danger focus-visible:ring-danger' : ''}`}
                  autoFocus
                />
                {editingError && (
                  <p className="text-xs text-danger">{editingError}</p>
                )}
              </div>
            )
          }

          return (
            <div
              onClick={() => handleStartEdit(row.original.id, 'startTime', value, row.original.date)}
              className="cursor-pointer font-semibold text-xs"
            >
              {formatDateTimeForDisplay(value, row.original.date)}
            </div>
          )
        },
      }),
      columnHelper.accessor('endTime', {
        header: ({ column }) => <SortableHeader column={column}>End</SortableHeader>,
        size: 200,
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.endTime || ''
          const b = rowB.original.endTime || ''
          return a.localeCompare(b)
        },
        cell: ({ row, getValue }) => {
          const value = getValue()
          const isEditingCell = isEditing(row.original.id, 'endTime')

          if (isEditingCell) {
            return (
              <div onClick={(e) => e.stopPropagation()} className="space-y-1">
                <Input
                  ref={inputRef}
                  value={editingValue}
                  onChange={(e) => {
                    const target = e.target as HTMLInputElement
                    cursorPositionRef.current = target.selectionStart
                    setEditingValue(e.target.value)
                    editingValueRef.current = e.target.value
                    setEditingError('') // Clear error on change
                  }}
                  placeholder="mm/dd/yyyy hh:mm am/pm"
                  className={`w-full text-xs ${editingError ? 'border-danger focus-visible:ring-danger' : ''}`}
                  autoFocus
                />
                {editingError && (
                  <p className="text-xs text-danger">{editingError}</p>
                )}
              </div>
            )
          }

          // Show "Ongoing" badge for entries without end time
          if (!value) {
            return (
              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1.5" />
                Ongoing
              </Badge>
            )
          }

          return (
            <div
              onClick={() => handleStartEdit(row.original.id, 'endTime', value, row.original.date)}
              className="cursor-pointer font-semibold text-xs"
            >
              {formatDateTimeForDisplay(value, row.original.date)}
            </div>
          )
        },
      }),
      columnHelper.accessor('workArea', {
        header: ({ column }) => <SortableHeader column={column}>Work Area</SortableHeader>,
        size: 180,
        enableSorting: true,
        cell: ({ row, getValue }) => {
          const value = getValue()
          const isEditingCell = isEditing(row.original.id, 'workArea')

          if (isEditingCell) {
            return (
              <div onClick={(e) => e.stopPropagation()}>
                <Combobox
                  value={editingValue ?? value}
                  onValueChange={(newValue) => {
                    setEditingValue(newValue)
                    editingValueRef.current = newValue
                    handleSaveEdit(row.original.id, 'workArea', newValue)
                  }}
                  options={workAreas.map(area => ({ value: area.name, label: area.name }))}
                  placeholder="Select area..."
                  emptyText="No area found."
                  className="w-full"
                  onEnterKey={() => handleSaveEdit(row.original.id, 'workArea')}
                  onEscapeKey={handleCancelEdit}
                />
              </div>
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
        header: ({ column }) => <SortableHeader column={column}>Work Type</SortableHeader>,
        size: 160,
        enableSorting: true,
        cell: ({ row, getValue }) => {
          const value = getValue()
          const isEditingCell = isEditing(row.original.id, 'workType')

          if (isEditingCell) {
            return (
              <div onClick={(e) => e.stopPropagation()}>
                <Combobox
                  value={editingValue ?? value}
                  onValueChange={(newValue) => {
                    setEditingValue(newValue)
                    editingValueRef.current = newValue
                    handleSaveEdit(row.original.id, 'workType', newValue)
                  }}
                  options={workTypes.map(type => ({ value: type.name, label: type.name }))}
                  placeholder="Select type..."
                  emptyText="No type found."
                  className="w-full"
                  onEnterKey={() => handleSaveEdit(row.original.id, 'workType')}
                  onEscapeKey={handleCancelEdit}
                />
              </div>
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
      columnHelper.accessor('priority', {
        header: ({ column }) => <SortableHeader column={column}>Priority</SortableHeader>,
        size: 200,
        enableSorting: true,
        cell: ({ row, getValue }) => {
          const value = getValue()
          const isEditingCell = isEditing(row.original.id, 'priority')

          if (isEditingCell) {
            return (
              <div onClick={(e) => e.stopPropagation()}>
                <Select
                  value={editingValue ?? value ?? ''}
                  onValueChange={(newValue) => {
                    const finalValue = newValue === '__none__' ? null : newValue
                    setEditingValue(finalValue)
                    editingValueRef.current = finalValue
                    handleSaveEdit(row.original.id, 'priority', finalValue)
                  }}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Select priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No priority</SelectItem>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          }

          return (
            <div onClick={() => handleStartEdit(row.original.id, 'priority', value)} className="cursor-pointer min-h-[24px]">
              {value ? (
                <Badge variant="outline" className="text-xs">{value}</Badge>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </div>
          )
        },
        filterFn: (row, id, value) => {
          if (!value || value === 'all') return true
          return row.getValue(id) === value
        },
      }),
      columnHelper.accessor('pomodoros', {
        header: ({ column }) => <SortableHeader column={column}>🍅</SortableHeader>,
        size: 100,
        enableSorting: true,
        cell: ({ row, getValue }) => {
          const value = getValue()
          const isEditingCell = isEditing(row.original.id, 'pomodoros')

          if (isEditingCell) {
            return (
              <EditableTextCell
                value={editingValue ?? value}
                onChange={(val) => {
                  setEditingValue(val)
                  editingValueRef.current = val
                }}
                onSave={() => handleSaveEdit(row.original.id, 'pomodoros')}
                onCancel={handleCancelEdit}
                type="number"
                className="text-center"
              />
            )
          }

          return (
            <div className="flex items-center justify-center gap-1">
              <div
                onClick={() => handleStartEdit(row.original.id, 'pomodoros', value)}
                className="cursor-pointer"
              >
                <Badge variant={value > 0 ? 'default' : 'outline'}>{value}</Badge>
              </div>
              {value > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedEntryForDetails(row.original)
                    setPomodoroDetailsOpen(true)
                  }}
                  title="View pomodoro details"
                >
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor('comments', {
        header: ({ column }) => <SortableHeader column={column}>Comments</SortableHeader>,
        enableSorting: true,
        cell: ({ row, getValue }) => {
          const value = getValue()
          const isEditingCell = isEditing(row.original.id, 'comments')

          if (isEditingCell) {
            return (
              <EditableTextCell
                value={editingValue ?? value}
                onChange={(val) => {
                  setEditingValue(val)
                  editingValueRef.current = val
                }}
                onSave={() => handleSaveEdit(row.original.id, 'comments')}
                onCancel={handleCancelEdit}
              />
            )
          }

          return (
            <div onClick={() => handleStartEdit(row.original.id, 'comments', value)} className="cursor-pointer min-h-[24px]">
              <div className="text-sm">{value || <span className="text-muted-foreground">Click to add comment</span>}</div>
            </div>
          )
        },
      }),
      columnHelper.accessor('duration', {
        header: ({ column }) => <SortableHeader column={column}>Duration</SortableHeader>,
        size: 100,
        enableSorting: true,
        cell: ({ getValue }) => {
          const duration = getValue()
          if (!duration || duration === 0) {
            return <span className="text-muted-foreground text-sm">—</span>
          }
          return <span className="font-bold">{formatDuration(duration)}</span>
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
    [editingCell, editingValue, editingError, workAreas, workTypes, entries]
  )

  // Global filter function for search
  const globalFilterFn = (row: any, columnId: string, filterValue: string) => {
    const entry = row.original as TimeEntry
    const searchLower = filterValue.toLowerCase()
    return (
      entry.workArea.toLowerCase().includes(searchLower) ||
      entry.workType.toLowerCase().includes(searchLower) ||
      (entry.priority?.toLowerCase().includes(searchLower) ?? false) ||
      entry.comments.toLowerCase().includes(searchLower)
    )
  }

  // Create table instance
  const table = useReactTable({
    data: displayEntries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(showPagination && { getPaginationRowModel: getPaginationRowModel() }),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    ...(showPagination && {
      onPaginationChange: (updater: any) => {
        const newPagination = typeof updater === 'function'
          ? updater({ pageIndex, pageSize })
          : updater
        setPageIndex(newPagination.pageIndex)
        setPageSize(newPagination.pageSize)
      },
    }),
    globalFilterFn,
    state: {
      sorting,
      columnFilters,
      globalFilter: searchQuery,
      ...(showPagination && { pagination: { pageIndex, pageSize } }),
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
    if (selectedPriority && selectedPriority !== 'all') {
      filters.push({ id: 'priority', value: selectedPriority })
    }
    setColumnFilters(filters)
  }, [selectedWorkArea, selectedWorkType, selectedPriority])

  const totalDuration = table.getFilteredRowModel().rows.reduce((sum, row) => sum + row.original.duration, 0)

  return (
    <div className="bg-card rounded-lg border p-6">
      {/* Header - different for compact vs full mode */}
      {!compact ? (
        <div className="flex items-center justify-between pb-4 mb-5 border-b">
          <h2 className="text-2xl font-semibold">
            {limit ? 'Recent Entries' : 'All Time Entries'}
          </h2>
          {showFilters && (
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
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between pb-3 mb-4">
          <h3 className="text-lg font-semibold">Recent Entries</h3>
          {limit && (
            <span className="text-sm text-muted-foreground">
              {limit} latest entries
            </span>
          )}
        </div>
      )}

      {/* Collapsible Search Bar - only when showFilters is true */}
      {showFilters && isSearchOpen && (
        <div className="flex flex-wrap gap-3 mb-5 p-4 bg-muted/50 rounded-md border animate-in slide-in-from-top-2">
          <Input
            placeholder="🔍 Search entries by work area, type, or comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px]"
          />

          <Select value={selectedWorkArea || 'all'} onValueChange={setSelectedWorkArea}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Work Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Work Areas</SelectItem>
              {workAreas.map((area) => (
                <SelectItem key={area.id} value={area.name}>
                  {area.name}
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
                <SelectItem key={type.id} value={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPriority || 'all'} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
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

      {/* Footer with pagination or tips */}
      <div className="flex flex-col gap-4 mt-4 pt-4 border-t">
        {/* Pagination Controls */}
        {showPagination && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span>{table.getFilteredRowModel().rows.length} entries</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Select 
                value={pageSize.toString()} 
                onValueChange={(val) => {
                  setPageSize(Number(val))
                  setPageIndex(0)
                }}
              >
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Tips and Total */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {!compact && (
            <div>
              💡 <strong>Tip:</strong> Click any cell to edit. Press{' '}
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted border rounded">Enter</kbd> or{' '}
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted border rounded">Esc</kbd> to save/exit.
            </div>
          )}
          {compact && <div />}
          <div className="text-lg font-bold text-foreground">Total: {formatDuration(totalDuration)}</div>
        </div>
      </div>
      
      {/* Pomodoro Details Dialog */}
      <PomodoroDetailsDialog
        open={pomodoroDetailsOpen}
        onOpenChange={setPomodoroDetailsOpen}
        entry={selectedEntryForDetails}
      />
    </div>
  )
}