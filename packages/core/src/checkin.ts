import type { CheckInEvelope, CheckInItem, DsnComponents, SdkMetadata, SerializedCheckIn } from '@sentry/types';
import { createEnvelope, dsnToString } from '@sentry/utils';

/**
 * Create envelope from check in item.
 */
export function createCheckInEnvelope(
  checkIn: SerializedCheckIn,
  metadata?: SdkMetadata,
  tunnel?: string,
  dsn?: DsnComponents,
): CheckInEvelope {
  const headers: CheckInEvelope[0] = {
    sent_at: new Date().toISOString(),
    ...(metadata &&
      metadata.sdk && {
        sdk: {
          name: metadata.sdk.name,
          version: metadata.sdk.version,
        },
      }),
    ...(!!tunnel && !!dsn && { dsn: dsnToString(dsn) }),
  };
  const item = createCheckInEnvelopeItem(checkIn);
  return createEnvelope<CheckInEvelope>(headers, [item]);
}

function createCheckInEnvelopeItem(checkIn: SerializedCheckIn): CheckInItem {
  const checkInHeaders: CheckInItem[0] = {
    type: 'check_in',
  };
  return [checkInHeaders, checkIn];
}
