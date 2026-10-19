/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Typography field: live preview, Google font loading, subsets and font list updates.
 */

type ValueElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface FontVariantsResponse {
	subsets?: string;
}

interface UpdateFontsResponse {
	status: boolean;
	message?: string;
}

document.addEventListener('DOMContentLoaded', () => {
	const { fire, delegate, readData, request } = Joomla.utils;

	const SYSTEM_FONTS = ['Arial', 'Tahoma', 'Verdana', 'Helvetica', 'Times New Roman', 'Trebuchet MS', 'Georgia'];
	const FONT_WEIGHTS = '100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic';

	const fieldOf = (element: Element): HTMLElement | null => element.closest<HTMLElement>('.hu-field-webfont');
	const valueOf = (field: ParentNode, selector: string): string => {
		const element = field.querySelector<ValueElement>(selector);
		return element ? element.value : '';
	};

	/** Add a Google font stylesheet once, so the preview can use it. */
	const loadGoogleFont = (family: string, subset = ''): void => {
		const url = `//fonts.googleapis.com/css?family=${encodeURIComponent(family).replace(/%20/g, '+')}:${FONT_WEIGHTS}${subset ? `&subset=${encodeURIComponent(subset)}` : ''}&display=swap`;

		if (document.querySelector(`link[href="${CSS.escape(url)}"]`)) return;

		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = url;
		document.head.appendChild(link);
	};

	/** Post to the Helix task endpoint (the current URL), like the old `$.ajax({ data })`. */
	const task = <T>(action: string, data: Record<string, string> = {}): Promise<T> => {
		const params = new URLSearchParams({ action, option: 'com_ajax', helix: 'ultimate', request: 'task', format: 'json' });

		Object.entries(data).forEach(([key, value]) => params.append(`data[${key}]`, value));

		return request<T>(window.location.href, { method: 'POST', data: params });
	};

	// Same units as the unit field (vw/vh were missing, so "10vw" previewed as "10vwpx").
	const withUnit = (value: unknown): string => {
		const text = String(value).replace(/\s+/, '');
		return /(em|rem|px|%|vw|vh)$/.test(text) ? text : `${text}px`;
	};

	/** True when a colour reads better on a dark preview background than a light one. */
	function isLightColor(color: string): boolean {
		const [r, g, b, a = 1] = (color.match(/[\d.]+/g) || []).map(Number);

		if (r === undefined || a < 0.4) return false;

		const channel = (value: number) => {
			const c = value / 255;
			return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
		};

		// WCAG relative luminance. Above ~0.21 the dark preview background (#1f2937)
		// gives more contrast than the light one (#f2f5fa).
		return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b) > 0.21;
	}

	function renderPreview(field: HTMLElement | null): void {
		if (!field) return;

		const preview = field.querySelector<HTMLElement>('.hu-webfont-preview');

		if (!preview) return;

		const activeUnit = field.querySelector('.hu-webfont-unit.active');
		const fontFamily = valueOf(field, '.hu-webfont-list');
		const fontWeight = valueOf(field, '.hu-webfont-weight-list');
		const fontSize = activeUnit ? valueOf(activeUnit, '.hu-unit-field-value') : '';
		const fontColor = valueOf(field, '.hu-font-color-input');
		const lineHeight = valueOf(field, '.hu-font-line-height-input');
		const spacing = valueOf(field, '[name=hu-font-letter-spacing-input]');
		const decoration = valueOf(field, 'input.hu-text-decoration');
		const align = valueOf(field, 'input.hu-text-align');

		if (fontFamily) preview.style.fontFamily = fontFamily;

		// Unset weight/colour: show what the site gets (normal weight, readable text).
		preview.style.fontWeight = fontWeight || '';
		preview.style.fontSize = fontSize ? withUnit(fontSize) : '';
		preview.style.color = fontColor || '';
		// A light font colour gets a dark preview background so it stays legible.
		field.querySelector('.hu-webfont-preview-wrapper')?.classList.toggle('is-light-text', isLightColor(getComputedStyle(preview).color));
		preview.style.lineHeight = lineHeight || '';
		preview.style.letterSpacing = spacing ? withUnit(spacing) : '';

		if (decoration) preview.style.textDecoration = decoration;
		if (align) preview.style.textAlign = align;
	}

	document.querySelectorAll<HTMLElement>('.hu-field-webfont').forEach(renderPreview);

	/** Font family: refresh subsets and load the font for the preview. */
	delegate<HTMLSelectElement>(document, 'change', '.hu-webfont-list', async (event, select) => {
		const field = fieldOf(select);
		const subsets = field?.querySelector('.hu-webfont-subset-list');
		const fontName = select.value;

		renderPreview(field);

		if (SYSTEM_FONTS.includes(fontName)) {
			if (subsets) subsets.innerHTML = '';
			return;
		}

		loadGoogleFont(fontName);

		try {
			const font = await task<FontVariantsResponse>('fontVariants', { fontName });

			if (subsets && font.subsets !== undefined) subsets.innerHTML = font.subsets;
		} catch (error) {
			console.error('Could not load the font subsets', error);
		}
	});

	/** Anything else that changes the look refreshes the preview. */
	delegate(
		document,
		'change',
		'.hu-webfont-unit .hu-unit-field-value, .hu-webfont-weight-list, .hu-webfont-style-list, .hu-font-line-height-input, [name=hu-font-letter-spacing-input]',
		(event, input) => renderPreview(fieldOf(input))
	);

	delegate(document, 'input', '.hu-font-color-input', (event, input) => renderPreview(fieldOf(input)));

	/** Font subset: load the font with that subset. */
	delegate<HTMLSelectElement>(document, 'change', '.list-font-subset', (event, select) => {
		const field = fieldOf(select);
		if (field) loadGoogleFont(valueOf(field, '.hu-webfont-list'), select.value);
	});

	/** Text decoration and alignment switchers. */
	[
		['.hu-font-decoration', 'input.hu-text-decoration'],
		['.hu-font-alignment', 'input.hu-text-align'],
	].forEach(([wrapper, inputSelector]) => {
		document.querySelectorAll<HTMLElement>(`${wrapper} .hu-action-group .hu-switcher-action`).forEach(action => {
			action.addEventListener('click', event => {
				event.preventDefault();
				event.stopPropagation();

				[...(action.parentElement?.children ?? [])].forEach(sibling => sibling.classList.remove('active'));
				action.classList.add('active');

				const input = action.closest(wrapper)?.querySelector<HTMLInputElement>(inputSelector);

				if (input) {
					// Same coercion as before: the setter turns numbers into strings.
					input.value = readData(action, 'value') as string;
					fire(input);
				}

				renderPreview(fieldOf(action));
			});
		});
	});

	/** Update the Google font list from the API. */
	delegate(document, 'click', '#update_fonts', async (event, button) => {
		event.preventDefault();

		// While the list updates the button's own icon spins (or a spinner is added if it has none).
		const own = button.querySelector<SVGElement>('.hu-icon');
		const icon = document.createElement('span');
		icon.className = 'hu-btn-spinner';
		icon.innerHTML = Joomla.utils.icon('spinner', { className: 'hu-spin', size: 14 });
		// The server sends "<p class='font-update-…'>text</p>" (the text can come from Google's API): show it as text.
		const showMessage = (html: string) => {
			const parsed = new DOMParser().parseFromString(html, 'text/html');
			const kind = parsed.querySelector('p')?.className.match(/^font-update-(success|failed)$/)?.[0];
			const message = document.createElement('p');

			if (kind) message.className = kind;
			message.textContent = parsed.body.textContent ?? '';
			button.after(message);

			setTimeout(() => message.remove(), 2300);
		};

		if (own) own.classList.add('hu-spin');
		else button.prepend(icon);

		try {
			const data = await task<UpdateFontsResponse>('update-font-list');

			showMessage(
				data.status
					? data.message ?? ''
					: "<p class='font-update-failed'>Unexpected error occurs. Please make sure that, you have inserted Google Font API key.</p>"
			);
		} catch (error) {
			showMessage("<p class='font-update-failed'>Unexpected error occurs. Please try again.</p>");
		}

		own?.classList.remove('hu-spin');
		icon.remove();
	});
});
