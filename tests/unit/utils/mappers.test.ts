import { Slot } from '../../../src/interfaces';
import { getBookingReferenceIdFromReservationId, getMissingBookingReferenceIds, removeKpiData } from '../../../src/utils/mappers';

describe('mappers', () => {
  test('remove kpi data from slots', () => {
    const slots: Slot[] = [
      {
        testCentreId: 'testCentreId',
        testTypes: ['CAR'],
        startDateTime: '2018-10-28T00:00:00.000Z',
        quantity: 1,
        dateAvailableOnOrBeforePreferredDate: '2018-10-28T00:00:00.000Z',
        dateAvailableOnOrAfterPreferredDate: '2018-10-28T00:00:00.000Z',
        dateAvailableOnOrAfterToday: '2018-10-28T00:00:00.000Z',
      },
    ];

    const result = removeKpiData(slots);

    expect(result).toStrictEqual([{
      testCentreId: 'testCentreId',
      testTypes: ['CAR'],
      startDateTime: '2018-10-28T00:00:00.000Z',
      quantity: 1,
    }]);
  });

  describe('getMissingBookingReferenceIds', () => {
    test('getMissingBookingReferenceIds', () => {
      const bookingRequests = [
        {
          bookingReferenceId: 'bookingReservationId111',
          reservationId: 'reservationId111',
          notes: '',
          behaviouralMarkers: '',
        },
        {
          bookingReferenceId: 'bookingReservationId222',
          reservationId: 'reservationId222',
          notes: '',
          behaviouralMarkers: '',
        },
        {
          bookingReferenceId: 'bookingReservationId333',
          reservationId: 'reservationId333',
          notes: '',
          behaviouralMarkers: '',
        },
      ];
      const bookingResponses = [
        {
          reservationId: 'reservationId111',
          status: '200',
          message: 'success',
        },
        {
          reservationId: 'reservationId222',
          status: '400',
          message: 'invalid',
        },
      ];

      const missingBookingReferenceIds = getMissingBookingReferenceIds(bookingRequests, bookingResponses);

      expect(missingBookingReferenceIds).toStrictEqual(['bookingReservationId222', 'bookingReservationId333']);
    });
  });

  describe('getBookingReferenceIdFromReservationId', () => {
    test('retrieve booking reference id from reservation id', () => {
      const bookingRequests = [
        {
          bookingReferenceId: 'bookingReferenceId111',
          reservationId: 'reservationId111',
          notes: '',
          behaviouralMarkers: '',
        },
        {
          bookingReferenceId: 'bookingReferenceId222',
          reservationId: 'reservationId222',
          notes: '',
          behaviouralMarkers: '',
        },
        {
          bookingReferenceId: 'bookingReferenceId333',
          reservationId: 'reservationId333',
          notes: '',
          behaviouralMarkers: '',
        },
      ];

      const result = getBookingReferenceIdFromReservationId('reservationId111', bookingRequests);

      expect(result).toBe('bookingReferenceId111');
    });

    test('returns undefined if reference id cannot be found from reservation id', () => {
      const bookingRequests = [
        {
          bookingReferenceId: 'bookingReferenceId111',
          reservationId: 'reservationId111',
          notes: '',
          behaviouralMarkers: '',
        },
        {
          bookingReferenceId: 'bookingReferenceId222',
          reservationId: 'reservationId222',
          notes: '',
          behaviouralMarkers: '',
        },
        {
          bookingReferenceId: 'bookingReferenceId333',
          reservationId: 'reservationId333',
          notes: '',
          behaviouralMarkers: '',
        },
      ];

      const result = getBookingReferenceIdFromReservationId('unknownReservationId', bookingRequests);

      expect(result).toBeUndefined();
    });
  });
});
