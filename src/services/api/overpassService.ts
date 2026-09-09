import type { MappedBusinessRecord, OSMCompetitionSummary } from "@/types/dataIntegration";

// In-memory cache for Overpass queries: key = `lat,lng,radius`
const overpassCache = new Map<string, OSMCompetitionSummary>();
let lastQueryTime = 0;
const MIN_QUERY_INTERVAL_MS = 2000; // Rate-limit: wait at least 2s between queries

function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
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

export async function fetchNearbyOSMBusinesses(
  lat: number,
  lng: number,
  radiusKm = 5,
): Promise<OSMCompetitionSummary> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${radiusKm}`;
  if (overpassCache.has(cacheKey)) {
    return overpassCache.get(cacheKey)!;
  }

  // Throttle request rate
  const now = Date.now();
  const timeSinceLast = now - lastQueryTime;
  if (timeSinceLast < MIN_QUERY_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_QUERY_INTERVAL_MS - timeSinceLast));
  }
  lastQueryTime = Date.now();

  const radiusMeters = Math.min(Math.max(radiusKm, 1), 10) * 1000;
  
  // Overpass query looking for mapped commercial nodes & ways
  const query = `
    [out:json][timeout:10];
    (
      node(around:${radiusMeters},${lat},${lng})["shop"];
      node(around:${radiusMeters},${lat},${lng})["amenity"];
      node(around:${radiusMeters},${lat},${lng})["craft"];
      way(around:${radiusMeters},${lat},${lng})["shop"];
    );
    out body center 40;
  `;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Overpass returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      elements?: {
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }[];
    };

    const elements = data.elements || [];
    const records: MappedBusinessRecord[] = [];

    for (const el of elements) {
      const eLat = el.lat ?? el.center?.lat;
      const eLng = el.lon ?? el.center?.lon;
      if (!eLat || !eLng) continue;

      const tags = el.tags || {};
      const name = tags.name || tags["name:en"] || tags["name:hi"] || tags.shop || tags.amenity || tags.craft || "स्थानीय दुकान";
      const category = tags.shop ? `दुकान (${tags.shop})` : tags.amenity ? `सेवा (${tags.amenity})` : tags.craft ? `शिल्प (${tags.craft})` : "व्यापार";
      const dist = calculateHaversineDistance(lat, lng, eLat, eLng);

      records.push({
        id: `osm-${el.id}`,
        name,
        category,
        businessType: tags.shop || tags.amenity || tags.craft || "commercial",
        latitude: eLat,
        longitude: eLng,
        distanceKm: dist,
        source: "OpenStreetMap",
        status: "MAPPED",
      });
    }

    records.sort((a, b) => a.distanceKm - b.distanceKm);

    const count = records.length;
    const densityCategory: "LOW" | "MEDIUM" | "HIGH" =
      count < 5 ? "LOW" : count < 15 ? "MEDIUM" : "HIGH";
    const densityCategoryHi =
      densityCategory === "LOW"
        ? "कम प्रतिस्पर्धा"
        : densityCategory === "MEDIUM"
          ? "मध्यम प्रतिस्पर्धा"
          : "उच्च प्रतिस्पर्धा";

    const summary: OSMCompetitionSummary = {
      radiusKm,
      totalMappedBusinesses: count,
      densityCategory,
      densityCategoryHi,
      businesses: records,
      source: "OpenStreetMap",
      status: "MAPPED",
      displayLabelHi: "आस-पास के दर्ज व्यवसाय",
    };

    overpassCache.set(cacheKey, summary);
    return summary;
  } catch (err) {
    console.warn("[Overpass] Failed to fetch mapped businesses:", err);
    
    // Return empty state cleanly without crashing or faking data
    const emptySummary: OSMCompetitionSummary = {
      radiusKm,
      totalMappedBusinesses: 0,
      densityCategory: "LOW",
      densityCategoryHi: "डेटा सीमित",
      businesses: [],
      source: "OpenStreetMap",
      status: "UNAVAILABLE",
      displayLabelHi: "आस-पास के दर्ज व्यवसाय",
    };
    return emptySummary;
  }
}
