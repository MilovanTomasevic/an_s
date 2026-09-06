(function () {
  "use strict";

  var root = document.documentElement;
  var isRtl = root.dir === "rtl";
  root.classList.remove("no-js");
  root.classList.add("js");

  var toggle = document.querySelector("[data-nav-toggle]");
  var navigation = document.querySelector("[data-site-nav]");
  var siteHeader = document.querySelector("[data-site-header]");
  var backToTop = document.querySelector("[data-back-to-top]");
  var backToTopProgress = backToTop
    ? backToTop.querySelector("[data-back-to-top-progress]")
    : null;
  var menuQuery = window.matchMedia("(max-width: 84rem)");
  var footerDisclosureQuery = window.matchMedia("(max-width: 42rem)");
  var footerDisclosures = Array.prototype.slice.call(
    document.querySelectorAll("[data-footer-disclosure]")
  );
  var toggleLabel = toggle ? toggle.querySelector("[data-nav-toggle-label]") : null;

  function syncFooterDisclosures(event) {
    footerDisclosures.forEach(function (disclosure) {
      if (event.matches) {
        disclosure.removeAttribute("open");
      } else {
        disclosure.setAttribute("open", "");
      }
    });
  }

  if (footerDisclosures.length) {
    syncFooterDisclosures(footerDisclosureQuery);
    footerDisclosureQuery.addEventListener("change", syncFooterDisclosures);
  }

  if (siteHeader || backToTop) {
    var scrollFrame = null;
    var scrollIdleTimer = null;
    var updateScrollState = function () {
      var scrollPosition = Math.max(0, window.scrollY || root.scrollTop || 0);
      var viewportHeight = Math.max(0, root.clientHeight || window.innerHeight || 0);
      var scrollRange = Math.max(0, (root.scrollHeight || 0) - viewportHeight);
      var revealDistance = Math.max(320, Math.min(viewportHeight * 0.55, 640));
      scrollFrame = null;
      if (siteHeader) {
        siteHeader.setAttribute("data-scrolled", String(scrollPosition > 20));
      }
      if (backToTop) {
        backToTop.setAttribute("data-visible", String(scrollPosition > revealDistance));
        if (backToTopProgress) {
          var progress = scrollRange ? Math.min(1, scrollPosition / scrollRange) : 0;
          backToTopProgress.style.strokeDashoffset = String(100 - (progress * 100));
        }
      }
    };
    var requestScrollUpdate = function () {
      if (scrollFrame === null) {
        scrollFrame = window.requestAnimationFrame(updateScrollState);
      }
    };
    updateScrollState();
    window.addEventListener("scroll", function () {
      if (backToTop) {
        backToTop.setAttribute("data-scrolling", "true");
        if (scrollIdleTimer !== null) {
          window.clearTimeout(scrollIdleTimer);
        }
        scrollIdleTimer = window.setTimeout(function () {
          backToTop.removeAttribute("data-scrolling");
          scrollIdleTimer = null;
        }, 180);
      }
      requestScrollUpdate();
    }, { passive: true });
    window.addEventListener("resize", requestScrollUpdate);
  }

  if (backToTop) {
    backToTop.addEventListener("click", function (event) {
      var startRequest = new window.Event("advanexus:request-page-start", {
        cancelable: true
      });
      if (!document.dispatchEvent(startRequest)) {
        event.preventDefault();
      }
    });
  }

  function setToggleLabel(open) {
    if (!toggle) {
      return;
    }
    var label = open ? toggle.dataset.closeLabel : toggle.dataset.openLabel;
    toggle.setAttribute("aria-label", label);
    if (toggleLabel) {
      toggleLabel.textContent = label;
    }
  }

  function closeNavigation(options) {
    if (!toggle || !navigation) {
      return;
    }
    toggle.setAttribute("aria-expanded", "false");
    navigation.removeAttribute("data-open");
    document.body.removeAttribute("data-navigation-open");
    setToggleLabel(false);
    closeDisclosureMenus();
    if (options && options.restoreFocus) {
      toggle.focus();
    }
  }

  function openNavigation() {
    if (!toggle || !navigation) {
      return;
    }
    toggle.setAttribute("aria-expanded", "true");
    navigation.setAttribute("data-open", "true");
    document.body.setAttribute("data-navigation-open", "true");
    setToggleLabel(true);
    window.requestAnimationFrame(function () {
      var firstFocusable = navigation.querySelector("a[href], summary, button:not([disabled])");
      if (firstFocusable) {
        firstFocusable.focus();
      }
    });
  }

  if (toggle && navigation) {
    toggle.hidden = false;
    toggle.addEventListener("click", function () {
      if (toggle.getAttribute("aria-expanded") === "true") {
        closeNavigation();
      } else {
        openNavigation();
      }
    });

    navigation.addEventListener("click", function (event) {
      if (menuQuery.matches && event.target.closest("a")) {
        closeNavigation();
      }
    });

    menuQuery.addEventListener("change", function (event) {
      if (!event.matches) {
        closeNavigation();
      }
    });

    navigation.addEventListener("keydown", function (event) {
      if (event.key !== "Tab" || !menuQuery.matches || navigation.getAttribute("data-open") !== "true") {
        return;
      }
      var focusable = Array.prototype.slice.call(
        navigation.querySelectorAll("a[href], summary, button:not([disabled]), input:not([disabled])")
      ).filter(function (element) {
        return element.getClientRects().length > 0;
      });
      if (!focusable.length) {
        return;
      }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  var disclosures = Array.prototype.slice.call(
    document.querySelectorAll("[data-nav-group], [data-language-switcher]")
  );

  function syncDisclosureState(disclosure) {
    var disclosureTrigger = disclosure.querySelector("summary");
    if (disclosureTrigger) {
      disclosureTrigger.setAttribute("aria-expanded", String(disclosure.open));
    }
  }

  function setDisclosureOpen(disclosure, open) {
    if (open) {
      disclosure.setAttribute("open", "");
    } else {
      disclosure.removeAttribute("open");
    }
    syncDisclosureState(disclosure);
  }

  function closeDisclosureMenus(except) {
    disclosures.forEach(function (disclosure) {
      if (disclosure !== except) {
        setDisclosureOpen(disclosure, false);
      }
    });
  }

  disclosures.forEach(function (disclosure) {
    syncDisclosureState(disclosure);
    disclosure.addEventListener("toggle", function () {
      syncDisclosureState(disclosure);
      if (disclosure.open) {
        closeDisclosureMenus(disclosure);
      }
    });
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest("[data-nav-group], [data-language-switcher]")) {
      closeDisclosureMenus();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") {
      return;
    }

    var openDisclosure = document.querySelector(
      "[data-nav-group][open], [data-language-switcher][open]"
    );
    if (openDisclosure) {
      var disclosureTrigger = openDisclosure.querySelector("summary");
      setDisclosureOpen(openDisclosure, false);
      if (disclosureTrigger) {
        disclosureTrigger.focus();
      }
      return;
    }

    if (toggle && toggle.getAttribute("aria-expanded") === "true") {
      closeNavigation({ restoreFocus: true });
    }
  });

  Array.prototype.forEach.call(
    document.querySelectorAll("[data-print-document]"),
    function (button) {
      button.addEventListener("click", function () {
        window.print();
      });
    }
  );

  Array.prototype.forEach.call(document.querySelectorAll("[data-accordion]"), function (accordion) {
    accordion.addEventListener("toggle", function (event) {
      var opened = event.target;
      if (!opened.matches("[data-accordion-item]") || !opened.open) {
        return;
      }
      Array.prototype.forEach.call(
        accordion.querySelectorAll("[data-accordion-item][open]"),
        function (item) {
          if (item !== opened) {
            item.removeAttribute("open");
          }
        }
      );
    }, true);
  });

  var typingStatusByElement = new WeakMap();

  function updateTypingStatus(scope, announcement) {
    var status = scope ? scope.querySelector("[data-typewriter-status]") : null;
    if (!status || !announcement) {
      return;
    }
    var current = typingStatusByElement.get(status);
    if (current) {
      window.cancelAnimationFrame(current.frame);
    }
    var state = { frame: null };
    status.textContent = "";
    state.frame = window.requestAnimationFrame(function () {
      if (typingStatusByElement.get(status) === state && status.isConnected && !document.hidden) {
        status.textContent = announcement;
      }
      typingStatusByElement.delete(status);
    });
    typingStatusByElement.set(status, state);
  }

  function typingAnnouncement(title, body) {
    var normalizedTitle = String(title || "").trim();
    var normalizedBody = String(body || "").trim();
    if (!normalizedTitle) {
      return normalizedBody;
    }
    if (!normalizedBody) {
      return normalizedTitle;
    }
    var separator = /[.!?:;\u2026\u061f\u3002\uff01]$/u.test(normalizedTitle)
      ? " "
      : ". ";
    return normalizedTitle + separator + normalizedBody;
  }

  function presentTypedCopy(scope, target, text, announcement, animate, shouldAnnounce) {
    if (!target) {
      return;
    }
    var typing = window.AdvanexusTyping;
    var status = scope ? scope.querySelector("[data-typewriter-status]") : null;
    if (typing) {
      typing.finishWithin(scope);
      typing.reveal(target, {
        announce: shouldAnnounce,
        announcement: announcement,
        immediate: !animate,
        profile: "prose",
        status: status,
        text: text
      });
      return;
    }
    target.textContent = text;
    if (shouldAnnounce) {
      updateTypingStatus(scope, announcement);
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-visual-story]"), function (story) {
    var steps = Array.prototype.slice.call(story.querySelectorAll("[data-story-step]"));
    var panels = Array.prototype.slice.call(story.querySelectorAll("[data-story-panel]"));
    var singlePanel = story.querySelector("[data-story-single-panel]");
    var readout = story.querySelector(".visual-story__readout");
    var singlePanelTitle = singlePanel ? singlePanel.querySelector("[data-story-panel-title]") : null;
    var singlePanelBody = singlePanel ? singlePanel.querySelector("[data-story-panel-body]") : null;
    var revealedSteps = { 0: true };

    if (!singlePanel && panels.length > 1 && readout) {
      readout.setAttribute("data-story-overlay", "true");
    }

    function activateStoryStep(index, moveFocus, animateCopy) {
      if (!steps.length) {
        return;
      }
      var activeIndex = (index + steps.length) % steps.length;
      var previousIndex = story.dataset.activeStep === undefined
        ? -1
        : Number(story.dataset.activeStep);
      var selectionChanged = previousIndex !== activeIndex;
      var shouldAnimate = Boolean(
        animateCopy && selectionChanged && !revealedSteps[activeIndex]
      );
      if (animateCopy && selectionChanged) {
        revealedSteps[activeIndex] = true;
      }
      steps.forEach(function (step, stepIndex) {
        var active = stepIndex === activeIndex;
        step.classList.toggle("is-active", active);
        step.setAttribute("aria-pressed", String(active));
      });
      if (singlePanel) {
        var titleText = steps[activeIndex].dataset.storyTitle || "";
        var bodyText = steps[activeIndex].dataset.storyBody || "";
        if (singlePanelTitle) {
          singlePanelTitle.textContent = titleText;
        }
        if (singlePanelBody) {
          if (animateCopy && selectionChanged) {
            presentTypedCopy(
              story,
              singlePanelBody,
              bodyText,
              typingAnnouncement(titleText, bodyText),
              shouldAnimate,
              true
            );
          } else {
            singlePanelBody.textContent = bodyText;
          }
        }
      } else {
        panels.forEach(function (panel, panelIndex) {
          var active = panelIndex === activeIndex;
          panel.classList.toggle("is-active", active);
          panel.setAttribute("aria-hidden", String(!active));
          if (active) {
            panel.removeAttribute("inert");
          } else {
            panel.setAttribute("inert", "");
          }
        });
        if (animateCopy && selectionChanged && panels[activeIndex]) {
          var activeTitle = panels[activeIndex].querySelector("strong");
          var activeBody = panels[activeIndex].querySelector("[data-typewriter-copy]");
          if (activeBody) {
            var activeBodyText = activeBody.textContent;
            presentTypedCopy(
              story,
              activeBody,
              activeBodyText,
              typingAnnouncement(activeTitle ? activeTitle.textContent : "", activeBodyText),
              shouldAnimate,
              true
            );
          }
        }
      }
      story.dataset.activeStep = String(activeIndex);
      if (moveFocus) {
        steps[activeIndex].focus();
      }
    }

    steps.forEach(function (step, index) {
      step.addEventListener("click", function () {
        activateStoryStep(index, false, true);
      });
    });

    story.addEventListener("keydown", function (event) {
      var currentIndex = steps.indexOf(document.activeElement);
      if (currentIndex < 0) {
        return;
      }
      var nextIndex = null;
      if (event.key === "ArrowDown") {
        nextIndex = currentIndex + 1;
      } else if (event.key === "ArrowUp") {
        nextIndex = currentIndex - 1;
      } else if (event.key === "ArrowRight") {
        nextIndex = currentIndex + (isRtl ? -1 : 1);
      } else if (event.key === "ArrowLeft") {
        nextIndex = currentIndex + (isRtl ? 1 : -1);
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = steps.length - 1;
      }
      if (nextIndex !== null) {
        event.preventDefault();
        activateStoryStep(nextIndex, true, true);
      }
    });

    story.setAttribute("data-enhanced", "true");
    activateStoryStep(0, false, false);
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-pathway-tabs]"), function (workspace) {
    var tabs = Array.prototype.slice.call(workspace.querySelectorAll("[data-pathway-tab]"));
    var panels = Array.prototype.slice.call(workspace.querySelectorAll("[data-pathway-panel]"));
    var revealedTabs = { 0: true };

    function activateTab(index, moveFocus, animateCopy) {
      if (!tabs.length) {
        return;
      }
      var activeIndex = (index + tabs.length) % tabs.length;
      var previousIndex = workspace.dataset.activeTab === undefined
        ? -1
        : Number(workspace.dataset.activeTab);
      var selectionChanged = previousIndex !== activeIndex;
      var shouldAnimate = Boolean(
        animateCopy && selectionChanged && !revealedTabs[activeIndex]
      );
      if (animateCopy && selectionChanged) {
        revealedTabs[activeIndex] = true;
      }
      tabs.forEach(function (tab, tabIndex) {
        var active = tabIndex === activeIndex;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach(function (panel, panelIndex) {
        var active = panelIndex === activeIndex;
        panel.hidden = !active;
        panel.classList.toggle("is-active", active);
      });
      if (animateCopy && selectionChanged && panels[activeIndex]) {
        var activeHeading = panels[activeIndex].querySelector("h3");
        var activeCopy = panels[activeIndex].querySelector("[data-typewriter-copy]");
        if (activeCopy) {
          var copyText = activeCopy.textContent;
          presentTypedCopy(
            workspace,
            activeCopy,
            copyText,
            typingAnnouncement(activeHeading ? activeHeading.textContent : "", copyText),
            shouldAnimate,
            true
          );
        }
      }
      workspace.dataset.activeTab = String(activeIndex);
      if (moveFocus) {
        tabs[activeIndex].focus();
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activateTab(index, false, true);
      });
      tab.addEventListener("keydown", function (event) {
        var nextIndex = null;
        if (event.key === "ArrowDown") {
          nextIndex = index + 1;
        } else if (event.key === "ArrowUp") {
          nextIndex = index - 1;
        } else if (event.key === "ArrowRight") {
          nextIndex = index + (isRtl ? -1 : 1);
        } else if (event.key === "ArrowLeft") {
          nextIndex = index + (isRtl ? 1 : -1);
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = tabs.length - 1;
        }
        if (nextIndex !== null) {
          event.preventDefault();
          activateTab(nextIndex, true, true);
        }
      });
    });

    workspace.setAttribute("data-tabs-ready", "true");
    activateTab(0, false, false);
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-capability-ledger]"), function (ledger) {
    var filters = ledger.querySelector("[data-capability-filters]");
    var statusFilter = ledger.querySelector("[data-capability-status]");
    var ownerFilter = ledger.querySelector("[data-capability-owner]");
    var resetButton = ledger.querySelector("[data-capability-reset]");
    var count = ledger.querySelector("[data-capability-count]");
    var empty = ledger.querySelector("[data-capability-empty]");
    var rows = Array.prototype.slice.call(ledger.querySelectorAll("[data-capability-row]"));

    if (!filters || !statusFilter || !ownerFilter || !count || !empty || !rows.length) {
      return;
    }

    function normalized(value) {
      return String(value || "").trim().toLocaleLowerCase(document.documentElement.lang || undefined);
    }

    function applyCapabilityFilters() {
      var selectedStatus = normalized(statusFilter.value);
      var selectedOwner = normalized(ownerFilter.value);
      var visibleCount = 0;
      rows.forEach(function (row) {
        var statusMatches = !selectedStatus || normalized(row.dataset.status) === selectedStatus;
        var ownerMatches = !selectedOwner || normalized(row.dataset.owner) === selectedOwner;
        var visible = statusMatches && ownerMatches;
        row.hidden = !visible;
        if (visible) {
          visibleCount += 1;
        }
      });
      empty.hidden = visibleCount !== 0;
      count.textContent = count.dataset.countTemplate.replace("{count}", String(visibleCount));
    }

    filters.hidden = false;
    filters.addEventListener("change", applyCapabilityFilters);
    if (resetButton) {
      resetButton.addEventListener("click", function () {
        statusFilter.value = "";
        ownerFilter.value = "";
        applyCapabilityFilters();
      });
    }
    applyCapabilityFilters();
  });

  var revealSections = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reveal(section) {
    Array.prototype.forEach.call(section.querySelectorAll("[data-reveal-item]"), function (item, index) {
      item.style.setProperty("--reveal-delay", String(index * 55) + "ms");
    });
    section.setAttribute("data-revealed", "true");
  }

  if (revealSections.length) {
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      revealSections.forEach(reveal);
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
      revealSections.forEach(function (section) {
        revealObserver.observe(section);
      });
    }
  }
}());
