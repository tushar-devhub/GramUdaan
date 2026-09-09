const overpassCache = new Map();
let lastQueryTime = 0;
const MIN_QUERY_INTERVAL_MS = 2000;

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

async function fetchNearbyOSMBusinesses(locationName, lat, lng, radiusKm = 5) {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${radiusKm}`;
  if (overpassCache.has(cacheKey)) {
    console.log(`[CACHE HIT] Returning cached data for ${locationName}`);
    return overpassCache.get(cacheKey);
  }

  const now = Date.now();
  const timeSinceLast = now - lastQueryTime;
  if (timeSinceLast < MIN_QUERY_INTERVAL_MS) {
    console.log(`[RATE-LIMIT THROTTLE] Waiting ${MIN_QUERY_INTERVAL_MS - timeSinceLast}ms...`);
    await new Promise((r) => setTimeout(r, MIN_QUERY_INTERVAL_MS - timeSinceLast));
  }
  lastQueryTime = Date.now();

  const radiusMeters = Math.min(Math.max(radiusKm, 1), 10) * 1000;
  const query = `[out:json][timeout:25];node(around:${radiusMeters},${lat},${lng})["shop"];out body 30;`;
  
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter"
  ];

  console.log(`\nQuerying Overpass API for ${locationName} (${lat}, ${lng}, ${radiusKm}km)...`);
  
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "GramUdaanApp/1.0 (contact@gramudaan.in)",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(12000),
      });

      console.log(`HTTP Status from ${new URL(endpoint).hostname}: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        const elements = data.elements || [];
        const records = [];

        for (const el of elements) {
          const eLat = el.lat;
          const eLng = el.lon;
          if (!eLat || !eLng) continue;

          const tags = el.tags || {};
          const name = tags.name || tags["name:en"] || tags["name:hi"] || tags.shop || "स्थानीय दुकान";
          const category = `दुकान (${tags.shop || "सामान्य"})`;
          const dist = calculateHaversineDistance(lat, lng, eLat, eLng);

          records.push({
            id: `osm-${el.id}`,
            name,
            category,
            businessType: tags.shop || "commercial",
            latitude: eLat,
            longitude: eLng,
            distanceKm: dist,
            source: "OpenStreetMap",
            status: "MAPPED",
          });
        }

        records.sort((a, b) => a.distanceKm - b.distanceKm);
        const summary = {
          locationName,
          radiusKm,
          totalMappedBusinesses: records.length,
          densityCategory: records.length < 5 ? "LOW" : records.length < 15 ? "MEDIUM" : "HIGH",
          businesses: records.slice(0, 5),
          source: "OpenStreetMap",
          status: "MAPPED",
          displayLabelHi: "आस-पास के दर्ज व्यवसाय", // MUST NEVER SAY "all competitors"
        };

        overpassCache.set(cacheKey, summary);
        return summary;
      }
    } catch (err) {
      console.log(`Endpoint ${new URL(endpoint).hostname} error: ${err.message}`);
    }
  }

  // Graceful no-data fallback per spec
  const fallback = {
    locationName,
    radiusKm,
    totalMappedBusinesses: 0,
    densityCategory: "LOW",
    businesses: [],
    source: "OpenStreetMap",
    status: "UNAVAILABLE",
    displayLabelHi: "आस-पास के दर्ज व्यवसाय (डेटा उपलब्ध नहीं)",
  };
  return fallback;
}

async function runTest() {
  console.log("=== PHASE 6 OVERPASS API VERIFICATION FOR 2 LOCATIONS ===");
  
  // Location 1: Rampur, UP
  const loc1 = await fetchNearbyOSMBusinesses("Rampur, UP", 28.79, 79.02, 5);
  console.log(`\n[LOCATION 1 RESULT - ${loc1.locationName}]`);
  console.log(`Display Label: "${loc1.displayLabelHi}"`);
  console.log(`Total Mapped Businesses Found: ${loc1.totalMappedBusinesses}`);
  console.log(`Density Category: ${loc1.densityCategory}`);
  if (loc1.businesses.length > 0) {
    console.log("Sample Businesses:", loc1.businesses.slice(0, 3));
  }

  // Location 2: Muzaffarpur, Bihar
  const loc2 = await fetchNearbyOSMBusinesses("Muzaffarpur, Bihar", 26.12, 85.36, 5);
  console.log(`\n[LOCATION 2 RESULT - ${loc2.locationName}]`);
  console.log(`Display Label: "${loc2.displayLabelHi}"`);
  console.log(`Total Mapped Businesses Found: ${loc2.totalMappedBusinesses}`);
  console.log(`Density Category: ${loc2.densityCategory}`);
  if (loc2.businesses.length > 0) {
    console.log("Sample Businesses:", loc2.businesses.slice(0, 3));
  }

  // Test Caching
  console.log("\n--- TESTING CACHE FUNCTIONALITY ---");
  await fetchNearbyOSMBusinesses("Rampur, UP (Repeat)", 28.79, 79.02, 5);
}

runTest();
