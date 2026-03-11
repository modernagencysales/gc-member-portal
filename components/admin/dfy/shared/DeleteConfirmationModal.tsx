/** DeleteConfirmationModal. Confirmation dialog for permanently deleting an engagement. */
import { Loader2, Trash2 } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';

// ─── Types ─────────────────────────────────────────────
export interface DeleteConfirmationModalProps {
  clientName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// ─── Component ─────────────────────────────────────────
export default function DeleteConfirmationModal({
  clientName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`rounded-xl p-6 max-w-md w-full mx-4 shadow-xl ${
          isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'
        }`}
      >
        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Delete Engagement
        </h3>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Are you sure you want to permanently delete the engagement for{' '}
          <strong>{clientName}</strong>? This will remove all deliverables, automation runs,
          activity logs, and archive the Linear project. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
