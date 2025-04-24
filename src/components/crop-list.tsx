
import { Check } from "lucide-react";
import cropData from "@/data/crop_recommendations.json"; // Import the JSON data

// Define an interface for the crop data structure
interface CropRecommendation {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
  label: string;
}

// Use Set to get unique crop labels and convert back to array
const uniqueCrops = Array.from(new Set(cropData.map((item: CropRecommendation) => item.label)))
  .map(label => {
    // Find the first item with this label to represent it (or handle differently if needed)
    return cropData.find((item: CropRecommendation) => item.label === label);
  })
  // Filter out undefined in case cropData was empty or filtering failed
  .filter((item): item is CropRecommendation => item !== undefined)
  .slice(0, 5); // Limit to the top 5 unique crops


export function CropList() {
  return (
    <div className="space-y-4">
      {/* Map over the unique crops from the imported data */}
      {uniqueCrops.map((crop) => (
        <div
          key={crop.label} // Use label as key
          className="flex items-center justify-between p-4 rounded-lg border bg-card"
        >
          <div className="flex items-center gap-3">
            {/* Crop icon */}
            <div className="h-8 w-8 flex items-center justify-center">
               <img
                 src={`/icons/crops/${crop.label.toLowerCase().replace(/\s+/g, '-')}.svg`} // Dynamic path based on crop label
                 alt={`${crop.label} icon`}
                 className="h-6 w-6" // Adjust size as needed
                 onError={(e) => { // Optional: Handle missing icons
                   const target = e.target as HTMLImageElement;
                   target.onerror = null; // Prevent infinite loop
                   target.src = '/placeholder.svg'; // Fallback placeholder image
                 }}
               />
            </div>
            <div>
              {/* Display the capitalized crop label */}
              <h3 className="font-medium capitalize">{crop.label}</h3>
              {/* Removed season and yield display as they are not in the JSON */}
              {/* <p className="text-sm text-muted-foreground">
                {crop.season} • Expected yield: {crop.yield}
              </p> */}
            </div>
          </div>
          {/* Removed suitability display as it's not in the JSON */}
          {/* <div className="text-right">
            <span className="text-lg font-semibold text-primary">
              {crop.suitability}%
            </span>
            <p className="text-sm text-muted-foreground">Suitability</p>
          </div> */}
        </div>
      ))}
    </div>
  );
}
