<?php

/**
 * @package 	Helix_Ultimate_Framework
 * @author 		JoomShaper <joomshaper@js.com>
 * @copyright 	Copyright (c) 2010 - 2020 JoomShaper
 * @license 	http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

namespace HelixUltimate\Framework\HttpResponse;

use HelixUltimate\Framework\Platform\Builders\MegaMenuBuilder;
use HelixUltimate\Framework\Platform\Helper;
use HelixUltimate\Framework\System\JoomlaBridge;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\FileLayout;
use Joomla\CMS\Menu\SiteMenu;
use Joomla\CMS\Table\Table;
use Joomla\Database\DatabaseInterface;

defined('_JEXEC') or die();

/**
 * Class for Ajax Http Response.
 * This is handle Ajax request.
 *
 * @since   1.0.0
 */
class Response
{
	/**
	 * Response for the request getMenuItems.
	 *
	 * @return	array
	 * @since	2.0.0
	 */
	public static function getMenuItems()
	{
		$input = Factory::getApplication()->input;
		$menuType = $input->get('menutype', 'mainmenu', 'STRING');

		if (!self::canEditMenuType($menuType)) {
			return [
				'status'  => false,
				'message' => Text::_('JERROR_ALERTNOAUTHOR')
			];
		}

		$items = self::getItems($menuType);

		return [
			'status' => true,
			'data' => self::generateMenuTree($items),
			'items' => $items
		];
	}

	/**
	 * Response for the request parentAdoption
	 *
	 * @return	array
	 * @since	2.0.0
	 */
	public static function parentAdoption()
	{
		$input = Factory::getApplication()->input;
		$itemId = $input->post->get('id', 0, 'INT');
		$parentId = $input->post->get('parent', 0, 'INT');
		$data = null;

		if ($itemId > 0 && $parentId > 0) {
			$item   = self::loadMenuRow($itemId);
			$parent = self::loadMenuRow($parentId);

			/**
			 * Only a site menu item, moved under the root or under another item of the
			 * same menu (not itself or one of its own children), by a user who may edit that menu.
			 */
			$validParent = $parent && ((int) $parent->id === 1
				|| ((int) $parent->client_id === 0 && $parent->menutype === ($item->menutype ?? null)
					&& !((int) $parent->lft >= (int) $item->lft && (int) $parent->rgt <= (int) $item->rgt)));

			if (!$item || (int) $item->client_id !== 0 || (int) $item->id === 1 || !$validParent || !self::canEditMenuType((string) $item->menutype)) {
				return [
					'status'  => false,
					'message' => Text::_('JERROR_ALERTNOAUTHOR')
				];
			}

			$data = new \stdClass;
			$data->id = $itemId;
			$data->parent_id = $parentId;

			try {
				$itemModel = self::getMenuItemModel();
				$db = Factory::getDbo();
				$db->updateObject('#__menu', $data, 'id');

				$itemModel->rebuild();
			} catch (\Exception $e) {
				echo $e->getMessage();
			}
		}

		return [
			'status' => true,
			'data' => [$data]
		];
	}

	/**
	 * Column sizes of a grid pattern such as "4+8": whole numbers from 1 to 12.
	 *
	 * @param	string	$layout		The pattern.
	 *
	 * @return	array<int, string>
	 * @since	2.2.11
	 */
	private static function gridSizes(string $layout): array
	{
		$sizes = [];

		foreach (explode('+', $layout) as $size) {
			$size = (int) $size;
			$sizes[] = (string) max(1, min(12, $size ?: 12));
		}

		return $sizes ?: ['12'];
	}

	/**
	 * A row of #__menu (for permission and tree checks).
	 *
	 * @param	int		$id		The menu item ID.
	 *
	 * @return	object|null
	 * @since	2.2.11
	 */
	private static function loadMenuRow(int $id)
	{
		try {
			$db = Factory::getContainer()->get(DatabaseInterface::class);
			$query = $db->getQuery(true)
				->select($db->quoteName(['id', 'menutype', 'client_id', 'lft', 'rgt']))
				->from($db->quoteName('#__menu'))
				->where($db->quoteName('id') . ' = ' . (int) $id);

			return $db->setQuery($query)->loadObject() ?: null;
		} catch (\Throwable $e) {
			return null;
		}
	}

