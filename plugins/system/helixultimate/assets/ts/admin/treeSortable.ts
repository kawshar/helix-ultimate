/**
 * Menu tree sorting on SortableJS.
 *
 * The tree is a flat list; each branch has a `hu-branch-level-N` class.
 * Dragging up or down moves a branch (with its children); dragging left or
 * right changes its level, within the levels its neighbours allow.
 *
 * @package TreeSortable
 * @license MIT
 * @author Sajeeb Ahamed
 */

/* Published as `Joomla.sortable`. */

export interface TreeSortableOptions {
	depth: number;
	treeSelector: string;
	branchSelector: string;
	dragHandlerSelector: string;
	childrenBusSelector: string;
	levelPrefix: string;
	maxLevel: number;
}

const options: TreeSortableOptions = {
	depth: 20,
	treeSelector: '#hu-menu-tree',
	branchSelector: '.hu-menu-tree-branch',
	dragHandlerSelector: '.hu-branch-drag-handler',
	childrenBusSelector: '.hu-menu-children-bus',
	levelPrefix: 'hu-branch-level',
	maxLevel: 10,
};

const GEAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" class="bi bi-gear" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"></path><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"></path></svg>`;
const MEGA_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" class="bi bi-grid-1x2" viewBox="0 0 16 16"><path d="M6 1H1v14h5V1zm9 0h-5v5h5V1zm0 9v5h-5v-5h5zM0 1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V1zm9 0a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V1zm1 8a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1h-5z"></path></svg>`;

const isBranch = (element: Element | null | undefined): element is HTMLElement =>
	Boolean(element && element.matches && element.matches(options.branchSelector));

/** Level of a branch (1-based), from its level class; 0 when there is no branch. */
function getLevel(branch: Element | null | undefined): number {
	if (!isBranch(branch)) return 0;

	const match = branch.className.match(new RegExp(`${options.levelPrefix}-(\\d+)`));

	if (match) return Number(match[1]);

	return Math.floor(parseFloat(getComputedStyle(branch).marginLeft || '0') / options.depth) + 1;
}

function setLevel(branch: Element, level: number): void {
	branch.className = branch.className.replace(new RegExp(`\\s*${options.levelPrefix}-\\d+`, 'g'), '');
	branch.classList.add(`${options.levelPrefix}-${level}`);
}

const nextBranch = (branch: Element): HTMLElement | null => (isBranch(branch.nextElementSibling) ? branch.nextElementSibling : null);
const prevBranch = (branch: Element): HTMLElement | null => (isBranch(branch.previousElementSibling) ? branch.previousElementSibling : null);

/** The branches nested under `branch` (the following deeper ones). */
function getChildren(branch: Element): HTMLElement[] {
	const level = getLevel(branch);
	const children: HTMLElement[] = [];
	let next = nextBranch(branch);

	while (next && getLevel(next) > level) {
		children.push(next);
		next = nextBranch(next);
	}

	return children;
}

/** The closest earlier branch with a lower level, or null for a root branch. */
function getParent(branch: Element): HTMLElement | null {
	const level = getLevel(branch);
	let prev = prevBranch(branch);

	while (prev && getLevel(prev) >= level) {
		prev = prevBranch(prev);
	}

	return prev;
}

const getTree = (): HTMLElement | null => document.querySelector<HTMLElement>(options.treeSelector);

function getRootChildren(): HTMLElement[] {
	const tree = getTree();
	return tree ? [...tree.children].filter((branch): branch is HTMLElement => isBranch(branch) && getLevel(branch) === 1) : [];
}

/** The next branch on the same level, skipping children; null if none. */
function nextSibling(branch: Element): HTMLElement | null {
	const level = getLevel(branch);
	let next = nextBranch(branch);

	while (next && getLevel(next) > level) {
		next = nextBranch(next);
	}

	return next && getLevel(next) === level ? next : null;
}

/** All other branches on a level. */
function getSiblings(branch: Element, level: number = getLevel(branch)): HTMLElement[] {
	const tree = getTree();
	return tree ? [...tree.children].filter((other): other is HTMLElement => isBranch(other) && other !== branch && getLevel(other) === level) : [];
}

