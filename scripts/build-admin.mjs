/**
 * Compile the admin TypeScript sources to the plain scripts Joomla loads.
 *
 *   plugins/system/helixultimate/assets/ts/admin/<name>.ts
 *     -> plugins/system/helixultimate/assets/js/admin/<name>.js
 *
 * Each file is built on its own as a classic script (IIFE), at the same path
 * and with the same globals as before, so PHP, WebAssetManager and third-party
 * code see no difference. The output is committed: installing the plugin needs
 * no build step.
 *
 * Usage: node scripts/build-admin.mjs [--watch]
 */

import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'plugins/system/helixultimate/assets/ts/admin');
const outDir = join(root, 'plugins/system/helixultimate/assets/js/admin');

const entryPoints = readdirSync(srcDir)
	.filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'))
	.map(file => join(srcDir, file));

const options = {
	entryPoints,
	outdir: outDir,
	bundle: true,
	format: 'iife',
	platform: 'browser',
	target: ['es2020'],
	charset: 'utf8',
	minify: false,
	legalComments: 'inline',
	logLevel: 'info',
	banner: {
		js: '/* Generated from assets/ts/admin by scripts/build-admin.mjs. Edit the .ts source, not this file. */',
	},
};

if (process.argv.includes('--watch')) {
	const context = await esbuild.context(options);
	await context.watch();
} else {
	await esbuild.build(options);
}
