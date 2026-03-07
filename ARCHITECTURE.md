# NEXUS-PT Pro: Enterprise-Grade Autonomous Penetration Testing Platform

## Executive Summary

NEXUS-PT Pro is an enterprise-grade, autonomous AI-driven penetration testing platform designed for APT-level security operations. The system implements a hierarchical multi-agent architecture inspired by leading frameworks (BlacksmithAI, PentAGI, XBOW) to orchestrate complex attack chains from reconnaissance through post-exploitation. Built on a foundation of LLM-driven reasoning, containerized tool execution, and persistent knowledge graphs, NEXUS-PT Pro enables organizations to conduct comprehensive, repeatable, and auditable security assessments at machine speed with human-level reasoning.

---

## 1. System Architecture Overview

### 1.1 Core Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXUS-PT Pro Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Web UI Layer (React 19 + Tailwind 4)            │   │
│  │  Dashboard | Attack Tree | Terminal | Reports           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↑ tRPC API ↓                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      API Layer (Express 4 + tRPC 11)                    │   │
│  │  Auth | Pentest Operations | Reporting | Webhooks       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↑ RPC Calls ↓                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    AI Orchestration Layer (LangGraph)                   │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  Orchestrator Agent (Planning & Coordination)      │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ Recon    │ │ Scan     │ │ Vuln     │ │ Exploit  │   │   │
│  │  │ Agent    │ │ Agent    │ │ Agent    │ │ Agent    │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  Post-Exploit Agent                             │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓ Tool Calls ↓                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    Tool Execution Layer                                │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  Docker Container Management (mini-kali)         │ │   │
│  │  │  - Nmap, SQLMap, Metasploit, Nuclei              │ │   │
│  │  │  - Burp Suite API, BeEF, Hashcat                 │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  External API Integration                         │ │   │
│  │  │  - Shodan, Censys, VirusTotal                     │ │   │
│  │  │  - Tavily, Perplexity, DuckDuckGo                 │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓ Results ↓                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    Data & Knowledge Layer                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │  PostgreSQL  │  │    Neo4j     │  │   S3 Storage │  │   │
│  │  │  (pgvector)  │  │ (Knowledge   │  │  (Reports &  │  │   │
│  │  │              │  │  Graph)      │  │   Evidence)  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Design Principles

**Autonomous Reasoning**: Each agent independently analyzes situations and makes decisions based on available context and historical patterns.

**Tool Agnosticism**: The system abstracts tool execution through standardized interfaces, enabling seamless integration of new security tools.

**Isolation & Safety**: All potentially dangerous operations execute within containerized environments with strict resource limits and network isolation.

**Continuous Learning**: Attack paths, successful techniques, and failure modes are captured in the knowledge graph for adaptive future operations.

**Auditability**: Every action, decision, and result is logged with full traceability for compliance and forensic analysis.

---

## 2. Multi-Agent Architecture

### 2.1 Agent Hierarchy

The system implements a hierarchical agent structure with one orchestrator and five specialized sub-agents:

```
                    ┌─────────────────────┐
                    │   Orchestrator      │
                    │   (Mission Control) │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         ┌──────▼────┐  ┌──────▼────┐  ┌────▼──────┐
         │ Recon     │  │ Scan      │  │ Vuln      │
         │ Agent     │  │ Agent     │  │ Agent     │
         └───────────┘  └───────────┘  └───────────┘
                │              │              │
         ┌──────▼────┐  ┌──────▼────┐  ┌────▼──────┐
         │ Exploit   │  │ Post-      │  │ Reporting │
         │ Agent     │  │ Exploit    │  │ Agent     │
         │           │  │ Agent      │  │           │
         └───────────┘  └───────────┘  └───────────┘
```

### 2.2 Orchestrator Agent

**Responsibilities**:
- Receives penetration testing objectives and constraints
- Decomposes complex tasks into atomic sub-tasks
- Maintains execution state and context across multiple operations
- Coordinates parallel and sequential agent execution
- Implements adaptive strategies based on results
- Generates executive summaries and recommendations

**Key Capabilities**:
- Task decomposition using hierarchical planning
- State management with context windows (using pgvector for semantic recall)
- Error recovery and strategy adaptation
- Multi-turn reasoning with tool calling
- Knowledge graph queries for historical pattern matching

