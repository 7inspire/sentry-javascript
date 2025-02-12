import { captureException } from '@sentry/core';

import type { ServerComponentContext } from '../common/types';

/**
 * Wraps an `app` directory server component with Sentry error instrumentation.
 */
export function wrapServerComponentWithSentry<F extends (...args: any[]) => any>(
  appDirComponent: F,
  _context: ServerComponentContext,
): F {
  // Even though users may define server components as async functions, for the client bundles
  // Next.js will turn them into synchronous functions and it will transform any`await`s into instances of the`use`
  // hook. 🤯
  return new Proxy(appDirComponent, {
    apply: (originalFunction, thisArg, args) => {
      let maybePromiseResult;

      try {
        maybePromiseResult = originalFunction.apply(thisArg, args);
      } catch (e) {
        captureException(e);
        throw e;
      }

      if (typeof maybePromiseResult === 'object' && maybePromiseResult !== null && 'then' in maybePromiseResult) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return maybePromiseResult.then(null, (e: Error) => {
          captureException(e);
          throw e;
        });
      } else {
        return maybePromiseResult;
      }
    },
  });
}
