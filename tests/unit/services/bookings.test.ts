import axios from 'axios';

import { BookingRequest, PutBookingRequest } from '../../../src/interfaces';
import { bookingResponse, fullBookingResponse } from '../../stubs/tcn';
import {
  confirmBooking,
  deleteBooking,
  getBooking,
  putBooking,
} from '../../../src/services';
import { KNOWN_BOOKINGS_ERROR_CODES, mockTCNErrorResponse, TCNError } from '../../../src/utils/errors';
import { TCNRegion } from '../../../src/enums';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const regionId = TCNRegion.A;
const bookingReferenceId = '1234567890';
const query: BookingRequest[] = [{
  bookingReferenceId,
  reservationId: '1234567890',
  notes: '',
  behaviouralMarkers: '',
}];

afterEach(() => jest.clearAllMocks());

describe('confirmBooking', () => {
  test('returns a booking confirmation if successful', async () => {
    mockedAxios.post.mockResolvedValueOnce(bookingResponse);

    const result = await confirmBooking(regionId, query);

    expect(result).toEqual(bookingResponse.data);
  });

  test.each(KNOWN_BOOKINGS_ERROR_CODES)('returns a %d error if such an error is returned from TCN', async (errorStatus) => {
    mockedAxios.post.mockRejectedValue(mockTCNErrorResponse(errorStatus));

    await expect(confirmBooking(regionId, query)).rejects.toThrow(TCNError);
  });
});

describe('deleteBooking', () => {
  test('returns an empty response if successful', async () => {
    mockedAxios.delete.mockResolvedValueOnce({});

    await expect(deleteBooking(regionId, bookingReferenceId)).resolves.not.toThrow();
  });

  test.each(KNOWN_BOOKINGS_ERROR_CODES)('returns a %d error if such an error is returned from TCN', async (errorStatus) => {
    mockedAxios.delete.mockRejectedValue(mockTCNErrorResponse(errorStatus));

    await expect(deleteBooking(regionId, bookingReferenceId)).rejects.toThrow(TCNError);
  });
});

describe('getBooking', () => {
  test('returns all booking related details if successful', async () => {
    mockedAxios.get.mockResolvedValueOnce(fullBookingResponse);

    const result = await getBooking(regionId, bookingReferenceId);

    expect(result).toEqual(fullBookingResponse.data);
  });

  test.each(KNOWN_BOOKINGS_ERROR_CODES)('returns a %d error if such an error is returned from TCN', async (errorStatus) => {
    mockedAxios.get.mockRejectedValue(mockTCNErrorResponse(errorStatus));

    await expect(getBooking(regionId, bookingReferenceId)).rejects.toThrow(TCNError);
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
  });

  test.each(KNOWN_BOOKINGS_ERROR_CODES)('returns a %d error if such an error is returned from TCN', async (errorStatus) => {
    mockedAxios.put.mockRejectedValue(mockTCNErrorResponse(errorStatus));

    await expect(putBooking(regionId, bookingReferenceId, request)).rejects.toThrow(TCNError);
  });
});
