import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Location } from "@/data/locations";
import type { BusinessCategory } from "@/data/businesses";
import type { FeasibilityData } from "@/data/feasibility-types";
import type { DemoScenario } from "@/data/demos";
import type { PlaceStatus, ScaleChoice, BusinessSubCategory } from "@/data/businessConfig";
import { locations } from "@/data/locations";
import { businessCategories } from "@/data/businesses";
import { generateFeasibility } from "@/data/feasibility";

import type { CanonicalAnalysisResult } from "@/types/dataIntegration";
import { buildCanonicalAnalysisResult } from "@/services/api/dataIntegrationService";

export interface FeasibilityOptions {
  subCategoryId?: string | null;
  placeStatus?: PlaceStatus;
  rentMonthly?: number;
  scaleChoice?: ScaleChoice;
  businessAnswers?: Record<string, string>;
}

interface OnboardingState {
  location: Location | null;
  radius: number;
  business: BusinessCategory | null;
  subCategory: BusinessSubCategory | null;
  placeStatus: PlaceStatus;
  rentMonthly: number;
  scaleChoice: ScaleChoice;
  businessAnswers: Record<string, string>;
  /** USER_CAPITAL — money the user can invest from their own pocket. */
  capital: number;
  /** TARGET_INVESTMENT — what the user plans/willing to invest (distinct from capital). */
  targetInvestment: number;
  /** Family / partner / grant / other legitimate funding (combined ₹). */
  otherFunding: number;
  /** User-edited cost-component amounts (₹), keyed by component id.
   *  Empty = use the model estimates. Honored by the whole decision chain
   *  (onboarding → plan → dashboard → report → advisor). */
  costOverrides: Record<string, number>;
  feasibility: FeasibilityData | null;
  analysisResult: CanonicalAnalysisResult | null;
  isAnalyzing: boolean;
}

interface OnboardingContextType extends OnboardingState {
  setLocation: (loc: Location | null) => void;
  setRadius: (r: number) => void;
  setBusiness: (biz: BusinessCategory | null) => void;
  setSubCategory: (s: BusinessSubCategory | null) => void;
  setPlaceStatus: (p: PlaceStatus) => void;
  setRentMonthly: (r: number) => void;
  setScaleChoice: (s: ScaleChoice) => void;
  setBusinessAnswer: (id: string, value: string) => void;
  setCapital: (c: number) => void;
  setTargetInvestment: (v: number) => void;
  setOtherFunding: (v: number) => void;
  setCostOverride: (id: string, value: number) => void;
  resetCostOverrides: () => void;
  setFeasibility: (f: FeasibilityData | null) => void;
  setAnalysisResult: (res: CanonicalAnalysisResult | null) => void;
  setIsAnalyzing: (a: boolean) => void;
  runFullAnalysis: (convexClient?: any) => Promise<CanonicalAnalysisResult | null>;
  reset: () => void;
  loadDemo: (demo: DemoScenario) => void;
  loadSavedReport: (report: any) => void;
}

// Baseline location shown on Step 1 (New Delhi, matching the onboarding setup in Image 1)
const defaultLocation = locations[0]; // New Delhi, Delhi (PIN 110001)

