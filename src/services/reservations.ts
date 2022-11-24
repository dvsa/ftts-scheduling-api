import axios, { AxiosError } from 'axios';

import { TCNRegion } from '../enums';
import { ReservationsRequest, TCNReservationResponse, Reservation, ErrorResponse } from '../interfaces';
import { logger } from '../logger';
import { isCacheEnabled } from '../utils/cache';
import { handleAxiosError, KNOWN_RESERVATIONS_DELETE_ERROR_CODES, KNOWN_RESERVATIONS_ERROR_CODES } from '../utils/errors';
import { removeCachedSlotsByReservationRequest } from './redis';
import { ManagedIdentityAuth } from '../utils/managed-identity-auth';
import { getTCNURL } from '../utils/url';

export const reserveSlots = async (regionId: TCNRegion, query: ReservationsRequest[]): Promise<Reservation[]> => {
  const path = `${getTCNURL(regionId)}/reservations`;
  logger.log('RESERVE_SLOT:: Sending TCN reservations request with body', { body: query });

  try {
    const authHeader = await ManagedIdentityAuth.getInstance().getAuthHeader();
    const response: TCNReservationResponse = await axios.post(path, query, authHeader);
    logger.debug('RESERVE_SLOT:: Response', { response: response.data });

    if (isCacheEnabled(regionId)) {
      try {
        await removeCachedSlotsByReservationRequest(query);
      } catch (error) {
        logger.error(error as Error, 'RESERVE_SLOT:: Unable to delete cache', { regionId, query });
      }
    }

    return response.data;
  } catch (error) {
    const testCentreIds = query.map((req) => req.testCentreId);

    if (axios.isAxiosError(error)) {
      handleAxiosError(error as AxiosError<ErrorResponse>, 'RESERVE_SLOT', 'Error sending TCN reservation request', KNOWN_RESERVATIONS_ERROR_CODES, regionId, { testCentreIds });
    }
    logger.error(error as Error, 'RESERVE_SLOT:: Error sending TCN reservation request', { testCentreIds });
    throw error;
  }
};

export const deleteSlot = async (regionId: TCNRegion, reservationId: string): Promise<void> => {
  const path = `${getTCNURL(regionId)}/reservations/${reservationId}`;
  logger.log(`DELETE_RESERVATION:: Sending TCN delete reservations request to path ${path}`);

  try {
    const authHeader = await ManagedIdentityAuth.getInstance().getAuthHeader();
    await axios.delete(path, authHeader);
    logger.debug('DELETE_RESERVATION:: Successfully deleted reservation');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      handleAxiosError(error as AxiosError<ErrorResponse>, 'DELETE_RESERVATION', 'Error sending TCN delete reservation request', KNOWN_RESERVATIONS_DELETE_ERROR_CODES, regionId, { reservationId });
    }
    logger.error(error as Error, 'DELETE_RESERVATION:: Error sending TCN delete reservation request', { reservationId });
    throw error;
  }
};
