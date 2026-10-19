/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Toast notifications, published as `Joomla.HelixToaster` (and the bare
 * global `HelixToaster`, as the classic script declared it).
 *
 * Compact dark toasts at the bottom right. `title` and `message` are text.
 * The same message again refreshes the toast that shows it instead of adding
 * one, at most MAX_TOASTS show at once (the oldest goes), and each one has its
 * own timer, paused while the pointer is over it. Use toasts for results that
 * matter (save, restore, import, errors), not for every small edit.
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToasterOptions {
	timeout: number;
	containerId: string;
	prefix: string;
	position: string;
	titleClass: string;
	messageClass: string;
	target: string;
}

interface CreateToastArgs {
	type: ToastType;
	message: string;
	title?: string;
	options?: Partial<ToasterOptions>;
}

interface Toast {
	element: HTMLElement;
	key: string;
	timer: ReturnType<typeof setTimeout> | null;
	timeout: number;
}

const MAX_TOASTS = 3;

// Outline icons on a 16px grid, like the rest of the customizer (inline: the toaster loads on its own).
const svg = (paths: string) =>
	`<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

const ICONS: Record<ToastType, string> = {
	success: svg('<circle cx="8" cy="8" r="6.25"/><path d="M5.5 8.25l1.75 1.75 3.25-3.75"/>'),
	error: svg('<circle cx="8" cy="8" r="6.25"/><path d="M8 4.75v3.75M8 11h.01"/>'),
	warning: svg('<path d="M8 2.75l5.75 10H2.25z"/><path d="M8 6.75v2.75M8 11.25h.01"/>'),
	info: svg('<circle cx="8" cy="8" r="6.25"/><path d="M8 7.25V11M8 5h.01"/>'),
};

const CLOSE_ICON = svg('<path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/>');

const HelixToaster = {
	options: {
		timeout: 4000,
		containerId: 'hu-toaster-container',
		prefix: 'hu-toaster',
		position: 'hu-toaster-bottom-right',
		titleClass: '',
		messageClass: '',
		target: 'body',
	} as ToasterOptions,

	toasts: [] as Toast[],

	success(message: string, title?: string, options?: Partial<ToasterOptions>): void {
		this.createToaster({ type: 'success', message, title, options });
	},

	error(message: string, title?: string, options?: Partial<ToasterOptions>): void {
		this.createToaster({ type: 'error', message, title, options });
	},

	info(message: string, title?: string, options?: Partial<ToasterOptions>): void {
		this.createToaster({ type: 'info', message, title, options });
	},

	warning(message: string, title?: string, options?: Partial<ToasterOptions>): void {
		this.createToaster({ type: 'warning', message, title, options });
	},

	getTypeClass(type: ToastType): string {
		return `hu-toast-${type}`;
	},

	createContainer(): HTMLElement {
		const container = document.createElement('div');
		container.setAttribute('id', this.options.containerId);
		container.setAttribute('class', this.options.position);
		document.querySelector(this.options.target)?.appendChild(container);

		return container;
	},

	getContainer(): HTMLElement {
		return document.querySelector<HTMLElement>(`#${this.options.containerId}`) ?? this.createContainer();
	},

	createToaster({ type, message, title, options }: CreateToastArgs): void {
		const key = `${type}|${title ?? ''}|${message ?? ''}`;
		const timeout = options?.timeout ?? (type === 'error' ? this.options.timeout * 2 : this.options.timeout);

		// The same toast again (e.g. saving twice): show the one that is there for longer.
		const existing = this.toasts.find(toast => toast.key === key);

		if (existing) {
			existing.element.classList.remove('is-bumped');
			void existing.element.offsetWidth; // Restart the small "again" pulse.
			existing.element.classList.add('is-bumped');
			this.startTimer(existing);
			return;
		}

		const element = document.createElement('div');
		element.className = `${this.options.prefix} ${this.getTypeClass(type)}`;
		// Errors interrupt (alert); everything else is announced politely (status).
		element.setAttribute('role', type === 'error' ? 'alert' : 'status');

		element.innerHTML = `
			<span class="hu-toaster-icon">${ICONS[type] ?? ICONS.info}</span>
			<span class="hu-toaster-wrap">
				<span class="${this.options.prefix}-title ${this.options.titleClass}"></span>
				<span class="${this.options.prefix}-message ${this.options.messageClass}"></span>
			</span>
			<button type="button" class="hu-toaster-close" aria-label="Close">${CLOSE_ICON}</button>`;

		// Text only: messages can carry names, aliases or server text.
		const titleElement = element.querySelector<HTMLElement>(`.${this.options.prefix}-title`)!;
		const messageElement = element.querySelector<HTMLElement>(`.${this.options.prefix}-message`)!;

		// A title only when it adds something ("Failed: …"): "Success" / "Error" are what the icon says.
		const generic = ['success', 'error', 'saved', 'updated'].includes((title ?? '').trim().toLowerCase());
		const showTitle = Boolean(title) && !generic && type !== 'success' && !(message ?? '').toLowerCase().startsWith((title ?? '').toLowerCase());
		titleElement.textContent = showTitle ? title! : '';
		titleElement.hidden = !showTitle;
		messageElement.textContent = message ?? '';

		const toast: Toast = { element, key, timer: null, timeout };

		this.toasts.push(toast);
		this.getContainer().appendChild(element);

		// Never a pile: the oldest goes when there are too many.
		while (this.toasts.length > MAX_TOASTS) this.dismiss(this.toasts[0]);

		element.querySelector('.hu-toaster-close')!.addEventListener('click', () => this.dismiss(toast));
		element.addEventListener('mouseenter', () => toast.timer && clearTimeout(toast.timer));
		element.addEventListener('mouseleave', () => this.startTimer(toast));

		this.startTimer(toast);
	},

	startTimer(toast: Toast): void {
		if (toast.timer) clearTimeout(toast.timer);
		toast.timer = setTimeout(() => this.dismiss(toast), toast.timeout);
	},

	dismiss(toast: Toast): void {
		const index = this.toasts.indexOf(toast);

		if (index === -1) return;

		this.toasts.splice(index, 1);
		if (toast.timer) clearTimeout(toast.timer);

		toast.element.classList.add('is-leaving');
		setTimeout(() => toast.element.remove(), 200);
	},

	/** Close every toast. */
	clear(): void {
		[...this.toasts].forEach(toast => this.dismiss(toast));
	},
};

export type HelixToasterApi = typeof HelixToaster;

Joomla.HelixToaster = HelixToaster;

// The classic script declared `const HelixToaster` at the top level.
Object.assign(window, { HelixToaster });
