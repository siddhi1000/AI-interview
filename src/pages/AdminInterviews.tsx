import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Play, Eye, Trash2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner"; // ← add this import (if using sonner)

const AdminInterviews = () => {
  const api = useApi();
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completedToday: 0,
    avgScore: "—",
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch function – reusable for initial load + after delete
  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.listInterviewsAdmin();
      const allInterviews = res?.interviews ?? [];

      // Stats
      const total = allInterviews.length;
      const active = allInterviews.filter((i: any) => i.status === "IN_PROGRESS").length;
      const today = new Date().toISOString().split("T")[0];
      const completedToday = allInterviews.filter(
        (i: any) =>
          i.status === "COMPLETED" &&
          i.endedAt &&
          new Date(i.endedAt).toISOString().split("T")[0] === today
      ).length;

      const completedWithScore = allInterviews.filter(
        (i: any) => i.status === "COMPLETED" && i.feedback?.overallScore != null
      );
      const avgScore =
        completedWithScore.length > 0
          ? (
              completedWithScore.reduce(
                (sum: number, i: any) => sum + (i.feedback?.overallScore || 0),
                0
              ) / completedWithScore.length
            ).toFixed(0) + "%"
          : "—";

      setStats({ total, active, completedToday, avgScore });

      // Enrich data for UI
      const enriched = allInterviews.map((i: any) => {
        const email = i.user?.email ?? "unknown@example.com";
        const candidate = email.split("@")[0] || "Unknown";
        const initials = email.slice(0, 2).toUpperCase();
        const toColor = (seed: string) => {
          let hash = 0;
          for (let j = 0; j < seed.length; j++) hash = (hash * 31 + seed.charCodeAt(j)) >>> 0;
          const hue = hash % 360;
          return `hsl(${hue} 84% 66%)`;
        };

        const started = i.startedAt ? new Date(i.startedAt).getTime() : null;
        const ended = i.endedAt ? new Date(i.endedAt).getTime() : null;
        const durationMinutes =
          started && ended ? Math.max(1, Math.round((ended - started) / 60000)) : null;

        return {
          id: i.id,
          candidate,
          email,
          type: i.jobRole?.title ?? "General Interview",
          date: i.createdAt
            ? new Date(i.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—",
          duration: durationMinutes ? `${durationMinutes} min` : "—",
          score: i.feedback?.overallScore ?? null,
          status: i.status?.toLowerCase() ?? "scheduled",
          rawStatus: i.status,
          createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
          color: toColor(email),
        };
      });

      setInterviews(enriched);
    } catch (err) {
      console.error("Failed to load interviews:", err);
      toast.error("Failed to load interviews");
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  // Filter logic (client-side)
  const filteredInterviews = useMemo(() => {
    let result = [...interviews];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.email.toLowerCase().includes(q) ||
          i.candidate.toLowerCase().includes(q) ||
          i.type.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((i) => i.status === statusFilter);
    }

    if (typeFilter !== "all") {
      result = result.filter((i) => i.type === typeFilter);
    }

    const now = new Date();
    if (dateRange === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter((i) => i.createdAt >= todayStart);
    } else if (dateRange === "week") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      result = result.filter((i) => i.createdAt >= weekStart);
    } else if (dateRange === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      result = result.filter((i) => i.createdAt >= monthStart);
    }

    return result;
  }, [interviews, searchQuery, statusFilter, typeFilter, dateRange]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInterviews.slice(start, start + pageSize);
  }, [filteredInterviews, page]);

  const totalFiltered = filteredInterviews.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);

  const uniqueTypes = useMemo(() => {
    const types = new Set(interviews.map((i) => i.type));
    return Array.from(types).sort();
  }, [interviews]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">Completed</span>;
      case "in-progress":
        return <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">In Progress</span>;
      case "cancelled":
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">Cancelled</span>;
      case "scheduled":
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">Scheduled</span>;
      default:
        return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this interview? This action cannot be undone.")) {
      return;
    }

    try {
      // Call backend DELETE endpoint
      await api.deleteInterview(id);   // ← this must be implemented on backend

      toast.success("Interview deleted successfully");

      // Re-fetch full list (safest way – stats & filters stay accurate)
      await fetchInterviews();

      // Optional: reset page if current page becomes empty
      if (paginated.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err: any) {
      console.error("Delete failed:", err);
      toast.error(err.message || "Failed to delete interview");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading interviews...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="admin" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Interview Management</h1>
          <p className="text-muted-foreground">Monitor and manage all interview sessions across the platform.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-sm">Total Interviews</p>
            <p className="text-2xl font-bold text-foreground">{stats.total.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-sm">Active Now</p>
            <p className="text-2xl font-bold text-cyan-400">{stats.active}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-sm">Completed Today</p>
            <p className="text-2xl font-bold text-green-400">{stats.completedToday}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-sm">Avg. Score</p>
            <p className="text-2xl font-bold text-primary">{stats.avgScore}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search by candidate, email, or interview type..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-12 bg-card border-border h-12"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] h-12 border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px] h-12 border-border">
              <SelectValue placeholder="Interview Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] h-12 border-border">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No interviews found matching your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((interview) => (
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
                      {interview.score !== null ? (
                        <span className="font-medium text-green-400">{interview.score}%</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">{getStatusBadge(interview.status)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {interview.rawStatus === "IN_PROGRESS" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-cyan-400 hover:text-cyan-300"
                          >
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => handleDelete(interview.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="px-4 py-4 border-t border-border flex items-center justify-between flex-wrap gap-4">
            <span className="text-sm text-muted-foreground">
              Showing {paginated.length} of {totalFiltered.toLocaleString()} interviews
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-border"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm font-medium">
                Page {page} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-border"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
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