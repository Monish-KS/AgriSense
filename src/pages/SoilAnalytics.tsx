import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { DashboardCard } from "@/components/dashboard/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload, FileBarChart, CloudRain, MoveVertical } from "lucide-react";
import fertilizerData from "@/data/fertilizer_predictions.json"; // Import fertilizer data
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FertilizerPredictionTable } from "@/components/FertilizerPredictionTable";
import { InferenceSession, Tensor } from "onnxruntime-web";
import { SoilMap } from "@/components/SoilMap"; // Import the SoilMap component

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
  const [onnxPrediction, setOnnxPrediction] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [micronutrientData, setMicronutrientData] = useState<any[]>([]);
  const [filteredMicronutrientData, setFilteredMicronutrientData] = useState<any[]>([]);

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
 
  // State for ONNX model inputs
  const [temperature, setTemperature] = useState(25);
  const [humidity, setHumidity] = useState(60);
  const [moisture, setMoisture] = useState(30);
  const [nitrogen, setNitrogen] = useState(100);
  const [potassium, setPotassium] = useState(200);
  const [phosphorous, setPhosphorous] = useState(150);


  // Use type assertion for the imported data and limit to top 5
  const top5Predictions = (fertilizerData as FertilizerPrediction[]).slice(0, 5);

  const runOnnxPrediction = async (
    temp: number,
    hum: number,
    mois: number,
    n: number,
    k: number,
    p: number
  ) => {
    try {
      setOnnxPrediction("Loading model and predicting..."); // Set loading state
      // Load the ONNX model from the public folder
      const session = await InferenceSession.create(
        "/Fertilizer_rec.onnx",
        { executionProviders: ['wasm'] } // Specify WASM execution provider
      );

      // Create input data from parameters
      const inputData = new Float32Array([
        temp,
        hum,
        mois,
        n,
        k,
        p
      ]);
      // Adjust shape to [1, 6] as the model expects 6 features
      const tensorInput = new Tensor("float32", inputData, [1, 6]);

      const feeds: Record<string, Tensor> = {};
      // Assuming the model's input name is the first one
      feeds[session.inputNames[0]] = tensorInput;

      // Run inference
      const results = await session.run(feeds);

      // Process the results
      // Assuming the model has a 'label' output which is the fertilizer name directly
      const outputTensor = results.label;
      // The output is expected to be a string tensor containing the fertilizer name.
      const predictedFertilizer = outputTensor.data[0] as string;

      setOnnxPrediction(`Predicted Fertilizer (ONNX): ${predictedFertilizer}`);

    } catch (e) {
      console.error("Error running ONNX model:", e);
      setOnnxPrediction("Error predicting fertilizer with ONNX model.");
    }
  };

  useEffect(() => {
    // Run prediction only when the recommendations tab is active and inputs are available (using default for now)
    if (activeTab === "recommendations") {
      // Use default state values for initial prediction
      runOnnxPrediction(temperature, humidity, moisture, nitrogen, potassium, phosphorous);
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchMicronutrientData = async () => {
      try {
        console.log("Fetching micronutrient data...");
        const response = await fetch('/csv/micronutients.csv');
        const text = await response.text();
        console.log("CSV raw text (first 500 chars):", text.substring(0, 500) + "..."); // Log first 500 chars
        const lines = text.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#')); // Split and remove empty lines and comments
        console.log("CSV lines (excluding comments/empty):", lines);

        if (lines.length < 1) {
          console.error("CSV does not contain any data lines.");
          setMicronutrientData([]);
          return;
        }

        // The first line after filtering is the header
        const rawHeaders = lines[0].split(',');
        console.log("Raw headers:", rawHeaders);
        const headers = rawHeaders.map(header => header.replace(/['"\ufeff]/g, '').trim());
        console.log("Parsed and cleaned headers:", headers);

        // Data starts from the second line
        // Process only the first 33 data lines (corresponding to lines 2-34 in the original CSV)
        const dataLines = lines.slice(1, 35);

        const data = dataLines.map(line => {
          const values = line.split(',');
          console.log("Processing line:", line);
          console.log("Split values:", values);
          console.log("Values length:", values.length, "Headers length:", headers.length);

          let row: any = {};
          // Ensure the number of values matches the number of headers
          if (values.length === headers.length) {
            headers.forEach((header, index) => {
              const cleanedHeader = header.replace(/['"\ufeff]/g, '').trim();
              const cleanedValue = values[index].replace(/['"\ufeff]/g, '').trim();
              row[cleanedHeader] = cleanedValue; // Clean and assign value to header
              console.log(`Mapping header "${cleanedHeader}" to value "${cleanedValue}"`);
            });
          } else {
            console.warn(`Skipping line due to mismatch in column count: ${line}`);
            // Optionally, handle lines with incorrect column counts, e.g., skip them
            return null; // Return null for invalid rows
          }
          console.log("Parsed row object:", row);
          return row;
        }).filter(row => row !== null); // Filter out null values (invalid rows)

        console.log("Micronutrient data fetched and parsed:", data);
        setMicronutrientData(data);
      } catch (error) {
        console.error("Error fetching micronutrient data:", error);
      }
    };

    fetchMicronutrientData();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    console.log("Selected state changed:", selectedState);
    console.log("Micronutrient data available:", micronutrientData.length > 0);
    if (selectedState && micronutrientData.length > 0) {
      const filteredData = micronutrientData.filter(
        (item) => {
          const itemState = item["State"]?.trim().toLowerCase();
          const selected = selectedState.trim().toLowerCase();
          if (itemState === undefined) {
            console.log("Item with undefined state:", item);
          }
          console.log(`Comparing item state "${itemState}" with selected state "${selected}"`);
          return itemState === selected;
        }
      );
      console.log("Filtered micronutrient data:", filteredData);
      setFilteredMicronutrientData(filteredData);
    } else {
      console.log("No state selected or micronutrient data not loaded.");
      setFilteredMicronutrientData([]);
    }
  }, [selectedState, micronutrientData]);

const nutrientCategories = [
    { name: "Nitrogen", keys: ["Nitrogen - High", "Nitrogen - Medium", "Nitrogen - Low"] },
    { name: "Phosphorous", keys: ["Phosphorous - High", "Phosphorous - Medium", "Phosphorous - Low"] },
    { name: "Potassium", keys: ["Potassium - High", "Potassium - Medium", "Potassium - Low"] },
    { name: "Organic Carbon (OC)", keys: ["OC - High", "OC - Medium", "OC - Low"] },
    { name: "Electrical Conductivity (EC)", keys: ["EC - Saline", "EC - Non Saline"] },
    { name: "pH", keys: ["pH - Acidic", "pH - Neutral", "pH - Alkaline"] },
  ];

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
            <Select onValueChange={setSelectedState}>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="composition">Composition</TabsTrigger>
            <TabsTrigger value="nutrients">Nutrients</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
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
                  {/* Replace placeholder with the SoilMap component */}
                  <SoilMap />
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
          
          {/* Composition Tab */}
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
          
          {/* Nutrients Tab */}
          <TabsContent value="nutrients" className="space-y-4">
            <Select onValueChange={setSelectedState} value={selectedState || ""}>
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
            <DashboardCard
              title="Micronutrients"
              description="Trace elements essential for plant growth"
            >
              <div className="space-y-4">
                {filteredMicronutrientData.length > 0 ? (
                  filteredMicronutrientData.map((data, index) => (
                    <div key={index} className="space-y-6">
                      {nutrientCategories.map((category) => (
                        <div key={category.name} className="space-y-2">
                          <h4 className="text-md font-semibold">{category.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {category.keys.map((key) => {
                              const value = data[key];
                              if (value !== undefined) {
                                return (
                                  <div key={key} className="flex flex-col items-center p-3 bg-muted/20 rounded-md">
                                    <span className="text-sm font-medium text-center">{key.replace(`${category.name} - `, '')}</span>
                                    <div className="text-lg font-bold mt-1">{value}</div>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Select a state to view micronutrient data.</p>
                )}
              </div>
            </DashboardCard>
          </TabsContent>
          
          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <DashboardCard
              title="Soil Improvement Recommendations"
              description="Based on your soil analysis"
            >
              <div className="space-y-6">
                {/* Top 5 from Dataset */}
                <div className="bg-agrisense-light p-4 rounded-md">
                  <h3 className="font-medium text-agrisense-primary">Top 5 Fertilizer Recommendations (from dataset)</h3>
                  {top5Predictions.length > 0 ? (
                    <FertilizerPredictionTable predictions={top5Predictions} />
                  ) : (
                    <p className="text-muted-foreground">No fertilizer prediction data available.</p>
                  )}
                </div>
 
                {/* ONNX Prediction Input and Output */}
                <div className="bg-green-50 p-4 rounded-md space-y-4">
                  <h3 className="font-medium text-green-600">Fertilizer Prediction (using ONNX model)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">Temperature (°C)</label>
                      <input
                        type="number"
                        id="temperature"
                        value={temperature}
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="humidity" className="block text-sm font-medium text-gray-700">Humidity (%)</label>
                      <input
                        type="number"
                        id="humidity"
                        value={humidity}
                        onChange={(e) => setHumidity(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="moisture" className="block text-sm font-medium text-gray-700">Moisture (%)</label>
                      <input
                        type="number"
                        id="moisture"
                        value={moisture}
                        onChange={(e) => setMoisture(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="nitrogen" className="block text-sm font-medium text-gray-700">Nitrogen (ppm)</label>
                      <input
                        type="number"
                        id="nitrogen"
                        value={nitrogen}
                        onChange={(e) => setNitrogen(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="potassium" className="block text-sm font-medium text-gray-700">Potassium (ppm)</label>
                      <input
                        type="number"
                        id="potassium"
                        value={potassium}
                        onChange={(e) => setPotassium(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="phosphorous" className="block text-sm font-medium text-gray-700">Phosphorous (ppm)</label>
                      <input
                        type="number"
                        id="phosphorous"
                        value={phosphorous}
                        onChange={(e) => setPhosphorous(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <Button onClick={() => runOnnxPrediction(temperature, humidity, moisture, nitrogen, potassium, phosphorous)}>
                    Get Fertilizer Recommendation
                  </Button>
                  {onnxPrediction && (
                    <p className="mt-2 text-sm font-medium">{onnxPrediction}</p>
                  )}
                </div>
                
                {/* Soil Management Practices */}
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
                
                {/* Suitable Crops */}
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