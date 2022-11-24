import axios from 'axios';
import { retrieveSlots } from '../../../src/services/slots';
import { SlotsRequest } from '../../../src/interfaces';
import { listPayload, listPayloadWithInvalidSlots, mockTCNErrorResponse } from '../../stubs/tcn';
import { handleAxiosError, KNOWN_SLOTS_ERROR_CODES } from '../../../src/utils/errors';
import { TCNRegion } from '../../../src/enums';
import { AuthHeader, ManagedIdentityAuth } from '../../../src/utils/managed-identity-auth';
import { logger } from '../../../src/logger';
import config from '../../../src/config';
import { setCachedSlots, getCachedSlots } from '../../../src/services/redis';
import { getTCNURL } from '../../../src/utils/url';

jest.mock('axios');

jest.mock('../../../src/utils/managed-identity-auth');
jest.mock('../../../src/services/redis');
jest.mock('../../../src/utils/errors');
jest.mock('../../../src/utils/url');
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

// eslint-disable-next-line jest/unbound-method
const mockedMangedIdentityAuthInstance = ManagedIdentityAuth.getInstance as jest.MockedFunction<typeof ManagedIdentityAuth.getInstance>;
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedSetCachedSlots = setCachedSlots as jest.MockedFunction<typeof setCachedSlots>;
const mockedGetCachedSlots = getCachedSlots as jest.MockedFunction<typeof getCachedSlots>;
const mockedHandleAxiosError = handleAxiosError as jest.MockedFunction<typeof handleAxiosError>;
const mockedGetTCNURL = getTCNURL as jest.MockedFunction<typeof getTCNURL>;

const authHeader: AuthHeader = { headers: { Authorization: 'testToken' } };

