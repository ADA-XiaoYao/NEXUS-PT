/**
 * Database Helper Functions for NEXUS-PT Pro
 * Reusable query helpers for penetration testing operations
 */

import { eq, and, desc, asc, like, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  pentestProjects,
  targets,
  services,
  vulnerabilities,
  exploits,
  accessLevels,
  evidence,
  reports,
  tasks,
  agentLogs,
  type InsertPentestProject,
  type InsertTarget,
  type InsertService,
  type InsertVulnerability,
  type InsertExploit,
  type InsertAccessLevel,
  type InsertEvidence,
  type InsertReport,
  type InsertTask,
  type InsertAgentLog,
} from "../drizzle/schema";

/**
 * Project Management
 */

export async function createProject(data: InsertPentestProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(pentestProjects).values(data);
  return result;
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(pentestProjects)
    .where(eq(pentestProjects.userId, userId))
    .orderBy(desc(pentestProjects.createdAt));
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(pentestProjects)
    .where(eq(pentestProjects.id, projectId))
    .limit(1);
  
  return result[0];
}

export async function updateProjectStatus(projectId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(pentestProjects)
    .set({ status: status as any })
    .where(eq(pentestProjects.id, projectId));
}

/**
 * Target Management
 */

export async function createTarget(data: InsertTarget) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(targets).values(data);
}

export async function getProjectTargets(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(targets)
    .where(eq(targets.projectId, projectId))
    .orderBy(asc(targets.type));
}

export async function getTargetById(targetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(targets)
    .where(eq(targets.id, targetId))
    .limit(1);
  
  return result[0];
}

export async function updateTargetStatus(targetId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(targets)
    .set({ status: status as any })
    .where(eq(targets.id, targetId));
}

/**
 * Service Management
 */

export async function createService(data: InsertService) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(services).values(data);
}

export async function getTargetServices(targetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(services)
    .where(eq(services.targetId, targetId))
    .orderBy(asc(services.port));
}

export async function getServiceById(serviceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);
  
  return result[0];
}

/**
 * Vulnerability Management
 */

export async function createVulnerability(data: InsertVulnerability) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(vulnerabilities).values(data);
}

export async function getProjectVulnerabilities(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(vulnerabilities)
    .where(eq(vulnerabilities.projectId, projectId))
    .orderBy(desc(vulnerabilities.cvssScore));
}

export async function getServiceVulnerabilities(serviceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(vulnerabilities)
    .where(eq(vulnerabilities.serviceId, serviceId))
    .orderBy(desc(vulnerabilities.cvssScore));
}

export async function getVulnerabilitiesBySeverity(projectId: number, severity: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(vulnerabilities)
    .where(
      and(
        eq(vulnerabilities.projectId, projectId),
        eq(vulnerabilities.severity, severity as any)
      )
    )
    .orderBy(desc(vulnerabilities.cvssScore));
}

export async function updateVulnerabilityStatus(vulnerabilityId: number, exploitable: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(vulnerabilities)
    .set({ exploitable })
    .where(eq(vulnerabilities.id, vulnerabilityId));
}

/**
 * Exploit Management
 */

export async function createExploit(data: InsertExploit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(exploits).values(data);
}

export async function getProjectExploits(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(exploits)
    .where(eq(exploits.projectId, projectId))
    .orderBy(desc(exploits.executedAt));
}

export async function getVulnerabilityExploits(vulnerabilityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(exploits)
    .where(eq(exploits.vulnerabilityId, vulnerabilityId))
    .orderBy(desc(exploits.executedAt));
}

export async function getSuccessfulExploits(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(exploits)
    .where(
      and(
        eq(exploits.projectId, projectId),
        eq(exploits.status, "successful")
      )
    )
    .orderBy(desc(exploits.executedAt));
}

/**
 * Access Level Management
 */

export async function createAccessLevel(data: InsertAccessLevel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(accessLevels).values(data);
}

export async function getProjectAccessLevels(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(accessLevels)
    .where(eq(accessLevels.projectId, projectId))
    .orderBy(desc(accessLevels.createdAt));
}

