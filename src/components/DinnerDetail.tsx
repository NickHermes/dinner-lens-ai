import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { MapPin, Clock, Tag, Edit, X, Heart, Trash2 } from 'lucide-react'
import { getHealthScoreBadgeVariant, getHealthScoreBadgeClass } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface Dinner {
  id: string
  title: string
  datetime: string
  place?: {
    name: string
    type: string
  }
  places?: {
    name: string
    type: string
  }
  notes?: string
  deliciousness?: number
  effort?: 'easy' | 'medium' | 'hard'
  health_score?: number
  photos: { url: string }[]
  tags: { name: string; type: string; source: string; approved: boolean }[]
  favorite: boolean
}

interface DinnerDetailProps {
  dinner: Dinner | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (dinner: Dinner) => void
  onDelete?: () => void
}

export const DinnerDetail: React.FC<DinnerDetailProps> = ({ 
  dinner, 
  open, 
  onOpenChange, 
  onEdit,
  onDelete 
}) => {
  const { user } = useAuth()
  if (!dinner) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDelete = async () => {
    if (!dinner || !user) return

    try {
      // Delete photos from storage first
      const { data: photos } = await supabase
        .from('photos')
        .select('url')
        .eq('dinner_id', dinner.id)

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
        .eq('id', dinner.id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      toast.success('Dinner deleted successfully!')
      onDelete?.() // Refresh the gallery data
      onOpenChange(false)

    } catch (error: any) {
      console.error('Delete failed:', error)
      toast.error(`Failed to delete dinner: ${error.message}`)
    }
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {dinner.favorite && <Heart className="h-5 w-5 text-red-500 fill-current" />}
            {dinner.title}
          </DialogTitle>
          <div className="flex justify-end gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Dinner</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{dinner.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-red-600 hover-destructive"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(dinner)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo */}
          {dinner.photos.length > 0 && (
            <div className="space-y-2">
              <img 
                src={dinner.photos[0].url} 
                alt={dinner.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Date & Place */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatDate(dinner.datetime)}
            </div>
            {(dinner.place || dinner.places || dinner.notes) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {dinner.place?.name || dinner.places?.name || (() => {
                  // Extract place name from notes if it starts with a place name (for mock places)
                  if (dinner.notes) {
                    const notesParts = dinner.notes.split(' | ');
                    if (notesParts.length > 0) {
                      const firstPart = notesParts[0].trim();
                      if (firstPart && !firstPart.includes(' ') && firstPart.length < 50) {
                        return firstPart;
                      }
                    }
                  }
                  return 'Unknown Place';
                })()}
              </div>
            )}
          </div>

          {/* Tags */}
          {dinner.tags.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <div className="flex gap-2 flex-wrap">
                {dinner.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant={tag.source === 'ai' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Yummy Factor and Effort Level */}
          {(dinner.deliciousness || dinner.effort) && (
            <div className="space-y-4">
              {dinner.deliciousness && (
                <div className="space-y-2">
                  <Label>How Yummy?</Label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${star <= dinner.deliciousness! ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {dinner.deliciousness}/5 stars
                    </span>
                  </div>
                </div>
              )}
              
              {dinner.effort && (
                <div className="space-y-2">
                  <Label>Effort Level</Label>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={`${
                        dinner.effort === 'easy' ? 'bg-green-100 text-green-800 border-green-200' :
                        dinner.effort === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }`}
                    >
                      {dinner.effort.charAt(0).toUpperCase() + dinner.effort.slice(1)}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Health Score */}
          {dinner.health_score !== null && (
            <div className="space-y-2">
              <Label>Health Score</Label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Badge 
                  className={`text-xs w-fit ${getHealthScoreBadgeClass(dinner.health_score)}`}
                >
                  {dinner.health_score}/100
                </Badge>
                <div className="flex-1 bg-gray-200 rounded-full h-1 min-w-0">
                  <div 
                    className={`h-1 rounded-full ${
                      dinner.health_score >= 70 ? 'bg-green-500' : 
                      dinner.health_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dinner.health_score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {dinner.notes && (() => {
            // Extract actual notes (remove place name prefix if present)
            const notesParts = dinner.notes.split(' | ');
            const actualNotes = notesParts.length > 1 ? notesParts.slice(1).join(' | ') : 
                               (notesParts[0] && notesParts[0].includes(' ') ? notesParts[0] : '');
            
            return actualNotes ? (
              <div className="space-y-2">
                <Label>Notes</Label>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {actualNotes}
                </p>
              </div>
            ) : null;
          })()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
