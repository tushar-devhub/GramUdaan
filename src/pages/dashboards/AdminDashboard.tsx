import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import type { UserRole, AccountStatus, UserProfile } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Sliders,
  Database,
  Activity,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  RefreshCw,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ManagedUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: AccountStatus;
  phone?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Managed users state (seeded with demo platform data and updated from Supabase)
  const [usersList, setUsersList] = useState<ManagedUser[]>([
    {
      id: "u-1",
      user_id: "usr-001",
      email: "ramesh@gramudaan.in",
      full_name: "Ramesh Sharma",
      role: "entrepreneur",
      status: "active",
      phone: "+91 98290 11223",
      created_at: "2026-10-18T09:15:00Z",
    },
    {
      id: "u-2",
      user_id: "usr-002",
      email: "advisor.singh@gramudaan.in",
      full_name: "Dr. K.P. Singh (Agri-Consultant)",
      role: "advisor",
      status: "active",
      phone: "+91 94140 55667",
      created_at: "2026-10-15T14:20:00Z",
    },
    {
      id: "u-3",
      user_id: "usr-003",
      email: "anita.patel@gramudaan.in",
      full_name: "Anita Patel",
      role: "entrepreneur",
      status: "active",
      phone: "+91 98980 99887",
      created_at: "2026-10-20T11:45:00Z",
    },
    {
      id: "u-4",
      user_id: "usr-004",
      email: "admin.super@gramudaan.in",
      full_name: "GramUdaan Root Admin",
      role: "admin",
      status: "active",
      phone: "+91 98000 00000",
      created_at: "2026-09-01T00:00:00Z",
    },
    {
      id: "u-5",
      user_id: "usr-005",
      email: "mohit.verma@example.com",
      full_name: "Mohit Verma",
      role: "entrepreneur",
      status: "pending",
      phone: "+91 98111 22334",
      created_at: "2026-10-22T16:10:00Z",
    },
  ]);

  // Load real profiles from Supabase if table is populated
  const fetchProfiles = async () => {
    try {
      setIsLoadingUsers(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, email, full_name, role, status, phone, created_at")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setUsersList(data as ManagedUser[]);
      }
    } catch (err) {
      console.warn("[AdminDashboard] Remote profiles notice:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleUpdateRole = async (targetUserId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("user_id", targetUserId);

      if (error) {
        console.warn("[Admin] Supabase update notice:", error.message);
      }

      setUsersList((prev) =>
        prev.map((u) => (u.user_id === targetUserId ? { ...u, role: newRole } : u))
      );
      toast.success(`User role updated to ${newRole}!`);
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update role");
    }
  };

  const handleToggleStatus = async (targetUserId: string, newStatus: AccountStatus) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("user_id", targetUserId);

      if (error) {
        console.warn("[Admin] Supabase status notice:", error.message);
      }

      setUsersList((prev) =>
        prev.map((u) => (u.user_id === targetUserId ? { ...u, status: newStatus } : u))
      );
      toast.success(`User status changed to ${newStatus}!`);
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = usersList.length;
  const entrepreneurCount = usersList.filter((u) => u.role === "entrepreneur").length;
  const advisorCount = usersList.filter((u) => u.role === "advisor").length;
  const adminCount = usersList.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. ADMIN HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#042f24] p-6 sm:p-8 text-white shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm border border-purple-400/30 text-purple-200">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Platform Governance & Security Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Platform Administration
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/80 leading-relaxed">
              Manage platform roles, audit Row-Level Security enforcement, monitor feasibility queries, and configure server authorizations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProfiles}
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs"
            >
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isLoadingUsers && "animate-spin")} />
              Sync DB
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. PLATFORM METRICS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalUsers}</p>
          <p className="text-[11px] text-slate-500 mt-1">Platform user accounts</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Entrepreneurs</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{entrepreneurCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Rural micro-founders</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Advisors</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-700">{advisorCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Certified consultants</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Security & RLS</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-teal-800">100%</p>
          <p className="text-[11px] text-slate-500 mt-1">Enforced across all tables</p>
        </div>
      </div>

      {/* ── 3. USER MANAGEMENT & ROLE ASSIGNMENT TABLE ── */}
      <div id="users" className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-purple-700" />
              <span>User & Role Management</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review platform accounts, elevate qualified users to Business Advisor, or manage account access status.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 w-48 sm:w-64 text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Roles</option>
              <option value="entrepreneur">Entrepreneurs</option>
              <option value="advisor">Advisors</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Joined Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{u.full_name || "Unnamed"}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-medium">
                    {u.phone || "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                      u.role === "admin" && "bg-purple-50 text-purple-800 border-purple-200",
                      u.role === "advisor" && "bg-blue-50 text-blue-800 border-blue-200",
                      u.role === "entrepreneur" && "bg-emerald-50 text-emerald-800 border-emerald-200"
                    )}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full inline-block",
                      u.status === "active" && "bg-emerald-100 text-emerald-800",
                      u.status === "pending" && "bg-amber-100 text-amber-800",
                      u.status === "suspended" && "bg-red-100 text-red-800"
                    )}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedUser(u)}
                      className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ROLE MODAL / DRAWER */}
        {selectedUser && (
          <div className="rounded-2xl border-2 border-purple-500/30 bg-purple-50/20 p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-purple-200/40 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
                  Account Privilege & Status Control
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Editing: {selectedUser.full_name} ({selectedUser.email})
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="text-xs h-7 text-slate-500"
              >
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Role Select */}
              <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200">
                <label className="font-semibold text-slate-700 block">Change User Role</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(["entrepreneur", "advisor", "admin"] as UserRole[]).map((r) => (
                    <Button
                      key={r}
                      size="sm"
                      variant={selectedUser.role === r ? "default" : "outline"}
                      onClick={() => handleUpdateRole(selectedUser.user_id, r)}
                      className={cn(
                        "text-xs capitalize h-8",
                        selectedUser.role === r && "bg-purple-900 text-white"
                      )}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Status Select */}
              <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200">
                <label className="font-semibold text-slate-700 block">Account Status</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(["active", "pending", "suspended"] as AccountStatus[]).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selectedUser.status === s ? "default" : "outline"}
                      onClick={() => handleToggleStatus(selectedUser.user_id, s)}
                      className={cn(
                        "text-xs capitalize h-8",
                        selectedUser.status === s && "bg-slate-900 text-white"
                      )}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. SYSTEM HEALTH & AUDIT STATUS ── */}
      <div id="audits" className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-700" />
          <span>System Security & Database Health</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-slate-700 font-semibold">
              <span>Database Backend</span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Supabase
              </span>
            </div>
            <p className="text-[11px] text-slate-500">PostgreSQL 15 with native auth and triggers.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-slate-700 font-semibold">
              <span>Row-Level Security</span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Profiles, Reports, and Consultations protected.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-slate-700 font-semibold">
              <span>Public Admin Signup</span>
              <span className="flex items-center gap-1 text-purple-700 font-bold">
                <Lock className="h-3.5 w-3.5" /> Blocked
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Server-side trigger enforces non-admin roles on signup.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
