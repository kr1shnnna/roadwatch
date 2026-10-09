
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Clock3,
  FilePlus2,
  MapPin,
  RefreshCw,
  Route,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const statuses = {
  reported: {
    label: "Reported",
    style: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  verified: {
    label: "Verified",
    style: "bg-cyan-50 text-cyan-800 border-cyan-200",
    dot: "bg-cyan-500",
  },
  assigned: {
    label: "Assigned",
    style: "bg-blue-50 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
  },
  accepted: {
    label: "Accepted",
    style: "bg-blue-50 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
  },
  in_progress: {
    label: "In progress",
    style: "bg-orange-50 text-orange-800 border-orange-200",
    dot: "bg-orange-500",
  },
  resolved: {
    label: "Resolved",
    style: "bg-green-50 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  confirmed: {
    label: "Confirmed fixed",
    style: "bg-green-50 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  reopened: {
    label: "Reopened",
    style: "bg-red-50 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
  rejected: {
    label: "Rejected",
    style: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
};

const categories = {
  pothole: { label: "Pothole", icon: TriangleAlert },
  broken_road: { label: "Damaged road", icon: Route },
  streetlight: { label: "Streetlight", icon: Wrench },
  traffic_signal: { label: "Traffic signal", icon: TriangleAlert },
  waterlogging: { label: "Waterlogging", icon: MapPin },
  drainage: { label: "Drainage", icon: MapPin },
  open_manhole: { label: "Open manhole", icon: TriangleAlert },
  road_sign: { label: "Road sign", icon: Route },
  road_debris: { label: "Road debris", icon: Wrench },
  other: { label: "Other civic issue", icon: MapPin },
};

const activeStatuses = new Set([
  "reported",
  "verified",
  "assigned",
  "accepted",
  "in_progress",
  "reopened",
]);

const getReportList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.reports)) return payload.reports;
  if (Array.isArray(payload?.myReports)) return payload.myReports;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.reports)) return payload.data.reports;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

const getStatus = (status) =>
  statuses[status] || {
    label: status
      ? status.replaceAll("_", " ")
      : "Unknown",
    style: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  };

