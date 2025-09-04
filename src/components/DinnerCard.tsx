import { MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getHealthScoreBadgeVariant, getHealthScoreBadgeClass } from "@/lib/utils";

interface Dinner {
  id: string;
  title: string;
  datetime: string;
  notes?: string;
  favorite?: boolean;
  health_score?: number;
  deliciousness?: number;
  effort?: 'easy' | 'medium' | 'hard';
  places?: {
    name: string;
    type: string;
  } | null;
  photos?: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
  tags?: Array<{
    name: string;
    type: string;
    approved: boolean;
  }>;
}

interface DinnerCardProps {
  dinner: Dinner;
  onClick?: (dinner: Dinner) => void;
}

export const DinnerCard = ({ dinner, onClick }: DinnerCardProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const imageUrl = dinner.photos?.[0]?.url || '/placeholder.svg';
  
  // Extract place name from notes if it starts with a place name (for mock places)
  let placeName = dinner.places?.name || 'Unknown Place';
  if (dinner.notes && !dinner.places?.name) {
    const notesParts = dinner.notes.split(' | ');
    if (notesParts.length > 0) {
      // Check if first part looks like a place name (not a typical note)
      const firstPart = notesParts[0].trim();
      if (firstPart && !firstPart.includes(' ') && firstPart.length < 50) {
        placeName = firstPart;
      }
    }
  }
  
  const approvedTags = dinner.tags?.filter(tag => tag.approved) || [];

  return (
    <Card 
      className="overflow-hidden hover:shadow-medium transition-smooth cursor-pointer group"
      onClick={() => onClick?.(dinner)}
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        <img 
          src={imageUrl} 
          alt={dinner.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(dinner.datetime)}
          </Badge>
        </div>
        {dinner.favorite && (
          <div className="absolute top-2 left-2">
            <Badge variant="default" className="text-xs">⭐</Badge>
          </div>
        )}
        {dinner.health_score && (
          <div className="absolute bottom-2 left-2">
            <Badge 
              className={`text-xs ${getHealthScoreBadgeClass(dinner.health_score)}`}
            >
              {dinner.health_score}% health
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-3">
        <h3 className="font-medium text-sm mb-1 line-clamp-1">{dinner.title}</h3>
        
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <MapPin className="w-3 h-3 mr-1" />
          <span>{placeName}</span>
        </div>

        {/* Yummy Factor and Effort Level */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
          {dinner.deliciousness && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Yummy:</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-xs ${star <= dinner.deliciousness! ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {dinner.effort && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Effort:</span>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  dinner.effort === 'easy' ? 'bg-green-100 text-green-800 border-green-200' :
                  dinner.effort === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                  'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                {dinner.effort.charAt(0).toUpperCase() + dinner.effort.slice(1)}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1">
          {approvedTags.slice(0, 3).map((tag) => (
            <Badge key={tag.name} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          ))}
          {approvedTags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{approvedTags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};