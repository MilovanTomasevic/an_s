(function (globalObject, factory) {
"use strict";

var api = factory();
if (typeof module !== "undefined" && module.exports) {
module.exports = api;
}
if (globalObject && globalObject.document) {
api.mount(globalObject);
}
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
"use strict";

var LEGACY_CONTRACT_ID = "advanexus.business-outcome-map/v1";
var WORLD_CONTRACT_ID = "advanexus.world/v3";
var PHASE_IDS = [
"problem",
"context",
"control",
"decision",
"outcome",
"evidence"
];
var VIEW_IDS = ["world", "story", "evidence"];
var DEPTH_IDS = ["L-2", "L-1", "L0", "L1", "L2", "L3", "L4", "L5"];
var QUALITY_RESOLUTION_IDS = [
"UNRESOLVED",
"REMEDIATED_RECHECK_PASSED",
"ACCEPTED_EXCEPTION",
"REJECTED"
];
var AUTHORITY_DECISION_IDS = [
"APPROVED",
"REJECTED",
"RECOVERY_REQUIRED"
];
var WORLD_CONTROL_IDS = [
"group_label",
"level_up",
"full_world",
"skip_intro",
"share_scene",
"share_success",
"share_unavailable",
"role_lens",
"all_roles",
"comparison_label",
"before",
"after",
"previous_step"
];
var CERTAINTY_IDS = ["KNOWN", "PARTIAL", "UNKNOWN"];
var PREFLIGHT_IDS = ["ENVIRONMENT_VALIDATION_REQUIRED"];
var COMPARISON_SIDE_IDS = ["BEFORE", "AFTER"];
var SCENE_STATE_GROUP_IDS = [
"certainty",
"preflight",
"quality-resolution",
"authority-decision",
"comparison"
];
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
var PHASE_DEPTH_IDS = {
problem: "L-2",
context: "L-1",
control: "L1",
decision: "L2",
outcome: "L3",
evidence: "L5"
};
var CAMERA_STATES = [
"orbit",
"approach",
"enter",
"focus",
"rewind",
"exit"
];
var MORPH_STAGE_IDS = [
"jurisdiction",
"organisation-system",
"controlled-use-case",
"outcome-crystal",
"evidence-authority"
];
var DEPTH_LOD;
var SCENE_LAYERS = [
"planet",
"world-map",
"atmosphere",
"night-lights",
"clouds",
"sun-shadow",
"jurisdiction",
"organisation",
"physical-twin",
"digital-twin",
"satellites",
"aircraft",
"data-flow",
"control-membrane",
"quality-gate",
"finding",
"version-crystal",
"prior-version",
"ai-path",
"authority-gate",
"business-outcome",
"evidence-rewind",
"focus-depth",
"semantic-zoom",
"volumetric-depth",
"active-flow-bloom",
"camera-flight-motion",
"micro-motion"
];
var PHASE_EFFECTS = {
problem: "signal-dawn",
context: "jurisdiction-morph",
control: "control-membrane",
decision: "authority-gate",
outcome: "version-crystallization",
evidence: "reverse-evidence"
};
var EFFECT_IDS = [
"signal-dawn",
"jurisdiction-morph",
"true-portal-traversal",
"system-constellation",
"capability-preflight",
"control-membrane",
"digital-twin-divergence",
"data-quality-hold",
"partial-unknown-state",
"contract-diff",
"report-binding",
"analytics-run-lens",
"ai-boundary",
"authority-gate",
"role-lens",
"version-crystallization",
"controlled-release",
"incident-shockwave",
"recovery-branch",
"migration-bridge",
"before-after",
"finding-trace",
"evidence-strength-state",
"evidence-package-assembly",
"reverse-evidence"
];
var GEOMETRY_RECIPE_IDS = [
"dual-estate-migration",
"reporting-obligation-spine",
"quality-hold-corridor",
"governed-analytics-lens",
"incident-recovery-branch",
"evidence-rewind-tree"
];
var RECIPE_BY_PROFILE_ID = {
"migration-bridge": "dual-estate-migration",
"reporting-obligation": "reporting-obligation-spine",
"quality-gate": "quality-hold-corridor",
"governed-decision": "governed-analytics-lens",
"recovery-branch": "incident-recovery-branch",
"evidence-rewind": "evidence-rewind-tree"
};
var PROFILE_ID_BY_STORY_ID = {
"migration-assurance": "migration-bridge",
"recurring-reporting": "reporting-obligation",
"quality-before-delivery": "quality-gate",
"governed-analytics": "governed-decision",
"business-validated-recovery": "recovery-branch",
"evidence-backed-investigation": "evidence-rewind"
};
var PORTAL_CONTRACT;
var SEMANTIC_LOD_CONTRACT;
var HANDOFF_CONTRACT;

/*
* Large deterministic presentation data is split into its own fingerprinted
* static asset so this controller stays inside the per-file transfer budget.
* Browsers receive it from the preceding deferred script; Node tests load
* the same local module. No external geography or shader request is made.
*/
var WORLD_RUNTIME_DATA = (
typeof globalThis !== "undefined" &&
globalThis.AdvanexusWorldRuntimeData
) || (
typeof module !== "undefined" &&
module.exports &&
typeof require === "function"
? require("./world-runtime-data.js")
: {}
);
DEPTH_LOD = WORLD_RUNTIME_DATA.depthLod || {};
var worldViewportMetrics = WORLD_RUNTIME_DATA.worldViewportMetrics;
PORTAL_CONTRACT = WORLD_RUNTIME_DATA.portalContract || {};
SEMANTIC_LOD_CONTRACT = WORLD_RUNTIME_DATA.semanticLodContract || {};
HANDOFF_CONTRACT = WORLD_RUNTIME_DATA.handoffContract || {};
var EXPERIENCE_ANALYTICS_CONTRACT =
WORLD_RUNTIME_DATA.experienceAnalyticsContract || {};
var EXPERIENCE_ANALYTICS_EVENT_NAME =
WORLD_RUNTIME_DATA.experienceAnalyticsEventName ||
"advanexus:world-experience";
var SCENE_CONTRACT_BY_PROFILE_ID =
WORLD_RUNTIME_DATA.sceneContracts || {};
var WORLD_COUNTRY_OUTLINES_ENCODED =
WORLD_RUNTIME_DATA.countryOutlines || [];
var JURISDICTION_SILHOUETTES =
WORLD_RUNTIME_DATA.jurisdictionSilhouettes || {};
var WEBGL_SHADER_SOURCES =
WORLD_RUNTIME_DATA.webglShaderSources || {};
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

function ids(rows, key) {
return rows.map(function (row) {
return row[key];
});
}

function includes(values, candidate) {
return values.indexOf(candidate) >= 0;
}

function isNonEmptyText(value) {
return typeof value === "string" && value.trim().length > 0;
}

function unique(values) {
return new Set(values).size === values.length;
}

function sameValues(left, right) {
return (
Array.isArray(left) &&
Array.isArray(right) &&
left.length === right.length &&
left.every(function (value, index) {
return value === right[index];
})
);
}

function sameKeySet(left, right) {
return (
Array.isArray(left) &&
Array.isArray(right) &&
left.length === right.length &&
left.every(function (value) {
return includes(right, value);
}) &&
right.every(function (value) {
return includes(left, value);
})
);
}

function hasExactKeys(value, expectedKeys) {
return Boolean(
value &&
typeof value === "object" &&
!Array.isArray(value) &&
sameKeySet(Object.keys(value), expectedKeys)
);
}

function sameContractValue(left, right) {
if (Array.isArray(right)) {
return (
Array.isArray(left) &&
left.length === right.length &&
left.every(function (value, index) {
return sameContractValue(value, right[index]);
})
);
}
if (right && typeof right === "object") {
if (!left || typeof left !== "object" || Array.isArray(left)) {
return false;
}
var expectedKeys = Object.keys(right);
var actualKeys = Object.keys(left);
return (
sameKeySet(actualKeys, expectedKeys) &&
expectedKeys.every(function (key) {
return sameContractValue(left[key], right[key]);
})
);
}
return left === right;
}

function finiteNumber(value) {
return typeof value === "number" && Number.isFinite(value);
}

function clamp(value, minimum, maximum) {
return Math.min(maximum, Math.max(minimum, value));
}

function degreesToRadians(value) {
return value * Math.PI / 180;
}

function stableHash(value) {
var textValue = String(value || "");
var hash = 2166136261;
var index;
for (index = 0; index < textValue.length; index += 1) {
hash ^= textValue.charCodeAt(index);
hash = Math.imul(hash, 16777619);
}
return hash >>> 0;
}

function parseState(search, contract) {
var params = new URLSearchParams(search || "");
var caseIds = ids(contract.cases, "case_id");
var industryIds = ids(contract.industries, "industry_id");
var caseId = params.get("outcome");
var industryId = params.get("industry");
return {
caseId: includes(caseIds, caseId)
? caseId
: contract.default_case_id,
industryId: includes(industryIds, industryId)
? industryId
: contract.default_industry_id
};
}

function serializeState(state) {
var params = new URLSearchParams();
params.set("industry", state.industryId);
params.set("outcome", state.caseId);
return params.toString();
}

function phaseById(world, phaseId) {
return world.phases.find(function (phase) {
return phase.phase_id === phaseId;
}) || null;
}

function defaultWorldState(world) {
return {
caseId: world.state.default_story_id,
industryId: world.state.default_industry_id,
stepId: world.state.default_step_id,
viewId: world.state.default_view_id,
depthId: world.state.default_depth_id
};
}

function ambientChapterState(world, currentState, chapterIndex) {
var phaseIndex = (
Math.max(0, chapterIndex) % PHASE_IDS.length
);
var stepId = PHASE_IDS[phaseIndex];
return {
caseId: currentState.caseId,
industryId: currentState.industryId,
stepId: stepId,
viewId: stepId === "evidence" ? "evidence" :
phaseIndex === 0 ? "world" : "story",
depthId: phaseById(world, stepId).depth_id,
authorityConfirmed: currentState.authorityConfirmed === true,
authorityRecord: currentState.authorityRecord || null,
qualityResolution: "UNRESOLVED"
};
}

function parseWorldState(search, contract, world) {
var safe = defaultWorldState(world);
var params = new URLSearchParams(search || "");
var caseIds = ids(contract.cases, "case_id");
var industryIds = ids(contract.industries, "industry_id");
var requestedCase = params.get(world.state.story_param);
var requestedIndustry = params.get(world.state.industry_param);
var requestedStep = params.get(world.state.step_param);
var requestedView = params.get(world.state.view_param);
var requestedDepth = params.get(world.state.depth_param);
var explicitStep = requestedStep !== null;
var explicitDepth = requestedDepth !== null;

safe.caseId = includes(caseIds, requestedCase)
? requestedCase
: safe.caseId;
safe.industryId = includes(industryIds, requestedIndustry)
? requestedIndustry
: safe.industryId;
safe.stepId = includes(world.phase_ids, requestedStep)
? requestedStep
: safe.stepId;
safe.viewId = includes(world.view_ids, requestedView)
? requestedView
: safe.viewId;
if (includes(world.depth_ids, requestedDepth)) {
safe.depthId = requestedDepth;
} else if (explicitStep && !explicitDepth) {
safe.depthId = phaseById(world, safe.stepId).depth_id;
}
if (
requestedView === "evidence" &&
includes(world.view_ids, requestedView) &&
!explicitStep
) {
safe.stepId = "evidence";
safe.depthId = phaseById(world, "evidence").depth_id;
}
return safe;
}

function serializeWorldState(state, world) {
var params = new URLSearchParams();
params.set(world.state.industry_param, state.industryId);
params.set(world.state.story_param, state.caseId);
params.set(world.state.step_param, state.stepId);
params.set(world.state.view_param, state.viewId);
params.set(world.state.depth_param, state.depthId);
return params.toString();
}

function findBy(rows, key, value) {
return rows.find(function (row) {
return row[key] === value;
}) || null;
}

function isValidContract(contract) {
if (
!contract ||
contract.contract !== LEGACY_CONTRACT_ID ||
!Array.isArray(contract.cases) ||
!Array.isArray(contract.industries) ||
contract.cases.length !== 6 ||
contract.industries.length !== 7
) {
return false;
}
var caseIds = ids(contract.cases, "case_id");
var industryIds = ids(contract.industries, "industry_id");
var casesAreComplete = contract.cases.every(function (item) {
return (
isNonEmptyText(item.case_id) &&
isNonEmptyText(item.title) &&
isNonEmptyText(item.meta) &&
isNonEmptyText(item.today) &&
isNonEmptyText(item.with_advanexus) &&
isNonEmptyText(item.pilot_goal) &&
isNonEmptyText(item.economic_value) &&
isNonEmptyText(item.proof) &&
Array.isArray(item.roles) &&
item.roles.length >= 2 &&
item.roles.every(isNonEmptyText) &&
item.boundary &&
isNonEmptyText(item.boundary.title) &&
isNonEmptyText(item.boundary.body)
);
});
var industriesAreComplete = contract.industries.every(function (item) {
return (
isNonEmptyText(item.industry_id) &&
isNonEmptyText(item.label) &&
isNonEmptyText(item.title) &&
isNonEmptyText(item.lead) &&
Array.isArray(item.recommended_case_ids) &&
item.recommended_case_ids.length === caseIds.length &&
item.recommended_case_ids.every(function (caseId) {
return includes(caseIds, caseId);
})
);
});
return (
unique(caseIds) &&
unique(industryIds) &&
includes(caseIds, contract.default_case_id) &&
includes(industryIds, contract.default_industry_id) &&
casesAreComplete &&
industriesAreComplete
);
}

function isEvidenceRewind(platformPath, evidencePath) {
if (
!Array.isArray(platformPath) ||
!platformPath.length ||
!Array.isArray(evidencePath) ||
evidencePath.length !== platformPath.length ||
!unique(platformPath) ||
!unique(evidencePath)
) {
return false;
}
return evidencePath.every(function (nodeId, index) {
return nodeId === platformPath[platformPath.length - 1 - index];
});
}

function portalContractIsValid(portal) {
return sameContractValue(portal, PORTAL_CONTRACT);
}

function semanticLodContractIsValid(semanticLod) {
return sameContractValue(semanticLod, SEMANTIC_LOD_CONTRACT);
}

function handoffContractIsValid(handoff) {
return sameContractValue(handoff, HANDOFF_CONTRACT);
}

function analyticsContractIsValid(analytics) {
return sameContractValue(analytics, EXPERIENCE_ANALYTICS_CONTRACT);
}

function localizedControlsAreValid(controls) {
return Boolean(
controls &&
hasExactKeys(controls, WORLD_CONTROL_IDS) &&
WORLD_CONTROL_IDS.every(function (controlId) {
return isNonEmptyText(controls[controlId]);
})
);
}

function localizedActionsAreValid(actions) {
if (
!actions ||
!hasExactKeys(actions, [
"quality_title",
"authority_title",
"quality",
"authority"
]) ||
!isNonEmptyText(actions.quality_title) ||
!isNonEmptyText(actions.authority_title)
) {
return false;
}
function actionGroupIsValid(items, expectedIds) {
return Boolean(
Array.isArray(items) &&
items.length === expectedIds.length &&
items.every(function (item, index) {
return (
item &&
hasExactKeys(item, ["action_id", "label"]) &&
item.action_id === expectedIds[index] &&
isNonEmptyText(item.label) &&
item.label.trim() !== item.action_id
);
})
);
}
return (
actionGroupIsValid(actions.quality, [
"REMEDIATED_RECHECK_PASSED",
"ACCEPTED_EXCEPTION",
"REJECTED",
"UNRESOLVED"
]) &&
actionGroupIsValid(actions.authority, AUTHORITY_DECISION_IDS)
);
}

function previousDepthId(depthIds, currentDepthId) {
if (!Array.isArray(depthIds) || !depthIds.length) {
return null;
}
var currentIndex = depthIds.indexOf(currentDepthId);
if (currentIndex < 0) {
return depthIds[0];
}
return depthIds[Math.max(0, currentIndex - 1)];
}

function skipIntroState(state, world) {
var nextState = Object.assign({}, state);
if (!world || !Array.isArray(world.phase_ids)) {
return nextState;
}
nextState.stepId = includes(world.phase_ids, "control")
? "control"
: world.state.default_step_id;
nextState.viewId = "story";
var controlPhase = phaseById(world, nextState.stepId);
nextState.depthId = controlPhase
? controlPhase.depth_id
: world.state.default_depth_id;
return nextState;
}

function normalizedRoleLensIndex(value, roleCount) {
if (value === "all" || value === null || typeof value === "undefined") {
return null;
}
var numericValue = typeof value === "number"
? value
: /^(0|[1-9][0-9]*)$/.test(String(value))
? Number(value)
: -1;
return (
Number.isInteger(numericValue) &&
numericValue >= 0 &&
numericValue < roleCount
)
? numericValue
: null;
}

function normalizedComparisonSide(comparisonMode, value) {
if (comparisonMode !== "before-after") {
return null;
}
return includes(COMPARISON_SIDE_IDS, value) ? value : "AFTER";
}

function canonicalWorldShareUrl(locationObject, state, world) {
if (
!locationObject ||
!isNonEmptyText(locationObject.origin) ||
!isNonEmptyText(locationObject.pathname) ||
!world
) {
return null;
}
try {
var target = new URL(locationObject.pathname, locationObject.origin);
target.search = serializeWorldState(state, world);
return target.href;
} catch (error) {
return null;
}
}

function analyticsScalarTokenIsValid(value) {
if (typeof value === "boolean") {
return true;
}
if (typeof value === "number") {
return Number.isFinite(value) && Math.abs(value) <= 1000000000;
}
return (
typeof value === "string" &&
value.length > 0 &&
value.length <= 96 &&
/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
);
}

function analyticsEventPayloadIsValid(analytics, eventName, payload) {
if (
!analyticsContractIsValid(analytics) ||
!Object.prototype.hasOwnProperty.call(analytics.events, eventName) ||
!payload ||
Array.isArray(payload) ||
typeof payload !== "object"
) {
return false;
}
var allowedFields = analytics.events[eventName];
var payloadFields = Object.keys(payload);
return (
payloadFields.length === allowedFields.length &&
payloadFields.every(function (fieldName) {
return (
includes(allowedFields, fieldName) &&
!includes(analytics.forbidden_fields, fieldName) &&
analyticsScalarTokenIsValid(payload[fieldName])
);
}) &&
allowedFields.every(function (fieldName) {
return Object.prototype.hasOwnProperty.call(payload, fieldName);
})
);
}

function createExperienceAnalyticsRecorder(
analytics,
eventTarget,
CustomEventConstructor
) {
var buffer = [];
var lastFingerprintByEvent = Object.create(null);
function record(eventName, payload) {
if (!analyticsEventPayloadIsValid(analytics, eventName, payload)) {
return false;
}
var safePayload = {};
analytics.events[eventName].forEach(function (fieldName) {
safePayload[fieldName] = payload[fieldName];
});
var fingerprint = JSON.stringify(safePayload);
if (lastFingerprintByEvent[eventName] === fingerprint) {
return false;
}
lastFingerprintByEvent[eventName] = fingerprint;
var entry = {
contract: analytics.contract,
event: eventName,
payload: safePayload
};
buffer.push(entry);
if (buffer.length > analytics.buffer_limit) {
buffer.splice(0, buffer.length - analytics.buffer_limit);
}
if (
eventTarget &&
typeof eventTarget.dispatchEvent === "function" &&
typeof CustomEventConstructor === "function"
) {
try {
eventTarget.dispatchEvent(new CustomEventConstructor(
EXPERIENCE_ANALYTICS_EVENT_NAME,
{detail: entry}
));
} catch (error) {
return true;
}
}
return true;
}
return {
record: record,
entries: function () {
return buffer.map(function (entry) {
return {
contract: entry.contract,
event: entry.event,
payload: Object.assign({}, entry.payload)
};
});
}
};
}

function canonicalHandoffUrl(rawHref, currentOrigin, handoff) {
if (
!isNonEmptyText(rawHref) ||
!isNonEmptyText(currentOrigin) ||
!handoffContractIsValid(handoff)
) {
return null;
}
try {
var target = new URL(rawHref, currentOrigin);
var current = new URL(currentOrigin);
var queryKeys = Array.from(target.searchParams.keys());
if (
target.origin !== current.origin ||
target.hash ||
queryKeys.length !== handoff.allowed_params.length ||
!unique(queryKeys) ||
!queryKeys.every(function (parameter) {
return includes(handoff.allowed_params, parameter);
}) ||
!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/.test(
target.searchParams.get("tour") || ""
) ||
target.searchParams.get("step") !== String(handoff.initial_step) ||
target.searchParams.get("level") !== String(handoff.initial_level) ||
target.searchParams.get("entry") !== handoff.entry_value
) {
return null;
}
var canonical = new URL(target.pathname, current.origin);
handoff.allowed_params.forEach(function (parameter) {
canonical.searchParams.append(
parameter,
target.searchParams.get(parameter)
);
});
return canonical.href;
} catch (error) {
return null;
}
}

function handoffCanBeEnhanced(event, anchor, runtimeState) {
if (
!event ||
!anchor ||
!runtimeState ||
event.defaultPrevented ||
event.button !== 0 ||
event.metaKey ||
event.ctrlKey ||
event.shiftKey ||
event.altKey ||
runtimeState.reducedMotion ||
runtimeState.printing ||
runtimeState.textView ||
runtimeState.rendererMode === "static" ||
runtimeState.rendererMode === "text"
) {
return false;
}
var target = anchor.getAttribute("target");
var download = anchor.getAttribute("download");
return (
(!target || target === "_self") &&
(download === null || download === undefined)
);
}

function semanticStatesContractIsValid(semanticStates) {
return sameContractValue(semanticStates, {
certainty_ids: CERTAINTY_IDS,
preflight_ids: PREFLIGHT_IDS,
quality_resolution_ids: QUALITY_RESOLUTION_IDS,
authority_decision_ids: [
"PENDING",
"APPROVED",
"REJECTED",
"RECOVERY_REQUIRED"
],
comparison_side_ids: COMPARISON_SIDE_IDS
});
}

function sceneContractIsValid(profile) {
if (!profile || !profile.scene) {
return false;
}
var scene = profile.scene;
var expected = SCENE_CONTRACT_BY_PROFILE_ID[profile.profile_id];
if (
!expected ||
!hasExactKeys(scene, [
"scene_id",
"geometry_recipe_id",
"required_node_refs",
"phase_effects",
"semantic_state_refs",
"interaction_ids",
"comparison_mode",
"role_source_ref",
"preflight"
]) ||
scene.scene_id !== profile.profile_id ||
scene.geometry_recipe_id !== RECIPE_BY_PROFILE_ID[profile.profile_id] ||
!sameValues(scene.required_node_refs, expected.required_node_refs) ||
!scene.required_node_refs.every(function (nodeId) {
return includes(profile.platform_path, nodeId);
}) ||
!sameValues(
scene.semantic_state_refs,
expected.semantic_state_refs
) ||
!sameValues(scene.interaction_ids, expected.interaction_ids) ||
scene.comparison_mode !== expected.comparison_mode ||
scene.role_source_ref !== "case.roles" ||
!scene.phase_effects ||
!hasExactKeys(scene.phase_effects, PHASE_IDS)
) {
return false;
}
var effectsAreExact = PHASE_IDS.every(function (phaseId) {
var phaseEffects = scene.phase_effects[phaseId];
var expectedEffects = expected.phase_effects[phaseId];
return Boolean(
phaseEffects &&
hasExactKeys(phaseEffects, ["dominant", "supporting"]) &&
phaseEffects.dominant === expectedEffects[0] &&
sameValues(phaseEffects.supporting, expectedEffects.slice(1)) &&
includes(EFFECT_IDS, phaseEffects.dominant) &&
phaseEffects.supporting.every(function (effectId) {
return includes(EFFECT_IDS, effectId);
})
);
});
if (!effectsAreExact) {
return false;
}
if (expected.preflight_capability_refs === null) {
return scene.preflight === null;
}
return Boolean(
scene.preflight &&
hasExactKeys(
scene.preflight,
["mode", "state", "capability_refs"]
) &&
scene.preflight.mode === "illustrative-environment-review" &&
scene.preflight.state === "ENVIRONMENT_VALIDATION_REQUIRED" &&
sameValues(
scene.preflight.capability_refs,
expected.preflight_capability_refs
) &&
scene.preflight.capability_refs.every(function (capabilityId) {
return includes(profile.capability_refs, capabilityId);
})
);
}

function renderingContractIsValid(rendering) {
return Boolean(
rendering &&
hasExactKeys(rendering, [
"primary_renderer",
"fallback_renderers",
"palette",
"dimensions",
"camera_states",
"transition_contract",
"phase_effects",
"effect_ids",
"geometry_recipe_ids",
"portal",
"semantic_lod",
"scene_layers"
]) &&
rendering.primary_renderer === "webgl" &&
sameValues(rendering.fallback_renderers, ["static", "text"]) &&
sameValues(rendering.palette, BRAND_HEX) &&
sameValues(
rendering.dimensions,
["space-3d", "time-version", "evidence-authority"]
) &&
sameValues(rendering.camera_states, CAMERA_STATES) &&
rendering.transition_contract === "reversible" &&
sameValues(rendering.effect_ids, EFFECT_IDS) &&
sameValues(rendering.geometry_recipe_ids, GEOMETRY_RECIPE_IDS) &&
portalContractIsValid(rendering.portal) &&
semanticLodContractIsValid(rendering.semantic_lod) &&
sameValues(rendering.scene_layers, SCENE_LAYERS) &&
rendering.phase_effects &&
PHASE_IDS.every(function (phaseId) {
return rendering.phase_effects[phaseId] === PHASE_EFFECTS[phaseId];
})
);
}

function isValidWorldContract(world, contract) {
if (
!world ||
world.contract !== WORLD_CONTRACT_ID ||
world.synthetic !== true ||
!isNonEmptyText(world.synthetic_note) ||
!sameValues(world.phase_ids, PHASE_IDS) ||
!sameValues(world.view_ids, VIEW_IDS) ||
!sameValues(world.depth_ids, DEPTH_IDS) ||
!Array.isArray(world.phases) ||
world.phases.length !== PHASE_IDS.length ||
!Array.isArray(world.views) ||
world.views.length !== VIEW_IDS.length ||
!Array.isArray(world.depths) ||
world.depths.length !== DEPTH_IDS.length ||
!Array.isArray(world.profiles) ||
world.profiles.length !== contract.cases.length ||
!Array.isArray(world.industry_anchors) ||
world.industry_anchors.length !== contract.industries.length ||
!world.state ||
!sameValues(world.interaction_ids, INTERACTION_IDS) ||
!sameValues(world.scene_state_group_ids, SCENE_STATE_GROUP_IDS) ||
!semanticStatesContractIsValid(world.semantic_states) ||
!handoffContractIsValid(world.handoff) ||
!analyticsContractIsValid(world.experience_analytics) ||
!localizedActionsAreValid(world.actions) ||
!localizedControlsAreValid(world.controls) ||
!renderingContractIsValid(world.rendering)
) {
return false;
}
if (
!sameValues(ids(world.phases, "phase_id"), PHASE_IDS) ||
!sameValues(ids(world.views, "view_id"), VIEW_IDS) ||
!sameValues(ids(world.depths, "depth_id"), DEPTH_IDS) ||
!unique(ids(world.views, "numeric_id")) ||
!unique(ids(world.depths, "numeric_id"))
) {
return false;
}
if (
!world.phases.every(function (phase) {
return (
isNonEmptyText(phase.label) &&
isNonEmptyText(phase.content_ref) &&
phase.depth_id === PHASE_DEPTH_IDS[phase.phase_id]
);
}) ||
!world.depths.every(function (depth, index) {
return (
depth.numeric_id === index - 2 &&
isNonEmptyText(depth.label_ref)
);
}) ||
!world.views.every(function (view, index) {
return view.numeric_id === index;
})
) {
return false;
}

var state = world.state;
if (
state.story_param !== "outcome" ||
state.industry_param !== "industry" ||
state.step_param !== "step" ||
state.view_param !== "view" ||
state.depth_param !== "depth" ||
!includes(ids(contract.cases, "case_id"), state.default_story_id) ||
!includes(ids(contract.industries, "industry_id"), state.default_industry_id) ||
state.default_step_id !== "problem" ||
state.default_view_id !== "world" ||
state.default_depth_id !== "L-2"
) {
return false;
}

var caseIds = ids(contract.cases, "case_id");
var industryIds = ids(contract.industries, "industry_id");
var profileStoryIds = ids(world.profiles, "story_id");
var profileIds = ids(world.profiles, "profile_id");
var profilesAreValid = (
unique(profileStoryIds) &&
unique(profileIds) &&
caseIds.every(function (caseId) {
return includes(profileStoryIds, caseId);
}) &&
world.profiles.every(function (profile) {
var phaseContent = profile.phase_content;
return (
profile.synthetic === true &&
isNonEmptyText(profile.profile_id) &&
profile.profile_id === PROFILE_ID_BY_STORY_ID[profile.story_id] &&
isNonEmptyText(profile.tour_id) &&
isNonEmptyText(profile.solution_page_id) &&
Array.isArray(profile.capability_refs) &&
profile.capability_refs.length > 0 &&
profile.capability_refs.every(isNonEmptyText) &&
Array.isArray(profile.boundary_refs) &&
profile.boundary_refs.length > 0 &&
profile.boundary_refs.every(isNonEmptyText) &&
Array.isArray(profile.platform_path) &&
profile.platform_path.length > 1 &&
profile.platform_path.every(isNonEmptyText) &&
Array.isArray(profile.evidence_rewind_path) &&
isEvidenceRewind(
profile.platform_path,
profile.evidence_rewind_path
) &&
phaseContent &&
PHASE_IDS.every(function (phaseId) {
return isNonEmptyText(phaseContent[phaseId]);
}) &&
sceneContractIsValid(profile)
);
})
);
if (!profilesAreValid) {
return false;
}

var anchorIndustryIds = ids(world.industry_anchors, "industry_id");
var anchorIds = ids(world.industry_anchors, "anchor_id");
var anchorsAreValid = (
unique(anchorIndustryIds) &&
unique(anchorIds) &&
industryIds.every(function (industryId) {
return includes(anchorIndustryIds, industryId);
}) &&
world.industry_anchors.every(function (anchor) {
return (
anchor.synthetic === true &&
isNonEmptyText(anchor.anchor_id) &&
finiteNumber(anchor.latitude) &&
anchor.latitude >= -90 &&
anchor.latitude <= 90 &&
finiteNumber(anchor.longitude) &&
anchor.longitude >= -180 &&
anchor.longitude <= 180 &&
Array.isArray(anchor.recommended_case_ids) &&
anchor.recommended_case_ids.length === caseIds.length &&
unique(anchor.recommended_case_ids) &&
anchor.recommended_case_ids.every(function (caseId) {
return includes(caseIds, caseId);
})
);
})
);
if (!anchorsAreValid || !world.node_labels) {
return false;
}
return world.profiles.every(function (profile) {
return profile.platform_path.concat(profile.evidence_rewind_path)
.every(function (nodeId) {
return isNonEmptyText(world.node_labels[nodeId]);
});
});
}

function profileFor(world, storyId) {
return findBy(world.profiles, "story_id", storyId);
}

function sceneForProfile(world, storyId) {
var profile = profileFor(world, storyId);
return profile && sceneContractIsValid(profile) ? profile.scene : null;
}

function sceneEffectForPhase(scene, phaseId) {
if (
!scene ||
!scene.phase_effects ||
!includes(PHASE_IDS, phaseId) ||
!scene.phase_effects[phaseId]
) {
return null;
}
return {
dominant: scene.phase_effects[phaseId].dominant,
supporting: scene.phase_effects[phaseId].supporting.slice()
};
}

function semanticSceneState(profile, state) {
var qualityResolution = includes(
QUALITY_RESOLUTION_IDS,
state.qualityResolution
)
? state.qualityResolution
: "UNRESOLVED";
var authorityDecision = state.authorityRecord &&
includes(
["PENDING"].concat(AUTHORITY_DECISION_IDS),
state.authorityRecord.decision
)
? state.authorityRecord.decision
: state.authorityConfirmed === true
? "APPROVED"
: "PENDING";
var certainty = qualityResolution === "UNRESOLVED"
? "UNKNOWN"
: authorityDecision === "PENDING"
? "PARTIAL"
: "KNOWN";
return {
certainty: certainty,
preflight: profile.scene.preflight
? profile.scene.preflight.state
: null,
"quality-resolution": qualityResolution,
"authority-decision": authorityDecision,
comparison: profile.scene.comparison_mode === "before-after"
? includes(COMPARISON_SIDE_IDS, state.comparisonSide)
? state.comparisonSide
: "AFTER"
: null
};
}

function semanticLodMetadata(world, profile, depthId) {
var level = findBy(
world.rendering.semantic_lod.levels,
"depth_id",
depthId
);
var canonicalNodeIds = [];
profile.scene.required_node_refs.concat(profile.platform_path)
.forEach(function (nodeId) {
if (
isNonEmptyText(nodeId) &&
world.node_labels[nodeId] &&
!includes(canonicalNodeIds, nodeId)
) {
canonicalNodeIds.push(nodeId);
}
});
function matching(pattern) {
return canonicalNodeIds.filter(function (nodeId) {
return pattern.test(nodeId);
});
}
var references = {
version: matching(/(?:^|-)(?:file|table|dataset|report)-version$/),
run: matching(/(?:^|-)(?:pipeline|quality|integrity|analytics)-run$/),
hash: matching(/(?:^|-)(?:hash|checksum)(?:-|$)/),
policy: matching(/(?:^|-)(?:policy|confirmation|authority)(?:-|$)/),
artifact: matching(
/(?:^|-)(?:evidence-package|file-version|table-version|dataset-version|report-version)$/
),
gap: matching(/(?:^|-)(?:finding|quality-finding|gap|exception)(?:-|$)/)
};
return {
depthId: depthId,
semanticId: level ? level.semantic_id : null,
kinds: level ? level.kinds.slice() : [],
labelBudget: level ? level.label_budget : 0,
canonicalNodeIds: canonicalNodeIds,
references: references,
visibleReferenceKinds: depthId === "L4"
? ["version", "run", "hash", "policy"]
: depthId === "L5"
? ["artifact", "gap"]
: []
};
}

function anchorFor(world, industryId) {
return findBy(world.industry_anchors, "industry_id", industryId);
}

function recommendedCaseIds(contract, industryId, world) {
var allowed = ids(contract.cases, "case_id");
var values;
if (world) {
var anchor = anchorFor(world, industryId) ||
anchorFor(world, world.state.default_industry_id);
values = anchor ? anchor.recommended_case_ids : [];
} else {
var industry = findBy(contract.industries, "industry_id", industryId) ||
findBy(
contract.industries,
"industry_id",
contract.default_industry_id
);
values = industry ? industry.recommended_case_ids : [];
}
return values.filter(function (caseId, index) {
return includes(allowed, caseId) && values.indexOf(caseId) === index;
});
}

function evidenceRewindPath(world, storyId) {
var profile = profileFor(world, storyId);
return profile ? profile.evidence_rewind_path.slice() : [];
}

function evidenceRewindFrame(world, storyId, progress) {
var path = evidenceRewindPath(world, storyId);
var count = Math.ceil(clamp(progress, 0, 1) * path.length);
return path.slice(0, count);
}

function latLonToCartesian(latitude, longitude, radius) {
var lat = degreesToRadians(latitude);
var lon = degreesToRadians(longitude);
var cosLat = Math.cos(lat);
var sphereRadius = finiteNumber(radius) ? radius : 1;
return {
x: sphereRadius * cosLat * Math.sin(lon),
y: sphereRadius * Math.sin(lat),
z: sphereRadius * cosLat * Math.cos(lon)
};
}

var WORLD_MAP_ENCODING_ALPHABET =
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
var worldCountryBoundaryCache = null;

function decodeWorldMapValue(encoded, cursor) {
var result = 0;
var shift = 0;
var value = 0;
do {
value = WORLD_MAP_ENCODING_ALPHABET.indexOf(
encoded.charAt(cursor.index)
);
cursor.index += 1;
if (value < 0) {
throw new Error("Invalid static world-map geometry.");
}
result |= (value & 31) << shift;
shift += 5;
} while (value & 32);
return result & 1 ? -((result + 1) >> 1) : result >> 1;
}

function worldCountryBoundarySegments() {
if (worldCountryBoundaryCache) {
return worldCountryBoundaryCache;
}
var segments = [];
WORLD_COUNTRY_OUTLINES_ENCODED.forEach(function (encoded) {
var cursor = {index: 0};
var longitude = 0;
var latitude = 0;
var previous = null;
while (cursor.index < encoded.length) {
longitude += decodeWorldMapValue(encoded, cursor);
latitude += decodeWorldMapValue(encoded, cursor);
var current = latLonToCartesian(
latitude / 100,
longitude / 100,
1.006
);
if (previous) {
segments.push(previous, current);
}
previous = current;
}
});
worldCountryBoundaryCache = segments;
return worldCountryBoundaryCache;
}

function normalizeVector(point) {
var length = Math.sqrt(
point.x * point.x + point.y * point.y + point.z * point.z
) || 1;
return {
x: point.x / length,
y: point.y / length,
z: point.z / length
};
}

function rotatePoint(point, rotation) {
var yaw = rotation && finiteNumber(rotation.yaw) ? rotation.yaw : 0;
var pitch = rotation && finiteNumber(rotation.pitch) ? rotation.pitch : 0;
var roll = rotation && finiteNumber(rotation.roll) ? rotation.roll : 0;
var cosYaw = Math.cos(yaw);
var sinYaw = Math.sin(yaw);
var cosPitch = Math.cos(pitch);
var sinPitch = Math.sin(pitch);
var cosRoll = Math.cos(roll);
var sinRoll = Math.sin(roll);
var yawX = point.x * cosYaw + point.z * sinYaw;
var yawZ = -point.x * sinYaw + point.z * cosYaw;
var pitchY = point.y * cosPitch - yawZ * sinPitch;
var pitchZ = point.y * sinPitch + yawZ * cosPitch;
return {
x: yawX * cosRoll - pitchY * sinRoll,
y: yawX * sinRoll + pitchY * cosRoll,
z: pitchZ
};
}

function isFrontFacing(point, threshold) {
return point.z >= (finiteNumber(threshold) ? threshold : 0);
}

function perspectiveProject(point, viewport, camera) {
var width = Math.max(1, viewport.width);
var height = Math.max(1, viewport.height);
var distance = camera && finiteNumber(camera.distance)
? camera.distance
: 3.2;
var metrics = worldViewportMetrics(
{width: width, height: height},
camera || {}
);
var focal = metrics.globeRadius * distance;
var denominator = Math.max(0.25, distance - point.z);
var scale = focal / denominator;
return {
x: width / 2 + point.x * scale,
y: height / 2 - point.y * scale,
depth: point.z,
scale: scale,
visible: isFrontFacing(point)
};
}

function projectGeoPoint(
latitude,
longitude,
rotation,
viewport,
camera,
radius
) {
var worldPoint = latLonToCartesian(latitude, longitude, radius);
var rotated = rotatePoint(worldPoint, rotation || {});
var projected = perspectiveProject(rotated, viewport, camera || {});
projected.world = worldPoint;
projected.rotated = rotated;
return projected;
}

function slerpPoints(start, end, progress) {
var left = normalizeVector(start);
var right = normalizeVector(end);
var dot = clamp(
left.x * right.x + left.y * right.y + left.z * right.z,
-1,
1
);
var angle = Math.acos(dot);
if (angle < 0.0001) {
return left;
}
var sine = Math.sin(angle);
var leftWeight = Math.sin((1 - progress) * angle) / sine;
var rightWeight = Math.sin(progress * angle) / sine;
return normalizeVector({
x: left.x * leftWeight + right.x * rightWeight,
y: left.y * leftWeight + right.y * rightWeight,
z: left.z * leftWeight + right.z * rightWeight
});
}

function greatCirclePoints(startAnchor, endAnchor, segments, elevation) {
var start = latLonToCartesian(
startAnchor.latitude,
startAnchor.longitude,
1
);
var end = latLonToCartesian(
endAnchor.latitude,
endAnchor.longitude,
1
);
var result = [];
var count = Math.max(2, segments || 32);
var index;
for (index = 0; index <= count; index += 1) {
var progress = index / count;
var unit = slerpPoints(start, end, progress);
var height = 1.025 + Math.sin(progress * Math.PI) * (elevation || 0.12);
result.push({
x: unit.x * height,
y: unit.y * height,
z: unit.z * height,
progress: progress
});
}
return result;
}

function deterministicSignals(seed, count) {
var state = stableHash(seed) || 1;
var values = [];
var index;
for (index = 0; index < count; index += 1) {
state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
var latitude = ((state & 65535) / 65535) * 120 - 60;
state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
var longitude = ((state & 65535) / 65535) * 360 - 180;
values.push({
latitude: latitude,
longitude: longitude,
pulse: (index % 5) / 5
});
}
return values;
}

function buildSphereMesh(latitudeSegments, longitudeSegments) {
var latSegments = Math.max(8, latitudeSegments || 24);
var lonSegments = Math.max(12, longitudeSegments || 40);
var positions = [];
var normals = [];
var indices = [];
var latitudeIndex;
var longitudeIndex;
for (latitudeIndex = 0; latitudeIndex <= latSegments; latitudeIndex += 1) {
var latitude = 90 - latitudeIndex * 180 / latSegments;
for (
longitudeIndex = 0;
longitudeIndex <= lonSegments;
longitudeIndex += 1
) {
var longitude = longitudeIndex * 360 / lonSegments - 180;
var point = latLonToCartesian(latitude, longitude, 1);
positions.push(point.x, point.y, point.z);
normals.push(point.x, point.y, point.z);
}
}
for (latitudeIndex = 0; latitudeIndex < latSegments; latitudeIndex += 1) {
for (
longitudeIndex = 0;
longitudeIndex < lonSegments;
longitudeIndex += 1
) {
var first = latitudeIndex * (lonSegments + 1) + longitudeIndex;
var second = first + lonSegments + 1;
indices.push(first, second, first + 1);
indices.push(second, second + 1, first + 1);
}
}
return {
positions: new Float32Array(positions),
normals: new Float32Array(normals),
indices: new Uint16Array(indices)
};
}

function cameraForAnchor(anchor, profileId, viewId, depthId) {
var profileOffset = ((stableHash(profileId) % 17) - 8) * 0.012;
var lod = DEPTH_LOD[depthId] || DEPTH_LOD["L-2"];
var viewDistance = viewId === "world" ? 0.34 :
viewId === "evidence" ? -0.08 : 0;
var viewZoom = viewId === "world" ? 0.9 :
viewId === "evidence" ? 1.04 : 1;
var depthRoll = lod.numeric <= 0
? profileOffset * 0.3
: profileOffset * 0.3 + lod.numeric * 0.006;
return {
yaw: -degreesToRadians(anchor.longitude) + profileOffset,
pitch: degreesToRadians(anchor.latitude) * 0.72,
roll: viewId === "evidence" ? -depthRoll : depthRoll,
distance: lod.distance + viewDistance,
zoom: clamp(lod.zoom * viewZoom, 0.7, 1.55),
targetX: profileOffset * lod.detail * 0.2,
targetY: -degreesToRadians(anchor.latitude) * lod.detail * 0.025,
targetZ: lod.numeric >= 3 ? 0.035 * lod.detail : 0,
semanticLevel: lod.semanticLevel,
detail: lod.detail
};
}

function easeCinematic(progress) {
var value = clamp(progress, 0, 1);
return value < 0.5
? 4 * value * value * value
: 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function interpolateCamera(fromCamera, toCamera, progress) {
var eased = easeCinematic(progress);
function between(key) {
var fromValue = finiteNumber(fromCamera[key]) ? fromCamera[key] : 0;
var toValue = finiteNumber(toCamera[key]) ? toCamera[key] : 0;
return fromValue + (toValue - fromValue) * eased;
}
return {
yaw: between("yaw"),
pitch: between("pitch"),
roll: between("roll"),
distance: between("distance"),
zoom: between("zoom"),
targetX: between("targetX"),
targetY: between("targetY"),
targetZ: between("targetZ"),
detail: between("detail"),
semanticLevel: progress >= 0.5
? toCamera.semanticLevel
: fromCamera.semanticLevel
};
}

function normalizedAngleDelta(fromValue, toValue) {
var delta = (toValue - fromValue) % TAU;
if (delta > Math.PI) {
delta -= TAU;
} else if (delta < -Math.PI) {
delta += TAU;
}
return delta;
}

function interpolateOrientation(fromRotation, toRotation, progress) {
if (progress <= 0) {
return {
yaw: fromRotation.yaw,
pitch: fromRotation.pitch,
roll: fromRotation.roll
};
}
if (progress >= 1) {
return {
yaw: toRotation.yaw,
pitch: toRotation.pitch,
roll: toRotation.roll
};
}
var eased = easeCinematic(progress);
return {
yaw: fromRotation.yaw +
normalizedAngleDelta(fromRotation.yaw, toRotation.yaw) * eased,
pitch: fromRotation.pitch +
(toRotation.pitch - fromRotation.pitch) * eased,
roll: fromRotation.roll +
normalizedAngleDelta(fromRotation.roll, toRotation.roll) * eased
};
}

function reverseCameraTransition(transition) {
return {
from: transition.to,
to: transition.from,
duration: transition.duration,
state: transition.reverseState || "exit",
reverseState: transition.state
};
}

function layerActivationMinimum(layerId) {
var minimumByLayer = {
jurisdiction: 1,
organisation: 1,
"physical-twin": 1,
"digital-twin": 1,
"data-flow": 0,
"control-membrane": 2,
"quality-gate": 2,
finding: 2,
"ai-path": 3,
"authority-gate": 3,
"version-crystal": 4,
"prior-version": 4,
"business-outcome": 4,
"evidence-rewind": 5
};
return Object.prototype.hasOwnProperty.call(minimumByLayer, layerId)
? minimumByLayer[layerId]
: 0;
}

function layerDepthMinimum(layerId) {
var minimumByLayer = {
planet: -2,
"world-map": -2,
atmosphere: -2,
"night-lights": -2,
clouds: -2,
"sun-shadow": -2,
satellites: -2,
aircraft: -2,
"data-flow": -2,
"active-flow-bloom": -2,
"camera-flight-motion": -2,
"micro-motion": -2,
jurisdiction: -1,
organisation: 0,
"physical-twin": 0,
"digital-twin": 0,
"control-membrane": 1,
"quality-gate": 1,
finding: 1,
"ai-path": 2,
"authority-gate": 2,
"business-outcome": 3,
"version-crystal": 3,
"prior-version": 4,
"focus-depth": 0,
"semantic-zoom": -2,
"volumetric-depth": -1,
"evidence-rewind": 5
};
return Object.prototype.hasOwnProperty.call(minimumByLayer, layerId)
? minimumByLayer[layerId]
: -2;
}

function layerRetainFloor(layerId) {
if (layerId === "evidence-rewind") {
return 0.035;
}
if (
layerId === "planet" ||
layerId === "world-map" ||
layerId === "atmosphere" ||
layerId === "sun-shadow"
) {
return 0.42;
}
if (
layerId === "jurisdiction" ||
layerId === "organisation" ||
layerId === "control-membrane" ||
layerId === "authority-gate" ||
layerId === "business-outcome"
) {
return 0.12;
}
return 0.075;
}

function sceneLayerPlan(phaseId, viewId, depthId) {
var phaseIndex = Math.max(0, PHASE_IDS.indexOf(phaseId));
var lod = DEPTH_LOD[depthId] || DEPTH_LOD[PHASE_DEPTH_IDS[phaseId]] ||
DEPTH_LOD["L-2"];
var passByLayer = {
planet: "sphere",
"world-map": "surface-lines",
atmosphere: "sphere",
"night-lights": "surface-points",
clouds: "atmospheric-lines",
"sun-shadow": "sphere",
jurisdiction: "jurisdiction-anchor",
organisation: "organisation-points",
"physical-twin": "twin-lines",
"digital-twin": "twin-lines",
satellites: "orbital-lines",
aircraft: "orbital-points",
"data-flow": "route-lines",
"control-membrane": "control-rings",
"quality-gate": "control-lines",
finding: "control-points",
"version-crystal": "version-lines",
"prior-version": "version-lines",
"ai-path": "authority-lines",
"authority-gate": "authority-lines",
"business-outcome": "outcome-points",
"evidence-rewind": "evidence-lines",
"focus-depth": "camera-composition",
"semantic-zoom": "camera-composition",
"volumetric-depth": "sphere",
"active-flow-bloom": "route-points",
"camera-flight-motion": "camera-composition",
"micro-motion": "orbital-points"
};
var dimensionByLayer = {
"version-crystal": "time-version",
"prior-version": "time-version",
"business-outcome": "time-version",
"evidence-rewind": "evidence-authority",
"ai-path": "evidence-authority",
"authority-gate": "evidence-authority",
"quality-gate": "evidence-authority",
finding: "evidence-authority"
};
return SCENE_LAYERS.map(function (layerId) {
var phaseReady = phaseIndex >= layerActivationMinimum(layerId);
var depthReady = lod.numeric >= layerDepthMinimum(layerId);
var active = phaseReady && depthReady;
if (layerId === "evidence-rewind") {
active = (
phaseId === "evidence" ||
viewId === "evidence"
) && depthReady;
}
if (layerId === "prior-version") {
active = (
phaseId === "outcome" ||
phaseId === "evidence"
) && depthReady;
}
var retainFloor = layerRetainFloor(layerId);
return {
layerId: layerId,
renderPass: passByLayer[layerId],
dimension: dimensionByLayer[layerId] || "space-3d",
active: active,
targetOpacity: active ? 1 : retainFloor,
retainFloor: retainFloor,
minimumDepth: layerDepthMinimum(layerId),
revealStart: clamp(
(layerDepthMinimum(layerId) + 2) / DEPTH_IDS.length,
0,
0.92
),
revealEnd: clamp(
(layerDepthMinimum(layerId) + 3) / DEPTH_IDS.length,
0.08,
1
),
focusAttenuation: active ? 1 : 0.34,
composition: (
passByLayer[layerId] === "camera-composition" ||
layerId === "sun-shadow" ||
layerId === "volumetric-depth"
)
};
});
}

function morphStageForPhase(phaseId) {
var stageByPhase = {
problem: "jurisdiction",
context: "organisation-system",
control: "controlled-use-case",
decision: "controlled-use-case",
outcome: "outcome-crystal",
evidence: "evidence-authority"
};
return stageByPhase[phaseId] || MORPH_STAGE_IDS[0];
}

function dominantEffectIntensity(effectId, timeValue, progress) {
var baseByEffect = {
"signal-dawn": 0.54,
"jurisdiction-morph": 0.68,
"control-membrane": 0.76,
"authority-gate": 0.84,
"version-crystallization": 0.92,
"reverse-evidence": 1
};
var base = baseByEffect[effectId] || 0.5;
var pulse = 0.88 + Math.sin((timeValue || 0) * 0.0024) * 0.12;
return clamp(base * pulse * (0.72 + clamp(progress, 0, 1) * 0.28), 0, 1);
}

function layerPlanById(layerPlan) {
var mapped = {};
(layerPlan || []).forEach(function (layer) {
mapped[layer.layerId] = layer;
});
return mapped;
}

function sceneTransitionFrame(
previousDescriptor,
nextDescriptor,
progress,
timeValue
) {
var prior = previousDescriptor || nextDescriptor;
var next = nextDescriptor || previousDescriptor;
if (!prior || !next) {
return null;
}
var rawProgress = clamp(progress, 0, 1);
var eased = easeCinematic(rawProgress);
var reversing = (
next.phaseIndex < prior.phaseIndex ||
(DEPTH_LOD[next.depthId] || DEPTH_LOD["L-2"]).numeric <
(DEPTH_LOD[prior.depthId] || DEPTH_LOD["L-2"]).numeric
);
var previousLayers = layerPlanById(prior.layerPlan);
var nextLayers = layerPlanById(next.layerPlan);
var layers = SCENE_LAYERS.map(function (layerId) {
var previousLayer = previousLayers[layerId] || {
active: false,
targetOpacity: layerRetainFloor(layerId),
retainFloor: layerRetainFloor(layerId)
};
var nextLayer = nextLayers[layerId] || previousLayer;
var retainFloor = Math.max(
previousLayer.retainFloor || 0,
nextLayer.retainFloor || 0
);
var fromOpacity = Math.max(
retainFloor,
previousLayer.targetOpacity || 0
);
var toOpacity = Math.max(retainFloor, nextLayer.targetOpacity || 0);
var opacity = fromOpacity + (toOpacity - fromOpacity) * eased;
return {
layerId: layerId,
active: previousLayer.active || nextLayer.active,
fromOpacity: fromOpacity,
toOpacity: toOpacity,
opacity: Math.max(retainFloor, opacity),
retainFloor: retainFloor,
revealProgress: toOpacity >= fromOpacity ? eased : 1 - eased,
reverseProgress: toOpacity < fromOpacity ? eased : 0,
focusAttenuation: nextLayer.focusAttenuation || 0.34,
renderPass: nextLayer.renderPass || previousLayer.renderPass,
dimension: nextLayer.dimension || previousLayer.dimension
};
});
var portalAnchorPoint = latLonToCartesian(
next.anchor.latitude,
next.anchor.longitude,
1.08
);
var portalFrame = portalTraversalFrame(
next.portal.contract,
portalAnchorPoint,
prior.depthId,
next.depthId,
eased
);
return {
progress: rawProgress,
easedProgress: eased,
direction: reversing ? "reverse" : "forward",
reversible: true,
cameraState: reversing ? "exit" : next.cameraState,
fromDescriptor: prior,
toDescriptor: next,
morphFromStage: prior.morph.stage,
morphToStage: next.morph.stage,
morphProgress: eased,
layers: layers,
portal: portalFrame,
semanticState: Object.assign({}, next.semanticState),
effectId: next.dominantEffect,
effectIntensity: dominantEffectIntensity(
next.dominantEffect,
timeValue,
eased
)
};
}

function phaseProgressClocks(descriptor, transitionFrame) {
var phaseIndex = descriptor.phaseIndex;
var transitionProgress = transitionFrame
? transitionFrame.easedProgress
: 1;
var enteringSameEvidence = Boolean(
transitionFrame &&
transitionFrame.fromDescriptor &&
transitionFrame.fromDescriptor.phaseId === "evidence"
);
var qualityProgress;
if (phaseIndex < PHASE_IDS.indexOf("control")) {
qualityProgress = 0.12;
} else if (phaseIndex === PHASE_IDS.indexOf("control")) {
qualityProgress = 0.24 + transitionProgress * 0.34;
} else if (phaseIndex === PHASE_IDS.indexOf("decision")) {
qualityProgress = 0.56 + transitionProgress * 0.34;
} else {
qualityProgress = 0.9;
}
var authorityProgress;
if (phaseIndex < PHASE_IDS.indexOf("decision")) {
authorityProgress = 0.12;
} else if (phaseIndex === PHASE_IDS.indexOf("decision")) {
authorityProgress = descriptor.authorityConfirmed
? 0.55 + transitionProgress * 0.35
: 0.22 + transitionProgress * 0.33;
} else {
authorityProgress = descriptor.authorityConfirmed ? 0.9 : 0.55;
}
var versionProgress;
if (phaseIndex < PHASE_IDS.indexOf("outcome")) {
versionProgress = 0.12;
} else if (phaseIndex === PHASE_IDS.indexOf("outcome")) {
versionProgress = 0.22 + transitionProgress * 0.76;
} else {
versionProgress = 0.98;
}
var evidenceProgress = (
descriptor.phaseId === "evidence" ||
descriptor.viewId === "evidence"
)
? enteringSameEvidence ? 1 : transitionProgress
: 0;
return {
quality: clamp(qualityProgress, 0, 1),
authority: clamp(authorityProgress, 0, 1),
version: clamp(versionProgress, 0, 1),
evidence: clamp(evidenceProgress, 0, 1),
authorityConfirmed: descriptor.authorityConfirmed === true
};
}

function activeLayerIds(layerPlan) {
return layerPlan.filter(function (layer) {
return layer.active;
}).map(function (layer) {
return layer.layerId;
});
}

function sceneDescriptor(world, state) {
var profile = profileFor(world, state.caseId);
var scene = sceneForProfile(world, state.caseId);
var anchor = anchorFor(world, state.industryId);
var phase = phaseById(world, state.stepId);
if (!profile || !scene || !anchor || !phase) {
return null;
}
var phaseIndex = PHASE_IDS.indexOf(state.stepId);
var cameraState = state.viewId === "evidence"
? "rewind"
: state.viewId === "world"
? "orbit"
: phaseIndex < 2
? "approach"
: phaseIndex < 4
? "enter"
: "focus";
var profileSeed = stableHash(profile.profile_id);
var activeSceneEffect = sceneEffectForPhase(scene, state.stepId);
var semanticState = semanticSceneState(profile, state);
var roleCount = Number.isInteger(state.roleLensCount)
? Math.max(0, state.roleLensCount)
: 0;
var roleLensIndex = normalizedRoleLensIndex(
state.roleLensIndex,
roleCount
);
var lodMetadata = semanticLodMetadata(
world,
profile,
state.depthId
);
return {
storyId: state.caseId,
profileId: profile.profile_id,
sceneId: scene.scene_id,
geometryRecipeId: scene.geometry_recipe_id,
phaseId: state.stepId,
phaseIndex: phaseIndex,
viewId: state.viewId,
depthId: state.depthId,
authorityConfirmed: state.authorityConfirmed === true,
qualityResolution: includes(
QUALITY_RESOLUTION_IDS,
state.qualityResolution
)
? state.qualityResolution
: "UNRESOLVED",
cameraState: cameraState,
camera: cameraForAnchor(
anchor,
profile.profile_id,
state.viewId,
state.depthId
),
dominantEffect: activeSceneEffect.dominant,
supportingEffects: activeSceneEffect.supporting,
basePhaseEffect: world.rendering.phase_effects[state.stepId],
layers: world.rendering.scene_layers.slice(),
layerPlan: sceneLayerPlan(state.stepId, state.viewId, state.depthId),
lod: DEPTH_LOD[state.depthId] || DEPTH_LOD["L-2"],
semanticLod: lodMetadata,
semanticState: semanticState,
roleLens: {
mode: roleLensIndex === null ? "all" : "index",
index: roleLensIndex,
count: roleCount
},
portal: {
contract: world.rendering.portal,
fallback: world.rendering.portal.fallback,
preserveWorldContext: world.rendering.portal.preserve_world_context
},
morph: {
from: morphStageForPhase(PHASE_IDS[Math.max(0, phaseIndex - 1)]),
to: morphStageForPhase(state.stepId),
stage: morphStageForPhase(state.stepId),
stageIndex: MORPH_STAGE_IDS.indexOf(morphStageForPhase(state.stepId)),
progress: phaseIndex / (PHASE_IDS.length - 1)
},
temporalVersion: {
phase: phaseIndex,
activeVersionNodeIds: lodMetadata.references.version.slice(),
priorVersionNodeIds: [],
retainPrior: state.stepId === "outcome" || state.stepId === "evidence"
},
evidenceAuthority: {
direction: state.stepId === "evidence" ? "reverse" : "forward",
platformPath: profile.platform_path.slice(),
rewindPath: profile.evidence_rewind_path.slice(),
path: state.stepId === "evidence"
? profile.evidence_rewind_path.slice()
: profile.platform_path.slice(),
humanGate: true,
gapsRemainVisible: true
},
geometry: {
orbitTilt: ((profileSeed % 31) - 15) * 0.01,
routeElevation: 0.08 + (profileSeed % 7) * 0.012,
divergence: 0.025 + (profileSeed % 5) * 0.009,
crystalSides: 4 + profileSeed % 5,
packetCount: 6 + profileSeed % 7
},
synthetic: profile.synthetic === true && anchor.synthetic === true,
anchor: anchor
};
}

function buildProjection(world, state, viewport, rotation) {
var descriptor = sceneDescriptor(world, state);
if (!descriptor) {
return null;
}
var camera = descriptor.camera;
var activeRotation = rotation || {
yaw: camera.yaw,
pitch: camera.pitch,
roll: camera.roll
};
var anchors = world.industry_anchors.map(function (anchor) {
var projected = projectGeoPoint(
anchor.latitude,
anchor.longitude,
activeRotation,
viewport,
camera,
1.025
);
return {
industryId: anchor.industry_id,
anchorId: anchor.anchor_id,
selected: anchor.industry_id === state.industryId,
x: projected.x,
y: projected.y,
depth: projected.depth,
scale: projected.scale,
visible: projected.visible
};
}).sort(function (left, right) {
return left.depth - right.depth;
});
var selectedAnchor = descriptor.anchor;
var routes = world.industry_anchors
.filter(function (anchor) {
return anchor.industry_id !== selectedAnchor.industry_id;
})
.map(function (anchor) {
var points = greatCirclePoints(
anchor,
selectedAnchor,
24,
descriptor.geometry.routeElevation
).map(function (point) {
var rotatedPoint = rotatePoint(point, activeRotation);
var projectedPoint = perspectiveProject(
rotatedPoint,
viewport,
camera
);
return {
x: projectedPoint.x,
y: projectedPoint.y,
depth: projectedPoint.depth,
front: isFrontFacing(rotatedPoint),
progress: point.progress
};
});
return {
from: anchor.industry_id,
to: selectedAnchor.industry_id,
points: points,
frontSegments: points.filter(function (point) {
return point.front;
}).length,
backSegments: points.filter(function (point) {
return !point.front;
}).length
};
});
return {
descriptor: descriptor,
camera: camera,
rotation: activeRotation,
anchors: anchors,
routes: routes,
signals: deterministicSignals(
state.caseId + ":" + state.industryId,
24
)
};
}

function identityMatrix() {
return new Float32Array([
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 0,
0, 0, 0, 1
]);
}

function multiplyMatrices(left, right) {
var output = new Float32Array(16);
var row;
var column;
var index;
for (column = 0; column < 4; column += 1) {
for (row = 0; row < 4; row += 1) {
var value = 0;
for (index = 0; index < 4; index += 1) {
value += left[index * 4 + row] * right[column * 4 + index];
}
output[column * 4 + row] = value;
}
}
return output;
}

function perspectiveMatrix(fieldOfView, aspect, near, far) {
var factor = 1 / Math.tan(fieldOfView / 2);
var range = 1 / (near - far);
return new Float32Array([
factor / aspect, 0, 0, 0,
0, factor, 0, 0,
0, 0, (near + far) * range, -1,
0, 0, near * far * range * 2, 0
]);
}

function translationMatrix(x, y, z) {
var matrix = identityMatrix();
matrix[12] = x;
matrix[13] = y;
matrix[14] = z;
return matrix;
}

function scalingMatrix(x, y, z) {
var matrix = identityMatrix();
matrix[0] = x;
matrix[5] = y;
matrix[10] = z;
return matrix;
}

function rotationMatrix(rotation) {
var yaw = rotation.yaw || 0;
var pitch = rotation.pitch || 0;
var roll = rotation.roll || 0;
var cy = Math.cos(yaw);
var sy = Math.sin(yaw);
var cx = Math.cos(pitch);
var sx = Math.sin(pitch);
var cz = Math.cos(roll);
var sz = Math.sin(roll);
var yawMatrix = new Float32Array([
cy, 0, -sy, 0,
0, 1, 0, 0,
sy, 0, cy, 0,
0, 0, 0, 1
]);
var pitchMatrix = new Float32Array([
1, 0, 0, 0,
0, cx, sx, 0,
0, -sx, cx, 0,
0, 0, 0, 1
]);
var rollMatrix = new Float32Array([
cz, sz, 0, 0,
-sz, cz, 0, 0,
0, 0, 1, 0,
0, 0, 0, 1
]);
return multiplyMatrices(
multiplyMatrices(yawMatrix, pitchMatrix),
rollMatrix
);
}

function compileShader(gl, type, source) {
var shader = gl.createShader(type);
if (!shader) {
return null;
}
gl.shaderSource(shader, source);
gl.compileShader(shader);
if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
gl.deleteShader(shader);
return null;
}
return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
var vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
var fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
if (!vertex || !fragment) {
if (vertex) {
gl.deleteShader(vertex);
}
if (fragment) {
gl.deleteShader(fragment);
}
return null;
}
var program = gl.createProgram();
gl.attachShader(program, vertex);
gl.attachShader(program, fragment);
gl.linkProgram(program);
gl.deleteShader(vertex);
gl.deleteShader(fragment);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
gl.deleteProgram(program);
return null;
}
return program;
}

function bufferData(gl, data, target) {
var buffer = gl.createBuffer();
gl.bindBuffer(target || gl.ARRAY_BUFFER, buffer);
gl.bufferData(target || gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
return buffer;
}

function flattenPoints(points) {
var values = [];
points.forEach(function (point) {
values.push(point.x, point.y, point.z);
});
return new Float32Array(values);
}

function crossVector(left, right) {
return {
x: left.y * right.z - left.z * right.y,
y: left.z * right.x - left.x * right.z,
z: left.x * right.y - left.y * right.x
};
}

function smallCircle(center, radius, segments) {
var normal = normalizeVector(center);
var reference = Math.abs(normal.y) > 0.82
? {x: 1, y: 0, z: 0}
: {x: 0, y: 1, z: 0};
var tangent = normalizeVector(crossVector(normal, reference));
var bitangent = normalizeVector(crossVector(normal, tangent));
var points = [];
var count = Math.max(8, segments || 32);
var index;
for (index = 0; index <= count; index += 1) {
var angle = index / count * TAU;
points.push({
x: center.x + tangent.x * Math.cos(angle) * radius +
bitangent.x * Math.sin(angle) * radius,
y: center.y + tangent.y * Math.cos(angle) * radius +
bitangent.y * Math.sin(angle) * radius,
z: center.z + tangent.z * Math.cos(angle) * radius +
bitangent.z * Math.sin(angle) * radius
});
}
return points;
}

function orbitalCircle(radius, tilt, segments) {
var points = [];
var count = Math.max(12, segments || 48);
var index;
for (index = 0; index <= count; index += 1) {
var angle = index / count * TAU;
points.push({
x: Math.cos(angle) * radius,
y: Math.sin(angle) * radius * Math.sin(tilt),
z: Math.sin(angle) * radius * Math.cos(tilt)
});
}
return points;
}

function pointMagnitude(point) {
return Math.sqrt(
point.x * point.x + point.y * point.y + point.z * point.z
);
}

function pointOnPath(path, progress, spherical) {
if (!path.length) {
return {x: 0, y: 0, z: 0};
}
if (path.length === 1) {
return {
x: path[0].x,
y: path[0].y,
z: path[0].z
};
}
var bounded = clamp(progress, 0, 1);
var segmentPosition = bounded * (path.length - 1);
var leftIndex = Math.min(
path.length - 2,
Math.floor(segmentPosition)
);
var segmentProgress = bounded >= 1
? 1
: segmentPosition - leftIndex;
var left = path[leftIndex];
var right = path[leftIndex + 1];
if (spherical === true) {
var unit = slerpPoints(left, right, segmentProgress);
var radius = pointMagnitude(left) +
(pointMagnitude(right) - pointMagnitude(left)) * segmentProgress;
return scalePoint(unit, radius);
}
return interpolatePoint(left, right, segmentProgress);
}

function addPoints(left, right) {
return {
x: left.x + right.x,
y: left.y + right.y,
z: left.z + right.z
};
}

function scalePoint(point, scale) {
return {
x: point.x * scale,
y: point.y * scale,
z: point.z * scale
};
}

function interpolatePoint(left, right, progress) {
return {
x: left.x + (right.x - left.x) * progress,
y: left.y + (right.y - left.y) * progress,
z: left.z + (right.z - left.z) * progress
};
}

function localFrame(center) {
var normal = normalizeVector(center);
var reference = Math.abs(normal.y) > 0.82
? {x: 1, y: 0, z: 0}
: {x: 0, y: 1, z: 0};
var tangent = normalizeVector(crossVector(normal, reference));
var bitangent = normalizeVector(crossVector(normal, tangent));
return {
normal: normal,
tangent: tangent,
bitangent: bitangent
};
}

function distance2d(left, right) {
var deltaX = right[0] - left[0];
var deltaY = right[1] - left[1];
return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function signedContourArea(points) {
var source = points.slice();
if (
source.length > 1 &&
source[0][0] === source[source.length - 1][0] &&
source[0][1] === source[source.length - 1][1]
) {
source.pop();
}
var area = 0;
source.forEach(function (point, index) {
var next = source[(index + 1) % source.length];
area += point[0] * next[1] - next[0] * point[1];
});
return area / 2;
}

function rotateClosedContour(points, startIndex) {
var source = points.slice(0, -1);
var rotated = source.slice(startIndex).concat(source.slice(0, startIndex));
rotated.push(rotated[0].slice());
return rotated;
}

function normalizeContourWindingAndStart(points) {
var source = points.map(function (point) {
return [Number(point[0]), Number(point[1])];
});
if (
source.length > 1 &&
source[0][0] === source[source.length - 1][0] &&
source[0][1] === source[source.length - 1][1]
) {
source.pop();
}
if (signedContourArea(source) < 0) {
source.reverse();
}
source.push(source[0].slice());
var startIndex = 0;
source.slice(0, -1).forEach(function (point, index) {
var candidate = source[startIndex];
if (
point[0] > candidate[0] ||
(point[0] === candidate[0] && point[1] < candidate[1])
) {
startIndex = index;
}
});
return rotateClosedContour(source, startIndex);
}

function resampleClosedContour(points, segments) {
var normalized = normalizeContourWindingAndStart(points);
var source = normalized.slice(0, -1);
var cumulative = [0];
var total = 0;
source.forEach(function (point, index) {
total += distance2d(point, source[(index + 1) % source.length]);
cumulative.push(total);
});
var count = Math.max(8, segments || JURISDICTION_CONTOUR_SEGMENTS);
var sampled = [];
var sampleIndex;
var edgeIndex = 0;
for (sampleIndex = 0; sampleIndex < count; sampleIndex += 1) {
var target = total * sampleIndex / count;
while (
edgeIndex < source.length - 1 &&
cumulative[edgeIndex + 1] < target
) {
edgeIndex += 1;
}
var edgeStart = source[edgeIndex];
var edgeEnd = source[(edgeIndex + 1) % source.length];
var edgeLength = cumulative[edgeIndex + 1] - cumulative[edgeIndex];
var edgeProgress = edgeLength > 0
? (target - cumulative[edgeIndex]) / edgeLength
: 0;
sampled.push([
edgeStart[0] + (edgeEnd[0] - edgeStart[0]) * edgeProgress,
edgeStart[1] + (edgeEnd[1] - edgeStart[1]) * edgeProgress
]);
}
sampled.push(sampled[0].slice());
return normalizeContourWindingAndStart(sampled);
}

function jurisdictionProfileForAnchor(anchor) {
var shapeId = anchor && JURISDICTION_PROFILE_BY_ANCHOR_ID[
anchor.anchor_id
];
if (!shapeId) {
return null;
}
var profile = JURISDICTION_SILHOUETTES[shapeId];
return profile ? {
shapeId: shapeId,
synthetic: profile.synthetic === true,
knots: profile.knots.map(function (point) {
return point.slice();
})
} : null;
}

function projectJurisdictionContour(anchor, center, segments) {
var profile = jurisdictionProfileForAnchor(anchor);
if (!profile || profile.synthetic !== true) {
return [];
}
var contour = resampleClosedContour(profile.knots, segments);
var frame = localFrame(center);
return contour.map(function (point) {
return addPoints(
center,
addPoints(
scalePoint(frame.tangent, point[0] * 0.18),
addPoints(
scalePoint(frame.bitangent, point[1] * 0.18),
scalePoint(frame.normal, 0.004)
)
)
);
});
}

function contourForStage(center, stageId, segments, anchor) {
if (stageId === "jurisdiction") {
var jurisdiction = projectJurisdictionContour(
anchor,
center,
segments
);
if (jurisdiction.length) {
return jurisdiction;
}
}
var frame = localFrame(center);
var count = Math.max(24, segments || 48);
var points = [];
var index;
for (index = 0; index <= count; index += 1) {
var angle = index / count * TAU;
var cosine = Math.cos(angle);
var sine = Math.sin(angle);
var localX;
var localY;
var localZ;
if (stageId === "organisation-system") {
var systemRadius = 0.128 + Math.cos(angle * 4) * 0.022;
localX = cosine * systemRadius * 1.16;
localY = sine * systemRadius * 0.78;
localZ = Math.sin(angle * 2) * 0.012;
} else if (stageId === "controlled-use-case") {
localX = Math.sign(cosine) * Math.pow(Math.abs(cosine), 0.48) * 0.19;
localY = sine * 0.086 + Math.sin(angle * 2) * 0.018;
localZ = Math.cos(angle * 3) * 0.009;
} else if (stageId === "outcome-crystal") {
var diamondRadius = 0.16 /
Math.max(0.72, Math.abs(cosine) + Math.abs(sine));
localX = cosine * diamondRadius;
localY = sine * diamondRadius;
localZ = Math.sin(angle * 4) * 0.018;
} else if (stageId === "evidence-authority") {
var authorityRadius = 0.15 + Math.cos(angle * 6) * 0.012;
localX = cosine * authorityRadius;
localY = sine * authorityRadius;
localZ = Math.cos(angle * 3) * 0.028;
} else {
localX = cosine * 0.18;
localY = sine * 0.18;
localZ = 0;
}
points.push(addPoints(
center,
addPoints(
scalePoint(frame.tangent, localX),
addPoints(
scalePoint(frame.bitangent, localY),
scalePoint(frame.normal, localZ)
)
)
));
}
return points;
}

function interpolatePointPaths(fromPath, toPath, progress) {
var count = Math.min(fromPath.length, toPath.length);
var eased = easeCinematic(progress);
var output = [];
var index;
for (index = 0; index < count; index += 1) {
output.push(interpolatePoint(fromPath[index], toPath[index], eased));
}
return output;
}

function progressivePolyline(points, progress) {
if (!points.length) {
return [];
}
if (points.length === 1) {
return [points[0]];
}
var bounded = clamp(progress, 0, 1);
if (bounded <= 0) {
return [points[0], points[0]];
}
var scaled = bounded * (points.length - 1);
var completedSegment = Math.min(
points.length - 2,
Math.floor(scaled)
);
var segmentProgress = scaled - completedSegment;
var result = points.slice(0, completedSegment + 1);
if (bounded >= 1) {
return points.slice();
}
result.push(interpolatePoint(
points[completedSegment],
points[completedSegment + 1],
segmentProgress
));
return result;
}

function canonicalNodeCorridor(descriptor, activePoint) {
var corridorOrigin = activePoint || latLonToCartesian(
descriptor.anchor.latitude,
descriptor.anchor.longitude,
1.08
);
var frame = localFrame(corridorOrigin);
var path = descriptor.evidenceAuthority.platformPath;
var centerIndex = (path.length - 1) / 2;
return path.map(function (nodeId, index) {
var along = (index - centerIndex) * 0.098;
var lateral = Math.sin(index * 1.38) * 0.023;
var outward = 0.035 + index * 0.006;
return {
nodeId: nodeId,
sequence: index,
point: addPoints(
corridorOrigin,
addPoints(
scalePoint(frame.tangent, along),
addPoints(
scalePoint(frame.bitangent, lateral),
scalePoint(frame.normal, outward)
)
)
)
};
});
}

function evidenceTraversalFrame(corridor, rewindPath, progress) {
var nodeById = {};
corridor.forEach(function (node) {
nodeById[node.nodeId] = node;
});
var ordered = rewindPath.map(function (nodeId, index) {
var node = nodeById[nodeId];
return {
nodeId: nodeId,
rewindSequence: index,
sourceSequence: node ? node.sequence : -1,
point: node ? node.point : null
};
});
var bounded = clamp(progress, 0, 1);
var scaled = ordered.length > 1 ? bounded * (ordered.length - 1) : 0;
var reachedIndex = bounded > 0 ? Math.floor(scaled) : -1;
var completedCount = bounded >= 1
? ordered.length
: Math.max(0, reachedIndex + 1);
var visited = ordered.slice(0, completedCount);
var orderedPoints = ordered.map(function (node) {
return node.point;
}).filter(Boolean);
var trailPoints = progressivePolyline(orderedPoints, bounded);
var partialSegment = null;
if (
bounded > 0 &&
bounded < 1 &&
ordered.length > 1
) {
var segmentIndex = Math.min(ordered.length - 2, Math.floor(scaled));
partialSegment = {
fromNodeId: ordered[segmentIndex].nodeId,
toNodeId: ordered[segmentIndex + 1].nodeId,
progress: scaled - segmentIndex,
point: trailPoints[trailPoints.length - 1]
};
}
return {
orderedNodeIds: ordered.map(function (node) {
return node.nodeId;
}),
visitedNodeIds: visited.map(function (node) {
return node.nodeId;
}),
visitedNodes: visited,
trailPoints: trailPoints,
partialSegment: partialSegment,
completedCount: completedCount,
activeNode: visited.length ? visited[visited.length - 1] : null,
activePoint: trailPoints.length
? trailPoints[trailPoints.length - 1]
: null,
complete: completedCount === ordered.length
};
}

function corridorIndex(corridor, needle, fallback) {
var index = corridor.findIndex(function (node) {
return node.nodeId.indexOf(needle) >= 0;
});
return index >= 0 ? index : clamp(fallback, 0, corridor.length - 1);
}

function gateBarrier(center, frame, halfWidth, halfHeight) {
return [
addPoints(
center,
addPoints(
scalePoint(frame.bitangent, -halfWidth),
scalePoint(frame.normal, -halfHeight)
)
),
addPoints(
center,
addPoints(
scalePoint(frame.bitangent, halfWidth),
scalePoint(frame.normal, halfHeight)
)
),
addPoints(
center,
addPoints(
scalePoint(frame.bitangent, -halfWidth),
scalePoint(frame.normal, halfHeight)
)
),
addPoints(
center,
addPoints(
scalePoint(frame.bitangent, halfWidth),
scalePoint(frame.normal, -halfHeight)
)
)
];
}

function qualityGateFrame(corridor, progress, qualityResolution) {
var frameProgress = clamp(progress, 0, 1);
var resolution = includes(
QUALITY_RESOLUTION_IDS,
qualityResolution
)
? qualityResolution
: "UNRESOLVED";
var canContinue = (
resolution === "REMEDIATED_RECHECK_PASSED" ||
resolution === "ACCEPTED_EXCEPTION"
);
var rejected = resolution === "REJECTED";
var qualityIndex = corridorIndex(
corridor,
"quality",
Math.floor(corridor.length * 0.55)
);
var gateNode = corridor[qualityIndex];
var frame = localFrame(gateNode.point);
var before = addPoints(gateNode.point, scalePoint(frame.tangent, -0.075));
var after = addPoints(gateNode.point, scalePoint(frame.tangent, 0.082));
var arrivalProgress = clamp(frameProgress / 0.24, 0, 1);
var continuationProgress = canContinue
? clamp((frameProgress - 0.24) / 0.76, 0, 1)
: 0;
var findingWeight = clamp((frameProgress - 0.12) / 0.22, 0, 1) *
(1 - continuationProgress * 0.72);
var holdWeight = clamp((frameProgress - 0.18) / 0.12, 0, 1) *
(1 - continuationProgress);
var packetBeforeGate = interpolatePoint(
before,
gateNode.point,
arrivalProgress * 0.84
);
var packetAfterGate = interpolatePoint(
gateNode.point,
after,
continuationProgress
);
var packet = interpolatePoint(
packetBeforeGate,
packetAfterGate,
continuationProgress
);
var findingCenter = addPoints(
gateNode.point,
addPoints(
scalePoint(frame.bitangent, 0.105),
scalePoint(frame.normal, 0.026)
)
);
var findingScale = 0.06 + findingWeight * 0.94;
var continuationTrail = progressivePolyline(
[gateNode.point, after],
continuationProgress
);
return {
status: rejected
? "REJECTED"
: canContinue
? "CONTROLLED_CONTINUATION"
: "HELD",
visualStage: continuationProgress > 0.04
? "CONTINUING"
: arrivalProgress >= 0.75
? "AT_GATE"
: "APPROACHING_GATE",
resolution: resolution,
resolutionExplicit: resolution !== "UNRESOLVED",
releaseMode: resolution === "REMEDIATED_RECHECK_PASSED"
? "EXTERNAL_CHANGE_RECHECK_PASSED"
: resolution === "ACCEPTED_EXCEPTION"
? "ACCEPTED_EXCEPTION"
: resolution,
automatedRemediation: false,
barrier: gateBarrier(gateNode.point, frame, 0.072, 0.045),
packet: packet,
heldPackets: continuationProgress < 1 ? [packet] : [],
acceptedPackets: continuationProgress > 0 ? [packet] : [],
findingPoints: [findingCenter],
findingContour: contourForStage(
findingCenter,
"outcome-crystal",
24
).map(function (point) {
return interpolatePoint(findingCenter, point, 0.36 * findingScale);
}),
continuationTrail: continuationTrail,
arrivalProgress: arrivalProgress,
holdWeight: holdWeight,
findingWeight: findingWeight,
releaseWeight: continuationProgress,
continuationProgress: continuationProgress,
gateNodeId: gateNode.nodeId
};
}

function authorityGateFrame(corridor, progress, authorityState) {
var frameProgress = clamp(progress, 0, 1);
var authorityDecision = typeof authorityState === "string" &&
includes(["PENDING"].concat(AUTHORITY_DECISION_IDS), authorityState)
? authorityState
: authorityState === true
? "APPROVED"
: "PENDING";
var authorityConfirmed = authorityDecision === "APPROVED";
var authorityIndex = corridorIndex(
corridor,
"confirmation",
Math.floor(corridor.length * 0.72)
);
var authorityNode = corridor[authorityIndex];
var frame = localFrame(authorityNode.point);
var validationCenter = addPoints(
authorityNode.point,
scalePoint(frame.tangent, -0.11)
);
var validationWeight = clamp(frameProgress / 0.22, 0, 1);
var approvalWeight = authorityConfirmed === true
? clamp((frameProgress - 0.5) / 0.4, 0, 1)
: 0;
var holdWeight = validationWeight * (1 - approvalWeight);
var proposalProgress = authorityConfirmed === true
? 0.38 + approvalWeight * 0.58
: validationWeight * 0.38;
var proposal = interpolatePoint(
validationCenter,
addPoints(authorityNode.point, scalePoint(frame.tangent, 0.1)),
proposalProgress
);
var rolePoints = [0, 1, 2].map(function (index) {
var angle = index / 3 * TAU - Math.PI / 2;
return addPoints(
authorityNode.point,
addPoints(
scalePoint(frame.tangent, Math.cos(angle) * 0.13),
scalePoint(frame.bitangent, Math.sin(angle) * 0.1)
)
);
});
var responsibilityLines = [];
rolePoints.forEach(function (rolePoint) {
responsibilityLines.push(rolePoint, authorityNode.point);
});
return {
status: authorityDecision === "PENDING"
? "AWAITING_AUTHORITY"
: authorityDecision,
visualStage: approvalWeight >= 0.98
? "RELEASED"
: validationWeight >= 0.98
? "AT_GATE"
: "APPROACHING_GATE",
validationBarrier: gateBarrier(validationCenter, frame, 0.052, 0.034),
authorityDiamond: contourForStage(
authorityNode.point,
"evidence-authority",
36
),
proposal: proposal,
heldProposals: [proposal],
approvedProposals: [proposal],
rolePoints: rolePoints,
responsibilityLines: responsibilityLines,
approvalPulse: smallCircle(
authorityNode.point,
0.006 + approvalWeight * 0.084,
28
),
continuationTrail: progressivePolyline(
[
authorityNode.point,
addPoints(authorityNode.point, scalePoint(frame.tangent, 0.1))
],
approvalWeight
),
validationWeight: validationWeight,
holdWeight: holdWeight,
approvalWeight: approvalWeight,
continuationProgress: approvalWeight,
authorityNodeId: authorityNode.nodeId
};
}

function versionCrystalGeometry(activePoint, progress, authorityConfirmed) {
var frameProgress = clamp(progress, 0, 1);
var frame = localFrame(activePoint);
var crystalCenter = addPoints(
activePoint,
addPoints(
scalePoint(frame.normal, 0.12),
scalePoint(frame.tangent, 0.09)
)
);
var layers = [0, 1, 2, 3].map(function (index) {
var layerCenter = addPoints(
crystalCenter,
scalePoint(frame.normal, (index - 1.5) * 0.018)
);
var contour = contourForStage(layerCenter, "outcome-crystal", 32);
var assembled = clamp(frameProgress * 1.45 - index * 0.12, 0, 1);
return contour.map(function (point) {
var separated = addPoints(
point,
scalePoint(frame.bitangent, (index - 1.5) * 0.07)
);
return interpolatePoint(separated, point, assembled);
});
});
var struts = [];
[0, 8, 16, 24].forEach(function (index) {
struts.push(layers[0][index], layers[layers.length - 1][index]);
});
var priorSeparationProgress = clamp(frameProgress / 0.72, 0, 1);
var priorCenter = addPoints(
crystalCenter,
scalePoint(frame.tangent, -0.25 * priorSeparationProgress)
);
var prior = contourForStage(priorCenter, "outcome-crystal", 32).map(
function (point) {
return interpolatePoint(priorCenter, point, 0.66);
}
);
var lockCenter = addPoints(crystalCenter, scalePoint(frame.normal, 0.07));
var lockProgress = authorityConfirmed === true
? clamp((frameProgress - 0.52) / 0.4, 0, 1)
: 0;
var hashProgress = authorityConfirmed === true
? clamp((frameProgress - 0.62) / 0.32, 0, 1)
: 0;
return {
center: crystalCenter,
layers: layers,
struts: struts,
prior: prior,
priorCenter: priorCenter,
priorLink: [priorCenter, crystalCenter],
lockRing: smallCircle(
lockCenter,
0.004 + 0.048 * lockProgress,
28
),
hashTicks: contourForStage(
lockCenter,
"evidence-authority",
18
).map(function (point) {
return interpolatePoint(
lockCenter,
point,
0.035 + hashProgress * 0.965
);
}),
assemblyProgress: frameProgress,
lockProgress: lockProgress,
hashProgress: hashProgress,
priorSeparationProgress: priorSeparationProgress,
locked: authorityConfirmed === true && hashProgress >= 0.98
};
}

function membraneForCorridor(corridor) {
var rings = corridor.slice(1, -1).map(function (node, index) {
return smallCircle(node.point, 0.052 + index * 0.003, 28);
});
var leftRail = [];
var rightRail = [];
corridor.forEach(function (node) {
var frame = localFrame(node.point);
leftRail.push(addPoints(node.point, scalePoint(frame.bitangent, -0.055)));
rightRail.push(addPoints(node.point, scalePoint(frame.bitangent, 0.055)));
});
return {
rings: rings,
rails: [leftRail, rightRail]
};
}

function localOffset(center, frame, tangent, bitangent, normal) {
return addPoints(
center,
addPoints(
scalePoint(frame.tangent, tangent),
addPoints(
scalePoint(frame.bitangent, bitangent),
scalePoint(frame.normal, normal || 0)
)
)
);
}

function closedLocalContour(center, frame, coordinates) {
var points = coordinates.map(function (coordinate) {
return localOffset(
center,
frame,
coordinate[0],
coordinate[1],
coordinate[2] || 0
);
});
if (points.length) {
points.push(points[0]);
}
return points;
}

function portalDepthPosition(depthId) {
var numeric = (DEPTH_LOD[depthId] || DEPTH_LOD["L-1"]).numeric;
if (numeric <= -1) {
return 0;
}
if (numeric === 0) {
return 0.5;
}
return 1;
}

function filledCircleTriangles(center, ring) {
var triangles = [];
var index;
for (index = 0; index < ring.length - 1; index += 1) {
triangles.push(center, ring[index], ring[index + 1]);
}
return triangles;
}

function connectedRingTriangles(left, right) {
var triangles = [];
var count = Math.min(left.length, right.length) - 1;
var index;
for (index = 0; index < count; index += 1) {
triangles.push(
left[index],
right[index],
left[index + 1],
left[index + 1],
right[index],
right[index + 1]
);
}
return triangles;
}

function ribbonTriangles(points, halfWidth) {
if (points.length < 2) {
return [];
}
var left = [];
var right = [];
points.forEach(function (point) {
var frame = localFrame(point);
left.push(addPoints(point, scalePoint(frame.bitangent, -halfWidth)));
right.push(addPoints(point, scalePoint(frame.bitangent, halfWidth)));
});
return connectedRingTriangles(left, right);
}

function segmentedRibbonTriangles(points, halfWidth) {
var triangles = [];
var index;
for (index = 0; index + 1 < points.length; index += 2) {
triangles = triangles.concat(
ribbonTriangles([points[index], points[index + 1]], halfWidth)
);
}
return triangles;
}

function filledContourTriangles(contour) {
if (contour.length < 4) {
return [];
}
var source = contour.slice(0, -1);
var center = source.reduce(function (total, point) {
return addPoints(total, point);
}, {x: 0, y: 0, z: 0});
center = scalePoint(center, 1 / source.length);
return filledCircleTriangles(center, contour);
}

function localPanelTriangles(center, frame, halfWidth, halfHeight) {
var bottomLeft = localOffset(
center,
frame,
-halfWidth,
-halfHeight,
0
);
var bottomRight = localOffset(
center,
frame,
halfWidth,
-halfHeight,
0
);
var topRight = localOffset(
center,
frame,
halfWidth,
halfHeight,
0
);
var topLeft = localOffset(
center,
frame,
-halfWidth,
halfHeight,
0
);
return [
bottomLeft, bottomRight, topRight,
bottomLeft, topRight, topLeft
];
}

function localBoxTriangles(center, frame, width, height, depth) {
var halfWidth = width / 2;
var halfHeight = height / 2;
var halfDepth = depth / 2;
var corners = [
localOffset(center, frame, -halfWidth, -halfHeight, -halfDepth),
localOffset(center, frame, halfWidth, -halfHeight, -halfDepth),
localOffset(center, frame, halfWidth, halfHeight, -halfDepth),
localOffset(center, frame, -halfWidth, halfHeight, -halfDepth),
localOffset(center, frame, -halfWidth, -halfHeight, halfDepth),
localOffset(center, frame, halfWidth, -halfHeight, halfDepth),
localOffset(center, frame, halfWidth, halfHeight, halfDepth),
localOffset(center, frame, -halfWidth, halfHeight, halfDepth)
];
var faces = [
[0, 1, 2], [0, 2, 3],
[4, 6, 5], [4, 7, 6],
[0, 4, 5], [0, 5, 1],
[3, 2, 6], [3, 6, 7],
[0, 3, 7], [0, 7, 4],
[1, 5, 6], [1, 6, 2]
];
return faces.reduce(function (triangles, face) {
triangles.push(
corners[face[0]],
corners[face[1]],
corners[face[2]]
);
return triangles;
}, []);
}

function amplifiedPoints(points, center, scale) {
return points.map(function (point) {
return {
x: center.x + (point.x - center.x) * scale,
y: center.y + (point.y - center.y) * scale,
z: center.z + (point.z - center.z) * scale
};
});
}

function recipeSpatialMasses(recipeId, lineSets, width) {
return lineSets.map(function (lineSet, index) {
var closed = (
lineSet.primitive !== "LINES" &&
lineSet.points.length > 3 &&
pointMagnitude({
x: lineSet.points[0].x -
lineSet.points[lineSet.points.length - 1].x,
y: lineSet.points[0].y -
lineSet.points[lineSet.points.length - 1].y,
z: lineSet.points[0].z -
lineSet.points[lineSet.points.length - 1].z
}) < 0.0001
);
var points = lineSet.primitive === "LINES"
? segmentedRibbonTriangles(lineSet.points, width * 0.62)
: closed
? filledContourTriangles(lineSet.points)
: ribbonTriangles(lineSet.points, width);
return {
operation: "scene-spatial-mass-" + recipeId + "-" + (index + 1),
semanticPurpose: "case-specific-spatial-composition",
layerId: "data-flow",
tone: index % 2 === 0 ? "teal" : "surface",
opacity: index % 2 === 0 ? 0.26 : 0.18,
points: points
};
}).filter(function (surfaceSet) {
return surfaceSet.points.length >= 3;
});
}

function phaseSpatialMasses(descriptor, corridor, center, frame) {
var phaseId = descriptor.phaseId;
var surfaces = [];
if (phaseId === "problem") {
var origin = localOffset(center, frame, -0.62, 0, 0.01);
var split = localOffset(center, frame, -0.08, 0, 0.015);
var upper = localOffset(center, frame, 0.56, 0.24, 0.035);
var lower = localOffset(center, frame, 0.56, -0.24, -0.015);
surfaces.push(
{
operation: "phase-problem-visible-break-before",
semanticPurpose: "visible-break-and-divergence",
layerId: "data-flow",
tone: "white",
opacity: 0.2,
points: ribbonTriangles([origin, split], 0.052)
},
{
operation: "phase-problem-visible-break-after",
semanticPurpose: "visible-break-and-divergence",
layerId: "data-flow",
tone: "teal",
opacity: 0.32,
points: segmentedRibbonTriangles(
[
localOffset(center, frame, 0.08, 0.07, 0.02), upper,
localOffset(center, frame, 0.08, -0.07, 0), lower
],
0.045
)
},
{
operation: "phase-problem-break-plane",
semanticPurpose: "visible-break-and-divergence",
layerId: "data-flow",
tone: "ink",
opacity: 0.42,
points: localPanelTriangles(
localOffset(center, frame, 0, 0, 0.045),
frame,
0.035,
0.31
)
}
);
} else if (phaseId === "control") {
surfaces.push({
operation: "phase-control-selective-flow-envelope",
semanticPurpose: "control-envelope-only-around-selected-flow",
layerId: "control-membrane",
tone: "teal",
opacity: 0.3,
points: ribbonTriangles(
corridor.map(function (node) {
return addPoints(node.point, scalePoint(frame.normal, 0.055));
}),
0.1
)
});
} else if (phaseId === "decision") {
var decisionIndex = corridorIndex(
corridor,
"decision",
corridor.length - 2
);
var gateCenter = corridor[decisionIndex].point;
var opening = descriptor.authorityConfirmed ? 0.2 : 0.055;
var panelWidth = 0.18;
surfaces.push(
{
operation: "phase-decision-authority-gate-left",
semanticPurpose: "explicit-human-authority-gate",
layerId: "authority-gate",
tone: descriptor.authorityConfirmed ? "teal" : "surface",
opacity: descriptor.authorityConfirmed ? 0.24 : 0.4,
points: localPanelTriangles(
localOffset(
gateCenter,
frame,
0,
-(opening + panelWidth),
0.08
),
frame,
panelWidth,
0.3
)
},
{
operation: "phase-decision-authority-gate-right",
semanticPurpose: "explicit-human-authority-gate",
layerId: "authority-gate",
tone: descriptor.authorityConfirmed ? "teal" : "surface",
opacity: descriptor.authorityConfirmed ? 0.24 : 0.4,
points: localPanelTriangles(
localOffset(
gateCenter,
frame,
0,
opening + panelWidth,
0.08
),
frame,
panelWidth,
0.3
)
}
);
} else if (phaseId === "outcome") {
var resultPoint = addPoints(
corridor[corridor.length - 1].point,
scalePoint(frame.normal, 0.08)
);
surfaces.push({
operation: "phase-outcome-stabilized-result",
semanticPurpose: "physically-stabilized-business-result",
layerId: "version-crystal",
tone: descriptor.authorityConfirmed ? "teal" : "surface",
opacity: descriptor.authorityConfirmed ? 0.48 : 0.24,
points: localBoxTriangles(resultPoint, frame, 0.48, 0.34, 0.18)
});
} else if (phaseId === "evidence") {
surfaces.push(
{
operation: "phase-evidence-rewind-ribbon",
semanticPurpose: "reverse-evidence-to-origin",
layerId: "evidence-rewind",
tone: "teal",
opacity: 0.34,
points: ribbonTriangles(
corridor.slice().reverse().map(function (node) {
return addPoints(node.point, scalePoint(frame.normal, 0.06));
}),
0.07
)
},
{
operation: "phase-evidence-source-anchor",
semanticPurpose: "reverse-evidence-to-origin",
layerId: "evidence-rewind",
tone: "white",
opacity: 0.38,
points: localBoxTriangles(
addPoints(
corridor[0].point,
scalePoint(frame.normal, 0.08)
),
frame,
0.24,
0.24,
0.14
)
}
);
}
return surfaces;
}

function portalTraversalFrame(
portal,
anchorPoint,
fromDepthId,
toDepthId,
progress
) {
if (!portalContractIsValid(portal) || !anchorPoint) {
return null;
}
var bounded = clamp(progress, 0, 1);
var fromPosition = portalDepthPosition(fromDepthId);
var toPosition = portalDepthPosition(toDepthId);
var canonicalPosition = fromPosition +
(toPosition - fromPosition) * bounded;
var direction = toPosition < fromPosition ? "reverse" : "forward";
var traversalState;
if (direction === "reverse" && bounded > 0 && bounded < 1) {
traversalState = "returning";
} else if (canonicalPosition <= 0.02) {
traversalState = "outside";
} else if (canonicalPosition < 0.43) {
traversalState = "approaching";
} else if (canonicalPosition < 0.62) {
traversalState = "threshold";
} else {
traversalState = "inside";
}
var frame = localFrame(anchorPoint);
var portalCenter = addPoints(
scalePoint(normalizeVector(anchorPoint), 1.095),
scalePoint(frame.tangent, 0.018)
);
var apertureRing = smallCircle(portalCenter, 0.145, 40);
var tunnelCenters = [0, -0.13, -0.27].map(function (offset) {
return addPoints(portalCenter, scalePoint(frame.normal, offset));
});
var tunnelRings = tunnelCenters.map(function (center, index) {
return smallCircle(center, 0.145 - index * 0.014, 40);
});
var tunnelTriangles = [];
tunnelRings.slice(0, -1).forEach(function (ring, index) {
tunnelTriangles = tunnelTriangles.concat(
connectedRingTriangles(ring, tunnelRings[index + 1])
);
});
var cameraPath = [
addPoints(portalCenter, scalePoint(frame.normal, 0.38)),
addPoints(portalCenter, scalePoint(frame.normal, 0.08)),
addPoints(portalCenter, scalePoint(frame.normal, -0.3))
];
var cameraPoint = pointOnPath(
cameraPath,
canonicalPosition,
false
);
var outsideLod = DEPTH_LOD[portal.outside_depth_id];
var thresholdLod = DEPTH_LOD[portal.threshold_depth_id];
var insideLod = DEPTH_LOD[portal.inside_depth_id];
var cameraSegmentProgress = canonicalPosition <= 0.5
? canonicalPosition * 2
: (canonicalPosition - 0.5) * 2;
var cameraFromLod = canonicalPosition <= 0.5
? outsideLod
: thresholdLod;
var cameraToLod = canonicalPosition <= 0.5
? thresholdLod
: insideLod;
return {
contract: portal.contract,
portalId: portal.portal_id,
direction: direction,
traversalState: traversalState,
canonicalPosition: canonicalPosition,
cameraState: direction === "reverse"
? "exit"
: canonicalPosition < 0.35
? "approach"
: canonicalPosition < 0.68
? "enter"
: "focus",
cameraDepthIds: [
portal.outside_depth_id,
portal.threshold_depth_id,
portal.inside_depth_id
],
cameraPoint: cameraPoint,
cameraPath: cameraPath,
cameraTraversalActive: fromPosition !== toPosition,
cameraDistance: cameraFromLod.distance +
(cameraToLod.distance - cameraFromLod.distance) *
cameraSegmentProgress,
cameraZoom: cameraFromLod.zoom +
(cameraToLod.zoom - cameraFromLod.zoom) * cameraSegmentProgress,
cameraDetail: cameraFromLod.detail +
(cameraToLod.detail - cameraFromLod.detail) *
cameraSegmentProgress,
cameraSemanticLevel: canonicalPosition < 0.5
? outsideLod.semanticLevel
: canonicalPosition < 0.62
? thresholdLod.semanticLevel
: insideLod.semanticLevel,
apertureCenter: portalCenter,
apertureRing: apertureRing,
apertureTriangles: filledCircleTriangles(portalCenter, apertureRing),
tunnelRings: tunnelRings,
tunnelTriangles: tunnelTriangles,
preserveWorldContext: portal.preserve_world_context === true,
globeRetainFloor: portal.preserve_world_context === true ? 0.18 : 0,
reversible: portal.reversible === true,
fallback: portal.fallback
};
}

function caseSceneGeometry(
descriptor,
corridor,
activePoint,
transitionFrame
) {
var frame = localFrame(activePoint);
var recipeId = descriptor.geometryRecipeId;
var lineSets = [];
var pointSets = [];
var center = addPoints(activePoint, scalePoint(frame.normal, 0.12));
if (recipeId === "dual-estate-migration") {
var beforeEstate = closedLocalContour(center, frame, [
[-0.3, -0.18], [-0.08, -0.18], [-0.08, 0.18], [-0.3, 0.18]
]);
var afterEstate = closedLocalContour(center, frame, [
[0.08, -0.18], [0.3, -0.18], [0.3, 0.18], [0.08, 0.18]
]);
lineSets.push(
{operation: "dual-estate-before-boundary", points: beforeEstate},
{operation: "dual-estate-after-boundary", points: afterEstate},
{
operation: "dual-estate-migration-bridge",
points: [
beforeEstate[1], afterEstate[0],
beforeEstate[2], afterEstate[3]
],
primitive: "LINES"
}
);
pointSets.push({
operation: "dual-estate-controlled-cutover-points",
points: [beforeEstate[1], afterEstate[0]]
});
var selectedEstate = descriptor.semanticState.comparison === "BEFORE"
? beforeEstate
: afterEstate;
pointSets.push({
operation: "dual-estate-comparison-side",
semanticSide: descriptor.semanticState.comparison,
points: selectedEstate.slice(0, -1)
});
} else if (recipeId === "reporting-obligation-spine") {
var spine = corridor.map(function (node, index) {
return addPoints(
node.point,
scalePoint(frame.normal, 0.025 + index * 0.007)
);
});
var obligationRibs = [];
spine.forEach(function (point, index) {
var width = 0.045 + index * 0.009;
obligationRibs.push(
addPoints(point, scalePoint(frame.bitangent, -width)),
addPoints(point, scalePoint(frame.bitangent, width))
);
});
lineSets.push(
{operation: "reporting-obligation-spine", points: spine},
{
operation: "reporting-obligation-bindings",
points: obligationRibs,
primitive: "LINES"
}
);
pointSets.push({
operation: "reporting-obligation-delivery-checkpoints",
points: spine
});
} else if (recipeId === "quality-hold-corridor") {
var gateIndex = Math.min(
corridor.length - 1,
Math.max(1, corridorIndex(corridor, "quality", 2))
);
var gatePoint = corridor[gateIndex].point;
var holdRing = smallCircle(
addPoints(gatePoint, scalePoint(frame.normal, 0.03)),
0.105,
32
);
lineSets.push(
{
operation: "quality-hold-controlled-corridor",
points: corridor.slice(0, gateIndex + 1).map(function (node) {
return node.point;
})
},
{operation: "quality-hold-resolution-ring", points: holdRing}
);
pointSets.push({
operation: "quality-hold-blocked-packet",
points: [gatePoint]
});
} else if (recipeId === "governed-analytics-lens") {
var lensCenter = corridor[
Math.max(0, corridor.length - 2)
].point;
[0.075, 0.125, 0.18].forEach(function (radius, index) {
lineSets.push({
operation: "governed-analytics-lens-" + (index + 1),
points: smallCircle(lensCenter, radius, 36)
});
});
lineSets.push({
operation: "governed-analytics-human-decision-axis",
points: [
addPoints(lensCenter, scalePoint(frame.bitangent, -0.22)),
addPoints(lensCenter, scalePoint(frame.bitangent, 0.22))
]
});
pointSets.push({
operation: "governed-analytics-authorized-run",
points: [lensCenter]
});
} else if (recipeId === "incident-recovery-branch") {
var branchPoint = corridor[
Math.max(1, Math.floor(corridor.length / 2))
].point;
var forwardPoint = addPoints(
branchPoint,
addPoints(
scalePoint(frame.tangent, 0.26),
scalePoint(frame.bitangent, 0.16)
)
);
var recoveryPoint = addPoints(
branchPoint,
addPoints(
scalePoint(frame.tangent, -0.24),
scalePoint(frame.bitangent, -0.18)
)
);
lineSets.push(
{
operation: "incident-recovery-forward-branch",
points: [branchPoint, forwardPoint]
},
{
operation: "incident-recovery-safe-return-branch",
points: [branchPoint, recoveryPoint]
},
{
operation: "incident-recovery-reconciliation-link",
points: [recoveryPoint, corridor[0].point]
}
);
pointSets.push({
operation: "incident-recovery-decision-fork",
points: [branchPoint, forwardPoint, recoveryPoint]
});
} else if (recipeId === "evidence-rewind-tree") {
var trunk = corridor.slice().reverse().map(function (node) {
return node.point;
});
var branches = [];
trunk.slice(0, -1).forEach(function (point, index) {
var direction = index % 2 === 0 ? 1 : -1;
branches.push(
point,
addPoints(
point,
addPoints(
scalePoint(frame.bitangent, direction * (0.08 + index * 0.01)),
scalePoint(frame.normal, 0.04)
)
)
);
});
lineSets.push(
{operation: "evidence-rewind-tree-trunk", points: trunk},
{
operation: "evidence-rewind-tree-branches",
points: branches,
primitive: "LINES"
}
);
pointSets.push({
operation: "evidence-rewind-canonical-node-leaves",
points: trunk
});
}
if (
descriptor.roleLens &&
descriptor.roleLens.mode === "index" &&
Number.isInteger(descriptor.roleLens.index) &&
descriptor.roleLens.count > 0
) {
var roleAngle = (
descriptor.roleLens.index / descriptor.roleLens.count * TAU
) - Math.PI / 2;
pointSets.push({
operation: "role-lens-selected-index",
roleIndex: descriptor.roleLens.index,
points: [
addPoints(
center,
addPoints(
scalePoint(frame.tangent, Math.cos(roleAngle) * 0.23),
scalePoint(frame.bitangent, Math.sin(roleAngle) * 0.18)
)
)
]
});
}
var scaleByRecipe = {
"dual-estate-migration": 1.72,
"reporting-obligation-spine": 1.48,
"quality-hold-corridor": 1.62,
"governed-analytics-lens": 1.78,
"incident-recovery-branch": 1.7,
"evidence-rewind-tree": 1.58
};
var sceneScale = scaleByRecipe[recipeId] || 1.5;
lineSets = lineSets.map(function (lineSet) {
return Object.assign({}, lineSet, {
points: amplifiedPoints(lineSet.points, center, sceneScale)
});
});
pointSets = pointSets.map(function (pointSet) {
return Object.assign({}, pointSet, {
points: amplifiedPoints(pointSet.points, center, sceneScale)
});
});
var widthByRecipe = {
"dual-estate-migration": 0.052,
"reporting-obligation-spine": 0.036,
"quality-hold-corridor": 0.048,
"governed-analytics-lens": 0.056,
"incident-recovery-branch": 0.05,
"evidence-rewind-tree": 0.042
};
var surfaceSets = recipeSpatialMasses(
recipeId,
lineSets,
widthByRecipe[recipeId] || 0.045
).concat(
phaseSpatialMasses(descriptor, corridor, center, frame)
);
var reveal = transitionFrame
? 0.16 + transitionFrame.easedProgress * 0.84
: 1;
surfaceSets = surfaceSets.map(function (surfaceSet) {
return Object.assign({}, surfaceSet, {
points: surfaceSet.points.map(function (point) {
return interpolatePoint(center, point, reveal);
})
});
});
return {
sceneId: descriptor.sceneId,
recipeId: recipeId,
semanticState: Object.assign({}, descriptor.semanticState),
semanticLod: descriptor.semanticLod,
lineSets: lineSets,
pointSets: pointSets,
surfaceSets: surfaceSets,
surfaceOperations: surfaceSets.map(function (surfaceSet) {
return surfaceSet.operation;
}),
spatialFootprintScale: sceneScale,
operations: lineSets.concat(pointSets).map(function (set) {
return set.operation;
})
};
}

function worldLineGeometry(world, descriptor, timeValue, transitionFrame) {
var active = descriptor.anchor;
var routes = [];
var routeIndex;
world.industry_anchors.forEach(function (anchor) {
if (anchor.industry_id === active.industry_id) {
return;
}
routes.push(greatCirclePoints(
anchor,
active,
32,
descriptor.geometry.routeElevation
));
});
var signals = deterministicSignals(
descriptor.storyId + ":" + descriptor.phaseId,
36
).map(function (signal) {
return latLonToCartesian(signal.latitude, signal.longitude, 1.012);
});
var packets = [];
var packetSprites = [];
for (
routeIndex = 0;
routeIndex < descriptor.geometry.packetCount;
routeIndex += 1
) {
var route = routes[routeIndex % routes.length];
var packetSeed = stableHash(
descriptor.storyId + ":" + descriptor.phaseId + ":" + routeIndex
);
var packetSpeed = 0.000052 + (packetSeed % 37) * 0.00000115;
var packetProgress = (
timeValue * packetSpeed + routeIndex / descriptor.geometry.packetCount
) % 1;
var packetIndex = Math.min(
route.length - 1,
Math.floor(packetProgress * route.length)
);
var packetPoint = route[packetIndex];
var packetSize = 3.5 + ((packetSeed >>> 8) % 24) * 0.085;
var packetIntensity = 0.46 + ((packetSeed >>> 16) % 41) / 100;
packets.push(packetPoint);
packetSprites.push({
point: packetPoint,
speed: packetSpeed,
size: packetSize,
intensity: packetIntensity,
routeIndex: routeIndex % routes.length
});
}
var activePoint = latLonToCartesian(
active.latitude,
active.longitude,
1.08
);
if (
transitionFrame &&
transitionFrame.fromDescriptor &&
transitionFrame.fromDescriptor.anchor
) {
var previousAnchor = transitionFrame.fromDescriptor.anchor;
var previousPoint = latLonToCartesian(
previousAnchor.latitude,
previousAnchor.longitude,
1
);
var targetPoint = latLonToCartesian(
active.latitude,
active.longitude,
1
);
var interpolatedAnchor = slerpPoints(
previousPoint,
targetPoint,
transitionFrame.easedProgress
);
activePoint = scalePoint(interpolatedAnchor, 1.08);
}
var frame = localFrame(activePoint);
var tangent = frame.tangent;
var corridor = canonicalNodeCorridor(descriptor, activePoint);
var progressClocks = phaseProgressClocks(
descriptor,
transitionFrame
);
var quality = qualityGateFrame(
corridor,
progressClocks.quality,
descriptor.qualityResolution
);
var authority = authorityGateFrame(
corridor,
progressClocks.authority,
descriptor.semanticState["authority-decision"]
);
var qualityDivergence = clamp(
quality.findingWeight * (0.35 + quality.holdWeight * 0.65),
0,
1
);
var physicalTwin = greatCirclePoints(
world.industry_anchors[0],
active,
28,
0.18
);
var digitalTwin = physicalTwin.map(function (point, index) {
var divergence = Math.sin(index / (physicalTwin.length - 1) * Math.PI) *
descriptor.geometry.divergence * qualityDivergence;
return {
x: point.x + tangent.x * divergence,
y: point.y + divergence * 0.35,
z: point.z + tangent.z * divergence
};
});
var cloudBands = [
orbitalCircle(1.035, 0.22, 56),
orbitalCircle(1.042, -0.31, 56)
];
var satelliteOrbits = [
orbitalCircle(1.22, 0.44 + descriptor.geometry.orbitTilt, 64),
orbitalCircle(1.31, -0.37 + descriptor.geometry.orbitTilt, 64)
];
var satellites = satelliteOrbits.map(function (orbit, index) {
return pointOnPath(
orbit,
(timeValue * 0.000025 + index * 0.43) % 1,
true
);
});
var aircraft = routes.slice(0, 3).map(function (route, index) {
return pointOnPath(
route,
(timeValue * 0.000045 + index * 0.27) % 1,
true
);
});
var morphFrom = transitionFrame
? transitionFrame.morphFromStage
: descriptor.morph.from;
var morphTo = transitionFrame
? transitionFrame.morphToStage
: descriptor.morph.stage;
var morphProgress = transitionFrame
? transitionFrame.morphProgress
: 1;
var morphFromAnchor = transitionFrame &&
transitionFrame.fromDescriptor &&
transitionFrame.fromDescriptor.anchor
? transitionFrame.fromDescriptor.anchor
: active;
var morphContour = interpolatePointPaths(
contourForStage(activePoint, morphFrom, 48, morphFromAnchor),
contourForStage(activePoint, morphTo, 48, active),
morphProgress
);
var crystal = versionCrystalGeometry(
activePoint,
progressClocks.version,
progressClocks.authorityConfirmed
);
var membrane = membraneForCorridor(corridor);
var evidenceTraversal = evidenceTraversalFrame(
corridor,
descriptor.evidenceAuthority.rewindPath,
progressClocks.evidence
);
var portal = portalTraversalFrame(
descriptor.portal.contract,
activePoint,
transitionFrame && transitionFrame.fromDescriptor
? transitionFrame.fromDescriptor.depthId
: descriptor.depthId,
descriptor.depthId,
transitionFrame ? transitionFrame.easedProgress : 1
);
var caseScene = caseSceneGeometry(
descriptor,
corridor,
activePoint,
transitionFrame
);
var aircraftTrails = aircraft.map(function (point, index) {
var route = routes[index % routes.length];
var progress = (timeValue * 0.000045 + index * 0.27) % 1;
var previous = pointOnPath(
route,
Math.max(0, progress - 0.035),
true
);
return [previous, point];
});
return {
countryBoundaries: worldCountryBoundarySegments(),
routes: routes,
signals: signals,
packets: packets,
packetSprites: packetSprites,
physicalTwin: physicalTwin,
digitalTwin: digitalTwin,
qualityDivergence: qualityDivergence,
activePoint: activePoint,
cloudBands: cloudBands,
satelliteOrbits: satelliteOrbits,
satellites: satellites,
aircraft: aircraft,
jurisdiction: interpolatePointPaths(
contourForStage(
activePoint,
"jurisdiction",
JURISDICTION_CONTOUR_SEGMENTS,
morphFromAnchor
),
contourForStage(
activePoint,
"jurisdiction",
JURISDICTION_CONTOUR_SEGMENTS,
active
),
transitionFrame ? transitionFrame.easedProgress : 1
),
organisation: contourForStage(
activePoint,
"organisation-system",
48
),
morphContour: morphContour,
morphStage: morphTo,
corridor: corridor,
corridorPoints: corridor.map(function (node) {
return node.point;
}),
membrane: membrane,
quality: quality,
authority: authority,
crystal: crystal,
evidenceTraversal: evidenceTraversal,
portal: portal,
caseScene: caseScene,
progressClocks: progressClocks,
aircraftTrails: aircraftTrails
};
}

function postProcessApiSupported(gl) {
return [
"activeTexture",
"bindFramebuffer",
"bindRenderbuffer",
"bindTexture",
"checkFramebufferStatus",
"createFramebuffer",
"createRenderbuffer",
"createTexture",
"deleteFramebuffer",
"deleteRenderbuffer",
"deleteTexture",
"framebufferRenderbuffer",
"framebufferTexture2D",
"renderbufferStorage",
"texImage2D",
"texParameteri",
"uniform1i",
"uniform2fv"
].every(function (operation) {
return typeof gl[operation] === "function";
});
}

function safelyDeleteGlResource(operation) {
try {
operation();
} catch (error) {
return;
}
}

function destroyRenderTarget(gl, target) {
if (!target) {
return;
}
if (target.depth) {
safelyDeleteGlResource(function () {
gl.deleteRenderbuffer(target.depth);
});
}
if (target.texture) {
safelyDeleteGlResource(function () {
gl.deleteTexture(target.texture);
});
}
if (target.framebuffer) {
safelyDeleteGlResource(function () {
gl.deleteFramebuffer(target.framebuffer);
});
}
}

function createRgba8RenderTarget(gl, width, height, withDepth, mode) {
var framebuffer = gl.createFramebuffer();
var texture = gl.createTexture();
var depth = withDepth ? gl.createRenderbuffer() : null;
var internalFormat = mode === "webgl2" &&
typeof gl.RGBA8 === "number"
? gl.RGBA8
: gl.RGBA;
if (!framebuffer || !texture || (withDepth && !depth)) {
destroyRenderTarget(gl, {
framebuffer: framebuffer,
texture: texture,
depth: depth
});
return null;
}
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(
gl.TEXTURE_2D,
0,
internalFormat,
width,
height,
0,
gl.RGBA,
gl.UNSIGNED_BYTE,
null
);
gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
gl.framebufferTexture2D(
gl.FRAMEBUFFER,
gl.COLOR_ATTACHMENT0,
gl.TEXTURE_2D,
texture,
0
);
if (withDepth) {
gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
gl.renderbufferStorage(
gl.RENDERBUFFER,
gl.DEPTH_COMPONENT16,
width,
height
);
gl.framebufferRenderbuffer(
gl.FRAMEBUFFER,
gl.DEPTH_ATTACHMENT,
gl.RENDERBUFFER,
depth
);
}
var complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) ===
gl.FRAMEBUFFER_COMPLETE;
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.bindRenderbuffer(gl.RENDERBUFFER, null);
gl.bindTexture(gl.TEXTURE_2D, null);
if (!complete) {
destroyRenderTarget(gl, {
framebuffer: framebuffer,
texture: texture,
depth: depth
});
return null;
}
return {
framebuffer: framebuffer,
texture: texture,
depth: depth,
width: width,
height: height,
format: "RGBA8"
};
}

function createPostProcessPipeline(gl, sources, mode) {
var pipeline = {
enabled: false,
mode: mode,
reason: "unsupported-api",
scene: null,
ping: null,
pong: null,
blurProgram: null,
compositeProgram: null,
quadBuffer: null,
width: 0,
height: 0,
halfWidth: 0,
halfHeight: 0,
allocations: 0,
passes: [],
adaptiveSkip: false,
frameCostAverageMs: 0
};
if (!postProcessApiSupported(gl)) {
return pipeline;
}
pipeline.blurProgram = createProgram(
gl,
sources.fullscreenVertex,
sources.blurFragment
);
pipeline.compositeProgram = createProgram(
gl,
sources.fullscreenVertex,
sources.compositeFragment
);
if (!pipeline.blurProgram || !pipeline.compositeProgram) {
pipeline.reason = "shader-unavailable";
if (pipeline.blurProgram) {
gl.deleteProgram(pipeline.blurProgram);
}
if (pipeline.compositeProgram) {
gl.deleteProgram(pipeline.compositeProgram);
}
pipeline.blurProgram = null;
pipeline.compositeProgram = null;
return pipeline;
}
pipeline.quadBuffer = bufferData(gl, new Float32Array([
-1, -1, 1, -1, -1, 1,
-1, 1, 1, -1, 1, 1
]));
if (!pipeline.quadBuffer) {
pipeline.reason = "quad-unavailable";
gl.deleteProgram(pipeline.blurProgram);
gl.deleteProgram(pipeline.compositeProgram);
pipeline.blurProgram = null;
pipeline.compositeProgram = null;
return pipeline;
}
pipeline.enabled = true;
pipeline.reason = "ready";
return pipeline;
}

function destroyPostProcessPipeline(gl, pipeline) {
if (!pipeline) {
return;
}
destroyRenderTarget(gl, pipeline.scene);
destroyRenderTarget(gl, pipeline.ping);
destroyRenderTarget(gl, pipeline.pong);
pipeline.scene = null;
pipeline.ping = null;
pipeline.pong = null;
if (pipeline.quadBuffer) {
safelyDeleteGlResource(function () {
gl.deleteBuffer(pipeline.quadBuffer);
});
}
if (pipeline.blurProgram) {
safelyDeleteGlResource(function () {
gl.deleteProgram(pipeline.blurProgram);
});
}
if (pipeline.compositeProgram) {
safelyDeleteGlResource(function () {
gl.deleteProgram(pipeline.compositeProgram);
});
}
pipeline.enabled = false;
pipeline.reason = "destroyed";
}

function resizePostProcessPipeline(gl, pipeline, width, height) {
if (!pipeline || !pipeline.enabled) {
return false;
}
var halfWidth = Math.max(1, Math.floor(width / 2));
var halfHeight = Math.max(1, Math.floor(height / 2));
if (
pipeline.width === width &&
pipeline.height === height &&
pipeline.halfWidth === halfWidth &&
pipeline.halfHeight === halfHeight &&
pipeline.scene &&
pipeline.ping &&
pipeline.pong
) {
return true;
}
var nextScene = createRgba8RenderTarget(
gl,
width,
height,
true,
pipeline.mode
);
var nextPing = createRgba8RenderTarget(
gl,
halfWidth,
halfHeight,
false,
pipeline.mode
);
var nextPong = createRgba8RenderTarget(
gl,
halfWidth,
halfHeight,
false,
pipeline.mode
);
if (!nextScene || !nextPing || !nextPong) {
destroyRenderTarget(gl, nextScene);
destroyRenderTarget(gl, nextPing);
destroyRenderTarget(gl, nextPong);
destroyPostProcessPipeline(gl, pipeline);
pipeline.reason = "framebuffer-incomplete";
return false;
}
destroyRenderTarget(gl, pipeline.scene);
destroyRenderTarget(gl, pipeline.ping);
destroyRenderTarget(gl, pipeline.pong);
pipeline.scene = nextScene;
pipeline.ping = nextPing;
pipeline.pong = nextPong;
pipeline.width = width;
pipeline.height = height;
pipeline.halfWidth = halfWidth;
pipeline.halfHeight = halfHeight;
pipeline.allocations += 1;
pipeline.reason = "ready";
return true;
}

function createWebGLRenderer(
canvas,
world,
initialState,
globalWindow,
lifecycle
) {
try {
return initializeWebGLRenderer(
canvas,
world,
initialState,
globalWindow,
lifecycle || {}
);
} catch (error) {
if (lifecycle && typeof lifecycle.onInitializationFailure === "function") {
lifecycle.onInitializationFailure(error);
}
return null;
}
}

function initializeWebGLRenderer(
canvas,
world,
initialState,
globalWindow,
lifecycle
) {
if (!canvas || typeof canvas.getContext !== "function") {
return null;
}
var options = {
alpha: true,
antialias: true,
depth: true,
powerPreference: "high-performance",
preserveDrawingBuffer: false
};
var gl = canvas.getContext("webgl2", options);
var mode = "webgl2";
if (!gl) {
gl = canvas.getContext("webgl", options) ||
canvas.getContext("experimental-webgl", options);
mode = "webgl1";
}
if (!gl) {
return null;
}
var sources = WEBGL_SHADER_SOURCES[mode];
var sphereProgram = createProgram(
gl,
sources.sphereVertex,
sources.sphereFragment
);
var lineProgram = createProgram(
gl,
sources.lineVertex,
sources.lineFragment
);
if (!sphereProgram || !lineProgram) {
if (sphereProgram) {
gl.deleteProgram(sphereProgram);
}
if (lineProgram) {
gl.deleteProgram(lineProgram);
}
return null;
}
var sphere = buildSphereMesh(28, 48);
var positionBuffer = bufferData(gl, sphere.positions);
var normalBuffer = bufferData(gl, sphere.normals);
var indexBuffer = bufferData(gl, sphere.indices, gl.ELEMENT_ARRAY_BUFFER);
var dynamicBuffer = gl.createBuffer();
var postFx = createPostProcessPipeline(gl, sources, mode);
var state = initialState;
var descriptor = sceneDescriptor(world, state);
var previousDescriptor = descriptor;
var activeTransitionFrame = sceneTransitionFrame(
descriptor,
descriptor,
1,
0
);
var camera = descriptor.camera;
var rotation = {
yaw: camera.yaw,
pitch: camera.pitch,
roll: camera.roll
};
var rotationFrom = {
yaw: rotation.yaw,
pitch: rotation.pitch,
roll: rotation.roll
};
var targetRotation = {
yaw: rotation.yaw,
pitch: rotation.pitch,
roll: rotation.roll
};
var orbitYaw = 0;
var targetCamera = camera;
var transitionFrom = camera;
var transitionStarted = 0;
var transitionDuration = CAMERA_TRANSITION_DURATION_MS;
var destroyed = false;
var contextLost = false;
var runtimeFailed = false;
var renderEvidence = {};
var lastWidth = 0;
var lastHeight = 0;

function attribute(program, name, buffer, size) {
var location = gl.getAttribLocation(program, name);
if (location < 0) {
return;
}
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.enableVertexAttribArray(location);
gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
}

function uniformMatrix(program, name, value) {
var location = gl.getUniformLocation(program, name);
if (location) {
gl.uniformMatrix4fv(location, false, value);
}
}

function uniformColor(program, name, value) {
var location = gl.getUniformLocation(program, name);
if (location) {
gl.uniform4fv(location, value);
}
}

function uniformFloat(program, name, value) {
var location = gl.getUniformLocation(program, name);
if (location) {
gl.uniform1f(location, value);
}
}

function uniformVector2(program, name, value) {
var location = gl.getUniformLocation(program, name);
if (location) {
gl.uniform2fv(location, value);
}
}

function textureUniform(program, name, texture, unit) {
var location = gl.getUniformLocation(program, name);
if (!location) {
return;
}
gl.activeTexture(gl.TEXTURE0 + unit);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.uniform1i(location, unit);
}

function bindRenderTarget(target) {
gl.bindFramebuffer(
gl.FRAMEBUFFER,
target ? target.framebuffer : null
);
gl.viewport(
0,
0,
target ? target.width : lastWidth,
target ? target.height : lastHeight
);
}

function clearRenderTarget(target) {
bindRenderTarget(target);
gl.clearColor(
BRAND_RGBA.ink[0],
BRAND_RGBA.ink[1],
BRAND_RGBA.ink[2],
0
);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function drawFullscreenBlur(
sourceTexture,
target,
direction,
strength,
layerId,
operation
) {
bindRenderTarget(target);
gl.disable(gl.DEPTH_TEST);
gl.disable(gl.CULL_FACE);
gl.disable(gl.BLEND);
gl.useProgram(postFx.blurProgram);
attribute(postFx.blurProgram, "aPosition", postFx.quadBuffer, 2);
textureUniform(postFx.blurProgram, "uTexture", sourceTexture, 0);
uniformVector2(
postFx.blurProgram,
"uTexel",
[1 / target.width, 1 / target.height]
);
uniformVector2(postFx.blurProgram, "uDirection", direction);
uniformFloat(postFx.blurProgram, "uStrength", strength);
gl.drawArrays(gl.TRIANGLES, 0, 6);
postFx.passes.push(operation);
recordComposition(layerId, operation, {
targetWidth: target.width,
targetHeight: target.height,
direction: direction.slice(),
format: target.format
});
}

function drawFullscreenComposite(
sharpTexture,
blurTexture,
options,
layerId,
operation
) {
bindRenderTarget(null);
gl.disable(gl.DEPTH_TEST);
gl.disable(gl.CULL_FACE);
if (options.additive) {
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
} else {
gl.disable(gl.BLEND);
}
gl.useProgram(postFx.compositeProgram);
attribute(postFx.compositeProgram, "aPosition", postFx.quadBuffer, 2);
textureUniform(postFx.compositeProgram, "uSharp", sharpTexture, 0);
textureUniform(postFx.compositeProgram, "uBlur", blurTexture, 1);
uniformVector2(
postFx.compositeProgram,
"uFocusCenter",
options.focusCenter || [0.5, 0.5]
);
uniformFloat(
postFx.compositeProgram,
"uFocusRadius",
options.focusRadius || 0.2
);
uniformFloat(
postFx.compositeProgram,
"uFocusFeather",
options.focusFeather || 0.22
);
uniformFloat(
postFx.compositeProgram,
"uContextAttenuation",
options.contextAttenuation || 0.3
);
uniformFloat(
postFx.compositeProgram,
"uCompositeMode",
options.additive ? 1 : 0
);
uniformFloat(
postFx.compositeProgram,
"uWeight",
options.weight || 0.18
);
gl.drawArrays(gl.TRIANGLES, 0, 6);
if (options.additive) {
gl.disable(gl.BLEND);
}
postFx.passes.push(operation);
recordComposition(layerId, operation, {
focusCenter: (options.focusCenter || [0.5, 0.5]).slice(),
contextAttenuation: options.contextAttenuation || 0.3,
additive: Boolean(options.additive)
});
}

function resize() {
var rect = typeof canvas.getBoundingClientRect === "function"
? canvas.getBoundingClientRect()
: {width: canvas.clientWidth || 960, height: canvas.clientHeight || 620};
var dpr = clamp(globalWindow.devicePixelRatio || 1, 1, 1.75);
var width = Math.max(1, Math.round(rect.width * dpr));
var height = Math.max(1, Math.round(rect.height * dpr));
if (width !== lastWidth || height !== lastHeight) {
canvas.width = width;
canvas.height = height;
lastWidth = width;
lastHeight = height;
}
postFx.adaptiveSkip = Boolean(
width < 640 ||
height < 420 ||
postFx.frameCostAverageMs > 24
);
if (postFx.enabled && !postFx.adaptiveSkip) {
resizePostProcessPipeline(gl, postFx, width, height);
}
gl.viewport(0, 0, width, height);
}

function viewProjection(activeCamera) {
var aspect = lastWidth / Math.max(1, lastHeight);
var metrics = worldViewportMetrics(
{width: lastWidth, height: lastHeight},
activeCamera
);
var framedFov = 2 * Math.atan(
lastHeight /
Math.max(
1,
2 * metrics.globeRadius * activeCamera.distance
)
);
var projection = perspectiveMatrix(
framedFov,
aspect,
0.1,
20
);
var view = translationMatrix(
-(activeCamera.targetX || 0),
-(activeCamera.targetY || 0),
-activeCamera.distance - (activeCamera.targetZ || 0)
);
return multiplyMatrices(projection, view);
}

function recordLayerDraw(layerId, operation, vertexCount, metadata) {
if (!renderEvidence[layerId]) {
renderEvidence[layerId] = {
layerId: layerId,
operations: [],
drawCalls: 0,
compositionApplications: 0,
vertexCount: 0
};
}
var evidence = renderEvidence[layerId];
evidence.operations.push(operation);
evidence.drawCalls += 1;
evidence.vertexCount += Math.max(0, vertexCount || 0);
if (metadata) {
Object.keys(metadata).forEach(function (key) {
evidence[key] = metadata[key];
});
}
}

function recordComposition(layerId, operation, metadata) {
if (!renderEvidence[layerId]) {
renderEvidence[layerId] = {
layerId: layerId,
operations: [],
drawCalls: 0,
compositionApplications: 0,
vertexCount: 0
};
}
renderEvidence[layerId].operations.push(operation);
renderEvidence[layerId].compositionApplications += 1;
if (metadata) {
Object.keys(metadata).forEach(function (key) {
renderEvidence[layerId][key] = metadata[key];
});
}
}

function drawDynamic(
layerId,
points,
primitive,
color,
pointSize,
model,
viewProjectionMatrix,
operation,
spriteStyle,
metadata
) {
if (!points.length) {
return false;
}
var data = flattenPoints(points);
gl.bindBuffer(gl.ARRAY_BUFFER, dynamicBuffer);
gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
gl.useProgram(lineProgram);
attribute(lineProgram, "aPosition", dynamicBuffer, 3);
uniformMatrix(lineProgram, "uModel", model);
uniformMatrix(lineProgram, "uViewProjection", viewProjectionMatrix);
uniformColor(lineProgram, "uColor", color);
var pointLocation = gl.getUniformLocation(lineProgram, "uPointSize");
if (pointLocation) {
gl.uniform1f(pointLocation, pointSize);
}
var spriteLocation = gl.getUniformLocation(lineProgram, "uPointSprite");
if (spriteLocation) {
gl.uniform1f(
spriteLocation,
primitive === gl.POINTS ? (spriteStyle || 1) : 0
);
}
gl.drawArrays(primitive, 0, points.length);
recordLayerDraw(
layerId,
operation || (primitive === gl.POINTS ? "point-sprites" : "line-geometry"),
points.length,
metadata
);
return true;
}

function draw(timeValue) {
if (destroyed || contextLost || runtimeFailed) {
return false;
}
try {
var frameMeasureStarted = globalWindow.performance &&
typeof globalWindow.performance.now === "function"
? globalWindow.performance.now()
: 0;
resize();
var transitionProgress = transitionStarted
? clamp((timeValue - transitionStarted) / transitionDuration, 0, 1)
: 1;
var activeCamera = interpolateCamera(
transitionFrom,
targetCamera,
transitionProgress
);
rotation = interpolateOrientation(
rotationFrom,
targetRotation,
transitionProgress
);
activeTransitionFrame = sceneTransitionFrame(
previousDescriptor,
descriptor,
transitionProgress,
timeValue
);
if (
activeTransitionFrame.portal &&
activeTransitionFrame.portal.cameraTraversalActive
) {
activeCamera.distance =
activeTransitionFrame.portal.cameraDistance;
activeCamera.zoom = activeTransitionFrame.portal.cameraZoom;
activeCamera.detail = activeTransitionFrame.portal.cameraDetail;
activeCamera.semanticLevel =
activeTransitionFrame.portal.cameraSemanticLevel;
}
camera = activeCamera;
if (transitionProgress >= 1) {
transitionStarted = 0;
camera = targetCamera;
rotation = {
yaw: targetRotation.yaw,
pitch: targetRotation.pitch,
roll: targetRotation.roll
};
previousDescriptor = descriptor;
}
var activeRotation = {
yaw: rotation.yaw + orbitYaw,
pitch: rotation.pitch,
roll: rotation.roll
};
var model = rotationMatrix(activeRotation);
var cloudModel = rotationMatrix({
yaw: activeRotation.yaw + timeValue * 0.000008,
pitch: activeRotation.pitch * 0.94,
roll: activeRotation.roll + 0.018
});
var satelliteModel = rotationMatrix({
yaw: activeRotation.yaw + timeValue * 0.000016,
pitch: activeRotation.pitch + 0.035,
roll: activeRotation.roll - 0.026
});
var aircraftModel = rotationMatrix({
yaw: activeRotation.yaw + timeValue * 0.000004,
pitch: activeRotation.pitch - 0.018,
roll: activeRotation.roll + 0.011
});
var dataModel = rotationMatrix({
yaw: activeRotation.yaw + timeValue * 0.000002,
pitch: activeRotation.pitch,
roll: activeRotation.roll
});
var vp = viewProjection(activeCamera);
var geometry = worldLineGeometry(
world,
descriptor,
timeValue,
activeTransitionFrame
);
var transitionLayers = layerPlanById(activeTransitionFrame.layers);
renderEvidence = {};
postFx.passes = [];
var postFxActive = Boolean(
postFx.enabled &&
!postFx.adaptiveSkip &&
postFx.scene &&
postFx.ping &&
postFx.pong
);

function layerOpacity(layerId) {
var layer = transitionLayers[layerId];
if (!layer) {
return 0;
}
var opacity = layer.opacity;
var dominantByEffect = {
"signal-dawn": ["night-lights", "data-flow"],
"jurisdiction-morph": ["jurisdiction", "organisation"],
"true-portal-traversal": ["jurisdiction", "organisation"],
"system-constellation": ["organisation", "data-flow"],
"capability-preflight": ["jurisdiction", "control-membrane"],
"control-membrane": [
"control-membrane",
"quality-gate",
"finding"
],
"digital-twin-divergence": ["physical-twin", "digital-twin"],
"data-quality-hold": ["quality-gate", "finding"],
"partial-unknown-state": ["finding", "authority-gate"],
"contract-diff": ["physical-twin", "digital-twin", "prior-version"],
"report-binding": ["version-crystal", "business-outcome"],
"analytics-run-lens": ["organisation", "business-outcome"],
"ai-boundary": ["ai-path", "authority-gate"],
"authority-gate": ["ai-path", "authority-gate"],
"role-lens": ["authority-gate", "organisation"],
"version-crystallization": [
"version-crystal",
"prior-version",
"business-outcome"
],
"controlled-release": ["quality-gate", "business-outcome"],
"incident-shockwave": ["finding", "data-flow"],
"recovery-branch": ["data-flow", "prior-version"],
"migration-bridge": ["data-flow", "organisation"],
"before-after": [
"physical-twin",
"digital-twin",
"prior-version"
],
"finding-trace": ["finding", "evidence-rewind"],
"evidence-strength-state": [
"evidence-rewind",
"authority-gate"
],
"evidence-package-assembly": [
"version-crystal",
"evidence-rewind"
],
"reverse-evidence": ["evidence-rewind"]
};
var dominantLayers = dominantByEffect[
activeTransitionFrame.effectId
] || [];
if (dominantLayers.indexOf(layerId) >= 0) {
opacity *= 0.72 + activeTransitionFrame.effectIntensity * 0.28;
} else if (
descriptor.viewId !== "world" &&
dominantLayers.indexOf(layerId) < 0
) {
opacity *= 0.2 + activeCamera.detail * 0.15;
}
return clamp(opacity, layer.retainFloor, 1);
}

function visible(layerId) {
return layerOpacity(layerId) > 0.012;
}

function rgba(base, alpha) {
return [base[0], base[1], base[2], clamp(alpha, 0, 1)];
}

function modelFingerprint(activeModel) {
return [
activeModel[0],
activeModel[2],
activeModel[5],
activeModel[8],
activeModel[10]
].map(function (value) {
return Number(value.toFixed(5));
}).join(":");
}

function drawSpherePass(
layerId,
activeModel,
shell,
opacity,
atmosphereValue,
fogValue,
nightAttenuation,
operation
) {
gl.useProgram(sphereProgram);
attribute(sphereProgram, "aPosition", positionBuffer, 3);
attribute(sphereProgram, "aNormal", normalBuffer, 3);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
uniformMatrix(sphereProgram, "uModel", activeModel);
uniformMatrix(sphereProgram, "uViewProjection", vp);
uniformColor(sphereProgram, "uInk", BRAND_RGBA.ink);
uniformColor(sphereProgram, "uTeal", BRAND_RGBA.teal);
uniformColor(sphereProgram, "uSurface", BRAND_RGBA.surface);
var sun = gl.getUniformLocation(sphereProgram, "uSunDirection");
if (sun) {
gl.uniform3fv(sun, [0.7, 0.35, 0.62]);
}
uniformFloat(sphereProgram, "uAtmosphere", atmosphereValue);
uniformFloat(sphereProgram, "uFog", fogValue);
uniformFloat(sphereProgram, "uOpacity", opacity);
uniformFloat(sphereProgram, "uShell", shell);
uniformFloat(
sphereProgram,
"uNightAttenuation",
nightAttenuation
);
gl.drawElements(
gl.TRIANGLES,
sphere.indices.length,
gl.UNSIGNED_SHORT,
0
);
recordLayerDraw(layerId, operation, sphere.indices.length, {
opacity: opacity,
nightAttenuation: nightAttenuation,
modelFingerprint: modelFingerprint(activeModel)
});
}

bindRenderTarget(postFxActive ? postFx.scene : null);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);
gl.clearColor(
BRAND_RGBA.ink[0],
BRAND_RGBA.ink[1],
BRAND_RGBA.ink[2],
BRAND_RGBA.ink[3]
);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

drawSpherePass(
"planet",
model,
0,
layerOpacity("planet"),
0.22,
descriptor.viewId === "world" ? 0.035 : 0.085,
0.2,
"planet-sphere"
);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
if (visible("world-map")) {
drawDynamic(
"world-map",
geometry.countryBoundaries,
gl.LINES,
rgba(
BRAND_RGBA.surface,
layerOpacity("world-map") *
(descriptor.viewId === "world" ? 0.78 : 0.5)
),
1,
dataModel,
vp,
"natural-earth-admin-0-boundaries",
0,
{
source: "natural-earth-110m-public-domain",
staticAsset: true
}
);
}
drawSpherePass(
"sun-shadow",
multiplyMatrices(model, scalingMatrix(1.004, 1.004, 1.004)),
0,
layerOpacity("sun-shadow") * 0.16,
0.05,
0.13,
0.08,
"night-side-attenuation-pass"
);

gl.disable(gl.CULL_FACE);
if (typeof gl.depthMask === "function") {
gl.depthMask(false);
}
drawSpherePass(
"atmosphere",
multiplyMatrices(model, scalingMatrix(1.045, 1.045, 1.045)),
1,
layerOpacity("atmosphere"),
1,
0,
0.34,
"separate-atmospheric-shell"
);
if (typeof gl.depthMask === "function") {
gl.depthMask(true);
}

if (visible("clouds")) {
geometry.cloudBands.forEach(function (band) {
drawDynamic(
"clouds",
band,
gl.LINE_STRIP,
rgba(BRAND_RGBA.surface, layerOpacity("clouds") * 0.22),
1,
cloudModel,
vp,
"cloud-parallax-band",
0,
{
parallaxSpeed: 0.000008,
modelFingerprint: modelFingerprint(cloudModel)
}
);
});
}

if (visible("jurisdiction")) {
drawDynamic(
"jurisdiction",
geometry.jurisdiction,
gl.LINE_STRIP,
rgba(BRAND_RGBA.teal, layerOpacity("jurisdiction") * 0.34),
1,
dataModel,
vp,
"jurisdiction-boundary-contour",
0,
{morphStage: geometry.morphStage}
);
}
if (visible("organisation")) {
drawDynamic(
"organisation",
geometry.morphContour,
gl.LINE_STRIP,
rgba(BRAND_RGBA.white, layerOpacity("organisation") * 0.9),
1,
dataModel,
vp,
"semantic-morph-contour",
0,
{
morphFrom: activeTransitionFrame.morphFromStage,
morphTo: activeTransitionFrame.morphToStage,
morphProgress: activeTransitionFrame.morphProgress
}
);
drawDynamic(
"organisation",
geometry.corridorPoints,
gl.POINTS,
rgba(BRAND_RGBA.white, layerOpacity("organisation") * 0.72),
5.4,
dataModel,
vp,
"connected-system-role-nodes",
2
);
geometry.caseScene.lineSets.forEach(function (lineSet) {
drawDynamic(
"organisation",
lineSet.points,
lineSet.primitive === "LINES" ? gl.LINES : gl.LINE_STRIP,
rgba(
lineSet.operation.indexOf("safe-return") >= 0
? BRAND_RGBA.surface
: BRAND_RGBA.teal,
layerOpacity("organisation") * 0.74
),
1,
dataModel,
vp,
lineSet.operation,
0,
{
sceneId: geometry.caseScene.sceneId,
geometryRecipeId: geometry.caseScene.recipeId,
semanticState: geometry.caseScene.semanticState
}
);
});
geometry.caseScene.pointSets.forEach(function (pointSet) {
drawDynamic(
"organisation",
pointSet.points,
gl.POINTS,
rgba(
BRAND_RGBA.white,
layerOpacity("organisation") * 0.86
),
5.6,
dataModel,
vp,
pointSet.operation,
2,
{
sceneId: geometry.caseScene.sceneId,
geometryRecipeId: geometry.caseScene.recipeId,
semanticState: geometry.caseScene.semanticState
}
);
});
}
geometry.caseScene.surfaceSets.forEach(function (surfaceSet) {
if (!visible(surfaceSet.layerId)) {
return;
}
var surfaceColor = surfaceSet.tone === "teal"
? BRAND_RGBA.teal
: surfaceSet.tone === "white"
? BRAND_RGBA.white
: surfaceSet.tone === "ink"
? BRAND_RGBA.ink
: BRAND_RGBA.surface;
drawDynamic(
surfaceSet.layerId,
surfaceSet.points,
gl.TRIANGLES,
rgba(
surfaceColor,
layerOpacity(surfaceSet.layerId) * surfaceSet.opacity
),
1,
dataModel,
vp,
surfaceSet.operation,
0,
{
sceneId: geometry.caseScene.sceneId,
geometryRecipeId: geometry.caseScene.recipeId,
phaseId: descriptor.phaseId,
semanticPurpose: surfaceSet.semanticPurpose
}
);
});

if (
geometry.portal &&
(visible("jurisdiction") || visible("organisation"))
) {
drawDynamic(
"jurisdiction",
geometry.portal.apertureTriangles,
gl.TRIANGLES,
rgba(
BRAND_RGBA.ink,
Math.max(
geometry.portal.globeRetainFloor,
layerOpacity("jurisdiction") * 0.64
)
),
1,
dataModel,
vp,
"true-portal-filled-aperture",
0,
{
portalId: geometry.portal.portalId,
traversalState: geometry.portal.traversalState,
direction: geometry.portal.direction,
canonicalPosition: geometry.portal.canonicalPosition,
preserveWorldContext: geometry.portal.preserveWorldContext
}
);
drawDynamic(
"jurisdiction",
geometry.portal.apertureRing,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.teal,
layerOpacity("jurisdiction") * 0.94
),
1,
dataModel,
vp,
"true-portal-threshold-ring",
0,
{
cameraDepthIds: geometry.portal.cameraDepthIds.slice(),
cameraState: geometry.portal.cameraState
}
);
drawDynamic(
"organisation",
geometry.portal.tunnelTriangles,
gl.TRIANGLES,
rgba(
BRAND_RGBA.surface,
layerOpacity("organisation") * 0.18
),
1,
dataModel,
vp,
"true-portal-filled-tunnel",
0,
{
reversible: geometry.portal.reversible,
fallback: geometry.portal.fallback
}
);
geometry.portal.tunnelRings.forEach(function (ring) {
drawDynamic(
"organisation",
ring,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.white,
layerOpacity("organisation") * 0.42
),
1,
dataModel,
vp,
"true-portal-tunnel-depth-ring"
);
});
drawDynamic(
"semantic-zoom",
geometry.portal.cameraPath,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.teal,
layerOpacity("semantic-zoom") * 0.16
),
1,
dataModel,
vp,
"portal-camera-L-1-L0-L1-path",
0,
{
cameraPoint: geometry.portal.cameraPoint,
traversalState: geometry.portal.traversalState
}
);
}

if (visible("data-flow")) {
geometry.routes.slice(
0,
descriptor.lod.numeric <= -1 ? 2 : 1
).forEach(function (route, routeIndex) {
drawDynamic(
"data-flow",
route,
gl.LINE_STRIP,
rgba(
routeIndex === descriptor.phaseIndex %
Math.max(1, geometry.routes.length)
? BRAND_RGBA.teal
: BRAND_RGBA.white,
layerOpacity("data-flow") * (
descriptor.lod.numeric >= -1 ? 0.16 : 0.42
)
),
1,
dataModel,
vp,
"system-to-system-route",
0,
{
parallaxSpeed: 0.000002,
modelFingerprint: modelFingerprint(dataModel)
}
);
});
drawDynamic(
"data-flow",
geometry.corridorPoints,
gl.LINE_STRIP,
rgba(BRAND_RGBA.teal, layerOpacity("data-flow") * 0.86),
1,
dataModel,
vp,
"canonical-business-process-corridor"
);
drawDynamic(
"data-flow",
geometry.corridorPoints,
gl.POINTS,
rgba(
BRAND_RGBA.white,
layerOpacity("data-flow") * (
descriptor.phaseId === "problem" ? 0.9 : 0.56
)
),
descriptor.phaseId === "problem" ? 6.8 : 4.8,
dataModel,
vp,
"initial-canonical-corridor-nodes",
2,
{
initialFrameVisible: descriptor.phaseId === "problem",
canonicalNodeCount: geometry.corridorPoints.length
}
);
}
if (visible("active-flow-bloom") && !postFxActive) {
var activeRoute = descriptor.lod.numeric <= -1
? geometry.routes[
descriptor.phaseIndex % Math.max(1, geometry.routes.length)
]
: geometry.corridorPoints;
drawDynamic(
"active-flow-bloom",
activeRoute,
gl.LINE_STRIP,
rgba(BRAND_RGBA.teal, layerOpacity("active-flow-bloom") * 0.13),
1,
dataModel,
vp,
"restrained-bloom-outer"
);
drawDynamic(
"active-flow-bloom",
activeRoute,
gl.POINTS,
rgba(BRAND_RGBA.teal, layerOpacity("active-flow-bloom") * 0.08),
5.6,
dataModel,
vp,
"restrained-bloom-sprites",
1,
{bloomDrawCount: 2}
);
}

if (visible("night-lights")) {
var cityTexture = geometry.signals.slice(
0,
descriptor.lod.numeric <= -1 ? 18 : 8
);
drawDynamic(
"night-lights",
cityTexture,
gl.POINTS,
rgba(
BRAND_RGBA.white,
layerOpacity("night-lights") * (
descriptor.lod.numeric <= -1 ? 0.26 : 0.075
)
),
descriptor.lod.numeric <= -1 ? 2.6 : 1.7,
model,
vp,
"subtle-night-city-texture",
1,
{dominant: false}
);
}
if (visible("micro-motion")) {
geometry.packetSprites.forEach(function (packet) {
drawDynamic(
"micro-motion",
[packet.point],
gl.POINTS,
rgba(
BRAND_RGBA.teal,
layerOpacity("micro-motion") * packet.intensity
),
packet.size,
dataModel,
vp,
"bounded-live-data-packet",
1,
{
speed: packet.speed,
size: packet.size,
intensity: packet.intensity,
routeIndex: packet.routeIndex
}
);
});
}

if (visible("physical-twin")) {
drawDynamic(
"physical-twin",
geometry.physicalTwin,
gl.LINE_STRIP,
rgba(BRAND_RGBA.surface, layerOpacity("physical-twin") * 0.58),
1,
dataModel,
vp,
"physical-process-twin"
);
}
if (visible("digital-twin")) {
drawDynamic(
"digital-twin",
geometry.digitalTwin,
gl.LINE_STRIP,
rgba(BRAND_RGBA.teal, layerOpacity("digital-twin") * 0.72),
1,
dataModel,
vp,
"digital-process-divergence"
,
0,
{qualityDivergence: geometry.qualityDivergence}
);
}

if (visible("satellites")) {
geometry.satelliteOrbits.forEach(function (orbit) {
drawDynamic(
"satellites",
orbit,
gl.LINE_STRIP,
rgba(BRAND_RGBA.surface, layerOpacity("satellites") * 0.19),
1,
satelliteModel,
vp,
"satellite-orbit-parallax",
0,
{
parallaxSpeed: 0.000016,
modelFingerprint: modelFingerprint(satelliteModel)
}
);
});
drawDynamic(
"satellites",
geometry.satellites,
gl.POINTS,
rgba(BRAND_RGBA.white, layerOpacity("satellites") * 0.82),
5,
satelliteModel,
vp,
"satellite-ring-sprites",
2
);
}
if (visible("aircraft")) {
drawDynamic(
"aircraft",
geometry.aircraft,
gl.POINTS,
rgba(BRAND_RGBA.teal, layerOpacity("aircraft") * 0.76),
4.4,
aircraftModel,
vp,
"aircraft-disc-sprites",
1,
{
parallaxSpeed: 0.000004,
modelFingerprint: modelFingerprint(aircraftModel)
}
);
}
if (visible("camera-flight-motion")) {
geometry.aircraftTrails.forEach(function (trail) {
drawDynamic(
"camera-flight-motion",
trail,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.white,
layerOpacity("camera-flight-motion") * 0.22
),
1,
aircraftModel,
vp,
"flight-only-motion-trail",
0,
{trailOnly: true}
);
});
}

if (visible("control-membrane")) {
geometry.membrane.rails.forEach(function (rail) {
drawDynamic(
"control-membrane",
rail,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.teal,
layerOpacity("control-membrane") * 0.72
),
1,
dataModel,
vp,
"selective-corridor-membrane-rail"
);
});
geometry.membrane.rings.forEach(function (ring) {
drawDynamic(
"control-membrane",
ring,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.teal,
layerOpacity("control-membrane") * 0.38
),
1,
dataModel,
vp,
"selective-corridor-membrane-ring"
);
});
}

