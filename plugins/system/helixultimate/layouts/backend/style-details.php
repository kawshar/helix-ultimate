<?php
/**
 * @package Helix Ultimate Framework
 * @author JoomShaper https://www.joomshaper.com
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
*/

defined('_JEXEC') or die();

use Joomla\CMS\Language\Text;

/** @var array $displayData */
$d    = $displayData;
$urls = $d['urls'];
$e    = static fn ($value) => htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');

$failedChecks = array_filter($d['checks'], static fn ($check) => !$check['ok']);

$stats = [
	'HELIX_ULTIMATE_DASH_STAT_PAGES'     => $d['isDefault'] && !$d['assignedCount'] ? Text::_('JALL') : (int) $d['assignedCount'],
	'HELIX_ULTIMATE_DASH_STAT_ROWS'      => (int) $d['rows'],
	'HELIX_ULTIMATE_DASH_STAT_MODULES'   => (int) $d['moduleCount'],
	'HELIX_ULTIMATE_DASH_STAT_OVERRIDES' => (int) $d['overrides'],
];

$actions = [
	['icon' => 'icon-menu', 'label' => 'HELIX_ULTIMATE_DASH_ACTION_ASSIGN', 'attr' => 'data-hu-tab="assignment"'],
	['icon' => 'icon-copy', 'label' => 'HELIX_ULTIMATE_DASH_ACTION_DUPLICATE', 'attr' => 'data-hu-duplicate'],
	['icon' => 'icon-th-large', 'label' => 'HELIX_ULTIMATE_DASH_ACTION_POSITIONS', 'url' => $d['positionsPreview'] ? $urls['positions'] : $urls['templatesConfig'], 'external' => $d['positionsPreview'], 'hint' => $d['positionsPreview'] ? '' : 'HELIX_ULTIMATE_DASH_ACTION_POSITIONS_HINT'],
	['icon' => 'icon-cube', 'label' => 'HELIX_ULTIMATE_DASH_ACTION_MODULES', 'url' => $urls['modules']],
	['icon' => 'icon-trash', 'label' => 'HELIX_ULTIMATE_DASH_ACTION_CACHE', 'url' => $urls['cache']],
	['icon' => 'icon-refresh', 'label' => 'HELIX_ULTIMATE_DASH_ACTION_UPDATES', 'url' => $urls['updates']],
];

