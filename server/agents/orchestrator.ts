/**
 * NEXUS-PT Pro: Orchestrator Agent
 * Central coordination engine for multi-agent penetration testing
 * Responsible for: planning, task decomposition, agent coordination, adaptation
 */

import { nanoid } from "nanoid";
import {
  AgentRole,
  AgentTaskRequest,
  AgentTaskResponse,
  TaskType,
  TaskPriority,
  TaskStatus,
  AgentContext,
  OperationConstraints,
  OrchestratorState,
  AgentAction,
  Finding,
  AttackPath,
  AgentState,
} from "./types";
import { LLMProvider, LLMMessage, ToolDefinition, LLMResponseWithTools } from "./llm-provider";
import { createTask, updateTaskStatus, createAgentLog } from "../db-helpers";

/**
 * Orchestrator Agent Class
 * Manages multi-agent penetration testing workflow
 */
export class OrchestratorAgent {
  private projectId: number;
  private llmProvider: LLMProvider;
  private state: OrchestratorState;
  private systemPrompt: string;
  private agentRegistry: Map<string, AgentState> = new Map();
  private tools: ToolDefinition[];

  constructor(projectId: number, llmProvider: LLMProvider) {
    this.projectId = projectId;
    this.llmProvider = llmProvider;
    this.state = {
      projectId,
      status: "planning",
      objectives: [],
      currentPhase: "initialization",
      activeTasks: new Map(),
      completedTasks: new Map(),
      agentStates: new Map(),
      context: {
        projectId,
        targets: [],
        discoveredServices: [],
        foundVulnerabilities: [],
        successfulExploits: [],
        accessLevels: [],
        constraints: {
          scope: [],
          timeLimit: 3600,
          toolWhitelist: ["nmap", "sqlmap", "metasploit", "nuclei"],
          techniques: ["T1592", "T1589", "T1590"], // MITRE ATT&CK
        },
        history: [],
      },
      updatedAt: new Date(),
    };

    this.systemPrompt = this.buildSystemPrompt();
    this.tools = this.definePlanningTools();
  }

  /**
   * Build system prompt for orchestrator
   */
  private buildSystemPrompt(): string {
    return `You are NEXUS-PT Pro Orchestrator - an advanced AI agent coordinating autonomous penetration testing operations.

Your responsibilities:
1. Analyze target scope and create comprehensive attack plans
2. Decompose objectives into specific tasks for specialized agents
3. Coordinate multi-agent execution with dynamic adaptation
4. Prioritize vulnerabilities by exploitability and impact
5. Manage attack chain progression (recon → scan → vuln analysis → exploitation → post-exploitation)
6. Track evidence and maintain operational security
7. Generate actionable recommendations

Core Principles:
- Operate within defined scope and constraints
- Prioritize high-impact vulnerabilities
- Adapt strategy based on real-time findings
- Maintain detailed audit trail of all actions
- Escalate critical findings immediately
- Balance speed with accuracy

Available Agent Roles:
- Recon Agent: OSINT, subdomain enumeration, DNS analysis
- Scan Agent: Port scanning, service enumeration, fingerprinting
- Vulnerability Agent: Vulnerability scanning, CVE analysis, CVSS scoring
- Exploit Agent: Exploitation attempts, payload generation, tool coordination
- Post-Exploit Agent: Privilege escalation, lateral movement, data extraction

You MUST use the provided tools to:
1. Create and manage tasks for specialized agents
2. Analyze findings and adapt strategy
3. Generate attack paths and recommendations
4. Track operational progress`;
  }