function run(): void {
	const treeElement = getTree();

	if (!treeElement || !window.Sortable || treeElement.dataset.huTreeSortable) return;

	const tree = treeElement;

	tree.dataset.huTreeSortable = '1';

	let item: HTMLElement | null = null;
	let bus: HTMLElement | null = null;
	let currentLevel = 1;
	let originalLevel = 1;
	let originalIndex = 0;
	let aliasExists = false;

	const paths = () => tree.querySelectorAll<HTMLElement>(`${options.branchSelector} .hu-menu-branch-path`);

	/** Pick the level from how far right the dragged copy is. */
	const onPointerMove = (): void => {
		const ghost = document.querySelector('.sortable-fallback');

		if (!item || !ghost) return;

		const prev = prevBranch(item);
		const next = nextBranch(item);
		const upper = prev ? Math.min(getLevel(prev) + 1, options.maxLevel) : 1;
		const lower = Math.min(next ? getLevel(next) : 1, upper);
		const position = Math.max(0, ghost.getBoundingClientRect().left - tree.getBoundingClientRect().left);

		let level = Math.floor(position / options.depth) + 1;
		level = Math.max(lower, Math.min(level, upper));

		// Two items with the same alias can't share a level.
		const alias = item.dataset.alias;
		aliasExists = getSiblings(item, level).some(other => other.dataset.alias === alias);

		if (aliasExists || level === currentLevel) return;

		setLevel(item, level);
		currentLevel = level;
	};

	window.Sortable.create(tree, {
		handle: options.dragHandlerSelector,
		draggable: options.branchSelector,
		animation: 150,
		forceFallback: true,
		fallbackOnBody: true,
		ghostClass: 'hu-sortable-placeholder',

		onStart(event: { item: HTMLElement }) {
			const dragged = event.item;
			const childrenBus = dragged.querySelector<HTMLElement>(options.childrenBusSelector);

			item = dragged;
			bus = childrenBus;
			originalLevel = currentLevel = getLevel(dragged);
			originalIndex = [...tree.children].indexOf(dragged);
			aliasExists = false;

			// Children travel inside the dragged branch.
			getChildren(dragged).forEach(child => childrenBus?.appendChild(child));

			paths().forEach(path => (path.style.display = 'none'));
			document.addEventListener('pointermove', onPointerMove);
		},

		onEnd() {
			document.removeEventListener('pointermove', onPointerMove);

			if (!item) return;

			const dragged = item;

			if (aliasExists) {
				Joomla.HelixToaster.error(`Can't set the same alias "${dragged.dataset.alias}" in the same menu level!`, 'Error');
			}

			// Put the children back after their branch, at their new level.
			const children = bus ? [...bus.children] : [];
			dragged.after(...children);
			children.forEach(child => setLevel(child, getLevel(child) + currentLevel - originalLevel));

			// Root branches open the mega menu; deeper ones their settings.
			const settingsIcon = dragged.querySelector('.hu-branch-tools-list-megamenu');
			if (settingsIcon) settingsIcon.innerHTML = currentLevel > 1 ? GEAR_ICON : MEGA_ICON;

			tree.querySelectorAll<HTMLElement>(`${options.branchSelector}:not(.${options.levelPrefix}-1) .hu-menu-branch-path`).forEach(
				path => (path.style.display = '')
			);

			if (currentLevel !== originalLevel || originalIndex !== [...tree.children].indexOf(dragged)) {
				document.dispatchEvent(new CustomEvent('sortCompleted', { detail: { item: dragged } }));
			}

			Joomla.utils.calculateSiblingDistances();

			item = null;
			bus = null;
		},
	});
}

const sortable = {
	options,
	run,
	getLevel,
	setLevel,
	getChildren,
	getParent,
	getRootChildren,
	nextSibling,
	getSiblings,
};

export type HelixMenuTree = typeof sortable;

Joomla.sortable = sortable;
