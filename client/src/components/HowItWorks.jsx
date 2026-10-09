
import { motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Construction,
  MapPin,
  Route,
  TriangleAlert,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const steps = [
  {
    number: "01",
    icon: TriangleAlert,
    title: "Report the problem",
    description:
      "Mark the location, describe what needs attention, and add photos to help explain the issue.",
    label: "Make it visible",
    color: "orange",
  },
  {
    number: "02",
    icon: Route,
    title: "Reach the right team",
    description:
      "RoadWatch uses the issue type and location to route eligible reports to the responsible team.",
    label: "Routed to the team",
    color: "navy",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Fix and verify",
    description:
      "Follow repair progress, review the evidence, and confirm whether the problem has been fixed.",
    label: "Resolution matters",
    color: "green",
  },
];

const revealUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.08,
    },
  },
};

const HowItWorks = () => {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const dashboardPath =
    user?.role === "citizen"
      ? "/citizen"
      : user?.role === "officer"
        ? "/officer"
        : "/unauthorized";

  const handleReport = () => {
    navigate(isAuthenticated ? dashboardPath : "/login");
  };

  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 overflow-x-clip bg-white"
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">

        {/* ================= SECTION HEADING ================= */}
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="mx-auto max-w-3xl text-center"
        >
          {/* Text-only badge */}
          <motion.div
            variants={revealUp}
            className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800"
          >
            How RoadWatch works
          </motion.div>

          <motion.h2
            variants={revealUp}
            className="mt-6 text-3xl font-bold leading-tight tracking-tight text-rw-navy sm:text-4xl lg:text-5xl"
          >
            From a reported problem
            <span className="mt-2 block text-rw-primary">
              to a real resolution.
            </span>
          </motion.h2>

          <motion.p
            variants={revealUp}
            className="mx-auto mt-5 max-w-2xl text-base leading-7 text-rw-muted sm:text-lg sm:leading-8"
          >
            Every issue has a location, someone responsible for
            addressing it, and a path toward resolution. Here is
            how RoadWatch helps connect those steps.
          </motion.p>
        </motion.div>

        {/* ================= RESPONSIVE CONTENT GRID ================= */}
        <div
          className="
            mt-14 grid w-full min-w-0 grid-cols-1 items-center gap-10
            lg:mt-16 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]
            xl:gap-12
          "
        >

          {/* ================= NEIGHBOURHOOD MAP ================= */}
          <motion.div
            initial={
              reduceMotion ? false : { opacity: 0, x: -24 }
            }
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{
              duration: 0.7,
              ease: "easeOut",
            }}
            className="relative w-full min-w-0 max-w-full"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-2 -rotate-1 rounded-[2rem] bg-orange-100/80 sm:-inset-3"
            />

            <div className="relative w-full min-w-0 max-w-full overflow-hidden rounded-[1.75rem] border border-rw-border bg-rw-background p-3 shadow-lg sm:p-5">

              {/* Map header */}
              <div className="flex min-w-0 items-center justify-between gap-3 px-1 py-3 sm:px-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rw-muted">
                    The journey of an issue
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-rw-navy sm:text-xl">
                    From report to repair
                  </h3>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <MapPin className="h-5 w-5 text-rw-primary" />
                </div>
              </div>

              {/* SVG neighbourhood map */}
              <div className="relative mt-2 w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <svg
                  viewBox="0 0 640 440"
                  className="block h-auto w-full max-w-full"
                  role="img"
                  aria-label="Illustrative neighbourhood map showing a reported issue, responsible team, and completed repair"
                >
                  <defs>
                    <pattern
                      id="rw-map-grid"
                      width="24"
                      height="24"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M24 0H0V24"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="1"
                      />
                    </pattern>

                    <filter
                      id="rw-map-shadow"
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="3"
                        stdDeviation="3"
                        floodColor="#0F172A"
                        floodOpacity="0.15"
                      />
                    </filter>
                  </defs>

                  {/* Background */}
                  <rect
                    width="640"
                    height="440"
                    fill="#F1F5F9"
                  />

                  <rect
                    width="640"
                    height="440"
                    fill="url(#rw-map-grid)"
                  />

                  {/* Parks */}
                  <path
                    d="M0 0H150L178 47L145 98L70 91L0 120Z"
                    fill="#DCEEDB"
                  />

                  <path
                    d="M450 0H640V90L594 112L550 85L479 96Z"
                    fill="#DCEEDB"
                  />

                  <path
                    d="M0 357L70 337L138 360L151 440H0Z"
                    fill="#DCEEDB"
                  />

                  <path
                    d="M468 337L526 314L640 337V440H487L469 391Z"
                    fill="#DCEEDB"
                  />

                  {/* Trees */}
                  {[
                    [48, 42],
                    [78, 59],
                    [110, 35],
                    [512, 43],
                    [554, 57],
                    [588, 33],
                    [45, 390],
                    [83, 402],
                    [530, 386],
                    [576, 403],
                  ].map(([cx, cy], index) => (
                    <g key={`tree-${index}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="10"
                        fill="#B4D8AE"
                      />
                      <circle
                        cx={cx - 3}
                        cy={cy - 2}
                        r="5"
                        fill="#92C58B"
                      />
                    </g>
                  ))}

                  {/* Buildings */}
                  {[
                    [188, 25, 60, 40],
                    [268, 22, 53, 54],
                    [338, 20, 64, 36],
                    [193, 83, 46, 35],
                    [256, 95, 70, 34],
                    [338, 79, 53, 42],
                    [424, 31, 38, 48],
                    [170, 153, 50, 48],
                    [241, 155, 61, 37],
                    [317, 145, 52, 50],
                    [443, 149, 54, 34],
                    [520, 150, 44, 45],
                    [36, 153, 42, 54],
                    [39, 226, 61, 42],
                    [194, 355, 53, 40],
                    [270, 367, 59, 33],
                    [351, 352, 53, 47],
                    [432, 366, 35, 40],
                    [500, 245, 55, 44],
                    [478, 297, 42, 30],
                  ].map(([x, y, width, height], index) => (
                    <g key={`building-${index}`}>
                      <rect
                        x={x + 3}
                        y={y + 4}
                        width={width}
                        height={height}
                        rx="5"
                        fill="#CBD5E1"
                        opacity="0.45"
                      />

                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        rx="5"
                        fill={
                          index % 3 === 0
                            ? "#FFFFFF"
                            : "#E2E8F0"
                        }
                        stroke="#CBD5E1"
                        strokeWidth="1"
                      />

                      <path
                        d={`M${x + 10} ${y + 10}h${Math.max(8, width - 20)}`}
                        stroke="#CBD5E1"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </g>
                  ))}

                  {/* Main road edges */}
                  <g
                    fill="none"
                    stroke="#D6DEE8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      d="M-20 126C120 126 193 187 302 167S484 100 660 126"
                      strokeWidth="43"
                    />
                    <path
                      d="M103 -20C124 86 155 180 141 265S117 369 148 460"
                      strokeWidth="43"
                    />
                    <path
                      d="M373 -20C359 72 383 150 408 226S437 337 420 460"
                      strokeWidth="43"
                    />
                    <path
                      d="M-20 322C100 295 230 335 328 301S510 321 660 276"
                      strokeWidth="43"
                    />
                    <path
                      d="M531 -20C506 75 530 154 558 222S601 350 582 460"
                      strokeWidth="43"
                    />
                  </g>

                  {/* Main road surfaces */}
                  <g
                    fill="none"
                    stroke="#FFFFFF"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      d="M-20 126C120 126 193 187 302 167S484 100 660 126"
                      strokeWidth="36"
                    />
                    <path
                      d="M103 -20C124 86 155 180 141 265S117 369 148 460"
                      strokeWidth="36"
                    />
                    <path
                      d="M373 -20C359 72 383 150 408 226S437 337 420 460"
                      strokeWidth="36"
                    />
                    <path
                      d="M-20 322C100 295 230 335 328 301S510 321 660 276"
                      strokeWidth="36"
                    />
                    <path
                      d="M531 -20C506 75 530 154 558 222S601 350 582 460"
                      strokeWidth="36"
                    />
                  </g>

                  {/* Minor streets */}
                  <g
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="13"
                    strokeLinecap="round"
                  >
                    <path d="M20 213C174 199 252 222 335 212S495 211 630 205" />
                    <path d="M180 -10C194 82 204 149 218 230S240 357 256 452" />
                    <path d="M464 -10C458 78 458 167 467 235S469 346 477 452" />
                    <path d="M-10 385C151 373 248 393 340 372S492 394 650 356" />
                    <path d="M-10 55C159 66 268 61 405 55S545 66 650 42" />
                  </g>

                  {/* Animated route */}
                  <motion.path
                    d="M139 264C178 280 199 287 227 273S269 222 324 234S377 245 408 205S465 145 523 125"
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="9 9"
                    initial={{
                      pathLength: reduceMotion ? 1 : 0,
                      opacity: 1,
                    }}
                    whileInView={{
                      pathLength: 1,
                      opacity: 1,
                    }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{
                      pathLength: {
                        duration: reduceMotion ? 0 : 1.8,
                        ease: "easeInOut",
                      },
                    }}
                  />

                  {/* ORANGE MARKER — fixed SVG position */}
                  <g
                    transform="translate(139 264)"
                    filter="url(#rw-map-shadow)"
                  >
                    <motion.g
                      initial={reduceMotion ? false : { opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{
                        duration: 0.4,
                        delay: reduceMotion ? 0 : 0.25,
                      }}
                    >
                      <path
                        d="M0 -23C-13 -23 -21 -14 -21 -2C-21 11 0 29 0 29S21 11 21 -2C21 -14 13 -23 0 -23Z"
                        fill="#F97316"
                      />
                      <circle
                        cx="0"
                        cy="-3"
                        r="8"
                        fill="#FFFFFF"
                      />
                      <path
                        d="M0 -8L4 -6L4 -1L0 2L-4 -1L-4 -6Z"
                        fill="#F97316"
                      />
                      <circle
                        cx="0"
                        cy="5"
                        r="1.4"
                        fill="#F97316"
                      />
                    </motion.g>
                  </g>

                  {/* NAVY MARKER — fixed SVG position */}
                  <g
                    transform="translate(408 205)"
                    filter="url(#rw-map-shadow)"
                  >
                    <motion.g
                      initial={reduceMotion ? false : { opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{
                        duration: 0.4,
                        delay: reduceMotion ? 0 : 0.8,
                      }}
                    >
                      <circle r="19" fill="#0F172A" />

                      <path
                        d="M-7 -5L0 -10L7 -5V7H-7Z"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />

                      <path
                        d="M-3 7V0H3V7"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </motion.g>
                  </g>

                  {/* GREEN MARKER — fixed SVG position */}
                  <g
                    transform="translate(523 125)"
                    filter="url(#rw-map-shadow)"
                  >
                    <motion.g
                      initial={reduceMotion ? false : { opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{
                        duration: 0.4,
                        delay: reduceMotion ? 0 : 1.3,
                      }}
                    >
                      <circle r="19" fill="#16A34A" />

                      <path
                        d="M-8 0L-3 5L8 -7"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.g>
                  </g>
                </svg>

                {/* Reported issue label */}
                <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-rw-border bg-white/95 px-3 py-2 shadow-sm backdrop-blur sm:left-4 sm:top-4 sm:px-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rw-primary" />
                    <span className="text-xs font-semibold text-rw-navy sm:text-sm">
                      Reported issue
                    </span>
                  </div>
                </div>

                {/* Resolved label */}
                <div className="pointer-events-none absolute bottom-3 right-3 rounded-xl border border-green-100 bg-white/95 px-3 py-2 shadow-sm backdrop-blur sm:bottom-4 sm:right-4 sm:px-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-rw-success"
                    />
                    <span className="text-xs font-semibold text-rw-navy sm:text-sm">
                      Repair verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Colour legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-1 py-4 sm:gap-x-5 sm:px-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rw-primary" />
                  <span className="text-xs text-rw-muted">
                    Reported location
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rw-navy" />
                  <span className="text-xs text-rw-muted">
                    Responsible team
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rw-success" />
                  <span className="text-xs text-rw-muted">
                    Resolved
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================= PROCESS STEPS ================= */}
          <motion.div
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={stagger}
            className="relative w-full min-w-0 max-w-full"
          >
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-rw-primary">
                Three simple steps
              </p>

              <h3 className="mt-3 text-2xl font-bold leading-snug text-rw-navy sm:text-3xl">
                Making local problems
                <span className="text-rw-primary">
                  {" "}harder to ignore.
                </span>
              </h3>
            </div>

            <div className="relative space-y-7">
              <div
                aria-hidden="true"
                className="absolute bottom-10 left-[23px] top-10 w-px bg-rw-border"
              />

              {steps.map((step) => {
                const Icon = step.icon;

                const iconColors = {
                  orange:
                    "bg-orange-50 text-rw-primary border-orange-100",
                  navy:
                    "bg-slate-100 text-rw-navy border-slate-200",
                  green:
                    "bg-green-50 text-rw-success border-green-100",
                };

                return (
                  <motion.article
                    key={step.number}
                    variants={revealUp}
                    className="relative flex min-w-0 gap-4 sm:gap-5"
                  >
                    <div
                      className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${iconColors[step.color]}`}
                    >
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0 flex-1 pb-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-xs font-bold tracking-widest text-rw-primary">
                          STEP {step.number}
                        </span>

                        <span className="text-xs text-rw-muted">
                          {step.label}
                        </span>
                      </div>

                      <h4 className="mt-2 text-lg font-bold text-rw-navy sm:text-xl">
                        {step.title}
                      </h4>

                      <p className="mt-2 text-sm leading-7 text-rw-muted">
                        {step.description}
                      </p>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {/* Closing message */}
            <motion.div
              variants={revealUp}
              className="mt-9 rounded-2xl border border-orange-100 bg-orange-50 p-5 sm:p-6"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                  <CheckCircle2 className="h-5 w-5 text-rw-primary" />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-rw-navy">
                    Reporting is only the beginning.
                  </p>

                  <p className="mt-1 text-sm leading-6 text-rw-muted">
                    The goal is to make the repair visible and give
                    the community a way to verify the outcome.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* ================= BOTTOM CTA ================= */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-16 flex flex-col items-start justify-between gap-5 rounded-2xl bg-rw-navy px-6 py-7 sm:flex-row sm:items-center sm:px-9 sm:py-8"
        >
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-white sm:text-2xl">
              Noticed something that needs fixing?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Make the problem visible. Help your community take action.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReport}
            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-rw-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-rw-primary-dark"
          >
            Report a Problem
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </motion.div>

      </div>
    </section>
  );
};

export default HowItWorks;