if (visible("quality-gate")) {
drawDynamic(
"quality-gate",
geometry.quality.barrier,
gl.LINES,
rgba(BRAND_RGBA.white, layerOpacity("quality-gate") * 0.9),
1,
dataModel,
vp,
"physical-quality-barrier",
0,
{
state: geometry.quality.status,
resolution: geometry.quality.resolution,
resolutionExplicit: geometry.quality.resolutionExplicit,
automatedRemediation: geometry.quality.automatedRemediation,
gateNodeId: geometry.quality.gateNodeId,
heldPacketCount: geometry.quality.heldPackets.length
,
holdWeight: geometry.quality.holdWeight,
releaseWeight: geometry.quality.releaseWeight
}
);
drawDynamic(
"quality-gate",
[geometry.quality.packet],
gl.POINTS,
rgba(BRAND_RGBA.teal, layerOpacity("quality-gate")),
6.2,
dataModel,
vp,
"quality-controlled-packet",
geometry.quality.holdWeight > 0.42 ? 2 : 1,
{
holdWeight: geometry.quality.holdWeight,
releaseWeight: geometry.quality.releaseWeight
}
);
drawDynamic(
"quality-gate",
geometry.quality.continuationTrail,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.teal,
layerOpacity("quality-gate") * (
0.08 + geometry.quality.releaseWeight * 0.6
)
),
1,
dataModel,
vp,
"controlled-continuation",
0,
{progress: geometry.quality.continuationProgress}
);
}
if (visible("finding")) {
drawDynamic(
"finding",
geometry.quality.findingContour,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.teal,
layerOpacity("finding") * (
0.12 + geometry.quality.findingWeight * 0.76
)
),
1,
dataModel,
vp,
"quality-finding-materialization",
0,
{
createdFromHeldPacket: geometry.quality.holdWeight > 0,
findingWeight: geometry.quality.findingWeight
}
);
drawDynamic(
"finding",
geometry.quality.findingPoints,
gl.POINTS,
rgba(
BRAND_RGBA.white,
layerOpacity("finding") * (
0.08 + geometry.quality.findingWeight * 0.92
)
),
2.2 + geometry.quality.findingWeight * 4.2,
dataModel,
vp,
"finding-ring-sprite",
2,
{findingWeight: geometry.quality.findingWeight}
);
}

