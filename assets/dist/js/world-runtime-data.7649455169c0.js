(function (globalObject, factory) {
  "use strict";

  var data = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = data;
  }
  if (globalObject) {
    globalObject.AdvanexusWorldRuntimeData = data;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function metricClamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function worldViewportMetrics(viewport, camera) {
    var width = Math.max(1, Number(viewport && viewport.width) || 1);
    var height = Math.max(1, Number(viewport && viewport.height) || 1);
    var compact = width < 680 || height < 560;
    var balanced = !compact && (width < 1040 || height < 720);
    var layout = compact ? "compact" : balanced ? "balanced" : "wide";
    var markerWidth = compact
      ? metricClamp(width * 0.29, Math.min(78, width - 16), 112)
      : balanced
        ? metricClamp(width * 0.17, 124, 164)
        : metricClamp(width * 0.14, 150, 190);
    var markerHeight = compact ? 42 : 48;
    var bottomReserve = compact ? 62 : 68;
    var baseDiameter = compact
      ? Math.min(width * 0.68, height * 0.42)
      : balanced
        ? Math.min(width * 0.52, height * 0.66)
        : Math.min(width * 0.48, height * 0.7);
    var cameraZoom = camera && Number.isFinite(camera.zoom)
      ? camera.zoom
      : 0.8;
    var fitDiameter = Math.max(
      1,
      Math.min(width - 24, height - bottomReserve - 24)
    );
    var globeDiameter = metricClamp(
      baseDiameter * metricClamp(cameraZoom / 0.8, 0.92, 1.28),
      Math.min(160, fitDiameter),
      fitDiameter
    );
    var globeRadius = globeDiameter / 2;
    var horizontalLimit = Math.max(
      0,
      width / 2 - markerWidth / 2 - 12
    );
    var verticalLimit = Math.max(
      0,
      Math.min(
        height / 2 - markerHeight / 2 - 10,
        height / 2 - bottomReserve
      )
    );
    var ringRadiusX = Math.min(
      horizontalLimit,
      Math.max(
        globeRadius * 1.08,
        horizontalLimit * (compact ? 0.82 : 0.9)
      )
    );
    var ringRadiusY = Math.min(
      verticalLimit,
      Math.max(
        globeRadius * 0.92,
        verticalLimit * (compact ? 0.48 : 0.72)
      )
    );
    var coreSize = metricClamp(globeDiameter * 0.24, 82, 112);
    var logoHeight = coreSize * 0.46;
    return {
      width: width,
      height: height,
      layout: layout,
      globeDiameter: globeDiameter,
      globeRadius: globeRadius,
      markerWidth: markerWidth,
      markerHeight: markerHeight,
      ringRadiusX: ringRadiusX,
      ringRadiusY: ringRadiusY,
      coreSize: coreSize,
      logoHeight: logoHeight,
      logoWidth: logoHeight * 1.46,
      bottomReserve: bottomReserve
    };
  }

  var DEPTH_LOD = {
    "L-2": {numeric: -2, distance: 3.78, zoom: 0.8, semanticLevel: "globe", detail: 0.2},
    "L-1": {numeric: -1, distance: 3.72, zoom: 0.86, semanticLevel: "jurisdiction", detail: 0.24},
    L0: {numeric: 0, distance: 3.34, zoom: 0.96, semanticLevel: "organisation", detail: 0.38},
    L1: {numeric: 1, distance: 3.04, zoom: 1.07, semanticLevel: "control", detail: 0.52},
    L2: {numeric: 2, distance: 2.79, zoom: 1.17, semanticLevel: "authority", detail: 0.66},
    L3: {numeric: 3, distance: 2.58, zoom: 1.27, semanticLevel: "outcome", detail: 0.78},
    L4: {numeric: 4, distance: 2.42, zoom: 1.36, semanticLevel: "canonical-version", detail: 0.9},
    L5: {numeric: 5, distance: 2.28, zoom: 1.44, semanticLevel: "evidence", detail: 1}
  };
  var PORTAL_CONTRACT = {
    contract: "advanexus.world-portal/v1",
    portal_id: "jurisdiction-organisation",
    anchor_ref: "industry_anchors",
    interior_ref: "profile.platform_path",
    outside_depth_id: "L-1",
    threshold_depth_id: "L0",
    inside_depth_id: "L1",
    traversal_states: ["outside", "approaching", "threshold", "inside", "returning"],
    camera_states: ["approach", "enter", "focus", "exit"],
    preserve_world_context: true,
    reversible: true,
    fallback: "semantic-zoom"
  };
  var SEMANTIC_LOD_CONTRACT = {
    contract: "advanexus.world-semantic-lod/v1",
    levels: [
      {depth_id: "L-2", semantic_id: "global-network", kinds: ["industry-anchor", "cross-system-route"], label_budget: 0},
      {depth_id: "L-1", semantic_id: "jurisdiction-context", kinds: ["jurisdiction-portal", "organisation-anchor"], label_budget: 1},
      {depth_id: "L0", semantic_id: "organisation-estate", kinds: ["system-constellation", "physical-digital-twin"], label_budget: 4},
      {depth_id: "L1", semantic_id: "control-path", kinds: ["capability-preflight", "control-membrane", "quality-gate"], label_budget: 6},
      {depth_id: "L2", semantic_id: "authority-decision", kinds: ["authority-gate", "role-lens", "partial-unknown-state"], label_budget: 6},
      {depth_id: "L3", semantic_id: "business-outcome", kinds: ["before-after", "version-crystal", "business-outcome"], label_budget: 5},
      {depth_id: "L4", semantic_id: "canonical-version", kinds: ["contract-diff", "report-binding", "analytics-run"], label_budget: 7},
      {depth_id: "L5", semantic_id: "evidence-lineage", kinds: ["finding-trace", "evidence-package", "reverse-evidence"], label_budget: 8}
    ]
  };
  var HANDOFF_CONTRACT = {
    contract: "advanexus.world-system-map-handoff/v1",
    target_page_id: "platform-system-map",
    allowed_params: ["tour", "step", "level", "entry"],
    entry_value: "world",
    initial_step: 0,
    initial_level: 4,
    enhancement: "pre-navigation-only",
    navigation: "native-document",
    deadline_ms: 900,
    fallback: "ordinary-anchor"
  };

  var EXPERIENCE_ANALYTICS_EVENTS = {
    world_started: ["renderer_mode", "motion_mode"],
    story_selected: ["story_id", "input_mode"],
    industry_selected: ["industry_id", "input_mode"],
    phase_viewed: [
      "story_id",
      "industry_id",
      "phase_id",
      "view_id",
      "depth_id",
      "renderer_mode",
      "motion_mode"
    ],
    scene_state_changed: [
      "story_id",
      "phase_id",
      "state_group",
      "state_id",
      "input_mode"
    ],
    evidence_rewind_started: ["story_id", "view_id", "depth_id"],
    story_completed: ["story_id"],
    renderer_fallback: ["renderer_mode", "reason_id"],
    handoff_started: [
      "story_id",
      "tour_id",
      "renderer_mode",
      "motion_mode"
    ],
    handoff_received: ["tour_id"]
  };
  var EXPERIENCE_ANALYTICS_FORBIDDEN_FIELDS = [
    "copy",
    "url",
    "query",
    "referrer",
    "user_id",
    "email",
    "ip",
    "user_agent",
    "screen",
    "coordinates",
    "evidence",
    "node_labels",
    "free_form_error"
  ];
  var EXPERIENCE_ANALYTICS_CONTRACT = {
    contract: "advanexus.world-experience-analytics/v1",
    default_sink: "none",
    network: "disabled",
    persistence: "none",
    payload_policy: "content-free-allowlist",
    buffer_limit: 32,
    dispatch: "local-custom-event",
    events: EXPERIENCE_ANALYTICS_EVENTS,
    forbidden_fields: EXPERIENCE_ANALYTICS_FORBIDDEN_FIELDS
  };
  var EXPERIENCE_ANALYTICS_EVENT_NAME = "advanexus:world-experience";
  var INTERACTION_IDS = [
    "phase-navigation",
    "portal-traversal",
    "evidence-rewind",
    "before-after",
    "role-lens",
    "quality-resolution",
    "authority-decision",
    "system-map-handoff"
  ];
  var SCENE_CONTRACT_BY_PROFILE_ID = {
    "migration-bridge": {
      required_node_refs: [
        "file-version",
        "sandbox",
        "table-version",
        "pipeline-run",
        "quality-run",
        "dataset-version"
      ],
      semantic_state_refs: [
        "preflight",
        "certainty",
        "quality-resolution",
        "authority-decision",
        "comparison"
      ],
      interaction_ids: INTERACTION_IDS.slice(),
      comparison_mode: "before-after",
      preflight_capability_refs: [
        "source-capability-contract",
        "pipeline-executors"
      ],
      phase_effects: {
        problem: ["system-constellation", "signal-dawn"],
        context: [
          "capability-preflight",
          "jurisdiction-morph",
          "true-portal-traversal"
        ],
        control: [
          "migration-bridge",
          "control-membrane",
          "contract-diff"
        ],
        decision: [
          "authority-gate",
          "partial-unknown-state",
          "role-lens",
          "recovery-branch"
        ],
        outcome: [
          "before-after",
          "version-crystallization",
          "controlled-release"
        ],
        evidence: [
          "reverse-evidence",
          "contract-diff",
          "evidence-package-assembly"
        ]
      }
    },
    "reporting-obligation": {
      required_node_refs: [
        "source",
        "query-execution",
        "dataset-version",
        "report-version",
        "analytics-run",
        "evidence-package"
      ],
      semantic_state_refs: [
        "preflight",
        "certainty",
        "quality-resolution",
        "authority-decision"
      ],
      interaction_ids: [
        "phase-navigation",
        "portal-traversal",
        "evidence-rewind",
        "role-lens",
        "quality-resolution",
        "authority-decision",
        "system-map-handoff"
      ],
      comparison_mode: "none",
      preflight_capability_refs: ["sql-read-only"],
      phase_effects: {
        problem: ["system-constellation", "signal-dawn"],
        context: [
          "capability-preflight",
          "jurisdiction-morph",
          "true-portal-traversal"
        ],
        control: ["report-binding", "contract-diff", "control-membrane"],
        decision: [
          "authority-gate",
          "role-lens",
          "partial-unknown-state"
        ],
        outcome: [
          "analytics-run-lens",
          "version-crystallization",
          "controlled-release"
        ],
        evidence: [
          "evidence-package-assembly",
          "reverse-evidence",
          "evidence-strength-state"
        ]
      }
    },
    "quality-gate": {
      required_node_refs: [
        "source",
        "pipeline-run",
        "quality-run",
        "quality-finding",
        "integrity-run"
      ],
      semantic_state_refs: [
        "certainty",
        "quality-resolution",
        "authority-decision"
      ],
      interaction_ids: [
        "phase-navigation",
        "portal-traversal",
        "evidence-rewind",
        "role-lens",
        "quality-resolution",
        "authority-decision",
        "system-map-handoff"
      ],
      comparison_mode: "none",
      preflight_capability_refs: null,
      phase_effects: {
        problem: ["digital-twin-divergence", "system-constellation"],
        context: [
          "system-constellation",
          "jurisdiction-morph",
          "true-portal-traversal"
        ],
        control: [
          "data-quality-hold",
          "control-membrane",
          "finding-trace"
        ],
        decision: [
          "partial-unknown-state",
          "authority-gate",
          "role-lens"
        ],
        outcome: ["controlled-release", "version-crystallization"],
        evidence: [
          "finding-trace",
          "reverse-evidence",
          "evidence-strength-state"
        ]
      }
    },
    "governed-decision": {
      required_node_refs: [
        "source",
        "query-execution",
        "dataset-version",
        "report-version",
        "analytics-run",
        "visualization"
      ],
      semantic_state_refs: ["certainty", "authority-decision"],
      interaction_ids: [
        "phase-navigation",
        "portal-traversal",
        "evidence-rewind",
        "role-lens",
        "authority-decision",
        "system-map-handoff"
      ],
      comparison_mode: "none",
      preflight_capability_refs: null,
      phase_effects: {
        problem: ["system-constellation", "signal-dawn"],
        context: [
          "report-binding",
          "jurisdiction-morph",
          "true-portal-traversal"
        ],
        control: [
          "analytics-run-lens",
          "control-membrane",
          "ai-boundary"
        ],
        decision: ["role-lens", "ai-boundary", "authority-gate"],
        outcome: ["version-crystallization", "controlled-release"],
        evidence: [
          "reverse-evidence",
          "evidence-strength-state",
          "contract-diff"
        ]
      }
    },
    "recovery-branch": {
      required_node_refs: [
        "business-outcome",
        "finding",
        "assurance-case",
        "pipeline-run",
        "quality-run",
        "dataset-version",
        "evidence-package"
      ],
      semantic_state_refs: [
        "certainty",
        "quality-resolution",
        "authority-decision",
        "comparison"
      ],
      interaction_ids: [
        "phase-navigation",
        "portal-traversal",
        "evidence-rewind",
        "before-after",
        "role-lens",
        "quality-resolution",
        "authority-decision",
        "system-map-handoff"
      ],
      comparison_mode: "before-after",
      preflight_capability_refs: null,
      phase_effects: {
        problem: ["incident-shockwave", "partial-unknown-state"],
        context: [
          "system-constellation",
          "digital-twin-divergence",
          "true-portal-traversal"
        ],
        control: [
          "recovery-branch",
          "version-crystallization",
          "control-membrane"
        ],
        decision: ["data-quality-hold", "authority-gate", "role-lens"],
        outcome: ["before-after", "controlled-release"],
        evidence: [
          "evidence-package-assembly",
          "reverse-evidence",
          "evidence-strength-state"
        ]
      }
    },
    "evidence-rewind": {
      required_node_refs: [
        "service-ticket",
        "assurance-case",
        "entity-360",
        "integrity-run",
        "evidence-package"
      ],
      semantic_state_refs: ["certainty", "authority-decision"],
      interaction_ids: [
        "phase-navigation",
        "portal-traversal",
        "evidence-rewind",
        "role-lens",
        "authority-decision",
        "system-map-handoff"
      ],
      comparison_mode: "none",
      preflight_capability_refs: null,
      phase_effects: {
        problem: ["partial-unknown-state", "signal-dawn"],
        context: [
          "system-constellation",
          "jurisdiction-morph",
          "true-portal-traversal"
        ],
        control: [
          "finding-trace",
          "evidence-package-assembly",
          "control-membrane"
        ],
        decision: ["role-lens", "authority-gate"],
        outcome: ["evidence-strength-state", "version-crystallization"],
        evidence: [
          "reverse-evidence",
          "evidence-package-assembly",
          "finding-trace"
        ]
      }
    }
  };
  var BRAND_HEX = ["#0ab39c", "#343541", "#ffffff", "#f2f2f2"];
  var BRAND_RGBA = {
    teal: [0.0392, 0.7020, 0.6118, 1],
    ink: [0.2039, 0.2078, 0.2549, 1],
    white: [1, 1, 1, 1],
    surface: [0.9490, 0.9490, 0.9490, 1]
  };
  var TAU = Math.PI * 2;
  var CAMERA_TRANSITION_DURATION_MS = 900;
  var CAMERA_SETTLE_DELAY_MS = CAMERA_TRANSITION_DURATION_MS + 80;
  var AMBIENT_CHAPTER_DURATION_MS = 7000;
  var JURISDICTION_CONTOUR_SEGMENTS = 48;
  var JURISDICTION_PROFILE_BY_ANCHOR_ID = {
    "anchor-global-control": "synthetic-jurisdiction-01",
    "anchor-finance-network": "synthetic-jurisdiction-02",
    "anchor-risk-market": "synthetic-jurisdiction-03",
    "anchor-public-administration": "synthetic-jurisdiction-04",
    "anchor-connected-infrastructure": "synthetic-jurisdiction-05",
    "anchor-trade-corridor": "synthetic-jurisdiction-06",
    "anchor-modernization-estate": "synthetic-jurisdiction-07"
  };
  /*
   * Natural Earth 1:110m Admin 0 outer boundaries, quantized to 0.01°
   * and delta encoded as fixed presentation data. Natural Earth data is
   * public domain: naturalearthdata.com/downloads/110m-cultural-vectors/.
   * No runtime request is required, so the globe remains static-host safe.
   */
  var WORLD_COUNTRY_OUTLINES_ENCODED = [
  "gljBtkDAhD_DvB9DpBZqCkDqB-BK2D-B",
  "q5iBrtDwBgBmC5BhBnD7DbtDaR4CsCkC8CX",
  "1jjBjkDZ_CPLAiDqBK",
  "8zG9FiBV2W3MOzD-InG7C1HMxDgEnCGzB3B3DM9BL_CmC7DyClGqCrB_EzD5GtC3DEnC7BpED1BZvH4B1EP3BwIjC-CnB2BjGmBxD8B9DiBvCiBzCyBrD8HzDwDnB0DUoDjB4FyCKqCoCuCoDwBqBBiCpBsBLwC6BYM2DvCyDmCY8GD2MQ",
  "l2B8sFANBlBBvJvUKG_P5FRxBlDmB_IvYApBhCI0CEAiOQYoCyC6CiC0I2I4G-C8H-BOiC8EoFWoCZ6CAiCuB8DGFsDeA",
  "3_XoyJZAjMkGtE4CrLyCtDyFc6D_H2CjBgFvHyEFmDwDiDF-DzK-DrGkH9DwE1F6ClEyCrDoDnGhChGtDxFiErE4ChG4BlGGCyjBAmX2LvB6J_CyGRuF0C0H-BoJXsJ2CoKyBoExC2EuBsB-CqETyKzFsIoEa3E2HgBsC8ByHLyJzC0OpCyIhBkGOuIlD3IjDoLpB8QYqFiB2G3D6GmDrG0CgEkC0HKgFUiFvBoGrDgHQiL5C2JgBkJFX8DyFkB2JjCB9FgEgFiFF6CqG1G8DpHwCQ8GsHyEoIfqG3CwIhHxFhD0LnBAtGqI-EwH_D7B1EiGlEwGwEyEsFM8G8INoJdsIjDMhDzErDsEpDZhDlMrE3IdtG8B7BjD_FpF5B1CnHnE9IN9EzCNhEnHX1HjF3G_GtC9EJnHkJhB8C5F8C3E4ImB0L1CoGrCwE9C6H3B0GzCqKL6GRhBtF-BnGyE_GqJ9F6EgCsDuGnD8JtEqDgK-CiHsEwDqEPmEnEqFzH2EsHyG1C2FjC4JsEuB2K1BuGTmF0B6FhC2HzD-BtCkLPFnFiC7H4FfwE1DiJwD-F8GmE-C8EzFkI9H8GvHvC9DqIvD0FzD-JxBiE_BuCpF8EZwCrCQ_GxErCvElCnKnC7HjFxKfrNqBrJCvGNnFvE9H3C_IpIlH3FoFiBiKmIkNmFqJUyFhD9FlEgC3GiC1EkIjDqKcoGiHOxEiEnC3HhE5N3DnGvC9GvE3EOHqF6KkF_JF9GXhEwDAyI3C4BlEfjC0B3E3E9B5ElC7CzCd_BJVxBvLAvJB5CjBxGvEZP_BtC3FAjGA5CfgBnBS7BDVlIhDtGfnHpDxBAjCeVeEUsBmC-CuD6B2DnBuFpB2FvG-CYiBda1BAnBgBJuBnBTzBGMUvBUT0B5EgChFiCjGuC7FoCxF3BhCB1H0BhFZhG-BrGgBrEM9BiBjBuDjCBArC9MArVAnVA3SA3SAtSAhTAjGAxSA3RA",
  "9sQqmM0E8CyIBDlBpHtDrEErB2B",
  "zyPgnO7GqDKoCgDOqOV4KtDS1BzGG3GE7Gb5BM",
  "_1PikMuC8ByCFyBnBtCpD3CSzB8BIO",
  "hpS00OtDtChJQxH0BqD6CgJ2BuFlCqC_B",
  "vqSwkP7CF1LO1B2B0MBsElBXV",
  "18SqsPuHlC1BnCnJpBhFuB1CsCPyCiIH2DL",
  "9mR-wOhKazQgClCuDXiDnG4C9MYnH-BqCyC-ML-G_BoMAuFhCtBrCmHrB-DvBuIHkJR-JsB4MQkKN2GpCuBzC9DzBpJrB_HY9Rd5MD",
  "r3VuoP6IdjC7BzL5BnJgCiFgCkJU",
  "v1VwsPkInBzHlBrKACcuG8BsDJ",
  "v7K4gKpD9DlEvFkEkCmEpBlClCwF3B-CyBmG9B9BxEsEiBapD-B7DzCvF5CHjEmBsBkF3BYnHtF3DIuE-C_FwB3GLjMGd8B8DmC1C2BoF6DuG-J8DyDuFkC8CHlB1B",
  "nsQ-2M6GjCmH9BS_CyEQwEhCxF_B3JwBvD6ClGpD7InDlC2DtITuFkDa8EkC4FwEPkB3CoDe0DzB",
  "psPmkO-FwC6NlD0I9Ca3C0LuBwG_DiPtCwFxC8F5FvL9C4OhE-JrBgJ3F6JN9BrE_KnH1H2C5JgGjIZXxDyGzDwI7CyC1BiElGjCvE9H4BzPgF6ItFwG3DgBlC9QwCrN0DzHiDmC4BpJmDhJiDC5BhSfpFkCkE0E4LE8MYhCoCmCkDiIiG3B6CrCkCxJgD1MkCgE0BzG8DvFM9EkCpD7BrLZ1WuBnN6BjKelFmCwG8C7IA_BsG6EyFuGyCkQ0BxE_D-E9D4FiF6PyC4KtGdjEsM6B",
  "zuSqvOgNF-LvBpJxFvHnB1G1EjHI7DwFCkDoD0CoG2B",
  "5_X47OyK0E8MiEyJByIeb5E5ElC5FJzL1C_JdtIsB",
  "t9Z4xKgGQ7BjHuF_EvCA3D8CpC8CjD-BlB4CMgC-CZ",
  "pzU0vPoMZ8QpC6E_CuCxClKWpKgC9NIiG8BxHwBNsC",
  "9jYmvJjDbpK8C5BmCzFmCjB4BtGkBrCuDQuByGrB6Dd8FTkClCkD9CoGzCyCtD",
  "z3XqxO-IpB-PJkG5B2GzC7HzBpPrE3HrEA3CtQ_CpD4CtOqD2C0CqEyEuFkEjG6DkVgB",
  "7hVi6OyFgByGHkBhD5D9ClVf3P1CvJFZiCgN4CncX3IkBwIkG-F4ByRjCkL1D8KP9IgG4FoCuGVkC_CuClC",
  "35U4oOgHxC-DhG-BtEuKhDqL_CV3CnKPgErCjCpCpLgB3K2BnHL3LjC5PdjLRrD-CxI2BxFV1H-EmEW0JiB6IJkIkBhMuBrNP5IEpDqCwOwC1JB7K0BoF2EqEwC4Q4DsGlBjD9C-N-B2IlDiHmD2FhCkFjGkD0CtEsGwFeoGf",
  "3zTumO7GiEsHgDwHpBkLa0B5B5F_CuJ1CjBzFnKtC_FSpEsCxP6EEgC4MX",
  "n6UgsOsII4ErBvFjE3JsEkCc",
  "znTw_O4E7CInD7CzEpKT1GgBE0DnKPN8E4GFuJkC4ILQa",
  "j4S43PsE-BsGO3CuByOKgIrDwKpBoKlB-EjEyH_BzI7BxL1E_KN_MY1GyCCoC-E2BrLB9GkC9D6CqE4C",
  "t8R6_PqJoBqHGoMgBmJqC4HJ4G3B4EsDoIgBmLWkTIqDViSiBwNLyNL2QPuNZuL1BH1BnP1CjPnB1FtB0NC3O5DlK3B1KjF7MhB_DnB9SV0IXpEjBmFhD9FlC1J3B9CtC3I7BctB2KIEvB1Q3DpQ2BrSdpJY5LKZgDyLuBhDwE6DO2Q1CvIgEjKmBiFuCiLwB6BmC7IuCzCmDiRH-EV4JoChOY7VLhLkClFwCpH6BrBkC",
  "j2OwlNhE5B_GJxBiD2CwD2Fc-E3BC1CXb",
  "z5SqyN6DrC7DlCtI8BhFVxI6CwF-BsE2C0G3B4DjB8BlB",
  "nzM23JmCSmIxBsGzCGjB_CDjI-B5F-C",
  "hwMgmJmChDwEZ6FEhDxCpCL9H0CxBkCsC-B",
  "3_XoyJ4RAySAkGAiTAuSA4SA4SAoVAsVA-MAAsCkCCkBtD-BhBsELsGfiG9BiFa2HzBiCCyF4B8FnCkGtCiFhC6E_BUzBwBTLT0BFoBUKtBoBf2BAeZXhBwG9CqB1FoBtF5B1D9CtDrBlCDTWdkCdyBAoHqDuGgBmIiDEWR8BfoB6CgBkGA4FAgCuCaQyGwE6CkBwJCwLAWyBgCK0CemC8C-B6E4E4EkCzBmEgB4C3BAxIiEvDkBhC1G_CtGlCzG7BpD1DfrBBpDiCpDyCFTqC8BtBR3BlEf_CCzEhB1CJ1DJlF5BmJmB8BlB3I7B_DAGY9B3B8BHrBvExE5EN0BrBKhCyBqBrDyBjBCrC_BrCvD_ERI-BoElDsCXmFlB1CqB_DjEgBqE_BI9F6BNUlCcnG9DzEvG7BhEzDjDNlDpCbhC7GhEvD_C_C1DdtEkBpEiCrF4CtEC1C-CnHFlEHtCxB5D7BZhDYf4CrCuBpDsF9C6EduCqBkE3BuD7EoFtCepG5CjBK_C8C9DyBhHZxFW3ELxCfkB1BDvCqBnBlBZpCepClBxEG1EqDtFZxEuB7DNnFtB1FzElG1CtD_CtB5CBpEK_CmBjCtCFtEsB7E-B3B-CrBsE1DyDlC2DjDoErEwCjFD9D9ElF8BnD8BxBuDhCoD1D4ClDgCpCmC5KAAxC9EAtMBnOuEtJiDSmB9HVjHNhBmD_DyD9CYV6BvDKnC2B5FUxBgBXuDhGoGnF2IIuB3CiC7EoFbkFpDsDsBmFFsF_B6EuC8FY2FY0FjBsI_BsF5B8CYoBiJjCqD7FyB0BfkFjCkF",
  "nrew9DkBRgBZyBlCDLtCpB_BfdfxBcG4BfoCKWiBiBNmBMUODuChB",
  "_ue4hEPXhCNjBqBVQBOUQmCR0Bf",
  "3zeskEFVrDGQYiDH",
  "17e4nESN6BhCLLNElCGXuBHI0Bc",
  "hkf6qEEtBVTjCmBKOeUuBF",
  "twgBs5LgFRSrC5DfjEmB5D2BmGiB",
  "19dqqLmEN0C9BtF9CnGtClD0Bd-C2FoCqDe",
  "lxb2zNAlXBxjBmGFiG3BsE3CyFhEiGuDoGiCsDnDmExC2F5C-DvEsGjH0K9DG9DvDhDtDsCvFgC3BuFhIiFrD8F_FO9JEpH6B9MwG_FmB7KmC1IPpM8CrH0C9GpBoBpEtDNnHnBvFjC9GpBb0D6CmG0G8B1ByB_HtDnElE_ItEyEhD7FtE3GzCnG9BxB3C3JnD9B9CpHzCpEO5F3BrGjClFhC3K5BdiB6G-CkG-B2GsD4HYiDyC2I4DsBoB0EmCiB4EmD2DlH7BhCiBrDpChEmD1BnCrCkDnGvC5DAP4DkBoChEoCjIlBnF-CpEwBAwD5E2CuCyDiFwDoCoDiFOoEfiFgDyEP4E-BlB6CvDkB0EuC5DBzGrB9BrB9EsB5IVlJwBzCwC7H0D4I0CgOiDkFAbjDmNIhF8D1HsCtEkD_F0CxIgCwDoDiLI8H6CwBiDsG-CkGY6L4C4FN0JsDuJpByE5C4CmByKLLtByJhBsGUmN_BgMR6EZqIgBwJ7B4Gb",
  "pxhB0uM8DlB8DUiFzBmGZPV3EpB3EqBrCmBvFLvBSMqC",
  "giRyzJ3EjElFRJpGvD5CrMiCvElLlDrBrMvC0F7KpEzBQxD7DejDoCnJUrKGnCV9I0CvDpBf1DpKmChEdtB1CxDlBnIrE3CtEpCB1BgD_HGnBkFhDAQqGvHyE1KPrHd9F2FjFqC1JwElBShQ1DIhXlDJrE8EnE4BjHnB3CjCJyBwByClBmCnHkC5C0FtDyBFiCiGTI0EqFgBuFdkBiGjB8DnGJpFyBnH3C5FpBlDgBUoD9DkEzEDpFmEyD4E5BqBgF6GuGzDY0E-M4G4JG4NpEuHxC0G0C8JEgIlD6B6B6IHyB-CjKqEgGiDlB2BgG0BvEoE8CmCsXkCiDyB0PqC0F0CoLrB-BvGwGyBiIjCPtD-FM2P8FnC9B-H7EgO7PqDqD0IzD-I0BwDjBgDzDsElB0C1CiIcqD7D",
  "69KmiIHiXiQ2DmBR2JvEkFpC-F1FsHe2KQwHxEPpGiDAoBjFgIF2B_CqCC4CuEoIsEyDmB8BTnFhE0ErCuEyBuHnDhIvE3ESxCDb4BqB8CrItB_B_D9CvDnFKzB3C0EvBqBzEvDrG1EsBvDAG6DpI2CxGiDhE-ClHqEhDuGhCmB3GJtCqBT-EtIqDnFzDrFjCiBlDhHB",
  "oxbnQ8KpEwLxDqElDwDlDe1DuK5DwBpD3FVsBlEyFhEiEzG0DGH3C6EhB7BlB0GzCV5BjENxB0BrFWpGe5EgExDuDnDuFlI4CnF5B5DhCYxE7ElCvDiBvGIBsUDsU",
  "g6d7WsC_BYnD9B1BlB2DtBuC7CiCxD0CvE8B4BwBsD3BkCrB0CvBwCzC",
  "0xdvkBtDvBlDvBpDAjF6BxD4BQ-B0FbuDOegDcGUpDyDO4BmCwDmCV2D4DEoBfDvDjC5DnDPf3B",
  "onerhB8BtBiD9D-CjCb3B3BT1CsC3CgErB4EcUW7B",
  "oxbnQErUCrUxFkFpGoBxB3B9HF2CiF-D4BzB6G_CoFjMoFlFSrJ4F5B_CtCRrBoCB4C3EiD4GoCuEDP2BlJAtC2DzFmBzCiDuIwBmDiCiKxCepC4BjKwG3DmF0GmH6DyFAqFlC2EnC2GlB",
  "itYx3BUnBE7BhE1ErFrBXYSkC2C6DmGwC",
  "6majrBT4EkBoCqBiCuB5BB9ClDpE",
  "4gX8ZxD1F0E7FhB7CgH5FtHXhCnEIzF_FpEFlGrCxJdmCjH5CtC6DtEMjDgCtHnCpCiDhELlFYdsIjD4B_CqFbwFY4F2DmEiBlEoExDiEqBgEP0DmDgDS-F3BiFqBmD2IuCmCmCkHmHAsFhB",
  "yoZvR8G5BoC5EnFyClFSxDNpEIwBuD2HI",
  "-4Y1XpEkBlB2CqGKyBhCrChC",
  "y_YyNOrD2DRUxCJtFnDUd5DyCpD3BXvC-D7BgIoBgFiCoC",
  "qgYwFmHImGwEiBrB_ElG1ElBhGmBrKJvFbb3E0FxFsD6C0LkCP7C3Ce1C1DvFrC8FhIjBjC0FlHBjEpD5BtCmCgDkFjGtCxB4BasCvE2DOiGjE7BQpHI9I9Db1C6B4B4FdiGzCA9BqEyCiEcgFmDsJqB0CqF0E8E7B8HZ",
  "8vXjgCpIsE6FoBqD9BmC7BL1BzCD",
  "s2Xr1BmEQyFqCbvDtJ3BpIYAqCgFoB8D7B",
  "kjXn0B8DQyB1CnHnBpEZrDCkCyDuDC2BmCoCzB",
  "imVjoBanCgMTsByCyL_CqC_DsJlB2H1DlHrC7GwCzFFvGQ5FkBnHsCzEUxCZtL0ChB2C1FOoE-F0HJgFvC0CN",
  "qsU3GiBrEmCvDyERiD9DxB5HHzJ9GDnFmFhIkFzC6D3EiFjD2E3E4IvFmF5BsFpC8EzF-DnDsF3EwDvG8GRmDiEH0JlByFjG6EnEuDzC-F1GsGDoFnE0DnF4E7CvChFyDlCoCD",
  "9sN_oKsC7CkD1EkI3D4IxB5CjD9FJlDmC3DG1GAA-N",
  "loL78FvB_E1BrGCnGrBrBPhENnD-HrFZpE8D1CJhD_F_HnJrDxMpB7GUqB1DnB1EkBlD3DlCrGb_FqCtCzBcnGoE7BsDgC8BnD3F9B_E9DdnGvBrD7FA7ElD5B1EkGxEgGpBlCxFrHxDhEpH1FtCxC9CgCvGmEzDzCK5FgBhPazC0DE2ElELlCoCR0G6E4CgCgEXkDqDsFqCoIV2D4CmBVqC7CoBiC0C7CsCtBoHwCoBhB0HwBsG2ByF4DqC9BiGA4F4EiEFoFyDkGC4FzBkB9C4K8DuGRiGmC2FkE8FsE8D5BuCoBgCFuK6GiDkCwGXyBoF2FmIxB0DvEuCiFkHHgBrBwLlKkFd0HzEuGtCe3ClGvJqG3BgHd-EgB2F6EgBwFkDmBkDxDD_EnFtDlExChHhGrIxI",
  "9sN_oKA9N2GA4DFhCvCrF9BhDG1DQxE8BxGe5HuDtGsDxIgHkFpB6IlEoIlCoD6CgCqE4FyCwEX",
  "9yN7tDiDnEavEqD1C_B_FsD_GuCzIwEaYxBjCvG5GhDGtKnB_B6BtCrE7DjE7FlC1FShG7DtG-C3K0BjBB3FxDjGGnF3EhEA3F-BhG3DpC1BxFvBrGiBzHvCnBuBnH8CrChCzC8CnBWpC3ClBW1DpCnIpDrFYjD_B_D5E3CSzGmCnCmEMD1E0CzDiPZ6FfxFC_CxB1FnCf5FzCFhHiCjHqE5H0D9B-D4B2DjDkEZ2K2CgGyG6EtJ6B-FyFkCsK-GlCoD-MlE0B9B5H9De-B-IkCyL8CoE5BkGPgH0CI8DiKqEgK0CqJtBsJ8BkFX4H0D0HmBiMgCgN-BgONmKpB6ImD0B2BmD",
  "s3FjckB3FTnDoBzD0DvDsD7HtCUtIhB1BX3B9DsB5ChBrHZnG2BjBsEtC4BkBQ3G5ECxCuDnC2C5EctBoD5D9B_EchC6C_DS9CDJ-BlCE5CM7Dd3CGvBRKuHhCqCP6De4DnBuCD-DzHBSoClDAJjB7DHxBzDdxBvDchCbjEPrCoDtBiC5B4DvB0EtSEnCX3BCzCZb-B0BWG2CgB0BqCqB0BTkCsCsDBO3BqCjB2D-D0DgD0BgCHmF4CiG8CmDiEiDYgCEoCiBmCLyDawFmB-D8BqDM4DSsEuCmDsDgCkFjCgEpCyET2ElB6B4DcQ8CT-GkDwCpBgCGewBqCS2EVgEDiCU6DjF6CX2BiB8CNwDqBuB1CwFjELpHwCb_BlCrC1BrCnDpB7CLhFtBrCB1E5B3BH3DZNTtD0B5CMxH",
  "-jIvK3DkFB4WwFkH2B-BgEEyFuEkII2R4SsEoF6C6DAoDAqGAyCCEgCE8CeqDU-CkCsCAE1BRzDCpDrBnC3B3G_C_G7D_HrFjJpF_GrHvInGhFpJnG5F3E7GxHtBpDrBtB",
  "g1Hnd9IoGN0D1W4MhBWB0G6ByCiDkEqCyE3CkHXmD9CqE6D4DoEkEoDhBAvDkChCsEA8HpFgCBuBGsBXmEP6B0C4F0CwCjCqEAvFjHC3W4DjFtEvCvBzCrCNbtE_BvCnBlEvChC",
  "y5EuzB3E4ClC4BNgCiByCByCxD8DX2CEwBpC8BB0DpBuClCLUqC0ByCX0CiC8BpBwB2B6D6C0EuFNJ6YC0CmHAAwMkZAoYA6YAgCjGrBjBctGqCvHsCvBuDpClDxDxEhB_B7BTlE1ClJWvCfrFxCjG3DjD1C3ETxC9C3B7BxGCzFB8EbEEkDXmClDuCXwEY0E9CONtB3DJwB5BS3DtDtDjDvElDTnF0DrCpBT5BnDlBFnBnGAboBvEInChB1BQnD2DhB2BvEb3B7CxBxFlClB7BVoEtC",
  "g1Es6DK5YtFO5CzE1B5DqBvBhC7BYzCzBxCTpCmCMqBtCCzDqC7BDvB9DhBlDvCvE5G7F9ChGM3BRUlCnDlC1CtC5HrCxBsBhBEjBxBlFPgB2B_BqEb0C3CiB1D0DsB-C8CT4BOwDBtD2FImENkEtCgEU-ChEECiEzCqC2CmIgI-FKkIuC2MqB2CxCkCDgCpC0BxB2JqGuD-Y9L-Y_L",
  "lgOm7DSrDPrCxBhB0B7BD3BjEiB9CL5DO9ClBrD-BSgC4FZ4EPoCsB7C2CCsC_DgBuB4B6DJuFf",
  "lgO4wDE4BzB8ByBiBQsCRsDYiB8EA4DzB0BGkBnCuDEF5B4CHiDpCpCvC9CqB7CHhCKjBjBtCNdyBhCdvCnEzBgBJ4B",
  "i9iBs8N-H0CApE7GJhBgC",
  "8yJgiJ5C1DhGhBnGtG2F9FTlE6GrH1DvChBzB5COnE6D5BG7DuB9ByC5FqB5DfhBmBxIgDlJgBnFiBXX_HqFjHsCrF0DwEgBmFoFvDwCoJwCFsBzFfI6CmD4BiGOgBiCtBuDyCqDB6BnJiCzDB7D8C3Ed9HmCEmBnC4C_EKP-ByBoB_DyDtGT9BKxBtBpCIxBgEtBiCmBUgFHuCsB3B2BnEiBMkBxCmB7DiEqB2BT-ChGwBpDXbyBxGyB_B2DRgD_CuB2CgC7B6FuE0DdkBkHuDxG-CsNgI6F0DsCmDnJoEwCiEzF2EoEsFpHiH6F4ExJkEcsEiFU0KwCuGmCqK5DiRvB0XhH6E9COlE9GnDnK1B7b4EzEZmKxEO7CMtGiI7B8EzBagD3D2CgEsCiP7DqFwBnE0EyOkG6FL6FlC0DqElF2DiD4DzE8DwR_ByDvD7HXAvD-EjC0JqByBgEiNgD6VsF2EJjG5D4HTuEkC4LGoJyCkH3DkHkExG0DoDiCuS7B2I_B0WjHmEqDrGoDDsBxHSiCgDrD8EFgCyL0FkE2F0EoByQzBqBvD9FhF8D_BgCrEtBxI-G5D1ClEnM7IkHdwCoC8G0B2BiDsFgDzDyD-CkE7GQvBwDgFoGjIkFmLmEtBuEkDEoDtDtC_F2GlB7CwEwKwC-MKyLxDxFmFT2G8KoBiPHwNahFoDoHkEmHEkMkDwQaiC4BuQSkFrBgOqDwLD4B2C-F2C4OyC4KhCvIvBkOf2BhD2FwBqSBiOhDgFpCvBnD9G7BtQtD1E7B4HboJxB0FmBmD_D4CyBgKgBiUfwB9CkadM6EoNjBgKCiKpD8C_D1DzC8H9E6JvCgGyGiK5C0K2BkM9ByE4BoKbvE6FoI2Cu4BhEqF1DsQ5EoZmBuMfmFzCXxE2H3BsIoBiLG6LnB8LW8KxF4HgChFgE4C6C-T3BgNMgS_C4I3CA7YBB_H3CjIQ0FpD4DlF8C1BYxCzB1B1LsBtR1ExFXxJrEhJ5DpC7C9IqEpQ7E5CqC_F1CrIc_BjEvHhGGvCkHrBZjJ5FH1ClF0C1C9KnDlCjHpJvB7BrG_I5FpCqE1CkJvD8NgD2IqF2DK-C2JuBmL6H4KuGoLgFgF6IxHP3DlF7P7GjF2HjQjCzPtKkF7D9NzBzJTOwE3JgB3HjDhTkBxU7BnUlM9X3O6JZiD7DiGrBgEiD8GLiJ7GGpF7EnGRtH5C_JtJhJhCpEvIpHrIlHhE1DpI1D9DB9DgDrIxEfhCbkBBkDmDGesHzBsFqFmC0HjBmEkGkC6GuCqCqD0FrK7BrFtCvJAxC8FrHuE7KgCpCkGlC6DrC2C5DqGvFqCrJ8BnIF5HjBjFjDuDtBCvDvD_BzFzGC3C5I9DvHsCtHPpDiC3DWjJtEnIf3FxB7HgB3FB5DmDjGgDnGc9HZ7FlB7I0ClB2ErH0B1FW_G0CtGvGwC1DhGpEhJyBlGGlE-CxGEtF8BvJ9C7LrFzGhBtCRpD8DhIbzC2CrEmB_C0DvDkB9IzBzI0DpDpD_N8P9H8EoC-B1P7F9FLQuDhIkCvGxB9BwGnLsBzFzCzPpChDxBrXjC7ClCwEnE_FzBmB1B_FhDkKpExB9C5II5B5B_HmD7JDzGzCtHyC3NqE3JF9M3GXzEtG0D_E5G6BpBxD3EqFlE0EE-DjETnDmDf",
  "kqSs6PwNuBkMjDuOhGxBzFzNXtR4BrKuC3EuExIoBoQoE",
  "4iUwvP6PxD5BvCnjBtCsLmImFY2EN",
  "2jb87OwQJ0WpD9EzEhXGpKvBtMiEsDqEoImB",
  "s-c-2O2P1BlHtC_JSzLuCwBiC0Ld",
  "kqbyqO-FwC6HS8IrCY1BtJA5MWjBK",
  "q4I23PmMkBwJCoB1B0DwB8FiBoJrBrCdtIZzFPbfnHhB5GwByD-B7NG",
  "iuEyzKvLD1HYuB4C0IgCyGhB4CfV3BQxB",
  "uuK-sO-OwF1B6CgOqD0UgE6UmB2KqCmMaqEvClE9BjWhDjT_CrT9FpJjG5J_FoBlFgMjF3DRrUa1B6CpL0BbsDsGsBHsDuMsF3FY",
  "m9b0vKmC_FDjGyCpGoGhLnJiC5DhJiGrGDrE3E4DjE5EjBoFWiGX4GwB4EIqI1DmGSwI6F8CvC-C4Cc0BlE",
  "pliBikNP9DmEvBtBwE-QdoM5FlG3CnKTDjGxCpB5FG3EmCpI6BtB4CpGgBjHZrDmCqBqCtHvB6C9CxDzCA8YqP3EsQlG",
  "58iBi7NlILAqEaIqFAgJ5BPbtGvB",
  "gxGq_I0ByBuEpBgCHanBeFCRiDvBsGMnBnC5GhBvIzDtDoBsB-C7G8BkBmBgGiCdY",
  "ztPunF-CQkEFGzB5GfNqC",
  "lmPgpF-E5ChBtElBaEoD5CwCAW",
  "1oPy9E8BHmClFCzDxBJxB0DrC6BsB-D",
  "v-LhkKwH4DqFxB4DwCgF5C7BlCtI7B5CmCpF5CjD6C",
  "0-C-xPsCmCmJG8HlCyUzE1PvCvDxEvFlB9ClFxHHtN6D2FoCrJ4BlMqF7E8EiRoCuDlC8IC",
  "siG4yNzKvChFT2CuEhIuC1JhChDzE9F3C3GwBjIJ_GqD1DzB7DHdjE5LgBzBvD_FAjEtEnG9G1J3IoCjClCvClGEhE7FMpIgElDhCpHlFpE3CxDlE6DrMnHpItBzImDnC2G_BuO4FgEwQoFsMwGuL2IgPiMwK2EkR8H4N4CoKLyJmFsLHoLoBwTzE_HzB6G9D",
  "qrFs0PpJrDjSXrSiBjB2B_IE5G8CqT4BiJvBqG8B6PxBoMlC",
  "w6EymP9NxC_KwBqE0B5D-B-MoBwCpCgJtB",
  "nkJukQ-U4D-VJgIqCiWU-xBZinB9EvLtC9XHzhBTkDjBkWW8SjCkM8BmFnC7GzD-PqCqeuC4SlBwD1CvZtEvDtB_ThBwOJpHxE_EhEG9GwHhE5JJnK9ByLpDuBpF1GRkIrF7NPoHvChCnC5Id3IA8HnEC5CrM0ClD1BuIxBmI5DsChFlLlB5EuC1HyDkCnEnHnDuQJ0IJ3QtF_Q9EnSjC9GBtGrC1IzGtNrEpEHrIxB9ItBrF7DBrElDjElK_EwC7E5ClFlDhG5ILlJiFvMChGuDlEiG5K6HlDiEb0FzI4FoC0ElEmCmGqHsJqCwC0CqB8EjHnCtDbzFdzHiCNoEuCqD6FE4M1B3K-DxFmCnGblFwB-G8F5DqC9EqEvH0G_HuCC0C3Q0DnNQ1QJnPNnHgC7K-DsQ-B0MM3a0BjOwCcuC2XgD8WgDuCqC7QoCuFwC0VqEkJWzC6C6O0BmTgBoTC6G9ByQuD-OrC4INgNhC7OsDc2C",
  "8uN7vJgE_B-FXGlB3B7CxJLFqDeyCOqB",
  "itYx3BYuBsFuBqEGgCasCZpC1BvG3CnF3BD8BToB",
  "kmDzyFgDkDwC3BiBzC6CP8DlBsDQyFmDCiX2Bd2D9FR5DsBlCwEUkD6C-C8BwBgDiDuB0CXgD3BkFJ-DuBWgCiB-CuDQ8BsCiCmE0F0E6I0EyCBgDhBkCYqDTgD5I0BtEjB9GSnClDkB5BNR5B1BrCCjC2DtD2DWoB6C4EBxBxEXlFzB5CnElDlBb1ClD3BlDvDvEhHtGtE3D3E7CvGrClDLZ1B5DchDlB5GoB3DZzCMtGvCpFf7DrC5CD1CoChCE3C4CHbb2BC2D_BmEgCkBF6EhE6FlDqFvEkI",
  "k1F_0FmC7B9B_ChBhCvDfjB_BnCT1E6EqDgEsDuC-CoB4C9B",
  "h8WsrGkHO-HWRlBuJhDoOtEuMC-EAAyC6KAqClCmD_B2D3CiCnDyBtDoD7BmF7B-D-EkFEsEvCkDnEmC1D2DxDsBrE4B9C8E9BuErBuCGtCvFhBvEPrIRhDiBrD-BhDoB5EkE1EwBxDuChD0G1ByCzCwF4B4EU2EkB-DkBgEwCwB2DQoFiB6BoE0B0GuBwFF6DQwBpBH_CpD1DvB5DkBjBd1CxB7ExB0BpBDlBBnC5DjBYXHCd5FC5FAAxD5CAqChCqCtBWrBgBLDjChIA_CjFclBVtBF5BhH4GnDgChF0BvDN_ErClDTrE2B1EmB7F8C1EchH8CnFgDxB2BvDMrG-BzC8C1GyDjD-DvBgDiCUT6BuB0BAkChC6CRwCjCkDvFoGpG8E_C8DrFyCjBwBe8DlDwB1DgDxBsErDQzDqD9CgDHgCrD2ElC6ECsCvEwCjCJxD4BfxCiB_CU1EkCxC0EpEiBtBePajCkBEoBhE8BxBsBnC8DlDkC5F6B3C4B7CKpDiDFwC7CoC5CDhBzCpCjBA1B6DhEyDvEgDlD0BGyEdsD_C-BnE6CbZxB0B7DwB1D0DQQyCLqCsCI6C5EuE1D4BpC8DpCkE7CgFxC0F",
  "loL78FiEWqG5EqCGuG_D8EvD0DnE3C9C4BxD3C9DhHtDxEoBtDV3F2CnEF5DuDQiEsBsBBoG2BsGwBgF",
  "xtKhzG3ByD4C-CzDoE7EwDtGgEpCFpG6EhEVsIyIiHiGmEyCoFuDEgFjDyDjDlBoB0Dc2DAuDnCkBrCfpCIXuCR2FlB8BlE2BxClBzGmBOwI7BuDgCqBTyD2B4CkB-EtB8DtD4BVuCe0D_LIrCqH6BCB2CnB8BHyDzD8B9DBzC6BlEoBvCqC_GiB3GyFQmEXuCU2ElIhBnDrCvFvCrB7BnDFzESvDhB7CWOwJjF1DvFGrCqDlEMqB2CtD6DzC0F2BkBA0C4D6BTsD0BmCO-CkHoEkFmBce0FJ6CkRE4CfyD3CoCAyEyDiBoBVGuCzDUD8DmMDiCmC4B_BmB1DmBYuDpD8EOoB-B0EuByCgBY2CuE4BJqBpFSb-DImE5C0BmBS0EZgFxB6BwBuEegHsCqCsCZ4BoDIuBtBZ3CkCduB7C3BlCdpFyBlDO7C8D9CiDJWmBgCK6CiBgC2BwDRwBIsDPSoBfoBU6BwCR-CU0DpB2CnB-B2BuBJa3BgDOsCsC-B0E2D4FkCIyBtDwD9KsDfEpE1ElF-B7BiLfInG4EkE6HnCsK5DiD1DftDoH-BmMpDqJIoJlFgI_G6E5BqFHoC9BkC_HiB3DvCrKlDhE5I1I9DhHzEtFxBD3BxEO3L3BzJVjE9BtCjBrIpGjIhBvGhF1CvB3D3GA7JrCrE5C_G5BrH_EpFlGbzEiBvDlBpGtB_CrEtD9G_KvF_EnE9C5C9FjExD",
  "xyNtkC0ERoDGsB8BwFwCoDsCmIiBT1EYtCPlE4GxFgHhBwCpCmEnB0C5B-DC0D7BIxDoB7BC1C5BBsCpHgMHdzDWtCuD3BuB7DjB9E1B3CUxD_BpBB-B7FmD3FE9K5B_CvFDrDvCvHfsBjHItChFzDwElIyBnF1FvEZtC0IrDgHgCgGpD2CZwEhDoE-D4G1CoFuBkCjBqCuCkDEqFKsEqBkCrFiK",
  "50N7azFKbdjFlBjHnEN9CzBlCUrD3D5BAzC1BjB0CzFuD5DpB1CmELsCpDwFFkF2DNvJ8CVwDiBsFhKpBjCJrEDpFtCjDkBpCtBjC2CnF9D3G1BlDlDzBpG0DPyCrMoGnL6G5E8DxCmFgB4BpFoIjGwL9FuMxC8C9B0E7EiEtEwCgC6C_C-F-BsEgFgEYzC5BvBGpCyCQyCTyClDyDyCmBoE6DuFwHuC8GyG-BiEb4E0BSmE9CgC9C8CzB2DxG0EXwD0BoChB4DQ4E9C_DpG8BFkDpD",
  "_hN6HlBXlB2D3BgChClClMEE7D0DTFtCnBWxDhBAxE4CnCgBxDD3C5CjRjDqD7BGgEqG3E-C3DPnCiBvDzBzEY1DyG7C0B_B-ClE-CzBR1CuBhDkC5BfnFcxB2ClBDnGyDZ-BqCQHkDuBoCkDO0C-DsCoDpCwBmB0DrB2FqB2BfoFvCqDaiDgCNmB8BtB0DYemDF2EsE0CUCiCkBqFyD8C-DEQqB-EP8EkDuCuBiDgDmCL0B1BlBhC_DhBzBjDrC5B7BpCXtE1B1DmDLa7CsBrBQxCXpCIpBwBPwBlCiIU0DZsErFwCWwELyDYoChBjBrDrBjCPvEoBjE4B7BIrBlDjDoCrB2BlC8BnG",
  "tjPm2BXduBzDlB7B_BOZhDhC6BrBsDyB2BzBOjBiCjD4B3CNnBlCvCxBrBFTpBgDrD3BZbd9CJhB4DZhBhCMnBwCxCOzBW1CAFrBXgBMmBQqBHkBeYpBcAyCsCSoCnCDpBwCJUQ2BvBiDO2CyB6DoBkC8BuDLHTwDF4ChBiC7BsC3B",
  "9jQ67BrCRAxCqBbdXIjBPpBLlBrDsBnBqBWiBFsB3BwBtCoBlCaL6B1BkBO5BnBvBtB2B_BUboBC-Ba-B3BeuBmBeakE1BuBa-BPiBpB6BLwBqB0BrDsCxC-CzC",
  "7qQskCvBpB5BMhBqB9BQtBZjE2BdZlC-B9CyCrBiCzCgCjD6CWeiBdOO-BKasBeCFiDwBGqBBqB2B8BnBUYmBYkC2BEqBUBawBUGiBdoBJsBayBAmCacckCDPTJrBUpCtBjCVvCF3CKzBG5CfTR1COzBpBzBK1Bef",
  "1nQ49CjCEbblCZxBArBZnBKhBeTFZvBTCDpBjC1BlBXTX7BoBpB1BpBCvBFGhDdBZrB9BJhBgC7BQOyCbUpBO1CVHa7BgBrBoB5BQoB0BPmBQoB-C4B6CsCWHsBiB4BEUPeK-CR8CEgCWYYgCLwBL0BEoBS6CbgBD-BlB6BtBoCd0B1B",
  "tuRk6C6BPsBnB8BfIZ2CWqBNcTNxCVtBzDCnCUzCoBtDM5BsBIckCyBmBWLYwBM",
  "tgS86CG6BWuBbmBgDkFiIAEkCfMVsBpCuBpCiC6CAAyD6FA6FBB9EPhH8BAiCjBQe6BZ5CrC9C3BPnBQlBnBzBvBLMXlBVjCxBHblDiB7DE7CoBrDyC",
  "jtRqvDBeYIkBXoC6DmBCAdmBAB1BhB3CSdTnCMRXlDlBzBjBHnBjC7BAQiHC-E",
  "x7LwgBa3BpCrC_GrCtEd5BvB_EyBzEalBR6CzBHlEc9DqFRKpBtE3BX1CxCfzEtBnB9B7ENtDqD7BoG1BmCnCsBmDkDHsB3B8BnBkEQwEsBkCkBsDnCiBxDXvEMvCVrEsFzDahITvBmCvBQHqBYqCPyCrBsBZ8ClDM2B2DYuE8BqCsC6B0BkDgEiBFvB1DXiC5CBnD3CzDqC_E4COsBwE9BmCJ4E4HyCZ-CmC-BoCrEsEDiEtDIjCyFA2GUyD5C6EXwD-BCyB4HMwHEpF7BkC9CgFP4EhDgB_EoDEuCtB9E1DRnCkCrCvBjB7DfE9C1B1BoE3E",
  "rhL8LvBHvDS_B1B5ChB_BJVlBhDK7D-CN8CxBmDeqF4BmCtB8CjCea4CtBuBnDHnE4E2B2BD-C8DgBwBkBjCsCSoC-E2DkEpC8DhEGnDqCDsDhDuClCfzF3DzBKtBjBnD4CxEgCAavD6DtF",
  "30KuOzDqB9CTvCST5BgBnBRnBrDQ5DuFZwD_BA3CyEkBoDJuB4D0BgB0FwHnBWkBiFQ2G1BnDrFQpEuC1DhB1CR7CxBzC",
  "7iKga1D3F9BzErCrC_CNZ4BtBK9B1B1CoByB0CS8CiB2CtC2DPqEoDsFkCV0EvB0GnFgBxC",
  "2mBk1J-CzBgJjBlDpEXtE3BhB5CSGxBxEvDD7CgDgBkC3CH3B8BrClC7B0B7EsDXV3C1FvDpM2BjJ_BV5DnHZhH8CnCrBvL6CvCuCoD4DmBuMvGyGxEmDxJsCTyEiIsBwKzB9BkH8F1CyO8E8BkFuFoBelC8CD-CvCsE9CmDQuF7CuBR6BE",
  "22BuqIgEsCiBrFhC5E5CoBvBoEqBqC",
  "h3Odc3E9BhE7GxGvHtC5DtFlBnExDxCxCmDxCUxCPFqC6BwBX0CqD0ErB4CrC9C3D4CqB4BhB2FmCekB-DsCgENyCuDqBoEwCoGxDmBEyB1CoFb6BgBiDjC2CtB",
  "n-M2zDmDPkBnBzBxB1EAzDFL0CcekFB",
  "5kPyzDmERqDvBiB1BrED9BhBvDgBxDqCYsB0COuBF",
  "liQ-wEuFN8EB8FjCwCpC6FWoCtBoF7D-D5CiCC2DnBN3B0EJ2ExCXtBjEZlEJpEQ_IRmEuDvC0BhEOjC6BvByDvDH7F2B7BqBjIelCoBqCyBjGKtEnDzCDbvBjDVzCUoD8BsBqC6CsBmDmB4EUwBW",
  "-iGhrEpDUjCX_CiBxCC_D6C5Ee5BgEBmCzCWjH8G9B0DnBiBtCgFgHViCViCEwDiEuFkFoCQYmCyDwC2EaOpCmFE-CpBqBxBgDNoD_BA9HnBpEH1EgB7BVzDdT1BvExGhH",
  "-3FhqE5IzEzFzEhClE7BrCtDPhB9CV_B9DtBjFK_C4BzCYhDtBvB_C9C7BjD5CvETrBmCS6D1D-F1BeAoSkGIGoW2EG0JmCsCxCgEuC8BAwDuBkBPuC_EoBhB-BzDkH7G0CVClC6B_D6EdgE5C",
  "s8D56EBhXxFlDrDP7DmB5CQhB0CvC4B_CjDzE4EtCyErBiGxByEhC0JDuHZuDtCyCnDmFnDwHrB8DjFkGL6EiDmB2DiBiEF4D5CeOqZIsE_CkPbwLyCiFsBiEJwCtBAPvDtB7BA_DtCrCyCzJlC1EFFnWjGHAnS",
  "toD-0CzC8EjDoC4CmBiDsEwBoDkCgCkDRgDsBwDCgD7BkEzB6DzEkEnEK9DmBxDsC3BQtCH9BdJrDQPXrBDvEyB_CCxLI1BVhCGpDhBf6E2FDwBckBCqCuB2CpB2CD4CuBpB4BhCf9BAtCyB_BDrBvB5GF",
  "9nC4tCI-BPuCrC4BlByDJ-DkCkBgB2DgCEsE3BwDoBuCNeuBiZCsBsEhBa_C-a_CgbyJCiVzNiVzNwB9C8D3B-ChBC9D-GUAtOtDlEP5DxFfvIRpClChEH_DBxBoBtDd5FxClB9B7E5CZzBzCnBhDa1BvBdpE9ElFEhC1B1COzDzCdtBXf0C3BVjBEjB5B5EC3BeZR9B4BM8BZYpBTIiCoByBxC0CX4BrBsBnBEvBb_BZ3BrBzCQ3B0BhBGzBZfAJoC",
  "zqDojEqBiCwYAlBgJyBmD6FSFgQwUJCwJwXlPxJBgD_agD9aiBZrBrEhZBdtBtCOvDnBrE4B_BDf1DjCjBjEoE5D0EjE0B_C8BvDB_CrBjDSjC_BRqD4BkDY8FVmGXiDUkDzBgDnD2C",
  "6QknBjFXxBqEIsOnBoBFkDlCmC9B6BaqDkCWqB4CiDSqB8BkC6BoCC4EzDHhCuB3DnBvCW1BhD7D9B7BlB9DG_DLhK",
  "68C8uEyB1JqCzBE_ByCjCpB1CtC1MJjI_H9F1ClI0CpCBhEiEDT9C5BLF_BjBDnE8GvBI7EvD5E6BrDM5Bb1DG1D1ClDDxHmD9CvBlDEpCqCpGsC1GXzBrBbxD5BxCNxF3E0DnCBjC5BGqEnHsBFiDvDiEZ6COiDiEIqCmCwISyFgBQ6DuDmEAuO6I4CiSqMuV8L8J1CwDtDuEqC",
  "6QknBMiKFgEmB-D-B8BiD8DV2BoBwCtB4DIiCOyF6ByCcyD0BsB2GYqGrCqCpCmDD-CwByHlDmDE2D2C2DF6BcsDL6E5B8EwDwBHoE7GkBEwCtCVlBJhCpF5EzB_DbnDpBrBpBrEpDxCflDrBvCRzCpEjCvD0CrCD3D1D5BB9C_FzBtEvGnCrCKrCrB_EErD-DhCwErEkE3EBvFA",
  "06CswCuC_DOjEHlEuD1FvDC3BN7CUrB9C2DzD4ChBczCgCpEf1BjDpGvBjBP7EUzCP7B-CnDSnCqClD6ChCK5CU5BNrD9EuBhF2B7HIZK1DZ5Dc9CNlKEe-EvCkE5CiBpB6CxBeC2B0BuE-CgG6BC4D2DsCEwDzCqEkCS0CsBwCgBmDqDyCqBsEqBsBcoD0BgEqF6EKiCWmBvCuCGgC6BM",
  "0F4kCZpD-B5BmClCGjDoBnBHrOyBpEhFpBrBmC1B-DPkDsB0FxBqCR-EAwEzCoDO-BwFD",
  "E8kCN9B0CnDAvES9EyBpCrBzFQjD2B9DsBlC5J1DtDjCzF5BzF4BKwC1CsF0BiH0CoF1B8IZ4EEwD8KK4CNgCgB8CP",
  "lyB6_BaS4Bd6EBkB6BkBD4BWgBzCuBY0Ce6CrBiBhC6CpBmCyB-CIoEzB2B7IzCnFzBhH2CrFJvC5CBrEoB_DBrHjBrE3BlGpClBEOmFUYFwCzC0C_BM5B4BqB4CTiDK6BgBAM2CPoBUcqCYxBgFtByCQkCoBQ",
  "z1C2uCgDBwExBsBEQYsDPeKKnCgBA0BaiBF4BzB0CP4BsBgCawBcoBDsBrBY3ByCzCnBxBHhCqBUaXL7B-B3BnBPPjCuBxCyB_EpCXTbQnBL1CfA3BEpBvC3BAlBsBMwCzC6DzBVpBD3BLEqCf0BG6BrB0C3BoC_EAtBlB3BDhBrBV3BrD3C3C2DrCwCzBaxBmBV6CdsB5BgB4CiD-BD0BiBsBAgBaRiCWWEkC",
  "noDstCqDiBiCF2BWyLHDjCVVShCfZrBAzBhB9BE3ChDpD0C1CMrB6BAe7BqBNqB",
  "30BiwBJ5BUhDpB3C6B3BgCL0CzCGvCTXNlFzBAtG-C1F4ErFuDlEiEwBgCK6B6CsD-C-CqBE0BW0C5DLvCmBrB4BAqBwC4BD",
  "5yC03BsD4CW4BiBsB4BEuBmBgFA4BnCsBzCF5BgBzBDpC4BM9C9C5CrDJ5BvB_B1BOvEwCnDsDhBoCZ0E",
  "3hB6gCN0D2B2CDiC-EmFeqE2BwBiDZ0CoBa0B8E6CmB-B6FyCuDeyBnBgECNhDa5CwDhEGhDoHrBFpEpB7BhDRpB3CjCVvFE7CQ_Bf3CO7KJDvDa3EnE0B9CHlCxB5CqBhBiC5CsB",
  "irF2gBhCT_DE1EWpCRdvB_BFvCqB9GjD7CUbP5B3D1EmBxEU_DqCjFkCrD_BtClDRrE_DMnEiB1DpDpD5FT6BJ6C5CiCpCmDRoC9CoDQ8BT0CQ8EwBkBkDqGmFQkByBiBDyBrB6HsC2CuCoDmCTmC4BSiGL8F-CwE6GmDwC-DiBY1CyD7DCxChBxCO_BmC3B4E3CsDvCChCoEnDyC1C0B3D0EvCgB_B",
  "qzD8VL3D7BpDlB9DZvFMxDhBlCDnCX_BhEhD7ClD3ChGIlFzB_BzD_C1D9DpCkBN4BrDCjCrCzBUrCkC7BhBxC1CjF0G6EuDrCkEkC0BoEYQ4CqD_CwFH-B-CamEV8E_C2D4CoHxBoB1ER3BoDQ4C8HHiF1B-EtBOsDqD6F2DqDoEhBgEL",
  "wmCkO-CO6Db2DaaJP3C4BnD2ESyBnB3CnHgD1DW7EZlE9B9CvFIpDgDP3CnEXjCzBsCjE5EtDrGqGjEmF5DuGGiCsBgCwByEoB0EkCMkJBBwH",
  "q8BoOmKDCvHjJCjCLjBekCgH",
  "kgGj0B0CxBwChB-DhByD7B-C5C0BpFhB1BpBhFoBlF_BjC7B5FoDzB9SlFStE1EZxDvCXlCnCPtFjFvDhEhCDhCW_GWjBQAQvCuBhEKhFrBjE8DlEkFI8TiNBRkCesCjB-CYgDV-BmCDK9B-CEgERiC5CgFb6D-BuBnD6EboC1CyCtD6EBP4G3BjBrEuC1BkBaoGiBsHrB6C4B-D2BYuIiBuCT",
  "4sG15BkGlBoB1BkC9C4BvI3B3E4BjImCCoC_B0CvEQhI1CpB9BpEhE8DNsEqB-CLwCvCyB1BRzDgDnD0B8B6FgCkCnBmFqBiFiB2BzBqF9C6C",
  "g4G_nC2EQwH3B2BaqEEoC8B4DD6GuCgF0DgB5CHlGYvFI3JkBhD7BvEtCpE_D7D1FrChHhDhH1GrCjBrEtExCtBRvEgD1EmB1DE7BiBKFjGf9CwBhBdxCzCnCjFjCxHrD3CpCSzC0BNRnD3ECP4Cd6CRoCkB-GzBuE_C6IyGiH2BwEeUW0Df8BI2EoBqEA-HnDgC_COpByB9CqBlFDNqCRuE-SmF0D_C2BSwCxBMvCpB9COrEiE7D-BqE2CqBPiIzCwEnCgClCB3BkI4B4E",
  "uoGhnFnB5C1DV1DuDBkC2BsCS6B6BOmDjBe5CQ3C",
  "oxC7dpCpBfzBF1CzBV1B2EyC2C8BiBsCjC",
  "gtCjmB0Ca4BBoCYuSDwBzE6B3DuBhCsCnDkEQiCcwDbeyByB0D8DIKkBmDARnC0HCE9DoBtCd3DQ5DiCpCJtHwBS4CF8De6CLW9BX_CkB9CdrCSjChNCH7TmEjFkE7DvLxCjPcrEgDpZHdN3D6ChEG1DhBhDlBR-DcwFkC2FM2CgC0FwByCyDkEgC4CW0EJyD7BoC1B4DvB4DKqB-BwC9BgGnBmEjDgESmB",
  "u-FhPMvCqBrBChCvBpBtCnDpCnCxCJLyHzB6C6DP-ByDqDL",
  "o_GusGhB_BpCcpBjE0BXzBZH1B-CcEtCjD_JT0BtDkJ6BiCNM0B8CqB4EcyBGCiCASiB2BEExCbdEB",
  "8_GgwG1BDRhBhCAmCkFkDsEEG6CJgBtCrDrCxBrD",
  "01J9tC2B1CyBjEgBvH0B9CT_CjB5BjC2DlB7BmBzER1C1BtBLnFvCpHhDzI7D5LrC1I5CnHjFvBtFzCzDyB9EoC3BqDLyFlC-ETwEkBwE8CkBCiC-C4ES-DtBgDlB-DP4FmCwDc-DiDIwDqBqCkB4CCyDyDmF8D8BkDb2C0CXwDqEC4DiC6CmC1C",
  "o9G6kG9CbI2B0BazBYqBkEqCbA5Dd5B",
  "toD-0C6GGsBwBgCEuCxB-BAiCgBqB3B3CtB1CE1CqBpCtBjBBvBb1FEa4C",
  "o7Bu9FzCmL7DyCBwBjF2DR4E8DwDwBkFf-FoBoD6GwCsEXFlDqFqCOlBjDhDB7CmCxBZtFjEjDmBrDoDDyB_CsCdL5EhD5B7B_BpErCWzCRzChDtB",
  "n2BorFCmBAOAsHiK0EoGekF2BsCkDqHwCI0E0DQ6CqCmIiBmBuC1BqBjC0GL6DrCgEgGsD4GkB-DyCiG-ByKiBsKSkDd8FuC2GCyCtBoEMnBnDgB9FvBjF7DvDS3EkF1DCvB8DxC0ClLiCxFK7CjBjFQ5CZtDS9DvCzC2DvEI1CmCvD-CkB-E7C4C9DtV7LhSpM5I3C9GTB-D9CiB7D4BvB-ChV0NhV0NvXmP",
  "m-GuqGiBgC-GvCoM2GyCzHnBdvMjDoGnGhChBhBjC3EZvBnC1C9B9GgBHckDgKDuCe6BA6D",
  "siKy3EkBIG1B-EgBkFF6DFoEoE2EgE-D8DmBlCc9ElDARhEkBb5CnBAxC7BxCDvCnBpB5SkDrCqGHwB",
  "y9J26ENyE2BqD4BU8B9BEzDrB1D3BN7BmB",
  "6rJs7FqB5CRrBiC3EtEDxB-CxFUyEgGmEP",
  "g1HgpGxC0H8NwGqCyHRyEuDyBmD8D2CgBoHZmCzBgDiBiEtHkE7BO1DjDjCtB7EqE9F0HtDoD3EfxE-BCCrDwDnD3DKlEQxE_FzLQzRyMpJsEvH2B",
  "i5K-tEEwC8ByCAyC6CoBjBcSiEmDA6CnEuDnC0EZ2DjB6CzD2BhCoCZArBpC3Df3BzC_BpCnE7CKnBvBfjDYlETZ7CC7DrCT_CtBpB7DAtCxBAvC_C3BtDSlEhC7CLhCsE7EqK4SoGmEwM7CuE",
  "0_K2gFlBmC6BkCaRTxCZlB",
  "k1gBpjD8DzD_BZjC4CI2B",
  "uygB9hDb4BD4EgD7BgBhF1BapBL",
  "khUmsCtBwHgEoFiImB8FdkFtC8CqEwFpCuBjEXvHvK5E4C5DxGNtFvClFcxCoDlDwG",
  "0xUm5C7FehIlB_DnFuBvHxF8CrFDe8EvFAP7GrDjJhCxFOvEiEFyC1FkBtFwDxD4DXoDnDhCxCjEXNmDjF4ChBjBvCuChBiDpDyDhD-Cf1DlBwDW8D6BgGiDuGuD6FtC2FC-CVwDlE-EvBkDmCmBoCuFxCkE9DyE_CwF0CkB6C4GuEI0D4C0DuB2C9BM3DmEJvBxGEzFyG4D8BjB2DGoBmC4EN4EhFMlGiFtFJpF_B5C",
  "k_U44CvFqC7CpEjFuCgC6CKqFhFuFLmG3EiF3EOnBlC1DF7BkBxG3DD0FwByGlEKL4D1C-BqBqCqFiESvBqDFdmHoDc0D7E6C1F4HBsCtF_D1B3BlCuH3DoFrH-DxF2EpEyBtEjBnG",
  "4xT0_DzDtBzD3CtEH5C3GzCjBgDvF-DxEyCjEnCtFlClBwBjDmE9EWvDB9CuC1FtD5FhDtGR2E8B4EhC2DQ6GxCoD_BwHjB8H3CmFhEjDjHvEvDS7DwBkC4HpB6F7EoHYoCzDatEiFNiFmCfEwEkDwBV0CuBkCIwG8EtB4CmFKgDwDoFHyDkIqEuEjBP8DmCkBNsC0DQkC1D2CvBG5EHjF9FnFXrH0GgBwB3F-DlB5BlF0ErC4CjByE6BGxCpFhEpBpC",
  "isUyhCuFwCyGO3C6DwK6EYwHtBkEkBoGxBuE1EqE9DyFnFsHtH4D4BmCgE2BrCuF3HC5C2FzD8EsDyB-EBkGYqFqDgDpC4FlBfxD-CxCqGzBpIpFnF9FrBpE6EzG6FjI2F7D6D_E8CxLb_KlFjElHhEhFlF5H5FnCgE4BoE1EyD",
  "wwZgpIcjBrCM1CjC7BjCIvEnDrBjBhBrC7BjEf3C1BF3CVVuCfyD3CbvB1CNtEHtC7C3CINR_CmBXlB5BPHmBzBS1BgB4B4CuBYRkB0BsDNgBzDW9C2BiFgE8GsDqEuE-C_BuFFfoD2J2CuCyDiE1D",
  "y0Y-rHOS4CHuC8CuEI2COcwBsFrHyBhEClHrCtDzFlB_ExCzFRXsDmB2E3CyG0EgBpEsF",
  "ukRk0J0GiB8LsFwJ-CuF7ByGDmE9CmGFiJxBiGqEvC2DuGwGgHzC2FVsHzBmB1E8IzC8FmB-HaoGbkG_C6DlD4FC8Hf4FyBoIgBkJuE4DVqDhCuHQhD3ErElGyBxCyDYmGd4EqCiF_B0FrEVnC9EYhJbrE3BxEjExJtCnGpDrGoBxDSnD_DgCtCgBhCrEhCvErDpHlCrJHhKlCpHpD3C-BxHAnJ4DjGepIb9MuB7GD1D2D5C4F7DWxH-DtIcrHiBnC2CsCqHpEgF9IsCnFqDzBsE",
  "qgT0wFOrClCjBQ7DtEkBjIpEIxDvDnFJ_C3ClF7EuBHvGtBjCWzCjDvBnD-J3BBf9DtDmD-ByD6CM8CqFzDiB5FD9FcRsE9CI_E4ClCnEwEpD7DpCtBpC8D1BhB3DmC1EejFbpCnEC1HnBK3EpD1D_IlE_GrH1E9DnGhEA7CjDxBzFnC9CJ5B3EoBjIMlF1C9FAzKnDJ5C3E8BhC1F5BjCnEvC3B9F6F7C4IrCqGlC-CrDgGvB6HjB-D1FyIxCkM7BgIAyHlB8FhJ3DtEYlIyHgDoC5BuCpHqFkEmE4NAnBsFvDkDV6EjE6C-GyGoHPwGyG-DsGiGoGBuEqF0DhFiDlCoElCwFiD2CwJxB-GeiGoF2GpHThFwCnDFlDvEc4B7GkG_D2IrE9D5CtC7FiGpC8FhDkIxD0IZyDjD6ETyHtBmFCWwCZgEQ2C6DqBQ9EGnB0FrC-DgBqFNiFGO6DvCgCgFa2F0EoHgEmFxBwE0C-C7DjCzC4Gd",
  "mjS4pEDvElCgBOhF5BoDJmDnBgDxC2D3FISzC_BtDzCoBdjB3BWtCSdkFlC2EiB4D7D2BuBqC8DqCvEqDmCoEgF3C-CHSrE-Fb6FE0DhB7CpF5CL9BxDuDlDgB-D4BCoD9J",
  "k9RytFwC_BN5DhFFpFO9DfzFsCFoBmE0EsD0BuEvBqDD4C1B",
  "4mRouFP1Ca_DVvClFBxHuB5EUxDkDzIajIyD7FiDhGqCuC8F-D6C0CwBgF7BqGjEwDbiC_C8EnBiF3CiHtBqHR",
  "wmP69GhGnF9GdvJyBhD1CmCvFmCnEiFhDpFzDCtEhGnG9DrGvGxGnHQ9GxGkE5CW5EwDjDoBrF3NAjElEzEyB5BwE7E6EvLlBjKD5IbqCoHiJoDR8C9CgBFwF_F4CvC4DjDqDwKlDoGe4DZoBsBsERkI0CGqFwDwD0EAW4B6EaqCRuC4BL4D2C6D-DyBtCkE-FF4BoCHsCiD0CVkDvB0C2D4C2GqBmHYmDkB0DW0E7C6B5EqKxC",
  "4_MwpHwDA2ErB-BXwEgCkClBgC8C4DDeeWwC2CmCsDtBV9B8BHRnFuChCmCqB6CU8D6CqEPuGAkB5BzDVlDjBlHX1GpB1D3CwBzCWjDhDzCIrC3BnC9FGuCjE9DxB1C5DM3DtC3BpCS5EZV3BzEAvDvDFpFjIzCrESnBrB3DanGdvKmD2F2FPgE3EiBP-D_BgF0CuD1Ce2BwEyC6HsGrC2EaqB8C-EeyD8BoBgFoFoBgBmC-C1B8BF",
  "-nNkoHwDsGpB0EzEwB0B4CoFJ-CwDgCgEsIuBpB7Cc3ByCEnC7B5GgBTxD6GO2H_B8LeyB3FiCU4DtBFtCexDtGApEQ7D5C5CTlCpBtCiCSoF7BIW-BrDuB1ClCVvCdd3DE_B7CjCmBvE_B9BY",
  "w7NmoIuB2CiEeqKlCgB2DwDqB-IzCoCWsKFoJTkDnC8DdbtB7JrDlCtChIXpC_DzGapElB_F_CctB3BtB7Ld1HgC5GNUyD6GfoC8B4ERiIwEtHoDtExBzEsCoFiE7BU",
  "koKklI4CkCkHoBoE3BsE7EmDKiHChBmDsFkCoF0DuIpDU9EuCpB4GKiClBiDtGmHpEiE9CyGhDqI1CF5D7BG9C2BflCnFnBnB_ExD7B9EdpB7C1EZrGsCRoFzEIlHwF9EW9GmDtES3CjBlEEtExDvFlBjBuEcwG7EkC0BqElEKuBqF8FxBwFgCxE4D5ByD_ExBVxE9BgE",
  "yvJi7FvDoDBsD9BBgByEnD4EzHuDpE-FuB8EkDkCN2DjE8BhEuHrDgFmB-B9BmHoE4BgBpCmD9CoEZqCGsH0EqCO8B5BlCjD8DnDyBKgCzE-FpBqEjD8IhB6J2BSuBwFmBuEyDmED4CkBuER-GlD-EVmHvF0EHSnFxC5H1BvE2CdzCtDgC_EQ9D4EhBQ_D1F1FkDpDwC3DgG3CGvF-CfS7ChJnDpCnH3L8B5GuBhHa1C2H_CiB5EjBnG_C1HiCpG6E_F6BlE8FxEsIrDf_DiCpCtC",
  "o_GusGDCceDyCyBsDsDsCfuC5CKR6EwByC2BsB2BsBKwDiCnB8G4BqDlBkFCmHqCsDDkHgBlD7DtDxBSxEpCxH7NvGnM1G9GwC",
  "2iJqyHpCFvC0DAe3CA7B2BpBFtC8BzEwBSiDhBmC2IgBqBzBsCjBnBxBqDjC3B_B0C1B6ChBGpE",
  "-kC8vL4CyDmFqEiCqH_DmDLqIiE8FmGDmCwCnCkC2J4IoG-GkEuEgGA0BwD6LfekE8DIqIhD4JnEGzJiCtC3K5BhGpEgB7D9J_EhMrFxE5IuErEgGvD3FhHvGtBrCvKxD7FxHUxD9EnHJ9B-FnFiH3E8I",
  "kwFi_KyGxBcxBqDYiGvBU9CpB1B8DhEyClBLjBoEhB4B1BtCrB_EIlBTuBhCyB_DrFL9BrBLjDvCU1FJzBuBpChBrCc9EE9GwBpGQ7EDrD1B_CHD4C9B-C4DoBAwC1BsCJ4CiGA6GqCuByDkFgCT6C6DgB4GuC",
  "2mG0lKqCHyBuB-BJuGUgExDxBnBQ9BgFJoC3CDlB-HlC4Ee8D7C0DCoJhCC5BxCpDuBtDfhChGNlD3BH5C9EPlE_B7FJrFrCKpDdGZoB_BItEqBzBxBbW3JyBLsC5FZpCtD7EzE5CiB9Cf5CmB0BWiBkC2BgCNkBqBQUb2DF0BOjBWOclC0Bb0CpCgBOkC5C2BxCIzE-BjETvBdzCAxBtBzETjCd9CwB_DC7DW1CrBN2BtD2BmByC4B0BsBLzB6C2FmFiDWW6BjDuFgDIsD2B8EEqGP-GvB-EDsCbqCiB0BtB2FKwCTMkD-BsBsFM",
  "4yE-wKK3C2BrCAvC3DnB-B9CE3CkDtFV5BhDV1FlF0B5CrBM9FsCvEb9CU1DpBlDmCxCZLM7CiDzEMT-BnEWdxBrDoBM4B1EQ9CiCxCgEQkCxBqDpCoC4B2BtBmDoE6B4J8C8HkCoGhBQvBgGB2HXwLEmDVwB9B",
  "kqD4sJPxCvDAmBpBhChElBhBtFDlDtBjFQ9I0BtBmClGjBVlB5DclDG5CkBeyBHkB-BKkD3Bc2ByFJuEkBgDF-BnBUiBdiEoCaoC8C0E_BwDwCmCQ8E9B-CM8ClBPZUlC",
  "iqE0uJuD1BO1B5DpB9CnE5DlE_ElB7DI5EzBpCdlFmB1E2C_BYlBkChBCiCiElBqBwDAQyCmDxBqCVoFYQoBuCGiDgBWN-CauBuBiCM2G7BsBU",
  "smFstJwBekEU0E9ByCH6C1BNjCqCfczCmCzBNbkBVzBN1DGTcpBPOjB1B_BhBjCzBVjB6CW2CF4CzD4D_B0C9B6B7BU",
  "uwFq8I6ClB-CgB6ChBGxBhDrB7BS3BvH1DUxEqCpHvBjDxBlJK5EgBtCP3ByClBkBwBiBxBY9BrB1D6BPyC5DwBV-BrDwCgFmB6DmE-CoE6DqB2CsB8DVgEB-CvBkCe0EUyBuB0CA8BT-B5BgCzC0D3DG3CV1CkB5C",
  "ylF07KU5CjF_BtBxD5GpChGAvB-BlDWPyBW4B3CgBxGiBpBoFkH-BwKNkGUcpBqDLgG_C",
  "yqFmnLgDtBS_CgC1D3GtC5Df_FgDpDMbqBjGTvKOjH9BG2EiD-D8FkCgFzEgFEmB4EqFkB4CXsFpCmFB",
  "8uF4zLejBtEzD8B5F1C_BlFCrFqC3CYpFjBY2DpCX9DmCR0D8H4B8Hc6GfuGG",
  "o4CgwKuBlD3B1BqCnCyBpDPjCyC_D5CVzBYxBlBvEnBpCxBxEpBkB7BUzCmDvByD1CnC7CnCZehEThB9BoB_CGtEjBxFKb1BjD4B9BJ1G8BnBrBpFCYuEmDqE_IkB9C0BK4CnBuBYmEhByG4DAyBsCyB2FjBkCmBqBoFMkBrBoEiDtBsCHwD2EZgEeErCqGvBBlCsGmBwD2BiHtC-C_B",
  "0tEu0I4BxCuCQ6EfmJJkDyBqHwByEpC2DTnDzCpCtEiCxDrFarG9BBjD1FTtEmC_E1BzEGNkEjDgCiBcVYgBgCuC-BhD2CRqCyBsB",
  "qkF08GZ7B_IPEgB1HoBmB2CuDjC8EK0ENDhBsDY",
  "uvEsiI0EFgF2BuElC2FUCkDgD1B9B7DtBX5DGnDUzHzBsExDlDfvDApDoDjBrBsB3DkD9CrCrBwD7CkD5BCvD3F0B6BlD_DTsCxFjEBjF2CpCgFjBmEtC8ClDyDN4B-CiDKiCiCcE0BiESuCsBsDDgBiBmBI",
  "63IqoH_ChBlC0BnHa1CfjHfrDElHpCjFBpDmB7G3BhCoBJvD1BrB1BrBpC6CsCsC5DPnFuBnEzDvJVhFqD3GItBzCpEXhGsD5GD1DmGxEwDgD8E9D-C-GgG0JI0C4E-LZwHiEoH4BsKE8KrEgJtCoHesFRsHqD2GIgGhDiBlCRhD0EvBuC7BnE3B-BlHlB9BsD_E",
  "ojFulIsG-BsFZYtCuF_BjBxBtHJ1C9BlFrD_B-CEoBuBY-B8D_C2B",
  "sjEo_HDzBhCbJhC9ChDhBODuBtDiCRgDQoEc-BhBgBNgC4CiDMlB2BSqB1BwBTOnCZjCe1CyCxB",
  "wnD0iJgCX2E1CmFlBqCewBtCgC3BrCrC7CsBpEBrFgB9CDpBpBnCuBpBxCiD9CsB9B8CpCsCrBqCzCyFrCVhB7FqCzDoC1F8BpFyEqBQ7C0CDkC_De9B1C5BkCEkCIEqEFmBgBkCfuCDB4BmCUUyC-E0B",
  "-7BipJIjBdxB6CjBmDFPxC3ChBzEapBvC_CFhBevDjChDH1CqBjC4C_CfE8CyEwDFyB6CR4BiBqFBoBsB2G7B",
  "4lBq5JoBtBJ3C5BDtBSWwD0BI",
  "wmBw9JXlEzBHVvDtF8ClDPrE-C9CwC7CEdmCgFoBCABA0EP4FqBgE3CuDvB",
  "mrBouKkBjCxB1FxBrC3DAiBxGtDwB_D4C3FpBzEQCAmD2BwFmJwI0CoFF",
  "t4B4lIoCyByCeyBhD2DAiBa0DH4BjD7C1BB7EhBdH9C1CPwC3D1BjEkC5Bb3BpCpCShCxCzBnDcnDVe8ER8D5CSvBsCQiEwCqCOwCqB4DD0CnBoCHkC",
  "xuB8nHRiCqCqCc4BjC6B2BkEvC4D2CQI-CiBeC8E8C2B3BkDzDIhBZ1DAxBiDxCdnCxBKuExC4C6IwE2HjBsIA0GhBmFMkKHwCtCwL5CoCsBiH7CoHaKzD9FjE_HrBRhC5DvDtChFuCxDzD5CpBhE3EnBtE5E9HB9FE9DnCrCpChDQpCkC3ByD5FgB",
  "3mB2wKiBvE3ExFhL1D7IeiFwGnDsGwI8E4E-CoBpDnBrD8DC2EnB",
  "ksgB3jEkF7DoD7CrCvBtD2BvE6C_DqDjEuEbiC2CBwDjC4CjCgC3B",
  "o1fvhC4BlCrECrC8D4DxBoBF",
  "wyf_7BdjBzEsFpB4DkCAoC_EwC_C",
  "qtf19BtCF5DWpBeMwCkEfiCpBgBzB",
  "4lfjyBwB_BInB9E2CrDoCrCiCeU8CvBkF7C",
  "k2e7rBwChCnBJ3CsBxCyCKiB4DzC",
  "yxiBt6HrCpDjDpE5EvChB0BzCe0DkFhCuD3GwCGoCwEmCiB6EHiExCmEGkB_CyC9EwFxCuEqCQsDvD8EzB4BxFyExGEoE6C1Be3EgF_BoEPyDsCmDXxBvF7B1D3EE1B7BS1CblB",
  "ukhBnwIqFqD6DoD4C0EsC0BeuDsE-CsB1CuBxCuEwC6BzCAzCpC7CjEzElDvCqC_C5EDrFpCzBjExDpG9E5CjD3B3FEhEiC3GOhBqCsD0E6HmGiEkBwEsC",
  "i7ch_H4DNOrHjClCV_ElC2BpEpEpBK5DG7DsFZkEzDuFE8CkERgGlCuDc8EmB",
  "u0YrpGzGlDtFtBlBnDpCxCpFD9DRvFkBvEVpEJ1DpD5BKjD5BhD9BvEGlEA1GgEpDmBE0DkDagBuBFoCYqEV4DpDqGfyDIyDvCiED6B5CwCX-ExD-Eb0C4C1CjC6FkD5B6BtCBmDjD-ERgCvB8BWyDqByBakDT0DyCwEQ3E0CqEiFiCiD2C4EqC8CQ2BZ-EsC6DWesB0BSwDFyG8BsD4C0BqD0DmDKwCEuDsEoF0CrF2CoBnC-CgCiD4CrBY4EuDiDwBwCkDiBE4B4CXCyB4CeiDayE7CwD1D-DB-DRpBuDgDgF6C0BfyB4CyD4DoCoDXoFmBDmDzEiCsDckExBqDxCoFxB6BU8D9B0D6BsCRuBmB8ChDzBrDrCvClCFYvC7BjDlCjDO3BgFtD6E_BmDlCwE1D6BAoDxBe9BgGjCkEkCmBsDoB4CauD8BgFbgDQ6BXyDa4EmBoBdiCwBqDmBuDE6BsCqC4BhDO7DyBZIzCoCjDQxDHnCoC9EgEsCiCzCgDtCT5CsBrFehDyBZ2BpFTnDiCnE4GnDuE_CmE1CZvByD9DuC3GwCsBwC3CyBgBiBzGuE7D8CrC-EhF4B_EExDN7DgDpFLxFhB7C1BxFExDnBvE3C1FzEhDpC7EhChD7BrFrCjDxB1EZpEK_BzDjC_GH3FxC7CtC3D1ClF6C5DiBeoDrDlBvFvErF2BxDgBxDOhG6BhE8DjB4EvBkDhDyC_FYiCgDvB2EhDrExFjBoDuDe0DuCiDP0EhFpF9DjCrC_E7EyCGqD9DyEnDqCkBuB_H6DrEG_FgDlLRjInCjHhC9FM",
  "m_PgvBdvGzC3BtFtB_C-EhBgJ6CkKqEtD8CtEiDvG",
  "osV4xDjF-BFsFiD6C6G4B0DDsBrC3C3CtBzDrF_C",
  "01P2oIPyDqE0BzF8KsMwCmDsBwEmLsMhCwD6CKqGmFS4EkEuCS0BrEoFpD-IrCqE_ErCpHoC1CsHhBuIbyH9D8DV6C3F2D1D8GE-MtBqIckGdoJ3DyHA4C9BqHqDiKmCsJIqHmCwEsDsEiCfiC_BuCoDgEyDRsGnBoGqDyJuCyEkEsE4BiJc-EXWoCzFsEhFgC3EpClGexDXxByCsEmGiD4EwHrC6I-DB4C0F0GwDgCBwDtDuBkFkD6HkBoIGsJ7BwFpC6DpGsC1CmC5DqCjG8K_BsHtEyC7FwJAsFuCsK8BpDzFtCpCjC5GlEjGzHkBpFlC0BrFdrHlDFCjDhE2DtCxD1J1CgBnDtFG9CgCpEtE7GrDhF_D3I5BzE9C3G1BsD8CpBuC-EmEpDqDtFnChHpE7DhEjGJlD7CqDnEkFfG5C-E5BgHuEyFtCiEFgBnD7I3B7CrDjGjDlDrE4GtDuCjG6D3FoE5EDzE9D1BwBrD2D9BdhFzB9EtDRxE5GhFlI5FtHzI5F1InFhHV5D5CjCiCxDjD3IjDxGdlCzGtDLzByEuBuCrIgC9ChBpG0B9CyCgByD3FmB_CqCpFpDjGX9ECrDxBnDbelHpDGRwBFyCxE5B3CkBzEsC6BmF9DmBvB4FzGfYsH-FoFIkFF6E1CwBjC2DzDP3GekC0C9C8DvEzClFyBnH_D1FzE_EZ3C2BpDEtEwBrDzBlEzEP-E5DpBpHShHuBhF4C7EoBhCgDvDcpGkE_E8BzCvB1IsEjGgE3B8GwEbGmDvCoDUiF1GqHpKyC5B6EzE8CjB6BdyDGuC3DuBhCTxB4F4BuBbuBgGgDqEmB0GZqCgEiIYmCuC8JsDcuB",
  "k5Xu4E3D_J1CjFpDoFV2E0DkGiF4E6C7BhB5D",
  "ohCilJ6DbWmBmGkBuBlC-IzBVhDwB1C_EehFnCKhDX5BiClD8FjDkDlF-G_E-EAwBrB3BnB0FnCyE7BsFnDUlBlBnCtD-CtFgBzC_DwErCXnDxCLrDpFzCPC8BoBsDsBqBtC0D9BmDxCY7B2C_DmB1CwCzEM7E6C3FkEnEyD9BmGjDYhFiC7CbzD7CxCPW4CrDYzB8EmC8B7BsCI4B2CpBiDIwDkCiBdgDGqBwC0EZ4CiBQyC",
  "o8CsuH4ESnC9Ee9BpBlD3EsClDU3ImDcoDqHTsGW",
  "u2B0_HkD-B4DtEbnI7CMvChCrC0BHyHtByDuDJ",
  "g-B03K_Dd1EaxCwDFsGiB2B4B8BwFMoC4BgF4BFlD7BhCY3BsDdvBrC7BWvEvE2BhD",
  "qtC2-KgCjD3DhFxGwDb0CmJiC",
  "3mB2wK1EoB7DBoBsDnBqDoFI2G7DrDnE",
  "pT4tKc2DjE6DDExHiBvB2BoC6ChC2BrD9CJiGlDmDoCuG8EiFgFPwHSzG5GqGc8GBzBhFzFzFuGLQV0FrHoEf6DhH6BvCyHlBX_DlD5BwCnDzFnDrIAzK1B9CoBjE9C3FWtErCpDoBmJyG0FsBBA3JgB5BwCyG-BtDsDmBkEqJT",
  "16Cs_MtBhEiHnEjI5E_RnEtFjBlIctRgCkG4CzNiDkLmBJ8BjNuBoEiEwJe2JnEwJuD8H5BmKsDsKN",
  "giJ0lI6BFoE5D6CNiB0B2DwCqDpDmDtE8CH-B1BjFPhB7EjBlCnCtBEjDxBJ7DoDmCkD7B6BpCNrHzEFqE5CiBzC2B4BgCpDkCoByBrCkBpB0ByBgB0E5BsDLcYhDsDyBc",
  "sgJkyHnEalD-CfqCqBG8B1B4CAAdwCzD",
  "45HuvIYYoFhBmJfyI_CiBlB6DgB6FpB-BxC8DtBxBbiDrDbXrDMzE6BxBf1If_FiD1GHe0CxBqExDoCvDYnC8B",
  "mzXsvClD6EsFHmCnC1BrF1CiD",
  "m-Xs-ByB4BW8DuDMflE0EgGT9FnChC9B9D9B7B7DqEqB2B",
  "81Yy0BUjEMvDjC3FpCsG9CjDgCzE3B9CrH0D3ByE8B-C9D-C9BxC9CIzEvDhB6BuCoF-D6BuDqCmC5C4E2BgB6CuEGL6EiF9CSlDOpC",
  "0kXo6BpI9FiDsEyE6D4DsEoDmGkBjFjEtDpDnE",
  "08X8xDhBxCmCvE1BlF1DhCdhFsB9EqDV4CY6HvDRrDgCvBT7C7EiDpCoDzBnC_D2DzFbjDsBKyC-B0B7BuBZnChDyDd4CH-FyChCU6JiC2F4DB8D3B-B0BSzB",
  "46XsnCf-C4D9BgEADxC7C1C_D7BF-COmD",
  "swYgsC4B9G5E0BEhCyB7D_CtBHuE7BKf6D2DPBqC5D6EgGD2BrC",
  "yxTsoBiBkBkF3COlDkEYiCyCuBR2D5D0CjEMnEV5CUlCO1DmC1BwCxFDjCtEL9F0ErH-EXmDxDmEbmFnCsDWyErB0C",
  "4gX8ZrFiBlHAlCjHtClClD1IhFpB9F4B_CRzDlD_DQhEpBnEyDhBmE0ElC6EmBoBqF2CmBwHqBuE-EiDgE8CnDqBkCgDFMgEIiD6EqEmD8EwCCmDlDK1CkE3BmF7BNtClEJkBhDzEjC",
  "yxWiiBHhDL_D_CGpBjC7CoDwCqCqFuD",
  "q2C2iJkFPmDuBuFEmBiBiBBmBjC9EzBTxClCTC3BtCEjCgBlBfpEGsBSvB2CWiD",
  "2yF0vNbrEyJjE5F3EqHhHnErF0F1EvChEoJnErClD5FzDrN_HpLP_KnClKpBzDsDhGiCsBmG_C0FgD0D0F-DqO4GmEqBV0C1IgDhCuCF0J3JoEpIiD2D0BgHpDkIK4GvB-F4CiD0E2JiCiItC1CtE",
  "gtE6yJ3BzBlBxCrBT1G8BhCLtBtB9CZVOhDftCFPnBnFXpCWlDyBTmCQacsB6CDkCUEUmBIOuBuBKekB8BAMLyCamDlC2DqB-CTwEc-FrC",
  "89Cu_J-ChC2EPL3BsDnBeyBoEVU9B0EL8ChD7BAdjBtBJNtBlBHDTjCT5CEbrB7CmB9CL7E-BlCPvDvCzEgCxD2ClDwBT0CjB8ByEqBqCyBwEoByBmB0BX6CW",
  "2jHk6CVwC2CmJUmEgC8ByEiBmDyD0DnH4B3FsD_CyI9FuDxDuDzD-BjCiD7B7BvB1CQjCiCxC0D3CgCzBmCtFwCpECvBqB1DtB3D6C_B1EnHqB",
  "42b80H3FpGEtGrC_EiBjDnDrE9H9C_KL9IlHlEuCH2E7KrBrH_CpHBqGzElEzK_DzChDuCyB0F_D6BvCqE8F8BqD-DoGoD0EoEuM8B2GnBwGiLmE9CmJoGyDuC8D0HhBgH2CgE0GkBsD1IFhF",
  "6nc4yIuE0CsB_GnJ1BvFlG5JoErD7G9GBbmGiD6E2GM6B0I8B8EqHvG6EjCsEpB",
  "q7ZkxGuD4DyDXyC0C0EpBajCxD5DxCgClDtB1B1DhE6BC-C",
  "xrLj-D8BtDNvI0GlByCmBmE1BmB7BS1FYtCqCHsCgBoCjBAtDb1DnBzDfvF1F5E9Ef_GepG4BmGwJd4CtGuCzH0EjFevLmKwCwHEsDgDwF-K6B4FD8FlDC9B",
  "glK42D8EpKiCrEvE1BnB3CDjCnGzC_J9CxFtE3CJ7BM1DzC9DlBnFJxBLrBzB1BPdxBjDE9BZrEKzB0DGuDf6BnB0E5ByCqBKV8CYmBH4C4CgCT0C0BiDyCzB2BSoHEkBTiGTsCKyBhC-CiBuEyG8F6CgSsC",
  "w6Gw3F-Gf2C-BwBoC4EaiBkCiCiBnGoGwMkDoBewH1BqJrE0RxM0LPyFTyB9CuEEuCrFiDtBiBlCoEzCMxCTjCahC6B3BahCexB8BlB4BOmBrCIvBsCpG6SjDoBqB8CtElEvM3SnG_RrC7F5CtExG9ChBxBiCrCJhGUjBUnHD1BRxC0BzBhDUzC3C_BZ0C7B-BPuCnDoCpDoF3BkFpEoE5CiBjE-FXsEK2DzD-G9CuCrDqBhCyDMsB3BoD5BuBtC0E5DiFlDoEjDAgBuDImCawC",
  "jwJ5nPmDAqJsBuJrB2H1C2C5DY1CIlD1J9BlKxB3LvBhNnB5OMlIkCiByCsN2BsFkC-D2C6CqC4DmCiEyC",
  "p-Mz1PiOFwNT0EyCqDmCwGxC7BlD5B5CjNc9NL5HiCAItD6B",
  "_tOt9NqEYoHH6BmDMqCDgFyD-C4FgBqDpCuBpC2C5CiC3C4B5CY5CjBtC1BpCrHb_GlBlIEiDuCpHb_Gb3E8BLyC6GuC",
  "x_TphO-DiB-HZiJP8Gb6GY2DxD7EQzHH1HItILrGmBpD0C",
  "r-XrsOqBkCwHjBiIfwHkBxDlC7FzB1IQnGmC",
  "v7YjrOwEqBoGtByJtC1DIhISxI4B",
  "l_fnrP4DsC0LfoG9B6EnC2B5C_LZlImC1DmCHM_D2B",
  "gljBtxQAhhB_pmCAAihBMBwF0DoL9BYG0GgCaBYBiJxC8HyCuBMsSkB-FvB-CXuJhC4RzBiO9BkYtBgS2ByanBiP9BwQ6BsR4BsB-CzYIlUuBnFwC5QqBkB6CqCyCqCsClByCtK2B3EmC1JgCmPLuOgBiJjCkL8BqKqCgFiClCyChI4BlJ6B7MMnLcjMUhEqChI-B7EmC_BkHiDT2F9BoKU-JakF1C-JUqIsB6H2BkHiCuJUHqCnCsC8BmCiIkB2DjCyJoBmHyB-IEuIUuIwB4GqB0HsB8ELoEPqJcqIjB0IEmIcuITqJT2IIiJDqJDyIIsG6ByHgB6HpBwHiB4GoCgE_BmClCiEhCwG6BuHpCwIXmH1B6IK-HkBuJHuIbyIhBqD2C_DiChDmCjIQvDsCrBqClC0E4EZmILkIMqHfsG7B2ClCuILkIcyIoB2HWsGtBqIQsF4EiF5CmHjB8HUkFtCmIHyHXwHpB8EqCuCmCoGtCyIUsGrBqEhCqIUwGqBsG0ByHc6IW-HckGsB2D-BwB2CXyC9BuCnCwC9BuCzBmCJuCSuC-CsCwCyCeuClB2CXuCiD6CuD8BgEqCqE-BgF8BuC2CuD2B-D0BgGM-D-BsEoBkFWyE0ByD-B8EY2DzBrChCpG5B3CrBzEgBjFTpEtBvEzBhD5BbtCMrC-ChCpEvB7FNrDjC1D9B9D1CfpCoCzCqD9BkFtB4E_ByCtCsBpC6BtC-CjC8BpCa3F8BpCQtC-BvCbpDtDxCzDhCrIb5ClC3DhCtJrCpId7HrBtIpB_ExChKH_KI9JPvKA-BtCyJjBgH3B8DlC9G9B5KU9IzBJxCHtCqHhCsBrC-HpCoNfoL1B-I9BsL_ByPdoP3B2K5B0LjCkG9CiDpCyHmCqK8B8K-BgN0BkL2ByPEoPb0MtBiE2C2I6B6PEqMsB4LqBgNc6NkB2JyBrEmC3CoCAqChMH7MfnMA1BsCa0E6CsB-IuByKwByH6B0H6B0FwCyIiBuIcqEQ0JImJa4HoByHwB8GuB2I-BwFkC8F6B6BuCzGwBoCyCkE-BwGoB8GuBsGgC8EuCiD-CwE2BwHJiDjCuHHIsCmDuC4GTyBpCwHLiIiB6HYkHL2CxC8GkCsGiBiHcgHcsGuB-GgBuFqB4DoC2EzBwGcwE9CyDlCiHmB6CuCsG4BmILwCpCkFqC4GYqHI0GDgHX2GL-ChCiE7B8GkBqHIkHA-GEoGc0GWwF4B8FiBsGU4E4BuDsDyDkCwGfuClCsFvBwGQuElC0EzBsGwBmC2C0FkBwGiCkGcqHmB-EsBkFuB8EsB8FX0FmCiE4B8FDkFuBoBoCoF2BkFoBoGe4FQwFL-FRgF3BU1CwFhC4D3BwHXmE1BkF1BgGLgFmBsFyC8FpBkGX8FXkGNoGAkFvGHzBV5C_FxB9ErCctCgHEbtClDpC9CxC4E_BoHRmHiBuDuCkCsCsD-B-D6B0BoCoDiD-DSkHIoGYqGgBiDuC8BqCoEqCkG0BqFmBsDkCyDiByEgBoGT0FUkGY6GLyE2BmDmEqC1B-C9CoFnBgGPgGYsGP8FD-DUoFL4ErB0Fc4GA4FcwGbkEiCmDkCqE2B6H2EiEb4E1BmEnC-H3DkGD4FA4GW4GckF2BoE8BgHI0EqB-ElBmD_BsE9B8GIoEzBwHxB6HTwGQ8E-BmEgC0FQ0FbwGT8FgB0FAwFT4FT0FkB4GesGIkHA4FU0FQ2BiDIyC-D1BiB5CkCzCyChCoFhBkHKmIE0FMmIA8FEmIHgHPuE9BnBpCiE7B2GtBgHzBiIhBuIfsGdkHDgEiCyF3B4E9BwFtB0HTmHXiDtCkHvB4ElCgHfmHE4GLuHEwHNgHbuGvBwGlBuE7BXtCpDlC5C5ClClC9CzClId1DnCjIpB5CtCnErCxE9BxCxCxBpCT5CErCyDtCqBpC-ClC0LbwC1CpLfvJpB7LHpFxDhB9C1CpCpDrCqIhCmDxCsFpC0HjC2I9BsJ9BsO_BkDhDgSpBoBP0E5BqRyBqO9B4KvB",
  "ysG07GOCewBwED2F8BnEzCOlBTGlBNdEJHDUPMlBC1BPlBK",
  "ysG07GmBJ2BQmBBQLETKIeDmBOUFGPrGxChDatBwC-CI",
  "xN67GsC_DM5DkCzG2BpBlBtClIhB5CpCzDPHzEpHvCrCjDjF1BnGdhKzEArHdAGrD7DFhCtB5CAnCanFVhC7E9BN9C7H1I3GhCzIxC5CXnChOPDAK-CsC2BiCoDNkCmCsEuDgEkCgB2B0DEsDoC6DmEqC-DsGECkDuC6FW-EoEkD2BoFmFxB6HsCsFaoDgEoEqG8C0EyCmEwG-B6D0EA4D1C-FOwGrB2CB",
  "umHwpE5YAnYAjZAAgXAoW7BgF0B8Df2CoCgDsIEgG1BmG5B8Cf6EgC0C4BwFSuEZ2BjDuBiCgFvB8EJkDyBuDjJUzB3BvCpB3E3BnDtBhBhCgC5C6CvE-ITRyCxG8DpG2E3JqCrDiCxDyF7GnBjBIhEoHzFkBnB",
  "o8EwpEAvMlHABzC9YgM9Y-LpGtDtEpCvDuD7J2C3C-D9E8C9CjBlCwDH2C1DwEwC0CR-DauDP6CkBkFJ8ChCyFiDuBS0CV0CqEsC8BgCiD6BM6EqHlC0CSoFhBqI3C8CxF0FnB6IzC2GhDgD0BgD8CtB4E-BiDwE-CqEawInBkC5CqCAgChBmGXwBhCnC_CgB1CzB7D8B_EAnWA_W",
  "2qJgyB1R3SjIHxFtE_DD1B9BpEAvCkC3FzC5BzClEQrBYtBF_BC7HqFrEAjCiCAwDnDiB1D4G7CwBhBwClDgD7DOkCyDsDGc8BB0F8ByG-C4BUyC2C4E4DkDyCkGgBsFoHpBgC2E4D5C2DuBwBpBqEBuFvC0BlC4C_ByCzDkChClC3CjC9CQ1BE9BuDDwBQuBjBrBnCqCtDqC_CsCnCuUrHoFA",
  "2oIsuC2CP8BwBwB9BFzCxDtB2C3BpCpDtBkBvBPtDED-BP2BkC-CmC4C",
  "-xJqnCBDAxCApGAnD5C5DrEnFnFAtUsHrCoCpCgDpCuDsBoCqCqDgCjBoBzC6CxCiDB-F0B6GYwF-BiDMoCmByDG",
  "8zG9F1MP7GElCX3D9BvBUC2EuBsCMiFqB8CsCoDsC2BgCmCvCcMqH0C2B-DrBiFuBsEA8D8C-CpEYlD4CjHpCxEhDjE5BxCCzG",
  "k-FhHwCxDL1D5BXpDM9BxD5DQUuDaOI4D6B4BwBT4D-B",
  "g0DyqIxFsCpC0CrCsB7CqCrB-BhD-CqByCoCtBqBqB-CEsFfqEC8CrBoCAxB3CgDrCd9CtBJlBR_BtBdtD",
  "8rEwoIkD_BOjElBHfhBrDEtCrBhERxCyBd2CakCaBIoB2DgBuBIkCK8CE",
  "21D--I6E0B8DHsDvCW9B6DvBQxC2D5B-BsByBXvBhBmBjBxBrBSpCiD1CtC9Bf_BWXhBb7CDjCJHOYYYwBdAlBkBhBKZgBjBMdchBJbjCvBNQSrCqBhCUdczBiBuBKe-C_CsCyB4CnCAsCsC_B4BvBuC",
  "u9DmqI1BRLmB3ChDO_BpBQ3BgC1CoBWiBeuDgCuBmBS0BhBebiCTsCpBPRlBrB",
  "2gE0lINoCvBUpB2BmBsBwBOckCiBKebkBLafiBJmBjBeAXvBXXINtBH1DfHnBZC",
  "vhMojC0DaqBFH1EnFVjBS6B4BDuC",
  "2gG-VvFkEtB2CvDpB7CO1BhB5CY5DkFfgCzEwCzB4DxC2CnEoDBiCrDwCnEuC8BWmCmByByF4B8CwEciB1BoD1D2BPoCiBwEHcnBoGAGoBoDmBU6BsCqBoFzDmDUkDwEuDuDR4DvB6B4DKOuB-CNXzEYvEmDtCYlCDjDcDC7Eb7BrDFjCxD8DNmD_CiBvC8CvB2D3GnEjE5D3D7D7CrEAhFtB9DsBzC1B"
];
  /*
   * These deliberately abstract silhouettes are not geographic boundaries.
   * They make seven synthetic jurisdiction portals visually distinct while
   * preserving the product's existing synthetic-data disclosure.
   */
  var JURISDICTION_SILHOUETTES = {
    "synthetic-jurisdiction-01": {
      synthetic: true,
      knots: [
        [-0.78, 0.66], [-0.28, 0.94], [0.18, 0.84], [0.54, 0.48],
        [0.42, 0.12], [0.72, -0.22], [0.44, -0.72], [-0.04, -0.92],
        [-0.48, -0.72], [-0.62, -0.22], [-0.88, 0.12]
      ]
    },
    "synthetic-jurisdiction-02": {
      synthetic: true,
      knots: [
        [-0.98, 0.26], [-0.68, 0.66], [-0.16, 0.78], [0.22, 0.58],
        [0.74, 0.7], [0.98, 0.24], [0.76, -0.18], [0.34, -0.34],
        [-0.08, -0.7], [-0.62, -0.54], [-0.84, -0.18]
      ]
    },
    "synthetic-jurisdiction-03": {
      synthetic: true,
      knots: [
        [-0.42, 0.96], [0.06, 0.72], [0.54, 0.82], [0.72, 0.3],
        [0.44, -0.02], [0.64, -0.48], [0.12, -0.94], [-0.28, -0.7],
        [-0.62, -0.82], [-0.78, -0.24], [-0.54, 0.2], [-0.72, 0.6]
      ]
    },
    "synthetic-jurisdiction-04": {
      synthetic: true,
      knots: [
        [-0.88, 0.72], [-0.24, 0.86], [0.18, 0.66], [0.74, 0.82],
        [0.9, 0.3], [0.64, -0.12], [0.82, -0.62], [0.24, -0.82],
        [-0.2, -0.6], [-0.76, -0.78], [-0.9, -0.24], [-0.62, 0.18]
      ]
    },
    "synthetic-jurisdiction-05": {
      synthetic: true,
      knots: [
        [-0.9, 0.84], [-0.44, 0.72], [-0.14, 0.28], [0.28, 0.12],
        [0.66, -0.18], [0.92, -0.68], [0.48, -0.9], [0.06, -0.58],
        [-0.36, -0.42], [-0.68, 0.02]
      ]
    },
    "synthetic-jurisdiction-06": {
      synthetic: true,
      knots: [
        [-0.96, 0.18], [-0.7, 0.7], [-0.18, 0.88], [0.28, 0.66],
        [0.78, 0.82], [0.94, 0.32], [0.54, 0.02], [0.78, -0.5],
        [0.22, -0.82], [-0.28, -0.62], [-0.68, -0.86], [-0.82, -0.36],
        [-0.42, -0.08]
      ]
    },
    "synthetic-jurisdiction-07": {
      synthetic: true,
      knots: [
        [-0.86, 0.52], [-0.48, 0.92], [0.02, 0.74], [0.46, 0.94],
        [0.88, 0.52], [0.62, 0.08], [0.94, -0.26], [0.48, -0.78],
        [-0.02, -0.9], [-0.34, -0.54], [-0.82, -0.72], [-0.68, -0.14],
        [-0.34, 0.08]
      ]
    }
  };

  var WEBGL_SHADER_SOURCES = {
    webgl2: {
      sphereVertex: [
        "#version 300 es",
        "in vec3 aPosition;",
        "in vec3 aNormal;",
        "uniform mat4 uModel;",
        "uniform mat4 uViewProjection;",
        "out vec3 vNormal;",
        "out vec3 vWorld;",
        "void main(void) {",
        "  vec4 world = uModel * vec4(aPosition, 1.0);",
        "  vWorld = world.xyz;",
        "  vNormal = mat3(uModel) * aNormal;",
        "  gl_Position = uViewProjection * world;",
        "}"
      ].join("\n"),
      sphereFragment: [
        "#version 300 es",
        "precision highp float;",
        "in vec3 vNormal;",
        "in vec3 vWorld;",
        "uniform vec4 uInk;",
        "uniform vec4 uTeal;",
        "uniform vec4 uSurface;",
        "uniform vec3 uSunDirection;",
        "uniform float uAtmosphere;",
        "uniform float uFog;",
        "uniform float uOpacity;",
        "uniform float uShell;",
        "uniform float uNightAttenuation;",
        "out vec4 outColor;",
        "void main(void) {",
        "  vec3 normal = normalize(vNormal);",
        "  float light = max(dot(normal, normalize(uSunDirection)), 0.0);",
        "  float rim = pow(1.0 - abs(normal.z), 2.4);",
        "  vec4 base = mix(uInk, uSurface, 0.15 + light * 0.45);",
        "  base = mix(uInk, base, uNightAttenuation + light * (1.0 - uNightAttenuation));",
        "  base = mix(base, uTeal, rim * uAtmosphere);",
        "  float depthFog = clamp(length(vWorld) * uFog, 0.0, 0.22);",
        "  vec4 shellColor = mix(uTeal, uSurface, clamp(rim * 1.4, 0.0, 1.0));",
        "  vec4 finalColor = mix(mix(base, uSurface, depthFog), shellColor, uShell);",
        "  float shellAlpha = mix(1.0, rim * 0.36, uShell);",
        "  outColor = vec4(finalColor.rgb, shellAlpha * uOpacity);",
        "}"
      ].join("\n"),
      lineVertex: [
        "#version 300 es",
        "in vec3 aPosition;",
        "uniform mat4 uModel;",
        "uniform mat4 uViewProjection;",
        "uniform float uPointSize;",
        "void main(void) {",
        "  gl_Position = uViewProjection * uModel * vec4(aPosition, 1.0);",
        "  gl_PointSize = uPointSize;",
        "}"
      ].join("\n"),
      lineFragment: [
        "#version 300 es",
        "precision highp float;",
        "uniform vec4 uColor;",
        "uniform float uPointSprite;",
        "out vec4 outColor;",
        "void main(void) {",
        "  float alpha = uColor.a;",
        "  if (uPointSprite > 0.5) {",
        "    vec2 centered = gl_PointCoord * 2.0 - 1.0;",
        "    float radius = length(centered);",
        "    if (radius > 1.0) { discard; }",
        "    float disc = smoothstep(1.0, 0.72, radius);",
        "    float ring = smoothstep(0.98, 0.80, radius) * smoothstep(0.52, 0.68, radius);",
        "    alpha *= mix(disc, ring, step(1.5, uPointSprite));",
        "  }",
        "  outColor = vec4(uColor.rgb, alpha);",
        "}"
      ].join("\n"),
      fullscreenVertex: [
        "#version 300 es",
        "in vec2 aPosition;",
        "out vec2 vUv;",
        "void main(void) {",
        "  vUv = aPosition * 0.5 + 0.5;",
        "  gl_Position = vec4(aPosition, 0.0, 1.0);",
        "}"
      ].join("\n"),
      blurFragment: [
        "#version 300 es",
        "precision highp float;",
        "in vec2 vUv;",
        "uniform sampler2D uTexture;",
        "uniform vec2 uTexel;",
        "uniform vec2 uDirection;",
        "uniform float uStrength;",
        "out vec4 outColor;",
        "void main(void) {",
        "  vec2 stepVector = uTexel * uDirection * uStrength;",
        "  vec4 color = texture(uTexture, vUv) * 0.36;",
        "  color += texture(uTexture, vUv + stepVector * 1.384) * 0.24;",
        "  color += texture(uTexture, vUv - stepVector * 1.384) * 0.24;",
        "  color += texture(uTexture, vUv + stepVector * 3.230) * 0.08;",
        "  color += texture(uTexture, vUv - stepVector * 3.230) * 0.08;",
        "  outColor = color;",
        "}"
      ].join("\n"),
      compositeFragment: [
        "#version 300 es",
        "precision highp float;",
        "in vec2 vUv;",
        "uniform sampler2D uSharp;",
        "uniform sampler2D uBlur;",
        "uniform vec2 uFocusCenter;",
        "uniform float uFocusRadius;",
        "uniform float uFocusFeather;",
        "uniform float uContextAttenuation;",
        "uniform float uCompositeMode;",
        "uniform float uWeight;",
        "out vec4 outColor;",
        "void main(void) {",
        "  vec4 sharp = texture(uSharp, vUv);",
        "  vec4 blurred = texture(uBlur, vUv);",
        "  float distanceFromFocus = distance(vUv, uFocusCenter);",
        "  float focus = 1.0 - smoothstep(",
        "    uFocusRadius, uFocusRadius + uFocusFeather, distanceFromFocus",
        "  );",
        "  vec4 isolated = mix(blurred * uContextAttenuation, sharp, focus);",
        "  outColor = mix(isolated, blurred * uWeight, step(0.5, uCompositeMode));",
        "}"
      ].join("\n")
    },
    webgl1: {
      sphereVertex: [
        "attribute vec3 aPosition;",
        "attribute vec3 aNormal;",
        "uniform mat4 uModel;",
        "uniform mat4 uViewProjection;",
        "varying vec3 vNormal;",
        "varying vec3 vWorld;",
        "void main(void) {",
        "  vec4 world = uModel * vec4(aPosition, 1.0);",
        "  vWorld = world.xyz;",
        "  vNormal = mat3(uModel) * aNormal;",
        "  gl_Position = uViewProjection * world;",
        "}"
      ].join("\n"),
      sphereFragment: [
        "precision highp float;",
        "varying vec3 vNormal;",
        "varying vec3 vWorld;",
        "uniform vec4 uInk;",
        "uniform vec4 uTeal;",
        "uniform vec4 uSurface;",
        "uniform vec3 uSunDirection;",
        "uniform float uAtmosphere;",
        "uniform float uFog;",
        "uniform float uOpacity;",
        "uniform float uShell;",
        "uniform float uNightAttenuation;",
        "void main(void) {",
        "  vec3 normal = normalize(vNormal);",
        "  float light = max(dot(normal, normalize(uSunDirection)), 0.0);",
        "  float rim = pow(1.0 - abs(normal.z), 2.4);",
        "  vec4 base = mix(uInk, uSurface, 0.15 + light * 0.45);",
        "  base = mix(uInk, base, uNightAttenuation + light * (1.0 - uNightAttenuation));",
        "  base = mix(base, uTeal, rim * uAtmosphere);",
        "  float depthFog = clamp(length(vWorld) * uFog, 0.0, 0.22);",
        "  vec4 shellColor = mix(uTeal, uSurface, clamp(rim * 1.4, 0.0, 1.0));",
        "  vec4 finalColor = mix(mix(base, uSurface, depthFog), shellColor, uShell);",
        "  float shellAlpha = mix(1.0, rim * 0.36, uShell);",
        "  gl_FragColor = vec4(finalColor.rgb, shellAlpha * uOpacity);",
        "}"
      ].join("\n"),
      lineVertex: [
        "attribute vec3 aPosition;",
        "uniform mat4 uModel;",
        "uniform mat4 uViewProjection;",
        "uniform float uPointSize;",
        "void main(void) {",
        "  gl_Position = uViewProjection * uModel * vec4(aPosition, 1.0);",
        "  gl_PointSize = uPointSize;",
        "}"
      ].join("\n"),
      lineFragment: [
        "precision highp float;",
        "uniform vec4 uColor;",
        "uniform float uPointSprite;",
        "void main(void) {",
        "  float alpha = uColor.a;",
        "  if (uPointSprite > 0.5) {",
        "    vec2 centered = gl_PointCoord * 2.0 - 1.0;",
        "    float radius = length(centered);",
        "    if (radius > 1.0) { discard; }",
        "    float disc = smoothstep(1.0, 0.72, radius);",
        "    float ring = smoothstep(0.98, 0.80, radius) * smoothstep(0.52, 0.68, radius);",
        "    alpha *= mix(disc, ring, step(1.5, uPointSprite));",
        "  }",
        "  gl_FragColor = vec4(uColor.rgb, alpha);",
        "}"
      ].join("\n"),
      fullscreenVertex: [
        "attribute vec2 aPosition;",
        "varying vec2 vUv;",
        "void main(void) {",
        "  vUv = aPosition * 0.5 + 0.5;",
        "  gl_Position = vec4(aPosition, 0.0, 1.0);",
        "}"
      ].join("\n"),
      blurFragment: [
        "precision highp float;",
        "varying vec2 vUv;",
        "uniform sampler2D uTexture;",
        "uniform vec2 uTexel;",
        "uniform vec2 uDirection;",
        "uniform float uStrength;",
        "void main(void) {",
        "  vec2 stepVector = uTexel * uDirection * uStrength;",
        "  vec4 color = texture2D(uTexture, vUv) * 0.36;",
        "  color += texture2D(uTexture, vUv + stepVector * 1.384) * 0.24;",
        "  color += texture2D(uTexture, vUv - stepVector * 1.384) * 0.24;",
        "  color += texture2D(uTexture, vUv + stepVector * 3.230) * 0.08;",
        "  color += texture2D(uTexture, vUv - stepVector * 3.230) * 0.08;",
        "  gl_FragColor = color;",
        "}"
      ].join("\n"),
      compositeFragment: [
        "precision highp float;",
        "varying vec2 vUv;",
        "uniform sampler2D uSharp;",
        "uniform sampler2D uBlur;",
        "uniform vec2 uFocusCenter;",
        "uniform float uFocusRadius;",
        "uniform float uFocusFeather;",
        "uniform float uContextAttenuation;",
        "uniform float uCompositeMode;",
        "uniform float uWeight;",
        "void main(void) {",
        "  vec4 sharp = texture2D(uSharp, vUv);",
        "  vec4 blurred = texture2D(uBlur, vUv);",
        "  float distanceFromFocus = distance(vUv, uFocusCenter);",
        "  float focus = 1.0 - smoothstep(",
        "    uFocusRadius, uFocusRadius + uFocusFeather, distanceFromFocus",
        "  );",
        "  vec4 isolated = mix(blurred * uContextAttenuation, sharp, focus);",
        "  gl_FragColor = mix(",
        "    isolated, blurred * uWeight, step(0.5, uCompositeMode)",
        "  );",
        "}"
      ].join("\n")
    }
  };

  return {
    worldViewportMetrics: worldViewportMetrics,
    depthLod: DEPTH_LOD,
    portalContract: PORTAL_CONTRACT,
    semanticLodContract: SEMANTIC_LOD_CONTRACT,
    handoffContract: HANDOFF_CONTRACT,
    experienceAnalyticsContract: EXPERIENCE_ANALYTICS_CONTRACT,
    experienceAnalyticsEventName: EXPERIENCE_ANALYTICS_EVENT_NAME,
    sceneContracts: SCENE_CONTRACT_BY_PROFILE_ID,
    countryOutlines: WORLD_COUNTRY_OUTLINES_ENCODED,
    jurisdictionSilhouettes: JURISDICTION_SILHOUETTES,
    webglShaderSources: WEBGL_SHADER_SOURCES
  };
}));
