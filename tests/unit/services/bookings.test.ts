import axios from 'axios';

import { BookingRequest, PutBookingRequest } from '../../../src/interfaces';
import { bookingResponse, fullBookingResponse, mockTCNErrorResponse } from '../../stubs/tcn';
import {
  confirmBooking,
  deleteBooking,
  getBooking,
  putBooking,
} from '../../../src/services';
import { handleAxiosError, KNOWN_BOOKINGS_ERROR_CODES } from '../../../src/utils/errors';
import { TCNRegion } from '../../../src/enums';
import { ManagedIdentityAuth, AuthHeader } from '../../../src/utils/managed-identity-auth';
import { logger } from '../../../src/logger';
import { getTCNURL } from '../../../src/utils/url';

jest.mock('axios');
jest.mock('../../../src/utils/managed-identity-auth');
jest.mock('../../../src/utils/errors');
jest.mock('../../../src/utils/url');

// eslint-disable-next-line jest/unbound-method
const mockedMangedIdentityAuthInstance = ManagedIdentityAuth.getInstance as jest.MockedFunction<typeof ManagedIdentityAuth.getInstance>;
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedHandleAxiosError = handleAxiosError as jest.MockedFunction<typeof handleAxiosError>;
const mockedGetTCNURL = getTCNURL as jest.MockedFunction<typeof getTCNURL>;

const regionId = TCNRegion.A;
const bookingReferenceId = '1234567890';
const query: BookingRequest[] = [{
  bookingReferenceId,
  reservationId: '1234567890',
  notes: '',
  behaviouralMarkers: '',
}];

const authHeader: AuthHeader = { headers: { Authorization: 'testToken' } };

