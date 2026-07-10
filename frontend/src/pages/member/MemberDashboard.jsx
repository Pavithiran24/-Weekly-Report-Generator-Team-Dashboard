import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Skeleton from '../../components/ui/Skeleton';
import { reportsApi } from '../../api/reportsApi';
import { FileText, Clock, CheckCircle, Bell, CalendarCheck2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MemberDashboard() {
  const [stats, setStats] = useState({ total: 0, drafts: 0, submitted: 0, hours: 0 });
  const [recentReports, setRecentReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await reportsApi.getAll();
        const reports = response.data;
        
        let drafts = 0;
        let submitted = 0;
        let hours = 0;
        
        reports.forEach(r => {
          if (r.status === 'draft') drafts++;
          else submitted++;
          hours += (r.hours_worked || 0);
        });

        setStats({
          total: reports.length,
          drafts,
          submitted,
          hours
        });
        
        // Get 3 most recent
        setRecentReports(reports.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <div>
            <Skeleton className="mb-3 h-9 w-56" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <Skeleton className="h-16 w-full" />
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <Skeleton className="h-16 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  const latestDraft = recentReports.find((report) => report.status === 'draft');
  const totalHours = stats.hours;
  const submittedRate = stats.total ? Math.round((stats.submitted / stats.total) * 100) : 0;
  const reminderText = latestDraft
    ? `You have a draft for the week of ${latestDraft.week_start}. Finish and submit it before the review deadline.`
    : 'Great job. No unfinished drafts are waiting right now.';

  return (
    <AppLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
        <p className="text-gray-400">Overview of your weekly reports and activity.</p>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="toolbar-entrance border border-cyan-500/20 bg-cyan-500/10">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-cyan-500/20 p-3 text-cyan-300"><Bell size={22} /></div>
            <div>
              <p className="text-sm text-cyan-200">Weekly reminder</p>
              <h3 className="mt-1 text-xl font-bold text-white">Stay on top of your report</h3>
              <p className="mt-2 text-sm text-cyan-100/80">{reminderText}</p>
            </div>
          </div>
        </Card>
        <Card className="toolbar-entrance border border-emerald-500/20 bg-emerald-500/10">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-300"><CalendarCheck2 size={22} /></div>
            <div>
              <p className="text-sm text-emerald-200">Completion rate</p>
              <h3 className="mt-1 text-2xl font-bold text-white">{submittedRate}%</h3>
              <p className="mt-1 text-sm text-emerald-100/80">{totalHours} hours logged across your reports.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
        <Card hover>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <FileText className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Reports</p>
              <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
            </div>
          </div>
        </Card>
        
        <Card hover>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <Clock className="text-yellow-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Drafts</p>
              <h3 className="text-2xl font-bold text-white">{stats.drafts}</h3>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Submitted</p>
              <h3 className="text-2xl font-bold text-white">{stats.submitted}</h3>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Clock className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Hours Logged</p>
              <h3 className="text-2xl font-bold text-white">{stats.hours}h</h3>
            </div>
          </div>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Recent Reports</h2>
      <div className="grid gap-4">
        {recentReports.length === 0 ? (
          <Card>
            <p className="text-gray-400 text-center py-4">No reports found. Start by creating one!</p>
          </Card>
        ) : (
          recentReports.map(report => (
            <Card key={report.id} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <h4 className="font-semibold text-white">Week of {report.week_start}</h4>
                <p className="text-sm text-gray-400 mt-1">Project ID: {report.project_id}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={report.status === 'draft' ? 'warning' : 'success'}>
                  {report.status.toUpperCase()}
                </Badge>
                <Link to={report.status === 'draft' ? `/reports/${report.id}/edit` : `/reports/history`} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                  {report.status === 'draft' ? 'Edit' : 'View'} &rarr;
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="toolbar-entrance">
          <h3 className="text-lg font-bold text-white mb-4">Quick actions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/reports/create" className="btn-primary text-center">Create report</Link>
            <Link to="/reports/history" className="btn-secondary text-center">View history</Link>
          </div>
        </Card>
        <Card className="toolbar-entrance">
          <h3 className="text-lg font-bold text-white mb-4">Status summary</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="flex items-center gap-2 text-white"><AlertCircle size={16} className="text-yellow-400" /> Drafts waiting</span>
              <span>{stats.drafts}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="flex items-center gap-2 text-white"><CheckCircle size={16} className="text-green-400" /> Submitted</span>
              <span>{stats.submitted}</span>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
