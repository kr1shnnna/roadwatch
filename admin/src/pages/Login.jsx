import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";

const Brand = ({ logoFailed, onLogoError }) => (
  <div className="flex items-center gap-3">
    {logoFailed ? (
      <>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rw-primary text-sm font-bold text-white">
          RW
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          RoadWatch
        </span>
      </>
    ) : (
      <img
        src="/logo/roadwatch-logo.png"
        alt="RoadWatch"
        onError={onLogoError}
        className="h-16 w-auto max-w-[220px] object-contain object-center"
      />
    )}
  </div>
);

const Login = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);

      const destination = location.state?.from;

      navigate(
        destination
          ? {
              pathname: destination.pathname || "/",
              search: destination.search || "",
            }
          : "/",
        { replace: true },
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f1f4f8] p-0 sm:p-4 lg:p-6">
      <div className="mx-auto grid min-h-screen w-full max-w-[1500px] overflow-hidden bg-white sm:min-h-[calc(100vh-2rem)] sm:rounded-2xl sm:shadow-xl lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_0.95fr]">
        {/* RoadWatch brand panel */}
        <aside
          className="relative hidden overflow-hidden bg-rw-navy lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 10% 10%, rgba(249,115,22,0.15), transparent 42%), linear-gradient(145deg, #0f172a 0%, #111d36 100%)",
          }}
        >
          {/* Subtle background detail */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage:
                "linear-gradient(to bottom right, black, transparent 75%)",
            }}
          />

          <div className="relative z-10 w-full">
            {/* Centered, larger brand logo */}
            <div className="flex w-full justify-center">
              <Brand
                logoFailed={logoFailed}
                onLogoError={() => setLogoFailed(true)}
              />
            </div>

            <div className="mx-auto mt-20 max-w-xl text-center xl:mt-28">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
                RoadWatch / Authority Console
              </p>

              <h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight text-white xl:text-6xl">
                Every report
                <br />
                deserves an
                <br />
                <span className="text-rw-primary">
                  accountable response.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-slate-300 xl:text-base">
                Manage community road issues, coordinate the right teams,
                and follow every report through resolution.
              </p>
            </div>

            {/* Operational workflow */}
            <div className="mx-auto mt-12 max-w-md space-y-0 text-center">
              {[
                {
                  number: "01",
                  title: "Review incoming reports",
                  description: "Understand the issue and its location.",
                },
                {
                  number: "02",
                  title: "Assign responsibility",
                  description: "Connect each report with the right team.",
                },
                {
                  number: "03",
                  title: "Track resolution",
                  description: "Keep the process visible and accountable.",
                },
              ].map((step) => (
                <div
                  key={step.number}
                  className="flex flex-col items-center border-t border-white/10 py-4 text-center"
                >
                  <span className="text-xs font-semibold tracking-wider text-orange-400">
                    {step.number}
                  </span>

                  <div className="mt-2">
                    <p className="text-sm font-semibold text-white">
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route illustration */}
          <svg
            aria-hidden="true"
            viewBox="0 0 420 210"
            fill="none"
            className="pointer-events-none absolute -bottom-3 -right-10 w-[48%] min-w-[250px] opacity-70"
          >
            <path
              d="M430 -10 C340 28 360 85 286 92 S156 100 178 170 S85 220 0 190"
              stroke="#334155"
              strokeWidth="58"
              strokeLinecap="round"
            />
            <path
              d="M430 -10 C340 28 360 85 286 92 S156 100 178 170 S85 220 0 190"
              stroke="#f97316"
              strokeWidth="2"
              strokeDasharray="7 12"
              strokeLinecap="round"
            />
            <circle cx="286" cy="92" r="9" fill="#f97316" />
            <circle
              cx="286"
              cy="92"
              r="17"
              stroke="#fb923c"
              strokeWidth="1.5"
              opacity=".6"
            />
          </svg>

          <div className="relative z-10 mt-10 flex flex-col items-center justify-center gap-2 border-t border-white/10 pt-5 text-center">
            <p className="text-xs font-medium text-slate-400">
              LOCAL ISSUES. REAL ACTION.
            </p>
            <p className="text-xs text-slate-500">Authority access</p>
          </div>
        </aside>

        {/* Login section */}
        <section className="flex min-w-0 items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            {/* Mobile branding */}
            <div className="mb-12 lg:hidden">
              <div className="inline-flex items-center rounded-xl bg-rw-navy px-3 py-2">
                <Brand
                  logoFailed={logoFailed}
                  onLogoError={() => setLogoFailed(true)}
                />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-orange-700">
                Authority Console
              </p>
            </div>

            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-800">
                <ShieldCheck size={15} />
                AUTHORIZED ADMINISTRATORS
              </div>

              <h2 className="mt-6 text-3xl font-bold tracking-tight text-rw-navy sm:text-4xl">
                Welcome back.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Sign in to your RoadWatch workspace to manage reports and
                coordinate local operations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Work email
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    placeholder="admin@roadwatch.in"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-rw-navy outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-rw-navy outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3.5 text-slate-500 transition hover:text-rw-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-rw-primary px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rw-primary-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in to RoadWatch"}

                {!loading && (
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-5">
              <p className="text-xs leading-6 text-slate-500">
                Access is restricted to authorized{" "}
                <span className="font-semibold text-slate-700">
                  Authority Admin
                </span>{" "}
                and{" "}
                <span className="font-semibold text-slate-700">
                  Super Admin
                </span>{" "}
                accounts. Contact your administrator if you need access.
              </p>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              RoadWatch · Local issues. Real action.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
