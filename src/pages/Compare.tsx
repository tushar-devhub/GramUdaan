import { useState, useEffect } from "react";
import { formatIndianCurrency, getVerdictColor, getVerdictIcon } from "@/data/assessment";
import { businessCategories } from "@/data/businesses";
import { locations } from "@/data/locations";
import { useLanguage } from "@/i18n/LanguageContext";
import { buildCanonicalAnalysisResult } from "@/services/api/dataIntegrationService";
import type { CanonicalAnalysisResult } from "@/types/dataIntegration";
import {
  ArrowUpRight,
  Plus,
  X,
  Check,
} from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

interface Scenario {
  businessId: string;
  locationId: string;
  capital: number;
}

const DEFAULT_SCENARIOS: Scenario[] = [
  { businessId: "dairy", locationId: "loc-1", capital: 100000 },
  { businessId: "poultry-feed", locationId: "loc-1", capital: 100000 },
  { businessId: "grocery", locationId: "loc-1", capital: 100000 },
];

export interface ScenarioResult {
  scenario: Scenario;
  canonical: CanonicalAnalysisResult;
  business?: any;
  location?: any;
}

export default function Compare() {
  const { t } = useLanguage();
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);
  const [results, setResults] = useState<ScenarioResult[]>([]);

  useEffect(() => {
    let active = true;
    async function loadCanonicalResults() {
      const promises = scenarios.map(async (s) => {
        const business = businessCategories.find((b) => b.id === s.businessId) || businessCategories[0];
        const location = locations.find((l) => l.id === s.locationId) || locations[0];
        const canonical = await buildCanonicalAnalysisResult({
          location,
          business,
          capital: s.capital,
        });
        return {
          scenario: s,
          canonical,
          business,
          location,
        };
      });
      const res = await Promise.all(promises);
      if (active) {
        setResults(res);
      }
    }
    loadCanonicalResults();
    return () => {
      active = false;
    };
  }, [scenarios]);

  const bestScore = results.length > 0 ? Math.max(...results.map((r) => r.canonical.feasibilityScore.value)) : 0;
  const bestIndex = results.length > 0 ? results.findIndex((r) => r.canonical.feasibilityScore.value === bestScore) : 0;

  const addScenario = () => {
    if (scenarios.length < 3) {
      setScenarios([...scenarios, { businessId: "mobile-repair", locationId: "loc-1", capital: 100000 }]);
    }
  };

  const removeScenario = (index: number) => {
    if (scenarios.length > 2) {
      setScenarios(scenarios.filter((_, i) => i !== index));
    }
  };

  const updateScenario = (index: number, field: keyof Scenario, value: string | number) => {
    const updated = [...scenarios];
    updated[index] = { ...updated[index], [field]: value };
    setScenarios(updated);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">{t("compare.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("compare.subtitle")}
          </p>
        </div>

        {/* Scenario Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {scenarios.map((s, i) => (
            <div key={i} className={cn(
              "rounded-xl border p-4 relative",
              i === bestIndex ? "border-emerald-300 bg-emerald-50/50" : "border-border bg-white",
            )}>
              {i === bestIndex && (
                <span className="absolute -top-2.5 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {t("compare.bestFit")}
                </span>
              )}
              {scenarios.length > 2 && (
                <button
                  onClick={() => removeScenario(i)}
                  className="absolute top-2 right-2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-red-100 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <select
                value={s.businessId}
                onChange={(e) => updateScenario(i, "businessId", e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-2.5 py-2 text-sm mb-2 focus:border-primary focus:outline-none"
              >
                {businessCategories.filter((b) => b.id !== "suggest").map((b) => (
                  <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                ))}
              </select>
              <select
                value={s.locationId}
                onChange={(e) => updateScenario(i, "locationId", e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-2.5 py-2 text-sm mb-2 focus:border-primary focus:outline-none"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}, {l.district}</option>
                ))}
              </select>
              <select
                value={s.capital}
                onChange={(e) => updateScenario(i, "capital", Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-white px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {[50000, 100000, 200000, 500000, 600000].map((v) => (
                  <option key={v} value={v}>{formatIndianCurrency(v)}</option>
                ))}
              </select>
            </div>
          ))}
          {scenarios.length < 3 && (
            <button
              onClick={addScenario}
              className="rounded-xl border-2 border-dashed border-border p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors min-h-[120px]"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-semibold">{t("compare.addScenario")}</span>
            </button>
          )}
        </div>

        {/* Comparison Table */}
        <div className="rounded-2xl border border-border bg-white overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40">
                    {t("compare.metric")}
                  </th>
                  {results.map((r, i) => (
                    <th key={i} className={cn(
                      "text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider",
                      i === bestIndex ? "text-emerald-600 bg-emerald-50/50" : "text-muted-foreground",
                    )}>
                      {r.business?.icon} {r.business?.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  label={t("compare.overallScore")}
                  values={results.map((r) => ({
                    value: `${r.canonical.feasibilityScore.value}/100`,
                    highlight: r.canonical.feasibilityScore.value === bestScore,
                  }))}
                />
                <ComparisonRow
                  label={t("compare.verdict")}
                  values={results.map((r) => ({
                    value: `${getVerdictIcon(r.canonical.decision.code === "START" ? "good" : r.canonical.decision.code === "PROCEED_CAREFULLY" ? "caution" : "rethink")} ${r.canonical.decision.labelHi}`,
                    color: getVerdictColor(r.canonical.decision.code === "START" ? "good" : r.canonical.decision.code === "PROCEED_CAREFULLY" ? "caution" : "rethink"),
                  }))}
                />
                <ComparisonRow
                  label={t("compare.projectCost")}
                  values={results.map((r) => ({ value: formatIndianCurrency(r.canonical.costs.totalSetupCost.value) }))}
                />
                <ComparisonRow
                  label={t("compare.loanAmount")}
                  values={results.map((r) => ({ value: formatIndianCurrency(r.canonical.capitalFit.fundingGap.value) }))}
                />
                <ComparisonRow
                  label={t("compare.scheme")}
                  values={results.map((r) => ({ value: r.canonical.schemes[0]?.schemeNameHi || "PMEGP / Mudra" }))}
                />
                <ComparisonRow
                  label={t("compare.competitors")}
                  values={results.map((r) => ({ value: `${r.canonical.nearbyBusinesses.totalMappedBusinesses} (${r.canonical.nearbyBusinesses.densityCategoryHi})` }))}
                />
                <ComparisonRow
                  label={t("compare.households")}
                  values={results.map((r) => ({ value: r.canonical.demographics.households.value.toLocaleString("en-IN") }))}
                />
                <ComparisonRow
                  label={t("compare.requiredInvestment")}
                  values={results.map((r) => ({ value: formatIndianCurrency(r.canonical.costs.totalSetupCost.value) }))}
                />
                <ComparisonRow
                  label={t("compare.monthlyRevenue")}
                  values={results.map((r) => ({ value: formatIndianCurrency(r.canonical.revenue.monthlyRevenueEstimateMax.value) }))}
                />
                <ComparisonRow
                  label={t("compare.monthlyProfit")}
                  values={results.map((r) => ({ value: formatIndianCurrency(r.canonical.profit.monthlyNetProfitMax.value) }))}
                />
                <ComparisonRow
                  label={t("compare.profitMargin")}
                  values={results.map((r) => ({ value: `${r.canonical.profit.netMarginPercent.value}%` }))}
                />
                <ComparisonRow
                  label={t("compare.breakEven")}
                  values={results.map((r) => ({ value: `~${r.canonical.breakEven.monthsToBreakEven.value} माह` }))}
                />
                <ComparisonRow
                  label={t("compare.fundingGap")}
                  values={results.map((r) => ({ value: formatIndianCurrency(r.canonical.capitalFit.fundingGap.value) }))}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendation */}
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 mb-8">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-emerald-800 mb-1">
                {t("compare.recStrongest").replace("{business}", results[bestIndex]?.business?.name ?? "")}
              </h3>
              <p className="text-xs text-emerald-600">
                {t("compare.disclaimer")}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center gap-3 mb-12">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("compare.viewDashboard")}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            {t("compare.startAssessment")}
          </Link>
        </div>
      </main>

    </div>
  );
}

function ComparisonRow({
  label,
  values,
}: {
  label: string;
  values: { value: string; highlight?: boolean; color?: string }[];
}) {
  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="px-5 py-3 text-xs font-semibold text-muted-foreground">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={cn(
          "px-4 py-3 text-center text-sm font-medium",
          v.highlight ? "font-bold text-emerald-600" : "text-foreground",
          v.color,
        )}>
          {v.value}
        </td>
      ))}
    </tr>
  );
}
