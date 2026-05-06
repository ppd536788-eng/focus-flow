import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/AuthProvider";
import { XpProvider } from "@/providers/XpProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/app/Dashboard";
import Onboarding from "./pages/app/Onboarding";
import Schedule from "./pages/app/Schedule";
import Focus from "./pages/app/Focus";
import Achievements from "./pages/app/Achievements";
import Questions from "./pages/app/Questions";
import Settings from "./pages/app/Settings";
import Simulado from "./pages/app/Simulado";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: true } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <XpProvider>
           <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="cronograma" element={<Schedule />} />
              <Route path="foco" element={<Focus />} />
              <Route path="questoes" element={<Questions />} />
              <Route path="simulado" element={<Simulado />} />
              <Route path="conquistas" element={<Achievements />} />
              <Route path="ajustes" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
           </Routes>
          </XpProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
