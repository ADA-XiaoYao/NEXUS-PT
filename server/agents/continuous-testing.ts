/**
 * NEXUS-PT Pro: Continuous Testing Engine
 * Inspired by Aikido Security Infinite
 * Automated background scanning with scheduling and resource management
 */

import { nanoid } from "nanoid";
import { createTask, updateTaskStatus, createAgentLog } from "../db-helpers";

/**
 * Continuous Test Configuration
 */
export interface ContinuousTestConfig {
  projectId: number;
  name: string;
  description?: string;
  enabled: boolean;
  schedule: CronSchedule;
  targets: string[];
  scanTypes: ScanType[];
  maxConcurrentTasks: number;
  resourceLimits: ResourceLimits;
  notificationRules: NotificationRule[];
  retentionPolicy: RetentionPolicy;
}

/**
 * Cron Schedule
 */
export interface CronSchedule {
  frequency: "hourly" | "daily" | "weekly" | "monthly" | "custom";
  customCron?: string;
  timezone?: string;
  startTime?: Date;
  endTime?: Date;
}

/**
 * Scan Types
 */
export type ScanType = "recon" | "port_scan" | "vuln_scan" | "api_scan" | "cloud_scan";

/**
 * Resource Limits
 */
export interface ResourceLimits {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxNetworkBandwidthMbps: number;
  timeoutSeconds: number;
}

/**
 * Notification Rule
 */
export interface NotificationRule {
  trigger: "new_vulnerability" | "critical_finding" | "scan_complete" | "scan_failed";
  severity?: "critical" | "high" | "medium" | "low";
  channels: ("email" | "slack" | "webhook")[];
  webhookUrl?: string;
}

/**
 * Retention Policy
 */
export interface RetentionPolicy {
  keepResultsDays: number;
  archiveAfterDays: number;
  deleteAfterDays: number;
}

/**
 * Continuous Test Execution Record
 */
export interface ContinuousTestExecution {
  id: string;
  configId: string;
  projectId: number;
  startTime: Date;
  endTime?: Date;
  status: "running" | "completed" | "failed" | "cancelled";
  tasksCreated: number;
  tasksCompleted: number;
  vulnerabilitiesFound: number;
  errors?: string[];
}

/**
 * Continuous Testing Engine
 */
export class ContinuousTestingEngine {
  private configs: Map<string, ContinuousTestConfig> = new Map();
  private executions: Map<string, ContinuousTestExecution> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private activeTaskCounts: Map<string, number> = new Map();

  /**
   * Register continuous test configuration
   */
  async registerConfig(config: ContinuousTestConfig): Promise<string> {
    const configId = nanoid();
    this.configs.set(configId, config);
    this.activeTaskCounts.set(configId, 0);

    if (config.enabled) {
      this.scheduleConfig(configId, config);
    }

    await createAgentLog({
      projectId: config.projectId,
      agentId: "continuous-testing",
      level: "info",
      message: `Continuous test registered: ${config.name}`,
      context: { configId, schedule: config.schedule },
    });

    return configId;
  }

  /**
   * Schedule configuration for execution
   */
  private scheduleConfig(configId: string, config: ContinuousTestConfig): void {
    const cronExpression = this.buildCronExpression(config.schedule);

    // Simple scheduler - in production use node-cron or similar
    const interval = this.getIntervalMs(config.schedule);
    const job = setInterval(async () => {
      try {
        await this.executeConfig(configId);
      } catch (error) {
        await createAgentLog({
          projectId: config.projectId,
          agentId: "continuous-testing",
          level: "error",
          message: `Scheduled execution failed: ${error}`,
          context: { configId },
        });
      }
    }, interval);

    this.scheduledJobs.set(configId, job);
  }

  /**
   * Execute configuration
   */
  async executeConfig(configId: string): Promise<void> {
    const config = this.configs.get(configId);
    if (!config || !config.enabled) return;

    const executionId = nanoid();
    const execution: ContinuousTestExecution = {
      id: executionId,
      configId,
      projectId: config.projectId,
      startTime: new Date(),
      status: "running",
      tasksCreated: 0,
      tasksCompleted: 0,
      vulnerabilitiesFound: 0,
    };

    this.executions.set(executionId, execution);

    try {
      await createAgentLog({
        projectId: config.projectId,
        agentId: "continuous-testing",
        level: "info",
        message: `Continuous test execution started: ${config.name}`,
        context: { executionId, configId },
      });

      // Create tasks for each scan type and target
      for (const target of config.targets) {
        for (const scanType of config.scanTypes) {
          // Check concurrent task limit
          const currentTasks = this.activeTaskCounts.get(configId) || 0;
          if (currentTasks >= config.maxConcurrentTasks) {
            await this.waitForTaskSlot(configId, config.maxConcurrentTasks);
          }

          const taskId = await this.createScanTask(
            config.projectId,
            target,
            scanType,
            config.resourceLimits
          );

          execution.tasksCreated++;
          this.activeTaskCounts.set(configId, (currentTasks || 0) + 1);
        }
      }

      execution.status = "completed";
      execution.endTime = new Date();

      await createAgentLog({
        projectId: config.projectId,
        agentId: "continuous-testing",
        level: "info",
        message: `Continuous test execution completed: ${config.name}`,
        context: {
          executionId,
          tasksCreated: execution.tasksCreated,
          vulnerabilitiesFound: execution.vulnerabilitiesFound,
        },
      });

      // Trigger notifications
      await this.triggerNotifications(config, execution);
    } catch (error) {
      execution.status = "failed";
      execution.endTime = new Date();
      execution.errors = [String(error)];

      await createAgentLog({
        projectId: config.projectId,
        agentId: "continuous-testing",
        level: "error",
        message: `Continuous test execution failed: ${error}`,
        context: { executionId },
      });
    }
  }

