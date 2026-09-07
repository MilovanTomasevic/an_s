"use strict";

(function pricingPage(global) {
  const ROOT_SELECTOR = "[data-pricing-root]";
  const INTEGER_FIELDS = new Set([
    "term_months",
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

  function replaceMoney(node, amount, locale, { negative = false } = {}) {
    if (!node) {
      return;
    }
    const value = document.createElement("bdi");
    value.dir = "ltr";
    value.textContent = `${negative && amount ? "−" : ""}${global.AdvanexusPricing.formatCurrency(amount, locale)}`;
    node.replaceChildren(value);
  }

  function configurationControls(configuration) {
    return Array.from(configuration.querySelectorAll("[data-pricing-input]"));
  }

  function controlNamed(configuration, name) {
    return configurationControls(configuration).find(
      (element) => element.name === name
    ) || null;
  }

  function readScenario(configuration) {
    const scenario = {};
    for (const element of configurationControls(configuration)) {
      if (!element.name || element.disabled) {
        continue;
      }
      if (INTEGER_FIELDS.has(element.name)) {
        scenario[element.name] = element.value.trim() === ""
          ? Number.NaN : Number(element.value);
      } else if (element.type !== "button" && element.type !== "submit") {
        scenario[element.name] = element.value;
      }
    }
    return scenario;
  }

  function applyScenario(configuration, scenario) {
    Object.entries(scenario).forEach(([name, value]) => {
      const element = controlNamed(configuration, name);
      if (!element) {
        return;
      }
      if (
        typeof value === "string" ||
        typeof value === "number"
      ) {
        // Valid shared retention profiles can be more precise than the presets.
        // Native select elements reject values without a matching option.
        if (name === "retention_months" && element.type === "select-one" &&
            !Array.from(element.options).some((option) => option.value === String(value))) {
          const option = document.createElement("option");
          option.value = String(value);
          option.textContent = new Intl.NumberFormat(document.documentElement.lang || "en", {
            style: "unit",
            unit: "month",
            unitDisplay: "long",
            maximumFractionDigits: 0
          }).format(value);
          element.append(option);
        }
        element.value = String(value);
      }
    });
  }

  function planName(catalog, planSelect, identifier) {
    const localizedOption = Array.from(planSelect?.options || []).find(
      (option) => option.value === identifier,
    );
    if (localizedOption?.textContent) {
      return localizedOption.textContent.trim();
    }
    throw new Error("pricing_locale_contract");
  }

  function emailHref(estimate, planSelect, locale, currentUrl, labels) {
    const lines = [
      labels.subject,
      "",
      `${labels.plan}: ${planName(estimate.catalog, planSelect, estimate.selected_plan_id)}`,
      `${labels.recurring}: ${global.AdvanexusPricing.formatCurrency(estimate.annual_software_subscription_eur, locale)}`,
      labels.tax,
      `${labels.link}: ${currentUrl}`,
      "",
      labels.disclaimer
    ];
    return `mailto:info@advanexus.com?subject=${encodeURIComponent(labels.subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  }

  function initRoot(root) {
    if (!global.AdvanexusPricing) {
      return;
    }
    let catalog;
    try {
      catalog = JSON.parse(root.dataset.pricingContract || "");
    } catch (_error) {
      return;
    }
    const configuration = root.querySelector("[data-pricing-form]");
    const summary = root.querySelector("[data-pricing-summary]");
    if (!configuration || !summary) {
      return;
    }
    const locale = document.documentElement.lang || "en";
    const status = root.querySelector("[data-pricing-status]");
    const review = root.querySelector("[data-pricing-review]");
    const reviewList = root.querySelector("[data-pricing-review-list]");
    const recommendation = root.querySelector("[data-pricing-recommendation]");
    const copyButton = root.querySelector("[data-pricing-copy]");
    const printButton = root.querySelector("[data-pricing-print]");
    const emailLink = root.querySelector("[data-pricing-email]");
    const advanced = root.querySelector("[data-pricing-advanced]");
    const advancedLabel = root.querySelector("[data-pricing-advanced-label]");
    const resetButton = root.querySelector("[data-pricing-reset]");
    const restoredSoftware = root.querySelector("[data-pricing-restored-software]");
    const initialScenario = readScenario(configuration);
    let legacyServiceScopeExcluded = false;
    let restoredSoftwareScope = {};
    let rejectedSharedState = false;
    let latestShareUrl = `${global.location.origin}${global.location.pathname}`;

    function setStatus(message) {
      if (status) {
        status.textContent = message;
      }
    }

    function render() {
      try {
        const scenario = {
          ...restoredSoftwareScope,
          ...readScenario(configuration),
          ...(legacyServiceScopeExcluded ? { legacy_service_scope_excluded: true } : {})
        };
        const estimate = global.AdvanexusPricing.calculate(catalog, scenario);
        estimate.catalog = catalog;
        const shareFragment = global.AdvanexusPricing.encodeShareState(catalog, estimate.scenario);
        latestShareUrl = `${global.location.origin}${global.location.pathname}${shareFragment}`;

        replaceMoney(summary.querySelector('[data-pricing-value="annual_software_eur"]'), estimate.annual_software_eur, locale);
        replaceMoney(summary.querySelector('[data-pricing-value="discount_eur"]'), estimate.discount_eur, locale, { negative: true });
        replaceMoney(summary.querySelector('[data-pricing-value="annual_software_subscription_eur"]'), estimate.annual_software_subscription_eur, locale);

        if (restoredSoftware) {
          const anpyId = estimate.scenario.anpy_option_id;
          restoredSoftware.hidden = !anpyId || anpyId === "shared";
          restoredSoftware.textContent = "";
          if (!restoredSoftware.hidden) {
            const anpy = catalog.annual_add_ons.anpy.find((option) => option.option_id === anpyId);
            const detail = anpy.price_kind === "custom"
              ? root.dataset.labelReview
              : global.AdvanexusPricing.formatCurrency(anpy.annual_software_eur, locale);
            // This is a detail of the gross software line, never an extra fee
            // added after the discounted annual subscription total.
            restoredSoftware.textContent = `${restoredSoftware.dataset.labelSoftware}: ANpy (${detail})`;
          }
        }

        const recommendedPlan = estimate.recommended_plan_id || estimate.selected_plan_id;
        if (recommendation) {
          recommendation.textContent = `${root.dataset.labelRecommendation}: ${planName(catalog, controlNamed(configuration, "plan_id"), recommendedPlan)}`;
        }
        const needsUpgrade = Boolean(
          estimate.recommended_plan_id &&
          estimate.recommended_plan_id !== estimate.selected_plan_id
        );
        const requiresReview = estimate.requires_review || needsUpgrade;
        if (review && reviewList) {
          review.hidden = !requiresReview;
          reviewList.replaceChildren();
          if (needsUpgrade) {
            const item = document.createElement("li");
            item.textContent = root.dataset.labelUpgrade;
            reviewList.append(item);
          }
          if (estimate.requires_review) {
            const item = document.createElement("li");
            item.textContent = root.dataset.labelReview;
            reviewList.append(item);
          }
          if (legacyServiceScopeExcluded) {
            const item = document.createElement("li");
            item.textContent = root.dataset.labelLegacy;
            reviewList.append(item);
          }
        }
        if (emailLink) {
          emailLink.href = emailHref(
            estimate,
            controlNamed(configuration, "plan_id"),
            locale,
            latestShareUrl,
            {
              subject: root.dataset.emailSubject,
              plan: root.dataset.labelPlan,
              recurring: root.dataset.labelRecurring,
              tax: root.dataset.labelTax,
              link: root.dataset.labelLink,
              disclaimer: root.dataset.emailDisclaimer
            }
          );
        }
        setStatus(rejectedSharedState ? root.dataset.labelInvalid : "");
      } catch (_error) {
        setStatus(root.dataset.labelInvalid || "");
      }
    }

    const shared = global.AdvanexusPricing.decodeShareState(catalog, global.location.hash);
    if (shared) {
      legacyServiceScopeExcluded = shared.legacy_service_scope_excluded === true;
      // Keep valid software fields that are not currently exposed as controls.
      // Otherwise a shared ANpy extension would silently revert to the default.
      restoredSoftwareScope = Object.fromEntries(Object.entries(shared).filter(([name]) =>
        name !== "legacy_service_scope_excluded" && !controlNamed(configuration, name)
      ));
      applyScenario(configuration, shared);
    } else if (global.location.hash.startsWith("#pricing=")) {
      rejectedSharedState = true;
    }

    function configurationChanged() {
      rejectedSharedState = false;
      render();
    }
    configuration.addEventListener("input", configurationChanged);
    configuration.addEventListener("change", configurationChanged);
    resetButton?.addEventListener("click", () => {
      legacyServiceScopeExcluded = false;
      restoredSoftwareScope = {};
      rejectedSharedState = false;
      applyScenario(configuration, initialScenario);
      render();
    });
    advanced?.addEventListener("toggle", () => {
      if (advancedLabel) {
        advancedLabel.textContent = advanced.open
          ? root.dataset.labelHide
          : root.dataset.labelShow;
      }
    });
    copyButton?.addEventListener("click", async () => {
      try {
        await global.navigator.clipboard.writeText(latestShareUrl);
        setStatus(root.dataset.labelCopied || "");
      } catch (_error) {
        setStatus(latestShareUrl);
      }
    });
    printButton?.addEventListener("click", () => global.print());
    render();
  }

  function init() {
    document.querySelectorAll(ROOT_SELECTOR).forEach(initRoot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(window);
