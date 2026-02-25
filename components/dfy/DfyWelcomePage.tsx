import React from 'react';
import { CheckCircle2, Mail, ClipboardList, Rocket } from 'lucide-react';
import CalEmbed from '../blueprint/CalEmbed';
import ThemeToggle from '../blueprint/ThemeToggle';

const CONTENT_CALL_LINK = 'masonmas/30min';

const steps = [
  {
    icon: Rocket,
    title: 'Your system is being built',
    description: 'Our team is setting up your GTM infrastructure right now.',
  },
  {
    icon: Mail,
    title: 'Check your email',
    description: "You'll receive a link to your personal client portal shortly.",
  },
  {
    icon: ClipboardList,
    title: 'Complete your intake wizard',
    description: 'A quick 4-step form so we can tailor everything to your business.',
  },
];

const DfyWelcomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      <ThemeToggle />
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {/* Confirmation Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/10 mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">You're In!</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Your GTM Launch Package is being built. Book your content call below so we can hit the
            ground running.
          </p>
        </div>

        {/* Cal.com Embed */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-center">Book Your Content Call</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6">
            This 30-minute call is where we learn about your business, clients, and goals — so we
            can build a system that actually sounds like you.
          </p>
          <CalEmbed calLink={CONTENT_CALL_LINK} />
        </div>

        {/* Next Steps */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
          <h2 className="text-lg font-semibold mb-6">What Happens Next</h2>
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{step.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DfyWelcomePage;
