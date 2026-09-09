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
}

const defaultLocation = locations[0]; // Bisalpur, Pilibhit
const defaultBusiness = businessCategories[0]; // Dairy / डेयरी
const defaultCapital = 200000;
const defaultFeasibility = generateFeasibility(defaultBusiness.id, defaultCapital, defaultLocation.id, 5);

const defaultState: OnboardingState = {
  location: defaultLocation,
  radius: 5,
  business: defaultBusiness,
  subCategory: null,
  placeStatus: "unsure",
  rentMonthly: 0,
  scaleChoice: "recommended",
  businessAnswers: {},
  capital: defaultCapital,
  targetInvestment: defaultCapital,
  otherFunding: 0,
  costOverrides: {},
  feasibility: defaultFeasibility,
  analysisResult: null,
  isAnalyzing: false,
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultState);

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

  const setLocation = (location: Location | null) =>
    setState((s) => ({ ...s, location }));
  const setRadius = (radius: number) =>
    setState((s) => ({ ...s, radius }));
  const setBusiness = (business: BusinessCategory | null) =>
    setState((s) => ({ ...s, business, subCategory: null }));
  const setSubCategory = (subCategory: BusinessSubCategory | null) =>
    setState((s) => ({ ...s, subCategory }));
  const setPlaceStatus = (placeStatus: PlaceStatus) =>
    setState((s) => ({ ...s, placeStatus }));
  const setRentMonthly = (rentMonthly: number) =>
    setState((s) => ({ ...s, rentMonthly }));
  const setScaleChoice = (scaleChoice: ScaleChoice) =>
    setState((s) => ({ ...s, scaleChoice }));
  const setBusinessAnswer = (id: string, value: string) =>
    setState((s) => ({ ...s, businessAnswers: { ...s.businessAnswers, [id]: value } }));
  const setCapital = (capital: number) =>
    setState((s) => ({ ...s, capital }));
  const setTargetInvestment = (targetInvestment: number) =>
    setState((s) => ({ ...s, targetInvestment }));
  const setOtherFunding = (otherFunding: number) =>
    setState((s) => ({ ...s, otherFunding }));
  const setCostOverride = (id: string, value: number) =>
    setState((s) => ({
      ...s,
      costOverrides: {
        ...s.costOverrides,
        [id]: Math.max(0, Number.isFinite(value) ? Math.round(value) : 0),
      },
    }));
  const resetCostOverrides = () =>
    setState((s) => ({ ...s, costOverrides: {} }));
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
};

export function useOnboarding() {
  return useContext(OnboardingContext) ?? defaultContextValue;
}

