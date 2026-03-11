/**
 * useBlueprintForm.ts
 * Phase state machine and form data management for the Blueprint landing page.
 * Handles session restore, logos fetch, sticky CTA visibility, and submission.
 * Never imports React Router or any UI library — purely state/effects/logic.
 */

import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientLogos, getBlueprintSettings, ClientLogo } from '../services/blueprint-supabase';
import { GTM_SYSTEM_URL } from '../lib/api-config';
import { logError, logWarn } from '../lib/logError';

// ─── Constants ──────────────────────────────────────────────────────────────

const INTAKE_API_URL = `${GTM_SYSTEM_URL}/api/webhooks/blueprint-form`;
const SESSION_KEY = 'blueprint_partial';
const SESSION_MAX_AGE = 30 * 60 * 1000; // 30 minutes

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FormData {
  email: string;
  fullName: string;
  linkedinUrl: string;
  phone: string;
  smsConsent: string;
  timezone: string;
  businessType: string;
  linkedinChallenge: string;
  postingFrequency: string;
  linkedinHelpArea: string;
  hasFunnel: string;
  learningInvestment: string;
  monthlyIncome: string;
}

export type Phase = 'landing' | 'questionnaire';

export interface UseBlueprintFormReturn {
  phase: Phase;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  isSubmitting: boolean;
  error: string | null;
  logos: ClientLogo[];
  maxLogosLanding: number | undefined;
  showStickyCta: boolean;
  heroRef: RefObject<HTMLDivElement>;
  handleContinueToQuestionnaire: () => void;
  handleQuestionnaireComplete: (finalData: FormData) => Promise<void>;
  setPhase: React.Dispatch<React.SetStateAction<Phase>>;
}

// ─── Default form state ───────────────────────────────────────────────────────

const DEFAULT_FORM_DATA: FormData = {
  email: '',
  fullName: '',
  linkedinUrl: '',
  phone: '',
  smsConsent: '',
  timezone: '',
  businessType: '',
  linkedinChallenge: '',
  postingFrequency: '',
  linkedinHelpArea: '',
  hasFunnel: '',
  learningInvestment: '',
  monthlyIncome: '',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBlueprintForm(): UseBlueprintFormReturn {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('landing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const [maxLogosLanding, setMaxLogosLanding] = useState<number | undefined>(6);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);

  // Auto-detect timezone on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setFormData((prev) => ({ ...prev, timezone: tz }));
    } catch {
      // ignore — timezone will be empty
    }
  }, []);

  // Restore email from sessionStorage on mount (only on actual page refresh, not fresh navigation)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.timestamp && Date.now() - parsed.timestamp < SESSION_MAX_AGE) {
          setFormData((prev) => ({
            ...prev,
            email: parsed.email || prev.email,
          }));
          // Only restore questionnaire phase on actual page reload (not fresh navigation)
          const navEntries = window.performance.getEntriesByType('navigation');
          const isReload =
            navEntries.length > 0 && (navEntries[0] as { type?: string }).type === 'reload';
          if (parsed.phase === 'questionnaire' && isReload) {
            setPhase('questionnaire');
          }
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Fetch logos and settings
  useEffect(() => {
    getClientLogos().then(setLogos);
    getBlueprintSettings().then((s) => {
      if (s) setMaxLogosLanding(s.maxLogosLanding ?? 6);
    });
  }, []);

  // Show sticky CTA once hero scrolls out of view (only in landing phase)
  useEffect(() => {
    if (phase !== 'landing') return;
    const el = heroRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [phase]);

  const handleContinueToQuestionnaire = useCallback(() => {
    // Save partial data to sessionStorage
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          email: formData.email,
          phase: 'questionnaire',
          timestamp: Date.now(),
        })
      );
    } catch {
      // ignore storage errors
    }
    setPhase('questionnaire');
  }, [formData.email]);

  const handleQuestionnaireComplete = useCallback(
    async (finalData: FormData) => {
      // Belt-and-suspenders: ref guard prevents duplicate submissions even if
      // React hasn't flushed the isSubmitting state update yet
      if (submittingRef.current) return;
      submittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const webhookSecret = import.meta.env.VITE_BLUEPRINT_WEBHOOK_SECRET;
        if (webhookSecret) {
          headers['x-webhook-secret'] = webhookSecret;
        }

        const payload = {
          linkedin_url: finalData.linkedinUrl,
          full_name: finalData.fullName,
          email: finalData.email,
          phone: finalData.phone || undefined,
          sms_consent: finalData.smsConsent === 'true',
          timezone: finalData.timezone || undefined,
          business_type: finalData.businessType,
          monthly_income: finalData.monthlyIncome,
          linkedin_challenge: finalData.linkedinChallenge,
          posting_frequency: finalData.postingFrequency,
          linkedin_help_area: finalData.linkedinHelpArea,
          has_funnel: finalData.hasFunnel,
          learning_investment: finalData.learningInvestment,
          send_email: true,
          source_url: window.location.href,
          lead_magnet_source: 'blueprint-landing',
          referral_code: (() => {
            const match = document.cookie.match(/(?:^|; )gtm_ref=([^;]*)/);
            return match ? decodeURIComponent(match[1]) : undefined;
          })(),
        };

        logWarn('useBlueprintForm:submit', 'Submitting blueprint form', { url: INTAKE_API_URL });

        const response = await fetch(INTAKE_API_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        logWarn('useBlueprintForm:submit', 'Blueprint form response received', {
          status: response.status,
        });

        let data;
        try {
          data = await response.json();
        } catch {
          const text = await response.text().catch(() => '(no body)');
          logError('useBlueprintForm:submit', new Error('Non-JSON response'), {
            status: response.status,
            text,
          });
          setError(`Server error (${response.status}). Please try again.`);
          submittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        logWarn('useBlueprintForm:submit', 'Blueprint form response data received', {
          status: response.status,
        });

        if (response.ok) {
          // Success — keep button disabled, navigate away
          sessionStorage.removeItem(SESSION_KEY);
          navigate('/blueprint/thank-you', {
            state: {
              prospectId: data.prospect_id,
              reportUrl: data.report_url,
              monthlyIncome: finalData.monthlyIncome,
              businessType: finalData.businessType,
              email: finalData.email,
              fullName: finalData.fullName,
              phone: finalData.phone || undefined,
            },
          });
        } else if (response.status === 409) {
          // Duplicate — still a success, navigate away
          sessionStorage.removeItem(SESSION_KEY);
          navigate('/blueprint/thank-you', {
            state: {
              prospectId: data.existing_prospect_id,
              reportUrl: data.report_url,
              monthlyIncome: finalData.monthlyIncome,
              businessType: finalData.businessType,
              email: finalData.email,
              fullName: finalData.fullName,
              phone: finalData.phone || undefined,
            },
          });
        } else {
          logError('useBlueprintForm:submit', new Error('Error response from server'), {
            status: response.status,
          });
          setError(
            data.error ||
              data.message ||
              `Something went wrong (${response.status}). Please try again.`
          );
          submittingRef.current = false;
          setIsSubmitting(false);
        }
      } catch (err) {
        logError('useBlueprintForm:submit', err);
        setError('Something went wrong. Please check your connection and try again.');
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [navigate]
  );

  return {
    phase,
    formData,
    setFormData,
    isSubmitting,
    error,
    logos,
    maxLogosLanding,
    showStickyCta,
    heroRef,
    handleContinueToQuestionnaire,
    handleQuestionnaireComplete,
    setPhase,
  };
}
