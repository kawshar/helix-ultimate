/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
*/

document.addEventListener('DOMContentLoaded', () => {
	const dash = document.querySelector('[data-hu-dash]');

	if (!dash) {
		return;
	}

	// Switch to another tab of the style edit form (e.g. Menu Assignment).
	// The tab buttons are built by <joomla-tab> after load, so look them up on click.
	dash.querySelectorAll('[data-hu-tab]').forEach(button => {
		button.addEventListener('click', () => {
			const tab = document.querySelector(`[role="tab"][aria-controls="${button.dataset.huTab}"]`);

			if (tab) {
				tab.click();
				tab.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		});
	});

	// Duplicate this style through the core styles controller.
	dash.querySelectorAll('[data-hu-duplicate]').forEach(button => {
		button.addEventListener('click', () => {
			if (!window.confirm(dash.dataset.confirmDuplicate)) {
				return;
			}

			const form = document.createElement('form');
			form.method = 'post';
			form.action = dash.dataset.duplicateUrl;
			form.hidden = true;

			const fields = {
				task: 'styles.duplicate',
				'cid[]': dash.dataset.styleId,
				[dash.dataset.token]: '1',
			};

			Object.entries(fields).forEach(([name, value]) => {
				const input = document.createElement('input');
				input.type = 'hidden';
				input.name = name;
				input.value = value;
				form.appendChild(input);
			});

			document.body.appendChild(form);
			form.submit();
		});
	});

	// Open the customizer on the chosen setting group.
	dash.querySelectorAll('[data-hu-jump]').forEach(select => {
		select.addEventListener('change', () => {
			if (select.value) {
				window.location.href = select.value;
			}
		});
	});
});
