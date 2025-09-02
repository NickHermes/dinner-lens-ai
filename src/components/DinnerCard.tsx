import { MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Dinner {
  id: string;
  title: string;
  date: string;
  place: string;
  tags: string[];
  imageUrl: string;
}

interface DinnerCardProps {
  dinner: Dinner;
}

export const DinnerCard = ({ dinner }: DinnerCardProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-medium transition-smooth cursor-pointer group">
      <div className="aspect-square bg-muted relative overflow-hidden">
        <img 
          src={dinner.imageUrl} 
          alt={dinner.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(dinner.date)}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-3">
        <h3 className="font-medium text-sm mb-1 line-clamp-1">{dinner.title}</h3>
        
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <MapPin className="w-3 h-3 mr-1" />
          <span>{dinner.place}</span>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {dinner.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {dinner.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{dinner.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};