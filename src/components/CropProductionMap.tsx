import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { FillLayerSpecification, ErrorEvent } from 'maplibre-gl'; // Import FillLayerSpecification and ErrorEvent
import MapGL, { Source, Layer, Popup, MapLayerMouseEvent } from 'react-map-gl';
import type { Feature, GeoJSON as GeoJSONType } from 'geojson';

// Make sure maplibre-gl CSS is imported IF you aren't using mapbox-gl css.
// If you use MapGL from 'react-map-gl/maplibre', you usually want maplibre-gl's css
import 'maplibre-gl/dist/maplibre-gl.css';
// OR if you are still using mapbox-gl css for compatibility/other reasons:
// import 'mapbox-gl/dist/mapbox-gl.css'; // Keep this if it's working for your styling needs

interface CropProductionMapProps {
  productionData: CropProduction[];
}

interface CropProduction {
  State_Name: string;
  District_Name: string;
  Crop_Year: number;
  Season: string;
  Crop: string;
  Area: number;
  Production: number;
}

// Define a more specific type for Feature Properties used in this component
interface MapFeatureProperties {
  NAME_1?: string; // Assuming NAME_1 holds the state name in your GeoJSON
  production: number;
  color: string;
}

// Define the specific GeoJSON type we expect after processing
type ProcessedGeoJSON = GeoJSONType & {
  features: Feature<any, MapFeatureProperties>[]; // Use specific properties type
};


// Determine fill color from production value

// Function to deeply clean GeoJSON (Optional but good practice)
// Ensures only expected properties are present.
const sanitizeGeoJSON = (geojson: unknown): ProcessedGeoJSON | null => {
    // Add runtime checks for unknown input
    if (typeof geojson !== 'object' || geojson === null || !('type' in geojson) || geojson.type !== 'FeatureCollection' || !('features' in geojson) || !Array.isArray(geojson.features)) {
        console.error("Invalid input to sanitizeGeoJSON", geojson);
        return null;
    }

    const sanitizedFeatures = geojson.features
        .map((feature: unknown) => {
            // Add runtime checks for each feature
            if (typeof feature !== 'object' || feature === null || !('type' in feature) || feature.type !== 'Feature' || !('geometry' in feature) || !('properties' in feature)) {
                 console.warn("Skipping invalid feature during sanitization:", feature);
                return null; // Skip invalid features
            }
            // Now that we've checked, we can safely cast to a more specific type for processing
            const typedFeature = feature as Feature<any, any>; // Use a temporary type for processing

            // Only keep essential GeoJSON properties and our specific ones
            return {
                type: 'Feature',
                geometry: { ...typedFeature.geometry }, // Shallow copy is usually enough
                properties: {
                    // Explicitly list the properties we *expect* and *need*
                    NAME_1: typedFeature.properties.NAME_1,
                    production: typedFeature.properties.production || 0,
                    color: typedFeature.properties.color || '#ffffcc',
                } as MapFeatureProperties, // Assert the type
            } as Feature<any, MapFeatureProperties>; // Assert the feature type after sanitization
        })
        .filter((feature): feature is Feature<any, MapFeatureProperties> => feature !== null); // Filter out nulls & assert type

    return {
        type: 'FeatureCollection',
        features: sanitizedFeatures,
    };
};


