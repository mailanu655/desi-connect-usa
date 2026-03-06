'use client';

export interface AuditLogDetailEntry {
  log_id: string;
  admin_name: string;
  action: string;
  resource: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: AuditLogDetailEntry | null;
}

/**
 * Modal showing full details of a single audit log entry.
 */
export default function AuditLogDetailModal({
  isOpen,
  onClose,
  entry,
}: AuditLogDetailModalProps) {
  if (!isOpen || !entry) return null;

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Log ID', value: entry.log_id },
    { label: 'Timestamp', value: new Date(entry.created_at).toLocaleString() },
    { label: 'Admin', value: entry.admin_name },
    { label: 'Action', value: entry.action },
    { label: 'Resource', value: entry.resource.replace(/_/g, ' ') },
    { label: 'Target ID', value: entry.target_id ?? '—' },
    { label: 'IP Address', value: entry.ip_address ?? '—' },
    { label: 'Details', value: entry.details ?? '—' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-detail-title"
      data-testid="audit-log-detail-modal"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 id="audit-detail-title" className="text-lg font-semibold text-gray-900">
            Audit Log Entry
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-4">
              <span className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">{row.label}</span>
              <span className="text-sm text-gray-900 break-all">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