	/**
	 * May the current user edit the items of a menu? Super users, or core.edit on
	 * that menu's asset (com_menus.menu.<id>), not the broad component permission.
	 *
	 * @param	string	$menuType	The menu type.
	 *
	 * @return	bool
	 * @since	2.2.11
	 */
	private static function canEditMenuType(string $menuType): bool
	{
		$user = Factory::getApplication()->getIdentity();

		if (!$user || !$user->id) {
			return false;
		}

		if ($user->authorise('core.admin')) {
			return true;
		}

		$menuTypeId = 0;

		if ($menuType !== '') {
			try {
				$db = Factory::getContainer()->get(DatabaseInterface::class);
				$query = $db->getQuery(true)
					->select($db->quoteName('id'))
					->from($db->quoteName('#__menu_types'))
					->where($db->quoteName('menutype') . ' = ' . $db->quote($menuType))
					->where($db->quoteName('client_id') . ' = 0');
				$db->setQuery($query);
				$menuTypeId = (int) $db->loadResult();
			} catch (\Throwable $e) {
				$menuTypeId = 0;
			}
		}

		return $menuTypeId > 0 && $user->authorise('core.edit', 'com_menus.menu.' . $menuTypeId);
	}

	/**
	 * Get menu item model instance.
	 *
	 * @return	ItemModel
	 * @since	2.0.0
	 */
	private static function getMenuItemModel()
	{
		if (JoomlaBridge::getVersion('major') < 4) {
			$classUrl = JPATH_ADMINISTRATOR . '/components/com_menus/models/item.php';
			$tablePath = JPATH_ADMINISTRATOR . '/components/com_menus/tables';
		}

		if (JoomlaBridge::getVersion('major') < 4) {
			if (!\class_exists('MenusModelItem') && \file_exists($classUrl)) {
				require_once $classUrl;
			}

			Table::addIncludePath($tablePath);
		}


		return JoomlaBridge::getVersion('major') >= 4
			? new \Joomla\Component\Menus\Administrator\Model\ItemModel
			: new \MenusModelItem;
	}

	/**
	 * Rebuild the menu tree
	 *
	 * @return	void
	 * @since	2.0.0
	 */
	public static function rebuildMenu()
	{
		try {
			$itemModel = self::getMenuItemModel();
			$itemModel->rebuild();
		} catch (\Exception $e) {
			return [
				'status' => false,
				'message' => $e->getMessage()
			];
		}

		return [
			'status' => true,
			'message' => 'Rebuilding done'
		];
	}

	/**
	 * Get Menu Items for a specific menu type
	 *
	 * @return	string
	 * @since	2.0.0
	 */
	private static function getItems($menuType)
	{
		$items = [];

		try {
			$db 	= Factory::getContainer()->get(DatabaseInterface::class);
			$query 	= $db->getQuery(true);

			$query->select('id, title, menutype, alias, parent_id, level, lft, rgt, published')
				->from($db->qn('#__menu'))
				->where($db->qn('menutype') . ' = ' . $db->q($menuType))
				->where($db->qn('client_id') . ' = 0')
				->where($db->qn('published') . ' IN (0,1)');
			$query->order($db->qn('lft') . ' ASC');

			$db->setQuery($query);

			$items = $db->loadObjectList();
		} catch (\Exception $e) {
			echo $e->getMessage();
		}

		return $items;
	}

