/* Generated from assets/ts/admin by scripts/build-admin.mjs. Edit the .ts source, not this file. */
"use strict";
(() => {
  // plugins/system/helixultimate/assets/ts/admin/fields.ts
  /**
   * @package Helix Ultimate Framework
   * @author JoomShaper https://www.joomshaper.com
   * @copyright Copyright (c) 2010 - 2025 JoomShaper
   * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
   */
  document.addEventListener("DOMContentLoaded", () => {
    const { fire, delegate, readData } = Joomla.utils;
    document.querySelectorAll(".hu-field-alignment .hu-switcher-action").forEach((action) => {
      action.addEventListener("click", (event) => {
        event.preventDefault();
        [...action.parentElement?.children ?? []].forEach((sibling) => sibling.classList.remove("active"));
        action.classList.add("active");
        const input = action.closest(".hu-field-alignment")?.querySelector("input[type=hidden]");
        if (input) {
          input.value = readData(action, "value");
          fire(input);
        }
      });
    });
    const hierarchyInput = (element) => element.closest(".hu-menu-hierarchy-container").querySelector("input[type=hidden]");
    delegate(document, "change", ".hu-menu-hierarchy-container .hu-menu-item-selector.select-all", (event, selectAll) => {
      const list = selectAll.closest(".hu-menu-hierarchy-list");
      const value = [];
      list.querySelectorAll(".hu-menu-hierarchy-item:not(.level-0) input[type=checkbox]").forEach((checkbox) => {
        checkbox.checked = selectAll.checked;
        if (selectAll.checked && !value.includes(checkbox.value)) {
          value.push(checkbox.value);
        }
      });
      const input = hierarchyInput(selectAll);
      input.value = JSON.stringify(value);
      fire(input);
    });
    delegate(document, "change", ".hu-menu-hierarchy-container .hu-menu-item-selector:not(.level-0)", (event, checkbox) => {
      const input = hierarchyInput(checkbox);
      const selectAll = checkbox.closest(".hu-menu-hierarchy-list").querySelector("input[type=checkbox].select-all");
      const elements = readData(selectAll, "elements") || [];
      let value = input.value.length && JSON.parse(input.value) || [];
      if (checkbox.checked) {
        if (!value.includes(checkbox.value)) value.push(checkbox.value);
      } else {
        value = value.filter((item) => item !== checkbox.value);
      }
      selectAll.checked = value.length === elements.length;
      input.value = JSON.stringify(value);
      fire(input);
    });
    function linkedoptions(target, context) {
      const conditions = readData(target, "revealon") || [];
      let showfield = true;
      conditions.forEach((condition, j) => {
        const fields = context.querySelectorAll(`[name="${condition.field}"], [name="${condition.field}[]"]`);
        condition.valid = 0;
        fields.forEach((field) => {
          let values;
          if (["checkbox", "radio"].includes(field.type)) {
            values = [String(Number(field.checked))];
          } else if (field instanceof HTMLSelectElement && field.multiple) {
            values = [...field.selectedOptions].map((option) => option.value);
          } else {
            values = [field.value];
          }
          values.forEach((value) => {
            if (condition.sign === "=" && condition.values.includes(value)) condition.valid = 1;
            if (condition.sign === "!=" && !condition.values.includes(value)) condition.valid = 1;
          });
        });
        const previous = conditions[j - 1]?.valid ?? 0;
        if (condition.op === "") {
          if (condition.valid === 0) showfield = false;
        } else if (condition.op === "AND" && condition.valid + previous < 2) {
          showfield = false;
          condition.valid = 0;
        } else if (condition.op === "OR" && condition.valid + previous > 0) {
          showfield = true;
          condition.valid = 1;
        }
      });
      if (target instanceof HTMLOptionElement) {
        target.hidden = !showfield;
        target.disabled = !showfield;
        return;
      }
      target.style.display = showfield ? "" : "none";
    }
    Joomla.setUpShowon = function(container) {
      const root = container || document;
      root.querySelectorAll("[data-revealon]").forEach((target) => {
        const conditions = readData(target, "revealon") || [];
        linkedoptions(target, root);
        conditions.forEach((condition) => {
          document.querySelectorAll(`[name="${condition.field}"], [name="${condition.field}[]"]`).forEach((field) => {
            ["change", "keyup"].forEach((type) => field.addEventListener(type, () => linkedoptions(target, root)));
          });
        });
      });
    };
    const unitText = (key, fallback) => {
      const value = Joomla.Text ? Joomla.Text._(key) : "";
      return value && value !== key ? value : fallback;
    };
    const groupParts = (group) => ({
      hidden: group.querySelector("input.hu-unit-field-value"),
      input: group.querySelector("input.hu-unit-field-input"),
      pill: group.querySelector(".hu-unit-pill"),
      units: (group.dataset.units || "px,rem,em,%,vw,vh").split(",").filter(Boolean),
      keywords: (group.dataset.keywords || "").split(",").filter(Boolean)
    });
    function parseUnit(text, { units, keywords }, fallbackUnit = "px") {
      const value = String(text ?? "").trim().toLowerCase().replace(/\s+/g, "");
      if (value === "") return { number: "", unit: "" };
      if (keywords.includes(value)) return { number: "", unit: value };
      const match = value.match(/^([+-]?(?:\d+|\d*\.\d+))([a-z%]*)$/);
      if (!match) return null;
      const unit = match[2] || fallbackUnit;
      return units.includes(unit) ? { number: String(Number(match[1])), unit } : null;
    }
    function previewMetrics() {
      const frame = document.getElementById("hu-template-preview");
      let root = 16;
      let width = window.innerWidth;
      let height = window.innerHeight;
      try {
        const win = frame && frame.contentWindow;
        if (win && win.document.documentElement) {
          root = parseFloat(win.getComputedStyle(win.document.documentElement).fontSize) || 16;
          width = win.innerWidth || width;
          height = win.innerHeight || height;
        }
      } catch (e) {
      }
      return { root, width, height };
    }
    const roundFor = (value, unit) => {
      const places = unit === "px" ? 0 : unit === "rem" || unit === "em" ? 3 : 2;
      return String(Number(value.toFixed(places)));
    };
    function convertUnit(number, from, to) {
      if (number === "" || from === to) return number;
      const { root, width, height } = previewMetrics();
      const toPx = { px: 1, rem: root, em: root, vw: width / 100, vh: height / 100 };
      if (!(from in toPx) || !(to in toPx)) return number;
      return roundFor(parseFloat(number) * toPx[from] / toPx[to], to);
    }
    function renderUnit(group) {
      const parts = groupParts(group);
      const parsed = parseUnit(parts.hidden.value, parts) || { number: "", unit: "" };
      const unit = parsed.unit || group.dataset.unit || "px";
      group.dataset.unit = unit;
      if (document.activeElement !== parts.input || parts.input.value !== parsed.number) {
        parts.input.value = parsed.number;
      }
      parts.pill.textContent = unit;
      parts.pill.dataset.unit = unit;
      parts.pill.setAttribute("aria-label", unitText("HELIX_ULTIMATE_UNIT_ARIA", "Unit, %s").replace("%s", unit));
      group.classList.toggle("is-default-unit", unit === "px");
      group.classList.toggle("is-keyword", parts.keywords.includes(unit));
    }
    function commitUnit(group, number, unit) {
      const { hidden, keywords } = groupParts(group);
      const value = keywords.includes(unit) ? unit : number === "" ? "" : `${number}${unit}`;
      group.dataset.unit = unit;
      if (hidden.value !== value) {
        hidden.value = value;
        fire(hidden);
      }
      renderUnit(group);
    }
    function typingUnit(group, parts) {
      const current = group.dataset.unit || "px";
      return parts.keywords.includes(current) ? "px" : current;
    }
    function applyTypedUnit(group) {
      const parts = groupParts(group);
      const parsed = parseUnit(parts.input.value, parts, typingUnit(group, parts));
      if (!parsed) {
        renderUnit(group);
        return;
      }
      if (parsed.number === "" && parsed.unit === "") {
        const current = group.dataset.unit || "px";
        commitUnit(group, "", parts.keywords.includes(current) ? "px" : current);
        return;
      }
      commitUnit(group, parsed.number, parsed.unit);
    }
    function setUnit(group, unit) {
      const parts = groupParts(group);
      const current = group.dataset.unit || "px";
      const typed = parseUnit(parts.input.value, parts, typingUnit(group, parts));
      const number = typed && typed.number !== "" && !parts.keywords.includes(current) ? typed.number : "";
      if (parts.keywords.includes(unit)) {
        commitUnit(group, "", unit);
        return;
      }
      commitUnit(group, parts.keywords.includes(current) ? "" : convertUnit(number, current, unit), unit);
    }
    document.querySelectorAll(".hu-unit-group").forEach(renderUnit);
    new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(".hu-unit-group")) renderUnit(node);
          node.querySelectorAll(".hu-unit-group").forEach(renderUnit);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
    delegate(document, "change", "input.hu-unit-field-value", (event, hidden) => {
      const group = hidden.closest(".hu-unit-group");
      if (group) renderUnit(group);
    });
    delegate(document, "focusout", "input.hu-unit-field-input", (event, input) => {
      const group = input.closest(".hu-unit-group");
      if (group) applyTypedUnit(group);
    });
    delegate(document, "keydown", "input.hu-unit-field-input", (event, input) => {
      const group = input.closest(".hu-unit-group");
      if (!group) return;
      const parts = groupParts(group);
      const current = group.dataset.unit || "px";
      if (event.key === "Enter") {
        event.preventDefault();
        applyTypedUnit(group);
        return;
      }
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      const direction = event.key === "ArrowUp" ? 1 : -1;
      if (event.altKey) {
        const list = parts.units;
        const index = list.indexOf(current);
        setUnit(group, list[(index + direction + list.length) % list.length]);
        return;
      }
      const typed = parseUnit(input.value, parts, typingUnit(group, parts));
      const unit = typed && typed.unit && !parts.keywords.includes(typed.unit) ? typed.unit : parts.keywords.includes(current) ? "px" : current;
      const base = typed && typed.number !== "" ? parseFloat(typed.number) : 0;
      const step = event.shiftKey ? 10 : 1;
      const decimals = (String(base).split(".")[1] || "").length;
      commitUnit(group, String(Number((base + direction * step).toFixed(decimals))), unit);
    });
    let unitMenu = null;
    let unitMenuGroup = null;
    function closeUnitMenu(focusPill = false) {
      if (!unitMenu) return;
      const pill = unitMenuGroup && unitMenuGroup.querySelector(".hu-unit-pill");
      unitMenu.remove();
      unitMenu = null;
      if (unitMenuGroup) unitMenuGroup.classList.remove("is-menu-open");
      if (pill) {
        pill.setAttribute("aria-expanded", "false");
        if (focusPill) pill.focus();
      }
      unitMenuGroup = null;
    }
    function openUnitMenu(group) {
      closeUnitMenu();
      const parts = groupParts(group);
      const current = group.dataset.unit || "px";
      const options = [...parts.units, ...parts.keywords];
      const menu = document.createElement("ul");
      menu.className = "hu-unit-menu";
      menu.setAttribute("role", "listbox");
      menu.setAttribute("aria-label", unitText("HELIX_ULTIMATE_UNIT_MENU", "Units"));
      options.forEach((unit) => {
        const item = document.createElement("li");
        item.setAttribute("role", "option");
        item.tabIndex = -1;
        item.dataset.unit = unit;
        item.textContent = unit;
        item.setAttribute("aria-selected", String(unit === current));
        if (parts.keywords.includes(unit)) item.classList.add("is-keyword");
        menu.appendChild(item);
      });
      document.body.appendChild(menu);
      unitMenu = menu;
      unitMenuGroup = group;
      group.classList.add("is-menu-open");
      parts.pill.setAttribute("aria-expanded", "true");
      const rect = parts.pill.getBoundingClientRect();
      menu.style.top = `${rect.bottom + 4}px`;
      menu.style.left = `${Math.max(8, rect.right - menu.offsetWidth)}px`;
      (menu.querySelector('[aria-selected="true"]') || menu.firstElementChild)?.focus();
    }
    delegate(document, "click", ".hu-unit-pill", (event, pill) => {
      event.preventDefault();
      const group = pill.closest(".hu-unit-group");
      if (!group) return;
      if (unitMenuGroup === group) closeUnitMenu(true);
      else openUnitMenu(group);
    });
    delegate(document, "keydown", ".hu-unit-pill", (event, pill) => {
      const group = pill.closest(".hu-unit-group");
      if (group && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        openUnitMenu(group);
      }
    });
    document.addEventListener("click", (event) => {
      if (!unitMenu || !(event.target instanceof Element)) return;
      const item = event.target.closest('.hu-unit-menu [role="option"]');
      if (item) {
        const group = unitMenuGroup;
        closeUnitMenu(true);
        if (group && item.dataset.unit) setUnit(group, item.dataset.unit);
        return;
      }
      if (!event.target.closest(".hu-unit-menu, .hu-unit-pill")) closeUnitMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (!unitMenu || !unitMenu.contains(document.activeElement)) return;
      const items = [...unitMenu.children];
      const index = items.indexOf(document.activeElement);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const next = (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[next].focus();
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        items[event.key === "Home" ? 0 : items.length - 1].focus();
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const group = unitMenuGroup;
        const unit = items[index]?.dataset.unit;
        closeUnitMenu(true);
        if (group && unit) setUnit(group, unit);
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeUnitMenu(true);
      } else if (event.key === "Tab") {
        closeUnitMenu();
      }
    });
    document.addEventListener("scroll", () => closeUnitMenu(), true);
    window.addEventListener("resize", () => closeUnitMenu());
  });
})();
