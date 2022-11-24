import dayjs from 'dayjs';
import config from '../config';
import { TCNRegion } from '../enums';
import { logger } from '../logger';

const getCacheKey = (testCentreId: string, testTypes: string[], dateFrom: string, dateTo?: string): string => {
  const startDate = dayjs(dateFrom).format('YYYY-MM-DD');
  const endDate = dayjs(dateTo || dateFrom).format('YYYY-MM-DD');

  return `${config.cache.keyPrefix}|availability|${testCentreId}|${startDate}|${endDate}|${testTypes.join('-').toLocaleUpperCase()}`;
};

const getCacheKeyPattern = (testCentreId: string): string => `${config.cache.keyPrefix}|availability|${testCentreId}|*|*`;

const getKeysForDateTestType = (keys: string[], selectedtestTypes: string[], selectedDate: string): string[] => {
  const startTime = new Date().getTime();
  const filteredKeys: string[] = [];

  keys.forEach((key) => {
    try {
      const keyParts = key.split('|');
      if (keyParts.length !== 6 || !keyParts[5] || keyParts[5].length === 0) {
        throw new Error(`cache::getKeysForDateTestType: Invalid key ${key}`);
      }

      const testTypes = keyParts[5].split('-');

      const matchedTestTypes = testTypes.filter((testType) => selectedtestTypes
        .map((selectedTestType) => selectedTestType.toLocaleUpperCase())
        .includes(testType));

      const selectedDateDayjs = dayjs(selectedDate);

      const matchesDate = selectedDateDayjs.startOf('day').isSame(dayjs(keyParts[3]).startOf('day'))
        || selectedDateDayjs.startOf('day').isSame(dayjs(keyParts[4]).startOf('day'))
        || (selectedDateDayjs.isAfter(dayjs(keyParts[3]).startOf('day'))
          && selectedDateDayjs.isBefore(dayjs(keyParts[4]).endOf('day')));

      if (matchedTestTypes.length > 0 && matchesDate) {
        filteredKeys.push(key);
      }
    } catch (error) {
      logger.error(error as Error, 'cache::getKeysForDateTestType: Failed to retrieve key', { key });
    }
  });

  const endTime = new Date().getTime();
  logger.debug(`cache::getKeysForDateTestType: Retrieved keys in ${endTime - startTime}ms`);

  return filteredKeys;
};

const isCacheEnabled = (regionId: TCNRegion): boolean => config.cache.enabled && getCacheRegionConfig(regionId).enabled;

const getRegionTtl = (regionId: TCNRegion): number => {
  const regionTtl = getCacheRegionConfig(regionId).ttl;

  if (regionTtl) {
    return regionTtl;
  }

  return config.cache.redisTtl;
};

type CacheRegionConfig = {
  enabled: boolean;
  ttl: number;
};

const getCacheRegionConfig = (regionId: TCNRegion): CacheRegionConfig => {
  switch (regionId) {
    case TCNRegion.A: return config.cache.region.a;
    case TCNRegion.B: return config.cache.region.b;
    case TCNRegion.C: return config.cache.region.c;
    default: throw new Error('cache::getCacheRegionConfig: Invalid TCN Cache Region');
  }
};

export {
  getCacheKey,
  getCacheKeyPattern,
  getKeysForDateTestType,
  isCacheEnabled,
  getRegionTtl,
};
