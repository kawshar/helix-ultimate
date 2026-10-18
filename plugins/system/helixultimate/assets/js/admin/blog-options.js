/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
*/

/**
 * Article editor blog options: featured image and gallery upload, remove
 * and reorder.
 */
document.addEventListener('DOMContentLoaded', () => {
	const { delegate, request } = Joomla.utils;
	const huText = (key, fallback) => (Joomla.Text ? Joomla.Text._(key, fallback) : fallback);
	const ALLOWED_GALLERY_EXT = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
	// Absolute so it also works from SEF frontend edit URLs.
	const endpoint = `${(Joomla.getOptions('system.paths') || {}).base || ''}/index.php`;

	const baseData = action => ({
		option: 'com_ajax',
		helix: 'ultimate',
		request: 'task',
		action,
		format: 'json',
	});

	/** CSRF token as a form field, alongside the X-CSRF-Token header. */
	const tokenData = () => {
		const token = Joomla.getOptions('csrf.token');

		return token ? { [token]: 1 } : {};
	};

	const parseResponse = response => {
		if (response && typeof response === 'object') return response;
		if (typeof response !== 'string' || !response.length) return null;

		try {
			return JSON.parse(response);
		} catch (e) {
			return null;
		}
	};

	const getArticleId = () => {
		const fieldId = parseInt(document.getElementById('jform_id')?.value, 10);

		if (fieldId > 0) return fieldId;

		const match = window.location.search.match(/(?:[?&](?:id|a_id)=)(\d+)/);

		return match ? parseInt(match[1], 10) : 0;
	};

	/**
	 * Upload a file with XMLHttpRequest (fetch has no upload progress).
	 * Resolves with the parsed JSON response, or null when it is not JSON.
	 */
	const upload = (data, onProgress) => new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		const token = Joomla.getOptions('csrf.token');
		const body = new FormData();

		Object.entries({ ...baseData('upload-blog-image'), ...tokenData(), ...data }).forEach(([key, value]) => body.append(key, value));

		xhr.open('POST', endpoint);
		xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		if (token) xhr.setRequestHeader('X-CSRF-Token', token);

		xhr.upload.addEventListener('progress', event => {
			if (event.lengthComputable) onProgress(Math.floor((event.loaded / event.total) * 100));
		});

		xhr.addEventListener('load', () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(parseResponse(xhr.responseText));
			} else {
				reject(new Error(`${xhr.status} ${xhr.statusText}`));
			}
		});
		xhr.addEventListener('error', () => reject(new Error('Network error')));

		xhr.send(body);
	});

	const removeImage = async src => parseResponse(await request(endpoint, {
		method: 'POST',
		data: { ...baseData('remove-blog-image'), id: getArticleId(), src: src || '', ...tokenData() },
		responseType: 'text',
	}));

	// Featured image

	const clearFeaturedImage = field => {
		field.querySelector('.hu-image-upload-wrapper').innerHTML = '';
		field.classList.remove('hu-image-field-has-image');
		field.classList.add('hu-image-field-empty');
		field.querySelector('.form-field-hu-image').value = '';
	};

	document.querySelectorAll('.hu-image-field').forEach(field => {
		const input = field.querySelector('.hu-image-upload');
		const button = field.querySelector('.btn-hu-image-upload');
		const wrapper = field.querySelector('.hu-image-upload-wrapper');
		const hidden = field.querySelector('.form-field-hu-image');

		button.addEventListener('click', event => {
			event.preventDefault();
			input.click();
		});

		input.addEventListener('change', async () => {
			const file = input.files[0];

			if (!file || !file.type.match(/image.*/)) {
				input.value = '';
				return;
			}

			input.disabled = true;
			button.setAttribute('disabled', 'disabled');
			wrapper.classList.add('loading');
			wrapper.innerHTML = '<div class="hu-image-item-loader"><div class="progress"><div class="bar"></div></div></div>';

			const bar = wrapper.querySelector('.bar');

			try {
				const data = await upload({ image: file }, percent => {
					bar.style.width = `${percent}%`;
				});

				wrapper.classList.remove('loading');
				wrapper.innerHTML = data && data.status ? data.output : '';

				if (!data) {
					alert(huText('HELIX_ULTIMATE_UPLOAD_IMAGE_FAILED', 'Unable to upload image. Please try again.'));
				}

				const image = wrapper.querySelector(':scope > img');

				field.classList.toggle('hu-image-field-has-image', !!image);
				field.classList.toggle('hu-image-field-empty', !image);
				hidden.value = image ? image.dataset.src : '';
			} catch (error) {
				wrapper.classList.remove('loading');
				wrapper.innerHTML = '';
				alert(huText('HELIX_ULTIMATE_UPLOAD_IMAGE_FAILED', 'Unable to upload image. Please try again.'));
			}

			input.value = '';
			input.disabled = false;
			button.removeAttribute('disabled');
		});
	});

	delegate(document, 'click', '.btn-hu-image-remove', async (event, target) => {
		event.preventDefault();

		const field = target.closest('.hu-image-field');

		if (!confirm(huText('JGLOBAL_CONFIRM_DELETE', 'Are you sure you want to delete?'))) return;

		if (getArticleId() <= 0) {
			clearFeaturedImage(field);
			return;
		}

		const failed = huText('HELIX_ULTIMATE_REMOVE_IMAGE_FAILED', 'Unable to remove image. Please try again.');

		try {
			const data = await removeImage(field.querySelector('.hu-image-upload-wrapper > img')?.dataset.src);

			if (!data) {
				alert(failed);
			} else if (data.status) {
				clearFeaturedImage(field);
			} else {
				alert(data.output || failed);
			}
		} catch (error) {
			alert(failed);
		}
	});

	// Gallery

	const galleryList = document.querySelector('.hu-gallery-items');
	const galleryInput = document.getElementById('hu-gallery-item-upload');

	if (!galleryList) return;

	/** Write the gallery order into the hidden field. */
	const updateGalleryField = () => {
		const hidden = document.querySelector('.form-field-hu-gallery');
		const images = [...galleryList.querySelectorAll(':scope > .hu-gallery-item')].map(item => item.dataset.src);

		if (hidden) hidden.value = JSON.stringify({ [hidden.dataset.name || 'helix_ultimate_gallery_images']: images });
	};

	document.querySelector('.btn-hu-gallery-item-upload')?.addEventListener('click', event => {
		event.preventDefault();
		galleryInput.click();
	});

	galleryInput?.addEventListener('change', () => {
		[...galleryInput.files].forEach(async file => {
			const ext = file.name.split('.').pop().toLowerCase();

			if (!ALLOWED_GALLERY_EXT.includes(ext)) return;

			const galleryId = `gallery-id-${Math.floor(Math.random() * 1e6) + 1}`;
			const item = document.createElement('li');

			item.className = 'hu-gallery-item loading';
			item.id = galleryId;
			item.innerHTML = '<div class="progress"><div class="bar"></div></div>';
			galleryList.append(item);

			const bar = item.querySelector('.bar');
			const failed = huText('HELIX_ULTIMATE_UPLOAD_GALLERY_IMAGE_FAILED', 'Unable to upload gallery image. Please try again.');

			try {
				const data = await upload({ image: file, index: galleryId, gallery: true }, percent => {
					bar.style.width = `${percent}%`;
				});

				if (data && data.status) {
					item.dataset.src = data.data_src;
					item.classList.remove('loading');
					item.innerHTML = data.output;
				} else {
					item.remove();
					alert((data && data.output) || failed);
				}
			} catch (error) {
				item.remove();
				alert(failed);
			}

			updateGalleryField();
		});

		galleryInput.value = '';
	});

	if (window.Sortable) {
		Sortable.create(galleryList, {
			draggable: '.hu-gallery-item',
			animation: 150,
			onEnd: updateGalleryField,
		});
	}

	delegate(document, 'click', '.btn-hu-remove-gallery-image', async (event, target) => {
		event.preventDefault();

		const item = target.closest('.hu-gallery-item');

		if (!confirm(huText('JGLOBAL_CONFIRM_DELETE', 'Are you sure you want to delete?'))) return;

		const removeItem = () => {
			item.remove();
			updateGalleryField();
		};

		if (getArticleId() <= 0) {
			removeItem();
			return;
		}

		const failed = huText('HELIX_ULTIMATE_REMOVE_GALLERY_IMAGE_FAILED', 'Unable to remove gallery image. Please try again.');

		try {
			const data = await removeImage(item.dataset.src);

			if (!data) {
				alert(failed);
			} else if (data.status) {
				removeItem();
			} else {
				alert(data.output || failed);
			}
		} catch (error) {
			alert(failed);
		}
	});
});
