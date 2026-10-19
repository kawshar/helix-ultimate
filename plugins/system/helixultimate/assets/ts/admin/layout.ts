/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Layout builder: rows and columns, their settings and grid patterns.
 *
 * Row and column settings live in `data-*` attributes on `.hu-layout-section`
 * and `.hu-layout-column`; `Joomla.helixLayout.serialize()` turns them into the
 * layout JSON stored in the `#layout` field.
 */

type Settings = Record<string, unknown>;

export interface LayoutColumn {
	type: 'sp_col';
	settings: Settings;
}

export interface LayoutRow {
	type: 'row';
	layout: string | number;
	settings: Settings;
	attr: LayoutColumn[];
}

export interface HelixLayoutApi {
	serialize(): LayoutRow[];
}

type SettingsInput = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * `==` as the classic script used it: stored settings come back from
 * readData() as numbers, booleans or strings ("1", 1 and true all match "1").
 */
// eslint-disable-next-line eqeqeq
const looseEq = (a: unknown, b: unknown): boolean => a == b;

document.addEventListener('DOMContentLoaded', () => {
	const { fire, delegate, readData, show, hide, toggle } = Joomla.utils;

	const builderElement = document.getElementById('hu-layout-builder');

	if (!builderElement) return;

	const builder = builderElement;

	const COLUMN_OPTIONS_ICON =
		'<a class="hu-column-options" href="#"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="3" fill="none"><path fill="#020B53" fill-rule="evenodd" d="M3 1.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM13.5 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clip-rule="evenodd" opacity=".4"/></svg></a>';

	/* ------------------------------------------------------------------ */
	/* Serialising                                                         */
	/* ------------------------------------------------------------------ */

	/** Settings of a row or column, without leftovers from the old jQuery UI sortable. */
	const settingsOf = (element: HTMLElement): Settings => {
		const settings = readData(element);

		delete settings.sortableitem;
		delete settings.sortableItem;

		return settings;
	};

	/** Build the layout JSON from the rows and columns. */
	function serialize(): LayoutRow[] {
		return [...builder.querySelectorAll<HTMLElement>('.hu-layout-section')].map(row => {
			const active = row.querySelector<HTMLElement>('.hu-column-layout.active');
			const layoutData: unknown = active ? readData(active, 'layout') : 12;

			return {
				type: 'row',
				layout: !looseEq(layoutData, 12) ? String(layoutData).split(',').join('') : 12,
				settings: settingsOf(row),
				attr: [...row.querySelectorAll<HTMLElement>('.hu-layout-column')].map(column => ({
					type: 'sp_col',
					settings: settingsOf(column),
				})),
			};
		});
	}

	const helixLayout: HelixLayoutApi = { serialize };

	Joomla.helixLayout = helixLayout;

	function updateLayoutField(): void {
		const input = document.getElementById('layout') as HTMLInputElement | null;

		// Settings may have changed: refresh the flags shown on rows and columns.
		builder.querySelectorAll<HTMLElement>('.hu-layout-section').forEach(renderFlags);

		if (input) {
			input.value = JSON.stringify(serialize());
			fire(input);
		}
	}

	/** Store a setting on a row or column. */
	const setData = (element: Element, key: string, value: unknown): void =>
		element.setAttribute(`data-${key}`, value === null || value === undefined ? '' : String(value));

	/* ------------------------------------------------------------------ */
	/* Drag and drop (SortableJS)                                          */
	/* ------------------------------------------------------------------ */

	const sortables = new WeakSet<Element>();

	/** When the last drag ended: the click that ends a drag must not open settings. */
	let lastDragEnd = 0;

	function makeSortable(container: Element | null, options: Record<string, unknown>): void {
		if (!container || sortables.has(container) || !window.Sortable) return;

		sortables.add(container);

		window.Sortable.create(container, {
			animation: 150,
			// Pointer-event dragging: consistent across browsers and styleable.
			forceFallback: true,
			fallbackOnBody: true,
			ghostClass: 'ui-state-highlight',
			chosenClass: 'hu-sortable-chosen',
			dragClass: 'hu-sortable-drag',
			preventOnFilter: false,
			...options,
			onEnd(event: { oldIndex?: number; newIndex?: number }) {
				lastDragEnd = Date.now();

				if (event.oldIndex !== event.newIndex) {
					updateLayoutField();
				}

				builder.querySelectorAll<HTMLElement>('.hu-layout-section').forEach(layoutRowHandles);
			},
		});
	}

	function initSortables(): void {
		// Rows drag by their header bar, so dragging a column never moves the row.
		makeSortable(
			builder,
			{ draggable: '.hu-layout-section', handle: '.hu-section-settings', filter: '.hu-row-option-list', direction: 'vertical' }
		);

		builder.querySelectorAll('.hu-layout-section [data-hu-layout-row]').forEach(row => {
			makeSortable(row, { draggable: '.hu-layout-column', filter: '.hu-column-options', direction: 'horizontal' });
		});
	}

	initSortables();

	/* ------------------------------------------------------------------ */
	/* Column widths: drag (or arrow keys on) the handle between columns   */
	/* ------------------------------------------------------------------ */

	/*
	 * Like the mega menu builder: a handle between two columns moves width
	 * from one to the other, snapping to twelfths, so a row always adds up
	 * to 12. It writes what a preset does (each column's col-N class and
	 * grid_size, and the row's pattern), so the saved layout is unchanged.
	 */
	const GRID = 12;
	const columnsOfRow = (row: Element): HTMLElement[] => [...row.querySelectorAll<HTMLElement>('[data-hu-layout-row] > .hu-layout-column')];
	const widthOf = (column: HTMLElement): number => Number(column.dataset.grid_size || (column.className.match(/\bcol-(\d+)\b/) || [])[1] || GRID);

	function setColumnWidth(column: HTMLElement, width: number): void {
		column.className = /\bcol-\d+\b/.test(column.className) ? column.className.replace(/\bcol-\d+\b/, `col-${width}`) : `${column.className} col-${width}`;
		setData(column, 'grid_size', width);
	}

	/** Mark the row's pattern: the matching preset, or the custom button with the new pattern. */
	function setRowPattern(row: Element, pattern: string): void {
		const list = row.querySelector('.hu-column-list');

		if (!list) return;

		const preset = [...list.querySelectorAll<HTMLElement>('.hu-column-layout:not(.hu-layout-custom-btn)')].find(
			button => String(readData(button, 'layout')) === pattern || (pattern === '12' && looseEq(readData(button, 'layout'), 12))
		);
		const target = preset || list.querySelector<HTMLElement>('.hu-layout-custom-btn');

		if (!target) return;

		if (!preset) target.setAttribute('data-layout', pattern);

		list.querySelectorAll('.hu-column-layout.active').forEach(item => item.classList.remove('active'));
		target.classList.add('active');
	}

	function layoutRowHandles(row: HTMLElement): void {
		const container = row.querySelector<HTMLElement>('.hu-row-container');
		const columns = columnsOfRow(row);

		if (!container) return;

		let overlay = container.querySelector<HTMLElement>(':scope > .hu-col-resizers');

		if (!overlay) {
			overlay = document.createElement('div');
			overlay.className = 'hu-col-resizers';
			container.appendChild(overlay);
		}

		while (overlay.children.length < columns.length - 1) {
			const handle = document.createElement('div');
			handle.className = 'hu-col-resizer';
			handle.tabIndex = 0;
			handle.setAttribute('role', 'separator');
			handle.setAttribute('aria-orientation', 'vertical');
			handle.setAttribute('aria-valuemin', '1');
			overlay.appendChild(handle);
		}

		while (overlay.children.length > Math.max(columns.length - 1, 0)) overlay.lastElementChild!.remove();

		// The whole card opens the column's settings (click, or Enter / Space).
		columns.forEach(column => {
			const card = column.querySelector<HTMLElement>(':scope > .hu-column');

			if (!card) return;

			card.tabIndex = 0;
			card.setAttribute('role', 'button');
			card.setAttribute('aria-label', `Column settings: ${column.querySelector('.hu-column-title')?.textContent?.trim() || 'column'}`);
		});

		const widths = columns.map(widthOf);

		[...overlay.children].forEach((child, index) => {
			const handle = child as HTMLElement;
			handle.dataset.index = String(index);
			handle.setAttribute('aria-valuenow', String(widths[index]));
			handle.setAttribute('aria-valuemax', String(widths[index] + widths[index + 1] - 1));
			handle.setAttribute('aria-label', `Width of ${columns[index].dataset.name || 'column ' + (index + 1)}, ${widths[index]} of 12`);
		});

		renderAddColumn(row);
		positionRowHandles(row);
		renderFlags(row);

		if (window.ResizeObserver && !container.dataset.huObserved) {
			container.dataset.huObserved = '1';
			new ResizeObserver(() => positionRowHandles(row)).observe(container);
		}
	}

	/*
	 * Flags: what a row or column does, at a glance. Rows: full width, a
	 * background colour, hidden on some devices. Columns: sticky, hidden.
	 */
	const HIDE_KEYS = ['hide_on_phone', 'hide_on_large_phone', 'hide_on_tablet', 'hide_on_small_desktop', 'hide_on_desktop', 'hide_on_ex_large_desktop'];
	const isOn = (element: HTMLElement, key: string): boolean => looseEq(element.dataset[key], 1);
	const flagIcons = {
		hidden: '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="M2 2l12 12M6.3 4.2A6.7 6.7 0 0 1 8 4c3.5 0 5.6 3.2 6 4-.2.4-.8 1.4-1.8 2.3M9.9 11.6A6.2 6.2 0 0 1 8 12c-3.5 0-5.6-3.2-6-4 .3-.5 1-1.6 2.2-2.6"/></svg>',
		sticky: '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" d="M6 2h4l-.5 4 2 2H4.5l2-2zM8 8v6"/></svg>',
	};

	/** A setting's translated label, read from the settings form on the page. */
	function settingLabel(templateId: string, key: string, fallback: string): string {
		const field = document.querySelector(`#${templateId} [data-attrname="${key}"]`);
		const label = field?.closest('.control-group')?.querySelector('label');
		const text = label?.textContent?.trim();

		return text || fallback;
	}

	function renderFlags(row: HTMLElement): void {
		const title = row.querySelector<HTMLElement>('.hu-section-title');

		if (title) {
			let flags = row.querySelector<HTMLElement>('.hu-row-flags');

			if (!flags) {
				flags = document.createElement('span');
				flags.className = 'hu-row-flags';
				title.after(flags);
			}

			const parts: string[] = [];

			if (isOn(row, 'fluidrow')) {
				const text = settingLabel('hu-row-settings', 'fluidrow', 'Full width').replace(/[<>&"]/g, '');
				parts.push(`<span class="hu-flag hu-flag-text">${text}</span>`);
			}

			const background = row.dataset.background_color;

			if (HIDE_KEYS.some(key => isOn(row, key))) parts.push(`<span class="hu-flag hu-flag-icon" title="Hidden on some devices">${flagIcons.hidden}</span>`);

			flags.innerHTML = parts.join('');

			// The colour is stored data (an import can set anything): set it as a property, never as markup.
			if (background) {
				const swatch = document.createElement('span');
				swatch.className = 'hu-flag hu-flag-swatch';
				swatch.title = `Background ${background}`;
				swatch.style.setProperty('--hu-flag-color', background.replace(/[^#\w(),.%\s-]/g, ''));
				flags.insertBefore(swatch, flags.querySelector('.hu-flag-icon'));
			}
		}

		columnsOfRow(row).forEach(column => {
			const card = column.querySelector<HTMLElement>(':scope > .hu-column');

			if (!card) return;

			let flags = card.querySelector<HTMLElement>('.hu-column-flags');

			if (!flags) {
				flags = document.createElement('span');
				flags.className = 'hu-column-flags';
				card.querySelector('.hu-column-title')?.after(flags);
			}

			const parts: string[] = [];

			if (isOn(column, 'sticky_position')) {
				const text = settingLabel('hu-column-settings', 'sticky_position', 'Sticky').replace(/[<>&"]/g, '');
				parts.push(`<span class="hu-flag hu-flag-icon" title="${text}">${flagIcons.sticky}</span>`);
			}
			if (HIDE_KEYS.some(key => isOn(column, key))) parts.push(`<span class="hu-flag hu-flag-icon" title="Hidden on some devices">${flagIcons.hidden}</span>`);

			flags.innerHTML = parts.join('');
		});
	}

	const layoutText = (key: string, fallback: string): string => {
		const value = Joomla.Text ? Joomla.Text._(key) : '';
		return value && value !== key ? value : fallback;
	};

	/** A new, empty column (no position yet), like the ones a preset adds. */
	function newColumn(width: number): HTMLElement {
		const column = document.createElement('div');

		column.className = `hu-layout-column col-${width}`;
		column.innerHTML = `<div class="hu-column"><span class="hu-column-title">none</span>${COLUMN_OPTIONS_ICON}</div>`;
		setData(column, 'column_type', 0);
		setData(column, 'name', 'none');
		setData(column, 'grid_size', width);

		return column;
	}

	/** Split the widest column (the last one, if several tie) in two, in place. */
	function addColumn(row: HTMLElement): void {
		const columns = columnsOfRow(row);
		const widths = columns.map(widthOf);
		const widest = Math.max(...widths);

		if (widest < 2) return;

		const index = widths.lastIndexOf(widest);

		setColumnWidth(columns[index], Math.ceil(widest / 2));
		columns[index].after(newColumn(Math.floor(widest / 2)));

		layoutRowHandles(row);
		setRowPattern(row, columnsOfRow(row).map(widthOf).join('+'));
		updateLayoutField();
	}

	function renderAddColumn(row: HTMLElement): void {
		const container = row.querySelector<HTMLElement>('.hu-row-container');

		if (!container) return;

		let button = container.querySelector<HTMLButtonElement>(':scope > .hu-add-column');

		if (!button) {
			button = document.createElement('button');
			button.type = 'button';
			button.className = 'hu-add-column';
			button.title = layoutText('HELIX_ULTIMATE_MEGAMENU_ADD_COLUMN', 'Add column');
			button.setAttribute('aria-label', button.title);
			button.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M8 3.5v9M3.5 8h9"/></svg>';
			container.appendChild(button);
		}

		button.disabled = Math.max(...columnsOfRow(row).map(widthOf), 0) < 2;
	}

	delegate<HTMLButtonElement>(document, 'click', '#hu-layout-builder .hu-add-column', (event, button) => {
		event.preventDefault();

		const row = button.closest<HTMLElement>('.hu-layout-section');
		if (row) addColumn(row);
	});

	/**
	 * Each handle sits on the gap after its column. The overlay covers the
	 * columns' row exactly, and a handle is placed by where its column ends
	 * (in twelfths), so it follows width changes without measuring again.
	 */
	function positionRowHandles(row: HTMLElement): void {
		const container = row.querySelector<HTMLElement>('.hu-row-container');
		const overlay = container?.querySelector<HTMLElement>(':scope > .hu-col-resizers');
		const grid = row.querySelector<HTMLElement>('[data-hu-layout-row]');

		if (!container || !overlay || !grid) return;

		const box = container.getBoundingClientRect();
		const gridBox = grid.getBoundingClientRect();
		const widths = columnsOfRow(row).map(widthOf);
		let end = 0;

		overlay.style.top = `${gridBox.top - box.top}px`;
		overlay.style.left = `${gridBox.left - box.left}px`;
		overlay.style.width = `${gridBox.width}px`;
		overlay.style.height = `${gridBox.height}px`;

		[...overlay.children].forEach((child, index) => {
			end += widths[index] || 0;
			(child as HTMLElement).style.left = `${(end / GRID) * 100}%`;
		});
	}

	// A style or panel-width change can move the columns: measure again on the way in.
	delegate<HTMLElement>(document, 'pointerover', '#hu-layout-builder .hu-layout-section', (event, row) => {
		if (!row.classList.contains('is-resizing')) positionRowHandles(row);
	});

	/** Width between column `index` and the next; `left` is the new width of the first. */
	function setPair(row: HTMLElement, index: number, left: number): boolean {
		const columns = columnsOfRow(row);
		const widths = columns.map(widthOf);
		const pair = widths[index] + widths[index + 1];
		const next = Math.min(Math.max(Math.round(left), 1), pair - 1);

		if (next === widths[index]) return false;

		setColumnWidth(columns[index], next);
		setColumnWidth(columns[index + 1], pair - next);
		layoutRowHandles(row);
		row.dataset.widthsDirty = '1';

		return true;
	}

	const commitTimers = new WeakMap<HTMLElement, number>();

	function commitWidths(row: HTMLElement, delay = 450): void {
		if (row.dataset.widthsDirty !== '1') return;

		window.clearTimeout(commitTimers.get(row));
		commitTimers.set(
			row,
			window.setTimeout(() => {
				delete row.dataset.widthsDirty;
				setRowPattern(row, columnsOfRow(row).map(widthOf).join('+'));
				updateLayoutField();
			}, delay)
		);
	}

	delegate<HTMLElement, PointerEvent>(document, 'pointerdown', '#hu-layout-builder .hu-col-resizer', (event, handle) => {
		if (event.button !== 0) return;

		event.preventDefault();
		event.stopPropagation();

		const row = handle.closest<HTMLElement>('.hu-layout-section');
		const grid = row?.querySelector<HTMLElement>('[data-hu-layout-row]');

		if (!row || !grid) return;

		const index = Number(handle.dataset.index);
		const unit = grid.getBoundingClientRect().width / GRID;

		try {
			handle.setPointerCapture(event.pointerId);
		} catch (error) {
			// No active pointer (e.g. a synthetic event): the move/up listeners still work.
		}

		handle.focus({ preventScroll: true });
		row.classList.add('is-resizing');

		const move = (moveEvent: PointerEvent): void => {
			const start = columnsOfRow(row)[index].getBoundingClientRect().left;
			setPair(row, index, (moveEvent.clientX - start) / unit);
		};

		const end = (): void => {
			handle.removeEventListener('pointermove', move);
			handle.removeEventListener('pointerup', end);
			handle.removeEventListener('pointercancel', end);
			row.classList.remove('is-resizing');
			commitWidths(row, 0);
		};

		handle.addEventListener('pointermove', move);
		handle.addEventListener('pointerup', end);
		handle.addEventListener('pointercancel', end);
	});

	delegate<HTMLElement, KeyboardEvent>(document, 'keydown', '#hu-layout-builder .hu-col-resizer', (event, handle) => {
		const row = handle.closest<HTMLElement>('.hu-layout-section');

		if (!row) return;

		const index = Number(handle.dataset.index);
		const widths = columnsOfRow(row).map(widthOf);
		const pair = widths[index] + widths[index + 1];
		const target = ({ ArrowLeft: widths[index] - 1, ArrowRight: widths[index] + 1, Home: 1, End: pair - 1 } as Record<string, number>)[event.key];

		if (target === undefined) return;

		event.preventDefault();

		if (setPair(row, index, target)) commitWidths(row);
	});

	delegate<HTMLElement>(document, 'focusout', '#hu-layout-builder .hu-col-resizer', (event, handle) => {
		const row = handle.closest<HTMLElement>('.hu-layout-section');
		if (row) commitWidths(row, 0);
	});

	builder.querySelectorAll<HTMLElement>('.hu-layout-section').forEach(layoutRowHandles);

	/* ------------------------------------------------------------------ */
	/* Header: shown first, not part of the layout                          */
	/* ------------------------------------------------------------------ */

	/*
	 * With a predefined header (Basic > Header) the template adds the header
	 * above these rows by itself. A fixed first row says so, names the header
	 * style and links to its settings. It sits outside the sortable rows.
	 */
	(function headerRow(): void {
		const predefined = document.querySelector<HTMLInputElement>('input[name="predefined_header"]');

		if (!predefined) return;

		const groupTitle = document.querySelector('.basic-panel .hu-group-header > .hu-group-header-box');
		const label = groupTitle?.textContent?.replace(/\s+/g, ' ').trim() || 'Header';

		const row = document.createElement('div');
		row.className = 'hu-layout-header-row';
		row.innerHTML = `
			<div class="hu-section-settings">
				<div><span class="hu-section-title"></span><span class="hu-flag hu-flag-text">Automatic</span></div>
			</div>
			<div class="hu-layout-column col-12 hu-layout-header-card">
				<div class="hu-column" tabindex="0" role="button">
					<span class="hu-column-title hu-layout-header-name"></span>
					<a href="#" class="hu-column-options hu-layout-header-edit">${Joomla.utils.icon('pen', { size: 14 })}</a>
				</div>
			</div>`;

		row.querySelector('.hu-section-title')!.textContent = label;
		row.querySelector('.hu-flag')!.setAttribute('title', 'Added by the template, from the header settings');

		// The card (like a column) opens the header settings; the pencil shows on hover.
		const card = row.querySelector<HTMLElement>('.hu-column')!;
		const edit = row.querySelector<HTMLElement>('.hu-layout-header-edit')!;
		const openHeader = (event: Event) => {
			event.preventDefault();
			Joomla.helixOpenPanel?.('basic', 'header');
		};

		card.setAttribute('aria-label', `Edit ${label.toLowerCase()}`);
		edit.title = `Edit ${label.toLowerCase()}`;
		edit.tabIndex = -1;
		card.addEventListener('click', openHeader);
		card.addEventListener('keydown', event => {
			if (event.key === 'Enter' || event.key === ' ') openHeader(event);
		});

		const name = row.querySelector<HTMLElement>('.hu-layout-header-name')!;

		const sync = () => {
			name.textContent = document.querySelector('.hu-header-item.active .hu-predefined-headers-title')?.textContent?.trim() || label;
			row.hidden = !predefined.checked;
		};

		builder.before(row);
		sync();

		predefined.addEventListener('change', sync);
		delegate(document, 'click', '.hu-header-item', () => requestAnimationFrame(sync));
	})();

	/* ------------------------------------------------------------------ */
	/* Settings modals                                                     */
	/* ------------------------------------------------------------------ */

	/** Fill a modal field from a stored setting. */
	function setInputValue(input: SettingsInput, value: unknown): void {
		if (input instanceof HTMLInputElement && input.type === 'checkbox') {
			input.checked = looseEq(value, '1');
			return;
		}

		// Keep the template default when nothing is stored.
		if (value === undefined) return;

		input.value = value === null ? '' : String(value);
	}

	const getInputValue = (input: SettingsInput): string =>
		input instanceof HTMLInputElement && input.type === 'checkbox' ? (input.checked ? '1' : '0') : input.value;

	/** Show the stored image of a media setting. */
	function showMediaPreview(input: SettingsInput, value: unknown): void {
		if (!input.classList.contains('hu-input-media') || !value) return;

		const holder = input.previousElementSibling;

		if (holder && holder.classList.contains('hu-image-holder')) {
			holder.innerHTML = '';
			const image = document.createElement('img');
			image.src = (input.dataset.baseurl || '') + value;
			image.alt = '';
			holder.appendChild(image);
		}

		[...(input.parentElement?.children ?? [])]
			.filter(sibling => sibling.classList.contains('hu-media-clear'))
			.forEach(clear => clear.classList.remove('hide'));
	}

	interface OpenSettingsOptions {
		templateId: string;
		flag: string;
		title: string;
		target: HTMLElement;
		activeClass: string;
		footerButtons?: string[];
	}

	/** The Row / Column Options step that is open, if any. */
	let settingsStep: ReturnType<typeof Joomla.helixSubpanel.open> | null = null;

	/**
	 * Open Row / Column Options with a copy of the hidden settings template:
	 * as a step that slides over the Layout panel (or, without the panel, the
	 * classic settings modal).
	 */
	function openSettings({ templateId, flag, title, target, activeClass, footerButtons = [] }: OpenSettingsOptions): HTMLElement {
		const host = builder.closest<HTMLElement>('.hu-edit-panel');

		settingsStep?.close();

		document.querySelectorAll(`.${activeClass}`).forEach(element => element.classList.remove(activeClass));
		target.classList.add(activeClass);

		const content = document.getElementById(templateId)!.cloneNode(true) as HTMLElement;
		content.removeAttribute('id');
		// Kept so existing selectors (and third-party CSS) still match the settings.
		content.classList.add('hu-options-modal-content', 'hu-layout-settings');

		if (host) {
			const step = Joomla.helixSubpanel.open({
				host,
				title,
				body: content,
				backLabel: 'Back to layout',
				className: 'hu-subpanel-layout-settings',
				// Settings apply as they change (the global Save keeps them); only actions stay here.
				footer: footerButtons.join('') || undefined,
				onClose: () => {
					if (settingsStep === step) settingsStep = null;
				},
			});

			settingsStep = step;
		} else {
			Joomla.helixModal.settings({ flag, title, class: 'hu-modal-small', footerButtons });
			document.querySelector('.hu-options-modal-inner')?.replaceChildren(content);
		}

		content.querySelectorAll<SettingsInput>('.hu-input').forEach(input => {
			const value = readData(target, input.dataset.attrname ?? '');

			setInputValue(input, value);
			showMediaPreview(input, value);
		});

		Joomla.initColorPicker?.();

		// Apply as you edit: titles follow typing, and a committed change updates the layout
		// (and drafts it). After the document handlers, which can undo a change (component area).
		content.addEventListener('input', () => applySettings(flag, content, target, false));
		content.addEventListener('change', () => setTimeout(() => applySettings(flag, content, target, true)));

		return content;
	}

	/** The settings being edited: the open step's, or the modal's. */
	const settingsContent = (): HTMLElement | null =>
		settingsStep?.body.querySelector<HTMLElement>('.hu-options-modal-content') ??
		document.querySelector<HTMLElement>('.hu-options-modal .hu-options-modal-content');

	delegate(document, 'click', '.hu-row-options', (event, button) => {
		event.preventDefault();

		const row = button.closest<HTMLElement>('.hu-layout-section');

		if (!row) return;

		openSettings({
			templateId: 'hu-row-settings',
			flag: 'row-setting',
			title: `Row: ${row.querySelector('.hu-section-title')?.textContent?.trim() || 'Row Options'}`,
			target: row,
			activeClass: 'row-active',
			footerButtons: [`<button type="button" class="hu-btn hu-btn-danger hu-settings-delete-row">${Joomla.utils.icon('trash')} Delete row</button>`],
		});
	});

	delegate(document, 'click', '#hu-layout-builder .hu-layout-column > .hu-column', (event, card) => {
		if (event.target instanceof Element && event.target.closest('.hu-column-options')) return;
		if (Date.now() - lastDragEnd < 300) return;

		card.querySelector<HTMLElement>('.hu-column-options')?.click();
	});

	delegate<HTMLElement, KeyboardEvent>(document, 'keydown', '#hu-layout-builder .hu-layout-column > .hu-column', (event, card) => {
		if (event.target !== card || (event.key !== 'Enter' && event.key !== ' ')) return;

		event.preventDefault();
		card.querySelector<HTMLElement>('.hu-column-options')?.click();
	});

	delegate(document, 'click', '.hu-column-options', (event, button) => {
		// The header row above the builder looks like a column but isn't one.
		if (!builder.contains(button)) return;

		event.preventDefault();

		const column = button.closest<HTMLElement>('.hu-layout-column');

		if (!column) return;

		const removable = columnsOfRow(column.closest('.hu-layout-section') ?? column).length > 1;
		const content = openSettings({
			templateId: 'hu-column-settings',
			flag: 'column-setting',
			title: `Column: ${column.querySelector('.hu-column-title')?.textContent?.trim() || 'Column Options'}`,
			target: column,
			activeClass: 'column-active',
			footerButtons: removable
				? [`<button type="button" class="hu-btn hu-btn-danger hu-settings-delete-column">${Joomla.utils.icon('trash')} ${layoutText('HELIX_ULTIMATE_MEGAMENU_REMOVE_COLUMN', 'Remove column')}</button>`]
				: [],
		});

		// "Sticky" only applies to the left and right sidebars.
		const nameSelect = content.querySelector<HTMLSelectElement>('select[data-attrname="name"]');
		const sticky = content.querySelector<HTMLInputElement>('.hu-input-sticky_position');

		const syncSticky = () => {
			const sidebar = Boolean(nameSelect && ['left', 'right'].includes(nameSelect.value));
			const group = sticky && sticky.closest<HTMLElement>('.control-group');

			if (!sticky || !group) return;

			if (!sidebar) sticky.checked = false;
			toggle(group, sidebar);
		};

		syncSticky();

		if (nameSelect) nameSelect.addEventListener('change', syncSticky);
	});

	/** Only one column can hold the component. */
	delegate<HTMLInputElement>(document, 'change', '.hu-options-modal-content .hu-input-column_type', (event, checkbox) => {
		const content = checkbox.closest('.hu-options-modal-content');
		const nameGroup = content && content.querySelector<HTMLElement>('.control-group.name');

		const taken = [...builder.querySelectorAll<HTMLElement>('.hu-layout-column:not(.column-active)')].some(column =>
			looseEq(readData(column, 'column_type'), '1')
		);

		if (taken) {
			alert('Component Area Taken');
			checkbox.checked = false;
			show(nameGroup);
			return;
		}

		if (checkbox.checked) {
			const active = builder.querySelector('.hu-layout-column.column-active .hu-column');
			if (active) active.classList.add('hu-column-component');
			hide(nameGroup);
		} else {
			builder.querySelectorAll('.hu-column-component').forEach(column => column.classList.remove('hu-column-component'));
			show(nameGroup);
		}

		updateLayoutField();
	});

	const closeSettings = (): void => {
		if (settingsStep) {
			settingsStep.close();
			return;
		}

		document.querySelectorAll('.hu-options-modal-overlay, .hu-options-modal').forEach(element => element.remove());
		document.body.classList.remove('hu-options-modal-open');
	};

	/**
	 * Store the settings in `content` on the row or column they were opened for.
	 * `commit` also writes the layout field, which drafts the change for the preview.
	 */
	function applySettings(flag: string, content: HTMLElement, target: Element, commit: boolean): void {
		const inputs = [...content.querySelectorAll<SettingsInput>('.hu-input')];

		switch (flag) {
			case 'row-setting': {
				const row = target;

				inputs.forEach(input => {
					const name = input.dataset.attrname ?? '';

					if (name === 'name') {
						const title = row.querySelector('.hu-section-title');
						if (title) title.textContent = input.value || 'Section Header';
					}

					setData(row, name, getInputValue(input));
				});
				break;
			}

			case 'column-setting': {
				const column = target;
				let component = false;

				inputs.forEach(input => {
					const name = input.dataset.attrname ?? '';
					const title = column.querySelector('.hu-column-title');

					if (name === 'column_type' && input instanceof HTMLInputElement && input.checked) {
						component = true;
						if (title) title.textContent = 'Component';
					} else if (name === 'name' && !component) {
						if (title) title.textContent = input.value || 'none';
					}

					setData(column, name, getInputValue(input));
				});
				break;
			}

			default:
				return;
		}

		if (commit) updateLayoutField();
	}

	/** The classic settings modal (no customizer panel) still applies with its button. */
	delegate(document, 'click', '.hu-settings-apply', (event, button) => {
		event.preventDefault();

		const content = settingsContent();
		const target = builder.querySelector(button.dataset.flag === 'row-setting' ? '.row-active' : '.column-active');

		if (content && target && button.dataset.flag) applySettings(button.dataset.flag, content, target, true);

		closeSettings();
	});

	delegate(document, 'click', '.hu-settings-cancel, .action-hu-options-modal-close', event => {
		event.preventDefault();
		closeSettings();
	});

	/* ------------------------------------------------------------------ */
	/* Grid patterns                                                       */
	/* ------------------------------------------------------------------ */

	delegate(document, 'click', '.hu-add-columns', (event, button) => {
		event.preventDefault();
		event.stopPropagation();

		const list = button.closest('li')?.querySelector<HTMLElement>('.hu-column-list');

		if (list) toggle(list, getComputedStyle(list).display === 'none', 'block');
	});

	delegate(document, 'click', '.hu-layout-custom-btn', (event, button) => {
		event.preventDefault();

		const custom = button.closest('.hu-column-list')?.querySelector<HTMLElement>('.hu-layout-custom');

		if (custom) toggle(custom, getComputedStyle(custom).display === 'none', 'block');
	});

	/**
	 * Rebuild a row's columns for a new grid pattern (e.g. ["4", "8"]).
	 * Existing columns keep their settings; extra ones are removed.
	 */
	function applyGrid(row: Element | null, sizes: string[]): void {
		const container = row?.querySelector('[data-hu-layout-row]');

		if (!container) return;

		const columns = [...container.querySelectorAll<HTMLElement>('.hu-layout-column')];

		sizes.forEach((rawSize, index) => {
			const size = String(rawSize).trim();

			let column = columns[index];

			if (!column) {
				column = document.createElement('div');
				column.innerHTML = `<div class="hu-column"><span class="hu-column-title">none</span>${COLUMN_OPTIONS_ICON}</div>`;
				setData(column, 'column_type', 0);
				setData(column, 'name', 'none');
				container.appendChild(column);
			}

			column.className = `hu-layout-column col-${size}`;
			setData(column, 'grid_size', size);
		});

		columns.slice(sizes.length).forEach(column => column.remove());

		if (row instanceof HTMLElement) layoutRowHandles(row);

		updateLayoutField();
	}

	const setActiveLayout = (list: Element, layoutButton: Element): void => {
		list.querySelectorAll('.hu-column-layout.active').forEach(item => item.classList.remove('active'));
		layoutButton.classList.add('active');
	};

	delegate(document, 'click', '.hu-column-layout', (event, layoutButton) => {
		event.preventDefault();

		if (layoutButton.dataset.type === 'custom') return;

		const list = layoutButton.closest<HTMLElement>('.hu-column-list');
		const layout = String(readData(layoutButton, 'layout'));

		if (!list) return;

		hide(list);

		if (layoutButton.classList.contains('active')) return;

		setActiveLayout(list, layoutButton);
		applyGrid(layoutButton.closest('.hu-layout-section'), looseEq(layout, 12) ? ['12'] : layout.split('+'));
	});

	delegate(document, 'click', '.hu-layout-custom-apply', (event, button) => {
		event.preventDefault();

		const list = button.closest<HTMLElement>('.hu-column-list');
		const customButton = list?.querySelector('.hu-layout-custom-btn');
		const pattern = button.closest('div')?.querySelector('input')?.value || '12';
		const sizes = pattern.split('+');
		const total = sizes.reduce((sum, size) => sum + Number(size), 0);

		if (total !== 12) {
			alert('Invalid grid pattern!');
			return;
		}

		if (!list || !customButton) return;

		customButton.setAttribute('data-layout', pattern);
		setActiveLayout(list, customButton);
		applyGrid(button.closest('.hu-layout-section'), sizes);
		hide(list);
	});

	/* ------------------------------------------------------------------ */
	/* Rows                                                                */
	/* ------------------------------------------------------------------ */

	delegate(document, 'click', '.hu-add-row', (event, button) => {
		event.preventDefault();

		const template = document.getElementById('hu-layout-section');

		if (!template) return;

		const row = template.cloneNode(true) as HTMLElement;

		row.classList.add('hu-layout-section');
		row.removeAttribute('id');
		button.closest('.hu-layout-section')?.after(row);
		layoutRowHandles(row);

		initSortables();
		updateLayoutField();
	});

	/** Delete the row whose Row Options modal is open. */
	/** Remove the column being edited; its width goes to the column before it (or after, for the first). */
	delegate(document, 'click', '.hu-settings-delete-column', event => {
		event.preventDefault();

		const column = builder.querySelector<HTMLElement>('.hu-layout-column.column-active');
		const row = column?.closest<HTMLElement>('.hu-layout-section');

		if (!column || !row) return;

		const columns = columnsOfRow(row);
		const index = columns.indexOf(column);

		if (columns.length < 2 || index < 0) return;

		const neighbour = columns[index > 0 ? index - 1 : 1];

		setColumnWidth(neighbour, widthOf(neighbour) + widthOf(column));
		column.remove();
		closeSettings();
		layoutRowHandles(row);
		setRowPattern(row, columnsOfRow(row).map(widthOf).join('+'));
		updateLayoutField();
	});

	delegate(document, 'click', '.hu-settings-delete-row', event => {
		event.preventDefault();

		const row = builder.querySelector('.hu-layout-section.row-active');

		if (!row || !confirm('Click Ok button to delete Row, Cancel to leave.')) return;

		row.remove();
		closeSettings();
		updateLayoutField();
	});
});
