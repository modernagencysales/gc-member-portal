import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, Copy, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { LoadingState } from '../../shared/LoadingSpinner';
import { fetchIntegrationCatalog } from '../../../services/financial';
import type { IntegrationCatalogItem } from '../../../types/financial-types';

const TENANT_ID = '7a3474f9-dd56-4ce0-a8b2-0372452ba90e';
const GTM_SYSTEM_URL =
  import.meta.env.VITE_GTM_SYSTEM_URL || 'https://gtm-system-production.up.railway.app';

// Group labels for integration types
const TYPE_LABELS: Record<string, string> = {
  source: 'Data Sources',
  financial: 'Financial',
  crm: 'CRM',
  enrichment: 'Enrichment',
  automation: 'Automation',
};

// Badge colors by type
const TYPE_BADGE_COLORS: Record<string, string> = {
  source: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  financial: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  crm: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  enrichment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  automation: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

// Fallback logo colors
const LOGO_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
];

function getLogoColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}

function snakeToTitle(str: string): string {
  return str
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Group integrations by type, maintaining display order
function groupByType(items: IntegrationCatalogItem[]): [string, IntegrationCatalogItem[]][] {
  const order = ['source', 'financial', 'crm', 'enrichment', 'automation'];
  const groups: Record<string, IntegrationCatalogItem[]> = {};

  for (const item of items) {
    if (!groups[item.type]) groups[item.type] = [];
    groups[item.type].push(item);
  }

  // Sort each group by sort_order
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.sort_order - b.sort_order);
  }

  return order.filter((t) => groups[t]?.length).map((t) => [t, groups[t]]);
}

// ─── Main Page ─────────────────────────────────────────────────────

const IntegrationsPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [catalog, setCatalog] = useState<IntegrationCatalogItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<IntegrationCatalogItem | null>(null);
  const [modalMode, setModalMode] = useState<'connect' | 'configure'>('connect');

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchIntegrationCatalog(TENANT_ID);
    if (result) {
      setCatalog(result);
    } else {
      setError('Failed to load integrations. Please try again.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const openConnect = (item: IntegrationCatalogItem) => {
    setModalItem(item);
    setModalMode('connect');
  };

  const openConfigure = (item: IntegrationCatalogItem) => {
    setModalItem(item);
    setModalMode('configure');
  };

  const closeModal = () => {
    setModalItem(null);
  };

  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-600';

  if (loading) {
    return <LoadingState message="Loading integrations..." />;
  }

  if (error || !catalog) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className={`text-sm ${textSecondary}`}>{error || 'Something went wrong.'}</p>
        <button
          onClick={loadCatalog}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const grouped = groupByType(catalog);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className={`text-xl font-bold ${textPrimary}`}>Integrations</h1>
        <p className={`text-sm mt-1 ${textSecondary}`}>
          Connect your tools and data sources to power your GTM system.
        </p>
      </div>

      {/* Grouped Card Grid */}
      {grouped.map(([type, items]) => (
        <section key={type}>
          <h2 className={`text-base font-semibold mb-4 ${textPrimary}`}>
            {TYPE_LABELS[type] || snakeToTitle(type)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <IntegrationCard
                key={item.id}
                item={item}
                isDarkMode={isDarkMode}
                onConnect={() => openConnect(item)}
                onConfigure={() => openConfigure(item)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Modal */}
      {modalItem && (
        <IntegrationModal
          item={modalItem}
          mode={modalMode}
          isDarkMode={isDarkMode}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            loadCatalog();
          }}
        />
      )}
    </div>
  );
};

// ─── Integration Card ──────────────────────────────────────────────

interface CardProps {
  item: IntegrationCatalogItem;
  isDarkMode: boolean;
  onConnect: () => void;
  onConfigure: () => void;
}

const IntegrationCard: React.FC<CardProps> = ({ item, isDarkMode, onConnect, onConfigure }) => {
  const isComingSoon = !item.is_available;
  const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-3 transition-all ${cardBg} ${
        isComingSoon ? 'opacity-60' : 'hover:shadow-md'
      }`}
    >
      {/* Top row: Logo + Name + Badge */}
      <div className="flex items-start gap-3">
        {/* Logo / Fallback */}
        {item.logo_url ? (
          <img
            src={item.logo_url}
            alt={`${item.name} logo`}
            className="w-10 h-10 rounded-lg object-contain shrink-0"
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 ${getLogoColor(item.name)}`}
          >
            {item.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold text-sm ${textPrimary}`}>{item.name}</h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                TYPE_BADGE_COLORS[item.type] || 'bg-slate-100 text-slate-600'
              }`}
            >
              {snakeToTitle(item.type)}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className={`text-xs leading-relaxed line-clamp-2 ${textSecondary}`}>{item.description}</p>

      {/* Status + Action */}
      <div className="flex items-center justify-between mt-auto pt-2">
        {/* Status */}
        {isComingSoon ? (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            Coming Soon
          </span>
        ) : item.is_connected ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Connected
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            Not Connected
          </span>
        )}

        {/* Action Button */}
        {isComingSoon ? null : item.is_connected ? (
          <button
            onClick={onConfigure}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Configure
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Modal ─────────────────────────────────────────────────────────

interface ModalProps {
  item: IntegrationCatalogItem;
  mode: 'connect' | 'configure';
  isDarkMode: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const IntegrationModal: React.FC<ModalProps> = ({ item, mode, isDarkMode, onClose, onSaved }) => {
  const fields = item.config_schema?.fields || [];
  const configKeys = item.config_schema?.config_keys || [];

  // State for auth fields (api_key, workspace_id, api_secret)
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) init[f] = '';
    for (const k of configKeys) init[k] = '';
    return init;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl = `https://gtmconductor.com/api/webhooks/${item.id}?tenant_id=${TENANT_ID}`;

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Build the payload
      const payload: Record<string, unknown> = { service: item.id };

      // Auth fields
      if (formValues.api_key) payload.api_key = formValues.api_key;
      if (formValues.workspace_id) payload.workspace_id = formValues.workspace_id;
      if (formValues.api_secret) payload.api_secret = formValues.api_secret;

      // Config keys
      const config: Record<string, string> = {};
      for (const k of configKeys) {
        if (formValues[k]) config[k] = formValues[k];
      }
      if (Object.keys(config).length > 0) payload.config = config;

      const response = await fetch(`${GTM_SYSTEM_URL}/api/tenants/${TENANT_ID}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `Failed to save (${response.status})`);
      }

      setSuccess(true);
      setTimeout(() => {
        onSaved();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = webhookUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getFieldLabel = (field: string): string => {
    switch (field) {
      case 'api_key':
        return 'API Key';
      case 'workspace_id':
        return 'Workspace ID';
      case 'api_secret':
        return 'API Secret';
      default:
        return snakeToTitle(field);
    }
  };

  const isPasswordField = (field: string): boolean => {
    return field === 'api_key' || field === 'api_secret';
  };

  const modalBg = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const inputBg = isDarkMode
    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-2xl border shadow-xl ${modalBg} ${
          isDarkMode ? 'border-slate-700' : 'border-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-5 border-b ${
            isDarkMode ? 'border-slate-700' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {item.logo_url ? (
              <img
                src={item.logo_url}
                alt={`${item.name} logo`}
                className="w-8 h-8 rounded-lg object-contain"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${getLogoColor(item.name)}`}
              >
                {item.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h2 className={`text-base font-semibold ${textPrimary}`}>
              {mode === 'connect' ? `Connect ${item.name}` : `Configure ${item.name}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Configure mode: show webhook URL */}
          {mode === 'configure' && (
            <div className="space-y-2">
              <label className={`block text-xs font-medium ${textSecondary}`}>Webhook URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border font-mono ${inputBg}`}
                />
                <button
                  onClick={handleCopyUrl}
                  className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    copied
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : isDarkMode
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Auth fields (api_key, workspace_id, api_secret) */}
          {fields.map((field) => (
            <div key={field} className="space-y-1.5">
              <label className={`block text-xs font-medium ${textSecondary}`}>
                {getFieldLabel(field)}
              </label>
              <input
                type={isPasswordField(field) ? 'password' : 'text'}
                value={formValues[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                placeholder={`Enter ${getFieldLabel(field).toLowerCase()}`}
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${inputBg}`}
              />
            </div>
          ))}

          {/* Config keys */}
          {configKeys.map((key) => (
            <div key={key} className="space-y-1.5">
              <label className={`block text-xs font-medium ${textSecondary}`}>
                {snakeToTitle(key)}
              </label>
              <input
                type="text"
                value={formValues[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={`Enter ${snakeToTitle(key).toLowerCase()}`}
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${inputBg}`}
              />
            </div>
          ))}

          {/* No fields at all (webhook_only) */}
          {fields.length === 0 && configKeys.length === 0 && mode === 'connect' && (
            <p className={`text-sm ${textSecondary}`}>
              This integration uses webhooks only. No credentials are required. Use the webhook URL
              from the configure panel to send data.
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-400">
                Credentials saved successfully!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-end gap-3 p-5 border-t ${
            isDarkMode ? 'border-slate-700' : 'border-slate-200'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>
          {(fields.length > 0 || configKeys.length > 0) && (
            <button
              onClick={handleSave}
              disabled={saving || success}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                'Save Credentials'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
