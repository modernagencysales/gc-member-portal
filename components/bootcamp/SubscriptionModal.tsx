import React, { useState } from 'react';
import { X, Sparkles, MessageSquare, Users, Bot } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { createCheckoutSession } from '../../services/subscription-supabase';
import { logError } from '../../lib/logError';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentEmail: string;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentEmail,
}) => {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await createCheckoutSession(
        studentId,
        studentEmail,
        `${window.location.origin}/bootcamp?subscription=success`,
        `${window.location.origin}/bootcamp?subscription=canceled`
      );

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      logError('SubscriptionModal:createCheckout', error);
      window.alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-md rounded-2xl ${
          isDarkMode ? 'bg-zinc-900' : 'bg-white'
        } shadow-xl`}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div
              className={`p-3 rounded-full ${isDarkMode ? 'bg-violet-900/30' : 'bg-violet-100'}`}
            >
              <Sparkles
                className={`w-6 h-6 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}
              />
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl font-bold mb-2">Your free access has ended</h2>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Continue using AI tools and get ongoing coaching with a membership.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <Bot className={`w-5 h-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
              <span className="text-sm">Full access to all AI tools</span>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare
                className={`w-5 h-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}
              />
              <span className="text-sm">Weekly group coaching calls</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className={`w-5 h-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
              <span className="text-sm">Private community access</span>
            </div>
          </div>

          <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">$300</span>
              <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                /month
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Cancel anytime
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-3 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Subscribe Now'}
            </button>
            <button
              onClick={onClose}
              className={`w-full py-3 rounded-lg text-sm font-medium ${
                isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
              }`}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
