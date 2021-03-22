import {
  TCNReservationResponse,
  TCNBookingResponse,
  BookingResponse,
  BookingFullResponse,
} from '../../src/interfaces';

export const listPayload = [{
  testCentreId: '123',
  testTypes: [
    'CAR',
  ],
  startDateTime: '2020-06-29T08:15:00.000Z',
  quantity: 1,
},
{
  testCentreId: '123',
  testTypes: [
    'CAR',
  ],
  startDateTime: '2020-06-29T10:15:00.000Z',
  quantity: 5,
},
{
  testCentreId: '123',
  testTypes: [
    'CAR',
  ],
  startDateTime: '2020-06-29T11:45:00.000Z',
  quantity: 2,
},
{
  testCentreId: '123',
  testTypes: [
    'CAR',
  ],
  startDateTime: '2020-06-29T12:15:00.000Z',
  quantity: 4,
},
{
  testCentreId: '123',
  testTypes: [
    'CAR',
  ],
  startDateTime: '2020-06-29T14:15:00.000Z',
  quantity: 5,
},
{
  testCentreId: '123',
  testTypes: [
    'CAR',
  ],
  startDateTime: '2020-06-30T08:00:00.000Z',
  quantity: 5,
}];

export const reservationResponse: TCNReservationResponse = {
  data: [
    {
      reservationId: '123',
      startDateTime: '2020-07-30T09:00:22+0000',
      testCentreId: '123',
      testTypes: ['Car'],
    }]
  ,
};

export const bookingResponse: TCNBookingResponse<BookingResponse[]> = {
  data: [
    {
      reservationId: '1234567890',
      message: 'Success',
      status: '200',
    },
  ],
};

export const fullBookingResponse: TCNBookingResponse<BookingFullResponse> = {
  data: {
    bookingReferenceId: '1234567890',
    notes: 'hello',
    behaviouralMarkers: 'hello',
    reservationId: '5050302b-e9f5-476e-b22b-6856a8026e81',
    testTypes: ['Car'],
    startDateTime: '2021-10-02T09:15:00+0000',
    testCentreId: 'test-centre',
  },
};
