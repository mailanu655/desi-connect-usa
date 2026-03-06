import { render, screen, fireEvent } from '@testing-library/react';
import AuditLogDetailModal, { AuditLogDetailEntry } from '@/components/admin/AuditLogDetailModal';

describe('AuditLogDetailModal', () => {
  const mockOnClose = jest.fn();

  const mockEntry: AuditLogDetailEntry = {
    log_id: 'log-123',
    admin_name: 'John Admin',
    action: 'CREATE',
    resource: 'user_account',
    target_id: 'user-456',
    details: 'Created new user account',
    ip_address: '192.168.1.1',
    created_at: '2025-01-15T10:30:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering conditions', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <AuditLogDetailModal isOpen={false} onClose={mockOnClose} entry={mockEntry} />
      );

      expect(container.innerHTML).toBe('');
    });

    it('renders nothing when entry is null', () => {
      const { container } = render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={null} />
      );

      expect(container.innerHTML).toBe('');
    });

    it('renders modal content when isOpen is true and entry is provided', () => {
      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={mockEntry} />
      );

      expect(screen.getByText('Audit Log Entry')).toBeInTheDocument();
      expect(screen.getByTestId('audit-log-detail-modal')).toBeInTheDocument();
    });
  });

  describe('Entry field display', () => {
    beforeEach(() => {
      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={mockEntry} />
      );
    });

    it('displays all entry fields correctly', () => {
      // Log ID
      expect(screen.getByText('log-123')).toBeInTheDocument();

      // Admin name
      expect(screen.getByText('John Admin')).toBeInTheDocument();

      // Action
      expect(screen.getByText('CREATE')).toBeInTheDocument();

      // Resource (with underscores replaced by spaces)
      expect(screen.getByText('user account')).toBeInTheDocument();

      // Target ID
      expect(screen.getByText('user-456')).toBeInTheDocument();

      // IP Address
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();

      // Details
      expect(screen.getByText('Created new user account')).toBeInTheDocument();
    });

    it('displays timestamp as formatted date string', () => {
      const expectedDate = new Date('2025-01-15T10:30:00Z').toLocaleString();
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    it('displays field labels correctly', () => {
      expect(screen.getByText('Log ID')).toBeInTheDocument();
      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Resource')).toBeInTheDocument();
      expect(screen.getByText('Target ID')).toBeInTheDocument();
      expect(screen.getByText('IP Address')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });
  });

  describe('Optional field handling', () => {
    it('shows "—" for target_id when undefined', () => {
      const entryWithoutTargetId: AuditLogDetailEntry = {
        ...mockEntry,
        target_id: undefined,
      };

      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={entryWithoutTargetId} />
      );

      const targetIdValues = screen.getAllByText('—');
      expect(targetIdValues.length).toBeGreaterThan(0);
    });

    it('shows "—" for ip_address when undefined', () => {
      const entryWithoutIpAddress: AuditLogDetailEntry = {
        ...mockEntry,
        ip_address: undefined,
      };

      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={entryWithoutIpAddress} />
      );

      const ipAddressValues = screen.getAllByText('—');
      expect(ipAddressValues.length).toBeGreaterThan(0);
    });

    it('shows "—" for details when undefined', () => {
      const entryWithoutDetails: AuditLogDetailEntry = {
        ...mockEntry,
        details: undefined,
      };

      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={entryWithoutDetails} />
      );

      const detailsValues = screen.getAllByText('—');
      expect(detailsValues.length).toBeGreaterThan(0);
    });

    it('shows "—" for all optional fields when they are all undefined', () => {
      const entryWithoutOptionals: AuditLogDetailEntry = {
        log_id: 'log-789',
        admin_name: 'Jane Admin',
        action: 'UPDATE',
        resource: 'configuration',
        created_at: '2025-01-16T14:00:00Z',
      };

      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={entryWithoutOptionals} />
      );

      const dashValues = screen.getAllByText('—');
      expect(dashValues.length).toBe(3); // target_id, ip_address, and details
    });
  });

  describe('Resource field formatting', () => {
    it('replaces underscores with spaces in resource display', () => {
      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={mockEntry} />
      );

      // mockEntry has resource: 'user_account', should display as 'user account'
      expect(screen.getByText('user account')).toBeInTheDocument();
      expect(screen.queryByText('user_account')).not.toBeInTheDocument();
    });

    it('handles multiple underscores in resource name', () => {
      const entryWithMultipleUnderscores: AuditLogDetailEntry = {
        ...mockEntry,
        resource: 'admin_audit_log_entry',
      };

      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={entryWithMultipleUnderscores} />
      );

      expect(screen.getByText('admin audit log entry')).toBeInTheDocument();
    });
  });

  describe('Close functionality', () => {
    it('calls onClose when Close text button is clicked', () => {
      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={mockEntry} />
      );

      const closeButtons = screen.getAllByRole('button', { name: 'Close' });
      // Click the text Close button (last one)
      fireEvent.click(closeButtons[closeButtons.length - 1]);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={mockEntry} />
      );

      const backdrop = screen.getByTestId('audit-log-detail-modal');
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when modal content is clicked', () => {
      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={mockEntry} />
      );

      const modalTitle = screen.getByText('Audit Log Entry');
      fireEvent.click(modalTitle);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onClose when close icon button is clicked', () => {
      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={mockEntry} />
      );

      const closeButtons = screen.getAllByRole('button', { name: 'Close' });
      // Click the icon close button (first one)
      fireEvent.click(closeButtons[0]);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility attributes', () => {
    beforeEach(() => {
      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={mockEntry} />
      );
    });

    it('has role="dialog" attribute', () => {
      const modal = screen.getByTestId('audit-log-detail-modal');
      expect(modal).toHaveAttribute('role', 'dialog');
    });

    it('has aria-modal="true" attribute', () => {
      const modal = screen.getByTestId('audit-log-detail-modal');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      const modal = screen.getByTestId('audit-log-detail-modal');
      expect(modal).toHaveAttribute('aria-labelledby', 'audit-detail-title');
    });

    it('has title element with matching id', () => {
      const title = screen.getByText('Audit Log Entry');
      expect(title).toHaveAttribute('id', 'audit-detail-title');
    });

    it('has data-testid="audit-log-detail-modal"', () => {
      const modal = screen.getByTestId('audit-log-detail-modal');
      expect(modal).toBeInTheDocument();
    });

    it('close icon button has aria-label', () => {
      const closeButtons = screen.getAllByRole('button', { name: 'Close' });
      expect(closeButtons[0]).toHaveAttribute('aria-label', 'Close');
    });
  });

  describe('Edge cases', () => {
    it('handles empty string values correctly', () => {
      const entryWithEmptyStrings: AuditLogDetailEntry = {
        log_id: '',
        admin_name: '',
        action: '',
        resource: '',
        target_id: '',
        details: '',
        ip_address: '',
        created_at: '2025-01-15T10:30:00Z',
      };

      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={entryWithEmptyStrings} />
      );

      expect(screen.getByTestId('audit-log-detail-modal')).toBeInTheDocument();
    });

    it('handles special characters in entry fields', () => {
      const entryWithSpecialChars: AuditLogDetailEntry = {
        ...mockEntry,
        admin_name: 'John <Admin> & Co.',
        details: 'Special: "quotes" and & symbols',
        resource: 'special_resource_test',
      };

      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={entryWithSpecialChars} />
      );

      expect(screen.getByText('John <Admin> & Co.')).toBeInTheDocument();
      expect(screen.getByText('Special: "quotes" and & symbols')).toBeInTheDocument();
      expect(screen.getByText('special resource test')).toBeInTheDocument();
    });

    it('handles very long field values', () => {
      const longValue = 'a'.repeat(500);
      const entryWithLongValues: AuditLogDetailEntry = {
        ...mockEntry,
        details: longValue,
      };

      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={entryWithLongValues} />
      );

      expect(screen.getByText(longValue)).toBeInTheDocument();
    });
  });

  describe('Modal structure', () => {
    beforeEach(() => {
      render(
        <AuditLogDetailModal isOpen={true} onClose={mockOnClose} entry={mockEntry} />
      );
    });

    it('displays modal with correct title', () => {
      expect(screen.getByText('Audit Log Entry')).toBeInTheDocument();
    });

    it('displays Close button in footer', () => {
      const closeButtons = screen.getAllByRole('button', { name: 'Close' });
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders all field rows', () => {
      const fieldLabels = [
        'Log ID',
        'Timestamp',
        'Admin',
        'Action',
        'Resource',
        'Target ID',
        'IP Address',
        'Details',
      ];

      fieldLabels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });
});
