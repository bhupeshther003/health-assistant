import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { LocationProvider } from "@/hooks/use-location";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useNativeInit } from "@/hooks/use-native-init";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import HealthSetup from "./pages/HealthSetup";
import Dashboard from "./pages/Dashboard";
import Assistant from "./pages/Assistant";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import WatchConnect from "./pages/WatchConnect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component - checks authentication AND onboarding completion
function ProtectedRoute({ children, requireOnboarding = true }: { children: React.ReactNode; requireOnboarding?: boolean }) {
  const { user, loading, onboardingComplete } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to health setup if onboarding not completed (except for health-setup page itself)
  if (requireOnboarding && !onboardingComplete) {
    return <Navigate to="/health-setup" replace />;
  }

  return <>{children}</>;
}

// Public route that redirects to dashboard if logged in
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, onboardingComplete } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    // Redirect to health-setup if onboarding not completed, otherwise dashboard
    if (!onboardingComplete) {
      return <Navigate to="/health-setup" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/health-setup"
        element={
          <ProtectedRoute requireOnboarding={false}>
            <HealthSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute>
            <Assistant />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/watch-connect"
        element={
          <ProtectedRoute>
            <WatchConnect />
          </ProtectedRoute>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NativeInitializer({ children }: { children: React.ReactNode }) {
  useNativeInit();
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LocationProvider>
        <AuthProvider>
          <NativeInitializer>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </NativeInitializer>
        </AuthProvider>
      </LocationProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
