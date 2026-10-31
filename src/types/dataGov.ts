export type ProvenanceClass =
  | "REAL_API_DATA"
  | "VERIFIED_EXTERNAL"
  | "CALCULATED"
  | "ESTIMATED"
  | "ASSUMPTION"
  | "HISTORICAL_BASELINE"
  | "INSUFFICIENT_DATA"
  | "UNAVAILABLE"
  | "USER_PROVIDED";

export type ProvenanceType = ProvenanceClass;

export interface NormalizedDataPoint {
  source: string;
  datasetName: string;
  resourceId: string;
  location: string;
  period?: string;
  metric: string;
  value: number | string;
  unit?: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  provenance: ProvenanceType;
  detailsHi?: string;
}

export interface DataGovResourceConfig {
  resourceId: string;
  datasetName: string;
  categories: string[];
  requiredFields: string[];
}

export type SectorCategory =
  | "agriculture"
  | "dairy"
  | "retail"
  | "textile"
  | "manufacturing"
  | "tourism"
  | "services";

export interface LocalDataProfile {
  location: {
    id: string;
    name: string;
    district: string;
    state: string;
    pincode: string;
    lat: number;
    lng: number;
    type: string;
    population: number;
    households: number;
  };
  demographics: {
    population: number;
    households: number;
    densityPerSqKm: number;
    provenance: "HISTORICAL_BASELINE";
    confidence: "MEDIUM";
  };
  competition: {
    totalMappedOSM: number;
    mappedByCategory: Record<string, number>;
    categoryDensityPerThousand: Record<string, number>;
    status: "VERIFIED_EXTERNAL" | "UNAVAILABLE";
  };
  economicActivity: {
    hasAgriActivity: boolean;
    agriCommodityCount: number;
    hasMsmeActivity: boolean;
    msmeCount: number;
    hasOdopActivity: boolean;
    odopProducts: string[];
    status: "VERIFIED_EXTERNAL" | "UNAVAILABLE";
  };
  marketSignals: {
    commoditySignals: Record<string, number>;
    sectorSignals: Record<SectorCategory, number>;
  };
  sourceStatus: {
    census: ProvenanceType;
    osm: ProvenanceType;
    dataGov: ProvenanceType;
  };
  dataGovRecords?: NormalizedDataPoint[];
  provenance?: {
    census: ProvenanceType;
    osm: ProvenanceType;
    dataGov: ProvenanceType;
    confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
  };
}
