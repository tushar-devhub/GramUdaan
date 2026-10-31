import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { SupabaseAuthProvider } from "@/providers/SupabaseAuthProvider";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import "./index.css";
import "leaflet/dist/leaflet.css";
import { OnboardingProvider } from "./lib/onboarding-context";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import { VoiceAssistant } from "./components/VoiceAssistant";
import AppShell from "./components/AppShell";
import { RoleGuard } from "./components/RoleGuard";

// Public & Landing
const Landing = lazy(() => import("./pages/Landing.tsx"));

// Authentication Pages
const SignInPage = lazy(() => import("./pages/auth/SignInPage.tsx"));
const SignUpPage = lazy(() => import("./pages/auth/SignUpPage.tsx"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage.tsx"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage.tsx"));
const VerifyEmailPage = lazy(() => import("./pages/auth/VerifyEmailPage.tsx"));

// Canonical Entrepreneur Dashboard & Role Dashboards
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const AdvisorDashboard = lazy(() => import("./pages/dashboards/AdvisorDashboard.tsx"));
const AdminDashboard = lazy(() => import("./pages/dashboards/AdminDashboard.tsx"));

// Existing GramUdaan Core Modules
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const Analysis = lazy(() => import("./pages/Analysis.tsx"));
const Finance = lazy(() => import("./pages/Finance.tsx"));
const Market = lazy(() => import("./pages/Market.tsx"));
const Schemes = lazy(() => import("./pages/Schemes.tsx"));
const Reports = lazy(() => import("./pages/Reports.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Advisor = lazy(() => import("./pages/Advisor.tsx"));
const WhatIf = lazy(() => import("./pages/WhatIf.tsx"));
const Compare = lazy(() => import("./pages/Compare.tsx"));
const Report = lazy(() => import("./pages/Report.tsx"));
const Application = lazy(() => import("./pages/Application.tsx"));
const Plan = lazy(() => import("./pages/Plan.tsx"));

// Loading fallback
function RouteLoading() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm font-bold text-emerald-800 font-serif-display">GramUdaan</span>
        <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-emerald-700 animate-spin" />
        <span className="text-xs text-muted-foreground font-medium">{t("common.loading")}</span>
      </div>
    </div>
  );
}

/** Silent error boundary */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <SupabaseAuthProvider>
        <BrowserRouter>
          <RouteSyncer />
          <LanguageProvider>
            <OnboardingProvider>
              <Suspense fallback={<RouteLoading />}>
                <Routes>
                  {/* ── Public Landing & Auth ── */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/signin" element={<SignInPage />} />
                  <Route path="/login" element={<SignInPage />} />
                  <Route path="/auth" element={<SignInPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/register" element={<SignUpPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />

                  {/* Focused Onboarding Flow */}
                  <Route
                    path="/onboarding"
                    element={
                      <RoleGuard>
                        <Onboarding />
                      </RoleGuard>
                    }
                  />

                  {/* ── GramUdaan App Shell (Original Navigation, Cream Background, Topbar) ── */}
                  <Route element={<AppShell />}>
                    {/* Primary Entrepreneur Dashboard */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/dashboard/entrepreneur" element={<Dashboard />} />

                    {/* Role B: Business Advisor Dashboard */}
                    <Route
                      path="/dashboard/advisor"
                      element={
                        <RoleGuard allowedRoles={["advisor", "admin"]}>
                          <AdvisorDashboard />
                        </RoleGuard>
                      }
                    />

                    {/* Role C: Platform Administrator Dashboard */}
                    <Route
                      path="/dashboard/admin"
                      element={
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminDashboard />
                        </RoleGuard>
                      }
                    />

                    {/* Preserved Core GramUdaan Modules */}
                    <Route path="/advisor" element={<Advisor />} />
                    <Route path="/analysis" element={<Analysis />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/market" element={<Market />} />
                    <Route path="/schemes" element={<Schemes />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Profile />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/plan" element={<Plan />} />
                    <Route path="/what-if" element={<WhatIf />} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/report" element={<Report />} />
                    <Route path="/application" element={<Application />} />
                  </Route>

                  <Route path="/saved" element={<Navigate to="/reports" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <VoiceAssistant />
              <Toaster />
            </OnboardingProvider>
          </LanguageProvider>
        </BrowserRouter>
      </SupabaseAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
