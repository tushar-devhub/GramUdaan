import type { NormalizedDataPoint, SectorCategory } from "@/types/dataGov";

/**
 * Centralized Data.gov.in verified Resource Registry
 * Single API key is used server-side to access all these resource IDs.
 */
export const DATA_GOV_RESOURCES = {
  agmarknetDaily: {
    resourceId: "9ef84268-d588-465a-a308-a864a43d0070",
    datasetName: "AGMARKNET Daily Mandi Prices",
    categories: ["agriculture", "dairy"],
    requiredFields: ["state", "district", "market", "commodity", "modal_price"],
  },
  agmarknetHistorical: {
    resourceId: "35985678-0d79-46b4-9ed6-6f13308a1d24",
    datasetName: "AGMARKNET Historical Crop Prices",
    categories: ["agriculture", "dairy"],
    requiredFields: ["State", "District", "Commodity", "Modal_Price"],
  },
  cropProduction: {
    resourceId: "ce9082ab-b72e-4610-8636-67056a27e7a8",
    datasetName: "District Crop Production Statistics",
    categories: ["agriculture"],
    requiredFields: ["state_name", "district_name", "crop", "production"],
  },
  msmeEnterprises: {
    resourceId: "61761610-863e-4701-a6c4-118e7703ca60",
    datasetName: "MSME & UDYAM Registered Units",
    categories: ["retail", "textile", "manufacturing", "services", "dairy"],
    requiredFields: ["state_name", "district_name", "enterprise_type"],
  },
  odopProducts: {
    resourceId: "0e060ef5-f716-4352-8706-0834fb19ef00",
    datasetName: "One District One Product (ODOP) Directory",
    categories: ["textile", "manufacturing", "retail", "tourism"],
    requiredFields: ["state", "district", "product_name"],
  },
  textileClusters: {
    resourceId: "8bc3cf1e-efb8-46b4-a212-32b50f7ff143",
    datasetName: "Handloom & Textile Clusters",
    categories: ["textile"],
    requiredFields: ["state", "district", "cluster_name"],
  },
  tourismDestinations: {
    resourceId: "59e51c89-fb50-4ef1-8a8b-3023e1f0a200",
    datasetName: "Tourism & Heritage Destination Index",
    categories: ["tourism", "services"],
    requiredFields: ["state", "destination", "type"],
  },
  censusDemographics: {
    resourceId: "b8b09062-8178-4334-a15d-35f99fa4eb4e",
    datasetName: "Census 2011 Town & District Directory",
    categories: ["agriculture", "dairy", "retail", "textile", "manufacturing", "tourism", "services"],
    requiredFields: ["state", "district", "population"],
  },
};

/** Session cache to prevent duplicate network hits during UI renders */
const dataGovCache = new Map<string, { status: string; records: Record<string, unknown>[]; total: number }>();

/** Sector routing map specifying which datasets apply to each sector category */
export const SECTOR_DATASET_MAP: Record<SectorCategory, (keyof typeof DATA_GOV_RESOURCES)[]> = {
  agriculture: ["agmarknetDaily", "agmarknetHistorical", "cropProduction", "msmeEnterprises", "censusDemographics"],
  dairy: ["agmarknetDaily", "msmeEnterprises", "censusDemographics"],
  retail: ["msmeEnterprises", "censusDemographics"],
  textile: ["msmeEnterprises", "odopProducts", "textileClusters", "censusDemographics"],
  manufacturing: ["msmeEnterprises", "odopProducts", "censusDemographics"],
  tourism: ["tourismDestinations", "odopProducts", "censusDemographics"],
  services: ["msmeEnterprises", "censusDemographics"],
};

/**
 * Normalizes generic raw data.gov.in records into standard NormalizedDataPoint format
 */
export function normalizeDataGovRecord(
  resourceKey: keyof typeof DATA_GOV_RESOURCES,
  record: Record<string, unknown>,
  state: string,
  district: string,
): NormalizedDataPoint {
  const cfg = DATA_GOV_RESOURCES[resourceKey];
  const commodity = String(record.commodity || record.Commodity || record.crop || record.product_name || cfg.datasetName);
  const priceVal = Number(record.modal_price || record.Modal_Price || record.min_price || record.production || 0);

  const isCensus = resourceKey === "censusDemographics" || cfg.datasetName.includes("Census");

  return {
    source: "data.gov.in",
    datasetName: cfg.datasetName,
    resourceId: cfg.resourceId,
    location: `${district}, ${state}`,
    metric: commodity,
    value: priceVal > 0 ? priceVal : "Available",
    unit: String(record.unit || record.Unit || "records"),
    confidence: isCensus ? "MEDIUM" : "HIGH",
    provenance: isCensus ? "HISTORICAL_BASELINE" : "VERIFIED_EXTERNAL",
    detailsHi: isCensus ? `ऐतिहासिक डेटा: ${cfg.datasetName} (${district})` : `सत्यापित डेटा: ${cfg.datasetName} (${district})`,
  };
}

/**
 * Client wrapper to query data.gov.in directly with caching
 */
export async function fetchDataGovDataset(
  resourceKey: keyof typeof DATA_GOV_RESOURCES,
  state: string,
  district: string,
  _client?: any,
): Promise<{ status: "VERIFIED_EXTERNAL" | "UNAVAILABLE"; records: NormalizedDataPoint[]; total: number }> {
  const cfg = DATA_GOV_RESOURCES[resourceKey];
  const cacheKey = `${resourceKey}:${state}:${district}`;

  if (dataGovCache.has(cacheKey)) {
    const cached = dataGovCache.get(cacheKey)!;
    return {
      status: cached.records.length > 0 ? "VERIFIED_EXTERNAL" : "UNAVAILABLE",
      records: cached.records.map((r) => normalizeDataGovRecord(resourceKey, r, state, district)),
      total: cached.total,
    };
  }

  try {
    let rawRecords: Record<string, unknown>[] = [];
    let total = 0;

    const apiKey = "579b464db66ec23bdd000001a6e54809f221467e56646515a97a4988";
    const url = `https://api.data.gov.in/resource/${cfg.resourceId}?api-key=${apiKey}&format=json&limit=20&filters[state]=${encodeURIComponent(state)}&filters[district]=${encodeURIComponent(district)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const json = await res.json();
      rawRecords = json.records || [];
      total = json.total || rawRecords.length;
    }

    dataGovCache.set(cacheKey, { status: rawRecords.length > 0 ? "VERIFIED_EXTERNAL" : "UNAVAILABLE", records: rawRecords, total });

    const normalized = rawRecords.map((r) => normalizeDataGovRecord(resourceKey, r, state, district));
    return {
      status: normalized.length > 0 ? "VERIFIED_EXTERNAL" : "UNAVAILABLE",
      records: normalized,
      total,
    };
  } catch (err) {
    console.warn(`[dataGovService] Fetch failed for ${resourceKey}:`, err);
    dataGovCache.set(cacheKey, { status: "UNAVAILABLE", records: [], total: 0 });
    return { status: "UNAVAILABLE", records: [], total: 0 };
  }
}
