/**
 * NEXUS-PT Pro: Breach and Attack Simulation Engine
 * Inspired by SafeBreach
 * Automated attack scenario generation and execution simulation
 */

import { nanoid } from "nanoid";

/**
 * Attack Scenario
 */
export interface AttackScenario {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  attackChain: AttackStep[];
  estimatedDuration: number; // seconds
  difficulty: "low" | "medium" | "high" | "very_high";
  requiredAccess: "none" | "user" | "admin";
  successCriteria: string[];
  detectionOpportunities: DetectionOpportunity[];
}

/**
 * Attack Step
 */
export interface AttackStep {
  id: string;
  sequence: number;
  technique: string;
  mitreTechnique: string;
  description: string;
  tools: string[];
  expectedResult: string;
  detectability: "high" | "medium" | "low";
  evasionTechniques: string[];
}

/**
 * Detection Opportunity
 */
export interface DetectionOpportunity {
  step: number;
  detectionMethod: string;
  tool: string;
  effectiveness: number; // 0-1
  falsePositiveRate: number; // 0-1
}

/**
 * Simulation Result
 */
export interface SimulationResult {
  id: string;
  scenarioId: string;
  startTime: Date;
  endTime: Date;
  status: "success" | "partial" | "failed" | "detected";
  stepsCompleted: number;
  totalSteps: number;
  detectionPoint?: number;
  detectedBy?: string;
  evidence: SimulationEvidence[];
  recommendations: string[];
}

/**
 * Simulation Evidence
 */
export interface SimulationEvidence {
  timestamp: Date;
  stepId: string;
  type: "log" | "network" | "process" | "file" | "registry";
  content: string;
  severity: "critical" | "high" | "medium" | "low";
}

/**
 * Breach Simulation Engine
 */
export class BreachSimulationEngine {
  private scenarios: Map<string, AttackScenario> = new Map();
  private results: Map<string, SimulationResult> = new Map();

  constructor() {
    this.initializeScenarios();
  }

