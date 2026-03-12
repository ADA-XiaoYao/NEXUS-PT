/**
 * NEXUS-PT Pro: Performance Monitor & Metrics
 * Real-time performance tracking and optimization insights
 */

export interface PerformanceMetric {
  name: string;
  duration: number; // milliseconds
  timestamp: number;
  status: "success" | "error" | "timeout";
  metadata?: Record<string, unknown>;
}

export interface PerformanceStats {
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
}

/**
 * Performance monitor for tracking operation metrics
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private maxMetricsPerOperation: number = 1000;

  /**
   * Record operation performance
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    const operationMetrics = this.metrics.get(metric.name)!;
    operationMetrics.push(metric);

    // Keep only recent metrics to avoid memory bloat
    if (operationMetrics.length > this.maxMetricsPerOperation) {
      operationMetrics.shift();
    }
  }

  /**
   * Get statistics for an operation
   */
  getStats(operationName: string): PerformanceStats | null {
    const metrics = this.metrics.get(operationName);

    if (!metrics || metrics.length === 0) {
      return null;
    }

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const errorCount = metrics.filter((m) => m.status === "error").length;

    return {
      count: metrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: this.percentile(durations, 0.5),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
      errorRate: errorCount / metrics.length,
    };
  }

  /**
   * Get all operation statistics
   */
  getAllStats(): Record<string, PerformanceStats> {
    const stats: Record<string, PerformanceStats> = {};

    for (const operationName of this.metrics.keys()) {
      const stat = this.getStats(operationName);
      if (stat) {
        stats[operationName] = stat;
      }
    }

    return stats;
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get recent metrics for an operation
   */
  getRecentMetrics(operationName: string, limit: number = 100): PerformanceMetric[] {
    const metrics = this.metrics.get(operationName) || [];
    return metrics.slice(-limit);
  }

  /**
   * Clear metrics for an operation
   */
  clearMetrics(operationName: string): void {
    this.metrics.delete(operationName);
  }

  /**
   * Clear all metrics
   */
  clearAll(): void {
    this.metrics.clear();
  }

  /**
   * Export metrics as JSON
   */
  export(): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    for (const [name, metrics] of this.metrics.entries()) {
      data[name] = {
        stats: this.getStats(name),
        recentMetrics: metrics.slice(-10),
      };
    }

    return data;
  }
}

/**
 * Operation timer for measuring execution time
 */
export class OperationTimer {
  private startTime: number;
  private operationName: string;
  private monitor: PerformanceMonitor;

  constructor(operationName: string, monitor: PerformanceMonitor) {
    this.operationName = operationName;
    this.monitor = monitor;
    this.startTime = Date.now();
  }

  /**
   * End operation and record metric
   */
  end(status: "success" | "error" | "timeout" = "success", metadata?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;

    this.monitor.recordMetric({
      name: this.operationName,
      duration,
      timestamp: Date.now(),
      status,
      metadata,
    });
  }

  /**
   * Get elapsed time
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Resource monitor for tracking system resources
 */
export class ResourceMonitor {
  private samples: Array<{
    timestamp: number;
    memoryUsage: NodeJS.MemoryUsage;
  }> = [];

  private maxSamples: number = 1000;

  /**
   * Sample current resource usage
   */
  sample(): void {
    const memoryUsage = process.memoryUsage();

    this.samples.push({
      timestamp: Date.now(),
      memoryUsage,
    });

    // Keep only recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Get memory usage trend
   */
  getMemoryTrend(windowSize: number = 100): {
    heapUsed: number[];
    heapTotal: number[];
    external: number[];
  } {
    const recent = this.samples.slice(-windowSize);

    return {
      heapUsed: recent.map((s) => s.memoryUsage.heapUsed),
      heapTotal: recent.map((s) => s.memoryUsage.heapTotal),
      external: recent.map((s) => s.memoryUsage.external),
    };
  }

  /**
   * Get average memory usage
   */
  getAverageMemoryUsage(): NodeJS.MemoryUsage {
    if (this.samples.length === 0) {
      return process.memoryUsage();
    }

    const avg = {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0,
      arrayBuffers: 0,
    };

    for (const sample of this.samples) {
      avg.rss += sample.memoryUsage.rss;
      avg.heapTotal += sample.memoryUsage.heapTotal;
      avg.heapUsed += sample.memoryUsage.heapUsed;
      avg.external += sample.memoryUsage.external;
      avg.arrayBuffers += sample.memoryUsage.arrayBuffers || 0;
    }

    const count = this.samples.length;
    return {
      rss: avg.rss / count,
      heapTotal: avg.heapTotal / count,
      heapUsed: avg.heapUsed / count,
      external: avg.external / count,
      arrayBuffers: avg.arrayBuffers / count,
    };
  }

  /**
   * Clear samples
   */
  clear(): void {
    this.samples = [];
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();
export const resourceMonitor = new ResourceMonitor();

/**
 * Decorator for automatic performance tracking
 */
export function TrackPerformance(operationName?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = operationName || `${propertyKey}`;

    descriptor.value = async function (...args: unknown[]) {
      const timer = new OperationTimer(name, performanceMonitor);

      try {
        const result = await originalMethod.apply(this, args);
        timer.end("success");
        return result;
      } catch (error) {
        timer.end("error", { error: String(error) });
        throw error;
      }
    };

    return descriptor;
  };
}