$resources = [
	'HELIX_ULTIMATE_DASH_RES_DOCS'     => 'https://www.joomshaper.com/documentation/helix-framework/helix-ultimate-2',
	'HELIX_ULTIMATE_DASH_RES_VIDEOS'   => 'https://www.youtube.com/@JoomShaper',
	'HELIX_ULTIMATE_DASH_RES_FORUM'    => 'https://www.joomshaper.com/forum',
	'HELIX_ULTIMATE_DASH_RES_RELEASES' => 'https://github.com/JoomShaper/helix-ultimate/releases',
];
?>
<div class="hu-dash" data-hu-dash
	data-duplicate-url="<?php echo $e($urls['styles']); ?>"
	data-style-id="<?php echo (int) $d['id']; ?>"
	data-token="<?php echo $e($d['token']); ?>"
	data-confirm-duplicate="<?php echo $e(Text::_('HELIX_ULTIMATE_DASH_CONFIRM_DUPLICATE')); ?>">

	<header class="hu-dash-head">
		<div class="hu-dash-head__title">
			<h2><?php echo $e($d['name']); ?></h2>
			<?php if ($d['isDefault']) : ?>
				<span class="hu-dash-tag">
					<span class="icon-home" aria-hidden="true"></span>
					<?php echo $d['homeLanguage'] ? Text::sprintf('HELIX_ULTIMATE_DASH_DEFAULT_FOR', $e($d['homeLanguage'])) : Text::_('JDEFAULT'); ?>
				</span>
			<?php endif; ?>
		</div>

		<?php if ($d['description']) : ?>
			<p class="hu-dash-head__desc"><?php echo $e(strip_tags($d['description'])); ?></p>
		<?php endif; ?>

		<p class="hu-dash-meta">
			<span><?php echo Text::_('HELIX_ULTIMATE_DASH_TEMPLATE'); ?> <strong><?php echo $e($d['templateVersion']); ?></strong></span>
			<span><?php echo Text::_('HELIX_ULTIMATE_DASH_FRAMEWORK'); ?> <strong><?php echo $e($d['frameworkVersion']); ?></strong></span>
			<span>Joomla <strong><?php echo $e($d['joomlaVersion']); ?></strong></span>
			<span>PHP <strong><?php echo $e($d['phpVersion']); ?></strong></span>
		</p>

		<div class="hu-dash-head__actions">
			<a href="<?php echo $e($urls['options']); ?>" class="btn btn-primary">
				<span class="icon-options" aria-hidden="true"></span>
				<?php echo Text::_('HELIX_ULTIMATE_DASH_OPEN_OPTIONS'); ?>
			</a>
			<a href="<?php echo $e($urls['preview']); ?>" class="btn btn-outline-secondary" target="_blank" rel="noopener">
				<span class="icon-eye" aria-hidden="true"></span>
				<?php echo Text::_('HELIX_ULTIMATE_DASH_PREVIEW'); ?>
				<span class="visually-hidden"><?php echo Text::_('JBROWSERTARGET_NEW'); ?></span>
			</a>
			<?php if ($urls['files']) : ?>
				<a href="<?php echo $e($urls['files']); ?>" class="btn btn-outline-secondary">
					<span class="icon-code" aria-hidden="true"></span>
					<?php echo Text::_('HELIX_ULTIMATE_DASH_EDIT_FILES'); ?>
				</a>
			<?php endif; ?>
		</div>
	</header>

	<?php if ($d['panels']) : ?>
		<section class="hu-dash-section">
			<div class="hu-dash-section__head">
				<h3 class="hu-dash-section__title"><?php echo Text::_('HELIX_ULTIMATE_DASH_CUSTOMIZE'); ?></h3>
				<label class="hu-dash-jump">
					<span class="visually-hidden"><?php echo Text::_('HELIX_ULTIMATE_DASH_JUMP'); ?></span>
					<select class="form-select form-select-sm" data-hu-jump>
						<option value=""><?php echo Text::_('HELIX_ULTIMATE_DASH_JUMP'); ?></option>
						<?php foreach ($d['panels'] as $panel) : ?>
							<?php if ($panel['groups']) : ?>
								<optgroup label="<?php echo $e($panel['label']); ?>">
									<?php foreach ($panel['groups'] as $group) : ?>
										<option value="<?php echo $e($group['url']); ?>"><?php echo $e($group['label']); ?></option>
									<?php endforeach; ?>
								</optgroup>
							<?php endif; ?>
						<?php endforeach; ?>
					</select>
				</label>
			</div>
			<ul class="hu-dash-panels">
				<?php foreach ($d['panels'] as $panel) : ?>
					<li>
						<a class="hu-dash-panel" href="<?php echo $e($panel['url']); ?>">
							<img src="<?php echo $e($panel['icon']); ?>" alt="" width="18" height="18">
							<?php echo $e($panel['label']); ?>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>
		</section>
	<?php endif; ?>

	<dl class="hu-dash-stats">
		<?php foreach ($stats as $label => $value) : ?>
			<div class="hu-dash-stat">
				<dt><?php echo Text::_($label); ?></dt>
				<dd><?php echo $e($value); ?></dd>
			</div>
		<?php endforeach; ?>
	</dl>

	<?php if ($failedChecks) : ?>
		<ul class="hu-dash-issues">
			<?php foreach ($failedChecks as $check) : ?>
				<li class="hu-dash-issue is-<?php echo $e($check['level']); ?>">
					<span class="<?php echo $check['level'] === 'info' ? 'icon-info-circle' : 'icon-warning'; ?>" aria-hidden="true"></span>
					<span><strong><?php echo $check['label']; ?>:</strong> <?php echo $e($check['detail']); ?></span>
					<?php if (!empty($check['link'])) : ?>
						<a href="<?php echo $e($check['link']); ?>"><?php echo Text::_('HELIX_ULTIMATE_DASH_FIX'); ?></a>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ul>
	<?php else : ?>
		<p class="hu-dash-ok">
			<span class="icon-check" aria-hidden="true"></span>
			<?php echo Text::sprintf('HELIX_ULTIMATE_DASH_ALL_PASSED', count($d['checks'])); ?>
		</p>
	<?php endif; ?>

	<section class="hu-dash-section">
		<h3 class="hu-dash-section__title"><?php echo Text::_('HELIX_ULTIMATE_DASH_QUICK_ACTIONS'); ?></h3>
		<div class="hu-dash-actions">
			<?php foreach ($actions as $action) : ?>
				<?php if (isset($action['url'])) : ?>
					<a class="hu-dash-action" href="<?php echo $e($action['url']); ?>"<?php echo !empty($action['external']) ? ' target="_blank" rel="noopener"' : ''; ?><?php echo !empty($action['hint']) ? ' title="' . $e(Text::_($action['hint'])) . '"' : ''; ?>>
				<?php else : ?>
					<button type="button" class="hu-dash-action" <?php echo $action['attr']; ?>>
				<?php endif; ?>
					<span class="<?php echo $action['icon']; ?>" aria-hidden="true"></span>
					<?php echo Text::_($action['label']); ?>
				<?php echo isset($action['url']) ? '</a>' : '</button>'; ?>
			<?php endforeach; ?>
		</div>
	</section>

	<footer class="hu-dash-foot">
		<?php foreach ($resources as $label => $url) : ?>
			<a href="<?php echo $e($url); ?>" target="_blank" rel="noopener">
				<?php echo Text::_($label); ?>
				<span class="visually-hidden"><?php echo Text::_('JBROWSERTARGET_NEW'); ?></span>
			</a>
		<?php endforeach; ?>
	</footer>
</div>
