import { Context } from '@azure/functions';

import {
  BookingResponse,
  BookingRequest,
  BookingFullResponse,
  NotesBehaviouralMarkers,
} from '../interfaces';
import { logger } from '../logger';
import * as BookingsService from '../services';
import { SchedulingError } from '../utils/scheduling-error';
import {
  validateBookingRequest,
  validateBookingReferenceId,
} from './validators';
import { validateRegionId } from '../utils/validators';

export const confirmBooking = async (context: Context): Promise<BookingResponse[]> => {
  if (!context.req?.params) {
    const missingRequestParamsError = new SchedulingError(400, 'BOOKING_CONTROLLER::confirmBooking: Missing req.params');
    logger.error(missingRequestParamsError);
    throw missingRequestParamsError;
  }

  const regionId = validateRegionId(context.req.params);

  if (!context.req?.body) {
    const missingRequestBodyError = new SchedulingError(400, 'BOOKING_CONTROLLER::confirmBooking: Missing req.body');
    logger.error(missingRequestBodyError);
    throw missingRequestBodyError;
  }

  const data = context.req.body as BookingRequest[];

  if (!Array.isArray(data) || !data.length) {
    const payloadNotArrayOrEmptyError = new SchedulingError(400, 'BOOKING_CONTROLLER::confirmBooking: Payload not an array or is empty');
    logger.error(payloadNotArrayOrEmptyError);
    throw payloadNotArrayOrEmptyError;
  }

  data.forEach((booking: BookingRequest) => {
    booking.notes = '';
    booking.behaviouralMarkers = booking.behaviouralMarkers?.length > 0
      ? 'Candidate has a behavioural marker' : '';
    validateBookingRequest(booking);
  });

  return BookingsService.confirmBooking(regionId, data);
};

export const getBooking = async (context: Context): Promise<BookingFullResponse> => {
  if (!context.req?.params) {
    const missingRequestParamsError = new SchedulingError(400, 'BOOKING_CONTROLLER::getBooking: Missing req.params');
    logger.error(missingRequestParamsError);
    throw missingRequestParamsError;
  }

  const regionId = validateRegionId(context.req.params);

  const bookingReferenceId = validateBookingReferenceId(context.req.params);

  return BookingsService.getBooking(regionId, bookingReferenceId);
};

export const putBooking = async (context: Context): Promise<BookingFullResponse> => {
  if (!context.req?.params) {
    const missingRequestParamsError = new SchedulingError(400, 'BOOKING_CONTROLLER::putBooking: Missing req.params');
    logger.error(missingRequestParamsError);
    throw missingRequestParamsError;
  }

  if (!context.req?.body) {
    const missingRequestBodyError = new SchedulingError(400, 'BOOKING_CONTROLLER::putBooking: Missing req.body');
    logger.error(missingRequestBodyError);
    throw missingRequestBodyError;
  }

  const regionId = validateRegionId(context.req.params);

  const bookingReferenceId = validateBookingReferenceId(context.req.params);
  let { behaviouralMarkers } = context.req.body as NotesBehaviouralMarkers;

  behaviouralMarkers = behaviouralMarkers?.length > 0 ? 'Candidate has a behavioural marker' : '';

  return BookingsService.putBooking(regionId, bookingReferenceId, { notes: '', behaviouralMarkers });
};

export const deleteBooking = async (context: Context): Promise<void> => {
  if (!context.req?.params) {
    const missingRequestParamsError = new SchedulingError(400, 'BOOKING_CONTROLLER::deleteBooking: Missing req.params');
    logger.error(missingRequestParamsError);
    throw missingRequestParamsError;
  }

  const regionId = validateRegionId(context.req.params);

  const bookingReferenceId = validateBookingReferenceId(context.req.params);

  return BookingsService.deleteBooking(regionId, bookingReferenceId);
};
