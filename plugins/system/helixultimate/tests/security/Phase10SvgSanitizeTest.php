<?php
/**
 * Phase 10: SVG uploads are stored as cleaned copies (Helper::sanitizeSvg()).
 *
 * Each dangerous sample must be refused, or come back without anything that
 * could run or reach out; a plain icon must survive. Without the bundled
 * sanitizer (enshrined/svg-sanitize) every SVG must be refused.
 *
 * @package Helix_Ultimate_Framework
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

use HelixUltimate\Framework\Platform\Helper;

final class Phase10SvgSanitizeTest
{
	private const DANGEROUS = [
		'script'          => '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect width="4" height="4"/></svg>',
		'onload'          => '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect width="4" height="4"/></svg>',
		'javascript link' => '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="javascript:alert(1)"><rect width="4" height="4"/></a></svg>',
		'encoded link'    => '<svg xmlns="http://www.w3.org/2000/svg"><a href="&#106;avascript:alert(1)"><rect width="4" height="4"/></a></svg>',
		'foreignObject'   => '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><img src="x" onerror="alert(1)"/></body></foreignObject></svg>',
		'xxe'             => '<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg"><text>&x;</text></svg>',
		'billion laughs'  => '<!DOCTYPE l [<!ENTITY a "aaaa"><!ENTITY b "&a;&a;&a;">]><svg xmlns="http://www.w3.org/2000/svg"><text>&b;</text></svg>',
		'animate href'    => '<svg xmlns="http://www.w3.org/2000/svg"><a><animate attributeName="href" values="javascript:alert(1)"/><text y="10">x</text></a></svg>',
		'set onbegin'     => '<svg xmlns="http://www.w3.org/2000/svg"><set attributeName="x" onbegin="alert(1)"/></svg>',
		'css import'      => '<svg xmlns="http://www.w3.org/2000/svg"><style>@import url(https://evil.example/x.css);</style></svg>',
		'remote image'    => '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.example/t.png" width="4" height="4"/></svg>',
		'data html'       => '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==" width="4" height="4"/></svg>',
		'style url'       => '<svg xmlns="http://www.w3.org/2000/svg"><rect style="fill:url(https://evil.example/a)" width="4" height="4"/></svg>',
		'iframe'          => '<svg xmlns="http://www.w3.org/2000/svg"><iframe src="https://evil.example"/></svg>',
		'php'             => '<svg xmlns="http://www.w3.org/2000/svg"><?php echo 1; ?></svg>',
		'html document'   => '<html><body><script>alert(1)</script></body></html>',
		'broken xml'      => '<svg xmlns="http://www.w3.org/2000/svg"><rect',
		'gzip (svgz)'     => "\x1f\x8b\x08\x00",
	];

	public static function run(): array
	{
		$failures = [];
		$leftover = '/<script|\son[a-z]+\s*=|javascript:|foreignObject|<iframe|evil\.example|<!ENTITY|passwd|<\?php|data:text|@import/i';

		foreach (self::DANGEROUS as $name => $svg)
		{
			$clean = Helper::sanitizeSvg($svg);

			if ($clean !== null && preg_match($leftover, html_entity_decode($clean, ENT_QUOTES | ENT_XML1, 'UTF-8')))
			{
				$failures[] = "sanitizeSvg left dangerous content in the \"{$name}\" sample.";
			}
		}

		$icon  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#f00"/></svg>';
		$clean = Helper::sanitizeSvg($icon);

		if (class_exists(\enshrined\svgSanitize\Sanitizer::class))
		{
			if ($clean === null || !str_contains($clean, '<circle'))
			{
				$failures[] = 'sanitizeSvg should keep a plain icon.';
			}
		}
		elseif ($clean !== null)
		{
			$failures[] = 'Without the SVG sanitizer, every SVG must be refused.';
		}

		return $failures;
	}
}
