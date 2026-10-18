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
use Joomla\CMS\Uri\Uri;

extract($displayData);

// Preset layouts; each preview is drawn from its own numbers (bars in a 12-column grid).
// Any other split is made by dragging the handles between a row's columns.
$grids = ['12', '6+6', '4+4+4', '3+3+3+3', '4+8', '3+9', '3+6+3', '2+6+4', '2+10', '5+7', '2+3+7'];

$preview = function (string $grid): string {
	$bars = array_map(function ($col) {
		return '<i style="flex: ' . (int) $col . ' 1 0"></i>';
	}, explode('+', $grid));

	return '<span class="hu-layout-preview" aria-hidden="true">' . implode('', $bars) . '</span>';
};

?>
<div class="hu-megamenu-columns-layout">
	<div class="hu-megamenu-layout-options">
		<?php foreach ($grids as $grid): ?>
			<a href="#" class="hu-megamenu-column-layout" data-layout="<?php echo $grid; ?>">
				<?php echo $preview($grid); ?>
				<span class="hu-megamenu-column-layout-name"><?php echo $grid; ?></span>
			</a>
		<?php endforeach ?>
	</div>
</div>
