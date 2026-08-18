'use client';

import { useState } from 'react';
import { AlertCircle, Trash2, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  entityLabel: string; // "student", "staff member", "parent"
  entityName: string;  // "Test Two"
  description?: string;
  onDelete: () => Promise<void>;
}

export default function DeleteConfirm({ entityLabel, entityName, description, onDelete }: Props) {
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = confirmText.trim().toLowerCase();
  const target = entityName.trim().toLowerCase();
  const isMatch = normalized === target;

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleting(false);
    }
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 lg:p-6">
      <h3 className="font-semibold text-red-900 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />Danger zone
      </h3>
      <p className="text-xs text-red-700 mt-1 mb-3">
        {description || `Deleting removes this ${entityLabel} from lists. Historical records are kept.`}
      </p>
      {!showDelete ? (
        <button type="button" onClick={() => setShowDelete(true)}
          className="px-3 py-1.5 bg-white border border-red-300 text-error rounded-md text-sm font-medium hover:bg-red-100">
          <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />
          Delete {entityLabel}
        </button>
      ) : (
        <div className="bg-white border border-red-300 rounded-lg p-3 space-y-2">
          <label className="text-xs text-gray-700">
            Type <strong className="font-mono bg-gray-100 px-1 rounded">{entityName}</strong> below to confirm.
            <span className="text-gray-500 font-normal"> (case doesn't matter)</span>
          </label>
          <div className="relative">
            <input type="text" value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className={`input text-sm ${
                confirmText && !isMatch ? 'border-red-300 focus:ring-red-500' :
                isMatch ? 'border-emerald-400 focus:ring-emerald-500' : ''
              }`}
              placeholder={entityName} autoFocus />
            {confirmText && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {isMatch
                  ? <CheckCircle2 className="w-4 h-4 text-success" />
                  : <span className="text-[10px] text-error font-semibold">Not matching</span>}
              </div>
            )}
          </div>
          {error && (
            <div className="text-xs text-error flex items-start gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowDelete(false); setConfirmText(''); setError(null); }}
              className="btn-secondary text-sm">Cancel</button>
            <button type="button" onClick={handleDelete}
              disabled={!isMatch || deleting}
              className="px-3 py-1.5 bg-error text-white rounded-md text-sm font-medium disabled:opacity-40 hover:bg-red-600">
              {deleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />Deleting...</> : 'Delete permanently'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
