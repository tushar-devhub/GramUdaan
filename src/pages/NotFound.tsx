import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-primary/20 mb-2">404</p>
        <h1 className="text-2xl font-bold text-foreground">{t("error.pageNotFound")}</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          {t("error.pageNotFoundDesc")}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("error.backToHome")}
        </Link>
      </div>
    </div>
  );
}
