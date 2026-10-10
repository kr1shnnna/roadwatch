
import { useEffect, useState } from "react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const getInitials = (name) =>
  (name || "Officer")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  "Something went wrong. Please try again.";

const OfficerProfile = () => {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState(user || null);
  const [name, setName] = useState(user?.name || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/auth/me");
        const currentProfile = response?.data?.user;

        if (!currentProfile) {
          throw new Error("Profile data was not returned by the server.");
        }

        if (isMounted) {
          setProfile(currentProfile);
          setName(currentProfile.name || "");
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message ||
              requestError.message ||
              "Unable to load your profile.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError("Your name must contain at least two characters.");
      return;
    }

    if (trimmedName.length > 80) {
      setError("Your name cannot exceed 80 characters.");
      return;
    }

    if (trimmedName === (profile?.name || "")) {
      setError("");
      setSuccessMessage("Your profile is already up to date.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await api.patch("/auth/me", {
        name: trimmedName,
      });

      const returnedUser = response?.data?.user;

      const updatedProfile = {
        ...profile,
        ...(returnedUser || {}),
        name: returnedUser?.name || trimmedName,
      };

      setProfile(updatedProfile);
      setName(updatedProfile.name);

      if (typeof updateUser === "function") {
        updateUser(updatedProfile);
      }

      setSuccessMessage(
        response?.data?.message || "Profile updated successfully.",
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const accountIsActive = profile?.isActive !== false;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      {/* Heading */}
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Account settings
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-rw-navy sm:text-3xl">
          My Profile
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Manage your personal information and review your officer account details.
        </p>
      </header>

      {/* Account identity */}
      <section className="overflow-hidden rounded-2xl border border-rw-border bg-white shadow-sm">
        <div className="h-1 bg-rw-primary" />

        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-rw-navy text-xl font-bold text-white">
            {getInitials(profile?.name || user?.name)}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="break-words text-xl font-bold text-rw-navy">
              {profile?.name || user?.name || "Officer"}
            </h2>

            <p className="mt-1 break-all text-sm text-slate-500">
              {profile?.email || user?.email || "Email unavailable"}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                Officer account
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  accountIsActive
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {accountIsActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Editable personal information */}
        <section className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm sm:p-6">
          <div className="border-b border-rw-border pb-4">
            <h2 className="text-base font-bold text-rw-navy">
              Personal information
            </h2>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Update the name displayed in your officer workspace.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 pt-5">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100" />
              <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 pt-5">
              <div>
                <label
                  htmlFor="officerName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>

                <input
                  id="officerName"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                    setSuccessMessage("");
                  }}
                  minLength={2}
                  maxLength={80}
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-rw-border bg-white px-3.5 py-3 text-sm text-rw-text outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label
                  htmlFor="officerEmail"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="officerEmail"
                  type="email"
                  value={profile?.email || user?.email || ""}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-rw-border bg-slate-50 px-3.5 py-3 text-sm text-slate-500 outline-none"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Contact your administrator if your registered email needs to change.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-rw-border pt-5">
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="rounded-xl bg-rw-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving changes..." : "Save changes"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setName(profile?.name || "");
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="rounded-xl border border-rw-border px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Account details */}
        <section className="rounded-2xl border border-rw-border bg-white p-5 shadow-sm sm:p-6">
          <div className="border-b border-rw-border pb-4">
            <h2 className="text-base font-bold text-rw-navy">
              Account details
            </h2>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Information associated with your RoadWatch account.
            </p>
          </div>

          <dl className="divide-y divide-rw-border">
            <div className="py-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Account role
              </dt>
              <dd className="mt-1.5 text-sm font-semibold text-rw-navy">
                Officer
              </dd>
            </div>

            <div className="py-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Account status
              </dt>
              <dd
                className={`mt-1.5 text-sm font-semibold ${
                  accountIsActive ? "text-green-700" : "text-red-700"
                }`}
              >
                {accountIsActive ? "Active" : "Inactive"}
              </dd>
            </div>

            <div className="py-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Member since
              </dt>
              <dd className="mt-1.5 text-sm font-semibold text-rw-navy">
                {formatDate(profile?.createdAt || user?.createdAt)}
              </dd>
            </div>

            <div className="py-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Last profile update
              </dt>
              <dd className="mt-1.5 text-sm font-semibold text-rw-navy">
                {formatDate(profile?.updatedAt || user?.updatedAt)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
};

export default OfficerProfile;
