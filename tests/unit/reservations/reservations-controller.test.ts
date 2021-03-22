import dayjs from 'dayjs';

import * as ReservationsController from '../../../src/reservations/reservations-controller';
import logger from '../../../src/logger';
import { ReservationsRequest } from '../../../src/interfaces';
import { SchedulingError } from '../../../src/utils/scheduling-error';
import { TCNRegion } from '../../../src/enums';

jest.mock('../../../src/services/reservations', () => ({
  reserveSlots: () => ([{
    reservationId: '123',
    startDateTime: '2020-07-30T09:00:22+0000',
    testCentreId: '123',
    testTypes: ['Car'],
  }]),
  deleteSlot: () => Promise.resolve(),
}));

describe('ReservationsController', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = {
      req: {
        method: 'POST',
        body: [{
          testCentreId: '123456-123456',
          testTypes: ['CAR'],
          startDateTime: dayjs().add(1, 'day').toISOString(),
          lockTime: 1,
          quantity: 1,
        }],
        params: {
          regionId: TCNRegion.A,
        },
      },
      res: {},
    };
  });

  afterEach(() => jest.clearAllMocks());

  describe('makeReservation', () => {
    describe('succeeds', () => {
      test('given a valid reservations request', async () => {
        const actual = await ReservationsController.makeReservation(mockContext);

        expect(actual).toEqual([{
          reservationId: '123',
          startDateTime: '2020-07-30T09:00:22+0000',
          testCentreId: '123',
          testTypes: ['Car'],
        }]);
      });

      test('given multiple valid reservations', async () => {
        const secondValidReservationsRequest: ReservationsRequest = {
          testCentreId: '123456-123456',
          testTypes: ['MOTORCYCLE'],
          startDateTime: dayjs().add(10, 'day').add(5, 'hour').toISOString(),
          lockTime: 1,
          quantity: 3,
        };
        mockContext.req.body.push(secondValidReservationsRequest);

        await expect(ReservationsController.makeReservation(mockContext)).resolves.not.toThrow();
        expect(logger.error).not.toHaveBeenCalled();
      });
    });

    describe('errors', () => {
      test('with missing req', async () => {
        delete mockContext.req;

        await expect(ReservationsController.makeReservation(mockContext)).rejects.toThrow(SchedulingError);
        expect(logger.error).toHaveBeenCalled();
      });

      test('given an empty body in req', async () => {
        mockContext.req.body = [];

        await expect(ReservationsController.makeReservation(mockContext)).rejects.toThrow(SchedulingError);
        expect(logger.error).toHaveBeenCalled();
      });

      test('given a non-array object body in req', async () => {
        mockContext.req.body = {};

        await expect(ReservationsController.makeReservation(mockContext)).rejects.toThrow(SchedulingError);
        expect(logger.error).toHaveBeenCalled();
      });

      test('given an invalid region id in params', async () => {
        mockContext.req.params.regionId = 'z';

        await expect(ReservationsController.makeReservation(mockContext)).rejects.toThrow(SchedulingError);
      });
    });
  });

  describe('deleteReservation', () => {
    beforeEach(() => {
      mockContext = {
        req: {
          method: 'DELETE',
          params: {
            regionId: TCNRegion.A,
            reservationId: '0123456789',
          },
        },
        res: {},
      };
    });

    describe('succeeds', () => {
      test('given a valid reservation id', async () => {
        await expect(ReservationsController.deleteReservation(mockContext)).resolves.not.toThrow();
      });
    });

    describe('errors', () => {
      test('with missing req', async () => {
        delete mockContext.req;

        await expect(ReservationsController.deleteReservation(mockContext)).rejects.toThrow(SchedulingError);
      });

      test('with missing params in req', async () => {
        delete mockContext.req.params;

        await expect(ReservationsController.deleteReservation(mockContext)).rejects.toThrow(SchedulingError);
      });

      test('given an empty params object in req', async () => {
        mockContext.req.params = {};

        await expect(ReservationsController.deleteReservation(mockContext)).rejects.toThrow(SchedulingError);
      });

      test('given an invalid region id in params', async () => {
        mockContext.req.params.regionId = 'z';

        await expect(ReservationsController.deleteReservation(mockContext)).rejects.toThrow(SchedulingError);
      });

      test('given an invalid reservation id in params', async () => {
        mockContext.req.params.reservationId = 123;

        await expect(ReservationsController.deleteReservation(mockContext)).rejects.toThrow(SchedulingError);
        expect(logger.warn).toHaveBeenCalledWith('RESERVATIONS_CONTROLLER:::validateReservationId: Reservation ID incorrect length or not a string');
      });
    });
  });
});
