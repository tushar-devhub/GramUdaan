import { useOnboarding } from "@/lib/onboarding-context";
import { useLanguage } from "@/i18n/LanguageContext";
import { ModuleHeader, ModuleEmptyState, StatCard } from "@/components/module-ui";
import { FinancialOverviewSection } from "@/pages/Dashboard";
import GramUdaanInsights from "@/components/GramUdaanInsights";
import { formatIndianCurrency } from "@/data/assessment";
import { Wallet, ArrowRight, Calculator, Compass, FileText } from "lucide-react";
import { Link } from "react-router";

export default function Finance() {
  const { t } = useLanguage();
  const { feasibility: f, business, capital } = useOnboarding();

  if (!f || !business) {
    return (
      <ModuleEmptyState
        title={t("finance.emptyTitle")}
        description={t("finance.emptyDesc")}
      />
    );
  }

  const fin = f.financial;
  const monthlyRevenue = f.profitModel?.monthlyRevenue ?? fin.affordability?.expectedRevenue ?? null;
  const monthlyProfit = f.profitModel?.monthlyProfit ?? (fin.affordability ? fin.affordability.cashFlow - (fin.affordability.monthlyRepayment || 0) : null);

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={<Wallet className="h-5 w-5" />}
        title={t("finance.title")}
        badge={t("finance.badge")}
        subtitle={t("finance.subtitle").replace("{business}", `${business.icon} ${business.name}`)}
        actions={
          <>
            <Link to="/plan" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted">
              <Compass className="h-3.5 w-3.5" /> {t("finance.guidedJourney")}
            </Link>
            <Link to="/what-if" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90">
              <Calculator className="h-3.5 w-3.5" /> {t("finance.whatIfSimulator")}
            </Link>
          </>
        }
      />

      {/* At a glance */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={t("finance.availableCapital")} value={formatIndianCurrency(fin.availableContribution || capital || 0)} sub={t("finance.ownContribution")} />
        <StatCard label={t("finance.totalProjectCost")} value={formatIndianCurrency(fin.totalProjectCost)} sub={t("finance.setupWorkingCapital")} tone={f.profitModel?.capital.fundingGap ? "warning" : "neutral"} />
        <StatCard
          label={t("finance.fundingGap")}
          value={f.profitModel ? formatIndianCurrency(f.profitModel.capital.fundingGap) : fin.potentialLoan > 0 ? formatIndianCurrency(fin.potentialLoan) : "₹0"}
          tone={f.profitModel?.capital.fundingGap ? "warning" : "positive"}
          sub={t("finance.arrangeViaLoan")}
        />
        {monthlyRevenue != null ? (
          <StatCard label={t("finance.estMonthlyProfit")} value={formatIndianCurrency(monthlyProfit ?? 0)} tone={(monthlyProfit ?? 0) >= 0 ? "positive" : "negative"} sub={t("finance.afterOperatingCosts")} />
        ) : (
          <StatCard label={t("finance.estMonthlyProfit")} value="—" sub={t("finance.unlocksAtBiz")} />
        )}
      </div>

      {/* Loan snapshot + funding structure */}
      <FinancialOverviewSection f={f} />

      {/* Deep financial model: breakdown, capital & scale, timeline, alternatives */}
      <GramUdaanInsights f={f} />

      {/* Module quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link to="/application" className="group rounded-2xl border border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <p className="flex items-center gap-2 text-sm font-bold text-foreground">
            <FileText className="h-4 w-4 text-emerald-600" /> {t("finance.linkLoanAppTitle")}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{t("finance.linkLoanAppDesc")}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary">{t("finance.open")} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>
        <Link to="/schemes" className="group rounded-2xl border border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <p className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Calculator className="h-4 w-4 text-emerald-600" /> {t("finance.linkSchemesTitle")}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{t("finance.linkSchemesDesc")}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary">{t("finance.open")} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>
        <Link to="/what-if" className="group rounded-2xl border border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <p className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Calculator className="h-4 w-4 text-emerald-600" /> {t("finance.linkWhatIfTitle")}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{t("finance.linkWhatIfDesc")}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary">{t("finance.tryIt")} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>
      </div>
    </div>
  );
}
