/* Generated from assets/ts/admin by scripts/build-admin.mjs. Edit the .ts source, not this file. */
"use strict";
(() => {
  // plugins/system/helixultimate/assets/ts/admin/layout.ts
  /**
   * @package Helix Ultimate Framework
   * @author JoomShaper https://www.joomshaper.com
   * @copyright Copyright (c) 2010 - 2025 JoomShaper
   * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
   */
  var looseEq = (a, b) => a == b;
  document.addEventListener("DOMContentLoaded", () => {
    const { fire, delegate, readData, show, hide, toggle } = Joomla.utils;
    const builderElement = document.getElementById("hu-layout-builder");
    if (!builderElement) return;
    const builder = builderElement;
    const COLUMN_OPTIONS_ICON = '<a class="hu-column-options" href="#"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="3" fill="none"><path fill="#020B53" fill-rule="evenodd" d="M3 1.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM13.5 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clip-rule="evenodd" opacity=".4"/></svg></a>';
    const settingsOf = (element) => {
      const settings = readData(element);
      delete settings.sortableitem;
      delete settings.sortableItem;
      return settings;
    };
    function serialize() {
      return [...builder.querySelectorAll(".hu-layout-section")].map((row) => {
        const active = row.querySelector(".hu-column-layout.active");
        const layoutData = active ? readData(active, "layout") : 12;
        return {
          type: "row",
          layout: !looseEq(layoutData, 12) ? String(layoutData).split(",").join("") : 12,
          settings: settingsOf(row),
          attr: [...row.querySelectorAll(".hu-layout-column")].map((column) => ({
            type: "sp_col",
            settings: settingsOf(column)
          }))
        };
      });
    }
    const helixLayout = { serialize };
    Joomla.helixLayout = helixLayout;
    function updateLayoutField() {
      const input = document.getElementById("layout");
      builder.querySelectorAll(".hu-layout-section").forEach(renderFlags);
      if (input) {
        input.value = JSON.stringify(serialize());
        fire(input);
      }
    }
    const setData = (element, key, value) => element.setAttribute(`data-${key}`, value === null || value === void 0 ? "" : String(value));
    const sortables = /* @__PURE__ */ new WeakSet();
    let lastDragEnd = 0;
    function makeSortable(container, options, message) {
      if (!container || sortables.has(container) || !window.Sortable) return;
      sortables.add(container);
      window.Sortable.create(container, {
        animation: 150,
        // Pointer-event dragging: consistent across browsers and styleable.
        forceFallback: true,
        fallbackOnBody: true,
        ghostClass: "ui-state-highlight",
        chosenClass: "hu-sortable-chosen",
        dragClass: "hu-sortable-drag",
        preventOnFilter: false,
        ...options,
        onEnd(event) {
          lastDragEnd = Date.now();
          if (event.oldIndex !== event.newIndex) {
            updateLayoutField();
            Joomla.HelixToaster.success(message, "Layout Settings");
          }
          builder.querySelectorAll(".hu-layout-section").forEach(layoutRowHandles);
        }
      });
    }
    function initSortables() {
      makeSortable(
        builder,
        { draggable: ".hu-layout-section", handle: ".hu-section-settings", filter: ".hu-row-option-list", direction: "vertical" },
        "Rows position changed!"
      );
      builder.querySelectorAll(".hu-layout-section [data-hu-layout-row]").forEach((row) => {
        makeSortable(row, { draggable: ".hu-layout-column", filter: ".hu-column-options", direction: "horizontal" }, "Columns position changed!");
      });
    }
    initSortables();
    const GRID = 12;
    const columnsOfRow = (row) => [...row.querySelectorAll("[data-hu-layout-row] > .hu-layout-column")];
    const widthOf = (column) => Number(column.dataset.grid_size || (column.className.match(/\bcol-(\d+)\b/) || [])[1] || GRID);
    function setColumnWidth(column, width) {
      column.className = /\bcol-\d+\b/.test(column.className) ? column.className.replace(/\bcol-\d+\b/, `col-${width}`) : `${column.className} col-${width}`;
      setData(column, "grid_size", width);
    }
    function setRowPattern(row, pattern) {
      const list = row.querySelector(".hu-column-list");
      if (!list) return;
      const preset = [...list.querySelectorAll(".hu-column-layout:not(.hu-layout-custom-btn)")].find(
        (button) => String(readData(button, "layout")) === pattern || pattern === "12" && looseEq(readData(button, "layout"), 12)
      );
      const target = preset || list.querySelector(".hu-layout-custom-btn");
      if (!target) return;
      if (!preset) target.setAttribute("data-layout", pattern);
      list.querySelectorAll(".hu-column-layout.active").forEach((item) => item.classList.remove("active"));
      target.classList.add("active");
    }
    function layoutRowHandles(row) {
      const container = row.querySelector(".hu-row-container");
      const columns = columnsOfRow(row);
      if (!container) return;
      let overlay = container.querySelector(":scope > .hu-col-resizers");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "hu-col-resizers";
        container.appendChild(overlay);
      }
      while (overlay.children.length < columns.length - 1) {
        const handle = document.createElement("div");
        handle.className = "hu-col-resizer";
        handle.tabIndex = 0;
        handle.setAttribute("role", "separator");
        handle.setAttribute("aria-orientation", "vertical");
        handle.setAttribute("aria-valuemin", "1");
        overlay.appendChild(handle);
      }
      while (overlay.children.length > Math.max(columns.length - 1, 0)) overlay.lastElementChild.remove();
      columns.forEach((column) => {
        const card = column.querySelector(":scope > .hu-column");
        if (!card) return;
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Column settings: ${column.querySelector(".hu-column-title")?.textContent?.trim() || "column"}`);
      });
      const widths = columns.map(widthOf);
      [...overlay.children].forEach((child, index) => {
        const handle = child;
        handle.dataset.index = String(index);
        handle.setAttribute("aria-valuenow", String(widths[index]));
        handle.setAttribute("aria-valuemax", String(widths[index] + widths[index + 1] - 1));
        handle.setAttribute("aria-label", `Width of ${columns[index].dataset.name || "column " + (index + 1)}, ${widths[index]} of 12`);
      });
      renderAddColumn(row);
      positionRowHandles(row);
      renderFlags(row);
      if (window.ResizeObserver && !container.dataset.huObserved) {
        container.dataset.huObserved = "1";
        new ResizeObserver(() => positionRowHandles(row)).observe(container);
      }
    }
    const HIDE_KEYS = ["hide_on_phone", "hide_on_large_phone", "hide_on_tablet", "hide_on_small_desktop", "hide_on_desktop", "hide_on_ex_large_desktop"];
    const isOn = (element, key) => looseEq(element.dataset[key], 1);
    const flagIcons = {
      hidden: '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="M2 2l12 12M6.3 4.2A6.7 6.7 0 0 1 8 4c3.5 0 5.6 3.2 6 4-.2.4-.8 1.4-1.8 2.3M9.9 11.6A6.2 6.2 0 0 1 8 12c-3.5 0-5.6-3.2-6-4 .3-.5 1-1.6 2.2-2.6"/></svg>',
      sticky: '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" d="M6 2h4l-.5 4 2 2H4.5l2-2zM8 8v6"/></svg>'
    };
    function settingLabel(templateId, key, fallback) {
      const field = document.querySelector(`#${templateId} [data-attrname="${key}"]`);
      const label = field?.closest(".control-group")?.querySelector("label");
      const text = label?.textContent?.trim();
      return text || fallback;
    }
    function renderFlags(row) {
      const title = row.querySelector(".hu-section-title");
      if (title) {
        let flags = row.querySelector(".hu-row-flags");
        if (!flags) {
          flags = document.createElement("span");
          flags.className = "hu-row-flags";
          title.after(flags);
        }
        const parts = [];
        if (isOn(row, "fluidrow")) {
          const text = settingLabel("hu-row-settings", "fluidrow", "Full width").replace(/[<>&"]/g, "");
          parts.push(`<span class="hu-flag hu-flag-text">${text}</span>`);
        }
        const background = row.dataset.background_color;
        if (background) {
          parts.push(`<span class="hu-flag hu-flag-swatch" title="Background ${background}" style="--hu-flag-color: ${background.replace(/[^#\w(),.%\s-]/g, "")}"></span>`);
        }
        if (HIDE_KEYS.some((key) => isOn(row, key))) parts.push(`<span class="hu-flag hu-flag-icon" title="Hidden on some devices">${flagIcons.hidden}</span>`);
        flags.innerHTML = parts.join("");
      }
      columnsOfRow(row).forEach((column) => {
        const card = column.querySelector(":scope > .hu-column");
        if (!card) return;
        let flags = card.querySelector(".hu-column-flags");
        if (!flags) {
          flags = document.createElement("span");
          flags.className = "hu-column-flags";
          card.querySelector(".hu-column-title")?.after(flags);
        }
        const parts = [];
        if (isOn(column, "sticky_position")) {
          const text = settingLabel("hu-column-settings", "sticky_position", "Sticky").replace(/[<>&"]/g, "");
          parts.push(`<span class="hu-flag hu-flag-icon" title="${text}">${flagIcons.sticky}</span>`);
        }
        if (HIDE_KEYS.some((key) => isOn(column, key))) parts.push(`<span class="hu-flag hu-flag-icon" title="Hidden on some devices">${flagIcons.hidden}</span>`);
        flags.innerHTML = parts.join("");
      });
    }
    const layoutText = (key, fallback) => {
      const value = Joomla.Text ? Joomla.Text._(key) : "";
      return value && value !== key ? value : fallback;
    };
    function newColumn(width) {
      const column = document.createElement("div");
      column.className = `hu-layout-column col-${width}`;
      column.innerHTML = `<div class="hu-column"><span class="hu-column-title">none</span>${COLUMN_OPTIONS_ICON}</div>`;
      setData(column, "column_type", 0);
      setData(column, "name", "none");
      setData(column, "grid_size", width);
      return column;
    }
    function addColumn(row) {
      const columns = columnsOfRow(row);
      const widths = columns.map(widthOf);
      const widest = Math.max(...widths);
      if (widest < 2) return;
      const index = widths.lastIndexOf(widest);
      setColumnWidth(columns[index], Math.ceil(widest / 2));
      columns[index].after(newColumn(Math.floor(widest / 2)));
      layoutRowHandles(row);
      setRowPattern(row, columnsOfRow(row).map(widthOf).join("+"));
      updateLayoutField();
    }
    function renderAddColumn(row) {
      const container = row.querySelector(".hu-row-container");
      if (!container) return;
      let button = container.querySelector(":scope > .hu-add-column");
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "hu-add-column";
        button.title = layoutText("HELIX_ULTIMATE_MEGAMENU_ADD_COLUMN", "Add column");
        button.setAttribute("aria-label", button.title);
        button.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M8 3.5v9M3.5 8h9"/></svg>';
        container.appendChild(button);
      }
      button.disabled = Math.max(...columnsOfRow(row).map(widthOf), 0) < 2;
    }
    delegate(document, "click", "#hu-layout-builder .hu-add-column", (event, button) => {
      event.preventDefault();
      const row = button.closest(".hu-layout-section");
      if (row) addColumn(row);
    });
    function positionRowHandles(row) {
      const container = row.querySelector(".hu-row-container");
      const overlay = container?.querySelector(":scope > .hu-col-resizers");
      const grid = row.querySelector("[data-hu-layout-row]");
      if (!container || !overlay || !grid) return;
      const box = container.getBoundingClientRect();
      const gridBox = grid.getBoundingClientRect();
      const widths = columnsOfRow(row).map(widthOf);
      let end = 0;
      overlay.style.top = `${gridBox.top - box.top}px`;
      overlay.style.left = `${gridBox.left - box.left}px`;
      overlay.style.width = `${gridBox.width}px`;
      overlay.style.height = `${gridBox.height}px`;
      [...overlay.children].forEach((child, index) => {
        end += widths[index] || 0;
        child.style.left = `${end / GRID * 100}%`;
      });
    }
    delegate(document, "pointerover", "#hu-layout-builder .hu-layout-section", (event, row) => {
      if (!row.classList.contains("is-resizing")) positionRowHandles(row);
    });
    function setPair(row, index, left) {
      const columns = columnsOfRow(row);
      const widths = columns.map(widthOf);
      const pair = widths[index] + widths[index + 1];
      const next = Math.min(Math.max(Math.round(left), 1), pair - 1);
      if (next === widths[index]) return false;
      setColumnWidth(columns[index], next);
      setColumnWidth(columns[index + 1], pair - next);
      layoutRowHandles(row);
      row.dataset.widthsDirty = "1";
      return true;
    }
    const commitTimers = /* @__PURE__ */ new WeakMap();
    function commitWidths(row, delay = 450) {
      if (row.dataset.widthsDirty !== "1") return;
      window.clearTimeout(commitTimers.get(row));
      commitTimers.set(
        row,
        window.setTimeout(() => {
          delete row.dataset.widthsDirty;
          setRowPattern(row, columnsOfRow(row).map(widthOf).join("+"));
          updateLayoutField();
        }, delay)
      );
    }
    delegate(document, "pointerdown", "#hu-layout-builder .hu-col-resizer", (event, handle) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const row = handle.closest(".hu-layout-section");
      const grid = row?.querySelector("[data-hu-layout-row]");
      if (!row || !grid) return;
      const index = Number(handle.dataset.index);
      const unit = grid.getBoundingClientRect().width / GRID;
      try {
        handle.setPointerCapture(event.pointerId);
      } catch (error) {
      }
      handle.focus({ preventScroll: true });
      row.classList.add("is-resizing");
      const move = (moveEvent) => {
        const start = columnsOfRow(row)[index].getBoundingClientRect().left;
        setPair(row, index, (moveEvent.clientX - start) / unit);
      };
      const end = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", end);
        handle.removeEventListener("pointercancel", end);
        row.classList.remove("is-resizing");
        commitWidths(row, 0);
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    });
    delegate(document, "keydown", "#hu-layout-builder .hu-col-resizer", (event, handle) => {
      const row = handle.closest(".hu-layout-section");
      if (!row) return;
      const index = Number(handle.dataset.index);
      const widths = columnsOfRow(row).map(widthOf);
      const pair = widths[index] + widths[index + 1];
      const target = { ArrowLeft: widths[index] - 1, ArrowRight: widths[index] + 1, Home: 1, End: pair - 1 }[event.key];
      if (target === void 0) return;
      event.preventDefault();
      if (setPair(row, index, target)) commitWidths(row);
    });
    delegate(document, "focusout", "#hu-layout-builder .hu-col-resizer", (event, handle) => {
      const row = handle.closest(".hu-layout-section");
      if (row) commitWidths(row, 0);
    });
    builder.querySelectorAll(".hu-layout-section").forEach(layoutRowHandles);
    function setInputValue(input, value) {
      if (input instanceof HTMLInputElement && input.type === "checkbox") {
        input.checked = looseEq(value, "1");
        return;
      }
      if (value === void 0) return;
      input.value = value === null ? "" : String(value);
    }
    const getInputValue = (input) => input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked ? "1" : "0" : input.value;
    function showMediaPreview(input, value) {
      if (!input.classList.contains("hu-input-media") || !value) return;
      const holder = input.previousElementSibling;
      if (holder && holder.classList.contains("hu-image-holder")) {
        holder.innerHTML = "";
        const image = document.createElement("img");
        image.src = (input.dataset.baseurl || "") + value;
        image.alt = "";
        holder.appendChild(image);
      }
      [...input.parentElement?.children ?? []].filter((sibling) => sibling.classList.contains("hu-media-clear")).forEach((clear) => clear.classList.remove("hide"));
    }
    let settingsStep = null;
    function openSettings({ templateId, flag, title, target, activeClass, footerButtons = [] }) {
      const host = builder.closest(".hu-edit-panel");
      settingsStep?.close();
      document.querySelectorAll(`.${activeClass}`).forEach((element) => element.classList.remove(activeClass));
      target.classList.add(activeClass);
      const content = document.getElementById(templateId).cloneNode(true);
      content.removeAttribute("id");
      content.classList.add("hu-options-modal-content", "hu-layout-settings");
      const apply = `<button type="button" class="hu-btn hu-btn-primary hu-settings-apply" data-flag="${flag}">${Joomla.utils.icon("check")} Apply</button>`;
      if (host) {
        const step = Joomla.helixSubpanel.open({
          host,
          title,
          body: content,
          backLabel: "Back to layout",
          className: "hu-subpanel-layout-settings",
          footer: apply + footerButtons.join(""),
          onClose: () => {
            if (settingsStep === step) settingsStep = null;
          }
        });
        settingsStep = step;
      } else {
        Joomla.helixModal.settings({ flag, title, class: "hu-modal-small", footerButtons });
        document.querySelector(".hu-options-modal-inner")?.replaceChildren(content);
      }
      content.querySelectorAll(".hu-input").forEach((input) => {
        const value = readData(target, input.dataset.attrname ?? "");
        setInputValue(input, value);
        showMediaPreview(input, value);
      });
      Joomla.initColorPicker?.();
      return content;
    }
    const settingsContent = () => settingsStep?.body.querySelector(".hu-options-modal-content") ?? document.querySelector(".hu-options-modal .hu-options-modal-content");
    delegate(document, "click", ".hu-row-options", (event, button) => {
      event.preventDefault();
      const row = button.closest(".hu-layout-section");
      if (!row) return;
      openSettings({
        templateId: "hu-row-settings",
        flag: "row-setting",
        title: `Row: ${row.querySelector(".hu-section-title")?.textContent?.trim() || "Row Options"}`,
        target: row,
        activeClass: "row-active",
        footerButtons: [`<button type="button" class="hu-btn hu-btn-link hu-settings-delete-row">${Joomla.utils.icon("trash")} Delete row</button>`]
      });
    });
    delegate(document, "click", "#hu-layout-builder .hu-layout-column > .hu-column", (event, card) => {
      if (event.target instanceof Element && event.target.closest(".hu-column-options")) return;
      if (Date.now() - lastDragEnd < 300) return;
      card.querySelector(".hu-column-options")?.click();
    });
    delegate(document, "keydown", "#hu-layout-builder .hu-layout-column > .hu-column", (event, card) => {
      if (event.target !== card || event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      card.querySelector(".hu-column-options")?.click();
    });
    delegate(document, "click", ".hu-column-options", (event, button) => {
      event.preventDefault();
      const column = button.closest(".hu-layout-column");
      if (!column) return;
      const removable = columnsOfRow(column.closest(".hu-layout-section") ?? column).length > 1;
      const content = openSettings({
        templateId: "hu-column-settings",
        flag: "column-setting",
        title: `Column: ${column.querySelector(".hu-column-title")?.textContent?.trim() || "Column Options"}`,
        target: column,
        activeClass: "column-active",
        footerButtons: removable ? [`<button type="button" class="hu-btn hu-btn-link hu-settings-delete-column">${Joomla.utils.icon("trash")} ${layoutText("HELIX_ULTIMATE_MEGAMENU_REMOVE_COLUMN", "Remove column")}</button>`] : []
      });
      const nameSelect = content.querySelector('select[data-attrname="name"]');
      const sticky = content.querySelector(".hu-input-sticky_position");
      const syncSticky = () => {
        const sidebar = Boolean(nameSelect && ["left", "right"].includes(nameSelect.value));
        const group = sticky && sticky.closest(".control-group");
        if (!sticky || !group) return;
        if (!sidebar) sticky.checked = false;
        toggle(group, sidebar);
      };
      syncSticky();
      if (nameSelect) nameSelect.addEventListener("change", syncSticky);
    });
    delegate(document, "change", ".hu-options-modal-content .hu-input-column_type", (event, checkbox) => {
      const content = checkbox.closest(".hu-options-modal-content");
      const nameGroup = content && content.querySelector(".control-group.name");
      const taken = [...builder.querySelectorAll(".hu-layout-column:not(.column-active)")].some(
        (column) => looseEq(readData(column, "column_type"), "1")
      );
      if (taken) {
        alert("Component Area Taken");
        checkbox.checked = false;
        show(nameGroup);
        return;
      }
      if (checkbox.checked) {
        const active = builder.querySelector(".hu-layout-column.column-active .hu-column");
        if (active) active.classList.add("hu-column-component");
        hide(nameGroup);
      } else {
        builder.querySelectorAll(".hu-column-component").forEach((column) => column.classList.remove("hu-column-component"));
        show(nameGroup);
      }
      updateLayoutField();
    });
    const closeSettings = () => {
      if (settingsStep) {
        settingsStep.close();
        return;
      }
      document.querySelectorAll(".hu-options-modal-overlay, .hu-options-modal").forEach((element) => element.remove());
      document.body.classList.remove("hu-options-modal-open");
    };
    delegate(document, "click", ".hu-settings-apply", (event, button) => {
      event.preventDefault();
      const inputs = [...settingsContent()?.querySelectorAll(".hu-input") ?? []];
      switch (button.dataset.flag) {
        case "row-setting": {
          const row = builder.querySelector(".row-active");
          if (!row) break;
          inputs.forEach((input) => {
            const name = input.dataset.attrname ?? "";
            if (name === "name") {
              const title = row.querySelector(".hu-section-title");
              if (title) title.textContent = input.value || "Section Header";
            }
            setData(row, name, getInputValue(input));
          });
          break;
        }
        case "column-setting": {
          const column = builder.querySelector(".column-active");
          let component = false;
          if (!column) break;
          inputs.forEach((input) => {
            const name = input.dataset.attrname ?? "";
            const title = column.querySelector(".hu-column-title");
            if (name === "column_type" && input instanceof HTMLInputElement && input.checked) {
              component = true;
              if (title) title.textContent = "Component";
            } else if (name === "name" && !component) {
              if (title) title.textContent = input.value || "none";
            }
            setData(column, name, getInputValue(input));
          });
          break;
        }
        case "menu-row-setting":
        case "menu-col-setting":
          break;
        default:
          alert("You are doing somethings wrongs. Try again");
      }
      closeSettings();
      updateLayoutField();
      Joomla.HelixToaster.success("Changes applied successfully!", "Layout Settings");
    });
    delegate(document, "click", ".hu-settings-cancel, .action-hu-options-modal-close", (event) => {
      event.preventDefault();
      closeSettings();
    });
    delegate(document, "click", ".hu-add-columns", (event, button) => {
      event.preventDefault();
      event.stopPropagation();
      const list = button.closest("li")?.querySelector(".hu-column-list");
      if (list) toggle(list, getComputedStyle(list).display === "none", "block");
    });
    delegate(document, "click", ".hu-layout-custom-btn", (event, button) => {
      event.preventDefault();
      const custom = button.closest(".hu-column-list")?.querySelector(".hu-layout-custom");
      if (custom) toggle(custom, getComputedStyle(custom).display === "none", "block");
    });
    function applyGrid(row, sizes) {
      const container = row?.querySelector("[data-hu-layout-row]");
      if (!container) return;
      const columns = [...container.querySelectorAll(".hu-layout-column")];
      sizes.forEach((rawSize, index) => {
        const size = String(rawSize).trim();
        let column = columns[index];
        if (!column) {
          column = document.createElement("div");
          column.innerHTML = `<div class="hu-column"><span class="hu-column-title">none</span>${COLUMN_OPTIONS_ICON}</div>`;
          setData(column, "column_type", 0);
          setData(column, "name", "none");
          container.appendChild(column);
        }
        column.className = `hu-layout-column col-${size}`;
        setData(column, "grid_size", size);
      });
      columns.slice(sizes.length).forEach((column) => column.remove());
      if (row instanceof HTMLElement) layoutRowHandles(row);
      Joomla.HelixToaster.success(`Grid pattern updated to <strong>${sizes.join("+")}</strong>`, "Layout Settings");
      updateLayoutField();
    }
    const setActiveLayout = (list, layoutButton) => {
      list.querySelectorAll(".hu-column-layout.active").forEach((item) => item.classList.remove("active"));
      layoutButton.classList.add("active");
    };
    delegate(document, "click", ".hu-column-layout", (event, layoutButton) => {
      event.preventDefault();
      if (layoutButton.dataset.type === "custom") return;
      const list = layoutButton.closest(".hu-column-list");
      const layout = String(readData(layoutButton, "layout"));
      if (!list) return;
      hide(list);
      if (layoutButton.classList.contains("active")) return;
      setActiveLayout(list, layoutButton);
      applyGrid(layoutButton.closest(".hu-layout-section"), looseEq(layout, 12) ? ["12"] : layout.split("+"));
    });
    delegate(document, "click", ".hu-layout-custom-apply", (event, button) => {
      event.preventDefault();
      const list = button.closest(".hu-column-list");
      const customButton = list?.querySelector(".hu-layout-custom-btn");
      const pattern = button.closest("div")?.querySelector("input")?.value || "12";
      const sizes = pattern.split("+");
      const total = sizes.reduce((sum, size) => sum + Number(size), 0);
      if (total !== 12) {
        alert("Invalid grid pattern!");
        return;
      }
      if (!list || !customButton) return;
      customButton.setAttribute("data-layout", pattern);
      setActiveLayout(list, customButton);
      applyGrid(button.closest(".hu-layout-section"), sizes);
      hide(list);
    });
    delegate(document, "click", ".hu-add-row", (event, button) => {
      event.preventDefault();
      const template = document.getElementById("hu-layout-section");
      if (!template) return;
      const row = template.cloneNode(true);
      row.classList.add("hu-layout-section");
      row.removeAttribute("id");
      button.closest(".hu-layout-section")?.after(row);
      layoutRowHandles(row);
      initSortables();
      Joomla.HelixToaster.success("New row added!", "Layout Settings");
      updateLayoutField();
    });
    delegate(document, "click", ".hu-settings-delete-column", (event) => {
      event.preventDefault();
      const column = builder.querySelector(".hu-layout-column.column-active");
      const row = column?.closest(".hu-layout-section");
      if (!column || !row) return;
      const columns = columnsOfRow(row);
      const index = columns.indexOf(column);
      if (columns.length < 2 || index < 0) return;
      const neighbour = columns[index > 0 ? index - 1 : 1];
      setColumnWidth(neighbour, widthOf(neighbour) + widthOf(column));
      column.remove();
      closeSettings();
      layoutRowHandles(row);
      setRowPattern(row, columnsOfRow(row).map(widthOf).join("+"));
      updateLayoutField();
    });
    delegate(document, "click", ".hu-settings-delete-row", (event) => {
      event.preventDefault();
      const row = builder.querySelector(".hu-layout-section.row-active");
      if (!row || !confirm("Click Ok button to delete Row, Cancel to leave.")) return;
      row.remove();
      closeSettings();
      Joomla.HelixToaster.error("Row is removed!", "Layout Settings");
      updateLayoutField();
    });
  });
})();
