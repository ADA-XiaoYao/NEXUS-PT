import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
  boolean,
  index,
  foreignKey,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Penetration Test Projects
 * Represents a single penetration testing engagement
 */
export const pentestProjects = mysqlTable(
  "pentest_projects",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["planning", "in_progress", "completed", "archived"]).default("planning").notNull(),
    scope: text("scope").notNull(), // JSON: target domains, IPs, ranges
    objectives: text("objectives").notNull(), // JSON: test objectives
    constraints: text("constraints"), // JSON: legal constraints, time limits
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_user_id").on(table.userId),
    statusIdx: index("idx_status").on(table.status),
  })
);

export type PentestProject = typeof pentestProjects.$inferSelect;
export type InsertPentestProject = typeof pentestProjects.$inferInsert;

/**
 * Targets
 * Individual systems/services being tested
 */
export const targets = mysqlTable(
  "targets",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("project_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: mysqlEnum("type", ["domain", "ip", "ip_range", "service", "application"]).notNull(),
    value: varchar("value", { length: 1024 }).notNull(), // domain, IP, or range
    description: text("description"),
    osType: varchar("os_type", { length: 100 }), // Linux, Windows, macOS, etc.
    status: mysqlEnum("status", ["discovered", "assessed", "exploited", "cleaned"]).default("discovered").notNull(),
    metadata: json("metadata"), // Additional target information
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("idx_target_project_id").on(table.projectId),
    typeIdx: index("idx_target_type").on(table.type),
  })
);

export type Target = typeof targets.$inferSelect;
export type InsertTarget = typeof targets.$inferInsert;

/**
 * Services
 * Services running on targets
 */
export const services = mysqlTable(
  "services",
  {
    id: int("id").autoincrement().primaryKey(),
    targetId: int("target_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    port: int("port").notNull(),
    protocol: varchar("protocol", { length: 50 }).notNull(), // tcp, udp
    version: varchar("version", { length: 255 }),
    fingerprint: text("fingerprint"), // Service identification data
    metadata: json("metadata"), // Additional service info
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    targetIdIdx: index("idx_service_target_id").on(table.targetId),
    portIdx: index("idx_service_port").on(table.port),
  })
);

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Vulnerabilities
 * Discovered vulnerabilities
 */
export const vulnerabilities = mysqlTable(
  "vulnerabilities",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("project_id").notNull(),
    serviceId: int("service_id"),
    cveId: varchar("cve_id", { length: 50 }),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    type: varchar("type", { length: 100 }).notNull(), // SQLi, XSS, RCE, etc.
    severity: mysqlEnum("severity", ["critical", "high", "medium", "low", "info"]).notNull(),
    cvssScore: decimal("cvss_score", { precision: 3, scale: 1 }),
    exploitable: boolean("exploitable").default(false),
    exploitedAt: timestamp("exploited_at"),
    evidence: json("evidence"), // Proof data, screenshots, etc.
    remediation: text("remediation"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("idx_vuln_project_id").on(table.projectId),
    serviceIdIdx: index("idx_vuln_service_id").on(table.serviceId),
    cveIdIdx: index("idx_vuln_cve_id").on(table.cveId),
    severityIdx: index("idx_vuln_severity").on(table.severity),
  })
);

export type Vulnerability = typeof vulnerabilities.$inferSelect;
export type InsertVulnerability = typeof vulnerabilities.$inferInsert;

/**
 * Exploits
 * Exploitation attempts and results
 */
export const exploits = mysqlTable(
  "exploits",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("project_id").notNull(),
    vulnerabilityId: int("vulnerability_id").notNull(),
    tool: varchar("tool", { length: 100 }).notNull(), // metasploit, custom, etc.
    payload: text("payload"),
    status: mysqlEnum("status", ["attempted", "successful", "failed", "partial"]).notNull(),
    accessLevel: varchar("access_level", { length: 100 }), // user, admin, system, etc.
    evidence: json("evidence"), // Proof of exploitation
    output: text("output"), // Tool output
    executedAt: timestamp("executed_at").defaultNow(),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("idx_exploit_project_id").on(table.projectId),
    vulnerabilityIdIdx: index("idx_exploit_vuln_id").on(table.vulnerabilityId),
    statusIdx: index("idx_exploit_status").on(table.status),
  })
);

