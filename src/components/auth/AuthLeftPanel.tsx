import logo from "@/assets/logo.svg";
import { Sparkles, ShieldCheck, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";

interface AuthLeftPanelProps {
  headline?: string;
  subheadline?: string;
}

export function AuthLeftPanel({
  headline = "Your Business Journey Starts Here.",
  subheadline = "GramUdaan equips rural entrepreneurs and advisors with AI feasibility models, verified government schemes, and Hyperlocal market intelligence.",
}: AuthLeftPanelProps) {
  const highlights = [
    {
      icon: <TrendingUp className="h-4 w-4 text-emerald-300" />,
      title: "Data-Driven Feasibility",
      desc: "Instant project cost, working capital, and break-even estimations.",
    },
    {
      icon: <ShieldCheck className="h-4 w-4 text-emerald-300" />,
      title: "100% Verified Schemes",
      desc: "Curated MUDRA, PMEGP, and Stand-Up India funding matches.",
    },
    {
      icon: <Users className="h-4 w-4 text-emerald-300" />,
      title: "Advisor Collaboration",
      desc: "Connect directly with rural business consultants and mentors.",
    },
  ];

  return (
    <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#042f24] text-white overflow-hidden">
      {/* Background radial glow & decorative elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
      
      {/* Top branding */}
      <div className="relative z-10">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <img
            src={logo}
            alt="GramUdaan Logo"
            className="h-10 w-10 rounded-xl bg-white/10 p-1 backdrop-blur-sm border border-white/20 transition-transform group-hover:scale-105"
          />
          <div>
            <span className="text-xl font-bold tracking-tight text-white font-serif-display block">
              GramUdaan
            </span>
            <span className="text-[10px] tracking-wider uppercase text-emerald-200/90 font-medium">
              Rural Micro-Enterprise Intelligence
            </span>
          </div>
        </Link>
      </div>

      {/* Main hero statement */}
      <div className="relative z-10 max-w-lg my-auto py-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 border border-emerald-300/20 px-3.5 py-1 text-xs font-medium text-emerald-200 backdrop-blur-md mb-6">
          <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
          <span>Trusted by 2,400+ Rural Micro-Enterprises</span>
        </div>

        <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
          {headline}
        </h1>
        <p className="text-emerald-100/80 text-sm leading-relaxed mb-8">
          {subheadline}
        </p>

        {/* Feature bullets */}
        <div className="space-y-4 pt-2">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-900/60 border border-emerald-400/20">
                {h.icon}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">{h.title}</h4>
                <p className="text-[11px] text-emerald-100/70 leading-relaxed">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Social trust */}
      <div className="relative z-10 pt-6 border-t border-emerald-400/20 flex items-center justify-between text-xs text-emerald-200/70">
        <span>© {new Date().getFullYear()} GramUdaan AI Platform</span>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          <span className="text-[11px] font-medium text-emerald-100">Enterprise Security & RLS</span>
        </div>
      </div>
    </div>
  );
}
