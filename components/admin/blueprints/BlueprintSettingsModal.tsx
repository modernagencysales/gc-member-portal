import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Check, Plus, Trash2, GripVertical, Upload } from 'lucide-react';
import { BlueprintSettings } from '../../../types/blueprint-types';
import {
  getBlueprintSettings,
  updateBlueprintSettings,
  getAllClientLogos,
  createClientLogo,
  updateClientLogo,
  deleteClientLogo,
  uploadClientLogoFile,
  ClientLogo,
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
  spotsRemainingDfy: string;
  blueprintVideoUrl: string;
  callBookedVideoUrl: string;
  thankYouVideoUrl: string;
  foundationsOfferVideoUrl: string;
  engineeringOfferVideoUrl: string;
  senjaWidgetUrl: string;
  maxLogosLanding: string;
  maxLogosBlueprint: string;
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
    spotsRemainingDfy: '',
    blueprintVideoUrl: '',
    callBookedVideoUrl: '',
    thankYouVideoUrl: '',
    foundationsOfferVideoUrl: '',
    engineeringOfferVideoUrl: '',
    senjaWidgetUrl: '',
    maxLogosLanding: '',
    maxLogosBlueprint: '',
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
        spotsRemainingDfy: settings.spotsRemainingDfy?.toString() || '',
        blueprintVideoUrl: settings.blueprintVideoUrl || '',
        callBookedVideoUrl: settings.callBookedVideoUrl || '',
        thankYouVideoUrl: settings.thankYouVideoUrl || '',
        foundationsOfferVideoUrl: settings.foundationsOfferVideoUrl || '',
        engineeringOfferVideoUrl: settings.engineeringOfferVideoUrl || '',
        senjaWidgetUrl: settings.senjaWidgetUrl || '',
        maxLogosLanding: settings.maxLogosLanding?.toString() || '',
        maxLogosBlueprint: settings.maxLogosBlueprint?.toString() || '',
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
      spotsRemainingDfy: formData.spotsRemainingDfy
        ? parseInt(formData.spotsRemainingDfy, 10)
        : undefined,
      blueprintVideoUrl: formData.blueprintVideoUrl || undefined,
      callBookedVideoUrl: formData.callBookedVideoUrl || undefined,
      thankYouVideoUrl: formData.thankYouVideoUrl || undefined,
      foundationsOfferVideoUrl: formData.foundationsOfferVideoUrl || undefined,
      engineeringOfferVideoUrl: formData.engineeringOfferVideoUrl || undefined,
      senjaWidgetUrl: formData.senjaWidgetUrl || undefined,
      maxLogosLanding: formData.maxLogosLanding
        ? parseInt(formData.maxLogosLanding, 10)
        : undefined,
      maxLogosBlueprint: formData.maxLogosBlueprint
        ? parseInt(formData.maxLogosBlueprint, 10)
        : undefined,
    });
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ---- Client Logos ----
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const [newLogoName, setNewLogoName] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [logoSaving, setLogoSaving] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState('');
  const [bulkUploadError, setBulkUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: logosData } = useQuery({
    queryKey: ['clientLogos'],
    queryFn: getAllClientLogos,
    enabled: isOpen,
  });

  useEffect(() => {
    if (logosData) setLogos(logosData);
  }, [logosData]);

  const handleAddLogo = async () => {
    if (!newLogoName.trim() || !newLogoUrl.trim()) return;
    setLogoSaving(true);
    try {
      const created = await createClientLogo({
        name: newLogoName.trim(),
        imageUrl: newLogoUrl.trim(),
        sortOrder: logos.length,
      });
      setLogos((prev) => [...prev, created]);
      setNewLogoName('');
      setNewLogoUrl('');
      queryClient.invalidateQueries({ queryKey: ['clientLogos'] });
    } catch (err) {
      console.error('Failed to add logo:', err);
    } finally {
      setLogoSaving(false);
    }
  };

  const handleDeleteLogo = async (id: string) => {
    try {
      await deleteClientLogo(id);
      setLogos((prev) => prev.filter((l) => l.id !== id));
      queryClient.invalidateQueries({ queryKey: ['clientLogos'] });
    } catch (err) {
      console.error('Failed to delete logo:', err);
    }
  };

  const handleToggleLogoVisibility = async (logo: ClientLogo) => {
    try {
      await updateClientLogo(logo.id, { isVisible: !logo.isVisible });
      setLogos((prev) =>
        prev.map((l) => (l.id === logo.id ? { ...l, isVisible: !l.isVisible } : l))
      );
      queryClient.invalidateQueries({ queryKey: ['clientLogos'] });
    } catch (err) {
      console.error('Failed to toggle logo:', err);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBulkUploading(true);
    setBulkUploadError(null);
    const startCount = logos.length;
    let uploaded = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        setBulkUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        const publicUrl = await uploadClientLogoFile(file);
        const created = await createClientLogo({
          name,
          imageUrl: publicUrl,
          sortOrder: startCount + uploaded,
        });
        setLogos((prev) => [...prev, created]);
        uploaded++;
      }
      queryClient.invalidateQueries({ queryKey: ['clientLogos'] });
    } catch (err) {
      console.error('Bulk upload failed:', err);
      const message = err instanceof Error ? err.message : 'Upload failed';
      setBulkUploadError(`Failed after ${uploaded} of ${files.length}: ${message}`);
    } finally {
      setBulkUploading(false);
      setBulkUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
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

            {/* Embed Settings */}
            <div className="pt-4 border-t border-zinc-800">
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Embed Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Blueprint Video URL
                  </label>
                  <input
                    type="url"
                    value={formData.blueprintVideoUrl}
                    onChange={(e) => handleChange('blueprintVideoUrl', e.target.value)}
                    placeholder="https://www.loom.com/embed/..."
                    className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Loom/YouTube embed URL shown after the scorecard
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Thank You Page Video URL
                  </label>
                  <input
                    type="url"
                    value={formData.thankYouVideoUrl}
                    onChange={(e) => handleChange('thankYouVideoUrl', e.target.value)}
                    placeholder="https://www.loom.com/embed/..."
                    className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Video shown after Blueprint form submission
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Call Booked Video URL
                  </label>
                  <input
                    type="url"
                    value={formData.callBookedVideoUrl}
                    onChange={(e) => handleChange('callBookedVideoUrl', e.target.value)}
                    placeholder="https://www.loom.com/embed/..."
                    className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Video shown on the call-booked thank-you page
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Foundations Offer Video URL
                  </label>
                  <input
                    type="url"
                    value={formData.foundationsOfferVideoUrl}
                    onChange={(e) => handleChange('foundationsOfferVideoUrl', e.target.value)}
                    placeholder="https://www.loom.com/embed/..."
                    className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Video shown on the Foundations offer page
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Engineering Offer Video URL
                  </label>
                  <input
                    type="url"
                    value={formData.engineeringOfferVideoUrl}
                    onChange={(e) => handleChange('engineeringOfferVideoUrl', e.target.value)}
                    placeholder="https://www.loom.com/embed/..."
                    className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Video shown on the Engineering offer page
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Senja Widget URL
                  </label>
                  <input
                    type="url"
                    value={formData.senjaWidgetUrl}
                    onChange={(e) => handleChange('senjaWidgetUrl', e.target.value)}
                    placeholder="https://widget.senja.io/widget/..."
                    className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Senja testimonial wall embed URL</p>
                </div>
              </div>
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
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    DFY Spots Remaining
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.spotsRemainingDfy}
                    onChange={(e) => handleChange('spotsRemainingDfy', e.target.value)}
                    placeholder="10"
                    className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Leave blank to auto-calculate from offer schedule
              </p>
            </div>

            {/* Client Logos */}
            <div className="pt-4 border-t border-zinc-800">
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Client Logos</h4>
              <p className="text-xs text-zinc-500 mb-3">
                Add company logos shown on the blueprint page. Use direct image URLs (PNG/SVG
                preferred).
              </p>

              {/* Logo count controls */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Logos on Opt-In Page
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxLogosLanding}
                    onChange={(e) => handleChange('maxLogosLanding', e.target.value)}
                    placeholder="6"
                    className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Blank = 6</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Logos on Blueprint Page
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxLogosBlueprint}
                    onChange={(e) => handleChange('maxLogosBlueprint', e.target.value)}
                    placeholder="All"
                    className="w-full px-4 py-2.5 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Blank = show all</p>
                </div>
              </div>

              {/* Existing logos */}
              {logos.length > 0 && (
                <div className="space-y-2 mb-4">
                  {logos.map((logo) => (
                    <div
                      key={logo.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                        logo.isVisible
                          ? 'bg-zinc-800/50 border-zinc-700'
                          : 'bg-zinc-800/20 border-zinc-800 opacity-50'
                      }`}
                    >
                      <GripVertical className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                      <img
                        src={logo.imageUrl}
                        alt={logo.name}
                        className="h-6 w-auto max-w-[80px] object-contain flex-shrink-0"
                        onError={(e) => {
                          const img = e.target as unknown as { style: { display: string } };
                          img.style.display = 'none';
                        }}
                      />
                      <span className="text-sm text-zinc-300 truncate flex-1">{logo.name}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleLogoVisibility(logo)}
                        className={`text-xs px-2 py-0.5 rounded ${
                          logo.isVisible
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        {logo.isVisible ? 'Visible' : 'Hidden'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLogo(logo.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new logo */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newLogoName}
                    onChange={(e) => setNewLogoName(e.target.value)}
                    placeholder="Company name"
                    className="px-3 py-2 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <input
                    type="url"
                    value={newLogoUrl}
                    onChange={(e) => setNewLogoUrl(e.target.value)}
                    placeholder="https://logo.clearbit.com/company.com"
                    className="px-3 py-2 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddLogo}
                    disabled={logoSaving || !newLogoName.trim() || !newLogoUrl.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {logoSaving ? 'Adding...' : 'Add Logo'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={bulkUploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {bulkUploading ? bulkUploadProgress : 'Bulk Upload PNGs'}
                  </button>
                </div>
                {bulkUploadError && <p className="text-xs text-red-400 mt-1">{bulkUploadError}</p>}
              </div>
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
