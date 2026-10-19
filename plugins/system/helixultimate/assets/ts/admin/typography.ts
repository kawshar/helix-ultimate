/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Typography panel:
 * - Only fonts that are switched on are shown, as collapsible cards with a remove button.
 * - Fonts that are off sit behind one "Add a font" button, as a menu with what each inherits.
 * - The Google font dropdown becomes a searchable picker (Joomla.utils.searchSelect).
 *
 * The original `enable_*_font` checkboxes and `.hu-webfont-list` selects stay in
 * the form and remain the source of truth; this only drives them.
 */

interface TypoCard {
	key: string;
	wrapper: HTMLElement;
	toggle: HTMLInputElement;
	label: string;
	collapseButton: HTMLButtonElement;
	hint: HTMLParagraphElement;
	summary: HTMLParagraphElement;
	addItem: HTMLLIElement;
	/** The card's name in the header, drawn in the font it sets. */
	sample: HTMLElement;
}

interface FontValue {
	fontFamily?: string;
	fontSize?: string;
	fontWeight?: string;
}

document.addEventListener('DOMContentLoaded', () => {
	const t = (key: string, fallback: string): string => {
		const value = window.Joomla && Joomla.Text ? Joomla.Text._(key) : '';
		return value && value !== key ? value : fallback;
	};

	const fire = (element: EventTarget, type = 'change'): boolean => element.dispatchEvent(new Event(type, { bubbles: true }));

	initTypographyCards();
	document.querySelectorAll<HTMLSelectElement>('select.hu-webfont-list').forEach(select =>
		Joomla.utils.searchSelect(select, {
			search: t('HELIX_ULTIMATE_FONT_SEARCH', 'Search fonts'),
			empty: t('HELIX_ULTIMATE_FONT_NO_RESULTS', 'No fonts match "%s"'),
		})
	);

	/* ------------------------------------------------------------------ */
	/* Add / remove font cards                                             */
	/* ------------------------------------------------------------------ */

	function initTypographyCards(): void {
		const panel = document.querySelector('.typography-panel');

		if (!panel) return;

		const wrappers = [...panel.querySelectorAll<HTMLElement>('.hu-typography-wrapper')];

		// The chrome (buttons, hint, summary, add item) is filled in below.
		const cards: TypoCard[] = wrappers.flatMap(wrapper => {
			const toggle = wrapper.querySelector<HTMLInputElement>('.hu-is-header input[type="checkbox"][name^="enable_"]');

			if (!toggle) return [];

			const key = toggle.name.replace(/^enable_/, '').replace(/_font$/, '');
			const labelEl = wrapper.querySelector('.hu-is-header .control-label');

			return [{ key, wrapper, toggle, label: labelEl ? (labelEl.textContent ?? '').trim() : key } as TypoCard];
		});

		if (!cards.length) return;

		const byKey: Record<string, TypoCard> = Object.fromEntries(cards.map(card => [card.key, card]));
		const isOn = (key: string): boolean => Boolean(byKey[key] && byKey[key].toggle.checked);
		const isHeading = (key: string): boolean => /^h[2-6]$/.test(key);

		// Where a font that is off gets its look from.
		const inheritsFrom = (key: string): string => {
			if (key === 'body') return t('HELIX_ULTIMATE_TYPO_INHERITS_DEFAULT', 'Uses the template default');
			if (key === 'custom') return t('HELIX_ULTIMATE_TYPO_INHERITS_NONE', 'Not applied');
			if (isHeading(key) && isOn('h1')) return t('HELIX_ULTIMATE_TYPO_INHERITS_H1', 'Uses the Heading 1 font');
			if (isOn('body')) return t('HELIX_ULTIMATE_TYPO_INHERITS_BODY', 'Uses the Body font');

			return t('HELIX_ULTIMATE_TYPO_INHERITS_DEFAULT', 'Uses the template default');
		};

		// What a font that is on affects.
		const scopeHint = (key: string): string => {
			if (key === 'body') return t('HELIX_ULTIMATE_TYPO_HINT_BODY', 'Applies to the whole site. Headings, menus and other text use it unless they have their own font.');
			if (key === 'h1') return t('HELIX_ULTIMATE_TYPO_HINT_H1', 'Also sets the font family of H2 to H6 that do not have their own font.');
			if (isHeading(key)) {
				return isOn('h1')
					? t('HELIX_ULTIMATE_TYPO_HINT_HEADING_H1', 'Replaces the Heading 1 font for this heading.')
					: t('HELIX_ULTIMATE_TYPO_HINT_HEADING_BODY', 'Replaces the Body font for this heading.');
			}
			if (key === 'navigation') return t('HELIX_ULTIMATE_TYPO_HINT_NAV', 'Applies to menu links. Without it, menus use the Body font.');
			if (key === 'custom') return t('HELIX_ULTIMATE_TYPO_HINT_CUSTOM', 'Applies to the CSS selectors you list below.');

			return '';
		};

		// Collapsed cards, remembered per browser. Default: only Body open.
		const COLLAPSE_KEY = 'helixUltimate.typography.collapsed';
		let collapsed = new Set<string>(cards.filter(card => card.key !== 'body').map(card => card.key));

		try {
			const stored: unknown = JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? 'null');
			if (Array.isArray(stored)) collapsed = new Set(stored.map(String));
		} catch (e) {
			// Storage unavailable or invalid: keep the default.
		}

		const saveCollapsed = (): void => {
			try {
				localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...collapsed]));
			} catch (e) {
				// Storage unavailable: state just isn't remembered.
			}
		};

		// One-line summary shown while collapsed, e.g. "IBM Plex Sans · 16px".
		const summaryText = (card: TypoCard): string => {
			const input = card.wrapper.querySelector<HTMLInputElement>('.hu-webfont-input');
			let value: FontValue = {};

			try {
				value = JSON.parse(input ? input.value : '{}') || {};
			} catch (e) {
				value = {};
			}

			return [value.fontFamily, value.fontSize, value.fontWeight].filter(Boolean).join(' · ');
		};

		const setCollapsed = (card: TypoCard, isCollapsed: boolean): void => {
			card.wrapper.classList.toggle('is-collapsed', isCollapsed);
			card.collapseButton.setAttribute('aria-expanded', String(!isCollapsed));
			card.summary.textContent = summaryText(card);

			if (isCollapsed) collapsed.add(card.key);
			else collapsed.delete(card.key);

			saveCollapsed();
		};

		// Card chrome: collapse toggle, hint, summary and a remove button at the bottom.
		cards.forEach(card => {
			const header = card.wrapper.querySelector<HTMLElement>('.hu-is-header')!;
			const controls = header.querySelector('.controls')!;

			card.wrapper.classList.add('hu-typo-card');

			const toggle = document.createElement('button');
			toggle.type = 'button';
			toggle.className = 'hu-typo-collapse';
			toggle.title = t('HELIX_ULTIMATE_TYPO_TOGGLE', 'Show or hide settings');
			toggle.setAttribute('aria-label', `${toggle.title}: ${card.label}`);
			toggle.innerHTML = `${Joomla.utils.icon('chevron-down')}`;
			controls.appendChild(toggle);
			card.collapseButton = toggle;

			// The whole header row toggles, except the form controls inside it.
			header.addEventListener('click', event => {
				if (event.target instanceof Element && event.target.closest('input, select, textarea, a, button:not(.hu-typo-collapse)')) return;
				setCollapsed(card, !card.wrapper.classList.contains('is-collapsed'));
			});

			card.hint = document.createElement('p');
			card.hint.className = 'hu-typo-hint';
			header.appendChild(card.hint);

			card.summary = document.createElement('p');
			card.summary.className = 'hu-typo-summary';
			header.appendChild(card.summary);

			// The name itself is drawn in the font: replaces the big preview text.
			card.sample = header.querySelector<HTMLElement>('.control-label') || header;
			card.sample.classList.add('hu-typo-sample');

			tagFieldLayout(card);

			const footer = document.createElement('div');
			footer.className = 'hu-typo-footer';
			footer.innerHTML = `<button type="button" class="hu-typo-remove">${Joomla.utils.icon('trash')}<span></span></button>`;

			const remove = footer.querySelector<HTMLButtonElement>('.hu-typo-remove')!;
			remove.lastElementChild!.textContent = t('HELIX_ULTIMATE_TYPO_REMOVE', 'Remove font');
			remove.setAttribute('aria-label', `${t('HELIX_ULTIMATE_TYPO_REMOVE', 'Remove font')}: ${card.label}`);
			remove.addEventListener('click', () => setEnabled(card, false));
			card.wrapper.appendChild(footer);

			// Keep the summary and sample current as the font settings change
			// (webfont.js updates the hidden preview first).
			const refreshSummary = () =>
				requestAnimationFrame(() => {
					card.summary.textContent = summaryText(card);
					syncSample(card);
				});

			card.wrapper.addEventListener('change', refreshSummary);
			card.wrapper.addEventListener('input', refreshSummary);
			card.wrapper.addEventListener('click', event => {
				if (event.target instanceof Element && event.target.closest('.hu-switcher-action')) refreshSummary();
			});
			refreshSummary();

			setCollapsed(card, collapsed.has(card.key));
		});

		// One "Add a font" button below the cards; its menu lists the fonts that are off.
		const adder = document.createElement('section');
		const menuId = 'hu-typo-add-menu';
		adder.className = 'hu-typo-add';
		adder.innerHTML = `
			<button type="button" class="hu-typo-add__toggle" aria-haspopup="menu" aria-expanded="false" aria-controls="${menuId}">
				${Joomla.utils.icon('plus')}
				<span>${t('HELIX_ULTIMATE_TYPO_ADD_TITLE', 'Add a font')}</span>
			</button>
			<ul class="hu-typo-add__list" id="${menuId}" role="menu" hidden></ul>`;
		cards[cards.length - 1].wrapper.after(adder);

		const addToggle = adder.querySelector<HTMLButtonElement>('.hu-typo-add__toggle')!;
		const list = adder.querySelector<HTMLUListElement>('.hu-typo-add__list')!;
		list.setAttribute('aria-label', addToggle.textContent!.trim());

		cards.forEach(card => {
			const item = document.createElement('li');
			item.setAttribute('role', 'none');
			item.innerHTML = `
				<button type="button" class="hu-typo-add__item" role="menuitem" tabindex="-1">
					<span class="hu-typo-add__name"></span>
					<span class="hu-typo-add__inherit"></span>
				</button>`;
			item.querySelector('.hu-typo-add__name')!.textContent = card.label;
			item.querySelector('button')!.addEventListener('click', () => {
				setAddMenu(false);
				setEnabled(card, true);
			});
			card.addItem = item;
			list.appendChild(item);
		});

		const menuItems = (): HTMLButtonElement[] =>
			[...list.querySelectorAll<HTMLButtonElement>('li:not([hidden]) > .hu-typo-add__item')];

		function setAddMenu(open: boolean, focus: 'first' | 'last' | 'toggle' | null = null): void {
			list.hidden = !open;
			addToggle.setAttribute('aria-expanded', String(open));
			adder.classList.toggle('is-open', open);

			if (open) {
				// Opens upwards when there is no room below it in the panel.
				const scroller = adder.closest<HTMLElement>('.hu-groups-container') || document.documentElement;
				const room = scroller.getBoundingClientRect().bottom - addToggle.getBoundingClientRect().bottom;
				adder.classList.toggle('is-up', room < list.offsetHeight + 8);
			}

			if (focus === 'toggle') addToggle.focus();
			else if (focus) {
				const items = menuItems();
				items[focus === 'first' ? 0 : items.length - 1]?.focus();
			}
		}

		addToggle.addEventListener('click', () => setAddMenu(list.hidden, list.hidden ? 'first' : null));
		addToggle.addEventListener('keydown', event => {
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				setAddMenu(true, event.key === 'ArrowDown' ? 'first' : 'last');
			}
		});

		list.addEventListener('keydown', event => {
			const items = menuItems();
			const index = items.indexOf(document.activeElement as HTMLButtonElement);

			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
			} else if (event.key === 'Home' || event.key === 'End') {
				event.preventDefault();
				items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
			} else if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				setAddMenu(false, 'toggle');
			} else if (event.key === 'Tab') {
				setAddMenu(false);
			}
		});

		document.addEventListener('click', event => {
			if (!list.hidden && event.target instanceof Node && !adder.contains(event.target)) setAddMenu(false);
		});

		function setEnabled(card: TypoCard, enabled: boolean): void {
			if (card.toggle.checked === enabled) return;

			card.toggle.checked = enabled;
			// Lets Joomla showon, the draft tracker and the live preview react.
			fire(card.toggle);
			render();

			if (enabled) {
				setCollapsed(card, false);
				card.wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
				const focusable = card.wrapper.querySelector<HTMLElement>('.hu-font-picker__toggle, select, input:not([type="hidden"])');
				if (focusable) focusable.focus({ preventScroll: true });
			} else {
				addToggle.focus({ preventScroll: true });
			}
		}

		function render(): void {
			let available = 0;

			cards.forEach(card => {
				const on = card.toggle.checked;

				card.wrapper.hidden = !on;
				card.hint.textContent = scopeHint(card.key);
				card.hint.hidden = !card.hint.textContent;
				// The hint is the header's tooltip and description; the header stays one tidy row.
				card.collapseButton.closest<HTMLElement>('.hu-is-header')!.title = card.hint.textContent;
				card.collapseButton.setAttribute('aria-description', card.hint.textContent);
				card.addItem.hidden = on;
				card.addItem.querySelector('.hu-typo-add__inherit')!.textContent = inheritsFrom(card.key);

				if (!on) available++;
			});

			adder.hidden = available === 0;
			if (!available) setAddMenu(false);
		}

		cards.forEach(card => card.toggle.addEventListener('change', render));
		render();

		initDefaultValues(cards);
	}

	/* ------------------------------------------------------------------ */
	/* Compact layout: name in its font, labels inside the fields          */
	/* ------------------------------------------------------------------ */

	/** Copy the font of the (hidden) preview text onto the card's name (not its colour, so it stays readable). */
	function syncSample(card: TypoCard): void {
		const preview = card.wrapper.querySelector<HTMLElement>('.hu-webfont-preview');

		if (!preview || !card.sample) return;

		['fontFamily', 'fontWeight', 'fontStyle'].forEach(property => {
			card.sample.style.setProperty(property.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`), preview.style.getPropertyValue(property.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)));
		});
	}

	/**
	 * Mark the field wrappers with layout classes, so the CSS doesn't depend on
	 * the field's column markup: rows have the label beside the control, pairs
	 * have the label inside it.
	 */
	function tagFieldLayout(card: TypoCard): void {
		const field = card.wrapper.querySelector<HTMLElement>('.hu-field-webfont');

		if (!field) return;

		const mark = (element: Element | null | undefined, ...classes: string[]) => element?.classList.add(...classes);

		mark(field, 'hu-typo-fields');
		mark(field.querySelector('.hu-webfont-family'), 'hu-typo-row', 'hu-typo-family');
		// Subset: just its dropdown, after the font name; the label becomes its accessible name.
		const subset = field.querySelector<HTMLSelectElement>('.hu-webfont-subset-list');
		const family = field.querySelector('.hu-webfont-family');
		const subsetColumn = subset?.parentElement;

		if (subset && family && subsetColumn && subsetColumn !== family) {
			const label = subsetColumn.querySelector('label')?.textContent?.trim();

			if (label) subset.setAttribute('aria-label', label);
			subset.classList.add('hu-typo-subset-select');
			family.appendChild(subset);
			subsetColumn.classList.add('hu-typo-subset-moved');
		}
		mark(field.querySelector('.hu-font-color'), 'hu-typo-row', 'hu-typo-color');
		mark(field.querySelector('.hu-webfont-weight'), 'hu-typo-inline', 'hu-typo-weight');
		mark(field.querySelector('.hu-webfont-size'), 'hu-typo-inline', 'hu-typo-size');
		mark(field.querySelector('.hu-font-line-height'), 'hu-typo-inline', 'hu-typo-line');
		mark(field.querySelector('.hu-font-letter-spacing'), 'hu-typo-inline', 'hu-typo-spacing');
		mark(field.querySelector('.hu-font-alignment'), 'hu-typo-toggles', 'hu-typo-align');
		mark(field.querySelector('.hu-font-decoration'), 'hu-typo-toggles', 'hu-typo-decoration');

		const weight = field.querySelector<HTMLSelectElement>('.hu-webfont-weight-list');
		if (weight) buildWeightDropdown(weight);
	}

	/* Weight: a numeric dropdown over the (hidden) native select, which stays the source of truth. */
	let weightMenu: HTMLUListElement | null = null;
	let weightMenuSelect: HTMLSelectElement | null = null;

	// A function declaration: it runs during initTypographyCards(), before any const below exists.
	function weightToggleOf(select: HTMLSelectElement): HTMLButtonElement | null {
		return select.parentElement?.querySelector<HTMLButtonElement>('.hu-weight-toggle') ?? null;
	}

	/** "400italic" → "400 italic"; plain weights stay numbers. */
	function weightText(value: string): string {
		return value.replace(/^(\d+)(\D+)$/, '$1 $2');
	}

	function buildWeightDropdown(select: HTMLSelectElement): void {
		if (select.dataset.huWeight) return;

		select.dataset.huWeight = '1';
		select.classList.add('hu-weight-native');
		select.tabIndex = -1;
		select.setAttribute('aria-hidden', 'true');

		const label = select.parentElement?.querySelector('label')?.textContent?.trim() || 'Weight';
		const toggle = document.createElement('button');

		toggle.type = 'button';
		toggle.className = 'hu-weight-toggle';
		toggle.setAttribute('aria-haspopup', 'listbox');
		toggle.setAttribute('aria-expanded', 'false');
		toggle.dataset.label = label;
		select.after(toggle);

		toggle.addEventListener('click', () => (weightMenuSelect === select ? closeWeightMenu(true) : openWeightMenu(select)));
		toggle.addEventListener('keydown', event => {
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				openWeightMenu(select);
			}
		});

		// Draft reset, presets: the select changes elsewhere.
		select.addEventListener('change', () => syncWeight(select));

		syncWeight(select);
	}

	/** Show the set weight, or the site's weight muted when none is set. */
	function syncWeight(select: HTMLSelectElement): void {
		const toggle = weightToggleOf(select);

		if (!toggle) return;

		const value = select.value;
		const fallback = select.dataset.huDefault || '';
		const shown = value || fallback;

		toggle.textContent = shown ? weightText(shown) : '–';
		toggle.classList.toggle('is-default', !value);
		toggle.setAttribute('aria-label', `${toggle.dataset.label}, ${value ? weightText(value) : t('HELIX_ULTIMATE_FONT_DEFAULT_VALUE', '%s (default)').replace('%s', fallback || '–')}`);
	}

	function closeWeightMenu(focusToggle = false): void {
		if (!weightMenu) return;

		const toggle = weightMenuSelect && weightToggleOf(weightMenuSelect);

		weightMenu.remove();
		weightMenu = null;
		weightMenuSelect = null;

		if (toggle) {
			toggle.setAttribute('aria-expanded', 'false');
			if (focusToggle) toggle.focus();
		}
	}

	function openWeightMenu(select: HTMLSelectElement): void {
		closeWeightMenu();

		const toggle = weightToggleOf(select);

		if (!toggle) return;

		const fallback = select.dataset.huDefault || '';
		const menu = document.createElement('ul');

		menu.className = 'hu-unit-menu hu-weight-menu';
		menu.setAttribute('role', 'listbox');
		menu.setAttribute('aria-label', toggle.dataset.label || 'Weight');

		[...select.options].forEach(option => {
			const item = document.createElement('li');

			item.setAttribute('role', 'option');
			item.tabIndex = -1;
			item.dataset.value = option.value;
			item.setAttribute('aria-selected', String(option.value === select.value));
			item.textContent = option.value
				? weightText(option.value)
				: t('HELIX_ULTIMATE_FONT_DEFAULT_VALUE', '%s (default)').replace('%s', fallback || '–');

			if (!option.value) item.classList.add('is-default-option');
			// Each weight previews itself.
			if (/^\d+$/.test(option.value)) item.style.fontWeight = option.value;

			menu.appendChild(item);
		});

		document.body.appendChild(menu);
		weightMenu = menu;
		weightMenuSelect = select;
		toggle.setAttribute('aria-expanded', 'true');

		const rect = toggle.getBoundingClientRect();
		const below = window.innerHeight - rect.bottom;
		const height = menu.offsetHeight;

		menu.style.top = `${below > height + 8 ? rect.bottom + 4 : Math.max(8, rect.top - height - 4)}px`;
		menu.style.left = `${Math.max(8, rect.right - menu.offsetWidth)}px`;

		(menu.querySelector<HTMLElement>('[aria-selected="true"]') || (menu.firstElementChild as HTMLElement | null))?.focus();
	}

	function chooseWeight(value: string): void {
		const select = weightMenuSelect;

		closeWeightMenu(true);

		if (!select || select.value === value) return;

		select.value = value;
		// Bubbling change: webfont.js preview, the draft tracker and the summary listen.
		fire(select);
	}

	document.addEventListener('click', event => {
		if (!weightMenu || !(event.target instanceof Element)) return;

		const item = event.target.closest<HTMLElement>('.hu-weight-menu [role="option"]');

		if (item) {
			chooseWeight(item.dataset.value ?? '');
			return;
		}

		if (!event.target.closest('.hu-weight-menu, .hu-weight-toggle')) closeWeightMenu();
	});

	document.addEventListener('keydown', event => {
		if (!weightMenu || !weightMenu.contains(document.activeElement)) return;

		const items = [...weightMenu.children] as HTMLElement[];
		const index = items.indexOf(document.activeElement as HTMLElement);

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
		} else if (event.key === 'Home' || event.key === 'End') {
			event.preventDefault();
			items[event.key === 'Home' ? 0 : items.length - 1].focus();
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			chooseWeight(items[index]?.dataset.value ?? '');
		} else if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			closeWeightMenu(true);
		} else if (event.key === 'Tab') {
			closeWeightMenu();
		}
	});

	document.addEventListener('scroll', () => closeWeightMenu(), true);
	window.addEventListener('resize', () => closeWeightMenu());

	/* ------------------------------------------------------------------ */
	/* Defaults: show what the site uses now in the empty fields            */
	/* ------------------------------------------------------------------ */

	/*
	 * Helpers below are function declarations, not consts: initTypographyCards()
	 * runs at the top of this callback, before any const further down exists.
	 */

	/** The elements a font applies to on the site (see HelixUltimate::addGoogleFont). */
	function selectorFor(key: string): string {
		if (key === 'body' || /^h[1-6]$/.test(key)) return key;
		if (key === 'navigation') return '.sp-megamenu-parent > li > a, .menu.nav-pills > li > a';
		if (key === 'custom') return document.querySelector<HTMLInputElement>('[name="custom_font_selectors"]')?.value.trim() ?? '';

		return '';
	}

	function toHex(color: string): string {
		const [r, g, b, a = 1] = (color.match(/[\d.]+/g) || []).map(Number);

		if (r === undefined || a === 0) return '';

		const hex = [r, g, b].map(value => Math.round(value).toString(16).padStart(2, '0')).join('');
		return `#${hex}${a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : ''}`.toUpperCase();
	}

	function round(value: number, places = 2): string {
		return String(Number(value.toFixed(places)));
	}

	interface FontDefaults {
		size: string;
		weight: string;
		lineHeight: string;
		spacing: string;
		color: string;
	}

	/**
	 * Computed style of the first element the font applies to in the preview.
	 * Headings that the page doesn't contain are measured with a hidden probe.
	 */
	function readDefaults(key: string): FontDefaults | null {
		const frame = document.getElementById('hu-template-preview') as HTMLIFrameElement | null;
		let doc: Document | null = null;

		try {
			doc = frame?.contentDocument ?? null;
		} catch (e) {
			return null; // Cross-origin preview.
		}

		const win = doc?.defaultView;
		const selector = selectorFor(key);

		if (!doc || !win || !doc.body || !selector) return null;

		let element: Element | null = null;

		try {
			element = doc.querySelector(selector);
		} catch (e) {
			return null; // Invalid custom selector.
		}

		let probe: HTMLElement | null = null;

		if (!element && /^h[1-6]$/.test(key)) {
			probe = doc.createElement(key);
			probe.textContent = 'Aa';
			probe.setAttribute('aria-hidden', 'true');
			probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;left:-9999px;top:0;';
			doc.body.appendChild(probe);
			element = probe;
		}

		if (!element) return null;

		const style = win.getComputedStyle(element);
		const fontSize = parseFloat(style.fontSize) || 0;
		const lineHeight = parseFloat(style.lineHeight);
		const spacing = parseFloat(style.letterSpacing);

		const defaults: FontDefaults = {
			size: fontSize ? round(fontSize, 1) : '',
			weight: style.fontWeight || '',
			lineHeight: Number.isFinite(lineHeight) && fontSize ? round(lineHeight / fontSize) : '',
			spacing: Number.isFinite(spacing) ? round(spacing, 2) : '0',
			color: toHex(style.color),
		};

		probe?.remove();

		return defaults;
	}

	/** Which size field is shown: the one for the device the preview is on. */
	/**
	 * The size field for the width the preview renders at (font sizes switch at
	 * 992px and 768px, see HelixUltimate::addGoogleFont), so a measured size is
	 * only shown on the device it was measured for.
	 */
	function sizeFieldForPreview(card: TypoCard): HTMLInputElement | null {
		const frame = document.getElementById('hu-template-preview') as HTMLIFrameElement | null;
		let width = 0;

		try {
			width = frame?.contentWindow?.innerWidth ?? 0;
		} catch (e) {
			return null;
		}

		if (!width) return null;

		const suffix = width >= 992 ? '' : width >= 768 ? '-sm' : '-xs';

		return card.wrapper.querySelector<HTMLInputElement>(`.hu-webfont-size input.hu-unit-field-value[name="hu-webfont-size-field${suffix}"]`)
			?.closest('.hu-unit-group')
			?.querySelector<HTMLInputElement>('input.hu-unit-field-input') ?? null;
	}

	function applyDefaults(card: TypoCard): void {
		if (card.wrapper.hidden) return;

		const defaults = readDefaults(card.key);
		const field = card.wrapper.querySelector<HTMLElement>('.hu-field-webfont');

		if (!field) return;

		// Size: only the field for the device the preview shows gets the measured value.
		field.querySelectorAll<HTMLInputElement>('.hu-webfont-size input.hu-unit-field-input').forEach(input => setDefault(input, ''));
		const size = sizeFieldForPreview(card);
		if (size) setDefault(size, defaults?.size ?? '');

		const lineHeight = field.querySelector<HTMLInputElement>('.hu-font-line-height-input');
		if (lineHeight) setDefault(lineHeight, defaults?.lineHeight ?? '');

		const spacing = field.querySelector<HTMLInputElement>('.hu-font-letter-spacing input.hu-unit-field-input');
		if (spacing) setDefault(spacing, defaults?.spacing ?? '');

		// Weight: the dropdown shows the weight in use (e.g. 700) while none is set.
		const weight = field.querySelector<HTMLSelectElement>('.hu-webfont-weight-list');

		if (weight) {
			if (defaults?.weight) weight.dataset.huDefault = defaults.weight;
			else delete weight.dataset.huDefault;

			syncWeight(weight);
		}

		// Colour: the placeholder hex, and the swatch shows it while the field is empty.
		const color = field.querySelector<HTMLInputElement>('.hu-font-color-input');
		const swatch = color?.closest<HTMLElement>('.clr-field');

		if (color) {
			color.dataset.placeholder ??= color.placeholder;
			setDefault(color, defaults?.color ?? '', color.dataset.placeholder || '');
		}

		if (swatch) {
			if (defaults?.color) swatch.style.setProperty('--hu-default-color', defaults.color);
			else swatch.style.removeProperty('--hu-default-color');
		}
	}

	/**
	 * Show a measured default as the field's placeholder and remember it, so
	 * it can be accepted with → (or Tab after a click). `fallback` is the
	 * placeholder to show when nothing was measured.
	 */
	function setDefault(input: HTMLInputElement, value: string, fallback = ''): void {
		input.placeholder = value || fallback;

		if (value) input.dataset.huDefault = value;
		else delete input.dataset.huDefault;

		syncHint(input);
	}

	const DEFAULT_FIELDS = '.hu-field-webfont :is(input.hu-unit-field-input, .hu-font-line-height-input, .hu-font-color-input)';

	/** The hint ("→ to use") shows while an empty field with a default has focus. */
	function syncHint(input: HTMLInputElement): void {
		const holder = input.closest<HTMLElement>('.hu-unit-group, .clr-field') ?? input.parentElement;

		if (!holder) return;

		const show = document.activeElement === input && input.value === '' && Boolean(input.dataset.huDefault);

		holder.classList.toggle('has-default-hint', show);

		if (show) {
			const full = input.dataset.huPointer
				? t('HELIX_ULTIMATE_FONT_USE_DEFAULT_TAB', '→ or Tab to use')
				: t('HELIX_ULTIMATE_FONT_USE_DEFAULT', '→ to use');

			// The fields are narrow: show the keys; the sentence is the tooltip / description.
			holder.dataset.hint = input.dataset.huPointer ? '→ Tab' : '→';
			input.title = full;
			input.setAttribute('aria-description', full);
		} else if (input.hasAttribute('aria-description')) {
			input.removeAttribute('title');
			input.removeAttribute('aria-description');
		}
	}

	/** Put the default into the field, as if it had been typed. */
	function acceptDefault(input: HTMLInputElement): boolean {
		const value = input.dataset.huDefault;

		if (!value || input.value !== '') return false;

		input.value = value;

		if (input.classList.contains('hu-unit-field-input')) {
			// The unit field stores "<number><unit>" when Enter commits it.
			input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
		} else {
			fire(input, 'input');
			fire(input, 'change');
		}

		syncHint(input);

		return true;
	}

	const isDefaultField = (target: EventTarget | null): target is HTMLInputElement =>
		target instanceof HTMLInputElement && target.matches(DEFAULT_FIELDS);

	// Tab only accepts after a click into the field, so tabbing through a card
	// never fills it; a keyboard user uses → instead.
	// pointerdown and mousedown: some input paths only send one of them.
	['pointerdown', 'mousedown'].forEach(type =>
		document.addEventListener(type, event => {
			if (!isDefaultField(event.target)) return;

			event.target.dataset.huPointer = '1';
			// Focus may already be in the field; refresh the hint for the click.
			requestAnimationFrame(() => isDefaultField(event.target) && syncHint(event.target));
		})
	);

	document.addEventListener('focusin', event => {
		if (isDefaultField(event.target)) syncHint(event.target);
	});

	document.addEventListener('focusout', event => {
		if (!isDefaultField(event.target)) return;

		delete event.target.dataset.huPointer;
		syncHint(event.target);
	});

	document.addEventListener('input', event => {
		if (isDefaultField(event.target)) syncHint(event.target);
	});

	document.addEventListener(
		'keydown',
		event => {
			const input = event.target;

			if (!isDefaultField(input) || event.altKey || event.ctrlKey || event.metaKey) return;

			const accept =
				(event.key === 'ArrowRight' && !event.shiftKey) || (event.key === 'Tab' && !event.shiftKey && Boolean(input.dataset.huPointer));

			if (accept && acceptDefault(input)) {
				event.preventDefault();
				// Tab filled the field; the next Tab moves on as usual.
				delete input.dataset.huPointer;
				event.stopPropagation();
			}
		},
		true
	);

	function initDefaultValues(cards: TypoCard[]): void {
		const frame = document.getElementById('hu-template-preview') as HTMLIFrameElement | null;
		const refresh = () =>
			cards.forEach(card => {
				try {
					applyDefaults(card);
				} catch (error) {
					// Defaults are a hint; never let them break the panel.
					console.warn('Helix: could not read font defaults', error);
				}
			});
		const refreshSoon = Joomla.utils.debounce(refresh, 150);

		refresh();

		// The preview reloads after a save, and resizes on a device switch.
		frame?.addEventListener('load', () => {
			refresh();

			try {
				frame.contentWindow?.addEventListener('resize', refreshSoon);
			} catch (e) {
				// Cross-origin preview: no live updates.
			}
		});

		try {
			frame?.contentWindow?.addEventListener('resize', refreshSoon);
		} catch (e) {
			// Cross-origin preview.
		}

		cards.forEach(card => {
			// A font switched on shows its defaults straight away.
			card.toggle.addEventListener('change', () => requestAnimationFrame(refresh));
		});

		// Custom selectors decide what the custom font measures.
		document.querySelector('[name="custom_font_selectors"]')?.addEventListener('change', refreshSoon);
		// The size field that shows changes with the device.
		document.addEventListener('click', event => {
			if (event.target instanceof Element && event.target.closest('.hu-device, [data-device]')) refreshSoon();
		});
	}
});