	/**
	 * Generate Menu Item Tree
	 *
	 * @param	array	$items	The items array.
	 *
	 * @return 	string	The HTML string.
	 * @since	2.0.0
	 */
	private static function generateMenuTree($items)
	{
		$html = [];

		if (!empty($items)) {
			// The customizer's outline icons (same set as the rest of the panel).
			$editSvg     = \HelixUltimate\Framework\Platform\Icon::get('pen', ['size' => 15]);
			$megaSvg     = \HelixUltimate\Framework\Platform\Icon::get('columns', ['size' => 15]);
			$settingsSvg = \HelixUltimate\Framework\Platform\Icon::get('settings', ['size' => 15]);

			$html[] = '<ul id="hu-menu-tree">';
			$count = count($items) ?? 0;

			foreach ($items as $key => $item) {
				$safeTitle = htmlspecialchars($item->title, ENT_QUOTES, 'UTF-8');
				$safeAlias = htmlspecialchars($item->alias, ENT_QUOTES, 'UTF-8');
				$html[] = '<li class="hu-menu-tree-branch hu-branch-level-' . $item->level . ' ' . ((int) $item->published === 0 ? 'hu-megamenu-branch-muted' : '') . '" data-alias="' .  $safeAlias . '" data-itemid="' . $item->id . '" data-parent="' . $item->parent_id . '" style="z-index: ' . (max(1, $count - $key)) . '" >';
				$html[] = '	<div class="hu-menu-tree-contents">';
				$html[] = '		<span class="hu-menu-branch-path"></span>';
				$html[] = '		<div class="hu-branch-drag-handler">';
				$html[] = '			<span class="hu-branch-icon">' . \HelixUltimate\Framework\Platform\Icon::get('sort', ['size' => 14]) . '</span>';
				$html[] = '			<span class="hu-branch-title">' . $safeTitle . '</span>';

				if ((int) $item->published === 0) {
					$html[] = '<span class="hu-branch-unpublished" title="' . Text::_('Unpublished') . '">' . \HelixUltimate\Framework\Platform\Icon::get('eye-off', ['size' => 14]) . '</span>';
				}

				$html[] = '			<div class="hu-branch-tools">';
				$html[] = '				<ul class="hu-branch-tools-list">';
				// Mega menu / options first (the customizer's own job), then edit. Deleting an item is
				// left to its edit form (status: Trashed) and Joomla's Menus, away from a quick hover click.
				$html[] = '					<li><a href="#" class="hu-branch-tools-list-megamenu disabled" aria-label="' . Text::_($item->parent_id > 1 ? 'HELIX_ULTIMATE_MENU_OPTIONS' : 'HELIX_ULTIMATE_MENU_MEGAMENU') . '" title="' . Text::_($item->parent_id > 1 ? 'HELIX_ULTIMATE_MENU_OPTIONS' : 'HELIX_ULTIMATE_MENU_MEGAMENU') . '">' . ($item->parent_id > 1 ? $settingsSvg  : $megaSvg) . '</a></li>';
				$html[] = '					<li><a href="#" class="hu-branch-tools-list-edit" aria-label="' . Text::_('HELIX_ULTIMATE_MENU_EDIT') . '" title="' . Text::_('HELIX_ULTIMATE_MENU_EDIT') . '">' . $editSvg . '</a></li>';
				$html[] = '				</ul>';
				$html[] = '			</div>';

				$html[] = '		</div>';
				$html[] = '	</div>';
				$html[] = '<div class="hu-menu-children-bus"></div>';
				$html[] = '</li>';
			}

			$html[] = '</ul>';
		}

		return implode("\n", $html);
	}

	/**
	 * Generate mega menu builder body contents.
	 *
	 * @param	int		$itemId	The Menu Item ID.
	 *
	 * @return 	array	The HTML string.
	 * @since	2.0.0
	 */
	public static function generateMegaMenuBody()
	{
		$input = Factory::getApplication()->input;
		$itemId = $input->get('id', 0, 'INT');
		$row = self::loadMenuRow($itemId);

		if (!$row || (int) $row->client_id !== 0 || !self::canEditMenuType((string) $row->menutype)) {
			return [
				'status'  => false,
				'message' => Text::_('JERROR_ALERTNOAUTHOR')
			];
		}

		$layout = new FileLayout('megaMenu.container', HELIX_LAYOUT_PATH);
		$builder = new MegaMenuBuilder($itemId);

		// Settings drafted in the customizer (not saved yet) open instead of the stored ones.
		$draft = \json_decode($input->post->get('draft', '', 'RAW') ?: 'null', true);

		if (\is_array($draft))
		{
			$builder->useSettings(Helper::sanitizeMegaMenuSettings($draft));
		}

		return [
			'status' => true,
			'html' => $layout->render(['itemId' => $itemId, 'builder' => $builder])
		];
	}

	/**
	 * Save mega menu settings.
	 *
	 * @return	array	The response array.
	 * @since	2.0.0
	 */
	public static function saveMegaMenuSettings()
	{
		$input = Factory::getApplication()->input;

		return self::storeMegaMenuSettings(
			$input->post->get('id', 0, 'INT'),
			$input->post->get('settings', [], 'ARRAY')
		);
	}

