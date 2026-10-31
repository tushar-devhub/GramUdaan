import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatIndianCurrency } from "@/data/assessment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Users,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Store,
  MapPin,
  Calendar,
  MessageSquare,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Send,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientConsultation {
  id: string;
  clientName: string;
  businessName: string;
  category: string;
  location: string;
  capital: number;
  feasibilityScore: number;
  status: "pending" | "in_progress" | "reviewed";
  date: string;
  notes?: string;
}

export default function AdvisorDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<ClientConsultation | null>(null);
  const [advisoryNote, setAdvisoryNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Initial client consultation dataset
  const [clients, setClients] = useState<ClientConsultation[]>([
    {
      id: "cli-1",
      clientName: "Rameshwar Gurjar",
      businessName: "Dairy Unit & Chilling Station",
      category: "Agri-Allied",
      location: "Alwar, Rajasthan",
      capital: 350000,
      feasibilityScore: 84,
      status: "pending",
      date: "Today, 10:30 AM",
      notes: "Seeking advice on PMEGP bank subsidy norms and chilling unit supplier verification.",
    },
    {
      id: "cli-2",
      clientName: "Sunita Devi",
      businessName: "Rural Grain & Spice Grinding Unit",
      category: "Food Processing",
      location: "Bhopal Rural, MP",
      capital: 200000,
      feasibilityScore: 78,
      status: "in_progress",
      date: "Yesterday",
      notes: "Need guidance on FSSAI registration and power connection requirements.",
    },
    {
      id: "cli-3",
      clientName: "Mahesh Chandra",
      businessName: "Poultry Farming & Feed Stock",
      category: "Livestock",
      location: "Varanasi Outer, UP",
      capital: 450000,
      feasibilityScore: 81,
      status: "reviewed",
      date: "Oct 21, 2026",
      notes: "Recommended biosecurity protocol checklist and Nabard refinance scheme.",
    },
    {
      id: "cli-4",
      clientName: "Vikas Patel",
      businessName: "Solar Irrigation Pumpset Dealership",
      category: "Renewable Energy",
      location: "Mehsana, Gujarat",
      capital: 500000,
      feasibilityScore: 88,
      status: "reviewed",
      date: "Oct 19, 2026",
      notes: "KUSUM scheme vendor certification verified.",
    },
  ]);

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !advisoryNote.trim()) return;

    setIsSubmittingNote(true);
    setTimeout(() => {
      setClients((prev) =>
        prev.map((c) =>
          c.id === selectedClient.id ? { ...c, status: "reviewed", notes: advisoryNote } : c
        )
      );
      toast.success(`Advisory feedback delivered to ${selectedClient.clientName}!`);
      setIsSubmittingNote(false);
      setSelectedClient(null);
      setAdvisoryNote("");
    }, 600);
  };

  const pendingCount = clients.filter((c) => c.status === "pending").length;
  const inProgressCount = clients.filter((c) => c.status === "in_progress").length;
  const reviewedCount = clients.filter((c) => c.status === "reviewed").length;

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. ADVISOR HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F766E] p-6 sm:p-8 text-white shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm border border-blue-400/30 text-blue-200">
              <Briefcase className="h-3.5 w-3.5" />
              <span>Certified Business Advisor Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === "hi"
                ? `नमस्ते, सलाहकार ${user?.name || ""}!`
                : `Welcome, Advisor ${user?.name || ""}!`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Review assigned rural micro-enterprise plans, audit feasibility scores, and guide entrepreneurs through bankable loan structuring.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/analysis"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-900 shadow-md hover:bg-slate-100 transition-all"
            >
              <TrendingUp className="h-4 w-4 text-emerald-700" />
              <span>Benchmark Tool</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. ADVISOR STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Clients</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{clients.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Assigned entrepreneurs</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Review</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-700">{pendingCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting your feedback</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">In Progress</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-indigo-700">{inProgressCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Active consultation notes</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Reviews</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{reviewedCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Bank-ready plans delivered</p>
        </div>
      </div>

      {/* ── 3. CLIENT MANAGEMENT & FEASIBILITY REVIEWS ── */}
      <div id="clients" className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-700" />
              <span>Assigned Entrepreneur Consultations</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review micro-entrepreneur project costs, feasibility models, and subsidy gaps.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search entrepreneur or town..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 w-48 sm:w-64 text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="in_progress">In Progress</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>
        </div>

        {/* Client table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Entrepreneur</th>
                <th className="px-4 py-3.5">Business & Location</th>
                <th className="px-4 py-3.5">Capital</th>
                <th className="px-4 py-3.5">Feasibility Score</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    <div>{client.clientName}</div>
                    <span className="text-[10px] text-slate-400 font-normal">{client.date}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-800">{client.businessName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {client.location}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">
                    {formatIndianCurrency(client.capital)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "font-extrabold px-2 py-0.5 rounded-full text-[11px] inline-block",
                      client.feasibilityScore >= 80 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                    )}>
                      {client.feasibilityScore}/100
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                      client.status === "pending" && "bg-amber-100/80 text-amber-800",
                      client.status === "in_progress" && "bg-blue-100/80 text-blue-800",
                      client.status === "reviewed" && "bg-emerald-100/80 text-emerald-800"
                    )}>
                      {client.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedClient(client);
                        setAdvisoryNote(client.notes || "");
                      }}
                      className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      {client.status === "reviewed" ? "View Notes" : "Provide Feedback"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FEEDBACK ACTION MODAL / DRAWER */}
        {selectedClient && (
          <div className="rounded-2xl border-2 border-emerald-600/30 bg-emerald-50/20 p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-emerald-200/40 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Advisory Review Channel
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Reviewing: {selectedClient.clientName} ({selectedClient.businessName})
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedClient(null)}
                className="text-xs h-7 text-slate-500"
              >
                Close
              </Button>
            </div>

            <form onSubmit={handleSendFeedback} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Advisory Recommendations & Action Steps
                </label>
                <textarea
                  rows={3}
                  value={advisoryNote}
                  onChange={(e) => setAdvisoryNote(e.target.value)}
                  placeholder="E.g., Verified machinery suppliers in Alwar. Advise applying for PMEGP loan subsidy with 35% margin money..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedClient(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingNote}
                  className="text-xs bg-emerald-800 hover:bg-emerald-900 text-white"
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {isSubmittingNote ? "Submitting..." : "Send Formal Advisory Note"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ── 4. RURAL SECTOR ADVISORY INSIGHTS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-700" />
            <span>Mandi & Commodity Pulse (AGMARKNET Live)</span>
          </h3>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Mustard Seed (सरसों)</p>
                <p className="text-[11px] text-slate-500">Alwar Mandi, Rajasthan</p>
              </div>
              <span className="font-extrabold text-emerald-800">₹5,450 / Quintal</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Wheat (गेहूं - Desi)</p>
                <p className="text-[11px] text-slate-500">Bhopal Mandi, MP</p>
              </div>
              <span className="font-extrabold text-emerald-800">₹2,420 / Quintal</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-emerald-700" />
            <span>Bank Financing & Scheme Updates</span>
          </h3>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
              <span className="font-bold text-emerald-950">MUDRA Loan Disbursals</span>
              <p className="text-[11px] text-slate-600">
                Banks are prioritizing Kishore (₹50k–₹5L) bracket for rural food processing micro-units.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-slate-900">Agriculture Infrastructure Fund (AIF)</span>
              <p className="text-[11px] text-slate-600">
                3% interest subvention available up to ₹2 Crores for primary processing and cold storage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
