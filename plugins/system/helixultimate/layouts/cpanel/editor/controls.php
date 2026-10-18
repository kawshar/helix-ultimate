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
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M13 8H3.5M7.5 3.5L3 8l4.5 4.5"/></svg>
			<span class="visually-hidden"><?php echo Text::_('HELIX_ULTIMATE_CLOSE_CUSTOMIZER'); ?></span>
		</a>
	</div>

	<nav id="hu-options-panel" class="hu-sidebar-nav">
		<?php echo $sidebar->renderBuilderControlBoard(); ?>
	</nav>

	<?php // The preview device switches sit on the settings that have a value per device (helix-ultimate.js). ?>
	<div class="hu-sidebar-footer">
		<div class="hu-response" aria-live="polite">
			<div class="hu-loading-msg">
				<div class="spinner-border spinner-border-sm" role="status">
					<span class="visually-hidden">Drafting...</span>
				</div>
				<span class="hu-response-msg visually-hidden"><?php echo Text::_('HELIX_ULTIMATE_TOPBAR_MSG_DRAFTING'); ?></span>
			</div>

			<div class="hu-done-msg">
				<span class="fas fa-check-circle" aria-hidden="true"></span> <span class="hu-response-msg visually-hidden"><span class="hu-msg"><?php echo Text::_('HELIX_ULTIMATE_TOPBAR_MSG_DRAFTED'); ?></span></span>
			</div>

			<button type="button" role="button" class="hu-btn hu-btn-reset action-reset-drafts" title="<?php echo Text::_('HELIX_ULTIMATE_TOPBAR_MSG_RESET_DRAFT'); ?>">
				<span class="fas fa-history" aria-hidden="true"></span>
				<span class="visually-hidden"><?php echo Text::_('HELIX_ULTIMATE_TOPBAR_MSG_RESET_DRAFT'); ?></span>
			</button>
		</div>
	</div>
</aside>
