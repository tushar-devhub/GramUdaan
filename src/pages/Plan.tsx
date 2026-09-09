import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useOnboarding } from "@/lib/onboarding-context";
import { useLanguage } from "@/i18n/LanguageContext";
import { buildAdvisoryPlan, simulateEmi, type AdvisoryPlan } from "@/engine/plan";
import { generateFeasibility } from "@/data/feasibility";
import { formatIndianCurrency, getVerdictColor, getVerdictIcon } from "@/data/assessment";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { ProgressStepper } from "@/components/ui/ProgressStepper";
import {
  initLocationService, searchLocations, searchPinOnline, suggestLocations, curatedSuggestions, registerHit,
  getLoadState, type LocationHit, type GeoLoadState,
} from "@/services/geo/locationService";
import { isPinQuery, PinLookupError } from "@/services/geo/pinApi";
import { businessCategories, type BusinessCategory } from "@/data/businesses";
import {
  getSubCategoriesForBusiness, getSubCategory,
  PLACE_STATUS_OPTIONS, SCALE_OPTIONS,
  type BusinessSubCategory, type PlaceStatus, type ScaleChoice,
} from "@/data/businessConfig";
import { matchSchemesForProfileSource } from "@/engine/schemeMatching";
import {
  MapPin, Store, Building2, IndianRupee, Landmark, TrendingUp, ShieldAlert, Award,
  ArrowLeft, ArrowRight, Check, X, Loader2, Search, Database, AlertCircle, RotateCcw,
  Info, RefreshCw, Sparkles, Users, Target, Lightbulb, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine, Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const JOURNEY = [
  { id: 0, label: "Location", key: "plan.stepLocation" as const },
  { id: 1, label: "Business", key: "plan.stepBusiness" as const },
  { id: 2, label: "Resources", key: "plan.stepResources" as const },
  { id: 3, label: "Capital & Cost", key: "plan.stepCapital" as const },
  { id: 4, label: "Funding", key: "plan.stepFunding" as const },
  { id: 5, label: "Profitability", key: "plan.stepProfitability" as const },
  { id: 6, label: "Risk & Alternatives", key: "plan.stepRisk" as const },
  { id: 7, label: "Recommendation", key: "plan.stepRecommendation" as const },
] as const;

export default function Plan() {
  const { t } = useLanguage();
  const ob = useOnboarding();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [loanSim, setLoanSim] = useState<{ amount: number; rate: number; tenure: number } | null>(null);
  const [whatIf, setWhatIf] = useState<null | {
    userCapital: number; otherFunding: number; revenueFactor: number; expenseFactor: number;
  }>(null);

  const ctx = {
    subCategoryId: ob.subCategory?.id ?? null,
    placeStatus: ob.placeStatus,
    rentMonthly: ob.rentMonthly,
    scaleChoice: ob.scaleChoice,
  };

  /* ── Single source of truth: one plan derived from shared state; every section reads it ── */
  const plan: AdvisoryPlan = useMemo(
    () => buildAdvisoryPlan({
      businessId: ob.business?.id ?? "other",
      subCategoryId: ctx.subCategoryId,
      placeStatus: ctx.placeStatus,
      rentMonthly: ctx.rentMonthly,
      scaleChoice: ctx.scaleChoice,
      userCapital: ob.capital,
      targetInvestment: ob.targetInvestment,
      otherFunding: ob.otherFunding,
      overrides: ob.costOverrides,
      competitionDensity: ob.feasibility?.competition?.density,
    }),
    [ob.business?.id, ctx.subCategoryId, ctx.placeStatus, ctx.rentMonthly, ctx.scaleChoice, ob.capital, ob.targetInvestment, ob.otherFunding, ob.feasibility],
  );

  const schemeResult = useMemo(() => {
    if (!ob.business || !ob.location) return null;
    try {
      return matchSchemesForProfileSource({
        businessId: ob.business.id,
        businessName: ob.business.name,
        businessCategory: ob.business.category,
        state: ob.location.state,
        district: ob.location.district,
        contribution: plan.funding.userCapital + plan.funding.otherFunding,
        projectCost: plan.cost.totalProjectCost,
        fundingRequirement: plan.funding.loanRequired,
      });
    } catch {
      return null;
    }
  }, [ob.business, ob.location, plan.cost.totalProjectCost, plan.funding.userCapital, plan.funding.otherFunding, plan.funding.loanRequired]);

  const canProceed = [
    ob.location !== null,
    ob.business !== null,
    true,
    ob.capital > 0,
    true, true, true, true,
  ][step];

  const goNext = () => {
    const next = Math.min(7, step + 1);
    setStep(next);
    setMaxStep((m) => Math.max(m, next));
    window.scrollTo({ top: 0 });
  };
  const goBack = () => {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0 });
  };
  const goTo = (i: number) => {
    setStep(i);
    setMaxStep((m) => Math.max(m, i));
    window.scrollTo({ top: 0 });
  };

  const loanSimDefaults = {
    amount: plan.funding.loanRequired,
    rate: plan.loan.interestRate,
    tenure: plan.loan.tenureYears,
  };
  const sim = useMemo(
    () => (loanSim && loanSim.amount > 0 ? simulateEmi(loanSim.amount, loanSim.rate, loanSim.tenure) : null),
    [loanSim],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-6 sm:py-8">
        {/* Journey header */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">GramUdaan Plan</p>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {t("plan.stepOf").replace("{current}", String(step + 1)).replace("{total}", "8").replace("{label}", t(JOURNEY[step].key))}
              </h1>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> {t("plan.exit")}
          </button>
          </div>
          <ProgressStepper steps={JOURNEY.map((s) => ({ id: s.id, label: t(s.key) }))} currentStep={step} />
        </div>

        {/* ── STEP 0: Location & Profile ── */}
        {step === 0 && (
          <StepLocation ob={ob} onNext={goNext} />
        )}

        {/* ── STEP 1: Business ── */}
        {step === 1 && (
          <StepBusiness ob={ob} onNext={goNext} onBack={goBack} />
        )}

        {/* ── STEP 2: Resources & Local Market ── */}
        {step === 2 && (
          <StepResources ob={ob} plan={plan} onNext={goNext} onBack={goBack} />
        )}

        {/* ── STEP 3: Capital & Total Cost ── */}
        {step === 3 && (
          <StepCapital
            ob={ob}
            plan={plan}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {/* ── STEP 4: Funding & Loan ── */}
        {step === 4 && (
          <StepFunding
            ob={ob}
            plan={plan}
            schemeResult={schemeResult}
            sim={sim}
            loanSim={loanSim}
            setLoanSim={setLoanSim}
            loanSimDefaults={loanSimDefaults}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {/* ── STEP 5: Profitability & Projections ── */}
        {step === 5 && (
          <StepProfitability ob={ob} plan={plan} onNext={goNext} onBack={goBack} />
        )}

        {/* ── STEP 6: Risk, Feasibility & Alternatives ── */}
        {step === 6 && (
          <StepRisk ob={ob} plan={plan} onNext={goNext} onBack={goBack} />
        )}

        {/* ── STEP 7: Final Recommendation ── */}
        {step === 7 && (
          <StepRecommendation ob={ob} plan={plan} schemeResult={schemeResult} onRestart={() => { ob.reset(); goTo(0); }} />
        )}

        {/* Global nav (hidden on final step which has its own actions) */}
        {step < 7 && (
          <div className="sticky bottom-0 mt-8 border-t border-border/60 bg-background/95 backdrop-blur py-3 flex items-center justify-between gap-3">
            <button
              onClick={goBack}
              disabled={step === 0}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold",
                step === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-muted",
              )}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={goNext}
              disabled={!canProceed}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all",
                canProceed ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/* ═════════════════ STEP 0 — LOCATION & PROFILE ═════════════════ */

function StepLocation({ ob, onNext }: { ob: ReturnType<typeof useOnboarding>; onNext: () => void }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<LocationHit[]>([]);
  const [geo, setGeo] = useState<GeoLoadState>(getLoadState());
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinTick, setPinTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const s = getLoadState();
    setGeo(s.status === "ready" ? s : { status: "loading", progress: 0 });
    setHits(curatedSuggestions(8));
    if (s.status === "ready") return;
    initLocationService(
      (pct: number) => { if (!cancelled) setGeo({ status: "loading", progress: pct }); },
      undefined,
      undefined,
    )
      .then(() => { if (!cancelled) setGeo(getLoadState()); })
      .catch(() => { if (!cancelled) setGeo(getLoadState()); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (isPinQuery(q)) return;
    if (!q) {
      setHits(geo.status === "ready" ? suggestLocations(10) : curatedSuggestions(8));
      return;
    }
    if (geo.status !== "ready") {
      setHits(curatedSuggestions(8).filter((h) =>
        `${h.title} ${h.district} ${h.state} ${h.pincode}`.toLowerCase().includes(q.toLowerCase()),
      ));
      return;
    }
    const t = setTimeout(() => setHits(searchLocations(q, 12)), 180);
    return () => clearTimeout(t);
  }, [query, geo.status]);

  useEffect(() => {
    const q = query.trim();
    if (!isPinQuery(q)) { setPinBusy(false); setPinError(null); return; }
    let cancelled = false;
    setPinBusy(true); setPinError(null);
    searchPinOnline(q)
      .then((h) => { if (!cancelled) setHits(h); })
      .catch((err: unknown) => {
        if (cancelled) return;
        setHits([]);
        setPinError(err instanceof PinLookupError && err.kind === "busy"
          ? "Location search is temporarily busy. Please try again."
          : "Unable to search this PIN code right now. Please try again.");
      })
      .finally(() => { if (!cancelled) setPinBusy(false); });
    return () => { cancelled = true; };
  }, [query, pinTick]);

  const { language } = useLanguage();
  const isHi = language === "hi";

  return (
    <div className="animate-fade-in space-y-4">
      <StepHeader
        icon={<MapPin className="h-5 w-5" />}
        title={isHi ? "आप अपना व्यवसाय कहाँ शुरू करना चाहते हैं?" : "Where do you want to start your business?"}
        hint={isHi ? "भारत में किसी भी गाँव, कस्बे या शहर को खोजें — हम उसके आसपास के स्थानीय बाज़ार का विश्लेषण करेंगे।" : "Your location shapes local demand, competition, costs and alternatives."}
      />

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isHi ? "पिन कोड, गाँव, कस्बा या जिला खोजें…" : "Search by PIN code, village, town or district across India…"}
          className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isPinQuery(query.trim()) ? (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Database className="h-3 w-3" /> {isHi ? "ऑनलाइन पिन कोड खोज" : "Online PIN lookup"}
        </p>
      ) : geo.status === "loading" ? (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin text-primary" /> {isHi ? "स्थान सूची लोड हो रही है…" : "Loading location index…"}
        </p>
      ) : geo.status === "error" ? (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-600">
          <AlertCircle className="h-3 w-3" /> {isHi ? "स्थान डेटा अनुपलब्ध — केवल डेमो शहर खोजे जा सकते हैं।" : "Location data unavailable — demo towns are searchable."}
        </p>
      ) : null}

      <div className="max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-border/50">
        {hits.map((hit) => (
          <button
            key={hit.key}
            onClick={() => { registerHit(hit); ob.setLocation(hit.location); setQuery(hit.title); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-muted/50",
              ob.location?.id === hit.key && "bg-primary/5 border-l-2 border-primary",
            )}
          >
            <MapPin className={cn("h-4 w-4", ob.location?.id === hit.key ? "text-primary" : "text-muted-foreground")} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{hit.title}</p>
              <p className="text-xs text-muted-foreground truncate">{hit.subtitle}</p>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">{hit.pincode}</span>
            {ob.location?.id === hit.key && <Check className="h-4 w-4 text-primary" />}
          </button>
        ))}
        {hits.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            {pinBusy ? "Searching this PIN code…" : pinError ? pinError : "No locations found. Try another spelling or PIN."}
          </div>
        )}
      </div>

      {ob.location && (
        <div className="rounded-xl border border-border bg-white p-4 animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold">{ob.location.name}</p>
              <p className="text-xs text-muted-foreground">{ob.location.district}, {ob.location.state} · PIN {ob.location.pincode}</p>
            </div>
            <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
              {ob.location.type}
            </span>
          </div>

          <div className="mt-3">
            <p className="text-xs font-semibold mb-2">Market analysis radius</p>
            <div className="flex gap-2">
              {[5, 10, 15, 25].map((r) => (
                <button key={r} onClick={() => ob.setRadius(r)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold transition-all",
                    ob.radius === r ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40",
                  )}>
                  {r} km
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Estimated market data will be derived for this radius. Population & household figures are regional estimates, not verified counts.
            </p>
          </div>
        </div>
      )}

      <button onClick={onNext} disabled={!ob.location}
        className={cn(
          "w-full rounded-full px-6 py-3 text-sm font-bold transition-all",
          ob.location ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed",
        )}>
        Continue to Business <ArrowRight className="inline h-4 w-4 ml-1" />
      </button>
    </div>
  );
}

/* ═════════════════ STEP 1 — BUSINESS ═════════════════ */

function StepBusiness({ ob, onNext, onBack }: { ob: ReturnType<typeof useOnboarding>; onNext: () => void; onBack: () => void }) {
  const { language, t } = useLanguage();
  const isHi = language === "hi";

  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return businessCategories.filter((b) => b.id !== "other");
    const q = search.toLowerCase();
    return businessCategories.filter(
      (b) => b.id !== "other" && (b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || (b.nameHi && b.nameHi.includes(q))),
    );
  }, [search]);

  return (
    <div className="animate-fade-in space-y-4">
      <StepHeader
        icon={<Store className="h-5 w-5" />}
        title={isHi ? "आप कौन सा व्यवसाय शुरू करना चाहते हैं?" : "Which business are you planning?"}
        hint={isHi ? "आप जो व्यवसाय शुरू करना चाहते हैं, उसकी सही श्रेणी चुनें।" : "Pick a category, then the exact type — it drives every downstream calculation."}
      />

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isHi ? "व्यवसाय खोजें…" : "Search businesses…"}
          className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((biz) => (
          <button key={biz.id} onClick={() => ob.setBusiness(biz)}
            className={cn(
              "flex flex-col items-center rounded-xl border p-4 text-center transition-all",
              ob.business?.id === biz.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-white hover:border-primary/40",
            )}>
            <span className="text-3xl mb-2">{biz.icon}</span>
            <span className="text-sm font-semibold">{isHi ? biz.nameHi : biz.name}</span>
            <span className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{isHi ? (biz.descriptionHi || biz.description) : biz.description}</span>
          </button>
        ))}
      </div>

      {ob.business && (
        <div className="rounded-xl border border-border bg-white p-4 animate-fade-in">
          <p className="text-sm font-bold mb-1">
            {isHi ? "सटीक प्रकार चुनें" : getSubCategoryGroupNameLabel(ob.business.id)}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            {isHi ? "सटीक प्रकार से लागत, कमाई और व्यवहार्यता का अनुमान बदलता है।" : "Exact type changes costs, revenue and feasibility. Select one to continue."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {getSubCategoriesForBusiness(ob.business.id).map((opt) => (
              <button key={opt.id} onClick={() => ob.setSubCategory(opt)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                  ob.subCategory?.id === opt.id ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40",
                )}>
                <span className="text-xl">{opt.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{isHi ? opt.nameHi : opt.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{isHi ? (opt.descriptionHi || opt.description) : opt.description}</p>
                </div>
                {ob.subCategory?.id === opt.id && <Check className="h-4 w-4 text-primary ml-auto" />}
              </button>
            ))}
          </div>

          {ob.subCategory && ob.subCategory.questions.length > 0 && (
            <div className="mt-4 rounded-xl bg-[#F4F8EF] border border-border/60 p-4">
              <p className="text-sm font-bold mb-1">{isHi ? "कुछ छोटे सवाल" : "A few quick questions"}</p>
              <p className="text-xs text-muted-foreground mb-3">{isHi ? "ये आपके प्लान के सटीक अनुमान में मदद करते हैं।" : "These fine-tune the estimate for your plan."}</p>
              <div className="space-y-3">
                {ob.subCategory.questions.map((q) => (
                  <div key={q.id}>
                    <p className="text-sm font-semibold mb-2">{isHi && q.labelHi ? q.labelHi : q.label}</p>
                    {q.options ? (
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((o) => (
                          <button key={o.value} onClick={() => ob.setBusinessAnswer(q.id, o.value)}
                            className={cn(
                              "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                              ob.businessAnswers[q.id] === o.value
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-white text-muted-foreground hover:border-primary/40",
                            )}>
                            {isHi && o.labelHi ? o.labelHi : o.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={ob.businessAnswers[q.id] || ""}
                        onChange={(e) => ob.setBusinessAnswer(q.id, e.target.value)}
                        placeholder={q.placeholder || (isHi && q.labelHi ? q.labelHi : q.label)}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> {isHi ? "पीछे" : "Back"}
        </button>
        <button onClick={onNext} disabled={!ob.business}
          className={cn(
            "flex-1 rounded-full px-6 py-3 text-sm font-bold transition-all",
            ob.business ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed",
          )}>
          {isHi ? "आगे बढ़ें" : "Continue"} <ArrowRight className="inline h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

/* ═════════════════ STEP 2 — RESOURCES & LOCAL MARKET ═════════════════ */

function StepResources({ ob, plan, onNext, onBack }: {
  ob: ReturnType<typeof useOnboarding>; plan: AdvisoryPlan; onNext: () => void; onBack: () => void;
}) {
  const { t } = useLanguage();
  const densityText = ob.feasibility?.competition.density === "high"
    ? t("hyperlocal.densityHigh")
    : ob.feasibility?.competition.density === "medium"
    ? t("hyperlocal.densityMedium")
    : t("hyperlocal.densityLow");

  return (
    <div className="animate-fade-in space-y-4">
      <StepHeader
        icon={<Building2 className="h-5 w-5" />}
        title={t("plan.step2Title")}
        hint={t("plan.step2Hint")}
      />

      {/* Workspace need */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold mb-1">{t("plan.workspaceNeed")}</p>
        <p className="text-xs text-muted-foreground mb-3">
          {ob.subCategory
            ? <>{ob.subCategory.icon} {ob.subCategory.name} typically needs {placeTypeLabel(ob.subCategory.placeType)}.</>
            : "Select a business first — the requirement follows the business type."}
          {" "}{t("plan.workspaceOwnHint")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PLACE_STATUS_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => ob.setPlaceStatus(opt.value)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                ob.placeStatus === opt.value ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40",
              )}>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-[11px] text-muted-foreground">{opt.hint}</p>
              </div>
              {ob.placeStatus === opt.value && <Check className="h-4 w-4 text-primary ml-auto" />}
            </button>
          ))}
        </div>
        {ob.placeStatus === "rent" && (
          <div className="mt-3">
            <p className="text-xs font-semibold mb-1.5">{t("plan.expectedRent")}</p>
            <input
              type="number"
              min={0}
              value={ob.rentMonthly || ""}
              onChange={(e) => ob.setRentMonthly(Math.max(0, Number(e.target.value) || 0))}
              placeholder={t("plan.rentPlaceholder")}
              className="w-full sm:w-64 rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Scale */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold mb-1">{t("plan.startingScale")}</p>
        <p className="text-xs text-muted-foreground mb-3">{t("plan.scaleHint")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SCALE_OPTIONS.map((s) => (
            <button key={s.value} onClick={() => ob.setScaleChoice(s.value)}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                ob.scaleChoice === s.value ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40",
              )}>
              <p className="text-sm font-semibold">{s.label}</p>
              <p className="text-[11px] text-muted-foreground">{s.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Local market context */}
      {ob.feasibility && (
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm font-bold mb-1">{t("plan.localMarket").replace("{location}", ob.location?.name || "")}</p>
          <div className="grid grid-cols-3 gap-2 my-3">
            <MiniStat label={t("plan.households")} value={ob.feasibility.marketReach.households.toLocaleString("en-IN")} />
            <MiniStat label={t("plan.potentialCustomers")} value={ob.feasibility.marketReach.potentialCustomers.toLocaleString("en-IN")} />
            <MiniStat label={t("plan.nearbyVillages")} value={String(ob.feasibility.marketReach.nearbyVillages)} />
          </div>
          <div className={cn(
            "rounded-lg p-3 mb-2",
            ob.feasibility.competition.density === "low" ? "bg-emerald-50 border border-emerald-200"
              : ob.feasibility.competition.density === "medium" ? "bg-amber-50 border border-amber-200"
              : "bg-red-50 border border-red-200",
          )}>
            <p className="text-xs font-bold capitalize">{t("plan.competitionDensity").replace("{density}", densityText)}</p>
            <p className="text-[11px] text-muted-foreground">{ob.feasibility.competition.summary}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ob.feasibility.competition.competitors.slice(0, 4).map((c, i) => (
              <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                {c.name} · {c.distance}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t("plan.liveAvailabilityNote")}
          </p>
        </div>
      )}
      {!ob.feasibility && ob.location && ob.business && (
        <button
          onClick={() => {
            const f = generateFeasibility(ob.business!.id, Math.max(1, ob.capital || 50000), ob.location!.id, ob.radius);
            ob.setFeasibility(f);
          }}
          className="w-full rounded-xl border-2 border-dashed border-primary/40 p-4 text-center hover:bg-primary/5 transition-all"
        >
          <Sparkles className="h-5 w-5 text-primary mx-auto mb-1" />
          <span className="text-sm font-semibold text-primary">{t("plan.runAnalysisPrompt")}</span>
        </button>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> {t("plan.back")}
        </button>
        <button onClick={onNext}
          className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          {t("plan.continueCapital")} <ArrowRight className="inline h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

/* ═════════════════ STEP 3 — CAPITAL & TOTAL COST ═════════════════ */

function StepCapital({ ob, plan, onNext, onBack }: {
  ob: ReturnType<typeof useOnboarding>; plan: AdvisoryPlan; onNext: () => void; onBack: () => void;
}) {
  const { t, language } = useLanguage();
  const isHi = language === "hi";

  const chartComponents = useMemo(() => {
    return plan.cost.components
      .filter((c) => c.amount > 0)
      .map((c) => ({
        ...c,
        displayLabel: isHi ? (c.labelHi || c.label) : c.label,
      }));
  }, [plan.cost.components, isHi]);

  return (
    <div className="animate-fade-in space-y-4">
      <StepHeader
        icon={<IndianRupee className="h-5 w-5" />}
        title={t("plan.step3Title")}
        hint={t("plan.step3Hint")}
      />

      {/* USER_CAPITAL */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold mb-1">{t("plan.userCapitalTitle")}</p>
        <p className="text-xs text-muted-foreground mb-3">{t("plan.userCapitalHiHint")}</p>
        <CurrencyInput value={ob.capital} onChange={ob.setCapital} />
        <div className="flex gap-2 mt-3">
          {[50000, 100000, 200000, 500000].map((v) => (
            <button key={v} onClick={() => ob.setCapital(v)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                ob.capital === v ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40",
              )}>
              {v >= 100000 ? `₹${v / 100000}L` : `₹${v / 1000}K`}
            </button>
          ))}
        </div>
      </div>

      {/* TARGET_INVESTMENT */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold mb-1">{t("plan.targetInvTitle")}</p>
        <p className="text-xs text-muted-foreground mb-3">
          {t("plan.targetInvHint")}
        </p>
        <CurrencyInput value={ob.targetInvestment} onChange={ob.setTargetInvestment} />
        {ob.targetInvestment > 0 && plan.cost.totalProjectCost > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {ob.targetInvestment >= plan.cost.totalProjectCost
              ? t("plan.targetCovers").replace("{cost}", formatIndianCurrency(plan.cost.totalProjectCost))
              : t("plan.targetBelow").replace("{diff}", formatIndianCurrency(plan.cost.totalProjectCost - ob.targetInvestment))}
          </p>
        )}
      </div>

      {/* Setup vs working capital + total */}
      <div className="rounded-xl border-2 border-primary/30 bg-primary/[0.03] p-4">
        <p className="text-sm font-bold mb-3">{t("plan.estTotalProjectCost")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <Metric label={t("plan.initialSetupCost")} value={formatIndianCurrency(plan.cost.setupCost)} />
          <Metric label={t("plan.initialWorkingCapital").replace("{months}", String(plan.cost.workingCapitalMonths))} value={formatIndianCurrency(plan.cost.workingCapital)} />
          <Metric label={t("plan.totalProjectCostMetric")} value={formatIndianCurrency(plan.cost.totalProjectCost)} highlight />
        </div>

        {/* Breakdown chart — actual calculated values */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartComponents} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <YAxis type="category" dataKey="displayLabel" width={130} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <RTooltip formatter={(v: number) => formatIndianCurrency(v)} />
              <Bar dataKey="amount" fill="var(--primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 space-y-1">
          {chartComponents.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{c.displayLabel} <span className="text-[9px] uppercase">({c.source === "benchmark" ? (isHi ? "मानक" : "benchmark") : (isHi ? "इनपुट" : c.source.toLowerCase())})</span></span>
              <span className="font-semibold">{formatIndianCurrency(c.amount)}</span>
            </div>
          ))}
        </div>
        {plan.cost.notes.map((n, i) => (
          <p key={i} className="mt-2 text-[11px] text-muted-foreground">• {n}</p>
        ))}
      </div>

      {/* Capital + other funding vs project cost */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold mb-1">{t("plan.fundingVsCostTitle")}</p>
        <p className="text-xs text-muted-foreground mb-3">{t("plan.fundingVsCostHint")}</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                ...(plan.funding.otherFunding > 0
                  ? [{ name: t("plan.otherFunding"), value: plan.funding.otherFunding }]
                  : []),
                { name: t("plan.yourCapital"), value: plan.funding.userCapital },
                ...(plan.funding.fundingGap > 0
                  ? [{ name: t("plan.fundingGap"), value: plan.funding.fundingGap }]
                  : []),
                { name: t("plan.totalProjectCost"), value: plan.cost.totalProjectCost },
              ]}
              layout="vertical"
            >
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <RTooltip formatter={(v: number) => formatIndianCurrency(v)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
                {([
                  ...(plan.funding.otherFunding > 0
                    ? [{ name: t("plan.otherFunding"), value: plan.funding.otherFunding, fill: "#8b5cf6" }]
                    : []),
                  { name: t("plan.yourCapital"), value: plan.funding.userCapital, fill: "var(--primary)" },
                  ...(plan.funding.fundingGap > 0
                    ? [{ name: t("plan.fundingGap"), value: plan.funding.fundingGap, fill: "#f59e0b" }]
                    : []),
                  { name: t("plan.totalProjectCost"), value: plan.cost.totalProjectCost, fill: "#94a3b8" },
                ]).map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("plan.coverage")}</span>
          <span className="font-bold">
            {plan.cost.totalProjectCost > 0 ? Math.round((plan.funding.totalAvailableFunding / plan.cost.totalProjectCost) * 100) : 100}%
            <span className="text-xs text-muted-foreground font-medium"> {t("plan.coverageHint")}</span>
          </span>
        </div>
        {plan.funding.fundingGap > 0 && (
          <p className="mt-1 text-xs text-amber-700">
            {t("plan.fundingGapPrompt").replace("{gap}", formatIndianCurrency(plan.funding.fundingGap))}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> {t("plan.back")}
        </button>
        <button onClick={onNext} disabled={ob.capital <= 0}
          className={cn(
            "flex-1 rounded-full px-6 py-3 text-sm font-bold transition-all",
            ob.capital > 0 ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed",
          )}>
          {t("plan.continueFunding")} <ArrowRight className="inline h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

/* ═════════════════ STEP 4 — FUNDING & LOAN ═════════════════ */

function StepFunding({
  ob, plan, schemeResult, sim, loanSim, setLoanSim, loanSimDefaults, onNext, onBack,
}: {
  ob: ReturnType<typeof useOnboarding>; plan: AdvisoryPlan;
  schemeResult: ReturnType<typeof matchSchemesForProfileSource> | null;
  sim: ReturnType<typeof simulateEmi> | null;
  loanSim: { amount: number; rate: number; tenure: number } | null;
  setLoanSim: (v: { amount: number; rate: number; tenure: number } | null) => void;
  loanSimDefaults: { amount: number; rate: number; tenure: number };
  onNext: () => void; onBack: () => void;
}) {
  const { language } = useLanguage();
  const isHi = language === "hi";

  const fundingData = useMemo(() => [
    { name: isHi ? "उपलब्ध राशि" : "Available", value: plan.funding.totalAvailableFunding },
    { name: isHi ? "फंडिंग अंतर" : "Gap", value: plan.funding.fundingGap },
    { name: isHi ? "कुल लागत" : "Total cost", value: plan.cost.totalProjectCost },
  ], [isHi, plan.funding.totalAvailableFunding, plan.funding.fundingGap, plan.cost.totalProjectCost]);

  return (
    <div className="animate-fade-in space-y-4">
      <StepHeader
        icon={<Landmark className="h-5 w-5" />}
        title={isHi ? "आपको कितनी राशि की व्यवस्था या ऋण लेने की आवश्यकता है?" : "How much do you need to arrange or borrow?"}
        hint={isHi ? "उपलब्ध फंडिंग → फंडिंग अंतर → आवश्यक बनाम अनुशंसित ऋण → ईएमआई → पुनर्भुगतान दबाव।" : "Available funding → funding gap → required vs recommended loan → EMI → repayment pressure."}
      />

      {/* Other funding */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold mb-1">{isHi ? "अन्य फंडिंग — परिवार, साझेदार, अनुदान, बचत" : "Other funding — family, partner, grants, savings"}</p>
        <p className="text-xs text-muted-foreground mb-3">{isHi ? "आपकी स्वयं की पूंजी के अतिरिक्त कोई भी वैध राशि। यह सीधे फंडिंग अंतर को कम करती है।" : "Any legitimate money beyond your own capital. Reduces the funding gap directly."}</p>
        <CurrencyInput value={ob.otherFunding} onChange={ob.setOtherFunding} />
      </div>

      {/* Funding chain */}
      <div className="rounded-xl border-2 border-primary/30 bg-primary/[0.03] p-4">
        <p className="text-sm font-bold mb-3">{isHi ? "फंडिंग की स्थिति" : "Funding picture"}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <Metric label={isHi ? "कुल परियोजना लागत" : "Total project cost"} value={formatIndianCurrency(plan.funding.totalProjectCost)} />
          <Metric label={isHi ? "आपकी पूंजी" : "Your capital"} value={formatIndianCurrency(plan.funding.userCapital)} />
          <Metric label={isHi ? "अन्य फंडिंग" : "Other funding"} value={formatIndianCurrency(plan.funding.otherFunding)} />
          <Metric label={isHi ? "कुल उपलब्ध फंडिंग" : "Total available funding"} value={formatIndianCurrency(plan.funding.totalAvailableFunding)} />
          <Metric label={isHi ? "फंडिंग अंतर" : "FUNDING GAP"} value={formatIndianCurrency(plan.funding.fundingGap)} highlight />
          <Metric label={isHi ? "अनुमानित ऋण आवश्यकता" : "Estimated loan requirement"} value={formatIndianCurrency(plan.funding.loanRequired)} highlight />
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={fundingData}
              layout="vertical"
            >
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <RTooltip formatter={(v: number) => formatIndianCurrency(v)} />
              <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Required vs recommended */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold mb-1">{isHi ? "आवश्यक ऋण बनाम अनुशंसित ऋण" : "Required loan vs recommended borrowing"}</p>
        <p className="text-xs text-muted-foreground mb-3">{plan.funding.recommendationNote}</p>
        <div className="grid grid-cols-2 gap-3">
          <Metric label={isHi ? "आवश्यक (पूरा अंतर भरता है)" : "Required (fills the whole gap)"} value={formatIndianCurrency(plan.funding.loanRequired)} />
          <Metric label={isHi ? "अनुशंसित (1 माह का बफ़र रखता है)" : "Recommended (keeps ~1 month ops buffer)"} value={formatIndianCurrency(plan.funding.recommendedLoan)} highlight />
        </div>
      </div>

      {/* Loan simulator */}
      {plan.funding.loanRequired > 0 && (
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold">{isHi ? "ऋण सिम्युलेटर — सभी मान अनुमानित हैं" : "Loan simulator — all values are estimates"}</p>
            {loanSim && (
              <button onClick={() => setLoanSim(null)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                <RotateCcw className="h-3 w-3" /> {isHi ? "अनुमान पर रीसेट करें" : "Reset to estimate"}
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {isHi ? "विभिन्न राशि, ब्याज दर और अवधि आज़माएं। बैंक अंतिम शर्तें तय करते हैं।" : "Try different amounts, interest rates and tenures. Nothing is guaranteed — banks decide final terms."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">{isHi ? "ऋण राशि (₹)" : "Loan amount (₹)"}</label>
              <input type="number" min={0} value={loanSim?.amount ?? loanSimDefaults.amount}
                onChange={(e) => setLoanSim({
                  amount: Math.max(0, Number(e.target.value) || 0),
                  rate: loanSim?.rate ?? loanSimDefaults.rate,
                  tenure: loanSim?.tenure ?? loanSimDefaults.tenure,
                })}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">{isHi ? "ब्याज दर (%/वर्ष)" : "Interest rate (%/yr)"}</label>
              <input type="number" min={0} max={30} step={0.5} value={loanSim?.rate ?? loanSimDefaults.rate}
                onChange={(e) => setLoanSim({
                  amount: loanSim?.amount ?? loanSimDefaults.amount,
                  rate: Math.max(0, Number(e.target.value) || 0),
                  tenure: loanSim?.tenure ?? loanSimDefaults.tenure,
                })}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">{isHi ? "अवधि (वर्ष)" : "Tenure (years)"}</label>
              <input type="number" min={1} max={15} value={loanSim?.tenure ?? loanSimDefaults.tenure}
                onChange={(e) => setLoanSim({
                  amount: loanSim?.amount ?? loanSimDefaults.amount,
                  rate: loanSim?.rate ?? loanSimDefaults.rate,
                  tenure: Math.max(1, Number(e.target.value) || 1),
                })}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
            </div>
          </div>
          {sim && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Metric label={isHi ? "अनुमानित ईएमआई" : "Estimated EMI"} value={formatIndianCurrency(sim.emi)} highlight />
              <Metric label={isHi ? "कुल ब्याज" : "Total interest"} value={formatIndianCurrency(sim.totalInterest)} />
              <Metric label={isHi ? "कुल पुनर्भुगतान" : "Total repayment"} value={formatIndianCurrency(sim.totalRepayment)} />
            </div>
          )}
        </div>
      )}

      {/* EMI stress test */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold mb-1">{isHi ? "ईएमआई तनाव परीक्षण" : "EMI stress test"}</p>
        <div className={cn(
          "rounded-lg p-3 mb-2",
          plan.emiStress.level === "low" ? "bg-emerald-50 border border-emerald-200"
            : plan.emiStress.level === "medium" ? "bg-amber-50 border border-amber-200"
            : "bg-red-50 border border-red-200",
        )}>
          <p className="text-sm font-bold">
            {stressIcon(plan.emiStress.level)} {isHi ? (plan.emiStress.level === "low" ? "कम तनाव (सुरक्षित)" : plan.emiStress.level === "medium" ? "मध्यम तनाव" : "उच्च तनाव") : plan.emiStress.label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{plan.emiStress.explanation}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Metric label={isHi ? "परिचालन मुनाफ़ा" : "Operating profit"} value={formatIndianCurrency(plan.emiStress.operatingProfit)} />
          <Metric label={isHi ? "अनुमानित ईएमआई" : "Estimated EMI"} value={formatIndianCurrency(plan.emiStress.emi)} />
          <Metric label={isHi ? "ईएमआई / मुनाफ़ा अनुपात" : "EMI / profit"} value={plan.emiStress.ratio !== null ? `${Math.round(plan.emiStress.ratio * 100)}%` : "—"} />
        </div>
      </div>

      {/* Scheme matching */}
      {schemeResult && schemeResult.matches.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm font-bold mb-1">{isHi ? "प्रासंगिक सरकारी एवं वित्तीय योजनाएं" : "Financing options that may be relevant"}</p>
          <p className="text-xs text-muted-foreground mb-3">
            {isHi ? "आपके व्यवसाय, स्थान और आवश्यकता के आधार पर प्रारंभिक मिलान। आधिकारिक स्रोत से पुष्टि करें।" : "Preliminary matches based on your business, location and funding need. Eligibility is never guaranteed — verify with the official source."}
          </p>
          <div className="space-y-2">
            {schemeResult.matches.slice(0, 3).map((m) => (
              <div key={m.scheme.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold">{m.scheme.name}</p>
                  <span className={cn(
                    "rounded-full border px-2 py-0.5 text-[9px] font-bold",
                    m.level === "high" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : m.level === "possible" ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-muted text-muted-foreground border-border",
                  )}>
                    {m.level === "high" ? (isHi ? "उच्च मिलान" : "HIGH MATCH") : m.level === "possible" ? (isHi ? "संभावित" : "POSSIBLE") : (isHi ? "सामान्य" : "LOW")}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{m.scheme.shortDescription}</p>
                {m.reasons[0] && <p className="text-[11px] text-emerald-700 mt-1">✓ {m.reasons[0].text}</p>}
                {m.gaps[0] && <p className="text-[11px] text-amber-700 mt-0.5">≈ {m.gaps[0].text}</p>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">{schemeResult.disclaimer}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> {isHi ? "पीछे" : "Back"}
        </button>
        <button onClick={onNext}
          className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          {isHi ? "मुनाफ़ा विश्लेषण पर आगे बढ़ें" : "Continue to Profitability"} <ArrowRight className="inline h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

/* ═════════════════ STEP 5 — PROFITABILITY & PROJECTIONS ═════════════════ */

function StepProfitability({ ob, plan, onNext, onBack }: {
  ob: ReturnType<typeof useOnboarding>; plan: AdvisoryPlan; onNext: () => void; onBack: () => void;
}) {
  const { language } = useLanguage();
  const isHi = language === "hi";

  const revKey = isHi ? "बिक्री" : "Revenue";
  const expKey = isHi ? "खर्च" : "Expenses";
  const profKey = isHi ? "मुनाफ़ा" : "Profit";

  const projectionData = plan.projection.map((p) => ({
    label: isHi ? p.label.replace("M", "माह ") : p.label,
    [revKey]: p.revenue,
    [expKey]: p.expenses,
    [profKey]: p.profit,
  }));

  return (
    <div className="animate-fade-in space-y-4">
      <StepHeader
        icon={<TrendingUp className="h-5 w-5" />}
        title={isHi ? "आप कितना कमा सकते हैं, खर्च कर सकते हैं और बचा सकते हैं?" : "What can you earn, spend, and keep?"}
        hint={isHi ? "बिक्री → खर्च → परिचालन मुनाफ़ा → ईएमआई → ईएमआई के बाद नकद → 12 महीने का अनुमान → ब्रेक-ईवन" : "Revenue → expenses → operating profit → EMI → cash after EMI → 12-month projection → break-even."}
      />

      {/* Revenue & expenses */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric label={isHi ? "मासिक बिक्री (अनुमानित)" : "Monthly revenue (est.)"} value={formatIndianCurrency(plan.operating.monthlyRevenue)} />
        <Metric label={isHi ? "स्थिर खर्च" : "Fixed expenses"} value={formatIndianCurrency(plan.operating.monthlyFixedCosts)} />
        <Metric label={isHi ? "परिवर्तनशील खर्च" : "Variable expenses"} value={formatIndianCurrency(plan.operating.monthlyVariableCosts)} />
        <Metric label={isHi ? "कुल खर्च" : "Total expenses"} value={formatIndianCurrency(plan.operating.monthlyExpenses)} />
      </div>

      {/* Profit chain */}
      <div className="rounded-xl border-2 border-primary/30 bg-primary/[0.03] p-4">
        <p className="text-sm font-bold mb-3">{isHi ? "मासिक मुनाफ़ा श्रृंखला" : "Monthly profit chain"}</p>
        <div className="space-y-2">
          <FlowRow label={isHi ? "मासिक बिक्री" : "Monthly revenue"} value={formatIndianCurrency(plan.operating.monthlyRevenue)} tone="pos" />
          <FlowRow label={isHi ? "− परिचालन खर्च" : "− Operating expenses"} value={formatIndianCurrency(plan.operating.monthlyExpenses)} tone="neg" />
          <FlowRow label={isHi ? "= परिचालन मुनाफ़ा" : "= Operating profit"} value={formatIndianCurrency(plan.operating.operatingProfit)} tone="neutral" bold />
          <FlowRow label={isHi ? "− अनुमानित ईएमआई" : "− Estimated EMI"} value={formatIndianCurrency(plan.emiStress.emi)} tone="neg" />
          <FlowRow label={isHi ? "= ईएमआई के बाद उपलब्ध नकद" : "= Cash available after EMI"} value={formatIndianCurrency(plan.profitAfterEmi)} tone={plan.profitAfterEmi >= 0 ? "pos" : "neg"} bold />
        </div>
        {plan.cashFlowWarning && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-xs font-bold text-red-700">{isHi ? "⚠️ नकदी प्रवाह चेतावनी" : "⚠️ Cash-flow warning"}</p>
            <p className="text-xs text-red-600 mt-0.5">{plan.cashFlowWarning}</p>
          </div>
        )}
      </div>

      {/* 12-month projection chart */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold mb-1">{isHi ? "12 महीने का वित्तीय अनुमान" : "12-month projection"}</p>
        <p className="text-xs text-muted-foreground mb-3">
          {isHi ? "जैसे-जैसे ग्राहक जुड़ते हैं, बिक्री बढ़ती है। सभी मान अनुमानित हैं।" : `Revenue ramps up over ~${plan.projection.length > 0 ? plan.projection[0].label : "M1"}–M${plan.projection.length} as customers build. All values are estimates.`}
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <YAxis tickFormatter={compact} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <RTooltip formatter={(v: number) => formatIndianCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey={revKey} stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey={expKey} stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey={profKey} stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Break-even */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold mb-1">{isHi ? "ब्रेक-ईवन विश्लेषण" : "Break-even"}</p>
        <p className="text-xs text-muted-foreground mb-3">{plan.breakEven.explanation}</p>
        <div className="grid grid-cols-3 gap-2">
          <Metric
            label={isHi ? "परिचालन ब्रेक-ईवन" : "Operating break-even"}
            value={plan.breakEven.operatingBreakEvenMonth ? (isHi ? `~माह ${plan.breakEven.operatingBreakEvenMonth}` : `~Month ${plan.breakEven.operatingBreakEvenMonth}`) : (isHi ? "12+ महीने" : "12+ months")}
          />
          <Metric label={isHi ? "ब्रेक-ईवन बिक्री / माह" : "Break-even sales / month"} value={formatIndianCurrency(plan.breakEven.operatingBreakEvenSales)} />
          <Metric
            label={isHi ? "पूंजी वापसी (पेबैक)" : "Investment payback"}
            value={plan.breakEven.investmentPaybackMonths ? (isHi ? `~${plan.breakEven.investmentPaybackMonths} महीने` : `~${plan.breakEven.investmentPaybackMonths} months`) : (isHi ? "3+ वर्ष" : "3+ years")}
            highlight
          />
        </div>
      </div>

      {/* Scenarios */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold mb-1">{isHi ? "परिदृश्य विश्लेषण" : "Scenario analysis"}</p>
        <p className="text-xs text-muted-foreground mb-3">
          {isHi ? "आशावादी स्थिति संभव है, पर गारंटीकृत नहीं। सुरक्षित स्थिति को ध्यान में रखकर योजना बनाएं।" : "The optimistic case is possible, not guaranteed. Plan around the conservative case."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {plan.scenarios.map((s) => (
            <div key={s.id} className={cn(
              "rounded-xl border p-3",
              s.id === "conservative" ? "border-amber-200 bg-amber-50/50"
                : s.id === "expected" ? "border-primary/30 bg-primary/[0.03]"
                : "border-emerald-200 bg-emerald-50/50",
            )}>
              <p className="text-xs font-bold">{isHi ? s.labelHi : s.label}</p>
              <div className="mt-2 space-y-1 text-[11px]">
                <div className="flex justify-between"><span className="text-muted-foreground">{isHi ? "बिक्री" : "Revenue"}</span><span className="font-semibold">{formatIndianCurrency(s.monthlyRevenue)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isHi ? "खर्च" : "Expenses"}</span><span className="font-semibold">{formatIndianCurrency(s.monthlyExpenses)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isHi ? "मुनाफ़ा" : "Profit"}</span><span className={cn("font-semibold", s.monthlyProfit >= 0 ? "text-emerald-600" : "text-red-600")}>{formatIndianCurrency(s.monthlyProfit)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isHi ? "ईएमआई बाद" : "After EMI"}</span><span className={cn("font-semibold", s.profitAfterEmi >= 0 ? "text-emerald-600" : "text-red-600")}>{formatIndianCurrency(s.profitAfterEmi)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isHi ? "पेबैक" : "Payback"}</span><span className="font-semibold">{s.paybackMonths ? (isHi ? `~${s.paybackMonths} माह` : `~${s.paybackMonths} mo`) : (isHi ? "3+ वर्ष" : "3+ yrs")}</span></div>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">{s.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What-if simulator (reversible) */}
      <WhatIfCard plan={plan} ob={ob} />

      <div className="flex gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={onNext}
          className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          Continue to Risk & Alternatives <ArrowRight className="inline h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

/* ═════════════════ STEP 6 — RISK, FEASIBILITY & ALTERNATIVES ═════════════════ */

function StepRisk({ ob, plan, onNext, onBack }: {
  ob: ReturnType<typeof useOnboarding>; plan: AdvisoryPlan; onNext: () => void; onBack: () => void;
}) {
  const { language } = useLanguage();
  const isHi = language === "hi";

  const comparison = useMemo(() => {
    const alts = ob.feasibility?.alternatives ?? [];
    const altRows = alts.map((a) => ({
      name: `${a.icon} ${a.businessName}`,
      investment: a.requiredInvestment,
      fundingGap: a.fundingGap,
      loan: a.fundingGap,
      emi: emiFor(a.fundingGap),
      revenue: a.monthlyRevenue,
      profit: a.monthlyProfit,
      afterEmi: a.monthlyProfit - emiFor(a.fundingGap),
      payback: a.breakEvenMonth,
      risk: a.risk,
      feasibility: a.feasibilityScore,
      isCurrent: false,
    }));
    const current = {
      name: `${ob.business?.icon ?? ""} ${ob.business?.name ?? (isHi ? "चुना गया" : "Selected")}`,
      investment: plan.cost.totalProjectCost,
      fundingGap: plan.funding.fundingGap,
      loan: plan.funding.loanRequired,
      emi: plan.emiStress.emi,
      revenue: plan.operating.monthlyRevenue,
      profit: plan.operating.operatingProfit,
      afterEmi: plan.profitAfterEmi,
      payback: plan.breakEven.investmentPaybackMonths,
      risk: plan.risk.level,
      feasibility: plan.feasibility.score,
      isCurrent: true,
    };
    return [current, ...altRows];
  }, [ob.feasibility, ob.business, plan, isHi]);

  const FACTOR_MAP: Record<string, { en: string; hi: string }> = {
    capital: { en: "Capital Match", hi: "पूंजी अनुकूलता" },
    profit: { en: "Profitability", hi: "मुनाफ़ा क्षमता" },
    emi: { en: "EMI Affordability", hi: "ईएमआई वहनीयता" },
    payback: { en: "Payback Period", hi: "ब्रेक-ईवन व पेबैक" },
    competition: { en: "Competition", hi: "प्रतिस्पर्धा" },
  };

  const feasibilityData = plan.feasibility.factors.map((f) => ({
    name: isHi ? (FACTOR_MAP[f.id]?.hi || f.label) : f.label,
    score: f.score,
  }));

  return (
    <div className="animate-fade-in space-y-4">
      <StepHeader
        icon={<ShieldAlert className="h-5 w-5" />}
        title={isHi ? "यह कितना जोखिम भरा है — और क्या कुछ बेहतर है?" : "How risky is it — and is anything better?"}
        hint={isHi ? "कारणों के साथ जोखिम, 0-100 साध्यता स्कोर और समान मानकों पर विकल्पों की तुलना।" : "Risk with reasons, a 0–100 feasibility score with its drivers, and alternatives compared on the same metrics."}
      />

      {/* Risk */}
      <div className="rounded-xl border border-border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">{isHi ? "जोखिम मूल्यांकन" : "Risk assessment"}</p>
          <span className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            plan.risk.level === "low" ? "bg-emerald-100 text-emerald-700"
              : plan.risk.level === "medium" ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700",
          )}>
            {isHi ? (plan.risk.level === "low" ? "कम जोखिम" : plan.risk.level === "medium" ? "मध्यम जोखिम" : "उच्च जोखिम") : plan.risk.label}
          </span>
        </div>
        {plan.risk.reasons.positive.length > 0 && (
          <div className="mb-2">
            {plan.risk.reasons.positive.map((r, i) => (
              <p key={i} className="text-xs text-emerald-700">✓ {r}</p>
            ))}
          </div>
        )}
        {plan.risk.reasons.concerns.map((r, i) => (
          <p key={i} className="text-xs text-amber-700">⚠ {r}</p>
        ))}
      </div>

      {/* Feasibility */}
      <div className="rounded-xl border border-border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">{isHi ? "साध्यता (व्यवहार्यता) स्कोर" : "Feasibility score"}</p>
          <span className="text-2xl font-bold text-primary">{plan.feasibility.score}<span className="text-sm text-muted-foreground font-medium">/100</span></span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={feasibilityData} layout="vertical" margin={{ left: 8, right: 24 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <RTooltip formatter={(v: number) => `${v}/100`} />
              <Bar dataKey="score" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-1.5">
          {plan.feasibility.factors.map((f) => (
            <div key={f.id} className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{isHi ? (FACTOR_MAP[f.id]?.hi || f.label) : f.label}</span> ({Math.round(f.weight * 100)}% {isHi ? "भार" : "weight"}): {f.detail}
            </div>
          ))}
        </div>
      </div>

      {/* Data confidence */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold mb-2">{isHi ? "डेटा विश्वसनीयता" : "Data confidence"}</p>
        <div className="space-y-2">
          {plan.confidence.map((c) => (
            <div key={c.label} className="flex items-start gap-2">
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-bold flex-shrink-0 mt-0.5",
                c.level === "high" ? "bg-emerald-100 text-emerald-700"
                  : c.level === "medium" ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700",
              )}>
                {c.level === "high" ? (isHi ? "उच्च" : "HIGH") : c.level === "medium" ? (isHi ? "मध्यम" : "MEDIUM") : (isHi ? "कम" : "LOW")}
              </span>
              <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">{c.label}</span> — {c.why}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold mb-1">{isHi ? "चुना गया व्यवसाय बनाम विकल्प" : "Selected business vs alternatives"}</p>
        <p className="text-xs text-muted-foreground mb-3">{isHi ? "समान मानक, समान धारणाएं — साध्यता के आधार पर रैंक।" : "Same metrics, same assumptions — ranked by feasibility."}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] min-w-[560px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 pr-2 font-semibold">{isHi ? "व्यवसाय" : "Business"}</th>
                <th className="py-1.5 px-2 font-semibold text-right">{isHi ? "लागत" : "Cost"}</th>
                <th className="py-1.5 px-2 font-semibold text-right">{isHi ? "अंतर" : "Gap"}</th>
                <th className="py-1.5 px-2 font-semibold text-right">{isHi ? "ईएमआई" : "EMI"}</th>
                <th className="py-1.5 px-2 font-semibold text-right">{isHi ? "मुनाफ़ा" : "Profit"}</th>
                <th className="py-1.5 px-2 font-semibold text-right">{isHi ? "ईएमआई बाद" : "After EMI"}</th>
                <th className="py-1.5 px-2 font-semibold text-right">{isHi ? "जोखिम" : "Risk"}</th>
                <th className="py-1.5 pl-2 font-semibold text-right">{isHi ? "स्कोर" : "Feas."}</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.name} className={cn("border-b border-border/40", row.isCurrent && "bg-primary/5 font-semibold")}>
                  <td className="py-2 pr-2">{row.name}{row.isCurrent && <span className="text-[9px] text-primary ml-1">{isHi ? "चुना गया" : "SELECTED"}</span>}</td>
                  <td className="py-2 px-2 text-right">{formatIndianCurrency(row.investment)}</td>
                  <td className="py-2 px-2 text-right">{formatIndianCurrency(row.fundingGap)}</td>
                  <td className="py-2 px-2 text-right">{row.emi > 0 ? formatIndianCurrency(row.emi) : "—"}</td>
                  <td className="py-2 px-2 text-right">{formatIndianCurrency(row.profit)}</td>
                  <td className={cn("py-2 px-2 text-right", row.afterEmi < 0 && "text-red-600")}>{formatIndianCurrency(row.afterEmi)}</td>
                  <td className="py-2 px-2 text-right capitalize">
                    {isHi ? (row.risk === "low" ? "कम" : row.risk === "medium" ? "मध्यम" : "उच्च") : row.risk}
                  </td>
                  <td className="py-2 pl-2 text-right font-bold">{row.feasibility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> {isHi ? "पीछे" : "Back"}
        </button>
        <button onClick={onNext}
          className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          {isHi ? "अंतिम सिफ़ारिश देखें" : "See Final Recommendation"} <ArrowRight className="inline h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

/* ═════════════════ STEP 7 — FINAL RECOMMENDATION ═════════════════ */

function StepRecommendation({ ob, plan, schemeResult, onRestart }: {
  ob: ReturnType<typeof useOnboarding>; plan: AdvisoryPlan;
  schemeResult: ReturnType<typeof matchSchemesForProfileSource> | null;
  onRestart: () => void;
}) {
  const { language } = useLanguage();
  const isHi = language === "hi";

  const verdict = plan.feasibility.score >= 70 ? "good" : plan.feasibility.score >= 50 ? "caution" : "rethink";
  const statusText = verdict === "good"
    ? (isHi ? "शुरू करने के लिए उपयुक्त (अनुशंसित)" : "RECOMMENDED")
    : verdict === "caution"
      ? (isHi ? "सावधानी से आगे बढ़ें" : "PROCEED WITH CAUTION")
      : (isHi ? "वर्तमान परिस्थितियों में अनुशंसित नहीं" : "NOT RECOMMENDED UNDER CURRENT ASSUMPTIONS");
  
  const scaleOpt = SCALE_OPTIONS.find((s) => s.value === ob.scaleChoice);
  const scaleLabel = isHi ? (scaleOpt?.labelHi || "अनुशंसित पैमाना") : (scaleOpt?.label ?? "Recommended Scale");

  const whyBusiness = useMemo(() => {
    const parts: string[] = [];
    const coverage = plan.cost.totalProjectCost > 0
      ? Math.round((plan.funding.totalAvailableFunding / plan.cost.totalProjectCost) * 100)
      : 100;
    if (coverage >= 100) parts.push(`your available funding of ${formatIndianCurrency(plan.funding.totalAvailableFunding)} covers the full estimated project cost of ${formatIndianCurrency(plan.cost.totalProjectCost)}`);
    else parts.push(`your available funding covers about ${coverage}% of the estimated project cost of ${formatIndianCurrency(plan.cost.totalProjectCost)}`);
    if (plan.funding.loanRequired > 0) parts.push(`a loan of about ${formatIndianCurrency(plan.funding.loanRequired)} would be needed, with an estimated EMI of ${formatIndianCurrency(plan.emiStress.emi)}`);
    else parts.push("no external loan is needed under current assumptions");
    parts.push(`estimated monthly operating profit is ${formatIndianCurrency(plan.operating.operatingProfit)} with cash after EMI of ${formatIndianCurrency(plan.profitAfterEmi)}`);
    if (ob.feasibility) parts.push(`local competition appears ${ob.feasibility.competition.density}`);
    parts.push(`estimated payback is ${plan.breakEven.investmentPaybackMonths ? `about ${plan.breakEven.investmentPaybackMonths} months` : "longer than 3 years"}`);
    return `This appears suitable because ${parts.join(", ")}, under the current assumptions.`;
  }, [plan, ob.feasibility]);

  const whyNotOthers = useMemo(() => {
    const alts = (ob.feasibility?.alternatives ?? []).slice(0, 2);
    return alts.map((a) => {
      const reasons: string[] = [];
      if (a.fundingGap > plan.funding.fundingGap) reasons.push(`needs ${formatIndianCurrency(a.fundingGap - plan.funding.fundingGap)} more external funding`);
      if (a.feasibilityScore < plan.feasibility.score) reasons.push(`scores lower on feasibility (${a.feasibilityScore} vs ${plan.feasibility.score})`);
      if (a.risk !== "low" && plan.risk.level === "low") reasons.push("carries more risk under the same assumptions");
      if (reasons.length === 0) reasons.push("is comparable but didn't rank as high overall for your capital and location");
      return `${a.icon} ${a.businessName}: ${reasons.join("; ")}.`;
    });
  }, [ob.feasibility, plan]);

  const mainRisks = plan.risk.reasons.concerns.slice(0, 3);

  const checklist = buildChecklist(plan, ob);

  const nextFive = isHi ? [
    `अपने क्षेत्र (${ob.location?.name ?? "स्थान"}) में ${ob.subCategory?.placeType === "land" ? "ज़मीन" : "दुकान/कार्यस्थल"} के स्थानीय किराये या मूल्य की पुष्टि करें।`,
    `मुख्य उपकरणों व स्टॉक के लिए 2–3 कोटेशन लें (अनुमानित सेटअप खर्च ${formatIndianCurrency(plan.cost.setupCost)})।`,
    "आस-पास के 3–5 ग्राहकों या दुकानों से वास्तविक बिक्री दरों की पुष्टि करें।",
    plan.funding.loanRequired > 0
      ? `लगभग ${formatIndianCurrency(plan.funding.loanRequired)} के ऋण के लिए अपनी पात्रता जाँचें और 2 बैंकों से तुलना करें।`
      : "शुरू करने से पहले अपने फंडिंग स्रोतों की पुष्टि करें और आपातकालीन बफ़र रखें।",
    `${scaleLabel} से शुरुआत करें और 3 महीने बाद समीक्षा करें।`,
  ] : [
    `Verify the local rent/purchase price for ${ob.subCategory?.placeType === "land" ? "land" : "a shop/workspace"} in ${ob.location?.name ?? "your area"}.`,
    `Obtain 2–3 quotations for the main equipment/inventory items (estimated at ${formatIndianCurrency(plan.cost.setupCost)} setup).`,
    "Confirm local selling prices with 3–5 actual customers or nearby shops.",
    plan.funding.loanRequired > 0
      ? `Check your loan eligibility for about ${formatIndianCurrency(plan.funding.loanRequired)} and compare offers from 2 banks.`
      : "Confirm your funding sources and keep an emergency buffer before starting.",
    `Start at the ${scaleLabel.toLowerCase()} and review after 3 months.`,
  ];

  const navigate = useNavigate();

  return (
    <div className="animate-fade-in space-y-4">
      {/* Final decision */}
      <div className={cn(
        "rounded-2xl border-2 p-5",
        verdict === "good" ? "border-emerald-300 bg-emerald-50"
          : verdict === "caution" ? "border-amber-300 bg-amber-50"
          : "border-red-300 bg-red-50",
      )}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{isHi ? "ग्रामउड़ान सिफ़ारिश" : "GramUdaan Recommendation"}</p>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{getVerdictIcon(verdict)}</span>
          <h2 className={cn("text-xl sm:text-2xl font-bold", getVerdictColor(verdict))}>{statusText}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {isHi
            ? `साध्यता स्कोर ${plan.feasibility.score}/100 · ${plan.risk.level === "low" ? "कम जोखिम" : plan.risk.level === "medium" ? "मध्यम जोखिम" : "उच्च जोखिम"} · पूंजी वापसी ~${plan.breakEven.investmentPaybackMonths ?? "36+"} महीने`
            : `Feasibility ${plan.feasibility.score}/100 · ${plan.risk.label.toLowerCase()} · payback ~${plan.breakEven.investmentPaybackMonths ?? "36+"} months`}
        </p>
      </div>

      {/* Best fit summary */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-sm font-bold mb-3">{isHi ? "आपकी स्थिति के लिए सर्वश्रेष्ठ विकल्प" : "Best fit for your situation"}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Metric label={isHi ? "व्यवसाय" : "Business"} value={`${ob.business?.icon ?? ""} ${ob.business?.name ?? "—"}`} />
          <Metric label={isHi ? "पैमाना" : "Scale"} value={scaleLabel} />
          <Metric label={isHi ? "स्थान" : "Location"} value={ob.location?.name ?? "—"} />
          <Metric label={isHi ? "आपकी पूंजी" : "Your capital"} value={formatIndianCurrency(plan.funding.userCapital)} />
          <Metric label={isHi ? "कुल परियोजना लागत" : "Total project cost"} value={formatIndianCurrency(plan.cost.totalProjectCost)} />
          <Metric label={isHi ? "फंडिंग अंतर" : "Funding gap"} value={formatIndianCurrency(plan.funding.fundingGap)} />
          <Metric label={isHi ? "अनुमानित ऋण" : "Estimated loan"} value={formatIndianCurrency(plan.funding.loanRequired)} />
          <Metric label={isHi ? "अनुमानित ईएमआई" : "Estimated EMI"} value={formatIndianCurrency(plan.emiStress.emi)} />
          <Metric label={isHi ? "मासिक बिक्री" : "Monthly revenue"} value={formatIndianCurrency(plan.operating.monthlyRevenue)} />
          <Metric label={isHi ? "मासिक खर्च" : "Monthly expenses"} value={formatIndianCurrency(plan.operating.monthlyExpenses)} />
          <Metric label={isHi ? "परिचालन मुनाफ़ा" : "Operating profit"} value={formatIndianCurrency(plan.operating.operatingProfit)} />
          <Metric label={isHi ? "ईएमआई बाद नकद" : "Cash after EMI"} value={formatIndianCurrency(plan.profitAfterEmi)} />
          <Metric label={isHi ? "ब्रेक-ईवन" : "Break-even"} value={plan.breakEven.investmentPaybackMonths ? (isHi ? `${plan.breakEven.investmentPaybackMonths} महीने` : `${plan.breakEven.investmentPaybackMonths} months`) : (isHi ? "3+ वर्ष" : "3+ years")} />
          <Metric label={isHi ? "जोखिम" : "Risk"} value={isHi ? (plan.risk.level === "low" ? "कम जोखिम" : plan.risk.level === "medium" ? "मध्यम जोखिम" : "उच्च जोखिम") : plan.risk.label} />
          <Metric label={isHi ? "साध्यता" : "Feasibility"} value={`${plan.feasibility.score}/100`} highlight />
        </div>
      </div>

      {/* Why this business / why not others */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-sm font-bold mb-1">{isHi ? "यही व्यवसाय क्यों?" : "Why this business?"}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{whyBusiness}</p>
        </div>
        {whyNotOthers.length > 0 && (
          <div className="rounded-2xl border border-border bg-white p-4">
            <p className="text-sm font-bold mb-1">{isHi ? "अन्य विकल्प क्यों नहीं?" : "Why not the other options?"}</p>
            <ul className="space-y-1.5">
              {whyNotOthers.map((t, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main risks */}
      {mainRisks.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-sm font-bold mb-1">{isHi ? "मुख्य जोखिम" : "Main risks"}</p>
          <ul className="space-y-1">
            {mainRisks.map((r, i) => (
              <li key={i} className="text-xs text-amber-700">⚠ {r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Before you start */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-sm font-bold mb-1">{isHi ? "शुरू करने से पहले — प्रत्येक बिंदु की पुष्टि करें" : "Before you start — verify each item"}</p>
        <p className="text-xs text-muted-foreground mb-3">{isHi ? "यहाँ कुछ भी अंतिम नहीं है। ये जाँचें आपकी पूंजी को सुरक्षित रखने के लिए हैं।" : "Nothing here is confirmed. These are the checks that protect your money."}</p>
        <div className="space-y-1.5">
          {checklist.map((item, i) => (
            <label key={i} className="flex items-start gap-2.5 text-xs cursor-pointer group">
              <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 accent-primary" />
              <span className="text-muted-foreground group-hover:text-foreground">{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Next 5 steps */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-sm font-bold mb-1">{isHi ? "आपके अगले 5 कदम" : "Your next 5 steps"}</p>
        <ol className="space-y-2 mt-2">
          {nextFive.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-muted-foreground">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Final dashboard actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => navigate("/dashboard")}
          className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          {isHi ? "डैशबोर्ड खोलें" : "Open Full Dashboard"}
        </button>
        <button onClick={() => navigate("/onboarding")} className="flex-1 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted">
          {isHi ? "योजना संपादित करें" : "Edit Plan"}
        </button>
        <button onClick={onRestart} className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted">
          {isHi ? "फिर से शुरू करें" : "Start Over"}
        </button>
      </div>
    </div>
  );
}

/* ═════════════════ WHAT-IF (reversible) ═════════════════ */

function WhatIfCard({ plan, ob }: { plan: AdvisoryPlan; ob: ReturnType<typeof useOnboarding> }) {
  const { language } = useLanguage();
  const isHi = language === "hi";

  const [draft, setDraft] = useState<{ capital: number; otherFunding: number; revenueFactor: number; expenseFactor: number } | null>(null);

  const baseline = {
    capital: ob.capital,
    otherFunding: ob.otherFunding,
    revenueFactor: 1,
    expenseFactor: 1,
  };

  const whatIfPlan = useMemo(() => {
    if (!draft) return null;
    return buildAdvisoryPlan({
      businessId: ob.business?.id ?? "other",
      subCategoryId: ob.subCategory?.id ?? null,
      placeStatus: ob.placeStatus,
      rentMonthly: ob.rentMonthly,
      scaleChoice: ob.scaleChoice,
      userCapital: draft.capital,
      otherFunding: draft.otherFunding,
      competitionDensity: ob.feasibility?.competition?.density,
    });
  }, [draft, ob.business?.id, ob.subCategory?.id, ob.placeStatus, ob.rentMonthly, ob.scaleChoice, ob.feasibility]);

  return (
    <div className="rounded-xl border-2 border-dashed border-primary/40 bg-white p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold">{isHi ? "क्या होगा अगर…?" : "What if…?"}</p>
        {draft && (
          <button onClick={() => setDraft(null)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            <RotateCcw className="h-3 w-3" /> {isHi ? "मूल योजना पर वापस जाएँ" : "Back to my plan"}
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {isHi ? "अपनी सहेजी गई योजना को बदले बिना नए विकल्प आज़माएं — वापस जाने के लिए 'मूल योजना पर वापस जाएँ' दबाएं।" : "Try changes without touching your saved plan — press \"Back to my plan\" to revert."}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">{isHi ? "स्वयं का निवेश (₹)" : "Own investment (₹)"}</label>
          <input type="number" min={0} value={draft?.capital ?? baseline.capital}
            onChange={(e) => setDraft({ capital: Math.max(0, Number(e.target.value) || 0), otherFunding: draft?.otherFunding ?? baseline.otherFunding, revenueFactor: 1, expenseFactor: 1 })}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">{isHi ? "अन्य फंडिंग (₹)" : "Other funding (₹)"}</label>
          <input type="number" min={0} value={draft?.otherFunding ?? baseline.otherFunding}
            onChange={(e) => setDraft({ capital: draft?.capital ?? baseline.capital, otherFunding: Math.max(0, Number(e.target.value) || 0), revenueFactor: 1, expenseFactor: 1 })}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">{isHi ? "बिक्री में बदलाव (%)" : "Revenue change (%)"}</label>
          <input type="number" min={-50} max={50} value={draft ? Math.round((draft.revenueFactor - 1) * 100) : 0}
            onChange={(e) => setDraft({ capital: draft?.capital ?? baseline.capital, otherFunding: draft?.otherFunding ?? baseline.otherFunding, revenueFactor: 1 + (Number(e.target.value) || 0) / 100, expenseFactor: 1 })}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
        </div>
      </div>

      {whatIfPlan && draft && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Delta label={isHi ? "फंडिंग अंतर" : "Funding gap"} now={whatIfPlan.funding.fundingGap} base={plan.funding.fundingGap} invert />
          <Delta label={isHi ? "ईएमआई" : "EMI"} now={whatIfPlan.emiStress.emi} base={plan.emiStress.emi} invert />
          <Delta label={isHi ? "ईएमआई बाद मुनाफ़ा" : "Profit after EMI"} now={whatIfPlan.profitAfterEmi} base={plan.profitAfterEmi} />
          <Delta label={isHi ? "साध्यता" : "Feasibility"} now={whatIfPlan.feasibility.score} base={plan.feasibility.score} suffix="/100" />
        </div>
      )}
      {!draft && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          {isHi ? "उदाहरण: 'स्वयं का निवेश' में ₹50,000 जोड़कर देखें कि आपकी योजना पर क्या प्रभाव पड़ता है।" : "Example: type +50000 in \"Own investment\" to see \"If I invest ₹50,000 more, what changes?\""}
        </p>
      )}
    </div>
  );
}

function Delta({ label, now, base, suffix = "", invert }: {
  label: string; now: number; base: number; suffix?: string; invert?: boolean;
}) {
  const diff = now - base;
  const good = invert ? diff < 0 : diff > 0;
  const neutral = diff === 0;
  return (
    <div className="rounded-lg border border-border bg-white p-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{typeof now === "number" && label !== "Feasibility" ? formatIndianCurrency(now) : `${now}${suffix}`}</p>
      <p className={cn(
        "text-[10px] font-semibold",
        neutral ? "text-muted-foreground" : good ? "text-emerald-600" : "text-red-600",
      )}>
        {diff === 0 ? "unchanged" : `${diff > 0 ? "+" : "−"}${formatIndianCurrency(Math.abs(diff))}`}
      </p>
    </div>
  );
}

/* ═════════════════ Shared small components ═════════════════ */

function StepHeader({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="text-center mb-2">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">{icon}</div>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-xl mx-auto">{hint}</p>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl p-3 text-center", highlight ? "bg-primary text-primary-foreground" : "bg-muted/50")}>
      <p className={cn("text-[9px] font-semibold uppercase tracking-wider", highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>{label}</p>
      <p className={cn("text-sm font-bold mt-0.5 break-words")}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function FlowRow({ label, value, tone, bold }: {
  label: string; value: string; tone: "pos" | "neg" | "neutral"; bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn("text-muted-foreground", bold && "font-semibold text-foreground")}>{label}</span>
      <span className={cn(
        "font-semibold",
        tone === "pos" && "text-emerald-600",
        tone === "neg" && "text-red-600",
        bold && "text-base",
      )}>{value}</span>
    </div>
  );
}

function stressIcon(level: "low" | "medium" | "high"): string {
  return level === "low" ? "🟢" : level === "medium" ? "🟡" : "🔴";
}

function placeTypeLabel(t: string): string {
  return t === "land" ? "land/shed" : t === "workspace" ? "a workspace/shed" : t === "shed" ? "a shed" : t === "none" ? "no separate place" : "a shop";
}

function getSubCategoryGroupNameLabel(businessId: string): string {
  const names: Record<string, string> = {
    dairy: "What exactly within Dairy?",
    grocery: "What type of store?",
    poultry: "What type of poultry?",
    "poultry-feed": "What type of feed business?",
    clothing: "What type of clothing business?",
    "mobile-repair": "What type of mobile business?",
    "food-processing": "What type of processing?",
    "agri-inputs": "What type of inputs store?",
    retail: "What type of retail store?",
    services: "What type of service?",
    manufacturing: "What type of manufacturing?",
    other: "Tell us about your idea",
  };
  return names[businessId] ?? "Choose a specific business type";
}

function buildChecklist(plan: AdvisoryPlan, ob: ReturnType<typeof useOnboarding>): string[] {
  const items = [
    "Confirm shop/land availability and price locally",
    "Get equipment quotations (2–3 sources)",
    "Verify supplier prices for inventory",
    "Verify local selling prices with real customers",
    "Check competitors in person within your radius",
    "Check licences required for this business",
    "Verify loan eligibility with 2 banks/lenders",
    "Verify relevant government schemes officially",
    "Arrange working capital for the first 2–3 months",
    "Maintain an emergency buffer",
  ];
  if (plan.funding.loanRequired > 0) items.push(`Prepare documents for a loan of about ${formatIndianCurrency(plan.funding.loanRequired)}`);
  if (ob.placeStatus === "rent") items.push("Negotiate and document the rent agreement");
  return items;
}

function emiFor(loanAmount: number): number {
  if (loanAmount <= 0) return 0;
  const rate = loanAmount <= 125000 ? 6.5 : 8;
  const years = loanAmount <= 125000 ? 3 : 5;
  const n = years * 12;
  const r = rate / 12 / 100;
  return Math.round((loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

function compact(v: number): string {
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (Math.abs(v) >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}
