
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import IssuesSection from "../components/IssuesSection";

const Home = () => {
  return (
    <div className="min-h-screen bg-rw-background">
      <Navbar />
      <main>
        <Hero />
        
        <IssuesSection />
      </main>
    </div>
  );
};

export default Home;
