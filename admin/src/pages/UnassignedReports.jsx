import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";

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

const priorityRank = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const priorityStyles = {
  critical: "border-red-200 bg-red-50 text-red-700",
  high: "border-orange-200 bg-orange-50 text-orange-800",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
  low: "border-slate-200 bg-slate-50 text-slate-600",
};

const statusStyles = {
  reported: "bg-slate-100 text-slate-700",
  reopened: "bg-red-50 text-red-700",
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

  // GeoJSON stores coordinates as [longitude, latitude].
  return {
    longitude: Number(coordinates[0]),
    latitude: Number(coordinates[1]),
  };
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  "Unable to load unassigned reports. Please try again.";

const UnassignedReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("priority");

  const loadReports = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      // The existing endpoint returns only unassigned reports whose
      // statuses are reported or reopened. It does not paginate.
      const response = await api.get("/admin/reports/unassigned");
      const data = response?.data;

      setReports(Array.isArray(data?.reports) ? data.reports : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = reports.filter((report) => {
      if (category && report.category !== category) return false;
      if (priority && report.priority !== priority) return false;
      if (status && report.status !== status) return false;

      if (!query) return true;

      const searchable = [
        report.title,
        report.description,
        report._id,
        report.category,
        report.status,
        report.priority,
        report.reportedBy?.name,
        report.reportedBy?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });

    return filtered.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityDifference =
          (priorityRank[a.priority] ?? 4) - (priorityRank[b.priority] ?? 4);

        if (priorityDifference !== 0) return priorityDifference;
      }

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [reports, search, category, priority, status, sortBy]);

  const filtersActive = Boolean(search.trim() || category || priority || status);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setPriority("");
    setStatus("");
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
            Operations management
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">
            Unassigned Reports
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review new and reopened road issues that do not currently have an officer assigned.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadReports(true)}
          disabled={loading || refreshing}
          className="w-fit rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh queue"}
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-rw-border border-t-4 border-t-rw-danger bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Unassigned reports</p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-rw-navy">
            {loading ? "—" : reports.length}
          </p>
          <p className="mt-2 text-xs text-slate-500">In the current backend queue</p>
        </div>

        <div className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">New reports</p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-rw-navy">
            {loading ? "—" : reports.filter((report) => report.status === "reported").length}
          </p>
          <p className="mt-2 text-xs text-slate-500">Awaiting initial assignment</p>
        </div>

        <div className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Reopened reports</p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-rw-navy">
            {loading ? "—" : reports.filter((report) => report.status === "reopened").length}
          </p>
          <p className="mt-2 text-xs text-slate-500">Returned for another review</p>
        </div>
      </section>

      <section className="rounded-2xl border border-rw-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-rw-navy">Queue filters</h3>
            <p className="mt-1 text-xs text-slate-500">
              Search and filter the reports currently returned by the backend queue.
            </p>
          </div>

          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 w-fit text-sm font-semibold text-orange-700 hover:text-orange-800 sm:mt-0"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <label className="block min-w-0 sm:col-span-2 xl:col-span-1">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title, ID, reporter..."
              className="w-full rounded-xl border border-rw-border bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-xl border border-rw-border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            >
              <option value="">All queue statuses</option>
              <option value="reported">Reported</option>
              <option value="reopened">Reopened</option>
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Category
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-xl border border-rw-border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Priority
            </span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="w-full rounded-xl border border-rw-border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            >
              <option value="">All priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sort by
            </span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-xl border border-rw-border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            >
              <option value="priority">Priority first</option>
              <option value="recent">Most recent first</option>
            </select>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {loading
            ? "Loading queue..."
            : `Showing ${filteredReports.length} of ${reports.length} unassigned reports`}
        </p>
        <p className="text-xs text-slate-400">
          Only reported and reopened items without an assigned officer are included.
        </p>
      </div>

      {error && (
        <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Could not load the unassigned queue</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => loadReports()}
            className="mt-3 font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </section>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse rounded-2xl border border-rw-border bg-white p-5">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="mt-4 h-6 w-2/3 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : !error && filteredReports.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-rw-border-dark bg-white px-6 py-14 text-center">
          <h3 className="text-lg font-bold text-rw-navy">
            {filtersActive ? "No matching reports" : "The queue is clear"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {filtersActive
              ? "Try a different search term or clear one or more filters."
              : "There are currently no new or reopened reports waiting for assignment."}
          </p>
          {filtersActive && (
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
          {filteredReports.map((report) => {
            const coordinates = getCoordinates(report);
            const reportImages = Array.isArray(report.evidenceImages)
              ? report.evidenceImages
              : [];
            const priorityClass =
              priorityStyles[report.priority] || priorityStyles.medium;
            const statusClass =
              statusStyles[report.status] || statusStyles.reported;
            const mapUrl = coordinates
              ? `https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=17/${coordinates.latitude}/${coordinates.longitude}`
              : null;

            return (
              <article
                key={report._id}
                className="overflow-hidden rounded-2xl border border-rw-border bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
                          {formatLabel(report.status)}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityClass}`}>
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
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Reported by</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {report.reportedBy?.name || "Unknown citizen"}
                          </p>
                          {report.reportedBy?.email && (
                            <p className="mt-1 break-all text-xs text-slate-500">{report.reportedBy.email}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Submitted</p>
                          <p className="mt-1 text-sm font-medium text-slate-700">{formatDate(report.createdAt)}</p>
                          <p className="mt-1 text-xs text-slate-500">{reportImages.length} {reportImages.length === 1 ? "photo" : "photos"} attached</p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Report reference</p>
                          <p className="mt-1 break-all font-mono text-xs text-slate-600">{report._id}</p>
                        </div>
                      </div>

                      {coordinates && (
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                          <span>
                            Location: {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
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

                      {reportImages.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {reportImages.slice(0, 4).map((image, index) => (
                            <a
                              key={image.publicId || image.url || index}
                              href={image.url}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Open report photo ${index + 1}`}
                              className="overflow-hidden rounded-lg border border-rw-border bg-slate-100"
                            >
                              <img
                                src={image.url}
                                alt={`Report evidence ${index + 1}`}
                                loading="lazy"
                                className="h-16 w-16 object-cover transition hover:scale-105"
                              />
                            </a>
                          ))}
                          {reportImages.length > 4 && (
                            <span className="flex h-16 items-center rounded-lg border border-rw-border px-3 text-xs font-medium text-slate-500">
                              +{reportImages.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-row gap-2 lg:w-40 lg:flex-col">
                      <Link
                        to={`/reports/${report._id}`}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-rw-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-primary-dark"
                      >
                        Review & assign
                      </Link>
                      <Link
                        to="/reports"
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        All reports
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default UnassignedReports;

