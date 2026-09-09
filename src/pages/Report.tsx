import { useMemo, useState } from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { formatIndianCurrency, getVerdictColor, getVerdictIcon } from "@/data/assessment";
import { buildHyperlocalProfile } from "@/services/hyperlocal/profile";
import { SWOTGrid } from "@/components/ui/SWOTGrid";
import { DataConfidenceBadge } from "@/components/ui/DataConfidenceBadge";
import { matchSchemesForProfileSource, type SchemeMatch } from "@/engine/schemeMatching";
import { VisualDecisionReport } from "@/components/VisualDecisionReport";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import {
  Home,
  ChevronRight,
  ArrowUpRight,
  Download,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  MapPin,
  Store,
  IndianRupee,
  Printer,
  Sparkles,
  BookmarkPlus,
  Loader2,
  Eye,
  FileText,
} from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

export default function Report() {
  const { feasibility, analysisResult, location, business, capital, radius, targetInvestment, otherFunding, placeStatus, rentMonthly, scaleChoice } = useOnboarding();
  const [reportViewMode, setReportViewMode] = useState<"visual" | "detailed">("visual");
  const [isSaving, setIsSaving] = useState(false);
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  const saveReportMutation = useMutation(api.reports.saveReport);

  const handleSaveReport = async () => {
    if (!feasibility || !business || !location) return;
    if (!isAuthenticated) {
      toast.error(t("report.toastSignIn"));
      return;
    }
    setIsSaving(true);
    try {
      await saveReportMutation({
        title: `${business.name} — ${location.name}`,
        businessId: business.id,
        businessName: business.name,
        locationId: location.id,
        locationName: `${location.name}, ${location.district}`,
        capital,
        targetInvestment,
        otherFunding,
        placeStatus,
        rentMonthly,
        scaleChoice,
        overallScore: feasibility.overallScore,
        verdict: feasibility.verdict,
        verdictLabel: feasibility.verdictLabel,
        feasibilityData: feasibility,
      });
      toast.success(t("report.toastSaved"));
    } catch (err) {
      console.error("Failed to save report:", err);
      toast.error(t("report.toastSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!feasibility) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-2">{t("report.noReportTitle")}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("report.noReportDesc")}
            </p>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("report.startAssessment")} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const f = feasibility;
  const hyperlocal = useMemo(
    () =>
      location && business && capital > 0
        ? buildHyperlocalProfile({ location, business, capital, radiusKm: radius, feasibility: f })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f, location, business, capital, radius],
  );
  const schemeResult =
    feasibility && business && location
      ? matchSchemesForProfileSource({
          businessId: business.id,
          businessName: business.name,
          businessCategory: business.category,
          state: location.state,
          district: location.district,
          contribution: feasibility.financial.availableContribution || capital,
          projectCost: feasibility.financial.totalProjectCost,
          fundingRequirement: feasibility.financial.potentialLoan,
        })
      : null;
  const today = new Date().toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-6 sm:py-10">
        {/* Module header & View Toggle */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-serif-display text-lg font-bold text-foreground sm:text-xl">{t("report.headerTitle")}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("report.headerSubtitle")}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveReport}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                {t("report.saveBtn")}
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                {t("report.printBtn")}
              </button>
            </div>
          </div>

          {/* VIEW MODE TOGGLE BUTTONS */}
          <div className="flex items-center gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border w-fit">
            <button
              onClick={() => setReportViewMode("visual")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                reportViewMode === "visual"
                  ? "bg-white text-emerald-800 shadow-sm border border-emerald-200"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>{t("report.tabVisual")}</span>
            </button>

            <button
              onClick={() => setReportViewMode("detailed")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                reportViewMode === "detailed"
                  ? "bg-white text-emerald-800 shadow-sm border border-emerald-200"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="h-3.5 w-3.5 text-slate-600" />
              <span>{t("report.tabDetailed")}</span>
            </button>
          </div>
        </div>

        {/* CONDITIONALLY RENDER VISUAL OR DETAILED REPORT */}
        {reportViewMode === "visual" ? (
          <VisualDecisionReport
            feasibility={f}
            analysisResult={analysisResult}
            location={location}
            business={business}
            capital={capital}
            radius={radius}
          />
        ) : (
          <div className="rounded-2xl border border-border bg-white p-6 sm:p-10 shadow-sm">
          {/* Header */}
          <div className="text-center border-b border-border pb-8 mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              GramUdaan
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {t("report.headerTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("report.brandSubtitle")}</p>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {today}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {location?.name}, {location?.district}</span>
              <span className="flex items-center gap-1"><Store className="h-3 w-3" /> {business?.name}</span>
            </div>
          </div>

          {/* Executive Summary */}
          <Section title={t("report.secExecutiveSummary")}>
            <div className="flex items-center gap-4 mb-4">
              <div className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl flex-shrink-0",
                f.verdict === "good" ? "bg-emerald-50" : f.verdict === "caution" ? "bg-amber-50" : "bg-red-50",
              )}>
                <span className="text-3xl">{getVerdictIcon(f.verdict)}</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{f.overallScore}/100</p>
                <p className={cn("text-sm font-bold", getVerdictColor(f.verdict))}>{f.verdictLabel}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.decision.summary}</p>
          </Section>

          {/* Market Analysis */}
          <Section title={t("report.secMarketAnalysis")}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatBlock label={t("report.statPopulation")} value={f.marketReach.population.toLocaleString("en-IN")} />
              <StatBlock label={t("report.statHouseholds")} value={f.marketReach.households.toLocaleString("en-IN")} />
              <StatBlock label={t("report.statPotentialCustomers")} value={f.marketReach.potentialCustomers.toLocaleString("en-IN")} />
              <StatBlock label={t("report.statNearbyVillages")} value={f.marketReach.nearbyVillages.toString()} />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.marketReach.summary}</p>
            <div className="mt-2"><DataConfidenceBadge type="estimated" confidence={f.marketReach.confidence} /></div>
          </Section>
          {/* Opportunity */}
          <Section title={t("report.secOpportunity")}>
            <div className="space-y-1.5 mb-3">
              {f.opportunity.existingBusinesses.map((b) => (
                <div key={b.name} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-28">{b.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min(100, (b.count / 40) * 100)}%` }} />
                  </div>
                  <span className="font-semibold w-6 text-right">{b.count}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{f.opportunity.summary}</p>
          </Section>

          {/* Hyperlocal Market Intelligence */}
          {hyperlocal && (
            <Section title={t("report.secHyperlocal")}>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Why {business?.name} may or may not fit this specific location — {location?.name}, {location?.district}, {location?.state}
                {location?.pincode ? ` (PIN ${location.pincode})` : ""} · {hyperlocal.meta.radiusBand} · {hyperlocal.meta.radiusKm} km analysis radius.
                Every statement is derived from the feasibility analysis on this report and marked with how it was determined.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <ReportStat label={t("report.statDemandSignal")} value={hyperlocal.demand.levelLabel} tone={toneFor(hyperlocal.demand.level === "high" || hyperlocal.demand.level === "moderate-high" ? "pos" : hyperlocal.demand.level === "moderate" ? "mid" : "neg")} />
                <ReportStat label={t("report.statLocationImpact")} value={hyperlocal.locationImpact.direction} tone={toneFor(hyperlocal.locationImpact.direction === "positive" ? "pos" : hyperlocal.locationImpact.direction === "mixed" ? "mid" : "neg")} />
                <ReportStat label={t("report.statVisibleCompetition")} value={`${hyperlocal.competition.totalVisible} (${hyperlocal.competition.density})`} tone={toneFor(hyperlocal.competition.density === "low" ? "pos" : hyperlocal.competition.density === "medium" ? "mid" : "neg")} />
                <ReportStat label={t("report.statEstimatedReach")} value={`${f.marketReach.households.toLocaleString("en-IN")} ${t("report.statHouseholds").toLowerCase()}`} tone="neutral" />
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mb-2">{hyperlocal.locationFit.statement}</p>

              <ul className="space-y-1 text-[11px] text-muted-foreground mb-3">
                <li>• {hyperlocal.locationFit.marketNote}</li>
                <li>• {hyperlocal.locationFit.competitionNote}</li>
                <li>• {hyperlocal.locationFit.capitalNote}</li>
              </ul>

              <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">{t("report.potentialMarketGaps")}</p>
              {hyperlocal.marketGaps.length === 0 ? (
                <p className="text-[11px] text-muted-foreground mb-3">{t("report.noMarketGaps")}</p>
              ) : (
                <ul className="space-y-1 text-[11px] text-muted-foreground mb-3">
                  {hyperlocal.marketGaps.slice(0, 2).map((g) => (
                    <li key={g.type + g.title}>• {g.title} — {g.statement}</li>
                  ))}
                </ul>
              )}

              <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">{t("report.locationImpactOnScore")}</p>
              <ul className="space-y-0.5 text-[11px] text-muted-foreground mb-3">
                {hyperlocal.locationImpact.factors.map((x) => (
                  <li key={x.label}>• ({x.effect}) {x.label}: {x.detail}</li>
                ))}
              </ul>
              <p className="text-[10px] text-muted-foreground/70">
                Confidence: {hyperlocal.confidence}. Sources: {hyperlocal.sources.join(" · ")}. {hyperlocal.caveats[0]}
              </p>
            </Section>
          )}

          {/* SWOT */}
          <Section title={t("report.secSWOT")}>
            <SWOTGrid
              strengths={f.swot.strengths}
              weaknesses={f.swot.weaknesses}
              opportunities={f.swot.opportunities}
              threats={f.swot.threats}
            />
          </Section>

          {/* Risks */}
          <Section title={t("report.secRisks")}>
            <div className="space-y-3">
              {f.risks.map((risk) => (
                <div key={risk.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                      risk.severity === "high" ? "bg-red-50 text-red-600 border-red-200" : risk.severity === "medium" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200",
                    )}>{risk.severity.toUpperCase()}</span>
                    <span className="text-xs font-bold">{risk.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{risk.explanation}</p>
                  <p className="text-[11px] text-primary font-medium mt-1">{t("report.mitigationPrefix")} {risk.mitigation}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Competition */}
          <Section title={t("report.secCompetition")}>
            <p className="text-xs text-muted-foreground mb-2">{f.competition.summary}</p>
            <div className="space-y-1">
              {f.competition.competitors.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{c.name}</span>
                  <span className="text-muted-foreground">{c.type} • {c.distance}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Pricing */}
          <Section title={t("report.secPricing")}>
            {f.pricing.unit && <p className="text-xs text-muted-foreground mb-2">{t("report.unitPrefix")} {f.pricing.unit}</p>}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <StatBlock label={t("report.regionalPrice")} value={f.pricing.regionalPrice} />
              <StatBlock label={t("report.competitorRange")} value={f.pricing.competitorRange} />
              <StatBlock label={t("report.recommendedPrice")} value={f.pricing.recommendedPrice} highlight />
            </div>
            <p className="text-xs text-muted-foreground">{f.pricing.explanation}</p>
          </Section>

          {/* Financial Structure */}
          <Section title={t("report.secFinancialStructure")}>
            {f.financial.projectCostBreakdown && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <StatBlock label={t("report.yourContribution")} value={formatIndianCurrency(f.financial.projectCostBreakdown.entrepreneurContribution)} highlight />
                <StatBlock label={t("report.totalProjectCost")} value={formatIndianCurrency(f.financial.totalProjectCost)} />
                <StatBlock label={t("report.agencyFunding")} value={formatIndianCurrency(f.financial.potentialLoan)} />
                <StatBlock label={t("report.scheme")} value={f.financial.recommendedScheme} />
              </div>
            )}
            {f.financial.loanDetails && (
              <div className="grid grid-cols-4 gap-3 mb-3">
                <StatBlock label={t("report.interest")} value={`${f.financial.loanDetails.interestRate}%`} />
                <StatBlock label={t("report.tenure")} value={`${f.financial.loanDetails.tenure} yrs`} />
                <StatBlock label={t("report.moratorium")} value={`${f.financial.loanDetails.moratorium} mo`} />
                <StatBlock label={t("report.repayment")} value={f.financial.repayment} />
              </div>
            )}
            {f.financial.affordability && (
              <div className={cn("rounded-lg p-3 text-xs",
                f.financial.affordability.rating === "comfortable" ? "bg-emerald-50" : f.financial.affordability.rating === "tight" ? "bg-amber-50" : "bg-red-50",
              )}>
                <p className="font-bold mb-1">{f.financial.affordability.ratingIcon} {t("report.affordability")} {f.financial.affordability.ratingLabel}</p>
                <p>{t("report.affordRevenue")} ₹{f.financial.affordability.expectedRevenue.toLocaleString("en-IN")} − {t("report.affordCosts")} ₹{f.financial.affordability.operatingCosts.toLocaleString("en-IN")} = {t("report.affordCashFlow")} ₹{f.financial.affordability.cashFlow.toLocaleString("en-IN")}{t("report.perMonth")}</p>
                <p>{t("report.loanRepaymentMonthly")} ₹{f.financial.affordability.monthlyRepayment.toLocaleString("en-IN")}{t("report.perMonth")}</p>
              </div>
            )}
            <div className="mt-2"><DataConfidenceBadge type="verified" /></div>

            {/* Loan application entry */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-primary/10 bg-primary/[0.03] p-3.5">
              <p className="flex-1 text-[11px] text-muted-foreground leading-relaxed">
                {t("report.loanAppDraftCallout").split("{boldDraft}")[0]}
                <span className="font-semibold text-foreground">{t("report.editableDraft")}</span>
                {t("report.loanAppDraftCallout").split("{boldDraft}")[1] || ""}
              </p>
              <Link
                to="/application"
                className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t("report.prepareLoanAppBtn")}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Section>

          {/* GramUdaan: Transparent Cost Breakdown */}
          {f.costBreakdown && (
            <Section title={t("report.secCostBreakdown")}>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {t("report.costIntro").replace("{total}", formatIndianCurrency(f.costBreakdown.total))}
              </p>
              <div className="space-y-1 mb-3">
                {f.costBreakdown.components.filter((c) => c.amount > 0).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{c.label} <span className="text-muted-foreground">({c.source.toLowerCase()})</span></span>
                    <span className="font-semibold">{formatIndianCurrency(c.amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs font-bold border-t border-border pt-1.5 mt-1.5">
                  <span>{t("report.totalCostLabel")}</span>
                  <span>{formatIndianCurrency(f.costBreakdown.total)}</span>
                </div>
              </div>
              {f.costBreakdown.monthlyRentEstimate > 0 && (
                <p className="text-[11px] text-muted-foreground mb-2">{t("report.rentingEstimate").replace("{rent}", formatIndianCurrency(f.costBreakdown.monthlyRentEstimate))}</p>
              )}
              {f.costBreakdown.notes.map((n, i) => (
                <p key={i} className="text-[10px] text-muted-foreground/80">• {n}</p>
              ))}
            </Section>
          )}

          {/* GramUdaan: Profit Timeline & Break-even */}
          {f.profitModel && (
            <Section title={t("report.secProfitTimeline")}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <StatBlock label={t("report.estMonthlyRev")} value={formatIndianCurrency(f.profitModel.monthlyRevenue)} />
                <StatBlock label={t("report.estMonthlyExp")} value={formatIndianCurrency(f.profitModel.monthlyExpenses)} />
                <StatBlock label={t("report.estMonthlyProfit")} value={formatIndianCurrency(f.profitModel.monthlyProfit)} />
                <StatBlock label={t("report.operatingBreakEven")} value={f.profitModel.breakEvenMonth ? `~Month ${f.profitModel.breakEvenMonth}` : t("report.ninePlusMonths")} />
              </div>
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-1 pr-2 font-semibold text-muted-foreground">{t("report.tableMonth")}</th>
                      <th className="py-1 pr-2 font-semibold text-muted-foreground">{t("report.tableRevenue")}</th>
                      <th className="py-1 pr-2 font-semibold text-muted-foreground">{t("report.tableExpenses")}</th>
                      <th className="py-1 pr-2 font-semibold text-muted-foreground">{t("report.tableProfitLoss")}</th>
                      <th className="py-1 font-semibold text-muted-foreground">{t("report.tableCumulative")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.profitModel.timeline.slice(0, 12).map((p) => (
                      <tr key={p.month} className="border-b border-border/40">
                        <td className="py-1 pr-2 font-semibold">{p.label}</td>
                        <td className="py-1 pr-2">{formatIndianCurrency(p.revenue)}</td>
                        <td className="py-1 pr-2">{formatIndianCurrency(p.expenses)}</td>
                        <td className={cn("py-1 pr-2 font-semibold", p.profit >= 0 ? "text-emerald-600" : "text-red-600")}>{formatIndianCurrency(p.profit)}</td>
                        <td className="py-1">{formatIndianCurrency(p.cumulative)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                {f.profitModel.breakEvenMonth
                  ? t("report.breakEvenCover").replace("{month}", String(f.profitModel.breakEvenMonth)).replace("{sales}", formatIndianCurrency(f.profitModel.breakEvenSales))
                  : t("report.breakEvenNotReached")}
              </p>
              <p className="text-[11px] font-bold text-foreground mb-1">{t("report.profitRisk")} {f.profitModel.risk.label}</p>
              <ul className="space-y-0.5 text-[10px] text-muted-foreground mb-2">
                {f.profitModel.risk.reasons.positive.map((r, i) => <li key={`p${i}`}>✓ {r}</li>)}
                {f.profitModel.risk.reasons.concerns.map((r, i) => <li key={`c${i}`}>⚠ {r}</li>)}
              </ul>
              <p className="text-[10px] text-muted-foreground/70">
                {t("report.capitalUtilisation")
                  .replace("{available}", formatIndianCurrency(f.profitModel.capital.availableCapital))
                  .replace("{required}", formatIndianCurrency(f.profitModel.capital.requiredInvestment))
                  .replace("{gap}", formatIndianCurrency(f.profitModel.capital.fundingGap))
                  .replace("{remaining}", formatIndianCurrency(f.profitModel.capital.remainingCapital))}
                {f.profitModel.capital.allocationSuggestions[0] ? t("report.remainingCapitalUse").replace("{suggestions}", f.profitModel.capital.allocationSuggestions.slice(0, 2).join("; ")) : ""}
              </p>
            </Section>
          )}

          {/* GramUdaan: Alternative Businesses */}
          {f.alternatives && f.alternatives.length > 0 && (
            <Section title={t("report.secAlternatives")}>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {t("report.altIntro").replace("{capital}", formatIndianCurrency(f.financial.availableContribution))}
              </p>
              <div className="space-y-2">
                {f.alternatives.map((a, i) => (
                  <div key={a.businessId} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="text-xs font-bold text-foreground">{a.icon} {a.businessName} <span className="font-normal text-muted-foreground">({a.subCategoryName})</span></p>
                      <span className="text-xs font-bold text-primary">{t("report.altFit").replace("{score}", String(a.fitScore))}</span>
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {a.reasons.map((r, j) => <li key={j} className="text-[10px] text-muted-foreground flex items-start gap-1"><span className="text-primary font-bold">•</span> {r}</li>)}
                    </ul>
                    <p className="mt-1.5 text-[10px] text-muted-foreground/80">
                      {t("report.altSummary")
                        .replace("{investment}", formatIndianCurrency(a.requiredInvestment))
                        .replace("{rev}", formatIndianCurrency(a.monthlyRevenue))
                        .replace("{profit}", formatIndianCurrency(a.monthlyProfit))
                        .replace("{margin}", String(a.margin))
                        .replace("{feasibility}", String(a.feasibilityScore))
                        .replace("{breakEven}", a.breakEvenMonth ? `~month ${a.breakEvenMonth}` : t("report.ninePlusMonths"))
                        .replace("{risk}", a.risk)}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Potential Government Schemes */}
          {schemeResult && (
            <Section title={t("report.secSchemes")}>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {t("report.schemesIntro")
                  .replace("{business}", business?.name || "")
                  .replace("{location}", `${location?.name}, ${location?.district}`)
                  .replace("{capital}", formatIndianCurrency(f.financial.availableContribution || capital))
                  .replace("{loan}", formatIndianCurrency(f.financial.potentialLoan))}
              </p>
              <div className="space-y-2.5">
                {schemeResult.matches.slice(0, 4).map((m) => (
                  <ReportSchemeRow key={m.scheme.id} m={m} />
                ))}
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground/70 leading-relaxed">
                {schemeResult.disclaimer} {schemeResult.verifyNote}
              </p>
            </Section>
          )}

          {/* Final Decision */}
          <Section title={t("report.secFinalDecision")}>
            <div className={cn(
              "rounded-xl border-2 p-5 mb-4",
              f.verdict === "good" ? "border-emerald-300 bg-emerald-50" : f.verdict === "caution" ? "border-amber-300 bg-amber-50" : "border-red-300 bg-red-50",
            )}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{getVerdictIcon(f.verdict)}</span>
                <p className={cn("text-xl font-bold", getVerdictColor(f.verdict))}>
                  {f.verdict === "good" ? t("report.goodToGo") : f.verdict === "caution" ? t("report.proceedCarefully") : t("report.considerAlternative")}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{f.decision.summary}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {t("report.swotStrengths")}</p>
                <ul className="space-y-1">{f.decision.whyPoints.map((p, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-emerald-500">•</span> {p}</li>)}</ul>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> {t("report.secRisks")}</p>
                <ul className="space-y-1">{f.decision.watchOuts.map((p, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-amber-500">•</span> {p}</li>)}</ul>
              </div>
            </div>
          </Section>

          {/* Action Plan */}
          <Section title={t("report.secActionPlan")}>
            <ol className="space-y-2">
              {f.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          {/* Disclaimer */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              {t("report.disclaimerText")}
            </p>
          </div>
        </div>
        )}

        {/* CTA */}
        <div className="flex justify-center gap-3 mt-8 mb-12">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("report.backToDashboard")} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

    </div>
  );
}

function ReportSchemeRow({ m }: { m: SchemeMatch }) {
  const { t } = useLanguage();
  const chip =
    m.level === "high"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : m.level === "possible"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-muted text-muted-foreground border-border";
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <p className="text-xs font-bold text-foreground">{m.scheme.name}</p>
        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide ${chip}`}>
          {m.level === "high" ? t("schemesSec.highMatch") : m.level === "possible" ? t("schemesSec.possibleMatch") : t("schemesSec.lowMatch")}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug mt-1">{m.scheme.shortDescription}</p>
      {m.reasons.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {m.reasons.slice(0, 2).map((r, i) => (
            <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
              <span className="text-emerald-600 font-bold">✓</span> {r.text}
            </li>
          ))}
        </ul>
      )}
      {m.level !== "high" && m.gaps.length > 0 && (
        <p className="mt-1.5 text-[10px] text-amber-700 leading-snug">≈ {m.gaps[0].text}</p>
      )}
      {m.level === "low" && m.exclusions.length > 0 && (
        <p className="mt-1.5 text-[10px] text-muted-foreground leading-snug">{m.exclusions[0].text}</p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 last:mb-0">
      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border">
        {title}
      </h2>
      {children}
    </div>
  );
}

function ReportStat({ label, value, tone }: { label: string; value: string; tone: "pos" | "mid" | "neg" | "neutral" }) {
  const cls =
    tone === "pos"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : tone === "mid"
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : tone === "neg"
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-muted/50 text-foreground";
  return (
    <div className={cn("rounded-lg border p-2.5 text-center", cls)}>
      <p className="text-[9px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-sm font-bold mt-0.5 capitalize">{value}</p>
    </div>
  );
}

function toneFor(kind: "pos" | "mid" | "neg"): "pos" | "mid" | "neg" | "neutral" {
  return kind;
}

function StatBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-lg p-2.5 text-center", highlight ? "bg-primary/5 border border-primary/10" : "bg-muted/50")}>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-bold mt-0.5", highlight ? "text-primary" : "text-foreground")}>{value}</p>
    </div>
  );
}
