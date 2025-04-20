import { InferenceSession, Tensor, env } from 'onnxruntime-web';
import React, { useState, useEffect, useCallback } from "react";

interface Crop {
  name: string;
  icon: string;
  score: number;
  waterRequirement: number;
  soilSuitability: number;
  climateSuitability: number;
  yieldPotential: number;
  marketDemand: number;
  season: string;
  growingPeriod: string;
  waterRequirementText: string;
  advantages: string[];
  considerations: string[];
}

const recommendedCrops: Crop[] = [
  {
    name: "Rice",
    icon: "🌾",
    score: 94,
    waterRequirement: 85,
    soilSuitability: 95,
    climateSuitability: 90,
    yieldPotential: 88,
    marketDemand: 92,
    season: "Kharif",
    growingPeriod: "90-120 days",
    waterRequirementText: "High (1300-1800 mm)",
    advantages: [
      "Well-suited to your soil type",
      "Optimal weather conditions",
      "Strong market demand in your region",
    ],
    considerations: ["Requires good water management"],
  },
  {
    name: "Cotton",
    icon: "🌿",
    score: 86,
    waterRequirement: 65,
    soilSuitability: 90,
    climateSuitability: 85,
    yieldPotential: 82,
    marketDemand: 88,
    season: "Kharif",
    growingPeriod: "150-180 days",
    waterRequirementText: "Medium (700-1300 mm)",
    advantages: [
      "Drought tolerant once established",
      "Good price in current market",
    ],
    considerations: [
      "Susceptible to bollworm",
      "Requires moderate soil fertility",
    ],
  },
  {
    name: "Maize",
    icon: "🌽",
    score: 78,
    waterRequirement: 60,
    soilSuitability: 80,
    climateSuitability: 75,
    yieldPotential: 80,
    marketDemand: 78,
    season: "Kharif/Rabi",
    growingPeriod: "80-110 days",
    waterRequirementText: "Medium (500-800 mm)",
    advantages: [
      "Can be grown in both seasons",
      "Short growing period",
    ],
    considerations: [
      "Moderate susceptibility to drought",
      "Price fluctuations in local market",
    ],
  },
  {
    name: "Soybean",
    icon: "🫘",
    score: 72,
    waterRequirement: 55,
    soilSuitability: 75,
    climateSuitability: 70,
    yieldPotential: 72,
    marketDemand: 80,
    season: "Kharif",
    growingPeriod: "90-120 days",
    waterRequirementText: "Medium (450-700 mm)",
    advantages: ["Improves soil fertility", "Growing market demand"],
    considerations: [
      "Sensitive to waterlogging",
      "Requires well-drained soil",
    ],
  },
  {
    name: "Groundnut",
    icon: "🥜",
    score: 68,
    waterRequirement: 50,
    soilSuitability: 65,
    climateSuitability: 70,
    yieldPotential: 65,
    marketDemand: 75,
    season: "Kharif/Summer",
    growingPeriod: "100-130 days",
    waterRequirementText: "Medium (500-700 mm)",
    advantages: ["Drought tolerant", "Improves soil fertility"],
    considerations: [
      "Sensitive to leaf spot diseases",
      "Requires well-drained sandy loam",
    ],
  },
];

const intercropSuggestions = [
  {
    primary: "Rice",
    secondary: "Azolla",
    benefits: "Nitrogen fixation, weed suppression, increased rice yield",
  },
  {
    primary: "Cotton",
    secondary: "Groundnut",
    benefits: "Better land utilization, risk diversification, income stability",
  },
  {
    primary: "Maize",
    secondary: "Black gram",
    benefits: "Soil enrichment, efficient resource use, reduced pest pressure",
  },
];
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sprout,
  Droplets,
  Sun,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Using gemini-2.0-flash as requested

