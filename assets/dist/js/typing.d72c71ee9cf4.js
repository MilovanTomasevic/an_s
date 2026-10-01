(function () {
  "use strict";

  var stateByElement = new WeakMap();
  var statusStateByElement = new WeakMap();
  var activeElements = new Set();
  var activeStatusElements = new Set();
  var observedElements = new WeakSet();
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var forcedColors = window.matchMedia("(forced-colors: active)");
  var compactViewport = window.matchMedia("(max-width: 42rem)");
  var observer = null;
  var generation = 0;
  var announcementGeneration = 0;
  var language = document.documentElement.lang || "en";
  var textDirection = document.documentElement.dir === "rtl" ? "rtl" : "ltr";
  var graphemeSegmenter = null;

  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    try {
      graphemeSegmenter = new Intl.Segmenter(language, { granularity: "grapheme" });
    } catch (error) {
      graphemeSegmenter = null;
    }
  }

  function boundedNumber(value, fallback, minimum, maximum) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(maximum, Math.max(minimum, parsed));
  }

  function wordTokensFor(text) {
    var parts = text.match(/\s+|\S+/gu) || [];
    var leadingWhitespace = "";
    var tokens = [];
    parts.forEach(function (part) {
      if (/^\s+$/u.test(part)) {
        if (tokens.length) {
          tokens[tokens.length - 1] += part;
        } else {
          leadingWhitespace += part;
        }
        return;
      }
      tokens.push(leadingWhitespace + part);
      leadingWhitespace = "";
    });
    if (leadingWhitespace) {
      if (tokens.length) {
        tokens[tokens.length - 1] += leadingWhitespace;
      } else {
        tokens.push(leadingWhitespace);
      }
    }
    return tokens;
  }

  function proseSegmentsFor(text) {
    var words = wordTokensFor(text);
    var chunks = [];
    var chunk = "";
    var wordsInChunk = 0;

    function commitChunk() {
      if (chunk) {
        chunks.push(chunk);
      }
      chunk = "";
      wordsInChunk = 0;
    }

    words.forEach(function (word, index) {
      var visibleWord = word.trim();
      chunk += word;
      wordsInChunk += 1;
      var visibleLength = Array.from(chunk.trim()).length;
      var strongBoundary = /[.!?:;\u2026\u061f\u3002\uff01\uff1f]["'’”)}\]]*$/u.test(
        visibleWord
      );
      var softBoundary = /[,\u2013\u2014]["'’”)}\]]*$/u.test(visibleWord);
      var lastWord = index === words.length - 1;
      if (
        strongBoundary ||
        wordsInChunk >= 3 ||
        visibleLength >= 18 ||
        (softBoundary && wordsInChunk >= 2) ||
        lastWord
      ) {
        commitChunk();
      }
    });
    return chunks;
  }

  function segmentsFor(text, unit) {
    if (unit === "prose") {
      return proseSegmentsFor(text);
    }
    if (unit === "token") {
      return wordTokensFor(text);
    }
    if (graphemeSegmenter) {
      return Array.from(graphemeSegmenter.segment(text), function (record) {
        return record.segment;
      });
    }
    return Array.from(text);
  }

  function removeChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function cancelAnnouncement(status, clear) {
    if (!status) {
      return;
    }
    var current = statusStateByElement.get(status);
    if (current) {
      window.cancelAnimationFrame(current.frame);
      statusStateByElement.delete(status);
      activeStatusElements.delete(status);
    }
    if (clear) {
      status.textContent = "";
    }
  }

  function announce(status, text) {
    if (!status || !text) {
      return;
    }
    cancelAnnouncement(status, true);
    announcementGeneration += 1;
    var state = {
      frame: null,
      generation: announcementGeneration
    };
    state.frame = window.requestAnimationFrame(function () {
      var current = statusStateByElement.get(status);
      if (
        current === state &&
        current.generation === state.generation &&
        status.isConnected &&
        !document.hidden
      ) {
        status.textContent = text;
      }
      statusStateByElement.delete(status);
      activeStatusElements.delete(status);
    });
    statusStateByElement.set(status, state);
    activeStatusElements.add(status);
  }

  function settle(state, shouldAnnounce) {
    if (!state || state.settled) {
      return;
    }
    state.settled = true;
    if (state.frame !== null) {
      window.cancelAnimationFrame(state.frame);
    }
    if (state.delayTimer !== null) {
      window.clearTimeout(state.delayTimer);
    }
    state.element.textContent = state.text;
    state.element.classList.remove("typing-effect");
    state.element.removeAttribute("data-typewriter-state");
    state.element.removeAttribute("aria-busy");
    stateByElement.delete(state.element);
    activeElements.delete(state.element);
    if (shouldAnnounce) {
      announce(state.status, state.announcement);
    }
  }

  function finish(element, options) {
    var state = element ? stateByElement.get(element) : null;
    if (state) {
      settle(state, Boolean(options && options.announce));
    }
  }

  function finishWithin(root) {
    if (!root) {
      return;
    }
    if (typeof root.matches === "function" && root.matches("[data-typewriter-state]")) {
      finish(root);
    }
    if (!root.querySelectorAll) {
      return;
    }
    Array.prototype.forEach.call(
      root.querySelectorAll("[data-typewriter-state]"),
      function (element) {
        finish(element);
      }
    );
    if (typeof root.matches === "function" && root.matches("[data-typewriter-status]")) {
      cancelAnnouncement(root, true);
    }
    Array.prototype.forEach.call(
      root.querySelectorAll("[data-typewriter-status]"),
      function (status) {
        cancelAnnouncement(status, true);
      }
    );
  }

  function finishAll() {
    Array.from(activeElements).forEach(function (element) {
      finish(element);
    });
  }

  function cancelAllAnnouncements() {
    Array.from(activeStatusElements).forEach(function (status) {
      cancelAnnouncement(status, true);
    });
  }

  function motionIsSuppressed() {
    return reducedMotion.matches || forcedColors.matches || compactViewport.matches;
  }

  function reveal(element, options) {
    if (!element) {
      return;
    }
    options = options || {};
    finish(element);

    var text = options.text === undefined ? element.textContent : String(options.text);
    var status = options.status || null;
    var announcement = String(options.announcement || text).trim();
    var profile = String(options.profile || "");
    cancelAnnouncement(status, true);
    if (element.childElementCount > 0) {
      if (options.announce !== false) {
        announce(status, announcement);
      }
      return;
    }
    var unit = options.unit || (profile === "prose" ? "prose" : "grapheme");
    var units = segmentsFor(text, unit);
    var immediate = Boolean(options.immediate) || motionIsSuppressed() || units.length < 2;

    if (immediate) {
      element.textContent = text;
      element.classList.remove("typing-effect");
      element.removeAttribute("data-typewriter-state");
      element.removeAttribute("aria-busy");
      if (options.announce !== false) {
        announce(status, announcement);
      }
      return;
    }

    var source = document.createElement("span");
    source.className = "typing-effect__source";
    source.textContent = text;
    source.setAttribute("dir", textDirection);
    source.setAttribute("lang", language);

    var visual = document.createElement("span");
    visual.className = "typing-effect__visual";
    visual.setAttribute("aria-hidden", "true");
    visual.setAttribute("dir", textDirection);
    visual.setAttribute("lang", language);

    var revealed = document.createElement("span");
    revealed.className = "typing-effect__revealed";

    var caret = document.createElement("span");
    caret.className = "typing-effect__caret";

    var pending = document.createElement("span");
    pending.className = "typing-effect__pending";
    pending.textContent = text;

    visual.appendChild(revealed);
    visual.appendChild(caret);
    visual.appendChild(pending);

    removeChildren(element);
    element.appendChild(source);
    element.appendChild(visual);
    element.classList.add("typing-effect");
    element.setAttribute("data-typewriter-state", "active");
    element.setAttribute("aria-busy", "true");

    generation += 1;
    var defaultDuration = profile === "prose"
      ? Math.min(680, Math.max(440, 320 + (units.length * 30)))
      : 720;
    var state = {
      announcement: announcement,
      delayTimer: null,
      duration: boundedNumber(options.duration, defaultDuration, 260, 820),
      element: element,
      frame: null,
      generation: generation,
      lastCount: 0,
      pending: pending,
      revealed: revealed,
      settled: false,
      status: status,
      text: text,
      units: units,
      visual: visual
    };
    stateByElement.set(element, state);
    activeElements.add(element);

    var delay = boundedNumber(options.delay, profile === "prose" ? 32 : 70, 0, 180);
    state.delayTimer = window.setTimeout(function () {
      state.delayTimer = null;
      var startedAt = null;

      function draw(timestamp) {
        var current = stateByElement.get(element);
        if (
          current !== state ||
          state.settled ||
          state.generation !== current.generation ||
          !element.isConnected
        ) {
          settle(state, false);
          return;
        }
        if (document.hidden) {
          settle(state, false);
          return;
        }
        if (startedAt === null) {
          startedAt = timestamp;
        }
        var progress = Math.min(1, (timestamp - startedAt) / state.duration);
        var count = Math.max(1, Math.ceil(progress * state.units.length));
        if (count !== state.lastCount) {
          state.revealed.textContent = state.units.slice(0, count).join("");
          state.pending.textContent = state.units.slice(count).join("");
          state.lastCount = count;
        }
        if (progress < 1) {
          state.frame = window.requestAnimationFrame(draw);
        } else {
          settle(state, true);
        }
      }

      state.frame = window.requestAnimationFrame(draw);
    }, delay);
  }

  function revealObserved(element) {
    if (!element || observedElements.has(element)) {
      return;
    }
    observedElements.add(element);
    reveal(element, {
      announce: false,
      delay: 40,
      duration: element.dataset.typewriterDuration,
      profile: "formula",
      unit: element.dataset.typewriterUnit || "token"
    });
  }

  function enhanceObserved() {
    var elements = Array.prototype.slice.call(
      document.querySelectorAll("[data-typewriter-on-view]")
    );
    if (!elements.length || motionIsSuppressed() || compactViewport.matches) {
      return;
    }
    if (!("IntersectionObserver" in window)) {
      return;
    }
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          revealObserved(entry.target);
        }
      });
    }, { rootMargin: "120px 0px -8%", threshold: 0.18 });
    elements.forEach(function (element) {
      var bounds = element.getBoundingClientRect();
      var alreadyVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;
      if (alreadyVisible) {
        observedElements.add(element);
      } else {
        observer.observe(element);
      }
    });
  }

  function bindMediaChange(query) {
    var listener = function () {
      if (query.matches) {
        finishAll();
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      }
    };
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", listener);
    } else if (typeof query.addListener === "function") {
      query.addListener(listener);
    }
  }

  bindMediaChange(reducedMotion);
  bindMediaChange(forcedColors);
  bindMediaChange(compactViewport);

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      finishAll();
      cancelAllAnnouncements();
    }
  });

  window.addEventListener("pagehide", function () {
    finishAll();
    cancelAllAnnouncements();
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  });

  window.AdvanexusTyping = Object.freeze({
    finish: finish,
    finishWithin: finishWithin,
    reveal: reveal
  });

  enhanceObserved();
}());
