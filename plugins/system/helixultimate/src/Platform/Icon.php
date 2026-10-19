<?php
/**
 * @package Helix_Ultimate_Framework
 * @author JoomShaper <support@joomshaper.com>
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

namespace HelixUltimate\Framework\Platform;

defined('_JEXEC') or die();

/**
 * The customizer's icons: one outline set (16px grid, 1.5px stroke, round caps)
 * drawn in the text colour, so they follow hover / active colours like text.
 *
 * PHP prints them with Icon::get(); the admin scripts get the same set through
 * the `hu-icons` script options (Joomla.utils.icon()), so both draw the same SVG.
 *
 * @since	2.2.11
 */
class Icon
{
	/**
	 * Inner SVG markup per icon, on a 16 x 16 grid.
	 *
	 * @var	array<string, string>
	 */
	private const PATHS = [
		'info'           => '<circle cx="8" cy="8" r="6.25"/><path d="M8 7.25V11M8 5h.01"/>',
		'close'          => '<path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/>',
		'close-circle'   => '<circle cx="8" cy="8" r="6.25"/><path d="M6 6l4 4M10 6l-4 4"/>',
		'plus'           => '<path d="M8 3.5v9M3.5 8h9"/>',
		'minus'          => '<path d="M3.5 8h9"/>',
		'check'          => '<path d="M3.5 8.5l3 3 6-7"/>',
		'check-circle'   => '<circle cx="8" cy="8" r="6.25"/><path d="M5.5 8.25l1.75 1.75 3.25-3.75"/>',
		'pen'            => '<path d="M10.75 2.75l2.5 2.5L6 12.5l-3.25.75L3.5 10z"/><path d="M9.25 4.25l2.5 2.5"/>',
		'trash'          => '<path d="M2.75 4.25h10.5M6.25 4.25V2.75h3.5v1.5M4.25 4.25l.6 8.4a1 1 0 0 0 1 .85h4.3a1 1 0 0 0 1-.85l.6-8.4M6.75 7v4M9.25 7v4"/>',
		'chevron-right'  => '<path d="M6 3.5L10.5 8 6 12.5"/>',
		'chevron-down'   => '<path d="M3.5 6L8 10.5 12.5 6"/>',
		'search'         => '<circle cx="7" cy="7" r="4.25"/><path d="M10.25 10.25l3 3"/>',
		'upload'         => '<path d="M8 10.5V2.75M4.75 6L8 2.75 11.25 6M2.75 10.5v1.75a1 1 0 0 0 1 1h8.5a1 1 0 0 0 1-1V10.5"/>',
		'download'       => '<path d="M8 2.75v7.75M4.75 7.25L8 10.5l3.25-3.25M2.75 10.5v1.75a1 1 0 0 0 1 1h8.5a1 1 0 0 0 1-1V10.5"/>',
		'image'          => '<rect x="2.25" y="2.75" width="11.5" height="10.5" rx="1.5"/><circle cx="5.75" cy="6.25" r="1"/><path d="M13.75 10.5l-3.25-3.25L3.5 13.25"/>',
		'history'        => '<path d="M2.75 8a5.25 5.25 0 1 0 1.55-3.7L2.75 5.75"/><path d="M2.75 2.75v3h3M8 5.25V8l2 1.5"/>',
		'refresh'        => '<path d="M13.25 8a5.25 5.25 0 0 1-9.4 3.2M2.75 8a5.25 5.25 0 0 1 9.4-3.2"/><path d="M12.25 2.25V5h-2.75M3.75 13.75V11H6.5"/>',
		'spinner'        => '<path d="M8 2.25a5.75 5.75 0 1 0 5.75 5.75"/>',
		'align-left'     => '<path d="M2.75 4h10.5M2.75 8h7M2.75 12h9"/>',
		'align-center'   => '<path d="M2.75 4h10.5M4.5 8h7M3.5 12h9"/>',
		'align-right'    => '<path d="M2.75 4h10.5M6.25 8h7M4.25 12h9"/>',
		'align-justify'  => '<path d="M2.75 4h10.5M2.75 8h10.5M2.75 12h10.5"/>',
		'underline'      => '<path d="M4.75 2.75v4.5a3.25 3.25 0 0 0 6.5 0v-4.5M3.75 13.25h8.5"/>',
		'strikethrough'  => '<path d="M2.75 8h10.5M10.75 4.25A2.75 2.75 0 0 0 8.25 2.75h-.5a2.5 2.5 0 0 0-1.5 4.5M5.25 11.25a2.75 2.75 0 0 0 2.5 2h.5a2.5 2.5 0 0 0 2.5-2.25"/>',
		'overline'       => '<path d="M3.75 2.75h8.5"/><circle cx="8" cy="9.25" r="3.75"/>',
		'columns'        => '<rect x="2.25" y="2.75" width="11.5" height="10.5" rx="1.5"/><path d="M6.25 2.75v10.5M9.75 2.75v10.5"/>',
		'settings'       => '<path d="M2.75 4.5h6.5M12 4.5h1.25M2.75 11.5h1.5M7 11.5h6.25"/><circle cx="10.5" cy="4.5" r="1.5"/><circle cx="5.5" cy="11.5" r="1.5"/>',
		'eye-off'        => '<path d="M2.5 2.5l11 11M6.6 4.3A6.4 6.4 0 0 1 8 4.25c3.5 0 5.5 3 5.75 3.75-.15.45-.7 1.4-1.6 2.25M9.8 11.5A6 6 0 0 1 8 11.75C4.5 11.75 2.5 8.75 2.25 8c.2-.55.95-1.75 2.15-2.7"/><path d="M6.75 6.85a1.75 1.75 0 0 0 2.4 2.4"/>',
		'brush'          => '<path d="M13.25 2.75L8 8"/><path d="M8.25 7.75l-.9-.9a2 2 0 0 0-2.85 0C3 8.35 4 10.25 2.75 11.5c1.5 1.25 4.25 1.25 5.5 0a2 2 0 0 0 0-2.85z"/>',
		'devices'        => '<rect x="2.25" y="3.25" width="9" height="6.5" rx="1"/><path d="M4.75 12.75h4"/><rect x="11.25" y="6.25" width="2.5" height="6.5" rx=".75"/>',
		'grid'           => '<rect x="2.75" y="2.75" width="4.25" height="4.25" rx="1"/><rect x="9" y="2.75" width="4.25" height="4.25" rx="1"/><rect x="2.75" y="9" width="4.25" height="4.25" rx="1"/><rect x="9" y="9" width="4.25" height="4.25" rx="1"/>',
		'eraser'         => '<path d="M6.5 13.25h6.75M3.6 10.4l5.65-5.65a1.5 1.5 0 0 1 2.1 0l1.55 1.55a1.5 1.5 0 0 1 0 2.1L8.4 12.9a1.5 1.5 0 0 1-1.05.35H5.8a1.5 1.5 0 0 1-1.05-.45l-1.15-1.15a.9.9 0 0 1 0-1.25z"/><path d="M6.25 7.75l3.5 3.5"/>',
		'menu'           => '<path d="M2.75 4h10.5M2.75 8h10.5M2.75 12h10.5"/>',
		// Leave (the customizer): a door on the right, the arrow heading out to the left.
		'exit'           => '<path d="M9.75 2.75h2.5a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1h-2.5M10.25 8H2.75M5.5 5.25L2.75 8l2.75 2.75"/>',
		// Sorting: up / down for lists that reorder vertically, left / right for columns.
		'sort'           => '<path d="M5 6l3-3 3 3M5 10l3 3 3-3"/>',
		'sort-horizontal'=> '<path d="M6 5L3 8l3 3M10 5l3 3-3 3"/>',
	];

