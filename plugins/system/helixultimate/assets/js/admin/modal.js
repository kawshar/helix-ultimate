/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Helix modals: media manager, options (row/column/preset settings),
 * mega menu and iframe modals.
 */
(() => {
	const escapeAttr = value => String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

	const removeModals = (selector = '.hu-modal-overlay, .hu-modal') => {
		document.querySelectorAll(selector).forEach(element => element.remove());
	};

	const append = html => {
		document.body.insertAdjacentHTML('beforeend', html);
	};

	const closeButton = className => `<a href="#" class="${className}"><span class="fas fa-times" aria-hidden="true"></span></a>`;

	/** Close the media / mega menu / frame modal. */
	function close() {
		removeModals();
		document.body.classList.remove('hu-modal-open');
	}

	/** Mega menu settings modal. */
	function megamenu(options = {}) {
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
	function frame(options = {}) {
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
	function media(options = {}) {
		const { target_type = '', target = '' } = options;

		removeModals();

		append(`
			<div class="hu-modal-overlay"></div>
			<div class="hu-modal" data-target_type="${escapeAttr(target_type)}" data-target="${escapeAttr(target)}">
				<div class="hu-modal-header">
					<input type="file" id="hu-file-input" accept="image/png, image/jpg, image/jpeg, image/webp, image/gif" style="display:none;" multiple>
					<div class="hu-modal-breadcrumbs"></div>
					<div class="hu-modal-actions-left">
						<a href="#" class="hu-btn hu-btn-primary hu-modal-action-select hu-mr-2"><span class="fas fa-check" aria-hidden="true"></span> Select</a>
						<a href="#" class="hu-btn hu-btn-secondary hu-modal-action-cancel hu-mr-2"><span class="fas fa-times" aria-hidden="true"></span> Cancel</a>
						<a href="#" class="hu-btn hu-btn-danger hu-btn-last hu-modal-action-delete"><span class="fas fa-minus-circle" aria-hidden="true"></span> Delete</a>
					</div>
					<div class="hu-modal-actions-right">
						<a href="#" class="hu-btn hu-btn-primary hu-modal-action-upload hu-mr-2"><span class="fas fa-upload" aria-hidden="true"></span> Upload</a>
						<a href="#" class="hu-btn hu-btn-secondary hu-btn-last hu-modal-action-new-folder"><span class="fas fa-plus" aria-hidden="true"></span> New Folder</a>
						${closeButton('action-hu-modal-close')}
					</div>
				</div>
				<div class="hu-modal-inner">
					<div class="hu-modal-preloader"><span class="fas fa-circle-notch fa-pulse fa-spin fa-3x fa-fw" aria-hidden="true"></span></div>
				</div>
			</div>`);

		document.body.classList.add('hu-modal-open');
	}

	/** Settings modal used by the layout builder and presets. */
	function settings(options = {}) {
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
					<a href="#" class="hu-btn hu-btn-primary ${escapeAttr(applyBtnClass)}" data-flag="${escapeAttr(flag)}"><span class="fas fa-check"></span> Apply</a>
					${footerButtons.join('')}
				</div>
			</div>`);

		document.body.classList.add('hu-options-modal-open');
	}

	Joomla.helixModal = { close, megamenu, frame, media, settings };

	// Escape closes the media / mega menu / frame modal.
	document.addEventListener('keydown', event => {
		if (event.key === 'Escape' && document.body.classList.contains('hu-modal-open')) {
			close();
		}
	});

})();
