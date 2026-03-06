/**
 * Tests for Analytics Helper Utilities
 */

import {
  calculateGrowthMetrics,
  formatMetricValue,
  getGrowthTrend,
} from '@/lib/user-profile';

describe('Analytics Utilities', () => {
  // calculateGrowthMetrics tests
  describe('calculateGrowthMetrics', () => {
    it('should calculate growth percentage for increase', () => {
      const metric = calculateGrowthMetrics('Users', 100, 80);
      expect(metric.current).toBe(100);
      expect(metric.previous).toBe(80);
      expect(metric.change_percent).toBe(25);
      expect(metric.trend).toBe('up');
    });

    it('should calculate growth percentage for decrease', () => {
      const metric = calculateGrowthMetrics('Users', 80, 100);
      expect(metric.current).toBe(80);
      expect(metric.previous).toBe(100);
      expect(metric.change_percent).toBe(-20);
      expect(metric.trend).toBe('down');
    });

    it('should return 0 change when values are equal', () => {
      const metric = calculateGrowthMetrics('Users', 100, 100);
      expect(metric.change_percent).toBe(0);
      expect(metric.trend).toBe('flat');
    });

    it('should handle when previous is 0', () => {
      const metric = calculateGrowthMetrics('Users', 50, 0);
      expect(metric.change_percent).toBe(0);
      expect(metric.trend).toBe('flat');
    });

    it('should round change percentage', () => {
      const metric = calculateGrowthMetrics('Users', 105, 100);
      expect(metric.change_percent).toBe(5);
    });

    it('should calculate large growth percentage correctly', () => {
      const metric = calculateGrowthMetrics('Users', 150, 100);
      expect(metric.change_percent).toBe(50);
      expect(metric.trend).toBe('up');
    });

    it('should calculate negative growth correctly', () => {
      const metric = calculateGrowthMetrics('Users', 50, 100);
      expect(metric.change_percent).toBe(-50);
      expect(metric.trend).toBe('down');
    });

    it('should include label in result', () => {
      const metric = calculateGrowthMetrics('Total Users', 100, 80);
      expect(metric.label).toBe('Total Users');
    });

    it('should handle decimal growth', () => {
      const metric = calculateGrowthMetrics('Users', 101, 100);
      expect(metric.change_percent).toBe(1);
    });

    it('should handle very small current value', () => {
      const metric = calculateGrowthMetrics('Users', 1, 100);
      expect(metric.change_percent).toBe(-99);
      expect(metric.trend).toBe('down');
    });

    it('should handle very large current value', () => {
      const metric = calculateGrowthMetrics('Users', 1000000, 500000);
      expect(metric.change_percent).toBe(100);
      expect(metric.trend).toBe('up');
    });
  });

  // formatMetricValue tests
  describe('formatMetricValue', () => {
    it('should return string representation for values under 1000', () => {
      expect(formatMetricValue(500)).toBe('500');
      expect(formatMetricValue(999)).toBe('999');
      expect(formatMetricValue(1)).toBe('1');
      expect(formatMetricValue(0)).toBe('0');
    });

    it('should format thousands with K suffix', () => {
      expect(formatMetricValue(1000)).toBe('1.0K');
      expect(formatMetricValue(1500)).toBe('1.5K');
      expect(formatMetricValue(10000)).toBe('10.0K');
      expect(formatMetricValue(99999)).toBe('100.0K');
    });

    it('should format millions with M suffix', () => {
      expect(formatMetricValue(1000000)).toBe('1.0M');
      expect(formatMetricValue(1500000)).toBe('1.5M');
      expect(formatMetricValue(10000000)).toBe('10.0M');
    });

    it('should show one decimal place for K values', () => {
      expect(formatMetricValue(1234)).toBe('1.2K');
      expect(formatMetricValue(5678)).toBe('5.7K');
    });

    it('should show one decimal place for M values', () => {
      expect(formatMetricValue(1234567)).toBe('1.2M');
      expect(formatMetricValue(5678901)).toBe('5.7M');
    });

    it('should handle boundary values correctly', () => {
      expect(formatMetricValue(999)).toBe('999');
      expect(formatMetricValue(1000)).toBe('1.0K');
      expect(formatMetricValue(999999)).toBe('1000.0K');
      expect(formatMetricValue(1000000)).toBe('1.0M');
    });

    it('should handle zero', () => {
      expect(formatMetricValue(0)).toBe('0');
    });

    it('should format KK boundary values', () => {
      expect(formatMetricValue(999000)).toBe('999.0K');
      expect(formatMetricValue(999500)).toBe('999.5K');
    });
  });

  // getGrowthTrend tests
  describe('getGrowthTrend', () => {
    it('should return up for positive change', () => {
      expect(getGrowthTrend(5)).toBe('up');
      expect(getGrowthTrend(1)).toBe('up');
      expect(getGrowthTrend(100)).toBe('up');
    });

    it('should return down for negative change', () => {
      expect(getGrowthTrend(-5)).toBe('down');
      expect(getGrowthTrend(-1)).toBe('down');
      expect(getGrowthTrend(-100)).toBe('down');
    });

    it('should return flat for zero change', () => {
      expect(getGrowthTrend(0)).toBe('flat');
    });

    it('should handle decimal values', () => {
      expect(getGrowthTrend(0.5)).toBe('up');
      expect(getGrowthTrend(-0.5)).toBe('down');
    });

    it('should handle large positive values', () => {
      expect(getGrowthTrend(999)).toBe('up');
    });

    it('should handle large negative values', () => {
      expect(getGrowthTrend(-999)).toBe('down');
    });
  });
});
