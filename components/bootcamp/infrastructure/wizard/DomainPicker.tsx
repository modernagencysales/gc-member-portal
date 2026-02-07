import { useState } from 'react';
import { Search, Globe, Check, Loader2, X } from 'lucide-react';
import { DomainAvailability, InfraTier } from '../../../../types/infrastructure-types';

interface Props {
  tier: InfraTier;
  selectedDomains: DomainAvailability[];
  onDomainsChange: (domains: DomainAvailability[]) => void;
  gtmSystemUrl: string;
}

function suggestDomains(brandName: string): string[] {
  const clean = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean) return [];
  const prefixes = ['get', 'try', 'use', 'go', 'hey', 'meet', 'with', 'join'];
  const suffixes = ['hq', 'app', 'mail', 'team', 'co', 'now', 'pro'];
  const tlds = ['com', 'io', 'net'];
  const suggestions: string[] = [];
  tlds.forEach((tld) => suggestions.push(`${clean}.${tld}`));
  prefixes.forEach((p) => suggestions.push(`${p}${clean}.com`));
  suffixes.forEach((s) => suggestions.push(`${clean}${s}.com`));
  suffixes.slice(0, 4).forEach((s) => suggestions.push(`${clean}-${s}.com`));
  prefixes
    .slice(0, 3)
    .forEach((p) => tlds.slice(1).forEach((tld) => suggestions.push(`${p}${clean}.${tld}`)));
  return [...new Set(suggestions)];
}

export default function DomainPicker({
  tier,
  selectedDomains,
  onDomainsChange,
  gtmSystemUrl,
}: Props) {
  const [brandName, setBrandName] = useState('');
  const [availableDomains, setAvailableDomains] = useState<DomainAvailability[]>([]);
  const [checking, setChecking] = useState(false);

  const maxDomains = tier.domainCount;

  const checkAvailability = async () => {
    const suggestions = suggestDomains(brandName);
    if (!suggestions.length) return;
    setChecking(true);
    try {
      const res = await fetch(`${gtmSystemUrl}/api/infrastructure/domains/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: suggestions }),
      });
      const data = await res.json();
      setAvailableDomains(data.domains || []);
    } catch (err) {
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
      onDomainsChange([...selectedDomains, domain]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Pick Your Domains</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Enter your brand name and we'll suggest available domains. Select {maxDomains}.
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

      {/* Selected count */}
      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {selectedDomains.length} / {maxDomains} domains selected
      </div>

      {/* Selected domains pills */}
      {selectedDomains.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedDomains.map((d) => (
            <span
              key={d.domainName}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full"
            >
              <Globe size={10} />
              {d.domainName}
              <button
                onClick={() => toggleDomain(d)}
                className="hover:text-violet-800 dark:hover:text-violet-200"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Available domains grid */}
      {availableDomains.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {availableDomains.map((domain) => {
            const isSelected = selectedDomains.some((d) => d.domainName === domain.domainName);
            const isAvailable = domain.status === 'AVAILABLE';
            const isFull = selectedDomains.length >= maxDomains && !isSelected;

            return (
              <button
                key={domain.domainName}
                onClick={() => toggleDomain(domain)}
                disabled={!isAvailable || isFull}
                className={`flex items-center justify-between p-3 rounded-lg border text-left text-sm transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10'
                    : isAvailable
                      ? 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      : 'border-zinc-100 dark:border-zinc-900 opacity-40'
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
                {isAvailable && (
                  <span className="text-xs text-zinc-400">${domain.domainPrice.toFixed(2)}</span>
                )}
                {!isAvailable && <span className="text-xs text-red-400">Taken</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
