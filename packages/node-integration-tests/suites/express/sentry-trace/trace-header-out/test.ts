import { TRACEPARENT_REGEXP } from '@sentry/utils';
import * as path from 'path';

import { getAPIResponse, runServer } from '../../../../utils/index';
import { TestAPIResponse } from '../server';

test('should attach a `sentry-trace` header to an outgoing request.', async () => {
  const url = await runServer(__dirname, `${path.resolve(__dirname, '..')}/server.ts`);

  const response = (await getAPIResponse(new URL(`${url}/express`))) as TestAPIResponse;

  expect(response).toBeDefined();
  expect(response).toMatchObject({
    test_data: {
      host: 'somewhere.not.sentry',
      'sentry-trace': expect.any(String),
    },
  });

  expect(TRACEPARENT_REGEXP.test(response.test_data['sentry-trace'])).toBe(true);
});
