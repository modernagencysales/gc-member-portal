import React from 'react';

interface Step {
  number: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Book Your Strategy Call',
    description:
      "Pick a time that works for you. We'll review your blueprint together and map out your priorities.",
  },
  {
    number: '02',
    title: 'Get Your Implementation Plan',
    description:
      'Walk away with a clear, sequenced action plan — what to do first, second, and third.',
  },
  {
    number: '03',
    title: 'Start Generating Leads',
    description:
      'Implement your optimized profile, content system, and lead magnets to start filling your pipeline.',
  },
];

const SimpleSteps: React.FC = () => {
  return (
    <div className="py-12 sm:py-16 px-4 bg-gradient-to-b from-violet-950/10 to-transparent">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 text-center mb-3">
          3 Steps to Get Started
        </h2>
        <p className="text-zinc-400 text-center mb-10 max-w-2xl mx-auto">
          Turning this blueprint into real pipeline growth is simpler than you think.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div key={step.number} className="text-center">
              <div className="text-5xl sm:text-6xl font-bold text-violet-500/30 mb-3">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">{step.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleSteps;
