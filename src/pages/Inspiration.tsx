import { Award, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useEffect } from "react";
import { useDishOfDay, useCooldownSuggestions } from "@/hooks/useInsights";

const Inspiration = () => {
  const today = new Date();
  const { data: dishOfDay, loading: dotdLoading } = useDishOfDay(today);
  const { data: cooldown, loading: cooldownLoading } = useCooldownSuggestions(14, 20);

  useEffect(() => {
    // Placeholder for future filters
  }, []);

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Inspiration</h1>
            <div />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-[100px]">
        {/* Dish of the Day */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Dish of the Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dotdLoading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : dishOfDay ? (
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-foreground">{dishOfDay.dish_title}</div>
                  {dishOfDay.top_variant && (
                    <div className="text-sm text-muted-foreground">Variant: {dishOfDay.top_variant}</div>
                  )}
                  <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                    {dishOfDay.last_eaten ? (
                      <Badge variant="secondary">Last eaten: {new Date(dishOfDay.last_eaten).toLocaleDateString()}</Badge>
                    ) : (
                      <Badge variant="secondary">Not eaten yet</Badge>
                    )}
                  </div>
                </div>
                {dishOfDay.photo_url && (
                  <img src={dishOfDay.photo_url} alt={dishOfDay.dish_title} className="ml-4 w-20 h-20 rounded-lg object-cover" />
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">No suggestion available today</div>
            )}
          </CardContent>
        </Card>

        {/* Cooldown Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5" />
              Cooldown Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cooldownLoading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : cooldown && cooldown.length > 0 ? (
              cooldown.map((item) => (
                <div key={item.dish_id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">{item.dish_title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.last_eaten ? `Last eaten ${new Date(item.last_eaten).toLocaleDateString()}` : 'Not eaten yet'}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{item.times_90d} in 90d</Badge>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">No cooldown suggestions</div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Inspiration;


