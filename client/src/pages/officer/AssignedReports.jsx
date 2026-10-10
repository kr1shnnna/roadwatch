
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
  Wrench,
  X,
} from "lucide-react";

import api from "../../services/api";

const STATUS_META = {
  assigned: {
    label: "Awaiting acceptance",
    className: "bg-rw-info-light text-rw-info",
  },
  accepted: {
    label: "Accepted",
    className: "bg-rw-primary-light text-rw-primary",
  },
  in_progress: {
    label: "In progress",
    className: "bg-rw-warning-light text-rw-warning",
  },
  completed: {
    label: "Resolved",
    className: "bg-rw-success-light text-rw-success",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rw-danger-light text-rw-danger",
  },
};

const CATEGORIES = {
  pothole: "Pothole",
  broken_road: "Damaged road",
  streetlight: "Streetlight",
  traffic_signal: "Traffic signal",
  waterlogging: "Waterlogging",
  open_manhole: "Open manhole",
  road_sign: "Road sign",
  road_debris: "Road debris",
  drainage: "Drainage",
  other: "Other issue",
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "assigned", label: "Awaiting acceptance" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const PRIORITY_STYLES = {
  low: {
    label: "Low",
    className: "text-rw-muted",
    stripe: "border-l-rw-border-dark",
  },
  medium: {
    label: "Medium",
    className: "text-rw-info",
    stripe: "border-l-rw-info",
  },
  high: {
    label: "High",
    className: "text-rw-warning",
    stripe: "border-l-rw-warning",
  },
  critical: {
    label: "Critical",
    className: "text-rw-danger",
    stripe: "border-l-rw-danger",
  },
};

const getReport = (assignment) =>
  assignment?.report &&
  typeof assignment.report === "object"
    ? assignment.report
    : {};

const getStatus = (assignment) => {
  const value = assignment?.status || "assigned";

  return {
    value,
    ...(STATUS_META[value] || {
      label: value.replaceAll("_", " "),
      className: "bg-rw-surface-muted text-rw-muted",
    }),
  };
};

const getCategory = (category) =>
  CATEGORIES[category] ||
  category?.replaceAll("_", " ") ||
  "Road issue";

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getLocation = (report) => {
  const coordinates = report?.location?.coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    !Number.isFinite(Number(coordinates[0])) ||
    !Number.isFinite(Number(coordinates[1]))
  ) {
    return null;
  }

  const [longitude, latitude] = coordinates;

  return {
    label: `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`,
    url: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`,
  };
};

const formatId = (id) =>
  id ? String(id).slice(-7).toUpperCase() : "N/A";

/* Compact summary card */
const StatCard = ({ label, value, icon: Icon, iconClass }) => (
  <div className="flex items-center gap-3 rounded-xl border border-rw-border bg-white px-4 py-4">
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
    >
      <Icon size={19} />
    </div>

    <div className="min-w-0">
      <p className="text-xs text-rw-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold leading-none text-rw-navy">
        {value}
      </p>
    </div>
  </div>
);

/* Loading placeholder */
const AssignmentSkeleton = () => (
  <div className="animate-pulse rounded-xl border border-rw-border bg-white p-5">
    <div className="flex gap-4">
      <div className="h-11 w-11 rounded-lg bg-rw-surface-muted" />
      <div className="flex-1 space-y-3">
        <div className="h-4 w-32 rounded bg-rw-surface-muted" />
        <div className="h-5 w-2/3 rounded bg-rw-surface-muted" />
        <div className="h-4 w-full rounded bg-rw-surface-muted" />
      </div>
    </div>
  </div>
);

/* Resolve dialog */
const ResolveDialog = ({
  assignment,
  submitting,
  onClose,
  onSubmit,
}) => {
  const report = getReport(assignment);
  const [note, setNote] = useState("");
  const [images, setImages] = useState([]);
  const [validationError, setValidationError] = useState("");
  const previews = useRef(new Set());
  const inputRef = useRef(null);

  useEffect(() => {
    const urls = previews.current;

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selected.length) return;

    const slots = 5 - images.length;
    const accepted = [];
    const issues = [];

    if (selected.length > slots) {
      issues.push("You can upload a maximum of five images.");
    }

    for (const file of selected.slice(0, slots)) {
      if (!file.type.startsWith("image/")) {
        issues.push(`${file.name} is not an image.`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      accepted.push({ file, preview });
    }

    setImages((current) => [...current, ...accepted]);
    setValidationError(issues.join(" "));
  };

  const removeImage = (preview) => {
    URL.revokeObjectURL(preview);
    previews.current.delete(preview);
    setImages((current) =>
      current.filter((image) => image.preview !== preview)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError("");

    if (!note.trim()) {
      setValidationError("Please enter a resolution note.");
      return;
    }

    if (note.trim().length > 1000) {
      setValidationError("The note cannot exceed 1,000 characters.");
      return;
    }

    const succeeded = await onSubmit(
      assignment,
      note.trim(),
      images.map((image) => image.file)
    );

    if (succeeded) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitting
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="resolve-title"
        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-rw-border px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rw-success">
              Complete assignment
            </p>
            <h2
              id="resolve-title"
              className="mt-1 text-xl font-bold text-rw-navy"
            >
              Resolve report
            </h2>
            <p className="mt-1 text-sm text-rw-muted">
              {report.title || "Assigned road issue"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-rw-muted hover:bg-rw-surface-muted disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label
              htmlFor="resolution-note"
              className="text-sm font-semibold text-rw-navy"
            >
              What work was completed?
              <span className="text-rw-danger"> *</span>
            </label>

            <textarea
              id="resolution-note"
              required
              maxLength={1000}
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Describe the repair or action taken..."
              className="mt-2 w-full resize-y rounded-xl border border-rw-border px-4 py-3 text-sm outline-none focus:border-rw-primary focus:ring-4 focus:ring-orange-100"
            />

            <p className="mt-1 text-right text-xs text-rw-muted">
              {note.length}/1000
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="resolution-photos"
                className="text-sm font-semibold text-rw-navy"
              >
                Repair photos
              </label>
              <span className="text-xs text-rw-muted">
                Optional · {images.length}/5
              </span>
            </div>

            <input
              ref={inputRef}
              id="resolution-photos"
              type="file"
              accept="image/*"
              multiple
              disabled={submitting || images.length >= 5}
              onChange={handleFiles}
              className="sr-only"
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={submitting || images.length >= 5}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-rw-border px-4 py-3 text-sm font-medium text-rw-text-secondary hover:border-rw-primary hover:bg-rw-primary-light disabled:opacity-50"
            >
              <ImagePlus size={18} />
              Add photos
            </button>

            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {images.map((image) => (
                  <div
                    key={image.preview}
                    className="relative overflow-hidden rounded-lg border border-rw-border"
                  >
                    <img
                      src={image.preview}
                      alt={image.file.name}
                      className="h-24 w-full object-cover"
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => removeImage(image.preview)}
                      aria-label={`Remove ${image.file.name}`}
                      className="absolute right-1 top-1 rounded-md bg-white p-1.5 text-rw-danger shadow"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {validationError && (
            <p role="alert" className="text-sm text-rw-danger">
              {validationError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-rw-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-rw-navy hover:bg-rw-surface-muted disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rw-success px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <CheckCircle2 size={17} />
              )}
              {submitting ? "Submitting..." : "Confirm resolution"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

/* Reject dialog */
const RejectDialog = ({
  assignment,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState("");
  const report = getReport(assignment);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!reason.trim()) return;

    const succeeded = await onSubmit(assignment, reason.trim());

    if (succeeded) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitting
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-title"
        className="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="border-b border-rw-border p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-rw-danger">
            Reject assignment
          </p>
          <h2
            id="reject-title"
            className="mt-2 text-xl font-bold text-rw-navy"
          >
            Confirm rejection
          </h2>
          <p className="mt-2 text-sm leading-6 text-rw-muted">
            This changes the assignment and associated report status. Enter
            a reason before proceeding.
          </p>
          <p className="mt-3 text-sm font-semibold text-rw-navy">
            {report.title || "Assigned road issue"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label
            htmlFor="rejection-reason"
            className="block text-sm font-semibold text-rw-navy"
          >
            Rejection reason
          </label>

          <textarea
            id="rejection-reason"
            required
            maxLength={1000}
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain why you cannot take this assignment..."
            className="w-full resize-y rounded-xl border border-rw-border px-4 py-3 text-sm outline-none focus:border-rw-primary focus:ring-4 focus:ring-orange-100"
          />

          <div className="flex flex-col-reverse gap-2 border-t border-rw-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-rw-navy hover:bg-rw-surface-muted"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rw-danger px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting && (
                <LoaderCircle size={16} className="animate-spin" />
              )}
              {submitting ? "Rejecting..." : "Confirm rejection"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

/* Individual assignment row */
const AssignmentCard = ({
  assignment,
  processing,
  onAccept,
  onStart,
  onResolve,
  onReject,
}) => {
  const report = getReport(assignment);
  const status = getStatus(assignment);
  const priority =
    PRIORITY_STYLES[report.priority || "medium"] ||
    PRIORITY_STYLES.medium;
  const location = getLocation(report);

  const category = getCategory(report.category);
  const id = assignment._id || assignment.id;
  const evidenceUrl = report.evidenceImages?.[0]?.url;

  return (
    <article
      className={`overflow-hidden rounded-xl border border-rw-border border-l-4 ${priority.stripe} bg-white transition hover:border-rw-border-dark`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rw-surface-muted text-rw-navy">
            <ClipboardList size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
              >
                {status.label}
              </span>

              <span className="text-xs text-rw-muted">
                {category}
              </span>

              <span className={`text-xs font-semibold ${priority.className}`}>
                {priority.label} priority
              </span>
            </div>

            <h3 className="mt-2 break-words text-base font-bold text-rw-navy sm:text-lg">
              {report.title || "Assigned road issue"}
            </h3>

            <p className="mt-1 line-clamp-2 text-sm leading-5 text-rw-muted">
              {report.description || "No description provided."}
            </p>
          </div>

          {evidenceUrl && (
            <img
              src={evidenceUrl}
              alt={`Evidence for ${report.title || "reported issue"}`}
              loading="lazy"
              className="hidden h-16 w-20 shrink-0 rounded-lg object-cover sm:block"
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-rw-border pt-3 text-xs text-rw-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} />
            {formatDate(assignment.assignedAt || assignment.createdAt)}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} />
            {location?.label || "Location unavailable"}
          </span>

          {assignment.serviceArea?.name && (
            <span>
              Area: {assignment.serviceArea.name}
            </span>
          )}

          {assignment.department?.name && (
            <span>
              {assignment.department.name}
            </span>
          )}

          <span>Ref. #{formatId(id)}</span>
        </div>

        {location && (
          <a
            href={location.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rw-primary hover:text-rw-primary-dark"
          >
            Open location
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Only show actions that match the current assignment status */}
      {["assigned", "accepted", "in_progress"].includes(status.value) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rw-border bg-rw-background/70 px-4 py-3 sm:px-5">
          <p className="text-xs text-rw-muted">
            {status.value === "assigned" && "Review this assignment before accepting."}
            {status.value === "accepted" && "Ready to begin this work."}
            {status.value === "in_progress" && "Finish the work and record its outcome."}
          </p>

          <div className="flex flex-wrap gap-2">
            {status.value === "assigned" && (
              <>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => onReject(assignment)}
                  className="rounded-lg border border-rw-border bg-white px-3 py-2 text-xs font-semibold text-rw-muted transition hover:border-rw-danger hover:text-rw-danger disabled:opacity-50"
                >
                  Reject
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => onAccept(assignment)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rw-primary px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rw-primary-dark disabled:opacity-50"
                >
                  {processing ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Accept assignment
                </button>
              </>
            )}

            {status.value === "accepted" && (
              <button
                type="button"
                disabled={processing}
                onClick={() => onStart(assignment)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rw-primary px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rw-primary-dark disabled:opacity-50"
              >
                {processing ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <Wrench size={14} />
                )}
                Start work
                <ArrowRight size={14} />
              </button>
            )}

            {status.value === "in_progress" && (
              <button
                type="button"
                disabled={processing}
                onClick={() => onResolve(assignment)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rw-success px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                Resolve report
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

const AssignedReports = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [processingId, setProcessingId] = useState("");

  const [resolveTarget, setResolveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAssignments = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const response = await api.get("/assignments/my");

        if (cancelled) return;

        setAssignments(
          Array.isArray(response.data?.assignments)
            ? response.data.assignments
            : []
        );
      } catch (error) {
        if (cancelled) return;

        setLoadError(
          error.response?.data?.message ||
            "Couldn't load your assignments. Please try again."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAssignments();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const counts = useMemo(() => {
    const statuses = assignments.map(
      (assignment) => getStatus(assignment).value
    );

    return {
      total: assignments.length,
      assigned: statuses.filter((value) => value === "assigned").length,
      inProgress: statuses.filter((value) => value === "in_progress").length,
      resolved: statuses.filter((value) => value === "completed").length,
    };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const report = getReport(assignment);
      const status = getStatus(assignment).value;
      const location = getLocation(report);

      const matchesFilter =
        activeFilter === "all" || status === activeFilter;

      const searchableValues = [
        report.title,
        report.description,
        report.category,
        report.priority,
        assignment.serviceArea?.name,
        assignment.department?.name,
        location?.label,
        assignment._id,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      return matchesFilter && matchesSearch;
    });
  }, [assignments, activeFilter, search]);

  const runAction = async (assignment, action, fallbackMessage) => {
    setProcessingId(assignment._id);
    setActionError("");
    setNotice("");

    try {
      const response = await action();

      setNotice(response.data?.message || fallbackMessage);
      setReloadKey((current) => current + 1);

      return true;
    } catch (error) {
      setActionError(
        error.response?.data?.message ||
          "The action failed. Please try again."
      );

      return false;
    } finally {
      setProcessingId("");
    }
  };

  const handleAccept = (assignment) =>
    runAction(
      assignment,
      () => api.patch(`/assignments/${assignment._id}/accept`),
      "Assignment accepted successfully."
    );

  const handleStart = (assignment) =>
    runAction(
      assignment,
      () => api.patch(`/assignments/${assignment._id}/start`),
      "Work started successfully."
    );

  const handleResolve = (assignment, note, files) => {
    const payload = new FormData();

    payload.append("resolutionNote", note);

    files.forEach((file) => payload.append("images", file));

    return runAction(
      assignment,
      () =>
        api.patch(
          `/assignments/${assignment._id}/resolve`,
          payload,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        ),
      "Assignment resolved successfully."
    );
  };

  const handleReject = (assignment, reason) =>
    runAction(
      assignment,
      () =>
        api.patch(`/assignments/${assignment._id}/reject`, {
          reason,
        }),
      "Assignment rejected successfully."
    );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Clean page heading */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">
            Assigned reports
          </h2>

          <p className="mt-2 text-sm text-rw-muted">
            Review assignments and update their progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setReloadKey((current) => current + 1)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-rw-border bg-white px-3.5 py-2.5 text-sm font-semibold text-rw-navy transition hover:bg-rw-surface-muted disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={15}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </header>

      {/* Compact statistics */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Total assignments"
          value={loading ? "—" : counts.total}
          icon={ClipboardList}
          iconClass="bg-rw-primary-light text-rw-primary"
        />

        <StatCard
          label="Awaiting acceptance"
          value={loading ? "—" : counts.assigned}
          icon={ShieldCheck}
          iconClass="bg-rw-info-light text-rw-info"
        />

        <StatCard
          label="In progress"
          value={loading ? "—" : counts.inProgress}
          icon={Wrench}
          iconClass="bg-rw-warning-light text-rw-warning"
        />

        <StatCard
          label="Resolved"
          value={loading ? "—" : counts.resolved}
          icon={CheckCircle2}
          iconClass="bg-rw-success-light text-rw-success"
        />
      </section>

      {/* Messages */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-rw-success/20 bg-rw-success-light px-4 py-3"
        >
          <p className="text-sm text-rw-success">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss success message"
            className="rounded-md p-1 text-rw-success hover:bg-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rw-danger/20 bg-rw-danger-light px-4 py-3"
        >
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-rw-danger"
          />
          <p className="text-sm leading-6 text-rw-danger">
            {actionError}
          </p>
        </div>
      )}

      {/* Search and filters */}
      <section className="rounded-xl border border-rw-border bg-white p-3.5 sm:p-4">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-rw-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, area, department..."
              aria-label="Search assignments"
              className="w-full rounded-lg border border-rw-border bg-rw-background py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-rw-placeholder focus:border-rw-primary focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const selected = activeFilter === filter.value;

              const count =
                filter.value === "all"
                  ? assignments.length
                  : assignments.filter(
                      (assignment) =>
                        getStatus(assignment).value === filter.value
                    ).length;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  aria-pressed={selected}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                    selected
                      ? "bg-rw-navy text-white"
                      : "bg-rw-surface-muted text-rw-text-secondary hover:bg-rw-border"
                  }`}
                >
                  {filter.label}
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                      selected
                        ? "bg-white/15 text-white"
                        : "bg-white text-rw-muted"
                    }`}
                  >
                    {loading ? "—" : count}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="border-t border-rw-border pt-3 text-xs text-rw-muted">
            {loading
              ? "Loading assignments..."
              : `${filteredAssignments.length} of ${assignments.length} assignments`}
          </p>
        </div>
      </section>

      {/* API error */}
      {loadError && !loading && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rw-danger/20 bg-rw-danger-light p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm leading-6 text-rw-danger">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="inline-flex items-center gap-2 self-start text-sm font-semibold text-rw-danger"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <AssignmentSkeleton />
          <AssignmentSkeleton />
          <AssignmentSkeleton />
        </div>
      )}

      {/* No assignments */}
      {!loading && !loadError && assignments.length === 0 && (
        <section className="rounded-xl border border-rw-border bg-white px-6 py-14 text-center">
          <ClipboardList
            size={28}
            className="mx-auto text-rw-placeholder"
          />
          <h3 className="mt-4 text-lg font-bold text-rw-navy">
            No assignments yet
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-rw-muted">
            Reports assigned to your account will appear here.
          </p>
        </section>
      )}

      {/* Empty filter */}
      {!loading &&
        !loadError &&
        assignments.length > 0 &&
        filteredAssignments.length === 0 && (
          <section className="rounded-xl border border-rw-border bg-white px-6 py-12 text-center">
            <Search
              size={25}
              className="mx-auto text-rw-placeholder"
            />
            <h3 className="mt-4 font-bold text-rw-navy">
              No matching reports
            </h3>
            <p className="mt-2 text-sm text-rw-muted">
              Try a different search or status filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveFilter("all");
              }}
              className="mt-4 rounded-lg border border-rw-border px-4 py-2 text-sm font-semibold text-rw-navy hover:bg-rw-surface-muted"
            >
              Clear filters
            </button>
          </section>
        )}

      {/* Simplified assignment list */}
      {!loading && !loadError && filteredAssignments.length > 0 && (
        <section className="space-y-3">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment._id || assignment.id}
              assignment={assignment}
              processing={processingId === assignment._id}
              onAccept={handleAccept}
              onStart={handleStart}
              onResolve={setResolveTarget}
              onReject={setRejectTarget}
            />
          ))}
        </section>
      )}

      {/* Action dialogs */}
      {resolveTarget && (
        <ResolveDialog
          assignment={resolveTarget}
          submitting={processingId === resolveTarget._id}
          onClose={() => {
            if (processingId !== resolveTarget._id) {
              setResolveTarget(null);
            }
          }}
          onSubmit={handleResolve}
        />
      )}

      {rejectTarget && (
        <RejectDialog
          assignment={rejectTarget}
          submitting={processingId === rejectTarget._id}
          onClose={() => {
            if (processingId !== rejectTarget._id) {
              setRejectTarget(null);
            }
          }}
          onSubmit={handleReject}
        />
      )}
    </div>
  );
};

export default AssignedReports;

