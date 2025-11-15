import { TrendingUp, Utensils, Target, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { TimeRangePicker, useTimeRangeController } from "@/components/TimeRangePicker";
import type { TimeRangeType } from "@/hooks/useTimeRange";
import { useKpis, useTopTags, useTopCuisines, useHealthiestDishes } from "@/hooks/useInsights";

const StatCard = ({ title, value, subtitle, icon: Icon, trend }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${
          trend === 'up' ? 'bg-secondary text-secondary-foreground' :
          trend === 'down' ? 'bg-destructive/10 text-destructive' :
          'bg-muted text-muted-foreground'
        }`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Insights = () => {
  const { range, setType } = useTimeRangeController("week");
  const { data: kpis } = useKpis(range.start, range.end);
  const { data: topTags } = useTopTags(range.start, range.end, 10);
  const { data: topCuisines } = useTopCuisines(range.start, range.end, 10);
  const { data: healthiestDishes } = useHealthiestDishes(range.start, range.end);
  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Insights</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Time Range Picker */}
        <TimeRangePicker value={range.type} onChange={(v: TimeRangeType) => setType(v)} />
        
        {/* Main Content */}
        <div className="space-y-6 pb-[100px]">
            {/* Key Stats Grid - Cleaned up */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title="Total Dishes"
                value={kpis?.total_meals ?? 0}
                subtitle="consumption records"
                icon={Utensils}
                trend="neutral"
              />
              <StatCard
                title="Unique Dishes"
                value={kpis?.unique_dishes ?? 0}
                subtitle="different dishes tried"
                icon={Award}
                trend="up"
              />
              <StatCard
                title="New Ratio"
                value={`${Math.round((kpis?.new_ratio ?? 0) * 100)}%`}
                subtitle="new vs repeat dishes"
                icon={Target}
                trend="up"
              />
              <StatCard
                title="Health Score"
                value={kpis?.avg_health ? Math.round(kpis.avg_health) : 'N/A'}
                subtitle="average health rating"
                icon={TrendingUp}
                trend="up"
              />
            </div>

            {/* Popular Cuisines and Ingredients - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Cuisines - Real Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Cuisines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topCuisines && topCuisines.length > 0 ? (
                    topCuisines.slice(0, 10).map((cuisine) => {
                      return (
                        <div key={cuisine.cuisine} className="flex items-center gap-3">
                          <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                            {cuisine.freq}
                          </Badge>
                          <span className="text-sm font-medium capitalize">{cuisine.cuisine}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Utensils className="h-8 w-8 mx-auto mb-2" />
                      <p>No cuisine data available</p>
                      <p className="text-xs mt-1">Add cuisine tags to your dishes to see analytics</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Ingredients - Real Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Ingredients</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topTags && topTags.length > 0 ? (
                    topTags.slice(0, 10).map((ingredient) => {
                      return (
                        <div key={ingredient.tag} className="flex items-center gap-3">
                          <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                            {ingredient.freq}
                          </Badge>
                          <span className="text-sm font-medium capitalize">{ingredient.tag}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Utensils className="h-8 w-8 mx-auto mb-2" />
                      <p>No ingredient data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Health Overview */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Health Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                {/* Average Health */}
                {kpis?.avg_health !== null && kpis?.avg_health !== undefined ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Health</span>
                      <span className="text-lg font-bold">{Math.round(kpis.avg_health)}%</span>
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ 
                          width: `${kpis.avg_health}%` 
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No health data available</p>
                  </div>
                )}

                {/* Healthiest Dish */}
                {healthiestDishes?.healthiest && (
                  <div className="space-y-2 pt-4 border-t">
                    <span className="text-sm font-medium text-muted-foreground">Healthiest Dish</span>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {healthiestDishes.healthiest.base_photo_url && (
                          <img 
                            src={healthiestDishes.healthiest.base_photo_url} 
                            alt={healthiestDishes.healthiest.dish_title}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'placeholder.svg'
                            }}
                          />
                        )}
                        <span className="text-base font-medium capitalize truncate">{healthiestDishes.healthiest.dish_title}</span>
                      </div>
                      <Badge variant="outline" className="text-sm flex-shrink-0">
                        {healthiestDishes.healthiest.health_score}%
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Unhealthiest Dish */}
                {healthiestDishes?.unhealthiest && (
                  <div className="space-y-2 pt-4 border-t">
                    <span className="text-sm font-medium text-muted-foreground">Unhealthiest Dish</span>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {healthiestDishes.unhealthiest.base_photo_url && (
                          <img 
                            src={healthiestDishes.unhealthiest.base_photo_url} 
                            alt={healthiestDishes.unhealthiest.dish_title}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'placeholder.svg'
                            }}
                          />
                        )}
                        <span className="text-base font-medium capitalize truncate">{healthiestDishes.unhealthiest.dish_title}</span>
                      </div>
                      <Badge variant="outline" className="text-sm flex-shrink-0">
                        {healthiestDishes.unhealthiest.health_score}%
                      </Badge>
                    </div>
                  </div>
                )}

                {(!healthiestDishes?.healthiest && !healthiestDishes?.unhealthiest && kpis?.avg_health === null) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <p>No health data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default Insights;