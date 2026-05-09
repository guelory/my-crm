import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, DollarSign, TrendingUp, Activity,
  ArrowRight, CheckCircle2, XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/client';
import { AnalyticsSummary, DealStage } from '../types';
import StatCard from '../components/StatCard';
import ActivityIcon from '../components/ActivityIcon';

const STAGE_LABELS: Record<DealStage, string> = {
  LEAD: 'Lead', QUALIFIED: 'Qualified', PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation', CLOSED_WON: 'Won', CLOSED_LOST: 'Lost',
};

const STAGE_COLORS: Record<DealStage, string> = {
  LEAD: 'bg-gray-400', QUALIFIED: 'bg-blue-400', PROPOSAL: 'bg-yellow-400',
  NEGOTIATION: 'bg-orange-400', CLOSED_WON: 'bg-green-500', CLOSED_LOST: 'bg-red-400',
};

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ['analytics-summary'],
    queryFn: () => api.get('/api/analytics/summary').then((r) => r.data),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const maxStageValue = Math.max(...(data.pipeline?.map((p) => p.count) ?? [1]), 1);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Your CRM at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Contacts"
          value={data.totalContacts}
          icon={Users}
        />
        <StatCard
          label="Won Revenue"
          value={fmt(data.wonRevenue)}
          icon={DollarSign}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          sub={`${data.wonCount} deals closed`}
        />
        <StatCard
          label="Active Pipeline"
          value={fmt(data.activePipelineValue)}
          icon={TrendingUp}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          sub={`${data.activeDealsCount} open deals`}
        />
        <StatCard
          label="Conversion Rate"
          value={`${data.conversionRate}%`}
          icon={Activity}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          sub={`${data.totalActivities} activities`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline funnel */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Pipeline Stages</h2>
            <Link to="/pipeline" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View board <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.pipeline?.map((stage) => (
              <div key={stage.stage} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-28">{STAGE_LABELS[stage.stage]}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${STAGE_COLORS[stage.stage]} transition-all`}
                    style={{ width: `${(stage.count / maxStageValue) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-6 text-right">{stage.count}</span>
                <span className="text-xs text-gray-400 w-16 text-right">{fmt(stage.value)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100 flex gap-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>{data.wonCount} won</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>{data.lostCount} lost</span>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            <Link to="/activities" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {data.recentActivities?.slice(0, 6).map((a) => (
              <div key={a.id} className="flex gap-3">
                <ActivityIcon type={a.type} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.subject}</p>
                  <p className="text-xs text-gray-500">
                    {a.contact ? `${a.contact.firstName} ${a.contact.lastName}` : a.deal?.title}
                    {' · '}
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
