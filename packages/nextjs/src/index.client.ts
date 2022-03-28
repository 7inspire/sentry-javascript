import { configureScope, init as reactInit, Integrations as DefaultIntegrations } from '@sentry/react';
import { BrowserTracing, defaultRequestInstrumentationOptions, hasTracingEnabled } from '@sentry/tracing';
import { isTracingBuild } from '@sentry/utils';

import { nextRouterInstrumentation } from './performance/client';
import { buildMetadata } from './utils/metadata';
import { NextjsOptions } from './utils/nextjsOptions';
import { addIntegration, UserIntegrations } from './utils/userIntegrations';

export * from '@sentry/react';
export { nextRouterInstrumentation } from './performance/client';

// TODO in v7, replace this with the commented-out version below (this will make BrowserTracing treeshakable)
// export const Integrations = { ...DefaultIntegrations, BrowserTracing };
export const Integrations = DefaultIntegrations;

// This is already exported as part of `Integrations` above (and for the moment will remain so for
// backwards compatibility), but that interferes with treeshaking, so we also export it separately
// here.
//
// Previously we expected users to import `BrowserTracing` like this:
//
// import { Integrations } from '@sentry/nextjs';
// const instance = new Integrations.BrowserTracing();
//
// This makes the integrations unable to be treeshaken though. To address this, we now have
// this individual export. We now expect users to consume BrowserTracing like so:
//
// import { BrowserTracing } from '@sentry/nextjs';
// const instance = new BrowserTracing();

/** Inits the Sentry NextJS SDK on the browser with the React SDK. */
export function init(options: NextjsOptions): void {
  buildMetadata(options, ['nextjs', 'react']);
  options.environment = options.environment || process.env.NODE_ENV;

  // Only add BrowserTracing if a tracesSampleRate or tracesSampler is set
  const integrations =
    isTracingBuild() && hasTracingEnabled() ? createClientIntegrations(options.integrations) : options.integrations;

  reactInit({
    ...options,
    integrations,
  });
  configureScope(scope => {
    scope.setTag('runtime', 'browser');
    scope.addEventProcessor(event => (event.type === 'transaction' && event.transaction === '/404' ? null : event));
  });
}

function createClientIntegrations(integrations?: UserIntegrations): UserIntegrations {
  const defaultBrowserTracingIntegration = new BrowserTracing({
    tracingOrigins: [...defaultRequestInstrumentationOptions.tracingOrigins, /^(api\/)/],
    routingInstrumentation: nextRouterInstrumentation,
  });

  if (integrations) {
    return addIntegration(defaultBrowserTracingIntegration, integrations, {
      BrowserTracing: { keyPath: 'options.routingInstrumentation', value: nextRouterInstrumentation },
    });
  } else {
    return [defaultBrowserTracingIntegration];
  }
}
