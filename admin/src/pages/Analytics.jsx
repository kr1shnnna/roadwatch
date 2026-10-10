import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";

const STATUS_META = [
  { key: "reported", label: "Reported", color: "#64748b" },
  { key: "verified", label: "Verified", color: "#0891b2" },
  { key: "assigned", label: "Assigned", color: "#2563eb" },
  { key: "accepted", label: "Accepted", color: "#0284c7" },
  { key: "in_progress", label: "In progress", color: "#f97316" },
  { key: "resolved", label: "Resolved", color: "#d97706" },
  { key: "confirmed", label: "Confirmed", color: "#16a34a" },
  { key: "reopened", label: "Reopened", color: "#dc2626" },
  { key: "rejected", label: "Rejected", color: "#475569" },
];

const CATEGORY_META = [
  { key: "pothole", label: "Pothole" },
  { key: "broken_road", label: "Broken road" },
  { key: "streetlight", label: "Streetlight" },
  { key: "traffic_signal", label: "Traffic signal" },
  { key: "waterlogging", label: "Waterlogging" },
  { key: "open_manhole", label: "Open manhole" },
  { key: "road_sign", label: "Road sign" },
  { key: "road_debris", label: "Road debris" },
  { key: "drainage", label: "Drainage" },
  { key: "other", label: "Other" },
];

const PRIORITY_META = [
  { key: "critical", label: "Critical", color: "#dc2626" },
  { key: "high", label: "High", color: "#f97316" },
  { key: "medium", label: "Medium", color: "#2563eb" },
  { key: "low", label: "Low", color: "#64748b" },
];

const PERIOD_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
];

const GROUP_OPTIONS = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

