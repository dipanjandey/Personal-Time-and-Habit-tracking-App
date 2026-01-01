'use client'

import { useState } from 'react'
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

export function TimeEntriesTable() {
  const {
    entries,
    editingEntryId,
    setEditingEntryId,
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
  
  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = 
      !searchQuery ||
      entry.workArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.comments.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesArea = !selectedWorkArea || selectedWorkArea === 'all' || entry.workArea === selectedWorkArea
    const matchesType = !selectedWorkType || selectedWorkType === 'all' || entry.workType === selectedWorkType
    
    return matchesSearch && matchesArea && matchesType
  })
  
  const totalDuration = filteredEntries.reduce((sum, e) => sum + e.duration, 0)
  
  const handleEdit = (entryId: string) => {
    setEditingEntryId(entryId)
  }
  
  const handleSave = () => {
    setEditingEntryId(null)
  }
  
  const handleCellChange = (entryId: string, field: keyof TimeEntry, value: string | number) => {
    const updates: Partial<TimeEntry> = { [field]: value }
    
    // Recalculate duration if start or end time changes
    const entry = entries.find((e) => e.id === entryId)
    if (entry && (field === 'startTime' || field === 'endTime')) {
      const newStartTime = field === 'startTime' ? value as string : entry.startTime
      const newEndTime = field === 'endTime' ? value as string : entry.endTime
      
      if (newStartTime && newEndTime) {
        updates.duration = calculateDuration(newStartTime, newEndTime)
      }
    }
    
    updateEntry(entryId, updates)
  }
  
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
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-3 bg-muted rounded-l-md font-medium text-sm w-[100px]">Start</th>
              <th className="px-4 py-3 bg-muted font-medium text-sm w-[100px]">End</th>
              <th className="px-4 py-3 bg-muted font-medium text-sm w-[180px]">Work Area</th>
              <th className="px-4 py-3 bg-muted font-medium text-sm w-[160px]">Work Type</th>
              <th className="px-4 py-3 bg-muted font-medium text-sm w-[80px] text-center">🍅</th>
              <th className="px-4 py-3 bg-muted font-medium text-sm">Comments</th>
              <th className="px-4 py-3 bg-muted rounded-r-md font-medium text-sm w-[100px]">Duration</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => {
              const isEditing = editingEntryId === entry.id
              
              return (
                <tr
                  key={entry.id}
                  className={`group transition-colors ${
                    isEditing ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-background hover:bg-muted/50'
                  }`}
                  onClick={() => !isEditing && handleEdit(entry.id)}
                >
                  <td className="px-4 py-4 border rounded-l-md cursor-pointer">
                    {isEditing ? (
                      <Input
                        type="time"
                        value={entry.startTime}
                        onChange={(e) => handleCellChange(entry.id, 'startTime', e.target.value)}
                        onBlur={handleSave}
                        className="w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <strong>{entry.startTime}</strong>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 border cursor-pointer">
                    {isEditing ? (
                      <Input
                        type="time"
                        value={entry.endTime}
                        onChange={(e) => handleCellChange(entry.id, 'endTime', e.target.value)}
                        onBlur={handleSave}
                        className="w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <strong>{entry.endTime}</strong>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 border cursor-pointer">
                    {isEditing ? (
                      <Select
                        value={entry.workArea}
                        onValueChange={(value) => handleCellChange(entry.id, 'workArea', value)}
                      >
                        <SelectTrigger onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {workAreas.map((area) => (
                            <SelectItem key={area} value={area}>
                              {area}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">{entry.workArea}</Badge>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 border cursor-pointer">
                    {isEditing ? (
                      <Select
                        value={entry.workType}
                        onValueChange={(value) => handleCellChange(entry.id, 'workType', value)}
                      >
                        <SelectTrigger onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {workTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm">{entry.workType}</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 border cursor-pointer text-center">
                    {isEditing ? (
                      <Input
                        type="number"
                        min="0"
                        value={entry.pomodoros}
                        onChange={(e) => handleCellChange(entry.id, 'pomodoros', Number(e.target.value))}
                        onBlur={handleSave}
                        className="w-full text-center"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <Badge variant={entry.pomodoros > 0 ? 'default' : 'outline'}>
                        {entry.pomodoros}
                      </Badge>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 border cursor-pointer relative">
                    {isEditing ? (
                      <Input
                        type="text"
                        value={entry.comments}
                        onChange={(e) => handleCellChange(entry.id, 'comments', e.target.value)}
                        onBlur={handleSave}
                        className="w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="text-sm">{entry.comments}</div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteEntry(entry.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                  
                  <td className="px-4 py-4 border rounded-r-md">
                    <span className="font-bold">{formatDuration(entry.duration)}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-muted-foreground">
        <div>
          💡 <strong>Tip:</strong> Click any cell to edit. Press Enter or click outside to save automatically (like Excel).
        </div>
        <div className="text-lg font-bold text-foreground">
          Total Duration: {formatDuration(totalDuration)}
        </div>
      </div>
    </div>
  )
}