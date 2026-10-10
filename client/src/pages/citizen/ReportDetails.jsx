import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import api from "../../services/api";

const STATUS_META = {
  reported: { label: "Reported", className: "bg-rw-primary-light text-rw-primary" },
  verified: { label: "Verified", className: "bg-rw-info-light text-rw-info" },
  assigned: { label: "Assigned", className: "bg-rw-info-light text-rw-info" },
  accepted: { label: "Accepted", className: "bg-rw-info-light text-rw-info" },
  in_progress: { label: "In progress", className: "bg-rw-warning-light text-rw-warning" },
  resolved: { label: "Awaiting your verification", className: "bg-rw-success-light text-rw-success" },
  confirmed: { label: "Confirmed resolved", className: "bg-rw-success-light text-rw-success" },
  reopened: { label: "Reopened", className: "bg-rw-warning-light text-rw-warning" },
  rejected: { label: "Rejected", className: "bg-rw-danger-light text-rw-danger" },
};

const CATEGORY_LABELS = {
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

const formatDate = (value, includeTime = false) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
};

const formatCategory = (category) =>
  CATEGORY_LABELS[category] || category?.replaceAll("_", " ") || "Other issue";

const formatStatus = (status) =>
  STATUS_META[status] || {
    label: status?.replaceAll("_", " ") || "Unknown",
    className: "bg-rw-surface-muted text-rw-muted",
  };

