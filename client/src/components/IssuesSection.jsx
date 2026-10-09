
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Construction,
  Droplets,
  Lightbulb,
  ShieldAlert,
  TrafficCone,
  Wrench,
} from "lucide-react";

const issues = [
  {
    number: "01",
    icon: Construction,
    title: "Potholes & damaged roads",
    description:
      "Cracked surfaces and potholes can damage vehicles and make everyday journeys unsafe.",
    tag: "Road safety",
  },
  {
    number: "02",
    icon: Lightbulb,
    title: "Broken streetlights",
    description:
      "Report non-working or damaged streetlights that leave neighbourhood roads poorly lit.",
    tag: "Public lighting",
  },
  {
    number: "03",
    icon: Droplets,
    title: "Waterlogging & drainage",
    description:
      "Bring blocked drains and standing water to attention before they become bigger problems.",
    tag: "Drainage",
  },
  {
    number: "04",
    icon: TrafficCone,
    title: "Traffic signals & signs",
    description:
      "Make damaged traffic signals and missing or broken road signs visible to the right team.",
    tag: "Traffic safety",
  },
  {
    number: "05",
    icon: ShieldAlert,
    title: "Open manholes & hazards",
    description:
      "Highlight dangerous road hazards that could put pedestrians and motorists at risk.",
    tag: "Public safety",
  },
  {
    number: "06",
    icon: Wrench,
    title: "Other road infrastructure",
    description:
      "Report road debris, damaged infrastructure, and other issues that need attention.",
    tag: "Infrastructure",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const IssuesSection = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="issues"
      className="relative scroll-mt-24 overflow-hidden bg-rw-background"
    >
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-orange-100/50 blur-3xl" />

      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-slate-200/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        {/* Section introduction */}
        <motion.div
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={containerVariants}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm"
          >
            <span className="h-2 w-2 rounded-full bg-rw-primary" />
            Problems worth reporting
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="mt-6 text-3xl font-bold leading-tight tracking-tight text-rw-navy sm:text-4xl lg:text-5xl"
          >
            Small problems can make
            <span className="mt-2 block text-rw-primary">
              a big difference.
            </span>
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-5 max-w-2xl text-base leading-7 text-rw-muted sm:text-lg sm:leading-8"
          >
            A pothole on your daily route. A street that goes dark
            at night. A drain that never clears. These problems
            deserve attention, and reporting them is a place to start.
          </motion.p>
        </motion.div>

        {/* Issue cards */}
        <motion.div
          variants={containerVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-6"
        >
          {issues.map((issue) => {
            const Icon = issue.icon;

            return (
              <motion.article
                key={issue.number}
                variants={itemVariants}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -6,
                        transition: { duration: 0.22 },
                      }
                }
                className="group relative overflow-hidden rounded-2xl border border-rw-border bg-white p-6 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-orange-200 hover:shadow-lg sm:p-7"
              >
                {/* Top accent */}
                <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-rw-primary transition-transform duration-300 group-hover:scale-x-100" />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 transition-colors duration-300 group-hover:bg-rw-primary">
                    <Icon className="h-6 w-6 text-rw-primary transition-colors duration-300 group-hover:text-white" />
                  </div>

                  <span className="text-sm font-semibold tracking-wider text-slate-300">
                    {issue.number}
                  </span>
                </div>

                <div className="mt-6">
                  <span className="inline-flex rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-rw-muted">
                    {issue.tag}
                  </span>

                  <h3 className="mt-3 text-xl font-bold leading-snug text-rw-navy">
                    {issue.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-rw-muted">
                    {issue.description}
                  </p>
                </div>

                {/* Decorative arrow */}
                <div className="mt-6 flex items-center justify-between border-t border-rw-border pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-rw-muted transition-colors group-hover:text-rw-primary">
                    Make it visible
                  </span>

                  <ArrowUpRight
                    className="h-5 w-5 text-slate-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-rw-primary"
                    aria-hidden="true"
                  />
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        {/* Closing statement */}
        <motion.div
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0, y: 18 }
          }
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="mx-auto mt-12 flex max-w-3xl items-start justify-center gap-3 text-center sm:mt-14"
        >
          <Construction className="mt-0.5 h-5 w-5 shrink-0 text-rw-primary" />

          <p className="text-sm leading-6 text-rw-muted sm:text-base">
            Every report helps make a problem visible. Every
            verified repair is a step toward a better community.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default IssuesSection;

