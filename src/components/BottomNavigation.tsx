import { Camera, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const BottomNavigation = () => {
  const location = useLocation();
  
  const navItems = [
    {
      path: "/",
      icon: Camera,
      label: "Gallery",
    },
    {
      path: "/places", 
      icon: MapPin,
      label: "Places",
    },
    {
      path: "/insights",
      icon: TrendingUp, 
      label: "Insights",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-sm border-t border-border z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around py-4 px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link key={path} to={path} className="flex-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "flex-col gap-2 w-full h-16 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive 
                    ? "text-primary bg-primary/15 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};