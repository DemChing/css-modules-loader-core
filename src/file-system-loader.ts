import fs from 'fs';
import path from 'path';
import { AcceptedPlugin } from 'postcss';

import CoreLoader, { CoreResult } from './core-loader';
import { ExportTokens } from './parser';

export default class FileSystemLoader {
  static defaultPlugins = CoreLoader.defaultPlugins;
  static values = CoreLoader.values;
  static localByDefault = CoreLoader.localByDefault;
  static extractImports = CoreLoader.extractImports;
  static scope = CoreLoader.scope;

  coreLoader: CoreLoader;
  root: string;

  sources: ExportTokens = {};
  traces: ExportTokens = {};
  tokensByFile: { [file: string]: ExportTokens } = {};
  importNr: number = 0;

  constructor(rootAbsolutePath: string, plugins?: AcceptedPlugin[]) {
    this.root = rootAbsolutePath;
    this.coreLoader = new CoreLoader(plugins);
  }

  static NormalizePath(path?: string) {
    let parts = (path || '').split(/[\\\/]+/);
    parts[0] = '';
    return parts.join('/').replace(/\.[a-z0-9]+$/, '');
  }

  static TraceKeySorter(a: string, b: string) {
    if (a.length < b.length) {
      return a < b.substring(0, a.length) ? -1 : 1
    } else if (a.length > b.length) {
      return a.substring(0, b.length) <= b ? -1 : 1
    } else {
      return a < b ? -1 : 1
    }
  };

  load(file: string, relativeTo?: string, depTrace?: string): Promise<CoreResult> {
    return this.pathFetcher(file, relativeTo, depTrace)
      .then(exportTokens => {
        let written = new Set(),
          injectableSources: string[] = [];

        Object.keys(this.traces)
          .sort(FileSystemLoader.TraceKeySorter)
          .map(key => {
            const filename = this.traces[key]
            if (written.has(filename)) return;
            written.add(filename);

            injectableSources.push(this.sources[filename]);
          });

        return {
          exportTokens,
          injectableSource: injectableSources.join(''),
        }
      });
  }

  pathFetcher(file: string, relativeTo?: string, depTrace?: string): Promise<ExportTokens> {
    let newPath = file.replace(/^["']|["']$/g, ''),
      trace = depTrace || String.fromCharCode(this.importNr++);
    relativeTo = FileSystemLoader.NormalizePath(relativeTo);
    return new Promise((resolve, reject) => {
      let relativeDir = path.dirname(relativeTo),
        rootRelativePath = FileSystemLoader.NormalizePath(path.resolve(relativeDir, newPath)),
        fileRelativePath = path.resolve(path.join(this.root, relativeDir), newPath);

      if (newPath[0] !== '.' && newPath[0] !== '/') {
        try {
          fileRelativePath = require.resolve(newPath);
        }
        catch (e) { }
      }

      const tokens = this.tokensByFile[fileRelativePath];
      if (tokens) { return resolve(tokens) };

      try {
        let source = fs.readFileSync(fileRelativePath, 'utf-8');
        this.coreLoader.load(source, rootRelativePath, trace, this.pathFetcher.bind(this))
          .then(({ injectableSource, exportTokens }) => {
            this.sources[fileRelativePath] = injectableSource;
            this.traces[trace] = fileRelativePath;
            this.tokensByFile[fileRelativePath] = exportTokens;
            resolve(exportTokens);
          }, reject)

      } catch (err) {
        reject(err);
      }
    })
  }
}