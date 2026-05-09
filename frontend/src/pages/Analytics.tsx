import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { Loader2, TrendingUp, DollarSign, CheckCircle2, Activity } from 'lucide-react';
import api from '../api/client';
import { AnalyticsSummary, DealStage } from '../types';
import StatCard from '../components/StatCard';

const STAGE_COLORS: Record<DealStage, string> = {
  LEAD: '#9ca3af', QUALIFIED: '#60a5fa', PROPOSAL: '#fbbf24',
  NEGOTIATION: '#fb923c', CLOSED_WON: '#4ade80', CLOSED_LOST: '#f87171',
};

const ACTIVITY_COLORS: Record<string, string> = {
  EMAIL: '#3b82f6', CALL: '#22c55e', MEETING: '#a855f7', NOTE: '#eab308', TASK: '#6b7280',
};

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function AnalyticsPage() {
  const { data: summary, isLoading: sumLoading } = useQuery<AnalyticsSummary>({
    queryKey: ['analytics-summary'],
    queryFn: () => api.get('/api/analytics/summary').then((r) => r.data),
  });

  const { data: activityData, isLoading: actLoading } = useQuery<{
    byType: { type: string; count: number }[];
    byDay: { date: string; count: number }[];
  }>({
    queryKey: ['analytics-activities'],
    queryFn: () => api.get('/api/analytics/activities').then((r) => r.data),
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery<{ month: string; revenue: number; count: number }[]>({
    queryKey: ['analytics-monthly'],
    queryFn: () => api.get('/api/analytics/deals/monthly').then((r) => r.data),
  });

  const isLoading = sumLoading || actLoading || monthlyLoading;

  if (isLoading || !summary) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const pipelineChartData = summary.pipeline?.map((p) => ({
    name: p.stage.replace('_', ' '),
    stage: p.stage as DealStage,
    count: p.count,
    value: p.value,
  })) ?? [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Performance overview</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Won Revenue" value={fmt(summary.wonRevenue)} icon={DollarSign} iconBg="bg-green-50" iconColor="text-green-600" sub={`${summary.wonCount} deals`} />
        <StatCard label="Active Pipeline" value={fmt(summary.activePipelineValue)} icon={TrendingUp} iconBg="bg-orange-50" iconColor="text-orange-600" sub={`${summary.activeDealsCount} deals`} />
        <StatCard label="Conversion Rate" value={`${summary.conversionRate}%`} icon={CheckCircle2} iconBg="bg-blue-50" iconColor="text-blue-600" sub={`${summary.lostCount} lost`} />
        <StatCard label="Total Activities" value={summary.totalActivities} icon={Activity} iconBg="bg-purple-50" iconColor="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pipeline by stage */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Deals by Stage</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pipelineChartData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'value' ? fmt(value as number) : value,
                  name === 'value' ? 'Value' : 'Count',
                ]}
              />
              <Bar dataKey="count" name="count" radius={[4, 4, 0, 0]}>
                {pipelineChartData.map((entry, i) => (
                  <Cell key={i} fill={STAGE_COLORS[entry.stage]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity breakdown */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Activity by Type</h2>
          {activityData?.byType && activityData.byType.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={activityData.byType}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {activityData.byType.map((entry, i) => (
                    <Cell key={i} fill={ACTIVITY_COLORS[entry.type] ?? '#6b7280'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400 text-sm">No activity data</div>
          )}
        </div>
      </div>

      {/* Monthly revenue */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-5">Monthly Closed Revenue</h2>
        {monthlyData && monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
              <Tooltip formatter={(v) => [fmt(v as number), 'Revenue']} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No closed deal data yet</div>
        )}
      </div>

      {/* Activity over time */}
      {activityData?.byDay && activityData.byDay.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Activities (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={activityData.byDay} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Activities" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
