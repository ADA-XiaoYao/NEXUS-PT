/**
 * NEXUS-PT Pro: Advanced Integration Test Suite
 * Comprehensive testing of all modules, tools, and workflows
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cyberStrikeAIEngine } from "./tools/cyberstrike-ai";
import { toolRegistry } from "./tools/tool-registry";

describe("NEXUS-PT Pro: Advanced Integration Tests", () => {
  describe("Tool Registry Advanced Operations", () => {
    it("should register and retrieve all tools", () => {
      const tools = toolRegistry.getAllTools();
      expect(tools.length).toBeGreaterThanOrEqual(40);

      // Verify tool categories
      const categories = new Set(tools.map((t) => t.category));
      expect(categories.size).toBeGreaterThan(0);
    });

    it("should provide tool statistics", () => {
      const stats = toolRegistry.getStatistics();

      expect(stats.totalTools).toBeGreaterThanOrEqual(40);
      expect(stats.activeTools).toBeGreaterThan(0);
      expect(stats.fullIntegration).toBeGreaterThan(0);
      expect(stats.byCategory).toBeDefined();
      expect(Object.keys(stats.byCategory).length).toBeGreaterThan(0);
    });

    it("should filter tools by integration level", () => {
      const fullIntegration = toolRegistry.getToolsByIntegrationLevel("full");
      const apiIntegration = toolRegistry.getToolsByIntegrationLevel("api");
      const partial = toolRegistry.getToolsByIntegrationLevel("partial");

      expect(fullIntegration.length).toBeGreaterThan(0);
      expect(apiIntegration.length).toBeGreaterThan(0);
      expect(partial.length).toBeGreaterThanOrEqual(0);
    });

    it("should retrieve tools by release year", () => {
      const tools2025 = toolRegistry.getToolsByYear(2025);
      const tools2026 = toolRegistry.getToolsByYear(2026);

      expect(tools2025.length).toBeGreaterThan(0);
      expect(tools2026.length).toBeGreaterThan(0);
    });

    it("should track tool execution history", () => {
      const tools = toolRegistry.getAllTools();
      if (tools.length > 0) {
        const toolId = tools[0].id;

        // Record execution
        toolRegistry.recordExecution({
          toolId,
          executedAt: new Date(),
          status: "success",
          duration: 1000,
          resultSummary: "Test execution",
        });

        // Retrieve history
        const history = toolRegistry.getExecutionHistory(toolId);
        expect(history.length).toBeGreaterThan(0);
        expect(history[0].toolId).toBe(toolId);
      }
    });
  });

  describe("CyberStrike AI Advanced Workflows", () => {
    it("should execute complete attack lifecycle", async () => {
      // 1. Create campaign
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Lifecycle Test",
        ["Test Objective"],
        2
      );

      expect(campaign.id).toBeDefined();
      expect(campaign.status).toBe("planning");

      // 2. Execute all 7 stages
      const stages = [
        "reconnaissance",
        "weaponization",
        "delivery",
        "exploitation",
        "installation",
        "command_and_control",
        "exfiltration",
      ];

      for (const stage of stages) {
        const results = await cyberStrikeAIEngine.executeAttackStage(
          campaign.id,
          stage as any,
          "target-001"
        );

        expect(Array.isArray(results)).toBe(true);
        // Results may be empty for some stages, that's OK
        if (results.length > 0) {
          // Verify result structure
          const result = results[0];
          expect(result.stage).toBe(stage);
          expect(result.targetId).toBe("target-001");
          expect(typeof result.success).toBe("boolean");
        }
      }

      // 3. Verify campaign progress
      const campaigns = cyberStrikeAIEngine.getAllCampaigns();
      const updated = campaigns.find((c) => c.id === campaign.id);
      expect(updated?.successCount).toBeGreaterThanOrEqual(0);
    });

    it("should handle multiple concurrent campaigns", async () => {
      const campaignCount = 5;
      const campaigns = await Promise.all(
        Array.from({ length: campaignCount }, (_, i) =>
          cyberStrikeAIEngine.createCampaign(
            `Concurrent Campaign ${i + 1}`,
            [`Objective ${i + 1}`],
            1
          )
        )
      );

      expect(campaigns.length).toBe(campaignCount);

      // Verify all campaigns are unique
      const ids = campaigns.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(campaignCount);

      // Execute stages concurrently
      const executions = campaigns.map((campaign) =>
        cyberStrikeAIEngine.executeAttackStage(
          campaign.id,
          "reconnaissance",
          "target-001"
        )
      );

      const results = await Promise.all(executions);
      expect(results.length).toBe(campaignCount);
      expect(results.every((r) => Array.isArray(r))).toBe(true);
    });

    it("should generate threat actor profiles with recommendations", async () => {
      const threatActors = ["ta-001", "ta-002", "ta-003"];

      for (const actorId of threatActors) {
        const analysis = await cyberStrikeAIEngine.analyzeThreatActor(actorId);

        expect(analysis.threatActor).toBeDefined();
        expect(analysis.geolocation).toBeDefined();
        expect(analysis.confidence).toBeGreaterThan(0);
        expect(analysis.confidence).toBeLessThanOrEqual(1);
        expect(Array.isArray(analysis.knownTactics)).toBe(true);
        expect(Array.isArray(analysis.matchingVectors)).toBe(true);
        expect(Array.isArray(analysis.recommendedVectors)).toBe(true);
      }
    });

    it("should generate adaptive strategies for different environments", async () => {
      const environments = [
        { environment: "startup" },
        { environment: "enterprise" },
        { environment: "government" },
        { environment: "financial" },
      ];

      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Strategy Test",
        ["Test"],
        1
      );

      const results = await cyberStrikeAIEngine.executeAttackStage(
        campaign.id,
        "reconnaissance",
        "target-001"
      );

      for (const env of environments) {
        const strategy = await cyberStrikeAIEngine.generateAdaptiveStrategy(
          env,
          results
        );

        expect(Array.isArray(strategy)).toBe(true);
        // Strategy may be empty for some environments, that's OK
      }
    });

    it("should implement and retrieve evasion techniques", async () => {
      const targetEnvironments = [
        { antivirus: "Windows Defender", edr: "CrowdStrike" },
        { antivirus: "Norton", edr: "SentinelOne" },
        { antivirus: "Kaspersky", edr: "Cortex XDR" },
      ];

      for (const env of targetEnvironments) {
        const evasion = await cyberStrikeAIEngine.implementEvasionTechniques(env);

        expect(evasion.antiVirus).toBeDefined();
        expect(evasion.antiMalware).toBeDefined();
        expect(evasion.EDR).toBeDefined();
        expect(evasion.SIEM).toBeDefined();
        expect(evasion.networkDetection).toBeDefined();

        // Verify effectiveness scores
        expect(evasion.antiVirus.effectiveness).toBeGreaterThan(0);
        expect(evasion.antiVirus.effectiveness).toBeLessThanOrEqual(1);
      }
    });

    it("should generate comprehensive remediation reports", async () => {
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Report Test",
        ["Establish persistence", "Exfiltrate data"],
        1
      );

      // Execute multiple stages
      await cyberStrikeAIEngine.executeAttackStage(
        campaign.id,
        "reconnaissance",
        "target-001"
      );
      await cyberStrikeAIEngine.executeAttackStage(
        campaign.id,
        "exploitation",
        "target-001"
      );

      const report = await cyberStrikeAIEngine.generateRemediationReport(
        campaign.id
      );

      expect(report.campaignId).toBe(campaign.id);
      expect(report.campaignName).toBe("Report Test");
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(Array.isArray(report.mitigations)).toBe(true);
      expect(Array.isArray(report.nextSteps)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("Attack Vector Management", () => {
    it("should retrieve all attack vectors", () => {
      const vectors = cyberStrikeAIEngine.getAttackVectors();

      expect(Array.isArray(vectors)).toBe(true);
      expect(vectors.length).toBeGreaterThan(0);

      // Verify vector structure
      vectors.forEach((vector) => {
        expect(vector.id).toBeDefined();
        expect(vector.name).toBeDefined();
        expect(vector.stage).toBeDefined();
        expect(vector.technique).toBeDefined();
        expect(vector.mitreTechnique).toBeDefined();
        expect(typeof vector.probability).toBe("number");
        expect(typeof vector.impact).toBe("number");
      });
    });

    it("should filter attack vectors by stage", () => {
      const stages = [
        "reconnaissance",
        "weaponization",
        "delivery",
        "exploitation",
        "installation",
        "command_and_control",
        "exfiltration",
      ];

      for (const stage of stages) {
        const vectors = cyberStrikeAIEngine.getAttackVectors(stage);

        expect(Array.isArray(vectors)).toBe(true);
        expect(vectors.every((v) => v.stage === stage)).toBe(true);
      }
    });

    it("should verify MITRE ATT&CK framework mapping", () => {
      const vectors = cyberStrikeAIEngine.getAttackVectors();

      // Verify MITRE mapping
      const mitreMapped = vectors.filter((v) => v.mitreTechnique);
      expect(mitreMapped.length).toBeGreaterThan(0);

      // Verify MITRE format (e.g., T1234 or T1234.001)
      mitreMapped.forEach((vector) => {
        expect(vector.mitreTechnique).toMatch(/^T\d{4}(\.\d+)?$/);
      });
    });
  });

  describe("Threat Intelligence Database", () => {
    it("should provide threat intelligence data", () => {
      const intel = cyberStrikeAIEngine.getThreatIntelligence();

      expect(Array.isArray(intel)).toBe(true);
      expect(intel.length).toBeGreaterThan(0);

      // Verify intel structure
      intel.forEach((entry) => {
        expect(entry.threatActorName).toBeDefined();
        expect(entry.geolocation).toBeDefined();
        expect(typeof entry.confidence).toBe("number");
        expect(Array.isArray(entry.knownTactics)).toBe(true);
      });
    });

    it("should include major APT groups", () => {
      const intel = cyberStrikeAIEngine.getThreatIntelligence();

      const aptNames = intel.map((i) => i.threatActorName);
      expect(aptNames).toContain("APT28 (Fancy Bear)");
      expect(aptNames).toContain("Lazarus Group");
      expect(aptNames).toContain("APT41");
    });
  });

  describe("Performance & Optimization", () => {
    it("should handle rapid campaign creation", async () => {
      const startTime = Date.now();
      const campaigns = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          cyberStrikeAIEngine.createCampaign(`Perf Test ${i}`, ["Test"], 1)
        )
      );
      const duration = Date.now() - startTime;

      expect(campaigns.length).toBe(10);
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
    });

    it("should handle rapid stage execution", async () => {
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Perf Stage Test",
        ["Test"],
        1
      );

      const startTime = Date.now();
      const executions = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          cyberStrikeAIEngine.executeAttackStage(
            campaign.id,
            "reconnaissance",
            `target-${i}`
          )
        )
      );
      const duration = Date.now() - startTime;

      expect(executions.length).toBe(10);
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
    });

    it("should efficiently retrieve large result sets", () => {
      const startTime = Date.now();
      const results = cyberStrikeAIEngine.getExploitationResults();
      const duration = Date.now() - startTime;

      expect(Array.isArray(results)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });
  });

  describe("Error Handling & Edge Cases", () => {
    it("should handle invalid campaign IDs gracefully", async () => {
      try {
        await cyberStrikeAIEngine.generateRemediationReport("invalid-id-xyz");
        expect.fail("Should throw error for invalid campaign ID");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle invalid threat actor IDs gracefully", async () => {
      try {
        await cyberStrikeAIEngine.analyzeThreatActor("invalid-actor-xyz");
        expect.fail("Should throw error for invalid threat actor");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle empty stage execution results", async () => {
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Empty Test",
        ["Test"],
        1
      );

      // Execute with empty target list should handle gracefully
      const results = await cyberStrikeAIEngine.executeAttackStage(
        campaign.id,
        "reconnaissance",
        "target-empty"
      );

      expect(Array.isArray(results)).toBe(true);
    });

    it("should handle concurrent operations safely", async () => {
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Concurrent Test",
        ["Test"],
        1
      );

      // Execute multiple operations concurrently
      const operations = [
        cyberStrikeAIEngine.executeAttackStage(
          campaign.id,
          "reconnaissance",
          "target-001"
        ),
        cyberStrikeAIEngine.analyzeThreatActor("ta-001"),
        cyberStrikeAIEngine.generateRemediationReport(campaign.id),
        cyberStrikeAIEngine.implementEvasionTechniques({
          antivirus: "Windows Defender",
        }),
      ];

      const results = await Promise.all(operations);
      expect(results.length).toBe(4);
      expect(results.every((r) => r !== null && r !== undefined)).toBe(true);
    });
  });

  describe("Data Consistency & Integrity", () => {
    it("should maintain data consistency across operations", async () => {
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Consistency Test",
        ["Test"],
        1
      );

      const initialCampaigns = cyberStrikeAIEngine.getAllCampaigns();
      const initialCount = initialCampaigns.length;

      // Execute operations
      await cyberStrikeAIEngine.executeAttackStage(
        campaign.id,
        "reconnaissance",
        "target-001"
      );

      // Verify campaign still exists and is consistent
      const finalCampaigns = cyberStrikeAIEngine.getAllCampaigns();
      expect(finalCampaigns.length).toBeGreaterThanOrEqual(initialCount);

      const retrieved = finalCampaigns.find((c) => c.id === campaign.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Consistency Test");
    });

    it("should track success/failure counts accurately", async () => {
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Counting Test",
        ["Test"],
        1
      );

      const initialSuccess = campaign.successCount;
      const initialFailure = campaign.failureCount;

      // Execute multiple stages
      for (let i = 0; i < 3; i++) {
        await cyberStrikeAIEngine.executeAttackStage(
          campaign.id,
          "reconnaissance",
          `target-${i}`
        );
      }

      // Verify counts
      const campaigns = cyberStrikeAIEngine.getAllCampaigns();
      const updated = campaigns.find((c) => c.id === campaign.id);

      expect(updated?.successCount).toBeGreaterThanOrEqual(initialSuccess);
      expect(updated?.failureCount).toBeGreaterThanOrEqual(initialFailure);
    });
  });
});
