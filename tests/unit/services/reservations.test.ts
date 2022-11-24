import axios from 'axios';

import { ReservationsRequest } from '../../../src/interfaces';
import { mockTCNErrorResponse, reservationResponse } from '../../stubs/tcn';
import { reserveSlots, deleteSlot } from '../../../src/services';
import { handleAxiosError, KNOWN_RESERVATIONS_DELETE_ERROR_CODES, KNOWN_RESERVATIONS_ERROR_CODES } from '../../../src/utils/errors';
import { AuthHeader, ManagedIdentityAuth } from '../../../src/utils/managed-identity-auth';
import { logger } from '../../../src/logger';
import config from '../../../src/config';
import { removeCachedSlotsByReservationRequest } from '../../../src/services/redis';
import { TCNRegion } from '../../../src/enums';
import { getTCNURL } from '../../../src/utils/url';

jest.mock('../../../src/utils/managed-identity-auth');
jest.mock('../../../src/utils/url');
jest.mock('../../../src/utils/errors');
jest.mock('../../../src/config', () => ({
  cache: {
    enabled: false,
    keyPrefix: 'prefix',
    region: {
      a: {
        enabled: true,
        ttl: 60,
      },
      b: {
        enabled: true,
        ttl: 60,
      },
      c: {
        enabled: true,
        ttl: 60,
      },
    },
  },
}));
jest.mock('axios');
jest.mock('../../../src/services/redis');

// eslint-disable-next-line jest/unbound-method
const mockedMangedIdentityAuthInstance = ManagedIdentityAuth.getInstance as jest.MockedFunction<typeof ManagedIdentityAuth.getInstance>;
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedHandleAxiosError = handleAxiosError as jest.MockedFunction<typeof handleAxiosError>;
const mockedGetTCNURL = getTCNURL as jest.MockedFunction<typeof getTCNURL>;


const regionId = TCNRegion.A;
const tcnUrl = 'https:://test-url.com';
const query: ReservationsRequest[] = [{
  testCentreId: '1234567890',
  startDateTime: '2020-07-30T09:00:22+0000',
  testTypes: ['Car'],
  lockTime: 1,
  quantity: 1,
}];

const authHeader: AuthHeader = { headers: { Authorization: 'testToken' } };

