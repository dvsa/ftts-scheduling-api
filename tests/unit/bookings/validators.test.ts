import * as validators from '../../../src/bookings/validators';
import { BookingRequest } from '../../../src/interfaces';
import { SchedulingError } from '../../../src/utils/scheduling-error';

const largeString = 'a'.repeat(4100);
const string72 = 'c'.repeat(72);

describe('Bookings validators', () => {
  describe('validateBookingReferenceId', () => {
    let params: { [key: string]: string };
    beforeEach(() => {
      params = {
        bookingReferenceId: '0123456789',
      };
    });

    describe('returns a valid booking reference id successfully', () => {
      test('when id is 10 characters', () => {
        params.bookingReferenceId = '0123456789';

        const result = validators.validateBookingReferenceId(params);

        expect(result).toEqual(params.bookingReferenceId);
      });

      test('when id is 72 characters', () => {
        params.bookingReferenceId = string72;

        const result = validators.validateBookingReferenceId(params);

        expect(result).toEqual(params.bookingReferenceId);
      });
    });

    describe('throws a Scheduling Error', () => {
      test('when booking reference id not a string', () => {
        params.bookingReferenceId = null;

        expect(() => validators.validateBookingReferenceId(params)).toThrow(SchedulingError);
      });

      test('when booking reference id less than 10 characters', () => {
        params.bookingReferenceId = '123';

        expect(() => validators.validateBookingReferenceId(params)).toThrow(SchedulingError);
      });
      test('when booking reference id greater than 72 characters', () => {
        params.bookingReferenceId = 'This string is longer than 72 characters so should throw an exception when used';

        expect(() => validators.validateBookingReferenceId(params)).toThrow(SchedulingError);
      });
    });
  });

  describe('validateBookingRequest', () => {
    let bookingRequest: BookingRequest;
    beforeEach(() => {
      bookingRequest = {
        bookingReferenceId: '1234567890',
        reservationId: '1234567890',
        behaviouralMarkers: '',
        notes: '',
      };
    });
    describe('succesfully validates', () => {
      test('when bookingReferenceId and reservationId on a booking are 10 characters', () => {
        expect(() => validators.validateBookingRequest(bookingRequest)).not.toThrow();
      });

      test('when bookingReferenceId and reservationId on a booking are 72 characters', () => {
        bookingRequest.bookingReferenceId = string72;
        bookingRequest.reservationId = string72;

        expect(() => validators.validateBookingRequest(bookingRequest)).not.toThrow();
      });

      test('when notes and behavioural markers are valid', () => {
        expect(() => validators.validateBookingRequest(bookingRequest)).not.toThrow();
      });
    });

    describe('errors', () => {
      test('when called with an empty object', () => {
        expect(() => validators.validateBookingRequest({} as BookingRequest)).toThrow(SchedulingError);
      });

      test('when multiple booking request parameters are invalid', () => {
        bookingRequest.behaviouralMarkers = largeString;
        bookingRequest.bookingReferenceId = '123';
        delete bookingRequest.reservationId;
        expect(() => validators.validateBookingRequest(bookingRequest)).toThrow(SchedulingError);
      });

      describe('bookingReferenceId and reservationId errors', () => {
        test('when called with an undefined object', () => {
          delete bookingRequest.bookingReferenceId;
          delete bookingRequest.reservationId;

          expect(() => validators.validateBookingRequest(bookingRequest)).toThrow(SchedulingError);
        });

        describe('bookingReferenceId throws a Scheduling Error', () => {
          test('when not a string', () => {
            bookingRequest.bookingReferenceId = null;
            expect(() => validators.validateBookingRequest(bookingRequest)).toThrow(SchedulingError);
          });

          test('when less than 10 characters', () => {
            bookingRequest.bookingReferenceId = '123';

            expect(() => validators.validateBookingRequest(bookingRequest)).toThrow(SchedulingError);
          });
          test('when greater than 72 characters', () => {
            bookingRequest.bookingReferenceId = 'This string is longer than 72 characters so should throw an exception when used';

            expect(() => validators.validateBookingRequest(bookingRequest)).toThrow(SchedulingError);
          });
        });

        describe('reservationId throws a Scheduling Error', () => {
          test('when not a string', () => {
            bookingRequest.reservationId = 100 as unknown as string;

            expect(() => validators.validateBookingRequest(bookingRequest)).toThrow(SchedulingError);
          });
          test('when less than 10 characters', () => {
            bookingRequest.reservationId = '0';

            expect(() => validators.validateBookingRequest(bookingRequest)).toThrow(SchedulingError);
          });
          test('when greater than 72 characters', () => {
            bookingRequest.reservationId = 'This string is longer than 72 characters so should throw an exception when used';

            expect(() => validators.validateBookingRequest(bookingRequest)).toThrow(SchedulingError);
          });
        });
      });
    });
  });
});
