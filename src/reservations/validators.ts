import dayjs from 'dayjs';
import {
  isValidTestTypes,
  isValidTestCentreId,
  isValidDate,
} from '../utils';
import { ReservationsRequest } from '../interfaces';
import logger from '../logger';
import { SchedulingError } from '../utils/scheduling-error';

export const isReservationsRequestValid = (query: ReservationsRequest): boolean => {
  const {
    testCentreId, testTypes, startDateTime, quantity, lockTime,
  } = query;

  if (!testCentreId
    || !testTypes
    || testTypes.length === 0
    || !startDateTime
    || !quantity
    || !lockTime) {
    return false;
  }

  if (!isValidTestTypes(testTypes)) {
    logger.warn('RESERVATIONS_CONTROLLER::isReservationsRequestValid: Invalid test types');
    return false;
  }
  if (!isValidTestCentreId(testCentreId)) {
    logger.warn('RESERVATIONS_CONTROLLER::isReservationsRequestValid: Invalid test centre ID');
    return false;
  }
  if (!isValidDate(startDateTime)) {
    logger.warn('RESERVATIONS_CONTROLLER::isReservationsRequestValid: Start date time is invalid');
    return false;
  }
  if (dayjs(startDateTime).isBefore(dayjs())) {
    logger.warn('RESERVATIONS_CONTROLLER::isReservationsRequestValid: Start date time is in the past');
    return false;
  }
  if (typeof quantity !== 'number' || quantity < 1 || quantity > 512) {
    logger.warn('RESERVATIONS_CONTROLLER::isReservationsRequestValid: Quantity is not a number or less then 1');
    return false;
  }
  if (typeof lockTime !== 'number' || lockTime < 1 || lockTime > 15768000) {
    logger.warn('RESERVATIONS_CONTROLLER::isReservationsRequestValid: Lock time is not a number or less then 1');
    return false;
  }
  return true;
};

export const validateReservationId = (params: {[key: string]: string}): string => {
  const { reservationId } = params;
  if (typeof reservationId !== 'string' || reservationId.length < 10 || reservationId.length > 72) {
    logger.warn('RESERVATIONS_CONTROLLER:::validateReservationId: Reservation ID incorrect length or not a string');
    throw new SchedulingError(400, 'Invalid reservation id');
  }
  return reservationId;
};
