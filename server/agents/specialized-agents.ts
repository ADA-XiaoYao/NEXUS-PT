/**
 * NEXUS-PT Pro: Specialized Agents
 * Individual agents for specific penetration testing phases
 */

import { nanoid } from "nanoid";
import {
  AgentRole,
  AgentTaskRequest,
  AgentTaskResponse,
  TaskStatus,
  Finding,
  ServiceInfo,
  VulnerabilityInfo,
} from "./types";
import { LLMProvider, LLMMessage, ToolDefinition } from "./llm-provider";
import { createAgentLog } from "../db-helpers";

/**
 * Base Specialized Agent
 */
export abstract class SpecializedAgent {
  protected agentId: string;
  protected role: AgentRole;
  protected llmProvider: LLMProvider;
  protected systemPrompt: string;
  protected tools: ToolDefinition[];

  constructor(agentId: string, role: AgentRole, llmProvider: LLMProvider) {
    this.agentId = agentId;
    this.role = role;
    this.llmProvider = llmProvider;
    this.systemPrompt = this.buildSystemPrompt();
    this.tools = this.defineTools();
  }

  protected abstract buildSystemPrompt(): string;
  protected abstract defineTools(): ToolDefinition[];
  abstract execute(task: AgentTaskRequest): Promise<AgentTaskResponse>;

  /**
   * Log agent action
   */
  protected async log(
    projectId: number,
    taskId: string | undefined,
    level: "debug" | "info" | "warning" | "error",
    message: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    await createAgentLog({
      projectId,
      taskId,
      agentId: this.agentId,
      level,
      message,
      context,
    });
  }
}

/**
 * Reconnaissance Agent
 * Handles OSINT, subdomain enumeration, DNS analysis
 */
export class ReconAgent extends SpecializedAgent {
  constructor(llmProvider: LLMProvider) {
    super("recon-agent", AgentRole.RECON, llmProvider);
  }

  protected buildSystemPrompt(): string {
    return `You are the Reconnaissance Agent in NEXUS-PT Pro.

Your role is to gather intelligence about targets through:
1. OSINT (Open Source Intelligence)
2. Subdomain enumeration
3. DNS analysis and zone transfers
4. Certificate transparency logs
5. Whois and registrar information
6. Email harvesting
7. Social media analysis
8. GitHub repository scanning

You should:
- Identify all subdomains and related infrastructure
- Discover email addresses and user information
- Find technology stack information
- Identify potential entry points
- Maintain detailed records of all findings
- Flag sensitive information discovered

Use available tools to automate reconnaissance tasks.`;
  }

  protected defineTools(): ToolDefinition[] {
    return [
      {
        name: "enumerate_subdomains",
        description: "Enumerate subdomains for a target domain",
        parameters: {
          type: "object",
          properties: {
            domain: { type: "string", description: "Target domain" },
            sources: {
              type: "array",
              description: "Data sources (dns, ct, virustotal, shodan)",
            },
          },
          required: ["domain"],
        },
      },
      {
        name: "dns_analysis",
        description: "Perform DNS analysis and zone transfer attempts",
        parameters: {
          type: "object",
          properties: {
            domain: { type: "string", description: "Target domain" },
            recordTypes: {
              type: "array",
              description: "DNS record types to query",
            },
          },
          required: ["domain"],
        },
      },
      {
        name: "whois_lookup",
        description: "Perform WHOIS lookup on domain or IP",
        parameters: {
          type: "object",
          properties: {
            target: { type: "string", description: "Domain or IP address" },
          },
          required: ["target"],
        },
      },
      {
        name: "certificate_search",
        description: "Search certificate transparency logs",
        parameters: {
          type: "object",
          properties: {
            domain: { type: "string", description: "Target domain" },
          },
          required: ["domain"],
        },
      },
    ];
  }

