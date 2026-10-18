<?php
/**
 * @package Helix_Ultimate_Framework
 * @author JoomShaper <support@joomshaper.com>
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

defined('_JEXEC') or die();

use HelixUltimate\Framework\Platform\Helper;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\FileLayout;
use Joomla\CMS\Uri\Uri;

extract($displayData);

$modules = Helper::getModules($keyword);
$children = $children  ?? [];
?>

<?php
$e = function ($value) {
	return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
};
?>
<?php // Two lists, filtered in the browser by the search field above (megamenu.js). ?>
<div class="hu-mm-picker-tabs" role="tablist">
	<button type="button" class="hu-mm-picker-tab is-active" role="tab" aria-selected="true" data-list="module">
		<?php echo Text::_('HELIX_ULTIMATE_MODULES'); ?>
	</button>
	<button type="button" class="hu-mm-picker-tab" role="tab" aria-selected="false" data-list="menu">
		<?php echo Text::_('HELIX_ULTIMATE_MENU_ITEMS'); ?>
	</button>
</div>

<ul class="hu-mm-picker-list" role="listbox" data-list="module" aria-label="<?php echo $e(Text::_('HELIX_ULTIMATE_MODULES')); ?>">
	<?php foreach ($modules as $module): ?>
		<li class="hu-mm-picker-option hu-megamenu-insert-module" role="option" tabindex="-1" data-module="<?php echo (int) $module->id; ?>">
			<span class="hu-mm-picker-title"><?php echo $e($module->title); ?></span>
			<?php if (!empty($module->position)): ?>
				<span class="hu-mm-picker-meta"><?php echo $e($module->position); ?></span>
			<?php endif ?>
		</li>
	<?php endforeach ?>
	<li class="hu-mm-picker-empty" role="presentation"<?php echo empty($modules) ? '' : ' hidden'; ?>><?php echo Text::_('HELIX_ULTIMATE_NOTHING_FOUND'); ?></li>
</ul>

<ul class="hu-mm-picker-list" role="listbox" data-list="menu" aria-label="<?php echo $e(Text::_('HELIX_ULTIMATE_MENU_ITEMS')); ?>" hidden>
	<?php foreach ($children as $child): ?>
		<li class="hu-mm-picker-option hu-megamenu-insert-menu" role="option" tabindex="-1" data-child="<?php echo (int) $child->id; ?>">
			<span class="hu-mm-picker-title"><?php echo $e($child->title); ?></span>
		</li>
	<?php endforeach ?>
	<li class="hu-mm-picker-empty" role="presentation"<?php echo empty($children) ? '' : ' hidden'; ?>><?php echo Text::_('HELIX_ULTIMATE_NOTHING_FOUND'); ?></li>
</ul>
