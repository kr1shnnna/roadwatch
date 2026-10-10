
import { useCallback, useEffect, useMemo, useState } from "react";

import api from "../../services/api";

const categoryLabels = {
  pothole: "Pothole",
  broken_road: "Broken road",
  streetlight: "Streetlight",
  traffic_signal: "Traffic signal",
  waterlogging: "Waterlogging",
  open_manhole: "Open manhole",
  road_sign: "Road sign",
  road_debris: "Road debris",
  drainage: "Drainage",
  other: "Other issue",
};

const statusDetails = {
  resolved: {
    label: "Awaiting citizen confirmation",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  confirmed: {
    label: "Confirmed by citizen",
    className: "border-green-200 bg-green-50 text-green-800",
  },
  reopened: {
    label: "Reopened by citizen",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

const filters = [
  { value: "all", label: "All completed work" },
  { value: "resolved", label: "Awaiting confirmation" },
  { value: "confirmed", label: "Citizen confirmed" },
  { value: "reopened", label: "Reopened" },
];

const formatDate = (value) => {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  "Something went wrong. Please try again.";

const getCategoryLabel = (category) =>
  categoryLabels[category] ||
  String(category || "Other issue").replaceAll("_", " ");

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

  // GeoJSON coordinates are [longitude, latitude].
  return {
    longitude: Number(coordinates[0]),
    latitude: Number(coordinates[1]),
  };
};

const getStatusDetails = (status) =>
  statusDetails[status] || {
    label: String(status || "Resolution recorded").replaceAll("_", " "),
    className: "border-slate-200 bg-slate-50 text-slate-700",
  };

const EvidenceGallery = ({ title, images = [] }) => {
  const validImages = images.filter((image) =>
    typeof image === "string" ? image : Boolean(image?.url),
  );

  if (validImages.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {validImages.map((image, index) => {
          const url = typeof image === "string" ? image : image.url;
          const key =
            typeof image === "string"
              ? image
              : image.publicId || image.url || index;

          return (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-xl border border-rw-border bg-slate-50"
              aria-label={`Open ${title.toLowerCase()} photo ${index + 1}`}
            >
              <img
                src={url}
                alt={`${title} ${index + 1}`}
                loading="lazy"
                className="aspect-square w-full object-cover transition duration-200 group-hover:scale-105"
              />
            </a>
          );
        })}
      </div>
    </div>
  );
};

const ResolvedReports = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const loadAssignments = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/assignments/my");
      const data = response?.data;

      setAssignments(
        Array.isArray(data?.assignments) ? data.assignments : [],
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // "completed" is the assignment status set by the resolve endpoint.
  const completedAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) => assignment.status === "completed",
      ),
    [assignments],
  );

  const counts = useMemo(
    () => ({
      all: completedAssignments.length,
      resolved: completedAssignments.filter(
        (assignment) => assignment.report?.status === "resolved",
      ).length,
      confirmed: completedAssignments.filter(
        (assignment) => assignment.report?.status === "confirmed",
      ).length,
      reopened: completedAssignments.filter(
        (assignment) => assignment.report?.status === "reopened",
      ).length,
    }),
    [completedAssignments],
  );

  const visibleAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return completedAssignments
      .filter((assignment) => {
        if (activeFilter === "all") return true;

        return assignment.report?.status === activeFilter;
      })
      .filter((assignment) => {
        if (!query) return true;

        const report = assignment.report || {};

        const searchableText = [
          report.title,
          report.description,
          report.category,
          report.priority,
          report.status,
          report._id,
          report.resolution?.note,
          assignment.serviceArea?.name,
          assignment.serviceArea?.city,
          assignment.department?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      })
      .sort((a, b) => {
        const dateA = new Date(
          a.completedAt ||
            a.report?.resolution?.resolvedAt ||
            a.updatedAt ||
            0,
        ).getTime();

        const dateB = new Date(
          b.completedAt ||
            b.report?.resolution?.resolvedAt ||
            b.updatedAt ||
            0,
        ).getTime();

        return dateB - dateA;
      });
  }, [completedAssignments, activeFilter, search]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
      {/* Heading */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Officer workspace
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">
            Resolved Reports
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review completed work, resolution notes, and repair evidence.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAssignments(true)}
          disabled={refreshing || loading}
          className="w-fit rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-rw-text transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Completed assignments",
            value: counts.all,
            description: "All work you have completed",
            valueClass: "text-rw-navy",
          },
          {
            label: "Awaiting confirmation",
            value: counts.resolved,
            description: "Waiting for the citizen to verify",
            valueClass: "text-amber-700",
          },
          {
            label: "Citizen confirmed",
            value: counts.confirmed,
            description: "Fix confirmed by the reporter",
            valueClass: "text-green-700",
          },
          {
            label: "Reopened",
            value: counts.reopened,
            description: "Citizen reported the issue again",
            valueClass: "text-red-700",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {stat.label}
            </p>

            <p
              className={`mt-3 text-3xl font-bold tabular-nums ${stat.valueClass}`}
            >
              {loading ? "—" : stat.value}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {stat.description}
            </p>
          </div>
        ))}
      </section>

      {/* Search and filters */}
      <section className="space-y-4 rounded-2xl border border-rw-border bg-white p-4 shadow-sm sm:p-5">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search reports, departments, areas or resolution notes..."
          className="w-full rounded-xl border border-rw-border bg-slate-50 px-4 py-3 text-sm text-rw-text outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
        />

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const selected = activeFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  selected
                    ? "border-rw-navy bg-rw-navy text-white"
                    : "border-rw-border bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {filter.label}
                <span className="ml-2 tabular-nums opacity-75">
                  {loading ? "—" : counts[filter.value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-sm text-slate-500">
          {loading
            ? "Loading completed assignments..."
            : `Showing ${visibleAssignments.length} of ${completedAssignments.length} completed assignments`}
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">
            Could not load resolved reports
          </p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => loadAssignments()}
            className="mt-3 font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-rw-border bg-white p-5"
            >
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="mt-4 h-6 w-2/3 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100" />
              <div className="mt-6 h-24 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : !error && visibleAssignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rw-border-dark bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-bold text-rw-navy">
            {search || activeFilter !== "all"
              ? "No matching resolved reports"
              : "No completed assignments yet"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {search || activeFilter !== "all"
              ? "Try a different search term or change the selected filter."
              : "Reports will appear here after you submit a resolution for your work."}
          </p>

          {(search || activeFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveFilter("all");
              }}
              className="mt-4 text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              Clear search and filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleAssignments.map((assignment) => {
            const report = assignment.report || {};
            const coordinates = getCoordinates(report);
            const status = getStatusDetails(report.status);

            const resolvedAt =
              report.resolution?.resolvedAt ||
              assignment.completedAt ||
              assignment.updatedAt;

            const resolutionNote =
              report.resolution?.note ||
              assignment.resolutionNote ||
              "No resolution note was recorded.";

            const resolutionImages = report.resolution?.images || [];
            const originalImages = report.images || [];

            const mapUrl = coordinates
              ? `https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=17/${coordinates.latitude}/${coordinates.longitude}`
              : null;

            const priority = String(
              report.priority || "normal",
            ).toLowerCase();

            return (
              <article
                key={assignment._id}
                className="overflow-hidden rounded-2xl border border-rw-border bg-white shadow-sm"
              >
                <div className="border-b border-rw-border p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                          {getCategoryLabel(report.category)}
                        </span>

                        <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                          {priority} priority
                        </span>
                      </div>

                      <h2 className="mt-4 break-words text-lg font-bold text-rw-navy sm:text-xl">
                        {report.title || "Untitled road issue"}
                      </h2>

                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {report.description || "No description provided."}
                      </p>
                    </div>

                    {mapUrl && (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-fit shrink-0 rounded-xl border border-rw-border px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View location
                      </a>
                    )}
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-rw-border pt-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Department
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-800">
                        {assignment.department?.name ||
                          "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Service area
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-800">
                        {assignment.serviceArea?.name ||
                          "Not specified"}
                      </p>
                      {assignment.serviceArea?.city && (
                        <p className="mt-1 text-xs text-slate-500">
                          {assignment.serviceArea.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Resolved on
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-800">
                        {formatDate(resolvedAt)}
                      </p>
                    </div>
                  </div>

                  {coordinates && (
                    <p className="mt-4 text-xs text-slate-500">
                      Coordinates: {coordinates.latitude.toFixed(5)},{" "}
                      {coordinates.longitude.toFixed(5)}
                    </p>
                  )}
                </div>

                <div className="space-y-6 bg-slate-50/70 p-5 sm:p-6">
                  <section>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Resolution note
                    </h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {resolutionNote}
                    </p>
                  </section>

                  <EvidenceGallery
                    title="Repair evidence"
                    images={resolutionImages}
                  />

                  <EvidenceGallery
                    title="Original report photos"
                    images={originalImages}
                  />

                  <div className="border-t border-rw-border pt-4 text-xs text-slate-500">
                    {report.status === "reopened"
                      ? "The citizen reopened this report after the recorded resolution. Check Assigned Reports for any new assignment."
                      : report.status === "confirmed"
                        ? "The citizen confirmed that the reported issue was fixed."
                        : report.status === "resolved"
                          ? "Resolution submitted. The citizen has not confirmed the fix yet."
                          : "A resolution has been recorded for this assignment."}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResolvedReports;

