import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { FillLayerSpecification, ErrorEvent } from 'maplibre-gl';
import { Map as MapGL, Source, Layer, Popup, MapLayerMouseEvent } from 'react-map-gl';
import type { Feature, GeoJSON as GeoJSONType, Geometry } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';

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

interface MapFeatureProperties {
  NAME_1?: string;
  production: number;
  color: string;
}

interface RawFeatureProperties {
  NAME_1?: string;
  [key: string]: unknown;
}

type ProcessedGeoJSON = GeoJSONType & {
  features: Feature<Geometry, MapFeatureProperties>[];
};

const sanitizeGeoJSON = (geojson: unknown): ProcessedGeoJSON | null => {
  if (
    typeof geojson !== 'object' ||
    geojson === null ||
    !('type' in geojson) ||
    geojson.type !== 'FeatureCollection' ||
    !('features' in geojson) ||
    !Array.isArray(geojson.features)
  ) {
    console.error('Invalid input to sanitizeGeoJSON', geojson);
    return null;
  }

  const sanitizedFeatures = geojson.features
    .map((feature: unknown) => {
      if (
        typeof feature !== 'object' ||
        feature === null ||
        !('type' in feature) ||
        feature.type !== 'Feature' ||
        !('geometry' in feature) ||
        !('properties' in feature)
      ) {
        console.warn('Skipping invalid feature during sanitization:', feature);
        return null;
      }
      const typedFeature = feature as Feature<Geometry, RawFeatureProperties>;

      return {
        type: 'Feature',
        geometry: { ...typedFeature.geometry },
        properties: {
          NAME_1: typedFeature.properties.NAME_1,
          production: typedFeature.properties.production || 0,
          color: typedFeature.properties.color || '#ffffcc',
        } as MapFeatureProperties,
      } as Feature<Geometry, MapFeatureProperties>;
    })
    .filter(
      (feature): feature is Feature<Geometry, MapFeatureProperties> =>
        feature !== null
    );

  return {
    type: 'FeatureCollection',
    features: sanitizedFeatures,
  };
};

const CropProductionMap: React.FC<CropProductionMapProps> = ({
  productionData,
}) => {
  const [geojsonData, setGeojsonData] = useState<ProcessedGeoJSON | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    longitude: number;
    latitude: number;
    stateName: string;
    production: number;
  } | null>(null);
  const [isClient, setIsClient] = useState(false);

  const productionByState = useMemo(() => {
    const map = new Map<string, number>();
    if (!Array.isArray(productionData)) {
      console.warn('productionData is not an array:', productionData);
      return map;
    }
    productionData.forEach((item) => {
      if (
        item &&
        typeof item.State_Name === 'string' &&
        typeof item.Production === 'number' &&
        !isNaN(item.Production)
      ) {
        map.set(
          item.State_Name,
          (map.get(item.State_Name) || 0) + item.Production
        );
      } else {
        console.warn('Skipping invalid production data item:', item);
      }
    });
    return map;
  }, [productionData]);

  useEffect(() => {
    setIsClient(true);
    let isMounted = true;

    fetch('/india_states.geojson')
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} for ${response.url}`
          );
        }
        return response.json();
      })
      .then((data) => {
        if (!isMounted) return;

        if (
          data &&
          data.type === 'FeatureCollection' &&
          Array.isArray(data.features)
        ) {
          const productionValues = Array.from(productionByState.values());
          const minProduction =
            productionValues.length > 0 ? Math.min(...productionValues) : 0;
          const maxProduction =
            productionValues.length > 0 ? Math.max(...productionValues) : 0;
          const productionRange = maxProduction - minProduction;

          const processedFeatures = data.features.map((feature: any) => {
            const stateName = feature.properties?.NAME_1;

            const production = stateName
              ? productionByState.get(stateName) || 0
              : 0;

            let color = '#ffffcc';
            if (productionRange > 0) {
              const percentage = (production - minProduction) / productionRange;

              if (percentage > 0.8) {
                color = '#800026';
              } else if (percentage > 0.6) {
                color = '#bd0026';
              } else if (percentage > 0.4) {
                color = '#e31a1c';
              } else if (percentage > 0.2) {
                color = '#fc4e2a';
              } else if (percentage > 0) {
                color = '#fd8d3c';
              }
            } else if (maxProduction > 0) {
              color = '#e31a1c';
            }

            return {
              ...feature,
              properties: {
                ...feature.properties,
                production,
                color,
              },
            };
          });

          const processedGeoJSON = {
            type: 'FeatureCollection',
            features: processedFeatures,
          };

          setGeojsonData(processedGeoJSON as ProcessedGeoJSON);
        } else {
          console.error('Invalid GeoJSON format received:', data);
          setGeojsonData(null);
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('Error fetching or parsing geojson:', error);
        setGeojsonData(null);
      });

    return () => {
      isMounted = false;
    };
  }, [productionByState]);

  const fillLayerStyle = useMemo(() => ({
    id: 'state-fills',
    type: 'fill',
    source: 'india-states',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.8,
      'fill-outline-color': '#ffffff',
    },
  }), []);

  const onHover = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features && event.features[0];
      if (feature?.properties) {
        const stateName = feature.properties.NAME_1;
        const production = feature.properties.production;

        if (typeof stateName === 'string' && typeof production === 'number') {
          setHoverInfo({
            longitude: event.lngLat.lng,
            latitude: event.lngLat.lat,
            stateName: stateName,
            production: production,
          });
          return;
        }
      }
      if (hoverInfo !== null) {
        setHoverInfo(null);
      }
    },
    [hoverInfo]
  );

  const onMouseLeave = useCallback(() => {
    if (hoverInfo !== null) {
      setHoverInfo(null);
    }
  }, [hoverInfo]);

  const onMapError = useCallback((evt: ErrorEvent) => {
    console.error('MapLibre Error:', evt.error);
  }, []);

  if (!isClient) {
    return <div>Loading map...</div>;
  }

  const sourceProps = geojsonData
    ? {
        id: 'india-states',
        type: 'geojson' as const,
        data: geojsonData,
      }
    : null;

  return (
    <MapGL
      initialViewState={{
        longitude: 78.9629,
        latitude: 20.5937,
        zoom: 4,
      }}
      style={{ width: '100%', height: '600px' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}
      interactiveLayerIds={['state-fills']}
      onMouseMove={onHover}
      onMouseLeave={onMouseLeave}
    >
      {geojsonData && (
        <Source id="india-states" type="geojson" data={geojsonData}>
          <Layer {...fillLayerStyle} />
        </Source>
      )}

      {hoverInfo && (
        <Popup
          longitude={hoverInfo.longitude}
          latitude={hoverInfo.latitude}
          closeButton={false}
          closeOnClick={false}
          anchor="bottom"
          offset={10}
        >
          <div>
            <b>{hoverInfo.stateName}</b>
            <br />
            Production: {hoverInfo.production.toLocaleString()}
          </div>
        </Popup>
      )}
    </MapGL>
  );
};

export default CropProductionMap;