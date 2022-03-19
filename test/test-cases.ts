import assert from 'assert';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { FileSystemLoader } from '../src';

const pipelines: {
  [dir: string]: ConstructorParameters<typeof FileSystemLoader>[1];
} = {
  'test-cases': undefined,
  'cssi': [],
}

const normalize = (str: string) => {
  return str.split(/[\r\n]+/g).filter(v => v.trim()).join('\n');
}

Object.keys(pipelines).forEach((dirname, i) => {
  describe(dirname, () => {
    let testDir = join(__dirname, dirname);
    readdirSync(testDir)
      .forEach((testCase, i) => {
        const buildPath = (file: string = '') => join(testDir, testCase, file);

        if (existsSync(buildPath('source.css'))) {
          it(`should ${testCase.replace(/-/g, ' ')}`, done => {
            const expected = readFileSync(buildPath('expected.css'), 'utf-8');
            const loader = new FileSystemLoader(testDir, pipelines[dirname]);
            const expectedTokens = readFileSync(buildPath('expected.json'), 'utf-8');
            loader.load(`${testCase}/source.css`, '/')
              .then(({ exportTokens, injectableSource }) => {
                assert.equal(normalize(injectableSource), normalize(expected));
                assert.equal(JSON.stringify(exportTokens), JSON.stringify(JSON.parse(expectedTokens)));
              })
              .then(done, done);
          });
        }
      });
  });
});
