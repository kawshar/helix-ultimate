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
        card.sample = header.querySelector(".control-label") || header;
        card.sample.classList.add("hu-typo-sample");
        tagFieldLayout(card);
        const footer = document.createElement("div");
        footer.className = "hu-typo-footer";
        footer.innerHTML = `<button type="button" class="hu-typo-remove"><span class="fas fa-trash-alt" aria-hidden="true"></span><span></span></button>`;
        const remove = footer.querySelector(".hu-typo-remove");
        remove.lastElementChild.textContent = t("HELIX_ULTIMATE_TYPO_REMOVE", "Remove font");
        remove.setAttribute("aria-label", `${t("HELIX_ULTIMATE_TYPO_REMOVE", "Remove font")}: ${card.label}`);
        remove.addEventListener("click", () => setEnabled(card, false));
        card.wrapper.appendChild(footer);
        const refreshSummary = () => requestAnimationFrame(() => {
          card.summary.textContent = summaryText(card);
          syncSample(card);
        });
        card.wrapper.addEventListener("change", refreshSummary);
        card.wrapper.addEventListener("input", refreshSummary);
        card.wrapper.addEventListener("click", (event) => {
          if (event.target instanceof Element && event.target.closest(".hu-switcher-action")) refreshSummary();
        });
        refreshSummary();
        setCollapsed(card, collapsed.has(card.key));
      });
      const adder = document.createElement("section");
      const menuId = "hu-typo-add-menu";
      adder.className = "hu-typo-add";
      adder.innerHTML = `
			<button type="button" class="hu-typo-add__toggle" aria-haspopup="menu" aria-expanded="false" aria-controls="${menuId}">
				<span class="fas fa-plus" aria-hidden="true"></span>
				<span>${t("HELIX_ULTIMATE_TYPO_ADD_TITLE", "Add a font")}</span>
			</button>
			<ul class="hu-typo-add__list" id="${menuId}" role="menu" hidden></ul>`;
      cards[cards.length - 1].wrapper.after(adder);
      const addToggle = adder.querySelector(".hu-typo-add__toggle");
      const list = adder.querySelector(".hu-typo-add__list");
      list.setAttribute("aria-label", addToggle.textContent.trim());
      cards.forEach((card) => {
        const item = document.createElement("li");
        item.setAttribute("role", "none");
        item.innerHTML = `
				<button type="button" class="hu-typo-add__item" role="menuitem" tabindex="-1">
					<span class="hu-typo-add__name"></span>
					<span class="hu-typo-add__inherit"></span>
				</button>`;
        item.querySelector(".hu-typo-add__name").textContent = card.label;
        item.querySelector("button").addEventListener("click", () => {
          setAddMenu(false);
          setEnabled(card, true);
        });
        card.addItem = item;
        list.appendChild(item);
      });
      const menuItems = () => [...list.querySelectorAll("li:not([hidden]) > .hu-typo-add__item")];
      function setAddMenu(open, focus = null) {
        list.hidden = !open;
        addToggle.setAttribute("aria-expanded", String(open));
        adder.classList.toggle("is-open", open);
        if (open) {
          const scroller = adder.closest(".hu-groups-container") || document.documentElement;
          const room = scroller.getBoundingClientRect().bottom - addToggle.getBoundingClientRect().bottom;
          adder.classList.toggle("is-up", room < list.offsetHeight + 8);
        }
        if (focus === "toggle") addToggle.focus();
        else if (focus) {
          const items = menuItems();
          items[focus === "first" ? 0 : items.length - 1]?.focus();
        }
      }
      addToggle.addEventListener("click", () => setAddMenu(list.hidden, list.hidden ? "first" : null));
      addToggle.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          setAddMenu(true, event.key === "ArrowDown" ? "first" : "last");
        }
      });
      list.addEventListener("keydown", (event) => {
        const items = menuItems();
        const index = items.indexOf(document.activeElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
        } else if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          items[event.key === "Home" ? 0 : items.length - 1]?.focus();
        } else if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setAddMenu(false, "toggle");
        } else if (event.key === "Tab") {
          setAddMenu(false);
        }
      });
      document.addEventListener("click", (event) => {
        if (!list.hidden && event.target instanceof Node && !adder.contains(event.target)) setAddMenu(false);
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
          addToggle.focus({ preventScroll: true });
        }
      }
      function render() {
        let available = 0;
        cards.forEach((card) => {
          const on = card.toggle.checked;
          card.wrapper.hidden = !on;
          card.hint.textContent = scopeHint(card.key);
          card.hint.hidden = !card.hint.textContent;
          card.collapseButton.closest(".hu-is-header").title = card.hint.textContent;
          card.collapseButton.setAttribute("aria-description", card.hint.textContent);
          card.addItem.hidden = on;
          card.addItem.querySelector(".hu-typo-add__inherit").textContent = inheritsFrom(card.key);
          if (!on) available++;
        });
        adder.hidden = available === 0;
        if (!available) setAddMenu(false);
      }
      cards.forEach((card) => card.toggle.addEventListener("change", render));
      render();
      initDefaultValues(cards);
    }
    function syncSample(card) {
      const preview = card.wrapper.querySelector(".hu-webfont-preview");
      if (!preview || !card.sample) return;
      ["fontFamily", "fontWeight", "fontStyle"].forEach((property) => {
        card.sample.style.setProperty(property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), preview.style.getPropertyValue(property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)));
      });
    }
    function tagFieldLayout(card) {
      const field = card.wrapper.querySelector(".hu-field-webfont");
      if (!field) return;
      const mark = (element, ...classes) => element?.classList.add(...classes);
      mark(field, "hu-typo-fields");
      mark(field.querySelector(".hu-webfont-family"), "hu-typo-row", "hu-typo-family");
      const subset = field.querySelector(".hu-webfont-subset-list");
      const family = field.querySelector(".hu-webfont-family");
      const subsetColumn = subset?.parentElement;
      if (subset && family && subsetColumn && subsetColumn !== family) {
        const label = subsetColumn.querySelector("label")?.textContent?.trim();
        if (label) subset.setAttribute("aria-label", label);
        subset.classList.add("hu-typo-subset-select");
        family.appendChild(subset);
        subsetColumn.classList.add("hu-typo-subset-moved");
      }
      mark(field.querySelector(".hu-font-color"), "hu-typo-row", "hu-typo-color");
      mark(field.querySelector(".hu-webfont-weight"), "hu-typo-inline", "hu-typo-weight");
      mark(field.querySelector(".hu-webfont-size"), "hu-typo-inline", "hu-typo-size");
      mark(field.querySelector(".hu-font-line-height"), "hu-typo-inline", "hu-typo-line");
      mark(field.querySelector(".hu-font-letter-spacing"), "hu-typo-inline", "hu-typo-spacing");
      mark(field.querySelector(".hu-font-alignment"), "hu-typo-toggles", "hu-typo-align");
      mark(field.querySelector(".hu-font-decoration"), "hu-typo-toggles", "hu-typo-decoration");
      const weight = field.querySelector(".hu-webfont-weight-list");
      if (weight) buildWeightDropdown(weight);
    }
    let weightMenu = null;
    let weightMenuSelect = null;
    function weightToggleOf(select) {
      return select.parentElement?.querySelector(".hu-weight-toggle") ?? null;
    }
    function weightText(value) {
      return value.replace(/^(\d+)(\D+)$/, "$1 $2");
    }
    function buildWeightDropdown(select) {
      if (select.dataset.huWeight) return;
      select.dataset.huWeight = "1";
      select.classList.add("hu-weight-native");
      select.tabIndex = -1;
      select.setAttribute("aria-hidden", "true");
      const label = select.parentElement?.querySelector("label")?.textContent?.trim() || "Weight";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "hu-weight-toggle";
      toggle.setAttribute("aria-haspopup", "listbox");
      toggle.setAttribute("aria-expanded", "false");
      toggle.dataset.label = label;
      select.after(toggle);
      toggle.addEventListener("click", () => weightMenuSelect === select ? closeWeightMenu(true) : openWeightMenu(select));
      toggle.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          openWeightMenu(select);
        }
      });
      select.addEventListener("change", () => syncWeight(select));
      syncWeight(select);
    }
    function syncWeight(select) {
      const toggle = weightToggleOf(select);
      if (!toggle) return;
      const value = select.value;
      const fallback = select.dataset.huDefault || "";
      const shown = value || fallback;
      toggle.textContent = shown ? weightText(shown) : "–";
      toggle.classList.toggle("is-default", !value);
      toggle.setAttribute("aria-label", `${toggle.dataset.label}, ${value ? weightText(value) : t("HELIX_ULTIMATE_FONT_DEFAULT_VALUE", "%s (default)").replace("%s", fallback || "–")}`);
    }
    function closeWeightMenu(focusToggle = false) {
      if (!weightMenu) return;
      const toggle = weightMenuSelect && weightToggleOf(weightMenuSelect);
      weightMenu.remove();
      weightMenu = null;
      weightMenuSelect = null;
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        if (focusToggle) toggle.focus();
      }
    }
    function openWeightMenu(select) {
      closeWeightMenu();
      const toggle = weightToggleOf(select);
      if (!toggle) return;
      const fallback = select.dataset.huDefault || "";
      const menu = document.createElement("ul");
      menu.className = "hu-unit-menu hu-weight-menu";
      menu.setAttribute("role", "listbox");
      menu.setAttribute("aria-label", toggle.dataset.label || "Weight");
      [...select.options].forEach((option) => {
        const item = document.createElement("li");
        item.setAttribute("role", "option");
        item.tabIndex = -1;
        item.dataset.value = option.value;
        item.setAttribute("aria-selected", String(option.value === select.value));
        item.textContent = option.value ? weightText(option.value) : t("HELIX_ULTIMATE_FONT_DEFAULT_VALUE", "%s (default)").replace("%s", fallback || "–");
        if (!option.value) item.classList.add("is-default-option");
        if (/^\d+$/.test(option.value)) item.style.fontWeight = option.value;
        menu.appendChild(item);
      });
      document.body.appendChild(menu);
      weightMenu = menu;
      weightMenuSelect = select;
      toggle.setAttribute("aria-expanded", "true");
      const rect = toggle.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom;
      const height = menu.offsetHeight;
      menu.style.top = `${below > height + 8 ? rect.bottom + 4 : Math.max(8, rect.top - height - 4)}px`;
      menu.style.left = `${Math.max(8, rect.right - menu.offsetWidth)}px`;
      (menu.querySelector('[aria-selected="true"]') || menu.firstElementChild)?.focus();
    }
    function chooseWeight(value) {
      const select = weightMenuSelect;
      closeWeightMenu(true);
      if (!select || select.value === value) return;
      select.value = value;
      fire(select);
    }
    document.addEventListener("click", (event) => {
      if (!weightMenu || !(event.target instanceof Element)) return;
      const item = event.target.closest('.hu-weight-menu [role="option"]');
      if (item) {
        chooseWeight(item.dataset.value ?? "");
        return;
      }
      if (!event.target.closest(".hu-weight-menu, .hu-weight-toggle")) closeWeightMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (!weightMenu || !weightMenu.contains(document.activeElement)) return;
      const items = [...weightMenu.children];
      const index = items.indexOf(document.activeElement);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        items[event.key === "Home" ? 0 : items.length - 1].focus();
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        chooseWeight(items[index]?.dataset.value ?? "");
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeWeightMenu(true);
      } else if (event.key === "Tab") {
        closeWeightMenu();
      }
    });
    document.addEventListener("scroll", () => closeWeightMenu(), true);
    window.addEventListener("resize", () => closeWeightMenu());
    function selectorFor(key) {
      if (key === "body" || /^h[1-6]$/.test(key)) return key;
      if (key === "navigation") return ".sp-megamenu-parent > li > a, .menu.nav-pills > li > a";
      if (key === "custom") return document.querySelector('[name="custom_font_selectors"]')?.value.trim() ?? "";
      return "";
    }
    function toHex(color) {
      const [r, g, b, a = 1] = (color.match(/[\d.]+/g) || []).map(Number);
      if (r === void 0 || a === 0) return "";
      const hex = [r, g, b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("");
      return `#${hex}${a < 1 ? Math.round(a * 255).toString(16).padStart(2, "0") : ""}`.toUpperCase();
    }
    function round(value, places = 2) {
      return String(Number(value.toFixed(places)));
    }
    function readDefaults(key) {
      const frame = document.getElementById("hu-template-preview");
      let doc = null;
      try {
        doc = frame?.contentDocument ?? null;
      } catch (e) {
        return null;
      }
      const win = doc?.defaultView;
      const selector = selectorFor(key);
      if (!doc || !win || !doc.body || !selector) return null;
      let element = null;
      try {
        element = doc.querySelector(selector);
      } catch (e) {
        return null;
      }
      let probe = null;
      if (!element && /^h[1-6]$/.test(key)) {
        probe = doc.createElement(key);
        probe.textContent = "Aa";
        probe.setAttribute("aria-hidden", "true");
        probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;left:-9999px;top:0;";
        doc.body.appendChild(probe);
        element = probe;
      }
      if (!element) return null;
      const style = win.getComputedStyle(element);
      const fontSize = parseFloat(style.fontSize) || 0;
      const lineHeight = parseFloat(style.lineHeight);
      const spacing = parseFloat(style.letterSpacing);
      const defaults = {
        size: fontSize ? round(fontSize, 1) : "",
        weight: style.fontWeight || "",
        lineHeight: Number.isFinite(lineHeight) && fontSize ? round(lineHeight / fontSize) : "",
        spacing: Number.isFinite(spacing) ? round(spacing, 2) : "0",
        color: toHex(style.color)
      };
      probe?.remove();
      return defaults;
    }
    function sizeFieldForPreview(card) {
      const frame = document.getElementById("hu-template-preview");
      let width = 0;
      try {
        width = frame?.contentWindow?.innerWidth ?? 0;
      } catch (e) {
        return null;
      }
      if (!width) return null;
      const suffix = width >= 992 ? "" : width >= 768 ? "-sm" : "-xs";
      return card.wrapper.querySelector(`.hu-webfont-size input.hu-unit-field-value[name="hu-webfont-size-field${suffix}"]`)?.closest(".hu-unit-group")?.querySelector("input.hu-unit-field-input") ?? null;
    }
    function applyDefaults(card) {
      var _a;
      if (card.wrapper.hidden) return;
      const defaults = readDefaults(card.key);
      const field = card.wrapper.querySelector(".hu-field-webfont");
      if (!field) return;
      field.querySelectorAll(".hu-webfont-size input.hu-unit-field-input").forEach((input) => setDefault(input, ""));
      const size = sizeFieldForPreview(card);
      if (size) setDefault(size, defaults?.size ?? "");
      const lineHeight = field.querySelector(".hu-font-line-height-input");
      if (lineHeight) setDefault(lineHeight, defaults?.lineHeight ?? "");
      const spacing = field.querySelector(".hu-font-letter-spacing input.hu-unit-field-input");
      if (spacing) setDefault(spacing, defaults?.spacing ?? "");
      const weight = field.querySelector(".hu-webfont-weight-list");
      if (weight) {
        if (defaults?.weight) weight.dataset.huDefault = defaults.weight;
        else delete weight.dataset.huDefault;
        syncWeight(weight);
      }
      const color = field.querySelector(".hu-font-color-input");
      const swatch = color?.closest(".clr-field");
      if (color) {
        (_a = color.dataset).placeholder ?? (_a.placeholder = color.placeholder);
        setDefault(color, defaults?.color ?? "", color.dataset.placeholder || "");
      }
      if (swatch) {
        if (defaults?.color) swatch.style.setProperty("--hu-default-color", defaults.color);
        else swatch.style.removeProperty("--hu-default-color");
      }
    }
    function setDefault(input, value, fallback = "") {
      input.placeholder = value || fallback;
      if (value) input.dataset.huDefault = value;
      else delete input.dataset.huDefault;
      syncHint(input);
    }
    const DEFAULT_FIELDS = ".hu-field-webfont :is(input.hu-unit-field-input, .hu-font-line-height-input, .hu-font-color-input)";
    function syncHint(input) {
      const holder = input.closest(".hu-unit-group, .clr-field") ?? input.parentElement;
      if (!holder) return;
      const show = document.activeElement === input && input.value === "" && Boolean(input.dataset.huDefault);
      holder.classList.toggle("has-default-hint", show);
      if (show) {
        const full = input.dataset.huPointer ? t("HELIX_ULTIMATE_FONT_USE_DEFAULT_TAB", "→ or Tab to use") : t("HELIX_ULTIMATE_FONT_USE_DEFAULT", "→ to use");
        holder.dataset.hint = input.dataset.huPointer ? "→ Tab" : "→";
        input.title = full;
        input.setAttribute("aria-description", full);
      } else if (input.hasAttribute("aria-description")) {
        input.removeAttribute("title");
        input.removeAttribute("aria-description");
      }
    }
    function acceptDefault(input) {
      const value = input.dataset.huDefault;
      if (!value || input.value !== "") return false;
      input.value = value;
      if (input.classList.contains("hu-unit-field-input")) {
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
      } else {
        fire(input, "input");
        fire(input, "change");
      }
      syncHint(input);
      return true;
    }
    const isDefaultField = (target) => target instanceof HTMLInputElement && target.matches(DEFAULT_FIELDS);
    ["pointerdown", "mousedown"].forEach(
      (type) => document.addEventListener(type, (event) => {
        if (!isDefaultField(event.target)) return;
        event.target.dataset.huPointer = "1";
        requestAnimationFrame(() => isDefaultField(event.target) && syncHint(event.target));
      })
    );
    document.addEventListener("focusin", (event) => {
      if (isDefaultField(event.target)) syncHint(event.target);
    });
    document.addEventListener("focusout", (event) => {
      if (!isDefaultField(event.target)) return;
      delete event.target.dataset.huPointer;
      syncHint(event.target);
    });
    document.addEventListener("input", (event) => {
      if (isDefaultField(event.target)) syncHint(event.target);
    });
    document.addEventListener(
      "keydown",
      (event) => {
        const input = event.target;
        if (!isDefaultField(input) || event.altKey || event.ctrlKey || event.metaKey) return;
        const accept = event.key === "ArrowRight" && !event.shiftKey || event.key === "Tab" && !event.shiftKey && Boolean(input.dataset.huPointer);
        if (accept && acceptDefault(input)) {
          event.preventDefault();
          delete input.dataset.huPointer;
          event.stopPropagation();
        }
      },
      true
    );
    function initDefaultValues(cards) {
      const frame = document.getElementById("hu-template-preview");
      const refresh = () => cards.forEach((card) => {
        try {
          applyDefaults(card);
        } catch (error) {
          console.warn("Helix: could not read font defaults", error);
        }
      });
      const refreshSoon = Joomla.utils.debounce(refresh, 150);
      refresh();
      frame?.addEventListener("load", () => {
        refresh();
        try {
          frame.contentWindow?.addEventListener("resize", refreshSoon);
        } catch (e) {
        }
      });
      try {
        frame?.contentWindow?.addEventListener("resize", refreshSoon);
      } catch (e) {
      }
      cards.forEach((card) => {
        card.toggle.addEventListener("change", () => requestAnimationFrame(refresh));
      });
      document.querySelector('[name="custom_font_selectors"]')?.addEventListener("change", refreshSoon);
      document.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest(".hu-device, [data-device]")) refreshSoon();
      });
    }
  });
})();
