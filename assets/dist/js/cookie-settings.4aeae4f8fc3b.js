"use strict";

(() => {
  const roots = document.querySelectorAll("[data-cookie-settings]");

  roots.forEach((root) => {
    const output = root.querySelector("[data-gpc-status]");
    if (!output) {
      return;
    }

    const exposesSignal = typeof navigator !== "undefined"
      && "globalPrivacyControl" in navigator;
    const signalEnabled = exposesSignal && navigator.globalPrivacyControl === true;
    const state = signalEnabled
      ? "detected"
      : (exposesSignal ? "not-detected" : "unavailable");
    const textKey = signalEnabled
      ? "gpcDetectedText"
      : (exposesSignal ? "gpcNotDetectedText" : "gpcUnavailableText");

    root.dataset.gpcDetected = String(signalEnabled);
    output.dataset.gpcState = state;
    if (root.dataset[textKey]) {
      output.textContent = root.dataset[textKey];
    }
  });
})();
