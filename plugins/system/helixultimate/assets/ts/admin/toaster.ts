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
 * `title` and `message` are inserted as HTML; callers may pass markup.
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

const INFO_ICON =
	'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 20 20"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>';

const CLOSE_ICON =
	'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>';

const HelixToaster = {
	options: {
		timeout: 5000,
		containerId: 'hu-toaster-container',
		prefix: 'hu-toaster',
		position: 'hu-toaster-bottom-right',
		titleClass: '',
		messageClass: '',
		target: 'body',
	} as ToasterOptions,

	toasts: [] as HTMLElement[],
	toastIndex: 0,
	elementTimeout: null as ReturnType<typeof setTimeout> | null,

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

	createToaster({ type, message, title }: CreateToastArgs): void {
		const toasterElement = document.createElement('div');
		toasterElement.setAttribute('class', this.options.prefix + ' ' + this.getTypeClass(type));

		const titleClass = `${this.options.prefix}-title ${this.options.titleClass}`;
		const messageClass = `${this.options.prefix}-message ${this.options.messageClass}`;

		toasterElement.innerHTML = `
			<div class="hu-toaster-info-icon">${INFO_ICON}</div>
			<div class="hu-toaster-wrap">
				<div class="${titleClass}">${title}</div>
				<div class="${messageClass}">${message}</div>
			</div>
			<div class="hu-toaster-close">${CLOSE_ICON}</div>

		`;

		toasterElement.style.animationName = 'huFadeInUp';
		toasterElement.style.animationDuration = '.35s';

		this.toasts.push(toasterElement);
		this.toastIndex++;

		this.getContainer().appendChild(toasterElement);

		const dismiss = () => {
			toasterElement.style.animationName = 'huFadeInDown';
			toasterElement.style.animationDuration = '.35s';
			toasterElement.style.opacity = '0';
			setTimeout(() => {
				toasterElement.parentNode?.removeChild(toasterElement);
			}, 450);
		};

		this.elementTimeout = setTimeout(dismiss, this.options.timeout);

		/** Remove the toaster on clicking to the toaster and clear the timeout. */
		toasterElement.addEventListener('click', event => {
			event.preventDefault();

			if (this.elementTimeout) clearTimeout(this.elementTimeout);
			dismiss();
		});
	},

	getContainer(): HTMLElement {
		let container = document.querySelector<HTMLElement>(`#${this.options.containerId}`);

		if (!container) {
			container = this.createContainer();
		}

		return container;
	},

	displayToaster(): void {
		const container = this.getContainer();
		container.innerHTML = '';

		this.toasts.forEach(toast => {
			container.appendChild(toast);
		});
	},

	delay(ms = 1000): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	},

	removeToaster(index: number): Promise<{ status: boolean }> {
		return new Promise(resolve => {
			this.toasts.splice(index, 1);
			const container = document.querySelector(`#${this.options.containerId}`);

			if (container && container.firstChild) container.removeChild(container.firstChild);
			resolve({ status: true });
		});
	},
};

export type HelixToasterApi = typeof HelixToaster;

Joomla.HelixToaster = HelixToaster;

// The classic script declared `const HelixToaster` at the top level.
Object.assign(window, { HelixToaster });
