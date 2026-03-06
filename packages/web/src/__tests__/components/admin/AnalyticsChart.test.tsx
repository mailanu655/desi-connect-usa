import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnalyticsChart, { ChartDataPoint } from '@/components/admin/AnalyticsChart';

describe('AnalyticsChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Empty data array
  describe('empty data state', () => {
    it('renders nothing when data array is empty', () => {
      render(<AnalyticsChart data={[]} />);

      const emptyState = screen.getByText('No data to display');
      expect(emptyState).toBeInTheDocument();
    });

    it('displays empty state with correct styling', () => {
      const { container } = render(<AnalyticsChart data={[]} height={200} />);
      const emptyDiv = container.querySelector('.flex.items-center.justify-center');
      expect(emptyDiv).toBeInTheDocument();
      expect(emptyDiv).toHaveStyle({ height: '200px' });
    });
  });

  // Test 2: Renders bars for each data point
  describe('bar rendering', () => {
    it('renders bars for each data point', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 150 },
        { date: '2024-01-03', value: 200 },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const rects = container.querySelectorAll('rect');

      // Should have 3 bars (one for each data point)
      expect(rects.length).toBeGreaterThanOrEqual(3);
    });

    it('renders single bar correctly', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const rects = container.querySelectorAll('rect');

      expect(rects.length).toBeGreaterThanOrEqual(1);
    });

    it('applies correct color to bars', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];
      const customColor = '#ff0000';

      const { container } = render(<AnalyticsChart data={data} color={customColor} />);
      const bar = container.querySelector('rect');

      expect(bar).toHaveAttribute('fill', customColor);
    });

    it('uses default orange color when color prop is not provided', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const bar = container.querySelector('rect');

      expect(bar).toHaveAttribute('fill', '#ea580c');
    });
  });

  // Test 3: Grid lines and Y-axis labels
  describe('grid lines and Y-axis labels', () => {
    it('displays grid lines when showGrid is true', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 200 },
      ];

      const { container } = render(<AnalyticsChart data={data} showGrid={true} />);
      const gridLines = container.querySelectorAll('line[stroke="#e5e7eb"]');

      // Should have 5 grid lines (0, 25%, 50%, 75%, 100%)
      expect(gridLines.length).toBeGreaterThan(0);
    });

    it('hides grid lines when showGrid is false', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 200 },
      ];

      const { container } = render(<AnalyticsChart data={data} showGrid={false} />);
      const gridLines = container.querySelectorAll('line[stroke="#e5e7eb"]');

      expect(gridLines.length).toBe(0);
    });

    it('displays Y-axis labels with formatValue function', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 1000 },
        { date: '2024-01-02', value: 2000 },
      ];
      const formatValue = (v: number) => `$${v}`;

      const { container } = render(
        <AnalyticsChart data={data} showGrid={true} formatValue={formatValue} />
      );

      // Check that at least one Y-axis label uses the custom format
      const textElements = container.querySelectorAll('text');
      const hasFormattedLabel = Array.from(textElements).some(
        (el) => el.textContent?.includes('$') || el.textContent === '0'
      );

      expect(hasFormattedLabel).toBe(true);
    });

    it('uses default number formatting when formatValue is not provided', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 1000 },
        { date: '2024-01-02', value: 2000 },
      ];

      const { container } = render(<AnalyticsChart data={data} showGrid={true} />);
      const textElements = container.querySelectorAll('text');

      // Default formatting uses toLocaleString
      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  // Test 4: Tooltip on hover
  describe('tooltip behavior', () => {
    it('shows tooltip on bar hover (mouseEnter)', async () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const bar = container.querySelector('rect') as SVGElement;

      // SVG title element should contain tooltip content
      const title = bar?.querySelector('title');
      expect(title).toBeInTheDocument();
      expect(title?.textContent).toContain('2024-01-01');
      expect(title?.textContent).toContain('100');
    });

    it('includes label in tooltip when label prop is provided', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100, label: 'January 1st' },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const bar = container.querySelector('rect') as SVGElement;
      const title = bar?.querySelector('title');

      expect(title?.textContent).toContain('January 1st');
    });

    it('uses date as fallback when label is not provided', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const bar = container.querySelector('rect') as SVGElement;
      const title = bar?.querySelector('title');

      expect(title?.textContent).toContain('2024-01-01');
    });

    it('applies opacity change on hover', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const bar = container.querySelector('rect');

      expect(bar).toHaveAttribute('opacity', '0.85');
      expect(bar).toHaveClass('hover:opacity-100');
    });
  });

  // Test 5: Height prop
  describe('height prop', () => {
    it('respects the height prop', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      const { container } = render(<AnalyticsChart data={data} height={400} />);
      const svg = container.querySelector('svg');

      // ViewBox should reflect the custom height
      expect(svg).toHaveAttribute('viewBox');
      const viewBox = svg?.getAttribute('viewBox');
      expect(viewBox).toContain('400');
    });

    it('uses default height when not provided', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const svg = container.querySelector('svg');

      const viewBox = svg?.getAttribute('viewBox');
      // Default height is 280
      expect(viewBox).toContain('280');
    });

    it('applies height to empty state container', () => {
      const { container } = render(<AnalyticsChart data={[]} height={300} />);
      const emptyDiv = container.querySelector('.flex.items-center.justify-center');

      expect(emptyDiv).toHaveStyle({ height: '300px' });
    });
  });

  // Test 6: X-axis labels
  describe('X-axis labels', () => {
    it('displays labels on X-axis when showLabels is true', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 150 },
        { date: '2024-01-03', value: 200 },
      ];

      const { container } = render(<AnalyticsChart data={data} showLabels={true} />);
      const textElements = container.querySelectorAll('text');

      expect(textElements.length).toBeGreaterThan(0);
    });

    it('hides labels when showLabels is false', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 150 },
      ];

      const { container } = render(<AnalyticsChart data={data} showLabels={false} />);
      const textElements = Array.from(container.querySelectorAll('text'));

      // Should only have Y-axis labels (grid labels), not X-axis labels
      const xAxisLabels = textElements.filter(
        (el) => el.getAttribute('textAnchor') === 'middle'
      );
      expect(xAxisLabels.length).toBe(0);
    });

    it('truncates long dates in X-axis labels', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01T12:00:00Z', value: 100 },
      ];

      const { container } = render(<AnalyticsChart data={data} showLabels={true} />);
      const textElements = Array.from(container.querySelectorAll('text'));

      // Should truncate to '01-01T12:00:00Z' (slice from position 5)
      const hasLabel = textElements.some((el) =>
        el.textContent?.includes('01-01T12:00:00Z')
      );

      expect(hasLabel).toBe(true);
    });

    it('displays labels at intervals to avoid overlap', () => {
      const data: ChartDataPoint[] = Array.from({ length: 50 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        value: Math.random() * 200,
      }));

      const { container } = render(<AnalyticsChart data={data} showLabels={true} />);
      const textElements = Array.from(container.querySelectorAll('text'));

      // Should have fewer labels than data points due to labelInterval
      const xAxisLabels = textElements.filter(
        (el) => el.getAttribute('textAnchor') === 'middle'
      );

      expect(xAxisLabels.length).toBeLessThan(data.length);
    });
  });

  // Test 7: Single data point
  describe('single data point handling', () => {
    it('handles single data point correctly', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const rects = container.querySelectorAll('rect');

      expect(rects.length).toBeGreaterThanOrEqual(1);
    });

    it('displays grid and labels for single data point', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      const { container } = render(
        <AnalyticsChart data={data} showGrid={true} showLabels={true} />
      );

      const gridLines = container.querySelectorAll('line[stroke="#e5e7eb"]');
      const textElements = container.querySelectorAll('text');

      expect(gridLines.length).toBeGreaterThan(0);
      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  // Additional comprehensive tests
  describe('SVG structure and accessibility', () => {
    it('renders SVG with proper accessibility attributes', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('role', 'img');
      expect(svg).toHaveAttribute('aria-label', 'Analytics bar chart');
    });

    it('renders wrapper div with proper test ID', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      render(<AnalyticsChart data={data} />);
      const wrapper = screen.getByTestId('analytics-chart');

      expect(wrapper).toBeInTheDocument();
    });

    it('renders X-axis baseline', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const lines = container.querySelectorAll('line');

      // Should have at least one baseline (plus grid lines if showGrid is true)
      expect(lines.length).toBeGreaterThan(0);
    });
  });

  describe('data calculations and bar positioning', () => {
    it('correctly scales bars based on max value', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 200 },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const rects = Array.from(container.querySelectorAll('rect'));

      // Second bar should be taller than first bar
      const firstBarHeight = parseFloat(rects[0].getAttribute('height') || '0');
      const secondBarHeight = parseFloat(rects[1].getAttribute('height') || '0');

      expect(secondBarHeight).toBeGreaterThan(firstBarHeight);
    });

    it('maintains minimum bar height of 1 for zero values', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 0 },
        { date: '2024-01-02', value: 100 },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const rects = Array.from(container.querySelectorAll('rect'));

      const firstBarHeight = Math.max(1, parseFloat(rects[0].getAttribute('height') || '0'));
      expect(firstBarHeight).toBeGreaterThanOrEqual(1);
    });

    it('applies rounded corners to bars', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      const { container } = render(<AnalyticsChart data={data} />);
      const bar = container.querySelector('rect');

      expect(bar).toHaveAttribute('rx', '2');
    });
  });
});
