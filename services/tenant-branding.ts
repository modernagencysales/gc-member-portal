/**
 * Tenant Branding Service
 *
 * Fetches tenant brand configuration from the linkedin-leadmagnet-backend
 * public API and provides React hooks + utilities for applying tenant theming
 * to Blueprint pages.
 */

import { useState, useEffect } from 'react';

// ============================================
// Types
// ============================================

export interface TenantBranding {
  tenant_id: string;
  brand_name: string;
  brand_logo_url: string | null;
  brand_color_primary: string;
  brand_color_secondary: string;
  brand_tagline: string | null;
  offer_title: string | null;
  offer_description: string | null;
  offer_cta_text: string;
  offer_cta_url: string | null;
}

interface CacheEntry {
  data: TenantBranding;
  timestamp: number;
}

// ============================================
// Configuration
// ============================================

import { BLUEPRINT_BACKEND_URL } from '../lib/api-config';

const BACKEND_URL = BLUEPRINT_BACKEND_URL;

/** Cache TTL in milliseconds — 5 minutes */
const CACHE_TTL_MS = 5 * 60 * 1000;

// ============================================
// In-Memory Cache
// ============================================

const cache = new Map<string, CacheEntry>();

function getCachedBranding(tenantId: string): TenantBranding | null {
  const entry = cache.get(tenantId);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    cache.delete(tenantId);
    return null;
  }

  return entry.data;
}

function setCachedBranding(tenantId: string, data: TenantBranding): void {
  cache.set(tenantId, { data, timestamp: Date.now() });
}

// ============================================
// Fetch Function
// ============================================

/**
 * Fetch tenant branding config from the backend.
 * Returns null if the tenant has no active config.
 */
export async function fetchTenantBranding(tenantId: string): Promise<TenantBranding | null> {
  // Check cache first
  const cached = getCachedBranding(tenantId);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/tenant-branding/${encodeURIComponent(tenantId)}`
    );

    if (response.status === 404) {
      // No config for this tenant — not an error
      return null;
    }

    if (!response.ok) {
      console.error(
        `[tenant-branding] Failed to fetch branding for tenant ${tenantId}: ${response.status}`
      );
      return null;
    }

    const json = await response.json();

    if (!json.success || !json.branding) {
      return null;
    }

    const branding = json.branding as TenantBranding;
    setCachedBranding(tenantId, branding);
    return branding;
  } catch (err) {
    console.error('[tenant-branding] Network error fetching branding:', err);
    return null;
  }
}

// ============================================
// React Hook
// ============================================

interface UseTenantBrandingResult {
  branding: TenantBranding | null;
  loading: boolean;
  error: string | null;
}

/**
 * React hook that fetches and returns tenant branding config.
 * Returns { branding: null, loading: false } when tenantId is not provided.
 */
export function useTenantBranding(tenantId: string | null | undefined): UseTenantBrandingResult {
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(!!tenantId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setBranding(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchTenantBranding(tenantId)
      .then((result) => {
        if (!cancelled) {
          setBranding(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load branding');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return { branding, loading, error };
}

// ============================================
// CSS Custom Property Utility
// ============================================

/**
 * Returns a CSSProperties-compatible object with brand color custom properties.
 * Apply this to the root wrapper of the Blueprint page so descendant elements
 * can reference `var(--brand-primary)` etc.
 *
 * Falls back to the default violet palette when no branding is provided.
 */
export function getTenantColors(branding: TenantBranding | null): React.CSSProperties {
  const primary = branding?.brand_color_primary || '#7C3AED';
  const secondary = branding?.brand_color_secondary || '#4F46E5';

  return {
    '--brand-primary': primary,
    '--brand-secondary': secondary,
    '--brand-primary-hover': adjustBrightness(primary, -15),
    '--brand-primary-light': adjustBrightness(primary, 40),
  } as React.CSSProperties;
}

// ============================================
// Color Helpers
// ============================================

/**
 * Adjust the brightness of a hex color by a percentage.
 * Positive = lighter, negative = darker.
 */
function adjustBrightness(hex: string, percent: number): string {
  // Remove # prefix
  const clean = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  // Adjust
  const adjust = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel + (channel * percent) / 100)));

  const newR = adjust(r).toString(16).padStart(2, '0');
  const newG = adjust(g).toString(16).padStart(2, '0');
  const newB = adjust(b).toString(16).padStart(2, '0');

  return `#${newR}${newG}${newB}`;
}
