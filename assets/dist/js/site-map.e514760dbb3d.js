(function () {
  "use strict";

  Array.prototype.forEach.call(document.querySelectorAll("[data-site-map]"), function (map) {
    var groups = Array.prototype.slice.call(map.querySelectorAll("[data-site-map-group]"));
    if (!groups.length) {
      return;
    }

    function setActiveGroup(group) {
      groups.forEach(function (candidate) {
        candidate.toggleAttribute("data-active", candidate === group);
      });
    }

    function retainKeyboardGroup() {
      var focusedGroup = document.activeElement && document.activeElement.closest("[data-site-map-group]");
      setActiveGroup(focusedGroup && map.contains(focusedGroup) ? focusedGroup : null);
    }

    groups.forEach(function (group) {
      group.addEventListener("pointerenter", function () {
        setActiveGroup(group);
      });
      group.addEventListener("pointerleave", retainKeyboardGroup);
      group.addEventListener("focusin", function () {
        setActiveGroup(group);
      });
      group.addEventListener("focusout", function () {
        window.requestAnimationFrame(retainKeyboardGroup);
      });
    });

    map.setAttribute("data-enhanced", "true");
  });
}());
