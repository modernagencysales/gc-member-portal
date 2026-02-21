import React, { useEffect, useState } from 'react';
import { getClientMetrics } from '../../services/dfy-service';
import MetricsCard from './MetricsCard';
import ProfileRewriteCard from './ProfileRewriteCard';

interface ClientMetrics {
  funnel: { views: number; leads: number; conversionRate: number };
  content: { created: number; published: number; inReview: number };
  milestones: {
    total: number;
    completed: number;
    completionPct: number;
    timeline: Array<{
      name: string;
      status: string;
      category: string;
      dueDate: string | null;
      completedAt: string | null;
    }>;
  };
  startDate: string | null;
}

interface ClientDashboardProps {
  portalSlug: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500',
  approved: 'bg-green-500',
  review: 'bg-amber-500',
  revision_requested: 'bg-orange-500',
  in_progress: 'bg-blue-500',
  pending: 'bg-gray-300 dark:bg-zinc-600',
};

const ClientDashboard: React.FC<ClientDashboardProps> = ({ portalSlug }) => {
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getClientMetrics(portalSlug);
        setMetrics(data);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [portalSlug]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-zinc-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-8">
        Dashboard data is being prepared.
      </p>
    );
  }

  const showFunnel = metrics.funnel.views > 0 || metrics.funnel.leads > 0;

  return (
    <div className="space-y-6">
      {/* Profile Rewrite */}
      <ProfileRewriteCard portalSlug={portalSlug} />

      {/* Funnel Metrics */}
      {showFunnel && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Funnel Performance
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <MetricsCard label="Page Views" value={metrics.funnel.views.toLocaleString()} />
            <MetricsCard label="Leads Captured" value={metrics.funnel.leads.toLocaleString()} />
            <MetricsCard label="Conversion Rate" value={`${metrics.funnel.conversionRate}%`} />
          </div>
        </div>
      )}

      {/* Milestones */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Progress
        </h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <MetricsCard
            label="Deliverables"
            value={`${metrics.milestones.completed}/${metrics.milestones.total}`}
            subtext={`${metrics.milestones.completionPct}% complete`}
          />
          <MetricsCard
            label="Started"
            value={
              metrics.startDate
                ? new Date(metrics.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : '\u2014'
            }
          />
          <MetricsCard
            label="In Progress"
            value={metrics.milestones.timeline.filter((t) => t.status === 'in_progress').length}
          />
        </div>

        {/* Timeline */}
        <div className="space-y-1.5">
          {metrics.milestones.timeline.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50"
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  STATUS_COLORS[item.status] || STATUS_COLORS.pending
                }`}
              />
              <span className="text-sm text-gray-900 dark:text-zinc-100 flex-1 min-w-0 truncate">
                {item.name}
              </span>
              {item.completedAt && (
                <span className="text-[11px] text-gray-400 dark:text-zinc-500 flex-shrink-0">
                  {new Date(item.completedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
