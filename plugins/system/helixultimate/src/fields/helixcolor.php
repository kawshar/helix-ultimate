<?php
/**
 * @package Helix_Ultimate_Framework
 * @author JoomShaper <support@joomshaper.com>
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

defined('_JEXEC') or die();

use Joomla\CMS\Form\FormField;

/**
 * Colour field for the customizer.
 *
 * Renders a plain text input that the Coloris picker (no jQuery) attaches to.
 * Settings swaps Joomla's `color` fields to this type when it loads the
 * template options, so templates keep using `type="color"` in their XML.
 *
 * @since   2.2.11
 */
class JFormFieldHelixcolor extends FormField
{
	/**
	 * Field type
	 *
	 * @var		string	$type
	 * @since	2.2.11
	 */
	protected $type = 'Helixcolor';

	/**
	 * Render the input.
	 *
	 * @return	string	Field HTML string
	 * @since	2.2.11
	 */
	protected function getInput()
	{
		$value   = (string) $this->value;
		$classes = trim('form-control hu-color-input ' . $this->class);

		// Keep the hex format the old picker produced.
		if ($value !== '' && preg_match('/^[0-9a-f]{3}([0-9a-f]{3})?([0-9a-f]{2})?$/i', $value))
		{
			$value = '#' . $value;
		}

		$attributes = [
			'type'         => 'text',
			'name'         => $this->name,
			'id'           => $this->id,
			'value'        => $value,
			'class'        => $classes,
			'autocomplete' => 'off',
			'spellcheck'   => 'false',
			'data-hu-color' => '',
		];

		if ($this->hint)
		{
			$attributes['placeholder'] = $this->hint;
		}

		if ($this->disabled)
		{
			$attributes['disabled'] = 'disabled';
		}

		if ($this->readonly)
		{
			$attributes['readonly'] = 'readonly';
		}

		$html = '<input';

		foreach ($attributes as $name => $attribute)
		{
			$html .= ' ' . $name . '="' . htmlspecialchars((string) $attribute, ENT_COMPAT, 'UTF-8') . '"';
		}

		return $html . '>';
	}
}
