"use strict";

(function pricingModule(global) {
  const SCHEMA_VERSION = "advanexus-pricing/v1";
  const ESTIMATE_VERSION = "advanexus-pricing-estimate/v1";
  const SHARE_PREFIX = "#pricing=v1.";
  const SHARE_MAX_CHARACTERS = 4096;
  const PLAN_IDS = Object.freeze(["foundation", "control", "assurance", "regulated"]);
  const PACK_DIMENSIONS = Object.freeze([
    "projects",
    "connectors",
    "governed_flows",
    "annual_executions"
  ]);
  const ACCESS_SECURITY_PLANNING_DIMENSIONS = Object.freeze(["users"]);
  const COUNT_FIELDS = Object.freeze([
    "tenants",
    "projects",
    "users",
    "production_environments",
    "non_production_environments",
    "connectors",
    "governed_flows",
    "annual_executions",
    "retention_months"
  ]);
  const SERVICE_FIELDS = Object.freeze([
    "implementation_engineer",
    "senior_architect",
    "assurance_security",
    "principal_regulated",
    "training"
  ]);
  const SCENARIO_FIELDS = new Set([
    "plan_id",
    "term_months",
    "support_id",
    "deployment_id",
    ...COUNT_FIELDS,
    "intelligence_option_id",
    "anpy_option_id",
    "private_networking",
    "customer_managed_storage",
    "implementation_complexity",
    "custom_connector_certification",
    "discovery_workshops",
    "delivery_sprints",
    "professional_service_days"
  ]);
  const SHARE_FIELDS = Object.freeze([
    "plan_id",
    "term_months",
    "support_id",
    "deployment_id",
    ...COUNT_FIELDS,
    "intelligence_option_id",
    "anpy_option_id",
    "private_networking",
    "customer_managed_storage",
    "implementation_complexity",
    "custom_connector_certification",
    "discovery_workshops",
    "delivery_sprints",
    "professional_service_days"
  ]);

  function fail(message) {
    throw new TypeError(message);
  }

  function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function requireCatalog(catalog) {
    if (!isRecord(catalog) || catalog.schema_version !== SCHEMA_VERSION) {
      fail(`Pricing catalog must use ${SCHEMA_VERSION}`);
    }
    if (catalog.currency !== "EUR" || !Array.isArray(catalog.plans)) {
      fail("Pricing catalog must contain EUR plans");
    }
    const ids = catalog.plans.map((plan) => plan.plan_id);
    if (ids.join("|") !== PLAN_IDS.join("|")) {
      fail("Pricing catalog plan order is invalid");
    }
    if (
      !isRecord(catalog.calculation_limits) ||
      !isRecord(catalog.capacity_packs) ||
      !isRecord(catalog.capacity_pack_boundaries) ||
      !Number.isSafeInteger(
        catalog.capacity_pack_boundaries.annual_executions_custom_at_units
      )
    ) {
      fail("Pricing catalog calculator limits are missing");
    }
    const accessSecurityPlanningDimensions =
      catalog.access_security_planning_dimensions ||
      ACCESS_SECURITY_PLANNING_DIMENSIONS;
    if (
      !Array.isArray(accessSecurityPlanningDimensions) ||
      accessSecurityPlanningDimensions.join("|") !==
        ACCESS_SECURITY_PLANNING_DIMENSIONS.join("|")
    ) {
      fail("users must remain an access and security planning dimension");
    }
    return catalog;
  }

  function findById(rows, field, identifier) {
    const row = rows.find((candidate) => candidate[field] === identifier);
    if (!row) {
      fail(`Unknown ${field}: ${identifier}`);
    }
    return row;
  }

  function percentage(amount, basisPoints) {
    return Math.floor((amount * basisPoints + 5000) / 10000);
  }

  function greatestCommonDivisor(first, second) {
    let left = first;
    let right = second;
    while (right) {
      [left, right] = [right, left % right];
    }
    return left;
  }

  function compareCounts(first, second) {
    for (let index = 0; index < first.length; index += 1) {
      if (first[index] !== second[index]) {
        return first[index] - second[index];
      }
    }
    return 0;
  }

  function compareState(first, second) {
    if (first.price !== second.price) {
      return first.price - second.price;
    }
    if (first.count !== second.count) {
      return first.count - second.count;
    }
    return compareCounts(first.counts, second.counts);
  }

  function selectCapacityPacks(requestedExtra, packs) {
    if (!Number.isSafeInteger(requestedExtra) || requestedExtra < 0) {
      fail("requestedExtra must be a non-negative safe integer");
    }
    if (!Array.isArray(packs) || packs.length === 0) {
      fail("At least one capacity pack is required");
    }
    if (requestedExtra === 0) {
      return {
        requested_extra: 0,
        covered_extra: 0,
        overprovisioned_units: 0,
        annual_eur: 0,
        packs: []
      };
    }
    const unitGcd = packs
      .map((pack) => pack.units)
      .reduce(greatestCommonDivisor);
    const normalized = packs.map((pack) => {
      if (
        !Number.isSafeInteger(pack.units) ||
        pack.units <= 0 ||
        !Number.isSafeInteger(pack.annual_eur) ||
        pack.annual_eur <= 0
      ) {
        fail("Capacity pack units and annual price must be positive integers");
      }
      return {
        pack_id: pack.pack_id,
        units: pack.units / unitGcd,
        annual_eur: pack.annual_eur
      };
    });
    const target = Math.ceil(requestedExtra / unitGcd);
    const limit = target + Math.max(...normalized.map((pack) => pack.units)) - 1;
    const states = Array.from({ length: limit + 1 }, () => null);
    states[0] = {
      price: 0,
      count: 0,
      counts: normalized.map(() => 0)
    };
    for (let capacity = 0; capacity <= limit; capacity += 1) {
      const state = states[capacity];
      if (!state) {
        continue;
      }
      normalized.forEach((pack, index) => {
        const nextCapacity = capacity + pack.units;
        if (nextCapacity > limit) {
          return;
        }
        const counts = state.counts.slice();
        counts[index] += 1;
        const candidate = {
          price: state.price + pack.annual_eur,
          count: state.count + 1,
          counts
        };
        if (!states[nextCapacity] || compareState(candidate, states[nextCapacity]) < 0) {
          states[nextCapacity] = candidate;
        }
      });
    }
    const candidates = [];
    for (let capacity = target; capacity <= limit; capacity += 1) {
      if (states[capacity]) {
        candidates.push({ capacity, state: states[capacity] });
      }
    }
    candidates.sort((first, second) => {
      const stateDifference = compareState(first.state, second.state);
      if (first.state.price !== second.state.price) {
        return first.state.price - second.state.price;
      }
      const excessDifference =
        first.capacity - target - (second.capacity - target);
      if (excessDifference !== 0) {
        return excessDifference;
      }
      if (first.state.count !== second.state.count) {
        return first.state.count - second.state.count;
      }
      return stateDifference;
    });
    if (!candidates.length) {
      fail("Capacity pack optimization has no bounded solution");
    }
    const winner = candidates[0];
    const selected = normalized.flatMap((pack, index) => {
      const count = winner.state.counts[index];
      return count
        ? [{
            pack_id: pack.pack_id,
            count,
            units_each: pack.units * unitGcd,
            annual_eur_each: pack.annual_eur,
            annual_eur: count * pack.annual_eur
          }]
        : [];
    });
    const covered = winner.capacity * unitGcd;
    return {
      requested_extra: requestedExtra,
      covered_extra: covered,
      overprovisioned_units: covered - requestedExtra,
      annual_eur: winner.state.price,
      packs: selected
    };
  }

  function normalizeScenario(catalogSource, source = {}) {
    const catalog = requireCatalog(catalogSource);
    if (!isRecord(source)) {
      fail("Pricing scenario must be an object");
    }
    const unknown = Object.keys(source).filter((field) => !SCENARIO_FIELDS.has(field));
    if (unknown.length) {
      fail(`Unknown pricing fields: ${unknown.sort().join(", ")}`);
    }
    const scenario = {
      plan_id: "foundation",
      term_months: 12,
      support_id: "standard",
      deployment_id: "customer_managed",
      tenants: 1,
      projects: 1,
      users: 1,
      production_environments: 1,
      non_production_environments: 1,
      connectors: 1,
      governed_flows: 1,
      annual_executions: 0,
      retention_months: 3,
      intelligence_option_id: "none",
      anpy_option_id: "shared",
      private_networking: false,
      customer_managed_storage: false,
      implementation_complexity: "standard",
      custom_connector_certification: false,
      discovery_workshops: 0,
      delivery_sprints: 0,
      professional_service_days: {},
      ...source
    };

    findById(catalog.plans, "plan_id", scenario.plan_id);
    findById(catalog.term_discounts, "term_months", scenario.term_months);
    findById(catalog.support_tiers, "support_id", scenario.support_id);
    findById(catalog.deployment_options, "deployment_id", scenario.deployment_id);
    findById(
      catalog.annual_add_ons.intelligence,
      "option_id",
      scenario.intelligence_option_id
    );
    findById(catalog.annual_add_ons.anpy, "option_id", scenario.anpy_option_id);
    if (!Object.hasOwn(
      catalog.implementation.complexity_multipliers_basis_points,
      scenario.implementation_complexity
    )) {
      fail("Unknown implementation_complexity");
    }

    const minimums = {
      tenants: 1,
      projects: 1,
      users: 1,
      production_environments: 1,
      non_production_environments: 0,
      connectors: 0,
      governed_flows: 0,
      annual_executions: 0,
      retention_months: 0
    };
    COUNT_FIELDS.forEach((field) => {
      const value = scenario[field];
      if (
        !Number.isSafeInteger(value) ||
        value < minimums[field] ||
        value > catalog.calculation_limits[field]
      ) {
        fail(`${field} is outside the public calculator bounds`);
      }
    });
    [
      "private_networking",
      "customer_managed_storage",
      "custom_connector_certification"
    ].forEach((field) => {
      if (typeof scenario[field] !== "boolean") {
        fail(`${field} must be a boolean`);
      }
    });
    ["discovery_workshops", "delivery_sprints"].forEach((field) => {
      if (
        !Number.isSafeInteger(scenario[field]) ||
        scenario[field] < 0 ||
        scenario[field] > catalog.calculation_limits.professional_service_units
      ) {
        fail(`${field} is outside the public calculator bounds`);
      }
    });
    if (!isRecord(scenario.professional_service_days)) {
      fail("professional_service_days must be an object");
    }
    const unknownRoles = Object.keys(scenario.professional_service_days)
      .filter((role) => !SERVICE_FIELDS.includes(role));
    if (unknownRoles.length) {
      fail(`Unknown professional service roles: ${unknownRoles.sort().join(", ")}`);
    }
    scenario.professional_service_days = Object.fromEntries(
      SERVICE_FIELDS.map((role) => {
        const days = scenario.professional_service_days[role] || 0;
        if (
          !Number.isSafeInteger(days) ||
          days < 0 ||
          days > catalog.calculation_limits.professional_service_days
        ) {
          fail(`professional_service_days.${role} is outside the public calculator bounds`);
        }
        return [role, days];
      })
    );
    return scenario;
  }

  function retentionAddOn(catalog, plan, months) {
    if (months <= plan.capacity.retention_months) {
      return null;
    }
    return catalog.annual_add_ons.retention
      .find((option) => months <= option.up_to_months) || null;
  }

  function recommendedPlan(catalog, scenario, selectedPlanId) {
    const selectedIndex = PLAN_IDS.indexOf(selectedPlanId);
    const candidates = [];
    catalog.plans.forEach((plan, index) => {
      if (index < selectedIndex) {
        return;
      }
      const capacity = plan.capacity;
      if (
        scenario.intelligence_option_id === "platform_access" &&
        plan.capabilities.intelligence !== "platform_access"
      ) {
        return;
      }
      if (scenario.tenants > capacity.tenants) {
        return;
      }
      if (scenario.retention_months > 84) {
        return;
      }
      let estimate = plan.annual_software_eur;
      let customExecutionScope = false;
      PACK_DIMENSIONS.forEach((dimension) => {
        const extra = Math.max(0, scenario[dimension] - capacity[dimension]);
        if (
          dimension === "annual_executions" &&
          extra >= catalog.capacity_pack_boundaries.annual_executions_custom_at_units
        ) {
          customExecutionScope = true;
          return;
        }
        estimate += selectCapacityPacks(
          extra,
          catalog.capacity_packs[dimension]
        ).annual_eur;
      });
      if (customExecutionScope) {
        return;
      }
      const environment = catalog.annual_add_ons.additional_environment;
      estimate += Math.max(
        0,
        scenario.production_environments - capacity.production_environments
      ) * environment.production_annual_software_eur;
      estimate += Math.max(
        0,
        scenario.non_production_environments - capacity.non_production_environments
      ) * environment.non_production_annual_software_eur;
      const retention = retentionAddOn(catalog, plan, scenario.retention_months);
      if (scenario.retention_months > capacity.retention_months) {
        if (!retention) {
          return;
        }
        estimate += retention.annual_software_eur;
      }
      candidates.push({ estimate, index, plan_id: plan.plan_id });
    });
    candidates.sort((first, second) =>
      first.estimate - second.estimate || first.index - second.index
    );
    return candidates.length ? candidates[0].plan_id : null;
  }

  function calculate(catalogSource, scenarioSource = {}) {
    const catalog = requireCatalog(catalogSource);
    const scenario = normalizeScenario(catalog, scenarioSource);
    const plan = findById(catalog.plans, "plan_id", scenario.plan_id);
    const term = findById(catalog.term_discounts, "term_months", scenario.term_months);
    const support = findById(catalog.support_tiers, "support_id", scenario.support_id);
    const deployment = findById(
      catalog.deployment_options,
      "deployment_id",
      scenario.deployment_id
    );
    const intelligence = findById(
      catalog.annual_add_ons.intelligence,
      "option_id",
      scenario.intelligence_option_id
    );
    const anpy = findById(
      catalog.annual_add_ons.anpy,
      "option_id",
      scenario.anpy_option_id
    );

    const annualSoftwareItems = [{
      code: "plan_base",
      amount_eur: plan.annual_software_eur,
      price_kind: plan.price_kind
    }];
    const annualOtherItems = [];
    const oneTimeItems = [];
    const excludedCosts = [];
    const reviewReasons = [];
    let minimumEstimate = plan.price_kind === "from";
    if (minimumEstimate) {
      reviewReasons.push("regulated_scope_requires_review");
    }

    const capacityResults = {};
    PACK_DIMENSIONS.forEach((dimension) => {
      const extra = Math.max(0, scenario[dimension] - plan.capacity[dimension]);
      const customExecutionScope =
        dimension === "annual_executions" &&
        extra >= catalog.capacity_pack_boundaries.annual_executions_custom_at_units;
      const result = customExecutionScope
        ? {
            requested_extra: extra,
            covered_extra: 0,
            overprovisioned_units: 0,
            annual_eur: 0,
            packs: [],
            price_kind: "custom"
          }
        : {
            ...selectCapacityPacks(extra, catalog.capacity_packs[dimension]),
            price_kind: "exact"
          };
      if (customExecutionScope) {
        reviewReasons.push("execution_capacity_at_5m_requires_review");
      }
      capacityResults[dimension] = result;
      if (result.annual_eur) {
        annualSoftwareItems.push({
          code: `capacity_${dimension}`,
          amount_eur: result.annual_eur,
          price_kind: "exact"
        });
      }
    });
    if (scenario.tenants > plan.capacity.tenants) {
      reviewReasons.push("tenant_capacity_has_no_public_unit_price");
    }

    const environment = catalog.annual_add_ons.additional_environment;
    const extraProduction = Math.max(
      0,
      scenario.production_environments - plan.capacity.production_environments
    );
    const extraNonProduction = Math.max(
      0,
      scenario.non_production_environments - plan.capacity.non_production_environments
    );
    if (extraProduction) {
      annualSoftwareItems.push({
        code: "additional_production_environments",
        quantity: extraProduction,
        amount_eur: extraProduction * environment.production_annual_software_eur,
        price_kind: "exact"
      });
    }
    if (extraNonProduction) {
      annualSoftwareItems.push({
        code: "additional_non_production_environments",
        quantity: extraNonProduction,
        amount_eur: extraNonProduction * environment.non_production_annual_software_eur,
        price_kind: "exact"
      });
    }

    const retention = retentionAddOn(catalog, plan, scenario.retention_months);
    if (scenario.retention_months > plan.capacity.retention_months) {
      if (!retention) {
        reviewReasons.push("retention_above_84_months_requires_review");
      } else {
        annualSoftwareItems.push({
          code: retention.option_id,
          amount_eur: retention.annual_software_eur,
          price_kind: retention.price_kind
        });
      }
    }

    if (intelligence.annual_software_eur) {
      annualSoftwareItems.push({
        code: `intelligence_${intelligence.option_id}`,
        amount_eur: intelligence.annual_software_eur,
        price_kind: intelligence.price_kind
      });
    }
    if (
      intelligence.option_id === "platform_access" &&
      plan.capabilities.intelligence !== "platform_access"
    ) {
      reviewReasons.push("intelligence_platform_access_not_in_selected_plan");
    }
    if (intelligence.option_id === "software_addon") {
      excludedCosts.push("model_provider_consumption_separately_scoped");
    }

    if (anpy.price_kind === "custom") {
      reviewReasons.push("custom_anpy_capacity_requires_review");
    } else if (anpy.annual_software_eur) {
      annualSoftwareItems.push({
        code: `anpy_${anpy.option_id}`,
        amount_eur: anpy.annual_software_eur,
        price_kind: anpy.price_kind
      });
    }

    [
      [
        scenario.private_networking,
        "private_networking",
        "private_networking_scope_requires_review"
      ],
      [
        scenario.customer_managed_storage,
        "customer_managed_storage",
        "customer_managed_storage_scope_requires_review"
      ]
    ].forEach(([selected, optionKey, reason]) => {
      if (selected) {
        const option = catalog.annual_add_ons[optionKey];
        annualSoftwareItems.push({
          code: optionKey,
          amount_eur: option.annual_software_eur,
          price_kind: option.price_kind
        });
        minimumEstimate = true;
        reviewReasons.push(reason);
      }
    });

    let deploymentAmount;
    let deploymentKind;
    if (deployment.deployment_id === "managed") {
      deploymentAmount = plan.managed_deployment_eur;
      deploymentKind = plan.managed_deployment_kind;
    } else {
      deploymentAmount = deployment.annual_eur || 0;
      deploymentKind = deployment.price_kind;
    }
    if (deploymentAmount) {
      annualOtherItems.push({
        code: `deployment_${deployment.deployment_id}`,
        amount_eur: deploymentAmount,
        price_kind: deploymentKind
      });
    }
    if (deploymentKind === "from") {
      minimumEstimate = true;
      reviewReasons.push("dedicated_or_ha_scope_requires_review");
    }

    const discountBasisPoints = term.discount_basis_points;
    const basePrice = plan.annual_software_eur;
    const rawBaseDiscount = percentage(basePrice, discountBasisPoints);
    const baseDiscount = Math.min(
      rawBaseDiscount,
      Math.max(0, basePrice - catalog.minimum_annual_plan_base_eur)
    );
    const otherSoftware = annualSoftwareItems
      .filter((item) => item.code !== "plan_base")
      .reduce((total, item) => total + item.amount_eur, 0);
    const otherDiscount = percentage(otherSoftware, discountBasisPoints);
    const grossAnnualSoftware = basePrice + otherSoftware;
    const termDiscount = baseDiscount + otherDiscount;
    const netAnnualSoftware = grossAnnualSoftware - termDiscount;
    const supportAmount = percentage(
      netAnnualSoftware,
      support.annual_percentage_basis_points
    );
    if (supportAmount) {
      annualOtherItems.push({
        code: `support_${support.support_id}`,
        amount_eur: supportAmount,
        price_kind: "percentage_of_net_software"
      });
    }
    if (support.commercial_acceptance_required) {
      reviewReasons.push("enhanced_support_requires_contract_acceptance");
    }

    const multiplier = catalog.implementation.complexity_multipliers_basis_points[
      scenario.implementation_complexity
    ];
    const implementationAmount = percentage(plan.implementation_eur, multiplier);
    oneTimeItems.push({
      code: "implementation",
      amount_eur: implementationAmount,
      price_kind: plan.implementation_kind
    });
    if (plan.implementation_kind === "from") {
      minimumEstimate = true;
    }
    if (scenario.implementation_complexity !== "standard") {
      reviewReasons.push("implementation_scope_requires_review");
    }
    SERVICE_FIELDS.forEach((role) => {
      const days = scenario.professional_service_days[role];
      if (days) {
        oneTimeItems.push({
          code: `professional_services_${role}`,
          quantity: days,
          amount_eur: days * catalog.professional_services[`${role}_day_eur`],
          price_kind: "exact_day_rate"
        });
      }
    });
    if (scenario.custom_connector_certification) {
      const certification = catalog.implementation.custom_connector_certification_eur;
      oneTimeItems.push({
        code: "connector_certification",
        quantity: 1,
        amount_eur: certification.minimum,
        price_kind: "minimum_from_range"
      });
      minimumEstimate = true;
      reviewReasons.push("connector_certification_requires_review");
      excludedCosts.push("connector_certification_balance_requires_review");
    }
    [
      [
        "discovery_workshops",
        "discovery_workshop_eur",
        "discovery_workshop",
        "discovery_workshop_scope_requires_review"
      ],
      [
        "delivery_sprints",
        "delivery_sprint_eur",
        "delivery_sprint",
        "delivery_sprint_scope_requires_review"
      ]
    ].forEach(([field, catalogKey, code, reason]) => {
      const quantity = scenario[field];
      if (quantity) {
        const option = catalog.professional_services[catalogKey];
        oneTimeItems.push({
          code,
          quantity,
          amount_eur: quantity * option.minimum,
          price_kind: "minimum_from_range"
        });
        minimumEstimate = true;
        reviewReasons.push(reason);
      }
    });

    const uniqueReviewReasons = [...new Set(reviewReasons)];
    const uniqueExcludedCosts = [...new Set(excludedCosts)];
    const annualOther = annualOtherItems
      .reduce((total, item) => total + item.amount_eur, 0);
    const annualRecurring = netAnnualSoftware + annualOther;
    const oneTime = oneTimeItems
      .reduce((total, item) => total + item.amount_eur, 0);

    return {
      schema_version: ESTIMATE_VERSION,
      catalog_schema_version: catalog.schema_version,
      catalog_sha256: catalog.contract_sha256 || null,
      currency: catalog.currency,
      estimate_valid_days: catalog.estimate_valid_days,
      scenario,
      selected_plan_id: plan.plan_id,
      recommended_plan_id: recommendedPlan(catalog, scenario, plan.plan_id),
      capacity_packs: capacityResults,
      annual_software_items: annualSoftwareItems,
      annual_other_items: annualOtherItems,
      one_time_items: oneTimeItems,
      gross_annual_software_eur: grossAnnualSoftware,
      annual_software_eur: grossAnnualSoftware,
      term_discount_basis_points: discountBasisPoints,
      term_discount_eur: termDiscount,
      discount_eur: termDiscount,
      net_annual_software_eur: netAnnualSoftware,
      deployment_eur: deploymentAmount,
      support_eur: supportAmount,
      annual_recurring_eur: annualRecurring,
      implementation_eur: implementationAmount,
      one_time_eur: oneTime,
      first_year_total_eur: annualRecurring + oneTime,
      renewal_year_total_eur: annualRecurring,
      minimum_estimate: minimumEstimate,
      requires_review: uniqueReviewReasons.length > 0,
      review_reasons: uniqueReviewReasons,
      excluded_costs: uniqueExcludedCosts
    };
  }

  function encodeBase64Url(value) {
    if (typeof global.btoa !== "function") {
      fail("This browser cannot create a pricing share link");
    }
    return global.btoa(value)
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/u, "");
  }

  function decodeBase64Url(value) {
    if (typeof global.atob !== "function" || !/^[A-Za-z0-9_-]+$/u.test(value)) {
      fail("Pricing share state is not valid base64url");
    }
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    return global.atob(value.replaceAll("-", "+").replaceAll("_", "/") + padding);
  }

  function encodeShareState(catalog, source = {}) {
    const scenario = normalizeScenario(catalog, source);
    const state = {};
    SHARE_FIELDS.forEach((field) => {
      state[field] = scenario[field];
    });
    const fragment = `${SHARE_PREFIX}${encodeBase64Url(JSON.stringify(state))}`;
    if (fragment.length > SHARE_MAX_CHARACTERS) {
      fail("Pricing share state exceeds the bounded URL size");
    }
    return fragment;
  }

  function decodeShareState(catalog, fragment) {
    if (typeof fragment !== "string" || !fragment.startsWith(SHARE_PREFIX)) {
      return null;
    }
    if (fragment.length > SHARE_MAX_CHARACTERS) {
      return null;
    }
    try {
      const parsed = JSON.parse(decodeBase64Url(fragment.slice(SHARE_PREFIX.length)));
      if (!isRecord(parsed)) {
        return null;
      }
      if (Object.keys(parsed).some((field) => !SHARE_FIELDS.includes(field))) {
        return null;
      }
      return normalizeScenario(catalog, parsed);
    } catch (_error) {
      return null;
    }
  }

  function formatCurrency(amountEur, locale) {
    if (!Number.isSafeInteger(amountEur) || amountEur < 0) {
      fail("Currency amount must be a non-negative whole-euro integer");
    }
    const documentLocale = global.document?.documentElement?.lang;
    return new Intl.NumberFormat(locale || documentLocale || "en", {
      style: "currency",
      currency: "EUR",
      currencyDisplay: "symbol",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(amountEur);
  }

  global.AdvanexusPricing = Object.freeze({
    calculate,
    decodeShareState,
    encodeShareState,
    formatCurrency,
    normalizeScenario,
    selectCapacityPacks
  });
})(window);
