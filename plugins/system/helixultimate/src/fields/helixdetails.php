<?php
/**
 * @package Helix_Ultimate_Framework
 * @author JoomShaper <support@joomshaper.com>
 * @copyright Copyright (c) 2010 - 2025 JoomShaper
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */

defined('_JEXEC') or die();

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Form\FormField;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Router\Route;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Uri\Uri;
use Joomla\CMS\Version;
use Joomla\Database\DatabaseInterface;
use Joomla\Database\ParameterType;
use Joomla\Registry\Registry;

/**
 * Form field for helix details.
 *
 * Renders the style overview dashboard on the "Details" tab of the
 * template style edit screen.
 *
 * @since   1.0.0
 */
class JFormFieldHelixdetails extends FormField
{
	/**
	 * Field type
	 *
	 * @var		string	$type
	 * @since	1.0.0
	 */
	protected $type = 'Helixdetails';

	/**
	 * Override getInput function form FormField
	 *
	 * @return	string	Field HTML string
	 * @since	1.0.0
	 */
	protected function getInput()
	{
		$app = Factory::getApplication();
		$id  = (int) ($this->form->getValue('id') ?: $app->input->getInt('id', 0));

		$wa      = $app->getDocument()->getWebAssetManager();
		$version = $this->getManifest(JPATH_PLUGINS . '/system/helixultimate/helixultimate.xml')['version'] ?? '';
		$assets  = Uri::root() . 'plugins/system/helixultimate/assets';

		$wa->registerAndUseStyle('plg.system.helixultimate.style-details', $assets . '/css/admin/style-details.css', ['version' => $version])
			->registerAndUseScript('plg.system.helixultimate.style-details', $assets . '/js/admin/style-details.js', ['version' => $version], ['defer' => true]);

		$layoutsPath = defined('HELIX_LAYOUTS_PATH') ? HELIX_LAYOUTS_PATH : JPATH_PLUGINS . '/system/helixultimate/layouts';

		return LayoutHelper::render('backend.style-details', $this->getDisplayData($id, $version), $layoutsPath);
	}

	/**
	 * Render the dashboard without the control-group/label wrapper,
	 * so it can use the full width of the details column.
	 *
	 * @param	array	$options	Options to be passed into the rendering of the field
	 *
	 * @return	string
	 * @since	2.2.11
	 */
	public function renderField($options = [])
	{
		return $this->getInput();
	}

	/**
	 * Override the getLabel method from FormField class.
	 *
	 * @return 	boolean
	 * @since	1.0.0
	 */
	public function getLabel()
	{
		return false;
	}

