import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { demoScenarios, type DemoScenario } from "@/data/demos";
import { useOnboarding } from "@/lib/onboarding-context";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Store,
  IndianRupee,
  BarChart3,
  ShieldCheck,
  Target,
  TrendingUp,
  AlertTriangle,
  Users,
  Lightbulb,
  ArrowUpRight,
  Check,
  ChevronRight,
  Play,
  Sparkles,
  BrainCircuit,
  GitCompareArrows,
  FileText,
} from "lucide-react";
import { Link } from "react-router";

import { useLanguage } from "@/i18n/LanguageContext";

/* ─── Hero Section ─── */
function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#EDF3E3] via-[#F4F8EF] to-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,230,77,0.15),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-20 sm:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {t("landing.heroBadge")}
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
            {t("landing.heroTitlePre")}{" "}
            <span className="italic text-primary">{t("landing.heroTitleHighlight")}</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {t("landing.heroSubtitle")}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/onboarding"
              className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              {t("landing.checkMyIdea")}
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[11px] transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              {t("landing.seeHowItWorks")}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </div>

        {/* Product Visualization — Sample Analysis */}
        <div className="mt-12 sm:mt-16 mx-auto max-w-4xl">
          <div className="rounded-2xl border border-border/60 bg-white/90 backdrop-blur-sm p-5 sm:p-7 shadow-xl shadow-black/5">
            {/* Sample label */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {t("landing.sampleAnalysis")}
              </p>
              <span className="text-[10px] font-medium text-muted-foreground/50 bg-muted/50 px-2 py-0.5 rounded-full">
                {t("landing.demoData")}
              </span>
            </div>

            {/* Flow visualization */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2">
              <FlowCard
                icon={<MapPin className="h-5 w-5" />}
                title={t("vreport.location")}
                desc="Rampur, UP"
              />
              <Arrow />
              <FlowCard
                icon={<Store className="h-5 w-5" />}
                title={t("vreport.business")}
                desc="Dairy Farm"
              />
              <Arrow />
              <FlowCard
                icon={<IndianRupee className="h-5 w-5" />}
                title={t("onboarding.stepCapital")}
                desc="₹2,00,000"
              />
              <Arrow className="hidden sm:flex" />
              <div className="hidden sm:block">
                <FlowResult score={78} verdict={t("landing.goodPotential")} />
              </div>
            </div>
            <div className="sm:hidden mt-3">
              <FlowResult score={78} verdict={t("landing.goodPotential")} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#F4F8EF] px-4 py-3 min-w-[130px] sm:min-w-[140px]">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="text-sm font-bold text-foreground">{desc}</p>
      </div>
    </div>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <div className={`text-primary/30 ${className}`}>
      <ChevronRight className="h-5 w-5 rotate-90 sm:rotate-0" />
    </div>
  );
}

function FlowResult({ score, verdict }: { score: number; verdict: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200/60 px-5 py-3 min-w-[170px]">
      <div className="text-center">
        <span className="text-2xl font-bold text-emerald-600">{score}</span>
        <span className="text-xs text-emerald-500 block">/ 100</span>
      </div>
      <div className="border-l border-emerald-200 pl-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600/70">
          AI Analysis
        </p>
        <p className="text-sm font-bold text-emerald-700">🟢 {verdict}</p>
      </div>
    </div>
  );
}