export async function getTargetAccessLevels(targetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(accessLevels)
    .where(eq(accessLevels.targetId, targetId))
    .orderBy(desc(accessLevels.createdAt));
}

/**
 * Evidence Management
 */

export async function createEvidence(data: InsertEvidence) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(evidence).values(data);
}

export async function getProjectEvidence(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(evidence)
    .where(eq(evidence.projectId, projectId))
    .orderBy(desc(evidence.createdAt));
}

export async function getVulnerabilityEvidence(vulnerabilityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(evidence)
    .where(eq(evidence.relatedVulnerabilityId, vulnerabilityId))
    .orderBy(desc(evidence.createdAt));
}

/**
 * Report Management
 */

export async function createReport(data: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(reports).values(data);
}

export async function getProjectReports(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(reports)
    .where(eq(reports.projectId, projectId))
    .orderBy(desc(reports.createdAt));
}

export async function getReportById(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);
  
  return result[0];
}

export async function updateReportStatus(reportId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(reports)
    .set({ status: status as any })
    .where(eq(reports.id, reportId));
}

/**
 * Task Management
 */

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(tasks).values(data);
}

export async function getProjectTasks(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(desc(tasks.createdAt));
}

export async function getTaskById(taskId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);
  
  return result[0];
}

export async function getQueuedTasks() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(tasks)
    .where(eq(tasks.status, "queued"))
    .orderBy(asc(tasks.createdAt));
}

export async function updateTaskStatus(taskId: string, status: string, result?: any, error?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status: status as any };
  if (result) updateData.result = result;
  if (error) updateData.error = error;
  if (status === "running") updateData.startedAt = new Date();
  if (status === "completed" || status === "failed") updateData.completedAt = new Date();
  
  return await db
    .update(tasks)
    .set(updateData)
    .where(eq(tasks.id, taskId));
}

/**
 * Agent Logging
 */

export async function createAgentLog(data: InsertAgentLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(agentLogs).values(data);
}

export async function getProjectLogs(projectId: number, limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(agentLogs)
    .where(eq(agentLogs.projectId, projectId))
    .orderBy(desc(agentLogs.createdAt))
    .limit(limit);
}

export async function getTaskLogs(taskId: string, limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(agentLogs)
    .where(eq(agentLogs.taskId, taskId))
    .orderBy(desc(agentLogs.createdAt))
    .limit(limit);
}

export async function getAgentLogs(agentId: string, projectId: number, limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(agentLogs)
    .where(
      and(
        eq(agentLogs.agentId, agentId),
        eq(agentLogs.projectId, projectId)
      )
    )
    .orderBy(desc(agentLogs.createdAt))
    .limit(limit);
}

/**
 * Analytics & Reporting
 */

export async function getProjectStats(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const targetCount = await db
    .select()
    .from(targets)
    .where(eq(targets.projectId, projectId));
  
  const vulnCount = await db
    .select()
    .from(vulnerabilities)
    .where(eq(vulnerabilities.projectId, projectId));
  
  const exploitCount = await db
    .select()
    .from(exploits)
    .where(eq(exploits.projectId, projectId));
  
  const successfulExploits = await db
    .select()
    .from(exploits)
    .where(
      and(
        eq(exploits.projectId, projectId),
        eq(exploits.status, "successful")
      )
    );
  
  return {
    targets: targetCount.length,
    vulnerabilities: vulnCount.length,
    exploits: exploitCount.length,
    successfulExploits: successfulExploits.length,
  };
}

export async function getVulnerabilitySummary(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const vulns = await db
    .select()
    .from(vulnerabilities)
    .where(eq(vulnerabilities.projectId, projectId));
  
  const summary = {
    critical: vulns.filter(v => v.severity === "critical").length,
    high: vulns.filter(v => v.severity === "high").length,
    medium: vulns.filter(v => v.severity === "medium").length,
    low: vulns.filter(v => v.severity === "low").length,
    info: vulns.filter(v => v.severity === "info").length,
  };
  
  return summary;
}
