import React from 'react';
import { CheckCircle, User, FileText, Lightbulb, BarChart3, Calendar, Target } from 'lucide-react';

interface ValueItem {
  icon: React.ElementType;
  label: string;
  detail: string;
}

const VALUE_ITEMS: ValueItem[] = [
  {
    icon: BarChart3,
    label: 'Authority Score Breakdown',
    detail: '5 key metrics showing exactly where you stand',
  },
  {
    icon: User,
    label: 'Complete Profile Rewrite',
    detail: '3 headline options + optimized bio, ready to copy-paste',
  },
  {
    icon: Target,
    label: 'Revenue Leak Analysis',
    detail: "What's costing you deals and how to fix it",
  },
  {
    icon: Lightbulb,
    label: '3 Custom Lead Magnets',
    detail: 'Designed to attract your ideal buyer persona',
  },
  {
    icon: Calendar,
    label: '60-Day Content Roadmap',
    detail: 'Ready-to-post content that builds authority daily',
  },
  {
    icon: FileText,
    label: 'Strategic Action Plan',
    detail: 'Clear next steps to turn LinkedIn into a revenue channel',
  },
];

const ValueStack: React.FC = () => {
  return (
    <div className="py-12 sm:py-16 px-4 bg-gradient-to-b from-violet-950/10 to-transparent">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 text-center mb-3">
          Everything in Your Blueprint
        </h2>
        <p className="text-zinc-400 text-center mb-10 max-w-2xl mx-auto">
          Here&apos;s what you&apos;re getting — a complete LinkedIn authority system, personalized
          to your business.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VALUE_ITEMS.map((item) => (
            <div
              key={item.label}
              className="bg-violet-500/5 border border-violet-500/10 rounded-lg p-5 flex items-start gap-4"
            >
              <div className="flex-shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100 mb-1">{item.label}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ValueStack;