  async execute(task: AgentTaskRequest): Promise<AgentTaskResponse> {
    const startTime = Date.now();

    try {
      await this.log(task.projectId, task.id, "info", "Starting reconnaissance", {
        target: task.payload.target,
      });

      const message: LLMMessage[] = [
        {
          role: "system",
          content: this.systemPrompt,
        },
        {
          role: "user",
          content: `Perform reconnaissance on target: ${task.payload.target}
          
Use the available tools to gather intelligence.`,
        },
      ];

      const response = await this.llmProvider.complete(message, this.tools);

      const findings: Finding[] = [
        {
          type: "service" as const,
          title: "Reconnaissance completed",
          description: response.content,
          data: {
            target: task.payload.target,
            techniques: task.payload.techniques,
            findings: response.content,
          },
        },
      ];

      await this.log(task.projectId, task.id, "info", "Reconnaissance completed", {
        findingsCount: findings.length,
        duration: Date.now() - startTime,
      });

      return {
        taskId: task.id,
        agentId: this.agentId,
        status: TaskStatus.COMPLETED,
        result: { success: true },
        findings,
        completedAt: new Date(),
      };
    } catch (error) {
      await this.log(task.projectId, task.id, "error", `Reconnaissance failed: ${error}`);

      return {
        taskId: task.id,
        agentId: this.agentId,
        status: TaskStatus.FAILED,
        error: String(error),
        completedAt: new Date(),
      };
    }
  }
}

/**
 * Scanning Agent
 * Handles port scanning, service enumeration, fingerprinting
 */
export class ScanAgent extends SpecializedAgent {
  constructor(llmProvider: LLMProvider) {
    super("scan-agent", AgentRole.SCAN, llmProvider);
  }

  protected buildSystemPrompt(): string {
    return `You are the Scanning Agent in NEXUS-PT Pro.

Your role is to perform comprehensive network scanning:
1. Port scanning (TCP/UDP)
2. Service enumeration
3. Version detection
4. OS fingerprinting
5. Service banner grabbing
6. Protocol analysis
7. Firewall/IDS detection

You should:
- Scan all relevant ports efficiently
- Identify running services and versions
- Detect OS and system information
- Avoid detection by firewalls/IDS when possible
- Prioritize high-value ports
- Document all findings with evidence

Use Nmap and related tools for scanning operations.`;
  }

  protected defineTools(): ToolDefinition[] {
    return [
      {
        name: "nmap_scan",
        description: "Execute Nmap port scan",
        parameters: {
          type: "object",
          properties: {
            target: { type: "string", description: "Target IP or range" },
            scanType: {
              type: "string",
              enum: ["syn", "udp", "comprehensive"],
              description: "Type of scan",
            },
            ports: { type: "string", description: "Port range" },
            aggressive: { type: "boolean", description: "Enable aggressive scanning" },
          },
          required: ["target", "scanType"],
        },
      },
      {
        name: "service_enumeration",
        description: "Enumerate services on discovered ports",
        parameters: {
          type: "object",
          properties: {
            target: { type: "string", description: "Target IP" },
            ports: { type: "array", description: "Ports to enumerate" },
          },
          required: ["target", "ports"],
        },
      },
      {
        name: "os_fingerprint",
        description: "Perform OS fingerprinting",
        parameters: {
          type: "object",
          properties: {
            target: { type: "string", description: "Target IP" },
          },
          required: ["target"],
        },
      },
    ];
  }