/* ─── How It Works ─── */
function HowItWorks() {
  const { t } = useLanguage();
  const steps = [
    {
      num: "01",
      title: t("landing.step1Title"),
      desc: t("landing.step1Desc"),
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      num: "02",
      title: t("landing.step2Title"),
      desc: t("landing.step2Desc"),
      icon: <Store className="h-5 w-5" />,
    },
    {
      num: "03",
      title: t("landing.step3Title"),
      desc: t("landing.step3Desc"),
      icon: <IndianRupee className="h-5 w-5" />,
    },
    {
      num: "04",
      title: t("landing.step4Title"),
      desc: t("landing.step4Desc"),
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            {t("landing.simpleProcess")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">
            {t("landing.howItWorksTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            {t("landing.howItWorksSubtitle")}
          </p>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4">
          <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-border" />
          {steps.map((step) => (
            <div key={step.num} className="relative flex flex-col items-center text-center group">
              <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl bg-[#F4F8EF] border border-border/60 mb-4 transition-all duration-200 group-hover:shadow-md group-hover:border-primary/20 group-hover:-translate-y-0.5">
                <div className="flex flex-col items-center">
                  <div className="text-primary">{step.icon}</div>
                  <span className="mt-1 text-[10px] font-bold text-primary/60">{step.num}</span>
                </div>
              </div>
              <h3 className="text-base font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-[240px] leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── What We Analyze (with sample metrics) ─── */
function WhatWeAnalyze() {
  const { t } = useLanguage();
  const pillars = [
    {
      icon: <Users className="h-5 w-5" />,
      title: t("landing.marketReachTitle"),
      desc: t("landing.marketReachDesc"),
      metric: "≈ 4,200 households",
      metricLabel: "Example reach",
      color: "bg-blue-50 text-blue-600 border-blue-200/60",
    },
    {
      icon: <Lightbulb className="h-5 w-5" />,
      title: t("landing.opportunityTitle"),
      desc: t("landing.opportunityDesc"),
      metric: "3 underserved categories",
      metricLabel: "Example finding",
      color: "bg-amber-50 text-amber-600 border-amber-200/60",
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: t("landing.swotTitle"),
      desc: t("landing.swotDesc"),
      metric: "Personalized to your situation",
      metricLabel: "Generated for you",
      color: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: t("landing.risksTitle"),
      desc: t("landing.risksDesc"),
      metric: "3 key risks identified",
      metricLabel: "Example output",
      color: "bg-red-50 text-red-600 border-red-200/60",
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: t("landing.competitionTitle"),
      desc: t("landing.competitionDesc"),
      metric: "18 similar businesses",
      metricLabel: "Example count",
      color: "bg-purple-50 text-purple-600 border-purple-200/60",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: t("landing.pricingTitle"),
      desc: t("landing.pricingDesc"),
      metric: "₹58–₹64 range",
      metricLabel: "Example pricing",
      color: "bg-cyan-50 text-cyan-600 border-cyan-200/60",
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-gradient-to-b from-white to-[#F4F8EF]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            {t("landing.whatWeAnalyzeBadge")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">
            {t("landing.whatWeAnalyzeTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            {t("landing.whatWeAnalyzeSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-border/60 bg-white p-5 sm:p-6 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 group"
            >
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${p.color} mb-3`}
              >
                {p.icon}
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{p.desc}</p>
              {/* Sample metric */}
              <div className="rounded-lg bg-muted/40 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{p.metric}</span>
                <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                  {p.metricLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Financial Planning Section ─── */
function FinancialPlanning() {
  const { t } = useLanguage();
  const items = [
    {
      icon: <IndianRupee className="h-5 w-5" />,
      title: t("landing.smartCapitalTitle"),
      desc: t("landing.smartCapitalDesc"),
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: t("landing.revenueEstimatesTitle"),
      desc: t("landing.revenueEstimatesDesc"),
    },
    {
      icon: <Check className="h-5 w-5" />,
      title: t("landing.clearGoTitle"),
      desc: t("landing.clearGoDesc"),
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              {t("landing.financialClarityBadge")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              {t("landing.financialPlanningTitle")}
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {t("landing.financialPlanningDesc")}
            </p>
            <Link
              to="/onboarding"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("landing.startYourAnalysis")}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-2xl border border-border/60 bg-[#F4F8EF] p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Trust Section (with data trust legend) ─── */
function TrustSection() {
  const { t } = useLanguage();
  return (
    <section id="trust" className="py-16 sm:py-20 bg-[#F4F8EF]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">
            {t("landing.trustTitle")}
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
            {t("landing.trustDesc")}
          </p>

          {/* Data Trust Legend */}
          <div className="mt-6 inline-flex items-center gap-3 sm:gap-4 rounded-full border border-border/60 bg-white px-5 py-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">✓</span>
              {t("landing.verified")}
            </span>
            <span className="h-4 w-4 border-l border-border" />
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
              <span className="h-4 w-4 rounded-full bg-amber-100 flex items-center justify-center text-[10px]">≈</span>
              {t("landing.estimated")}
            </span>
            <span className="h-4 w-4 border-l border-border" />
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
              <span className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">🤖</span>
              {t("landing.aiInsight")}
            </span>
          </div>

          {/* Confidence indicators */}
          <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t("landing.highConfidence")}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {t("landing.mediumConfidence")}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> {t("landing.lowConfidence")}
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "✓", label: t("landing.verified"), desc: t("landing.trustDesc") },
              { icon: "≈", label: t("landing.estimated"), desc: t("landing.clearGoDesc") },
              { icon: "🛡️", label: t("landing.trustTitle"), desc: t("landing.heroSubtitle") },
            ].map((tItem, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/60 bg-white p-5 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="text-2xl mb-2">{tItem.icon}</div>
                <h4 className="text-sm font-bold text-foreground">{tItem.label}</h4>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{tItem.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── What's Inside ─── */
function WhatsInside() {
  const { t } = useLanguage();
  const features = [
    {
      icon: <BrainCircuit className="h-5 w-5" />,
      title: t("nav.advisor"),
      desc: "Ask context-aware questions about your assessment. The AI understands your location, business, capital and all analysis results.",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: t("nav.whatIf"),
      desc: "Change your capital, business type or location and instantly see how the analysis changes. Compare scenarios side by side.",
    },
    {
      icon: <GitCompareArrows className="h-5 w-5" />,
      title: t("nav.compare"),
      desc: "Compare 2–3 business ideas across market reach, competition, risk and financial fit to find your best option.",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: t("reports.decisionReport"),
      desc: "A professional report with all your analysis, financial structure and action plan — ready to share with bank officers or partners.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            {t("landing.beyondFeasibility")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">
            {t("landing.everythingToDecide")}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border/60 bg-[#F4F8EF] p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Demo Mode (interactive) ─── */
function DemoMode() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { loadDemo } = useOnboarding();

  const handleDemoClick = useCallback(
    (demo: DemoScenario) => {
      loadDemo(demo);
      navigate("/dashboard");
    },
    [loadDemo, navigate],
  );

  const verdictColors = {
    good: "text-emerald-600 bg-emerald-50",
    caution: "text-amber-600 bg-amber-50",
    rethink: "text-red-600 bg-red-50",
  };

  return (
    <section className="py-16 sm:py-20 bg-[#F4F8EF]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            {t("landing.tryItNow")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">
            {t("landing.demoScenarios")}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            {t("landing.demoSubtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoScenarios.map((demo) => (
            <button
              key={demo.id}
              onClick={() => handleDemoClick(demo)}
              className="text-left rounded-2xl border border-border/60 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 hover:border-primary/20 group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{demo.icon}</span>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", verdictColors[demo.verdict])}>
                  {demo.verdict === "good" ? "🟢 GOOD" : demo.verdict === "caution" ? "🟡 CAUTION" : "🔴 RETHINK"}
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">{demo.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{demo.description}</p>

              {/* Edge case callout for scheme limit */}
              {demo.id === "demo-scheme-edge" && (
                <div className="rounded-lg bg-amber-50 border border-amber-200/60 px-3 py-2 mb-3">
                  <p className="text-[10px] font-semibold text-amber-700">
                    ₹6L → ₹60L project → exceeds ₹50L scheme limit
                  </p>
                  <p className="text-[10px] text-amber-600 mt-0.5">
                    Shows compliant financing structure
                  </p>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:gap-2.5 transition-all">
                <Play className="h-3 w-3" /> {t("landing.tryDemo")}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA (compact) ─── */
function FinalCTA() {
  const { t } = useLanguage();
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-[#F4F8EF] to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-primary p-8 sm:p-10 text-center text-primary-foreground overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,230,77,0.12),transparent_60%)]" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              {t("landing.readyToCheck")}
            </h2>
            <p className="text-primary-foreground/70 text-sm sm:text-base max-w-lg mx-auto mb-6">
              {t("landing.readyDesc")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-primary hover:bg-white/90 transition-all shadow-lg"
              >
                {t("landing.checkMyIdea")}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px]">
                  →
                </span>
              </Link>
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-primary-foreground/80 hover:bg-white/10 transition-colors"
              >
                <Play className="h-4 w-4" /> {t("landing.tryDemo")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Landing Page ─── */
export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhatWeAnalyze />
        <FinancialPlanning />
        <WhatsInside />
        <TrustSection />
        <DemoMode />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
