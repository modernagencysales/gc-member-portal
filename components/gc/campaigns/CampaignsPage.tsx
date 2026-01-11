import React, { useState, useEffect } from 'react';
import {
  Target,
  Mail,
  Linkedin,
  TrendingUp,
  Users,
  Calendar,
  Edit2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import StatusBadge from '../../shared/StatusBadge';
import { LoadingState } from '../../shared/LoadingSpinner';
import { fetchMemberCampaigns, updateCampaignMetrics } from '../../../services/gc-airtable';
import { Campaign, CampaignMetrics } from '../../../types/gc-types';

const CampaignsPage: React.FC = () => {
  const { gcMember } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, [gcMember]);

  const loadCampaigns = async () => {
    if (!gcMember) return;

    setLoading(true);
    try {
      const data = await fetchMemberCampaigns(gcMember.id);
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMetrics = async (campaignId: string, metrics: Partial<CampaignMetrics>) => {
    try {
      await updateCampaignMetrics(campaignId, metrics);
      await loadCampaigns();
      setEditingCampaign(null);
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your campaigns..." />;
  }

  // Group campaigns by status
  const liveCampaigns = campaigns.filter((c) => c.status === 'Live');
  const warmingCampaigns = campaigns.filter((c) => c.status === 'Warming Up');
  const otherCampaigns = campaigns.filter((c) => c.status !== 'Live' && c.status !== 'Warming Up');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          My Campaigns
        </h1>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Track your outreach campaigns and update metrics
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Reached"
          value={campaigns.reduce((sum, c) => sum + c.metrics.contactsReached, 0)}
          icon={Users}
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          label="Total Replies"
          value={campaigns.reduce((sum, c) => sum + c.metrics.replies, 0)}
          icon={Mail}
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          label="Positive Replies"
          value={campaigns.reduce((sum, c) => sum + c.metrics.positiveReplies, 0)}
          icon={TrendingUp}
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          label="Meetings Booked"
          value={campaigns.reduce((sum, c) => sum + c.metrics.meetingsBooked, 0)}
          icon={Calendar}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Live Campaigns */}
      {liveCampaigns.length > 0 && (
        <CampaignSection
          title="Live Campaigns"
          campaigns={liveCampaigns}
          expandedCampaign={expandedCampaign}
          setExpandedCampaign={setExpandedCampaign}
          editingCampaign={editingCampaign}
          setEditingCampaign={setEditingCampaign}
          onUpdateMetrics={handleUpdateMetrics}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Warming Up */}
      {warmingCampaigns.length > 0 && (
        <CampaignSection
          title="Warming Up"
          campaigns={warmingCampaigns}
          expandedCampaign={expandedCampaign}
          setExpandedCampaign={setExpandedCampaign}
          editingCampaign={editingCampaign}
          setEditingCampaign={setEditingCampaign}
          onUpdateMetrics={handleUpdateMetrics}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Other Campaigns */}
      {otherCampaigns.length > 0 && (
        <CampaignSection
          title="Other Campaigns"
          campaigns={otherCampaigns}
          expandedCampaign={expandedCampaign}
          setExpandedCampaign={setExpandedCampaign}
          editingCampaign={editingCampaign}
          setEditingCampaign={setEditingCampaign}
          onUpdateMetrics={handleUpdateMetrics}
          isDarkMode={isDarkMode}
        />
      )}

      {campaigns.length === 0 && (
        <div className={`text-center py-12 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
          <Target
            className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}
          />
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>No campaigns yet</p>
        </div>
      )}
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.FC<{ className?: string }>;
  isDarkMode: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon: Icon, isDarkMode }) => (
  <div
    className={`rounded-xl p-4 ${
      isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
    }`}
  >
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
      <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
    </div>
    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
      {value.toLocaleString()}
    </p>
  </div>
);

interface CampaignSectionProps {
  title: string;
  campaigns: Campaign[];
  expandedCampaign: string | null;
  setExpandedCampaign: (id: string | null) => void;
  editingCampaign: string | null;
  setEditingCampaign: (id: string | null) => void;
  onUpdateMetrics: (id: string, metrics: Partial<CampaignMetrics>) => void;
  isDarkMode: boolean;
}

const CampaignSection: React.FC<CampaignSectionProps> = ({
  title,
  campaigns,
  expandedCampaign,
  setExpandedCampaign,
  editingCampaign,
  setEditingCampaign,
  onUpdateMetrics,
  isDarkMode,
}) => (
  <div className="space-y-3">
    <h2
      className={`text-sm font-semibold uppercase tracking-wider ${
        isDarkMode ? 'text-slate-400' : 'text-slate-500'
      }`}
    >
      {title}
    </h2>
    {campaigns.map((campaign) => (
      <CampaignCard
        key={campaign.id}
        campaign={campaign}
        isExpanded={expandedCampaign === campaign.id}
        onToggleExpand={() =>
          setExpandedCampaign(expandedCampaign === campaign.id ? null : campaign.id)
        }
        isEditing={editingCampaign === campaign.id}
        onToggleEdit={() =>
          setEditingCampaign(editingCampaign === campaign.id ? null : campaign.id)
        }
        onUpdateMetrics={onUpdateMetrics}
        isDarkMode={isDarkMode}
      />
    ))}
  </div>
);

interface CampaignCardProps {
  campaign: Campaign;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdateMetrics: (id: string, metrics: Partial<CampaignMetrics>) => void;
  isDarkMode: boolean;
}

const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  isExpanded,
  onToggleExpand,
  isEditing,
  onToggleEdit,
  onUpdateMetrics,
  isDarkMode,
}) => {
  const [metrics, setMetrics] = useState(campaign.metrics);

  const isStale = campaign.lastUpdatedByMember
    ? new Date().getTime() - campaign.lastUpdatedByMember.getTime() > 7 * 24 * 60 * 60 * 1000
    : true;

  const handleSave = () => {
    onUpdateMetrics(campaign.id, metrics);
  };

  const channelIcon = campaign.channel === 'LinkedIn DM' ? Linkedin : Mail;
  const ChannelIcon = channelIcon;

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
          isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
            }`}
          >
            <ChannelIcon
              className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
            />
          </div>
          <div className="text-left">
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {campaign.campaignName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {campaign.channel}
              </span>
              {campaign.icpSegment && (
                <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  • {campaign.icpSegment}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isStale && campaign.status === 'Live' && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <AlertCircle className="w-3 h-3" />
              Update needed
            </span>
          )}
          <StatusBadge status={campaign.status} size="sm" />
          {isExpanded ? (
            <ChevronUp className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          ) : (
            <ChevronDown
              className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
            />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className={`px-5 pb-5 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}
        >
          {/* Metrics Funnel */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4
                className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
              >
                Metrics (Self-Reported)
              </h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleEdit();
                }}
                className={`flex items-center gap-1 text-xs font-medium ${
                  isDarkMode
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                <Edit2 className="w-3 h-3" />
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditing ? (
              <MetricsForm
                metrics={metrics}
                onChange={setMetrics}
                onSave={handleSave}
                isDarkMode={isDarkMode}
              />
            ) : (
              <MetricsFunnel metrics={campaign.metrics} isDarkMode={isDarkMode} />
            )}
          </div>

          {/* Last Updated */}
          {campaign.lastUpdatedByMember && (
            <p className={`text-xs mt-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Last updated: {campaign.lastUpdatedByMember.toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface MetricsFunnelProps {
  metrics: CampaignMetrics;
  isDarkMode: boolean;
}

const MetricsFunnel: React.FC<MetricsFunnelProps> = ({ metrics, isDarkMode }) => {
  const funnelSteps = [
    { label: 'Reached', value: metrics.contactsReached },
    { label: 'Opens', value: metrics.opens },
    { label: 'Replies', value: metrics.replies },
    { label: 'Positive', value: metrics.positiveReplies },
    { label: 'Meetings', value: metrics.meetingsBooked },
  ];

  return (
    <div className="flex items-center justify-between gap-2">
      {funnelSteps.map((step, index) => (
        <React.Fragment key={step.label}>
          <div className="flex-1 text-center">
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {step.value.toLocaleString()}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {step.label}
            </p>
          </div>
          {index < funnelSteps.length - 1 && (
            <div className={`text-lg ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>→</div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface MetricsFormProps {
  metrics: CampaignMetrics;
  onChange: (metrics: CampaignMetrics) => void;
  onSave: () => void;
  isDarkMode: boolean;
}

const MetricsForm: React.FC<MetricsFormProps> = ({ metrics, onChange, onSave, isDarkMode }) => {
  const fields = [
    { key: 'contactsReached', label: 'Contacts Reached' },
    { key: 'opens', label: 'Opens' },
    { key: 'replies', label: 'Replies' },
    { key: 'positiveReplies', label: 'Positive Replies' },
    { key: 'meetingsBooked', label: 'Meetings Booked' },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {fields.map((field) => (
          <div key={field.key}>
            <label className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {field.label}
            </label>
            <input
              type="number"
              value={metrics[field.key]}
              onChange={(e) => onChange({ ...metrics, [field.key]: parseInt(e.target.value) || 0 })}
              className={`w-full mt-1 px-3 py-2 rounded-lg text-sm font-medium ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        ))}
      </div>
      <button
        onClick={onSave}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Save Metrics
      </button>
    </div>
  );
};

export default CampaignsPage;
