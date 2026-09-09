import { locations } from "../src/data/locations.ts";
import { businessCategories } from "../src/data/businesses.ts";
import { buildCanonicalAnalysisResult } from "../src/services/api/dataIntegrationService.ts";
import { fetchNearbyOSMBusinesses } from "../src/services/api/overpassService.ts";
import { getAgmarknetMandiPrices } from "../src/services/api/agmarknetService.ts";
import { getHistoricalCropPrices } from "../src/services/api/cropPriceHistoryService.ts";

console.log("=== STEP 1: REPRODUCE AND OBSERVE EXTERNAL REQUEST TIMINGS ===");

const loc = locations[0]; // Bisalpur, Pilibhit
const agriBiz = businessCategories.find(b => b.id === "dairy");
const retailBiz = businessCategories.find(b => b.id === "grocery");

async function timeCall(name, fn) {
  const start = Date.now();
  console.log(`[START] ${name}...`);
  try {
    const res = await fn();
    const duration = Date.now() - start;
    console.log(`[RESOLVED] ${name} in ${duration}ms | Status: ${res.status || 'OK'}`);
    return { name, status: 'RESOLVED', duration, res };
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`[FAILED] ${name} in ${duration}ms | Error: ${err.message}`);
    return { name, status: 'FAILED', duration, err };
  }
}

async function testTimings() {
  console.log("\n--- Testing Individual Service Call Timings ---");
  await timeCall("Overpass Spatial API", () => fetchNearbyOSMBusinesses(loc.lat, loc.lng, 5));
  await timeCall("AGMARKNET Mandi Service (No Convex Client)", () => getAgmarknetMandiPrices(loc.state, loc.district, agriBiz.name));
  await timeCall("Crop History Service (No Convex Client)", () => getHistoricalCropPrices(agriBiz.name, loc.state));

  console.log("\n--- Testing Full Canonical Engine Assembly (Sequential) ---");
  const startFull = Date.now();
  const canonical = await buildCanonicalAnalysisResult({
    location: loc,
    business: agriBiz,
    capital: 200000,
    radiusKm: 5,
  });
  console.log(`[RESOLVED] Canonical Engine for ${agriBiz.name} in ${Date.now() - startFull}ms`);
}

testTimings().catch(console.error);
