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
				draggable: '.hu-megamenu-col',
				ghostClass: 'hu-column-sortable-placeholder',
				direction: 'horizontal',
				onStart: () => container.classList.add('hu-megamenu-column-dragging'),
				onEnd(event) {
					container.classList.remove('hu-megamenu-column-dragging');

					if (event.oldIndex === event.newIndex) {
						layoutRow(container.closest('.hu-megamenu-row-wrapper'));
						return;
					}

					const rowIndex = rowIdOf(container) - 1;
					swapColumn(rowIndex, event.oldIndex, event.newIndex);
					updateColumns(rowIndex);
					layoutRow(container.closest('.hu-megamenu-row-wrapper'));
				},
			})
		);
	}

	function itemSortable() {
		qa('.hu-megamenu-column-contents').forEach(container =>
			sortable(container, {
				group: 'hu-megamenu-items',
				draggable: '.hu-megamenu-cell',
				// A drag that starts on a cell's sub items sorts those, not the cell.
				filter: '.hu-cell-children',
				preventOnFilter: false,
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

					renumberCells(event.from);
					if (event.to !== event.from) renumberCells(event.to);
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
	/*
	 * Module / menu item picker: a dropdown under the column's add button with
	 * a search field, two tabs and a list. The search filters both lists here.
	 */
	let pickerAnchor = null;

	function closePopover(focusAnchor = false) {
		const pop = popover();

		if (!pop || !pop.classList.contains('show')) return;

		pop.classList.remove('show');

		if (pickerAnchor) {
			pickerAnchor.setAttribute('aria-expanded', 'false');
			if (focusAnchor) pickerAnchor.focus();
		}

		pickerAnchor = null;
	}

	/**
	 * Below the add button (above it when there is no room), inside the viewport.
	 * Positioned against its offset parent, so a transformed panel step is fine.
	 */
	function placePopover(pop, anchor) {
		const rect = anchor.getBoundingClientRect();
		const width = Math.min(300, window.innerWidth - 16);

		pop.style.width = `${width}px`;

		const height = pop.offsetHeight;
		const below = window.innerHeight - rect.bottom;
		const top = below >= height + 8 || below >= rect.top ? rect.bottom + 4 : Math.max(8, rect.top - height - 4);
		const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
		const parent = (pop.offsetParent || document.body).getBoundingClientRect();

		pop.style.top = `${top - parent.top}px`;
		pop.style.left = `${left - parent.left}px`;
	}

	function openPopover(anchor) {
		const pop = popover();
		const search = pop.querySelector('.hu-megamenu-module-search');

		pickerAnchor = anchor;
		anchor.setAttribute('aria-expanded', 'true');

		if (search) search.value = '';

		pop.classList.add('show');
		filterPicker('');
		placePopover(pop, anchor);

		if (search) search.focus({ preventScroll: true });
	}

	const pickerList = () => popover().querySelector('.hu-mm-picker-list:not([hidden])');
	const pickerOptions = () => [...(pickerList() ? pickerList().querySelectorAll('.hu-mm-picker-option:not([hidden])') : [])];

	function showPickerList(name) {
		const pop = popover();

		pop.querySelectorAll('.hu-mm-picker-tab').forEach(tab => {
			const active = tab.dataset.list === name;
			tab.classList.toggle('is-active', active);
			tab.setAttribute('aria-selected', String(active));
		});

		pop.querySelectorAll('.hu-mm-picker-list').forEach(list => (list.hidden = list.dataset.list !== name));
	}

	/** Ids of the menu items already in a column. */
	function placedMenuItems() {
		const placed = new Set();

		(state.settings.layout || []).forEach(row =>
			(row.attr || []).forEach(column =>
				(column.items || []).forEach(item => {
					if (item.type === 'menu_item') placed.add(String(item.item_id));
				})
			)
		);

		return placed;
	}

	/**
	 * Filter both lists by title (and position), case-insensitively. Menu items
	 * that are already in a column are left out: the list is what is still to place.
	 */
	function filterPicker(keyword) {
		const needle = keyword.trim().toLowerCase();
		const placed = placedMenuItems();

		popover().querySelectorAll('.hu-mm-picker-list').forEach(list => {
			let available = 0;
			let shown = 0;

			list.querySelectorAll('.hu-mm-picker-option').forEach(option => {
				const isPlaced = option.matches('.hu-megamenu-insert-menu') && placed.has(String(option.dataset.child));
				const match = !isPlaced && (!needle || option.textContent.toLowerCase().includes(needle));

				option.hidden = !match;
				if (!isPlaced) available++;
				if (match) shown++;
			});

			const empty = list.querySelector('.hu-mm-picker-empty');

			if (empty) {
				if (!empty.dataset.nothing) empty.dataset.nothing = empty.textContent.trim();

				// Nothing left to place reads differently from a search with no match.
				empty.textContent =
					list.dataset.list === 'menu' && available === 0 && list.querySelectorAll('.hu-mm-picker-option').length
						? text('HELIX_ULTIMATE_MEGAMENU_ALL_SUBITEMS_PLACED', 'All sub items are in the columns')
						: empty.dataset.nothing;
				empty.hidden = shown > 0;
			}
		});
	}

	async function getModulesContents(keyword = '') {
		const query = `&keyword=${encodeURIComponent(keyword)}&itemId=${encodeURIComponent(state.itemId)}`;
		return Joomla.utils.request(helixUrl('getModuleList', query));
	}

	/** Add a module or menu item to the column the picker was opened for. */
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
			if (contents) {
				contents.insertAdjacentHTML('beforeend', response.html);
				renderCellChildren(contents.lastElementChild);
			}

			closePopover(true);
			column.items.push({ type, item_id: itemId });
			row.attr[columnId - 1] = column;
		}
	}

	/* ------------------------------------------------------------------ */
	/* Sub items of a menu item cell                                       */
	/* ------------------------------------------------------------------ */

	/*
	 * A menu item in a column shows its own sub items (from the Menu panel's
	 * tree), in the order the site renders them. Dragging one up or down saves
	 * the new menu order right away, like sorting in the tree does.
	 */
	const gripIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 16" width="7" height="11" aria-hidden="true"><g fill="currentColor"><circle cx="2.5" cy="3" r="1.5"/><circle cx="7.5" cy="3" r="1.5"/><circle cx="2.5" cy="8" r="1.5"/><circle cx="7.5" cy="8" r="1.5"/><circle cx="2.5" cy="13" r="1.5"/><circle cx="7.5" cy="13" r="1.5"/></g></svg>';

	/** The sub items of a menu item, from the tree: [{ id, title }]. */
	function treeChildrenOf(itemId) {
		const tree = Joomla.sortable;
		const branch = document.querySelector(`#hu-menu-builder-container .hu-menu-tree-branch[data-itemid="${CSS.escape(String(itemId))}"]`);

		if (!tree || !branch) return [];

		return tree.getChildren(branch).map(child => ({
			id: String(child.dataset.itemid),
			title: (child.querySelector('.hu-branch-title') || child).textContent.trim(),
		}));
	}

	function renderCellChildren(cell) {
		if (!cell || cell.dataset.type !== 'menu_item') return;

		const children = treeChildrenOf(cell.dataset.itemId);
		let list = cell.querySelector(':scope > .hu-cell-children');

		if (!children.length) {
			if (list) list.remove();
			return;
		}

		if (!list) {
			list = document.createElement('ul');
			list.className = 'hu-cell-children';
			cell.appendChild(list);
			childrenSortable(list, cell);
		}

		list.innerHTML = '';

		children.forEach(child => {
			const item = document.createElement('li');
			item.className = 'hu-cell-child';
			item.dataset.itemid = child.id;
			item.innerHTML = `<span class="hu-cell-child-handle">${gripIcon}</span>`;
			item.appendChild(document.createTextNode(child.title));
			list.appendChild(item);
		});
	}

	const renderAllCellChildren = () => qa('.hu-megamenu-cell[data-type="menu_item"]').forEach(renderCellChildren);

	function childrenSortable(list, cell) {
		if (!window.Sortable || sortables.has(list)) return;

		sortables.add(list);
		Sortable.create(list, {
			group: `hu-cell-children-${cell.dataset.itemId}`,
			animation: 150,
			forceFallback: true,
			fallbackOnBody: true,
			draggable: '.hu-cell-child',
			ghostClass: 'hu-item-sortable-placeholder',
			async onEnd(event) {
				if (event.oldIndex === event.newIndex || !Joomla.helixMenuTree) return;

				const ids = [...list.querySelectorAll(':scope > .hu-cell-child')].map(child => child.dataset.itemid);

				list.classList.add('is-saving');
				await Joomla.helixMenuTree.saveOrder(ids);
				list.classList.remove('is-saving');

				// The tree is redrawn; every cell showing these items follows it.
				renderAllCellChildren();
			},
		});
	}

	/** Cells carry their position for removal; keep it in order. */
	function renumberCells(contents) {
		contents.querySelectorAll(':scope > .hu-megamenu-cell').forEach((cell, index) => cell.setAttribute('data-cellid', index + 1));
	}

	/* ------------------------------------------------------------------ */
	/* Column widths                                                       */
	/* ------------------------------------------------------------------ */

	/*
	 * A row is a CSS grid; each column's stored width (1–12, the saved
	 * colGrid) is its fr share, so a row always adds up to 12. Handles between
	 * columns move width from one column to its neighbour, snapping to twelfths.
	 * The new layout goes through updateRowLayout like a preset, so the items
	 * stay in their columns.
	 */
	const GRID = 12;
	const text = (key, fallback) => {
		const value = Joomla.Text ? Joomla.Text._(key) : '';
		return value && value !== key ? value : fallback;
	};

	const columnsOf = row => [...row.querySelectorAll('.hu-megamenu-columns-container > .hu-megamenu-col')];
	const widthOfColumn = column => Number((column.className.match(/\bcol-(\d+)\b/) || [])[1] || GRID);
	const widthsOf = row => columnsOf(row).map(widthOfColumn);

	function setColumnWidth(column, width) {
		column.className = /\bcol-\d+\b/.test(column.className)
			? column.className.replace(/\bcol-\d+\b/, `col-${width}`)
			: `${column.className} col-${width}`;
	}

	const plusIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M8 3.5v9M3.5 8h9"/></svg>';
	const crossIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>';

	/** Grid template, width labels, handles and the add / remove buttons of a row. */
	function layoutRow(row) {
		if (!row) return;

		const container = row.querySelector('.hu-megamenu-columns-container');
		const columns = columnsOf(row);
		const widths = columns.map(widthOfColumn);

		if (!container) return;

		container.style.gridTemplateColumns = widths.map(width => `minmax(0, ${width}fr)`).join(' ');

		columns.forEach((column, index) => {
			const toolbar = column.querySelector('.hu-megamenu-column-toolbar');

			if (!toolbar) return;

			let label = toolbar.querySelector('.hu-col-width');

			if (!label) {
				label = document.createElement('span');
				label.className = 'hu-col-width';
				toolbar.appendChild(label);
			}

			label.textContent = `${widths[index]}/${GRID}`;

			if (!toolbar.querySelector('.hu-megamenu-remove-column')) {
				const remove = document.createElement('button');
				remove.type = 'button';
				remove.className = 'hu-megamenu-remove-column';
				remove.title = text('HELIX_ULTIMATE_MEGAMENU_REMOVE_COLUMN', 'Remove column');
				remove.setAttribute('aria-label', remove.title);
				remove.innerHTML = crossIcon;
				// Not a drag handle for the column.
				remove.addEventListener('pointerdown', event => event.stopPropagation());
				toolbar.appendChild(remove);
			}
		});

		row.classList.toggle('is-single-column', columns.length < 2);

		const right = row.querySelector('.hu-megamenu-row-toolbar-right');
		let add = right && right.querySelector('.hu-megamenu-add-column');

		if (right && !add) {
			add = document.createElement('a');
			add.href = '#';
			add.className = 'hu-megamenu-add-column';
			add.title = text('HELIX_ULTIMATE_MEGAMENU_ADD_COLUMN', 'Add column');
			add.setAttribute('role', 'button');
			add.setAttribute('aria-label', add.title);
			add.innerHTML = plusIcon;
			right.prepend(add);
		}

		if (add) add.classList.toggle('is-disabled', Math.max(...widths, 0) < 2);

		// One handle between each pair of columns, in an overlay outside the
		// columns container (its HTML is replaced, and it is a sortable list).
		let overlay = row.querySelector(':scope > .hu-col-resizers');

		if (!overlay) {
			overlay = document.createElement('div');
			overlay.className = 'hu-col-resizers';
			row.appendChild(overlay);
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

		while (overlay.children.length > Math.max(columns.length - 1, 0)) overlay.lastElementChild.remove();

		[...overlay.children].forEach((handle, index) => {
			handle.dataset.index = String(index);
			handle.setAttribute('aria-valuenow', String(widths[index]));
			handle.setAttribute('aria-valuemax', String(widths[index] + widths[index + 1] - 1));
			handle.setAttribute(
				'aria-label',
				text('HELIX_ULTIMATE_MEGAMENU_COLUMN_WIDTH', 'Width of column %1$s, %2$s of 12')
					.replace('%1$s', String(index + 1))
					.replace('%2$s', String(widths[index]))
			);
		});

		positionHandles(row);

		if (window.ResizeObserver && !container.huObserved) {
			container.huObserved = true;
			new ResizeObserver(() => positionHandles(row)).observe(container);
		}
	}

	/** Put each handle in the middle of the gap after its column. */
	function positionHandles(row) {
		const overlay = row.querySelector(':scope > .hu-col-resizers');
		const container = row.querySelector('.hu-megamenu-columns-container');

		if (!overlay || !container) return;

		const rowBox = row.getBoundingClientRect();
		const box = container.getBoundingClientRect();
		const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
		const columns = columnsOf(row);

		overlay.style.top = `${box.top - rowBox.top}px`;
		overlay.style.left = `${box.left - rowBox.left}px`;
		overlay.style.width = `${box.width}px`;
		overlay.style.height = `${box.height}px`;

		[...overlay.children].forEach((handle, index) => {
			const column = columns[index];
			if (column) handle.style.left = `${column.getBoundingClientRect().right - box.left + gap / 2}px`;
		});
	}

	/** Move width between column `index` and the next one; `left` is the new width of the first. */
	function setPair(row, index, left) {
		const columns = columnsOf(row);
		const widths = columns.map(widthOfColumn);
		const pair = widths[index] + widths[index + 1];
		const next = Math.min(Math.max(Math.round(left), 1), pair - 1);

		if (next === widths[index]) return false;

		setColumnWidth(columns[index], next);
		setColumnWidth(columns[index + 1], pair - next);
		layoutRow(row);
		row.dataset.dirty = '1';

		return true;
	}

	const commitTimers = new WeakMap();

	/** Store the row's widths (after a pause for keyboard nudges). */
	function commitSoon(row, delay = 450) {
		if (!row || row.dataset.dirty !== '1') return;

		clearTimeout(commitTimers.get(row));
		commitTimers.set(
			row,
			setTimeout(() => {
				delete row.dataset.dirty;
				changeRowsColumns(rowIdOf(row) - 1, widthsOf(row).join('+'), row.querySelector('.hu-megamenu-columns-container'));
			}, delay)
		);
	}

	function startResize(event, handle) {
		if (event.button !== 0) return;

		event.preventDefault();

		const row = handle.closest('.hu-megamenu-row-wrapper');
		const container = row.querySelector('.hu-megamenu-columns-container');
		const index = Number(handle.dataset.index);
		const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
		const count = columnsOf(row).length;
		const unit = (container.getBoundingClientRect().width - gap * (count - 1)) / GRID;

		handle.setPointerCapture(event.pointerId);
		handle.focus({ preventScroll: true });
		row.classList.add('is-resizing');

		const move = moveEvent => {
			// The left edge of the first column of the pair (it does not move while dragging).
			const start = columnsOf(row)[index].getBoundingClientRect().left;
			setPair(row, index, (moveEvent.clientX - start - gap / 2) / unit);
		};

		const end = () => {
			handle.removeEventListener('pointermove', move);
			handle.removeEventListener('pointerup', end);
			handle.removeEventListener('pointercancel', end);
			row.classList.remove('is-resizing');
			commitSoon(row, 0);
		};

		handle.addEventListener('pointermove', move);
		handle.addEventListener('pointerup', end);
		handle.addEventListener('pointercancel', end);
	}

	function resizeWithKeys(event, handle) {
		const row = handle.closest('.hu-megamenu-row-wrapper');
		const index = Number(handle.dataset.index);
		const widths = widthsOf(row);
		const pair = widths[index] + widths[index + 1];
		const target = {
			ArrowLeft: widths[index] - 1,
			ArrowRight: widths[index] + 1,
			Home: 1,
			End: pair - 1,
		}[event.key];

		if (target === undefined) return;

		event.preventDefault();

		if (setPair(row, index, target)) commitSoon(row);
	}

	/** Split the widest column (the last one, if several tie) in two, in place. */
	function addColumn(row) {
		const widths = widthsOf(row);
		const widest = Math.max(...widths);

		if (widest < 2) return;

		const index = widths.lastIndexOf(widest);
		const rowData = state.settings.layout[rowIdOf(row) - 1];

		widths.splice(index, 1, Math.ceil(widest / 2), Math.floor(widest / 2));

		if (rowData) {
			rowData.attr = rowData.attr || [];
			rowData.attr.splice(index + 1, 0, { menuParentId: '', moduleId: '', type: 'column', items: [], colGrid: String(Math.floor(widest / 2)) });
		}

		changeRowsColumns(rowIdOf(row) - 1, widths.join('+'), row.querySelector('.hu-megamenu-columns-container'));
	}

	/** Remove a column; its width goes to the column before it (or after, for the first). */
	function removeColumn(column) {
		const row = column.closest('.hu-megamenu-row-wrapper');
		const columns = columnsOf(row);
		const index = columns.indexOf(column);

		if (columns.length < 2 || index < 0) return;

		if (column.querySelector('.hu-megamenu-cell') && !window.confirm(text('HELIX_ULTIMATE_MEGAMENU_REMOVE_COLUMN_CONFIRM', 'Remove this column and the items in it?'))) {
			return;
		}

		const widths = columns.map(widthOfColumn);
		const neighbour = index > 0 ? index - 1 : 1;
		const rowData = state.settings.layout[rowIdOf(row) - 1];

		widths[neighbour] += widths[index];
		widths.splice(index, 1);

		if (rowData && rowData.attr) rowData.attr.splice(index, 1);

		changeRowsColumns(rowIdOf(row) - 1, widths.join('+'), row.querySelector('.hu-megamenu-columns-container'));
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
			layoutRow(columnsContainer.closest('.hu-megamenu-row-wrapper'));
			columnsContainer.querySelectorAll('.hu-megamenu-cell[data-type="menu_item"]').forEach(renderCellChildren);
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
			layoutRow(qa('.hu-megamenu-row-wrapper').pop());
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

		// New row from a preset layout.
		delegate(document, 'click', '.hu-megamenu-add-slots .hu-megamenu-column-layout', (event, option) => {
			event.preventDefault();
			addRow(option.dataset.layout || '12');
		});

		// Change an existing row's columns: the current layout is marked.
		delegate(document, 'click', '.hu-megamenu-columns', (event, button) => {
			event.preventDefault();

			const slots = button.closest('.hu-megamenu-row-toolbar-right').querySelector('.hu-megamenu-row-slots');

			if (!slots || !slots.classList.toggle('show')) return;

			const current = widthsOf(button.closest('.hu-megamenu-row-wrapper')).join('+');

			slots.querySelectorAll('.hu-megamenu-column-layout').forEach(option => {
				const active = option.dataset.layout === current;
				option.classList.toggle('active', active);
				option.setAttribute('aria-current', String(active));
			});
		});

		delegate(document, 'click', '.hu-megamenu-row-slots .hu-megamenu-column-layout', (event, option) => {
			event.preventDefault();

			const row = option.closest('.hu-megamenu-row-wrapper');
			changeRowsColumns(rowIdOf(option) - 1, option.dataset.layout || '12', row.querySelector('.hu-megamenu-columns-container'));
		});

		// Column widths: drag (or arrow keys on) the handle between two columns.
		delegate(document, 'pointerdown', '.hu-col-resizer', startResize);
		delegate(document, 'keydown', '.hu-col-resizer', resizeWithKeys);
		delegate(document, 'focusout', '.hu-col-resizer', (event, handle) => commitSoon(handle.closest('.hu-megamenu-row-wrapper'), 0));

		delegate(document, 'click', '.hu-megamenu-add-column', (event, button) => {
			event.preventDefault();
			addColumn(button.closest('.hu-megamenu-row-wrapper'));
		});

		delegate(document, 'click', '.hu-megamenu-remove-column', (event, button) => {
			event.preventDefault();
			removeColumn(button.closest('.hu-megamenu-col'));
		});

		window.addEventListener('resize', () => qa('.hu-megamenu-row-wrapper').forEach(positionHandles));

		// Module / menu item picker.
		delegate(document, 'click', '.hu-megamenu-add-new-item', async (event, button) => {
			event.preventDefault();

			const pop = popover();

			if (pickerAnchor === button && pop.classList.contains('show')) {
				closePopover(true);
				return;
			}

			pop.setAttribute('data-rowid', rowIdOf(button));
			pop.setAttribute('data-columnid', columnIdOf(button));
			button.setAttribute('aria-haspopup', 'dialog');

			const response = await getModulesContents();
			if (response.status) pop.querySelector('.hu-megamenu-modules-container').innerHTML = response.html;

			openPopover(button);
		});

		delegate(document, 'input', '.hu-megamenu-module-search', (event, input) => filterPicker(input.value));

		delegate(document, 'click', '.hu-mm-picker-tab', (event, tab) => {
			showPickerList(tab.dataset.list);
			const search = popover().querySelector('.hu-megamenu-module-search');
			if (search) search.focus();
		});

		// ↓ from the search goes into the list; ↑/↓/Home/End move, Enter inserts, Esc closes.
		delegate(document, 'keydown', '.hu-megamenu-popover', (event, pop) => {
			const options = pickerOptions();
			const index = options.indexOf(document.activeElement);
			const inSearch = document.activeElement && document.activeElement.matches('.hu-megamenu-module-search');

			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				if (!options.length) return;

				const next = inSearch ? (event.key === 'ArrowDown' ? 0 : options.length - 1) : index + (event.key === 'ArrowDown' ? 1 : -1);

				if (next < 0) pop.querySelector('.hu-megamenu-module-search').focus();
				else options[Math.min(next, options.length - 1)].focus();
			} else if ((event.key === 'Home' || event.key === 'End') && !inSearch && options.length) {
				event.preventDefault();
				options[event.key === 'Home' ? 0 : options.length - 1].focus();
			} else if (event.key === 'Enter' || (event.key === ' ' && !inSearch)) {
				const target = inSearch && options.length === 1 ? options[0] : index >= 0 ? options[index] : null;

				if (target) {
					event.preventDefault();
					target.click();
				}
			}
		});

		// A click outside the picker (and not on an add button) closes it.
		document.addEventListener('pointerdown', event => {
			const pop = popover();

			if (!pop || !pop.classList.contains('show')) return;
			if (event.target instanceof Element && (pop.contains(event.target) || event.target.closest('.hu-megamenu-add-new-item'))) return;

			closePopover();
		});

		// It is anchored to the button, so it closes when the page or the step scrolls.
		document.addEventListener(
			'scroll',
			event => {
				const pop = popover();
				if (pop && pop.classList.contains('show') && !(event.target instanceof Node && pop.contains(event.target))) closePopover();
			},
			true
		);

		delegate(document, 'click', '.hu-megamenu-insert-module', (event, button) => addCell('module', Joomla.utils.readData(button, 'module')));
		delegate(document, 'click', '.hu-megamenu-insert-menu', (event, button) => addCell('menu_item', Joomla.utils.readData(button, 'child')));

		delegate(document, 'click', '.hu-megamenu-cell-remove', (event, button) => {
			const cell = button.closest('.hu-megamenu-cell');
			const cellId = Number(cell.dataset.cellid || 1);
			const column = state.settings.layout[rowIdOf(button) - 1].attr[columnIdOf(button) - 1];
			const items = column.items || [];

			const contents = cell.parentElement;

			cell.remove();

			if (items.length) items.splice(cellId - 1, 1);
			column.items = items;

			if (contents) renumberCells(contents);
		});

		// Escape closes the popover before the modal.
		document.addEventListener(
			'keydown',
			event => {
				const pop = popover();

				if (event.key === 'Escape' && pop && pop.classList.contains('show')) {
					event.stopImmediatePropagation();
					closePopover(true);
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
		qa('.hu-megamenu-row-wrapper').forEach(layoutRow);

		renderAllCellChildren();
	}

	Joomla.helixMegaMenu = { run };
})();
