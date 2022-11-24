import config from '../../../src/config';
import { TCNRegion } from '../../../src/enums';
import { logger } from '../../../src/logger';
import {
  getCacheKey, getCacheKeyPattern, getKeysForDateTestType, getRegionTtl, isCacheEnabled,
} from '../../../src/utils/cache';

jest.mock('../../../src/config', () => ({
  cache: {
    enabled: true,
    keyPrefix: 'prefix',
    redisTtl: 60,
    region: {
      a: {
        enabled: true,
        ttl: 24,
      },
      b: {
        enabled: true,
        ttl: 46,
      },
      c: {
        enabled: true,
        ttl: 34,
      },
    },
  },
}));

describe('cache', () => {
  beforeEach(() => {
    config.cache.keyPrefix = 'prefix';
    config.cache.enabled = true;
    config.cache.redisTtl = 60;

    config.cache.region.a.enabled = true;
    config.cache.region.a.ttl = 24;
    config.cache.region.b.enabled = true;
    config.cache.region.b.ttl = 46;
    config.cache.region.c.enabled = true;
    config.cache.region.c.ttl = 34;
  });

  describe('getCacheKey', () => {
    test('getCacheKey', () => {
      const key = getCacheKey('testCentreId', ['CAR'], '2018-10-28', '2018-10-29');

      expect(key).toBe('prefix|availability|testCentreId|2018-10-28|2018-10-29|CAR');
    });

    test('getCacheKey - lowercase', () => {
      const key = getCacheKey('testCentreId', ['car'], '2018-10-28', '2018-10-29');

      expect(key).toBe('prefix|availability|testCentreId|2018-10-28|2018-10-29|CAR');
    });

    test('getCacheKey - same day', () => {
      const key = getCacheKey('testCentreId', ['CAR'], '2018-10-28');

      expect(key).toBe('prefix|availability|testCentreId|2018-10-28|2018-10-28|CAR');
    });
  });

  test('getCacheKeyPattern', () => {
    const key = getCacheKeyPattern('testCentreId');

    expect(key).toBe('prefix|availability|testCentreId|*|*');
  });

  describe('getKeysForDateTestType', () => {
    test('getKeysForDateTestType', () => {
      const redisKeys = [
        'prefix|availability|testCentreId|2018-10-27|2018-10-29|CAR', // same test type
        'prefix|availability|testCentreId|2018-10-27|2018-10-29|CAR-MOTORCYLE', // same test type + diff test type
        'prefix|availability|testCentreId|2018-10-27|2018-10-29|LGV_MC', // different test type
        'prefix|availability|testCentreId|2018-10-28|2018-10-30|CAR', // same start date
        'prefix|availability|testCentreId|2018-10-27|2018-10-28|CAR', // same end date
        'prefix|availability|testCentreId|2018-10-28|2018-10-28|CAR', // same day
        'prefix|availability|testCentreId|2018-10-30|2018-11-03|CAR', // different date
      ];

      const selectedTestTypes = [
        'CAR',
      ];

      const keys = getKeysForDateTestType(redisKeys, selectedTestTypes, '2018-10-28T00:00:00.000Z');

      expect(keys).toStrictEqual([
        'prefix|availability|testCentreId|2018-10-27|2018-10-29|CAR',
        'prefix|availability|testCentreId|2018-10-27|2018-10-29|CAR-MOTORCYLE',
        'prefix|availability|testCentreId|2018-10-28|2018-10-30|CAR',
        'prefix|availability|testCentreId|2018-10-27|2018-10-28|CAR',
        'prefix|availability|testCentreId|2018-10-28|2018-10-28|CAR',

      ]);
    });

    test('getKeysForDateTestType - lowercase', () => {
      const redisKeys = [
        'prefix|availability|testCentreId|2018-10-27|2018-10-29|CAR',
      ];

      const selectedTestTypes = [
        'car',
      ];

      const keys = getKeysForDateTestType(redisKeys, selectedTestTypes, '2018-10-28T00:00:00.000Z');

      expect(keys).toStrictEqual([
        'prefix|availability|testCentreId|2018-10-27|2018-10-29|CAR',
      ]);
    });

    test.each([
      [['']],
      [['|||||']],
      [['||||||']],
      [['prefix|availability|testCentreId|2018-10-27|2018-10-29|CAR|MOTORCYCLE']],
      [['availability|testCentreId|2018-10-27|2018-10-29|CAR']],
      [['testCentreId|2018-10-27|2018-10-29|CAR']],
      [['2018-10-27|2018-10-29|CAR']],
      [['2018-10-272018-10-29|CAR']],
      [['2018-10-272018-10-29CAR']],
    ])('getKeysForDateTestType - invalid keys', (redisKeys) => {
      const selectedTestTypes = [
        'CAR',
      ];

      const keys = getKeysForDateTestType(redisKeys, selectedTestTypes, '2018-10-28T00:00:00.000Z');

      expect(keys).not.toStrictEqual([redisKeys[0]]);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({}),
        'cache::getKeysForDateTestType: Failed to retrieve key',
        { key: redisKeys[0] },
      );
    });
  });

  describe('isCacheEnabled', () => {
    test('region a - enabled', () => {
      config.cache.region.a.enabled = true;

      const enabled = isCacheEnabled(TCNRegion.A);

      expect(enabled).toBe(true);
    });

    test('region a - disabled', () => {
      config.cache.region.a.enabled = false;

      const enabled = isCacheEnabled(TCNRegion.A);

      expect(enabled).toBe(false);
    });

    test('region b - enabled', () => {
      config.cache.region.b.enabled = true;

      const enabled = isCacheEnabled(TCNRegion.B);

      expect(enabled).toBe(true);
    });

    test('region b - disabled', () => {
      config.cache.region.b.enabled = false;

      const enabled = isCacheEnabled(TCNRegion.B);

      expect(enabled).toBe(false);
    });

    test('region c - enabled', () => {
      config.cache.region.c.enabled = true;

      const enabled = isCacheEnabled(TCNRegion.C);

      expect(enabled).toBe(true);
    });

    test('region c - disabled', () => {
      config.cache.region.c.enabled = false;

      const enabled = isCacheEnabled(TCNRegion.C);

      expect(enabled).toBe(false);
    });

    test('invalid region', () => {
      const error = new Error('cache::getCacheRegionConfig: Invalid TCN Cache Region');
      expect(() => isCacheEnabled('x' as TCNRegion)).toThrow(error);
    });
  });

  describe('getRegionTtl', () => {
    test('region A ttl', () => {
      const ttl = getRegionTtl(TCNRegion.A);

      expect(ttl).toBe(24);
    });

    test('region B ttl', () => {
      const ttl = getRegionTtl(TCNRegion.B);

      expect(ttl).toBe(46);
    });

    test('region C ttl', () => {
      const ttl = getRegionTtl(TCNRegion.C);

      expect(ttl).toBe(34);
    });
  });
});