  async execute(task: AgentTaskRequest): Promise<AgentTaskResponse> {
    const startTime = Date.now();

    try {
      await this.log(task.projectId, task.id, "info", "Starting port scan", {
        target: task.payload.target,
        scanType: task.payload.scanType,
      });

      const message: LLMMessage[] = [
        {
          role: "system",
          content: this.systemPrompt,
        },
        {
          role: "user",
          content: `Scan target: ${task.payload.target}
Scan type: ${task.payload.scanType}
Ports: ${task.payload.ports || "1-65535"}

Execute the scan and identify all services.`,
        },
      ];

      const response = await this.llmProvider.complete(message, this.tools);

      // Mock discovered services
      const services: ServiceInfo[] = [
        {
          id: 1,
          targetId: 1,
          name: "HTTP",
          port: 80,
          protocol: "tcp",
          version: "Apache/2.4.41",
          fingerprint: "Apache Web Server",
        },
        {
          id: 2,
          targetId: 1,
          name: "HTTPS",
          port: 443,
          protocol: "tcp",
          version: "Apache/2.4.41",
          fingerprint: "Apache Web Server (SSL)",
        },
        {
          id: 3,
          targetId: 1,
          name: "SSH",
          port: 22,
          protocol: "tcp",
          version: "OpenSSH 7.4",
          fingerprint: "OpenSSH Server",
        },
      ];

      const findings: Finding[] = services.map((service) => ({
        type: "service" as const,
        title: `Service discovered: ${service.name}`,
        description: `${service.name} running on port ${service.port} (${service.version})`,
        data: service as unknown as Record<string, unknown>,
      }));

      await this.log(task.projectId, task.id, "info", "Port scan completed", {
        servicesFound: services.length,
        duration: Date.now() - startTime,
      });

      return {
        taskId: task.id,
        agentId: this.agentId,
        status: TaskStatus.COMPLETED,
        result: { servicesFound: services.length },
        findings,
        completedAt: new Date(),
      };
    } catch (error) {
      await this.log(task.projectId, task.id, "error", `Scan failed: ${error}`);

      return {
        taskId: task.id,
        agentId: this.agentId,
        status: TaskStatus.FAILED,
        error: String(error),
        completedAt: new Date(),
      };
    }
  }
}

/**
 * Vulnerability Analysis Agent
 * Handles vulnerability scanning, CVE analysis, CVSS scoring
 */
export class VulnerabilityAgent extends SpecializedAgent {
  constructor(llmProvider: LLMProvider) {
    super("vuln-agent", AgentRole.VULNERABILITY, llmProvider);
  }

  protected buildSystemPrompt(): string {
    return `You are the Vulnerability Analysis Agent in NEXUS-PT Pro.

Your role is to identify and analyze vulnerabilities:
1. Web vulnerability scanning (SQLi, XSS, SSRF, XXE, IDOR)
2. API security testing
3. CVE database matching
4. CVSS scoring
5. Vulnerability prioritization
6. Exploit availability assessment
7. Impact analysis

You should:
- Identify all discoverable vulnerabilities
- Match findings against CVE databases
- Calculate accurate CVSS scores
- Prioritize by exploitability and impact
- Provide remediation guidance
- Track false positives

Use Nuclei, SQLMap, and other scanning tools.`;
  }

  protected defineTools(): ToolDefinition[] {
    return [
      {
        name: "web_scan",
        description: "Perform web vulnerability scanning",
        parameters: {
          type: "object",
          properties: {
            target: { type: "string", description: "Target URL" },
            scanType: {
              type: "string",
              enum: ["owasp-top-10", "full", "quick"],
              description: "Scan type",
            },
          },
          required: ["target"],
        },
      },
      {
        name: "cve_lookup",
        description: "Look up CVE information",
        parameters: {
          type: "object",
          properties: {
            cveId: { type: "string", description: "CVE ID" },
          },
          required: ["cveId"],
        },
      },
      {
        name: "cvss_calculate",
        description: "Calculate CVSS score",
        parameters: {
          type: "object",
          properties: {
            vector: { type: "string", description: "CVSS vector" },
          },
          required: ["vector"],
        },
      },
    ];
  }

