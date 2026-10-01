(function () {
  "use strict";
  var STEP = 2.4;
  var DWELL = .8;
  function cycleFor(total) { return (total + 1) * STEP; }

  // Measure the existing CSS route rather than assuming fixed translated card heights.
  function journeyFrames(nodes, mobile, rtl, radius) {
    var CYCLE = cycleFor(nodes.length);
    var frames = [];
    function add(x, y, seconds) {
      frames.push({ transform: "translate(" + x + "px, " + y + "px)", offset: seconds / CYCLE });
    }
    nodes.forEach(function (node, i) {
      add(node.x, node.y, i * STEP);
      if (i === nodes.length - 1) return;
      add(node.x, node.y, i * STEP + DWELL);
      var next = nodes[i + 1];
      if (mobile || next.y === node.y || (i !== 2 && i !== 5)) return;
      var direction = (i === 2 ? 1 : -1) * (rtl ? -1 : 1);
      var edge = direction > 0 ? node.right : node.left;
      // Rounded quarter-turns join the horizontal lines to each row's outer edge.
      var points = [{ x: edge, y: node.y }];
      for (var k = 1; k <= 32; k += 1) {
        var angle = k * Math.PI / 64;
        points.push({ x: edge + direction * radius * Math.sin(angle), y: node.y + radius * (1 - Math.cos(angle)) });
      }
      points.push({ x: edge + direction * radius, y: next.y - radius });
      for (var j = 1; j <= 32; j += 1) {
        var turn = j * Math.PI / 64;
        points.push({ x: edge + direction * radius * Math.cos(turn), y: next.y - radius + radius * Math.sin(turn) });
      }
      // Time by distance, not sample count: no speed jump when entering a curve.
      var previous = node;
      var distance = 0;
      points.forEach(function (point) {
        distance += Math.hypot(point.x - previous.x, point.y - previous.y);
        point.distance = distance;
        previous = point;
      });
      distance += Math.hypot(next.x - previous.x, next.y - previous.y);
      points.forEach(function (point) {
        add(point.x, point.y, i * STEP + DWELL + (STEP - DWELL) * point.distance / distance);
      });
    });
    if (nodes.length) add(nodes[nodes.length - 1].x, nodes[nodes.length - 1].y, CYCLE);
    return frames;
  }

  function stepFrames(index, total, surface, active) {
    var CYCLE = cycleFor(total);
    var arrival = index * STEP;
    var departure = index === total - 1 ? CYCLE : arrival + DWELL;
    var frames = [];
    if (index) {
      frames.push({ background: surface, offset: 0 });
      frames.push({ background: surface, offset: (arrival - .12) / CYCLE });
    }
    frames.push({ background: active, offset: arrival / CYCLE });
    frames.push({ background: active, offset: departure / CYCLE });
    if (departure < CYCLE) {
      frames.push({ background: surface, offset: (departure + .12) / CYCLE });
      frames.push({ background: surface, offset: 1 });
    }
    return frames;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { journeyFrames: journeyFrames, stepFrames: stepFrames };
  if (typeof document === "undefined") return;
  var section = document.querySelector(".delivery-journey--animated");
  if (!section || !Element.prototype.animate || !window.ResizeObserver) return;
  var route = section.querySelector(".delivery-journey__route");
  var cards = Array.from(route.children);
  if (cards.length < 3) return;
  var marker = document.createElement("span");
  marker.className = "delivery-journey__traveller";
  marker.setAttribute("aria-hidden", "true");
  marker.hidden = true;
  // Keep the ordered list's children as list items.
  section.querySelector(".shell").appendChild(marker);
  var animations = [];
  var inView = false;
  var pending;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var forced = window.matchMedia("(forced-colors: active)");

  function playState() {
    var paused = !inView || document.hidden || reduced.matches || forced.matches;
    section.classList.toggle("delivery-journey--paused", paused);
    marker.hidden = reduced.matches || forced.matches;
    var elapsed = animations.length ? animations[0].currentTime || 0 : 0;
    var clock = document.timeline.currentTime;
    animations.forEach(function (item) {
      if (paused) { item.pause(); item.currentTime = elapsed; }
      else { item.play(); item.startTime = clock - elapsed; }
    });
  }
  function measure() {
    pending = null;
    animations.forEach(function (item) { item.cancel(); });
    animations = [];
    if (reduced.matches || forced.matches) { playState(); return; }
    marker.hidden = false;
    var base = marker.offsetParent.getBoundingClientRect();
    var mobile = getComputedStyle(route).display !== "grid";
    var line = getComputedStyle(cards[0], "::before");
    var halfStroke = parseFloat(mobile ? line.borderInlineStartWidth : line.borderBlockStartWidth) / 2;
    var nodes = cards.map(function (card) {
      var bounds = card.getBoundingClientRect();
      var circle = card.querySelector(".delivery-journey__number").getBoundingClientRect();
      return { x: circle.left + circle.width / 2 + (mobile ? halfStroke : 0) - base.left, y: circle.top + circle.height / 2 + (mobile ? 0 : halfStroke) - base.top, left: bounds.left - base.left, right: bounds.right - base.left };
    });
    var rtl = getComputedStyle(route).direction === "rtl";
    var radius = parseFloat(getComputedStyle(cards[2], "::after").width) - halfStroke;
    var timing = { duration: cycleFor(cards.length) * 1000, iterations: Infinity, easing: "linear" };
    animations.push(marker.animate(journeyFrames(nodes, mobile, rtl, radius), timing));
    var palette = getComputedStyle(section);
    cards.forEach(function (card, index) {
      animations.push(card.querySelector(".delivery-journey__number").animate(
        stepFrames(index, cards.length, palette.getPropertyValue("--brand-surface").trim(), palette.getPropertyValue("--brand-teal").trim()), timing));
    });
    animations.forEach(function (item) { item.pause(); item.currentTime = 0; });
    playState();
  }
  function schedule() { if (!pending) pending = requestAnimationFrame(measure); }
  new ResizeObserver(schedule).observe(route);
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; playState(); }).observe(section);
  } else { inView = true; }
  document.addEventListener("visibilitychange", playState);
  reduced.addEventListener("change", schedule);
  forced.addEventListener("change", schedule);
  schedule();
}());
