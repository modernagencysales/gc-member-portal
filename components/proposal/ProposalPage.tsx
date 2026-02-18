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
} from 'lucide-react';
import ThemeToggle from '../blueprint/ThemeToggle';
import LogoBar from '../blueprint/LogoBar';
import { SenjaEmbed } from '../blueprint/offer-components';
import { getClientLogos } from '../../services/blueprint-supabase';
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
// Goal Card
// ---------------------------------------------------------------------------

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
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-8 sm:p-10">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: accent, color: '#fff' }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {labels[goal.type]}
        </span>
      </div>
      <h4 className="text-lg font-bold mb-2">{goal.title}</h4>
      <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
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
// Service Card (always expanded)
// ---------------------------------------------------------------------------

function ServiceCard({ service, accent }: { service: ProposalService; accent: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-8 sm:p-10 print:border-zinc-300">
      <div className="mb-6">
        <h4 className="text-xl font-bold mb-2">{service.name}</h4>
        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {service.description}
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-5">
        <Clock className="w-4 h-4" />
        {service.timeline}
      </div>
      <ul className="space-y-3">
        {service.deliverables.map((d, j) => (
          <li key={j} className="flex items-start gap-3 text-base">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: accent }}
            >
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-zinc-600 dark:text-zinc-300">{d}</span>
          </li>
        ))}
      </ul>
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
  const [clientLogos, setClientLogos] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    getProposalBySlug(slug).then((p) => {
      setProposal(p);
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    getClientLogos().then((logos) => setClientLogos(logos));
  }, []);

  if (loading) return <LoadingState />;
  if (!proposal) return <NotFoundState />;

  const clientAccent = proposal.clientBrandColor || '#7c3aed';
  const lastPhase = proposal.roadmap[proposal.roadmap.length - 1];

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
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm print:static print:bg-white print:border-zinc-300">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-sm font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
            Modern Agency Sales
          </span>
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
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
        <div className="h-[3px]" style={{ backgroundColor: clientAccent }} />
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Hero Section                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 sm:py-32 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          {/* "Prepared exclusively for" pill badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 mb-8">
            <Sparkles className="w-4 h-4" style={{ color: clientAccent }} />
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Prepared exclusively for
            </span>
          </div>

          {/* Client name — largest text on page */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4">
            {proposal.clientName}
          </h1>

          {proposal.clientTitle && (
            <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-1">{proposal.clientTitle}</p>
          )}
          <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-10">{proposal.clientCompany}</p>

          {/* Headline in accent color */}
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-8 leading-tight"
            style={{ color: clientAccent }}
          >
            {proposal.headline}
          </h2>

          {/* Executive summary */}
          <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl mx-auto mb-8">
            {proposal.executiveSummary}
          </p>

          {/* Date — subtle */}
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
      {/* 2b. Client Logo Bar                                                */}
      {/* ------------------------------------------------------------------ */}
      {clientLogos.length > 0 && (
        <section className="px-6 pb-16">
          <div className="max-w-4xl mx-auto">
            <LogoBar logos={clientLogos} />
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. Who We Are                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 sm:py-32 px-6 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-950">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8 text-center">
            Who We Are
          </h3>
          <p className="text-lg text-zinc-600 dark:text-zinc-300 text-center max-w-3xl mx-auto mb-16 leading-relaxed">
            {proposal.aboutUs.blurb}
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {proposal.aboutUs.stats.map((stat, i) => (
              <div
                key={i}
                className="text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-8"
              >
                <div className="text-3xl font-bold mb-2" style={{ color: clientAccent }}>
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Social proof quotes */}
          {proposal.aboutUs.socialProof.length > 0 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {proposal.aboutUs.socialProof.map((quote, i) => (
                <div key={i} className="border-l-4 pl-6 py-2" style={{ borderColor: clientAccent }}>
                  <p className="text-lg text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
                    &ldquo;{quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Your Situation                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 sm:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-12 text-center">
            Your Situation
          </h3>

          {/* Client Snapshot Card */}
          <div
            className="rounded-2xl p-8 sm:p-10 mb-8 border-l-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none"
            style={{ borderLeftColor: clientAccent }}
          >
            <h4 className="text-xl font-bold mb-5">{proposal.clientSnapshot.company}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Industry
                </span>
                <p className="text-base font-medium mt-1">{proposal.clientSnapshot.industry}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Size
                </span>
                <p className="text-base font-medium mt-1">{proposal.clientSnapshot.size}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Revenue
                </span>
                <p className="text-base font-medium mt-1">{proposal.clientSnapshot.revenue}</p>
              </div>
            </div>
            <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {proposal.clientSnapshot.currentState}
            </p>
          </div>

          {/* Future-pacing paragraph */}
          <div
            className="rounded-2xl p-8 sm:p-10 mb-16 text-center"
            style={{ backgroundColor: `${clientAccent}08` }}
          >
            <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl mx-auto italic">
              Imagine what your business looks like 90 days from now &mdash; with a fully
              operational system generating qualified conversations, filling your pipeline, and
              compounding every month. That&apos;s what we&apos;re building together.
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
      {/* 5. What We'll Build Together (Services)                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 sm:py-32 px-6 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-950">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-12 text-center">
            What We&apos;ll Build Together
          </h3>
          <div className="space-y-6">
            {proposal.services.map((service, i) => (
              <ServiceCard key={i} service={service} accent={clientAccent} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. Roadmap (Vertical Timeline)                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 sm:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-12 text-center">
            Roadmap
          </h3>
          <div className="relative">
            {/* Timeline line — thicker and more prominent */}
            <div
              className="absolute left-7 top-0 bottom-0 w-1 rounded-full"
              style={{ backgroundColor: `${clientAccent}25` }}
            />
            <div className="space-y-10">
              {proposal.roadmap.map((phase, i) => (
                <div key={i} className="relative pl-20">
                  {/* Phase circle — filled solid accent */}
                  <div
                    className="absolute left-3.5 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                    style={{ backgroundColor: clientAccent }}
                  >
                    {phase.phase}
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-8 sm:p-10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold">{phase.title}</h4>
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        {phase.duration}
                      </span>
                    </div>
                    <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                      {phase.description}
                    </p>
                    {phase.milestones.length > 0 && (
                      <ul className="space-y-2">
                        {phase.milestones.map((m, j) => (
                          <li
                            key={j}
                            className="flex items-center gap-3 text-base text-zinc-600 dark:text-zinc-300"
                          >
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
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

          {/* Result preview callout */}
          {lastPhase && (
            <div
              className="mt-12 rounded-2xl p-8 sm:p-10 text-center"
              style={{
                background: `linear-gradient(135deg, ${clientAccent}10, ${clientAccent}05)`,
              }}
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                style={{ backgroundColor: `${clientAccent}15` }}
              >
                <Sparkles className="w-4 h-4" style={{ color: clientAccent }} />
                <span className="text-sm font-semibold" style={{ color: clientAccent }}>
                  End Result
                </span>
              </div>
              <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl mx-auto">
                By the end of Phase {lastPhase.phase}, you&apos;ll have a fully operational system
                that&apos;s generating results &mdash; not just a plan, but a living, breathing
                engine built specifically for {proposal.clientCompany}.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. Investment                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 sm:py-32 px-6 print:break-before-page"
        style={{
          background: `linear-gradient(180deg, ${clientAccent}06 0%, transparent 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-12 text-center">
            Investment
          </h3>

          {/* Pricing packages */}
          <div
            className={`grid gap-8 mb-12 ${
              proposal.pricing.packages.length === 1
                ? 'max-w-lg mx-auto'
                : proposal.pricing.packages.length === 2
                  ? 'md:grid-cols-2 max-w-3xl mx-auto'
                  : 'md:grid-cols-3'
            }`}
          >
            {proposal.pricing.packages.map((pkg, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-8 sm:p-10 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none ${
                  pkg.recommended
                    ? 'border-2 shadow-lg dark:shadow-lg'
                    : 'border border-zinc-200 dark:border-zinc-800'
                }`}
                style={pkg.recommended ? { borderColor: clientAccent } : undefined}
              >
                {pkg.recommended && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: clientAccent }}
                  >
                    Recommended
                  </div>
                )}
                <h4 className="text-xl font-bold mb-2">{pkg.name}</h4>
                <p className="text-3xl font-bold mb-6" style={{ color: clientAccent }}>
                  {pkg.price}
                </p>
                <ul className="space-y-3">
                  {pkg.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-base">
                      <Check
                        className="w-5 h-5 mt-0.5 flex-shrink-0"
                        style={{ color: clientAccent }}
                      />
                      <span className="text-zinc-600 dark:text-zinc-300">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Custom add-ons */}
          {proposal.pricing.customItems.length > 0 && (
            <div className="max-w-lg mx-auto mb-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-8">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-zinc-400 mb-5">
                Add-Ons
              </h4>
              {proposal.pricing.customItems.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                >
                  <span className="text-base text-zinc-600 dark:text-zinc-300">{item.label}</span>
                  <span className="text-base font-semibold">{item.price}</span>
                </div>
              ))}
            </div>
          )}

          {/* Total — large and accent */}
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Total Investment
            </p>
            <p className="text-4xl sm:text-5xl font-bold" style={{ color: clientAccent }}>
              {proposal.pricing.total}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 8. What Happens Next                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 sm:py-32 px-6 print:break-before-page">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-12 text-center">
            What Happens Next
          </h3>

          <div className="space-y-8 mb-16">
            {proposal.nextSteps.map((step, i) => (
              <div key={i} className="flex gap-5 items-start">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white shadow-sm"
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

          {/* Future-pacing CTA block */}
          <div
            className="rounded-2xl p-8 sm:p-10 text-center"
            style={{
              background: `linear-gradient(135deg, ${clientAccent}10, ${clientAccent}05)`,
            }}
          >
            <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl mx-auto">
              Every day you wait is a day your competitors are building their pipeline. Let&apos;s
              make the next 90 days the most productive your business has ever had.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 9. Final CTA                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 sm:py-32 px-6 print:hidden"
        style={{
          background: `linear-gradient(180deg, ${clientAccent}08 0%, ${clientAccent}03 50%, transparent 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            Ready to Get Started?
          </h3>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Book a call and let&apos;s walk through this proposal together. We&apos;ll answer any
            questions and map out the fastest path to results.
          </p>

          <a
            href={import.meta.env.VITE_CALCOM_BOOKING_URL || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: clientAccent }}
          >
            <Calendar className="w-5 h-5" />
            Book a Call
            <ArrowRight className="w-5 h-5" />
          </a>

          {/* Senja testimonials */}
          <div className="mt-20">
            <SenjaEmbed />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 10. Footer                                                         */}
      {/* ------------------------------------------------------------------ */}
      <footer className="py-12 px-6 border-t border-zinc-200 dark:border-zinc-800 print:border-zinc-300">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
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
