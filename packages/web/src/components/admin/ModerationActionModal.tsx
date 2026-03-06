'use client';

import { useState } from 'react';
import type { ModerationAction, ModerationReason } from '@desi-connect/shared';

export interface ModerationActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (action: ModerationAction, reason?: ModerationReason, notes?: string) => void;
  contentId: string;
  contentType: string;
  availableActions: ModerationAction[];
}

const ACTION_LABELS: Record<string, string> = {
  approve: 'Approve',
  reject: 'Reject',
  flag: 'Flag',
  unflag: 'Unflag',
  request_changes: 'Request Changes',
  escalate: 'Escalate',
  archive: 'Archive',
  restore: 'Restore',
};

const REASON_OPTIONS: { value: ModerationReason; label: string }[] = [
  { value: 'spam' as ModerationReason, label: 'Spam' },
  { value: 'inappropriate' as ModerationReason, label: 'Inappropriate Content' },
  { value: 'misinformation' as ModerationReason, label: 'Misinformation' },
  { value: 'harassment' as ModerationReason, label: 'Harassment' },
  { value: 'copyright' as ModerationReason, label: 'Copyright Violation' },
  { value: 'duplicate' as ModerationReason, label: 'Duplicate' },
  { value: 'low_quality' as ModerationReason, label: 'Low Quality' },
  { value: 'other' as ModerationReason, label: 'Other' },
];

const ACTIONS_REQUIRING_REASON = ['reject', 'flag', 'request_changes', 'escalate'];

export default function ModerationActionModal({
  isOpen,
  onClose,
  onSubmit,
  contentId,
  contentType,
  availableActions,
}: ModerationActionModalProps) {
  const [selectedAction, setSelectedAction] = useState<ModerationAction | ''>('');
  const [selectedReason, setSelectedReason] = useState<ModerationReason | ''>('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const needsReason = selectedAction && ACTIONS_REQUIRING_REASON.includes(selectedAction);

  const handleSubmit = () => {
    if (!selectedAction) return;
    onSubmit(
      selectedAction,
      needsReason && selectedReason ? selectedReason : undefined,
      notes || undefined,
    );
    setSelectedAction('');
    setSelectedReason('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" data-testid="moderation-action-modal">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Moderation Action</h3>
        <p className="text-sm text-gray-500 mb-4">
          {contentType} — {contentId}
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="mod-action" className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              id="mod-action"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value as ModerationAction)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Select an action...</option>
              {availableActions.map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABELS[a] ?? a}
                </option>
              ))}
            </select>
          </div>

          {needsReason && (
            <div>
              <label htmlFor="mod-reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <select
                id="mod-reason"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value as ModerationReason)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select a reason...</option>
                {REASON_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="mod-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="mod-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
              placeholder="Add any additional notes..."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedAction || (needsReason && !selectedReason)}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
