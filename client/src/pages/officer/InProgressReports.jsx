
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  Wrench,
  X,
} from "lucide-react";

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

const InProgressReports = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionImages, setResolutionImages] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

      const allAssignments = Array.isArray(data?.assignments)
        ? data.assignments
        : [];

      setAssignments(allAssignments);
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

  const inProgressAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments
      .filter((assignment) => assignment.status === "in_progress")
      .filter((assignment) => {
        if (!query) return true;

        const report = assignment.report || {};

        const searchableText = [
          report.title,
          report.description,
          report.category,
          report.priority,
          report._id,
          assignment.serviceArea?.name,
          assignment.serviceArea?.city,
          assignment.department?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
  }, [assignments, search]);

  const totalInProgress = assignments.filter(
    (assignment) => assignment.status === "in_progress",
  ).length;

  const closeResolveDialog = () => {
    if (actionLoading) return;

    setResolveTarget(null);
    setResolutionNote("");
    setResolutionImages([]);
    setActionError("");
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    setActionError("");

    const availableSlots = 5 - resolutionImages.length;

    if (availableSlots <= 0) {
      setActionError("You can upload a maximum of five repair photos.");
      return;
    }

    const validFiles = [];

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        setActionError("Only image files can be uploaded.");
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        setActionError(`${file.name} exceeds the 10 MB file limit.`);
        continue;
      }

      validFiles.push(file);
    }

    setResolutionImages((current) => [
      ...current,
      ...validFiles.slice(0, availableSlots),
    ]);

    if (selectedFiles.length > availableSlots) {
      setActionError("Only five repair photos can be uploaded.");
    }
  };

  const handleResolve = async (event) => {
    event.preventDefault();

    if (!resolveTarget) return;

    if (!resolutionNote.trim()) {
      setActionError("Please enter a resolution note.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const payload = new FormData();
      payload.append("resolutionNote", resolutionNote.trim());

      resolutionImages.forEach((file) => {
        payload.append("images", file);
      });

      const response = await api.patch(
        `/assignments/${resolveTarget._id}/resolve`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setResolveTarget(null);
      setResolutionNote("");
      setResolutionImages([]);
      setSuccessMessage(
        response?.data?.message || "Assignment marked as resolved.",
      );

      await loadAssignments(true);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
      {/* Page heading */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-800">
            
            FIELD OPERATIONS
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">
            In Progress
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage the issues you are currently working on and record
            completed repairs with supporting evidence.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAssignments(true)}
          disabled={refreshing || loading}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-rw-text transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </header>

      {/* Current work summary */}
      <section className="flex flex-col gap-4 rounded-2xl border border-rw-border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Wrench size={22} />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Active work orders
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-rw-navy">
              {loading ? "—" : totalInProgress}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Assignments you have started and not yet resolved
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <Clock3 size={17} className="shrink-0 text-orange-600" />
          <span>Submit a resolution note when work is complete.</span>
        </div>
      </section>

      {/* Search */}
      <section className="flex flex-col gap-3 rounded-2xl border border-rw-border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by issue, category, department or area..."
            className="w-full rounded-xl border border-rw-border bg-slate-50 py-3 pl-10 pr-4 text-sm text-rw-text outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />
        </div>

        <p className="whitespace-nowrap text-sm text-slate-500">
          {loading
            ? "Loading work orders..."
            : `${inProgressAssignments.length} showing`}
        </p>
      </section>

      {/* Feedback */}
      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{successMessage}</p>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="ml-auto rounded-md p-1 hover:bg-green-100"
            aria-label="Dismiss success message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Could not load your work orders</p>
            <p className="mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => loadAssignments()}
            className="shrink-0 font-semibold underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Assignment list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-rw-border bg-white p-5"
            >
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="mt-4 h-6 w-2/3 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100" />
              <div className="mt-6 h-10 w-36 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : !error && inProgressAssignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rw-border-dark bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            {search ? <Search size={24} /> : <ClipboardList size={25} />}
          </div>

          <h2 className="mt-5 text-lg font-bold text-rw-navy">
            {search
              ? "No matching work orders"
              : "No work in progress"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {search
              ? "Try another search term to find an active assignment."
              : "Assignments appear here after you accept them and start the work."}
          </p>

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-4 text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {inProgressAssignments.map((assignment) => {
            const report = assignment.report || {};
            const coordinates = getCoordinates(report);
            const priority = String(report.priority || "normal").toLowerCase();
            const category =
              categoryLabels[report.category] ||
              String(report.category || "Other issue").replaceAll("_", " ");

            const priorityClasses =
              priority === "high" || priority === "urgent"
                ? "border-red-200 bg-red-50 text-red-700"
                : priority === "medium"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-slate-50 text-slate-600";

            const mapUrl = coordinates
              ? `https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=17/${coordinates.latitude}/${coordinates.longitude}`
              : null;

            return (
              <article
                key={assignment._id}
                className="overflow-hidden rounded-2xl border border-rw-border bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="h-1 bg-orange-500" />

                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800">
                       
                          In progress
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${priorityClasses}`}
                        >
                          {priority} priority
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                          {category}
                        </span>
                      </div>

                      <h2 className="mt-4 break-words text-lg font-bold text-rw-navy sm:text-xl">
                        {report.title || "Untitled road issue"}
                      </h2>

                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {report.description || "No description provided."}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="flex items-start gap-2.5 text-sm">
                          <MapPin
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />
                          <div>
                            <p className="font-semibold text-slate-700">
                              {assignment.serviceArea?.name ||
                                "Service area not specified"}
                            </p>
                            {assignment.serviceArea?.city && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {assignment.serviceArea.city}
                              </p>
                            )}
                            {coordinates && (
                              <p className="mt-1 text-xs text-slate-500">
                                {coordinates.latitude.toFixed(5)},{" "}
                                {coordinates.longitude.toFixed(5)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 text-sm">
                          <ClipboardList
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />
                          <div>
                            <p className="font-semibold text-slate-700">
                              {assignment.department?.name ||
                                "Department not specified"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Reported{" "}
                              {formatDate(report.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 text-sm">
                          <CalendarDays
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />
                          <div>
                            <p className="font-semibold text-slate-700">
                              Work started
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {formatDate(
                                assignment.startedAt ||
                                  assignment.updatedAt,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {Array.isArray(report.images) &&
                        report.images.length > 0 && (
                          <div className="mt-5">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Original report photos
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {report.images.slice(0, 4).map((image, index) => (
                                <a
                                  key={image.publicId || image.url || index}
                                  href={image.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group relative h-16 w-16 overflow-hidden rounded-lg border border-rw-border bg-slate-100"
                                >
                                  <img
                                    src={image.url}
                                    alt={`Report evidence ${index + 1}`}
                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                  />
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition group-hover:bg-black/25">
                                    <ExternalLink
                                      size={14}
                                      className="opacity-0 group-hover:opacity-100"
                                    />
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:w-48 lg:flex-col">
                      {mapUrl && (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-rw-text transition hover:bg-slate-50"
                        >
                          View location
                          <ArrowUpRight size={16} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setResolveTarget(assignment);
                          setResolutionNote("");
                          setResolutionImages([]);
                          setActionError("");
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rw-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-primary-dark"
                      >
                        <CheckCircle2 size={17} />
                        Mark resolved
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Resolution dialog */}
      {resolveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeResolveDialog();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="resolve-dialog-title"
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between border-b border-rw-border p-5 sm:p-6">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
                  <CheckCircle2 size={21} />
                </div>
                <h2
                  id="resolve-dialog-title"
                  className="mt-3 text-xl font-bold text-rw-navy"
                >
                  Resolve assignment
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Record the work completed for “
                  {resolveTarget.report?.title || "this report"}”.
                </p>
              </div>

              <button
                type="button"
                onClick={closeResolveDialog}
                disabled={actionLoading}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleResolve} className="space-y-5 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="resolutionNote"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Resolution note <span className="text-red-600">*</span>
                </label>

                <textarea
                  id="resolutionNote"
                  value={resolutionNote}
                  onChange={(event) =>
                    setResolutionNote(event.target.value)
                  }
                  rows={4}
                  maxLength={1000}
                  required
                  placeholder="Describe the repair work completed and the final condition of the location..."
                  className="w-full resize-y rounded-xl border border-rw-border px-3.5 py-3 text-sm leading-6 text-rw-text outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {resolutionNote.length}/1000
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="resolutionImages"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Repair photos
                  </label>
                  <span className="text-xs text-slate-500">
                    {resolutionImages.length}/5
                  </span>
                </div>

                <label
                  htmlFor="resolutionImages"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-rw-border-dark bg-slate-50 px-5 py-6 text-center transition hover:border-orange-300 hover:bg-orange-50/50"
                >
                  <ImagePlus size={23} className="text-slate-500" />
                  <span className="mt-2 text-sm font-semibold text-slate-700">
                    Add repair evidence
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    Images only, up to 10 MB each
                  </span>
                  <input
                    id="resolutionImages"
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={resolutionImages.length >= 5}
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>

                {resolutionImages.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {resolutionImages.map((file, index) => (
                      <div
                        key={`${file.name}-${file.lastModified}-${index}`}
                        className="flex items-center gap-3 rounded-lg border border-rw-border px-3 py-2.5"
                      >
                        <ImagePlus
                          size={16}
                          className="shrink-0 text-slate-500"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            setResolutionImages((current) =>
                              current.filter((_, fileIndex) => fileIndex !== index),
                            )
                          }
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {actionError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-rw-border pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeResolveDialog}
                  disabled={actionLoading}
                  className="rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading || !resolutionNote.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      Confirm resolution
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default InProgressReports;

