
import { useState } from "react";
import {
  NavLink,
  Link,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  Bell,
  ClipboardList,
  FilePlus2,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const navigation = [
  {
    label: "Overview",
    path: "/citizen",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "My Reports",
    path: "/citizen/reports",
    icon: ClipboardList,
  },
  {
    label: "Notifications",
    path: "/citizen/notifications",
    icon: Bell,
  },
  {
    label: "My Profile",
    path: "/citizen/profile",
    icon: UserRound,
  },
];

const CitizenLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const closeSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-[82px] items-center border-b border-rw-border px-6">
        <Link to="/" onClick={closeSidebar} aria-label="RoadWatch home">
          <img
            src="/logo/roadwatch-logo.png"
            alt="RoadWatch"
            className="h-12 w-auto max-w-[180px] object-contain object-left"
          />
        </Link>

        <button
          type="button"
          onClick={closeSidebar}
          className="ml-auto rounded-lg p-2 text-rw-muted hover:bg-rw-surface-muted lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main action */}
      <div className="px-4 pt-6">
        <Link
          to="/citizen/report"
          onClick={closeSidebar}
          className="flex items-center justify-center gap-2 rounded-xl bg-rw-primary px-4 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-rw-primary-dark"
        >
          <FilePlus2 size={19} />
          Report a Problem
        </Link>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Citizen navigation"
        className="mt-7 flex-1 px-4"
      >
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-rw-muted">
          Workspace
        </p>

        <div className="space-y-1.5">
          {navigation.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-orange-50 text-orange-800"
                    : "text-rw-text-secondary hover:bg-rw-surface-muted hover:text-rw-navy"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={19}
                    className={
                      isActive
                        ? "text-rw-primary"
                        : "text-rw-muted"
                    }
                  />
                  <span>{label}</span>

                  {isActive && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-rw-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom links */}
      <div className="border-t border-rw-border p-4">
        <Link
          to="/"
          onClick={closeSidebar}
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-rw-text-secondary transition-colors hover:bg-rw-surface-muted"
        >
          <Home size={18} className="text-rw-muted" />
          Public Website
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-rw-muted transition-colors hover:bg-rw-danger-light hover:text-rw-danger"
        >
          <LogOut size={18} />
          Sign Out
        </button>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-rw-surface-muted p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rw-navy text-sm font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "C"}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-rw-navy">
              {user?.name || "Citizen"}
            </p>
            <p className="text-xs capitalize text-rw-muted">
              Community member
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-rw-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-rw-border bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={closeSidebar}
            className="absolute inset-0 bg-rw-navy/40 backdrop-blur-[2px]"
          />

          <aside className="relative z-10 h-full w-[min(300px,85vw)] border-r border-rw-border bg-white shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main application area */}
      <div className="min-h-screen min-w-0 lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-rw-border bg-white/95 backdrop-blur">
          <div className="flex h-[82px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-xl p-2 text-rw-navy transition-colors hover:bg-rw-surface-muted lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={22} />
              </button>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-rw-navy">
                  Citizen Workspace
                </p>
                <p className="hidden text-xs text-rw-muted sm:block">
                  Your community, your voice.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Link
                to="/citizen/profile"
                className="flex items-center gap-2 rounded-xl border border-rw-border px-3 py-2 transition-colors hover:bg-rw-surface-muted"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-sm font-bold text-rw-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || "C"}
                </div>

                <span className="hidden max-w-32 truncate text-sm font-medium text-rw-navy sm:block">
                  {user?.name || "My Account"}
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* Child pages render here */}
        <main className="mx-auto w-full max-w-[1600px] p-5 sm:p-8 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CitizenLayout;

