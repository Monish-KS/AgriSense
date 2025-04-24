import { Card } from "@/components/ui/card"; // Corrected path
import { Progress } from "@/components/ui/progress"; // Corrected path
import { Thermometer, Droplets, Leaf } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"; // Corrected path

interface SensorDataProps {
  temperature: number;
  humidity: number;
  moisture: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

const SensorData = ({
  temperature = 25,
  humidity = 65,
  moisture = 45,
  nitrogen = 70,
  phosphorus = 55,
  potassium = 60
}: Partial<SensorDataProps>) => {
  const getSensorStatus = (value: number) => {
    if (value >= 70) return "text-agrisense-success";
    if (value >= 40) return "text-agrisense-primary";
    return "text-agrisense-danger";
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Card className="p-6 transition-all duration-300 hover:shadow-lg cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-50 p-3">
                <Thermometer className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Temperature</p>
                <h3 className="text-2xl font-bold">{temperature}°C</h3>
                <Progress value={temperature} className="h-2 mt-2" />
              </div>
            </div>
          </Card>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm">Current temperature reading from the sensor</p>
        </HoverCardContent>
      </HoverCard>

      <HoverCard>
        <HoverCardTrigger asChild>
          <Card className="p-6 transition-all duration-300 hover:shadow-lg cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-50 p-3">
                <Droplets className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Humidity</p>
                <h3 className="text-2xl font-bold">{humidity}%</h3>
                <Progress value={humidity} className="h-2 mt-2" />
              </div>
            </div>
          </Card>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm">Current humidity level in the air</p>
        </HoverCardContent>
      </HoverCard>

      <HoverCard>
        <HoverCardTrigger asChild>
          <Card className="p-6 transition-all duration-300 hover:shadow-lg cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-50 p-3">
                <Droplets className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Soil Moisture</p>
                <h3 className="text-2xl font-bold">{moisture}%</h3>
                <Progress value={moisture} className="h-2 mt-2" />
              </div>
            </div>
          </Card>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm">Current soil moisture level</p>
        </HoverCardContent>
      </HoverCard>

      {/* NPK Values */}
      <HoverCard>
        <HoverCardTrigger asChild>
          <Card className="p-6 transition-all duration-300 hover:shadow-lg cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-50 p-3">
                <Leaf className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nitrogen (N)</p>
                <h3 className={`text-2xl font-bold ${getSensorStatus(nitrogen)}`}>{nitrogen}%</h3>
                <Progress value={nitrogen} className="h-2 mt-2" />
              </div>
            </div>
          </Card>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm">Nitrogen level in soil</p>
        </HoverCardContent>
      </HoverCard>

      <HoverCard>
        <HoverCardTrigger asChild>
          <Card className="p-6 transition-all duration-300 hover:shadow-lg cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-50 p-3">
                <Leaf className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Phosphorus (P)</p>
                <h3 className={`text-2xl font-bold ${getSensorStatus(phosphorus)}`}>{phosphorus}%</h3>
                <Progress value={phosphorus} className="h-2 mt-2" />
              </div>
            </div>
          </Card>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm">Phosphorus level in soil</p>
        </HoverCardContent>
      </HoverCard>

      <HoverCard>
        <HoverCardTrigger asChild>
          <Card className="p-6 transition-all duration-300 hover:shadow-lg cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-50 p-3">
                <Leaf className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Potassium (K)</p>
                <h3 className={`text-2xl font-bold ${getSensorStatus(potassium)}`}>{potassium}%</h3>
                <Progress value={potassium} className="h-2 mt-2" />
              </div>
            </div>
          </Card>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm">Potassium level in soil</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};

export default SensorData;