  /**
   * Define planning tools for orchestrator
   */
  private definePlanningTools(): ToolDefinition[] {
    return [
      {
        name: "create_recon_task",
        description: "Create reconnaissance task for target discovery and OSINT",
        parameters: {
          type: "object",
          properties: {
            target: {
              type: "string",
              description: "Target domain or IP address",
            },
            techniques: {
              type: "array",
              description: "OSINT techniques to use",
            },
            priority: {
              type: "string",
              enum: ["high", "medium", "low"],
              description: "Task priority",
            },
          },
          required: ["target", "techniques"],
        },
      },
      {
        name: "create_scan_task",
        description: "Create port scanning and service enumeration task",
        parameters: {
          type: "object",
          properties: {
            target: {
              type: "string",
              description: "Target IP or range",
            },
            scanType: {
              type: "string",
              enum: ["syn", "udp", "comprehensive"],
              description: "Type of port scan",
            },
            ports: {
              type: "string",
              description: "Port range (e.g., 1-65535 or 80,443,8080)",
            },
          },
          required: ["target", "scanType"],
        },
      },
      {
        name: "create_vuln_analysis_task",
        description: "Create vulnerability analysis task for discovered services",
        parameters: {
          type: "object",
          properties: {
            serviceId: {
              type: "number",
              description: "Database ID of service to analyze",
            },
            scanType: {
              type: "string",
              enum: ["web", "network", "api"],
              description: "Type of vulnerability scan",
            },
          },
          required: ["serviceId", "scanType"],
        },
      },
      {
        name: "create_exploit_task",
        description: "Create exploitation task for confirmed vulnerability",
        parameters: {
          type: "object",
          properties: {
            vulnerabilityId: {
              type: "number",
              description: "Database ID of vulnerability",
            },
            exploitTool: {
              type: "string",
              enum: ["metasploit", "custom", "nuclei"],
              description: "Tool to use for exploitation",
            },
            strategy: {
              type: "string",
              description: "Exploitation strategy and approach",
            },
          },
          required: ["vulnerabilityId", "exploitTool"],
        },
      },
      {
        name: "analyze_findings",
        description: "Analyze current findings and determine next steps",
        parameters: {
          type: "object",
          properties: {
            findings: {
              type: "array",
              description: "Array of findings to analyze",
            },
            priority: {
              type: "string",
              description: "Prioritization strategy",
            },
          },
          required: ["findings"],
        },
      },
      {
        name: "generate_attack_path",
        description: "Generate optimal attack path based on discovered vulnerabilities",
        parameters: {
          type: "object",
          properties: {
            objective: {
              type: "string",
              description: "Attack objective (e.g., 'gain_admin_access')",
            },
            constraints: {
              type: "object",
              description: "Operational constraints",
            },
          },
          required: ["objective"],
        },
      },
    ];
  }

  /**
   * Initialize orchestrator with project scope and objectives
   */
  async initialize(
    targets: string[],
    objectives: string[],
    constraints: OperationConstraints
  ): Promise<void> {
    this.state.objectives = objectives;
    this.state.context.constraints = constraints;
    this.state.status = "planning";

    // Register specialized agents
    this.registerAgent("recon-agent", AgentRole.RECON);
    this.registerAgent("scan-agent", AgentRole.SCAN);
    this.registerAgent("vuln-agent", AgentRole.VULNERABILITY);
    this.registerAgent("exploit-agent", AgentRole.EXPLOIT);
    this.registerAgent("post-exploit-agent", AgentRole.POST_EXPLOIT);

    // Log initialization
    await createAgentLog({
      projectId: this.projectId,
      agentId: "orchestrator",
      level: "info",
      message: `Orchestrator initialized with ${targets.length} targets and ${objectives.length} objectives`,
      context: {
        targets,
        objectives,
        constraints,
      },
    });
  }

  /**
   * Register an agent in the system
   */
  private registerAgent(agentId: string, role: AgentRole): void {
    this.agentRegistry.set(agentId, {
      agentId,
      role,
      status: "idle",
      updatedAt: new Date(),
    });
    this.state.agentStates.set(agentId, this.agentRegistry.get(agentId)!);
  }

