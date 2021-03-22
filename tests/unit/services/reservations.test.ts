import axios from 'axios';

import { ReservationsRequest } from '../../../src/interfaces';
import { reservationResponse } from '../../stubs/tcn';
import { reserveSlots, deleteSlot } from '../../../src/services';
import {
  KNOWN_RESERVATIONS_DELETE_ERROR_CODES,
  KNOWN_RESERVATIONS_ERROR_CODES,
  mockTCNErrorResponse,
  TCNError,
} from '../../../src/utils/errors';

jest.mock('../../../src/config', () => ({
  tcn: {
    urls: new Map([
      ['a', 'tcn-region-a.com'],
      ['b', 'tcn-region-b.com'],
      ['c', 'tcn-region-c.com'],
    ]),
  },
}));

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const regionId = 'a' as any;
const query: ReservationsRequest[] = [{
  testCentreId: '1234567890',
  startDateTime: '2020-07-30T09:00:22+0000',
  testTypes: ['Car'],
  lockTime: 1,
  quantity: 1,
}];

describe('reserveSlots', () => {
  test('returns a reservation confirmation when successful', async () => {
    mockedAxios.post.mockResolvedValueOnce(reservationResponse);

    const result = await reserveSlots(regionId, query);

    expect(result).toEqual(reservationResponse.data);
  });

  test.each(KNOWN_RESERVATIONS_ERROR_CODES)('returns a %d error if such an error is returned from TCN', async (errorStatus) => {
    mockedAxios.post.mockRejectedValue(mockTCNErrorResponse(errorStatus));

    await expect(reserveSlots(regionId, query)).rejects.toThrow(TCNError);
  });

  describe('TCN url mapping', () => {
    test.each(['a', 'b', 'c'])('region %s: forwards the request to the correct TCN', async (mockRegionId) => {
      mockedAxios.post.mockResolvedValueOnce(reservationResponse);

      await reserveSlots(mockRegionId as any, query);

      expect(mockedAxios.post).toHaveBeenCalledWith(`tcn-region-${mockRegionId}.com/reservations`, query);
    });
  });
});

describe('deleteSlot', () => {
  const reservationId = '1234567890';

  test('returns an empty response if successful', async () => {
    mockedAxios.delete.mockResolvedValueOnce({});

    await expect(deleteSlot(regionId, reservationId)).resolves.not.toThrow();
  });

  test.each(KNOWN_RESERVATIONS_DELETE_ERROR_CODES)('returns a %d error if such an error is returned from TCN', async (errorStatus) => {
    mockedAxios.delete.mockRejectedValue(mockTCNErrorResponse(errorStatus));

    await expect(deleteSlot(regionId, reservationId)).rejects.toThrow(TCNError);
  });
});
