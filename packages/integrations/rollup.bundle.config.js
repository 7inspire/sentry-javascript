import commonjs from '@rollup/plugin-commonjs';

import { insertAt, makeBaseBundleConfig, makeBundleConfigVariants } from '../../rollup/index.js';

const builds = [];

const file = process.env.INTEGRATION_FILE;
const jsVersion = process.env.JS_VERSION;

const baseBundleConfig = makeBaseBundleConfig({
  bundleType: 'addon',
  input: `src/${file}`,
  jsVersion,
  licenseTitle: '@sentry/integrations',
  outputFileBase: `bundles/${file.replace('.ts', '')}${jsVersion === 'ES5' ? '.es5' : ''}`,
});

// TODO We only need `commonjs` for localforage (used in the offline plugin). Once that's fixed, this can come out.
baseBundleConfig.plugins = insertAt(baseBundleConfig.plugins, -2, commonjs());

// this makes non-minified, minified, and minified-with-debug-logging versions of each bundle
builds.push(...makeBundleConfigVariants(baseBundleConfig));

export default builds;