	/**
	 * Write mega menu settings to a menu item, when the user may edit its menu.
	 * Also used by the customizer's Save for the mega menus it drafted.
	 *
	 * @param	int		$itemId		The menu item ID.
	 * @param	array	$settings	Raw settings (sanitized here).
	 *
	 * @return	array	The response array.
	 * @since	2.2.11
	 */
	public static function storeMegaMenuSettings(int $itemId, array $settings): array
	{
		$user = Factory::getApplication()->getIdentity();

		if (!$user || !$user->id || $itemId <= 0) {
			return [
				'status'  => false,
				'message' => Text::_('JERROR_ALERTNOAUTHOR')
			];
		}

		$menu = new SiteMenu;
		$item = $menu->getItem($itemId);

		if (!$item || empty($item->id)) {
			return [
				'status'  => false,
				'message' => 'Menu item not found'
			];
		}

		// Enforce menu type asset authority (com_menus.menu.<id>)
		$canEdit = self::canEditMenuType((string) ($item->menutype ?? ''));

		if (!$canEdit) {
			return [
				'status'  => false,
				'message' => Text::_('JERROR_ALERTNOAUTHOR')
			];
		}

		$settings = Helper::sanitizeMegaMenuSettings($settings);
		$params   = $item->getParams();
		$params->set('helixultimatemenulayout', \json_encode($settings));

		$response = self::updateMenuItem($itemId, $params);

		return [
			'status' => $response === true,
			'data'   => $response
		];
	}

	private static function updateMenuItem($itemId, $params)
	{
		try {
			$data = new \stdClass;
			$data->id = $itemId;
			$data->params = $params->toString();
			$db = Factory::getDbo();
			$db->updateObject('#__menu', $data, 'id', true);

			return true;
		} catch (\Exception $e) {
			return $e->getMessage();
		}
	}

	/**
	 * Load slots for the rows.
	 *
	 * @return	array	The response array
	 * @since	2.0.0
	 */
	public static function updateRowLayout()
	{
		$input = Factory::getApplication()->input;
		$layout = $input->post->get('layout', '12', 'STRING');
		$rowData = $input->post->get('data', null, 'RAW');
		$rowId = $input->post->get('rowId', 0, 'INT');
		$itemId = $input->post->get('itemId', 0, 'INT');

		$rowData = \json_decode($rowData ?? "");

		if (!\is_object($rowData)) {
			$rowData = (object) ['type' => 'row', 'attr' => []];
		}

		if (!isset($rowData->attr) || !\is_array($rowData->attr)) {
			$rowData->attr = [];
		}

		$layout = \preg_replace("@\s@", '', $layout);
		$layoutArray = self::gridSizes($layout);

		$columns = [];

		foreach ($layoutArray as $key => $col) {
			if (isset($rowData->attr[$key])) {
				$tmp = $rowData->attr[$key];
			} else {
				$tmp = new \stdClass;
				$tmp->menuParentId = '';
				$tmp->moduleId = '';
				$tmp->type = 'column';
				$tmp->items = [];
			}

			$tmp->colGrid = $col;

			$columns[] = $tmp;
		}

		$rowData->attr = $columns;

		$columnLayout = new FileLayout('megaMenu.column', HELIX_LAYOUT_PATH);
		$builder = new MegaMenuBuilder($itemId);

		$html = [];

		foreach ($columns as $key => $column) {
			$html[] = $columnLayout->render([
				'itemId' => $itemId,
				'builder' => $builder,
				'column' => $column,
				'rowId' => $rowId,
				'columnId' => $key + 1
			]);
		}

		return [
			'status' => true,
			'html' => implode("\n", $html),
			'data' => $rowData
		];
	}

	/**
	 * Generate row from the user data.
	 *
	 * @return	array	the response array
	 * @since	2.0.0
	 */
	public static function generateRow()
	{
		$input = Factory::getApplication()->input;
		$layout = $input->post->get('layout', '12', 'STRING');
		$rowId = $input->post->get('rowId', 0, 'INT');
		$itemId = $input->post->get('itemId', 0, 'INT');

		$layout = \preg_replace("@\s@", '', $layout);

		$layoutArray = self::gridSizes($layout);

		$rowData = new \stdClass;
		$rowData->type = 'row';
		$rowData->attr = [];

		if (!empty($layoutArray)) {
			foreach ($layoutArray as $column) {
				$item = new \stdClass;
				$item->type = 'column';
				$item->colGrid = $column;
				$item->items = [];
				$item->menuParentId = '';
				$item->moduleId = '';
				$rowData->attr[] = $item;
			}
		}

		$builder = new MegaMenuBuilder($itemId);
		$isNew = \count($builder->getMegaMenuSettings()->layout ?? []) === 0;

		/**
		 * If no row exists before, then get the child items of the item
		 *
		 */
		if ($isNew) {
			$children = $builder->getItemChildren();

			if (!empty($children)) {
				$perColumn = ceil(\count($children) / \count($layoutArray));
				$chunks = \array_chunk($children, $perColumn);

				foreach ($chunks as $key => $children) {
					$cells = [];

					foreach ($children as $child) {
						$tmp = new \stdClass;
						$tmp->type = 'menu_item';
						$tmp->item_id = $child->id;
						$cells[] = $tmp;
					}

					$rowData->attr[$key]->items = $cells;
				}
			}
		}

		$rowLayout = new FileLayout('megaMenu.row', HELIX_LAYOUT_PATH);

		$rowHTML = $rowLayout->render([
			'itemId' => $itemId,
			'builder' => $builder,
			'row' => $rowData,
			'rowId' => $rowId
		]);

		return [
			'status' => true,
			'data' => $rowHTML,
			'row' => $rowData
		];
	}