  /**
   * Execute orchestration workflow
   */
  async execute(): Promise<void> {
    try {
      this.state.status = "executing";
      this.state.currentPhase = "reconnaissance";

      // Phase 1: Reconnaissance
      await this.executeReconPhase();

      // Phase 2: Scanning
      this.state.currentPhase = "scanning";
      await this.executeScanPhase();

      // Phase 3: Vulnerability Analysis
      this.state.currentPhase = "vulnerability_analysis";
      await this.executeVulnerabilityPhase();

      // Phase 4: Exploitation
      this.state.currentPhase = "exploitation";
      await this.executeExploitationPhase();

      // Phase 5: Post-Exploitation
      this.state.currentPhase = "post_exploitation";
      await this.executePostExploitationPhase();

      this.state.status = "completed";
      await createAgentLog({
        projectId: this.projectId,
        agentId: "orchestrator",
        level: "info",
        message: "Penetration test execution completed successfully",
        context: {
          totalTasks: this.state.completedTasks.size,
          vulnerabilitiesFound: this.state.context.foundVulnerabilities.length,
          successfulExploits: this.state.context.successfulExploits.length,
        },
      });
    } catch (error) {
      this.state.status = "failed";
      await createAgentLog({
        projectId: this.projectId,
        agentId: "orchestrator",
        level: "error",
        message: `Orchestration failed: ${error}`,
      });
      throw error;
    }
  }

  /**
   * Execute reconnaissance phase
   */
  private async executeReconPhase(): Promise<void> {
    const message: LLMMessage[] = [
      {
        role: "system",
        content: this.systemPrompt,
      },
      {
        role: "user",
        content: `Begin reconnaissance phase for targets: ${this.state.context.constraints.scope.join(", ")}
        
Objectives: ${this.state.objectives.join(", ")}

Create appropriate reconnaissance tasks using the provided tools.`,
      },
    ];

    const response = await this.llmProvider.complete(message, this.tools);
    await this.processOrchestratorResponse(response);
  }

  /**
   * Execute scanning phase
   */
  private async executeScanPhase(): Promise<void> {
    const message: LLMMessage[] = [
      {
        role: "system",
        content: this.systemPrompt,
      },
      {
        role: "user",
        content: `Execute scanning phase based on reconnaissance findings.
        
Discovered targets: ${this.state.context.targets.map((t) => t.value).join(", ")}

Create port scanning and service enumeration tasks for each target.`,
      },
    ];

    const response = await this.llmProvider.complete(message, this.tools);
    await this.processOrchestratorResponse(response);
  }

  /**
   * Execute vulnerability analysis phase
   */
  private async executeVulnerabilityPhase(): Promise<void> {
    const message: LLMMessage[] = [
      {
        role: "system",
        content: this.systemPrompt,
      },
      {
        role: "user",
        content: `Execute vulnerability analysis phase.
        
Discovered services: ${this.state.context.discoveredServices.length}
Services: ${this.state.context.discoveredServices.map((s) => `${s.name}:${s.port}`).join(", ")}

Create vulnerability scanning tasks for each service.`,
      },
    ];

    const response = await this.llmProvider.complete(message, this.tools);
    await this.processOrchestratorResponse(response);
  }

  /**
   * Execute exploitation phase
   */
  private async executeExploitationPhase(): Promise<void> {
    const vulnerableServices = this.state.context.foundVulnerabilities.filter(
      (v) => v.exploitable
    );

    if (vulnerableServices.length === 0) {
      await createAgentLog({
        projectId: this.projectId,
        agentId: "orchestrator",
        level: "info",
        message: "No exploitable vulnerabilities found, skipping exploitation phase",
      });
      return;
    }

    const message: LLMMessage[] = [
      {
        role: "system",
        content: this.systemPrompt,
      },
      {
        role: "user",
        content: `Execute exploitation phase.
        
Exploitable vulnerabilities: ${vulnerableServices.length}
${vulnerableServices.map((v) => `- ${v.title} (CVSS: ${v.cvssScore})`).join("\n")}

Create exploitation tasks prioritized by CVSS score and impact.`,
      },
    ];

    const response = await this.llmProvider.complete(message, this.tools);
    await this.processOrchestratorResponse(response);
  }

  /**
   * Execute post-exploitation phase
   */
  private async executePostExploitationPhase(): Promise<void> {
    if (this.state.context.successfulExploits.length === 0) {
      await createAgentLog({
        projectId: this.projectId,
        agentId: "orchestrator",
        level: "info",
        message: "No successful exploits, skipping post-exploitation phase",
      });
      return;
    }

    const message: LLMMessage[] = [
      {
        role: "system",
        content: this.systemPrompt,
      },
      {
        role: "user",
        content: `Execute post-exploitation phase.
        
Successful exploits: ${this.state.context.successfulExploits.length}
Current access levels: ${this.state.context.accessLevels.map((a) => a.level).join(", ")}

Create post-exploitation tasks for privilege escalation and lateral movement.`,
      },
    ];

    const response = await this.llmProvider.complete(message, this.tools);
    await this.processOrchestratorResponse(response);
  }

