
import { useCallback, useEffect, useRef, useState } from "react";
import {
  NavLink,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  ExternalLink,
  FileClock,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Users,
  X,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";
import api from "../services/api";

const navigation = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: ClipboardList,
  },
  {
    label: "Unassigned Reports",
    path: "/reports/unassigned",
    icon: Activity,
  },
  {
    label: "Officers",
    path: "/officers",
    icon: Users,
  },
  {
    label: "Departments",
    path: "/departments",
    icon: Building2,
  },
  {
    label: "Service Areas",
    path: "/service-areas",
    icon: MapPin,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Audit Logs",
    path: "/audit-logs",
    icon: FileClock,
  },
];

const getPageTitle = (pathname) => {
  const item = navigation.find(
    (entry) =>
      entry.path === pathname ||
      (entry.path !== "/" &&
        pathname.startsWith(`${entry.path}/`) &&
        !(
          entry.path === "/reports" &&
          pathname === "/reports/unassigned"
        )),
  );

  return item?.label || "Dashboard";
};

const getInitials = (name) =>
  (name || "Admin")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const notificationRoute = (notification) => {
  const reportId =
    typeof notification.report === "object"
      ? notification.report?._id
      : notification.report;

  if (reportId) return `/reports/${reportId}`;

  if (
    notification.type === "report_assigned" ||
    notification.type === "report_reopened"
  ) {
    return "/reports/unassigned";
  }

  return "/reports";
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const SidebarNavigation = ({
  mobile,
  onNavigate,
  onLogout,
  loggingOut,
}) => {
  const location = useLocation();

  return (
    <>
      <nav
        aria-label="Admin navigation"
        className="flex-1 space-y-1 overflow-y-auto"
      >
        {navigation.map(({ label, path, icon: Icon, end }) => {
          const isActive =
            path === "/"
              ? location.pathname === "/"
              : path === "/reports"
                ? location.pathname === "/reports" ||
                  (location.pathname.startsWith("/reports/") &&
                    location.pathname !== "/reports/unassigned")
                : end
                  ? location.pathname === path
                  : location.pathname === path ||
                    location.pathname.startsWith(`${path}/`);

          return (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={mobile ? onNavigate : undefined}
              className={() =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-rw-primary text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon
                size={18}
                className={
                  isActive
                    ? "text-white"
                    : "text-slate-400"
                }
              />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <Link
          to="/"
          onClick={mobile ? onNavigate : undefined}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={18} className="text-slate-400" />
          Dashboard
        </Link>

        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
        >
          <LogOut size={18} />
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </>
  );
};

const AdminLayout = () => {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const notificationRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get(
        "/notifications/unread-count",
      );

      setUnreadCount(
        Number(response.data?.unreadCount) || 0,
      );
    } catch (error) {
      console.error("Unable to fetch unread count:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotificationLoading(true);
    setNotificationError("");

    try {
      const response = await api.get("/notifications", {
        params: { page: 1, limit: 5 },
      });

      setNotifications(
        Array.isArray(response.data?.notifications)
          ? response.data.notifications
          : [],
      );
    } catch (error) {
      setNotificationError(
        error.response?.data?.message ||
          "Unable to load notifications.",
      );
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    const intervalId = window.setInterval(
      fetchUnreadCount,
      30000,
    );

    return () => window.clearInterval(intervalId);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const toggleNotifications = () => {
    const opening = !notificationsOpen;

    setNotificationsOpen(opening);

    if (opening) {
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  const markAsRead = async (notification) => {
    if (
      notification.isRead ||
      processingId ||
      markingAll
    ) {
      return true;
    }

    setProcessingId(notification._id);
    setNotificationError("");

    try {
      await api.patch(
        `/notifications/${notification._id}/read`,
      );

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true }
            : item,
        ),
      );

      setUnreadCount((count) => Math.max(0, count - 1));

      return true;
    } catch (error) {
      setNotificationError(
        error.response?.data?.message ||
          "Unable to mark notification as read.",
      );

      return false;
    } finally {
      setProcessingId("");
    }
  };

  const markAllAsRead = async () => {
    if (
      unreadCount === 0 ||
      markingAll ||
      processingId
    ) {
      return;
    }

    setMarkingAll(true);
    setNotificationError("");

    try {
      await api.patch("/notifications/read-all");

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      setNotificationError(
        error.response?.data?.message ||
          "Unable to mark notifications as read.",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const handleOpenNotification = async (notification) => {
    if (!(await markAsRead(notification))) return;

    setNotificationsOpen(false);
    navigate(notificationRoute(notification));
  };

  return (
    <div className="min-h-screen bg-rw-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-rw-navy px-4 py-5 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rw-primary text-sm font-bold text-white">
            RW
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight text-white">
              RoadWatch
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Authority console
            </span>
          </span>
        </Link>

        <SidebarNavigation
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />
      </aside>

      <div className="min-h-screen lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-rw-border bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                className="rounded-lg p-2 text-rw-navy transition hover:bg-rw-surface-muted lg:hidden"
              >
                <Menu size={21} />
              </button>

              <h1 className="truncate text-lg font-bold text-rw-navy">
                {getPageTitle(location.pathname)}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={toggleNotifications}
                  aria-label={`Notifications, ${unreadCount} unread`}
                  aria-expanded={notificationsOpen}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-rw-border text-rw-navy transition hover:bg-rw-surface-muted"
                >
                  <Bell size={19} />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rw-primary px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-50 w-[min(370px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-rw-border bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-rw-border px-4 py-4">
                      <div>
                        <h2 className="text-sm font-bold text-rw-navy">
                          Notifications
                        </h2>
                        <p className="mt-1 text-xs text-rw-muted">
                          {unreadCount} unread
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={markAllAsRead}
                        disabled={
                          unreadCount === 0 ||
                          markingAll ||
                          Boolean(processingId)
                        }
                        className="text-xs font-semibold text-orange-700 hover:text-orange-800 disabled:opacity-40"
                      >
                        {markingAll ? "Saving..." : "Mark all read"}
                      </button>
                    </div>

                    {notificationError && (
                      <div
                        role="alert"
                        className="bg-red-50 px-4 py-3 text-xs leading-5 text-red-700"
                      >
                        {notificationError}
                        <button
                          type="button"
                          onClick={fetchNotifications}
                          className="ml-2 font-semibold underline"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {notificationLoading ? (
                      <div className="space-y-3 p-4">
                        {[1, 2, 3].map((item) => (
                          <div
                            key={item}
                            className="animate-pulse"
                          >
                            <div className="h-4 w-32 rounded bg-slate-200" />
                            <div className="mt-2 h-3 w-full rounded bg-slate-100" />
                          </div>
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-rw-navy">
                          No notifications
                        </p>
                        <p className="mt-1 text-xs text-rw-muted">
                          New updates will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[360px] overflow-y-auto">
                        {notifications.map((notification) => (
                          <button
                            key={notification._id}
                            type="button"
                            onClick={() =>
                              handleOpenNotification(notification)
                            }
                            className={`block w-full border-b border-rw-border px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 ${
                              notification.isRead
                                ? "bg-white"
                                : "bg-orange-50/60"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span
                                className={`text-sm text-rw-navy ${
                                  notification.isRead
                                    ? "font-medium"
                                    : "font-bold"
                                }`}
                              >
                                {notification.title || "RoadWatch update"}
                              </span>

                              {!notification.isRead && (
                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rw-primary" />
                              )}
                            </div>

                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                              {notification.message || "There is an update to review."}
                            </p>

                            <p className="mt-2 text-[11px] text-rw-muted">
                              {formatDate(notification.createdAt)}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-rw-border bg-slate-50 px-4 py-3">
                      <p className="text-xs leading-5 text-slate-500">
                        Select a notification to open its related report.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden text-right sm:block">
                <p className="max-w-48 truncate text-sm font-semibold text-rw-navy">
                  {user?.name || "Administrator"}
                </p>
                <p className="mt-0.5 text-xs text-rw-muted">
                  {user?.role === "super_admin"
                    ? "Super Admin"
                    : "Authority Admin"}
                </p>
              </div>

              <div
                title={user?.name || "Administrator"}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-rw-primary-light font-bold text-rw-primary"
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

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/60"
          />

          <aside className="absolute inset-y-0 left-0 flex w-[min(290px,85vw)] flex-col bg-rw-navy px-4 py-5 shadow-2xl">
            <div className="mb-7 flex items-center justify-between px-2">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="text-lg font-bold text-white"
              >
                RoadWatch
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-2 text-white hover:bg-white/10"
              >
                <X size={21} />
              </button>
            </div>

            <SidebarNavigation
              mobile
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
              loggingOut={loggingOut}
            />
          </aside>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;

    