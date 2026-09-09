import React, { useMemo, useState } from "react";
import type { FeasibilityData } from "@/data/feasibility-types";
import type { Location } from "@/data/locations";
import type { BusinessCategory } from "@/data/businesses";
import type { CanonicalAnalysisResult } from "@/types/dataIntegration";
import { formatIndianCurrency } from "@/data/assessment";
import { useLanguage } from "@/i18n/LanguageContext";
import { speakMessage } from "@/services/voiceService";
import {
  Store,
  MapPin,
  Wallet,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowDown,
  Layers,
  PieChart,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  Printer,
  Calendar,
  Users,
  Building2,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VisualDecisionReportProps {
  feasibility?: FeasibilityData | null;
  analysisResult?: CanonicalAnalysisResult | null;
  location: Location | null;
  business: BusinessCategory | null;
  capital: number;
  radius: number;
}

export function VisualDecisionReport({
  feasibility: f,
  analysisResult,
  location,
  business,
  capital,
  radius,
}: VisualDecisionReportProps) {
  const { language, t } = useLanguage();
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // Deterministic calculation values from CanonicalAnalysisResult or fallback to feasibility
  const totalInvestment = analysisResult ? analysisResult.costs.totalSetupCost.value : (f?.costBreakdown?.total || f?.financial.totalProjectCost || 0);
  const ownCapital = analysisResult ? analysisResult.capitalFit.userCapital.value : (f?.financial.availableContribution || capital || 0);
  const loanNeed = analysisResult ? analysisResult.capitalFit.fundingGap.value : (f?.financial.potentialLoan || Math.max(0, totalInvestment - ownCapital));
  const monthlyRev = analysisResult ? analysisResult.revenue.monthlyRevenueEstimateMax.value : (f?.profitModel?.monthlyRevenue || f?.financial.affordability?.expectedRevenue || 0);
  const monthlyExp = analysisResult ? analysisResult.costs.monthlyOperatingExpenses.value : (f?.profitModel?.monthlyExpenses || f?.financial.affordability?.operatingCosts || 0);
  const monthlyProf = analysisResult ? analysisResult.profit.monthlyNetProfitMax.value : (f?.profitModel?.monthlyProfit || f?.financial.affordability?.cashFlow || 0);
  const breakEvenMo = analysisResult ? analysisResult.breakEven.monthsToBreakEven.value : (f?.profitModel?.breakEvenMonth || 6);
  const overallScore = analysisResult ? analysisResult.feasibilityScore.value : (f?.overallScore || 50);
  const verdictCode = analysisResult ? (analysisResult.decision.code === "START" ? "good" : analysisResult.decision.code === "PROCEED_CAREFULLY" ? "caution" : "rethink") : (f?.verdict || "caution");
  const verdictLabel = analysisResult ? analysisResult.decision.labelHi : (f?.verdictLabel || "सावधानी से आगे बढ़ें");

  // Decision State
  const decisionBadge =
    verdictCode === "good"
      ? { label: language === "hi" ? "हमारा सुझाव: शुरू करने के लिए उपयुक्त" : t("decision.start"), color: "bg-emerald-600 text-white border-emerald-700" }
      : verdictCode === "caution"
      ? { label: language === "hi" ? "हमारा सुझाव: सावधानी से आगे बढ़ें" : t("decision.proceedCarefully"), color: "bg-amber-500 text-white border-amber-600" }
      : { label: language === "hi" ? "हमारा सुझाव: विचार दोबारा करें" : t("decision.rethink"), color: "bg-red-600 text-white border-red-700" };


  // Voice narration text
  const voiceExplanation = language === "hi"
    ? `फैसला रिपोर्ट का सारांश: आपके पास ${formatIndianCurrency(ownCapital)} उपलब्ध हैं। ${business?.name || "व्यवसाय"} के लिए कुल ${formatIndianCurrency(totalInvestment)} लगेंगे। आपका व्यवहार्यता स्कोर 100 में से ${overallScore} है। हमारा सुझाव है: ${verdictLabel}। अनुमानित मासिक बिक्री ${formatIndianCurrency(monthlyRev)} और मासिक मुनाफ़ा ${formatIndianCurrency(monthlyProf)} है।`
    : `Decision Report Summary: You have ${formatIndianCurrency(ownCapital)} available capital. For ${business?.name || "this business"}, estimated total investment is ${formatIndianCurrency(totalInvestment)}. Your feasibility score is ${overallScore} out of 100. Verdict: ${verdictLabel}. Estimated monthly revenue is ${formatIndianCurrency(monthlyRev)} and monthly profit is ${formatIndianCurrency(monthlyProf)}.`;

  const handleVoiceToggle = () => {
    if (isPlayingVoice) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
    } else {
      setIsPlayingVoice(true);
      speakMessage(voiceExplanation, language === "hi" ? "hi-IN" : "en-US", () => {
        setIsPlayingVoice(false);
      });
    }
  };

  const decisionSummary = analysisResult ? analysisResult.decision.summaryHi : (f?.decision?.summary || "");
  const householdsCount = analysisResult ? analysisResult.demographics.households.value : (f?.marketReach?.households || 0);
  const existingBusinesses = f?.opportunity?.existingBusinesses || [];
  const riskList = analysisResult ? analysisResult.risks.map(r => ({ id: r.id, name: r.whatHi, severity: r.severity.toLowerCase(), explanation: r.whyHi, mitigation: r.actionHi })) : (f?.risks || []);
  const alternativesList = analysisResult ? analysisResult.alternatives.map(a => ({ businessId: a.businessId, businessName: a.businessNameHi, requiredInvestment: totalInvestment, monthlyProfit: monthlyProf, feasibilityScore: a.score, icon: "💡" })) : (f?.alternatives || []);

  return (
    <div className="space-y-8 bg-slate-50/50 p-4 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-4xl mx-auto font-sans">
      
      {/* ── TOP HEADER & VOICE ADVISOR BAR ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {t("vreport.badge")}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              GramUdaan v1.0
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {t("question.shouldIStart")}
          </h1>
        </div>
        
        <button
          onClick={handleVoiceToggle}
          className={cn(
            "flex items-center gap-2.5 px-5 py-3 rounded-full text-sm font-bold shadow-sm transition-all shrink-0",
            isPlayingVoice
              ? "bg-amber-500 text-white animate-pulse"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          )}
        >
          {isPlayingVoice ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          <span>{isPlayingVoice ? t("vreport.voiceStop") : t("vreport.voiceListen")}</span>
        </button>
      </div>

      {/* ── SECTION 1: BUSINESS IDEA OVERVIEW ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Store className="h-4 w-4 text-emerald-600" />
          <span>{t("vreport.sec1Title")}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-semibold">{t("vreport.business")}</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{business?.icon} {business?.name || "General Business"}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-semibold">{t("vreport.location")}</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{location?.name}, {location?.district}</p>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
            <p className="text-xs text-emerald-700 font-semibold">{t("vreport.availableCapital")}</p>
            <p className="text-xl font-extrabold text-emerald-800 mt-1">{formatIndianCurrency(ownCapital)}</p>
          </div>

          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-700 font-semibold">{t("vreport.totalInvestment")}</p>
            <p className="text-xl font-extrabold text-blue-800 mt-1">{formatIndianCurrency(totalInvestment)}</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 7: FEASIBILITY SCORE CENTERPIECE ── */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-8 rounded-3xl shadow-lg text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="h-48 w-48 text-emerald-400" />
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
          {t("vreport.feasibilityScore")}
        </p>

        <div className="inline-flex items-center justify-center h-32 w-32 rounded-full border-4 border-emerald-400 bg-white/10 my-3 backdrop-blur-sm">
          <span className="text-5xl font-black tracking-tight">{overallScore}</span>
          <span className="text-sm font-semibold text-emerald-300">/100</span>
        </div>

        <div className="mt-2">
          <span className={cn("inline-block px-6 py-2 rounded-full text-base font-bold uppercase border shadow-md", decisionBadge.color)}>
            {decisionBadge.label}
          </span>
        </div>

        <p className="text-sm text-slate-300 max-w-lg mx-auto mt-4 leading-relaxed">
          {decisionSummary}
        </p>

        {/* Breakdown bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-left text-xs">
          <div>
            <span className="text-slate-400">{t("vreport.marketReach")}:</span>
            <span className="float-right font-bold text-emerald-300">{overallScore >= 75 ? "85%" : "65%"}</span>
            <div className="h-1.5 w-full bg-white/20 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${overallScore >= 75 ? 85 : 65}%` }} />
            </div>
          </div>

          <div>
            <span className="text-slate-400">{t("vreport.financialFit")}:</span>
            <span className="float-right font-bold text-emerald-300">{ownCapital >= totalInvestment ? "90%" : "70%"}</span>
            <div className="h-1.5 w-full bg-white/20 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${ownCapital >= totalInvestment ? 90 : 70}%` }} />
            </div>
          </div>

          <div>
            <span className="text-slate-400">{t("vreport.competition")}:</span>
            <span className="float-right font-bold text-emerald-300">75%</span>
            <div className="h-1.5 w-full bg-white/20 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: "75%" }} />
            </div>
          </div>

          <div>
            <span className="text-slate-400">{t("vreport.riskIndex")}:</span>
            <span className="float-right font-bold text-amber-300">{t("hyperlocal.densityMedium")}</span>
            <div className="h-1.5 w-full bg-white/20 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: "60%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: LOCATION RESULT FLOW ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-600" />
          <span>{t("vreport.sec2Title")}</span>
        </h2>

        {/* Visual Step Flow */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-center p-3 bg-white rounded-lg border border-slate-200 w-full md:w-auto flex-1">
            <span className="text-2xl">📍</span>
            <p className="text-xs font-bold text-slate-900 mt-1">{location?.name}</p>
            <p className="text-[10px] text-slate-500">{location?.district}</p>
          </div>

          <ArrowRight className="h-5 w-5 text-slate-400 hidden md:block shrink-0" />
          <ArrowDown className="h-5 w-5 text-slate-400 md:hidden shrink-0" />

          <div className="text-center p-3 bg-white rounded-lg border border-slate-200 w-full md:w-auto flex-1">
            <span className="text-2xl">👥</span>
            <p className="text-xs font-bold text-slate-900 mt-1">{householdsCount.toLocaleString("en-IN")} {t("vreport.households")}</p>
            <p className="text-[10px] text-slate-500">{f?.marketReach?.nearbyVillages || 3} {t("vreport.nearbyVillages")}</p>
          </div>

          <ArrowRight className="h-5 w-5 text-slate-400 hidden md:block shrink-0" />
          <ArrowDown className="h-5 w-5 text-slate-400 md:hidden shrink-0" />

          <div className="text-center p-3 bg-white rounded-lg border border-slate-200 w-full md:w-auto flex-1">
            <span className="text-2xl">🏪</span>
            <p className="text-xs font-bold text-slate-900 mt-1">{existingBusinesses.length} {t("vreport.localShops")}</p>
            <p className="text-[10px] text-slate-500">{t("vreport.competition")}</p>
          </div>

          <ArrowRight className="h-5 w-5 text-slate-400 hidden md:block shrink-0" />
          <ArrowDown className="h-5 w-5 text-slate-400 md:hidden shrink-0" />

          <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-300 w-full md:w-auto flex-1">
            <span className="text-2xl">✅</span>
            <p className="text-xs font-bold text-emerald-800 mt-1">{t("vreport.locationSuitable")}</p>
            <p className="text-[10px] text-emerald-600 font-semibold">{t("vreport.dataSource")}</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: INVESTMENT ALLOCATION DIAGRAM ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <PieChart className="h-4 w-4 text-emerald-600" />
          <span>{t("vreport.sec3Title")}</span>
        </h2>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-center text-sm font-bold text-slate-900 border-b pb-2">
            <span>{t("vreport.totalInvRequired")}</span>
            <span className="text-emerald-700 text-lg">{formatIndianCurrency(totalInvestment)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {f?.costBreakdown?.components.filter(c => c.amount > 0).slice(0, 6).map((c) => (
              <div key={c.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium block">{language === "hi" ? (c.labelHi || c.label) : c.label}</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">{formatIndianCurrency(c.amount)}</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold mt-1 inline-block">
                  {c.source === "benchmark" ? (language === "hi" ? "मानक" : "benchmark") : (language === "hi" ? "इनपुट" : c.source)}
                </span>
              </div>
            )) || (
              <div className="col-span-3 text-xs text-slate-500">{t("vreport.stdCostApplied")}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 4 & 5: REVENUE, PROFIT TIMELINE & BREAK-EVEN ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* REVENUE FLOW */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span>{t("vreport.sec4Title")}</span>
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800">{t("vreport.estMonthlySales")}</span>
              <span className="text-base font-extrabold text-emerald-800">{formatIndianCurrency(monthlyRev)}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
              <span className="text-xs font-bold text-red-800">{t("vreport.estMonthlyExpenses")}</span>
              <span className="text-base font-extrabold text-red-800">− {formatIndianCurrency(monthlyExp)}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">{t("vreport.netMonthlyProfit")}</span>
              <span className="text-xl font-extrabold text-emerald-300">= {formatIndianCurrency(monthlyProf)}</span>
            </div>
          </div>
        </div>

        {/* PROFIT TIMELINE & BREAK EVEN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <span>{t("vreport.sec5Title")}</span>
          </h2>

          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <Sparkles className="h-4 w-4" />
              <span>{t("vreport.breakEvenEst")}: {breakEvenMo}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t("vreport.breakEvenDesc")} {breakEvenMo}.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-slate-50 rounded-lg border">
              <span className="block text-[10px] text-slate-500 font-semibold">{t("vreport.months12")}</span>
              <span className="block font-bold text-slate-800 mt-0.5">{t("vreport.setupPhase")}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border">
              <span className="block text-[10px] text-slate-500 font-semibold">{t("vreport.breakEven")}</span>
              <span className="block font-bold text-emerald-700 mt-0.5">{breakEvenMo}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border">
              <span className="block text-[10px] text-slate-500 font-semibold">{t("vreport.month12Plus")}</span>
              <span className="block font-bold text-emerald-800 mt-0.5">{t("vreport.steadyProfit")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 6: RISKS & ACTIONS ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-emerald-600" />
          <span>{t("vreport.sec6Title")}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {riskList.slice(0, 4).map((risk) => (
            <div key={risk.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{risk.name}</span>
                <span className={cn(
                  "text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border",
                  risk.severity === "high" ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"
                )}>
                  {risk.severity === "high" ? t("vreport.highRisk") : t("vreport.mediumRisk")}
                </span>
              </div>
              <p className="text-xs text-slate-600">{risk.explanation}</p>
              <div className="pt-2 border-t border-slate-200/80">
                <p className="text-[11px] font-bold text-emerald-700">
                  💡 {t("vreport.action")} {risk.mitigation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 9: ACTION ROADMAP ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-600" />
          <span>{t("vreport.sec8Title")}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { num: "1️⃣", title: t("vreport.roadmapStep1Title"), desc: t("vreport.roadmapStep1Desc") },
            { num: "2️⃣", title: t("vreport.roadmapStep2Title"), desc: t("vreport.roadmapStep2Desc") },
            { num: "3️⃣", title: t("vreport.roadmapStep3Title"), desc: t("vreport.roadmapStep3Desc") },
            { num: "4️⃣", title: t("vreport.roadmapStep4Title"), desc: t("vreport.roadmapStep4Desc") },
          ].map((step, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xl">{step.num}</span>
              <p className="text-xs font-bold text-slate-900">{step.title}</p>
              <p className="text-[11px] text-slate-500 leading-snug">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 10: ALTERNATIVES (IF APPLICABLE) ── */}
      {alternativesList.length > 0 && (
        <div className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-200 space-y-4">
          <h2 className="text-sm font-bold text-emerald-900 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>{t("vreport.sec9Title")}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {alternativesList.map((alt) => (
              <div key={alt.businessId} className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold text-slate-900">{alt.icon} {alt.businessName}</p>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {t("whatif.lblScore")} {alt.feasibilityScore}/100
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {t("vreport.altRequired")} {formatIndianCurrency(alt.requiredInvestment)} · {t("vreport.altProfit")} {formatIndianCurrency(alt.monthlyProfit)}{t("vreport.altPerMonth")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISCLAIMER FOOTER */}
      <div className="text-center pt-4 border-t border-slate-200 text-[11px] text-slate-400 leading-relaxed">
        {t("vreport.disclaimer")}
      </div>

    </div>
  );
}
