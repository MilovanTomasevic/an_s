(function () {
  "use strict";

  var graph = document.querySelector("[data-control-graph]");
  if (!graph) {
    return;
  }

  var nodes = Array.prototype.slice.call(graph.querySelectorAll("[data-graph-node]"));
  var labels = Array.prototype.slice.call(graph.querySelectorAll("[data-graph-label]"));
  var ledger = graph.querySelector("[data-graph-ledger]");
  var toggle = graph.querySelector("[data-graph-toggle]");
  var toggleLabel = graph.querySelector("[data-graph-toggle-label]");
  var toggleIcon = graph.querySelector("[data-graph-toggle-icon]");
  var status = graph.querySelector("[data-graph-status]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var compactLayout = window.matchMedia("(max-width: 42rem)");
  var timer = null;
  var activeIndex = 0;
  var userPaused = false;
  var visible = true;

  function setActive(index, announceStatus) {
    activeIndex = index % Math.max(nodes.length, 1);
    var activeNode = nodes[activeIndex];
    var activeStage = activeNode ? activeNode.closest("[data-graph-zone]") : null;
    var progress = nodes.length > 1 ? activeIndex / (nodes.length - 1) : 1;
    graph.style.setProperty("--graph-progress", String(progress * 100) + "%");
    graph.setAttribute("data-active-index", String(activeIndex));
    graph.setAttribute(
      "data-active-zone",
      activeStage ? activeStage.dataset.graphZone : "corridor"
    );
    nodes.forEach(function (node, nodeIndex) {
      node.classList.toggle("is-active", nodeIndex === activeIndex);
    });
    labels.forEach(function (label, labelIndex) {
      label.classList.toggle("is-active", labelIndex === activeIndex);
      label.setAttribute("aria-pressed", String(labelIndex === activeIndex));
    });
    if (announceStatus && status && labels[activeIndex]) {
      status.textContent = labels[activeIndex].textContent.trim();
    }
    if (ledger) {
      ledger.classList.toggle("is-active", activeIndex === nodes.length - 1);
    }
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    graph.setAttribute("data-graph-state", userPaused ? "paused" : "ready");
  }

  function start() {
    if (reduceMotion.matches || userPaused || !visible || document.hidden || nodes.length < 2) {
      stop();
      return;
    }
    if (timer) {
      return;
    }
    graph.setAttribute("data-graph-state", "running");
    timer = window.setInterval(function () {
      var nextIndex = (activeIndex + 1) % nodes.length;
      setActive(nextIndex);
    }, compactLayout.matches ? 1900 : 1500);
  }

  function updateToggle() {
    if (!toggle || !toggleLabel) {
      return;
    }
    toggle.setAttribute("aria-pressed", String(userPaused));
    toggleLabel.textContent = userPaused ? toggle.dataset.resumeLabel : toggle.dataset.pauseLabel;
    if (toggleIcon) {
      toggleIcon.textContent = userPaused ? "▶" : "‖";
    }
  }

  function updateMotionControl() {
    if (!toggle) {
      return;
    }
    toggle.hidden = reduceMotion.matches;
  }

  setActive(0);

  labels.forEach(function (label, index) {
    label.addEventListener("click", function () {
      userPaused = true;
      graph.setAttribute("data-user-selected", "true");
      setActive(index, true);
      updateToggle();
      stop();
    });
  });

  if (toggle) {
    updateMotionControl();
    toggle.addEventListener("click", function () {
      userPaused = !userPaused;
      if (!userPaused) {
        graph.removeAttribute("data-user-selected");
      }
      updateToggle();
      if (userPaused) {
        stop();
      } else {
        start();
      }
    });
  }

  reduceMotion.addEventListener("change", function () {
    if (reduceMotion.matches) {
      setActive(nodes.length - 1);
      stop();
    } else {
      userPaused = false;
      graph.removeAttribute("data-user-selected");
      start();
    }
    updateMotionControl();
  });

  compactLayout.addEventListener("change", function () {
    stop();
    start();
    updateMotionControl();
  });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      visible = Boolean(entries[0] && entries[0].isIntersecting);
      if (visible) {
        start();
      } else {
        stop();
      }
    }, { threshold: 0.15 });
    observer.observe(graph);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  if (reduceMotion.matches) {
    setActive(nodes.length - 1);
  } else {
    start();
  }
}());