	/**
	 * Generate popover for manipulating the menu item.
	 *
	 * @return	array	The response array.
	 * @since	2.0.0
	 */
	public static function generatePopoverContents()
	{
		$input = Factory::getApplication()->input;

		// The menu item id
		$itemId = $input->post->get('itemId', 0, 'INT');
		$type = $input->post->get('type', 'module', 'STRING');

		$builder = new MegaMenuBuilder($itemId);

		$html = [];

		if ($type === 'module') {
			$modules = Helper::getModules();
			$html = [];
			$html[] = '<select class="hu-input hu-megamenu-module" data-type="module" data-husearch="1">';
			$html[] = '<option value="">Select Module</option>';
			foreach ($modules as $module) {
				$html[] = '<option value="' . (int) $module->id . '">' . htmlspecialchars((string) $module->title, ENT_QUOTES, 'UTF-8') . '</option>';
			}

			$html[] = '</select>';
		} elseif ($type === 'menu') {
			$children = $builder->getItemChildren();
			$html = [];
			$html[] = '<select class="hu-input hu-megamenu-menuitem" data-type="menu_item">';
			$html[] = '<option value="">Select Menu Item</option>';

			foreach ($children as $child) {
				$html[] = '<option value="' . (int) $child->id . '">' . htmlspecialchars((string) $child->title, ENT_QUOTES, 'UTF-8') . '</option>';
			}

			$html[] = '</select>';
		}


		return [
			'status' => true,
			'html' => implode("\n", $html)
		];
	}

	public static function generateNewCell()
	{
		$input = Factory::getApplication()->input;

		$itemId 	= $input->post->get('itemId', 0, 'INT');
		$type 		= $input->post->get('type', 'module', 'STRING');
		$elementId 	= $input->post->get('item_id', 0, 'INT');
		$rowId 		= $input->post->get('rowId', 0, 'INT');
		$columnId 	= $input->post->get('columnId', 0, 'INT');
		$cellId 	= $input->post->get('cellId', 0, 'INT');

		$builder = new MegaMenuBuilder($itemId);

		$cell = new \stdClass;
		$cell->type = $type;
		$cell->item_id = $elementId;

		$cellLayout = new FileLayout('megaMenu.cell', HELIX_LAYOUT_PATH);
		$html = $cellLayout->render([
			'itemId' => $itemId,
			'builder' => $builder,
			'cell' => $cell,
			'rowId' => $rowId,
			'columnId' => $columnId,
			'cellId' => $cellId
		]);

		return [
			'status' => true,
			'html' => $html
		];
	}

	/**
	 * Get the module list and render the list
	 *
	 * @return	array	The response array.
	 * @since	2.0.0
	 */
	public static function getModuleList()
	{
		$input = Factory::getApplication()->input;
		$keyword = $input->get('keyword', '', 'STRING');
		$itemId = $input->get('itemId', 0, 'INT');

		$children = [];
		if ($itemId) {
			$builder = new MegaMenuBuilder($itemId);
			$children = $builder->getItemChildren();
		}

		if (!empty($keyword)) {
			$children = array_filter($children, function ($child) use ($keyword) {
				return stripos($child->title, $keyword) !== false
					|| (!empty($child->desc) && stripos($child->desc, $keyword) !== false);
			});
		}

		$moduleLayout = new FileLayout('megaMenu.modules', HELIX_LAYOUT_PATH);

		return [
			'status' => true,
			'html' => $moduleLayout->render([
				'keyword' => $keyword,
				'children' => $children
			]),

		];
	}
}
