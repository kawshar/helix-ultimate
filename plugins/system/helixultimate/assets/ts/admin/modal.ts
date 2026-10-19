/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Helix modals: media manager, options (row/column/preset settings),
 * mega menu and iframe modals. Published as `Joomla.helixModal`.
 *
 * `title`, `body` and `footerButtons` are inserted as HTML; the other
 * options are escaped into attributes.
 */

export interface MegamenuModalOptions {
	title?: string;
	className?: string;
	targetType?: string;
	target?: string;
	body?: string;
}

export interface FrameModalOptions {
	title?: string;
	className?: string;
	targetType?: string;
	target?: string;
	frameUrl?: string;
}

export interface MediaModalOptions {
	target_type?: string;
	target?: string;
}

export interface SettingsModalOptions {
	target?: string;
	title?: string;
	flag?: string;
	class?: string;
	applyBtnClass?: string;
	footerButtons?: string[];
}

const escapeAttr = (value: unknown): string => String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const removeModals = (selector = '.hu-modal-overlay, .hu-modal'): void => {
	document.querySelectorAll(selector).forEach(element => element.remove());
};

const append = (html: string): void => {
	document.body.insertAdjacentHTML('beforeend', html);
};

const closeButton = (className: string): string => `<a href="#" class="${className}">${Joomla.utils.icon('close')}</a>`;

/** Close the media / mega menu / frame modal. */
function close(): void {
	removeModals();
	document.body.classList.remove('hu-modal-open');
}

/** Mega menu settings modal. */
function megamenu(options: MegamenuModalOptions = {}): void {
	const { title = 'Mega Menu', className = '', targetType = 'id', target = '', body = '' } = options;

	removeModals();

	append(`
		<div class="hu-modal-overlay"></div>
		<div class="hu-modal ${escapeAttr(className)}" data-target_type="${escapeAttr(targetType)}" data-target="${escapeAttr(target)}">
			<div class="hu-modal-header">
				<h4 class="hu-modal-header-title">${title}</h4>
				${closeButton('action-hu-modal-close')}
			</div>
			<div class="hu-modal-inner">
				<div class="hu-modal-content">
					${body ? `<div class="hu-modal-megamenu-container">${body}</div>` : ''}
				</div>
			</div>
			<div class="hu-modal-footer footer-right">
				<button class="hu-btn hu-btn-link hu-megamenu-cancel-btn">Cancel</button>
				<button class="hu-btn hu-btn-primary hu-megamenu-save-btn">Save</button>
			</div>
		</div>`);

	document.body.classList.add('hu-modal-open');
}

/** Modal that shows a page in an iframe. */
function frame(options: FrameModalOptions = {}): void {
	const { title = 'Helix Ultimate', className = '', targetType = '', target = '', frameUrl = '' } = options;

	removeModals();

	append(`
		<div class="hu-modal-overlay"></div>
		<div class="hu-modal ${escapeAttr(className)}" data-target_type="${escapeAttr(targetType)}" data-target="${escapeAttr(target)}">
			<div class="hu-modal-header">
				<h4 class="hu-modal-header-title">${title}</h4>
				${closeButton('action-hu-modal-close')}
			</div>
			<div class="hu-modal-inner">
				<div class="hu-modal-content">
					${frameUrl ? `<div class="hu-modal-frame-container"><iframe src="${escapeAttr(frameUrl)}" width="100%" height="100%"></iframe></div>` : ''}
				</div>
			</div>
			<div class="hu-modal-footer footer-right">
				<button class="hu-btn hu-btn-link hu-cancel-btn">Cancel</button>
				<button class="hu-btn hu-btn-primary hu-save-btn">
					<div class="hu-spinner hidden spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>
					Save
				</button>
			</div>
		</div>`);

	document.body.classList.add('hu-modal-open');
}

/** Media manager modal. Content is loaded by media.js. */
function media(options: MediaModalOptions = {}): void {
	const { target_type = '', target = '' } = options;

	removeModals();

	append(`
		<div class="hu-modal-overlay"></div>
		<div class="hu-modal" data-target_type="${escapeAttr(target_type)}" data-target="${escapeAttr(target)}">
			<div class="hu-modal-header">
				<input type="file" id="hu-file-input" accept="image/png, image/jpg, image/jpeg, image/webp, image/gif" style="display:none;" multiple>
				<div class="hu-modal-breadcrumbs"></div>
				<div class="hu-modal-actions-left">
					<a href="#" class="hu-btn hu-btn-primary hu-modal-action-select hu-mr-2">${Joomla.utils.icon('check')} Select</a>
					<a href="#" class="hu-btn hu-btn-secondary hu-modal-action-cancel hu-mr-2">${Joomla.utils.icon('close')} Cancel</a>
					<a href="#" class="hu-btn hu-btn-danger hu-btn-last hu-modal-action-delete">${Joomla.utils.icon('minus')} Delete</a>
				</div>
				<div class="hu-modal-actions-right">
					<a href="#" class="hu-btn hu-btn-primary hu-modal-action-upload hu-mr-2">${Joomla.utils.icon('upload')} Upload</a>
					<a href="#" class="hu-btn hu-btn-secondary hu-btn-last hu-modal-action-new-folder">${Joomla.utils.icon('plus')} New Folder</a>
					${closeButton('action-hu-modal-close')}
				</div>
			</div>
			<div class="hu-modal-inner">
				<div class="hu-modal-preloader">${Joomla.utils.icon('spinner', { className: 'hu-spin', size: 28 })}</div>
			</div>
		</div>`);

	document.body.classList.add('hu-modal-open');
}

