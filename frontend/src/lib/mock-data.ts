/**
 * Mock data for the ArchitectAI prototype.
 *
 * This module is the single source of truth for all hard-coded content used by
 * the UI while the real generation backend is not wired up. When the agent
 * pipeline ships, replace the exports here with server-fn calls returning the
 * same shapes (AgentStep, Project, ArchitectureOutput) so the UI keeps working.
 */

/** Lifecycle of a single agent step displayed on the processing screen. */
export type StepStatus = "pending" | "active" | "completed";

export interface AgentStep {
  id: string;
  label: string;
  subMessage: string;
  status: StepStatus;
}

/**
 * Ordered list of stages the simulated agent walks through.
 * Order matters — the processing page advances strictly top-to-bottom.
 */
export const AGENT_STEPS: ReadonlyArray<Omit<AgentStep, "status">> = [
  {
    id: "analyze",
    label: "Analyzing system requirements",
    subMessage: "Identifying core constraints, scale targets, and integration boundaries",
  },
  {
    id: "macro",
    label: "Generating macro architecture",
    subMessage: "Designing primary subsystems, data flows, and service boundaries",
  },
  {
    id: "micro",
    label: "Designing micro architecture",
    subMessage: "Detailing component internals, API contracts, and communication patterns",
  },
  {
    id: "stack",
    label: "Selecting technology stack",
    subMessage: "Evaluating technologies against requirements and scale targets",
  },
  {
    id: "diagram",
    label: "Generating architecture diagram",
    subMessage: "Producing Mermaid flowchart from architectural model",
  },
  {
    id: "repo",
    label: "Building repository structure",
    subMessage: "Defining monorepo layout and service boundaries",
  },
];

export interface Project {
  id: string;
  user_id?: string;
  title: string;
  requirements: string;
  createdAt?: string;
  created_at?: string;
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: "mock-project-1",
    title: "Live Streaming Service",
    requirements:
      "Architecture for a live streaming platform supporting 100k concurrent viewers with low-latency HLS and WebRTC chat.",
    createdAt: "2 hours ago",
  },
  {
    id: "mock-project-2",
    title: "Microservices E-Commerce",
    requirements:
      "Design a scalable e-commerce backend with cart, checkout, inventory, and payment services.",
    createdAt: "1 day ago",
  },
  {
    id: "mock-project-3",
    title: "ML Model Serving Platform",
    requirements:
      "Architecture for serving ML models at scale with autoscaling, A/B routing, and observability.",
    createdAt: "3 days ago",
  },
  {
    id: "mock-project-4",
    title: "Real-Time Collaborative Editor",
    requirements:
      "System design for a collaborative document editor with CRDT-based sync and presence.",
    createdAt: "5 days ago",
  },
  {
    id: "mock-project-5",
    title: "Multi-Tenant SaaS CRM",
    requirements:
      "Architecture for a multi-tenant CRM with row-level isolation, audit logs, and webhook integrations.",
    createdAt: "1 week ago",
  },
  {
    id: "mock-project-6",
    title: "Event-Driven Notification System",
    requirements:
      "Design an event-driven notification service with fan-out, dedup, and channel routing.",
    createdAt: "2 weeks ago",
  },
];

export interface TechItem {
  name: string;
  layer: "Frontend" | "Backend" | "Database" | "Infrastructure" | "DevOps" | "Messaging";
  role: string;
  justification: string;
}

export interface MicroSection {
  title: string;
  body: string;
}

export interface RepoNode {
  name: string;
  type: "directory" | "file";
  annotation?: string;
  children?: RepoNode[];
}

export interface ArchitectureOutput {
  projectId?: string;
  title: string;
  requirements: string;
  architecture: string;
  micro: MicroSection[];
  tech_stack: TechItem[];
  mermaid_code: string;
  repo: RepoNode[];
}

/**
 * Canonical sample architecture rendered on /architecture/$projectId.
 * Every project id currently resolves to this same fixture.
 */
