/**
 * Tests for Performance Monitoring Utilities
 *
 * Covers: Web Vital rating, API timing budgets, MetricsBuffer,
 * timedFetch, URL categorisation, Web Vitals reporter, and summary stats.
 */

import {
  rateWebVital,
  isWithinTimeBudget,
  MetricsBuffer,
  timedFetch,
  categoriseApiUrl,
  createWebVitalsReporter,
  computeMetricSummary,
  WEB_VITAL_THRESHOLDS,
  API_TIMING_BUDGETS,
  type PerformanceMetric,
  type ApiTimingCategory,
} from '@/lib/performance/metrics';

// ─── Mock fetch globally ────────────────────────────────────

const originalFetch = global.fetch;

beforeEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  global.fetch = originalFetch;
});

// ═══════════════════════════════════════════════════════════════
// Web Vital Rating
// ═══════════════════════════════════════════════════════════════

describe('rateWebVital', () => {
  describe('LCP thresholds', () => {
    it('rates LCP <= 2500 as good', () => {
      expect(rateWebVital('LCP', 2500)).toBe('good');
      expect(rateWebVital('LCP', 1000)).toBe('good');
      expect(rateWebVital('LCP', 0)).toBe('good');
    });

    it('rates LCP between 2501-4000 as needs-improvement', () => {
      expect(rateWebVital('LCP', 2501)).toBe('needs-improvement');
      expect(rateWebVital('LCP', 3000)).toBe('needs-improvement');
      expect(rateWebVital('LCP', 4000)).toBe('needs-improvement');
    });

    it('rates LCP > 4000 as poor', () => {
      expect(rateWebVital('LCP', 4001)).toBe('poor');
      expect(rateWebVital('LCP', 8000)).toBe('poor');
    });
  });

  describe('CLS thresholds', () => {
    it('rates CLS <= 0.1 as good', () => {
      expect(rateWebVital('CLS', 0.1)).toBe('good');
      expect(rateWebVital('CLS', 0)).toBe('good');
      expect(rateWebVital('CLS', 0.05)).toBe('good');
    });

    it('rates CLS between 0.1-0.25 as needs-improvement', () => {
      expect(rateWebVital('CLS', 0.15)).toBe('needs-improvement');
      expect(rateWebVital('CLS', 0.25)).toBe('needs-improvement');
    });

    it('rates CLS > 0.25 as poor', () => {
      expect(rateWebVital('CLS', 0.3)).toBe('poor');
      expect(rateWebVital('CLS', 1.0)).toBe('poor');
    });
  });

  describe('FCP thresholds', () => {
    it('rates FCP <= 1800 as good', () => {
      expect(rateWebVital('FCP', 1800)).toBe('good');
    });

    it('rates FCP between 1801-3000 as needs-improvement', () => {
      expect(rateWebVital('FCP', 2000)).toBe('needs-improvement');
    });

    it('rates FCP > 3000 as poor', () => {
      expect(rateWebVital('FCP', 3500)).toBe('poor');
    });
  });

  describe('FID thresholds', () => {
    it('rates FID <= 100 as good', () => {
      expect(rateWebVital('FID', 50)).toBe('good');
    });

    it('rates FID between 101-300 as needs-improvement', () => {
      expect(rateWebVital('FID', 200)).toBe('needs-improvement');
    });

    it('rates FID > 300 as poor', () => {
      expect(rateWebVital('FID', 500)).toBe('poor');
    });
  });

  describe('INP thresholds', () => {
    it('rates INP <= 200 as good', () => {
      expect(rateWebVital('INP', 150)).toBe('good');
    });

    it('rates INP between 201-500 as needs-improvement', () => {
      expect(rateWebVital('INP', 350)).toBe('needs-improvement');
    });

    it('rates INP > 500 as poor', () => {
      expect(rateWebVital('INP', 600)).toBe('poor');
    });
  });

  describe('TTFB thresholds', () => {
    it('rates TTFB <= 800 as good', () => {
      expect(rateWebVital('TTFB', 500)).toBe('good');
    });

    it('rates TTFB between 801-1800 as needs-improvement', () => {
      expect(rateWebVital('TTFB', 1200)).toBe('needs-improvement');
    });

    it('rates TTFB > 1800 as poor', () => {
      expect(rateWebVital('TTFB', 2000)).toBe('poor');
    });
  });

  it('all threshold values match Google standards', () => {
    expect(WEB_VITAL_THRESHOLDS.LCP.good).toBe(2500);
    expect(WEB_VITAL_THRESHOLDS.LCP.poor).toBe(4000);
    expect(WEB_VITAL_THRESHOLDS.CLS.good).toBe(0.1);
    expect(WEB_VITAL_THRESHOLDS.CLS.poor).toBe(0.25);
    expect(WEB_VITAL_THRESHOLDS.FCP.good).toBe(1800);
    expect(WEB_VITAL_THRESHOLDS.INP.good).toBe(200);
    expect(WEB_VITAL_THRESHOLDS.TTFB.good).toBe(800);
  });
});

