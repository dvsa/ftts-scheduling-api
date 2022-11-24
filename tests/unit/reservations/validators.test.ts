import dayjs from 'dayjs';

import { ReservationsRequest } from '../../../src/interfaces';
import { isReservationsRequestValid, validateReservationId } from '../../../src/reservations/validators';
import { SchedulingError } from '../../../src/utils/scheduling-error';
import * as UtilsValidators from '../../../src/utils/validators';

jest.spyOn(UtilsValidators, 'isValidTestCentreId');
jest.spyOn(UtilsValidators, 'isValidTestTypes');

const string72 = 'c'.repeat(72);
const string100 = 'c'.repeat(100);

describe('Reservations validators', () => {
  describe('isReservationsRequestValid', () => {
    let reservationRequest: ReservationsRequest;

    beforeEach(() => {
      reservationRequest = {
        testCentreId: '123456-123456',
        testTypes: ['CAR'],
        startDateTime: dayjs().add(1, 'day').toISOString(),
        lockTime: 1,
        quantity: 1,
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('succesfully validates', () => {
      test('when the request contains valid data', () => {
        expect(isReservationsRequestValid(reservationRequest)).toBe(true);
      });
    });

    describe('returns false', () => {
      test('when called with an empty object', () => {
        expect(isReservationsRequestValid({} as ReservationsRequest)).toBe(false);
      });

      describe('for start date time', () => {
        test('invalid start date time', () => {
          reservationRequest.startDateTime = 'abcdefg';

          expect(isReservationsRequestValid(reservationRequest)).toBe(false);
        });

        test('invalid start date time in past', () => {
          reservationRequest.startDateTime = dayjs().subtract(1, 'day').toISOString();

          expect(isReservationsRequestValid(reservationRequest)).toBe(false);
        });
      });

      describe('for quantity', () => {
        test('when too small', () => {
          reservationRequest.quantity = 0;

          expect(isReservationsRequestValid(reservationRequest)).toBe(false);
        });

        test('when too big', () => {
          reservationRequest.quantity = 513;

          expect(isReservationsRequestValid(reservationRequest)).toBe(false);
        });
      });

      describe('for lockTime', () => {
        test('when too small', () => {
          reservationRequest.lockTime = 0;

          expect(isReservationsRequestValid(reservationRequest)).toBe(false);
        });

        test('when too big', () => {
          reservationRequest.lockTime = 15768001;

          expect(isReservationsRequestValid(reservationRequest)).toBe(false);
        });
      });

      test('when called with an invalid testCentreId', () => {
        reservationRequest.testCentreId = ' ';

        expect(isReservationsRequestValid(reservationRequest)).toBe(false);
        expect(UtilsValidators.isValidTestCentreId).toHaveBeenCalledWith(reservationRequest.testCentreId);
      });

      test('when called with an invalid test type', () => {
        reservationRequest.testTypes = ['Horse'];

        expect(isReservationsRequestValid(reservationRequest)).toBe(false);
        expect(UtilsValidators.isValidTestTypes).toHaveBeenCalledWith(reservationRequest.testTypes);
      });
    });
  });

  describe('validateReservationId', () => {
    let params: { [key: string]: string };

    beforeEach(() => {
      params = {
        reservationId: '0123456789',
      };
    });

    describe('returns a valid reservation id successfully', () => {
      test('when id is 10 characters', () => {
        params.reservationId = '0123456789';

        const result = validateReservationId(params);

        expect(result).toEqual(params.reservationId);
      });

      test('when id is 72 characters', () => {
        params.reservationId = string72;

        const result = validateReservationId(params);

        expect(result).toEqual(params.reservationId);
      });
    });

    describe('throws a Scheduling Error when reservation id is', () => {
      test('not a string', () => {
        params.reservationId = null;

        expect(() => validateReservationId(params)).toThrow(SchedulingError);
      });

      test('less than 10 characters', () => {
        params.reservationId = '123';

        expect(() => validateReservationId(params)).toThrow(SchedulingError);
      });

      test('greater than 72 characters', () => {
        params.reservationId = string100;

        expect(() => validateReservationId(params)).toThrow(SchedulingError);
      });
    });
  });
});