const CropProductionMap: React.FC<CropProductionMapProps> = ({ productionData }) => {
  // Use the more specific type for state
  const [geojsonData, setGeojsonData] = useState<ProcessedGeoJSON | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    longitude: number;
    latitude: number;
    stateName: string;
    production: number;
  } | null>(null);
  const [isClient, setIsClient] = useState(false); // For preventing SSR issues

  // Memoize production aggregation
  const productionByState = useMemo(() => {
    console.log("Recalculating productionByState");
    const map = new Map<string, number>();
    // Ensure productionData is an array before iterating
    if (!Array.isArray(productionData)) {
        console.warn("productionData is not an array:", productionData);
        return map;
    }
    productionData.forEach(item => {
      if (item && typeof item.State_Name === 'string' && typeof item.Production === 'number' && !isNaN(item.Production)) {
         map.set(item.State_Name, (map.get(item.State_Name) || 0) + item.Production);
      } else {
        console.warn("Skipping invalid production data item:", item);
      }
    });
    return map;
  }, [productionData]);

  // Fetch and process GeoJSON
  useEffect(() => {
    setIsClient(true); // Indicate component has mounted on client
    let isMounted = true;

    console.log("Fetching GeoJSON...");
    fetch('/india_states.geojson') // Ensure this path is correct (from public folder)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} for ${response.url}`);
        }
        return response.json();
      })
      .then(data => {
        if (!isMounted) return;

        console.log("GeoJSON fetched, processing...");
        if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
          // Calculate min and max production from the aggregated data
          const productionValues = Array.from(productionByState.values());
          const minProduction = productionValues.length > 0 ? Math.min(...productionValues) : 0;
          const maxProduction = productionValues.length > 0 ? Math.max(...productionValues) : 0;
          const productionRange = maxProduction - minProduction;

          console.log(`Production Range: Min=${minProduction}, Max=${maxProduction}, Range=${productionRange}`);

          // Sanitize the raw features before processing
          // Sanitize the raw features before processing
          const sanitizedFeatures = data.features
            .map((feature: Feature<any, { [key: string]: any }>) => { // Use Feature<any, { [key: string]: any }> for initial mapping
                if (!feature || feature.type !== 'Feature' || !feature.geometry || !feature.properties) {
                     console.warn("Skipping invalid feature during sanitization:", feature);
                    return null; // Skip invalid features
                }
                // Only keep essential GeoJSON properties and the state name
                return {
                    type: 'Feature',
                    geometry: { ...feature.geometry }, // Shallow copy is usually enough
                    properties: {
                        NAME_1: feature.properties.NAME_1, // Keep the state name property
                    },
                } as Feature<any, { NAME_1?: string }>; // Assert the specific properties type after sanitization
            })
            .filter((feature): feature is Feature<any, { NAME_1?: string }> => feature !== null); // Filter out nulls & assert type


          const processedFeatures = sanitizedFeatures.map(feature => {
            const stateName = feature.properties.NAME_1;
            const production = stateName ? productionByState.get(stateName) || 0 : 0;

            // Calculate color based on production relative to min/max
            let color = '#ffffcc'; // Default color for lowest production or no data
            if (productionRange > 0) { // Avoid division by zero
                const percentage = (production - minProduction) / productionRange;

                // Define color stops based on percentage of the range
                if (percentage > 0.8) {
                    color = '#800026'; // Darkest color for highest production
                } else if (percentage > 0.6) {
                    color = '#bd0026';
                } else if (percentage > 0.4) {
                    color = '#e31a1c';
                } else if (percentage > 0.2) {
                    color = '#fc4e2a';
                } else if (percentage > 0) {
                    color = '#fd8d3c';
                }
                // If percentage is 0 or less (i.e., production is minProduction or less), it remains '#ffffcc'
            } else if (maxProduction > 0) {
                // Handle case where all production values are the same but > 0
                color = '#e31a1c'; // Use a middle color if range is zero but production is not zero
            }

            console.log(`Processing feature - State: ${stateName}, Production: ${production}, Percentage: ${productionRange > 0 ? ((production - minProduction) / productionRange).toFixed(2) : 'N/A'}, Color: ${color}`);

            return {
              type: 'Feature',
              geometry: feature.geometry,
              properties: {
                NAME_1: stateName,
                production,
                color // Use the dynamically calculated color
              } as MapFeatureProperties // Assert the specific properties type
            };
          }); // No filter needed here as sanitization already handled invalid features

          const processedGeoJSON: ProcessedGeoJSON = {
            type: 'FeatureCollection',
            features: processedFeatures as Feature<any, MapFeatureProperties>[] // Assert the specific features type
          };

          console.log("Setting GeoJSON data state with", processedGeoJSON.features.length + " features");
          setGeojsonData(processedGeoJSON);

        } else {
          console.error('Invalid GeoJSON format received:', data);
          setGeojsonData(null);
        }
      })
      .catch(error => {
         if (!isMounted) return;
         console.error('Error fetching or parsing geojson:', error);
         setGeojsonData(null);
      });

       return () => {
          isMounted = false;
          console.log("CropProductionMap effect cleanup");
       }
  }, [productionByState]); // Re-run if production data changes

  // Define the layer style - memoized for performance
  const fillLayerStyle = useMemo<Omit<FillLayerSpecification, 'source'>>(() => ({
    id: 'state-fills', // This ID is used for interaction (interactiveLayerIds)
    type: 'fill', // Type is 'fill'
    paint: {
      'fill-color': ['get', 'color'], // Get color from feature properties
      'fill-opacity': 0.7,
      'fill-outline-color': 'white',
    },
  }), []); // No dependencies, created once

  // Hover handler - memoized
  const onHover = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features && event.features[0];
    if (feature?.properties) {
        const stateName = feature.properties.NAME_1;
        const production = feature.properties.production;

        // Check if properties are valid before updating state
        if (typeof stateName === 'string' && typeof production === 'number') {
             setHoverInfo({
                longitude: event.lngLat.lng,
                latitude: event.lngLat.lat,
                stateName: stateName,
                production: production,
             });
             return; // Exit early if hover info is set
        }
    }
    // Clear hover info if no valid feature is hovered or properties are missing/invalid
    // Only update state if it actually needs to change from non-null to null
    if (hoverInfo !== null) {
         setHoverInfo(null);
    }
  }, [hoverInfo]); // Dependency includes hoverInfo to prevent unnecessary null sets

  // Mouse leave handler - memoized
  const onMouseLeave = useCallback(() => {
    // Only update state if it needs changing
    if (hoverInfo !== null) {
        setHoverInfo(null);
    }
  }, [hoverInfo]); // Dependency includes hoverInfo

  // MapLibre error handler
  const onMapError = useCallback((evt: ErrorEvent) => {
    // Log MapLibre specific errors (like the ones you observed)
    console.error("MapLibre Error:", evt.error);
  }, []);

  // Prevent rendering on server or before client-side mount is confirmed
  if (!isClient) {
    // Return a placeholder or null during SSR or initial mount
    return <div>Loading map...</div>;
  }

  // **Prepare props for the Source component explicitly**
  // This object contains ONLY the valid props for a MapLibre GeoJSON source.
  const sourceProps = geojsonData ? {
    id: "india-states",
    type: "geojson" as const, // Ensure type is correctly inferred as literal 'geojson'
    data: geojsonData // The sanitized GeoJSON data
  } : null;

  // Add console log to inspect the props just before rendering
  // console.log("Rendering MapGL. sourceProps:", sourceProps); // Removed console log
  // You should see sourceProps as null initially, then an object with id, type, data.
  // If you see `data-component-*` properties *here*, the issue is earlier in your code (unlikely).
  // If sourceProps looks clean here, the issue is external (tooling, extensions).

  return (
    <MapGL
      initialViewState={{
        longitude: 78.9629, // Centered on India
        latitude: 20.5937,
        zoom: 4,
      }}
      style={{ width: '100%', height: '600px' }} // Increased height slightly
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" // Carto Positron style
      interactiveLayerIds={sourceProps ? [fillLayerStyle.id] : []} // Only set if layer exists
      onMouseMove={onHover}
      onMouseLeave={onMouseLeave}
      onError={onMapError} // Add the error handler to the map instance
    >
  o    {/* Conditionally render Source only when sourceProps are ready */}
      {/* Passing props explicitly instead of spreading {...sourceProps} */}
      {/* This is functionally identical to spreading IF sourceProps only contains these keys */}
      {sourceProps && (
        <Source
          id={sourceProps.id}
          type={sourceProps.type}
          data={sourceProps.data}
          // No other props are passed here, preventing the "unknown property" errors
          // IF the errors originate from props passed directly to <Source>
        >
          {/* Use the memoized layer style */}
          <Layer {...fillLayerStyle} />
        </Source>
      )}

      {/* Render Popup */}
      {hoverInfo && (
        <Popup
          longitude={hoverInfo.longitude}
          latitude={hoverInfo.latitude}
          closeButton={false}
          closeOnClick={false} // Keep open while hovering over the same feature
          anchor="bottom"
          offset={10}
        >
          <div>
            <b>{hoverInfo.stateName}</b><br />
            {/* Format number for better readability */}
            Production: {hoverInfo.production.toLocaleString()}
          </div>
        </Popup>
      )}
    </MapGL>
  );
};

export default CropProductionMap;