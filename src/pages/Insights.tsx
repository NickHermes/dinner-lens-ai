import { TrendingUp, Utensils, Target, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { TimeRangePicker, useTimeRangeController } from "@/components/TimeRangePicker";
import type { TimeRangeType } from "@/hooks/useTimeRange";
import { useKpis, useTopTags, useTrends, useTopCuisines } from "@/hooks/useInsights";

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
  const { data: trends } = useTrends(range.start, range.end, 'day');
  const { data: topCuisines } = useTopCuisines(range.start, range.end, 10);
  return (
    <div className="min-h-screen bg-gradient-background pb-24">
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
        <div className="space-y-6">
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

            {/* Health & Effort Trends - Real Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Health & Effort Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trends && trends.length > 0 ? (
                  trends.slice(0, 7).map((trend) => (
                    <div key={trend.bucket_date} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {new Date(trend.bucket_date).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            Health: {trend.avg_health ? Math.round(trend.avg_health) : 'N/A'}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {trend.meals} meals
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ 
                              width: `${trend.avg_health ? (trend.avg_health / 100) * 100 : 0}%` 
                            }}
                            title={`Health Score: ${trend.avg_health ? Math.round(trend.avg_health) : 'N/A'}`}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {trend.effort_mode || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <p>No trend data available</p>
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