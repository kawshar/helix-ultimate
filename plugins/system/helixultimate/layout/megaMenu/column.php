<?php
/**
 * @package Helix_Ultimate_Framework
 * @author JoomShaper <support@joomshaper.com>
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

defined('_JEXEC') or die();

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\FileLayout;
use Joomla\CMS\Uri\Uri;

extract($displayData);

$cellLayout = new FileLayout('megaMenu.cell', HELIX_LAYOUT_PATH);
$cells = [];

if (!empty($column->items))
{
	$cells = $column->items;
}

?>

<div class="hu-megamenu-col col-<?php echo $column->colGrid; ?>" data-rowid="<?php echo $rowId; ?>" data-columnid="<?php echo $columnId; ?>">
	<div class="hu-megamenu-column-contents-wrapper">
		<div class="hu-megamenu-column-toolbar hu-megamenu-column-drag-handler">
			<?php echo \HelixUltimate\Framework\Platform\Icon::get('sort-horizontal'); ?>
			<span>Column</span>
		</div>
		<div class="hu-megamenu-column-contents">
			<?php foreach ($cells as $key => $cell): ?>
				<?php 
					echo $cellLayout->render([
						'itemId' => $itemId,
						'builder' => $builder,
						'cell' => $cell,
						'rowId' => $rowId,
						'columnId' => $columnId,
						'cellId' => $key + 1
					]);
				?>
			<?php endforeach ?>
		</div>
		
		<div class="hu-megamenu-add-item-wrapper">
			<button class="hu-megamenu-add-new-item" title="Add Module">
				<?php echo \HelixUltimate\Framework\Platform\Icon::get('plus'); ?>
			</button>
			<ul class="hu-megamenu-cell-options" style="display: none;">
				<li><a href="#" class="hu-megamenu-cell-options-item" data-type="menu"><?php echo Text::_('Menu Item'); ?></a></li>
				<li><a href="#" class="hu-megamenu-cell-options-item" data-type="module"><?php echo Text::_('Module'); ?></a></li>
			</ul>
		</div>
	</div>
</div>
