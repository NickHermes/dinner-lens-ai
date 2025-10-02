import { MapPin, Home, Users, Building2, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { BottomNavigation } from "@/components/BottomNavigation";

// Mock places data
const mockPlaces = [
  {
    id: "1",
    name: "Home",
    type: "home" as const,
    address: "123 Main St, Your City",
    radius: 150,
    dinnerCount: 67,
    lastVisit: "2024-01-15"
  },
  {
    id: "2", 
    name: "Anna's Place",
    type: "friend" as const,
    address: "456 Oak Ave, Friend's City",
    radius: 100,
    dinnerCount: 12,
    lastVisit: "2024-01-10"
  },
  {
    id: "3",
    name: "Sapporo Ramen",
    type: "restaurant" as const,
    address: "789 Food St, Downtown",
    radius: 75,
    dinnerCount: 8,
    lastVisit: "2024-01-12"
  },
  {
    id: "4",
    name: "Tony's Pizzeria", 
    type: "restaurant" as const,
    address: "321 Pizza Blvd, Little Italy",
    radius: 100,
    dinnerCount: 15,
    lastVisit: "2024-01-14"
  },
  {
    id: "5",
    name: "Bangkok Street",
    type: "restaurant" as const,
    address: "555 Thai Way, Asia Town", 
    radius: 80,
    dinnerCount: 6,
    lastVisit: "2024-01-13"
  }
];

const getPlaceIcon = (type: string) => {
  switch (type) {
    case 'home': return Home;
    case 'friend': return Users;
    case 'restaurant': return Building2;
    default: return MapPin;
  }
};

const getPlaceTypeColor = (type: string) => {
  switch (type) {
    case 'home': return 'bg-primary text-primary-foreground';
    case 'friend': return 'bg-secondary text-secondary-foreground';
    case 'restaurant': return 'bg-accent text-accent-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const Places = () => {
  return (
    <div className="min-h-screen bg-gradient-background pb-24">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Places</h1>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Place
            </Button>
          </div>
        </div>
      </header>

      {/* Search */}
      <section className="p-4">
        <Input 
          placeholder="Search places..." 
          className="w-full"
        />
      </section>

      {/* Map Placeholder */}
      <section className="px-4 mb-6">
        <Card className="overflow-hidden">
          <div className="h-48 bg-gradient-secondary/20 flex items-center justify-center relative">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Interactive map coming soon</p>
              <Button variant="outline" size="sm">
                Connect Mapbox
              </Button>
            </div>
            {/* Mock pins on map */}
            <div className="absolute top-4 left-8">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            </div>
            <div className="absolute bottom-8 right-12">
              <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
            </div>
            <div className="absolute top-12 right-6">
              <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
            </div>
          </div>
        </Card>
      </section>

      {/* Places List */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Saved Places</h2>
          <Badge variant="secondary">{mockPlaces.length} places</Badge>
        </div>

        <div className="space-y-3">
          {mockPlaces.map((place) => {
            const IconComponent = getPlaceIcon(place.type);
            return (
              <Card key={place.id} className="overflow-hidden hover:shadow-medium transition-smooth hover-accent">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getPlaceTypeColor(place.type)}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{place.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{place.type}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    {place.address}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Radius: {place.radius}m</span>
                      <span>Last visit: {new Date(place.lastVisit).toLocaleDateString()}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {place.dinnerCount} dinners
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Bottom spacing */}
      <div className="h-8" />

      <FloatingActionButton />
      <BottomNavigation />
    </div>
  );
};

export default Places;