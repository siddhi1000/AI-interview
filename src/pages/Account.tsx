import { UserProfile } from "@clerk/clerk-react";
import Sidebar from "@/components/Sidebar";

const Account = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="user" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Account</h1>
          <p className="text-muted-foreground">Manage your profile, security, and connected accounts.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <UserProfile path="/account" routing="path" />
        </div>
      </main>
    </div>
  );
};

export default Account;

