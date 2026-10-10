
import { useState } from "react";
import {
  NavLink,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
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
  {
    label: "Overview",
    path: "/officer",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Assigned Reports",
    path: "/officer/assignments",
    icon: ClipboardList,
  },
  {
    label: "In Progress",
    path: "/officer/in-progress",
    icon: Wrench,
  },
  {
    label: "Resolved Reports",
    path: "/officer/resolved",
    icon: CheckCircle2,
  },
  {
    label: "Notifications",
    path: "/officer/notifications",
    icon: Bell,
  },
  {
    label: "My Profile",
    path: "/officer/profile",
    icon: UserRound,
  },
];

const getPageTitle = (pathname) => {
  const currentPage = navigation.find(
    (item) =>
      item.path === pathname ||
      (item.path !== "/officer" &&
        pathname.startsWith(`${item.path}/`))
  );

  return currentPage?.label || "Overview";
};

const getInitials = (name) =>
  (name || "Officer")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const SidebarNavigation = ({ mobile, onNavigate, onLogout, loggingOut }) => (
  <>
    <nav
      className="flex-1 space-y-1.5"
      aria-label="Officer navigation"
    >
      {navigation.map(({ label, path, icon: Icon, end }) => (
        <NavLink
          key={path}
          to={path}
          end={end}
          onClick={mobile ? onNavigate : undefined}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
              isActive
                ? "bg-rw-primary text-white"
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

              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>

    <div className="mt-5 border-t border-white/10 pt-4">
      <Link
        to="/"
        onClick={mobile ? onNavigate : undefined}
        className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
      >
        <ExternalLink size={18} className="text-slate-400" />
        Public website
      </Link>

      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
      >
        <LogOut size={18} />
        {loggingOut ? "Signing out..." : "Sign out"}
      </button>
    </div>
  </>
);

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

  return (
    <div className="min-h-screen bg-rw-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-rw-navy px-4 py-5 lg:flex">
        <Link
          to="/officer"
          className="mb-8 flex shrink-0 items-center px-2"
        >
          <img
            src="/logo/roadwatch-logo.png"
            alt="RoadWatch"
            className="h-12 w-auto max-w-[175px] object-contain object-left"
          />
        </Link>

        <SidebarNavigation
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-64">
        {/* Minimal header */}
        <header className="sticky top-0 z-30 border-b border-rw-border bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation"
                className="rounded-xl p-2 text-rw-navy transition hover:bg-rw-surface-muted lg:hidden"
              >
                <Menu size={22} />
              </button>

              <h1 className="truncate text-lg font-bold text-rw-navy">
                {getPageTitle(location.pathname)}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-48 truncate text-sm font-semibold text-rw-navy">
                  {user?.name || "Officer"}
                </p>
                <p className="mt-0.5 text-xs text-rw-muted">
                  Officer
                </p>
              </div>

              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-rw-primary-light font-bold text-rw-primary"
                aria-label={`Signed in as ${user?.name || "Officer"}`}
                title={user?.name || "Officer"}
              >
                {getInitials(user?.name)}
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

          <aside className="absolute inset-y-0 left-0 flex w-[min(290px,85vw)] flex-col bg-rw-navy px-4 py-5 shadow-2xl">
            <div className="mb-8 flex shrink-0 items-center justify-between px-2">
              <Link to="/officer" onClick={closeMobileNav}>
                <img
                  src="/logo/roadwatch-logo.png"
                  alt="RoadWatch"
                  className="h-11 w-auto max-w-[165px] object-contain object-left"
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

            <SidebarNavigation
              mobile
              onNavigate={closeMobileNav}
              onLogout={handleLogout}
              loggingOut={loggingOut}
            />
          </aside>
        </div>
      )}
    </div>
  );
};

export default OfficerLayout;
