import { useNavigate } from "react-router-dom";
import { Upload, FileText, ArrowLeft } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const UploadResume = () => {
  const navigate = useNavigate();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File uploaded:", file.name);
      // Add file upload logic here
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="user" />
      
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Upload Your Resume</h1>
            <p className="text-muted-foreground mt-1">Help us understand your background better</p>
          </div>
        </div>

        {/* Upload Card */}
        <Card className="max-w-2xl p-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="p-4 rounded-lg bg-primary/10">
              <Upload size={40} className="text-primary" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Upload Your Resume</h2>
              <p className="text-muted-foreground">
                Drag and drop your resume or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supported formats: PDF, DOC, DOCX (Max 10MB)
              </p>
            </div>

            {/* Upload Area */}
            <div className="w-full border-2 border-dashed border-primary/50 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <input 
                type="file" 
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx"
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer space-y-2">
                <FileText size={48} className="mx-auto text-primary/50" />
                <div>
                  <p className="text-foreground font-medium">Click to upload</p>
                  <p className="text-sm text-muted-foreground">or drag and drop</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 w-full">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
              <Button 
                className="gradient-primary text-primary-foreground flex-1"
                onClick={() => navigate("/interview")}
              >
                Continue to Interview
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default UploadResume;