describe('reservations', () => {
  beforeEach(() => {
    mockedMangedIdentityAuthInstance.mockImplementation(() => ({
      getAuthHeader: () => Promise.resolve(authHeader),
    } as ManagedIdentityAuth));

    mockedGetTCNURL.mockReturnValue(tcnUrl);
  });

  afterEach(() => jest.clearAllMocks());

  describe('reserveSlots', () => {
    test('returns a reservation confirmation when successful', async () => {
      mockedAxios.post.mockResolvedValueOnce(reservationResponse);

      const result = await reserveSlots(regionId, query);

      expect(result).toEqual(reservationResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${tcnUrl}/reservations`,
        [{
          lockTime: 1,
          quantity: 1,
          startDateTime: '2020-07-30T09:00:22+0000',
          testCentreId: '1234567890',
          testTypes: ['Car'],
        }],
        authHeader,
      );
    });

    describe('caching', () => {
      test('deletes slot from cache', async () => {
        mockedAxios.post.mockResolvedValueOnce(reservationResponse);
        config.cache.enabled = true;
        config.cache.region.a.enabled = true;

        await reserveSlots(regionId, query);

        expect(removeCachedSlotsByReservationRequest).toHaveBeenCalledWith(query);
      });

      test('deletes slot from cache - lowercase', async () => {
        query[0].testTypes[0] = 'car';
        mockedAxios.post.mockResolvedValueOnce(reservationResponse);
        config.cache.enabled = true;
        config.cache.region.a.enabled = true;

        await reserveSlots(regionId, query);

        expect(removeCachedSlotsByReservationRequest).toHaveBeenCalledWith(query);
      });

      test('errors deleting slot from cache is silently caught and logged', async () => {
        mockedAxios.post.mockResolvedValueOnce(reservationResponse);
        const mockedRemoveCachedSlotsByReservationRequest = removeCachedSlotsByReservationRequest as jest.MockedFunction<typeof removeCachedSlotsByReservationRequest>;
        config.cache.enabled = true;
        config.cache.region.a.enabled = true;
        const error = new Error('redis delete error');
        mockedRemoveCachedSlotsByReservationRequest.mockRejectedValue(error);

        await reserveSlots(regionId, query);

        expect(logger.error).toHaveBeenCalledWith(error, 'RESERVE_SLOT:: Unable to delete cache', { regionId, query });
      });

      test('does not delete cache if cache is disabled', async () => {
        mockedAxios.post.mockResolvedValueOnce(reservationResponse);
        config.cache.region.a.enabled = false;

        await reserveSlots(regionId, query);

        expect(removeCachedSlotsByReservationRequest).not.toHaveBeenCalledWith(query);
      });

      test('does not delete cache if global cache is disabled', async () => {
        mockedAxios.post.mockResolvedValueOnce(reservationResponse);
        config.cache.enabled = false;
        config.cache.region.a.enabled = true;

        await reserveSlots(regionId, query);

        expect(removeCachedSlotsByReservationRequest).not.toHaveBeenCalledWith(query);
      });
    });

    test('throws an error if an invalid region id is provided', async () => {
      const error = new Error(`Unable to get url based on provided regionId: ${regionId}`);
      mockedGetTCNURL.mockImplementation(() => { throw error;});
      await expect(reserveSlots(regionId, query)).rejects.toThrow(error);
    });

    test('throws an generic error if a non-axios error occurs', async () => {
      const error = new Error('Random Error');
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.post.mockRejectedValue(error); // Using axios to throw the error as it's mocked already

      await expect(reserveSlots(regionId, query)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        error,
        'RESERVE_SLOT:: Error sending TCN reservation request',
        {
          testCentreIds: ['1234567890'],
        },
      );
    });

    test('throws an error if a Axios error is thrown', async () => {
      const tcnResponseError = mockTCNErrorResponse(401);
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(tcnResponseError);

      const processedAxiosError = new Error('handle axios error');
      mockedHandleAxiosError.mockImplementation(() => { throw processedAxiosError;});

      await expect(reserveSlots(regionId, query)).rejects.toThrow(processedAxiosError);

      expect(handleAxiosError).toHaveBeenCalledWith(
        tcnResponseError,
        'RESERVE_SLOT',
        'Error sending TCN reservation request',
        KNOWN_RESERVATIONS_ERROR_CODES,
        regionId,
        { testCentreIds: ['1234567890'] },
      );
    });
  });

  describe('deleteSlot', () => {
    const reservationId = '1234567890';

    test('returns an empty response if successful', async () => {
      mockedAxios.delete.mockResolvedValueOnce({});

      await expect(deleteSlot(regionId, reservationId)).resolves.not.toThrow();

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `${tcnUrl}/reservations/1234567890`,
        authHeader,
      );
    });

    test('throws an error if an invalid region id is provided', async () => {
      const error = new Error(`Unable to get url based on provided regionId: ${regionId}`);
      mockedGetTCNURL.mockImplementation(() => { throw error;});
      await expect(deleteSlot(regionId, reservationId)).rejects.toThrow(error);
    });

    test('throws an generic error if a non-axios error occurs', async () => {
      const error = new Error('Random Error');
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.delete.mockRejectedValue(error); // Using axios to throw the error as it's mocked already

      await expect(deleteSlot(regionId, reservationId)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        error,
        'DELETE_RESERVATION:: Error sending TCN delete reservation request',
        { reservationId },
      );
    });

    test('throws an error if a Axios error is thrown', async () => {
      const tcnResponseError = mockTCNErrorResponse(401);
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.delete.mockRejectedValue(tcnResponseError);

      const processedAxiosError = new Error('handle axios error');
      mockedHandleAxiosError.mockImplementation(() => { throw processedAxiosError;});

      await expect(deleteSlot(regionId, reservationId)).rejects.toThrow(processedAxiosError);

      expect(handleAxiosError).toHaveBeenCalledWith(
        tcnResponseError,
        'DELETE_RESERVATION',
        'Error sending TCN delete reservation request',
        KNOWN_RESERVATIONS_DELETE_ERROR_CODES,
        regionId,
        { reservationId },
      );
    });
  });
});
