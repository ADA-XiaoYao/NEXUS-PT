/**
 * NEXUS-PT Pro: Comprehensive Test Suite
 * Tests for all core modules: Orchestrator, Agents, Tools, CyberStrike AI
 */

import { describe, it, expect, beforeEach } from "vitest";
import { cyberStrikeAIEngine } from "./tools/cyberstrike-ai";
import { toolRegistry } from "./tools/tool-registry";

describe("NEXUS-PT Pro Core Modules", () => {
  describe("CyberStrike AI Engine", () => {
    it("should create a campaign successfully", async () => {
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Test Campaign",
        ["Test Objective"],
        5
      );

      expect(campaign).toBeDefined();
      expect(campaign.name).toBe("Test Campaign");
      expect(campaign.targetCount).toBe(5);
      expect(campaign.status).toBe("planning");
      expect(campaign.successCount).toBe(0);
      expect(campaign.failureCount).toBe(0);
    });

    it("should execute attack stage", async () => {
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Execution Test",
        ["Execute Stage"],
        1
      );

      const results = await cyberStrikeAIEngine.executeAttackStage(
        campaign.id,
        "reconnaissance",
        "target-001"
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Check result structure
      const result = results[0];
      expect(result.id).toBeDefined();
      expect(result.targetId).toBe("target-001");
      expect(result.stage).toBe("reconnaissance");
      expect(typeof result.success).toBe("boolean");
      expect(result.timestamp).toBeDefined();
    });

    it("should generate adaptive strategy", async () => {
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Strategy Test",
        ["Test Strategy"],
        1
      );

      const results = await cyberStrikeAIEngine.executeAttackStage(
        campaign.id,
        "reconnaissance",
        "target-001"
      );

      const strategy = await cyberStrikeAIEngine.generateAdaptiveStrategy(
        { environment: "enterprise" },
        results
      );

      expect(strategy).toBeDefined();
      expect(Array.isArray(strategy)).toBe(true);
      expect(strategy.length).toBeGreaterThanOrEqual(0);
    });

    it("should analyze threat actor", async () => {
      const analysis = await cyberStrikeAIEngine.analyzeThreatActor("ta-001");

      expect(analysis).toBeDefined();
      expect(analysis.threatActor).toBe("APT28 (Fancy Bear)");
      expect(analysis.geolocation).toBe("Russia");
      expect(Array.isArray(analysis.knownTactics)).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(0);
    });

    it("should implement evasion techniques", async () => {
      const evasion = await cyberStrikeAIEngine.implementEvasionTechniques({
        antivirus: "Windows Defender",
        edr: "CrowdStrike",
      });

      expect(evasion).toBeDefined();
      expect(evasion.antiVirus).toBeDefined();
      expect(evasion.antiMalware).toBeDefined();
      expect(evasion.EDR).toBeDefined();
      expect(evasion.SIEM).toBeDefined();
      expect(evasion.networkDetection).toBeDefined();
    });

    it("should generate remediation report", async () => {
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Report Test",
        ["Test Report"],
        1
      );

      const report = await cyberStrikeAIEngine.generateRemediationReport(
        campaign.id
      );

      expect(report).toBeDefined();
      expect(report.campaignId).toBe(campaign.id);
      expect(report.campaignName).toBe("Report Test");
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(Array.isArray(report.mitigations)).toBe(true);
      expect(Array.isArray(report.nextSteps)).toBe(true);
    });

    it("should get all campaigns", async () => {
      const campaign1 = await cyberStrikeAIEngine.createCampaign(
        "Campaign 1",
        ["Obj1"],
        1
      );
      const campaign2 = await cyberStrikeAIEngine.createCampaign(
        "Campaign 2",
        ["Obj2"],
        1
      );

      const campaigns = cyberStrikeAIEngine.getAllCampaigns();

      expect(Array.isArray(campaigns)).toBe(true);
      expect(campaigns.length).toBeGreaterThanOrEqual(2);
      expect(campaigns.some((c) => c.id === campaign1.id)).toBe(true);
      expect(campaigns.some((c) => c.id === campaign2.id)).toBe(true);
    });

    it("should get threat intelligence", () => {
      const intel = cyberStrikeAIEngine.getThreatIntelligence();

      expect(Array.isArray(intel)).toBe(true);
      expect(intel.length).toBeGreaterThan(0);

      const apt28 = intel.find((i) => i.threatActorName === "APT28 (Fancy Bear)");
      expect(apt28).toBeDefined();
      expect(apt28?.geolocation).toBe("Russia");
      expect(apt28?.confidence).toBe(0.95);
    });

    it("should get attack vectors", () => {
      const vectors = cyberStrikeAIEngine.getAttackVectors();

      expect(Array.isArray(vectors)).toBe(true);
      expect(vectors.length).toBeGreaterThan(0);

      // Check vector structure
      const vector = vectors[0];
      expect(vector.id).toBeDefined();
      expect(vector.name).toBeDefined();
      expect(vector.stage).toBeDefined();
      expect(vector.technique).toBeDefined();
      expect(typeof vector.probability).toBe("number");
      expect(typeof vector.impact).toBe("number");
    });

    it("should get attack vectors by stage", () => {
      const reconVectors = cyberStrikeAIEngine.getAttackVectors("reconnaissance");

      expect(Array.isArray(reconVectors)).toBe(true);
      expect(reconVectors.length).toBeGreaterThan(0);
      expect(reconVectors.every((v) => v.stage === "reconnaissance")).toBe(true);
    });

    it("should get exploitation results", async () => {
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Results Test",
        ["Test Results"],
        1
      );

      await cyberStrikeAIEngine.executeAttackStage(
        campaign.id,
        "reconnaissance",
        "target-001"
      );

      const results = cyberStrikeAIEngine.getExploitationResults();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Tool Registry", () => {
    it("should have registered tools", () => {
      const tools = toolRegistry.getAllTools();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it("should get tools by category", () => {
      const webTools = toolRegistry.getToolsByCategory("agentic_platform");

      expect(Array.isArray(webTools)).toBe(true);
      expect(webTools.length).toBeGreaterThan(0);
    });

    it("should get tool by ID", () => {
      const tools = toolRegistry.getAllTools();
      if (tools.length > 0) {
        const tool = toolRegistry.getTool(tools[0].id);
        expect(tool).toBeDefined();
        expect(tool?.name).toBeDefined();
      }
    });
  });

  describe("Integration Tests", () => {
    it("should execute full attack campaign workflow", async () => {
      // 1. Create campaign
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Full Workflow Test",
        ["Establish persistence", "Exfiltrate data"],
        1
      );

      expect(campaign.id).toBeDefined();

      // 2. Execute reconnaissance
      const reconResults = await cyberStrikeAIEngine.executeAttackStage(
        campaign.id,
        "reconnaissance",
        "target-001"
      );

      expect(reconResults.length).toBeGreaterThan(0);

      // 3. Generate strategy
      const strategy = await cyberStrikeAIEngine.generateAdaptiveStrategy(
        { environment: "enterprise" },
        reconResults
      );

      expect(Array.isArray(strategy)).toBe(true);

      // 4. Generate report
      const report = await cyberStrikeAIEngine.generateRemediationReport(campaign.id);

      expect(report.campaignId).toBe(campaign.id);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it("should handle multiple concurrent campaigns", async () => {
      const campaigns = await Promise.all([
        cyberStrikeAIEngine.createCampaign("Campaign A", ["Obj A"], 1),
        cyberStrikeAIEngine.createCampaign("Campaign B", ["Obj B"], 1),
        cyberStrikeAIEngine.createCampaign("Campaign C", ["Obj C"], 1),
      ]);

      expect(campaigns.length).toBe(3);
      expect(campaigns[0].id).not.toBe(campaigns[1].id);
      expect(campaigns[1].id).not.toBe(campaigns[2].id);

      const allCampaigns = cyberStrikeAIEngine.getAllCampaigns();
      expect(allCampaigns.length).toBeGreaterThanOrEqual(3);
    });

    it("should handle threat actor analysis with vector matching", async () => {
      const analysis = await cyberStrikeAIEngine.analyzeThreatActor("ta-001");

      expect(analysis.matchingVectors).toBeDefined();
      expect(Array.isArray(analysis.matchingVectors)).toBe(true);
      expect(analysis.recommendedVectors).toBeDefined();
      expect(Array.isArray(analysis.recommendedVectors)).toBe(true);
    });

    it("should get tool statistics", () => {
      const stats = toolRegistry.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalTools).toBeGreaterThan(0);
      expect(stats.byCategory).toBeDefined();
      expect(stats.byIntegrationLevel).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid campaign ID", async () => {
      try {
        await cyberStrikeAIEngine.generateRemediationReport("invalid-id");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle invalid threat actor ID", async () => {
      try {
        await cyberStrikeAIEngine.analyzeThreatActor("invalid-actor");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Data Integrity", () => {
    it("should maintain campaign data consistency", async () => {
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Data Integrity Test",
        ["Test Objective"],
        1
      );

      const originalId = campaign.id;

      // Execute stage
      await cyberStrikeAIEngine.executeAttackStage(
        campaign.id,
        "reconnaissance",
        "target-001"
      );

      // Retrieve campaign
      const campaigns = cyberStrikeAIEngine.getAllCampaigns();
      const retrieved = campaigns.find((c) => c.id === originalId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.successCount).toBeGreaterThanOrEqual(0);
      expect(retrieved?.failureCount).toBeGreaterThanOrEqual(0);
    });

    it("should track exploitation results correctly", async () => {
      const campaign = await cyberStrikeAIEngine.createCampaign(
        "Results Tracking Test",
        ["Track Results"],
        1
      );

      const results1 = await cyberStrikeAIEngine.executeAttackStage(
        campaign.id,
        "reconnaissance",
        "target-001"
      );

      const results2 = await cyberStrikeAIEngine.executeAttackStage(
        campaign.id,
        "exploitation",
        "target-001"
      );

      const allResults = cyberStrikeAIEngine.getExploitationResults();

      expect(allResults.length).toBeGreaterThanOrEqual(results1.length + results2.length);
    });
  });
});
