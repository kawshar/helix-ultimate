/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Presets: tiles preview each palette; edit a preset's colours in a step that
 * slides over the panel (Joomla.helixSubpanel), apply or reset to default.
 */

type PresetColors = Record<string, string>;

interface PresetEntry {
	label?: string;
	description?: string;
	default?: string;
	data: PresetColors;
}

type PresetsData = Record<string, PresetEntry>;

document.addEventListener('DOMContentLoaded', () => {
	const { delegate, readData } = Joomla.utils;

	const presetsDataElement = document.querySelector<HTMLInputElement>('.hu-presets #presets-data');

	if (!presetsDataElement) return;

	const dataElement = presetsDataElement;
	let presetsData: PresetsData = {};

	if (dataElement.value.length) {
		presetsData = JSON.parse(dataElement.value);
	}

	/** The colour used most often in a preset paints its tile. */
	function detectMajorColor(presetData: PresetColors): string {
		const frequency = Object.values(presetData).reduce<Record<string, number>>((accumulator, color) => {
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

	const color = (tile: Element, key: string, fallback: string): string => tile.getAttribute(`data-${key}`) || fallback;

	function renderPresetPreview(tile: HTMLElement): void {
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

		const mock = contents.querySelector<HTMLElement>('.hu-preset-mock')!;
		const vars: Record<string, string> = {
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
	function syncPresetState(): void {
		document.querySelectorAll<HTMLElement>('.hu-presets .hu-preset').forEach(tile => {
			const active = tile.classList.contains('active');
			tile.setAttribute('aria-checked', String(active));
			tile.tabIndex = active ? 0 : -1;
		});
	}

	const presetsGrid = dataElement.closest<HTMLElement>('.hu-presets')!;
	const tiles = [...presetsGrid.querySelectorAll<HTMLElement>('.hu-preset')];

	presetsGrid.setAttribute('role', 'radiogroup');
	presetsGrid.setAttribute('aria-label', 'Presets');

	tiles.forEach(tile => {
		tile.setAttribute('role', 'radio');
		tile.setAttribute('aria-label', tile.querySelector('.hu-preset-title')?.textContent?.trim() || tile.dataset.preset || '');
		renderPresetPreview(tile);

		const edit = tile.querySelector<HTMLElement>('.hu-edit-preset');

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
		const tile = event.target instanceof Element ? event.target.closest<HTMLElement>('.hu-preset') : null;

		if (!tile || event.target !== tile) return;

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			tile.click();
			return;
		}

		const steps: Record<string, number> = { ArrowRight: 1, ArrowDown: 2, ArrowLeft: -1, ArrowUp: -2 };
		const step = steps[event.key];

		if (!step) return;

		event.preventDefault();

		const next = tiles[(tiles.indexOf(tile) + step + tiles.length) % tiles.length];
		next.click();
		next.focus();
	});

	/* ------------------------------------------------------------------ */
	/* Editor: colours grouped by site area                                */
	/* ------------------------------------------------------------------ */

	/*
	 * Inside a group the field labels drop the group's words ("Menu Text Hover
	 * Color" under Menu reads "Hover"). These are new strings; the original
	 * language strings are left untouched and are used when a translation
	 * does not have the short one, and as each input's accessible name.
	 */
	const SHORT_LABELS: Record<string, [string, string]> = {
		topbar_bg_color: ['HELIX_ULTIMATE_PRESET_FIELD_BACKGROUND', 'Background'],
		topbar_text_color: ['HELIX_ULTIMATE_PRESET_FIELD_TEXT', 'Text'],
		header_bg_color: ['HELIX_ULTIMATE_PRESET_FIELD_BACKGROUND', 'Background'],
		logo_text_color: ['HELIX_ULTIMATE_PRESET_FIELD_LOGO', 'Logo'],
		menu_text_color: ['HELIX_ULTIMATE_PRESET_FIELD_TEXT', 'Text'],
		menu_text_hover_color: ['HELIX_ULTIMATE_PRESET_FIELD_HOVER', 'Hover'],
		menu_text_active_color: ['HELIX_ULTIMATE_PRESET_FIELD_ACTIVE', 'Active'],
		menu_dropdown_bg_color: ['HELIX_ULTIMATE_PRESET_FIELD_BACKGROUND', 'Background'],
		menu_dropdown_text_color: ['HELIX_ULTIMATE_PRESET_FIELD_TEXT', 'Text'],
		menu_dropdown_text_hover_color: ['HELIX_ULTIMATE_PRESET_FIELD_HOVER', 'Hover'],
		menu_dropdown_text_active_color: ['HELIX_ULTIMATE_PRESET_FIELD_ACTIVE', 'Active'],
		bg_color: ['HELIX_ULTIMATE_PRESET_FIELD_BACKGROUND', 'Background'],
		text_color: ['HELIX_ULTIMATE_PRESET_FIELD_TEXT', 'Text'],
		link_color: ['HELIX_ULTIMATE_PRESET_FIELD_LINK', 'Link'],
		link_hover_color: ['HELIX_ULTIMATE_PRESET_FIELD_LINK_HOVER', 'Link hover'],
		footer_bg_color: ['HELIX_ULTIMATE_PRESET_FIELD_BACKGROUND', 'Background'],
		footer_text_color: ['HELIX_ULTIMATE_PRESET_FIELD_TEXT', 'Text'],
		footer_link_color: ['HELIX_ULTIMATE_PRESET_FIELD_LINK', 'Link'],
		footer_link_hover_color: ['HELIX_ULTIMATE_PRESET_FIELD_LINK_HOVER', 'Link hover'],
	};

	/** The short label when this language has it, otherwise null (keep the full one). */
	const shortLabel = (field: string): string | null => {
		const entry = SHORT_LABELS[field];
		const value = entry && Joomla.Text ? Joomla.Text._(entry[0]) : '';
		return value && value !== entry[0] ? value : null;
	};

	const PRESET_GROUPS: { key: string; label: [string, string]; fields: string[] }[] = [
		{ key: 'topbar', label: ['HELIX_ULTIMATE_PRESET_GROUP_TOPBAR', 'Top bar'], fields: ['topbar_bg_color', 'topbar_text_color'] },
		{ key: 'header', label: ['HELIX_ULTIMATE_PRESET_GROUP_HEADER', 'Header'], fields: ['header_bg_color', 'logo_text_color'] },
		{ key: 'menu', label: ['HELIX_ULTIMATE_PRESET_GROUP_MENU', 'Menu'], fields: ['menu_text_color', 'menu_text_hover_color', 'menu_text_active_color'] },
		{
			key: 'dropdown',
			label: ['HELIX_ULTIMATE_PRESET_GROUP_DROPDOWN', 'Dropdown menu'],
			fields: ['menu_dropdown_bg_color', 'menu_dropdown_text_color', 'menu_dropdown_text_hover_color', 'menu_dropdown_text_active_color'],
		},
		{ key: 'body', label: ['HELIX_ULTIMATE_PRESET_GROUP_BODY', 'Body'], fields: ['bg_color', 'text_color', 'link_color', 'link_hover_color'] },
		{ key: 'footer', label: ['HELIX_ULTIMATE_PRESET_GROUP_FOOTER', 'Footer'], fields: ['footer_bg_color', 'footer_text_color', 'footer_link_color', 'footer_link_hover_color'] },
	];

	const presetText = (key: string, fallback: string): string => {
		const value = Joomla.Text ? Joomla.Text._(key) : '';
		return value && value !== key ? value : fallback;
	};

	/**
	 * Regroup the editor's colour rows into collapsible sections (Top bar,
	 * Header, Menu, ...), each summarised by swatches of its colours. Rows of
	 * colours no group knows (e.g. a template's own presets) go under "Other".
	 */
	function groupPresetEditor(editor: HTMLElement): void {
		const rows = [...editor.querySelectorAll<HTMLElement>('.group-style-no-group')].filter(row => row.querySelector('input.preset-control'));
		const byField = new Map(rows.map(row => [row.querySelector<HTMLInputElement>('input.preset-control')!.name, row]));
		const used = new Set<HTMLElement>();
		const sections: { key: string; label: string; rows: HTMLElement[] }[] = [];

		PRESET_GROUPS.forEach(group => {
			const groupRows = group.fields.map(field => byField.get(field)).filter((row): row is HTMLElement => Boolean(row));
			groupRows.forEach(row => used.add(row));
			if (groupRows.length) sections.push({ key: group.key, label: presetText(...group.label), rows: groupRows });
		});

		const others = rows.filter(row => !used.has(row));
		if (others.length) sections.push({ key: 'other', label: presetText('HELIX_ULTIMATE_PRESET_GROUP_OTHER', 'Other'), rows: others });

		const list = document.createElement('div');
		list.className = 'hu-preset-groups';

		sections.forEach((section, index) => {
			const details = document.createElement('details');
			details.className = `hu-preset-group hu-preset-group-${section.key}`;
			details.open = index === 0;
			details.innerHTML = `
				<summary class="hu-preset-group__summary">
					<span class="hu-preset-group__title"></span>
					<span class="hu-preset-group__swatches" aria-hidden="true"></span>
					<svg class="hu-preset-group__chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
				</summary>
				<div class="hu-preset-group__fields"></div>`;

			details.querySelector('.hu-preset-group__title')!.textContent = section.label;

			const fields = details.querySelector('.hu-preset-group__fields')!;
			const swatches = details.querySelector('.hu-preset-group__swatches')!;

			section.rows.forEach(row => {
				const input = row.querySelector<HTMLInputElement>('input.preset-control')!;
				const label = row.querySelector<HTMLElement>('.control-label');
				const fullLabel = (label?.dataset.fullLabel ?? label?.textContent ?? '').trim();
				const short = section.key === 'other' ? null : shortLabel(input.name);

				if (label) {
					label.dataset.fullLabel = fullLabel;
					label.textContent = short ?? fullLabel;
				}

				// Screen readers hear the full name ("Menu Text Hover Color").
				if (fullLabel) input.setAttribute('aria-label', fullLabel);
				const swatch = document.createElement('i');
				const paint = () => swatch.style.setProperty('background-color', input.value || 'transparent');

				paint();
				input.addEventListener('input', paint);
				input.addEventListener('change', paint);

				swatches.appendChild(swatch);
				fields.appendChild(row);
			});

			list.appendChild(details);
		});

		// The rows sat in one wrapper div; the groups take its place.
		const wrapper = editor.firstElementChild;
		if (wrapper) wrapper.replaceChildren(list);
		else editor.appendChild(list);
	}

	/** The preset editor step that is open, if any. */
	let editor: ReturnType<typeof Joomla.helixSubpanel.open> | null = null;

	function reflectPresetChanges(data: PresetColors, name: string, originalContainer: HTMLElement, editedContainer: HTMLElement): void {
		presetsData[name].data = data;
		dataElement.value = JSON.stringify(presetsData);

		const presetElement = document.querySelector<HTMLElement>(`.hu-preset[data-preset="${name}"]`);

		if (presetElement) {
			Object.entries(data).forEach(([key, value]) => presetElement.setAttribute(`data-${key}`, value));

			// The next edit starts from these colours, not the ones the page loaded with.
			presetElement.querySelector('.hu-edit-preset')?.setAttribute('data-preset_data', JSON.stringify({ name, data: { ...data } }));
		}

		/**
		 * Keep the edited fields as the new original, so the next time the
		 * modal opens it shows the last changes.
		 */
		originalContainer.replaceChildren(...editedContainer.querySelectorAll(':scope > div'));

		window.purgeCss?.();
		editor?.close();

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

		const { name, data } = readData<{ name: string; data: PresetColors }>(button, 'preset_data') || ({} as { name?: string; data?: PresetColors });

		if (!name || !data) return;

		const originalContainer = document.querySelector<HTMLElement>(`.hu-preset-container#${name}`);

		if (!originalContainer) return;

		const host = presetsGrid.closest<HTMLElement>('.hu-edit-panel');

		if (!host) return;

		editor?.close();

		// Edit a copy, so going back leaves the original untouched.
		const container = originalContainer.cloneNode(true) as HTMLElement;

		// Avoid duplicate ids between the copy and the original.
		container.querySelectorAll('input').forEach(input => input.removeAttribute('id'));

		container.removeAttribute('id');
		container.removeAttribute('style');
		container.classList.add('hu-preset-editor');
		groupPresetEditor(container);

		const tile = button.closest<HTMLElement>('.hu-preset');
		const label = tile?.getAttribute('aria-label') || name;

		const step = Joomla.helixSubpanel.open({
			host,
			title: label,
			body: container,
			backLabel: 'Back to presets',
			footer:
				`<button type="button" class="hu-btn hu-btn-primary hu-save-preset">${Joomla.utils.icon('check')} Apply</button>` +
				`<button type="button" class="hu-btn hu-btn-link helix-preset-reset">${Joomla.utils.icon('refresh')} Reset to default</button>`,
			onClose: () => {
				if (editor === step) editor = null;
				// Back on the pencil that opened the editor.
				button.focus({ preventScroll: true });
			},
		});

		editor = step;
		Joomla.initColorPicker?.();

		// Collect the edited colours.
		container.querySelectorAll<HTMLInputElement>('input.preset-control').forEach(input => {
			input.addEventListener('change', () => {
				data[input.name] = input.value;
			});
		});

		step.footer?.querySelector('.hu-save-preset')?.addEventListener('click', applyEvent => {
			applyEvent.preventDefault();
			reflectPresetChanges(data, name, originalContainer, container);
		});

		step.footer?.querySelector('.helix-preset-reset')?.addEventListener('click', resetEvent => {
			resetEvent.preventDefault();

			if (window.confirm('Do you really want to reset your changes to default?')) {
				const defaults: Record<string, PresetColors> = JSON.parse((document.getElementById('default-values') as HTMLInputElement).value);
				reflectPresetChanges(defaults[name], name, originalContainer, container);
			}
		});
	});
});
