import { Layout } from "@/components/layout";
import { DashboardCard, StatsCard } from "@/components/dashboard/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Droplets, FileBarChart, Sun, Sprout, Store } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import CropProductionMap from "@/components/CropProductionMap"; // Removed static import
import { Separator } from "@/components/ui/separator";
import cropProductionData from "../data/crop_production_data.json";
import cropDamageData from "../data/crop_damage_data.json";
import chemicalsData from "../data/chemicals_data.json"; // Import chemicalsData
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState, lazy, Suspense } from "react"; // Added lazy and Suspense
import { getFirestore, collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore'; // Import Firestore functions
import { db } from '../firebase'; // Import db from firebase.ts
import { predictNpk } from '../lib/npkPredictor'; // Import predictNpk


const CropProductionMap = lazy(() => import("@/components/CropProductionMap")); // Dynamic import

interface CropProduction {
  State_Name: string;
  District_Name: string;
  Crop_Year: number;
  Season: string;
  Crop: string;
  Area: number;
  Production: number;
}

interface CropDamage {
  s: number;
  Crop_Type: string;
  Soil_Type: string;
  Pesticide_Use_Category: string;
  Number_Doses_Week: number;
  Number_Weeks_Used: number;
  Season: string;
  Crop_Damage: string;
}

interface Chemical {
  Item: string;
  Year: number;
  Unit: string;
  Value: number;
}

export default function Dashboard() {
  const [productionData, setProductionData] = useState<CropProduction[]>([]);
  const [damageData, setDamageData] = useState<CropDamage[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  interface SensorLog {
    humidity: number;
    temperature: number;
    moisture: number; // Use moisture instead of ph
    last_updated: Timestamp;
  }
  const [sensorData, setSensorData] = useState<SensorLog | null>(null); // State for sensor data with defined interface
  const [predictedNpk, setPredictedNpk] = useState<{ N: number | null, P: number | null, K: number | null }>({ N: null, P: null, K: null }); // State for predicted NPK

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Delhi",
    "Puducherry"
  ];

  useEffect(() => {
    // Validate and set production data
    if (Array.isArray(cropProductionData)) {
      const validatedProductionData: CropProduction[] = cropProductionData.map(item => {
        // Basic validation: check if item is an object and Production is a number
        if (item && typeof item === 'object' && typeof item.Production === 'number' && !isNaN(item.Production)) {
          return item as CropProduction;
        } else {
          console.warn('Skipping invalid production data item:', item);
          return null; // Return null for invalid items
        }
      }).filter((item): item is CropProduction => item !== null); // Filter out nulls

      setProductionData(validatedProductionData);
      console.log('useEffect ran, productionData loaded and validated');
    } else {
      console.error('cropProductionData is not an array:', cropProductionData);
      setProductionData([]); // Set empty array if data is invalid
    }

    // Validate and set damage data (optional, but good practice)
    if (Array.isArray(cropDamageData)) {
       const validatedDamageData: CropDamage[] = cropDamageData.map(item => {
         // Basic validation for damage data if needed
         if (item && typeof item === 'object' /* add more checks based on CropDamage interface */) {
           return item as CropDamage;
         } else {
           console.warn('Skipping invalid damage data item:', item);
           return null;
         }
       }).filter((item): item is CropDamage => item !== null);

       setDamageData(validatedDamageData);
       console.log('useEffect ran, damageData loaded and validated');
    } else {
       console.error('cropDamageData is not an array:', cropDamageData);
       setDamageData([]); // Set empty array if data is invalid
    }

  }, []);

  useEffect(() => {
    const logsRef = collection(db, 'farms', 'farm001', 'logs');
    const q = query(logsRef, orderBy('last_updated', 'desc'), limit(1)); // Get the latest log

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latestLog = snapshot.docs[0].data() as SensorLog;
        console.log("Fetched latest sensor log:", latestLog); // Added logging
        setSensorData(latestLog);
      } else {
        console.log("No sensor logs found in Firebase."); // Added logging
        setSensorData(null); // No logs found
        setPredictedNpk({ N: null, P: null, K: null }); // Clear NPK if no sensor data
      }
    }, (error) => {
      console.error("Error fetching sensor data:", error);
      setSensorData(null);
    });

    return () => unsubscribe(); // Clean up listener on unmount
  }, []); // Empty dependency array to run only once on mount

  // Effect to run NPK prediction when sensor data changes
  useEffect(() => {
    if (sensorData && sensorData.temperature !== undefined && sensorData.humidity !== undefined && sensorData.moisture !== undefined) {
      const runPrediction = async () => {
        try {
          const prediction = await predictNpk({
            temperature: sensorData.temperature,
            humidity: sensorData.humidity,
            moisture: sensorData.moisture, // Pass moisture to predictNpk
          });
          setPredictedNpk(prediction);
        } catch (error) {
          console.error("Error during NPK prediction:", error);
          setPredictedNpk({ N: null, P: null, K: null }); // Clear NPK on error
        }
      };
      runPrediction();
    } else {
       console.log("Sensor data incomplete or null, cannot run NPK prediction:", sensorData); // Added logging
       setPredictedNpk({ N: null, P: null, K: null }); // Clear NPK if sensor data is incomplete or null
    }
  }, [sensorData]); // Rerun when sensorData changes

  useEffect(() => {
   // Set initial selected state from local storage
   const savedState = localStorage.getItem('selectedSoilAnalyticsState');
   if (savedState) {
     setSelectedState(savedState);
     console.log("Initial state set from local storage:", savedState);
   } else {
     console.log("No state found in local storage, user needs to select.");
   }
 }, []); // Dependency array is empty as we only read from local storage on mount

  // Basic data for now, can be expanded
  const totalProduction = productionData.reduce((sum:number, crop:CropProduction) => sum + crop.Production, 0);
  const damageCount = damageData.length;

  const productionByCrop: { [key: string]: number } = (productionData as CropProduction[]).reduce((acc: { [key: string]: number }, crop: CropProduction) => {
    acc[crop.Crop] = (acc[crop.Crop] || 0) + crop.Production;
    return acc;
  }, {});

  const uniqueCropCount = Object.keys(productionByCrop).length;
  const averageProductionPerCrop = uniqueCropCount > 0 ? totalProduction / uniqueCropCount : 0;

  const productionChartData = Object.entries(productionByCrop).map(([crop, production]) => ({
    crop,
    production: Number((production as number).toFixed(2)), // Ensure production is a number
  }));

  const damageByType: { [key: string]: number } = (damageData as CropDamage[]).reduce((acc: { [key: string]: number }, damage: CropDamage) => {
    acc[damage.Crop_Type] = (acc[damage.Crop_Type] || 0) + 1;
    return acc;
  }, {});

  const damageChartData = Object.entries(damageByType).map(([cropType, count]) => ({
    cropType,
    count: Number(count),
  }));

  // Calculate chemicalChartData
  const limitedChemicalsData = (chemicalsData as Chemical[]).slice(0, 5); // Assuming similar structure, adjust if needed
  const chemicalChartData = limitedChemicalsData.map(item => ({
    name: item.Year.toString(),
    value: item.Value,
  }));


  console.log('Rendering Dashboard, productionChartData:', productionChartData);
  console.log('Rendering Dashboard, damageChartData:', damageChartData);
  return (
    <Layout>
      <div className="flex flex-col gap-6 fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Farm Overview</h2>
            <p className="text-sm text-muted-foreground">
              Last updated: April 18, 2025, 10:30 AM
            </p>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 md:mt-0">
            <Select onValueChange={(value) => {
                setSelectedState(value);
                localStorage.setItem('selectedSoilAnalyticsState', value); // Save state to local storage
              }}
              value={selectedState || ""} // Control the component with state
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {indianStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>


        {/* First row of cards (4 cards) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Soil Health"
            value="Excellent"
            icon={<div className="plant-bloom"><FileBarChart className="h-4 w-4" /></div>}
            trend="up"
            trendValue="85/100"
            className="slide-in-from-left"
          />
          <StatsCard
            title="Current Crop Status"
            value="Wheat"
            icon={<div className="plant-bloom"><Sprout className="h-4 w-4" /></div>}
            trend="up"
            trendValue="Flowering stage"
            className="fade-in-right"
          />
          <StatsCard
            title="Water Status"
            value="Optimal"
            icon={<div className="plant-bloom"><Droplets className="h-4 w-4" /></div>}
            trend="neutral"
            trendValue="Next irrigation in 3 days"
            className="fade-in-up"
          />
        </div>

        {/* Second row of cards (live sensor data) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Live Temperature"
            value={sensorData ? `${sensorData.temperature}°C` : 'N/A'}
            icon={<Sun className="h-4 w-4" />}
            trend="neutral"
            trendValue={sensorData ? `Updated: ${sensorData.last_updated?.toDate().toLocaleString()}` : 'No data'}
            className="fade-in-up"
          />
          <StatsCard
            title="Live Humidity"
            value={sensorData ? `${sensorData.humidity}%` : 'N/A'}
            icon={<Droplets className="h-4 w-4" />}
            trend="neutral"
            trendValue={sensorData ? `Updated: ${sensorData.last_updated?.toDate().toLocaleString()}` : 'No data'}
            className="fade-in-up"
          />
          <StatsCard
            title="Live Soil Moisture"
            value={sensorData ? `${sensorData.moisture}%` : 'N/A'}
            icon={<FileBarChart className="h-4 w-4" />}
            trend="neutral"
            trendValue={sensorData ? `Updated: ${sensorData.last_updated?.toDate().toLocaleString()}` : 'No data'}
            className="fade-in-up"
          />
        </div>

        {/* Third row of cards (NPK placeholders) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Nitrogen (N)"
            value={predictedNpk.N !== null ? predictedNpk.N.toFixed(2) : 'N/A'}
            icon={<Sprout className="h-4 w-4" />} // Using Sprout icon for NPK
            trend="neutral" // You might want to add logic to determine trend based on predicted value
            trendValue={predictedNpk.N !== null ? `${predictedNpk.N.toFixed(2)} ppm` : 'No data'} // Example trendValue
            className="fade-in-up"
          />
          <StatsCard
            title="Phosphorus (P)"
            value={predictedNpk.P !== null ? predictedNpk.P.toFixed(2) : 'N/A'}
            icon={<Sprout className="h-4 w-4" />} // Using Sprout icon for NPK
            trend="neutral" // You might want to add logic to determine trend based on predicted value
            trendValue={predictedNpk.P !== null ? `${predictedNpk.P.toFixed(2)} ppm` : 'No data'} // Example trendValue
            className="fade-in-up"
          />
          <StatsCard
            title="Potassium (K)"
            value={predictedNpk.K !== null ? predictedNpk.K.toFixed(2) : 'N/A'}
            icon={<Sprout className="h-4 w-4" />} // Using Sprout icon for NPK
            trend="neutral" // You might want to add logic to determine trend based on predicted value
            trendValue={predictedNpk.K !== null ? `${predictedNpk.K.toFixed(2)} ppm` : 'No data'} // Example trendValue
            className="fade-in-up"
          />
        </div>


        <Tabs defaultValue="summary" className="mt-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="soil">Soil</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <DashboardCard
                title="Total Crop Production Overview"
                description="Key statistics on overall crop yield"
              >
                <div className="flex flex-col space-y-4 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium">Total Production</span>
                    <span className="text-2xl font-bold text-agrisense-primary">{totalProduction.toLocaleString() + ' tons'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium">Number of Crops</span>
                    <span className="text-base font-bold text-muted-foreground">{uniqueCropCount}</span>
                  </div>
                   <div className="flex items-center justify-between">
                    <span className="text-base font-medium">Average Production per Crop</span>
                    <span className="text-base font-bold text-muted-foreground">{averageProductionPerCrop.toLocaleString() + ' tons'}</span>
                  </div>
                </div>
              </DashboardCard>
              <DashboardCard
                title="Crop Production by Crop"
                description="Production by crop type"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productionChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="crop" />
                    <YAxis tickFormatter={(value) => {
                      if (value >= 1000000000) {
                        return (value / 1000000000).toFixed(1) + 'B';
                      }
                      if (value >= 1000000) {
                        return (value / 1000000).toFixed(1) + 'M';
                      }
                      return value;
                    }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="production" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </DashboardCard>
              <DashboardCard
                title="Crop Damage Incidents by Type"
                description="Number of incidents reported per crop type"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={damageChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cropType" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#d88482" />
                  </BarChart>
                </ResponsiveContainer>
              </DashboardCard>
              <StatsCard
                title="Weather Summary"
                value="27°C"
                icon={<Sun className="h-4 w-4" />}
                trend="neutral"
                trendValue="Clear day"
              />
               <DashboardCard
                title="Chemical Fertilizer Production (1997-2017)"
                description="Production over time"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chemicalChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </DashboardCard>
            </div>

            <DashboardCard
              title="Crop Production Map"
              description="State-wise crop production overview"
            >
              <Suspense fallback={<div>Loading Map...</div>}>
                <CropProductionMap productionData={productionData} />
              </Suspense>
            </DashboardCard>

            <DashboardCard
              title="Recent Field Activities"
              description="Latest actions"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full p-2 bg-agrisense-light text-agrisense-primary">
                    <Droplets className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Irrigation Completed</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Field sector A, 5L/sq.m</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-4">
                  <div className="rounded-full p-2 bg-agrisense-light text-agrisense-primary">
                    <FileBarChart className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Soil Analysis</p>
                      <p className="text-xs text-muted-foreground">8 hours ago</p>
                    </div>
                    <p className="text-sm text-muted-foreground">pH and nutrient levels checked</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-4">
                  <div className="rounded-full p-2 bg-agrisense-light text-agrisense-primary">
                    <Sun className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Weather Alert</p>
                      <p className="text-xs text-muted-foreground">24 hours ago</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Light rain expected tomorrow</p>
                  </div>
                </div>
              </div>
            </DashboardCard>
          </TabsContent>

          <TabsContent value="soil" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <DashboardCard
                title="Overall Soil Health"
                description="Quality score"
              >
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-agrisense-primary">85/100</div>
                  <p className="text-sm text-muted-foreground">Your soil is in good condition overall</p>
                </div>
              </DashboardCard>
              <DashboardCard
                title="pH Level"
                description="Ideal range: 6.0-7.0"
              >
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold">6.8</div>
                  <p className="text-sm text-agrisense-success">Optimal</p>
                <p className="text-xs text-muted-foreground">Slightly acidic, ideal for most crops</p>
                </div>
              </DashboardCard>
              <DashboardCard
                title="Organic Matter"
                description="Ideal range: 3-5%"
              >
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold">3.2%</div>
                  <p className="text-sm text-agrisense-success">Decent</p>
                  <p className="text-xs text-muted-foreground">Good amount of organic material</p>
                </div>
              </DashboardCard>
            </div>

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
                    <div className="h-2 rounded-full bg-agrisense-primary" style={{ width: "75%" }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Phosphorus (P)</span>
                    <span className="text-sm text-muted-foreground">Adequate</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-agrisense-warning" style={{ width: "60%" }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Potassium (K)</span>
                    <span className="text-sm text-muted-foreground">Excellent</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-agrisense-success" style={{ width: "85%" }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Water Retention</span>
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
          
          <TabsContent value="weather" className="space-y-4">
            <p>Weather information will be displayed here.</p>
          </TabsContent>
          
          <TabsContent value="crops" className="space-y-4">
            <p>Crop recommendations will be displayed here.</p>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