// ═══════════════════════════════════════════════════════════════
// API Timing Budgets
// ═══════════════════════════════════════════════════════════════

describe('isWithinTimeBudget', () => {
  it('returns true when duration is within list budget', () => {
    expect(isWithinTimeBudget(400, 'list')).toBe(true);
    expect(isWithinTimeBudget(500, 'list')).toBe(true);
  });

  it('returns false when duration exceeds list budget', () => {
    expect(isWithinTimeBudget(501, 'list')).toBe(false);
  });

  it('returns true when within detail budget', () => {
    expect(isWithinTimeBudget(200, 'detail')).toBe(true);
    expect(isWithinTimeBudget(300, 'detail')).toBe(true);
  });

  it('returns false when exceeding detail budget', () => {
    expect(isWithinTimeBudget(301, 'detail')).toBe(false);
  });

  it('returns true when within search budget', () => {
    expect(isWithinTimeBudget(700, 'search')).toBe(true);
  });

  it('returns false when exceeding search budget', () => {
    expect(isWithinTimeBudget(801, 'search')).toBe(false);
  });

  it('uses default budget when no category provided', () => {
    expect(isWithinTimeBudget(500)).toBe(true);
    expect(isWithinTimeBudget(501)).toBe(false);
  });

  it('budget values are sensible', () => {
    expect(API_TIMING_BUDGETS.detail).toBeLessThan(API_TIMING_BUDGETS.list);
    expect(API_TIMING_BUDGETS.list).toBeLessThan(API_TIMING_BUDGETS.search);
    expect(API_TIMING_BUDGETS.search).toBeLessThanOrEqual(API_TIMING_BUDGETS.auth);
  });
});

// ═══════════════════════════════════════════════════════════════
// MetricsBuffer
// ═══════════════════════════════════════════════════════════════

