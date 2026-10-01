/* Illustrate supported outcomes; this component never runs a business job. */
(() => {
  "use strict";
  document.querySelectorAll("[data-value-demo]").forEach(demo => {
    const controls = [...demo.querySelectorAll("[data-value-select]")];
    const results = [...demo.querySelectorAll("[data-value-result]")];
    controls.forEach(button => button.addEventListener("click", () => {
      const mode = button.dataset.valueSelect;
      if (!results.some(result => result.dataset.valueResult === mode)) return;
      demo.dataset.valueMode = mode;
      controls.forEach(control => control.setAttribute("aria-pressed", String(control === button)));
      results.forEach(result => { result.hidden = result.dataset.valueResult !== mode; });
    }));
  });
})();
