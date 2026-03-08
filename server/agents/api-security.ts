/**
 * NEXUS-PT Pro: API Security Testing Module
 * Inspired by Strix
 * Comprehensive API reconnaissance, scanning, and vulnerability detection
 */

import { nanoid } from "nanoid";
import { createAgentLog } from "../db-helpers";

/**
 * API Endpoint
 */
export interface APIEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  path: string;
  baseUrl: string;
  description?: string;
  parameters: APIParameter[];
  authentication?: AuthenticationMethod;
  rateLimit?: RateLimit;
  tags?: string[];
}

/**
 * API Parameter
 */
export interface APIParameter {
  name: string;
  type: "query" | "path" | "header" | "body" | "cookie";
  dataType: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
  description?: string;
  example?: unknown;
}

/**
 * Authentication Method
 */
export interface AuthenticationMethod {
  type: "none" | "basic" | "bearer" | "apikey" | "oauth2" | "custom";
  scheme?: string;
  location?: "header" | "query" | "cookie";
  paramName?: string;
}

/**
 * Rate Limit
 */
export interface RateLimit {
  requestsPerSecond: number;
  requestsPerMinute: number;
  burstSize?: number;
}

/**
 * API Vulnerability
 */
export interface APIVulnerability {
  id: string;
  type:
    | "broken_authentication"
    | "broken_authorization"
    | "injection"
    | "excessive_data_exposure"
    | "lack_of_encryption"
    | "improper_asset_management"
    | "insufficient_logging"
    | "rate_limiting";
  severity: "critical" | "high" | "medium" | "low";
  endpoint: string;
  parameter?: string;
  description: string;
  evidence?: string;
  remediation: string;
}

/**
 * API Schema (OpenAPI/GraphQL)
 */
export interface APISchema {
  type: "openapi" | "graphql" | "grpc" | "custom";
  version: string;
  endpoints: APIEndpoint[];
  baseUrl: string;
  authentication?: AuthenticationMethod;
}

/**
 * API Security Tester
 */
export class APISecurityTester {
  private discoveredEndpoints: Map<string, APIEndpoint> = new Map();
  private vulnerabilities: Map<string, APIVulnerability> = new Map();
  private schemas: Map<string, APISchema> = new Map();

  /**
   * Discover API endpoints
   */
  async discoverEndpoints(baseUrl: string, methods: string[] = []): Promise<APIEndpoint[]> {
    const endpoints: APIEndpoint[] = [];

    try {
      // Try to fetch OpenAPI/Swagger documentation
      const swaggerPaths = [
        "/swagger.json",
        "/openapi.json",
        "/api/swagger.json",
        "/api/openapi.json",
        "/v1/swagger.json",
        "/docs/swagger.json",
      ];

      for (const path of swaggerPaths) {
        try {
          const response = await fetch(`${baseUrl}${path}`);
          if (response.ok) {
            const schema = await response.json();
            const discoveredEndpoints = this.parseOpenAPISchema(schema, baseUrl);
            endpoints.push(...discoveredEndpoints);
            break;
          }
        } catch (error) {
          // Continue to next path
        }
      }

      // If no schema found, try common endpoints
      if (endpoints.length === 0) {
        endpoints.push(...(await this.probeCommonEndpoints(baseUrl)));
      }

      // Store discovered endpoints
      for (const endpoint of endpoints) {
        this.discoveredEndpoints.set(endpoint.id, endpoint);
      }

      return endpoints;
    } catch (error) {
      console.error("Endpoint discovery failed:", error);
      return [];
    }
  }

  /**
   * Parse OpenAPI schema
   */
  private parseOpenAPISchema(schema: any, baseUrl: string): APIEndpoint[] {
    const endpoints: APIEndpoint[] = [];

    if (schema.paths) {
      for (const [path, pathItem] of Object.entries(schema.paths)) {
        const methods = ["get", "post", "put", "delete", "patch", "head", "options"];

        for (const method of methods) {
          const operation = (pathItem as any)[method];
          if (!operation) continue;

          const endpoint: APIEndpoint = {
            id: nanoid(),
            method: method.toUpperCase() as any,
            path,
            baseUrl,
            description: operation.summary || operation.description,
            parameters: this.parseParameters(operation.parameters || []),
            authentication: this.parseAuthentication(schema.securitySchemes),
            tags: operation.tags,
          };

          endpoints.push(endpoint);
        }
      }
    }

    return endpoints;
  }

