import { useEffect, useState, useCallback, useRef } from "react";
import { Users, Video, TrendingUp, Clock, ArrowUpRight, ArrowDownRight, RefreshCw, WifiOff, ShieldAlert } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@clerk/clerk-react";

interface DashboardStats {
  totalUsers: number;
  interviewsToday: number;
  avgScore: number;
  avgDuration: number;
  activeUsers: number;
  pendingReviews: number;
  completionRate: number;
}

interface RecentActivity {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  action: 'completed' | 'started' | 'cancelled';
  interviewId: string;
  interviewTitle: string;
  time: string;
  timestamp: Date;
  score: number | null;
}

interface TopPerformer {
  id: string;
  name: string;
  initials: string;
  color: string;
  interviewsCompleted: number;
  avgScore: number;
  totalInterviews: number;
}

// Cache keys for localStorage
const CACHE_KEYS = {
  STATS: 'admin_stats_cache',
  ACTIVITY: 'admin_activity_cache',
  PERFORMERS: 'admin_performers_cache',
  TIMESTAMP: 'admin_cache_timestamp'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const AdminOverview = () => {
  const [stats, setStats] = useState<DashboardStats>(() => {
    const cached = localStorage.getItem(CACHE_KEYS.STATS);
    return cached 
      ? JSON.parse(cached) 
      : {
          totalUsers: 0,
          interviewsToday: 0,
          avgScore: 0,
          avgDuration: 0,
          activeUsers: 0,
          pendingReviews: 0,
          completionRate: 0
        };
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>(() => {
    const cached = localStorage.getItem(CACHE_KEYS.ACTIVITY);
    return cached ? JSON.parse(cached) : [];
  });
  
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>(() => {
    const cached = localStorage.getItem(CACHE_KEYS.PERFORMERS);
    return cached ? JSON.parse(cached) : [];
  });
  
  const [loading, setLoading] = useState({ stats: true, activity: true, performers: true });
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline' | 'unauthorized'>('checking');
  const [authChecked, setAuthChecked] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const api = useApi();
  const { toast } = useToast();
  const { isSignedIn } = useAuth();
  
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const fetchInProgress = useRef({ stats: false, activity: false, performers: false });
  const lastFetchTime = useRef({ stats: 0, activity: 0, performers: 0 });
  const FETCH_COOLDOWN = 10000;

  // ==================== FIXED & IMPROVED NAME HELPER ====================
  // This now perfectly matches the name handling in AdminCandidates.tsx
  // (c.name || c.email) + extra safety for Clerk user_ IDs + support for both
  // interview.user AND interview.candidate structures.
  const getCleanDisplayName = useCallback((data: any): string => {
    if (!data) return 'Unknown User';

    // If someone passed a raw string
    if (typeof data === 'string') {
      return data.trim() || 'Unknown User';
    }

    // Priority order (exactly like AdminCandidates + extra Clerk safety)
    const name = data.name 
      || data.fullName 
      || data.displayName 
      || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}`.trim() : null)
      || (data.profile?.firstName && data.profile?.lastName ? `${data.profile.firstName} ${data.profile.lastName}`.trim() : null)
      || data.profile?.name;

    if (name && typeof name === 'string' && name.length > 1 && !name.startsWith('user_')) {
      return name.trim();
    }

    // Email fallback (same as AdminCandidates)
    if (data.email && typeof data.email === 'string') {
      return data.email.split('@')[0];
    }
    if (data.emailAddress && typeof data.emailAddress === 'string') {
      return data.emailAddress.split('@')[0];
    }

    // Hide raw Clerk user_ IDs (never show them as username)
    const possibleId = data.id || data.userId || data._id || data.user?.id || '';
    if (typeof possibleId === 'string' && possibleId.startsWith('user_')) {
      return 'Candidate';
    }

    return 'Unknown User';
  }, []);
  // ==================================================================

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isSignedIn === false) {
      setConnectionStatus('unauthorized');
      setAuthChecked(true);
    } else if (isSignedIn === true) {
      setAuthChecked(true);
    }
  }, [isSignedIn]);

  const checkConnection = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch('http://localhost:3001/api/health', {
        signal: controller.signal,
        mode: 'cors'
      }).catch(() => null);
      clearTimeout(timeoutId);
      return response?.ok === true;
    } catch {
      return false;
    }
  }, []);

  const saveToCache = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (e) {
      console.warn('Failed to save to cache:', e);
    }
  }, []);

  const isCacheValid = useCallback(() => {
    const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
    if (!timestamp) return false;
    return Date.now() - parseInt(timestamp) < CACHE_DURATION;
  }, []);

  const fetchStats = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetchTime.current.stats) < FETCH_COOLDOWN) return;
    if (fetchInProgress.current.stats || !isMounted.current || !isSignedIn) return;

    fetchInProgress.current.stats = true;
    lastFetchTime.current.stats = now;
    setLoading(prev => ({ ...prev, stats: true }));

    try {
      const statsData = await api.getAdminStats();
      if (!isMounted.current) return;

      if (statsData) {
        const newStats: DashboardStats = {
          totalUsers: statsData.totalUsers || 0,
          interviewsToday: statsData.interviewsToday || 0,
          avgScore: statsData.avgPerformance || 0,
          avgDuration: statsData.avgDuration || 0,
          activeUsers: statsData.activeUsers || 0,
          pendingReviews: statsData.pendingReviews || 0,
          completionRate: statsData.completionRate || 0
        };
        setStats(newStats);
        saveToCache(CACHE_KEYS.STATS, newStats);
        setConnectionStatus('online');
      }
    } catch (error: any) {
      if (!isMounted.current) return;
      console.error('❌ Stats fetch failed:', error);
      if (error.message?.includes('Unauthorized')) setConnectionStatus('unauthorized');
      else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) setConnectionStatus('offline');
    } finally {
      if (isMounted.current) {
        setLoading(prev => ({ ...prev, stats: false }));
        fetchInProgress.current.stats = false;
      }
    }
  }, [api, isSignedIn, saveToCache]);

  // FIXED: Recent Activity now correctly shows real candidate names
  const fetchRecentActivity = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetchTime.current.activity) < FETCH_COOLDOWN) return;
    if (fetchInProgress.current.activity || !isMounted.current || !isSignedIn || connectionStatus !== 'online') return;

    fetchInProgress.current.activity = true;
    lastFetchTime.current.activity = now;
    setLoading(prev => ({ ...prev, activity: true }));

    try {
      const response = await api.listInterviewsAdmin({ limit: 5, page: 1 });
      if (!isMounted.current) return;

      if (response?.interviews && response.interviews.length > 0) {
        const nowDate = new Date();
        const activities = response.interviews
          .filter((i: any) => i?.user || i?.candidate)   // support both structures
          .slice(0, 5)
          .map((interview: any) => {
            // FIXED: Try user → candidate → fallback to whole interview object
            const userData = interview.user || interview.candidate || interview;
            const userName = getCleanDisplayName(userData);

            const initials = userName
              .split(' ')
              .map((n: string) => n?.[0] || '')
              .join('')
              .toUpperCase()
              .slice(0, 2) || '??';

            const interviewDate = new Date(interview.createdAt || Date.now());
            const diffMinutes = Math.floor((nowDate.getTime() - interviewDate.getTime()) / (1000 * 60));
            
            let timeString = '';
            if (diffMinutes < 1) timeString = 'just now';
            else if (diffMinutes < 60) timeString = `${diffMinutes} min ago`;
            else if (diffMinutes < 1440) {
              const hours = Math.floor(diffMinutes / 60);
              timeString = `${hours} hour${hours > 1 ? 's' : ''} ago`;
            } else {
              timeString = interviewDate.toLocaleDateString();
            }

            return {
              id: interview.id,
              userId: interview.user?.id || interview.candidate?.id || '',
              userName,
              userInitials: initials,
              action: interview.status === 'COMPLETED' ? 'completed' : 
                     interview.status === 'IN_PROGRESS' ? 'started' : 'cancelled',
              interviewId: interview.id,
              interviewTitle: interview.jobRole?.title || interview.title || 'Interview',
              time: timeString,
              timestamp: interviewDate,
              score: interview.feedback?.overallScore || null
            };
          })
          .sort((a: RecentActivity, b: RecentActivity) => b.timestamp.getTime() - a.timestamp.getTime());

        setRecentActivity(activities);
        saveToCache(CACHE_KEYS.ACTIVITY, activities);
      } else {
        setRecentActivity([]);
        saveToCache(CACHE_KEYS.ACTIVITY, []);
      }
    } catch (error: any) {
      if (!isMounted.current) return;
      console.error('❌ Activity fetch failed:', error);
    } finally {
      if (isMounted.current) {
        setLoading(prev => ({ ...prev, activity: false }));
        fetchInProgress.current.activity = false;
      }
    }
  }, [api, connectionStatus, isSignedIn, saveToCache, getCleanDisplayName]);

  const fetchTopPerformers = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetchTime.current.performers) < FETCH_COOLDOWN) return;
    if (fetchInProgress.current.performers || !isMounted.current || !isSignedIn || connectionStatus !== 'online') return;

    fetchInProgress.current.performers = true;
    lastFetchTime.current.performers = now;
    setLoading(prev => ({ ...prev, performers: true }));

    try {
      const response = await api.listCandidatesAdmin({ limit: 5, page: 1 });
      if (!isMounted.current) return;

      if (response?.candidates && response.candidates.length > 0) {
        const colors = [
          'hsl(265 84% 66%)',
          'hsl(142 71% 45%)',
          'hsl(187 92% 45%)',
          'hsl(32 95% 55%)',
          'hsl(0 84% 60%)'
        ];

        const performers = response.candidates
          .filter((c: any) => (c.interviewsCompleted || 0) > 0)
          .sort((a: any, b: any) => (b.avgScore || 0) - (a.avgScore || 0))
          .slice(0, 5)
          .map((candidate: any, index: number) => {
            const cleanName = getCleanDisplayName(candidate);

            const initials = cleanName
              .split(' ')
              .map((n: string) => n?.[0] || '')
              .join('')
              .toUpperCase()
              .slice(0, 2) || '??';

            return {
              id: candidate.id,
              name: cleanName,
              initials,
              color: colors[index % colors.length],
              interviewsCompleted: candidate.interviewsCompleted || 0,
              avgScore: Math.round(candidate.avgScore || 0),
              totalInterviews: candidate.interviewsCompleted || 0
            };
          });

        setTopPerformers(performers);
        saveToCache(CACHE_KEYS.PERFORMERS, performers);
      } else {
        setTopPerformers([]);
        saveToCache(CACHE_KEYS.PERFORMERS, []);
      }
    } catch (error: any) {
      if (!isMounted.current) return;
      console.error('❌ Performers fetch failed:', error);
    } finally {
      if (isMounted.current) {
        setLoading(prev => ({ ...prev, performers: false }));
        fetchInProgress.current.performers = false;
      }
    }
  }, [api, connectionStatus, isSignedIn, saveToCache, getCleanDisplayName]);

  useEffect(() => {
    if (initialLoadDone.current || !authChecked) return;
    initialLoadDone.current = true;

    const initialize = async () => {
      if (!isSignedIn) {
        setConnectionStatus('unauthorized');
        setLoading({ stats: false, activity: false, performers: false });
        setInitialized(true);
        return;
      }

      const isConnected = await checkConnection();
      if (!isConnected) {
        setConnectionStatus('offline');
        setLoading({ stats: false, activity: false, performers: false });
        setInitialized(true);
        return;
      }

      setConnectionStatus('online');

      if (isCacheValid()) {
        setLoading({ stats: false, activity: false, performers: false });
        setInitialized(true);
        setTimeout(() => {
          fetchStats(true);
          fetchRecentActivity(true);
          fetchTopPerformers(true);
        }, 800);
      } else {
        await Promise.all([fetchStats(true), fetchRecentActivity(true), fetchTopPerformers(true)]);
        setInitialized(true);
      }
    };

    initialize();

    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (isMounted.current && connectionStatus === 'online' && isSignedIn) fetchStats();
      }, 300000);
    }
  }, [authChecked, isSignedIn, checkConnection, fetchStats, fetchRecentActivity, fetchTopPerformers, connectionStatus, isCacheValid]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (!isSignedIn) {
        setConnectionStatus('unauthorized');
        toast({ title: "Authentication Error", description: "Please sign in to refresh data", variant: "destructive" });
        return;
      }

      const isConnected = await checkConnection();
      if (!isConnected) {
        setConnectionStatus('offline');
        toast({ title: "Connection Error", description: "Server is not responding", variant: "destructive" });
        return;
      }

      setConnectionStatus('online');
      await Promise.all([fetchStats(true), fetchRecentActivity(true), fetchTopPerformers(true)]);
      toast({ title: "Success", description: "Dashboard refreshed successfully" });
    } catch (error: any) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const statCards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), trend: { value: `+${Math.round((stats.activeUsers / (stats.totalUsers || 1)) * 100)}%`, positive: true }, icon: Users, color: "hsl(265 84% 66%)" },
    { label: "Interviews Today", value: stats.interviewsToday.toString(), trend: { value: stats.interviewsToday > 0 ? "+12%" : "0%", positive: stats.interviewsToday > 0 }, icon: Video, color: "hsl(187 92% 45%)" },
    { label: "Avg. Score", value: stats.avgScore > 0 ? `${stats.avgScore}%` : '—', trend: { value: stats.avgScore > 75 ? "+5%" : stats.avgScore > 0 ? "-2%" : "0%", positive: stats.avgScore > 75 }, icon: TrendingUp, color: "hsl(142 71% 45%)" },
    { label: "Avg. Duration", value: stats.avgDuration > 0 ? `${stats.avgDuration} min` : '—', trend: { value: stats.avgDuration > 0 && stats.avgDuration < 35 ? "-7%" : stats.avgDuration > 0 ? "+3%" : "0%", positive: stats.avgDuration > 0 && stats.avgDuration < 35 }, icon: Clock, color: "hsl(32 95% 55%)" },
  ];

  const getActionColor = (action: string) => {
    switch(action) {
      case 'completed': return 'text-green-400';
      case 'started': return 'text-cyan-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  if (!authChecked || !initialized) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar variant="admin" />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="admin" />
      <main className="flex-1 p-8 overflow-auto">
        {/* Header + Refresh */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Overview</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              {connectionStatus === 'online' && isSignedIn && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live Data
                </span>
              )}
              {connectionStatus === 'offline' && (
                <span className="flex items-center gap-1 text-orange-500">
                  <WifiOff size={14} />
                  Offline Mode
                </span>
              )}
              {connectionStatus === 'unauthorized' && (
                <span className="flex items-center gap-1 text-red-500">
                  <ShieldAlert size={14} />
                  Unauthorized
                </span>
              )}
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing || connectionStatus === 'unauthorized'} variant="outline" className="gap-2">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Alerts */}
        {connectionStatus === 'unauthorized' && (
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>You need admin privileges to access this page.</AlertDescription>
          </Alert>
        )}
        {connectionStatus === 'offline' && (
          <Alert variant="destructive" className="mb-6">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Server Offline</AlertTitle>
            <AlertDescription>
              Cannot connect to backend server.
              <Button variant="link" className="px-1 h-auto text-destructive-foreground underline" onClick={handleRefresh}>Retry connection</Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {loading.stats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                <Skeleton className="h-9 w-28 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          ) : statCards.map((stat, index) => (
            <div key={index} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                  <stat.icon size={26} style={{ color: stat.color }} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.trend.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.trend.positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {stat.trend.value}
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity - NOW SHOWS REAL USER NAMES */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
            {loading.activity ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm flex-shrink-0">
                        {activity.userInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm truncate">
                          <span className="font-medium">{activity.userName}</span>{' '}
                          <span className={getActionColor(activity.action)}>{activity.action}</span>{' '}
                          <span className="truncate">{activity.interviewTitle}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                    {activity.score && <span className="text-green-400 font-medium ml-2 flex-shrink-0">{activity.score}%</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>

          {/* Top Performers */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-6">Top Performers</h3>
            {loading.performers ? (
              <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-6 h-4" />
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-14" />
                  </div>
                ))}
              </div>
            ) : topPerformers.length > 0 ? (
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div key={performer.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center text-muted-foreground font-medium flex-shrink-0">#{index + 1}</span>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0" style={{ backgroundColor: performer.color }}>
                        {performer.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{performer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {performer.interviewsCompleted} interview{performer.interviewsCompleted !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="text-2xl font-bold text-green-400">{performer.avgScore}%</p>
                      <p className="text-xs text-muted-foreground">avg score</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No performers yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminOverview;