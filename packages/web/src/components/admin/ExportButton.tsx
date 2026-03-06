'use client';

import { useState, useCallback } from 'react';

export interface ExportButtonProps {
  /** Function that returns data rows as arrays of strings */
  getData: () => Promise<string[][]> | string[][];
  /** Column headers */
  headers: string[];
  /** Filename without extension */
  filename?: string;
  /** Button label */
  label?: string;
  className?: string;
}

/**
 * CSV export button — generates and downloads a CSV file.
 */
export default function ExportButton({
  getData,
  headers,
  filename = 'export',
  label = 'Export CSV',
  className,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const rows = await getData();

      // Build CSV with proper escaping
      const escape = (val: string) => {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const csvLines = [
        headers.map(escape).join(','),
        ...rows.map((row) => row.map(escape).join(',')),
      ];
      const csv = csvLines.join('\n');

      // Create blob & download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [getData, headers, filename]);

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={
        className ??
        'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
      }
      data-testid="export-button"
    >
      {exporting ? (
        <>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-r-transparent" />
          Exporting...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