	/**
	 * Collect everything the dashboard layout needs.
	 *
	 * @param	integer	$id					The template style id.
	 * @param	string	$frameworkVersion	The installed framework version.
	 *
	 * @return	array
	 * @since	2.2.11
	 */
	private function getDisplayData(int $id, string $frameworkVersion): array
	{
		$app      = Factory::getApplication();
		$db       = Factory::getContainer()->get(DatabaseInterface::class);
		$template = (string) $this->form->getValue('template');
		$home     = (string) $this->form->getValue('home');
		$params   = $this->getStyleParams($id);
		$tplPath  = JPATH_SITE . '/templates/' . $template;
		$manifest = $this->getManifest($tplPath . '/templateDetails.xml');

		// Extension records for the template and the framework plugin.
		$query = $db->getQuery(true)
			->select($db->quoteName(['extension_id', 'element', 'type', 'enabled']))
			->from($db->quoteName('#__extensions'))
			->where(
				'((' . $db->quoteName('type') . ' = ' . $db->quote('template') . ' AND ' . $db->quoteName('element') . ' = :template AND ' . $db->quoteName('client_id') . ' = 0)'
				. ' OR (' . $db->quoteName('type') . ' = ' . $db->quote('plugin') . ' AND ' . $db->quoteName('folder') . ' = ' . $db->quote('system') . ' AND ' . $db->quoteName('element') . ' = ' . $db->quote('helixultimate') . '))'
			)
			->bind(':template', $template);
		$extensions = $db->setQuery($query)->loadObjectList('type');

		$templateExtId = (int) ($extensions['template']->extension_id ?? 0);
		$pluginExt     = $extensions['plugin'] ?? null;

		// Pending updates for either extension.
		$updates = [];
		$extIds  = array_filter([$templateExtId, (int) ($pluginExt->extension_id ?? 0)]);

		if ($extIds)
		{
			$query = $db->getQuery(true)
				->select($db->quoteName(['name', 'version']))
				->from($db->quoteName('#__updates'))
				->whereIn($db->quoteName('extension_id'), $extIds);
			$updates = $db->setQuery($query)->loadObjectList();
		}

		// Menu items explicitly assigned to this style.
		$query = $db->getQuery(true)
			->select('COUNT(*)')
			->from($db->quoteName('#__menu'))
			->where($db->quoteName('template_style_id') . ' = :id')
			->where($db->quoteName('client_id') . ' = 0')
			->where($db->quoteName('published') . ' >= 0')
			->bind(':id', $id, ParameterType::INTEGER);
		$assignedCount = (int) $db->setQuery($query)->loadResult();

		// Published modules sitting in this template's positions.
		$positions   = $manifest['positions'] ?? [];
		$moduleCount = 0;

		if ($positions)
		{
			$query = $db->getQuery(true)
				->select('COUNT(*)')
				->from($db->quoteName('#__modules'))
				->where($db->quoteName('client_id') . ' = 0')
				->where($db->quoteName('published') . ' = 1')
				->whereIn($db->quoteName('position'), $positions, ParameterType::STRING);
			$moduleCount = (int) $db->setQuery($query)->loadResult();
		}

		// Layout builder rows.
		$layout = json_decode((string) $params->get('layout', ''), false);
		$rows   = is_array($layout) ? count($layout) : 0;

		// Override folders shipped with the template.
		$overrides = is_dir($tplPath . '/html') ? count(glob($tplPath . '/html/*', GLOB_ONLYDIR) ?: []) : 0;

		$config          = $app->getConfig();
		$templateVersion = $manifest['version'] ?? '';
		$siteUrl         = Uri::root();
		$isDefault       = $home !== '' && $home !== '0';
		$cssWritable   = is_dir($tplPath . '/css') && is_writable($tplPath . '/css');
		$cacheWritable = is_writable(JPATH_CACHE);
		$comingSoon    = (bool) $params->get('comingsoon', 0);

		$checks = [
			[
				'ok'     => $pluginExt && (int) $pluginExt->enabled === 1,
				'label'  => Text::_('HELIX_ULTIMATE_DASH_CHECK_PLUGIN'),
				'detail' => $pluginExt && (int) $pluginExt->enabled === 1
					? Text::sprintf('HELIX_ULTIMATE_DASH_CHECK_PLUGIN_OK', $frameworkVersion)
					: Text::_('HELIX_ULTIMATE_DASH_CHECK_PLUGIN_FAIL'),
				'level'  => 'danger',
			],
			[
				'ok'     => !$updates,
				'label'  => Text::_('HELIX_ULTIMATE_DASH_CHECK_UPDATES'),
				'detail' => $updates
					? Text::sprintf('HELIX_ULTIMATE_DASH_CHECK_UPDATES_FAIL', implode(', ', array_map(static fn ($u) => $u->name . ' ' . $u->version, $updates)))
					: Text::_('HELIX_ULTIMATE_DASH_CHECK_UPDATES_OK'),
				'level'  => 'warning',
				'link'   => $updates ? Route::_('index.php?option=com_installer&view=update', false) : '',
			],
			[
				'ok'     => $cssWritable,
				'label'  => Text::_('HELIX_ULTIMATE_DASH_CHECK_CSS'),
				'detail' => Text::_($cssWritable ? 'HELIX_ULTIMATE_DASH_CHECK_CSS_OK' : 'HELIX_ULTIMATE_DASH_CHECK_CSS_FAIL'),
				'level'  => 'danger',
			],
			[
				'ok'     => $cacheWritable,
				'label'  => Text::_('HELIX_ULTIMATE_DASH_CHECK_CACHE'),
				'detail' => Text::_($cacheWritable ? 'HELIX_ULTIMATE_DASH_CHECK_CACHE_OK' : 'HELIX_ULTIMATE_DASH_CHECK_CACHE_FAIL'),
				'level'  => 'danger',
			],
			[
				'ok'     => !$comingSoon,
				'label'  => Text::_('HELIX_ULTIMATE_DASH_CHECK_COMINGSOON'),
				'detail' => Text::_($comingSoon ? 'HELIX_ULTIMATE_DASH_CHECK_COMINGSOON_FAIL' : 'HELIX_ULTIMATE_DASH_CHECK_COMINGSOON_OK'),
				'level'  => 'warning',
			],
			[
				'ok'     => !$config->get('debug'),
				'label'  => Text::_('HELIX_ULTIMATE_DASH_CHECK_DEBUG'),
				'detail' => Text::_($config->get('debug') ? 'HELIX_ULTIMATE_DASH_CHECK_DEBUG_FAIL' : 'HELIX_ULTIMATE_DASH_CHECK_DEBUG_OK'),
				'level'  => 'info',
			],
		];

		$positionsPreview = (bool) ComponentHelper::getParams('com_templates')->get('template_positions_display', 0);

		return [
			'id'              => $id,
			'template'        => $template,
			'title'           => (string) $this->form->getValue('title'),
			'name'            => Text::_($template),
			'description'     => Text::_($manifest['description'] ?? ''),
			'templateVersion' => $templateVersion,
			'frameworkVersion' => $frameworkVersion,
			'joomlaVersion'   => (new Version())->getShortVersion(),
			'phpVersion'      => PHP_VERSION,
			'isDefault'       => $isDefault,
			'homeLanguage'    => $isDefault && $home !== '1' ? $home : '',
			'assignedCount'   => $assignedCount,
			'moduleCount'     => $moduleCount,
			'rows'            => $rows,
			'overrides'       => $overrides,
			'checks'          => $checks,
			'panels'          => $this->getCustomizerPanels($tplPath . '/options.xml', $id),
			'positionsPreview' => $positionsPreview,
			'token'           => Session::getFormToken(),
			'urls'            => [
				'options'   => Route::_('index.php?option=com_ajax&helix=ultimate&id=' . $id, false),
				'preview'   => $siteUrl . 'index.php?templateStyle=' . $id,
				'positions' => $siteUrl . 'index.php?tp=1&templateStyle=' . $id,
				'files'     => $templateExtId ? Route::_('index.php?option=com_templates&view=template&id=' . $templateExtId, false) : '',
				'styles'    => Route::_('index.php?option=com_templates&view=styles&client_id=0', false),
				'modules'   => Route::_('index.php?option=com_modules&view=modules&client_id=0', false),
				'cache'     => Route::_('index.php?option=com_cache', false),
				'updates'   => Route::_('index.php?option=com_installer&view=update', false),
				'templatesConfig' => Route::_('index.php?option=com_config&view=component&component=com_templates', false),
			],
		];
	}

