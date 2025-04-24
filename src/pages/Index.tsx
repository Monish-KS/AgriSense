
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { useAuth, SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/clerk-react"; // Import Clerk components/hooks
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/dashboard/card";
import { 
  Map, 
  FileBarChart, 
  Sun, 
  Sprout, 
  Droplets, 
  Store 
} from "lucide-react";
import { AgriSenseLogo } from "@/components/agrisense-logo";

const Index = () => {
  const { isSignedIn } = useAuth(); // Get authentication status
  const navigate = useNavigate(); // Get navigation function

  const handleGetStartedClick = () => {
    if (isSignedIn) {
      navigate("/dashboard");
    } else {
      navigate("/sign-in"); // Redirect to sign-in page
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-agrisense-light">
      {/* Header */}
      <header className="bg-agrisense-primary py-4 px-6 flex justify-between items-center">
        <AgriSenseLogo />
        <div className="flex gap-2 items-center"> {/* Adjusted gap */}
          <Button variant="ghost" className="text-white hover:text-white/90 hover:bg-agrisense-dark">Help</Button>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-agrisense-primary">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
               <Button className="bg-white text-agrisense-primary hover:bg-white/90">Sign Up</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
             <Button asChild variant="outline" className="text-white border-white hover:bg-white hover:text-agrisense-primary">
               <Link to="/dashboard">Dashboard</Link>
             </Button>
             {/* You might want a UserButton here too, but the main layout handles it */}
          </SignedIn>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-agrisense-primary text-white py-16 px-6 md:py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-b from-agrisense-dark to-agrisense-primary"></div>
          </div>
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="mb-6 flex justify-center">
              <img src="/agrisense-logo.svg" alt="AgriSense Logo" className="h-24 w-24" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">AgriSense</h1>
            <p className="text-xl mb-8">AI-Powered Agricultural Decision Support System for Indian Farmers</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-agrisense-primary hover:bg-white/90"
                onClick={handleGetStartedClick} // Use onClick handler
              >
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-agrisense-primary"> {/* Styled Learn More */}
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-agrisense-dark">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                title="Interactive Geospatial Interface"
                description="Explore your land with intuitive mapping tools designed for both mobile and desktop use."
                icon={<Map className="h-6 w-6" />}
              />
              <FeatureCard
                title="Soil Analytics"
                description="Get comprehensive soil analysis including NPK levels, pH balance, and more."
                icon={<FileBarChart className="h-6 w-6" />}
              />
              <FeatureCard
                title="Weather Forecasting"
                description="Access advanced agro-meteorological data to plan your farming activities."
                icon={<Sun className="h-6 w-6" />}
              />
              <FeatureCard
                title="Crop Recommendations"
                description="Receive AI-powered crop suggestions tailored to your specific soil and climate conditions."
                icon={<Sprout className="h-6 w-6" />}
              />
              <FeatureCard
                title="Water Resource Optimization"
                description="Optimize irrigation scheduling and water conservation techniques for your crops."
                icon={<Droplets className="h-6 w-6" />}
              />
              <FeatureCard
                title="Supply Chain Integration"
                description="Connect with local agricultural resources and markets for better planning."
                icon={<Store className="h-6 w-6" />}
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-agrisense-primary text-white py-16 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Farming?</h2>
            <p className="text-xl mb-8">
              Join thousands of farmers who are already using AgriSense to increase productivity and optimize resources.
            </p>
            <Button
              size="lg"
              className="bg-white text-agrisense-primary hover:bg-white/90"
              onClick={handleGetStartedClick} // Use onClick handler
            >
              Start Now
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-agrisense-dark text-white py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm">© 2025 AgriSense. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
