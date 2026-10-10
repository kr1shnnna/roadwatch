
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAdminAuth } from "../context/AdminAuthContext";

const formatStatus = (status) =>
  String(status || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatCategory = (category) =>
  String(category || "Other")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

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

const getStatusClasses = (status) => {
  const styles = {
    reported: "bg-slate-100 text-slate-700",
    assigned: "bg-blue-50 text-blue-700",
    accepted: "bg-sky-50 text-sky-700",
    in_progress: "bg-orange-50 text-orange-700",
    resolved: "bg-amber-50 text-amber-800",
    confirmed: "bg-green-50 text-green-700",
    reopened: "bg-red-50 text-red-700",
    rejected: "bg-slate-200 text-slate-700",
  };

  return styles[status] || "bg-slate-100 text-slate-700";
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const Dashboard = () => {
  const { user } = useAdminAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/admin/dashboard");

      if (!response.data?.summary) {
        throw new Error("The dashboard response was incomplete.");
      }

      setDashboard(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load the dashboard.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summary = dashboard?.summary;

  const primaryStats = [
    {
      label: "Total reports",
      key: "totalReports",
      description: "All reports in the system",
      accent: "border-t-rw-navy",
      href: "/reports",
    },
    {
      label: "Unassigned reports",
      key: "unassignedReports",
      description: "Reports without an assigned officer",
      accent: "border-t-rw-danger",
      href: "/reports/unassigned",
    },
    {
      label: "In progress",
      key: "inProgressReports",
      description: "Reports currently being worked on",
      accent: "border-t-rw-primary",
      href: "/reports",
    },
    {
      label: "Resolved",
      key: "resolvedReports",
      description: "Waiting for citizen confirmation",
      accent: "border-t-rw-success",
      href: "/reports",
    },
  ];

  const statusStats = [
    { label: "Reported", key: "reportedReports", status: "reported" },
    { label: "Assigned", key: "assignedReports", status: "assigned" },
    { label: "Confirmed", key: "confirmedReports", status: "confirmed" },
    { label: "Reopened", key: "reopenedReports", status: "reopened" },
    { label: "Rejected", key: "rejectedReports", status: "rejected" },
  ];

  const recentActivity = dashboard?.recentActivity || [];
  const totalReports = summary?.totalReports || 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7 pb-10">
      {/* Welcome and refresh */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
            RoadWatch administration
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">
            {getGreeting()}, {(user?.name || "Administrator").trim().split(/\s+/)[0]}.
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor road issue reports, assignment workloads, and resolution progress across service areas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing || loading}
          className="w-fit rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh dashboard"}
        </button>
      </header>

      {error && (
        <section
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">Dashboard data could not be loaded</p>
          <p className="mt-1">{error}</p>

          <button
            type="button"
            onClick={() => loadDashboard()}
            className="mt-3 font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </section>
      )}

      {/* Main statistics */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-rw-navy">
            Operational overview
          </h3>

          <Link
            to="/reports"
            className="text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            View all reports
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {primaryStats.map((stat) => (
            <Link
              key={stat.key}
              to={stat.href}
              className={`rounded-2xl border border-rw-border border-t-4 ${stat.accent} bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
            >
              <p className="text-sm font-medium text-slate-500">
                {stat.label}
              </p>

              <p className="mt-3 text-3xl font-bold tabular-nums text-rw-navy">
                {loading ? "—" : summary?.[stat.key] ?? 0}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {stat.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Status breakdown */}
      <section className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h3 className="text-base font-bold text-rw-navy">
            Report status breakdown
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Current distribution of reports by their recorded status.
          </p>
        </div>

        {loading ? (
          <div className="space-y-5">
            {statusStats.map((item) => (
              <div key={item.key} className="animate-pulse">
                <div className="mb-2 h-3 w-32 rounded bg-slate-200" />
                <div className="h-2 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            {statusStats.map((item) => {
              const count = summary?.[item.key] || 0;
              const percentage =
                totalReports > 0
                  ? Math.round((count / totalReports) * 100)
                  : 0;

              return (
                <div key={item.key}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-700">
                      {item.label}
                    </span>

                    <span className="text-sm font-semibold tabular-nums text-rw-navy">
                      {count}
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        ({percentage}%)
                      </span>
                    </span>
                  </div>

                  <div
                    className="h-2 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label={`${item.label} percentage of total reports`}
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.status === "reopened"
                          ? "bg-red-500"
                          : item.status === "confirmed"
                            ? "bg-green-600"
                            : item.status === "in_progress"
                              ? "bg-orange-500"
                              : item.status === "rejected"
                                ? "bg-slate-500"
                                : "bg-blue-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-5 border-t border-rw-border pt-4 text-xs leading-5 text-slate-500">
          Reported, assigned, in-progress, resolved, confirmed, reopened, and rejected are separate backend statuses. Unassigned reports are tracked separately and may overlap with these statuses.
        </p>
      </section>

      {/* Recent activity and attention items */}
      <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <section className="overflow-hidden rounded-2xl border border-rw-border bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-rw-border px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-base font-bold text-rw-navy">
                Recent activity
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Latest report and assignment updates.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-5 sm:p-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse border-b border-rw-border pb-4 last:border-0"
                >
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-rw-navy">
                No recent activity
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Report and assignment updates will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-rw-border">
              {recentActivity.slice(0, 10).map((activity, index) => {
                const report =
                  activity.type === "report"
                    ? activity
                    : activity.report;

                const reportId =
                  activity.type === "report"
                    ? activity.id
                    : report?._id;

                const title =
                  report?.title || "Road issue report";

                const category = report?.category;
                const status =
                  activity.type === "assignment"
                    ? activity.status
                    : report?.status || activity.status;

                const activityDate =
                  activity.updatedAt ||
                  activity.createdAt ||
                  activity.assignedAt;

                return (
                  <button
                    key={`${activity.type}-${activity.id || index}`}
                    type="button"
                    onClick={() => {
                      if (reportId) {
                        navigate(`/reports/${reportId}`);
                      } else {
                        navigate("/reports");
                      }
                    }}
                    className="block w-full px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-rw-navy">
                          {title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {activity.type === "assignment"
                            ? "Assignment update"
                            : "Report update"}
                          {category
                            ? ` · ${formatCategory(category)}`
                            : ""}
                        </p>
                      </div>

                      <span
                        className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(status)}`}
                      >
                        {formatStatus(status)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(activityDate)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-base font-bold text-rw-navy">
              Needs attention
            </h3>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Items that may need administrative review.
            </p>

            <div className="mt-5 divide-y divide-rw-border">
              <Link
                to="/reports/unassigned"
                className="flex items-center justify-between gap-3 py-4 first:pt-0"
              >
                <div>
                  <p className="text-sm font-semibold text-rw-navy">
                    Unassigned reports
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    No officer currently assigned
                  </p>
                </div>

                <span className="text-xl font-bold tabular-nums text-red-700">
                  {loading ? "—" : summary?.unassignedReports ?? 0}
                </span>
              </Link>

              <div className="flex items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-sm font-semibold text-rw-navy">
                    Unread notifications
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Updates for this administrator
                  </p>
                </div>

                <span className="text-xl font-bold tabular-nums text-rw-primary">
                  {loading ? "—" : summary?.unreadNotifications ?? 0}
                </span>
              </div>

              <Link
                to="/reports"
                className="flex items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-rw-navy">
                    Reopened reports
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Issues returned for further action
                  </p>
                </div>

                <span className="text-xl font-bold tabular-nums text-red-700">
                  {loading ? "—" : summary?.reopenedReports ?? 0}
                </span>
              </Link>
            </div>
          </section>

          <section className="rounded-2xl bg-rw-navy p-5 text-white sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">
              Management
            </p>

            <h3 className="mt-2 text-lg font-bold">
              Explore operations
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Review officers, departments, service-area responsibilities, and operational performance.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Link
                to="/officers"
                className="rounded-xl border border-white/15 px-3 py-2.5 text-center text-sm font-semibold transition hover:bg-white/10"
              >
                Officers
              </Link>

              <Link
                to="/analytics"
                className="rounded-xl border border-white/15 px-3 py-2.5 text-center text-sm font-semibold transition hover:bg-white/10"
              >
                Analytics
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
