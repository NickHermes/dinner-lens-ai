import { Camera, MapPin, TrendingUp, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { DinnerCard } from "@/components/DinnerCard";
import { BottomNavigation } from "@/components/BottomNavigation";
import heroImage from "@/assets/hero-dinner.jpg";

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
  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">DinnerLens</h1>
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="relative overflow-hidden rounded-2xl mb-8 shadow-strong">
            <img 
              src={heroImage} 
              alt="Beautiful dinner spread" 
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-hero/60 flex items-center justify-center">
              <div className="text-white text-center">
                <h2 className="text-4xl font-bold mb-4">Document Every Delicious Moment</h2>
                <p className="text-xl opacity-90 mb-6">Capture, tag, and explore your culinary journey with AI-powered insights</p>
                <Button variant="hero" size="lg" className="shadow-glow">
                  <Camera className="mr-2 h-5 w-5" />
                  Start Capturing
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            <Card className="p-4 text-center bg-card/60 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">127</div>
              <div className="text-sm text-muted-foreground">Dinners</div>
            </Card>
            <Card className="p-4 text-center bg-card/60 backdrop-blur-sm">
              <div className="text-2xl font-bold text-secondary">8</div>
              <div className="text-sm text-muted-foreground">Places</div>
            </Card>
            <Card className="p-4 text-center bg-card/60 backdrop-blur-sm">
              <div className="text-2xl font-bold text-accent">15</div>
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
            <Input 
              placeholder="Ask: spicy noodles I ate with salmon last winter..." 
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="px-4 pb-20">
        <div className="container mx-auto">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Recent Dinners</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mockDinners.map((dinner) => (
              <DinnerCard key={dinner.id} dinner={dinner} />
            ))}
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <BottomNavigation />

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  );
};

export default Index;