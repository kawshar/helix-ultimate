/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Media field and media manager modal.
 */

interface MediaViewResponse {
	status: boolean;
	output: string;
	breadcrumbs?: string;
}

interface MediaActionResponse {
	status: boolean;
	output?: string;
	message?: string;
}

interface MediaUploadResponse {
	status: boolean;
	path?: string;
	src?: string;
	output?: string;
	message?: string;
}

document.addEventListener('DOMContentLoaded', () => {
	const { fire, delegate, readData, request, show, hide } = Joomla.utils;

	const PRELOADER =
		'<div class="hu-modal-preloader"><span class="fas fa-circle-notch fa-pulse fa-spin fa-3x fa-fw" aria-hidden="true"></span></div>';

	const q = <T extends HTMLElement = HTMLElement>(selector: string): T | null => document.querySelector<T>(selector);

	/** Post a media task to the Helix endpoint (the current URL). */
	const task = <T>(action: string, data: Record<string, string> = {}): Promise<T> =>
		request<T>(window.location.href, {
			method: 'POST',
			data: new URLSearchParams({ action, option: 'com_ajax', helix: 'ultimate', request: 'task', format: 'json', ...data }),
		});

	const setHTML = (selector: string, html: string | undefined): void => {
		const element = q(selector);
		if (element) element.innerHTML = html ?? '';
	};

	const selected = () => q('.hu-media-selected');

	const showFolderActions = () => {
		hide(q('.hu-modal-actions-left'));
		show(q('.hu-modal-actions-right'));
	};

	/** Load a folder of the media manager into the open modal. */
	async function browse(path?: string): Promise<void> {
		document.querySelectorAll('.hu-media-selected').forEach(item => item.classList.remove('hu-media-selected'));
		showFolderActions();
		setHTML('.hu-modal-inner', PRELOADER);

		try {
			const data = await task<MediaViewResponse>('view-media', path === undefined ? {} : { path });

			if (data.status) {
				setHTML('.hu-modal-breadcrumbs', data.breadcrumbs);
				setHTML('.hu-modal-inner', data.output);
			} else {
				alert(data.output);
			}
		} catch (error) {
			alert('Somethings wrong, Try again');
		}
	}

	/** Open the media manager for a media field. */
	delegate(document, 'click', '.hu-media-picker', async (event, picker) => {
		event.preventDefault();

		let targetType = 'id';
		let target = '';

		if (picker.dataset.id !== undefined) {
			target = String(readData(picker, 'id') ?? '');
		} else if (picker.dataset.target !== undefined) {
			targetType = 'data';
			target = String(readData(picker, 'target') ?? '');
		}

		Joomla.helixModal.media({ target_type: targetType, target });

		const icon = picker.querySelector('.fa');
		if (icon) icon.classList.add('fa-spinner', 'fa-spin');

		try {
			const data = await task<MediaViewResponse>('view-media');

			if (data.status) {
				setHTML('.hu-modal-breadcrumbs', data.breadcrumbs);
				setHTML('.hu-modal-inner', data.output);
			} else {
				Joomla.helixModal.close();
				alert(data.output);
			}
		} catch (error) {
			alert('Somethings wrong, Try again');
		}

		if (icon) icon.classList.remove('fa-spinner', 'fa-spin');
	});

	delegate(document, 'dblclick', '.hu-media-folder', (event, folder) => {
		event.preventDefault();
		browse(folder.dataset.path);
	});

	delegate(document, 'click', '.hu-media-breadcrumb-item > a', (event, link) => {
		event.preventDefault();
		browse(link.dataset.path);
	});

	/** Select an image or folder. */
	delegate(document, 'click', '.hu-media-folder, .hu-media-image', (event, item) => {
		event.preventDefault();

		document.querySelectorAll('.hu-media-selected').forEach(other => other.classList.remove('hu-media-selected'));
		item.classList.add('hu-media-selected');

		const selectButton = q('.hu-modal-action-select');

		if (selectButton) {
			if (item.classList.contains('hu-media-folder')) {
				hide(selectButton);
			} else {
				selectButton.removeAttribute('style');
			}
		}

		show(q('.hu-modal-actions-left'));
		hide(q('.hu-modal-actions-right'));
	});

	/** Put the selected image into the field that opened the manager. */
	delegate(document, 'click', '.hu-modal-action-select', event => {
		event.preventDefault();

		const item = selected();
		const modal = q('.hu-modal');

		if (!item || !modal) return;

		const value = item.dataset.path ?? '';
		const preview = item.dataset.preview ?? '';
		const target = modal.getAttribute('data-target') ?? '';
		const input =
			modal.getAttribute('data-target_type') === 'data'
				? q<HTMLInputElement>(`.hu-options-modal [data-attrname="${target}"]`)
				: (document.getElementById(target) as HTMLInputElement | null);

		if (input) {
			input.value = value;
			fire(input);

			const holder = input.previousElementSibling;

			if (holder && holder.classList.contains('hu-image-holder')) {
				holder.innerHTML = '';
				const image = document.createElement('img');
				image.src = preview;
				image.alt = '';
				holder.appendChild(image);
			}

			// Show the clear button again.
			[...(input.parentElement?.children ?? [])]
				.filter(sibling => sibling.classList.contains('hu-media-clear'))
				.forEach(clear => clear.classList.remove('hide'));
		}

		Joomla.helixModal.close();
	});

	delegate(document, 'click', '.hu-modal-action-cancel', event => {
		event.preventDefault();

		const item = selected();
		if (item) item.classList.remove('hu-media-selected');

		showFolderActions();
	});

	delegate(document, 'click', '.action-hu-modal-close', event => {
		event.preventDefault();
		Joomla.helixModal.close();
	});

	/** Clear a media field. */
	delegate(document, 'click', '.hu-media-clear', (event, clear) => {
		event.preventDefault();

		const parent = clear.parentElement;

		if (!parent) return;

		const input = parent.querySelector('input');

		if (input) {
			input.value = '';
			fire(input);
		}

		const holder = parent.querySelector('.hu-image-holder');
		if (holder) holder.innerHTML = '';

		clear.classList.add('hide');
	});

	/** Delete the selected file or folder. */
	delegate(document, 'click', '.hu-modal-action-delete', async event => {
		event.preventDefault();

		const item = selected();

		if (!item) {
			alert('Please select a file or directory first to delete.');
			return;
		}

		const type = item.classList.contains('hu-media-folder') ? 'folder' : 'file';

		if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

		try {
			const data = await task<MediaActionResponse>('delete-media', { type, path: item.dataset.path ?? '' });

			if (data.status) {
				item.remove();
				showFolderActions();
			} else {
				alert(data.message);
			}
		} catch (error) {
			alert('Somethings wrong, Try again');
		}
	});

	/** Create a folder in the current folder. */
	delegate(document, 'click', '.hu-modal-action-new-folder', async event => {
		event.preventDefault();

		const folderName = prompt('Please enter the name of the directory which should be created.');

		if (!folderName) return;

		const current = q('.hu-media-breadcrumb-item.active');

		try {
			const data = await task<MediaActionResponse>('create-folder', {
				folder_name: folderName,
				path: current?.dataset.path ?? '',
			});

			if (data.status) {
				setHTML('.hu-modal-inner', data.output);
			} else {
				alert(data.message);
			}
		} catch (error) {
			alert('Somethings wrong, Try again');
		}
	});

	/* ------------------------------------------------------------------ */
	/* Uploads                                                             */
	/* ------------------------------------------------------------------ */

	/**
	 * Upload one file with a progress bar. Uses XMLHttpRequest because
	 * fetch cannot report upload progress.
	 */
	function uploadMedia(formData: FormData, index: string): void {
		const list = q('.hu-media');
		const manager = document.getElementById('hu-media-manager');

		if (list) {
			list.insertAdjacentHTML(
				'beforeend',
				`<li class="hu-media-progress ${index}">
					<div class="hu-media-thumb"><div class="hu-progress"><div class="hu-progress-bar"></div></div></div>
					<div class="hu-media-label"><span class="fas fa-circle-notch fa-spin" aria-hidden="true"></span> <span class="hu-media-upload-percentage"></span>Uploading...</div>
				</li>`
			);
		}

		if (manager) manager.scrollTo({ top: manager.scrollHeight, behavior: 'smooth' });

		const item = () => q(`.${index}`);
		const xhr = new XMLHttpRequest();
		const token = Joomla.getOptions<string>('csrf.token');

		xhr.open('POST', `index.php?option=com_ajax&helix=ultimate&request=task&action=upload-media&format=json&helix_id=${window.helixUltimateStyleId}`);
		xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		if (token) xhr.setRequestHeader('X-CSRF-Token', token);

		xhr.upload.addEventListener('progress', event => {
			const element = item();

			if (!element || !event.lengthComputable) return;

			const percent = Math.floor((event.loaded / event.total) * 100);
			const bar = element.querySelector<HTMLElement>('.hu-progress-bar');
			const label = element.querySelector('.hu-media-upload-percentage');

			if (bar) bar.style.width = `${percent}%`;
			if (label) label.textContent = `${percent}% `;
		});

		xhr.addEventListener('load', () => {
			const element = item();
			let data: MediaUploadResponse;

			try {
				data = JSON.parse(xhr.responseText);
			} catch (error) {
				data = { status: false, message: 'Somethings wrong, Try again' };
			}

			if (!element) return;

			if (data.status) {
				element.className = 'hu-media-image';
				element.setAttribute('data-path', data.path ?? '');
				element.setAttribute('data-preview', data.src ?? '');
				element.innerHTML = data.output ?? '';
			} else {
				element.remove();
				alert(data.message);
			}
		});

		xhr.addEventListener('error', () => {
			const element = item();
			if (element) element.remove();
			alert('Somethings wrong, Try again');
		});

		xhr.send(formData);
	}

	delegate(document, 'click', '.hu-modal-action-upload', event => {
		event.preventDefault();

		const input = document.getElementById('hu-file-input');
		if (input) input.click();
	});

	delegate<HTMLInputElement>(document, 'change', '#hu-file-input', (event, input) => {
		const allowed = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
		const current = q('.hu-media-breadcrumb-item.active');

		[...(input.files ?? [])].forEach(file => {
			const extension = (file.name.split('.').pop() ?? '').toLowerCase();

			if (extension === 'svg') {
				alert(
					Joomla.Text._(
						'HELIX_ULTIMATE_MEDIA_SVG_NOT_SUPPORTED_FOR_UPLOAD',
						'SVG is not supported for upload. Upload via Joomla Media, then select the file here.'
					)
				);
				return;
			}

			if (!allowed.includes(extension)) {
				alert(Joomla.Text._('COM_SPPAGEBUILDER_MEDIA_MANAGER_FILE_NOT_SUPPORTED', 'File not supported'));
				return;
			}

			const index = `media-id-${Math.floor(Math.random() * 1e6) + 1}`;
			const formData = new FormData();

			formData.append('file', file);
			formData.append('path', current?.dataset.path ?? '');
			formData.append('index', index);

			uploadMedia(formData, index);
		});

		input.value = '';
	});
});
