import { Context } from '@azure/functions';

import logger from '../logger';
import { Reservation, ReservationsRequest } from '../interfaces';
import { reserveSlots, deleteSlot } from '../services';
import { isReservationsRequestValid, validateReservationId } from './validators';
import { SchedulingError } from '../utils/scheduling-error';
import { validateRegionId } from '../utils/validators';

export const makeReservation = async (context: Context): Promise<Reservation[]> => {
  if (!context.req?.params) {
    const missingRequestParamsError = new SchedulingError(400, 'RESERVATIONS_CONTROLLER::makeReservation: Missing req.params');
    logger.error(missingRequestParamsError);
    throw missingRequestParamsError;
  }

  const regionId = validateRegionId(context.req.params);

  if (!context.req?.body) {
    const invalidRequestError = new SchedulingError(400, 'RESERVATIONS_CONTROLLER::makeReservation: Returning 400 error - missing context.req.body');
    logger.error(invalidRequestError);
    throw invalidRequestError;
  }

  const data = context.req.body as ReservationsRequest[];

  if (!Array.isArray(data) || !data.length) {
    const payLoadNotArrayError = new SchedulingError(400, 'RESERVATIONS_CONTROLLER::makeReservation: Returning 400 error - payload needs to be an array');
    logger.error(payLoadNotArrayError);
    throw payLoadNotArrayError;
  }

  data.forEach((reservation: ReservationsRequest) => {
    if (!isReservationsRequestValid(reservation)) {
      const validationError = new SchedulingError(400, 'RESERVATIONS_CONTROLLER::makeReservation: Returning 400 error - reservations request invalid');
      logger.error(validationError);
      throw validationError;
    }
  });

  return reserveSlots(regionId, data);
};

export const deleteReservation = async (context: Context): Promise<void> => {
  if (!context.req?.params) {
    const missingRequestParamsError = new SchedulingError(400, 'RESERVATIONS_CONTROLLER::deleteReservation: Missing req.params');
    logger.error(missingRequestParamsError);
    throw missingRequestParamsError;
  }

  const regionId = validateRegionId(context.req.params);

  const reservationId = validateReservationId(context.req.params);

  return deleteSlot(regionId, reservationId);
};
