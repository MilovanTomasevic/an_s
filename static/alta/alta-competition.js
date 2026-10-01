/* Progressive enhancement for the ALTA market and competition appendix. */
(() => {
  "use strict";

  const dialog = document.getElementById("competition-dialog");
  const fallback = document.getElementById("competition-details");
  const content = dialog?.querySelector("[data-competition-content]");
  const closeButton = dialog?.querySelector("[data-close-competition]");
  const triggers = [...document.querySelectorAll("[data-open-competition]")];
  if (!dialog || !fallback || !content || !closeButton || !triggers.length) return;

  if (typeof dialog.showModal !== "function") {
    document.documentElement.classList.add("competition-unavailable");
    fallback.setAttribute("tabindex", "-1");
    triggers.forEach(trigger => trigger.addEventListener("click", () => {
      fallback.scrollIntoView({ block: "start" });
      fallback.focus({ preventScroll: true });
    }));
    return;
  }

  // Reuse the rendered appendix: moving it preserves IDs and their relationships.
  [...fallback.children].find(node => node.tagName === "H2")?.remove();
  fallback.setAttribute("aria-labelledby", "competition-title");
  content.replaceChildren(fallback);

  let opener;
  let pointerStartedOutside = false;
  const outsideDialog = event => {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom;
  };

  triggers.forEach(trigger => trigger.addEventListener("click", event => {
    event.preventDefault();
    if (document.querySelector("dialog[open]")) return;
    opener = trigger;
    pointerStartedOutside = false;
    dialog.showModal();
    dialog.scrollTop = 0;
    closeButton.focus({ preventScroll: true });
  }));
  closeButton.addEventListener("click", () => dialog.close());
  // Native Escape cancellation reaches the same close event and restores focus.
  dialog.addEventListener("close", () => {
    pointerStartedOutside = false;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });
  dialog.addEventListener("pointerdown", event => {
    pointerStartedOutside = event.target === dialog && outsideDialog(event);
  });
  dialog.addEventListener("click", event => {
    const onBackdrop = event.target === dialog && outsideDialog(event);
    if (onBackdrop && (pointerStartedOutside || !("PointerEvent" in window))) {
      dialog.close();
    }
    pointerStartedOutside = false;
  });
})();
