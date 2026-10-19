<?php
/**
 * @package Helix_Ultimate_Framework
 * @author JoomShaper <support@joomshaper.com>
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

defined('_JEXEC') or die();

use HelixUltimate\Framework\Platform\Helper;
use Joomla\CMS\Uri\Uri;

/**
 * Media field.
 *
 * @since	1.0.0
 */
class HelixultimateFieldMedia
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
		$className = $attr['class'] ?? '';
		$output  = '<div class="control-group ' . $className . '">';
		$output .= '<label>' . $attr['title'] . '</label>';

		if (!empty($attr['desc']))
		{
			$output .= '<span class="hu-help-icon hu-ml-2">' . \HelixUltimate\Framework\Platform\Icon::get('info', ['size' => 14]) . '</span>';
			$output .= '<p class="hu-control-help">' . $attr['desc'] . '</p>';
		}

		$output .= Helper::renderMediaField(
			'',
			['class' => 'hu-input hu-input-media', 'data-attrname' => $key, 'data-baseurl' => Uri::root()],
			['data-target' => $key],
			Uri::root()
		);

		$output .= '</div>';

		return $output;

	}
}
