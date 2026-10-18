<?php
/**
 * @package Helix_Ultimate_Framework
 * @author JoomShaper <support@joomshaper.com>
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

defined('_JEXEC') or die();

use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Uri\Uri;

extract($displayData);


$iconsrc = Uri::root() . "plugins/system/helixultimate/assets/images/icons/{$fieldset->name}.svg";

?>
<div class="hu-fieldset hu-fieldset-<?php echo $fieldset->name; ?>">
	<div class="hu-fieldset-header" data-fieldset="<?php echo strtolower($fieldset->name); ?>" title="<?php echo htmlspecialchars(Text::_($fieldset->label), ENT_QUOTES, 'UTF-8'); ?>">
		<div class="hu-fieldset-header-inner">
			<span class="hu-option-icon" style="--hu-icon: url('<?php echo $iconsrc; ?>');" aria-hidden="true"></span>
			<span class="hu-option-title"><?php echo Text::_($fieldset->label); ?></span>
		</div>
	</div>
</div>