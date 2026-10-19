<?php
/**
 * @package Helix_Ultimate_Framework
 * @author JoomShaper <support@joomshaper.com>
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

defined('_JEXEC') or die();

use HelixUltimate\Framework\Platform\Settings;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Router\Route;

extract($displayData);

$sidebar = new Settings;
$exitUrl = Route::_('index.php?option=com_templates&task=style.edit&id=' . (int) $id);
?>

<aside class="hu-sidebar" aria-label="<?php echo Text::_('HELIX_ULTIMATE_CUSTOMIZER'); ?>">
	<?php // Back to the template style. The Helix logo sits in each panel's title (see _panel.scss). ?>
	<div class="hu-sidebar-brand">
		<a class="hu-sidebar-back" href="<?php echo $exitUrl; ?>" title="<?php echo Text::_('HELIX_ULTIMATE_CLOSE_CUSTOMIZER'); ?>">
			<?php echo \HelixUltimate\Framework\Platform\Icon::get('exit', ['size' => 18]); ?>
			<span class="visually-hidden"><?php echo Text::_('HELIX_ULTIMATE_CLOSE_CUSTOMIZER'); ?></span>
		</a>
	</div>

	<nav id="hu-options-panel" class="hu-sidebar-nav">
		<?php echo $sidebar->renderBuilderControlBoard(); ?>
	</nav>
</aside>
