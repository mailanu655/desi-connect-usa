import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModerationActionModal from '@/components/admin/ModerationActionModal';

describe('ModerationActionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    contentId: 'content-123',
    contentType: 'business',
    availableActions: ['approve', 'reject', 'flag'] as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ModerationActionModal {...defaultProps} isOpen={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders with data-testid when open', () => {
    render(<ModerationActionModal {...defaultProps} />);
    expect(screen.getByTestId('moderation-action-modal')).toBeInTheDocument();
  });

  it('displays the modal title', () => {
    render(<ModerationActionModal {...defaultProps} />);
    expect(screen.getByText('Moderation Action')).toBeInTheDocument();
  });

  it('displays content type and id', () => {
    render(<ModerationActionModal {...defaultProps} />);
    expect(screen.getByText(/business/)).toBeInTheDocument();
    expect(screen.getByText(/content-123/)).toBeInTheDocument();
  });

  it('renders action select with available actions', () => {
    render(<ModerationActionModal {...defaultProps} />);
    const select = screen.getByLabelText('Action');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
    expect(screen.getByText('Flag')).toBeInTheDocument();
  });

  it('renders Cancel and Submit buttons', () => {
    render(<ModerationActionModal {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('disables Submit when no action is selected', () => {
    render(<ModerationActionModal {...defaultProps} />);
    const submitBtn = screen.getByText('Submit');
    expect(submitBtn).toBeDisabled();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<ModerationActionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('enables Submit when approve is selected (no reason required)', () => {
    render(<ModerationActionModal {...defaultProps} />);
    const select = screen.getByLabelText('Action');
    fireEvent.change(select, { target: { value: 'approve' } });
    const submitBtn = screen.getByText('Submit');
    expect(submitBtn).not.toBeDisabled();
  });

  it('shows reason dropdown when reject is selected', () => {
    render(<ModerationActionModal {...defaultProps} />);
    const actionSelect = screen.getByLabelText('Action');
    fireEvent.change(actionSelect, { target: { value: 'reject' } });
    expect(screen.getByLabelText('Reason')).toBeInTheDocument();
  });

  it('shows reason dropdown when flag is selected', () => {
    render(<ModerationActionModal {...defaultProps} />);
    const actionSelect = screen.getByLabelText('Action');
    fireEvent.change(actionSelect, { target: { value: 'flag' } });
    expect(screen.getByLabelText('Reason')).toBeInTheDocument();
  });

  it('does not show reason dropdown when approve is selected', () => {
    render(<ModerationActionModal {...defaultProps} />);
    const actionSelect = screen.getByLabelText('Action');
    fireEvent.change(actionSelect, { target: { value: 'approve' } });
    expect(screen.queryByLabelText('Reason')).not.toBeInTheDocument();
  });

  it('calls onSubmit with action when approve is selected and Submit clicked', () => {
    render(<ModerationActionModal {...defaultProps} />);
    const actionSelect = screen.getByLabelText('Action');
    fireEvent.change(actionSelect, { target: { value: 'approve' } });
    fireEvent.click(screen.getByText('Submit'));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith('approve', undefined, undefined);
  });

  it('renders notes textarea', () => {
    render(<ModerationActionModal {...defaultProps} />);
    expect(screen.getByLabelText(/Notes/)).toBeInTheDocument();
  });

  it('passes notes when provided', () => {
    render(<ModerationActionModal {...defaultProps} />);
    const actionSelect = screen.getByLabelText('Action');
    fireEvent.change(actionSelect, { target: { value: 'approve' } });
    const notesInput = screen.getByLabelText(/Notes/);
    fireEvent.change(notesInput, { target: { value: 'Looks good!' } });
    fireEvent.click(screen.getByText('Submit'));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith('approve', undefined, 'Looks good!');
  });

  it('disables Submit when reject is selected but no reason chosen', () => {
    render(<ModerationActionModal {...defaultProps} />);
    const actionSelect = screen.getByLabelText('Action');
    fireEvent.change(actionSelect, { target: { value: 'reject' } });
    const submitBtn = screen.getByText('Submit');
    expect(submitBtn).toBeDisabled();
  });

  it('enables Submit when reject and reason are both selected', () => {
    render(<ModerationActionModal {...defaultProps} />);
    const actionSelect = screen.getByLabelText('Action');
    fireEvent.change(actionSelect, { target: { value: 'reject' } });
    const reasonSelect = screen.getByLabelText('Reason');
    fireEvent.change(reasonSelect, { target: { value: 'spam' } });
    const submitBtn = screen.getByText('Submit');
    expect(submitBtn).not.toBeDisabled();
  });
});
