import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { createIntroOffer } from '../../../services/intro-offer-supabase';

interface NewOfferModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const NewOfferModal: React.FC<NewOfferModalProps> = ({ onClose, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    amount_paid: '',
    discount_code: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name.trim()) {
      setError('Client name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createIntroOffer({
        client_name: form.client_name.trim(),
        client_email: form.client_email.trim() || undefined,
        amount_paid: form.amount_paid ? parseInt(form.amount_paid, 10) : undefined,
        discount_code: form.discount_code.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border ${
    isDarkMode
      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`;

  const labelClass = `block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`relative w-full max-w-md mx-4 rounded-xl shadow-xl ${
          isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            New Intro Offer
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${
              isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              placeholder="Jane Doe"
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={form.client_email}
              onChange={(e) => setForm({ ...form, client_email: e.target.value })}
              placeholder="jane@company.com"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Amount Paid ($)</label>
              <input
                type="number"
                value={form.amount_paid}
                onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
                placeholder="2500"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Discount Code</label>
              <input
                type="text"
                value={form.discount_code}
                onChange={(e) => setForm({ ...form, discount_code: e.target.value })}
                placeholder="LAUNCH50"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Referral from X, paid via invoice, etc."
              rows={3}
              className={inputClass}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewOfferModal;
