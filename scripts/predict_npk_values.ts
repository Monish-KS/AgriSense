import { predictNpk, NpkInput } from '../src/lib/npkPredictor';
import cropData from '../src/data/crop_recommendations.json';

async function runPredictions() {
  console.log('Running NPK predictions for crop data...');

  if (!cropData || cropData.length === 0) {
    console.log('No data found in crop_recommendations.json');
    return;
  }

  // Process a subset of data to avoid excessive output
  const dataToProcess = cropData.slice(0, 10); // Process first 10 entries

  for (const entry of dataToProcess) {
    const input: NpkInput = {
      temperature: entry.temperature,
      humidity: entry.humidity,
      ph: entry.ph,
    };

    try {
      const prediction = await predictNpk(input);
      console.log(`---`);
      console.log(`Input: Temp=${input.temperature}, Humidity=${input.humidity}, pH=${input.ph}`);
      console.log(`Predicted NPK: N=${prediction.N.toFixed(2)}, P=${prediction.P.toFixed(2)}, K=${prediction.K.toFixed(2)}`);
      // Optional: Log actual values for comparison if available in the data
      if (entry.N !== undefined && entry.P !== undefined && entry.K !== undefined) {
         console.log(`Actual NPK: N=${entry.N}, P=${entry.P}, K=${entry.K}`);
      }
      console.log(`Crop Label: ${entry.label}`);
    } catch (error) {
      console.error(`Error predicting for entry:`, input, error);
    }
  }

  console.log('Finished running NPK predictions.');
}

runPredictions();