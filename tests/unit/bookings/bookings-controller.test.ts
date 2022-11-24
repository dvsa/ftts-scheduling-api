import { Context } from '@azure/functions';
import * as BookingsController from '../../../src/bookings/bookings-controller';
import { TCNRegion } from '../../../src/enums';
import { BookingFullResponse, BookingRequest } from '../../../src/interfaces';
import { logger } from '../../../src/logger';
import { SchedulingError } from '../../../src/utils/scheduling-error';

const mockFullBookingResponse: BookingFullResponse = {
  bookingReferenceId: '0123456789',
  reservationId: '5050302b-e9f5-476e-b22b-6856a8026e81',
  notes: '',
  behaviouralMarkers: 'Candidate has a behavioural marker',
  testTypes: ['Car'],
  startDateTime: '2021-10-02T09:15:00+0000',
  testCentreId: 'test-centre',
};

let mockContext: Context;

jest.mock('../../../src/services/bookings', () => ({
  confirmBooking: () => ([{
    reservationId: '123456789',
    status: 'mock-status',
    message: 'mock-message',
  }]),
  getBooking: () => (mockFullBookingResponse),
  putBooking: () => (mockFullBookingResponse),
  deleteBooking: () => Promise.resolve(),
}));

describe('confirmBooking', () => {
  beforeEach(() => {
    mockContext = {
      req: {
        method: 'POST',
        body: [{
          bookingReferenceId: '1234567890',
          reservationId: '1234567890',
          notes: '',
          behaviouralMarkers: '',
        }],
        params: {
          regionId: TCNRegion.B,
        },
      },
      res: {},
    } as unknown as Context;
  });

  afterEach(() => jest.clearAllMocks());

  describe('succeeds', () => {
    test('given a valid booking', async () => {
      const actual = await BookingsController.confirmBooking(mockContext);

      expect(actual).toEqual([{
        reservationId: '123456789',
        status: 'mock-status',
        message: 'mock-message',
      }]);
    });

    test('given multiple valid bookings', async () => {
      const secondValidBookingRequest: BookingRequest = {
        bookingReferenceId: '1516171819',
        reservationId: '5050302b-e9f5-476e-b22b-6856a8026e81',
        notes: 'notes',
        behaviouralMarkers: 'behaviour',
      };
      (mockContext.req.body as BookingRequest[]).push(secondValidBookingRequest);

      await expect(BookingsController.confirmBooking(mockContext)).resolves.not.toThrow();
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('errors', () => {
    test('with missing req', async () => {
      delete mockContext.req;

      await expect(BookingsController.confirmBooking(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.error).toHaveBeenCalled();
    });

    test('given an empty body in req', async () => {
      mockContext.req.body = [];

      await expect(BookingsController.confirmBooking(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.error).toHaveBeenCalled();
    });

    test('given a non-array object body in req', async () => {
      mockContext.req.body = {};

      await expect(BookingsController.confirmBooking(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.error).toHaveBeenCalled();
    });

    test('given an invalid region id in params', async () => {
      mockContext.req.params.regionId = 'z';

      await expect(BookingsController.confirmBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('when one of multiple bookings requests is invalid', async () => {
      const invalidBookingRequest: BookingRequest = {
        bookingReferenceId: '0',
        reservationId: '1234567890',
        behaviouralMarkers: '',
        notes: '',
      };
      (mockContext.req.body as BookingRequest[]).push(invalidBookingRequest);

      await expect(BookingsController.confirmBooking(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('BOOKING_CONTROLLER::validateBookingRequest: Booking reference ID wrong length or not a string', { bookingReferenceId: invalidBookingRequest.bookingReferenceId });
    });
  });
});

describe('deleteBooking', () => {
  beforeEach(() => {
    mockContext = {
      req: {
        method: 'DELETE',
        params: {
          regionId: TCNRegion.B,
          bookingReferenceId: '0123456789',
        },
      },
      res: {},
    } as unknown as Context;
  });

  describe('succeeds', () => {
    test('given a valid booking id', async () => {
      await expect(BookingsController.deleteBooking(mockContext)).resolves.not.toThrow();
    });
  });

  describe('errors', () => {
    test('with missing req', async () => {
      delete mockContext.req;

      await expect(BookingsController.deleteBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('with missing params in req', async () => {
      delete mockContext.req.params;

      await expect(BookingsController.deleteBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('given an empty params object in req', async () => {
      mockContext.req.params = {};

      await expect(BookingsController.deleteBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('given an invalid region id in params', async () => {
      mockContext.req.params.regionId = 'z';

      await expect(BookingsController.deleteBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('given an invalid booking reference id in params', async () => {
      mockContext.req.params.bookingReferenceId = 123 as unknown as string;

      await expect(BookingsController.deleteBooking(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('BOOKING_CONTROLLER::validateBookingReferenceId: Booking Reference ID incorrect length or not a string', { bookingReferenceId: mockContext.req.params.bookingReferenceId });
    });
  });
});

describe('getBooking', () => {
  beforeEach(() => {
    mockContext = {
      req: {
        method: 'GET',
        params: {
          regionId: TCNRegion.B,
          bookingReferenceId: '0123456789',
        },
      },
      res: {},
    } as unknown as Context;
  });

  afterEach(() => jest.clearAllMocks());

  describe('succeeds', () => {
    test('given a valid booking id', async () => {
      const result = await BookingsController.getBooking(mockContext);

      expect(result).toEqual(mockFullBookingResponse);
    });
  });

  describe('errors', () => {
    test('with missing req', async () => {
      delete mockContext.req;

      await expect(BookingsController.getBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('with missing params in req', async () => {
      delete mockContext.req.params;

      await expect(BookingsController.getBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('given an empty params object in req', async () => {
      mockContext.req.params = {};

      await expect(BookingsController.getBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('given an invalid region id in params', async () => {
      mockContext.req.params.regionId = 'z';

      await expect(BookingsController.deleteBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('given an invalid booking reference id in params', async () => {
      mockContext.req.params.bookingReferenceId = 123 as unknown as string;

      await expect(BookingsController.getBooking(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('BOOKING_CONTROLLER::validateBookingReferenceId: Booking Reference ID incorrect length or not a string', { bookingReferenceId: mockContext.req.params.bookingReferenceId });
    });
  });
});

describe('putBooking', () => {
  beforeEach(() => {
    mockContext = {
      req: {
        method: 'PUT',
        params: {
          regionId: TCNRegion.B,
          bookingReferenceId: '0123456789',
        },
        body: {
          notes: 'some notes about the candidate',
          behaviouralMarkers: 'candidate behaviour',
        },
      },
      res: {},
    } as unknown as Context;
  });

  afterEach(() => jest.clearAllMocks());

  describe('succeeds', () => {
    test('given a valid booking id and request body', async () => {
      const result = await BookingsController.putBooking(mockContext);

      expect(result).toEqual(mockFullBookingResponse);
    });

    test('given a request body with empty values', async () => {
      (mockContext.req.body as { [k: string]: string }).notes = '';
      (mockContext.req.body as { [k: string]: string }).behaviouralMarkers = '';

      const result = await BookingsController.putBooking(mockContext);

      expect(result).toEqual(mockFullBookingResponse);
    });
  });

  describe('errors', () => {
    test('with missing req', async () => {
      delete mockContext.req;

      await expect(BookingsController.putBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('with missing params in req', async () => {
      delete mockContext.req.params;

      await expect(BookingsController.putBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('given an empty params object in req', async () => {
      mockContext.req.params = {};

      await expect(BookingsController.putBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('with missing body in req', async () => {
      delete mockContext.req.body;

      await expect(BookingsController.putBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('given an invalid region id in params', async () => {
      mockContext.req.params.regionId = 'z';

      await expect(BookingsController.deleteBooking(mockContext)).rejects.toThrow(SchedulingError);
    });

    test('given an invalid booking reference id in params', async () => {
      mockContext.req.params.bookingReferenceId = 123 as unknown as string;

      await expect(BookingsController.putBooking(mockContext)).rejects.toThrow(SchedulingError);
      expect(logger.warn).toHaveBeenCalledWith('BOOKING_CONTROLLER::validateBookingReferenceId: Booking Reference ID incorrect length or not a string', { bookingReferenceId: mockContext.req.params.bookingReferenceId });
    });
  });
});
