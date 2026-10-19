/* Generated from assets/ts/admin by scripts/build-admin.mjs. Edit the .ts source, not this file. */
"use strict";
(() => {
  // plugins/system/helixultimate/assets/ts/admin/presets.ts
  /**
   * @package Helix Ultimate Framework
   * @author JoomShaper https://www.joomshaper.com
   * Copyright (c) 2010 - 2025 JoomShaper
   * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
   */
  document.addEventListener("DOMContentLoaded", () => {
    const { delegate, readData } = Joomla.utils;
    const presetsDataElement = document.querySelector(".hu-presets #presets-data");
    if (!presetsDataElement) return;
    const dataElement = presetsDataElement;
    let presetsData = {};
    if (dataElement.value.length) {
      presetsData = JSON.parse(dataElement.value);
    }
    function detectMajorColor(presetData) {
      const frequency = Object.values(presetData).reduce((accumulator, color2) => {
        accumulator[color2] = (accumulator[color2] || 0) + 1;
        return accumulator;
      }, {});
      let max = 0;
      return Object.entries(frequency).reduce((major, [color2, count]) => {
        if (count >= max) {
          max = count;
          major = color2;
        }
        return major;
      }, "");
    }
    const color = (tile, key, fallback) => tile.getAttribute(`data-${key}`) || fallback;
    function renderPresetPreview(tile) {
      const contents = tile.querySelector(".hu-preset-contents");
      if (!contents) return;
      const accent = color(tile, "link_color", "#1f3bff");
      contents.setAttribute("aria-hidden", "true");
      contents.innerHTML = `
			<span class="hu-preset-mock">
				<span class="hu-preset-mock__topbar"></span>
				<span class="hu-preset-mock__header">
					<span class="hu-preset-mock__logo"></span>
					<span class="hu-preset-mock__menu"><i></i><i></i><i></i></span>
				</span>
				<span class="hu-preset-mock__hero">
					<i></i><i></i>
					<span class="hu-preset-mock__button"></span>
				</span>
				<span class="hu-preset-mock__body"><i></i><i></i><i></i></span>
			</span>`;
      const mock = contents.querySelector(".hu-preset-mock");
      const vars = {
        "--p-topbar": color(tile, "topbar_bg_color", "#333"),
        "--p-header": color(tile, "header_bg_color", "#fff"),
        "--p-logo": color(tile, "logo_text_color", accent),
        "--p-menu": color(tile, "menu_text_color", "#252525"),
        "--p-bg": color(tile, "bg_color", "#fff"),
        "--p-text": color(tile, "text_color", "#252525"),
        "--p-accent": accent
      };
      Object.entries(vars).forEach(([name, value]) => mock.style.setProperty(name, value));
      tile.style.setProperty("--p-accent", accent);
    }
    function syncPresetState() {
      document.querySelectorAll(".hu-presets .hu-preset").forEach((tile) => {
        const active = tile.classList.contains("active");
        tile.setAttribute("aria-checked", String(active));
        tile.tabIndex = active ? 0 : -1;
      });
    }
    const presetsGrid = dataElement.closest(".hu-presets");
    const tiles = [...presetsGrid.querySelectorAll(".hu-preset")];
    presetsGrid.setAttribute("role", "radiogroup");
    presetsGrid.setAttribute("aria-label", "Presets");
    tiles.forEach((tile) => {
      tile.setAttribute("role", "radio");
      tile.setAttribute("aria-label", tile.querySelector(".hu-preset-title")?.textContent?.trim() || tile.dataset.preset || "");
      renderPresetPreview(tile);
      const edit = tile.querySelector(".hu-edit-preset");
      if (edit) {
        edit.removeAttribute("style");
        edit.setAttribute("href", "#");
        edit.setAttribute("aria-label", `Edit ${tile.getAttribute("aria-label")}`);
        edit.title = "Edit colours";
      }
    });
    if (!tiles.some((tile) => tile.classList.contains("active")) && tiles[0]) tiles[0].tabIndex = 0;
    syncPresetState();
    delegate(presetsGrid, "click", ".hu-preset", () => requestAnimationFrame(syncPresetState));
    presetsGrid.addEventListener("keydown", (event) => {
      const tile = event.target instanceof Element ? event.target.closest(".hu-preset") : null;
      if (!tile || event.target !== tile) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        tile.click();
        return;
      }
      const steps = { ArrowRight: 1, ArrowDown: 2, ArrowLeft: -1, ArrowUp: -2 };
      const step = steps[event.key];
      if (!step) return;
      event.preventDefault();
      const next = tiles[(tiles.indexOf(tile) + step + tiles.length) % tiles.length];
      next.click();
      next.focus();
    });
    const SHORT_LABELS = {
      topbar_bg_color: ["HELIX_ULTIMATE_PRESET_FIELD_BACKGROUND", "Background"],
      topbar_text_color: ["HELIX_ULTIMATE_PRESET_FIELD_TEXT", "Text"],
      header_bg_color: ["HELIX_ULTIMATE_PRESET_FIELD_BACKGROUND", "Background"],
      logo_text_color: ["HELIX_ULTIMATE_PRESET_FIELD_LOGO", "Logo"],
      menu_text_color: ["HELIX_ULTIMATE_PRESET_FIELD_TEXT", "Text"],
      menu_text_hover_color: ["HELIX_ULTIMATE_PRESET_FIELD_HOVER", "Hover"],
      menu_text_active_color: ["HELIX_ULTIMATE_PRESET_FIELD_ACTIVE", "Active"],
      menu_dropdown_bg_color: ["HELIX_ULTIMATE_PRESET_FIELD_BACKGROUND", "Background"],
      menu_dropdown_text_color: ["HELIX_ULTIMATE_PRESET_FIELD_TEXT", "Text"],
      menu_dropdown_text_hover_color: ["HELIX_ULTIMATE_PRESET_FIELD_HOVER", "Hover"],
      menu_dropdown_text_active_color: ["HELIX_ULTIMATE_PRESET_FIELD_ACTIVE", "Active"],
      bg_color: ["HELIX_ULTIMATE_PRESET_FIELD_BACKGROUND", "Background"],
      text_color: ["HELIX_ULTIMATE_PRESET_FIELD_TEXT", "Text"],
      link_color: ["HELIX_ULTIMATE_PRESET_FIELD_LINK", "Link"],
      link_hover_color: ["HELIX_ULTIMATE_PRESET_FIELD_LINK_HOVER", "Link hover"],
      footer_bg_color: ["HELIX_ULTIMATE_PRESET_FIELD_BACKGROUND", "Background"],
      footer_text_color: ["HELIX_ULTIMATE_PRESET_FIELD_TEXT", "Text"],
      footer_link_color: ["HELIX_ULTIMATE_PRESET_FIELD_LINK", "Link"],
      footer_link_hover_color: ["HELIX_ULTIMATE_PRESET_FIELD_LINK_HOVER", "Link hover"]
    };
    const shortLabel = (field) => {
      const entry = SHORT_LABELS[field];
      const value = entry && Joomla.Text ? Joomla.Text._(entry[0]) : "";
      return value && value !== entry[0] ? value : null;
    };
    const PRESET_GROUPS = [
      { key: "topbar", label: ["HELIX_ULTIMATE_PRESET_GROUP_TOPBAR", "Top bar"], fields: ["topbar_bg_color", "topbar_text_color"] },
      { key: "header", label: ["HELIX_ULTIMATE_PRESET_GROUP_HEADER", "Header"], fields: ["header_bg_color", "logo_text_color"] },
      { key: "menu", label: ["HELIX_ULTIMATE_PRESET_GROUP_MENU", "Menu"], fields: ["menu_text_color", "menu_text_hover_color", "menu_text_active_color"] },
      {
        key: "dropdown",
        label: ["HELIX_ULTIMATE_PRESET_GROUP_DROPDOWN", "Dropdown menu"],
        fields: ["menu_dropdown_bg_color", "menu_dropdown_text_color", "menu_dropdown_text_hover_color", "menu_dropdown_text_active_color"]
      },
      { key: "body", label: ["HELIX_ULTIMATE_PRESET_GROUP_BODY", "Body"], fields: ["bg_color", "text_color", "link_color", "link_hover_color"] },
      { key: "footer", label: ["HELIX_ULTIMATE_PRESET_GROUP_FOOTER", "Footer"], fields: ["footer_bg_color", "footer_text_color", "footer_link_color", "footer_link_hover_color"] }
    ];
    const presetText = (key, fallback) => {
      const value = Joomla.Text ? Joomla.Text._(key) : "";
      return value && value !== key ? value : fallback;
    };
    function groupPresetEditor(editor2) {
      const rows = [...editor2.querySelectorAll(".group-style-no-group")].filter((row) => row.querySelector("input.preset-control"));
      const byField = new Map(rows.map((row) => [row.querySelector("input.preset-control").name, row]));
      const used = /* @__PURE__ */ new Set();
      const sections = [];
      PRESET_GROUPS.forEach((group) => {
        const groupRows = group.fields.map((field) => byField.get(field)).filter((row) => Boolean(row));
        groupRows.forEach((row) => used.add(row));
        if (groupRows.length) sections.push({ key: group.key, label: presetText(...group.label), rows: groupRows });
      });
      const others = rows.filter((row) => !used.has(row));
      if (others.length) sections.push({ key: "other", label: presetText("HELIX_ULTIMATE_PRESET_GROUP_OTHER", "Other"), rows: others });
      const list = document.createElement("div");
      list.className = "hu-preset-groups";
      sections.forEach((section, index) => {
        const details = document.createElement("details");
        details.className = `hu-preset-group hu-preset-group-${section.key}`;
        details.open = index === 0;
        details.innerHTML = `
				<summary class="hu-preset-group__summary">
					<span class="hu-preset-group__title"></span>
					<span class="hu-preset-group__swatches" aria-hidden="true"></span>
					<svg class="hu-preset-group__chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
				</summary>
				<div class="hu-preset-group__fields"></div>`;
        details.querySelector(".hu-preset-group__title").textContent = section.label;
        const fields = details.querySelector(".hu-preset-group__fields");
        const swatches = details.querySelector(".hu-preset-group__swatches");
        section.rows.forEach((row) => {
          const input = row.querySelector("input.preset-control");
          const label = row.querySelector(".control-label");
          const fullLabel = (label?.dataset.fullLabel ?? label?.textContent ?? "").trim();
          const short = section.key === "other" ? null : shortLabel(input.name);
          if (label) {
            label.dataset.fullLabel = fullLabel;
            label.textContent = short ?? fullLabel;
          }
          if (fullLabel) input.setAttribute("aria-label", fullLabel);
          const swatch = document.createElement("i");
          const paint = () => swatch.style.setProperty("background-color", input.value || "transparent");
          paint();
          input.addEventListener("input", paint);
          input.addEventListener("change", paint);
          swatches.appendChild(swatch);
          fields.appendChild(row);
        });
        list.appendChild(details);
      });
      const wrapper = editor2.firstElementChild;
      if (wrapper) wrapper.replaceChildren(list);
      else editor2.appendChild(list);
    }
    let editor = null;
    function reflectPresetChanges(data, name, originalContainer, editedContainer) {
      presetsData[name].data = data;
      dataElement.value = JSON.stringify(presetsData);
      const presetElement = document.querySelector(`.hu-preset[data-preset="${name}"]`);
      if (presetElement) {
        Object.entries(data).forEach(([key, value]) => presetElement.setAttribute(`data-${key}`, value));
        presetElement.querySelector(".hu-edit-preset")?.setAttribute("data-preset_data", JSON.stringify({ name, data: { ...data } }));
      }
      originalContainer.replaceChildren(...editedContainer.querySelectorAll(":scope > div"));
      window.purgeCss?.();
      editor?.close();
      if (presetElement) {
        const majorColor = detectMajorColor(data);
        presetElement.style.backgroundColor = majorColor;
        renderPresetPreview(presetElement);
        presetElement.click();
      }
    }
    delegate(document, "click", ".hu-edit-preset", (event, button) => {
      event.preventDefault();
      event.stopPropagation();
      const { name, data } = readData(button, "preset_data") || {};
      if (!name || !data) return;
      const originalContainer = document.querySelector(`.hu-preset-container#${name}`);
      if (!originalContainer) return;
      const host = presetsGrid.closest(".hu-edit-panel");
      if (!host) return;
      editor?.close();
      const container = originalContainer.cloneNode(true);
      container.querySelectorAll("input").forEach((input) => input.removeAttribute("id"));
      container.removeAttribute("id");
      container.removeAttribute("style");
      container.classList.add("hu-preset-editor");
      groupPresetEditor(container);
      const tile = button.closest(".hu-preset");
      const label = tile?.getAttribute("aria-label") || name;
      const step = Joomla.helixSubpanel.open({
        host,
        title: label,
        body: container,
        backLabel: "Back to presets",
        footer: `<button type="button" class="hu-btn hu-btn-primary hu-save-preset">${Joomla.utils.icon("check")} Apply</button><button type="button" class="hu-btn hu-btn-link helix-preset-reset">${Joomla.utils.icon("refresh")} Reset to default</button>`,
        onClose: () => {
          if (editor === step) editor = null;
          button.focus({ preventScroll: true });
        }
      });
      editor = step;
      Joomla.initColorPicker?.();
      container.querySelectorAll("input.preset-control").forEach((input) => {
        input.addEventListener("change", () => {
          data[input.name] = input.value;
        });
      });
      step.footer?.querySelector(".hu-save-preset")?.addEventListener("click", (applyEvent) => {
        applyEvent.preventDefault();
        reflectPresetChanges(data, name, originalContainer, container);
      });
      step.footer?.querySelector(".helix-preset-reset")?.addEventListener("click", (resetEvent) => {
        resetEvent.preventDefault();
        if (window.confirm("Do you really want to reset your changes to default?")) {
          const defaults = JSON.parse(document.getElementById("default-values").value);
          reflectPresetChanges(defaults[name], name, originalContainer, container);
        }
      });
    });
  });
})();
