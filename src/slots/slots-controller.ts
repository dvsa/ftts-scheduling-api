import { Context } from '@azure/functions';
import querystring from 'querystring';
import dayjs from 'dayjs';

import { logger } from '../logger';
import { SlotsRequest, Slot } from '../interfaces';
import { retrieveSlots } from '../services';
import {
  isValidTestTypes,
  isValidTestCentreId,
  isValidDate,
} from '../utils';
import { validateRegionId } from '../utils/validators';
import { SchedulingError } from '../utils/scheduling-error';
import { TCN_REGIONS_PREFERRED_DATE_ENABLED } from '../config';

class SlotsController {
  public static async getSlots(context: Context): Promise<Slot[]> {
    const missingContextReqError = new SchedulingError(400, 'SLOTS_CONTROLLER::getSlots: Missing context.req');

    if (!context.req) {
      logger.error(missingContextReqError);
      throw missingContextReqError;
    }

    const regionId = validateRegionId(context.req.params);

    const data = {
      ...context.req.query,
      ...context.req.params,
    };

    if (!data.testCentreId) {
      const invalidRequestError = new SchedulingError(400, 'SLOTS_CONTROLLER::getSlots: Missing data.testCentreId');
      logger.error(invalidRequestError, undefined, { data });
      throw invalidRequestError;
    }
    if (!data.testTypes) {
      const invalidRequestError = new SchedulingError(400, 'SLOTS_CONTROLLER::getSlots: Missing data.testTypes');
      logger.error(invalidRequestError, undefined, { data });
      throw invalidRequestError;
    }
    if (!data.dateFrom) {
      const invalidRequestError = new SchedulingError(400, 'SLOTS_CONTROLLER::getSlots: Missing data.dateFrom');
      logger.error(invalidRequestError, undefined, { data });
      throw invalidRequestError;
    }
    if (!data.dateTo) {
      const invalidRequestError = new SchedulingError(400, 'SLOTS_CONTROLLER::getSlots: Missing data.dateTo');
      logger.error(invalidRequestError, undefined, { data });
      throw invalidRequestError;
    }

    const request: SlotsRequest = {
      testCentreId: data.testCentreId,
      testTypes: data.testTypes,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
    };

    // Only send the preferred date parameter if the region is ready to receive it
    if (TCN_REGIONS_PREFERRED_DATE_ENABLED.get(regionId)) {
      if (data.preferredDate) {
        request.preferredDate = data.preferredDate;
      }
    }

    if (!SlotsController.validateRequest(request)) {
      const invalidRequestError = new SchedulingError(400, 'SLOTS_CONTROLLER::getSlots: Invalid request');
      logger.error(
        invalidRequestError,
        undefined,
        { request },
      );
      throw invalidRequestError;
    }
    const results = await retrieveSlots(regionId, request);
    return results;
  }

  private static validateRequest(query: SlotsRequest): boolean {
    try {
      const testTypes = JSON.parse(querystring.unescape(query.testTypes)) as string[];
      if (!isValidTestTypes(testTypes)) {
        return false;
      }
    } catch (e) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: Unable to parse test types', { testTypes: query.testTypes });
      return false;
    }
    if (!isValidTestCentreId(query.testCentreId)) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: Test centre ID is not a string, is less than 1 or more than 72 characters long', { testCentreId: query.testCentreId });
      return false;
    }
    if (!isValidDate(query.dateFrom, 'YYYY-MM-DD')) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: From date is invalid', { dateFrom: query.dateFrom });
      return false;
    }
    if (!isValidDate(query.dateTo, 'YYYY-MM-DD')) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: To date is invalid', { dateTo: query.dateTo });
      return false;
    }
    if (dayjs(query.dateFrom).isAfter(dayjs(query.dateTo))) {
      logger.warn(
        'SLOTS_CONTROLLER::validateRequest: To date is before from date',
        { dateFrom: query.dateFrom, dateTo: query.dateTo },
      );
      return false;
    }
    if (dayjs(query.dateFrom).isBefore(dayjs(), 'date')) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: From date is in the past', { dateFrom: query.dateFrom });
      return false;
    }
    // CRM validates 6 months - 1 day
    if (dayjs(query.dateFrom).isAfter(dayjs().add(6, 'month').subtract(1, 'day'))) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: From date is more than 6 months in the future', { dateFrom: query.dateFrom });
      return false;
    }
    if (dayjs(query.dateTo).isAfter(dayjs().add(6, 'month').subtract(1, 'day'))) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: To date is more than 6 months in the future', { dateTo: query.dateTo });
      return false;
    }
    if (query.preferredDate && !isValidDate(query.preferredDate, 'YYYY-MM-DD')) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: A preferred date has been provided but is invalid', { preferredDate: query.preferredDate });
      return false;
    }
    return true;
  }
}

export default SlotsController;
