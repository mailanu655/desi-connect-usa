import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApprovalDecisionModal from '@/components/admin/ApprovalDecisionModal';

describe('ApprovalDecisionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnDecision = jest.fn();

  const defaultProps = {
    isOpen: false,
    onClose: mockOnClose,
    onDecision: mockOnDecision,
    itemTitle: 'Test Item Title',
    itemType: 'business_listing',
    submittedBy: 'john@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnDecision.mockResolvedValue(undefined);
  });

  // Test 1: Renders nothing when isOpen is false
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ApprovalDecisionModal {...defaultProps} isOpen={false} />
    );
    expect(screen.queryByTestId('approval-decision-modal')).not.toBeInTheDocument();
    expect(container.innerHTML).toBe('');
  });

  // Test 2: Renders modal content when isOpen is true
  it('renders modal content when isOpen is true', () => {
    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);
    expect(screen.getByTestId('approval-decision-modal')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // Test 3: Displays item title, type, and submittedBy
  it('displays item title, type, and submittedBy', () => {
    render(
      <ApprovalDecisionModal
        {...defaultProps}
        isOpen={true}
        itemTitle="My Business"
        itemType="business_listing"
        submittedBy="jane@example.com"
      />
    );

    expect(screen.getByText('My Business')).toBeInTheDocument();
    expect(screen.getByText(/business listing/i)).toBeInTheDocument();
    expect(screen.getByText(/Submitted by jane@example.com/i)).toBeInTheDocument();
  });

  // Test 4: Has a textarea for reviewer notes
  it('has a textarea for reviewer notes', () => {
    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);
    const textarea = screen.getByRole('textbox', { name: /reviewer notes/i });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', 'Add any feedback or reason for your decision...');
  });

  // Test 5: Shows Approve, Reject, and Request Changes buttons
  it('shows Approve, Reject, and Request Changes buttons', () => {
    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request changes/i })).toBeInTheDocument();
  });

  // Test 6: Calls onDecision with 'approve' and notes when Approve clicked
  it('calls onDecision with "approve" and notes when Approve clicked', async () => {
    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const textarea = screen.getByRole('textbox', { name: /reviewer notes/i });
    const approveButton = screen.getByRole('button', { name: /approve/i });

    await userEvent.type(textarea, 'Looks good to me');
    await userEvent.click(approveButton);

    await waitFor(() => {
      expect(mockOnDecision).toHaveBeenCalledWith('approve', 'Looks good to me');
    });
  });

  // Test 7: Calls onDecision with 'reject' and notes when Reject clicked
  it('calls onDecision with "reject" and notes when Reject clicked', async () => {
    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const textarea = screen.getByRole('textbox', { name: /reviewer notes/i });
    const rejectButton = screen.getByRole('button', { name: /reject/i });

    await userEvent.type(textarea, 'Missing required information');
    await userEvent.click(rejectButton);

    await waitFor(() => {
      expect(mockOnDecision).toHaveBeenCalledWith('reject', 'Missing required information');
    });
  });

  // Test 8: Calls onDecision with 'changes_requested' and notes when Request Changes clicked
  it('calls onDecision with "changes_requested" and notes when Request Changes clicked', async () => {
    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const textarea = screen.getByRole('textbox', { name: /reviewer notes/i });
    const changesButton = screen.getByRole('button', { name: /request changes/i });

    await userEvent.type(textarea, 'Please update the description');
    await userEvent.click(changesButton);

    await waitFor(() => {
      expect(mockOnDecision).toHaveBeenCalledWith('changes_requested', 'Please update the description');
    });
  });

  // Test 9: Shows loading state on the clicked button while submitting
  it('shows loading state on the clicked button while submitting', async () => {
    let resolvePromise: () => void;
    mockOnDecision.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const approveButton = screen.getByRole('button', { name: /approve/i });

    // Use fireEvent (not userEvent) so we can check intermediate state
    await act(async () => {
      fireEvent.click(approveButton);
    });

    // Check loading state while promise is pending
    expect(screen.getByRole('button', { name: /approving\.\.\./i })).toBeInTheDocument();

    // Resolve the promise and wait for completion
    await act(async () => {
      resolvePromise!();
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // Test 10: Calls onClose when Cancel clicked
  it('calls onClose when Cancel clicked', async () => {
    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  // Test 11: Calls onClose when backdrop clicked
  it('calls onClose when backdrop clicked', async () => {
    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const modal = screen.getByTestId('approval-decision-modal');
    fireEvent.click(modal);

    expect(mockOnClose).toHaveBeenCalled();
  });

  // Test 12: Clears notes when reopened (re-renders with isOpen toggled)
  it('clears notes when reopened (re-renders with isOpen toggled)', async () => {
    const { rerender } = render(
      <ApprovalDecisionModal {...defaultProps} isOpen={true} />
    );

    const textarea = screen.getByRole('textbox', { name: /reviewer notes/i });
    await userEvent.type(textarea, 'Some notes');

    expect(textarea).toHaveValue('Some notes');

    // Close modal
    rerender(<ApprovalDecisionModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('approval-decision-modal')).not.toBeInTheDocument();

    // Reopen modal
    rerender(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const newTextarea = screen.getByRole('textbox', { name: /reviewer notes/i });
    expect(newTextarea).toHaveValue('');
  });

  // Additional test: Verify buttons are disabled during submission
  it('disables all buttons during submission', async () => {
    let resolvePromise: () => void;
    mockOnDecision.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const approveButton = screen.getByRole('button', { name: /approve/i });

    await act(async () => {
      fireEvent.click(approveButton);
    });

    // Check disabled state while promise is pending
    expect(approveButton).toBeDisabled();
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();

    // Clean up
    await act(async () => {
      resolvePromise!();
    });
  });

  // Additional test: Verify textarea is disabled during submission
  it('disables textarea during submission', async () => {
    let resolvePromise: () => void;
    mockOnDecision.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const textarea = screen.getByRole('textbox', { name: /reviewer notes/i });
    const approveButton = screen.getByRole('button', { name: /approve/i });

    expect(textarea).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(approveButton);
    });

    // Check disabled state while promise is pending
    expect(textarea).toBeDisabled();

    // Clean up
    await act(async () => {
      resolvePromise!();
    });
  });

  // Additional test: Verify close is called after successful decision
  it('calls onClose after successful decision submission', async () => {
    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const approveButton = screen.getByRole('button', { name: /approve/i });
    await userEvent.click(approveButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // Additional test: Verify empty notes submission
  it('allows submission with empty notes', async () => {
    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    await userEvent.click(rejectButton);

    await waitFor(() => {
      expect(mockOnDecision).toHaveBeenCalledWith('reject', '');
    });
  });

  // Additional test: Verify itemType formatting with underscores
  it('formats itemType by replacing underscores with spaces', () => {
    render(
      <ApprovalDecisionModal
        {...defaultProps}
        isOpen={true}
        itemType="business_listing_request"
      />
    );

    expect(screen.getByText(/business listing request/i)).toBeInTheDocument();
  });

  // Additional test: Verify modal has correct accessibility attributes
  it('has correct accessibility attributes', () => {
    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'approval-modal-title');

    const title = screen.getByText('Review Request');
    expect(title).toHaveAttribute('id', 'approval-modal-title');
  });

  // Additional test: Content modal doesn't close on inner click
  it('does not close modal when clicking on modal content', async () => {
    render(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const modalContent = screen.getByText('Test Item Title').closest('div');
    if (modalContent) {
      fireEvent.click(modalContent);
    }

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // Additional test: Verify all decision options work with notes
  it('submits correct decision type for each button', async () => {
    const { rerender } = render(
      <ApprovalDecisionModal {...defaultProps} isOpen={true} />
    );

    const changesButton = screen.getByRole('button', { name: /request changes/i });
    await userEvent.click(changesButton);

    await waitFor(() => {
      expect(mockOnDecision).toHaveBeenLastCalledWith('changes_requested', '');
    });

    jest.clearAllMocks();

    rerender(<ApprovalDecisionModal {...defaultProps} isOpen={true} />);

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    await userEvent.click(rejectButton);

    await waitFor(() => {
      expect(mockOnDecision).toHaveBeenLastCalledWith('reject', '');
    });
  });
});
