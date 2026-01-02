import { supabase } from './client'
import type { Database } from '@/types/database.types'

type WorkAreaRow = Database['public']['Tables']['work_areas']['Row']
type WorkAreaInsert = Database['public']['Tables']['work_areas']['Insert']
type WorkAreaUpdate = Database['public']['Tables']['work_areas']['Update']

type WorkTypeRow = Database['public']['Tables']['work_types']['Row']
type WorkTypeInsert = Database['public']['Tables']['work_types']['Insert']
type WorkTypeUpdate = Database['public']['Tables']['work_types']['Update']

export interface WorkArea {
  id: string
  name: string
  orderIndex: number
}

export interface WorkType {
  id: string
  name: string
  orderIndex: number
}

// Work Areas
export async function fetchWorkAreas(): Promise<WorkArea[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  const { data, error } = await supabase
    .from('work_areas')
    .select('*')
    .eq('user_id', user.id)
    .order('order_index', { ascending: true })
  
  if (error) {
    console.error('Error fetching work areas:', error)
    throw error
  }
  
  return data.map(row => ({
    id: row.id,
    name: row.name,
    orderIndex: row.order_index,
  }))
}

export async function createWorkArea(name: string): Promise<WorkArea> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // Get the max order_index
  const { data: maxData } = await supabase
    .from('work_areas')
    .select('order_index')
    .eq('user_id', user.id)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()
  
  const nextOrder = (maxData?.order_index ?? -1) + 1
  
  const insertData: WorkAreaInsert = {
    user_id: user.id,
    name,
    order_index: nextOrder,
  }
  
  const { data, error } = await supabase
    .from('work_areas')
    .insert(insertData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating work area:', error)
    throw error
  }
  
  return {
    id: data.id,
    name: data.name,
    orderIndex: data.order_index,
  }
}

export async function updateWorkArea(id: string, name: string): Promise<WorkArea> {
  const updateData: WorkAreaUpdate = { name }
  
  const { data, error } = await supabase
    .from('work_areas')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating work area:', error)
    throw error
  }
  
  return {
    id: data.id,
    name: data.name,
    orderIndex: data.order_index,
  }
}

export async function deleteWorkArea(id: string): Promise<void> {
  const { error } = await supabase
    .from('work_areas')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting work area:', error)
    throw error
  }
}

export async function reorderWorkAreas(items: { id: string; orderIndex: number }[]): Promise<void> {
  const updates = items.map(item => 
    supabase
      .from('work_areas')
      .update({ order_index: item.orderIndex })
      .eq('id', item.id)
  )
  
  const results = await Promise.all(updates)
  const errors = results.filter(r => r.error)
  
  if (errors.length > 0) {
    console.error('Error reordering work areas:', errors)
    throw new Error('Failed to reorder work areas')
  }
}

// Work Types
export async function fetchWorkTypes(): Promise<WorkType[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  const { data, error } = await supabase
    .from('work_types')
    .select('*')
    .eq('user_id', user.id)
    .order('order_index', { ascending: true })
  
  if (error) {
    console.error('Error fetching work types:', error)
    throw error
  }
  
  return data.map(row => ({
    id: row.id,
    name: row.name,
    orderIndex: row.order_index,
  }))
}

export async function createWorkType(name: string): Promise<WorkType> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // Get the max order_index
  const { data: maxData } = await supabase
    .from('work_types')
    .select('order_index')
    .eq('user_id', user.id)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()
  
  const nextOrder = (maxData?.order_index ?? -1) + 1
  
  const insertData: WorkTypeInsert = {
    user_id: user.id,
    name,
    order_index: nextOrder,
  }
  
  const { data, error } = await supabase
    .from('work_types')
    .insert(insertData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating work type:', error)
    throw error
  }
  
  return {
    id: data.id,
    name: data.name,
    orderIndex: data.order_index,
  }
}

export async function updateWorkType(id: string, name: string): Promise<WorkType> {
  const updateData: WorkTypeUpdate = { name }
  
  const { data, error } = await supabase
    .from('work_types')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating work type:', error)
    throw error
  }
  
  return {
    id: data.id,
    name: data.name,
    orderIndex: data.order_index,
  }
}

export async function deleteWorkType(id: string): Promise<void> {
  const { error } = await supabase
    .from('work_types')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting work type:', error)
    throw error
  }
}

export async function reorderWorkTypes(items: { id: string; orderIndex: number }[]): Promise<void> {
  const updates = items.map(item => 
    supabase
      .from('work_types')
      .update({ order_index: item.orderIndex })
      .eq('id', item.id)
  )
  
  const results = await Promise.all(updates)
  const errors = results.filter(r => r.error)
  
  if (errors.length > 0) {
    console.error('Error reordering work types:', errors)
    throw new Error('Failed to reorder work types')
  }
}

// Seed default work areas for a user
export async function seedDefaultWorkAreas(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const defaultAreas = [
    'Work Area',
    'Product - testing & usage',
    'Product - spec, design & research',
    'Product - project management',
    'GTM - demos & reachouts',
    'GTM - research & planning',
    'GTM - marketing',
    'GTM - product marketing',
    'GTM - others',
    'Finance, ops & investors',
    'Cofounder/ office time',
    'Coding',
    'Work Planning',
    'Ineffective',
    'across areas',
  ]

  const insertData: WorkAreaInsert[] = defaultAreas.map((name, index) => ({
    user_id: user.id,
    name,
    order_index: index,
  }))

  const { error } = await supabase
    .from('work_areas')
    .insert(insertData)

  if (error) {
    console.error('Error seeding work areas:', error)
    throw error
  }
}

// Seed default work types for a user
export async function seedDefaultWorkTypes(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const defaultTypes = [
    'Self work - w Pomodoro',
    'Self work',
    'Meetings - External',
    'Meetings - Internal',
    'Email, chat & call',
    'Multiple work types',
    'Others',
  ]

  const insertData: WorkTypeInsert[] = defaultTypes.map((name, index) => ({
    user_id: user.id,
    name,
    order_index: index,
  }))

  const { error } = await supabase
    .from('work_types')
    .insert(insertData)

  if (error) {
    console.error('Error seeding work types:', error)
    throw error
  }
}