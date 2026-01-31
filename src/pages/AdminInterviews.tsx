import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Play, Eye, Trash2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const AdminInterviews = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const api = useApi();
  const navigate = useNavigate();
  const [remote, setRemote] = useState<any[] | null>(null);

  const fallback = [
    { 
      id: 1,
      candidate: "Jane Doe",
      email: "jane.doe@example.com",
      type: "Full Stack Interview",
      date: "Mar 19, 2025",
      duration: "45 min",
      score: 92,
      status: "completed",
      initials: "JD",
      color: "hsl(265 84% 66%)"
    },
    { 
      id: 2,
      candidate: "Mark Kim",
      email: "m.kim@techcorp.io",
      type: "Backend Engineer",
      date: "Mar 19, 2025",
      duration: "32 min",
      score: null,
      status: "in-progress",
      initials: "MK",
      color: "hsl(187 92% 45%)"
    },
    { 
      id: 3,
      candidate: "Sarah Linn",
      email: "slinn.ux@gmail.com",
      type: "System Design",
      date: "Mar 18, 2025",
      duration: "60 min",
      score: 88,
      status: "completed",
      initials: "SL",
      color: "hsl(142 71% 45%)"
    },
    { 
      id: 4,
      candidate: "Robert Jones",
      email: "rjones@domain.com",
      type: "Frontend Interview",
      date: "Mar 18, 2025",
      duration: "38 min",
      score: 76,
      status: "completed",
      initials: "RJ",
      color: "hsl(32 95% 55%)"
    },
    { 
      id: 5,
      candidate: "Emily Chen",
      email: "emily.chen@startup.io",
      type: "DevOps Interview",
      date: "Mar 17, 2025",
      duration: "25 min",
      score: null,
      status: "cancelled",
      initials: "EC",
      color: "hsl(0 84% 60%)"
    },
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await api.listInterviewsAdmin();
        setRemote((res?.interviews as any[]) ?? []);
      } catch {
        setRemote(null);
      }
    })();
  }, [searchQuery]);

  const interviews = useMemo(() => {
    if (!remote) return fallback;

    const toColor = (seed: string) => {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
      const hue = hash % 360;
      return `hsl(${hue} 84% 66%)`;
    };

    const filtered = searchQuery
      ? remote.filter((i) => {
          const email = (i.user?.email ?? "").toLowerCase();
          const title = (i.jobRole?.title ?? "Interview").toLowerCase();
          return email.includes(searchQuery.toLowerCase()) || title.includes(searchQuery.toLowerCase());
        })
      : remote;

    return filtered.slice(0, 200).map((i) => {
      const email = i.user?.email ?? "";
      const candidate = email;
      const initials = email.slice(0, 2).toUpperCase();
      const started = i.startedAt ? new Date(i.startedAt).getTime() : null;
      const ended = i.endedAt ? new Date(i.endedAt).getTime() : null;
      const durationMinutes = started && ended ? Math.max(1, Math.round((ended - started) / 60000)) : null;
      const date = new Date(i.createdAt ?? Date.now()).toLocaleDateString();
      const status =
        i.status === "COMPLETED" ? "completed" : i.status === "IN_PROGRESS" ? "in-progress" : i.status === "CANCELLED" ? "cancelled" : "scheduled";
      return {
        id: i.id,
        candidate,
        email,
        type: i.jobRole?.title ?? "Interview",
        date,
        duration: durationMinutes ? `${durationMinutes} min` : "—",
        score: i.feedback?.overallScore ?? null,
        status,
        initials,
        color: toColor(email),
      };
    });
  }, [remote, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">Completed</span>;
      case "in-progress":
        return <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">In Progress</span>;
      case "cancelled":
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="admin" />
      
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Interview Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage all interview sessions across the platform.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-sm">Total Interviews</p>
            <p className="text-2xl font-bold text-foreground">2,847</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-sm">Active Now</p>
            <p className="text-2xl font-bold text-cyan-400">23</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-sm">Completed Today</p>
            <p className="text-2xl font-bold text-green-400">156</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-sm">Avg. Score</p>
            <p className="text-2xl font-bold text-primary">84%</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search by candidate, email, or interview type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-card border-border h-12"
            />
          </div>
          <Button variant="outline" className="h-12 px-6 border-border">
            Status
            <ChevronDown size={16} className="ml-2" />
          </Button>
          <Button variant="outline" className="h-12 px-6 border-border">
            Interview Type
            <ChevronDown size={16} className="ml-2" />
          </Button>
          <Button variant="outline" className="h-12 px-6 border-border">
            Date Range
            <ChevronDown size={16} className="ml-2" />
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Candidate
                </th>
                <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Interview Type
                </th>
                <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="text-center py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Duration
                </th>
                <th className="text-center py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Score
                </th>
                <th className="text-center py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((interview) => (
                <tr key={interview.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                        style={{ backgroundColor: interview.color }}
                      >
                        {interview.initials}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{interview.candidate}</p>
                        <p className="text-sm text-muted-foreground">{interview.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-foreground">{interview.type}</td>
                  <td className="py-4 px-4 text-muted-foreground">{interview.date}</td>
                  <td className="py-4 px-4 text-center text-muted-foreground">{interview.duration}</td>
                  <td className="py-4 px-4 text-center">
                    {interview.score ? (
                      <span className="font-medium text-green-400">{interview.score}%</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">{getStatusBadge(interview.status)}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      {interview.status === "in-progress" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-cyan-400 hover:text-cyan-300">
                          <Play size={16} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/admin/feedback?interviewId=${encodeURIComponent(interview.id)}`)}
                      >
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-4 py-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {interviews.length} of 2,847 interviews
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 border-border">
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 border-border">
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminInterviews;
