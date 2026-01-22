import React from 'react';
import { Bot, RotateCcw } from 'lucide-react';
import { AITool } from '../../types/chat-types';

interface ChatHeaderProps {
  tool: AITool;
  onNewChat?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ tool, onNewChat }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
          <Bot size={20} className="text-violet-500" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">{tool.name}</h3>
          {tool.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
              {tool.description}
            </p>
          )}
        </div>
      </div>
      {onNewChat && (
        <button
          onClick={onNewChat}
          className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title="New conversation"
        >
          <RotateCcw size={18} />
        </button>
      )}
    </div>
  );
};

export default ChatHeader;
