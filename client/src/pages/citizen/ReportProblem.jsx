
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardList,
  Crosshair,
  FileText,
  ImagePlus,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";

import api from "../../services/api";

const DEFAULT_CENTER = [28.4744, 77.503];

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const CATEGORY_OPTIONS = [
  { value: "pothole", label: "Pothole" },
  { value: "broken_road", label: "Damaged road" },
  { value: "streetlight", label: "Broken streetlight" },
  { value: "traffic_signal", label: "Traffic signal issue" },
  { value: "waterlogging", label: "Waterlogging" },
  { value: "open_manhole", label: "Open manhole" },
  { value: "road_sign", label: "Damaged or missing road sign" },
  { value: "road_debris", label: "Road debris" },
  { value: "drainage", label: "Drainage issue" },
  { value: "other", label: "Other road or infrastructure issue" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", description: "Minor issue" },
  { value: "medium", label: "Medium", description: "Needs attention" },
  { value: "high", label: "High", description: "Significant hazard" },
  { value: "critical", label: "Critical", description: "Immediate safety risk" },
];

const INITIAL_FORM = {
  title: "",
  description: "",
  category: "pothole",
  priority: "medium",
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-rw-border bg-white px-4 py-3 text-sm text-rw-text outline-none transition placeholder:text-rw-placeholder focus:border-rw-primary focus:ring-4 focus:ring-orange-100";

const formatCoordinate = (value) => Number(value).toFixed(6);

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

function MapRecenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, Math.max(map.getZoom(), 15), {
        duration: 0.6,
      });
    }
  }, [map, position]);

  return null;
}

