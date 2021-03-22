import axios from 'axios';

import { retrieveSlots } from '../../../src/services/slots';
import { SlotsRequest } from '../../../src/interfaces';
import { listPayload } from '../../stubs/tcn';
import { KNOWN_SLOTS_ERROR_CODES, TCNError } from '../../../src/utils/errors';
import { TCNRegion } from '../../../src/enums';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('retrieveSlots', () => {
  const regionId = TCNRegion.A;
  const params: SlotsRequest = {
    testCentreId: 'Birmingham456',
    testTypes: '%5B%22CAR%22%5D',
    dateFrom: '2022-10-01',
    dateTo: '2022-10-10',
  };

  test('returns slots list from TCN', async () => {
    mockedAxios.get.mockResolvedValue({ data: listPayload });

    const actual = await retrieveSlots(regionId, params);

    expect(actual.length).toBe(6);
  });

  test.each(KNOWN_SLOTS_ERROR_CODES)('returns a %d error if such an error is returned from TCN', async (errorStatus) => {
    const error = {
      response: {
        status: errorStatus,
        data: {
          code: errorStatus,
          message: '',
        },
      },
    };

    mockedAxios.get.mockRejectedValue(error);

    await expect(retrieveSlots(regionId, params)).rejects.toThrow(TCNError);
  });
});
