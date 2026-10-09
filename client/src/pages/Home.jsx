
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";

const Home = () => {
  return (
    <div className="min-h-screen bg-rw-background">
      <Navbar />
      <main>
        <Hero />

        {/* Reportable Issues section will go here next */}
      </main>
    </div>
  );
};

export default Home;
