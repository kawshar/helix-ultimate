<?php
/**
 * Phase 9: Customizer audit (access control, drafts, XSS).
 *
 * - Menu actions check the menu's own permission (not only com_menus).
 * - Style actions only run on a Helix site style; import drops customizer-only keys.
 * - The media root can't be deleted.
 * - Draft previews compile CSS outside the template's public css folder.
 * - Mega menu settings are sanitized when rendered and when saved from the menu item form.
 * - Embeds use an allowlist; script URLs are refused; author names are escaped.
 * - The admin toaster shows text, never markup.
 *
 * @package Helix_Ultimate_Framework
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

use HelixUltimate\Framework\Platform\Helper;

final class Phase09CustomizerAuditTest
{
	public static function run(): array
	{
		$failures = [];
		$root     = dirname(__DIR__, 2);
		$read     = static fn (string $path): string => (string) @file_get_contents($root . '/' . $path);

		// Menu actions: per-menu permission.
		$response = $read('src/HttpResponse/Response.php');

		foreach (['parentAdoption', 'getMenuItems', 'generateMegaMenuBody'] as $method)
		{
			if (!preg_match('/function ' . $method . '\(\)[\s\S]*?canEditMenuType\(/', $response))
			{
				$failures[] = "Response::{$method} should check the menu's own permission (canEditMenuType).";
			}
		}

		if (!str_contains($response, "client_id') . ' = 0'"))
		{
			$failures[] = 'Response::getItems should only list site menu items.';
		}

		if (str_contains($response, "'<option value=\"' . \$module->id . '\">' . \$module->title"))
		{
			$failures[] = 'Response::generatePopoverContents should escape module titles.';
		}

		// Style actions: Helix site styles only; import drops megamenu_drafts.
		$request = $read('src/Platform/Request.php');

		if (!str_contains($request, 'Helper::isHelixStyle('))
		{
			$failures[] = 'Request should refuse style actions on non-Helix styles.';
		}

		if (!str_contains($request, 'unset($data->megamenu_drafts)'))
		{
			$failures[] = 'importTemplateStyle should drop megamenu_drafts.';
		}

		if (!preg_match("/core\.manage', 'com_installer'\)\)[\s\S]{0,200}saveLicenseInfo/", $request))
		{
			$failures[] = 'saveTemplateStyle should only update the license for installer managers.';
		}

		// Media root.
		if (!str_contains($read('src/Platform/Media.php'), 'resolveMediaPath($path, false)'))
		{
			$failures[] = 'Media::deleteMedia should refuse to delete a media root.';
		}

		// Draft previews never write the public CSS.
		$core = $read('src/Core/HelixUltimate.php');

		if (!str_contains($core, 'helixDraft') || !str_contains($core, "'/preview-'"))
		{
			$failures[] = 'add_scss should compile draft previews into a separate folder.';
		}

		// Mega menu: sanitized on render and on menu item save.
		$menu = $read('src/Core/Classes/HelixultimateMenu.php');

		if (preg_match("/json_decode\([^;]*helixultimatemenulayout/", $menu))
		{
			$failures[] = 'HelixultimateMenu should read mega menu settings through Helper::megaMenuSettings().';
		}

		if (!str_contains($read('helixultimate.php'), "\$typeAlias === 'com_menus.item'"))
		{
			$failures[] = 'onContentBeforeSave should sanitize mega menu settings saved from the menu item form.';
		}

		$mega = Helper::megaMenuSettings(json_encode([
			'megamenu'  => 1,
			'width'     => '1px" onmouseover="alert(1)" x="px',
			'menualign' => 'right" onclick="alert(1)',
			'badge'     => 'R&amp;D <b>x</b>',
			'layout'    => [['attr' => [['colGrid' => '12" onmouseover="alert(1)', 'items' => [['type' => 'x" y="', 'item_id' => '5']]]]]],
		]));

		if (($mega->width ?? '') !== '600px' || ($mega->menualign ?? '') !== 'full')
		{
			$failures[] = 'megaMenuSettings should reject width / alignment payloads.';
		}

		if (($mega->badge ?? '') !== 'R&D x')
		{
			$failures[] = 'megaMenuSettings should keep the badge as plain text (escaped on output).';
		}

		$cell = $mega->layout[0]->attr[0]->items[0] ?? null;

		if (!preg_match('/^\d+$/', (string) ($mega->layout[0]->attr[0]->colGrid ?? '')) || ($cell->type ?? '') !== 'menu_item')
		{
			$failures[] = 'megaMenuSettings should sanitize the layout grid and cell types.';
		}

		// Links and embeds.
		foreach (['javascript:alert(1)', " JaVa\tScript:alert(1)", 'data:text/html,x', 'vbscript:x'] as $url)
		{
			if (Helper::safeUrl($url) !== '')
			{
				$failures[] = 'safeUrl should refuse ' . json_encode($url) . '.';
			}
		}

		if (Helper::safeUrl('https://example.com/?a=1&b=2') !== 'https://example.com/?a=1&amp;b=2')
		{
			$failures[] = 'safeUrl should keep (and escape) web links.';
		}

		$embed = Helper::sanitizeEmbed('<svg onload=alert(1)></svg><iframe srcdoc="<script>x</script>"></iframe><a href="javascript:alert(1)">x</a><iframe src="https://example.com/embed"></iframe>');

		if (preg_match('/<svg|srcdoc|javascript:|<script/i', $embed) || !str_contains($embed, 'src="https://example.com/embed"'))
		{
			$failures[] = 'sanitizeEmbed should keep allowed embeds only (got ' . $embed . ').';
		}

		if (!str_contains($read('src/Platform/Helper.php'), 'InputFilter::ONLY_ALLOW_DEFINED_TAGS'))
		{
			$failures[] = 'sanitizeEmbed should use an allowlist (ONLY_ALLOW_DEFINED_TAGS).';
		}

		// Author names (any user can set their own) are escaped.
		if (!str_contains($read('overrides/layouts/joomla/content/info_block/author.php'), 'htmlspecialchars('))
		{
			$failures[] = 'info_block/author.php should escape the author name.';
		}

		if (str_contains($read('overrides/layouts/joomla/content/blog/author_info.php'), 'alt="<?php echo $author->name; ?>"'))
		{
			$failures[] = 'blog/author_info.php should escape the author name.';
		}

		// Admin toaster: text only.
		$toaster = $read('assets/ts/admin/toaster.ts');

		if (str_contains($toaster, '${message}') || !str_contains($toaster, 'messageElement.textContent'))
		{
			$failures[] = 'The toaster should set its message with textContent.';
		}

		return $failures;
	}
}
