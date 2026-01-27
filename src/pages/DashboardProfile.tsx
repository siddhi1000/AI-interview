import { Camera, Mail, Phone, MapPin, Briefcase, GraduationCap } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DashboardProfile = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="user" />
      
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center text-3xl font-bold text-white">
                  AJ
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/80 transition-colors">
                  <Camera size={16} />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Adrian Johnson</h2>
              <p className="text-muted-foreground">Full Stack Developer</p>
              
              <div className="mt-6 space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail size={16} />
                  <span>adrian.johnson@email.com</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone size={16} />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin size={16} />
                  <span>San Francisco, CA</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">14</p>
                    <p className="text-xs text-muted-foreground">Interviews</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">85%</p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">12</p>
                    <p className="text-xs text-muted-foreground">Badges</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Adrian" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Johnson" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="adrian.johnson@email.com" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" className="bg-secondary border-border" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Professional Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    <Briefcase size={14} />
                    Current Role
                  </Label>
                  <Input id="role" defaultValue="Full Stack Developer" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input id="experience" defaultValue="5 years" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education" className="flex items-center gap-2">
                    <GraduationCap size={14} />
                    Education
                  </Label>
                  <Input id="education" defaultValue="B.S. Computer Science" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" defaultValue="San Francisco, CA" className="bg-secondary border-border" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" className="border-border">Cancel</Button>
              <Button className="gradient-primary text-primary-foreground">Save Changes</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardProfile;