if (visible("ai-path")) {
var aiPath = geometry.corridorPoints.slice(
0,
Math.max(2, corridorIndex(
geometry.corridor,
"confirmation",
geometry.corridor.length - 1
) + 1)
);
aiPath.push(geometry.authority.proposal);
drawDynamic(
"ai-path",
aiPath,
gl.LINE_STRIP,
rgba(BRAND_RGBA.teal, layerOpacity("ai-path") * 0.86),
1,
dataModel,
vp,
"ai-proposal-to-validation-barrier",
0,
{state: geometry.authority.status}
);
drawDynamic(
"ai-path",
geometry.authority.validationBarrier,
gl.LINES,
rgba(BRAND_RGBA.white, layerOpacity("ai-path") * 0.84),
1,
dataModel,
vp,
"deterministic-validation-barrier"
);
}
if (visible("authority-gate")) {
drawDynamic(
"authority-gate",
geometry.authority.authorityDiamond,
gl.LINE_STRIP,
rgba(BRAND_RGBA.white, layerOpacity("authority-gate") * 0.92),
1,
dataModel,
vp,
"human-policy-authority-diamond",
0,
{
state: geometry.authority.status,
authorityNodeId: geometry.authority.authorityNodeId
}
);
drawDynamic(
"authority-gate",
geometry.authority.responsibilityLines,
gl.LINES,
rgba(BRAND_RGBA.surface, layerOpacity("authority-gate") * 0.62),
1,
dataModel,
vp,
"role-responsibility-links"
);
drawDynamic(
"authority-gate",
geometry.authority.rolePoints,
gl.POINTS,
rgba(BRAND_RGBA.teal, layerOpacity("authority-gate") * 0.9),
6.4,
dataModel,
vp,
"connected-authority-role-constellation",
2
);
drawDynamic(
"authority-gate",
geometry.authority.approvalPulse,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.teal,
layerOpacity("authority-gate") * (
0.04 + geometry.authority.approvalWeight * 0.6
)
),
1,
dataModel,
vp,
"approval-pulse",
0,
{approvalWeight: geometry.authority.approvalWeight}
);
}

