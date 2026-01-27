import { Bell, Shield, Moon, Globe, Volume2, Video } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DashboardSettings = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="user" />
      
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Customize your interview experience and account preferences.
          </p>
        </div>

        <div className="max-w-3xl space-y-6">
          {/* Notifications */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Bell className="text-primary" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                <p className="text-sm text-muted-foreground">Manage how you receive updates</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <Label className="text-foreground">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive interview reminders via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <Label className="text-foreground">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified about feedback and updates</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <Label className="text-foreground">Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">Receive a weekly progress report</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          {/* Interview Preferences */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Video className="text-cyan-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Interview Preferences</h3>
                <p className="text-sm text-muted-foreground">Configure your interview settings</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <Label className="text-foreground">Auto-record Sessions</Label>
                  <p className="text-sm text-muted-foreground">Automatically record your interviews</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <Label className="text-foreground">Show Transcription</Label>
                  <p className="text-sm text-muted-foreground">Display real-time transcription</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="grid grid-cols-2 gap-4 py-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Volume2 size={14} />
                    Audio Input
                  </Label>
                  <Select defaultValue="default">
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Microphone</SelectItem>
                      <SelectItem value="headset">Headset Microphone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Video size={14} />
                    Video Input
                  </Label>
                  <Select defaultValue="default">
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Camera</SelectItem>
                      <SelectItem value="external">External Webcam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Moon className="text-yellow-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
                <p className="text-sm text-muted-foreground">Customize the look and feel</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 py-3 border-b border-border">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Moon size={14} />
                    Theme
                  </Label>
                  <Select defaultValue="dark">
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe size={14} />
                    Language
                  </Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Shield className="text-red-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Security</h3>
                <p className="text-sm text-muted-foreground">Manage your account security</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <Label className="text-foreground">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch />
              </div>
              <div className="flex gap-4 pt-2">
                <Button variant="outline" className="border-border">Change Password</Button>
                <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardSettings;
