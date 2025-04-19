import { Layout } from "@/components/layout";


import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Maps from "./pages/Maps";
import SoilAnalytics from "./pages/SoilAnalytics";
import NotFound from "./pages/NotFound";
import CropRecommendations from "./pages/CropRecommendations";
import Settings from "./pages/Settings";
import WaterManagement from "./pages/WaterManagement";
import IrrigationSimulatorComponent from "./pages/CentrePivotVisualization"; // Import the new component
import SupplyChain from "./pages/SupplyChain";
import Weather from "./pages/Weather";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/maps" element={<Maps />} />
          <Route path="/soil" element={<SoilAnalytics />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/crop-recommendations" element={<CropRecommendations />} />
          <Route path="/water-management" element={<WaterManagement />} />
          <Route
            path="/water-management/centre-pivot"
            element={
              <Layout>
                <IrrigationSimulatorComponent />
              </Layout>
            }
          />
          <Route path="/supply-chain" element={<SupplyChain />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
