/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Presets: edit a preset's colours in a modal, apply or reset to default.
 */
document.addEventListener('DOMContentLoaded', () => {
	const { delegate, readData } = Joomla.utils;

	const presetsDataElement = document.querySelector('.hu-presets #presets-data');

	if (!presetsDataElement) return;

	let presetsData = presetsDataElement.value;

	if (typeof presetsData === 'string' && presetsData.length) {
		presetsData = JSON.parse(presetsData);
	}

	/** The colour used most often in a preset paints its tile. */
	function detectMajorColor(presetData) {
		const frequency = Object.values(presetData).reduce((accumulator, color) => {
			accumulator[color] = (accumulator[color] || 0) + 1;
			return accumulator;
		}, {});

		let max = 0;

		return Object.entries(frequency).reduce((major, [color, count]) => {
			if (count >= max) {
				max = count;
				major = color;
			}

			return major;
		}, '');
	}

	const closeModal = () => {
		document.querySelectorAll('.hu-options-modal-overlay, .hu-options-modal').forEach(element => element.remove());
		document.body.classList.remove('hu-options-modal-open');
	};

	function reflectPresetChanges(data, name, originalContainer, editedContainer) {
		presetsData[name].data = data;
		presetsDataElement.value = JSON.stringify(presetsData);

		const presetElement = document.querySelector(`.hu-preset[data-preset="${name}"]`);

		if (presetElement) {
			Object.entries(data).forEach(([key, value]) => presetElement.setAttribute(`data-${key}`, value));
		}

		/**
		 * Keep the edited fields as the new original, so the next time the
		 * modal opens it shows the last changes.
		 */
		originalContainer.replaceChildren(...editedContainer.querySelectorAll(':scope > div'));

		window.purgeCss();
		closeModal();

		if (presetElement) {
			const majorColor = detectMajorColor(data);
			const editButton = presetElement.querySelector('.hu-edit-preset');

			presetElement.style.backgroundColor = majorColor;
			if (editButton) editButton.style.color = majorColor;

			presetElement.click();
		}
	}

	delegate(document, 'click', '.hu-edit-preset', (event, button) => {
		event.preventDefault();
		event.stopPropagation();

		const { name, data } = readData(button, 'preset_data') || {};
		const originalContainer = document.querySelector(`.hu-preset-container#${name}`);

		if (!originalContainer) return;

		// Edit a copy, so cancelling leaves the original untouched.
		const container = originalContainer.cloneNode(true);

		// Avoid duplicate ids between the copy and the original.
		container.querySelectorAll('input').forEach(input => input.removeAttribute('id'));

		Joomla.helixModal.settings({
			flag: 'edit-presets',
			title: `<span class='fas fa-cogs hu-mr-2'></span> Edit Preset: ${name}`,
			class: `hu-modal-small edit-preset-modal modal-${name}`,
			applyBtnClass: 'hu-save-preset',
			footerButtons: [
				'<a href="#" class="hu-btn hu-btn-secondary helix-preset-reset hu-ml-auto"><span class="fas fa-sync-alt" aria-hidden="true"></span> Reset to Default</a>',
			],
		});

		container.removeAttribute('id');
		container.removeAttribute('style');
		container.classList.add('hu-options-modal-content');

		const modal = document.querySelector(`.edit-preset-modal.modal-${name}`);
		modal.querySelector('.hu-options-modal-inner').replaceChildren(container);

		// Collect the edited colours.
		container.querySelectorAll('input.preset-control').forEach(input => {
			input.addEventListener('change', () => {
				data[input.name] = input.value;
			});
		});

		modal.querySelector('.hu-save-preset').addEventListener('click', applyEvent => {
			applyEvent.preventDefault();
			reflectPresetChanges(data, name, originalContainer, container);
		});

		modal.querySelector('.helix-preset-reset').addEventListener('click', resetEvent => {
			resetEvent.preventDefault();

			if (window.confirm('Do you really want to reset your changes to default?')) {
				const defaults = JSON.parse(document.getElementById('default-values').value);
				reflectPresetChanges(defaults[name], name, originalContainer, container);
			}
		});
	});
});
