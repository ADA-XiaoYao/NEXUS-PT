/**
 * NEXUS-PT Pro: Compliance Reporting & Remediation Engine
 * Inspired by XBOW
 * Automated compliance framework mapping, scoring, and remediation guidance
 */

import { nanoid } from "nanoid";

/**
 * Compliance Framework
 */
export type ComplianceFramework = "pci-dss" | "hipaa" | "soc2" | "gdpr" | "iso27001" | "nist";

/**
 * Vulnerability Finding
 */
export interface VulnerabilityFinding {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  cvssScore: number;
  cveId?: string;
  affectedAssets: string[];
  discoveryDate: Date;
}

/**
 * Compliance Mapping
 */
export interface ComplianceMapping {
  framework: ComplianceFramework;
  requirement: string;
  control: string;
  status: "compliant" | "non_compliant" | "partial";
  findings: VulnerabilityFinding[];
  evidence: string[];
}

/**
 * Remediation Guidance
 */
export interface RemediationGuidance {
  id: string;
  findingId: string;
  priority: "immediate" | "high" | "medium" | "low";
  steps: string[];
  estimatedEffort: string; // e.g., "2-4 hours"
  resources: string[];
  successCriteria: string[];
  verification: string;
}

/**
 * Compliance Report
 */
export interface ComplianceReport {
  id: string;
  projectId: number;
  framework: ComplianceFramework;
  generatedDate: Date;
  overallScore: number; // 0-100
  findings: VulnerabilityFinding[];
  mappings: ComplianceMapping[];
  remediationGuidance: RemediationGuidance[];
  executiveSummary: string;
  riskAssessment: RiskAssessment;
  timeline: Timeline;
}

/**
 * Risk Assessment
 */
export interface RiskAssessment {
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  overallRiskLevel: "critical" | "high" | "medium" | "low";
  riskTrend: "increasing" | "stable" | "decreasing";
}

/**
 * Timeline
 */
export interface Timeline {
  discoveryDate: Date;
  remediationDeadline: Date;
  lastAssessment: Date;
  nextAssessment: Date;
}

/**
 * Compliance Reporting Engine
 */
export class ComplianceReportingEngine {
  private reports: Map<string, ComplianceReport> = new Map();
  private frameworkRequirements: Map<ComplianceFramework, string[]> = new Map();

  constructor() {
    this.initializeFrameworkRequirements();
  }

  /**
   * Initialize framework requirements
   */
  private initializeFrameworkRequirements(): void {
    this.frameworkRequirements.set("pci-dss", [
      "1.1 - Firewall Configuration",
      "2.1 - Default Passwords",
      "3.1 - Data Encryption",
      "4.1 - Transmission Security",
      "5.1 - Antivirus",
      "6.1 - Security Patches",
      "7.1 - Access Control",
      "8.1 - User Authentication",
      "9.1 - Physical Security",
      "10.1 - Logging and Monitoring",
      "11.1 - Security Testing",
      "12.1 - Security Policy",
    ]);

    this.frameworkRequirements.set("hipaa", [
      "164.308(a)(1) - Security Management Process",
      "164.308(a)(3) - Workforce Security",
      "164.308(a)(4) - Information Access Management",
      "164.312(a)(1) - Access Controls",
      "164.312(a)(2) - Audit Controls",
      "164.312(b) - Integrity",
      "164.312(c) - Transmission Security",
      "164.308(a)(5) - Security Awareness",
    ]);

    this.frameworkRequirements.set("soc2", [
      "CC6.1 - Logical Access Controls",
      "CC6.2 - Prior to Issuing System Credentials",
      "CC7.1 - System Monitoring",
      "CC7.2 - System Monitoring Tools",
      "CC8.1 - Unauthorized Changes",
      "CC9.1 - Change Management",
      "CC9.2 - Change Management Procedures",
    ]);

    this.frameworkRequirements.set("gdpr", [
      "Article 5 - Principles",
      "Article 25 - Data Protection by Design",
      "Article 32 - Security of Processing",
      "Article 33 - Breach Notification",
      "Article 34 - Communication to Data Subjects",
    ]);

    this.frameworkRequirements.set("iso27001", [
      "A.5.1 - Management Direction",
      "A.6.1 - Internal Organization",
      "A.7.1 - Human Resources",
      "A.8.1 - Asset Management",
      "A.9.1 - Access Control",
      "A.10.1 - Cryptography",
      "A.11.1 - Physical Security",
      "A.12.1 - Operations Security",
      "A.13.1 - Communications Security",
      "A.14.1 - System Acquisition",
      "A.15.1 - Supplier Relationships",
      "A.16.1 - Information Security Incident",
      "A.17.1 - Business Continuity",
      "A.18.1 - Compliance",
    ]);

    this.frameworkRequirements.set("nist", [
      "AC - Access Control",
      "AT - Awareness and Training",
      "AU - Audit and Accountability",
      "CA - Security Assessment",
      "CM - Configuration Management",
      "CP - Contingency Planning",
      "IA - Identification and Authentication",
      "IR - Incident Response",
      "MA - Maintenance",
      "MP - Media Protection",
      "PE - Physical Environmental",
      "PL - Planning",
      "PS - Personnel Security",
      "RA - Risk Assessment",
      "SA - System and Services Acquisition",
      "SC - System and Communications Protection",
      "SI - System and Information Integrity",
    ]);
  }

