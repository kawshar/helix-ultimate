/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Behaviour for the Helix form fields: alignment switcher, menu item
 * selector, `data-revealon` showon (published as `Joomla.setUpShowon`) and
 * the number + unit fields.
 */

type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface RevealCondition {
	field: string;
	sign: '=' | '!=';
	values: string[];
	op: '' | 'AND' | 'OR';
	valid?: number;
}

document.addEventListener('DOMContentLoaded', () => {
	const { fire, delegate, readData } = Joomla.utils;

	/** Alignment switcher writes its value into the hidden input. */
	document.querySelectorAll<HTMLElement>('.hu-field-alignment .hu-switcher-action').forEach(action => {
		action.addEventListener('click', event => {
			event.preventDefault();

			[...(action.parentElement?.children ?? [])].forEach(sibling => sibling.classList.remove('active'));
			action.classList.add('active');

			const input = action.closest('.hu-field-alignment')?.querySelector<HTMLInputElement>('input[type=hidden]');

			if (input) {
				// Same coercion as before: the setter turns numbers into strings.
				input.value = readData(action, 'value') as string;
				fire(input);
			}
		});
	});

	/* ------------------------------------------------------------------ */
	/* Menu items selector                                                 */
	/* ------------------------------------------------------------------ */

	const hierarchyInput = (element: Element): HTMLInputElement =>
		element.closest('.hu-menu-hierarchy-container')!.querySelector<HTMLInputElement>('input[type=hidden]')!;

	// "Select all" checks every item in its list.
	delegate<HTMLInputElement>(document, 'change', '.hu-menu-hierarchy-container .hu-menu-item-selector.select-all', (event, selectAll) => {
		const list = selectAll.closest('.hu-menu-hierarchy-list')!;
		const value: string[] = [];

		list.querySelectorAll<HTMLInputElement>('.hu-menu-hierarchy-item:not(.level-0) input[type=checkbox]').forEach(checkbox => {
			checkbox.checked = selectAll.checked;

			if (selectAll.checked && !value.includes(checkbox.value)) {
				value.push(checkbox.value);
			}
		});

		const input = hierarchyInput(selectAll);
		input.value = JSON.stringify(value);
		fire(input);
	});

	delegate<HTMLInputElement>(document, 'change', '.hu-menu-hierarchy-container .hu-menu-item-selector:not(.level-0)', (event, checkbox) => {
		const input = hierarchyInput(checkbox);
		const selectAll = checkbox
			.closest('.hu-menu-hierarchy-list')!
			.querySelector<HTMLInputElement>('input[type=checkbox].select-all')!;
		const elements: unknown[] = readData(selectAll, 'elements') || [];

		let value: string[] = (input.value.length && JSON.parse(input.value)) || [];

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

	/** Check the target's conditions and show or hide it. */
	function linkedoptions(target: HTMLElement, context: ParentNode): void {
		const conditions: RevealCondition[] = readData(target, 'revealon') || [];
		let showfield = true;

		conditions.forEach((condition, j) => {
			const fields = context.querySelectorAll<FormField>(`[name="${condition.field}"], [name="${condition.field}[]"]`);

			condition.valid = 0;

			fields.forEach(field => {
				let values: string[];

				if (['checkbox', 'radio'].includes(field.type)) {
					values = [String(Number((field as HTMLInputElement).checked))];
				} else if (field instanceof HTMLSelectElement && field.multiple) {
					values = [...field.selectedOptions].map(option => option.value);
				} else {
					values = [field.value];
				}

				values.forEach(value => {
					if (condition.sign === '=' && condition.values.includes(value)) condition.valid = 1;
					if (condition.sign === '!=' && !condition.values.includes(value)) condition.valid = 1;
				});
			});

			const previous = conditions[j - 1]?.valid ?? 0;

			if (condition.op === '') {
				if (condition.valid === 0) showfield = false;
			} else if (condition.op === 'AND' && condition.valid + previous < 2) {
				showfield = false;
				condition.valid = 0;
			} else if (condition.op === 'OR' && condition.valid + previous > 0) {
				showfield = true;
				condition.valid = 1;
			}
		});

		if (target instanceof HTMLOptionElement) {
			target.hidden = !showfield;
			target.disabled = !showfield;
			return;
		}

		target.style.display = showfield ? '' : 'none';
	}

	/** Set up `data-revealon` fields inside a container. */
	Joomla.setUpShowon = function (container?: ParentNode | null): void {
		const root: ParentNode = container || document;

		root.querySelectorAll<HTMLElement>('[data-revealon]').forEach(target => {
			const conditions: RevealCondition[] = readData(target, 'revealon') || [];

			linkedoptions(target, root);

			conditions.forEach(condition => {
				document.querySelectorAll(`[name="${condition.field}"], [name="${condition.field}[]"]`).forEach(field => {
					['change', 'keyup'].forEach(type => field.addEventListener(type, () => linkedoptions(target, root)));
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

	interface UnitParts {
		hidden: HTMLInputElement;
		input: HTMLInputElement;
		pill: HTMLButtonElement;
		units: string[];
		keywords: string[];
	}

	interface ParsedUnit {
		number: string;
		unit: string;
	}

	const unitText = (key: string, fallback: string): string => {
		const value = Joomla.Text ? Joomla.Text._(key) : '';
		return value && value !== key ? value : fallback;
	};

	const groupParts = (group: HTMLElement): UnitParts => ({
		hidden: group.querySelector<HTMLInputElement>('input.hu-unit-field-value')!,
		input: group.querySelector<HTMLInputElement>('input.hu-unit-field-input')!,
		pill: group.querySelector<HTMLButtonElement>('.hu-unit-pill')!,
		units: (group.dataset.units || 'px,rem,em,%,vw,vh').split(',').filter(Boolean),
		keywords: (group.dataset.keywords || '').split(',').filter(Boolean),
	});

	/** Parse typed or stored text. Returns null when it isn't valid for this field. */
	function parseUnit(text: string | null | undefined, { units, keywords }: Pick<UnitParts, 'units' | 'keywords'>): ParsedUnit | null {
		const value = String(text ?? '').trim().toLowerCase().replace(/\s+/g, '');

		if (value === '') return { number: '', unit: '' };
		if (keywords.includes(value)) return { number: '', unit: value };

		const match = value.match(/^([+-]?(?:\d+|\d*\.\d+))([a-z%]*)$/);

		if (!match) return null;

		const unit = match[2] || 'px';

		return units.includes(unit) ? { number: String(Number(match[1])), unit } : null;
	}

	/** Root font size and viewport of the preview, for converting between units. */
	function previewMetrics(): { root: number; width: number; height: number } {
		const frame = document.getElementById('hu-template-preview') as HTMLIFrameElement | null;
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

	const roundFor = (value: number, unit: string): string => {
		const places = unit === 'px' ? 0 : unit === 'rem' || unit === 'em' ? 3 : 2;
		return String(Number(value.toFixed(places)));
	};

	/** Convert a number between units; keeps it as typed when no conversion exists (e.g. %). */
	function convertUnit(number: string, from: string, to: string): string {
		if (number === '' || from === to) return number;

		const { root, width, height } = previewMetrics();
		const toPx: Record<string, number> = { px: 1, rem: root, em: root, vw: width / 100, vh: height / 100 };

		if (!(from in toPx) || !(to in toPx)) return number;

		return roundFor((parseFloat(number) * toPx[from]) / toPx[to], to);
	}

	function renderUnit(group: HTMLElement): void {
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
	function commitUnit(group: HTMLElement, number: string, unit: string): void {
		const { hidden, keywords } = groupParts(group);
		const value = keywords.includes(unit) ? unit : number === '' ? '' : `${number}${unit}`;

		group.dataset.unit = unit;

		if (hidden.value !== value) {
			hidden.value = value;
			fire(hidden);
		}

		renderUnit(group);
	}

	/** Apply what was typed: valid text wins, invalid text is reverted. */
	function applyTypedUnit(group: HTMLElement): void {
		const parts = groupParts(group);
		const parsed = parseUnit(parts.input.value, parts);

		if (!parsed) {
			renderUnit(group);
			return;
		}

		if (parsed.number === '' && parsed.unit === '') {
			// Cleared: keep a non-default unit for the next number, drop keywords.
			const current = group.dataset.unit || 'px';
			commitUnit(group, '', parts.keywords.includes(current) ? 'px' : current);
			return;
		}

		commitUnit(group, parsed.number, parsed.unit);
	}

	/** Switch unit, converting the number when possible. */
	function setUnit(group: HTMLElement, unit: string): void {
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

	document.querySelectorAll<HTMLElement>('.hu-unit-group').forEach(renderUnit);

	// Unit fields added later (mega menu modal, settings modals) get set up too.
	new MutationObserver(records => {
		records.forEach(record => {
			record.addedNodes.forEach(node => {
				if (!(node instanceof HTMLElement)) return;
				if (node.matches('.hu-unit-group')) renderUnit(node);
				node.querySelectorAll<HTMLElement>('.hu-unit-group').forEach(renderUnit);
			});
		});
	}).observe(document.body, { childList: true, subtree: true });

	// Value changed from elsewhere (draft reset, presets, import).
	delegate<HTMLInputElement>(document, 'change', 'input.hu-unit-field-value', (event, hidden) => {
		const group = hidden.closest<HTMLElement>('.hu-unit-group');
		if (group) renderUnit(group);
	});

	delegate<HTMLInputElement>(document, 'focusout', 'input.hu-unit-field-input', (event, input) => {
		const group = input.closest<HTMLElement>('.hu-unit-group');
		if (group) applyTypedUnit(group);
	});

	delegate<HTMLInputElement, KeyboardEvent>(document, 'keydown', 'input.hu-unit-field-input', (event, input) => {
		const group = input.closest<HTMLElement>('.hu-unit-group');

		if (!group) return;

		const parts = groupParts(group);
		const current = group.dataset.unit || 'px';

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
			const index = list.indexOf(current);
			setUnit(group, list[(index + direction + list.length) % list.length]);
			return;
		}

		const typed = parseUnit(input.value, parts);
		const unit =
			typed && typed.unit && !parts.keywords.includes(typed.unit)
				? typed.unit
				: parts.keywords.includes(current)
					? 'px'
					: current;
		const base = typed && typed.number !== '' ? parseFloat(typed.number) : 0;
		const step = event.shiftKey ? 10 : 1;
		const decimals = (String(base).split('.')[1] || '').length;

		commitUnit(group, String(Number((base + direction * step).toFixed(decimals))), unit);
	});

	/* Unit menu: one listbox, positioned under the pill that opened it. */
	let unitMenu: HTMLUListElement | null = null;
	let unitMenuGroup: HTMLElement | null = null;

	function closeUnitMenu(focusPill = false): void {
		if (!unitMenu) return;

		const pill = unitMenuGroup && unitMenuGroup.querySelector<HTMLButtonElement>('.hu-unit-pill');

		unitMenu.remove();
		unitMenu = null;

		if (unitMenuGroup) unitMenuGroup.classList.remove('is-menu-open');
		if (pill) {
			pill.setAttribute('aria-expanded', 'false');
			if (focusPill) pill.focus();
		}

		unitMenuGroup = null;
	}

	function openUnitMenu(group: HTMLElement): void {
		closeUnitMenu();

		const parts = groupParts(group);
		const current = group.dataset.unit || 'px';
		const options = [...parts.units, ...parts.keywords];
		const menu = document.createElement('ul');

		menu.className = 'hu-unit-menu';
		menu.setAttribute('role', 'listbox');
		menu.setAttribute('aria-label', unitText('HELIX_ULTIMATE_UNIT_MENU', 'Units'));

		options.forEach(unit => {
			const item = document.createElement('li');
			item.setAttribute('role', 'option');
			item.tabIndex = -1;
			item.dataset.unit = unit;
			item.textContent = unit;
			item.setAttribute('aria-selected', String(unit === current));
			if (parts.keywords.includes(unit)) item.classList.add('is-keyword');
			menu.appendChild(item);
		});

		document.body.appendChild(menu);
		unitMenu = menu;
		unitMenuGroup = group;
		group.classList.add('is-menu-open');
		parts.pill.setAttribute('aria-expanded', 'true');

		const rect = parts.pill.getBoundingClientRect();
		menu.style.top = `${rect.bottom + 4}px`;
		menu.style.left = `${Math.max(8, rect.right - menu.offsetWidth)}px`;

		(menu.querySelector<HTMLElement>('[aria-selected="true"]') || (menu.firstElementChild as HTMLElement | null))?.focus();
	}

	delegate<HTMLButtonElement>(document, 'click', '.hu-unit-pill', (event, pill) => {
		event.preventDefault();

		const group = pill.closest<HTMLElement>('.hu-unit-group');

		if (!group) return;

		if (unitMenuGroup === group) closeUnitMenu(true);
		else openUnitMenu(group);
	});

	delegate<HTMLButtonElement, KeyboardEvent>(document, 'keydown', '.hu-unit-pill', (event, pill) => {
		const group = pill.closest<HTMLElement>('.hu-unit-group');

		if (group && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
			event.preventDefault();
			openUnitMenu(group);
		}
	});

	document.addEventListener('click', event => {
		if (!unitMenu || !(event.target instanceof Element)) return;

		const item = event.target.closest<HTMLElement>('.hu-unit-menu [role="option"]');

		if (item) {
			const group = unitMenuGroup;
			closeUnitMenu(true);
			if (group && item.dataset.unit) setUnit(group, item.dataset.unit);
			return;
		}

		if (!event.target.closest('.hu-unit-menu, .hu-unit-pill')) closeUnitMenu();
	});

	document.addEventListener('keydown', event => {
		if (!unitMenu || !unitMenu.contains(document.activeElement)) return;

		const items = [...unitMenu.children] as HTMLElement[];
		const index = items.indexOf(document.activeElement as HTMLElement);

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
			const unit = items[index]?.dataset.unit;
			closeUnitMenu(true);
			if (group && unit) setUnit(group, unit);
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
