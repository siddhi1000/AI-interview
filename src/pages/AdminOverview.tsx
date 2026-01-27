import { Users, Video, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";

const AdminOverview = () => {
  const stats = [
    { 
      label: "Total Users", 
      value: "12,480", 
      trend: { value: "+12%", positive: true },
      icon: Users,
      color: "hsl(265 84% 66%)"
    },
    { 
      label: "Interviews Today", 
      value: "156", 
      trend: { value: "+8%", positive: true },
      icon: Video,
      color: "hsl(187 92% 45%)"
    },
    { 
      label: "Avg. Score", 
      value: "84%", 
      trend: { value: "+3%", positive: true },
      icon: TrendingUp,
      color: "hsl(142 71% 45%)"
    },
    { 
      label: "Avg. Duration", 
      value: "32 min", 
      trend: { value: "-5%", positive: false },
      icon: Clock,
      color: "hsl(32 95% 55%)"
    },
  ];

  const recentActivity = [
    { user: "Jane Doe", action: "completed", interview: "Full Stack Interview", time: "2 min ago", score: 92 },
    { user: "Mark Kim", action: "started", interview: "Backend Engineer", time: "5 min ago", score: null },
    { user: "Sarah Linn", action: "completed", interview: "System Design", time: "12 min ago", score: 88 },
    { user: "Robert Jones", action: "completed", interview: "Frontend Interview", time: "25 min ago", score: 76 },
    { user: "Emily Chen", action: "started", interview: "DevOps Interview", time: "30 min ago", score: null },
  ];

  const topPerformers = [
    { name: "Jane Doe", interviews: 14, avgScore: 92, initials: "JD", color: "hsl(265 84% 66%)" },
    { name: "Sarah Linn", interviews: 21, avgScore: 88, initials: "SL", color: "hsl(142 71% 45%)" },
    { name: "Alex Park", interviews: 18, avgScore: 86, initials: "AP", color: "hsl(187 92% 45%)" },
    { name: "Mike Chen", interviews: 12, avgScore: 85, initials: "MC", color: "hsl(32 95% 55%)" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="admin" />
      
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Overview</h1>
          <p className="text-muted-foreground">
            Monitor platform performance and user engagement at a glance.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon size={24} style={{ color: stat.color }} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.trend.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.trend.positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {stat.trend.value}
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                      {activity.user.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.user}</span>
                        {' '}
                        <span className={activity.action === 'completed' ? 'text-green-400' : 'text-cyan-400'}>
                          {activity.action}
                        </span>
                        {' '}
                        {activity.interview}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  {activity.score && (
                    <span className="text-sm font-medium text-green-400">{activity.score}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Top Performers</h3>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                      style={{ backgroundColor: performer.color }}
                    >
                      {performer.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{performer.name}</p>
                      <p className="text-xs text-muted-foreground">{performer.interviews} interviews</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">{performer.avgScore}%</p>
                    <p className="text-xs text-muted-foreground">avg score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminOverview;
