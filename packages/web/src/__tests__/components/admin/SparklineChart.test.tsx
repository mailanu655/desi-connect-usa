import React from 'react';
import { render, screen } from '@testing-library/react';
import SparklineChart from '@/components/admin/SparklineChart';

describe('SparklineChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty or insufficient data', () => {
    it('renders nothing when values array is empty', () => {
      const { container } = render(<SparklineChart data={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when values array has only one element', () => {
      const { container } = render(<SparklineChart data={[10]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when data is null', () => {
      const { container } = render(<SparklineChart data={null as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when data is undefined', () => {
      const { container } = render(<SparklineChart data={undefined as any} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('SVG rendering', () => {
    it('renders an SVG element with valid data', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toBeInTheDocument();
      expect(svg.tagName).toBe('svg');
    });

    it('sets correct viewBox attribute', () => {
      const width = 120;
      const height = 32;
      render(<SparklineChart data={[10, 20, 30]} width={width} height={height} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toHaveAttribute('viewBox', `0 0 ${width} ${height}`);
    });

    it('applies inline-block class', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toHaveClass('inline-block');
    });

    it('has correct aria label', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toHaveAttribute('aria-label', 'Trend sparkline');
    });

    it('has img role', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toHaveAttribute('role', 'img');
    });
  });

  describe('Path elements', () => {
    it('creates fill path element', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      const paths = svg.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(1);
    });

    it('creates line path element', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      const paths = svg.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(2);
    });

    it('fill path has correct attributes', () => {
      const color = '#ea580c';
      const fillOpacity = 0.15;
      render(
        <SparklineChart
          data={[10, 20, 30]}
          color={color}
          fillOpacity={fillOpacity}
        />
      );
      const svg = screen.getByTestId('sparkline-chart');
      const fillPath = svg.querySelector('path[opacity]');
      expect(fillPath).toHaveAttribute('fill', color);
      expect(fillPath).toHaveAttribute('opacity', String(fillOpacity));
    });

    it('line path has correct attributes', () => {
      const color = '#ea580c';
      render(<SparklineChart data={[10, 20, 30]} color={color} />);
      const svg = screen.getByTestId('sparkline-chart');
      const paths = svg.querySelectorAll('path');
      const linePath = paths[1];
      expect(linePath).toHaveAttribute('fill', 'none');
      expect(linePath).toHaveAttribute('stroke', color);
      expect(linePath).toHaveAttribute('stroke-width', '1.5');
    });

    it('fill path has valid d attribute', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      const fillPath = svg.querySelector('path[opacity]');
      expect(fillPath).toHaveAttribute('d');
      const d = fillPath?.getAttribute('d');
      expect(d).toMatch(/^M.*Z$/);
    });

    it('line path has valid d attribute', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      const paths = svg.querySelectorAll('path');
      const linePath = paths[1];
      expect(linePath).toHaveAttribute('d');
      const d = linePath?.getAttribute('d');
      expect(d).toMatch(/^M.*L.*$/);
    });
  });

  describe('Latest data point circle', () => {
    it('shows a circle for the latest data point', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      const circle = svg.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });

    it('circle has correct radius', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      const circle = svg.querySelector('circle');
      expect(circle).toHaveAttribute('r', '2.5');
    });

    it('circle has correct fill color', () => {
      const color = '#ff0000';
      render(<SparklineChart data={[10, 20, 30]} color={color} />);
      const svg = screen.getByTestId('sparkline-chart');
      const circle = svg.querySelector('circle');
      expect(circle).toHaveAttribute('fill', color);
    });

    it('circle is positioned at the last data point', () => {
      render(<SparklineChart data={[10, 20, 30]} width={120} height={32} />);
      const svg = screen.getByTestId('sparkline-chart');
      const circle = svg.querySelector('circle');
      const cx = circle?.getAttribute('cx');
      const cy = circle?.getAttribute('cy');
      expect(cx).toBeDefined();
      expect(cy).toBeDefined();
      // Both should be valid numbers
      expect(parseFloat(cx!)).not.toBeNaN();
      expect(parseFloat(cy!)).not.toBeNaN();
    });

    it('circle has cx and cy attributes', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      const circle = svg.querySelector('circle');
      expect(circle).toHaveAttribute('cx');
      expect(circle).toHaveAttribute('cy');
    });
  });

  describe('Width and height props', () => {
    it('respects custom width prop', () => {
      const customWidth = 200;
      render(<SparklineChart data={[10, 20, 30]} width={customWidth} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toHaveAttribute('width', String(customWidth));
    });

    it('respects custom height prop', () => {
      const customHeight = 64;
      render(<SparklineChart data={[10, 20, 30]} height={customHeight} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toHaveAttribute('height', String(customHeight));
    });

    it('respects both custom width and height props', () => {
      const customWidth = 200;
      const customHeight = 64;
      render(
        <SparklineChart
          data={[10, 20, 30]}
          width={customWidth}
          height={customHeight}
        />
      );
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toHaveAttribute('width', String(customWidth));
      expect(svg).toHaveAttribute('height', String(customHeight));
    });

    it('uses default width when not specified', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toHaveAttribute('width', '120');
    });

    it('uses default height when not specified', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toHaveAttribute('height', '32');
    });
  });

  describe('Single value handling', () => {
    it('handles a single value (returns null)', () => {
      const { container } = render(<SparklineChart data={[42]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Negative values', () => {
    it('handles negative values correctly', () => {
      render(<SparklineChart data={[-10, 0, 10]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toBeInTheDocument();
      const paths = svg.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(2);
    });

    it('renders correctly with all negative values', () => {
      render(<SparklineChart data={[-30, -20, -10]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toBeInTheDocument();
      const circle = svg.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });

    it('renders correctly with mixed negative and positive values', () => {
      render(<SparklineChart data={[-50, -25, 0, 25, 50]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toBeInTheDocument();
      const paths = svg.querySelectorAll('path');
      const circle = svg.querySelector('circle');
      expect(paths.length).toBeGreaterThanOrEqual(2);
      expect(circle).toBeInTheDocument();
    });
  });

  describe('Default dimensions', () => {
    it('renders with default dimensions if not specified', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toHaveAttribute('width', '120');
      expect(svg).toHaveAttribute('height', '32');
      expect(svg).toHaveAttribute('viewBox', '0 0 120 32');
    });
  });

  describe('Color prop', () => {
    it('uses default color when not specified', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      const fillPath = svg.querySelector('path[opacity]');
      const linePath = svg.querySelectorAll('path')[1];
      const circle = svg.querySelector('circle');
      expect(fillPath).toHaveAttribute('fill', '#ea580c');
      expect(linePath).toHaveAttribute('stroke', '#ea580c');
      expect(circle).toHaveAttribute('fill', '#ea580c');
    });

    it('respects custom color prop', () => {
      const customColor = '#0066ff';
      render(<SparklineChart data={[10, 20, 30]} color={customColor} />);
      const svg = screen.getByTestId('sparkline-chart');
      const fillPath = svg.querySelector('path[opacity]');
      const linePath = svg.querySelectorAll('path')[1];
      const circle = svg.querySelector('circle');
      expect(fillPath).toHaveAttribute('fill', customColor);
      expect(linePath).toHaveAttribute('stroke', customColor);
      expect(circle).toHaveAttribute('fill', customColor);
    });
  });

  describe('Fill opacity prop', () => {
    it('uses default fillOpacity when not specified', () => {
      render(<SparklineChart data={[10, 20, 30]} />);
      const svg = screen.getByTestId('sparkline-chart');
      const fillPath = svg.querySelector('path[opacity]');
      expect(fillPath).toHaveAttribute('opacity', '0.15');
    });

    it('respects custom fillOpacity prop', () => {
      const customOpacity = 0.3;
      render(<SparklineChart data={[10, 20, 30]} fillOpacity={customOpacity} />);
      const svg = screen.getByTestId('sparkline-chart');
      const fillPath = svg.querySelector('path[opacity]');
      expect(fillPath).toHaveAttribute('opacity', String(customOpacity));
    });

    it('respects fillOpacity of 0', () => {
      render(<SparklineChart data={[10, 20, 30]} fillOpacity={0} />);
      const svg = screen.getByTestId('sparkline-chart');
      const fillPath = svg.querySelector('path[opacity]');
      expect(fillPath).toHaveAttribute('opacity', '0');
    });

    it('respects fillOpacity of 1', () => {
      render(<SparklineChart data={[10, 20, 30]} fillOpacity={1} />);
      const svg = screen.getByTestId('sparkline-chart');
      const fillPath = svg.querySelector('path[opacity]');
      expect(fillPath).toHaveAttribute('opacity', '1');
    });
  });

  describe('Data edge cases', () => {
    it('renders with exactly two values', () => {
      render(<SparklineChart data={[10, 20]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toBeInTheDocument();
      const circle = svg.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });

    it('renders with many values', () => {
      const manyValues = Array.from({ length: 100 }, (_, i) => i * 10);
      render(<SparklineChart data={manyValues} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toBeInTheDocument();
    });

    it('handles all identical values', () => {
      render(<SparklineChart data={[42, 42, 42, 42]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toBeInTheDocument();
      const circle = svg.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });

    it('handles decimal values', () => {
      render(<SparklineChart data={[1.5, 2.7, 3.2]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toBeInTheDocument();
    });

    it('handles zero values', () => {
      render(<SparklineChart data={[0, 10, 0]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toBeInTheDocument();
    });

    it('handles very large values', () => {
      render(<SparklineChart data={[1000000, 2000000, 3000000]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toBeInTheDocument();
    });

    it('handles very small values', () => {
      render(<SparklineChart data={[0.0001, 0.0002, 0.0003]} />);
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('All props together', () => {
    it('renders correctly with all custom props', () => {
      render(
        <SparklineChart
          data={[5, 15, 25, 35, 45]}
          width={300}
          height={100}
          color="#00ff00"
          fillOpacity={0.5}
        />
      );
      const svg = screen.getByTestId('sparkline-chart');
      expect(svg).toHaveAttribute('width', '300');
      expect(svg).toHaveAttribute('height', '100');
      expect(svg).toHaveAttribute('viewBox', '0 0 300 100');

      const fillPath = svg.querySelector('path[opacity]');
      expect(fillPath).toHaveAttribute('fill', '#00ff00');
      expect(fillPath).toHaveAttribute('opacity', '0.5');

      const linePath = svg.querySelectorAll('path')[1];
      expect(linePath).toHaveAttribute('stroke', '#00ff00');

      const circle = svg.querySelector('circle');
      expect(circle).toHaveAttribute('fill', '#00ff00');
    });
  });
});
