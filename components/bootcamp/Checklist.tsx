import React from 'react';
import { ActionItem } from '../../types';
import { Check, Link, AlertCircle } from 'lucide-react';

interface ChecklistProps {
  items: ActionItem[];
  completedIds: Set<string>;
  proofOfWork: Record<string, string>;
  onToggle: (id: string) => void;
  onUpdateProof: (id: string, proof: string) => void;
  title?: string;
}

const Checklist: React.FC<ChecklistProps> = ({
  items,
  completedIds,
  proofOfWork,
  onToggle,
  onUpdateProof,
  title = 'Weekly Action Plan',
}) => {
  const completedCount = items.filter((item) => completedIds.has(item.id)).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex justify-between items-end mb-2">
          <h3 className="font-semibold text-zinc-900 text-lg">{title}</h3>
          <span className="text-sm font-medium text-violet-600">
            {Math.round(progress)}% Verified
          </span>
        </div>
        <div className="w-full bg-zinc-200 rounded-full h-2">
          <div
            className="bg-violet-500 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-zinc-400 mt-2 flex items-center gap-1 uppercase font-semibold tracking-tighter">
          <AlertCircle size={10} /> Submit proof link for instructor review
        </p>
      </div>

      <div className="divide-y divide-zinc-100">
        {items.map((item) => {
          const isCompleted = completedIds.has(item.id);
          const currentProof = proofOfWork[item.id] || '';

          return (
            <div key={item.id} className="group transition-colors">
              <button
                onClick={() => onToggle(item.id)}
                className={`w-full text-left p-4 flex items-start gap-3 hover:bg-zinc-50 transition-colors`}
              >
                <div
                  className={`
                    flex-shrink-0 mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                    ${
                      isCompleted
                        ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                        : 'border-zinc-200 group-hover:border-violet-300 bg-white'
                    }
                  `}
                >
                  {isCompleted && <Check size={14} strokeWidth={3} />}
                </div>
                <span
                  className={`
                    text-sm leading-relaxed transition-all pt-0.5
                    ${isCompleted ? 'text-zinc-400' : 'text-zinc-700 font-semibold'}
                  `}
                >
                  {item.text}
                </span>
              </button>

              {/* Accountability Input Field - Only shows when checked */}
              {isCompleted && (
                <div className="px-4 pb-4 ml-9 animate-slide-in">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <Link size={14} />
                    </div>
                    <input
                      type="text"
                      placeholder="Paste link to proof (Loom, Table, etc.)"
                      value={currentProof}
                      onChange={(e) => onUpdateProof(item.id, e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-violet-100 rounded-lg bg-violet-50/30 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 focus:bg-white transition-all outline-none text-zinc-600 italic"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="p-6 text-center text-zinc-400 text-sm italic">
            No action items for this week.
          </div>
        )}
      </div>
    </div>
  );
};

export default Checklist;
