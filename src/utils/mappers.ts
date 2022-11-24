import { BookingRequest, BookingResponse, Slot } from '../interfaces';

export const removeKpiData = (slots: Slot[]): Slot[] => slots.map((slot) => {
  const {
    dateAvailableOnOrBeforePreferredDate,
    dateAvailableOnOrAfterPreferredDate,
    dateAvailableOnOrAfterToday,
    ...mutated
  } = slot;

  return mutated;
});

export const getMissingBookingReferenceIds = (bookingRequests: BookingRequest[], bookingResponses: BookingResponse[]): string[] => {
  const missingAndFailedBookingRequests: string[] = [];

  const bookingResponseReservationIds = bookingResponses.flatMap((bookingResponse) => bookingResponse.reservationId);
  const failedBookingResponseReservationIds = bookingResponses.filter((bookingResponse) => bookingResponse.status !== '200')
    .flatMap((bookingResponse) => bookingResponse.reservationId);

  const missingBookingRequestsReservationIds = bookingRequests
    // eslint-disable-next-line arrow-body-style
    .filter((bookingRequest) => {
      return !bookingResponseReservationIds.includes(bookingRequest.reservationId)
        || failedBookingResponseReservationIds.includes(bookingRequest.reservationId);
    })
    .flatMap((bookingRequest) => bookingRequest.bookingReferenceId);
  missingAndFailedBookingRequests.push(...missingBookingRequestsReservationIds);

  return missingAndFailedBookingRequests;
};

export const getBookingReferenceIdFromReservationId = (reservationId: string, bookingRequests: BookingRequest[]): string | undefined => {
  const bookingReferenceIds = bookingRequests.filter((bookingRequest) => bookingRequest.reservationId === reservationId)
    .flatMap((bookingRequest) => bookingRequest.bookingReferenceId);

  return bookingReferenceIds[0];
};
