import React, { useState } from 'react';

interface Confirms {
  niche: string;
  tone: string;
  keyTopics: string[];
  offer: string;
  avoid: string;
}

interface StepQuickConfirmsProps {
  confirms: Confirms;
  onChange: (confirms: Confirms) => void;
}

const StepQuickConfirms: React.FC<StepQuickConfirmsProps> = ({ confirms, onChange }) => {
  const [newTopic, setNewTopic] = useState('');
  const [addingTopic, setAddingTopic] = useState(false);

  const updateField = (field: keyof Confirms, value: string | string[]) => {
    onChange({ ...confirms, [field]: value });
  };

  const removeTopic = (index: number) => {
    const updated = confirms.keyTopics.filter((_, i) => i !== index);
    updateField('keyTopics', updated);
  };

  const addTopic = () => {
    const trimmed = newTopic.trim();
    if (!trimmed) return;
    if (confirms.keyTopics.includes(trimmed)) {
      setNewTopic('');
      return;
    }
    updateField('keyTopics', [...confirms.keyTopics, trimmed]);
    setNewTopic('');
    setAddingTopic(false);
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTopic();
    }
    if (e.key === 'Escape') {
      setNewTopic('');
      setAddingTopic(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
        Here's what we already know about you
      </h2>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
        We pulled this from your Blueprint. Just confirm or tweak anything that's off.
      </p>

      <div className="space-y-5">
        {/* Niche */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1.5">
            Your niche
          </label>
          <input
            type="text"
            value={confirms.niche}
            onChange={(e) => updateField('niche', e.target.value)}
            placeholder="e.g. B2B SaaS marketing agencies"
            className="w-full text-sm bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
          />
        </div>

        {/* Tone */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1.5">
            Your tone
          </label>
          <input
            type="text"
            value={confirms.tone}
            onChange={(e) => updateField('tone', e.target.value)}
            placeholder="e.g. Confident and direct, with a conversational edge"
            className="w-full text-sm bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
          />
        </div>

        {/* Key topics */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1.5">
            Key topics
          </label>

          {/* Topic pills */}
          <div className="flex flex-wrap gap-2 mb-3">
            {confirms.keyTopics.map((topic, index) => (
              <span
                key={`${topic}-${index}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
              >
                {topic}
                <button
                  onClick={() => removeTopic(index)}
                  className="ml-0.5 text-violet-400 hover:text-violet-600 dark:text-violet-500 dark:hover:text-violet-300 transition-colors"
                  aria-label={`Remove topic "${topic}"`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}

            {confirms.keyTopics.length === 0 && !addingTopic && (
              <span className="text-xs text-gray-400 dark:text-zinc-500 py-1">
                No topics yet -- add some below
              </span>
            )}
          </div>

          {/* Add topic */}
          {addingTopic ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={handleTopicKeyDown}
                autoFocus
                placeholder="Type a topic and press Enter"
                className="flex-1 text-sm bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
              />
              <button
                onClick={addTopic}
                disabled={!newTopic.trim()}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setNewTopic('');
                  setAddingTopic(false);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingTopic(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add topic
            </button>
          )}
        </div>

        {/* Offer */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1.5">
            Your offer
          </label>
          <textarea
            value={confirms.offer}
            onChange={(e) => updateField('offer', e.target.value)}
            rows={3}
            placeholder="e.g. Done-for-you LinkedIn lead generation for B2B agencies -- $3k/mo retainer"
            className="w-full text-sm bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
          />
        </div>

        {/* Avoid */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1.5">
            Anything we should avoid?{' '}
            <span className="font-normal text-gray-400 dark:text-zinc-500">(optional)</span>
          </label>
          <textarea
            value={confirms.avoid}
            onChange={(e) => updateField('avoid', e.target.value)}
            rows={2}
            placeholder="e.g. Don't mention competitor X, avoid aggressive sales language, no emojis..."
            className="w-full text-sm bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
          />
        </div>
      </div>
    </div>
  );
};

export default StepQuickConfirms;
