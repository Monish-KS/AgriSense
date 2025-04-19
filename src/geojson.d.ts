declare module '*.geojson' {
  import { GeoJSON as GeoJSONType } from 'geojson';
  const value: GeoJSONType;
  export default value;
}