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

	/**
	 * On blur of the number or change of the unit, store "<value><unit>"
	 * in the hidden field.
	 */
	delegate(document, 'focusout', '.hu-unit-field-input', (event, input) => {
		const group = input.parentElement;
		const field = group.querySelector('input.hu-unit-field-value');
		const select = group.querySelector('select.hu-unit-select');

		let value = input.value.replace(/\s/g, '');
		let unit = 'px';

		if (value === '') {
			field.value = '';
			return;
		}

		const match = value.match(/^([+-]?(?:\d+|\d*\.\d+))(px|em|rem|%)?$/i);

		if (match) {
			[, value, unit] = match;

			if (unit === undefined) {
				unit = (select && select.value) || 'px';
			}
		} else {
			value = parseFloat(value) || '';
		}

		input.value = value;

		if (select && input.nextElementSibling === select) {
			select.value = unit;
		}

		field.value = `${value}${unit}`;
		fire(field);
	});

	delegate(document, 'change', 'select.hu-unit-select', (event, select) => {
		const group = select.parentElement;
		const input = group.querySelector('input.hu-unit-field-input');
		const field = group.querySelector('input.hu-unit-field-value');

		if (input && input.value) {
			field.value = `${input.value}${select.value || 'px'}`;
			fire(field);
		}
	});
});