if (visible("version-crystal")) {
geometry.crystal.layers.forEach(function (layer) {
drawDynamic(
"version-crystal",
layer,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.white,
layerOpacity("version-crystal") * 0.74
),
1,
dataModel,
vp,
"dataset-version-layer-assembly"
);
});
drawDynamic(
"version-crystal",
geometry.crystal.struts,
gl.LINES,
rgba(BRAND_RGBA.teal, layerOpacity("version-crystal") * 0.72),
1,
dataModel,
vp,
"dataset-version-layer-lock"
);
drawDynamic(
"version-crystal",
geometry.crystal.lockRing,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.teal,
layerOpacity("version-crystal") * (
0.04 + geometry.crystal.lockProgress * 0.86
)
),
1,
dataModel,
vp,
"immutable-version-lock",
0,
{lockProgress: geometry.crystal.lockProgress}
);
drawDynamic(
"version-crystal",
geometry.crystal.hashTicks,
gl.POINTS,
rgba(
BRAND_RGBA.white,
layerOpacity("version-crystal") * (
0.03 + geometry.crystal.hashProgress * 0.75
)
),
1.4 + geometry.crystal.hashProgress * 2.4,
dataModel,
vp,
"hash-tick-microanimation",
1,
{
locked: geometry.crystal.locked,
hashProgress: geometry.crystal.hashProgress
}
);
}
if (visible("prior-version")) {
drawDynamic(
"prior-version",
geometry.crystal.prior,
gl.LINE_STRIP,
rgba(BRAND_RGBA.surface, layerOpacity("prior-version") * 0.56),
1,
dataModel,
vp,
"prior-version-separated-contour"
);
drawDynamic(
"prior-version",
geometry.crystal.priorLink,
gl.LINE_STRIP,
rgba(BRAND_RGBA.white, layerOpacity("prior-version") * 0.42),
1,
dataModel,
vp,
"prior-version-lineage-link"
);
}
if (visible("business-outcome")) {
drawDynamic(
"business-outcome",
[geometry.crystal.center],
gl.POINTS,
rgba(
geometry.crystal.locked
? BRAND_RGBA.teal
: BRAND_RGBA.surface,
layerOpacity("business-outcome") * (
geometry.crystal.locked ? 1 : 0.58
)
),
9,
dataModel,
vp,
geometry.crystal.locked
? "authority-approved-outcome-core"
: "unconfirmed-outcome-core",
2,
{locked: geometry.crystal.locked}
);
}

