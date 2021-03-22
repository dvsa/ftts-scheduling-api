import { BookingRequest, NotesBehaviouralMarkers } from '../interfaces';
import logger from '../logger';
import { SchedulingError } from '../utils/scheduling-error';

export const validateBookingReferenceId = (params: {[key: string]: string}): string => {
  const { bookingReferenceId } = params;
  if (typeof bookingReferenceId !== 'string' || bookingReferenceId.length < 10 || bookingReferenceId.length > 72) {
    logger.warn('BOOKING_CONTROLLER:::validateBookingReferenceId: Booking Reference ID incorrect length or not a string');
    throw new SchedulingError(400, 'Invalid booking reference id');
  }
  return bookingReferenceId;
};

export const validateNotesAndBehaviouralMarkers = <T extends NotesBehaviouralMarkers>(obj: T): void => {
  const conditionsArray: boolean[] = [
    typeof obj.notes !== 'string' || obj.notes.length > 4096,
    typeof obj.behaviouralMarkers !== 'string' || obj.behaviouralMarkers.length > 4096,
  ];

  if (conditionsArray.includes(true)) {
    logger.warn('BOOKING_CONTROLLER:::validateNotesAndBehaviouralMarkers: Notes/Behavioural markers wrong length or not a string');
    throw new SchedulingError(400, 'Invalid notes/behavioural markers value');
  }
};

export const validateBookingRequest = (booking: BookingRequest): void => {
  validateNotesAndBehaviouralMarkers<BookingRequest>(booking);
  const conditionsArray: boolean[] = [
    typeof booking.bookingReferenceId !== 'string' || booking.bookingReferenceId.length < 10 || booking.bookingReferenceId.length > 72,
    typeof booking.reservationId !== 'string' || booking.reservationId.length < 10 || booking.reservationId.length > 72,
  ];

  if (conditionsArray.includes(true)) {
    logger.warn('BOOKING_CONTROLLER:::validateBookingRequest: bookingReferenceId/reservationId markers wrong length or not a string');
    throw new SchedulingError(400, 'Invalid bookingReferenceId/reservationId value');
  }
};
