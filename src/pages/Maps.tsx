
import { useState } from "react";
import { Layout } from "@/components/layout";
import { DashboardCard } from "@/components/dashboard/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function Maps() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Interactive Map</h2>
            <p className="text-sm text-muted-foreground">
              Explore your agricultural land and nearby resources.
            </p>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 md:mt-0">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>
            <Button variant="outline">Import Data</Button>
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
            <div className="grid gap-4 md:grid-cols-3">
              <DashboardCard
                title="Overall Soil Health"
                description="Quality score"
              >
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-agrisense-primary">85/100</div>
                  <p className="text-sm text-muted-foreground">Your soil is in good condition overall</p>
                </div>
              </DashboardCard>
              <DashboardCard
                title="pH Level"
                description="Ideal range: 6.0-7.0"
              >
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold">6.8</div>
                  <span className="text-sm text-agrisense-success">Optimal</span>
                  <p className="text-xs text-muted-foreground">Ideal range: 6.0-7.0</p>
                  <p className="text-xs text-muted-foreground">Slightly acidic, ideal for most crops</p>
                </div>
              </DashboardCard>
              <DashboardCard
                title="Organic Matter"
                description="Ideal range: 3-5%"
              >
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold">3.2%</div>
                  <span className="text-sm text-agrisense-success">Decent</span>
                  <p className="text-xs text-muted-foreground">Ideal range: 3-5%</p>
                  <p className="text-xs text-muted-foreground">Decent amount of organic material</p>
                </div>
              </DashboardCard>
            </div>

            <DashboardCard
              title="Interactive Map View"
              description="Click on the map to select a specific area for analysis"
            >
              <div className="aspect-video rounded-md bg-muted/20 flex items-center justify-center">
                <p className="text-muted-foreground">Map will be displayed here</p>
                <p className="text-xs text-muted-foreground">Leaflet map integration required</p>
              </div>
            </DashboardCard>
            
            <DashboardCard
              title="Soil Health Summary"
              description="Key indicators of your soil's condition"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Nitrogen (N)</span>
                    <span className="text-sm text-muted-foreground">Good</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-yellow-400" style={{ width: "75%" }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Phosphorus (P)</span>
                    <span className="text-sm text-muted-foreground">Adequate</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: "60%" }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Potassium (K)</span>
                    <span className="text-sm text-muted-foreground">Excellent</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-purple-500" style={{ width: "85%" }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Water Retention</span>
                    <span className="text-sm text-muted-foreground">Good</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-agrisense-info" style={{ width: "70%" }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Microbial Activity</span>
                    <span className="text-sm text-muted-foreground">Good</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-agrisense-primary" style={{ width: "75%" }}></div>
                  </div>
                </div>
              </div>
            </DashboardCard>
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
            <p>Recommendations based on soil analysis will be displayed here.</p>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
