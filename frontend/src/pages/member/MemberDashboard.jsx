import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Skeleton from '../../components/ui/Skeleton';
import { reportsApi } from '../../api/reportsApi';
import { FileText, Clock, CheckCircle } from 'lucide-react';
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

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
        <p className="text-gray-400">Overview of your weekly reports and activity.</p>
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
    </AppLayout>
  );
}
