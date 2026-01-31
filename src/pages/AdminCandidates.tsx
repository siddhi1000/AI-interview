import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import CandidateRow from "@/components/CandidateRow";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/api";

const AdminCandidates = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const api = useApi();
  const [remoteCandidates, setRemoteCandidates] = useState<any[] | null>(null);

  const stats = [
    { label: "Total Registered Users", value: "12,480", trend: { value: "+12%", positive: true } },
    { label: "Interviews Conducted Today", value: "156", trend: { value: "+5%", positive: true } },
    { label: "Avg. Platform Performance", value: "84%", trend: { value: "-2%", positive: false } },
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await api.listCandidatesAdmin({ q: searchQuery || undefined });
        setRemoteCandidates((res?.candidates as any[]) ?? []);
      } catch {
        setRemoteCandidates(null);
      }
    })();
  }, [searchQuery]);

  const candidates = useMemo(() => {
    const toColor = (seed: string) => {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
      const hue = hash % 360;
      return `hsl(${hue} 84% 66%)`;
    };

    const toInitials = (nameOrEmail: string) => {
      const parts = nameOrEmail.split(" ").filter(Boolean);
      const raw = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : nameOrEmail.slice(0, 2);
      return raw.toUpperCase();
    };

    const list = remoteCandidates ?? [];
    return list.map((c) => {
      const name = c.name || c.email;
      return {
        name,
        email: c.email,
        totalInterviews: c.interviewsCompleted ?? 0,
        avgScore: c.avgScore ?? 0,
        lastActive: new Date(c.createdAt).toLocaleDateString(),
        initials: toInitials(name),
        color: toColor(c.email),
      };
    });
  }, [remoteCandidates]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="admin" />
      
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Candidate Management</h1>
          <p className="text-muted-foreground">
            Manage registered candidates, review AI-generated feedback, and monitor recruitment performance across the platform.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard 
              key={index} 
              label={stat.label} 
              value={stat.value} 
              trend={stat.trend}
            />
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search candidates by name, email, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-card border-border h-12"
            />
          </div>
          <Button variant="outline" className="h-12 px-6 border-border">
            Date Range
            <ChevronDown size={16} className="ml-2" />
          </Button>
          <Button variant="outline" className="h-12 px-6 border-border">
            Score Bracket
            <ChevronDown size={16} className="ml-2" />
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Candidate Name
                </th>
                <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="text-center py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Interviews
                </th>
                <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Avg. Score
                </th>
                <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Active
                </th>
                <th className="text-center py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate, index) => (
                <CandidateRow key={index} {...candidate} />
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-4 py-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {candidates.length} of 12,480 candidates
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

export default AdminCandidates;