// Configure ONNX environment - IMPORTANT: Don't directly import WASM files
// Instead, tell ONNX runtime where to find them at runtime
env.wasm = {
  // Use empty string to look for wasm files at the same level as the page
  wasmPaths: '',
  // Disable threading and SIMD initially for better compatibility
  numThreads: 1,
  simd: false
};

const loadModel = async () => {
  try {
    console.log('Loading ONNX model...');
    
    const options = {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
      enableCpuMemArena: true,
    };
    
    // Load model from public directory
    const session = await InferenceSession.create('/RF_Crop_Rec.onnx', options);
    console.log('ONNX model loaded successfully');
    return session;
  } catch (error) {
    console.error('Failed to load ONNX model:', error);
    return null;
  }
};

const runInference = async (session: InferenceSession | null, inputData: { N: number; P: number; K: number; temperature: number; humidity: number; ph: number; rainfall: number; }) => {
  try {
    if (!session) {
      throw new Error('Session is not initialized');
    }

    console.log('Running inference...');

    // --- Input Preparation ---
    const inputName = 'float_input'; // Correct input name from graph properties
    const inputArray = Float32Array.from([
      inputData.N,
      inputData.P,
      inputData.K,
      inputData.temperature,
      inputData.humidity,
      inputData.ph,
      inputData.rainfall,
    ]);
    console.log('Input data array:', Array.from(inputArray));
    // Shape [1, 7] for batch size 1 and 7 features
    const input = new Tensor('float32', inputArray, [1, 7]);
    const feeds = { [inputName]: input };

    // --- Run Inference ---
    console.log('Running session.run with feeds:', feeds);
    console.log('Expecting output names:', session.outputNames); // Should include 'output_label' and 'output_probability'
    const labelOutputName = 'output_label'; // Correct output name from graph properties
    // Explicitly request only the 'output_label' to potentially avoid issues with other outputs
    const outputToFetch = { [labelOutputName]: null }; // Use the defined labelOutputName
    const results = await session.run(feeds, outputToFetch);

    console.log('Inference results object:', results); // Log the raw results

    // --- Output Processing ---
    const probabilityOutputName = 'output_probability'; // Name of the second output

    // Check if the primary output exists
    if (!results || !(labelOutputName in results)) {
      console.error(`Error: Output key "${labelOutputName}" not found in results.`);
      console.error("Available keys:", results ? Object.keys(results) : 'results object is null/undefined');
      throw new Error(`Output key "${labelOutputName}" not found.`);
    }

    const outputLabelTensor = results[labelOutputName];
    console.log(`Data for "${labelOutputName}":`, outputLabelTensor);

    // Log info about the second output, but avoid operations that might fail
     if (probabilityOutputName in results) {
         const outputProbData = results[probabilityOutputName];
         console.log(`Data for "${probabilityOutputName}" (potentially problematic type):`, outputProbData);
         console.log(`Type of "${probabilityOutputName}" data: ${typeof outputProbData}, Is Tensor: ${outputProbData instanceof Tensor}`);
         // Avoid accessing .data if it's not a standard Tensor or the known complex type
     } else {
         console.warn(`Output key "${probabilityOutputName}" not found in results.`);
     }


    // Process the 'output_label' tensor
    let predictedCropName = 'Unknown (Processing Error)';
    if (outputLabelTensor instanceof Tensor && outputLabelTensor.type === 'string') {
        console.log(`Processing "${labelOutputName}" as string tensor.`);
        console.log(` Tensor dimensions: ${outputLabelTensor.dims.join(' x ')}`);

        // For string tensors, '.data' should contain the string(s)
        const stringData = outputLabelTensor.data as string[]; // Type assertion
        console.log(` Extracted string data:`, stringData);

        if (stringData && stringData.length > 0) {
            predictedCropName = stringData[0]; // Get the first predicted label
            console.log(` Successfully extracted predicted crop name: ${predictedCropName}`);
        } else {
            console.warn(` String tensor data for "${labelOutputName}" is empty or invalid.`);
            predictedCropName = 'Unknown (Empty String Tensor)';
        }
    } else {
      // Fallback or error if the output is not the expected string tensor
      console.error(`Unexpected type or structure for "${labelOutputName}". Expected string Tensor. Got:`, outputLabelTensor);
       // You could potentially try accessing index 0 if it's numeric, but the schema says string
      predictedCropName = `Unknown (Unexpected type: ${outputLabelTensor?.type ?? typeof outputLabelTensor})`;
    }

    console.log('Final prediction result:', predictedCropName);
    return predictedCropName; // Return the extracted name

  } catch (error: unknown) { // Catch unknown type
    console.error('Failed to run inference:', error);
    // Log more details if available, checking the error type first
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Caught error is not an Error instance:', error);
    }
    // The calling function should handle setting state based on the null return
    return null; // Indicate failure
  }
};

