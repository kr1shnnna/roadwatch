import { useCallback, useEffect, useMemo, useState } from "react";

import api from "../services/api";

const CATEGORY_OPTIONS = [
  { value: "pothole", label: "Pothole" },
  { value: "broken_road", label: "Broken road" },
  { value: "streetlight", label: "Streetlight" },
  { value: "traffic_signal", label: "Traffic signal" },
  { value: "waterlogging", label: "Waterlogging" },
  { value: "open_manhole", label: "Open manhole" },
  { value: "road_sign", label: "Road sign" },
  { value: "road_debris", label: "Road debris" },
  { value: "drainage", label: "Drainage" },
  { value: "other", label: "Other" },
];

const formatLabel = (value) =>
  String(value || "Unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

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

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const DepartmentModal = ({
  department,
  loading,
  error,
  onClose,
  onSave,
  onToggleStatus,
  saving,
  updatingStatus,
  feedback,
  actionError,
}) => {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(department.description || "");
  const [categories, setCategories] = useState(department.categories || []);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setDescription(department.description || "");
    setCategories(department.categories || []);
    setEditing(false);
    setFormError("");
  }, [department._id]);

  const toggleCategory = (value) => {
    setFormError("");
    setCategories((current) =>
      current.includes(value)
        ? current.filter((category) => category !== value)
        : [...current, value],
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (categories.length === 0) {
      setFormError("Select at least one issue category for this department.");
      return;
    }

    if (description.trim().length > 500) {
      setFormError("The description cannot exceed 500 characters.");
      return;
    }

    const saved = await onSave({
      categories,
      description: description.trim() || null,
    });

    if (saved) setEditing(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-dialog-title"
        className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-rw-border p-5 sm:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  department.isActive
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
              >
                {department.isActive ? "Active" : "Inactive"}
              </span>
              <span className="text-xs text-slate-400">Department record</span>
            </div>
            <h2
              id="department-dialog-title"
              className="mt-3 break-words text-xl font-bold text-rw-navy sm:text-2xl"
            >
              {department.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review responsibility categories, department details, and assigned officers.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-rw-border px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {(feedback || actionError || error || formError) && (
            <div
              role={actionError || error || formError ? "alert" : "status"}
              className={`rounded-xl border p-3 text-sm leading-5 ${
                actionError || error || formError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-800"
              }`}
            >
              {formError || actionError || error || feedback}
            </div>
          )}

          {loading ? (
            <div className="space-y-4 py-6">
              <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="departmentDescription"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Description
                  </label>
                  <span className="text-xs text-slate-400">
                    {description.length}/500
                  </span>
                </div>

                <textarea
                  id="departmentDescription"
                  rows={4}
                  maxLength={500}
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setFormError("");
                  }}
                  placeholder="Describe this department's responsibilities..."
                  className="w-full resize-y rounded-xl border border-rw-border px-3.5 py-3 text-sm leading-6 text-rw-text outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Responsible issue categories
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Select at least one category. These categories are used when routing reports to departments.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {CATEGORY_OPTIONS.map((option) => {
                    const checked = categories.includes(option.value);

                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition ${
                          checked
                            ? "border-orange-300 bg-orange-50 text-rw-navy"
                            : "border-rw-border text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(option.value)}
                          className="h-4 w-4 accent-orange-600"
                        />
                        <span className="font-medium">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-rw-border pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setDescription(department.description || "");
                    setCategories(department.categories || []);
                    setFormError("");
                    setEditing(false);
                  }}
                  className="rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || categories.length === 0}
                  className="rounded-xl bg-rw-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving changes..." : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-rw-border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Issue categories
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-rw-navy">
                    {department.categories?.length || 0}
                  </p>
                </div>

                <div className="rounded-xl border border-rw-border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Officers
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-rw-navy">
                    {department.officerCount ?? department.officers?.length ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-rw-border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Created
                  </p>
                  <p className="mt-2 text-sm font-bold text-rw-navy">
                    {formatDate(department.createdAt)}
                  </p>
                </div>
              </div>

              <section>
                <h3 className="text-sm font-bold text-rw-navy">Description</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {department.description || "No description has been added."}
                </p>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-rw-navy">
                    Responsible categories
                  </h3>
                  <span className="text-xs text-slate-500">
                    {department.categories?.length || 0} categories
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(department.categories || []).map((category) => (
                    <span
                      key={category}
                      className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-800"
                    >
                      {formatLabel(category)}
                    </span>
                  ))}
                  {(!department.categories || department.categories.length === 0) && (
                    <p className="text-sm text-slate-500">No categories configured.</p>
                  )}
                </div>
              </section>

              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-rw-navy">
                      Assigned officers
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Officers currently associated with this department.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {department.officers?.length || 0} listed
                  </span>
                </div>

                {!department.officers?.length ? (
                  <div className="rounded-xl border border-dashed border-rw-border-dark px-4 py-7 text-center">
                    <p className="text-sm font-semibold text-rw-navy">
                      No officers assigned
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Officers assigned to this department will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-rw-border rounded-xl border border-rw-border">
                    {department.officers.map((officer) => (
                      <div
                        key={officer._id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-rw-navy">
                            {officer.name || "Unnamed officer"}
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            {officer.email}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(officer.assignedAreas || []).map((area) => (
                              <span
                                key={area._id}
                                className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
                              >
                                {area.name}{area.city ? ` · ${area.city}` : ""}
                              </span>
                            ))}
                            {(!officer.assignedAreas || officer.assignedAreas.length === 0) && (
                              <span className="text-xs text-slate-400">
                                No service areas assigned
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`w-fit shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            officer.isActive
                              ? "border-green-200 bg-green-50 text-green-800"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {officer.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex flex-col gap-3 border-t border-rw-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => onToggleStatus(department)}
                  disabled={updatingStatus}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    department.isActive
                      ? "border-red-200 text-red-700 hover:bg-red-50"
                      : "border-green-200 text-green-700 hover:bg-green-50"
                  }`}
                >
                  {updatingStatus
                    ? "Updating status..."
                    : department.isActive
                      ? "Deactivate department"
                      : "Activate department"}
                </button>

                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-xl bg-rw-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-navy-light"
                >
                  Edit department
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadDepartments = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await api.get("/admin/departments");
      const data = response?.data;
      setDepartments(Array.isArray(data?.departments) ? data.departments : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments, refreshVersion]);

  const openDepartment = async (department) => {
    setSelectedDepartment(department);
    setDetailsLoading(true);
    setDetailsError("");
    setFeedback("");
    setActionError("");

    try {
      const response = await api.get(`/admin/departments/${department._id}`);
      const details = response?.data?.department;

      if (!details) {
        throw new Error("Department details were not returned by the server.");
      }

      setSelectedDepartment(details);
    } catch (requestError) {
      setDetailsError(getErrorMessage(requestError));
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSave = async (payload) => {
    if (!selectedDepartment?._id) return false;

    setSaving(true);
    setActionError("");
    setFeedback("");

    try {
      const response = await api.patch(
        `/admin/departments/${selectedDepartment._id}`,
        payload,
      );

      const updatedDepartment = response?.data?.department;

      if (!updatedDepartment) {
        throw new Error("The updated department was not returned by the server.");
      }

      setSelectedDepartment((current) => ({
        ...current,
        ...updatedDepartment,
      }));

      setDepartments((current) =>
        current.map((department) =>
          department._id === updatedDepartment._id
            ? { ...department, ...updatedDepartment }
            : department,
        ),
      );

      setFeedback(response?.data?.message || "Department updated successfully.");
      return true;
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (department) => {
    const nextStatus = !department.isActive;
    const action = nextStatus ? "activate" : "deactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${department.name}?`,
      )
    ) {
      return;
    }

    setUpdatingStatus(true);
    setActionError("");
    setFeedback("");

    try {
      const response = await api.patch(
        `/admin/departments/${department._id}/status`,
        { isActive: nextStatus },
      );

      const updatedDepartment = response?.data?.department;

      if (!updatedDepartment) {
        throw new Error("The updated department was not returned by the server.");
      }

      setSelectedDepartment((current) => ({
        ...current,
        ...updatedDepartment,
      }));

      setDepartments((current) =>
        current.map((item) =>
          item._id === updatedDepartment._id
            ? { ...item, ...updatedDepartment }
            : item,
        ),
      );

      setFeedback(response?.data?.message || `Department ${action}d successfully.`);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const counts = useMemo(
    () => ({
      all: departments.length,
      active: departments.filter((department) => department.isActive).length,
      inactive: departments.filter((department) => !department.isActive).length,
    }),
    [departments],
  );

  const visibleDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return departments.filter((department) => {
      if (activeFilter === "active" && !department.isActive) return false;
      if (activeFilter === "inactive" && department.isActive) return false;

      if (!query) return true;

      const text = [
        department.name,
        department.description,
        ...(department.categories || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [departments, activeFilter, search]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
            Operations management
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">
            Department Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage issue categories, department descriptions, assigned officers, and department availability.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDepartments(true)}
          disabled={loading || refreshing}
          className="w-fit rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh departments"}
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Could not load departments</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => setRefreshVersion((value) => value + 1)}
            className="mt-3 font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total departments", value: counts.all, note: "Configured in RoadWatch" },
          { label: "Active departments", value: counts.active, note: "Available for report routing" },
          { label: "Inactive departments", value: counts.inactive, note: "Not currently active" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold tabular-nums text-rw-navy">
              {loading ? "—" : stat.value}
            </p>
            <p className="mt-2 text-xs text-slate-500">{stat.note}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-2xl border border-rw-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-rw-navy">Departments</h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a department to review its officers and update supported categories.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All", count: counts.all },
              { value: "active", label: "Active", count: counts.active },
              { value: "inactive", label: "Inactive", count: counts.inactive },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  activeFilter === filter.value
                    ? "border-rw-navy bg-rw-navy text-white"
                    : "border-rw-border bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {filter.label}
                <span className="ml-2 tabular-nums opacity-75">
                  {loading ? "—" : filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search department, description, or issue category..."
          className="w-full rounded-xl border border-rw-border bg-slate-50 px-4 py-3 text-sm text-rw-text outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
        />

        <p className="text-sm text-slate-500">
          {loading ? "Loading departments..." : `${visibleDepartments.length} of ${departments.length} departments`}
        </p>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse rounded-2xl border border-rw-border p-5">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="mt-4 h-4 w-full rounded bg-slate-100" />
                <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
                <div className="mt-6 h-9 w-32 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : !error && visibleDepartments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-rw-border-dark px-6 py-12 text-center">
            <h3 className="text-base font-bold text-rw-navy">No departments found</h3>
            <p className="mt-2 text-sm text-slate-500">
              Try another search term or change the status filter.
            </p>
            {(search || activeFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveFilter("all");
                }}
                className="mt-4 text-sm font-semibold text-orange-700 hover:text-orange-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleDepartments.map((department) => (
              <article
                key={department._id}
                className="flex min-w-0 flex-col rounded-2xl border border-rw-border bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="break-words text-base font-bold text-rw-navy">
                    {department.name}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      department.isActive
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {department.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="mt-3 min-h-10 text-sm leading-5 text-slate-500">
                  {department.description || "No description has been added."}
                </p>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Responsible categories
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(department.categories || []).slice(0, 4).map((category) => (
                      <span
                        key={category}
                        className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                      >
                        {formatLabel(category)}
                      </span>
                    ))}
                    {(department.categories || []).length > 4 && (
                      <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-800">
                        +{department.categories.length - 4} more
                      </span>
                    )}
                    {(!department.categories || department.categories.length === 0) && (
                      <span className="text-xs text-slate-400">No categories</span>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-rw-border pt-4 mt-5">
                  <p className="text-xs text-slate-400">
                    Updated {formatDate(department.updatedAt)}
                  </p>
                  <button
                    type="button"
                    onClick={() => openDepartment(department)}
                    className="rounded-lg bg-rw-navy px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rw-navy-light"
                  >
                    Manage
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedDepartment && (
        <DepartmentModal
          key={selectedDepartment._id}
          department={selectedDepartment}
          loading={detailsLoading}
          error={detailsError}
          onClose={() => setSelectedDepartment(null)}
          onSave={handleSave}
          onToggleStatus={handleToggleStatus}
          saving={saving}
          updatingStatus={updatingStatus}
          feedback={feedback}
          actionError={actionError}
        />
      )}
    </div>
  );
};

export default Departments;

