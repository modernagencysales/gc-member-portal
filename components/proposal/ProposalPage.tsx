import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart3,
  Target,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Download,
  Calendar,
  Check,
  Clock,
} from 'lucide-react';
import ThemeToggle from '../blueprint/ThemeToggle';
import { getProposalBySlug } from '../../services/proposal-supabase';
import type { Proposal, ProposalGoal, ProposalService } from '../../types/proposal-types';

// ---------------------------------------------------------------------------
// Inline sub-components
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-xs font-medium text-zinc-400">Loading proposal...</p>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-zinc-300 dark:text-zinc-700 mb-4">404</h1>
        <p className="text-zinc-500">
          This proposal doesn&apos;t exist or hasn&apos;t been published yet.
        </p>
        <Link to="/" className="mt-6 inline-block text-violet-500 hover:text-violet-400 text-sm">
          Go to homepage
        </Link>
      </div>
    </div>
  );
}

function GoalCard({ goal, accent }: { goal: ProposalGoal; accent: string }) {
  const icons: Record<ProposalGoal['type'], typeof Target> = {
    metric: BarChart3,
    aspirational: Target,
    experimental: FlaskConical,
  };
  const labels: Record<ProposalGoal['type'], string> = {
    metric: 'Metric-Driven',
    aspirational: 'Aspirational',
    experimental: 'Experimental',
  };
  const Icon = icons[goal.type] || Target;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}15`, color: accent }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {labels[goal.type]}
        </span>
      </div>
      <h4 className="font-semibold mb-2">{goal.title}</h4>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{goal.description}</p>
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Clock className="w-3.5 h-3.5" />
        {goal.timeline}
      </div>
    </div>
  );
}

function ServiceCard({ service, accent }: { service: ProposalService; accent: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden print:border-zinc-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-5 flex items-center justify-between text-left print:pointer-events-none"
      >
        <div>
          <h4 className="font-semibold text-lg">{service.name}</h4>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{service.description}</p>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-zinc-400 flex-shrink-0 print:hidden" />
        ) : (
          <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0 print:hidden" />
        )}
      </button>
      <div className={`px-6 pb-5 ${open ? 'block' : 'hidden'} print:block`}>
        <div className="border-t border-zinc-100 dark:border-zinc-700 pt-4">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
            <Clock className="w-3.5 h-3.5" />
            {service.timeline}
          </div>
          <ul className="space-y-2">
            {service.deliverables.map((d, j) => (
              <li key={j} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                <span className="text-zinc-600 dark:text-zinc-300">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ProposalPage component
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
          .print\\:block { display: block !important; }
          .print\\:pointer-events-none { pointer-events: none !important; }
        }
      `}</style>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Header Bar                                                      */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 print:static print:bg-white print:border-zinc-300">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
            Modern Agency Sales
          </span>
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            Proposal
          </span>
          <div className="flex items-center gap-2">
            {proposal.clientLogoUrl ? (
              <img
                src={proposal.clientLogoUrl}
                alt={proposal.clientCompany}
                className="h-8 object-contain"
              />
            ) : (
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {proposal.clientCompany}
              </span>
            )}
          </div>
        </div>
        <div className="h-0.5" style={{ backgroundColor: clientAccent }} />
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Hero Section                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
            Prepared for
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">{proposal.clientName}</h1>
          {proposal.clientTitle && (
            <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-1">{proposal.clientTitle}</p>
          )}
          <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-8">{proposal.clientCompany}</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-12">
            {new Date(proposal.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6" style={{ color: clientAccent }}>
            {proposal.headline}
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            {proposal.executiveSummary}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Who We Are                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 px-6 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center">Who We Are</h3>
          <p className="text-zinc-600 dark:text-zinc-300 text-center max-w-3xl mx-auto mb-12 leading-relaxed">
            {proposal.aboutUs.blurb}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {proposal.aboutUs.stats.map((stat, i) => (
              <div
                key={i}
                className="text-center p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-sm"
              >
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>
          {proposal.aboutUs.socialProof.length > 0 && (
            <div className="space-y-3">
              {proposal.aboutUs.socialProof.map((quote, i) => (
                <p key={i} className="text-center text-sm text-zinc-500 dark:text-zinc-400 italic">
                  &ldquo;{quote}&rdquo;
                </p>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. You + Your Goals                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold mb-10 text-center">You + Your Goals</h3>

          {/* Client Snapshot Card */}
          <div
            className="rounded-xl p-6 mb-12 border-l-4"
            style={{
              borderColor: clientAccent,
              backgroundColor: `${clientAccent}08`,
            }}
          >
            <h4 className="font-semibold text-lg mb-3">{proposal.clientSnapshot.company}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-xs text-zinc-400 uppercase">Industry</span>
                <p className="text-sm font-medium">{proposal.clientSnapshot.industry}</p>
              </div>
              <div>
                <span className="text-xs text-zinc-400 uppercase">Size</span>
                <p className="text-sm font-medium">{proposal.clientSnapshot.size}</p>
              </div>
              <div>
                <span className="text-xs text-zinc-400 uppercase">Revenue</span>
                <p className="text-sm font-medium">{proposal.clientSnapshot.revenue}</p>
              </div>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
              {proposal.clientSnapshot.currentState}
            </p>
          </div>

          {/* Goal Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {proposal.goals.map((goal, i) => (
              <GoalCard key={i} goal={goal} accent={clientAccent} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Our Proposal (Services)                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 px-6 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold mb-10 text-center">Our Proposal</h3>
          <div className="space-y-4">
            {proposal.services.map((service, i) => (
              <ServiceCard key={i} service={service} accent={clientAccent} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. Roadmap (Vertical Timeline)                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-10 text-center">Roadmap</h3>
          <div className="relative">
            <div
              className="absolute left-6 top-0 bottom-0 w-0.5"
              style={{ backgroundColor: `${clientAccent}30` }}
            />
            <div className="space-y-8">
              {proposal.roadmap.map((phase, i) => (
                <div key={i} className="relative pl-16">
                  <div
                    className="absolute left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold bg-white dark:bg-zinc-950"
                    style={{ borderColor: clientAccent, color: clientAccent }}
                  >
                    {phase.phase}
                  </div>
                  <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{phase.title}</h4>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                        {phase.duration}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                      {phase.description}
                    </p>
                    {phase.milestones.length > 0 && (
                      <ul className="space-y-1.5">
                        {phase.milestones.map((m, j) => (
                          <li
                            key={j}
                            className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: clientAccent }}
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
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. Pricing / Investment                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 px-6 bg-zinc-50 dark:bg-zinc-900/50 print:break-before-page">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold mb-10 text-center">Investment</h3>
          <div
            className={`grid gap-6 mb-8 ${
              proposal.pricing.packages.length === 1
                ? 'max-w-md mx-auto'
                : proposal.pricing.packages.length === 2
                  ? 'md:grid-cols-2 max-w-3xl mx-auto'
                  : 'md:grid-cols-3'
            }`}
          >
            {proposal.pricing.packages.map((pkg, i) => (
              <div
                key={i}
                className={`rounded-xl p-6 border-2 ${
                  pkg.recommended
                    ? 'border-violet-500 dark:border-violet-400 shadow-lg'
                    : 'border-zinc-200 dark:border-zinc-700'
                } bg-white dark:bg-zinc-800`}
              >
                {pkg.recommended && (
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-3">
                    Recommended
                  </span>
                )}
                <h4 className="text-lg font-bold mb-1">{pkg.name}</h4>
                <p className="text-2xl font-bold mb-4" style={{ color: clientAccent }}>
                  {pkg.price}
                </p>
                <ul className="space-y-2">
                  {pkg.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                      <span className="text-zinc-600 dark:text-zinc-300">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {proposal.pricing.customItems.length > 0 && (
            <div className="max-w-md mx-auto mb-8">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-zinc-400 mb-3">
                Add-Ons
              </h4>
              {proposal.pricing.customItems.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800"
                >
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">{item.label}</span>
                  <span className="text-sm font-medium">{item.price}</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-zinc-400 mb-1">Total Investment</p>
            <p className="text-3xl font-bold" style={{ color: clientAccent }}>
              {proposal.pricing.total}
            </p>
            {proposal.pricing.paymentTerms && (
              <p className="text-sm text-zinc-400 mt-2">{proposal.pricing.paymentTerms}</p>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 8. Next Steps + CTA                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 px-6 print:break-before-page">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-10 text-center">Next Steps</h3>
          <div className="space-y-6 mb-12">
            {proposal.nextSteps.map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                  style={{ backgroundColor: clientAccent }}
                >
                  {step.step}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{step.title}</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 print:hidden">
            <a
              href={import.meta.env.VITE_CALCOM_BOOKING_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: clientAccent }}
            >
              <Calendar className="w-5 h-5" />
              Book a Call
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 9. Footer                                                          */}
      {/* ------------------------------------------------------------------ */}
      <footer className="py-8 px-6 border-t border-zinc-200 dark:border-zinc-800 print:border-zinc-300">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
          <p>&copy; {new Date().getFullYear()} Modern Agency Sales. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-zinc-600 dark:hover:text-zinc-300">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-zinc-600 dark:hover:text-zinc-300">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProposalPage;
