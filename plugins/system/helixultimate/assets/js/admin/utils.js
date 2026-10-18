/* Generated from assets/ts/admin by scripts/build-admin.mjs. Edit the .ts source, not this file. */
"use strict";
(() => {
  // plugins/system/helixultimate/assets/ts/admin/utils.ts
  /**
   * @package Helix Ultimate Framework
   * @author JoomShaper https://www.joomshaper.com
   * @copyright Copyright (c) 2010 - 2025 JoomShaper
   * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
   */
  var asciiToHex = (str) => "0x" + str.split("").map((char) => char.charCodeAt(0).toString(16)).join("");
  var getCurrentTimeString = () => {
    const date = /* @__PURE__ */ new Date();
    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "-" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMinutes();
  };
  var helixHash = (str) => {
    let hash = 0;
    const { length } = str;
    if (length === 0) return hash;
    for (let i = 0; i < length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash;
    }
    return hash;
  };
  var triggerEvent = (element, eventName) => {
    if (element) {
      element.dispatchEvent(new Event(eventName, { bubbles: false, cancelable: false }));
    }
  };
  var fire = (element, eventName = "change", detail = null) => {
    if (!element) return;
    const event = detail === null ? new Event(eventName, { bubbles: true, cancelable: true }) : new CustomEvent(eventName, { bubbles: true, cancelable: true, detail });
    element.dispatchEvent(event);
  };
  var delegate = (root, type, selector, handler, options) => {
    root.addEventListener(
      type,
      (event) => {
        const target = event.target instanceof Element ? event.target.closest(selector) : null;
        if (target && root.contains(target)) {
          handler.call(target, event, target);
        }
      },
      options
    );
  };
  var parseDataValue = (value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    if (value === "null") return null;
    if (value !== "" && String(+value) === value) return +value;
    if (/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/.test(value)) {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    }
    return value;
  };
  function readData(element, key) {
    if (!element) return key === void 0 ? {} : void 0;
    if (key !== void 0) {
      const value = element.dataset[key];
      return value === void 0 ? void 0 : parseDataValue(value);
    }
    return Object.fromEntries(
      Object.entries(element.dataset).map(([name, value]) => [name, parseDataValue(value ?? "")])
    );
  }
  var serialize = (container, exclude = "") => {
    const params = new URLSearchParams();
    container.querySelectorAll("input, select, textarea").forEach((field) => {
      const type = (field.type || "").toLowerCase();
      if (!field.name || field.disabled || exclude && field.matches(exclude)) return;
      if (["submit", "button", "image", "reset", "file"].includes(type)) return;
      if ((type === "checkbox" || type === "radio") && !field.checked) return;
      if (field instanceof HTMLSelectElement) {
        [...field.selectedOptions].forEach((option) => params.append(field.name, option.value));
        return;
      }
      params.append(field.name, field.value.replace(/\r?\n/g, "\r\n"));
    });
    return params;
  };
  async function request(url, { method = "GET", data = null, responseType = "json" } = {}) {
    const headers = { "X-Requested-With": "XMLHttpRequest" };
    const token = Joomla.getOptions("csrf.token");
    if (token) headers["X-CSRF-Token"] = token;
    let body;
    if (data) {
      body = data instanceof URLSearchParams || data instanceof FormData ? data : new URLSearchParams(data);
    }
    const response = await fetch(url, { method, headers, body, credentials: "same-origin" });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    if (responseType === "text") return text;
    return text ? JSON.parse(text) : {};
  }
  var ajaxUrl = (action, extra = "") => {
    const id = window.helixUltimateStyleId;
    return `index.php?option=com_ajax&request=task&helix=ultimate&id=${id}&action=${action}&format=json&helix_id=${id}${extra}`;
  };
  var show = (element, display = "") => {
    if (element) element.style.display = display;
  };
  var hide = (element) => {
    if (element) element.style.display = "none";
  };
  var toggle = (element, visible, display = "") => visible ? show(element, display) : hide(element);
  var tooltip = (container, { placement = "right" } = {}) => {
    if (!container) return;
    let tip = document.querySelector(".hu-tooltip");
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "hu-tooltip";
      tip.setAttribute("role", "tooltip");
      tip.hidden = true;
      document.body.appendChild(tip);
    }
    const tipEl = tip;
    const showTip = (element) => {
      const title = element.getAttribute("title");
      if (title) {
        element.dataset.huTitle = title;
        element.removeAttribute("title");
      }
      const text = element.dataset.huTitle;
      if (!text) return;
      tipEl.textContent = text;
      tipEl.hidden = false;
      const rect = element.getBoundingClientRect();
      const tipRect = tipEl.getBoundingClientRect();
      let top;
      let left;
      if (placement === "right") {
        top = rect.top + rect.height / 2 - tipRect.height / 2;
        left = rect.right + 10;
      } else {
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2 - tipRect.width / 2;
      }
      tipEl.style.top = `${Math.max(4, top)}px`;
      tipEl.style.left = `${Math.max(4, Math.min(left, window.innerWidth - tipRect.width - 4))}px`;
    };
    const hideTip = (element) => {
      tipEl.hidden = true;
      if (element && element.dataset.huTitle) {
        element.setAttribute("title", element.dataset.huTitle);
      }
    };
    const target = (event) => event.target instanceof Element ? event.target.closest("[title], [data-hu-title]") : null;
    container.addEventListener("mouseover", (event) => {
      const element = target(event);
      if (element && container.contains(element)) showTip(element);
    });
    container.addEventListener("mouseout", (event) => {
      const element = target(event);
      if (element && !element.contains(event.relatedTarget)) hideTip(element);
    });
    container.addEventListener("focusin", (event) => {
      const element = target(event);
      if (element) showTip(element);
    });
    container.addEventListener("focusout", (event) => hideTip(target(event)));
    container.addEventListener("click", () => tipEl.hidden = true);
  };
  var param = (data, params = new URLSearchParams()) => {
    const add = (key, value) => {
      value = typeof value === "function" ? value() : value;
      params.append(key, value === null || value === void 0 ? "" : String(value));
    };
    const build = (prefix, value) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (/\[\]$/.test(prefix)) {
            add(prefix, item);
          } else {
            build(`${prefix}[${typeof item === "object" && item !== null ? index : ""}]`, item);
          }
        });
      } else if (value !== null && typeof value === "object") {
        Object.entries(value).forEach(([key, item]) => build(`${prefix}[${key}]`, item));
      } else {
        add(prefix, value);
      }
    };
    Object.entries(data || {}).forEach(([key, value]) => build(key, value));
    return params;
  };
  var t = (key, fallback) => {
    const value = window.Joomla && Joomla.Text ? Joomla.Text._(key) : "";
    return value && value !== key ? value : fallback;
  };
  var searchSelectCount = 0;
  function searchSelect(select, labels = {}) {
    if (select.dataset.huPicker) return;
    select.dataset.huPicker = "1";
    const id = `hu-font-picker-${++searchSelectCount}`;
    const searchLabel = labels.search || t("JSEARCH_FILTER", "Search");
    const emptyLabel = labels.empty || 'Nothing matches "%s"';
    const picker = document.createElement("div");
    picker.className = "hu-font-picker";
    picker.innerHTML = `
		<button type="button" class="hu-font-picker__toggle" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-popover">
			<span class="hu-font-picker__value"></span>
			<span class="fas fa-chevron-down" aria-hidden="true"></span>
		</button>
		<div class="hu-font-picker__popover" id="${id}-popover" hidden>
			<div class="hu-font-picker__search-wrap">
				<span class="fas fa-search" aria-hidden="true"></span>
				<input type="text" class="hu-font-picker__search" role="combobox" autocomplete="off" spellcheck="false"
					aria-autocomplete="list" aria-expanded="true" aria-controls="${id}-list"
					placeholder="${searchLabel}"
					aria-label="${searchLabel}">
			</div>
			<ul class="hu-font-picker__list" role="listbox" id="${id}-list"></ul>
			<p class="hu-font-picker__empty" hidden></p>
		</div>`;
    select.classList.add("hu-font-picker__native");
    select.setAttribute("tabindex", "-1");
    select.setAttribute("aria-hidden", "true");
    select.after(picker);
    const toggleButton = picker.querySelector(".hu-font-picker__toggle");
    const valueEl = picker.querySelector(".hu-font-picker__value");
    const popover = picker.querySelector(".hu-font-picker__popover");
    const search = picker.querySelector(".hu-font-picker__search");
    const list = picker.querySelector(".hu-font-picker__list");
    const empty = picker.querySelector(".hu-font-picker__empty");
    let options = [];
    let active = -1;
    const syncValue = () => {
      const option = select.selectedOptions[0];
      valueEl.textContent = (option && option.value !== "" ? (option.textContent ?? "").trim() : "") || labels.placeholder || t("HELIX_ULTIMATE_SELECT", "Select");
    };
    const readOptions = () => [...select.querySelectorAll("option")].map((option) => ({
      value: option.value,
      label: (option.textContent ?? "").trim(),
      group: option.parentElement instanceof HTMLOptGroupElement ? option.parentElement.label : ""
    }));
    const items = () => [...list.querySelectorAll(".hu-font-picker__option")];
    const highlight = (index) => {
      const all = items();
      all.forEach((item) => item.classList.remove("is-active"));
      if (!all.length) {
        active = -1;
        search.removeAttribute("aria-activedescendant");
        return;
      }
      active = Math.max(0, Math.min(index, all.length - 1));
      all[active].classList.add("is-active");
      all[active].scrollIntoView({ block: "nearest" });
      search.setAttribute("aria-activedescendant", all[active].id);
    };
    const renderList = () => {
      const query = search.value.trim().toLowerCase();
      const matches = query ? options.filter((option) => option.label.toLowerCase().includes(query)) : options;
      list.innerHTML = "";
      active = -1;
      let group = null;
      matches.forEach((option, index) => {
        if (option.group !== group) {
          group = option.group;
          if (group) {
            const heading = document.createElement("li");
            heading.className = "hu-font-picker__group";
            heading.setAttribute("role", "presentation");
            heading.textContent = group;
            list.appendChild(heading);
          }
        }
        const item = document.createElement("li");
        item.className = "hu-font-picker__option";
        item.id = `${id}-option-${index}`;
        item.setAttribute("role", "option");
        item.dataset.value = option.value;
        item.textContent = option.label;
        if (option.value === select.value) {
          item.setAttribute("aria-selected", "true");
          active = index;
        }
        list.appendChild(item);
      });
      empty.hidden = matches.length > 0;
      empty.textContent = emptyLabel.replace("%s", search.value.trim());
      highlight(active === -1 && matches.length ? 0 : active);
    };
    const open = () => {
      options = readOptions();
      search.value = "";
      popover.hidden = false;
      toggleButton.setAttribute("aria-expanded", "true");
      picker.classList.add("is-open");
      renderList();
      search.focus();
    };
    const close = (restoreFocus = true) => {
      if (popover.hidden) return;
      popover.hidden = true;
      toggleButton.setAttribute("aria-expanded", "false");
      picker.classList.remove("is-open");
      if (restoreFocus) toggleButton.focus();
    };
    const choose = (value) => {
      if (value !== void 0 && value !== select.value) {
        select.value = value;
        fire(select);
      }
      syncValue();
      close();
    };
    toggleButton.addEventListener("click", () => popover.hidden ? open() : close());
    search.addEventListener("input", renderList);
    search.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          highlight(active + 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          highlight(active - 1);
          break;
        case "Home":
          event.preventDefault();
          highlight(0);
          break;
        case "End":
          event.preventDefault();
          highlight(items().length - 1);
          break;
        case "Enter":
          event.preventDefault();
          if (items()[active]) choose(items()[active].dataset.value);
          break;
        case "Escape":
          event.preventDefault();
          event.stopPropagation();
          close();
          break;
        case "Tab":
          close(false);
          break;
      }
    });
    list.addEventListener("mousedown", (event) => event.preventDefault());
    list.addEventListener("click", (event) => {
      const item = event.target instanceof Element ? event.target.closest(".hu-font-picker__option") : null;
      if (item) choose(item.dataset.value);
    });
    document.addEventListener("mousedown", (event) => {
      if (!picker.contains(event.target)) close(false);
    });
    select.addEventListener("change", syncValue);
    syncValue();
  }
  var setCookie = (name, value = "", days = 1) => {
    let expires = "";
    if (days) {
      const date = /* @__PURE__ */ new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1e3);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
  };
  var getCookie = (name) => {
    name = name + "=";
    const cookieArray = document.cookie.split(";");
    for (let i = 0; i < cookieArray.length; i++) {
      let c = cookieArray[i];
      while (c.charAt(0) == " ") c = c.substring(1, c.length);
      if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return void 0;
  };
  var deleteCookie = (name) => {
    document.cookie = name + "=; Max-Age=-99999999;";
  };
  var debounce = (func, interval) => {
    let timeout = null;
    return function(...args) {
      const later = () => {
        timeout = null;
        func.apply(this, args);
      };
      if (timeout !== null) clearTimeout(timeout);
      timeout = setTimeout(later, interval || 200);
    };
  };
  var getCenterPosition = (element) => {
    const { top, left, width, height } = element.getBoundingClientRect();
    return {
      x: left + width / 2,
      y: top + height / 2
    };
  };
  var getDistance = (elementA, elementB) => {
    const positionA = getCenterPosition(elementA);
    const positionB = getCenterPosition(elementB);
    const distanceX = Math.floor(Math.abs(positionA.x - positionB.x));
    const distanceY = Math.floor(Math.abs(positionA.y - positionB.y));
    return { distanceX, distanceY };
  };
  function calculateSiblingDistances() {
    const tree = Joomla.sortable;
    if (!tree) return;
    document.querySelectorAll(".hu-menu-tree-branch").forEach((branch) => {
      const level = tree.getLevel(branch) || 1;
      const path = branch.querySelector(".hu-menu-branch-path");
      if (path) path.style.display = level > 1 ? "" : "none";
      if (level <= 1) return;
      const sibling = tree.nextSibling(branch);
      if (sibling) {
        const siblingPath = sibling.querySelector(".hu-menu-branch-path");
        const distance = getDistance(branch, sibling);
        if (siblingPath) siblingPath.style.height = `${Math.max(distance.distanceY + 8, 55)}px`;
        return;
      }
      const next = branch.nextElementSibling;
      const nextPath = next && next.querySelector(".hu-menu-branch-path");
      if (next && nextPath && tree.getLevel(next) > level) {
        nextPath.style.height = "55px";
      }
    });
  }
  var utils = {
    asciiToHex,
    getCurrentTimeString,
    helixHash,
    triggerEvent,
    fire,
    delegate,
    param,
    searchSelect,
    readData,
    serialize,
    request,
    ajaxUrl,
    show,
    hide,
    toggle,
    tooltip,
    setCookie,
    getCookie,
    deleteCookie,
    debounce,
    getDistance,
    calculateSiblingDistances
  };
  Joomla.utils = utils;
  Object.assign(window, {
    asciiToHex,
    getCurrentTimeString,
    helixHash,
    triggerEvent,
    fire,
    delegate,
    parseDataValue,
    readData,
    serialize,
    request,
    ajaxUrl,
    show,
    hide,
    toggle,
    tooltip,
    param,
    t,
    searchSelect,
    setCookie,
    getCookie,
    deleteCookie,
    debounce,
    getCenterPosition,
    getDistance,
    calculateSiblingDistances
  });
})();
