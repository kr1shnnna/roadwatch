
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import api from "../../services/api";

const NOTIFICATION_META = {
  report_assigned: {
    label: "Report assigned",
    icon: UserRound,
    iconClass: "bg-rw-info-light text-rw-info",
  },
  report_resolved: {
    label: "Report resolved",
    icon: CheckCircle2,
    iconClass: "bg-rw-success-light text-rw-success",
  },
  report_confirmed: {
    label: "Resolution confirmed",
    icon: ShieldCheck,
    iconClass: "bg-rw-success-light text-rw-success",
  },
  report_reopened: {
    label: "Report reopened",
    icon: RotateCcw,
    iconClass: "bg-rw-warning-light text-rw-warning",
  },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatCategory = (value) =>
  value?.replaceAll("_", " ") || "Road issue";

const NotificationCard = ({ notification, onMarkRead, marking }) => {
  const meta = NOTIFICATION_META[notification.type] || {
    label: "Notification",
    icon: Bell,
    iconClass: "bg-rw-surface-muted text-rw-muted",
  };

  const Icon = meta.icon;
  const report =
    notification.report && typeof notification.report === "object"
      ? notification.report
      : null;

  return (
    <article
      className={`rounded-2xl border p-5 transition ${
        notification.isRead
          ? "border-rw-border bg-white"
          : "border-orange-200 bg-orange-50/40 shadow-sm"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.iconClass}`}
        >
          <Icon size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-rw-muted">
              {meta.label}
            </span>

            {!notification.isRead && (
              <span className="rounded-full bg-rw-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                New
              </span>
            )}
          </div>

          <h2 className="mt-2 break-words text-base font-bold text-rw-navy">
            {notification.title || "RoadWatch update"}
          </h2>

          <p className="mt-2 break-words text-sm leading-6 text-rw-muted">
            {notification.message}
          </p>

          {report && (
            <div className="mt-4 rounded-xl border border-rw-border bg-white/80 p-3">
              <div className="flex items-start gap-2">
                <ClipboardList
                  size={17}
                  className="mt-0.5 shrink-0 text-rw-primary"
                />
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-rw-navy">
                    {report.title || "Related report"}
                  </p>

                  <p className="mt-1 text-xs capitalize text-rw-muted">
                    {formatCategory(report.category)}
                    {report.status
                      ? ` · ${formatCategory(report.status)}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-rw-muted">
              <Clock3 size={14} />
              {formatDate(notification.createdAt)}
            </span>

            <div className="flex flex-wrap items-center gap-3">
              {report && (
                <Link
                  to="/citizen/reports"
                  className="text-xs font-semibold text-rw-primary transition hover:text-rw-primary-dark"
                >
                  View my reports
                </Link>
              )}

              {!notification.isRead && (
                <button
                  type="button"
                  onClick={() => onMarkRead(notification._id)}
                  disabled={marking === notification._id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rw-border bg-white px-3 py-2 text-xs font-semibold text-rw-text-secondary transition hover:border-rw-primary hover:text-rw-primary disabled:opacity-50"
                >
                  {marking === notification._id ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Mark as read
                </button>
              )}

              {notification.isRead && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rw-success">
                  <CheckCircle2 size={14} />
                  Read
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const NotificationSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-rw-border bg-white p-5">
    <div className="flex gap-4">
      <div className="h-12 w-12 shrink-0 rounded-xl bg-rw-surface-muted" />
      <div className="flex-1 space-y-3">
        <div className="h-3 w-28 rounded bg-rw-surface-muted" />
        <div className="h-5 w-2/3 rounded bg-rw-surface-muted" />
        <div className="h-4 w-full rounded bg-rw-surface-muted" />
        <div className="h-4 w-1/2 rounded bg-rw-surface-muted" />
      </div>
    </div>
  </div>
);

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [marking, setMarking] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchNotifications = async () => {
      setLoading(true);
      setError("");
      setActionError("");

      const params = { page, limit: 10 };

      if (activeFilter === "unread") params.unread = "true";
      if (activeFilter === "read") params.unread = "false";

      try {
        const response = await api.get("/notifications", { params });

        if (cancelled) return;

        setNotifications(
          Array.isArray(response.data?.notifications)
            ? response.data.notifications
            : []
        );

        setPagination(
          response.data?.pagination || {
            page,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          }
        );

        try {
          const countResponse = await api.get(
            "/notifications/unread-count"
          );

          if (!cancelled) {
            setUnreadCount(
              Math.max(
                0,
                Number(countResponse.data?.unreadCount) || 0
              )
            );
          }
        } catch (countError) {
          console.error("Unable to refresh unread count:", countError);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Couldn't load notifications. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, [activeFilter, page, reloadKey]);

  const handleMarkRead = async (notificationId) => {
    setMarking(notificationId);
    setActionError("");

    try {
      await api.patch(`/notifications/${notificationId}/read`);

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : notification
        )
      );

     // Refresh the current filtered list, so read items disappear
      // when the Unread filter is active.
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ||
          "Couldn't mark the notification as read."
      );
    } finally {
      setMarking("");
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setActionError("");

    try {
      await api.patch("/notifications/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
      setPage(1);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ||
          "Couldn't mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/citizen"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-rw-muted transition hover:text-rw-primary"
          >
            <ArrowLeft size={16} />
            Back to overview
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rw-primary">
            Stay in the loop
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-rw-navy sm:text-4xl">
            Notifications
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-rw-muted sm:text-base">
            Updates about assignments, work progress, and report resolutions.
          </p>
        </div>

        <Link
          to="/citizen/reports"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rw-border bg-white px-4 py-3 text-sm font-semibold text-rw-navy transition hover:bg-rw-surface-muted"
        >
          My reports
          <ArrowRight size={17} />
        </Link>
      </header>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rw-primary-light text-rw-primary">
              <Bell size={22} />
            </div>

            <div>
              <p className="text-sm text-rw-muted">Unread notifications</p>
              <p className="mt-1 text-2xl font-bold text-rw-navy">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={markingAll || unreadCount === 0}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rw-border bg-white px-5 py-4 text-sm font-semibold text-rw-text-secondary shadow-sm transition hover:border-rw-primary hover:text-rw-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {markingAll ? (
            <RefreshCw size={17} className="animate-spin" />
          ) : (
            <CheckCheck size={18} />
          )}
          Mark all as read
        </button>
      </section>

      {/* Filters and list count */}
      <section className="rounded-2xl border border-rw-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const selected = activeFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setActiveFilter(filter.value);
                    setPage(1);
                  }}
                  aria-pressed={selected}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    selected
                      ? "bg-rw-navy text-white"
                      : "bg-rw-surface-muted text-rw-text-secondary hover:bg-rw-border"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-semibold text-rw-muted transition hover:bg-rw-surface-muted hover:text-rw-navy disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <p className="mt-4 border-t border-rw-border pt-4 text-sm text-rw-muted">
          {loading
            ? "Loading notifications..."
            : `Showing ${notifications.length} of ${pagination.total} notifications`}
        </p>
      </section>

      {/* Action feedback */}
      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-rw-danger/20 bg-rw-danger-light p-4 text-sm text-rw-danger"
        >
          {actionError}
        </div>
      )}

      {/* Fetch error */}
      {error && !loading && (
        <div
          role="alert"
          className="rounded-2xl border border-rw-danger/20 bg-rw-danger-light p-5"
        >
          <p className="font-semibold text-rw-danger">
            Notifications could not be loaded
          </p>
          <p className="mt-2 break-words text-sm leading-6 text-rw-danger">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-rw-danger transition hover:bg-rw-danger-light"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <NotificationSkeleton />
          <NotificationSkeleton />
          <NotificationSkeleton />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && notifications.length === 0 && (
        <section className="rounded-2xl border border-rw-border bg-white px-6 py-14 text-center shadow-sm sm:py-20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rw-surface-muted text-rw-muted">
            <Bell size={29} />
          </div>

          <h2 className="mt-5 text-2xl font-bold text-rw-navy">
            {activeFilter === "unread"
              ? "You're all caught up"
              : activeFilter === "read"
                ? "No read notifications yet"
                : "No notifications yet"}
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-rw-muted">
            {activeFilter === "unread"
              ? "There are no unread notifications matching this filter."
              : "When there are updates about your reports, you'll see them here."}
          </p>

          {activeFilter !== "all" && (
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all");
                setPage(1);
              }}
              className="mt-5 rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-rw-navy transition hover:bg-rw-surface-muted"
            >
              View all notifications
            </button>
          )}
        </section>
      )}

      {/* Notification list */}
      {!loading && !error && notifications.length > 0 && (
        <section className="space-y-4" aria-label="Notification history">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkRead={handleMarkRead}
              marking={marking}
            />
          ))}
        </section>
      )}

      {/* Pagination */}
      {!loading && !error && pagination.totalPages > 1 && (
        <nav
          aria-label="Notification pagination"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rw-border bg-white p-4"
        >
          <p className="text-sm text-rw-muted">
            Page {pagination.page} of {pagination.totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => {
                setPage((current) => Math.max(1, current - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-rw-navy transition hover:bg-rw-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => {
                setPage((current) => current + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-rw-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-navy-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ArrowRight size={16} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Notifications;

