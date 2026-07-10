import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { reportsApi } from '../../api/reportsApi';
import { projectsApi } from '../../api/projectsApi';
import { FileText, Clock, CheckCircle, AlertOctagon, AlertTriangle, TrendingUp, ClipboardList } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function ManagerDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, submitted: 0, blockers: 0 });
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([reportsApi.getAll(), projectsApi.getAll()])
      .then(([repRes, projRes]) => {
        const reps = repRes.data;
        const projs = projRes.data;
        
        // Map projects for easy lookup
        const projMap = {};
        projs.forEach(p => { projMap[p.id] = p.name; });
        setProjects(projMap);
        setReports(reps);
        
        let pending = 0;
        let submitted = 0;
        let blockers = 0;
        
        reps.forEach(r => {
          if (r.status === 'draft') pending++;
          else submitted++;
          if (r.blockers && r.blockers.trim().length > 0) blockers++;
        });

        setStats({ total: reps.length, pending, submitted, blockers });
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <AppLayout><Spinner size="xl" className="mt-20" /></AppLayout>;

  // --- Chart Data Preparation ---

  // 1. Submission Status (Pie)
  const statusData = [
    { name: 'Submitted', value: stats.submitted },
    { name: 'Pending (Drafts)', value: stats.pending }
  ];

  // 2. Trend (Line) - Hours per week as proxy for work completed
  const trendMap = {};
  reports.forEach(r => {
    if (!trendMap[r.week_start]) trendMap[r.week_start] = 0;
    trendMap[r.week_start] += (r.hours_worked || 0);
  });
  const trendData = Object.keys(trendMap)
    .sort()
    .slice(-6) // Last 6 weeks
    .map(date => ({ name: date, hours: trendMap[date] }));

  // 3. Project Distribution (Bar)
  const projDistMap = {};
  reports.forEach(r => {
    const pName = projects[r.project_id] || `Project ${r.project_id}`;
    if (!projDistMap[pName]) projDistMap[pName] = 0;
    projDistMap[pName] += (r.hours_worked || 0);
  });
  const projectData = Object.keys(projDistMap).map(k => ({ name: k, hours: projDistMap[k] }));

  // 4. Recent Activity
  const recentActivity = [...reports]
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 5);

  const blockerReports = reports.filter((report) => report.blockers && report.blockers.trim().length > 0).slice(0, 3);
  const draftRate = stats.total ? Math.round((stats.pending / stats.total) * 100) : 0;
  const topProjectEntry = Object.entries(projDistMap).sort((a, b) => b[1] - a[1])[0];

  return (
    <AppLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2">Manager Dashboard</h1>
        <p className="text-gray-400">Team performance and reporting analytics.</p>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Card className="toolbar-entrance border border-blue-500/20 bg-blue-500/10">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-500/20 p-3 text-blue-300"><TrendingUp size={22} /></div>
            <div>
              <p className="text-sm text-blue-200">Draft rate</p>
              <h3 className="mt-1 text-2xl font-bold text-white">{draftRate}%</h3>
              <p className="mt-1 text-sm text-blue-100/80">{stats.pending} drafts need attention from the team.</p>
            </div>
          </div>
        </Card>
        <Card className="toolbar-entrance border border-purple-500/20 bg-purple-500/10">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-purple-500/20 p-3 text-purple-300"><ClipboardList size={22} /></div>
            <div>
              <p className="text-sm text-purple-200">Top project</p>
              <h3 className="mt-1 text-2xl font-bold text-white">{topProjectEntry?.[0] || 'No data'}</h3>
              <p className="mt-1 text-sm text-purple-100/80">{topProjectEntry ? `${topProjectEntry[1]} logged hours` : 'Start collecting reports to see trends.'}</p>
            </div>
          </div>
        </Card>
        <Card className="toolbar-entrance border border-amber-500/20 bg-amber-500/10">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-500/20 p-3 text-amber-300"><AlertTriangle size={22} /></div>
            <div>
              <p className="text-sm text-amber-200">Open blocker reports</p>
              <h3 className="mt-1 text-2xl font-bold text-white">{stats.blockers}</h3>
              <p className="mt-1 text-sm text-amber-100/80">These reports need follow-up before review.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card hover>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl"><FileText className="text-blue-400" size={24} /></div>
            <div><p className="text-sm text-gray-400">Total Reports</p><h3 className="text-2xl font-bold text-white">{stats.total}</h3></div>
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-xl"><Clock className="text-yellow-400" size={24} /></div>
            <div><p className="text-sm text-gray-400">Pending Reports</p><h3 className="text-2xl font-bold text-white">{stats.pending}</h3></div>
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl"><CheckCircle className="text-green-400" size={24} /></div>
            <div><p className="text-sm text-gray-400">Submitted Reports</p><h3 className="text-2xl font-bold text-white">{stats.submitted}</h3></div>
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl"><AlertOctagon className="text-red-400" size={24} /></div>
            <div><p className="text-sm text-gray-400">Open Blockers</p><h3 className="text-2xl font-bold text-white">{stats.blockers}</h3></div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Work Trend Chart */}
        <Card>
          <h3 className="text-lg font-bold text-white mb-6">Work Trend (Hours Logged)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Project Distribution Chart */}
        <Card>
          <h3 className="text-lg font-bold text-white mb-6">Project Distribution (Hours)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#374151'}} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Submission Status */}
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-bold text-white mb-6">Submission Status</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-sm text-gray-400">Submitted</span></div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span className="text-sm text-gray-400">Drafts</span></div>
          </div>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6">Recent Activity Feed</h3>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent activity.</p>
            ) : (
              recentActivity.map(r => (
                <div key={r.id} className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className={`p-2 rounded-lg ${r.status === 'submitted' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {r.status === 'submitted' ? <CheckCircle size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      User #{r.user_id} {r.status === 'submitted' ? 'submitted' : 'updated draft'} report
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Project: {projects[r.project_id] || r.project_id} | Week of {r.week_start}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="toolbar-entrance">
          <h3 className="text-lg font-bold text-white mb-4">Action reminders</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Pending drafts</p>
              <p className="mt-1 text-gray-400">{stats.pending} reports are still in draft. Ask the team to finalize them before review.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Reports with blockers</p>
              <p className="mt-1 text-gray-400">{blockerReports.length} of the latest reports contain blockers and need follow-up comments.</p>
            </div>
          </div>
        </Card>

        <Card className="toolbar-entrance">
          <h3 className="text-lg font-bold text-white mb-4">Needs attention</h3>
          <div className="space-y-3">
            {blockerReports.length === 0 ? (
              <p className="text-sm text-gray-400">No blocker reports right now.</p>
            ) : blockerReports.map((report) => (
              <div key={report.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="font-medium text-white">User #{report.user_id}</p>
                  <p className="mt-1 text-sm text-gray-400">Project: {projects[report.project_id] || report.project_id} | Week of {report.week_start}</p>
                </div>
                <AlertOctagon className="mt-0.5 text-red-400" size={18} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
