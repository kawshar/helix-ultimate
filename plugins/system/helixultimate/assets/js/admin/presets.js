/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Presets: tiles preview each palette; edit a preset's colours in a modal,
 * apply or reset to default.
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

	/* ------------------------------------------------------------------ */
	/* Tiles: a mini site preview drawn from each preset's own colours      */
	/* ------------------------------------------------------------------ */

	const color = (tile, key, fallback) => tile.getAttribute(`data-${key}`) || fallback;

	function renderPresetPreview(tile) {
		const contents = tile.querySelector('.hu-preset-contents');

		if (!contents) return;

		const accent = color(tile, 'link_color', '#1f3bff');

		contents.setAttribute('aria-hidden', 'true');
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

		const mock = contents.querySelector('.hu-preset-mock');
		const vars = {
			'--p-topbar': color(tile, 'topbar_bg_color', '#333'),
			'--p-header': color(tile, 'header_bg_color', '#fff'),
			'--p-logo': color(tile, 'logo_text_color', accent),
			'--p-menu': color(tile, 'menu_text_color', '#252525'),
			'--p-bg': color(tile, 'bg_color', '#fff'),
			'--p-text': color(tile, 'text_color', '#252525'),
			'--p-accent': accent,
		};

		Object.entries(vars).forEach(([name, value]) => mock.style.setProperty(name, value));
		tile.style.setProperty('--p-accent', accent);
	}

	/** Tiles act as a radio group: focusable, arrow keys move, Enter / Space pick. */
	function syncPresetState() {
		document.querySelectorAll('.hu-presets .hu-preset').forEach(tile => {
			const active = tile.classList.contains('active');
			tile.setAttribute('aria-checked', String(active));
			tile.tabIndex = active ? 0 : -1;
		});
	}

	const presetsGrid = presetsDataElement.closest('.hu-presets');
	const tiles = [...presetsGrid.querySelectorAll('.hu-preset')];

	presetsGrid.setAttribute('role', 'radiogroup');
	presetsGrid.setAttribute('aria-label', 'Presets');

	tiles.forEach(tile => {
		tile.setAttribute('role', 'radio');
		tile.setAttribute('aria-label', tile.querySelector('.hu-preset-title')?.textContent.trim() || tile.dataset.preset);
		renderPresetPreview(tile);

		const edit = tile.querySelector('.hu-edit-preset');

		if (edit) {
			edit.removeAttribute('style');
			edit.setAttribute('href', '#');
			edit.setAttribute('aria-label', `Edit ${tile.getAttribute('aria-label')}`);
			edit.title = 'Edit colours';
		}
	});

	if (!tiles.some(tile => tile.classList.contains('active')) && tiles[0]) tiles[0].tabIndex = 0;
	syncPresetState();

	// helix-ultimate.js marks the clicked tile active; mirror that for assistive tech.
	delegate(presetsGrid, 'click', '.hu-preset', () => requestAnimationFrame(syncPresetState));

	presetsGrid.addEventListener('keydown', event => {
		const tile = event.target.closest('.hu-preset');

		if (!tile || event.target !== tile) return;

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			tile.click();
			return;
		}

		const step = { ArrowRight: 1, ArrowDown: 2, ArrowLeft: -1, ArrowUp: -2 }[event.key];

		if (!step) return;

		event.preventDefault();

		const next = tiles[(tiles.indexOf(tile) + step + tiles.length) % tiles.length];
		next.click();
		next.focus();
	});

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

			presetElement.style.backgroundColor = majorColor;
			renderPresetPreview(presetElement);

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
