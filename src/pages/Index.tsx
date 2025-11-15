import { Search, Plus, LogOut, Camera, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { DinnerCard } from "@/components/DinnerCard";
import { DinnerDetail } from "@/components/DinnerDetail";
import { DishCard } from "@/components/DishCard";
import { DishDetail } from "@/components/DishDetail";
import { AddDinner } from "@/components/AddDinner";
import { MealTypeSelector } from "@/components/MealTypeSelector";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState, useMemo, useEffect } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

// Mock data for demonstration
const mockDinners = [
  {
    id: "1",
    title: "Salmon Teriyaki Bowl",
    date: "2024-01-15",
    place: "Home",
    tags: ["Japanese", "Fish", "Healthy"],
    imageUrl: "placeholder.svg"
  },
  {
    id: "2", 
    title: "Margherita Pizza",
    date: "2024-01-14",
    place: "Tony's Pizzeria",
    tags: ["Italian", "Vegetarian", "Pizza"],
    imageUrl: "placeholder.svg"
  },
  {
    id: "3",
    title: "Chicken Pad Thai",
    date: "2024-01-13", 
    place: "Bangkok Street",
    tags: ["Thai", "Chicken", "Noodles"],
    imageUrl: "placeholder.svg"
  },
  {
    id: "4",
    title: "Quinoa Buddha Bowl",
    date: "2024-01-12",
    place: "Home",
    tags: ["Vegan", "Healthy", "Quinoa"],
    imageUrl: "placeholder.svg"
  }
];