describe('bookings', () => {
  beforeEach(() => {
    mockedMangedIdentityAuthInstance.mockImplementation(() => ({
      getAuthHeader: () => Promise.resolve(authHeader),
    } as ManagedIdentityAuth));

    mockedGetTCNURL.mockReturnValue('https:://test-url.com');
  });

  afterEach(() => jest.clearAllMocks());

  describe('confirmBooking', () => {
    test('returns a booking confirmation if successful', async () => {
      mockedAxios.post.mockResolvedValueOnce(bookingResponse);

      const result = await confirmBooking(regionId, query);

      expect(result).toEqual(bookingResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/bookings'),
        [{
          behaviouralMarkers: '',
          bookingReferenceId: '1234567890',
          notes: '',
          reservationId: '1234567890',
        }],
        authHeader,
      );
    });

    test('throws an error if an invalid region id is provided', async () => {
      const error = new Error(`Unable to get url based on provided regionId: ${regionId}`);
      mockedGetTCNURL.mockImplementation(() => { throw error;});
      await expect(confirmBooking(TCNRegion.A, query)).rejects.toThrow('Unable to get url based on provided regionId: a');
    });

    test('if 404 is returned, verify if booking exists, if it does return a successful response', async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(mockTCNErrorResponse(404));
      mockedAxios.get.mockResolvedValue(fullBookingResponse);

      const result = await confirmBooking(regionId, query);

      expect(result).toStrictEqual([
        {
          message: 'Success',
          reservationId: '5050302b-e9f5-476e-b22b-6856a8026e81',
          status: '200',
        },
      ]);
    });

    test('if 404 is returned, verify if booking exists, if it does not return a 404 response', async () => {
      const tcnResponseError = mockTCNErrorResponse(404);
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(tcnResponseError);
      mockedAxios.get.mockResolvedValue(tcnResponseError);

      const processedAxiosError = new Error('handle axios error');
      mockedHandleAxiosError.mockImplementation(() => { throw processedAxiosError;});

      await expect(confirmBooking(regionId, query)).rejects.toThrow(processedAxiosError);

      expect(handleAxiosError).toHaveBeenCalledWith(
        tcnResponseError,
        'CONFIRM_BOOKING',
        'Error sending TCN confirm booking request',
        KNOWN_BOOKINGS_ERROR_CODES,
        regionId,
        [{
          bookingReferenceId,
          reservationId: '1234567890',
        }],
      );
    });

    test('if booking is not in response, verify if booking exists, if it does add the missing booking to the response', async () => {
      mockedAxios.post.mockResolvedValue({
        data: [
          {
            reservationId: '234569',
            message: 'Success',
            status: '200',
          },
        ],
      });
      mockedAxios.get.mockResolvedValue(fullBookingResponse);

      const result = await confirmBooking(regionId, query);

      expect(result).toStrictEqual([
        {
          message: 'Success',
          reservationId: '234569',
          status: '200',
        },
        {
          message: 'Success',
          reservationId: '5050302b-e9f5-476e-b22b-6856a8026e81',
          status: '200',
        },
      ]);
    });

    test('if booking is not in response, verify if booking exists, if it does not, return only the confirmed bookings', async () => {
      mockedAxios.post.mockResolvedValue({
        data: [
          {
            reservationId: '234569',
            message: 'Success',
            status: '200',
          },
        ],
      });
      mockedAxios.get.mockResolvedValue(mockTCNErrorResponse(404));

      const result = await confirmBooking(regionId, query);

      expect(result).toStrictEqual([
        {
          message: 'Success',
          reservationId: '234569',
          status: '200',
        },
      ]);
    });

    test('throws an error if a non 404 Axios error is thrown', async () => {
      const tcnResponseError = mockTCNErrorResponse(401);
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(tcnResponseError);

      const processedAxiosError = new Error('handle axios error');
      mockedHandleAxiosError.mockImplementation(() => { throw processedAxiosError;});

      await expect(confirmBooking(regionId, query)).rejects.toThrow(processedAxiosError);

      expect(handleAxiosError).toHaveBeenCalledWith(
        tcnResponseError,
        'CONFIRM_BOOKING',
        'Error sending TCN confirm booking request',
        KNOWN_BOOKINGS_ERROR_CODES,
        regionId,
        [{
          bookingReferenceId,
          reservationId: '1234567890',
        }],
      );
    });

    test('throws an generic error if a non-axios error occurs', async () => {
      const error = new Error('Random Error');
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.post.mockRejectedValue(error); // Using axios to throw the error as it's mocked already

      await expect(confirmBooking(regionId, query)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        error,
        'CONFIRM_BOOKING:: Error sending TCN confirm booking request',
        {
          regionId,
          businessIdentifiers: [{
            bookingReferenceId,
            reservationId: '1234567890',
          }],
        },
      );
    });
  });

  describe('deleteBooking', () => {
    test('returns an empty response if successful', async () => {
      mockedAxios.delete.mockResolvedValueOnce({});

      await expect(deleteBooking(regionId, bookingReferenceId)).resolves.not.toThrow();

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/bookings/1234567890'),
        authHeader,
      );
    });

    test('throws an error if an invalid region id is provided', async () => {
      const error = new Error(`Unable to get url based on provided regionId: ${regionId}`);
      mockedGetTCNURL.mockImplementation(() => { throw error;});
      await expect(deleteBooking(TCNRegion.A, bookingReferenceId)).rejects.toThrow('Unable to get url based on provided regionId: a');
    });

    test('throws an generic error if a non-axios error occurs', async () => {
      const error = new Error('Random Error');
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.delete.mockRejectedValue(error); // Using axios to throw the error as it's mocked already

      await expect(deleteBooking(regionId, bookingReferenceId)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        error,
        'DELETE_BOOKING:: Error sending TCN delete booking request',
        {
          regionId,
          bookingReferenceId,
        },
      );
    });

    test('throws an error if a Axios error is thrown', async () => {
      const tcnResponseError = mockTCNErrorResponse(401);
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.delete.mockRejectedValue(tcnResponseError);

      const processedAxiosError = new Error('handle axios error');
      mockedHandleAxiosError.mockImplementation(() => { throw processedAxiosError;});

      await expect(deleteBooking(regionId, bookingReferenceId)).rejects.toThrow(processedAxiosError);

      expect(handleAxiosError).toHaveBeenCalledWith(
        tcnResponseError,
        'DELETE_BOOKING',
        'Error sending TCN delete booking request',
        KNOWN_BOOKINGS_ERROR_CODES,
        regionId,
        { bookingReferenceId },
      );
    });
  });

  describe('getBooking', () => {
    test('returns all booking related details if successful', async () => {
      mockedAxios.get.mockResolvedValueOnce(fullBookingResponse);

      const result = await getBooking(regionId, bookingReferenceId);

      expect(result).toEqual(fullBookingResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/bookings/1234567890'),
        authHeader,
      );
    });

    test('throws an error if an invalid region id is provided', async () => {
      const error = new Error(`Unable to get url based on provided regionId: ${regionId}`);
      mockedGetTCNURL.mockImplementation(() => { throw error;});
      await expect(getBooking(TCNRegion.A, bookingReferenceId)).rejects.toThrow('Unable to get url based on provided regionId: a');
    });

    test('throws an generic error if a non-axios error occurs', async () => {
      const error = new Error('Random Error');
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.get.mockRejectedValue(error); // Using axios to throw the error as it's mocked already

      await expect(getBooking(regionId, bookingReferenceId)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        error,
        'GET_BOOKING:: Error sending TCN get booking request',
        {
          regionId,
          bookingReferenceId,
        },
      );
    });

    test('throws an error if a Axios error is thrown', async () => {
      const tcnResponseError = mockTCNErrorResponse(401);
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.get.mockRejectedValue(tcnResponseError);

      const processedAxiosError = new Error('handle axios error');
      mockedHandleAxiosError.mockImplementation(() => { throw processedAxiosError;});

      await expect(getBooking(regionId, bookingReferenceId)).rejects.toThrow(processedAxiosError);

      expect(handleAxiosError).toHaveBeenCalledWith(
        tcnResponseError,
        'GET_BOOKING',
        'Error sending TCN get booking request',
        KNOWN_BOOKINGS_ERROR_CODES,
        regionId,
        { bookingReferenceId },
      );
    });
  });

  describe('putBooking', () => {
    const request: PutBookingRequest = {
      notes: 'hello',
      behaviouralMarkers: 'hello',
    };

    test('returns all booking related details if successful', async () => {
      mockedAxios.put.mockResolvedValueOnce(fullBookingResponse);

      const result = await putBooking(regionId, bookingReferenceId, request);

      expect(result).toEqual(fullBookingResponse.data);
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/bookings/1234567890'),
        {
          behaviouralMarkers: 'hello',
          notes: 'hello',
        },
        authHeader,
      );
    });

    test('throws an error if an invalid region id is provided', async () => {
      const error = new Error(`Unable to get url based on provided regionId: ${regionId}`);
      mockedGetTCNURL.mockImplementation(() => { throw error;});
      await expect(putBooking(regionId, bookingReferenceId, request)).rejects.toThrow(error);
    });

    test('throws an generic error if a non-axios error occurs', async () => {
      const error = new Error('Random Error');
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.put.mockRejectedValue(error); // Using axios to throw the error as it's mocked already

      await expect(putBooking(TCNRegion.A, bookingReferenceId, request)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        error,
        'PUT_BOOKING:: Error sending TCN put booking request',
        {
          regionId,
          bookingReferenceId,
        },
      );
    });

    test('throws an error if a Axios error is thrown', async () => {
      const tcnResponseError = mockTCNErrorResponse(401);
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.put.mockRejectedValue(tcnResponseError);

      const processedAxiosError = new Error('handle axios error');
      mockedHandleAxiosError.mockImplementation(() => { throw processedAxiosError;});

      await expect(putBooking(regionId, bookingReferenceId, request)).rejects.toThrow(processedAxiosError);

      expect(handleAxiosError).toHaveBeenCalledWith(
        tcnResponseError,
        'PUT_BOOKING',
        'Error sending TCN put booking request',
        KNOWN_BOOKINGS_ERROR_CODES,
        regionId,
        { bookingReferenceId },
      );

    });
  });
});
