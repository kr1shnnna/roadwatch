import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../services/api";

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
  error?.message ||
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

  // GeoJSON uses [longitude, latitude].
  return {
    longitude: Number(coordinates[0]),
    latitude: Number(coordinates[1]),
  };
};

const pointOnSegment = (point, start, end) => {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);

  if (Math.abs(cross) > 1e-9) return false;

  return (
    x >= Math.min(x1, x2) - 1e-9 &&
    x <= Math.max(x1, x2) + 1e-9 &&
    y >= Math.min(y1, y2) - 1e-9 &&
    y <= Math.max(y1, y2) + 1e-9
  );
};

const ringContainsPoint = (point, ring) => {
  if (!Array.isArray(ring) || ring.length < 4) return false;

  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const current = ring[i];
    const previous = ring[j];

    if (pointOnSegment(point, previous, current)) return true;

    const [x, y] = point;
    const [xi, yi] = current;
    const [xj, yj] = previous;

    const crosses = (yi > y) !== (yj > y);
    if (crosses && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
};

const polygonContainsPoint = (point, polygonCoordinates) => {
  if (!Array.isArray(polygonCoordinates) || !polygonCoordinates.length) {
    return false;
  }

  const [outerRing, ...holes] = polygonCoordinates;
  if (!ringContainsPoint(point, outerRing)) return false;

  return !holes.some((hole) => ringContainsPoint(point, hole));
};

const geometryContainsPoint = (geometry, point) => {
  if (!geometry?.type || !Array.isArray(geometry.coordinates)) return false;

  if (geometry.type === "Polygon") {
    return polygonContainsPoint(point, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) =>
      polygonContainsPoint(point, polygon),
    );
  }

  return false;
};

const Section = ({ title, description, children }) => (
  <section className="rounded-2xl border border-rw-border bg-white shadow-sm">
    <div className="border-b border-rw-border px-5 py-4 sm:px-6">
      <h2 className="text-base font-bold text-rw-navy">{title}</h2>
      {description && (
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      )}
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

const DetailField = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </dt>
    <dd className="mt-1.5 break-words text-sm leading-6 text-slate-800">
      {children || "Not available"}
    </dd>
  </div>
);