  /**
   * Create scan task with resource limits
   */
  private async createScanTask(
    projectId: number,
    target: string,
    scanType: ScanType,
    limits: ResourceLimits
  ): Promise<string> {
    const taskId = nanoid();

    const taskTypeMap = {
      recon: "recon",
      port_scan: "scan",
      vuln_scan: "vuln_analysis",
      api_scan: "scan",
      cloud_scan: "scan",
    };

    await createTask({
      id: taskId,
      projectId,
      type: taskTypeMap[scanType] as any,
      agentId: `${scanType}-agent`,
      status: "queued",
      priority: "medium",
      payload: {
        target,
        scanType,
        resourceLimits: limits,
      },
      timeout: limits.timeoutSeconds,
      maxRetries: 2,
    });

    return taskId;
  }

  /**
   * Wait for task slot to become available
   */
  private async waitForTaskSlot(
    configId: string,
    maxConcurrent: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const currentTasks = this.activeTaskCounts.get(configId) || 0;
        if (currentTasks < maxConcurrent) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
  }

  /**
   * Trigger notifications based on rules
   */
  private async triggerNotifications(
    config: ContinuousTestConfig,
    execution: ContinuousTestExecution
  ): Promise<void> {
    for (const rule of config.notificationRules) {
      if (rule.trigger === "scan_complete" && execution.status === "completed") {
        await this.sendNotification(rule, {
          message: `Continuous test completed: ${config.name}`,
          execution,
        });
      } else if (rule.trigger === "scan_failed" && execution.status === "failed") {
        await this.sendNotification(rule, {
          message: `Continuous test failed: ${config.name}`,
          execution,
          errors: execution.errors,
        });
      }
    }
  }

  /**
   * Send notification
   */
  private async sendNotification(
    rule: NotificationRule,
    data: Record<string, unknown>
  ): Promise<void> {
    for (const channel of rule.channels) {
      switch (channel) {
        case "email":
          // TODO: Implement email notification
          console.log("Email notification:", data);
          break;
        case "slack":
          // TODO: Implement Slack notification
          console.log("Slack notification:", data);
          break;
        case "webhook":
          if (rule.webhookUrl) {
            try {
              await fetch(rule.webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
            } catch (error) {
              console.error("Webhook notification failed:", error);
            }
          }
          break;
      }
    }
  }

  /**
   * Build cron expression from schedule
   */
  private buildCronExpression(schedule: CronSchedule): string {
    if (schedule.customCron) {
      return schedule.customCron;
    }

    switch (schedule.frequency) {
      case "hourly":
        return "0 * * * *";
      case "daily":
        return "0 0 * * *";
      case "weekly":
        return "0 0 * * 0";
      case "monthly":
        return "0 0 1 * *";
      default:
        return "0 0 * * *";
    }
  }

  /**
   * Get interval in milliseconds
   */
  private getIntervalMs(schedule: CronSchedule): number {
    switch (schedule.frequency) {
      case "hourly":
        return 60 * 60 * 1000;
      case "daily":
        return 24 * 60 * 60 * 1000;
      case "weekly":
        return 7 * 24 * 60 * 60 * 1000;
      case "monthly":
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Update task completion
   */
  async updateTaskCompletion(configId: string): Promise<void> {
    const currentTasks = this.activeTaskCounts.get(configId) || 0;
    if (currentTasks > 0) {
      this.activeTaskCounts.set(configId, currentTasks - 1);
    }
  }

  /**
   * Get configuration
   */
  getConfig(configId: string): ContinuousTestConfig | undefined {
    return this.configs.get(configId);
  }

  /**
   * Get execution history
   */
  getExecutions(configId: string): ContinuousTestExecution[] {
    return Array.from(this.executions.values()).filter((e) => e.configId === configId);
  }

  /**
   * Disable configuration
   */
  async disableConfig(configId: string): Promise<void> {
    const config = this.configs.get(configId);
    if (config) {
      config.enabled = false;
      const job = this.scheduledJobs.get(configId);
      if (job) {
        clearInterval(job);
        this.scheduledJobs.delete(configId);
      }
    }
  }

  /**
   * Enable configuration
   */
  async enableConfig(configId: string): Promise<void> {
    const config = this.configs.get(configId);
    if (config) {
      config.enabled = true;
      this.scheduleConfig(configId, config);
    }
  }
}

// Singleton instance
export const continuousTestingEngine = new ContinuousTestingEngine();
