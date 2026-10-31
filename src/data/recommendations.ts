import { businessCategories, type BusinessCategory } from "./businesses";
import { type Location } from "./locations";
import {
  generateDataDrivenRecommendations,
  calculateDemandScore,
  calculateCapitalFitScore,
  calculateFinancialViabilityScore,
  type DataDrivenRecommendation,
  type ScoreFactors,
  type FactorTrace,
} from "@/services/recommendationEngine";

export interface BusinessRecommendation {
  business: BusinessCategory;
  reason: string;
  reasonHi?: string;
  opportunityScore: number;
  competitionLevel: "low" | "medium" | "high";
  rank: number;
  scoreFactors?: ScoreFactors;
  calculationTrace?: FactorTrace[];
  activeFactors?: FactorTrace[];
  excludedFactors?: FactorTrace[];
  effectiveWeights?: Record<string, number>;
  confidence?: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
  provenance?: {
    censusSource: string;
    competitionSource: string;
    sectorDataSource: string;
    confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
  };
}

/**
 * Data-Driven Business Recommendation Generator (Synchronous Helper)
 * Evaluates candidate businesses continuously using Census demographics, capital fit, and financial model.
 */
export function getRecommendations(location: Location, capital: number = 200000): BusinessRecommendation[] {
  const pop = location.population || 10000;

  // Evaluate candidate categories dynamically
  const candidates = businessCategories.filter((b) => b.id !== "other");

  const scored = candidates.map((biz) => {
    // 1. Continuous Demand Score
    const hh = location.households || Math.round(pop / 4.4);
    const demand = calculateDemandScore(pop, hh, biz);
    
    // 2. Continuous Capital Fit Score
    const capFit = calculateCapitalFitScore(capital, biz);

    // 3. Dynamic Financial Viability Score
    const financial = calculateFinancialViabilityScore(biz, capital);

    // Weighted Overall Score (Demand 35%, CapitalFit 40%, Financial 25%)
    const score = Math.round(demand * 0.35 + capFit * 0.40 + financial * 0.25);

    let reasonEn = `Customer catchment demand in ${location.name} (${pop.toLocaleString("en-IN")} Census baseline) with capital fit and financial viability.`;
    let reasonHi = `${location.name} में जनसंख्या मांग एवं आपकी ₹${capital.toLocaleString("en-IN")} पूंजी के अनुकूल अवसर।`;

    return {
      business: biz,
      reason: reasonEn,
      reasonHi,
      opportunityScore: score,
      competitionLevel: "medium" as const,
      rank: 0,
      scoreFactors: {
        demographicScore: demand,
        competitionScore: null,
        capitalFitScore: capFit,
        sectorAlignmentScore: null,
        financialViabilityScore: financial,
      },
      confidence: "MEDIUM" as const,
      provenance: {
        censusSource: "Census of India 2011 (Historical Baseline)",
        competitionSource: "Excluded (No OSM Data)",
        sectorDataSource: "Settlement Hinterland Contextual Prior",
        confidence: "MEDIUM" as const,
      },
    };
  });

  scored.sort((a, b) => b.opportunityScore - a.opportunityScore);
  scored.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return scored;
}

/**
 * Asynchronous Data-Driven Business Recommendation Entry Point
 * Queries real APIs (Census, Overpass OSM, data.gov.in) and calculates transparent candidate scores.
 */
export async function getAsyncRecommendations(
  location: Location,
  capital: number = 200000,
  radiusKm: number = 5,
  convexClient?: any,
): Promise<BusinessRecommendation[]> {
  try {
    const dataDriven = await generateDataDrivenRecommendations(location, capital, radiusKm, convexClient);
    console.log(
      "[Recommendation UI]",
      "Async data completion - count:",
      dataDriven.length,
      "ids:",
      dataDriven.map((r) => r.business.id)
    );
    return dataDriven.map((item) => ({
      business: item.business,
      reason: item.reason,
      reasonHi: item.reasonHi,
      opportunityScore: item.opportunityScore,
      competitionLevel: item.competitionLevel,
      rank: item.rank,
      scoreFactors: item.scoreFactors,
      calculationTrace: item.calculationTrace,
      activeFactors: item.activeFactors,
      excludedFactors: item.excludedFactors,
      effectiveWeights: item.effectiveWeights,
      confidence: item.confidence,
      provenance: item.provenance,
    }));
  } catch (err) {
    console.warn("[getAsyncRecommendations] API query error, using dynamic candidate scoring:", err);
    return getRecommendations(location, capital);
  }
}