const EvidenceGallery = ({ title, images }) => {
  const validImages = Array.isArray(images)
    ? images.filter((image) => typeof image === "string" || image?.url)
    : [];

  if (validImages.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">No photos attached.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <span className="text-xs text-slate-500">{validImages.length} photos</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {validImages.map((image, index) => {
          const url = typeof image === "string" ? image : image.url;
          const key = typeof image === "string" ? image : image.publicId || image.url || index;

          return (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-xl border border-rw-border bg-slate-50"
            >
              <img
                src={url}
                alt={`${title} ${index + 1}`}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition duration-200 group-hover:scale-[1.03]"
              />
              <span className="block truncate px-2.5 py-2 text-xs text-slate-500">
                Photo {index + 1} · Open full image
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
};

const ReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState("assign");
  const [eligibleOfficers, setEligibleOfficers] = useState([]);
  const [assignmentDepartment, setAssignmentDepartment] = useState(null);
  const [assignmentServiceArea, setAssignmentServiceArea] = useState(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [reassignmentReason, setReassignmentReason] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReport = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await api.get(`/admin/reports/${id}`);
      const data = response?.data;

      if (!data?.report) {
        throw new Error("The server did not return this report.");
      }

      setReport(data.report);
      setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setReport(null);
      setAssignments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const coordinates = useMemo(() => getCoordinates(report), [report]);

  const mapUrl = coordinates
    ? `https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=17/${coordinates.latitude}/${coordinates.longitude}`
    : null;

  const canAssign =
    Boolean(report) &&
    !report.assignedTo &&
    ["reported", "reopened"].includes(report.status);

  const canReassign =
    Boolean(report?.assignedTo) &&
    ["assigned", "accepted", "in_progress", "reopened"].includes(report.status);

  const closeAssignmentModal = () => {
    if (submitting) return;

    setAssignmentModalOpen(false);
    setEligibleOfficers([]);
    setAssignmentDepartment(null);
    setAssignmentServiceArea(null);
    setSelectedOfficerId("");
    setReassignmentReason("");
    setOptionsError("");
    setActionError("");
  };

  const openAssignmentModal = async (mode) => {
    if (!report) return;

    setAssignmentMode(mode);
    setAssignmentModalOpen(true);
    setOptionsLoading(true);
    setOptionsError("");
    setActionError("");
    setActionSuccess("");
    setEligibleOfficers([]);
    setAssignmentDepartment(null);
    setAssignmentServiceArea(null);
    setSelectedOfficerId("");
    setReassignmentReason("");

    try {
      const [departmentsResponse, areasResponse] = await Promise.all([
        api.get("/admin/departments", { params: { isActive: true } }),
        api.get("/admin/service-areas", { params: { isActive: true } }),
      ]);

      const departments = (departmentsResponse.data?.departments || []).filter(
        (department) =>
          department.isActive !== false &&
          Array.isArray(department.categories) &&
          department.categories.includes(report.category),
      );

      if (departments.length === 0) {
        throw new Error(
          "No active department supports this report category. Update the department category settings first.",
        );
      }

      const areaSummaries = areasResponse.data?.serviceAreas || [];

      if (!areaSummaries.length) {
        throw new Error("There are no active service areas available.");
      }

      if (!coordinates) {
        throw new Error("This report has no valid coordinates, so an eligible service area cannot be identified.");
      }

      // The service-area list intentionally omits GeoJSON boundaries. Fetch each
      // active area's detail only when the admin opens the assignment dialog.
      const areaDetails = await Promise.all(
        areaSummaries.map(async (area) => {
          try {
            const response = await api.get(`/admin/service-areas/${area._id}`);
            return response.data?.serviceArea || null;
          } catch {
            return null;
          }
        }),
      );

      const coveringAreas = areaDetails.filter((area) =>
        area &&
        area.isActive !== false &&
        geometryContainsPoint(area.boundary, [coordinates.longitude, coordinates.latitude]),
      );

      if (!coveringAreas.length) {
        throw new Error(
          "No active service area contains this report location. Add or correct the service-area boundary before assigning this report.",
        );
      }

      // The backend selects a supporting active department and a service area
      // containing the point. Prefer the first returned matching records; its
      // assign/reassign endpoint will validate the final selection again.
      const department = departments[0];
      const serviceArea = coveringAreas[0];

      const officersResponse = await api.get("/admin/officers", {
        params: {
          isActive: true,
          department: department._id,
          serviceArea: serviceArea._id,
        },
      });

      const officers = (officersResponse.data?.officers || []).filter(
        (officer) =>
          officer.isActive !== false &&
          officer.department &&
          (officer.department._id || officer.department) === department._id &&
          Array.isArray(officer.assignedAreas) &&
          officer.assignedAreas.some(
            (area) => (area?._id || area) === serviceArea._id,
          ),
      );

      setAssignmentDepartment(department);
      setAssignmentServiceArea(serviceArea);
      setEligibleOfficers(officers);

      if (!officers.length) {
        setOptionsError(
          "No active officer is assigned to both the responsible department and the service area covering this report.",
        );
      }
    } catch (requestError) {
      setOptionsError(getErrorMessage(requestError));
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleAssignmentSubmit = async (event) => {
    event.preventDefault();

    if (!selectedOfficerId) {
      setActionError("Select an eligible officer first.");
      return;
    }

    if (assignmentMode === "reassign" && !reassignmentReason.trim()) {
      setActionError("A reason is required when reassigning a report.");
      return;
    }

    setSubmitting(true);
    setActionError("");
    setActionSuccess("");

    try {
      const endpoint = assignmentMode === "reassign" ? "reassign" : "assign";
      const payload = { officerId: selectedOfficerId };

      if (assignmentMode === "reassign") {
        payload.reason = reassignmentReason.trim();
      }

      const response = await api.patch(
        `/admin/reports/${report._id}/${endpoint}`,
        payload,
      );

      setActionSuccess(
        response.data?.message ||
          (assignmentMode === "reassign"
            ? "Report reassigned successfully."
            : "Report assigned successfully."),
      );

      setAssignmentModalOpen(false);
      setEligibleOfficers([]);
      setSelectedOfficerId("");
      setReassignmentReason("");

      await loadReport(true);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 pb-10">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="rounded-2xl border border-rw-border bg-white p-6">
          <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-slate-100" />
          <div className="mt-8 h-28 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 pb-10">
        <Link
          to="/reports"
          className="inline-flex text-sm font-semibold text-orange-700 hover:text-orange-800"
        >
          Back to reports
        </Link>

        <section className="rounded-2xl border border-red-200 bg-white p-6 sm:p-8">
          <h1 className="text-xl font-bold text-rw-navy">Report unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-red-700">
            {error || "This report could not be found."}
          </p>
          <button
            type="button"
            onClick={() => loadReport()}
            className="mt-5 rounded-xl bg-rw-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-rw-navy-light"
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  const statusClass = statusStyles[report.status] || "bg-slate-100 text-slate-700";
  const priorityClass = priorityStyles[report.priority] || priorityStyles.medium;
  const reporter = report.reportedBy;
  const assignedOfficer = report.assignedTo;
  const resolution = report.resolution || {};
  const reopenHistory = Array.isArray(report.reopenHistory) ? report.reopenHistory : [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/reports"
          className="inline-flex items-center text-sm font-semibold text-orange-700 transition hover:text-orange-800"
        >
          ← Back to reports
        </Link>

        <button
          type="button"
          onClick={() => loadReport(true)}
          disabled={refreshing}
          className="rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh details"}
        </button>
      </div>

      {actionSuccess && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {actionSuccess}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Report header */}
      <section className="overflow-hidden rounded-2xl border border-rw-border bg-white shadow-sm">
        <div className="h-1 bg-rw-primary" />
        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                  {formatLabel(report.status)}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityClass}`}>
                  {formatLabel(report.priority)} priority
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {formatLabel(report.category)}
                </span>
              </div>

              <h1 className="mt-4 break-words text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">
                {report.title || "Untitled report"}
              </h1>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                {report.description || "No description provided."}
              </p>
              <p className="mt-4 text-xs text-slate-500">
                Report ID: <span className="break-all font-mono text-slate-700">{report._id}</span>
              </p>
            </div>

            {(canAssign || canReassign) && (
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:w-48 xl:flex-col">
                {canAssign && (
                  <button
                    type="button"
                    onClick={() => openAssignmentModal("assign")}
                    className="rounded-xl bg-rw-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-rw-primary-dark"
                  >
                    Assign officer
                  </button>
                )}
                {canReassign && (
                  <button
                    type="button"
                    onClick={() => openAssignmentModal("reassign")}
                    className="rounded-xl border border-rw-border px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Reassign officer
                  </button>
                )}
              </div>
            )}
          </div>

          {report.status === "confirmed" && (
            <p className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              The citizen has confirmed that this issue was resolved.
            </p>
          )}
          {report.status === "rejected" && (
            <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              This report is marked as rejected. Assignment actions are unavailable from this page.
            </p>
          )}
          {report.status === "resolved" && (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Resolution has been submitted and is awaiting citizen confirmation.
            </p>
          )}
        </div>
      </section>

      {/* Core information */}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Section
          title="Report information"
          description="Details submitted by the citizen."
        >
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <DetailField label="Reported on">{formatDate(report.createdAt)}</DetailField>
            <DetailField label="Last updated">{formatDate(report.updatedAt)}</DetailField>
            <DetailField label="Category">{formatLabel(report.category)}</DetailField>
            <DetailField label="Priority">{formatLabel(report.priority)}</DetailField>
            <DetailField label="Reporter">{reporter?.name}</DetailField>
            <DetailField label="Reporter email">{reporter?.email}</DetailField>
          </dl>
        </Section>

        <Section
          title="Location and assignment"
          description="Where the issue was reported and who is responsible."
        >
          <dl className="space-y-5">
            <DetailField label="Coordinates">
              {coordinates
                ? `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
                : "No valid coordinates recorded"}
            </DetailField>
            <DetailField label="Assigned officer">
              {assignedOfficer?.name || "Not assigned"}
            </DetailField>
            <DetailField label="Officer email">
              {assignedOfficer?.email || "Not assigned"}
            </DetailField>
            {mapUrl && (
              <div>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Open location in OpenStreetMap
                </a>
              </div>
            )}
          </dl>
        </Section>
      </div>

      {/* Evidence */}
      <Section
        title="Evidence and resolution"
        description="Original citizen photos and the evidence submitted by the officer."
      >
        <div className="space-y-7">
          <EvidenceGallery title="Original report photos" images={report.evidenceImages} />

          <div className="border-t border-rw-border pt-6">
            <h3 className="text-sm font-semibold text-slate-800">Resolution record</h3>
            {resolution.note ? (
              <>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {resolution.note}
                </p>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <DetailField label="Resolved by">{resolution.resolvedBy?.name}</DetailField>
                  <DetailField label="Resolved on">{formatDate(resolution.resolvedAt)}</DetailField>
                </dl>
                <div className="mt-5">
                  <EvidenceGallery title="Repair evidence photos" images={resolution.images} />
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-500">
                No resolution has been recorded for this report yet.
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* Citizen reopen history */}
      <Section
        title="Reopen history"
        description="Recorded notes and photos from citizens who reopened this report."
      >
        {reopenHistory.length === 0 ? (
          <p className="text-sm text-slate-500">This report has no recorded reopen events.</p>
        ) : (
          <div className="space-y-5">
            {[...reopenHistory].reverse().map((entry, index) => (
              <div key={`${entry._id || entry.reopenedAt || index}`} className="border-b border-rw-border pb-5 last:border-b-0 last:pb-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-rw-navy">
                    Reopened by {entry.reopenedBy?.name || "Citizen"}
                  </p>
                  <time className="text-xs text-slate-500">
                    {formatDate(entry.reopenedAt)}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {entry.note || "No reopen note was provided."}
                </p>
                <div className="mt-4">
                  <EvidenceGallery title="Reopen evidence" images={entry.images} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Assignment history */}
      <Section
        title="Assignment history"
        description="Assignment records returned by the backend, newest first."
      >
        {assignments.length === 0 ? (
          <p className="text-sm text-slate-500">No assignment records exist for this report.</p>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment, index) => (
              <article key={assignment._id || index} className="rounded-xl border border-rw-border p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-rw-navy">
                      {assignment.officer?.name || "Officer unavailable"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {assignment.officer?.email || "No officer email"}
                    </p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[assignment.status] || "bg-slate-100 text-slate-700"}`}>
                    {formatLabel(assignment.status)}
                  </span>
                </div>

                <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField label="Department">{assignment.department?.name}</DetailField>
                  <DetailField label="Service area">
                    {assignment.serviceArea
                      ? `${assignment.serviceArea.name || "Unknown area"}${assignment.serviceArea.city ? `, ${assignment.serviceArea.city}` : ""}`
                      : null}
                  </DetailField>
                  <DetailField label="Assigned by">{assignment.assignedBy?.name}</DetailField>
                  <DetailField label="Assigned on">{formatDate(assignment.assignedAt || assignment.createdAt)}</DetailField>
                  <DetailField label="Accepted on">{formatDate(assignment.acceptedAt)}</DetailField>
                  <DetailField label="Completed on">{formatDate(assignment.completedAt)}</DetailField>
                </dl>

                {assignment.rejectionReason && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                      Rejection / reassignment note
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-amber-900">
                      {assignment.rejectionReason}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </Section>

      {/* Assign/reassign modal */}
      {assignmentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              closeAssignmentModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="assignment-dialog-title"
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="border-b border-rw-border p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
                Report assignment
              </p>
              <h2 id="assignment-dialog-title" className="mt-2 text-xl font-bold text-rw-navy">
                {assignmentMode === "reassign" ? "Reassign officer" : "Assign an officer"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Available officers are filtered by the report category, the service area covering its location, and active account status.
              </p>
            </div>

            <form onSubmit={handleAssignmentSubmit} className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="text-xs font-medium text-slate-500">Responsible department</p>
                  <p className="mt-1 text-sm font-semibold text-rw-navy">
                    {assignmentDepartment?.name || (optionsLoading ? "Finding department..." : "Not identified")}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="text-xs font-medium text-slate-500">Covering service area</p>
                  <p className="mt-1 text-sm font-semibold text-rw-navy">
                    {assignmentServiceArea
                      ? `${assignmentServiceArea.name}${assignmentServiceArea.city ? `, ${assignmentServiceArea.city}` : ""}`
                      : optionsLoading
                        ? "Checking boundaries..."
                        : "Not identified"}
                  </p>
                </div>
              </div>

              {assignmentMode === "reassign" && (
                <div>
                  <label htmlFor="reassignmentReason" className="mb-2 block text-sm font-semibold text-slate-700">
                    Reason for reassignment <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="reassignmentReason"
                    value={reassignmentReason}
                    onChange={(event) => setReassignmentReason(event.target.value)}
                    required
                    minLength={3}
                    maxLength={500}
                    rows={3}
                    placeholder="Explain why this report needs a different officer..."
                    className="w-full resize-y rounded-xl border border-rw-border px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {reassignmentReason.length}/500
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="eligibleOfficer" className="mb-2 block text-sm font-semibold text-slate-700">
                  Eligible officer <span className="text-red-600">*</span>
                </label>
                <select
                  id="eligibleOfficer"
                  value={selectedOfficerId}
                  onChange={(event) => setSelectedOfficerId(event.target.value)}
                  required
                  disabled={optionsLoading || eligibleOfficers.length === 0}
                  className="w-full rounded-xl border border-rw-border bg-white px-3.5 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="">
                    {optionsLoading
                      ? "Finding eligible officers..."
                      : eligibleOfficers.length
                        ? "Select an officer"
                        : "No eligible officers available"}
                  </option>
                  {eligibleOfficers.map((officer) => (
                    <option key={officer._id} value={officer._id}>
                      {officer.name} · {officer.email}
                    </option>
                  ))}
                </select>
              </div>

              {optionsLoading && (
                <p className="text-sm text-slate-500">
                  Checking active departments, service-area boundaries, and officer assignments...
                </p>
              )}

              {optionsError && !optionsLoading && (
                <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm leading-6 text-amber-900">
                  {optionsError}
                </div>
              )}

              {actionError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm leading-6 text-red-700">
                  {actionError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-rw-border pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAssignmentModal}
                  disabled={submitting}
                  className="rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    optionsLoading ||
                    !selectedOfficerId ||
                    (assignmentMode === "reassign" && !reassignmentReason.trim())
                  }
                  className="rounded-xl bg-rw-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Saving assignment..."
                    : assignmentMode === "reassign"
                      ? "Confirm reassignment"
                      : "Confirm assignment"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default ReportDetails;

