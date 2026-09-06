(function () {
  "use strict";

  var root = document.querySelector("[data-showcase]");
  if (!root) {
    return;
  }

  var documentLocale = document.documentElement && document.documentElement.lang
    ? document.documentElement.lang
    : "en";
  var numberLocale = documentLocale.toLowerCase().indexOf("ar") === 0
    ? documentLocale + "-u-nu-arab"
    : documentLocale;
  var sequenceFormatter = new Intl.NumberFormat(numberLocale, {
    maximumFractionDigits: 0,
    useGrouping: false
  });
  var scenes = Array.prototype.slice.call(root.querySelectorAll("[data-showcase-scene]"));
  var status = root.querySelector("[data-showcase-status]");
  var progress = root.querySelector("[data-showcase-progress]");
  var previous = root.querySelector("[data-showcase-previous]");
  var next = root.querySelector("[data-showcase-next]");
  var overviewButton = root.querySelector("[data-showcase-overview]");
  var overviewPanel = root.querySelector("[data-showcase-overview-panel]");
  var overviewClose = root.querySelector("[data-showcase-overview-close]");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var currentIndex = 0;

  function statusText(index) {
    return status.dataset.statusTemplate
      .replace("{current}", sequenceFormatter.format(index + 1))
      .replace("{total}", sequenceFormatter.format(scenes.length));
  }

  function setCurrent(index, writeHash) {
    currentIndex = Math.max(0, Math.min(index, scenes.length - 1));
    status.textContent = statusText(currentIndex);
    progress.style.inlineSize = String(((currentIndex + 1) / scenes.length) * 100) + "%";
    previous.disabled = currentIndex === 0;
    next.disabled = currentIndex === scenes.length - 1;
    scenes.forEach(function (scene, sceneIndex) {
      scene.toggleAttribute("data-current-scene", sceneIndex === currentIndex);
    });
    syncEvolution();
    if (writeHash && window.history && window.history.replaceState) {
      window.history.replaceState(null, "", "#" + scenes[currentIndex].id);
    }
  }

  function goTo(index) {
    var targetIndex = Math.max(0, Math.min(index, scenes.length - 1));
    var target = scenes[targetIndex];
    setCurrent(targetIndex, true);
    target.scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "start"
    });
    target.focus({ preventScroll: true });
  }

  scenes.forEach(function (scene) {
    scene.setAttribute("tabindex", "-1");
  });

  previous.addEventListener("click", function () {
    goTo(currentIndex - 1);
  });

  next.addEventListener("click", function () {
    goTo(currentIndex + 1);
  });

  function closeOverview(returnFocus) {
    overviewPanel.classList.remove("is-open");
    overviewPanel.hidden = true;
    overviewButton.setAttribute("aria-expanded", "false");
    if (returnFocus) {
      overviewButton.focus();
    }
  }

  function openOverview() {
    overviewPanel.hidden = false;
    window.requestAnimationFrame(function () {
      overviewPanel.classList.add("is-open");
    });
    overviewButton.setAttribute("aria-expanded", "true");
    overviewClose.focus();
  }

  overviewButton.addEventListener("click", function () {
    if (overviewPanel.hidden) {
      openOverview();
    } else {
      closeOverview(false);
    }
  });

  overviewClose.addEventListener("click", function () {
    closeOverview(true);
  });

  document.addEventListener("advanexus:request-page-start", function (event) {
    event.preventDefault();
    closeOverview(false);
    goTo(0);
  });

  overviewPanel.addEventListener("click", function (event) {
    var link = event.target.closest("a[href^='#showcase-']");
    if (!link) {
      return;
    }
    var targetHash = link.getAttribute("href");
    var targetIndex = scenes.findIndex(function (scene) {
      return "#" + scene.id === targetHash;
    });
    if (targetIndex < 0) {
      return;
    }
    event.preventDefault();
    closeOverview(false);
    goTo(targetIndex);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !overviewPanel.hidden) {
      closeOverview(true);
      return;
    }

    var target = event.target;
    var isInteractive = target && typeof target.closest === "function" && target.closest(
      "a, button, input, select, textarea, summary, [contenteditable='true']"
    );
    if (isInteractive || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    if (event.key === "PageDown") {
      event.preventDefault();
      goTo(currentIndex + 1);
    } else if (event.key === "PageUp") {
      event.preventDefault();
      goTo(currentIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(scenes.length - 1);
    }
  });

  var revealItems = root.querySelectorAll(".reveal-on-view");
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  if ("IntersectionObserver" in window) {
    var sceneRatios = new Map();
    scenes.forEach(function (scene) {
      sceneRatios.set(scene, 0);
    });
    var sceneObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        sceneRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
      });
      var bestScene = scenes.reduce(function (best, scene) {
        if (!best || sceneRatios.get(scene) > sceneRatios.get(best)) {
          return scene;
        }
        return best;
      }, null);
      if (bestScene && sceneRatios.get(bestScene) > 0) {
        setCurrent(scenes.indexOf(bestScene), true);
      }
    }, { rootMargin: "-35% 0px -35% 0px", threshold: [0, 0.2, 0.5] });
    scenes.forEach(function (scene) {
      sceneObserver.observe(scene);
    });
  }

  var flow = root.querySelector("[data-showcase-flow]");
  var flowInView = false;
  var evolution = root.querySelector("[data-showcase-evolution]");
  var evolutionScene = evolution ? evolution.closest("[data-showcase-scene]") : null;
  var evolutionStages = evolution
    ? Array.prototype.slice.call(evolution.querySelectorAll(".showcase-evolution__stage"))
    : [];
  var evolutionTimers = [];
  var evolutionActive = false;

  function clearEvolutionTimers() {
    evolutionTimers.forEach(function (timer) {
      window.clearTimeout(timer);
    });
    evolutionTimers = [];
  }

  function syncEvolution() {
    if (!evolution) {
      return;
    }
    var shouldAnimate = (
      scenes[currentIndex] === evolutionScene &&
      !document.hidden &&
      !reducedMotion.matches
    );
    if (shouldAnimate === evolutionActive) {
      if (reducedMotion.matches) {
        evolutionStages.forEach(function (stage) {
          stage.classList.add("is-reached");
        });
      }
      return;
    }
    evolutionActive = shouldAnimate;
    clearEvolutionTimers();
    evolution.classList.toggle("is-active", shouldAnimate);
    evolutionStages.forEach(function (stage) {
      stage.classList.toggle("is-reached", reducedMotion.matches);
    });
    if (!shouldAnimate) {
      return;
    }
    evolutionStages.forEach(function (stage, index) {
      evolutionTimers.push(window.setTimeout(function () {
        stage.classList.add("is-reached");
      }, 180 + index * 260));
    });
  }

  function syncFlow() {
    flow.classList.toggle(
      "is-active",
      flowInView && !document.hidden && !reducedMotion.matches
    );
  }

  if ("IntersectionObserver" in window) {
    var flowObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        flowInView = entry.isIntersecting;
        syncFlow();
      });
    }, { threshold: 0.2 });
    flowObserver.observe(flow);
  } else {
    flowInView = true;
    syncFlow();
  }

  document.addEventListener("visibilitychange", function () {
    syncFlow();
    syncEvolution();
  });

  function syncMotionPreference(event) {
    if (event.matches) {
      revealItems.forEach(function (item) {
        item.classList.add("is-visible");
      });
    }
    syncFlow();
    syncEvolution();
  }

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", syncMotionPreference);
  }

  var usecaseExplorer = root.querySelector("[data-showcase-usecases]");
  if (usecaseExplorer) {
    var usecaseTabs = Array.prototype.slice.call(
      usecaseExplorer.querySelectorAll("[data-showcase-usecase-tab]")
    );
    var usecasePanels = Array.prototype.slice.call(
      usecaseExplorer.querySelectorAll("[data-showcase-usecase-panel]")
    );

    function selectUsecase(index, moveFocus) {
      var selectedIndex = Math.max(0, Math.min(index, usecaseTabs.length - 1));
      usecaseTabs.forEach(function (tab, tabIndex) {
        var selected = tabIndex === selectedIndex;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.setAttribute("tabindex", selected ? "0" : "-1");
        if (selected && moveFocus) {
          tab.focus();
        }
      });
      usecasePanels.forEach(function (panel, panelIndex) {
        var selected = panelIndex === selectedIndex;
        panel.hidden = !selected;
        panel.toggleAttribute("data-active", selected);
      });
    }

    usecaseTabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        selectUsecase(index, false);
      });
      tab.addEventListener("keydown", function (event) {
        var targetIndex = index;
        var rtlInterface = Boolean(
          document.documentElement && document.documentElement.dir === "rtl"
        );
        if (event.key === "ArrowRight") {
          targetIndex = rtlInterface
            ? (index - 1 + usecaseTabs.length) % usecaseTabs.length
            : (index + 1) % usecaseTabs.length;
        } else if (event.key === "ArrowLeft") {
          targetIndex = rtlInterface
            ? (index + 1) % usecaseTabs.length
            : (index - 1 + usecaseTabs.length) % usecaseTabs.length;
        } else if (event.key === "ArrowDown") {
          targetIndex = (index + 1) % usecaseTabs.length;
        } else if (event.key === "ArrowUp") {
          targetIndex = (index - 1 + usecaseTabs.length) % usecaseTabs.length;
        } else if (event.key === "Home") {
          targetIndex = 0;
        } else if (event.key === "End") {
          targetIndex = usecaseTabs.length - 1;
        } else {
          return;
        }
        event.preventDefault();
        selectUsecase(targetIndex, true);
      });
    });

    if (usecaseTabs.length && usecasePanels.length === usecaseTabs.length) {
      selectUsecase(0, false);
    }
  }

  var sourcesPanel = root.querySelector(".showcase-sources");
  var sourceCopyButtons = Array.prototype.slice.call(
    root.querySelectorAll("[data-showcase-source-copy]")
  );

  function copySourceValue(value) {
    if (
      window.navigator &&
      window.navigator.clipboard &&
      typeof window.navigator.clipboard.writeText === "function"
    ) {
      return window.navigator.clipboard.writeText(value);
    }
    return new Promise(function (resolve, reject) {
      var field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.insetInlineStart = "-9999px";
      document.body.appendChild(field);
      field.select();
      try {
        if (!document.execCommand("copy")) {
          throw new Error("Copy command was rejected.");
        }
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(field);
      }
    });
  }

  function resetSourceCopyButton(button, label, defaultLabel) {
    button.classList.remove("is-copied");
    button.classList.remove("has-copy-error");
    button.setAttribute("aria-label", defaultLabel);
    label.textContent = defaultLabel;
    button._showcaseCopyTimer = null;
  }

  function scheduleSourceCopyReset(button, label, defaultLabel) {
    if (button._showcaseCopyTimer) {
      window.clearTimeout(button._showcaseCopyTimer);
    }
    button._showcaseCopyTimer = window.setTimeout(function () {
      resetSourceCopyButton(button, label, defaultLabel);
    }, 1800);
  }

  sourceCopyButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var label = button.querySelector("[data-showcase-source-copy-label]");
      var defaultLabel = button.dataset.copyLabel;
      var copiedLabel = button.dataset.copiedLabel;
      var copyFailedLabel = button.dataset.copyFailedLabel;
      copySourceValue(button.dataset.copyValue).then(function () {
        button.classList.remove("has-copy-error");
        button.classList.add("is-copied");
        button.setAttribute("aria-label", copiedLabel);
        label.textContent = copiedLabel;
        scheduleSourceCopyReset(button, label, defaultLabel);
      }).catch(function () {
        button.classList.remove("is-copied");
        button.classList.add("has-copy-error");
        button.setAttribute("aria-label", copyFailedLabel);
        label.textContent = copyFailedLabel;
        scheduleSourceCopyReset(button, label, defaultLabel);
      });
    });
  });

  if (sourcesPanel && typeof root.addEventListener === "function") {
    root.addEventListener("click", function (event) {
      var link = event.target.closest(".showcase-citations a[href^='#showcase-source-']");
      if (!link) {
        return;
      }
      var target = root.querySelector(link.getAttribute("href"));
      if (!target) {
        return;
      }
      event.preventDefault();
      sourcesPanel.open = true;
      target.setAttribute("tabindex", "-1");
      window.requestAnimationFrame(function () {
        setCurrent(scenes.length - 1, false);
        target.scrollIntoView({
          behavior: reducedMotion.matches ? "auto" : "smooth",
          block: "center"
        });
        target.focus({ preventScroll: true });
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", "#" + target.id);
        }
      });
    });
  }

  var syncRoiForPrint = function () {};
  var roi = root.querySelector("[data-showcase-roi]");
  if (roi) {
    var roiInputs = Array.prototype.slice.call(roi.querySelectorAll("[data-roi-input]"));
    var roiStepButtons = Array.prototype.slice.call(roi.querySelectorAll("[data-roi-step]"));
    var roiOutputs = {};
    Array.prototype.slice.call(roi.querySelectorAll("[data-roi-output]")).forEach(function (output) {
      roiOutputs[output.dataset.roiOutput] = output;
    });
    var integerFormatter = new Intl.NumberFormat(numberLocale, {
      maximumFractionDigits: 0
    });

    function inputConstraint(input, property, fallback) {
      var value = Number(input[property]);
      return Number.isFinite(value) ? value : fallback;
    }

    function stepMatches(value, minimum, step) {
      if (!(step > 0)) {
        return true;
      }
      var units = (value - minimum) / step;
      return Math.abs(units - Math.round(units)) < 0.0000001;
    }

    function validInputValue(input) {
      var value = Number(input.value);
      var minimum = inputConstraint(input, "min", 0);
      var maximum = inputConstraint(input, "max", Number.POSITIVE_INFINITY);
      var step = inputConstraint(input, "step", 1);
      var browserValidity = !input.validity || input.validity.valid;
      var valid = (
        input.value !== "" &&
        Number.isFinite(value) &&
        value >= minimum &&
        value <= maximum &&
        stepMatches(value, minimum, step) &&
        browserValidity
      );
      input.setAttribute("aria-invalid", valid ? "false" : "true");
      if (valid) {
        input._showcaseLastValidValue = value;
        return value;
      }
      return Number.isFinite(input._showcaseLastValidValue)
        ? input._showcaseLastValidValue
        : minimum;
    }

    function roiValue(fieldId) {
      var input = roiInputs.find(function (candidate) {
        return candidate.dataset.roiInput === fieldId;
      });
      if (!input) {
        return 0;
      }
      return validInputValue(input);
    }

    function setRoiOutput(outputId, rawValue, formatter) {
      var output = roiOutputs[outputId];
      if (!output) {
        return;
      }
      output.dataset.rawValue = String(rawValue);
      output.textContent = formatter.format(rawValue);
    }

    function updateRoiStepButtons() {
      roiStepButtons.forEach(function (button) {
        var input = roiInputs.find(function (candidate) {
          return candidate.dataset.roiInput === button.dataset.roiStepField;
        });
        if (!input) {
          button.setAttribute("aria-disabled", "true");
          return;
        }
        var value = validInputValue(input);
        var minimum = inputConstraint(input, "min", 0);
        var maximum = inputConstraint(input, "max", Number.POSITIVE_INFINITY);
        var direction = Number(button.dataset.roiStep);
        var atBoundary = direction < 0 ? value <= minimum : value >= maximum;
        button.setAttribute("aria-disabled", atBoundary ? "true" : "false");
      });
    }

    function syncRoi() {
      var validationExposure = roiValue("process_runs") * roiValue("validation_hours");
      var exceptionExposure = roiValue("exception_events") * roiValue("exception_hours");
      var evidenceExposure = roiValue("evidence_hours");
      var totalExposure = validationExposure + exceptionExposure + evidenceExposure;

      setRoiOutput("validation-exposure", validationExposure, integerFormatter);
      setRoiOutput("exception-exposure", exceptionExposure, integerFormatter);
      setRoiOutput("evidence-exposure", evidenceExposure, integerFormatter);
      setRoiOutput("total-exposure", totalExposure, integerFormatter);
      updateRoiStepButtons();
    }

    syncRoiForPrint = syncRoi;
    roiInputs.forEach(function (input) {
      input.addEventListener("input", syncRoi);
      input.addEventListener("change", syncRoi);
    });
    roiStepButtons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        if (button.getAttribute("aria-disabled") === "true") {
          return;
        }
        var input = roiInputs.find(function (candidate) {
          return candidate.dataset.roiInput === button.dataset.roiStepField;
        });
        if (!input) {
          return;
        }
        var direction = Number(button.dataset.roiStep);
        var step = inputConstraint(input, "step", 1);
        var minimum = inputConstraint(input, "min", 0);
        var maximum = inputConstraint(input, "max", Number.POSITIVE_INFINITY);
        var current = validInputValue(input);
        var precision = String(step).indexOf(".") >= 0
          ? String(step).split(".")[1].length
          : 0;
        var factor = Math.pow(10, precision);
        var nextValue = Math.round((current + direction * step) * factor) / factor;
        nextValue = Math.max(minimum, Math.min(maximum, nextValue));
        input.value = String(nextValue);
        input._showcaseLastValidValue = nextValue;
        input.setAttribute("aria-invalid", "false");
        syncRoi();
        if (typeof input.focus === "function") {
          input.focus({ preventScroll: true });
        }
      });
    });
    syncRoi();
  }

  var printState = null;

  function preparePrint() {
    if (printState) {
      return;
    }
    printState = {
      sourcesOpen: Boolean(sourcesPanel && sourcesPanel.open),
      revealed: [],
      lazyImages: [],
      hiddenUsecasePanels: []
    };
    root.classList.add("is-printing");
    syncRoiForPrint();
    revealItems.forEach(function (item) {
      if (!item.classList.contains("is-visible")) {
        printState.revealed.push(item);
        item.classList.add("is-visible");
      }
    });
    Array.prototype.slice.call(root.querySelectorAll("img[loading='lazy']")).forEach(function (image) {
      printState.lazyImages.push(image);
      image.setAttribute("loading", "eager");
      if (typeof image.decode === "function") {
        image.decode().catch(function () {});
      }
    });
    if (sourcesPanel) {
      sourcesPanel.open = true;
    }
    if (usecasePanels) {
      usecasePanels.forEach(function (panel) {
        if (panel.hidden) {
          printState.hiddenUsecasePanels.push(panel);
          panel.hidden = false;
        }
      });
    }
  }

  function restoreAfterPrint() {
    if (!printState) {
      return;
    }
    if (sourcesPanel) {
      sourcesPanel.open = printState.sourcesOpen;
    }
    printState.revealed.forEach(function (item) {
      item.classList.remove("is-visible");
    });
    printState.lazyImages.forEach(function (image) {
      image.setAttribute("loading", "lazy");
    });
    printState.hiddenUsecasePanels.forEach(function (panel) {
      panel.hidden = true;
    });
    root.classList.remove("is-printing");
    printState = null;
  }

  if (typeof window.addEventListener === "function") {
    window.addEventListener("beforeprint", preparePrint);
    window.addEventListener("afterprint", restoreAfterPrint);
  }

  var hashIndex = scenes.findIndex(function (scene) {
    return "#" + scene.id === window.location.hash;
  });
  if (
    hashIndex < 0 &&
    sourcesPanel &&
    window.location.hash.indexOf("#showcase-source-") === 0
  ) {
    sourcesPanel.open = true;
    hashIndex = scenes.length - 1;
  }
  setCurrent(hashIndex >= 0 ? hashIndex : 0, false);
  if (reducedMotion.matches) {
    syncMotionPreference(reducedMotion);
  }
}());
