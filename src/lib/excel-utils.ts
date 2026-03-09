import * as XLSX from 'xlsx'
import { calculateDuration } from './time-utils'

export interface ParsedEntry {
  rowNumber: number
  date: string
  startTime: string
  endTime: string
  workArea: string
  workType: string
  priority: string
  pomodoros: number
  comments: string
  isValid: boolean
  errors: string[]
  duration: number
}

interface ExcelRow {
  date?: string | number
  startTime?: string | number
  endTime?: string | number
  workArea?: string
  workType?: string
  priority?: string
  pomodoros?: number | string
  comments?: string
}

/**
 * Generate and download an Excel template for bulk time entry upload
 */
export function downloadTemplate(): void {
  // Define headers
  const headers = [
    'date',
    'startTime',
    'endTime',
    'workArea',
    'workType',
    'priority',
    'pomodoros',
    'comments',
  ]

  // Sample data rows
  const sampleData = [
    {
      date: '2024-01-15',
      startTime: '09:00',
      endTime: '10:30',
      workArea: 'Development',
      workType: 'Deep Work',
      priority: 'Strategic - Urgent',
      pomodoros: 3,
      comments: 'Worked on feature implementation',
    },
    {
      date: '2024-01-15',
      startTime: '14:00',
      endTime: '15:00',
      workArea: 'Meetings',
      workType: 'Collaboration',
      priority: 'Tactical - Not Urgent',
      pomodoros: 2,
      comments: 'Team sync meeting',
    },
  ]

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers })

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // date
    { wch: 10 }, // startTime
    { wch: 10 }, // endTime
    { wch: 15 }, // workArea
    { wch: 15 }, // workType
    { wch: 25 }, // priority
    { wch: 10 }, // pomodoros
    { wch: 40 }, // comments
  ]

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Time Entries')

  // Download
  XLSX.writeFile(wb, 'time_entries_template.xlsx')
}

/**
 * Parse time value from Excel (handles both string and Excel serial number formats)
 */
function parseTimeValue(value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') {
    return ''
  }

  // If it's already a string in HH:mm format
  if (typeof value === 'string') {
    // Check if it's in HH:mm or HH:mm:ss format
    const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
    if (timeMatch) {
      return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
    }
    return value
  }

  // If it's a number (Excel stores times as fractions of a day)
  if (typeof value === 'number') {
    const totalMinutes = Math.round(value * 24 * 60)
    const hours = Math.floor(totalMinutes / 60) % 24
    const minutes = totalMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  return String(value)
}

/**
 * Parse date value from Excel (handles both string and Excel serial number formats)
 */
function parseDateValue(value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') {
    return ''
  }

  // If it's already a string
  if (typeof value === 'string') {
    // Try to parse as ISO date
    const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) {
      return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
    }
    // Try other common formats
    // If it looks like an ISO date-only string, append T00:00:00 to force local interpretation
    const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T00:00:00' : value
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      // Use local date, not UTC
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return value
  }

  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    // Excel serial date (days since 1899-12-30)
    // The epoch math produces a UTC timestamp, so use UTC methods to extract the date
    const date = new Date((value - 25569) * 86400 * 1000)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return String(value)
}

/**
 * Validate a time string (HH:mm format)
 */
function isValidTime(time: string): boolean {
  const match = time.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/)
  return match !== null
}

/**
 * Validate a date string (YYYY-MM-DD format)
 */
function isValidDate(date: string): boolean {
  const match = date.match(/^\d{4}-\d{2}-\d{2}$/)
  if (!match) return false
  
  // Append T00:00:00 to force local interpretation and avoid UTC midnight shift
  const d = new Date(date + 'T00:00:00')
  return !isNaN(d.getTime())
}

/**
 * Parse an Excel file and return validated entries
 */
export async function parseExcelFile(
  file: File,
  validWorkAreas: string[],
  validWorkTypes: string[]
): Promise<ParsedEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })

        // Get first sheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // Convert to JSON
        const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet)

        // Parse and validate each row
        const parsedEntries: ParsedEntry[] = rows.map((row, index) => {
          const errors: string[] = []

          // Parse values
          const date = parseDateValue(row.date)
          const startTime = parseTimeValue(row.startTime)
          const endTime = parseTimeValue(row.endTime)
          const workArea = String(row.workArea || '').trim()
          const workType = String(row.workType || '').trim()
          const priority = String(row.priority || '').trim()
          const pomodoros = typeof row.pomodoros === 'number' 
            ? row.pomodoros 
            : parseInt(String(row.pomodoros || '0'), 10)
          const comments = String(row.comments || '').trim()

          // Validate priority (optional field)
          const validPriorities = [
            'Strategic - Urgent',
            'Strategic - Not Urgent',
            'Tactical - Urgent',
            'Tactical - Not Urgent',
          ]
          if (priority && !validPriorities.includes(priority)) {
            errors.push(`Invalid priority. Valid options: ${validPriorities.join(', ')}`)
          }

          // Validate date
          if (!date) {
            errors.push('Date is required')
          } else if (!isValidDate(date)) {
            errors.push('Invalid date format (use YYYY-MM-DD)')
          }

          // Validate start time
          if (!startTime) {
            errors.push('Start time is required')
          } else if (!isValidTime(startTime)) {
            errors.push('Invalid start time format (use HH:mm)')
          }

          // Validate end time
          if (!endTime) {
            errors.push('End time is required')
          } else if (!isValidTime(endTime)) {
            errors.push('Invalid end time format (use HH:mm)')
          }

          // Validate time order
          if (startTime && endTime && isValidTime(startTime) && isValidTime(endTime)) {
            const duration = calculateDuration(startTime, endTime)
            if (duration <= 0) {
              errors.push('End time must be after start time')
            }
          }

          // Validate work area
          if (!workArea) {
            errors.push('Work area is required')
          } else if (validWorkAreas.length > 0 && !validWorkAreas.includes(workArea)) {
            errors.push(`Invalid work area. Valid options: ${validWorkAreas.join(', ')}`)
          }

          // Validate work type
          if (!workType) {
            errors.push('Work type is required')
          } else if (validWorkTypes.length > 0 && !validWorkTypes.includes(workType)) {
            errors.push(`Invalid work type. Valid options: ${validWorkTypes.join(', ')}`)
          }

          // Validate pomodoros
          if (isNaN(pomodoros) || pomodoros < 0) {
            errors.push('Pomodoros must be a non-negative number')
          }

          // Calculate duration
          let duration = 0
          if (startTime && endTime && isValidTime(startTime) && isValidTime(endTime)) {
            duration = calculateDuration(startTime, endTime)
          }

          return {
            rowNumber: index + 2, // +2 because Excel is 1-indexed and has header row
            date,
            startTime,
            endTime,
            workArea,
            workType,
            priority,
            pomodoros: isNaN(pomodoros) ? 0 : pomodoros,
            comments,
            isValid: errors.length === 0,
            errors,
            duration,
          }
        })

        resolve(parsedEntries)
      } catch (error) {
        reject(new Error('Failed to parse Excel file. Please ensure it is a valid .xlsx file.'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}
