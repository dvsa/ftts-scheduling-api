import { Context } from '@azure/functions';
import querystring from 'querystring';
import dayjs from 'dayjs';

import logger from '../logger';
import { SlotsRequest, Slot } from '../interfaces';
import { retrieveSlots } from '../services';
import {
  buildErrorResponse,
  isValidTestTypes,
  isValidTestCentreId,
  isValidDate,
} from '../utils';
import { validateRegionId } from '../utils/validators';

class SlotsController {
  public static async getSlots(context: Context): Promise<Slot[]> {
    const err = buildErrorResponse(400, 'Bad Request - validation failed');
    if (!context.req) {
      logger.error(new Error('SLOTS_CONTROLLER::getSlots: Returning 400 error - missing context.req'));
      throw err;
    }

    const regionId = validateRegionId(context.req.params);

    const data = {
      ...context.req.query,
      ...context.req.params,
    };

    const request: SlotsRequest = {
      testCentreId: data.testCentreId,
      testTypes: data.testTypes,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
    };
    if (!SlotsController.validateRequest(request)) {
      logger.error(
        new Error('SLOTS_CONTROLLER::getSlots: Returning 400 error - validateRequest failed'),
        undefined,
        { request: JSON.stringify(request) },
      );
      throw err;
    }
    const results = await retrieveSlots(regionId, request);
    return results;
  }

  private static validateRequest(query: SlotsRequest): boolean {
    if (!query.testCentreId
      || !query.testTypes
      || !query.dateFrom
      || !query.dateTo) {
      return false;
    }

    try {
      const testTypes = JSON.parse(querystring.unescape(query.testTypes));
      if (!isValidTestTypes(testTypes)) {
        return false;
      }
    } catch (e) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: Unable to parse test types');
      return false;
    }
    if (!isValidTestCentreId(query.testCentreId)) {
      return false;
    }
    if (!isValidDate(query.dateFrom, 'YYYY-MM-DD')) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: From date is invalid');
      return false;
    }
    if (!isValidDate(query.dateTo, 'YYYY-MM-DD')) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: To date is invalid');
      return false;
    }
    if (dayjs(query.dateFrom).isAfter(dayjs(query.dateTo))) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: To date is before from date');
      return false;
    }
    if (dayjs(query.dateFrom).isBefore(dayjs(), 'date')) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: From date is in the past');
      return false;
    }
    if (dayjs(query.dateFrom).isAfter(dayjs().add(6, 'month'))) {
      logger.warn('SLOTS_CONTROLLER::validateRequest: From date is more than 6 months in the future');
      return false;
    }
    return true;
  }
}

export default SlotsController;
