import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FloatingActionButton = () => {
  return (
    <Button
      variant="fab"
      size="fab" 
      className="fixed bottom-20 right-4 z-50 shadow-glow hover:shadow-strong transition-smooth"
      aria-label="Add dinner"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
};