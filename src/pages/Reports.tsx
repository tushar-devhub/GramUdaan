import { useOnboarding } from "@/lib/onboarding-context";
import { ModuleHeader } from "@/components/module-ui";
import { formatIndianCurrency } from "@/data/assessment";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
  const { feasibility: f, business, location, setFeasibility, setBusiness, setLocation, setCapital } = useOnboarding();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const savedReports = useQuery(api.reports.getUserReports) || [];
  const deleteReportMutation = useMutation(api.reports.deleteReport);

  const ready = Boolean(f && business && location);

  const handleDeleteReport = async (id: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteReportMutation({ id });
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
            {savedReports.map((report: any) => (
              <div
                key={report._id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1">
                        {t("reports.scoreBadge").replace("{score}", String(report.overallScore))}
                      </span>
                      <h3 className="text-sm font-bold text-foreground">{report.title}</h3>
                    </div>

                    <button
                      onClick={(e) => handleDeleteReport(report._id, e)}
                      title={t("reports.deleteReport")}
                      className="text-muted-foreground hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Store className="h-3.5 w-3.5 text-emerald-600" />
                      {report.businessName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" />
                      {report.locationName}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-foreground bg-slate-50 p-2.5 rounded-xl border flex items-center justify-between">
                    <span>{t("reports.estInvestment")}</span>
                    <span className="font-extrabold text-emerald-700">{formatIndianCurrency(report.capital)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold">
                  <span className="text-[11px] text-muted-foreground font-normal">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>

                  <Link
                    to="/report"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800"
                  >
                    {t("reports.viewReport")} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tools grid */}
      <div className="space-y-3 pt-4">
        <h2 className="text-base font-bold text-foreground">{t("reports.tools")}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tools.map((tItem) => (
            <Link
              key={tItem.to}
              to={tItem.to}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
            >
              <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", tItem.accent)} />
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition-colors group-hover:bg-emerald-600/10 group-hover:text-emerald-700">
                  {tItem.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{tItem.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tItem.desc}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-1 text-[10px] font-bold text-foreground/70">
                  <span className={cn("h-1.5 w-1.5 rounded-full", ready ? "bg-emerald-500" : "bg-amber-400")} />
                  {tItem.status}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                  {tItem.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="flex items-start gap-2 rounded-2xl border border-border bg-white px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <Download className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span>{t("reports.footerNote")}</span>
      </div>
    </div>
  );
}
