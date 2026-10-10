
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";

const PAGE_SIZE = 20;

const categories = [
  { value: "pothole", label: "Pothole" },
  { value: "broken_road", label: "Broken road" },
  { value: "streetlight", label: "Streetlight" },
  { value: "traffic_signal", label: "Traffic signal" },
  { value: "waterlogging", label: "Waterlogging" },
  { value: "open_manhole", label: "Open manhole" },
  { value: "road_sign", label: "Road sign" },
  { value: "road_debris", label: "Road debris" },
  { value: "drainage", label: "Drainage" },
  { value: "other", label: "Other" },
];

const statuses = [
  { value: "reported", label: "Reported" },
  { value: "verified", label: "Verified" },
  { value: "assigned", label: "Assigned" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "confirmed", label: "Confirmed" },
  { value: "reopened", label: "Reopened" },
  { value: "rejected", label: "Rejected" },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const statusStyles = {
  reported: "bg-slate-100 text-slate-700",
  verified: "bg-cyan-50 text-cyan-800",
  assigned: "bg-blue-50 text-blue-700",
  accepted: "bg-sky-50 text-sky-700",
  in_progress: "bg-orange-50 text-orange-800",
  resolved: "bg-amber-50 text-amber-800",
  confirmed: "bg-green-50 text-green-800",
  reopened: "bg-red-50 text-red-700",
  rejected: "bg-slate-200 text-slate-700",
};

const priorityStyles = {
  low: "border-slate-200 text-slate-600",
  medium: "border-blue-200 text-blue-700",
  high: "border-orange-200 text-orange-700",
  critical: "border-red-200 text-red-700",
};

const formatLabel = (value) =>
  String(value || "Unknown")
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

const getCoordinates = (report) => {
  const coordinates = report?.location?.coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    !Number.isFinite(Number(coordinates[0])) ||
    !Number.isFinite(Number(coordinates[1]))
  ) {
    return null;
  }

  return {
    longitude: Number(coordinates[0]),
    latitude: Number(coordinates[1]),
  };
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  "Unable to load reports. Please try again.";

const FilterSelect = ({
  label,
  value,
  onChange,
  options,
}) => (
  <label className="block min-w-0">
    <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </span>

    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-rw-border bg-white px-3 py-2.5 text-sm text-rw-text outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
    >
      <option value="">All {label.toLowerCase()}</option>

      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [assigned, setAssigned] = useState("");

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadReports = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = {
        page,
        limit: PAGE_SIZE,
      };

      if (status) params.status = status;
      if (category) params.category = category;
      if (priority) params.priority = priority;
      if (assigned) params.assigned = assigned;

      try {
        const response = await api.get("/admin/reports", {
          params,
        });

        const data = response?.data;

        const nextPagination = data?.pagination || {};

        setReports(
          Array.isArray(data?.reports) ? data.reports : [],
        );

        setPagination({
          page: Number(nextPagination.page) || page,
          limit: Number(nextPagination.limit) || PAGE_SIZE,
          total: Number(nextPagination.total) || 0,
          totalPages: Number(nextPagination.totalPages) || 0,
          hasNextPage: Boolean(nextPagination.hasNextPage),
          hasPreviousPage: Boolean(
            nextPagination.hasPreviousPage,
          ),
        });
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, status, category, priority, assigned, refreshKey],
  );

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setStatus("");
    setCategory("");
    setPriority("");
    setAssigned("");
    setPage(1);
  };

  const filtersApplied = Boolean(
    status || category || priority || assigned,
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      {/* Page header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
            Operations management
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">
            Report Management
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review reported road issues, monitor their status, and open individual reports to manage assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading || refreshing}
          className="w-fit rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh reports"}
        </button>
      </header>

      {/* Filter panel */}
      <section className="rounded-2xl border border-rw-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-rw-navy">
              Filter reports
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Filters are applied by the backend.
            </p>
          </div>

          {filtersApplied && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 w-fit text-sm font-semibold text-orange-700 hover:text-orange-800 sm:mt-0"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            label="Status"
            value={status}
            onChange={(value) => updateFilter(setStatus, value)}
            options={statuses}
          />

          <FilterSelect
            label="Category"
            value={category}
            onChange={(value) => updateFilter(setCategory, value)}
            options={categories}
          />

          <FilterSelect
            label="Priority"
            value={priority}
            onChange={(value) => updateFilter(setPriority, value)}
            options={priorities}
          />

          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assignment
            </span>

            <select
              value={assigned}
              onChange={(event) =>
                updateFilter(setAssigned, event.target.value)
              }
              className="w-full rounded-xl border border-rw-border bg-white px-3 py-2.5 text-sm text-rw-text outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            >
              <option value="">All reports</option>
              <option value="true">Assigned</option>
              <option value="false">Unassigned</option>
            </select>
          </label>
        </div>
      </section>

      {/* Result summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {loading
            ? "Loading reports..."
            : `Showing ${reports.length} of ${pagination.total} reports`}
        </p>

        <p className="text-xs text-slate-400">
          Sorted by most recently updated
        </p>
      </div>

      {/* Request error */}
      {error && (
        <section
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">Could not load reports</p>
          <p className="mt-1">{error}</p>

          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            className="mt-3 font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </section>
      )}

      {/* Report list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-rw-border bg-white p-5"
            >
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="mt-4 h-6 w-2/3 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full rounded bg-slate-100" />
              <div className="mt-5 h-10 w-32 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : !error && reports.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-rw-border-dark bg-white px-6 py-14 text-center">
          <h3 className="text-lg font-bold text-rw-navy">
            {filtersApplied
              ? "No reports match these filters"
              : "No reports found"}
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {filtersApplied
              ? "Try changing one or more filters to see other reports."
              : "Reports will appear here once citizens submit road issues."}
          </p>

          {filtersApplied && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              Clear filters
            </button>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          {reports.map((report) => {
            const coordinates = getCoordinates(report);
            const statusClass =
              statusStyles[report.status] ||
              "bg-slate-100 text-slate-700";

            const priorityClass =
              priorityStyles[report.priority] ||
              priorityStyles.medium;

            const evidenceCount = Array.isArray(report.evidenceImages)
              ? report.evidenceImages.length
              : 0;

            const mapUrl = coordinates
              ? `https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=17/${coordinates.latitude}/${coordinates.longitude}`
              : null;

            return (
              <article
                key={report._id}
                className="overflow-hidden rounded-2xl border border-rw-border bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                        >
                          {formatLabel(report.status)}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityClass}`}
                        >
                          {formatLabel(report.priority)} priority
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {formatLabel(report.category)}
                        </span>
                      </div>

                      <Link
                        to={`/reports/${report._id}`}
                        className="mt-3 inline-block break-words text-base font-bold text-rw-navy transition hover:text-orange-700 sm:text-lg"
                      >
                        {report.title || "Untitled report"}
                      </Link>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {report.description || "No description provided."}
                      </p>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Reported by
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {report.reportedBy?.name || "Unknown citizen"}
                          </p>
                          {report.reportedBy?.email && (
                            <p className="mt-1 break-all text-xs text-slate-500">
                              {report.reportedBy.email}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Assigned officer
                          </p>
                          {report.assignedTo ? (
                            <>
                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {report.assignedTo.name || "Officer"}
                              </p>
                              {report.assignedTo.email && (
                                <p className="mt-1 break-all text-xs text-slate-500">
                                  {report.assignedTo.email}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="mt-1 text-sm font-medium text-red-700">
                              Unassigned
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Last updated
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatDate(report.updatedAt || report.createdAt)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {evidenceCount} original{" "}
                            {evidenceCount === 1 ? "photo" : "photos"}
                          </p>
                        </div>
                      </div>

                      {coordinates && (
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                          <span>
                            Location: {coordinates.latitude.toFixed(5)},{" "}
                            {coordinates.longitude.toFixed(5)}
                          </span>

                          {mapUrl && (
                            <a
                              href={mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-orange-700 hover:text-orange-800"
                            >
                              Open map
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-row gap-2 xl:w-36 xl:flex-col">
                      <Link
                        to={`/reports/${report._id}`}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-rw-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-navy-light"
                      >
                        View details
                      </Link>

                      {!report.assignedTo &&
                        ["reported", "reopened"].includes(report.status) && (
                          <Link
                            to={`/reports/${report._id}`}
                            className="inline-flex flex-1 items-center justify-center rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Assign
                          </Link>
                        )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Pagination */}
      {!loading && !error && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-rw-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => current - 1)}
              disabled={!pagination.hasPreviousPage}
              className="rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!pagination.hasNextPage}
              className="rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

