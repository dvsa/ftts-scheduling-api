import axios, { AxiosError } from 'axios';

import { TCNRegion } from '../enums';
import { SlotsRequest, Slot, TCNSlotsResponse, ErrorResponse } from '../interfaces';
import { logger } from '../logger';
import { handleAxiosError, KNOWN_SLOTS_ERROR_CODES } from '../utils/errors';
import { ManagedIdentityAuth } from '../utils/managed-identity-auth';
import { getCachedSlots, setCachedSlots } from './redis';
import { getCacheKey, getRegionTtl, isCacheEnabled } from '../utils/cache';
import { removeKpiData } from '../utils/mappers';
import { removeInvalidSlotsFrom } from '../utils/slots';
import { getTCNURL } from '../utils/url';

const retrieveSlots = async (regionId: TCNRegion, query: SlotsRequest): Promise<Slot[]> => {
  const testTypes = JSON.parse(decodeURIComponent(query.testTypes)) as string[];
  const key = getCacheKey(query.testCentreId, testTypes, query.dateFrom, query.dateTo);

  const cacheEnabled = isCacheEnabled(regionId);
  logger.debug('isCacheEnabled: ', { cacheEnabled, preferredDate: query.preferredDate });
  if (cacheEnabled && !query.preferredDate) {
    try {
      logger.debug('RETRIEVE_SLOTS:: requesting cached slots');
      const slots = await getCachedSlots(key);

      if (slots) {
        logger.debug('RETRIEVE_SLOTS:: cached slots response', { slots });
        return slots;
      }
    } catch (error) {
      logger.error(error as Error, 'RETRIEVE_SLOTS:: Error retrieving from cache', { regionId, query, key });
    }
  }

  const freshSlots = await retrieveFreshSlots(regionId, query);

  if (cacheEnabled) {
    try {
      logger.debug('RETRIEVE_SLOTS:: saving fresh slots to cache', { query });
      await setCachedSlots(key, removeKpiData(freshSlots), getRegionTtl(regionId));
    } catch (error) {
      logger.error(error as Error, 'RETRIEVE_SLOTS:: Error writing to cache', { regionId, query, key });
    }
  }

  return freshSlots;
};

const retrieveFreshSlots = async (regionId: TCNRegion, query: SlotsRequest): Promise<Slot[]> => {
  const preferredDateQueryParam = (query.preferredDate) ? `&preferredDate=${query.preferredDate}` : '';
  const path = `${getTCNURL(regionId)}/testCentres/${query.testCentreId}/slots?testTypes=${encodeURIComponent(query.testTypes)}&dateFrom=${query.dateFrom}&dateTo=${query.dateTo}${preferredDateQueryParam}`;
  logger.log(`RETRIEVE_SLOTS:: Sending TCN slots request to ${(path)}`, { query });

  try {
    const authHeader = await ManagedIdentityAuth.getInstance().getAuthHeader();
    const response: TCNSlotsResponse = await axios.get(path, authHeader);
    logger.debug('RETRIEVE_SLOTS:: Response', { response: response.data });
    return removeInvalidSlotsFrom(response.data);
  } catch (error) {
    const testCentreId = query.testCentreId;

    if (axios.isAxiosError(error)) {
      handleAxiosError(error as AxiosError<ErrorResponse>, 'RETRIEVE_SLOTS', 'TCN get request failed', KNOWN_SLOTS_ERROR_CODES, regionId, { testCentreId });
    }
    logger.error(error as Error, 'RETRIEVE_SLOTS:: TCN get request failed', { testCentreId });
    throw error;
  }
};

export { retrieveSlots };
