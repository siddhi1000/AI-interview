import { useNavigate, useLocation } from "react-router-dom";
import { SignOutButton, useUser } from "@clerk/clerk-react";
import { 
  LayoutDashboard, 
  History, 
  User, 
  Settings, 
  LogOut,
  Users,
  Mic,
  Activity
} from "lucide-react";
import PrepWiseLogo from "./PrepWiseLogo";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

interface SidebarProps {
  variant?: "user" | "admin";
}

const Sidebar = ({ variant = "user" }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const userNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: History, label: "History", path: "/history" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const adminNavItems = [
    { icon: LayoutDashboard, label: "Overview", path: "/admin" },
    { icon: Users, label: "Candidates", path: "/admin/candidates" },
    { icon: Mic, label: "Interviews", path: "/admin/interviews" },
  
  ];

  const navItems = variant === "admin" ? adminNavItems : userNavItems;

  return (
    <aside className="w-64 min-h-screen bg-background border-r border-border flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <PrepWiseLogo size="md" />
          {variant === "admin" && (
            <span className="text-xs text-muted-foreground">Admin Console</span>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? "gradient-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.imageUrl ?? ""} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {(user?.fullName ?? user?.firstName ?? user?.username ?? "U")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm truncate">
              {user?.fullName ?? user?.firstName ?? user?.username ?? "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress ?? ""}
            </p>
          </div>
        </div>
        
        <SignOutButton redirectUrl="/">
          <Button variant="ghost" className="w-full mt-2 text-muted-foreground hover:text-foreground">
            <LogOut size={18} className="mr-2" />
            Log Out
          </Button>
        </SignOutButton>
      </div>
    </aside>
  );
};

export default Sidebar;
