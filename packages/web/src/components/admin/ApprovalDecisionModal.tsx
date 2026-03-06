'use client';

import { useState, useEffect, useRef } from 'react';

export interface ApprovalDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecision: (decision: string, notes: string) => Promise<void>;
  itemTitle: string;
  itemType: string;
  submittedBy: string;
}

/**
 * Modal for approving/rejecting content with reviewer notes.
 */
export default function ApprovalDecisionModal({
  isOpen,
  onClose,
  onDecision,
  itemTitle,
  itemType,
  submittedBy,
}: ApprovalDecisionModalProps) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setSelectedDecision(null);
      // Focus textarea on open
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (decision: string) => {
    try {
      setSubmitting(true);
      setSelectedDecision(decision);
      await onDecision(decision, notes);
      onClose();
    } catch (err) {
      console.error('Decision submission failed:', err);
    } finally {
      setSubmitting(false);
      setSelectedDecision(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
      data-testid="approval-decision-modal"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 id="approval-modal-title" className="text-lg font-semibold text-gray-900">
            Review Request
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            <span className="capitalize">{itemType.replace(/_/g, ' ')}</span>
            {' · '}Submitted by {submittedBy}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Content</p>
            <p className="text-gray-900 mt-1">{itemTitle}</p>
          </div>

          <div>
            <label htmlFor="reviewer-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Reviewer Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="reviewer-notes"
              ref={textareaRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any feedback or reason for your decision..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500 resize-none"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit('changes_requested')}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 disabled:opacity-50"
          >
            {submitting && selectedDecision === 'changes_requested' ? 'Sending...' : 'Request Changes'}
          </button>
          <button
            onClick={() => handleSubmit('reject')}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {submitting && selectedDecision === 'reject' ? 'Rejecting...' : 'Reject'}
          </button>
          <button
            onClick={() => handleSubmit('approve')}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {submitting && selectedDecision === 'approve' ? 'Approving...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}
