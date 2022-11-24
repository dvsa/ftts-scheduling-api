import { Context } from '@azure/functions';

import { Reservation, ReservationsRequest } from '../interfaces';
import { BusinessTelemetryEvent, logger } from '../logger';
import { reserveSlots, deleteSlot } from '../services';
import { SchedulingError } from '../utils/scheduling-error';
import { validateRegionId } from '../utils/validators';
import { isReservationsRequestValid, validateReservationId } from './validators';

export const makeReservation = async (context: Context): Promise<Reservation[]> => {
  if (!context.req?.params) {
    const missingRequestParamsError = new SchedulingError(400, 'RESERVATIONS_CONTROLLER::makeReservation: Missing req.params');
    logger.error(missingRequestParamsError);
    throw missingRequestParamsError;
  }

  const regionId = validateRegionId(context.req.params);

  if (!context.req?.body) {
    const invalidRequestError = new SchedulingError(400, 'RESERVATIONS_CONTROLLER::makeReservation: Missing context.req.body');
    logger.error(invalidRequestError);
    throw invalidRequestError;
  }

  const data = context.req.body as ReservationsRequest[];

  if (!Array.isArray(data) || !data.length) {
    const payLoadNotArrayError = new SchedulingError(400, 'RESERVATIONS_CONTROLLER::makeReservation: Payload not an array or is empty');
    logger.error(payLoadNotArrayError);
    throw payLoadNotArrayError;
  }

  data.forEach((reservation: ReservationsRequest) => {
    if (!isReservationsRequestValid(reservation)) {
      const validationError = new SchedulingError(400, 'RESERVATIONS_CONTROLLER::makeReservation: Reservations request invalid');
      logger.error(validationError, 'RESERVATIONS_CONTROLLER::makeReservation: Reservations request invalid', { reservation });
      throw validationError;
    }
  });

  const reservations = await reserveSlots(regionId, data);

  if (reservations) {
    reservations.forEach((reservation: Reservation) => {
      logger.event(BusinessTelemetryEvent.SCHEDULING_RESERVATION_SUCCESS, 'RESERVATIONS_CONTROLLER::makeReservation: Successfully reserved slot', {
        reservationId: reservation.reservationId,
        testCentreId: reservation.testCentreId,
        testType: reservation.testTypes,
        startDateTime: reservation.startDateTime,
      });
    });
  }
  return reservations;
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
