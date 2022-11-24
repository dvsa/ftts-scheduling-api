/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import redisService from '../config';
import { ReservationsRequest, Slot } from '../interfaces/domain';
import { logger } from '../logger';
import { getCacheKeyPattern, getKeysForDateTestType } from '../utils/cache';
import { RedisCacheClient } from './redis-client';

const getCachedSlots = async (key: string): Promise<Slot[] | undefined> => {
  logger.debug(`redis::getCachedSlots: reading from cache key ${key}`);
  const slots = await RedisCacheClient.getInstance().getAsync(key);

  logger.debug('redis::getCachedSlots: raw response', { slots });
  if (!slots) {
    return undefined;
  }

  return JSON.parse(slots) as Slot[];
};

const getMatchingKeys = async (pattern: string): Promise<string[]> => {
  logger.debug(`redis::getMatchingKeys: finding keys based on pattern - ${pattern}`);
  return RedisCacheClient.getInstance().keysAsync(pattern);
};

const setCachedSlots = async (key: string, slots: Slot[], ttl?: number): Promise<void> => {
  if (!slots) {
    throw new Error('redis::setCachedSlots: slots is undefined');
  }

  logger.debug(`redis::setCachedSlots: writing to cache key ${key}`);
  await RedisCacheClient.getInstance().setExAsync(key, ttl || redisService.cache.redisTtl, JSON.stringify(slots));
};

const removeCachedSlotsByKey = async (key: string): Promise<void> => {
  logger.debug(`redis::removeCachedSlotsByKey: deleting cache key ${key}`);
  await RedisCacheClient.getInstance().delAsync(key);
};

const removeCachedSlotsByReservationRequest = async (query: ReservationsRequest[]): Promise<void> => {
  const startTime = new Date().getTime();
  const keysToDelete: string[] = [];

  for (const singleQuery of query) {
    try {
      const keysToMatch = await getMatchingKeys(getCacheKeyPattern(singleQuery.testCentreId));
      const matchedKeys = getKeysForDateTestType(keysToMatch, singleQuery.testTypes.map((testType) => testType.toUpperCase()), singleQuery.startDateTime);
      keysToDelete.push(...matchedKeys);
    } catch (error) {
      logger.error(error as Error, 'redis::removeCachedSlotsByReservationRequest: Failed to retrieve keys to remove', { query: singleQuery });
    }
  }

  const keys = new Set(keysToDelete);
  for (const key of keys) {
    try {
      await removeCachedSlotsByKey(key);
    } catch (error) {
      logger.error(error as Error, 'redis::removeCachedSlotsByReservationRequest: Failed to remove key from cache', { key });
    }
  }

  const endTime = new Date().getTime();
  logger.debug(`redis::removeCachedSlotsByReservationRequest: Removed ${keys.size} keys in ${endTime - startTime}ms`);
};

export {
  setCachedSlots,
  getCachedSlots,
  getMatchingKeys,
  removeCachedSlotsByKey,
  removeCachedSlotsByReservationRequest,
};
