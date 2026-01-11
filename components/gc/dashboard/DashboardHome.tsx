import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Wrench,
  Target,
  Users,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { ProgressBar } from '../../shared/ProgressBar';
import StatusBadge from '../../shared/StatusBadge';
import { LoadingState } from '../../shared/LoadingSpinner';
import {
  fetchOnboardingWithProgress,
  fetchMemberTools,
  fetchMemberCampaigns,
  fetchFeaturedResources,
} from '../../../services/gc-airtable';
import { ToolAccess, Campaign, Resource, OnboardingCategoryGroup } from '../../../types/gc-types';

const DashboardHome: React.FC = () => {
  const { gcMember } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState<{
    categories: OnboardingCategoryGroup[];
    totalProgress: number;
  } | null>(null);
  const [tools, setTools] = useState<ToolAccess[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [featuredResources, setFeaturedResources] = useState<Resource[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!gcMember) return;

      setLoading(true);
      try {
        const [onboarding, toolsData, campaignsData, resources] = await Promise.all([
          fetchOnboardingWithProgress(gcMember.id, gcMember.plan),
          fetchMemberTools(gcMember.id),
          fetchMemberCampaigns(gcMember.id),
          fetchFeaturedResources(gcMember.plan),
        ]);

        setOnboardingData(onboarding);
        setTools(toolsData);
        setCampaigns(campaignsData);
        setFeaturedResources(resources);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [gcMember]);

  if (loading) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  if (!gcMember) return null;

  const activeCampaigns = campaigns.filter((c) => c.status === 'Live');
  const toolsWithIssues = tools.filter((t) => t.status === 'Issues' || t.status === 'Not Set Up');

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div
        className={`rounded-2xl p-6 ${
          isDarkMode
            ? 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-slate-800'
            : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-slate-200'
        }`}
      >
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Welcome back, {gcMember.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className={`mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Here's what's happening with your Growth Collective membership.
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard
            label="Onboarding"
            value={`${onboardingData?.totalProgress || 0}%`}
            icon={CheckSquare}
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Tools Active"
            value={`${tools.filter((t) => t.status === 'Active').length}/${tools.length}`}
            icon={Wrench}
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Live Campaigns"
            value={activeCampaigns.length.toString()}
            icon={Target}
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Total Meetings"
            value={campaigns.reduce((sum, c) => sum + c.metrics.meetingsBooked, 0).toString()}
            icon={TrendingUp}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Onboarding Progress */}
        <DashboardCard
          title="Onboarding Progress"
          icon={CheckSquare}
          linkTo="/onboarding"
          isDarkMode={isDarkMode}
        >
          <div className="space-y-4">
            <ProgressBar progress={onboardingData?.totalProgress || 0} />

            {onboardingData?.categories.slice(0, 3).map((category) => (
              <div key={category.name} className="flex items-center justify-between text-sm">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                  {category.name}
                </span>
                <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {category.completedCount}/{category.totalCount}
                </span>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Tools Status */}
        <DashboardCard
          title="My Tools"
          icon={Wrench}
          linkTo="/tools"
          isDarkMode={isDarkMode}
          alert={
            toolsWithIssues.length > 0 ? `${toolsWithIssues.length} need attention` : undefined
          }
        >
          <div className="space-y-3">
            {tools.slice(0, 4).map((tool) => (
              <div key={tool.id} className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {tool.tool}
                </span>
                <StatusBadge status={tool.status} size="sm" />
              </div>
            ))}
            {tools.length === 0 && (
              <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                No tools set up yet
              </p>
            )}
          </div>
        </DashboardCard>

        {/* Active Campaigns */}
        <DashboardCard
          title="Active Campaigns"
          icon={Target}
          linkTo="/campaigns"
          isDarkMode={isDarkMode}
        >
          <div className="space-y-3">
            {activeCampaigns.slice(0, 3).map((campaign) => (
              <div key={campaign.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    {campaign.campaignName}
                  </span>
                  <StatusBadge status={campaign.status} size="sm" />
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {campaign.metrics.contactsReached} reached • {campaign.metrics.replies} replies •{' '}
                  {campaign.metrics.meetingsBooked} meetings
                </div>
              </div>
            ))}
            {activeCampaigns.length === 0 && (
              <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                No active campaigns
              </p>
            )}
          </div>
        </DashboardCard>

        {/* Featured Resources */}
        <DashboardCard
          title="Featured Resources"
          icon={BookOpen}
          linkTo="/resources"
          isDarkMode={isDarkMode}
        >
          <div className="space-y-3">
            {featuredResources.slice(0, 4).map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block text-sm hover:underline ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                {resource.title}
              </a>
            ))}
            {featuredResources.length === 0 && (
              <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                No featured resources
              </p>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};

// Sub-components

interface StatCardProps {
  label: string;
  value: string;
  icon: React.FC<{ className?: string }>;
  isDarkMode: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, isDarkMode }) => (
  <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/80'}`}>
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
      <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
    </div>
    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</p>
  </div>
);

interface DashboardCardProps {
  title: string;
  icon: React.FC<{ className?: string }>;
  linkTo: string;
  isDarkMode: boolean;
  alert?: string;
  children: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon: Icon,
  linkTo,
  isDarkMode,
  alert,
  children,
}) => (
  <div
    className={`rounded-2xl p-5 ${
      isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
    }`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
        <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
      </div>
      {alert && (
        <span className="flex items-center gap-1 text-xs text-amber-500">
          <AlertCircle className="w-3 h-3" />
          {alert}
        </span>
      )}
    </div>

    {children}

    <Link
      to={linkTo}
      className={`mt-4 flex items-center gap-1 text-sm font-medium ${
        isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
      }`}
    >
      View all
      <ArrowRight className="w-4 h-4" />
    </Link>
  </div>
);

export default DashboardHome;
