import { AcceptedPlugin } from 'postcss'
import LocalByDefault from 'postcss-modules-local-by-default'
import ExtractImports from 'postcss-modules-extract-imports';
import Scope from 'postcss-modules-scope';
import Values from 'postcss-modules-values';

export const localByDefault: AcceptedPlugin = LocalByDefault;
export const extractImports: AcceptedPlugin = ExtractImports;
export const scope: AcceptedPlugin = Scope;
export const values: AcceptedPlugin = Values;

export const defaultPlugins = [
    values,
    localByDefault,
    extractImports,
    scope
];