### 2.3 Specialized Sub-Agents

#### 2.3.1 Reconnaissance Agent

**Mission**: Map attack surface and identify potential entry points

**Tools & Capabilities**:
- Passive OSINT: Whois, DNS queries, public records
- Subdomain enumeration: subfinder, assetfinder, amass
- Certificate transparency: crt.sh, Censys API
- Search engine aggregation: Shodan, Censys, VirusTotal
- Social engineering profiling: LinkedIn, GitHub, public databases

**Output Artifacts**:
- Asset inventory (domains, IPs, subdomains, ASNs)
- Infrastructure topology
- Technology stack identification
- Personnel and organizational structure
- Initial risk indicators

#### 2.3.2 Scanning & Enumeration Agent

**Mission**: Identify services, versions, and misconfigurations

**Tools & Capabilities**:
- Port scanning: Nmap (SYN, UDP, comprehensive)
- Service fingerprinting: Nmap NSE, Nuclei templates
- Web crawling: Burp Suite API, custom crawlers
- Directory brute-forcing: ffuf, dirsearch
- Protocol analysis: Wireshark, tcpdump

**Output Artifacts**:
- Open ports and service inventory
- Service versions and banners
- Web application structure and endpoints
- Potential vulnerability indicators
- Configuration anomalies

#### 2.3.3 Vulnerability Analysis Agent

**Mission**: Identify, prioritize, and assess exploitability of vulnerabilities

**Tools & Capabilities**:
- Web vulnerability scanning: Nuclei, Burp Suite API
- API security testing: GraphQL introspection, REST enumeration
- CVE matching: NVD, Exploit-DB, Sploitus
- Business logic analysis: AI-driven heuristic detection
- Configuration review: CIS benchmarks, OWASP guidelines

**Output Artifacts**:
- Vulnerability inventory with CVSS scores
- Exploitability assessment
- Business impact analysis
- Prioritized remediation recommendations
- Attack chain suggestions

#### 2.3.4 Exploitation Agent

**Mission**: Validate vulnerabilities through proof-of-concept exploitation

**Tools & Capabilities**:
- Metasploit Framework integration
- Custom payload generation and obfuscation
- Vulnerability verification and PoC execution
- Access validation and privilege level verification
- Lateral movement vector identification

**Output Artifacts**:
- Exploitation evidence (screenshots, logs, system info)
- Access level achieved
- System configuration details
- Post-exploitation opportunities
- Persistence mechanisms identified

#### 2.3.5 Post-Exploitation Agent

**Mission**: Maximize impact assessment and demonstrate attack depth

**Tools & Capabilities**:
- Privilege escalation: Local exploit chains, configuration abuse
- Lateral movement: Credential harvesting, network enumeration, pivoting
- Data exfiltration: Sensitive file location, database queries
- Persistence: Backdoor installation, scheduled tasks, rootkits
- Covering tracks: Log manipulation, artifact cleanup

**Output Artifacts**:
- Privilege escalation success/failure analysis
- Lateral movement paths discovered
- Sensitive data access proof
- System compromise extent assessment
- Persistence mechanisms deployed

---

## 3. LLM-Driven Intelligence Engine

### 3.1 Multi-LLM Support Architecture

```
LLM Provider Abstraction Layer
├── OpenAI (GPT-4o, GPT-4 Turbo)
│   └── Cost: High | Speed: Fast | Reasoning: Excellent
├── Anthropic (Claude 3.5 Sonnet)
│   └── Cost: Medium | Speed: Medium | Reasoning: Excellent
├── Ollama (Local Models)
│   ├── Mistral 7B/8x7B
│   ├── Llama 2/3 (7B-70B)
│   └── Cost: Zero | Speed: Variable | Reasoning: Good
└── OpenRouter (Multi-provider)
    └── Cost: Variable | Speed: Variable | Reasoning: Good
```

### 3.2 Retrieval-Augmented Generation (RAG) System

**Knowledge Base Components**:

1. **CVE Database**: NVD, Exploit-DB, Sploitus feeds
2. **Attack Techniques**: MITRE ATT&CK framework
3. **Historical Cases**: Previous penetration test reports
4. **Tool Guides**: Security tool usage patterns and parameters
5. **Bypass Techniques**: WAF evasion, IDS/IPS circumvention

