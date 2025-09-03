import { useState } from 'react'
import { Check, X, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAI, AITag } from '@/hooks/useAI'

interface AITagSuggestionsProps {
  tags: (AITag & { id: string })[]
  dinnerId: string
  onTagsUpdated: () => void
}

export const AITagSuggestions = ({ tags, dinnerId, onTagsUpdated }: AITagSuggestionsProps) => {
  const [customTag, setCustomTag] = useState('')
  const [selectedType, setSelectedType] = useState<AITag['type']>('ingredient')
  const { approveTag, rejectTag, addCustomTag } = useAI()

  const unapprovedTags = tags.filter(tag => !tag.approved)
  const approvedTags = tags.filter(tag => tag.approved)

  const handleApprove = async (tagId: string) => {
    await approveTag(tagId)
    onTagsUpdated()
  }

  const handleReject = async (tagId: string) => {
    await rejectTag(tagId)
    onTagsUpdated()
  }

  const handleAddCustom = async () => {
    if (customTag.trim()) {
      await addCustomTag(dinnerId, customTag.trim(), selectedType)
      setCustomTag('')
      onTagsUpdated()
    }
  }

  const getTagVariant = (type: string) => {
    switch (type) {
      case 'cuisine': return 'outline'
      case 'ingredient': return 'secondary'
      case 'diet': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-4">
      {/* AI Suggestions */}
      {unapprovedTags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
            AI Suggestions ({unapprovedTags.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {unapprovedTags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-1 bg-muted rounded-full p-1">
                <Badge variant={getTagVariant(tag.type)} className="text-xs">
                  {tag.name}
                  <span className="ml-1 opacity-60">
                    {Math.round(tag.confidence * 100)}%
                  </span>
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 rounded-full p-0 hover:bg-green-100 hover:text-green-700"
                  onClick={() => handleApprove(tag.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 rounded-full p-0 hover:bg-red-100 hover:text-red-700"
                  onClick={() => handleReject(tag.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Tags */}
      {approvedTags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
            Tags ({approvedTags.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {approvedTags.map((tag) => (
              <Badge key={tag.id} variant={getTagVariant(tag.type)} className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Tag */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Add Custom Tag</h4>
        <div className="flex gap-2">
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as AITag['type'])}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="ingredient">Ingredient</option>
            <option value="cuisine">Cuisine</option>
            <option value="dish">Dish</option>
            <option value="diet">Diet</option>
            <option value="method">Method</option>
            <option value="course">Course</option>
          </select>
          <Input
            placeholder="Enter tag name"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
          />
          <Button 
            onClick={handleAddCustom} 
            size="sm"
            disabled={!customTag.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}