	/**
	 * An icon as inline SVG.
	 *
	 * @param	string	$name	Icon name (see PATHS).
	 * @param	array	$attrs	Extra attributes: class (appended), width / height (default 16), and any other.
	 *
	 * @return	string
	 */
	public static function get(string $name, array $attrs = []): string
	{
		if (!isset(self::PATHS[$name]))
		{
			return '';
		}

		$size  = (int) ($attrs['size'] ?? 16);
		$class = trim('hu-icon hu-icon-' . $name . ' ' . ($attrs['class'] ?? ''));

		unset($attrs['size'], $attrs['class']);

		$extra = '';

		foreach ($attrs as $key => $value)
		{
			$extra .= ' ' . htmlspecialchars($key, ENT_QUOTES, 'UTF-8') . '="' . htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8') . '"';
		}

		return '<svg class="' . htmlspecialchars($class, ENT_QUOTES, 'UTF-8') . '" viewBox="0 0 16 16" width="' . $size . '" height="' . $size
			. '" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"'
			. $extra . '>' . self::PATHS[$name] . '</svg>';
	}

	/**
	 * Font Awesome names that existing language strings still contain, and the icon each becomes.
	 *
	 * @var	array<string, string>
	 */
	private const FONT_AWESOME = [
		'sliders-h' => 'settings', 'paint-brush' => 'brush', 'laptop' => 'devices', 'th' => 'grid', 'sync' => 'refresh',
		'eraser' => 'eraser', 'bars' => 'menu', 'images' => 'image', 'image' => 'image', 'info-circle' => 'info',
		'times' => 'close', 'plus' => 'plus', 'check' => 'check',
	];

	/**
	 * Swap the Font Awesome markup inside a translated string (e.g. "<span class='fas fa-sync'></span> Update")
	 * for the matching icon. Language strings cannot change, so they are converted where they are printed.
	 * Unknown icons are left as they are.
	 *
	 * @param	string	$html	The translated text.
	 *
	 * @return	string
	 */
	public static function replaceFontAwesome(string $html): string
	{
		return preg_replace_callback(
			'#<(span|i)\s+class=["\']fa[srb]?\s+fa-([a-z0-9-]+)[^"\']*["\'][^>]*>\s*</\1>#i',
			static function ($match) {
				$name = self::FONT_AWESOME[strtolower($match[2])] ?? null;

				return $name ? self::get($name) : $match[0];
			},
			$html
		);
	}

	/**
	 * Every icon's inner markup, for the admin scripts.
	 *
	 * @return	array<string, string>
	 */
	public static function all(): array
	{
		return self::PATHS;
	}
}