**RAG Pipeline**:

```
User Query / Agent Need
    ↓
Query Vectorization (OpenAI embeddings or local)
    ↓
pgvector Semantic Search
    ↓
Retrieve Top-K Relevant Documents
    ↓
Rank by Relevance & Recency
    ↓
Inject into LLM Context
    ↓
Generate Context-Aware Response
```

### 3.3 Prompt Engineering Framework

**Agent Role Definition**:

```
You are a specialized penetration testing agent with the following characteristics:
- Deep expertise in network security, web application security, and system administration
- Familiar with OWASP Top 10, CWE, CVSS scoring, and attack methodologies
- Capable of strategic planning and tactical execution
- Strict adherence to legal and ethical guidelines
- Ability to adapt strategies based on feedback and obstacles

Your role: [Specific agent role]
Your tools: [Available tools list]
Your constraints: [Time, scope, legal boundaries]
```

**Task Template**:

```
OBJECTIVE: [Penetration testing task]
TARGET: [Target system information]
CONTEXT: [Previous reconnaissance results]
AVAILABLE_TOOLS: [Tool list]
CONSTRAINTS: [Limitations and requirements]

Analyze the situation and provide:
1. Situation assessment
2. Recommended approach with tool selection
3. Expected outcomes
4. Risk assessment
5. Contingency plans
```

---

## 4. Knowledge Graph & Memory System

### 4.1 Neo4j Data Model

**Node Types**:

```
Target
├── properties: name, ip_range, domain, os_type, description
├── relations: HAS_SERVICE, HAS_VULNERABILITY, OWNED_BY
└── lifecycle: discovered → assessed → compromised → cleaned

Service
├── properties: name, port, protocol, version, fingerprint
├── relations: RUNS_ON, HAS_VULNERABILITY, EXPOSES_ENDPOINT
└── lifecycle: identified → analyzed → exploited

Vulnerability
├── properties: cve_id, cvss_score, type, description, affected_versions
├── relations: AFFECTS_SERVICE, EXPLOITED_BY, REQUIRES_PRIVILEGE
└── lifecycle: discovered → confirmed → exploited → remediated

Exploit
├── properties: name, tool, success_rate, impact_level, required_access
├── relations: EXPLOITS_VULNERABILITY, LEADS_TO_ACCESS, REQUIRES_TOOL
└── lifecycle: attempted → successful → failed

AccessLevel
├── properties: level (user/admin/system), privileges, user_context
├── relations: GAINED_FROM_EXPLOIT, ENABLES_ACTION, LEADS_TO_ESCALATION
└── lifecycle: gained → validated → escalated

AttackPath
├── properties: name, success_rate, estimated_duration, complexity
├── relations: CONTAINS_STEP, LEADS_TO_OBJECTIVE, ALTERNATIVE_TO
└── lifecycle: planned → attempted → successful/failed

Evidence
├── properties: type, timestamp, tool, data_hash, classification
├── relations: PROVES_VULNERABILITY, SUPPORTS_CLAIM, PART_OF_REPORT
└── lifecycle: collected → verified → reported
```

**Relationship Types**:

| Relationship | Source | Target | Semantics |
|---|---|---|---|
| HAS_SERVICE | Target | Service | Target runs this service |
| HAS_VULNERABILITY | Service | Vulnerability | Service is affected by vulnerability |
| EXPLOITS_VULNERABILITY | Exploit | Vulnerability | Exploit can leverage vulnerability |
| LEADS_TO_ACCESS | Exploit | AccessLevel | Exploitation results in access |
| ENABLES_LATERAL_MOVEMENT | AccessLevel | Target | Current access enables movement to target |
| SIMILAR_TO | AttackPath | AttackPath | Similar historical attack pattern |
| ALTERNATIVE_PATH | AttackPath | AttackPath | Alternative approach to same objective |
| REQUIRES_PRIVILEGE | Vulnerability | AccessLevel | Vulnerability exploitation requires privilege |

### 4.2 pgvector Semantic Search

**Use Cases**:

1. **Similar Vulnerability Discovery**: Find vulnerabilities similar to newly discovered ones
2. **Attack Pattern Matching**: Identify similar historical attack chains
3. **Tool Recommendation**: Suggest tools based on past successful usage
4. **Technique Adaptation**: Find bypass techniques for similar defense mechanisms

