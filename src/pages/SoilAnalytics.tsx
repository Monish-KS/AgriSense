
import { useState } from "react";
import { Layout } from "@/components/layout";
import { DashboardCard } from "@/components/dashboard/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload, FileBarChart, CloudRain, MoveVertical } from "lucide-react";
import fertilizerData from "@/data/fertilizer_predictions.json"; // Import fertilizer data
import { FertilizerPredictionTable } from "@/components/FertilizerPredictionTable";

// Define an interface for the fertilizer data structure
interface FertilizerPrediction {
  Temparature: number;
  Humidity: number;
  Moisture: number;
  "Soil Type": string;
  "Crop Type": string;
  Nitrogen: number;
  Potassium: number;
  Phosphorous: number;
  "Fertilizer Name": string;
}


export default function SoilAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");

  // Use type assertion for the imported data
  const predictions = fertilizerData as FertilizerPrediction[];

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Soil Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Detailed analysis of your soil composition and health.
            </p>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 md:mt-0">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="composition">Composition</TabsTrigger>
            <TabsTrigger value="nutrients">Nutrients</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <DashboardCard
              title="Soil Composition Overview"
              description="Visual representation of your soil's composition"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-agrisense-primary flex items-center justify-center">
                      <FileBarChart className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-medium">Soil Type Analysis</h3>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-md">
                    <p className="font-medium">Loam Soil</p>
                    <p className="text-sm text-muted-foreground">A balanced mixture of sand, silt, and clay</p>
                  </div>
                  <div className="p-4 bg-agrisense-light rounded-md">
                    <p className="font-medium">Soil Texture</p>
                    <ul className="text-sm text-muted-foreground list-disc pl-4 mt-1 space-y-1">
                      <li>Good water retention</li>
                      <li>Well-drained</li>
                      <li>Easy to work with</li>
                      <li>Nutrient-rich</li>
                    </ul>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <div className="aspect-square bg-muted/20 rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">Soil composition chart would be displayed here</p>
                  </div>
                </div>
              </div>
            </DashboardCard>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DashboardCard
                title="Moisture Content"
                icon={<CloudRain className="h-4 w-4" />}
              >
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold">22%</div>
                  <p className="text-sm text-agrisense-success">Optimal</p>
                  <p className="text-xs text-muted-foreground">Ideal range: 18-25%</p>
                </div>
              </DashboardCard>
              
              <DashboardCard
                title="pH Level"
                icon={<FileBarChart className="h-4 w-4" />}
              >
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold">6.8</div>
                  <p className="text-sm text-agrisense-success">Optimal</p>
                  <p className="text-xs text-muted-foreground">Ideal range: 6.0-7.0</p>
                </div>
              </DashboardCard>
              
              <DashboardCard
                title="Soil Depth"
                icon={<MoveVertical className="h-4 w-4" />}
              >
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold">75 cm</div>
                  <p className="text-sm text-agrisense-success">Good</p>
                  <p className="text-xs text-muted-foreground">Topsoil: 25cm, Subsoil: 50cm</p>
                </div>
              </DashboardCard>
            </div>
          </TabsContent>
          
          <TabsContent value="composition" className="space-y-4">
            <DashboardCard
              title="Soil Composition Analysis"
              description="Breakdown of your soil's physical properties"
            >
              <div className="flex flex-col items-center space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">Soil composition chart would be displayed here</p>
                </div>
                
                <div className="grid grid-cols-3 gap-8 w-full max-w-lg">
                  <div className="flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-yellow-200 flex items-center justify-center text-lg font-bold">
                      40%
                    </div>
                    <p className="mt-2 text-sm font-medium">Sand</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-amber-300 flex items-center justify-center text-lg font-bold">
                      30%
                    </div>
                    <p className="mt-2 text-sm font-medium">Silt</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-amber-600 flex items-center justify-center text-lg font-bold">
                      25%
                    </div>
                    <p className="mt-2 text-sm font-medium">Clay</p>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-md w-full">
                  <p className="font-medium">Soil Classification:</p>
                  <p className="text-muted-foreground">Loam soil - Good for a wide variety of crops due to balanced texture</p>
                </div>
              </div>
            </DashboardCard>
          </TabsContent>
          
          <TabsContent value="nutrients" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <DashboardCard
                title="Macronutrients"
                description="Primary and secondary nutrients"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Nitrogen (N)</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">120 ppm</div>
                      <div className="text-xs text-agrisense-success">Adequate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Phosphorus (P)</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">45 ppm</div>
                      <div className="text-xs text-yellow-500">Slightly Low</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Potassium (K)</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">210 ppm</div>
                      <div className="text-xs text-agrisense-success">High</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Calcium (Ca)</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">1500 ppm</div>
                      <div className="text-xs text-agrisense-success">Adequate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Magnesium (Mg)</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">180 ppm</div>
                      <div className="text-xs text-agrisense-success">Adequate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sulfur (S)</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">15 ppm</div>
                      <div className="text-xs text-red-500">Low</div>
                    </div>
                  </div>
                </div>
              </DashboardCard>
              
              <DashboardCard
                title="Micronutrients"
                description="Trace elements essential for plant growth"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Iron (Fe)</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">4.5 ppm</div>
                      <div className="text-xs text-agrisense-success">Adequate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Manganese (Mn)</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">2.0 ppm</div>
                      <div className="text-xs text-yellow-500">Slightly Low</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Zinc (Zn)</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">0.8 ppm</div>
                      <div className="text-xs text-red-500">Low</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Copper (Cu)</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">0.3 ppm</div>
                      <div className="text-xs text-agrisense-success">Adequate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Boron (B)</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">0.5 ppm</div>
                      <div className="text-xs text-agrisense-success">Adequate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Molybdenum (Mo)</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">0.05 ppm</div>
                      <div className="text-xs text-agrisense-success">Adequate</div>
                    </div>
                  </div>
                </div>
              </DashboardCard>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-4">
            <DashboardCard
              title="Soil Improvement Recommendations"
              description="Based on your soil analysis"
            >
              <div className="space-y-6">
                <div className="bg-agrisense-light p-4 rounded-md">
                  <h3 className="font-medium text-agrisense-primary">Fertilizer Recommendations</h3>
                  {/* Display fertilizer recommendations from the imported data */}
                  {predictions.length > 0 ? (
                    <FertilizerPredictionTable predictions={predictions} />
                  ) : (
                    <p className="text-muted-foreground">No fertilizer prediction data available.</p>
                  )}
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-medium text-blue-600">Soil Management Practices</h3>
                  <ul className="mt-2 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Maintain current moisture levels through proper irrigation scheduling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Add organic matter through composting to improve soil structure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Practice crop rotation to maintain soil health and nutrient balance</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-md">
                  <h3 className="font-medium text-purple-600">Suitable Crops</h3>
                  <p className="mt-1 text-sm">Based on your loam soil with current nutrient profile, these crops would perform well:</p>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div className="bg-white p-2 rounded shadow-sm text-center text-sm">Wheat</div>
                    <div className="bg-white p-2 rounded shadow-sm text-center text-sm">Corn</div>
                    <div className="bg-white p-2 rounded shadow-sm text-center text-sm">Potatoes</div>
                    <div className="bg-white p-2 rounded shadow-sm text-center text-sm">Soybeans</div>
                    <div className="bg-white p-2 rounded shadow-sm text-center text-sm">Tomatoes</div>
                    <div className="bg-white p-2 rounded shadow-sm text-center text-sm">Leafy Greens</div>
                  </div>
                </div>
              </div>
            </DashboardCard>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
