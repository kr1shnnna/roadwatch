import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import {

  Activity,

  AlertCircle,

  ArrowRight,

  CalendarDays,

  CheckCircle2,

  Clock3,

  FileText,

  Image as ImageIcon,

  MapPin,

  Plus,

  RefreshCw,

  Search,


} from "lucide-react";

import api from "../../services/api";

const STATUS_META = {

  reported: {

    label: "Reported",

    className: "bg-rw-primary-light text-rw-primary",

  },

  verified: {

    label: "Verified",

    className: "bg-rw-info-light text-rw-info",

  },

  assigned: {

    label: "Assigned",

    className: "bg-rw-info-light text-rw-info",

  },

  accepted: {

    label: "Accepted",

    className: "bg-rw-info-light text-rw-info",

  },

  in_progress: {

    label: "In progress",

    className: "bg-rw-warning-light text-rw-warning",

  },

  resolved: {

    label: "Awaiting verification",

    className: "bg-rw-success-light text-rw-success",

  },

  confirmed: {

    label: "Confirmed resolved",

    className: "bg-rw-success-light text-rw-success",

  },

  reopened: {

    label: "Reopened",

    className: "bg-rw-warning-light text-rw-warning",

  },

  rejected: {

    label: "Rejected",

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

const FILTERS = [

  { value: "all", label: "All reports" },

  { value: "active", label: "Needs attention" },

  { value: "in_progress", label: "In progress" },

  { value: "resolved", label: "Resolved" },

  { value: "reopened", label: "Reopened" },

  { value: "rejected", label: "Rejected" },

];

const ACTIVE_STATUSES = [

  "reported",

  "verified",

  "assigned",

  "reopened",

];

const IN_PROGRESS_STATUSES = ["accepted", "in_progress"];

const RESOLVED_STATUSES = ["resolved", "confirmed"];

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

const formatCategory = (category) =>

  CATEGORY_LABELS[category] ||

  category?.replaceAll("_", " ") ||

  "Other issue";

const getStatus = (status) =>

  STATUS_META[status] || {

    label: status?.replaceAll("_", " ") || "Unknown",

    className: "bg-rw-surface-muted text-rw-muted",

  };

const formatLocation = (location) => {

  const coordinates = location?.coordinates;

  if (

    location?.type !== "Point" ||

    !Array.isArray(coordinates) ||

    coordinates.length !== 2

  ) {

    return "Location recorded";

  }

  const [longitude, latitude] = coordinates;

  if (

    !Number.isFinite(Number(longitude)) ||

    !Number.isFinite(Number(latitude))

  ) {

    return "Location recorded";

  }

  return `Lat ${Number(latitude).toFixed(4)}, Lng ${Number(longitude).toFixed(4)}`;

};

const StatCard = ({ icon: Icon, label, value, description, iconClass }) => (

  <div className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm">

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

const ReportCard = ({ report }) => {

  const status = getStatus(report.status);

  const reportId = report._id || report.id;

  const reference = reportId

    ? String(reportId).slice(-8).toUpperCase()

    : "N/A";

  const imageUrl = report.evidenceImages?.[0]?.url;

  const priority = report.priority || "medium";

  const priorityClasses = {

    low: "text-rw-muted",

    medium: "text-rw-info",

    high: "text-rw-warning",

    critical: "text-rw-danger",

  };

  return (

    <article className="rounded-2xl border border-rw-border bg-white p-4 shadow-sm transition hover:border-rw-border-dark hover:shadow-md sm:p-5">

      <div className="flex flex-col gap-4 sm:flex-row">

        {/* Photo or fallback illustration */}

        <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-rw-surface-muted sm:h-28 sm:w-32">

          {imageUrl ? (

            <img

              src={imageUrl}

              alt={`Evidence for ${report.title}`}

              loading="lazy"

              className="h-full w-full object-cover"

            />

          ) : (

            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-rw-placeholder">

              <ImageIcon size={26} />

              <span className="text-xs">No photo attached</span>

            </div>

          )}

        </div>

        {/* Report information */}

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <span

              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}

            >

              {status.label}

            </span>

            <span className="text-xs text-rw-muted">

              Ref. #{reference}

            </span>

          </div>

          <h3 className="mt-3 break-words text-lg font-bold text-rw-navy">

            {report.title || "Untitled report"}

          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-rw-muted">

            {report.description || "No description provided."}

          </p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-xs text-rw-muted">

            <span className="inline-flex items-center gap-1.5">

              <FileText size={15} />

              {formatCategory(report.category)}

            </span>

            <span className="inline-flex items-center gap-1.5">

              <CalendarDays size={15} />

              {formatDate(report.createdAt)}

            </span>

            <span className="inline-flex items-center gap-1.5">

              <MapPin size={15} />

              {formatLocation(report.location)}

            </span>

          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rw-border pt-3">

            <span className="text-xs text-rw-muted">

              Priority:{" "}

              <span

                className={`font-semibold capitalize ${

                  priorityClasses[priority] || "text-rw-muted"

                }`}

              >

                {priority}

              </span>

            </span>

            {report.evidenceImages?.length > 0 && (

              <span className="inline-flex items-center gap-1.5 text-xs text-rw-muted">

                <ImageIcon size={14} />

                {report.evidenceImages.length}{" "}

                {report.evidenceImages.length === 1 ? "photo" : "photos"}

              </span>

            )}

          </div>

        </div>

      </div>

        {reportId && (
          <div className="mt-4 flex justify-end border-t border-rw-border pt-3">
            <Link
              to={`/citizen/reports/${reportId}`}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rw-primary transition hover:bg-rw-primary-light"
            >
              View report details
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

    </article>

  );

};

const ReportSkeleton = () => (

  <div className="animate-pulse rounded-2xl border border-rw-border bg-white p-5">

    <div className="flex gap-4">

      <div className="h-28 w-28 shrink-0 rounded-xl bg-rw-surface-muted" />

      <div className="flex-1 space-y-3">

        <div className="h-4 w-28 rounded bg-rw-surface-muted" />

        <div className="h-5 w-3/4 rounded bg-rw-surface-muted" />

        <div className="h-4 w-full rounded bg-rw-surface-muted" />

        <div className="h-4 w-1/2 rounded bg-rw-surface-muted" />

      </div>

    </div>

  </div>

);

const MyReports = () => {

  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {

    let cancelled = false;

    const fetchReports = async () => {

      setLoading(true);

      setError("");

      try {

        const response = await api.get("/reports/my");

        if (cancelled) return;

        const fetchedReports = response.data?.reports;

        setReports(

          Array.isArray(fetchedReports) ? fetchedReports : []

        );

      } catch (requestError) {

        if (cancelled) return;

        setError(

          requestError.response?.data?.message ||

            requestError.message ||

            "Unable to load your reports. Please try again."

        );

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    };

    fetchReports();

    return () => {

      cancelled = true;

    };

  }, [reloadKey]);

  const statistics = useMemo(() => {

    return {

      total: reports.length,

      active: reports.filter((report) =>

        ACTIVE_STATUSES.includes(report.status)

      ).length,

      inProgress: reports.filter((report) =>

        IN_PROGRESS_STATUSES.includes(report.status)

      ).length,

      resolved: reports.filter((report) =>

        RESOLVED_STATUSES.includes(report.status)

      ).length,

    };

  }, [reports]);

  const filteredReports = useMemo(() => {

    const query = search.trim().toLowerCase();

    return reports.filter((report) => {

      const status = report.status || "";

      const category = formatCategory(report.category);

      const reference = report._id || report.id || "";

      const matchesSearch =

        !query ||

        [

          report.title,

          report.description,

          category,

          status.replaceAll("_", " "),

          reference,

        ].some((value) =>

          String(value || "").toLowerCase().includes(query)

        );

      let matchesFilter = true;

      if (activeFilter === "active") {

        matchesFilter = ACTIVE_STATUSES.includes(status);

      } else if (activeFilter === "in_progress") {

        matchesFilter = IN_PROGRESS_STATUSES.includes(status);

      } else if (activeFilter === "resolved") {

        matchesFilter = RESOLVED_STATUSES.includes(status);

      } else if (activeFilter === "reopened") {

        matchesFilter = status === "reopened";

      } else if (activeFilter === "rejected") {

        matchesFilter = status === "rejected";

      }

      return matchesSearch && matchesFilter;

    });

  }, [reports, search, activeFilter]);

  return (

    <div className="mx-auto max-w-7xl space-y-7">

      {/* Page header */}

      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <Link

            to="/citizen"

            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-rw-muted transition hover:text-rw-primary"

          >

            <ArrowRight size={16} className="rotate-180" />

            Back to overview

          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rw-primary">

            Your reporting history

          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-rw-navy sm:text-4xl">

            My reports

          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-rw-muted sm:text-base">

            Every issue you've raised, together in one place. Follow its

            progress from your first report through to resolution.

          </p>

        </div>

        <Link

          to="/citizen/report"

          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-rw-primary px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-rw-primary-dark hover:shadow-md"

        >

          <Plus size={19} />

          Report a problem

        </Link>

      </header>

      {/* Live statistics */}

      <section

        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"

        aria-label="Report statistics"

      >

        <StatCard

          icon={FileText}

          label="Total reports"

          value={loading ? "—" : statistics.total}

          description="All issues you've submitted"

          iconClass="bg-rw-primary-light text-rw-primary"

        />

        <StatCard

          icon={Activity}

          label="Needs attention"

          value={loading ? "—" : statistics.active}

          description="Reported, verified, assigned, or reopened"

          iconClass="bg-rw-info-light text-rw-info"

        />

        <StatCard

          icon={Clock3}

          label="In progress"

          value={loading ? "—" : statistics.inProgress}

          description="Accepted or currently being worked on"

          iconClass="bg-rw-warning-light text-rw-warning"

        />

        <StatCard

          icon={CheckCircle2}

          label="Resolved"

          value={loading ? "—" : statistics.resolved}

          description="Resolved or confirmed by you"

          iconClass="bg-rw-success-light text-rw-success"

        />

      </section>

      {/* Search and filters */}

      <section className="rounded-2xl border border-rw-border bg-white p-4 shadow-sm sm:p-5">

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

          <div className="relative w-full xl:max-w-md">

            <Search

              size={19}

              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rw-muted"

            />

            <input

              type="search"

              value={search}

              onChange={(event) => setSearch(event.target.value)}

              placeholder="Search reports, categories or reference..."

              aria-label="Search your reports"

              className="w-full rounded-xl border border-rw-border bg-rw-background py-3 pl-11 pr-4 text-sm text-rw-text outline-none transition placeholder:text-rw-placeholder focus:border-rw-primary focus:ring-4 focus:ring-orange-100"

            />

          </div>

          <div className="flex flex-wrap gap-2" aria-label="Filter reports">

            {FILTERS.map((filter) => {

              const selected = activeFilter === filter.value;

              return (

                <button

                  key={filter.value}

                  type="button"

                  onClick={() => setActiveFilter(filter.value)}

                  aria-pressed={selected}

                  className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${

                    selected

                      ? "bg-rw-navy text-white"

                      : "bg-rw-surface-muted text-rw-text-secondary hover:bg-rw-border"

                  }`}

                >

                  {filter.label}

                </button>

              );

            })}

          </div>

        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-rw-border pt-4">

          <p className="text-sm text-rw-muted">

            {loading

              ? "Loading reports..."

              : `Showing ${filteredReports.length} of ${reports.length} ${

                  reports.length === 1 ? "report" : "reports"

                }`}

          </p>

          <button

            type="button"

            onClick={() => setReloadKey((current) => current + 1)}

            disabled={loading}

            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rw-muted transition hover:bg-rw-surface-muted hover:text-rw-navy disabled:opacity-50"

          >

            <RefreshCw

              size={16}

              className={loading ? "animate-spin" : ""}

            />

            Refresh

          </button>

        </div>

      </section>

      {/* Error state */}

      {error && !loading && (

        <div

          role="alert"

          className="flex flex-col gap-4 rounded-2xl border border-rw-danger/20 bg-rw-danger-light p-5 sm:flex-row sm:items-center"

        >

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-rw-danger">

            <AlertCircle size={22} />

          </div>

          <div className="flex-1">

            <h2 className="font-bold text-rw-danger">

              Couldn't load your reports

            </h2>

            <p className="mt-1 break-words text-sm leading-6 text-rw-danger">

              {error}

            </p>

          </div>

          <button

            type="button"

            onClick={() => setReloadKey((current) => current + 1)}

            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rw-danger/20 bg-white px-4 py-2.5 text-sm font-semibold text-rw-danger transition hover:bg-rw-danger-light"

          >

            <RefreshCw size={16} />

            Try again

          </button>

        </div>

      )}

      {/* Loading state */}

      {loading && (

        <div className="space-y-4" aria-label="Loading reports">

          <ReportSkeleton />

          <ReportSkeleton />

          <ReportSkeleton />

        </div>

      )}

      {/* First-time empty state */}

      {!loading && !error && reports.length === 0 && (

        <section className="rounded-2xl border border-rw-border bg-white px-6 py-14 text-center shadow-sm sm:py-20">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rw-primary-light text-rw-primary">

            <FileText size={30} />

          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-rw-primary">

            A better neighbourhood starts here

          </p>

          <h2 className="mt-3 text-2xl font-bold text-rw-navy">

            No reports yet

          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-rw-muted">

            Spot a pothole, broken streetlight, or another local problem?

            Submit your first report and follow what happens next.

          </p>

          <Link

            to="/citizen/report"

            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-rw-primary px-5 py-3 font-semibold text-white transition hover:bg-rw-primary-dark"

          >

            <Plus size={18} />

            Report your first issue

            <ArrowRight size={18} />

          </Link>

        </section>

      )}

      {/* No search/filter results */}

      {!loading && !error && reports.length > 0 && filteredReports.length === 0 && (

        <section className="rounded-2xl border border-rw-border bg-white px-6 py-12 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rw-surface-muted text-rw-muted">

            <Search size={25} />

          </div>

          <h2 className="mt-4 text-xl font-bold text-rw-navy">

            No matching reports

          </h2>

          <p className="mt-2 text-sm leading-6 text-rw-muted">

            Try another search term or choose a different status filter.

          </p>

          <button

            type="button"

            onClick={() => {

              setSearch("");

              setActiveFilter("all");

            }}

            className="mt-5 rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-rw-navy transition hover:bg-rw-surface-muted"

          >

            Clear filters

          </button>

        </section>

      )}

      {/* Reports list */}

      {!loading && !error && filteredReports.length > 0 && (

        <section className="space-y-4" aria-label="Your reports">

          {filteredReports.map((report) => (

            <ReportCard key={report._id || report.id} report={report} />

          ))}

        </section>

      )}

      {/* Workflow note */}

      {!loading && !error && reports.length > 0 && (

        <div className="flex items-start gap-3 rounded-2xl border border-rw-border bg-white p-5">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rw-success-light text-rw-success">

            <CheckCircle2 size={20} />

          </div>

          <div>

            <h2 className="font-bold text-rw-navy">

              Report. Resolve. Verify.

            </h2>

            <p className="mt-1 text-sm leading-6 text-rw-muted">

              When an issue is marked resolved, review the outcome and confirm

              the fix—or reopen the report if the problem remains.

            </p>

          </div>

        </div>

      )}

    </div>

  );

};

export default MyReports;
