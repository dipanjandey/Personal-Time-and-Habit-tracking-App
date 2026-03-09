import type { TimeEntry } from '@/types/time-tracking'
import { formatDuration } from './time-utils'

export interface ExportOptions {
  format: 'csv' | 'json'
  filename?: string
  includeHeaders?: boolean
}

/**
 * Export time entries to CSV format
 */
export function exportToCSV(entries: TimeEntry[], filename?: string): void {
  if (entries.length === 0) {
    alert('No entries to export')
    return
  }

  const headers = [
    'Date',
    'Start Time',
    'End Time',
    'Work Area',
    'Work Type',
    'Priority',
    'Duration (minutes)',
    'Duration (formatted)',
    'Pomodoros',
    'Comments',
  ]

  const rows = entries.map((entry) => [
    entry.date,
    formatTimeForExport(entry.startTime),
    entry.endTime ? formatTimeForExport(entry.endTime) : 'Ongoing',
    entry.workArea,
    entry.workType,
    entry.priority || '',
    entry.duration.toString(),
    formatDuration(entry.duration),
    entry.pomodoros.toString(),
    // Escape quotes and wrap in quotes if contains comma or newline
    escapeCSVField(entry.comments),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  downloadFile(csvContent, filename || generateFilename('csv'), 'text/csv;charset=utf-8;')
}

/**
 * Export time entries to JSON format
 */
export function exportToJSON(entries: TimeEntry[], filename?: string): void {
  if (entries.length === 0) {
    alert('No entries to export')
    return
  }

  const exportData = entries.map((entry) => ({
    date: entry.date,
    startTime: formatTimeForExport(entry.startTime),
    endTime: entry.endTime ? formatTimeForExport(entry.endTime) : null,
    workArea: entry.workArea,
    workType: entry.workType,
    priority: entry.priority || null,
    duration: entry.duration,
    durationFormatted: formatDuration(entry.duration),
    pomodoros: entry.pomodoros,
    comments: entry.comments,
  }))

  const jsonContent = JSON.stringify(exportData, null, 2)
  downloadFile(jsonContent, filename || generateFilename('json'), 'application/json;charset=utf-8;')
}

/**
 * Format time for export - extract just the time portion if it includes date
 */
function formatTimeForExport(time: string): string {
  if (time.includes(' ')) {
    return time.split(' ')[1]
  }
  return time
}

/**
 * Escape a field for CSV export
 */
function escapeCSVField(field: string): string {
  if (!field) return ''
  
  // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/**
 * Generate a filename with timestamp
 */
function generateFilename(extension: string): string {
  const date = new Date()
  // Use local date, not UTC
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const timestamp = `${year}-${month}-${day}`
  return `time-entries-${timestamp}.${extension}`
}

/**
 * Trigger a file download in the browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  
  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export entries with options
 */
export function exportTimeEntries(entries: TimeEntry[], options: ExportOptions = { format: 'csv' }): void {
  const { format, filename } = options

  if (format === 'json') {
    exportToJSON(entries, filename)
  } else {
    exportToCSV(entries, filename)
  }
}
