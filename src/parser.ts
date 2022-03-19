const importRegexp = /^:import\((.+)\)$/;
import replaceSymbols from 'icss-replace-symbols';
import { Declaration, Result, Root, Rule } from 'postcss';

export interface ExportTokens {
  [index: string]: string;
}

export type PathFetcher = (file: string, relativeTo?: string, depTrace?: string) => Promise<ExportTokens>;

export default class Parser {
  pathFetcher: PathFetcher;
  exportTokens: ExportTokens;
  translations: ExportTokens;
  trace: string;


  constructor(pathFetcher: PathFetcher, trace?: string) {
    this.pathFetcher = pathFetcher;
    this.plugin = this.plugin.bind(this);
    this.exportTokens = {};
    this.translations = {};
    this.trace = trace || '';
  }

  plugin(css: Root, result: Result) {
    return Promise.all(this.fetchAllImports(css))
      .then(_ => this.linkImportedSymbols(css))
      .then(_ => this.extractExports(css));
  }

  fetchAllImports(css: Root) {
    let imports = [];
    css.each(node => {
      if (node.type == "rule") {
        let rule = node as Rule;
        if (rule.selector.match(importRegexp)) {
          imports.push(this.fetchImport(rule, css.source.input.from, imports.length));
        }
      }
    });
    return imports;
  }

  linkImportedSymbols(css: Root) {
    replaceSymbols(css, this.translations);
  }

  extractExports(css: Root) {
    css.each(node => {
      if (node.type == "rule") {
        let rule = node as Rule;
        if (rule.selector == ":export") this.handleExport(rule);
      }
    });
  }

  handleExport(exportNode: Rule) {
    exportNode.each(node => {
      if (node.type == 'decl') {
        let decl = node as Declaration;
        Object.keys(this.translations).forEach(translation => {
          decl.value = decl.value.replace(translation, this.translations[translation]);
        })
        this.exportTokens[decl.prop] = decl.value;
      }
    });
    exportNode.remove();
  }

  fetchImport(importNode: Rule, relativeTo: string, depNr: number) {
    let file = importNode.selector.match(importRegexp)[1],
      depTrace = this.trace + String.fromCharCode(depNr);
    return this.pathFetcher(file, relativeTo, depTrace)
      .then(exports => {
        importNode.each(node => {
          if (node.type == 'decl') {
            let decl = node as Declaration;
            this.translations[decl.prop] = exports[decl.value];
          }
        });
        importNode.remove();
      }, err => console.log(err));
  }
}
