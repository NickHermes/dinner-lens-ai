import { Search, Plus, LogOut, Camera, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { DinnerCard } from "@/components/DinnerCard";
import { DinnerDetail } from "@/components/DinnerDetail";
import { AddDinner } from "@/components/AddDinner";
import { BottomNavigation } from "@/components/BottomNavigation";
import { AISearch } from "@/components/AISearch";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Mock data for demonstration
const mockDinners = [
  {
    id: "1",
    title: "Salmon Teriyaki Bowl",
    date: "2024-01-15",
    place: "Home",
    tags: ["Japanese", "Fish", "Healthy"],
    imageUrl: "/placeholder.svg"
  },
  {
    id: "2", 
    title: "Margherita Pizza",
    date: "2024-01-14",
    place: "Tony's Pizzeria",
    tags: ["Italian", "Vegetarian", "Pizza"],
    imageUrl: "/placeholder.svg"
  },
  {
    id: "3",
    title: "Chicken Pad Thai",
    date: "2024-01-13", 
    place: "Bangkok Street",
    tags: ["Thai", "Chicken", "Noodles"],
    imageUrl: "/placeholder.svg"
  },
  {
    id: "4",
    title: "Quinoa Buddha Bowl",
    date: "2024-01-12",
    place: "Home",
    tags: ["Vegan", "Healthy", "Quinoa"],
    imageUrl: "/placeholder.svg"
  }
];

const Index = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDinner, setSelectedDinner] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddDinner, setShowAddDinner] = useState(false);
  const [editDinner, setEditDinner] = useState<any>(null);

  const handleDinnerClick = (dinner: any) => {
    setSelectedDinner(dinner);
    setShowDetail(true);
  };

  const handleEditDinner = (dinner: any) => {
    setEditDinner(dinner);
    setShowDetail(false);
    setShowAddDinner(true);
  };

  const handleCloseAddDinner = () => {
    setShowAddDinner(false);
    setEditDinner(null);
  };

  const refreshDinners = () => {
    queryClient.invalidateQueries({ queryKey: ['dinners', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['stats', user?.id] });
  };

  // Fetch real dinners from Supabase
  const { data: dinners = [], isLoading } = useQuery({
    queryKey: ['dinners', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('dinners')
        .select(`
          id, title, datetime, notes, favorite, health_score, deliciousness, effort,
          places(name, type),
          photos(url),
          tags(name, type, approved)
        `)
        .eq('user_id', user.id)
        .order('datetime', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['stats', user?.id],
    queryFn: async () => {
      if (!user) return { 
        dinners: 0, 
        places: 0, 
        placesByType: { friends: 0, restaurants: 0, other: 0 },
        cuisines: 0 
      };
      
      const [dinnersResult, activePlacesResult, mockPlacesResult] = await Promise.all([
        supabase.from('dinners').select('id', { count: 'exact' }).eq('user_id', user.id),
        // Count real places that are actively used by dinners
        supabase
          .from('dinners')
          .select('place_id')
          .eq('user_id', user.id)
          .not('place_id', 'is', null),
        // Get dinners with mock places stored in notes
        supabase
          .from('dinners')
          .select('notes')
          .eq('user_id', user.id)
          .not('notes', 'is', null)
      ]);
      
      // Get unique cuisine count by joining through dinners
      const { data: cuisineData } = await supabase
        .from('dinners')
        .select(`
          tags!inner(name, type, approved)
        `)
        .eq('user_id', user.id)
        .eq('tags.type', 'cuisine')
        .eq('tags.approved', true);
      
      const uniqueCuisines = new Set(cuisineData?.map(d => d.tags.name) || []).size;
      
      // Get real places with their types
      const realPlacesData = activePlacesResult.data?.map(d => d.place_id).filter(Boolean) || [];
      
      // Get place types for real places
      let realPlacesByType = { friends: 0, restaurants: 0, other: 0 };
      if (realPlacesData.length > 0) {
        const { data: placesData } = await supabase
          .from('places')
          .select('type')
          .in('id', realPlacesData);
        
        placesData?.forEach(place => {
          if (place.type === 'friend') realPlacesByType.friends++;
          else if (place.type === 'restaurant') realPlacesByType.restaurants++;
          else realPlacesByType.other++;
        });
      }
      
      // Count unique mock places (places stored in notes) - assume they're "other" type
      const mockPlaceNames = mockPlacesResult.data?.map(d => {
        if (d.notes) {
          const notesParts = d.notes.split(' | ');
          if (notesParts.length > 0) {
            const firstPart = notesParts[0].trim();
            if (firstPart && !firstPart.includes(' ') && firstPart.length < 50) {
              return firstPart;
            }
          }
        }
        return null;
      }).filter(Boolean) || [];
      
      const uniqueMockPlaces = new Set(mockPlaceNames).size;
      
      // Total unique places = real places + mock places
      const totalUniquePlaces = realPlacesData.length + uniqueMockPlaces;
      
      return {
        dinners: dinnersResult.count || 0,
        places: totalUniquePlaces,
        placesByType: {
          friends: realPlacesByType.friends,
          restaurants: realPlacesByType.restaurants,
          other: realPlacesByType.other + uniqueMockPlaces
        },
        cuisines: uniqueCuisines
      };
    },
    enabled: !!user
  });



  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">DinnerLens</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <section className="px-4 py-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center bg-card/60 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">{stats?.dinners || 0}</div>
              <div className="text-sm text-muted-foreground">Dinners</div>
            </Card>
            <Card className="p-4 text-center bg-card/60 backdrop-blur-sm">
              <div className="text-2xl font-bold text-secondary">{stats?.places || 0}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Places
                {stats?.placesByType && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="text-xs space-y-1">
                        <div>Friends: {stats.placesByType.friends}</div>
                        <div>Restaurants: {stats.placesByType.restaurants}</div>
                        <div>Other: {stats.placesByType.other}</div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </Card>
            <Card className="p-4 text-center bg-card/60 backdrop-blur-sm">
              <div className="text-2xl font-bold text-accent">{stats?.cuisines || 0}</div>
              <div className="text-sm text-muted-foreground">Cuisines</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="px-4 mb-6">
        <div className="container mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant="filter" size="sm">All</Button>
            <Button variant="filter" size="sm">At Home</Button>
            <Button variant="filter" size="sm">Restaurant</Button>
            <Button variant="filter" size="sm">Past Week</Button>
            <Button variant="filter" size="sm">Vegetarian</Button>
            <Button variant="filter" size="sm">Italian</Button>
          </div>
          
          <div className="mt-4">
            <AISearch />
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="px-4 pb-24">
        <div className="container mx-auto">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Recent Dinners</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading dinners...</div>
            </div>
          ) : dinners.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No dinners yet</h3>
              <p className="text-muted-foreground mb-4">Start documenting your culinary journey!</p>
              <Button onClick={() => setShowAddDinner(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Dinner
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dinners.map((dinner) => (
                <DinnerCard 
                  key={dinner.id} 
                  dinner={dinner} 
                  onClick={handleDinnerClick}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Navigation Tabs */}
      <BottomNavigation />

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => setShowAddDinner(true)} />

      {/* Modals */}
      <DinnerDetail
        dinner={selectedDinner}
        open={showDetail}
        onOpenChange={setShowDetail}
        onEdit={handleEditDinner}
        onDelete={refreshDinners}
      />
      
      <AddDinner
        open={showAddDinner}
        onOpenChange={handleCloseAddDinner}
        editDinner={editDinner}
        onSave={refreshDinners}
      />
    </div>
  );
};

export default Index;