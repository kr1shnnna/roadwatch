import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  TriangleAlert,
  Construction,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  
  
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.email.trim() || !formData.password) {
    setError("Please enter your email and password.");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const loginResponse = await login(
      formData.email.trim(),
      formData.password
    );

    // AuthContext returns response.data, where the user
    // object is nested inside the response.
    const loggedInUser = loginResponse?.user;

    if (loggedInUser?.role === "citizen") {
      navigate("/citizen", { replace: true });
    } else if (loggedInUser?.role === "officer") {
      navigate("/officer", { replace: true });
    } else {
      setError(
        `Your account role (${loggedInUser?.role || "unknown"}) is not supported by this application.`
      );
    }
  } catch (err) {
    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Unable to sign in. Please check your credentials."
    );
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="min-h-screen bg-rw-background">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* =====================================================
            LEFT — COMMUNITY / ROADWATCH MESSAGE
        ====================================================== */}
        <section className="relative hidden overflow-hidden bg-rw-navy lg:flex">
          {/* Decorative background shapes */}
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-rw-primary/10" />

          <div className="absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-rw-primary/5" />

          {/* Road-inspired diagonal shapes */}
          <div className="absolute bottom-[-12%] left-[-8%] h-[115%] w-[42%] rotate-[22deg] bg-rw-navy-light/60" />

          <div className="absolute bottom-[-10%] left-[12%] h-[110%] w-[4px] rotate-[22deg] border-l-2 border-dashed border-white/10" />

          <div className="relative z-10 flex w-full flex-col justify-between px-14 py-12 xl:px-20">

            {/* =================================================
                LOGO
            ================================================== */}
            <div>
              <img
                src="/logo/roadwatch-logo.png"
                alt="RoadWatch"
                className="h-24 w-auto object-contain object-left"
              />
            </div>

            {/* =================================================
                MAIN MESSAGE
            ================================================== */}
            <div className="max-w-xl">

              {/* Small badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-sm">
                <Construction className="h-4 w-4 text-rw-primary" />
                Built for the community
              </div>

              {/* Heading */}
              <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white xl:text-6xl">
                See a problem?
                <span className="mt-2 block text-rw-primary">
                  Help get it fixed.
                </span>
              </h1>

              {/* Description */}
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                Report potholes, broken streetlights, damaged roads,
                blocked drains, and other problems around your community.
              </p>

              {/* =================================================
                  PROCESS CARDS
              ================================================== */}
              <div className="mt-10 grid gap-4 sm:grid-cols-3">

                {/* Report */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rw-primary/15">
                    <TriangleAlert className="h-5 w-5 text-rw-primary" />
                  </div>

                  <p className="font-semibold text-white">
                    Report
                  </p>

                  <p className="mt-1 text-sm leading-5 text-slate-400">
                    Tell us what is wrong.
                  </p>
                </div>

                {/* Route */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rw-primary/15">
                    <ArrowRight className="h-5 w-5 text-rw-primary" />
                  </div>

                  <p className="font-semibold text-white">
                    Route
                  </p>

                  <p className="mt-1 text-sm leading-5 text-slate-400">
                    It reaches the right team.
                  </p>
                </div>

                {/* Fix */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rw-primary/15">
                    <CheckCircle2 className="h-5 w-5 text-rw-primary" />
                  </div>

                  <p className="font-semibold text-white">
                    Fix
                  </p>

                  <p className="mt-1 text-sm leading-5 text-slate-400">
                    Follow it until it is resolved.
                  </p>
                </div>

              </div>
            </div>

            {/* =================================================
                TRUST FOOTER
            ================================================== */}
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <ShieldCheck className="h-5 w-5 text-rw-primary" />

              <span>
                Helping communities make local problems visible.
              </span>
            </div>
          </div>
        </section>


        {/* =====================================================
            RIGHT — LOGIN FORM
        ====================================================== */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">

            {/* =================================================
                MOBILE LOGO
            ================================================== */}
            <div className="mb-10 flex justify-center lg:hidden">
              <img
                src="/logo/roadwatch-logo.png"
                alt="RoadWatch"
                className="h-24 w-auto object-contain"
              />
            </div>

            {/* =================================================
                HEADING
            ================================================== */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-rw-navy sm:text-4xl">
                Welcome back
              </h2>

              <p className="mt-3 text-base leading-6 text-rw-muted">
                Sign in to report problems, track your reports,
                and see what is getting fixed in your community.
              </p>
            </div>

            {/* =================================================
                ERROR MESSAGE
            ================================================== */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />

                <p>{error}</p>
              </div>
            )}

            {/* =================================================
                LOGIN FORM
            ================================================== */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-rw-text"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rw-muted" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-rw-border bg-white py-3.5 pl-12 pr-4 text-rw-text outline-none transition placeholder:text-rw-placeholder focus:border-rw-primary focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-rw-text"
                  >
                    Password
                  </label>

                  {/* Visual only — backend flow not implemented yet */}
                  <button
                    type="button"
                    onClick={() => {
                      // Forgot password is not implemented yet.
                    }}
                    className="text-sm font-medium text-rw-primary transition hover:text-rw-primary-dark"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rw-muted" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-rw-border bg-white py-3.5 pl-12 pr-12 text-rw-text outline-none transition placeholder:text-rw-placeholder focus:border-rw-primary focus:ring-4 focus:ring-orange-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-rw-muted transition hover:bg-rw-surface-muted hover:text-rw-text"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* =================================================
                  SUBMIT BUTTON
              ================================================== */}
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-rw-primary px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-rw-primary-dark hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* =================================================
                REGISTER
            ================================================== */}
            <div className="mt-8 text-center text-sm text-rw-muted">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-rw-primary transition hover:text-rw-primary-dark"
              >
                Create an account
              </Link>
            </div>

            {/* =================================================
                BOTTOM MESSAGE
            ================================================== */}
            <div className="mt-10 border-t border-rw-border pt-6 text-center">
              <p className="text-xs leading-5 text-rw-muted">
                RoadWatch helps communities report local problems
                and follow them through to resolution.
              </p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};

export default Login;
