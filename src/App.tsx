import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import Index from "./pages/Index";
import Places from "./pages/Places";
import Inspiration from "./pages/Inspiration";
import Insights from "./pages/Insights";
import NotFound from "./pages/NotFound";
import SupabaseTest from "./components/SupabaseTest";

const queryClient = new QueryClient();

// Basename: root in dev, repo path in production
const getBasename = () => (import.meta.env.DEV ? '/' : '/dinner-lens-ai');

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter basename={getBasename()}>
          <AuthGate>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/places" element={<Places />} />
              <Route path="/inspiration" element={<Inspiration />} />
              <Route path="/insights" element={<Insights />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthGate>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
