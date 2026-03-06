import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminPagination from '@/components/admin/AdminPagination';

describe('AdminPagination', () => {
  const onPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <AdminPagination page={1} totalPages={1} onPageChange={onPageChange} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when totalPages is 0', () => {
    const { container } = render(
      <AdminPagination page={1} totalPages={0} onPageChange={onPageChange} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders with data-testid', () => {
    render(<AdminPagination page={1} totalPages={5} onPageChange={onPageChange} />);
    expect(screen.getByTestId('admin-pagination')).toBeInTheDocument();
  });

  it('shows current page and total pages', () => {
    render(<AdminPagination page={3} totalPages={10} onPageChange={onPageChange} />);
    // Page info text shows "Page 3 of 10"
    expect(screen.getByText((content, element) =>
      element?.tagName === 'SPAN' && content === '3' && element.closest('nav > div')?.textContent?.includes('Page')
    )).toBeInTheDocument();
    expect(screen.getByText((content, element) =>
      element?.tagName === 'SPAN' && content === '10' && element.closest('nav > div')?.textContent?.includes('of')
    )).toBeInTheDocument();
  });

  it('renders Previous and Next buttons', () => {
    render(<AdminPagination page={3} totalPages={5} onPageChange={onPageChange} />);
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('disables Previous button on first page', () => {
    render(<AdminPagination page={1} totalPages={5} onPageChange={onPageChange} />);
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(<AdminPagination page={5} totalPages={5} onPageChange={onPageChange} />);
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange when clicking Previous', () => {
    render(<AdminPagination page={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('Previous'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when clicking Next', () => {
    render(<AdminPagination page={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('Next'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange when clicking a page number', () => {
    render(<AdminPagination page={1} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('4'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('renders all pages when totalPages <= 7', () => {
    render(<AdminPagination page={1} totalPages={5} onPageChange={onPageChange} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('renders ellipsis for large page counts', () => {
    render(<AdminPagination page={5} totalPages={20} onPageChange={onPageChange} />);
    const ellipses = screen.getAllByText('…');
    expect(ellipses.length).toBeGreaterThan(0);
  });

  it('highlights current page with active styling', () => {
    render(<AdminPagination page={3} totalPages={5} onPageChange={onPageChange} />);
    // Target the page button specifically (not the info span)
    const activeButton = screen.getByRole('button', { name: '3' });
    expect(activeButton.className).toMatch(/orange-600/);
  });
});
