import React, { useEffect, useState } from 'react'
import AppLayout from '../../components/Layout/AppLayout'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import Skeleton from '../../components/ui/Skeleton'
import { dashboardApi } from '../../api/dashboardApi'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

export default function Analytics() {
  const [summary, setSummary] = useState(null)
  const [charts, setCharts] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardApi.getSummary(), dashboardApi.getCharts()])
      .then(([summaryRes, chartsRes]) => {
        setSummary(summaryRes.data)
        setCharts(chartsRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AppLayout>
        <div className="grid gap-6">
          <div>
            <Skeleton className="mb-3 h-9 w-56" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}><Skeleton className="h-20 w-full" /></Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}><Skeleton className="h-72 w-full" /></Card>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  const statusEntries = Object.entries(charts?.submission_status || {}).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-gray-400">Track team delivery, workload, and activity trends.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Reports', value: summary?.total_reports ?? 0, accent: 'blue' },
          { label: 'Submitted', value: summary?.submitted_reports ?? 0, accent: 'green' },
          { label: 'Pending', value: summary?.pending_reports ?? 0, accent: 'yellow' },
          { label: 'Open Blockers', value: summary?.open_blockers ?? 0, accent: 'red' },
        ].map((item) => (
          <Card key={item.label} hover>
            <p className="text-sm text-gray-400">{item.label}</p>
            <h3 className="mt-2 text-2xl font-bold text-white">{item.value}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-semibold text-white mb-6">Tasks Completed Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.tasks_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="week" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="total_tasks" stroke="#3b82f6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-6">Submission Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusEntries} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={4}>
                  {statusEntries.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-white mb-6">Project Workload</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.project_workload || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="project_name" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="total_hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
          <div className="space-y-3">
            {(charts?.recent_activity || []).map((item) => (
              <div key={item.report_id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-gray-300">
                <p className="font-medium text-white">{item.user_name} · {item.project_name}</p>
                <p className="mt-1">{item.status} · Week of {item.week_start}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
