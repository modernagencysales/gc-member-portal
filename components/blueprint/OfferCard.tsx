import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { OfferData } from './offer-data';

// ============================================
// Types
// ============================================

export interface OfferCardProps {
  offer: OfferData;
  paymentUrl?: string;
  calBookingLink?: string;
}

// ============================================
// OfferCard Component — Compact expandable card for non-recommended offer
// ============================================

const OfferCard: React.FC<OfferCardProps> = ({ offer, paymentUrl, calBookingLink }) => {
  const [expanded, setExpanded] = useState(false);

  // Show first 5-6 key bullets from weeks
  const keyBullets = [
    offer.weeks[0]?.deliverable,
    offer.weeks[1]?.deliverable,
    offer.weeks[2]?.deliverable,
    offer.weeks[3]?.deliverable,
    `${offer.toolsIncluded.length} proprietary AI tools included`,
    'Lifetime access to all recordings',
  ].filter(Boolean);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Compact Header */}
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-2xl font-bold text-zinc-100">{offer.name}</h3>
            <p className="text-zinc-400 mt-1">{offer.tagline}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-bold text-zinc-100">{offer.price}</div>
            <p className="text-sm text-zinc-400">{offer.paymentPlan}</p>
          </div>
        </div>

        {/* Key Bullets */}
        <ul className="space-y-2.5 mb-6">
          {keyBullets.slice(0, 6).map((bullet, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-700/50 flex items-center justify-center mt-0.5">
                <Check className="w-3 h-3 text-zinc-400" />
              </div>
              <span className="text-zinc-300 text-sm">{bullet}</span>
            </li>
          ))}
        </ul>

        {/* Expand Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors text-sm font-medium mb-6"
        >
          {expanded ? 'Hide Details' : 'See Full Details'}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-8 mb-6 border-t border-zinc-800 pt-6">
            {/* Curriculum Summary */}
            <div>
              <h4 className="text-lg font-semibold text-zinc-100 mb-4">What We Build Together</h4>
              <div className="space-y-4">
                {offer.weeks.map((week) => (
                  <div key={week.week} className="border-l-2 border-violet-500/30 pl-4">
                    <p className="font-medium text-zinc-200">
                      Week {week.week}: {week.title}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">{week.deliverable}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Tools */}
            <div>
              <h4 className="text-lg font-semibold text-zinc-100 mb-3">AI Tools Included</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {offer.toolsIncluded.map((tool) => (
                  <div key={tool.name} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span className="text-zinc-300">
                      <span className="font-medium">{tool.name}</span>
                      <span className="text-zinc-500"> — {tool.description}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guarantee */}
            <div className="bg-zinc-800/50 rounded-lg p-4 flex gap-3">
              <Shield className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-zinc-200">{offer.guarantee}</p>
                <p className="text-sm text-zinc-400 mt-1">{offer.guaranteeDetails}</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        {paymentUrl ? (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 px-6 rounded-lg font-semibold text-center transition-colors bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
          >
            {offer.ctaPrimary}
          </a>
        ) : calBookingLink ? (
          <a
            href={`https://cal.com/${calBookingLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 px-6 rounded-lg font-semibold text-center transition-colors bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
          >
            {offer.ctaSecondary}
          </a>
        ) : (
          <button
            disabled
            className="block w-full py-4 px-6 rounded-lg font-semibold text-center bg-zinc-800 text-zinc-500 cursor-not-allowed"
          >
            Coming Soon
          </button>
        )}
      </div>
    </div>
  );
};

export default OfferCard;
