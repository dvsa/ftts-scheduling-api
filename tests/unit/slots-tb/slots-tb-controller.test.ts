import dayjs from 'dayjs';
import { TCNRegion } from '../../../src/enums';
import logger from '../../../src/logger';
import { SchedulingError } from '../../../src/utils/scheduling-error';
import * as slotsService from '../../../src/services/slots';
import { TCNError } from '../../../src/utils/errors';

import SlotsTbController from '../../../src/slots-tb/slots-tb-controller';

jest.mock('../../../src/services/slots', () => ({
  retrieveSlots: jest.fn(() => ([{
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
  }])),
}));

const mockSlotsService = slotsService as jest.Mocked<typeof slotsService>;

describe('SlotsTbController', () => {
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

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.error).toHaveBeenCalled();
    });

    test('function handles empty request parameters', async () => {
      mockContext.req.query = {};

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.error).toHaveBeenCalled();
    });

    test('good request', async () => {
      const actual = await SlotsTbController.getSlots(mockContext);

      expect(actual.length).toBe(3);
    });

    test('good request (2)', async () => {
      mockContext.req.params.testTypes = '%5B%22CAR%22,%22MOTORCYCLE%22%5D';

      const actual = await SlotsTbController.getSlots(mockContext);

      expect(actual.length).toBe(3);
    });

    test('requesting slots for today', async () => {
      mockContext.req.query.dateFrom = dayjs().format('YYYY-MM-DD');

      const actual = await SlotsTbController.getSlots(mockContext);

      expect(actual.length).toBe(3);
    });

    test('bad region id', async () => {
      mockContext.req.params.regionId = 'z';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('bad test type (1)', async () => {
      mockContext.req.params.testTypes = "['CAR']";

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: Unable to parse test types');
    });

    test('bad test type (2)', async () => {
      mockContext.req.params.testTypes = '%5B%22INVALID%22%5D';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SCHEDULING::isValidTestTypes: Test types are invalid');
    });

    test('reject if test centre id is too short', async () => {
      mockContext.req.params.testCentreId = ' ';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SCHEDULING::isValidTestCentreId: Test centre ID wrong length or not a string');
    });

    test('bad test id (3)', async () => {
      mockContext.req.params.testCentreId = 'really really really long - shouldnt ever be this long in the real data set';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SCHEDULING::isValidTestCentreId: Test centre ID wrong length or not a string');
    });

    test('dateFrom not a valid date', async () => {
      mockContext.req.query.dateFrom = '01-01-01';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: From date is invalid');
    });

    test('dateTo not a valid date', async () => {
      mockContext.req.query.dateTo = '2020-01-32';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: To date is invalid');
    });

    test('dateTo before dateFrom', async () => {
      mockContext.req.query.dateFrom = '2021-01-01';
      mockContext.req.query.dateTo = '2020-01-01';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: To date is before from date');
    });

    test('dateFrom is in the past', async () => {
      mockContext.req.query.dateFrom = '2019-01-01';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: From date is in the past');
    });

    test('dateFrom is over 6 months away', async () => {
      mockContext.req.query.dateFrom = dayjs().add(1, 'year').format('YYYY-MM-DD');
      mockContext.req.query.dateTo = dayjs().add(1, 'year').add(1, 'day').format('YYYY-MM-DD');

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: From date is more than 6 months in the future');
    });

    test('reject if date range is over 5 weeks', async () => {
      mockContext.req.query.dateFrom = dayjs().format('YYYY-MM-DD');
      mockContext.req.query.dateTo = dayjs().add(5, 'week').add(1, 'day').format('YYYY-MM-DD');

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toStrictEqual({
        code: 400,
        message: 'Bad Request - validation failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: Date range is more than 5 weeks');
    });

    describe('bulk requests', () => {
      beforeEach(() => {
        mockContext.req.query.dateFrom = dayjs().format('YYYY-MM-DD');
        mockContext.req.query.dateTo = dayjs().add(34, 'day').format('YYYY-MM-DD');
      });

      test('splits request into week-long requests to TCN and combines the results', async () => {
        const actual = await SlotsTbController.getSlots(mockContext);

        expect(mockSlotsService.retrieveSlots).toHaveBeenCalledTimes(5);
        expect(actual.length).toBe(15);
      });

      test('fails fast if any one of the TCN requests fails', async () => {
        const mockTCNError = new TCNError(500, 'TCN Server Error');
        mockSlotsService.retrieveSlots.mockResolvedValueOnce([]);
        mockSlotsService.retrieveSlots.mockRejectedValueOnce(mockTCNError);

        await expect(SlotsTbController.getSlots(mockContext)).rejects.toBe(mockTCNError);
      });
    });
  });
});
