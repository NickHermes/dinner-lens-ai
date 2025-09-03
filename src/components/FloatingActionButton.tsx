import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export const FloatingActionButton = ({ onClick }: FloatingActionButtonProps) => {
  return (
    <Button
      variant="fab"
      size="fab" 
      className="fixed bottom-20 right-4 z-50 shadow-glow hover:shadow-strong transition-smooth"
      aria-label="Add dinner"
      onClick={onClick}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
};