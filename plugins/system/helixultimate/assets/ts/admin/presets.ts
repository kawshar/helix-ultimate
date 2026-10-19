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
	/* Rows: each preset's name and a strip of its main colours             */
	/* ------------------------------------------------------------------ */

	/**
	 * The preset's palette as small overlapping dots, like the colour groups in
	 * the editor: its five most used colours, each once, the most used (the
	 * accent) last, so it sits on top at the right.
	 */
	function renderPresetPreview(tile: HTMLElement): void {
		const contents = tile.querySelector('.hu-preset-contents');

		if (!contents) return;

		const counts = new Map<string, { value: string; count: number }>();

		[...tile.attributes].forEach(({ name, value }) => {
			if (!/^data-.+_color$/.test(name) || !value.trim()) return;

			const key = value.trim().toLowerCase();
			const entry = counts.get(key) ?? { value: value.trim(), count: 0 };
			entry.count++;
			counts.set(key, entry);
		});

		const palette = document.createElement('span');
		palette.className = 'hu-preset-palette';
		palette.setAttribute('aria-hidden', 'true');

		[...counts.values()]
			.sort((first, second) => second.count - first.count)
			.slice(0, 5)
			.reverse()
			.forEach(({ value }) => {
				const swatch = document.createElement('i');
				swatch.title = value;
				swatch.style.setProperty('--swatch', value);
				palette.appendChild(swatch);
			});

		contents.replaceChildren(palette);
		tile.style.setProperty('--p-accent', tile.getAttribute('data-link_color') || '');
	}

	/** Tiles act as a radio group: focusable, arrow keys move, Enter / Space pick. */
	function syncPresetState(): void {
		// With the custom style on, the saved preset stays marked in the data but is not the one in use.
		const customOn = presetsGrid.classList.contains('is-custom');

		document.querySelectorAll<HTMLElement>('.hu-presets .hu-preset').forEach(tile => {
			const active = tile.classList.contains('active') && (customOn === tile.classList.contains('hu-custom-preset'));
			tile.setAttribute('aria-checked', String(active));
			tile.tabIndex = active ? 0 : -1;
		});
	}

	const presetsGrid = dataElement.closest<HTMLElement>('.hu-presets')!;
	const tiles = [...presetsGrid.querySelectorAll<HTMLElement>('.hu-preset')];

	const activeTile = (): HTMLElement | undefined => tiles.find(tile => tile.getAttribute('aria-checked') === 'true');

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

		const steps: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
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
		{
			key: 'offcanvas',
			label: ['HELIX_ULTIMATE_PRESET_GROUP_OFFCANVAS', 'Off-canvas menu'],
			fields: ['offcanvas_menu_bg_color', 'offcanvas_menu_icon_color', 'offcanvas_menu_items_and_items_color', 'offcanvas_menu_active_menu_item_color'],
		},
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
	function groupPresetEditor(
		editor: HTMLElement,
		rows = [...editor.querySelectorAll<HTMLElement>('.group-style-no-group')].filter(row => row.querySelector('input.preset-control'))
	): void {
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

	/**
	 * Use a preset's colours: store them, repaint its tile and pick it, which
	 * drafts the change so the preview shows it (the global Save keeps it).
	 */
	function reflectPresetChanges(data: PresetColors, name: string): void {
		presetsData[name].data = { ...data };
		dataElement.value = JSON.stringify(presetsData);

		const presetElement = document.querySelector<HTMLElement>(`.hu-preset[data-preset="${name}"]`);

		if (!presetElement) return;

		Object.entries(data).forEach(([key, value]) => presetElement.setAttribute(`data-${key}`, value));

		// The next edit starts from these colours, not the ones the page loaded with.
		presetElement.querySelector('.hu-edit-preset')?.setAttribute('data-preset_data', JSON.stringify({ name, data: { ...data } }));

		window.purgeCss?.();

		presetElement.style.backgroundColor = detectMajorColor(data);
		renderPresetPreview(presetElement);
		presetElement.click();
	}

	/** Show colours in a preset's fields (and their swatches). */
	function setPresetFields(container: HTMLElement, data: PresetColors): void {
		container.querySelectorAll<HTMLInputElement>('input.preset-control').forEach(input => {
			if (!(input.name in data)) return;

			input.value = data[input.name];
			input.setAttribute('value', data[input.name]);

			const wrapper = input.parentElement;
			if (wrapper?.classList.contains('clr-field')) wrapper.style.color = data[input.name];

			input.dispatchEvent(new Event('input'));
		});
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

		// Edit a copy laid out for the editor; the original stays the source for the next edit.
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
			headerActions: `<button type="button" class="hu-subpanel-action helix-preset-reset" title="Reset to default">${Joomla.utils.icon('refresh')}<span>Reset</span></button>`,
			onClose: () => {
				if (editor === step) editor = null;
				// The fields the next edit is copied from show the latest colours.
				setPresetFields(originalContainer, data);
				// Back on the pencil that opened the editor.
				button.focus({ preventScroll: true });
			},
		});

		editor = step;
		Joomla.initColorPicker?.();

		// Each colour applies at once; the global Save keeps it.
		container.querySelectorAll<HTMLInputElement>('input.preset-control').forEach(input => {
			input.addEventListener('change', () => {
				if (data[input.name] === input.value) return;

				data[input.name] = input.value;
				reflectPresetChanges(data, name);
			});
		});

		step.header.querySelector('.helix-preset-reset')?.addEventListener('click', resetEvent => {
			resetEvent.preventDefault();

			if (!window.confirm('Do you really want to reset your changes to default?')) return;

			const defaults: Record<string, PresetColors> = JSON.parse((document.getElementById('default-values') as HTMLInputElement).value);

			Object.assign(data, defaults[name]);
			setPresetFields(container, data);
			reflectPresetChanges(data, name);
		});
	});

	/* ------------------------------------------------------------------ */
	/* Custom style: one more row in the list, edited like a preset        */
	/* ------------------------------------------------------------------ */

	/*
	 * The "Custom Style" switch and its colour groups (real template settings)
	 * become the last row of the list: picking it turns the custom style on,
	 * picking a preset turns it off, and its pencil opens the colours grouped
	 * like the preset editor. The fields only move between this panel's hidden
	 * home and the editor step, so they always stay in the form (and drafted).
	 */
	const customToggle = document.getElementById('custom_style') as HTMLInputElement | null;
	const presetsPanel = presetsGrid.closest<HTMLElement>('.hu-edit-panel');
	const customRows = presetsPanel
		? [...presetsPanel.querySelectorAll<HTMLElement>('.hu-group-wrap .control-group')].filter(row => row.querySelector('input.preset-control'))
		: [];

	if (customToggle && presetsPanel && customRows.length) {
		const toggleRow = customToggle.closest<HTMLElement>('.control-group');
		const label = (toggleRow?.querySelector('.control-label')?.firstChild?.textContent ?? '').trim() || 'Custom Style';
		const inputs = customRows.map(row => row.querySelector<HTMLInputElement>('input.preset-control')!);

		// The switch and the original groups give way to the row and its editor.
		toggleRow?.classList.add('hu-custom-style-source');
		customRows.forEach(row => row.closest('.hu-group-wrap')?.classList.add('hu-custom-style-source'));

		const custom = document.createElement('div');
		custom.className = 'hu-preset hu-custom-preset';
		custom.setAttribute('role', 'radio');
		custom.setAttribute('aria-label', label);
		custom.innerHTML = `
			<a href="#" class="hu-edit-preset hu-edit-custom" role="button" title="Edit colours">${Joomla.utils.icon('pen')}</a>
			<div class="hu-preset-title"></div>
			<div class="hu-preset-contents"></div>`;
		custom.querySelector('.hu-preset-title')!.textContent = label;
		custom.querySelector('.hu-edit-custom')!.setAttribute('aria-label', `Edit ${label}`);

		const lastTile = tiles[tiles.length - 1];
		if (lastTile) lastTile.after(custom);
		else presetsGrid.appendChild(custom);
		tiles.push(custom);

		/** The row's dots follow the custom colours. */
		const paintCustom = () => {
			inputs.forEach(input => custom.setAttribute(`data-${input.name}`, input.value));
			renderPresetPreview(custom);
		};

		inputs.forEach(input => {
			input.addEventListener('input', paintCustom);
			input.addEventListener('change', paintCustom);
		});

		const syncCustom = () => {
			const on = customToggle.checked;

			custom.classList.toggle('active', on);
			presetsGrid.classList.toggle('is-custom', on);
			syncPresetState();

			if (!activeTile()) (tiles.find(tile => tile.classList.contains('active')) ?? tiles[0]).tabIndex = 0;
		};

		const setCustom = (on: boolean) => {
			if (customToggle.checked === on) return;

			customToggle.checked = on;
			// Tracked like any setting: drafted, and undone by Restore.
			customToggle.dispatchEvent(new Event('change', { bubbles: true }));
		};

		customToggle.addEventListener('change', syncCustom);

		// Capture: before helix-ultimate.js marks a preset tile active.
		presetsGrid.addEventListener(
			'click',
			event => {
				const tile = event.target instanceof Element ? event.target.closest<HTMLElement>('.hu-preset') : null;

				if (!tile || (event.target as Element).closest('.hu-edit-preset:not(.hu-edit-custom)')) return;

				if (tile === custom) {
					event.preventDefault();
					event.stopPropagation();
					setCustom(true);
					requestAnimationFrame(syncCustom);

					if ((event.target as Element).closest('.hu-edit-custom')) openCustomEditor();

					return;
				}

				setCustom(false);
			},
			true
		);

		// The fields' home in the panel while the editor is closed.
		const home = document.createElement('div');
		home.className = 'hu-custom-style-home';
		home.hidden = true;
		presetsGrid.after(home);

		const customEditor = document.createElement('div');
		customEditor.className = 'hu-preset-editor hu-custom-style-editor';
		groupPresetEditor(customEditor, customRows);
		home.appendChild(customEditor);

		let customStep: ReturnType<typeof Joomla.helixSubpanel.open> | null = null;

		function openCustomEditor(): void {
			if (!presetsPanel || customStep) return;

			customStep = Joomla.helixSubpanel.open({
				host: presetsPanel,
				title: label,
				body: customEditor,
				backLabel: 'Back to presets',
				onClose: () => {
					// Back home (still in the form) before the step is removed.
					home.appendChild(customEditor);
					customStep = null;
					custom.querySelector<HTMLElement>('.hu-edit-custom')?.focus({ preventScroll: true });
				},
			});
		}

		paintCustom();
		syncCustom();
	}
});
