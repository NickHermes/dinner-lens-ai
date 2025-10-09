import { TrendingUp, Calendar, MapPin, Utensils, Target, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from "@/components/BottomNavigation";
import { TimeRangePicker, useTimeRangeController } from "@/components/TimeRangePicker";
import type { TimeRangeType } from "@/hooks/useTimeRange";
import { useKpis, useTopTags } from "@/hooks/useInsights";

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

            {/* Top Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Ingredients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.topIngredients.map((ingredient, index) => (
                  <div key={ingredient.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium">{ingredient.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-secondary transition-all"
                          style={{ width: `${ingredient.percentage}%` }}
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {ingredient.count}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Weekly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.weeklyTrend.map((week) => (
                  <div key={week.week} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{week.week}</span>
                      <Badge variant="outline">{week.dinners} dinners</Badge>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div 
                        className="bg-primary rounded"
                        style={{ flex: week.home }}
                        title={`${week.home} home meals`}
                      />
                      <div 
                        className="bg-secondary rounded"
                        style={{ flex: week.out }}
                        title={`${week.out} restaurant meals`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{week.home} home</span>
                      <span>{week.out} out</span>
                    </div>
                  </div>
                ))}
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