export default function CropRecommendation() {
  const [loading, setLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cropResults, setCropResults] = useState<{ [key: string]: { analysis: string | null; guide: string | null } }>({});
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [expandedSection, setExpandedSection] = useState<{ name: string; type: 'crop_analysis' | 'crop_guide' | 'intercrop_guide' } | null>(null);
  const [onnxSession, setOnnxSession] = useState<InferenceSession | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initModel = async () => {
      try {
        console.log('Initializing ONNX model...');
        const session = await loadModel();
        
        if (session && isMounted) {
          console.log('Session created successfully with ID:', session.sessionId);
          setOnnxSession(session);
          setModelLoaded(true);
        }
      } catch (err) {
        console.error('Error initializing model:', err);
      }
    };
    
    initModel();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (onnxSession) {
        console.log('Releasing ONNX session...');
        try {
          onnxSession.release();
        } catch (err) {
          console.error('Error releasing session:', err);
        }
      }
    };
  }, []);

  const getGeminiResponse = async (prompt: string) => {
    setLoading(true);
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return text;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return "Error fetching data from Gemini API.";
    } finally {
      setLoading(false);
    }
  };

  const handleDetailedAnalysis = async (crop: Crop) => {
    setSelectedCrop(crop);
    setExpandedSection({ name: crop.name, type: 'crop_analysis' });
    if (cropResults[crop.name]?.analysis) {
      return;
    }
    const prompt = `Provide a concise detailed analysis (around half a page, formatted using markdown) for growing ${crop.name} based on the following data: Soil Suitability: ${crop.soilSuitability}%, Climate Suitability: ${crop.climateSuitability}%, Water Requirement: ${crop.waterRequirementText}, Yield Potential: ${crop.yieldPotential}%, Market Demand: ${crop.marketDemand}%. Advantages: ${crop.advantages.join(", ")}, Considerations: ${crop.considerations.join(", ")}.`;
    const result = await getGeminiResponse(prompt);
    setCropResults(prevResults => ({
      ...prevResults,
      [crop.name]: { ...prevResults[crop.name], analysis: result }
    }));
  };

  const handleImplementationGuide = async (crop: Crop) => {
    setSelectedCrop(crop);
    setExpandedSection({ name: crop.name, type: 'crop_guide' });
    if (cropResults[crop.name]?.guide) {
      return;
    }
    const prompt = `Provide a concise implementation guide (around half a page, formatted using markdown) for growing ${crop.name} based on the following data: Season: ${crop.season}, Growing Period: ${crop.growingPeriod}, Water Requirement: ${crop.waterRequirementText}, Soil Suitability: ${crop.soilSuitability}%. Include steps for land preparation, sowing, irrigation, fertilization, pest and disease management, and harvesting.`;
    const result = await getGeminiResponse(prompt);
    setCropResults(prevResults => ({
      ...prevResults,
      [crop.name]: { ...prevResults[crop.name], guide: result }
    }));
  };

  const handleIntercropGuide = async (suggestion: typeof intercropSuggestions[0]) => {
    const key = `intercrop_${suggestion.primary}_${suggestion.secondary}`;
    setExpandedSection({ name: key, type: 'intercrop_guide' });
    if (cropResults[key]?.guide) {
      return;
    }
    const prompt = `Provide a concise implementation guide (around half a page, formatted using markdown) for intercropping ${suggestion.primary} and ${suggestion.secondary} based on the following benefits: ${suggestion.benefits}. Include steps for planning, planting, and management.`;
    const result = await getGeminiResponse(prompt);
    setCropResults(prevResults => ({
      ...prevResults,
      [key]: { ...prevResults[key], guide: result }
    }));
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Crop Recommendations</h1>
          <p className="text-muted-foreground">
            AI-powered crop suggestions based on your soil, climate, and market conditions
          </p>
        </div>

       <Card className="mb-8">
         <CardHeader>
           <CardTitle>Crop Recommendation</CardTitle>
           <CardDescription>Get AI-powered crop recommendations.</CardDescription>
         </CardHeader>
         <CardContent>
           {modelLoaded && onnxSession ? (
             <div className="space-y-4">
               <p>Model loaded successfully. Ready for inference.</p>
               <Button
                 onClick={async () => {
                   try {
                     console.log('Running inference with session:', onnxSession);
                     if (onnxSession) {
                       setLoading(true);
                       const sampleData = {
                         N: 90, P: 42, K: 43,
                         temperature: 20.88,
                         humidity: 82.00,
                         ph: 6.50,
                         rainfall: 202.94
                       };
                       const result = await runInference(onnxSession, sampleData);
                       if (result) {
                         setPrediction(result);
                       } else {
                         console.error('Inference failed to return a result');
                       }
                     } else {
                       console.error('Session is not available');
                     }
                   } catch (err) {
                     console.error('Error during inference:', err);
                   } finally {
                     setLoading(false);
                   }
                 }}
                 disabled={!onnxSession || !modelLoaded || loading}
               >
                 {loading ? 'Processing...' : 'Get Recommendation'}
               </Button>
               {prediction !== null && (
                 <div className="mt-4 p-4 bg-muted rounded-lg">
                   <p className="text-lg font-semibold">Predicted Crop: <span className="text-agri-green-dark">{prediction}</span></p>
                 </div>
               )}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center p-8">
               <p className="mb-4">Loading ONNX model... This may take a moment.</p>
               <Progress value={modelLoaded ? 100 : 30} className="w-full max-w-xs h-2" />
             </div>
           )}
         </CardContent>
       </Card>

       <Tabs defaultValue="recommendations">
          <TabsList className="mb-6">
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="intercropping">Intercropping</TabsTrigger>
            <TabsTrigger value="rotation">Crop Rotation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recommendations">
            <div className="space-y-6">
              {recommendedCrops.map((crop, index) => (
                <Card key={index} className={index === 0 ? "border-agri-green-dark" : ""}>
                  <CardHeader className="pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <span className="text-3xl mr-3">{crop.icon}</span>
                        <div>
                          <CardTitle className="text-xl">{crop.name}</CardTitle>
                          <CardDescription>{crop.season} Season • {crop.growingPeriod}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center">
                         <div className="text-right mr-4">
                          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-agri-green-dark text-white">
                            {crop.score}% Match
                          </div>
                        </div>
                        {(cropResults[crop.name]?.analysis || cropResults[crop.name]?.guide) && (
                          <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => setExpandedSection(expandedSection?.name === crop.name ? null : { name: crop.name, type: expandedSection?.type === 'crop_analysis' ? 'crop_guide' : 'crop_analysis' })} // Toggle logic
                           className="h-6 w-6"
                         >
                           <ChevronDown className={`h-4 w-4 ${expandedSection?.name === crop.name ? 'rotate-180' : ''}`} />
                         </Button>
                       )}
                     </div>
                   </div>
                 </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Soil Suitability</p>
                        <Progress value={crop.soilSuitability} className="h-2" />
                        <p className="text-xs text-right mt-1">{crop.soilSuitability}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Climate Match</p>
                        <Progress value={crop.climateSuitability} className="h-2" />
                        <p className="text-xs text-right mt-1">{crop.climateSuitability}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Water Needs</p>
                        <Progress value={crop.waterRequirement} className="h-2 bg-agri-water/20" />
                        <p className="text-xs text-right mt-1">{crop.waterRequirementText}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Yield Potential</p>
                        <Progress value={crop.yieldPotential} className="h-2" />
                        <p className="text-xs text-right mt-1">{crop.yieldPotential}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Market Demand</p>
                        <Progress value={crop.marketDemand} className="h-2" />
                        <p className="text-xs text-right mt-1">{crop.marketDemand}%</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                          Advantages
                        </h4>
                        <ul className="text-sm space-y-1">
                          {crop.advantages.map((advantage, i) => (
                            <li key={i} className="flex items-start">
                              <span className="text-green-500 mr-1.5">•</span>
                              {advantage}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                          Considerations
                        </h4>
                        <ul className="text-sm space-y-1">
                          {crop.considerations.map((consideration, i) => (
                            <li key={i} className="flex items-start">
                              <span className="text-amber-500 mr-1.5">•</span>
                              {consideration}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-3">
                    <Button variant="outline" size="sm" onClick={() => handleDetailedAnalysis(crop)}>Detailed Analysis</Button>
                    <Button size="sm" onClick={() => handleImplementationGuide(crop)}>Implementation Guide</Button>
                  </CardFooter>
                  {(expandedSection?.name === crop.name && cropResults[crop.name]?.analysis && expandedSection?.type === 'crop_analysis') && (
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-2">Detailed Analysis</h3>
                      <ReactMarkdown>{cropResults[crop.name]?.analysis}</ReactMarkdown>
                    </CardContent>
                  )}
                   {(expandedSection?.name === crop.name && cropResults[crop.name]?.guide && expandedSection?.type === 'crop_guide') && (
                    <CardContent className="pt-6">
                       <h3 className="text-lg font-semibold mb-2">Implementation Guide</h3>
                      <ReactMarkdown>{cropResults[crop.name]?.guide}</ReactMarkdown>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="intercropping">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sprout className="h-5 w-5 mr-2 text-agri-green-light" />
                  Intercropping Suggestions
                </CardTitle>
                <CardDescription>
                  Optimize land use and increase crop diversity with these intercropping combinations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {intercropSuggestions.map((suggestion, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                        <div className="flex items-center mb-2 md:mb-0">
                          <div className="bg-agri-cream rounded-full p-3 mr-4">
                            <Sprout className="h-6 w-6 text-agri-green-dark" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium">{suggestion.primary} + {suggestion.secondary}</h3>
                            <Badge variant="outline" className="mt-1">Recommended Combination</Badge>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleIntercropGuide(suggestion)}>Implementation Guide</Button>
                      </div>
                      <div className="mt-3">
                        <h4 className="text-sm font-semibold mb-2">Benefits</h4>
                        <p className="text-sm">{suggestion.benefits}</p>
                      </div>
                      {(expandedSection?.name === `intercrop_${suggestion.primary}_${suggestion.secondary}` && cropResults[`intercrop_${suggestion.primary}_${suggestion.secondary}`]?.guide && expandedSection?.type === 'intercrop_guide') && (
                        <CardContent className="pt-6">
                          <h3 className="text-lg font-semibold mb-2">Implementation Guide</h3>
                          <ReactMarkdown>{cropResults[`intercrop_${suggestion.primary}_${suggestion.secondary}`]?.guide}</ReactMarkdown>
                        </CardContent>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
        </Tabs>

      </div>
    </Layout>
  );
}
