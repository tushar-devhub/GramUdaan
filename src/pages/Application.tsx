import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatIndianCurrency } from "@/data/assessment";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { matchSchemesForProfileSource, type SchemeMatch } from "@/engine/schemeMatching";
import {
  createDraft, regenerateText, recalcFinancial, validateDraft, consistencyDiffs, missingSections,
  renderDraftText, loadCurrentDraft, saveCurrentDraft, snapshotVersion, listVersions,
  schemeById, documentChecklist,
  type LoanDraft, type DraftVersion,
} from "@/lib/loanDraft";
import { downloadLoanPdf } from "@/lib/loanPdf";
import { Link, useSearchParams } from "react-router";
import {
  FileText, Download, Copy, Check, Save, AlertTriangle, ShieldAlert, Landmark,
  Eye, Pencil, RotateCcw, History, ChevronRight, Home, ExternalLink, Sparkles, ArrowUpRight, UserRound, Store, Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DOC_KEY_MAP: Record<string, string> = {
  "Identity / KYC document (Aadhaar, voter ID or PAN)": "doc.kyc",
  "Address proof": "doc.address",
  "Bank account details": "doc.bank",
  "Business / project proposal": "doc.proposal",
  "Quotations or cost estimates for the proposed setup": "doc.quotations",
  "Existing business proof or new-enterprise declaration as per Mudra norms": "doc.mudra",
  "Beneficiary category certificate where applicable": "doc.pmegpCategory",
  "Project report in the required format": "doc.pmegpReport",
  "Land/space ownership or lease document": "doc.dairyLand",
  "Veterinary/health-related approvals where applicable": "doc.dairyVet",
  "Existing business registration details": "doc.cgtmseReg",
  "Bank's loan-processing documents": "doc.cgtmseBank",
  "Proof of land/space availability (owned or leased)": "doc.agriLand",
};

/* ─── Small building blocks ─── */

function Field({ label, hint, badge, children }: { label: string; hint?: string; badge?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
        {badge && (
          <span className="rounded-full bg-primary/10 px-1.5 py-px text-[9px] font-bold text-primary normal-case tracking-normal">{badge}</span>
        )}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </h3>
      <div className="space-y-3.5">{children}</div>
    </section>
  );
}

const money = (n: number) => formatIndianCurrency(Math.round(n || 0));

/* ─── Page ─── */

export default function Application() {
  const { feasibility, analysisResult, location, business, capital } = useOnboarding();
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const scheme = schemeById(params.get("scheme"));

  const translateDoc = useCallback((doc: string) => {
    const key = DOC_KEY_MAP[doc];
    return key ? t(key as any) : doc;
  }, [t]);

  // Draft state (preserved across edits + analysis refreshes when identical)
  const [draft, setDraft] = useState<LoanDraft | null>(() => {
    const stored = loadCurrentDraft();
    const key = business && location ? `${business.id}|${location.id}|${capital || 0}` : "";
    if (stored && stored.anchors.analysisKey === key && stored.schemeId === (scheme?.id ?? null)) return stored;
    return null;
  });
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [versions, setVersions] = useState<DraftVersion[]>(() => listVersions());
  const [showVersions, setShowVersions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "none">("none");
  const [notice, setNotice] = useState<string | null>(null);
  const draftRef = useRef<LoanDraft | null>(draft);
  draftRef.current = draft;

  const anchoredScheme = scheme ?? schemeById(draft?.schemeId ?? null);
  const schemeMatch = useMemo<SchemeMatch | null>(() => {
    if (!feasibility || !business || !location) return null;
    if (!anchoredScheme) return null;
    const result = matchSchemesForProfileSource({
      businessId: business.id,
      businessName: business.name,
      businessCategory: business.category,
      state: location.state,
      district: location.district,
      contribution: feasibility.financial.availableContribution || capital,
      projectCost: feasibility.financial.totalProjectCost,
      fundingRequirement: feasibility.financial.potentialLoan,
    });
    return result.matches.find((m) => m.scheme.id === anchoredScheme.id) ?? null;
  }, [feasibility, business, location, capital, anchoredScheme]);

  const matchSuffix = schemeMatch
    ? t("app.matchSuffix").replace(
        "{level}",
        schemeMatch.level === "high"
          ? t("schemesSec.highMatch")
          : schemeMatch.level === "possible"
            ? t("schemesSec.possibleMatch")
            : t("schemesSec.lowMatch"),
      )
    : "";

  // (Re)build draft when the underlying analysis identity changes.
  useEffect(() => {
    if ((!feasibility && !analysisResult) || !business || !location) return;
    const cur = draftRef.current;
    if (cur && cur.anchors.analysisKey === `${business.id}|${location.id}|${capital || 0}` && cur.schemeId === (scheme?.id ?? cur.schemeId)) return;
    const fresh = createDraft({ feasibility, analysisResult, business, location, capital, scheme });
    if (fresh) setDraft(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feasibility, analysisResult, business?.id, location?.id, capital, scheme?.id]);

  // Persist latest draft as the user edits.
  useEffect(() => {
    if (draft) saveCurrentDraft(draft);
  }, [draft]);

  const update = useCallback((patch: (d: LoanDraft) => LoanDraft) => {
    setDraft((d) => (d ? patch(d) : d));
  }, []);

  if (!feasibility || !business || !location) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t("app.emptyTitle")}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("app.emptyDesc")}
            </p>
            <Link to="/onboarding" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              {t("app.startAssessment")} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!draft) return null;

  const issues = validateDraft(draft);
  const blocking = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const diffs = consistencyDiffs(draft, draft.anchors);
  const missing = missingSections(draft);
  const errorsByField = new Map(issues.map((i) => [i.field, i] as const));

  const syncWithAnalysis = () => {
    const fresh = createDraft({ feasibility, business, location, capital, scheme: schemeById(draft.schemeId) });
    if (!fresh) return;
    // Preserve applicant details and any user-typed text edits.
    setDraft({
      ...fresh,
      meta: { ...fresh.meta, createdAt: draft.meta.createdAt, draftNo: draft.meta.draftNo },
      applicant: draft.applicant,
      project: { ...fresh.project, purpose: draft.project.purpose, equipment: draft.project.equipment, workingCapital: draft.project.workingCapital },
      market: { ...fresh.market, targetCustomers: draft.market.targetCustomers, opportunity: draft.market.opportunity, competition: draft.market.competition, pricing: draft.market.pricing },
    });
    setNotice(t("app.noticeSynced"));
  };

  const handleRegenerateText = () => {
    update((d) => regenerateText(d, feasibility));
    setNotice(t("app.noticeRegenerated"));
  };

  const handleSaveVersion = () => {
    setVersions(snapshotVersion(draft));
    setNotice(t("app.noticeDraftSaved").replace("{num}", String(draft.meta.draftNo + 1)));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(renderDraftText(draft));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice(t("app.noticeClipboardFail"));
    }
  };

  const handleDownloadPdf = () => {
    if (blocking.length > 0) {
      setMode("edit");
      setNotice(t("app.noticeFixFinancial"));
      return;
    }
    setBusy("pdf");
    // Let the spinner paint once; jsPDF work is synchronous.
    setTimeout(() => {
      try {
        downloadLoanPdf(draft);
        setVersions(snapshotVersion(draft));
        setNotice(t("app.noticePdfDownloaded"));
      } catch {
        setNotice(t("app.noticePdfError"));
      } finally {
        setBusy("none");
      }
    }, 120);
  };

  const setFin = (field: keyof LoanDraft["financial"], v: number) =>
    update((d) => recalcFinancial({ ...d, financial: { ...d.financial, [field]: v } }));
  const setApp = (field: keyof LoanDraft["applicant"], v: string) =>
    update((d) => ({ ...d, applicant: { ...d.applicant, [field]: v } }));
  const setBiz = (field: keyof LoanDraft["business"], v: string) =>
    update((d) => ({ ...d, business: { ...d.business, [field]: v } }));
  const setProj = (field: keyof LoanDraft["project"], v: string) =>
    update((d) => ({ ...d, project: { ...d.project, [field]: v } }));
  const setMkt = (field: keyof LoanDraft["market"], v: string) =>
    update((d) => ({ ...d, market: { ...d.market, [field]: v } }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-8 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground font-serif-display">{t("app.title")}</h1>
              <p className="text-xs text-muted-foreground">{t("app.subtitle")}</p>
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
            <div className="flex rounded-full border border-border bg-white p-0.5 text-xs font-semibold">
              <button onClick={() => setMode("edit")} className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors", mode === "edit" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                <Pencil className="h-3.5 w-3.5" /> {t("app.tabEdit")}
              </button>
              <button onClick={() => setMode("preview")} className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors", mode === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                <Eye className="h-3.5 w-3.5" /> {t("app.tabPreview")}
              </button>
            </div>
            <div className="relative">
              <button onClick={() => setShowVersions((v) => !v)} className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors">
                <History className="h-3.5 w-3.5" /> {t("app.draftNum").replace("{draftNo}", String(draft.meta.draftNo))}
              </button>
              {showVersions && (
                <div className="absolute right-0 top-full z-20 mt-1.5 w-72 rounded-xl border border-border bg-white p-1.5 shadow-lg">
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("app.savedDrafts")}</p>
                  {versions.length === 0 && <p className="px-2 py-2 text-xs text-muted-foreground">{t("app.noSavedDrafts")}</p>}
                  {versions.map((v) => (
                    <button key={v.savedAt} onClick={() => { setDraft(v.draft); setShowVersions(false); setNotice(t("app.noticeRestored").replace("{num}", String(v.draftNo)).replace("{date}", new Date(v.savedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }))); }}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-muted transition-colors">
                      <span className="font-semibold text-foreground">{t("app.draftNum").replace("{draftNo}", String(v.draftNo))}</span>
                      <span className="ml-2 text-muted-foreground">{new Date(v.savedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notice */}
        {notice && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs text-primary">
            <Check className="h-4 w-4 mt-px flex-shrink-0" />
            <span>{notice}</span>
            <button className="ml-auto" onClick={() => setNotice(null)} aria-label="Dismiss"><span className="text-primary/70 hover:text-primary">✕</span></button>
          </div>
        )}

        {/* Scheme banner */}
        {anchoredScheme && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-primary/15 bg-primary/[0.04] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-primary/15 text-primary">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{t("app.schemeBannerTitle").replace("{name}", anchoredScheme.name)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t("app.schemeBannerSub").replace("{match}", matchSuffix)}
                </p>
              </div>
            </div>
            <Link to="/schemes" className="sm:ml-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors">
              {t("app.viewMatchedSchemes")} <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Consistency banner */}
        {diffs.length > 0 && (
          <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-amber-800">
              <AlertTriangle className="h-4 w-4" /> {t("app.diffBannerTitle")}
            </p>
            <ul className="mt-2 space-y-1">
              {diffs.map((d, i) => (
                <li key={i} className="text-[11px] text-amber-700">
                  <span className="font-semibold">{d.label}:</span> {t("app.diffRow").replace("{draft}", d.draftValue).replace("{analysis}", d.analysisValue)}
                </li>
              ))}
            </ul>
            <button onClick={syncWithAnalysis} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-1.5 text-[11px] font-bold text-white hover:bg-amber-700 transition-colors">
              <RotateCcw className="h-3 w-3" /> {t("app.syncBtn")}
            </button>
          </div>
        )}

        {/* Validation banner */}
        {(blocking.length > 0 || warnings.length > 0) && (
          <div className={cn("mb-4 rounded-2xl border p-4", blocking.length > 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50")}>
            <p className="flex items-center gap-2 text-xs font-bold text-foreground">
              <AlertTriangle className={cn("h-4 w-4", blocking.length > 0 ? "text-red-600" : "text-amber-600")} />
              {blocking.length > 0 ? t("app.validationBlocking") : t("app.validationWarnings")}
            </p>
            <ul className="mt-2 space-y-1">
              {[...blocking, ...warnings].map((i, idx) => (
                <li key={idx} className="text-[11px] text-muted-foreground">
                  <span className="font-semibold">{i.label}:</span> {i.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing info strip */}
        {missing.length > 0 && (
          <div className="mb-5 rounded-2xl border border-border bg-white p-4">
            <p className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5 text-primary" /> {t("app.missingInfo")}</p>
            <div className="flex flex-wrap gap-1.5">
              {missing.map((m) => (
                <span key={m} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{m}</span>
              ))}
            </div>
          </div>
        )}

        {mode === "edit" ? (
          <div className="space-y-4">
            {/* A. Applicant */}
            <Card title={t("app.cardApplicant")} icon={<UserRound className="h-4 w-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Field label={t("app.fullName")}>
                    <Input value={draft.applicant.name} onChange={(e) => setApp("name", e.target.value)} placeholder={t("app.namePlaceholder")} className={errorsByField.has("applicant.name") ? "border-red-300" : ""} />
                  </Field>
                </div>
                <Field label={t("app.mobile")} badge={t("app.recommended")}>
                  <Input value={draft.applicant.mobile} onChange={(e) => setApp("mobile", e.target.value)} inputMode="tel" placeholder={t("app.mobilePlaceholder")} className={errorsByField.has("applicant.mobile") ? "border-amber-300" : ""} />
                </Field>
                <Field label={t("app.email")}>
                  <Input value={draft.applicant.email} onChange={(e) => setApp("email", e.target.value)} type="email" placeholder={t("app.optional")} />
                </Field>
                <Field label={t("app.address")}>
                  <Input value={draft.applicant.address} onChange={(e) => setApp("address", e.target.value)} placeholder={t("app.addressPlaceholder")} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3.5 pt-1">
                <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("app.district")}</p>
                  <p className="text-sm font-semibold text-foreground truncate">{draft.anchors.district}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("app.state")}</p>
                  <p className="text-sm font-semibold text-foreground truncate">{draft.anchors.state}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("app.pincode")}</p>
                  <p className="text-sm font-semibold text-foreground">{draft.anchors.pincode}</p>
                </div>
              </div>
            </Card>

            {/* B. Business */}
            <Card title={t("app.cardBusiness")} icon={<Store className="h-4 w-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label={t("app.proposedBiz")}>
                  <Input value={draft.business.name} onChange={(e) => setBiz("name", e.target.value)} />
                </Field>
                <Field label={t("app.bizCategory")}>
                  <Input value={draft.business.category} disabled className="opacity-70" />
                </Field>
                <Field label={t("app.bizStage")}>
                  <Input value={draft.business.stage} onChange={(e) => setBiz("stage", e.target.value)} placeholder={t("app.bizStagePlaceholder")} />
                </Field>
                <Field label={t("app.relevantExp")}>
                  <Input value={draft.business.experience} onChange={(e) => setBiz("experience", e.target.value)} placeholder={t("app.expPlaceholder")} />
                </Field>
              </div>
              <Field label={t("app.bizDesc")} badge={t("app.fromAnalysis")}>
                <Textarea value={draft.business.description} onChange={(e) => setBiz("description", e.target.value)} className="min-h-16" />
              </Field>
              <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("app.analysisLocation")}</p>
                <p className="text-sm font-semibold text-foreground">{draft.business.locationLabel}</p>
              </div>
            </Card>

            {/* C. Project */}
            <Card title={t("app.cardProject")} icon={<Calculator className="h-4 w-4" />}>
              <Field label={t("app.purposeLoan")} badge={t("app.aiDraft")}>
                <Textarea value={draft.project.purpose} onChange={(e) => setProj("purpose", e.target.value)} className="min-h-16" />
              </Field>
              <Field label={t("app.projDesc")} badge={t("app.aiDraft")}>
                <Textarea value={draft.project.description} onChange={(e) => setProj("description", e.target.value)} className="min-h-12" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label={t("app.equipAssets")} hint={t("app.equipHint")}>
                  <Input value={draft.project.equipment} onChange={(e) => setProj("equipment", e.target.value)} placeholder={t("app.equipPlaceholder")} />
                </Field>
                <Field label={t("app.workingCap")} hint={t("app.workingCapHint")}>
                  <Input value={draft.project.workingCapital} onChange={(e) => setProj("workingCapital", e.target.value)} placeholder={t("app.workingCapPlaceholder")} />
                </Field>
              </div>
            </Card>

            {/* D. Financial */}
            <Card title={t("app.cardFinancial")} icon={<FileText className="h-4 w-4" />}>
              <div className="rounded-xl border border-primary/15 bg-primary/[0.04] px-3.5 py-2.5 mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">{t("app.finAutoCalcTitle")}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t("app.finAutoCalcDesc")}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <Field label={t("app.ownContribution")}>
                  <Input type="number" min={0} value={draft.financial.ownContribution || ""} onChange={(e) => setFin("ownContribution", Number(e.target.value))} className={errorsByField.has("financial.ownContribution") ? "border-red-300" : ""} />
                </Field>
                <Field label={t("app.projectCost")}>
                  <Input type="number" min={0} value={draft.financial.projectCost || ""} onChange={(e) => setFin("projectCost", Number(e.target.value))} className={errorsByField.has("financial.projectCost") ? "border-red-300" : ""} />
                </Field>
                <Field label={t("app.fundingReq")} badge={t("app.calculated")}>
                  <div className="flex h-9 items-center rounded-md border border-primary/30 bg-primary/5 px-3 text-sm font-bold text-primary">{money(draft.financial.fundingRequirement)}</div>
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <Field label={t("app.proposedLoan")}>
                  <Input type="number" min={0} value={draft.financial.proposedLoan || ""} onChange={(e) => setFin("proposedLoan", Number(e.target.value))} className={errorsByField.has("financial.proposedLoan") ? "border-red-300" : ""} />
                </Field>
                <Field label={t("app.otherFundingSources")}>
                  <Input value={draft.financial.otherSources} onChange={(e) => update((d) => ({ ...d, financial: { ...d.financial, otherSources: e.target.value } }))} placeholder={t("app.otherSourcesPlaceholder")} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 border-t border-border/60 mt-1 pt-3.5">
                <Field label={t("app.expMonthlyRev")} badge={t("app.estimate")}>
                  <Input type="number" min={0} value={draft.financial.monthlyRevenue || ""} onChange={(e) => setFin("monthlyRevenue", Number(e.target.value))} />
                </Field>
                <Field label={t("app.estMonthlyExp")} badge={t("app.estimate")}>
                  <Input type="number" min={0} value={draft.financial.monthlyExpenses || ""} onChange={(e) => setFin("monthlyExpenses", Number(e.target.value))} />
                </Field>
                <Field label={t("app.estMonthlySurplus")} badge={t("app.estimate")}>
                  <Input type="number" min={0} value={draft.financial.monthlyProfit || ""} onChange={(e) => setFin("monthlyProfit", Number(e.target.value))} />
                </Field>
              </div>
            </Card>

            {/* E. Market */}
            <Card title={t("app.cardMarket")} icon={<Sparkles className="h-4 w-4" />}>
              <Field label={t("app.targetCustomers")} badge={t("app.fromAnalysis")}>
                <Textarea value={draft.market.targetCustomers} onChange={(e) => setMkt("targetCustomers", e.target.value)} className="min-h-12" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label={t("app.localOpportunity")} badge={t("app.fromAnalysis")}>
                  <Textarea value={draft.market.opportunity} onChange={(e) => setMkt("opportunity", e.target.value)} className="min-h-16" />
                </Field>
                <Field label={t("app.competition")} badge={t("app.fromAnalysis")}>
                  <Textarea value={draft.market.competition} onChange={(e) => setMkt("competition", e.target.value)} className="min-h-16" />
                </Field>
              </div>
              <Field label={t("app.pricingRationale")} badge={t("app.fromAnalysis")}>
                <Textarea value={draft.market.pricing} onChange={(e) => setMkt("pricing", e.target.value)} className="min-h-12" />
              </Field>
              <Field label={t("app.businessJustification")} badge={t("app.aiDraft")}>
                <Textarea value={draft.market.justification} onChange={(e) => setMkt("justification", e.target.value)} className="min-h-24" />
              </Field>
              <button onClick={handleRegenerateText} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors">
                <RotateCcw className="h-3.5 w-3.5" /> {t("app.regenerateBtn")}
              </button>
            </Card>

            {/* Documents + scheme note */}
            <Card title={t("app.cardDocuments")} icon={<FileText className="h-4 w-4" />}>
              <ul className="space-y-1.5">
                {[...documentChecklist(draft.anchors, draft.schemeId), ...draft.extraDocuments.filter(Boolean)].map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-snug">
                    <span className="text-emerald-600 font-bold mt-px">✓</span>
                    <span>{translateDoc(doc)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-muted-foreground">{t("app.finalDocNote")}</p>
              <Field label={t("app.additionalDocs")} hint={t("app.onePerLine")}>
                <Textarea value={draft.extraDocuments.join("\n")} onChange={(e) => update((d) => ({ ...d, extraDocuments: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) }))} placeholder={t("app.additionalDocsPlaceholder")} className="min-h-14" />
              </Field>
            </Card>

            {/* Business plan integration */}
            <Card title={t("app.cardPlan")} icon={<ExternalLink className="h-4 w-4" />}>
              <label className="flex items-start gap-2.5 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={draft.includeBusinessPlan} onChange={(e) => update((d) => ({ ...d, includeBusinessPlan: e.target.checked }))} className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                <span>
                  {t("app.includePlanNote")}
                </span>
              </label>
              <Link to="/report" className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors w-fit">
                {t("app.openBusinessPlan")} <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button onClick={() => setMode("preview")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                <Eye className="h-4 w-4" /> {t("app.previewApp")}
              </button>
              <button onClick={handleSaveVersion} className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                <Save className="h-4 w-4" /> {t("app.saveDraft")}
              </button>
              <button onClick={handleDownloadPdf} disabled={busy === "pdf"} className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background hover:opacity-90 transition-opacity disabled:opacity-50">
                <Download className="h-4 w-4" /> {busy === "pdf" ? t("app.generatingPdf") : t("app.generatePdf")}
              </button>
            </div>
          </div>
        ) : (
          /* ─── Preview ─── */
          <div>
            <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
              {/* Doc header */}
              <div className="bg-[#174f38] px-5 sm:px-8 py-5 text-white">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">GramUdaan</p>
                <h2 className="mt-1 text-lg sm:text-xl font-bold font-serif-display">{t("app.title")}</h2>
                <p className="text-xs text-white/75 mt-0.5">{t("app.previewSubtitle")}</p>
              </div>
              <div className="px-5 sm:px-8 py-6 space-y-5 text-[13px]">
                <DocLine label={t("app.applicationDate")} value={new Date(draft.meta.updatedAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
                <div className="border-t border-dashed border-border pt-4">
                  <DocHeading n="1">{t("app.headingApplicant")}</DocHeading>
                  <DocLine label={t("app.fullName")} value={draft.applicant.name || t("app.notProvided")} />
                  <DocLine label={t("app.mobile")} value={draft.applicant.mobile || t("app.notProvided")} />
                  <DocLine label={t("app.email")} value={draft.applicant.email || t("app.notProvided")} />
                  <DocLine label={t("app.address")} value={draft.applicant.address || t("app.notProvided")} />
                  <DocLine label={`${t("app.district")} / ${t("app.state")} / ${t("app.pincode")}`} value={`${draft.anchors.district}, ${draft.anchors.state} — ${draft.anchors.pincode}`} />
                </div>
                <div className="border-t border-dashed border-border pt-4">
                  <DocHeading n="2">{t("app.headingBusiness")}</DocHeading>
                  <DocLine label={t("app.proposedBiz")} value={`${draft.business.name} (${draft.business.category})`} />
                  <DocLine label={t("app.bizDesc")} value={draft.business.description || t("app.notProvided")} />
                  <DocLine label={t("app.analysisLocation")} value={draft.business.locationLabel} />
                  <DocLine label={t("app.bizStage")} value={draft.business.stage || t("app.notProvided")} />
                  <DocLine label={t("app.relevantExp")} value={draft.business.experience || t("app.notProvided")} />
                </div>
                <div className="border-t border-dashed border-border pt-4">
                  <DocHeading n="3">{t("app.headingProject")}</DocHeading>
                  <p className="text-muted-foreground leading-relaxed mb-2">{draft.project.purpose}</p>
                  <DocLine label={t("app.projDesc")} value={draft.project.description} />
                  <DocLine label={t("app.equipAssets")} value={draft.project.equipment || t("app.notProvided")} />
                  <DocLine label={t("app.workingCap")} value={draft.project.workingCapital || t("app.notProvided")} />
                </div>
                <div className="border-t border-dashed border-border pt-4">
                  <DocHeading n="4">{t("app.headingFinancial")}</DocHeading>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-border/60">
                        <DocRow k={t("app.rowOwnContribution")} v={money(draft.financial.ownContribution)} />
                        <DocRow k={t("app.rowProjectCost")} v={money(draft.financial.projectCost)} />
                        <DocRow k={t("app.rowFundingReq")} v={money(draft.financial.fundingRequirement)} strong />
                        <DocRow k={t("app.rowProposedLoan")} v={money(draft.financial.proposedLoan)} />
                        <DocRow k={t("app.rowOtherSources")} v={draft.financial.otherSources || t("app.noneStated")} />
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">{t("app.finAutoCalcDesc")}</p>
                  <DocHeading n="5">{t("app.headingProjections")}</DocHeading>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-border/60">
                        <DocRow k={t("app.rowMonthlyRev")} v={money(draft.financial.monthlyRevenue)} />
                        <DocRow k={t("app.rowMonthlyExp")} v={money(draft.financial.monthlyExpenses)} />
                        <DocRow k={t("app.rowMonthlySurplus")} v={money(draft.financial.monthlyProfit)} />
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">{t("app.projectionsNote")}</p>
                </div>
                <div className="border-t border-dashed border-border pt-4">
                  <DocHeading n="6">{t("app.headingMarket")}</DocHeading>
                  <DocLine label={t("app.targetCustomers")} value={draft.market.targetCustomers} />
                  <DocLine label={t("app.localOpportunity")} value={draft.market.opportunity} />
                  <DocLine label={t("app.competition")} value={draft.market.competition} />
                  <DocLine label={t("app.pricingRationale")} value={draft.market.pricing} />
                </div>
                <div className="border-t border-dashed border-border pt-4">
                  <DocHeading n="7">{t("app.headingJustification")}</DocHeading>
                  <p className="text-muted-foreground leading-relaxed">{draft.market.justification}</p>
                </div>
                <div className="border-t border-dashed border-border pt-4">
                  <DocHeading n="8">{t("app.headingScheme")}</DocHeading>
                  {anchoredScheme ? (
                    <>
                      <DocLine label={t("app.schemeBannerTitle").replace("{name}", "").replace(/:\s*$/, "")} value={`${anchoredScheme.name}${matchSuffix}`} />
                      {anchoredScheme.supportStructure.map((s, i) => <DocLine key={i} label={s.label} value={s.text} />)}
                      <p className="mt-1.5 text-[11px] text-muted-foreground">{t("app.preliminaryMatchNotice")}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">{t("app.noSchemeSelected")}</p>
                  )}
                  {draft.includeBusinessPlan && (
                    <p className="mt-2 text-[11px] text-muted-foreground">• {t("app.businessPlanAttached")}</p>
                  )}
                </div>
                <div className="border-t border-dashed border-border pt-4">
                  <DocHeading n="9">{t("app.headingDocuments")}</DocHeading>
                  <ul className="space-y-1.5">
                    {[...documentChecklist(draft.anchors, draft.schemeId), ...draft.extraDocuments.filter(Boolean)].map((doc, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground leading-snug"><span className="text-emerald-600 font-bold mt-px">✓</span>{translateDoc(doc)}</li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{t("app.finalDocNote")}</p>
                </div>
                <div className="border-t border-dashed border-border pt-4">
                  <DocHeading n="10">{t("app.headingDeclaration")}</DocHeading>
                  <p className="text-muted-foreground leading-relaxed mb-6">{t("app.declarationText")}</p>
                  <div className="grid grid-cols-2 gap-6 pt-2 border-t border-border/60">
                    <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">{t("app.applicantSignature")}</p><div className="border-b border-foreground/40" /></div>
                    <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">{t("app.signatureDate")}</p><div className="border-b border-foreground/40" /></div>
                  </div>
                </div>
                {/* Disclaimer */}
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {t("app.previewDisclaimer")}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
              <button onClick={() => setMode("edit")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                <Pencil className="h-4 w-4" /> {t("app.editApp")}
              </button>
              <button onClick={handleCopy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? t("app.copied") : t("app.copyDraft")}
              </button>
              <button onClick={handleDownloadPdf} disabled={busy === "pdf"} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
                {busy === "pdf" ? (
                  <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> {t("app.generatingPdf")}</>
                ) : (
                  <><Download className="h-4 w-4" /> {t("app.generatePdf")}</>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Tiny doc helpers for preview ─── */

function DocHeading({ n, children }: { n: number | string; children: React.ReactNode }) {
  return <h4 className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-[#174f38] first:mt-0">{n}. {children}</h4>;
}

function DocLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="leading-relaxed">
      <span className="font-semibold text-foreground">{label}: </span>
      <span className="text-muted-foreground">{value}</span>
    </p>
  );
}

function DocRow({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <tr className={cn(strong && "bg-primary/5")}>
      <td className={cn("px-3 py-2 text-muted-foreground", strong && "font-bold text-foreground")}>{k}</td>
      <td className={cn("px-3 py-2 text-right font-semibold text-foreground", strong && "text-primary")}>{v}</td>
    </tr>
  );
}
