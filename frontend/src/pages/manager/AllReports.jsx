import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Skeleton from '../../components/ui/Skeleton';
import { reportsApi } from '../../api/reportsApi';
import { Link } from 'react-router-dom';
import { Download, FileDown } from 'lucide-react';
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

export default function AllReports() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reportsApi.getAll().then(res => setReports(res.data)).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const exportCsv = () => {
    const header = ['User ID', 'Week', 'Project ID', 'Hours', 'Status'];
    const rows = reports.map((report) => [
      report.user_id,
      report.week_start,
      report.project_id,
      report.hours_worked,
      report.status,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsvValue).join(','))
      .join('\n');

    downloadBlob(`all-reports-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`, csv, 'text/csv;charset=utf-8;')
  }

  const exportPdf = async () => {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF('p', 'mm', 'a4')
    doc.setFontSize(16)
    doc.text('Team Reports', 14, 16)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Generated on ${format(new Date(), 'PPP p')}`, 14, 22)

    autoTable(doc, {
      startY: 28,
      head: [['User ID', 'Week', 'Project ID', 'Hours', 'Status']],
      body: reports.map((report) => [
        report.user_id,
        report.week_start,
        report.project_id,
        report.hours_worked,
        report.status.toUpperCase(),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 },
    })

    doc.save(`all-reports-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`)
  }

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Team Reports</h1>
          <p className="text-gray-400">View and filter all team reports.</p>
        </div>
        <div className="toolbar-entrance flex flex-wrap gap-3">
          <button type="button" onClick={exportCsv} className="btn-secondary inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button type="button" onClick={exportPdf} className="btn-primary inline-flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
        </div>
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
                    <th className="px-6 py-3 rounded-tl-lg">User ID</th>
                    <th className="px-6 py-3">Week</th>
                    <th className="px-6 py-3">Project ID</th>
                    <th className="px-6 py-3">Hours</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-4 text-center">No reports found.</td></tr>
                  ) : reports.map(r => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{r.user_id}</td>
                      <td className="px-6 py-4 font-medium text-white">{r.week_start}</td>
                      <td className="px-6 py-4">{r.project_id}</td>
                      <td className="px-6 py-4">{r.hours_worked}h</td>
                      <td className="px-6 py-4">
                        <Badge variant={r.status === 'draft' ? 'warning' : r.status === 'submitted' ? 'info' : 'success'}>
                          {r.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="grid gap-4 md:hidden">
            {reports.length === 0 ? (
              <Card>
                <p className="py-4 text-center text-gray-400">No reports found.</p>
              </Card>
            ) : reports.map((r) => (
              <Card key={r.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">User #{r.user_id}</p>
                    <p className="mt-1 text-sm text-gray-400">Week of {r.week_start}</p>
                  </div>
                  <Badge variant={r.status === 'draft' ? 'warning' : r.status === 'submitted' ? 'info' : 'success'}>
                    {r.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Project {r.project_id}</span>
                  <span>{r.hours_worked}h</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}
