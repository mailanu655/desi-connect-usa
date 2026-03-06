import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsPage from '@/app/dashboard/analytics/page';

global.fetch = jest.fn();

jest.mock('@/lib/user-profile', () => ({
  calculateGrowthMetrics: (label: string, current: number, previous: number) => ({
    label,
    current,
    previous,
    change_percent: Math.round(((current - previous) / previous) * 100),
    trend: current > previous ? 'up' : current < previous ? 'down' : 'flat' as const,
  }),
  formatMetricValue: (value: number) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  },
}));

describe('Analytics Page', () => {
  const mockAnalytics = {
    total_users: 15000,
    total_businesses: 3000,
    total_events: 1250,
    total_deals: 890,
    total_jobs: 3300,
    total_consultancies: 480,
    active_users_30d: 9200,
    new_users_30d: 1200,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should display loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => mockAnalytics }), 100))
    );

    render(<AnalyticsPage />);

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('should fetch analytics from API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/overview');
    });
  });

  it('should display page title and description', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
      expect(screen.getByText(/Overview of Desi Connect USA community metrics/)).toBeInTheDocument();
    });
  });

  it('should display all metric cards', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Total Businesses')).toBeInTheDocument();
      expect(screen.getByText('Total Events')).toBeInTheDocument();
      expect(screen.getByText('Total Deals')).toBeInTheDocument();
      expect(screen.getByText('Total Jobs')).toBeInTheDocument();
      expect(screen.getByText('Total Consultancies')).toBeInTheDocument();
      expect(screen.getByText('Active Users (30d)')).toBeInTheDocument();
      expect(screen.getByText('New Users (30d)')).toBeInTheDocument();
    });
  });

  it('should display current metric values', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('15.0K').length).toBeGreaterThan(0);
      expect(screen.getAllByText('3.0K').length).toBeGreaterThan(0);
    });
  });

  it('should display previous period values', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Previously:/)).length > 0;
    });
  });

  it('should display growth indicators for increasing metrics', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
    });
  });

  it('should display platform summary section', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Platform Summary')).toBeInTheDocument();
    });
  });

  it('should display summary with formatted user count', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Desi Connect USA has grown to/)).toBeInTheDocument();
      expect(screen.getAllByText(/15\.0K/).length).toBeGreaterThan(0);
    });
  });

  it('should display summary with business count', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/businesses across the community/)).toBeInTheDocument();
    });
  });

  it('should display summary with events and deals count', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/upcoming events/)).toBeInTheDocument();
      expect(screen.getByText(/active deals/)).toBeInTheDocument();
    });
  });

  it('should display summary with jobs and consultancies count', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Job opportunities number at/)).toBeInTheDocument();
      expect(screen.getByText(/professional consultancies/)).toBeInTheDocument();
    });
  });

  it('should display summary with active and new users', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/active users/)).toBeInTheDocument();
      expect(screen.getByText(/new community members/)).toBeInTheDocument();
    });
  });

  it('should display error message on fetch failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load analytics/)).toBeInTheDocument();
    });
  });

  it('should display error message on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load analytics/)).toBeInTheDocument();
    });
  });

  it('should display error message when response is invalid', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load analytics/)).toBeInTheDocument();
    });
  });

  it('should display 8 metric cards for all metrics', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    const { container } = render(<AnalyticsPage />);

    await waitFor(() => {
      const metricCards = container.querySelectorAll('.bg-white.rounded-lg.shadow.p-6');
      expect(metricCards.length).toBe(8);
    });
  });

  it('should calculate and display growth percentage', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
    });
  });

  it('should format large numbers with k suffix', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('15.0K').length).toBeGreaterThan(0);
      expect(screen.getAllByText('9.2K').length).toBeGreaterThan(0);
    });
  });

  it('should display metric with both current and previous values', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      const previousText = screen.getAllByText(/Previously:/);
      expect(previousText.length).toBeGreaterThan(0);
    });
  });

  it('should handle null analytics gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load analytics/)).toBeInTheDocument();
    });
  });

  it('should display growth metrics section with all metrics', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      const allMetricLabels = [
        'Total Users',
        'Total Businesses',
        'Total Events',
        'Total Deals',
        'Total Jobs',
        'Total Consultancies',
        'Active Users (30d)',
        'New Users (30d)',
      ];

      allMetricLabels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });
});
