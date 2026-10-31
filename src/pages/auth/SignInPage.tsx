import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Sparkles,
  Languages,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import logo from "@/assets/logo.svg";
import { useLanguage } from "@/i18n/LanguageContext";

export default function SignInPage() {
  const {
    isAuthenticated,
    signInWithPassword,
    signInWithGoogle,
    signIn,
    roleDashboardUrl,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { language, setLanguage, t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If user is already authenticated, redirect them to their role dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const destination = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : roleDashboardUrl;
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, returnTo, roleDashboardUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both your email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await signInWithPassword({ email, password, rememberMe });
      toast.success("Welcome back to GramUdaan!");
      const destination = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : roleDashboardUrl;
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error("[SignIn] Error:", err);
      const message =
        err?.message?.includes("Invalid login credentials")
          ? "Invalid email or password. Please check your credentials."
          : err?.message || "Failed to sign in. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("[SignIn] Google auth notice:", err);
      toast.error("Google sign-in is not configured on this Supabase instance. Please use email & password.");
    }
  };

  const handleGuestSignIn = async () => {
    setIsGuestLoading(true);
    setErrorMsg(null);
    try {
      await signIn("anonymous");
      toast.success("Signed in as Demo Entrepreneur!");
      navigate("/dashboard/entrepreneur", { replace: true });
    } catch (err: any) {
      console.error("[SignIn] Guest login error:", err);
      toast.error("Could not start guest session.");
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#F8FAF9]">
      {/* Left section: Visual & Branding */}
      <AuthLeftPanel
        headline="Smart Business Decisions for Rural India."
        subheadline="Evaluate project viability, discover government subsidies, and calculate break-even timelines in minutes."
      />

      {/* Right section: Form */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto">
        {/* Top Header: Logo for Mobile & Language Switcher */}
        <div className="flex items-center justify-between mb-8">
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
              Welcome Back
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Sign in to access your business feasibility dashboard and advisory reports.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-xs text-red-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="entrepreneur@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-emerald-700"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
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
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700 h-4 w-4"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Primary Sign In Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl shadow-sm transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In to GramUdaan <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#F8FAF9] px-3 text-slate-400 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Alternative Sign In Options */}
          <div className="space-y-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleGuestSignIn}
              disabled={isGuestLoading || isLoading}
              className="w-full h-10 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-800 text-xs font-semibold rounded-xl"
            >
              {isGuestLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-700" />
              ) : (
                <UserCheck className="mr-2 h-4 w-4 text-emerald-700" />
              )}
              Explore as Demo Entrepreneur
            </Button>
          </div>

          {/* Bottom link to Sign Up */}
          <p className="text-center text-xs text-slate-600 pt-2">
            Don't have an account yet?{" "}
            <Link
              to="/signup"
              className="font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
            >
              Create Account
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400 mt-8">
          Secured with Supabase Authentication & Row-Level Security
        </div>
      </div>
    </div>
  );
}
