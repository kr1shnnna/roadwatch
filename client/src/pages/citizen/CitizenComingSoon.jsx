
import { Link } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";

const CitizenComingSoon = ({ title, description }) => {
  return (
    <section className="mx-auto flex min-h-[55vh] max-w-2xl items-center justify-center">
      <div className="w-full rounded-2xl border border-rw-border bg-white px-6 py-12 text-center shadow-sm sm:px-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
          <Construction className="h-8 w-8 text-rw-primary" />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-rw-primary">
          RoadWatch
        </p>

        <h1 className="mt-3 text-2xl font-bold text-rw-navy sm:text-3xl">
          {title}
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-rw-muted">
          {description}
        </p>

        <Link
          to="/citizen"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-rw-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rw-primary-dark"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>
      </div>
    </section>
  );
};

export default CitizenComingSoon;