describe('retrieveSlots', () => {
  const regionId = TCNRegion.A;
  const params: SlotsRequest = {
    testCentreId: 'Birmingham456',
    testTypes: '%5B%22CAR%22%5D',
    dateFrom: '2022-10-01',
    dateTo: '2022-10-10',
  };

  beforeEach(() => {
    mockedMangedIdentityAuthInstance.mockImplementation(() => ({
      getAuthHeader: () => Promise.resolve(authHeader),
    } as ManagedIdentityAuth));
    config.cache.enabled = false;
    config.cache.keyPrefix = 'prefix';

    mockedGetTCNURL.mockReturnValue('https://mock-url.com');
  });

  afterEach(() => jest.clearAllMocks());

  test('returns slots list from TCN', async () => {
    const slotParams = {
      ...params,
      testTypes: '["CAR"]',
    };
    mockedAxios.get.mockResolvedValue({ data: listPayload });

    const actual = await retrieveSlots(regionId, slotParams);

    expect(actual).toHaveLength(6);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('testCentres/Birmingham456/slots?testTypes=%5B%22CAR%22%5D&dateFrom=2022-10-01&dateTo=2022-10-10'),
      authHeader,
    );
  });

  test('returns valid slots only from TCN', async () => {
    const slotParams = {
      ...params,
      testTypes: '["CAR"]',
    };
    mockedAxios.get.mockResolvedValue({ data: listPayloadWithInvalidSlots });

    const actual = await retrieveSlots(regionId, slotParams);

    expect(actual).toHaveLength(6);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('testCentres/Birmingham456/slots?testTypes=%5B%22CAR%22%5D&dateFrom=2022-10-01&dateTo=2022-10-10'),
      authHeader,
    );
  });

  test('populate cache', async () => {
    config.cache.enabled = true;
    config.cache.region.a.enabled = true;
    const slotParams = {
      ...params,
      testTypes: '["CAR"]',
    };
    mockedAxios.get.mockResolvedValue({ data: listPayload });

    const actual = await retrieveSlots(regionId, slotParams);

    expect(actual).toHaveLength(6);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('testCentres/Birmingham456/slots?testTypes=%5B%22CAR%22%5D&dateFrom=2022-10-01&dateTo=2022-10-10'),
      authHeader,
    );
    expect(setCachedSlots).toHaveBeenCalledWith(
      'prefix|availability|Birmingham456|2022-10-01|2022-10-10|CAR',
      listPayload,
      60,
    );
  });

  test('failing to populate the cache - the error is swallowed and logged', async () => {
    config.cache.enabled = true;
    config.cache.region.a.enabled = true;
    const slotParams = {
      ...params,
      testTypes: '["CAR"]',
    };
    mockedAxios.get.mockResolvedValue({ data: listPayload });
    const error = new Error('cache error');
    mockedSetCachedSlots.mockRejectedValue(error);

    const actual = await retrieveSlots(regionId, slotParams);

    expect(actual).toHaveLength(6);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('testCentres/Birmingham456/slots?testTypes=%5B%22CAR%22%5D&dateFrom=2022-10-01&dateTo=2022-10-10'),
      authHeader,
    );
    expect(setCachedSlots).toHaveBeenCalledWith(
      'prefix|availability|Birmingham456|2022-10-01|2022-10-10|CAR',
      listPayload,
      60,
    );
    expect(logger.error).toHaveBeenCalledWith(error, 'RETRIEVE_SLOTS:: Error writing to cache', {
      key: 'prefix|availability|Birmingham456|2022-10-01|2022-10-10|CAR',
      regionId,
      query: slotParams,
    });
  });

  test('does not populate cache with kpi data', async () => {
    config.cache.enabled = true;
    config.cache.region.a.enabled = true;
    const slotParams = {
      ...params,
      testTypes: '["CAR"]',
    };
    mockedAxios.get.mockResolvedValue({
      data: [{
        testCentreId: '123',
        testTypes: [
          'CAR',
        ],
        startDateTime: '2020-06-29T08:15:00.000Z',
        quantity: 1,
        dateAvailableOnOrBeforePreferredDate: '2020-06-29T08:15:00.000Z',
        dateAvailableOnOrAfterPreferredDate: '2020-06-29T08:15:00.000Z',
        dateAvailableOnOrAfterToday: '2020-06-29T08:15:00.000Z',
      }],
    });

    await retrieveSlots(regionId, slotParams);

    expect(setCachedSlots).toHaveBeenCalledWith(
      'prefix|availability|Birmingham456|2022-10-01|2022-10-10|CAR',
      [{
        testCentreId: '123',
        testTypes: [
          'CAR',
        ],
        startDateTime: '2020-06-29T08:15:00.000Z',
        quantity: 1,
      }],
      60,
    );
  });

  test('retrieve from cache', async () => {
    config.cache.enabled = true;
    config.cache.region.a.enabled = true;
    const slotParams = {
      ...params,
      testTypes: '["CAR"]',
    };
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedGetCachedSlots.mockResolvedValue(listPayload);

    const actual = await retrieveSlots(regionId, slotParams);

    expect(actual).toHaveLength(6);
    expect(actual).toStrictEqual(listPayload);
    expect(getCachedSlots).toHaveBeenCalledWith(
      'prefix|availability|Birmingham456|2022-10-01|2022-10-10|CAR',
    );
  });

  test('failing to retrieve from cache, swallow and log the error', async () => {
    config.cache.enabled = true;
    config.cache.region.a.enabled = true;
    const slotParams = {
      ...params,
      testTypes: '["CAR"]',
    };
    mockedAxios.get.mockResolvedValue({ data: listPayload });
    const error = new Error('cache error');
    mockedGetCachedSlots.mockRejectedValue(error);

    const actual = await retrieveSlots(regionId, slotParams);

    expect(actual).toHaveLength(6);
    expect(actual).toStrictEqual(listPayload);
    expect(getCachedSlots).toHaveBeenCalledWith(
      'prefix|availability|Birmingham456|2022-10-01|2022-10-10|CAR',
    );
    expect(logger.error).toHaveBeenCalledWith(error, 'RETRIEVE_SLOTS:: Error retrieving from cache', {
      key: 'prefix|availability|Birmingham456|2022-10-01|2022-10-10|CAR',
      regionId,
      query: slotParams,
    });
  });

  test('does not retrieve from cache if preferredDate is supplied', async () => {
    config.cache.enabled = true;
    config.cache.region.a.enabled = true;
    const slotParams = {
      ...params,
      testTypes: '["CAR"]',
      preferredDate: '2020-06-29T08:15:00.000Z',
    };
    mockedAxios.get.mockResolvedValue({ data: listPayload });
    mockedGetCachedSlots.mockResolvedValue([{
      testCentreId: '123',
      testTypes: [
        'CAR',
      ],
      startDateTime: '2020-06-29T08:15:00.000Z',
      quantity: 1,
    }]);

    const actual = await retrieveSlots(regionId, slotParams);

    expect(actual).toStrictEqual(listPayload);
    expect(getCachedSlots).not.toHaveBeenCalled();
  });

  test('throws an error if a Axios error is thrown when talking to TCN', async () => {
    const tcnResponseError = mockTCNErrorResponse(401);
    mockedAxios.isAxiosError.mockReturnValue(true);
    mockedAxios.get.mockRejectedValue(tcnResponseError);

    const processedAxiosError = new Error('handle axios error');
    mockedHandleAxiosError.mockImplementation(() => { throw processedAxiosError;});

    await expect(retrieveSlots(regionId, params)).rejects.toThrow(processedAxiosError);

    expect(handleAxiosError).toHaveBeenCalledWith(
      tcnResponseError,
      'RETRIEVE_SLOTS',
      'TCN get request failed',
      KNOWN_SLOTS_ERROR_CODES,
      regionId,
      { testCentreId: params.testCentreId },
    );
  });

  test('throws an generic error if a non-axios error occur when talking to TCN', async () => {
    const error = new Error('Random Error');
    mockedAxios.isAxiosError.mockReturnValue(false);
    mockedAxios.get.mockRejectedValue(error); // Using axios to throw the error as it's mocked already

    await expect(retrieveSlots(regionId, params)).rejects.toThrow(error);

    expect(logger.error).toHaveBeenCalledWith(
      error,
      'RETRIEVE_SLOTS:: TCN get request failed',
      { testCentreId: params.testCentreId },
    );
  });
});
