import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import TourManager from "./components/tours/TourManager";
import AnimatedRoutes from "./components/AnimatedRoutes";
import Header from "./components/Header";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const isAuthPage = location.pathname === "/auth";
  const isImportAccountPage = location.pathname === "/import-account";
  const showHeader = !isLandingPage && !isAuthPage && !isImportAccountPage;

  return (
    <>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <TourManager />
      {showHeader && <Header />}
      <AnimatedRoutes />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
