import { mock } from 'jest-mock-extended';
import { ReservationsRequest, Slot } from '../../../src/interfaces';
import { logger } from '../../../src/logger';
import {
  getCachedSlots, getMatchingKeys, removeCachedSlotsByKey, removeCachedSlotsByReservationRequest, setCachedSlots,
} from '../../../src/services/redis';
import { RedisCacheClient } from '../../../src/services/redis-client';

const mockRedisCacheClient = mock<RedisCacheClient>();

jest.mock('../../../src/services/redis-client', () => ({
  RedisCacheClient: {
    getInstance: () => mockRedisCacheClient,
  },
}));
jest.mock('../../../src/config', () => ({
  cache: {
    enabled: false,
    keyPrefix: 'prefix',
    redisTtl: 200,
    region: {
      a: {
        enabled: true,
        ttl: 60,
      },
      b: {
        enabled: true,
        ttl: 60,
      },
      c: {
        enabled: true,
        ttl: 60,
      },
    },
  },
  tcn: {
    urls: new Map([
      ['a', 'tcn-region-a.com'],
      ['b', 'tcn-region-b.com'],
      ['c', 'tcn-region-c.com'],
    ]),
  },
}));

describe('redis', () => {
  describe('getCachedSlots', () => {
    test('sucessfully retrive slots from redis cache', async () => {
      const slot: Slot = {
        testCentreId: 'testCentreId',
        testTypes: ['CAR'],
        startDateTime: '2020-07-30T09:00:22+0000',
        quantity: 1,
      };
      mockRedisCacheClient.getAsync.mockResolvedValue(JSON.stringify([slot]));

      const result = await getCachedSlots('key');

      expect(mockRedisCacheClient.getAsync).toHaveBeenCalledWith('key');
      expect(result).toStrictEqual([slot]);
    });

    test('unable to retrive slots from redis cache', async () => {
      mockRedisCacheClient.getAsync.mockResolvedValue(null);

      const result = await getCachedSlots('key');

      expect(mockRedisCacheClient.getAsync).toHaveBeenCalledWith('key');
      expect(result).toBeUndefined();
    });
  });

  test('get matching keys', async () => {
    mockRedisCacheClient.keysAsync.mockResolvedValue(['prefix|availability|testCentreId|2020-10-25|2020-10-29|CAR']);

    await getMatchingKeys('key');

    expect(mockRedisCacheClient.keysAsync).toHaveBeenCalledWith('key');
  });

  describe('setCachedSlots', () => {
    test('set cached slots', async () => {
      const slot: Slot = {
        testCentreId: 'testCentreId',
        testTypes: ['CAR'],
        startDateTime: '2020-07-30T09:00:22+0000',
        quantity: 1,
      };

      await setCachedSlots('key', [slot], 30);

      expect(mockRedisCacheClient.setExAsync).toHaveBeenCalledWith('key', 30, JSON.stringify([slot]));
    });

    test('set cached slots - default ttl', async () => {
      const slot: Slot = {
        testCentreId: 'testCentreId',
        testTypes: ['CAR'],
        startDateTime: '2020-07-30T09:00:22+0000',
        quantity: 1,
      };

      await setCachedSlots('key', [slot]);

      expect(mockRedisCacheClient.setExAsync).toHaveBeenCalledWith('key', 200, JSON.stringify([slot]));
    });
  });

  test('remove cached slots by key', async () => {

    await removeCachedSlotsByKey('key');

    expect(mockRedisCacheClient.delAsync).toHaveBeenCalledWith('key');
  });

  describe('removeCachedSlotsByReservationRequest', () => {
    test('remove slots by query', async () => {

      mockRedisCacheClient.keysAsync.mockResolvedValue(['prefix|availability|testCentreId|2020-10-25|2020-10-29|CAR']);

      const request: ReservationsRequest = {
        testCentreId: 'testCentreId',
        testTypes: ['CAR'],
        startDateTime: '2020-10-26T23:59:59.999Z',
        quantity: 1,
        lockTime: 120,
      };

      await removeCachedSlotsByReservationRequest([request]);

      expect(mockRedisCacheClient.delAsync).toHaveBeenCalledWith('prefix|availability|testCentreId|2020-10-25|2020-10-29|CAR');
    });

    test('log error if remove slots by query fails while getting keys', async () => {
      const error = new Error('error');
      mockRedisCacheClient.keysAsync.mockRejectedValue(error);

      const request: ReservationsRequest = {
        testCentreId: 'testCentreId',
        testTypes: ['CAR'],
        startDateTime: '2020-10-26T23:59:59.999Z',
        quantity: 1,
        lockTime: 120,
      };

      await removeCachedSlotsByReservationRequest([request]);

      expect(logger.error).toHaveBeenCalledWith(
        error,
        'redis::removeCachedSlotsByReservationRequest: Failed to retrieve keys to remove',
        {
          query: request,
        },
      );
    });

    test('log error if remove slots by query fails while removing from redis', async () => {
      const error = new Error('error');
      mockRedisCacheClient.delAsync.mockRejectedValue(error);

      const request: ReservationsRequest = {
        testCentreId: 'testCentreId',
        testTypes: ['CAR'],
        startDateTime: '2020-10-26T23:59:59.999Z',
        quantity: 1,
        lockTime: 120,
      };

      await removeCachedSlotsByReservationRequest([request]);

      expect(logger.error).toHaveBeenCalledWith(
        error,
        'redis::removeCachedSlotsByReservationRequest: Failed to retrieve keys to remove',
        {
          query: request,
        },
      );
    });
  });
});
