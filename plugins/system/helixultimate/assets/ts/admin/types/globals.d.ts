/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

/*
 * Globals the admin scripts share at runtime. Each script is compiled on its
 * own, so code is shared through these objects, never through bundled imports
 * (that would give every file its own copy). Types are shared with `import type`.
 *
 * APIs that are not converted to TypeScript yet are typed loosely and get
 * tightened as their files move over.
 */

import type { HelixLayoutApi } from '../layout';
import type { HelixModalApi } from '../modal';
import type { HelixToasterApi } from '../toaster';
import type { HelixUtils } from '../utils';

declare global {
	interface JoomlaText {
		_(key: string, fallback?: string): string;
	}

	/** Menu tree from treeSortable.js. */
	interface HelixMenuTree {
		getLevel(branch: Element): number;
		nextSibling(branch: Element): Element | null;
		[member: string]: unknown;
	}

	interface JoomlaApi {
		getOptions<T = any>(key: string, fallback?: T): T;
		Text: JoomlaText;
		submitbutton?(task: string): void;

		utils: HelixUtils;
		HelixToaster: HelixToasterApi;
		helixModal: HelixModalApi;
		sortable?: HelixMenuTree;
		initColorPicker?(selector?: string | Element | Element[]): void;
		/** `data-revealon` showon for fields rendered in modals (fields.js). */
		setUpShowon?(container?: ParentNode | null): void;
		helixLayout?: HelixLayoutApi;
		helixMegaMenu?: unknown;
		helixSwitchDevice?: (device: string) => void;
		helixLoading?: unknown;
		helixDraftChanges?: () => void;
		[member: string]: unknown;
	}

	// Joomla core defines this global; Helix adds its own members to it.
	// eslint-disable-next-line no-var
	var Joomla: JoomlaApi;

	interface Window {
		/** Template style id of the customizer, set inline by Platform.php. */
		helixUltimateStyleId?: number | string;
		/** Clears the compiled CSS cache (helix-ultimate.js). */
		purgeCss?: () => void;
		/** SortableJS (assets/js/libs/sortable.min.js). */
		Sortable?: any;
		/** Coloris (assets/js/libs/coloris.min.js). */
		Coloris?: any;
	}
}

export {};
