/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Shared helpers for the admin scripts, published as `Joomla.utils`.
 *
 * The same names are also kept as bare globals, as the classic script did,
 * for templates and extensions that call them directly.
 */

type Data = Record<string, unknown>;

const asciiToHex = (str: string): string =>
	'0x' +
	str
		.split('')
		.map(char => char.charCodeAt(0).toString(16))
		.join('');

const getCurrentTimeString = (): string => {
	const date = new Date();
	return (
		date.getFullYear() +
		'-' +
		(date.getMonth() + 1) +
		'-' +
		date.getDate() +
		'-' +
		date.getHours() +
		':' +
		date.getMinutes() +
		':' +
		date.getSeconds() +
		':' +
		date.getMinutes()
	);
};

const helixHash = (str: string): number => {
	let hash = 0;
	const { length } = str;
	if (length === 0) return hash;

	for (let i = 0; i < length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash &= hash;
	}

	return hash;
};

/** Dispatch a non-bubbling event (kept for existing callers). */
const triggerEvent = (element: EventTarget | null | undefined, eventName: string): void => {
	if (element) {
		element.dispatchEvent(new Event(eventName, { bubbles: false, cancelable: false }));
	}
};

/** Dispatch a bubbling event, so delegated listeners hear it too. */
const fire = (element: EventTarget | null | undefined, eventName = 'change', detail: unknown = null): void => {
	if (!element) return;

	const event =
		detail === null
			? new Event(eventName, { bubbles: true, cancelable: true })
			: new CustomEvent(eventName, { bubbles: true, cancelable: true, detail });

	element.dispatchEvent(event);
};

/** Listen on `root` for events coming from elements matching `selector`. */
const delegate = <T extends Element = HTMLElement, E extends Event = any>(
	root: Document | Element,
	type: string,
	selector: string,
	handler: (this: T, event: E, target: T) => void,
	options?: boolean | AddEventListenerOptions
): void => {
	root.addEventListener(
		type,
		event => {
			const target = event.target instanceof Element ? (event.target.closest(selector) as T | null) : null;

			if (target && root.contains(target)) {
				handler.call(target, event as E, target);
			}
		},
		options
	);
};

/**
 * Read an element's data attributes the way jQuery's `.data()` did:
 * "true"/"false"/"null", numbers and JSON are converted to real values.
 */
const parseDataValue = (value: string): unknown => {
	if (value === 'true') return true;
	if (value === 'false') return false;
	if (value === 'null') return null;
	if (value !== '' && String(+value) === value) return +value;

	if (/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/.test(value)) {
		try {
			return JSON.parse(value);
		} catch (error) {
			return value;
		}
	}

	return value;
};

function readData(element: HTMLElement | null | undefined): Data;
function readData<T = any>(element: HTMLElement | null | undefined, key: string): T | undefined;
function readData(element: HTMLElement | null | undefined, key?: string): unknown {
	if (!element) return key === undefined ? {} : undefined;

	if (key !== undefined) {
		const value = element.dataset[key];
		return value === undefined ? undefined : parseDataValue(value);
	}

	return Object.fromEntries(
		Object.entries(element.dataset).map(([name, value]) => [name, parseDataValue(value ?? '')])
	);
}

type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * Serialize the fields inside `container` like jQuery's `serializeArray()`:
 * named, enabled, non-button fields; checkboxes/radios only when checked.
 */
const serialize = (container: ParentNode, exclude = ''): URLSearchParams => {
	const params = new URLSearchParams();

	container.querySelectorAll<FormField>('input, select, textarea').forEach(field => {
		const type = (field.type || '').toLowerCase();

		if (!field.name || field.disabled || (exclude && field.matches(exclude))) return;
		if (['submit', 'button', 'image', 'reset', 'file'].includes(type)) return;
		if ((type === 'checkbox' || type === 'radio') && !(field as HTMLInputElement).checked) return;

		if (field instanceof HTMLSelectElement) {
			[...field.selectedOptions].forEach(option => params.append(field.name, option.value));
			return;
		}

		params.append(field.name, field.value.replace(/\r?\n/g, '\r\n'));
	});

	return params;
};

