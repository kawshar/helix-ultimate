/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

document.addEventListener('DOMContentLoaded', () => {
	const { fire, delegate, readData } = Joomla.utils;

	/** Alignment switcher writes its value into the hidden input. */
	document.querySelectorAll('.hu-field-alignment .hu-switcher-action').forEach(action => {
		action.addEventListener('click', event => {
			event.preventDefault();

			[...action.parentElement.children].forEach(sibling => sibling.classList.remove('active'));
			action.classList.add('active');

			const input = action.closest('.hu-field-alignment').querySelector('input[type=hidden]');

			if (input) {
				input.value = readData(action, 'value');
				fire(input);
			}
		});
	});

	/* ------------------------------------------------------------------ */
	/* Menu items selector                                                 */
	/* ------------------------------------------------------------------ */

	const hierarchyInput = element => element.closest('.hu-menu-hierarchy-container').querySelector('input[type=hidden]');

	// "Select all" checks every item in its list.
	delegate(document, 'change', '.hu-menu-hierarchy-container .hu-menu-item-selector.select-all', (event, selectAll) => {
		const list = selectAll.closest('.hu-menu-hierarchy-list');
		const value = [];

		list.querySelectorAll('.hu-menu-hierarchy-item:not(.level-0) input[type=checkbox]').forEach(checkbox => {
			checkbox.checked = selectAll.checked;

			if (selectAll.checked && !value.includes(checkbox.value)) {
				value.push(checkbox.value);
			}
		});

		const input = hierarchyInput(selectAll);
		input.value = JSON.stringify(value);
		fire(input);
	});

	delegate(document, 'change', '.hu-menu-hierarchy-container .hu-menu-item-selector:not(.level-0)', (event, checkbox) => {
		const input = hierarchyInput(checkbox);
		const selectAll = checkbox.closest('.hu-menu-hierarchy-list').querySelector('input[type=checkbox].select-all');
		const elements = readData(selectAll, 'elements') || [];

		let value = input.value;
		value = (value.length && JSON.parse(value)) || [];

		if (checkbox.checked) {
			if (!value.includes(checkbox.value)) value.push(checkbox.value);
		} else {
			value = value.filter(item => item !== checkbox.value);
		}

		selectAll.checked = value.length === elements.length;

		input.value = JSON.stringify(value);
		fire(input);
	});

	/* ------------------------------------------------------------------ */
	/* Showon for modal fields: `data-revealon`                            */
	/* ------------------------------------------------------------------ */

	/**
	 * Check the target's conditions and show or hide it.
	 *
	 * @param {HTMLElement} target
	 * @param {HTMLElement|Document} context
	 */
	function linkedoptions(target, context) {
		const conditions = readData(target, 'revealon') || [];
		let showfield = true;

		conditions.forEach((condition, j) => {
			const fields = context.querySelectorAll(`[name="${condition.field}"], [name="${condition.field}[]"]`);

			condition.valid = 0;

			fields.forEach(field => {
				let values;

				if (['checkbox', 'radio'].includes(field.type)) {
					values = [String(Number(field.checked))];
				} else if (field.tagName === 'SELECT' && field.multiple) {
					values = [...field.selectedOptions].map(option => option.value);
				} else {
					values = [field.value];
				}

				values.forEach(value => {
					if (condition.sign === '=' && condition.values.includes(value)) condition.valid = 1;
					if (condition.sign === '!=' && !condition.values.includes(value)) condition.valid = 1;
				});
			});

			if (condition.op === '') {
				if (condition.valid === 0) showfield = false;
			} else if (condition.op === 'AND' && condition.valid + conditions[j - 1].valid < 2) {
				showfield = false;
				condition.valid = 0;
			} else if (condition.op === 'OR' && condition.valid + conditions[j - 1].valid > 0) {
				showfield = true;
				condition.valid = 1;
			}
		});

		if (target.tagName === 'OPTION') {
			target.hidden = !showfield;
			target.disabled = !showfield;
			return;
		}

		target.style.display = showfield ? '' : 'none';
	}

	/**
	 * Set up `data-revealon` fields inside a container.
	 *
	 * @param {HTMLElement} container
	 */
	Joomla.setUpShowon = function (container) {
		container = container || document;

		container.querySelectorAll('[data-revealon]').forEach(target => {
			const conditions = readData(target, 'revealon') || [];

			linkedoptions(target, container);

			conditions.forEach(condition => {
				document.querySelectorAll(`[name="${condition.field}"], [name="${condition.field}[]"]`).forEach(field => {
					['change', 'keyup'].forEach(type => field.addEventListener(type, () => linkedoptions(target, container)));
				});
			});
		});
	};

	/* ------------------------------------------------------------------ */
	/* Unit fields                                                         */
	/* ------------------------------------------------------------------ */

	/*
	 * One component for every number + unit field (.hu-unit-group).
	 * The hidden .hu-unit-field-value holds "<number><unit>" (or a keyword
	 * such as "auto") and is the source of truth; the text input and the
	 * unit pill are redrawn from it, so draft reset / presets stay in sync.
	 *
	 * - px is the default and stays hidden until hover / focus.
	 * - Other units and keywords show as a pill, which opens the unit list.
	 * - Typing wins: "24" is px, "1.5rem" / "10%" / "auto" set that unit.
	 * - ↑/↓ nudge by 1 (Shift: 10), Alt+↑/↓ cycles the unit.
	 */
	const unitText = (key, fallback) => {
		const value = Joomla.Text ? Joomla.Text._(key) : '';
		return value && value !== key ? value : fallback;
	};

	const groupParts = group => ({
		hidden: group.querySelector('input.hu-unit-field-value'),
		input: group.querySelector('input.hu-unit-field-input'),
		pill: group.querySelector('.hu-unit-pill'),
		units: (group.dataset.units || 'px,rem,em,%,vw,vh').split(',').filter(Boolean),
		keywords: (group.dataset.keywords || '').split(',').filter(Boolean),
	});

	/** Parse typed or stored text. Returns null when it isn't valid for this field. */
	function parseUnit(text, { units, keywords }) {
		const value = String(text ?? '').trim().toLowerCase().replace(/\s+/g, '');

		if (value === '') return { number: '', unit: '' };
		if (keywords.includes(value)) return { number: '', unit: value };

		const match = value.match(/^([+-]?(?:\d+|\d*\.\d+))([a-z%]*)$/);

		if (!match) return null;

		const unit = match[2] || 'px';

		return units.includes(unit) ? { number: String(Number(match[1])), unit } : null;
	}

	/** Root font size and viewport of the preview, for converting between units. */
	function previewMetrics() {
		const frame = document.getElementById('hu-template-preview');
		let root = 16;
		let width = window.innerWidth;
		let height = window.innerHeight;

		try {
			const win = frame && frame.contentWindow;

			if (win && win.document.documentElement) {
				root = parseFloat(win.getComputedStyle(win.document.documentElement).fontSize) || 16;
				width = win.innerWidth || width;
				height = win.innerHeight || height;
			}
		} catch (e) {
			// Cross-origin preview: keep the defaults.
		}

		return { root, width, height };
	}

	const roundFor = (value, unit) => {
		const places = unit === 'px' ? 0 : unit === 'rem' || unit === 'em' ? 3 : 2;
		return String(Number(value.toFixed(places)));
	};

	/** Convert a number between units; keeps it as typed when no conversion exists (e.g. %). */
	function convertUnit(number, from, to) {
		if (number === '' || from === to) return number;

		const { root, width, height } = previewMetrics();
		const toPx = { px: 1, rem: root, em: root, vw: width / 100, vh: height / 100 };

		if (!(from in toPx) || !(to in toPx)) return number;

		return roundFor((parseFloat(number) * toPx[from]) / toPx[to], to);
	}

	function renderUnit(group) {
		const parts = groupParts(group);
		const parsed = parseUnit(parts.hidden.value, parts) || { number: '', unit: '' };
		const unit = parsed.unit || group.dataset.unit || 'px';

		group.dataset.unit = unit;

		if (document.activeElement !== parts.input || parts.input.value !== parsed.number) {
			parts.input.value = parsed.number;
		}

		parts.pill.textContent = unit;
		parts.pill.dataset.unit = unit;
		parts.pill.setAttribute('aria-label', unitText('HELIX_ULTIMATE_UNIT_ARIA', 'Unit, %s').replace('%s', unit));

		group.classList.toggle('is-default-unit', unit === 'px');
		group.classList.toggle('is-keyword', parts.keywords.includes(unit));
	}

	/** Store a new number / unit and notify listeners (draft tracker, live preview). */
	function commitUnit(group, number, unit) {
		const { hidden } = groupParts(group);
		const isKeyword = groupParts(group).keywords.includes(unit);
		const value = isKeyword ? unit : number === '' ? '' : `${number}${unit}`;

		group.dataset.unit = unit;

		if (hidden.value !== value) {
			hidden.value = value;
			fire(hidden);
		}

		renderUnit(group);
	}

	/** Apply what was typed: valid text wins, invalid text is reverted. */
	function applyTypedUnit(group) {
		const parts = groupParts(group);
		const parsed = parseUnit(parts.input.value, parts);

		if (!parsed) {
			renderUnit(group);
			return;
		}

		if (parsed.number === '' && parsed.unit === '') {
			// Cleared: keep a non-default unit for the next number, drop keywords.
			const unit = parts.keywords.includes(group.dataset.unit) ? 'px' : group.dataset.unit || 'px';
			commitUnit(group, '', unit);
			return;
		}

		commitUnit(group, parsed.number, parsed.unit);
	}

	/** Switch unit, converting the number when possible. */
	function setUnit(group, unit) {
		const parts = groupParts(group);
		const current = group.dataset.unit || 'px';
		const typed = parseUnit(parts.input.value, parts);
		const number = typed && typed.number !== '' && !parts.keywords.includes(current) ? typed.number : '';

		if (parts.keywords.includes(unit)) {
			commitUnit(group, '', unit);
			return;
		}

		commitUnit(group, parts.keywords.includes(current) ? '' : convertUnit(number, current, unit), unit);
	}

	document.querySelectorAll('.hu-unit-group').forEach(renderUnit);

	// Value changed from elsewhere (draft reset, presets, import).
	delegate(document, 'change', 'input.hu-unit-field-value', (event, hidden) => {
		const group = hidden.closest('.hu-unit-group');
		if (group) renderUnit(group);
	});

	delegate(document, 'focusout', 'input.hu-unit-field-input', (event, input) => applyTypedUnit(input.closest('.hu-unit-group')));

	delegate(document, 'keydown', 'input.hu-unit-field-input', (event, input) => {
		const group = input.closest('.hu-unit-group');
		const parts = groupParts(group);

		if (event.key === 'Enter') {
			event.preventDefault();
			applyTypedUnit(group);
			return;
		}

		if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

		event.preventDefault();

		const direction = event.key === 'ArrowUp' ? 1 : -1;

		if (event.altKey) {
			const list = parts.units;
			const index = list.indexOf(group.dataset.unit);
			setUnit(group, list[(index + direction + list.length) % list.length]);
			return;
		}

		const typed = parseUnit(input.value, parts);
		const unit = typed && typed.unit && !parts.keywords.includes(typed.unit) ? typed.unit : parts.keywords.includes(group.dataset.unit) ? 'px' : group.dataset.unit || 'px';
		const base = typed && typed.number !== '' ? parseFloat(typed.number) : 0;
		const step = event.shiftKey ? 10 : 1;
		const decimals = (String(base).split('.')[1] || '').length;

		commitUnit(group, String(Number((base + direction * step).toFixed(decimals))), unit);
	});

	/* Unit menu: one listbox, positioned under the pill that opened it. */
	let unitMenu = null;
	let unitMenuGroup = null;

	function closeUnitMenu(focusPill = false) {
		if (!unitMenu) return;

		const pill = unitMenuGroup && unitMenuGroup.querySelector('.hu-unit-pill');

		unitMenu.remove();
		unitMenu = null;

		if (unitMenuGroup) unitMenuGroup.classList.remove('is-menu-open');
		if (pill) {
			pill.setAttribute('aria-expanded', 'false');
			if (focusPill) pill.focus();
		}

		unitMenuGroup = null;
	}

	function openUnitMenu(group) {
		closeUnitMenu();

		const parts = groupParts(group);
		const current = group.dataset.unit || 'px';
		const options = [...parts.units, ...parts.keywords];

		unitMenu = document.createElement('ul');
		unitMenu.className = 'hu-unit-menu';
		unitMenu.setAttribute('role', 'listbox');
		unitMenu.setAttribute('aria-label', unitText('HELIX_ULTIMATE_UNIT_MENU', 'Units'));

		options.forEach(unit => {
			const item = document.createElement('li');
			item.setAttribute('role', 'option');
			item.tabIndex = -1;
			item.dataset.unit = unit;
			item.textContent = unit;
			item.setAttribute('aria-selected', String(unit === current));
			if (parts.keywords.includes(unit)) item.classList.add('is-keyword');
			unitMenu.appendChild(item);
		});

		document.body.appendChild(unitMenu);
		unitMenuGroup = group;
		group.classList.add('is-menu-open');
		parts.pill.setAttribute('aria-expanded', 'true');

		const rect = parts.pill.getBoundingClientRect();
		unitMenu.style.top = `${rect.bottom + 4}px`;
		unitMenu.style.left = `${Math.max(8, rect.right - unitMenu.offsetWidth)}px`;

		(unitMenu.querySelector('[aria-selected="true"]') || unitMenu.firstElementChild).focus();
	}

	delegate(document, 'click', '.hu-unit-pill', (event, pill) => {
		event.preventDefault();

		const group = pill.closest('.hu-unit-group');

		if (unitMenuGroup === group) closeUnitMenu(true);
		else openUnitMenu(group);
	});

	delegate(document, 'keydown', '.hu-unit-pill', (event, pill) => {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			openUnitMenu(pill.closest('.hu-unit-group'));
		}
	});

	document.addEventListener('click', event => {
		if (!unitMenu) return;

		const item = event.target.closest('.hu-unit-menu [role="option"]');

		if (item) {
			const group = unitMenuGroup;
			closeUnitMenu(true);
			setUnit(group, item.dataset.unit);
			return;
		}

		if (!event.target.closest('.hu-unit-menu, .hu-unit-pill')) closeUnitMenu();
	});

	document.addEventListener('keydown', event => {
		if (!unitMenu || !unitMenu.contains(document.activeElement)) return;

		const items = [...unitMenu.children];
		const index = items.indexOf(document.activeElement);

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
			items[next].focus();
		} else if (event.key === 'Home' || event.key === 'End') {
			event.preventDefault();
			items[event.key === 'Home' ? 0 : items.length - 1].focus();
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			const group = unitMenuGroup;
			closeUnitMenu(true);
			setUnit(group, items[index].dataset.unit);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			closeUnitMenu(true);
		} else if (event.key === 'Tab') {
			closeUnitMenu();
		}
	});

	// A fixed menu would drift from its pill when the panel scrolls.
	document.addEventListener('scroll', () => closeUnitMenu(), true);
	window.addEventListener('resize', () => closeUnitMenu());
});
