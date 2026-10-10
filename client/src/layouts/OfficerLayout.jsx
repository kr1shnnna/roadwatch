
import { useCallback, useEffect, useRef, useState } from "react";
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
import api from "../services/api";

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
    label: "My Profile",
    path: "/officer/profile",
    icon: UserRound,
  },
];

const formatNotificationDate = (value) => {
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

const isNotificationRead = (notification) =>
  Boolean(notification?.isRead ?? notification?.read);

const getNotificationRoute = (notification) => {
  switch (notification?.type) {
    case "report_assigned":
    case "report_reopened":
      return "/officer/assignments";

    case "report_resolved":
    case "report_confirmed":
      return "/officer/resolved";

    default:
      return "/officer/assignments";
  }
};

const getNotificationType = (type) => {
  const labels = {
    report_assigned: "New assignment",
    report_reopened: "Report reopened",
    report_resolved: "Report resolved",
    report_confirmed: "Resolution confirmed",
  };

  return labels[type] || "RoadWatch update";
};

const getPageTitle = (pathname) => {
  const currentPage = navigation.find(
    (item) =>
      item.path === pathname ||
      (item.path !== "/officer" &&
        pathname.startsWith(`${item.path}/`)),
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

const SidebarNavigation = ({
  mobile,
  onNavigate,
  onLogout,
  loggingOut,
}) => (
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

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] =
    useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const notificationRef = useRef(null);

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

  const fetchRecentNotifications = useCallback(async () => {
    setNotificationsLoading(true);
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
          "Unable to load notifications. Please try again.",
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Keep the unread badge reasonably current.
  useEffect(() => {
    fetchUnreadCount();

    const intervalId = window.setInterval(
      fetchUnreadCount,
      30000,
    );

    return () => window.clearInterval(intervalId);
  }, [fetchUnreadCount]);

  // Close the dropdown when clicking outside it.
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

  const toggleNotifications = () => {
    const opening = !notificationsOpen;

    setNotificationsOpen(opening);

    if (opening) {
      fetchRecentNotifications();
      fetchUnreadCount();
    }
  };

  const handleMarkAsRead = async (notification) => {
    if (
      isNotificationRead(notification) ||
      processingId ||
      markingAll
    ) {
      return;
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
            ? { ...item, isRead: true, read: true }
            : item,
        ),
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      setNotificationError(
        error.response?.data?.message ||
          "Unable to mark notification as read.",
      );
    } finally {
      setProcessingId("");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll || processingId) {
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
          read: true,
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
  if (!isNotificationRead(notification)) {
    setProcessingId(notification._id);
    setNotificationError("");

    try {
      await api.patch(
        `/notifications/${notification._id}/read`,
      );

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true, read: true }
            : item,
        ),
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      setNotificationError(
        error.response?.data?.message ||
          "Unable to mark notification as read.",
      );
      return;
    } finally {
      setProcessingId("");
    }
  }

  setNotificationsOpen(false);
  navigate(getNotificationRoute(notification));
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
              {/* Notification bell and dropdown */}
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={toggleNotifications}
                  aria-label={`Notifications${
                    unreadCount > 0
                      ? `, ${unreadCount} unread`
                      : ""
                  }`}
                  aria-expanded={notificationsOpen}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-rw-border bg-white text-rw-navy transition hover:bg-rw-surface-muted"
                >
                  <Bell size={19} />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rw-primary px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
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
                        onClick={handleMarkAllAsRead}
                        disabled={
                          unreadCount === 0 ||
                          markingAll ||
                          Boolean(processingId)
                        }
                        className="text-xs font-semibold text-orange-700 transition hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {markingAll ? "Saving..." : "Mark all read"}
                      </button>
                    </div>

                    {notificationError && (
                      <div
                        role="alert"
                        className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700"
                      >
                        {notificationError}
                        <button
                          type="button"
                          onClick={fetchRecentNotifications}
                          className="ml-2 font-semibold underline"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {notificationsLoading ? (
                      <div className="space-y-3 p-4">
                        {[1, 2, 3].map((item) => (
                          <div key={item} className="animate-pulse">
                            <div className="h-3 w-28 rounded bg-slate-200" />
                            <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
                            <div className="mt-2 h-3 w-full rounded bg-slate-100" />
                          </div>
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-9 text-center">
                        <p className="text-sm font-semibold text-rw-navy">
                          You're all caught up
                        </p>
                        <p className="mt-1 text-xs leading-5 text-rw-muted">
                          New assignment updates will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[360px] overflow-y-auto">
                        {notifications.map((notification) => {
                          const read =
                            isNotificationRead(notification);

                          return (
                            <div
                              key={notification._id}
                              className={`border-b border-rw-border last:border-b-0 ${
                                read
                                  ? "bg-white"
                                  : "bg-orange-50/60"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenNotification(notification)
                                }
                                className="block w-full px-4 py-3 text-left transition hover:bg-slate-50"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <p
                                    className={`text-sm text-rw-navy ${
                                      read
                                        ? "font-medium"
                                        : "font-bold"
                                    }`}
                                  >
                                    {notification.title ||
                                      getNotificationType(
                                        notification.type,
                                      )}
                                  </p>

                                  {!read && (
                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rw-primary" />
                                  )}
                                </div>

                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                                  {notification.message ||
                                    "There's an update to review."}
                                </p>

                                <p className="mt-2 text-[11px] text-rw-muted">
                                  {formatNotificationDate(
                                    notification.createdAt,
                                  )}
                                </p>
                              </button>

                              {!read && (
                                <div className="px-4 pb-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMarkAsRead(notification)
                                    }
                                    disabled={
                                      Boolean(processingId) ||
                                      markingAll
                                    }
                                    className="text-xs font-semibold text-slate-500 transition hover:text-rw-navy disabled:opacity-50"
                                  >
                                    {processingId === notification._id
                                      ? "Saving..."
                                      : "Mark as read"}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="border-t border-rw-border bg-slate-50 px-4 py-3">
                      <p className="text-xs leading-5 text-slate-500">
                        Select a notification to open the relevant reports section.
                      </p>
                    </div>
                  </div>
                )}
              </div>

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

