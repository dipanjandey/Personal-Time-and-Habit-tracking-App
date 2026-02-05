'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2, Check, X, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface EditableListItem {
  id: string
  name: string
  orderIndex: number
}

interface EditableListProps {
  title: string
  description: string
  items: EditableListItem[]
  onAdd: (name: string) => Promise<void>
  onEdit: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReorder?: (items: EditableListItem[]) => Promise<void>
}

interface SortableItemProps {
  item: EditableListItem
  isEditing: boolean
  editingName: string
  onEditingNameChange: (name: string) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  showDragHandle: boolean
}

function SortableItem({
  item,
  isEditing,
  editingName,
  onEditingNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  showDragHandle,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
    >
      {showDragHandle && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      
      {isEditing ? (
        <>
          <Input
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSaveEdit()
              } else if (e.key === 'Escape') {
                onCancelEdit()
              }
            }}
            className="flex-1"
            autoFocus
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={onSaveEdit}
            disabled={!editingName.trim()}
          >
            <Check className="w-4 h-4 text-success" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onCancelEdit}>
            <X className="w-4 h-4 text-danger" />
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm">{item.name}</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={onStartEdit}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  )
}

export function EditableList({
  title,
  description,
  items,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: EditableListProps) {
  const [newItemName, setNewItemName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isTextEditMode, setIsTextEditMode] = useState(false)
  const [textEditValue, setTextEditValue] = useState('')
  const [isSavingBulk, setIsSavingBulk] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAdd = async () => {
    if (!newItemName.trim()) {
      toast.error('Please enter a name')
      return
    }

    setIsAdding(true)
    try {
      await onAdd(newItemName.trim())
      setNewItemName('')
      toast.success(`${title.slice(0, -1)} added successfully`)
    } catch (error) {
      toast.error('Failed to add item')
    } finally {
      setIsAdding(false)
    }
  }

  const handleStartEdit = (item: EditableListItem) => {
    setEditingId(item.id)
    setEditingName(item.name)
  }

  const handleSaveEdit = async () => {
    if (!editingName.trim() || !editingId) {
      toast.error('Please enter a name')
      return
    }

    try {
      await onEdit(editingId, editingName.trim())
      setEditingId(null)
      setEditingName('')
      toast.success(`${title.slice(0, -1)} updated successfully`)
    } catch (error) {
      toast.error('Failed to update item')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }

    try {
      await onDelete(id)
      toast.success(`${title.slice(0, -1)} deleted successfully`)
    } catch (error) {
      toast.error('Failed to delete item')
    }
  }

  const handleToggleTextEdit = () => {
    if (!isTextEditMode) {
      // Entering text edit mode - populate textarea with current items (one per line)
      const itemsList = items.map((item) => item.name).join('\n')
      setTextEditValue(itemsList)
    }
    setIsTextEditMode(!isTextEditMode)
  }

  const handleSaveBulkEdit = async () => {
    setIsSavingBulk(true)
    try {
      // Parse the newline-separated list
      const newItemNames = textEditValue
        .split('\n')
        .map((name) => name.trim())
        .filter((name) => name.length > 0)

      // Create a map of existing items by name
      const existingItemsMap = new Map(items.map((item) => [item.name, item]))
      const newItemsSet = new Set(newItemNames)

      // Find items to delete (exist in old but not in new)
      const itemsToDelete = items.filter((item) => !newItemsSet.has(item.name))

      // Delete removed items first
      for (const item of itemsToDelete) {
        await onDelete(item.id)
      }

      // Process items in order from the textarea
      const updatedItems: EditableListItem[] = []
      for (let i = 0; i < newItemNames.length; i++) {
        const name = newItemNames[i]
        const existingItem = existingItemsMap.get(name)
        
        if (existingItem) {
          // Item exists - will be part of reordering
          updatedItems.push({ ...existingItem, orderIndex: i })
        } else {
          // New item - add it
          await onAdd(name)
          // Note: The newly added item will be fetched with loadWorkAreas/loadWorkTypes
        }
      }

      // If there are existing items to reorder and onReorder is available
      if (updatedItems.length > 0 && onReorder) {
        await onReorder(updatedItems)
      }

      toast.success(`${title} updated successfully`)
      setIsTextEditMode(false)
    } catch (error) {
      console.error('Failed to update items:', error)
      toast.error('Failed to update items')
    } finally {
      setIsSavingBulk(false)
    }
  }

  const handleCancelBulkEdit = () => {
    setIsTextEditMode(false)
    setTextEditValue('')
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id || !onReorder) {
      return
    }

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const reorderedItems = arrayMove(items, oldIndex, newIndex).map(
      (item, index) => ({
        ...item,
        orderIndex: index,
      })
    )

    try {
      await onReorder(reorderedItems)
      toast.success('Items reordered successfully')
    } catch (error) {
      toast.error('Failed to reorder items')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleTextEdit}
            disabled={isSavingBulk}
          >
            {isTextEditMode ? 'List View' : 'Text Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTextEditMode ? (
          // Text edit mode
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-edit">
                Enter each item on a new line
              </Label>
              <Textarea
                id="bulk-edit"
                value={textEditValue}
                onChange={(e) => setTextEditValue(e.target.value)}
                placeholder="Item 1&#10;Item 2&#10;Item 3"
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                One item per line. Items will be reordered based on your list.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveBulkEdit}
                disabled={isSavingBulk || !textEditValue.trim()}
                className="flex-1"
              >
                {isSavingBulk ? (
                  <>
                    <span className="mr-2">⏳</span> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelBulkEdit}
                disabled={isSavingBulk}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Add new item */}
            <div className="flex gap-2">
              <Input
                placeholder={`Add new ${title.toLowerCase().slice(0, -1)}...`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdd()
                  }
                }}
                disabled={isAdding}
              />
              <Button onClick={handleAdd} disabled={isAdding || !newItemName.trim()} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* List items */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No items yet. Add one above to get started.
                    </p>
                  ) : (
                    items.map((item) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        isEditing={editingId === item.id}
                        editingName={editingName}
                        onEditingNameChange={setEditingName}
                        onStartEdit={() => handleStartEdit(item)}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        onDelete={() => handleDelete(item.id)}
                        showDragHandle={!!onReorder}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </CardContent>
    </Card>
  )
}