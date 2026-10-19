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

$badgeText = $cell->type === 'module' ? 'Module' : 'Menu';
?>

<div class="hu-megamenu-cell" data-rowid="<?php echo (int) $rowId; ?>" data-columnid="<?php echo (int) $columnId; ?>" data-cellid="<?php echo (int) $cellId; ?>" data-type="<?php echo $cell->type === 'module' ? 'module' : 'menu_item'; ?>" data-item-id="<?php echo (int) ($cell->item_id ?? 0); ?>">
	<span><?php echo htmlspecialchars((string) $builder->getTitle($cell), ENT_QUOTES, 'UTF-8'); ?></span>
	<small class="hu-badge hu-badge-info hu-megamenu-badge"><?php echo $badgeText; ?></small>
	<button class="hu-btn hu-btn-ghost hu-megamenu-cell-remove">
		<?php echo \HelixUltimate\Framework\Platform\Icon::get('close'); ?>
	</button>
</div>