if (visible("evidence-rewind")) {
var rewindGuide = descriptor.evidenceAuthority.rewindPath.map(
function (nodeId) {
return geometry.corridor.find(function (node) {
return node.nodeId === nodeId;
}).point;
}
);
drawDynamic(
"evidence-rewind",
rewindGuide,
gl.LINE_STRIP,
rgba(BRAND_RGBA.surface, layerOpacity("evidence-rewind") * 0.28),
1,
dataModel,
vp,
"canonical-evidence-rewind-guide",
0,
{
nodeSequence: descriptor.evidenceAuthority.rewindPath.slice(),
visitedNodeSequence:
geometry.evidenceTraversal.visitedNodeIds.slice()
}
);
var visitedPoints = geometry.evidenceTraversal.trailPoints;
if (visitedPoints.length) {
drawDynamic(
"evidence-rewind",
visitedPoints,
visitedPoints.length > 1 ? gl.LINE_STRIP : gl.POINTS,
rgba(BRAND_RGBA.white, layerOpacity("evidence-rewind") * 0.94),
6.2,
dataModel,
vp,
"exact-node-id-rewind-progression",
2,
{
nodeSequence: descriptor.evidenceAuthority.rewindPath.slice(),
visitedNodeSequence:
geometry.evidenceTraversal.visitedNodeIds.slice(),
partialSegment: geometry.evidenceTraversal.partialSegment
? Object.assign(
{},
geometry.evidenceTraversal.partialSegment,
{point: undefined}
)
: null
}
);
}
}

