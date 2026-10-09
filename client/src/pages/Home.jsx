
import Navbar from "../components/Navbar";

const Home = () => {
  return (
    <div className="min-h-screen bg-rw-background">
      <Navbar />

      {/* Hero section will be built next */}
      <main
        id="home"
        className="flex min-h-[65vh] items-center justify-center px-5"
      >
        <div className="max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rw-primary">
            RoadWatch
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-rw-navy sm:text-5xl">
            A better community starts with a report.
          </h1>

          <p className="mt-5 leading-7 text-rw-muted">
            We're building a better way to report local problems
            and follow them through to resolution.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Home;

