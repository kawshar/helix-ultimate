/* Generated from assets/ts/admin by scripts/build-admin.mjs. Edit the .ts source, not this file. */
"use strict";
(() => {
  // plugins/system/helixultimate/assets/ts/admin/typography.ts
  /**
   * @package Helix Ultimate Framework
   * @author JoomShaper https://www.joomshaper.com
   * @copyright Copyright (c) 2010 - 2025 JoomShaper
   * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
   */
  document.addEventListener("DOMContentLoaded", () => {
    const t = (key, fallback) => {
      const value = window.Joomla && Joomla.Text ? Joomla.Text._(key) : "";
      return value && value !== key ? value : fallback;
    };
    const fire = (element, type = "change") => element.dispatchEvent(new Event(type, { bubbles: true }));
    initTypographyCards();
    document.querySelectorAll("select.hu-webfont-list").forEach(
      (select) => Joomla.utils.searchSelect(select, {
        search: t("HELIX_ULTIMATE_FONT_SEARCH", "Search fonts"),
        empty: t("HELIX_ULTIMATE_FONT_NO_RESULTS", 'No fonts match "%s"')
      })
    );
    function initTypographyCards() {
      const panel = document.querySelector(".typography-panel");
      if (!panel) return;
      const wrappers = [...panel.querySelectorAll(".hu-typography-wrapper")];
      const cards = wrappers.flatMap((wrapper) => {
        const toggle = wrapper.querySelector('.hu-is-header input[type="checkbox"][name^="enable_"]');
        if (!toggle) return [];
        const key = toggle.name.replace(/^enable_/, "").replace(/_font$/, "");
        const labelEl = wrapper.querySelector(".hu-is-header .control-label");
        return [{ key, wrapper, toggle, label: labelEl ? (labelEl.textContent ?? "").trim() : key }];
      });
      if (!cards.length) return;
      const byKey = Object.fromEntries(cards.map((card) => [card.key, card]));
      const isOn = (key) => Boolean(byKey[key] && byKey[key].toggle.checked);
      const isHeading = (key) => /^h[2-6]$/.test(key);
      const inheritsFrom = (key) => {
        if (key === "body") return t("HELIX_ULTIMATE_TYPO_INHERITS_DEFAULT", "Uses the template default");
        if (key === "custom") return t("HELIX_ULTIMATE_TYPO_INHERITS_NONE", "Not applied");
        if (isHeading(key) && isOn("h1")) return t("HELIX_ULTIMATE_TYPO_INHERITS_H1", "Uses the Heading 1 font");
        if (isOn("body")) return t("HELIX_ULTIMATE_TYPO_INHERITS_BODY", "Uses the Body font");
        return t("HELIX_ULTIMATE_TYPO_INHERITS_DEFAULT", "Uses the template default");
      };
      const scopeHint = (key) => {
        if (key === "body") return t("HELIX_ULTIMATE_TYPO_HINT_BODY", "Applies to the whole site. Headings, menus and other text use it unless they have their own font.");
        if (key === "h1") return t("HELIX_ULTIMATE_TYPO_HINT_H1", "Also sets the font family of H2 to H6 that do not have their own font.");
        if (isHeading(key)) {
          return isOn("h1") ? t("HELIX_ULTIMATE_TYPO_HINT_HEADING_H1", "Replaces the Heading 1 font for this heading.") : t("HELIX_ULTIMATE_TYPO_HINT_HEADING_BODY", "Replaces the Body font for this heading.");
        }
        if (key === "navigation") return t("HELIX_ULTIMATE_TYPO_HINT_NAV", "Applies to menu links. Without it, menus use the Body font.");
        if (key === "custom") return t("HELIX_ULTIMATE_TYPO_HINT_CUSTOM", "Applies to the CSS selectors you list below.");
        return "";
      };
      const COLLAPSE_KEY = "helixUltimate.typography.collapsed";
      let collapsed = new Set(cards.filter((card) => card.key !== "body").map((card) => card.key));
      try {
        const stored = JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? "null");
        if (Array.isArray(stored)) collapsed = new Set(stored.map(String));
      } catch (e) {
      }
      const saveCollapsed = () => {
        try {
          localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...collapsed]));
        } catch (e) {
        }
      };
      const summaryText = (card) => {
        const input = card.wrapper.querySelector(".hu-webfont-input");
        let value = {};
        try {
          value = JSON.parse(input ? input.value : "{}") || {};
        } catch (e) {
          value = {};
        }
        return [value.fontFamily, value.fontSize, value.fontWeight].filter(Boolean).join(" · ");
      };
      const setCollapsed = (card, isCollapsed) => {
        card.wrapper.classList.toggle("is-collapsed", isCollapsed);
        card.collapseButton.setAttribute("aria-expanded", String(!isCollapsed));
        card.summary.textContent = summaryText(card);
        if (isCollapsed) collapsed.add(card.key);
        else collapsed.delete(card.key);
        saveCollapsed();
      };
      cards.forEach((card) => {
        const header = card.wrapper.querySelector(".hu-is-header");
        const controls = header.querySelector(".controls");
        card.wrapper.classList.add("hu-typo-card");
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "hu-typo-collapse";
        toggle.title = t("HELIX_ULTIMATE_TYPO_TOGGLE", "Show or hide settings");
        toggle.setAttribute("aria-label", `${toggle.title}: ${card.label}`);
        toggle.innerHTML = '<span class="fas fa-chevron-down" aria-hidden="true"></span>';
        controls.appendChild(toggle);
        card.collapseButton = toggle;
        header.addEventListener("click", (event) => {
          if (event.target instanceof Element && event.target.closest("input, select, textarea, a, button:not(.hu-typo-collapse)")) return;
          setCollapsed(card, !card.wrapper.classList.contains("is-collapsed"));
        });
        card.hint = document.createElement("p");
        card.hint.className = "hu-typo-hint";
        header.appendChild(card.hint);
        card.summary = document.createElement("p");
        card.summary.className = "hu-typo-summary";
        header.appendChild(card.summary);
        const footer = document.createElement("div");
        footer.className = "hu-typo-footer";
        footer.innerHTML = `<button type="button" class="hu-typo-remove"><span class="fas fa-trash-alt" aria-hidden="true"></span><span></span></button>`;
        const remove = footer.querySelector(".hu-typo-remove");
        remove.lastElementChild.textContent = t("HELIX_ULTIMATE_TYPO_REMOVE", "Remove font");
        remove.setAttribute("aria-label", `${t("HELIX_ULTIMATE_TYPO_REMOVE", "Remove font")}: ${card.label}`);
        remove.addEventListener("click", () => setEnabled(card, false));
        card.wrapper.appendChild(footer);
        card.wrapper.addEventListener(
          "change",
          () => requestAnimationFrame(() => {
            card.summary.textContent = summaryText(card);
          })
        );
        setCollapsed(card, collapsed.has(card.key));
      });
      const adder = document.createElement("section");
      adder.className = "hu-typo-add";
      adder.innerHTML = `<h4 class="hu-typo-add__title">${t("HELIX_ULTIMATE_TYPO_ADD_TITLE", "Add a font")}</h4><ul class="hu-typo-add__list"></ul>`;
      cards[cards.length - 1].wrapper.after(adder);
      const list = adder.querySelector(".hu-typo-add__list");
      cards.forEach((card) => {
        const item = document.createElement("li");
        item.innerHTML = `
				<button type="button" class="hu-typo-add__item">
					<span class="hu-typo-add__text">
						<span class="hu-typo-add__name"></span>
						<span class="hu-typo-add__inherit"></span>
					</span>
					<span class="hu-typo-add__icon fas fa-plus" aria-hidden="true"></span>
				</button>`;
        item.querySelector(".hu-typo-add__name").textContent = card.label;
        item.querySelector("button").addEventListener("click", () => setEnabled(card, true));
        card.addItem = item;
        list.appendChild(item);
      });
      function setEnabled(card, enabled) {
        if (card.toggle.checked === enabled) return;
        card.toggle.checked = enabled;
        fire(card.toggle);
        render();
        if (enabled) {
          setCollapsed(card, false);
          card.wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
          const focusable = card.wrapper.querySelector('.hu-font-picker__toggle, select, input:not([type="hidden"])');
          if (focusable) focusable.focus({ preventScroll: true });
        } else {
          const next = adder.querySelector(".hu-typo-add__item");
          if (next) next.focus({ preventScroll: true });
        }
      }
      function render() {
        let available = 0;
        cards.forEach((card) => {
          const on = card.toggle.checked;
          card.wrapper.hidden = !on;
          card.hint.textContent = scopeHint(card.key);
          card.hint.hidden = !card.hint.textContent;
          card.addItem.hidden = on;
          card.addItem.querySelector(".hu-typo-add__inherit").textContent = inheritsFrom(card.key);
          if (!on) available++;
        });
        adder.hidden = available === 0;
      }
      cards.forEach((card) => card.toggle.addEventListener("change", render));
      render();
    }
  });
})();
