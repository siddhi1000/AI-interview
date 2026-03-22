import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Briefcase } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AddDetails = () => {
  const navigate = useNavigate();
  const api = useApi();
  const { user } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const experienceToEnum = (value: string | null) => {
    if (!value) return null;
    if (value === "0-1") return "ZERO_TO_ONE";
    if (value === "1-3") return "ONE_TO_THREE";
    if (value === "3-5") return "THREE_TO_FIVE";
    if (value === "5-10") return "FIVE_TO_TEN";
    if (value === "10+") return "TEN_PLUS";
    return null;
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
            <h1 className="text-3xl font-bold text-foreground">Add Your Details</h1>
            <p className="text-muted-foreground mt-1">Complete your profile for personalized interviews</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="max-w-2xl p-8">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setSaving(true);
              try {
                const payload = {
                  firstName: String(form.get("firstName") ?? "").trim(),
                  lastName: String(form.get("lastName") ?? "").trim(),
                  phone: String(form.get("phone") ?? "").trim() || null,
                  experienceLevel: experienceToEnum(experience),
                  skills: String(form.get("skills") ?? "").trim() || null,
                  bio: String(form.get("bio") ?? "").trim() || null,
                  preferences: role ? { targetRole: role } : undefined,
                };
                await api.upsertProfile(payload);
                
                // Create the interview immediately after profile setup
                // We need to map the selected role to a jobRoleId or null
                // For now, we'll create a generic interview or use the role if it matches a DB role
                // Since "role" state is a string like "frontend", we might need to find a matching JobRole or pass null
                // The backend can handle jobRoleId: null and fallback to profile preferences
                
                const interviewRes = await api.createInterview({
                   // If we had a jobRoleId we would pass it here
                   // For now, we rely on the backend using the user's profile preferences to contextually generate questions
                });
                
                toast.success("Details saved. Starting interview...");
                // @ts-ignore
                navigate(`/interview/${interviewRes?.interview?.id}`);
              } catch (err: any) {
                toast.error(err.message || "Failed to save details.");
              } finally {
                setSaving(false);
              }
            }}
            className="space-y-8"
          >
            {/* Personal Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User size={20} className="text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName"
                      name="firstName"
                      placeholder="John" 
                      className="mt-2"
                      required
                      defaultValue={user?.firstName ?? ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName"
                      name="lastName"
                      placeholder="Doe" 
                      className="mt-2"
                      required
                      defaultValue={user?.lastName ?? ""}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="john@example.com" 
                    className="mt-2"
                    required
                    value={user?.primaryEmailAddress?.emailAddress ?? ""}
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000" 
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={20} className="text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Professional Information</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role">Target Role</Label>
                  <Select onValueChange={(v) => setRole(v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frontend">Front End Developer</SelectItem>
                      <SelectItem value="backend">Backend Developer</SelectItem>
                      <SelectItem value="fullstack">Full Stack Developer</SelectItem>
                      <SelectItem value="mobile">Mobile Developer</SelectItem>
                      <SelectItem value="devops">DevOps Engineer</SelectItem>
                      <SelectItem value="qa">QA Engineer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Select onValueChange={(v) => setExperience(v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0-1 years</SelectItem>
                      <SelectItem value="1-3">1-3 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5-10">5-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="skills">Key Skills</Label>
                  <Textarea 
                    id="skills"
                    name="skills"
                    placeholder="e.g., React, Node.js, TypeScript, Python..." 
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="bio">About You</Label>
                  <Textarea 
                    id="bio"
                    name="bio"
                    placeholder="Tell us about yourself, your background, and career goals..." 
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="gradient-primary text-primary-foreground flex-1"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save & Continue to Interview"}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default AddDetails;
