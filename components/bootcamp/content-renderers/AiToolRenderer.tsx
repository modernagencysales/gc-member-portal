import React from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { ChatInterface } from '../../chat';

interface AiToolRendererProps {
  aiToolSlug: string;
  studentId?: string;
  title?: string;
}

const AiToolRenderer: React.FC<AiToolRendererProps> = ({ aiToolSlug, studentId, title }) => {
  // If we have a studentId, render the full chat interface
  if (studentId) {
    return <ChatInterface toolSlug={aiToolSlug} studentId={studentId} />;
  }

  // If no studentId, show a placeholder/loading state
  return (
    <div className="w-full h-[600px] bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-4 p-8">
      <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
        <Bot size={32} className="text-violet-500" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{title || 'AI Tool'}</h3>
        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading AI Tool...</span>
        </div>
      </div>
    </div>
  );
};

export default AiToolRenderer;
