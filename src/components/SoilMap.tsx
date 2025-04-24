import React, { useState, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { FeatureCollection } from 'geojson';
// Removed FillLayer import, let TypeScript infer the style type

// Define soil types and their properties based on user input
const soilTypes = {
  'Alluvial Soil': { color: '#90EE90', depth: '>300 cm', ph: '6.5 - 8.4' }, // Light Green
  'Desert Soil': { color: '#FFFFE0', depth: '<300 cm', ph: '7.6 - 8.4' }, // Yellow (Light Yellow)
  'Black Soil': { color: '#A9A9A9', depth: '100 - 300 cm', ph: '6.5 - 8.4' }, // Dark Gray
  'Laterite Soil': { color: '#FFB6C1', depth: '50 - 150 cm', ph: '4.5 - 5.5' }, // Light Pink
  'Red & Black Soil': { color: '#D3D3D3', depth: '25 - 50 cm', ph: '5.2 - 7.5' }, // Light Gray
  'Grey and Brown Soil': { color: '#D2B48C', depth: '25 cm', ph: '7.6 - 8.5' }, // Tan (Brownish-Orange)
  'Sub Montane Soil': { color: '#2E8B57', depth: '<25 cm', ph: '5.0 - 6.5' }, // Sea Green (Dark Green)
  'Mountain Soil': { color: '#E6E6FA', depth: '<25 cm', ph: '5.0 - 6.5' }, // Lavender (Purple)
  'Default': { color: '#CCCCCC', depth: 'N/A', ph: 'N/A' } // Default color for unmapped states
};

type SoilType = keyof typeof soilTypes;

// Simplified mapping of states to soil types (for demonstration)
// TODO: Replace with accurate state-to-soil mapping if available
const stateSoilMapping: { [key: string]: SoilType } = {
  'Andaman & Nicobar Island': 'Laterite Soil',
  'Andhra Pradesh': 'Red & Black Soil',
  'Arunanchal Pradesh': 'Mountain Soil',
  'Assam': 'Alluvial Soil',
  'Bihar': 'Alluvial Soil',
  'Chandigarh': 'Alluvial Soil',
  'Chhattisgarh': 'Red & Black Soil',
  'Dadara & Nagar Havelli': 'Laterite Soil',
  'Daman & Diu': 'Laterite Soil',
  'Goa': 'Laterite Soil',
  'Gujarat': 'Black Soil', // Mix of Black, Desert, Grey/Brown
  'Haryana': 'Alluvial Soil',
  'Himachal Pradesh': 'Mountain Soil',
  'Jammu & Kashmir': 'Mountain Soil',
  'Jharkhand': 'Laterite Soil', // Chota Nagpur
  'Karnataka': 'Black Soil', // Mix of Black, Laterite, Red/Black
  'Kerala': 'Laterite Soil',
  'Lakshadweep': 'Laterite Soil', // Coastal/Island - assumption
  'Madhya Pradesh': 'Black Soil',
  'Maharashtra': 'Black Soil',
  'Manipur': 'Mountain Soil',
  'Meghalaya': 'Laterite Soil',
  'Mizoram': 'Mountain Soil',
  'Nagaland': 'Mountain Soil',
  'NCT of Delhi': 'Alluvial Soil',
  'Odisha': 'Laterite Soil', // Mix of Laterite, Alluvial
  'Puducherry': 'Alluvial Soil', // Coastal
  'Punjab': 'Alluvial Soil',
  'Rajasthan': 'Desert Soil', // Mix of Desert, Grey/Brown
  'Sikkim': 'Mountain Soil',
  'Tamil Nadu': 'Red & Black Soil', // Mix of Red/Black, Laterite, Black
  'Telangana': 'Black Soil',
  'Tripura': 'Laterite Soil',
  'Uttar Pradesh': 'Alluvial Soil',
  'Uttarakhand': 'Mountain Soil', // Mix of Mountain, Sub Montane
  'West Bengal': 'Alluvial Soil', // Mix of Alluvial, Laterite
  // Add Ladakh if present in GeoJSON
  'Ladakh': 'Mountain Soil'
};

// Function to get color based on state name from GeoJSON properties
const getSoilColor = (stateName: string | undefined | null): string => {
  if (!stateName) return soilTypes['Default'].color;
  const soilType = stateSoilMapping[stateName] || 'Default';
  return soilTypes[soilType].color;
};

// Define the layer style for the GeoJSON data
const soilLayerStyle = { // Removed explicit FillLayer type
  id: 'soil-layer',
  type: 'fill',
  paint: {
    'fill-color': [
      'match',
      ['get', 'NAME_1'], // Property in india_states.geojson containing state name
      ...Object.entries(stateSoilMapping).flatMap(([state, soil]) => [state, soilTypes[soil].color]),
      soilTypes['Default'].color // Default color
    ],
    'fill-opacity': 0.7,
    'fill-outline-color': '#333'
  }
};

const Legend = () => (
  <div className="absolute bottom-4 right-4 bg-white bg-opacity-80 p-3 rounded shadow-md max-h-60 overflow-y-auto text-xs">
    <h4 className="font-bold mb-2 text-sm">Soil Type Legend</h4>
    {Object.entries(soilTypes).filter(([key]) => key !== 'Default').map(([name, { color, depth, ph }]) => (
      <div key={name} className="flex items-center mb-1">
        <span className="inline-block w-4 h-4 mr-2 border border-gray-400" style={{ backgroundColor: color }}></span>
        <span>{name} (pH: {ph}, Depth: {depth})</span>
      </div>
    ))}
  </div>
);

export function SoilMap() {
  const [geojsonData, setGeojsonData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/india_states.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Ensure the fetched data is valid GeoJSON FeatureCollection
        if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
          setGeojsonData(data as FeatureCollection);
        } else {
          throw new Error('Invalid GeoJSON data received');
        }
      })
      .catch(e => {
        console.error("Error fetching GeoJSON:", e);
        setError(`Failed to load map data: ${e.message}`);
      });
  }, []);

  const initialViewState = {
    longitude: 78.9629, // Center of India
    latitude: 20.5937,
    zoom: 4
  };

  return (
    <div className="relative h-full w-full min-h-[400px]">
      {error && <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 p-4 z-10">{error}</div>}
      <Map
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ""}
      >
        <NavigationControl position="top-left" />
        {geojsonData && (
          <Source id="india-states-source" type="geojson" data={geojsonData}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Layer {...soilLayerStyle as any} />
          </Source>
        )}
        <Legend />
      </Map>
    </div>
  );
}