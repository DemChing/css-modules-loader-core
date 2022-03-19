import postcss, { AcceptedPlugin } from 'postcss'

import Parser, { PathFetcher, ExportTokens } from './parser';
import { defaultPlugins, values, localByDefault, extractImports, scope, Source } from './plugins';

export interface CoreResult {
  injectableSource: string,
  exportTokens: ExportTokens,
}

export default class CoreLoader {
  static defaultPlugins = defaultPlugins;
  static values = values;
  static localByDefault = localByDefault;
  static extractImports = extractImports;
  static scope = scope;
  static defaultPathFetcher: PathFetcher = () => Promise.resolve({});

  plugins: AcceptedPlugin[];

  constructor(plugins?: AcceptedPlugin[]) {
    this.plugins = plugins || CoreLoader.defaultPlugins;
  }

  load(
    sourceString: Source,
    sourcePath: string = '',
    trace: string = '',
    pathFetcher: PathFetcher = CoreLoader.defaultPathFetcher
  ): Promise<CoreResult> {
    let parser = new Parser(pathFetcher, trace)

    return postcss(this.plugins.concat([parser.plugin]))
      .process(sourceString, { from: '/' + sourcePath || '' })
      .then(result => {
        return {
          injectableSource: result.css,
          exportTokens: parser.exportTokens
        };
      })
  }
}
