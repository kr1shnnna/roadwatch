
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const formatDate = (value) => {
  if (!value) return "Unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const getInitials = (name) =>
  (name || "RoadWatch User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState(user || null);
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/auth/me");
        const fetchedUser = response.data?.user;

        if (!fetchedUser) {
          throw new Error("Profile information was not returned.");
        }

        if (!cancelled) {
          setProfile(fetchedUser);
          setName(fetchedUser.name || "");
          updateUser(fetchedUser);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "We couldn't refresh your account details. You can still view your saved profile."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [updateUser]);

  const handleSave = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedName = name.trim();

    if (normalizedName.length < 2 || normalizedName.length > 50) {
      setError("Your name must contain between 2 and 50 characters.");
      return;
    }

    if (normalizedName === profile?.name) {
      setSuccess("Your details are already up to date.");
      return;
    }

    setSaving(true);

    try {
      const response = await api.patch("/auth/me", {
        name: normalizedName,
      });

      const updatedUser = response.data?.user;

      if (!updatedUser) {
        throw new Error("The updated profile was not returned.");
      }

      setProfile(updatedUser);
      setName(updatedUser.name || "");
      updateUser(updatedUser);
      setSuccess("Your changes have been saved.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "We couldn't save your changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = (profile?.role || "citizen")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

  const isActive = profile?.isActive !== false;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-6">
      {/* Page introduction */}
      <header>
        <Link
          to="/citizen"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-rw-muted transition hover:text-rw-primary"
        >
          <ArrowLeft size={16} />
          Overview
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rw-primary">
              Account / Personal details
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-rw-navy sm:text-4xl lg:text-5xl">
              Your space.
              <span className="text-rw-primary"> Your details.</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-rw-muted sm:text-base">
              The person behind every report. Keep your account information
              accurate so your RoadWatch experience stays yours.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 self-start text-xs font-medium text-rw-muted sm:self-auto">
            <span
              className={`h-2 w-2 rounded-full ${
                isActive ? "bg-rw-success" : "bg-rw-danger"
              }`}
            />
            Account {isActive ? "active" : "inactive"}
          </span>
        </div>
      </header>

      {/* Main two-column profile */}
      <div className="grid items-start gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        {/* Identity panel */}
        <aside className="relative isolate overflow-hidden rounded-2xl bg-rw-navy text-white">
          {/* Subtle road-inspired detail */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 top-24 h-64 w-32 rotate-[28deg] border-x border-dashed border-white/[0.12]"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full border border-white/[0.08]"
          />

          <div className="relative p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                RoadWatch
              </span>

              <ShieldCheck
                size={19}
                className="text-orange-300"
                aria-label="Account security"
              />
            </div>

            <div className="mt-12">
              <div className="flex h-[76px] w-[76px] items-center justify-center rounded-2xl border border-orange-300/30 bg-rw-primary text-2xl font-bold tracking-tight text-white">
                {getInitials(profile?.name || user?.name)}
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                Your account
              </p>

              <h2 className="mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl">
                {profile?.name || user?.name || "RoadWatch member"}
              </h2>

              <p className="mt-3 break-all text-sm leading-6 text-slate-300">
                {profile?.email || user?.email || "Email unavailable"}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/10 pt-6">
              <span className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200">
                {roleLabel}
              </span>

              <span
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                  isActive
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-red-400/10 text-red-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-emerald-300" : "bg-red-300"
                  }`}
                />
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="max-w-xs text-sm leading-6 text-slate-300">
                Every report starts with a member of the community who cares
                enough to speak up.
              </p>

              <Link
                to="/citizen/reports"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-orange-300"
              >
                Your reporting history
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-between border-t border-white/10 bg-white/[0.03] px-6 py-4 sm:px-8">
            <span className="text-xs text-slate-400">
              Member since
            </span>

            <span className="text-sm font-semibold text-slate-200">
              {formatDate(profile?.createdAt)}
            </span>
          </div>
        </aside>

        {/* Personal details form */}
        <section className="rounded-2xl border border-rw-border bg-white shadow-sm">
          <div className="border-b border-rw-border px-5 py-5 sm:px-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rw-primary-light text-rw-primary">
                <UserRound size={21} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-rw-primary">
                  Personal information
                </p>

                <h2 className="mt-1 text-xl font-bold text-rw-navy">
                  Make it yours.
                </h2>

                <p className="mt-2 text-sm leading-6 text-rw-muted">
                  Update the name associated with your reports.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-5 sm:p-7">
            <div>
              <label
                htmlFor="profile-name"
                className="text-sm font-semibold text-rw-navy"
              >
                Full name
              </label>

              <input
                id="profile-name"
                name="name"
                type="text"
                minLength={2}
                maxLength={50}
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                  setSuccess("");
                }}
                placeholder="Enter your full name"
                className="mt-2 w-full rounded-xl border border-rw-border bg-white px-4 py-3.5 text-sm text-rw-text outline-none transition placeholder:text-rw-placeholder focus:border-rw-primary focus:ring-4 focus:ring-orange-100"
              />

              <p className="mt-2 text-xs text-rw-muted">
                Between 2 and 50 characters.
              </p>
            </div>

            <div className="mt-6">
              <label
                htmlFor="profile-email"
                className="text-sm font-semibold text-rw-navy"
              >
                Registered email
              </label>

              <div className="mt-2 flex items-center gap-3 rounded-xl border border-rw-border bg-rw-surface-muted px-4 py-3.5">
                <Mail
                  size={18}
                  className="shrink-0 text-rw-muted"
                />

                <span
                  id="profile-email"
                  className="min-w-0 flex-1 break-all text-sm text-rw-text-secondary"
                >
                  {profile?.email || user?.email || "Email unavailable"}
                </span>

                <LockKeyhole
                  size={16}
                  className="shrink-0 text-rw-placeholder"
                  aria-label="Read only"
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-rw-muted">
                Your registered email is read-only.
              </p>
            </div>

            {/* Feedback */}
            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-rw-danger/20 bg-rw-danger-light px-4 py-3 text-sm leading-6 text-rw-danger"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-rw-success/20 bg-rw-success-light px-4 py-3 text-sm text-rw-success"
              >
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                {success}
              </div>
            )}

            <div className="mt-7 flex flex-col gap-4 border-t border-rw-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xs text-xs leading-5 text-rw-muted">
                Only your name can be edited from this page. Your access role
                stays protected.
              </p>

              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-rw-primary px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-rw-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Saving...
                  </>
                ) : success ? (
                  <>
                    <Check size={18} />
                    Save changes
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </form>

          {loading && (
            <div className="flex items-center gap-2 border-t border-rw-border px-5 py-3 text-xs text-rw-muted sm:px-7">
              <LoaderCircle size={14} className="animate-spin" />
              Syncing account details...
            </div>
          )}
        </section>
      </div>

      {/* Account record */}
      <section className="overflow-hidden rounded-2xl border border-rw-border bg-white">
        <div className="flex flex-col gap-2 border-b border-rw-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-rw-muted">
              Account record
            </p>
            <h2 className="mt-1 text-lg font-bold text-rw-navy">
              Your details at a glance
            </h2>
          </div>

          <span className="text-xs text-rw-muted">
            Information from your RoadWatch account
          </span>
        </div>

        <div className="grid divide-y divide-rw-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-start gap-3 px-5 py-5 sm:px-7">
            <Mail size={18} className="mt-0.5 shrink-0 text-rw-primary" />
            <div className="min-w-0">
              <p className="text-xs text-rw-muted">Email address</p>
              <p className="mt-1 break-all text-sm font-semibold text-rw-navy">
                {profile?.email || user?.email || "Unavailable"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 px-5 py-5 sm:px-7">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-rw-primary" />
            <div>
              <p className="text-xs text-rw-muted">Account permissions</p>
              <p className="mt-1 text-sm font-semibold text-rw-navy">
                {roleLabel}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 px-5 py-5 sm:px-7">
            <Clock3 size={18} className="mt-0.5 shrink-0 text-rw-primary" />
            <div>
              <p className="text-xs text-rw-muted">Date joined</p>
              <p className="mt-1 text-sm font-semibold text-rw-navy">
                {formatDate(profile?.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related citizen actions */}
      <section className="flex flex-col gap-4 rounded-2xl border border-rw-border bg-rw-background p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rw-primary">
            <MapPin size={20} />
          </div>

          <div>
            <h2 className="font-bold text-rw-navy">
              Your voice makes a difference.
            </h2>
            <p className="mt-1 text-sm leading-6 text-rw-muted">
              Keep track of the local issues you've reported.
            </p>
          </div>
        </div>

        <Link
          to="/citizen/reports"
          className="inline-flex shrink-0 items-center justify-center gap-2 text-sm font-semibold text-rw-navy transition hover:text-rw-primary"
        >
          View my reports
          <ChevronRight size={17} />
        </Link>
      </section>
    </div>
  );
};

export default Profile;

