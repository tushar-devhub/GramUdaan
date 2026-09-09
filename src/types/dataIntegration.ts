/**
 * GramUdaan Data Integration & Data Provenance Types
 */

export type DataProvenanceStatus =
  | "USER_PROVIDED"
  | "VERIFIED_EXTERNAL"
  | "CALCULATED"
  | "ESTIMATED"
  | "AI_GENERATED"
  | "MAPPED"
  | "UNAVAILABLE";

export interface DataPoint<T> {
  value: T;
  source: string;
  dataset?: string;
  retrievedAt?: string;
  location?: string;
  date?: string;
  unit?: string;
  status: DataProvenanceStatus;
  confidence?: number;
  labelHi?: string;
  labelEn?: string;
}

/** AGMARKNET Current Mandi Price (Wholesale Mandi Data) */
export interface MandiPriceRecord {
  source: string; // e.g. "AGMARKNET / data.gov.in"
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string; // e.g. "Rs/Quintal"
  date: string;
  status: "VERIFIED_EXTERNAL" | "UNAVAILABLE";
  isWholesaleNotice: boolean;
}

/** Historical Crop Price Record (Since 1991) */
export interface HistoricalCropPriceRecord {
  source: string; // e.g. "AGMARKNET / Historical Data"
  commodity: string;
  variety: string;
  year: number;
  price: number;
  unit: string;
  status: "VERIFIED_EXTERNAL" | "UNAVAILABLE";
}

/** Census Population Record (Census 2011) */
export interface CensusDataRecord {
  source: "Census of India 2011";
  year: 2011;
  state: string;
  district: string;
  subDistrict?: string;
  villageOrTown?: string;
  population: number;
  households: number;
  status: "VERIFIED_EXTERNAL" | "ESTIMATED" | "UNAVAILABLE";
  displayLabelHi: string; // MUST say "जनसंख्या — जनगणना 2011"
}

/** Nearby Mapped Business (OpenStreetMap / Overpass API) */
export interface MappedBusinessRecord {
  id: string;
  name: string;
  category: string;
  businessType: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  source: "OpenStreetMap";
  status: "MAPPED";
}

/** OpenStreetMap Competition Analysis */
export interface OSMCompetitionSummary {
  radiusKm: number;
  totalMappedBusinesses: number;
  densityCategory: "LOW" | "MEDIUM" | "HIGH";
  densityCategoryHi: string;
  businesses: MappedBusinessRecord[];
  source: "OpenStreetMap";
  status: "MAPPED" | "UNAVAILABLE";
  displayLabelHi: string; // MUST say "आस-पास के दर्ज व्यवसाय"
}

/** Risk Item with detailed breakdown */
export interface CanonicalRiskItem {
  id: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  severityHi: string;
  what: string;
  whatHi: string;
  why: string;
  whyHi: string;
  impact: string;
  impactHi: string;
  action: string;
  actionHi: string;
}

/** Scheme Match Item */
export interface CanonicalSchemeMatch {
  schemeId: string;
  schemeName: string;
  schemeNameHi: string;
  matchLevel: "HIGH" | "POSSIBLE" | "LOW";
  matchLevelHi: string;
  maxFunding: number;
  subsidyRate: string;
  subsidyRateHi: string;
  keyConditionHi: string;
  disclaimerHi: string; // Explicit non-guarantee
}

/** Single Canonical AnalysisResult (Phase 19) */
export interface CanonicalAnalysisResult {
  businessId: string;
  businessName: string;
  businessNameHi: string;
  businessType: string;
  businessTypeHi: string;
  isAgriBusiness: boolean;
  
  location: {
    id: string;
    name: string;
    district: string;
    state: string;
    pincode: string;
    lat: number;
    lng: number;
  };
  
  population: DataPoint<number>;
  demographics: {
    households: DataPoint<number>;
    targetConsumers: DataPoint<number>;
    tierLabelHi: string;
  };
  
  nearbyBusinesses: OSMCompetitionSummary;
  mandiData?: {
    records: MandiPriceRecord[];
    status: "VERIFIED_EXTERNAL" | "UNAVAILABLE";
    statusTextHi: string;
    lastUpdated?: string;
  };
  historicalPrices?: {
    records: HistoricalCropPriceRecord[];
    status: "VERIFIED_EXTERNAL" | "UNAVAILABLE";
    statusTextHi: string;
  };
  
  costs: {
    placeOption: "own" | "rent" | "buy" | "build" | "not-needed" | "unsure";
    placeOptionLabelHi: string;
    placeCost: DataPoint<number>;
    equipmentCost: DataPoint<number>;
    inventoryCost: DataPoint<number>;
    workingCapital: DataPoint<number>;
    constructionCost: DataPoint<number>;
    licensingCost: DataPoint<number>;
    totalSetupCost: DataPoint<number>;
    monthlyOperatingExpenses: DataPoint<number>;
  };
  
  revenue: {
    monthlyRevenueEstimateMin: DataPoint<number>;
    monthlyRevenueEstimateMax: DataPoint<number>;
    revenueDriverHi: string;
    rampUpMonths: number;
  };
  
  expenses: {
    monthlyFixedCost: DataPoint<number>;
    monthlyVariableCostRatio: DataPoint<number>;
    monthlyRentCost: DataPoint<number>;
  };
  
  profit: {
    monthlyNetProfitMin: DataPoint<number>;
    monthlyNetProfitMax: DataPoint<number>;
    netMarginPercent: DataPoint<number>;
  };
  
  breakEven: {
    monthsToBreakEven: DataPoint<number>;
    breakEvenMonthlyRevenue: DataPoint<number>;
  };
  
  capitalFit: {
    userCapital: DataPoint<number>;
    targetInvestment: DataPoint<number>;
    otherFunding: DataPoint<number>;
    totalAvailableCapital: DataPoint<number>;
    requiredCapital: DataPoint<number>;
    fundingGap: DataPoint<number>;
    surplusOrDeficit: DataPoint<number>;
    capitalFitStatusHi: string;
    surplusExplanationHi: string;
  };
  
  risks: CanonicalRiskItem[];
  
  feasibilityScore: DataPoint<number>; // 0 to 100
  decision: {
    code: "START" | "PROCEED_CAREFULLY" | "RETHINK";
    labelEn: "START" | "PROCEED CAREFULLY" | "RETHINK";
    labelHi: "शुरू करें" | "सावधानी से आगे बढ़ें" | "पुनर्विचार करें";
    summaryHi: string;
    whyPointsHi: string[];
    watchOutsHi: string[];
  };
  
  alternatives: {
    businessId: string;
    businessNameHi: string;
    score: number;
    reasonHi: string;
  }[];
  
  schemes: CanonicalSchemeMatch[];
  sources: {
    name: string;
    status: DataProvenanceStatus;
    statusLabelHi: string;
    datasetName?: string;
  }[];
  
  assumptionsHi: string[];
  timestamp: string;
}
