import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Polygon,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import api from "../services/api";

const DEFAULT_CENTER = [28.4744, 77.503];

const formatDate = (value) => {
  if (!value) return "Not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  "Something went wrong. Please try again.";

const getBoundaryFeature = (boundary) => {
  if (
    !boundary ||
    !["Polygon", "MultiPolygon"].includes(boundary.type) ||
    !Array.isArray(boundary.coordinates)
  ) {
    return null;
  }

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: boundary.type,
      coordinates: boundary.coordinates,
    },
  };
};

const pointsToLatLngs = (points) =>
  points.map(([longitude, latitude]) => [latitude, longitude]);

const closeRing = (points) => {
  const ring = points.map(([longitude, latitude]) => [longitude, latitude]);

  if (ring.length < 3) return null;

  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }

  if (ring.length < 4) return null;

  return ring;
};

const MapBounds = ({ feature }) => {
  const map = useMap();

  useEffect(() => {
    if (!feature) return;

    try {
      const bounds = L.geoJSON(feature).getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });
      }
    } catch {
      // Leave the map at its default view if geometry is invalid.
    }
  }, [feature, map]);

  return null;
};

const MapClickHandler = ({ enabled, onAddPoint }) => {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onAddPoint([event.latlng.lng, event.latlng.lat]);
    },
  });

  return null;
};

const BoundaryMap = ({
  boundary,
  draftPoints,
  drawingEnabled = false,
  onAddPoint,
  heightClass = "h-[320px]",
}) => {
  const feature = useMemo(() => getBoundaryFeature(boundary), [boundary]);
  const draftPositions = pointsToLatLngs(draftPoints || []);

  return (
    <div className={`relative z-0 ${heightClass} overflow-hidden rounded-xl border border-rw-border`}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {feature && (
          <>
            <GeoJSON
              key={JSON.stringify(boundary)}
              data={feature}
              style={() => ({
                color: "#f97316",
                weight: 3,
                opacity: 0.95,
                fillColor: "#fb923c",
                fillOpacity: 0.16,
              })}
            />
            <MapBounds feature={feature} />
          </>
        )}

        {draftPositions.length >= 3 && (
          <Polygon
            positions={draftPositions}
            pathOptions={{
              color: "#0f766e",
              weight: 3,
              dashArray: "6 5",
              fillColor: "#14b8a6",
              fillOpacity: 0.16,
            }}
          />
        )}

        {draftPositions.length === 2 && (
          <Polyline
            positions={draftPositions}
            pathOptions={{ color: "#0f766e", weight: 3, dashArray: "6 5" }}
          />
        )}

        {draftPositions.map((position, index) => (
          <CircleMarker
            key={`${position[0]}-${position[1]}-${index}`}
            center={position}
            radius={5}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: "#0f766e",
              fillOpacity: 1,
            }}
          />
        ))}

        <MapClickHandler
          enabled={drawingEnabled}
          onAddPoint={onAddPoint}
        />
      </MapContainer>

      {drawingEnabled && (
        <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-lg border border-rw-border bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
          Click the map to add boundary points
        </div>
      )}
    </div>
  );
};