export const MOCK_ARCHITECTURE: ArchitectureOutput = {
  projectId: "mock-project-1",
  title: "Live Streaming Service Architecture",
  requirements:
    "Architecture for a real-time live streaming service with 100k concurrent viewers, low-latency HLS delivery, and WebRTC-based chat.",
  architecture: `The system is composed of five primary subsystems: an ingest layer that accepts RTMP and WebRTC streams from broadcasters, a transcoding pipeline that produces multi-bitrate HLS segments, an object storage and CDN layer for global delivery, a signaling service for real-time chat and presence, and a viewer client that adapts playback to network conditions.

Streamers connect to regional ingest nodes via RTMP. Ingested streams are validated, normalized, and pushed into a Kafka-backed pipeline that fans out work to a fleet of FFmpeg transcoders. Each transcoder produces HLS renditions which are uploaded to S3 and fronted by CloudFront for global distribution.

Viewer clients fetch HLS playlists through the CDN and open a WebRTC data channel to a regional signaling service for chat, reactions, and presence events. Redis backs the signaling layer for ephemeral state, while PostgreSQL persists user, stream, and session metadata.

The platform is designed to scale horizontally at every layer. Ingest, transcoding, and signaling are stateless services running on Kubernetes with autoscaling driven by Prometheus metrics. Failure of any single zone degrades capacity but does not interrupt active broadcasts.`,
  micro: [
    {
      title: "Ingest Service",
      body: "The ingest service terminates RTMP connections using Nginx-RTMP and validates stream keys against PostgreSQL. Validated streams are wrapped in protobuf envelopes and pushed to a per-stream Kafka topic. The service exposes a gRPC admin API for cutting, muting, and rerouting streams, and emits structured events for downstream consumers.",
    },
    {
      title: "Transcoding Pipeline",
      body: "Transcoders consume per-stream Kafka topics and run FFmpeg with hardware acceleration to produce 240p, 480p, 720p, and 1080p HLS renditions. Segment uploads are idempotent and addressed by content hash. A Redis-backed lease ensures exactly one transcoder owns a stream at any moment, with automatic failover within two seconds on worker death.",
    },
    {
      title: "CDN & Delivery Layer",
      body: "HLS segments and playlists are uploaded to S3 with short TTLs and cached by CloudFront at the edge. A signed-cookie scheme ties playback to authenticated sessions. Origin shields protect S3 from cache stampedes during sudden viewer surges.",
    },
    {
      title: "Viewer Client Architecture",
      body: "The React-based viewer uses HLS.js for adaptive playback and a thin signaling SDK over WebSocket for chat. The client maintains a small state machine for stream lifecycle (connecting, live, buffering, ended) and reports playback QoS metrics back to the analytics pipeline.",
    },
  ],
  tech_stack: [
    {
      name: "Node.js",
      layer: "Backend",
      role: "API gateway and signaling runtime",
      justification: "Mature WebSocket ecosystem and high I/O concurrency.",
    },
    {
      name: "FFmpeg",
      layer: "Backend",
      role: "Stream transcoding",
      justification: "Industry-standard codec coverage with hardware acceleration.",
    },
    {
      name: "Nginx-RTMP",
      layer: "Infrastructure",
      role: "RTMP ingest termination",
      justification: "Battle-tested, low-overhead RTMP handling.",
    },
    {
      name: "Redis",
      layer: "Database",
      role: "Ephemeral signaling and lease state",
      justification: "Microsecond reads with pub/sub for fan-out.",
    },
    {
      name: "PostgreSQL",
      layer: "Database",
      role: "Users, streams, sessions",
      justification: "Strong consistency and rich indexing for relational data.",
    },
    {
      name: "Apache Kafka",
      layer: "Messaging",
      role: "Stream pipeline backbone",
      justification: "Durable, partitioned event log with replay support.",
    },
    {
      name: "React",
      layer: "Frontend",
      role: "Viewer and broadcaster UI",
      justification: "Component model fits stateful playback surfaces.",
    },
    {
      name: "Docker",
      layer: "DevOps",
      role: "Service packaging",
      justification: "Reproducible builds across regions.",
    },
    {
      name: "Kubernetes",
      layer: "Infrastructure",
      role: "Orchestration and autoscaling",
      justification: "Declarative scheduling with HPA driven by custom metrics.",
    },
    {
      name: "Prometheus",
      layer: "DevOps",
      role: "Metrics and alerting",
      justification: "Pull-based model fits ephemeral pods well.",
    },
    {
      name: "AWS S3",
      layer: "Infrastructure",
      role: "HLS segment storage",
      justification: "Durable object storage with lifecycle policies.",
    },

    {
      name: "CloudFront",
      layer: "Infrastructure",
      role: "Global CDN",
      justification: "Edge cache footprint with origin-shield support.",
    },
  ],
  mermaid_code: `flowchart TD
    A[Streamer Client] -->|RTMP| B[Ingest Service]
    B --> C[Transcoding Pipeline]
    C -->|HLS Segments| D[Object Storage S3]
    D --> E[CDN CloudFront]
    E -->|HLS| F[Viewer Client]
    B --> G[Signaling Service]
    G <-->|WebRTC| F
    H[Redis] <--> G
    I[PostgreSQL] <--> B
    J[Kafka] --> C
    B --> J`,
  repo: [
    {
      name: "apps",
      type: "directory",
      children: [
        {
          name: "ingest-service",
          type: "directory",
          annotation: "RTMP ingest and stream validation",
        },
        {
          name: "transcoder",
          type: "directory",
          annotation: "FFmpeg-based HLS transcoding workers",
        },
        {
          name: "api-gateway",
          type: "directory",
          annotation: "REST + WebSocket gateway",
        },
        {
          name: "signaling-service",
          type: "directory",
          annotation: "WebRTC signaling via Socket.IO",
        },
        {
          name: "web-client",
          type: "directory",
          annotation: "React viewer and broadcaster UI",
        },
      ],
    },
    {
      name: "packages",
      type: "directory",
      children: [
        {
          name: "shared-types",
          type: "directory",
          annotation: "Shared TypeScript interfaces",
        },
        {
          name: "proto-schemas",
          type: "directory",
          annotation: "Protobuf definitions for internal RPC",
        },
      ],
    },
    {
      name: "infrastructure",
      type: "directory",
      children: [
        {
          name: "k8s",
          type: "directory",
          annotation: "Kubernetes manifests",
        },
        {
          name: "terraform",
          type: "directory",
          annotation: "AWS infrastructure as code",
        },
      ],
    },
    {
      name: "docs",
      type: "directory",
      annotation: "Architecture decision records",
    },
    {
      name: "docker-compose.yml",
      type: "file",
      annotation: "Local development environment",
    },
    {
      name: "turbo.json",
      type: "file",
      annotation: "Turborepo pipeline configuration",
    },
  ],
};

/** Fallback diagram returned by the "Generate Diagram" modal in the prototype. */
export const MOCK_GENERATED_DIAGRAM = `flowchart LR
    V((Viewer))
    V --> L[Login]
    V --> B[Browse Streams]
    V --> J[Join Stream]
    V --> C[Send Chat]
    L --> AU[Authenticate]
    J --> VT[Validate Token]
    J --> RT[Route to CDN]`;
