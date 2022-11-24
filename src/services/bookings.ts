import axios, { AxiosError } from 'axios';

import { TCNRegion } from '../enums';
import {
  BookingResponse,
  BookingRequest,
  TCNBookingResponse,
  BookingFullResponse,
  PutBookingRequest,
  ErrorResponse,
} from '../interfaces';
import { BusinessTelemetryEvent, logger } from '../logger';
import { handleAxiosError, KNOWN_BOOKINGS_ERROR_CODES } from '../utils/errors';
import { ManagedIdentityAuth } from '../utils/managed-identity-auth';
import { getBookingReferenceIdFromReservationId, getMissingBookingReferenceIds } from '../utils/mappers';
import { getTCNURL } from '../utils/url';

const confirmBooking = async (regionId: TCNRegion, query: BookingRequest[]): Promise<BookingResponse[]> => {
  const path = `${getTCNURL(regionId)}/bookings`;
  logger.debug(`CONFIRM_BOOKING:: Sending TCN confirm booking request to path ${path}`, { request: query });
  try {
    const authHeader = await ManagedIdentityAuth.getInstance().getAuthHeader();
    const response: TCNBookingResponse<BookingResponse[]> = await axios.post(path, query, authHeader);
    const bookingResponses: BookingResponse[] = [];
    bookingResponses.push(...response.data);

    // find missing reservationIds from response and verify if they exist
    const missingBookingReferenceIds = getMissingBookingReferenceIds(query, response.data);
    const confirmedBookings = await getConfirmedBookings(regionId, missingBookingReferenceIds);
    if (confirmedBookings.length > 0) {
      bookingResponses.push(...confirmedBookings);
    }

    logger.debug('CONFIRM_BOOKING:: Request Successful', { response: response.data });

    bookingResponses.forEach((booking: BookingResponse) => {
      logger.event(BusinessTelemetryEvent.SCHEDULING_BOOKING_CONFIRMATION_SUCCESS, 'CONFIRM_BOOKING:: Successfully confirmed a booking', {
        bookingReferenceId: getBookingReferenceIdFromReservationId(booking.reservationId, query),
        reservationId: booking.reservationId,
      });
    });
    return bookingResponses;
  } catch (error) {
    const businessIdentifiers: { bookingReferenceId: string; reservationId: string }[] = query.reduce((acc, elem) => {
      acc.push({ bookingReferenceId: elem.bookingReferenceId, reservationId: elem.reservationId });
      return acc;
    }, [] as { bookingReferenceId: string; reservationId: string }[]);

    if (axios.isAxiosError(error)) {
      logger.debug('CONFIRM_BOOKING:: Error sending TCN confirm booking request - Raw Response', { response: error?.response?.data });

      // if status is 404, check if booking exists via booking reference id and return 200 if it does
      if (error.response?.status === 404) {
        const bookingReferenceIds: string[] = query.flatMap((singleQuery) => singleQuery.bookingReferenceId);
        const confirmedBookings = await getConfirmedBookings(regionId, bookingReferenceIds);
        if (confirmedBookings.length > 0) {
          return confirmedBookings;
        }
      }
      handleAxiosError(error as AxiosError<ErrorResponse>, 'CONFIRM_BOOKING', 'Error sending TCN confirm booking request', KNOWN_BOOKINGS_ERROR_CODES, regionId, businessIdentifiers);
    }
    logger.error(error as Error, 'CONFIRM_BOOKING:: Error sending TCN confirm booking request', { regionId, businessIdentifiers });
    throw error;
  }
};

const deleteBooking = async (regionId: TCNRegion, bookingReferenceId: string): Promise<void> => {
  const path = `${getTCNURL(regionId)}/bookings/${bookingReferenceId}`;
  logger.debug(`DELETE_BOOKING:: Sending TCN delete booking request to path ${path}`);
  try {
    const authHeader = await ManagedIdentityAuth.getInstance().getAuthHeader();
    await axios.delete(path, authHeader);
    logger.debug('DELETE_BOOKING:: Request Successful');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      handleAxiosError(error as AxiosError<ErrorResponse>, 'DELETE_BOOKING', 'Error sending TCN delete booking request', KNOWN_BOOKINGS_ERROR_CODES, regionId, { bookingReferenceId });
    }
    logger.error(error as Error, 'DELETE_BOOKING:: Error sending TCN delete booking request', { regionId, bookingReferenceId });
    throw error;
  }
};

const getBooking = async (regionId: TCNRegion, bookingReferenceId: string): Promise<BookingFullResponse> => {
  const path = `${getTCNURL(regionId)}/bookings/${bookingReferenceId}`;
  logger.debug(`GET_BOOKING:: Sending TCN get booking request to path ${path}`);
  try {
    const authHeader = await ManagedIdentityAuth.getInstance().getAuthHeader();
    const response: TCNBookingResponse<BookingFullResponse> = await axios.get(path, authHeader);
    logger.debug('GET_BOOKING:: Request Successful', { response: response.data });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      handleAxiosError(error as AxiosError<ErrorResponse>, 'GET_BOOKING', 'Error sending TCN get booking request', KNOWN_BOOKINGS_ERROR_CODES, regionId, { bookingReferenceId });
    }
    logger.error(error as Error, 'GET_BOOKING:: Error sending TCN get booking request', { regionId, bookingReferenceId });
    throw error;
  }
};

const getConfirmedBookings = async (regionId: TCNRegion, bookingReferenceIds: string[]): Promise<BookingResponse[]> => {
  const bookings: BookingResponse[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const bookingReferenceId of bookingReferenceIds) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const booking = await getBooking(regionId, bookingReferenceId);
      if (booking) {
        const confirmedBooking = {
          reservationId: booking.reservationId,
          status: '200',
          message: 'Success',
        };
        bookings.push(confirmedBooking);
      }
    } catch (error) {
      logger.warn('CONFIRM_BOOKING::getConfirmedBookings: Could not verify confirmed booking', {
        bookingReferenceId,
        regionId,
      });
    }
  }

  return bookings;
};

const putBooking = async (regionId: TCNRegion, bookingReferenceId: string, req: PutBookingRequest): Promise<BookingFullResponse> => {
  const path = `${getTCNURL(regionId)}/bookings/${bookingReferenceId}`;
  logger.debug(`PUT_BOOKING:: Sending TCN update booking request to path ${path}`, { request: req });
  try {
    const authHeader = await ManagedIdentityAuth.getInstance().getAuthHeader();
    const response: TCNBookingResponse<BookingFullResponse> = await axios.put(path, req, authHeader);
    logger.debug('PUT_BOOKING:: Request Successful', { response: response.data });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      handleAxiosError(error as AxiosError<ErrorResponse>, 'PUT_BOOKING', 'Error sending TCN put booking request', KNOWN_BOOKINGS_ERROR_CODES, regionId, { bookingReferenceId });
    }
    logger.error(error as Error, 'PUT_BOOKING:: Error sending TCN put booking request', { regionId, bookingReferenceId });
    throw error;
  }
};

export { confirmBooking, deleteBooking, getBooking, putBooking  };
