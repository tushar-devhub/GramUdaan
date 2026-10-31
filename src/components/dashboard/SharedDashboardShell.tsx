import { useState, useEffect, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/i18n/LanguageContext";
import logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bot,
  ShieldCheck,
  Scale,
  Wallet,
  Compass,
  Calculator,
  MapPin,
  Landmark,
  FileText,
  IndianRupee,
  Users,
  Briefcase,
  Sliders,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  Sparkles,
  Languages,
  User as UserIcon,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  title: string;
  titleHi: string;
  to: string;
  icon: any;
  exact?: boolean;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export function SharedDashboardShell() {
  const { user, isEntrepreneur, isAdvisor, isAdmin, signOut, roleDashboardUrl } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate("/signin");
  };

  // Define navigation groups tailored by role
  const navGroups: NavGroup[] = isAdmin
    ? [
        {
          groupName: "Administration",
          items: [
            { title: "Platform Overview", titleHi: "प्लेटफ़ॉर्म अवलोकन", to: "/dashboard/admin", icon: LayoutDashboard, exact: true },
            { title: "User & Role Management", titleHi: "उपयोगकर्ता और भूमिका", to: "/dashboard/admin#users", icon: Users },
            { title: "System Audits", titleHi: "सिस्टम ऑडिट", to: "/dashboard/admin#audits", icon: Sliders },
          ],
        },
        {
          groupName: "Diagnostics & Tools",
          items: [
            { title: "Feasibility Engine", titleHi: "व्यवहार्यता इंजन", to: "/analysis", icon: ShieldCheck },
            { title: "Government Schemes", titleHi: "सरकारी योजनाएं", to: "/schemes", icon: Landmark },
            { title: "AI Advisor Core", titleHi: "एआई सलाहकार", to: "/advisor", icon: Bot },
          ],
        },
      ]
    : isAdvisor
    ? [
        {
          groupName: "Advisor Workspace",
          items: [
            { title: "Advisor Dashboard", titleHi: "सलाहकार डैशबोर्ड", to: "/dashboard/advisor", icon: LayoutDashboard, exact: true },
            { title: "Client Directory", titleHi: "उद्यमी सूची", to: "/dashboard/advisor#clients", icon: Users },
            { title: "Feasibility Reviews", titleHi: "रिपोर्ट समीक्षा", to: "/dashboard/advisor#reviews", icon: FileText },
          ],
        },
        {
          groupName: "Advisory Engines",
          items: [
            { title: "Business Feasibility", titleHi: "व्यवसाय व्यवहार्यता", to: "/analysis", icon: ShieldCheck },
            { title: "Market & Mandi Trends", titleHi: "बाज़ार और मंडी", to: "/market", icon: MapPin },
            { title: "Government Schemes", titleHi: "सरकारी योजनाएं", to: "/schemes", icon: Landmark },
            { title: "AI Rural Advisor", titleHi: "एआई सलाहकार", to: "/advisor", icon: Bot },
          ],
        },
      ]
    : [
        // Role A: Entrepreneur
        {
          groupName: "Overview",
          items: [
            { title: "My Business Hub", titleHi: "मेरा डैशबोर्ड", to: "/dashboard/entrepreneur", icon: LayoutDashboard, exact: true },
            { title: "AI Rural Advisor", titleHi: "एआई सलाहकार", to: "/advisor", icon: Bot },
          ],
        },
        {
          groupName: "Feasibility & Market",
          items: [
            { title: "Feasibility Analysis", titleHi: "व्यवहार्यता विश्लेषण", to: "/analysis", icon: ShieldCheck },
            { title: "Hyperlocal Market", titleHi: "स्थानीय बाज़ार", to: "/market", icon: MapPin },
            { title: "Compare Ideas", titleHi: "व्यवसाय तुलना", to: "/compare", icon: Scale },
          ],
        },
        {
          groupName: "Financial Planning",
          items: [
            { title: "Financial Viability", titleHi: "वित्तीय स्थिति", to: "/finance", icon: Wallet },
            { title: "Startup Road Map", titleHi: "व्यवसाय योजना", to: "/plan", icon: Compass },
            { title: "Sensitivity / What-If", titleHi: "क्या-अगर मॉडल", to: "/what-if", icon: Calculator },
          ],
        },
        {
          groupName: "Schemes & Reports",
          items: [
            { title: "Govt Subsidies", titleHi: "सरकारी योजनाएं", to: "/schemes", icon: Landmark },
            { title: "Saved Reports", titleHi: "सुरक्षित रिपोर्ट", to: "/reports", icon: FileText, exact: true },
            { title: "Loan Application Draft", titleHi: "ऋण आवेदन मसौदा", to: "/application", icon: IndianRupee },
          ],
        },
      ];

  const roleLabel = isAdmin ? "Administrator" : isAdvisor ? "Business Advisor" : "Entrepreneur";
  const roleBadgeColor = isAdmin
    ? "bg-purple-50 text-purple-800 border-purple-200"
    : isAdvisor
    ? "bg-blue-50 text-blue-800 border-blue-200"
    : "bg-emerald-50 text-emerald-800 border-emerald-200";

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col antialiased">
      {/* ── TOP HEADER / NAVBAR ── */}
      <header className="sticky top-0 z-40 h-16 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* GramUdaan Brand Logo */}
          <Link to={roleDashboardUrl} className="flex items-center gap-2.5">
            <img src={logo} alt="GramUdaan Logo" className="h-9 w-9 rounded-xl shadow-xs" />
            <div className="hidden sm:block">
              <span className="text-base font-bold text-slate-900 tracking-tight font-serif-display leading-tight block">
                GramUdaan
              </span>
              <span className="text-[10px] text-emerald-800 font-semibold tracking-wider uppercase block">
                {roleLabel} Portal
              </span>
            </div>
          </Link>

          {/* Role badge */}
          <div className="hidden md:flex items-center ml-3">
            <span className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-full border", roleBadgeColor)}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
            title="Switch Language / भाषा बदलें"
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Languages className="h-3.5 w-3.5 text-slate-500" />
            <span>{language === "hi" ? "English" : "हिंदी"}</span>
          </button>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2">
              <DropdownMenuLabel className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-[10px] text-emerald-700 font-normal cursor-pointer" onClick={() => setUnreadNotifications(0)}>
                  Mark all as read
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-1 py-1">
                <div className="p-2.5 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 text-xs cursor-pointer transition-colors">
                  <p className="font-semibold text-slate-900">MUDRA Scheme Rate Updated</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Government has updated loan subsidies for micro-units.</p>
                  <span className="text-[10px] text-emerald-700 font-medium mt-1 block">1 hour ago</span>
                </div>
                <div className="p-2.5 rounded-xl hover:bg-slate-50 text-xs cursor-pointer transition-colors">
                  <p className="font-semibold text-slate-900">Mandi Price Feed Verified</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Daily wholesale mandi records synced from data.gov.in.</p>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 block">Today</span>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-800 text-white text-xs font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                  {user?.name || "My Account"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5">
              <div className="px-2 py-1.5">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "GramUdaan User"}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || "Signed in"}</p>
                <span className={cn("inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border", roleBadgeColor)}>
                  {roleLabel}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer text-xs flex items-center gap-2">
                  <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span>Profile & Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={roleDashboardUrl} className="cursor-pointer text-xs flex items-center gap-2">
                  <LayoutDashboard className="h-3.5 w-3.5 text-slate-500" />
                  <span>My Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-xs text-red-600 focus:text-red-700 focus:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA WITH SIDEBAR ── */}
      <div className="flex-1 flex w-full">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={cn(
            "hidden lg:flex flex-col justify-between border-r border-slate-200/80 bg-white transition-all duration-300 select-none",
            isCollapsed ? "w-20" : "w-64"
          )}
        >
          {/* Nav Items */}
          <div className="p-3 space-y-6 overflow-y-auto">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {!isCollapsed && (
                  <h5 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {group.groupName}
                  </h5>
                )}
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to);

                  return (
                    <NavLink
                      key={itemIdx}
                      to={item.to}
                      title={isCollapsed ? item.title : undefined}
                      className={({ isActive: navActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                          navActive || isActive
                            ? "bg-emerald-800 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )
                      }
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", (isActive) ? "text-white" : "text-slate-500")} />
                      {!isCollapsed && (
                        <span className="truncate">{language === "hi" ? item.titleHi : item.title}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Collapse Toggle & Bottom Quick Card */}
          <div className="p-3 border-t border-slate-100 space-y-2">
            {!isCollapsed && (
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                  <span>AI Advisory Active</span>
                </div>
                <p className="text-[11px] text-emerald-800/80 leading-snug">
                  Ask GramUdaan AI any rural finance or business question anytime.
                </p>
                <Link
                  to="/advisor"
                  className="inline-block text-[11px] font-bold text-emerald-800 hover:underline pt-0.5"
                >
                  Launch Advisor →
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-center w-full py-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-xs font-medium"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <span className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" /> Collapse Sidebar
                </span>
              )}
            </button>
          </div>
        </aside>

        {/* MOBILE SLIDE-OVER DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu Panel */}
            <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col justify-between p-4 shadow-xl z-10 overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <img src={logo} alt="GramUdaan" className="h-8 w-8 rounded-lg" />
                    <div>
                      <span className="font-bold text-sm text-slate-900">GramUdaan</span>
                      <span className="block text-[10px] text-emerald-800 font-semibold">{roleLabel}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {navGroups.map((group, groupIdx) => (
                  <div key={groupIdx} className="space-y-1">
                    <h5 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      {group.groupName}
                    </h5>
                    {group.items.map((item, itemIdx) => {
                      const Icon = item.icon;
                      const isActive = item.exact
                        ? location.pathname === item.to
                        : location.pathname.startsWith(item.to);

                      return (
                        <NavLink
                          key={itemIdx}
                          to={item.to}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                            isActive
                              ? "bg-emerald-800 text-white shadow-xs"
                              : "text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-500")} />
                          <span>{language === "hi" ? item.titleHi : item.title}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>Settings & Profile</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OUTLET PAGE CONTAINER */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