  /**
   * Initialize predefined scenarios
   */
  private initializeScenarios(): void {
    // Scenario 1: Initial Access via Phishing
    this.scenarios.set("phishing-initial-access", {
      id: "phishing-initial-access",
      name: "Phishing Attack - Initial Access",
      description: "Simulate initial access through phishing email with malicious attachment",
      objectives: ["Establish initial foothold", "Execute payload", "Establish persistence"],
      attackChain: [
        {
          id: nanoid(),
          sequence: 1,
          technique: "Phishing",
          mitreTechnique: "T1566.002",
          description: "Send phishing email with malicious attachment",
          tools: ["email", "social_engineering"],
          expectedResult: "User opens attachment",
          detectability: "low",
          evasionTechniques: ["Spoofed sender", "Legitimate-looking content"],
        },
        {
          id: nanoid(),
          sequence: 2,
          technique: "Execution",
          mitreTechnique: "T1204.002",
          description: "User executes malicious attachment",
          tools: ["office_macro", "executable"],
          expectedResult: "Payload executed",
          detectability: "medium",
          evasionTechniques: ["Code obfuscation", "Living off the land"],
        },
        {
          id: nanoid(),
          sequence: 3,
          technique: "Persistence",
          mitreTechnique: "T1547.001",
          description: "Establish persistence mechanism",
          tools: ["registry_modification", "scheduled_task"],
          expectedResult: "Backdoor installed",
          detectability: "high",
          evasionTechniques: ["Legitimate process injection", "Registry hiding"],
        },
      ],
      estimatedDuration: 300,
      difficulty: "low",
      requiredAccess: "none",
      successCriteria: [
        "Payload executed on target",
        "Persistence mechanism active",
        "Command and control established",
      ],
      detectionOpportunities: [
        {
          step: 1,
          detectionMethod: "Email Gateway",
          tool: "Email filter",
          effectiveness: 0.7,
          falsePositiveRate: 0.05,
        },
        {
          step: 2,
          detectionMethod: "Endpoint Detection",
          tool: "EDR",
          effectiveness: 0.8,
          falsePositiveRate: 0.1,
        },
        {
          step: 3,
          detectionMethod: "Behavioral Analysis",
          tool: "SIEM",
          effectiveness: 0.6,
          falsePositiveRate: 0.2,
        },
      ],
    });

    // Scenario 2: Lateral Movement
    this.scenarios.set("lateral-movement", {
      id: "lateral-movement",
      name: "Lateral Movement via SMB",
      description: "Simulate lateral movement through SMB exploitation",
      objectives: ["Compromise additional systems", "Escalate privileges", "Access sensitive data"],
      attackChain: [
        {
          id: nanoid(),
          sequence: 1,
          technique: "Network Enumeration",
          mitreTechnique: "T1018",
          description: "Enumerate network and discover systems",
          tools: ["nmap", "net_view"],
          expectedResult: "Network map created",
          detectability: "medium",
          evasionTechniques: ["Slow scanning", "Fragmentation"],
        },
        {
          id: nanoid(),
          sequence: 2,
          technique: "Credential Dumping",
          mitreTechnique: "T1003",
          description: "Extract credentials from compromised system",
          tools: ["mimikatz", "lsass_dump"],
          expectedResult: "Credentials obtained",
          detectability: "high",
          evasionTechniques: ["Living off the land", "Token impersonation"],
        },
        {
          id: nanoid(),
          sequence: 3,
          technique: "Remote Execution",
          mitreTechnique: "T1570",
          description: "Execute commands on remote systems",
          tools: ["psexec", "wmi", "winrm"],
          expectedResult: "Code execution on target",
          detectability: "high",
          evasionTechniques: ["Legitimate tools", "Encrypted channels"],
        },
      ],
      estimatedDuration: 600,
      difficulty: "medium",
      requiredAccess: "user",
      successCriteria: [
        "Multiple systems compromised",
        "Credentials extracted",
        "Lateral movement successful",
      ],
      detectionOpportunities: [
        {
          step: 1,
          detectionMethod: "Network IDS",
          tool: "Zeek/Suricata",
          effectiveness: 0.6,
          falsePositiveRate: 0.15,
        },
        {
          step: 2,
          detectionMethod: "Process Monitoring",
          tool: "Sysmon",
          effectiveness: 0.85,
          falsePositiveRate: 0.05,
        },
        {
          step: 3,
          detectionMethod: "Authentication Logs",
          tool: "Windows Event Log",
          effectiveness: 0.9,
          falsePositiveRate: 0.02,
        },
      ],
    });

    // Scenario 3: Data Exfiltration
    this.scenarios.set("data-exfiltration", {
      id: "data-exfiltration",
      name: "Data Exfiltration",
      description: "Simulate data discovery and exfiltration",
      objectives: ["Locate sensitive data", "Exfiltrate data", "Cover tracks"],
      attackChain: [
        {
          id: nanoid(),
          sequence: 1,
          technique: "Data Discovery",
          mitreTechnique: "T1083",
          description: "Search for sensitive files",
          tools: ["find", "grep", "powershell"],
          expectedResult: "Sensitive files located",
          detectability: "low",
          evasionTechniques: ["Legitimate tools", "Slow enumeration"],
        },
        {
          id: nanoid(),
          sequence: 2,
          technique: "Data Staging",
          mitreTechnique: "T1074",
          description: "Stage data for exfiltration",
          tools: ["tar", "zip", "7z"],
          expectedResult: "Data compressed",
          detectability: "medium",
          evasionTechniques: ["Encryption", "Fragmentation"],
        },
        {
          id: nanoid(),
          sequence: 3,
          technique: "Exfiltration",
          mitreTechnique: "T1020",
          description: "Transfer data out of network",
          tools: ["curl", "sftp", "dns_tunnel"],
          expectedResult: "Data exfiltrated",
          detectability: "high",
          evasionTechniques: ["Encrypted tunnels", "Slow transfer"],
        },
      ],
      estimatedDuration: 900,
      difficulty: "high",
      requiredAccess: "user",
      successCriteria: [
        "Sensitive data identified",
        "Data exfiltrated",
        "Logs cleared",
      ],
      detectionOpportunities: [
        {
          step: 1,
          detectionMethod: "File Integrity Monitoring",
          tool: "OSSEC/Tripwire",
          effectiveness: 0.5,
          falsePositiveRate: 0.3,
        },
        {
          step: 2,
          detectionMethod: "Disk Activity Monitoring",
          tool: "EDR",
          effectiveness: 0.7,
          falsePositiveRate: 0.1,
        },
        {
          step: 3,
          detectionMethod: "Network DLP",
          tool: "DLP Gateway",
          effectiveness: 0.95,
          falsePositiveRate: 0.02,
        },
      ],
    });
  }

