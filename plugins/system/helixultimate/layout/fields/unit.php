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

/**
 * Measurement unit field.
 *
 * @since	 2.0.0
 */
class HelixultimateFieldUnit
{
	/**
	 * Get input for the field.
	 *
	 * @param	string	$key
	 * @param	array	$attr
	 *
	 * @return	string
	 * @since	1.0.0
	 */
	public static function getInput($key, $attr)
	{
		$attributes = (isset($attr['placeholder']) && $attr['placeholder']) ? 'placeholder="' . $attr['placeholder'] . '"' : '';
		$className = $attr['class'] ?? '';

		$depend = isset($attr['depend']) ? $attr['depend'] : false;
		$dataAttrs = '';
		$dataShowon = '';
		$internal = !empty($attr['internal']) ? ' internal-use-only' : '';

		if ($depend)
		{
			$showon = Settings::parseShowOnConditions($attr['depend']);
			$dataShowon = ' data-revealon=\'' . json_encode($showon) . '\' ';
		}

		if (!empty($attr['data']))
		{
			foreach ($attr['data'] as $dataName => $dataValue)
			{
				$dataAttrs .= ' data-' . $dataName . '=' . $dataValue;
			}
		}

		$output  = '<div class="control-group ' . $className . '" ' . $dataShowon . ' >';
		$output .= '<label>' . $attr['title'] . '</label>';

		if (!empty($attr['desc']))
		{
			$output .= '<span class="hu-help-icon hu-ml-2">' . \HelixUltimate\Framework\Platform\Icon::get('info', ['size' => 14]) . '</span>';
			$output .= '<p class="hu-control-help">' . $attr['desc'] . '</p>';
		}

		// Same number + unit control as the template settings (fields.js drives it).
		$output .= Helper::renderUnitField($key, $attr['value'] ?? '', ['inputClass' => $key]);

		// End of control group
		$output .= '</div>';

		return $output;
	}

}