  /**
   * Generate compliance report
   */
  async generateReport(
    projectId: number,
    framework: ComplianceFramework,
    findings: VulnerabilityFinding[]
  ): Promise<ComplianceReport> {
    const reportId = nanoid();

    // Map findings to compliance requirements
    const mappings = this.mapFindingsToRequirements(framework, findings);

    // Calculate compliance score
    const overallScore = this.calculateComplianceScore(mappings);

    // Generate remediation guidance
    const remediationGuidance = this.generateRemediationGuidance(findings);

    // Assess risks
    const riskAssessment = this.assessRisks(findings);

    // Create timeline
    const timeline: Timeline = {
      discoveryDate: new Date(),
      remediationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      lastAssessment: new Date(),
      nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };

    const report: ComplianceReport = {
      id: reportId,
      projectId,
      framework,
      generatedDate: new Date(),
      overallScore,
      findings,
      mappings,
      remediationGuidance,
      executiveSummary: this.generateExecutiveSummary(framework, findings, overallScore),
      riskAssessment,
      timeline,
    };

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Map findings to compliance requirements
   */
  private mapFindingsToRequirements(
    framework: ComplianceFramework,
    findings: VulnerabilityFinding[]
  ): ComplianceMapping[] {
    const mappings: ComplianceMapping[] = [];
    const requirements = this.frameworkRequirements.get(framework) || [];

    for (const requirement of requirements) {
      const relatedFindings = findings.filter((f) =>
        this.isRelatedToRequirement(f, requirement, framework)
      );

      const status =
        relatedFindings.length === 0
          ? "compliant"
          : relatedFindings.some((f) => f.severity === "critical" || f.severity === "high")
            ? "non_compliant"
            : "partial";

      mappings.push({
        framework,
        requirement,
        control: requirement.split(" - ")[0],
        status,
        findings: relatedFindings,
        evidence: relatedFindings.map((f) => f.id),
      });
    }

    return mappings;
  }

  /**
   * Check if finding is related to requirement
   */
  private isRelatedToRequirement(
    finding: VulnerabilityFinding,
    requirement: string,
    framework: ComplianceFramework
  ): boolean {
    // Simulate relationship mapping
    const keywords = requirement.toLowerCase().split(" ");
    const findingText = finding.title.toLowerCase() + " " + finding.description.toLowerCase();

    return keywords.some((keyword) => findingText.includes(keyword));
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(mappings: ComplianceMapping[]): number {
    if (mappings.length === 0) return 100;

    const compliantCount = mappings.filter((m) => m.status === "compliant").length;
    const partialCount = mappings.filter((m) => m.status === "partial").length;

    const score = (compliantCount * 100 + partialCount * 50) / mappings.length;
    return Math.round(score);
  }

  /**
   * Generate remediation guidance
   */
  private generateRemediationGuidance(findings: VulnerabilityFinding[]): RemediationGuidance[] {
    const guidance: RemediationGuidance[] = [];

    for (const finding of findings) {
      const priority =
        finding.severity === "critical"
          ? "immediate"
          : finding.severity === "high"
            ? "high"
            : finding.severity === "medium"
              ? "medium"
              : "low";

      guidance.push({
        id: nanoid(),
        findingId: finding.id,
        priority,
        steps: this.generateRemediationSteps(finding),
        estimatedEffort: this.estimateRemediationEffort(finding),
        resources: this.getRemediationResources(finding),
        successCriteria: this.getSuccessCriteria(finding),
        verification: this.getVerificationMethod(finding),
      });
    }

    return guidance;
  }

  /**
   * Generate remediation steps
   */
  private generateRemediationSteps(finding: VulnerabilityFinding): string[] {
    return [
      "1. Assess the current state and impact",
      "2. Plan remediation approach",
      "3. Implement fix or mitigation",
      "4. Test the remediation",
      "5. Deploy to production",
      "6. Monitor for effectiveness",
      "7. Document changes",
    ];
  }

  /**
   * Estimate remediation effort
   */
  private estimateRemediationEffort(finding: VulnerabilityFinding): string {
    switch (finding.severity) {
      case "critical":
        return "1-2 hours";
      case "high":
        return "2-4 hours";
      case "medium":
        return "4-8 hours";
      case "low":
        return "1-2 days";
      default:
        return "Unknown";
    }
  }

  /**
   * Get remediation resources
   */
  private getRemediationResources(finding: VulnerabilityFinding): string[] {
    return [
      "Security team",
      "Development team",
      "System administrator",
      "Security patches/updates",
      "Configuration management tools",
    ];
  }

  /**
   * Get success criteria
   */
  private getSuccessCriteria(finding: VulnerabilityFinding): string[] {
    return [
      "Vulnerability no longer detected in scans",
      "All affected systems updated",
      "Monitoring alerts configured",
      "Documentation updated",
      "Team trained on prevention",
    ];
  }

  /**
   * Get verification method
   */
  private getVerificationMethod(finding: VulnerabilityFinding): string {
    return `Re-scan with ${finding.title} specific tests and confirm resolution`;
  }

  /**
   * Assess risks
   */
  private assessRisks(findings: VulnerabilityFinding[]): RiskAssessment {
    const criticalRisks = findings.filter((f) => f.severity === "critical").length;
    const highRisks = findings.filter((f) => f.severity === "high").length;
    const mediumRisks = findings.filter((f) => f.severity === "medium").length;
    const lowRisks = findings.filter((f) => f.severity === "low").length;

    let overallRiskLevel: "critical" | "high" | "medium" | "low" = "low";
    if (criticalRisks > 0) overallRiskLevel = "critical";
    else if (highRisks > 2) overallRiskLevel = "high";
    else if (mediumRisks > 5) overallRiskLevel = "medium";

    return {
      criticalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      overallRiskLevel,
      riskTrend: "stable",
    };
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(
    framework: ComplianceFramework,
    findings: VulnerabilityFinding[],
    score: number
  ): string {
    const criticalCount = findings.filter((f) => f.severity === "critical").length;
    const highCount = findings.filter((f) => f.severity === "high").length;

    return `
Compliance Assessment Report - ${framework.toUpperCase()}

Overall Compliance Score: ${score}%

Key Findings:
- Critical Issues: ${criticalCount}
- High Issues: ${highCount}
- Total Issues: ${findings.length}

This assessment evaluated the organization's compliance with ${framework.toUpperCase()} requirements.
The identified vulnerabilities and misconfigurations must be addressed to achieve full compliance.

Immediate actions required for critical and high-severity findings.
    `.trim();
  }

  /**
   * Get report
   */
  getReport(reportId: string): ComplianceReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Get all reports
   */
  getAllReports(): ComplianceReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Get reports by framework
   */
  getReportsByFramework(framework: ComplianceFramework): ComplianceReport[] {
    return Array.from(this.reports.values()).filter((r) => r.framework === framework);
  }

  /**
   * Get non-compliant requirements
   */
  getNonCompliantRequirements(reportId: string): ComplianceMapping[] {
    const report = this.reports.get(reportId);
    if (!report) return [];

    return report.mappings.filter((m) => m.status !== "compliant");
  }
}

export const complianceReportingEngine = new ComplianceReportingEngine();
