# Admin scripts (TypeScript)

The sources live in `assets/ts/admin/`. `npm run build:admin` compiles each `<name>.ts` to `assets/js/admin/<name>.js`, the file Joomla loads. The compiled files are committed, so the plugin installs without a build step.

```bash
npm run typecheck     # tsc, strict
npm run build:admin   # compile once
npm run watch:admin   # rebuild on save
```

Rules that keep the output compatible:

- **One file per script.** Each `.ts` entry compiles to its own IIFE (classic script), at the same path the PHP already loads.
- **Share runtime code through the globals** (`Joomla.utils`, `Joomla.HelixToaster`, `Joomla.helixModal`, `Joomla.sortable`, ...), never through `import`. A runtime import would bundle a second copy of the module into the importing file.
- **Share types with `import type`.** Declare globals in `types/globals.d.ts`.
- **Keep the public surface.** Whatever a script exposed before (on `Joomla` or as bare names on `window`) must still be exposed after the conversion.
- **Never edit the generated `.js`** of a converted script. Edit the `.ts` source and rebuild.

Converted so far: `utils`, `toaster`, `modal`, `fields`. The other scripts in `assets/js/admin/` are still hand-written JS.
