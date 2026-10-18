/* Generated from assets/ts/admin by scripts/build-admin.mjs. Edit the .ts source, not this file. */
"use strict";
(() => {
  // plugins/system/helixultimate/assets/ts/admin/menubuilder.ts
  document.addEventListener("DOMContentLoaded", () => {
    const { delegate, request, param, serialize } = Joomla.utils;
    const config = Joomla.getOptions("meta") || {};
    const menuSelect = document.querySelector("select[name=menu]");
    const containerElement = document.getElementById("hu-menu-builder-container");
    if (!containerElement) return;
    const container = containerElement;
    let menuType = menuSelect && menuSelect.value || "mainmenu";
    const helixUrl = (action, extra = "") => `${config.base}/administrator/index.php?option=com_ajax&helix=ultimate&request=task&action=${action}${extra}&helix_id=${window.helixUltimateStyleId}`;
    const branchOf = (element) => element.closest(".hu-menu-tree-branch");
    const itemIdOf = (element) => Number(branchOf(element)?.dataset.itemid || 0);
    async function fetchMenuItems(type) {
      try {
        const response = await request(helixUrl("getMenuItems", `&menutype=${encodeURIComponent(type)}`));
        if (response.status) {
          container.innerHTML = response.data ?? "";
          Joomla.sortable?.run();
        }
      } catch (error) {
        console.error("Could not load the menu items", error);
      }
      Joomla.reloadPreview?.();
      Joomla.utils.calculateSiblingDistances();
    }
    async function rebuildMenu() {
      try {
        await request(helixUrl("rebuildMenu"), { responseType: "text" });
      } catch (error) {
        alert("Rebuild menu failed with: " + error.message);
      }
    }
    if (menuSelect) {
      menuSelect.addEventListener("change", () => {
        menuType = menuSelect.value;
        fetchMenuItems(menuType);
      });
    }
    fetchMenuItems(menuType);
    function closeToolbar() {
      document.querySelectorAll(".hu-branch-tools .hu-branch-tools-list.active").forEach((list) => {
        list.classList.remove("active");
        list.style.display = "none";
      });
    }
    delegate(document, "click", ".hu-branch-tools .hu-branch-tools-icon", (event, icon) => {
      event.preventDefault();
      const list = icon.nextElementSibling;
      document.querySelectorAll(".hu-branch-tools .hu-branch-tools-list.active").forEach((other) => {
        if (other !== list) {
          other.classList.remove("active");
          other.style.display = "";
        }
      });
      if (list) {
        const opening = !list.classList.contains("active");
        list.classList.toggle("active", opening);
        list.style.display = opening ? "block" : "none";
      }
    });
    delegate(document, "click", ".hu-branch-tools .hu-branch-tools-list-megamenu", async (event, link) => {
      event.preventDefault();
      closeToolbar();
      const branch = branchOf(link);
      const parent = branch?.dataset.parent || "1";
      try {
        const response = await request(helixUrl("generateMegaMenuBody", `&id=${itemIdOf(link)}`));
        if (response.status) {
          Joomla.helixModal.megamenu({
            title: parent === "1" ? "Mega Menu" : "Settings",
            className: "hu-mega-menu-builder",
            targetType: "id",
            target: "megaMenuModal",
            body: response.html
          });
          Joomla.helixMegaMenu?.run();
        }
      } catch (error) {
        Joomla.HelixToaster.error("Something went wrong!", "Error");
      }
    });
    delegate(document, "click", ".hu-branch-tools .hu-branch-tools-list-delete", async (event, link) => {
      event.preventDefault();
      closeToolbar();
      if (!window.confirm("Are you sure to delete the item?")) return;
      try {
        await request(`${config.base}/administrator/index.php?option=com_menus&task=items.trash&cid[]=${itemIdOf(link)}`, {
          responseType: "text"
        });
        fetchMenuItems(menuType);
      } catch (error) {
        Joomla.HelixToaster.error("Something went wrong!", "Error");
      }
      rebuildMenu();
      Joomla.HelixToaster.error("Menu item has been successfully removed!", "Success");
    });
    async function handleBranchOrdering(parent) {
      const tree = Joomla.sortable;
      if (!tree) return;
      const children = parent ? tree.getChildren(parent) : tree.getRootChildren();
      if (!children.length) return;
      const data = param({
        cid: children.map((child) => child.dataset.itemid),
        order: children.map((child, index) => index + 1)
      });
      try {
        await request(`${config.base}/administrator/index.php?option=com_menus&view=items&task=items.saveOrderAjax&tmpl=component`, {
          method: "POST",
          data,
          responseType: "text"
        });
        Joomla.reloadPreview?.();
      } catch (error) {
        console.error("Could not save the menu order", error);
      }
    }
    document.addEventListener("sortCompleted", async (event) => {
      const { item } = event.detail;
      const parent = Joomla.sortable ? Joomla.sortable.getParent(item) : null;
      const parentId = Number(item.dataset.parent);
      const newParentId = parent ? Number(parent.dataset.itemid) : 1;
      if (parentId !== newParentId) {
        try {
          const response = await request(helixUrl("parentAdoption"), {
            method: "POST",
            data: { id: item.dataset.itemid ?? "", parent: String(newParentId) }
          });
          if (response.status) {
            item.setAttribute("data-parent", String(newParentId));
            handleBranchOrdering(parent);
          }
        } catch (error) {
          Joomla.HelixToaster.error("Something went wrong!", "Error");
        }
        return;
      }
      handleBranchOrdering(parent);
    });
    const showSpinner = (status) => {
      document.querySelectorAll(".hu-spinner").forEach((spinner) => spinner.classList.toggle("hidden", !status));
    };
    function readResponse(html) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const heading = doc.querySelector(".alert-heading");
      const message = doc.querySelector(".alert-message");
      const noscript = doc.querySelector("#system-message-container noscript");
      let error = "";
      if (noscript) {
        const messages = new DOMParser().parseFromString(noscript.textContent ?? "", "text/html");
        if (messages.querySelector(".alert-danger")) {
          error = noscript.innerHTML;
        }
      }
      return {
        type: heading ? heading.textContent ?? "" : "",
        message: message ? message.textContent ?? "" : "",
        error
      };
    }
    function openItemModal({ title, target, className, frameUrl }, task) {
      Joomla.helixModal.frame({ title, targetType: "id", target, className, frameUrl });
      const modal = document.querySelector(`.hu-modal.${className}`);
      const frame = modal?.querySelector("iframe");
      const saveButton = modal?.querySelector(".hu-save-btn");
      if (!modal || !frame || !saveButton) return;
      saveButton.disabled = true;
      modal.querySelector(".hu-cancel-btn")?.addEventListener("click", () => Joomla.helixModal.close());
      frame.addEventListener("load", () => {
        saveButton.disabled = false;
      });
      saveButton.addEventListener(
        "click",
        Joomla.utils.debounce(async () => {
          const frameWindow = frame.contentWindow;
          const frameDoc = frameWindow?.document;
          const form = frameDoc?.querySelector("form");
          if (!frameDoc || !form) return;
          const taskInput = form.querySelector("input[name=task]");
          if (taskInput) {
            taskInput.value = task;
            taskInput.setAttribute("value", task);
          }
          const validator = frameDoc.formvalidator;
          if (validator && !validator.isValid(form)) return;
          showSpinner(true);
          try {
            const html = await request(form.getAttribute("action") ?? "", {
              method: "POST",
              data: serialize(form),
              responseType: "text"
            });
            const response = readResponse(html);
            if (response.error) {
              Joomla.HelixToaster.error(response.error, "Error");
            } else if (html && response.type !== "Error") {
              fetchMenuItems(menuType);
              Joomla.helixModal.close();
              Joomla.HelixToaster.success(
                task === "item.apply" ? "Menu item has been successfully added!" : "Changes have been successfully saved!",
                task === "item.apply" ? "Saved" : "Updated"
              );
            } else {
              Joomla.HelixToaster.error(response.message, "Error");
            }
          } catch (error) {
            Joomla.HelixToaster.error("Something went wrong!", "Error");
          }
          showSpinner(false);
        }, 500)
      );
    }
    delegate(document, "click", ".hu-branch-tools .hu-branch-tools-list-edit", (event, link) => {
      event.preventDefault();
      closeToolbar();
      openItemModal(
        {
          title: "Edit Menu Item",
          target: "editMenuItem",
          className: "edit-menu-item",
          frameUrl: `${config.base}/administrator/index.php?option=com_menus&task=item.edit&tmpl=component&menutype=${encodeURIComponent(menuType)}&id=${itemIdOf(link)}`
        },
        "item.save"
      );
    });
    delegate(document, "click", ".hu-add-menu-item", (event) => {
      event.preventDefault();
      openItemModal(
        {
          title: "Add New Item",
          target: "addNewMenuItem",
          className: "add-new-menu-item",
          frameUrl: `${config.base}/administrator/index.php?option=com_menus&task=item.add&tmpl=component&menutype=${encodeURIComponent(menuType)}`
        },
        "item.apply"
      );
    });
  });
})();