/** Settings modal used by the layout builder and presets. */
function settings(options: SettingsModalOptions = {}): void {
	const {
		target = '',
		title = 'Options',
		flag = '',
		class: className = '',
		applyBtnClass = 'hu-settings-apply',
		footerButtons = [],
	} = options;

	removeModals('.hu-options-modal-overlay, .hu-options-modal');

	append(`
		<div class="hu-options-modal-overlay"></div>
		<div class="hu-options-modal ${escapeAttr(className)}" data-target="#${escapeAttr(target)}">
			<div class="hu-options-modal-header">
				<span class="hu-options-modal-header-title">${title}</span>
				${closeButton('action-hu-options-modal-close')}
			</div>
			<div class="hu-options-modal-inner">
				<div class="hu-options-modal-content"></div>
			</div>
			<div class="hu-options-modal-footer">
				<a href="#" class="hu-btn hu-btn-primary ${escapeAttr(applyBtnClass)}" data-flag="${escapeAttr(flag)}">${Joomla.utils.icon('check')} Apply</a>
				${footerButtons.join('')}
			</div>
		</div>`);

	document.body.classList.add('hu-options-modal-open');
}

/* ------------------------------------------------------------------ */
/* Panel stack: multi-step panels that slide in instead of modals      */
/* ------------------------------------------------------------------ */

export interface SubpanelOptions {
	/** The `.hu-edit-panel` the step opens in. */
	host: HTMLElement;
	/** Step title (text). */
	title: string;
	/** Step content. */
	body: Node;
	/** Footer HTML (buttons); omit for no footer. */
	footer?: string;
	/** Label of the back button, e.g. "Back to presets". */
	backLabel?: string;
	/** Called after the step is closed (back, Esc, panel closed or close()). */
	onClose?: () => void;
	/**
	 * Widen the panel while this step is open (px), e.g. for the mega menu
	 * builder. The panel then covers part of the preview instead of resizing
	 * it, and goes back to its width when the step closes.
	 */
	width?: number;
	/** Extra class on the step element. */
	className?: string;
	/** HTML for buttons at the right of the step header. */
	headerActions?: string;
}

export interface Subpanel {
	element: HTMLElement;
	header: HTMLElement;
	width?: number;
	body: HTMLElement;
	footer: HTMLElement | null;
	close(): void;
}

const BACK_ICON =
	'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';

const stacks = new WeakMap<HTMLElement, Subpanel[]>();
const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The layer under the top step: the previous step, or the panel's own content. */
const layerBelow = (host: HTMLElement, stack: Subpanel[]): HTMLElement | null =>
	stack.length > 1 ? stack[stack.length - 2].element : host.querySelector<HTMLElement>(':scope > .hu-groups-container');

/** The panel is as wide as the widest open step needs (or its normal width). */
function applyWidth(host: HTMLElement, stack: Subpanel[]): void {
	const width = Math.max(0, ...stack.map(step => step.width ?? 0));

	if (width) {
		host.style.setProperty('--hu-panel-width', `min(${width}px, calc(100vw - var(--hu-sidebar-width, 48px) - 24px))`);
		host.classList.add('is-wide');
	} else {
		host.style.removeProperty('--hu-panel-width');
		host.classList.remove('is-wide');
	}
}

/**
 * Open a step on top of a panel. The panel's content (or the previous step)
 * slides left out of view and the step slides in from the right; Back or Esc
 * returns to the layer below. Steps can be stacked.
 */
