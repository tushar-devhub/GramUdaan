import { locations, upsertLocation, type Location as GramLocation } from "../../data/locations";
import { searchPinOnline, type LocationHit } from "./locationService";

/**
 * Regional hubs catalog for instant high-confidence resolution of common Indian cities & towns
 * when full offline directory is not yet downloaded.
 */
const REGIONAL_HUBS: GramLocation[] = [
  { id: "loc-alwar", name: "Alwar", district: "Alwar", state: "Rajasthan", pincode: "301001", lat: 27.553, lng: 76.634, type: "town", population: 341422, households: 62000, source: "curated" },
  { id: "loc-jaipur", name: "Jaipur", district: "Jaipur", state: "Rajasthan", pincode: "302001", lat: 26.912, lng: 75.787, type: "city", population: 3046163, households: 520000, source: "curated" },
  { id: "loc-sikar", name: "Sikar", district: "Sikar", state: "Rajasthan", pincode: "332001", lat: 27.615, lng: 75.139, type: "town", population: 237532, households: 41000, source: "curated" },
  { id: "loc-bharatpur", name: "Bharatpur", district: "Bharatpur", state: "Rajasthan", pincode: "321001", lat: 27.217, lng: 77.49, type: "town", population: 252342, households: 43000, source: "curated" },
  { id: "loc-ajmer", name: "Ajmer", district: "Ajmer", state: "Rajasthan", pincode: "305001", lat: 26.449, lng: 74.639, type: "city", population: 542380, households: 95000, source: "curated" },
  { id: "loc-kota", name: "Kota", district: "Kota", state: "Rajasthan", pincode: "324001", lat: 25.213, lng: 75.864, type: "city", population: 1001694, households: 180000, source: "curated" },
  { id: "loc-jodhpur", name: "Jodhpur", district: "Jodhpur", state: "Rajasthan", pincode: "342001", lat: 26.238, lng: 73.024, type: "city", population: 1033756, households: 185000, source: "curated" },
  { id: "loc-udaipur", name: "Udaipur", district: "Udaipur", state: "Rajasthan", pincode: "313001", lat: 24.585, lng: 73.712, type: "city", population: 451100, households: 82000, source: "curated" },
  { id: "loc-gurgaon", name: "Gurugram", district: "Gurugram", state: "Haryana", pincode: "122001", lat: 28.459, lng: 77.026, type: "city", population: 876969, households: 175000, source: "curated" },
  { id: "loc-faridabad", name: "Faridabad", district: "Faridabad", state: "Haryana", pincode: "121001", lat: 28.408, lng: 77.317, type: "city", population: 1414050, households: 260000, source: "curated" },
  { id: "loc-rohtak", name: "Rohtak", district: "Rohtak", state: "Haryana", pincode: "124001", lat: 28.891, lng: 76.58, type: "town", population: 374292, households: 68000, source: "curated" },
  { id: "loc-karnal", name: "Karnal", district: "Karnal", state: "Haryana", pincode: "132001", lat: 29.686, lng: 76.99, type: "town", population: 286821, households: 52000, source: "curated" },
  { id: "loc-hisar", name: "Hisar", district: "Hisar", state: "Haryana", pincode: "125001", lat: 29.149, lng: 75.722, type: "town", population: 301824, households: 55000, source: "curated" },
  { id: "loc-patna", name: "Patna", district: "Patna", state: "Bihar", pincode: "800001", lat: 25.594, lng: 85.137, type: "city", population: 1684222, households: 300000, source: "curated" },
  { id: "loc-gaya", name: "Gaya", district: "Gaya", state: "Bihar", pincode: "823001", lat: 24.796, lng: 85.0, type: "city", population: 470839, households: 84000, source: "curated" },
  { id: "loc-indore", name: "Indore", district: "Indore", state: "Madhya Pradesh", pincode: "452001", lat: 22.719, lng: 75.857, type: "city", population: 1983716, households: 360000, source: "curated" },
  { id: "loc-bhopal", name: "Bhopal", district: "Bhopal", state: "Madhya Pradesh", pincode: "462001", lat: 23.259, lng: 77.412, type: "city", population: 1798218, households: 330000, source: "curated" },
];

/** Clean raw location strings by removing conversational filler words. */
export function normalizeLocationQuery(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim();
  // Remove common Hindi/Hinglish fillers
  clean = clean.replace(/\b(ke paas|near|mein|in|city|district|zila|town|village|gaon|area|paas)\b/gi, "");
  clean = clean.replace(/के\s+पास|में|ज़िला|जिला|शहर|गाँव|गांव/gi, "");
  clean = clean.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ");
  return clean.replace(/\s+/g, " ").trim();
}

/**
 * Normalizes user-provided location text (e.g. "Alwar", "Alwar ke paas", "301001", "Alwar, Rajasthan")
 * into a structured, validated GramLocation with district, state, pincode, and lat/lng coordinates.
 * NEVER fabricates coordinates if unresolvable.
 */
export async function resolveLocation(rawInput: string): Promise<GramLocation> {
  const normQuery = normalizeLocationQuery(rawInput);
  const lowerQuery = normQuery.toLowerCase();

  // 1. Check if query contains a 6-digit Indian PIN code
  const pinMatch = rawInput.match(/\b(\d{6})\b/);
  if (pinMatch) {
    const pin = pinMatch[1];
    try {
      const pinHits = await searchPinOnline(pin);
      if (pinHits && pinHits.length > 0) {
        const topHit = pinHits[0];
        upsertLocation(topHit.location);
        return topHit.location;
      }
    } catch {
      // Fall through if online pin lookup fails
    }
  }

  // 2. Check curated locations from locations.ts registry
  const curatedMatch = locations.find((l) => {
    const lName = l.name.toLowerCase();
    const lDist = l.district.toLowerCase();
    return lowerQuery.includes(lName) || lowerQuery.includes(lDist) || lName.includes(lowerQuery);
  });
  if (curatedMatch) {
    return curatedMatch;
  }

  // 3. Check regional hub catalog (Alwar, Jaipur, Sikar, Bharatpur, etc.)
  const hubMatch = REGIONAL_HUBS.find((h) => {
    const hName = h.name.toLowerCase();
    const hDist = h.district.toLowerCase();
    return lowerQuery.includes(hName) || lowerQuery.includes(hDist) || hName.includes(lowerQuery);
  });
  if (hubMatch) {
    upsertLocation(hubMatch);
    return hubMatch;
  }

  // 4. Fallback: Create structured record without fabricating coordinates (lat=0, lng=0)
  const displayTitle = normQuery ? normQuery.charAt(0).toUpperCase() + normQuery.slice(1) : "Unknown Location";
  const fallbackLocation: GramLocation = {
    id: `loc-custom-${Date.now()}`,
    name: displayTitle,
    district: displayTitle,
    state: "India",
    pincode: pinMatch ? pinMatch[1] : "",
    lat: 0,
    lng: 0,
    type: "town",
    population: 25000,
    households: 3800,
    source: "curated",
  };
  upsertLocation(fallbackLocation);
  return fallbackLocation;
}