	/**
	 * Build deep links into the customizer for each options panel and its groups.
	 *
	 * @param	string	$file	Absolute path to the template's options.xml.
	 * @param	integer	$id		The template style id.
	 *
	 * @return	array
	 * @since	2.2.11
	 */
	private function getCustomizerPanels(string $file, int $id): array
	{
		$xml = is_file($file) ? simplexml_load_file($file) : false;

		if (!$xml)
		{
			return [];
		}

		$base   = 'index.php?option=com_ajax&helix=ultimate&id=' . $id;
		$panels = [];

		foreach ($xml->fieldset as $fieldset)
		{
			$name = strtolower((string) $fieldset['name']);

			if ($name === '')
			{
				continue;
			}

			$groups = [];

			// Preset groups only show up when "Custom Style" is on, so don't link to them.
			if ($name !== 'presets')
			{
				foreach ($fieldset->field as $field)
				{
					$group = (string) $field['helixgroup'];

					if ($group === '' || isset($groups[$group]))
					{
						continue;
					}

					$key   = 'HELIX_ULTIMATE_GROUP_' . strtoupper($group);
					$label = Text::_($key);

					$groups[$group] = [
						'label' => $label === $key ? ucwords(str_replace('_', ' ', $group)) : $label,
						'url'   => Route::_($base . '&panel=' . $name . '&group=' . $group, false),
					];
				}
			}

			$panels[] = [
				'name'   => $name,
				'label'  => Text::_((string) $fieldset['label']),
				'icon'   => Uri::root(true) . '/plugins/system/helixultimate/assets/images/icons/' . $name . '.svg',
				'url'    => Route::_($base . '&panel=' . $name, false),
				'groups' => $groups,
			];
		}

		return $panels;
	}

	/**
	 * Load the stored params of the style. The form only carries the
	 * fields declared in templateDetails.xml, not the Helix options.
	 *
	 * @param	integer	$id	The template style id.
	 *
	 * @return	Registry
	 * @since	2.2.11
	 */
	private function getStyleParams(int $id): Registry
	{
		$db    = Factory::getContainer()->get(DatabaseInterface::class);
		$query = $db->getQuery(true)
			->select($db->quoteName('params'))
			->from($db->quoteName('#__template_styles'))
			->where($db->quoteName('id') . ' = :id')
			->bind(':id', $id, ParameterType::INTEGER);

		return new Registry($db->setQuery($query)->loadResult() ?: '{}');
	}

	/**
	 * Read the useful bits of an extension manifest.
	 *
	 * @param	string	$file	Absolute path to the manifest.
	 *
	 * @return	array
	 * @since	2.2.11
	 */
	private function getManifest(string $file): array
	{
		if (!is_file($file))
		{
			return [];
		}

		$xml = simplexml_load_file($file);

		if (!$xml)
		{
			return [];
		}

		$positions = [];

		foreach ($xml->positions->position ?? [] as $position)
		{
			$positions[] = (string) $position;
		}

		return [
			'version'     => (string) $xml->version,
			'description' => (string) $xml->description,
			'author'      => (string) $xml->author,
			'authorUrl'   => (string) $xml->authorUrl,
			'positions'   => array_values(array_unique($positions)),
		];
	}
}
