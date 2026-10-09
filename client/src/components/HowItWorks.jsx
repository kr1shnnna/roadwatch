
import {
  motion,
  useReducedMotion,
} from "motion/react";

import {
  ArrowRight,
  CheckCircle2,
  Construction,
  MapPin,
  Route,
  TriangleAlert,
} from "lucide-react";

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
      "Follow the repair progress, review the evidence, and confirm whether the problem has been fixed.",
    label: "Resolution matters",
    color: "green",
  },
];

const revealUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const processVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.17,
      delayChildren: 0.12,
    },
  },
};

const HowItWorks = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 overflow-hidden bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">

        {/* Section heading */}
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={processVariants}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div
            variants={revealUp}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800"
          >
            <Route size={16} />
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
            addressing it, and a path toward resolution. Here's
            how RoadWatch helps connect those steps.
          </motion.p>
        </motion.div>

        {/* Map + process */}
        <div className="mt-14 grid items-center gap-10 lg:mt-16 lg:grid-cols-[1.12fr_0.88fr] lg:gap-14">

          {/* ================= MAP ILLUSTRATION ================= */}
          <motion.div
            initial={
              reduceMotion
                ? false
                : { opacity: 0, x: -28 }
            }
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.75,
              ease: "easeOut",
            }}
            className="relative min-w-0"
          >
            <div className="absolute -inset-3 -rotate-1 rounded-[2rem] bg-orange-100/80" />

            <div className="relative overflow-hidden rounded-[1.75rem] border border-rw-border bg-rw-background p-3 shadow-lg sm:p-5">

              {/* Map header */}
              <div className="flex items-center justify-between gap-3 px-2 py-3 sm:px-3">
                <div>
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

              {/* Illustrative neighborhood map */}
              <div className="relative mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">

                <svg
                  viewBox="0 0 640 440"
                  className="block h-auto w-full"
                  role="img"
                  aria-label="Illustration of a neighborhood with a highlighted route connecting a reported road issue to a maintenance team and a completed repair"
                >
                  <defs>
                    <pattern
                      id="rw-map-grid"
                      width="24"
                      height="24"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 24 0 L 0 0 0 24"
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

                  {/* Map background */}
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

                  {/* Green spaces */}
                  <path
                    d="M0 0 H150 L178 47 L145 98 L70 91 L0 120 Z"
                    fill="#DCEEDB"
                  />

                  <path
                    d="M450 0 H640 V90 L594 112 L550 85 L479 96 Z"
                    fill="#DCEEDB"
                  />

                  <path
                    d="M0 357 L70 337 L138 360 L151 440 H0 Z"
                    fill="#DCEEDB"
                  />

                  <path
                    d="M468 337 L526 314 L640 337 V440 H487 L469 391 Z"
                    fill="#DCEEDB"
                  />

                  {/* Small park trees */}
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
                        fill={index % 3 === 0 ? "#FFFFFF" : "#E2E8F0"}
                        stroke="#CBD5E1"
                        strokeWidth="1"
                      />
                      <path
                        d={`M ${x + 10} ${y + 10} h ${Math.max(8, width - 20)}`}
                        stroke="#CBD5E1"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </g>
                  ))}

                  {/* Main roads: edges */}
                  <g
                    fill="none"
                    stroke="#D6DEE8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      d="M-20 126 C120 126 193 187 302 167 S484 100 660 126"
                      strokeWidth="43"
                    />
                    <path
                      d="M103 -20 C124 86 155 180 141 265 S117 369 148 460"
                      strokeWidth="43"
                    />
                    <path
                      d="M373 -20 C359 72 383 150 408 226 S437 337 420 460"
                      strokeWidth="43"
                    />
                    <path
                      d="M-20 322 C100 295 230 335 328 301 S510 321 660 276"
                      strokeWidth="43"
                    />
                    <path
                      d="M531 -20 C506 75 530 154 558 222 S601 350 582 460"
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
                      d="M-20 126 C120 126 193 187 302 167 S484 100 660 126"
                      strokeWidth="36"
                    />
                    <path
                      d="M103 -20 C124 86 155 180 141 265 S117 369 148 460"
                      strokeWidth="36"
                    />
                    <path
                      d="M373 -20 C359 72 383 150 408 226 S437 337 420 460"
                      strokeWidth="36"
                    />
                    <path
                      d="M-20 322 C100 295 230 335 328 301 S510 321 660 276"
                      strokeWidth="36"
                    />
                    <path
                      d="M531 -20 C506 75 530 154 558 222 S601 350 582 460"
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
                    <path d="M20 213 C174 199 252 222 335 212 S495 211 630 205" />
                    <path d="M180 -10 C194 82 204 149 218 230 S240 357 256 452" />
                    <path d="M464 -10 C458 78 458 167 467 235 S469 346 477 452" />
                    <path d="M-10 385 C151 373 248 393 340 372 S492 394 650 356" />
                    <path d="M-10 55 C159 66 268 61 405 55 S545 66 650 42" />
                  </g>

                  {/* Orange route: reveal as the section enters view */}
                  <motion.path
                    d="M139 264 C178 280 199 287 227 273 S269 222 324 234 S377 245 408 205 S465 145 523 125"
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="9 9"
                    initial={{
                      pathLength: reduceMotion ? 1 : 0,
                      opacity: reduceMotion ? 1 : 0,
                    }}
                    whileInView={{
                      pathLength: 1,
                      opacity: 1,
                    }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{
                      pathLength: {
                        duration: reduceMotion ? 0 : 1.8,
                        ease: "easeInOut",
                        delay: 0.35,
                      },
                      opacity: { duration: 0.3 },
                    }}
                  />

                  {/* Report marker */}
                  <motion.g
                    transform="translate(139 264)"
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, scale: 0.5 }
                    }
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{
                      duration: 0.4,
                      delay: reduceMotion ? 0 : 0.25,
                      ease: "easeOut",
                    }}
                    style={{ transformBox: "view-box", transformOrigin: "139px 264px" }}
                    filter="url(#rw-map-shadow)"
                  >
                    <path
                      d="M0 -23 C-13 -23 -21 -14 -21 -2 C-21 11 0 29 0 29 C0 29 21 11 21 -2 C21 -14 13 -23 0 -23 Z"
                      fill="#F97316"
                    />
                    <circle
                      cx="0"
                      cy="-3"
                      r="8"
                      fill="#FFFFFF"
                    />
                    <TriangleAlert
                      x="-5"
                      y="-8"
                      width="10"
                      height="10"
                    />
                  </motion.g>

                  {/* Responsible team marker */}
                  <motion.g
                    transform="translate(408 205)"
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, scale: 0.5 }
                    }
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{
                      duration: 0.4,
                      delay: reduceMotion ? 0 : 0.95,
                      ease: "easeOut",
                    }}
                    style={{ transformBox: "view-box", transformOrigin: "408px 205px" }}
                    filter="url(#rw-map-shadow)"
                  >
                    <circle
                      r="19"
                      fill="#0F172A"
                    />
                    <Construction
                      x="-10"
                      y="-10"
                      width="20"
                      height="20"
                      color="#FFFFFF"
                      strokeWidth="2"
                    />
                  </motion.g>

                  {/* Resolved marker */}
                  <motion.g
                    transform="translate(523 125)"
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, scale: 0.5 }
                    }
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{
                      duration: 0.4,
                      delay: reduceMotion ? 0 : 1.65,
                      ease: "easeOut",
                    }}
                    style={{ transformBox: "view-box", transformOrigin: "523px 125px" }}
                    filter="url(#rw-map-shadow)"
                  >
                    <circle
                      r="19"
                      fill="#16A34A"
                    />
                    <CheckCircle2
                      x="-10"
                      y="-10"
                      width="20"
                      height="20"
                      color="#FFFFFF"
                      strokeWidth="2.5"
                    />
                  </motion.g>
                </svg>

                {/* Map overlay labels */}
                <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-rw-border bg-white/95 px-3 py-2 shadow-sm backdrop-blur sm:left-4 sm:top-4 sm:px-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rw-primary" />
                    <span className="text-xs font-semibold text-rw-navy sm:text-sm">
                      Reported issue
                    </span>
                  </div>
                </div>

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

              {/* Map legend */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-2 py-4 sm:px-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rw-primary" />
                  <span className="text-xs text-rw-muted">
                    Reported location
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rw-navy" />
                  <span className="text-xs text-rw-muted">
                    Responsible team
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rw-success" />
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
            viewport={{ once: true, amount: 0.2 }}
            variants={processVariants}
            className="relative"
          >
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-rw-primary">
                Three simple steps
              </p>

              <h3 className="mt-3 text-2xl font-bold leading-snug text-rw-navy sm:text-3xl">
                Making local problems
                <span className="text-rw-primary"> harder to ignore.</span>
              </h3>
            </div>

            <div className="relative space-y-7">
              {/* Connecting line */}
              <div
                aria-hidden="true"
                className="absolute bottom-10 left-[23px] top-10 w-px bg-rw-border"
              />

              {steps.map((step) => {
                const Icon = step.icon;

                const iconColors = {
                  orange: "bg-orange-50 text-rw-primary border-orange-100",
                  navy: "bg-slate-100 text-rw-navy border-slate-200",
                  green: "bg-green-50 text-rw-success border-green-100",
                };

                return (
                  <motion.article
                    key={step.number}
                    variants={revealUp}
                    className="relative flex gap-4 sm:gap-5"
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

                <div>
                  <p className="font-semibold text-rw-navy">
                    Reporting is only the beginning.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-rw-muted">
                    The goal is to help make the fix visible and
                    give the community a way to verify the outcome.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-16 flex flex-col items-center justify-between gap-5 rounded-2xl bg-rw-navy px-6 py-7 sm:flex-row sm:px-9 sm:py-8"
        >
          <div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">
              Noticed something that needs fixing?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Make the problem visible. Help your community take action.
            </p>
          </div>

          <a
            href="/login"
            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-rw-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-rw-primary-dark"
          >
            Report a Problem
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
        </motion.div>

      </div>
    </section>
  );
};

export default HowItWorks;
