/* Generated from assets/ts/admin by scripts/build-admin.mjs. Edit the .ts source, not this file. */
"use strict";
(() => {
  // plugins/system/helixultimate/assets/ts/admin/toaster.ts
  /**
   * @package Helix Ultimate Framework
   * @author JoomShaper https://www.joomshaper.com
   * @copyright Copyright (c) 2010 - 2025 JoomShaper
   * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
   */
  var MAX_TOASTS = 3;
  var svg = (paths) => `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
  var ICONS = {
    success: svg('<circle cx="8" cy="8" r="6.25"/><path d="M5.5 8.25l1.75 1.75 3.25-3.75"/>'),
    error: svg('<circle cx="8" cy="8" r="6.25"/><path d="M8 4.75v3.75M8 11h.01"/>'),
    warning: svg('<path d="M8 2.75l5.75 10H2.25z"/><path d="M8 6.75v2.75M8 11.25h.01"/>'),
    info: svg('<circle cx="8" cy="8" r="6.25"/><path d="M8 7.25V11M8 5h.01"/>')
  };
  var CLOSE_ICON = svg('<path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/>');
  var HelixToaster = {
    options: {
      timeout: 4e3,
      containerId: "hu-toaster-container",
      prefix: "hu-toaster",
      position: "hu-toaster-bottom-right",
      titleClass: "",
      messageClass: "",
      target: "body"
    },
    toasts: [],
    success(message, title, options) {
      this.createToaster({ type: "success", message, title, options });
    },
    error(message, title, options) {
      this.createToaster({ type: "error", message, title, options });
    },
    info(message, title, options) {
      this.createToaster({ type: "info", message, title, options });
    },
    warning(message, title, options) {
      this.createToaster({ type: "warning", message, title, options });
    },
    getTypeClass(type) {
      return `hu-toast-${type}`;
    },
    createContainer() {
      const container = document.createElement("div");
      container.setAttribute("id", this.options.containerId);
      container.setAttribute("class", this.options.position);
      document.querySelector(this.options.target)?.appendChild(container);
      return container;
    },
    getContainer() {
      return document.querySelector(`#${this.options.containerId}`) ?? this.createContainer();
    },
    createToaster({ type, message, title, options }) {
      const key = `${type}|${title ?? ""}|${message ?? ""}`;
      const timeout = options?.timeout ?? (type === "error" ? this.options.timeout * 2 : this.options.timeout);
      const existing = this.toasts.find((toast2) => toast2.key === key);
      if (existing) {
        existing.element.classList.remove("is-bumped");
        void existing.element.offsetWidth;
        existing.element.classList.add("is-bumped");
        this.startTimer(existing);
        return;
      }
      const element = document.createElement("div");
      element.className = `${this.options.prefix} ${this.getTypeClass(type)}`;
      element.setAttribute("role", type === "error" ? "alert" : "status");
      element.innerHTML = `
			<span class="hu-toaster-icon">${ICONS[type] ?? ICONS.info}</span>
			<span class="hu-toaster-wrap">
				<span class="${this.options.prefix}-title ${this.options.titleClass}"></span>
				<span class="${this.options.prefix}-message ${this.options.messageClass}"></span>
			</span>
			<button type="button" class="hu-toaster-close" aria-label="Close">${CLOSE_ICON}</button>`;
      const titleElement = element.querySelector(`.${this.options.prefix}-title`);
      const messageElement = element.querySelector(`.${this.options.prefix}-message`);
      const generic = ["success", "error", "saved", "updated"].includes((title ?? "").trim().toLowerCase());
      const showTitle = Boolean(title) && !generic && type !== "success" && !(message ?? "").toLowerCase().startsWith((title ?? "").toLowerCase());
      titleElement.textContent = showTitle ? title : "";
      titleElement.hidden = !showTitle;
      messageElement.textContent = message ?? "";
      const toast = { element, key, timer: null, timeout };
      this.toasts.push(toast);
      this.getContainer().appendChild(element);
      while (this.toasts.length > MAX_TOASTS) this.dismiss(this.toasts[0]);
      element.querySelector(".hu-toaster-close").addEventListener("click", () => this.dismiss(toast));
      element.addEventListener("mouseenter", () => toast.timer && clearTimeout(toast.timer));
      element.addEventListener("mouseleave", () => this.startTimer(toast));
      this.startTimer(toast);
    },
    startTimer(toast) {
      if (toast.timer) clearTimeout(toast.timer);
      toast.timer = setTimeout(() => this.dismiss(toast), toast.timeout);
    },
    dismiss(toast) {
      const index = this.toasts.indexOf(toast);
      if (index === -1) return;
      this.toasts.splice(index, 1);
      if (toast.timer) clearTimeout(toast.timer);
      toast.element.classList.add("is-leaving");
      setTimeout(() => toast.element.remove(), 200);
    },
    /** Close every toast. */
    clear() {
      [...this.toasts].forEach((toast) => this.dismiss(toast));
    }
  };
  Joomla.HelixToaster = HelixToaster;
  Object.assign(window, { HelixToaster });
})();
