import { useState, useEffect } from "react";
// Import the fetchWeatherApi function
import { fetchWeatherApi } from 'openmeteo';
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Cloud, CloudDrizzle, CloudLightning, CloudSun, Thermometer, Wind, Droplets } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import RainfallChart from "@/components/RainfallChart";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import rainfallData from "../data/icrisat_district_data_1.json";

// --- Interfaces ---
// Keep your existing RainfallData interface
interface RainfallData {
    "Dist Code": string;
    "Year": string;
    "State Code": string;
    "State Name": string;
    "Dist Name": string;
    "JANUARY ACTUAL (Millimeters)": number;
    "FEBRUARY ACTUAL (Millimeters)": number;
    "MARCH ACTUAL (Millimeters)": number;
    "APRIL ACTUAL (Millimeters)": number;
    "MAY ACTUAL (Millimeters)": number;
    "JUNE ACTUAL (Millimeters)": number;
    "JULY ACTUAL (Millimeters)": number;
    "AUGUST ACTUAL (Millimeters)": number;
    "SEPTEMBER ACTUAL (Millimeters)": number;
    "OCTOBER ACTUAL (Millimeters)": number;
    "NOVEMBER ACTUAL (Millimeters)": number;
    "DECEMBER ACTUAL (Millimeters)": number;
}

// Keep your existing WeatherApiResponse interface - we will transform the library's output to fit this
interface WeatherApiResponse {
    latitude: number;
    longitude: number;
    generationtime_ms: number; // Library doesn't provide this directly, can be calculated or set to 0
    utc_offset_seconds: number;
    timezone: string;
    timezone_abbreviation: string;
    elevation: number;
    hourly_units: {
        time: string;
        temperature_2m: string;
        weathercode: string;
        windspeed_10m: string;
        relativehumidity_2m: string;
        visibility: string;
    };
    hourly: {
        time: string[]; // ISO strings
        temperature_2m: number[];
        weathercode: number[];
        windspeed_10m: number[];
        relativehumidity_2m: number[];
        visibility: number[];
    };
    daily_units: {
        time: string;
        temperature_2m_max: string;
        temperature_2m_min: string;
        weathercode: string;
        windspeed_10m_max: string;
        windgusts_10m_max: string;
        precipitation_sum: string;
    };
    daily: {
        time: string[]; // YYYY-MM-DD strings
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        weathercode: number[];
        windspeed_10m_max: number[];
        windgusts_10m_max: number[];
        precipitation_sum: number[];
    };
}

// --- Helper Functions ---

// Helper function to range-check weather variables (copied from openmeteo example)
const range = (start: number, stop: number, step: number) =>
    Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

// Helper function to map weather codes to conditions (keep your existing)
const getWeatherCondition = (code: number) => {
    // Based on WMO Weather interpretation codes (WW)
    if (code === 0) return "Clear sky";
    if (code === 1 || code === 2 || code === 3) return "Mainly clear, partly cloudy, and overcast";
    if (code === 45 || code === 48) return "Fog and depositing rime fog";
    if (code === 51 || code === 53 || code === 55) return "Drizzle: Light, moderate, and dense intensity";
    if (code === 56 || code === 57) return "Freezing Drizzle: Light and dense intensity";
    if (code === 61 || code === 63 || code === 65) return "Rain: Light, moderate and heavy intensity";
    if (code === 66 || code === 67) return "Freezing Rain: Light and heavy intensity";
    if (code === 71 || code === 73 || code === 75) return "Snow fall: Slight, moderate, and heavy intensity";
    if (code === 77) return "Snow grains";
    if (code === 80 || code === 81 || code === 82) return "Rain showers: Slight, moderate, and violent";
    if (code === 85 || code === 86) return "Snow showers slight and heavy";
    if (code === 95) return "Thunderstorm: Slight or moderate";
    if (code === 96 || code === 99) return "Thunderstorm with slight and heavy hail";
    return "Unknown";
};

