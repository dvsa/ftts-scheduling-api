import axios from 'axios';

import config from '../config';
import { TCNRegion } from '../enums';
import { ReservationsRequest, TCNReservationResponse, Reservation } from '../interfaces';
import logger from '../logger';
import {
  KNOWN_RESERVATIONS_DELETE_ERROR_CODES,
  KNOWN_RESERVATIONS_ERROR_CODES,
  TCNError,
} from '../utils/errors';

export const reserveSlots = async (regionId: TCNRegion, query: ReservationsRequest[]): Promise<Reservation[]> => {
  const path = `${config.tcn.urls.get(regionId)}/reservations`;
  logger.log('RESERVATIONS:: Sending TCN reservations request with body', { body: JSON.stringify(query) });

  try {
    const response: TCNReservationResponse = await axios.post(path, query);
    return response.data;
  } catch (error) {
    logger.error(error, 'RESERVATIONS:: Error sending TCN reservation request');
    if (KNOWN_RESERVATIONS_ERROR_CODES.includes(error.response?.status)) {
      throw new TCNError(error.response.status, error.response.data?.message);
    } else {
      throw error;
    }
  }
};

export const deleteSlot = async (regionId: TCNRegion, reservationId: string): Promise<void> => {
  const path = `${config.tcn.urls.get(regionId)}/reservations/${reservationId}`;
  logger.log(`RESERVATIONS:: Sending TCN delete reservations request to path ${path}`);

  try {
    await axios.delete(path);
  } catch (error) {
    logger.error(error, 'RESERVATIONS:: Error sending TCN delete reservation request');
    if (KNOWN_RESERVATIONS_DELETE_ERROR_CODES.includes(error.response?.status)) {
      throw new TCNError(error.response.status, error.response.data?.message);
    } else {
      throw error;
    }
  }
};
