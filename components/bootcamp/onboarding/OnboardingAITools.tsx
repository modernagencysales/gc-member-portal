import React from 'react';
import {
  ArrowRight,
  Sparkles,
  ExternalLink,
  Bot,
  Wand2,
  MessageSquare,
  Target,
} from 'lucide-react';

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  url?: string;
  badge?: string;
}

interface OnboardingAIToolsProps {
  tools?: AITool[];
  title?: string;
  subtitle?: string;
  infoTitle?: string;
  infoText?: string;
  onContinue: () => void;
  onBack?: () => void;
}

const DEFAULT_TOOLS: AITool[] = [
  {
    id: 'message-writer',
    name: 'AI Message Writer',
    description: 'Generate personalized LinkedIn connection requests and follow-up messages.',
    icon: <MessageSquare className="w-5 h-5" />,
    badge: 'Popular',
  },
  {
    id: 'profile-analyzer',
    name: 'Profile Analyzer',
    description: 'Analyze LinkedIn profiles to find common ground and talking points.',
    icon: <Target className="w-5 h-5" />,
  },
  {
    id: 'icp-builder',
    name: 'ICP Builder',
    description: 'Define and refine your ideal customer profile with AI assistance.',
    icon: <Bot className="w-5 h-5" />,
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    description: 'Create engaging LinkedIn posts and articles that attract your ideal clients.',
    icon: <Wand2 className="w-5 h-5" />,
    badge: 'New',
  },
];

const DEFAULT_TITLE = 'Your AI-Powered Toolkit';
const DEFAULT_SUBTITLE =
  'As part of your bootcamp access, you have full access to these AI tools to accelerate your LinkedIn outreach.';
const DEFAULT_INFO_TITLE = 'Full Access Included';
const DEFAULT_INFO_TEXT =
  "All AI tools are included with your bootcamp access. You'll learn how to use each one effectively throughout the curriculum.";

const OnboardingAITools: React.FC<OnboardingAIToolsProps> = ({
  tools = DEFAULT_TOOLS,
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  infoTitle = DEFAULT_INFO_TITLE,
  infoText = DEFAULT_INFO_TEXT,
  onContinue,
  onBack,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm font-medium mb-2">
          <Sparkles className="w-4 h-4" />
          <span>AI Tools</span>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">{title}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">{subtitle}</p>
      </div>

      {/* Tools Grid */}
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="group relative p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors"
            >
              {/* Badge */}
              {tool.badge && (
                <div className="absolute top-4 right-4">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      tool.badge === 'New'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                    }`}
                  >
                    {tool.badge}
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-3">
                {tool.icon}
              </div>

              {/* Content */}
              <h3 className="font-medium text-zinc-900 dark:text-white mb-1">{tool.name}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{tool.description}</p>

              {/* Action */}
              {tool.url ? (
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                >
                  Try it now
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-sm text-zinc-400 dark:text-zinc-500">
                  Available in curriculum
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-violet-900 dark:text-violet-200 mb-1">{infoTitle}</h4>
              <p className="text-sm text-violet-700 dark:text-violet-300">{infoText}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 md:p-8 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium rounded-lg transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-lg transition-colors"
          >
            Continue Setup
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingAITools;
