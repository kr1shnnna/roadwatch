
import { Link } from "react-router-dom";
import { ArrowUpRight, Heart } from "lucide-react";

import { useAuth } from "../context/AuthContext";

const socialLinks = [
  {
    name: "Facebook",
    url: "https://www.facebook.com/your-roadwatch-page",
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/company/your-roadwatch-page",
  },
  {
    name: "X",
    url: "https://x.com/your-roadwatch-page",
  },
];

const SocialIcon = ({ name }) => {
  if (name === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.8-.1-1.7-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5v2.2H7v3.2h2.8V21h3.7z" />
      </svg>
    );
  }

  if (name === "LinkedIn") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM3.56 9h3.56v11.45H3.56zM22.22 0H1.78C.8 0 0 .77 0 1.73v20.54C0 23.23.8 24 1.78 24h20.44c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
      </svg>
    );
  }

  // X brand mark
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zM17.61 20.65h2.04L6.49 3.24H4.3z" />
    </svg>
  );
};

const Footer = () => {
  const { user, isAuthenticated } = useAuth();

  const dashboardPath =
    user?.role === "citizen"
      ? "/citizen"
      : user?.role === "officer"
        ? "/officer"
        : "/unauthorized";

  return (
    <footer className="border-t border-white/10 bg-rw-navy text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

        {/* Main footer row */}
        <div className="flex flex-col gap-6 py-7 md:flex-row md:items-center md:justify-between">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" aria-label="RoadWatch home" className="shrink-0">
              <img
                src="/logo/roadwatch-logo.png"
                alt="RoadWatch"
                className="h-11 w-auto max-w-[165px] object-contain object-left"
              />
            </Link>

            <p className="max-w-[190px] border-l border-white/15 pl-3 text-xs leading-5 text-slate-400">
              Helping communities get local problems fixed.
            </p>
          </div>

          {/* Navigation */}
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-5 gap-y-3"
          >
            <Link
              to="/"
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              Home
            </Link>

            <a
              href="/#issues"
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              Issues
            </a>

            <a
              href="/#how-it-works"
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              How it works
            </a>

            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-1 text-sm font-semibold text-rw-primary transition-colors hover:text-orange-300"
              >
                Dashboard
                <ArrowUpRight size={15} />
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} RoadWatch. Built for the community, with{" "}
            <Heart
              size={12}
              className="inline fill-rw-primary text-rw-primary"
            />
          </p>

          {/* Social icons — right side */}
          <div className="flex items-center gap-3">
            <span className="mr-1 text-xs text-slate-400">
              Follow us
            </span>

            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`RoadWatch on ${social.name}`}
                title={social.name}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-rw-primary hover:bg-rw-primary hover:text-white"
              >
                <span className="h-[17px] w-[17px]">
                  <SocialIcon name={social.name} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

