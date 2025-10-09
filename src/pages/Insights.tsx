import { TrendingUp, Calendar, MapPin, Utensils, Target, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from "@/components/BottomNavigation";
import { TimeRangePicker, useTimeRangeController } from "@/components/TimeRangePicker";
import type { TimeRangeType } from "@/hooks/useTimeRange";
import { useKpis, useTopTags, useTrends } from "@/hooks/useInsights";

// Mock insights data
const insights = {
  thisMonth: {
    totalDinners: 23,
    atHome: 15,
    restaurant: 8,
    diversityScore: 0.78,
    healthScore: 72,
    streak: 5
  },
  lastMonth: {
    totalDinners: 28,
    atHome: 18,
    restaurant: 10,
    diversityScore: 0.65,
    healthScore: 68,
    streak: 8
  },
  topCuisines: [
    { name: "Italian", count: 8, percentage: 35 },
    { name: "Japanese", count: 6, percentage: 26 },
    { name: "Thai", count: 4, percentage: 17 },
    { name: "Mexican", count: 3, percentage: 13 },
    { name: "Indian", count: 2, percentage: 9 }
  ],
  topIngredients: [
    { name: "Chicken", count: 12, percentage: 52 },
    { name: "Rice", count: 9, percentage: 39 },
    { name: "Salmon", count: 7, percentage: 30 },
    { name: "Pasta", count: 6, percentage: 26 },
    { name: "Vegetables", count: 15, percentage: 65 }
  ],
  weeklyTrend: [
    { week: "Week 1", dinners: 6, home: 4, out: 2 },
    { week: "Week 2", dinners: 7, home: 3, out: 4 },
    { week: "Week 3", dinners: 5, home: 4, out: 1 },
    { week: "Week 4", dinners: 5, home: 4, out: 1 }
  ]
};

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
  const { range, setType } = useTimeRangeController("month");
  const { data: kpis } = useKpis(range.start, range.end);
  const { data: topTags } = useTopTags(range.start, range.end, 10);
  const { data: trends } = useTrends(range.start, range.end, 'day');
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
            {/* Key Stats Grid (live when RPC exists, else fallback to mock) */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title="Total Dinners"
                value={kpis?.total_meals ?? insights.thisMonth.totalDinners}
                subtitle={`${kpis?.unique_dishes ?? 0} unique dishes`}
                icon={Utensils}
                trend="neutral"
              />
              <StatCard
                title="Total Dishes"
                value={kpis?.unique_dishes ?? 0}
                subtitle={`${Math.round((kpis?.new_ratio ?? 0) * 100)}% new`}
                icon={Award}
                trend="up"
              />
              <StatCard
                title="New Ratio"
                value={`${Math.round((kpis?.new_ratio ?? 0) * 100)}%`}
                subtitle="New vs repeat dishes"
                icon={Target}
                trend="up"
              />
              <StatCard
                title="Health Score"
                value={kpis?.avg_health ? Math.round(kpis.avg_health) : 'N/A'}
                subtitle={kpis?.avg_effort ? `Avg: ${kpis.avg_effort}` : 'No data'}
                icon={TrendingUp}
                trend="up"
              />
            </div>

            {/* Home vs Restaurant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Dining Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">At Home</span>
                  <Badge variant="secondary">{insights.thisMonth.atHome} meals</Badge>
                </div>
                <Progress value={(insights.thisMonth.atHome / insights.thisMonth.totalDinners) * 100} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Restaurants</span>
                  <Badge variant="outline">{insights.thisMonth.restaurant} meals</Badge>
                </div>
                <Progress value={(insights.thisMonth.restaurant / insights.thisMonth.totalDinners) * 100} className="h-2" />
              </CardContent>
            </Card>

            {/* Top Cuisines */}
            <Card>
              <CardHeader>
                <CardTitle>Top Cuisines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.topCuisines.map((cuisine, index) => (
                  <div key={cuisine.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium">{cuisine.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${cuisine.percentage}%` }}
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {cuisine.count}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Ingredients - Real Data */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Ingredients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topTags && topTags.length > 0 ? (
                  topTags.map((ingredient, index) => {
                    const maxFreq = Math.max(...topTags.map(t => t.freq));
                    const percentage = maxFreq > 0 ? (ingredient.freq / maxFreq) * 100 : 0;
                    
                    return (
                      <div key={ingredient.tag} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="text-sm font-medium capitalize">{ingredient.tag}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-secondary transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {ingredient.freq}
                          </Badge>
                        </div>
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

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="w-full">
                View Detailed Report
              </Button>
              <Button variant="secondary" className="w-full">
                Export Data
              </Button>
            </div>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default Insights;