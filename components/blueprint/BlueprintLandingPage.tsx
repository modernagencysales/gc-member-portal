import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Linkedin,
  Mail,
  Briefcase,
  CheckCircle,
  Sparkles,
  FileText,
  User,
  DollarSign,
  ArrowUp,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LogoBar from './LogoBar';
import {
  getClientLogos,
  getBlueprintSettings,
  ClientLogo,
} from '../../services/blueprint-supabase';

const INTAKE_API_URL = 'https://gtm-system-production.up.railway.app/api/webhooks/blueprint-form';

// ============================================
// Types
// ============================================

interface FormData {
  linkedinUrl: string;
  fullName: string;
  email: string;
  businessType: string;
  monthlyIncome: string;
}

// ============================================
// Constants
// ============================================

const BUSINESS_TYPES = ['Agency', 'Consulting', 'Coaching', 'SaaS', 'Freelance', 'Other'];

const REVENUE_RANGES = ['Under $5k', '$5k-$10k', '$10k-$30k', '$30k-$50k', '$50k-$100k', '$100k+'];

const STATS = [
  { value: '300+', label: 'Blueprints Delivered' },
  { value: '$4.7M', label: 'Agency Revenue Built on LinkedIn' },
  { value: '20K+', label: 'Opted-in Leads Generated' },
];

const STEPS = [
  {
    number: 1,
    icon: Linkedin,
    title: 'Submit Your Profile',
    description:
      "Enter your LinkedIn URL and we'll analyze your entire presence — profile, content, and engagement.",
  },
  {
    number: 2,
    icon: Sparkles,
    title: 'AI Analysis',
    description:
      "Our system scores you across 5 key dimensions and identifies exactly where you're leaving pipeline on the table.",
  },
  {
    number: 3,
    icon: FileText,
    title: 'Get Your Blueprint',
    description:
      'Receive a personalized report with specific rewrites, content ideas, and a 60-day content calendar.',
  },
];

// ============================================
// Nav Bar
// ============================================

const NavBar: React.FC = () => (
  <nav className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        Modern Agency Sales
      </span>
    </div>
  </nav>
);

// ============================================
// Hero Section
// ============================================

