/* Generated from assets/ts/admin by scripts/build-admin.mjs. Edit the .ts source, not this file. */
"use strict";
(() => {
  // plugins/system/helixultimate/assets/ts/admin/devices-field.ts
  /**
   * @package Helix Ultimate Framework
   * @author JoomShaper https://www.joomshaper.com
   * @copyright Copyright (c) 2010 - 2025 JoomShaper
   * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
   */
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".helix-field").forEach((wrapper) => {
      const input = wrapper.querySelector("input");
      const buttons = wrapper.querySelectorAll(".helix-devices .device-btn");
      buttons.forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          const device = button.dataset.device ?? "";
          if (Joomla.helixSwitchDevice) {
            Joomla.helixSwitchDevice(device);
          }
          if (input) {
            input.value = device;
            Joomla.utils.fire(input);
          }
          buttons.forEach((other) => other.classList.toggle("active", other === button));
        });
      });
    });
  });
})();
