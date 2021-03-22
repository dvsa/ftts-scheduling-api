import { Context } from '@azure/functions';

import logger from '../logger';
import {
  BookingResponse,
  BookingRequest,
  BookingFullResponse,
  NotesBehaviouralMarkers,
} from '../interfaces';
import * as BookingsService from '../services';
import { SchedulingError } from '../utils/scheduling-error';
import {
  validateBookingRequest,
  validateBookingReferenceId,
  validateNotesAndBehaviouralMarkers,
} from './validators';
import { validateRegionId } from '../utils/validators';

export const confirmBooking = async (context: Context): Promise<BookingResponse[]> => {
  if (!context.req?.params) {
    const missingRequestParamsError = new SchedulingError(400, 'BOOKINGS_CONTROLLER::confirmBooking: Missing req.params');
    logger.error(missingRequestParamsError);
    throw missingRequestParamsError;
  }

  const regionId = validateRegionId(context.req.params);

  if (!context.req?.body) {
    logger.error(new Error('BOOKING_CONTROLLER::confirmBooking: Returning 400 error - missing context.req.body'));
    throw new SchedulingError(400, 'Missing req.body');
  }

  const data = context.req.body as BookingRequest[];

  if (!Array.isArray(data) || !data.length) {
    logger.error(new Error('BOOKING_CONTROLLER::confirmBooking: Returning 400 error - payload needs to be an array'));
    throw new SchedulingError(400, 'Payload not an array');
  }

  data.forEach((booking: BookingRequest) => validateBookingRequest(booking));

  return BookingsService.confirmBooking(regionId, data);
};

export const getBooking = async (context: Context): Promise<BookingFullResponse> => {
  if (!context.req?.params) {
    throw new SchedulingError(400, 'BOOKING_CONTROLLER::getBooking: Missing req.params');
  }

  const regionId = validateRegionId(context.req.params);

  const bookingReferenceId = validateBookingReferenceId(context.req.params);

  return BookingsService.getBooking(regionId, bookingReferenceId);
};

export const putBooking = async (context: Context): Promise<BookingFullResponse> => {
  if (!context.req?.params || !context.req?.body) {
    throw new SchedulingError(400, 'BOOKING_CONTROLLER::putBooking: Missing req.params or body');
  }

  const regionId = validateRegionId(context.req.params);

  const bookingReferenceId = validateBookingReferenceId(context.req.params);
  const { notes, behaviouralMarkers } = context.req.body as NotesBehaviouralMarkers;
  validateNotesAndBehaviouralMarkers({ notes, behaviouralMarkers });

  return BookingsService.putBooking(regionId, bookingReferenceId, { notes, behaviouralMarkers });
};

export const deleteBooking = async (context: Context): Promise<void> => {
  if (!context.req?.params) {
    throw new SchedulingError(400, 'BOOKING_CONTROLLER::deleteBooking: Missing req.params');
  }

  const regionId = validateRegionId(context.req.params);

  const bookingReferenceId = validateBookingReferenceId(context.req.params);

  return BookingsService.deleteBooking(regionId, bookingReferenceId);
};
