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
      if (input) {
        input.value = JSON.stringify(serialize());
        fire(input);
      }
    }
    const setData = (element, key, value) => element.setAttribute(`data-${key}`, value === null || value === void 0 ? "" : String(value));
    const sortables = /* @__PURE__ */ new WeakSet();
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
          if (event.oldIndex !== event.newIndex) {
            updateLayoutField();
            Joomla.HelixToaster.success(message, "Layout Settings");
          }
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
    function openSettings({ templateId, flag, title, target, activeClass, footerButtons = [] }) {
      Joomla.helixModal.settings({ flag, title, class: "hu-modal-small", footerButtons });
      document.querySelectorAll(`.${activeClass}`).forEach((element) => element.classList.remove(activeClass));
      target.classList.add(activeClass);
      const content = document.getElementById(templateId).cloneNode(true);
      content.removeAttribute("id");
      content.classList.add("hu-options-modal-content");
      document.querySelector(".hu-options-modal-inner")?.replaceChildren(content);
      content.querySelectorAll(".hu-input").forEach((input) => {
        const value = readData(target, input.dataset.attrname ?? "");
        setInputValue(input, value);
        showMediaPreview(input, value);
      });
      Joomla.initColorPicker?.();
      return content;
    }
    delegate(document, "click", ".hu-row-options", (event, button) => {
      event.preventDefault();
      const row = button.closest(".hu-layout-section");
      if (!row) return;
      openSettings({
        templateId: "hu-row-settings",
        flag: "row-setting",
        title: "<span class='fas fa-cogs hu-mr-2'></span> Row Options",
        target: row,
        activeClass: "row-active",
        footerButtons: ['<a href="#" class="hu-btn hu-btn-link hu-settings-delete-row"><span class="fas fa-trash-alt" aria-hidden="true"></span> Delete row</a>']
      });
    });
    delegate(document, "click", ".hu-column-options", (event, button) => {
      event.preventDefault();
      const column = button.closest(".hu-layout-column");
      if (!column) return;
      const content = openSettings({
        templateId: "hu-column-settings",
        flag: "column-setting",
        title: "<span class='fas fa-cog'></span> Column Options",
        target: column,
        activeClass: "column-active"
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
    delegate(document, "change", ".hu-options-modal .hu-input-column_type", (event, checkbox) => {
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
      document.querySelectorAll(".hu-options-modal-overlay, .hu-options-modal").forEach((element) => element.remove());
      document.body.classList.remove("hu-options-modal-open");
    };
    delegate(document, "click", ".hu-settings-apply", (event, button) => {
      event.preventDefault();
      const inputs = [...document.querySelectorAll(".hu-options-modal-content .hu-input")];
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
      initSortables();
      Joomla.HelixToaster.success("New row added!", "Layout Settings");
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
