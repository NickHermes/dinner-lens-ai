import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Camera, Upload, Search, Clock, MapPin, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Dish, DinnerInstance } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'

interface PreviousDish {
  dish: Dish
  frequency: number
  last_eaten: string
  sample_photo_url?: string
  places?: string[]
  location_counts?: { [location: string]: number }
  latest_instance?: DinnerInstance
  selected_variant?: DinnerInstance
}

interface MealTypeSelectorProps {
  isOpen: boolean
  onClose: () => void
  onNewDish: (searchQuery?: string) => void
  onRepeatMeal: (dish: PreviousDish) => void
}

export const MealTypeSelector = ({ isOpen, onClose, onNewDish, onRepeatMeal }: MealTypeSelectorProps) => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PreviousDish[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(true)
  const [selectedDish, setSelectedDish] = useState<PreviousDish | null>(null)
  const [showVariants, setShowVariants] = useState(false)

  // Search user's previous dishes
  const searchPreviousDishes = async (query: string) => {
    if (!user || !query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Search dishes by title and base tags
      const [dishResults, tagResults] = await Promise.all([
        // Search dishes by title
        supabase
          .from('dishes')
          .select(`
            *,
            dinner_instances!inner (
              id,
              datetime,
              location,
              variant_title,
              photo_url,
              place_id,
              count,
              last_consumed,
              places (name),
              consumption_records (*)
            ),
            tags!inner (
              name,
              is_base_tag
            )
          `)
          .eq('user_id', user.id)
          .eq('tags.is_base_tag', true)
          .ilike('title', `%${query}%`)
          .order('updated_at', { ascending: false }),
        
        // Search dishes by base tags
        supabase
          .from('dishes')
          .select(`
            *,
            dinner_instances!inner (
              id,
              datetime,
              location,
              variant_title,
              photo_url,
              place_id,
              count,
              last_consumed,
              places (name),
              consumption_records (*)
            ),
            tags!inner (
              name,
              is_base_tag
            )
          `)
          .eq('user_id', user.id)
          .eq('tags.is_base_tag', true)
          .ilike('tags.name', `%${query}%`)
          .order('updated_at', { ascending: false })
      ])

      if (dishResults.error) throw dishResults.error
      if (tagResults.error && tagResults.error.code !== 'PGRST116') throw tagResults.error

      // Combine and deduplicate dishes
      const allDishes = [...(dishResults.data || []), ...(tagResults.data || [])]
      const uniqueDishes = allDishes.filter((dish, index, self) => 
        index === self.findIndex(d => d.id === dish.id)
      )

            // Process results
            const results: PreviousDish[] = uniqueDishes.map(dish => {
              const instances = dish.dinner_instances || []
              const latestInstance = instances.sort((a, b) => 
                new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
              )[0]
              
              // Calculate location counts
              const locationCounts: { [location: string]: number } = {}
              const places: string[] = []
              
              instances.forEach(inst => {
                const placeName = inst.places?.name || 'Unknown Location'
                locationCounts[placeName] = (locationCounts[placeName] || 0) + 1
                if (!places.includes(placeName)) {
                  places.push(placeName)
                }
              })

              return {
                dish,
                frequency: instances.length,
                last_eaten: latestInstance?.datetime || dish.created_at,
                sample_photo_url: latestInstance?.photo_url || dish.base_photo_url,
                places,
                location_counts: locationCounts,
                latest_instance: latestInstance
              }
            })

      // Sort by frequency desc, then by recency
      results.sort((a, b) => {
        if (b.frequency !== a.frequency) return b.frequency - a.frequency
        return new Date(b.last_eaten).getTime() - new Date(a.last_eaten).getTime()
      })

      setSearchResults(results)
    } catch (error) {
      console.error('Error searching previous dishes:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchPreviousDishes(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, user])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleNewDish = () => {
    const query = searchQuery.trim()
    setSearchQuery('')
    setSearchResults([])
    onNewDish(query)
  }

  const handleDishSelect = (dish: PreviousDish) => {
    setSelectedDish(dish)
    setShowVariants(true)
  }

  const handleVariantSelect = (dish: PreviousDish, variant?: DinnerInstance, isLogAgain: boolean = false) => {
    setShowVariants(false)
    setSelectedDish(null)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
    
    // Pass the action type along with the data
    if (variant) {
      onRepeatMeal({ 
        ...dish, 
        selected_variant: variant,
        action_type: isLogAgain ? 'log_again' : 'new_variant'
      })
    } else {
      onRepeatMeal({ ...dish, action_type: 'new_variant' })
    }
  }

  const handleBackFromVariants = () => {
    setShowVariants(false)
    setSelectedDish(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="mb-3">
          <DialogTitle>Add to Food Diary</DialogTitle>
        </DialogHeader>
        
        {showSearch && !showVariants ? (
          <div className="space-y-4 mt-1">
            <div className="relative">
              <Search className="absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search or add new dish"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 w-[94%] sm:w-full mx-auto rounded-xl"
                autoFocus
              />
            </div>

            {isSearching && (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">Searching...</div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchResults.map((dishResult) => (
                        <Card 
                          key={dishResult.dish.id} 
                          className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleDishSelect(dishResult)}
                        >
                    <div className="flex items-center gap-3">
                      {dishResult.sample_photo_url && (
                        <img 
                          src={dishResult.sample_photo_url} 
                          alt={dishResult.dish.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{dishResult.dish.title}</div>
                               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                 <Clock className="h-3 w-3" />
                                 <span>{formatDate(dishResult.last_eaten)}</span>
                                 {dishResult.frequency > 1 && (
                                   <>
                                     <span>•</span>
                                     <span>{dishResult.frequency} times</span>
                                   </>
                                 )}
                               </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Show "not found" text first, then button */}
            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
              <div className="text-center py-2">
                <div className="text-sm text-muted-foreground">
                  No existing dishes found matching "{searchQuery}"
                </div>
              </div>
            )}

            {/* Create New Dish Button - Show when user has typed something */}
            {searchQuery.length >= 2 && !isSearching && (
              <div className="py-4">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleNewDish}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Add as new dish
                </Button>
              </div>
            )}
          </div>
        ) : showVariants && selectedDish ? (
          // Variant Selection View
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleBackFromVariants} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Go back</span>
              </Button>
              <div className="flex-1">
                <h3 className="font-semibold">{selectedDish.dish.title}</h3>
                <p className="text-sm text-muted-foreground">Choose a variant to log</p>
              </div>
            </div>

            {/* New Instance Option */}
            <Card 
              className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed"
              onClick={() => handleVariantSelect(selectedDish)}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Create New Variant</div>
                  <div className="text-sm text-muted-foreground">Add new photo and details</div>
                </div>
              </div>
            </Card>

            {/* Existing Variants */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Previous variants:</p>
              {selectedDish.dish.dinner_instances?.sort((a, b) => {
                // Sort by last_consumed (newest first), fallback to datetime
                const aDate = a.last_consumed || a.datetime
                const bDate = b.last_consumed || b.datetime
                return new Date(bDate).getTime() - new Date(aDate).getTime()
              }).map((instance) => (
                <Card 
                  key={instance.id}
                  className="p-4 border transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {instance.photo_url ? (
                      <img 
                        src={instance.photo_url} 
                        alt={`${selectedDish.dish.title} variant`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">{instance.variant_title || 'Untitled Variant'}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDate(instance.datetime)}
                      </div>
                    </div>
                    <div className="min-w-[100px]">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleVariantSelect(selectedDish, instance, true)}
                        className="text-sm px-3 py-2 h-9 font-medium w-full"
                      >
                        Log Again
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