  /**
   * Generate attack scenarios
   */
  async generateScenarios(targetProfile: string): Promise<AttackScenario[]> {
    const scenarios: AttackScenario[] = [];

    // Select scenarios based on target profile
    if (targetProfile.includes("enterprise")) {
      scenarios.push(this.scenarios.get("phishing-initial-access")!);
      scenarios.push(this.scenarios.get("lateral-movement")!);
      scenarios.push(this.scenarios.get("data-exfiltration")!);
    } else if (targetProfile.includes("web")) {
      scenarios.push(this.scenarios.get("phishing-initial-access")!);
    } else {
      scenarios.push(...Array.from(this.scenarios.values()));
    }

    return scenarios;
  }

  /**
   * Simulate attack scenario
   */
  async simulateScenario(scenarioId: string): Promise<SimulationResult> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const resultId = nanoid();
    const startTime = new Date();
    const evidence: SimulationEvidence[] = [];

    let stepsCompleted = 0;
    let detectionPoint: number | undefined;
    let detectedBy: string | undefined;
    let status: "success" | "partial" | "failed" | "detected" = "success";

    // Simulate each step
    for (const step of scenario.attackChain) {
      stepsCompleted++;

      // Generate evidence
      evidence.push({
        timestamp: new Date(startTime.getTime() + step.sequence * 10000),
        stepId: step.id,
        type: "log",
        content: `Step ${step.sequence}: ${step.description}`,
        severity: step.detectability === "high" ? "high" : "medium",
      });

      // Check for detection
      const opportunity = scenario.detectionOpportunities.find((d) => d.step === step.sequence);
      if (opportunity && Math.random() < opportunity.effectiveness) {
        detectionPoint = step.sequence;
        detectedBy = opportunity.tool;
        status = "detected";
        break;
      }
    }

    if (status !== "detected") {
      status = stepsCompleted === scenario.attackChain.length ? "success" : "partial";
    }

    const result: SimulationResult = {
      id: resultId,
      scenarioId,
      startTime,
      endTime: new Date(),
      status,
      stepsCompleted,
      totalSteps: scenario.attackChain.length,
      detectionPoint,
      detectedBy,
      evidence,
      recommendations: this.generateRecommendations(scenario, status, detectionPoint),
    };

    this.results.set(resultId, result);
    return result;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    scenario: AttackScenario,
    status: string,
    detectionPoint?: number
  ): string[] {
    const recommendations: string[] = [];

    if (status === "success" || status === "partial") {
      recommendations.push(
        "Implement endpoint detection and response (EDR) solution",
        "Deploy network segmentation",
        "Implement multi-factor authentication",
        "Conduct security awareness training",
        "Review and strengthen access controls"
      );
    }

    if (status === "detected" && detectionPoint) {
      recommendations.push(
        `Detection occurred at step ${detectionPoint}`,
        "Review detection rules and tuning",
        "Implement additional logging and monitoring",
        "Conduct incident response drills"
      );
    }

    return recommendations;
  }

  /**
   * Get scenario
   */
  getScenario(scenarioId: string): AttackScenario | undefined {
    return this.scenarios.get(scenarioId);
  }

  /**
   * Get all scenarios
   */
  getAllScenarios(): AttackScenario[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * Get result
   */
  getResult(resultId: string): SimulationResult | undefined {
    return this.results.get(resultId);
  }

  /**
   * Get all results
   */
  getAllResults(): SimulationResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get detected scenarios
   */
  getDetectedScenarios(): SimulationResult[] {
    return Array.from(this.results.values()).filter((r) => r.status === "detected");
  }

  /**
   * Get successful scenarios
   */
  getSuccessfulScenarios(): SimulationResult[] {
    return Array.from(this.results.values()).filter((r) => r.status === "success");
  }
}

export const breachSimulationEngine = new BreachSimulationEngine();
