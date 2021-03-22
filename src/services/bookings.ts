import axios from 'axios';

import config from '../config';
import { TCNRegion } from '../enums';
import {
  BookingResponse,
  BookingRequest,
  TCNBookingResponse,
  BookingFullResponse,
  PutBookingRequest,
} from '../interfaces';
import logger from '../logger';
import { KNOWN_BOOKINGS_ERROR_CODES, TCNError } from '../utils/errors';

export const confirmBooking = async (regionId: TCNRegion, query: BookingRequest[]): Promise<BookingResponse[]> => {
  const path = `${config.tcn.urls.get(regionId)}/bookings`;
  logger.log('CONFIRM_BOOKING:: Sending TCN confirm booking request with body', { body: JSON.stringify(query) });

  try {
    const response: TCNBookingResponse<BookingResponse[]> = await axios.post(path, query);
    return response.data;
  } catch (error) {
    logger.error(error, 'CONFIRM_BOOKING:: Error sending TCN confirm booking request');
    if (KNOWN_BOOKINGS_ERROR_CODES.includes(error.response?.status)) {
      throw new TCNError(error.response.status, error.response.data?.message);
    } else {
      throw error;
    }
  }
};

export const deleteBooking = async (regionId: TCNRegion, bookingReferenceId: string): Promise<void> => {
  const path = `${config.tcn.urls.get(regionId)}/bookings/${bookingReferenceId}`;
  logger.log(`DELETE_BOOKING:: Sending TCN delete booking request to path ${path}`);
  try {
    await axios.delete(path);
  } catch (error) {
    logger.error(error, 'DELETE_BOOKING:: Error sending TCN delete booking request');
    if (KNOWN_BOOKINGS_ERROR_CODES.includes(error.response?.status)) {
      throw new TCNError(error.response.status, error.response.data?.message);
    } else {
      throw error;
    }
  }
};

export const getBooking = async (regionId: TCNRegion, bookingReferenceId: string): Promise<BookingFullResponse> => {
  const path = `${config.tcn.urls.get(regionId)}/bookings/${bookingReferenceId}`;
  logger.log(`GET_BOOKING:: Sending TCN get booking request to path ${path}`);
  try {
    const response: TCNBookingResponse<BookingFullResponse> = await axios.get(path);
    return response.data;
  } catch (error) {
    logger.error(error, 'GET_BOOKING:: Error sending TCN get booking request');
    if (KNOWN_BOOKINGS_ERROR_CODES.includes(error.response?.status)) {
      throw new TCNError(error.response.status, error.response.data?.message);
    } else {
      throw error;
    }
  }
};

export const putBooking = async (regionId: TCNRegion, bookingReferenceId: string, req: PutBookingRequest): Promise<BookingFullResponse> => {
  const path = `${config.tcn.urls.get(regionId)}/bookings/${bookingReferenceId}`;
  logger.log(`PUT_BOOKING:: Sending TCN get booking request to path ${path}`);
  try {
    const response: TCNBookingResponse<BookingFullResponse> = await axios.put(path, req);
    return response.data;
  } catch (error) {
    logger.error(error, 'PUT_BOOKING:: Error sending TCN put booking request');
    if (KNOWN_BOOKINGS_ERROR_CODES.includes(error.response?.status)) {
      throw new TCNError(error.response.status, error.response.data?.message);
    } else {
      throw error;
    }
  }
};
