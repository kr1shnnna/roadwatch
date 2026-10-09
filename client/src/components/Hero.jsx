
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Construction,
  Droplets,
  Lightbulb,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Hero = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();

  const dashboardPath =
    user?.role === "citizen"
      ? "/citizen"
      : user?.role === "officer"
        ? "/officer"
        : "/unauthorized";

  const handlePrimaryAction = () => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    navigate(dashboardPath);
  };

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-white"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-orange-100/70 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-slate-100 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[620px] lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-24">

        {/* ================= LEFT: HERO MESSAGE ================= */}
        <div className="max-w-2xl">
          {!loading && isAuthenticated && user?.name && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800">
              <CheckCircle2 size={17} />
              Welcome back, {user.name.split(" ")[0]}
            </div>
          )}

          {!loading && !isAuthenticated && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800">
              <Construction size={17} />
              Built for the community
            </div>
          )}

          <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-rw-navy sm:text-6xl lg:text-7xl">
            See a problem?
            <span className="mt-3 block text-rw-primary">
              Help get it fixed.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-rw-muted sm:text-xl">
            Potholes, broken streetlights, blocked drains.
            Problems in our neighbourhoods deserve attention.
            RoadWatch helps communities report local issues
            and follow them through to resolution.
          </p>

          {/* Actions */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={loading}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-rw-primary px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-rw-primary-dark hover:shadow-md disabled:cursor-wait disabled:opacity-60"
            >
              {loading
                ? "Loading..."
                : isAuthenticated
                  ? "Go to Dashboard"
                  : "Report a Problem"}

              <ArrowRight
                size={19}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>

            <a
              href="#issues"
              className="inline-flex items-center justify-center rounded-xl border border-rw-border bg-white px-6 py-3.5 font-semibold text-rw-navy transition hover:border-rw-border-dark hover:bg-rw-surface-muted"
            >
              Explore Issues
            </a>
          </div>

          {/* Value points */}
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-rw-muted">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-rw-success" />
              Report local issues
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-rw-success" />
              Track progress
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-rw-success" />
              Verify the fix
            </span>
          </div>
        </div>

        {/* ================= RIGHT: TEMPORARY VISUAL ================= */}
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-3 rotate-2 rounded-[2rem] bg-orange-100/80" />

          <div className="relative overflow-hidden rounded-[1.75rem] border border-rw-border bg-rw-background p-6 shadow-xl sm:p-8">

            <div className="mb-7">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rw-primary">
                Every problem matters
              </p>

              <h2 className="mt-2 text-2xl font-bold text-rw-navy sm:text-3xl">
                What needs fixing in your neighbourhood?
              </h2>

              <p className="mt-3 text-sm leading-6 text-rw-muted">
                Make everyday road and infrastructure problems visible.
              </p>
            </div>

            {/* Issue examples */}
            <div className="space-y-3">
              <IssueRow
                icon={TriangleAlert}
                title="Potholes & damaged roads"
                description="Make roads safer to travel."
              />

              <IssueRow
                icon={Lightbulb}
                title="Broken streetlights"
                description="Help bring attention to dark streets."
              />

              <IssueRow
                icon={Droplets}
                title="Blocked drains & waterlogging"
                description="Report problems affecting local areas."
              />

              <IssueRow
                icon={Wrench}
                title="Other road hazards"
                description="Bring infrastructure issues to attention."
              />
            </div>

            {/* Bottom message */}
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-rw-navy p-4 text-white">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rw-primary/15">
                <Construction className="h-6 w-6 text-rw-primary" />
              </div>

              <div>
                <p className="font-semibold">
                  Report it. Follow it. Fix it.
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  A better community starts with action.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

const IssueRow = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-rw-border bg-white p-4 transition-colors hover:border-orange-200">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50">
        <Icon size={23} className="text-rw-primary" />
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-rw-navy sm:text-base">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-rw-muted sm:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
};

export default Hero;
