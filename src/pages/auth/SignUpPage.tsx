import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Store,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Languages,
} from "lucide-react";
import logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

import { clearOnboardingStorage } from "@/lib/onboarding-context";

export default function SignUpPage() {
  const { isAuthenticated, signUpWithPassword, roleDashboardUrl } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"entrepreneur" | "advisor">("entrepreneur");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const dest = role === "advisor" ? "/dashboard/advisor" : "/onboarding";
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, navigate, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg("You must agree to the Terms of Service & Privacy Policy.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await signUpWithPassword({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim(),
        role,
      });

      clearOnboardingStorage();
      toast.success("Account created successfully!");

      // If Supabase requires email verification
      if (res.user && !res.session) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
      } else {
        const dest = role === "advisor" ? "/dashboard/advisor" : "/onboarding";
        navigate(dest, { replace: true });
      }
    } catch (err: any) {
      console.error("[SignUp] Error:", err);
      const message =
        err?.message?.includes("already registered")
          ? "This email address is already registered. Please sign in instead."
          : err?.message || "Failed to create account. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#F8FAF9]">
      {/* Left section: Branding */}
      <AuthLeftPanel
        headline="Join India's Fastest Growing Rural Enterprise Network."
        subheadline="Access verified financial feasibility assessments, discover government subsidies, and receive specialized mentoring."
      />

      {/* Right section: Registration Form */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto">
        {/* Top Header: Mobile Logo & Language Toggle */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2.5 lg:hidden">
            <img src={logo} alt="GramUdaan Logo" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-bold text-emerald-950 font-serif-display">GramUdaan</span>
          </Link>
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
              className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{language === "hi" ? "English" : "हिंदी"}</span>
            </button>
          </div>
        </div>

        {/* Center Form Card */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create Your Account
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Start evaluating business ideas and financing options with GramUdaan.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-xs text-red-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ROLE SELECTION CARDS */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">
                Select Your Role <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Role A: Entrepreneur */}
                <div
                  onClick={() => setRole("entrepreneur")}
                  className={cn(
                    "relative flex flex-col p-3.5 rounded-2xl border-2 cursor-pointer transition-all bg-white",
                    role === "entrepreneur"
                      ? "border-emerald-700 bg-emerald-50/30 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl",
                      role === "entrepreneur" ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-600"
                    )}>
                      <Store className="h-4 w-4" />
                    </div>
                    {role === "entrepreneur" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Entrepreneur</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    I want to start or grow my business.
                  </p>
                </div>

                {/* Role B: Business Advisor */}
                <div
                  onClick={() => setRole("advisor")}
                  className={cn(
                    "relative flex flex-col p-3.5 rounded-2xl border-2 cursor-pointer transition-all bg-white",
                    role === "advisor"
                      ? "border-emerald-700 bg-emerald-50/30 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl",
                      role === "advisor" ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-600"
                    )}>
                      <Briefcase className="h-4 w-4" />
                    </div>
                    {role === "advisor" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Business Advisor</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    I help entrepreneurs with planning & guidance.
                  </p>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-emerald-700"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ramesh@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-emerald-700"
                />
              </div>
            </div>

            {/* Phone Number (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                  Phone Number
                </Label>
                <span className="text-[11px] text-slate-400">Optional</span>
              </div>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-emerald-700"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-10 pr-10 h-11 bg-white border-slate-200 focus-visible:ring-emerald-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength indicator */}
              <PasswordStrengthIndicator password={password} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-emerald-700"
                />
              </div>
            </div>

            {/* Terms and Privacy Consent */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                  className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700 h-4 w-4 shrink-0"
                />
                <span className="leading-relaxed">
                  I agree to the{" "}
                  <a href="#" className="font-semibold text-emerald-800 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="font-semibold text-emerald-800 hover:underline">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl shadow-sm transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Existing account link */}
          <p className="text-center text-xs text-slate-600 pt-2">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400 mt-8">
          Enterprise Security • Row-Level Access Control • Supabase
        </div>
      </div>
    </div>
  );
}
