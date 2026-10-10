import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";

import api from "../services/api";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const getId = (value) => {
  if (!value) return "";
  return typeof value === "object" ? String(value._id || value.id || "") : String(value);
};

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getInitials = (name) =>
  (name || "Officer")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const compareIdArrays = (first = [], second = []) => {
  const a = first.map(getId).filter(Boolean).sort();
  const b = second.map(getId).filter(Boolean).sort();
  return a.length === b.length && a.every((id, index) => id === b[index]);
};

const Field = ({ label, htmlFor, children, hint }) => (
  <div>
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold text-slate-700"
    >
      {label}
    </label>
    {children}
    {hint && <p className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>}
  </div>
);

const inputClassName =
  "w-full rounded-xl border border-rw-border bg-white px-3.5 py-3 text-sm text-rw-text outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

const OfficerFormModal = ({
  mode,
  officer,
  departments,
  serviceAreas,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState(officer?.name || "");
  const [email, setEmail] = useState(officer?.email || "");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState(getId(officer?.department));
  const [assignedAreas, setAssignedAreas] = useState(
    Array.isArray(officer?.assignedAreas)
      ? officer.assignedAreas.map(getId).filter(Boolean)
      : [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = mode === "edit";

  const toggleArea = (areaId) => {
    setAssignedAreas((current) =>
      current.includes(areaId)
        ? current.filter((id) => id !== areaId)
        : [...current, areaId],
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      setError("Name must be at least two characters.");
      return;
    }

    if (!cleanEmail) {
      setError("Enter a valid email address.");
      return;
    }

    if (!isEdit && password.length < 6) {
      setError("The temporary password must be at least six characters.");
      return;
    }

    if (!department) {
      setError("Select a department for this officer.");
      return;
    }

    const activeAreaIds = assignedAreas.filter((areaId) => {
      const area = serviceAreas.find((item) => getId(item) === areaId);
      return area?.isActive === true;
    });

    const payload = { name: cleanName, email: cleanEmail };

    try {
      setSaving(true);

      if (isEdit) {
        const originalDepartmentId = getId(officer?.department);
        const originalAreas = Array.isArray(officer?.assignedAreas)
          ? officer.assignedAreas.map(getId).filter(Boolean)
          : [];

        // Only send department or service-area values when they changed.
        // This allows an officer with an old inactive assignment to be
        // edited without unintentionally resubmitting invalid inactive IDs.
        if (department !== originalDepartmentId) {
          payload.department = department;
        }

        if (!compareIdArrays(assignedAreas, originalAreas)) {
          payload.assignedAreas = activeAreaIds;
        }

        await api.patch(`/admin/officers/${officer._id}`, payload);
      } else {
        payload.password = password;
        payload.department = department;
        payload.assignedAreas = activeAreaIds;
        await api.post("/admin/officers", payload);
      }

      onSaved(
        isEdit ? "Officer details updated successfully." : "Officer account created successfully.",
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const hasInactiveAssignedArea = isEdit && (officer?.assignedAreas || []).some((area) => {
    const areaId = getId(area);
    const knownArea = serviceAreas.find((item) => getId(item) === areaId);
    return knownArea?.isActive === false;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="officer-form-title"
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-rw-border px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
              Officer management
            </p>
            <h2 id="officer-form-title" className="mt-2 text-xl font-bold text-rw-navy">
              {isEdit ? "Edit officer" : "Create officer account"}
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              {isEdit
                ? "Update account details, department, and service-area responsibility."
                : "Create an account for a member of the field team."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close form"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-rw-navy disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-6 sm:px-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="officer-name">
              <input
                id="officer-name"
                className={inputClassName}
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={100}
                autoComplete="name"
                required
                placeholder="Enter officer's name"
              />
            </Field>

            <Field label="Email address" htmlFor="officer-email">
              <input
                id="officer-email"
                type="email"
                className={inputClassName}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                placeholder="officer@roadwatch.in"
              />
            </Field>
          </div>

          {!isEdit && (
            <Field
              label="Temporary password"
              htmlFor="officer-password"
              hint="At least six characters. Share this securely with the officer."
            >
              <input
                id="officer-password"
                type="password"
                className={inputClassName}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
                placeholder="Create a temporary password"
              />
            </Field>
          )}

          <Field
            label="Department"
            htmlFor="officer-department"
            hint="Only active departments can be selected for a new assignment."
          >
            <select
              id="officer-department"
              className={inputClassName}
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              required
            >
              <option value="">Select department</option>
              {departments.map((item) => {
                const id = getId(item);
                const selectedExisting = id === getId(officer?.department);
                return (
                  <option
                    key={id}
                    value={id}
                    disabled={item.isActive === false && !selectedExisting}
                  >
                    {item.name}{item.isActive === false ? " (inactive)" : ""}
                  </option>
                );
              })}
            </select>
            {isEdit && officer?.department?.isActive === false && (
              <p className="mt-1.5 text-xs leading-5 text-amber-700">
                This officer's current department is inactive. Select an active department to change it.
              </p>
            )}
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">Assigned service areas</p>
              <span className="text-xs text-slate-500">
                {assignedAreas.length} selected
              </span>
            </div>

            {serviceAreas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-rw-border-dark px-4 py-5 text-sm text-slate-500">
                No service areas found. You can create the officer now and assign areas later.
              </div>
            ) : (
              <div className="grid max-h-52 gap-2 overflow-y-auto rounded-xl border border-rw-border p-3 sm:grid-cols-2">
                {serviceAreas.map((area) => {
                  const areaId = getId(area);
                  const checked = assignedAreas.includes(areaId);
                  const active = area.isActive !== false;

                  return (
                    <label
                      key={areaId}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                        checked
                          ? "border-orange-200 bg-orange-50"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleArea(areaId)}
                        className="mt-0.5 h-4 w-4 accent-orange-600"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-800">
                          {area.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {area.city || "City not specified"}
                          {!active ? " · Inactive" : ""}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {hasInactiveAssignedArea && (
              <p className="mt-2 text-xs leading-5 text-amber-700">
                This officer has an inactive service area. If you change area assignments, only active areas will be saved.
              </p>
            )}
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-rw-border pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-rw-border px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !departments.some((item) => getId(item) === department && item.isActive !== false)}
              className="rounded-xl bg-rw-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create officer"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

const Officers = () => {
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);

  const [departmentFilter, setDepartmentFilter] = useState("");
  const [serviceAreaFilter, setServiceAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lookupsError, setLookupsError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [modal, setModal] = useState(null);
  const [statusBusyId, setStatusBusyId] = useState("");

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true);
    setLookupsError("");

    try {
      const [departmentResponse, areaResponse] = await Promise.all([
        api.get("/admin/departments"),
        api.get("/admin/service-areas"),
      ]);

      setDepartments(
        Array.isArray(departmentResponse.data?.departments)
          ? departmentResponse.data.departments
          : [],
      );
      setServiceAreas(
        Array.isArray(areaResponse.data?.serviceAreas)
          ? areaResponse.data.serviceAreas
          : [],
      );
    } catch (requestError) {
      setLookupsError(getErrorMessage(requestError));
    } finally {
      setLookupsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    let cancelled = false;

    const loadOfficers = async () => {
      setLoading(true);
      setError("");

      const params = {};
      if (departmentFilter) params.department = departmentFilter;
      if (serviceAreaFilter) params.serviceArea = serviceAreaFilter;
      if (statusFilter) params.isActive = statusFilter;

      try {
        const response = await api.get("/admin/officers", { params });
        if (cancelled) return;

        setOfficers(
          Array.isArray(response.data?.officers)
            ? response.data.officers
            : [],
        );
      } catch (requestError) {
        if (!cancelled) setError(getErrorMessage(requestError));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadOfficers();

    return () => {
      cancelled = true;
    };
  }, [departmentFilter, serviceAreaFilter, statusFilter, refreshVersion]);

  const visibleOfficers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return officers;

    return officers.filter((officer) => {
      const areas = Array.isArray(officer.assignedAreas)
        ? officer.assignedAreas
        : [];
      const searchable = [
        officer.name,
        officer.email,
        officer.department?.name,
        ...areas.map((area) => area?.name),
        ...areas.map((area) => area?.city),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [officers, search]);

  const activeInView = officers.filter((officer) => officer.isActive).length;
  const inactiveInView = officers.length - activeInView;

  const refresh = () => {
    setRefreshing(true);
    setSuccessMessage("");
    setRefreshVersion((current) => current + 1);
  };

  const handleSaved = (message) => {
    setModal(null);
    setSuccessMessage(message);
    setRefreshVersion((current) => current + 1);
    loadLookups();
  };

  const handleStatusToggle = async (officer) => {
    const nextActive = !officer.isActive;
    const action = nextActive ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${officer.name}?${
        nextActive
          ? ""
          : " This officer will no longer be available for new assignments."
      }`,
    );

    if (!confirmed) return;

    setStatusBusyId(officer._id);
    setError("");
    setSuccessMessage("");

    try {
      const response = await api.patch(
        `/admin/officers/${officer._id}/status`,
        { isActive: nextActive },
      );

      setSuccessMessage(
        response.data?.message || `Officer ${action}d successfully.`,
      );
      setRefreshVersion((current) => current + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setStatusBusyId("");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
            Team administration
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">
            Officer Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Create officer accounts, manage department and service-area assignments, and control account access.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading || refreshing}
            className="rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSuccessMessage("");
              setModal({ mode: "create", officer: null });
            }}
            disabled={lookupsLoading || departments.filter((item) => item.isActive).length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rw-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Add officer
          </button>
        </div>
      </header>

      {successMessage && (
        <div role="status" className="flex items-start justify-between gap-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <p>{successMessage}</p>
          <button type="button" onClick={() => setSuccessMessage("")} aria-label="Dismiss message" className="font-semibold text-green-800">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Officer request failed</p>
          <p className="mt-1">{error}</p>
          <button type="button" onClick={refresh} className="mt-2 font-semibold underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {lookupsError && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Could not load departments or service areas: {lookupsError}
          <button type="button" onClick={loadLookups} className="ml-2 font-semibold underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-rw-border border-t-4 border-t-rw-navy bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Officers in current results</p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-rw-navy">{loading ? "—" : officers.length}</p>
          <p className="mt-2 text-xs text-slate-500">Matching the selected filters</p>
        </div>
        <div className="rounded-2xl border border-rw-border border-t-4 border-t-rw-success bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active accounts</p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-green-700">{loading ? "—" : activeInView}</p>
          <p className="mt-2 text-xs text-slate-500">Can be considered for new assignments</p>
        </div>
        <div className="rounded-2xl border border-rw-border border-t-4 border-t-rw-danger bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Inactive accounts</p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-red-700">{loading ? "—" : inactiveInView}</p>
          <p className="mt-2 text-xs text-slate-500">Unavailable for new assignments</p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-rw-border bg-white p-4 shadow-sm sm:p-5">
        <div>
          <h2 className="text-sm font-bold text-rw-navy">Find officers</h2>
          <p className="mt-1 text-xs text-slate-500">
            Filter by department, service area, or account status. Search matches the loaded results.
          </p>
        </div>

        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, department, or area..."
            className={`${inputClassName} pl-10`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Department" htmlFor="filter-department">
            <select
              id="filter-department"
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className={inputClassName}
            >
              <option value="">All departments</option>
              {departments.map((item) => (
                <option key={getId(item)} value={getId(item)}>
                  {item.name}{item.isActive === false ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Service area" htmlFor="filter-service-area">
            <select
              id="filter-service-area"
              value={serviceAreaFilter}
              onChange={(event) => setServiceAreaFilter(event.target.value)}
              className={inputClassName}
            >
              <option value="">All service areas</option>
              {serviceAreas.map((item) => (
                <option key={getId(item)} value={getId(item)}>
                  {item.name}{item.city ? ` · ${item.city}` : ""}{item.isActive === false ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Account status" htmlFor="filter-status">
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClassName}
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </Field>
        </div>

        {(departmentFilter || serviceAreaFilter || statusFilter || search) && (
          <button
            type="button"
            onClick={() => {
              setDepartmentFilter("");
              setServiceAreaFilter("");
              setStatusFilter("");
              setSearch("");
            }}
            className="text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            Clear filters
          </button>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {loading ? "Loading officers..." : `Showing ${visibleOfficers.length} of ${officers.length} officers`}
        </p>
        {!loading && (
          <p className="text-xs text-slate-400">Officer account records</p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse rounded-2xl border border-rw-border bg-white p-5">
              <div className="h-5 w-44 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-64 rounded bg-slate-100" />
              <div className="mt-5 h-14 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : !error && visibleOfficers.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-rw-border-dark bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-bold text-rw-navy">
            {search || departmentFilter || serviceAreaFilter || statusFilter
              ? "No officers match these filters"
              : "No officer accounts yet"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {search || departmentFilter || serviceAreaFilter || statusFilter
              ? "Try a different search term or clear one or more filters."
              : "Create your first officer account to start assigning field work."}
          </p>
          {(search || departmentFilter || serviceAreaFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setDepartmentFilter("");
                setServiceAreaFilter("");
                setStatusFilter("");
                setSearch("");
              }}
              className="mt-4 text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              Clear filters
            </button>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          {visibleOfficers.map((officer) => {
            const areas = Array.isArray(officer.assignedAreas)
              ? officer.assignedAreas
              : [];

            return (
              <article key={officer._id} className="rounded-2xl border border-rw-border bg-white p-4 shadow-sm transition hover:border-slate-300 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rw-navy text-sm font-bold text-white">
                      {getInitials(officer.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-base font-bold text-rw-navy sm:text-lg">
                          {officer.name || "Unnamed officer"}
                        </h2>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${officer.isActive ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                          {officer.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <p className="mt-1 break-all text-sm text-slate-500">{officer.email}</p>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Department</p>
                          <p className="mt-1.5 text-sm font-semibold text-slate-800">
                            {officer.department?.name || "Not assigned"}
                          </p>
                          {Array.isArray(officer.department?.categories) && officer.department.categories.length > 0 && (
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Categories: {officer.department.categories.map(formatCategory).join(", ")}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Assigned service areas</p>
                          {areas.length > 0 ? (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {areas.map((area) => (
                                <span key={getId(area)} className={`rounded-md border px-2 py-1 text-xs ${area.isActive === false ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                                  {area.name}{area.city ? ` · ${area.city}` : ""}
                                  {area.isActive === false ? " (inactive)" : ""}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-1.5 text-sm text-slate-500">No areas assigned</p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Account created</p>
                          <p className="mt-1.5 text-sm font-semibold text-slate-800">
                            {formatDate(officer.createdAt)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {areas.length} {areas.length === 1 ? "service area" : "service areas"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-row gap-2 lg:flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        setSuccessMessage("");
                        setModal({ mode: "edit", officer });
                      }}
                      className="rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit officer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(officer)}
                      disabled={statusBusyId === officer._id}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${officer.isActive ? "border-red-200 text-red-700 hover:bg-red-50" : "border-green-200 text-green-700 hover:bg-green-50"}`}
                    >
                      {statusBusyId === officer._id
                        ? "Saving..."
                        : officer.isActive
                          ? "Deactivate"
                          : "Activate"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {modal && (
        <OfficerFormModal
          key={`${modal.mode}-${modal.officer?._id || "new"}`}
          mode={modal.mode}
          officer={modal.officer}
          departments={departments}
          serviceAreas={serviceAreas}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

const formatCategory = (value) =>
  String(value || "other")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default Officers;
