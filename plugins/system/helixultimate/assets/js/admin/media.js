/* Generated from assets/ts/admin by scripts/build-admin.mjs. Edit the .ts source, not this file. */
"use strict";
(() => {
  // plugins/system/helixultimate/assets/ts/admin/media.ts
  /**
   * @package Helix Ultimate Framework
   * @author JoomShaper https://www.joomshaper.com
   * @copyright Copyright (c) 2010 - 2025 JoomShaper
   * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
   */
  document.addEventListener("DOMContentLoaded", () => {
    const { fire, delegate, readData, request, show, hide } = Joomla.utils;
    const PRELOADER = `<div class="hu-modal-preloader">${Joomla.utils.icon("spinner", { className: "hu-spin", size: 28 })}</div>`;
    const q = (selector) => document.querySelector(selector);
    const task = (action, data = {}) => request(window.location.href, {
      method: "POST",
      data: new URLSearchParams({ action, option: "com_ajax", helix: "ultimate", request: "task", format: "json", ...data })
    });
    const setHTML = (selector, html) => {
      const element = q(selector);
      if (element) element.innerHTML = html ?? "";
    };
    const selected = () => q(".hu-media-selected");
    const showFolderActions = () => {
      hide(q(".hu-modal-actions-left"));
      show(q(".hu-modal-actions-right"));
    };
    async function browse(path) {
      document.querySelectorAll(".hu-media-selected").forEach((item) => item.classList.remove("hu-media-selected"));
      showFolderActions();
      setHTML(".hu-modal-inner", PRELOADER);
      try {
        const data = await task("view-media", path === void 0 ? {} : { path });
        if (data.status) {
          setHTML(".hu-modal-breadcrumbs", data.breadcrumbs);
          setHTML(".hu-modal-inner", data.output);
        } else {
          alert(data.output);
        }
      } catch (error) {
        alert("Somethings wrong, Try again");
      }
    }
    delegate(document, "click", ".hu-media-picker", async (event, picker) => {
      event.preventDefault();
      let targetType = "id";
      let target = "";
      if (picker.dataset.id !== void 0) {
        target = String(readData(picker, "id") ?? "");
      } else if (picker.dataset.target !== void 0) {
        targetType = "data";
        target = String(readData(picker, "target") ?? "");
      }
      Joomla.helixModal.media({ target_type: targetType, target });
      const icon = picker.querySelector(".hu-icon");
      if (icon) icon.classList.add("hu-spin");
      try {
        const data = await task("view-media");
        if (data.status) {
          setHTML(".hu-modal-breadcrumbs", data.breadcrumbs);
          setHTML(".hu-modal-inner", data.output);
        } else {
          Joomla.helixModal.close();
          alert(data.output);
        }
      } catch (error) {
        alert("Somethings wrong, Try again");
      }
      if (icon) icon.classList.remove("hu-spin");
    });
    delegate(document, "dblclick", ".hu-media-folder", (event, folder) => {
      event.preventDefault();
      browse(folder.dataset.path);
    });
    delegate(document, "click", ".hu-media-breadcrumb-item > a", (event, link) => {
      event.preventDefault();
      browse(link.dataset.path);
    });
    delegate(document, "click", ".hu-media-folder, .hu-media-image", (event, item) => {
      event.preventDefault();
      document.querySelectorAll(".hu-media-selected").forEach((other) => other.classList.remove("hu-media-selected"));
      item.classList.add("hu-media-selected");
      const selectButton = q(".hu-modal-action-select");
      if (selectButton) {
        if (item.classList.contains("hu-media-folder")) {
          hide(selectButton);
        } else {
          selectButton.removeAttribute("style");
        }
      }
      show(q(".hu-modal-actions-left"));
      hide(q(".hu-modal-actions-right"));
    });
    delegate(document, "click", ".hu-modal-action-select", (event) => {
      event.preventDefault();
      const item = selected();
      const modal = q(".hu-modal");
      if (!item || !modal) return;
      const value = item.dataset.path ?? "";
      const preview = item.dataset.preview ?? "";
      const target = modal.getAttribute("data-target") ?? "";
      const input = modal.getAttribute("data-target_type") === "data" ? q(`:is(.hu-options-modal, .hu-subpanel.is-active:not([inert])) .hu-options-modal-content [data-attrname="${target}"]`) : document.getElementById(target);
      if (input) {
        input.value = value;
        fire(input);
        const holder = input.previousElementSibling;
        if (holder && holder.classList.contains("hu-image-holder")) {
          holder.innerHTML = "";
          const image = document.createElement("img");
          image.src = preview;
          image.alt = "";
          holder.appendChild(image);
        }
        [...input.parentElement?.children ?? []].filter((sibling) => sibling.classList.contains("hu-media-clear")).forEach((clear) => clear.classList.remove("hide"));
      }
      Joomla.helixModal.close();
    });
    delegate(document, "click", ".hu-modal-action-cancel", (event) => {
      event.preventDefault();
      const item = selected();
      if (item) item.classList.remove("hu-media-selected");
      showFolderActions();
    });
    delegate(document, "click", ".action-hu-modal-close", (event) => {
      event.preventDefault();
      Joomla.helixModal.close();
    });
    delegate(document, "click", ".hu-media-clear", (event, clear) => {
      event.preventDefault();
      const parent = clear.parentElement;
      if (!parent) return;
      const input = parent.querySelector("input");
      if (input) {
        input.value = "";
        fire(input);
      }
      const holder = parent.querySelector(".hu-image-holder");
      if (holder) holder.innerHTML = "";
      clear.classList.add("hide");
    });
    delegate(document, "click", ".hu-modal-action-delete", async (event) => {
      event.preventDefault();
      const item = selected();
      if (!item) {
        alert("Please select a file or directory first to delete.");
        return;
      }
      const type = item.classList.contains("hu-media-folder") ? "folder" : "file";
      if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
      try {
        const data = await task("delete-media", { type, path: item.dataset.path ?? "" });
        if (data.status) {
          item.remove();
          showFolderActions();
        } else {
          alert(data.message);
        }
      } catch (error) {
        alert("Somethings wrong, Try again");
      }
    });
    delegate(document, "click", ".hu-modal-action-new-folder", async (event) => {
      event.preventDefault();
      const folderName = prompt("Please enter the name of the directory which should be created.");
      if (!folderName) return;
      const current = q(".hu-media-breadcrumb-item.active");
      try {
        const data = await task("create-folder", {
          folder_name: folderName,
          path: current?.dataset.path ?? ""
        });
        if (data.status) {
          setHTML(".hu-modal-inner", data.output);
        } else {
          alert(data.message);
        }
      } catch (error) {
        alert("Somethings wrong, Try again");
      }
    });
    const ALLOWED_UPLOADS = ["png", "jpg", "jpeg", "webp", "gif", "svg"];
    const mediaText = (key, fallback) => {
      const value = Joomla.Text ? Joomla.Text._(key) : "";
      return value && value !== key ? value : fallback;
    };
    function canUpload(file) {
      const extension = (file.name.split(".").pop() ?? "").toLowerCase();
      if (!ALLOWED_UPLOADS.includes(extension)) {
        alert(Joomla.Text._("COM_SPPAGEBUILDER_MEDIA_MANAGER_FILE_NOT_SUPPORTED", "File not supported"));
        return false;
      }
      return true;
    }
    function sendUpload(file, path, index, onProgress) {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        const xhr = new XMLHttpRequest();
        const token = Joomla.getOptions("csrf.token");
        formData.append("file", file);
        formData.append("path", path);
        formData.append("index", index);
        xhr.open("POST", `index.php?option=com_ajax&helix=ultimate&request=task&action=upload-media&format=json&helix_id=${window.helixUltimateStyleId}`);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        if (token) xhr.setRequestHeader("X-CSRF-Token", token);
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) onProgress(Math.floor(event.loaded / event.total * 100));
        });
        xhr.addEventListener("load", () => {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (error) {
            resolve({ status: false, message: "Somethings wrong, Try again" });
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.send(formData);
      });
    }
    function uploadMedia(file, path) {
      const index = `media-id-${Math.floor(Math.random() * 1e6) + 1}`;
      const list = q(".hu-media");
      const manager = document.getElementById("hu-media-manager");
      if (list) {
        list.insertAdjacentHTML(
          "beforeend",
          `<li class="hu-media-progress ${index}">
					<div class="hu-media-thumb"><div class="hu-progress"><div class="hu-progress-bar"></div></div></div>
					<div class="hu-media-label">${Joomla.utils.icon("spinner", { className: "hu-spin" })} <span class="hu-media-upload-percentage"></span>Uploading...</div>
				</li>`
        );
      }
      if (manager) manager.scrollTo({ top: manager.scrollHeight, behavior: "smooth" });
      const item = () => q(`.${index}`);
      sendUpload(file, path, index, (percent) => {
        const element = item();
        const bar = element?.querySelector(".hu-progress-bar");
        const label = element?.querySelector(".hu-media-upload-percentage");
        if (bar) bar.style.width = `${percent}%`;
        if (label) label.textContent = `${percent}% `;
      }).then((data) => {
        const element = item();
        if (!element) return;
        if (data.status) {
          element.className = "hu-media-image";
          element.setAttribute("data-path", data.path ?? "");
          element.setAttribute("data-preview", data.src ?? "");
          element.innerHTML = data.output ?? "";
        } else {
          element.remove();
          alert(data.message);
        }
      }).catch(() => {
        item()?.remove();
        alert("Somethings wrong, Try again");
      });
    }
    function syncMediaField(field) {
      const input = field.querySelector("input[type=hidden]");
      const picker = field.querySelector(".hu-media-picker");
      const name = field.querySelector(".hu-media-picker__name");
      const clear = field.querySelector(".hu-media-clear");
      const holder = field.querySelector(".hu-image-holder");
      const value = input?.value ?? "";
      field.classList.toggle("is-empty", value === "");
      field.dataset.dropLabel = mediaText("HELIX_ULTIMATE_MEDIA_DROP_HERE", "Drop to upload");
      if (name) name.textContent = value.split("/").pop() ?? "";
      if (clear) clear.classList.toggle("hide", value === "");
      if (holder && value === "") holder.innerHTML = "";
      if (picker) {
        picker.title = value === "" ? mediaText("HELIX_ULTIMATE_MEDIA_CHOOSE", "Choose image") : mediaText("HELIX_ULTIMATE_MEDIA_REPLACE", "Replace");
      }
    }
    document.querySelectorAll(".hu-media-field").forEach(syncMediaField);
    delegate(document, "change", ".hu-media-field input[type=hidden]", (event, input) => {
      const field = input.closest(".hu-media-field");
      if (field) syncMediaField(field);
    });
    new MutationObserver((records) => {
      records.forEach(
        (record) => record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(".hu-media-field")) syncMediaField(node);
          node.querySelectorAll(".hu-media-field").forEach(syncMediaField);
        })
      );
    }).observe(document.body, { childList: true, subtree: true });
    const hasFiles = (event) => Boolean(event.dataTransfer && [...event.dataTransfer.types].includes("Files"));
    delegate(document, "dragover", ".hu-media-field", (event, field) => {
      if (!hasFiles(event) || field.classList.contains("is-uploading")) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      field.classList.add("is-dragover");
    });
    delegate(document, "dragleave", ".hu-media-field", (event, field) => {
      if (!field.contains(event.relatedTarget)) field.classList.remove("is-dragover");
    });
    delegate(document, "drop", ".hu-media-field", (event, field) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      field.classList.remove("is-dragover");
      const file = event.dataTransfer?.files[0];
      const input = field.querySelector("input[type=hidden]");
      if (!file || !input || field.classList.contains("is-uploading") || !canUpload(file)) return;
      const name = field.querySelector(".hu-media-picker__name");
      const previous = name?.textContent ?? "";
      field.classList.add("is-uploading");
      field.style.setProperty("--hu-media-progress", "0%");
      if (name) name.textContent = mediaText("HELIX_ULTIMATE_MEDIA_UPLOADING", "Uploading…");
      sendUpload(file, "/images", `media-drop-${Date.now()}`, (percent) => field.style.setProperty("--hu-media-progress", `${percent}%`)).then((data) => {
        if (!data.status || !data.path) {
          alert(data.message);
          if (name) name.textContent = previous;
          return;
        }
        const holder = field.querySelector(".hu-image-holder");
        if (holder) {
          holder.innerHTML = "";
          const image = document.createElement("img");
          image.src = data.src ?? "";
          image.alt = "";
          holder.appendChild(image);
        }
        input.value = data.path;
        fire(input);
      }).catch(() => {
        if (name) name.textContent = previous;
        alert("Somethings wrong, Try again");
      }).finally(() => {
        field.classList.remove("is-uploading");
        syncMediaField(field);
      });
    });
    delegate(document, "dragover", "#hu-media-manager", (event, manager) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      manager.classList.add("is-dragover");
    });
    delegate(document, "dragleave", "#hu-media-manager", (event, manager) => {
      if (!manager.contains(event.relatedTarget)) manager.classList.remove("is-dragover");
    });
    delegate(document, "drop", "#hu-media-manager", (event, manager) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      manager.classList.remove("is-dragover");
      const current = q(".hu-media-breadcrumb-item.active");
      [...event.dataTransfer?.files ?? []].forEach((file) => {
        if (canUpload(file)) uploadMedia(file, current?.dataset.path ?? "");
      });
    });
    ["dragover", "drop"].forEach(
      (type) => document.addEventListener(type, (event) => {
        if (hasFiles(event) && !(event.target instanceof Element && event.target.closest(".hu-media-field, #hu-media-manager"))) {
          event.preventDefault();
        }
      })
    );
    delegate(document, "click", ".hu-modal-action-upload", (event) => {
      event.preventDefault();
      const input = document.getElementById("hu-file-input");
      if (input) input.click();
    });
    delegate(document, "change", "#hu-file-input", (event, input) => {
      const current = q(".hu-media-breadcrumb-item.active");
      [...input.files ?? []].forEach((file) => {
        if (canUpload(file)) uploadMedia(file, current?.dataset.path ?? "");
      });
      input.value = "";
    });
  });
})();