  /**
   * Parse parameters from OpenAPI
   */
  private parseParameters(params: any[]): APIParameter[] {
    return params.map((param) => ({
      name: param.name,
      type: param.in || "query",
      dataType: param.schema?.type || "string",
      required: param.required || false,
      description: param.description,
      example: param.example,
    }));
  }

  /**
   * Parse authentication from OpenAPI
   */
  private parseAuthentication(securitySchemes: any): AuthenticationMethod | undefined {
    if (!securitySchemes) return undefined;

    const schemes = Object.values(securitySchemes) as any[];
    if (schemes.length === 0) return undefined;

    const scheme = schemes[0];
    return {
      type: scheme.type || "custom",
      scheme: scheme.scheme,
      location: scheme.in,
      paramName: scheme.name,
    };
  }

  /**
   * Probe common endpoints
   */
  private async probeCommonEndpoints(baseUrl: string): Promise<APIEndpoint[]> {
    const commonPaths = [
      { path: "/api", methods: ["GET"] },
      { path: "/api/v1", methods: ["GET"] },
      { path: "/api/users", methods: ["GET", "POST"] },
      { path: "/api/products", methods: ["GET", "POST"] },
      { path: "/api/auth", methods: ["POST"] },
      { path: "/api/login", methods: ["POST"] },
      { path: "/api/health", methods: ["GET"] },
      { path: "/api/status", methods: ["GET"] },
    ];

    const endpoints: APIEndpoint[] = [];

    for (const { path, methods } of commonPaths) {
      for (const method of methods) {
        try {
          const response = await fetch(`${baseUrl}${path}`, { method });
          if (response.status !== 404) {
            endpoints.push({
              id: nanoid(),
              method: method as any,
              path,
              baseUrl,
              parameters: [],
            });
          }
        } catch (error) {
          // Endpoint not accessible
        }
      }
    }

    return endpoints;
  }

