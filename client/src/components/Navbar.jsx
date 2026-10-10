
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const formatNotificationTime = (value) => {
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

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const isCitizen = user?.role === "citizen";

  const dashboardPath =
    user?.role === "citizen"
      ? "/citizen"
      : user?.role === "officer"
        ? "/officer"
        : "/unauthorized";

  const profilePath =
    user?.role === "citizen"
      ? "/citizen/profile"
      : user?.role === "officer"
        ? "/officer/profile"
        : "/unauthorized";

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const closeAccountMenu = () => setAccountMenuOpen(false);
  const closeNotificationMenu = () => setNotificationMenuOpen(false);

  const closeAllMenus = () => {
    closeMobileMenu();
    closeAccountMenu();
    closeNotificationMenu();
  };

  // Refresh the unread badge when authenticated.
  // Poll for changes until the frontend Socket.IO listener is connected.
  useEffect(() => {
    if (!isAuthenticated || !isCitizen) {
      setUnreadCount(0);
      setRecentNotifications([]);
      return undefined;
    }

    let cancelled = false;

    const refreshUnreadCount = async () => {
      try {
        const response = await api.get("/notifications/unread-count");

        if (!cancelled) {
          setUnreadCount(
            Math.max(0, Number(response.data?.unreadCount) || 0)
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch unread notification count:", error);
        }
      }
    };

    refreshUnreadCount();

    const intervalId = window.setInterval(refreshUnreadCount, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshUnreadCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [isAuthenticated, isCitizen]);

  const fetchRecentNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationError("");

    try {
      const response = await api.get("/notifications", {
        params: { page: 1, limit: 5 },
      });

      setRecentNotifications(
        Array.isArray(response.data?.notifications)
          ? response.data.notifications
          : []
      );

      setUnreadCount((current) =>
        Math.max(
          0,
          current,
          ...[]
        )
      );

      // Refresh from the authoritative count endpoint.
      const countResponse = await api.get("/notifications/unread-count");
      setUnreadCount(
        Math.max(0, Number(countResponse.data?.unreadCount) || 0)
      );
    } catch (error) {
      setNotificationError(
        error.response?.data?.message ||
          "Couldn't load your notifications."
      );
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationToggle = () => {
    if (notificationMenuOpen) {
      closeNotificationMenu();
      return;
    }

    closeAccountMenu();
    setNotificationMenuOpen(true);
    fetchRecentNotifications();
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await api.patch(`/notifications/${notification._id}/read`);

        setRecentNotifications((current) =>
          current.map((item) =>
            item._id === notification._id
              ? { ...item, isRead: true, readAt: new Date().toISOString() }
              : item
          )
        );

        setUnreadCount((current) => Math.max(0, current - 1));
      }

      closeAllMenus();

      // Open the report list until individual report details are available.
      navigate("/citizen/reports");
    } catch (error) {
      setNotificationError(
        error.response?.data?.message ||
          "Couldn't mark this notification as read."
      );
    }
  };

  const handleLogout = async () => {
    closeAllMenus();
    await logout();
    navigate("/");
  };

  const scrollToTop = (event) => {
    event.preventDefault();
    closeAllMenus();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const unreadBadge =
    unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <header className="sticky top-0 z-50 border-b border-rw-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[82px] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
        {/* Logo */}
        <a
          href="#home"
          onClick={scrollToTop}
          aria-label="RoadWatch home"
          className="shrink-0"
        >
          <img
            src="/logo/roadwatch-logo.png"
            alt="RoadWatch"
            className="h-14 w-auto max-w-[210px] object-contain object-left"
          />
        </a>

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Main navigation"
        >
          <a
            href="#home"
            onClick={scrollToTop}
            className="text-sm font-semibold text-rw-primary"
          >
            Home
          </a>

          <a
            href="#issues"
            onClick={closeAllMenus}
            className="text-sm font-medium text-rw-text-secondary transition-colors hover:text-rw-primary"
          >
            Reportable Issues
          </a>

          <a
            href="#how-it-works"
            onClick={closeAllMenus}
            className="text-sm font-medium text-rw-text-secondary transition-colors hover:text-rw-primary"
          >
            How It Works
          </a>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          {!loading &&
            (!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-rw-text-secondary transition-colors hover:bg-rw-surface-muted hover:text-rw-navy"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-rw-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rw-primary-dark"
                >
                  Join RoadWatch
                  <ArrowRight size={17} />
                </Link>
              </>
            ) : (
              <>
                {/* Notification bell: shown for citizens */}
                {isCitizen && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleNotificationToggle}
                      aria-label={
                        unreadCount > 0
                          ? `${unreadCount} unread notifications`
                          : "Notifications"
                      }
                      aria-haspopup="dialog"
                      aria-expanded={notificationMenuOpen}
                      title="Notifications"
                      className={`relative flex h-11 w-11 items-center justify-center rounded-xl border bg-white transition-colors ${
                        notificationMenuOpen
                          ? "border-rw-primary bg-rw-primary-light text-rw-primary"
                          : "border-rw-border text-rw-navy hover:border-rw-primary hover:bg-rw-primary-light"
                      }`}
                    >
                      <Bell size={20} strokeWidth={1.8} />

                      {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rw-primary px-1 text-[10px] font-bold text-white">
                          {unreadBadge}
                        </span>
                      )}
                    </button>

                    {notificationMenuOpen && (
                      <>
                        <button
                          type="button"
                          onClick={closeNotificationMenu}
                          aria-label="Close notifications"
                          className="fixed inset-0 z-30 cursor-default"
                        />

                        <div
                          role="dialog"
                          aria-label="Recent notifications"
                          className="absolute right-0 top-full z-40 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-rw-border bg-white shadow-xl"
                        >
                          <div className="flex items-center justify-between border-b border-rw-border px-4 py-4">
                            <div>
                              <h2 className="font-bold text-rw-navy">
                                Notifications
                              </h2>
                              <p className="mt-1 text-xs text-rw-muted">
                                {unreadCount} unread
                              </p>
                            </div>

                            <Bell
                              size={20}
                              className="text-rw-primary"
                            />
                          </div>

                          {notificationError && (
                            <p
                              role="alert"
                              className="px-4 py-3 text-sm text-rw-danger"
                            >
                              {notificationError}
                            </p>
                          )}

                          {notificationsLoading ? (
                            <div className="px-4 py-8 text-center text-sm text-rw-muted">
                              Loading notifications...
                            </div>
                          ) : recentNotifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <Bell
                                size={26}
                                className="mx-auto text-rw-placeholder"
                              />
                              <p className="mt-3 text-sm font-semibold text-rw-navy">
                                You're all caught up
                              </p>
                              <p className="mt-1 text-xs text-rw-muted">
                                New report updates will appear here.
                              </p>
                            </div>
                          ) : (
                            <div className="max-h-[360px] overflow-y-auto">
                              {recentNotifications.map((notification) => (
                                <button
                                  type="button"
                                  key={notification._id}
                                  onClick={() =>
                                    handleNotificationClick(notification)
                                  }
                                  className={`flex w-full items-start gap-3 border-b border-rw-border px-4 py-3 text-left transition hover:bg-rw-background ${
                                    notification.isRead
                                      ? "bg-white"
                                      : "bg-orange-50/60"
                                  }`}
                                >
                                  <span
                                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                      notification.isRead
                                        ? "bg-rw-border-dark"
                                        : "bg-rw-primary"
                                    }`}
                                  />

                                  <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-rw-navy">
                                      {notification.title}
                                    </span>
                                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-rw-muted">
                                      {notification.message}
                                    </span>
                                    <span className="mt-2 block text-[11px] text-rw-placeholder">
                                      {formatNotificationTime(
                                        notification.createdAt
                                      )}
                                    </span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          <Link
                            to="/citizen/notifications"
                            onClick={closeAllMenus}
                            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-rw-primary transition hover:bg-rw-primary-light"
                          >
                            View all notifications
                            <ArrowRight size={16} />
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Account icon and dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      closeNotificationMenu();
                      setAccountMenuOpen((previous) => !previous);
                    }}
                    aria-label="Open account menu"
                    aria-haspopup="menu"
                    aria-expanded={accountMenuOpen}
                    title="Account menu"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-rw-border bg-white text-rw-navy transition-colors hover:border-rw-primary hover:bg-rw-primary-light"
                  >
                    <UserRound size={21} strokeWidth={1.8} />
                  </button>

                  {accountMenuOpen && (
                    <>
                      <button
                        type="button"
                        aria-label="Close account menu"
                        onClick={closeAccountMenu}
                        className="fixed inset-0 z-30 cursor-default"
                      />

                      <div
                        role="menu"
                        aria-label="Account menu"
                        className="absolute right-0 top-full z-40 mt-3 w-52 overflow-hidden rounded-xl border border-rw-border bg-white p-2 shadow-lg"
                      >
                        <Link
                          to={dashboardPath}
                          role="menuitem"
                          onClick={closeAccountMenu}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rw-text-secondary transition-colors hover:bg-rw-primary-light hover:text-rw-primary"
                        >
                          <LayoutDashboard size={18} />
                          Dashboard
                        </Link>

                        <Link
                          to={profilePath}
                          role="menuitem"
                          onClick={closeAccountMenu}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rw-text-secondary transition-colors hover:bg-rw-primary-light hover:text-rw-primary"
                        >
                          <CircleUserRound size={18} />
                          Profile
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                {/* Separate logout button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Sign out"
                  title="Sign out"
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-rw-muted transition-colors hover:bg-rw-danger-light hover:text-rw-danger"
                >
                  <LogOut size={20} />
                </button>
              </>
            ))}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen((previous) => !previous)
          }
          className="rounded-xl p-2 text-rw-navy transition-colors hover:bg-rw-surface-muted md:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-rw-border bg-white px-5 py-5 md:hidden">
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-1"
            aria-label="Mobile navigation"
          >
            <a
              href="#home"
              onClick={scrollToTop}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-rw-primary hover:bg-rw-surface-muted"
            >
              Home
            </a>

            <a
              href="#issues"
              onClick={closeMobileMenu}
              className="rounded-xl px-4 py-3 text-sm font-medium text-rw-text-secondary hover:bg-rw-surface-muted"
            >
              Reportable Issues
            </a>

            <a
              href="#how-it-works"
              onClick={closeMobileMenu}
              className="rounded-xl px-4 py-3 text-sm font-medium text-rw-text-secondary hover:bg-rw-surface-muted"
            >
              How It Works
            </a>

            {!loading &&
              (!isAuthenticated ? (
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-rw-border pt-4">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="rounded-xl border border-rw-border px-3 py-3 text-center text-sm font-semibold text-rw-navy"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-rw-primary px-3 py-3 text-sm font-semibold text-white"
                  >
                    Join RoadWatch
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-2 border-t border-rw-border pt-4">
                  {isCitizen && (
                    <Link
                      to="/citizen/notifications"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-rw-text-secondary transition-colors hover:bg-rw-primary-light hover:text-rw-primary"
                    >
                      <span className="flex items-center gap-3">
                        <Bell size={18} />
                        Notifications
                      </span>

                      {unreadCount > 0 && (
                        <span className="rounded-full bg-rw-primary px-2 py-0.5 text-xs font-bold text-white">
                          {unreadBadge}
                        </span>
                      )}
                    </Link>
                  )}

                  <Link
                    to={dashboardPath}
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rw-text-secondary transition-colors hover:bg-rw-primary-light hover:text-rw-primary"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Link>

                  <Link
                    to={profilePath}
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rw-text-secondary transition-colors hover:bg-rw-primary-light hover:text-rw-primary"
                  >
                    <CircleUserRound size={18} />
                    Profile
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rw-danger transition-colors hover:bg-rw-danger-light"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
