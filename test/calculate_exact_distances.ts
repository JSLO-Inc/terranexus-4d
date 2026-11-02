import { computeHaversineDistanceKm, INDIAN_STUDY_LOCI } from '../server/ingestion/spatialExtraction';

const loci = Object.values(INDIAN_STUDY_LOCI);
console.log('=== 7 STUDY LOCI TO NEAREST 0.5-DEG GRID CENTROIDS ===');
for (const loc of loci) {
  const latIdx = Math.round((loc.latitude - (-89.75)) / 0.5);
  const cellLat = -89.75 + latIdx * 0.5;
  const lonIdx = Math.round((loc.longitude - 0.25) / 0.5);
  const cellLon = 0.25 + lonIdx * 0.5;
  const dist = computeHaversineDistanceKm(loc.latitude, loc.longitude, cellLat, cellLon);
  console.log(`Locus: ${loc.id}`);
  console.log(`  Name: ${loc.name}`);
  console.log(`  Target: (${loc.latitude.toFixed(4)} N, ${loc.longitude.toFixed(4)} E)`);
  console.log(`  Centroid: (${cellLat.toFixed(4)} N, ${cellLon.toFixed(4)} E)`);
  console.log(`  Distance: ${dist.toFixed(2)} km\n`);
}

console.log('=== ALL 21 PAIRWISE INTER-LOCUS DISTANCES ===');
let count = 0;
for (let i = 0; i < loci.length; i++) {
  for (let j = i + 1; j < loci.length; j++) {
    count++;
    const a = loci[i];
    const b = loci[j];
    const dist = computeHaversineDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
    const independent = dist >= 300.0;
    console.log(`${count.toString().padStart(2, ' ')}. ${a.district} (${a.state}) <-> ${b.district} (${b.state})`);
    console.log(`    Distance: ${dist.toFixed(2)} km | Independence: ${independent ? 'INDEPENDENT (>=300 km)' : 'CORRELATED (<300 km)'}`);
  }
}
