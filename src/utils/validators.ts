import { HttpRequestParams } from '@azure/functions';
import dayjs from 'dayjs';

import config from '../config';
import { logger } from '../logger';
import { existsInEnum, TCNRegion } from '../enums';
import { SchedulingError } from './scheduling-error';

const validateRegionId = (params: HttpRequestParams): TCNRegion => {
  const { regionId } = params;
  if (!regionId) {
    throw new SchedulingError(400, 'validateRegionId:: Missing params.regionId');
  }
  if (!existsInEnum(TCNRegion, regionId)) {
    logger.warn('validateRegionId:: Region ID not one of the allowed values a, b or c', { regionId });
    throw new SchedulingError(400, 'validateRegionId:: Invalid Region ID');
  }
  return regionId as TCNRegion;
};

const isValidTestCentreId = (testCentreId: string): boolean => {
  if (typeof testCentreId !== 'string' || testCentreId.trim().length < 1 || testCentreId.length > 72) {
    return false;
  }
  return true;
};

const isValidTestTypes = (testTypes: string[]): boolean => {
  try {
    testTypes.forEach((type: string) => {
      if (!config.tcn.testTypes.has(type.toUpperCase())) {
        throw new SchedulingError(400, `isValidTestTypes:: Test type ${type.toUpperCase()} not found in the TCN set of accepted test types`);
      }
    });
  } catch (e) {
    logger.warn('SCHEDULING::isValidTestTypes: Test types are invalid');
    return false;
  }
  return true;
};

const isValidDate = (date: string, format?: string): boolean => {
  if (format) {
    return dayjs(date, format).format(format) === date;
  }
  try {
    return dayjs(date).toISOString() === date;
  } catch (exception) {
    // If the date/time is not valid toISOString will fail throwing an exception.
    logger.warn('isValidDate:: No valid ISO string format');
    return false;
  }
};

export {
  validateRegionId,
  isValidTestCentreId,
  isValidTestTypes,
  isValidDate,
};
