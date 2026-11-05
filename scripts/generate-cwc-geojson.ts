import fs from 'fs';
import path from 'path';

const inputPath = path.resolve('server/data/gis/wris_basins_cwc_official.json');
const publicDir = path.resolve('public/data');
const serverDir = path.resolve('server/data');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
}

const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const basins = rawData.basins || [];

const featureCollection = {
  type: 'FeatureCollection',
  crs: {
    type: 'name',
    properties: {
      name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
    }
  },
  features: basins.map((b: any) => ({
    type: 'Feature',
    id: `basin-${b.basinCode}`,
    properties: {
      id: `basin-${b.basinCode}`,
      code: b.basinCode,
      name: `${b.name} River Basin`,
      basinName: b.name,
      drainageAreaSqKm: b.drainageAreaSqKm,
      states: b.states,
      centroid: b.centroid,
      bounds: b.bounds,
      source: 'Central Water Commission (CWC) & India-WRIS',
      status: 'OBSERVED',
      licence: 'GODL-India'
    },
    geometry: b.geometry
  }))
};

const jsonStr = JSON.stringify(featureCollection);

fs.writeFileSync(path.join(publicDir, 'cwc_basins.geojson'), jsonStr, 'utf8');
fs.writeFileSync(path.join(serverDir, 'cwcBasins.json'), jsonStr, 'utf8');

console.log(`Successfully generated CWC Basins GeoJSON with ${featureCollection.features.length} features.`);
