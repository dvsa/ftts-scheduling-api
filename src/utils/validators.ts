import dayjs from 'dayjs';

import config from '../config';
import logger from '../logger';
import { existsInEnum, TCNRegion } from '../enums';
import { SchedulingError } from './scheduling-error';

const validateRegionId = (params: {[key: string]: string}): TCNRegion => {
  const { regionId } = params;
  if (!existsInEnum(TCNRegion, regionId)) {
    logger.warn('SCHEDULING::validateRegionId: Region id not one of the allowed values');
    throw new SchedulingError(400, 'Invalid region id');
  }
  return regionId as TCNRegion;
};

const isValidTestCentreId = (testCentreId: string): boolean => {
  if (typeof testCentreId !== 'string' || testCentreId.trim().length < 1 || testCentreId.length > 72) {
    logger.warn('SCHEDULING::isValidTestCentreId: Test centre ID wrong length or not a string');
    return false;
  }
  return true;
};

const isValidTestTypes = (testTypes: string[]): boolean => {
  try {
    testTypes.forEach((type: string) => {
      if (!config.tcn.testTypes.has(type.toUpperCase())) {
        throw new Error(`Test type ${type} not found`);
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
    return false;
  }
};

export {
  validateRegionId,
  isValidTestCentreId,
  isValidTestTypes,
  isValidDate,
};
