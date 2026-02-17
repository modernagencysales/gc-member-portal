import { useState } from 'react';
import { Search, Globe, Check, Loader2, X, AlertCircle } from 'lucide-react';
import {
  DomainAvailability,
  InfraTier,
  ServiceProvider,
} from '../../../../types/infrastructure-types';
import { buildGtmHeaders } from '../../../../lib/api-config';

interface Props {
  tier: InfraTier;
  selectedDomains: DomainAvailability[];
  onDomainsChange: (domains: DomainAvailability[]) => void;
  gtmSystemUrl: string;
  defaultServiceProvider: ServiceProvider;
}

export default function DomainPicker({
  tier,
  selectedDomains,
  onDomainsChange,
  gtmSystemUrl,
  defaultServiceProvider,
}: Props) {
  const [brandName, setBrandName] = useState('');
  const [availableDomains, setAvailableDomains] = useState<DomainAvailability[]>([]);
  const [checking, setChecking] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const maxDomains = tier.domainCount;

  const checkAvailability = async () => {
    const clean = brandName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    if (!clean) return;
    setChecking(true);
    setFetchError(null);
    try {
      const headers = buildGtmHeaders();
      const res = await fetch(`${gtmSystemUrl}/api/infrastructure/domains/check`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ domain: `${clean}.com` }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Domain check failed (${res.status})`);
      }
      const data = await res.json();
      const domainsWithProvider = (data.domains || []).map(
        (d: Omit<DomainAvailability, 'serviceProvider'>) => ({
          ...d,
          serviceProvider: defaultServiceProvider,
        })
      );
      setAvailableDomains(domainsWithProvider);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Domain check failed';
      setFetchError(message);
      console.error('Domain check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  const toggleDomain = (domain: DomainAvailability) => {
    if (domain.status !== 'AVAILABLE') return;
    const exists = selectedDomains.find((d) => d.domainName === domain.domainName);
    if (exists) {
      onDomainsChange(selectedDomains.filter((d) => d.domainName !== domain.domainName));
    } else if (selectedDomains.length < maxDomains) {
      onDomainsChange([...selectedDomains, { ...domain, serviceProvider: defaultServiceProvider }]);
    }
  };

  const toggleDomainProvider = (domainName: string) => {
    onDomainsChange(
      selectedDomains.map((d) =>
        d.domainName === domainName
          ? { ...d, serviceProvider: d.serviceProvider === 'GOOGLE' ? 'MICROSOFT' : 'GOOGLE' }
          : d
      )
    );
  };

  const availableOnly = availableDomains.filter((d) => d.status === 'AVAILABLE');
  const unavailableOnly = availableDomains.filter((d) => d.status !== 'AVAILABLE');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Pick Your Domains</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Enter your brand name and we'll find available domains. Select up to {maxDomains}. You can
          mix Google Workspace and Microsoft 365 per domain.
        </p>
      </div>

      {/* Brand name input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAvailability()}
            placeholder="Enter your brand name (e.g., Acme)"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-zinc-900 dark:text-white placeholder-zinc-400"
          />
        </div>
        <button
          onClick={checkAvailability}
          disabled={!brandName.trim() || checking}
          className="px-4 py-2.5 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg disabled:opacity-50 transition-colors"
        >
          {checking ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
        </button>
      </div>

      {/* Error display */}
      {fetchError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-500">{fetchError}</p>
        </div>
      )}

      {/* Selected count */}
      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {selectedDomains.length} / {maxDomains} domains selected
      </div>

      {/* Selected domains with provider toggle */}
      {selectedDomains.length > 0 && (
        <div className="space-y-2">
          {selectedDomains.map((d) => (
            <div
              key={d.domainName}
              className="flex items-center justify-between p-3 rounded-lg border border-violet-500/30 bg-violet-500/5 dark:bg-violet-500/10"
            >
              <div className="flex items-center gap-2">
                <Globe size={12} className="text-violet-500" />
                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  {d.domainName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleDomainProvider(d.domainName)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    d.serviceProvider === 'GOOGLE'
                      ? 'bg-violet-500 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  Google
                </button>
                <button
                  onClick={() => toggleDomainProvider(d.domainName)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    d.serviceProvider === 'MICROSOFT'
                      ? 'bg-violet-500 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  Microsoft
                </button>
                <button
                  onClick={() => toggleDomain(d)}
                  className="ml-1 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available domains grid */}
      {availableOnly.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {availableOnly.map((domain) => {
            const isSelected = selectedDomains.some((d) => d.domainName === domain.domainName);
            const isFull = selectedDomains.length >= maxDomains && !isSelected;

            return (
              <button
                key={domain.domainName}
                onClick={() => toggleDomain(domain)}
                disabled={isFull}
                className={`flex items-center justify-between p-3 rounded-lg border text-left text-sm transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                } ${isFull && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <div className="w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                  <span
                    className={
                      isSelected
                        ? 'text-violet-600 dark:text-violet-400 font-medium'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }
                  >
                    {domain.domainName}
                  </span>
                </div>
                <span className="text-xs text-zinc-400">${domain.domainPrice.toFixed(2)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Unavailable domains (collapsed) */}
      {unavailableOnly.length > 0 && (
        <div className="text-xs text-zinc-400 dark:text-zinc-600">
          {unavailableOnly.length} domain{unavailableOnly.length !== 1 ? 's' : ''} unavailable
        </div>
      )}
    </div>
  );
}
