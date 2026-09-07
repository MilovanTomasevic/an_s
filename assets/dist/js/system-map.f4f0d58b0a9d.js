(function () {
  "use strict";

  var MAP_WIDTH = 2300;
  var MAP_HEIGHT = 1220;
  var MIN_SCALE = 0.42;
  var MAX_SCALE = 1.7;
  var NODE_MIN_WIDTH = 140;
  var NODE_MAX_WIDTH = 220;
  var NODE_FALLBACK_HEIGHT = 96;
  var CORE_NODE_MIN_WIDTH = 220;
  var CORE_NODE_MAX_WIDTH = 260;
  var CORE_NODE_FALLBACK_HEIGHT = 124;
  var NODE_FOCUS_MAX_SCALE = 1.18;
  var STORY_FOCUS_MAX_SCALE = 1.12;
  var DIRECT_CAMERA_GESTURES = false;
  var MAX_CAMERA_X = MAP_WIDTH * 3;
  var MAX_CAMERA_Y = MAP_HEIGHT * 3;
  var MOBILE_QUERY = "(max-width: 52rem)";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var ALLOWED_ROLES = [
    "all", "engineer", "analyst", "owner", "risk", "admin", "operations"
  ];
  var ALLOWED_EXPORTS = ["poster", "og", "a3", "scene", "legend"];
  var ALLOWED_MOTION = ["auto", "paused", "off"];
  var ALLOWED_LAYERS = ["data", "control", "evidence", "sql", "decision"];
  var WORLD_ENTRY_ID = "world";
  var WORLD_EXPERIENCE_EVENT = "advanexus:world-experience";
  var WORLD_EXPERIENCE_CONTRACT =
    "advanexus.world-experience-analytics/v1";
  var EDGE_LAYER_BY_KIND = {
    data: "data",
    control: "control",
    intelligence: "control",
    evidence: "evidence",
    compatibility: "sql"
  };

  var ZONES = [
    { id: "connect", x: 55, y: 95, width: 270, height: 530 },
    { id: "prepare", x: 345, y: 95, width: 350, height: 530 },
    { id: "execute", x: 715, y: 95, width: 350, height: 530 },
    { id: "govern", x: 1085, y: 95, width: 300, height: 530 },
    { id: "analyse", x: 1405, y: 95, width: 400, height: 530 },
    { id: "operate", x: 1825, y: 95, width: 420, height: 670 },
    { id: "prove", x: 1145, y: 850, width: 1100, height: 350 },
    { id: "trust", x: 55, y: 850, width: 1070, height: 350, crossCutting: true }
  ];

  var NODES = [
    {
      id: "business-need",
      title: "Business need / obligation",
      zone: "connect",
      kind: "decision",
      status: "available",
      x: 85,
      y: 140,
      roles: ["owner", "risk", "operations"],
      decision: true,
      owner: "Business owner",
      input: "Requirement",
      output: "Approved intent",
      state: "confirmed",
      version: "decision:01",
      scope: "Tenant · Project",
      boundary: "human-decision"
    },
    {
      id: "source",
      title: "Source",
      zone: "connect",
      kind: "object",
      status: "dependent",
      x: 85,
      y: 295,
      roles: ["engineer", "admin"],
      owner: "Connectors",
      input: "Connection identity",
      output: "Capability contract",
      state: "registered",
      version: "source:stable",
      scope: "Project",
      boundary: "connector-varies"
    },
    {
      id: "file-version",
      title: "FileVersion",
      zone: "connect",
      kind: "version",
      status: "available",
      x: 85,
      y: 455,
      roles: ["engineer", "owner"],
      owner: "Sandbox",
      input: "File / secure URL",
      output: "Immutable file reference",
      state: "accepted",
      version: "file:v17",
      scope: "Project",
      boundary: "explicit-version"
    },
    {
      id: "sql-console",
      title: "SQL Console",
      zone: "prepare",
      kind: "module",
      status: "available",
      x: 375,
      y: 140,
      roles: ["engineer", "analyst"],
      owner: "SQL Console",
      input: "Source + SQL",
      output: "QueryExecution",
      state: "read-only path",
      version: "query:runtime",
      scope: "Actor · Project",
      boundary: "sql-operation"
    },
    {
      id: "query-execution",
      title: "QueryExecution",
      zone: "prepare",
      kind: "run",
      status: "available",
      x: 375,
      y: 285,
      roles: ["engineer", "analyst", "risk"],
      owner: "SQL Console",
      input: "Validated query",
      output: "Result / lineage",
      state: "succeeded",
      version: "run:q-0241",
      scope: "Actor · RLS",
      boundary: "explicit-run"
    },
    {
      id: "saved-query",
      title: "SavedQuery",
      zone: "prepare",
      kind: "definition",
      status: "available",
      x: 535,
      y: 285,
      roles: ["engineer", "analyst"],
      owner: "SQL Console",
      input: "QueryExecution + SQL intent",
      output: "Reusable query definition",
      state: "mutable saved asset",
      version: "saved-query:current",
      scope: "Project",
      boundary: "sql-operation"
    },
    {
      id: "sandbox",
      title: "System Sandbox Source",
      zone: "prepare",
      kind: "object",
      status: "baseline",
      x: 375,
      y: 455,
      roles: ["engineer", "admin"],
      owner: "Sandbox",
      input: "FileVersion",
      output: "TableVersion",
      state: "promoted",
      version: "table:v08",
      scope: "Project",
      boundary: "explicit-version"
    },
    {
      id: "table-version",
      title: "TableVersion",
      zone: "prepare",
      kind: "version",
      status: "baseline",
      x: 535,
      y: 455,
      roles: ["engineer", "owner", "risk"],
      owner: "Sandbox",
      input: "FileVersion + bounded transform",
      output: "Managed table revision",
      state: "published",
      version: "table:v08",
      scope: "Project",
      boundary: "explicit-version"
    },
    {
      id: "pipeline",
      title: "Pipeline / JobVersion",
      zone: "execute",
      kind: "versioned definition",
      status: "available",
      x: 745,
      y: 140,
      roles: ["engineer", "operations"],
      owner: "Pipelines",
      input: "JobDefinition + immutable JobVersion",
      output: "Pinned PipelineRun",
      state: "current version + schedule intent",
      version: "job-version:v12",
      scope: "Project",
      boundary: "schedule-intent"
    },
    {
      id: "pipeline-run",
      title: "PipelineRun",
      zone: "execute",
      kind: "run",
      status: "baseline",
      x: 745,
      y: 285,
      roles: ["engineer", "operations", "risk"],
      owner: "Pipelines",
      input: "Pinned JobVersion + effective policy + admission contract",
      output: "Attempts · state events · checkpoints · Master steps",
      state: "queued / waiting / retrying / partial / terminal",
      version: "run:p-7712",
      scope: "Tenant · Project",
      boundary: "explicit-run"
    },
    {
      id: "quality-rule",
      title: "QualityRule",
      zone: "execute",
      kind: "definition",
      status: "available",
      x: 905,
      y: 285,
      roles: ["engineer", "owner", "risk"],
      owner: "Data Quality",
      input: "Source + expectation",
      output: "QualityRun",
      state: "mutable saved rule",
      version: "quality-rule:current",
      scope: "Project",
      boundary: "quality-mutable"
    },
    {
      id: "quality-run",
      title: "QualityRun",
      zone: "execute",
      kind: "gate",
      status: "available",
      x: 745,
      y: 455,
      roles: ["engineer", "owner", "risk"],
      gate: true,
      owner: "Data Quality",
      input: "QualityRule + Source",
      output: "Pass / fail + Finding",
      state: "failed",
      version: "run:dq-099",
      scope: "Project",
      boundary: "quality-mutable"
    },
    {
      id: "quality-finding",
      title: "QualityFinding",
      zone: "execute",
      kind: "finding",
      status: "available",
      x: 905,
      y: 455,
      roles: ["engineer", "owner", "risk", "operations"],
      owner: "Data Quality",
      input: "Failed persisted QualityRun",
      output: "Bounded failed-run evidence",
      state: "open",
      version: "quality-finding:qf-21",
      scope: "Project",
      boundary: "quality-mutable"
    },
    {
      id: "dataset",
      title: "Dataset",
      zone: "govern",
      kind: "identity",
      status: "available",
      x: 1120,
      y: 190,
      roles: ["engineer", "analyst", "owner"],
      owner: "Datasets",
      input: "Accepted definition",
      output: "DatasetVersion",
      state: "active identity",
      version: "dataset:stable",
      scope: "Project",
      boundary: "explicit-version"
    },
    {
      id: "dataset-version",
      title: "DatasetVersion",
      zone: "govern",
      kind: "contract",
      status: "available",
      x: 1105,
      y: 365,
      roles: ["engineer", "analyst", "owner", "risk", "admin"],
      core: true,
      owner: "Datasets",
      input: "Source · SQL · schema",
      output: "Accepted contract",
      state: "locked",
      version: "dataset:v23",
      scope: "Project · RLS",
      boundary: "dataset-snapshot"
    },
    {
      id: "report",
      title: "Report",
      zone: "analyse",
      kind: "identity",
      status: "available",
      x: 1435,
      y: 140,
      roles: ["analyst", "owner"],
      owner: "Analytics",
      input: "Name + analytical purpose",
      output: "Drafts + immutable versions",
      state: "stable identity",
      version: "report:stable",
      scope: "Project",
      boundary: "report-modes"
    },
    {
      id: "report-draft",
      title: "Report Draft",
      zone: "analyse",
      kind: "draft",
      status: "available",
      x: 1605,
      y: 140,
      roles: ["analyst"],
      owner: "Analytics",
      input: "Mutable Report asset",
      output: "Non-runnable draft",
      state: "not executable",
      version: "draft:mutable",
      scope: "Project",
      boundary: "report-modes"
    },
    {
      id: "visualization-draft",
      title: "VisualizationDraft",
      zone: "analyse",
      kind: "transient preview",
      status: "available",
      x: 1435,
      y: 285,
      roles: ["analyst"],
      owner: "Analytics",
      input: "Actor-owned QueryExecution",
      output: "Bounded preview",
      state: "not durable",
      version: "draft:transient",
      scope: "Actor · Project",
      boundary: "visualization-draft"
    },
    {
      id: "report-version",
      title: "ReportVersion",
      zone: "analyse",
      kind: "version",
      status: "available",
      x: 1605,
      y: 285,
      roles: ["analyst", "owner", "risk"],
      owner: "Analytics",
      input: "DatasetVersion or SQL snapshot",
      output: "Immutable report intent",
      state: "accepted",
      version: "report:v09",
      scope: "Project · RLS",
      boundary: "report-modes"
    },
    {
      id: "analytics-run",
      title: "AnalyticsRun",
      zone: "analyse",
      kind: "run",
      status: "baseline",
      x: 1515,
      y: 455,
      roles: ["analyst", "risk", "operations"],
      owner: "Analytics",
      input: "ReportVersion + filters",
      output: "Result + diagnostics",
      state: "succeeded",
      version: "run:a-1418",
      scope: "Actor · RLS",
      boundary: "explicit-run"
    },
    {
      id: "anpy",
      title: "ANPy workspace · NotebookVersion",
      zone: "operate",
      kind: "versioned workspace",
      status: "baseline",
      x: 1855,
      y: 140,
      roles: ["analyst", "engineer"],
      owner: "ANPy",
      input: "Immutable READY Environment + saved cell source",
      output: "CellRun",
      state: "ready environment",
      version: "notebook:v06",
      scope: "Project",
      boundary: "explicit-version"
    },
    {
      id: "cell-run",
      title: "CellRun",
      zone: "operate",
      kind: "run",
      status: "baseline",
      x: 2025,
      y: 140,
      roles: ["analyst", "engineer", "risk"],
      owner: "ANPy",
      input: "NotebookVersion + saved cell + EnvironmentVersion",
      output: "Bounded output + diagnostics + evidence",
      state: "succeeded",
      version: "cell-run:cr-18",
      scope: "Actor · Project",
      boundary: "explicit-run"
    },
    {
      id: "visualization",
      title: "Visualization",
      zone: "operate",
      kind: "lens",
      status: "baseline",
      x: 1855,
      y: 285,
      roles: ["analyst", "owner"],
      owner: "Analytics",
      input: "Analytics result",
      output: "Human-readable lens",
      state: "rendered",
      version: "spec:v05",
      scope: "Permission context",
      boundary: "visualization-lens"
    },
    {
      id: "dashboard",
      title: "VisualizationWorkspaceVersion",
      zone: "operate",
      kind: "immutable composition",
      status: "baseline",
      x: 2025,
      y: 285,
      roles: ["analyst", "owner"],
      owner: "Visualizations",
      input: "Exact ReportVersions + responsive layout",
      output: "DashboardRun + version-pinned controls",
      state: "published immutable version",
      version: "workspace:v03",
      scope: "Tenant · Project",
      boundary: "dashboard-runs"
    },
    {
      id: "dashboard-run",
      title: "DashboardRun",
      zone: "operate",
      kind: "composite run",
      status: "baseline",
      x: 1855,
      y: 455,
      roles: ["analyst", "owner", "operations"],
      owner: "Analytics",
      input: "Published VisualizationWorkspaceVersion + actor filters",
      output: "Distinct WidgetRun outcomes",
      state: "succeeded / partial success / failed",
      version: "dashboard-run:055",
      scope: "Actor · RLS",
      boundary: "dashboard-runs"
    },
    {
      id: "widget-run",
      title: "WidgetRun",
      zone: "operate",
      kind: "run",
      status: "baseline",
      x: 2025,
      y: 455,
      roles: ["analyst", "owner", "operations", "risk"],
      owner: "Analytics",
      input: "Exact workspace binding + ReportVersion + filters",
      output: "Actor-visible AnalyticsRun",
      state: "succeeded / failed",
      version: "widget-run:wr-07",
      scope: "Actor · RLS",
      boundary: "dashboard-runs"
    },
    {
      id: "business-outcome",
      title: "Business outcome",
      zone: "operate",
      kind: "outcome",
      status: "dependent",
      x: 1940,
      y: 555,
      roles: ["owner", "risk", "operations"],
      decision: true,
      owner: "Business owner",
      input: "Supported result",
      output: "Decision / delivery",
      state: "acknowledged",
      version: "outcome:01",
      scope: "Business context",
      boundary: "human-decision"
    },
    {
      id: "finding",
      title: "Finding",
      zone: "prove",
      kind: "object",
      status: "available",
      x: 1185,
      y: 905,
      roles: ["owner", "risk", "operations"],
      owner: "Assurance",
      input: "Supported signal",
      output: "Owned issue",
      state: "open",
      version: "finding:021",
      scope: "Tenant · Project",
      boundary: "assurance-read"
    },
    {
      id: "assurance-case",
      title: "Assurance Case",
      zone: "prove",
      kind: "remediation",
      status: "available",
      x: 1370,
      y: 905,
      roles: ["risk", "operations"],
      owner: "Assurance",
      input: "Finding",
      output: "Remediation trail",
      state: "in progress",
      version: "case:088",
      scope: "Tenant · Project",
      boundary: "explicit-run"
    },
    {
      id: "service-ticket",
      title: "Service Desk Ticket",
      zone: "prove",
      kind: "operational workflow",
      status: "available",
      x: 1370,
      y: 1025,
      roles: ["operations", "owner"],
      owner: "Service Desk",
      input: "Support request",
      output: "Messages + status events",
      state: "in progress",
      version: "ticket:104",
      scope: "Tenant · requester",
      boundary: "ticket-not-case"
    },
    {
      id: "entity-360",
      title: "Entity 360 / Execution Story",
      zone: "prove",
      kind: "read model",
      status: "baseline",
      x: 1580,
      y: 905,
      roles: ["risk", "admin", "operations"],
      owner: "Assurance",
      input: "Supported source events + audit evidence + bounded adapters",
      output: "Permission-filtered source-aware story + visible gaps",
      state: "source-aware projection",
      version: "projection:current",
      scope: "Actor permissions",
      boundary: "assurance-read"
    },
    {
      id: "integrity-run",
      title: "IntegrityRun",
      zone: "prove",
      kind: "run",
      status: "baseline",
      x: 1800,
      y: 905,
      roles: ["risk", "admin"],
      owner: "Assurance",
      input: "Permitted evidence references + explicit criteria",
      output: "Criterion results + visible gaps",
      state: "VERIFIED / UNVERIFIED / LEGACY / BROKEN",
      version: "run:i-304",
      scope: "Permission-aware",
      boundary: "assurance-read"
    },
    {
      id: "evidence-package",
      title: "EvidencePackage",
      zone: "prove",
      kind: "artifact",
      status: "baseline",
      x: 2010,
      y: 1025,
      roles: ["risk", "admin", "owner"],
      owner: "Assurance",
      input: "Permitted evidence set",
      output: "Manifest + checksums",
      state: "exported",
      version: "package:ep-71",
      scope: "Authorised request",
      boundary: "package-not-signed"
    },
    {
      id: "intelligence-proposal",
      title: "Intelligence proposal",
      zone: "operate",
      kind: "proposal",
      status: "baseline",
      x: 1855,
      y: 655,
      roles: ["analyst", "owner", "operations"],
      owner: "Intelligence",
      input: "Goal + permitted context",
      output: "Bounded proposal",
      state: "awaiting validation",
      version: "turn:041",
      scope: "Actor · Tenant · Project",
      boundary: "intelligence-confirm"
    },
    {
      id: "confirmation-gate",
      title: "Validation + confirmation",
      zone: "operate",
      kind: "gate",
      status: "available",
      x: 2025,
      y: 655,
      roles: ["owner", "risk", "admin"],
      gate: true,
      decision: true,
      owner: "Policy + human",
      input: "Proposal",
      output: "Authorised action",
      state: "confirmed",
      version: "approval:017",
      scope: "Permission policy",
      boundary: "intelligence-confirm"
    },
    {
      id: "registered-action",
      title: "Registered Action",
      zone: "operate",
      kind: "run",
      status: "baseline",
      x: 1940,
      y: 755,
      roles: ["operations", "risk", "admin"],
      owner: "Canonical service",
      input: "Confirmed request",
      output: "Result + evidence",
      state: "completed",
      version: "action:901",
      scope: "Actor permissions",
      boundary: "intelligence-confirm"
    },
    {
      id: "tenant-project",
      title: "Tenant · Project · Actor",
      zone: "trust",
      kind: "scope envelope",
      status: "available",
      x: 95,
      y: 920,
      roles: ["admin", "risk", "engineer"],
      owner: "IAM",
      input: "Identity + membership",
      output: "Bounded scope",
      state: "resolved",
      version: "membership:current",
      scope: "Tenant · Project",
      boundary: "scope-recheck"
    },
    {
      id: "permission-rls",
      title: "Permission · RLS · Policy",
      zone: "trust",
      kind: "control envelope",
      status: "available",
      x: 400,
      y: 920,
      roles: ["admin", "risk", "analyst", "engineer"],
      owner: "IAM + module policy",
      input: "Actor + target",
      output: "Effective access context",
      state: "rechecked",
      version: "policy-hash:7c2a",
      scope: "Every operation",
      boundary: "scope-recheck"
    },
    {
      id: "audit-outbox",
      title: "Audit · Outbox · Correlation",
      zone: "trust",
      kind: "evidence bridge",
      status: "baseline",
      x: 705,
      y: 920,
      roles: ["risk", "admin", "operations"],
      owner: "Canonical modules",
      input: "Module-specific state change",
      output: "Source-specific projectable evidence",
      state: "eventual projection",
      version: "source-event:identity",
      scope: "Tenant · optional Project",
      boundary: "assurance-eventual"
    }
  ];

  var EDGES = [
    ["business-need", "source", "data"],
    ["business-need", "file-version", "data"],
    ["business-need", "anpy", "control"],
    ["business-need", "intelligence-proposal", "intelligence"],
    ["source", "sql-console", "data"],
    ["source", "pipeline", "data"],
    ["file-version", "sandbox", "data"],
    ["sandbox", "table-version", "data"],
    ["sql-console", "query-execution", "data"],
    ["query-execution", "saved-query", "data"],
    ["query-execution", "dataset", "data"],
    ["query-execution", "visualization-draft", "data"],
    ["saved-query", "pipeline", "control"],
    ["table-version", "pipeline", "data"],
    ["table-version", "dataset", "data"],
    ["pipeline", "pipeline-run", "control"],
    ["quality-rule", "quality-run", "control"],
    ["pipeline-run", "quality-run", "control"],
    ["quality-run", "quality-finding", "evidence"],
    ["quality-run", "dataset", "control"],
    ["dataset", "dataset-version", "data"],
    ["dataset-version", "report", "control"],
    ["report", "report-draft", "control"],
    ["report", "report-version", "control"],
    ["dataset-version", "report-version", "data"],
    ["visualization-draft", "report-version", "compatibility"],
    ["query-execution", "report-version", "compatibility"],
    ["report-draft", "report-version", "control"],
    ["report-version", "analytics-run", "data"],
    ["anpy", "cell-run", "control"],
    ["analytics-run", "visualization", "data"],
    ["report-version", "dashboard", "control"],
    ["dashboard", "dashboard-run", "control"],
    ["dashboard-run", "widget-run", "data"],
    ["widget-run", "analytics-run", "data"],
    ["widget-run", "business-outcome", "data"],
    ["visualization", "business-outcome", "data"],
    ["quality-finding", "audit-outbox", "evidence"],
    ["quality-run", "audit-outbox", "evidence"],
    ["business-outcome", "finding", "evidence"],
    ["finding", "assurance-case", "control"],
    ["assurance-case", "pipeline", "control"],
    ["service-ticket", "assurance-case", "evidence"],
    ["service-ticket", "audit-outbox", "evidence"],
    ["business-outcome", "entity-360", "evidence"],
    ["assurance-case", "entity-360", "evidence"],
    ["dataset-version", "entity-360", "evidence"],
    ["entity-360", "integrity-run", "evidence"],
    ["integrity-run", "evidence-package", "evidence"],
    ["intelligence-proposal", "confirmation-gate", "intelligence"],
    ["confirmation-gate", "registered-action", "intelligence"],
    ["registered-action", "audit-outbox", "evidence"],
    ["tenant-project", "permission-rls", "control"],
    ["permission-rls", "dataset-version", "control"],
    ["permission-rls", "analytics-run", "control"],
    ["permission-rls", "cell-run", "control"],
    ["permission-rls", "registered-action", "control"],
    ["pipeline-run", "audit-outbox", "evidence"],
    ["analytics-run", "audit-outbox", "evidence"],
    ["anpy", "audit-outbox", "evidence"],
    ["cell-run", "audit-outbox", "evidence"],
    ["widget-run", "audit-outbox", "evidence"],
    ["audit-outbox", "entity-360", "evidence"]
  ].map(function (edge, index) {
    return {
      id: "edge-" + index,
      from: edge[0],
      to: edge[1],
      kind: edge[2],
      gap: (
        (edge[0] === "quality-run" && edge[1] === "dataset") ||
        (edge[0] === "assurance-case" && edge[1] === "pipeline") ||
        (edge[0] === "service-ticket" && edge[1] === "assurance-case")
      )
    };
  });

  var TOURS = {
    "regulatory-reporting": [
      "business-need", "source", "sql-console", "query-execution", "dataset",
      "dataset-version", "report-version", "analytics-run", "visualization",
      "business-outcome", "entity-360", "integrity-run", "evidence-package"
    ],
    "controlled-migration": [
      "business-need", "file-version", "sandbox", "table-version", "pipeline",
      "pipeline-run", "quality-run", "dataset", "dataset-version", "entity-360"
    ],
    "governed-analytics": [
      "source", "sql-console", "query-execution", "dataset", "dataset-version",
      "report", "report-version", "analytics-run", "visualization"
    ],
    "quality-blocks-delivery": [
      "source", "pipeline", "pipeline-run", "quality-run", "quality-finding",
      "audit-outbox", "entity-360", "integrity-run"
    ],
    "incident-recovery": [
      "business-outcome", "finding", "assurance-case", "pipeline",
      "pipeline-run", "quality-run", "dataset", "dataset-version",
      "entity-360", "integrity-run", "evidence-package"
    ],
    "controlled-ai-action": [
      "business-need", "intelligence-proposal", "confirmation-gate",
      "registered-action", "audit-outbox", "entity-360"
    ],
    "file-to-governed-data": [
      "file-version", "sandbox", "table-version", "dataset",
      "dataset-version", "report-version", "analytics-run"
    ],
    "evolve-versioned-contract": [
      "dataset", "dataset-version", "report", "report-version", "dashboard",
      "dashboard-run", "widget-run", "analytics-run", "visualization",
      "business-outcome", "entity-360"
    ],
    "controlled-python-analysis": [
      "business-need", "anpy", "cell-run", "audit-outbox", "entity-360",
      "integrity-run"
    ],
    "service-desk-handoff": [
      "service-ticket", "assurance-case", "entity-360",
      "integrity-run", "evidence-package"
    ]
  };

  var EVIDENCE_TARGET = "evidence-package";
  var EVIDENCE_PACKAGE_PROVENANCE = [
    "evidence-package", "integrity-run", "entity-360", "business-outcome",
    "visualization", "analytics-run", "report-version", "dataset-version",
    "dataset", "quality-run", "pipeline-run", "pipeline", "source", "business-need"
  ];

  function shortestDirectedPath(startId, targetId) {
    if (startId === targetId) {
      return [startId];
    }
    var queue = [startId];
    var visited = Object.create(null);
    var previous = Object.create(null);
    visited[startId] = true;
    previous[startId] = null;
    while (queue.length) {
      var currentId = queue.shift();
      for (var edgeIndex = 0; edgeIndex < EDGES.length; edgeIndex += 1) {
        var edge = EDGES[edgeIndex];
        if (edge.from !== currentId || visited[edge.to]) {
          continue;
        }
        visited[edge.to] = true;
        previous[edge.to] = currentId;
        if (edge.to === targetId) {
          var path = [targetId];
          var pathNodeId = targetId;
          while (previous[pathNodeId] !== null) {
            pathNodeId = previous[pathNodeId];
            path.push(pathNodeId);
          }
          return path.reverse();
        }
        queue.push(edge.to);
      }
    }
    return [];
  }

  function buildEvidenceTracePaths() {
    var paths = Object.create(null);
    NODES.forEach(function (node) {
      paths[node.id] = node.id === EVIDENCE_TARGET
        ? EVIDENCE_PACKAGE_PROVENANCE.slice()
        : shortestDirectedPath(node.id, EVIDENCE_TARGET);
    });
    return paths;
  }

  var TRACE_PATHS = buildEvidenceTracePaths();

  var NODE_CLAIMS = {
    "business-need": "tenant-project-scope",
    "source": "source-capability-contract",
    "file-version": "sandbox-file-versions",
    "sql-console": "sql-read-only",
    "query-execution": "sql-read-only",
    "saved-query": "sql-read-only",
    "sandbox": "managed-table-versioning",
    "table-version": "managed-table-versioning",
    "pipeline": "pipeline-schedule-boundary",
    "pipeline-run": "pipeline-executors",
    "quality-rule": "data-quality-boundaries",
    "quality-run": "data-quality-assertions",
    "quality-finding": "data-quality-assertions",
    "dataset": "dataset-version-contract",
    "dataset-version": "dataset-version-contract",
    "report": "analytics-governed",
    "report-draft": "analytics-governed",
    "visualization-draft": "analytics-governed",
    "report-version": "analytics-governed",
    "analytics-run": "analytics-governed",
    "anpy": "anpy-governed-runtime",
    "cell-run": "anpy-governed-runtime",
    "visualization": "analytics-governed",
    "dashboard": "analytics-governed",
    "dashboard-run": "analytics-governed",
    "widget-run": "analytics-governed",
    "business-outcome": "platform-control-layer",
    "finding": "assurance-read-model",
    "assurance-case": "assurance-read-model",
    "service-ticket": "bounded-by-default",
    "entity-360": "assurance-read-model",
    "integrity-run": "source-aware-integrity",
    "evidence-package": "evidence-package-checksum",
    "intelligence-proposal": "intelligence-bounded",
    "confirmation-gate": "intelligence-actions-controlled",
    "registered-action": "intelligence-actions-controlled",
    "tenant-project": "tenant-project-scope",
    "permission-rls": "bounded-by-default",
    "audit-outbox": "assurance-read-model"
  };

  var nodeById = Object.create(null);
  var zoneById = Object.create(null);
  NODES.forEach(function (node) { nodeById[node.id] = node; });
  ZONES.forEach(function (zone) { zoneById[zone.id] = zone; });

  function hasOwnKey(record, key) {
    return Boolean(
      record &&
      typeof key === "string" &&
      Object.prototype.hasOwnProperty.call(record, key)
    );
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function normalizeLayerSelection(input) {
    if (input === undefined || input === null) {
      return ALLOWED_LAYERS.slice();
    }
    if (input === "none") {
      return [];
    }
    var values = Array.isArray(input)
      ? input.slice()
      : String(input).split(",");
    if (!values.length) {
      return [];
    }
    values = values.map(function (value) {
      return String(value).trim();
    });
    if (
      values.some(function (value) {
        return !value || ALLOWED_LAYERS.indexOf(value) === -1;
      })
    ) {
      return ALLOWED_LAYERS.slice();
    }
    return ALLOWED_LAYERS.filter(function (layer) {
      return values.indexOf(layer) !== -1;
    });
  }

  function nextLayerSelection(current, layer) {
    var selected = normalizeLayerSelection(current);
    if (ALLOWED_LAYERS.indexOf(layer) === -1) {
      return selected;
    }
    if (selected.length === ALLOWED_LAYERS.length) {
      return [layer];
    }
    if (selected.length === 1) {
      return selected[0] === layer ? ALLOWED_LAYERS.slice() : [layer];
    }
    var next = selected.slice();
    var layerIndex = next.indexOf(layer);
    if (layerIndex === -1) {
      next.push(layer);
    } else {
      next.splice(layerIndex, 1);
    }
    return normalizeLayerSelection(next);
  }

  function parseLayerSelection(params) {
    if (!params.has("layers")) {
      return ALLOWED_LAYERS.slice();
    }
    return normalizeLayerSelection(params.get("layers"));
  }

  function serializeLayerSelection(input) {
    var layers = normalizeLayerSelection(input);
    if (layers.length === ALLOWED_LAYERS.length) {
      return "";
    }
    return layers.length ? layers.join(",") : "none";
  }

  function edgeLayer(kind) {
    return hasOwnKey(EDGE_LAYER_BY_KIND, kind)
      ? EDGE_LAYER_BY_KIND[kind]
      : null;
  }

  function nodeIdsForLayer(layer) {
    if (ALLOWED_LAYERS.indexOf(layer) === -1) {
      return [];
    }
    var ids = {};
    if (layer === "decision") {
      NODES.forEach(function (node) {
        if (node.decision) {
          ids[node.id] = true;
        }
      });
    } else {
      EDGES.forEach(function (edge) {
        if (edgeLayer(edge.kind) === layer) {
          ids[edge.from] = true;
          ids[edge.to] = true;
        }
      });
    }
    return NODES.map(function (node) { return node.id; }).filter(function (nodeId) {
      return Boolean(ids[nodeId]);
    });
  }

  function edgePathStepIndex(edge, path, reverse) {
    if (!edge || !Array.isArray(path)) {
      return -1;
    }
    for (var index = 0; index < path.length - 1; index += 1) {
      var from = reverse ? path[index + 1] : path[index];
      var to = reverse ? path[index] : path[index + 1];
      if (edge.from === from && edge.to === to) {
        return index;
      }
    }
    return -1;
  }

  function traceEdgeStepIndex(edge, path) {
    var directedIndex = edgePathStepIndex(edge, path, false);
    return directedIndex >= 0
      ? directedIndex
      : edgePathStepIndex(edge, path, true);
  }

  function tourRouteState(edge, path, step) {
    var routeIndex = edgePathStepIndex(edge, path, false);
    if (routeIndex < 0) {
      return "off-route";
    }
    var boundedStep = clamp(
      Math.floor(Number(step) || 0),
      0,
      Math.max(0, path.length - 1)
    );
    var currentIndex = boundedStep === 0
      ? 0
      : Math.min(boundedStep - 1, path.length - 2);
    if (routeIndex < currentIndex) {
      return "visited";
    }
    if (routeIndex === currentIndex) {
      return "current";
    }
    return "future";
  }

  function normalizeMapState(input) {
    var candidate = input || {};
    var scene = hasOwnKey(zoneById, candidate.scene)
      ? candidate.scene
      : null;
    var objectId = hasOwnKey(nodeById, candidate.object)
      ? candidate.object
      : null;
    var tour = hasOwnKey(TOURS, candidate.tour)
      ? candidate.tour
      : null;
    var rawLevel = Number(candidate.level);
    var rawStep = Number(candidate.step);
    var level = clamp(
      Number.isFinite(rawLevel) ? Math.floor(rawLevel) : 0,
      0,
      5
    );
    var step = clamp(
      Number.isFinite(rawStep) ? Math.floor(rawStep) : 0,
      0,
      24
    );
    var role = ALLOWED_ROLES.indexOf(candidate.role) !== -1
      ? candidate.role
      : "all";
    var exportMode = ALLOWED_EXPORTS.indexOf(candidate.exportMode) !== -1
      ? candidate.exportMode
      : null;
    var motionMode = ALLOWED_MOTION.indexOf(candidate.motionMode) !== -1
      ? candidate.motionMode
      : "auto";
    var layers = normalizeLayerSelection(candidate.layers);

    if (exportMode) {
      layers = ALLOWED_LAYERS.slice();
    }

    if (tour) {
      var tourSteps = TOURS[tour];
      step = clamp(step, 0, tourSteps.length - 1);
      objectId = tourSteps[step];
      scene = nodeById[objectId].zone;
      level = 4;
    } else if (objectId) {
      scene = nodeById[objectId].zone;
      level = clamp(Math.max(3, level), 3, 5);
    } else if (scene) {
      level = clamp(Math.max(1, level), 1, 2);
    } else {
      level = 0;
    }

    return {
      scene: scene,
      object: objectId,
      level: level,
      tour: tour,
      step: tour ? step : 0,
      role: role,
      evidence: candidate.evidence === true || level === 5,
      exportMode: exportMode,
      motionMode: motionMode,
      layers: layers
    };
  }

  function traceNodeIds(objectId, evidenceEnabled) {
    if (!evidenceEnabled) {
      return [];
    }
    if (!objectId) {
      return TRACE_PATHS["business-outcome"].slice();
    }
    if (
      !hasOwnKey(nodeById, objectId) ||
      !hasOwnKey(TRACE_PATHS, objectId)
    ) {
      return [];
    }
    return TRACE_PATHS[objectId].slice();
  }

  function nextEvidenceState(current) {
    return !Boolean(current);
  }

  function nodeIsMuted(node, mapState) {
    var zone = zoneById[node.zone];
    var outsideScene = Boolean(
      mapState.scene &&
      node.zone !== mapState.scene &&
      !(zone && zone.crossCutting)
    );
    var outsideRole = mapState.role !== "all" &&
      node.roles.indexOf(mapState.role) === -1;
    return outsideRole || outsideScene;
  }

  function motionIsExplicitlyPaused(mode) {
    return mode === "paused" || mode === "off";
  }

  function nextMotionMode(mode) {
    return motionIsExplicitlyPaused(mode) ? "auto" : "paused";
  }

  function flowModeForState(input) {
    var mapState = normalizeMapState(input);
    if (mapState.tour) {
      return "tour";
    }
    if (mapState.object || mapState.scene || mapState.evidence) {
      return "focus";
    }
    return "platform";
  }

  function edgeFlowState(input) {
    var details = input || {};
    if (details.mode === "tour") {
      return details.routeState === "current" ? "tour" : "off";
    }
    if (details.mode === "focus") {
      return (
        details.tracedEdge ||
        (
          details.selectedLayer &&
          (details.objectEdge || details.sceneEdge)
        )
      ) ? "focus" : "off";
    }
    return details.mode === "platform" && details.selectedLayer
      ? "platform"
      : "off";
  }

  function endTourForNavigation(input) {
    var next = normalizeMapState(input);
    if (!next.tour) {
      return next;
    }
    next.tour = null;
    next.step = 0;
    return next;
  }

  function normalizeViewportSnapshot(input) {
    if (!input) {
      return null;
    }
    var x = Number(input.x);
    var y = Number(input.y);
    var scale = Number(input.scale);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(scale)) {
      return null;
    }
    return {
      x: clamp(x, -MAX_CAMERA_X, MAX_CAMERA_X),
      y: clamp(y, -MAX_CAMERA_Y, MAX_CAMERA_Y),
      scale: clamp(scale, MIN_SCALE, MAX_SCALE)
    };
  }

  function parseViewportState(search) {
    var params = new URLSearchParams(search || "");
    if (!params.has("x") || !params.has("y") || !params.has("z")) {
      return null;
    }
    var values = [params.get("x"), params.get("y"), params.get("z")];
    if (values.some(function (value) {
      return value === null || String(value).trim() === "";
    })) {
      return null;
    }
    return normalizeViewportSnapshot({
      x: values[0],
      y: values[1],
      scale: values[2]
    });
  }

  function serializeViewportState(input) {
    var viewport = normalizeViewportSnapshot(input);
    if (!viewport) {
      return "";
    }
    var params = new URLSearchParams();
    params.set("x", String(Number(viewport.x.toFixed(2))));
    params.set("y", String(Number(viewport.y.toFixed(2))));
    params.set("z", String(Number(viewport.scale.toFixed(4))));
    return params.toString();
  }

  function appendViewportState(query, input) {
    var viewportQuery = serializeViewportState(input);
    var params = new URLSearchParams(query || "");
    if (!viewportQuery) {
      params.delete("x");
      params.delete("y");
      params.delete("z");
      return params.toString();
    }
    var viewportParams = new URLSearchParams(viewportQuery);
    ["x", "y", "z"].forEach(function (key) {
      params.set(key, viewportParams.get(key));
    });
    return params.toString();
  }

  function normalizeFocusSnapshot(input) {
    if (!input || typeof input !== "object") {
      return null;
    }
    if (input.target === "viewport" || input.target === "story") {
      return { target: input.target };
    }
    if (
      input.target === "legend" &&
      ALLOWED_LAYERS.indexOf(input.layer) !== -1
    ) {
      return {
        target: "legend",
        layer: input.layer
      };
    }
    if (
      (input.target === "node" || input.target === "inspector") &&
      hasOwnKey(nodeById, input.object)
    ) {
      return {
        target: input.target,
        object: input.object
      };
    }
    return null;
  }

  function shouldHandleWheelZoom(options) {
    return Boolean(options && DIRECT_CAMERA_GESTURES);
  }

  function executionFactValue(node) {
    return node ? node.input + " → " + node.output : "";
  }

  function evidenceFactValue(node, evidenceLabel) {
    if (!node) {
      return "";
    }
    return [
      node.version,
      node.scope,
      node.claimId || NODE_CLAIMS[node.id],
      evidenceLabel
    ].filter(Boolean).join(" · ");
  }

  function inspectorShouldBeModal(mobile, hidden) {
    return Boolean(mobile && !hidden);
  }

  function readonlyClone(value) {
    var copy = JSON.parse(JSON.stringify(value));
    function freeze(item) {
      if (!item || typeof item !== "object" || Object.isFrozen(item)) {
        return item;
      }
      Object.keys(item).forEach(function (key) {
        freeze(item[key]);
      });
      return Object.freeze(item);
    }
    return freeze(copy);
  }

  function copyAttributes(element) {
    var copy = {};
    if (!element) {
      return copy;
    }
    Object.keys(element.dataset).forEach(function (key) {
      copy[key] = element.dataset[key];
    });
    return copy;
  }

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (text !== undefined) {
      element.textContent = text;
    }
    return element;
  }

  function parseMapState(search) {
    var params = new URLSearchParams(search || "");
    var requestedObjectId = params.get("object");
    var requestedScene = params.get("scene");
    var requestedTour = params.get("tour");
    var objectId = hasOwnKey(nodeById, requestedObjectId)
      ? requestedObjectId
      : null;
    var scene = hasOwnKey(zoneById, requestedScene)
      ? requestedScene
      : null;
    var tour = hasOwnKey(TOURS, requestedTour)
      ? requestedTour
      : null;
    var defaultLevel = tour ? 4 : (objectId ? 3 : (scene ? 1 : 0));
    return normalizeMapState({
      scene: scene,
      object: objectId,
      level: Number(params.get("level") || defaultLevel),
      tour: tour,
      step: Number(params.get("step") || 0),
      role: params.get("role") || "all",
      evidence: params.get("evidence") === "on",
      exportMode: params.get("export"),
      motionMode: params.get("motion") || "auto",
      layers: parseLayerSelection(params)
    });
  }

  function parseWorldEntryState(search) {
    var params = new URLSearchParams(search || "");
    if (params.get("entry") !== WORLD_ENTRY_ID) {
      return null;
    }
    var tourId = params.get("tour");
    return {
      entryId: WORLD_ENTRY_ID,
      tourId: hasOwnKey(TOURS, tourId)
        ? tourId
        : null
    };
  }

  function worldEntryUrl(locationLike) {
    locationLike = locationLike || {};
    var params = new URLSearchParams(locationLike.search || "");
    params.delete("entry");
    var query = params.toString();
    return String(locationLike.pathname || "") +
      (query ? "?" + query : "") +
      String(locationLike.hash || "");
  }

  function dispatchWorldHandoffReceived(entryState, options) {
    options = options || {};
    if (
      !entryState ||
      entryState.entryId !== WORLD_ENTRY_ID ||
      !entryState.tourId ||
      !hasOwnKey(TOURS, entryState.tourId)
    ) {
      return false;
    }

    var eventTarget = options.eventTarget;
    var CustomEventConstructor = options.CustomEvent;
    if (
      !eventTarget ||
      typeof eventTarget.dispatchEvent !== "function" ||
      typeof CustomEventConstructor !== "function"
    ) {
      return false;
    }

    try {
      var event = new CustomEventConstructor(WORLD_EXPERIENCE_EVENT, {
        detail: {
          contract: WORLD_EXPERIENCE_CONTRACT,
          event: "handoff_received",
          payload: {
            tour_id: entryState.tourId
          }
        }
      });
      eventTarget.dispatchEvent(event);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function applyWorldEntryTransition(root, entryState, options) {
    options = options || {};
    if (!root || !entryState || entryState.entryId !== WORLD_ENTRY_ID) {
      return false;
    }

    var reducedMotion = Boolean(options.reducedMotion);
    root.dataset.worldEntry = reducedMotion ? "received" : "settling";

    var historyLike = options.history;
    var locationLike = options.location;
    if (
      historyLike &&
      typeof historyLike.replaceState === "function" &&
      locationLike
    ) {
      try {
        historyLike.replaceState(
          historyLike.state || null,
          "",
          worldEntryUrl(locationLike)
        );
      } catch (_error) {
        // The visual handoff must never interrupt canonical navigation.
      }
    }

    dispatchWorldHandoffReceived(entryState, options);

    if (reducedMotion) {
      return true;
    }

    var requestFrame = options.requestAnimationFrame;
    if (typeof requestFrame !== "function") {
      root.dataset.worldEntry = "received";
      return true;
    }
    requestFrame(function () {
      requestFrame(function () {
        root.dataset.worldEntry = "received";
      });
    });
    return true;
  }

  function queryState() {
    return parseMapState(window.location.search);
  }

  function serializeState(state) {
    state = normalizeMapState(state);
    var params = new URLSearchParams();
    if (state.scene && hasOwnKey(zoneById, state.scene)) {
      params.set("scene", state.scene);
    }
    if (state.object && hasOwnKey(nodeById, state.object)) {
      params.set("object", state.object);
    }
    if (state.level) {
      params.set("level", String(clamp(Number(state.level) || 0, 0, 5)));
    }
    if (state.tour && hasOwnKey(TOURS, state.tour)) {
      params.set("tour", state.tour);
      params.set("step", String(clamp(Math.floor(Number(state.step) || 0), 0, 24)));
    }
    if (state.role && state.role !== "all" && ALLOWED_ROLES.indexOf(state.role) !== -1) {
      params.set("role", state.role);
    }
    if (state.evidence) {
      params.set("evidence", "on");
    }
    if (state.exportMode && ALLOWED_EXPORTS.indexOf(state.exportMode) !== -1) {
      params.set("export", state.exportMode);
    }
    if (
      state.motionMode &&
      state.motionMode !== "auto" &&
      ALLOWED_MOTION.indexOf(state.motionMode) !== -1
    ) {
      params.set("motion", state.motionMode);
    }
    var serializedLayers = serializeLayerSelection(state.layers);
    if (serializedLayers) {
      params.set("layers", serializedLayers);
    }
    return params.toString();
  }

  function prepareExportLayout(
    fitLayout,
    verifyLayout,
    publishReady,
    fontsReady
  ) {
    var render = function () {
      fitLayout();
      if (verifyLayout() === false) {
        return false;
      }
      publishReady();
      return true;
    };
    var initialReady = render();
    if (fontsReady && typeof fontsReady.then === "function") {
      fontsReady.then(render);
    }
    return initialReady;
  }

  function prepareWorkspaceOnLoad(options) {
    options = options || {};
    if (options.exportMode || typeof options.fitState !== "function") {
      return false;
    }
    var prepare = function () {
      options.fitState();
      if (options.root && options.root.dataset) {
        options.root.dataset.workspaceReady = "true";
      }
    };
    if (typeof options.requestAnimationFrame === "function") {
      options.requestAnimationFrame(prepare);
    } else {
      prepare();
    }
    return true;
  }

  function initSystemMap(root) {
    var workspace = root.querySelector("[data-map-workspace]");
    var viewport = root.querySelector("[data-map-viewport]");
    var canvas = root.querySelector("[data-map-canvas]");
    var zonesLayer = root.querySelector("[data-map-zones]");
    var zoneLabelsLayer = root.querySelector("[data-map-zone-labels]");
    var zoneIndex = root.querySelector("[data-map-zone-index]");
    var nodesLayer = root.querySelector("[data-map-nodes]");
    var edgesLayer = root.querySelector("[data-map-edges]");
    var mobileRelationshipList = root.querySelector("[data-mobile-relationship-list]");
    var mobileRelationshipCount = root.querySelector("[data-mobile-relationship-count]");
    var inspector = root.querySelector("[data-map-inspector]");
    var live = root.querySelector("[data-map-live]");
    var localizedRoot = root.querySelector("[data-map-localized]");
    var copy = copyAttributes(localizedRoot);
    var mobileQuery = window.matchMedia(MOBILE_QUERY);
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var nodeElements = {};
    var zoneElements = {};
    var zoneLabelElements = {};
    var zoneIndexElements = {};
    var edgeElements = {};
    var edgeGroups = {};
    var edgeRailElements = {};
    var edgeMotionElements = {};
    var mobileRelationshipElements = {};
    var initialViewportState = parseViewportState(window.location.search);
    var viewportState = initialViewportState || { x: 0, y: 0, scale: 1 };
    var state = queryState();
    var worldEntryState = parseWorldEntryState(window.location.search);
    var drag = null;
    var pinch = null;
    var pointers = {};
    var frame = null;
    var lastFocusedNode = null;
    var previewNodeId = null;
    var keyboardNodeId = state.object || "dataset-version";
    var mapVisible = true;
    var mobileModalBackground = Array.prototype.slice.call(
      document.querySelectorAll([
        ".site-header",
        ".breadcrumbs",
        ".site-footer",
        ".site-return-to-start",
        ".system-map__intro",
        ".system-map__utility",
        ".system-map__rail",
        ".system-map__viewport",
        ".system-map__zoom",
        ".system-map__zone-index",
        ".system-map__legend",
        ".system-map__mobile-relationships",
        ".system-map__outline",
        ".map-story"
      ].join(","))
    );
    root.dataset.motion = state.motionMode;
    applyWorldEntryTransition(root, worldEntryState, {
      history: window.history,
      location: window.location,
      reducedMotion: reducedMotion.matches,
      eventTarget: window,
      CustomEvent: window.CustomEvent,
      requestAnimationFrame: window.requestAnimationFrame
        ? window.requestAnimationFrame.bind(window)
        : null
    });

    var boundaryCopy = {};
    var claimCopy = {};
    Array.prototype.forEach.call(
      localizedRoot.querySelectorAll("[data-boundary-copy]"),
      function (element) {
        boundaryCopy[element.dataset.boundaryCopy] = element.textContent.trim();
      }
    );
    Array.prototype.forEach.call(
      localizedRoot.querySelectorAll("[data-claim-copy]"),
      function (element) {
        claimCopy[element.dataset.claimCopy] = {
          status: element.dataset.status,
          owner: element.dataset.owner,
          caveat: element.dataset.caveat
        };
      }
    );
    var zoneCopy = {};
    Array.prototype.forEach.call(
      localizedRoot.querySelectorAll("[data-zone-copy]"),
      function (element) {
        zoneCopy[ZONES[Number(element.dataset.zoneCopy)].id] = {
          title: element.dataset.title,
          body: element.dataset.body
        };
      }
    );
    Array.prototype.forEach.call(
      localizedRoot.querySelectorAll("[data-node-copy]"),
      function (element) {
        var node = nodeById[element.dataset.nodeCopy];
        if (!node) {
          return;
        }
        ["title", "kind", "owner", "input", "output", "state", "scope"].forEach(
          function (field) {
            if (element.dataset[field]) {
              node[field] = element.dataset[field];
            }
          }
        );
      }
    );
    NODES.forEach(function (node) {
      var claimId = NODE_CLAIMS[node.id];
      var claim = claimId ? claimCopy[claimId] : null;
      if (!claim) {
        return;
      }
      node.claimId = claimId;
      node.status = claim.status;
      node.claimCaveat = claim.caveat;
    });

    function statusLabel(status) {
      return {
        available: copy.statusAvailable,
        baseline: copy.statusBaseline,
        production_oriented: copy.statusBaseline,
        dependent: copy.statusDependent,
        environment_dependent: copy.statusDependent,
        planned: copy.statusPlanned
      }[status] || status;
    }

    function kindLabel(node, level) {
      if (level >= 5) {
        return copy.evidenceKind;
      }
      if (level >= 4 || node.kind === "run") {
        return copy.runKind;
      }
      return copy.objectKind;
    }

    function nodeSummary(node, level) {
      var base = zoneCopy[node.zone] ? zoneCopy[node.zone].body : "";
      if (level >= 5) {
        return node.title + " · " + node.version + " · " + node.scope + ". " + base;
      }
      if (level >= 4) {
        return node.input + " → " + node.output + ". " + base;
      }
      return base;
    }

    function announce(message) {
      live.textContent = "";
      window.requestAnimationFrame(function () {
        live.textContent = message;
      });
    }

    function syncMotion() {
      var dialogOpen = Boolean(root.querySelector("dialog[open]"));
      var explicitlyPaused = motionIsExplicitlyPaused(state.motionMode);
      var paused = explicitlyPaused ||
        reducedMotion.matches ||
        document.hidden ||
        !mapVisible ||
        dialogOpen;
      root.dataset.motion = paused ? "paused" : "auto";
      root.dataset.motionPreference = state.motionMode;
      if (paused && typeof edgesLayer.pauseAnimations === "function") {
        edgesLayer.pauseAnimations();
      } else if (!paused && typeof edgesLayer.unpauseAnimations === "function") {
        edgesLayer.unpauseAnimations();
      }
      var button = root.querySelector("[data-motion-toggle]");
      if (button) {
        button.setAttribute("aria-pressed", String(explicitlyPaused));
        button.querySelector("[data-motion-label]").textContent =
          explicitlyPaused
            ? button.dataset.resumeLabel
            : button.dataset.pauseLabel;
      }
    }

    function renderZones() {
      ZONES.forEach(function (zone, index) {
        var element = createElement("div", "map-zone");
        var label = createElement("button", "map-zone-label");
        var indexCard = createElement("button", "system-map__zone-card");
        var details = zoneCopy[zone.id] || { title: zone.id, body: "" };
        element.dataset.zoneId = zone.id;
        element.setAttribute("aria-hidden", "true");
        element.style.left = zone.x + "px";
        element.style.top = zone.y + "px";
        element.style.width = zone.width + "px";
        element.style.height = zone.height + "px";
        zonesLayer.appendChild(element);

        label.type = "button";
        label.dir = root.dataset.direction || "ltr";
        label.dataset.zoneId = zone.id;
        label.style.left = (zone.x + 12) + "px";
        label.style.top = (zone.y + 9) + "px";
        label.style.width = (zone.width - 24) + "px";
        label.setAttribute("aria-describedby", "map-zone-description-" + zone.id);
        label.appendChild(
          createElement("span", "map-zone__index", "0" + (index + 1) + " · L1 / L2")
        );
        label.appendChild(createElement("strong", "map-zone__title", details.title));
        label.addEventListener("click", function () {
          enterZone(zone.id, true);
        });
        label.addEventListener("pointerenter", function () {
          element.dataset.preview = "true";
        });
        label.addEventListener("pointerleave", function () {
          element.dataset.preview = "false";
        });
        zoneLabelsLayer.appendChild(label);

        indexCard.type = "button";
        indexCard.dir = root.dataset.direction || "ltr";
        indexCard.dataset.zoneId = zone.id;
        indexCard.id = "map-zone-description-" + zone.id;
        indexCard.appendChild(
          createElement("span", "map-zone__index", "0" + (index + 1) + " · L1 / L2")
        );
        indexCard.appendChild(createElement("strong", "map-zone__title", details.title));
        indexCard.appendChild(createElement("span", "map-zone__summary", details.body));
        indexCard.addEventListener("click", function () {
          enterZone(zone.id, true);
        });
        zoneIndex.appendChild(indexCard);

        zoneElements[zone.id] = element;
        zoneLabelElements[zone.id] = label;
        zoneIndexElements[zone.id] = indexCard;
      });
    }

    function renderNodes() {
      NODES.forEach(function (node) {
        var element = createElement("button", "map-node");
        element.type = "button";
        element.dataset.nodeId = node.id;
        element.dataset.zone = node.zone;
        element.dataset.status = node.status;
        element.dir = root.dataset.direction || "ltr";
        if (node.core) {
          element.dataset.core = "true";
        }
        if (node.gate) {
          element.dataset.gate = "true";
        }
        if (node.decision) {
          element.dataset.decision = "true";
          element.dataset.decisionVisible = "true";
        }
        element.style.left = node.x + "px";
        element.style.top = node.y + "px";
        element.style.setProperty(
          "--map-node-max-width",
          nodeWidthLimit(node) + "px"
        );
        element.setAttribute(
          "aria-label",
          node.title + ". " + statusLabel(node.status) + ". " + node.output
        );
        element.appendChild(createElement("span", "map-node__kind", node.kind));
        element.appendChild(createElement("strong", "map-node__title", node.title));
        element.appendChild(createElement("span", "map-node__meta", node.output));
        element.appendChild(
          createElement("span", "map-node__status", statusLabel(node.status))
        );
        var routeConnector = createElement("span", "map-node__route-connector");
        routeConnector.setAttribute("aria-hidden", "true");
        element.appendChild(routeConnector);
        element.addEventListener("click", function () {
          selectNode(node.id, true);
        });
        element.addEventListener("pointerenter", function () {
          previewNodeId = node.id;
          updateVisualState();
        });
        element.addEventListener("pointerleave", function () {
          if (previewNodeId === node.id) {
            previewNodeId = null;
            updateVisualState();
          }
        });
        element.addEventListener("focus", function () {
          previewNodeId = node.id;
          keyboardNodeId = node.id;
          updateNodeTabStops();
          updateVisualState();
        });
        element.addEventListener("blur", function () {
          if (previewNodeId === node.id) {
            previewNodeId = null;
            updateVisualState();
          }
        });
        element.addEventListener("keydown", function (event) {
          if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(event.key) === -1) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          focusDirectionalNode(node.id, event.key);
        });
        nodesLayer.appendChild(element);
        nodeElements[node.id] = element;
      });
    }

    function updateNodeTabStops() {
      NODES.forEach(function (node) {
        var element = nodeElements[node.id];
        if (!element) {
          return;
        }
        if (mobileQuery.matches) {
          element.tabIndex = roleMatches(node) ? 0 : -1;
          return;
        }
        element.tabIndex = node.id === keyboardNodeId && roleMatches(node) ? 0 : -1;
      });
    }

    function focusDirectionalNode(currentId, key) {
      var current = nodeById[currentId];
      if (!current) {
        return;
      }
      var best = null;
      var bestScore = Number.POSITIVE_INFINITY;
      NODES.forEach(function (candidate) {
        if (candidate.id === current.id || !roleMatches(candidate)) {
          return;
        }
        var deltaX = candidate.x - current.x;
        var deltaY = candidate.y - current.y;
        var primary;
        var secondary;
        if (key === "ArrowLeft" && deltaX < 0) {
          primary = -deltaX;
          secondary = Math.abs(deltaY);
        } else if (key === "ArrowRight" && deltaX > 0) {
          primary = deltaX;
          secondary = Math.abs(deltaY);
        } else if (key === "ArrowUp" && deltaY < 0) {
          primary = -deltaY;
          secondary = Math.abs(deltaX);
        } else if (key === "ArrowDown" && deltaY > 0) {
          primary = deltaY;
          secondary = Math.abs(deltaX);
        } else {
          return;
        }
        var score = primary + (secondary * 1.8);
        if (score < bestScore) {
          bestScore = score;
          best = candidate;
        }
      });
      if (!best) {
        return;
      }
      keyboardNodeId = best.id;
      updateNodeTabStops();
      nodeElements[best.id].focus({ preventScroll: true });
      fitNode(best.id);
      updateUrl(true, { target: "node", object: best.id });
      announce(best.title + " · " + statusLabel(best.status));
    }

    function nodeWidthLimit(node) {
      var zone = zoneById[node.zone];
      var nextInRow = NODES.filter(function (candidate) {
        return candidate.zone === node.zone &&
          candidate.x > node.x &&
          Math.abs(candidate.y - node.y) < 56;
      }).sort(function (left, right) { return left.x - right.x; })[0];
      var available = nextInRow
        ? nextInRow.x - node.x - 12
        : ((zone ? zone.x + zone.width : MAP_WIDTH) - node.x - 18);
      var minimum = node.core ? CORE_NODE_MIN_WIDTH : NODE_MIN_WIDTH;
      var maximum = node.core ? CORE_NODE_MAX_WIDTH : NODE_MAX_WIDTH;
      return clamp(available, minimum, maximum);
    }

    function nodeDimensions(node) {
      var element = nodeElements[node.id];
      var fallbackWidth = node.core ? CORE_NODE_MIN_WIDTH : NODE_MIN_WIDTH;
      var fallbackHeight = node.core
        ? CORE_NODE_FALLBACK_HEIGHT
        : NODE_FALLBACK_HEIGHT;
      return {
        width: element && element.offsetWidth > 0
          ? element.offsetWidth
          : fallbackWidth,
        height: element && element.offsetHeight > 0
          ? element.offsetHeight
          : fallbackHeight
      };
    }

    function nodeAnchor(node, side) {
      var dimensions = nodeDimensions(node);
      return {
        x: side === "start" ? node.x + dimensions.width : node.x,
        y: node.y + (dimensions.height / 2)
      };
    }

    function edgePath(edge) {
      var from = nodeAnchor(nodeById[edge.from], "start");
      var to = nodeAnchor(nodeById[edge.to], "end");
      var direction = to.x >= from.x ? 1 : -1;
      var bend = Math.max(42, Math.abs(to.x - from.x) * 0.42);
      if (Math.abs(to.y - from.y) > 210 && Math.abs(to.x - from.x) < 250) {
        var middleY = from.y + ((to.y - from.y) / 2);
        return "M" + from.x + " " + from.y +
          " C" + (from.x + (80 * direction)) + " " + middleY +
          " " + (to.x - (80 * direction)) + " " + middleY +
          " " + to.x + " " + to.y;
      }
      return "M" + from.x + " " + from.y +
        " C" + (from.x + (bend * direction)) + " " + from.y +
        " " + (to.x - (bend * direction)) + " " + to.y +
        " " + to.x + " " + to.y;
    }

    function renderEdges() {
      edgesLayer.setAttribute("viewBox", "0 0 " + MAP_WIDTH + " " + MAP_HEIGHT);
      EDGES.forEach(function (edge, edgeIndex) {
        var group = document.createElementNS(SVG_NS, "g");
        var storyRail = document.createElementNS(SVG_NS, "path");
        var path = document.createElementNS(SVG_NS, "path");
        var pathData = edgePath(edge);
        var layer = edgeLayer(edge.kind);
        group.setAttribute("class", "map-edge-group");
        group.dataset.edgeId = edge.id;
        group.dataset.kind = edge.kind;
        group.dataset.layer = layer;
        group.dataset.layerVisible = "true";
        group.dataset.routeState = "off-route";
        group.dataset.flowState = "off";
        group.style.setProperty(
          "--map-flow-delay",
          "-" + ((edgeIndex % 11) * 0.19).toFixed(2) + "s"
        );
        group.style.setProperty(
          "--map-flow-duration",
          (4.2 + ((edgeIndex % 7) * 0.19)).toFixed(2) + "s"
        );
        storyRail.setAttribute("class", "map-edge-story-rail");
        storyRail.setAttribute("d", pathData);
        storyRail.setAttribute("pathLength", "100");
        storyRail.setAttribute("vector-effect", "non-scaling-stroke");
        group.appendChild(storyRail);
        path.setAttribute("class", "map-edge");
        path.setAttribute("d", pathData);
        path.setAttribute("pathLength", "100");
        path.dataset.edgeId = edge.id;
        path.dataset.kind = edge.kind;
        path.dataset.gap = String(edge.gap);
        group.appendChild(path);
        var packet = document.createElementNS(SVG_NS, "rect");
        packet.setAttribute("class", "map-edge-story-packet");
        packet.setAttribute("width", "18");
        packet.setAttribute("height", "18");
        packet.setAttribute("x", "-9");
        packet.setAttribute("y", "-9");
        packet.setAttribute("transform", "rotate(45)");
        packet.setAttribute("vector-effect", "non-scaling-stroke");
        var motion = document.createElementNS(SVG_NS, "animateMotion");
        motion.setAttribute("dur", "1.35s");
        motion.setAttribute("begin", "indefinite");
        motion.setAttribute("repeatCount", "indefinite");
        motion.setAttribute("path", pathData);
        packet.appendChild(motion);
        group.appendChild(packet);
        edgesLayer.appendChild(group);
        edgeElements[edge.id] = path;
        edgeGroups[edge.id] = group;
        edgeRailElements[edge.id] = storyRail;
        edgeMotionElements[edge.id] = motion;

        var relationship = createElement("li", "system-map__mobile-relationship");
        var layerButton = root.querySelector('[data-map-layer="' + layer + '"]');
        relationship.dataset.edgeId = edge.id;
        relationship.dataset.layer = layer;
        relationship.dataset.layerVisible = "true";
        relationship.textContent =
          nodeById[edge.from].title + " → " + nodeById[edge.to].title +
          " · " + (layerButton ? layerButton.textContent.trim() : layer);
        mobileRelationshipList.appendChild(relationship);
        mobileRelationshipElements[edge.id] = relationship;
      });
    }

    function refreshEdgeGeometry() {
      EDGES.forEach(function (edge) {
        if (!edgeElements[edge.id]) {
          return;
        }
        var pathData = edgePath(edge);
        edgeElements[edge.id].setAttribute("d", pathData);
        edgeRailElements[edge.id].setAttribute("d", pathData);
        edgeMotionElements[edge.id].setAttribute("path", pathData);
      });
    }

    function applyTransform(immediate) {
      if (mobileQuery.matches) {
        canvas.style.transform = "";
        return;
      }
      if (immediate) {
        viewport.dataset.dragging = "true";
      }
      canvas.style.transform =
        "translate3d(" + viewportState.x + "px," + viewportState.y + "px,0) " +
        "scale(" + viewportState.scale + ")";
      if (immediate) {
        window.requestAnimationFrame(function () {
          viewport.removeAttribute("data-dragging");
        });
      }
    }

    function fitBounds(bounds, options) {
      if (mobileQuery.matches) {
        return;
      }
      var padding = (options && options.padding) || 72;
      var minimumScale = options && Number.isFinite(options.minScale)
        ? options.minScale
        : MIN_SCALE;
      var maximumScale = options && Number.isFinite(options.maxScale)
        ? options.maxScale
        : MAX_SCALE;
      var insetInlineEnd = options && Number.isFinite(options.insetInlineEnd)
        ? Math.max(0, options.insetInlineEnd)
        : 0;
      var insetBlockEnd = options && Number.isFinite(options.insetBlockEnd)
        ? Math.max(0, options.insetBlockEnd)
        : 0;
      var safeX = padding + (
        root.dataset.direction === "rtl" ? insetInlineEnd : 0
      );
      var width = Math.max(
        1,
        viewport.clientWidth - (padding * 2) - insetInlineEnd
      );
      var height = Math.max(
        1,
        viewport.clientHeight - (padding * 2) - insetBlockEnd
      );
      var scale = clamp(
        Math.min(width / bounds.width, height / bounds.height),
        minimumScale,
        maximumScale
      );
      viewportState.scale = scale;
      viewportState.x = safeX + ((width - (bounds.width * scale)) / 2) -
        (bounds.x * scale);
      viewportState.y = padding + ((height - (bounds.height * scale)) / 2) -
        (bounds.y * scale);
      applyTransform(Boolean(options && options.immediate));
    }

    function fitAll(immediate, options) {
      var fitOptions = options || {};
      fitBounds(
        { x: 25, y: 60, width: MAP_WIDTH - 50, height: MAP_HEIGHT - 75 },
        {
          padding: Number.isFinite(fitOptions.padding) ? fitOptions.padding : 35,
          immediate: immediate,
          minScale: fitOptions.minScale,
          maxScale: fitOptions.maxScale
        }
      );
    }

    function fitZone(zoneId, options) {
      var zone = zoneById[zoneId];
      if (!zone) {
        fitAll(false, options);
        return;
      }
      var fitOptions = options || {};
      fitBounds(
        {
          x: zone.x - 35,
          y: zone.y - 55,
          width: zone.width + 70,
          height: zone.height + 110
        },
        {
          padding: Number.isFinite(fitOptions.padding) ? fitOptions.padding : 90,
          immediate: Boolean(fitOptions.immediate),
          minScale: fitOptions.minScale,
          maxScale: fitOptions.maxScale
        }
      );
    }

    function fitNode(nodeId) {
      var node = nodeById[nodeId];
      if (!node) {
        return;
      }
      var dimensions = nodeDimensions(node);
      fitBounds(
        {
          x: node.x - 75,
          y: node.y - 85,
          width: dimensions.width + 150,
          height: dimensions.height + 170
        },
        {
          padding: inspector.hidden ? 92 : Math.min(210, viewport.clientWidth * 0.2),
          maxScale: NODE_FOCUS_MAX_SCALE
        }
      );
    }

    function fitTourSegment(path, step) {
      if (!Array.isArray(path) || !path.length || mobileQuery.matches) {
        return;
      }
      var currentIndex = clamp(
        Math.floor(Number(step) || 0),
        0,
        path.length - 1
      );
      var fromIndex = currentIndex === 0 ? 0 : currentIndex - 1;
      var toIndex = currentIndex === 0
        ? Math.min(1, path.length - 1)
        : currentIndex;
      var from = nodeById[path[fromIndex]];
      var to = nodeById[path[toIndex]];
      if (!from || !to) {
        return;
      }
      var fromDimensions = nodeDimensions(from);
      var toDimensions = nodeDimensions(to);
      var left = Math.min(from.x, to.x) - 95;
      var top = Math.min(from.y, to.y) - 95;
      var right = Math.max(
        from.x + fromDimensions.width,
        to.x + toDimensions.width
      ) + 95;
      var bottom = Math.max(
        from.y + fromDimensions.height,
        to.y + toDimensions.height
      ) + 95;
      fitBounds(
        {
          x: left,
          y: top,
          width: Math.max(260, right - left),
          height: Math.max(230, bottom - top)
        },
        {
          padding: 48,
          maxScale: STORY_FOCUS_MAX_SCALE,
          insetInlineEnd: inspector.hidden
            ? 0
            : Math.min(400, viewport.clientWidth * 0.3),
          insetBlockEnd: Math.min(120, viewport.clientHeight * 0.18)
        }
      );
    }

    function fitNodeSet(nodeIds, options) {
      var nodes = (Array.isArray(nodeIds) ? nodeIds : [])
        .map(function (nodeId) { return nodeById[nodeId]; })
        .filter(Boolean);
      if (!nodes.length || mobileQuery.matches) {
        return false;
      }
      var left = Number.POSITIVE_INFINITY;
      var top = Number.POSITIVE_INFINITY;
      var right = Number.NEGATIVE_INFINITY;
      var bottom = Number.NEGATIVE_INFINITY;
      nodes.forEach(function (node) {
        var dimensions = nodeDimensions(node);
        left = Math.min(left, node.x);
        top = Math.min(top, node.y);
        right = Math.max(right, node.x + dimensions.width);
        bottom = Math.max(bottom, node.y + dimensions.height);
      });
      var fitOptions = options || {};
      fitBounds(
        {
          x: left - 70,
          y: top - 70,
          width: Math.max(280, (right - left) + 140),
          height: Math.max(240, (bottom - top) + 140)
        },
        {
          padding: 52,
          maxScale: Number.isFinite(fitOptions.maxScale)
            ? fitOptions.maxScale
            : 1.05,
          insetInlineEnd: inspector.hidden
            ? 0
            : Math.min(400, viewport.clientWidth * 0.3),
          insetBlockEnd: fitOptions.insetBlockEnd || 0
        }
      );
      return true;
    }

    function focusDiagramForCommand(nodeId) {
      window.requestAnimationFrame(function () {
        var target = mobileQuery.matches && nodeId
          ? nodeElements[nodeId]
          : workspace;
        if (!target || typeof target.scrollIntoView !== "function") {
          return;
        }
        target.scrollIntoView({
          behavior: reducedMotion.matches ? "auto" : "smooth",
          block: "start",
          inline: "nearest"
        });
      });
    }

    function fitEvidenceTrace() {
      var traced = traceNodes();
      if (!traced.length) {
        return false;
      }
      if (!mobileQuery.matches) {
        fitNodeSet(traced, { maxScale: 0.96 });
      }
      focusDiagramForCommand(state.object || traced[0]);
      return true;
    }

    function setEvidenceTrace(enabled) {
      state.evidence = Boolean(enabled);
      updateVisualState();
      if (state.evidence && fitEvidenceTrace()) {
        if (mobileQuery.matches) {
          closeInspector();
        }
      } else if (state.object) {
        fitNode(state.object);
        focusDiagramForCommand(state.object);
      } else if (state.scene) {
        fitZone(state.scene);
        focusDiagramForCommand();
      } else {
        fitAll();
        focusDiagramForCommand();
      }
      updateUrl(false, { target: "viewport" });
    }

    function elementCanReceiveFocus(element) {
      if (!element || element.hidden || typeof element.focus !== "function") {
        return false;
      }
      return typeof element.getClientRects !== "function" ||
        element.getClientRects().length > 0;
    }

    function focusElement(element) {
      if (!elementCanReceiveFocus(element)) {
        return false;
      }
      element.focus({ preventScroll: true });
      return true;
    }

    function focusInspectorControl() {
      var deepDive = root.querySelector("[data-deep-dive]");
      var closeButton = root.querySelector("[data-close-inspector]");
      return focusElement(deepDive.hidden ? closeButton : deepDive) ||
        focusElement(closeButton);
    }

    function focusStoryControl() {
      return focusElement(root.querySelector("[data-story-next]")) ||
        focusElement(root.querySelector("[data-story-close]"));
    }

    function syncInspectorModality() {
      var modal = inspectorShouldBeModal(mobileQuery.matches, inspector.hidden);
      inspector.setAttribute("aria-modal", String(modal));
      if (modal) {
        inspector.setAttribute("role", "dialog");
        document.documentElement.dataset.systemMapModal = "true";
      } else {
        inspector.removeAttribute("role");
        delete document.documentElement.dataset.systemMapModal;
      }
      mobileModalBackground.forEach(function (element) {
        if (modal) {
          element.setAttribute("inert", "");
        } else {
          element.removeAttribute("inert");
        }
      });
    }

    function focusNodeOrViewport(nodeId) {
      window.requestAnimationFrame(function () {
        if (!focusElement(nodeElements[nodeId])) {
          focusElement(viewport);
        }
      });
    }

    function captureFocusSnapshot(preferred) {
      var normalizedPreferred = normalizeFocusSnapshot(preferred);
      if (normalizedPreferred) {
        return normalizedPreferred;
      }
      var active = document.activeElement;
      var story = root.querySelector("[data-map-story]");
      if (active && inspector.contains(active) && state.object) {
        return { target: "inspector", object: state.object };
      }
      if (active && !story.hidden && story.contains(active)) {
        return { target: "story" };
      }
      if (active && active.closest) {
        var layerElement = active.closest("[data-map-layer]");
        if (
          layerElement &&
          ALLOWED_LAYERS.indexOf(layerElement.dataset.mapLayer) !== -1
        ) {
          return { target: "legend", layer: layerElement.dataset.mapLayer };
        }
        var nodeElement = active.closest("[data-node-id]");
        if (nodeElement && nodeById[nodeElement.dataset.nodeId]) {
          return { target: "node", object: nodeElement.dataset.nodeId };
        }
      }
      if (active === viewport || (active && viewport.contains(active))) {
        return { target: "viewport" };
      }
      if (state.tour) {
        return { target: "story" };
      }
      if (state.object) {
        return { target: "inspector", object: state.object };
      }
      return { target: "viewport" };
    }

    function restoreFocusSnapshot(snapshot) {
      var focus = normalizeFocusSnapshot(snapshot);
      if (!focus) {
        return;
      }
      window.requestAnimationFrame(function () {
        if (focus.target === "story" && state.tour && focusStoryControl()) {
          return;
        }
        if (
          focus.target === "inspector" &&
          state.object === focus.object &&
          !inspector.hidden &&
          focusInspectorControl()
        ) {
          return;
        }
        if (focus.target === "node" && focusElement(nodeElements[focus.object])) {
          return;
        }
        if (
          focus.target === "legend" &&
          focusElement(
            root.querySelector('[data-map-layer="' + focus.layer + '"]')
          )
        ) {
          return;
        }
        focusElement(viewport);
      });
    }

    function endActiveTour() {
      if (!state.tour) {
        return false;
      }
      state = endTourForNavigation(state);
      root.querySelector("[data-map-story]").hidden = true;
      return true;
    }

    function updateUrl(replace, preferredFocus) {
      viewportState = normalizeViewportSnapshot(viewportState) ||
        { x: 0, y: 0, scale: 1 };
      var query = appendViewportState(serializeState(state), viewportState);
      var target = window.location.pathname + (query ? "?" + query : "") + window.location.hash;
      window.history[replace ? "replaceState" : "pushState"](
        {
          systemMap: true,
          viewport: {
            x: viewportState.x,
            y: viewportState.y,
            scale: viewportState.scale
          },
          focus: captureFocusSnapshot(preferredFocus)
        },
        "",
        target
      );
      preserveLocaleNavigation(query);
    }

    function preserveLocaleNavigation(query) {
      Array.prototype.forEach.call(
        document.querySelectorAll("[data-language-switcher] a[href]"),
        function (link) {
          var url = new URL(link.href, window.location.origin);
          url.search = query;
          link.href = url.pathname + url.search;
        }
      );
    }

    function roleMatches(node) {
      return state.role === "all" || node.roles.indexOf(state.role) !== -1;
    }

    function traceNodes() {
      return traceNodeIds(state.object, state.evidence);
    }

    function layerIsEnabled(layer) {
      return state.layers.indexOf(layer) !== -1;
    }

    function updateVisualState() {
      var flowMode = flowModeForState(state);
      var tourSteps = state.tour ? TOURS[state.tour] : [];
      var layerMode = state.layers.length === 1 ? state.layers[0] : "all";
      var layerFocusNodes = layerMode === "all" ? [] : nodeIdsForLayer(layerMode);
      root.dataset.level = String(state.level);
      root.dataset.storyActive = String(Boolean(state.tour));
      root.dataset.tourStep = state.tour ? String(state.step) : "";
      root.dataset.storyComplete = String(Boolean(
        state.tour && state.step === tourSteps.length - 1
      ));
      root.dataset.flowMode = flowMode;
      root.dataset.layerMode = layerMode;
      ALLOWED_LAYERS.forEach(function (layer) {
        root.dataset[
          "layer" + layer.charAt(0).toUpperCase() + layer.slice(1)
        ] = String(layerIsEnabled(layer));
      });
      var traced = traceNodes();
      var evidenceActive = Boolean(state.evidence && traced.length);
      root.dataset.evidenceActive = String(evidenceActive);
      var activeObjectId = state.object || previewNodeId;
      var relatedNodeIds = {};
      if (activeObjectId && (state.level >= 3 || previewNodeId)) {
        EDGES.forEach(function (edge) {
          if (edge.from === activeObjectId) {
            relatedNodeIds[edge.to] = true;
          } else if (edge.to === activeObjectId) {
            relatedNodeIds[edge.from] = true;
          }
        });
      }
      NODES.forEach(function (node) {
        var element = nodeElements[node.id];
        var selected = state.object === node.id;
        var tourIndex = state.tour ? tourSteps.indexOf(node.id) : -1;
        var tourState = "off-route";
        if (tourIndex >= 0) {
          if (tourIndex < state.step) {
            tourState = "visited";
          } else if (tourIndex === state.step) {
            tourState = "current";
          } else if (tourIndex === state.step + 1) {
            tourState = "next";
          } else {
            tourState = "future";
          }
        }
        var tourActive = tourState === "current";
        var traceIndex = traced.indexOf(node.id);
        var muted = nodeIsMuted(node, state);
        element.dataset.selected = String(selected);
        element.dataset.related = String(Boolean(relatedNodeIds[node.id]));
        element.dataset.tourActive = String(Boolean(tourActive));
        element.dataset.tourState = tourState;
        element.dataset.tourDistance = tourIndex >= 0
          ? String(tourIndex - state.step)
          : "";
        element.dataset.trace = String(traceIndex !== -1);
        element.dataset.traceIndex = traceIndex >= 0 ? String(traceIndex) : "";
        element.dataset.traceTerminal = String(
          traceIndex >= 0 && traceIndex === traced.length - 1
        );
        element.dataset.layerFocus = String(
          layerMode === "all" || layerFocusNodes.indexOf(node.id) !== -1
        );
        element.style.order = tourIndex >= 0
          ? String(tourIndex)
          : (traceIndex >= 0 ? String(traceIndex) : "");
        element.dataset.muted = String(Boolean(muted));
        if (node.decision) {
          element.dataset.decisionVisible = String(
            layerIsEnabled("decision") ||
            tourState !== "off-route" ||
            traced.indexOf(node.id) !== -1
          );
        }
        if (muted && !mobileQuery.matches && keyboardNodeId === node.id) {
          keyboardNodeId = (
            NODES.find(function (candidate) { return roleMatches(candidate); }) ||
            node
          ).id;
        }
      });
      ZONES.forEach(function (zone) {
        var focused = state.scene === zone.id;
        var muted = Boolean(state.scene && state.scene !== zone.id);
        [zoneElements[zone.id], zoneLabelElements[zone.id], zoneIndexElements[zone.id]]
          .forEach(function (element) {
            element.dataset.focused = String(focused);
            element.dataset.muted = String(muted);
          });
      });
      var visibleRelationshipTotal = 0;
      EDGES.forEach(function (edge) {
        var group = edgeGroups[edge.id];
        var previousRouteState = group.dataset.routeState;
        var routeState = state.tour
          ? tourRouteState(edge, tourSteps, state.step)
          : "off-route";
        var tracedEdge = traceEdgeStepIndex(edge, traced) >= 0;
        var objectEdge = activeObjectId &&
          (state.level >= 3 || previewNodeId) &&
          (edge.from === activeObjectId || edge.to === activeObjectId);
        var sceneEdge = Boolean(
          state.scene &&
          (
            nodeById[edge.from].zone === state.scene ||
            nodeById[edge.to].zone === state.scene
          )
        );
        var selectedLayer = layerIsEnabled(edgeLayer(edge.kind));
        var effectivelyVisible =
          selectedLayer || tracedEdge || routeState !== "off-route";
        group.dataset.filterVisible = String(selectedLayer);
        group.dataset.layerVisible = String(effectivelyVisible);
        group.dataset.routeState = routeState;
        group.dataset.trace = String(tracedEdge);
        group.dataset.objectRelated = String(Boolean(objectEdge && selectedLayer));
        group.dataset.flowState = edgeFlowState({
          mode: flowMode,
          routeState: routeState,
          tracedEdge: tracedEdge,
          objectEdge: Boolean(objectEdge),
          sceneEdge: sceneEdge,
          selectedLayer: selectedLayer
        });
        edgeElements[edge.id].dataset.active = String(
          Boolean(
            tracedEdge ||
            routeState === "current" ||
            routeState === "visited" ||
            (state.layers.length === 1 && selectedLayer) ||
            (objectEdge && selectedLayer)
          )
        );
        mobileRelationshipElements[edge.id].dataset.layerVisible =
          String(effectivelyVisible);
        mobileRelationshipElements[edge.id].dataset.routeState = routeState;
        if (effectivelyVisible) {
          visibleRelationshipTotal += 1;
        }
        var shouldRunPacket =
          (routeState === "current" || tracedEdge) &&
          !reducedMotion.matches &&
          state.motionMode !== "off";
        if (
          shouldRunPacket &&
          (
            previousRouteState !== "current" ||
            group.dataset.motionRunning !== "true"
          ) &&
          typeof edgeMotionElements[edge.id].beginElement === "function"
        ) {
          edgeMotionElements[edge.id].beginElement();
          group.dataset.motionRunning = "true";
        } else if (
          !shouldRunPacket &&
          group.dataset.motionRunning === "true" &&
          typeof edgeMotionElements[edge.id].endElement === "function"
        ) {
          edgeMotionElements[edge.id].endElement();
          group.dataset.motionRunning = "false";
        }
      });
      mobileRelationshipCount.textContent = String(visibleRelationshipTotal);
      Array.prototype.forEach.call(
        root.querySelectorAll("[data-map-layer]"),
        function (button) {
          var enabled = layerIsEnabled(button.dataset.mapLayer);
          button.setAttribute("aria-pressed", String(enabled));
          button.dataset.layerEnabled = String(enabled);
        }
      );
      var evidenceButton = root.querySelector("[data-evidence-toggle]");
      evidenceButton.setAttribute("aria-pressed", String(evidenceActive));
      evidenceButton.querySelector("[data-evidence-icon]").textContent =
        evidenceActive ? "◆" : "◇";
      var traceObjectButton = root.querySelector("[data-trace-object]");
      traceObjectButton.setAttribute("aria-pressed", String(evidenceActive));
      traceObjectButton.querySelector("[data-trace-object-icon]").textContent =
        evidenceActive ? "◆" : "◇";
      var roleSelect = root.querySelector("[data-role-lens]");
      if (Array.prototype.some.call(roleSelect.options, function (option) {
        return option.value === state.role;
      })) {
        roleSelect.value = state.role;
      }
      Array.prototype.forEach.call(
        root.querySelectorAll("[data-depth-indicator] [data-depth]"),
        function (step) {
          step.dataset.current = String(Number(step.dataset.depth) === state.level);
        }
      );
      updateNodeTabStops();
    }

    function renderFacts(node, level) {
      var facts = [
        [copy.factOwner, node.owner],
        [copy.factInput, node.input],
        [copy.factOutput, node.output],
        [copy.factState, node.state],
        [copy.factVersion, node.version],
        [copy.factScope, node.scope]
      ];
      var list = root.querySelector("[data-inspector-facts]");
      list.replaceChildren();
      facts.forEach(function (fact) {
        var row = createElement("div");
        row.appendChild(createElement("dt", "", fact[0]));
        row.appendChild(createElement("dd", "", fact[1]));
        list.appendChild(row);
      });
      if (level >= 4) {
        var runRow = createElement("div");
        runRow.dataset.factLevel = "4";
        runRow.appendChild(createElement("dt", "", "L4"));
        runRow.appendChild(createElement("dd", "", executionFactValue(node)));
        list.appendChild(runRow);
      }
      if (level >= 5) {
        var evidenceRow = createElement("div");
        evidenceRow.dataset.factLevel = "5";
        evidenceRow.appendChild(createElement("dt", "", "L5"));
        evidenceRow.appendChild(
          createElement("dd", "", evidenceFactValue(node, copy.evidenceKind))
        );
        list.appendChild(evidenceRow);
      }
    }

    function openInspector(node, focus) {
      inspector.hidden = false;
      syncInspectorModality();
      root.querySelector("[data-inspector-kind]").textContent = kindLabel(node, state.level);
      root.querySelector("[data-inspector-title]").textContent = node.title;
      root.querySelector("[data-inspector-summary]").textContent = nodeSummary(node, state.level);
      root.querySelector("[data-inspector-boundary-copy]").textContent = [
        boundaryCopy[node.boundary] || boundaryCopy["explicit-run"] || "",
        node.claimCaveat || ""
      ].filter(Boolean).join(" ");
      renderFacts(node, state.level);
      var deepDive = root.querySelector("[data-deep-dive]");
      deepDive.hidden = state.level >= 5;
      var traceObject = root.querySelector("[data-trace-object]");
      var traceAvailable = traceNodeIds(node.id, true).length >= 2;
      traceObject.hidden = !traceAvailable;
      traceObject.disabled = !traceAvailable;
      traceObject.setAttribute(
        "aria-pressed",
        String(traceAvailable && state.evidence)
      );
      if (focus) {
        window.requestAnimationFrame(function () {
          focusInspectorControl();
        });
      }
    }

    function closeInspector(options) {
      inspector.hidden = true;
      syncInspectorModality();
      if (options && options.restoreFocus) {
        focusNodeOrViewport(
          (options && options.nodeId) || lastFocusedNode
        );
      }
    }

    function applyState(options) {
      var preserveViewport = Boolean(options && options.preserveViewport);
      state = normalizeMapState(state);
      updateVisualState();
      if (state.object) {
        var node = nodeById[state.object];
        state.scene = state.scene || node.zone;
        if (state.tour && mobileQuery.matches) {
          closeInspector();
        } else {
          openInspector(node, Boolean(options && options.focusInspector));
        }
        if (!preserveViewport) {
          if (state.tour) {
            fitTourSegment(TOURS[state.tour], state.step);
          } else {
            fitNode(node.id);
          }
        }
      } else {
        closeInspector();
        if (!preserveViewport) {
          if (state.scene) {
            fitZone(state.scene);
          } else {
            fitAll(Boolean(options && options.immediate));
          }
        }
      }
      if (state.tour) {
        showStory({
          preserveViewport: true,
          focusStory: Boolean(options && options.focusStory)
        });
      } else {
        root.querySelector("[data-map-story]").hidden = true;
      }
      var levelMessage = copy.levelLabel + " L" + state.level;
      if (state.object) {
        levelMessage += " · " + nodeById[state.object].title;
      }
      announce(levelMessage);
      if (options && options.restoreFocus) {
        restoreFocusSnapshot(options.restoreFocus);
      }
    }

    function selectNode(nodeId, push) {
      var node = nodeById[nodeId];
      if (!node) {
        return;
      }
      endActiveTour();
      lastFocusedNode = nodeId;
      keyboardNodeId = nodeId;
      state.object = nodeId;
      state.scene = node.zone;
      state.level = 3;
      applyState({ focusInspector: push, focusDiagram: push });
      if (push) {
        updateUrl(false, { target: "inspector", object: nodeId });
        focusDiagramForCommand(nodeId);
      }
    }

    function enterZone(zoneId, push) {
      endActiveTour();
      var enterModule = state.scene === zoneId && state.level === 1;
      state.scene = zoneId;
      state.object = null;
      state.level = enterModule ? 2 : 1;
      closeInspector();
      applyState();
      if (push) {
        updateUrl(false, { target: "viewport" });
        focusDiagramForCommand();
      }
    }

    function exitLayer() {
      if (state.tour) {
        closeTour();
        return;
      }
      var restoreNodeId = state.object;
      if (state.level >= 5) {
        state.level = 4;
      } else if (state.level >= 4) {
        state.level = 3;
      } else if (state.object) {
        state.object = null;
        state.level = 2;
      } else if (state.scene && state.level >= 2) {
        state.level = 1;
      } else if (state.scene) {
        state.scene = null;
        state.level = 0;
      } else {
        fitAll();
        return;
      }
      applyState({ focusInspector: state.level >= 3 });
      var preferredFocus = state.object
        ? { target: "inspector", object: state.object }
        : (
          restoreNodeId
            ? { target: "node", object: restoreNodeId }
            : { target: "viewport" }
        );
      updateUrl(false, preferredFocus);
      if (!state.object && restoreNodeId) {
        focusNodeOrViewport(restoreNodeId);
      }
    }

    function enterDeeper() {
      if (!state.object || state.level >= 5) {
        return;
      }
      endActiveTour();
      state.level += 1;
      applyState({ focusInspector: true });
      updateUrl(false, { target: "inspector", object: state.object });
    }

    function showSearch() {
      var dialog = root.querySelector("[data-search-dialog]");
      var input = root.querySelector("[data-map-search]");
      renderSearchResults("");
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      window.requestAnimationFrame(function () {
        input.focus();
        syncMotion();
      });
    }

    function renderSearchResults(query) {
      var normalized = String(query || "").slice(0, 160).trim()
        .toLocaleLowerCase(root.dataset.locale);
      var matches = NODES.filter(function (node) {
        var haystack = [
          node.title, node.kind, node.owner, node.input, node.output, node.state,
          zoneCopy[node.zone] ? zoneCopy[node.zone].title : node.zone
        ].join(" ").toLocaleLowerCase(root.dataset.locale);
        return !normalized || haystack.indexOf(normalized) !== -1;
      }).slice(0, 12);
      var results = root.querySelector("[data-map-search-results]");
      results.replaceChildren();
      if (!matches.length) {
        results.appendChild(createElement("p", "", copy.searchEmpty));
        return;
      }
      matches.forEach(function (node, index) {
        var button = createElement("button", "map-search-result");
        button.type = "button";
        button.appendChild(
          createElement("span", "map-search-result__index", String(index + 1).padStart(2, "0"))
        );
        var text = createElement("span");
        text.appendChild(createElement("strong", "", node.title));
        text.appendChild(
          createElement(
            "small",
            "",
            (zoneCopy[node.zone] ? zoneCopy[node.zone].title : node.zone) +
              " · " + statusLabel(node.status)
          )
        );
        button.appendChild(text);
        button.appendChild(createElement("span", "", "→"));
        button.addEventListener("click", function () {
          var dialog = root.querySelector("[data-search-dialog]");
          dialog.close();
          selectNode(node.id, true);
          window.requestAnimationFrame(function () {
            nodeElements[node.id].focus({ preventScroll: true });
          });
        });
        results.appendChild(button);
      });
    }

    function showTours() {
      var dialog = root.querySelector("[data-tours-dialog]");
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      syncMotion();
    }

    function startTour(tourId) {
      if (!hasOwnKey(TOURS, tourId)) {
        return;
      }
      state.tour = tourId;
      state.step = 0;
      state.object = TOURS[tourId][0];
      state.scene = nodeById[state.object].zone;
      state.level = 4;
      applyState({ focusStory: true });
      updateUrl(false, { target: "story" });
      focusDiagramForCommand(state.object);
    }

    function currentTourButton() {
      return root.querySelector('[data-tour-id="' + state.tour + '"]');
    }

    function showStory(options) {
      var story = root.querySelector("[data-map-story]");
      var steps = TOURS[state.tour];
      if (!steps) {
        story.hidden = true;
        return;
      }
      state.step = clamp(state.step, 0, steps.length - 1);
      var node = nodeById[steps[state.step]];
      var tourButton = currentTourButton();
      var title = tourButton ? tourButton.querySelector("strong").textContent : state.tour;
      var kicker = copy.storyStep
        .replace("{current}", String(state.step + 1))
        .replace("{total}", String(steps.length));
      var progressbar = root.querySelector("[data-story-progressbar]");
      var storyCopy = story.querySelector(".map-story__copy");
      var previousStep = story.dataset.step;
      root.querySelector("[data-story-kicker]").textContent = title;
      root.querySelector("[data-story-title]").textContent = node.title;
      root.querySelector("[data-story-body]").textContent = nodeSummary(node, 4);
      root.querySelector("[data-story-status]").textContent =
        title + " · " + kicker + " · " + node.title;
      root.querySelector("[data-story-progress]").style.width =
        (((state.step + 1) / steps.length) * 100) + "%";
      root.querySelector("[data-story-position]").textContent =
        String(state.step + 1).padStart(2, "0") + " / " +
        String(steps.length).padStart(2, "0");
      progressbar.setAttribute("aria-valuenow", String(state.step + 1));
      progressbar.setAttribute("aria-valuemax", String(steps.length));
      progressbar.setAttribute("aria-valuetext", kicker + " · " + node.title);
      root.querySelector("[data-story-previous]").disabled = state.step === 0;
      var nextButton = root.querySelector("[data-story-next]");
      var nextLabel = state.step === steps.length - 1
        ? copy.storyComplete
        : nextButton.dataset.defaultLabel;
      root.querySelector("[data-story-next-label]").textContent = nextLabel;
      root.querySelector("[data-story-next-icon]").textContent =
        state.step === steps.length - 1 ? "✓" : "→";
      nextButton.setAttribute("aria-label", nextLabel);
      nextButton.setAttribute("title", nextLabel);
      story.dataset.step = String(state.step);
      story.dataset.complete = String(state.step === steps.length - 1);
      story.hidden = false;
      state.object = node.id;
      state.scene = node.zone;
      state.level = 4;
      updateVisualState();
      if (mobileQuery.matches) {
        closeInspector();
      } else {
        openInspector(node, false);
      }
      if (!(options && options.preserveViewport)) {
        fitTourSegment(steps, state.step);
      }
      if (
        previousStep !== undefined &&
        previousStep !== String(state.step) &&
        !reducedMotion.matches &&
        state.motionMode === "auto" &&
        typeof storyCopy.animate === "function"
      ) {
        storyCopy.animate(
          [
            { transform: "translateY(0.55rem)" },
            { transform: "translateY(0)" }
          ],
          { duration: 420, easing: "cubic-bezier(.16, 1, .3, 1)" }
        );
      }
      if (options && options.focusStory) {
        window.requestAnimationFrame(function () {
          focusStoryControl();
        });
      }
      if (options && options.focusDiagram) {
        focusDiagramForCommand(node.id);
      }
    }

    function moveTour(delta) {
      var steps = state.tour ? TOURS[state.tour] : null;
      if (!steps) {
        return;
      }
      if (delta > 0 && state.step === steps.length - 1) {
        closeTour();
        return;
      }
      state.step = clamp(state.step + delta, 0, steps.length - 1);
      state.object = steps[state.step];
      state.scene = nodeById[state.object].zone;
      showStory({ focusStory: true, focusDiagram: true });
      updateUrl(true, { target: "story" });
    }

    function closeTour() {
      state.tour = null;
      state.step = 0;
      state.object = null;
      state.scene = null;
      state.level = 0;
      root.querySelector("[data-map-story]").hidden = true;
      closeInspector();
      applyState();
      updateUrl(false, { target: "viewport" });
      restoreFocusSnapshot({ target: "viewport" });
      focusDiagramForCommand();
    }

    function zoomAt(delta, centerX, centerY) {
      if (mobileQuery.matches) {
        return;
      }
      var previous = viewportState.scale;
      var next = clamp(previous * delta, MIN_SCALE, MAX_SCALE);
      var pointX = (centerX - viewportState.x) / previous;
      var pointY = (centerY - viewportState.y) / previous;
      viewportState.scale = next;
      viewportState.x = centerX - (pointX * next);
      viewportState.y = centerY - (pointY * next);
      applyTransform();
    }

    function toggleLayer(layer, button) {
      if (ALLOWED_LAYERS.indexOf(layer) === -1) {
        return;
      }
      state.layers = nextLayerSelection(state.layers, layer);
      updateVisualState();
      updateUrl(false, { target: "legend", layer: layer });
      if (state.layers.length === 1) {
        var focusedNodes = nodeIdsForLayer(layer);
        if (!mobileQuery.matches) {
          fitNodeSet(focusedNodes, { maxScale: 0.96 });
        }
        focusDiagramForCommand(focusedNodes[0]);
      } else if (state.object) {
        fitNode(state.object);
        focusDiagramForCommand(state.object);
      } else if (state.scene) {
        fitZone(state.scene);
        focusDiagramForCommand();
      } else {
        fitAll();
        focusDiagramForCommand();
      }
      announce(
        button.textContent.trim() + " · " +
        mobileRelationshipCount.textContent + "/" + String(EDGES.length)
      );
    }

    function bindEvents() {
      Array.prototype.forEach.call(root.querySelectorAll("[data-map-enter]"), function (button) {
        button.addEventListener("click", function () {
          workspace.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
          if (button.dataset.mapEnter === "tour") {
            showTours();
          } else if (button.dataset.mapEnter === "search") {
            showSearch();
          } else {
            state.level = 0;
            fitAll();
            viewport.focus({ preventScroll: true });
            updateUrl(true, { target: "viewport" });
          }
        });
      });
      root.querySelector("[data-map-exit]").addEventListener("click", exitLayer);
      inspector.addEventListener("keydown", function (event) {
        if (
          event.key !== "Tab" ||
          !inspectorShouldBeModal(mobileQuery.matches, inspector.hidden)
        ) {
          return;
        }
        var focusable = Array.prototype.filter.call(
          inspector.querySelectorAll(
            "button:not([disabled]):not([hidden]), " +
            "a[href]:not([hidden]), [tabindex]:not([tabindex='-1']):not([hidden])"
          ),
          elementCanReceiveFocus
        );
        if (!focusable.length) {
          event.preventDefault();
          focusElement(inspector);
          return;
        }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          focusElement(last);
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          focusElement(first);
        }
      });
      root.querySelector("[data-close-inspector]").addEventListener("click", function () {
        if (state.object) {
          var restoreNodeId = state.object;
          endActiveTour();
          state.object = null;
          state.level = state.scene ? 2 : 0;
          applyState();
          updateUrl(false, { target: "node", object: restoreNodeId });
          focusNodeOrViewport(restoreNodeId);
        } else {
          closeInspector({ restoreFocus: true });
        }
      });
      root.querySelector("[data-deep-dive]").addEventListener("click", enterDeeper);
      root.querySelector("[data-trace-object]").addEventListener("click", function () {
        setEvidenceTrace(nextEvidenceState(state.evidence));
      });
      root.querySelector("[data-open-search]").addEventListener("click", showSearch);
      root.querySelector("[data-open-tours]").addEventListener("click", showTours);
      root.querySelector("[data-evidence-toggle]").addEventListener("click", function () {
        setEvidenceTrace(nextEvidenceState(state.evidence));
      });
      root.querySelector("[data-motion-toggle]").addEventListener("click", function () {
        state.motionMode = nextMotionMode(state.motionMode);
        updateUrl(false);
        syncMotion();
      });
      root.querySelector("[data-role-lens]").addEventListener("change", function (event) {
        state.role = event.target.value;
        updateUrl(false);
        updateVisualState();
      });
      Array.prototype.forEach.call(
        root.querySelectorAll("[data-map-layer]"),
        function (button) {
          button.addEventListener("click", function () {
            toggleLayer(button.dataset.mapLayer, button);
          });
        }
      );
      root.querySelector("[data-map-search]").addEventListener("input", function (event) {
        renderSearchResults(event.target.value);
      });
      Array.prototype.forEach.call(root.querySelectorAll("[data-tour-id]"), function (button) {
        button.addEventListener("click", function () {
          root.querySelector("[data-tours-dialog]").close();
          startTour(button.dataset.tourId);
        });
      });
      Array.prototype.forEach.call(root.querySelectorAll("[data-close-dialog]"), function (button) {
        button.addEventListener("click", function () {
          var dialog = button.closest("dialog");
          if (dialog && typeof dialog.close === "function") {
            dialog.close();
          } else if (dialog) {
            dialog.removeAttribute("open");
          }
          syncMotion();
        });
      });
      Array.prototype.forEach.call(root.querySelectorAll("dialog"), function (dialog) {
        dialog.addEventListener("close", syncMotion);
        dialog.addEventListener("cancel", syncMotion);
      });
      var nextButton = root.querySelector("[data-story-next]");
      nextButton.addEventListener("click", function () { moveTour(1); });
      root.querySelector("[data-story-previous]").addEventListener(
        "click",
        function () { moveTour(-1); }
      );
      root.querySelector("[data-story-close]").addEventListener("click", closeTour);

      Array.prototype.forEach.call(root.querySelectorAll("[data-map-zoom]"), function (button) {
        button.addEventListener("click", function () {
          if (button.dataset.mapZoom === "fit") {
            if (state.object) {
              fitNode(state.object);
            } else if (state.scene) {
              fitZone(state.scene);
            } else {
              fitAll();
            }
            updateUrl(true);
            focusDiagramForCommand(state.object);
            return;
          }
          zoomAt(
            button.dataset.mapZoom === "in" ? 1.18 : (1 / 1.18),
            viewport.clientWidth / 2,
            viewport.clientHeight / 2
          );
          updateUrl(true);
          focusDiagramForCommand(state.object);
        });
      });

      viewport.addEventListener("wheel", function (event) {
        var active = document.activeElement;
        var focusedWithinMap = Boolean(
          active &&
          root.contains(active) &&
          !(active.closest && active.closest("dialog"))
        );
        if (!shouldHandleWheelZoom({
          mobile: mobileQuery.matches,
          mapFocused: focusedWithinMap,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey
        })) {
          return;
        }
        event.preventDefault();
        var rect = viewport.getBoundingClientRect();
        zoomAt(
          event.deltaY < 0 ? 1.08 : (1 / 1.08),
          event.clientX - rect.left,
          event.clientY - rect.top
        );
        updateUrl(true);
      }, { passive: false });

      viewport.addEventListener("pointerdown", function (event) {
        if (
          !DIRECT_CAMERA_GESTURES ||
          mobileQuery.matches ||
          event.target.closest(".map-node")
        ) {
          return;
        }
        viewport.setPointerCapture(event.pointerId);
        pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
        var ids = Object.keys(pointers);
        if (ids.length === 1) {
          drag = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            originX: viewportState.x,
            originY: viewportState.y
          };
        } else if (ids.length === 2) {
          var first = pointers[ids[0]];
          var second = pointers[ids[1]];
          var centerX = (first.x + second.x) / 2;
          var centerY = (first.y + second.y) / 2;
          pinch = {
            distance: Math.hypot(second.x - first.x, second.y - first.y),
            scale: viewportState.scale,
            worldX: (centerX - viewportState.x) / viewportState.scale,
            worldY: (centerY - viewportState.y) / viewportState.scale
          };
          drag = null;
        }
        viewport.dataset.dragging = "true";
      });
      viewport.addEventListener("pointermove", function (event) {
        if (!pointers[event.pointerId]) {
          return;
        }
        pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
        var ids = Object.keys(pointers);
        if (pinch && ids.length >= 2) {
          var first = pointers[ids[0]];
          var second = pointers[ids[1]];
          var distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
          var centerX = (first.x + second.x) / 2;
          var centerY = (first.y + second.y) / 2;
          viewportState.scale = clamp(
            pinch.scale * (distance / Math.max(1, pinch.distance)),
            MIN_SCALE,
            MAX_SCALE
          );
          viewportState.x = centerX - (pinch.worldX * viewportState.scale);
          viewportState.y = centerY - (pinch.worldY * viewportState.scale);
        } else if (drag && drag.id === event.pointerId) {
          viewportState.x = drag.originX + (event.clientX - drag.x);
          viewportState.y = drag.originY + (event.clientY - drag.y);
        }
        if (frame === null) {
          frame = window.requestAnimationFrame(function () {
            frame = null;
            applyTransform();
          });
        }
      });
      var finishPointer = function (event) {
        if (!pointers[event.pointerId]) {
          return;
        }
        delete pointers[event.pointerId];
        var ids = Object.keys(pointers);
        pinch = null;
        if (ids.length === 1) {
          var remaining = pointers[ids[0]];
          drag = {
            id: Number(ids[0]),
            x: remaining.x,
            y: remaining.y,
            originX: viewportState.x,
            originY: viewportState.y
          };
        } else {
          drag = null;
          viewport.removeAttribute("data-dragging");
        }
        updateUrl(true);
      };
      viewport.addEventListener("pointerup", finishPointer);
      viewport.addEventListener("pointercancel", finishPointer);

      viewport.addEventListener("keydown", function (event) {
        if (!DIRECT_CAMERA_GESTURES) {
          return;
        }
        var distance = event.shiftKey ? 96 : 42;
        var changedViewport = false;
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(event.key) !== -1) {
          event.preventDefault();
          if (event.key === "ArrowLeft") {
            viewportState.x += distance;
          } else if (event.key === "ArrowRight") {
            viewportState.x -= distance;
          } else if (event.key === "ArrowUp") {
            viewportState.y += distance;
          } else {
            viewportState.y -= distance;
          }
          applyTransform();
          changedViewport = true;
        } else if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          zoomAt(1.14, viewport.clientWidth / 2, viewport.clientHeight / 2);
          changedViewport = true;
        } else if (event.key === "-") {
          event.preventDefault();
          zoomAt(1 / 1.14, viewport.clientWidth / 2, viewport.clientHeight / 2);
          changedViewport = true;
        } else if (event.key === "0") {
          event.preventDefault();
          fitAll();
          changedViewport = true;
        }
        if (changedViewport) {
          updateUrl(true, { target: "viewport" });
        }
      });

      window.addEventListener("popstate", function (event) {
        state = queryState();
        root.dataset.motion = state.motionMode;
        var restoredViewport = normalizeViewportSnapshot(
          event.state && event.state.viewport
        ) || parseViewportState(window.location.search);
        if (restoredViewport) {
          viewportState = restoredViewport;
          applyTransform(true);
        }
        applyState({
          immediate: true,
          preserveViewport: Boolean(restoredViewport),
          restoreFocus: event.state && event.state.focus
        });
        syncMotion();
      });
      window.addEventListener("resize", function () {
        refreshEdgeGeometry();
        if (state.tour) {
          fitTourSegment(TOURS[state.tour], state.step);
        } else if (state.object) {
          fitNode(state.object);
        } else if (state.scene) {
          fitZone(state.scene);
        } else {
          fitAll(true);
        }
      });
      mobileQuery.addEventListener("change", function () {
        applyState({ immediate: true });
      });
      var handleReducedMotionChange = function () {
        updateVisualState();
        syncMotion();
      };
      if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener("change", handleReducedMotionChange);
      } else if (typeof reducedMotion.addListener === "function") {
        reducedMotion.addListener(handleReducedMotionChange);
      }
      document.addEventListener("visibilitychange", syncMotion);
      if ("IntersectionObserver" in window) {
        var visibilityObserver = new IntersectionObserver(function (entries) {
          mapVisible = entries.some(function (entry) {
            return entry.isIntersecting;
          });
          syncMotion();
        }, { rootMargin: "120px" });
        visibilityObserver.observe(workspace);
      }
      document.addEventListener("advanexus:request-page-start", function (event) {
        if (state.level || state.scene || state.object || state.tour) {
          event.preventDefault();
          state = {
            scene: null,
            object: null,
            level: 0,
            tour: null,
            step: 0,
            role: state.role,
            evidence: false,
            exportMode: state.exportMode,
            motionMode: state.motionMode,
            layers: state.layers
          };
          applyState();
          updateUrl(false, { target: "viewport" });
          restoreFocusSnapshot({ target: "viewport" });
          workspace.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
        }
      });
    }

    function enableExportMode() {
      if (!state.exportMode) {
        return false;
      }
      root.dataset.export = "true";
      root.dataset.exportFormat = state.exportMode;
      root.dataset.exportLayers = ALLOWED_LAYERS.join(",");
      document.documentElement.dataset.systemMapExport = "true";
      document.documentElement.dataset.exportLocale = root.dataset.locale;
      document.documentElement.dataset.exportFormat = state.exportMode;
      document.documentElement.dataset.exportScene =
        state.scene || "platform-overview";
      document.documentElement.dataset.exportSchema = "advanexus.system-map/v1";
      document.documentElement.dataset.exportLayers = ALLOWED_LAYERS.join(",");
      var fitExportLayout = function () {
        var exportFit = {
          immediate: true,
          minScale: 0.1,
          maxScale: 12
        };
        if (state.exportMode === "scene" && state.scene) {
          exportFit.padding = 120;
          fitZone(state.scene, exportFit);
        } else if (state.exportMode !== "legend") {
          exportFit.padding = state.exportMode === "a3"
            ? 140
            : (state.exportMode === "og" ? 24 : 88);
          fitAll(true, exportFit);
        }
      };
      var verifyExportLayout = function () {
        var rootBounds = root.getBoundingClientRect();
        if (rootBounds.width <= 0 || rootBounds.height <= 0) {
          return false;
        }
        if (state.exportMode === "legend") {
          return true;
        }
        var canvasBounds = canvas.getBoundingClientRect();
        return viewport.clientWidth > 0 &&
          viewport.clientHeight > 0 &&
          canvasBounds.width > 0 &&
          canvasBounds.height > 0;
      };
      var publishExportReady = function () {
        document.documentElement.dataset.exportReady = "true";
        window.__ADVANEXUS_SYSTEM_MAP_READY__ = {
          ready: true,
          locale: root.dataset.locale,
          sceneId: state.scene || "platform-overview",
          schemaVersion: "advanexus.system-map/v1",
          format: state.exportMode
        };
      };
      /*
       * Chrome --dump-dom may serialize before document.fonts.ready or a
       * requestAnimationFrame callback runs. The initial export fit therefore
       * completes synchronously; the font promise only triggers a later refit.
       */
      prepareExportLayout(
        fitExportLayout,
        verifyExportLayout,
        publishExportReady,
        document.fonts && document.fonts.ready
      );
      return true;
    }

    document.addEventListener("keydown", function (event) {
      var target = event.target;
      if (event.key === "Escape") {
        if (root.querySelector("dialog[open]")) {
          return;
        }
        if (state.level || state.scene || state.object || state.tour) {
          event.preventDefault();
          exitLayer();
        }
        return;
      }
      var typing = target && target.closest &&
        target.closest("input, textarea, select, [contenteditable='true']");
      if (typing) {
        return;
      }
      if (event.key === "/" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        showSearch();
      } else if (event.key.toLowerCase() === "e" && state.object) {
        event.preventDefault();
        setEvidenceTrace(nextEvidenceState(state.evidence));
      }
    });

    renderZones();
    renderNodes();
    renderEdges();
    if (typeof window.ResizeObserver === "function") {
      var nodeResizeObserver = new window.ResizeObserver(function () {
        refreshEdgeGeometry();
      });
      NODES.forEach(function (node) {
        nodeResizeObserver.observe(nodeElements[node.id]);
      });
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refreshEdgeGeometry);
    }
    bindEvents();
    preserveLocaleNavigation(window.location.search.replace(/^\?/, ""));
    applyState({
      immediate: true,
      preserveViewport: Boolean(initialViewportState)
    });
    updateUrl(true);
    syncMotion();
    enableExportMode();
    prepareWorkspaceOnLoad({
      exportMode: state.exportMode,
      root: root,
      fitState: function () {
        if (initialViewportState) {
          applyTransform(true);
        } else if (state.tour) {
          fitTourSegment(TOURS[state.tour], state.step);
        } else if (state.object) {
          fitNode(state.object);
        } else if (state.scene) {
          fitZone(state.scene);
        } else {
          fitAll(true);
        }
        updateUrl(true);
      },
      requestAnimationFrame: window.requestAnimationFrame
        ? window.requestAnimationFrame.bind(window)
        : null
    });

    return {
      selectNode: selectNode,
      enterZone: enterZone,
      exitLayer: exitLayer,
      startTour: startTour,
      fitAll: fitAll,
      getState: function () {
        return JSON.parse(JSON.stringify(state));
      }
    };
  }

  function boot() {
    var root = document.querySelector("[data-system-map]");
    if (!root) {
      return;
    }
    window.AdvanexusSystemMap = initSystemMap(root);
  }

  window.AdvanexusSystemMapInternals = {
    clamp: clamp,
    normalizeMapState: normalizeMapState,
    parseMapState: parseMapState,
    parseWorldEntryState: parseWorldEntryState,
    worldEntryUrl: worldEntryUrl,
    dispatchWorldHandoffReceived: dispatchWorldHandoffReceived,
    applyWorldEntryTransition: applyWorldEntryTransition,
    serializeState: serializeState,
    normalizeLayerSelection: normalizeLayerSelection,
    nextLayerSelection: nextLayerSelection,
    parseLayerSelection: function (search) {
      return parseLayerSelection(new URLSearchParams(search || ""));
    },
    serializeLayerSelection: serializeLayerSelection,
    edgeLayer: edgeLayer,
    nodeIdsForLayer: nodeIdsForLayer,
    edgePathStepIndex: edgePathStepIndex,
    traceEdgeStepIndex: traceEdgeStepIndex,
    tourRouteState: tourRouteState,
    traceNodeIds: traceNodeIds,
    nextEvidenceState: nextEvidenceState,
    isNodeMuted: function (nodeId, mapState) {
      var node = nodeById[nodeId];
      return node ? nodeIsMuted(node, normalizeMapState(mapState)) : true;
    },
    endTourForNavigation: endTourForNavigation,
    normalizeViewportSnapshot: normalizeViewportSnapshot,
    parseViewportState: parseViewportState,
    serializeViewportState: serializeViewportState,
    appendViewportState: appendViewportState,
    normalizeFocusSnapshot: normalizeFocusSnapshot,
    shouldHandleWheelZoom: shouldHandleWheelZoom,
    prepareExportLayout: prepareExportLayout,
    prepareWorkspaceOnLoad: prepareWorkspaceOnLoad,
    executionFactValue: function (nodeId) {
      return executionFactValue(nodeById[nodeId]);
    },
    evidenceFactValue: function (nodeId, evidenceLabel) {
      return evidenceFactValue(nodeById[nodeId], evidenceLabel);
    },
    inspectorShouldBeModal: inspectorShouldBeModal,
    motionIsExplicitlyPaused: motionIsExplicitlyPaused,
    nextMotionMode: nextMotionMode,
    flowModeForState: flowModeForState,
    edgeFlowState: edgeFlowState,
    allowedRoles: readonlyClone(ALLOWED_ROLES),
    allowedExports: readonlyClone(ALLOWED_EXPORTS),
    allowedLayers: readonlyClone(ALLOWED_LAYERS),
    nodeIds: readonlyClone(NODES.map(function (node) { return node.id; })),
    decisionNodeIds: readonlyClone(
      NODES.filter(function (node) { return node.decision; })
        .map(function (node) { return node.id; })
    ),
    tourIds: readonlyClone(Object.keys(TOURS)),
    edgeInventory: readonlyClone(EDGES),
    tourInventory: readonlyClone(TOURS),
    traceInventory: readonlyClone(TRACE_PATHS),
    zoneInventory: readonlyClone(ZONES),
    claimInventory: readonlyClone(NODE_CLAIMS)
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}());