export type Exploit = typeof exploits.$inferSelect;
export type InsertExploit = typeof exploits.$inferInsert;

/**
 * Access Levels
 * Privileges gained during exploitation
 */
export const accessLevels = mysqlTable(
  "access_levels",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("project_id").notNull(),
    exploitId: int("exploit_id").notNull(),
    targetId: int("target_id").notNull(),
    level: varchar("level", { length: 100 }).notNull(), // user, admin, system, root
    username: varchar("username", { length: 255 }),
    privileges: text("privileges"), // JSON: list of privileges
    lateralMovementPossible: boolean("lateral_movement_possible").default(false),
    persistenceMechanism: text("persistence_mechanism"), // Backdoor, scheduled task, etc.
    evidence: json("evidence"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("idx_access_project_id").on(table.projectId),
    exploitIdIdx: index("idx_access_exploit_id").on(table.exploitId),
    targetIdIdx: index("idx_access_target_id").on(table.targetId),
  })
);

export type AccessLevel = typeof accessLevels.$inferSelect;
export type InsertAccessLevel = typeof accessLevels.$inferInsert;

/**
 * Evidence
 * Proof of findings (screenshots, logs, files)
 */
export const evidence = mysqlTable(
  "evidence",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("project_id").notNull(),
    type: mysqlEnum("type", ["screenshot", "log", "file", "command_output", "network_capture"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    s3Key: varchar("s3_key", { length: 1024 }).notNull(), // S3 storage path
    s3Url: varchar("s3_url", { length: 2048 }), // Presigned URL
    mimeType: varchar("mime_type", { length: 100 }),
    fileSize: int("file_size"), // bytes
    relatedVulnerabilityId: int("related_vulnerability_id"),
    relatedExploitId: int("related_exploit_id"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("idx_evidence_project_id").on(table.projectId),
    vulnerabilityIdIdx: index("idx_evidence_vuln_id").on(table.relatedVulnerabilityId),
    exploitIdIdx: index("idx_evidence_exploit_id").on(table.relatedExploitId),
  })
);

export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = typeof evidence.$inferInsert;

/**
 * Reports
 * Generated penetration test reports
 */
export const reports = mysqlTable(
  "reports",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("project_id").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    executiveSummary: text("executive_summary"),
    technicalFindings: text("technical_findings"), // JSON: structured findings
    recommendations: text("recommendations"), // JSON: remediation steps
    status: mysqlEnum("status", ["draft", "review", "final", "archived"]).default("draft").notNull(),
    format: mysqlEnum("format", ["pdf", "html", "markdown"]).default("pdf").notNull(),
    s3Key: varchar("s3_key", { length: 1024 }),
    s3Url: varchar("s3_url", { length: 2048 }),
    generatedAt: timestamp("generated_at"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("idx_report_project_id").on(table.projectId),
    statusIdx: index("idx_report_status").on(table.status),
  })
);

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Tasks
 * Async task queue for agent execution
 */
export const tasks = mysqlTable(
  "tasks",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    projectId: int("project_id").notNull(),
    type: mysqlEnum("type", ["recon", "scan", "vuln_analysis", "exploit", "post_exploit", "report_generation"]).notNull(),
    agentId: varchar("agent_id", { length: 100 }).notNull(),
    status: mysqlEnum("status", ["queued", "running", "completed", "failed", "cancelled"]).default("queued").notNull(),
    priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
    payload: json("payload"), // Task input data
    result: json("result"), // Task output data
    error: text("error"), // Error message if failed
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    timeout: int("timeout"), // seconds
    retries: int("retries").default(0),
    maxRetries: int("max_retries").default(3),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("idx_task_project_id").on(table.projectId),
    statusIdx: index("idx_task_status").on(table.status),
    typeIdx: index("idx_task_type").on(table.type),
  })
);

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Agent Logs
 * Detailed execution logs for audit and debugging
 */
