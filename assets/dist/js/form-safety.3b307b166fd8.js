(function formSafety(global) {
  "use strict";

  var POLICY_LOCAL = "local";
  var POLICY_SAME_ORIGIN_GET = "same-origin-get";

  function block(form, event, reason) {
    event.preventDefault();
    form.dataset.formSecurityState = "blocked";
    form.dataset.formSecurityReason = reason;
  }

  function actionFor(form, submitter) {
    var rawAction = submitter && submitter.hasAttribute("formaction")
      ? submitter.getAttribute("formaction")
      : form.getAttribute("action");
    rawAction = rawAction || global.location.href;
    return new URL(rawAction, global.location.href);
  }

  function methodFor(form, submitter) {
    var rawMethod = submitter && submitter.hasAttribute("formmethod")
      ? submitter.getAttribute("formmethod")
      : form.getAttribute("method");
    return String(rawMethod || "get").toLocaleLowerCase("en");
  }

  function protect(form) {
    if (form.dataset.formSecurityReady === "true") {
      return;
    }
    form.dataset.formSecurityReady = "true";

    form.addEventListener("submit", function (event) {
      var policy = String(form.dataset.formSecurity || "");
      var submitter = event.submitter || null;
      var method = methodFor(form, submitter);

      // Interactive-only forms must never navigate, even if their component
      // controller fails after this global guard has initialized.
      if (policy === POLICY_LOCAL) {
        event.preventDefault();
        form.dataset.formSecurityState = "local";
        return;
      }

      // The public site currently permits only bounded, same-origin GET forms.
      // A future POST must introduce its own server-side CSRF, validation,
      // authorization, rate-limit and audit contract before this allowlist is
      // expanded.
      if (policy !== POLICY_SAME_ORIGIN_GET || method !== "get") {
        block(form, event, "unsupported-contract");
        return;
      }

      var action;
      try {
        action = actionFor(form, submitter);
      } catch (_error) {
        block(form, event, "invalid-action");
        return;
      }

      if (
        action.origin !== global.location.origin ||
        action.protocol !== global.location.protocol ||
        action.username ||
        action.password
      ) {
        block(form, event, "cross-origin-action");
        return;
      }

      if (typeof form.checkValidity === "function" && !form.checkValidity()) {
        block(form, event, "invalid-fields");
        if (typeof form.reportValidity === "function") {
          form.reportValidity();
        }
        return;
      }

      form.dataset.formSecurityState = "validated";
      form.removeAttribute("data-form-security-reason");
    }, true);
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll("form"), protect);
  }

  global.AdvanexusFormSafety = Object.freeze({ protect: protect });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}(window));
