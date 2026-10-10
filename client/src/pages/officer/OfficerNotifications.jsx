
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

const PAGE_SIZE = 10;

const filters = [
  { value: "all", label: "All notifications" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  "Something went wrong. Please try again.";

const isNotificationRead = (notification) =>
  Boolean(notification?.isRead ?? notification?.read);

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

const getNotificationRoute = (notification) => {
  switch (notification?.type) {
    case "report_assigned":
    case "report_reopened":
      return "/officer/assignments";

    case "report_confirmed":
    case "report_resolved":
      return "/officer/resolved";

    default:
      return "/officer/assignments";
  }
};

const getNotificationType = (type) => {
  const types = {
    report_assigned: "New assignment",
    report_resolved: "Report resolved",
    report_confirmed: "Resolution confirmed",
    report_reopened: "Report reopened",
  };

  return types[type] || "Notification";
};

const OfficerNotifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: PAGE_SIZE,
      };

      if (activeFilter === "unread") {
        params.unread = "true";
      } else if (activeFilter === "read") {
        params.unread = "false";
      }

      const response = await api.get("/notifications", { params });
      const data = response?.data;

      const nextPagination = {
        page: Number(data?.pagination?.page) || page,
        limit: Number(data?.pagination?.limit) || PAGE_SIZE,
        total: Number(data?.pagination?.total) || 0,
        totalPages: Number(data?.pagination?.totalPages) || 0,
        hasNextPage: Boolean(data?.pagination?.hasNextPage),
        hasPreviousPage: Boolean(
          data?.pagination?.hasPreviousPage,
        ),
      };

      // If an action removed the last item on this page,
      // move back to the last page that still exists.
      if (
        page > 1 &&
        page > Math.max(nextPagination.totalPages, 1)
      ) {
        setPage(Math.max(nextPagination.totalPages, 1));
        return;
      }

      setNotifications(
        Array.isArray(data?.notifications) ? data.notifications : [],
      );
      setPagination(nextPagination);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }

    try {
      const countResponse = await api.get(
        "/notifications/unread-count",
      );

      setUnreadCount(
        Number(countResponse?.data?.unreadCount) || 0,
      );
    } catch {
      // Keep the inbox usable even if the count request fails.
    }
  }, [activeFilter, page, refreshVersion]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleFilterChange = (value) => {
    setActiveFilter(value);
    setPage(1);
    setActionError("");
    setSuccessMessage("");
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
    setActionError("");
    setSuccessMessage("");

    try {
      await api.patch(
        `/notifications/${notification._id}/read`,
      );

      setNotifications((current) =>
        activeFilter === "unread"
          ? current.filter(
              (item) => item._id !== notification._id,
            )
          : current.map((item) =>
              item._id === notification._id
                ? { ...item, isRead: true, read: true }
                : item,
            ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));
      setSuccessMessage("Notification marked as read.");
      setRefreshVersion((current) => current + 1);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setProcessingId("");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll || processingId) return;

    setMarkingAll(true);
    setActionError("");
    setSuccessMessage("");

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
      setSuccessMessage("All notifications marked as read.");
      setRefreshVersion((current) => current + 1);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setMarkingAll(false);
    }
  };

  const openNotification = (notification) => {
    navigate(getNotificationRoute(notification));
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Officer workspace
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">
            Notifications
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Updates about assignments, reopened reports, and resolution confirmations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleMarkAllAsRead}
          disabled={
            unreadCount === 0 ||
            markingAll ||
            processingId !== ""
          }
          className="w-fit rounded-xl bg-rw-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-navy-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {markingAll ? "Marking as read..." : "Mark all as read"}
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Unread notifications
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-rw-navy">
            {unreadCount}
          </p>
        </div>

        <div className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Notifications in this view
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-rw-navy">
            {loading ? "—" : pagination.total}
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-rw-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const selected = activeFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => handleFilterChange(filter.value)}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                  selected
                    ? "border-rw-navy bg-rw-navy text-white"
                    : "border-rw-border bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {successMessage && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"
          >
            {successMessage}
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p className="font-semibold">
              Could not load notifications
            </p>
            <p className="mt-1">{error}</p>

            <button
              type="button"
              onClick={() => setRefreshVersion((value) => value + 1)}
              className="mt-3 font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-xl border border-rw-border p-5"
              >
                <div className="h-4 w-36 rounded bg-slate-200" />
                <div className="mt-3 h-5 w-2/3 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-full rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : !error && notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-rw-border-dark px-5 py-14 text-center">
            <h2 className="text-lg font-semibold text-rw-navy">
              {activeFilter === "unread"
                ? "You’re all caught up"
                : activeFilter === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {activeFilter === "unread"
                ? "New assignment and report updates will appear here."
                : activeFilter === "read"
                  ? "Notifications you have read will appear here."
                  : "You’ll see updates here when a report is assigned, reopened, or confirmed."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-rw-border">
            {notifications.map((notification) => {
              const read = isNotificationRead(notification);
              const report = notification.report;
              const relatedRoute = getNotificationRoute(notification);

              return (
                <article
                  key={notification._id}
                  className={`-mx-1 rounded-xl px-4 py-5 transition ${
                    read
                      ? "bg-white"
                      : "bg-orange-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!read && (
                      <span
                        aria-label="Unread"
                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-500"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {getNotificationType(notification.type)}
                          </p>

                          <h2
                            className={`mt-1 text-base text-rw-navy ${
                              read ? "font-semibold" : "font-bold"
                            }`}
                          >
                            {notification.title || "RoadWatch update"}
                          </h2>
                        </div>

                        <time
                          dateTime={notification.createdAt}
                          className="shrink-0 text-xs text-slate-500"
                        >
                          {formatDate(notification.createdAt)}
                        </time>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {notification.message || "There is an update to review."}
                      </p>

                      {report && typeof report === "object" && (
                        <div className="mt-3 rounded-lg border border-rw-border bg-white px-3.5 py-3">
                          <p className="text-xs font-medium text-slate-500">
                            Related report
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {report.title || "Road issue report"}
                          </p>
                          {report.category && (
                            <p className="mt-1 text-xs capitalize text-slate-500">
                              {String(report.category).replaceAll("_", " ")}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                        <button
                          type="button"
                          onClick={() => openNotification(notification)}
                          className="text-sm font-semibold text-orange-700 hover:text-orange-800"
                        >
                          {relatedRoute === "/officer/resolved"
                            ? "View resolved reports"
                            : "View assignments"}
                        </button>

                        {!read && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notification)}
                            disabled={processingId !== "" || markingAll}
                            className="text-sm font-medium text-slate-500 transition hover:text-rw-navy disabled:opacity-50"
                          >
                            {processingId === notification._id
                              ? "Saving..."
                              : "Mark as read"}
                          </button>
                        )}

                        {read && (
                          <span className="text-xs text-slate-400">
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-rw-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {pagination.totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-rw-border px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-rw-border px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default OfficerNotifications;

