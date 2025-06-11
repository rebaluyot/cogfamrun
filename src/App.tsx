import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useEffect } from "react";
import { setupStorage } from "@/lib/setup-storage";
import { useAppSettings } from "@/config/app-settings";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Registration from "./pages/Registration";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import KitDistribution from "./pages/KitDistribution";
import ClaimLocationsAdmin from "./pages/admin/ClaimLocationsAdmin";
import ThemeTestPage from "./pages/admin/ThemeTestPage";
import { Navigation } from "./components/Navigation";
import "./styles/theme-colors.css";

// Create a new QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  }
});

// Inner component that uses React Query hooks
const AppContent = () => {
  // Use App settings to set document title
  const { settings } = useAppSettings();
  
  useEffect(() => {
    // Update document title with the app title from settings
    if (settings?.appTitle) {
      document.title = settings.appTitle;
    }
  }, [settings?.appTitle]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={
              <ProtectedRoute requiredPermission="isAdmin">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/registration" element={<Registration />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={
              <ProtectedRoute requiredPermission="isAdmin">
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/admin/claim-locations" element={
              <ProtectedRoute requiredPermission="isAdmin">
                <ClaimLocationsAdmin />
              </ProtectedRoute>
            } />
            <Route path="/kit-distribution" element={
              <ProtectedRoute requiredPermission="canDistributeKits">
                <KitDistribution />
              </ProtectedRoute>
            } />
            <Route path="/admin/theme-test" element={
              <ProtectedRoute requiredPermission="isAdmin">
                <ThemeTestPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

// Main App component that sets up providers
const App = () => {
  useEffect(() => {
    setupStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