export const agentLogs = mysqlTable(
  "agent_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("project_id").notNull(),
    taskId: varchar("task_id", { length: 64 }),
    agentId: varchar("agent_id", { length: 100 }).notNull(),
    level: mysqlEnum("level", ["debug", "info", "warning", "error"]).notNull(),
    message: text("message").notNull(),
    context: json("context"), // Additional context data
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("idx_log_project_id").on(table.projectId),
    taskIdIdx: index("idx_log_task_id").on(table.taskId),
    agentIdIdx: index("idx_log_agent_id").on(table.agentId),
    levelIdx: index("idx_log_level").on(table.level),
  })
);

export type AgentLog = typeof agentLogs.$inferSelect;
export type InsertAgentLog = typeof agentLogs.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(pentestProjects),
}));

export const projectsRelations = relations(pentestProjects, ({ one, many }) => ({
  user: one(users, {
    fields: [pentestProjects.userId],
    references: [users.id],
  }),
  targets: many(targets),
  vulnerabilities: many(vulnerabilities),
  exploits: many(exploits),
  accessLevels: many(accessLevels),
  evidence: many(evidence),
  reports: many(reports),
  tasks: many(tasks),
  logs: many(agentLogs),
}));

export const targetsRelations = relations(targets, ({ one, many }) => ({
  project: one(pentestProjects, {
    fields: [targets.projectId],
    references: [pentestProjects.id],
  }),
  services: many(services),
  accessLevels: many(accessLevels),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  target: one(targets, {
    fields: [services.targetId],
    references: [targets.id],
  }),
  vulnerabilities: many(vulnerabilities),
}));

export const vulnerabilitiesRelations = relations(vulnerabilities, ({ one, many }) => ({
  project: one(pentestProjects, {
    fields: [vulnerabilities.projectId],
    references: [pentestProjects.id],
  }),
  service: one(services, {
    fields: [vulnerabilities.serviceId],
    references: [services.id],
  }),
  exploits: many(exploits),
  evidence: many(evidence),
}));

export const exploitsRelations = relations(exploits, ({ one, many }) => ({
  project: one(pentestProjects, {
    fields: [exploits.projectId],
    references: [pentestProjects.id],
  }),
  vulnerability: one(vulnerabilities, {
    fields: [exploits.vulnerabilityId],
    references: [vulnerabilities.id],
  }),
  accessLevels: many(accessLevels),
  evidence: many(evidence),
}));

export const accessLevelsRelations = relations(accessLevels, ({ one }) => ({
  project: one(pentestProjects, {
    fields: [accessLevels.projectId],
    references: [pentestProjects.id],
  }),
  exploit: one(exploits, {
    fields: [accessLevels.exploitId],
    references: [exploits.id],
  }),
  target: one(targets, {
    fields: [accessLevels.targetId],
    references: [targets.id],
  }),
}));

export const evidenceRelations = relations(evidence, ({ one }) => ({
  project: one(pentestProjects, {
    fields: [evidence.projectId],
    references: [pentestProjects.id],
  }),
  vulnerability: one(vulnerabilities, {
    fields: [evidence.relatedVulnerabilityId],
    references: [vulnerabilities.id],
  }),
  exploit: one(exploits, {
    fields: [evidence.relatedExploitId],
    references: [exploits.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  project: one(pentestProjects, {
    fields: [reports.projectId],
    references: [pentestProjects.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(pentestProjects, {
    fields: [tasks.projectId],
    references: [pentestProjects.id],
  }),
}));

export const agentLogsRelations = relations(agentLogs, ({ one }) => ({
  project: one(pentestProjects, {
    fields: [agentLogs.projectId],
    references: [pentestProjects.id],
  }),
}));