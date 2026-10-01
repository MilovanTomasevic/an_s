(function () {
  "use strict";

  function mount() {
    var element = document.getElementById("advanexus-cube");
    if (!element || !window.AdvanexusCube) return;
    var labels;
    var scenario;
    try {
      labels = JSON.parse(element.dataset.cubeLabels || "[]");
      scenario = JSON.parse(element.dataset.cubeScenario || "{}");
    } catch (_error) {
      labels = [];
    }
    if (!Array.isArray(labels) || labels.length !== 4) return;
    if (!scenario || scenario.total !== scenario.passed + scenario.review ||
        scenario.review !== scenario.missing + scenario.mismatch ||
        scenario.total <= 0 || scenario.review <= 0) return;
    var question = element.dataset.cubeQuestion || "";
    var answer = element.dataset.cubeAnswer || "";
    if (!question || !answer ||
        ![scenario.total, scenario.passed, scenario.review].every(function (value) {
          return answer.includes(String(value));
        })) return;

    var labelColor = window.getComputedStyle(element).color;
    var cube = window.AdvanexusCube.mount(element, {
      accent: "#0ab39c",
      background: "#343541",
      labelColor: labelColor,
      baseOpacity: element.dataset.cubeBaseOpacity === undefined ? 1 : Number(element.dataset.cubeBaseOpacity),
      ground: false,
      logoUrl: element.dataset.cubeSymbol || "",
      labels: labels,
      scenario: scenario,
      question: question,
      answer: answer,
      accessibleLabel: element.dataset.cubeDescription || "",
      pauseLabel: element.dataset.cubePause || "",
      resumeLabel: element.dataset.cubeResume || "",
      pausedLabel: element.dataset.cubeResume || "",
      autoPlay: true,
      autoRotate: true,
      pixelRatio: 1.75,
      glow: 0.22,
    });
    if (!cube || cube.error) return;
    if (typeof cube.setLabelColor === "function" && typeof MutationObserver === "function") {
      var observer = new MutationObserver(function () {
        cube.setLabelColor(window.getComputedStyle(element).color);
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
}());