const ServiceAreas = () => {
  const [serviceAreas, setServiceAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedArea, setSelectedArea] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("Greater Noida");
  const [draftPoints, setDraftPoints] = useState([]);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [boundaryChanged, setBoundaryChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState("");

  const loadServiceAreas = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setPageError("");

    try {
      const response = await api.get("/admin/service-areas");
      setServiceAreas(
        Array.isArray(response.data?.serviceAreas)
          ? response.data.serviceAreas
          : [],
      );
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadServiceAreas();
  }, [loadServiceAreas]);

  const cities = useMemo(
    () =>
      [...new Set(serviceAreas.map((area) => area.city).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [serviceAreas],
  );

  const counts = useMemo(
    () => ({
      total: serviceAreas.length,
      active: serviceAreas.filter((area) => area.isActive).length,
      inactive: serviceAreas.filter((area) => !area.isActive).length,
      osm: serviceAreas.filter(
        (area) => area.source?.provider === "openstreetmap",
      ).length,
    }),
    [serviceAreas],
  );

  const visibleAreas = useMemo(() => {
    const query = search.trim().toLowerCase();

    return serviceAreas
      .filter((area) => {
        if (activeFilter === "active") return area.isActive === true;
        if (activeFilter === "inactive") return area.isActive === false;
        return true;
      })
      .filter((area) => cityFilter === "all" || area.city === cityFilter)
      .filter((area) => {
        if (!query) return true;

        return [
          area.name,
          area.city,
          area.source?.provider,
          area.source?.displayName,
          area.source?.osmId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }, [serviceAreas, search, activeFilter, cityFilter]);

  const resetModal = (force = false) => {
    if (saving && !force) return;

    setModalOpen(false);
    setSelectedArea(null);
    setFormName("");
    setFormCity("Greater Noida");
    setDraftPoints([]);
    setDrawingEnabled(false);
    setBoundaryChanged(false);
    setFormError("");
    setFormSuccess("");
    setDetailLoading(false);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedArea(null);
    setFormName("");
    setFormCity("Greater Noida");
    setDraftPoints([]);
    setDrawingEnabled(true);
    setBoundaryChanged(true);
    setFormError("");
    setFormSuccess("");
    setModalOpen(true);
  };

  const openAreaModal = async (area) => {
    setModalMode("edit");
    setSelectedArea(area);
    setFormName(area.name || "");
    setFormCity(area.city || "");
    setDraftPoints([]);
    setDrawingEnabled(false);
    setBoundaryChanged(false);
    setFormError("");
    setFormSuccess("");
    setModalOpen(true);
    setDetailLoading(true);

    try {
      const response = await api.get(`/admin/service-areas/${area._id}`);
      const detailedArea = response.data?.serviceArea;

      if (!detailedArea) {
        throw new Error("Service area details were not returned.");
      }

      setSelectedArea(detailedArea);
      setFormName(detailedArea.name || "");
      setFormCity(detailedArea.city || "");
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  };

  const startBoundaryDrawing = () => {
    setDraftPoints([]);
    setDrawingEnabled(true);
    setBoundaryChanged(true);
    setFormError("");
    setFormSuccess("");
  };

  const undoLastPoint = () => {
    setDraftPoints((current) => current.slice(0, -1));
    setFormError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const name = formName.trim();
    const city = formCity.trim();

    if (name.length < 2 || name.length > 100) {
      setFormError("The service area name must be between 2 and 100 characters.");
      return;
    }

    if (!city || city.length > 100) {
      setFormError("Enter a valid city name (up to 100 characters).");
      return;
    }

    let boundary = null;

    if (modalMode === "create" || boundaryChanged) {
      const distinctPoints = new Set(
        draftPoints.map(([longitude, latitude]) => `${longitude},${latitude}`),
      );
      boundary = distinctPoints.size >= 3 ? closeRing(draftPoints) : null;

      if (!boundary) {
        setFormError("Add at least three distinct boundary points by clicking the map.");
        return;
      }
    }

    const payload = { name, city };

    if (boundary) {
      payload.boundary = {
        type: "Polygon",
        coordinates: [boundary],
      };
    }

    setSaving(true);
    setFormError("");
    setFormSuccess("");
    setPageError("");

    try {
      if (modalMode === "create") {
        const response = await api.post("/admin/service-areas", payload);
        const createdArea = response.data?.serviceArea;

        if (!createdArea) {
          throw new Error("The created service area was not returned.");
        }

        setServiceAreas((current) =>
          [...current, createdArea].sort(
            (a, b) =>
              a.city.localeCompare(b.city) || a.name.localeCompare(b.name),
          ),
        );
        setSuccessMessage(response.data?.message || "Service area created successfully.");
        resetModal(true);
      } else {
        if (!selectedArea?._id) {
          throw new Error("Select a service area before saving.");
        }

        const response = await api.patch(
          `/admin/service-areas/${selectedArea._id}`,
          payload,
        );
        const updatedArea = response.data?.serviceArea;

        if (!updatedArea) {
          throw new Error("The updated service area was not returned.");
        }

        setSelectedArea((current) => ({ ...current, ...updatedArea }));
        setFormName(updatedArea.name || name);
        setFormCity(updatedArea.city || city);
        setBoundaryChanged(false);
        setDrawingEnabled(false);
        setDraftPoints([]);
        setFormSuccess(response.data?.message || "Service area updated successfully.");
        setServiceAreas((current) =>
          current.map((area) =>
            area._id === updatedArea._id ? { ...area, ...updatedArea } : area,
          ),
        );
      }
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (area) => {
    const nextStatus = !area.isActive;
    setStatusUpdatingId(area._id);
    setPageError("");
    setSuccessMessage("");

    try {
      const response = await api.patch(
        `/admin/service-areas/${area._id}/status`,
        { isActive: nextStatus },
      );

      const updatedArea = response.data?.serviceArea || {
        ...area,
        isActive: nextStatus,
      };

      setServiceAreas((current) =>
        current.map((item) =>
          item._id === area._id ? { ...item, ...updatedArea } : item,
        ),
      );

      setSelectedArea((current) =>
        current?._id === area._id
          ? { ...current, ...updatedArea }
          : current,
      );

      setSuccessMessage(
        response.data?.message ||
          `Service area ${nextStatus ? "activated" : "deactivated"}.`,
      );
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setStatusUpdatingId("");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setActiveFilter("all");
    setCityFilter("all");
  };

  const isOsmArea = selectedArea?.source?.provider === "openstreetmap";
  const selectedFeature = selectedArea?.boundary || null;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
            Geographic operations
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">
            Service Areas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage the geographic boundaries used to route road reports to the responsible officers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadServiceAreas(true)}
            disabled={loading || refreshing}
            className="rounded-xl border border-rw-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-rw-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-primary-dark"
          >
            Create service area
          </button>
        </div>
      </header>

      {successMessage && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {successMessage}
        </div>
      )}

      {pageError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Unable to complete the request</p>
          <p className="mt-1">{pageError}</p>
          <button
            type="button"
            onClick={() => loadServiceAreas()}
            className="mt-3 font-semibold underline underline-offset-2"
          >
            Try loading areas again
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total service areas", value: counts.total },
          { label: "Active areas", value: counts.active },
          { label: "Inactive areas", value: counts.inactive },
          { label: "OSM-managed boundaries", value: counts.osm },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold tabular-nums text-rw-navy">
              {loading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-2xl border border-rw-border bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_190px_190px_auto] md:items-end">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search areas
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, city or OSM record"
              className="w-full rounded-xl border border-rw-border bg-white px-3.5 py-2.5 text-sm text-rw-text outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </span>
            <select
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value)}
              className="w-full rounded-xl border border-rw-border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              City
            </span>
            <select
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
              className="w-full rounded-xl border border-rw-border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </label>

          {(search || activeFilter !== "all" || cityFilter !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rw-border pt-4">
          <p className="text-sm text-slate-500">
            {loading ? "Loading service areas..." : `${visibleAreas.length} of ${serviceAreas.length} service areas`}
          </p>
          <p className="text-xs text-slate-400">
            OSM-imported boundaries are read-only here.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse rounded-2xl border border-rw-border bg-white p-5">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="mt-4 h-6 w-2/3 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
              <div className="mt-6 h-10 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : !pageError && visibleAreas.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-rw-border-dark bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-bold text-rw-navy">
            {serviceAreas.length ? "No matching service areas" : "No service areas found"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {serviceAreas.length
              ? "Try changing the search or filters."
              : "Create a service area and draw its geographic boundary on the map."}
          </p>
          {serviceAreas.length > 0 ? (
            <button type="button" onClick={clearFilters} className="mt-4 text-sm font-semibold text-orange-700 hover:text-orange-800">
              Clear filters
            </button>
          ) : (
            <button type="button" onClick={openCreateModal} className="mt-4 rounded-xl bg-rw-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-rw-primary-dark">
              Create service area
            </button>
          )}
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleAreas.map((area) => {
            const osmManaged = area.source?.provider === "openstreetmap";

            return (
              <article key={area._id} className="flex min-w-0 flex-col rounded-2xl border border-rw-border bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{area.city}</p>
                    <h2 className="mt-2 break-words text-lg font-bold text-rw-navy">{area.name}</h2>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${area.isActive ? "border-green-200 bg-green-50 text-green-800" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
                    {area.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-rw-border pt-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Boundary source</span>
                    <span className="text-right font-medium text-slate-700">
                      {osmManaged ? "OpenStreetMap" : "RoadWatch"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Geometry</span>
                    <span className="text-right font-medium text-slate-700">
                      {area.source?.osmType ? `OSM ${area.source.osmType}` : area.source?.provider === "openstreetmap" ? "Imported boundary" : "Custom polygon"}
                    </span>
                  </div>
                  {area.source?.osmId && (
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-slate-500">OSM ID</span>
                      <span className="break-all text-right font-medium text-slate-700">{area.source.osmId}</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Created</span>
                    <span className="text-right text-slate-700">{formatDate(area.createdAt)}</span>
                  </div>
                </div>

                <div className="mt-auto flex gap-2 border-t border-rw-border pt-4">
                  <button
                    type="button"
                    onClick={() => openAreaModal(area)}
                    className="flex-1 rounded-xl bg-rw-navy px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-navy-light"
                  >
                    Manage area
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStatus(area)}
                    disabled={statusUpdatingId === area._id}
                    className="rounded-xl border border-rw-border px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {statusUpdatingId === area._id
                      ? "Saving..."
                      : area.isActive
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[1100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) resetModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-area-dialog-title"
            className="max-h-[96vh] w-full max-w-5xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-rw-border bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 id="service-area-dialog-title" className="text-xl font-bold text-rw-navy">
                  {modalMode === "create" ? "Create service area" : "Manage service area"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {modalMode === "create"
                    ? "Add a name, city, and valid polygon boundary."
                    : "Update area details, review the boundary, and view assigned officers."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => resetModal()}
                disabled={saving}
                aria-label="Close dialog"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            {detailLoading ? (
              <div className="space-y-4 p-6">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-[300px] animate-pulse rounded-xl bg-slate-100" />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6 p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Service area name</span>
                    <input
                      value={formName}
                      onChange={(event) => { setFormName(event.target.value); setFormError(""); setFormSuccess(""); }}
                      minLength={2}
                      maxLength={100}
                      required
                      placeholder="e.g. Knowledge Park II"
                      className="w-full rounded-xl border border-rw-border px-3.5 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">City</span>
                    <input
                      value={formCity}
                      onChange={(event) => { setFormCity(event.target.value); setFormError(""); setFormSuccess(""); }}
                      maxLength={100}
                      required
                      placeholder="e.g. Greater Noida"
                      className="w-full rounded-xl border border-rw-border px-3.5 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    />
                  </label>
                </div>

                <section>
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-rw-navy">Geographic boundary</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {modalMode === "create"
                          ? "Click at least three points around the area, in order. The first point will be connected to close the polygon."
                          : isOsmArea
                            ? "This boundary was imported from OpenStreetMap and cannot be manually replaced."
                            : drawingEnabled
                              ? "Click at least three points to define a replacement polygon."
                              : "View the existing boundary, or choose Replace boundary to draw a new polygon."}
                      </p>
                    </div>

                    {modalMode === "edit" && !isOsmArea && !drawingEnabled && (
                      <button
                        type="button"
                        onClick={startBoundaryDrawing}
                        className="w-fit rounded-xl border border-rw-border px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Replace boundary
                      </button>
                    )}
                  </div>

                  <BoundaryMap
                    boundary={selectedFeature}
                    draftPoints={draftPoints}
                    drawingEnabled={drawingEnabled}
                    onAddPoint={(point) => {
                      setDraftPoints((current) => [...current, point]);
                      setFormError("");
                      setFormSuccess("");
                    }}
                    heightClass="h-[330px]"
                  />

                  {drawingEnabled && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">{draftPoints.length}</span> boundary points added
                        {draftPoints.length < 3 && " — add at least three to continue."}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={undoLastPoint}
                          disabled={draftPoints.length === 0 || saving}
                          className="rounded-lg border border-rw-border px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                          Undo last point
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraftPoints([])}
                          disabled={draftPoints.length === 0 || saving}
                          className="rounded-lg border border-rw-border px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                          Clear points
                        </button>
                        {modalMode === "edit" && (
                          <button
                            type="button"
                            onClick={() => { setDrawingEnabled(false); setBoundaryChanged(false); setDraftPoints([]); setFormError(""); }}
                            className="rounded-lg border border-rw-border px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Cancel drawing
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                {selectedArea?.source?.provider === "openstreetmap" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                    This area uses an OpenStreetMap-imported boundary. You can update its name or city, but to change its geometry, use the backend OSM import process.
                  </div>
                )}

                {formError && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {formSuccess}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-rw-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  {modalMode === "edit" && selectedArea && (
                    <button
                      type="button"
                      onClick={() => toggleStatus(selectedArea)}
                      disabled={statusUpdatingId === selectedArea._id || saving}
                      className="rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {statusUpdatingId === selectedArea._id
                        ? "Updating status..."
                        : selectedArea.isActive
                          ? "Deactivate area"
                          : "Activate area"}
                    </button>
                  )}

                  <div className="flex flex-col-reverse gap-3 sm:ml-auto sm:flex-row">
                    <button
                      type="button"
                      onClick={() => resetModal()}
                      disabled={saving}
                      className="rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={saving || detailLoading}
                      className="rounded-xl bg-rw-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-rw-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : modalMode === "create"
                          ? "Create service area"
                          : "Save changes"}
                    </button>
                  </div>
                </div>

                {modalMode === "edit" && selectedArea && (
                  <section className="border-t border-rw-border pt-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-rw-navy">Assigned officers</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Officers whose account includes this service area.
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {selectedArea.officerCount ?? selectedArea.officers?.length ?? 0} officers
                      </span>
                    </div>

                    {!selectedArea.officers?.length ? (
                      <p className="mt-4 rounded-xl border border-dashed border-rw-border-dark px-4 py-6 text-center text-sm text-slate-500">
                        No officers are currently assigned to this service area.
                      </p>
                    ) : (
                      <div className="mt-4 overflow-x-auto rounded-xl border border-rw-border">
                        <table className="w-full min-w-[500px] text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Officer</th>
                              <th className="px-4 py-3 font-semibold">Department</th>
                              <th className="px-4 py-3 font-semibold">Account status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rw-border">
                            {selectedArea.officers.map((officer) => (
                              <tr key={officer._id}>
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-slate-800">{officer.name}</p>
                                  <p className="mt-1 text-xs text-slate-500">{officer.email}</p>
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {officer.department?.name || "Not assigned"}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${officer.isActive ? "bg-green-50 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                                    {officer.isActive ? "Active" : "Inactive"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                )}
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default ServiceAreas;