function openSubpanel({ host, title, body, footer, backLabel = 'Back', onClose, width, className, headerActions }: SubpanelOptions): Subpanel {
	const stack = stacks.get(host) ?? [];
	stacks.set(host, stack);

	const header = host.querySelector<HTMLElement>(':scope > .hu-panel-header');
	const element = document.createElement('section');

	element.className = `hu-subpanel${className ? ` ${className}` : ''}`;
	element.setAttribute('role', 'region');
	element.setAttribute('aria-label', title);
	element.style.top = `${header ? header.offsetHeight : 0}px`;
	element.innerHTML = `
		<div class="hu-subpanel-header">
			<button type="button" class="hu-subpanel-back" aria-label="${escapeAttr(backLabel)}" title="${escapeAttr(backLabel)}">${BACK_ICON}</button>
			<h3 class="hu-subpanel-title"></h3>
			${headerActions ? `<div class="hu-subpanel-actions">${headerActions}</div>` : ''}
		</div>
		<div class="hu-subpanel-body"></div>
		${footer ? `<div class="hu-subpanel-footer">${footer}</div>` : ''}`;

	element.querySelector('.hu-subpanel-title')!.textContent = title;

	const bodyElement = element.querySelector<HTMLElement>('.hu-subpanel-body')!;
	bodyElement.appendChild(body);

	let closed = false;

	const subpanel: Subpanel = {
		element,
		header: element.querySelector<HTMLElement>('.hu-subpanel-header')!,
		width,
		body: bodyElement,
		footer: element.querySelector<HTMLElement>('.hu-subpanel-footer'),
		close() {
			if (closed) return;
			closed = true;

			// Steps opened on top of this one close first, top-down.
			while (stack.length && stack[stack.length - 1] !== subpanel) {
				stack[stack.length - 1].close();
			}

			const index = stack.indexOf(subpanel);

			if (index > -1) stack.splice(index, 1);

			const below = index > 0 ? stack[index - 1].element : host.querySelector<HTMLElement>(':scope > .hu-groups-container');

			below?.classList.remove('is-behind');
			below?.removeAttribute('inert');
			element.classList.remove('is-active');
			// Out of reach while it slides away.
			element.setAttribute('inert', '');

			const remove = () => element.remove();

			if (reducedMotion() || !host.classList.contains('active-panel')) {
				remove();
			} else {
				element.addEventListener('transitionend', remove, { once: true });
				setTimeout(remove, 400);
			}

			if (!stack.length) host.classList.remove('has-subpanel');

			applyWidth(host, stack);

			onClose?.();

			// Focus goes back to the step below, if there is one.
			if (index > 0) stack[index - 1].element.querySelector<HTMLElement>('.hu-subpanel-back')?.focus({ preventScroll: true });
		},
	};

	stack.push(subpanel);
	host.classList.add('has-subpanel');
	host.appendChild(element);
	applyWidth(host, stack);

	const below = layerBelow(host, stack);
	below?.classList.add('is-behind');
	below?.setAttribute('inert', '');

	element.querySelector('.hu-subpanel-back')!.addEventListener('click', () => subpanel.close());

	// Next frame, so the slide-in transition runs.
	requestAnimationFrame(() => {
		element.classList.add('is-active');
		element.querySelector<HTMLElement>('.hu-subpanel-back')?.focus({ preventScroll: true });
	});

	watchHost(host);

	return subpanel;
}

/** Close every step of a panel (e.g. when the panel itself closes). */
function closeSubpanels(host: HTMLElement): void {
	const stack = stacks.get(host);
	if (stack && stack.length) stack[0].close();
}

const watched = new WeakSet<HTMLElement>();

/** Leaving a panel (another panel opens, or it is closed) drops its steps. */
function watchHost(host: HTMLElement): void {
	if (watched.has(host)) return;
	watched.add(host);

	new MutationObserver(() => {
		if (!host.classList.contains('active-panel')) closeSubpanels(host);
	}).observe(host, { attributes: true, attributeFilter: ['class'] });
}

// Esc goes back one step (modals handle their own Esc).
document.addEventListener('keydown', event => {
	if (event.key !== 'Escape' || document.body.classList.contains('hu-modal-open') || document.body.classList.contains('hu-options-modal-open')) return;
	if (document.querySelector('.hu-unit-menu, .clr-picker.clr-open')) return;

	const host = document.querySelector<HTMLElement>('.hu-edit-panel.active-panel.has-subpanel');
	const stack = host ? stacks.get(host) : undefined;

	if (stack && stack.length) {
		event.preventDefault();
		stack[stack.length - 1].close();
	}
});

// Help text toggles inside steps (their fields are cloned, so they have no own listeners).
document.addEventListener('click', event => {
	const icon = event.target instanceof Element ? event.target.closest<HTMLElement>('.hu-subpanel .hu-help-icon') : null;

	if (!icon) return;

	event.preventDefault();

	const group = icon.closest('.control-group');
	const help = group?.querySelector<HTMLElement>('.hu-control-help');

	icon.classList.toggle('active');

	if (help) {
		const opening = !help.classList.contains('show');
		help.classList.toggle('show', opening);
		help.style.display = opening ? 'block' : 'none';
	}
});

const helixSubpanel = { open: openSubpanel, closeAll: closeSubpanels };

export type HelixSubpanelApi = typeof helixSubpanel;

Joomla.helixSubpanel = helixSubpanel;

const helixModal = { close, megamenu, frame, media, settings };

export type HelixModalApi = typeof helixModal;

Joomla.helixModal = helixModal;

// Escape closes the media / mega menu / frame modal.
document.addEventListener('keydown', event => {
	if (event.key === 'Escape' && document.body.classList.contains('hu-modal-open')) {
		close();
	}
});
