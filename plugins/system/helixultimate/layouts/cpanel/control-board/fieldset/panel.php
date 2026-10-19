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

extract($displayData);

$fields 	= $form->getFieldset($key);

$activeGroup = isset($fieldset->activegroup) ? $fieldset->activegroup : '';

if (!empty($fields))
{
	$index = 0;

	foreach ($fields as $i => $field)
	{
		$subgroup = $field->getAttribute('helixsubgroup');
		$group = $field->getAttribute('helixgroup') ? $field->getAttribute('helixgroup') : 'no-group';

		if (isset($subgroup))
		{
			$groups[$group]['subgroup-' . $subgroup][] = $field;
		}
		else
		{
			$groups[$group][] = $field;
		}


		$groups[$group]['isActive'] = false;
		$groups[$group]['dependent'] = $field->getAttribute('dependant', '');

		if ($activeGroup === $group)
		{
			$groups[$group]['isActive'] = true;
		}
	}
}

$headerTitle = implode(' ', explode('_', $fieldset->name));

$panelHeadings = ['advance' => 'advanced'];
$headerTitle = isset($panelHeadings[$headerTitle])
	? ucwords($panelHeadings[$headerTitle])
	: ucwords($headerTitle);

?>

<div class="hu-edit-panel <?php echo strtolower($fieldset->name); ?>-panel">
	<div class="hu-panel-header">
		<span class="hu-panel-title"><?php echo $headerTitle; ?></span>
		<?php // Draft status, one slot before Save: a spinner while a change is drafted, then Restore while a draft exists. ?>
		<span class="hu-loading-msg" role="status" style="display: none;">
			<?php echo \HelixUltimate\Framework\Platform\Icon::get('spinner', ['class' => 'hu-spin']); ?>
			<span class="visually-hidden"><?php echo Text::_('HELIX_ULTIMATE_TOPBAR_MSG_DRAFTING'); ?></span>
		</span>
		<button type="button" class="hu-panel-restore action-reset-drafts" title="<?php echo Text::_('HELIX_ULTIMATE_TOPBAR_MSG_RESET_DRAFT'); ?>" aria-label="<?php echo Text::_('HELIX_ULTIMATE_TOPBAR_MSG_RESET_DRAFT'); ?>" style="display: none;">
			<?php echo \HelixUltimate\Framework\Platform\Icon::get('history'); ?>
		</button>
		<?php // Off until something changes; "Saving…" while it saves (helix-ultimate.js). ?>
		<button type="button" class="hu-btn hu-btn-primary hu-panel-save action-save-template" disabled title="<?php echo Text::_('HELIX_ULTIMATE_SAVE_CHANGES'); ?> (Ctrl/⌘ S)">
			<span class="helix-topbar-save-text"><?php echo Text::_('HELIX_ULTIMATE_SAVE_CHANGES'); ?></span>
		</button>
	</div>
	<div class="hu-groups-container">
		<?php echo LayoutHelper::render('cpanel.control-board.fieldset.groups', ['groups' => $groups, 'fieldset_name' => $fieldset->name], HELIX_LAYOUTS_PATH); ?>
	</div>
</div>