// Helper function to map weather codes to icons (keep your existing)
const getWeatherIcon = (code: number) => {
    if (code === 0) return CloudSun;
    if (code === 1 || code === 2 || code === 3) return Cloud;
    if (code === 45 || code === 48) return Cloud; // Using Cloud for fog
    if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57 || code === 61 || code === 63 || code === 65 || code === 66 || code === 67 || code === 80 || code === 81 || code === 82) return CloudDrizzle; // Using CloudDrizzle for various rain/drizzle types
    if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) return Cloud; // Using Cloud for snow
    if (code === 95 || code === 96 || code === 99) return CloudLightning; // Using CloudLightning for thunderstorms
    return Cloud; // Default icon
};


// --- Component ---
const Weather = () => {
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    const [selectedYear, setSelectedYear] = useState<string>("");
    const [locationInput, setLocationInput] = useState("");
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const [weatherData, setWeatherData] = useState<WeatherApiResponse | null>(null); // State for weather data
    const [loadingWeather, setLoadingWeather] = useState(false); // Loading state for weather
    const [fetchError, setFetchError] = useState<string | null>(null); // State for fetch errors
    const [isDistrictSelectOpen, setIsDistrictSelectOpen] = useState(false); // State for controlling the popover
    const [districtSearchTerm, setDistrictSearchTerm] = useState(""); // State for the search input
    const [isYearSelectOpen, setIsYearSelectOpen] = useState(false); // State for controlling the year popover
    const [yearSearchTerm, setYearSearchTerm] = useState(""); // State for the year search input

    const rainfallDataTyped = rainfallData as RainfallData[];

    const districts: string[] = [...new Set(rainfallDataTyped.map((item: RainfallData) => item["Dist Name"]))];
    const years: string[] = [...new Set(rainfallDataTyped.map((item: RainfallData) => item["Year"]))];

    // Filter years based on search term
    const filteredYears = years.filter(year =>
        String(year).toLowerCase().includes(yearSearchTerm.toLowerCase())
    );

    // Filter districts based on search term
    const filteredDistricts = districts.filter(district =>
        district.toLowerCase().includes(districtSearchTerm.toLowerCase())
    );

    // Filter rainfall data based on selected district and year
    const filteredRainfallData = rainfallDataTyped.find(
        (item: RainfallData) =>
            item["Dist Name"].trim().toLowerCase() === selectedDistrict.trim().toLowerCase() &&
            String(item["Year"]).trim() === selectedYear.trim()
    );

    // Still use geocoding API directly for location search (openmeteo lib doesn't include this)
    const handleSearchLocation = async () => {
        if (!locationInput) return;
        setFetchError(null); // Clear previous errors
        setWeatherData(null); // Clear previous weather data
        setCoordinates(null); // Clear previous coordinates
        try {
            // !! Keep using the geocoding API directly for searching location names !!
            const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationInput)}&count=1`);
            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                setCoordinates({
                    latitude: data.results[0].latitude,
                    longitude: data.results[0].longitude,
                });
                // Trigger weather fetch via useEffect
            } else {
                console.error("Location not found");
                setFetchError("Location not found. Please try a different search term.");
                setCoordinates(null);
                setWeatherData(null);
            }
        } catch (error) {
            console.error("Error fetching location data:", error);
            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                 setFetchError("Network error: Could not reach the geocoding service. Please check your internet connection.");
            } else if (error instanceof Error) {
                setFetchError(`Error finding location: ${error.message}`);
            } else {
                 setFetchError("An unknown error occurred while searching for the location.");
            }
            setCoordinates(null);
            setWeatherData(null);
        }
    };


    // Fetch weather data using the openmeteo library when coordinates change
    useEffect(() => {
        const fetchWeatherData = async () => {
            if (!coordinates) {
                setWeatherData(null);
                return;
            }

            setLoadingWeather(true);
            setFetchError(null); // Clear previous errors
            const startTime = performance.now(); // For generation time calculation

            try {
                // Define parameters for the openmeteo library
                // IMPORTANT: The order of variables here MUST match the index used below (variables(index))
                const params = {
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    hourly: ["temperature_2m", "relativehumidity_2m", "weathercode", "windspeed_10m", "visibility"], // Order: 0, 1, 2, 3, 4
                    daily: ["temperature_2m_max", "temperature_2m_min", "weathercode", "windspeed_10m_max", "windgusts_10m_max", "precipitation_sum"], // Order: 0, 1, 2, 3, 4, 5
                    timezone: "auto" as const, // Use 'as const' for stricter typing if needed
                };
                const url = "https://api.open-meteo.com/v1/forecast";

                // Fetch data using the library
                const responses = await fetchWeatherApi(url, params);
                const response = responses[0]; // Process first (and only) location

                // Get metadata
                const utcOffsetSeconds = response.utcOffsetSeconds();
                const timezone = response.timezone()!;
                const timezoneAbbreviation = response.timezoneAbbreviation()!;
                const latitude = response.latitude();
                const longitude = response.longitude();
                const elevation = response.elevation();

                // Process HOURLY data
                const hourlyData = response.hourly()!;
                const hourlyTime = range(Number(hourlyData.time()), Number(hourlyData.timeEnd()), hourlyData.interval()).map(
                    (t) => new Date((t + utcOffsetSeconds) * 1000).toISOString() // Convert to ISO string
                );
                const hourlyTemp = Array.from(hourlyData.variables(0)!.valuesArray()!); // temperature_2m (index 0)
                const hourlyHumidity = Array.from(hourlyData.variables(1)!.valuesArray()!); // relativehumidity_2m (index 1)
                const hourlyWeatherCode = Array.from(hourlyData.variables(2)!.valuesArray()!); // weathercode (index 2)
                const hourlyWindspeed = Array.from(hourlyData.variables(3)!.valuesArray()!); // windspeed_10m (index 3)
                const hourlyVisibility = Array.from(hourlyData.variables(4)!.valuesArray()!); // visibility (index 4)

                // Process DAILY data
                const dailyData = response.daily()!;
                const dailyTime = range(Number(dailyData.time()), Number(dailyData.timeEnd()), dailyData.interval()).map(
                    (t) => {
                        const date = new Date((t + utcOffsetSeconds) * 1000);
                         // Format as YYYY-MM-DD
                        return date.toLocaleDateString('sv-SE'); // 'sv-SE' gives YYYY-MM-DD format
                    }
                );
                const dailyMaxTemp = Array.from(dailyData.variables(0)!.valuesArray()!); // temperature_2m_max (index 0)
                const dailyMinTemp = Array.from(dailyData.variables(1)!.valuesArray()!); // temperature_2m_min (index 1)
                const dailyWeatherCode = Array.from(dailyData.variables(2)!.valuesArray()!); // weathercode (index 2)
                const dailyWindspeedMax = Array.from(dailyData.variables(3)!.valuesArray()!); // windspeed_10m_max (index 3)
                const dailyWindgustsMax = Array.from(dailyData.variables(4)!.valuesArray()!); // windgusts_10m_max (index 4)
                const dailyPrecipSum = Array.from(dailyData.variables(5)!.valuesArray()!); // precipitation_sum (index 5)

                const endTime = performance.now();
                const generationTime = endTime - startTime;

                // Construct the WeatherApiResponse object matching your interface
                const processedData: WeatherApiResponse = {
                    latitude: latitude,
                    longitude: longitude,
                    generationtime_ms: generationTime, // Calculated generation time
                    utc_offset_seconds: utcOffsetSeconds,
                    timezone: timezone,
                    timezone_abbreviation: timezoneAbbreviation,
                    elevation: elevation,
                    hourly_units: { // Manually define units based on API docs
                        time: "iso8601",
                        temperature_2m: "°C",
                        weathercode: "wmo code",
                        windspeed_10m: "km/h",
                        relativehumidity_2m: "%",
                        visibility: "m"
                    },
                    hourly: {
                        time: hourlyTime,
                        temperature_2m: hourlyTemp,
                        weathercode: hourlyWeatherCode,
                        windspeed_10m: hourlyWindspeed,
                        relativehumidity_2m: hourlyHumidity,
                        visibility: hourlyVisibility
                    },
                    daily_units: { // Manually define units based on API docs
                        time: "iso8601",
                        temperature_2m_max: "°C",
                        temperature_2m_min: "°C",
                        weathercode: "wmo code",
                        windspeed_10m_max: "km/h",
                        windgusts_10m_max: "km/h",
                        precipitation_sum: "mm"
                    },
                    daily: {
                        time: dailyTime,
                        temperature_2m_max: dailyMaxTemp,
                        temperature_2m_min: dailyMinTemp,
                        weathercode: dailyWeatherCode,
                        windspeed_10m_max: dailyWindspeedMax,
                        windgusts_10m_max: dailyWindgustsMax,
                        precipitation_sum: dailyPrecipSum
                    }
                };

                setWeatherData(processedData);

            } catch (error) {
                console.error("Error fetching or processing weather data:", error);
                 if (error instanceof Error && error.message.includes('Failed to fetch')) {
                     setFetchError("Network error: Could not reach the weather service. Please check your internet connection.");
                 } else if (error instanceof Error) {
                    setFetchError(`Error getting weather: ${error.message}`);
                } else {
                     setFetchError("An unknown error occurred while fetching weather data.");
                 }
                setWeatherData(null);
            } finally {
                setLoadingWeather(false);
            }
        };

        fetchWeatherData();
    }, [coordinates]); // Fetch weather data whenever coordinates change

    // --- JSX ---
    return (
        <Layout>
            <> {/* Using Fragment shorthand */}
                <div className="space-y-8 animate-fade-in">
                    <div className="flex items-center justify-between flex-wrap gap-4"> {/* Added flex-wrap and gap */}
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                Weather Forecast
                            </h1>
                             {/* Display last updated time based on when data was successfully fetched */}
                             {weatherData && !loadingWeather && (
                                 <p className="text-muted-foreground mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
                             )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Input
                                placeholder="Enter location (e.g., Chennai)"
                                className="w-64"
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()} // Optional: allow search on Enter
                            />
                            <Button onClick={handleSearchLocation} disabled={loadingWeather || !locationInput}>Search</Button>
                        </div>
                    </div>

                    {/* Display Loading and Error States */}
                    {loadingWeather && <p className="text-center text-blue-600">Loading weather data...</p>}
                    {fetchError && <p className="text-center text-red-600">{fetchError}</p>}

                    {/* Display Weather Cards only if data exists and not loading */}
                    {weatherData && !loadingWeather && weatherData.daily && (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {weatherData.daily.time.map((day: string, index: number) => {
                                if (index >= 4) return null; // Display only the next 4 days

                                const maxTemp = weatherData.daily.temperature_2m_max[index];
                                const minTemp = weatherData.daily.temperature_2m_min[index];
                                const weatherCode = weatherData.daily.weathercode[index];

                                const weatherCondition = getWeatherCondition(weatherCode);
                                const WeatherIcon = getWeatherIcon(weatherCode);

                                const displayDate = index === 0 ? "Today" : new Date(day).toLocaleDateString('en-US', { weekday: 'short' });

                                return (
                                    <HoverCard key={day + index}> {/* Added index to key for safety */}
                                        <HoverCardTrigger asChild>
                                            <Card className="p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer border-blue-100 hover:border-blue-200">
                                                <div className="flex flex-col items-center space-y-3">
                                                    <div className="rounded-full bg-blue-50 p-3">
                                                        <WeatherIcon className="h-8 w-8 text-blue-500" />
                                                    </div>
                                                    <h3 className="font-semibold text-lg">{displayDate}</h3>
                                                    {/* Handle potential NaN values */}
                                                    <p className="text-xl font-bold text-blue-600">
                                                        {isNaN(maxTemp) ? '--' : maxTemp.toFixed(1)}°C / {isNaN(minTemp) ? '--' : minTemp.toFixed(1)}°C
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{weatherCondition}</p>
                                                </div>
                                            </Card>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-80">
                                            <div className="flex justify-between space-x-4">
                                                <div>
                                                    <h4 className="text-sm font-semibold">{displayDate}'s Details</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">Max Wind Speed: {isNaN(weatherData.daily.windspeed_10m_max[index]) ? '--' : weatherData.daily.windspeed_10m_max[index].toFixed(1)} km/h</p>
                                                    <p className="text-sm text-muted-foreground mt-1">Precipitation: {isNaN(weatherData.daily.precipitation_sum[index]) ? '--' : weatherData.daily.precipitation_sum[index].toFixed(1)} mm</p>
                                                     {/* Add more details if needed */}
                                                </div>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                );
                            })}
                        </div>
                    )}

                    {/* Rainfall and Other Info Sections */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Rainfall Data Section */}
                         <Card className="p-6 transition-all duration-300 hover:shadow-lg">
                             <div className="flex items-center gap-4 mb-6">
                                 <div className="rounded-full bg-blue-50 p-2">
                                     <Droplets className="h-6 w-6 text-blue-500" />
                                 </div>
                                 <h2 className="text-xl font-semibold">Historical Rainfall Data</h2>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"> {/* Adjusted grid cols */}
                                 <div>
                                     <Label htmlFor="district">District</Label>
                                     <Popover open={isDistrictSelectOpen} onOpenChange={setIsDistrictSelectOpen}>
                                         <PopoverTrigger asChild>
                                             <Button
                                                 variant="outline"
                                                 role="combobox"
                                                 aria-expanded={isDistrictSelectOpen}
                                                 className="w-full sm:w-[180px] justify-between"
                                             >
                                                 {selectedDistrict
                                                     ? districts.find((district) => district === selectedDistrict)
                                                     : "Select District..."}
                                                 <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                             </Button>
                                         </PopoverTrigger>
                                         <PopoverContent className="w-full sm:w-[180px] p-0">
                                             <Command>
                                                 <CommandInput
                                                     placeholder="Search district..."
                                                     value={districtSearchTerm}
                                                     onValueChange={setDistrictSearchTerm}
                                                 />
                                                 <CommandList>
                                                     <CommandEmpty>No district found.</CommandEmpty>
                                                     <CommandGroup>
                                                         {filteredDistricts.map((district) => (
                                                             <CommandItem
                                                                 key={district}
                                                                 value={district}
                                                                 onSelect={(currentValue) => {
                                                                     setSelectedDistrict(currentValue === selectedDistrict ? "" : currentValue);
                                                                     setIsDistrictSelectOpen(false);
                                                                     setDistrictSearchTerm(""); // Clear search term on select
                                                                 }}
                                                             >
                                                                 <Check
                                                                     className={`mr-2 h-4 w-4 ${selectedDistrict === district ? "opacity-100" : "opacity-0"
                                                                         }`}
                                                                 />
                                                                 {district}
                                                             </CommandItem>
                                                         ))}
                                                     </CommandGroup>
                                                 </CommandList>
                                             </Command>
                                         </PopoverContent>
                                     </Popover>
                                 </div>

                                 <div>
                                     <Label htmlFor="year">Year</Label>
                                     <Popover open={isYearSelectOpen} onOpenChange={setIsYearSelectOpen}>
                                         <PopoverTrigger asChild>
                                             <Button
                                                 variant="outline"
                                                 role="combobox"
                                                 aria-expanded={isYearSelectOpen}
                                                 className="w-full sm:w-[120px] justify-between"
                                             >
                                                 {selectedYear
                                                     ? years.find((year) => year === selectedYear)
                                                     : "Select Year..."}
                                                 <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                             </Button>
                                         </PopoverTrigger>
                                         <PopoverContent className="w-full sm:w-[120px] p-0">
                                             <Command>
                                                 <CommandInput
                                                     placeholder="Search year..."
                                                     value={yearSearchTerm}
                                                     onValueChange={setYearSearchTerm}
                                                 />
                                                 <CommandList>
                                                     <CommandEmpty>No year found.</CommandEmpty>
                                                     <CommandGroup>
                                                         {filteredYears.map((year) => (
                                                             <CommandItem
                                                                 key={year}
                                                                 value={year}
                                                                 onSelect={(currentValue) => {
                                                                     setSelectedYear(currentValue === selectedYear ? "" : currentValue);
                                                                     setIsYearSelectOpen(false);
                                                                     setYearSearchTerm(""); // Clear search term on select
                                                                 }}
                                                             >
                                                                 <Check
                                                                     className={`mr-2 h-4 w-4 ${selectedYear === year ? "opacity-100" : "opacity-0"
                                                                         }`}
                                                                 />
                                                                 {year}
                                                             </CommandItem>
                                                         ))}
                                                     </CommandGroup>
                                                 </CommandList>
                                             </Command>
                                         </PopoverContent>
                                     </Popover>
                                 </div>
                             </div>
                                {/* Only render chart if data is available */}
                             {filteredRainfallData ? (
                                <RainfallChart data={filteredRainfallData} />
                             ) : (
                                <p className="text-muted-foreground text-center mt-4">
                                    {selectedDistrict && selectedYear ? "No data found for selected district and year." : "Please select a district and year."}
                                </p>
                             )}
                         </Card>


                        {/* Container for the next two cards */}
                         <div className="space-y-6">
                            {/* Weekly Temperature Range Card */}
                            {weatherData && !loadingWeather && weatherData.daily && (
                                <Card className="p-6 transition-all duration-300 hover:shadow-lg">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="rounded-full bg-blue-50 p-2">
                                            <Thermometer className="h-6 w-6 text-blue-500" />
                                        </div>
                                        <h2 className="text-xl font-semibold">Weekly Temperature Range</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {(() => {
                                            // Calculate only if data is valid
                                            const validMinTemps = weatherData.daily.temperature_2m_min.filter(t => !isNaN(t));
                                            const validMaxTemps = weatherData.daily.temperature_2m_max.filter(t => !isNaN(t));
                                            const minTemp = validMinTemps.length > 0 ? Math.min(...validMinTemps) : NaN;
                                            const maxTemp = validMaxTemps.length > 0 ? Math.max(...validMaxTemps) : NaN;
                                            const avgMaxTemp = validMaxTemps.length > 0 ? (validMaxTemps.reduce((sum, temp) => sum + temp, 0) / validMaxTemps.length) : NaN;

                                            const tempData = [
                                                { label: "Min Temperature", value: minTemp, color: "from-blue-400" },
                                                { label: "Max Temperature", value: maxTemp, color: "from-red-400" },
                                                { label: "Average Max Temp", value: avgMaxTemp, color: "from-purple-400" }
                                            ];

                                            // Define a reasonable temperature scale for the progress bar (e.g., -10 to 50)
                                            const scaleMin = -10;
                                            const scaleMax = 50;
                                            const scaleRange = scaleMax - scaleMin;

                                            return tempData.map((item) => {
                                                 // Calculate width percentage based on the scale
                                                 const widthPercent = isNaN(item.value) || scaleRange <= 0
                                                    ? 0
                                                    : Math.max(0, Math.min(100, ((item.value - scaleMin) / scaleRange) * 100));

                                                return (
                                                    <div key={item.label} className="space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span>{item.label}</span>
                                                            <span className="font-semibold">{isNaN(item.value) ? '--' : `${item.value.toFixed(1)}°C`}</span>
                                                        </div>
                                                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden"> {/* Added overflow-hidden */}
                                                            <div
                                                                className={`h-2 rounded-full bg-gradient-to-r ${item.color} to-transparent`}
                                                                style={{
                                                                    width: `${widthPercent}%`,
                                                                    transition: 'width 1s ease-in-out' // Animate width change
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </Card>
                            )}

                            {/* Additional Current Info Card */}
                            {weatherData && !loadingWeather && weatherData.hourly && weatherData.hourly.time.length > 0 && (
                                <Card className="p-6 transition-all duration-300 hover:shadow-lg">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="rounded-full bg-blue-50 p-2">
                                            <Wind className="h-6 w-6 text-blue-500" />
                                        </div>
                                        <h2 className="text-xl font-semibold">Current Conditions</h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Adjusted grid cols */}
                                        {/* Display current weather info (index 0 or find closest to now) */}
                                        {(() => {
                                            // Find the index of the current or most recent past hour
                                            const now = new Date();
                                            let currentHourIndex = weatherData.hourly.time.findIndex(timeStr => new Date(timeStr) > now) -1;
                                            if (currentHourIndex < 0) currentHourIndex = weatherData.hourly.time.length -1; // Use last index if all are in the past or only one exists
                                             if (currentHourIndex < 0) currentHourIndex = 0; // Fallback if array empty after processing

                                            const currentTemp = weatherData.hourly.temperature_2m[currentHourIndex];
                                            const currentWind = weatherData.hourly.windspeed_10m[currentHourIndex];
                                            const currentHumidity = weatherData.hourly.relativehumidity_2m[currentHourIndex];
                                            const currentVisibility = weatherData.hourly.visibility[currentHourIndex];
                                            const currentCode = weatherData.hourly.weathercode[currentHourIndex];
                                            const currentCondition = getWeatherCondition(currentCode);
                                            const CurrentIcon = getWeatherIcon(currentCode);

                                            return (
                                                <>
                                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 transition-colors hover:bg-gray-100">
                                                        <Thermometer className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-medium">Temperature</p>
                                                            <p className="text-sm text-muted-foreground">{isNaN(currentTemp) ? '--' : `${currentTemp.toFixed(1)}°C`}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 transition-colors hover:bg-gray-100">
                                                        <Wind className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-medium">Wind Speed</p>
                                                            <p className="text-sm text-muted-foreground">{isNaN(currentWind) ? '--' : `${currentWind.toFixed(1)} km/h`}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 transition-colors hover:bg-gray-100">
                                                        <Droplets className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-medium">Humidity</p>
                                                            <p className="text-sm text-muted-foreground">{isNaN(currentHumidity) ? '--' : `${currentHumidity.toFixed(0)}%`}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 transition-colors hover:bg-gray-100">
                                                        <CurrentIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-medium">Condition</p>
                                                            <p className="text-sm text-muted-foreground">{currentCondition}</p>
                                                        </div>
                                                    </div>
                                                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 transition-colors hover:bg-gray-100">
                                                        <CloudSun className="h-5 w-5 text-blue-500 flex-shrink-0" /> {/* Keep specific icon or use CurrentIcon */}
                                                        <div>
                                                            <p className="text-sm font-medium">Visibility</p>
                                                            <p className="text-sm text-muted-foreground">{isNaN(currentVisibility) ? '--' : `${(currentVisibility / 1000).toFixed(1)} km`}</p> {/* Convert meters to km */}
                                                        </div>
                                                    </div>

                                                </>
                                            );
                                        })()}
                                    </div>
                                </Card>
                             )}
                         </div> {/* End of inner container */}
                    </div> {/* End of main grid */}
                </div> {/* End of space-y-8 */}
            </>
        </Layout>
    );
};

export default Weather;