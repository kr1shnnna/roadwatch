
import { useState } from "react";
import {
  NavLink,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Activity,
  Bell,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const navigation = [
  { label: "Overview", path: "/officer", icon: LayoutDashboard, end: true },
  { label: "Assigned reports", path: "/officer/assignments", icon: ClipboardList },
  { label: "In progress", path: "/officer/in-progress", icon: Wrench },
  { label: "Resolved reports", path: "/officer/resolved", icon: CheckCircle2 },
  { label: "Notifications", path: "/officer/notifications", icon: Bell },
  { label: "My profile", path: "/officer/profile", icon: UserRound },
];

const getPageTitle = (pathname) => {
  const item = navigation.find(
    (entry) =>
      entry.path === pathname ||
      (entry.path !== "/officer" && pathname.startsWith(`${entry.path}/`))
  );

  return item?.label || "Officer workspace";
};

const OfficerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const closeMobileNav = () => setMobileNavOpen(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
      navigate("/", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const SidebarNavigation = ({ mobile = false }) => (
    <>
      <nav className="flex-1 space-y-1.5" aria-label="Officer navigation">
        <p className="mb-3 px-3 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Workspace
        </p>

        {navigation.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            onClick={mobile ? closeMobileNav : undefined}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-rw-primary text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={19}
                  className={
                    isActive
                      ? "text-white"
                      : "text-slate-400 transition group-hover:text-rw-primary"
                  }
                />
                <span className="flex-1">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 border-t border-white/10 pt-4">
        <Link
          to="/"
          onClick={mobile ? closeMobileNav : undefined}
          className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={18} className="text-slate-400" />
          Public website
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
        >
          <LogOut size={18} />
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-rw-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-rw-navy px-4 py-5 lg:flex">
        <Link to="/officer" className="flex items-center gap-3 px-2 pb-6">
          <img
            src="/logo/roadwatch-logo.png"
            alt="RoadWatch"
            className="h-12 w-auto max-w-[175px] object-contain object-left"
          />
        </Link>

        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rw-primary text-white">
              <Activity size={20} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                Officer workspace
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Field operations
              </p>
            </div>
          </div>
        </div>

        <SidebarNavigation />
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-rw-border bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open officer navigation"
                className="rounded-xl p-2 text-rw-navy transition hover:bg-rw-surface-muted lg:hidden"
              >
                <Menu size={22} />
              </button>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rw-primary">
                  ROADWATCH / OPERATIONS
                </p>
                <h1 className="mt-1 truncate text-sm font-bold text-rw-navy sm:text-base">
                  {getPageTitle(location.pathname)}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-48 truncate text-sm font-semibold text-rw-navy">
                  {user?.name || "RoadWatch Officer"}
                </p>
                <p className="mt-1 text-xs text-rw-muted">
                  Authorized officer
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rw-border bg-rw-primary-light font-bold text-rw-primary">
                {(user?.name || "O")
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join("")}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 sm:py-9">
          <Outlet />
        </main>
      </div>

      {/* Mobile sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMobileNav}
            className="absolute inset-0 bg-slate-950/60"
          />

          <aside className="absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col bg-rw-navy px-4 py-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between px-2">
              <Link to="/officer" onClick={closeMobileNav}>
                <img
                  src="/logo/roadwatch-logo.png"
                  alt="RoadWatch"
                  className="h-11 w-auto max-w-[170px] object-contain object-left"
                />
              </Link>

              <button
                type="button"
                onClick={closeMobileNav}
                aria-label="Close navigation"
                className="rounded-lg p-2 text-white transition hover:bg-white/10"
              >
                <X size={21} />
              </button>
            </div>

            <SidebarNavigation mobile />
          </aside>
        </div>
      )}
    </div>
  );
};

export default OfficerLayout;

