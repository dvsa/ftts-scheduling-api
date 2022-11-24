import { Context } from '@azure/functions';
import dayjs from 'dayjs';
import MockDate from 'mockdate';
import { mocked } from 'ts-jest/utils';
import { TCNRegion } from '../../../src/enums';
import { logger } from '../../../src/logger';
import { SchedulingError } from '../../../src/utils/scheduling-error';
import SlotsController from '../../../src/slots/slots-controller';
import * as Slots from '../../../src/services/slots';
import config from '../../../src/config';

const retrieveSlotsSpy = jest.spyOn(Slots, 'retrieveSlots');

describe('SlotsController', () => {
  let mockContext: Context;
  let mockRetrieveSlots;
  const mockConfig = mocked(config, true);

  const mockToday = '2021-04-27';
  MockDate.set(mockToday);

  beforeEach(() => {
    // do not expect a preferred date by default
    mockConfig.tcn.preferredDateEnabled.set(TCNRegion.A, false);

    mockRetrieveSlots = retrieveSlotsSpy.mockResolvedValue([{
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
    }]);

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

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(Error('SLOTS_CONTROLLER::getSlots: Missing context.req'));
      expect(logger.error).toHaveBeenCalled();
    });

    test('function handles empty request parameters', async () => {
      mockContext.req.query = {};

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(Error('SLOTS_CONTROLLER::getSlots: Missing data.testTypes'));
      expect(logger.error).toHaveBeenCalled();
    });

    test('handles missing test types', async () => {
      delete mockContext.req.query.testTypes;

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(Error('SLOTS_CONTROLLER::getSlots: Missing data.testTypes'));
      expect(logger.error).toHaveBeenCalled();
    });

    test('handles missing test centre ID', async () => {
      delete mockContext.req.params.testCentreId;

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(Error('SLOTS_CONTROLLER::getSlots: Missing data.testCentreId'));
      expect(logger.error).toHaveBeenCalled();
    });

    test('handles missing from date', async () => {
      delete mockContext.req.query.dateFrom;

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(Error('SLOTS_CONTROLLER::getSlots: Missing data.dateFrom'));
      expect(logger.error).toHaveBeenCalled();
    });

    test('handles missing to date', async () => {
      delete mockContext.req.query.dateTo;

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(Error('SLOTS_CONTROLLER::getSlots: Missing data.dateTo'));
      expect(logger.error).toHaveBeenCalled();
    });

    test('good request', async () => {
      const actual = await SlotsController.getSlots(mockContext);

      expect(mockRetrieveSlots).toHaveBeenCalledWith(TCNRegion.A, expect.not.objectContaining({ preferredDate: mockToday }));
      expect(actual).toHaveLength(3);
    });

    test('good request including preferredDate when accepted by the region', async () => {
      mockConfig.tcn.preferredDateEnabled.set(TCNRegion.A, true);
      const slotToday = `${mockToday}T10:30:00.000Z`;
      const mockRetrieveSlotsWithDateAvailable = retrieveSlotsSpy.mockResolvedValue([{
        testCentreId: '123',
        testTypes: ['CAR'],
        startDateTime: slotToday,
        quantity: 2,
        dateAvailableOnOrAfterToday: slotToday,
        dateAvailableOnOrBeforePreferredDate: slotToday,
      }]);

      const actual = await SlotsController.getSlots(mockContext);

      expect(mockRetrieveSlotsWithDateAvailable).toHaveBeenCalledWith(
        TCNRegion.A,
        expect.objectContaining({ preferredDate: mockToday }),
      );
      expect(actual).toHaveLength(1);
      expect(actual[0]).toStrictEqual(expect.objectContaining({
        dateAvailableOnOrAfterToday: slotToday,
        dateAvailableOnOrBeforePreferredDate: slotToday,
      }));
    });

    test('good request with invalid preferred date when not region-enabled', async () => {
      mockContext.req.query.preferredDate = '2021-04-31';

      const actual = await SlotsController.getSlots(mockContext);

      expect(mockRetrieveSlots).toHaveBeenCalledWith(TCNRegion.A, expect.not.objectContaining({ preferredDate: mockToday }));
      expect(actual).toHaveLength(3);
    });

    test('good request (2)', async () => {
      mockContext.req.params.testTypes = '%5B%22CAR%22,%22MOTORCYCLE%22%5D';

      const actual = await SlotsController.getSlots(mockContext);

      expect(mockRetrieveSlots).toHaveBeenCalledWith(TCNRegion.A, expect.not.objectContaining({ preferredDate: mockToday }));
      expect(actual).toHaveLength(3);
    });

    test('requesting slots for today', async () => {
      mockContext.req.query.dateFrom = dayjs().format('YYYY-MM-DD');
      const actual = await SlotsController.getSlots(mockContext);
      expect(actual).toHaveLength(3);
    });

    test('bad region id', async () => {
      mockContext.req.params.regionId = 'z';

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('bad test type (1)', async () => {
      mockContext.req.params.testTypes = "['CAR']";

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: Unable to parse test types', { testTypes: mockContext.req.params.testTypes });
    });

    test('bad test type (2)', async () => {
      mockContext.req.params.testTypes = '%5B%22INVALID%22%5D';

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SCHEDULING::isValidTestTypes: Test types are invalid');
    });

    test('reject if test centre id is too short', async () => {
      mockContext.req.params.testCentreId = ' ';

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: Test centre ID is not a string, is less than 1 or more than 72 characters long', { testCentreId: mockContext.req.params.testCentreId });
    });

    test('bad test id (3)', async () => {
      mockContext.req.params.testCentreId = 'really really really long - shouldnt ever be this long in the real data set';

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: Test centre ID is not a string, is less than 1 or more than 72 characters long', { testCentreId: mockContext.req.params.testCentreId });
    });

    test('dateFrom not a valid date', async () => {
      mockContext.req.query.dateFrom = '01-01-01';

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: From date is invalid', { dateFrom: mockContext.req.query.dateFrom });
    });

    test('dateTo not a valid date', async () => {
      mockContext.req.query.dateTo = '2020-01-32';

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: To date is invalid', { dateTo: mockContext.req.query.dateTo });
    });

    test('dateTo before dateFrom', async () => {
      mockContext.req.query.dateFrom = '2021-01-01';
      mockContext.req.query.dateTo = '2020-01-01';

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: To date is before from date', { dateFrom: mockContext.req.query.dateFrom, dateTo: mockContext.req.query.dateTo });
    });

    test('dateFrom is in the past', async () => {
      mockContext.req.query.dateFrom = '2019-01-01';

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: From date is in the past', { dateFrom: mockContext.req.query.dateFrom });
    });

    test('dateFrom is over 6 months away', async () => {
      mockContext.req.query.dateFrom = '2021-10-27';
      mockContext.req.query.dateTo = '2021-10-28';

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: From date is more than 6 months in the future', { dateFrom: mockContext.req.query.dateFrom });
    });

    test('dateTo is over 6 months away', async () => {
      mockContext.req.query.dateFrom = '2021-10-25';
      mockContext.req.query.dateTo = '2021-10-28';

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: To date is more than 6 months in the future', { dateTo: mockContext.req.query.dateTo });
    });

    test('preferredDate not a valid date when provided and region-enabled', async () => {
      mockConfig.tcn.preferredDateEnabled.set(TCNRegion.A, true);
      mockContext.req.query.preferredDate = '2021-02-29';

      await expect(SlotsController.getSlots(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('SLOTS_CONTROLLER::validateRequest: A preferred date has been provided but is invalid', { preferredDate: mockContext.req.query.preferredDate });
    });
  });
});