describe('MetricsBuffer', () => {
  const makeMetric = (name: string, value = 100): PerformanceMetric => ({
    name,
    value,
    unit: 'ms',
    timestamp: Date.now(),
  });

  it('starts empty', () => {
    const buffer = new MetricsBuffer();
    expect(buffer.size).toBe(0);
    expect(buffer.metrics).toEqual([]);
  });

  it('accepts pushed metrics', () => {
    const buffer = new MetricsBuffer();
    buffer.push(makeMetric('test'));
    expect(buffer.size).toBe(1);
  });

  it('flush returns and clears all metrics', () => {
    const buffer = new MetricsBuffer();
    buffer.push(makeMetric('a'));
    buffer.push(makeMetric('b'));

    const flushed = buffer.flush();
    expect(flushed).toHaveLength(2);
    expect(flushed[0].name).toBe('a');
    expect(flushed[1].name).toBe('b');
    expect(buffer.size).toBe(0);
  });

  it('clear empties the buffer without returning metrics', () => {
    const buffer = new MetricsBuffer();
    buffer.push(makeMetric('a'));
    buffer.clear();
    expect(buffer.size).toBe(0);
  });

  it('auto-flushes when maxSize is reached', () => {
    const onFlush = jest.fn();
    const buffer = new MetricsBuffer({ maxSize: 3, onFlush });

    buffer.push(makeMetric('a'));
    buffer.push(makeMetric('b'));
    expect(onFlush).not.toHaveBeenCalled();

    buffer.push(makeMetric('c'));
    expect(onFlush).toHaveBeenCalledTimes(3); // once per metric in the flush
    expect(buffer.size).toBe(0);
  });

  it('uses default maxSize of 100', () => {
    const buffer = new MetricsBuffer();
    for (let i = 0; i < 99; i++) {
      buffer.push(makeMetric(`metric-${i}`));
    }
    expect(buffer.size).toBe(99);
    buffer.push(makeMetric('trigger'));
    // auto-flush occurred
    expect(buffer.size).toBe(0);
  });

  it('metrics getter returns a copy (immutable)', () => {
    const buffer = new MetricsBuffer();
    buffer.push(makeMetric('test'));
    const snapshot = buffer.metrics;
    buffer.clear();
    // snapshot should still have the metric
    expect(snapshot).toHaveLength(1);
    expect(buffer.size).toBe(0);
  });

  it('calls onFlush for each metric during flush', () => {
    const handler = jest.fn();
    const buffer = new MetricsBuffer({ onFlush: handler });
    buffer.push(makeMetric('x'));
    buffer.push(makeMetric('y'));

    buffer.flush();
    expect(handler).toHaveBeenCalledTimes(2);
    // forEach passes (element, index, array) — check first arg only
    expect(handler.mock.calls[0][0]).toEqual(expect.objectContaining({ name: 'x' }));
    expect(handler.mock.calls[1][0]).toEqual(expect.objectContaining({ name: 'y' }));
  });
});

// ═══════════════════════════════════════════════════════════════
// timedFetch
// ═══════════════════════════════════════════════════════════════

describe('timedFetch', () => {
  /** Helper to create a mock Response-like object (Response is unavailable in jsdom). */
  function mockResponse(status: number, ok?: boolean) {
    return { status, ok: ok ?? (status >= 200 && status < 300) } as unknown as Response;
  }

  it('returns response and timing information', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockResponse(200));

    const { response, timing } = await timedFetch('http://api.example.com/businesses');

    expect(response.status).toBe(200);
    expect(timing.url).toBe('http://api.example.com/businesses');
    expect(timing.method).toBe('GET');
    expect(timing.status).toBe(200);
    expect(timing.ok).toBe(true);
    expect(timing.duration).toBeGreaterThanOrEqual(0);
    expect(timing.timestamp).toBeGreaterThan(0);
  });

  it('passes through request options', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockResponse(201));

    const { timing } = await timedFetch('http://api.example.com/events', {
      method: 'POST',
      body: JSON.stringify({ title: 'Diwali' }),
    });

    expect(timing.method).toBe('POST');
    expect(timing.status).toBe(201);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.example.com/events',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('records ok as false for error status codes', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockResponse(404, false));

    const { timing } = await timedFetch('http://api.example.com/businesses/bad-id');
    expect(timing.ok).toBe(false);
    expect(timing.status).toBe(404);
  });

  it('propagates network errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(timedFetch('http://unreachable.example.com'))
      .rejects.toThrow('Network error');
  });

  it('defaults method to GET when options omitted', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockResponse(200));

    const { timing } = await timedFetch('http://api.example.com/health');
    expect(timing.method).toBe('GET');
  });
});

// ═══════════════════════════════════════════════════════════════
// URL Categorisation
// ═══════════════════════════════════════════════════════════════

describe('categoriseApiUrl', () => {
  it('categorises search URLs', () => {
    expect(categoriseApiUrl('/api/search?q=diwali')).toBe('search');
    expect(categoriseApiUrl('/api/businesses/search')).toBe('search');
  });

  it('categorises auth URLs', () => {
    expect(categoriseApiUrl('/api/auth/login')).toBe('auth');
    expect(categoriseApiUrl('/api/login')).toBe('auth');
    expect(categoriseApiUrl('/api/auth/callback')).toBe('auth');
  });

  it('categorises detail URLs (UUID-like IDs)', () => {
    expect(categoriseApiUrl('/api/businesses/a1b2c3d4-e5f6-7890-abcd-1234567890ab'))
      .toBe('detail');
  });

  it('categorises detail URLs (numeric IDs)', () => {
    expect(categoriseApiUrl('/api/events/12345')).toBe('detail');
  });

  it('categorises listing URLs', () => {
    expect(categoriseApiUrl('/api/businesses')).toBe('list');
    expect(categoriseApiUrl('/api/events')).toBe('list');
    expect(categoriseApiUrl('/api/jobs')).toBe('list');
  });

  it('returns list for ambiguous URLs', () => {
    expect(categoriseApiUrl('/api/dashboard')).toBe('list');
  });

  it('handles full URLs with host', () => {
    expect(categoriseApiUrl('https://api.desiconnect.com/api/businesses'))
      .toBe('list');
    expect(categoriseApiUrl('https://api.desiconnect.com/api/events/12345'))
      .toBe('detail');
  });
});

