import { Link, useLocation } from "react-router";
import { useState } from "react";
import { Menu, X, Globe, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

interface NavbarProps {
  className?: string;
  variant?: "landing" | "app";
}

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <button
      onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
      title="Switch Language / भाषा बदलें"
      className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 shadow-sm"
    >
      <Languages className="h-3.5 w-3.5" />
      <span>{language === "hi" ? "English" : "हिंदी"}</span>
    </button>
  );
}

export function Navbar({ className, variant = "landing" }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const isLanding = variant === "landing" || location.pathname === "/";

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/50 backdrop-blur-md",
        isLanding ? "bg-white/80" : "bg-white/90",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Globe className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground font-sans-body tracking-tight">
            Gram<span className="text-primary">Udaan</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          {isLanding ? (
            <>
              <Link to="/dashboard" className="rounded-lg px-3 py-2 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                {t("nav.home")}
              </Link>
              <a href="#how-it-works" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.howItWorks")}
              </a>
              <a href="#features" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.features")}
              </a>
              <a href="#trust" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.trust")}
              </a>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.home")}
              </Link>
              <Link to="/advisor" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.advisor")}
              </Link>
              <Link to="/what-if" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.whatIf")}
              </Link>
              <Link to="/compare" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.compare")}
              </Link>
              <Link to="/report" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.report")}
              </Link>
            </>
          )}
          <LanguageToggle />
          <Link
            to="/signin"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-800 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-800 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-900 transition-colors shadow-xs"
          >
            Get Started
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px]">
              →
            </span>
          </Link>
        </div>

        {/* Mobile menu button and language */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-white px-4 pb-4">
          {isLanding ? (
            <div className="flex flex-col gap-1 py-2">
              <Link to="/dashboard" className="rounded-lg px-3 py-2.5 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors" onClick={() => setMobileOpen(false)}>
                {t("nav.home")}
              </Link>
              <a href="#how-it-works" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                {t("nav.howItWorks")}
              </a>
              <a href="#features" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                {t("nav.features")}
              </a>
              <a href="#trust" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                {t("nav.trust")}
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-1 py-2">
              <Link to="/dashboard" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                {t("nav.home")}
              </Link>
              <Link to="/advisor" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                {t("nav.advisor")}
              </Link>
              <Link to="/what-if" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                {t("nav.whatIf")}
              </Link>
              <Link to="/compare" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                {t("nav.compare")}
              </Link>
              <Link to="/report" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                {t("nav.report")}
              </Link>
            </div>
          )}
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/signin"
              className="flex items-center justify-center py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
              onClick={() => setMobileOpen(false)}
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-800 py-2.5 text-xs font-bold text-white shadow-xs"
              onClick={() => setMobileOpen(false)}
            >
              Get Started →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
