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

$sidebarLayout = new FileLayout('megaMenu.sidebar', HELIX_LAYOUT_PATH);
$gridLayout = new FileLayout('megaMenu.grid', HELIX_LAYOUT_PATH);
$settings = $builder->getMegaMenuSettings();

if (!class_exists('MegaFields'))
{
    require_once __DIR__ . '/megaFields.php';
}

?>

<div class="hu-megamenu-container hu-d-flex hu-justify-content-between">
	<?php echo $sidebarLayout->render(['itemId' => $itemId, 'builder' => $builder, 'settings' => $settings]); ?>
	<?php echo $gridLayout->render(['itemId' => $itemId, 'builder' => $builder, 'settings' => $settings]); ?>
	<?php // Module / menu item picker: a dropdown anchored to the column's add button (megamenu.js). ?>
	<div class="hu-megamenu-popover" role="dialog" aria-label="<?php echo htmlspecialchars(Text::_('HELIX_ULTIMATE_MENU_MODULE_LIST'), ENT_QUOTES, 'UTF-8'); ?>">
		<div class="hu-megamenu-search-wrapper">
			<span class="fas fa-search" aria-hidden="true"></span>
			<input type="search" class="hu-input hu-megamenu-module-search" placeholder="<?php echo htmlspecialchars(Text::_('HELIX_ULTIMATE_SEARCH_ITEM'), ENT_QUOTES, 'UTF-8'); ?>" autocomplete="off" aria-label="<?php echo htmlspecialchars(Text::_('HELIX_ULTIMATE_SEARCH_ITEM'), ENT_QUOTES, 'UTF-8'); ?>" />
		</div>
		<div class="hu-megamenu-modules-container"></div>
	</div>
	<input type="hidden" id="hu-megamenu-layout-settings" value="<?php echo htmlspecialchars(json_encode($settings), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); ?>" />
	<input type="hidden" id="hu-base-url" value="<?php echo Uri::root(); ?>" />
	<input type="hidden" id="hu-menu-itemid" value="<?php echo $itemId; ?>" />
</div>