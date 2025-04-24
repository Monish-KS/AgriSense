import { Layout } from "@/components/layout"; // Import Layout
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // Added useNavigate back

// Sample job data (replace with actual data fetching, e.g., from Convex)
const initialJobs = [
  {
    id: 1,
    title: "Farm Labor",
    location: "Rajpur Village",
    description: "Seasonal crop harvesting work. Experience in agricultural work preferred.",
    postedDate: "2024-04-24",
  },
  {
    id: 2,
    title: "Construction Worker",
    location: "Mehsana District",
    description: "Road construction project. Physical labor required.",
    postedDate: "2024-04-23",
  },
  {
    id: 3,
    title: "Canal Cleaning",
    location: "Gandhinagar Area",
    description: "Manual cleaning of irrigation canals. Tools will be provided.",
    postedDate: "2024-04-22",
  },
];

const WorkerSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate(); // Added navigate back

  const filteredJobs = useMemo(() => {
    if (!searchTerm) {
      return initialJobs;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    return initialJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(lowerCaseSearch) ||
        job.location.toLowerCase().includes(lowerCaseSearch) ||
        job.description.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm]);

  const handleApply = (jobId: number, jobTitle: string) => {
    // Placeholder: In a real app, handle the application logic (e.g., update state, call API)
    console.log(`Applying for job ID: ${jobId}, Title: ${jobTitle}`);
    alert(`Application submitted for "${jobTitle}" (Placeholder)`);
  };


  return (
    <Layout>
      <div className="p-6 lg:p-12 flex flex-col items-center relative"> {/* Added relative positioning */}
        <Button
          variant="outline"
          onClick={() => navigate('/mgnrega')}
          className="absolute top-6 left-6 border-[#228B22] text-[#228B22] hover:bg-[#228B22] hover:text-white transition-colors"
        >
          Back to Portal
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold text-[#228B22] mb-8 flex items-center gap-3">
          Job Seeker Portal <Users className="h-8 w-8" />
        </h1>
        <div className="w-full max-w-4xl space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search jobs by title, location, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#228B22] focus:border-transparent text-base" // Adjusted styling
          />
        </div>

        <div className="space-y-4">
          {filteredJobs.length > 0 ? (
             filteredJobs.map((job) => (
              <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow bg-white border border-gray-200 rounded-lg"> {/* Added background and border */}
                <h3 className="text-xl font-semibold text-[#228B22] mb-2">{job.title}</h3>
                <p className="text-gray-600 mb-2 font-medium">{job.location}</p> {/* Added font-medium */}
                <p className="text-gray-500 mb-4">{job.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Posted: {job.postedDate}</span>
                  <Button
                    variant="outline"
                    onClick={() => handleApply(job.id, job.title)}
                    className="border-[#228B22] text-[#228B22] hover:bg-[#228B22] hover:text-white transition-colors px-4 py-1.5 rounded-md" // Adjusted padding and rounded
                  >
                    Apply Now
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500 py-10">No jobs found matching your search.</p>
          )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkerSection;