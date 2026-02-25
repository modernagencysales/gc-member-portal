import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Users, Zap, Calendar, BookOpen, Target } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const SLACK_JOIN_URL =
  'https://join.slack.com/t/modernagencysales2/shared_invite/zt-2q711hmti-W4NRGAJ1IcSF2QxhfTP~2g';
const STRATEGY_CALL_URL =
  'https://cal.com/vlad-timinski-pqqica/linkedin-strategy-call?overlayCalendar=true';

const benefits = [
  {
    icon: Users,
    title: 'Active Community',
    description:
      'Connect with other agency owners and B2B founders growing on LinkedIn. Real conversations, not a ghost town.',
  },
  {
    icon: Zap,
    title: 'Live Support',
    description:
      'Get answers to your LinkedIn strategy questions in real-time from people who have done it.',
  },
  {
    icon: Target,
    title: 'Proven Playbooks',
    description:
      'Access the same LinkedIn growth strategies our clients use to book 10-20 calls/month.',
  },
  {
    icon: Calendar,
    title: 'Free Strategy Call',
    description:
      'Book a 30-minute call with our team. We will review your profile and give you a custom growth plan.',
  },
  {
    icon: BookOpen,
    title: 'Resources & Templates',
    description: 'Pinned guides, post templates, and outreach scripts — ready to use.',
  },
  {
    icon: MessageSquare,
    title: 'Direct Access',
    description: 'Skip the email back-and-forth. Ask questions and get feedback directly in Slack.',
  },
];

const NavBar: React.FC = () => (
  <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        Modern Agency Sales
      </span>
      <div className="flex items-center gap-4 sm:gap-6">
        <Link
          to="/blueprint"
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Get Your Blueprint
        </Link>
        <Link
          to="/login"
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Login
        </Link>
      </div>
    </div>
  </nav>
);

const CommunityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <ThemeToggle />
      <NavBar />

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="mb-6 inline-block rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            Free LinkedIn Growth Community
          </span>
          <h1 className="mb-6 text-4xl font-bold leading-tight text-zinc-900 dark:text-zinc-100 md:text-5xl">
            Grow Your LinkedIn.{' '}
            <span className="text-violet-600 dark:text-violet-400">Together.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 md:text-xl">
            Join our free Slack community of agency owners and B2B founders who are actively growing
            on LinkedIn. Get real support, proven strategies, and book a free strategy call with our
            team.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={SLACK_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-[#4A154B] px-8 py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
              </svg>
              Join the Slack Community
            </a>
            <a
              href={STRATEGY_CALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-zinc-300 px-8 py-4 text-lg font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Book a Free Strategy Call
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="border-y border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            What You Get
          </h2>
          <p className="mb-12 text-center text-lg text-zinc-600 dark:text-zinc-400">
            Everything you need to grow on LinkedIn — for free
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <benefit.icon className="mb-4 h-8 w-8 text-violet-600 dark:text-violet-400" />
                <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {benefit.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategy Call CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Want a Custom LinkedIn Growth Plan?
          </h2>
          <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-400">
            Book a free 30-minute strategy call with our team. We will review your LinkedIn profile,
            identify what is working, and give you a step-by-step plan to start booking more calls
            from LinkedIn.
          </p>
          <a
            href={STRATEGY_CALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90"
          >
            Book Your Free Strategy Call
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Ready to Grow?
          </h2>
          <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-400">
            Join hundreds of agency owners and B2B founders in our free Slack community.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={SLACK_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-[#4A154B] px-8 py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
              </svg>
              Join Slack
            </a>
            <a
              href={STRATEGY_CALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-zinc-300 px-8 py-4 text-lg font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Book a Strategy Call
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} Modern Agency Sales. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CommunityPage;