if (visible("volumetric-depth")) {
var volumeFrame = localFrame(geometry.activePoint);
var rays = [];
[-2, -1, 0, 1, 2].forEach(function (offset) {
var origin = addPoints(
geometry.activePoint,
scalePoint(volumeFrame.bitangent, offset * 0.035)
);
rays.push(
origin,
addPoints(
origin,
addPoints(
scalePoint(volumeFrame.normal, 0.26),
scalePoint(volumeFrame.tangent, offset * 0.012)
)
)
);
});
drawDynamic(
"volumetric-depth",
rays,
gl.LINES,
rgba(BRAND_RGBA.teal, layerOpacity("volumetric-depth") * 0.11),
1,
dataModel,
vp,
"restrained-volumetric-rays",
0,
{rayCount: rays.length / 2}
);
}

if (postFxActive) {
try {
recordComposition("focus-depth", "scene-framebuffer", {
width: postFx.scene.width,
height: postFx.scene.height,
format: postFx.scene.format,
depthAttached: Boolean(postFx.scene.depth)
});
drawFullscreenBlur(
postFx.scene.texture,
postFx.ping,
[1, 0],
1.05,
"focus-depth",
"semantic-context-blur-horizontal"
);
drawFullscreenBlur(
postFx.ping.texture,
postFx.pong,
[0, 1],
1.05,
"focus-depth",
"semantic-context-blur"
);
var projectedFocus = perspectiveProject(
rotatePoint(geometry.activePoint, activeRotation),
{width: lastWidth, height: lastHeight},
activeCamera
);
var focusCenter = [
clamp(projectedFocus.x / lastWidth, 0, 1),
clamp(1 - projectedFocus.y / lastHeight, 0, 1)
];
var contextAttenuation = clamp(
0.2 + activeCamera.detail * 0.15,
0.2,
0.35
);
drawFullscreenComposite(
postFx.scene.texture,
postFx.pong.texture,
{
focusCenter: focusCenter,
focusRadius: 0.17 + activeCamera.detail * 0.08,
focusFeather: 0.22,
contextAttenuation: contextAttenuation,
additive: false,
weight: 0
},
"focus-depth",
"focus-isolation-composite"
);

clearRenderTarget(postFx.ping);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
var bloomRoute = descriptor.lod.numeric <= -1
? geometry.routes[
descriptor.phaseIndex % Math.max(1, geometry.routes.length)
]
: geometry.corridorPoints;
drawDynamic(
"active-flow-bloom",
bloomRoute,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.teal,
layerOpacity("active-flow-bloom") * 0.58
),
1,
dataModel,
vp,
"active-semantic-emitter-buffer"
);
drawDynamic(
"active-flow-bloom",
[geometry.quality.packet],
gl.POINTS,
rgba(
BRAND_RGBA.white,
layerOpacity("active-flow-bloom") * 0.48
),
5.4,
dataModel,
vp,
"quality-semantic-emitter",
1
);
if (geometry.authority.approvalWeight > 0) {
drawDynamic(
"active-flow-bloom",
geometry.authority.approvalPulse,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.teal,
layerOpacity("active-flow-bloom") *
geometry.authority.approvalWeight * 0.52
),
1,
dataModel,
vp,
"authority-semantic-emitter"
);
}
if (geometry.crystal.lockProgress > 0) {
drawDynamic(
"active-flow-bloom",
geometry.crystal.lockRing,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.white,
layerOpacity("active-flow-bloom") *
geometry.crystal.lockProgress * 0.42
),
1,
dataModel,
vp,
"version-semantic-emitter"
);
}
drawFullscreenBlur(
postFx.ping.texture,
postFx.pong,
[1, 0],
1.28,
"active-flow-bloom",
"bloom-horizontal"
);
drawFullscreenBlur(
postFx.pong.texture,
postFx.ping,
[0, 1],
1.28,
"active-flow-bloom",
"bloom-vertical"
);
drawFullscreenComposite(
postFx.scene.texture,
postFx.ping.texture,
{
focusCenter: focusCenter,
contextAttenuation: contextAttenuation,
additive: true,
weight: 0.16
},
"active-flow-bloom",
"restrained-bloom-composite"
);

if (transitionProgress < 1) {
clearRenderTarget(postFx.ping);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
geometry.aircraftTrails.forEach(function (trail) {
drawDynamic(
"camera-flight-motion",
trail,
gl.LINE_STRIP,
rgba(
BRAND_RGBA.white,
layerOpacity("camera-flight-motion") * 0.48
),
1,
aircraftModel,
vp,
"flight-smear-emitter-buffer",
0,
{transitionOnly: true}
);
});
var smearX = targetRotation.yaw - rotationFrom.yaw;
var smearY = targetRotation.pitch - rotationFrom.pitch;
var smearLength = Math.sqrt(
smearX * smearX + smearY * smearY
) || 1;
drawFullscreenBlur(
postFx.ping.texture,
postFx.pong,
[smearX / smearLength, smearY / smearLength],
2.1,
"camera-flight-motion",
"flight-directional-smear"
);
drawFullscreenComposite(
postFx.scene.texture,
postFx.pong.texture,
{
focusCenter: focusCenter,
contextAttenuation: contextAttenuation,
additive: true,
weight: 0.12
},
"camera-flight-motion",
"flight-smear-composite"
);
}
} catch (postFxError) {
destroyPostProcessPipeline(gl, postFx);
postFx.reason = "runtime-failure";
bindRenderTarget(null);
return draw(timeValue);
}
} else {
recordComposition("focus-depth", "direct-focus-retain-floor", {
activeEffect: activeTransitionFrame.effectId,
attenuation: clamp(
0.2 + activeCamera.detail * 0.15,
0.2,
0.35
),
postFxReason: postFx.reason
});
}
recordComposition("semantic-zoom", "semantic-lod-selection", {
depthId: descriptor.depthId,
semanticLevel: descriptor.semanticLod.semanticId,
detail: activeCamera.detail,
kinds: descriptor.semanticLod.kinds.slice(),
labelBudget: descriptor.semanticLod.labelBudget,
canonicalNodeIds: descriptor.semanticLod.canonicalNodeIds.slice(),
visibleReferenceKinds:
descriptor.semanticLod.visibleReferenceKinds.slice(),
canonicalReferences: {
version: descriptor.semanticLod.references.version.slice(),
run: descriptor.semanticLod.references.run.slice(),
hash: descriptor.semanticLod.references.hash.slice(),
policy: descriptor.semanticLod.references.policy.slice(),
artifact: descriptor.semanticLod.references.artifact.slice(),
gap: descriptor.semanticLod.references.gap.slice()
},
sceneId: descriptor.sceneId,
geometryRecipeId: descriptor.geometryRecipeId,
semanticState: Object.assign({}, descriptor.semanticState)
});
gl.disable(gl.BLEND);
bindRenderTarget(null);
var frameMeasureFinished = globalWindow.performance &&
typeof globalWindow.performance.now === "function"
? globalWindow.performance.now()
: frameMeasureStarted;
var frameCost = Math.max(0, frameMeasureFinished - frameMeasureStarted);
if (frameCost > 0) {
postFx.frameCostAverageMs = postFx.frameCostAverageMs > 0
? postFx.frameCostAverageMs * 0.82 + frameCost * 0.18
: frameCost;
}
return true;
} catch (error) {
runtimeFailed = true;
if (typeof lifecycle.onRuntimeFailure === "function") {
lifecycle.onRuntimeFailure(error);
}
return false;
}
}

function setScene(nextState, animate) {
state = nextState;
var nextDescriptor = sceneDescriptor(world, state);
if (!nextDescriptor) {
return;
}
previousDescriptor = descriptor;
descriptor = nextDescriptor;
transitionFrom = camera;
targetCamera = descriptor.camera;
rotationFrom = {
yaw: rotation.yaw + orbitYaw,
pitch: rotation.pitch,
roll: rotation.roll
};
orbitYaw = 0;
targetRotation = {
yaw: descriptor.camera.yaw,
pitch: descriptor.camera.pitch,
roll: descriptor.camera.roll
};
transitionStarted = animate ? 1 : 0;
if (!animate) {
previousDescriptor = descriptor;
activeTransitionFrame = sceneTransitionFrame(
descriptor,
descriptor,
1,
0
);
camera = targetCamera;
rotation = {
yaw: targetRotation.yaw,
pitch: targetRotation.pitch,
roll: targetRotation.roll
};
rotationFrom = {
yaw: rotation.yaw,
pitch: rotation.pitch,
roll: rotation.roll
};
}
}

function beginTransition(timeValue) {
if (transitionStarted === 1) {
transitionStarted = timeValue;
}
}

function rotate(deltaYaw, deltaPitch) {
rotation = {
yaw: rotation.yaw + orbitYaw + deltaYaw,
pitch: clamp(
rotation.pitch + deltaPitch,
-Math.PI * 0.48,
Math.PI * 0.48
),
roll: rotation.roll
};
orbitYaw = 0;
rotationFrom = {
yaw: rotation.yaw,
pitch: rotation.pitch,
roll: rotation.roll
};
targetRotation = {
yaw: rotation.yaw,
pitch: rotation.pitch,
roll: rotation.roll
};
transitionStarted = 0;
}

function orbit(deltaYaw) {
orbitYaw = (
orbitYaw + deltaYaw
) % TAU;
}

function setContextLost(value) {
contextLost = Boolean(value);
if (!contextLost) {
runtimeFailed = false;
}
}

function currentRotation() {
return {
yaw: rotation.yaw + orbitYaw,
pitch: rotation.pitch,
roll: rotation.roll
};
}

function missingActiveLayers() {
return activeLayerIds(descriptor.layerPlan).filter(function (layerId) {
var evidence = renderEvidence[layerId];
return !evidence || (
evidence.drawCalls < 1 &&
evidence.compositionApplications < 1
);
});
}

function zoom(delta) {
targetCamera = {
yaw: targetCamera.yaw,
pitch: targetCamera.pitch,
roll: targetCamera.roll,
distance: targetCamera.distance,
zoom: clamp(targetCamera.zoom + delta, 0.7, 1.65),
targetX: targetCamera.targetX,
targetY: targetCamera.targetY,
targetZ: targetCamera.targetZ,
semanticLevel: targetCamera.semanticLevel,
detail: targetCamera.detail
};
camera = {
yaw: camera.yaw,
pitch: camera.pitch,
roll: camera.roll,
distance: camera.distance,
zoom: targetCamera.zoom,
targetX: camera.targetX,
targetY: camera.targetY,
targetZ: camera.targetZ,
semanticLevel: camera.semanticLevel,
detail: camera.detail
};
transitionFrom = camera;
}

function safeDelete(deleteOperation) {
try {
deleteOperation();
} catch (error) {
return;
}
}

return {
mode: mode,
beginTransition: beginTransition,
destroy: function () {
destroyed = true;
destroyPostProcessPipeline(gl, postFx);
safeDelete(function () {
gl.deleteBuffer(positionBuffer);
});
safeDelete(function () {
gl.deleteBuffer(normalBuffer);
});
safeDelete(function () {
gl.deleteBuffer(indexBuffer);
});
safeDelete(function () {
gl.deleteBuffer(dynamicBuffer);
});
safeDelete(function () {
gl.deleteProgram(sphereProgram);
});
safeDelete(function () {
gl.deleteProgram(lineProgram);
});
},
draw: draw,
getCamera: function () {
return {
yaw: camera.yaw,
pitch: camera.pitch,
roll: camera.roll,
distance: camera.distance,
zoom: camera.zoom,
targetX: camera.targetX,
targetY: camera.targetY,
targetZ: camera.targetZ,
semanticLevel: camera.semanticLevel,
detail: camera.detail
};
},
getDescriptor: function () {
return descriptor;
},
getMissingActiveLayers: missingActiveLayers,
getPostProcessStatus: function () {
return {
enabled: postFx.enabled,
mode: postFx.mode,
reason: postFx.reason,
width: postFx.width,
height: postFx.height,
halfWidth: postFx.halfWidth,
halfHeight: postFx.halfHeight,
allocations: postFx.allocations,
adaptiveSkip: postFx.adaptiveSkip,
frameCostAverageMs: postFx.frameCostAverageMs,
passes: postFx.passes.slice()
};
},
getRenderEvidence: function () {
return Object.keys(renderEvidence).reduce(function (copy, layerId) {
var evidence = renderEvidence[layerId];
copy[layerId] = Object.assign({}, evidence, {
operations: evidence.operations.slice()
});
return copy;
}, {});
},
getRenderedLayers: function () {
return Object.keys(renderEvidence);
},
getTransitionFrame: function () {
return activeTransitionFrame;
},
isTransitionSettled: function () {
return (
transitionStarted === 0 &&
!contextLost &&
!runtimeFailed
);
},
getRotation: currentRotation,
orbit: orbit,
rotate: rotate,
setContextLost: setContextLost,
setScene: setScene,
zoom: zoom
};
}

function drawStaticFallback(canvas, world, state) {
if (!canvas || typeof canvas.getContext !== "function") {
return null;
}
var context = canvas.getContext("2d");
if (!context) {
return null;
}
var projection = null;

function paint() {
var rect = typeof canvas.getBoundingClientRect === "function"
? canvas.getBoundingClientRect()
: {width: canvas.clientWidth || 960, height: canvas.clientHeight || 620};
canvas.width = Math.max(1, Math.round(rect.width || 960));
canvas.height = Math.max(1, Math.round(rect.height || 620));
projection = buildProjection(
world,
state,
{width: canvas.width, height: canvas.height},
null
);
if (!projection) {
return false;
}
var radius = worldViewportMetrics(
{width: canvas.width, height: canvas.height},
projection.camera
).globeRadius;
context.clearRect(0, 0, canvas.width, canvas.height);
context.save();
context.strokeStyle = BRAND_HEX[1];
context.lineWidth = 1.5;
context.beginPath();
context.arc(canvas.width / 2, canvas.height / 2, radius, 0, TAU);
context.stroke();
context.beginPath();
var boundaries = worldCountryBoundarySegments();
for (
var boundaryIndex = 0;
boundaryIndex < boundaries.length;
boundaryIndex += 2
) {
var boundaryStart = rotatePoint(
boundaries[boundaryIndex],
projection.rotation
);
var boundaryEnd = rotatePoint(
boundaries[boundaryIndex + 1],
projection.rotation
);
if (!isFrontFacing(boundaryStart) || !isFrontFacing(boundaryEnd)) {
continue;
}
var projectedStart = perspectiveProject(
boundaryStart,
{width: canvas.width, height: canvas.height},
projection.camera
);
var projectedEnd = perspectiveProject(
boundaryEnd,
{width: canvas.width, height: canvas.height},
projection.camera
);
context.moveTo(projectedStart.x, projectedStart.y);
context.lineTo(projectedEnd.x, projectedEnd.y);
}
context.strokeStyle = BRAND_HEX[3];
context.lineWidth = 0.8;
context.stroke();
projection.routes.forEach(function (route) {
var hasStarted = false;
context.beginPath();
route.points.forEach(function (point) {
if (!point.front) {
hasStarted = false;
return;
}
if (!hasStarted) {
context.moveTo(point.x, point.y);
hasStarted = true;
} else {
context.lineTo(point.x, point.y);
}
});
context.strokeStyle = BRAND_HEX[0];
context.stroke();
});
projection.anchors.forEach(function (anchor) {
if (!anchor.visible) {
return;
}
context.fillStyle = anchor.selected ? BRAND_HEX[0] : BRAND_HEX[2];
context.beginPath();
context.arc(anchor.x, anchor.y, anchor.selected ? 5 : 3, 0, TAU);
context.fill();
context.strokeStyle = BRAND_HEX[1];
context.stroke();
});
context.restore();
return true;
}

if (!paint()) {
return null;
}
return {
mode: "static",
draw: function () {
paint();
return projection;
},
setScene: function (nextState) {
state = nextState;
return paint();
},
getCamera: function () {
return projection ? projection.camera : null;
},
getRotation: function () {
return projection ? projection.rotation : null;
},
destroy: function () {}
};
}

function prefersReducedMotion(globalWindow) {
return Boolean(
globalWindow &&
typeof globalWindow.matchMedia === "function" &&
globalWindow.matchMedia("(prefers-reduced-motion: reduce)").matches
);
}

function chooseRendererMode(options) {
if (options.printing || options.reducedMotion) {
return options.hasCanvas2D ? "static" : "text";
}
if (options.hasWebGL2) {
return "webgl2";
}
if (options.hasWebGL1) {
return "webgl1";
}
return options.hasCanvas2D ? "static" : "text";
}

function replaceList(list, values, documentObject) {
while (list.firstChild) {
list.removeChild(list.firstChild);
}
values.forEach(function (value) {
var item = documentObject.createElement("li");
item.textContent = value;
list.appendChild(item);
});
}

function setText(root, selector, value) {
var element = root.querySelector(selector);
if (element) {
element.textContent = value;
}
}

function canonicalQueryOnLanguageLinks(
documentObject,
query,
globalWindow
) {
Array.prototype.forEach.call(
documentObject.querySelectorAll("[data-language-switcher] a[href]"),
function (anchor) {
try {
var target = new URL(
anchor.getAttribute("href"),
globalWindow.location.origin
);
target.search = query;
anchor.setAttribute(
"href",
target.pathname + target.search + target.hash
);
} catch (error) {
return;
}
}
);
}

function nextControl(controls, current, key, direction) {
var index = controls.indexOf(current);
if (index < 0 || !controls.length) {
return null;
}
if (key === "Home") {
return controls[0];
}
if (key === "End") {
return controls[controls.length - 1];
}
var forward = key === "ArrowDown" || key === "ArrowRight";
if (
direction === "rtl" &&
(key === "ArrowLeft" || key === "ArrowRight")
) {
forward = !forward;
}
var offset = forward ? 1 : -1;
return controls[(index + offset + controls.length) % controls.length];
}

function payloadFrom(root, selector) {
var payload = root.querySelector(selector);
var source = payload && payload.content
? payload.content.textContent
: payload && payload.textContent;
try {
return JSON.parse(source || "");
} catch (error) {
return null;
}
}

