import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Camera, Upload, X, MapPin, Clock, Tag, Loader2, Wand2, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { getHealthScoreBadgeVariant, getHealthScoreBadgeClass } from '@/lib/utils'
import { extractExifData } from '@/lib/exif'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface NewPlaceFormProps {
  onSave: (place: Place, isDefault: boolean) => void
  onCancel: () => void
}

const NewPlaceForm = ({ onSave, onCancel }: NewPlaceFormProps) => {
  const [placeName, setPlaceName] = useState('')
  const [placeType, setPlaceType] = useState<'friend' | 'restaurant' | 'other'>('friend')
  const [isDefault, setIsDefault] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuth()

  const handleSave = async () => {
    if (!placeName.trim() || !user) return

    try {
      setIsSaving(true)

      // Create new place in database
      const { data, error } = await supabase
        .from('places')
        .insert({
          user_id: user.id,
          name: placeName.trim(),
          type: placeType,
          lat: 0, // Default coordinates - user can update later
          lon: 0,
          radius_m: 150
        })
        .select()
        .single()

      if (error) throw error

      const newPlace: Place = {
        id: data.id,
        name: data.name,
        type: data.type,
        lat: data.lat,
        lon: data.lon,
        radius_m: data.radius_m
      }

      onSave(newPlace, isDefault)
      toast.success('Place added successfully')

    } catch (error) {
      console.error('Save place error:', error)
      toast.error('Failed to save place')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="place-name">Place Name</Label>
        <Input
          id="place-name"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          placeholder="e.g., Anna's House, Pizza Palace"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="place-type">Type</Label>
        <Select value={placeType} onValueChange={(value: any) => setPlaceType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="friend">Friend's Place</SelectItem>
            <SelectItem value="restaurant">Restaurant</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-default"
          checked={isDefault}
          onCheckedChange={(checked) => setIsDefault(!!checked)}
        />
        <Label htmlFor="is-default" className="text-sm">
          Add as default place
        </Label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={!placeName.trim() || isSaving}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Place
        </Button>
      </div>
    </div>
  )
}

interface Tag {
  name: string
  type: 'ingredient' | 'cuisine' | 'dish' | 'diet' | 'method' | 'course' | 'custom'
  source: 'ai' | 'user'
}

interface Place {
  id: string
  name: string
  type: 'home' | 'friend' | 'restaurant' | 'other'
  lat: number
  lon: number
  radius_m: number
}

interface AddDinnerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editDinner?: {
      id: string
  title: string
  datetime: string
  place_id?: string
  notes: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'other'
  deliciousness?: number
  effort?: 'easy' | 'medium' | 'hard'
  health_score?: number
  photos: { url: string }[]
  tags: { name: string; type: string; source: string; approved: boolean }[]
  }
  onSave?: () => void
}

export const AddDinner: React.FC<AddDinnerProps> = ({ open, onOpenChange, editDinner, onSave }) => {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [dinnerDate, setDinnerDate] = useState<string>(new Date().toISOString().slice(0, 10) + 'T12:00')
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'other'>('dinner')
  const [tags, setTags] = useState<Tag[]>([])
  const [newTagInput, setNewTagInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [healthScore, setHealthScore] = useState<number | null>(null)
  const [hasUploadedPhoto, setHasUploadedPhoto] = useState(false)
  const [deliciousness, setDeliciousness] = useState<number | null>(null)
  const [effort, setEffort] = useState<'easy' | 'medium' | 'hard' | null>(null)

  // Default places - Home is always available
  const defaultPlaces: Place[] = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Home', type: 'home', lat: 37.7749, lon: -122.4194, radius_m: 150 },
  ]
  
  // User's custom places (will be fetched from database)
  const [userPlaces, setUserPlaces] = useState<Place[]>([])
  // Track which places should be presets (since we don't have is_default column)
  const [presetPlaceIds, setPresetPlaceIds] = useState<Set<string>>(new Set())
  const [showNewPlaceModal, setShowNewPlaceModal] = useState(false)
  const [deletingPlaceId, setDeletingPlaceId] = useState<string | null>(null)
  
  // Combine default and user places (presets only)
  const allPlaces = [...defaultPlaces, ...userPlaces]

  // Reset form when dialog opens for new dinner (not when editing)
  useEffect(() => {
    if (open && editDinner === null) {
      // Only reset if we're not in the middle of editing
      resetForm()
    }
  }, [open, editDinner])

  // Populate form when editing
  useEffect(() => {
    if (editDinner) {
      setTitle(editDinner.title)
      // Extract actual notes (remove place name prefix if present)
      let actualNotes = editDinner.notes || '';
      if (actualNotes) {
        const notesParts = actualNotes.split(' | ');
        actualNotes = notesParts.length > 1 ? notesParts.slice(1).join(' | ') : 
                     (notesParts[0] && notesParts[0].includes(' ') ? notesParts[0] : '');
      }
      setNotes(actualNotes)
      setDinnerDate(editDinner.datetime.slice(0, 16))
      
      // Set health score
      setHealthScore(editDinner.health_score || null)
      
      // Set existing photo
      if (editDinner.photos.length > 0) {
        setPreviewUrl(editDinner.photos[0].url)
        setHasUploadedPhoto(true)
      }
      
      // Set meal type
      setMealType(editDinner.meal_type || 'dinner')
      
      // Set deliciousness and effort
      setDeliciousness(editDinner.deliciousness || null)
      setEffort(editDinner.effort || null)
      
      // Set tags
      const existingTags: Tag[] = editDinner.tags.map(tag => ({
        name: tag.name,
        type: tag.type as any,
        source: tag.source as any
      }))
      setTags(existingTags)
    } else {
      // Reset form for new dinner
      resetForm()
    }
  }, [editDinner])

  // Set place selection when editing (only when editDinner changes)
  useEffect(() => {
    const setPlaceSelection = async () => {

      if (editDinner && allPlaces.length > 0) {
        // Set place - check if it's a mock place stored in notes or a real place
        let selectedPlace = null;
        
        // First check if we have a places object from the database join
        if (editDinner.places) {
          // Use the places object directly
          selectedPlace = {
            id: editDinner.places.id || `temp-${editDinner.places.name}`,
            name: editDinner.places.name,
            type: editDinner.places.type,
            lat: editDinner.places.lat || 0,
            lon: editDinner.places.lon || 0,
            radius_m: editDinner.places.radius_m || 150
          };
        }
        // Fallback: check if it's a real place by place_id
        else if (editDinner.place_id) {
          console.log('Debug - Looking for place_id:', editDinner.place_id)
          console.log('Debug - allPlaces:', allPlaces.map(p => ({ id: p.id, name: p.name })))
          selectedPlace = allPlaces.find(p => p.id === editDinner.place_id);
          console.log('Debug - Found in allPlaces:', selectedPlace)
          
          // If not found in allPlaces, fetch it from the database
          // This handles both preset and non-preset places
          if (!selectedPlace && user) {
            try {
              const { data: placeData, error } = await supabase
                .from('places')
                .select('*')
                .eq('id', editDinner.place_id)
                .eq('user_id', user.id)
                .single()
              
              if (!error && placeData) {
                console.log('Debug - Found place in database:', placeData)
                // Use the actual place data (not a temp object) so it can be properly selected
                selectedPlace = {
                  id: placeData.id, // Use the real ID, not temp
                  name: placeData.name,
                  type: placeData.type,
                  lat: placeData.lat,
                  lon: placeData.lon,
                  radius_m: placeData.radius_m
                };
                console.log('Debug - Created place object:', selectedPlace)
              }
            } catch (error) {
              console.error('Error fetching place:', error)
            }
          }
        }
        
        // If no real place found, check if it's a mock place stored in notes
        if (!selectedPlace && editDinner.notes) {
          const notesParts = editDinner.notes.split(' | ');
          if (notesParts.length > 0) {
            const firstPart = notesParts[0].trim();
            if (firstPart && !firstPart.includes(' ') && firstPart.length < 50) {
              // This looks like a place name, find it in all places
              selectedPlace = allPlaces.find(p => p.name === firstPart);
              
              // If not found in allPlaces, create a temporary place object
              if (!selectedPlace) {
                selectedPlace = {
                  id: `temp-${firstPart}`,
                  name: firstPart,
                  type: 'other' as const,
                  lat: 0,
                  lon: 0,
                  radius_m: 150
                };
              }
            }
          }
        }
        
        setSelectedPlace(selectedPlace);
      }
    }
    
    setPlaceSelection()
  }, [editDinner, user]) // Added user dependency for database fetch

  // Initialize preset place IDs on component mount
  useEffect(() => {
    const initializePresetPlaces = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('places')
          .select('*')
          .eq('user_id', user.id)
          .order('name')

        if (error) throw error
        
        // Start with empty preset list - only places explicitly marked as presets will be included
        // The "Home" default place is always a preset
        const initialPresetIds = new Set(['550e8400-e29b-41d4-a716-446655440001']) // Home is always a preset
        setPresetPlaceIds(initialPresetIds)
      } catch (error) {
        console.error('Error initializing preset places:', error)
      }
    }

    initializePresetPlaces()
  }, [user])

  // Fetch user places when preset place IDs change
  useEffect(() => {
    const fetchUserPlaces = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('places')
          .select('*')
          .eq('user_id', user.id)
          .order('name')

        if (error) throw error
        
        // Filter to only include places that are marked as presets
        const presetPlaces = data?.filter(place => presetPlaceIds.has(place.id)) || []
        setUserPlaces(presetPlaces)
        

      } catch (error) {
        console.error('Error fetching user places:', error)
      }
    }

    fetchUserPlaces()
  }, [user, presetPlaceIds])



  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setHasUploadedPhoto(true) // Show attributes as soon as photo is selected
      
      // Reset AI analysis state
      setHealthScore(null)
    }
  }

  const handleCameraCapture = () => {
    fileInputRef.current?.click()
  }

  const analyzeImage = async () => {
    if (!user || !previewUrl) return
    
    setIsAnalyzing(true)
    
    try {
      let publicUrl = previewUrl
      
      // If we have a new file to upload, upload it first
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('dinner-photos')
          .upload(fileName, selectedFile)
        
        if (uploadError) throw uploadError
        
        // Get public URL for the new upload
        const { data: { publicUrl: newPublicUrl } } = supabase.storage
          .from('dinner-photos')
          .getPublicUrl(fileName)
        
        publicUrl = newPublicUrl
      }
      
      // Use real AI vision analysis
      const { data, error } = await supabase.functions.invoke('ai-vision-analysis', {
        body: {
          imageUrl: publicUrl,
          userId: user.id
        }
      })
      
      if (error) throw error
      
      // Show AI analysis result
      console.log('AI Vision Analysis Result:', data)
      
      // Convert AI suggestions to tags
      const aiTags: Tag[] = data.suggested_tags?.map((tag: any) => ({
        name: typeof tag === 'string' ? tag : tag.name,
        type: (typeof tag === 'object' && tag.type) ? tag.type : 'custom' as const,
        source: 'ai' as const
      })) || []
      
      // Clear existing AI tags and add new ones (keep user-created tags)
      setTags(prevTags => {
        const userTags = prevTags.filter(tag => tag.source === 'user')
        return [...userTags, ...aiTags]
      })
      setTitle(data.suggested_title || 'AI Generated Title')
      setHealthScore(data.health_score || null)
      
      toast.success('AI analysis complete! Review and adjust the suggestions.')
      
    } catch (error: any) {
      console.error('AI analysis failed:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.status
      })
      toast.error(`AI analysis failed: ${error.message}. You can still save your dinner manually.`)
    } finally {
      setIsAnalyzing(false)
    }
  }





  const addTag = (tagName: string) => {
    if (tagName.trim() && !tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      setTags(prev => [...prev, {
        name: tagName.trim(),
        type: 'custom',
        source: 'user'
      }])
      setNewTagInput('')
    }
  }

  const removeTag = (tagName: string) => {
    setTags(prev => prev.filter(tag => tag.name !== tagName))
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(newTagInput)
    }
  }

  const handleDelete = async () => {
    if (!editDinner || !user) return

    try {
      setIsSaving(true)

      // Delete photos from storage first
      const { data: photos } = await supabase
        .from('photos')
        .select('url')
        .eq('dinner_id', editDinner.id)

      if (photos && photos.length > 0) {
        const photoPaths = photos.map(photo => photo.url.split('/').pop())
        const { error: deletePhotosError } = await supabase.storage
          .from('dinner-photos')
          .remove(photoPaths)

        if (deletePhotosError) {
          console.error('Error deleting photos:', deletePhotosError)
        }
      }

      // Delete the dinner (this will cascade delete tags and photos due to foreign key constraints)
      const { error: deleteError } = await supabase
        .from('dinners')
        .delete()
        .eq('id', editDinner.id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      toast.success('Dinner deleted successfully!')
      onSave?.() // Refresh the gallery data
      onOpenChange(false)
      resetForm()

    } catch (error: any) {
      console.error('Delete failed:', error)
      toast.error(`Failed to delete dinner: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePlace = async (place: Place) => {
    if (!user) return

    try {
      // Remove from preset place IDs set
      setPresetPlaceIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(place.id)
        return newSet
      })
      
      // Clear selection if this place was selected
      if (selectedPlace?.id === place.id) {
        setSelectedPlace(null)
      }

      // Clear deleting state
      setDeletingPlaceId(null)

      toast.success(`"${place.name}" removed from preset places. Existing dinners will still show this location.`)

    } catch (error) {
      console.error('Remove place from presets error:', error)
      toast.error('Failed to remove place from presets')
      // Clear deleting state even on error
      setDeletingPlaceId(null)
    }
  }



  const handleSave = async () => {
    if (!user) return
    
    // Validate required fields
    if (!title.trim() || !selectedPlace) {
      setShowValidationErrors(true)
      if (!title.trim()) {
        toast.error('Please enter a title for your dinner')
      }
      if (!selectedPlace) {
        toast.error('Please select a location for your dinner')
      }
      setIsSaving(false)
      return
    }
    
    // Clear validation errors if validation passes
    setShowValidationErrors(false)
    
    // For new dinners, require a file
    if (!editDinner && !selectedFile) return
    
    setIsSaving(true)
    
    try {
      let publicUrl = previewUrl
      
      // Upload new image if provided
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('dinner-photos')
          .upload(fileName, selectedFile)
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl: newPublicUrl } } = supabase.storage
          .from('dinner-photos')
          .getPublicUrl(fileName)
        
        publicUrl = newPublicUrl
      }
      
      let dinnerData
      
      if (editDinner) {
        // Update existing dinner
        console.log('Updating dinner with place_id:', selectedPlace?.id)
        // Save place_id if it's a real place (not the default Home mock place or temporary place)
        const placeId = selectedPlace?.id && 
                       selectedPlace.id !== '550e8400-e29b-41d4-a716-446655440001' && 
                       !selectedPlace.id.startsWith('temp-') ? selectedPlace.id : null
        // Store place name in notes if it's the Home mock place or a temporary place
        const placeName = (selectedPlace?.id === '550e8400-e29b-41d4-a716-446655440001' || 
                          selectedPlace?.id?.startsWith('temp-')) ? selectedPlace.name : null
        const combinedNotes = placeName ? `${placeName}${notes ? ` | ${notes}` : ''}` : notes
        const { data, error: dinnerError } = await supabase
          .from('dinners')
          .update({
            title: title || 'Untitled Dinner',
            datetime: new Date(dinnerDate).toISOString(),
            place_id: placeId,
            notes: combinedNotes,
            meal_type: mealType,
            deliciousness: deliciousness,
            effort: effort,
            health_score: healthScore,
          })
          .eq('id', editDinner.id)
          .select()
          .single()
        
        if (dinnerError) throw dinnerError
        dinnerData = data
        console.log('Dinner data:', dinnerData)
        
        // Update photo if new one was uploaded
        if (selectedFile && publicUrl) {
          let exifData = { width: 0, height: 0 }
          
          // Extract EXIF data from the new file
          try {
            exifData = await extractExifData(selectedFile)
            console.log('Extracted EXIF data for update:', exifData)
          } catch (error) {
            console.warn('Failed to extract EXIF data for update:', error)
          }
          
          const { error: photoError } = await supabase
            .from('photos')
            .update({
              url: publicUrl,
              width: exifData.width || 0,
              height: exifData.height || 0,
              exif_lat: exifData.latitude || null,
              exif_lon: exifData.longitude || null,
              exif_time: exifData.timestamp || null
            })
            .eq('dinner_id', editDinner.id)
          
          if (photoError) throw photoError
        }
      } else {
        // Create new dinner
        console.log('Creating dinner with place_id:', selectedPlace?.id)
        // Save place_id if it's a real place (not the default Home mock place or temporary place)
        const placeId = selectedPlace?.id && 
                       selectedPlace.id !== '550e8400-e29b-41d4-a716-446655440001' && 
                       !selectedPlace.id.startsWith('temp-') ? selectedPlace.id : null
        // Store place name in notes if it's the Home mock place or a temporary place
        const placeName = (selectedPlace?.id === '550e8400-e29b-41d4-a716-446655440001' || 
                          selectedPlace?.id?.startsWith('temp-')) ? selectedPlace.name : null
        const combinedNotes = placeName ? `${placeName}${notes ? ` | ${notes}` : ''}` : notes
        const { data, error: dinnerError } = await supabase
          .from('dinners')
          .insert({
            user_id: user.id,
            title: title || 'Untitled Dinner',
            datetime: new Date(dinnerDate).toISOString(),
            place_id: placeId,
            notes: combinedNotes,
            meal_type: mealType,
            deliciousness: deliciousness,
            effort: effort,
            health_score: healthScore,
            favorite: false
          })
          .select()
          .single()
        
        if (dinnerError) throw dinnerError
        dinnerData = data
        console.log('Dinner data:', dinnerData)
        
        // Save photo to photos table with EXIF data
        if (publicUrl) {
          let exifData = { width: 0, height: 0 }
          
          // Extract EXIF data if we have a new file
          if (selectedFile) {
            try {
              exifData = await extractExifData(selectedFile)
              console.log('Extracted EXIF data:', exifData)
            } catch (error) {
              console.warn('Failed to extract EXIF data:', error)
            }
          }
          
          const { error: photoError } = await supabase
            .from('photos')
            .insert({
              dinner_id: dinnerData.id,
              url: publicUrl,
              width: exifData.width || 0,
              height: exifData.height || 0,
              exif_lat: exifData.latitude || null,
              exif_lon: exifData.longitude || null,
              exif_time: exifData.timestamp || null
            })
          
          if (photoError) throw photoError
        }
      }
      
      // Handle tags
      if (editDinner) {
        // Delete existing tags and insert new ones
        const { error: deleteTagsError } = await supabase
          .from('tags')
          .delete()
          .eq('dinner_id', editDinner.id)
        
        if (deleteTagsError) throw deleteTagsError
      }
      
      // Save all tags
      const validTagTypes = ['ingredient', 'cuisine', 'dish', 'diet', 'method', 'course', 'custom']
      
      const allTags = tags.map(tag => ({
        dinner_id: dinnerData.id,
        name: tag.name,
        type: validTagTypes.includes(tag.type) ? tag.type : 'custom',
        source: tag.source || 'user',
        approved: true
      }))
      
      if (allTags.length > 0) {
        // Validate all tags have required fields
        const validTags = allTags.filter(tag => {
          const isValid = tag.dinner_id && tag.name && tag.type && tag.source && tag.approved !== undefined
          if (!isValid) {
            console.warn('Invalid tag filtered out:', tag)
          }
          return isValid
        })
        
        console.log('Inserting tags:', validTags)
        
        if (validTags.length > 0) {
          const { error: tagsError } = await supabase
            .from('tags')
            .insert(validTags)
          
          if (tagsError) {
            console.error('Tags insertion error:', tagsError)
            throw tagsError
          }
        }
      }
      
      toast.success('Dinner saved successfully!')
      onSave?.() // Refresh the gallery data
      onOpenChange(false)
      resetForm()
      
    } catch (error: any) {
      console.error('Save failed:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      toast.error(`Failed to save dinner: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setTitle('')
    setNotes('')
    setSelectedPlace(null)
    setDinnerDate(new Date().toISOString().slice(0, 10) + 'T12:00')
    setMealType('dinner')
    setTags([])
    setNewTagInput('')
    setHealthScore(null)
    setDeliciousness(null)
    setEffort(null)
    setHasUploadedPhoto(false)
    setIsAnalyzing(false)
    setIsSaving(false)
    setShowValidationErrors(false)
  }

  return (
    <>
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
            {editDinner ? 'Edit Dinner' : 'Add New Dinner'}
          </DialogTitle>
        </DialogHeader>
        
        {/* AI Analysis Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center max-w-sm mx-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold mb-2">Analyzing</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Please wait while we analyze your photo and suggest tags, title, and health score...
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  resetForm()
                  onOpenChange(false)
                }}
              >
                Cancel Analysis
              </Button>
            </div>
          </div>
        )}
        
        <div className={`space-y-6 ${isAnalyzing ? 'pointer-events-none opacity-50' : ''}`}>
        {/* Photo Upload */}
          <div className="space-y-4">
            <Label>Photo</Label>
            {previewUrl ? (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Dinner preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                    // Don't reset hasUploadedPhoto - keep attributes visible
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                {!isAnalyzing && previewUrl && (
                  <div className="absolute bottom-2 left-2">
                    <Button
                      onClick={analyzeImage}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      size="sm"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Analyze
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Capture or upload a photo of your dinner</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleCameraCapture}>
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
            <input
                  ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
                />
              </div>
            )}
        </div>

        {/* Attributes Section - Only show after photo upload or when editing */}
        {(hasUploadedPhoto || editDinner) && (
          <>
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className={showValidationErrors && !title.trim() ? "text-red-500 font-bold" : ""}>
              Title *
            </Label>
            <Input
              id="title"
              placeholder="e.g., Salmon Teriyaki Bowl"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (showValidationErrors && e.target.value.trim()) {
                  setShowValidationErrors(false)
                }
              }}
              className={showValidationErrors && !title.trim() ? "border-red-500" : ""}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="datetime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Date
            </Label>
              <Input
              id="datetime"
              type="date"
              value={dinnerDate.split('T')[0]}
              onChange={(e) => setDinnerDate(e.target.value + 'T12:00')}
              className="w-full"
            />
          </div>

          {/* Meal Type */}
          <div className="space-y-2">
            <Label htmlFor="meal-type">Meal Type</Label>
            <Select value={mealType} onValueChange={(value: 'breakfast' | 'lunch' | 'dinner' | 'other') => setMealType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Place */}
          <div className="space-y-2">
            <Label className={`flex items-center gap-2 ${showValidationErrors && !selectedPlace ? "text-red-500 font-bold" : ""}`}>
                <MapPin className="h-4 w-4" />
              Place *
            </Label>
            <div className={`flex gap-2 flex-wrap ${showValidationErrors && !selectedPlace ? "border border-red-500 rounded-md p-2" : ""}`}>
              {selectedPlace ? (
                // Show selected place with remove option
                <Badge
                  variant="default"
                  className="flex items-center gap-1"
                >
                  {selectedPlace.name}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => setSelectedPlace(null)}
                  />
                </Badge>
              ) : (
                // Show preset places and add new option
                <>
                  {allPlaces.map((place) => (
                    <Badge
                      key={place.id}
                      variant="outline"
                      className="cursor-pointer flex items-center gap-1"
                      onClick={() => {
                        if (deletingPlaceId !== place.id) {
                          setSelectedPlace(place)
                          if (showValidationErrors) {
                            setShowValidationErrors(false)
                          }
                        }
                      }}
                    >
                      {place.name}
                      {presetPlaceIds.has(place.id) && place.id !== '550e8400-e29b-41d4-a716-446655440001' && !place.id.startsWith('temp-') && (
                        <AlertDialog onOpenChange={(open) => {
                          if (!open) {
                            setDeletingPlaceId(null)
                          }
                        }}>
                          <AlertDialogTrigger asChild>
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeletingPlaceId(place.id)
                              }}
                            />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Place</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{place.name}"? This will remove it from your places list.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePlace(place)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </Badge>
                  ))}
                  <Badge
                    variant="outline"
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => setShowNewPlaceModal(true)}
                  >
                    <span className="text-lg">+</span>
                    New Place
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            <div className="flex gap-2 flex-wrap">
              {tags.map((tag, index) => (
                <Badge key={`${tag.name}-${index}`} variant="outline" className="flex items-center gap-1">
                  {tag.name}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-red-500" 
                    onClick={() => removeTag(tag.name)}
                  />
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add tag and press Enter"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyPress={handleTagInputKeyPress}
            />
          </div>

          {/* Health Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Health Score</Label>
              {healthScore !== null && (
                <Badge 
                  className={`text-xs ${getHealthScoreBadgeClass(healthScore)}`}
                >
                  {healthScore}/100
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={healthScore || 50}
                onChange={(e) => setHealthScore(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Unhealthy</span>
                <span>Moderate</span>
                <span>Healthy</span>
              </div>

            </div>
          </div>

          {/* Deliciousness Rating */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">How Yummy? (1-5 stars)</Label>
              {deliciousness && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${star <= deliciousness ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant={deliciousness === rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeliciousness(deliciousness === rating ? null : rating)}
                  className="flex items-center gap-1"
                >
                  <span className="text-yellow-400">★</span>
                  {rating}
                </Button>
              ))}
            </div>
          </div>

          {/* Effort Level */}
          <div className="space-y-2">
            <Label>Effort Level</Label>
            <div className="flex gap-2">
              {[
                { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
                { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
                { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-800 hover:bg-red-200' }
              ].map(({ value, label, color }) => (
                <Button
                  key={value}
                  variant={effort === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEffort(effort === value ? null : value as 'easy' | 'medium' | 'hard')}
                  className={effort === value ? color : ''}
                >
                  {label}
              </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this dinner..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          </>
        )}

          {/* Actions */}
          <div className="flex gap-2 justify-between">
            <div>
              {editDinner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isSaving}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Dinner</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{editDinner.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                resetForm()
                onOpenChange(false)
              }}>
                Cancel
          </Button>
              <Button 
                onClick={handleSave} 
                disabled={(!editDinner && !selectedFile) || isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editDinner ? 'Update Dinner' : 'Save Dinner'}
          </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* New Place Modal */}
    <Dialog open={showNewPlaceModal} onOpenChange={setShowNewPlaceModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Place</DialogTitle>
          <DialogDescription>
            Create a new place for your dinner locations. You can choose to add it as a preset option for quick selection.
          </DialogDescription>
        </DialogHeader>
        <NewPlaceForm 
          onSave={(place, isDefault) => {
            if (isDefault) {
              // Add to preset place IDs set
              setPresetPlaceIds(prev => new Set([...prev, place.id]))
            }
            setSelectedPlace(place)
            setShowNewPlaceModal(false)
          }}
          onCancel={() => setShowNewPlaceModal(false)}
        />
      </DialogContent>
    </Dialog>
    </>
  )
}