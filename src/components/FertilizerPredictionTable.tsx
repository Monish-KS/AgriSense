import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface FertilizerPredictionTableProps {
  predictions: FertilizerPrediction[];
}

export function FertilizerPredictionTable({ predictions }: FertilizerPredictionTableProps) {
  return (
    <Table>
      <TableCaption>A list of fertilizer predictions based on soil and environmental conditions.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Crop Type</TableHead>
          <TableHead>Soil Type</TableHead>
          <TableHead>Temperature (°C)</TableHead>
          <TableHead>Humidity (%)</TableHead>
          <TableHead>Moisture (%)</TableHead>
          <TableHead>Nitrogen</TableHead>
          <TableHead>Potassium</TableHead>
          <TableHead>Phosphorous</TableHead>
          <TableHead>Recommended Fertilizer</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {predictions.map((prediction, index) => (
          <TableRow key={index}>
            <TableCell>{prediction["Crop Type"]}</TableCell>
            <TableCell>{prediction["Soil Type"]}</TableCell>
            <TableCell>{prediction.Temparature}</TableCell>
            <TableCell>{prediction.Humidity}</TableCell>
            <TableCell>{prediction.Moisture}</TableCell>
            <TableCell>{prediction.Nitrogen}</TableCell>
            <TableCell>{prediction.Potassium}</TableCell>
            <TableCell>{prediction.Phosphorous}</TableCell>
            <TableCell className="font-medium">{prediction["Fertilizer Name"]}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}