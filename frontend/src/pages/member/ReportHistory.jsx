import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Skeleton from '../../components/ui/Skeleton';
import { reportsApi } from '../../api/reportsApi';
import { Link } from 'react-router-dom';
import { Download, FileDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

function escapeCsvValue(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function downloadBlob(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ReportHistory() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    reportsApi.getAll().then(res => {
      setReports(res.data);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const filteredReports = reports.filter((report) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query
      || String(report.project_id).includes(query)
      || String(report.week_start).includes(query)
      || String(report.week_end).includes(query)
      || String(report.status).toLowerCase().includes(query)
      || String(report.hours_worked ?? '').includes(query);

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportCsv = async () => {
    setIsExportingCsv(true)
    try {
      const header = ['Week Start', 'Week End', 'Project ID', 'Hours', 'Status'];
      const rows = filteredReports.map((report) => [
        report.week_start,
        report.week_end,
        report.project_id,
        report.hours_worked,
        report.status,
      ]);

      const csv = [header, ...rows]
        .map((row) => row.map(escapeCsvValue).join(','))
        .join('\n')

      downloadBlob(`my-reports-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`, csv, 'text/csv;charset=utf-8;')
      await new Promise((resolve) => window.setTimeout(resolve, 450))
    } finally {
      setIsExportingCsv(false)
    }
  }

  const exportPdf = async () => {
    setIsExportingPdf(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF('p', 'mm', 'a4')
      doc.setFontSize(16)
      doc.text('My Reports', 14, 16)
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Generated on ${format(new Date(), 'PPP p')}`, 14, 22)

      autoTable(doc, {
        startY: 28,
        head: [['Week Start', 'Week End', 'Project ID', 'Hours', 'Status']],
        body: filteredReports.map((report) => [
          report.week_start,
          report.week_end,
          report.project_id,
          report.hours_worked,
          report.status.toUpperCase(),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 9 },
      })

      doc.save(`my-reports-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`)
      await new Promise((resolve) => window.setTimeout(resolve, 600))
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Reports</h1>
          <p className="text-gray-400">View all your past reports.</p>
        </div>
        <div className="toolbar-entrance flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportCsv}
            disabled={isExportingCsv || isExportingPdf}
            className={`btn-secondary inline-flex items-center gap-2 ${isExportingCsv ? 'download-feedback animate-pulse' : ''}`}
          >
            {isExportingCsv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isExportingCsv ? 'Generating CSV...' : 'Export CSV'}
          </button>
          <button
            type="button"
            onClick={exportPdf}
            disabled={isExportingCsv || isExportingPdf}
            className={`btn-primary inline-flex items-center gap-2 ${isExportingPdf ? 'download-feedback animate-pulse' : ''}`}
          >
            {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {isExportingPdf ? 'Generating PDF...' : 'Export PDF'}
          </button>
        </div>
      </div>
      <div className="toolbar-entrance mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 lg:grid-cols-[1fr_auto]">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by project, week, status, or hours..."
          className="input-field"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field lg:w-56"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
        <span>Showing {filteredReports.length} of {reports.length} reports</span>
        <span>{statusFilter === 'all' ? 'All statuses' : statusFilter.toUpperCase()}</span>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}><Skeleton className="h-24 w-full" /></Card>
          ))}
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <Card className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-white/5">
                  <tr>
                    <th className="px-6 py-3 rounded-tl-lg">Week</th>
                    <th className="px-6 py-3">Project ID</th>
                    <th className="px-6 py-3">Hours</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-4 text-center">No reports found.</td></tr>
                  ) : filteredReports.map(r => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{r.week_start} to {r.week_end}</td>
                      <td className="px-6 py-4">{r.project_id}</td>
                      <td className="px-6 py-4">{r.hours_worked}h</td>
                      <td className="px-6 py-4">
                        <Badge variant={r.status === 'draft' ? 'warning' : r.status === 'submitted' ? 'info' : 'success'}>
                          {r.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          to={r.status === 'draft' ? `/reports/${r.id}/edit` : '#'} 
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {r.status === 'draft' ? 'Edit' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="grid gap-4 md:hidden">
            {filteredReports.length === 0 ? (
              <Card>
                <p className="py-4 text-center text-gray-400">No reports found.</p>
              </Card>
            ) : filteredReports.map((r) => (
              <Card key={r.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Week of {r.week_start}</p>
                    <p className="mt-1 text-sm text-gray-400">Project ID: {r.project_id}</p>
                  </div>
                  <Badge variant={r.status === 'draft' ? 'warning' : r.status === 'submitted' ? 'info' : 'success'}>
                    {r.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{r.hours_worked}h logged</span>
                  <Link to={r.status === 'draft' ? `/reports/${r.id}/edit` : '#'} className="text-blue-400 hover:text-blue-300">
                    {r.status === 'draft' ? 'Edit' : 'View'}
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}
