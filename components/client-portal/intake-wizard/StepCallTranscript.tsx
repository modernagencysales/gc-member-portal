import React from 'react';

interface StepCallTranscriptProps {
  callTranscript: string;
  onChange: (transcript: string) => void;
}

const StepCallTranscript: React.FC<StepCallTranscriptProps> = ({ callTranscript, onChange }) => {
  const charCount = callTranscript.length;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
        Paste a call transcript
      </h2>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
        We use this to learn your voice, extract real customer pain points, and create content that
        sounds like you -- not a generic AI. A sales call, coaching session, or discovery call works
        best.
      </p>

      <div className="mb-4">
        <textarea
          value={callTranscript}
          onChange={(e) => onChange(e.target.value)}
          rows={14}
          placeholder={`Paste your call transcript here...\n\nExample:\nHost: So tell me about your biggest challenge right now.\nClient: Honestly, we're spending $10k/month on ads but can't tell which leads are actually qualified...`}
          className="w-full text-sm bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 resize-none"
        />
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            {charCount > 0
              ? `${charCount.toLocaleString()} characters`
              : 'No transcript pasted yet'}
          </p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            Optional -- skip if you don't have one yet
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 p-4">
        <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2">
          What we extract from your transcript:
        </p>
        <ul className="space-y-1.5 text-xs text-gray-500 dark:text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-violet-500 mt-0.5">&#8226;</span>
            <span>Pain points and objections in your clients' own words</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-500 mt-0.5">&#8226;</span>
            <span>Questions your prospects frequently ask</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-500 mt-0.5">&#8226;</span>
            <span>Your natural language patterns and speaking style</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-500 mt-0.5">&#8226;</span>
            <span>Transformation outcomes and success stories</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StepCallTranscript;