const Section = ({ title, description, children, action }) => (
  <section className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-rw-navy">{title}</h2>
        {description && <p className="mt-1 text-sm leading-6 text-rw-muted">{description}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const ImageGallery = ({ images, emptyMessage }) => {
  const items = Array.isArray(images) ? images.filter((image) => image?.url) : [];

  if (!items.length) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-rw-border px-4 py-5 text-sm text-rw-muted">
        <ImageIcon size={18} />
        {emptyMessage || "No images attached."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((image, index) => (
        <a
          key={`${image.publicId || image.url}-${index}`}
          href={image.url}
          target="_blank"
          rel="noreferrer"
          className="group overflow-hidden rounded-xl border border-rw-border bg-rw-surface-muted"
          aria-label={`Open evidence image ${index + 1} in a new tab`}
        >
          <img
            src={image.url}
            alt={`Report evidence ${index + 1}`}
            loading="lazy"
            className="h-36 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
          />
          <span className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-rw-muted">
            Evidence {index + 1}
            <ExternalLink size={13} />
          </span>
        </a>
      ))}
    </div>
  );
};

function ReportDetails() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reopenFormOpen, setReopenFormOpen] = useState(false);
  const [reopenNote, setReopenNote] = useState("");
  const [reopenImages, setReopenImages] = useState([]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/reports/${id}`);
      setReport(response.data?.report || null);
      if (!response.data?.report) setError("The report could not be found.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load this report. Please try again."
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const reportId = report?._id || id;
  const statusMeta = formatStatus(report?.status);
  const reference = reportId ? String(reportId).slice(-8).toUpperCase() : "N/A";
  const coordinates = report?.location?.coordinates;
  const hasCoordinates =
    report?.location?.type === "Point" &&
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    Number.isFinite(Number(coordinates[0])) &&
    Number.isFinite(Number(coordinates[1]));

  const mapsUrl = useMemo(() => {
    if (!hasCoordinates) return "";
    const [longitude, latitude] = coordinates;
    return `https://www.google.com/maps?q=${Number(latitude)},${Number(longitude)}`;
  }, [coordinates, hasCoordinates]);

  const handleConfirmResolution = async () => {
    const accepted = window.confirm(
      "Confirm that the reported issue has been resolved? This will close the report."
    );
    if (!accepted) return;

    setSubmitting(true);
    setActionError("");
    setNotice("");
    try {
      const response = await api.patch(`/reports/${reportId}/confirm`);
      setNotice(response.data?.message || "Resolution confirmed. Thank you for verifying the fix.");
      await loadReport();
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to confirm this resolution. Please try again."
      );
      await loadReport();
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = (event) => {
    const selected = Array.from(event.target.files || []);
    setActionError("");

    if (selected.length > 5) {
      setReopenImages([]);
      setActionError("You can upload up to 5 images.");
      event.target.value = "";
      return;
    }

    const invalidType = selected.find(
      (file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );
    if (invalidType) {
      setReopenImages([]);
      setActionError("Use JPG, PNG, or WEBP images only.");
      event.target.value = "";
      return;
    }

    const oversized = selected.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      setReopenImages([]);
      setActionError(`Each image must be 5 MB or smaller (${oversized.name} is too large).`);
      event.target.value = "";
      return;
    }

    setReopenImages(selected);
  };

  const handleReopenSubmit = async (event) => {
    event.preventDefault();
    if (!reopenNote.trim()) {
      setActionError("Please explain why the issue is not resolved.");
      return;
    }

    setSubmitting(true);
    setActionError("");
    setNotice("");

    const formData = new FormData();
    formData.append("reopenNote", reopenNote.trim());
    reopenImages.forEach((file) => formData.append("images", file));

    try {
      const response = await api.patch(`/reports/${reportId}/reopen`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNotice(response.data?.message || "Report reopened and sent for another review.");
      setReopenFormOpen(false);
      setReopenNote("");
      setReopenImages([]);
      await loadReport();
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.message ||
        "Unable to reopen this report. Please try again.";

      // The backend can return an error if routing fails after it has already saved the reopen.
      if (message.toLowerCase().includes("report was reopened")) {
        setNotice(message);
        setReopenFormOpen(false);
        setReopenNote("");
        setReopenImages([]);
        await loadReport();
      } else {
        setActionError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="mx-auto max-w-5xl space-y-5" aria-label="Loading report details">
        <div className="h-5 w-40 animate-pulse rounded bg-rw-surface-muted" />
        <div className="animate-pulse rounded-2xl border border-rw-border bg-white p-6">
          <div className="h-4 w-32 rounded bg-rw-surface-muted" />
          <div className="mt-4 h-8 w-2/3 rounded bg-rw-surface-muted" />
          <div className="mt-4 h-4 w-full rounded bg-rw-surface-muted" />
          <div className="mt-2 h-4 w-3/4 rounded bg-rw-surface-muted" />
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Link to="/citizen/reports" className="inline-flex items-center gap-2 text-sm font-semibold text-rw-muted hover:text-rw-primary">
          <ArrowLeft size={17} /> Back to my reports
        </Link>
        <div role="alert" className="rounded-2xl border border-rw-danger/20 bg-rw-danger-light p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-rw-danger" size={22} />
            <div className="flex-1">
              <h1 className="font-bold text-rw-danger">Couldn't load this report</h1>
              <p className="mt-2 text-sm leading-6 text-rw-danger">{error}</p>
              <button
                type="button"
                onClick={loadReport}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rw-danger/20 bg-white px-4 py-2 text-sm font-semibold text-rw-danger hover:bg-rw-danger-light"
              >
                <RefreshCw size={15} /> Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const canVerify = report.status === "resolved";

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/citizen/reports"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-rw-muted transition hover:text-rw-primary"
          >
            <ArrowLeft size={16} /> Back to my reports
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rw-primary">Report details</p>
          <h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-rw-navy sm:text-4xl">
            {report.title || "Untitled report"}
          </h1>
          <p className="mt-2 text-sm text-rw-muted">Reference #{reference}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusMeta.className}`}>
            {statusMeta.label}
          </span>
          <button
            type="button"
            onClick={loadReport}
            disabled={loading || submitting}
            className="inline-flex items-center gap-2 rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-rw-muted transition hover:bg-rw-surface-muted disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      {notice && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-rw-success/20 bg-rw-success-light px-4 py-3 text-sm text-rw-success">
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <p className="flex-1 leading-6">{notice}</p>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message" className="rounded p-1 hover:bg-white/60">
            <X size={16} />
          </button>
        </div>
      )}

      {error && report && (
        <div role="alert" className="rounded-xl border border-rw-danger/20 bg-rw-danger-light px-4 py-3 text-sm text-rw-danger">
          {error}
        </div>
      )}

      {actionError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rw-danger/20 bg-rw-danger-light px-4 py-3 text-sm text-rw-danger">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="flex-1 leading-6">{actionError}</p>
          <button type="button" onClick={() => setActionError("")} aria-label="Dismiss error" className="rounded p-1 hover:bg-white/60">
            <X size={16} />
          </button>
        </div>
      )}

      {canVerify && (
        <section className="rounded-2xl border border-rw-success/25 bg-rw-success-light p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-rw-success">
                <ShieldCheck size={23} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-rw-navy">The officer marked this issue as resolved</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-rw-muted">
                  Review the resolution note and repair evidence below. Confirm the fix if the issue is gone, or reopen the report if the problem remains.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleConfirmResolution}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rw-success px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={17} /> Confirm resolution
              </button>
              <button
                type="button"
                onClick={() => { setReopenFormOpen((open) => !open); setActionError(""); }}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rw-warning/30 bg-white px-4 py-3 text-sm font-semibold text-rw-warning transition hover:bg-rw-warning-light disabled:opacity-50"
              >
                {reopenFormOpen ? <X size={17} /> : <RefreshCw size={16} />}
                {reopenFormOpen ? "Cancel reopen" : "Reopen report"}
              </button>
            </div>
          </div>

          {reopenFormOpen && (
            <form onSubmit={handleReopenSubmit} className="mt-5 space-y-4 border-t border-rw-success/20 pt-5">
              <div>
                <label htmlFor="reopenNote" className="mb-2 block text-sm font-semibold text-rw-navy">
                  Why is the issue still present? <span className="text-rw-danger">*</span>
                </label>
                <textarea
                  id="reopenNote"
                  value={reopenNote}
                  onChange={(event) => setReopenNote(event.target.value)}
                  maxLength={1000}
                  rows={4}
                  required
                  placeholder="Explain what is still wrong or what repair is incomplete..."
                  className="w-full rounded-xl border border-rw-border bg-white px-4 py-3 text-sm text-rw-text outline-none transition placeholder:text-rw-placeholder focus:border-rw-primary focus:ring-4 focus:ring-orange-100"
                />
                <p className="mt-1 text-right text-xs text-rw-muted">{reopenNote.length}/1000</p>
              </div>

              <div>
                <label htmlFor="reopenImages" className="mb-2 block text-sm font-semibold text-rw-navy">
                  Add current photos (optional)
                </label>
                <div className="rounded-xl border border-dashed border-rw-border bg-white p-4">
                  <div className="flex items-start gap-3">
                    <Upload size={19} className="mt-0.5 shrink-0 text-rw-muted" />
                    <div className="min-w-0 flex-1">
                      <input
                        id="reopenImages"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageChange}
                        className="block w-full text-sm text-rw-muted file:mr-3 file:rounded-lg file:border-0 file:bg-rw-surface-muted file:px-3 file:py-2 file:text-sm file:font-semibold file:text-rw-navy hover:file:bg-rw-border"
                      />
                      <p className="mt-2 text-xs leading-5 text-rw-muted">Up to 5 JPG, PNG, or WEBP images; max 5 MB each.</p>
                      {reopenImages.length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-rw-text-secondary">
                          {reopenImages.map((file) => <li key={`${file.name}-${file.lastModified}`} className="truncate">{file.name}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => { setReopenFormOpen(false); setReopenNote(""); setReopenImages([]); setActionError(""); }}
                  disabled={submitting}
                  className="rounded-xl border border-rw-border bg-white px-4 py-3 text-sm font-semibold text-rw-muted hover:bg-rw-surface-muted disabled:opacity-50"
                >Cancel</button>
                <button
                  type="submit"
                  disabled={submitting || !reopenNote.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rw-warning px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {submitting ? "Submitting..." : "Submit reopen request"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="space-y-6">
          <Section title="Issue description" description="The details submitted when you reported this problem.">
            <p className="whitespace-pre-line break-words text-sm leading-7 text-rw-text-secondary">
              {report.description || "No description provided."}
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-rw-background p-4">
                <p className="text-xs font-medium text-rw-muted">Category</p>
                <p className="mt-1 font-semibold text-rw-navy">{formatCategory(report.category)}</p>
              </div>
              <div className="rounded-xl bg-rw-background p-4">
                <p className="text-xs font-medium text-rw-muted">Priority</p>
                <p className="mt-1 font-semibold capitalize text-rw-navy">{report.priority || "medium"}</p>
              </div>
            </div>
          </Section>

          <Section title="Original evidence" description="Photos attached when the issue was first reported.">
            <ImageGallery images={report.evidenceImages} emptyMessage="No original evidence photos were attached." />
          </Section>

          <Section
            title="Officer's resolution"
            description="Repair notes and evidence submitted by the assigned officer."
          >
            {report.resolution?.note ? (
              <>
                <div className="rounded-xl border border-rw-success/20 bg-rw-success-light p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-rw-success">
                    <CheckCircle2 size={17} /> Resolution note
                  </div>
                  <p className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-rw-text-secondary">
                    {report.resolution.note}
                  </p>
                  {report.resolution.resolvedAt && (
                    <p className="mt-3 text-xs text-rw-muted">Marked resolved on {formatDate(report.resolution.resolvedAt, true)}</p>
                  )}
                </div>
                <div className="mt-5">
                  <h3 className="mb-3 text-sm font-bold text-rw-navy">Repair photos</h3>
                  <ImageGallery images={report.resolution.images} emptyMessage="The officer did not attach repair photos." />
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-dashed border-rw-border p-4 text-sm text-rw-muted">
                <Clock3 size={19} className="mt-0.5 shrink-0" />
                <p className="leading-6">The officer has not submitted a resolution yet. This section will show the repair note and evidence once the issue is marked resolved.</p>
              </div>
            )}
          </Section>

          {Array.isArray(report.reopenHistory) && report.reopenHistory.length > 0 && (
            <Section title="Reopen history" description="Previous feedback submitted when the issue was reported as unresolved.">
              <div className="space-y-5">
                {report.reopenHistory.slice().reverse().map((entry, index) => (
                  <div key={`${entry._id || entry.reopenedAt || index}`} className="border-l-2 border-rw-warning/40 pl-4">
                    <p className="text-xs font-medium text-rw-muted">{formatDate(entry.reopenedAt, true)}</p>
                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-rw-text-secondary">{entry.note || "No note provided."}</p>
                    <div className="mt-3">
                      <ImageGallery images={entry.images} emptyMessage="No images attached to this reopen request." />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <aside className="space-y-6">
          <Section title="Report information">
            <dl className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays size={18} className="mt-0.5 shrink-0 text-rw-muted" />
                <div>
                  <dt className="text-xs text-rw-muted">Submitted</dt>
                  <dd className="mt-1 text-sm font-semibold text-rw-navy">{formatDate(report.createdAt, true)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText size={18} className="mt-0.5 shrink-0 text-rw-muted" />
                <div>
                  <dt className="text-xs text-rw-muted">Reference</dt>
                  <dd className="mt-1 text-sm font-semibold text-rw-navy">#{reference}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-rw-muted" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-rw-muted">Location</dt>
                  {hasCoordinates ? (
                    <>
                      <dd className="mt-1 text-sm font-semibold text-rw-navy">Lat {Number(coordinates[1]).toFixed(5)}, Lng {Number(coordinates[0]).toFixed(5)}</dd>
                      <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rw-primary hover:underline">
                        Open in Google Maps <ExternalLink size={12} />
                      </a>
                    </>
                  ) : <dd className="mt-1 text-sm text-rw-muted">Location coordinates unavailable.</dd>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserRound size={18} className="mt-0.5 shrink-0 text-rw-muted" />
                <div>
                  <dt className="text-xs text-rw-muted">Assigned officer</dt>
                  {report.assignedTo ? (
                    <>
                      <dd className="mt-1 text-sm font-semibold text-rw-navy">{report.assignedTo.name || "Officer"}</dd>
                      {report.assignedTo.email && <dd className="mt-1 break-all text-xs text-rw-muted">{report.assignedTo.email}</dd>}
                    </>
                  ) : <dd className="mt-1 text-sm text-rw-muted">No officer currently assigned.</dd>}
                </div>
              </div>
              {report.resolution?.resolvedBy?.name && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-rw-success" />
                  <div>
                    <dt className="text-xs text-rw-muted">Resolved by</dt>
                    <dd className="mt-1 text-sm font-semibold text-rw-navy">{report.resolution.resolvedBy.name}</dd>
                  </div>
                </div>
              )}
            </dl>
          </Section>

          <Section title="What happens next?">
            {report.status === "resolved" ? (
              <p className="text-sm leading-6 text-rw-muted">Review the officer's note and photos, then confirm the repair or reopen the report with a clear explanation.</p>
            ) : report.status === "confirmed" ? (
              <div className="flex items-start gap-2 text-sm leading-6 text-rw-success"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />You've confirmed that the reported issue has been resolved.</div>
            ) : report.status === "reopened" ? (
              <p className="text-sm leading-6 text-rw-muted">Your feedback has been recorded. The issue can be reviewed and assigned again.</p>
            ) : report.status === "rejected" ? (
              <p className="text-sm leading-6 text-rw-muted">This report was rejected. Check any notes from the authority or contact the relevant support channel if you believe this is incorrect.</p>
            ) : (
              <p className="text-sm leading-6 text-rw-muted">You can check this page for status updates. Once the officer marks the issue resolved, the verification options will appear here.</p>
            )}
          </Section>

          <Link
            to="/citizen/reports"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rw-border bg-white px-4 py-3 text-sm font-semibold text-rw-navy transition hover:bg-rw-surface-muted"
          >
            <ArrowLeft size={16} /> Return to my reports
          </Link>
        </aside>
      </div>
    </div>
  );
}

export default ReportDetails;