  /**
   * Test authentication bypass
   */
  async testAuthenticationBypass(endpoint: APIEndpoint): Promise<APIVulnerability[]> {
    const vulnerabilities: APIVulnerability[] = [];

    // Test missing authentication
    try {
      const response = await fetch(`${endpoint.baseUrl}${endpoint.path}`, {
        method: endpoint.method,
      });

      if (response.status !== 401 && response.status !== 403) {
        vulnerabilities.push({
          id: nanoid(),
          type: "broken_authentication",
          severity: "critical",
          endpoint: endpoint.path,
          description: "Endpoint accessible without authentication",
          evidence: `HTTP ${response.status}`,
          remediation: "Implement proper authentication checks",
        });
      }
    } catch (error) {
      // Request failed
    }

    // Test default credentials
    const defaultCredentials = [
      { username: "admin", password: "admin" },
      { username: "admin", password: "password" },
      { username: "test", password: "test" },
    ];

    for (const creds of defaultCredentials) {
      try {
        const auth = Buffer.from(`${creds.username}:${creds.password}`).toString("base64");
        const response = await fetch(`${endpoint.baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: { Authorization: `Basic ${auth}` },
        });

        if (response.status === 200 || response.status === 201) {
          vulnerabilities.push({
            id: nanoid(),
            type: "broken_authentication",
            severity: "critical",
            endpoint: endpoint.path,
            description: `Default credentials accepted: ${creds.username}:${creds.password}`,
            remediation: "Change default credentials and enforce strong passwords",
          });
        }
      } catch (error) {
        // Request failed
      }
    }

    return vulnerabilities;
  }

  /**
   * Test injection vulnerabilities
   */
  async testInjectionVulnerabilities(endpoint: APIEndpoint): Promise<APIVulnerability[]> {
    const vulnerabilities: APIVulnerability[] = [];

    const injectionPayloads = [
      { payload: "' OR '1'='1", type: "SQL Injection" },
      { payload: "<script>alert('XSS')</script>", type: "XSS" },
      { payload: "${7*7}", type: "Template Injection" },
      { payload: "../../etc/passwd", type: "Path Traversal" },
    ];

    for (const param of endpoint.parameters) {
      for (const { payload, type } of injectionPayloads) {
        try {
          const testEndpoint = `${endpoint.baseUrl}${endpoint.path}?${param.name}=${encodeURIComponent(payload)}`;
          const response = await fetch(testEndpoint, { method: endpoint.method });
          const responseText = await response.text();

          // Check for injection indicators
          if (
            responseText.includes("error") ||
            responseText.includes("exception") ||
            responseText.includes("syntax")
          ) {
            vulnerabilities.push({
              id: nanoid(),
              type: "injection",
              severity: "high",
              endpoint: endpoint.path,
              parameter: param.name,
              description: `Potential ${type} vulnerability detected`,
              evidence: `Parameter '${param.name}' appears vulnerable to ${type}`,
              remediation: `Implement input validation and parameterized queries for ${param.name}`,
            });
          }
        } catch (error) {
          // Request failed
        }
      }
    }

    return vulnerabilities;
  }

  /**
   * Test rate limiting
   */
  async testRateLimiting(endpoint: APIEndpoint): Promise<APIVulnerability[]> {
    const vulnerabilities: APIVulnerability[] = [];

    try {
      const requests = 100;
      const startTime = Date.now();

      for (let i = 0; i < requests; i++) {
        await fetch(`${endpoint.baseUrl}${endpoint.path}`, { method: endpoint.method });
      }

      const duration = (Date.now() - startTime) / 1000;
      const requestsPerSecond = requests / duration;

      if (requestsPerSecond > 10) {
        vulnerabilities.push({
          id: nanoid(),
          type: "rate_limiting",
          severity: "medium",
          endpoint: endpoint.path,
          description: "No rate limiting detected",
          evidence: `Processed ${requestsPerSecond.toFixed(2)} requests/second`,
          remediation: "Implement rate limiting to prevent abuse",
        });
      }
    } catch (error) {
      // Rate limiting likely active
    }

    return vulnerabilities;
  }

  /**
   * Test data exposure
   */
  async testDataExposure(endpoint: APIEndpoint): Promise<APIVulnerability[]> {
    const vulnerabilities: APIVulnerability[] = [];

    try {
      const response = await fetch(`${endpoint.baseUrl}${endpoint.path}`, {
        method: endpoint.method,
      });
      const data = await response.text();

      // Check for sensitive data patterns
      const sensitivePatterns = [
        { pattern: /password\s*[:=]/i, name: "Password" },
        { pattern: /api[_-]?key\s*[:=]/i, name: "API Key" },
        { pattern: /token\s*[:=]/i, name: "Token" },
        { pattern: /secret\s*[:=]/i, name: "Secret" },
        { pattern: /\d{3}-\d{2}-\d{4}/, name: "SSN" },
        { pattern: /\d{16}/, name: "Credit Card" },
      ];

      for (const { pattern, name } of sensitivePatterns) {
        if (pattern.test(data)) {
          vulnerabilities.push({
            id: nanoid(),
            type: "excessive_data_exposure",
            severity: "high",
            endpoint: endpoint.path,
            description: `${name} potentially exposed in response`,
            remediation: `Remove ${name} from API responses or encrypt sensitive data`,
          });
        }
      }
    } catch (error) {
      // Request failed
    }

    return vulnerabilities;
  }

  /**
   * Scan endpoint for vulnerabilities
   */
  async scanEndpoint(endpoint: APIEndpoint): Promise<APIVulnerability[]> {
    const vulnerabilities: APIVulnerability[] = [];

    vulnerabilities.push(...(await this.testAuthenticationBypass(endpoint)));
    vulnerabilities.push(...(await this.testInjectionVulnerabilities(endpoint)));
    vulnerabilities.push(...(await this.testRateLimiting(endpoint)));
    vulnerabilities.push(...(await this.testDataExposure(endpoint)));

    // Store vulnerabilities
    for (const vuln of vulnerabilities) {
      this.vulnerabilities.set(vuln.id, vuln);
    }

    return vulnerabilities;
  }

  /**
   * Get discovered endpoints
   */
  getEndpoints(): APIEndpoint[] {
    return Array.from(this.discoveredEndpoints.values());
  }

  /**
   * Get vulnerabilities
   */
  getVulnerabilities(): APIVulnerability[] {
    return Array.from(this.vulnerabilities.values());
  }

  /**
   * Get vulnerabilities by severity
   */
  getVulnerabilitiesBySeverity(severity: string): APIVulnerability[] {
    return Array.from(this.vulnerabilities.values()).filter((v) => v.severity === severity);
  }
}

// Singleton instance
export const apiSecurityTester = new APISecurityTester();
