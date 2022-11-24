import { HttpRequestParams } from '@azure/functions';
import { BookingRequest } from '../interfaces';
import { logger } from '../logger';
import { SchedulingError } from '../utils/scheduling-error';

export const validateBookingReferenceId = (params: HttpRequestParams): string => {
  const { bookingReferenceId } = params;
  if (typeof bookingReferenceId !== 'string' || bookingReferenceId.length < 10 || bookingReferenceId.length > 72) {
    logger.warn('BOOKING_CONTROLLER::validateBookingReferenceId: Booking Reference ID incorrect length or not a string', { bookingReferenceId });
    throw new SchedulingError(400, `BOOKING_CONTROLLER::validateNotesAndBehaviouralMarkers: Invalid booking reference id ${bookingReferenceId as string}`);
  }
  return bookingReferenceId;
};

export const validateBookingRequest = (booking: BookingRequest): void => {
  const isBookingReferenceIdInvalid = typeof booking.bookingReferenceId !== 'string' || booking.bookingReferenceId.length < 10 || booking.bookingReferenceId.length > 72;
  const isReservationIdInvalid = typeof booking.reservationId !== 'string' || booking.reservationId.length < 10 || booking.reservationId.length > 72;

  if (isBookingReferenceIdInvalid) {
    logger.warn('BOOKING_CONTROLLER::validateBookingRequest: Booking reference ID wrong length or not a string', { bookingReferenceId: booking.bookingReferenceId });
  }

  if (isReservationIdInvalid) {
    logger.warn('BOOKING_CONTROLLER::validateBookingRequest: Booking reservation ID wrong length or not a string', { reservationId: booking.reservationId });
  }

  if (isBookingReferenceIdInvalid || isReservationIdInvalid) {
    throw new SchedulingError(400, 'BOOKING_CONTROLLER::validateBookingRequest: Invalid bookingReferenceId/reservationId value');
  }
};
