import * as ort from 'onnxruntime-web';

// Define the expected input structure for clarity
interface NpkInput {
  temperature: number;
  humidity: number;
  moisture: number; // Changed from ph to moisture
}

// Define the expected output structure
interface NpkOutput {
  N: number;
  P: number;
  K: number;
}

// Function to load a model
async function loadModel(modelPath: string): Promise<ort.InferenceSession> {
  try {
    // Configure session options if needed, e.g., for execution providers
    const options: ort.InferenceSession.SessionOptions = { executionProviders: ['wasm'] };
    const session = await ort.InferenceSession.create(modelPath, options);
    console.log(`Model loaded successfully from ${modelPath}`);
    return session;
  } catch (error) {
    console.error(`Failed to load model from ${modelPath}:`, error);
    throw error;
  }
}

// Load models - potential optimization: load them once and reuse
let nitrogenSession: ort.InferenceSession | null = null;
let phosphorusSession: ort.InferenceSession | null = null;
let potassiumSession: ort.InferenceSession | null = null;

async function initializeModels() {
  try {
    // Use paths relative to the public directory where models are served
    nitrogenSession = await loadModel('/nitrogen_model.onnx');
    phosphorusSession = await loadModel('/phosphorus_model.onnx');
    potassiumSession = await loadModel('/potassium_model.onnx');
    console.log('All NPK models initialized.');
  } catch (error) {
    console.error('Error initializing NPK models:', error);
    // Handle initialization error, maybe set a flag or retry
  }
}

// Ensure models are loaded before prediction is attempted
const modelsReady = initializeModels();

// Function to run prediction
async function predictNpk(input: NpkInput): Promise<NpkOutput> {
  await modelsReady; // Wait for models to be loaded

  if (!nitrogenSession || !phosphorusSession || !potassiumSession) {
    throw new Error('NPK models are not initialized properly.');
  }

  try {
    // Prepare the input tensor
    // IMPORTANT: The input shape and data type must match the model's expectation.
    // Assuming the model expects a Float32 tensor with shape [1, 4]
    // The order of features (temp, humidity, ph, rainfall) must also match.
    const inputData = Float32Array.from([
      input.temperature,
      input.humidity,
      input.moisture, // Changed from ph to moisture
    ]);
    const dims = [1, 3]; // Shape: 1 sample, 3 features
    const inputTensor = new ort.Tensor('float32', inputData, dims);

    // Prepare feeds object - the input node name must match the model's input name
    // Replace 'float_input' with the actual input node name of your models
    // You might need to inspect the models to find the correct names.
    const feeds = { float_input: inputTensor }; // ASSUMPTION: Input node name is 'float_input'

    // Run inference for each model
    const nitrogenResult = await nitrogenSession.run(feeds);
    const phosphorusResult = await phosphorusSession.run(feeds);
    const potassiumResult = await potassiumSession.run(feeds);

    // Extract the output data
    // Replace 'variable' with the actual output node name of your models
    // The structure of the result object depends on the model output.
    // Assuming each model outputs a single float value.
    const predictedN = (nitrogenResult.variable.data as Float32Array)[0]; // ASSUMPTION: Output node name is 'variable'
    const predictedP = (phosphorusResult.variable.data as Float32Array)[0]; // ASSUMPTION: Output node name is 'variable'
    const predictedK = (potassiumResult.variable.data as Float32Array)[0]; // ASSUMPTION: Output node name is 'variable'

    return {
      N: predictedN,
      P: predictedP,
      K: predictedK,
    };
  } catch (error) {
    console.error('Error during NPK prediction:', error);
    throw error;
  }
}

export { predictNpk };
export type { NpkInput, NpkOutput };

// Example Usage (can be removed or adapted for component use)
/*
import { predictNpk } from './npkPredictor';
import cropData from '../data/crop_recommendations.json';

async function runPredictions() {
  console.log('Running NPK predictions...');
  try {
    // Example: Predict for the first entry in the JSON data
    if (cropData.length > 0) {
      const firstEntry = cropData[0];
      const input: NpkInput = {
        temperature: firstEntry.temperature,
        humidity: firstEntry.humidity,
        moisture: firstEntry.moisture, // Changed from ph to moisture
      };
      const prediction = await predictNpk(input);
      console.log(`Input:`, input);
      console.log(`Predicted NPK:`, prediction);
      console.log(`Actual NPK: N=${firstEntry.N}, P=${firstEntry.P}, K=${firstEntry.K}`);

      // You could loop through all entries if needed
      // for (const entry of cropData.slice(0, 5)) { // Predict for first 5
      //   const loopInput: NpkInput = { /* ... * / };
      //   const loopPrediction = await predictNpk(loopInput);
      //   console.log(`Predicted for ${entry.label}:`, loopPrediction);
      // }

    } else {
      console.log('No data found in crop_recommendations.json');
    }
  } catch (error) {
    console.error('Failed to run NPK predictions:', error);
  }
}

// runPredictions(); // Call this function where appropriate in your app
*/