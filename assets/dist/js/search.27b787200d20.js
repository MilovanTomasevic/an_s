(function () {
  "use strict";

  var form = document.querySelector("[data-search-form]");
  var input = document.querySelector("[data-search-input]");
  var results = document.querySelector("[data-search-results]");
  var status = document.querySelector("[data-search-status]");
  var empty = document.querySelector("[data-search-empty]");
  var internalResultsRegion = document.querySelector("[data-search-internal-results]");
  var modeTabs = Array.prototype.slice.call(
    document.querySelectorAll("[data-search-mode-tab]")
  );
  var modePanels = Array.prototype.slice.call(
    document.querySelectorAll("[data-search-mode-panel]")
  );
  var externalForm = document.querySelector("[data-external-search-form]");
  var externalInput = document.querySelector("[data-external-search-input]");
  var externalLink = document.querySelector("[data-external-search-link]");

  if (!form || !input || !results || !status || !empty) {
    return;
  }

  var pageLocale = String(form.dataset.searchLocale || "");
  var resultLocale = String(results.dataset.searchLocale || "");
  if (!pageLocale || pageLocale !== resultLocale) {
    return;
  }

  var allRecords = Array.prototype.slice.call(results.querySelectorAll("[data-search-item]"));
  var records = allRecords.filter(function (record) {
    var inCurrentLocale = record.dataset.searchLocale === pageLocale;
    if (!inCurrentLocale) {
      record.hidden = true;
    }
    return inCurrentLocale;
  });
  var language = document.documentElement.lang || undefined;
  var MAX_QUERY_CHARACTERS = 160;
  var MAX_QUERY_TERMS = 12;
  var CJK_PATTERN = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/u;
  var GOOGLE_SEARCH_URL = "https://www.google.com/search";
  var GOOGLE_SITE_DOMAIN = "advanexus.com";

  function boundedQuery(value) {
    return String(value || "")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .slice(0, MAX_QUERY_CHARACTERS);
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase(language)
      .replace(/æ/g, "ae")
      .replace(/œ/g, "oe")
      .replace(/ø/g, "o")
      .replace(/ß/g, "ss")
      .replace(/đ|ð/g, "d")
      .replace(/ł/g, "l")
      .replace(/ĳ/g, "ij")
      .trim();
  }

  function tokenize(value) {
    // Keep combining marks attached to their base letters. Splitting on marks
    // breaks words written with Devanagari matras/virama and weakens search in
    // other scripts that use combining characters.
    return normalize(value).split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
  }

  function differsByAtMostOne(left, right) {
    if (Math.abs(left.length - right.length) > 1) {
      return false;
    }
    var leftIndex = 0;
    var rightIndex = 0;
    var edits = 0;
    while (leftIndex < left.length && rightIndex < right.length) {
      if (left[leftIndex] === right[rightIndex]) {
        leftIndex += 1;
        rightIndex += 1;
        continue;
      }
      edits += 1;
      if (edits > 1) {
        return false;
      }
      if (left.length > right.length) {
        leftIndex += 1;
      } else if (right.length > left.length) {
        rightIndex += 1;
      } else {
        leftIndex += 1;
        rightIndex += 1;
      }
    }
    return edits + (leftIndex < left.length || rightIndex < right.length ? 1 : 0) <= 1;
  }

  function tokenAffinity(queryToken, candidateToken) {
    if (queryToken === candidateToken) {
      return 1;
    }
    if (queryToken.length < 4 || candidateToken.length < 4) {
      return 0;
    }
    if (differsByAtMostOne(queryToken, candidateToken)) {
      return 0.82;
    }
    var limit = Math.min(queryToken.length, candidateToken.length);
    var prefixLength = 0;
    while (
      prefixLength < limit &&
      queryToken[prefixLength] === candidateToken[prefixLength]
    ) {
      prefixLength += 1;
    }
    if (prefixLength >= 4 && Math.abs(queryToken.length - candidateToken.length) <= 3) {
      return 0.72;
    }
    return 0;
  }

  function bestTokenAffinity(queryToken, candidateTokens) {
    return candidateTokens.reduce(function (best, candidateToken) {
      return Math.max(best, tokenAffinity(queryToken, candidateToken));
    }, 0);
  }

  function directFieldAffinity(queryToken, fieldValue) {
    if (fieldValue === queryToken) {
      return 1;
    }
    if (fieldValue.indexOf(queryToken) === -1) {
      return 0;
    }
    if (queryToken.length >= 4 || CJK_PATTERN.test(queryToken)) {
      return 0.9;
    }
    return 0;
  }

  function visibleRecordText(record, selector, fallback) {
    var node = record.querySelector ? record.querySelector(selector) : null;
    return node ? node.textContent : fallback;
  }

  var rankedRecords = records.map(function (record, index) {
    var fields = {
      title: normalize(
        visibleRecordText(record, "[data-search-title]", record.dataset.searchTitle)
      ),
      heading: normalize(record.dataset.searchHeading),
      summary: normalize(
        visibleRecordText(record, "[data-search-summary]", record.dataset.searchSummary)
      ),
      category: normalize(record.dataset.searchCategory),
      keywords: normalize(record.dataset.searchKeywords),
      pageId: normalize(record.dataset.searchPageId),
      text: normalize(record.dataset.searchText)
    };
    return {
      record: record,
      originalIndex: index,
      fields: fields,
      tokens: {
        title: tokenize(fields.title),
        heading: tokenize(fields.heading),
        summary: tokenize(fields.summary),
        category: tokenize(fields.category),
        keywords: tokenize(fields.keywords),
        pageId: tokenize(fields.pageId),
        text: tokenize(fields.text)
      }
    };
  });

  function scoreRecord(row, query, terms) {
    var score = 0;
    if (row.fields.title === query || row.fields.heading === query) {
      score += 1000;
    } else {
      if (row.fields.title.startsWith(query)) {
        score += 650;
      } else if (row.fields.title.indexOf(query) !== -1) {
        score += 450;
      }
      if (row.fields.heading.startsWith(query)) {
        score += 550;
      } else if (row.fields.heading.indexOf(query) !== -1) {
        score += 350;
      }
    }
    if (row.fields.summary.indexOf(query) !== -1) {
      score += 140;
    }
    if (row.fields.category.indexOf(query) !== -1) {
      score += 180;
    }
    if (row.fields.keywords.indexOf(query) !== -1) {
      score += 160;
    }

    var weights = {
      title: 190,
      heading: 175,
      pageId: 150,
      category: 115,
      keywords: 100,
      summary: 75,
      text: 20
    };
    var matchedTerms = 0;
    terms.forEach(function (term) {
      var best = 0;
      Object.keys(weights).forEach(function (field) {
        best = Math.max(
          best,
          directFieldAffinity(term, row.fields[field]) * weights[field],
          bestTokenAffinity(term, row.tokens[field]) * weights[field]
        );
      });
      if (best > 0) {
        matchedTerms += 1;
        score += best;
      }
    });
    if (matchedTerms === 0) {
      return 0;
    }
    score *= matchedTerms / terms.length;
    if (matchedTerms === terms.length) {
      score += 250;
    }
    return score;
  }

  function placeRecord(record, position) {
    var indicator = record.querySelector
      ? record.querySelector("[data-search-position]")
      : null;
    if (indicator) {
      indicator.textContent = String(position + 1).padStart(2, "0");
    }
    results.append(record);
  }

  function render(query, updateAddress) {
    var safeQuery = boundedQuery(query);
    var normalizedQuery = normalize(safeQuery);
    var terms = tokenize(normalizedQuery).slice(0, MAX_QUERY_TERMS);
    var matches = [];

    if (terms.length === 0) {
      rankedRecords.forEach(function (row, index) {
        row.record.hidden = false;
        placeRecord(row.record, index);
      });
    } else {
      rankedRecords.forEach(function (row) {
        var score = scoreRecord(row, normalizedQuery, terms);
        row.record.hidden = score <= 0;
        if (score > 0) {
          matches.push({ row: row, score: score });
        }
      });
      matches.sort(function (left, right) {
        return right.score - left.score || left.row.originalIndex - right.row.originalIndex;
      });
      matches.forEach(function (match, index) {
        placeRecord(match.row.record, index);
      });
    }

    var count = terms.length === 0 ? rankedRecords.length : matches.length;

    empty.hidden = count !== 0;
    status.textContent = terms.length === 0
      ? results.dataset.allResults
      : results.dataset.resultCount.replace("{count}", String(count));

    if (updateAddress && window.history && window.history.replaceState) {
      var url = new URL(window.location.href);
      if (safeQuery.trim()) {
        url.searchParams.set("q", safeQuery.trim());
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState({}, "", url.toString());
    }
  }

  function externalSearchUrl(query) {
    var safeQuery = boundedQuery(query).trim();
    var url = new URL(GOOGLE_SEARCH_URL);
    var googleHl = String(externalForm && externalForm.dataset.externalGoogleHl || "");
    var googleLr = String(externalForm && externalForm.dataset.externalGoogleLr || "");
    // The query and domain constraint use separate Google Advanced Search
    // fields so user-supplied parentheses/operators cannot broaden scope.
    url.searchParams.set("as_sitesearch", GOOGLE_SITE_DOMAIN);
    if (/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(googleHl)) {
      url.searchParams.set("hl", googleHl);
    }
    if (/^lang_[A-Za-z]{2,3}(?:-[A-Z]{2})?$/.test(googleLr)) {
      url.searchParams.set("lr", googleLr);
    }
    if (safeQuery) {
      url.searchParams.set("as_q", safeQuery);
    }
    return url.toString();
  }

  function updateExternalLink() {
    if (!externalInput || !externalLink) {
      return;
    }
    var safeQuery = boundedQuery(externalInput.value);
    if (externalInput.value !== safeQuery) {
      externalInput.value = safeQuery;
    }
    externalLink.href = externalSearchUrl(safeQuery);
  }

  function activateMode(mode, focusTab) {
    if (!modeTabs.length || !modePanels.length) {
      return;
    }
    var selected = mode === "external" ? "external" : "internal";
    modeTabs.forEach(function (tab) {
      var active = tab.dataset.searchModeTab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focusTab) {
        tab.focus();
      }
    });
    modePanels.forEach(function (panel) {
      panel.hidden = panel.dataset.searchModePanel !== selected;
    });
    if (internalResultsRegion) {
      internalResultsRegion.hidden = selected !== "internal";
    }
    if (selected === "external" && externalInput) {
      externalInput.value = boundedQuery(input.value);
      updateExternalLink();
    } else if (selected === "internal" && externalInput) {
      input.value = boundedQuery(externalInput.value);
      render(input.value, true);
    }
  }

  var initialQuery = boundedQuery(
    new URL(window.location.href).searchParams.get("q") || ""
  );
  input.value = initialQuery;
  if (externalInput) {
    externalInput.value = initialQuery;
    updateExternalLink();
  }
  render(initialQuery, false);

  if (window.location.hash === "#site-search-query") {
    window.requestAnimationFrame(function () {
      input.focus();
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    render(input.value, true);
  });

  input.addEventListener("input", function () {
    var safeQuery = boundedQuery(input.value);
    if (input.value !== safeQuery) {
      input.value = safeQuery;
    }
    if (externalInput) {
      externalInput.value = safeQuery;
      updateExternalLink();
    }
    render(safeQuery, true);
  });

  if (externalInput) {
    externalInput.addEventListener("input", updateExternalLink);
    externalInput.addEventListener("keydown", function (event) {
      if (
        event.key === "Enter" &&
        !event.isComposing &&
        externalLink
      ) {
        event.preventDefault();
        updateExternalLink();
        externalLink.click();
      }
    });
  }

  if (externalForm && externalLink) {
    externalForm.addEventListener("submit", function (event) {
      event.preventDefault();
      updateExternalLink();
      externalLink.click();
    });
  }

  modeTabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      activateMode(tab.dataset.searchModeTab, true);
    });
    tab.addEventListener("keydown", function (event) {
      var delta = 0;
      if (event.key === "ArrowRight") {
        delta = document.documentElement.dir === "rtl" ? -1 : 1;
      } else if (event.key === "ArrowLeft") {
        delta = document.documentElement.dir === "rtl" ? 1 : -1;
      } else if (event.key === "Home") {
        delta = -index;
      } else if (event.key === "End") {
        delta = modeTabs.length - index - 1;
      } else {
        return;
      }
      event.preventDefault();
      var nextIndex = (index + delta + modeTabs.length) % modeTabs.length;
      activateMode(modeTabs[nextIndex].dataset.searchModeTab, true);
    });
  });

  window.addEventListener("popstate", function () {
    var query = boundedQuery(
      new URL(window.location.href).searchParams.get("q") || ""
    );
    input.value = query;
    if (externalInput) {
      externalInput.value = query;
      updateExternalLink();
    }
    render(query, false);
  });
}());
