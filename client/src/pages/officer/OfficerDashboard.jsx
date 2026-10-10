import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MapPin,
  RefreshCw,
  Wrench,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const STATUS_META = {
  assigned: {
    label: "Awaiting acceptance",
    className: "bg-rw-info-light text-rw-info",
  },
  pending: {
    label: "Pending",
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
  resolved: {
    label: "Resolved",
    className: "bg-rw-success-light text-rw-success",
  },
  completed: {
    label: "Completed",
    className: "bg-rw-success-light text-rw-success",
  },
  reopened: {
    label: "Reopened",
    className: "bg-rw-danger-light text-rw-danger",
  },
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

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getReport = (assignment) => {
  if (assignment?.report && typeof assignment.report === "object") {
    return assignment.report;
  }

  return assignment?.reportDetails || assignment?.item || {};
};

const getStatus = (assignment) => {
  const report = getReport(assignment);
  const value = assignment?.status || report?.status || "assigned";

  return {
    value,
    ...(STATUS_META[value] || {
      label: value.replaceAll("_", " "),
      className: "bg-rw-surface-muted text-rw-muted",
    }),
  };
};

const getLocation = (report) => {
  const coordinates = report?.location?.coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    !Number.isFinite(Number(coordinates[0])) ||
    !Number.isFinite(Number(coordinates[1]))
  ) {
    return "Location recorded";
  }

  const [longitude, latitude] = coordinates;

  return `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;
};

const StatCard = ({ icon: Icon, label, value, description, iconClass }) => (
  <div className="rounded-2xl border border-rw-border bg-white p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-rw-muted">{label}</p>

        <p className="mt-3 text-3xl font-bold tracking-tight text-rw-navy">
          {value}
        </p>
      </div>

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={21} />
      </div>
    </div>

    <p className="mt-3 text-xs leading-5 text-rw-muted">{description}</p>
  </div>
);

const AssignmentCard = ({ assignment }) => {
  const report = getReport(assignment);
  const status = getStatus(assignment);

  const category =
    CATEGORY_LABELS[report?.category] ||
    report?.category?.replaceAll("_", " ") ||
    "Road issue";

  return (
    <article className="rounded-xl border border-rw-border bg-white p-5 transition hover:border-rw-border-dark">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rw-primary-light text-rw-primary">
          <ClipboardList size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
            >
              {status.label}
            </span>

            <span className="text-xs capitalize text-rw-muted">
              {category}
            </span>
          </div>

          <h3 className="mt-3 break-words text-base font-bold text-rw-navy">
            {report?.title || "Assigned road issue"}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-rw-muted">
            {report?.description ||
              "Open the assignment to review the issue details."}
          </p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-rw-muted">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} />
              {getLocation(report)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} />
              {formatDate(
                assignment?.assignedAt ||
                  assignment?.createdAt ||
                  report?.createdAt
              )}
            </span>

            {report?.priority && (
              <span className="capitalize">
                {report.priority} priority
              </span>
            )}
          </div>
        </div>

        <Link
          to="/officer/assignments"
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-rw-border px-4 py-2.5 text-sm font-semibold text-rw-navy transition hover:border-rw-primary hover:text-rw-primary"
        >
          View
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
};

const OfficerDashboard = () => {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchAssignments = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/assignments/my");

        if (cancelled) return;

        const data = response.data;

        const records = Array.isArray(data?.assignments)
          ? data.assignments
          : Array.isArray(data?.data?.assignments)
            ? data.data.assignments
            : Array.isArray(data?.items)
              ? data.items
              : [];

        setAssignments(records);
      } catch (requestError) {
        if (cancelled) return;

        setError(
          requestError.response?.data?.message ||
            "Couldn't load your assignments. Please try again."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAssignments();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const statistics = useMemo(() => {
    const statuses = assignments.map(
      (assignment) => getStatus(assignment).value
    );

    return {
      assigned: statuses.filter((status) =>
        ["assigned", "pending", "reopened"].includes(status)
      ).length,

      accepted: statuses.filter((status) => status === "accepted").length,

      inProgress: statuses.filter((status) =>
        ["in_progress", "started"].includes(status)
      ).length,

      resolved: statuses.filter((status) =>
        ["resolved", "completed"].includes(status)
      ).length,
    };
  }, [assignments]);

  const recentAssignments = useMemo(() => {
    return [...assignments]
      .sort(
        (a, b) =>
          new Date(b.assignedAt || b.createdAt || 0).getTime() -
          new Date(a.assignedAt || a.createdAt || 0).getTime()
      )
      .slice(0, 5);
  }, [assignments]);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Officer";

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Simple page heading */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rw-primary">
            Officer workspace
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-rw-navy sm:text-4xl">
            {greeting}, {firstName}.
          </h2>

          <p className="mt-2 text-sm leading-6 text-rw-muted sm:text-base">
            Here's an overview of your assigned work.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setReloadKey((current) => current + 1)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-rw-navy transition hover:bg-rw-surface-muted disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </header>

      {/* Work statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Awaiting acceptance"
          value={loading ? "—" : statistics.assigned}
          description="Assignments needing your attention"
          iconClass="bg-rw-info-light text-rw-info"
        />

        <StatCard
          icon={CheckCircle2}
          label="Accepted"
          value={loading ? "—" : statistics.accepted}
          description="Work you have accepted"
          iconClass="bg-rw-primary-light text-rw-primary"
        />

        <StatCard
          icon={Wrench}
          label="In progress"
          value={loading ? "—" : statistics.inProgress}
          description="Work currently underway"
          iconClass="bg-rw-warning-light text-rw-warning"
        />

        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={loading ? "—" : statistics.resolved}
          description="Assignments marked resolved"
          iconClass="bg-rw-success-light text-rw-success"
        />
      </section>

      {/* Recent assignments */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-rw-navy">
              Recent assignments
            </h2>

            <p className="mt-1 text-sm text-rw-muted">
              Your latest assigned issues.
            </p>
          </div>

          <Link
            to="/officer/assignments"
            className="inline-flex items-center gap-2 self-start text-sm font-semibold text-rw-primary transition hover:text-rw-primary-dark sm:self-auto"
          >
            View all assignments
            <ArrowRight size={16} />
          </Link>
        </div>

        {error && !loading && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-rw-danger/20 bg-rw-danger-light p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-rw-danger"
              />

              <p className="text-sm leading-6 text-rw-danger">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              className="self-start text-sm font-semibold text-rw-danger underline sm:self-auto"
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-xl border border-rw-border bg-white p-5"
              >
                <div className="flex gap-4">
                  <div className="h-11 w-11 rounded-xl bg-rw-surface-muted" />

                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-28 rounded bg-rw-surface-muted" />
                    <div className="h-5 w-2/3 rounded bg-rw-surface-muted" />
                    <div className="h-4 w-full rounded bg-rw-surface-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && assignments.length === 0 && (
          <div className="rounded-2xl border border-rw-border bg-white px-6 py-12 text-center">
            <ClipboardList
              size={30}
              className="mx-auto text-rw-placeholder"
            />

            <h3 className="mt-4 text-lg font-bold text-rw-navy">
              No assignments yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rw-muted">
              When a report is assigned to you, it will appear here.
            </p>
          </div>
        )}

        {!loading && !error && recentAssignments.length > 0 && (
          <div className="space-y-3">
            {recentAssignments.map((assignment, index) => (
              <AssignmentCard
                key={assignment._id || assignment.id || index}
                assignment={assignment}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OfficerDashboard;
