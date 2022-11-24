import { InternalAccessDeniedError } from '@dvsa/egress-filtering';
import { getAllowedAddresses, onInternalAccessDeniedError } from '../../../src/services/egress';
import { BusinessTelemetryEvent, logger } from '../../../src/logger';

jest.mock('../../../src/config/index.ts', () => ({
  crm: {
    auth: {
      resource: 'https://fttsshire.crm11.dynamics.com',
    },
  },
  tcn: {
    urls: new Map([
      ['c', 'https://regionc.com'],
      ['b', 'https://regionb.com'],
    ]),
  },
  redisClient: {
    host: 'something.redis.cache.windows.net',
    port: '6380',
  },
}));

describe('egress', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    logger.event = jest.fn();
  });

  describe('getAllowedAddresses', () => {
    test('successfully returns whitelisted urls', () => {
      expect(getAllowedAddresses).toEqual([
        {
          host: 'fttsshire.crm11.dynamics.com',
          port: 443,
        },
        {
          host: 'something.redis.cache.windows.net',
          port: '6380',
        },
        {
          host: 'regionc.com',
          port: 443,
        },
        {
          host: 'regionb.com',
          port: 443,
        },
      ]);
    });
  });

  describe('onInternalAccessDeniedError', () => {
    test('proper event gets logged if url is not-whitelisted', () => {
      const error: InternalAccessDeniedError = new InternalAccessDeniedError('localhost', '80', 'Unrecognised address');
      expect(() => onInternalAccessDeniedError(error)).toThrow(error);
      expect(logger.security).toHaveBeenCalledWith(expect.any(String), {
        host: error.host,
        port: error.port,
        reason: JSON.stringify(error),
      });
      expect(logger.event).toHaveBeenCalledWith(BusinessTelemetryEvent.SCHEDULING_EGRESS_ERROR, error.message, {
        host: error.host,
        port: error.port,
        reason: JSON.stringify(error),
      });
    });
  });
});
