import React, { useState, useEffect, useMemo } from 'react';
import { Search, ExternalLink, FileText, BookOpen, Star, Filter } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { LoadingState } from '../../shared/LoadingSpinner';
import { fetchResources } from '../../../services/supabase';
import { Resource, ResourceCategory, ResourceTool } from '../../../types/gc-types';

const categoryOrder: ResourceCategory[] = [
  'Getting Started',
  'Email Infrastructure',
  'Clay & List Building',
  'Cold Email',
  'LinkedIn Outreach',
  'Campaign Strategy',
  'Templates',
  'Troubleshooting',
];

const toolFilters: ResourceTool[] = [
  'General',
  'Clay',
  'Smartlead',
  'HeyReach',
  'Zapmail',
  'Mailforge',
  'Linked Helper',
];

const ResourcesPage: React.FC = () => {
  const { gcMember } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<ResourceTool | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'All'>('All');

  useEffect(() => {
    const loadResources = async () => {
      if (!gcMember) return;

      setLoading(true);
      try {
        const data = await fetchResources(gcMember.plan);
        setResources(data);
      } catch (error) {
        console.error('Failed to load resources:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [gcMember]);

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = resource.title.toLowerCase().includes(query);
        const matchesDescription = resource.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription) return false;
      }

      // Tool filter
      if (selectedTool !== 'All' && resource.tool !== selectedTool) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && resource.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [resources, searchQuery, selectedTool, selectedCategory]);

  // Group by category
  const groupedResources = useMemo(() => {
    const groups = new Map<ResourceCategory, Resource[]>();

    filteredResources.forEach((resource) => {
      const existing = groups.get(resource.category) || [];
      existing.push(resource);
      groups.set(resource.category, existing);
    });

    // Sort by predefined order
    return categoryOrder
      .filter((cat) => groups.has(cat))
      .map((cat) => ({
        category: cat,
        resources: groups.get(cat) || [],
      }));
  }, [filteredResources]);

  // Featured resources
  const featuredResources = resources.filter((r) => r.featured);

  if (loading) {
    return <LoadingState message="Loading resources..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Resources
        </h1>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Guides, templates, and documentation to help you succeed
        </p>
      </div>

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <div
          className={`rounded-xl p-5 ${
            isDarkMode
              ? 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-slate-800'
              : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
            <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Featured Resources
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {featuredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} isDarkMode={isDarkMode} compact />
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources..."
            className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-sm ${
              isDarkMode
                ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        {/* Tool Filter */}
        <div className="flex items-center gap-2">
          <Filter className={`w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value as ResourceTool | 'All')}
            className={`px-3 py-2.5 rounded-xl text-sm ${
              isDarkMode
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="All">All Tools</option>
            {toolFilters.map((tool) => (
              <option key={tool} value={tool}>
                {tool}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as ResourceCategory | 'All')}
          className={`px-3 py-2.5 rounded-xl text-sm ${
            isDarkMode
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <option value="All">All Categories</option>
          {categoryOrder.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Results Count */}
      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        Showing {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
      </p>

      {/* Grouped Resources */}
      {groupedResources.map(({ category, resources: categoryResources }) => (
        <div key={category} className="space-y-3">
          <h2
            className={`text-sm font-semibold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {category}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} isDarkMode={isDarkMode} />
            ))}
          </div>
        </div>
      ))}

      {filteredResources.length === 0 && (
        <div className={`text-center py-12 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
          <BookOpen
            className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}
          />
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>No resources found</p>
          {(searchQuery || selectedTool !== 'All' || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTool('All');
                setSelectedCategory('All');
              }}
              className={`mt-2 text-sm ${
                isDarkMode
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface ResourceCardProps {
  resource: Resource;
  isDarkMode: boolean;
  compact?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, isDarkMode, compact }) => {
  const getTypeIcon = () => {
    switch (resource.tool) {
      case 'Clay':
        return '🧱';
      case 'Smartlead':
        return '📧';
      case 'HeyReach':
        return '🤝';
      default:
        return null;
    }
  };

  const TypeIcon = getTypeIcon();
  const hasUrl = resource.url && resource.url.trim() !== '';

  // If no URL, render as a non-clickable div
  if (!hasUrl) {
    return (
      <div
        className={`block rounded-xl p-4 border ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 opacity-75'
            : 'bg-white border-slate-200 opacity-75'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
            }`}
          >
            {TypeIcon ? (
              <span className="text-xl">{TypeIcon}</span>
            ) : (
              <FileText className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={`font-medium text-sm ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              } ${compact ? 'line-clamp-1' : ''}`}
            >
              {resource.title}
            </h3>
            {!compact && resource.description && (
              <p
                className={`text-xs mt-1 line-clamp-2 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {resource.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {resource.tool}
              </span>
              <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                No link available
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-xl p-4 border transition-all hover:shadow-md ${
        isDarkMode
          ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
          }`}
        >
          {TypeIcon ? (
            <span className="text-xl">{TypeIcon}</span>
          ) : (
            <FileText className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium text-sm ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            } ${compact ? 'line-clamp-1' : ''}`}
          >
            {resource.title}
          </h3>
          {!compact && resource.description && (
            <p
              className={`text-xs mt-1 line-clamp-2 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {resource.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {resource.tool}
            </span>
            <ExternalLink
              className={`w-3 h-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
            />
          </div>
        </div>
      </div>
    </a>
  );
};

export default ResourcesPage;
