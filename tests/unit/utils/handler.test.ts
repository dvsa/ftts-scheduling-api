import { Context, HttpRequest } from '@azure/functions';

import * as BookingsController from '../../../src/bookings/bookings-controller';
import { BookingFullResponse, BookingResponse, Reservation } from '../../../src/interfaces';
import * as ReservationsController from '../../../src/reservations/reservations-controller';
import { TCNError } from '../../../src/utils/errors';
import { handler } from '../../../src/utils/handler';
import { SchedulingError } from '../../../src/utils/scheduling-error';

const mockConfirmBooking = jest.spyOn(BookingsController, 'confirmBooking');
const mockDeleteBooking = jest.spyOn(BookingsController, 'deleteBooking');
const mockGetBooking = jest.spyOn(BookingsController, 'getBooking');
const mockPutBooking = jest.spyOn(BookingsController, 'putBooking');

const mockMakeReservation = jest.spyOn(ReservationsController, 'makeReservation');
const mockDeleteReservation = jest.spyOn(ReservationsController, 'deleteReservation');

describe('handler', () => {
  const context = {} as Context;

  beforeEach(() => {
    context.res = {};
    context.done = jest.fn();
  });

  describe('Bookings', () => {
    describe('when called with POST - to confirm a booking', () => {
      test('when successful results in a 200 response with the correct format', async () => {
        const response: BookingResponse[] = [
          {
            reservationId: '1234567890',
            message: 'Success',
            status: '200',
          },
        ];
        mockConfirmBooking.mockResolvedValue(response);

        await handler(context, BookingsController.confirmBooking, 'testing');

        expect(context.res.body).toStrictEqual(response);
      });

      test('handles application errors with the correct response and format', async () => {
        mockConfirmBooking.mockImplementation(() => {
          throw new SchedulingError(400, 'Invalid bookingreferenceId');
        });

        await handler(context, BookingsController.confirmBooking, 'testing');

        expect(context.res.status).toBe(400);
        expect(context.res.body).toStrictEqual({ code: 400, message: 'Invalid bookingreferenceId' });
      });

      test('handles 429 errors with the correct response and format', async () => {
        mockConfirmBooking.mockImplementation(() => {
          throw new TCNError(429, 'Too many requests', 3600);
        });

        await handler(context, BookingsController.confirmBooking, 'testing');

        expect(context.res.status).toBe(429);
        expect(context.res.headers).toStrictEqual({
          'Content-Type': 'application/json',
          'retry-after': 3600,
        });
        expect(context.res.body).toStrictEqual({ code: 429, message: 'Too many requests' });
      });

      test('throws an error when encountering one that is unknown', async () => {
        const error = new Error('Unknown Error');

        mockConfirmBooking.mockImplementation(() => {
          throw error;
        });

        await expect(handler(context, BookingsController.confirmBooking, 'testing')).rejects.toThrow(error);
      });

      test('handles errors with not-numeric code', async () => {
        const error = {
          code: 'ENOTFOUND',
          message: 'not found',
          stack: 'address not found',
          secretPassword: '1234',
          errno: 5678,
          yesterdaysWeather: 'rainy',
          name: 'ENOTFOUND',
        } as Error;

        mockConfirmBooking.mockImplementation(() => {
          throw error;
        });

        await handler(context, BookingsController.confirmBooking, 'testing');

        expect(context.res.status).toBe('500');
        expect(context.res.body).toStrictEqual({
          code: 'ENOTFOUND',
          message: 'not found',
          stack: 'address not found',
          errno: 5678,
        });
      });
    });

    describe('when called with DELETE/GET/PUT', () => {
      describe('DELETE - to release a booking', () => {
        test('when successful results an empty response', async () => {
          context.req = {} as HttpRequest;
          context.req.method = 'DELETE';
          mockDeleteBooking.mockImplementation(() => Promise.resolve());
          await handler(context, BookingsController.deleteBooking, 'testing');

          expect(context.res.body).toBeUndefined();
          expect(context.res.status).toBe(204);
        });

        test('handles application errors with the correct response and format', async () => {
          mockDeleteBooking.mockImplementation(() => {
            throw new SchedulingError(400, 'BOOKING_CONTROLLER::deleteBooking: Missing req.params');
          });

          await handler(context, BookingsController.deleteBooking, 'testing');

          expect(context.res.status).toBe(400);
          expect(context.res.body).toStrictEqual({ code: 400, message: 'BOOKING_CONTROLLER::deleteBooking: Missing req.params' });
        });

        test('handles 429 errors with the correct response and format', async () => {
          mockDeleteBooking.mockImplementation(() => {
            throw new TCNError(429, 'Too many requests', 2800);
          });

          await handler(context, BookingsController.deleteBooking, 'testing');

          expect(context.res.status).toBe(429);
          expect(context.res.headers).toStrictEqual({
            'Content-Type': 'application/json',
            'retry-after': 2800,
          });
          expect(context.res.body).toStrictEqual({ code: 429, message: 'Too many requests' });
        });

        test('throws an error when encountering one that is unknown', async () => {
          const error = new Error('Unknown Error');
          mockDeleteBooking.mockImplementation(() => {
            throw error;
          });

          await expect(handler(context, BookingsController.deleteBooking, 'testing')).rejects.toThrow(error);
        });
      });

      describe('GET - to get booking information', () => {
        test('when successful results in a 200 response with the correct format', async () => {
          const response: BookingFullResponse = {
            bookingReferenceId: '0123456789',
            reservationId: '5050302b-e9f5-476e-b22b-6856a8026e81',
            notes: 'notes',
            behaviouralMarkers: 'candidate behaviour',
            testTypes: ['Car'],
            startDateTime: '2021-10-02T09:15:00+0000',
            testCentreId: 'test-centre',
          };

          mockGetBooking.mockResolvedValue(response);

          await handler(context, BookingsController.getBooking, 'testing');

          expect(context.res.body).toStrictEqual(response);
        });

        test('handles application errors with the correct response and format', async () => {
          mockGetBooking.mockImplementation(() => {
            throw new TCNError(400, 'Unauthorised');
          });

          await handler(context, BookingsController.getBooking, 'testing');

          expect(context.res.status).toBe(400);
          expect(context.res.body).toStrictEqual({ code: 400, message: 'Unauthorised' });
        });

        test('throws an error when encountering one that is unknown', async () => {
          const error = new Error('Unknown Error');
          mockGetBooking.mockImplementation(() => {
            throw error;
          });

          await expect(handler(context, BookingsController.getBooking, 'testing')).rejects.toThrow(error);
        });
      });

      describe('PUT - to update notes or behavioural markers on a booking', () => {
        test('when successful results in a 200 response with the correct format', async () => {
          const response: BookingFullResponse = {
            bookingReferenceId: '0123456789',
            reservationId: '5050302b-e9f5-476e-b22b-6856a8026e81',
            notes: 'notes',
            behaviouralMarkers: 'candidate behaviour',
            testTypes: ['Car'],
            startDateTime: '2021-10-02T09:15:00+0000',
            testCentreId: 'test-centre',
          };

          mockPutBooking.mockResolvedValue(response);

          await handler(context, BookingsController.putBooking, 'testing');

          expect(context.res.body).toStrictEqual(response);
        });

        test('handles application errors with the correct response and format', async () => {
          mockPutBooking.mockImplementation(() => {
            throw new SchedulingError(400, 'Missing req.params');
          });

          await handler(context, BookingsController.putBooking, 'testing');

          expect(context.res.status).toBe(400);
          expect(context.res.body).toStrictEqual({ code: 400, message: 'Missing req.params' });
        });

        test('throws an error when encountering one that is unknown', async () => {
          const error = new Error('Unknown Error');
          mockPutBooking.mockImplementation(() => {
            throw error;
          });

          await expect(handler(context, BookingsController.putBooking, 'testing')).rejects.toThrow(error);
        });
      });
    });
  });

  describe('Reservations', () => {
    describe('when called with POST - to reserve a slot', () => {
      test('results in a 200 response with the correct format when succcesful', async () => {
        const response: Reservation[] = [
          {
            reservationId: '123',
            startDateTime: '2020-07-30T09:00:22+0000',
            testCentreId: '123',
            testTypes: ['Car'],
          },
        ];
        mockMakeReservation.mockResolvedValue(response);

        await handler(context, ReservationsController.makeReservation, 'testing');

        expect(context.res.body).toEqual(response);
      });

      test('handles application errors with the correct response and format', async () => {
        mockMakeReservation.mockImplementation(() => {
          throw new SchedulingError(400, 'Invalid reservations request');
        });

        await handler(context, ReservationsController.makeReservation, 'testing');

        expect(context.res.status).toBe(400);
        expect(context.res.body).toStrictEqual({ code: 400, message: 'Invalid reservations request' });
      });

      test('handles TCN errors with the correct response and format', async () => {
        mockMakeReservation.mockImplementation(() => {
          throw new TCNError(400, 'Unauthorised');
        });

        await handler(context, ReservationsController.makeReservation, 'testing');

        expect(context.res.status).toBe(400);
        expect(context.res.body).toStrictEqual({ code: 400, message: 'Unauthorised' });
      });

      test('throws an error when encountering one that is unknown', async () => {
        const error = new Error('Unknown Error');
        mockMakeReservation.mockImplementation(() => {
          throw error;
        });

        await expect(handler(context, ReservationsController.makeReservation, 'testing')).rejects.toThrow(error);
      });
    });

    describe('when called with DELETE - to release a reserved slot (delete reservation)', () => {
      test('when successful results an empty response', async () => {
        context.req = {} as HttpRequest;
        context.req.method = 'DELETE';
        mockDeleteReservation.mockImplementation(() => Promise.resolve());
        await handler(context, ReservationsController.deleteReservation, 'testing');

        expect(context.res.body).toBeUndefined();
        expect(context.res.status).toBe(204);
      });

      test('handles application errors with the correct response and format', async () => {
        mockDeleteReservation.mockImplementation(() => {
          throw new SchedulingError(400, 'RESERVATIONS_CONTROLLER::deleteReservation: Missing req.params');
        });

        await handler(context, ReservationsController.deleteReservation, 'testing');

        expect(context.res.status).toBe(400);
        expect(context.res.body).toStrictEqual({ code: 400, message: 'RESERVATIONS_CONTROLLER::deleteReservation: Missing req.params' });
      });

      test('throws an error when encountering one that is unknown', async () => {
        const error = new Error('Unknown Error');
        mockDeleteReservation.mockImplementation(() => {
          throw error;
        });

        await expect(handler(context, ReservationsController.deleteReservation, 'testing')).rejects.toThrow(error);
      });
    });
  });
});
