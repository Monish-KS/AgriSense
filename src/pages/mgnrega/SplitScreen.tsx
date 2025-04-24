import { Layout } from "@/components/layout"; // Import Layout
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, Users } from "lucide-react";

const SplitScreen = () => {
  const navigate = useNavigate();

  return (
    <Layout> {/* Wrap content in Layout */}
      <div className="flex flex-col p-6 lg:p-12 items-center"> {/* Removed min-h-screen and background */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 text-center mb-12">MGNREGA Job Portal</h1>

        <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto w-full">
          {/* Provider Section */}
        <Card
          className="flex-1 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer p-8 rounded-lg border border-gray-200" // Added border
          onClick={() => navigate("/provider")} // Navigate to provider page
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-[#8B4513]">Job Providers</h2>
              <BriefcaseBusiness className="h-8 w-8 md:h-10 md:w-10 text-[#8B4513]" />
            </div>

            <div className="space-y-4">
              <p className="text-gray-700 font-semibold">Requirements:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Must be a registered organization or contractor</li>
                <li>Valid business registration documents</li>
                <li>Comply with MGNREGA wage regulations</li>
                <li>Provide safe working conditions</li>
                <li>Regular payment schedule</li>
              </ul>
            </div>

            <Button className="w-full bg-[#8B4513] hover:bg-[#CD853F] transition-colors text-white py-3 text-lg rounded-md"> {/* Added rounded-md */}
              Enter as Provider
            </Button>
          </div>
        </Card>

        {/* Worker Section */}
        <Card
          className="flex-1 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer p-8 rounded-lg border border-gray-200" // Added border
          onClick={() => navigate("/worker")} // Navigate to worker page
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-[#228B22]">Job Seekers</h2>
              <Users className="h-8 w-8 md:h-10 md:w-10 text-[#228B22]" />
            </div>

            <div className="space-y-4">
              <p className="text-gray-700 font-semibold">Requirements:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Must be 18 years or older</li>
                <li>Valid job card/registration</li>
                <li>Local residence proof</li>
                <li>Bank account details</li>
                <li>Basic identification documents</li>
              </ul>
            </div>

            <Button className="w-full bg-[#228B22] hover:bg-[#32CD32] transition-colors text-white py-3 text-lg rounded-md"> {/* Added rounded-md */}
              Enter as Job Seeker
            </Button>
          </div>
          </Card>
        </div>
      </div>
    </Layout> // Close Layout
  );
};

export default SplitScreen;