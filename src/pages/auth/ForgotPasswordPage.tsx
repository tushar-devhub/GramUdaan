import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import logo from "@/assets/logo.svg";

export default function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await resetPasswordForEmail(email.trim());
      setIsSubmitted(true);
      toast.success("Password reset instructions sent!");
    } catch (err: any) {
      console.error("[ForgotPassword] Error:", err);
      const msg = err?.message || "Failed to send reset link. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm space-y-6">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="inline-block mb-4">
            <img src={logo} alt="GramUdaan Logo" className="h-12 w-12 rounded-2xl mx-auto shadow-sm" />
          </Link>
          <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Reset Password
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Enter the email address associated with your account and we'll send you a secure recovery link.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSubmitted ? (
          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-5 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Check your inbox</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We have sent password reset instructions to{" "}
              <strong className="text-slate-900">{email}</strong>. Follow the link inside to set a new password.
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSubmit}
                disabled={isLoading}
                className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100"
              >
                {isLoading ? "Sending..." : "Resend Email"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-emerald-700"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl shadow-sm transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Link...
                </>
              ) : (
                "Send Password Reset Link"
              )}
            </Button>
          </form>
        )}

        {/* Back to sign in */}
        <div className="text-center pt-2">
          <Link
            to="/signin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
