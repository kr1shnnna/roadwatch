import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import IssuesSection from "../components/IssuesSection";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen bg-rw-background">
      <Navbar />
      <main>
        <Hero />

        <IssuesSection />

        <HowItWorks />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
