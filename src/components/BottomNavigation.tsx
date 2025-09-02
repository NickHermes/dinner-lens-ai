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
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-sm border-t border-border z-40">
      <div className="flex justify-around py-3">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link key={path} to={path}>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "flex-col gap-1",
                  isActive && "text-primary bg-primary/10"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};