export interface RequestOptions {
	method?: string;
	data?: URLSearchParams | FormData | Record<string, string> | string | null;
	responseType?: 'json' | 'text';
}

/**
 * Send a request to the Helix ajax endpoint and parse the JSON reply.
 * Sends Joomla's CSRF token header, like `HTMLHelper::_('jquery.token')` did for jQuery.
 */
async function request(url: string, options: RequestOptions & { responseType: 'text' }): Promise<string>;
async function request<T = any>(url: string, options?: RequestOptions): Promise<T>;
async function request(url: string, { method = 'GET', data = null, responseType = 'json' }: RequestOptions = {}): Promise<unknown> {
	const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' };
	const token = Joomla.getOptions<string>('csrf.token');

	if (token) headers['X-CSRF-Token'] = token;

	let body: BodyInit | undefined;

	if (data) {
		body = data instanceof URLSearchParams || data instanceof FormData ? data : new URLSearchParams(data);
	}

	const response = await fetch(url, { method, headers, body, credentials: 'same-origin' });

	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText}`);
	}

	const text = await response.text();

	if (responseType === 'text') return text;

	return text ? JSON.parse(text) : {};
}

/** Build the Helix ajax URL for an action on the current style. */
const ajaxUrl = (action: string, extra = ''): string => {
	const id = window.helixUltimateStyleId;

	return `index.php?option=com_ajax&request=task&helix=ultimate&id=${id}&action=${action}&format=json&helix_id=${id}${extra}`;
};

const show = (element: HTMLElement | null | undefined, display = ''): void => {
	if (element) element.style.display = display;
};

const hide = (element: HTMLElement | null | undefined): void => {
	if (element) element.style.display = 'none';
};

const toggle = (element: HTMLElement | null | undefined, visible: unknown, display = ''): void =>
	visible ? show(element, display) : hide(element);

/**
 * Lightweight tooltips for elements with a `title` inside `container`.
 * Shown on hover and keyboard focus, beside the element.
 */
const tooltip = (container: HTMLElement | null | undefined, { placement = 'right' }: { placement?: 'right' | 'bottom' } = {}): void => {
	if (!container) return;

	let tip = document.querySelector<HTMLElement>('.hu-tooltip');

	if (!tip) {
		tip = document.createElement('div');
		tip.className = 'hu-tooltip';
		tip.setAttribute('role', 'tooltip');
		tip.hidden = true;
		document.body.appendChild(tip);
	}

	const tipEl = tip;

	const showTip = (element: HTMLElement) => {
		const title = element.getAttribute('title');

		if (title) {
			element.dataset.huTitle = title;
			element.removeAttribute('title');
		}

		const text = element.dataset.huTitle;

		if (!text) return;

		tipEl.textContent = text;
		tipEl.hidden = false;

		const rect = element.getBoundingClientRect();
		const tipRect = tipEl.getBoundingClientRect();

		let top: number;
		let left: number;

		if (placement === 'right') {
			top = rect.top + rect.height / 2 - tipRect.height / 2;
			left = rect.right + 10;
		} else {
			top = rect.bottom + 8;
			left = rect.left + rect.width / 2 - tipRect.width / 2;
		}

		tipEl.style.top = `${Math.max(4, top)}px`;
		tipEl.style.left = `${Math.max(4, Math.min(left, window.innerWidth - tipRect.width - 4))}px`;
	};

	const hideTip = (element: HTMLElement | null) => {
		tipEl.hidden = true;

		if (element && element.dataset.huTitle) {
			element.setAttribute('title', element.dataset.huTitle);
		}
	};

	const target = (event: Event): HTMLElement | null =>
		event.target instanceof Element ? event.target.closest<HTMLElement>('[title], [data-hu-title]') : null;

	container.addEventListener('mouseover', event => {
		const element = target(event);
		if (element && container.contains(element)) showTip(element);
	});

	container.addEventListener('mouseout', event => {
		const element = target(event);
		if (element && !element.contains(event.relatedTarget as Node | null)) hideTip(element);
	});

	container.addEventListener('focusin', event => {
		const element = target(event);
		if (element) showTip(element);
	});

	container.addEventListener('focusout', event => hideTip(target(event)));
	container.addEventListener('click', () => (tipEl.hidden = true));
};

/**
 * Encode an object like jQuery.param(): nested objects become `a[b][c]`,
 * arrays of scalars `a[]`, arrays of objects `a[0][b]`.
 */
const param = (data: unknown, params: URLSearchParams = new URLSearchParams()): URLSearchParams => {
	const add = (key: string, value: unknown) => {
		value = typeof value === 'function' ? value() : value;
		params.append(key, value === null || value === undefined ? '' : String(value));
	};

	const build = (prefix: string, value: unknown) => {
		if (Array.isArray(value)) {
			value.forEach((item, index) => {
				if (/\[\]$/.test(prefix)) {
					add(prefix, item);
				} else {
					build(`${prefix}[${typeof item === 'object' && item !== null ? index : ''}]`, item);
				}
			});
		} else if (value !== null && typeof value === 'object') {
			Object.entries(value).forEach(([key, item]) => build(`${prefix}[${key}]`, item));
		} else {
			add(prefix, value);
		}
	};

	Object.entries((data as Data) || {}).forEach(([key, value]) => build(key, value));

	return params;
};

const t = (key: string, fallback: string): string => {
	const value = window.Joomla && Joomla.Text ? Joomla.Text._(key) : '';
	return value && value !== key ? value : fallback;
};

let searchSelectCount = 0;

export interface SearchSelectLabels {
	search?: string;
	empty?: string;
	placeholder?: string;
}

interface PickerOption {
	value: string;
	label: string;
	group: string;
}

/**
 * Turn a <select> into a searchable picker (button + search + listbox).
 * The select stays in the form and keeps the value; `change` fires on it.
 */
function searchSelect(select: HTMLSelectElement, labels: SearchSelectLabels = {}): void {
	if (select.dataset.huPicker) return;

	select.dataset.huPicker = '1';

	const id = `hu-font-picker-${++searchSelectCount}`;
	const searchLabel = labels.search || t('JSEARCH_FILTER', 'Search');
	const emptyLabel = labels.empty || 'Nothing matches "%s"';
	const picker = document.createElement('div');
	picker.className = 'hu-font-picker';
	picker.innerHTML = `
		<button type="button" class="hu-font-picker__toggle" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-popover">
			<span class="hu-font-picker__value"></span>
			<span class="fas fa-chevron-down" aria-hidden="true"></span>
		</button>
		<div class="hu-font-picker__popover" id="${id}-popover" hidden>
			<div class="hu-font-picker__search-wrap">
				<span class="fas fa-search" aria-hidden="true"></span>
				<input type="text" class="hu-font-picker__search" role="combobox" autocomplete="off" spellcheck="false"
					aria-autocomplete="list" aria-expanded="true" aria-controls="${id}-list"
					placeholder="${searchLabel}"
					aria-label="${searchLabel}">
			</div>
			<ul class="hu-font-picker__list" role="listbox" id="${id}-list"></ul>
			<p class="hu-font-picker__empty" hidden></p>
		</div>`;

	select.classList.add('hu-font-picker__native');
	select.setAttribute('tabindex', '-1');
	select.setAttribute('aria-hidden', 'true');
	select.after(picker);

	const toggleButton = picker.querySelector<HTMLButtonElement>('.hu-font-picker__toggle')!;
	const valueEl = picker.querySelector<HTMLElement>('.hu-font-picker__value')!;
	const popover = picker.querySelector<HTMLElement>('.hu-font-picker__popover')!;
	const search = picker.querySelector<HTMLInputElement>('.hu-font-picker__search')!;
	const list = picker.querySelector<HTMLUListElement>('.hu-font-picker__list')!;
	const empty = picker.querySelector<HTMLElement>('.hu-font-picker__empty')!;

	let options: PickerOption[] = [];
	let active = -1;

	const syncValue = () => {
		const option = select.selectedOptions[0];
		valueEl.textContent =
			(option && option.value !== '' ? (option.textContent ?? '').trim() : '') ||
			labels.placeholder ||
			t('HELIX_ULTIMATE_SELECT', 'Select');
	};

	// Read the options when opening, so a font list refresh is picked up.
	const readOptions = (): PickerOption[] =>
		[...select.querySelectorAll('option')].map(option => ({
			value: option.value,
			label: (option.textContent ?? '').trim(),
			group: option.parentElement instanceof HTMLOptGroupElement ? option.parentElement.label : '',
		}));

	const items = () => [...list.querySelectorAll<HTMLElement>('.hu-font-picker__option')];

	const highlight = (index: number) => {
		const all = items();

		all.forEach(item => item.classList.remove('is-active'));

		if (!all.length) {
			active = -1;
			search.removeAttribute('aria-activedescendant');
			return;
		}

		active = Math.max(0, Math.min(index, all.length - 1));
		all[active].classList.add('is-active');
		all[active].scrollIntoView({ block: 'nearest' });
		search.setAttribute('aria-activedescendant', all[active].id);
	};

	const renderList = () => {
		const query = search.value.trim().toLowerCase();
		const matches = query ? options.filter(option => option.label.toLowerCase().includes(query)) : options;

		list.innerHTML = '';
		active = -1;

		let group: string | null = null;

		matches.forEach((option, index) => {
			if (option.group !== group) {
				group = option.group;

				if (group) {
					const heading = document.createElement('li');
					heading.className = 'hu-font-picker__group';
					heading.setAttribute('role', 'presentation');
					heading.textContent = group;
					list.appendChild(heading);
				}
			}

			const item = document.createElement('li');
			item.className = 'hu-font-picker__option';
			item.id = `${id}-option-${index}`;
			item.setAttribute('role', 'option');
			item.dataset.value = option.value;
			item.textContent = option.label;

			if (option.value === select.value) {
				item.setAttribute('aria-selected', 'true');
				active = index;
			}

			list.appendChild(item);
		});

		empty.hidden = matches.length > 0;
		empty.textContent = emptyLabel.replace('%s', search.value.trim());

		highlight(active === -1 && matches.length ? 0 : active);
	};

	const open = () => {
		options = readOptions();
		search.value = '';
		popover.hidden = false;
		toggleButton.setAttribute('aria-expanded', 'true');
		picker.classList.add('is-open');
		renderList();
		search.focus();
	};

	const close = (restoreFocus = true) => {
		if (popover.hidden) return;

		popover.hidden = true;
		toggleButton.setAttribute('aria-expanded', 'false');
		picker.classList.remove('is-open');

		if (restoreFocus) toggleButton.focus();
	};

	const choose = (value: string | undefined) => {
		if (value !== undefined && value !== select.value) {
			select.value = value;
			// webfont.js listens for this to refresh weights, subsets and the preview.
			fire(select);
		}

		syncValue();
		close();
	};

	toggleButton.addEventListener('click', () => (popover.hidden ? open() : close()));

	search.addEventListener('input', renderList);

	search.addEventListener('keydown', event => {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				highlight(active + 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				highlight(active - 1);
				break;
			case 'Home':
				event.preventDefault();
				highlight(0);
				break;
			case 'End':
				event.preventDefault();
				highlight(items().length - 1);
				break;
			case 'Enter':
				event.preventDefault();
				if (items()[active]) choose(items()[active].dataset.value);
				break;
			case 'Escape':
				event.preventDefault();
				event.stopPropagation();
				close();
				break;
			case 'Tab':
				close(false);
				break;
		}
	});

	list.addEventListener('mousedown', event => event.preventDefault());

	list.addEventListener('click', event => {
		const item = event.target instanceof Element ? event.target.closest<HTMLElement>('.hu-font-picker__option') : null;
		if (item) choose(item.dataset.value);
	});

	document.addEventListener('mousedown', event => {
		if (!picker.contains(event.target as Node | null)) close(false);
	});

	// Keep the label right when the value changes elsewhere (e.g. reset draft).
	select.addEventListener('change', syncValue);

	syncValue();
}

const setCookie = (name: string, value = '', days = 1): void => {
	let expires = '';
	if (days) {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = '; expires=' + date.toUTCString();
	}

	document.cookie = name + '=' + value + expires + '; path=/';
};

const getCookie = (name: string): string | undefined => {
	name = name + '=';
	const cookieArray = document.cookie.split(';');

	for (let i = 0; i < cookieArray.length; i++) {
		let c = cookieArray[i];

		while (c.charAt(0) == ' ') c = c.substring(1, c.length);

		if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
	}

	return undefined;
};

const deleteCookie = (name: string): void => {
	document.cookie = name + '=; Max-Age=-99999999;';
};

const debounce = <A extends unknown[]>(func: (...args: A) => unknown, interval?: number) => {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function (this: unknown, ...args: A): void {
		const later = () => {
			timeout = null;
			func.apply(this, args);
		};

		if (timeout !== null) clearTimeout(timeout);
		timeout = setTimeout(later, interval || 200);
	};
};

const getCenterPosition = (element: Element): { x: number; y: number } => {
	const { top, left, width, height } = element.getBoundingClientRect();

	return {
		x: left + width / 2,
		y: top + height / 2,
	};
};

const getDistance = (elementA: Element, elementB: Element): { distanceX: number; distanceY: number } => {
	const positionA = getCenterPosition(elementA);
	const positionB = getCenterPosition(elementB);

	const distanceX = Math.floor(Math.abs(positionA.x - positionB.x));
	const distanceY = Math.floor(Math.abs(positionA.y - positionB.y));

	return { distanceX, distanceY };
};

/**
 * Draw the menu tree's connector lines: each nested branch's line reaches
 * up to its previous sibling (or its parent).
 */
function calculateSiblingDistances(): void {
	const tree = Joomla.sortable;

	if (!tree) return;

	document.querySelectorAll<HTMLElement>('.hu-menu-tree-branch').forEach(branch => {
		const level = tree.getLevel(branch) || 1;
		const path = branch.querySelector<HTMLElement>('.hu-menu-branch-path');

		if (path) path.style.display = level > 1 ? '' : 'none';

		if (level <= 1) return;

		const sibling = tree.nextSibling(branch);

		if (sibling) {
			const siblingPath = sibling.querySelector<HTMLElement>('.hu-menu-branch-path');
			const distance = getDistance(branch, sibling);

			if (siblingPath) siblingPath.style.height = `${Math.max(distance.distanceY + 8, 55)}px`;
			return;
		}

		// No next sibling: a following child gets the default line height.
		const next = branch.nextElementSibling;
		const nextPath = next && next.querySelector<HTMLElement>('.hu-menu-branch-path');

		if (next && nextPath && tree.getLevel(next) > level) {
			nextPath.style.height = '55px';
		}
	});
}

const utils = {
	asciiToHex,
	getCurrentTimeString,
	helixHash,
	triggerEvent,
	fire,
	delegate,
	param,
	searchSelect,
	readData,
	serialize,
	request,
	ajaxUrl,
	show,
	hide,
	toggle,
	tooltip,
	setCookie,
	getCookie,
	deleteCookie,
	debounce,
	getDistance,
	calculateSiblingDistances,
};

export type HelixUtils = typeof utils;

Joomla.utils = utils;

// The classic script declared these at the top level, so they were global names.
Object.assign(window, {
	asciiToHex,
	getCurrentTimeString,
	helixHash,
	triggerEvent,
	fire,
	delegate,
	parseDataValue,
	readData,
	serialize,
	request,
	ajaxUrl,
	show,
	hide,
	toggle,
	tooltip,
	param,
	t,
	searchSelect,
	setCookie,
	getCookie,
	deleteCookie,
	debounce,
	getCenterPosition,
	getDistance,
	calculateSiblingDistances,
});