interface HeroProps {
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

const Hero: React.FC<HeroProps> = ({ onSubmit, isSubmitting, error }) => {
  const [formData, setFormData] = useState<FormData>({
    linkedinUrl: '',
    fullName: '',
    email: '',
    businessType: '',
    monthlyIncome: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <section className="bg-white dark:bg-zinc-950 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Trust Badge */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-xs sm:text-sm font-medium text-violet-700 dark:text-violet-300">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by AI — analyzing 300+ LinkedIn profiles
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-zinc-100 text-center leading-tight mb-3 max-w-4xl mx-auto">
          We&apos;ll Rewrite Your Entire LinkedIn Presence — For Free
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 text-center max-w-2xl mx-auto mb-6 leading-relaxed">
          Get a personalized blueprint with a complete profile rewrite, 60-day content calendar, 3
          custom lead magnets, and a full authority audit. $3,000+ in value, delivered in 15
          minutes.
        </p>

        {/* Opt-In Form Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-none p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* LinkedIn URL */}
              <div>
                <label
                  htmlFor="linkedinUrl"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Your LinkedIn URL
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="linkedinUrl"
                    type="url"
                    required
                    placeholder="https://linkedin.com/in/your-profile"
                    value={formData.linkedinUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, linkedinUrl: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Your Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Business Type */}
              <div>
                <label
                  htmlFor="businessType"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Your Business Type
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <select
                    id="businessType"
                    required
                    value={formData.businessType}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, businessType: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors appearance-none"
                  >
                    <option value="">Select your business type</option>
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Monthly Revenue */}
              <div>
                <label
                  htmlFor="monthlyIncome"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Monthly Revenue
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <select
                    id="monthlyIncome"
                    required
                    value={formData.monthlyIncome}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, monthlyIncome: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors appearance-none"
                  >
                    <option value="">Select your revenue range</option>
                    {REVENUE_RANGES.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error */}
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl text-base font-semibold bg-violet-500 hover:bg-violet-600 disabled:bg-violet-400 text-white transition-colors shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
              >
                {isSubmitting ? 'Creating Your Blueprint...' : 'Get My Free Blueprint'}
              </button>
            </form>

            {/* Micro Proof Points */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" /> Free personalized report
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" /> 5-minute read
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" /> Actionable fixes
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// Stats Row
// ============================================

const StatsRow: React.FC = () => (
  <section className="bg-zinc-50 dark:bg-zinc-900/50 py-16">
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <div className="text-4xl sm:text-5xl font-bold text-violet-600 dark:text-violet-400 mb-2">
              {stat.value}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ============================================
// Social Proof
// ============================================

interface SocialProofProps {
  logos: ClientLogo[];
  maxLogos?: number;
}

const SocialProof: React.FC<SocialProofProps> = ({ logos, maxLogos }) => (
  <section className="bg-white dark:bg-zinc-950 py-16 sm:py-20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Trusted by B2B Founders, Agency Owners, and Consultants
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10">
        From solopreneurs to 7-figure agencies, we&apos;ve helped 300+ business owners fix their
        LinkedIn presence.
      </p>

      <LogoBar logos={logos} maxLogos={maxLogos} hideLabel />
    </div>
  </section>
);

// ============================================
// How It Works
// ============================================

const HowItWorks: React.FC = () => (
  <section className="bg-zinc-50 dark:bg-zinc-900/50 py-16 sm:py-20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-4">
        How It Works
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 text-center max-w-2xl mx-auto mb-12">
        Three simple steps to your personalized LinkedIn Authority Blueprint.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">
                Step {step.number}
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// ============================================
// Footer
// ============================================

const Footer: React.FC = () => (
  <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-8">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
      <p className="text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} Modern Agency Sales. All rights reserved.
      </p>
    </div>
  </footer>
);

// ============================================
// BlueprintLandingPage Component
// ============================================

const BlueprintLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const [maxLogosLanding, setMaxLogosLanding] = useState<number | undefined>(6);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getClientLogos().then(setLogos);
    getBlueprintSettings().then((s) => {
      if (s) setMaxLogosLanding(s.maxLogosLanding ?? 6);
    });
  }, []);

  // Show sticky CTA once hero scrolls out of view
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (formData: FormData) => {
    const linkedinPattern = /linkedin\.com\/in\//i;
    if (!linkedinPattern.test(formData.linkedinUrl)) {
      setError(
        'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/your-name)'
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const webhookSecret = import.meta.env.VITE_BLUEPRINT_WEBHOOK_SECRET;
      if (webhookSecret) {
        headers['x-webhook-secret'] = webhookSecret;
      }

      const response = await fetch(INTAKE_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          linkedin_url: formData.linkedinUrl,
          full_name: formData.fullName,
          email: formData.email,
          business_type: formData.businessType,
          monthly_income: formData.monthlyIncome,
          send_email: true,
          source_url: window.location.href,
          lead_magnet_source: 'blueprint-landing',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/blueprint/thank-you', {
          state: { prospectId: data.prospect_id, reportUrl: data.report_url },
        });
      } else if (response.status === 409) {
        // Duplicate — still send them to thank-you
        navigate('/blueprint/thank-you', {
          state: {
            prospectId: data.existing_prospect_id,
            reportUrl: data.report_url,
          },
        });
      } else {
        setError(data.error || data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Failed to submit prospect:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <ThemeToggle />
      <NavBar />
      <div ref={heroRef}>
        <Hero onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
      </div>
      <StatsRow />
      <SocialProof logos={logos} maxLogos={maxLogosLanding} />
      <HowItWorks />
      <Footer />

      {/* Sticky CTA — appears after scrolling past the form */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm
          border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-none
          transform transition-all duration-300 ease-in-out
          ${showStickyCta ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
        `}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Free personalized blueprint — $3,000+ value
              </span>
            </div>
            <button
              onClick={() => heroRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-lg shadow-violet-500/25 ml-auto"
            >
              <ArrowUp className="w-4 h-4" />
              Get Your Blueprint Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlueprintLandingPage;