const Index = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showMealTypeSelector, setShowMealTypeSelector] = useState(false);
  const [showAddDinner, setShowAddDinner] = useState(false);
  const [editDinner, setEditDinner] = useState<any>(null);
  const [repeatMealData, setRepeatMealData] = useState<any>(null);
  const [initialTitle, setInitialTitle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  // Listen for custom event to show MealTypeSelector
  useEffect(() => {
    const handleShowMealTypeSelector = () => {
      console.log('Custom event received: showMealTypeSelector');
      setShowMealTypeSelector(true);
    };

    window.addEventListener('showMealTypeSelector', handleShowMealTypeSelector);
    return () => {
      window.removeEventListener('showMealTypeSelector', handleShowMealTypeSelector);
    };
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    console.log('Index state changed:', {
      showMealTypeSelector,
      showAddDinner,
      editDinner: !!editDinner,
      repeatMealData: !!repeatMealData
    });
  }, [showMealTypeSelector, showAddDinner, editDinner, repeatMealData]);

  // Reset pagination when filters/search change
  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchQuery]);

  const handleDishClick = (dish: any) => {
    setSelectedDish(dish);
    setShowDetail(true);
  };

  const handleEditInstance = (instance: any) => {
    // Convert instance back to old dinner format for editing
    const dinnerForEdit = {
      id: instance.id,
      title: selectedDish?.title || '',
      datetime: instance.datetime,
      place_id: instance.place_id,
      location: instance.location || '', // Add location field
      variant_title: instance.variant_title || '', // Add variant title field
      notes: instance.notes || '',
      meal_type: selectedDish?.meal_type, // Now from dish level
      deliciousness: null,
      effort: selectedDish?.effort, // Now from dish level
      health_score: selectedDish?.health_score,
      photos: instance.photo_url ? [{ url: instance.photo_url }] : [],
      tags: instance.tags || [], // Load variant tags
      places: instance.places,
      count: instance.count || 1, // Include count for conditional logic
      isVariantEdit: true // Flag to indicate this is variant-level editing
    };
    
    setEditDinner(dinnerForEdit);
    setShowDetail(false);
    setShowAddDinner(true);
  };

  const handleEditDish = () => {
    // Edit dish-level properties (title, health score, effort, meal type, base tags)
    const dishForEdit = {
      id: selectedDish?.id,
      title: selectedDish?.title || '',
      datetime: new Date().toISOString(), // Current time as placeholder
      place_id: null,
      notes: selectedDish?.notes || '', // Use dish notes, not empty string
      meal_type: selectedDish?.meal_type,
      deliciousness: null,
      effort: selectedDish?.effort,
      health_score: selectedDish?.health_score,
      photos: selectedDish?.base_photo_url ? [{ url: selectedDish.base_photo_url }] : [],
      tags: selectedDish?.base_tags || [],
      places: null,
      isDishEdit: true, // Flag to indicate this is dish-level editing
      variantPhotos: selectedDish?.dinner_instances?.filter(instance => 
        instance.photo_url && instance.photo_url !== selectedDish.base_photo_url
      ).sort((a, b) => {
        // Sort by last_consumed (newest first), fallback to datetime
        const aDate = a.last_consumed || a.datetime
        const bDate = b.last_consumed || b.datetime
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      }).map(instance => ({
        url: instance.photo_url,
        variant_title: instance.variant_title,
        datetime: instance.datetime
      })) || [] // Pass variant photos for selection (excluding current base photo, ordered newest to oldest)
    };
    
    setEditDinner(dishForEdit);
    setShowDetail(false);
    setShowAddDinner(true);
  };

  const handleCloseAddDinner = () => {
    setShowAddDinner(false);
    setShowMealTypeSelector(false);
    setEditDinner(null);
    setRepeatMealData(null);
    setInitialTitle('');
  };

  const handleNewDish = (searchQuery?: string) => {
    setShowMealTypeSelector(false);
    setEditDinner(null);
    setRepeatMealData(null);
    setShowAddDinner(true);
    // Store the search query to pre-fill the title in AddDinner
    if (searchQuery) {
      setInitialTitle(searchQuery);
    }
  };

  const handleRepeatMeal = (dishData: any) => {
    setShowMealTypeSelector(false);
    setRepeatMealData(dishData);
    setEditDinner(null);
    setShowAddDinner(true);
  };

  const refreshDishes = () => {
    // Invalidate and refetch all related queries
    queryClient.invalidateQueries({ queryKey: ['dishes', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['stats', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['locations', user?.id] });
    
    // Force refetch to ensure immediate updates
    queryClient.refetchQueries({ queryKey: ['dishes', user?.id] });
    queryClient.refetchQueries({ queryKey: ['stats', user?.id] });
    queryClient.refetchQueries({ queryKey: ['locations', user?.id] });
  };

  // Fetch ALL dishes for search/filter, then paginate
  const { data: allDishes = [], isLoading } = useQuery({
    queryKey: ['dishes', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('No user found');
        return [];
      }
      
      console.log('Fetching dishes for user:', user.id);
      
      // Load ALL dishes with their instances and base tags
      const { data, error } = await supabase
        .from('dishes')
        .select(`
          id, title, health_score, base_photo_url, effort, meal_type, notes, created_at, updated_at,
          dinner_instances(id, datetime, location, variant_title, notes, photo_url, place_id, count, last_consumed, consumption_records(id, consumed_at, location)),
          tags(name, type, is_base_tag)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log('Raw dishes data:', data);
      
      // Attach variant-level tags to instances
      const allInstanceIds = (data || []).flatMap((dish: any) => (dish.dinner_instances || []).map((i: any) => i.id))
      if (allInstanceIds.length > 0) {
        const { data: instanceTags } = await supabase
          .from('tags')
          .select('instance_id, name, is_base_tag')
          .in('instance_id', allInstanceIds)
        const map: Record<string, any[]> = {}
        ;(instanceTags || []).forEach((t: any) => {
          if (!map[t.instance_id]) map[t.instance_id] = []
          map[t.instance_id].push({ name: t.name, is_base_tag: !!t.is_base_tag })
        })
        ;(data || []).forEach((dish: any) => {
          (dish.dinner_instances || []).forEach((inst: any) => {
            inst.tags = map[inst.id] || []
          })
        })
      }

      // Transform data to include latest instance and total consumption count
      const transformedData = data?.map(dish => {
        console.log('Processing dish:', dish.title, 'with instances:', dish.dinner_instances?.length);
        const instances = dish.dinner_instances || [];
        const latestInstance = instances.sort((a, b) => 
          new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
        )[0];
        
        // Calculate total consumption logs across all variants
        const totalConsumptionLogs = instances.reduce((sum, instance) => {
          return sum + (instance.consumption_records?.length || 1);
        }, 0);
        
        // Find the most recent consumption record across all instances
        let mostRecentConsumptionDate = null;
        instances.forEach(instance => {
          console.log('Instance:', instance.id, 'has consumption_records:', instance.consumption_records?.length);
          if (instance.consumption_records && instance.consumption_records.length > 0) {
            instance.consumption_records.forEach(record => {
              const recordDate = new Date(record.consumed_at);
              console.log('Consumption record date:', recordDate, 'from record:', record);
              if (!mostRecentConsumptionDate || recordDate > mostRecentConsumptionDate) {
                mostRecentConsumptionDate = recordDate;
              }
            });
          }
        });
        
        const result = {
          ...dish,
          latest_instance: latestInstance,
          total_instances: instances.length, // Keep for backward compatibility
          total_consumption_logs: totalConsumptionLogs, // New field for total logs
          base_tags: dish.tags?.filter(tag => tag.is_base_tag) || [],
          // Use most recent consumption record date, fallback to latest instance, then dish creation
          last_eaten_date: mostRecentConsumptionDate?.toISOString() || latestInstance?.datetime || dish.created_at
        };
        console.log('Dish result:', dish.title, 'last_eaten_date:', result.last_eaten_date);
        return result;
      }) || [];
      
      // Sort by last eaten date (most recent first)
      transformedData.sort((a, b) => 
        new Date(b.last_eaten_date).getTime() - new Date(a.last_eaten_date).getTime()
      );
      
      console.log('Transformed dishes data:', transformedData);
      
      return transformedData;
    },
    enabled: !!user
  });

  // Filter dishes based on search query and active filter
  const filteredDishes = useMemo(() => {
    let filtered = allDishes;

    // Apply quick filter first
    if (activeFilter !== 'all') {
      filtered = allDishes.filter(dish => {
        switch (activeFilter) {
          case 'at-home':
            // Check if any instance has at-home consumption records
            return dish.dinner_instances?.some(instance => {
              return instance.consumption_records?.some((record: any) => {
                const location = record.location || instance.location;
                return !location || location.trim() === '' || location.toLowerCase().includes('home');
              });
            });
          case 'breakfast':
            return dish.meal_type === 'breakfast';
          case 'lunch':
            return dish.meal_type === 'lunch';
          case 'dinner':
            return dish.meal_type === 'dinner';
          default:
            return true;
        }
      });
    }

    // Then apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      filtered = filtered.filter(dish => {
        // Search in dish title
        if (dish.title.toLowerCase().includes(query)) {
          return true;
        }

        // Search in dish-level tags
        if (dish.base_tags?.some(tag => tag.name.toLowerCase().includes(query))) {
          return true;
        }

        // Search in variant titles and variant tags
        if (dish.dinner_instances?.some(instance => {
          // Search in variant title
          if (instance.variant_title?.toLowerCase().includes(query)) {
            return true;
          }
          // Search in variant tags
          if (instance.tags && instance.tags.some((t: any) => (t.name || '').toLowerCase().includes(query))) {
            return true;
          }
          return false;
        })) {
          return true;
        }

        return false;
      });
    }

    return filtered;
  }, [allDishes, searchQuery, activeFilter]);

  // Paginate the filtered results
  const paginatedDishes = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredDishes.slice(startIndex, endIndex);
  }, [filteredDishes, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredDishes.length / pageSize));

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['stats', user?.id],
    queryFn: async () => {
      if (!user) return { 
        totalDishes: 0, 
        uniqueDishes: 0,
        places: 0, 
        placesByType: { friends: 0, restaurants: 0, other: 0 },
        totalDishesByMealType: { breakfast: 0, lunch: 0, dinner: 0, other: 0 },
        uniqueDishesByMealType: { breakfast: 0, lunch: 0, dinner: 0, other: 0 }
      };
      
      try {
        // Get total number of consumption records (total meals) - matching analytics logic
        const { data: consumptionData, error: consumptionError } = await supabase
          .from('consumption_records')
          .select('id, instance_id')
          .eq('user_id', user.id)

        if (consumptionError) throw consumptionError
        console.log('Consumption data:', consumptionData?.length)

        // Get unique locations
        const { data: locationData, error: locationError } = await supabase
          .from('consumption_records')
          .select('location')
          .eq('user_id', user.id)
          .not('location', 'is', null)

        if (locationError) throw locationError

        // Count unique locations (case-insensitive)
        const uniqueLocations = new Set(
          locationData?.map(record => record.location?.toLowerCase().trim()).filter(Boolean) || []
        )
        console.log('Unique locations:', uniqueLocations.size)

        // Get unique dishes that have consumption records - matching analytics logic
        // This counts dishes that have been consumed, not all dishes
        // First get all consumption records with their instance_ids
        const { data: consumptionWithInstances, error: consumptionInstancesError } = await supabase
          .from('consumption_records')
          .select('instance_id')
          .eq('user_id', user.id)

        if (consumptionInstancesError) throw consumptionInstancesError

        // Get unique instance_ids
        const instanceIds = [...new Set(consumptionWithInstances?.map(r => r.instance_id).filter(Boolean) || [])]
        
        if (instanceIds.length === 0) {
          console.log('No consumption records found')
          const result = { 
            totalDishes: 0, 
            uniqueDishes: 0,
            places: uniqueLocations.size, 
            placesByType: { friends: 0, restaurants: 0, other: 0 },
            totalDishesByMealType: { breakfast: 0, lunch: 0, dinner: 0, other: 0 },
            uniqueDishesByMealType: { breakfast: 0, lunch: 0, dinner: 0, other: 0 }
          }
          return result
        }

        // Get dish_ids from those instances
        const { data: instancesData, error: instancesError } = await supabase
          .from('dinner_instances')
          .select('dish_id, dishes!inner(meal_type)')
          .in('id', instanceIds)
          .eq('user_id', user.id)

        if (instancesError) throw instancesError
        
        // Extract unique dish_ids and meal types
        const uniqueDishIds = new Set<string>()
        const dishesByMealType = { breakfast: 0, lunch: 0, dinner: 0, other: 0 }
        
        instancesData?.forEach(instance => {
          const dishId = instance.dish_id
          const mealType = (instance.dishes as any)?.meal_type
          
          if (dishId) {
            uniqueDishIds.add(dishId)
            
            // Count meal types for dishes with consumption (only count once per dish)
            if (mealType && mealType in dishesByMealType && !uniqueDishIds.has(dishId)) {
              // Actually, we need to count each dish once, so let's do this differently
            }
          }
        })
        
        // Count meal types properly (once per unique dish)
        const dishIdsArray = Array.from(uniqueDishIds)
        if (dishIdsArray.length > 0) {
          const { data: dishesData, error: dishesDataError } = await supabase
            .from('dishes')
            .select('meal_type')
            .in('id', dishIdsArray)
            .eq('user_id', user.id)

          if (!dishesDataError && dishesData) {
            dishesData.forEach(dish => {
              const mealType = dish.meal_type
              if (mealType && mealType in dishesByMealType) {
                dishesByMealType[mealType as keyof typeof dishesByMealType]++
              }
            })
          }
        }
        
        console.log('Unique dishes (with consumption):', uniqueDishIds.size)

        // For now, use the same breakdown for total dishes (we'll fix this later)
        const consumptionByMealType = dishesByMealType

        const result = { 
          totalDishes: consumptionData?.length || 0, 
          uniqueDishes: uniqueDishIds.size || 0,
          places: uniqueLocations.size, 
          placesByType: { friends: 0, restaurants: 0, other: 0 }, // TODO: Implement place type categorization
          totalDishesByMealType: consumptionByMealType,
          uniqueDishesByMealType: dishesByMealType
        };
        console.log('Final stats result:', result);
        return result;
      } catch (error) {
        console.error('Error fetching stats:', error)
        return { 
          totalDishes: 0, 
          uniqueDishes: 0,
          places: 0, 
          placesByType: { friends: 0, restaurants: 0, other: 0 },
          totalDishesByMealType: { breakfast: 0, lunch: 0, dinner: 0, other: 0 },
          uniqueDishesByMealType: { breakfast: 0, lunch: 0, dinner: 0, other: 0 }
        };
      }
    },
    enabled: !!user,
    staleTime: 0, // Always consider data stale to ensure fresh updates
    refetchOnWindowFocus: true // Refetch when window regains focus
  });



  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">DinnerLens</h1>
            <div className="flex items-center gap-2">
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
              <div className="text-2xl font-bold text-primary">{stats?.totalDishes || 0}</div>
              <div className="text-sm text-muted-foreground">Total Dishes</div>
            </Card>
            <Card className="p-4 text-center bg-card/60 backdrop-blur-sm">
              <div className="text-2xl font-bold text-secondary">{stats?.uniqueDishes || 0}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Unique Dishes
                {stats?.uniqueDishesByMealType && (
                  <HoverCard openDelay={100} closeDelay={50}>
                    <HoverCardTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground hover-white cursor-pointer" />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-auto p-2">
                      <div className="text-xs space-y-1">
                        <div>Breakfast: {stats.uniqueDishesByMealType.breakfast}</div>
                        <div>Lunch: {stats.uniqueDishesByMealType.lunch}</div>
                        <div>Dinner: {stats.uniqueDishesByMealType.dinner}</div>
                        <div>Other: {stats.uniqueDishesByMealType.other}</div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
            </Card>
            <Card className="p-4 text-center bg-card/60 backdrop-blur-sm">
              <div className="text-2xl font-bold text-accent">{stats?.places || 0}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Places
                {stats?.placesByType && (
                  <HoverCard openDelay={100} closeDelay={50}>
                    <HoverCardTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground hover-white cursor-pointer" />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-auto p-2">
                      <div className="text-xs space-y-1">
                        <div>Friends: {stats.placesByType.friends}</div>
                        <div>Restaurants: {stats.placesByType.restaurants}</div>
                        <div>Other: {stats.placesByType.other}</div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="px-4 mb-6">
        <div className="container mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button 
              variant={activeFilter === 'all' ? 'default' : 'filter'} 
              size="sm"
              onClick={() => setActiveFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={activeFilter === 'at-home' ? 'default' : 'filter'} 
              size="sm"
              onClick={() => setActiveFilter('at-home')}
            >
              At Home
            </Button>
            <Button 
              variant={activeFilter === 'breakfast' ? 'default' : 'filter'} 
              size="sm"
              onClick={() => setActiveFilter('breakfast')}
            >
              Breakfast
            </Button>
            <Button 
              variant={activeFilter === 'lunch' ? 'default' : 'filter'} 
              size="sm"
              onClick={() => setActiveFilter('lunch')}
            >
              Lunch
            </Button>
            <Button 
              variant={activeFilter === 'dinner' ? 'default' : 'filter'} 
              size="sm"
              onClick={() => setActiveFilter('dinner')}
            >
              Dinner
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search dishes, variants, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover-accent"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
        </div>
      </section>

      {/* Gallery */}
      <section className="px-4">
        <div className="container mx-auto pb-[100px]">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Your Dishes</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading dishes...</div>
            </div>
          ) : allDishes.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No dishes yet</h3>
              <p className="text-muted-foreground mb-4">Start documenting your culinary journey!</p>
              <Button onClick={() => setShowMealTypeSelector(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Dish
              </Button>
            </div>
          ) : filteredDishes.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No dishes found</h3>
              <p className="text-muted-foreground mb-4">Try searching for something else or clear your search.</p>
              <Button onClick={() => setSearchQuery('')} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedDishes.map((dish) => (
                <DishCard 
                  key={dish.id} 
                  dish={dish} 
                  onClick={() => handleDishClick(dish)}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Navigation Tabs */}
      <BottomNavigation />

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => {
        console.log('FloatingActionButton clicked');
        setShowMealTypeSelector(true);
      }} />

      {/* Modals */}
      <DishDetail
        dish={selectedDish}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        onEdit={handleEditInstance}
        onEditDish={handleEditDish}
        onRefresh={refreshDishes}
      />
      
      <MealTypeSelector
        isOpen={showMealTypeSelector}
        onClose={() => setShowMealTypeSelector(false)}
        onNewDish={handleNewDish}
        onRepeatMeal={handleRepeatMeal}
      />
      
      <AddDinner
        open={showAddDinner}
        onOpenChange={handleCloseAddDinner}
        editDinner={editDinner}
        repeatMealData={repeatMealData}
        initialTitle={initialTitle}
        onSave={refreshDishes}
      />
    </div>
  );
};

export default Index;