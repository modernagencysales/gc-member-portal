import { onCLS, onLCP, onFCP, onTTFB, onINP, type Metric } from 'web-vitals';
import * as Sentry from '@sentry/react';

// Thresholds based on Google's Core Web Vitals recommendations
const thresholds = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  LCP: { good: 2500, needsImprovement: 4000 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};

type MetricName = keyof typeof thresholds;

function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function reportMetric(metric: Metric) {
  const rating = getRating(metric.name as MetricName, metric.value);

  // Log to console in development
  if (import.meta.env.DEV) {
    const color = rating === 'good' ? 'green' : rating === 'needs-improvement' ? 'orange' : 'red';
    console.log(
      `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${rating})`,
      `color: ${color}; font-weight: bold`
    );
  }

  // Send poor metrics as breadcrumbs for debugging
  if (rating === 'poor') {
    Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: `Poor ${metric.name}: ${metric.value.toFixed(2)}`,
      level: 'warning',
      data: {
        id: metric.id,
        value: metric.value,
        rating,
        navigationType: metric.navigationType,
      },
    });
  }

  // Send metric to Sentry as a span or custom event
  Sentry.setTag(`web_vital_${metric.name.toLowerCase()}`, rating);
  Sentry.setContext('web_vitals', {
    [metric.name]: {
      value: metric.value,
      rating,
      navigationType: metric.navigationType,
    },
  });

  // Optionally send to analytics endpoint
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating,
      id: metric.id,
      navigationType: metric.navigationType,
      url: window.location.href,
      timestamp: Date.now(),
    });

    // Use sendBeacon for reliability (works even if page is closing)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(import.meta.env.VITE_ANALYTICS_ENDPOINT, body);
    } else {
      fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
        method: 'POST',
        body,
        keepalive: true,
      }).catch(() => {
        // Silently fail - analytics shouldn't break the app
      });
    }
  }
}

export function initWebVitals() {
  // Core Web Vitals (2024+)
  onCLS(reportMetric); // Cumulative Layout Shift
  onLCP(reportMetric); // Largest Contentful Paint
  onINP(reportMetric); // Interaction to Next Paint (replaced FID)

  // Other useful metrics
  onFCP(reportMetric); // First Contentful Paint
  onTTFB(reportMetric); // Time to First Byte
}
