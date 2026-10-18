<?php
/**
 * @package Helix_Ultimate_Framework
 * @author JoomShaper <support@joomshaper.com>
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

defined('_JEXEC') or die();

use HelixUltimate\Framework\Platform\Helper;
use HelixUltimate\Framework\Platform\Settings;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Router\Route;

extract($displayData);

$sidebar = new Settings;
$exitUrl = Route::_('index.php?option=com_templates&task=style.edit&id=' . (int) $id);
?>

<aside class="hu-sidebar" aria-label="<?php echo Text::_('HELIX_ULTIMATE_CUSTOMIZER'); ?>">
	<div class="hu-sidebar-brand">
		<svg xmlns="http://www.w3.org/2000/svg" class="hu-sidebar-logo" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path fill="#0345BF" fill-rule="evenodd" d="M6.976 15.448c-.039-.814.233-3.568 4.732-5.779 4.5-2.21 4.965-3.995 4.965-3.995-.465 2.444-1.241 3.143-5.508 5.43-4.066 2.182-4.189 4.344-4.189 4.344zM6.976 20.144s.123-2.162 4.19-4.344c4.266-2.288 5.042-2.987 5.507-5.43 0 0-.465 1.785-4.965 3.995-4.499 2.21-4.77 4.964-4.732 5.78z" clip-rule="evenodd"/><path fill="#0345BF" fill-rule="evenodd" d="M12 23.999C5.385 23.999 0 18.616 0 12 0 5.382 5.384 0 12 0c6.618 0 12.002 5.383 12.002 12.001C24.002 18.616 18.617 24 12 24zm0-22.782C6.057 1.217 1.219 6.053 1.219 12c0 5.944 4.838 10.782 10.783 10.782 5.945 0 10.782-4.838 10.782-10.782 0-5.947-4.837-10.783-10.782-10.783z" clip-rule="evenodd"/></svg>
		<span class="hu-version" title="Helix Ultimate <?php echo Helper::getVersion(); ?>"><?php echo Helper::getVersion(); ?></span>
	</div>

	<nav id="hu-options-panel" class="hu-sidebar-nav">
		<?php echo $sidebar->renderBuilderControlBoard(); ?>
	</nav>

	<div class="hu-sidebar-footer">
		<div class="hu-devices" role="group" aria-label="<?php echo Text::_('HELIX_ULTIMATE_PREVIEW_DEVICE'); ?>">
			<button type="button" class="hu-device active" data-device="desktop" title="Desktop" aria-label="Desktop">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" fill="none"><path d="M17.46 12.07c1.196 0 1.79-.578 1.79-1.789V1.79C19.25.57 18.656 0 17.46 0H1.79C.601 0 0 .57 0 1.79v8.491c0 1.211.602 1.79 1.79 1.79h15.67zm-.023-1.023H1.813c-.546 0-.789-.227-.789-.79V1.806c0-.555.243-.79.79-.79h15.624c.547 0 .797.235.797.79v8.453c0 .562-.25.789-.797.789zm-3.125 3.797c.352 0 .633-.29.633-.649a.639.639 0 00-.633-.648H4.915a.645.645 0 00-.64.648c0 .36.288.649.64.649h9.399z"/></svg>
			</button>
			<button type="button" class="hu-device" data-device="tablet" title="Tablet" aria-label="Tablet">
				<svg width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.8056 0C13.7316 0 14.4722 0.761229 14.4722 1.68889V16.0889C14.4722 17.0165 13.7316 17.7778 12.8056 17.7778H1.91667C0.990595 17.7778 0.25 17.0165 0.25 16.0889V1.68889C0.25 0.761229 0.990595 0 1.91667 0H12.8056ZM12.8056 0.888889H1.91667L1.81915 0.895113C1.43579 0.944406 1.13889 1.28052 1.13889 1.68889V16.0889L1.14495 16.1894C1.19297 16.5842 1.52036 16.8889 1.91667 16.8889H12.8056L12.9031 16.8827C13.2864 16.8334 13.5833 16.4973 13.5833 16.0889V1.68889L13.5773 1.58843C13.5292 1.19359 13.2019 0.888889 12.8056 0.888889ZM7.36111 14.2222C7.85178 14.2222 8.25 14.6196 8.25 15.1111C8.25 15.6027 7.85178 16 7.36111 16C6.87044 16 6.47222 15.6027 6.47222 15.1111C6.47222 14.6196 6.87044 14.2222 7.36111 14.2222ZM12.2497 12.4444C12.4909 12.4444 12.6944 12.6434 12.6944 12.8889L12.6873 12.9669C12.6496 13.1704 12.468 13.3333 12.2497 13.3333H2.47253C2.23133 13.3333 2.02778 13.1343 2.02778 12.8889L2.03494 12.8109C2.0726 12.6073 2.25419 12.4444 2.47253 12.4444H12.2497Z"/></svg>
			</button>
			<button type="button" class="hu-device" data-device="mobile" title="Mobile" aria-label="Mobile">
				<svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.99995 0C10.7861 0 11.3611 0.689442 11.3611 1.47778V14.0778C11.3611 14.8661 10.7861 15.5556 9.99995 15.5556H1.83328C1.0471 15.5556 0.472168 14.8661 0.472168 14.0778V1.47778C0.472168 0.689442 1.0471 0 1.83328 0H9.99995ZM9.99995 0.777778H1.83328L1.76014 0.783224C1.47262 0.826355 1.24995 1.12045 1.24995 1.47778V14.0778L1.25449 14.1657C1.29051 14.5112 1.53605 14.7778 1.83328 14.7778H9.99995L10.0731 14.7723C10.3606 14.7292 10.5833 14.4351 10.5833 14.0778V1.47778L10.5787 1.38987C10.5427 1.04439 10.2972 0.777778 9.99995 0.777778ZM5.91661 11.6667C6.34595 11.6667 6.69439 12.0143 6.69439 12.4444C6.69439 12.8746 6.34595 13.2222 5.91661 13.2222C5.48728 13.2222 5.13883 12.8746 5.13883 12.4444C5.13883 12.0143 5.48728 11.6667 5.91661 11.6667ZM7.09068 2.33333C7.3049 2.33333 7.47217 2.50744 7.47217 2.72222L7.46442 2.79879C7.42885 2.973 7.27504 3.11111 7.09068 3.11111H4.74254C4.52832 3.11111 4.36106 2.937 4.36106 2.72222L4.36881 2.64565C4.40438 2.47145 4.55819 2.33333 4.74254 2.33333H7.09068Z"/></svg>
			</button>
		</div>

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

		<a class="hu-sidebar-exit" href="<?php echo $exitUrl; ?>" title="<?php echo Text::_('HELIX_ULTIMATE_CLOSE_CUSTOMIZER'); ?>">
			<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" aria-hidden="true"><path d="M11.414 11.411a.566.566 0 000-.797L6.586 5.786 11.414.958a.566.566 0 000-.797.58.58 0 00-.797 0L5.79 4.99.961.161a.573.573 0 00-.797 0 .566.566 0 000 .797l4.828 4.828-4.828 4.828a.566.566 0 000 .797.566.566 0 00.797 0l4.828-4.828 4.828 4.828a.559.559 0 00.797 0z" transform="scale(.83)"/></svg>
			<span class="visually-hidden"><?php echo Text::_('JTOOLBAR_CLOSE'); ?></span>
		</a>
	</div>
</aside>
