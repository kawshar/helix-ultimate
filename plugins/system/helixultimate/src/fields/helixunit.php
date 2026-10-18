<?php
/**
 * @package Helix_Ultimate_Framework
 * @author JoomShaper <support@joomshaper.com>
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

defined('_JEXEC') or die();

use HelixUltimate\Framework\Platform\Helper;
use Joomla\CMS\Form\FormField;
/**
 * Form field for helix presets.
 *
 * @since	2.0.0
 */
class JFormFieldHelixUnit extends FormField
{
	/**
	 * Field type
	 *
	 * @var		string	$type
	 * @since	2.0.0
	 */
	protected $type = 'HelixUnit';

	/**
	 * Override getInput function form FormField
	 *
	 * @return	string	Field HTML string
	 * @since	2.0.0
	 */
	protected function getInput()
	{
		// Optional keywords without a number, e.g. keywords="auto".
		$keywords = array_filter(array_map('trim', explode(',', strtolower((string) $this->getAttribute('keywords', '')))));

		return Helper::renderUnitField($this->name, $this->value, [
			'keywords'   => $keywords,
			'hint'       => $this->getAttribute('hint', '', 'STRING'),
			'inputClass' => $this->name,
		]);
	}
}
