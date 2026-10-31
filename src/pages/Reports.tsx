import { useEffect, useState } from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { ModuleHeader } from "@/components/module-ui";
import { formatIndianCurrency } from "@/data/assessment";
import { getUserReports, deleteReport, type SupabaseReport } from "@/services/supabase/reports";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import {
  FileText,
  TrendingUp,
  IndianRupee,
  Compass,
  Scale,
  ArrowRight,
  Download,
  Trash2,
  Sparkles,
  Calendar,
  MapPin,
  Store,
  Bookmark,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { cn } from "@/lib/utils";

export default function Reports() {
  const { feasibility: f, business, location, setFeasibility, setBusiness, setLocation, setCapital, loadSavedReport } = useOnboarding();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [savedReports, setSavedReports] = useState<SupabaseReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const data = await getUserReports();
      setSavedReports(data);
    } catch (err) {
      console.error("[Reports] Error loading saved reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [isAuthenticated]);

  const ready = Boolean(f && business && location);

  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteReport(id);
      setSavedReports((prev) => prev.filter((r) => r.id !== id));
      toast.success(t("reports.deletedSuccess"));
    } catch (err) {
      console.error(err);
      toast.error(t("reports.deletedError"));
    }
  };

  const tools = [
    {
      to: "/report",
      icon: <TrendingUp className="h-5 w-5" />,
      title: t("reports.decisionReport"),
      desc: t("reports.decisionReportDesc"),
      accent: "from-emerald-500 to-emerald-700",
      status: ready
        ? t("reports.statusReady").replace("{score}", String(f!.overallScore))
        : t("reports.runAssessment"),
      cta: t("reports.openReport"),
    },
    {
      to: "/application",
      icon: <IndianRupee className="h-5 w-5" />,
      title: t("reports.loanDraft"),
      desc: t("reports.loanDraftDesc"),
      accent: "from-teal-500 to-emerald-600",
      status: ready
        ? t("reports.statusCost").replace("{cost}", formatIndianCurrency(f!.financial.totalProjectCost))
        : t("reports.runAssessment"),
      cta: t("reports.prepareDraft"),
    },
    {
      to: "/plan",
      icon: <Compass className="h-5 w-5" />,
      title: t("reports.advisoryJourney"),
      desc: t("reports.advisoryJourneyDesc"),
      accent: "from-sky-500 to-blue-600",
      status: ready
        ? t("reports.statusBiz").replace("{icon}", business!.icon || "").replace("{name}", business!.name)
        : t("reports.startJourney"),
      cta: t("reports.openJourney"),
    },
    {
      to: "/compare",
      icon: <Scale className="h-5 w-5" />,
      title: t("reports.compareBusinesses"),
      desc: t("reports.compareBusinessesDesc"),
      accent: "from-amber-500 to-orange-600",
      status: ready
        ? t("reports.statusLoc").replace("{location}", location!.name)
        : t("reports.pickCompare"),
      cta: t("reports.compareNow"),
    },
  ];

  return (
    <div className="space-y-8">
      <ModuleHeader
        icon={<FileText className="h-5 w-5" />}
        title={t("reports.title")}
        subtitle={t("reports.subtitle")}
      />

      {/* SAVED REPORTS SECTION (USER ISOLATED) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-emerald-600" />
            <span>{t("reports.savedReports")}</span>
          </h2>
          <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {savedReports.length} {t("reports.saved")}
          </span>
        </div>

        {savedReports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-foreground">
              {t("reports.noSaved")}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {t("reports.noSavedDesc")}
            </p>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t("common.startAssessment")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedReports.map((report) => {
              const score = report.overall_score ?? report.overall_score ?? 0;
              const dateStr = report.created_at ? new Date(report.created_at).toLocaleDateString() : "";
              const bizName = report.business_name || "";
              const locName = report.location_name || "";

              return (
                <div
                  key={report.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1">
                          {t("reports.scoreBadge").replace("{score}", String(score))}
                        </span>
                        <h3 className="text-sm font-bold text-foreground">{report.title}</h3>
                      </div>

                      <button
                        onClick={(e) => handleDeleteReport(report.id, e)}
                        title={t("reports.deleteReport")}
                        className="text-muted-foreground hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Store className="h-3.5 w-3.5 text-emerald-600" />
                        {bizName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-blue-600" />
                        {locName}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-foreground bg-slate-50 p-2.5 rounded-xl border flex items-center justify-between">
                      <span>{t("reports.estInvestment")}</span>
                      <span className="font-extrabold text-emerald-700">{formatIndianCurrency(report.capital)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold">
                    <span className="text-[11px] text-muted-foreground font-normal">
                      {dateStr}
                    </span>

                    <button
                      onClick={() => {
                        loadSavedReport(report);
                        navigate(`/report?id=${report.id}`);
                      }}
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold"
                    >
                      {t("reports.viewReport")} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tools grid */}
      <div className="space-y-3 pt-4">
        <h2 className="text-base font-bold text-foreground">{t("reports.tools")}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                      tool.accent,
                    )}
                  >
                    {tool.icon}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{tool.status}</span>
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{tool.desc}</p>
              </div>
              <div className="mt-5 flex items-center gap-1 text-xs font-bold text-primary">
                <span>{tool.cta}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