function LocationMap({ position, onPick }) {
  return (
    <div className="overflow-hidden rounded-xl border border-rw-border bg-rw-surface-muted">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={13}
        scrollWheelZoom
        className="w-full"
        style={{ height: "350px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onPick={onPick} />
        <MapRecenter position={position} />

        {position && (
          <CircleMarker
            center={position}
            radius={9}
            pathOptions={{
              color: "#ffffff",
              weight: 3,
              fillColor: "#f97316",
              fillOpacity: 1,
            }}
          >
            <Popup>Selected issue location</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}

const StepHeading = ({ number, icon: Icon, title, description }) => (
  <div className="mb-5 flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rw-primary-light text-rw-primary">
      <Icon size={20} />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-rw-muted">
        Step {number}
      </p>
      <h2 className="mt-1 text-lg font-bold text-rw-navy">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-rw-muted">{description}</p>
    </div>
  </div>
);

const ReportProblem = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [position, setPosition] = useState(null);
  const [locationSource, setLocationSource] = useState("map");
  const [images, setImages] = useState([]);
  const [fileNotice, setFileNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef(new Set());

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  };

  const handleMapPick = (coordinates) => {
    setPosition(coordinates);
    setLocationSource("map");
    setError("");
  };

  const handleUseMyLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError(
        "Your browser does not support location detection. Please select your location directly on the map."
      );
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition([coords.latitude, coords.longitude]);
        setLocationSource("device");
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError(
          "We couldn't access your current location. Allow location permission or select the point directly on the map."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  };

  const handleImageSelection = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    // Allow selecting the same file again after removing it.
    event.target.value = "";

    if (!selectedFiles.length) return;

    const remainingSlots = MAX_IMAGES - images.length;
    const acceptedFiles = [];
    const notices = [];

    if (selectedFiles.length > remainingSlots) {
      notices.push(`You can upload a maximum of ${MAX_IMAGES} photos.`);
    }

    for (const file of selectedFiles.slice(0, remainingSlots)) {
      if (!file.type.startsWith("image/")) {
        notices.push(`${file.name} is not an image.`);
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        notices.push(`${file.name} exceeds the 10 MB limit.`);
        continue;
      }

      acceptedFiles.push(file);
    }

    const preparedImages = acceptedFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      previewUrlsRef.current.add(preview);

      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${preview}`,
        file,
        preview,
      };
    });

    setImages((current) => [...current, ...preparedImages]);
    setFileNotice(notices.join(" "));
    setError("");
  };

  const removeImage = (imageId) => {
    const image = images.find((item) => item.id === imageId);

    if (image) {
      URL.revokeObjectURL(image.preview);
      previewUrlsRef.current.delete(image.preview);
    }

    setImages((current) => current.filter((item) => item.id !== imageId));
    setFileNotice("");
  };

  const resetForm = () => {
    images.forEach((image) => {
      URL.revokeObjectURL(image.preview);
      previewUrlsRef.current.delete(image.preview);
    });

    setForm(INITIAL_FORM);
    setPosition(null);
    setLocationSource("map");
    setImages([]);
    setFileNotice("");
    setError("");
    setSuccessData(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const title = form.title.trim();
    const description = form.description.trim();

    if (title.length < 5 || title.length > 100) {
      setError("Your title must contain between 5 and 100 characters.");
      return;
    }

    if (description.length < 10 || description.length > 1000) {
      setError(
        "Your description must contain between 10 and 1,000 characters."
      );
      return;
    }

    if (!form.category) {
      setError("Please select an issue category.");
      return;
    }

    if (!position) {
      setError("Please select the issue location on the map.");
      return;
    }

    const [latitude, longitude] = position;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError("Please select a valid geographic location.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData();

      payload.append("title", title);
      payload.append("description", description);
      payload.append("category", form.category);
      payload.append("priority", form.priority);

      // The backend expects GeoJSON [longitude, latitude],
      // whereas Leaflet provides [latitude, longitude].
      payload.append(
        "location",
        JSON.stringify({
          type: "Point",
          coordinates: [longitude, latitude],
        })
      );

      // Must match upload.array("images", 5) on the backend.
      images.forEach(({ file }) => {
        payload.append("images", file);
      });

      const response = await api.post("/reports", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.data?.success || !response.data?.report) {
        throw new Error(
          response.data?.message || "The report could not be created."
        );
      }

      setSuccessData(response.data);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Something went wrong while submitting your report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    const report = successData.report;
    const routing = successData.routing;
    const reportId = report.id || report._id;
    const reference = reportId
      ? String(reportId).slice(-8).toUpperCase()
      : "CREATED";

    return (
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-2xl border border-rw-border bg-white shadow-sm">
          <div className="border-b border-rw-border bg-rw-success-light px-6 py-10 text-center sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-rw-success shadow-sm">
              <CheckCircle2 size={34} />
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-rw-success">
              Report submitted
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-rw-navy">
              Thanks for speaking up.
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-rw-muted">
              Your report has been recorded. You can follow its progress and
              verify the outcome through RoadWatch.
            </p>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            <div className="rounded-xl border border-rw-border bg-rw-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-rw-muted">
                Report reference
              </p>
              <p className="mt-1 break-all text-lg font-bold text-rw-navy">
                #{reference}
              </p>

              <div className="mt-3 flex items-start gap-3">
                <FileText size={18} className="mt-0.5 shrink-0 text-rw-primary" />
                <div>
                  <p className="font-semibold text-rw-navy">{report.title}</p>
                  <p className="mt-1 text-sm capitalize text-rw-muted">
                    {report.category?.replaceAll("_", " ")} ·{" "}
                    {report.status?.replaceAll("_", " ")}
                  </p>
                </div>
              </div>
            </div>

            {routing?.officer ? (
              <div className="flex items-start gap-3 rounded-xl border border-rw-border p-4">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-rw-success" />
                <div>
                  <p className="font-semibold text-rw-navy">
                    Your report has been assigned
                  </p>
                  <p className="mt-1 text-sm leading-6 text-rw-muted">
                    {routing.department?.name
                      ? `${routing.department.name} · `
                      : ""}
                    {routing.serviceArea?.name
                      ? `${routing.serviceArea.name} · `
                      : ""}
                    Officer: {routing.officer.name}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-rw-border p-4">
                <TriangleAlert size={20} className="mt-0.5 shrink-0 text-rw-warning" />
                <div>
                  <p className="font-semibold text-rw-navy">
                    Report saved successfully
                  </p>
                  <p className="mt-1 text-sm leading-6 text-rw-muted">
                    {routing?.message ||
                      "Your report is recorded. Automatic assignment may still be pending."}
                    {" "}Check your reports for further updates.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link
                to="/citizen/reports"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rw-primary px-5 py-3 font-semibold text-white transition hover:bg-rw-primary-dark"
              >
                <ClipboardList size={18} />
                View my reports
                <ArrowRight size={18} />
              </Link>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rw-border px-5 py-3 font-semibold text-rw-navy transition hover:bg-rw-surface-muted"
              >
                Report another issue
              </button>
            </div>

            <Link
              to="/citizen"
              className="block text-center text-sm font-medium text-rw-muted transition hover:text-rw-primary"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page introduction */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/citizen"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-rw-muted transition hover:text-rw-primary"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rw-primary">
            Your community, your voice
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-rw-navy sm:text-4xl">
            Report a problem.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-rw-muted sm:text-base">
            Describe the issue, mark its location, and help the right people
            understand what needs attention.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-rw-border bg-white px-3 py-2 text-xs font-medium text-rw-muted sm:self-auto">
          <ShieldCheck size={16} className="text-rw-success" />
          Official RoadWatch report
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main form */}
        <form onSubmit={handleSubmit} className="min-w-0 space-y-6">
          {/* Details */}
          <section className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm sm:p-7">
            <StepHeading
              number="01"
              icon={FileText}
              title="Tell us what happened"
              description="Give the issue a clear title and choose the category that fits best."
            />

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="report-title"
                  className="text-sm font-semibold text-rw-navy"
                >
                  Report title <span className="text-rw-danger">*</span>
                </label>

                <input
                  id="report-title"
                  name="title"
                  type="text"
                  required
                  minLength={5}
                  maxLength={100}
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="e.g. Large pothole near the main gate"
                  className={fieldClass}
                />

                <div className="mt-1 flex justify-between gap-3 text-xs text-rw-muted">
                  <span>Be specific about the problem.</span>
                  <span>{form.title.length}/100</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="report-category"
                  className="text-sm font-semibold text-rw-navy"
                >
                  Issue category <span className="text-rw-danger">*</span>
                </label>

                <select
                  id="report-category"
                  name="category"
                  required
                  value={form.category}
                  onChange={(event) =>
                    updateField("category", event.target.value)
                  }
                  className={fieldClass}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="report-description"
                  className="text-sm font-semibold text-rw-navy"
                >
                  Describe the problem <span className="text-rw-danger">*</span>
                </label>

                <textarea
                  id="report-description"
                  name="description"
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={5}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  placeholder="Describe what is damaged, where it is, and how it affects people. Avoid including private information."
                  className={`${fieldClass} resize-y`}
                />

                <div className="mt-1 flex justify-between gap-3 text-xs text-rw-muted">
                  <span>At least 10 characters.</span>
                  <span>{form.description.length}/1000</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="report-priority"
                  className="text-sm font-semibold text-rw-navy"
                >
                  How urgent is the issue?
                </label>

                <select
                  id="report-priority"
                  name="priority"
                  value={form.priority}
                  onChange={(event) =>
                    updateField("priority", event.target.value)
                  }
                  className={fieldClass}
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} — {option.description}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs leading-5 text-rw-muted">
                  Choose critical only when the issue presents an immediate
                  safety risk.
                </p>
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm sm:p-7">
            <StepHeading
              number="02"
              icon={MapPin}
              title="Pinpoint the location"
              description="Click directly on the map where the problem can be found."
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-rw-muted">
                {position
                  ? locationSource === "device"
                    ? "Location selected from your device."
                    : "Location selected on the map."
                  : "No location selected yet."}
              </p>

              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locating}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-rw-navy transition hover:border-rw-primary hover:bg-rw-primary-light disabled:cursor-wait disabled:opacity-60 sm:self-auto"
              >
                {locating ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Crosshair size={17} />
                )}
                {locating ? "Finding location..." : "Use my location"}
              </button>
            </div>

            <LocationMap position={position} onPick={handleMapPick} />

            <div className="mt-4 rounded-xl bg-rw-background p-4">
              {position ? (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-rw-primary" />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-rw-navy">
                      Location selected
                    </p>

                    <p className="mt-1 break-all font-mono text-xs text-rw-muted">
                      {formatCoordinate(position[0])},{" "}
                      {formatCoordinate(position[1])}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-rw-muted">
                      Latitude, longitude. These will be sent to RoadWatch
                      in the correct GeoJSON coordinate order.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPosition(null);
                      setLocationSource("map");
                    }}
                    aria-label="Clear selected location"
                    title="Clear location"
                    className="rounded-lg p-2 text-rw-muted transition hover:bg-white hover:text-rw-danger"
                  >
                    <X size={17} />
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-rw-primary" />
                  <div>
                    <p className="text-sm font-semibold text-rw-navy">
                      Select the issue location
                    </p>
                    <p className="mt-1 text-sm leading-6 text-rw-muted">
                      The map starts around Greater Noida. Pan or zoom to the
                      correct place, then click to drop the marker. You can
                      also use your device location.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Evidence */}
          <section className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm sm:p-7">
            <StepHeading
              number="03"
              icon={Camera}
              title="Add photos"
              description="Photos can help the responsible team understand the problem. This step is optional."
            />

            <input
              ref={fileInputRef}
              id="report-images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelection}
              className="sr-only"
            />

            <label
              htmlFor="report-images"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-rw-border bg-rw-background px-5 py-8 text-center transition hover:border-rw-primary hover:bg-rw-primary-light ${
                images.length >= MAX_IMAGES
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-rw-primary shadow-sm">
                <ImagePlus size={23} />
              </div>

              <p className="mt-3 text-sm font-semibold text-rw-navy">
                Choose photos from your device
              </p>

              <p className="mt-1 text-xs text-rw-muted">
                Images only · Up to 5 photos · 10 MB per image
              </p>

              <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rw-primary px-4 py-2.5 text-sm font-semibold text-white">
                <Upload size={16} />
                Select images
              </span>
            </label>

            {fileNotice && (
              <p className="mt-3 rounded-lg bg-rw-warning-light px-3 py-2 text-sm text-rw-warning">
                {fileNotice}
              </p>
            )}

            {images.length > 0 && (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-rw-navy">
                    Selected photos
                  </p>
                  <span className="text-xs text-rw-muted">
                    {images.length}/{MAX_IMAGES}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="group relative overflow-hidden rounded-xl border border-rw-border bg-rw-background"
                    >
                      <img
                        src={image.preview}
                        alt={image.file.name}
                        className="h-36 w-full object-cover"
                      />

                      <div className="flex items-center justify-between gap-2 p-2">
                        <p className="min-w-0 truncate text-xs text-rw-muted">
                          {image.file.name}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          aria-label={`Remove ${image.file.name}`}
                          className="shrink-0 rounded-md p-1.5 text-rw-muted transition hover:bg-rw-danger-light hover:text-rw-danger"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Submission error */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rw-danger/20 bg-rw-danger-light p-4"
            >
              <TriangleAlert
                size={20}
                className="mt-0.5 shrink-0 text-rw-danger"
              />

              <div className="flex-1">
                <p className="text-sm font-semibold text-rw-danger">
                  We couldn't submit your report
                </p>
                <p className="mt-1 text-sm leading-6 text-rw-danger">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
                className="rounded-md p-1 text-rw-danger transition hover:bg-white/70"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* Submit */}
          <div className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-rw-navy">
                  Ready to submit?
                </p>
                <p className="mt-1 text-sm leading-6 text-rw-muted">
                  Double-check the location and details before sending.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || locating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rw-primary px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-rw-primary-dark hover:shadow-md disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={19} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit report
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

            <p className="mt-4 border-t border-rw-border pt-4 text-xs leading-5 text-rw-muted">
              By submitting, you confirm that the information is accurate
              to the best of your knowledge. Please don't put yourself in
              danger to take photographs.
            </p>
          </div>
        </form>

        {/* Guidance sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl bg-rw-navy p-5 text-white sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-orange-300">
              <ShieldCheck size={23} />
            </div>

            <h2 className="mt-4 text-xl font-bold">
              What makes a useful report?
            </h2>

            <div className="mt-5 space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-orange-300" />
                <div>
                  <p className="text-sm font-semibold">Be specific</p>
                  <p className="mt-1 text-sm leading-5 text-slate-300">
                    Describe what is wrong rather than simply saying the road
                    is bad.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-orange-300" />
                <div>
                  <p className="text-sm font-semibold">Choose the exact spot</p>
                  <p className="mt-1 text-sm leading-5 text-slate-300">
                    Accurate coordinates help route issues to the right area.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-orange-300" />
                <div>
                  <p className="text-sm font-semibold">Add clear evidence</p>
                  <p className="mt-1 text-sm leading-5 text-slate-300">
                    When safe, include photos that show the issue clearly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-rw-border bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rw-primary-light text-rw-primary">
                <ClipboardList size={20} />
              </div>
              <h2 className="font-bold text-rw-navy">
                What happens next?
              </h2>
            </div>

            <ol className="mt-5 space-y-4">
              {[
                ["Report recorded", "Your issue is saved to RoadWatch."],
                ["Authority routing", "The backend attempts to match the location to a service area and department."],
                ["Track the outcome", "Follow progress and verify the resolution."],
              ].map(([title, description], index) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rw-surface-muted text-xs font-bold text-rw-navy">
                    {index + 1}
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-rw-navy">
                      {title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-rw-muted">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ReportProblem;

