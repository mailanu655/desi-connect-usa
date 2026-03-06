import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubmissionsPage from '@/app/dashboard/submissions/page';

const mockGetUserSubmissions = jest.fn();

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getUserSubmissions: (...args: unknown[]) => mockGetUserSubmissions(...args),
  },
}));

describe('Submissions Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    mockGetUserSubmissions.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 100))
    );

    render(<SubmissionsPage />);

    expect(screen.getByText('Loading submissions...')).toBeInTheDocument();
  });

  it('should render page title', async () => {
    mockGetUserSubmissions.mockResolvedValue({ data: [] });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('My Submissions')).toBeInTheDocument();
    });
  });

  it('should display filter dropdowns', async () => {
    mockGetUserSubmissions.mockResolvedValue({ data: [] });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Content Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });
  });

  it('should fetch submissions on mount', async () => {
    mockGetUserSubmissions.mockResolvedValue({ data: [] });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(mockGetUserSubmissions).toHaveBeenCalledWith({
        content_type: undefined,
        status: undefined,
        page: 1,
        limit: 10,
      });
    });
  });

  it('should display submission list', async () => {
    const submissions = [
      {
        submission_id: '1',
        title: 'Test Business',
        content_type: 'business',
        status: 'approved' as const,
        submitted_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockGetUserSubmissions.mockResolvedValue({ data: submissions });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Business')).toBeInTheDocument();
    });
  });

  it('should display no submissions message when empty', async () => {
    mockGetUserSubmissions.mockResolvedValue({ data: [] });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('No submissions found.')).toBeInTheDocument();
    });
  });

  it('should filter by content type', async () => {
    mockGetUserSubmissions.mockResolvedValue({ data: [] });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Content Type')).toBeInTheDocument();
    });

    const contentTypeSelect = screen.getByLabelText('Content Type') as HTMLSelectElement;
    fireEvent.change(contentTypeSelect, { target: { value: 'business' } });

    await waitFor(() => {
      expect(mockGetUserSubmissions).toHaveBeenCalledWith(
        expect.objectContaining({
          content_type: 'business',
          page: 1,
        })
      );
    });
  });

  it('should filter by status', async () => {
    mockGetUserSubmissions.mockResolvedValue({ data: [] });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('Status') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'approved' } });

    await waitFor(() => {
      expect(mockGetUserSubmissions).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          page: 1,
        })
      );
    });
  });

  it('should display submission status badges', async () => {
    const submissions = [
      {
        submission_id: '1',
        title: 'My Business Listing',
        content_type: 'business',
        status: 'approved' as const,
        submitted_at: '2024-01-01T00:00:00Z',
      },
      {
        submission_id: '2',
        title: 'Community Event',
        content_type: 'event',
        status: 'pending' as const,
        submitted_at: '2024-01-02T00:00:00Z',
      },
      {
        submission_id: '3',
        title: 'Special Deal',
        content_type: 'deal',
        status: 'rejected' as const,
        submitted_at: '2024-01-03T00:00:00Z',
      },
    ];

    mockGetUserSubmissions.mockResolvedValue({ data: submissions });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('My Business Listing')).toBeInTheDocument();
      expect(screen.getByText('Community Event')).toBeInTheDocument();
      expect(screen.getByText('Special Deal')).toBeInTheDocument();
    });
  });

  it('should display pagination buttons', async () => {
    const submissions = Array(10).fill(null).map((_, i) => ({
      submission_id: String(i),
      title: `Submission ${i}`,
      content_type: 'business' as const,
      status: 'approved' as const,
      submitted_at: '2024-01-01T00:00:00Z',
    }));

    mockGetUserSubmissions.mockResolvedValue({ data: submissions });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  it('should disable previous button on first page', async () => {
    const submissions = [{
      submission_id: '1',
      title: 'Test',
      content_type: 'business',
      status: 'approved' as const,
      submitted_at: '2024-01-01T00:00:00Z',
    }];
    mockGetUserSubmissions.mockResolvedValue({ data: submissions });

    render(<SubmissionsPage />);

    await waitFor(() => {
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });
  });

  it('should handle pagination next button click', async () => {
    const submissions = Array(10).fill(null).map((_, i) => ({
      submission_id: String(i),
      title: `Submission ${i}`,
      content_type: 'business' as const,
      status: 'approved' as const,
      submitted_at: '2024-01-01T00:00:00Z',
    }));

    mockGetUserSubmissions.mockResolvedValue({ data: submissions });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(mockGetUserSubmissions).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  it('should display submission date', async () => {
    const submissions = [
      {
        submission_id: '1',
        title: 'Test',
        content_type: 'business',
        status: 'approved' as const,
        submitted_at: '2024-01-15T00:00:00Z',
      },
    ];

    mockGetUserSubmissions.mockResolvedValue({ data: submissions });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
    });
  });

  it('should display rejection reason when present', async () => {
    const submissions = [
      {
        submission_id: '1',
        title: 'Rejected Item',
        content_type: 'business',
        status: 'rejected' as const,
        submitted_at: '2024-01-01T00:00:00Z',
        rejection_reason: 'Incomplete information',
      },
    ];

    mockGetUserSubmissions.mockResolvedValue({ data: submissions });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Rejection Reason/)).toBeInTheDocument();
      expect(screen.getByText('Incomplete information')).toBeInTheDocument();
    });
  });

  it('should not display rejection reason when not present', async () => {
    const submissions = [
      {
        submission_id: '1',
        title: 'Approved Item',
        content_type: 'business',
        status: 'approved' as const,
        submitted_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockGetUserSubmissions.mockResolvedValue({ data: submissions });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Rejection Reason/)).not.toBeInTheDocument();
    });
  });

  it('should display error message on fetch failure', async () => {
    mockGetUserSubmissions.mockRejectedValue(new Error('Fetch failed'));

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load submissions/)).toBeInTheDocument();
    });
  });

  it('should show page number in pagination', async () => {
    const submissions = [{
      submission_id: '1',
      title: 'Test',
      content_type: 'business',
      status: 'approved' as const,
      submitted_at: '2024-01-01T00:00:00Z',
    }];
    mockGetUserSubmissions.mockResolvedValue({ data: submissions });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Page 1')).toBeInTheDocument();
    });
  });

  it('should display content type and date for each submission', async () => {
    const submissions = [
      {
        submission_id: '1',
        title: 'Business Submission',
        content_type: 'business',
        status: 'approved' as const,
        submitted_at: '2024-01-10T00:00:00Z',
      },
    ];

    mockGetUserSubmissions.mockResolvedValue({ data: submissions });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('business')).toBeInTheDocument();
      expect(screen.getByText(/1\/10\/2024/)).toBeInTheDocument();
    });
  });

  it('should have proper title and description', async () => {
    mockGetUserSubmissions.mockResolvedValue({ data: [] });

    render(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Track and manage your community submissions')).toBeInTheDocument();
    });
  });
});
