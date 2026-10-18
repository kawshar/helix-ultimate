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
use Joomla\CMS\Form\FormField;

/**
 * Form field for Helix media
 *
 * @since	 1.0.0
 */
class JFormFieldHelixmedia extends FormField
{
	/**
	 * Field type
	 *
	 * @var		string	$type
	 * @since	1.0.0
	 */
	protected $type = 'Helixmedia';

	/**
	 * Override getInput function form FormField
	 *
	 * @return	string	Field HTML string
	 * @since	1.0.0
	 */
	public function getInput()
	{
		return Helper::renderMediaField(
			(string) $this->value,
			['name' => $this->name, 'id' => $this->id],
			['data-id' => $this->id],
			Uri::root()
		);
	}
}

