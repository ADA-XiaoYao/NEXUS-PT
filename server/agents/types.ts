/**
 * NEXUS-PT Pro: AI Agent Type Definitions
 * Core interfaces and types for multi-agent orchestration
 */

/**
 * Agent Roles in the Penetration Testing System
 */
export enum AgentRole {
  ORCHESTRATOR = "orchestrator",
  RECON = "recon",
  SCAN = "scan",
  VULNERABILITY = "vulnerability",
  EXPLOIT = "exploit",
  POST_EXPLOIT = "post_exploit",
}

/**
 * Task Types for Agent Execution
 */
export enum TaskType {
  RECON_SCAN = "recon_scan",
  PORT_SCAN = "port_scan",
  SERVICE_ENUMERATION = "service_enumeration",
  VULNERABILITY_SCAN = "vulnerability_scan",
  CVE_ANALYSIS = "cve_analysis",
  EXPLOIT_ATTEMPT = "exploit_attempt",
  PRIVILEGE_ESCALATION = "privilege_escalation",
  LATERAL_MOVEMENT = "lateral_movement",
  DATA_EXTRACTION = "data_extraction",
  REPORT_GENERATION = "report_generation",
}

/**
 * Task Status Lifecycle
 */
export enum TaskStatus {
  QUEUED = "queued",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

/**
 * Priority Levels for Task Execution
 */
export enum TaskPriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

/**
 * Agent Task Request
 * Sent from Orchestrator to Sub-Agents
 */
export interface AgentTaskRequest {
  id: string;
  type: TaskType;
  projectId: number;
  targetId?: number;
  priority: TaskPriority;
  payload: Record<string, unknown>;
  context: AgentContext;
  timeout: number;
  retries: number;
}

/**
 * Agent Context
 * Shared state and historical information available to agents
 */
export interface AgentContext {
  projectId: number;
  targets: TargetInfo[];
  discoveredServices: ServiceInfo[];
  foundVulnerabilities: VulnerabilityInfo[];
  successfulExploits: ExploitInfo[];
  accessLevels: AccessInfo[];
  constraints: OperationConstraints;
  history: AgentAction[];
}

/**
 * Target Information
 */
export interface TargetInfo {
  id: number;
  name: string;
  type: "domain" | "ip" | "ip_range" | "service" | "application";
  value: string;
  osType?: string;
  status: "discovered" | "assessed" | "exploited" | "cleaned";
  metadata?: Record<string, unknown>;
}

/**
 * Service Information
 */
export interface ServiceInfo {
  id: number;
  targetId: number;
  name: string;
  port: number;
  protocol: "tcp" | "udp";
  version?: string;
  fingerprint?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Vulnerability Information
 */
export interface VulnerabilityInfo {
  id: number;
  cveId?: string;
  title: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  cvssScore?: number;
  exploitable: boolean;
  description?: string;
  remediation?: string;
}

/**
 * Exploit Information
 */
export interface ExploitInfo {
  id: number;
  vulnerabilityId: number;
  tool: string;
  status: "attempted" | "successful" | "failed" | "partial";
  accessLevel?: string;
  evidence?: Record<string, unknown>;
}

/**
 * Access Level Information
 */
export interface AccessInfo {
  id: number;
  targetId: number;
  level: string;
  username?: string;
  privileges: string[];
  lateralMovementPossible: boolean;
  persistenceMechanism?: string;
}

/**
 * Operation Constraints
 */
export interface OperationConstraints {
  scope: string[]; // Allowed targets
  timeLimit?: number; // Seconds
  toolWhitelist?: string[]; // Allowed tools
  techniques?: string[]; // Allowed techniques (MITRE ATT&CK)
  legalConstraints?: string;
}

/**
 * Agent Action (for history tracking)
 */
export interface AgentAction {
  timestamp: Date;
  agentId: string;
  action: string;
  target?: string;
  result: "success" | "failure" | "partial";
  details?: Record<string, unknown>;
}

/**
 * Agent Task Response
 * Returned from Sub-Agents to Orchestrator
 */
export interface AgentTaskResponse {
  taskId: string;
  agentId: string;
  status: TaskStatus;
  result?: Record<string, unknown>;
  error?: string;
  findings?: Finding[];
  nextActions?: AgentTaskRequest[];
  completedAt: Date;
}

/**
 * Finding from Agent Execution
 */
export interface Finding {
  type: "service" | "vulnerability" | "access" | "evidence";
  severity?: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description?: string;
  data: Record<string, unknown>;
  evidence?: EvidenceItem[];
}

/**
 * Evidence Item
 */
export interface EvidenceItem {
  type: "screenshot" | "log" | "file" | "command_output" | "network_capture";
  title: string;
  data: string | Buffer;
  mimeType?: string;
}

/**
 * LLM Provider Configuration
 */
export interface LLMConfig {
  provider: "openai" | "anthropic" | "ollama" | "openrouter";
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * Agent Configuration
 */
export interface AgentConfig {
  id: string;
  role: AgentRole;
  llmConfig: LLMConfig;
  tools: ToolDefinition[];
  systemPrompt: string;
  maxRetries: number;
  timeout: number;
}

/**
 * Tool Definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ParameterDefinition>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Parameter Definition
 */
export interface ParameterDefinition {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  enum?: unknown[];
}

/**
 * Agent State
 */
export interface AgentState {
  agentId: string;
  role: AgentRole;
  status: "idle" | "running" | "error";
  currentTask?: AgentTaskRequest;
  lastAction?: AgentAction;
  errorMessage?: string;
  updatedAt: Date;
}

/**
 * Orchestrator State
 */
export interface OrchestratorState {
  projectId: number;
  status: "planning" | "executing" | "analyzing" | "completed" | "failed";
  objectives: string[];
  currentPhase: string;
  activeTasks: Map<string, AgentTaskRequest>;
  completedTasks: Map<string, AgentTaskResponse>;
  agentStates: Map<string, AgentState>;
  context: AgentContext;
  updatedAt: Date;
}

/**
 * Attack Path
 */
export interface AttackPath {
  id: string;
  name: string;
  steps: AttackStep[];
  successRate: number;
  estimatedDuration: number; // seconds
  complexity: "low" | "medium" | "high";
  impact: "critical" | "high" | "medium" | "low";
}

/**
 * Attack Step
 */
export interface AttackStep {
  order: number;
  description: string;
  technique: string; // MITRE ATT&CK technique
  tools: string[];
  expectedResult: string;
  alternativePaths?: AttackPath[];
}

/**
 * Penetration Test Report
 */
export interface PentestReport {
  projectId: number;
  title: string;
  executiveSummary: string;
  findings: ReportFinding[];
  recommendations: Recommendation[];
  statistics: ReportStatistics;
  generatedAt: Date;
}

/**
 * Report Finding
 */
export interface ReportFinding {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  cvssScore?: number;
  description: string;
  affectedAssets: string[];
  evidence: EvidenceItem[];
  remediation: string;
  references?: string[];
}

/**
 * Recommendation
 */
export interface Recommendation {
  priority: "immediate" | "high" | "medium" | "low";
  title: string;
  description: string;
  estimatedEffort: string;
  affectedAssets: string[];
}

/**
 * Report Statistics
 */
export interface ReportStatistics {
  totalTargets: number;
  totalServices: number;
  totalVulnerabilities: number;
  vulnerabilitiesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  successfulExploits: number;
  accessLevelsGained: string[];
}

/**
 * Neo4j Knowledge Graph Node
 */
export interface KnowledgeGraphNode {
  id: string;
  type: "target" | "service" | "vulnerability" | "exploit" | "access" | "evidence";
  properties: Record<string, unknown>;
  labels: string[];
}

/**
 * Neo4j Knowledge Graph Relationship
 */
export interface KnowledgeGraphRelationship {
  id: string;
  source: string;
  target: string;
  type: string;
  properties?: Record<string, unknown>;
}
