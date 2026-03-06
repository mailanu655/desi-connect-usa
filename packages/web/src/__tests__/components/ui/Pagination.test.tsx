import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '@/components/ui/Pagination';

describe('Pagination', () => {
  it('renders page numbers correctly', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
  });

  it('highlights current page', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    const page2Button = screen.getByRole('button', { name: '2' });
    expect(page2Button).toHaveClass('bg-saffron-500');
  });

  it('does not highlight non-current pages', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    const page1Button = screen.getByRole('button', { name: '1' });
    const page3Button = screen.getByRole('button', { name: '3' });

    expect(page1Button).not.toHaveClass('bg-saffron-500');
    expect(page3Button).not.toHaveClass('bg-saffron-500');
  });

  it('calls onPageChange when clicking a page number', async () => {
    const onPageChange = jest.fn();
    const user = userEvent.setup();
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);

    const page3Button = screen.getByRole('button', { name: '3' });
    await user.click(page3Button);

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('shows Previous button', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    const previousButton = screen.getByRole('button', { name: /Previous/i });
    expect(previousButton).toBeInTheDocument();
  });

  it('Previous button is disabled on first page', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);

    const previousButton = screen.getByRole('button', { name: /Previous/i });
    expect(previousButton).toBeDisabled();
  });

  it('Previous button is enabled on non-first page', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    const previousButton = screen.getByRole('button', { name: /Previous/i });
    expect(previousButton).not.toBeDisabled();
  });

  it('calls onPageChange with previous page when clicking Previous', async () => {
    const onPageChange = jest.fn();
    const user = userEvent.setup();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    const previousButton = screen.getByRole('button', { name: /Previous/i });
    await user.click(previousButton);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('shows Next button', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).toBeInTheDocument();
  });

  it('Next button is disabled on last page', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={5} totalPages={5} onPageChange={onPageChange} />);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).toBeDisabled();
  });

  it('Next button is enabled on non-last page', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).not.toBeDisabled();
  });

  it('calls onPageChange with next page when clicking Next', async () => {
    const onPageChange = jest.fn();
    const user = userEvent.setup();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('shows ellipsis for large page counts', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={1} totalPages={20} onPageChange={onPageChange} />);

    const ellipsisElements = screen.getAllByRole('button', { name: '...' });
    expect(ellipsisElements.length).toBeGreaterThan(0);
  });

  it('ellipsis button is disabled', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={1} totalPages={20} onPageChange={onPageChange} />);

    const ellipsisElements = screen.getAllByRole('button', { name: '...' });
    ellipsisElements.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  it('handles single page (no pagination needed)', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={1} totalPages={1} onPageChange={onPageChange} />);

    const page1Button = screen.getByRole('button', { name: '1' });
    expect(page1Button).toBeInTheDocument();
    expect(page1Button).toHaveClass('bg-saffron-500');

    // Only page 1 should be shown
    const pageButtons = screen.getAllByRole('button').filter(btn => {
      const text = btn.textContent?.trim();
      return /^[0-9]$/.test(text || '');
    });
    expect(pageButtons).toHaveLength(1);
  });

  it('handles edge case: totalPages = 0', () => {
    const onPageChange = jest.fn();
    const { container } = render(<Pagination page={0} totalPages={0} onPageChange={onPageChange} />);

    // Should render without crashing
    expect(container).toBeInTheDocument();
  });

  it('Previous button does not call onPageChange when disabled', async () => {
    const onPageChange = jest.fn();
    const user = userEvent.setup();
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);

    const previousButton = screen.getByRole('button', { name: /Previous/i });
    // Disabled button click won't trigger handler in userEvent
    await user.click(previousButton);

    // The onClick handler won't fire on disabled buttons
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('Next button does not call onPageChange when disabled', async () => {
    const onPageChange = jest.fn();
    const user = userEvent.setup();
    render(<Pagination page={5} totalPages={5} onPageChange={onPageChange} />);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    // Disabled button click won't trigger handler in userEvent
    await user.click(nextButton);

    // The onClick handler won't fire on disabled buttons
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('renders all pages when totalPages <= 5', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  it('shows first and last page with ellipsis when on middle pages', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={10} totalPages={20} onPageChange={onPageChange} />);

    // Should show first page
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    // Should show last page
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument();
    // Should show ellipsis
    const ellipsisElements = screen.getAllByRole('button', { name: '...' });
    expect(ellipsisElements.length).toBeGreaterThan(0);
  });

  it('correctly highlights current page when navigating', () => {
    const onPageChange = jest.fn();
    const { rerender } = render(
      <Pagination page={1} totalPages={5} onPageChange={onPageChange} />
    );

    const page1Initial = screen.getByRole('button', { name: '1' });
    expect(page1Initial).toHaveClass('bg-saffron-500');

    rerender(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    const page3New = screen.getByRole('button', { name: '3' });
    expect(page3New).toHaveClass('bg-saffron-500');
  });
});
