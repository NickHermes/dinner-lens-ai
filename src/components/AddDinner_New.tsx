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

interface PreviousDish {
  dish: Dish
  frequency: number
  last_eaten: string
  sample_photo_url?: string
  places?: string[]
  latest_instance?: DinnerInstance
}

interface AddDinnerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repeatMealData?: PreviousDish // When logging a previous meal
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
  repeatMealData, 
  onSave 
}) => {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
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
      if (repeatMealData) {
        // Pre-fill for repeat meal
        setTitle(repeatMealData.dish.title)
        setHealthScore(repeatMealData.dish.health_score || null)
        setDinnerDate(new Date().toISOString().slice(0, 16))
        setNotes('')
        setEffort(null)
        setMealType('dinner')
        setTags([]) // Start fresh - user can add instance-specific tags
        setHasUploadedPhoto(true) // Show attributes immediately
      } else {
        // Reset for new dish
        resetForm()
      }
    }
  }, [open, repeatMealData])

  const resetForm = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setTitle('')
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
      setPreviewUrl(result.previewUrl)
      console.log('File processed for preview:', result.metadata)
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
        if (data.suggested_title && !title.trim()) {
          setTitle(data.suggested_title)
        }
        if (data.health_score) {
          setHealthScore(data.health_score)
        }
        if (data.suggested_tags) {
          const aiTags: Tag[] = data.suggested_tags.map((tag: any) => ({
            name: tag.name,
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
    if (tagName.trim() && !tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      setTags(prev => [...prev, {
        name: tagName.trim().toLowerCase(),
        type: 'custom',
        source: 'user',
        is_base_tag: !repeatMealData // Base tags for new dishes, instance tags for repeats
      }])
      setNewTagInput('')
    }
  }

  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!user) return

    // Validation
    if (!title.trim()) {
      setShowValidationErrors(true)
      return
    }

    // For brand new dishes (not repeats), require a photo
    if (!repeatMealData && !selectedFile) {
      toast.error('Please upload a photo for new dishes')
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

      let dishData: Dish, instanceData: DinnerInstance

      if (repeatMealData) {
        // Create new instance for existing dish
        dishData = repeatMealData.dish

        const { data: newInstance, error: instanceError } = await supabase
          .from('dinner_instances')
          .insert({
            dish_id: dishData.id,
            user_id: user.id,
            datetime: new Date(dinnerDate).toISOString(),
            notes: notes,
            meal_type: mealType,
            effort: effort,
            photo_url: photoUrl
          })
          .select()
          .single()

        if (instanceError) throw instanceError
        instanceData = newInstance

        // Add instance-specific tags
        if (tags.length > 0) {
          const { error: tagsError } = await supabase
            .from('tags')
            .insert(
              tags.map(tag => ({
                instance_id: instanceData.id,
                name: tag.name,
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
            health_score: healthScore
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
            notes: notes,
            meal_type: mealType,
            effort: effort,
            photo_url: photoUrl
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
            {repeatMealData ? `Log ${repeatMealData.dish.title} Again` : 'Add New Dish'}
          </DialogTitle>
        </DialogHeader>

        {/* Photo Upload Section */}
        <div className="space-y-4">
          <div>
            <Label>Photo {!repeatMealData && '*'}</Label>
            <div className="mt-2">
              {previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
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
                </div>
              ) : (
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
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,image/heic,image/heif,.heic,.heif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* AI Analysis Button */}
          {selectedFile && (
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
            {/* Title */}
            <div>
              <Label htmlFor="title" className={showValidationErrors && !title.trim() ? "text-red-500 font-bold" : ""}>
                Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What did you eat?"
                className={showValidationErrors && !title.trim() ? "border-red-500" : ""}
                disabled={!!repeatMealData} // Disable for repeat meals
              />
            </div>

            {/* Date & Meal Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date & Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={dinnerDate}
                  max={new Date().toISOString().slice(0, 16)} // Prevent future dates
                  onChange={(e) => {
                    const selectedDateTime = e.target.value
                    const now = new Date().toISOString().slice(0, 16)
                    
                    // Prevent future dates/times
                    if (selectedDateTime > now) {
                      setDinnerDate(now)
                    } else {
                      setDinnerDate(selectedDateTime)
                    }
                  }}
                />
              </div>
              <div>
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
            </div>

            {/* Health Score */}
            {healthScore !== null && (
              <div>
                <Label>Health Score</Label>
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${healthScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{healthScore}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Effort Level */}
            <div>
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

            {/* Tags */}
            <div>
              <Label>Tags {repeatMealData && '(Additional)'}</Label>
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

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

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
                disabled={(!repeatMealData && !selectedFile) || isSaving || !title.trim()}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {repeatMealData ? 'Log Again' : 'Save Dish'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