const formatLabel = (value) =>
  String(value || "Unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatHours = (value) => {
  const hours = Number(value) || 0;
  if (hours >= 24) {
    const days = hours / 24;
    return `${days.toLocaleString("en-IN", { maximumFractionDigits: 1 })} days`;
  }
  return `${hours.toLocaleString("en-IN", { maximumFractionDigits: 1 })} hrs`;
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Unable to load this analytics section.";

const Panel = ({ title, description, action, children, className = "" }) => (
  <section className={`rounded-2xl border border-rw-border bg-white shadow-sm ${className}`}>
    <div className="flex flex-col gap-2 border-b border-rw-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
      <div>
        <h2 className="text-base font-bold text-rw-navy">{title}</h2>
        {description && <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

const StatCard = ({ label, value, helper, accent = "border-t-rw-navy" }) => (
  <div className={`rounded-2xl border border-rw-border border-t-4 ${accent} bg-white p-5 shadow-sm`}>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-rw-navy">{value}</p>
    {helper && <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>}
  </div>
);

const EmptyState = ({ children = "There is no data to display for this selection." }) => (
  <div className="rounded-xl border border-dashed border-rw-border-dark px-5 py-10 text-center text-sm leading-6 text-slate-500">
    {children}
  </div>
);

const BarRow = ({ label, value, total, color = "#f97316" }) => {
  const count = Number(value) || 0;
  const percent = total > 0 ? Math.min(100, (count / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm text-slate-700">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-rw-navy">{count.toLocaleString("en-IN")}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const TrendChart = ({ trends }) => {
  const chart = useMemo(() => {
    if (!Array.isArray(trends) || trends.length === 0) return null;

    const width = 720;
    const height = 260;
    const left = 38;
    const right = 16;
    const top = 18;
    const bottom = 42;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const maxValue = Math.max(
      1,
      ...trends.map((item) => Number(item.totalReports) || 0),
      ...trends.map((item) => Number(item.resolvedReports) || 0),
    );
    const pointX = (index) =>
      trends.length === 1
        ? left + plotWidth / 2
        : left + (index / (trends.length - 1)) * plotWidth;
    const pointY = (value) => top + plotHeight - ((Number(value) || 0) / maxValue) * plotHeight;
    const totalPoints = trends
      .map((item, index) => `${pointX(index)},${pointY(item.totalReports)}`)
      .join(" ");
    const resolvedPoints = trends
      .map((item, index) => `${pointX(index)},${pointY(item.resolvedReports)}`)
      .join(" ");

    const labelIndexes = [...new Set([0, Math.floor((trends.length - 1) / 2), trends.length - 1])];

    return {
      width,
      height,
      left,
      top,
      plotWidth,
      plotHeight,
      maxValue,
      pointX,
      pointY,
      totalPoints,
      resolvedPoints,
      labelIndexes,
    };
  }, [trends]);

  if (!chart) return <EmptyState>No reports were recorded during this period.</EmptyState>;

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((fraction) => Math.round(chart.maxValue * fraction));
  const formatPeriod = (period) => {
    if (!period) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
      const date = new Date(`${period}T12:00:00`);
      return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(date);
    }
    return period;
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-600">
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Reports created</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-green-600" /> Resolved or confirmed</span>
      </div>
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Report creation and resolution trends" className="h-auto w-full">
          {gridValues.map((value, index) => {
            const y = chart.top + chart.plotHeight - (index / 4) * chart.plotHeight;
            return (
              <g key={`${value}-${index}`}>
                <line x1={chart.left} y1={y} x2={chart.width - 16} y2={y} stroke="#e2e8f0" strokeDasharray="3 5" />
                <text x={chart.left - 9} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">{value}</text>
              </g>
            );
          })}
          <polyline points={chart.totalPoints} fill="none" stroke="#f97316" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={chart.resolvedPoints} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {trends.map((item, index) => (
            <g key={item.period || index}>
              <circle cx={chart.pointX(index)} cy={chart.pointY(item.totalReports)} r="3.2" fill="#f97316" />
              <circle cx={chart.pointX(index)} cy={chart.pointY(item.resolvedReports)} r="3.2" fill="#16a34a" />
            </g>
          ))}
          {chart.labelIndexes.map((index) => (
            <text key={trends[index]?.period || index} x={chart.pointX(index)} y={chart.height - 12} textAnchor={index === 0 ? "start" : index === trends.length - 1 ? "end" : "middle"} fontSize="11" fill="#64748b">
              {formatPeriod(trends[index]?.period)}
            </text>
          ))}
        </svg>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">Trend values are grouped by the selected interval. The resolved series shows reports created during each period that currently have a resolved or confirmed status.</p>
    </div>
  );
};

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [trends, setTrends] = useState([]);
  const [period, setPeriod] = useState("30d");
  const [groupBy, setGroupBy] = useState("day");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [overviewResponse, officersResponse, departmentsResponse, trendsResponse, serviceAreasResponse] = await Promise.all([
        api.get("/admin/analytics/overview"),
        api.get("/admin/analytics/officers"),
        api.get("/admin/analytics/departments"),
        api.get("/admin/analytics/trends", { params: { period, groupBy } }),
        api.get("/admin/analytics/service-areas"),
      ]);

      setOverview(overviewResponse.data || null);
      setOfficers(Array.isArray(officersResponse.data?.officers) ? officersResponse.data.officers : []);
      setDepartments(Array.isArray(departmentsResponse.data?.departments) ? departmentsResponse.data.departments : []);
      setTrends(Array.isArray(trendsResponse.data?.trends) ? trendsResponse.data.trends : []);
      setServiceAreas(Array.isArray(serviceAreasResponse.data?.serviceAreas) ? serviceAreasResponse.data.serviceAreas : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, groupBy]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const overviewStats = overview?.overview || {};
  const resolution = overview?.resolution || {};
  const statusBreakdown = overview?.statusBreakdown || {};
  const categoryBreakdown = overview?.categoryBreakdown || {};
  const priorityBreakdown = overview?.priorityBreakdown || {};

  const topCategories = useMemo(() => {
    return CATEGORY_META
      .map((item) => ({ ...item, count: Number(categoryBreakdown[item.key]) || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [categoryBreakdown]);

  const topOfficers = useMemo(() => officers.slice(0, 8), [officers]);
  const totalPriorityReports = PRIORITY_META.reduce(
    (total, item) => total + (Number(priorityBreakdown[item.key]) || 0),
    0,
  );

  const handleRefresh = () => {
    loadAnalytics(true);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">Operations intelligence</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Understand reporting patterns, resolution performance, and workload across RoadWatch teams and service areas.</p>
        </div>
        <button type="button" onClick={handleRefresh} disabled={loading || refreshing} className="w-fit rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
          {refreshing ? "Refreshing..." : "Refresh analytics"}
        </button>
      </header>

      {error && (
        <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Analytics could not be loaded</p>
          <p className="mt-1">{error}</p>
          <button type="button" onClick={handleRefresh} className="mt-3 font-semibold underline underline-offset-2">Try again</button>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-rw-navy">Overall performance</h2>
          <p className="text-xs text-slate-500">All-time report totals</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total reports" value={loading ? "—" : (overviewStats.totalReports ?? 0).toLocaleString("en-IN")} helper="All reports recorded in the system" />
          <StatCard label="Resolution rate" value={loading ? "—" : `${Number(overviewStats.resolutionRate || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`} helper="Resolved and confirmed reports divided by all reports" accent="border-t-rw-success" />
          <StatCard label="Average resolution time" value={loading ? "—" : formatHours(resolution.averageResolutionTimeHours)} helper={`${Number(resolution.resolvedCount || 0).toLocaleString("en-IN")} reports with recorded resolution timestamps`} accent="border-t-rw-primary" />
          <StatCard label="Reopened reports" value={loading ? "—" : (overviewStats.reopenedCount ?? 0).toLocaleString("en-IN")} helper="Reports returned for further action" accent="border-t-rw-danger" />
        </div>
      </section>

      <Panel
        title="Report trends"
        description="Track reports created and resolved over time."
        action={
          <div className="flex flex-wrap gap-2">
            <select aria-label="Trend period" value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-lg border border-rw-border bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
              {PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select aria-label="Trend grouping" value={groupBy} onChange={(event) => setGroupBy(event.target.value)} className="rounded-lg border border-rw-border bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
              {GROUP_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        }
      >
        {loading ? <div className="h-64 animate-pulse rounded-xl bg-slate-50" /> : <TrendChart trends={trends} />}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Report status" description="Current all-time distribution by report status.">
          {loading ? (
            <div className="space-y-5">{STATUS_META.slice(0, 5).map((item) => <div key={item.key} className="h-8 animate-pulse rounded bg-slate-50" />)}</div>
          ) : (
            <div className="space-y-4">
              {STATUS_META.map((item) => (
                <BarRow key={item.key} label={item.label} value={statusBreakdown[item.key]} total={overviewStats.totalReports || 0} color={item.color} />
              ))}
              <div className="border-t border-rw-border pt-4 text-xs leading-5 text-slate-500">Status totals reflect each report's current status, not its historical status transitions.</div>
            </div>
          )}
        </Panel>

        <Panel title="Reports by category" description="Categories ranked by the number of reports received.">
          {loading ? (
            <div className="space-y-5">{CATEGORY_META.slice(0, 5).map((item) => <div key={item.key} className="h-8 animate-pulse rounded bg-slate-50" />)}</div>
          ) : topCategories.every((item) => item.count === 0) ? (
            <EmptyState>No category data is available yet.</EmptyState>
          ) : (
            <div className="space-y-4">
              {topCategories.map((item) => (
                <BarRow key={item.key} label={item.label} value={item.count} total={overviewStats.totalReports || 0} color="#f97316" />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Priority distribution" description="Current reports grouped by their recorded priority level.">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{PRIORITY_META.map((item) => <div key={item.key} className="h-24 animate-pulse rounded-xl bg-slate-50" />)}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PRIORITY_META.map((item) => {
              const count = Number(priorityBreakdown[item.key]) || 0;
              const share = totalPriorityReports > 0 ? (count / totalPriorityReports) * 100 : 0;
              return (
                <div key={item.key} className="rounded-xl border border-rw-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  <p className="mt-3 text-2xl font-bold tabular-nums text-rw-navy">{count.toLocaleString("en-IN")}</p>
                  <p className="mt-1 text-xs text-slate-500">{share.toLocaleString("en-IN", { maximumFractionDigits: 1 })}% of priority-recorded reports</p>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel
        title="Officer performance"
        description="Assignment workload and completed work, ranked by active assignments."
        action={<Link to="/officers" className="text-sm font-semibold text-orange-700 hover:text-orange-800">Manage officers</Link>}
      >
        {loading ? (
          <div className="h-44 animate-pulse rounded-xl bg-slate-50" />
        ) : officers.length === 0 ? (
          <EmptyState>No officer analytics are available.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-rw-border text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">Officer</th>
                  <th className="pb-3 pr-4 font-semibold">Department</th>
                  <th className="pb-3 pr-4 font-semibold">Active</th>
                  <th className="pb-3 pr-4 font-semibold">Completed</th>
                  <th className="pb-3 pr-4 font-semibold">Rejected</th>
                  <th className="pb-3 font-semibold">Avg. time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rw-border">
                {topOfficers.map((officer) => (
                  <tr key={officer._id}>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-rw-navy">{officer.name || "Unnamed officer"}</p>
                      <p className="mt-1 text-xs text-slate-500">{officer.email || "—"}</p>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${officer.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>{officer.isActive ? "Active account" : "Inactive account"}</span>
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{officer.department?.name || "Not assigned"}</td>
                    <td className="py-4 pr-4 font-semibold tabular-nums text-rw-navy">{officer.stats?.activeAssignments ?? 0}</td>
                    <td className="py-4 pr-4 font-semibold tabular-nums text-green-700">{officer.stats?.completedAssignments ?? 0}</td>
                    <td className="py-4 pr-4 font-semibold tabular-nums text-red-700">{officer.stats?.rejectedAssignments ?? 0}</td>
                    <td className="py-4 text-slate-600">{formatHours(officer.stats?.averageResolutionTimeHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {officers.length > topOfficers.length && <p className="mt-4 text-xs text-slate-500">Showing the first {topOfficers.length} officers. The backend returns all officers ordered by active assignment count.</p>}
          </div>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Department workload" description="Assignment volume and performance by department.">
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-50" />)}</div>
          ) : departments.length === 0 ? (
            <EmptyState>No department analytics are available.</EmptyState>
          ) : (
            <div className="space-y-3">
              {departments.map((department) => (
                <div key={department._id} className="rounded-xl border border-rw-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-rw-navy">{department.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{department.officerCount || 0} officers · {department.isActive ? "Active" : "Inactive"}</p>
                    </div>
                    <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-bold tabular-nums text-orange-800">{department.stats?.activeAssignments ?? 0} active</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-rw-border pt-3">
                    <div><p className="text-xs text-slate-500">All assignments</p><p className="mt-1 font-semibold tabular-nums text-rw-navy">{department.stats?.totalAssignments ?? 0}</p></div>
                    <div><p className="text-xs text-slate-500">Completed</p><p className="mt-1 font-semibold tabular-nums text-green-700">{department.stats?.completedAssignments ?? 0}</p></div>
                    <div><p className="text-xs text-slate-500">Avg. time</p><p className="mt-1 font-semibold text-rw-navy">{formatHours(department.stats?.averageResolutionTimeHours)}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Service area workload" description="Active workload and officer coverage by geographic service area.">
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-50" />)}</div>
          ) : serviceAreas.length === 0 ? (
            <EmptyState>No service-area analytics are available.</EmptyState>
          ) : (
            <div className="space-y-3">
              {serviceAreas.map((area) => (
                <div key={area._id} className="rounded-xl border border-rw-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-rw-navy">{area.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{area.city || "City not specified"} · {area.officerCount || 0} officers · {area.isActive ? "Active" : "Inactive"}</p>
                    </div>
                    <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-bold tabular-nums text-orange-800">{area.stats?.activeAssignments ?? 0} active</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-rw-border pt-3">
                    <div><p className="text-xs text-slate-500">All assignments</p><p className="mt-1 font-semibold tabular-nums text-rw-navy">{area.stats?.totalAssignments ?? 0}</p></div>
                    <div><p className="text-xs text-slate-500">Completed</p><p className="mt-1 font-semibold tabular-nums text-green-700">{area.stats?.completedAssignments ?? 0}</p></div>
                    <div><p className="text-xs text-slate-500">Rejected</p><p className="mt-1 font-semibold tabular-nums text-red-700">{area.stats?.rejectedAssignments ?? 0}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rw-border pt-5 text-xs leading-5 text-slate-500">
        <p>Analytics are calculated from current reports and assignment records returned by the backend.</p>
        <div className="flex gap-4">
          <Link to="/reports" className="font-semibold text-orange-700 hover:text-orange-800">View reports</Link>
          <Link to="/service-areas" className="font-semibold text-orange-700 hover:text-orange-800">View service areas</Link>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
