(function () {
  "use strict";

  var deck = document.querySelector("[data-deck]");
  if (!deck) {
    return;
  }

  var root = document.documentElement;
  var slides = Array.prototype.slice.call(deck.querySelectorAll(".slides > section[data-slide]"));
  if (!slides.length) {
    return;
  }

  var previousButton = deck.querySelector("[data-deck-prev]");
  var nextButton = deck.querySelector("[data-deck-next]");
  var count = deck.querySelector("[data-deck-count]");
  var progress = deck.querySelector(".deck-progress span");
  var themeButton = deck.querySelector("[data-deck-theme]");
  var motionButton = deck.querySelector("[data-deck-motion]");
  var gotoButtons = Array.prototype.slice.call(deck.querySelectorAll("[data-deck-goto]"));
  var languageLinks = Array.prototype.slice.call(deck.querySelectorAll("a.language-switch"));
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var motionPaused = reducedMotion.matches;
  var current = -1;
  var touchStart = null;
  var architectureBoard = deck.querySelector("[data-architecture-composition]");
  var interactiveSelector = "button, a, input, select, textarea, [contenteditable], [role='button']";
  var slideScenes = slides.map(function (slide) {
    return Array.prototype.slice.call(slide.querySelectorAll("[data-scene]")).map(function (element) {
      var states = (element.getAttribute("data-states") || "").split(",").map(function (state) {
        return state.trim();
      }).filter(Boolean);
      var durations = (element.getAttribute("data-durations") || "").split(",").map(Number);
      return {
        element: element,
        states: states.length ? states : ["static"],
        durations: states.map(function (_, index) {
          var duration = durations[index];
          return Number.isFinite(duration) && duration > 0 && duration <= 2147483647 ? duration : 2000;
        }),
        index: 0,
        timer: null
      };
    });
  });

  function clamp(index) {
    return Math.max(0, Math.min(slides.length - 1, index));
  }

  // Keep the inter-system connection outside the operational nodes at every size.
  // Only geometry changes here; the two systems retain independent scene clocks.
  function layoutArchitectureBridge() {
    if (!architectureBoard || current < 0 || slides[current].getAttribute("data-slide") !== "architecture") {
      return;
    }
    var engine = architectureBoard.querySelector('[data-system="mspeed"]');
    var platform = architectureBoard.querySelector('[data-platform-boundary="advanexus"]');
    var access = architectureBoard.querySelector(".architecture-access");
    var label = architectureBoard.querySelector("[data-interop-label]");
    var bridge = architectureBoard.querySelector("[data-interop-bridge]");
    if (!engine || !platform || !access || !label || !bridge) {
      return;
    }
    var boardBox = architectureBoard.getBoundingClientRect();
    if (!boardBox.width) {
      return;
    }
    var engineBox = engine.getBoundingClientRect();
    var platformBox = platform.getBoundingClientRect();
    var accessBox = access.getBoundingClientRect();
    var mobile = window.innerWidth <= 700;
    var requestX = boardBox.width + 12;
    var responseX = boardBox.width + 20;
    var targetX = platformBox.right - boardBox.left + 6;
    var targetY = platformBox.top - boardBox.top + platformBox.height / 2;
    var sourceX = mobile ? engineBox.right - boardBox.left + 6 : engineBox.left - boardBox.left + engineBox.width / 2;
    var sourceY = mobile ? engineBox.top - boardBox.top + engineBox.height / 2 : engineBox.top - boardBox.top - 6;
    label.style.maxWidth = mobile ? Math.max(80, engineBox.width / 2 - 12) + "px" : "";
    var labelY = mobile ? engineBox.top - boardBox.top - label.offsetHeight - 10 : accessBox.top - boardBox.top;
    label.style.left = (mobile ? engineBox.left - boardBox.left + engineBox.width / 2 + 12 : Math.max(0, boardBox.width - label.offsetWidth - 7)) + "px";
    label.style.top = labelY + "px";
    var requestEndX = mobile ? sourceX : sourceX - 5;
    var requestEndY = mobile ? sourceY - 5 : sourceY;
    var responseStartX = mobile ? sourceX : sourceX + 5;
    var responseStartY = mobile ? sourceY + 5 : sourceY;
    var responseRailY = sourceY - 4;
    var requestRailY = responseRailY - 8;
    var requestPath = "M" + targetX + " " + (targetY + 5) + " H" + requestX
      + " V" + (mobile ? requestEndY : requestRailY) + " H" + requestEndX
      + (mobile ? "" : " V" + requestEndY);
    var responsePath = "M" + responseStartX + " " + responseStartY
      + (mobile ? "" : " V" + responseRailY) + " H" + responseX
      + " V" + (targetY - 5) + " H" + targetX;
    bridge.querySelectorAll("[data-interop-path]").forEach(function (line) {
      line.setAttribute("d", line.getAttribute("data-direction") === "request" ? requestPath : responsePath);
    });
    bridge.querySelector('.interop-arrow[data-direction="response"]').setAttribute("d", "M" + (targetX + 5) + " " + (targetY - 8) + " L" + targetX + " " + (targetY - 5) + " L" + (targetX + 5) + " " + (targetY - 2));
    bridge.querySelector('.interop-arrow[data-direction="request"]').setAttribute("d", mobile
      ? "M" + (requestEndX + 5) + " " + (requestEndY - 3) + " L" + requestEndX + " " + requestEndY + " L" + (requestEndX + 5) + " " + (requestEndY + 3)
      : "M" + (requestEndX - 3) + " " + (requestEndY - 5) + " L" + requestEndX + " " + requestEndY + " L" + (requestEndX + 3) + " " + (requestEndY - 5));
    bridge.setAttribute("data-ready", "true");
  }

  function indexFromHash() {
    var match = window.location.hash.match(/^#\/(\d+)$/);
    return match ? clamp(Number(match[1]) - 1) : 0;
  }

  function readTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function updateLanguageLinks() {
    languageLinks.forEach(function (link) {
      var url = new URL(link.getAttribute("href"), window.location.href);
      url.searchParams.set("theme", readTheme());
      url.hash = "/" + (current + 1);
      link.href = url.href;
    });
  }

  function applyTheme(theme, updateAddress) {
    var nextTheme = theme === "dark" ? "dark" : "light";
    root.setAttribute("data-theme", nextTheme);
    if (themeButton) {
      var label = themeButton.getAttribute(nextTheme === "dark" ? "data-label-light" : "data-label-dark");
      themeButton.setAttribute("aria-label", label);
      themeButton.setAttribute("title", label);
      var icon = themeButton.querySelector("span");
      if (icon) {
        icon.textContent = nextTheme === "dark" ? "☀" : "☾";
      }
    }
    if (updateAddress) {
      var url = new URL(window.location.href);
      url.searchParams.set("theme", nextTheme);
      window.history.replaceState(null, "", url.href);
    }
    if (current >= 0) {
      updateLanguageLinks();
    }
  }

  function syncMotion() {
    root.setAttribute("data-motion", motionPaused ? "paused" : "running");
    root.setAttribute("data-visibility", document.hidden ? "hidden" : "visible");
    if (motionButton) {
      var label = motionButton.getAttribute(motionPaused ? "data-label-resume" : "data-label-pause");
      motionButton.setAttribute("aria-label", label);
      motionButton.setAttribute("title", label);
      motionButton.setAttribute("aria-pressed", String(motionPaused));
      var icon = motionButton.querySelector("span");
      if (icon) {
        icon.textContent = motionPaused ? "▶" : "Ⅱ";
      }
    }
    syncSceneTimers();
  }

  // Scenes expose named visual states, not a shared highlight rhythm. Their
  // complete explanation stays in the document, including while motion stops.
  function setSceneState(scene, index) {
    scene.index = index;
    scene.element.setAttribute("data-state", scene.states[index]);
  }

  function scenesCanRun() {
    return current >= 0 && slides[current].classList.contains("present")
      && !slides[current].hidden && !document.hidden
      && root.getAttribute("data-motion") === "running" && !reducedMotion.matches;
  }

  function stopSceneTimer(scene) {
    if (scene.timer !== null) {
      window.clearTimeout(scene.timer);
      scene.timer = null;
    }
  }

  function scheduleScene(scene) {
    if (!scenesCanRun() || scene.states.length < 2 || scene.element.getAttribute("data-scene-active") !== "true") {
      return;
    }
    scene.timer = window.setTimeout(function () {
      scene.timer = null;
      if (!scenesCanRun() || scene.element.getAttribute("data-scene-active") !== "true") {
        return;
      }
      setSceneState(scene, (scene.index + 1) % scene.states.length);
      scheduleScene(scene);
    }, scene.durations[scene.index]);
  }

  function syncSceneTimers() {
    slideScenes.forEach(function (scenes) { scenes.forEach(stopSceneTimer); });
    if (scenesCanRun()) {
      slideScenes[current].forEach(scheduleScene);
    }
  }

  function show(index, focusHeading) {
    var nextIndex = clamp(index);
    var changed = nextIndex !== current;
    var focusWasInSlide = current >= 0 && slides[current].contains(document.activeElement);
    current = nextIndex;
    slides.forEach(function (slide, slideIndex) {
      var active = slideIndex === current;
      slide.classList.toggle("present", active);
      slide.hidden = !active;
      slide.inert = !active;
      slide.setAttribute("aria-hidden", String(!active));
      slideScenes[slideIndex].forEach(function (scene) {
        scene.element.setAttribute("data-scene-active", String(active));
      });
    });

    if (previousButton) {
      previousButton.disabled = current === 0;
    }
    if (nextButton) {
      nextButton.disabled = current === slides.length - 1;
    }
    gotoButtons.forEach(function (button) {
      if (Number(button.getAttribute("data-deck-goto")) === current + 1) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
    if (count) {
      count.textContent = String(current + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
    }
    if (progress) {
      progress.style.width = ((current + 1) / slides.length * 100) + "%";
    }

    var hash = "#/" + (current + 1);
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
    updateLanguageLinks();

    if (changed) {
      slideScenes[current].forEach(function (scene) { setSceneState(scene, 0); });
    }
    syncSceneTimers();

    layoutArchitectureBridge();

    if (changed) {
      var frame = slides[current].querySelector(".slide-frame");
      if (frame) {
        frame.scrollTop = 0;
        frame.scrollLeft = 0;
      }
      window.scrollTo(0, 0);
      if (focusHeading || focusWasInSlide) {
        var heading = slides[current].querySelector("h1, h2");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        }
      }
    }
  }

  if (previousButton) {
    previousButton.addEventListener("click", function () { show(current - 1); });
  }
  if (nextButton) {
    nextButton.addEventListener("click", function () { show(current + 1); });
  }
  if (themeButton) {
    themeButton.addEventListener("click", function () {
      applyTheme(readTheme() === "dark" ? "light" : "dark", true);
    });
  }
  if (motionButton) {
    motionButton.addEventListener("click", function () {
      motionPaused = !motionPaused;
      syncMotion();
    });
  }
  gotoButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var target = Number(button.getAttribute("data-deck-goto"));
      if (Number.isInteger(target) && target >= 1 && target <= slides.length) {
        show(target - 1, true);
      }
    });
  });

  window.addEventListener("keydown", function (event) {
    if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    if (event.target.closest && event.target.closest(interactiveSelector)) {
      return;
    }
    var target;
    if (event.key === "ArrowRight" || event.key === "PageDown") {
      target = current + 1;
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      target = current - 1;
    } else if (event.key === "Home") {
      target = 0;
    } else if (event.key === "End") {
      target = slides.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    show(target, true);
  });

  deck.addEventListener("touchstart", function (event) {
    touchStart = null;
    if (event.touches.length !== 1 || event.target.closest(interactiveSelector)) {
      return;
    }
    if (window.visualViewport && window.visualViewport.scale > 1.05) {
      return;
    }
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });

  deck.addEventListener("touchmove", function (event) {
    if (!touchStart) {
      return;
    }
    if (event.touches.length !== 1) {
      touchStart = null;
      return;
    }
    var horizontal = Math.abs(event.touches[0].clientX - touchStart.x);
    var vertical = Math.abs(event.touches[0].clientY - touchStart.y);
    if (vertical > 12 && vertical >= horizontal) {
      touchStart = null;
    }
  }, { passive: true });

  deck.addEventListener("touchend", function (event) {
    var start = touchStart;
    touchStart = null;
    if (!start || event.touches.length || event.changedTouches.length !== 1) {
      return;
    }
    var deltaX = event.changedTouches[0].clientX - start.x;
    var deltaY = event.changedTouches[0].clientY - start.y;
    if (Math.abs(deltaX) >= 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      show(current + (deltaX < 0 ? 1 : -1));
    }
  }, { passive: true });

  deck.addEventListener("touchcancel", function () { touchStart = null; }, { passive: true });
  window.addEventListener("hashchange", function () { show(indexFromHash()); });
  window.addEventListener("resize", layoutArchitectureBridge);
  if (architectureBoard && typeof window.ResizeObserver === "function") {
    var bridgeObserver = new window.ResizeObserver(layoutArchitectureBridge);
    bridgeObserver.observe(architectureBoard);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(layoutArchitectureBridge);
  }
  document.addEventListener("visibilitychange", syncMotion);
  function motionPreferenceChanged() {
    motionPaused = reducedMotion.matches;
    syncMotion();
  }
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", motionPreferenceChanged);
  } else {
    reducedMotion.addListener(motionPreferenceChanged);
  }

  var theme = new URL(window.location.href).searchParams.get("theme");
  applyTheme(theme === "light" || theme === "dark" ? theme : "light", false);
  slideScenes.forEach(function (scenes) {
    scenes.forEach(function (scene) {
      scene.element.setAttribute("data-scene-active", "false");
      setSceneState(scene, 0);
    });
  });
  syncMotion();
  show(indexFromHash());
}());
