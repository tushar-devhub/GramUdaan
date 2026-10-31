import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MailCheck,
  ArrowRight,
  Loader2,
  RefreshCw,
  Inbox,
} from "lucide-react";
import logo from "@/assets/logo.svg";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const { resendVerificationEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error("No email specified to resend to.");
      return;
    }
    setIsResending(true);
    try {
      await resendVerificationEmail(email);
      toast.success("Verification email resent! Please check your inbox.");
    } catch (err: any) {
      console.error("[VerifyEmail] Resend error:", err);
      toast.error(err?.message || "Could not resend email. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm text-center space-y-6">
        {/* Logo */}
        <Link to="/" className="inline-block">
          <img src={logo} alt="GramUdaan Logo" className="h-12 w-12 rounded-2xl mx-auto shadow-sm" />
        </Link>

        {/* Mail Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
          <MailCheck className="h-8 w-8" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Verify Your Email
          </h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            We've sent a verification link to{" "}
            {email ? (
              <strong className="text-slate-900 font-semibold">{email}</strong>
            ) : (
              "your registered email address"
            )}
            . Please click the link inside to activate your GramUdaan account.
          </p>
        </div>

        {/* Steps box */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 text-left text-xs text-slate-600 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-[10px] font-bold text-white">
              1
            </span>
            <span>Check your email inbox (and spam or junk folder).</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-[10px] font-bold text-white">
              2
            </span>
            <span>Click the verification link to confirm your identity.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-[10px] font-bold text-white">
              3
            </span>
            <span>Return and sign in to access your business dashboard.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Link
            to="/signin"
            className="inline-flex items-center justify-center gap-2 w-full h-11 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl shadow-sm transition-all text-xs"
          >
            Proceed to Sign In <ArrowRight className="h-4 w-4" />
          </Link>

          {email && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={isResending}
              className="w-full text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Didn't receive email? Resend
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
