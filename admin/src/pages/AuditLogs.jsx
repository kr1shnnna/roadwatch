import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const PAGE_SIZE = 20;

const actions = [
  "report.created",
  "report.assigned",
  "report.reassigned",
  "report.confirmed",
  "report.reopened",
  "assignment.accepted",
  "assignment.started",
  "assignment.resolved",
  "assignment.rejected",
  "officer.created",
  "officer.updated",
  "officer.status_changed",
  "department.updated",
  "department.status_changed",
  "service_area.created",
  "service_area.updated",
  "service_area.status_changed",
];

const entityTypes = [
  "Report",
  "Assignment",
  "User",
  "Department",
  "ServiceArea",
];

const formatLabel = (value) =>
  String(value || "Unknown")
    .replaceAll("_", " ")
    .replaceAll(".", " · ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(value.trim());

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  "Unable to load audit logs. Please try again.";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [draftFilters, setDraftFilters] = useState({
    action: "",
    entityType: "",
    actor: "",
    entityId: "",
  });
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    actor: "",
    entityId: "",
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");

  const loadLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    const params = { page, limit: PAGE_SIZE };
    if (filters.action) params.action = filters.action;
    if (filters.entityType) params.entityType = filters.entityType;
    if (filters.actor) params.actor = filters.actor;
    if (filters.entityId) params.entityId = filters.entityId;

    try {
      const response = await api.get("/admin/audit-logs", { params });
      const data = response?.data;
      const serverPagination = data?.pagination || {};

      setLogs(Array.isArray(data?.logs) ? data.logs : []);
      setPagination({
        page: Number(serverPagination.page) || page,
        limit: Number(serverPagination.limit) || PAGE_SIZE,
        total: Number(serverPagination.total) || 0,
        totalPages: Number(serverPagination.totalPages) || 0,
        hasNextPage: Boolean(serverPagination.hasNextPage),
        hasPreviousPage: Boolean(serverPagination.hasPreviousPage),
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const updateDraft = (key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
    setFilterError("");
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setFilterError("");

    for (const key of ["actor", "entityId"]) {
      const value = draftFilters[key].trim();
      if (value && !isObjectId(value)) {
        setFilterError(
          `${key === "actor" ? "Actor ID" : "Entity ID"} must be a valid 24-character MongoDB ID.`,
        );
        return;
      }
    }

    setPage(1);
    setFilters({
      action: draftFilters.action,
      entityType: draftFilters.entityType,
      actor: draftFilters.actor.trim(),
      entityId: draftFilters.entityId.trim(),
    });
  };

  const clearFilters = () => {
    const empty = { action: "", entityType: "", actor: "", entityId: "" };
    setDraftFilters(empty);
    setFilters(empty);
    setPage(1);
    setFilterError("");
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
            Governance & accountability
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">
            Audit Logs
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review recorded actions across reports, assignments, officers, departments, and service areas. Entries are read-only and sorted newest first.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadLogs(true)}
          disabled={loading || refreshing}
          className="w-fit rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh logs"}
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Matching audit entries</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-rw-navy">
            {loading ? "—" : pagination.total.toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Total entries matching the applied filters
          </p>
        </div>
        <div className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Current page</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-rw-navy">
            {loading ? "—" : pagination.totalPages ? `${pagination.page} / ${pagination.totalPages}` : "0 / 0"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Up to {PAGE_SIZE} entries shown per page
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-rw-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-rw-navy">Filter audit history</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Filter by exact action, entity type, actor ID, or entity ID.
            </p>
          </div>
          {Object.values(filters).some(Boolean) && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 w-fit text-sm font-semibold text-orange-700 hover:text-orange-800 sm:mt-0"
            >
              Clear filters
            </button>
          )}
        </div>

        <form onSubmit={applyFilters} className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block min-w-0">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </span>
              <select
                value={draftFilters.action}
                onChange={(event) => updateDraft("action", event.target.value)}
                className="w-full rounded-xl border border-rw-border bg-white px-3 py-2.5 text-sm text-rw-text outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option value="">All actions</option>
                {actions.map((action) => (
                  <option key={action} value={action}>{formatLabel(action)}</option>
                ))}
              </select>
            </label>

            <label className="block min-w-0">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Entity type
              </span>
              <select
                value={draftFilters.entityType}
                onChange={(event) => updateDraft("entityType", event.target.value)}
                className="w-full rounded-xl border border-rw-border bg-white px-3 py-2.5 text-sm text-rw-text outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option value="">All entity types</option>
                {entityTypes.map((entityType) => (
                  <option key={entityType} value={entityType}>{entityType}</option>
                ))}
              </select>
            </label>

            <label className="block min-w-0">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actor ID
              </span>
              <input
                type="text"
                value={draftFilters.actor}
                onChange={(event) => updateDraft("actor", event.target.value)}
                placeholder="24-character user ID"
                spellCheck={false}
                className="w-full rounded-xl border border-rw-border bg-white px-3 py-2.5 text-sm text-rw-text outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <label className="block min-w-0">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Entity ID
              </span>
              <input
                type="text"
                value={draftFilters.entityId}
                onChange={(event) => updateDraft("entityId", event.target.value)}
                placeholder="24-character record ID"
                spellCheck={false}
                className="w-full rounded-xl border border-rw-border bg-white px-3 py-2.5 text-sm text-rw-text outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>
          </div>

          {filterError && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {filterError}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-rw-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-navy-light"
            >
              Apply filters
            </button>
            <p className="text-xs text-slate-400">
              Actor and entity filters require MongoDB record IDs.
            </p>
          </div>
        </form>
      </section>

      {error && (
        <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Could not load audit logs</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => loadLogs()}
            className="mt-3 font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-rw-border bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-rw-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h3 className="text-base font-bold text-rw-navy">Activity history</h3>
            <p className="mt-1 text-xs text-slate-500">
              {loading ? "Loading entries..." : `Showing ${logs.length} of ${pagination.total} entries`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 p-5 sm:p-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="animate-pulse border-b border-rw-border pb-4 last:border-0">
                <div className="h-4 w-48 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-64 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : !error && logs.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="text-lg font-bold text-rw-navy">No audit entries found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {Object.values(filters).some(Boolean)
                ? "Try adjusting the filters to see other recorded actions."
                : "Recorded administrative and operational actions will appear here."}
            </p>
            {Object.values(filters).some(Boolean) && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-semibold text-orange-700 hover:text-orange-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-rw-border">
            {logs.map((log) => (
              <article key={log._id} className="px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800">
                        {formatLabel(log.action)}
                      </span>
                      <span className="rounded-full border border-rw-border px-2.5 py-1 text-xs font-medium text-slate-600">
                        {log.entityType || "Unknown entity"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-rw-navy">
                      {log.actor?.name || log.actor?.email || "Unknown actor"}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {log.actor?.email || "No actor email available"}
                      {log.actorRole ? ` · ${formatLabel(log.actorRole)}` : ""}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      Entity ID: <span className="break-all font-mono text-slate-600">{String(log.entityId || "Not recorded")}</span>
                    </p>
                  </div>

                  <time dateTime={log.createdAt} className="shrink-0 text-xs leading-5 text-slate-500">
                    {formatDate(log.createdAt)}
                  </time>
                </div>

                <details className="mt-4 rounded-xl border border-rw-border bg-slate-50">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
                    View recorded details
                  </summary>
                  <div className="space-y-4 border-t border-rw-border px-4 py-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action metadata
                      </p>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-xs leading-5 text-slate-700">
                        {JSON.stringify(log.details || {}, null, 2)}
                      </pre>
                    </div>

                    {log.ipAddress && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">IP address</p>
                        <p className="mt-1 break-all text-sm text-slate-700">{log.ipAddress}</p>
                      </div>
                    )}

                    {log.userAgent && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User agent</p>
                        <p className="mt-1 break-words text-xs leading-5 text-slate-600">{log.userAgent}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audit entry ID</p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-600">{log._id}</p>
                    </div>
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && pagination.totalPages > 0 && (
          <div className="flex flex-col gap-3 border-t border-rw-border bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString("en-IN")} entries
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => current - 1)}
                disabled={!pagination.hasPreviousPage}
                className="rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!pagination.hasNextPage}
                className="rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AuditLogs;
