import dayjs from 'dayjs';
import { TCNRegion } from '../../../src/enums';
import logger from '../../../src/logger';
import { SchedulingError } from '../../../src/utils/scheduling-error';

import SlotsController from '../../../src/slots/slots-controller';

jest.mock('../../../src/services/slots', () => ({
  retrieveSlots: () => ([{
    testCentreId: '123',
    testTypes: ['CAR'],
    startDateTime: '2020-06-29T15:15:00.000Z',
    quantity: 1,
  }, {
    testCentreId: '123',
    testTypes: ['CAR'],
    startDateTime: '2020-06-30T08:00:00.000Z',
    quantity: 2,
  }, {
    testCentreId: '123',
    testTypes: ['CAR'],
    startDateTime: '2020-06-30T09:15:00.000Z',
    quantity: 2,
  }]),
}));

describe('SlotsController', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = {
      req: {
        method: 'GET',
        params: {
          regionId: TCNRegion.A,
          testCentreId: 'Birmingham1',
        },
        query: {
          testTypes: '%5B%22CAR%22%5D',
          dateFrom: dayjs().add(1, 'day').format('YYYY-MM-DD'),
          dateTo: dayjs().add(2, 'day').format('YYYY-MM-DD'),
        },
      },
      res: {},
    };
  });

  afterEach(() => jest.clearAllMocks());

  describe('getSlots', () => {
    test('function handles missing req', async () => {
      delete mockContext.req;

      await expect(SlotsController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.error).toHaveBeenCalled();
    });

    test('function handles empty request parameters', async () => {
      mockContext.req.query = {};

      await expect(SlotsController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.error).toHaveBeenCalled();
    });

    test('good request', async () => {
      const actual = await SlotsController.getSlots(mockContext);

      expect(actual.length).toBe(3);
    });

    test('good request (2)', async () => {
      mockContext.req.params.testTypes = '%5B%22CAR%22,%22MOTORCYCLE%22%5D';

      const actual = await SlotsController.getSlots(mockContext);

      expect(actual.length).toBe(3);
    });

    test('requesting slots for today', async () => {
      mockContext.req.query.dateFrom = dayjs().format('YYYY-MM-DD');
      const actual = await SlotsController.getSlots(mockContext);
      expect(actual.length).toBe(3);
    });

    test('bad region id', async () => {
      mockContext.req.params.regionId = 'z';

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('bad test type (1)', async () => {
      mockContext.req.params.testTypes = "['CAR']";

      await expect(SlotsController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: Unable to parse test types');
    });

    test('bad test type (2)', async () => {
      mockContext.req.params.testTypes = '%5B%22INVALID%22%5D';

      await expect(SlotsController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SCHEDULING::isValidTestTypes: Test types are invalid');
    });

    test('reject if test centre id is too short', async () => {
      mockContext.req.params.testCentreId = ' ';

      await expect(SlotsController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SCHEDULING::isValidTestCentreId: Test centre ID wrong length or not a string');
    });

    test('bad test id (3)', async () => {
      mockContext.req.params.testCentreId = 'really really really long - shouldnt ever be this long in the real data set';

      await expect(SlotsController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SCHEDULING::isValidTestCentreId: Test centre ID wrong length or not a string');
    });

    test('dateFrom not a valid date', async () => {
      mockContext.req.query.dateFrom = '01-01-01';

      await expect(SlotsController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: From date is invalid');
    });

    test('dateTo not a valid date', async () => {
      mockContext.req.query.dateTo = '2020-01-32';

      await expect(SlotsController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: To date is invalid');
    });

    test('dateTo before dateFrom', async () => {
      mockContext.req.query.dateFrom = '2021-01-01';
      mockContext.req.query.dateTo = '2020-01-01';

      await expect(SlotsController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: To date is before from date');
    });

    test('dateFrom is in the past', async () => {
      mockContext.req.query.dateFrom = '2019-01-01';

      await expect(SlotsController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: From date is in the past');
    });

    test('dateFrom is over 6 months away', async () => {
      mockContext.req.query.dateFrom = dayjs().add(1, 'year').format('YYYY-MM-DD');
      mockContext.req.query.dateTo = dayjs().add(1, 'year').add(1, 'day').format('YYYY-MM-DD');

      await expect(SlotsController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: From date is more than 6 months in the future');
    });
  });
});
