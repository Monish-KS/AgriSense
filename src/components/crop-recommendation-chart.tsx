
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
// Define an interface for the crop data structure
export interface CropRecommendation { // Export the interface
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
  label: string;
}

interface CropRecommendationChartProps {
  cropData: CropRecommendation | null; // Accept crop data as a prop
}

export function CropRecommendationChart({ cropData }: CropRecommendationChartProps) { // Accept cropData prop
  // Prepare data for the radar chart using the provided crop data
  const chartData = cropData ? [
    { factor: 'N', value: cropData.N },
    { factor: 'P', value: cropData.P },
    { factor: 'K', value: cropData.K },
    { factor: 'Temperature', value: cropData.temperature },
    { factor: 'Humidity', value: cropData.humidity },
    { factor: 'pH', value: cropData.ph },
    { factor: 'Rainfall', value: cropData.rainfall },
  ] : []; // Use empty array if no data

  // Handle the case where there is no data to display
  if (!cropData) {
    return <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">Select a crop to see suitability analysis.</div>;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {/* Use the transformed chartData */}
        <RadarChart data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="factor" />
          <Radar
            name={cropData.label} // Use the crop label for the Radar name
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
