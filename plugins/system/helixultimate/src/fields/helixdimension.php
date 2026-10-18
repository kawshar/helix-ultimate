<?php
/**
 * @package Helix_Ultimate_Framework
 * @author JoomShaper <support@joomshaper.com>
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

use Joomla\CMS\Form\FormField;
use Joomla\CMS\Language\Text;

defined('_JEXEC') or die();

/**
 * Form field for Helix dimension.
 *
 * @since	2.0.0
 */
class JFormFieldHelixdimension extends FormField
{
	/**
	 * Field type
	 *
	 * @var		string	$type
	 * @since	2.0.0
	 */
	protected $type = 'Helixdimension';

	/**
	 * Override getInput function form FormField
	 *
	 * @return	string	Field HTML string
	 * @since	2.0.0
	 */
	public function getInput()
	{
		$parts = explode('x', strtolower((string) $this->value)) + ['', ''];
		$width  = htmlspecialchars(trim($parts[0]), ENT_QUOTES, 'UTF-8');
		$height = htmlspecialchars(trim($parts[1]), ENT_QUOTES, 'UTF-8');
		$label  = htmlspecialchars(Text::_($this->getAttribute('label', '')), ENT_QUOTES, 'UTF-8');

		// One compact control: [width] × [height]. Sizes are always px, so no unit is shown.
		$output = '<div class="hu-dimension">';
		$output .= '<input type="text" inputmode="numeric" class="hu-field-dimension-width form-control" value="' . $width . '" aria-label="' . $label . ': ' . Text::_('HELIX_ULTIMATE_DIMENSION_WIDTH') . '" />';
		$output .= '<span class="hu-dimension-x" aria-hidden="true">&times;</span>';
		$output .= '<input type="text" inputmode="numeric" class="hu-field-dimension-height form-control" value="' . $height . '" aria-label="' . $label . ': ' . Text::_('HELIX_ULTIMATE_DIMENSION_HEIGHT') . '" />';
		$output .= '</div>';

		$output .= '<input type="hidden" name="' . $this->name . '" id="' . $this->id . '" class="hu-field-dimension-input ' . $this->class . '" value="' . htmlspecialchars((string) $this->value, ENT_QUOTES, 'UTF-8') . '" />';

		return $output;
	}
}
