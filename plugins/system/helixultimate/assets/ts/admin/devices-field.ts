/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Devices field: buttons that store a device (`xs`, `sm`, `md`) and switch
 * the preview to it.
 */
document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll<HTMLElement>('.helix-field').forEach(wrapper => {
		const input = wrapper.querySelector('input');
		const buttons = wrapper.querySelectorAll<HTMLElement>('.helix-devices .device-btn');

		buttons.forEach(button => {
			button.addEventListener('click', event => {
				event.preventDefault();

				const device = button.dataset.device ?? '';

				if (Joomla.helixSwitchDevice) {
					Joomla.helixSwitchDevice(device);
				}

				if (input) {
					input.value = device;
					Joomla.utils.fire(input);
				}

				buttons.forEach(other => other.classList.toggle('active', other === button));
			});
		});
	});
});
