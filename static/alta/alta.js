/* Arithmetic over visitor-entered assumptions, never a forecast. */
(() => {
  "use strict";

  function calculateScenario({ before, after, cycles, rate }) {
    if (![before, after, cycles, rate].every(Number.isFinite) || before <= 0 || after < 0 || cycles < 0 || rate < 0) return null;
    const hoursPerCycle = before - after;
    const hoursPerMonth = hoursPerCycle * cycles;
    const capacityValue = hoursPerMonth * rate;
    const reduction = hoursPerCycle / before * 100;
    if (![hoursPerCycle, hoursPerMonth, capacityValue, reduction].every(Number.isFinite)) return null;
    return { hoursPerCycle, hoursPerMonth, capacityValue, reduction };
  }

  function calculateReport(inputs) {
    if (!inputs || typeof inputs !== "object") return null;
    const scenario = calculateScenario(inputs);
    if (!scenario) return null;
    const { before, after, cycles, rate } = inputs;
    const baselineHoursPerMonth = before * cycles;
    const afterHoursPerMonth = after * cycles;
    const baselineCostPerMonth = baselineHoursPerMonth * rate;
    const afterCostPerMonth = afterHoursPerMonth * rate;
    const hoursPerYear = scenario.hoursPerMonth * 12;
    const capacityValuePerYear = scenario.capacityValue * 12;
    if (![baselineHoursPerMonth, afterHoursPerMonth, baselineCostPerMonth,
      afterCostPerMonth, hoursPerYear, capacityValuePerYear].every(Number.isFinite)) return null;
    const report = {
      inputs: { before, after, cycles, rate }, ...scenario, months: 12,
      baselineHoursPerMonth, afterHoursPerMonth, baselineCostPerMonth,
      afterCostPerMonth, hoursPerYear, capacityValuePerYear
    };
    Object.keys(report).forEach(key => {
      if (Object.is(report[key], -0)) report[key] = 0;
    });
    return report;
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { calculateScenario, calculateReport };
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const slides = [...document.querySelectorAll("[data-slide]")];
  const copy = JSON.parse(document.getElementById("deck-copy").textContent);
  const ui = copy.ui;
  const params = new URLSearchParams(location.search);
  const previousButton = document.querySelector("[data-previous]");
  const nextButton = document.querySelector("[data-next]");
  const themeButton = document.querySelector("[data-theme-toggle]");
  const readingButton = document.querySelector("[data-reading]");
  const languageLink = document.querySelector("[data-language-link]");
  const dialog = document.getElementById("source-dialog");
  const reportDialog = document.getElementById("report-dialog");
  const locale = document.body.dataset.locale === "rs" ? "sr-Latn-RS" : "en-GB";
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const currency = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const reportNumber = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const reportCurrency = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
  let index = 0;
  let reading = false;
  let sourceTrigger = null;
  let reportTrigger = null;
  let reportSnapshot = null;
  let reportText = "";

  function modalOpen() {
    return [...document.querySelectorAll("dialog")].some(modal => modal.open);
  }

  function updateLanguageLink() {
    const target = new URL(languageLink.href);
    target.searchParams.set("theme", root.dataset.theme);
    if (reading) target.searchParams.set("view", "all");
    else target.searchParams.delete("view");
    target.hash = `/${index + 1}`;
    languageLink.href = target.href;
  }

  function show(next, moveFocus = false) {
    index = Math.max(0, Math.min(slides.length - 1, Number.isFinite(next) ? next : 0));
    slides.forEach((slide, i) => { slide.hidden = !reading && i !== index; });
    document.querySelector("[data-counter]").textContent = `${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    previousButton.disabled = index === 0;
    nextButton.disabled = index === slides.length - 1;
    document.querySelectorAll("[data-go]").forEach(button => button.setAttribute("aria-current", Number(button.dataset.go) === index ? "step" : "false"));
    history.replaceState(null, "", `${location.pathname}${location.search}#/${index + 1}`);
    updateLanguageLink();
    if (reading) slides[index].scrollIntoView({ block: "start" });
    else window.scrollTo({ top: 0, behavior: "instant" });
    if (moveFocus) {
      const title = slides[index].querySelector("h1,h2");
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
    }
  }

  function setTheme(value) {
    root.dataset.theme = value === "dark" ? "dark" : "light";
    themeButton.setAttribute("aria-pressed", String(root.dataset.theme === "dark"));
    const url = new URL(location.href);
    url.searchParams.set("theme", root.dataset.theme);
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    updateLanguageLink();
  }

  function setReading(value) {
    reading = value;
    root.classList.toggle("reading", reading);
    readingButton.setAttribute("aria-pressed", String(reading));
    readingButton.textContent = reading ? ui.presenting : ui.reading;
    const url = new URL(location.href);
    if (reading) url.searchParams.set("view", "all");
    else url.searchParams.delete("view");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    show(index);
  }

  const sourceList = document.querySelector(".source-fallback");
  const sourceClone = sourceList.cloneNode(true);
  sourceClone.id = "dialog-sources";
  sourceClone.querySelectorAll("[id]").forEach(node => { node.id = `dialog-${node.id}`; });
  sourceClone.querySelector("h2").remove();
  document.querySelector("[data-source-content]").append(sourceClone);
  function openSources(trigger, ref) {
    sourceTrigger = trigger;
    dialog.showModal();
    if (ref) {
      const entry = document.getElementById(`dialog-source-${ref}`);
      entry?.scrollIntoView({ block: "center" });
      entry?.querySelector("a")?.focus({ preventScroll: true });
    }
  }
  document.querySelector("[data-open-sources]").addEventListener("click", event => openSources(event.currentTarget));
  document.querySelectorAll("[data-source-ref]").forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    openSources(link, link.dataset.sourceRef);
  }));
  document.querySelector("[data-close-dialog]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => sourceTrigger?.focus());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });

  previousButton.addEventListener("click", () => show(index - 1, true));
  nextButton.addEventListener("click", () => show(index + 1, true));
  document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => show(Number(button.dataset.go), true)));
  themeButton.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
  readingButton.addEventListener("click", () => setReading(!reading));
  document.querySelector("[data-fullscreen]").addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (root.requestFullscreen) await root.requestFullscreen();
    } catch { /* Fullscreen remains optional. */ }
  });

  document.addEventListener("keydown", event => {
    if (modalOpen() || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest("input,textarea,select,button,a,summary,[contenteditable],.home-cube")) return;
    const destinations = { ArrowRight: index + 1, PageDown: index + 1, ArrowLeft: index - 1, PageUp: index - 1, Home: 0, End: slides.length - 1 };
    if (Object.hasOwn(destinations, event.key)) {
      event.preventDefault();
      show(destinations[event.key], true);
    }
  });
  let touch = null;
  document.getElementById("deck").addEventListener("touchstart", event => {
    if (modalOpen() || event.touches.length !== 1 || event.target.closest("input,button,a,summary,details,.home-cube")) { touch = null; return; }
    const point = event.touches[0];
    touch = { x: point.clientX, y: point.clientY, time: Date.now() };
  }, { passive: true });
  document.getElementById("deck").addEventListener("touchend", event => {
    if (!touch || reading || modalOpen() || !event.changedTouches.length) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - touch.x;
    const dy = point.clientY - touch.y;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.8 && Date.now() - touch.time < 900) show(index + (dx < 0 ? 1 : -1), true);
    touch = null;
  }, { passive: true });
  window.addEventListener("hashchange", () => show(Number(location.hash.match(/^#\/(\d+)$/)?.[1] || 1) - 1));

  const fields = [...document.querySelectorAll("[data-roi-input]")];
  function scenarioInputs() {
    const inputs = {};
    fields.forEach(input => { inputs[input.dataset.roiInput] = input.valueAsNumber; });
    return inputs;
  }

  function updateScenario() {
    const inputs = scenarioInputs();
    const result = fields.every(input => input.validity.valid) ? calculateScenario(inputs) : null;
    document.querySelector("[data-roi-error]").textContent = ui.scenario_error;
    document.querySelector("[data-roi-error]").hidden = result !== null;
    if (!result) {
      ["[data-reduction]", "[data-hours]", "[data-value]"].forEach(selector => { document.querySelector(selector).textContent = "—"; });
      document.querySelector("[data-bar-before]").style.width = "0%";
      document.querySelector("[data-bar-after]").style.width = "0%";
      return;
    }
    document.querySelector("[data-reduction]").textContent = `${number.format(Math.abs(result.reduction))}%`;
    document.querySelector("[data-reduction-label]").textContent = result.reduction < 0 ? ui.growth : ui.reduction;
    document.querySelector("[data-hours]").textContent = number.format(result.hoursPerMonth);
    document.querySelector("[data-value]").textContent = currency.format(result.capacityValue);
    const maxHours = Math.max(inputs.before, inputs.after);
    document.querySelector("[data-bar-before]").style.width = `${inputs.before / maxHours * 100}%`;
    document.querySelector("[data-bar-after]").style.width = `${inputs.after / maxHours * 100}%`;
    document.querySelector("[data-hours-before]").textContent = `${number.format(inputs.before)} ${ui.hours_unit}`;
    document.querySelector("[data-hours-after]").textContent = `${number.format(inputs.after)} ${ui.hours_unit}`;
  }
  fields.forEach(input => input.addEventListener("input", () => {
    fields.forEach(field => field.setCustomValidity(""));
    updateScenario();
  }));

  function reportNode(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function buildReport(snapshot) {
    const labels = copy.report;
    const content = document.querySelector("[data-report-content]");
    const lines = [labels.title, labels.intro, ""];
    content.replaceChildren();
    document.getElementById("report-title").textContent = labels.title;
    content.append(reportNode("p", labels.intro, "report-intro"));

    const summaryPattern = snapshot.hoursPerMonth > 0 ? labels.summary_positive
      : snapshot.hoursPerMonth < 0 ? labels.summary_negative : labels.summary_zero;
    if (typeof summaryPattern === "string") {
      const values = {
        before: `${reportNumber.format(snapshot.inputs.before)} ${ui.hours_unit}`,
        after: `${reportNumber.format(snapshot.inputs.after)} ${ui.hours_unit}`,
        cycles: reportNumber.format(snapshot.inputs.cycles),
        hours: `${reportNumber.format(Math.abs(snapshot.hoursPerMonth))} ${ui.hours_unit}`,
        percent: `${reportNumber.format(Math.abs(snapshot.reduction))}%`,
        value: reportCurrency.format(Math.abs(snapshot.capacityValue))
      };
      const summary = summaryPattern.replace(/\{(before|after|cycles|hours|percent|value)\}/g,
        (_, key) => values[key]);
      content.append(reportNode("p", summary, "report-summary"));
      lines.push(summary, "");
    }

    const effect = snapshot.hoursPerMonth > 0 ? labels.effect_positive
      : snapshot.hoursPerMonth < 0 ? labels.effect_negative : labels.effect_zero;
    content.append(reportNode("p", effect, "report-effect"));
    lines.push(effect, "");

    function tableSection(parent, title, headers, rows) {
      const section = reportNode("section", undefined, "report-section");
      const table = reportNode("table", undefined, "report-table");
      table.append(reportNode("caption", title));
      const head = reportNode("thead");
      const headerRow = reportNode("tr");
      headers.forEach(label => {
        const cell = reportNode("th", label);
        cell.scope = "col";
        headerRow.append(cell);
      });
      head.append(headerRow);
      table.append(head);
      const body = reportNode("tbody");
      rows.forEach(values => {
        const row = reportNode("tr");
        values.forEach((value, position) => {
          const cell = reportNode(position === 0 ? "th" : "td", value);
          if (position === 0) cell.scope = "row";
          row.append(cell);
        });
        body.append(row);
      });
      table.append(body);
      section.append(table);
      parent.append(section);
      lines.push(title, headers.join("\t"), ...rows.map(row => row.join("\t")), "");
    }

    const hours = value => `${reportNumber.format(value)} ${ui.hours_unit}`;
    const money = value => reportCurrency.format(value);
    const rate = `${money(snapshot.inputs.rate)} / ${ui.hours_unit}`;
    const overview = reportNode("div", undefined, "report-overview");
    content.append(overview);
    tableSection(overview, labels.inputs_title, labels.metric_columns, [
      [labels.input_labels.before, hours(snapshot.inputs.before)],
      [labels.input_labels.after, hours(snapshot.inputs.after)],
      [labels.input_labels.cycles, `${reportNumber.format(snapshot.inputs.cycles)} ${labels.cycles_unit}`],
      [labels.input_labels.rate, rate]
    ]);
    tableSection(overview, labels.monthly_title, labels.monthly_columns, [
      [labels.monthly_labels.hours, hours(snapshot.baselineHoursPerMonth), hours(snapshot.afterHoursPerMonth)],
      [labels.monthly_labels.cost, money(snapshot.baselineCostPerMonth), money(snapshot.afterCostPerMonth)]
    ]);
    tableSection(content, labels.capacity_title, labels.metric_columns, [
      [labels.capacity_labels.cycle_hours, hours(snapshot.hoursPerCycle)],
      [labels.capacity_labels.month_hours, hours(snapshot.hoursPerMonth)],
      [labels.capacity_labels.year_hours, hours(snapshot.hoursPerYear)],
      [labels.capacity_labels.reduction, `${reportNumber.format(snapshot.reduction)}%`],
      [labels.capacity_labels.month_value, money(snapshot.capacityValue)],
      [labels.capacity_labels.year_value, money(snapshot.capacityValuePerYear)]
    ]);

    const formulas = reportNode("section", undefined, "report-section report-method");
    formulas.append(reportNode("h3", labels.formulas_title));
    const formulaList = reportNode("dl", undefined, "report-formulas");
    formulas.append(formulaList);
    content.append(formulas);
    lines.push(labels.formulas_title);
    const expressions = {
      baseline_hours: `${hours(snapshot.inputs.before)} × ${reportNumber.format(snapshot.inputs.cycles)} = ${hours(snapshot.baselineHoursPerMonth)}`,
      after_hours: `${hours(snapshot.inputs.after)} × ${reportNumber.format(snapshot.inputs.cycles)} = ${hours(snapshot.afterHoursPerMonth)}`,
      baseline_cost: `${hours(snapshot.baselineHoursPerMonth)} × ${rate} = ${money(snapshot.baselineCostPerMonth)}`,
      after_cost: `${hours(snapshot.afterHoursPerMonth)} × ${rate} = ${money(snapshot.afterCostPerMonth)}`,
      cycle_hours: `${hours(snapshot.inputs.before)} − ${hours(snapshot.inputs.after)} = ${hours(snapshot.hoursPerCycle)}`,
      month_hours: `${hours(snapshot.hoursPerCycle)} × ${reportNumber.format(snapshot.inputs.cycles)} = ${hours(snapshot.hoursPerMonth)}`,
      reduction: `(${reportNumber.format(snapshot.inputs.before)} − ${reportNumber.format(snapshot.inputs.after)}) / ${reportNumber.format(snapshot.inputs.before)} × 100 = ${reportNumber.format(snapshot.reduction)}%`,
      month_value: `${hours(snapshot.hoursPerMonth)} × ${rate} = ${money(snapshot.capacityValue)}`,
      year_hours: `${hours(snapshot.hoursPerMonth)} × ${reportNumber.format(snapshot.months)} = ${hours(snapshot.hoursPerYear)}`,
      year_value: `${money(snapshot.capacityValue)} × ${reportNumber.format(snapshot.months)} = ${money(snapshot.capacityValuePerYear)}`
    };
    Object.entries(expressions).forEach(([key, expression]) => {
      const item = reportNode("div");
      item.append(reportNode("dt", labels.formula_labels[key]), reportNode("dd", expression));
      formulaList.append(item);
      lines.push(`${labels.formula_labels[key]}: ${expression}`);
    });
    if (labels.rounding_note) {
      formulas.append(reportNode("p", labels.rounding_note, "report-rounding"));
      lines.push(labels.rounding_note);
    }
    lines.push("");

    const assumptions = reportNode("section", undefined, "report-section report-assumptions");
    assumptions.append(reportNode("h3", labels.assumptions_title));
    const list = reportNode("ul");
    labels.assumptions.forEach(assumption => list.append(reportNode("li", assumption)));
    assumptions.append(list);
    content.append(assumptions);
    lines.push(labels.assumptions_title, ...labels.assumptions.map(assumption => `• ${assumption}`));
    reportText = lines.join("\n") + "\n";
  }

  if (reportDialog && copy.report) {
    const calculateButton = document.querySelector("[data-calculate]");
    calculateButton?.addEventListener("click", event => {
      fields.forEach(field => field.setCustomValidity(""));
      const invalid = fields.find(field => !field.validity.valid || !Number.isFinite(field.valueAsNumber)
        || (field.dataset.roiInput === "before" ? field.valueAsNumber <= 0 : field.valueAsNumber < 0));
      const snapshot = invalid ? null : calculateReport(scenarioInputs());
      if (!snapshot) {
        const field = invalid || fields[0];
        const error = invalid ? ui.scenario_error : copy.report.overflow_error;
        const errorMessage = document.querySelector("[data-roi-error]");
        errorMessage.textContent = error;
        errorMessage.hidden = false;
        field.setCustomValidity(error);
        field.focus();
        field.reportValidity();
        return;
      }
      reportTrigger = event.currentTarget;
      reportSnapshot = snapshot;
      buildReport(snapshot);
      reportDialog.showModal();
      reportDialog.scrollTop = 0;
      document.querySelector("[data-close-report]").focus({ preventScroll: true });
    });
    document.querySelector("[data-close-report]").addEventListener("click", () => reportDialog.close());
    reportDialog.addEventListener("close", () => {
      document.body.classList.remove("printing-report");
      reportTrigger?.focus({ preventScroll: true });
    });
    reportDialog.addEventListener("click", event => {
      if (event.target !== reportDialog) return;
      const bounds = reportDialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom) reportDialog.close();
    });
    document.querySelector("[data-print-report]").addEventListener("click", () => {
      if (!reportSnapshot || !reportDialog.open) return;
      document.body.classList.add("printing-report");
      try { window.print(); }
      catch { document.body.classList.remove("printing-report"); }
    });
    window.addEventListener("beforeprint", () => {
      if (reportDialog.open && reportSnapshot) document.body.classList.add("printing-report");
    });
    window.addEventListener("afterprint", () => document.body.classList.remove("printing-report"));
    document.querySelector("[data-download-report]").addEventListener("click", () => {
      if (!reportSnapshot || !reportText) return;
      const url = URL.createObjectURL(new Blob([reportText], { type: "text/plain;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = copy.report.download_filename;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  root.classList.add("enhanced");
  index = Math.max(0, Math.min(slides.length - 1, Number(location.hash.match(/^#\/(\d+)$/)?.[1] || 1) - 1));
  setTheme(params.get("theme"));
  setReading(params.get("view") === "all");
  updateScenario();
})();
