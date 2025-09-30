import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Camera, Upload, X, Loader2, Wand2, Trash2, ArrowLeft } from 'lucide-react'
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
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
  const [hasUploadedPhoto, setHasUploadedPhoto] = useState(false)
  const [aiAnalysisCompleted, setAiAnalysisCompleted] = useState(false)
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
    setAiAnalysisCompleted(false)
    setIsProcessingPhoto(false)
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('File selected:', { 
      name: file.name, 
      type: file.type, 
      size: file.size 
    })

    setAiAnalysisCompleted(false) // Reset AI analysis state for new file
    setHasUploadedPhoto(true)
    setIsProcessingPhoto(true)

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
      console.log('Starting image processing...')
      const result = await processFileAndExtractExif(file)
      console.log('Image processing complete, setting preview...')
      setSelectedFile(result.file)  // Use compressed file for all operations
      
      // Add a small delay to ensure loading animation is visible
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setPreviewUrl(URL.createObjectURL(result.file))  // Use converted file for preview
      console.log('File processed for preview:', result.exifData)
      
      // Show compression info if file was compressed
      if (result.file.size < file.size) {
        const compressionRatio = Math.round((1 - result.file.size / file.size) * 100)
        console.log('Compression successful:', {
          original: `${Math.round(file.size / 1024)}KB`,
          compressed: `${Math.round(result.file.size / 1024)}KB`,
          saved: `${Math.round((file.size - result.file.size) / 1024)}KB`,
          ratio: `${compressionRatio}%`
        })
        // Compression info shown in console only (no toast popup)
      } else {
        console.log('No compression needed:', {
          size: `${Math.round(result.file.size / 1024)}KB`,
          reason: 'File too small or already optimized'
        })
      }
    } catch (error) {
      console.error('Error processing file:', error)
      toast.error('Failed to process image. Please try again.')
    } finally {
      setIsProcessingPhoto(false)
    }
  }

  const analyzeImage = async () => {
    if (!selectedFile) return

    console.log('Starting AI analysis...')
    setIsAnalyzing(true)
    
    // Clear previous AI-generated tags before starting new analysis
    setTags(prev => prev.filter(tag => tag.source !== 'ai'))
    
    const abortController = new AbortController()
    
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

      // Convert to base64 and analyze
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsDataURL(fileToAnalyze)
      })
      
      // Generate a temporary dinner ID for analysis
      const tempDinnerId = `temp-${Date.now()}`
      
      const { data, error } = await supabase.functions.invoke('ai-vision-analysis', {
        body: { 
          imageUrl: base64,
          dinnerId: tempDinnerId
        },
        signal: abortController.signal
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

      console.log('AI analysis completed successfully')
      setAiAnalysisCompleted(true)
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('AI analysis cancelled by user')
        toast.info('AI analysis cancelled')
        // Don't set completed to true if cancelled - user can try again
      } else {
        console.error('AI analysis failed:', error)
        console.log(`AI analysis failed: ${error.message}. You can still save manually.`)
        // Don't set completed to true if failed - user can try again
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const cancelAnalysis = () => {
    setIsAnalyzing(false)
    // Note: We can't actually abort the request here since it's already in progress
    // But we can stop the UI from showing the loading state
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

  // Debug logging
  console.log('AddDinner render state:', {
    open,
    hasUploadedPhoto,
    repeatMealData: !!repeatMealData,
    editDinner: !!editDinner,
    selectedFile: !!selectedFile,
    previewUrl: !!previewUrl
  });

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        resetForm()
      }
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <DialogTitle>
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
            </div>
            {repeatMealData?.action_type === 'log_again' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Go back to dish selection (MealTypeSelector)
                  onOpenChange(false)
                  // Trigger the parent to show MealTypeSelector again
                  setTimeout(() => {
                    // This will be handled by the parent component
                    window.dispatchEvent(new CustomEvent('showMealTypeSelector'))
                  }, 100)
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Photo Upload Section */}
        <div className="space-y-4">
        <div>
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
                  {(repeatMealData?.action_type === 'new_variant' || (!repeatMealData && !editDinner?.isDishEdit)) && !isAnalyzing && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                        setAiAnalysisCompleted(false)
                        setIsProcessingPhoto(false)
                        // Clear file input to allow selecting same file again
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                        // Keep hasUploadedPhoto true to show the form with placeholder
                        // Only reset if it's a repeat meal (where we don't want to show form)
                        if (repeatMealData) setHasUploadedPhoto(false)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : isProcessingPhoto ? (
                // Show loading animation while processing photo
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Processing image...</p>
                  </div>
                </div>
              ) : (
                // Show placeholder for new dishes and new variants when no photo is selected
                (!repeatMealData || repeatMealData?.action_type === 'new_variant') && !editDinner?.isDishEdit && (
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
              
              {(repeatMealData?.action_type === 'new_variant' || (!repeatMealData && !editDinner?.isDishEdit)) && (
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

          {/* AI Analysis Button - Only show for new dishes (not variants) */}
          {selectedFile && previewUrl && !aiAnalysisCompleted && !repeatMealData && !editDinner?.isDishEdit && (
            <div className="w-full">
              {console.log('isAnalyzing state:', isAnalyzing)}
              {isAnalyzing ? (
                <div className="flex items-center justify-center space-x-2 p-4 border rounded-lg bg-muted/50">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">AI is analyzing your image...</span>
                  <Button 
                    onClick={cancelAnalysis}
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-8 px-2"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={analyzeImage} 
                  className="w-full"
                  variant="outline"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  AI Analysis
                </Button>
              )}
            </div>
          )}
          </div>

        {/* Form Fields - Show when modal is open */}
        {open && (
          <div className={`space-y-6 mt-8 ${isAnalyzing ? 'pointer-events-none opacity-50' : ''}`}>
            {/* Title - hidden for Log Again (shown in header) and new variants (shown in dish info) */}
            {repeatMealData?.action_type !== 'log_again' && repeatMealData?.action_type !== 'new_variant' && (
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

          {/* Dish Information - Show for new variants */}
          {repeatMealData?.action_type === 'new_variant' && (
            <div className="space-y-6 p-6 bg-muted/30 rounded-lg border">
              <h3 className="text-base font-semibold text-muted-foreground">Dish Information</h3>
              
              {/* Dish Title and Image */}
              <div className="flex items-center space-x-4">
                {repeatMealData.dish.photos?.[0]?.url && (
                  <img 
                    src={repeatMealData.dish.photos[0].url} 
                    alt={repeatMealData.dish.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-xl">{repeatMealData.dish.title}</p>
                </div>
              </div>

              {/* Health Score */}
              {repeatMealData.dish.health_score !== null && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Health Score</Label>
                  <div className="flex items-center space-x-4">
                    <span className="text-base font-medium min-w-[3rem]">{repeatMealData.dish.health_score}%</span>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full" 
                        style={{ width: `${repeatMealData.dish.health_score}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Effort Level and Meal Type in a row */}
              <div className="flex items-center space-x-8">
                {repeatMealData.dish.effort && (
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium text-gray-700">Effort Level</Label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {repeatMealData.dish.effort} effort
                    </span>
                  </div>
                )}
                {repeatMealData.dish.meal_type && (
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium text-gray-700">Meal Type</Label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {repeatMealData.dish.meal_type}
                    </span>
                  </div>
                )}
              </div>

              {/* Base Tags */}
              {repeatMealData.dish.tags && repeatMealData.dish.tags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium text-gray-700">Base Tags</Label>
                  <div className="flex flex-wrap gap-1">
                    {repeatMealData.dish.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
                    className="h-10 text-base text-left w-[94%] mx-auto sm:w-full"
                  />
                </div>
              )}
              {/* Meal Type - For new dishes and dish editing only */}
              {(!repeatMealData || editDinner?.isDishEdit) && !editDinner?.isVariantEdit && (
                <div className="min-w-0">
                  <Label>Meal Type</Label>
                  <Select value={mealType} onValueChange={(value: any) => setMealType(value)}>
                    <SelectTrigger className="w-[94%] mx-auto sm:w-full">
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
                <div className="min-w-0">
                  <Label htmlFor="location" className={showValidationErrors && !location.trim() ? "text-red-500 font-bold" : ""}>
                    Location *
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where did you have this? (e.g., Home, Restaurant name)"
                    className={(showValidationErrors && !location.trim() ? "border-red-500 " : "") + "h-10 text-base w-[94%] mx-auto sm:w-full"}
                  />
                </div>
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


            {/* Effort Level - For new dishes and dish editing only */}
            {(!repeatMealData || editDinner?.isDishEdit) && !editDinner?.isVariantEdit && (
              <div className="min-w-0">
                <Label>Effort Level</Label>
                <Select value={effort || ''} onValueChange={(value) => setEffort(value as any)}>
                  <SelectTrigger className="w-[94%] mx-auto sm:w-full">
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
                disabled={(!repeatMealData && !editDinner && !selectedFile) || isSaving || isAnalyzing || !title.trim() || ((repeatMealData?.action_type === 'new_variant' || editDinner?.isVariantEdit) && !variantTitle.trim()) || (!editDinner?.isDishEdit && !editDinner?.isVariantEdit && !(editDinner && editDinner.count > 1) && !location.trim())}
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
