import { AxiosError } from 'axios';
import { TCNRegion } from '../../../src/enums';
import { ErrorResponse } from '../../../src/interfaces';
import { logTcnError, logTcnEvent } from '../../../src/logger';
import { buildErrorResponse, handleAxiosError, TCNError } from '../../../src/utils/errors';
import { mockTCNErrorResponse } from '../../stubs/tcn';

jest.mock('../../../src/logger');

describe('error', () => {

  afterEach(() => jest.resetAllMocks());

  describe('buildErrorResponse', () => {
    test('error response built correctly', () => {
      // arrange
      const sc = 400;
      const ms = 'Example error';

      // act
      const actual = buildErrorResponse(sc, ms);

      // assert
      expect(actual).toStrictEqual({
        code: 400,
        message: 'Example error',
      });
    });
  });

  describe('handleAxiosError', () => {
    test('correctly, handles an known error code', () => {
      const error = mockTCNErrorResponse(400) as AxiosError<ErrorResponse>;
      const expectedTCNError = new TCNError(400, error.response.data.message);

      expect(() => handleAxiosError(error, 'TEST_FUNCTION', 'custom message', [400], TCNRegion.A, {})).toThrow(expectedTCNError);

      expect(logTcnEvent).toHaveBeenCalledWith(400);
      expect(logTcnError).toHaveBeenCalledWith(
        'TEST_FUNCTION',
        400,
        error,
        'custom message',
        {
          regionId: TCNRegion.A,
          businessIdentifiers: {},
        },
      );
    });

    test('correctly handle a known error code with a retry after header', () => {
      const error = mockTCNErrorResponse(400) as AxiosError<ErrorResponse>;
      error.response.headers = {
        'retry-after': '3600',
      };
      const expectedTCNError = new TCNError(400, error.response.data.message, 3600);

      expect(() => handleAxiosError(error, 'TEST_FUNCTION', 'custom message', [400], TCNRegion.A, {})).toThrow(expectedTCNError);

      expect(logTcnEvent).toHaveBeenCalledWith(400);
      expect(logTcnError).toHaveBeenCalledWith(
        'TEST_FUNCTION',
        400,
        error,
        'custom message',
        {
          regionId: TCNRegion.A,
          businessIdentifiers: {},
          retryAfter: '3600',
        },
      );
    });

    test('correctly handles an unexpcted error code', () => {
      const error = mockTCNErrorResponse(500) as AxiosError<ErrorResponse>;

      expect(() => handleAxiosError(error, 'TEST_FUNCTION', 'custom message', [400], TCNRegion.A, {})).not.toThrow(TCNError);

      expect(logTcnEvent).toHaveBeenCalledWith(500);
      expect(logTcnError).toHaveBeenCalledWith(
        'TEST_FUNCTION',
        500,
        error,
        'custom message',
        {
          regionId: TCNRegion.A,
          businessIdentifiers: {},
        },
      );
    });

    test('can handle error.response being undefined',  () => {
      const error = new Error() as AxiosError<ErrorResponse>;

      expect(() => handleAxiosError(error, 'TEST_FUNCTION', 'custom message', [400], TCNRegion.A, {})).toThrow(error);

      expect(logTcnEvent).toHaveBeenCalledWith(undefined);
      expect(logTcnError).toHaveBeenCalledWith(
        'TEST_FUNCTION',
        undefined,
        error,
        'custom message',
        {
          regionId: TCNRegion.A,
          businessIdentifiers: {},
        },
      );
    });
  });
});
