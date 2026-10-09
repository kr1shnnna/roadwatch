
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Menu,
  X,
  UserRound,
  LogOut,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dashboardPath =
    user?.role === "citizen"
      ? "/citizen"
      : user?.role === "officer"
        ? "/officer"
        : "/unauthorized";

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const scrollToTop = (event) => {
    event.preventDefault();
    closeMobileMenu();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleLogout = async () => {
    closeMobileMenu();
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-rw-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[82px] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">

        {/* Logo */}
        <a
          href="#home"
          onClick={scrollToTop}
          aria-label="RoadWatch home"
          className="shrink-0"
        >
          <img
            src="/logo/roadwatch-logo.png"
            alt="RoadWatch"
            className="h-14 w-auto max-w-[210px] object-contain object-left"
          />
        </a>

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Main navigation"
        >
          <a
            href="#home"
            onClick={scrollToTop}
            className="text-sm font-semibold text-rw-primary"
          >
            Home
          </a>

          <a
            href="#issues"
            className="text-sm font-medium text-rw-text-secondary transition-colors hover:text-rw-primary"
          >
            Reportable Issues
          </a>

          <a
            href="#how-it-works"
            className="text-sm font-medium text-rw-text-secondary transition-colors hover:text-rw-primary"
          >
            How It Works
          </a>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          {!loading &&
            (!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-rw-text-secondary transition-colors hover:bg-rw-surface-muted hover:text-rw-navy"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-rw-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rw-primary-dark"
                >
                  Join RoadWatch
                  <ArrowRight size={17} />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={dashboardPath}
                  className="inline-flex items-center gap-2 rounded-xl border border-rw-border px-4 py-2.5 text-sm font-semibold text-rw-navy transition-colors hover:bg-rw-surface-muted"
                >
                  <UserRound size={17} />
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl px-3 py-2.5 text-sm text-rw-muted transition-colors hover:bg-rw-danger-light hover:text-rw-danger"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut size={19} />
                </button>
              </>
            ))}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen((previous) => !previous)
          }
          className="rounded-xl p-2 text-rw-navy transition-colors hover:bg-rw-surface-muted md:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-rw-border bg-white px-5 py-5 md:hidden">
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-1"
            aria-label="Mobile navigation"
          >
            <a
              href="#home"
              onClick={scrollToTop}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-rw-primary hover:bg-rw-surface-muted"
            >
              Home
            </a>

            <a
              href="#issues"
              onClick={closeMobileMenu}
              className="rounded-xl px-4 py-3 text-sm font-medium text-rw-text-secondary hover:bg-rw-surface-muted"
            >
              Reportable Issues
            </a>

            <a
              href="#how-it-works"
              onClick={closeMobileMenu}
              className="rounded-xl px-4 py-3 text-sm font-medium text-rw-text-secondary hover:bg-rw-surface-muted"
            >
              How It Works
            </a>

            {!loading &&
              (!isAuthenticated ? (
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-rw-border pt-4">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="rounded-xl border border-rw-border px-3 py-3 text-center text-sm font-semibold text-rw-navy"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-rw-primary px-3 py-3 text-sm font-semibold text-white"
                  >
                    Join RoadWatch
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-2 border-t border-rw-border pt-4">
                  <Link
                    to={dashboardPath}
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center gap-2 rounded-xl bg-rw-primary px-4 py-3 text-sm font-semibold text-white"
                  >
                    <UserRound size={17} />
                    Go to Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-rw-danger hover:bg-rw-danger-light"
                  >
                    <LogOut size={17} />
                    Sign Out
                  </button>
                </div>
              ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;

