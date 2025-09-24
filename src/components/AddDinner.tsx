import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Camera, Upload, X, Loader2, Wand2, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Dish, DinnerInstance } from '@/lib/supabase'
import { toast } from 'sonner'
import { processFileAndExtractExif, extractExifData } from '@/lib/exif'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { LocationInput } from '@/components/LocationInput'

interface PreviousDish {
  dish: Dish
  frequency: number
  last_eaten: string
  sample_photo_url?: string
  places?: string[]
  latest_instance?: DinnerInstance
  selected_variant?: DinnerInstance
  action_type?: 'log_again' | 'new_variant'
}

interface AddDinnerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editDinner?: any // When editing an existing dinner/instance
  repeatMealData?: PreviousDish // When logging a previous meal
  initialTitle?: string // Pre-fill title from search
  onSave?: () => void
}

interface Tag {
  name: string
  type: 'ingredient' | 'cuisine' | 'dish' | 'diet' | 'method' | 'course' | 'custom'
  source: 'ai' | 'user'
  is_base_tag: boolean
}

export const AddDinner: React.FC<AddDinnerProps> = ({ 
  open, 
  onOpenChange, 
  editDinner,
  repeatMealData, 
  initialTitle,
  onSave 
}) => {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [variantTitle, setVariantTitle] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [dinnerDate, setDinnerDate] = useState('')
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'other'>('dinner')
  const [effort, setEffort] = useState<'easy' | 'medium' | 'hard' | null>(null)
  const [healthScore, setHealthScore] = useState<number | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [newTagInput, setNewTagInput] = useState('')
  
  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasUploadedPhoto, setHasUploadedPhoto] = useState(false)
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null)

  // Initialize form based on mode
  useEffect(() => {
    if (open) {
      if (editDinner) {
        // Edit existing dinner/instance
        setTitle(editDinner.title || '')
        setVariantTitle(editDinner.variant_title || '')
        setHealthScore(editDinner.health_score || null)
        setEffort(editDinner.effort || null)
        setMealType(editDinner.meal_type || 'dinner')
        setDinnerDate(editDinner.datetime || new Date().toISOString().slice(0, 16))
        setLocation(editDinner.location || '')
        setNotes(editDinner.notes || '')
        setTags(editDinner.tags || [])
        
        // Handle photo
        if (editDinner.photos && editDinner.photos.length > 0) {
          setPreviewUrl(editDinner.photos[0].url)
          setHasUploadedPhoto(true)
        }
        
        // Show attributes immediately for editing
        setHasUploadedPhoto(true)
      } else if (repeatMealData) {
        // Pre-fill for repeat meal
        setTitle(repeatMealData.dish.title)
        setHealthScore(repeatMealData.dish.health_score || null)
        setEffort(repeatMealData.dish.effort || null)
        
        // Handle different action types
        if (repeatMealData.action_type === 'log_again' && repeatMealData.selected_variant) {
          // Log Again: Only allow editing date & location
          const variant = repeatMealData.selected_variant
          setDinnerDate(new Date().toISOString().slice(0, 16)) // Current time
          setLocation(variant.location || '') // Pre-fill location from existing variant
          setNotes(variant.notes || '') // Pre-fill notes from existing variant
          setVariantTitle(variant.variant_title || '') // Pre-fill variant title
          setMealType(repeatMealData.dish.meal_type) // Dish-level meal type
          // Keep existing photo
          if (variant.photo_url) {
            setPreviewUrl(variant.photo_url)
            setHasUploadedPhoto(true)
          }
        } else if (repeatMealData.selected_variant) {
          // Create New Variant: Pre-fill but allow photo upload
          const variant = repeatMealData.selected_variant
          setDinnerDate(new Date().toISOString().slice(0, 16))
          setLocation('') // Start fresh for location
          setNotes('') // Start fresh for notes
          setMealType(repeatMealData.dish.meal_type)
          // Don't pre-fill photo for new variants
        } else {
          // New variant of existing dish
          setDinnerDate(new Date().toISOString().slice(0, 16))
          setLocation('')
          setNotes('')
          setMealType(repeatMealData.dish.meal_type)
        }
        
        setTags([]) // Start fresh - user can add instance-specific tags
        if (!repeatMealData.selected_variant || repeatMealData.action_type !== 'log_again') {
          setHasUploadedPhoto(true) // Show attributes immediately for new variants
        }
      } else {
        // Reset for new dish
        resetForm()
        // Pre-fill title if provided from search
        if (initialTitle) {
          setTitle(initialTitle)
        }
      }
    }
  }, [open, editDinner, repeatMealData, initialTitle])

  const resetForm = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setTitle('')
    setVariantTitle('')
    setLocation('')
    setNotes('')
    setDinnerDate(new Date().toISOString().slice(0, 16))
    setMealType('dinner')
    setEffort(null)
    setHealthScore(null)
    setTags([])
    setNewTagInput('')
    setHasUploadedPhoto(false)
    setShowValidationErrors(false)
    setCurrentLocation(null)
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('File selected:', { 
      name: file.name, 
      type: file.type, 
      size: file.size 
    })

    setSelectedFile(file)
    setHasUploadedPhoto(true)

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          console.log('Location obtained:', position.coords)
        },
        (error) => {
          console.log('Geolocation failed (will use manual input):', error.message)
          setCurrentLocation(null)
        }
      )
    }

    try {
      const result = await processFileAndExtractExif(file)
      setPreviewUrl(URL.createObjectURL(file))
      console.log('File processed for preview:', result.exifData)
    } catch (error) {
      console.error('Error processing file:', error)
      toast.error('Failed to process image. Please try again.')
    }
  }

  const analyzeImage = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    try {
      // Convert HEIC if needed
      let fileToAnalyze = selectedFile
      const isHEIC = selectedFile.type === 'image/heic' || selectedFile.type === 'image/heif' || 
                     selectedFile.name.toLowerCase().endsWith('.heic') || selectedFile.name.toLowerCase().endsWith('.heif')
      
      if (isHEIC) {
        const { convertHeicForPreview } = await import('@/lib/exif')
        try {
          const convertedFile = await convertHeicForPreview(selectedFile)
          if (convertedFile) {
            fileToAnalyze = convertedFile
          }
        } catch (error) {
          console.error('HEIC conversion failed:', error)
          toast.error('Cannot analyze HEIC images. Please convert to JPEG first.')
          return
        }
      }

      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        
        const { data, error } = await supabase.functions.invoke('ai-vision-analysis', {
          body: { image: base64 }
        })

        if (error) throw error

        // Apply AI suggestions
        console.log('AI response data:', data)
        if (data.suggested_title) {
          console.log('Setting title to:', data.suggested_title)
          setTitle(data.suggested_title)
        }
        if (data.health_score) {
          console.log('Setting health score to:', data.health_score)
          setHealthScore(data.health_score)
        }
        if (data.suggested_tags) {
          console.log('Adding tags:', data.suggested_tags)
          const aiTags: Tag[] = data.suggested_tags.map((tag: any) => ({
            name: tag.name.toLowerCase(),
            type: tag.type || 'custom',
            source: 'ai' as const,
            is_base_tag: !repeatMealData // Base tags for new dishes, instance tags for repeats
          }))
          setTags(prev => [...prev, ...aiTags])
        }

        toast.success('AI analysis complete! Review and adjust the suggestions.')
      }
      reader.readAsDataURL(fileToAnalyze)
    } catch (error: any) {
      console.error('AI analysis failed:', error)
      toast.error(`AI analysis failed: ${error.message}. You can still save manually.`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim()
    console.log('Adding tag:', trimmedTag)
    console.log('Current tags:', tags)
    console.log('Tag comparison:', tags.some(tag => tag.name.toLowerCase() === trimmedTag.toLowerCase()))
    
    if (trimmedTag && !tags.some(tag => tag.name.toLowerCase() === trimmedTag.toLowerCase())) {
      setTags(prev => [...prev, {
        name: trimmedTag.toLowerCase(),
        type: 'custom',
        source: 'user',
        is_base_tag: !repeatMealData // Base tags for new dishes, instance tags for repeats
      }])
      setNewTagInput('')
      console.log('Tag added successfully')
    } else {
      console.log('Tag not added - either empty or duplicate')
    }
  }

  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!user) return

    // Validation
    const isDishEdit = editDinner?.isDishEdit
    const isVariantEdit = editDinner?.isVariantEdit
    const isMultiCountVariant = editDinner && editDinner.count > 1
    
    const requireTitle = !(repeatMealData?.action_type === 'log_again')
    if ((requireTitle && !title.trim()) || ((repeatMealData?.action_type === 'new_variant' || isVariantEdit) && !variantTitle.trim()) || (!isDishEdit && !isVariantEdit && !isMultiCountVariant && !location.trim())) {
      setShowValidationErrors(true)
      if (requireTitle && !title.trim()) {
        toast.error('Please enter a title')
      }
      if ((repeatMealData?.action_type === 'new_variant' || isVariantEdit) && !variantTitle.trim()) {
        toast.error('Please enter a variant title')
      }
      if (!isDishEdit && !isVariantEdit && !isMultiCountVariant && !location.trim()) {
        toast.error('Please enter a location')
      }
      return
    }

    // For brand new dishes (not repeats or edits), require a photo
    if (!repeatMealData && !editDinner && !selectedFile) {
      toast.error('Please upload a photo for new dishes')
      return
    }

    // For dish editing, require a photo selection (either current or variant photo)
    if (isDishEdit && !previewUrl) {
      toast.error('Please select a photo for the dish')
      return
    }

    setIsSaving(true)

    try {
      let photoUrl = null

      // Upload photo if provided
      if (selectedFile) {
        let fileToUpload = selectedFile

        // Convert HEIC to JPEG for storage
        const isHEIC = selectedFile.type === 'image/heic' || selectedFile.type === 'image/heif' || 
                       selectedFile.name.toLowerCase().endsWith('.heic') || selectedFile.name.toLowerCase().endsWith('.heif')
        
        if (isHEIC) {
          const { convertHeicForPreview } = await import('@/lib/exif')
          try {
            const convertedFile = await convertHeicForPreview(selectedFile)
            if (convertedFile) {
              fileToUpload = convertedFile
            }
          } catch (error) {
            console.warn('HEIC conversion failed, uploading original:', error)
          }
        }

        const fileName = `${user.id}/${Date.now()}-${fileToUpload.name}`
        const { error: uploadError } = await supabase.storage
          .from('dinner-photos')
          .upload(fileName, fileToUpload)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('dinner-photos')
          .getPublicUrl(fileName)

        photoUrl = publicUrl
      }

      // Handle variant-level editing
      if (editDinner?.isVariantEdit) {
        // Update variant-level properties only
        const { error: variantUpdateError } = await supabase
          .from('dinner_instances')
          .update({
            variant_title: variantTitle, // Variant title
            notes: notes, // Variant notes
            photo_url: photoUrl || editDinner.photos?.[0]?.url, // Variant image
            updated_at: new Date().toISOString()
          })
          .eq('id', editDinner.id)
          .eq('user_id', user.id)

        if (variantUpdateError) throw variantUpdateError

        // Update variant tags
        if (tags.length > 0) {
          // Delete existing variant tags
          await supabase
            .from('tags')
            .delete()
            .eq('instance_id', editDinner.id)
            .eq('is_base_tag', false)

          // Insert new variant tags
          const { error: tagsError } = await supabase
            .from('tags')
            .insert(
              tags.map(tag => ({
                instance_id: editDinner.id,
                name: tag.name.toLowerCase(),
                type: tag.type,
                source: tag.source,
                is_base_tag: false,
                approved: true
              }))
            )

          if (tagsError) throw tagsError
        }

        toast.success('Variant updated successfully!')
        onSave?.()
        onOpenChange(false)
        return
      }

      // Handle dish-level editing
      if (editDinner?.isDishEdit) {
        // Use selected photo URL (either uploaded or selected from variants)
        const selectedPhotoUrl = photoUrl || previewUrl
        
        console.log('Updating dish with:', {
          title: title.trim(),
          health_score: healthScore,
          effort: effort,
          meal_type: mealType,
          notes: notes,
          base_photo_url: selectedPhotoUrl,
          editDinnerId: editDinner.id
        })
        
        // Update dish-level properties
        const { error: dishUpdateError } = await supabase
          .from('dishes')
          .update({
            title: title.trim(),
            health_score: healthScore,
            effort: effort,
            meal_type: mealType,
            notes: notes,
            base_photo_url: selectedPhotoUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', editDinner.id)
          .eq('user_id', user.id)

        if (dishUpdateError) throw dishUpdateError

        // Update base tags
        if (tags.length > 0) {
          // Delete existing base tags
          await supabase
            .from('tags')
            .delete()
            .eq('dish_id', editDinner.id)
            .eq('is_base_tag', true)

          // Insert new base tags
          const { error: tagsError } = await supabase
            .from('tags')
            .insert(
              tags.map(tag => ({
                dish_id: editDinner.id,
                name: tag.name.toLowerCase(),
                type: tag.type,
                source: tag.source,
                is_base_tag: true,
                approved: true
              }))
            )

          if (tagsError) throw tagsError
        }

        toast.success('Dish updated successfully!')
        onSave?.()
        onOpenChange(false)
        return
      }

      let dishData: Dish, instanceData: DinnerInstance

      if (repeatMealData) {
        dishData = repeatMealData.dish

        if (repeatMealData.action_type === 'log_again' && repeatMealData.selected_variant) {
                 // Log Again: Create a new consumption record
          
          const { data: newConsumptionRecord, error: consumptionError } = await supabase
            .from('consumption_records')
            .insert({
              instance_id: repeatMealData.selected_variant.id,
              user_id: user.id,
              consumed_at: new Date(dinnerDate).toISOString(),
              location: location.toLowerCase()
            })
            .select()
            .single()

          if (consumptionError) throw consumptionError

          // Update the instance count and last_consumed
          const { data: updatedInstance, error: updateError } = await supabase
            .from('dinner_instances')
            .update({
              count: (repeatMealData.selected_variant.count || 1) + 1,
              last_consumed: new Date(dinnerDate).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', repeatMealData.selected_variant.id)
            .eq('user_id', user.id)
            .select()
            .single()

          if (updateError) throw updateError
          instanceData = updatedInstance
        } else {
          // Create New Variant: Insert new instance
          const { data: newInstance, error: instanceError } = await supabase
            .from('dinner_instances')
            .insert({
              dish_id: dishData.id,
              user_id: user.id,
              datetime: new Date(dinnerDate).toISOString(),
              location: location.toLowerCase(),
              variant_title: variantTitle,
              notes: notes,
              photo_url: photoUrl,
              count: 1,
              last_consumed: new Date(dinnerDate).toISOString()
            })
            .select()
            .single()

          if (instanceError) throw instanceError
          instanceData = newInstance

                 // Create initial consumption record for the new variant
          
          const { error: consumptionError } = await supabase
            .from('consumption_records')
            .insert({
              instance_id: newInstance.id,
              user_id: user.id,
              consumed_at: new Date(dinnerDate).toISOString(),
              location: location.toLowerCase()
            })

          if (consumptionError) throw consumptionError
        }

        // Add instance-specific tags
        if (tags.length > 0) {
          const { error: tagsError } = await supabase
            .from('tags')
            .insert(
              tags.map(tag => ({
                instance_id: instanceData.id,
                name: tag.name.toLowerCase(),
                type: tag.type,
                source: tag.source,
                is_base_tag: false,
                approved: true
              }))
            )

          if (tagsError) throw tagsError
        }

        toast.success(`Logged ${dishData.title} again!`)
      } else {
        // Create new dish + first instance
        const { data: newDish, error: dishError } = await supabase
          .from('dishes')
          .insert({
            user_id: user.id,
            title: title || 'Untitled Dish',
            base_photo_url: photoUrl,
            health_score: healthScore,
            effort: effort,
            meal_type: mealType
          })
          .select()
          .single()

        if (dishError) throw dishError
        dishData = newDish

               const { data: newInstance, error: instanceError } = await supabase
                 .from('dinner_instances')
                 .insert({
                   dish_id: dishData.id,
                   user_id: user.id,
                   datetime: new Date(dinnerDate).toISOString(),
                   location: location.toLowerCase(),
                   notes: notes,
                   photo_url: photoUrl,
                   count: 1,
                   last_consumed: new Date(dinnerDate).toISOString()
                 })
          .select()
          .single()

        if (instanceError) throw instanceError
        instanceData = newInstance

        // Add base tags for new dish
        if (tags.length > 0) {
          const baseTags = tags.filter(tag => tag.is_base_tag)
          const instanceTags = tags.filter(tag => !tag.is_base_tag)

          if (baseTags.length > 0) {
            const { error: baseTagsError } = await supabase
              .from('tags')
              .insert(
                baseTags.map(tag => ({
                  dish_id: dishData.id,
                  name: tag.name.toLowerCase(),
                  type: tag.type,
                  source: tag.source,
                  is_base_tag: true,
                  approved: true
                }))
              )

            if (baseTagsError) throw baseTagsError
          }

          if (instanceTags.length > 0) {
            const { error: instanceTagsError } = await supabase
              .from('tags')
              .insert(
                instanceTags.map(tag => ({
                  instance_id: instanceData.id,
                  name: tag.name.toLowerCase(),
                  type: tag.type,
                  source: tag.source,
                  is_base_tag: false,
                  approved: true
                }))
              )

            if (instanceTagsError) throw instanceTagsError
          }
        }

               // Create initial consumption record for the new dish
        
        const { error: consumptionError } = await supabase
          .from('consumption_records')
          .insert({
            instance_id: newInstance.id,
            user_id: user.id,
            consumed_at: new Date(dinnerDate).toISOString(),
            location: location.toLowerCase()
          })

        if (consumptionError) throw consumptionError

        // Save photo metadata
        if (photoUrl && selectedFile) {
          try {
            const exifData = await extractExifData(selectedFile)
            const { error: photoError } = await supabase
              .from('photos')
              .insert({
                instance_id: instanceData.id,
                url: photoUrl,
                width: exifData.width || 0,
                height: exifData.height || 0,
                exif_lat: exifData.latitude || currentLocation?.latitude || null,
                exif_lon: exifData.longitude || currentLocation?.longitude || null,
                exif_time: exifData.timestamp || null
              })

            if (photoError) console.warn('Photo metadata save failed:', photoError)
          } catch (error) {
            console.warn('EXIF extraction failed:', error)
          }
        }

        toast.success(`Created new dish: ${dishData.title}!`)
      }

      // Success - close and refresh
      resetForm()
      onOpenChange(false)
      if (onSave) onSave()

    } catch (error: any) {
      console.error('Save failed:', error)
      toast.error(`Save failed: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        resetForm()
      }
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
         <DialogTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
           {editDinner?.isDishEdit 
             ? `Edit Dish: ${editDinner.title}`
             : editDinner?.isVariantEdit
               ? `Edit Variant: ${editDinner.title}`
               : repeatMealData?.action_type === 'log_again' 
                 ? `Log Again: ${repeatMealData.dish.title}` 
                 : repeatMealData 
                   ? `New Variant: ${repeatMealData.dish.title}`
                   : 'Add New Dish'}
         </DialogTitle>
        </DialogHeader>

        {/* Photo Upload Section */}
        <div className="space-y-4">
        <div>
            {repeatMealData?.action_type !== 'log_again' && (
              <Label>Photo {!repeatMealData && '*'}</Label>
            )}
            <div className="mt-2">
              {/* Show photo selection for dish editing */}
              {editDinner?.isDishEdit && editDinner?.variantPhotos && editDinner.variantPhotos.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Choose a photo from existing variants to represent this dish:
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Current base photo */}
                    <div 
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                        previewUrl === editDinner.photos?.[0]?.url ? 'border-primary' : 'border-gray-200'
                      }`}
                      onClick={() => {
                        setPreviewUrl(editDinner.photos?.[0]?.url || null)
                        setSelectedFile(null)
                      }}
                    >
                      <img 
                        src={editDinner.photos?.[0]?.url || 'placeholder.svg'} 
                        alt="Current base photo" 
                        className="w-full h-24 object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
                        Current Base Photo
                      </div>
                    </div>
                    
                    {/* Variant photos */}
                    {editDinner.variantPhotos.map((variantPhoto, index) => (
                      <div 
                        key={index}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                          previewUrl === variantPhoto.url ? 'border-primary' : 'border-gray-200'
                        }`}
                        onClick={() => {
                          setPreviewUrl(variantPhoto.url)
                          setSelectedFile(null)
                        }}
                      >
                        <img 
                          src={variantPhoto.url} 
                          alt={`Variant: ${variantPhoto.variant_title || 'Untitled'}`} 
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
                          {variantPhoto.variant_title || 'Variant'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {repeatMealData?.action_type !== 'log_again' && !editDinner?.isDishEdit && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                        if (!repeatMealData) setHasUploadedPhoto(false)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                repeatMealData?.action_type !== 'log_again' && !editDinner?.isDishEdit && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Photo
                      </Button>
                    </div>
              </div>
                )
              )}
              
              {repeatMealData?.action_type !== 'log_again' && !editDinner?.isDishEdit && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,image/heic,image/heif,.heic,.heif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
            )}
          </div>
        </div>

          {/* AI Analysis Button */}
          {selectedFile && repeatMealData?.action_type !== 'log_again' && !editDinner?.isDishEdit && (
            <Button 
              onClick={analyzeImage} 
              disabled={isAnalyzing}
              className="w-full"
              variant="outline"
            >
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
            </Button>
          )}
          </div>

        {/* Form Fields - Show after photo upload or for repeat meals */}
        {(hasUploadedPhoto || repeatMealData) && (
          <div className="space-y-4">
            {/* Title - hidden for Log Again (shown in header) */}
            {repeatMealData?.action_type !== 'log_again' && (
              <div>
                <Label htmlFor="title" className={showValidationErrors && !title.trim() ? "text-red-500 font-bold" : ""}>
                  Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What did you eat?"
                  className={(showValidationErrors && !title.trim() ? "border-red-500 " : "") + "w-[94%] mx-auto sm:w-full"}
                  disabled={!!repeatMealData || editDinner?.isVariantEdit}
                />
              </div>
            )}

          {/* Variant Title - Show editable for new variants/variant edit; show read-only for log again */}
          {(repeatMealData?.action_type === 'new_variant' || editDinner?.isVariantEdit) && (
            <div className="space-y-2">
              <Label htmlFor="variant-title" className={showValidationErrors && !variantTitle.trim() ? "text-red-500 font-bold" : ""}>
                Variant Title *
              </Label>
              <Input
                id="variant-title"
                value={variantTitle}
                onChange={(e) => setVariantTitle(e.target.value)}
                placeholder="e.g., Margherita Pizza, Spicy Chicken, etc."
                className={(showValidationErrors && !variantTitle.trim() ? "border-red-500 " : "") + "w-[94%] mx-auto sm:w-full"}
              />
            </div>
          )}
          {repeatMealData?.action_type === 'log_again' && repeatMealData?.selected_variant?.variant_title && (
            <div>
              <Label>Variant</Label>
              <Input value={repeatMealData.selected_variant.variant_title} disabled className="bg-muted/40" />
            </div>
          )}

            {/* Date & Meal Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date/Time - Hide for dish editing, variant editing, and multi-count variant editing */}
              {!editDinner?.isDishEdit && !editDinner?.isVariantEdit && !(editDinner && editDinner.count > 1) && (
                <div className="min-w-0">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={dinnerDate.split('T')[0]}
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    onChange={(e) => {
                      const selectedDate = e.target.value
                      const today = new Date().toISOString().split('T')[0]
                      
                      // Prevent future dates
                      if (selectedDate > today) {
                        setDinnerDate(today + 'T12:00')
                      } else {
                        setDinnerDate(selectedDate + 'T12:00')
                      }
                    }}
                    className="h-10 text-base text-left date-input w-[94%] mx-auto sm:w-full"
                  />
                </div>
              )}
              {/* Meal Type - For new dishes and dish editing only */}
              {(!repeatMealData || editDinner?.isDishEdit) && !editDinner?.isVariantEdit && (
                <div className="min-w-0">
                  <Label>Meal Type</Label>
                  <Select value={mealType} onValueChange={(value: any) => setMealType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

         {/* Location - Hide for dish editing, variant editing, and multi-count variant editing */}
         {!editDinner?.isDishEdit && !editDinner?.isVariantEdit && !(editDinner && editDinner.count > 1) && (
           <LocationInput
             value={location}
             onChange={setLocation}
             placeholder="Where did you have this? (e.g., Home, Restaurant name)"
             label="Location"
             required={true}
             showValidationError={showValidationErrors}
             className="sm:col-span-2 min-w-0 w-[94%] mx-auto sm:w-full"
           />
         )}
            </div>

            {/* Health Score - For new dishes and dish editing only */}
            {(!repeatMealData || editDinner?.isDishEdit) && !editDinner?.isVariantEdit && (
              <div>
                <Label>Health Score {healthScore !== null ? `(${healthScore}%)` : ''}</Label>
                <div className="mt-2">
                  <Slider
                    value={[healthScore || 50]}
                    onValueChange={(values) => setHealthScore(values[0])}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Unhealthy</span>
                    <span>Very Healthy</span>
                  </div>
                </div>
              </div>
            )}

            {/* Show existing health score for variants (read-only) - not shown for log again */}
            {repeatMealData && repeatMealData.action_type !== 'log_again' && repeatMealData.dish.health_score && (
              <div>
                <Label>Health Score (from main dish)</Label>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <div className="text-sm font-medium">{repeatMealData.dish.health_score}% healthy</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Health score is set at the dish level
                  </div>
                </div>
              </div>
            )}

            {/* Effort Level - For new dishes and dish editing only */}
            {(!repeatMealData || editDinner?.isDishEdit) && !editDinner?.isVariantEdit && (
              <div>
                <Label>Effort Level</Label>
                <Select value={effort || ''} onValueChange={(value) => setEffort(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How hard was it to make?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tags - Hide for log again mode */}
            {repeatMealData?.action_type !== 'log_again' && (
          <div>
                <Label>Tags {repeatMealData && !editDinner?.isDishEdit && !editDinner?.isVariantEdit && '(Additional)'}</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant={tag.source === 'ai' ? 'secondary' : 'default'}
                        className="flex items-center gap-1"
                      >
                        {tag.name}
                        <button
                          onClick={() => removeTag(index)}
                          className="ml-1 text-xs hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
            <div className="flex gap-2">
              <Input
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder={repeatMealData ? "Add variant-specific tags..." : "Add tags..."}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag(newTagInput)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addTag(newTagInput)}
                      disabled={!newTagInput.trim()}
                    >
                      Add
              </Button>
            </div>
          </div>
              </div>
            )}

         {/* Notes - Hide for log again mode */}
         {repeatMealData?.action_type !== 'log_again' && (
          <div>
             <Label htmlFor="notes">Notes</Label>
            <Textarea
               id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
               placeholder="Any additional notes..."
              rows={3}
              className="w-[94%] mx-auto sm:w-full"
            />
          </div>
         )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm()
                  onOpenChange(false)
                }}
                disabled={isSaving}
              >
                Cancel
          </Button>
              <Button 
                onClick={handleSave} 
                disabled={(!repeatMealData && !editDinner && !selectedFile) || isSaving || !title.trim() || ((repeatMealData?.action_type === 'new_variant' || editDinner?.isVariantEdit) && !variantTitle.trim()) || (!editDinner?.isDishEdit && !editDinner?.isVariantEdit && !(editDinner && editDinner.count > 1) && !location.trim())}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editDinner?.isDishEdit
                  ? 'Save Dish'
                  : editDinner?.isVariantEdit
                    ? 'Save Variant'
                    : repeatMealData?.action_type === 'log_again' 
                      ? 'Log Again (+1)' 
                      : repeatMealData 
                        ? 'Save Variant' 
                        : 'Save Dish'}
          </Button>
        </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