**Implementation**:

```sql
-- Create embedding column
ALTER TABLE vulnerabilities ADD COLUMN embedding vector(1536);

-- Semantic search query
SELECT id, name, description, 
  1 - (embedding <=> query_embedding) as similarity
FROM vulnerabilities
WHERE 1 - (embedding <=> query_embedding) > 0.7
ORDER BY similarity DESC
LIMIT 10;
```

---

## 5. Task Orchestration & Execution Engine

### 5.1 Task Lifecycle

```
┌─────────┐    ┌────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐
│ Created │ -> │ Queued │ -> │ Assigned │ -> │Running  │ -> │ Complete │
└─────────┘    └────────┘    └──────────┘    └─────────┘    └──────────┘
                                                   │
                                                   v
                                            ┌─────────────┐
                                            │ Failed/Retry│
                                            └─────────────┘
```

### 5.2 Async Task Processing with Bull Queue

**Queue Structure**:

```
Task Queue
├── recon_scan (Priority: High)
├── port_scan (Priority: High)
├── vuln_scan (Priority: Medium)
├── exploit_attempt (Priority: Medium)
├── post_exploit (Priority: Low)
└── report_generation (Priority: Low)
```

**Task Definition**:

```typescript
interface PentestTask {
  id: string;
  type: 'recon' | 'scan' | 'vuln' | 'exploit' | 'post_exploit' | 'report';
  projectId: string;
  targetId: string;
  agentId: string;
  payload: Record<string, unknown>;
  priority: 'high' | 'medium' | 'low';
  timeout: number;
  retries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: Record<string, unknown>;
  error?: string;
}
```

### 5.3 Docker Container Management

**Container Lifecycle**:

```
Task Received
    ↓
Select Container Image Based on Task Type
    ↓
Create Container with Resource Limits
    ├── CPU: 2 cores max
    ├── Memory: 4GB max
    ├── Disk: 10GB max
    └── Network: Isolated
    ↓
Mount Tool Configuration & Input Data
    ↓
Execute Task
    ↓
Capture Output & Logs
    ↓
Parse Results & Store in Database
    ↓
Clean Up Container & Temporary Files
```

**Container Images**:

| Image | Purpose | Tools | Size |
|---|---|---|---|
| nexus-pt/mini-kali | General purpose | Nmap, SQLMap, Nuclei, curl, wget | 2.5GB |
| nexus-pt/web-scanner | Web-focused | Burp Suite API, OWASP ZAP, ffuf | 1.8GB |
| nexus-pt/metasploit | Exploitation | Metasploit Framework, msfvenom | 3.2GB |
| nexus-pt/osint | Information gathering | Shodan CLI, Censys, theHarvester | 800MB |

---

## 6. Core Tool Integration

### 6.1 Reconnaissance Tools

| Tool | Function | Integration | Output Format |
|---|---|---|---|
| Nmap | Port scanning | Command-line + XML parsing | XML/JSON |
| Shodan API | Internet asset search | REST API | JSON |
| Censys API | Certificate & host info | REST API | JSON |
| VirusTotal API | File & URL analysis | REST API | JSON |
| crt.sh | Certificate transparency | Web scraping | HTML/JSON |

### 6.2 Vulnerability Scanning

| Tool | Function | Integration | Output Format |
|---|---|---|---|
| Nuclei | Template-based scanning | Command-line + JSON | JSON |
| SQLMap | SQL injection detection | Command-line + API | JSON/CSV |
| Burp Suite | Web app scanning | REST API | JSON |
| OWASP ZAP | Automated scanning | REST API | JSON |

### 6.3 Exploitation Tools

| Tool | Function | Integration | Output Format |
|---|---|---|---|
| Metasploit | Modular exploitation | RPC/Console | JSON/Text |
| Hashcat | Password cracking | Command-line | Text/JSON |
| BeEF | Browser exploitation | REST API | JSON |

---

## 7. Web UI Architecture