const getCategory = (category) =>
  categories[category] || {
    label: category
      ? category.replaceAll("_", " ")
      : "Civic issue",
    icon: MapPin,
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

  if (report?.location?.type === "Point") {
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
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

/* =========================================================
   CUSTOM NEIGHBOURHOOD ILLUSTRATION
========================================================= */

const NeighborhoodIllustration = () => (
  <div className="relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#F4F0E7]">
    <div className="absolute left-4 top-4 z-10 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-[10px] font-bold tracking-[0.16em] text-rw-navy shadow-sm sm:left-5 sm:top-5">
      YOUR COMMUNITY
    </div>

    <svg
      viewBox="0 0 440 310"
      className="block h-auto w-full"
      role="img"
      aria-label="Illustrated neighborhood with a road, reported problem marker, and repair location"
    >
      <rect width="440" height="310" fill="#F4F0E7" />

      {/* Green spaces */}
      <path
        d="M0 0H115L135 40L92 85L0 70Z"
        fill="#DDE8D1"
      />
      <path
        d="M331 0H440V83L401 96L360 67Z"
        fill="#DDE8D1"
      />
      <path
        d="M0 233L59 218L111 256L100 310H0Z"
        fill="#DDE8D1"
      />

      {/* Park trees */}
      {[
        [25, 25], [55, 42], [85, 23],
        [365, 28], [397, 46], [420, 23],
        [32, 267], [65, 281], [89, 258],
      ].map(([x, y], i) => (
        <g key={`tree-${i}`}>
          <circle cx={x} cy={y} r="9" fill="#B4CDA5" />
          <circle cx={x - 2} cy={y - 2} r="4" fill="#90B884" />
        </g>
      ))}

      {/* Buildings */}
      {[
        [133, 17, 45, 38],
        [190, 17, 54, 48],
        [260, 20, 40, 35],
        [137, 70, 49, 32],
        [203, 80, 40, 31],
        [267, 70, 43, 39],
        [17, 102, 43, 43],
        [72, 113, 34, 29],
        [330, 106, 52, 37],
        [393, 111, 30, 39],
        [143, 245, 48, 37],
        [205, 257, 55, 34],
        [283, 240, 41, 45],
        [345, 250, 49, 35],
      ].map(([x, y, w, h], i) => (
        <g key={`building-${i}`}>
          <rect
            x={x + 3}
            y={y + 3}
            width={w}
            height={h}
            rx="4"
            fill="#CBD5E1"
            opacity="0.65"
          />
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx="4"
            fill={i % 2 === 0 ? "#FFFFFF" : "#E3E7EB"}
            stroke="#CDD4DA"
          />
          <path
            d={`M${x + 9} ${y + 10}h${Math.max(8, w - 18)}`}
            stroke="#D4DBE0"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* Curved road */}
      <path
        d="M-25 220C78 185 119 228 195 204S313 141 465 171"
        fill="none"
        stroke="#CAD0D5"
        strokeWidth="77"
        strokeLinecap="round"
      />
      <path
        d="M-25 220C78 185 119 228 195 204S313 141 465 171"
        fill="none"
        stroke="#66717B"
        strokeWidth="67"
        strokeLinecap="round"
      />

      {/* Road center dashes */}
      <path
        d="M-5 215C75 190 119 224 195 204S313 151 449 170"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeDasharray="10 12"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Pothole */}
      <ellipse
        cx="127"
        cy="211"
        rx="19"
        ry="7"
        fill="#26313A"
      />
      <ellipse
        cx="123"
        cy="209"
        rx="10"
        ry="3"
        fill="#3B4650"
      />

      {/* Orange report pin */}
      <g transform="translate(124 163)">
        <circle r="25" fill="#F97316" opacity="0.14" />
        <circle
          r="18"
          fill="#F97316"
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        <path
          d="M0 -8L7 -5L6 3L0 8L-6 3L-7 -5Z"
          fill="#FFFFFF"
        />
      </g>

      {/* Navy maintenance marker */}
      <g transform="translate(308 162)">
        <circle r="23" fill="#0F172A" opacity="0.12" />
        <circle
          r="17"
          fill="#0F172A"
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        <path
          d="M-7 -2L0 -8L7 -2V7H-7Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M-2 7V1H2V7"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
        />
      </g>

      {/* Orange route */}
      <path
        d="M143 180C177 186 207 190 237 174S281 158 290 160"
        fill="none"
        stroke="#FDBA74"
        strokeWidth="3"
        strokeDasharray="5 6"
        strokeLinecap="round"
      />
    </svg>

    {/* Floating report label */}
    <div className="absolute bottom-4 left-3 flex items-center gap-2 rounded-xl border border-white/70 bg-white/95 px-3 py-2.5 shadow-lg sm:bottom-5 sm:left-5 sm:px-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
        <MapPin size={17} className="text-rw-primary" />
      </span>

      <div>
        <p className="text-[10px] font-medium text-rw-muted">
          Start with a report
        </p>
        <p className="text-xs font-bold text-rw-navy">
          Make the issue visible
        </p>
      </div>
    </div>

    {/* Decorative status */}
    <div className="absolute right-3 top-16 rounded-xl border border-white/70 bg-white/95 px-3 py-2 shadow-sm sm:right-5 sm:top-20">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-[10px] font-semibold text-rw-navy">
          Accountability starts here
        </span>
      </div>
    </div>
  </div>
);

/* =========================================================
   CITIZEN DASHBOARD
========================================================= */

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

        const data = getReportList(response.data);

        const ordered = [...data].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );

        setReports(ordered);
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
    return {
      total: reports.length,
      active: reports.filter((r) =>
        activeStatuses.has(r.status)
      ).length,
      inProgress: reports.filter(
        (r) => r.status === "in_progress"
      ).length,
      resolved: reports.filter((r) =>
        ["resolved", "confirmed"].includes(r.status)
      ).length,
    };
  }, [reports]);

  const recentReports = reports.slice(0, 4);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1450px] space-y-8">

      {/* ================= EDITORIAL WELCOME ================= */}
      <motion.section
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={stagger}
        className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] xl:gap-8"
      >
        <div className="flex min-w-0 flex-col justify-center py-2">
          <motion.p
            variants={fadeUp}
            className="text-xs font-bold uppercase tracking-[0.2em] text-rw-primary"
          >
            YOUR COMMUNITY · YOUR VOICE
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="mt-5 text-4xl font-bold leading-[1.12] tracking-tight text-rw-navy sm:text-5xl"
          >
            {getGreeting()},
            <span className="block text-rw-primary">
              {user?.name?.trim()?.split(/\s+/)[0] || "there"}.
            </span>
            <span className="mt-2 block text-2xl font-semibold leading-snug text-rw-navy sm:text-3xl">
              Let's make our streets better.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-xl text-sm leading-7 text-rw-muted sm:text-base sm:leading-8"
          >
            Your neighbourhood isn't improved by looking away.
            Report what needs fixing, keep track of the response,
            and help make sure the work gets done.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/citizen/report"
              className="group inline-flex items-center gap-2 rounded-xl bg-rw-primary px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rw-primary-dark"
            >
              <FilePlus2 size={18} />
              Report a problem
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

            <Link
              to="/citizen/reports"
              className="inline-flex items-center gap-2 rounded-xl border border-rw-border bg-white px-5 py-3.5 text-sm font-semibold text-rw-navy transition-colors hover:bg-rw-surface-muted"
            >
              My reports
              <ArrowUpRight size={17} />
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-7 flex items-start gap-3 border-l-2 border-rw-primary pl-4"
          >
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0 text-rw-success"
            />

            <p className="max-w-lg text-xs leading-6 text-rw-muted sm:text-sm">
              Keep each report specific. A clear description,
              accurate location, and useful photos help the
              responsible team understand the problem.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={
            reduceMotion ? false : { opacity: 0, x: 24 }
          }
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.65,
            delay: reduceMotion ? 0 : 0.12,
            ease: "easeOut",
          }}
          className="min-w-0"
        >
          <NeighborhoodIllustration />
        </motion.div>
      </motion.section>

      {/* ================= REPORT SNAPSHOT ================= */}
      <section className="overflow-hidden rounded-2xl border border-rw-border bg-white">
        <div className="flex flex-col gap-1 border-b border-rw-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="text-sm font-bold text-rw-navy">
            Your reporting snapshot
          </h2>
          <p className="text-xs text-rw-muted">
            Based on your submitted reports
          </p>
        </div>

        {error ? (
          <div className="flex flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm leading-6 text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setRetryKey((n) => n + 1)}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-rw-border px-3 py-2 text-sm font-semibold text-rw-navy hover:bg-rw-surface-muted"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {[
              {
                label: "Total reports",
                value: stats.total,
                note: "Submitted by you",
              },
              {
                label: "Active issues",
                value: stats.active,
                note: "Still need attention",
              },
              {
                label: "Work in progress",
                value: stats.inProgress,
                note: "Currently underway",
              },
              {
                label: "Resolved",
                value: stats.resolved,
                note: "Marked resolved",
              },
            ].map((item, index) => (
              <div
                key={item.label}
                className={`px-5 py-5 sm:px-6 sm:py-6 ${
                  index % 2 === 1 ? "border-l border-rw-border" : ""
                } ${
                  index > 1 ? "border-t border-rw-border sm:border-t-0" : ""
                } ${
                  index === 2 ? "sm:border-l" : ""
                }`}
              >
                <p className="text-xs font-medium text-rw-muted sm:text-sm">
                  {item.label}
                </p>

                <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-rw-navy sm:text-4xl">
                  {loading ? "—" : item.value}
                </p>

                <p className="mt-2 text-[11px] leading-5 text-rw-muted sm:text-xs">
                  {loading ? "Loading report data" : item.note}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= REPORTS + GUIDANCE ================= */}
      <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">

        {/* Recent reports */}
        <section className="min-w-0">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-rw-primary">
                KEEP TRACK
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-rw-navy">
                Your recent reports
              </h2>

              <p className="mt-2 text-sm leading-6 text-rw-muted">
                The latest issues you've brought to attention.
              </p>
            </div>

            <Link
              to="/citizen/reports"
              className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-rw-primary hover:text-rw-primary-dark sm:inline-flex"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="mt-5 space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse gap-4 rounded-2xl border border-rw-border bg-white p-5"
                >
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                    <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="mt-5 rounded-2xl border border-rw-border bg-white p-6">
              <p className="text-sm leading-6 text-rw-muted">
                Your reports will appear here when the data
                is available.
              </p>

              <button
                type="button"
                onClick={() => setRetryKey((n) => n + 1)}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-rw-primary"
              >
                <RefreshCw size={15} />
                Reload reports
              </button>
            </div>
          ) : recentReports.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-rw-border bg-white px-6 py-10 text-center sm:px-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                <MapPin className="h-7 w-7 text-rw-primary" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-rw-navy">
                Your first report starts here.
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-rw-muted">
                Spotted a pothole, a broken streetlight,
                or another problem? Put it on the record.
              </p>

              <Link
                to="/citizen/report"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rw-primary px-5 py-3 text-sm font-semibold text-white hover:bg-rw-primary-dark"
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
                  <motion.article
                    key={report._id || report.id}
                    variants={fadeUp}
                    className={`flex min-w-0 flex-col gap-4 p-5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
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
                        <h3 className="break-words font-semibold text-rw-navy">
                          {report.title || category.label}
                        </h3>

                        <p className="mt-1 text-xs text-rw-muted">
                          {category.label}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-rw-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={14} />
                            {getLocationText(report)}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 size={14} />
                            {formatDate(report.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.style}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>

                      <Link
                        to="/citizen/reports"
                        aria-label={`View reports, including ${report.title || category.label}`}
                        className="rounded-lg p-2 text-rw-muted hover:bg-orange-50 hover:text-rw-primary"
                      >
                        <ArrowUpRight size={18} />
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          )}

          <Link
            to="/citizen/reports"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-rw-primary sm:hidden"
          >
            View all reports
            <ArrowRight size={16} />
          </Link>
        </section>

        {/* A helpful reporting panel rather than another statistics card */}
        <aside className="min-w-0">
          <div className="rounded-2xl bg-rw-navy p-6 text-white sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rw-primary/15">
              <FilePlus2 className="h-6 w-6 text-orange-400" />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.17em] text-orange-300">
              Make your report count
            </p>

            <h2 className="mt-3 text-2xl font-bold leading-snug">
              Help the right team understand the problem.
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              A useful report gives the maintenance team enough
              information to understand what happened and where
              they need to respond.
            </p>

            <div className="mt-7 space-y-5">
              {[
                {
                  icon: MapPin,
                  title: "Pinpoint the location",
                  text: "Choose the location as accurately as possible.",
                },
                {
                  icon: Camera,
                  title: "Show what's wrong",
                  text: "Add clear photos when you can do so safely.",
                },
                {
                  icon: CheckCircle2,
                  title: "Follow the outcome",
                  text: "Check updates and confirm the repair when appropriate.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <Icon
                    size={19}
                    className="mt-0.5 shrink-0 text-orange-400"
                  />

                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/citizen/report"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rw-primary px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-rw-primary-dark"
            >
              Start a report
              <ArrowRight size={17} />
            </Link>
          </div>

          {/* Reporting philosophy */}
          <div className="mt-4 rounded-2xl border border-rw-border bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-rw-success" />
              </div>

              <div>
                <h3 className="font-semibold text-rw-navy">
                  Report. Resolve. Verify.
                </h3>
                <p className="mt-2 text-sm leading-6 text-rw-muted">
                  The goal isn't just to record a problem. It's to
                  make progress visible and help ensure the issue
                  has actually been fixed.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CitizenDashboard;

