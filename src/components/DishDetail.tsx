import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Edit, Trash2, Clock, MapPin, Star, Zap, Camera, MoreHorizontal } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Dish, DinnerInstance, Tag, Photo } from '@/lib/supabase'
import { toast } from 'sonner'
import { LocationInput } from '@/components/LocationInput'

interface DishDetailProps {
  dish: Dish | null
  isOpen: boolean
  onClose: () => void
  onEdit: (instance: DinnerInstance) => void
  onEditDish: () => void
  onRefresh: () => void
}

export const DishDetail: React.FC<DishDetailProps> = ({ 
  dish, 
  isOpen, 
  onClose, 
  onEdit, 
  onEditDish,
  onRefresh 
}) => {
  const { user } = useAuth()
  const [instances, setInstances] = useState<DinnerInstance[]>([])
  const [baseTags, setBaseTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const [dishNotes, setDishNotes] = useState<string>('')
  
  // Confirmation dialog states
  const [instanceToDelete, setInstanceToDelete] = useState<string | null>(null)
  const [showDeleteDishDialog, setShowDeleteDishDialog] = useState(false)
  
  // Debug: Monitor dialog state changes
  useEffect(() => {
    console.log('showDeleteDishDialog state changed to:', showDeleteDishDialog)
  }, [showDeleteDishDialog])
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [isDeletingInstance, setIsDeletingInstance] = useState(false)
  const [isDeletingDish, setIsDeletingDish] = useState(false)
  
  // Consumption record editing states
  const [editingConsumptionRecord, setEditingConsumptionRecord] = useState<string | null>(null)
  const [consumptionRecordToDelete, setConsumptionRecordToDelete] = useState<string | null>(null)
  const [isDeletingConsumptionRecord, setIsDeletingConsumptionRecord] = useState(false)
  const [cascadeDeleteType, setCascadeDeleteType] = useState<'variant' | 'dish' | null>(null)
  const [editingOriginalInstance, setEditingOriginalInstance] = useState(false)
  
  // Temporary editing values
  const [tempDate, setTempDate] = useState('')
  const [tempLocation, setTempLocation] = useState('')

  useEffect(() => {
    if (dish && isOpen) {
      loadDishDetails()
    }
  }, [dish, isOpen])

  // Reset edit states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditingConsumptionRecord(null)
      setTempDate('')
      setTempLocation('')
      setEditingOriginalInstance(false)
    }
  }, [isOpen])

  const loadDishDetails = async (preserveSelectedInstanceId?: string) => {
    if (!dish || !user) return

    setIsLoading(true)
    try {
      // Load dish details including notes
      const { data: dishData, error: dishError } = await supabase
        .from('dishes')
        .select('id, title, notes, health_score, effort, meal_type, base_photo_url')
        .eq('id', dish.id)
        .eq('user_id', user.id)
        .single()

      if (dishError) throw dishError

      // Load all instances for this dish
      const { data: instancesData, error: instancesError } = await supabase
        .from('dinner_instances')
        .select(`
          id, dish_id, user_id, datetime, place_id, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at,
          photos(*),
          places(name, type),
          tags(*),
          consumption_records(*)
        `)
        .eq('dish_id', dish.id)
        .eq('user_id', user.id)
        .order('datetime', { ascending: false })

      if (instancesError) throw instancesError

      // Load base tags for the dish
      const { data: baseTagsData, error: baseTagsError } = await supabase
        .from('tags')
        .select('*')
        .eq('dish_id', dish.id)
        .eq('is_base_tag', true)

      if (baseTagsError) throw baseTagsError

      console.log('Loaded instances:', instancesData)
      console.log('Loaded base tags:', baseTagsData)
      console.log('First instance location:', instancesData?.[0]?.location)
      console.log('Dish notes:', dishData?.notes)
      console.log('First instance consumption records:', instancesData?.[0]?.consumption_records)
      
      setInstances(instancesData || [])
      setBaseTags(baseTagsData || [])
      setDishNotes(dishData?.notes || '')
      
      // Select the most recently logged instance by default (by last_consumed fallback datetime),
      // or preserve the current selection if specified
      if (instancesData && instancesData.length > 0) {
        if (preserveSelectedInstanceId && instancesData.some(instance => instance.id === preserveSelectedInstanceId)) {
          // Preserve the current selection if it still exists
          console.log('Preserving selected instance:', preserveSelectedInstanceId)
          setSelectedInstanceId(preserveSelectedInstanceId)
        } else {
          // Find max by (last_consumed || datetime)
          const mostRecent = [...instancesData].reduce((best, curr) => {
            const bestDate = new Date(best.last_consumed || best.datetime).getTime()
            const currDate = new Date(curr.last_consumed || curr.datetime).getTime()
            return currDate > bestDate ? curr : best
          }, instancesData[0])
          console.log('Setting selected instance to most recently logged:', mostRecent.id)
          setSelectedInstanceId(mostRecent.id)
        }
      } else {
        console.log('No instances found for dish:', dish.id)
      }
    } catch (error: any) {
      console.error('Error loading dish details:', error)
      toast.error(`Failed to load dish details: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteInstanceConfirmed = async () => {
    if (!user || !instanceToDelete) return
    
    console.log('Starting instance deletion for:', instanceToDelete)
    setIsDeletingInstance(true)
    try {
      // Check if this is the last instance for this dish
      const { data: remainingInstances, error: instancesError } = await supabase
        .from('dinner_instances')
        .select('id')
        .eq('dish_id', dish?.id)
        .eq('user_id', user.id)

      if (instancesError) throw instancesError
      console.log('Remaining instances before deletion:', remainingInstances.length)

      // Delete the instance (photos and instance tags will cascade)
      const { error } = await supabase
        .from('dinner_instances')
        .delete()
        .eq('id', instanceToDelete)
        .eq('user_id', user.id)

      if (error) throw error
      console.log('Instance deleted successfully')

      // If this was the last instance, delete the entire dish
      if (remainingInstances.length === 1) { // Only the one we just deleted
        console.log('This was the last instance, deleting entire dish:', dish?.id)
        
        // Delete all base tags for this dish
        const { error: tagsDeleteError } = await supabase
          .from('tags')
          .delete()
          .eq('dish_id', dish?.id)
          .eq('is_base_tag', true)

        if (tagsDeleteError) {
          console.error('Error deleting base tags:', tagsDeleteError)
        } else {
          console.log('Base tags deleted successfully')
        }

        // Delete the dish
        const { error: dishDeleteError } = await supabase
          .from('dishes')
          .delete()
          .eq('id', dish?.id)
          .eq('user_id', user.id)

        if (dishDeleteError) {
          console.error('Error deleting dish:', dishDeleteError)
          throw dishDeleteError
        } else {
          console.log('Dish deleted successfully')
        }

        toast.success('Variant deleted. This was the last variant, so the entire dish has been deleted.')
        onClose?.() // Close the detail view since dish no longer exists
      } else {
        console.log('Other instances exist, only deleted this variant')
        toast.success('Variant deleted successfully')
        loadDishDetails(selectedInstanceId) // Reload the dish details while preserving selection
      }
    } catch (error: any) {
      console.error('Error deleting instance:', error)
      toast.error(`Failed to delete instance: ${error.message}`)
    } finally {
      setIsDeletingInstance(false)
      setInstanceToDelete(null)
    }
  }

  const handleDeleteDishConfirmed = async () => {
    if (!user || !dish || !confirmDeleteAll) {
      console.log('Delete validation failed:', { user: !!user, dish: !!dish, confirmDeleteAll })
      return
    }
    
    console.log('Starting dish deletion for:', dish.id)
    setIsDeletingDish(true)
    try {
      // Delete the entire dish (instances, photos, tags will cascade)
      const { error, data } = await supabase
        .from('dishes')
        .delete()
        .eq('id', dish.id)
        .eq('user_id', user.id)

      console.log('Delete result:', { error, data })

      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }

      console.log('Dish deleted successfully')
      toast.success('Dish and all instances deleted successfully')
      onClose()
      onRefresh()
    } catch (error: any) {
      console.error('Error deleting dish:', error)
      toast.error(`Failed to delete dish: ${error.message}`)
    } finally {
      setIsDeletingDish(false)
      setShowDeleteDishDialog(false)
      setConfirmDeleteAll(false)
    }
  }

  const handleUpdateConsumptionRecord = async (recordId: string, updates: { consumed_at?: string, location?: string, notes?: string }) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('consumption_records')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Consumption record updated successfully')
      setEditingConsumptionRecord(null)
      loadDishDetails(selectedInstanceId) // Reload to get updated data while preserving selection
    } catch (error: any) {
      console.error('Error updating consumption record:', error)
      toast.error(`Failed to update consumption record: ${error.message}`)
    }
  }

  const checkCascadeDelete = async (recordId: string) => {
    if (!user) return

    try {
      console.log('Checking cascade delete for record:', recordId)
      
      // First, get the consumption record to find its instance
      const { data: recordData, error: recordError } = await supabase
        .from('consumption_records')
        .select('instance_id')
        .eq('id', recordId)
        .eq('user_id', user.id)
        .single()

      if (recordError) throw recordError
      console.log('Found record data:', recordData)

      // Check if this is the last consumption record for this instance
      const { data: remainingRecords, error: countError } = await supabase
        .from('consumption_records')
        .select('id')
        .eq('instance_id', recordData.instance_id)
        .eq('user_id', user.id)

      if (countError) throw countError
      console.log('Remaining records for this instance:', remainingRecords.length)

      // If this is the last consumption record, check instances
      if (remainingRecords.length === 1) {
        console.log('This is the last consumption record, checking instances...')
        
        // Check how many instances this dish has
        const { data: remainingInstances, error: instancesError } = await supabase
          .from('dinner_instances')
          .select('id')
          .eq('dish_id', dish?.id)
          .eq('user_id', user.id)

        if (instancesError) throw instancesError
        console.log('Remaining instances for this dish:', remainingInstances.length)

        if (remainingInstances.length === 1) {
          // This will delete the entire dish
          console.log('This is the last instance, will delete entire dish')
          setCascadeDeleteType('dish')
        } else {
          // This will delete just the variant
          console.log('Other instances exist, will delete just this variant')
          setCascadeDeleteType('variant')
        }
      } else {
        console.log('Other consumption records exist, normal deletion')
        setCascadeDeleteType(null)
      }
    } catch (error: any) {
      console.error('Error checking cascade delete:', error)
      setCascadeDeleteType(null)
    }
  }

  const handleDeleteConsumptionRecord = async () => {
    if (!user || !consumptionRecordToDelete) return

    try {
      console.log('Proceeding with deletion, cascade type:', cascadeDeleteType)
      await handleDeleteConsumptionRecordConfirmed()
    } catch (error: any) {
      console.error('Error checking consumption record:', error)
      toast.error(`Failed to check consumption record: ${error.message}`)
    }
  }

  const handleDeleteConsumptionRecordConfirmed = async () => {
    if (!user || !consumptionRecordToDelete) return

    console.log('Confirmed delete for consumption record:', consumptionRecordToDelete)
    setIsDeletingConsumptionRecord(true)
    try {
      // First, get the consumption record to find its instance
      const { data: recordData, error: recordError } = await supabase
        .from('consumption_records')
        .select('instance_id')
        .eq('id', consumptionRecordToDelete)
        .eq('user_id', user.id)
        .single()

      if (recordError) throw recordError
      console.log('Record data for deletion:', recordData)

      // Delete the consumption record
      const { error: deleteError } = await supabase
        .from('consumption_records')
        .delete()
        .eq('id', consumptionRecordToDelete)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      console.log('Consumption record deleted successfully')

      // Check if this was the last consumption record for this instance
      const { data: remainingRecords, error: countError } = await supabase
        .from('consumption_records')
        .select('id')
        .eq('instance_id', recordData.instance_id)
        .eq('user_id', user.id)

      if (countError) throw countError

      // If no remaining consumption records, delete the instance
      if (remainingRecords.length === 0) {
        console.log('No remaining consumption records, deleting instance:', recordData.instance_id)
        
        // Check if this is the last instance for this dish
        const { data: remainingInstances, error: instancesError } = await supabase
          .from('dinner_instances')
          .select('id')
          .eq('dish_id', dish?.id)
          .eq('user_id', user.id)

        if (instancesError) throw instancesError
        console.log('Remaining instances after deletion:', remainingInstances.length)

        // Delete the instance
        const { error: instanceDeleteError } = await supabase
          .from('dinner_instances')
          .delete()
          .eq('id', recordData.instance_id)
          .eq('user_id', user.id)

        if (instanceDeleteError) throw instanceDeleteError
        console.log('Instance deleted successfully')

        // If this was the last instance, delete the entire dish
        if (remainingInstances.length === 1) { // Only the one we just deleted
          console.log('No remaining instances, deleting entire dish:', dish?.id)
          
          // Delete all base tags for this dish
          const { error: tagsDeleteError } = await supabase
            .from('tags')
            .delete()
            .eq('dish_id', dish?.id)
            .eq('is_base_tag', true)

          if (tagsDeleteError) {
            console.error('Error deleting base tags:', tagsDeleteError)
          } else {
            console.log('Base tags deleted successfully')
          }

          // Delete the dish
          const { error: dishDeleteError } = await supabase
            .from('dishes')
            .delete()
            .eq('id', dish?.id)
            .eq('user_id', user.id)

          if (dishDeleteError) {
            console.error('Error deleting dish:', dishDeleteError)
            throw dishDeleteError
          } else {
            console.log('Dish deleted successfully')
          }

          toast.success('Consumption record deleted. This was the last record, so the entire dish has been deleted.')
          setConsumptionRecordToDelete(null)
          setCascadeDeleteType(null)
          onClose?.() // Close the detail view since dish no longer exists
          onRefresh() // Refresh the gallery to remove the deleted dish
          return
        } else {
          console.log('Other instances exist, variant deleted but dish remains')
          toast.success('Consumption record deleted. This was the last record for this variant, so the variant has been deleted.')
        }
      } else {
        console.log('Other consumption records exist, only deleted this record')
        
        // Update the last_consumed field with the most recent remaining record
        const { data: remainingRecordsWithDates, error: datesError } = await supabase
          .from('consumption_records')
          .select('consumed_at')
          .eq('instance_id', recordData.instance_id)
          .eq('user_id', user.id)
          .order('consumed_at', { ascending: false })

        if (datesError) throw datesError

        if (remainingRecordsWithDates && remainingRecordsWithDates.length > 0) {
          const latestDate = remainingRecordsWithDates[0].consumed_at
          const { error: instanceError } = await supabase
            .from('dinner_instances')
            .update({ 
              last_consumed: latestDate,
              updated_at: new Date().toISOString()
            })
            .eq('id', recordData.instance_id)
            .eq('user_id', user.id)

          if (instanceError) throw instanceError
        }
        
        toast.success('Consumption record deleted successfully')
      }

      setConsumptionRecordToDelete(null)
      setCascadeDeleteType(null)
      
      // Reload data while preserving the current selected instance
      loadDishDetails(selectedInstanceId)
    } catch (error: any) {
      console.error('Error deleting consumption record:', error)
      toast.error(`Failed to delete consumption record: ${error.message}`)
    } finally {
      setIsDeletingConsumptionRecord(false)
    }
  }

  const handleUpdateOriginalInstance = async (updates: { datetime?: string, notes?: string }) => {
    if (!user || !selectedInstance) return

    try {
      const { error } = await supabase
        .from('dinner_instances')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedInstance.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Instance updated successfully')
      setEditingOriginalInstance(false)
      loadDishDetails(selectedInstanceId) // Reload to get updated data while preserving selection
    } catch (error: any) {
      console.error('Error updating instance:', error)
      toast.error(`Failed to update instance: ${error.message}`)
    }
  }

  const handleSaveConsumptionRecord = async (recordId: string) => {
    if (!user) return

    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      }

      // Only update fields that have been changed
      if (tempDate) {
        updates.consumed_at = tempDate + 'T12:00'
      }
      if (tempLocation !== undefined) {
        updates.location = tempLocation.toLowerCase()
      }

      console.log('Updating consumption record with:', updates)

      const { error } = await supabase
        .from('consumption_records')
        .update(updates)
        .eq('id', recordId)
        .eq('user_id', user.id)

      if (error) throw error

      // Find the instance this consumption record belongs to
      const record = selectedInstance?.consumption_records?.find(r => r.id === recordId)
      if (record) {
        // Get all consumption records for this instance to find the latest date
        const { data: allRecords, error: recordsError } = await supabase
          .from('consumption_records')
          .select('consumed_at')
          .eq('instance_id', record.instance_id)
          .eq('user_id', user.id)
          .order('consumed_at', { ascending: false })

        if (recordsError) throw recordsError

        // Update the last_consumed field in dinner_instances
        if (allRecords && allRecords.length > 0) {
          const latestDate = allRecords[0].consumed_at
          const { error: instanceError } = await supabase
            .from('dinner_instances')
            .update({ 
              last_consumed: latestDate,
              updated_at: new Date().toISOString()
            })
            .eq('id', record.instance_id)
            .eq('user_id', user.id)

          if (instanceError) throw instanceError
          
          // Also update the dish's updated_at to make it appear on top in gallery
          const { error: dishUpdateError } = await supabase
            .from('dishes')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', dish.id)
            .eq('user_id', user.id)
          
          if (dishUpdateError) throw dishUpdateError
        }
      }

      toast.success('Consumption record updated successfully')
      setEditingConsumptionRecord(null)
      setTempDate('')
      setTempLocation('')
      loadDishDetails(selectedInstanceId) // Reload to get updated data while preserving selection
      onRefresh() // Refresh stats and other queries
    } catch (error: any) {
      console.error('Error updating consumption record:', error)
      toast.error(`Failed to update consumption record: ${error.message}`)
    }
  }

  const handleSaveOriginalInstance = async () => {
    if (!user || !selectedInstance) return

    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      }

      // Only update fields that have been changed
      if (tempDate) {
        updates.datetime = tempDate + 'T12:00'
      }
      if (tempLocation !== undefined) {
        updates.location = tempLocation.toLowerCase()
        console.log('Saving location:', tempLocation.toLowerCase())
      }

      const { error } = await supabase
        .from('dinner_instances')
        .update(updates)
        .eq('id', selectedInstance.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Instance updated successfully')
      setEditingOriginalInstance(false)
      setTempDate('')
      setTempLocation('')
      loadDishDetails(selectedInstanceId) // Reload to get updated data while preserving selection
      onRefresh() // Refresh stats and other queries
    } catch (error: any) {
      console.error('Error updating instance:', error)
      toast.error(`Failed to update instance: ${error.message}`)
    }
  }

  const selectedInstance = instances.find(inst => inst.id === selectedInstanceId)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getEffortColor = (effort?: string) => {
    switch (effort) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'hard': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!dish) return null

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate text-ellipsis">{dish.title}</span>
              <Badge variant="outline" className="ml-1 flex-shrink-0">
                {instances.reduce((sum, instance) => sum + (instance.consumption_records?.length || 1), 0)} {instances.reduce((sum, instance) => sum + (instance.consumption_records?.length || 1), 0) === 1 ? 'time' : 'times'}
              </Badge>
            </div>
            <div className="flex gap-2 mr-24 sm:mr-0 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={onEditDish}
                className="text-blue-600 hover-accent border-gray-200 focus:outline-none focus-visible:outline-none px-2 sm:px-3"
                aria-label="Edit Dish"
                title="Edit Dish"
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Edit Dish</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log('Delete button clicked')
                  console.log('Current showDeleteDishDialog state:', showDeleteDishDialog)
                  setShowDeleteDishDialog(true)
                  console.log('Set showDeleteDishDialog to true')
                }}
                className="text-red-600 hover-destructive px-2 sm:px-3"
                aria-label="Delete Dish"
                title="Delete Dish"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading dish details...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dish Info */}
            <div className="rounded-lg p-4">
              <div className="flex items-start gap-4">
                {dish.base_photo_url && (
                  <img 
                    src={dish.base_photo_url} 
                    alt={dish.title}
                    className="w-24 h-24 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'placeholder.svg'
                    }}
                  />
                )}
                <div className="flex-1">
                  {/* Avoid duplicate title: header already shows dish title */}
                  <h3 className="hidden">{dish.title}</h3>
                  
                  {/* Health Score */}
                  {dish.health_score && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Health Score</span>
                        <span className="font-medium">{dish.health_score}%</span>
                      </div>
                      <Progress value={dish.health_score} className="h-2" />
                    </div>
                  )}

                  {/* Effort Level */}
                  {dish.effort && (
                    <div className="mb-3">
                      <Badge 
                        variant="outline" 
                        className={`text-sm ${getEffortColor(dish.effort)}`}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        {dish.effort} effort
                      </Badge>
                    </div>
                  )}

                  {/* Meal Type */}
                  <div className="mb-3">
                    <Badge variant="outline" className="text-sm">
                      {dish.meal_type}
                    </Badge>
                  </div>

                </div>
              </div>
            </div>

            {/* Base Tags and Dish Notes - aligned to card left, under picture */}
            {baseTags.length > 0 && (
              <div className="mt-1">
                <p className="text-sm font-medium mb-2">Base Tags</p>
                <div className="flex flex-wrap gap-1">
                  {baseTags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {dishNotes && dishNotes.trim() && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-2">Dish Notes</p>
                <p className="text-sm text-muted-foreground">{dishNotes}</p>
              </div>
            )}

            {/* Instances Gallery */}
            <div>
              {/* Only show heading and thumbnails for multi-variant dishes */}
              {instances.length > 1 && (
                <>
                  <h3 className="text-lg font-semibold mb-3">Variants</h3>
                  
                  {/* Instance thumbnails - single-row gallery that swipes on mobile */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 pt-4 pr-4 snap-x snap-mandatory">
                {instances.sort((a, b) => {
                  // Sort by last_consumed (newest first), fallback to datetime
                  const aDate = a.last_consumed || a.datetime
                  const bDate = b.last_consumed || b.datetime
                  return new Date(bDate).getTime() - new Date(aDate).getTime()
                }).map((instance) => (
                  <div key={instance.id} className="relative inline-block">
                    <button
                      onClick={() => setSelectedInstanceId(instance.id)}
                      className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all snap-start ${
                        selectedInstanceId === instance.id 
                          ? 'border-primary shadow-md' 
                          : 'border-gray-200 hover-accent'
                      }`}
                    >
                      {instance.photo_url ? (
                        <img 
                          src={instance.photo_url} 
                          alt={`${dish.title} - ${formatDate(instance.datetime)}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'placeholder.svg'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Camera className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 backdrop-blur-md bg-white/12 text-white text-xs px-3 py-1 text-center rounded-full whitespace-nowrap">
                        <span className="font-semibold drop-shadow-sm">
                          {new Date(instance.last_consumed || instance.datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </button>
                    {(instance.consumption_records?.length || 1) > 1 && (
                      <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 select-none">
                        {/* White ring */}
                        <div className="relative">
                          <div className="h-8 w-8 rounded-full bg-white shadow-lg ring-0.5 ring-black/5 flex items-center justify-center">
                            {/* Inner orange disc */}
                            <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                              <span className="text-white text-sm font-bold leading-none">
                                {instance.consumption_records?.length || 1}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                  </div>
                </>
              )}

              {/* Instance Details - Always show if there are instances */}
              {selectedInstance && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        {/* Variant Title - smaller than main title, match "Variants" heading */}
                        {selectedInstance.variant_title && (
                          <h2 className="text-lg font-semibold text-foreground mb-2">{selectedInstance.variant_title}</h2>
                        )}
                        
                  {/* Consumption Details - Compact on mobile */}
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-x-2">
                    <span>{(selectedInstance.consumption_records?.length || 1)}x consumed</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Last had: {formatDate(selectedInstance.last_consumed || selectedInstance.datetime)}</span>
                  </div>
                      </div>
                      {/* Only show variant edit buttons for multi-variant dishes */}
                      {instances.length > 1 && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(selectedInstance)}
                            className="px-2 sm:px-3"
                            aria-label="Edit Variant"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">Edit Variant</span>
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => setInstanceToDelete(selectedInstance.id)}
                            className="text-red-600 hover-destructive px-2 sm:px-3"
                            aria-label="Delete Variant"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>


                    {/* Instance Photo */}
                    {selectedInstance.photo_url && (
                      <div className="mb-4">
                        <img 
                          src={selectedInstance.photo_url} 
                          alt={`${dish.title} - ${formatDate(selectedInstance.datetime)}`}
                          className="w-full max-h-96 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'placeholder.svg'
                          }}
                        />
                      </div>
                    )}

                    {/* Variant-specific tags */}
                    {selectedInstance.tags && selectedInstance.tags.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Variant Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedInstance.tags.map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Variant Notes */}
                    {selectedInstance.notes && selectedInstance.notes.trim() && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-1">Variant Notes</p>
                        <p className="text-sm text-muted-foreground">{selectedInstance.notes}</p>
                      </div>
                    )}

                    {/* Instance Location */}
                    {selectedInstance.places && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-1">Location</p>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedInstance.places.name}</span>
                        </div>
                      </div>
                    )}

                    {/* Consumption History */}
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-3">Consumption History</p>
                      <div className="space-y-2">
                        {/* Show consumption records if they exist, otherwise show the original instance */}
                        {selectedInstance.consumption_records && selectedInstance.consumption_records.length > 0 ? (
                          selectedInstance.consumption_records
                            .sort((a, b) => new Date(b.consumed_at).getTime() - new Date(a.consumed_at).getTime())
                            .map((record, index) => (
                              <div key={record.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                <div className="flex-1">
                                  {editingConsumptionRecord === record.id ? (
                                    <div className="space-y-2">
                                      <Input
                                        type="date"
                                        value={tempDate || record.consumed_at.split('T')[0]}
                                        max={new Date().toISOString().split('T')[0]} // Prevent future dates
                                        onChange={(e) => {
                                          const selectedDate = e.target.value
                                          const today = new Date().toISOString().split('T')[0]
                                          
                                          // Prevent future dates
                                          if (selectedDate > today) {
                                            setTempDate(today)
                                          } else {
                                            setTempDate(selectedDate)
                                          }
                                        }}
                                        className="text-sm"
                                      />
                                      <LocationInput
                                        value={tempLocation || record.location || ''}
                                        onChange={(value) => {
                                          console.log('Setting tempLocation to:', value)
                                          setTempLocation(value)
                                        }}
                                        placeholder="Location"
                                        className="text-sm"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleSaveConsumptionRecord(record.id)}
                                          className="text-xs"
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingConsumptionRecord(null)
                                            setTempDate('')
                                            setTempLocation('')
                                          }}
                                          className="text-xs"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-sm font-medium">{formatDate(record.consumed_at)}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {record.location || 'No location specified'}
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2"
                                    onClick={() => {
                                      if (editingConsumptionRecord === record.id) {
                                        // Cancel editing
                                        setEditingConsumptionRecord(null)
                                        setTempDate('')
                                        setTempLocation('')
                                      } else {
                                        // Start editing
                                        setEditingConsumptionRecord(record.id)
                                        setTempDate(record.consumed_at.split('T')[0])
                                        setTempLocation(record.location || '')
                                        console.log('Starting edit for record:', record.id, 'with location:', record.location)
                                      }
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover-destructive h-6 px-2"
                                    onClick={async () => {
                                      await checkCascadeDelete(record.id)
                                      setConsumptionRecordToDelete(record.id)
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))
                        ) : (
                          /* Fallback: Show original instance data with edit functionality */
                          <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <div className="flex-1">
                              {editingOriginalInstance ? (
                                <div className="space-y-2">
                                  <Input
                                    type="date"
                                    value={tempDate || selectedInstance.datetime.split('T')[0]}
                                    onChange={(e) => setTempDate(e.target.value)}
                                    className="text-sm"
                                  />
                       <LocationInput
                         value={tempLocation || selectedInstance.location || ''}
                         onChange={setTempLocation}
                         placeholder="Location"
                         className="text-sm"
                       />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={handleSaveOriginalInstance}
                                      className="text-xs"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingOriginalInstance(false)
                                        setTempDate('')
                                        setTempLocation('')
                                      }}
                                      className="text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="text-sm font-medium">{formatDate(selectedInstance.datetime)}</div>
                       <div className="text-xs text-muted-foreground">
                         {selectedInstance.location || 'No location specified'}
                       </div>
                                </>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2"
                                onClick={() => setEditingOriginalInstance(!editingOriginalInstance)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Badge variant="outline" className="text-xs">Original</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* All AlertDialogs moved outside main Dialog to avoid nesting issues */}
    {/* Instance Delete Confirmation Dialog */}
      <AlertDialog open={!!instanceToDelete} onOpenChange={() => setInstanceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this specific variant of "{dish?.title}"? 
              This action cannot be undone, but other variants of this dish will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteInstanceConfirmed}
              disabled={isDeletingInstance}
              className="bg-red-600 hover-destructive"
            >
              {isDeletingInstance ? 'Deleting...' : 'Delete Variant'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dish Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDishDialog} onOpenChange={(open) => {
        console.log('Delete dialog onOpenChange:', open)
        setShowDeleteDishDialog(open)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entire Dish?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{dish?.title}" and ALL of its variants ({instances.reduce((sum, instance) => sum + (instance.consumption_records?.length || 1), 0)} total logs). 
              This includes all photos, notes, and tags associated with this dish.
              <br /><br />
              <strong>This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox 
              id="confirm-delete-all" 
              checked={confirmDeleteAll}
              onCheckedChange={setConfirmDeleteAll}
            />
            <label 
              htmlFor="confirm-delete-all" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand that this will delete the dish and all {instances.reduce((sum, instance) => sum + (instance.consumption_records?.length || 1), 0)} logs permanently
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteAll(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDishConfirmed}
              disabled={!confirmDeleteAll || isDeletingDish}
              className="bg-red-600 hover-destructive"
            >
              {isDeletingDish ? 'Deleting...' : 'Delete Everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Consumption Record Delete Confirmation Dialog */}
      <AlertDialog open={!!consumptionRecordToDelete} onOpenChange={() => {
        setConsumptionRecordToDelete(null)
        setCascadeDeleteType(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {cascadeDeleteType === 'dish' ? 'Delete Entire Dish?' : 
               cascadeDeleteType === 'variant' ? 'Delete Variant?' : 
               'Delete Consumption Record?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cascadeDeleteType === 'dish' ? (
                <>
                  This will permanently delete "{dish?.title}" and ALL of its variants ({instances.reduce((sum, instance) => sum + (instance.consumption_records?.length || 1), 0)} total logs). 
                  This includes all photos, notes, and tags associated with this dish.
                  <br /><br />
                  <strong>This action cannot be undone.</strong>
                </>
              ) : cascadeDeleteType === 'variant' ? (
                <>
                  This will delete this variant and all its consumption records. 
                  The dish will remain with its other variants.
                  <br /><br />
                  <strong>This action cannot be undone.</strong>
                </>
              ) : (
                <>
                  Are you sure you want to delete this consumption record? 
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cascadeDeleteType === 'dish' && (
            <div className="flex items-center space-x-2 py-4">
              <Checkbox 
                id="confirm-delete-all-cascade" 
                checked={confirmDeleteAll}
                onCheckedChange={setConfirmDeleteAll}
              />
              <label 
                htmlFor="confirm-delete-all-cascade" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand that this will delete the dish and all {instances.reduce((sum, instance) => sum + (instance.consumption_records?.length || 1), 0)} logs permanently
              </label>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteAll(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConsumptionRecord}
              disabled={isDeletingConsumptionRecord || (cascadeDeleteType === 'dish' && !confirmDeleteAll)}
              className="bg-red-600 hover-destructive"
            >
              {isDeletingConsumptionRecord ? 'Deleting...' : 
               cascadeDeleteType === 'dish' ? 'Delete Everything' :
               cascadeDeleteType === 'variant' ? 'Delete Variant' :
               'Delete Record'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