export const defaultState: OnboardingState = {
  location: defaultLocation,
  radius: 5,
  business: null, // No default business; entrepreneur chooses in Step 2
  subCategory: null,
  placeStatus: "unsure",
  rentMonthly: 0,
  scaleChoice: "recommended",
  businessAnswers: {},
  capital: 0, // No default capital; entrepreneur enters in Step 5
  targetInvestment: 0,
  otherFunding: 0,
  costOverrides: {},
  feasibility: null, // No pre-generated feasibility report
  analysisResult: null,
  isAnalyzing: false,
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const ONBOARDING_STORAGE_KEY = "gramudaan_active_onboarding_v2";

export function clearOnboardingStorage() {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {}
}

function loadPersistedState(): OnboardingState {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Only keep persisted state if the entrepreneur actually selected a business
      if (parsed && typeof parsed === "object" && parsed.business) {
        return {
          ...defaultState,
          ...parsed,
          isAnalyzing: false,
        };
      }
    }
  } catch (err) {
    console.warn("[OnboardingContext] Error loading cached state:", err);
  }
  return defaultState;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(loadPersistedState);

  // Automatically persist meaningful state changes to localStorage
  useEffect(() => {
    try {
      if (state.business || state.location || state.feasibility || state.analysisResult) {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
          location: state.location,
          business: state.business,
          subCategory: state.subCategory,
          capital: state.capital,
          targetInvestment: state.targetInvestment,
          otherFunding: state.otherFunding,
          radius: state.radius,
          placeStatus: state.placeStatus,
          rentMonthly: state.rentMonthly,
          scaleChoice: state.scaleChoice,
          businessAnswers: state.businessAnswers,
          costOverrides: state.costOverrides,
          feasibility: state.feasibility,
          analysisResult: state.analysisResult,
        }));
      }
    } catch (err) {
      console.warn("[OnboardingContext] Error persisting state:", err);
    }
  }, [state]);

  useEffect(() => {
    if (state.location && state.business && !state.analysisResult) {
      buildCanonicalAnalysisResult({
        location: state.location,
        business: state.business,
        subCategory: state.subCategory,
        radiusKm: state.radius,
        capital: state.capital,
        placeStatus: state.placeStatus,
        rentMonthly: state.rentMonthly,
        scaleChoice: state.scaleChoice,
      })
        .then((res) => {
          setState((s) => ({ ...s, analysisResult: res }));
        })
        .catch(console.error);
    }
  }, [state.location, state.business, state.subCategory, state.radius, state.capital, state.placeStatus, state.rentMonthly, state.scaleChoice, state.analysisResult]);

  const computeFeasibilityForState = useCallback((s: OnboardingState): FeasibilityData | null => {
    // Keep feasibility null until the entrepreneur completes onboarding and runs full analysis
    if (!s.location || !s.business || !s.feasibility) return null;
    return generateFeasibility(s.business.id, s.capital || 50000, s.location.id, s.radius, {
      subCategoryId: s.subCategory?.id,
      placeStatus: s.placeStatus,
      rentMonthly: s.rentMonthly,
      scaleChoice: s.scaleChoice,
      businessAnswers: s.businessAnswers,
    });
  }, []);

  const setLocation = (location: Location | null) =>
    setState((s) => {
      const next = { ...s, location, analysisResult: null };
      return { ...next, feasibility: computeFeasibilityForState(next) };
    });
  const setRadius = (radius: number) =>
    setState((s) => {
      const next = { ...s, radius, analysisResult: null };
      return { ...next, feasibility: computeFeasibilityForState(next) };
    });
  const setBusiness = (business: BusinessCategory | null) =>
    setState((s) => {
      const next = { ...s, business, subCategory: null, costOverrides: {}, analysisResult: null };
      return { ...next, feasibility: computeFeasibilityForState(next) };
    });
  const setSubCategory = (subCategory: BusinessSubCategory | null) =>
    setState((s) => {
      const next = { ...s, subCategory, costOverrides: {}, analysisResult: null };
      return { ...next, feasibility: computeFeasibilityForState(next) };
    });
  const setPlaceStatus = (placeStatus: PlaceStatus) =>
    setState((s) => {
      const next = { ...s, placeStatus, analysisResult: null };
      return { ...next, feasibility: computeFeasibilityForState(next) };
    });
  const setRentMonthly = (rentMonthly: number) =>
    setState((s) => {
      const next = { ...s, rentMonthly, analysisResult: null };
      return { ...next, feasibility: computeFeasibilityForState(next) };
    });
  const setScaleChoice = (scaleChoice: ScaleChoice) =>
    setState((s) => {
      const next = { ...s, scaleChoice, analysisResult: null };
      return { ...next, feasibility: computeFeasibilityForState(next) };
    });
  const setBusinessAnswer = (id: string, value: string) =>
    setState((s) => {
      const next = {
        ...s,
        businessAnswers: { ...s.businessAnswers, [id]: value },
        analysisResult: null,
      };
      return { ...next, feasibility: computeFeasibilityForState(next) };
    });
  const setCapital = (capital: number) =>
    setState((s) => {
      const next = { ...s, capital, targetInvestment: capital, analysisResult: null };
      return { ...next, feasibility: computeFeasibilityForState(next) };
    });
  const setTargetInvestment = (targetInvestment: number) =>
    setState((s) => ({ ...s, targetInvestment }));
  const setOtherFunding = (otherFunding: number) =>
    setState((s) => {
      const next = { ...s, otherFunding, analysisResult: null };
      return { ...next, feasibility: computeFeasibilityForState(next) };
    });
  const setCostOverride = (id: string, value: number) =>
    setState((s) => {
      const next = {
        ...s,
        costOverrides: {
          ...s.costOverrides,
          [id]: Math.max(0, Number.isFinite(value) ? Math.round(value) : 0),
        },
        analysisResult: null,
      };
      return { ...next, feasibility: computeFeasibilityForState(next) };
    });
  const resetCostOverrides = () =>
    setState((s) => {
      const next = { ...s, costOverrides: {}, analysisResult: null };
      return { ...next, feasibility: computeFeasibilityForState(next) };
    });
  const setFeasibility = (feasibility: FeasibilityData | null) =>
    setState((s) => ({ ...s, feasibility }));
  const setAnalysisResult = (analysisResult: CanonicalAnalysisResult | null) =>
    setState((s) => ({ ...s, analysisResult }));
  const setIsAnalyzing = (isAnalyzing: boolean) =>
    setState((s) => ({ ...s, isAnalyzing }));
  const reset = () => setState(defaultState);

  const runFullAnalysis = useCallback(async (convexClient?: any): Promise<CanonicalAnalysisResult | null> => {
    if (!state.location || !state.business) return null;
    setIsAnalyzing(true);
    try {
      const feasibility = generateFeasibility(state.business.id, state.capital || 50000, state.location.id, state.radius, {
        subCategoryId: state.subCategory?.id,
        placeStatus: state.placeStatus,
        rentMonthly: state.rentMonthly,
        scaleChoice: state.scaleChoice,
        businessAnswers: state.businessAnswers,
      });
      
      const canonicalRes = await buildCanonicalAnalysisResult({
        location: state.location,
        business: state.business,
        subCategory: state.subCategory,
        radiusKm: state.radius,
        capital: state.capital || 50000,
        placeStatus: state.placeStatus,
        rentMonthly: state.rentMonthly,
        scaleChoice: state.scaleChoice,
        convexClient,
      });

      setState((s) => ({
        ...s,
        feasibility,
        analysisResult: canonicalRes,
        isAnalyzing: false,
      }));

      return canonicalRes;
    } catch (err) {
      console.error("[OnboardingContext] Error building analysis result:", err);
      setIsAnalyzing(false);
      return null;
    }
  }, [state.location, state.business, state.subCategory, state.radius, state.capital, state.placeStatus, state.rentMonthly, state.scaleChoice, state.businessAnswers]);

  const loadDemo = useCallback((demo: DemoScenario) => {
    const loc = locations.find((l) => l.id === demo.locationId) || locations[0];
    const biz = businessCategories.find((b) => b.id === demo.businessId) || businessCategories[0];
    const feasibility = generateFeasibility(demo.businessId, demo.capital, demo.locationId);
    setState({
      ...defaultState,
      location: loc,
      business: biz,
      capital: demo.capital,
      feasibility,
    });
  }, []);

  const loadSavedReport = useCallback((report: any) => {
    if (!report) return;
    const biz = businessCategories.find((b) => b.id === report.business_id) || {
      id: report.business_id || "dairy",
      name: report.business_name || "Business",
      category: "agriculture",
      icon: "🏪",
    } as any;

    const loc = locations.find((l) => l.id === report.location_id) || {
      id: report.location_id || "custom-loc",
      name: (report.location_name || "Location").split(",")[0]?.trim(),
      district: (report.location_name || "District").split(",")[1]?.trim() || "District",
      state: "Uttar Pradesh",
      population: 25000,
      households: 4200,
      lat: 28.3,
      lng: 79.8,
      pincode: "262201",
    } as any;

    const subCat = biz.subCategories?.find((s: any) => s.id === report.sub_category_id) || null;
    const feasibility = report.feasibility_data || generateFeasibility(biz.id, report.capital || 100000, loc.id, 5);

    setState((s) => ({
      ...s,
      business: biz,
      location: loc,
      subCategory: subCat,
      capital: report.capital || 100000,
      targetInvestment: report.target_investment || report.capital || 100000,
      otherFunding: report.other_funding || 0,
      placeStatus: report.place_status || "unsure",
      rentMonthly: report.rent_monthly || 0,
      scaleChoice: report.scale_choice || "recommended",
      feasibility,
      isAnalyzing: false,
    }));
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        ...state,
        setLocation,
        setRadius,
        setBusiness,
        setSubCategory,
        setPlaceStatus,
        setRentMonthly,
        setScaleChoice,
        setBusinessAnswer,
        setCapital,
        setTargetInvestment,
        setOtherFunding,
        setCostOverride,
        resetCostOverrides,
        setFeasibility,
        setAnalysisResult,
        setIsAnalyzing,
        runFullAnalysis,
        reset,
        loadDemo,
        loadSavedReport,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

const defaultContextValue: OnboardingContextType = {
  ...defaultState,
  setLocation: () => {},
  setRadius: () => {},
  setBusiness: () => {},
  setSubCategory: () => {},
  setPlaceStatus: () => {},
  setRentMonthly: () => {},
  setScaleChoice: () => {},
  setBusinessAnswer: () => {},
  setCapital: () => {},
  setTargetInvestment: () => {},
  setOtherFunding: () => {},
  setCostOverride: () => {},
  resetCostOverrides: () => {},
  setFeasibility: () => {},
  setAnalysisResult: () => {},
  setIsAnalyzing: () => {},
  runFullAnalysis: async () => null,
  reset: () => {},
  loadDemo: () => {},
  loadSavedReport: () => {},
};

export function useOnboarding() {
  return useContext(OnboardingContext) ?? defaultContextValue;
}

