/**
 * Performance Monitoring Utilities for Desi Connect USA
 *
 * Provides helpers for tracking Web Vitals, API response times,
 * and general performance metrics. Designed to work with Next.js 14
 * and scale to 500+ concurrent users.
 */

// ─── Types ───────────────────────────────────────────────────

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'score' | 'count';
  timestamp: number;
  tags?: Record<string, string>;
}

export interface WebVitalMetric {
  id: string;
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
}

export interface ApiTimingResult {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  ok: boolean;
}

export type MetricHandler = (metric: PerformanceMetric) => void;

// ─── Thresholds (Google Core Web Vitals) ─────────────────────

export const WEB_VITAL_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

// ─── API Response Time Budget ────────────────────────────────

export const API_TIMING_BUDGETS = {
  /** Listing endpoints — paginated queries */
  list: 500,
  /** Detail endpoints — single entity fetch */
  detail: 300,
  /** Search endpoints */
  search: 800,
  /** Auth endpoints */
  auth: 1000,
  /** Default if category is unknown */
  default: 500,
} as const;

export type ApiTimingCategory = keyof typeof API_TIMING_BUDGETS;

// ─── Rating Utilities ────────────────────────────────────────

/**
 * Rate a Web Vital value against Google thresholds.
 */
export function rateWebVital(
  name: WebVitalMetric['name'],
  value: number,
): WebVitalMetric['rating'] {
  const thresholds = WEB_VITAL_THRESHOLDS[name];
  if (!thresholds) return 'good';
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Check whether an API response time is within budget.
 */
export function isWithinTimeBudget(
  duration: number,
  category: ApiTimingCategory = 'default',
): boolean {
  return duration <= API_TIMING_BUDGETS[category];
}

// ─── Metric Collection Buffer ────────────────────────────────

const MAX_BUFFER_SIZE = 100;

/**
 * A simple in-memory buffer that collects performance metrics
 * and flushes them when full or on demand.
 */
export class MetricsBuffer {
  private buffer: PerformanceMetric[] = [];
  private readonly maxSize: number;
  private readonly onFlush: MetricHandler | null;

  constructor(options?: { maxSize?: number; onFlush?: MetricHandler }) {
    this.maxSize = options?.maxSize ?? MAX_BUFFER_SIZE;
    this.onFlush = options?.onFlush ?? null;
  }

  push(metric: PerformanceMetric): void {
    this.buffer.push(metric);
    if (this.buffer.length >= this.maxSize) {
      this.flush();
    }
  }

  flush(): PerformanceMetric[] {
    const metrics = [...this.buffer];
    this.buffer = [];
    if (this.onFlush) {
      metrics.forEach(this.onFlush);
    }
    return metrics;
  }

  get size(): number {
    return this.buffer.length;
  }

  get metrics(): ReadonlyArray<PerformanceMetric> {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
  }
}

// ─── API Timing Wrapper ──────────────────────────────────────

/**
 * Wraps a fetch call to measure response time.
 * Returns the original response plus timing information.
 */
export async function timedFetch(
  url: string,
  options?: RequestInit,
): Promise<{ response: Response; timing: ApiTimingResult }> {
  const start = Date.now();
  const method = options?.method ?? 'GET';

  const response = await fetch(url, options);

  const duration = Date.now() - start;
  const timing: ApiTimingResult = {
    url,
    method,
    duration,
    status: response.status,
    timestamp: start,
    ok: response.ok,
  };

  return { response, timing };
}

/**
 * Categorise an API URL to determine its time budget.
 */
export function categoriseApiUrl(url: string): ApiTimingCategory {
  const pathname = new URL(url, 'http://localhost').pathname.toLowerCase();

  if (pathname.includes('/search')) return 'search';
  if (pathname.includes('/auth') || pathname.includes('/login')) return 'auth';

  // Detail routes typically end with an ID segment
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? '';
  const looksLikeId =
    /^[0-9a-f-]{8,}$/i.test(lastSegment) || /^\d+$/.test(lastSegment);

  if (looksLikeId) return 'detail';

  return 'list';
}

// ─── Web Vitals Reporter (for Next.js reportWebVitals) ───────

/**
 * Create a reporter function compatible with Next.js `reportWebVitals`.
 * Converts the Next.js metric shape into our PerformanceMetric shape
 * and pushes it into the provided buffer.
 */
export function createWebVitalsReporter(buffer: MetricsBuffer) {
  return function reportWebVitals(metric: {
    id: string;
    name: string;
    value: number;
    label?: string;
  }): void {
    const rating = WEB_VITAL_THRESHOLDS[metric.name as WebVitalMetric['name']]
      ? rateWebVital(metric.name as WebVitalMetric['name'], metric.value)
      : 'good';

    buffer.push({
      name: `web-vital.${metric.name}`,
      value: metric.value,
      unit: metric.name === 'CLS' ? 'score' : 'ms',
      timestamp: Date.now(),
      tags: {
        id: metric.id,
        rating,
        ...(metric.label && { label: metric.label }),
      },
    });
  };
}

// ─── Summary Statistics ──────────────────────────────────────

export interface MetricSummary {
  count: number;
  min: number;
  max: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * Compute summary statistics from an array of numeric values.
 * Returns null if the array is empty.
 */
export function computeMetricSummary(values: number[]): MetricSummary | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);

  return {
    count,
    min: sorted[0],
    max: sorted[count - 1],
    mean: Math.round((sum / count) * 100) / 100,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

function percentile(sortedValues: number[], p: number): number {
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}
