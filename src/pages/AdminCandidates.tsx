import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import CandidateRow from "@/components/CandidateRow";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface Candidate {
  id: string;
  name: string;
  email: string;
  interviewsCompleted: number;
  avgScore: number;
  createdAt: string;
  lastActive: string;
  status: string;
  skills: string[];
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Filters {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  scoreBracket: string[];
  status: string[];
}

const AdminCandidates = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [filters, setFilters] = useState<Filters>({
    dateRange: { from: undefined, to: undefined },
    scoreBracket: [],
    status: []
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    interviewsToday: 0,
    avgPerformance: 0,
    activeUsers: 0,
    pendingReviews: 0
  });

  const api = useApi();
  const { toast } = useToast();

  // Fetch candidates with all filters
  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching candidates with params:', {
        page: pagination.page,
        limit: pagination.limit,
        q: searchQuery || undefined
      });

      const response = await api.listCandidatesAdmin({
        page: pagination.page,
        limit: pagination.limit,
        q: searchQuery || undefined,
      });
      
      console.log('Candidates response:', response);

      if (response && response.candidates) {
        setCandidates(response.candidates);
        setPagination(prev => ({
          ...prev,
          total: response.total || 0,
          totalPages: response.totalPages || Math.ceil((response.total || 0) / prev.limit)
        }));
      } else {
        setCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch candidates. Please try again.",
        variant: "destructive",
      });
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, pagination.page, pagination.limit, api, toast]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      console.log('Fetching admin stats...');
      const statsData = await api.getAdminStats();
      console.log('Stats response:', statsData);
      
      setStats({
        totalUsers: statsData.totalUsers || 0,
        interviewsToday: statsData.interviewsToday || 0,
        avgPerformance: statsData.avgPerformance || 0,
        activeUsers: statsData.activeUsers || 0,
        pendingReviews: statsData.pendingReviews || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [api]);

  // Initial fetch
  useEffect(() => {
    fetchCandidates();
    fetchStats();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchCandidates();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch when pagination changes
  useEffect(() => {
    fetchCandidates();
  }, [pagination.page, pagination.limit]);

  // Handle candidate action
  const handleCandidateAction = async (action: string, candidateId: string) => {
    try {
      switch (action) {
        case 'view':
          window.location.href = `/admin/candidates/${candidateId}`;
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this candidate?')) {
            await api.deleteCandidate(candidateId);
            toast({
              title: "Success",
              description: "Candidate deleted successfully",
            });
            fetchCandidates();
          }
          break;
        case 'suspend':
          await api.suspendCandidate(candidateId);
          toast({
            title: "Success",
            description: "Candidate suspended successfully",
          });
          fetchCandidates();
          break;
        case 'activate':
          await api.activateCandidate(candidateId);
          toast({
            title: "Success",
            description: "Candidate activated successfully",
          });
          fetchCandidates();
          break;
        default:
          break;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} candidate`,
        variant: "destructive",
      });
    }
  };

  // Transform candidates for display
  const displayCandidates = useMemo(() => {
    const toColor = (seed: string) => {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
      const hue = hash % 360;
      return `hsl(${hue} 84% 66%)`;
    };

    const toInitials = (nameOrEmail: string) => {
      if (!nameOrEmail) return '??';
      const parts = nameOrEmail.split(" ").filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return nameOrEmail.slice(0, 2).toUpperCase();
    };

    return candidates.map((c) => {
      const name = c.name || c.email;
      return {
        id: c.id,
        name,
        email: c.email,
        totalInterviews: c.interviewsCompleted ?? 0,
        avgScore: c.avgScore ?? 0,
        lastActive: c.lastActive || c.createdAt,
        initials: toInitials(name),
        color: toColor(c.email),
        status: c.status || 'active',
        skills: c.skills || []
      };
    });
  }, [candidates]);

  const statCards = [
    { 
      label: "Total Registered Users", 
      value: stats.totalUsers.toLocaleString(), 
      trend: { value: "+12%", positive: true } 
    },
    { 
      label: "Interviews Conducted Today", 
      value: stats.interviewsToday.toString(), 
      trend: { value: stats.interviewsToday > 150 ? "+5%" : "-2%", positive: stats.interviewsToday > 150 } 
    },
    { 
      label: "Avg. Platform Performance", 
      value: `${stats.avgPerformance}%`, 
      trend: { value: stats.avgPerformance > 80 ? "+3%" : "-1%", positive: stats.avgPerformance > 80 } 
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="admin" />
      
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Candidate Management
          </h1>
          <p className="text-muted-foreground">
            Manage {stats.totalUsers.toLocaleString()} registered candidates, review AI-generated feedback, 
            and monitor recruitment performance across the platform.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
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
              placeholder="Search candidates by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-card border-border h-12"
            />
          </div>

          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 px-6 border-border">
                <Calendar size={16} className="mr-2" />
                {filters.dateRange.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, "LLL dd, y")} - {format(filters.dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(filters.dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Date Range"
                )}
                <ChevronDown size={16} className="ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={filters.dateRange}
                onSelect={(range) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { from: range?.from, to: range?.to } 
                }))}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-6 border-border">
                Status
                <ChevronDown size={16} className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuCheckboxItem
                checked={filters.status.includes('active')}
                onCheckedChange={(checked) => {
                  const newStatus = checked 
                    ? [...filters.status, 'active']
                    : filters.status.filter(s => s !== 'active');
                  setFilters(prev => ({ ...prev, status: newStatus }));
                }}
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status.includes('inactive')}
                onCheckedChange={(checked) => {
                  const newStatus = checked 
                    ? [...filters.status, 'inactive']
                    : filters.status.filter(s => s !== 'inactive');
                  setFilters(prev => ({ ...prev, status: newStatus }));
                }}
              >
                Inactive
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status.includes('suspended')}
                onCheckedChange={(checked) => {
                  const newStatus = checked 
                    ? [...filters.status, 'suspended']
                    : filters.status.filter(s => s !== 'suspended');
                  setFilters(prev => ({ ...prev, status: newStatus }));
                }}
              >
                Suspended
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  Status
                </th>
                <th className="text-center py-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-6 w-16 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-8 w-20 mx-auto" /></td>
                  </tr>
                ))
              ) : displayCandidates.length > 0 ? (
                displayCandidates.map((candidate) => (
                  <CandidateRow 
                    key={candidate.id} 
                    {...candidate} 
                    onAction={handleCandidateAction}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No candidates found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {candidates.length > 0 && (
            <div className="px-4 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} candidates
              </span>
              
              <div className="flex items-center gap-4">
                <select
                  value={pagination.limit}
                  onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                  className="bg-card border border-border rounded-md px-3 py-2 text-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9 border-border"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="text-sm px-3">
                    Page {pagination.page} of {pagination.totalPages || 1}
                  </span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9 border-border"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminCandidates;