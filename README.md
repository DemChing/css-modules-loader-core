# CSS Module Loader Core
> A loader-agnostic CSS Modules implementation, based on `PostCSS@8`

> If you don't use plugins for `PostCSS@8`, use the original package instead.

[![Build Status](https://travis-ci.org/demching/demching-loader-core.svg?branch=master)](https://travis-ci.org/demching/demching-loader-core)

## Notice
This is a modified repository of [css-modules-loader-core](https://github.com/css-modules/css-modules-loader-core) with the following changes:

1. Rewrite in `Typescript`.
2. Update some dependencies to latest version: `PostCSS` and related plugins.
3. Change the usage of `file-system-loader`.

The original package depends on `PostCSS@6` which has a different usage of plugins to the latest `PostCSS@8`. Incompatible plugins is the main reason I created this package. You may install the original package if you are not using custom plugins.

Usage of this package should be the same as original repo unless you are using `file-system-loader`. Check [here](#file-system-loader) for details.

## API

```js
import Core from '@demching113/css-modules-loader-core'
let core = new Core()
```

### core.load
> __core.load( sourceString , sourcePath, depTrace , pathFetcher ) => Promise({ injectableSource, exportTokens })__

Processes the input CSS `sourceString`, looking for dependencies such as `@import` or `:import`. Any localisation will happen by prefixing a sanitised version of `sourcePath` When dependencies are found, it will ask the `pathFetcher` for each dependency, resolve & inline any imports, and return the following object:

- `injectableSource`: the final, merged CSS file without `@import` or `:import` statements
- `exportTokens`: the mapping from local name to scoped name, as described in the file's `:export` block

These should map nicely to what your build-tool-specific loader needs to do its job.

### new Core([plugins])

The default set of plugins is [[postcss-modules-local-by-default](https://github.com/css-modules/postcss-modules-local-by-default), [postcss-modules-extract-imports](https://github.com/css-modules/postcss-modules-extract-imports), [postcss-modules-scope](https://github.com/css-modules/postcss-modules-scope)] (i.e. the CSS Modules specification). This can override which PostCSS plugins you wish to execute, e.g.

```js
import Core from '@demching113/css-modules-loader-core'
import autoprefixer from 'autoprefixer'
import colorFunctions from 'postcss-color-function'

// Don't run local-by-default, but use colorFunctions
// beforehand and autoprefixer afterwards:
let core = new Core([
  colorFunctions,
  Core.extractImports,
  Core.scope,
  autoprefixer("Last 2 Versions")
])
```

## File System Loader
This loader was used only for testing in original repository. However, it doesn't work because the file path is not resolved correctly. See related [issue](https://github.com/css-modules/css-modules-loader-core/issues/232).

So I try to fix the bug and end up changing its usage.

> P.S. This is tested on Windows only so it may not work on Unix system.

```js
import { FileSystemLoader } from '@demching113/css-modules-loader-core';
// Specify the absolute path of root. E.g. C:\users\your\root\of\src
let fileLoader = new FileSystemLoader(rootAbsolutePath);

// or with using plugins
let fileLoader = new FileSystemLoader(rootAbsolutePath, [
  // your plugins
]);
```

### fileLoader.load
> __fileLoader.load( sourceString , sourceRelativePath , depTrace ) => Promise({ injectableSource, exportTokens })__

The usage is similar to [`core.load`](#coreload) except you don't need to provide `pathFetcher`.

Also, you may need to provide the file path `sourceRelativePath` relative to `rootAbsolutePath`.

For example, the `rootAbsolutePath` is `/root/of/src` and you want to load `/root/of/src/styles/main.css`:

```js
let fileLoader = new FileSystemLoader(`/root/of/src`);
fileLoader.load(
  contents, // contents of main.css
  `styles/main.css`, // relative path
)
```