  /**
   * Process orchestrator response and create tasks
   */
  private async processOrchestratorResponse(response: LLMResponseWithTools): Promise<void> {
    if (response.toolCalls) {
      for (const toolCall of response.toolCalls) {
        await this.executeTool(toolCall.name, toolCall.arguments);
      }
    }

    // Log orchestrator reasoning
    await createAgentLog({
      projectId: this.projectId,
      agentId: "orchestrator",
      level: "info",
      message: response.content,
      context: {
        phase: this.state.currentPhase,
        toolCalls: response.toolCalls?.length || 0,
      },
    });
  }

  /**
   * Execute tool call from LLM
   */
  private async executeTool(toolName: string, args: Record<string, unknown>): Promise<void> {
    try {
      switch (toolName) {
        case "create_recon_task":
          await this.createReconTask(args);
          break;
        case "create_scan_task":
          await this.createScanTask(args);
          break;
        case "create_vuln_analysis_task":
          await this.createVulnAnalysisTask(args);
          break;
        case "create_exploit_task":
          await this.createExploitTask(args);
          break;
        case "analyze_findings":
          await this.analyzeFindings(args);
          break;
        case "generate_attack_path":
          await this.generateAttackPath(args);
          break;
        default:
          console.warn(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      await createAgentLog({
        projectId: this.projectId,
        agentId: "orchestrator",
        level: "error",
        message: `Tool execution failed: ${toolName}`,
        context: { error: String(error), args },
      });
    }
  }

  /**
   * Create reconnaissance task
   */
  private async createReconTask(args: Record<string, unknown>): Promise<void> {
    const taskId = nanoid();
    const task: AgentTaskRequest = {
      id: taskId,
      type: TaskType.RECON_SCAN,
      projectId: this.projectId,
      priority: (args.priority as TaskPriority) || TaskPriority.MEDIUM,
      payload: {
        target: args.target,
        techniques: args.techniques,
      },
      context: this.state.context,
      timeout: 300,
      retries: 3,
    };

    this.state.activeTasks.set(taskId, task);
    await createTask({
      id: taskId,
      projectId: this.projectId,
      type: "recon",
      agentId: "recon-agent",
      status: "queued",
      priority: task.priority,
      payload: task.payload,
      timeout: task.timeout,
      maxRetries: task.retries,
    });
  }

  /**
   * Create scanning task
   */
  private async createScanTask(args: Record<string, unknown>): Promise<void> {
    const taskId = nanoid();
    const task: AgentTaskRequest = {
      id: taskId,
      type: TaskType.PORT_SCAN,
      projectId: this.projectId,
      priority: TaskPriority.HIGH,
      payload: {
        target: args.target,
        scanType: args.scanType,
        ports: args.ports || "1-65535",
      },
      context: this.state.context,
      timeout: 600,
      retries: 2,
    };

    this.state.activeTasks.set(taskId, task);
    await createTask({
      id: taskId,
      projectId: this.projectId,
      type: "scan",
      agentId: "scan-agent",
      status: "queued",
      priority: task.priority,
      payload: task.payload,
      timeout: task.timeout,
      maxRetries: task.retries,
    });
  }

  /**
   * Create vulnerability analysis task
   */
  private async createVulnAnalysisTask(args: Record<string, unknown>): Promise<void> {
    const taskId = nanoid();
    const task: AgentTaskRequest = {
      id: taskId,
      type: TaskType.VULNERABILITY_SCAN,
      projectId: this.projectId,
      priority: TaskPriority.HIGH,
      payload: {
        serviceId: args.serviceId,
        scanType: args.scanType,
      },
      context: this.state.context,
      timeout: 300,
      retries: 2,
    };

    this.state.activeTasks.set(taskId, task);
    await createTask({
      id: taskId,
      projectId: this.projectId,
      type: "vuln_analysis",
      agentId: "vuln-agent",
      status: "queued",
      priority: task.priority,
      payload: task.payload,
      timeout: task.timeout,
      maxRetries: task.retries,
    });
  }

  /**
   * Create exploitation task
   */
  private async createExploitTask(args: Record<string, unknown>): Promise<void> {
    const taskId = nanoid();
    const task: AgentTaskRequest = {
      id: taskId,
      type: TaskType.EXPLOIT_ATTEMPT,
      projectId: this.projectId,
      priority: TaskPriority.HIGH,
      payload: {
        vulnerabilityId: args.vulnerabilityId,
        exploitTool: args.exploitTool,
        strategy: args.strategy,
      },
      context: this.state.context,
      timeout: 600,
      retries: 3,
    };

    this.state.activeTasks.set(taskId, task);
    await createTask({
      id: taskId,
      projectId: this.projectId,
      type: "exploit",
      agentId: "exploit-agent",
      status: "queued",
      priority: task.priority,
      payload: task.payload,
      timeout: task.timeout,
      maxRetries: task.retries,
    });
  }

  /**
   * Analyze findings and determine next steps
   */
  private async analyzeFindings(args: Record<string, unknown>): Promise<void> {
    const findings = args.findings as Finding[];
    await createAgentLog({
      projectId: this.projectId,
      agentId: "orchestrator",
      level: "info",
      message: `Analyzing ${findings.length} findings`,
      context: {
        findings: findings.map((f) => ({
          type: f.type,
          severity: f.severity,
          title: f.title,
        })),
      },
    });
  }

  /**
   * Generate attack path
   */
  private async generateAttackPath(args: Record<string, unknown>): Promise<AttackPath> {
    const objective = args.objective as string;
    const attackPath: AttackPath = {
      id: nanoid(),
      name: `Attack Path: ${objective}`,
      steps: [
        {
          order: 1,
          description: "Perform reconnaissance",
          technique: "T1592",
          tools: ["nmap", "whois"],
          expectedResult: "Target information gathered",
        },
        {
          order: 2,
          description: "Scan for open ports and services",
          technique: "T1046",
          tools: ["nmap"],
          expectedResult: "Service inventory created",
        },
        {
          order: 3,
          description: "Analyze vulnerabilities",
          technique: "T1592",
          tools: ["nuclei", "sqlmap"],
          expectedResult: "Vulnerabilities identified",
        },
        {
          order: 4,
          description: "Attempt exploitation",
          technique: "T1190",
          tools: ["metasploit"],
          expectedResult: "Initial access gained",
        },
      ],
      successRate: 0.75,
      estimatedDuration: 3600,
      complexity: "medium",
      impact: "high",
    };

    await createAgentLog({
      projectId: this.projectId,
      agentId: "orchestrator",
      level: "info",
      message: `Generated attack path: ${attackPath.name}`,
      context: { attackPath },
    });

    return attackPath;
  }

  /**
   * Handle task completion from sub-agent
   */
  async handleTaskCompletion(response: AgentTaskResponse): Promise<void> {
    const task = this.state.activeTasks.get(response.taskId);
    if (!task) {
      console.warn(`Unknown task: ${response.taskId}`);
      return;
    }

    this.state.activeTasks.delete(response.taskId);
    this.state.completedTasks.set(response.taskId, response);

    // Update context with findings
    if (response.findings) {
      for (const finding of response.findings) {
        if (finding.type === "service") {
          this.state.context.discoveredServices.push(finding.data as any);
        } else if (finding.type === "vulnerability") {
          this.state.context.foundVulnerabilities.push(finding.data as any);
        } else if (finding.type === "access") {
          this.state.context.accessLevels.push(finding.data as any);
        }
      }
    }

    // Log completion
    await createAgentLog({
      projectId: this.projectId,
      taskId: response.taskId,
      agentId: response.agentId,
      level: "info",
      message: `Task completed: ${response.taskId}`,
      context: {
        status: response.status,
        findingsCount: response.findings?.length || 0,
      },
    });
  }

  /**
   * Get current orchestrator state
   */
  getState(): OrchestratorState {
    return this.state;
  }
}