// ═══════════════════════════════════════════════════════════════
// Web Vitals Reporter
// ═══════════════════════════════════════════════════════════════

describe('createWebVitalsReporter', () => {
  it('creates a reporter function', () => {
    const buffer = new MetricsBuffer();
    const reporter = createWebVitalsReporter(buffer);
    expect(typeof reporter).toBe('function');
  });

  it('pushes web vital metrics to the buffer', () => {
    const buffer = new MetricsBuffer();
    const reporter = createWebVitalsReporter(buffer);

    reporter({ id: 'v1-123', name: 'LCP', value: 2000 });

    expect(buffer.size).toBe(1);
    const metrics = buffer.metrics;
    expect(metrics[0].name).toBe('web-vital.LCP');
    expect(metrics[0].value).toBe(2000);
    expect(metrics[0].unit).toBe('ms');
  });

  it('uses score unit for CLS', () => {
    const buffer = new MetricsBuffer();
    const reporter = createWebVitalsReporter(buffer);

    reporter({ id: 'v1-456', name: 'CLS', value: 0.05 });

    expect(buffer.metrics[0].unit).toBe('score');
  });

  it('includes rating tag based on thresholds', () => {
    const buffer = new MetricsBuffer();
    const reporter = createWebVitalsReporter(buffer);

    reporter({ id: 'v1-1', name: 'LCP', value: 1000 });
    reporter({ id: 'v1-2', name: 'LCP', value: 3000 });
    reporter({ id: 'v1-3', name: 'LCP', value: 5000 });

    expect(buffer.metrics[0].tags?.rating).toBe('good');
    expect(buffer.metrics[1].tags?.rating).toBe('needs-improvement');
    expect(buffer.metrics[2].tags?.rating).toBe('poor');
  });

  it('includes id and label tags', () => {
    const buffer = new MetricsBuffer();
    const reporter = createWebVitalsReporter(buffer);

    reporter({ id: 'v1-789', name: 'FCP', value: 1500, label: 'web-vital' });

    expect(buffer.metrics[0].tags?.id).toBe('v1-789');
    expect(buffer.metrics[0].tags?.label).toBe('web-vital');
  });

  it('omits label tag when not provided', () => {
    const buffer = new MetricsBuffer();
    const reporter = createWebVitalsReporter(buffer);

    reporter({ id: 'v1-000', name: 'TTFB', value: 500 });

    expect(buffer.metrics[0].tags?.label).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// Summary Statistics
// ═══════════════════════════════════════════════════════════════

describe('computeMetricSummary', () => {
  it('returns null for empty array', () => {
    expect(computeMetricSummary([])).toBeNull();
  });

  it('computes correct stats for a single value', () => {
    const result = computeMetricSummary([42]);
    expect(result).toEqual({
      count: 1,
      min: 42,
      max: 42,
      mean: 42,
      p50: 42,
      p95: 42,
      p99: 42,
    });
  });

  it('computes correct min and max', () => {
    const result = computeMetricSummary([10, 50, 30, 90, 20]);
    expect(result!.min).toBe(10);
    expect(result!.max).toBe(90);
  });

  it('computes correct mean', () => {
    const result = computeMetricSummary([100, 200, 300]);
    expect(result!.mean).toBe(200);
  });

  it('rounds mean to 2 decimal places', () => {
    const result = computeMetricSummary([1, 2, 3]);
    expect(result!.mean).toBe(2);

    const result2 = computeMetricSummary([1, 1, 2]);
    expect(result2!.mean).toBe(1.33);
  });

  it('computes correct count', () => {
    const result = computeMetricSummary([1, 2, 3, 4, 5]);
    expect(result!.count).toBe(5);
  });

  it('computes percentiles correctly for sorted data', () => {
    // 100 values: 1, 2, 3, ..., 100
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const result = computeMetricSummary(values)!;

    expect(result.p50).toBe(50);
    expect(result.p95).toBe(95);
    expect(result.p99).toBe(99);
  });

  it('handles unsorted input (sorts internally)', () => {
    const values = [90, 10, 50, 30, 70];
    const result = computeMetricSummary(values)!;

    expect(result.min).toBe(10);
    expect(result.max).toBe(90);
    expect(result.p50).toBe(50);
  });

  it('does not mutate the input array', () => {
    const values = [3, 1, 2];
    computeMetricSummary(values);
    expect(values).toEqual([3, 1, 2]);
  });

  it('handles all identical values', () => {
    const result = computeMetricSummary([42, 42, 42, 42]);
    expect(result).toEqual({
      count: 4,
      min: 42,
      max: 42,
      mean: 42,
      p50: 42,
      p95: 42,
      p99: 42,
    });
  });

  it('handles two values correctly', () => {
    const result = computeMetricSummary([10, 90])!;
    expect(result.min).toBe(10);
    expect(result.max).toBe(90);
    expect(result.mean).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════
// Integration: End-to-End Performance Monitoring Flow
// ═══════════════════════════════════════════════════════════════

describe('End-to-End Performance Monitoring', () => {
  it('collects API timings and computes summary', async () => {
    const buffer = new MetricsBuffer();

    // Simulate 5 API calls with known durations
    const durations = [100, 150, 200, 250, 800];
    for (const duration of durations) {
      buffer.push({
        name: 'api.response_time',
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { url: '/api/businesses', category: 'list' },
      });
    }

    const flushed = buffer.flush();
    expect(flushed).toHaveLength(5);

    const summary = computeMetricSummary(flushed.map((m) => m.value))!;
    expect(summary.count).toBe(5);
    expect(summary.min).toBe(100);
    expect(summary.max).toBe(800);
    expect(summary.mean).toBe(300);
  });

  it('identifies slow API calls against budget', () => {
    const timings = [
      { duration: 200, category: 'detail' as ApiTimingCategory },
      { duration: 400, category: 'detail' as ApiTimingCategory },
      { duration: 500, category: 'list' as ApiTimingCategory },
      { duration: 600, category: 'list' as ApiTimingCategory },
    ];

    const withinBudget = timings.filter((t) =>
      isWithinTimeBudget(t.duration, t.category),
    );
    const overBudget = timings.filter(
      (t) => !isWithinTimeBudget(t.duration, t.category),
    );

    expect(withinBudget).toHaveLength(2);
    expect(overBudget).toHaveLength(2);
    expect(overBudget[0].duration).toBe(400); // detail budget = 300
    expect(overBudget[1].duration).toBe(600); // list budget = 500
  });

  it('web vitals reporter + summary pipeline', () => {
    const buffer = new MetricsBuffer();
    const reporter = createWebVitalsReporter(buffer);

    // Simulate several LCP measurements
    reporter({ id: '1', name: 'LCP', value: 1500 });
    reporter({ id: '2', name: 'LCP', value: 2500 });
    reporter({ id: '3', name: 'LCP', value: 3500 });
    reporter({ id: '4', name: 'LCP', value: 4500 });

    const lcpMetrics = buffer.metrics.filter((m) => m.name === 'web-vital.LCP');
    expect(lcpMetrics).toHaveLength(4);

    const summary = computeMetricSummary(lcpMetrics.map((m) => m.value))!;
    expect(summary.min).toBe(1500);
    expect(summary.max).toBe(4500);
    expect(summary.mean).toBe(3000);

    // Ratings distribution
    const ratings = lcpMetrics.map((m) => m.tags?.rating);
    expect(ratings).toEqual(['good', 'good', 'needs-improvement', 'poor']);
  });
});
