import { RewriteFrames } from '@sentry/integrations';
import type { StackFrame } from '@sentry/types';

import { getTracePropagationData, rewriteFramesIteratee } from '../../src/server/utils';

const MOCK_REQUEST_EVENT: any = {
  request: {
    headers: {
      get: (key: string) => {
        if (key === 'sentry-trace') {
          return '1234567890abcdef1234567890abcdef-1234567890abcdef-1';
        }

        if (key === 'baggage') {
          return (
            'sentry-environment=production,sentry-release=1.0.0,sentry-transaction=dogpark,' +
            'sentry-user_segment=segmentA,sentry-public_key=dogsarebadatkeepingsecrets,' +
            'sentry-trace_id=1234567890abcdef1234567890abcdef,sentry-sample_rate=1'
          );
        }

        return null;
      },
    },
  },
};

describe('getTracePropagationData', () => {
  it('returns traceParentData and DSC if both are available', () => {
    const event: any = MOCK_REQUEST_EVENT;

    const { traceparentData, dynamicSamplingContext } = getTracePropagationData(event);

    expect(traceparentData).toEqual({
      parentSampled: true,
      parentSpanId: '1234567890abcdef',
      traceId: '1234567890abcdef1234567890abcdef',
    });

    expect(dynamicSamplingContext).toEqual({
      environment: 'production',
      public_key: 'dogsarebadatkeepingsecrets',
      release: '1.0.0',
      sample_rate: '1',
      trace_id: '1234567890abcdef1234567890abcdef',
      transaction: 'dogpark',
      user_segment: 'segmentA',
    });
  });

  it('returns undefined if the necessary header is not avaolable', () => {
    const event: any = { request: { headers: { get: () => undefined } } };
    const { traceparentData, dynamicSamplingContext } = getTracePropagationData(event);

    expect(traceparentData).toBeUndefined();
    expect(dynamicSamplingContext).toBeUndefined();
  });
});

describe('rewriteFramesIteratee', () => {
  it('removes the module property from the frame', () => {
    const frame: StackFrame = {
      filename: '/some/path/to/server/chunks/3-ab34d22f.js',
      module: '3-ab34d22f.js',
    };

    const result = rewriteFramesIteratee(frame);

    expect(result).not.toHaveProperty('module');
  });

  it('does the same filename modification as the default RewriteFrames iteratee', () => {
    const frame: StackFrame = {
      filename: '/some/path/to/server/chunks/3-ab34d22f.js',
      lineno: 1,
      colno: 1,
      module: '3-ab34d22f.js',
    };

    const originalRewriteFrames = new RewriteFrames();
    // @ts-ignore this property exists
    const defaultIteratee = originalRewriteFrames._iteratee;

    const defaultResult = defaultIteratee({ ...frame });
    delete defaultResult.module;

    const result = rewriteFramesIteratee({ ...frame });

    expect(result).toEqual({
      filename: 'app:///3-ab34d22f.js',
      lineno: 1,
      colno: 1,
    });

    expect(result).toStrictEqual(defaultResult);
  });
});
