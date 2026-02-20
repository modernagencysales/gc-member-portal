import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart3,
  Target,
  FlaskConical,
  Calendar,
  Check,
  Clock,
  ArrowRight,
  Sparkles,
  Download,
} from 'lucide-react';
import ThemeToggle from '../blueprint/ThemeToggle';
import SigningBlock from './SigningBlock';
import { SenjaEmbed } from '../blueprint/offer-components';
import { getProposalBySlug } from '../../services/proposal-supabase';
import type { Proposal, ProposalGoal, ProposalService } from '../../types/proposal-types';

// ---------------------------------------------------------------------------
// Loading & Error States
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-zinc-400 tracking-wide">Loading proposal...</p>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
      <div className="text-center max-w-md px-6">
        <h1 className="text-6xl font-bold text-zinc-200 dark:text-zinc-800 mb-4">404</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-6">
          This proposal doesn&apos;t exist or hasn&apos;t been published yet.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text Helper — splits long text into digestible paragraphs
// ---------------------------------------------------------------------------

function TextBlock({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  if (paragraphs.length <= 1) {
    return <p className={className}>{text}</p>;
  }
  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => (
        <p key={i} className={className}>
          {p}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Goal Card
// ---------------------------------------------------------------------------

function GoalCard({ goal, accent }: { goal: ProposalGoal; accent: string }) {
  const icons: Record<ProposalGoal['type'], typeof Target> = {
    metric: BarChart3,
    aspirational: Target,
    experimental: FlaskConical,
  };
  const Icon = icons[goal.type] || Target;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6 sm:p-8">
      <div className="mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: accent, color: '#fff' }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <h4 className="text-base font-bold mb-2">{goal.title}</h4>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
        {goal.description}
      </p>
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Clock className="w-4 h-4" />
        {goal.timeline}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deliverable Row
// ---------------------------------------------------------------------------

function DeliverableRow({ service, accent }: { service: ProposalService; accent: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: accent }}
        >
          <Check className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-lg font-bold">{service.name}</h4>
            {service.timeline && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hidden sm:block">
                {service.timeline}
              </span>
            )}
          </div>
          <TextBlock
            text={service.description}
            className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3"
          />
          {service.deliverables.length > 0 && (
            <ul className="space-y-1.5">
              {service.deliverables.map((d, j) => (
                <li
                  key={j}
                  className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: accent }}
                  />
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ProposalPage Component
// ---------------------------------------------------------------------------

const ProposalPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    getProposalBySlug(slug).then((p) => {
      setProposal(p);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <LoadingState />;
  if (!proposal) return <NotFoundState />;

  const clientAccent = proposal.clientBrandColor || '#7c3aed';
  const bookingUrl = import.meta.env.VITE_CALCOM_BOOKING_URL || '#';

  // Split personal letter into paragraphs (handles both \n\n and single-paragraph legacy)
  const letterParagraphs = proposal.executiveSummary
    ? proposal.executiveSummary.split(/\n\n+/).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <ThemeToggle />

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .dark body, .dark * { background: white !important; color: black !important; border-color: #e5e7eb !important; }
          [class*="dark:"] { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:break-before-page { page-break-before: always; }
          .print\\:static { position: static !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:border-zinc-300 { border-color: #d4d4d8 !important; }
        }
      `}</style>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Header Bar                                                      */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm print:static print:bg-white print:border-zinc-300">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-sm font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
            Modern Agency Sales
          </span>
          <div className="flex items-center gap-3">
            {proposal.clientLogoUrl ? (
              <div className="dark:bg-white dark:rounded-md dark:px-2 dark:py-1">
                <img
                  src={proposal.clientLogoUrl}
                  alt={proposal.clientCompany}
                  className="h-8 object-contain"
                />
              </div>
            ) : (
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {proposal.clientCompany}
              </span>
            )}
            <button
              onClick={() => window.print()}
              className="print:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
          </div>
        </div>
        <div className="h-[3px]" style={{ backgroundColor: clientAccent }} />
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Hero — Clean & Minimal                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="pt-20 sm:pt-28 pb-12 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 mb-8">
            <Sparkles className="w-4 h-4" style={{ color: clientAccent }} />
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Prepared for {proposal.clientName}
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6"
            style={{ color: clientAccent }}
          >
            {proposal.headline}
          </h1>

          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {new Date(proposal.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Personal Letter                                                 */}
      {/* ------------------------------------------------------------------ */}
      {letterParagraphs.length > 0 && (
        <section className="py-16 sm:py-20 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-5">
              {letterParagraphs.map((paragraph, i) => (
                <p key={i} className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. Your Situation + Goals                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 sm:py-24 px-6 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-950">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-10 text-center">
            Where You Are Today
          </h3>

          {/* Client Snapshot */}
          <div
            className="rounded-2xl p-8 sm:p-10 mb-6 border-l-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none"
            style={{ borderLeftColor: clientAccent }}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-6">
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Company
                </span>
                <p className="text-base font-medium mt-1">{proposal.clientSnapshot.company}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Industry
                </span>
                <p className="text-base font-medium mt-1">{proposal.clientSnapshot.industry}</p>
              </div>
              {proposal.clientSnapshot.size && (
                <div>
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Size
                  </span>
                  <p className="text-base font-medium mt-1">{proposal.clientSnapshot.size}</p>
                </div>
              )}
            </div>
            <TextBlock
              text={proposal.clientSnapshot.currentState}
              className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed"
            />
          </div>

          {/* Goals heading */}
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8 mt-16 text-center">
            Your Goals
          </h3>

          {/* Goal Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {proposal.goals.map((goal, i) => (
              <GoalCard key={i} goal={goal} accent={clientAccent} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. What's Included (Deliverables)                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 sm:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-center">
            What&apos;s Included
          </h3>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Everything we&apos;re building for {proposal.clientCompany}, specifically.
          </p>
          <div className="space-y-4">
            {proposal.services.map((service, i) => (
              <DeliverableRow key={i} service={service} accent={clientAccent} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. How It Works (Process)                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 sm:py-24 px-6 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-950">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-12 text-center">
            How It Works
          </h3>

          <div className="space-y-6">
            {proposal.roadmap.map((phase, i) => (
              <div key={i} className="flex gap-5 items-start">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                  style={{ backgroundColor: clientAccent }}
                >
                  {phase.phase}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-bold">{phase.title}</h4>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {phase.duration}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {phase.description}
                  </p>
                  {phase.milestones.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {phase.milestones.map((m, j) => (
                        <li
                          key={j}
                          className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                        >
                          <Check
                            className="w-3.5 h-3.5 flex-shrink-0"
                            style={{ color: clientAccent }}
                          />
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. Investment                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 sm:py-24 px-6 print:break-before-page">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-12 text-center">
            Investment
          </h3>

          {/* Single clean pricing card */}
          <div
            className="max-w-lg mx-auto rounded-2xl p-8 sm:p-10 bg-white dark:bg-zinc-900 border-2 shadow-lg dark:shadow-none text-center"
            style={{ borderColor: clientAccent }}
          >
            <p className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: clientAccent }}>
              {proposal.pricing.total}
            </p>

            {/* Package features */}
            {proposal.pricing.packages.length > 0 && (
              <ul className="space-y-3 text-left mb-8">
                {proposal.pricing.packages[0].features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-base">
                    <Check
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{ color: clientAccent }}
                    />
                    <span className="text-zinc-600 dark:text-zinc-300">{f}</span>
                  </li>
                ))}
              </ul>
            )}

            {proposal.pricing.paymentTerms && (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                {proposal.pricing.paymentTerms}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 8. Credibility Bar                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 px-6 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-950">
        <div className="max-w-3xl mx-auto">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {proposal.aboutUs.stats.map((stat, i) => (
              <div key={i} className="text-center py-4">
                <div className="text-2xl font-bold mb-1" style={{ color: clientAccent }}>
                  {stat.value}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          {proposal.aboutUs.socialProof.length > 0 && (
            <div className="space-y-4">
              {proposal.aboutUs.socialProof.map((quote, i) => (
                <div key={i} className="border-l-4 pl-5 py-1" style={{ borderColor: clientAccent }}>
                  <p className="text-base text-zinc-500 dark:text-zinc-400 italic">
                    &ldquo;{quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 9. What Happens Next                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 sm:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-10 text-center">
            Next Steps
          </h3>

          <div className="space-y-6">
            {proposal.nextSteps.map((step, i) => (
              <div key={i} className="flex gap-5 items-start">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                  style={{ backgroundColor: clientAccent }}
                >
                  {step.step}
                </div>
                <div className="pt-1">
                  <h4 className="text-lg font-bold mb-1">{step.title}</h4>
                  <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 10: Signing Block */}
      {proposal.status === 'published' && (
        <SigningBlock
          proposalId={proposal.id}
          services={proposal.services || []}
          pricing={proposal.pricing || { total: '', frequency: '' }}
          roadmap={proposal.roadmap}
          clientAccent={clientAccent}
          clientName={proposal.clientName || ''}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 11. Senja Testimonials                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 px-6 print:hidden">
        <div className="max-w-3xl mx-auto">
          <SenjaEmbed />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 12. Footer                                                         */}
      {/* ------------------------------------------------------------------ */}
      <footer className="py-12 px-6 border-t border-zinc-200 dark:border-zinc-800 print:border-zinc-300">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
          <p>&copy; {new Date().getFullYear()} Modern Agency Sales. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProposalPage;
