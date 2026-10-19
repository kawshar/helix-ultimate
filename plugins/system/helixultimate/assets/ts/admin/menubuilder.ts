/**
 * Menu Builder Javascript functions
 *
 * @since   2.0.0
 */

interface HtmlResponse {
	status: boolean;
	data?: string;
	html?: string;
}

interface ItemModalOptions {
	title: string;
	target: string;
	className: string;
	frameUrl: string;
}

interface JoomlaFormValidator {
	isValid(form: HTMLFormElement): boolean;
}

document.addEventListener('DOMContentLoaded', () => {
	const { delegate, request, param, serialize } = Joomla.utils;
	const config: { base?: string } = Joomla.getOptions('meta') || {};
	const menuSelect = document.querySelector<HTMLSelectElement>('select[name=menu]');
	const containerElement = document.getElementById('hu-menu-builder-container');

	if (!containerElement) return;

	const container = containerElement;

	let menuType = (menuSelect && menuSelect.value) || 'mainmenu';

	const helixUrl = (action: string, extra = ''): string =>
		`${config.base}/administrator/index.php?option=com_ajax&helix=ultimate&request=task&action=${action}${extra}&helix_id=${window.helixUltimateStyleId}`;

	/** Mega menus edited in this session, drafted with the style until Save (see megamenu.js). */
	const readDrafts = (): Record<string, unknown> => {
		try {
			return JSON.parse(document.querySelector<HTMLInputElement>('#hu-style-form [name="megamenu_drafts"]')?.value || '{}') || {};
		} catch (error) {
			return {};
		}
	};

	const branchOf = (element: Element): HTMLElement | null => element.closest<HTMLElement>('.hu-menu-tree-branch');
	const itemIdOf = (element: Element): number => Number(branchOf(element)?.dataset.itemid || 0);

	/* ------------------------------------------------------------------ */
	/* Loading the tree                                                    */
	/* ------------------------------------------------------------------ */

	/** Fetch the menu items of a menu type and render the tree. */
	async function fetchMenuItems(type: string): Promise<void> {
		try {
			const response = await request<HtmlResponse>(helixUrl('getMenuItems', `&menutype=${encodeURIComponent(type)}`));

			if (response.status) {
				container.innerHTML = response.data ?? '';
				Joomla.sortable?.run();
			}
		} catch (error) {
			console.error('Could not load the menu items', error);
		}

		Joomla.reloadPreview?.();
		Joomla.utils.calculateSiblingDistances();
	}

	/** Rebuild the menu items tree (nested set) after a change. */
	async function rebuildMenu(): Promise<void> {
		try {
			await request(helixUrl('rebuildMenu'), { responseType: 'text' });
		} catch (error) {
			alert('Rebuild menu failed with: ' + (error as Error).message);
		}
	}

	if (menuSelect) {
		menuSelect.addEventListener('change', () => {
			menuType = menuSelect.value;
			fetchMenuItems(menuType);
		});
	}

	fetchMenuItems(menuType);

	/* ------------------------------------------------------------------ */
	/* Branch toolbar                                                      */
	/* ------------------------------------------------------------------ */

	function closeToolbar(): void {
		document.querySelectorAll<HTMLElement>('.hu-branch-tools .hu-branch-tools-list.active').forEach(list => {
			list.classList.remove('active');
			list.style.display = 'none';
		});
	}

	delegate(document, 'click', '.hu-branch-tools .hu-branch-tools-icon', (event, icon) => {
		event.preventDefault();

		const list = icon.nextElementSibling as HTMLElement | null;

		document.querySelectorAll<HTMLElement>('.hu-branch-tools .hu-branch-tools-list.active').forEach(other => {
			if (other !== list) {
				other.classList.remove('active');
				other.style.display = '';
			}
		});

		if (list) {
			const opening = !list.classList.contains('active');
			list.classList.toggle('active', opening);
			list.style.display = opening ? 'block' : 'none';
		}
	});

	/* ------------------------------------------------------------------ */
	/* Mega menu / settings modal                                          */
	/* ------------------------------------------------------------------ */

	delegate(document, 'click', '.hu-branch-tools .hu-branch-tools-list-megamenu', async (event, link) => {
		event.preventDefault();
		closeToolbar();

		const branch = branchOf(link);
		const parent = branch?.dataset.parent || '1';
		const host = link.closest<HTMLElement>('.hu-edit-panel');
		const isMega = parent === '1';
		const itemTitle = branch?.querySelector('.hu-branch-title')?.textContent?.trim() || '';

		try {
			// Open a drafted (not yet saved) mega menu as it was left.
			const drafts = readDrafts();
			const draft = drafts[itemIdOf(link)];
			const response = await request<HtmlResponse>(
				helixUrl('generateMegaMenuBody', `&id=${itemIdOf(link)}`),
				draft ? { method: 'POST', data: param({ draft: JSON.stringify(draft) }) } : {}
			);

			if (!response.status) return;

			const title = isMega ? 'Mega Menu' : 'Settings';

			// No customizer panel (third-party callers): keep the modal.
			if (!host) {
				Joomla.helixModal.megamenu({ title, className: 'hu-mega-menu-builder', targetType: 'id', target: 'megaMenuModal', body: response.html });
				Joomla.helixMegaMenu?.run();
				return;
			}

			// The builder keeps its modal-era wrappers so megamenu.js and its CSS still match.
			const body = document.createElement('div');
			body.className = 'hu-mega-menu-builder hu-megamenu-step';
			body.innerHTML = `<div class="hu-modal-megamenu-container">${response.html ?? ''}</div>`;

			const SETTINGS_KEY = 'helixUltimate.megamenu.settingsHidden';
			const settingsIcon =
				'<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>';

			const step = Joomla.helixSubpanel.open({
				host,
				title: itemTitle ? `${title}: ${itemTitle}` : title,
				body,
				backLabel: 'Back to menu',
				// Root items get the mega menu grid, which needs room.
				width: isMega ? 760 : undefined,
				className: isMega ? 'hu-subpanel-megamenu' : 'hu-subpanel-menu-settings',
				// Root items: the settings column can slide away to give the columns room.
				headerActions: isMega
					? `<button type="button" class="hu-subpanel-action hu-megamenu-settings-toggle" aria-pressed="false">${settingsIcon}<span>Settings</span></button>`
					: undefined,
			});

			Joomla.helixMegaMenu?.run({ root: body, close: () => step.close() });

			const toggle = step.header.querySelector<HTMLButtonElement>('.hu-megamenu-settings-toggle');
			const sidebar = body.querySelector<HTMLElement>('.hu-megamenu-sidebar');

			if (toggle && sidebar) {
				sidebar.id = sidebar.id || `hu-megamenu-sidebar-${itemIdOf(link)}`;
				toggle.setAttribute('aria-controls', sidebar.id);

				const megaSwitch = body.querySelector<HTMLInputElement>('.hu-megamenu-builder-megamenu');
				const megaOn = () => !megaSwitch || megaSwitch.checked;

				// With the mega menu off the settings are the whole step, so they always show.
				const apply = () => {
					const hidden = megaOn() && body.classList.contains('is-settings-hidden');
					sidebar.toggleAttribute('inert', hidden);
					toggle.setAttribute('aria-pressed', String(!hidden));
					toggle.title = hidden ? 'Show settings' : 'Hide settings';
				};

				const setHidden = (hidden: boolean) => {
					body.classList.toggle('is-settings-hidden', hidden);
					apply();

					try {
						localStorage.setItem(SETTINGS_KEY, hidden ? '1' : '0');
					} catch (e) {
						// Storage unavailable: the choice isn't remembered.
					}
				};

				megaSwitch?.addEventListener('change', apply);

				let hidden = true;

				try {
					hidden = localStorage.getItem(SETTINGS_KEY) !== '0';
				} catch (e) {
					// Keep the default.
				}

				setHidden(hidden);
				toggle.addEventListener('click', () => setHidden(!body.classList.contains('is-settings-hidden')));
			}
		} catch (error) {
			Joomla.HelixToaster.error('Something went wrong!', 'Error');
		}
	});

	/* ------------------------------------------------------------------ */
	/* Delete                                                              */
	/* ------------------------------------------------------------------ */

	delegate(document, 'click', '.hu-branch-tools .hu-branch-tools-list-delete', async (event, link) => {
		event.preventDefault();
		closeToolbar();

		if (!window.confirm('Are you sure to delete the item?')) return;

		try {
			await request(`${config.base}/administrator/index.php?option=com_menus&task=items.trash&cid[]=${itemIdOf(link)}`, {
				responseType: 'text',
			});
			fetchMenuItems(menuType);
		} catch (error) {
			Joomla.HelixToaster.error('Something went wrong!', 'Error');
		}

		rebuildMenu();
		Joomla.HelixToaster.error('Menu item has been successfully removed!', 'Success');
	});

	/* ------------------------------------------------------------------ */
	/* Ordering and parents after sorting                                  */
	/* ------------------------------------------------------------------ */

	/** Save the order of a parent's branches (or the root branches). */
	async function handleBranchOrdering(parent: HTMLElement | null): Promise<void> {
		const tree = Joomla.sortable;

		if (!tree) return;

		const children = parent ? tree.getChildren(parent) : tree.getRootChildren();

		if (!children.length) return;

		const data = param({
			cid: children.map(child => child.dataset.itemid),
			order: children.map((child, index) => index + 1),
		});

		try {
			await request(`${config.base}/administrator/index.php?option=com_menus&view=items&task=items.saveOrderAjax&tmpl=component`, {
				method: 'POST',
				data,
				responseType: 'text',
			});
			Joomla.reloadPreview?.();
		} catch (error) {
			console.error('Could not save the menu order', error);
		}
	}

	// The mega menu builder sorts sub items inside a column; it saves the same way.
	Joomla.helixMenuTree = {
		async saveOrder(itemIds: string[]): Promise<void> {
			if (!itemIds.length) return;

			try {
				await request(`${config.base}/administrator/index.php?option=com_menus&view=items&task=items.saveOrderAjax&tmpl=component`, {
					method: 'POST',
					data: param({ cid: itemIds, order: itemIds.map((id, index) => index + 1) }),
					responseType: 'text',
				});
			} catch (error) {
				console.error('Could not save the menu order', error);
				Joomla.HelixToaster.error('Something went wrong!', 'Error');
				return;
			}

			// Redraw the tree so it shows the new order (this also reloads the preview).
			await fetchMenuItems(menuType);
		},
	};

	document.addEventListener('sortCompleted', async event => {
		const { item } = (event as CustomEvent<{ item: HTMLElement }>).detail;
		const parent = Joomla.sortable ? Joomla.sortable.getParent(item) : null;
		const parentId = Number(item.dataset.parent);
		const newParentId = parent ? Number(parent.dataset.itemid) : 1;

		if (parentId !== newParentId) {
			try {
				const response = await request<HtmlResponse>(helixUrl('parentAdoption'), {
					method: 'POST',
					data: { id: item.dataset.itemid ?? '', parent: String(newParentId) },
				});

				if (response.status) {
					item.setAttribute('data-parent', String(newParentId));
					handleBranchOrdering(parent);
				}
			} catch (error) {
				Joomla.HelixToaster.error('Something went wrong!', 'Error');
			}

			return;
		}

		handleBranchOrdering(parent);
	});

	/* ------------------------------------------------------------------ */
	/* Add / edit items in an iframe modal                                 */
	/* ------------------------------------------------------------------ */

	const showSpinner = (status: boolean): void => {
		document.querySelectorAll('.hu-spinner').forEach(spinner => spinner.classList.toggle('hidden', !status));
	};

	/** Read Joomla's message markup from a response page. */
	function readResponse(html: string): { type: string; message: string; error: string } {
		const doc = new DOMParser().parseFromString(html, 'text/html');
		const heading = doc.querySelector('.alert-heading');
		const message = doc.querySelector('.alert-message');
		const noscript = doc.querySelector('#system-message-container noscript');

		let error = '';

		if (noscript) {
			const messages = new DOMParser().parseFromString(noscript.textContent ?? '', 'text/html');

			if (messages.querySelector('.alert-danger')) {
				error = noscript.innerHTML;
			}
		}

		return {
			type: heading ? heading.textContent ?? '' : '',
			message: message ? message.textContent ?? '' : '',
			error,
		};
	}

	/**
	 * Open a menu item form in a modal and save it from the modal footer.
	 *
	 * @param task  `item.apply` (new item) or `item.save` (edit)
	 */
	function openItemModal({ title, target, className, frameUrl }: ItemModalOptions, task: 'item.apply' | 'item.save'): void {
		Joomla.helixModal.frame({ title, targetType: 'id', target, className, frameUrl });

		const modal = document.querySelector<HTMLElement>(`.hu-modal.${className}`);
		const frame = modal?.querySelector('iframe');
		const saveButton = modal?.querySelector<HTMLButtonElement>('.hu-save-btn');

		if (!modal || !frame || !saveButton) return;

		saveButton.disabled = true;

		modal.querySelector('.hu-cancel-btn')?.addEventListener('click', () => Joomla.helixModal.close());

		frame.addEventListener('load', () => {
			saveButton.disabled = false;
		});

		saveButton.addEventListener(
			'click',
			Joomla.utils.debounce(async () => {
				const frameWindow = frame.contentWindow;
				const frameDoc = frameWindow?.document;
				const form = frameDoc?.querySelector('form');

				if (!frameDoc || !form) return;

				const taskInput = form.querySelector<HTMLInputElement>('input[name=task]');

				if (taskInput) {
					taskInput.value = task;
					taskInput.setAttribute('value', task);
				}

				// Joomla's form validator, attached to the iframe's document.
				const validator = (frameDoc as Document & { formvalidator?: JoomlaFormValidator }).formvalidator;

				if (validator && !validator.isValid(form)) return;

				showSpinner(true);

				try {
					const html = await request(form.getAttribute('action') ?? '', {
						method: 'POST',
						data: serialize(form),
						responseType: 'text',
					});
					const response = readResponse(html);

					if (response.error) {
						Joomla.HelixToaster.error(response.error, 'Error');
					} else if (html && response.type !== 'Error') {
						fetchMenuItems(menuType);
						Joomla.helixModal.close();

						Joomla.HelixToaster.success(
							task === 'item.apply' ? 'Menu item has been successfully added!' : 'Changes have been successfully saved!',
							task === 'item.apply' ? 'Saved' : 'Updated'
						);
					} else {
						Joomla.HelixToaster.error(response.message, 'Error');
					}
				} catch (error) {
					Joomla.HelixToaster.error('Something went wrong!', 'Error');
				}

				showSpinner(false);
			}, 500)
		);
	}

	delegate(document, 'click', '.hu-branch-tools .hu-branch-tools-list-edit', (event, link) => {
		event.preventDefault();
		closeToolbar();

		openItemModal(
			{
				title: 'Edit Menu Item',
				target: 'editMenuItem',
				className: 'edit-menu-item',
				frameUrl: `${config.base}/administrator/index.php?option=com_menus&task=item.edit&tmpl=component&menutype=${encodeURIComponent(menuType)}&id=${itemIdOf(link)}`,
			},
			'item.save'
		);
	});

	delegate(document, 'click', '.hu-add-menu-item', event => {
		event.preventDefault();

		openItemModal(
			{
				title: 'Add New Item',
				target: 'addNewMenuItem',
				className: 'add-new-menu-item',
				frameUrl: `${config.base}/administrator/index.php?option=com_menus&task=item.add&tmpl=component&menutype=${encodeURIComponent(menuType)}`,
			},
			'item.apply'
		);
	});
});
