import React, { useState } from 'react';
import { X, Loader2, Gift } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface RedeemCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onSuccess: () => void;
}

const RedeemCodeModal: React.FC<RedeemCodeModalProps> = ({
  isOpen,
  onClose,
  studentId,
  onSuccess,
}) => {
  const { isDarkMode } = useTheme();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleRedeem = async () => {
    if (!code.trim()) {
      setError('Please enter a code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { redeemCode } = await import('../../services/bootcamp-supabase');
      await redeemCode(studentId, code.trim());
      setSuccess(true);
      onSuccess();
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCode('');
      }, 1500);
    } catch (_err) {
      setError('Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className={`w-full max-w-md rounded-xl border p-6 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Redeem Code</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-zinc-500 mb-4">
          Enter your access code to unlock additional tools or content.
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          className={`w-full px-3 py-2 rounded-lg border text-sm ${
            isDarkMode
              ? 'bg-zinc-800 border-zinc-700 focus:ring-violet-500'
              : 'bg-zinc-50 border-zinc-300 focus:ring-violet-500'
          } focus:outline-none focus:ring-2`}
          onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
        />

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        {success && <p className="text-xs text-green-500 mt-2">Code redeemed successfully!</p>}

        <button
          onClick={handleRedeem}
          disabled={loading || success}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
        </button>
      </div>
    </div>
  );
};

export default RedeemCodeModal;