function mount(globalWindow) {
var documentObject = globalWindow.document;
var root = documentObject.querySelector("[data-business-outcome-map]");
if (!root) {
return null;
}
var contract = payloadFrom(root, "[data-business-map-contract]");
if (!isValidContract(contract)) {
return null;
}
var worldPayloadElement = root.querySelector(
"[data-business-world-contract]"
);
var world = worldPayloadElement
? payloadFrom(root, "[data-business-world-contract]")
: null;
if (worldPayloadElement && !isValidWorldContract(world, contract)) {
return null;
}
var isWorld = Boolean(world);

var panel = root.querySelector("[data-business-room-panel]");
var roles = root.querySelector("[data-room-roles]");
var solutionLink = root.querySelector("[data-room-solution-link]");
var tourLink = root.querySelector("[data-room-tour-link]");
var industryLink = root.querySelector("[data-room-industry-link]");
var status = root.querySelector("[data-room-status]");
var fallback = root.querySelector("[data-business-map-fallback]");
if (fallback) {
fallback.hidden = true;
}
var caseControls = Array.prototype.slice.call(
root.querySelectorAll("[data-business-case]")
);
var priorityCaseControls = Array.prototype.slice.call(
root.querySelectorAll("[data-world-priority-case]")
);
var caseSummary = root.querySelector("[data-world-case-summary]");
var industryControls = Array.prototype.slice.call(
root.querySelectorAll("[data-business-industry]")
);
var direction = root.dataset.direction === "rtl" ? "rtl" : "ltr";
var state = isWorld
? parseWorldState(globalWindow.location.search, contract, world)
: parseState(globalWindow.location.search, contract);
if (isWorld) {
state.authorityConfirmed = false;
state.authorityRecord = null;
state.qualityResolution = "UNRESOLVED";
state.comparisonSide = normalizedComparisonSide(
profileFor(world, state.caseId).scene.comparison_mode,
null
);
state.roleLensIndex = null;
state.roleLensCount = findBy(
contract.cases,
"case_id",
state.caseId
).roles.length;
}
var changeTimer = null;
var stableTimer = null;
var userPaused = false;
var activeCapabilityId = null;
var activeAdvantageId = null;
var reducedMotion = prefersReducedMotion(globalWindow);
var documentVisible = !documentObject.hidden;
var stageVisible = true;
var printing = false;
var frameRequest = null;
var lastFrame = 0;
var storyStartedAt = globalWindow.performance &&
typeof globalWindow.performance.now === "function"
? globalWindow.performance.now()
: 0;
var ambientStartedAt = null;
var ambientChapterIndex = isWorld
? Math.max(0, PHASE_IDS.indexOf(state.stepId))
: 0;
var userHasInteracted = false;
var renderer = null;
var webglContextLost = false;
var handoffEnhancementFailed = false;
var analyticsRecorder = isWorld
? createExperienceAnalyticsRecorder(
world.experience_analytics,
globalWindow,
globalWindow.CustomEvent
)
: null;
var completedStoryIds = new Set();
var lastHistoryQuery = String(
globalWindow.location.search || ""
).replace(/^\?/, "");

if (
!panel ||
!roles ||
caseControls.length !== contract.cases.length ||
industryControls.length !== contract.industries.length
) {
return null;
}

var stage = root.querySelector("[data-world-stage]");
var canvasContainer = root.querySelector("[data-world-canvas]");
var canvas = root.querySelector("[data-world-webgl]");
var staticWorldFallback = root.querySelector(
"[data-world-static-fallback]"
);
var stepRail = root.querySelector("[data-world-step-rail]");
var stepButtons = Array.prototype.slice.call(
root.querySelectorAll("[data-world-step-button]")
);
var depthRail = root.querySelector("[data-world-depth-rail]");
var depthButtons = Array.prototype.slice.call(
root.querySelectorAll("[data-world-depth-button]")
);
var viewToggles = Array.prototype.slice.call(
root.querySelectorAll("[data-world-view-toggle]")
);
var motionToggle = root.querySelector("[data-world-motion-toggle]");
var levelUpControl = root.querySelector("[data-world-level-up]");
var fullWorldControl = root.querySelector("[data-world-full-world]");
var skipIntroControl = root.querySelector("[data-world-skip-intro]");
var roleLensControl = root.querySelector("[data-world-role-lens]");
var comparisonContainer = root.querySelector(
"[data-world-comparison]"
);
var comparisonControls = Array.prototype.slice.call(
root.querySelectorAll("[data-world-comparison-side]")
);
var shareControl = root.querySelector("[data-world-share]");
var shareStatus = root.querySelector("[data-world-share-status]");
var entryActionControls = Array.prototype.slice.call(
root.querySelectorAll("[data-world-entry-action]")
);
var capabilityMarkers = Array.prototype.slice.call(
root.querySelectorAll("[data-world-capability-marker]")
);
var capabilityScenes = Array.prototype.slice.call(
root.querySelectorAll("[data-world-capability-scene]")
);
var differentiationToggle = root.querySelector(
"[data-world-differentiation-toggle]"
);
var differentiationScene = root.querySelector(
"[data-world-differentiation]"
);
var differentiatorControls = Array.prototype.slice.call(
root.querySelectorAll("[data-world-differentiator]")
);
var differentiationClose = root.querySelector(
"[data-world-differentiation-close]"
);
var differentiationPrevious = root.querySelector(
"[data-world-differentiation-previous]"
);
var differentiationNext = root.querySelector(
"[data-world-differentiation-next]"
);
var differentiationProgress = root.querySelector(
"[data-world-differentiation-progress]"
);
var selectionPanel = root.querySelector(
"[data-world-selection-panel]"
);
var selectionPanelToggle = root.querySelector(
"[data-world-panel-toggle]"
);
var selectionPanelCloseControls = Array.prototype.slice.call(
root.querySelectorAll("[data-world-panel-close]")
);
var chooserDetails = root.querySelector(
".business-map__chooser-details"
);
if (isWorld) {
root.dataset.worldPanelOpen = "false";
root.dataset.worldCapabilitySelected = "false";
root.dataset.worldDifferentiationOpen = "false";
root.dataset.worldProofOpen = "false";
root.dataset.worldInput = "controls-only";
}
var narration = root.querySelector("[data-world-narration]");
var controlMembrane = root.querySelector(
"[data-world-control-membrane]"
);
var decisionGate = root.querySelector("[data-world-decision-gate]");
var authorityConfirm = root.querySelector(
"[data-world-authority-confirm]"
);
var qualityActions = Array.prototype.slice.call(
root.querySelectorAll("[data-world-quality-action]")
);
var authorityActions = Array.prototype.slice.call(
root.querySelectorAll("[data-world-authority-action]")
);
var authorityRecordContainer = root.querySelector(
"[data-world-authority-record]"
);
var mobileSheet = root.querySelector("[data-world-mobile-sheet]");
var syntheticNote = root.querySelector("[data-world-synthetic-note]");
var cameraStatus = root.querySelector("[data-world-camera-status]");
var viewportTitle = root.querySelector("[data-world-viewport-title]");
var viewportDescription = root.querySelector(
"[data-world-viewport-description]"
);
var evidenceRewind = root.querySelector("[data-world-evidence-rewind]");
var phasePanels = {
problem: root.querySelector("[data-world-problem]"),
context: root.querySelector("[data-world-context]"),
control: root.querySelector("[data-world-control]"),
decision: root.querySelector("[data-world-decision]"),
outcome: root.querySelector("[data-world-outcome]"),
evidence: root.querySelector("[data-world-evidence]")
};
function replaceEvidenceRewind(profile) {
if (!evidenceRewind) {
return;
}
while (evidenceRewind.firstChild) {
evidenceRewind.removeChild(evidenceRewind.firstChild);
}
profile.evidence_rewind_path.forEach(function (nodeId, index) {
var item = documentObject.createElement("li");
var ordinal = documentObject.createElement("span");
var label = documentObject.createElement("span");
item.dataset.worldEvidenceNode = nodeId;
ordinal.setAttribute("aria-hidden", "true");
ordinal.textContent = String(index + 1).padStart(2, "0");
label.textContent = world.node_labels[nodeId];
item.appendChild(ordinal);
item.appendChild(label);
evidenceRewind.appendChild(item);
});
}

function caseControl(caseId) {
return caseControls.find(function (control) {
return control.dataset.businessCase === caseId;
}) || null;
}

function industryControl(industryId) {
return industryControls.find(function (control) {
return control.dataset.businessIndustry === industryId;
}) || null;
}

function signalChange() {
panel.dataset.changing = "true";
if (changeTimer !== null) {
globalWindow.clearTimeout(changeTimer);
}
changeTimer = globalWindow.setTimeout(function () {
delete panel.dataset.changing;
changeTimer = null;
}, 180);
}

function signalCameraStable() {
if (!isWorld) {
return;
}
root.dataset.worldCameraStable = "false";
if (narration) {
narration.dataset.worldCameraStable = "false";
}
if (stableTimer !== null) {
globalWindow.clearTimeout(stableTimer);
stableTimer = null;
}
if (
renderer &&
renderer.mode &&
renderer.mode.indexOf("webgl") === 0 &&
!reducedMotion
) {
return;
}
stableTimer = globalWindow.setTimeout(function () {
root.dataset.worldCameraStable = "true";
if (narration) {
narration.dataset.worldCameraStable = "true";
}
stableTimer = null;
}, reducedMotion ? 0 : CAMERA_SETTLE_DELAY_MS);
}

function synchronizeCameraStable() {
if (
!isWorld ||
!renderer ||
typeof renderer.isTransitionSettled !== "function" ||
!renderer.isTransitionSettled()
) {
return false;
}
root.dataset.worldCameraStable = "true";
if (narration) {
narration.dataset.worldCameraStable = "true";
}
return true;
}

function queryForState() {
return isWorld
? serializeWorldState(state, world)
: serializeState(state);
}

function updateHistory(writeHistory) {
var query = queryForState();
if (
writeHistory &&
globalWindow.history &&
query !== lastHistoryQuery
) {
var historyUrl = globalWindow.location.pathname +
"?" + query +
globalWindow.location.hash;
if (
isWorld &&
typeof globalWindow.history.pushState === "function"
) {
globalWindow.history.pushState(null, "", historyUrl);
} else if (
typeof globalWindow.history.replaceState === "function"
) {
globalWindow.history.replaceState(null, "", historyUrl);
}
lastHistoryQuery = query;
}
canonicalQueryOnLanguageLinks(documentObject, query, globalWindow);
}

function currentRendererMode() {
if (webglContextLost) {
return staticWorldFallback ? "static" : "text";
}
if (renderer && isNonEmptyText(renderer.mode)) {
return renderer.mode;
}
return staticWorldFallback ? "static" : "text";
}

function currentMotionMode() {
if (reducedMotion) {
return "reduced";
}
if (userPaused) {
return "paused";
}
return currentRendererMode().indexOf("webgl") === 0
? "active"
: "static";
}

function recordAnalytics(eventName, payload) {
return Boolean(
analyticsRecorder &&
analyticsRecorder.record(eventName, payload)
);
}

function recordPhaseViewed() {
if (!isWorld) {
return false;
}
return recordAnalytics("phase_viewed", {
story_id: state.caseId,
industry_id: state.industryId,
phase_id: state.stepId,
view_id: state.viewId,
depth_id: state.depthId,
renderer_mode: currentRendererMode(),
motion_mode: currentMotionMode()
});
}

function recordSemanticChanges(beforeState, inputMode) {
if (!isWorld) {
return;
}
var profile = profileFor(world, state.caseId);
var beforeSemantic = semanticSceneState(profile, beforeState);
var afterSemantic = semanticSceneState(profile, state);
SCENE_STATE_GROUP_IDS.forEach(function (stateGroup) {
if (
afterSemantic[stateGroup] !== null &&
afterSemantic[stateGroup] !== beforeSemantic[stateGroup]
) {
recordAnalytics("scene_state_changed", {
story_id: state.caseId,
phase_id: state.stepId,
state_group: stateGroup,
state_id: afterSemantic[stateGroup],
input_mode: inputMode
});
}
});
}

function localizedAuthorityDecision(decision) {
var match = world && world.actions
? findBy(world.actions.authority, "action_id", decision)
: null;
return match ? match.label : "";
}

function rebuildRoleLensOptions(selectedCase) {
if (!roleLensControl || !selectedCase) {
return;
}
while (roleLensControl.firstChild) {
roleLensControl.removeChild(roleLensControl.firstChild);
}
var allOption = documentObject.createElement("option");
allOption.setAttribute("value", "all");
allOption.value = "all";
allOption.textContent = world.controls.all_roles;
roleLensControl.appendChild(allOption);
selectedCase.roles.forEach(function (roleLabel, index) {
var option = documentObject.createElement("option");
option.setAttribute("value", String(index));
option.value = String(index);
option.textContent = roleLabel;
roleLensControl.appendChild(option);
});
roleLensControl.value = state.roleLensIndex === null
? "all"
: String(state.roleLensIndex);
}

function renderAuthorityRecord() {
var record = state.authorityRecord || null;
root.dataset.worldAuthorityDecision = record
? record.decision
: "";
if (authorityRecordContainer) {
authorityRecordContainer.hidden = !record;
}
setText(
root,
"[data-world-authority-record-decision]",
record ? localizedAuthorityDecision(record.decision) : ""
);
setText(
root,
"[data-world-authority-record-role]",
record ? record.roleScope : ""
);
setText(
root,
"[data-world-authority-record-policy]",
record ? record.policyScope : ""
);
setText(
root,
"[data-world-authority-record-time]",
record ? "T+" + String(record.storyTimeMs) + "ms" : ""
);
authorityActions.forEach(function (action) {
action.setAttribute(
"aria-pressed",
String(Boolean(
record &&
action.dataset.authorityDecision === record.decision
))
);
});
}

function renderWorld(animate) {
if (!isWorld) {
return;
}
var profile = profileFor(world, state.caseId);
var selectedCase = findBy(contract.cases, "case_id", state.caseId);
state.roleLensCount = selectedCase.roles.length;
state.roleLensIndex = normalizedRoleLensIndex(
state.roleLensIndex,
state.roleLensCount
);
state.comparisonSide = normalizedComparisonSide(
profile.scene.comparison_mode,
state.comparisonSide
);
var descriptor = sceneDescriptor(world, state);
var selectedIndustry = findBy(
contract.industries,
"industry_id",
state.industryId
);
var selectedAnchor = anchorFor(world, state.industryId);
var selectedPhase = phaseById(world, state.stepId);
var recommendations = recommendedCaseIds(
contract,
state.industryId,
world
);
var phaseIndex = PHASE_IDS.indexOf(state.stepId);
if (selectedPhase) {
var activeStepButton = stepButtons.find(function (button) {
return button.dataset.worldStepButton === state.stepId;
});
var phaseIndexLabel = (
activeStepButton &&
activeStepButton.dataset.worldStepIndexLabel
) || (
String(phaseIndex + 1).padStart(2, "0") +
" / " +
String(PHASE_IDS.length).padStart(2, "0")
);
setText(
root,
"[data-world-active-phase-index]",
phaseIndexLabel
);
setText(
root,
"[data-world-active-phase-label]",
selectedPhase.label
);
}
if (selectedCase) {
setText(
root,
"[data-world-active-scene-title]",
selectedCase.title
);
setText(
root,
"[data-world-active-scene-copy]",
profile && profile.phase_content
? profile.phase_content[state.stepId]
: ""
);
setText(
root,
"[data-world-active-scene-measure]",
selectedCase.economic_value
);
}
root.dataset.worldStep = state.stepId;
root.dataset.worldView = state.viewId;
root.dataset.worldDepth = state.depthId;
root.dataset.worldProfile = descriptor.profileId;
root.dataset.worldEffect = descriptor.dominantEffect;
root.dataset.worldCameraState = descriptor.cameraState;
root.dataset.worldAuthorityConfirmed = String(
descriptor.authorityConfirmed
);
root.dataset.worldQualityResolution = descriptor.qualityResolution;
root.dataset.worldComparisonSide = descriptor.semanticState.comparison ||
"";
root.dataset.worldRoleLens = descriptor.roleLens.index === null
? "all"
: String(descriptor.roleLens.index);
if (roleLensControl) {
if (roleLensControl.dataset.worldRoleStory !== state.caseId) {
rebuildRoleLensOptions(selectedCase);
roleLensControl.dataset.worldRoleStory = state.caseId;
} else {
roleLensControl.value = descriptor.roleLens.index === null
? "all"
: String(descriptor.roleLens.index);
}
}
if (comparisonContainer) {
comparisonContainer.hidden =
profile.scene.comparison_mode !== "before-after";
}
comparisonControls.forEach(function (control) {
control.setAttribute(
"aria-pressed",
String(
descriptor.semanticState.comparison !== null &&
control.dataset.worldComparisonSide ===
descriptor.semanticState.comparison
)
);
});
if (authorityConfirm) {
authorityConfirm.setAttribute(
"aria-pressed",
String(descriptor.authorityConfirmed)
);
}
qualityActions.forEach(function (action) {
action.setAttribute(
"aria-pressed",
String(
action.dataset.qualityResolution ===
descriptor.qualityResolution
)
);
});
renderAuthorityRecord();
root.dataset.worldRecommendedCase = recommendations[0] || "";
if (stage) {
stage.dataset.worldStep = state.stepId;
stage.dataset.worldView = state.viewId;
stage.dataset.worldDepth = state.depthId;
stage.dataset.worldProfile = descriptor.profileId;
}
if (canvasContainer && selectedAnchor) {
canvasContainer.dataset.worldAnchor = selectedAnchor.anchor_id;
canvasContainer.dataset.worldAnchorLatitude = String(
selectedAnchor.latitude
);
canvasContainer.dataset.worldAnchorLongitude = String(
selectedAnchor.longitude
);
}
if (stepRail) {
stepRail.dataset.worldStep = state.stepId;
}
stepButtons.forEach(function (button) {
var active = button.dataset.worldStepButton === state.stepId;
button.setAttribute("aria-current", active ? "step" : "false");
button.tabIndex = active ? 0 : -1;
});
viewToggles.forEach(function (button) {
var active = button.dataset.worldViewToggle === state.viewId;
button.setAttribute("aria-pressed", String(active));
});
if (depthRail) {
depthRail.dataset.worldDepth = state.depthId;
}
depthButtons.forEach(function (button) {
var active = button.dataset.worldDepthButton === state.depthId;
button.setAttribute("aria-pressed", String(active));
button.tabIndex = active ? 0 : -1;
});
Object.keys(phasePanels).forEach(function (phaseId) {
var phasePanel = phasePanels[phaseId];
if (phasePanel) {
phasePanel.hidden = false;
phasePanel.dataset.worldPhaseActive = String(
phaseId === state.stepId
);
phasePanel.setAttribute(
"aria-hidden",
"false"
);
}
});
if (controlMembrane) {
controlMembrane.dataset.active = String(
PHASE_IDS.indexOf(state.stepId) >= PHASE_IDS.indexOf("control")
);
}
if (decisionGate) {
decisionGate.dataset.active = String(
PHASE_IDS.indexOf(state.stepId) >= PHASE_IDS.indexOf("decision")
);
}
if (mobileSheet) {
mobileSheet.dataset.worldStep = state.stepId;
mobileSheet.dataset.worldView = state.viewId;
}
if (selectedIndustry) {
if (viewportDescription) {
viewportDescription.textContent = selectedIndustry.lead;
}
setText(
root,
"[data-world-mobile-industry]",
selectedIndustry.label
);
}
if (selectedCase) {
if (viewportTitle) {
viewportTitle.textContent = selectedCase.title;
}
if (mobileSheet) {
mobileSheet.setAttribute("aria-label", selectedCase.title);
}
setText(root, "[data-world-mobile-title]", selectedCase.title);
setText(root, "[data-world-mobile-outcome]", selectedCase.pilot_goal);
setText(root, "[data-room-problem-mobile]", selectedCase.today);
setText(
root,
"[data-room-control-mobile]",
selectedCase.with_advanexus
);
setText(
root,
"[data-room-measure-mobile]",
selectedCase.economic_value
);
}
if (
mobileSheet &&
profile &&
typeof mobileSheet.querySelector === "function"
) {
var mobileTourLink = mobileSheet.querySelector("a[href]");
if (mobileTourLink && tourLink) {
mobileTourLink.setAttribute(
"href",
tourLink.getAttribute("href")
);
}
}
if (syntheticNote) {
syntheticNote.hidden = false;
}
if (cameraStatus && selectedPhase) {
cameraStatus.dataset.worldDepth = state.depthId;
cameraStatus.textContent = state.depthId + " · " + selectedPhase.label;
}
if (profile) {
replaceEvidenceRewind(profile);
}
caseControls.forEach(function (control) {
var rank = recommendations.indexOf(control.dataset.businessCase);
control.dataset.worldRecommendationRank = rank >= 0
? String(rank + 1)
: "";
});
if (renderer) {
renderer.setScene(
state,
animate && !reducedMotion && !userPaused
);
if (!motionAllowed()) {
renderer.draw(
globalWindow.performance &&
typeof globalWindow.performance.now === "function"
? globalWindow.performance.now()
: 0
);
synchronizeCameraStable();
}
}
signalCameraStable();
}

function render(writeHistory, announce, animate) {
var selectedCase = findBy(contract.cases, "case_id", state.caseId);
var selectedIndustry = findBy(
contract.industries,
"industry_id",
state.industryId
);
var selectedCaseControl = caseControl(state.caseId);
var selectedIndustryControl = industryControl(state.industryId);
if (
!selectedCase ||
!selectedIndustry ||
!selectedCaseControl ||
!selectedIndustryControl
) {
return;
}

signalChange();
caseControls.forEach(function (control) {
var active = control === selectedCaseControl;
control.setAttribute("aria-selected", String(active));
control.tabIndex = active ? 0 : -1;
});
priorityCaseControls.forEach(function (control) {
var active = control.dataset.worldPriorityCase === state.caseId;
control.dataset.active = String(active);
if (active) {
control.setAttribute("aria-current", "true");
} else {
control.removeAttribute("aria-current");
}
});
industryControls.forEach(function (control) {
control.setAttribute(
"aria-pressed",
String(control === selectedIndustryControl)
);
});
panel.setAttribute("aria-labelledby", selectedCaseControl.id);
setText(root, "[data-room-industry-label]", selectedIndustry.label);
setText(root, "[data-room-case-title]", selectedCase.title);
setText(root, "[data-room-case-meta]", selectedCase.meta);
if (caseSummary) {
caseSummary.textContent = selectedCase.title;
}
setText(root, "[data-room-context-label]", selectedIndustry.label);
setText(root, "[data-room-context-title]", selectedIndustry.title);
setText(root, "[data-room-context-copy]", selectedIndustry.lead);
setText(root, "[data-room-problem]", selectedCase.today);
setText(root, "[data-room-control]", selectedCase.with_advanexus);
setText(root, "[data-room-outcome]", selectedCase.pilot_goal);
setText(root, "[data-room-measure]", selectedCase.economic_value);
setText(root, "[data-room-problem-summary]", selectedCase.today);
setText(
root,
"[data-room-control-summary]",
selectedCase.with_advanexus
);
setText(
root,
"[data-room-outcome-summary]",
selectedCase.pilot_goal
);
setText(
root,
"[data-room-measure-summary]",
selectedCase.economic_value
);
setText(root, "[data-room-proof]", selectedCase.proof);
setText(
root,
"[data-room-boundary-title]",
selectedCase.boundary.title
);
setText(
root,
"[data-room-boundary-copy]",
selectedCase.boundary.body
);
setText(root, "[data-room-solution-label]", selectedCase.title);
setText(
root,
"[data-room-industry-link-label]",
selectedIndustry.label
);
replaceList(roles, selectedCase.roles, documentObject);
if (solutionLink) {
solutionLink.setAttribute(
"href",
selectedCaseControl.dataset.solutionPath
);
}
if (tourLink) {
tourLink.setAttribute("href", selectedCaseControl.dataset.tourPath);
}
if (industryLink) {
industryLink.setAttribute(
"href",
selectedIndustryControl.dataset.industryPath
);
}
renderWorld(Boolean(animate));
updateHistory(writeHistory);
if (announce && status) {
status.textContent = selectedIndustry.label + " · " + selectedCase.title;
}
}

function mappedDepth(stepId) {
return phaseById(world, stepId).depth_id;
}

function takeManualControl() {
userHasInteracted = true;
ambientStartedAt = null;
if (isWorld) {
root.dataset.worldAmbient = "manual";
}
}

function resetGovernedDecisions() {
if (!isWorld) {
return;
}
state.authorityConfirmed = false;
state.authorityRecord = null;
state.qualityResolution = "UNRESOLVED";
}

function resetSceneControlsForCase() {
var profile = profileFor(world, state.caseId);
state.comparisonSide = normalizedComparisonSide(
profile.scene.comparison_mode,
null
);
state.roleLensIndex = null;
state.roleLensCount = findBy(
contract.cases,
"case_id",
state.caseId
).roles.length;
}

function storyRelativeTimeMs() {
var current = globalWindow.performance &&
typeof globalWindow.performance.now === "function"
? globalWindow.performance.now()
: lastFrame;
return Math.max(0, Math.round(current - storyStartedAt));
}

function authorityRecordFor(decision) {
var selectedCase = findBy(contract.cases, "case_id", state.caseId);
var roleScope = selectedCase && selectedCase.roles.length
? selectedCase.roles[0]
: "synthetic-authority-role";
var policyScope = selectedCase && selectedCase.boundary
? selectedCase.boundary.title
: "synthetic-policy-scope";
return {
decision: decision,
roleScope: roleScope,
policyScope: policyScope,
storyTimeMs: storyRelativeTimeMs(),
timestampBasis: "STORY_RELATIVE_PERFORMANCE",
synthetic: true,
durableAudit: false
};
}

function applyAuthorityDecision(decision, inputMode) {
if (!isWorld || !includes(AUTHORITY_DECISION_IDS, decision)) {
return;
}
var beforeState = Object.assign({}, state);
takeManualControl();
state.authorityConfirmed = decision === "APPROVED";
state.authorityRecord = authorityRecordFor(decision);
render(false, false, true);
recordSemanticChanges(beforeState, inputMode || "programmatic");
}

function applyQualityResolution(resolution, inputMode) {
if (!isWorld || !includes(QUALITY_RESOLUTION_IDS, resolution)) {
return;
}
var beforeState = Object.assign({}, state);
takeManualControl();
state.qualityResolution = resolution;
render(false, false, true);
recordSemanticChanges(beforeState, inputMode || "programmatic");
}

function selectCase(caseId, writeHistory, announce, inputMode) {
if (!findBy(contract.cases, "case_id", caseId)) {
return;
}
takeManualControl();
state.caseId = caseId;
if (isWorld) {
resetGovernedDecisions();
resetSceneControlsForCase();
state.stepId = world.state.default_step_id;
state.viewId = "story";
state.depthId = mappedDepth(state.stepId);
setWorldPanel(false, false);
}
render(writeHistory, announce, true);
if (isWorld) {
recordAnalytics("story_selected", {
story_id: state.caseId,
input_mode: inputMode || "programmatic"
});
recordPhaseViewed();
}
}

function selectIndustry(industryId, writeHistory, announce, inputMode) {
if (!findBy(contract.industries, "industry_id", industryId)) {
return;
}
takeManualControl();
state.industryId = industryId;
if (isWorld) {
resetGovernedDecisions();
setWorldPanel(false, false);
}
render(writeHistory, announce, true);
if (isWorld) {
recordAnalytics("industry_selected", {
industry_id: state.industryId,
input_mode: inputMode || "programmatic"
});
recordPhaseViewed();
}
}

function selectStep(stepId, writeHistory, announce) {
if (!isWorld || !includes(world.phase_ids, stepId)) {
return;
}
var enteredEvidence = state.stepId !== "evidence" &&
stepId === "evidence";
takeManualControl();
state.stepId = stepId;
state.viewId = stepId === "evidence" ? "evidence" : "story";
state.depthId = mappedDepth(stepId);
render(writeHistory, announce, true);
recordPhaseViewed();
if (enteredEvidence) {
recordAnalytics("evidence_rewind_started", {
story_id: state.caseId,
view_id: state.viewId,
depth_id: state.depthId
});
if (!completedStoryIds.has(state.caseId)) {
completedStoryIds.add(state.caseId);
recordAnalytics("story_completed", {story_id: state.caseId});
}
}
}

function confirmAuthority(inputMode) {
if (!isWorld || state.authorityConfirmed === true) {
return;
}
applyAuthorityDecision("APPROVED", inputMode || "programmatic");
}

function selectView(viewId, writeHistory, announce) {
if (!isWorld || !includes(world.view_ids, viewId)) {
return;
}
var enteredEvidence = state.viewId !== "evidence" &&
viewId === "evidence";
takeManualControl();
state.viewId = viewId;
if (viewId === "evidence") {
state.stepId = "evidence";
state.depthId = mappedDepth("evidence");
} else if (viewId === "world") {
state.depthId = "L-2";
} else {
state.depthId = mappedDepth(state.stepId);
}
render(writeHistory, announce, true);
recordPhaseViewed();
if (enteredEvidence) {
recordAnalytics("evidence_rewind_started", {
story_id: state.caseId,
view_id: state.viewId,
depth_id: state.depthId
});
if (!completedStoryIds.has(state.caseId)) {
completedStoryIds.add(state.caseId);
recordAnalytics("story_completed", {story_id: state.caseId});
}
}
}

function selectDepth(depthId, writeHistory, announce) {
if (!isWorld || !includes(world.depth_ids, depthId)) {
return;
}
takeManualControl();
state.depthId = depthId;
render(writeHistory, announce, true);
recordPhaseViewed();
}

function moveUpOneLevel(writeHistory, announce) {
if (!isWorld) {
return;
}
var nextDepthId = previousDepthId(world.depth_ids, state.depthId);
takeManualControl();
state.depthId = nextDepthId;
render(writeHistory, announce, true);
recordPhaseViewed();
}

function showFullWorld(writeHistory, announce) {
if (!isWorld) {
return;
}
selectView("world", writeHistory, announce);
}

function skipWorldIntro(writeHistory, announce) {
if (!isWorld) {
return;
}
takeManualControl();
state = skipIntroState(state, world);
render(writeHistory, announce, true);
recordPhaseViewed();
}

function selectRoleLens(value) {
if (!isWorld) {
return;
}
var selectedCase = findBy(
contract.cases,
"case_id",
state.caseId
);
takeManualControl();
state.roleLensIndex = normalizedRoleLensIndex(
value,
selectedCase.roles.length
);
state.roleLensCount = selectedCase.roles.length;
render(false, false, true);
}

function selectComparisonSide(side, inputMode) {
if (!isWorld || !includes(COMPARISON_SIDE_IDS, side)) {
return;
}
var profile = profileFor(world, state.caseId);
var normalizedSide = normalizedComparisonSide(
profile.scene.comparison_mode,
side
);
if (normalizedSide === null) {
return;
}
var beforeState = Object.assign({}, state);
takeManualControl();
state.comparisonSide = normalizedSide;
render(false, false, true);
recordSemanticChanges(beforeState, inputMode || "programmatic");
}

function setTextView() {
root.dataset.worldTextView = "false";
return false;
}

function setShareStatus(success) {
if (!shareStatus || !shareControl) {
return;
}
shareStatus.textContent = success
? shareControl.dataset.successLabel
: shareControl.dataset.unavailableLabel;
}

function shareCurrentScene() {
if (!isWorld) {
return Promise.resolve(false);
}
var shareUrl = canonicalWorldShareUrl(
globalWindow.location,
state,
world
);
var navigatorObject = globalWindow.navigator || {};
var operation = null;
if (shareUrl && typeof navigatorObject.share === "function") {
operation = function () {
return navigatorObject.share({url: shareUrl});
};
} else if (
shareUrl &&
navigatorObject.clipboard &&
typeof navigatorObject.clipboard.writeText === "function"
) {
operation = function () {
return navigatorObject.clipboard.writeText(shareUrl);
};
}
if (!operation) {
setShareStatus(false);
return Promise.resolve(false);
}
try {
return Promise.resolve(operation()).then(function () {
setShareStatus(true);
return true;
}, function () {
setShareStatus(false);
return false;
});
} catch (error) {
setShareStatus(false);
return Promise.resolve(false);
}
}

function beginWorldHandoff(event) {
var targetUrl = canonicalHandoffUrl(
tourLink ? tourLink.getAttribute("href") : "",
globalWindow.location.origin,
world.handoff
);
if (
!targetUrl ||
handoffEnhancementFailed ||
typeof globalWindow.location.assign !== "function" ||
typeof globalWindow.setTimeout !== "function" ||
!handoffCanBeEnhanced(event, tourLink, {
reducedMotion: reducedMotion,
printing: printing,
textView: false,
rendererMode: currentRendererMode()
})
) {
return false;
}
event.preventDefault();
takeManualControl();
root.dataset.worldHandoffState = "preparing";
var profile = profileFor(world, state.caseId);
recordAnalytics("handoff_started", {
story_id: state.caseId,
tour_id: profile.tour_id,
renderer_mode: currentRendererMode(),
motion_mode: currentMotionMode()
});
globalWindow.setTimeout(function () {
root.dataset.worldHandoffState = "morphing";
globalWindow.setTimeout(function () {
try {
globalWindow.location.assign(targetUrl);
} catch (error) {
handoffEnhancementFailed = true;
root.dataset.worldHandoffState = "idle";
}
}, Math.max(0, world.handoff.deadline_ms - 100));
}, 0);
return true;
}

function motionAllowed() {
return Boolean(
renderer &&
renderer.mode.indexOf("webgl") === 0 &&
!userPaused &&
!reducedMotion &&
!printing &&
!webglContextLost &&
documentVisible &&
stageVisible
);
}

function scheduleFrame() {
if (
frameRequest === null &&
typeof globalWindow.requestAnimationFrame === "function" &&
renderer
) {
frameRequest = globalWindow.requestAnimationFrame(frame);
}
}

function advanceAmbientChapter(timeValue) {
if (
!isWorld ||
userHasInteracted ||
userPaused ||
reducedMotion
) {
return false;
}
if (ambientStartedAt === null) {
ambientStartedAt = timeValue;
root.dataset.worldAmbient = "playing";
root.dataset.worldAmbientChapter = String(ambientChapterIndex);
return false;
}
var elapsed = Math.max(0, timeValue - ambientStartedAt);
var requestedIndex = (
ambientChapterIndex +
Math.floor(elapsed / AMBIENT_CHAPTER_DURATION_MS)
) % PHASE_IDS.length;
if (requestedIndex === ambientChapterIndex) {
return false;
}
ambientStartedAt = timeValue;
ambientChapterIndex = requestedIndex;
state = ambientChapterState(world, state, ambientChapterIndex);
root.dataset.worldAmbientChapter = String(ambientChapterIndex);
render(false, false, true);
recordPhaseViewed();
return true;
}

function frame(timeValue) {
frameRequest = null;
if (!renderer) {
return;
}
if (typeof renderer.beginTransition === "function") {
renderer.beginTransition(timeValue);
}
if (motionAllowed()) {
var elapsed = lastFrame ? Math.min(64, timeValue - lastFrame) : 16;
if (typeof renderer.orbit === "function") {
renderer.orbit(elapsed * 0.000035);
}
}
lastFrame = timeValue;
renderer.draw(timeValue);
updateProjectedWorldUi();
synchronizeCameraStable();
if (motionAllowed()) {
scheduleFrame();
}
}

function setPaused(paused, announce) {
if (announce) {
takeManualControl();
}
userPaused = Boolean(paused);
var motionLabel = motionToggle
? (
userPaused
? motionToggle.dataset.resumeLabel
: motionToggle.dataset.pauseLabel
)
: "";
root.dataset.worldPaused = String(userPaused || reducedMotion);
if (motionToggle) {
motionToggle.setAttribute("aria-pressed", String(userPaused));
motionToggle.textContent = motionLabel;
}
if (!userPaused) {
scheduleFrame();
}
if (announce && status && motionLabel) {
status.textContent = motionLabel;
}
}

caseControls.forEach(function (control) {
control.addEventListener("click", function () {
selectCase(control.dataset.businessCase, true, true, "pointer");
});
control.addEventListener("keydown", function (event) {
if (
["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]
.indexOf(event.key) < 0
) {
return;
}
event.preventDefault();
var target = nextControl(
caseControls,
control,
event.key,
direction
);
if (target) {
target.focus();
selectCase(
target.dataset.businessCase,
true,
true,
"keyboard"
);
}
});
});

priorityCaseControls.forEach(function (control) {
control.addEventListener("click", function (event) {
if (
event.defaultPrevented ||
event.metaKey ||
event.ctrlKey ||
event.shiftKey ||
event.altKey ||
(typeof event.button === "number" && event.button !== 0)
) {
return;
}
event.preventDefault();
selectCase(
control.dataset.worldPriorityCase,
true,
true,
"priority"
);
});
});

industryControls.forEach(function (control) {
control.addEventListener("click", function () {
selectIndustry(
control.dataset.businessIndustry,
true,
true,
"pointer"
);
});
control.addEventListener("keydown", function (event) {
if (
["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]
.indexOf(event.key) < 0
) {
return;
}
event.preventDefault();
var target = nextControl(
industryControls,
control,
event.key,
direction
);
if (target) {
target.focus();
selectIndustry(
target.dataset.businessIndustry,
true,
true,
"keyboard"
);
}
});
});

stepButtons.forEach(function (button) {
button.addEventListener("click", function () {
selectStep(button.dataset.worldStepButton, true, true);
});
button.addEventListener("keydown", function (event) {
if (
["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]
.indexOf(event.key) < 0
) {
return;
}
event.preventDefault();
var target = nextControl(
stepButtons,
button,
event.key,
direction
);
if (target) {
target.focus();
selectStep(target.dataset.worldStepButton, true, true);
}
});
});

depthButtons.forEach(function (button) {
button.addEventListener("click", function () {
selectDepth(button.dataset.worldDepthButton, true, true);
});
button.addEventListener("keydown", function (event) {
if (
["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]
.indexOf(event.key) < 0
) {
return;
}
event.preventDefault();
var target = nextControl(
depthButtons,
button,
event.key,
direction
);
if (target) {
target.focus();
selectDepth(target.dataset.worldDepthButton, true, true);
}
});
});

viewToggles.forEach(function (button) {
button.addEventListener("click", function () {
selectView(button.dataset.worldViewToggle, true, true);
});
});

if (motionToggle) {
motionToggle.addEventListener("click", function () {
setPaused(!userPaused, true);
});
}

if (levelUpControl) {
levelUpControl.addEventListener("click", function () {
moveUpOneLevel(true, true);
});
}
if (fullWorldControl) {
fullWorldControl.addEventListener("click", function () {
showFullWorld(true, true);
});
}
if (skipIntroControl) {
skipIntroControl.addEventListener("click", function () {
skipWorldIntro(true, true);
});
}
if (roleLensControl) {
roleLensControl.addEventListener("change", function () {
selectRoleLens(roleLensControl.value);
});
}
comparisonControls.forEach(function (control) {
control.addEventListener("click", function () {
selectComparisonSide(
control.dataset.worldComparisonSide,
"pointer"
);
});
});
if (shareControl) {
shareControl.addEventListener("click", shareCurrentScene);
}
if (tourLink) {
tourLink.addEventListener("click", beginWorldHandoff);
}

if (authorityConfirm) {
authorityConfirm.addEventListener("click", function () {
confirmAuthority("pointer");
});
authorityConfirm.addEventListener("keydown", function (event) {
if (event.key !== "Enter") {
return;
}
event.preventDefault();
confirmAuthority("keyboard");
});
}
qualityActions.forEach(function (action) {
action.addEventListener("click", function () {
applyQualityResolution(
action.dataset.qualityResolution,
"pointer"
);
});
});
authorityActions.forEach(function (action) {
if (action === authorityConfirm) {
return;
}
action.addEventListener("click", function () {
applyAuthorityDecision(
action.dataset.authorityDecision,
"pointer"
);
});
});

function capabilityForId(capabilityId) {
if (
!world ||
!Array.isArray(world.capability_constellations)
) {
return null;
}
return findBy(
world.capability_constellations,
"capability_id",
capabilityId
);
}

function capabilitySceneForId(capabilityId) {
return capabilityScenes.filter(function (scene) {
return scene.dataset.worldCapabilityScene === capabilityId;
})[0] || null;
}

function positionCapabilityMarker(
marker,
index,
total,
metrics,
offsetX,
offsetY
) {
var angle = -Math.PI / 2 + (TAU * index / Math.max(1, total));
var projectedX = metrics.width / 2 +
Math.cos(angle) * metrics.ringRadiusX;
var projectedY = metrics.height / 2 +
Math.sin(angle) * metrics.ringRadiusY;
marker.style.setProperty(
"--world-projected-x",
String(offsetX + projectedX) + "px"
);
marker.style.setProperty(
"--world-projected-y",
String(offsetY + projectedY) + "px"
);
marker.style.setProperty("--world-projected-scale", "1");
marker.dataset.worldFront = "true";
marker.dataset.worldDepthBand = "middle";
marker.dataset.worldHorizontalSide = projectedX < metrics.width / 2
? "left"
: "right";
}

function updateProjectedWorldUi() {
if (!isWorld || !canvas) {
return;
}
var canvasRect = canvas.getBoundingClientRect();
var containerRect = canvasContainer &&
typeof canvasContainer.getBoundingClientRect === "function"
? canvasContainer.getBoundingClientRect()
: {left: 0, top: 0};
var stageRect = stage &&
typeof stage.getBoundingClientRect === "function"
? stage.getBoundingClientRect()
: null;
var viewportWidth = canvasRect.width || canvas.clientWidth || 960;
var viewportHeight = canvasRect.height || canvas.clientHeight || 620;
var camera = renderer && typeof renderer.getCamera === "function"
? renderer.getCamera()
: DEPTH_LOD["L-2"];
var metrics = worldViewportMetrics(
{width: viewportWidth, height: viewportHeight},
camera
);
var offsetX = canvasRect.left - containerRect.left;
var offsetY = canvasRect.top - containerRect.top;
root.dataset.worldLayout = metrics.layout;
root.style.setProperty(
"--world-viewport-width",
String(Math.round(metrics.width)) + "px"
);
root.style.setProperty(
"--world-viewport-height",
String(Math.round(metrics.height)) + "px"
);
root.style.setProperty(
"--world-globe-diameter",
String(Math.round(metrics.globeDiameter)) + "px"
);
root.style.setProperty(
"--world-marker-width",
String(Math.round(metrics.markerWidth)) + "px"
);
root.style.setProperty(
"--world-core-size",
String(Math.round(metrics.coreSize)) + "px"
);
root.style.setProperty(
"--world-logo-height",
String(Math.round(metrics.logoHeight)) + "px"
);
root.style.setProperty(
"--world-logo-width",
String(Math.round(metrics.logoWidth)) + "px"
);
root.style.setProperty(
"--world-card-max-height",
String(Math.round(Math.max(
160,
Math.min(
metrics.layout === "compact" ? 272 : 240,
metrics.height * (metrics.layout === "compact" ? 0.49 : 0.42) - 48
)
))) + "px"
);
var canvasBottom = Number.isFinite(containerRect.bottom)
? containerRect.bottom
: (containerRect.top || 0) + metrics.height;
var desktopEntryBottom = stageRect && Number.isFinite(stageRect.bottom)
? Math.max(26, canvasBottom - (stageRect.bottom - 8) + 10)
: 26;
root.style.setProperty(
"--world-entry-bottom",
String(Math.round(desktopEntryBottom)) + "px"
);
var stageHeight = stageRect && Number.isFinite(stageRect.height)
? stageRect.height
: metrics.height;
var frameCenterY = stageRect && Number.isFinite(stageRect.top)
? stageRect.top + stageHeight / 2 - (containerRect.top || 0)
: metrics.height / 2;
root.style.setProperty(
"--world-frame-center-y",
String(Math.round(frameCenterY)) + "px"
);
root.style.setProperty(
"--world-frame-max-height",
String(Math.round(Math.max(180, Math.min(496, stageHeight - 40)))) + "px"
);
capabilityMarkers.forEach(function (marker, index) {
positionCapabilityMarker(
marker,
index,
capabilityMarkers.length,
metrics,
offsetX,
offsetY
);
});
capabilityScenes.forEach(function (scene) {
if (!scene.hidden) {
scene.dataset.worldFront = "true";
scene.dataset.worldHorizontalSide = "center";
}
});
}

function progressLabel(index, total) {
return String(index + 1).padStart(2, "0") + " / " +
String(total).padStart(2, "0");
}

function updateCapabilityProgress(scene, proofIsOpen) {
if (!scene) {
return;
}
var controls = Array.prototype.slice.call(
scene.querySelectorAll("[data-world-advantage]")
);
var progress = scene.querySelector(
"[data-world-capability-progress]"
);
if (!progress || !controls.length) {
return;
}
var index = proofIsOpen
? controls.length
: Math.max(0, controls.findIndex(function (control) {
return control.dataset.worldAdvantage === activeAdvantageId;
}));
progress.textContent = progressLabel(index, controls.length + 1);
var previous = scene.querySelector(
"[data-world-capability-previous]"
);
var next = scene.querySelector("[data-world-capability-next]");
if (previous) {
previous.disabled = !proofIsOpen && index === 0;
previous.setAttribute(
"aria-disabled",
String(previous.disabled)
);
}
if (next) {
next.disabled = Boolean(proofIsOpen);
next.setAttribute("aria-disabled", String(next.disabled));
}
}

function updateDifferentiationProgress(index) {
if (!differentiationProgress || !differentiatorControls.length) {
return;
}
differentiationProgress.textContent = progressLabel(
Math.max(0, index),
differentiatorControls.length
);
if (differentiationPrevious) {
differentiationPrevious.disabled = index <= 0;
differentiationPrevious.setAttribute(
"aria-disabled",
String(differentiationPrevious.disabled)
);
}
if (differentiationNext) {
differentiationNext.disabled =
index >= differentiatorControls.length - 1;
differentiationNext.setAttribute(
"aria-disabled",
String(differentiationNext.disabled)
);
}
}

function setDifferentiationScene(active, restoreFocus) {
if (!isWorld || !differentiationScene) {
return;
}
var isActive = Boolean(active);
if (isActive) {
activeCapabilityId = null;
activeAdvantageId = null;
capabilityScenes.forEach(function (scene) {
scene.hidden = true;
});
capabilityMarkers.forEach(function (marker) {
marker.setAttribute("aria-pressed", "false");
});
root.dataset.worldCapabilitySelected = "false";
root.dataset.worldProofOpen = "false";
}
root.dataset.worldDifferentiationOpen = String(isActive);
differentiationScene.hidden = !isActive;
if (differentiationToggle) {
differentiationToggle.setAttribute(
"aria-expanded",
String(isActive)
);
}
differentiatorControls.forEach(function (control, index) {
control.setAttribute(
"aria-expanded",
String(isActive && index === 0)
);
});
updateDifferentiationProgress(0);
if (
!isActive &&
restoreFocus &&
differentiationToggle &&
typeof differentiationToggle.focus === "function"
) {
differentiationToggle.focus({preventScroll: true});
}
}

function openDifferentiationScene() {
clearCapabilitySelection(false);
setWorldPanel(false, false);
setDifferentiationScene(true, false);
}

function clearCapabilitySelection(restoreFocus) {
var previousId = activeCapabilityId;
activeCapabilityId = null;
activeAdvantageId = null;
root.dataset.worldCapabilitySelected = "false";
root.dataset.worldCapabilityId = "";
root.dataset.worldAdvantageSelected = "false";
root.dataset.worldProofOpen = "false";
capabilityMarkers.forEach(function (marker) {
marker.setAttribute("aria-pressed", "false");
});
capabilityScenes.forEach(function (scene) {
scene.hidden = true;
scene.querySelectorAll("[data-world-advantage]").forEach(
function (control) {
control.setAttribute("aria-expanded", "false");
}
);
var proof = scene.querySelector("[data-world-proof-emission]");
var proofToggle = scene.querySelector("[data-world-proof-toggle]");
if (proof) {
proof.hidden = true;
}
if (proofToggle) {
proofToggle.setAttribute("aria-expanded", "false");
}
updateCapabilityProgress(scene, false);
});
if (restoreFocus && previousId) {
var marker = capabilityMarkers.filter(function (control) {
return control.dataset.worldCapabilityMarker === previousId;
})[0];
if (marker && typeof marker.focus === "function") {
marker.focus({preventScroll: true});
}
}
}

function selectBusinessCapability(capabilityId, focusAdvantage) {
var capability = capabilityForId(capabilityId);
var scene = capabilitySceneForId(capabilityId);
if (!capability || !scene) {
return;
}
takeManualControl();
setPaused(true, false);
setWorldPanel(false, false);
setDifferentiationScene(false, false);
activeCapabilityId = capabilityId;
activeAdvantageId = null;
root.dataset.worldCapabilitySelected = "true";
root.dataset.worldCapabilityId = capabilityId;
root.dataset.worldAdvantageSelected = "false";
root.dataset.worldProofOpen = "false";
capabilityMarkers.forEach(function (marker) {
marker.setAttribute(
"aria-pressed",
String(
marker.dataset.worldCapabilityMarker === capabilityId
)
);
});
capabilityScenes.forEach(function (candidate) {
candidate.hidden = candidate !== scene;
});
var proof = scene.querySelector("[data-world-proof-emission]");
var proofToggle = scene.querySelector("[data-world-proof-toggle]");
if (proof) {
proof.hidden = true;
}
if (proofToggle) {
proofToggle.setAttribute("aria-expanded", "false");
}
var firstAdvantage = scene.querySelector("[data-world-advantage]");
if (firstAdvantage) {
selectBusinessAdvantage(firstAdvantage);
} else {
updateCapabilityProgress(scene, false);
}
updateProjectedWorldUi();
if (focusAdvantage) {
if (
firstAdvantage &&
typeof firstAdvantage.focus === "function"
) {
firstAdvantage.focus({preventScroll: true});
}
}
}

function selectBusinessAdvantage(control) {
if (!control || !activeCapabilityId) {
return;
}
var nextId = control.dataset.worldAdvantage;
activeAdvantageId = nextId;
root.dataset.worldAdvantageSelected = "true";
var scene = capabilitySceneForId(activeCapabilityId);
if (!scene) {
return;
}
scene.querySelectorAll("[data-world-advantage]").forEach(
function (candidate) {
candidate.setAttribute(
"aria-expanded",
String(
candidate.dataset.worldAdvantage === nextId
)
);
}
);
updateCapabilityProgress(scene, false);
}

function toggleCapabilityProof(control) {
if (!control || !activeCapabilityId) {
return;
}
var scene = capabilitySceneForId(activeCapabilityId);
var proof = scene &&
scene.querySelector("[data-world-proof-emission]");
if (!proof) {
return;
}
var open = proof.hidden;
proof.hidden = !open;
control.setAttribute("aria-expanded", String(open));
root.dataset.worldProofOpen = String(open);
updateCapabilityProgress(scene, open);
}

function advanceCapabilityScene(scene) {
if (!scene || !activeCapabilityId) {
return;
}
if (root.dataset.worldProofOpen === "true") {
return;
}
var controls = Array.prototype.slice.call(
scene.querySelectorAll("[data-world-advantage]")
);
if (!controls.length) {
return;
}
var activeIndex = controls.findIndex(function (control) {
return control.dataset.worldAdvantage === activeAdvantageId;
});
if (activeIndex < controls.length - 1) {
var nextControl = controls[Math.max(0, activeIndex + 1)];
selectBusinessAdvantage(nextControl);
if (typeof nextControl.focus === "function") {
nextControl.focus({preventScroll: true});
}
return;
}
var proofToggle = scene.querySelector("[data-world-proof-toggle]");
if (proofToggle) {
toggleCapabilityProof(proofToggle);
}
}

function retreatCapabilityScene(scene) {
if (!scene || !activeCapabilityId) {
return;
}
var controls = Array.prototype.slice.call(
scene.querySelectorAll("[data-world-advantage]")
);
if (!controls.length) {
return;
}
if (root.dataset.worldProofOpen === "true") {
var proofToggle = scene.querySelector("[data-world-proof-toggle]");
if (proofToggle) {
toggleCapabilityProof(proofToggle);
}
var lastControl = controls[controls.length - 1];
selectBusinessAdvantage(lastControl);
if (typeof lastControl.focus === "function") {
lastControl.focus({preventScroll: true});
}
return;
}
var activeIndex = controls.findIndex(function (control) {
return control.dataset.worldAdvantage === activeAdvantageId;
});
if (activeIndex <= 0) {
return;
}
var previousControl = controls[activeIndex - 1];
selectBusinessAdvantage(previousControl);
if (typeof previousControl.focus === "function") {
previousControl.focus({preventScroll: true});
}
}

capabilityMarkers.forEach(function (marker) {
marker.addEventListener("click", function () {
selectBusinessCapability(
marker.dataset.worldCapabilityMarker,
true
);
});
});
capabilityScenes.forEach(function (scene) {
scene.querySelectorAll("[data-world-advantage]").forEach(
function (control) {
control.addEventListener("click", function () {
selectBusinessAdvantage(control);
});
}
);
var proofToggle = scene.querySelector("[data-world-proof-toggle]");
if (proofToggle) {
proofToggle.addEventListener("click", function () {
toggleCapabilityProof(proofToggle);
});
}
var closeControl = scene.querySelector(
"[data-world-capability-close]"
);
if (closeControl) {
closeControl.addEventListener("click", function () {
clearCapabilitySelection(true);
});
}
var nextControl = scene.querySelector(
"[data-world-capability-next]"
);
if (nextControl) {
nextControl.addEventListener("click", function () {
advanceCapabilityScene(scene);
});
}
var previousControl = scene.querySelector(
"[data-world-capability-previous]"
);
if (previousControl) {
previousControl.addEventListener("click", function () {
retreatCapabilityScene(scene);
});
}
});
if (differentiationToggle && differentiationScene) {
differentiationToggle.addEventListener("click", function () {
openDifferentiationScene();
});
}
differentiatorControls.forEach(function (control) {
control.addEventListener("click", function () {
differentiatorControls.forEach(function (candidate) {
candidate.setAttribute(
"aria-expanded",
String(candidate === control)
);
});
updateDifferentiationProgress(
Math.max(0, differentiatorControls.indexOf(control))
);
});
});
if (differentiationClose) {
differentiationClose.addEventListener("click", function () {
setDifferentiationScene(false, true);
});
}
if (differentiationNext) {
differentiationNext.addEventListener("click", function () {
if (!differentiatorControls.length) {
return;
}
var currentIndex = differentiatorControls.findIndex(
function (control) {
return control.getAttribute("aria-expanded") === "true";
}
);
var nextIndex = Math.min(
differentiatorControls.length - 1,
currentIndex + 1
);
var nextControl = differentiatorControls[nextIndex];
differentiatorControls.forEach(function (control) {
control.setAttribute(
"aria-expanded",
String(control === nextControl)
);
});
updateDifferentiationProgress(nextIndex);
if (typeof nextControl.focus === "function") {
nextControl.focus({preventScroll: true});
}
});
}
if (differentiationPrevious) {
differentiationPrevious.addEventListener("click", function () {
if (!differentiatorControls.length) {
return;
}
var currentIndex = differentiatorControls.findIndex(
function (control) {
return control.getAttribute("aria-expanded") === "true";
}
);
var previousIndex = Math.max(0, currentIndex - 1);
var previousControl = differentiatorControls[previousIndex];
differentiatorControls.forEach(function (control) {
control.setAttribute(
"aria-expanded",
String(control === previousControl)
);
});
updateDifferentiationProgress(previousIndex);
if (typeof previousControl.focus === "function") {
previousControl.focus({preventScroll: true});
}
});
}

function setWorldPanel(active, restoreFocus) {
if (!isWorld || !selectionPanel) {
return;
}
var panelIsOpen = Boolean(active);
root.dataset.worldPanelOpen = String(panelIsOpen);
selectionPanel.setAttribute("aria-hidden", String(!panelIsOpen));
if (selectionPanelToggle) {
selectionPanelToggle.setAttribute(
"aria-expanded",
String(panelIsOpen)
);
}
if (
panelIsOpen &&
caseControls.length &&
typeof caseControls[0].focus === "function"
) {
caseControls[0].focus({preventScroll: true});
} else if (
!panelIsOpen &&
restoreFocus !== false &&
selectionPanelToggle &&
typeof selectionPanelToggle.focus === "function"
) {
selectionPanelToggle.focus({preventScroll: true});
}
}

function enterWorldFromHeader(actionId) {
if (!isWorld) {
return;
}
if (actionId === "explore") {
clearCapabilitySelection(false);
setDifferentiationScene(false, false);
setWorldPanel(false, false);
showFullWorld(true, true);
} else if (actionId === "story") {
setWorldPanel(false, false);
if (
Array.isArray(world.capability_constellations) &&
world.capability_constellations.length
) {
selectBusinessCapability(
world.capability_constellations[0].capability_id,
false
);
}
} else if (actionId === "problem") {
openDifferentiationScene();
} else {
return;
}
if (
actionId !== "problem" &&
stage &&
typeof stage.scrollIntoView === "function"
) {
stage.scrollIntoView({
behavior: reducedMotion ? "auto" : "smooth",
block: "start"
});
}
if (
actionId === "explore" &&
stage &&
typeof stage.focus === "function"
) {
stage.focus({preventScroll: true});
}
}

entryActionControls.forEach(function (control) {
control.addEventListener("click", function () {
enterWorldFromHeader(control.dataset.worldEntryAction);
});
});
if (selectionPanelToggle) {
selectionPanelToggle.addEventListener("click", function () {
setWorldPanel(
root.dataset.worldPanelOpen !== "true",
true
);
});
}
selectionPanelCloseControls.forEach(function (control) {
control.addEventListener("click", function () {
setWorldPanel(false, true);
});
});

function isInteractiveWorldTarget(target) {
if (!target) {
return false;
}
if (typeof target.closest === "function") {
return Boolean(target.closest(
"a,button,input,select,textarea,summary,[contenteditable]," +
"[role='dialog'],[aria-modal='true'],[data-world-interactive]"
));
}
var tagName = String(target.tagName || "").toLowerCase();
return includes(
["a", "button", "input", "select", "textarea", "summary"],
tagName
) || (
typeof target.getAttribute === "function" &&
(
target.getAttribute("contenteditable") != null ||
target.getAttribute("role") === "dialog" ||
target.getAttribute("aria-modal") === "true" ||
target.getAttribute("data-world-interactive") != null
)
);
}

function isInside(container, target) {
return Boolean(
container &&
target &&
(
container === target ||
(
typeof container.contains === "function" &&
container.contains(target)
)
)
);
}

function isWorldEscape(event) {
var target = event && event.target
? event.target
: documentObject.activeElement;
return Boolean(
isInside(root, target) &&
!isInteractiveWorldTarget(target)
);
}

if (isWorld && stage) {
stage.setAttribute("tabindex", "0");
stage.addEventListener("keydown", function (event) {
if (!renderer || isInteractiveWorldTarget(event.target)) {
return;
}
if (
event.key === "Escape" &&
root.dataset.worldPanelOpen === "true"
) {
event.preventDefault();
setWorldPanel(false, true);
return;
}
var horizontalDirection = direction === "rtl" ? -1 : 1;
if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
event.preventDefault();
takeManualControl();
renderer.rotate(
(event.key === "ArrowRight" ? 1 : -1) *
horizontalDirection * 0.09,
0
);
renderer.draw(0);
updateProjectedWorldUi();
} else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
event.preventDefault();
takeManualControl();
renderer.rotate(0, event.key === "ArrowDown" ? 0.07 : -0.07);
renderer.draw(0);
updateProjectedWorldUi();
} else if (event.key === " " || event.key === "Spacebar") {
event.preventDefault();
setPaused(!userPaused, true);
} else if (event.key === "Escape" && isWorldEscape(event)) {
event.preventDefault();
moveUpOneLevel(true, true);
}
});
}

if (isWorld && documentObject.addEventListener) {
documentObject.addEventListener("keydown", function (event) {
if (
event.key !== "Escape" ||
event.defaultPrevented ||
event.metaKey ||
event.ctrlKey ||
event.altKey
) {
return;
}
if (root.dataset.worldPanelOpen === "true") {
event.preventDefault();
setWorldPanel(false, true);
return;
}
if (
isInside(
root,
event.target || documentObject.activeElement
) &&
activeCapabilityId
) {
event.preventDefault();
clearCapabilitySelection(true);
return;
}
if (
isInside(
root,
event.target || documentObject.activeElement
) &&
root.dataset.worldDifferentiationOpen === "true"
) {
event.preventDefault();
setDifferentiationScene(false, true);
return;
}
if (!isWorldEscape(event)) {
return;
}
event.preventDefault();
moveUpOneLevel(true, true);
});
}

globalWindow.addEventListener("popstate", function () {
takeManualControl();
lastHistoryQuery = String(
globalWindow.location.search || ""
).replace(/^\?/, "");
state = isWorld
? parseWorldState(globalWindow.location.search, contract, world)
: parseState(globalWindow.location.search, contract);
if (isWorld) {
resetGovernedDecisions();
resetSceneControlsForCase();
}
render(false, true, true);
if (isWorld) {
recordPhaseViewed();
}
});

function updateRendererPresentation(forcedMode) {
if (!isWorld) {
return;
}
var mode = forcedMode || (
renderer && !webglContextLost
? renderer.mode
: staticWorldFallback
? "static"
: "text"
);
var canvasIsActive = Boolean(
canvas &&
renderer &&
!webglContextLost &&
(
renderer.mode === "static" ||
renderer.mode.indexOf("webgl") === 0
) &&
!printing &&
!reducedMotion &&
true
);
root.dataset.worldRenderer = mode;
root.dataset.worldTextView = "false";
if (canvas) {
canvas.hidden = !canvasIsActive;
}
if (staticWorldFallback) {
staticWorldFallback.hidden = canvasIsActive;
}
}

function failClosedToStatic(reasonId) {
webglContextLost = true;
updateRendererPresentation(staticWorldFallback ? "static" : "text");
recordAnalytics("renderer_fallback", {
renderer_mode: staticWorldFallback ? "static" : "text",
reason_id: isNonEmptyText(reasonId) ? reasonId : "runtime-failed"
});
}

function initializeWorldRenderer(allowWebGL) {
if (!isWorld || !canvas) {
renderer = null;
updateRendererPresentation("static");
return;
}
if (allowWebGL) {
renderer = createWebGLRenderer(
canvas,
world,
state,
globalWindow,
{
onInitializationFailure: function () {
failClosedToStatic("initialization-failed");
},
onRuntimeFailure: function () {
failClosedToStatic("runtime-failed");
}
}
);
}
if (!renderer && !webglContextLost) {
if (allowWebGL) {
recordAnalytics("renderer_fallback", {
renderer_mode: staticWorldFallback ? "static" : "text",
reason_id: "webgl-unavailable"
});
}
renderer = drawStaticFallback(canvas, world, state);
}
updateRendererPresentation();
}

if (isWorld) {
webglContextLost = false;
initializeWorldRenderer(Boolean(canvas && !reducedMotion));
}

if (isWorld && canvas) {
canvas.addEventListener("webglcontextlost", function (event) {
if (event && typeof event.preventDefault === "function") {
event.preventDefault();
}
webglContextLost = true;
if (renderer && typeof renderer.setContextLost === "function") {
renderer.setContextLost(true);
}
failClosedToStatic("context-lost");
});
canvas.addEventListener("webglcontextrestored", function () {
if (reducedMotion || printing) {
return;
}
if (renderer && typeof renderer.destroy === "function") {
renderer.destroy();
}
renderer = null;
webglContextLost = false;
initializeWorldRenderer(true);
renderWorld(false);
if (renderer) {
renderer.draw(0);
updateProjectedWorldUi();
synchronizeCameraStable();
scheduleFrame();
}
});
}

if (isWorld && typeof globalWindow.IntersectionObserver === "function" && stage) {
var intersectionObserver = new globalWindow.IntersectionObserver(
function (entries) {
stageVisible = entries.some(function (entry) {
return entry.isIntersecting && entry.intersectionRatio > 0;
});
if (stageVisible) {
scheduleFrame();
}
},
{threshold: [0, 0.01, 0.25]}
);
intersectionObserver.observe(stage);
}
if (isWorld && typeof globalWindow.ResizeObserver === "function" && stage) {
var resizeObserver = new globalWindow.ResizeObserver(function () {
if (renderer) {
renderer.draw(0);
}
updateProjectedWorldUi();
});
resizeObserver.observe(stage);
}
if (isWorld && typeof globalWindow.addEventListener === "function") {
globalWindow.addEventListener("resize", function () {
if (renderer) {
renderer.draw(0);
}
updateProjectedWorldUi();
});
}
documentObject.addEventListener &&
documentObject.addEventListener("visibilitychange", function () {
documentVisible = !documentObject.hidden;
if (documentVisible) {
scheduleFrame();
}
});
globalWindow.addEventListener("beforeprint", function () {
printing = true;
if (isWorld) {
updateRendererPresentation(staticWorldFallback ? "static" : "text");
}
});
globalWindow.addEventListener("afterprint", function () {
printing = false;
if (isWorld) {
updateRendererPresentation();
}
if (canvas && renderer && !webglContextLost) {
renderer.draw(0);
updateProjectedWorldUi();
}
});

root.dataset.enhanced = "true";
if (isWorld) {
root.dataset.worldContract = WORLD_CONTRACT_ID;
updateProjectedWorldUi();
}
render(false, false, false);
if (isWorld) {
recordAnalytics("world_started", {
renderer_mode: currentRendererMode(),
motion_mode: currentMotionMode()
});
recordPhaseViewed();
}
if (renderer) {
renderer.draw(0);
updateProjectedWorldUi();
synchronizeCameraStable();
scheduleFrame();
}

return {
contract: contract,
world: world,
getState: function () {
return {
caseId: state.caseId,
industryId: state.industryId
};
},
getWorldState: function () {
return isWorld ? {
caseId: state.caseId,
industryId: state.industryId,
stepId: state.stepId,
viewId: state.viewId,
depthId: state.depthId,
authorityConfirmed: state.authorityConfirmed === true,
authorityRecord: state.authorityRecord
? Object.assign({}, state.authorityRecord)
: null,
qualityResolution: includes(
QUALITY_RESOLUTION_IDS,
state.qualityResolution
)
? state.qualityResolution
: "UNRESOLVED",
comparisonSide: normalizedComparisonSide(
profileFor(world, state.caseId).scene.comparison_mode,
state.comparisonSide
),
roleLensIndex: normalizedRoleLensIndex(
state.roleLensIndex,
state.roleLensCount
),
textView: false
} : null;
},
getAnalyticsEntries: function () {
return analyticsRecorder ? analyticsRecorder.entries() : [];
},
renderer: renderer,
beginWorldHandoff: beginWorldHandoff,
moveUpOneLevel: moveUpOneLevel,
selectCase: selectCase,
selectComparisonSide: selectComparisonSide,
confirmAuthority: confirmAuthority,
selectIndustry: selectIndustry,
selectRoleLens: selectRoleLens,
selectDepth: selectDepth,
selectStep: selectStep,
selectView: selectView,
setPaused: setPaused,
setTextView: setTextView,
shareCurrentScene: shareCurrentScene,
showFullWorld: showFullWorld,
skipWorldIntro: skipWorldIntro
};
}

return {
AMBIENT_CHAPTER_DURATION_MS: AMBIENT_CHAPTER_DURATION_MS,
AUTHORITY_DECISION_IDS: AUTHORITY_DECISION_IDS,
BRAND_HEX: BRAND_HEX,
CAMERA_STATES: CAMERA_STATES,
CERTAINTY_IDS: CERTAINTY_IDS,
COMPARISON_SIDE_IDS: COMPARISON_SIDE_IDS,
DEPTH_LOD: DEPTH_LOD,
DEPTH_IDS: DEPTH_IDS,
EFFECT_IDS: EFFECT_IDS,
EXPERIENCE_ANALYTICS_CONTRACT: JSON.parse(
JSON.stringify(EXPERIENCE_ANALYTICS_CONTRACT)
),
EXPERIENCE_ANALYTICS_EVENT_NAME: EXPERIENCE_ANALYTICS_EVENT_NAME,
GEOMETRY_RECIPE_IDS: GEOMETRY_RECIPE_IDS,
HANDOFF_CONTRACT: JSON.parse(JSON.stringify(HANDOFF_CONTRACT)),
INTERACTION_IDS: INTERACTION_IDS,
JURISDICTION_CONTOUR_SEGMENTS: JURISDICTION_CONTOUR_SEGMENTS,
JURISDICTION_PROFILE_BY_ANCHOR_ID: Object.assign(
{},
JURISDICTION_PROFILE_BY_ANCHOR_ID
),
JURISDICTION_SILHOUETTES: JURISDICTION_SILHOUETTES,
MORPH_STAGE_IDS: MORPH_STAGE_IDS,
PHASE_EFFECTS: PHASE_EFFECTS,
PHASE_IDS: PHASE_IDS,
PORTAL_CONTRACT: JSON.parse(JSON.stringify(PORTAL_CONTRACT)),
PREFLIGHT_IDS: PREFLIGHT_IDS,
PROFILE_ID_BY_STORY_ID: Object.assign({}, PROFILE_ID_BY_STORY_ID),
QUALITY_RESOLUTION_IDS: QUALITY_RESOLUTION_IDS,
RECIPE_BY_PROFILE_ID: Object.assign({}, RECIPE_BY_PROFILE_ID),
SCENE_CONTRACT_BY_PROFILE_ID: JSON.parse(
JSON.stringify(SCENE_CONTRACT_BY_PROFILE_ID)
),
SCENE_LAYERS: SCENE_LAYERS,
SCENE_STATE_GROUP_IDS: SCENE_STATE_GROUP_IDS,
SEMANTIC_LOD_CONTRACT: JSON.parse(
JSON.stringify(SEMANTIC_LOD_CONTRACT)
),
VIEW_IDS: VIEW_IDS,
WORLD_CONTROL_IDS: WORLD_CONTROL_IDS,
WEBGL_SHADER_SOURCES: WEBGL_SHADER_SOURCES,
ambientChapterState: ambientChapterState,
analyticsContractIsValid: analyticsContractIsValid,
analyticsEventPayloadIsValid: analyticsEventPayloadIsValid,
analyticsScalarTokenIsValid: analyticsScalarTokenIsValid,
authorityGateFrame: authorityGateFrame,
buildProjection: buildProjection,
buildSphereMesh: buildSphereMesh,
cameraForAnchor: cameraForAnchor,
canonicalHandoffUrl: canonicalHandoffUrl,
canonicalNodeCorridor: canonicalNodeCorridor,
canonicalWorldShareUrl: canonicalWorldShareUrl,
caseSceneGeometry: caseSceneGeometry,
chooseRendererMode: chooseRendererMode,
createExperienceAnalyticsRecorder: createExperienceAnalyticsRecorder,
createWebGLRenderer: createWebGLRenderer,
defaultWorldState: defaultWorldState,
deterministicSignals: deterministicSignals,
dominantEffectIntensity: dominantEffectIntensity,
easeCinematic: easeCinematic,
evidenceRewindFrame: evidenceRewindFrame,
evidenceRewindPath: evidenceRewindPath,
evidenceTraversalFrame: evidenceTraversalFrame,
greatCirclePoints: greatCirclePoints,
handoffCanBeEnhanced: handoffCanBeEnhanced,
interpolateCamera: interpolateCamera,
interpolatePointPaths: interpolatePointPaths,
interpolateOrientation: interpolateOrientation,
isEvidenceRewind: isEvidenceRewind,
isFrontFacing: isFrontFacing,
isValidContract: isValidContract,
isValidWorldContract: isValidWorldContract,
latLonToCartesian: latLonToCartesian,
jurisdictionProfileForAnchor: jurisdictionProfileForAnchor,
mount: mount,
morphStageForPhase: morphStageForPhase,
nextControl: nextControl,
normalizedComparisonSide: normalizedComparisonSide,
normalizedRoleLensIndex: normalizedRoleLensIndex,
parseState: parseState,
parseWorldState: parseWorldState,
phaseProgressClocks: phaseProgressClocks,
pointOnPath: pointOnPath,
perspectiveProject: perspectiveProject,
prefersReducedMotion: prefersReducedMotion,
previousDepthId: previousDepthId,
profileFor: profileFor,
handoffContractIsValid: handoffContractIsValid,
portalContractIsValid: portalContractIsValid,
portalTraversalFrame: portalTraversalFrame,
progressivePolyline: progressivePolyline,
projectJurisdictionContour: projectJurisdictionContour,
projectGeoPoint: projectGeoPoint,
recommendedCaseIds: recommendedCaseIds,
renderingContractIsValid: renderingContractIsValid,
reverseCameraTransition: reverseCameraTransition,
resampleClosedContour: resampleClosedContour,
rotatePoint: rotatePoint,
sceneDescriptor: sceneDescriptor,
sceneContractIsValid: sceneContractIsValid,
sceneEffectForPhase: sceneEffectForPhase,
sceneForProfile: sceneForProfile,
sceneLayerPlan: sceneLayerPlan,
sceneTransitionFrame: sceneTransitionFrame,
serializeState: serializeState,
serializeWorldState: serializeWorldState,
skipIntroState: skipIntroState,
stableHash: stableHash,
semanticLodContractIsValid: semanticLodContractIsValid,
semanticLodMetadata: semanticLodMetadata,
semanticSceneState: semanticSceneState,
semanticStatesContractIsValid: semanticStatesContractIsValid,
signedContourArea: signedContourArea,
contourForStage: contourForStage,
qualityGateFrame: qualityGateFrame,
versionCrystalGeometry: versionCrystalGeometry,
worldViewportMetrics: worldViewportMetrics,
worldCountryBoundarySegments: worldCountryBoundarySegments,
worldLineGeometry: worldLineGeometry
};
}));
