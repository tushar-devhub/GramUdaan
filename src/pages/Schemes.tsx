import { useOnboarding } from "@/lib/onboarding-context";
import { useLanguage } from "@/i18n/LanguageContext";
import { ModuleHeader, ModuleEmptyState, StatCard } from "@/components/module-ui";
import SchemesSection from "@/components/SchemesSection";
import { formatIndianCurrency } from "@/data/assessment";
import { Landmark, FileText, ShieldAlert, ArrowRight } from "lucide-react";
import { Link } from "react-router";

export default function Schemes() {
  const { feasibility: f, business, location } = useOnboarding();
  const { t } = useLanguage();

  if (!f || !business || !location) {
    return (
      <ModuleEmptyState
        title={t("schemes.emptyTitle")}
        description={t("schemes.emptyDesc")}
      />
    );
  }

  const fin = f.financial;

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={<Landmark className="h-5 w-5" />}
        title={t("schemes.title")}
        badge={t("schemes.badge")}
        subtitle={t("schemes.subtitle")
          .replace("{business}", `${business.icon} ${business.name}`)
          .replace("{location}", `${location.name}, ${location.district}`)}
        actions={
          <Link to="/application" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90">
            <FileText className="h-3.5 w-3.5" /> {t("schemes.prepareAppDraft")}
          </Link>
        }
      />

      {/* Funding snapshot */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={t("schemes.projectCost")} value={formatIndianCurrency(fin.totalProjectCost)} sub={t("schemes.planEstimate")} />
        <StatCard label={t("schemes.yourCapital")} value={formatIndianCurrency(fin.availableContribution)} sub={t("schemes.ownContribution")} />
        <StatCard
          label={t("schemes.fundingNeed")}
          value={fin.potentialLoan > 0 ? formatIndianCurrency(fin.potentialLoan) : t("schemes.none")}
          tone={fin.potentialLoan > 0 ? "warning" : "positive"}
          sub={fin.potentialLoan > 0 ? t("schemes.fundingNeedSub") : t("schemes.capitalCovers")}
        />
        <StatCard label={t("schemes.matchedProfile")} value={`${business.name}`} sub={`${location.name}, ${location.district}`} className="truncate" />
      </div>

      {/* Scheme matching (existing engine + UI) */}
      <SchemesSection />

      {/* How to use this page */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <ShieldAlert className="h-4 w-4 text-amber-500" /> {t("schemes.readBeforeApplying")}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {t("schemes.readBeforeApplyingDesc")}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <FileText className="h-4 w-4 text-emerald-600" /> {t("schemes.nextStepTitle")}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {t("schemes.nextStepDesc")}
          </p>
          <Link to="/reports" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
            {t("schemes.seeAllReports")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
