/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/**
 * Helix Ultimate customizer: panels, draft/save, devices and generic fields.
 */
document.addEventListener('DOMContentLoaded', () => {
	'use strict';

	/**
	 * From Joomla 4.0.4, Joomla initialises `Showon` before DOMContentLoaded,
	 * which misses the Helix fields. Initialise it again now.
	 */
	if (typeof Joomla.Showon !== 'undefined' && typeof Joomla.Showon.initialise !== 'undefined') {
		Joomla.Showon.initialise(document);
	}

	const { fire, delegate, readData, serialize, request, ajaxUrl, show, hide, toggle } = Joomla.utils;

	const settings = Joomla.getOptions('data') || {};
	const meta = Joomla.getOptions('meta') || {};
	const form = document.getElementById('hu-style-form');
	const previewFrame = document.getElementById('hu-template-preview');

	let delayTimeout = null;

	/**
	 * Colour pickers (Coloris).
	 *
	 * Coloris listens on the document, so fields added later (e.g. in the
	 * layout row settings modal) open the picker too; `wrap` adds the swatch.
	 */
	const boundColorSelectors = new Set();
	const COLOR_FIELDS = '.hu-color-input, .hu-input-color, .hu-font-color-input';

	Joomla.initColorPicker = function (selector = COLOR_FIELDS) {
		if (!window.Coloris) return;

		// Older callers pass elements; their fields match the standard selectors.
		if (typeof selector !== 'string') selector = COLOR_FIELDS;

		if (!boundColorSelectors.has(selector)) {
			boundColorSelectors.add(selector);

			Coloris({
				el: selector,
				wrap: true,
				theme: 'default',
				themeMode: 'light',
				format: 'hex',
				formatToggle: false,
				alpha: true,
				margin: 4,
				focusInput: true,
				selectInput: false,
				clearButton: true,
				clearLabel: 'Clear',
				closeButton: true,
				closeLabel: 'Done',
			});
		}

		Coloris.wrap(selector);
	};

	Joomla.initColorPicker();

	// Coloris refreshes its swatch on `input`; values set in code (e.g. reset) only fire `change`.
	delegate(document, 'change', COLOR_FIELDS, (event, field) => {
		const wrapper = field.parentElement;
		if (wrapper && wrapper.classList.contains('clr-field')) wrapper.style.color = field.value;
	});

	/* ------------------------------------------------------------------ */
	/* Preview                                                             */
	/* ------------------------------------------------------------------ */

	/** Reload the preview iframe. */
	function reloadPreview() {
		const url = previewFrame.contentWindow.location.href;

		// Only reload when the iframe has really loaded something.
		if (url.length && url !== 'about:blank') {
			previewFrame.src = previewFrame.getAttribute('src');
		}
	}

	Joomla.reloadPreview = reloadPreview;

	previewFrame.addEventListener('load', () => {
		const iDocument = previewFrame.contentWindow.document;

		/**
		 * Tag every link inside the preview with `helixMode=edit`, so pages
		 * opened inside the iframe keep rendering in edit mode.
		 */
		iDocument.querySelectorAll('a').forEach(anchor => {
			const href = anchor.getAttribute('href') || '';
			if (href === '#' || href === '') return;

			const url = new URLSearchParams(new URL(anchor.href).search);

			if (url.has('helixMode')) return;
			url.append('helixMode', 'edit');

			const urlArr = anchor.href.split('?');
			urlArr[1] = url.toString();

			anchor.setAttribute('href', urlArr.join('?'));
		});

		// Lets the template tell the backend preview apart from the real site.
		iDocument.body.classList.add('back-panel');
	});

	document.querySelectorAll('.reload-preview-iframe').forEach(button => {
		button.addEventListener('click', event => {
			event.preventDefault();

			reloadPreview();
			button.classList.add('spin');
			previewFrame.addEventListener('load', () => button.classList.remove('spin'), { once: true });
		});
	});

	Joomla.utils.tooltip(document.querySelector('.hu-sidebar'));

	/* ------------------------------------------------------------------ */
	/* Draft status                                                        */
	/* ------------------------------------------------------------------ */

	const loadingEl = document.querySelector('.hu-loading-msg');
	const doneEl = document.querySelector('.hu-done-msg');
	const resetBtn = document.querySelector('.action-reset-drafts');

	const hideStatus = () => [loadingEl, doneEl, resetBtn].forEach(hide);

	function delay(ms = 500) {
		return new Promise(resolve => {
			delayTimeout = setTimeout(resolve, ms);
		});
	}

	Joomla.helixLoading = function (status, draft) {
		hideStatus();
		show(status ? loadingEl : doneEl, 'block');

		if (delayTimeout) clearTimeout(delayTimeout);

		(async () => {
			if (!status) await delay(2000);
			hide(doneEl);
			toggle(resetBtn, draft, 'inline-flex');
		})();
	};

	/* ------------------------------------------------------------------ */
	/* Collecting the form                                                 */
	/* ------------------------------------------------------------------ */

	/** Write every typography field into its hidden JSON input. */
	function webfontData() {
		document.querySelectorAll('.hu-field-webfont').forEach(field => {
			const value = selector => {
				const element = field.querySelector(selector);
				return element ? element.value : undefined;
			};

			const webfont = {
				fontFamily: value('.hu-webfont-list'),
				fontSize: value('[name=hu-webfont-size-field]'),
				fontSize_sm: value('[name=hu-webfont-size-field-sm]'),
				fontSize_xs: value('[name=hu-webfont-size-field-xs]'),
				fontWeight: value('.hu-webfont-weight-list'),
				fontStyle: value('.hu-webfont-style-list'),
				fontSubset: value('.hu-webfont-subset-list'),
				fontColor: value('.hu-font-color-input'),
				fontLineHeight: value('.hu-font-line-height-input'),
				fontLetterSpacing: value('[name=hu-font-letter-spacing-input]'),
				textDecoration: value('.hu-text-decoration'),
				textAlign: value('.hu-text-align'),
			};

			const input = field.querySelector('.hu-webfont-input');
			if (input) input.value = JSON.stringify(webfont);
		});
	}

	/** Sync the composite fields (layout, fonts, preset) into their inputs. */
	function collectComposites() {
		const layoutInput = document.getElementById('layout');

		if (layoutInput && Joomla.helixLayout) {
			layoutInput.value = JSON.stringify(Joomla.helixLayout.serialize());
		}

		webfontData();

		const presetInput = document.querySelector('.hu-input-preset');
		const activePreset = document.querySelector('.hu-preset.active');

		if (presetInput) {
			presetInput.value = JSON.stringify(readData(activePreset));
		}
	}

	const formData = () => serialize(form, '.internal-use-only');

	/* ------------------------------------------------------------------ */
	/* Drafts                                                              */
	/* ------------------------------------------------------------------ */

	async function draftChanges() {
		collectComposites();

		Joomla.helixLoading(true, false);

		try {
			const data = await request(ajaxUrl('draft-tmpl-style'), { method: 'POST', data: formData() });

			if (data.status) {
				reloadPreview();
				previewFrame.addEventListener('load', () => Joomla.helixLoading(false, data.isDrafted), { once: true });
			}
		} catch (error) {
			console.error('error: Something went wrong!', error);
			Joomla.HelixToaster.error('Error: ' + error.message, 'Error');
		}
	}

	Joomla.helixDraftChanges = draftChanges;

	/**
	 * Draft a change only when the value really changed.
	 * `safepoint` is the last saved value, `currpoint` the last drafted one.
	 * Mark the control as touched; untouch it when it is back to the saved value.
	 */
	function triggerDraftChange(element, value) {
		const control = element.closest('.controls');

		if (!control) return;

		const { safepoint, currpoint } = control.dataset;

		if (value != currpoint) {
			control.dataset.currpoint = value;
			control.classList.add('helix-input-touched');
			draftChanges();
		}

		if (value == safepoint) {
			control.classList.remove('helix-input-touched');
		}
	}

	const isTrackable = control => control && control.classList.contains('trackable') && !control.classList.contains('field-reset');

	/** Track value changes of the form fields and draft them live. */
	(function trackChanges() {
		const textFields = 'input[type="text"], input[type="email"], input[type="number"]';

		form.querySelectorAll(textFields).forEach(field => {
			field.addEventListener('keydown', event => {
				if (event.key === 'Enter') event.preventDefault();
			});
		});

		// `change` also covers values set by a picker (e.g. Coloris) without a blur.
		// Dimension parts are tracked through their hidden "WxH" input instead.
		form.querySelectorAll(`${textFields}, textarea`).forEach(field => {
			if (field.matches('.hu-field-dimension-width, .hu-field-dimension-height')) return;

			['blur', 'change'].forEach(type =>
				field.addEventListener(type, () => {
					if (isTrackable(field.closest('.controls'))) triggerDraftChange(field, field.value);
				})
			);
		});

		form.querySelectorAll('input[type="checkbox"], input[type=color]').forEach(field => {
			field.addEventListener('change', () => {
				if (isTrackable(field.closest('.controls'))) triggerDraftChange(field, field.checked ? 1 : 0);
			});
		});

		form.querySelectorAll('select, input[type="hidden"]').forEach(field => {
			field.addEventListener('change', () => {
				if (isTrackable(field.closest('.controls'))) triggerDraftChange(field, field.value);
			});
		});

		// The menu builder stores a large JSON value, so compare hashes.
		document.querySelectorAll('.hu-menu-builder input[name=megamenu]').forEach(field => {
			field.addEventListener('change', () => triggerDraftChange(field, Joomla.utils.helixHash(field.value)));
		});
	})();

	/* ------------------------------------------------------------------ */
	/* Reset draft                                                         */
	/* ------------------------------------------------------------------ */

	const touchedControls = () => [...form.querySelectorAll('.controls.helix-input-touched')];

	/** After saving, the current values become the new reset values. */
	function updateSetvalue() {
		touchedControls().forEach(control => {
			const input = control.querySelector(control.dataset.selector);

			if (input) {
				input.setAttribute('value', input.value);
				control.dataset.setvalue = input.value;
			}

			control.classList.remove('helix-input-touched');
		});
	}

	/** Put the fields back to their last saved value after discarding a draft. */
	function resetBySafepointValue() {
		form.querySelectorAll('.controls.helix-input-touched.field-reset').forEach(control => {
			const safepoint = control.dataset.safepoint ?? '';
			const input = control.dataset.selector ? control.querySelector(control.dataset.selector) : null;

			if (input) {
				if ((input.type || '').toLowerCase() === 'checkbox') {
					input.checked = safepoint == 1;
				}

				if (input.name === 'megamenu') {
					const tracker = document.querySelector('.hu-megamenu-action-tracker');

					if (tracker) {
						tracker.value = 'restore';
						fire(tracker);
					}
				} else {
					input.value = safepoint;
					input.setAttribute('value', safepoint);
					// Re-applies showon rules.
					fire(input);
				}

				control.dataset.currpoint = safepoint;
			}

			const imagePreview = control.querySelector('.hu-image-holder img');

			if (imagePreview) {
				imagePreview.setAttribute('src', `${meta.base}/${safepoint}`);
			}

			control.querySelectorAll('.hu-header-item').forEach(item => {
				item.classList.toggle('active', item.dataset.style === safepoint);
			});

			control.classList.remove('helix-input-touched', 'field-reset');
		});
	}

	if (resetBtn) {
		resetBtn.addEventListener('click', async event => {
			event.preventDefault();

			if (resetBtn.classList.contains('hide')) return;

			touchedControls().forEach(control => control.classList.add('field-reset'));

			if (!window.confirm('Do you really want to reset your settings?')) return;

			collectComposites();

			try {
				const data = await request(ajaxUrl('reset-drafted-settings'));

				if (data.status) reloadPreview();
			} catch (error) {
				console.error('error', error);
			}

			resetBySafepointValue();
			Joomla.HelixToaster.success('Successfully rolled back to the previous state!', 'Success');
			hideStatus();
		});
	}

	/* ------------------------------------------------------------------ */
	/* Save                                                                */
	/* ------------------------------------------------------------------ */

	/** Spinner + disabled state on every Save button (one per panel header). */
	function showSaveLoader(status) {
		document.querySelectorAll('.action-save-template').forEach(button => {
			button.disabled = status;
			button.classList.toggle('is-saving', status);
			button.querySelector('.hu-topbar-save-spinner')?.classList.toggle('hidden', !status);
		});
	}

	const saveTemplate = Joomla.utils.debounce(async event => {
		if (event) event.preventDefault();

		showSaveLoader(true);

		// Don't show the reset button for a draft that is now saved.
		if (delayTimeout) clearTimeout(delayTimeout);

		collectComposites();

		try {
			const data = await request(ajaxUrl('save-tmpl-style'), { method: 'POST', data: formData() });

			if (data.status) {
				previewFrame.contentWindow.location.reload();
				Joomla.HelixToaster.success('Changes have been successfully saved!', 'Success');
			} else {
				Joomla.HelixToaster.error(data.message, 'Failed');
			}

			hideStatus();
			updateSetvalue();
		} catch (error) {
			console.error('error', error);
			Joomla.HelixToaster.error('Error: ' + error.message, 'Error');
		}

		showSaveLoader(false);
	}, 500);

	document.querySelectorAll('.action-save-template').forEach(button => button.addEventListener('click', saveTemplate));

	// Ctrl/Cmd + S saves from anywhere in the customizer, even with no panel open.
	document.addEventListener('keydown', event => {
		if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 's') {
			event.preventDefault();
			saveTemplate();
		}
	});

	/* ------------------------------------------------------------------ */
	/* Devices                                                             */
	/* ------------------------------------------------------------------ */

	const deviceMap = { md: 'desktop', sm: 'tablet', xs: 'mobile', desktop: 'desktop', tablet: 'tablet', mobile: 'mobile' };
	const sizeMap = { desktop: 'md', tablet: 'sm', mobile: 'xs' };

	/** Show only the responsive variant of a setting that matches the device. */
	function onDeviceChange({ name, parent, device }) {
		['', '_sm', '_xs'].forEach(size => {
			const input = document.querySelector(`input[name=${name}${size}]`);
			const element = input && input.closest(parent);
			if (element) element.classList.add('field-hidden');
		});

		const suffix = sizeMap[device] === 'md' ? '' : '_' + sizeMap[device];
		const input = document.querySelector(`input[name=${name}${suffix}]`);
		const element = input && input.closest(parent);

		if (element) element.classList.remove('field-hidden');
	}

	onDeviceChange({ name: 'logo_height', parent: '.group-style-logo', device: 'desktop' });

	/**
	 * Switch the preview and the responsive fields between devices.
	 *
	 * @param {string} device  `desktop`, `tablet`, `mobile` (or `md`, `sm`, `xs`)
	 */
	function switchBetweenDevices(device) {
		const name = deviceMap[device] || 'desktop';
		const widthMap = {
			desktop: '100%',
			tablet: `${settings.breakpoints.tablet}px`,
			mobile: `${settings.breakpoints.mobile}px`,
		};

		document.querySelectorAll('.hu-device').forEach(button => {
			button.classList.toggle('active', button.dataset.device === name);
		});

		// Typography size inputs follow the device.
		['', '-sm', '-xs'].forEach(size => {
			document.querySelectorAll(`.hu-webfont-size-field${size}`).forEach(input => {
				const unit = input.closest('.hu-webfont-unit');
				if (unit) unit.classList.remove('active');
			});
		});

		const suffix = sizeMap[name] === 'md' ? '' : '-' + sizeMap[name];

		document.querySelectorAll(`input.hu-webfont-size-field${suffix}`).forEach(input => {
			const unit = input.closest('.hu-webfont-unit');
			if (unit) unit.classList.add('active');
		});

		onDeviceChange({ name: 'header_height', parent: '.group-style-header', device: name });
		onDeviceChange({ name: 'logo_height', parent: '.group-style-logo', device: name });

		// The width change is animated in CSS.
		previewFrame.style.width = widthMap[name];
	}

	Joomla.helixSwitchDevice = switchBetweenDevices;

	document.querySelectorAll('.hu-device').forEach(button => {
		button.addEventListener('click', event => {
			event.preventDefault();
			switchBetweenDevices(button.dataset.device);
		});
	});

	delegate(document, 'click', '.helix-responsive-devices span', (event, span) => {
		if (span.classList.contains('active')) return;

		const parent = span.closest('.hu-webfont-size');

		parent.querySelectorAll('input').forEach(input => input.classList.remove('active'));
		parent.querySelectorAll(span.dataset.active_class).forEach(input => input.classList.add('active'));
		span.parentElement.querySelectorAll('span.active').forEach(item => item.classList.remove('active'));
		span.classList.add('active');

		switchBetweenDevices(span.dataset.device);
	});

	/* ------------------------------------------------------------------ */
	/* Panels and groups                                                   */
	/* ------------------------------------------------------------------ */

	// Checkboxes render as switches.
	form.querySelectorAll('input[type="checkbox"]:not(.hu-menu-item-selector)').forEach(checkbox => {
		const group = checkbox.closest('.control-group');
		if (group) group.classList.add('control-group-checkbox');
	});

	const panelFor = name => document.querySelector(`.${name}-panel`);

	/** Open a panel from the sidebar, or close it when it is already open. */
	document.querySelectorAll('.hu-fieldset-header').forEach(header => {
		header.addEventListener('click', event => {
			event.preventDefault();

			const panel = panelFor(header.dataset.fieldset);

			if (!panel) return;

			if (panel.classList.contains('active-panel')) {
				panel.classList.remove('active-panel');
				header.classList.remove('active');
				return;
			}

			document.querySelectorAll('.hu-edit-panel.active-panel').forEach(item => item.classList.remove('active-panel'));
			panel.classList.add('active-panel');

			document.querySelectorAll('#hu-options .hu-fieldset-header.active').forEach(item => item.classList.remove('active'));
			header.classList.add('active');

			Joomla.utils.calculateSiblingDistances();
		});
	});

	document.querySelectorAll('.hu-panel-close').forEach(button => {
		button.addEventListener('click', event => {
			event.preventDefault();

			const panel = button.closest('.hu-edit-panel');
			if (panel) panel.classList.remove('active-panel');

			document.querySelectorAll(`.${button.dataset.sidebarclass} .hu-fieldset-header`).forEach(header => header.classList.remove('active'));
		});
	});

	/** Accordion groups: one open group per panel. */
	document.querySelectorAll('.hu-group-header-box').forEach(groupHeader => {
		groupHeader.addEventListener('click', event => {
			event.preventDefault();

			const fieldList = groupHeader.nextElementSibling;
			const panel = groupHeader.closest('.hu-edit-panel');

			panel.querySelectorAll('.hu-group-wrap .hu-field-list.active-group').forEach(previous => {
				if (previous !== fieldList) {
					previous.classList.remove('active-group');
					previous.parentElement.classList.remove('active');
					hide(previous);
				}
			});

			const opening = !fieldList.classList.contains('active-group');

			fieldList.classList.toggle('active-group', opening);
			groupHeader.parentElement.classList.toggle('active', opening);
			toggle(fieldList, opening, 'block');
		});
	});

	/* ------------------------------------------------------------------ */
	/* Field widgets                                                       */
	/* ------------------------------------------------------------------ */

	/** Predefined header and off-canvas pickers. */
	['header', 'offcanvas'].forEach(type => {
		delegate(document, 'click', `.hu-${type}-item`, (event, item) => {
			event.preventDefault();

			const list = item.closest(`.hu-${type}-list`);

			list.querySelectorAll(`.hu-${type}-item`).forEach(other => other.classList.remove('active'));
			item.classList.add('active');

			const input = document.getElementById(list.dataset.name);

			if (input) {
				input.value = item.dataset.style;
				fire(input);
			}
		});
	});

	/** Preset colour groups only show when "Custom Style" is on. */
	const customStyle = document.getElementById('custom_style');
	const presetGroups = () => document.querySelectorAll('.hu-fieldset-presets .hu-group-wrap');

	if (customStyle) {
		const syncPresetGroups = () => presetGroups().forEach(group => toggle(group, customStyle.checked));

		syncPresetGroups();
		customStyle.addEventListener('change', syncPresetGroups);
	}

	delegate(document, 'click', '.hu-preset', (event, preset) => {
		event.preventDefault();

		document.querySelectorAll('.hu-preset').forEach(item => item.classList.remove('active'));
		preset.classList.add('active');

		draftChanges();
	});

	/** Help text toggles; only one open per group of fields. */
	document.querySelectorAll('.hu-help-icon').forEach(icon => {
		icon.addEventListener('click', event => {
			event.preventDefault();

			const group = icon.closest('.control-group');
			const help = group.querySelector('.hu-control-help');

			icon.classList.toggle('active');

			if (help) {
				const opening = !help.classList.contains('show');
				help.classList.toggle('show', opening);
				toggle(help, opening, 'block');
			}

			[...group.parentElement.children]
				.filter(sibling => sibling !== group)
				.forEach(sibling => {
					sibling.querySelectorAll('.hu-control-help.show').forEach(other => {
						other.classList.remove('show');
						hide(other);
					});
				});
		});
	});

	/** Option groups inside modals (row/column settings). */
	delegate(document, 'click', '.hu-option-group-title', (event, title) => {
		event.preventDefault();

		const group = title.closest('.hu-option-group');

		group.classList.toggle('active');
		[...group.parentElement.children].filter(sibling => sibling !== group).forEach(sibling => sibling.classList.remove('active'));
	});

	/** Groups that depend on another field: `data-dependon="name:value"`. */
	const fieldMatches = (name, expected) => {
		const field = document.querySelector(`[name=${name}]`);

		if (!field) return false;

		if (field.type === 'checkbox') {
			return field.checked === (expected == 1);
		}

		return field.value == expected;
	};

	function handleDependOnRelationship() {
		document.querySelectorAll('.hu-group-wrap[data-dependon]').forEach(group => {
			const [name, value] = group.dataset.dependon.split(':');
			toggle(group, fieldMatches(name, value));
		});
	}

	handleDependOnRelationship();

	new Set([...document.querySelectorAll('.hu-group-wrap[data-dependon]')].map(group => group.dataset.dependon.split(':')[0])).forEach(name => {
		const field = document.querySelector(`[name=${name}]`);
		if (field) field.addEventListener('change', handleDependOnRelationship);
	});

	/** Fields that are read-only unless another field matches: `data-enableon`. */
	function handleEnableOn() {
		// The attribute sits on the field's wrapper (group-style-*), not always on .control-group.
		document.querySelectorAll('[data-enableon]').forEach(group => {
			const [name, value] = group.dataset.enableon.split(':');
			const enabled = fieldMatches(name, value);

			group.querySelectorAll('input, select, textarea').forEach(field => (field.readOnly = !enabled));
			group.classList.toggle('uneditable', !enabled);
		});
	}

	handleEnableOn();

	new Set([...document.querySelectorAll('[data-enableon]')].map(group => group.dataset.enableon.split(':')[0])).forEach(name => {
		const field = document.querySelector(`[name=${name}]`);
		if (field) field.addEventListener('change', handleEnableOn);
	});

	/** Dimension field: width and height inputs write "WxH" into the hidden input. */
	const updateDimension = (input, index) => {
		const hidden = input.closest('.controls').querySelector('.hu-field-dimension-input');
		const parts = (hidden.value || '0x0').toLowerCase().split('x');

		parts[index] = input.value === '' ? '0' : input.value;
		hidden.value = `${parts[0]}x${parts[1]}`;
		hidden.dispatchEvent(new Event('change', { bubbles: true }));
	};

	document.querySelectorAll('.hu-field-dimension-width').forEach(input => {
		if (input.closest('.controls').querySelector('.hu-field-dimension-input')) {
			input.addEventListener('input', () => updateDimension(input, 0));
		}
	});

	document.querySelectorAll('.hu-field-dimension-height').forEach(input => {
		if (input.closest('.controls').querySelector('.hu-field-dimension-input')) {
			input.addEventListener('input', () => updateDimension(input, 1));
		}
	});

	/**
	 * Segmented switchers write their value into the hidden input.
	 * The options are spans, so make them reachable and operable from the keyboard.
	 */
	document.querySelectorAll('.hu-switcher .hu-action-group [hu-switcher-action]').forEach(action => {
		action.tabIndex = 0;
		action.setAttribute('aria-pressed', String(action.classList.contains('active')));

		action.addEventListener('keydown', event => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				action.click();
			}
		});

		action.addEventListener('click', () => {
			[...action.parentElement.children].forEach(sibling => {
				sibling.classList.remove('active');
				sibling.setAttribute('aria-pressed', 'false');
			});
			action.classList.add('active');
			action.setAttribute('aria-pressed', 'true');

			const input = action.closest('.hu-switcher').querySelector('input[type=hidden]');

			if (input) {
				input.value = readData(action, 'value');
				fire(input);
			}
		});
	});

	/* ------------------------------------------------------------------ */
	/* Advanced: purge CSS, import settings                                */
	/* ------------------------------------------------------------------ */

	window.purgeCss = async function (button = null) {
		let spinner = null;

		if (button) {
			spinner = document.createElement('span');
			spinner.className = 'fas fa-circle-notch fa-spin';
			spinner.setAttribute('aria-hidden', 'true');
			button.appendChild(spinner);
		}

		try {
			const data = await request(ajaxUrl('purge-css-file'), { method: 'POST', data: {} });

			if (button && data.status) {
				button.classList.remove('disable');
			}
		} catch (error) {
			alert('Somethings wrong, Try again');
		}

		if (spinner) spinner.remove();
	};

	document.querySelectorAll('.btn-purge-hu-css').forEach(button => {
		button.addEventListener('click', event => {
			event.preventDefault();

			if (button.classList.contains('disable')) return;

			button.classList.add('disable');
			window.purgeCss(button);
		});
	});

	const importButton = document.getElementById('btn-hu-import-settings');
	const importFile = document.getElementById('helix-import-file');

	if (importButton && importFile) {
		importButton.addEventListener('click', event => {
			event.preventDefault();
			importFile.click();
		});

		importFile.addEventListener('change', () => {
			const file = importFile.files[0];

			if (!file) return;

			const reader = new FileReader();

			reader.onload = async event => {
				const data = new URLSearchParams({
					action: 'import-tmpl-style',
					option: 'com_ajax',
					helix: 'ultimate',
					request: 'task',
					format: 'json',
					'data[settings]': event.target.result,
				});

				try {
					const response = await request(window.location.href, { method: 'POST', data });

					Joomla.HelixToaster.success('Settings have been successfully imported!', 'Success');

					if (response.status) window.location.reload();
				} catch (error) {
					Joomla.HelixToaster.error('Something went wrong importing settings!', 'Error');
				}
			};

			reader.readAsText(file);
		});
	}

	/* ------------------------------------------------------------------ */
	/* Deep links                                                          */
	/* ------------------------------------------------------------------ */

	/**
	 * Open a panel (and optionally a group inside it) from the URL,
	 * e.g. `&panel=basic&group=logo`. Used by the template style details page.
	 */
	(function openRequestedPanel() {
		const params = new URLSearchParams(window.location.search);
		const panel = (params.get('panel') || '').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
		const group = (params.get('group') || '').replace(/[^a-z0-9_-]/gi, '').toLowerCase();

		if (!panel) return;

		const header = document.querySelector(`.hu-fieldset-header[data-fieldset="${panel}"]`);

		if (!header) return;

		if (!header.classList.contains('active')) header.click();

		if (!group) return;

		const groupWrap = document.querySelector(`.${panel}-panel .hu-group-${group}`);

		if (groupWrap && !groupWrap.classList.contains('active')) {
			groupWrap.querySelector(':scope > .hu-group-header-box').click();
		}
	})();
});
