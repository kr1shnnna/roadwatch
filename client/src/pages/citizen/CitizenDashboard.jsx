
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Construction,
  FilePlus2,
  Lightbulb,
  MapPin,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Wrench,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const statusConfig = {
  reported: {
    label: "Reported",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  verified: {
    label: "Verified",
    classes: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  assigned: {
    label: "Assigned",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  accepted: {
    label: "Accepted",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  in_progress: {
    label: "In progress",
    classes: "bg-orange-50 text-orange-700 border-orange-200",
  },
  resolved: {
    label: "Resolved",
    classes: "bg-green-50 text-green-700 border-green-200",
  },
  confirmed: {
    label: "Confirmed fixed",
    classes: "bg-green-50 text-green-700 border-green-200",
  },
  reopened: {
    label: "Reopened",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const categoryConfig = {
  pothole: {
    label: "Pothole",
    icon: AlertCircle,
  },
  broken_road: {
    label: "Damaged road",
    icon: Construction,
  },
  streetlight: {
    label: "Streetlight",
    icon: Lightbulb,
  },
  traffic_signal: {
    label: "Traffic signal",
    icon: AlertCircle,
  },
  waterlogging: {
    label: "Waterlogging",
    icon: MapPin,
  },
  drainage: {
    label: "Drainage",
    icon: MapPin,
  },
  open_manhole: {
    label: "Open manhole",
    icon: ShieldAlert,
  },
  road_sign: {
    label: "Road sign",
    icon: AlertCircle,
  },
  road_debris: {
    label: "Road debris",
    icon: Wrench,
  },
  other: {
    label: "Other civic issue",
    icon: Construction,
  },
};

const getReportList = (payload) => {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.reports)) {
    return payload.reports;
  }

  if (Array.isArray(payload?.data?.reports)) {
    return payload.data.reports;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const getStatus = (status) =>
  statusConfig[status] || {
    label: status
      ? status.replaceAll("_", " ")
      : "Unknown",
    classes: "bg-slate-100 text-slate-600 border-slate-200",
  };

const getCategory = (category) =>
  categoryConfig[category] || {
    label: category
      ? category.replaceAll("_", " ")
      : "Civic issue",
    icon: Construction,
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

const getLocationText = (report) => {
  if (typeof report?.locationName === "string") {
    return report.locationName;
  }

  if (typeof report?.address === "string") {
    return report.address;
  }

  if (
    report?.location?.type === "Point" &&
    Array.isArray(report.location.coordinates)
  ) {
    return "Location attached";
  }

  return "Location unavailable";
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
    },
  },
};

const CitizenDashboard = () => {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchReports = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/reports/my");

        if (!active) return;

        const reportList = getReportList(response.data);

        const sortedReports = [...reportList].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );

        setReports(sortedReports);
      } catch (err) {
        if (!active) return;

        setError(
          err?.response?.data?.message ||
            "We couldn't load your reports. Please try again."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchReports();

    return () => {
      active = false;
    };
  }, [retryKey]);

  const stats = useMemo(() => {
    const needsAttention = new Set([
      "reported",
      "verified",
      "assigned",
      "accepted",
      "reopened",
    ]);

    return [
      {
        label: "Total reports",
        value: reports.length,
        icon: ClipboardList,
        color: "bg-blue-50 text-blue-700",
        description: "Issues you've reported",
      },
      {
        label: "Needs attention",
        value: reports.filter((report) =>
          needsAttention.has(report.status)
        ).length,
        icon: AlertCircle,
        color: "bg-amber-50 text-amber-700",
        description: "Awaiting further action",
      },
      {
        label: "In progress",
        value: reports.filter(
          (report) => report.status === "in_progress"
        ).length,
        icon: Clock3,
        color: "bg-orange-50 text-orange-700",
        description: "Work currently underway",
      },
      {
        label: "Resolved",
        value: reports.filter((report) =>
          ["resolved", "confirmed"].includes(report.status)
        ).length,
        icon: CheckCircle2,
        color: "bg-green-50 text-green-700",
        description: "Issues marked resolved",
      },
    ];
  }, [reports]);

  const recentReports = reports.slice(0, 4);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">

      {/* ================= WELCOME BANNER ================= */}
      <motion.section
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={stagger}
        className="relative overflow-hidden rounded-2xl bg-rw-navy p-6 text-white shadow-sm sm:p-8 lg:p-10"
      >
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-rw-primary/15" />
        <div className="pointer-events-none absolute -bottom-28 right-40 h-56 w-56 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col justify-between gap-7 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <motion.div
              variants={fadeUp}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200"
            >
              <span className="h-2 w-2 rounded-full bg-rw-primary" />
              Your community workspace
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {getGreeting()},{" "}
              <span className="text-orange-400">
                {user?.name?.trim()?.split(/\s+/)[0] || "there"}
              </span>
              .
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base"
            >
              Every report is a step toward a better neighbourhood.
              Track your reports, follow progress, and help verify
              when a problem has been fixed.
            </motion.p>

            <motion.div variants={fadeUp}>
              <Link
                to="/citizen/report"
                className="group mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-rw-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-rw-primary-dark"
              >
                <FilePlus2 size={19} />
                Report a Problem
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            className="hidden shrink-0 items-center justify-center md:flex"
          >
            <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rw-primary/15">
                <Construction
                  size={40}
                  className="text-orange-400"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ================= REPORT STATISTICS ================= */}
      <section className="mt-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-rw-navy sm:text-xl">
              Your reports at a glance
            </h2>
            <p className="mt-1 text-sm text-rw-muted">
              A summary of your submitted issues.
            </p>
          </div>

          <TrendingUp
            size={22}
            className="shrink-0 text-rw-primary"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-rw-border bg-white p-5"
              >
                <div className="h-11 w-11 rounded-xl bg-slate-100" />
                <div className="mt-5 h-4 w-2/3 rounded bg-slate-100" />
                <div className="mt-3 h-8 w-1/3 rounded bg-slate-100" />
                <div className="mt-3 h-3 w-4/5 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">
                    Unable to load your report data
                  </p>
                  <p className="mt-1 text-sm leading-6 text-red-700">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRetryKey((key) => key + 1)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            variants={stagger}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <motion.article
                  key={stat.label}
                  variants={fadeUp}
                  whileHover={
                    reduceMotion ? undefined : { y: -4 }
                  }
                  className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}
                    >
                      <Icon size={21} />
                    </div>

                    <span className="text-3xl font-bold tabular-nums text-rw-navy">
                      {stat.value}
                    </span>
                  </div>

                  <h3 className="mt-5 font-semibold text-rw-text">
                    {stat.label}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-rw-muted">
                    {stat.description}
                  </p>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* ================= RECENT REPORTS ================= */}
      <section className="mt-10">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-bold text-rw-navy sm:text-xl">
              Recent reports
            </h2>
            <p className="mt-1 text-sm text-rw-muted">
              Keep an eye on the latest issues you've submitted.
            </p>
          </div>

          <Link
            to="/citizen/reports"
            className="inline-flex items-center gap-1 text-sm font-semibold text-rw-primary transition-colors hover:text-rw-primary-dark"
          >
            View all reports
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="mt-5 animate-pulse rounded-2xl border border-rw-border bg-white p-6">
            <div className="h-5 w-48 rounded bg-slate-100" />
            <div className="mt-4 h-14 rounded-xl bg-slate-100" />
            <div className="mt-3 h-14 rounded-xl bg-slate-100" />
          </div>
        ) : error ? (
          <div className="mt-5 rounded-2xl border border-rw-border bg-white p-6">
            <p className="text-sm leading-6 text-rw-muted">
              Recent reports are unavailable until your report data
              can be loaded successfully.
            </p>
          </div>
        ) : recentReports.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-rw-border bg-white px-5 py-12 text-center sm:px-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
              <ClipboardList className="h-7 w-7 text-rw-primary" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-rw-navy">
              No reports yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rw-muted">
              Have you spotted a pothole, a broken streetlight,
              or another issue? Start by reporting it to RoadWatch.
            </p>

            <Link
              to="/citizen/report"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rw-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rw-primary-dark"
            >
              <FilePlus2 size={17} />
              Create your first report
            </Link>
          </div>
        ) : (
          <motion.div
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            variants={stagger}
            className="mt-5 overflow-hidden rounded-2xl border border-rw-border bg-white"
          >
            {recentReports.map((report, index) => {
              const category = getCategory(report.category);
              const Icon = category.icon;
              const status = getStatus(report.status);

              return (
                <motion.div
                  key={report._id || report.id}
                  variants={fadeUp}
                  className={`flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
                    index !== recentReports.length - 1
                      ? "border-b border-rw-border"
                      : ""
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                      <Icon className="h-6 w-6 text-rw-primary" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-rw-navy">
                        {report.title || category.label}
                      </h3>

                      <p className="mt-1 text-xs font-medium capitalize text-rw-muted">
                        {category.label}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-rw-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} />
                          {getLocationText(report)}
                        </span>

                        <span>
                          {formatDate(report.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${status.classes}`}
                    >
                      {status.label}
                    </span>

                    <Link
                      to="/citizen/reports"
                      aria-label={`View your reports, including ${report.title || category.label}`}
                      className="rounded-lg p-2 text-rw-muted transition-colors hover:bg-orange-50 hover:text-rw-primary"
                    >
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* ================= BOTTOM COMMUNITY NOTE ================= */}
      <section className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
            <Construction className="h-5 w-5 text-rw-primary" />
          </div>

          <div>
            <h3 className="font-semibold text-rw-navy">
              Every report makes a difference.
            </h3>
            <p className="mt-1 text-sm leading-6 text-rw-muted">
              Keep your descriptions clear, include the correct
              location, and add relevant photos whenever possible.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CitizenDashboard;

