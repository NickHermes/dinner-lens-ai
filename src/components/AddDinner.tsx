import { useState } from 'react'
import { Camera, MapPin, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AITagSuggestions } from '@/components/AITagSuggestions'
import { useAI } from '@/hooks/useAI'

export const AddDinner = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPlace, setSelectedPlace] = useState('')
  const [aiTags, setAiTags] = useState<any[]>([])
  const [dinnerId] = useState(() => crypto.randomUUID())
  
  const { analyzeImage, isAnalyzing } = useAI()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
    
    if (files.length > 0) {
      // Trigger AI analysis for the first image
      analyzeImage(files[0], dinnerId).then((analysis) => {
        if (analysis) {
          setTitle(analysis.title)
          setNotes(analysis.caption)
          // Convert to format expected by AITagSuggestions
          const formattedTags = analysis.tags.map(tag => ({
            ...tag,
            id: crypto.randomUUID()
          }))
          setAiTags(formattedTags)
        }
      })
    }
  }

  const handleSave = () => {
    // TODO: Save dinner to database
    console.log('Saving dinner:', {
      title,
      notes,
      selectedPlace,
      files: selectedFiles,
      tags: aiTags.filter(t => t.approved)
    })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Add New Dinner
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Photos</label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Camera className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Tap to capture or upload photos
              </p>
            </label>
            
            {selectedFiles.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis Status */}
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-spin" />
            Analyzing image with AI...
          </div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              placeholder="e.g., Salmon Teriyaki Bowl"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Place</label>
            <div className="flex gap-2">
              <Input
                placeholder="Search places or add new..."
                value={selectedPlace}
                onChange={(e) => setSelectedPlace(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="sm">
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              placeholder="How was it? Any special ingredients or memories?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* AI Tag Suggestions */}
        {aiTags.length > 0 && (
          <AITagSuggestions
            tags={aiTags}
            dinnerId={dinnerId}
            onTagsUpdated={() => {
              // Refetch tags logic would go here
              console.log('Tags updated')
            }}
          />
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1">
            Save Draft
          </Button>
          <Button onClick={handleSave} className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Save Dinner
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}