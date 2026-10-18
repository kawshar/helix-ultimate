/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Mega menu builder (inside the mega menu modal).
 *
 * `run({ root, close })` is called every time the builder opens (as a
 * customizer panel step, or in the classic modal); it reads the new settings
 * from `root` (the builder's container; defaults to the open modal). `close`
 * closes whatever holds the builder; without it the modal is closed.
 * Event handlers are delegated and registered once.
 */
(() => {
	const DEFAULT_SETTINGS = {
		badge: '',
		badge_bg_color: '',
		badge_position: '',
		badge_text_color: '',
		customclass: '',
		dropdown: 'right',
		faicon: '',
		layout: [],
		megamenu: 0,
		menualign: 'full',
		showtitle: 1,
		width: '600px',
	};

	const SIDEBAR_FIELDS = [
		'megamenu',
		'width',
		'dropdown',
		'showtitle',
		'menualign',
		'faicon',
		'customclass',
		'badge',
		'badge_position',
		'badge_bg_color',
		'badge_text_color',
	];

	const state = {
		root: null,
		close: null,
		itemId: 0,
		baseUrl: '',
		settings: { ...DEFAULT_SETTINGS },
	};

	let bound = false;

	// Scoped to the builder that is open, so a step that is still closing (or
	// any other copy of the markup) is never read by mistake.
	const root = () => (state.root && state.root.isConnected ? state.root : document);
	// The root itself counts too (in a panel step it is the .hu-mega-menu-builder).
	const q = selector => {
		const scope = root();
		return scope !== document && scope.matches(selector) ? scope : scope.querySelector(selector);
	};
	const qa = selector => {
		const scope = root();
		const found = [...scope.querySelectorAll(selector)];
		return scope !== document && scope.matches(selector) ? [scope, ...found] : found;
	};
	const popover = () => q('.hu-megamenu-popover');

	const helixUrl = (action, extra = '') =>
		`${state.baseUrl}/administrator/index.php?option=com_ajax&helix=ultimate&request=task&action=${action}${extra}&helix_id=${window.helixUltimateStyleId}`;

	const post = (action, data) => Joomla.utils.request(helixUrl(action), { method: 'POST', data: Joomla.utils.param(data) });

	const rowIdOf = element => Number((element.closest('.hu-megamenu-row-wrapper') || {}).dataset?.rowid || 1);
	const columnIdOf = element => Number((element.closest('.hu-megamenu-col') || {}).dataset?.columnid || 1);

	/* ------------------------------------------------------------------ */
	/* Settings data                                                       */
	/* ------------------------------------------------------------------ */

	function swapRow(prev, curr) {
		const [row] = state.settings.layout.splice(prev, 1);
		state.settings.layout.splice(curr, 0, row);
	}

	function swapColumn(rowIndex, prev, curr) {
		const columns = state.settings.layout[rowIndex].attr;
		const [column] = columns.splice(prev, 1);
		columns.splice(curr, 0, column);
	}

	function swapItem({ prevRowIndex, prevColIndex, prevItemIndex, currRowIndex, currColIndex, currItemIndex }) {
		const layout = state.settings.layout;
		const fromItems = [...(layout[prevRowIndex].attr[prevColIndex].items || [])];
		const [item] = fromItems.splice(prevItemIndex, 1);

		layout[prevRowIndex].attr[prevColIndex].items = fromItems;

		const target = layout[currRowIndex].attr[currColIndex];
		const toItems = [...(target.items || [])];

		toItems.splice(toItems.length ? currItemIndex : 0, 0, item);
		target.items = toItems;
	}

	/** Re-number rows / columns after they move. */
	function updateRows() {
		qa('.hu-megamenu-row-wrapper').forEach((row, index) => row.setAttribute('data-rowid', index + 1));
	}

	function updateColumns(rowIndex) {
		qa(`.hu-megamenu-row-wrapper[data-rowid="${rowIndex + 1}"] .hu-megamenu-col`).forEach((column, index) =>
			column.setAttribute('data-columnid', index + 1)
		);
	}

	/* ------------------------------------------------------------------ */
	/* Drag and drop (SortableJS)                                          */
	/* ------------------------------------------------------------------ */

	const sortables = new WeakSet();

	const sortable = (container, options) => {
		if (!container || sortables.has(container) || !window.Sortable) return;

		sortables.add(container);
		Sortable.create(container, { animation: 150, forceFallback: true, fallbackOnBody: true, ...options });
	};

	function rowSortable() {
		qa('.hu-megamenu-rows-container').forEach(container =>
			sortable(container, {
				handle: '.hu-megamenu-row-drag-handlers',
				ghostClass: 'hu-row-sortable-placeholder',
				direction: 'vertical',
				onEnd(event) {
					if (event.oldIndex === event.newIndex) return;
					swapRow(event.oldIndex, event.newIndex);
					updateRows();
				},
			})
		);
	}

	function columnSortable() {
		qa('.hu-megamenu-columns-container').forEach(container =>
			sortable(container, {
				handle: '.hu-megamenu-column-drag-handler',
				ghostClass: 'hu-column-sortable-placeholder',
				direction: 'horizontal',
				onStart: () => container.classList.add('hu-megamenu-column-dragging'),
				onEnd(event) {
					container.classList.remove('hu-megamenu-column-dragging');

					if (event.oldIndex === event.newIndex) return;

					const rowIndex = rowIdOf(container) - 1;
					swapColumn(rowIndex, event.oldIndex, event.newIndex);
					updateColumns(rowIndex);
				},
			})
		);
	}

	function itemSortable() {
		qa('.hu-megamenu-column-contents').forEach(container =>
			sortable(container, {
				group: 'hu-megamenu-items',
				draggable: '.hu-megamenu-cell',
				ghostClass: 'hu-item-sortable-placeholder',
				onStart(event) {
					const remove = event.item.querySelector('.hu-megamenu-cell-remove');
					if (remove) remove.style.opacity = 0;
				},
				onEnd(event) {
					const remove = event.item.querySelector('.hu-megamenu-cell-remove');
					if (remove) remove.style.opacity = 1;

					if (event.from === event.to && event.oldDraggableIndex === event.newDraggableIndex) return;

					swapItem({
						prevRowIndex: rowIdOf(event.from) - 1,
						prevColIndex: columnIdOf(event.from) - 1,
						prevItemIndex: event.oldDraggableIndex,
						currRowIndex: rowIdOf(event.to) - 1,
						currColIndex: columnIdOf(event.to) - 1,
						currItemIndex: event.newDraggableIndex,
					});
				},
			})
		);
	}

	function refreshSortable(kinds = ['row', 'column', 'item']) {
		const map = { row: rowSortable, column: columnSortable, item: itemSortable };
		[].concat(kinds).forEach(kind => map[kind] && map[kind]());
	}

	/* ------------------------------------------------------------------ */
	/* UI helpers                                                          */
	/* ------------------------------------------------------------------ */

	/** Show the grid and settings only when the item is a mega menu. */
	function toggleSidebarSettings(status) {
		qa('.hu-megamenu-settings, .hu-megamenu-grid').forEach(element => element.classList.toggle('show', status));
		qa('.hu-mega-menu-builder').forEach(element => element.classList.toggle('collapsed', !status));
		qa('.hu-megamenu-alignment').forEach(element => Joomla.utils.toggle(element, status));
		qa('.hu-menuitem-dropdown-position').forEach(element => Joomla.utils.toggle(element, !status));
	}

	const closeRowLayoutDisplay = () => qa('.hu-megamenu-row-slots.show').forEach(slot => slot.classList.remove('show'));
	const closeLayoutDisplay = () => qa('.hu-megamenu-add-slots').forEach(slots => Joomla.utils.hide(slots));
	const closePopover = () => popover() && popover().classList.remove('show');

	function openPopover() {
		popover().classList.add('show');
		qa('.hu-megamenu-module-search').forEach(search => (search.value = ''));
	}

	async function getModulesContents(keyword = '') {
		const query = `&keyword=${encodeURIComponent(keyword)}&itemId=${encodeURIComponent(state.itemId)}`;
		return Joomla.utils.request(helixUrl('getModuleList', query));
	}

	/** Add a module or menu item to the column the popover was opened for. */
	async function addCell(type, itemId) {
		const pop = popover();
		const rowId = Number(pop.dataset.rowid);
		const columnId = Number(pop.dataset.columnid);
		const row = state.settings.layout[rowId - 1];

		if (!row.attr) row.attr = [];

		const column = row.attr[columnId - 1] || { items: [] };
		if (!column.items) column.items = [];

		const response = await post('generateNewCell', {
			type,
			item_id: itemId,
			itemId: state.itemId,
			rowId,
			columnId,
			cellId: column.items.length + 1,
		});

		if (response.status) {
			const contents = q(`.hu-megamenu-row-wrapper[data-rowid="${rowId}"] .hu-megamenu-col[data-columnid="${columnId}"] .hu-megamenu-column-contents`);

			if (contents) contents.insertAdjacentHTML('beforeend', response.html);

			closePopover();
			column.items.push({ type, item_id: itemId });
			row.attr[columnId - 1] = column;
		}
	}

	async function changeRowsColumns(rowIndex, layout, columnsContainer) {
		const response = await post('updateRowLayout', {
			layout,
			data: JSON.stringify(state.settings.layout[rowIndex]),
			rowId: rowIndex + 1,
			itemId: state.itemId,
		});

		if (response.status) {
			columnsContainer.innerHTML = response.html;
			state.settings.layout[rowIndex] = response.data;
			closeRowLayoutDisplay();
			refreshSortable(['item']);
		}
	}

	async function addRow(layout) {
		const response = await post('generateRow', {
			layout,
			rowId: state.settings.layout.length + 1,
			itemId: state.itemId,
		});

		if (response.status) {
			q('.hu-megamenu-rows-container').insertAdjacentHTML('beforeend', response.data);
			closeLayoutDisplay();
			state.settings.layout.push(response.row);
			refreshSortable();
		}
	}

	/** Close the step or modal that holds the builder. */
	const closeEditor = () => (state.close ? state.close() : Joomla.helixModal.close());

	async function save() {
		try {
			const response = await post('saveMegaMenuSettings', { settings: state.settings, id: state.itemId });
			if (response.status) Joomla.reloadPreview();
		} catch (error) {
			alert('Something went wrong!');
		}

		closeEditor();
		Joomla.HelixToaster.success('Saved mega menu settings!', 'Success');
	}

	/* ------------------------------------------------------------------ */
	/* Events (registered once)                                            */
	/* ------------------------------------------------------------------ */

	function bindEvents() {
		const { delegate } = Joomla.utils;

		delegate(document, 'click', '.hu-megamenu-save-btn', event => {
			event.preventDefault();
			save();
		});

		delegate(document, 'click', '.hu-megamenu-cancel-btn', event => {
			event.preventDefault();
			closeEditor();
		});

		delegate(document, 'change', '.hu-megamenu-builder-megamenu', (event, input) => toggleSidebarSettings(input.checked));

		SIDEBAR_FIELDS.forEach(name => {
			delegate(document, 'change', `.hu-megamenu-sidebar [name="${name}"]`, (event, field) => {
				state.settings[name] = field.type === 'checkbox' ? String(Number(field.checked)) : field.value;
			});
		});

		delegate(document, 'click', '.hu-megamenu-remove-row', (event, button) => {
			event.preventDefault();

			const row = button.closest('.hu-megamenu-row-wrapper');
			const index = [...row.parentElement.children].indexOf(row);

			row.remove();
			state.settings.layout.splice(index, 1);
		});

		delegate(document, 'click', '.hu-megamenu-add-row > a', (event, link) => {
			const slots = link.closest('.hu-megamenu-grid').querySelector('.hu-megamenu-add-slots');
			Joomla.utils.toggle(slots, getComputedStyle(slots).display === 'none', 'block');
		});

		delegate(document, 'click', '.hu-megamenu-custom', (event, button) => {
			const custom = button.closest('.hu-megamenu-columns-layout').querySelector('.hu-megamenu-custom-layout');
			Joomla.utils.toggle(custom, getComputedStyle(custom).display === 'none', 'block');
		});

		// New row from a preset or custom layout.
		delegate(document, 'click', '.hu-megamenu-add-slots .hu-megamenu-column-layout:not(.hu-megamenu-custom)', (event, option) => {
			event.preventDefault();
			addRow(option.dataset.layout || '12');
		});

		delegate(document, 'click', '.hu-megamenu-add-slots .hu-megamenu-custom-layout-apply', (event, button) => {
			event.preventDefault();

			const field = button.closest('.hu-megamenu-add-slots').querySelector('.hu-megamenu-custom-layout-field');
			if (field && field.value) addRow(field.value);
		});

		// Change an existing row's columns.
		delegate(document, 'click', '.hu-megamenu-columns', (event, button) => {
			const slots = button.closest('.hu-megamenu-row-toolbar-right').querySelector('.hu-megamenu-row-slots');
			if (slots) slots.classList.toggle('show');
		});

		delegate(document, 'click', '.hu-megamenu-row-slots .hu-megamenu-column-layout:not(.hu-megamenu-custom)', (event, option) => {
			const row = option.closest('.hu-megamenu-row-wrapper');
			changeRowsColumns(rowIdOf(option) - 1, option.dataset.layout || '12', row.querySelector('.hu-megamenu-columns-container'));
		});

		delegate(document, 'click', '.hu-megamenu-row-slots .hu-megamenu-custom-layout-apply', (event, button) => {
			const row = button.closest('.hu-megamenu-row-wrapper');
			const field = button.parentElement.querySelector('.hu-megamenu-custom-layout-field');
			changeRowsColumns(rowIdOf(button) - 1, field ? field.value : '12', row.querySelector('.hu-megamenu-columns-container'));
		});

		// Module / menu item popover.
		delegate(document, 'click', '.hu-megamenu-add-new-item', async (event, button) => {
			const pop = popover();

			pop.setAttribute('data-rowid', rowIdOf(button));
			pop.setAttribute('data-columnid', columnIdOf(button));

			const response = await getModulesContents();
			if (response.status) pop.querySelector('.hu-megamenu-modules-container').innerHTML = response.html;

			openPopover();
		});

		let searchTimeout = null;

		delegate(document, 'keyup', '.hu-megamenu-module-search', (event, input) => {
			clearTimeout(searchTimeout);

			searchTimeout = setTimeout(async () => {
				const response = await getModulesContents(input.value);
				if (response.status) popover().querySelector('.hu-megamenu-modules-container').innerHTML = response.html;
			}, 100);
		});

		delegate(document, 'click', '.hu-megamenu-popover-close', closePopover);

		delegate(document, 'click', '.hu-megamenu-insert-module', (event, button) => addCell('module', Joomla.utils.readData(button, 'module')));
		delegate(document, 'click', '.hu-megamenu-insert-menu', (event, button) => addCell('menu_item', Joomla.utils.readData(button, 'child')));

		delegate(document, 'click', '.hu-megamenu-cell-remove', (event, button) => {
			const cell = button.closest('.hu-megamenu-cell');
			const cellId = Number(cell.dataset.cellid || 1);
			const column = state.settings.layout[rowIdOf(button) - 1].attr[columnIdOf(button) - 1];
			const items = column.items || [];

			cell.remove();

			if (items.length) items.splice(cellId - 1, 1);
			column.items = items;
		});

		// Escape closes the popover before the modal.
		document.addEventListener(
			'keydown',
			event => {
				const pop = popover();

				if (event.key === 'Escape' && pop && pop.classList.contains('show')) {
					event.stopImmediatePropagation();
					closePopover();
				}
			},
			true
		);
	}

	/* ------------------------------------------------------------------ */
	/* Run (each time the modal opens)                                     */
	/* ------------------------------------------------------------------ */

	function run(options = {}) {
		state.close = typeof options.close === 'function' ? options.close : null;
		state.root = options.root || document.querySelector('.hu-modal.hu-mega-menu-builder') || null;

		if (!bound) {
			bindEvents();
			bound = true;
		}

		const settingsInput = q('#hu-megamenu-layout-settings');
		let settings = settingsInput ? settingsInput.value : '';

		settings = settings ? JSON.parse(settings) : {};

		state.settings = { ...DEFAULT_SETTINGS, ...settings };
		state.itemId = (q('#hu-menu-itemid') || {}).value || 0;
		state.baseUrl = (q('#hu-base-url') || {}).value || '';

		Joomla.initColorPicker();

		// Searchable icon picker.
		qa('select[data-husearch]').forEach(select =>
			Joomla.utils.searchSelect(select, {
				placeholder: Joomla.Text._('HELIX_ULTIMATE_SELECT_ICON_LABEL'),
			})
		);

		const megamenu = q('.hu-megamenu-builder-megamenu');
		toggleSidebarSettings(Boolean(megamenu && megamenu.checked));

		refreshSortable();
	}

	Joomla.helixMegaMenu = { run };
})();