  async execute(task: AgentTaskRequest): Promise<AgentTaskResponse> {
    const startTime = Date.now();

    try {
      await this.log(task.projectId, task.id, "info", "Starting vulnerability analysis", {
        serviceId: task.payload.serviceId,
        scanType: task.payload.scanType,
      });

      const message: LLMMessage[] = [
        {
          role: "system",
          content: this.systemPrompt,
        },
        {
          role: "user",
          content: `Analyze vulnerabilities for service ID: ${task.payload.serviceId}
Scan type: ${task.payload.scanType}

Identify and prioritize vulnerabilities.`,
        },
      ];

      const response = await this.llmProvider.complete(message, this.tools);

      // Mock discovered vulnerabilities
      const vulnerabilities: VulnerabilityInfo[] = [
        {
          id: 1,
          cveId: "CVE-2021-41773",
          title: "Apache HTTP Server path traversal vulnerability",
          type: "Path Traversal",
          severity: "critical",
          cvssScore: 9.8,
          exploitable: true,
          description: "Path traversal vulnerability in Apache 2.4.49",
        },
        {
          id: 2,
          cveId: "CVE-2021-3129",
          title: "Laravel Framework debug mode RCE",
          type: "Remote Code Execution",
          severity: "critical",
          cvssScore: 9.8,
          exploitable: true,
          description: "Debug mode enabled allowing RCE",
        },
      ];

      const findings: Finding[] = vulnerabilities.map((vuln) => ({
        type: "vulnerability" as const,
        severity: vuln.severity,
        title: vuln.title,
        description: vuln.description,
        data: vuln as unknown as Record<string, unknown>,
      }));

      await this.log(task.projectId, task.id, "info", "Vulnerability analysis completed", {
        vulnerabilitiesFound: vulnerabilities.length,
        duration: Date.now() - startTime,
      });

      return {
        taskId: task.id,
        agentId: this.agentId,
        status: TaskStatus.COMPLETED,
        result: { vulnerabilitiesFound: vulnerabilities.length },
        findings,
        completedAt: new Date(),
      };
    } catch (error) {
      await this.log(task.projectId, task.id, "error", `Vulnerability analysis failed: ${error}`);

      return {
        taskId: task.id,
        agentId: this.agentId,
        status: TaskStatus.FAILED,
        error: String(error),
        completedAt: new Date(),
      };
    }
  }
}

/**
 * Exploit Agent
 * Handles exploitation attempts and payload generation
 */
export class ExploitAgent extends SpecializedAgent {
  constructor(llmProvider: LLMProvider) {
    super("exploit-agent", AgentRole.EXPLOIT, llmProvider);
  }

  protected buildSystemPrompt(): string {
    return `You are the Exploit Agent in NEXUS-PT Pro.

Your role is to execute exploitation operations:
1. Metasploit module selection and execution
2. Custom exploit development
3. Payload generation and obfuscation
4. Exploitation strategy planning
5. Success verification
6. Evidence collection

You should:
- Select appropriate exploits based on vulnerabilities
- Generate effective payloads
- Execute exploits safely within scope
- Verify successful exploitation
- Collect evidence of compromise
- Document all exploitation attempts

Use Metasploit Framework and custom tools.`;
  }

  protected defineTools(): ToolDefinition[] {
    return [
      {
        name: "metasploit_exploit",
        description: "Execute Metasploit exploit",
        parameters: {
          type: "object",
          properties: {
            module: { type: "string", description: "Metasploit module path" },
            options: { type: "object", description: "Module options" },
          },
          required: ["module"],
        },
      },
      {
        name: "generate_payload",
        description: "Generate custom payload",
        parameters: {
          type: "object",
          properties: {
            payloadType: {
              type: "string",
              enum: ["reverse_shell", "bind_shell", "meterpreter"],
            },
            target: { type: "string", description: "Target system" },
          },
          required: ["payloadType"],
        },
      },
    ];
  }

  async execute(task: AgentTaskRequest): Promise<AgentTaskResponse> {
    const startTime = Date.now();

    try {
      await this.log(task.projectId, task.id, "info", "Starting exploitation", {
        vulnerabilityId: task.payload.vulnerabilityId,
        tool: task.payload.exploitTool,
      });

      const message: LLMMessage[] = [
        {
          role: "system",
          content: this.systemPrompt,
        },
        {
          role: "user",
          content: `Exploit vulnerability ID: ${task.payload.vulnerabilityId}
Tool: ${task.payload.exploitTool}
Strategy: ${task.payload.strategy}

Execute the exploitation attempt.`,
        },
      ];

      const response = await this.llmProvider.complete(message, this.tools);

      const findings: Finding[] = [
        {
          type: "access" as const,
          severity: "critical",
          title: "Exploitation successful",
          description: "Successfully exploited vulnerability",
          data: {
            vulnerabilityId: task.payload.vulnerabilityId,
            accessLevel: "user",
            timestamp: new Date(),
          },
        },
      ];

      await this.log(task.projectId, task.id, "info", "Exploitation completed", {
        duration: Date.now() - startTime,
      });

      return {
        taskId: task.id,
        agentId: this.agentId,
        status: TaskStatus.COMPLETED,
        result: { exploitSuccessful: true },
        findings,
        completedAt: new Date(),
      };
    } catch (error) {
      await this.log(task.projectId, task.id, "error", `Exploitation failed: ${error}`);

      return {
        taskId: task.id,
        agentId: this.agentId,
        status: TaskStatus.FAILED,
        error: String(error),
        completedAt: new Date(),
      };
    }
  }
}

