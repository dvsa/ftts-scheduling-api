import { Context } from '@azure/functions';
import dayjs from 'dayjs';
import MockDate from 'mockdate';
import { mocked } from 'ts-jest/utils';
import { TCNRegion } from '../../../src/enums';
import { logger } from '../../../src/logger';
import { SchedulingError } from '../../../src/utils/scheduling-error';
import * as slotsService from '../../../src/services/slots';
import { TCNError } from '../../../src/utils/errors';

import SlotsTbController from '../../../src/slots-tb/slots-tb-controller';
import config from '../../../src/config';

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
  let mockContext: Context;
  const mockConfig = mocked(config, true);
  const mockToday = '2021-04-27';
  MockDate.set(mockToday);

  beforeEach(() => {
    // do not expect a preferred date by default
    mockConfig.tcn.preferredDateEnabled.set(TCNRegion.B, false);

    mockContext = {
      req: {
        method: 'GET',
        params: {
          regionId: TCNRegion.B,
          testCentreId: 'Birmingham1',
        },
        query: {
          testTypes: '%5B%22CAR%22%5D',
          dateFrom: dayjs().add(1, 'day').format('YYYY-MM-DD'),
          dateTo: dayjs().add(2, 'day').format('YYYY-MM-DD'),
          preferredDate: dayjs().format('YYYY-MM-DD'),
        },
      },
      res: {},
    } as unknown as Context;
  });

  afterEach(() => jest.clearAllMocks());

  describe('getSlots', () => {
    test('function handles missing req', async () => {
      delete mockContext.req;

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(Error('SLOTS_TB_CONTROLLER::getSlots: Missing context.req'));
      expect(logger.error).toHaveBeenCalled();
    });

    test('function handles empty request parameters', async () => {
      mockContext.req.query = {};

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(Error('SLOTS_TB_CONTROLLER::getSlots: Missing data.testTypes'));
      expect(logger.error).toHaveBeenCalled();
    });

    test('handles missing test types', async () => {
      delete mockContext.req.query.testTypes;

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(Error('SLOTS_TB_CONTROLLER::getSlots: Missing data.testTypes'));
      expect(logger.error).toHaveBeenCalled();
    });

    test('handles missing test centre ID', async () => {
      delete mockContext.req.params.testCentreId;

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(Error('SLOTS_TB_CONTROLLER::getSlots: Missing data.testCentreId'));
      expect(logger.error).toHaveBeenCalled();
    });

    test('handles missing from date', async () => {
      delete mockContext.req.query.dateFrom;

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(Error('SLOTS_TB_CONTROLLER::getSlots: Missing data.dateFrom'));
      expect(logger.error).toHaveBeenCalled();
    });

    test('handles missing to date', async () => {
      delete mockContext.req.query.dateTo;

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(Error('SLOTS_TB_CONTROLLER::getSlots: Missing data.dateTo'));
      expect(logger.error).toHaveBeenCalled();
    });

    test('good request', async () => {
      const actual = await SlotsTbController.getSlots(mockContext);

      expect(actual).toHaveLength(3);
      expect(mockSlotsService.retrieveSlots).toHaveBeenCalledWith(
        TCNRegion.B,
        expect.not.objectContaining({ preferredDate: mockToday }),
      );
    });

    test('good request including preferredDate when accepted by the region', async () => {
      mockConfig.tcn.preferredDateEnabled.set(TCNRegion.B, true);
      const yesterday = '2021-04-26';
      const slotYesterday = `${yesterday}T11:30:00.000Z`;
      const mockRetrieveSlotsWithDateAvailable = mockSlotsService.retrieveSlots.mockResolvedValueOnce([{
        testCentreId: '123',
        testTypes: ['CAR'],
        startDateTime: slotYesterday,
        quantity: 2,
        dateAvailableOnOrBeforePreferredDate: slotYesterday,
      }]);

      const actual = await SlotsTbController.getSlots(mockContext);

      expect(mockRetrieveSlotsWithDateAvailable).toHaveBeenCalledWith(
        TCNRegion.B,
        expect.objectContaining({ preferredDate: mockToday }),
      );
      expect(actual).toHaveLength(1);
      expect(actual[0]).toStrictEqual(expect.objectContaining({
        dateAvailableOnOrBeforePreferredDate: slotYesterday,
      }));
    });

    test('good request with invalid preferred date when not region-enabled', async () => {
      mockContext.req.query.preferredDate = '2021-06-31';

      const actual = await SlotsTbController.getSlots(mockContext);

      expect(mockSlotsService.retrieveSlots).toHaveBeenCalledWith(TCNRegion.B, expect.not.objectContaining({ preferredDate: mockToday }));
      expect(actual).toHaveLength(3);
    });

    test('good request (2)', async () => {
      mockContext.req.params.testTypes = '%5B%22CAR%22,%22MOTORCYCLE%22%5D';

      const actual = await SlotsTbController.getSlots(mockContext);

      expect(actual).toHaveLength(3);
    });

    test('requesting slots for today', async () => {
      mockContext.req.query.dateFrom = dayjs().format('YYYY-MM-DD');

      const actual = await SlotsTbController.getSlots(mockContext);

      expect(actual).toHaveLength(3);
    });

    test('bad region id', async () => {
      mockContext.req.params.regionId = 'z';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('bad test type (1)', async () => {
      mockContext.req.params.testTypes = "['CAR']";

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: Unable to parse test types', { testTypes: mockContext.req.params.testTypes });
    });

    test('bad test type (2)', async () => {
      mockContext.req.params.testTypes = '%5B%22INVALID%22%5D';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SCHEDULING::isValidTestTypes: Test types are invalid');
    });

    test('reject if test centre id is too short', async () => {
      mockContext.req.params.testCentreId = ' ';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: Test centre ID is not a string, is less than 1 or more than 72 characters long', { testCentreId: mockContext.req.params.testCentreId });
    });

    test('bad test id (3)', async () => {
      mockContext.req.params.testCentreId = 'really really really long - shouldnt ever be this long in the real data set';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: Test centre ID is not a string, is less than 1 or more than 72 characters long', { testCentreId: mockContext.req.params.testCentreId });
    });

    test('dateFrom not a valid date', async () => {
      mockContext.req.query.dateFrom = '01-01-01';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: From date is invalid', { dateFrom: mockContext.req.query.dateFrom });
    });

    test('dateTo not a valid date', async () => {
      mockContext.req.query.dateTo = '2020-01-32';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: To date is invalid', { dateTo: mockContext.req.query.dateTo });
    });

    test('dateTo before dateFrom', async () => {
      mockContext.req.query.dateFrom = '2021-01-01';
      mockContext.req.query.dateTo = '2020-01-01';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: To date is before from date', { dateFrom: mockContext.req.query.dateFrom, dateTo: mockContext.req.query.dateTo });
    });

    test('dateFrom is in the past', async () => {
      mockContext.req.query.dateFrom = '2019-01-01';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: From date is in the past', { dateFrom: mockContext.req.query.dateFrom });
    });

    test('dateFrom is over 6 months away', async () => {
      mockContext.req.query.dateFrom = '2021-10-27';
      mockContext.req.query.dateTo = '2021-10-28';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: From date is more than 6 months in the future', { dateFrom: mockContext.req.query.dateFrom });
    });

    test('dateTo is over 6 months away', async () => {
      mockContext.req.query.dateFrom = '2021-10-25';
      mockContext.req.query.dateTo = '2021-10-28';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: To date is more than 6 months in the future', { dateTo: mockContext.req.query.dateTo });
    });

    test('reject if date range is over 5 weeks', async () => {
      mockContext.req.query.dateFrom = dayjs().format('YYYY-MM-DD');
      mockContext.req.query.dateTo = dayjs().add(5, 'week').add(1, 'day').format('YYYY-MM-DD');

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_TB_CONTROLLER::validateRequest: Date range is more than 5 weeks', { dateFrom: mockContext.req.query.dateFrom, dateTo: mockContext.req.query.dateTo });
    });

    test('preferredDate not a valid date when provided and region-enabled', async () => {
      mockConfig.tcn.preferredDateEnabled.set(TCNRegion.B, true);
      mockContext.req.query.preferredDate = '2022-02-29';

      await expect(SlotsTbController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: A preferred date has been provided but is invalid', { preferredDate: mockContext.req.query.preferredDate });
    });

    describe('bulk requests', () => {
      beforeEach(() => {
        mockContext.req.query.dateFrom = dayjs().format('YYYY-MM-DD');
        mockContext.req.query.dateTo = dayjs().add(34, 'day').format('YYYY-MM-DD');
      });

      test('splits request into week-long requests to TCN and combines the results', async () => {
        const actual = await SlotsTbController.getSlots(mockContext);

        expect(mockSlotsService.retrieveSlots).toHaveBeenCalledTimes(5);
        expect(actual).toHaveLength(15);
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
