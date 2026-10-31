import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/lib/onboarding-context";
import { useLanguage } from "@/i18n/LanguageContext";
import { getUserReports, type SupabaseReport } from "@/services/supabase/reports";
import { formatIndianCurrency } from "@/data/assessment";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  FileText,
  Bookmark,
  Store,
  ArrowRight,
  ShieldCheck,
  Landmark,
  Bot,
  MapPin,
  Calendar,
  Wallet,
  Scale,
  Compass,
  Calculator,
  PlusCircle,
  Clock,
  ArrowUpRight,
  ChevronRight,
  HelpCircle,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EntrepreneurDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { business, location, capital, feasibility } = useOnboarding();
  const navigate = useNavigate();

  const [reports, setReports] = useState<SupabaseReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        setIsLoadingReports(true);
        const data = await getUserReports();
        setReports(data);
      } catch (err) {
        console.error("[EntrepreneurDashboard] Error loading reports:", err);
      } finally {
        setIsLoadingReports(false);
      }
    }
    fetchReports();
  }, []);

  const totalReportsCount = reports.length;
  const uniqueBusinessesCount = new Set(reports.map((r) => r.business_id)).size || (business ? 1 : 0);
  const avgScore =
    totalReportsCount > 0
      ? Math.round(reports.reduce((acc, r) => acc + (r.overall_score || 0), 0) / totalReportsCount)
      : feasibility?.overallScore || 0;

  // Curated rural recommendations
  const topRecommendations = [
    {
      id: "dairy",
      title: "Dairy Farm & Milk Chilling Center",
      titleHi: "डेयरी फार्म एवं दुग्ध संकलन केंद्र",
      category: "Agri-Allied",
      investmentRange: "₹3.5L – ₹8.0L",
      feasibilityScore: 84,
      tag: "High Demand",
      icon: "🐄",
    },
    {
      id: "food-processing",
      title: "Flour & Spice Processing Micro-Unit",
      titleHi: "आटा एवं मसाला प्रसंस्करण इकाई",
      category: "Processing",
      investmentRange: "₹2.0L – ₹5.0L",
      feasibilityScore: 81,
      tag: "Govt Subsidy",
      icon: "🌾",
    },
    {
      id: "retail",
      title: "Rural Agri-Input & Hardware Store",
      titleHi: "कृषि इनपुट एवं हार्डवेयर स्टोर",
      category: "Retail",
      investmentRange: "₹1.5L – ₹4.0L",
      feasibilityScore: 78,
      tag: "Fast Break-Even",
      icon: "🏪",
    },
  ];

  // Government schemes preview
  const featuredSchemes = [
    {
      name: "Pradhan Mantri MUDRA Yojana (Tarun)",
      nameHi: "प्रधानमंत्री मुद्रा योजना (तरुण)",
      maxLoan: "₹10,00,000",
      subsidy: "Collateral-Free Credit Guarantee",
      category: "Working Capital & Machinery",
      link: "/schemes",
    },
    {
      name: "PMEGP (Credit-Linked Subsidy)",
      nameHi: "प्रधानमंत्री रोजगार सृजन कार्यक्रम",
      maxLoan: "₹50,00,000",
      subsidy: "Up to 35% Capital Subsidy",
      category: "Manufacturing & Service",
      link: "/schemes",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. WELCOME BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#064E3B] via-[#065F46] to-[#0D9488] p-6 sm:p-8 text-white shadow-sm">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
              <span>GramUdaan Entrepreneur Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === "hi"
                ? `नमस्ते, ${user?.name || "उद्यमी"}!`
                : `Welcome back, ${user?.name || "Entrepreneur"}!`}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Evaluate new business models, compare startup investments, and review your loan readiness reports with hyperlocal intelligence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-emerald-950 shadow-md hover:bg-emerald-50 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="h-4 w-4 text-emerald-700" />
              <span>Start New Analysis</span>
            </Link>
            <Link
              to="/advisor"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-900/60 border border-white/20 px-4 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-900/80 transition-colors"
            >
              <Bot className="h-4 w-4 text-emerald-300" />
              <span>Ask AI Advisor</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. KEY METRIC STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Reports</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalReportsCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Saved decision models</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Businesses Analyzed</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{uniqueBusinessesCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Unique category tests</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Readiness</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {avgScore > 0 ? `${avgScore}/100` : "—"}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {avgScore >= 70 ? "Viable investment range" : "Requires assessment"}
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Capital</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {capital > 0 ? formatIndianCurrency(capital) : "₹0"}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Configured equity</p>
        </div>
      </div>

      {/* ── 3. RECENT FEASIBILITY REPORTS (USER ISOLATED) ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-emerald-700" />
              <span>Recent Feasibility Reports</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive decision scorecards generated for your rural enterprise ideas.
            </p>
          </div>
          <Link
            to="/reports"
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
          >
            View All ({reports.length}) <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoadingReports ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-emerald-700 animate-spin" />
            <span>Loading saved reports from Supabase...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100/60 text-emerald-800">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Feasibility Reports Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Start by running a free 2-minute business assessment. We will analyze local competition, startup costs, and loan eligibility for your village.
            </p>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-900 transition-colors shadow-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Start First Assessment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {reports.slice(0, 3).map((report) => (
              <div
                key={report.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4.5 hover:border-emerald-300 hover:shadow-xs transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      Score: {report.overall_score}/100
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {report.created_at ? new Date(report.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                      {report.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Store className="h-3 w-3 text-emerald-600" />
                        {report.business_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-blue-600" />
                        {report.location_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-500">Capital Needed:</span>
                    <span className="font-bold text-emerald-900">
                      {formatIndianCurrency(report.capital)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-[11px] text-slate-400 font-normal">
                    Verdict: {report.verdict_label || "Analyzed"}
                  </span>
                  <Link
                    to="/report"
                    className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold"
                  >
                    View Report <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. RECOMMENDED BUSINESS OPPORTUNITIES ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-700" />
              <span>Recommended Rural Opportunities</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              High-potential micro-enterprise ideas tailored for rural and semi-urban catchments.
            </p>
          </div>
          <Link
            to="/compare"
            className="text-xs font-semibold text-emerald-800 hover:underline"
          >
            Compare All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{rec.icon}</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    {rec.tag}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === "hi" ? rec.titleHi : rec.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">{rec.category}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Est. Investment:</span>
                    <span className="font-bold text-slate-800">{rec.investmentRange}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Viability Score:</span>
                    <span className="font-extrabold text-emerald-800">{rec.feasibilityScore}/100</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link
                  to="/onboarding"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-colors"
                >
                  Analyze This Business <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. GOVERNMENT SCHEMES & SUBSIDIES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-emerald-700" />
              <span>Government Funding & Schemes</span>
            </h3>
            <Link to="/schemes" className="text-xs font-semibold text-emerald-800 hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {featuredSchemes.map((scheme, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    {language === "hi" ? scheme.nameHi : scheme.name}
                  </h4>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
                    Max: {scheme.maxLoan}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{scheme.subsidy}</p>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400">{scheme.category}</span>
                  <Link to="/schemes" className="font-semibold text-emerald-800 hover:underline">
                    Check Eligibility
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 6. AI ADVISOR QUICK ACCESS ── */}
        <div className="bg-gradient-to-br from-[#064E3B] to-[#042f24] rounded-3xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-200 border border-emerald-300/30">
              <Bot className="h-3.5 w-3.5 text-emerald-300" />
              <span>24/7 AI Business Advisor</span>
            </div>
            <h3 className="text-lg font-bold text-white">Ask GramUdaan AI Anything</h3>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Trained on rural Indian economics, AGMARKNET mandi price data, and bank subsidy criteria.
            </p>

            <div className="space-y-2 pt-2">
              {[
                "गांव में आटा चक्की शुरू करने के लिए कितना खर्च आएगा?",
                "MUDRA लोन के लिए कौन से डॉक्यूमेंट्स लगते हैं?",
                "डेयरी फार्मिंग में ब्रेक-ईवन कितने महीनों में होता है?",
              ].map((q, idx) => (
                <Link
                  key={idx}
                  to="/advisor"
                  className="block p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs text-emerald-100 transition-colors"
                >
                  💬 {q}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <Link
              to="/advisor"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-950 hover:bg-emerald-50 transition-colors shadow-sm"
            >
              Open AI Advisor Chat <ArrowRight className="h-3.5 w-3.5 text-emerald-700" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
