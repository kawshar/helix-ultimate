/* Generated from assets/ts/admin by scripts/build-admin.mjs. Edit the .ts source, not this file. */
"use strict";
(() => {
  // plugins/system/helixultimate/assets/ts/admin/modal.ts
  /**
   * @package Helix Ultimate Framework
   * @author JoomShaper https://www.joomshaper.com
   * @copyright Copyright (c) 2010 - 2025 JoomShaper
   * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
   */
  var escapeAttr = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  var removeModals = (selector = ".hu-modal-overlay, .hu-modal") => {
    document.querySelectorAll(selector).forEach((element) => element.remove());
  };
  var append = (html) => {
    document.body.insertAdjacentHTML("beforeend", html);
  };
  var closeButton = (className) => `<a href="#" class="${className}"><span class="fas fa-times" aria-hidden="true"></span></a>`;
  function close() {
    removeModals();
    document.body.classList.remove("hu-modal-open");
  }
  function megamenu(options = {}) {
    const { title = "Mega Menu", className = "", targetType = "id", target = "", body = "" } = options;
    removeModals();
    append(`
		<div class="hu-modal-overlay"></div>
		<div class="hu-modal ${escapeAttr(className)}" data-target_type="${escapeAttr(targetType)}" data-target="${escapeAttr(target)}">
			<div class="hu-modal-header">
				<h4 class="hu-modal-header-title">${title}</h4>
				${closeButton("action-hu-modal-close")}
			</div>
			<div class="hu-modal-inner">
				<div class="hu-modal-content">
					${body ? `<div class="hu-modal-megamenu-container">${body}</div>` : ""}
				</div>
			</div>
			<div class="hu-modal-footer footer-right">
				<button class="hu-btn hu-btn-link hu-megamenu-cancel-btn">Cancel</button>
				<button class="hu-btn hu-btn-primary hu-megamenu-save-btn">Save</button>
			</div>
		</div>`);
    document.body.classList.add("hu-modal-open");
  }
  function frame(options = {}) {
    const { title = "Helix Ultimate", className = "", targetType = "", target = "", frameUrl = "" } = options;
    removeModals();
    append(`
		<div class="hu-modal-overlay"></div>
		<div class="hu-modal ${escapeAttr(className)}" data-target_type="${escapeAttr(targetType)}" data-target="${escapeAttr(target)}">
			<div class="hu-modal-header">
				<h4 class="hu-modal-header-title">${title}</h4>
				${closeButton("action-hu-modal-close")}
			</div>
			<div class="hu-modal-inner">
				<div class="hu-modal-content">
					${frameUrl ? `<div class="hu-modal-frame-container"><iframe src="${escapeAttr(frameUrl)}" width="100%" height="100%"></iframe></div>` : ""}
				</div>
			</div>
			<div class="hu-modal-footer footer-right">
				<button class="hu-btn hu-btn-link hu-cancel-btn">Cancel</button>
				<button class="hu-btn hu-btn-primary hu-save-btn">
					<div class="hu-spinner hidden spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>
					Save
				</button>
			</div>
		</div>`);
    document.body.classList.add("hu-modal-open");
  }
  function media(options = {}) {
    const { target_type = "", target = "" } = options;
    removeModals();
    append(`
		<div class="hu-modal-overlay"></div>
		<div class="hu-modal" data-target_type="${escapeAttr(target_type)}" data-target="${escapeAttr(target)}">
			<div class="hu-modal-header">
				<input type="file" id="hu-file-input" accept="image/png, image/jpg, image/jpeg, image/webp, image/gif" style="display:none;" multiple>
				<div class="hu-modal-breadcrumbs"></div>
				<div class="hu-modal-actions-left">
					<a href="#" class="hu-btn hu-btn-primary hu-modal-action-select hu-mr-2"><span class="fas fa-check" aria-hidden="true"></span> Select</a>
					<a href="#" class="hu-btn hu-btn-secondary hu-modal-action-cancel hu-mr-2"><span class="fas fa-times" aria-hidden="true"></span> Cancel</a>
					<a href="#" class="hu-btn hu-btn-danger hu-btn-last hu-modal-action-delete"><span class="fas fa-minus-circle" aria-hidden="true"></span> Delete</a>
				</div>
				<div class="hu-modal-actions-right">
					<a href="#" class="hu-btn hu-btn-primary hu-modal-action-upload hu-mr-2"><span class="fas fa-upload" aria-hidden="true"></span> Upload</a>
					<a href="#" class="hu-btn hu-btn-secondary hu-btn-last hu-modal-action-new-folder"><span class="fas fa-plus" aria-hidden="true"></span> New Folder</a>
					${closeButton("action-hu-modal-close")}
				</div>
			</div>
			<div class="hu-modal-inner">
				<div class="hu-modal-preloader"><span class="fas fa-circle-notch fa-pulse fa-spin fa-3x fa-fw" aria-hidden="true"></span></div>
			</div>
		</div>`);
    document.body.classList.add("hu-modal-open");
  }
  function settings(options = {}) {
    const {
      target = "",
      title = "Options",
      flag = "",
      class: className = "",
      applyBtnClass = "hu-settings-apply",
      footerButtons = []
    } = options;
    removeModals(".hu-options-modal-overlay, .hu-options-modal");
    append(`
		<div class="hu-options-modal-overlay"></div>
		<div class="hu-options-modal ${escapeAttr(className)}" data-target="#${escapeAttr(target)}">
			<div class="hu-options-modal-header">
				<span class="hu-options-modal-header-title">${title}</span>
				${closeButton("action-hu-options-modal-close")}
			</div>
			<div class="hu-options-modal-inner">
				<div class="hu-options-modal-content"></div>
			</div>
			<div class="hu-options-modal-footer">
				<a href="#" class="hu-btn hu-btn-primary ${escapeAttr(applyBtnClass)}" data-flag="${escapeAttr(flag)}"><span class="fas fa-check"></span> Apply</a>
				${footerButtons.join("")}
			</div>
		</div>`);
    document.body.classList.add("hu-options-modal-open");
  }
  var BACK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  var stacks = /* @__PURE__ */ new WeakMap();
  var reducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var layerBelow = (host, stack) => stack.length > 1 ? stack[stack.length - 2].element : host.querySelector(":scope > .hu-groups-container");
  function applyWidth(host, stack) {
    const width = Math.max(0, ...stack.map((step) => step.width ?? 0));
    if (width) {
      host.style.setProperty("--hu-panel-width", `min(${width}px, calc(100vw - var(--hu-sidebar-width, 48px) - 24px))`);
      host.classList.add("is-wide");
    } else {
      host.style.removeProperty("--hu-panel-width");
      host.classList.remove("is-wide");
    }
  }
  function openSubpanel({ host, title, body, footer, backLabel = "Back", onClose, width, className, headerActions }) {
    const stack = stacks.get(host) ?? [];
    stacks.set(host, stack);
    const header = host.querySelector(":scope > .hu-panel-header");
    const element = document.createElement("section");
    element.className = `hu-subpanel${className ? ` ${className}` : ""}`;
    element.setAttribute("role", "region");
    element.setAttribute("aria-label", title);
    element.style.top = `${header ? header.offsetHeight : 0}px`;
    element.innerHTML = `
		<div class="hu-subpanel-header">
			<button type="button" class="hu-subpanel-back" aria-label="${escapeAttr(backLabel)}" title="${escapeAttr(backLabel)}">${BACK_ICON}</button>
			<h3 class="hu-subpanel-title"></h3>
			${headerActions ? `<div class="hu-subpanel-actions">${headerActions}</div>` : ""}
		</div>
		<div class="hu-subpanel-body"></div>
		${footer ? `<div class="hu-subpanel-footer">${footer}</div>` : ""}`;
    element.querySelector(".hu-subpanel-title").textContent = title;
    const bodyElement = element.querySelector(".hu-subpanel-body");
    bodyElement.appendChild(body);
    let closed = false;
    const subpanel = {
      element,
      header: element.querySelector(".hu-subpanel-header"),
      width,
      body: bodyElement,
      footer: element.querySelector(".hu-subpanel-footer"),
      close() {
        if (closed) return;
        closed = true;
        while (stack.length && stack[stack.length - 1] !== subpanel) {
          stack[stack.length - 1].close();
        }
        const index = stack.indexOf(subpanel);
        if (index > -1) stack.splice(index, 1);
        const below2 = index > 0 ? stack[index - 1].element : host.querySelector(":scope > .hu-groups-container");
        below2?.classList.remove("is-behind");
        below2?.removeAttribute("inert");
        element.classList.remove("is-active");
        element.setAttribute("inert", "");
        const remove = () => element.remove();
        if (reducedMotion() || !host.classList.contains("active-panel")) {
          remove();
        } else {
          element.addEventListener("transitionend", remove, { once: true });
          setTimeout(remove, 400);
        }
        if (!stack.length) host.classList.remove("has-subpanel");
        applyWidth(host, stack);
        onClose?.();
        if (index > 0) stack[index - 1].element.querySelector(".hu-subpanel-back")?.focus({ preventScroll: true });
      }
    };
    stack.push(subpanel);
    host.classList.add("has-subpanel");
    host.appendChild(element);
    applyWidth(host, stack);
    const below = layerBelow(host, stack);
    below?.classList.add("is-behind");
    below?.setAttribute("inert", "");
    element.querySelector(".hu-subpanel-back").addEventListener("click", () => subpanel.close());
    requestAnimationFrame(() => {
      element.classList.add("is-active");
      element.querySelector(".hu-subpanel-back")?.focus({ preventScroll: true });
    });
    watchHost(host);
    return subpanel;
  }
  function closeSubpanels(host) {
    const stack = stacks.get(host);
    if (stack && stack.length) stack[0].close();
  }
  var watched = /* @__PURE__ */ new WeakSet();
  function watchHost(host) {
    if (watched.has(host)) return;
    watched.add(host);
    new MutationObserver(() => {
      if (!host.classList.contains("active-panel")) closeSubpanels(host);
    }).observe(host, { attributes: true, attributeFilter: ["class"] });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || document.body.classList.contains("hu-modal-open") || document.body.classList.contains("hu-options-modal-open")) return;
    if (document.querySelector(".hu-unit-menu, .clr-picker.clr-open")) return;
    const host = document.querySelector(".hu-edit-panel.active-panel.has-subpanel");
    const stack = host ? stacks.get(host) : void 0;
    if (stack && stack.length) {
      event.preventDefault();
      stack[stack.length - 1].close();
    }
  });
  document.addEventListener("click", (event) => {
    const icon = event.target instanceof Element ? event.target.closest(".hu-subpanel .hu-help-icon") : null;
    if (!icon) return;
    event.preventDefault();
    const group = icon.closest(".control-group");
    const help = group?.querySelector(".hu-control-help");
    icon.classList.toggle("active");
    if (help) {
      const opening = !help.classList.contains("show");
      help.classList.toggle("show", opening);
      help.style.display = opening ? "block" : "none";
    }
  });
  var helixSubpanel = { open: openSubpanel, closeAll: closeSubpanels };
  Joomla.helixSubpanel = helixSubpanel;
  var helixModal = { close, megamenu, frame, media, settings };
  Joomla.helixModal = helixModal;
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("hu-modal-open")) {
      close();
    }
  });
})();