### 7.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  NEXUS-PT Pro Dashboard                          [Settings] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │ Active Projects  │  │ Vulnerability    │  │ Quick     │ │
│  │                  │  │ Statistics       │  │ Actions   │ │
│  │ • Project 1      │  │ • Critical: 3    │  │ • New     │ │
│  │ • Project 2      │  │ • High: 12       │  │   Project │ │
│  │ • Project 3      │  │ • Medium: 45     │  │ • Resume  │ │
│  └──────────────────┘  └──────────────────┘  │   Scan    │ │
│                                               │ • View    │ │
│  ┌──────────────────────────────────────┐    │   Reports │ │
│  │ Recent Activity                      │    └───────────┘ │
│  │ • 2 hours ago: Recon scan completed  │                  │
│  │ • 1 hour ago: 5 vulnerabilities found│                  │
│  │ • 30 min ago: Exploit attempt failed │                  │
│  └──────────────────────────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Key Pages

**Projects Page**: List, create, and manage penetration test projects

**Project Detail**: Target configuration, scan results, vulnerability list, attack tree

**Attack Tree Visualization**: Interactive graph showing attack paths and exploitation chains

**Real-Time Terminal**: Live command execution and output streaming

**Reports**: Generate, view, export, and compare penetration test reports

**Settings**: API key configuration, LLM provider selection, Docker environment setup

---

## 8. Data Flow & Workflows

### 8.1 Typical Penetration Test Workflow

```
User Initiates Pentest
    ↓
Orchestrator Receives Objectives & Constraints
    ↓
Task Decomposition:
  ├─ Recon Task → Recon Agent
  ├─ Scan Task → Scan Agent
  └─ Vuln Analysis → Vuln Agent
    ↓
Parallel Execution
    ├─ Recon Agent: Discover assets
    ├─ Scan Agent: Identify services
    └─ Vuln Agent: Analyze vulnerabilities
    ↓
Results Aggregation & Analysis
    ↓
Identify High-Risk Vulnerabilities
    ↓
Exploit Agent: Attempt Exploitation
    ├─ Successful → Post-Exploit Agent
    └─ Failed → Adapt & Retry
    ↓
Post-Exploitation: Escalation & Lateral Movement
    ↓
Knowledge Graph Update
    ↓
Report Generation
    ↓
Owner Notification
```

### 8.2 Adaptive Feedback Loop

```
Execute Action
    ↓
Monitor Results
    ↓
Analyze Outcome
    ├─ Success → Document & Continue
    ├─ Partial → Adapt Strategy
    └─ Failure → Try Alternative
    ↓
Update Knowledge Graph
    ↓
Adjust Future Actions
```

---

## 9. Security & Isolation

### 9.1 Container Isolation

- Each task executes in isolated container with network namespace
- Resource limits: CPU (2 cores), Memory (4GB), Disk (10GB)
- Read-only filesystem for tool binaries
- Temporary writable volumes for task data
- Automatic cleanup after task completion

### 9.2 Access Control

- Role-based access control (RBAC): Admin, Operator, Analyst, Viewer
- Project-level permissions
- API token management with expiration
- Audit logging for all operations

### 9.3 Legal Compliance

- User authorization confirmation before testing
- Comprehensive operation logging
- Legal disclaimers in all reports
- Data encryption at rest and in transit
- GDPR/CCPA compliance considerations

---

## 10. Technology Stack

| Component | Technology | Rationale |
|---|---|---|
| Frontend | React 19 + Tailwind 4 | Modern, performant, accessible |
| API | Express 4 + tRPC 11 | Type-safe, minimal overhead |
| AI Orchestration | LangGraph + LangChain | Agentic workflow management |
| Database | PostgreSQL + pgvector | Relational + semantic search |
| Knowledge Graph | Neo4j | Graph relationships & patterns |
| Cache | Redis | Session & result caching |
| Task Queue | Bull Queue | Async task processing |
| Containers | Docker + Docker Compose | Isolation & reproducibility |
| Monitoring | Prometheus + Grafana | Metrics & visualization |
| Logging | ELK Stack | Centralized log management |

---

## 11. Implementation Roadmap

**Phase 1**: System architecture design ✓

**Phase 2**: Project scaffold and database models

**Phase 3**: AI agent orchestrator engine

**Phase 4**: Core tool integration (Nmap, SQLMap, Metasploit)

**Phase 5**: Web UI dashboard and monitoring

**Phase 6**: Knowledge graph and report generation

**Phase 7**: Testing, documentation, and deployment

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-06  
**Author**: Manus AI  
**Classification**: Internal Use
