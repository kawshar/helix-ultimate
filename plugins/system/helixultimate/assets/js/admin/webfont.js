/* Generated from assets/ts/admin by scripts/build-admin.mjs. Edit the .ts source, not this file. */
"use strict";
(() => {
  // plugins/system/helixultimate/assets/ts/admin/webfont.ts
  /**
   * @package Helix Ultimate Framework
   * @author JoomShaper https://www.joomshaper.com
   * @copyright Copyright (c) 2010 - 2025 JoomShaper
   * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
   */
  document.addEventListener("DOMContentLoaded", () => {
    const { fire, delegate, readData, request } = Joomla.utils;
    const SYSTEM_FONTS = ["Arial", "Tahoma", "Verdana", "Helvetica", "Times New Roman", "Trebuchet MS", "Georgia"];
    const FONT_WEIGHTS = "100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic";
    const fieldOf = (element) => element.closest(".hu-field-webfont");
    const valueOf = (field, selector) => {
      const element = field.querySelector(selector);
      return element ? element.value : "";
    };
    const loadGoogleFont = (family, subset = "") => {
      const url = `//fonts.googleapis.com/css?family=${family.replace(/ /g, "+")}:${FONT_WEIGHTS}${subset ? `&subset=${subset}` : ""}&display=swap`;
      if (document.querySelector(`link[href="${url}"]`)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    };
    const task = (action, data = {}) => {
      const params = new URLSearchParams({ action, option: "com_ajax", helix: "ultimate", request: "task", format: "json" });
      Object.entries(data).forEach(([key, value]) => params.append(`data[${key}]`, value));
      return request(window.location.href, { method: "POST", data: params });
    };
    const withUnit = (value) => {
      const text = String(value).replace(/\s+/, "");
      return /(em|rem|px|%|vw|vh)$/.test(text) ? text : `${text}px`;
    };
    function isLightColor(color) {
      const [r, g, b, a = 1] = (color.match(/[\d.]+/g) || []).map(Number);
      if (r === void 0 || a < 0.4) return false;
      const channel = (value) => {
        const c = value / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b) > 0.21;
    }
    function renderPreview(field) {
      if (!field) return;
      const preview = field.querySelector(".hu-webfont-preview");
      if (!preview) return;
      const activeUnit = field.querySelector(".hu-webfont-unit.active");
      const fontFamily = valueOf(field, ".hu-webfont-list");
      const fontWeight = valueOf(field, ".hu-webfont-weight-list");
      const fontSize = activeUnit ? valueOf(activeUnit, ".hu-unit-field-value") : "";
      const fontColor = valueOf(field, ".hu-font-color-input");
      const lineHeight = valueOf(field, ".hu-font-line-height-input");
      const spacing = valueOf(field, "[name=hu-font-letter-spacing-input]");
      const decoration = valueOf(field, "input.hu-text-decoration");
      const align = valueOf(field, "input.hu-text-align");
      if (fontFamily) preview.style.fontFamily = fontFamily;
      preview.style.fontWeight = fontWeight || "";
      preview.style.fontSize = fontSize ? withUnit(fontSize) : "";
      preview.style.color = fontColor || "";
      field.querySelector(".hu-webfont-preview-wrapper")?.classList.toggle("is-light-text", isLightColor(getComputedStyle(preview).color));
      preview.style.lineHeight = lineHeight || "";
      preview.style.letterSpacing = spacing ? withUnit(spacing) : "";
      if (decoration) preview.style.textDecoration = decoration;
      if (align) preview.style.textAlign = align;
    }
    document.querySelectorAll(".hu-field-webfont").forEach(renderPreview);
    delegate(document, "change", ".hu-webfont-list", async (event, select) => {
      const field = fieldOf(select);
      const subsets = field?.querySelector(".hu-webfont-subset-list");
      const fontName = select.value;
      renderPreview(field);
      if (SYSTEM_FONTS.includes(fontName)) {
        if (subsets) subsets.innerHTML = "";
        return;
      }
      loadGoogleFont(fontName);
      try {
        const font = await task("fontVariants", { fontName });
        if (subsets && font.subsets !== void 0) subsets.innerHTML = font.subsets;
      } catch (error) {
        console.error("Could not load the font subsets", error);
      }
    });
    delegate(
      document,
      "change",
      ".hu-webfont-unit .hu-unit-field-value, .hu-webfont-weight-list, .hu-webfont-style-list, .hu-font-line-height-input, [name=hu-font-letter-spacing-input]",
      (event, input) => renderPreview(fieldOf(input))
    );
    delegate(document, "input", ".hu-font-color-input", (event, input) => renderPreview(fieldOf(input)));
    delegate(document, "change", ".list-font-subset", (event, select) => {
      const field = fieldOf(select);
      if (field) loadGoogleFont(valueOf(field, ".hu-webfont-list"), select.value);
    });
    [
      [".hu-font-decoration", "input.hu-text-decoration"],
      [".hu-font-alignment", "input.hu-text-align"]
    ].forEach(([wrapper, inputSelector]) => {
      document.querySelectorAll(`${wrapper} .hu-action-group .hu-switcher-action`).forEach((action) => {
        action.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          [...action.parentElement?.children ?? []].forEach((sibling) => sibling.classList.remove("active"));
          action.classList.add("active");
          const input = action.closest(wrapper)?.querySelector(inputSelector);
          if (input) {
            input.value = readData(action, "value");
            fire(input);
          }
          renderPreview(fieldOf(action));
        });
      });
    });
    delegate(document, "click", "#update_fonts", async (event, button) => {
      event.preventDefault();
      const own = button.querySelector(".hu-icon");
      const icon = document.createElement("span");
      icon.className = "hu-btn-spinner";
      icon.innerHTML = Joomla.utils.icon("spinner", { className: "hu-spin", size: 14 });
      const showMessage = (html) => {
        button.insertAdjacentHTML("afterend", html);
        const message = button.nextElementSibling;
        setTimeout(() => message && message.remove(), 2300);
      };
      if (own) own.classList.add("hu-spin");
      else button.prepend(icon);
      try {
        const data = await task("update-font-list");
        showMessage(
          data.status ? data.message ?? "" : "<p class='font-update-failed'>Unexpected error occurs. Please make sure that, you have inserted Google Font API key.</p>"
        );
      } catch (error) {
        showMessage("<p class='font-update-failed'>Unexpected error occurs. Please try again.</p>");
      }
      own?.classList.remove("hu-spin");
      icon.remove();
    });
  });
})();
