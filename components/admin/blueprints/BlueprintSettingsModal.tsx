import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Check } from 'lucide-react';
import { BlueprintSettings } from '../../../types/blueprint-types';
import {
  getBlueprintSettings,
  updateBlueprintSettings,
} from '../../../services/blueprint-supabase';
import { queryKeys } from '../../../lib/queryClient';

interface BlueprintSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  stickyCTAEnabled: boolean;
  foundationsPaymentUrl: string;
  engineeringPaymentUrl: string;
  calBookingLink: string;
  nextCohortDateFoundations: string;
  nextCohortDateEngineering: string;
  spotsRemainingFoundations: string;
  spotsRemainingEngineering: string;
}

const BlueprintSettingsModal: React.FC<BlueprintSettingsModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>({
    stickyCTAEnabled: true,
    foundationsPaymentUrl: '',
    engineeringPaymentUrl: '',
    calBookingLink: '',
    nextCohortDateFoundations: '',
    nextCohortDateEngineering: '',
    spotsRemainingFoundations: '',
    spotsRemainingEngineering: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch existing settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: queryKeys.blueprintSettings(),
    queryFn: getBlueprintSettings,
    enabled: isOpen,
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        stickyCTAEnabled: settings.stickyCTAEnabled ?? true,
        foundationsPaymentUrl: settings.foundationsPaymentUrl || '',
        engineeringPaymentUrl: settings.engineeringPaymentUrl || '',
        calBookingLink: settings.calBookingLink || '',
        nextCohortDateFoundations: settings.nextCohortDateFoundations || '',
        nextCohortDateEngineering: settings.nextCohortDateEngineering || '',
        spotsRemainingFoundations: settings.spotsRemainingFoundations?.toString() || '',
        spotsRemainingEngineering: settings.spotsRemainingEngineering?.toString() || '',
      });
    }
  }, [settings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: Partial<BlueprintSettings>) => updateBlueprintSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprintSettings() });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    },
    onError: (error) => {
      console.error('Failed to save settings:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMutation.mutateAsync({
      stickyCTAEnabled: formData.stickyCTAEnabled,
      foundationsPaymentUrl: formData.foundationsPaymentUrl,
      engineeringPaymentUrl: formData.engineeringPaymentUrl,
      calBookingLink: formData.calBookingLink,
      nextCohortDateFoundations: formData.nextCohortDateFoundations || undefined,
      nextCohortDateEngineering: formData.nextCohortDateEngineering || undefined,
      spotsRemainingFoundations: formData.spotsRemainingFoundations
        ? parseInt(formData.spotsRemainingFoundations, 10)
        : undefined,
      spotsRemainingEngineering: formData.spotsRemainingEngineering
        ? parseInt(formData.spotsRemainingEngineering, 10)
        : undefined,
    });
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">Blueprint Settings</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoadingSettings ? (
          <div className="p-6 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-zinc-600 border-t-violet-500 rounded-full animate-spin" />
            <span className="ml-3 text-zinc-400">Loading settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Sticky CTA Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-zinc-200">Sticky CTA</label>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Show floating CTA button on blueprint pages
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('stickyCTAEnabled', !formData.stickyCTAEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                  formData.stickyCTAEnabled ? 'bg-violet-600' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.stickyCTAEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Foundations Payment URL */}
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                Foundations Payment URL
              </label>
              <input
                type="url"
                value={formData.foundationsPaymentUrl}
                onChange={(e) => handleChange('foundationsPaymentUrl', e.target.value)}
                placeholder="https://stripe.com/pay/..."
                className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <p className="text-xs text-zinc-500 mt-1">Payment link for the Foundations offer</p>
            </div>

            {/* Engineering Payment URL */}
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                Engineering Payment URL
              </label>
              <input
                type="url"
                value={formData.engineeringPaymentUrl}
                onChange={(e) => handleChange('engineeringPaymentUrl', e.target.value)}
                placeholder="https://stripe.com/pay/..."
                className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <p className="text-xs text-zinc-500 mt-1">Payment link for the Engineering offer</p>
            </div>

            {/* Cal.com Booking Link */}
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                Cal.com Booking Link
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 bg-zinc-800/50 border-zinc-700 text-zinc-400 text-sm">
                  cal.com/
                </span>
                <input
                  type="text"
                  value={formData.calBookingLink}
                  onChange={(e) => handleChange('calBookingLink', e.target.value)}
                  placeholder="timkeen/30min"
                  className="flex-1 px-4 py-2.5 rounded-r-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Your Cal.com booking path (e.g., timkeen/30min)
              </p>
            </div>

            {/* Cohort Settings */}
            <div className="pt-4 border-t border-zinc-800">
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Cohort Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Foundations Next Cohort
                  </label>
                  <input
                    type="date"
                    value={formData.nextCohortDateFoundations}
                    onChange={(e) => handleChange('nextCohortDateFoundations', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Foundations Spots
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.spotsRemainingFoundations}
                    onChange={(e) => handleChange('spotsRemainingFoundations', e.target.value)}
                    placeholder="30"
                    className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Engineering Next Cohort
                  </label>
                  <input
                    type="date"
                    value={formData.nextCohortDateEngineering}
                    onChange={(e) => handleChange('nextCohortDateEngineering', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Engineering Spots
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.spotsRemainingEngineering}
                    onChange={(e) => handleChange('spotsRemainingEngineering', e.target.value)}
                    placeholder="15"
                    className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Leave blank to auto-calculate from offer schedule
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {saveMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : showSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BlueprintSettingsModal;
