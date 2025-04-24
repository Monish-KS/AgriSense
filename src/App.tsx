import { Layout } from "@/components/layout";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

// Page Imports
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Maps from "./pages/Maps";
import SoilAnalytics from "./pages/SoilAnalytics";
import NotFound from "./pages/NotFound";
import CropRecommendations from "./pages/CropRecommendations";
import Settings from "./pages/Settings";
import WaterManagement from "./pages/WaterManagement";
import IrrigationSimulatorComponent from "./pages/CentrePivotVisualization";
import SupplyChain from "./pages/SupplyChain";
import Weather from "./pages/Weather";
import LoginPage from "./pages/LoginPage"; // Import Login Page
import SignUpPage from "./pages/SignUpPage"; // Import SignUp Page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Index />} />

          {/* Sign-in and Sign-up routes */}
          <Route
            path="/sign-in"
            element={
              <>
                <SignedOut>
                  <LoginPage />
                </SignedOut>
                <SignedIn>
                  <Navigate to="/dashboard" replace />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/sign-up"
            element={
              <>
                <SignedOut>
                  <SignUpPage />
                </SignedOut>
                <SignedIn>
                  <Navigate to="/dashboard" replace />
                </SignedIn>
              </>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <>
                <SignedIn>
                  <Dashboard />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/maps"
            element={
              <>
                <SignedIn>
                  <Maps />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/soil"
            element={
              <>
                <SignedIn>
                  <SoilAnalytics />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/weather"
            element={
              <>
                <SignedIn>
                  <Weather />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/crop-recommendations"
            element={
              <>
                <SignedIn>
                  <CropRecommendations />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/water-management"
            element={
              <>
                <SignedIn>
                  <WaterManagement />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/water-management/centre-pivot"
            element={
              <>
                <SignedIn>
                  <Layout>
                    <IrrigationSimulatorComponent />
                  </Layout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/supply-chain"
            element={
              <>
                <SignedIn>
                  <SupplyChain />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/settings"
            element={
              <>
                <SignedIn>
                  <Settings />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          {/* Catch-all Not Found route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
