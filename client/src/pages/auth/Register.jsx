import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  ShieldCheck,
  TriangleAlert,
  Construction,
  CheckCircle2,
} from "lucide-react";

import api from "../../services/api";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    const { name, email, password, confirmPassword } = formData;

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all the fields.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters long.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate("/login");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create your account. Please try again."
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

              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-sm">
                <Construction className="h-4 w-4 text-rw-primary" />
                Built for the community
              </div>

              {/* Heading */}
              <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white xl:text-6xl">
                Join the people
                <span className="mt-2 block text-rw-primary">
                  making things better.
                </span>
              </h1>

              {/* Description */}
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                Create an account to report potholes, broken streetlights,
                damaged roads, blocked drains, and other problems in your
                community.
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
                    Spot something wrong?
                  </p>
                </div>

                {/* Follow */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rw-primary/15">
                    <ArrowRight className="h-5 w-5 text-rw-primary" />
                  </div>

                  <p className="font-semibold text-white">
                    Follow
                  </p>

                  <p className="mt-1 text-sm leading-5 text-slate-400">
                    See what happens next.
                  </p>
                </div>

                {/* Fix */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rw-primary/15">
                    <CheckCircle2 className="h-5 w-5 text-rw-primary" />
                  </div>

                  <p className="font-semibold text-white">
                    Improve
                  </p>

                  <p className="mt-1 text-sm leading-5 text-slate-400">
                    Help make your area better.
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
                Together, small fixes make a better community.
              </span>
            </div>
          </div>
        </section>


        {/* =====================================================
            RIGHT — REGISTER FORM
        ====================================================== */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">

            {/* =================================================
                MOBILE LOGO
            ================================================== */}
            <div className="mb-8 flex justify-center lg:hidden">
              <img
                src="/logo/roadwatch-logo.png"
                alt="RoadWatch"
                className="h-24 w-auto object-contain"
              />
            </div>

            {/* =================================================
                HEADING
            ================================================== */}
            <div className="mb-7">
              <h2 className="text-3xl font-bold tracking-tight text-rw-navy sm:text-4xl">
                Create your account
              </h2>

              <p className="mt-3 text-base leading-6 text-rw-muted">
                Join RoadWatch and help make local problems visible
                so they can be fixed.
              </p>
            </div>

            {/* =================================================
                ERROR
            ================================================== */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />

                <p>{error}</p>
              </div>
            )}

            {/* =================================================
                FORM
            ================================================== */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-rw-text"
                >
                  Full name
                </label>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rw-muted" />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-rw-border bg-white py-3.5 pl-12 pr-4 text-rw-text outline-none transition placeholder:text-rw-placeholder focus:border-rw-primary focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>

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
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-rw-text"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rw-muted" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
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

                <p className="mt-2 text-xs text-rw-muted">
                  Password must be at least 6 characters.
                </p>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-rw-text"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rw-muted" />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="w-full rounded-xl border border-rw-border bg-white py-3.5 pl-12 pr-12 text-rw-text outline-none transition placeholder:text-rw-placeholder focus:border-rw-primary focus:ring-4 focus:ring-orange-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-rw-muted transition hover:bg-rw-surface-muted hover:text-rw-text"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* =================================================
                  SUBMIT
              ================================================== */}
              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-rw-primary px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-rw-primary-dark hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* =================================================
                LOGIN LINK
            ================================================== */}
            <div className="mt-7 text-center text-sm text-rw-muted">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-rw-primary transition hover:text-rw-primary-dark"
              >
                Sign in
              </Link>
            </div>

            {/* =================================================
                BOTTOM MESSAGE
            ================================================== */}
            <div className="mt-8 border-t border-rw-border pt-5 text-center">
              <p className="text-xs leading-5 text-rw-muted">
                By joining RoadWatch, you can report local issues
                and follow their progress through resolution.
              </p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};

export default Register;
