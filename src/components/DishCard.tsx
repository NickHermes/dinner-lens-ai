import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Star, Zap } from 'lucide-react'
import { Dish, DinnerInstance } from '@/lib/supabase'

interface DishCardProps {
  dish: Dish & {
    latest_instance?: DinnerInstance
    total_instances?: number
    total_consumption_logs?: number
  }
  onClick: () => void
}

export const DishCard: React.FC<DishCardProps> = ({ dish, onClick }) => {
  const latestInstance = dish.latest_instance
  const photoUrl = dish.base_photo_url
  const lastEaten = latestInstance?.datetime ? new Date(latestInstance.datetime) : new Date(dish.created_at)
  const totalConsumptionLogs = dish.total_consumption_logs || 1

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const getEffortColor = (effort?: string) => {
    switch (effort) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'hard': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] group"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={dish.title}
              className="w-full h-48 object-cover rounded-t-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'placeholder.svg'
              }}
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">No photo</span>
            </div>
          )}
          
          {/* Consumption count badge */}
          {totalConsumptionLogs > 1 && (
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              {totalConsumptionLogs} times
            </div>
          )}
          
          {/* Health score indicator */}
          {dish.health_score && (
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs px-2 py-1 rounded-full font-medium">
              {dish.health_score}% healthy
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {dish.title}
            </h3>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <Clock className="h-4 w-4" />
              <span>{formatDate(lastEaten)}</span>
            </div>
          </div>

          {/* Dish details */}
          <div className="flex items-center gap-2 mb-3">
            {dish.effort && (
              <Badge 
                variant="outline" 
                className={`text-xs ${getEffortColor(dish.effort)}`}
              >
                <Zap className="h-3 w-3 mr-1" />
                {dish.effort}
              </Badge>
            )}
            
            <Badge variant="outline" className="text-xs">
              {dish.meal_type}
            </Badge>
          </div>

          {/* Base tags */}
          {dish.base_tags && dish.base_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {dish.base_tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs"
                >
                  {tag.name}
                </Badge>
              ))}
              {dish.base_tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{dish.base_tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
