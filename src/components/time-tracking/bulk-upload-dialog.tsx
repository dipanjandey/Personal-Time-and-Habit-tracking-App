'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { downloadTemplate, parseExcelFile, type ParsedEntry } from '@/lib/excel-utils'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { useConfigStore } from '@/store/config-store'

interface BulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type UploadStep = 'upload' | 'preview' | 'confirming' | 'complete'

export function BulkUploadDialog({ open, onOpenChange }: BulkUploadDialogProps) {
  const [step, setStep] = useState<UploadStep>('upload')
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { bulkAddEntries } = useTimeTrackingStore()
  const { workAreas, workTypes } = useConfigStore()

  const validWorkAreas = workAreas.map((wa) => wa.name)
  const validWorkTypes = workTypes.map((wt) => wt.name)

  const validEntries = parsedEntries.filter((e) => e.isValid)
  const invalidEntries = parsedEntries.filter((e) => !e.isValid)

  const resetDialog = useCallback(() => {
    setStep('upload')
    setParsedEntries([])
    setIsProcessing(false)
    setIsDragging(false)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog()
    }
    onOpenChange(newOpen)
  }

  const handleDownloadTemplate = () => {
    downloadTemplate()
    toast.success('Template downloaded successfully')
  }

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)')
      return
    }

    setIsProcessing(true)
    setUploadProgress(30)

    try {
      const entries = await parseExcelFile(file, validWorkAreas, validWorkTypes)
      setUploadProgress(100)
      setParsedEntries(entries)
      setStep('preview')
      
      if (entries.length === 0) {
        toast.warning('No entries found in the file')
      } else {
        const validCount = entries.filter((e) => e.isValid).length
        toast.info(`Found ${entries.length} entries, ${validCount} are valid`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to parse file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleConfirmUpload = async () => {
    if (validEntries.length === 0) {
      toast.error('No valid entries to add')
      return
    }

    setStep('confirming')
    setIsProcessing(true)

    try {
      const entriesToAdd = validEntries.map((entry) => ({
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        workArea: entry.workArea,
        workType: entry.workType,
        pomodoros: entry.pomodoros,
        comments: entry.comments,
        duration: entry.duration,
        userId: '', // Will be set by the API
      }))

      await bulkAddEntries(entriesToAdd)
      
      setStep('complete')
      toast.success(`Successfully added ${validEntries.length} entries`)
      
      // Close dialog after a short delay
      setTimeout(() => {
        handleOpenChange(false)
      }, 1500)
    } catch (error) {
      toast.error('Failed to add entries. Please try again.')
      setStep('preview')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBackToUpload = () => {
    resetDialog()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Bulk Upload Entries
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Download the template, fill in your time entries, and upload the file.'}
            {step === 'preview' && 'Review the parsed entries before adding them.'}
            {step === 'confirming' && 'Adding entries...'}
            {step === 'complete' && 'Upload complete!'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6 py-4">
              {/* Download Template Section */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <h3 className="font-medium">Step 1: Download Template</h3>
                  <p className="text-sm text-muted-foreground">
                    Get the Excel template with the correct format and sample data
                  </p>
                </div>
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              {/* Upload Section */}
              <div>
                <h3 className="font-medium mb-3">Step 2: Upload Your File</h3>
                <div
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                    ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}
                    ${isProcessing ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  
                  {isProcessing ? (
                    <div className="space-y-4">
                      <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Processing file...</p>
                      <Progress value={uploadProgress} className="w-48 mx-auto" />
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Drag and drop your Excel file here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supports .xlsx and .xls files
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 text-green-700 rounded-md">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{validEntries.length} valid entries</span>
                </div>
                {invalidEntries.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-700 rounded-md">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{invalidEntries.length} entries with errors</span>
                  </div>
                )}
              </div>

              {/* Warning for invalid entries */}
              {invalidEntries.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 text-amber-800 rounded-md">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Only valid entries will be added. Invalid entries will be skipped.
                  </p>
                </div>
              )}

              {/* Entries Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[40vh] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-12">Row</TableHead>
                        <TableHead className="w-16">Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Work Area</TableHead>
                        <TableHead>Work Type</TableHead>
                        <TableHead className="w-12">🍅</TableHead>
                        <TableHead>Comments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedEntries.map((entry) => (
                        <TableRow 
                          key={entry.rowNumber}
                          className={entry.isValid ? '' : 'bg-red-500/5'}
                        >
                          <TableCell className="font-mono text-xs">{entry.rowNumber}</TableCell>
                          <TableCell>
                            {entry.isValid ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                                Valid
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200" title={entry.errors.join(', ')}>
                                Error
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{entry.date}</TableCell>
                          <TableCell className="font-mono text-xs">{entry.startTime}</TableCell>
                          <TableCell className="font-mono text-xs">{entry.endTime}</TableCell>
                          <TableCell className="text-sm">{entry.workArea}</TableCell>
                          <TableCell className="text-sm">{entry.workType}</TableCell>
                          <TableCell className="text-center">{entry.pomodoros}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate" title={entry.comments}>
                            {entry.comments}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Error details for invalid entries */}
              {invalidEntries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Error Details:</h4>
                  <div className="max-h-32 overflow-auto space-y-1 text-xs">
                    {invalidEntries.map((entry) => (
                      <div key={entry.rowNumber} className="text-red-600">
                        <span className="font-medium">Row {entry.rowNumber}:</span>{' '}
                        {entry.errors.join('; ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirming */}
          {step === 'confirming' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Adding {validEntries.length} entries...</p>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="text-lg font-medium">Successfully added {validEntries.length} entries!</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleBackToUpload}>
                Back
              </Button>
              <Button
                onClick={handleConfirmUpload}
                disabled={validEntries.length === 0}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Add {validEntries.length} Valid {validEntries.length === 1 ? 'Entry' : 'Entries'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
