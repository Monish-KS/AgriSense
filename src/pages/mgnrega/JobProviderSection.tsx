import { Layout } from "@/components/layout"; // Import Layout
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { FilePlus, BriefcaseBusiness } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Added useNavigate back

const JobProviderSection = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate(); // Added navigate back

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: In a real app, you'd send this data to your backend (e.g., Convex)
    console.log("Job Posted:", { jobTitle, location, description });
    alert("Job Posted Successfully (Placeholder)"); // Simple feedback
    // Clear form
    setJobTitle("");
    setLocation("");
    setDescription("");
  };

  return (
    <Layout>
      <div className="p-6 lg:p-12 flex flex-col items-center relative">
        <Button
          variant="outline"
          onClick={() => navigate('/mgnrega')}
          className="absolute top-6 left-6 border-[#228B22] text-[#228B22] hover:bg-[#228B22] hover:text-white transition-colors"
        >
          Back to Portal
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold text-[#228B22] mb-8 flex items-center gap-3">
          Job Provider Portal <BriefcaseBusiness className="h-8 w-8 text-[#228B22]" />
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md w-full max-w-2xl border border-gray-200">
          <div className="space-y-4">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Farm Labor, Construction Worker"
                className="w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Village, District"
                className="w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Job Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the job requirements and responsibilities..."
                className="w-full min-h-[100px]"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#228B22] hover:bg-[#32CD32] transition-colors text-white"
          >
            <FilePlus className="w-4 h-4 mr-2" />
            Post Job
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default JobProviderSection;