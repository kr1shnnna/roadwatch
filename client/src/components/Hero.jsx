
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
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

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.08,
    },
  },
};

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 22,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: "easeOut",
    },
  },
};

const Hero = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const shouldReduceMotion = useReducedMotion();

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
    <section id="home" className="relative overflow-hidden bg-white">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-orange-100/70 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-slate-100 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[620px] lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-24">
        {/* LEFT: Hero content */}
        <motion.div
          variants={staggerContainer}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
        >
          {/* Simple editorial eyebrow */}
          <motion.p
            variants={fadeUp}
            className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-rw-primary sm:text-sm"
          >
            Local issues. Real action.
          </motion.p>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl font-bold leading-[1.08] tracking-tight text-rw-navy sm:text-6xl lg:text-7xl"
          >
            See a problem?
            <span className="mt-3 block text-rw-primary">
              Help get it fixed.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fadeUp}
            className="mt-7 max-w-xl text-lg leading-8 text-rw-muted sm:text-xl"
          >
            Potholes, broken streetlights, blocked drains. Problems in our
            neighbourhoods deserve attention. RoadWatch helps communities report
            local issues and follow them through to resolution.
          </motion.p>

          {/* Actions */}
          <motion.div
            variants={staggerContainer}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <motion.button
              type="button"
              onClick={handlePrimaryAction}
              disabled={loading}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-rw-primary px-6 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-rw-primary-dark hover:shadow-md disabled:cursor-wait disabled:opacity-60"
            >
              {loading
                ? "Loading..."
                : isAuthenticated
                  ? "Go to Dashboard"
                  : "Report a Problem"}

              <ArrowRight
                size={19}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </motion.button>

            <motion.a
              href="#issues"
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center justify-center rounded-xl border border-rw-border bg-white px-6 py-3.5 font-semibold text-rw-navy transition-colors hover:border-rw-border-dark hover:bg-rw-surface-muted"
            >
              Explore Issues
            </motion.a>
          </motion.div>

          {/* Supporting points */}
          <motion.div
            variants={staggerContainer}
            className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-rw-muted"
          >
            {[
              "Report local issues",
              "Track progress",
              "Verify the fix",
            ].map((point) => (
              <motion.span
                key={point}
                variants={fadeUp}
                className="flex items-center gap-2"
              >
                <CheckCircle2
                  size={17}
                  className="shrink-0 text-rw-success"
                />
                {point}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT: Issue panel */}
        <motion.div
          className="relative mx-auto w-full max-w-xl"
          initial={shouldReduceMotion ? false : { opacity: 0, x: 35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.8,
            delay: shouldReduceMotion ? 0 : 0.2,
            ease: "easeOut",
          }}
        >
          <div className="absolute -inset-3 rotate-2 rounded-[2rem] bg-orange-100/80" />

          <div className="relative overflow-hidden rounded-[1.75rem] border border-rw-border bg-rw-background p-6 shadow-xl sm:p-8">
            <motion.div
              variants={staggerContainer}
              initial={shouldReduceMotion ? false : "hidden"}
              animate="visible"
            >
              <motion.div variants={fadeUp} className="mb-7">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rw-primary">
                  Every problem matters
                </p>

                <h2 className="mt-2 text-2xl font-bold text-rw-navy sm:text-3xl">
                  What needs fixing in your neighbourhood?
                </h2>

                <p className="mt-3 text-sm leading-6 text-rw-muted">
                  Make everyday road and infrastructure problems visible.
                </p>
              </motion.div>

              <div className="space-y-3">
                <IssueRow
                  icon={TriangleAlert}
                  title="Potholes & damaged roads"
                  description="Make roads safer to travel."
                  reduceMotion={shouldReduceMotion}
                />

                <IssueRow
                  icon={Lightbulb}
                  title="Broken streetlights"
                  description="Help bring attention to dark streets."
                  reduceMotion={shouldReduceMotion}
                />

                <IssueRow
                  icon={Droplets}
                  title="Blocked drains & waterlogging"
                  description="Report problems affecting local areas."
                  reduceMotion={shouldReduceMotion}
                />

                <IssueRow
                  icon={Wrench}
                  title="Other road hazards"
                  description="Bring infrastructure issues to attention."
                  reduceMotion={shouldReduceMotion}
                />
              </div>

              <motion.div
                variants={fadeUp}
                className="mt-6 flex items-center gap-3 rounded-xl bg-rw-navy p-4 text-white"
              >
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
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const IssueRow = ({ icon: Icon, title, description, reduceMotion }) => (
  <motion.div
    variants={fadeUp}
    whileHover={reduceMotion ? undefined : { y: -3 }}
    transition={{ duration: 0.2 }}
    className="flex items-center gap-4 rounded-xl border border-rw-border bg-white p-4 transition-colors hover:border-orange-200"
  >
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
  </motion.div>
);

export default Hero;