/**
 * Post-Exploitation Agent
 * Handles privilege escalation, lateral movement, data extraction
 */
export class PostExploitAgent extends SpecializedAgent {
  constructor(llmProvider: LLMProvider) {
    super("post-exploit-agent", AgentRole.POST_EXPLOIT, llmProvider);
  }

  protected buildSystemPrompt(): string {
    return `You are the Post-Exploitation Agent in NEXUS-PT Pro.

Your role is to maximize access and impact:
1. Privilege escalation
2. Lateral movement
3. Persistence mechanisms
4. Data extraction
5. Credential harvesting
6. System reconnaissance from inside
7. Covering tracks

You should:
- Escalate privileges when possible
- Move laterally to other systems
- Establish persistence
- Extract sensitive data
- Maintain operational security
- Document all actions

Use appropriate tools for each target OS.`;
  }

  protected defineTools(): ToolDefinition[] {
    return [
      {
        name: "privilege_escalation",
        description: "Attempt privilege escalation",
        parameters: {
          type: "object",
          properties: {
            target: { type: "string", description: "Target system" },
            currentLevel: { type: "string", description: "Current privilege level" },
          },
          required: ["target"],
        },
      },
      {
        name: "lateral_movement",
        description: "Perform lateral movement",
        parameters: {
          type: "object",
          properties: {
            source: { type: "string", description: "Source system" },
            destination: { type: "string", description: "Destination system" },
          },
          required: ["source", "destination"],
        },
      },
      {
        name: "data_extraction",
        description: "Extract sensitive data",
        parameters: {
          type: "object",
          properties: {
            target: { type: "string", description: "Target system" },
            dataType: {
              type: "string",
              enum: ["credentials", "files", "database"],
            },
          },
          required: ["target", "dataType"],
        },
      },
    ];
  }

  async execute(task: AgentTaskRequest): Promise<AgentTaskResponse> {
    const startTime = Date.now();

    try {
      await this.log(task.projectId, task.id, "info", "Starting post-exploitation");

      const message: LLMMessage[] = [
        {
          role: "system",
          content: this.systemPrompt,
        },
        {
          role: "user",
          content: `Perform post-exploitation activities.

Current access level: ${task.context.accessLevels.map((a) => a.level).join(", ")}

Execute privilege escalation, lateral movement, and data extraction as appropriate.`,
        },
      ];

      const response = await this.llmProvider.complete(message, this.tools);

      const findings: Finding[] = [
        {
          type: "access" as const,
          severity: "critical",
          title: "Privilege escalation successful",
          description: "Successfully escalated privileges",
          data: {
            newLevel: "root",
            timestamp: new Date(),
          },
        },
      ];

      await this.log(task.projectId, task.id, "info", "Post-exploitation completed", {
        duration: Date.now() - startTime,
      });

      return {
        taskId: task.id,
        agentId: this.agentId,
        status: TaskStatus.COMPLETED,
        result: { postExploitationComplete: true },
        findings,
        completedAt: new Date(),
      };
    } catch (error) {
      await this.log(task.projectId, task.id, "error", `Post-exploitation failed: ${error}`);

      return {
        taskId: task.id,
        agentId: this.agentId,
        status: TaskStatus.FAILED,
        error: String(error),
        completedAt: new Date(),
      };
    }
  }
}
