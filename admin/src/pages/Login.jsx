
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";

const Login = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="flex min-h-screen items-center justify-center bg-rw-background px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <LinkBrand />

          <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-orange-700">
            Authority console
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-rw-navy">
            Admin sign in
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Sign in with your authorized RoadWatch administrator account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-rw-border bg-white p-6 shadow-sm sm:p-8"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              autoComplete="username"
              required
              placeholder="admin@roadwatch.example"
              className="w-full rounded-xl border border-rw-border px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <div className="relative">
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
                className="w-full rounded-xl border border-rw-border px-3.5 py-3 pr-12 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />

              <button
                type="button"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500 hover:text-rw-navy"
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
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full rounded-xl bg-rw-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-rw-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in to RoadWatch"}
          </button>

          <p className="text-center text-xs leading-5 text-slate-500">
            Administrator access only. Public and officer accounts cannot
            use this console.
          </p>
        </form>
      </div>
    </main>
  );
};

const LinkBrand = () => (
  <a href="/" className="inline-flex items-center gap-3">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rw-navy text-sm font-bold text-white">
      RW
    </span>
    <span className="text-xl font-bold tracking-tight text-rw-navy">
      RoadWatch
    </span>
  </a>
);

export default Login;

